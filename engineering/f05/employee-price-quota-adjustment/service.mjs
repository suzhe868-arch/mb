// Only disposable CI role fixture authorizes this module. Production issuer remains SOURCE_GAP.
import {verify} from './migration.mjs';
const GAP='F05_5_EMPLOYEE_ADDITION_SOURCE_GAP';
export const SOURCE_GAP=GAP;
const deny=code=>({allowed:false,code});
const ok=(receipt,retry=false)=>({allowed:true,code:retry?'F05_5_CI_SAME_REQUEST_ALREADY_ADDED':'F05_5_CI_ADDED_FREE_DAILY_QUOTA',
 syntheticFixtureOnly:true,customerId:Number(receipt.customer_id),actorEmployeeId:Number(receipt.actor_employee_id),
 businessDay:receipt.business_day_shanghai instanceof Date?receipt.business_day_shanghai.toISOString().slice(0,10):String(receipt.business_day_shanghai).slice(0,10),
 addedCount:receipt.added_count,afterTempAdditions:receipt.after_temp_additions});
const valid=x=>Number.isSafeInteger(x)&&x>0&&x<=2147483647;
const inputs=p=>p&&Object.keys(p).sort().join(',')==='atIso,customerId,delta,idempotencyKey,teamId'&&
 valid(p.customerId)&&valid(p.teamId)&&Number.isInteger(p.delta)&&p.delta>=1&&p.delta<=100&&
 typeof p.idempotencyKey==='string'&&/^[A-Za-z0-9._:-]{20,160}$/.test(p.idempotencyKey)&&
 typeof p.atIso==='string'&&/(Z|[+-]\d\d:\d\d)$/.test(p.atIso)&&!Number.isNaN(new Date(p.atIso).getTime());
