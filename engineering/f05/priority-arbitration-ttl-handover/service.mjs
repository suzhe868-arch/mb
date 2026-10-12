// PDM-13 strictly CI-synthetic implementation on signed M94-v24 PG16.
// No production Priority Issuer or HTTP positive route exists.
import {createHash} from 'node:crypto';
import {verify} from './migration.mjs';
const fail=(code,extra={})=>({allowed:false,code,...extra});
const ok=(code,extra={})=>({allowed:true,code,CI_ONLY:true,...extra});
const id=x=>Number.isSafeInteger(x)&&x>0&&x<2147483647;
const key=x=>typeof x==='string'&&/^[A-Za-z0-9._:-]{16,160}$/.test(x);
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
function gate(){
 for(const [k,v] of Object.entries({CI:'true',GITHUB_ACTIONS:'true',APP_ENV:'test',NODE_ENV:'test',
  F05_2_ISOLATION_CONFIRM:'I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY'}))
  if(process.env[k]!==v)throw Error('F05_8_CI_GATE_'+k);
 if(process.env.F03_1_DATABASE_URL!=='postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test')
  throw Error('F05_8_PRODUCTION_DB_DENIED');
}
export const productionDeny=()=>fail('F05_8_PRIORITY_ISSUER_NOT_PRODUCTION');
const scopeSQL="SELECT EXISTS(SELECT 1 FROM public.permissions p "+
 "JOIN public.employee_permission_overrides ov ON ov.employee_id=$1 AND ov.permission_id=p.permission_id "+
 "JOIN public.employee_capability_scope_bindings b ON b.employee_id=$1 AND b.permission_id=p.permission_id "+
 "JOIN public.employee_data_scopes sc ON sc.scope_id=b.scope_id AND sc.employee_id=$1 "+
 "JOIN public.teams t ON t.team_id=$2 JOIN public.stores st ON st.store_id=t.store_id "+
 "JOIN public.employee_team_memberships m ON m.team_id=t.team_id AND m.employee_id=$1 "+
 "WHERE p.permission_code=$5 AND ov.decision='allow' "+
 "AND t.team_status='active' AND st.status='active' AND st.store_id=$3 "+
 "AND m.valid_from<=statement_timestamp() AND (m.ended_at IS NULL OR m.ended_at>statement_timestamp()) "+
 "AND sc.ended_at IS NULL AND b.granted_at<=statement_timestamp() AND (b.ended_at IS NULL OR b.ended_at>statement_timestamp()) "+
 "AND ((sc.scope_kind='team' AND sc.scope_reference_id=t.team_id) OR "+
 "(sc.scope_kind='store' AND sc.scope_reference_id=st.store_id AND $4 IN ('manager','store_head'))) "+
 "FOR SHARE OF p,ov,b,sc,t,st,m) allowed";
