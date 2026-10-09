// F03-2-2A: isolated PG16 internal template enable ONLY.
// No HTTP route, no other role/permission, no disable/downgrade, no phone mutation.
import {verifyScopeDatabase} from '../runtime-scope/readiness.mjs';
const outcome=(code,changed=false)=>Object.freeze({code,changed});
const denied=()=>outcome('TEMPLATE_ENABLE_DENIED');
const preciseTarget=x=>x&&typeof x==='object'&&!Array.isArray(x)&&
 Object.keys(x).sort().join(',')==='enabled,permissionCode,roleCode'&&
 x.roleCode==='sales'&&x.permissionCode==='customer.phone.manage'&&x.enabled===true;

// Optional internal CI failure-injection callback; never attach to user-input or routes.
export async function enableApprovedTemplate(auth,sessionToken,target,{testCheckpoint}={}){
 if(!preciseTarget(target))return denied();
 if(testCheckpoint!==undefined&&
    (process.env.CI!=='true'||process.env.GITHUB_ACTIONS!=='true'||typeof testCheckpoint!=='function'))
  throw Error('F03_2_2A_CI_CHECKPOINT_FORBIDDEN');
 // Refuse any schema/CI-seal drift BEFORE touching authority or history.
 await verifyScopeDatabase(auth.pool);
 const value=await auth.withSession(sessionToken,async(c,actor,session)=>{
  if(session.restricted||actor.principal_kind!=='system_admin'||
     actor.credential_state!=='enabled'||actor.subject_status!=='active'||
     actor.employee_id!==null||actor.system_admin_id===null)return denied();
  // This row lock makes a concurrent admin inactive mutation wait until our commit.
  const admins=(await c.query(
   "SELECT account_status FROM public.system_admins WHERE system_admin_id=$1 FOR SHARE",
   [actor.system_admin_id])).rows;
  if(admins.length!==1||admins[0].account_status!=='active')return denied();
  // Lock the EXISTING role even if the template pair does not yet exist;
  // SELECT FOR UPDATE on a missing template row would not serialize insertion.
  const roles=(await c.query(
   "SELECT role_id FROM public.roles WHERE role_code='sales' FOR UPDATE")).rows;
  if(roles.length!==1)return denied();
  const roleId=roles[0].role_id;
  const perms=(await c.query(
   "SELECT permission_id FROM public.permissions WHERE permission_code='customer.phone.manage' FOR SHARE")).rows;
  if(perms.length!==1)return denied();
  const permissionId=perms[0].permission_id;
  const old=(await c.query(
   'SELECT enabled FROM public.role_permission_defaults WHERE role_id=$1 AND permission_id=$2 FOR UPDATE',
   [roleId,permissionId])).rows;
  if(old.length>1)return denied();
  if(old.length===1&&old[0].enabled===true)return outcome('TEMPLATE_ALREADY_ENABLED');
  const before=old.length===0?null:old[0].enabled;
  if(before!==null&&before!==false)return denied();
  if(old.length===0){
   await c.query('INSERT INTO public.role_permission_defaults(role_id,permission_id,enabled,changed_at) VALUES($1,$2,true,transaction_timestamp())',[roleId,permissionId]);
  }else{
   await c.query('UPDATE public.role_permission_defaults SET enabled=true,changed_at=transaction_timestamp() WHERE role_id=$1 AND permission_id=$2 AND enabled=false',[roleId,permissionId]);
  }
  if(testCheckpoint)await testCheckpoint('after_current',c);
  await c.query("INSERT INTO public.role_default_permission_history(role_id,permission_id,enabled,actor_kind,actor_id,occurred_at) VALUES($1,$2,true,'system_admin',$3,transaction_timestamp())",[roleId,permissionId,actor.system_admin_id]);
  if(testCheckpoint)await testCheckpoint('after_history',c);
  const context=JSON.stringify({principal_kind:'system_admin',role:'independent_control_plane',employee_role:null});
  const beforeJson=JSON.stringify({role_code:'sales',permission_code:'customer.phone.manage',enabled:before});
  const afterJson=JSON.stringify({role_code:'sales',permission_code:'customer.phone.manage',enabled:true});
  await c.query(
   "INSERT INTO public.audit_events(actor_kind,actor_id,role_context,object_kind,object_id,action,before_json,after_json,occurred_at) VALUES('system_admin',$1,$2::jsonb,'role_permission_default',$3,'role_template.enable_customer_phone',$4::jsonb,$5::jsonb,transaction_timestamp())",
   [String(actor.system_admin_id),context,String(roleId)+':'+String(permissionId),beforeJson,afterJson]);
  if(testCheckpoint)await testCheckpoint('before_commit',c);
  // The account/session are locked by F03-1 withSession; administrator has FOR SHARE.
  // Recheck current identity inside the SAME transaction, never from client claims.
  const now=(await c.query(
   "SELECT a.credential_state,a.force_password_change,s.account_status FROM public.pc_login_accounts a JOIN public.system_admins s ON s.system_admin_id=a.system_admin_id WHERE a.account_id=$1 AND a.principal_kind='system_admin' AND a.system_admin_id=$2",
   [actor.account_id,actor.system_admin_id])).rows;
  if(now.length!==1||now[0].credential_state!=='enabled'||now[0].force_password_change!==false||now[0].account_status!=='active')
   throw Error('F03_2_2A_COMMIT_IDENTITY_REJECTED');
  return outcome('TEMPLATE_ENABLED',true);
 },{normalOnly:true});
 return value??denied();
}
