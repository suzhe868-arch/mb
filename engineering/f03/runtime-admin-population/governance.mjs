// F03-2-2B isolated internal System Admin control only. No production routes.
import {verify} from './migration.mjs';
const outcome=(code,changed=false)=>Object.freeze({code,changed});
const deny=code=>outcome(code||'ADMIN_POPULATION_DENIED');
const validTarget=x=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).sort().join(',')==='action,targetSystemAdminId'&&['deactivate','disableCredential'].includes(x.action)&&Number.isSafeInteger(x.targetSystemAdminId)&&x.targetSystemAdminId>0;
const allowedCheckpoint=fn=>fn===undefined||(process.env.CI==='true'&&process.env.GITHUB_ACTIONS==='true'&&typeof fn==='function');
const liveCounts=async c=>{
 const [a,b]=await Promise.all([
  c.query("SELECT count(*)::integer n FROM public.system_admins WHERE account_status='active'"),
  c.query("SELECT count(DISTINCT s.system_admin_id)::integer n FROM public.system_admins s JOIN public.pc_login_accounts a ON a.system_admin_id=s.system_admin_id AND a.principal_kind='system_admin' WHERE s.account_status='active' AND a.credential_state='enabled' AND a.password_hash ~ '^scrypt\\$v1\\$32768\\$8\\$3\\$[A-Za-z0-9_-]{22}\\$[A-Za-z0-9_-]{43}$'")
 ]);
 return {active:a.rows[0].n,login:b.rows[0].n};
};
export async function changeAdminPopulation(auth,actorToken,proposal,{testCheckpoint}={}){
 if(!validTarget(proposal)||!allowedCheckpoint(testCheckpoint))return deny();
 let last;
 for(let attempt=0;attempt<4;attempt++){
  try{
   const client=await auth.pool.connect();
   try{await verify(client)}finally{client.release()}
   const result=await auth.withSession(actorToken,async(c,actor,session)=>{
    if(session.restricted||actor.principal_kind!=='system_admin'||actor.credential_state!=='enabled'||actor.subject_status!=='active'||actor.system_admin_id===null||actor.employee_id!==null||actor.force_password_change)return deny();
    const guard=(await c.query("SELECT guard_name,version FROM public.governance_population_guards WHERE guard_name='system_admin' FOR UPDATE")).rows;
    if(guard.length!==1)return deny();
    const target=(await c.query('SELECT system_admin_id,account_status FROM public.system_admins WHERE system_admin_id=$1 FOR UPDATE',[proposal.targetSystemAdminId])).rows[0];
    if(!target)return deny();
    const creds=(await c.query("SELECT account_id,credential_state,credential_epoch FROM public.pc_login_accounts WHERE system_admin_id=$1 AND principal_kind='system_admin' ORDER BY account_id FOR UPDATE",[proposal.targetSystemAdminId])).rows;
    if(creds.length!==1)return deny();
    const a=creds[0];
    if(proposal.action==='deactivate'&&target.account_status==='inactive'&&a.credential_state==='disabled')return outcome('ADMIN_ALREADY_INACTIVE');
    if(proposal.action==='disableCredential'&&a.credential_state==='disabled')return outcome('ADMIN_CREDENTIAL_ALREADY_DISABLED');
    if(proposal.action==='disableCredential'&&target.account_status!=='active')return deny();
    const before={status:target.account_status,credential:a.credential_state,epoch:Number(a.credential_epoch)};
    if(proposal.action==='deactivate'){
     await c.query("UPDATE public.system_admins SET account_status='inactive' WHERE system_admin_id=$1",[proposal.targetSystemAdminId]);
    }
    await c.query("UPDATE public.pc_login_accounts SET credential_state='disabled',credential_epoch=credential_epoch+1,updated_at=transaction_timestamp() WHERE account_id=$1",[a.account_id]);
    if(testCheckpoint)await testCheckpoint('after_change',c);
    const population=await liveCounts(c);
    if(population.active<1)throw Error('F03_2B_LAST_ACTIVE_DENY');
    if(population.login<1)throw Error('F03_2B_LAST_LOGIN_DENY');
    await c.query('UPDATE public.pc_auth_sessions SET revoked_at=COALESCE(revoked_at,transaction_timestamp()) WHERE account_id=$1',[a.account_id]);
    if(testCheckpoint)await testCheckpoint('after_revocation',c);
    await c.query("INSERT INTO public.audit_events(actor_kind,actor_id,role_context,object_kind,object_id,action,before_json,after_json,occurred_at) VALUES('system_admin',$1,$2::jsonb,'system_admin',$3,$4,$5::jsonb,$6::jsonb,transaction_timestamp())",[
     String(actor.system_admin_id),JSON.stringify({principal_kind:'system_admin',employee_role:null}),String(target.system_admin_id),
     proposal.action==='deactivate'?'system_admin.deactivate':'system_admin.disable_credential',
     JSON.stringify(before),JSON.stringify({status:proposal.action==='deactivate'?'inactive':target.account_status,credential:'disabled',epoch:Number(a.credential_epoch)+1})
    ]);
    if(testCheckpoint)await testCheckpoint('after_audit',c);
    await c.query("UPDATE public.governance_population_guards SET version=version+1 WHERE guard_name='system_admin'");
    if(testCheckpoint)await testCheckpoint('before_commit',c);
    const final=await liveCounts(c);
    if(final.active<1||final.login<1)throw Error('F03_2B_COMMIT_POPULATION_DENIED');
    return outcome('ADMIN_POPULATION_UPDATED',true);
   },{normalOnly:true});
   return result??deny();
  }catch(e){
   if(['40P01','40001'].includes(e.code)&&attempt<3){last=e;continue}
   if(/^F03_2B_LAST_|^F03_2B_COMMIT_/.test(e.message))return deny(e.message);
   throw e;
  }
 }
 throw last||Error('F03_2B_RETRY_EXHAUSTED');
}
