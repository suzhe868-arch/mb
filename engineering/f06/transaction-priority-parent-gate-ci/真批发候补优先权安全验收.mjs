// PG1-C01：真JYT当期车＋F05-7签名Match＋F05-8资格＋原F06-1候补＋F06-5B交易
// 补丁安装前形成不变原始事实，补丁安装后使用v2真实4A取消，在PG内要求候补仍优先、零新Priority/created。
import assert from 'node:assert/strict';
import {intakeCI,decisionCI} from '../lockrequest-approval-waitlist-ci/service.mjs';
import {openGuardedSyntheticTransactionCI} from '../lock-refund-conversion-guard-ci/service.mjs';
import {setQualificationCI} from '../../f05/priority-arbitration-ttl-handover/service.mjs';
import {calculateCI,saveSalesDescriptionCI} from '../../f05/deterministic-matching-readiness-four-tier/service.mjs';
import {cancelSyntheticTransactionV2CI} from './signed-cancel-v2.mjs';
import {historicalSignedService} from './冻结父历史签名适配.mjs';
import {withF063A} from '../lock-transaction-ci/migration.mjs';
import {withF062} from '../deposit-ledger-ci/migration.mjs';
import {withParentBranch} from '../lock-lifecycle-ci/migration.mjs';
import {oldRef} from './真实取消前后对照.mjs';
import {signedCancelUnderNativeVehicleRace} from './原生双Backend并发.mjs';
const mk=x=>'pg1-c01-'+process.env.GITHUB_RUN_ID+'-'+x;
const one=async(c,s,a=[])=> (await c.query(s,a)).rows[0];