const businessDay=iso=>new Date(new Date(iso).getTime()+8*3600000).toISOString().slice(0,10);
const isolated=()=>{
 for(const [k,v] of Object.entries({CI:'true',GITHUB_ACTIONS:'true',APP_ENV:'test',NODE_ENV:'test',F05_2_ISOLATION_CONFIRM:'I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY'}))
  if(process.env[k]!==v)throw Error('F05_5_NOT_DISPOSABLE_CI_'+k);
};
export async function addSyntheticDailyQuota(auth,token,p,{checkpoint}={}){
 if(!inputs(p))return deny('F05_5_INVALID_ADDITION_REQUEST');
 isolated();
 if(!auth||typeof auth.withSession!=='function')return deny(GAP);
 if(checkpoint!==undefined&&typeof checkpoint!=='function')return deny('F05_5_INVALID_CI_CHECKPOINT');
 try{
  return (await auth.withSession(token,async(c,a,s)=>{
   if(s.restricted||a.principal_kind!=='employee'||a.system_admin_id!==null||!valid(Number(a.employee_id))||
      a.subject_status!=='active'||a.credential_state!=='enabled'||a.force_password_change||
      !['sales','manager','store_head'].includes(a.role_code))return deny('F05_5_ACTIVE_MINGBANG_EMPLOYEE_REQUIRED');
   const actor=Number(a.employee_id),day=businessDay(p.atIso);
   await verify(c);
   await c.query('SELECT pg_advisory_xact_lock(20261011,$1::integer)',[actor]);
   const employee=(await c.query("SELECT e.employee_id,e.store_id,e.employment_status,e.main_role_id,r.role_code FROM public.employees e JOIN public.roles r ON r.role_id=e.main_role_id WHERE e.employee_id=$1 FOR SHARE OF e",[actor])).rows[0];
   if(!employee||employee.employment_status!=='active'||employee.role_code!==a.role_code||employee.store_id==null)
    return deny('F05_5_STALE_OR_INVALID_EMPLOYEE');
   const customer=(await c.query('SELECT customer_id,current_owner_employee_id,account_status,customer_level_id,owner_assignment_state FROM public.customers WHERE customer_id=$1 FOR UPDATE',[p.customerId])).rows[0];
   if(!customer||customer.account_status!=='active'||customer.current_owner_employee_id==null||customer.owner_assignment_state!=='assigned')
    return deny('F05_5_CUSTOMER_NOT_ACTIVE_OR_NOT_OWNED');
   const owner=Number(customer.current_owner_employee_id);
   if(employee.role_code==='sales'&&owner!==actor)return deny('F05_5_SALES_NOT_CURRENT_CUSTOMER_OWNER');
   const mode=(await c.query("SELECT price_mode,daily_base_quota FROM public.f05_4_level_price_policy_ci WHERE level_id=$1 AND source_marker='SYNTHETIC_CI_POLICY_ONLY'",[customer.customer_level_id])).rows[0];
   if(!mode)return deny('F05_5_SIGNED_CURRENT_CUSTOMER_LEVEL_MODE_GAP');
   if(mode.price_mode==='UNLIMITED')return deny('F05_5_3A_UNLIMITED_CANNOT_ADD');
   if(mode.price_mode!=='LIMITED')return deny('F05_5_PRICE_MODE_INVALID');
   // Permission id and scope MUST be signed by the CI fixture explicitly, never infer
   // access from a bare role name, client isManager, ownerId, or any production grant.
   const sql="SELECT EXISTS(SELECT 1 FROM public.permissions p "+
    "JOIN public.employee_permission_overrides ov ON ov.employee_id=$1 AND ov.permission_id=p.permission_id "+
    "JOIN public.employee_capability_scope_bindings b ON b.permission_id=p.permission_id AND b.employee_id=$1 "+
    "JOIN public.employee_data_scopes sc ON sc.scope_id=b.scope_id AND sc.employee_id=b.employee_id "+
    "JOIN public.teams t ON t.team_id=$2 JOIN public.stores st ON st.store_id=t.store_id "+
    "JOIN public.employee_team_memberships member ON member.employee_id=$1 AND member.team_id=t.team_id "+
    "JOIN public.employee_team_memberships ownerm ON ownerm.employee_id=$3 AND ownerm.team_id=t.team_id "+
    "WHERE p.permission_code='customer.quota.add.ci.synthetic' AND ov.decision='allow' "+
    "AND t.team_status='active' AND st.status='active' AND st.store_id=$4 "+
    "AND member.valid_from<=statement_timestamp() AND (member.ended_at IS NULL OR member.ended_at>statement_timestamp()) "+
    "AND ownerm.valid_from<=statement_timestamp() AND (ownerm.ended_at IS NULL OR ownerm.ended_at>statement_timestamp()) "+
    "AND sc.ended_at IS NULL AND b.granted_at<=statement_timestamp() AND (b.ended_at IS NULL OR b.ended_at>statement_timestamp()) "+
    "AND ((sc.scope_kind='team' AND sc.scope_reference_id=t.team_id) OR "+
    "(sc.scope_kind='store' AND sc.scope_reference_id=st.store_id AND $5 IN ('manager','store_head'))) FOR SHARE OF ov,b,sc,member,ownerm,t,st,p) allowed";
   const scope=(await c.query(sql,[actor,p.teamId,owner,employee.store_id,employee.role_code])).rows[0];
   if(scope?.allowed!==true)return deny(GAP);
   // Recheck under same transaction before append: Customer lock serializes current
   // owner and customer status; real session account lock protects revocation.
   const existing=(await c.query('SELECT * FROM public.f05_5_quota_addition_events_ci WHERE idempotency_key=$1',[p.idempotencyKey])).rows[0];
   if(existing){
    if(Number(existing.actor_employee_id)!==actor||Number(existing.customer_id)!==p.customerId||
       existing.added_count!==p.delta||(existing.business_day_shanghai instanceof Date?existing.business_day_shanghai.toISOString().slice(0,10):String(existing.business_day_shanghai).slice(0,10))!==day)
     return deny('F05_5_IDEMPOTENCY_KEY_IDENTITY_COLLISION');
    return ok(existing,true);
   }
   if(checkpoint)await checkpoint('after_current_customer_and_employee_scope_guard',c);
   await c.query('INSERT INTO public.customer_day_quota_ledger(customer_id,business_day_shanghai,base_quota,temp_additions,consumed_count,updated_at) VALUES($1,$2,$3,0,0,now()) ON CONFLICT(customer_id,business_day_shanghai) DO NOTHING',
    [p.customerId,day,mode.daily_base_quota]);
   const old=(await c.query('SELECT temp_additions,consumed_count,base_quota FROM public.customer_day_quota_ledger WHERE customer_id=$1 AND business_day_shanghai=$2 FOR UPDATE',
    [p.customerId,day])).rows[0];
   if(old.temp_additions>2147483647-p.delta)return deny('F05_5_DAILY_ADDITION_OVERFLOW');
   const newTotal=old.temp_additions+p.delta;
   const added=(await c.query('INSERT INTO public.customer_quota_adjustments(customer_id,business_day_shanghai,delta,changed_by) VALUES($1,$2,$3,$4) RETURNING adjustment_id',
    [p.customerId,day,p.delta,actor])).rows[0];
   await c.query('UPDATE public.customer_day_quota_ledger SET temp_additions=$3,updated_at=now() WHERE customer_id=$1 AND business_day_shanghai=$2',
    [p.customerId,day,newTotal]);
   const receipt=(await c.query("INSERT INTO public.f05_5_quota_addition_events_ci(idempotency_key,customer_id,actor_employee_id,adjustment_id,business_day_shanghai,added_count,before_temp_additions,after_temp_additions,current_owner_at_commit,actor_role_at_commit,actor_scope_team_id,synthetic_fixture_only,txid) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'CI_SYNTHETIC_ROLE_FIXTURE_NOT_PRODUCTION',txid_current()) RETURNING *",
    [p.idempotencyKey,p.customerId,actor,added.adjustment_id,day,p.delta,old.temp_additions,newTotal,owner,employee.role_code,p.teamId])).rows[0];
   return ok(receipt);
  },{normalOnly:true}))??deny('F05_5_MISSING_OR_REVOKED_REAL_F03_EMPLOYEE_SESSION');
 }catch(e){
  if(['23505','40001','40P01','55P03'].includes(e?.code))return deny('F05_5_ATOMIC_CONFLICT_RETRY');
  throw e;
 }
}
// Explicit live issuer source not signed: prohibit production HTTP positive even with a CI fixture.
export function denyUnsignedProductionAddition(){return {allowed:false,code:GAP}}
