// F05-7: trusted F03 sessions + signed isolated PG16 source; NO production issuer.
import {createHash} from 'node:crypto';
import {connect,verify} from './migration.mjs';
import {resolveRules,tierFor,eligibleVehicle,failClosed,SOURCE} from './contract.mjs';
const sha=o=>createHash('sha256').update(JSON.stringify(o)).digest('hex');
const deny=(code,extra={})=>({allowed:false,code,...extra});
const ok=(code,extra={})=>({allowed:true,code,syntheticCIOnly:true,...extra});
const valid=x=>Number.isSafeInteger(x)&&x>0&&x<2147483647;
const goodKey=x=>typeof x==='string'&&/^[A-Za-z0-9._:-]{16,160}$/.test(x);
function gate(){
 for(const [k,v] of Object.entries({CI:'true',GITHUB_ACTIONS:'true',APP_ENV:'test',NODE_ENV:'test',F05_2_ISOLATION_CONFIRM:'I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY'}))
  if(process.env[k]!==v)throw Error('F05_7_CI_ONLY_'+k);
 if(process.env.F03_1_DATABASE_URL!=='postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test')throw Error('F05_7_DATABASE_IS_NOT_DISPOSABLE');
}
const permissionSQL="SELECT EXISTS(SELECT 1 FROM public.permissions p "+
 "JOIN public.employee_permission_overrides ov ON ov.employee_id=$1 AND ov.permission_id=p.permission_id "+
 "JOIN public.employee_capability_scope_bindings b ON b.employee_id=$1 AND b.permission_id=p.permission_id "+
 "JOIN public.employee_data_scopes sc ON sc.scope_id=b.scope_id AND sc.employee_id=$1 "+
 "JOIN public.teams t ON t.team_id=$2 JOIN public.stores st ON st.store_id=t.store_id "+
 "JOIN public.employee_team_memberships m ON m.team_id=t.team_id AND m.employee_id=$1 "+
 "JOIN public.employee_team_memberships om ON om.team_id=t.team_id AND om.employee_id=$3 "+
 "WHERE p.permission_code='matching.rule.manage.ci.synthetic' AND ov.decision='allow' "+
 "AND t.team_status='active' AND st.status='active' AND st.store_id=$4 "+
 "AND m.valid_from<=statement_timestamp() AND (m.ended_at IS NULL OR m.ended_at>statement_timestamp()) "+
 "AND om.valid_from<=statement_timestamp() AND (om.ended_at IS NULL OR om.ended_at>statement_timestamp()) "+
 "AND sc.ended_at IS NULL AND b.granted_at<=statement_timestamp() AND (b.ended_at IS NULL OR b.ended_at>statement_timestamp()) "+
 "AND ((sc.scope_kind='team' AND sc.scope_reference_id=t.team_id) OR "+
 "(sc.scope_kind='store' AND sc.scope_reference_id=st.store_id AND $5 IN ('manager','store_head'))) FOR SHARE OF p,ov,b,sc,t,st,m,om) allowed";
