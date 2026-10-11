// F05-3D CI-only trust-source audit: fail closed when there is no signed
// general wholesale Vehicle business-object owner. Never a production API.
import {verify} from '../wholesale-to-mingbang-conversion/migration.mjs';
import {requireDatabaseIdentity} from '../vehicle-stewardship-physical-scope/migration.mjs';

export const GAP='GENERAL_WHOLESALE_VEHICLE_SCOPE_SOURCE_GAP';
const denied=code=>({allowed:false,code});
const positive=n=>Number.isSafeInteger(n)&&n>0&&n<=2147483647;
const event=k=>typeof k==='string'&&/^[a-zA-Z0-9._:-]{20,160}$/.test(k);
const shape=x=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).sort().join(',')==='eventKey,teamId,vehicleId';
const gate=()=>{
 for(const [k,v] of Object.entries({CI:'true',GITHUB_ACTIONS:'true',APP_ENV:'test',NODE_ENV:'test',
  F05_2_ISOLATION_CONFIRM:'I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY'}))
  if(process.env[k]!==v)throw Error('F05_3D_CI_ONLY_'+k);
};

// Read the actual constraints, not claims from a fixture or caller. Under
// 000015 the stewardship signer only accepts formal manual source publication.
export async function catalogScopeSource(c){
 gate();await requireDatabaseIdentity(c);await verify(c);
 const constraints=(await c.query(
  "SELECT pg_get_constraintdef(oid) AS rule FROM pg_constraint "+
  "WHERE conrelid='public.vehicle_current_responsibilities'::regclass AND contype='c'")).rows.map(x=>x.rule);
 const restricted=constraints.some(x=>x.includes('source_snapshot')&&
  x.includes('mingbang')&&x.includes('four_s')&&!x.includes('wholesale'));
 if(!restricted)throw Error('F05_3D_FROZEN_PROVENANCE_CHECK_UNVERIFIED');
 const columns=(await c.query(
  "SELECT column_name FROM information_schema.columns "+
  "WHERE table_schema='public' AND table_name='f05_3b_sync_lineages'")).rows.map(x=>x.column_name);
 if(columns.includes('responsible_employee_id')||columns.includes('team_id')||
    columns.includes('issuer_employee_id'))
  throw Error('F05_3D_UNREVIEWED_WHOLESALE_SCOPE_SOURCE');
 return {sourceGap:true,code:GAP,manualSourceCheckVerified:true,
  wholesaleLineageHasNoOwner:true,physicalConstraintCount:constraints.length};
}

