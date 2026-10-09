// SG03: CI-only internal transactions. No business HTTP, owner assignment or team impersonation.
import {verify} from './migration.mjs';
const allowedRole=x=>['sales','manager','store_head'].includes(x);
const response=(code,changed=false)=>Object.freeze({code,changed});
const deny=code=>response(code||'RECEIVING_POOL_DENIED');
const validAdmin=x=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).sort().join(',')==='eligible,employeeId'&&typeof x.eligible==='boolean'&&Number.isSafeInteger(x.employeeId)&&x.employeeId>0;
const validSelf=x=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).sort().join(',')==='accepting,employeeId'&&typeof x.accepting==='boolean'&&Number.isSafeInteger(x.employeeId)&&x.employeeId>0;
const checkFault=checkpoint=>checkpoint===undefined||(process.env.CI==='true'&&process.env.GITHUB_ACTIONS==='true'&&typeof checkpoint==='function');
async function qualified(c){
 const q=await c.query("SELECT count(*)::integer n FROM public.employees e JOIN public.roles r ON r.role_id=e.main_role_id JOIN public.employee_receiving_eligibility v ON v.employee_id=e.employee_id WHERE e.employment_status='active' AND e.receiving_status='receiving' AND v.eligible=true AND r.role_code IN ('sales','manager','store_head')");
 return q.rows[0].n;
}
export async function reportPool(c){
 const n=await qualified(c);return Object.freeze({receivers:n,empty:n===0,ownerAssignmentPendingDomain:'DEFER_F04_SG06',noFallbackAdmin:true});
}
async function call(auth,token,proposal,admin,{testCheckpoint}={}){
 if(!(admin?validAdmin(proposal):validSelf(proposal))||!checkFault(testCheckpoint))return deny();
 for(let attempt=0;attempt<3;attempt++){
  try{
   const c=await auth.pool.connect();try{await verify(c)}finally{c.release()}
   const result=await auth.withSession(token,async(c,actor,session)=>{
    if(session.restricted||actor.credential_state!=='enabled'||actor.subject_status!=='active'||actor.force_password_change)return deny();
    if(admin){
     if(actor.principal_kind!=='system_admin'||actor.employee_id!==null||actor.system_admin_id===null)return deny();
    }else{
     if(actor.principal_kind!=='employee'||actor.system_admin_id!==null||actor.employee_id!==proposal.employeeId||!allowedRole(actor.role_code))return deny();
    }
    const guard=(await c.query("SELECT version FROM public.receiving_pool_guards WHERE guard_name='receiving_pool' FOR UPDATE")).rows;
    if(guard.length!==1)return deny();
    // All SG03 mutations take the same lock BEFORE taking any target Employee or eligibility lock.
    const target=(await c.query("SELECT e.employee_id,e.employment_status,e.receiving_status,e.main_role_id,r.role_code FROM public.employees e LEFT JOIN public.roles r ON r.role_id=e.main_role_id WHERE e.employee_id=$1 FOR UPDATE OF e",[proposal.employeeId])).rows[0];
    if(!target||target.employment_status!=='active'||!allowedRole(target.role_code))return deny();
    if(!admin&&Number(target.employee_id)!==Number(actor.employee_id))return deny();
    const old=(await c.query('SELECT eligible,version FROM public.employee_receiving_eligibility WHERE employee_id=$1 FOR UPDATE',[proposal.employeeId])).rows[0];
    if(!admin&&old?.eligible!==true)return deny('RECEIVING_NOT_ELIGIBLE');
    const pre=await qualified(c),before={eligible:old?.eligible??false,receiving_status:target.receiving_status};
    if(admin){
     if((old?.eligible??false)===proposal.eligible)return response('ELIGIBILITY_UNCHANGED');
     if(old)await c.query('UPDATE public.employee_receiving_eligibility SET eligible=$2,version=version+1,decided_at=transaction_timestamp(),decided_by_system_admin_id=$3 WHERE employee_id=$1',[proposal.employeeId,proposal.eligible,actor.system_admin_id]);
     else await c.query('INSERT INTO public.employee_receiving_eligibility(employee_id,eligible,version,decided_at,decided_by_system_admin_id) VALUES($1,$2,1,transaction_timestamp(),$3)',[proposal.employeeId,proposal.eligible,actor.system_admin_id]);
    }else{
     const next=proposal.accepting?'receiving':'paused'; // exact frozen F03-1 fixture states, no new enum.
     if(!['receiving','paused'].includes(target.receiving_status))return deny('RECEIVING_STATE_UNKNOWN');
     if(target.receiving_status===next)return response('RECEIVING_UNCHANGED');
     await c.query('UPDATE public.employees SET receiving_status=$2 WHERE employee_id=$1',[proposal.employeeId,next]);
    }
    if(testCheckpoint)await testCheckpoint('after_current',c);
    const post=await qualified(c);
    if(pre>0&&post===0)throw Error('F03_2C_LAST_RECEIVER_DENY');
    const still=(await c.query("SELECT e.employment_status,e.receiving_status,r.role_code,v.eligible FROM public.employees e LEFT JOIN public.roles r ON r.role_id=e.main_role_id LEFT JOIN public.employee_receiving_eligibility v ON v.employee_id=e.employee_id WHERE e.employee_id=$1",[proposal.employeeId])).rows[0];
    if(still?.employment_status!=='active'||!allowedRole(still.role_code)||(admin?false:still.eligible!==true))throw Error('F03_2C_COMMIT_FACT_DENY');
    if(testCheckpoint)await testCheckpoint('after_count',c);
    const action=admin?'receiving_eligibility.'+(proposal.eligible?'grant':'revoke'):'receiving_state.'+(proposal.accepting?'on':'off');
    await c.query("INSERT INTO public.audit_events(actor_kind,actor_id,role_context,object_kind,object_id,action,before_json,after_json,occurred_at) VALUES($1,$2,$3::jsonb,'employee_receiving',$4,$5,$6::jsonb,$7::jsonb,transaction_timestamp())",[
     actor.principal_kind,String(admin?actor.system_admin_id:actor.employee_id),JSON.stringify({principal_kind:actor.principal_kind,employee_business_admin:false}),String(proposal.employeeId),action,JSON.stringify(before),
     JSON.stringify({eligible:admin?proposal.eligible:old?.eligible,receiving_status:admin?target.receiving_status:(proposal.accepting?'receiving':'paused')})
    ]);
    if(testCheckpoint)await testCheckpoint('after_audit',c);
    await c.query("UPDATE public.receiving_pool_guards SET version=version+1 WHERE guard_name='receiving_pool'");
    if(testCheckpoint)await testCheckpoint('before_commit',c);
    const final=await qualified(c);
    if(pre>0&&final===0)throw Error('F03_2C_COMMIT_EMPTY_DENY');
    return response(admin?'ELIGIBILITY_UPDATED':'RECEIVING_UPDATED',true);
   },{normalOnly:true});
   return result??deny();
  }catch(e){
   if(['40P01','40001'].includes(e.code)&&attempt<2)continue;
   if(/^F03_2C_LAST_|^F03_2C_COMMIT_/.test(e.message))return deny(e.message);
   throw e;
  }
 }
 return deny('F03_2C_RETRY_LIMIT');
}
export async function setEmployeeEligibility(auth,token,proposal,opts){return call(auth,token,proposal,true,opts)}
export async function changeOwnReceiving(auth,token,proposal,opts){return call(auth,token,proposal,false,opts)}