async function actor(c,a,teamId,controlPlane=false){
 if(a?.principal_kind!=='employee'||a.system_admin_id!==null||a.subject_status!=='active'||a.credential_state!=='enabled'||
   a.force_password_change||!id(Number(a.employee_id))||!['sales','store_head','manager'].includes(a.role_code))
  return fail('F05_8_CURRENT_EMPLOYEE_SESSION_REQUIRED');
 const who=Number(a.employee_id);
 const e=(await c.query('SELECT employee_id,store_id,employment_status FROM public.employees WHERE employee_id=$1 FOR SHARE',[who])).rows[0];
 if(!e||e.employment_status!=='active'||!e.store_id)return fail('F05_8_EMPLOYEE_NOT_ACTIVE');
 const p=(await c.query(scopeSQL,[who,teamId,e.store_id,a.role_code,controlPlane?'priority.qualification.manage.ci.synthetic':'matching.rule.manage.ci.synthetic'])).rows[0];
 if(!p?.allowed)return fail('F05_8_PERMISSION_OR_DATA_SCOPE_DENIED');
 return ok('F05_8_EMPLOYEE_CURRENT_SCOPE',{employeeId:who,role:a.role_code});
}
async function session(auth,token,teamId,fn,controlPlane=false){
 gate();
 if(!id(teamId)||!auth||typeof auth.withSession!=='function')return fail('F05_8_SIGNED_F03_SESSION_REQUIRED');
 try{
  return (await auth.withSession(token,async(c,a,s)=>{
   if(s.restricted)return fail('F05_8_RESTRICTED_SESSION');
   await verify(c);
   const p=await actor(c,a,teamId,controlPlane);
   if(!p.allowed)return p;
   return fn(c,p);
  },{normalOnly:true}))??fail('F05_8_REVOKED_SESSION');
 }catch(e){
  if(['55P03','40P01','40001','23505'].includes(e.code))return fail('F05_8_CONCURRENT_RETRY',{sqlstate:e.code});
  throw e;
 }
}
const snapshot=async(c,v,cycle)=>{
 const [vehicle,lifecycle,locked,trading]=(await Promise.all([
  c.query('SELECT vehicle_id,source_sale_status,platform_visibility,archived_at FROM public.vehicles WHERE vehicle_id=$1 FOR UPDATE',[v]),
  c.query('SELECT listing_cycle_id,ended_at FROM public.vehicle_listing_cycles WHERE listing_cycle_id=$1 AND vehicle_id=$2 FOR SHARE',[cycle,v]),
  c.query("SELECT lock_id FROM public.locks WHERE vehicle_id=$1 AND listing_cycle_id=$2 AND lock_status='active' AND expires_at>statement_timestamp() ORDER BY lock_id FOR SHARE",[v,cycle]),
  c.query("SELECT transaction_id FROM public.transactions WHERE vehicle_id=$1 AND listing_cycle_id=$2 AND status IN ('trading','in_progress','pending','active') ORDER BY transaction_id FOR SHARE",[v,cycle])
 ]));
 const a=vehicle.rows[0],b=lifecycle.rows[0];
 return {available:!!a&&a.source_sale_status==='active'&&!a.archived_at&&!!b&&!b.ended_at,
  vehicle:a,cycle:b,locked:locked.rows.length,trading:trading.rows.length};
};
async function candidates(c,vehicleId,listingCycleId){
 const rows=(await c.query(
  "SELECT r.result_id,r.source_signature,r.tier,r.demand_id,d.customer_id,d.created_at,d.responsible_employee_id,"+
  "e.employment_status,cs.account_status,cs.current_owner_employee_id,cs.owner_assignment_state "+
  "FROM public.f05_7_result_versions_ci r "+
  "JOIN public.demands d ON d.demand_id=r.demand_id AND d.demand_state='active' "+
  "JOIN public.customers cs ON cs.customer_id=d.customer_id AND cs.account_status='active' "+
  "JOIN public.f05_8_qualification_ci qu ON qu.customer_id=cs.customer_id AND qu.enabled=true "+
  "JOIN public.f05_6_level_find_policy_ci fp ON fp.level_id=cs.customer_level_id AND fp.find_enabled=true "+
  "JOIN public.f05_7_sales_condition_ci sc ON sc.demand_id=d.demand_id "+
  "JOIN public.employees e ON e.employee_id=d.responsible_employee_id "+
  "LEFT JOIN public.f05_8_suppression_ci su ON su.customer_id=cs.customer_id AND su.vehicle_id=r.vehicle_id "+
   "AND su.listing_cycle_id=r.listing_cycle_id "+
  "WHERE r.vehicle_id=$1 AND r.listing_cycle_id=$2 AND r.status='current' AND r.tier IN ('high','acceptable') "+
  "AND e.employment_status='active' AND cs.owner_assignment_state='assigned' "+
  "AND d.responsible_employee_id=cs.current_owner_employee_id "+
  "AND EXISTS(SELECT 1 FROM public.permissions pe "+
  "JOIN public.employee_permission_overrides ov2 ON ov2.permission_id=pe.permission_id AND ov2.employee_id=e.employee_id AND ov2.decision='allow' "+
  "JOIN public.employee_capability_scope_bindings b2 ON b2.permission_id=pe.permission_id AND b2.employee_id=e.employee_id "+
  "JOIN public.employee_data_scopes ds ON ds.scope_id=b2.scope_id AND ds.employee_id=e.employee_id "+
  "JOIN public.employee_team_memberships tm ON tm.employee_id=e.employee_id "+
  "JOIN public.teams tt ON tt.team_id=tm.team_id "+
  "JOIN public.stores ss ON ss.store_id=tt.store_id AND ss.store_id=e.store_id "+
  "WHERE pe.permission_code='matching.rule.manage.ci.synthetic' AND tt.team_status='active' AND ss.status='active' "+
  "AND b2.granted_at<=statement_timestamp() AND (b2.ended_at IS NULL OR b2.ended_at>statement_timestamp()) "+
  "AND ds.ended_at IS NULL AND tm.valid_from<=statement_timestamp() AND (tm.ended_at IS NULL OR tm.ended_at>statement_timestamp()) "+
  "AND ((ds.scope_kind='team' AND ds.scope_reference_id=tt.team_id) OR (ds.scope_kind='store' AND ds.scope_reference_id=ss.store_id))) "+
  "AND (su.customer_id IS NULL OR su.suppressed_source_signature<>r.source_signature) "+
  "AND NOT EXISTS(SELECT 1 FROM public.f05_8_suppressed_facts_ci f WHERE f.customer_id=cs.customer_id AND f.vehicle_id=r.vehicle_id "+
  "AND f.listing_cycle_id=r.listing_cycle_id AND f.source_signature=r.source_signature) "+
  "ORDER BY CASE WHEN r.tier='high' THEN 0 ELSE 1 END,d.created_at,d.demand_id,r.result_id "+
  "FOR SHARE OF r,d,cs,qu,fp,sc,e",[vehicleId,listingCycleId])).rows;
 const used=new Set();
 return rows.filter(x=>{if(used.has(String(x.customer_id)))return false;used.add(String(x.customer_id));return true});
}
const event=async(c,{priorityId=null,customerId,vehicleId=null,eventKind,actorId=null,before={},after={},eventKey})=>{
 if(!key(eventKey))throw Error('F05_8_EVENT_KEY_INVALID');
 await c.query('INSERT INTO public.f05_8_events_ci(priority_id,customer_id,vehicle_id,event_kind,actor_employee_id,before_json,after_json,event_key) VALUES($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8)',
  [priorityId,customerId,vehicleId,eventKind,actorId,JSON.stringify(before),JSON.stringify(after),eventKey]);
};
async function endActive(c,p,reason,employeeId=null,endedAt=null){
 const upd=(await c.query("UPDATE public.f05_8_priority_ci SET status='ended',ended_at=COALESCE($4::timestamptz,transaction_timestamp()),ended_reason=$2,ended_by_employee_id=$3 WHERE priority_id=$1 AND status='active' RETURNING *",
  [p.priority_id,reason,employeeId,endedAt])).rows[0];
 if(!upd)return null;
 await event(c,{priorityId:upd.priority_id,customerId:upd.customer_id,vehicleId:upd.vehicle_id,eventKind:'ended',actorId:employeeId,
  before:{status:'active',trigger:upd.trigger_demand_id},after:{reason},eventKey:'end:'+String(upd.priority_id)+':'+reason});
 return upd;
}