async function context(c,a,demandId,teamId){
 if(a.principal_kind!=='employee'||a.system_admin_id!==null||a.subject_status!=='active'||a.credential_state!=='enabled'||
  a.force_password_change||!valid(Number(a.employee_id))||!['sales','manager','store_head'].includes(a.role_code))
  return deny('F05_7_EMPLOYEE_CURRENT_SESSION_REQUIRED');
 const employeeId=Number(a.employee_id);
 const e=(await c.query('SELECT employee_id,store_id,employment_status FROM public.employees WHERE employee_id=$1 FOR SHARE',[employeeId])).rows[0];
 if(!e||e.employment_status!=='active'||e.store_id===null)return deny('F05_7_EMPLOYEE_INACTIVE');
 const d=(await c.query('SELECT demand_id,customer_id,responsible_employee_id,demand_state FROM public.demands WHERE demand_id=$1 FOR UPDATE',[demandId])).rows[0];
 if(!d||d.demand_state!=='active')return deny('F05_7_DEMAND_NOT_ACTIVE');
 const customer=(await c.query('SELECT customer_id,account_status,customer_level_id,current_owner_employee_id,owner_assignment_state FROM public.customers WHERE customer_id=$1 FOR SHARE',[d.customer_id])).rows[0];
 if(!customer||customer.account_status!=='active'||customer.owner_assignment_state!=='assigned'||!customer.current_owner_employee_id||
  Number(customer.current_owner_employee_id)!==Number(d.responsible_employee_id))
  return deny('F05_7_CUSTOMER_OR_OWNER_NOT_CURRENT');
 if(a.role_code==='sales'&&employeeId!==Number(d.responsible_employee_id))return deny('F05_7_NOT_CURRENT_OWNER');
 const policy=(await c.query("SELECT find_enabled FROM public.f05_6_level_find_policy_ci WHERE level_id=$1 AND source_marker='CI_SYNTHETIC_FIND_CAR_ENTITLEMENT_NOT_PRODUCTION' FOR SHARE",[customer.customer_level_id])).rows[0];
 if(!policy?.find_enabled)return deny('F05_7_FIND_ENTITLEMENT_NOT_CURRENT');
 const perm=(await c.query(permissionSQL,[employeeId,teamId,d.responsible_employee_id,e.store_id,a.role_code])).rows[0];
 if(!perm?.allowed)return deny('F05_7_RULE_PERMISSION_CURRENT_SCOPE_REQUIRED');
 return {allowed:true,employeeId,d,customer};
}
async function withEmployee(auth,token,operation){
 gate();
 if(!auth||typeof auth.withSession!=='function')return deny('F05_7_SIGNED_F03_EMPLOYEE_SESSION_REQUIRED');
 try{
  return (await auth.withSession(token,async(c,a,s)=>{
   if(s.restricted)return deny('F05_7_RESTRICTED_SESSION');
   await verify(c);
   return operation(c,a);
  },{normalOnly:true}))??deny('F05_7_INVALID_OR_REVOKED_SESSION');
 }catch(e){if(['55P03','40P01','40001','23505'].includes(e?.code))return deny('F05_7_CONCURRENT_CHANGE_RETRY');throw e}
}
export async function saveSalesDescriptionCI(auth,token,{demandId,teamId,description,scope={}}={}){
 if(!valid(demandId)||!valid(teamId)||typeof description!=='string'||description.length>1024)return deny('F05_7_INVALID_SALES_INPUT');
 return withEmployee(auth,token,async(c,a)=>{
  const g=await context(c,a,demandId,teamId);if(!g.allowed)return g;
  const rows=(await c.query('SELECT rule_id,phrase,scope_kind,scope_key,condition_json AS condition,rule_version FROM public.f05_7_rule_dictionary_ci WHERE valid_from<=statement_timestamp() AND (valid_until IS NULL OR valid_until>statement_timestamp()) FOR SHARE')).rows;
  const parsed=resolveRules(description,rows,scope);
  if(!parsed.ready)return deny('F05_7_NOT_MATCHING_READY',{reason:parsed.reason,conflicts:parsed.conflicts});
  const versionSha=sha(rows.map(r=>[r.rule_id,r.rule_version,r.phrase,r.condition]).sort((a,b)=>a[0]-b[0]));
  await c.query("INSERT INTO public.f05_7_sales_condition_ci(demand_id,actor_employee_id,sales_description,condition_json,conflict_json,rule_version_sha256) "+
   "VALUES($1,$2,$3,$4::jsonb,$5::jsonb,$6) ON CONFLICT(demand_id) DO UPDATE "+
   "SET actor_employee_id=excluded.actor_employee_id,sales_description=excluded.sales_description,condition_json=excluded.condition_json,"+
   "conflict_json=excluded.conflict_json,rule_version_sha256=excluded.rule_version_sha256,description_version=f05_7_sales_condition_ci.description_version+1",
   [demandId,g.employeeId,description,JSON.stringify(parsed.conditions),JSON.stringify(parsed.conflicts),versionSha]);
  return ok('F05_7_MATCHING_READY_CI',{conditions:parsed.conditions.length,unknownFields:parsed.conflicts});
 });
}
export async function calculateCI(auth,token,{demandId,vehicleId,listingCycleId,teamId,runKey}={},{checkpoint}={}){
 if(![demandId,vehicleId,listingCycleId,teamId].every(valid)||!goodKey(runKey))return deny('F05_7_INVALID_RUN');
 return withEmployee(auth,token,async(c,a)=>{
  const g=await context(c,a,demandId,teamId);if(!g.allowed)return g;
  const sales=(await c.query('SELECT condition_json,description_version,rule_version_sha256 FROM public.f05_7_sales_condition_ci WHERE demand_id=$1 FOR SHARE',[demandId])).rows[0];
  if(!sales||!Array.isArray(sales.condition_json)||sales.condition_json.length===0)return deny('F05_7_DEMAND_NOT_MATCHING_READY');
  const rows=(await c.query('SELECT rule_id,phrase,scope_kind,scope_key,condition_json,rule_version FROM public.f05_7_rule_dictionary_ci WHERE valid_from<=statement_timestamp() AND (valid_until IS NULL OR valid_until>statement_timestamp()) FOR SHARE')).rows;
  const currentSha=sha(rows.map(r=>[r.rule_id,r.rule_version,r.phrase,r.condition_json]).sort((a,b)=>a[0]-b[0]));
  if(currentSha!==sales.rule_version_sha256)return deny('F05_7_RULES_CHANGED_REPARSE_REQUIRED');
  const v=(await c.query('SELECT vehicle_id,source_sale_status,archived_at,platform_visibility FROM public.vehicles WHERE vehicle_id=$1 FOR SHARE',[vehicleId])).rows[0];
  const cy=(await c.query('SELECT listing_cycle_id,vehicle_id,ended_at FROM public.vehicle_listing_cycles WHERE listing_cycle_id=$1 AND vehicle_id=$2 FOR SHARE',[listingCycleId,vehicleId])).rows[0];
  const facts=(await c.query('SELECT facts_json,fact_version,available FROM public.f05_7_vehicle_facts_ci WHERE vehicle_id=$1 AND listing_cycle_id=$2 FOR SHARE',[vehicleId,listingCycleId])).rows[0];
  if(!cy||!eligibleVehicle({...v,...cy,available:facts?.available}))return deny('F05_7_VEHICLE_NOT_SALEABLE_ACTIVE_CYCLE');
  if(!facts)return deny('F05_7_CI_VEHICLE_FACT_SOURCE_GAP');
  const evaluation=tierFor(sales.condition_json,facts.facts_json);
  if(!evaluation.tier)return deny('F05_7_NOT_MATCHING_READY');
  const signature=sha([sales.description_version,currentSha,facts.fact_version,facts.facts_json,g.d.demand_state,g.customer.account_status,g.customer.customer_level_id,v.source_sale_status,cy.ended_at]);
  if(checkpoint)await checkpoint('before_match_result_commit',c);
  const old=(await c.query("SELECT result_id,source_signature,tier,run_key FROM public.f05_7_result_versions_ci WHERE demand_id=$1 AND vehicle_id=$2 AND listing_cycle_id=$3 AND status='current' FOR UPDATE",
   [demandId,vehicleId,listingCycleId])).rows[0];
  const repeated=(await c.query('SELECT result_id,demand_id,vehicle_id,listing_cycle_id,source_signature FROM public.f05_7_result_versions_ci WHERE run_key=$1',[runKey])).rows[0];
  if(repeated){
   if(Number(repeated.demand_id)!==demandId||Number(repeated.vehicle_id)!==vehicleId||Number(repeated.listing_cycle_id)!==listingCycleId||
    repeated.source_signature!==signature)return deny('F05_7_RUN_KEY_REUSE_COLLISION');
   return ok('F05_7_IDENTICAL_MATCH_ALREADY_RECORDED',{resultId:Number(repeated.result_id)});
  }
  if(old?.source_signature===signature)return ok('F05_7_CURRENT_SAME_FACTS',{resultId:Number(old.result_id),tier:old.tier});
  if(old)await c.query("UPDATE public.f05_7_result_versions_ci SET status='stale' WHERE result_id=$1 AND status='current'",[old.result_id]);
  const created=(await c.query("INSERT INTO public.f05_7_result_versions_ci(demand_id,vehicle_id,listing_cycle_id,tier,status,source_signature,explanations,reason,run_key) VALUES($1,$2,$3,$4,'current',$5,$6::jsonb,$7,$8) RETURNING result_id",
   [demandId,vehicleId,listingCycleId,evaluation.tier,signature,JSON.stringify(evaluation.explanations),evaluation.reason,runKey])).rows[0];
  return ok('F05_7_CURRENT_MATCH_RESULT_CI',{resultId:Number(created.result_id),tier:evaluation.tier,reason:evaluation.reason});
 });
}
export {failClosed};