/** 仅为本可销毁PG16测试构造原5B真实经理权限，不放宽冻结服务。 */
async function authorizeManagerForSignedLockInNativeCI(c,lockId){
 const l=await one(c,"SELECT responsible_employee_id FROM public.locks WHERE lock_id=$1 AND lock_status='active'",[lockId]);
 assert.ok(l,'PG1_5B_SIGNED_LOCK_REQUIRED');
 const m=await one(c,"SELECT r.role_code FROM public.employees e JOIN public.roles r ON r.role_id=e.main_role_id WHERE e.employee_id=1 AND e.employment_status='active'");
 assert.equal(m?.role_code,'manager','PG1_5B_MANAGER_ROLE_REQUIRED');
 const team=await one(c,"SELECT s.scope_id,t.team_id FROM public.employee_team_memberships a "+
  "JOIN public.employee_team_memberships b ON b.team_id=a.team_id AND b.employee_id=$1 "+
  "JOIN public.employee_data_scopes s ON s.employee_id=a.employee_id AND s.scope_kind='team' AND s.scope_reference_id=a.team_id "+
  "JOIN public.teams t ON t.team_id=a.team_id AND t.team_status='active' "+
  "JOIN public.stores st ON st.store_id=t.store_id AND st.status='active' "+
  "WHERE a.employee_id=1 AND a.valid_from<=clock_timestamp() AND b.valid_from<=clock_timestamp() "+
  "AND a.ended_at IS NULL AND b.ended_at IS NULL AND s.ended_at IS NULL LIMIT 1",
  [l.responsible_employee_id]);
 assert.ok(team,'PG1_5B_MANAGER_MUST_SHARE_REAL_TEAM_SCOPE');
 const open=await one(c,"SELECT p.permission_id FROM public.permissions p "+
  "JOIN public.employee_permission_overrides o ON o.permission_id=p.permission_id AND o.employee_id=1 AND o.decision='allow' "+
  "JOIN public.employee_capability_scope_bindings b ON b.permission_id=p.permission_id AND b.employee_id=1 AND b.scope_id=$1 AND b.ended_at IS NULL "+
  "WHERE p.permission_code='transaction.ci.open' LIMIT 1",[team.scope_id]);
 assert.ok(open,'PG1_5B_SIGNED_OPEN_PERMISSION_SCOPE_REQUIRED');
 let manage=await one(c,"SELECT permission_id FROM public.permissions WHERE permission_code='transaction.ci.manage'");
 if(!manage)manage=await one(c,"INSERT INTO public.permissions(permission_id,permission_code) VALUES(969106,'transaction.ci.manage') RETURNING permission_id");
 const prev=await one(c,"SELECT decision FROM public.employee_permission_overrides WHERE employee_id=1 AND permission_id=$1",[manage.permission_id]);
 assert.ok(!prev||prev.decision==='allow','PG1_5B_PREEXISTING_DENY_MUST_NOT_BE_REPLACED');
 if(!prev)await c.query("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES(1,$1,'allow',clock_timestamp())",[manage.permission_id]);
 const bound=await one(c,"SELECT 1 FROM public.employee_capability_scope_bindings WHERE employee_id=1 AND permission_id=$1 AND scope_id=$2 AND ended_at IS NULL",[manage.permission_id,team.scope_id]);
 if(!bound)await c.query("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at) VALUES(1,$1,$2,clock_timestamp()-interval '2 minutes')",[manage.permission_id,team.scope_id]);
 return{teamId:Number(team.team_id),responsibleId:Number(l.responsible_employee_id),managerGrantedWithinSignedTeam:true};
}
export async function prepareRealJytWaitlist(c,{auth,token,managerToken=token}){
 const fresh=await one(c,"SELECT l.vehicle_id,l.current_cycle_id,l.model_year FROM public.f05_3b_sync_lineages l "+
  "JOIN public.vehicles v ON v.vehicle_id=l.vehicle_id "+
  "JOIN public.vehicle_listing_cycles cy ON cy.listing_cycle_id=l.current_cycle_id "+
  "LEFT JOIN public.f05_7_vehicle_facts_ci f ON f.vehicle_id=l.vehicle_id AND f.listing_cycle_id=l.current_cycle_id "+
  "WHERE v.source_type='wholesale' AND v.source_sale_status='active' AND cy.ended_at IS NULL AND f.vehicle_id IS NULL "+
  "AND NOT EXISTS(SELECT 1 FROM public.locks k WHERE k.vehicle_id=l.vehicle_id AND k.lock_status='active') "+
  "AND NOT EXISTS(SELECT 1 FROM public.f05_8_priority_ci p WHERE p.vehicle_id=l.vehicle_id AND p.status='active') ORDER BY l.vehicle_id LIMIT 1");
 assert.ok(fresh,'PG1_C01_JYT_CURRENT_SYNC_LINEAGE_REQUIRED');
 const vehicleId=Number(fresh.vehicle_id),cycle=Number(fresh.current_cycle_id),customerId=899621;
 const signedF06=fn=>withF063A(()=>withF062(()=>withParentBranch(fn)));
 const f=await signedF06(()=>intakeCI(c,{customerId,vehicleId,listingCycleId:cycle,
  requestKey:mk('first'),syntheticPhoneConsent:'CI_SYNTHETIC_PHONE_CONSENT_NOT_PRODUCTION'}));
 const s=await signedF06(()=>intakeCI(c,{customerId:86180102,vehicleId,listingCycleId:cycle,
  requestKey:mk('rival'),syntheticPhoneConsent:'CI_SYNTHETIC_PHONE_CONSENT_NOT_PRODUCTION'}));
 assert.equal(f.code,'F06_1_PENDING_CREATED',JSON.stringify(f));
 assert.equal(s.code,'F06_1_PENDING_CREATED',JSON.stringify(s));
 await c.query("INSERT INTO public.f05_7_vehicle_facts_ci(vehicle_id,listing_cycle_id,facts_json) VALUES($1,$2,$3::jsonb)",
 [vehicleId,cycle,JSON.stringify({
  model_year:{value:Number(fresh.model_year),source:'CI_JYT_SIGNED_SOURCE_STRUCTURED_NOT_PRODUCTION'},
  mileage_km:{value:42000,source:'CI_SYNTHETIC_STRUCTURED_NOT_PRODUCTION'},
  exterior_color:{value:'black',source:'CI_SYNTHETIC_STRUCTURED_NOT_PRODUCTION'},
  interior_color:{value:'beige',source:'CI_SYNTHETIC_INSPECTION_NOT_PRODUCTION'},
  budget_cents:{value:10000000,source:'CI_SYNTHETIC_DISPLAY_ONLY_NOT_PRODUCTION'}
 })]);
 const demand=await one(c,"SELECT demand_id FROM public.demands WHERE customer_id=$1 AND demand_state='active' ORDER BY demand_id LIMIT 1",[customerId]);
 assert.ok(demand,'PG1_C01_ACTIVE_CUSTOMER_DEMAND_REQUIRED');
 const enabled=await setQualificationCI(historicalSignedService(auth,22,{afterPatch:false}),token,{
  teamId:901,customerId,enabled:true,eventKey:mk('qualify')
 });
 assert.equal(enabled.allowed,true,JSON.stringify(enabled));
 const d=await saveSalesDescriptionCI(historicalSignedService(auth,21,{afterPatch:false}),token,{
  demandId:Number(demand.demand_id),teamId:901,
  description:'奥迪A6 2026款 5万公里以内 黑色外观 米色内饰 预算10万'
 });
 assert.equal(d.allowed,true,JSON.stringify(d));
 const match=await calculateCI(historicalSignedService(auth,21,{afterPatch:false}),managerToken,{
  demandId:Number(demand.demand_id),vehicleId,listingCycleId:cycle,
  teamId:901,runKey:mk('current-jyt-match')
 });
 assert.equal(match.allowed,true,JSON.stringify(match));
 assert.ok(['high','acceptable'].includes(match.tier),'PG1_C01_SIGNED_HIGH_ACCEPTABLE_MATCH_REQUIRED');
 const active=await one(c,"SELECT priority_id,customer_id FROM public.f05_8_priority_ci WHERE vehicle_id=$1 AND listing_cycle_id=$2 AND status='active'",[vehicleId,cycle]);
 assert.ok(active,'PG1_C01_PARENT_SOURCE_PRIORITY_REQUIRED');
 assert.equal(Number(active.customer_id),customerId);
 const accepted=await signedF06(()=>decisionCI(auth,managerToken,{
  requestId:f.requestId,requestKey:mk('first-approved'),action:'approve'
 }));
 assert.equal(accepted.code,'F06_1_APPROVED_ATOMIC_LOCK',JSON.stringify(accepted));
 const managerScopeEvidence=await authorizeManagerForSignedLockInNativeCI(c,accepted.lockId);
 const queued=await one(c,"SELECT status,resulting_waitlist_id FROM public.lock_requests WHERE lock_request_id=$1",[s.requestId]);
 assert.equal(queued.status,'lock_conflict');
 assert.ok(queued.resulting_waitlist_id);
 const waiting=await one(c,"SELECT w.waitlist_id,w.ended_at,s.source_request_id FROM public.waitlists w "+
  "JOIN f06_1_lock_ci.waitlist_sources s ON s.waitlist_id=w.waitlist_id "+
  "WHERE w.vehicle_id=$1 AND w.listing_cycle_id=$2 AND w.ended_at IS NULL",[vehicleId,cycle]);
 assert.ok(waiting);
 assert.equal(Number(waiting.source_request_id),s.requestId);
 const t=await oldRef('feat/f06-5b-lock-refund-conversion-guard-ci',()=>openGuardedSyntheticTransactionCI(auth,managerToken,{
  lockId:accepted.lockId,eventKey:mk('5b-transaction')
 }));
 assert.equal(t.code,'F06_5B_ATOMIC_SYNTHETIC_IN_PROGRESS',JSON.stringify(t));
 const refreshed=await calculateCI(historicalSignedService(auth,21,{afterPatch:false}),managerToken,{
  demandId:Number(demand.demand_id),vehicleId,listingCycleId:cycle,
  teamId:901,runKey:mk('refreshed-match-during-5b')
 });
 assert.equal(refreshed.allowed,true,JSON.stringify(refreshed));
 assert.ok(['high','acceptable'].includes(refreshed.tier));
 const pre=await one(c,"SELECT count(*)::int n FROM public.f05_8_priority_ci WHERE vehicle_id=$1 AND listing_cycle_id=$2 AND status='active'",[vehicleId,cycle]);
 assert.equal(pre.n,0);
 return {vehicleId,listingCycleId:cycle,customerId,transactionId:t.transactionId,
  matchTier:refreshed.tier,waitlistId:Number(waiting.waitlist_id),
  originalPriorityId:Number(active.priority_id),lockId:accepted.lockId,managerScopeEvidence,
  source:'REAL_F05_3B_JYT_F05_7_F05_8_F06_1_F06_5B_NATIVE'};
}
async function requireCurrentSignedJytMatch(c,{vehicleId,listingCycleId,customerId},label){
 const x=await one(c,"SELECT count(*)::int n FROM public.f05_3b_sync_lineages l "+
  "JOIN public.f05_7_result_versions_ci r ON r.vehicle_id=l.vehicle_id AND r.listing_cycle_id=l.current_cycle_id "+
  "JOIN public.demands d ON d.demand_id=r.demand_id AND d.customer_id=$3 AND d.demand_state='active' "+
  "JOIN public.f05_8_qualification_ci q ON q.customer_id=d.customer_id AND q.enabled=true "+
  "WHERE l.vehicle_id=$1 AND l.current_cycle_id=$2 AND r.status='current' AND r.tier IN ('high','acceptable')",
  [vehicleId,listingCycleId,customerId]);
 assert.ok(x.n>0,'PG1_'+label+'_REAL_SIGNED_CURRENT_JYT_MATCH_REQUIRED');
}
export async function proveRealJytWaitlist(c,{auth,token},f){
 await requireCurrentSignedJytMatch(c,f,'C01');

 // 真PG16负例：已签历史Priority作为父源，伪造不同F05-7 Match签名直接INSERT。
 // 必须由新PG1门禁拒绝，不能依赖原Service内的资格判断或先改写历史事实。
 const oldPriority=await one(c,'SELECT source_signature FROM public.f05_8_priority_ci WHERE priority_id=$1',[f.originalPriorityId]);
 assert.ok(oldPriority,'PG1_C01_SIGNED_PRIORITY_HISTORY_MISSING');
 const bogus='0'.repeat(64);
 assert.notEqual(oldPriority.source_signature,bogus,'PG1_C01_FORGED_SIGNATURE_COLLISION');
 await c.query('BEGIN');
 try{
  await assert.rejects(()=>c.query(
   "INSERT INTO public.f05_8_priority_ci(customer_id,vehicle_id,listing_cycle_id,trigger_demand_id,responsible_employee_id,source_match_result_id,source_signature,expires_at,creation_key) "+
   "SELECT customer_id,vehicle_id,listing_cycle_id,trigger_demand_id,responsible_employee_id,source_match_result_id,$2::text,transaction_timestamp()+interval '1 day','pg1-unsigned-manual-match-'||priority_id::text "+
   "FROM public.f05_8_priority_ci WHERE priority_id=$1",
   [f.originalPriorityId,bogus]
  ),error=>{
   assert.equal(error.code,'23514','PG1_C01_FORGED_MATCH_SQLSTATE');
   assert.match(error.message,/F06_5C_PG1_UNSIGNED_MATCH_OR_QUALIFICATION/);
   return true;
  });
 }finally{await c.query('ROLLBACK')}
 assert.equal((await one(c,"SELECT count(*)::int n FROM public.f05_8_priority_ci WHERE vehicle_id=$1 AND listing_cycle_id=$2 AND status='active'",[f.vehicleId,f.listingCycleId])).n,0,
  'PG1_C01_FORGED_MATCH_MUST_NOT_WRITE_ACTIVE_PRIORITY');

 // 独立反例：即使客户+Demand+真实current Match/资格全部满足，
 // 自定义CreationKey裸SQL仍不能伪装原F05-8父自动Issuer（旧父仅source-create:）。
 await c.query('BEGIN');
 try{
  await assert.rejects(()=>c.query(
   "INSERT INTO public.f05_8_priority_ci(customer_id,vehicle_id,listing_cycle_id,trigger_demand_id,responsible_employee_id,source_match_result_id,source_signature,expires_at,creation_key) "+
   "SELECT e.customer_id,e.vehicle_id,e.listing_cycle_id,e.demand_id,e.responsible_employee_id,e.result_id,e.source_signature,transaction_timestamp()+interval '1 day','pg1-manual-valid-match-'+e.result_id::text "+
   "FROM public.f05_8_eligible_candidates_ci e WHERE e.vehicle_id=$1 AND e.listing_cycle_id=$2 AND e.customer_id=$3 "+
   "ORDER BY e.result_id LIMIT 1",
   [f.vehicleId,f.listingCycleId,f.customerId]
  ),error=>{
   assert.equal(error.code,'23514','PG1_C01_NON_PARENT_PRIORITY_SQLSTATE');
   assert.match(error.message,/F06_5C_PG1_NON_PARENT_PRIORITY_ISSUER/);
   return true;
  });
 }finally{await c.query('ROLLBACK')}
 assert.equal((await one(c,"SELECT count(*)::int n FROM public.f05_8_priority_ci WHERE vehicle_id=$1 AND listing_cycle_id=$2 AND status='active'",[f.vehicleId,f.listingCycleId])).n,0,
  'PG1_C01_NON_PARENT_ISSUER_MUST_NOT_CREATE_PRIORITY');
 // 前缀伪造反例：在真实current Match满足时，手工写source-create:不得冒充冻结父仲裁函数。
 // 刻意保留合法候补；必须在候补判定前由父来源验证拒绝，而不能仅靠RETURN NULL。
 await c.query('BEGIN');
 try{
  await assert.rejects(()=>c.query(
   "INSERT INTO public.f05_8_priority_ci(customer_id,vehicle_id,listing_cycle_id,trigger_demand_id,responsible_employee_id,source_match_result_id,source_signature,expires_at,creation_key) "+
   "SELECT e.customer_id,e.vehicle_id,e.listing_cycle_id,e.demand_id,e.responsible_employee_id,e.result_id,e.source_signature,transaction_timestamp()+interval '1 day','source-create:pg1-spoofed-direct-sql-'||e.result_id::text "+
   "FROM public.f05_8_eligible_candidates_ci e WHERE e.vehicle_id=$1 AND e.listing_cycle_id=$2 AND e.customer_id=$3 "+
   "ORDER BY e.result_id LIMIT 1",
   [f.vehicleId,f.listingCycleId,f.customerId]
  ),error=>{
   assert.equal(error.code,'23514','PG1_C01_SPOOFED_PARENT_PREFIX_SQLSTATE');
   assert.match(error.message,/F06_5C_PG1_NON_PARENT_PRIORITY_ISSUER/);
   return true;
  });
 }finally{await c.query('ROLLBACK')}
 assert.equal((await one(c,"SELECT count(*)::int n FROM public.f05_8_priority_ci WHERE vehicle_id=$1 AND listing_cycle_id=$2 AND status='active'",[f.vehicleId,f.listingCycleId])).n,0,
  'PG1_C01_SPOOFED_PARENT_PREFIX_MUST_NOT_CREATE_PRIORITY');
 // 组合负例：旧Priority真实体+错误Match签名+伪造source-create前缀，
 // 既不能因为匹配无效被静默跳过，也不能直接触发父自动Issuer。
 await c.query('BEGIN');
 try{
  await assert.rejects(()=>c.query(
   "INSERT INTO public.f05_8_priority_ci(customer_id,vehicle_id,listing_cycle_id,trigger_demand_id,responsible_employee_id,source_match_result_id,source_signature,expires_at,creation_key) "+
   "SELECT customer_id,vehicle_id,listing_cycle_id,trigger_demand_id,responsible_employee_id,source_match_result_id,$2::text,transaction_timestamp()+interval '1 day','source-create:pg1-unsigned-spoofed-'||priority_id::text "+
   "FROM public.f05_8_priority_ci WHERE priority_id=$1",
   [f.originalPriorityId,bogus]
  ),error=>{
   assert.equal(error.code,'23514','PG1_C01_UNSIGNED_SPOOFED_PARENT_SQLSTATE');
   assert.match(error.message,/F06_5C_PG1_NON_PARENT_PRIORITY_ISSUER/);
   return true;
  });
 }finally{await c.query('ROLLBACK')}
 assert.equal((await one(c,"SELECT count(*)::int n FROM public.f05_8_priority_ci WHERE vehicle_id=$1 AND listing_cycle_id=$2 AND status='active'",[f.vehicleId,f.listingCycleId])).n,0,
  'PG1_C01_UNSIGNED_SPOOFED_PARENT_MUST_NOT_CREATE_PRIORITY');

 const before=await one(c,"SELECT count(*)::int n FROM public.f05_8_events_ci WHERE vehicle_id=$1 AND event_kind='created'",[f.vehicleId]);
 const out=await cancelSyntheticTransactionV2CI(auth,token,{
  transactionId:f.transactionId,eventKey:mk('signed-v2-cancel'),
  reason:'C01真批发Match候补5B交易取消不得越过候补安全门禁'
 });
 assert.equal(out.code,'F06_4A_CANCELLED_ATOMIC_NO_PAYMENT',JSON.stringify(out));
 const wait=await one(c,"SELECT ended_at FROM public.waitlists WHERE waitlist_id=$1",[f.waitlistId]);
 assert.equal(wait.ended_at,null);
 const after=await one(c,"SELECT count(*)::int n FROM public.f05_8_priority_ci WHERE vehicle_id=$1 AND listing_cycle_id=$2 AND status='active'",[f.vehicleId,f.listingCycleId]);
 const events=await one(c,"SELECT count(*)::int n FROM public.f05_8_events_ci WHERE vehicle_id=$1 AND event_kind='created'",[f.vehicleId]);
 const original=await one(c,"SELECT status FROM public.f05_8_priority_ci WHERE priority_id=$1",[f.originalPriorityId]);
 assert.equal(after.n,0,'PG1_C01_ACTIVE_WAITLIST_MUST_EXCLUDE_NEW_PRIORITY');
 assert.equal(events.n,before.n,'PG1_C01_ACTIVE_WAITLIST_MUST_EXCLUDE_CREATED_EVENTS');
 assert.equal(original.status,'ended');
 return {...f,cancelCode:out.code,createdEventsBefore:before.n,createdEventsAfter:events.n,
  activePriorityAfter:after.n,waitlistEnded:false,signedTransactionCancelled:true,
   explicitUnsignedMatchDenied:true,explicitUnsignedMatchSQLSTATE:'23514',
   explicitNonParentIssuerDenied:true,explicitNonParentIssuerSQLSTATE:'23514',
   explicitForgedParentPrefixDenied:true,explicitForgedParentPrefixSQLSTATE:'23514',
   explicitForgedUnsignedParentPrefixDenied:true,explicitForgedUnsignedParentPrefixSQLSTATE:'23514'};
}


