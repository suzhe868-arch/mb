// PG1-C01：真JYT当期车＋F05-7签名Match＋F05-8资格＋原F06-1候补＋F06-5B交易
// 补丁安装前形成不变原始事实，补丁安装后使用v2真实4A取消，在PG内要求候补仍优先、零新Priority/created。
import assert from 'node:assert/strict';
import {intakeCI,decisionCI} from '../lockrequest-approval-waitlist-ci/service.mjs';
import {openGuardedSyntheticTransactionCI} from '../lock-refund-conversion-guard-ci/service.mjs';
import {setQualificationCI} from '../../f05/priority-arbitration-ttl-handover/service.mjs';
import {calculateCI,saveSalesDescriptionCI} from '../../f05/deterministic-matching-readiness-four-tier/service.mjs';
import {cancelSyntheticTransactionV2CI} from './signed-cancel-v2.mjs';
import {historicalSignedService} from './冻结父历史签名适配.mjs';
import {withF063A} from '../refund-pending-ci/migration.mjs';
import {withF062} from '../deposit-ledger-ci/migration.mjs';
import {withParentBranch} from '../lock-lifecycle-ci/migration.mjs';
import {oldRef} from './真实取消前后对照.mjs';
const mk=x=>'pg1-c01-'+process.env.GITHUB_RUN_ID+'-'+x;
const one=async(c,s,a=[])=> (await c.query(s,a)).rows[0];
export async function prepareRealJytWaitlist(c,{auth,token}){
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
 const match=await calculateCI(historicalSignedService(auth,21,{afterPatch:false}),token,{
  demandId:Number(demand.demand_id),vehicleId,listingCycleId:cycle,
  teamId:901,runKey:mk('current-jyt-match')
 });
 assert.equal(match.allowed,true,JSON.stringify(match));
 assert.ok(['high','acceptable'].includes(match.tier),'PG1_C01_SIGNED_HIGH_ACCEPTABLE_MATCH_REQUIRED');
 const active=await one(c,"SELECT priority_id,customer_id FROM public.f05_8_priority_ci WHERE vehicle_id=$1 AND listing_cycle_id=$2 AND status='active'",[vehicleId,cycle]);
 assert.ok(active,'PG1_C01_PARENT_SOURCE_PRIORITY_REQUIRED');
 assert.equal(Number(active.customer_id),customerId);
 const accepted=await signedF06(()=>decisionCI(auth,token,{
  requestId:f.requestId,requestKey:mk('first-approved'),action:'approve'
 }));
 assert.equal(accepted.code,'F06_1_APPROVED_ATOMIC_LOCK',JSON.stringify(accepted));
 const queued=await one(c,"SELECT status,resulting_waitlist_id FROM public.lock_requests WHERE lock_request_id=$1",[s.requestId]);
 assert.equal(queued.status,'lock_conflict');
 assert.ok(queued.resulting_waitlist_id);
 const waiting=await one(c,"SELECT w.waitlist_id,w.ended_at,s.source_request_id FROM public.waitlists w "+
  "JOIN f06_1_lock_ci.waitlist_sources s ON s.waitlist_id=w.waitlist_id "+
  "WHERE w.vehicle_id=$1 AND w.listing_cycle_id=$2 AND w.ended_at IS NULL",[vehicleId,cycle]);
 assert.ok(waiting);
 assert.equal(Number(waiting.source_request_id),s.requestId);
 const t=await oldRef('feat/f06-5b-lock-refund-conversion-guard-ci',()=>openGuardedSyntheticTransactionCI(auth,token,{
  lockId:accepted.lockId,eventKey:mk('5b-transaction')
 }));
 assert.equal(t.code,'F06_5B_ATOMIC_SYNTHETIC_IN_PROGRESS',JSON.stringify(t));
 const refreshed=await calculateCI(historicalSignedService(auth,21,{afterPatch:false}),token,{
  demandId:Number(demand.demand_id),vehicleId,listingCycleId:cycle,
  teamId:901,runKey:mk('refreshed-match-during-5b')
 });
 assert.equal(refreshed.allowed,true,JSON.stringify(refreshed));
 assert.ok(['high','acceptable'].includes(refreshed.tier));
 const pre=await one(c,"SELECT count(*)::int n FROM public.f05_8_priority_ci WHERE vehicle_id=$1 AND listing_cycle_id=$2 AND status='active'",[vehicleId,cycle]);
 assert.equal(pre.n,0);
 return {vehicleId,listingCycleId:cycle,customerId,transactionId:t.transactionId,
  matchTier:refreshed.tier,waitlistId:Number(waiting.waitlist_id),
  originalPriorityId:Number(active.priority_id),lockId:accepted.lockId,
  source:'REAL_F05_3B_JYT_F05_7_F05_8_F06_1_F06_5B_NATIVE'};
}
export async function proveRealJytWaitlist(c,{auth,token},f){
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
  activePriorityAfter:after.n,waitlistEnded:false,signedTransactionCancelled:true};
}


export async function prepareRealJytUnoccupiedSignedMatch(c,{auth,token}){
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
 const decision=await signedF06(()=>decisionCI(auth,token,{
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
 const d=await saveSalesDescriptionCI(historicalSignedService(auth,21,{afterPatch:false}),token,{
  demandId:Number(demand.demand_id),teamId:901,
  description:'奥迪A6 2026款 5万公里以内 黑色外观 米色内饰 预算10万'
 });
 assert.equal(d.allowed,true,JSON.stringify(d));
 const pre=await calculateCI(historicalSignedService(auth,21,{afterPatch:false}),token,{
  demandId:Number(demand.demand_id),vehicleId,listingCycleId,
  teamId:901,runKey:mk('c02-jyt-current-match')
 });
 assert.equal(pre.allowed,true,JSON.stringify(pre));
 assert.ok(['high','acceptable'].includes(pre.tier));
 assert.equal((await one(c,"SELECT count(*)::int n FROM public.f05_8_priority_ci WHERE vehicle_id=$1 AND status='active'",[vehicleId])).n,0);
 const tx=await oldRef('feat/f06-5b-lock-refund-conversion-guard-ci',()=>openGuardedSyntheticTransactionCI(auth,token,{
  lockId:decision.lockId,eventKey:mk('c02-5b-open')
 }));
 assert.equal(tx.code,'F06_5B_ATOMIC_SYNTHETIC_IN_PROGRESS',JSON.stringify(tx));
 const match=await calculateCI(historicalSignedService(auth,21,{afterPatch:false}),token,{
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
export async function proveRealJytR01LegalSuccessor(c,{auth,token},f){
 const before=await one(c,"SELECT count(*)::int n FROM public.f05_8_events_ci WHERE vehicle_id=$1 AND event_kind='created'",[f.vehicleId]);
 const out=await cancelSyntheticTransactionV2CI(auth,token,{
  transactionId:f.transactionId,eventKey:mk('r01-v2-signed-cancel'),
  reason:'R01真JYT有签终态不得复活旧优先权只可创建唯一新优先权'
 });
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
  sourceCreationKey:priorities[0].creation_key,source:'SIGNED_PARENT_RECONCILE_AFTER_VALID_V2_4A_CANCEL'};
}