// Explicitly NOT a conversion. A trusted object-management issuer for common
// JYT inventory does not exist in this sealed database. This read-only audit
// cannot introduce a synthetic successful owner.
export async function checkGeneralWholesaleScope(auth,token,p,{checkpoint}={}){
 if(!shape(p)||![p.vehicleId,p.teamId].every(positive)||!event(p.eventKey))
  return denied('F05_3D_ACTION_FIELDS');
 gate();
 if(checkpoint!==undefined&&typeof checkpoint!=='function')
  return denied('F05_3D_CHECKPOINT_INVALID');
 if(!auth?.pool||typeof auth.withSession!=='function')
  throw Error('F05_3D_REAL_EMPLOYEE_SESSION_REQUIRED');
 await catalogScopeSource(auth.pool);
 return (await auth.withSession(token,async(c,a,s)=>{
  if(s.restricted||a.principal_kind!=='employee'||a.system_admin_id!==null||
     !positive(Number(a.employee_id))||a.subject_status!=='active'||
     a.credential_state!=='enabled'||a.force_password_change!==false||
     !['sales','manager','store_head'].includes(a.role_code))
   return denied('F05_3D_EMPLOYEE_REQUIRED');
  const actor=Number(a.employee_id);
  // Serialize signed governance changes for this actor with the check.
  await c.query('SELECT pg_advisory_xact_lock(20261011,$1::integer)',[actor]);
  const capable=async code=>(await c.query(
   "SELECT EXISTS(SELECT 1 FROM public.employees e "+
   "JOIN public.roles role ON role.role_id=e.main_role_id "+
   "JOIN public.teams t ON t.team_id=$2 AND t.store_id=e.store_id "+
   "JOIN public.stores st ON st.store_id=t.store_id "+
   "JOIN public.employee_team_memberships tm ON tm.employee_id=e.employee_id AND tm.team_id=t.team_id "+
   "JOIN public.permissions p ON p.permission_code=$3 "+
   "LEFT JOIN public.role_permission_defaults rd ON rd.role_id=e.main_role_id AND rd.permission_id=p.permission_id "+
   "LEFT JOIN public.employee_permission_overrides ov ON ov.employee_id=e.employee_id AND ov.permission_id=p.permission_id "+
   "JOIN public.employee_data_scopes sc ON sc.employee_id=e.employee_id AND sc.scope_kind='team' AND sc.scope_reference_id=t.team_id "+
   "JOIN public.employee_capability_scope_bindings sb ON sb.employee_id=e.employee_id AND sb.scope_id=sc.scope_id AND sb.permission_id=p.permission_id "+
   "WHERE e.employee_id=$1 AND e.employment_status='active' AND role.role_code IN ('sales','manager','store_head') "+
   "AND t.team_status='active' AND st.status='active' "+
   "AND tm.valid_from<=statement_timestamp() AND (tm.ended_at IS NULL OR tm.ended_at>statement_timestamp()) "+
   "AND sc.ended_at IS NULL AND sb.granted_at<=statement_timestamp() "+
   "AND (sb.ended_at IS NULL OR sb.ended_at>statement_timestamp()) "+
   "AND ov.decision IS DISTINCT FROM 'deny' "+
   "AND (ov.decision='allow' OR (ov.decision IS NULL AND rd.enabled=true))) AS allowed",
   [actor,p.teamId,code])).rows[0]?.allowed===true;
  if(!await capable('vehicle.read')||!await capable('vehicle.manage'))
   return denied('F05_3D_CURRENT_PERMISSION_OR_TEAM_DENIED');
  // Hold the exact present Vehicle, source lineage and cycle to the session
  // transaction end; concurrent delist, source change or relist cannot make
  // the outcome depend on a stale row.
  const rows=(await c.query(
   "SELECT l.vehicle_id,l.current_cycle_id,v.source_type,v.source_sale_status,v.archived_at,cy.ended_at "+
   "FROM public.f05_3b_sync_lineages l "+
   "JOIN public.vehicles v ON v.vehicle_id=l.vehicle_id "+
   "JOIN public.vehicle_listing_cycles cy ON cy.listing_cycle_id=l.current_cycle_id AND cy.vehicle_id=v.vehicle_id "+
   "WHERE l.vehicle_id=$1 AND l.source_platform='JYT' FOR SHARE OF l,v,cy",
   [p.vehicleId])).rows;
  if(rows.length!==1||rows[0].source_type!=='wholesale'||rows[0].source_sale_status!=='active'||
     rows[0].archived_at!==null||rows[0].ended_at!==null)
   return denied('F05_3D_CURRENT_SIGNED_WHOLESALE_REQUIRED');
  const cycle=Number(rows[0].current_cycle_id);
  const actualOwners=(await c.query(
   "SELECT responsibility_id FROM public.vehicle_current_responsibilities "+
   "WHERE vehicle_id=$1 AND listing_cycle_id=$2 AND source_snapshot='wholesale' "+
   "AND revoked_at IS NULL FOR SHARE",[p.vehicleId,cycle])).rows;
  if(actualOwners.length!==0)throw Error('F05_3D_UNREVIEWED_GENERAL_SCOPE_ISSUER');
  const locks=(await c.query(
   "SELECT lock_id FROM public.locks WHERE vehicle_id=$1 AND listing_cycle_id=$2 "+
   "AND responsible_employee_id=$3 AND lock_status='active' AND expires_at>clock_timestamp() FOR SHARE",
   [p.vehicleId,cycle,actor])).rows;
  const trades=(await c.query(
   "SELECT transaction_id FROM public.transactions WHERE vehicle_id=$1 AND listing_cycle_id=$2 "+
   "AND responsible_employee_id=$3 AND completed_at IS NULL AND status NOT IN ('completed','cancelled') FOR SHARE",
   [p.vehicleId,cycle,actor])).rows;
  if(locks.length||trades.length)return denied('F05_3D_EXISTING_OBJECT_SCOPE_USE_F05_3C');
  if(checkpoint)await checkpoint('signed_general_wholesale_scope_unproven',c);
  return denied(GAP);
 },{normalOnly:true}))??denied('F05_3D_SESSION_DENIED');
}