async function suppressCustomerFacts(c,p,reason){
 const args=[p.customer_id,p.vehicle_id,p.listing_cycle_id,p.source_signature,p.priority_id,reason];
 await c.query("INSERT INTO public.f05_8_suppression_ci(customer_id,vehicle_id,listing_cycle_id,suppressed_source_signature,original_priority_id,reason) "+
  "VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(customer_id,vehicle_id,listing_cycle_id) DO UPDATE "+
  "SET suppressed_source_signature=excluded.suppressed_source_signature,original_priority_id=excluded.original_priority_id,reason=excluded.reason,recorded_at=transaction_timestamp()",args);
 await c.query("INSERT INTO public.f05_8_suppressed_facts_ci(customer_id,vehicle_id,listing_cycle_id,source_signature,original_priority_id,reason) "+
  "VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING",args);
 await c.query("INSERT INTO public.f05_8_suppressed_facts_ci(customer_id,vehicle_id,listing_cycle_id,source_signature,original_priority_id,reason) "+
  "SELECT $1,$2,$3,r.source_signature,$4,$5 FROM public.f05_7_result_versions_ci r JOIN public.demands d ON d.demand_id=r.demand_id "+
  "WHERE d.customer_id=$1 AND r.vehicle_id=$2 AND r.listing_cycle_id=$3 ON CONFLICT DO NOTHING",
  [p.customer_id,p.vehicle_id,p.listing_cycle_id,p.priority_id,reason]);
}
async function reArbitrate(c,vehicleId,listingCycleId,runKey,employeeId,checkpoint,asOf=new Date()){
 const ss=await snapshot(c,vehicleId,listingCycleId);
 if(checkpoint)await checkpoint('after_vehicle_lock_before_priority_decision',c);
 const rows=await candidates(c,vehicleId,listingCycleId);
 const existing=(await c.query("SELECT * FROM public.f05_8_priority_ci WHERE vehicle_id=$1 AND listing_cycle_id=$2 AND status='active' FOR UPDATE",
 [vehicleId,listingCycleId])).rows[0];
 if(existing){
  // The due event must settle expiry before inspecting the current Match:
  // a stale Demand is not allowed to change ttl_expired into match_invalidated.
  if(new Date(existing.expires_at).getTime()<=new Date(asOf).getTime()){
   await endActive(c,existing,'ttl_expired',null,asOf);
   await suppressCustomerFacts(c,existing,'ttl_expired');
  }else{
   const winner=rows.find(x=>Number(x.customer_id)===Number(existing.customer_id));
   if(!ss.available||ss.locked||ss.trading||!winner){
    await endActive(c,existing,!ss.available?'vehicle_unavailable':ss.locked?'lock_takeover':ss.trading?'transaction_started':'match_invalidated');
   }else{
    const changed=Number(existing.trigger_demand_id)!==Number(winner.demand_id)||
     Number(existing.responsible_employee_id)!==Number(winner.responsible_employee_id)||
     Number(existing.source_match_result_id)!==Number(winner.result_id);
    if(changed){
     await c.query("UPDATE public.f05_8_priority_ci SET trigger_demand_id=$2,responsible_employee_id=$3,source_match_result_id=$4,source_signature=$5 WHERE priority_id=$1",
      [existing.priority_id,winner.demand_id,winner.responsible_employee_id,winner.result_id,winner.source_signature]);
     await event(c,{priorityId:existing.priority_id,customerId:existing.customer_id,vehicleId,eventKind:'trigger_demand_replaced',
      actorId:employeeId,before:{demandId:existing.trigger_demand_id},after:{demandId:winner.demand_id,ttlUnchanged:true},eventKey:runKey+':replace'});
    }
    return ok('F05_8_EXISTING_ACTIVE_PRIORITY',{priorityId:Number(existing.priority_id),customerId:Number(existing.customer_id),
     triggerDemandId:Number(winner.demand_id),expiresAt:existing.expires_at,created:false});
   }
  }
 }
 if(!ss.available||ss.locked||ss.trading)return ok('F05_8_VEHICLE_OCCUPIED_OR_NOT_SALEABLE',{created:false,locked:ss.locked,trading:ss.trading});
 const fresh=await candidates(c,vehicleId,listingCycleId);
 const best=fresh[0];
 if(!best)return ok('F05_8_NO_LEGAL_PRIORITY_CANDIDATE',{created:false});
 const repeated=(await c.query('SELECT priority_id,status FROM public.f05_8_priority_ci WHERE creation_key=$1',[runKey])).rows[0];
 if(repeated)return fail('F05_8_PREVIOUS_CREATION_KEY_REPLAY_DENIED',{oldPriorityId:Number(repeated.priority_id)});
 const ttl=Number((await c.query('SELECT ttl_seconds FROM public.f05_8_config_ci WHERE singleton=true FOR SHARE')).rows[0].ttl_seconds);
 const inserted=(await c.query("INSERT INTO public.f05_8_priority_ci(customer_id,vehicle_id,listing_cycle_id,trigger_demand_id,"+
  "responsible_employee_id,source_match_result_id,source_signature,expires_at,creation_key) "+
  "VALUES($1,$2,$3,$4,$5,$6,$7,transaction_timestamp()+($8::integer*interval '1 second'),$9) RETURNING *",
  [best.customer_id,vehicleId,listingCycleId,best.demand_id,best.responsible_employee_id,best.result_id,best.source_signature,ttl,runKey])).rows[0];
 await event(c,{priorityId:inserted.priority_id,customerId:best.customer_id,vehicleId,eventKind:'created',actorId:employeeId,
  after:{rank:best.tier,triggerDemandId:best.demand_id,sourceResultId:best.result_id,ttlSeconds:ttl},
  eventKey:runKey+':created'});
 return ok('F05_8_ACTIVE_PRIORITY_CREATED',{priorityId:Number(inserted.priority_id),customerId:Number(best.customer_id),
  triggerDemandId:Number(best.demand_id),expiresAt:inserted.expires_at,created:true});
}
export async function arbitrateCI(auth,token,{teamId=901,vehicleId,listingCycleId,runKey,checkpoint}={}){
 if(!id(vehicleId)||!id(listingCycleId)||!key(runKey))return fail('F05_8_INVALID_ARBITRATION_ARGUMENTS');
 return session(auth,token,teamId,async(c,a)=>{
  return reArbitrate(c,vehicleId,listingCycleId,runKey,a.employeeId,checkpoint);
 });
}
export async function setQualificationCI(auth,token,{teamId=901,customerId,enabled,eventKey}={}){
 if(!id(customerId)||typeof enabled!=='boolean'||!key(eventKey))return fail('F05_8_INVALID_QUALIFICATION');
 return session(auth,token,teamId,async(c,a)=>{
  const customer=(await c.query('SELECT customer_id FROM public.customers WHERE customer_id=$1 FOR UPDATE',[customerId])).rows[0];
  if(!customer)return fail('F05_8_CUSTOMER_NOT_PRESENT');
  if((await c.query('SELECT 1 FROM public.f05_8_events_ci WHERE event_key=$1',[eventKey])).rowCount)return ok('F05_8_QUALIFICATION_EVENT_ALREADY_APPLIED');
  const old=(await c.query('SELECT enabled FROM public.f05_8_qualification_ci WHERE customer_id=$1 FOR UPDATE',[customerId])).rows[0];
  await c.query('INSERT INTO public.f05_8_qualification_ci(customer_id,enabled,updated_by_employee_id) VALUES($1,$2,$3) ON CONFLICT(customer_id) DO UPDATE SET enabled=excluded.enabled,updated_by_employee_id=excluded.updated_by_employee_id,version=f05_8_qualification_ci.version+1,changed_at=transaction_timestamp()',[customerId,enabled,a.employeeId]);
  await event(c,{customerId,eventKind:enabled?'qualification_enabled':'qualification_disabled',actorId:a.employeeId,
   before:{enabled:old?.enabled??false},after:{enabled},eventKey});
  const released=[],rechecked=[];
  if(enabled){
   // PDM-13 §3: switching on a per-Customer qualification must re-evaluate
   // their *existing* current PDM-12 high/acceptable Matches immediately.
   // No Application or Demand is created and existing Vehicle TTL is never extended.
   const affected=(await c.query("SELECT DISTINCT r.vehicle_id,r.listing_cycle_id FROM public.f05_7_result_versions_ci r "+
    "JOIN public.demands d ON d.demand_id=r.demand_id "+
    "WHERE d.customer_id=$1 AND d.demand_state='active' AND r.status='current' "+
    "AND r.tier IN ('high','acceptable') ORDER BY r.vehicle_id,r.listing_cycle_id",[customerId])).rows;
   for(const v of affected){
    const result=await reArbitrate(c,Number(v.vehicle_id),Number(v.listing_cycle_id),
      eventKey+':affected:'+v.vehicle_id+':'+v.listing_cycle_id,a.employeeId);
    rechecked.push({vehicleId:Number(v.vehicle_id),listingCycleId:Number(v.listing_cycle_id),decision:result.code});
   }
  }
  if(!enabled){
   const rows=(await c.query("SELECT * FROM public.f05_8_priority_ci WHERE customer_id=$1 AND status='active' ORDER BY priority_id FOR UPDATE",[customerId])).rows;
   for(const p of rows){await endActive(c,p,'priority_customer_disabled',a.employeeId);released.push({vehicleId:Number(p.vehicle_id),cycleId:Number(p.listing_cycle_id)});}
   for(const v of released)await reArbitrate(c,v.vehicleId,v.cycleId,eventKey+':v'+v.vehicleId,a.employeeId);
  }
  return ok('F05_8_QUALIFICATION_CI_CHANGED',{enabled,released:released.length,rechecked});
 },true);
}
export async function setTTLDefaultCI(auth,token,{teamId=901,seconds,eventKey}={}){
 if(!Number.isSafeInteger(seconds)||seconds<60||seconds>2592000||!key(eventKey))return fail('F05_8_INVALID_TTL_CONFIG');
 return session(auth,token,teamId,async(c,a)=>{
  if((await c.query('SELECT 1 FROM public.f05_8_events_ci WHERE event_key=$1',[eventKey])).rowCount)return ok('F05_8_CONFIG_EVENT_ALREADY_APPLIED');
  const old=(await c.query('SELECT ttl_seconds FROM public.f05_8_config_ci WHERE singleton=true FOR UPDATE')).rows[0];
  await c.query('UPDATE public.f05_8_config_ci SET ttl_seconds=$1,version=version+1 WHERE singleton=true',[seconds]);
  const cust=(await c.query('SELECT customer_id FROM public.f05_8_qualification_ci ORDER BY customer_id LIMIT 1')).rows[0];
  if(!cust)throw Error('F05_8_CONFIG_AUDIT_REQUIRES_CI_ACTOR');
  await event(c,{customerId:cust.customer_id,eventKind:'config_ttl_changed',actorId:a.employeeId,before:{seconds:old.ttl_seconds},after:{seconds},eventKey});
  return ok('F05_8_TTL_DEFAULT_CHANGED',{previous:Number(old.ttl_seconds),seconds});
 },true);
}
export async function releaseCI(auth,token,{teamId=901,priorityId,eventKey}={}){
 if(!id(priorityId)||!key(eventKey))return fail('F05_8_INVALID_RELEASE');
 return session(auth,token,teamId,async(c,a)=>{
  const original=(await c.query('SELECT * FROM public.f05_8_priority_ci WHERE priority_id=$1',[priorityId])).rows[0];
  if(!original||original.status!=='active')return fail('F05_8_PRIORITY_NOT_CURRENT');
  // Reconcile changed Demand/Match first. This locks Vehicle before Priority,
  // avoiding inverse-lock deadlocks and forbidding release from a stale trigger.
  await reArbitrate(c,Number(original.vehicle_id),Number(original.listing_cycle_id),eventKey+':validate',a.employeeId);
  const p=(await c.query('SELECT * FROM public.f05_8_priority_ci WHERE priority_id=$1 FOR UPDATE',[priorityId])).rows[0];
  if(!p||p.status!=='active')return fail('F05_8_PRIORITY_INVALIDATED_BEFORE_RELEASE');
  const d=(await c.query('SELECT responsible_employee_id,demand_state FROM public.demands WHERE demand_id=$1 FOR SHARE',[p.trigger_demand_id])).rows[0];
  if(d?.demand_state!=='active')return fail('F05_8_TRIGGER_DEMAND_NOT_CURRENT');
  if(Number(d?.responsible_employee_id)!==a.employeeId||Number(p.responsible_employee_id)!==a.employeeId)
   return fail('F05_8_ONLY_CURRENT_TRIGGER_RESPONSIBLE_MAY_RELEASE');
  if((await c.query('SELECT 1 FROM public.f05_8_events_ci WHERE event_key=$1',[eventKey])).rowCount)return fail('F05_8_RELEASE_EVENT_REPLAY');
  await endActive(c,p,'employee_released',a.employeeId);
  await suppressCustomerFacts(c,p,'employee_released');
 await event(c,{priorityId,customerId:p.customer_id,vehicleId:p.vehicle_id,eventKind:'employee_released',actorId:a.employeeId,
   after:{suppressed:true},eventKey});
  const next=await reArbitrate(c,Number(p.vehicle_id),Number(p.listing_cycle_id),eventKey+':rearb',a.employeeId);
  return ok('F05_8_RELEASED_AND_REARBITRATED',{next});
 });
}
export async function priorityProjectionCI(auth,token,{teamId=901,vehicleId,listingCycleId,customerId}={}){
 if(!id(vehicleId)||!id(listingCycleId)||!id(customerId))return fail('F05_8_INVALID_PROJECTION');
 return session(auth,token,teamId,async(c,a)=>{
  const vehicle=(await c.query('SELECT source_sale_status,platform_visibility,archived_at FROM public.vehicles WHERE vehicle_id=$1 FOR SHARE',[vehicleId])).rows[0];
 const cycle=(await c.query('SELECT ended_at FROM public.vehicle_listing_cycles WHERE listing_cycle_id=$1 AND vehicle_id=$2 FOR SHARE',[listingCycleId,vehicleId])).rows[0];
 const customer=(await c.query("SELECT cs.account_status,fp.find_enabled FROM public.customers cs "+
  "LEFT JOIN public.f05_6_level_find_policy_ci fp ON fp.level_id=cs.customer_level_id "+
  "WHERE cs.customer_id=$1 FOR SHARE OF cs",[customerId])).rows[0];
 const active=(await c.query("SELECT priority_id,customer_id,responsible_employee_id FROM public.f05_8_priority_ci WHERE vehicle_id=$1 AND listing_cycle_id=$2 AND status='active' AND expires_at>statement_timestamp() FOR SHARE",[vehicleId,listingCycleId])).rows[0];
 const legalGrant=(await c.query("SELECT EXISTS(SELECT 1 FROM public.vehicle_visibility_grants vg "+
  "JOIN public.recommendations rec ON rec.recommendation_id=vg.source_recommendation_id "+
  "WHERE vg.vehicle_id=$1 AND vg.customer_id=$2 AND vg.revoked_at IS NULL AND "+
  "rec.listing_cycle_id=$3 AND rec.status='active') allowed",[vehicleId,customerId,listingCycleId])).rows[0]?.allowed??false;
 const occupied=(await c.query("SELECT "+
  "EXISTS(SELECT 1 FROM public.locks WHERE vehicle_id=$1 AND listing_cycle_id=$2 AND lock_status='active' AND expires_at>statement_timestamp()) locked,"+
  "EXISTS(SELECT 1 FROM public.transactions WHERE vehicle_id=$1 AND listing_cycle_id=$2 AND status IN ('trading','in_progress','pending','active')) trading",
  [vehicleId,listingCycleId])).rows[0];
 const available=!!vehicle&&vehicle.source_sale_status==='active'&&!vehicle.archived_at&&!!cycle&&!cycle.ended_at&&!occupied?.locked&&!occupied?.trading;
 const entitled=customer?.account_status==='active'&&customer?.find_enabled===true;
 return ok('F05_8_PRIORITY_SAFE_PROJECTION',{
  publicVisible:!!available&&vehicle.platform_visibility==='visible'&&!active,
  customerVisible:!!legalGrant&&available&&entitled&&(!active||Number(active.customer_id)===customerId),
  protectedByActivePriority:!!active,employeeWorkVisible:!!active&&Number(active.responsible_employee_id)===a.employeeId,
  poolProtected:!!active,existingGrantRetained:!!legalGrant,
  currentCustomerEligible:!!entitled,currentCycleAvailable:!!cycle&&!cycle.ended_at});
 });
}
export async function initiateHandoverCI(auth,token,{teamId=901,priorityId,eventKey}={}){
 if(!id(priorityId)||!key(eventKey))return fail('F05_8_INVALID_HANDOVER');
 return session(auth,token,teamId,async(c,a)=>{
  const p=(await c.query("SELECT * FROM public.f05_8_priority_ci WHERE priority_id=$1 AND status='active' FOR UPDATE",[priorityId])).rows[0];
  if(!p)return fail('F05_8_HANDOVER_NO_CURRENT_PRIORITY');
  const original=Number(p.responsible_employee_id);
  const h=(await c.query("INSERT INTO public.f05_8_handover_ci(priority_id,original_responsible_employee_id) VALUES($1,$2) "+
  "ON CONFLICT(priority_id) DO UPDATE SET updated_at=transaction_timestamp() RETURNING handover_id,state",[priorityId,original])).rows[0];
  if(!(await c.query('SELECT 1 FROM public.f05_8_events_ci WHERE event_key=$1',[eventKey])).rowCount)
   await event(c,{priorityId,customerId:p.customer_id,vehicleId:p.vehicle_id,eventKind:'handover_initiated',actorId:a.employeeId,
    before:{originalResponsible:original},after:{handoverId:h.handover_id},eventKey});
  return ok('F05_8_HANDOVER_PENDING',{handoverId:Number(h.handover_id),expiresAt:p.expires_at});
 });
}
export async function retryHandoverCI(auth,token,{teamId=901,handoverId,targetEmployeeId,injectFail=false,eventKey}={}){
 if(!id(handoverId)||!id(targetEmployeeId)||!key(eventKey))return fail('F05_8_INVALID_HANDOVER_RETRY');
 return session(auth,token,teamId,async(c,a)=>{
  // R07 canonical lock order: Vehicle -> active Priority -> Handover.
  // Source changes and expiry use the same vehicle-first order.
  const locator=(await c.query("SELECT p.vehicle_id,p.priority_id FROM public.f05_8_handover_ci h "+
   "JOIN public.f05_8_priority_ci p ON p.priority_id=h.priority_id WHERE h.handover_id=$1",[handoverId])).rows[0];
  if(!locator)return fail('F05_8_HANDOVER_UNKNOWN');
  await c.query('SELECT 1 FROM public.vehicles WHERE vehicle_id=$1 FOR UPDATE',[locator.vehicle_id]);
  const p=(await c.query('SELECT * FROM public.f05_8_priority_ci WHERE priority_id=$1 FOR UPDATE',[locator.priority_id])).rows[0];
  const h=(await c.query('SELECT * FROM public.f05_8_handover_ci WHERE handover_id=$1 FOR UPDATE',[handoverId])).rows[0];
  if(!h||h.state==='completed')return ok('F05_8_HANDOVER_ALREADY_COMPLETED',{handled:false});
  if(!p||p.status!=='active'||new Date(p.expires_at).getTime()<=Date.now())return fail('F05_8_HANDOVER_PRIORITY_ENDED_OR_EXPIRED');
  const to=(await c.query('SELECT employment_status FROM public.employees WHERE employee_id=$1 FOR SHARE',[targetEmployeeId])).rows[0];
  const approvedScope=(await c.query('SELECT public.f05_8_responsible_authorized_ci($1) allowed',[targetEmployeeId])).rows[0].allowed;
  const validTarget=!injectFail&&to?.employment_status==='active'&&approvedScope===true&&
   Number(p.responsible_employee_id)!==targetEmployeeId&&
   (await c.query('SELECT public.f05_8_handover_source_valid_ci($1) valid',[p.priority_id])).rows[0].valid===true;
  const attempt=Number(h.attempt_count)+1;
  if(validTarget){
   await c.query("UPDATE public.f05_8_priority_ci SET responsible_employee_id=$2 WHERE priority_id=$1",[p.priority_id,targetEmployeeId]);
   await c.query("UPDATE public.f05_8_handover_ci SET state='completed',error_reason=NULL,new_responsible_employee_id=$2,attempt_count=$3,updated_at=transaction_timestamp() WHERE handover_id=$1",
    [handoverId,targetEmployeeId,attempt]);
   await c.query("INSERT INTO public.f05_8_handover_attempts_ci(handover_id,attempt_no,target_employee_id,outcome) VALUES($1,$2,$3,'completed')",
    [handoverId,attempt,targetEmployeeId]);
  }else{
   await c.query("UPDATE public.f05_8_handover_ci SET state='failed',error_reason='F05_8_CI_SYNTHETIC_INVALID_HANDOVER_TARGET',attempt_count=$2,updated_at=transaction_timestamp() WHERE handover_id=$1",[handoverId,attempt]);
   await c.query("INSERT INTO public.f05_8_handover_attempts_ci(handover_id,attempt_no,target_employee_id,outcome,error_reason) VALUES($1,$2,$3,'failed','F05_8_CI_SYNTHETIC_INVALID_HANDOVER_TARGET')",
    [handoverId,attempt,targetEmployeeId]);
  }
  await event(c,{priorityId:p.priority_id,customerId:p.customer_id,vehicleId:p.vehicle_id,eventKind:validTarget?'handover_completed':'handover_failed',
   actorId:a.employeeId,before:{responsible:p.responsible_employee_id},after:{targetEmployeeId,attempt,validTarget},eventKey});
  return ok('F05_8_HANDOVER_ATTEMPT_RECORDED',{completed:validTarget,attempt});
 });
}

