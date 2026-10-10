// F05-3A: isolated PG16 source assessment; intentionally NO 4S grant.
import {verify,requireDatabaseIdentity} from '../vehicle-stewardship-physical-scope/migration.mjs';
export const BLOCKED='POSITIVE_4S_TRUST_SOURCE_BLOCKED';
const deny=(code=BLOCKED)=>Object.freeze({allowed:false,code});
export async function assessFourSMemberAuthority(auth,token){
 if(!auth||!auth.pool||typeof auth.withSession!=='function')throw Error('F05_3A_MISSING_TRUSTED_SESSION');
 for(const [k,v] of Object.entries({CI:'true',GITHUB_ACTIONS:'true',APP_ENV:'test',NODE_ENV:'test',
 F05_2_ISOLATION_CONFIRM:'I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY'}))
  if(process.env[k]!==v)throw Error('F05_3A_NOT_DISPOSABLE_'+k);
 await requireDatabaseIdentity(auth.pool);
 await verify(auth.pool);
 const result=await auth.withSession(token,async(c,a,s)=>{
  if(s.restricted||a.principal_kind!=='employee'||a.employee_id===null||
    a.system_admin_id!==null||a.subject_status!=='active'||
    a.credential_state!=='enabled'||a.force_password_change!==false)
   return deny('F05_3A_SESSION_OR_PRINCIPAL_DENIED');
  const e=(await c.query("SELECT e.employee_id,e.store_id,r.role_code FROM public.employees e JOIN public.roles r ON r.role_id=e.main_role_id WHERE e.employee_id=$1 AND e.employment_status='active' FOR SHARE OF e",
     [a.employee_id])).rows[0];
  if(!e||e.role_code!=='four_s')return deny('F05_3A_NOT_FOUR_S_MEMBER');
  // A role or upstream uploader field is NOT a current Vehicle object-grant.
  // Frozen M94 has no 4S-member->represented dealer identity/authority source.
  // Old 000015 is employee/team stewardship, not 4S one-account representation.
  const proof=(await c.query("SELECT (SELECT count(*)::int FROM public.pc_login_accounts ac WHERE ac.employee_id=$1 AND ac.principal_kind='employee' AND ac.credential_state='enabled') authenticated_accounts,(SELECT count(*)::int FROM public.employee_data_scopes sc WHERE sc.employee_id=$1 AND sc.scope_kind='team' AND sc.ended_at IS NULL) team_scopes,(SELECT count(*)::int FROM public.vehicle_current_responsibilities r WHERE r.responsible_employee_id=$1 AND r.revoked_at IS NULL) signed_current_responsibilities,(SELECT count(*)::int FROM public.vehicle_responsibility_audit_events a JOIN public.vehicle_current_responsibilities r USING(responsibility_id) WHERE r.responsible_employee_id=$1 AND a.event_kind='ISSUE') signed_issued_events",
    [a.employee_id])).rows[0];
  if(Number(proof.authenticated_accounts)!==1)return deny('F05_3A_MEMBER_ACCOUNT_SOURCE_CONFLICT');
  // Positive verification requires a trusted publication-event source,
  // scope and relationship that the frozen schema cannot provide. Fail closed
  // regardless of role, 4S source_type, legacy created_by, forged parameters.
  return deny(BLOCKED);
 },{normalOnly:true});
 return result??deny('F05_3A_SESSION_DENIED');
}
export async function publishFourSVehicle(){return deny()}
export async function issueFourSResponsibility(){return deny()}
