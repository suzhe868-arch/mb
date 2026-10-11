// F05-3C: CI-only wholesale to Mingbang, same Vehicle and same ListingCycle.
// NO inferred wholesale ownership from car_code, creator, publisher or integration key.
import {verify} from './migration.mjs';
import {requireDatabaseIdentity} from '../vehicle-stewardship-physical-scope/migration.mjs';
export const SOURCE_GAP='F05_3C_CURRENT_WHOLESALE_OBJECT_SCOPE_SOURCE_GAP';
const deny=code=>({allowed:false,code});
const pass=(code,extra={})=>({allowed:true,code,...extra});
const valid=n=>Number.isSafeInteger(n)&&n>0&&n<=2147483647;
const event=k=>typeof k==='string'&&/^[A-Za-z0-9._:-]{20,160}$/.test(k);
const shape=(o,keys)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).sort().join(',')===keys;
const isolated=()=>{
 for(const [k,v] of Object.entries({CI:'true',GITHUB_ACTIONS:'true',APP_ENV:'test',NODE_ENV:'test',
 F05_2_ISOLATION_CONFIRM:'I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY'}))
  if(process.env[k]!==v)throw Error('F05_3C_CI_ONLY_'+k);
};
async function capability(c,employee,team,code){
 const query="SELECT EXISTS(SELECT 1 FROM public.employees e JOIN public.roles r ON r.role_id=e.main_role_id "+
  "JOIN public.teams t ON t.team_id=$2 JOIN public.stores st ON st.store_id=t.store_id "+
  "JOIN public.employee_team_memberships tm ON tm.employee_id=e.employee_id AND tm.team_id=t.team_id "+
  "JOIN public.permissions p ON p.permission_code=$3 "+
  "LEFT JOIN public.role_permission_defaults rd ON rd.role_id=e.main_role_id AND rd.permission_id=p.permission_id "+
  "LEFT JOIN public.employee_permission_overrides ov ON ov.employee_id=e.employee_id AND ov.permission_id=p.permission_id "+
  "JOIN public.employee_data_scopes sc ON sc.employee_id=e.employee_id "+
  "JOIN public.employee_capability_scope_bindings sb ON sb.employee_id=e.employee_id AND sb.permission_id=p.permission_id AND sb.scope_id=sc.scope_id "+
  "WHERE e.employee_id=$1 AND e.employment_status='active' AND r.role_code IN('sales','manager','store_head') "+
  "AND e.store_id=t.store_id AND t.team_status='active' AND st.status='active' "+
  "AND tm.valid_from<=statement_timestamp() AND (tm.ended_at IS NULL OR tm.ended_at>statement_timestamp()) "+
  "AND sc.ended_at IS NULL AND sc.scope_kind='team' AND sc.scope_reference_id=t.team_id "+
  "AND sb.granted_at<=statement_timestamp() AND (sb.ended_at IS NULL OR sb.ended_at>statement_timestamp()) "+
  "AND ov.decision IS DISTINCT FROM 'deny' AND (ov.decision='allow' OR (ov.decision IS NULL AND rd.enabled=true))) AS allowed";
 return (await c.query(query,[employee,team,code])).rows[0]?.allowed===true;
}
async function objectScope(c,employee,team,vehicle,cycle){
 // A signed current customer-business object connects the WHOLESALE vehicle/cycle
 // to this employee; team-based static roles or legacy uploader cannot forge it.
 // If there is no current Lock/Transaction object-owner: fail SOURCE_GAP.
 const q=(await c.query(
 "SELECT (SELECT count(*)::int FROM public.locks l WHERE l.vehicle_id=$1 AND l.listing_cycle_id=$2 "+
 "AND l.responsible_employee_id=$3 AND l.lock_status='active' AND l.expires_at>transaction_timestamp()) as locks, "+
 "(SELECT count(*)::int FROM public.transactions t WHERE t.vehicle_id=$1 AND t.listing_cycle_id=$2 "+
 "AND t.responsible_employee_id=$3 AND t.completed_at IS NULL AND t.status NOT IN ('completed','cancelled')) AS transactions",
 [vehicle,cycle,employee])).rows[0];
 // Team membership and two current capability scope bindings were proven by caller.
 return Number(q.locks)>0||Number(q.transactions)>0;
}
export async function convertWholesaleToMingbang(auth,token,p,{checkpoint}={}){
 if(!shape(p,'eventKey,teamId,vehicleId')||!valid(p.vehicleId)||!valid(p.teamId)||!event(p.eventKey))
  return deny('F05_3C_ACTION_FIELDS_REJECTED');
 isolated();
 if(checkpoint!==undefined&&(process.env.CI!=='true'||typeof checkpoint!=='function'))
  return deny('F05_3C_TEST_CHECKPOINT_DENIED');
 if(!auth?.pool||typeof auth.withSession!=='function')throw Error('F05_3C_CURRENT_EMPLOYEE_SESSION_REQUIRED');
 await requireDatabaseIdentity(auth.pool);await verify(auth.pool);
 try{
  return (await auth.withSession(token,async(c,a,s)=>{
   if(s.restricted||a.principal_kind!=='employee'||a.employee_id===null||a.system_admin_id!==null||
    a.subject_status!=='active'||a.credential_state!=='enabled'||a.force_password_change!==false||
    !['sales','manager','store_head'].includes(a.role_code))return deny('F05_3C_MINGBANG_EMPLOYEE_REQUIRED');
   const actor=Number(a.employee_id);if(!valid(actor))return deny('F05_3C_EMPLOYEE_INVALID');
   // Same governance advisory as F05-2 current scope issuance and invalidation.
   await c.query('SELECT pg_advisory_xact_lock(20261011,$1::integer)',[actor]);
   if(!await capability(c,actor,p.teamId,'vehicle.manage')||
      !await capability(c,actor,p.teamId,'vehicle.read'))
    return deny('F05_3C_EMPLOYEE_PERMISSION_OR_TEAM_SCOPE_DENIED');
   const locator=(await c.query(
    "SELECT l.lineage_id,l.source_platform,l.car_code,l.vehicle_id,l.current_cycle_id "+
    "FROM public.f05_3b_sync_lineages l WHERE l.vehicle_id=$1",[p.vehicleId])).rows[0];
   if(!locator)return deny('F05_3C_SIGNED_JYT_LINEAGE_MISSING');
   await c.query('SELECT pg_advisory_xact_lock(20261011,hashtext($1))',['JYT:'+locator.car_code]);
   // JYT sync uses the identical car_code advisory lock and same lineage row.
   const l=(await c.query("SELECT * FROM public.f05_3b_sync_lineages WHERE lineage_id=$1 FOR UPDATE",[locator.lineage_id])).rows[0];
   const v=(await c.query('SELECT * FROM public.vehicles WHERE vehicle_id=$1 FOR UPDATE',[p.vehicleId])).rows[0];
   if(!v||!l||l.source_platform!=='JYT')return deny('F05_3C_NOT_CONFIRMED_SOURCE');
   const existing=(await c.query('SELECT * FROM public.f05_3c_wholesale_conversions WHERE vehicle_id=$1',[p.vehicleId])).rows[0];
   if(existing){
    if(v.source_type==='mingbang'&&existing.event_key===p.eventKey&&
       Number(existing.actor_employee_id)===actor&&Number(existing.actor_team_id)===p.teamId)
      return pass('F05_3C_SAME_EVENT_ALREADY_CONVERTED',
       {conversionId:Number(existing.conversion_id),vehicleId:p.vehicleId,listingCycleId:Number(existing.listing_cycle_id),
        assetState:'IMAGE_LOCALIZATION_SOURCE_GAP'});
    return deny('F05_3C_ALREADY_CONVERTED_NO_SECOND_ACT');
   }
   if(v.source_type!=='wholesale'||v.source_sale_status!=='active'||v.archived_at!==null)
    return deny('F05_3C_NOT_CURRENT_SALEABLE_WHOLESALE');
   const cy=(await c.query(
    'SELECT * FROM public.vehicle_listing_cycles WHERE listing_cycle_id=$1 AND vehicle_id=$2 FOR UPDATE',
    [l.current_cycle_id,p.vehicleId])).rows[0];
   if(!cy||cy.ended_at!==null)return deny('F05_3C_CURRENT_CYCLE_UNPROVEN');
   // FOR SHARE locks real transaction completion rows so its concurrent update
   // cannot slip between inspection and conversion COMMIT.
   const tx=(await c.query(
    'SELECT transaction_id,status,completed_at FROM public.transactions WHERE vehicle_id=$1 AND listing_cycle_id=$2 FOR SHARE',
    [p.vehicleId,l.current_cycle_id])).rows;
   if(tx.some(t=>t.status==='completed'||t.completed_at!==null))
    return deny('F05_3C_COMPLETED_TRANSACTION_BLOCKS_CONVERSION');
   if(!await objectScope(c,actor,p.teamId,p.vehicleId,Number(l.current_cycle_id)))
    return deny(SOURCE_GAP);
   if(checkpoint)await checkpoint('employee_and_source_physically_locked',c);
   // Conservative: source_scope/condition matching and manual-vs-auto hidden cause
   // are not independently verifiable in frozen M94. Never auto-unhide.
   const before={
    vehicleId:p.vehicleId,listingCycleId:Number(l.current_cycle_id),
    sourceType:v.source_type,saleStatus:v.source_sale_status,visibility:v.platform_visibility,
    carCode:l.car_code,sourcePlatform:l.source_platform,actorEmployeeId:actor,teamId:p.teamId
   };
   const txid=Number((await c.query('SELECT txid_current() AS id')).rows[0].id);
   const changed=await c.query(
    "UPDATE public.vehicles SET source_type='mingbang',source_sale_status='available',"+
    "platform_visibility='hidden' WHERE vehicle_id=$1 AND source_type='wholesale' AND source_sale_status='active'",
    [p.vehicleId]);
   if(changed.rowCount!==1)throw Error('F05_3C_CONVERT_CAS_FAILED');
   const after={...before,sourceType:'mingbang',saleStatus:'available',visibility:'hidden',
    conversionCompleted:true,imageLocalization:'IMAGE_LOCALIZATION_SOURCE_GAP',
    hiding:'HIDE_REASON_RECALCULATION_SOURCE_GAP'};
   const proof={
    origin:'CURRENT_EMPLOYEE_SESSION_AND_EXISTING_BUSINESS_OBJECT_SCOPE',
    actorEmployeeId:actor,scopeTeamId:p.teamId,currentCycleId:Number(l.current_cycle_id),
    sourceLineageId:Number(l.lineage_id),jytCarCode:l.car_code,realDbTransaction:txid,
    imageSourceGap:true,visibilityReasonSourceGap:true
   };
   const row=(await c.query(
    "INSERT INTO public.f05_3c_wholesale_conversions "+
    "(vehicle_id,listing_cycle_id,lineage_id,source_platform,car_code,actor_employee_id,actor_team_id,event_key,before_state,after_state,source_evidence,transaction_id) "+
    "VALUES($1,$2,$3,'JYT',$4,$5,$6,$7,$8::jsonb,$9::jsonb,$10::jsonb,$11) RETURNING conversion_id",
    [p.vehicleId,l.current_cycle_id,l.lineage_id,l.car_code,actor,p.teamId,p.eventKey,
     JSON.stringify(before),JSON.stringify(after),JSON.stringify(proof),txid])).rows[0];
   await c.query("INSERT INTO public.f05_3c_conversion_audit(conversion_id,actor_kind,actor_employee_id,event_key,before_state,after_state,txid) VALUES($1,'EMPLOYEE',$2,$3,$4::jsonb,$5::jsonb,$6)",
    [row.conversion_id,actor,'audit:'+p.eventKey,JSON.stringify(before),JSON.stringify(after),txid]);
   return pass('F05_3C_CONVERTED_SAME_VEHICLE_CYCLE',
    {conversionId:Number(row.conversion_id),vehicleId:p.vehicleId,listingCycleId:Number(l.current_cycle_id),
     assetState:'IMAGE_LOCALIZATION_SOURCE_GAP',visibilityState:'HIDE_REASON_RECALCULATION_SOURCE_GAP'});
  },{normalOnly:true}))??deny('F05_3C_MISSING_OR_INVALID_EMPLOYEE_SESSION');
 }catch(e){
  if(['23505','23503','40001','40P01','55P03'].includes(e?.code))
   return deny('F05_3C_CONCURRENT_OR_STALE_OPERATION');
  throw e;
 }
}