/**
 * CI-only due-event worker: a controlled clock can exercise the actual v24
 * lifecycle without sleeping for the default 24-hour TTL. No production
 * scheduler, HTTP Issuer, or external integration is registered.
 */
export async function processDuePrioritiesCI(auth,token,{teamId=901,eventKey,asOf}={}){
 if(!key(eventKey)||eventKey.length>100)return fail('F05_8_DUE_EVENT_KEY_INVALID');
 const at=asOf===undefined?new Date():new Date(asOf);
 if(!Number.isFinite(at.getTime())||at.getTime()<Date.now()-3600000||at.getTime()>Date.now()+31*86400000)
  return fail('F05_8_DUE_CI_CLOCK_INVALID');
 return session(auth,token,teamId,async(c,a)=>{
  const due=(await c.query("SELECT priority_id,vehicle_id,listing_cycle_id FROM public.f05_8_priority_ci "+
   "WHERE status='active' AND expires_at<=$1 ORDER BY vehicle_id,listing_cycle_id,priority_id",[at])).rows;
  const settled=[];
  for(const p of due){
   const outcome=await reArbitrate(c,Number(p.vehicle_id),Number(p.listing_cycle_id),
    eventKey+':due:'+p.priority_id,a.employeeId,null,at);
   settled.push({priorityId:Number(p.priority_id),vehicleId:Number(p.vehicle_id),outcome:outcome.code});
  }
  return ok('F05_8_DUE_SCOPES_SETTLED',{dueCount:due.length,settled});
 });
}
