// F05-3E: CI-only immutable-source inspection. Never a production hide-rule endpoint.
// Missing signed manual/other hide reasons means no lawful "make visible" operation.
import {verify} from '../wholesale-to-mingbang-conversion/migration.mjs';
import {requireDatabaseIdentity} from '../vehicle-stewardship-physical-scope/migration.mjs';
export const GAP='HIDE_REASON_RECALCULATION_SOURCE_GAP';
const deny=code=>({allowed:false,code});
const positive=n=>Number.isSafeInteger(n)&&n>0&&n<=2147483647;
const event=x=>typeof x==='string'&&/^[A-Za-z0-9._:-]{20,160}$/.test(x);
const shape=x=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).sort().join(',')==='eventKey,teamId,vehicleId';
const isolated=()=>{
 for(const [k,v] of Object.entries({CI:'true',GITHUB_ACTIONS:'true',APP_ENV:'test',NODE_ENV:'test',
  F05_2_ISOLATION_CONFIRM:'I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY'}))
  if(process.env[k]!==v)throw Error('F05_3E_CI_ONLY_'+k);
};
const fields=['rule_id','is_enabled','source_scope_json','conditions_json','updated_by_employee_id','updated_at'];
const sourceKinds=['wholesale','mingbang','four_s'];
// Database catalog/rows are facts, not a signed source of manual hide causes.
// A FK on updated_by_employee_id does not attest an authenticated rule-issue event.
export async function auditCurrentHideCarriers(c){
 isolated();await requireDatabaseIdentity(c);await verify(c);
 const columns=(await c.query("SELECT column_name FROM information_schema.columns "+
  "WHERE table_schema='public' AND table_name='vehicle_hide_rules'")).rows.map(x=>x.column_name);
 if(fields.some(x=>!columns.includes(x)))throw Error('F05_3E_HIDE_RULE_SCHEMA_DRIFT');
 const vehicleCols=(await c.query("SELECT column_name FROM information_schema.columns "+
  "WHERE table_schema='public' AND table_name='vehicles'")).rows.map(x=>x.column_name);
 if(!vehicleCols.includes('platform_visibility')||!vehicleCols.includes('model_id')||
    !vehicleCols.includes('source_type'))throw Error('F05_3E_VEHICLE_SCHEMA_DRIFT');
 // A reason ledger must contain a reason/source identity and authenticated
 // creation/revocation event, not merely an aggregate visibility boolean.
 const ownReasonCols=['hide_reason_id','hide_reason_kind','manual_hidden_at','manual_hide_actor_id',
  'reason_record_id','visibility_cause_id'];
 const signedReasons=vehicleCols.filter(x=>ownReasonCols.includes(x));
 const ruleCols=columns.filter(x=>/issuer|signature|audit|version|revoked|reason_kind/.test(x));
 const ruleCount=(await c.query(
  "SELECT COUNT(*)::int n,COUNT(*) FILTER(WHERE is_enabled)::int active FROM public.vehicle_hide_rules")).rows[0];
 return {allowed:false,code:GAP,currentRuleTable:true,ruleColumnsVerified:true,
  activeRuleCount:ruleCount.active,totalRuleCount:ruleCount.n,
  vehicleReasonFieldsVerified:signedReasons.length>0,ruleIssuerOrVersionFieldsVerified:ruleCols.length>0,
  sourceScopeKinds:sourceKinds,issuerIsForeignKeyNotAuthenticatedEvent:true,
  claim:'NO_SIGNED_MANUAL_OR_OTHER_REASON_CLEARANCE_FOR_UNHIDE'};
}
// No user-visible "unhide" is ever issued by this CI-only audit. The actual
// Vehicle, current Cycle and rules are held by PG16 row locks until COMMIT,
// so a concurrent change cannot silently change the inspected facts.
export async function auditRecalculation(auth,token,p,{checkpoint}={}){
 if(!shape(p)||![p.vehicleId,p.teamId].every(positive)||!event(p.eventKey))
  return deny('F05_3E_ACTION_FIELDS');
 isolated();
 if(checkpoint!==undefined&&typeof checkpoint!=='function')
  return deny('F05_3E_TEST_CHECKPOINT_INVALID');
 if(!auth?.pool||typeof auth.withSession!=='function')
  throw Error('F05_3E_SESSION_REQUIRED');
 const source=await auditCurrentHideCarriers(auth.pool);
 if(source.code!==GAP)throw Error('F05_3E_UNREVIEWED_REASON_SOURCE');
 return (await auth.withSession(token,async(c,a,s)=>{
  if(s.restricted||a.principal_kind!=='employee'||a.system_admin_id!==null||
     !positive(Number(a.employee_id))||a.subject_status!=='active'||
     a.credential_state!=='enabled'||a.force_password_change!==false||
     !['sales','manager','store_head'].includes(a.role_code))
   return deny('F05_3E_CURRENT_EMPLOYEE_REQUIRED');
  const actor=Number(a.employee_id);
  await c.query('SELECT pg_advisory_xact_lock(20261011,$1::integer)',[actor]);
  const capable=async capability=>(await c.query(
   "SELECT EXISTS(SELECT 1 FROM public.employees e "+
   "JOIN public.roles r ON r.role_id=e.main_role_id "+
   "JOIN public.teams team ON team.team_id=$2 AND team.store_id=e.store_id "+
   "JOIN public.stores store ON store.store_id=team.store_id "+
   "JOIN public.employee_team_memberships tm ON tm.employee_id=e.employee_id AND tm.team_id=team.team_id "+
   "JOIN public.permissions p ON p.permission_code=$3 "+
   "LEFT JOIN public.role_permission_defaults rd ON rd.role_id=e.main_role_id AND rd.permission_id=p.permission_id "+
   "LEFT JOIN public.employee_permission_overrides ov ON ov.employee_id=e.employee_id AND ov.permission_id=p.permission_id "+
   "JOIN public.employee_data_scopes sc ON sc.employee_id=e.employee_id AND sc.scope_kind='team' AND sc.scope_reference_id=team.team_id "+
   "JOIN public.employee_capability_scope_bindings sb ON sb.employee_id=e.employee_id AND sb.scope_id=sc.scope_id AND sb.permission_id=p.permission_id "+
   "WHERE e.employee_id=$1 AND e.employment_status='active' AND r.role_code IN ('sales','manager','store_head') "+
   "AND team.team_status='active' AND store.status='active' "+
   "AND tm.valid_from<=statement_timestamp() AND (tm.ended_at IS NULL OR tm.ended_at>statement_timestamp()) "+
   "AND sc.ended_at IS NULL AND sb.granted_at<=statement_timestamp() "+
   "AND (sb.ended_at IS NULL OR sb.ended_at>statement_timestamp()) "+
   "AND ov.decision IS DISTINCT FROM 'deny' "+
   "AND (ov.decision='allow' OR (ov.decision IS NULL AND rd.enabled=true))) AS allowed",
   [actor,p.teamId,capability])).rows[0]?.allowed===true;
  if(!await capable('vehicle.manage')||!await capable('vehicle.read'))
   return deny('F05_3E_PERMISSION_OR_TEAM_DENIED');
  // Lock real Vehicle and current ListingCycle, never use a raw caller scope.
  const found=(await c.query(
   "SELECT v.vehicle_id,v.source_type,v.source_sale_status,v.platform_visibility,v.archived_at,"+
   "cy.listing_cycle_id,cy.ended_at FROM public.vehicles v "+
   "JOIN public.vehicle_listing_cycles cy ON cy.vehicle_id=v.vehicle_id AND cy.ended_at IS NULL "+
   "WHERE v.vehicle_id=$1 ORDER BY cy.listing_cycle_id DESC LIMIT 1 FOR SHARE OF v,cy",
   [p.vehicleId])).rows;
  if(found.length!==1||found[0].archived_at!==null)
   return deny('F05_3E_CURRENT_VEHICLE_REQUIRED');
  const v=found[0];
  if(!sourceKinds.includes(v.source_type))return deny('F05_3E_SOURCE_INVALID');
  const rules=(await c.query(
   "SELECT rule_id,is_enabled,source_scope_json,conditions_json,updated_at,updated_by_employee_id "+
   "FROM public.vehicle_hide_rules ORDER BY rule_id FOR SHARE")).rows;
  // Inspecting raw JSON rule payload is not an authenticated matcher. A spoofed
  // JSON source-scope cannot prove manual hide reversal or all other causes.
  if(checkpoint)await checkpoint('source_and_rules_physically_locked',c);
  const isSaleable=(v.source_type==='wholesale'?
   v.source_sale_status==='active':v.source_sale_status==='available')&&v.ended_at===null;
  return deny(isSaleable?GAP:'F05_3E_NOT_CURRENT_SALEABLE');
 },{normalOnly:true}))??deny('F05_3E_MISSING_SESSION');
}