export async function prepareRealJytUnoccupiedSignedMatch(c,{auth,token,managerToken=token}){
 const fresh=await one(c,"SELECT l.vehicle_id,l.current_cycle_id,l.model_year FROM public.f05_3b_sync_lineages l "+
  "JOIN public.vehicles v ON v.vehicle_id=l.vehicle_id "+
  "JOIN public.vehicle_listing_cycles cy ON cy.listing_cycle_id=l.current_cycle_id "+
  "LEFT JOIN public.f05_7_vehicle_facts_ci f ON f.vehicle_id=l.vehicle_id AND f.listing_cycle_id=l.current_cycle_id "+
  "WHERE v.source_type='wholesale' AND v.source_sale_status='active' AND cy.ended_at IS NULL AND f.vehicle_id IS NULL "+
  "AND NOT EXISTS(SELECT 1 FROM public.locks k WHERE k.vehicle_id=l.vehicle_id AND k.lock_status='active') "+
  "AND NOT EXISTS(SELECT 1 FROM public.f05_8_priority_ci p WHERE p.vehicle_id=l.vehicle_id AND p.status='active') ORDER BY l.vehicle_id LIMIT 1");
 assert.ok(fresh,'PG1_C02_C03_R01_SECOND_SIGNED_JYT_REQUIRED');
 const vehicleId=Number(fresh.vehicle_id),listingCycleId=Number(fresh.current_cycle_id),customerId=899621;
 const signedF06=fn=>withF063A(()=>withF062(()=>withParentBranch(fn)));
 const request=await signedF06(()=>intakeCI(c,{customerId,vehicleId,listingCycleId,
  requestKey:mk('c02-intake'),syntheticPhoneConsent:'CI_SYNTHETIC_PHONE_CONSENT_NOT_PRODUCTION'}));
 assert.equal(request.code,'F06_1_PENDING_CREATED',JSON.stringify(request));
 const decision=await signedF06(()=>decisionCI(auth,managerToken,{
  requestId:request.requestId,requestKey:mk('c02-lock-approved'),action:'approve'
 }));
 assert.equal(decision.code,'F06_1_APPROVED_ATOMIC_LOCK',JSON.stringify(decision));
 const year=Number(fresh.model_year);
 await c.query("INSERT INTO public.f05_7_vehicle_facts_ci(vehicle_id,listing_cycle_id,facts_json) VALUES($1,$2,$3::jsonb)",
 [vehicleId,listingCycleId,JSON.stringify({
  model_year:{value:year,source:'CI_JYT_SIGNED_SOURCE_STRUCTURED_NOT_PRODUCTION'},
  mileage_km:{value:42000,source:'CI_SYNTHETIC_STRUCTURED_NOT_PRODUCTION'},
  exterior_color:{value:'black',source:'CI_SYNTHETIC_STRUCTURED_NOT_PRODUCTION'},
  interior_color:{value:'beige',source:'CI_SYNTHETIC_INSPECTION_NOT_PRODUCTION'},
  budget_cents:{value:10000000,source:'CI_SYNTHETIC_DISPLAY_ONLY_NOT_PRODUCTION'}
 })]);
 const demand=await one(c,"SELECT demand_id FROM public.demands WHERE customer_id=$1 AND demand_state='active' ORDER BY demand_id LIMIT 1",[customerId]);
 assert.ok(demand);
 // 同一个已签Demand沿用C01所用描述；不重复写描述使C01当前Match变stale。
 const pre=await calculateCI(historicalSignedService(auth,21,{afterPatch:false}),managerToken,{
  demandId:Number(demand.demand_id),vehicleId,listingCycleId,
  teamId:901,runKey:mk('c02-jyt-current-match')
 });
 assert.equal(pre.allowed,true,JSON.stringify(pre));
 assert.ok(['high','acceptable'].includes(pre.tier));
 assert.equal((await one(c,"SELECT count(*)::int n FROM public.f05_8_priority_ci WHERE vehicle_id=$1 AND status='active'",[vehicleId])).n,0);
 const tx=await oldRef('feat/f06-5b-lock-refund-conversion-guard-ci',()=>openGuardedSyntheticTransactionCI(auth,managerToken,{
  lockId:decision.lockId,eventKey:mk('c02-5b-open')
 }));
 assert.equal(tx.code,'F06_5B_ATOMIC_SYNTHETIC_IN_PROGRESS',JSON.stringify(tx));
 const match=await calculateCI(historicalSignedService(auth,21,{afterPatch:false}),managerToken,{
  demandId:Number(demand.demand_id),vehicleId,listingCycleId,
  teamId:901,runKey:mk('c02-jyt-tx-current-match')
 });
 assert.equal(match.allowed,true,JSON.stringify(match));
 assert.ok(['high','acceptable'].includes(match.tier));
 assert.equal((await one(c,"SELECT count(*)::int n FROM public.f05_8_priority_ci WHERE vehicle_id=$1 AND status='active'",[vehicleId])).n,0);
 assert.equal((await one(c,"SELECT count(*)::int n FROM public.waitlists WHERE vehicle_id=$1 AND listing_cycle_id=$2 AND ended_at IS NULL",[vehicleId,listingCycleId])).n,0);
 return {vehicleId,listingCycleId,customerId,transactionId:tx.transactionId,
  lockId:decision.lockId,matchTier:match.tier,source:'REAL_JYT_F05_7_SIGNED_MATCH_F06_1_LOCK_5B_TRANSACTION_NO_WAITLIST'};
}
export async function proveRealJytR01LegalSuccessor(c,{auth,token},f,independentVehicleId){
 await requireCurrentSignedJytMatch(c,f,'R01');
 const before=await one(c,"SELECT count(*)::int n FROM public.f05_8_events_ci WHERE vehicle_id=$1 AND event_kind='created'",[f.vehicleId]);
 const race=await signedCancelUnderNativeVehicleRace(c,{occupiedVehicleId:f.vehicleId,independentVehicleId},
  ()=>cancelSyntheticTransactionV2CI(auth,token,{
   transactionId:f.transactionId,eventKey:mk('r01-v2-signed-cancel'),
   reason:'R01真JYT有签终态不得复活旧优先权只可创建唯一新优先权'
  }));
 const out=race.result;
 assert.equal(out.code,'F06_4A_CANCELLED_ATOMIC_NO_PAYMENT',JSON.stringify(out));
 const priorities=(await c.query("SELECT priority_id,customer_id,creation_key FROM public.f05_8_priority_ci WHERE vehicle_id=$1 AND listing_cycle_id=$2 AND status='active'",[f.vehicleId,f.listingCycleId])).rows;
 const events=await one(c,"SELECT count(*)::int n FROM public.f05_8_events_ci WHERE vehicle_id=$1 AND event_kind='created'",[f.vehicleId]);
 assert.equal(priorities.length,1,'PG1_R01_LEGAL_CANCELLATION_REQUIRES_UNIQUE_NEW_PARENT_PRIORITY');
 assert.equal(Number(priorities[0].customer_id),f.customerId);
 assert.match(priorities[0].creation_key,/^source-create:/,'PG1_R01_ONLY_SIGNED_PARENT_SOURCE_ALLOWED');
 assert.equal(events.n,before.n+1,'PG1_R01_EXACTLY_ONE_NEW_PARENT_CREATED_EVENT_REQUIRED');
 const second=await c.query("SELECT count(*)::int n FROM public.f05_8_priority_ci WHERE vehicle_id=$1 AND status='active'",[f.vehicleId]);
 assert.equal(second.rows[0].n,1);
 return {...f,cancelCode:out.code,newPriorityId:Number(priorities[0].priority_id),
  createdEventsBefore:before.n,createdEventsAfter:events.n,
  sourceCreationKey:priorities[0].creation_key,nativeConcurrency:race.proof,
  source:'SIGNED_PARENT_RECONCILE_AFTER_VALID_V2_4A_CANCEL'};
}
