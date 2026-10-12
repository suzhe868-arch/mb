import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes,createHash} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect,verify,ID,checksum} from '../migration.mjs';
import {tierFor as originalSignedTierFor} from '../../deterministic-matching-readiness-four-tier/contract.mjs';
import {arbitrateCI,setQualificationCI,setTTLDefaultCI,releaseCI,
 priorityProjectionCI,initiateHandoverCI,retryHandoverCI,processDuePrioritiesCI,productionDeny} from '../service.mjs';
const db=await connect(),secret=randomBytes(32);
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin:'https://127.0.0.1:48988'});
let token,vehicles=[],demands=[],statsBefore={},race=[];
const q=(sql,args=[])=>db.query(sql,args).then(x=>x.rows);
const kval=s=>'f05-8-official-'+s+'-signed';
const arb=(v,label,opts={})=>arbitrateCI(auth,token,{teamId:901,vehicleId:v.id,listingCycleId:v.cycle,runKey:kval(label),...opts});
const qualification=(id,enabled,label)=>setQualificationCI(auth,token,{customerId:id,enabled,eventKey:kval(label)});
const current=v=>q("SELECT * FROM public.f05_8_priority_ci WHERE vehicle_id=$1 AND listing_cycle_id=$2 AND status='active'",[v.id,v.cycle]);
// CI-only upstream signed-Match fixture using the original PDM12 pure contract.
async function reSign(v,demandId,label){
 const digest=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
 const rules=await q("SELECT rule_id,rule_version,phrase,condition_json FROM public.f05_7_rule_dictionary_ci WHERE valid_from<=statement_timestamp() AND (valid_until IS NULL OR valid_until>statement_timestamp())");
 const ruleHash=digest(rules.map(x=>[x.rule_id,x.rule_version,x.phrase,x.condition_json]).sort((a,b)=>a[0]-b[0]));
 const sales=(await q("SELECT condition_json,description_version,rule_version_sha256 FROM public.f05_7_sales_condition_ci WHERE demand_id=$1",[demandId]))[0];assert.equal(sales.rule_version_sha256,ruleHash);
 const facts=(await q("SELECT facts_json,fact_version FROM public.f05_7_vehicle_facts_ci WHERE vehicle_id=$1 AND listing_cycle_id=$2",[v.id,v.cycle]))[0];
 const demand=(await q("SELECT demand_state,customer_id FROM public.demands WHERE demand_id=$1",[demandId]))[0];
 const c=(await q("SELECT account_status,customer_level_id FROM public.customers WHERE customer_id=$1",[demand.customer_id]))[0];
 const vehicle=(await q("SELECT source_sale_status FROM public.vehicles WHERE vehicle_id=$1",[v.id]))[0];
 const cycle=(await q("SELECT ended_at FROM public.vehicle_listing_cycles WHERE listing_cycle_id=$1",[v.cycle]))[0];
 const locks=await q("SELECT lock_id,expires_at FROM public.locks WHERE vehicle_id=$1 AND listing_cycle_id=$2 AND lock_status='active' AND expires_at>statement_timestamp() ORDER BY lock_id",[v.id,v.cycle]);
 const rank=originalSignedTierFor(sales.condition_json,facts.facts_json);
 assert.ok(['high','acceptable'].includes(rank.tier));
 const signature=digest([sales.description_version,ruleHash,facts.fact_version,facts.facts_json,
   demand.demand_state,c.account_status,c.customer_level_id,vehicle.source_sale_status,cycle.ended_at,
   locks.map(x=>[String(x.lock_id),x.expires_at])]);
 return (await q("INSERT INTO public.f05_7_result_versions_ci(demand_id,vehicle_id,listing_cycle_id,tier,status,source_signature,explanations,reason,run_key) VALUES($1,$2,$3,$4,'current',$5,$6::jsonb,$7,$8) RETURNING result_id",
 [demandId,v.id,v.cycle,rank.tier,signature,JSON.stringify(rank.explanations),rank.reason,kval(label)]))[0];
}
test.before(async()=>{
 assert.equal((await verify(db)).verified,true);
 const s=await auth.login({login:'employee_test',password:'SyntheticF04_3_CurrentProof_2026',source:'f05-8-native-pg16-real-F03'});
 assert.equal(s.code,'AUTH_OK');token=s.token;
 const v=await q("SELECT f.vehicle_id,f.listing_cycle_id FROM public.f05_7_vehicle_facts_ci f "+
 "WHERE NOT EXISTS(SELECT 1 FROM public.locks l WHERE l.vehicle_id=f.vehicle_id AND l.listing_cycle_id=f.listing_cycle_id AND l.lock_status='active' AND l.expires_at>now()) "+
 "AND NOT EXISTS(SELECT 1 FROM public.transactions t WHERE t.vehicle_id=f.vehicle_id AND t.listing_cycle_id=f.listing_cycle_id AND t.status IN ('trading','in_progress','pending','active')) ORDER BY f.vehicle_id LIMIT 5");
 vehicles=v.map(x=>({id:Number(x.vehicle_id),cycle:Number(x.listing_cycle_id)}));
 assert.ok(vehicles.length>=4,'Require four different available signed wholesale cars');
 demands=await q('SELECT customer_id,demand_id,created_at FROM public.demands WHERE customer_id BETWEEN 899612 AND 899622 AND demand_state=\'active\' ORDER BY demand_id');
 assert.ok(demands.filter(x=>Number(x.customer_id)===899612).length===2);
 for(const t of ['recommendations','vehicle_visibility_grants','customer_price_unlock_events','customer_quota_adjustments','customer_owner_history','transactions']){
  try{statsBefore[t]=Number((await q('SELECT count(*)::int n FROM public.'+t))[0].n)}
  catch(e){if(e.code!=='42P01')throw e;statsBefore[t]='NOT_PRESENT'}
 }
});
test.after(async()=>{await auth.close();await db.end();secret.fill(0)});
test('8-A01 v24 real PostgreSQL16 history: preceding 21 signed migration ledgers + rollback and v24 seal',async()=>{
 const seal=await verify(db);
 assert.equal(seal.id,ID);assert.equal(seal.checksum,checksum);
 assert.equal((await q('SELECT count(*)::int n FROM public.f03_schema_migrations'))[0].n,22);
 const att=(await q('SELECT * FROM public.f05_8_migration_attestation'))[0];
 assert.equal(att.seal_key,'M94_TO_V23_SIGNED_LEDGER');
 assert.equal((await q('SELECT count(*)::int n FROM public.f05_8_priority_ci'))[0].n,0,'v24 migration must not grant Priority before per-Customer qualification');
 assert.equal((await q('SELECT count(*)::int n FROM public.f05_8_qualification_ci WHERE enabled=true'))[0].n,0,'v24 migration must not silently enable qualification');
});
test('8-A02 non-qualified Customer has signed current Match yet no Priority; fail-closed production',async()=>{
 const original=(await q("SELECT count(*)::int n FROM public.f05_7_result_versions_ci r WHERE r.vehicle_id=$1 AND r.listing_cycle_id=$2 AND r.status='current' AND r.tier IN ('high','acceptable')",[vehicles[0].id,vehicles[0].cycle]))[0].n;
 assert.ok(original>=5,'Multiple real signed current high or acceptable Match Results required');
 assert.equal((await arb(vehicles[0],'not-qualified')).code,'F05_8_NO_LEGAL_PRIORITY_CANDIDATE');
 assert.equal(productionDeny().allowed,false);
});
test('8-A03 per-Customer qualification ON re-evaluates existing current PDM12 candidates without creating Demand or rights',async()=>{
 const before=(await q('SELECT customer_level_id,current_owner_employee_id FROM public.customers WHERE customer_id=899612'))[0];
 const demandCount=Number((await q('SELECT count(*)::int n FROM public.demands'))[0].n);
 for(const [id,enabled,label] of [[899612,true,'qualification-first'],[899620,true,'qualification-low'],[899613,true,'qualification-second'],[899618,true,'qualification-third'],[899619,true,'qualification-fourth']]){
  const x=await qualification(id,enabled,label);assert.equal(x.allowed,true,JSON.stringify(x));
 }
 assert.equal((await q('SELECT count(*)::int n FROM public.f05_8_priority_ci'))[0].n,vehicles.length,'qualification ON must re-evaluate current matching candidates');
 assert.deepEqual((await q('SELECT customer_level_id,current_owner_employee_id FROM public.customers WHERE customer_id=899612'))[0],before);
 assert.equal(Number((await q('SELECT count(*)::int n FROM public.demands'))[0].n),demandCount);
 assert.equal((await qualification(899612,true,'qualification-first')).code,'F05_8_QUALIFICATION_EVENT_ALREADY_APPLIED');
});
test('8-A04 deterministically arbitrate high > acceptable, then original Demand created_at and id, no VIP bonus',async()=>{
 const v=vehicles[0],r=await arb(v,'high-winner');
 assert.equal(r.code,'F05_8_EXISTING_ACTIVE_PRIORITY',JSON.stringify(r));
 assert.equal(r.customerId,899612);
 const active=(await current(v))[0];assert.equal(active.status,'active');
 const rows=await q("SELECT d.customer_id,d.demand_id,d.created_at,r.tier FROM public.f05_7_result_versions_ci r JOIN public.demands d ON d.demand_id=r.demand_id WHERE r.vehicle_id=$1 AND r.listing_cycle_id=$2 AND r.status='current' AND d.customer_id IN (899612,899613,899620) ORDER BY d.created_at,d.demand_id",[v.id,v.cycle]);
 assert.ok(rows.some(x=>Number(x.customer_id)===899620&&x.tier==='acceptable'));
 const early=rows.filter(x=>Number(x.customer_id)===899612).sort((a,b)=>new Date(a.created_at)-new Date(b.created_at)||Number(a.demand_id)-Number(b.demand_id))[0];
 assert.equal(Number(active.trigger_demand_id),Number(early.demand_id));
 assert.equal((await q('SELECT count(*)::int n FROM public.f05_8_priority_ci WHERE vehicle_id=$1 AND status=\'active\'',[v.id]))[0].n,1);
});
test('8-A05 customer can hold multiple cars; same Customer multiple Demand folded to one candidate',async()=>{
 const second=await arb(vehicles[1],'second-car');
 assert.equal(second.customerId,899612);
 const ids=(await q("SELECT vehicle_id,customer_id FROM public.f05_8_priority_ci WHERE customer_id=899612 AND status='active' ORDER BY vehicle_id"));
 assert.ok(ids.length>=2);
 assert.equal(Number((await current(vehicles[1]))[0].trigger_demand_id),Number((await current(vehicles[0]))[0].trigger_demand_id));
});
test('8-A06 repeated event is idempotent, no parallel active and no duplicate history',async()=>{
 const v=vehicles[0],first=(await current(v))[0],before=Number((await q('SELECT count(*)::int n FROM public.f05_8_priority_ci'))[0].n);
 const x=await arb(v,'high-winner');assert.equal(x.created,false);assert.equal(x.priorityId,Number(first.priority_id));
 assert.equal((await q('SELECT count(*)::int n FROM public.f05_8_priority_ci'))[0].n,before);
 await assert.rejects(()=>db.query("UPDATE public.f05_8_priority_ci SET expires_at=expires_at+interval '1 hour' WHERE priority_id=$1",[first.priority_id]),/F05_8_PRIORITY_TTL_OR_IMMUTABLE_HISTORY/);
});
test('8-A07 default TTL 86400 freezes even when global setting changes; no manual revive',async()=>{
 const a=(await current(vehicles[0]))[0];
 const duration=(new Date(a.expires_at).getTime()-new Date(a.created_at).getTime())/1000;
 assert.equal(duration,86400);
 const update=await setTTLDefaultCI(auth,token,{seconds:120,eventKey:kval('ttl-new-global')});
 assert.equal(update.allowed,true);assert.equal(update.previous,86400);
 const b=(await current(vehicles[0]))[0];assert.equal(new Date(b.expires_at).getTime(),new Date(a.expires_at).getTime());
 await assert.rejects(()=>db.query('DELETE FROM public.f05_8_priority_ci WHERE priority_id=$1',[a.priority_id]),/F05_8_PRIORITY_HISTORY_DELETE_DENIED/);
});
test('8-R01 Customer two Demand suppression holds all old signed facts',async()=>{
 const v=vehicles[3],old=(await current(v))[0];
 assert.ok(old);
 assert.equal(Number(old.customer_id),899612);
 const signed=await q("SELECT DISTINCT r.source_signature FROM public.f05_7_result_versions_ci r "+
  "JOIN public.demands d ON d.demand_id=r.demand_id WHERE d.customer_id=$1 AND r.vehicle_id=$2 "+
  "AND r.listing_cycle_id=$3 AND r.status='current'",[899612,v.id,v.cycle]);
 assert.ok(signed.length>=2,'two independent live Demand source signatures required');
 const x=await releaseCI(auth,token,{priorityId:Number(old.priority_id),eventKey:kval('r01-two-demand-release')});
 assert.equal(x.allowed,true,JSON.stringify(x));
 const next=await current(v);
 assert.ok(next.length<=1);if(next.length)assert.notEqual(Number(next[0].customer_id),899612);
 const facts=await q("SELECT source_signature FROM public.f05_8_suppressed_facts_ci WHERE customer_id=899612 AND vehicle_id=$1 AND listing_cycle_id=$2",[v.id,v.cycle]);
 for(const f of signed)assert.ok(facts.some(x=>x.source_signature===f.source_signature),'old source fact missing from suppression');
 assert.notEqual((await arb(v,'r01-old-signature-replay')).customerId,899612);
});
test('8-A08 trigger Demand switches to same Customer alternative on inactive first, without resetting TTL',async()=>{
 const v=vehicles[1],before=(await current(v))[0],first=Number(before.trigger_demand_id);
 const own=demands.filter(x=>Number(x.customer_id)===899612);
 const alt=own.find(x=>Number(x.demand_id)!==first);assert.ok(alt);
 await db.query("UPDATE public.demands SET demand_state='paused' WHERE demand_id=$1",[first]);
 const next=await arb(v,'trigger-after-paused');
 assert.equal(next.created,false);assert.equal(next.customerId,899612);assert.equal(next.triggerDemandId,Number(alt.demand_id));
 const after=(await current(v))[0];assert.equal(new Date(after.expires_at).getTime(),new Date(before.expires_at).getTime());
 assert.equal(Number(after.priority_id),Number(before.priority_id));
});
test('8-A09 only current trigger responsible employee releases, suppresses old facts and immediately re-arbitrates',async()=>{
 const v=vehicles[0],before=(await current(v))[0];
 const ret=await releaseCI(auth,token,{priorityId:Number(before.priority_id),eventKey:kval('employee-not-recommend')});
 assert.equal(ret.allowed,true,JSON.stringify(ret));
 assert.equal(ret.next.customerId,899613);
 assert.equal((await q("SELECT status,ended_reason FROM public.f05_8_priority_ci WHERE priority_id=$1",[before.priority_id]))[0].ended_reason,'employee_released');
 // releaseCI first reconciles the current Demand/Match; the pause in 8-A08
 // can replace the trigger and signed source_signature. Suppression must pin
 // the actually released source, not a stale pre-reconciliation snapshot.
 const released=(await q('SELECT source_signature,trigger_demand_id FROM public.f05_8_priority_ci WHERE priority_id=$1',[before.priority_id]))[0];
 const s=(await q('SELECT suppressed_source_signature FROM public.f05_8_suppression_ci WHERE customer_id=899612 AND vehicle_id=$1',[v.id]))[0];
 assert.equal(s.suppressed_source_signature,released.source_signature,'suppress the exact reconciled signed Match source on release');
 assert.ok(demands.some(d=>Number(d.demand_id)===Number(released.trigger_demand_id)&&Number(d.customer_id)===899612));
 assert.equal((await arb(v,'try-reclaim-same-facts')).customerId,899613);
});
test('8-A10 qualification OFF closes only that Customer Priority; Demand stays active and triggers successor',async()=>{
 const v=vehicles[0],p=(await current(v))[0];assert.equal(Number(p.customer_id),899613);
 const activeForCustomer=Number((await q("SELECT count(*)::int n FROM public.f05_8_priority_ci WHERE customer_id=899613 AND status='active'"))[0].n);
 assert.ok(activeForCustomer>=1);
 const x=await qualification(899613,false,'turn-off-after-active');
 assert.equal(x.allowed,true);assert.equal(x.released,activeForCustomer,
  'qualification OFF must release all active Priority scopes for this Customer');
 assert.equal((await q('SELECT status,ended_reason FROM public.f05_8_priority_ci WHERE priority_id=$1',[p.priority_id]))[0].ended_reason,'priority_customer_disabled');
 assert.equal(Number((await current(v))[0].customer_id),899618);
 assert.equal((await q('SELECT demand_state FROM public.demands WHERE customer_id=899613 LIMIT 1'))[0].demand_state,'active');
});
test('8-A11 platform hidden may Priority internally but never auto-publish/Customer visibility',async()=>{
 const v=vehicles[2];
 await db.query("UPDATE public.vehicles SET platform_visibility='hidden' WHERE vehicle_id=$1",[v.id]);
 const a=await arb(v,'hidden-valid-internal');
 assert.equal(a.allowed,true);assert.equal(a.created,false);
 const snapshot=await priorityProjectionCI(auth,token,{vehicleId:v.id,listingCycleId:v.cycle,customerId:899612});
 assert.equal(snapshot.publicVisible,false);assert.equal(snapshot.customerVisible,false);
 assert.equal(snapshot.protectedByActivePriority,true);
 assert.equal((await q('SELECT platform_visibility FROM public.vehicles WHERE vehicle_id=$1',[v.id]))[0].platform_visibility,'hidden');
});
test('8-A12 true active Lock auto-ends priority, blocks re-create but does not rewrite PDM12',async()=>{
 const v=vehicles[2],old=(await current(v))[0];
 await db.query("INSERT INTO public.locks(lock_id,customer_id,vehicle_id,listing_cycle_id,lock_status,responsible_employee_id,created_at,expires_at) "+
  "VALUES(8997088,899619,$1,$2,'active',1,now()-interval '1 minute',now()+interval '2 hours')",[v.id,v.cycle]);
 assert.equal((await current(v)).length,0);
 assert.equal((await q('SELECT ended_reason FROM public.f05_8_priority_ci WHERE priority_id=$1',[old.priority_id]))[0].ended_reason,'lock_takeover');
 const blocked=await arb(v,'blocked-by-real-lock');assert.equal(blocked.created,false);assert.equal(blocked.locked,1);
 assert.equal((await q("SELECT count(*)::int n FROM public.f05_7_result_versions_ci WHERE vehicle_id=$1 AND status='current'",[v.id]))[0].n,0,
 'PDM12 source invalidated on Lock change; does not fabricate no_match');
 await db.query("UPDATE public.locks SET lock_status='cancelled' WHERE lock_id=8997088");
 assert.equal((await q('SELECT status FROM public.f05_8_priority_ci WHERE priority_id=$1',[old.priority_id]))[0].status,'ended');
 // Unlike another Customer's takeover, the currently entitled Customer's
 // own successful Lock must carry the distinct PDM-13 converted_to_lock cause.
 // The fixture has four unoccupied genuine vehicles; reuse the second one,
 // which still holds this Customer's Priority after its Demand handoff (8-A08).
 // The original third vehicle was just used for another Customer's takeover.
 const same=vehicles[1],self=(await current(same))[0];
 assert.ok(self,'signed second Vehicle must hold an active same-Customer Priority');
 assert.equal(Number(self.customer_id),899612);
 await db.query("INSERT INTO public.locks(lock_id,customer_id,vehicle_id,listing_cycle_id,lock_status,responsible_employee_id,created_at,expires_at) "+
 "VALUES(8997089,899612,$1,$2,'active',1,now()-interval '1 minute',now()+interval '2 hours')",[same.id,same.cycle]);
 assert.equal((await current(same)).length,0);
 assert.equal((await q('SELECT ended_reason FROM public.f05_8_priority_ci WHERE priority_id=$1',[self.priority_id]))[0].ended_reason,'converted_to_lock');
 await db.query("UPDATE public.locks SET lock_status='cancelled' WHERE lock_id=8997089");
 assert.equal((await current(same)).length,0,'cancellation does not resurrect converted Priority');
});
test('8-A13 real PG16 two backend contention serializes the same vehicle, 55P03, one active',async()=>{
 const v=vehicles[3],p2=await connect();
 const previous=(await current(v))[0];assert.ok(previous);
 await db.query("UPDATE public.f05_8_priority_ci SET status='ended',ended_at=transaction_timestamp(),ended_reason='correction' WHERE priority_id=$1",[previous.priority_id]);
 await db.query("INSERT INTO public.f05_8_events_ci(priority_id,customer_id,vehicle_id,event_kind,event_key) VALUES($1,$2,$3,'ended',$4)",
 [previous.priority_id,previous.customer_id,v.id,kval('ci-correction-before-race')]);
 assert.equal((await current(v)).length,0);
 let ready,release;
 const started=new Promise(resolve=>{ready=resolve});
 const gate=new Promise(resolve=>{release=resolve});
 const run=arb(v,'real-dual-pg-contention',{
  checkpoint:async(stage,c)=>{
   const writer=Number((await c.query('SELECT pg_backend_pid() n')).rows[0].n);
   ready(writer);await gate;
  }
 });
 let sourcePid,otherPid,sqlstate=null;
 try{
  sourcePid=await started;
  await p2.query('BEGIN');otherPid=Number((await p2.query('SELECT pg_backend_pid() n')).rows[0].n);
  await p2.query("SET LOCAL lock_timeout='300ms'");
  try{await p2.query('UPDATE public.vehicles SET archived_at=archived_at WHERE vehicle_id=$1',[v.id]);
   throw Error('F05_8_EXPECTED_REAL_PG_ROW_LOCK');}
  catch(e){assert.equal(e.code,'55P03');sqlstate=e.code;await p2.query('ROLLBACK');}
  release();
  const win=await run;assert.equal(win.created,true,JSON.stringify(win));
  const next=await arb(v,'real-dual-pg-second-arrives');assert.equal(next.created,false);
  assert.equal((await current(v)).length,1);
  assert.notEqual(sourcePid,otherPid);
  race.push({vehicle:v.id,firstBackend:sourcePid,secondBackend:otherPid,sqlstate});
  console.log('F05_8_REAL_TWO_BACKEND_PRIORITY_55P03',JSON.stringify(race[0]));
 }finally{release?.();await p2.query('ROLLBACK').catch(()=>{});await p2.end();await run.catch(()=>{})}
});
test('8-A14 current Priority suppresses public statistics, qualification/history alone are not public pool protection',async()=>{
 const active=await priorityProjectionCI(auth,token,{vehicleId:vehicles[3].id,listingCycleId:vehicles[3].cycle,customerId:899613});
 assert.equal(active.protectedByActivePriority,true);assert.equal(active.publicVisible,false);
 assert.equal(active.poolProtected,true);
 const ended=await priorityProjectionCI(auth,token,{vehicleId:vehicles[2].id,listingCycleId:vehicles[2].cycle,customerId:899613});
 assert.equal(ended.poolProtected,false);assert.equal(ended.publicVisible,false,'hidden stays hidden');
});
test('8-A15 handover pending, failed-only retry, immutable attempts and no TTL reset',async()=>{
 const v=vehicles[3],p=(await current(v))[0];
 const h=await initiateHandoverCI(auth,token,{priorityId:Number(p.priority_id),eventKey:kval('handover-start')});
 assert.equal(h.allowed,true);assert.ok(h.handoverId);
 const fail=await retryHandoverCI(auth,token,{handoverId:h.handoverId,targetEmployeeId:5,
  injectFail:true,eventKey:kval('handover-fail-one')});
 assert.equal(fail.completed,false);assert.equal(fail.attempt,1);
 const rows=await q('SELECT outcome,error_reason FROM public.f05_8_handover_attempts_ci WHERE handover_id=$1',[h.handoverId]);
 assert.equal(rows.length,1);assert.equal(rows[0].outcome,'failed');
 await assert.rejects(()=>db.query('DELETE FROM public.f05_8_handover_attempts_ci WHERE handover_id=$1',[h.handoverId]),/F05_8_IMMUTABLE_AUDIT_HISTORY/);
 assert.equal(new Date((await current(v))[0].expires_at).getTime(),new Date(p.expires_at).getTime());
});
test('8-A16 no Priority writes to Recommendation, grant, price-unlock, quota, Customer owner or Transaction',async()=>{
 for(const [t,b] of Object.entries(statsBefore)){
  let n;try{n=Number((await q('SELECT count(*)::int n FROM public.'+t))[0].n)}
  catch(e){if(e.code!=='42P01')throw e;n='NOT_PRESENT'}
  assert.deepEqual(n,b,'Priority must not create or mutate '+t);
 }
 const old=(await q('SELECT count(*)::int n FROM public.f05_8_priority_ci'))[0].n;assert.ok(old>=4);
});
test('8-A17 individual employee permission deny prevents current Priority action, restore after',async()=>{
 await db.query("UPDATE public.employee_permission_overrides SET decision='deny' WHERE employee_id=1 AND permission_id=1097");
 const r=await arb(vehicles[4]||vehicles[0],'denied-permission');
 assert.equal(r.allowed,false);assert.equal(r.code,'F05_8_PERMISSION_OR_DATA_SCOPE_DENIED');
 await db.query("UPDATE public.employee_permission_overrides SET decision='allow' WHERE employee_id=1 AND permission_id=1097");
});
test('8-A18 audit is immutable and full real PG facts preserved in native source artifacts',async()=>{
 const after=await q('SELECT event_id,priority_id,customer_id,vehicle_id,event_kind,event_key FROM public.f05_8_events_ci ORDER BY event_id');
 assert.ok(after.length>=9);
 await assert.rejects(()=>db.query('DELETE FROM public.f05_8_events_ci WHERE event_id=$1',[after[0].event_id]),/F05_8_IMMUTABLE_AUDIT_HISTORY/);
 const dir=new URL('../artifacts/priority-source/',import.meta.url);await mkdir(dir,{recursive:true});
 await writeFile(new URL('native-priority-arbitration-events.json',dir),
  JSON.stringify({events:after,digest:createHash('sha256').update(JSON.stringify(after)).digest('hex'),
   pids:race,CIOnly:true},null,2)+'\n');
});

test('8-A19 separate synthetic qualification control-plane permission denial cannot grant Priority',async()=>{
 const before=Number((await q('SELECT count(*)::int n FROM public.f05_8_events_ci'))[0].n);
 await db.query("UPDATE public.employee_permission_overrides SET decision='deny' WHERE employee_id=1 AND permission_id=1098");
 try{
  const denied=await qualification(899614,true,'untrusted-qualify-when-control-denied');
  assert.equal(denied.allowed,false,JSON.stringify(denied));
  assert.equal(denied.code,'F05_8_PERMISSION_OR_DATA_SCOPE_DENIED');
  assert.equal((await q('SELECT count(*)::int n FROM public.f05_8_events_ci'))[0].n,before);
  assert.equal((await q('SELECT count(*)::int n FROM public.f05_8_qualification_ci WHERE customer_id=899614'))[0].n,0);
 }finally{
  await db.query("UPDATE public.employee_permission_overrides SET decision='allow' WHERE employee_id=1 AND permission_id=1098");
 }
});
test('8-A20 true signed Transaction begins on formerly protected Vehicle and ends Priority, never revives old lease',async()=>{
 const v=vehicles[3],old=(await current(v))[0];assert.ok(old);
 // Synthetic cancelled source Lock has a real signed composite FK; unlike an active
 // Lock it must NOT end Priority. Transaction in_progress then ends it.
 await db.query("INSERT INTO public.locks(lock_id,customer_id,vehicle_id,listing_cycle_id,lock_status,responsible_employee_id,created_at,expires_at) "+
  "VALUES(8997090,899612,$1,$2,'cancelled',1,now()-interval '5 minute',now()+interval '2 hours')",[v.id,v.cycle]);
 assert.equal((await current(v)).length,0,'even a cancelled Lock revokes signed current Match; no stale Priority may survive');
 assert.equal((await q("SELECT ended_reason FROM public.f05_8_priority_ci WHERE priority_id=$1",[old.priority_id]))[0].ended_reason,
  'match_invalidated','cancelled Lock must not be misclassified as active lock_takeover');
 await db.query("INSERT INTO public.transactions(transaction_id,source_lock_id,customer_id,vehicle_id,listing_cycle_id,status,responsible_employee_id) "+
  "VALUES(8997090,8997090,899612,$1,$2,'in_progress',1)",[v.id,v.cycle]);
 assert.equal((await current(v)).length,0);
 const ended=(await q('SELECT status,ended_reason FROM public.f05_8_priority_ci WHERE priority_id=$1',[old.priority_id]))[0];
 assert.equal(ended.status,'ended');assert.equal(ended.ended_reason,'match_invalidated',
  'invalidated PDM12 Match is closed at cancelled-Lock COMMIT; later Transaction never revives it');
 const blocked=await arb(v,'txn-prevents-new-priority');assert.equal(blocked.created,false);
 assert.equal(blocked.trading,1);
 await db.query("UPDATE public.transactions SET status='cancelled' WHERE transaction_id=8997090");
 assert.equal((await q('SELECT status FROM public.f05_8_priority_ci WHERE priority_id=$1',[old.priority_id]))[0].status,'ended',
  'Transaction cancellation must never revive historical Priority');
 const after=await arb(v,'txn-correction-requires-new-signed-match');
 assert.equal(after.created,false,'F05-7 invalidated Match from physical Lock change; stale source cannot create Priority');
});


test('8-R05 non-trigger Demand affected scope auto-arbitrates when no active lease exists',async()=>{
 const v=vehicles[0],old=(await current(v))[0];assert.ok(old);
 const nonTrigger=(await q("SELECT d.demand_id FROM public.f05_7_result_versions_ci r JOIN public.demands d ON d.demand_id=r.demand_id "+
  "WHERE r.vehicle_id=$1 AND r.listing_cycle_id=$2 AND r.status='current' AND r.tier IN ('high','acceptable') "+
  "AND d.demand_state='active' AND d.demand_id<>$3 ORDER BY d.demand_id LIMIT 1",
  [v.id,v.cycle,old.trigger_demand_id]))[0];assert.ok(nonTrigger);
 await db.query("UPDATE public.f05_8_priority_ci SET status='ended',ended_at=transaction_timestamp(),ended_reason='correction' WHERE priority_id=$1",[old.priority_id]);
 assert.equal((await current(v)).length,0);
 // F05-7 deliberately does NOT invalidate signed current Match on responsible_employee_id
 // when the value has not changed. The R05 affected-scope trigger must nevertheless
 // find this non-trigger Demand, even with zero active Priority rows.
 await db.query("UPDATE public.demands SET responsible_employee_id=responsible_employee_id WHERE demand_id=$1",[nonTrigger.demand_id]);
 const again=(await current(v))[0];assert.ok(again,'non-trigger Demand event must discover current signed Match without manual arb');
 assert.notEqual(Number(again.priority_id),Number(old.priority_id));
 assert.equal(new Date(again.expires_at).getTime()-new Date(again.created_at).getTime(),120000,
  'new event creates a fresh configured TTL, not reviving old ended lease');
});
test('8-R05 Vehicle affected scope restores current legitimate Match without previous active Priority',async()=>{
 const v=vehicles[0],old=(await current(v))[0];assert.ok(old);
 await db.query("UPDATE public.f05_8_priority_ci SET status='ended',ended_at=transaction_timestamp(),ended_reason='correction' WHERE priority_id=$1",[old.priority_id]);
 assert.equal((await current(v)).length,0);
 // Non-mutating source event: signed v23 contract leaves current rows intact;
 // R05 must inspect current result scopes instead of only the prior active lease.
 await db.query("UPDATE public.vehicles SET source_sale_status=source_sale_status WHERE vehicle_id=$1",[v.id]);
 const restored=(await current(v))[0];assert.ok(restored);
 assert.notEqual(Number(restored.priority_id),Number(old.priority_id));
 await db.query("UPDATE public.vehicles SET source_sale_status=source_sale_status WHERE vehicle_id=$1",[v.id]);
 assert.equal(Number((await current(v))[0].priority_id),Number(restored.priority_id));
});
test('8-R05 real offline to active cannot reuse PDM12 stale Match without re-signing',async()=>{
 const v=vehicles[1];
 assert.equal((await current(v)).length,0,'old same-customer Lock converted this Priority to ended');
 await db.query("UPDATE public.vehicles SET source_sale_status='offline' WHERE vehicle_id=$1",[v.id]);
 await db.query("UPDATE public.vehicles SET source_sale_status='active' WHERE vehicle_id=$1",[v.id]);
 assert.equal((await current(v)).length,0,'old signed F05-7 irrevocably stales Match on sale-state changes');
 assert.equal((await q("SELECT count(*)::int n FROM public.f05_7_result_versions_ci WHERE vehicle_id=$1 AND status='current'",[v.id]))[0].n,0);
});
test('8-R06 Transaction occupancy exit creates a NEW lease from signed current Match without arb',async()=>{
 const v=vehicles[3];
 assert.equal((await current(v)).length,0);
 // Prior cancelled synthetic Lock left old Match stale. Begin occupancy first,
 // then issue a synthetic *new* physical CI result while transaction is active.
 await db.query("UPDATE public.transactions SET status='in_progress' WHERE transaction_id=8997090");
 const d=(await q("SELECT d.demand_id FROM public.demands d WHERE d.customer_id=899618 AND d.demand_state='active' LIMIT 1"))[0];
 assert.ok(d);
 const sales=(await q('SELECT condition_json FROM public.f05_7_sales_condition_ci WHERE demand_id=$1',[d.demand_id]))[0];
 const facts=(await q('SELECT facts_json FROM public.f05_7_vehicle_facts_ci WHERE vehicle_id=$1 AND listing_cycle_id=$2',[v.id,v.cycle]))[0];
 const rank=originalSignedTierFor(sales.condition_json,facts.facts_json);
 assert.ok(['high','acceptable'].includes(rank.tier));
 const freshSignature=createHash('sha256').update(JSON.stringify({source:'CI_ONLY_R06_NEW_MATCH_WHILE_OCCUPIED',
  demand:d.demand_id,vehicle:v.id,cycle:v.cycle,facts:facts.facts_json,conditions:sales.condition_json,rank:rank.tier})).digest('hex');
 await db.query("INSERT INTO public.f05_7_result_versions_ci(demand_id,vehicle_id,listing_cycle_id,tier,status,source_signature,explanations,reason,run_key) "+
  "VALUES($1,$2,$3,$4,'current',$5,$6::jsonb,$7,$8)",
  [d.demand_id,v.id,v.cycle,rank.tier,freshSignature,JSON.stringify(rank.explanations),rank.reason,kval('r06-synthetic-match-while-trading')]);
 assert.equal((await current(v)).length,0,'active Transaction prevents any Priority');
 const prior=await q("SELECT priority_id FROM public.f05_8_priority_ci WHERE vehicle_id=$1 AND listing_cycle_id=$2 AND status='ended'",[v.id,v.cycle]);
 await db.query("UPDATE public.transactions SET status='cancelled' WHERE transaction_id=8997090");
 const created=(await current(v))[0];assert.ok(created,'Transaction cancellation must trigger current legal Match arbitration');
 assert.equal(Number(created.customer_id),899618);
 assert.ok(prior.every(x=>Number(x.priority_id)!==Number(created.priority_id)),'old ended rows must never revive');
 await db.query("UPDATE public.transactions SET status='cancelled' WHERE transaction_id=8997090");
 assert.equal(Number((await current(v))[0].priority_id),Number(created.priority_id));
});
test('8-R06 cancelled Lock with stale Match cannot fabricate a new Priority',async()=>{
 const v=vehicles[1];
 await db.query("UPDATE public.locks SET lock_status='active',expires_at=now()+interval '2 hours' WHERE lock_id=8997089");
 await db.query("UPDATE public.locks SET lock_status='cancelled' WHERE lock_id=8997089");
 assert.equal((await current(v)).length,0,'F05-7 signed Lock revocation prevents a stale-Match replay');
});
test('8-R07 Employee invalidation auto-creates protected Handover Batch, deny and valid retry same TTL',async()=>{
 const v=vehicles[0],old=(await current(v))[0];assert.ok(old);
 const target=8997501;
 // Add a real *CI-only* Employee with actual scoped permission and membership,
 // copying the signed responsible's team/store, never inventing a production credential.
 await db.query("INSERT INTO public.employees(employee_id,store_id,employment_status,receiving_status,main_role_id) "+
  "SELECT $1,store_id,'active',receiving_status,main_role_id FROM public.employees WHERE employee_id=1 ON CONFLICT(employee_id) DO NOTHING",[target]);
 await db.query("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) "+
  "VALUES($1,1097,'allow',now()) ON CONFLICT(employee_id,permission_id) DO UPDATE SET decision='allow',changed_at=now()",[target]);
 await db.query("INSERT INTO public.employee_team_memberships(team_id,employee_id,valid_from,changed_by_system_admin_id) "+
  "SELECT team_id,$1,now()-interval '1 day',changed_by_system_admin_id FROM public.employee_team_memberships "+
  "WHERE employee_id=1 AND team_id=901 AND ended_at IS NULL LIMIT 1",[target]);
 await db.query("INSERT INTO public.employee_data_scopes(scope_id,employee_id,scope_kind,scope_reference_id) "+
  "SELECT 29991,$1,scope_kind,scope_reference_id FROM public.employee_data_scopes WHERE scope_id=29001",[target]);
 await db.query("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at) "+
  "VALUES($1,1097,29991,now()-interval '1 day')",[target]);
 assert.equal((await q("SELECT public.f05_8_responsible_authorized_ci($1) allowed",[target]))[0].allowed,true);
 await db.query("UPDATE public.employees SET employment_status='inactive' WHERE employee_id=1");
 const pending=(await current(v))[0];assert.ok(pending,'current Customer must retain exclusive protection while only responsible invalid');
 assert.equal(Number(pending.priority_id),Number(old.priority_id));
 assert.equal(new Date(pending.expires_at).getTime(),new Date(old.expires_at).getTime());
 const handover=(await q("SELECT handover_id,state,original_responsible_employee_id FROM public.f05_8_handover_ci WHERE priority_id=$1",[old.priority_id]))[0];
 assert.equal(handover.state,'pending');
 assert.equal(Number(handover.original_responsible_employee_id),1);
 const denied=await arb(v,'r07-disabled-original-denied');
 assert.equal(denied.allowed,false,'old Employee loses any Priority action immediately');
 await db.query("UPDATE public.employees SET employment_status='active' WHERE employee_id=1");
 const failAttempt=await retryHandoverCI(auth,token,{handoverId:Number(handover.handover_id),targetEmployeeId:target,
  injectFail:true,eventKey:kval('r07-fail-retry')});
 assert.equal(failAttempt.allowed,true);assert.equal(failAttempt.completed,false);
 // R08: a target who merely holds matching permission has NO authority.
 const unsigned=await retryHandoverCI(auth,token,{handoverId:Number(handover.handover_id),targetEmployeeId:target,
  eventKey:kval('r08-no-current-demand-source')});
 assert.equal(unsigned.allowed,true);assert.equal(unsigned.completed,false);
 assert.equal(Number((await current(v))[0].responsible_employee_id),1);
 // Prepare a pending Batch for another vehicle before the same Customer's
 // legitimate upstream owner change invalidates all old PDM12 Match Results.
 const otherVehicle=vehicles[3],otherPriority=(await current(otherVehicle))[0];assert.ok(otherPriority);
 await initiateHandoverCI(auth,token,{priorityId:Number(otherPriority.priority_id),
  eventKey:kval('r08-second-original-customer-pending')});
 const pair=[{p:old,v},{p:otherPriority,v:otherVehicle}];
 const customers=[...new Set(pair.map(x=>Number(x.p.customer_id)))];
 const otherTeam=(await q("SELECT team_id,store_id FROM public.teams WHERE team_id<>901 AND team_status='active' ORDER BY team_id LIMIT 1"))[0];
 const foreign=8997502;
 // When no other team is seeded, clone the signed team's same-store skeleton
 // into the disposable PG database, never into the signed production schema.
 let foreignTeam=otherTeam;
 if(!foreignTeam){
  const template=(await q("SELECT * FROM public.teams WHERE team_id=901"))[0];assert.ok(template);
  const clone={...template,team_id:8997902};
  for(const k of Object.keys(clone))if(typeof clone[k]==='string'&&/name|code|title/i.test(k))clone[k]+='-ci-only-unrelated';
  const keys=Object.keys(clone);
  await db.query("INSERT INTO public.teams("+keys.map(x=>'"'+x+'"').join(',')+") VALUES("+keys.map((_,i)=>'$'+(i+1)).join(',')+")",Object.values(clone));
  foreignTeam={team_id:8997902,store_id:template.store_id};
 }
 await db.query("INSERT INTO public.employees(employee_id,store_id,employment_status,receiving_status,main_role_id) "+
  "SELECT $1,$2,'active',receiving_status,main_role_id FROM public.employees WHERE employee_id=1",[foreign,foreignTeam.store_id]);
 await db.query("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES($1,1097,'allow',now())",[foreign]);
 await db.query("INSERT INTO public.employee_team_memberships(team_id,employee_id,valid_from,changed_by_system_admin_id) "+
  "SELECT $2,$1,now()-interval '1 day',changed_by_system_admin_id FROM public.employee_team_memberships WHERE employee_id=1 AND team_id=901 AND ended_at IS NULL LIMIT 1",[foreign,foreignTeam.team_id]);
 await db.query("INSERT INTO public.employee_data_scopes(scope_id,employee_id,scope_kind,scope_reference_id) VALUES(29992,$1,'team',$2)",[foreign,foreignTeam.team_id]);
 await db.query("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at) VALUES($1,1097,29992,now()-interval '1 day')",[foreign]);
 assert.equal((await q("SELECT public.f05_8_responsible_authorized_ci($1) allowed",[foreign]))[0].allowed,true);
 const switchUpstream=async(who,tag)=>{
  for(const cust of customers){
   await db.query('UPDATE public.customers SET current_owner_employee_id=$2 WHERE customer_id=$1',[cust,who]);
   await db.query('UPDATE public.demands SET responsible_employee_id=$2 WHERE customer_id=$1',[cust,who]);
  }
  for(let i=0;i<pair.length;i++)await reSign(pair[i].v,pair[i].p.trigger_demand_id,tag+'-'+i);
 };
 await switchUpstream(foreign,'r09-cross-team-re-sign');
 assert.equal((await q("SELECT public.f05_8_responsible_object_scope_ci($1,$2) allowed",[old.priority_id,foreign]))[0].allowed,false);
 const cross=await retryHandoverCI(auth,token,{handoverId:Number(handover.handover_id),targetEmployeeId:foreign,
  eventKey:kval('r09-cross-team-fail-closed')});
 assert.equal(cross.completed,false);assert.equal(Number((await current(v))[0].responsible_employee_id),1);
 await switchUpstream(target,'r08-canonical-owner-re-sign');
 assert.equal((await q("SELECT public.f05_8_responsible_object_scope_ci($1,$2) allowed",[old.priority_id,target]))[0].allowed,true);
 const transferred=await retryHandoverCI(auth,token,{handoverId:Number(handover.handover_id),targetEmployeeId:target,
  eventKey:kval('r07-success-retry')});
 assert.equal(transferred.allowed,true,JSON.stringify(transferred));assert.equal(transferred.completed,true);
 const now=(await current(v))[0];assert.equal(Number(now.priority_id),Number(old.priority_id));
 assert.equal(Number(now.responsible_employee_id),target);
 assert.equal(new Date(now.expires_at).getTime(),new Date(old.expires_at).getTime());
 assert.equal((await q("SELECT state FROM public.f05_8_handover_ci WHERE handover_id=$1",[handover.handover_id]))[0].state,'completed');
 const replay=await arb(v,'r07-completed-transfer-must-not-revert-original-employee');
 assert.equal(replay.allowed,true,JSON.stringify(replay));
 assert.equal(replay.handoverProtected,true);
 assert.equal(Number((await current(v))[0].responsible_employee_id),target,
  'post-transfer explicit arbitration must never rebind the old Employee');
 const attempts=await q("SELECT outcome FROM public.f05_8_handover_attempts_ci WHERE handover_id=$1 ORDER BY attempt_no",[handover.handover_id]);
 assert.deepEqual(attempts.map(x=>x.outcome),['failed','failed','failed','completed']);
 await db.query("UPDATE public.employees SET employment_status='inactive' WHERE employee_id=1");
 assert.equal(Number((await current(v))[0].priority_id),Number(old.priority_id),
  'original Employee invalidation cannot steal back or release a completed transferred Priority');
 await db.query("UPDATE public.employees SET employment_status='active' WHERE employee_id=1");
 console.log('F05_8_R07_SIGNED_PG16_HANDOVER',JSON.stringify({priorityId:Number(old.priority_id),
  old:1,new:target,handoverId:Number(handover.handover_id),attempts:attempts.length,ttlUnchanged:true}));
});
test('8-R02 employee data-scope revocation settles active Priority in source COMMIT',async()=>{
 // R07 transferred vehicles[0] to a NEW responsible; use the independent
 // Transaction-released vehicle still owned by the ORIGINAL Employee.
 const v=vehicles[3],old=(await current(v))[0];assert.ok(old);
 assert.equal(Number(old.responsible_employee_id),1,'original Employee must still hold this independent scope');
 const scope=(await q('SELECT scope_id,ended_at FROM public.employee_data_scopes WHERE scope_id=29001 AND employee_id=1'))[0];
 assert.ok(scope);assert.equal(scope.ended_at,null);
 await db.query('UPDATE public.employee_data_scopes SET ended_at=now() WHERE scope_id=29001 AND employee_id=1');
 const after=await current(v);
 assert.equal(after.length,1,'scope-only revocation must preserve the still-valid Customer Priority under Handover');
 assert.equal(Number(after[0].priority_id),Number(old.priority_id),'same source lease and TTL while handover pending');
 const h=(await q('SELECT handover_id,state FROM public.f05_8_handover_ci WHERE priority_id=$1',[old.priority_id]))[0];
 assert.ok(h);assert.equal(h.state,'pending');
 assert.equal((await arb(v,'r07-scope-no-longer-authorized')).allowed,false,'revoked actor cannot operate');
 await db.query('UPDATE public.employee_data_scopes SET ended_at=NULL WHERE scope_id=29001 AND employee_id=1');
 assert.equal(Number((await current(v))[0].priority_id),Number(old.priority_id));
});

test('8-R07 real two-backend handover serializes against Vehicle row lock without TTL extension',async()=>{
 const v=vehicles[3],old=(await current(v))[0];assert.ok(old);
 assert.equal(Number(old.responsible_employee_id),1);
 const h=(await q("SELECT handover_id,state FROM public.f05_8_handover_ci WHERE priority_id=$1",[old.priority_id]))[0];
 assert.ok(h);assert.equal(h.state,'pending','source event must have opened real Batch');
 const target=8997501,other=await connect();
 let pendingRetry;
 try{
  await other.query('BEGIN');
  const backend=Number((await other.query('SELECT pg_backend_pid() n')).rows[0].n);
  await other.query('SELECT vehicle_id FROM public.vehicles WHERE vehicle_id=$1 FOR UPDATE',[v.id]);
  let settled=false;
  pendingRetry=retryHandoverCI(auth,token,{handoverId:Number(h.handover_id),
   targetEmployeeId:target,eventKey:kval('r07-real-dual-pg-canonical-lock-order')});
  pendingRetry.then(()=>{settled=true},()=>{settled=true});
  await new Promise(resolve=>setTimeout(resolve,120));
  assert.equal(settled,false,'separate backend with locked Vehicle must serialize transfer');
  assert.equal((await q("SELECT state FROM public.f05_8_handover_ci WHERE handover_id=$1",[h.handover_id]))[0].state,'pending');
  await other.query('COMMIT');
  const result=await pendingRetry;
  assert.equal(result.allowed,true,JSON.stringify(result));assert.equal(result.completed,true);
  const now=(await current(v))[0];assert.equal(Number(now.priority_id),Number(old.priority_id));
  assert.equal(Number(now.responsible_employee_id),target);
  assert.equal(new Date(now.expires_at).getTime(),new Date(old.expires_at).getTime());
  const repeat=await retryHandoverCI(auth,token,{handoverId:Number(h.handover_id),
   targetEmployeeId:target,eventKey:kval('r07-idempotent-completed-handover')});
  assert.equal(repeat.code,'F05_8_HANDOVER_ALREADY_COMPLETED');
  assert.equal(Number((await q("SELECT count(*)::int n FROM public.f05_8_priority_ci WHERE vehicle_id=$1 AND listing_cycle_id=$2 AND status='active'",[v.id,v.cycle]))[0].n),1);
  console.log('F05_8_R07_REAL_TWO_PG_HANDOVER_SERIALIZED',
   JSON.stringify({holderPid:backend,priorityId:Number(old.priority_id),handoverId:Number(h.handover_id),
    handoverPreserved:true,ttlUnchanged:true,uniqueActive:1}));
 }finally{
  await other.query('ROLLBACK').catch(()=>{});
  await other.end();
  if(pendingRetry)await pendingRetry.catch(()=>{});
 }
});
test('8-R02 Demand source state change commits without an invalid active Priority or manual arb',async()=>{
 const v=vehicles[0],old=(await current(v))[0];assert.ok(old);
 await db.query("UPDATE public.demands SET demand_state='paused' WHERE demand_id=$1",[old.trigger_demand_id]);
 const signed=(await q("SELECT status FROM public.f05_7_result_versions_ci WHERE result_id=$1",[old.source_match_result_id]))[0];
 assert.equal(signed.status,'stale','signed PDM12 Match must be revoked by source change');
 const now=await current(v);
 assert.ok(now.length<=1);
 assert.ok(!now.length||Number(now[0].source_match_result_id)!==Number(old.source_match_result_id),
  'source COMMIT must settle old Priority before any external arbitrate call');
});
test('8-R04 v24 due-event settles ttl_expired, all old facts and successor idempotently',async()=>{
 const v=vehicles[0],old=(await current(v))[0];assert.ok(old);
 const cfg=await setTTLDefaultCI(auth,token,{seconds:172800,eventKey:kval('r04-future-successor-ttl')});
 assert.equal(cfg.allowed,true,JSON.stringify(cfg));
 const h=await initiateHandoverCI(auth,token,{priorityId:Number(old.priority_id),eventKey:kval('r04-handover-in-progress')});
 assert.equal(h.allowed,true,'handover may be pending while TTL continues');
 const asOf=new Date(new Date(old.expires_at).getTime()+2000).toISOString();
 const result=await processDuePrioritiesCI(auth,token,{eventKey:kval('r04-signed-ci-expiration-event'),asOf});
 assert.equal(result.allowed,true,JSON.stringify(result));
 assert.ok(result.settled.some(x=>x.priorityId===Number(old.priority_id)));
 const oldRow=(await q("SELECT status,ended_reason,ended_at FROM public.f05_8_priority_ci WHERE priority_id=$1",[old.priority_id]))[0];
 assert.equal(oldRow.status,'ended');assert.equal(oldRow.ended_reason,'ttl_expired');
 assert.ok(new Date(oldRow.ended_at)>=new Date(old.expires_at));
 const noRetry=await retryHandoverCI(auth,token,{handoverId:h.handoverId,targetEmployeeId:1,
  eventKey:kval('r04-after-due-handover-retry')});
 assert.equal(noRetry.allowed,false,'ended lease cannot be revived by pending handover retry');
 assert.equal(noRetry.code,'F05_8_HANDOVER_PRIORITY_ENDED_OR_EXPIRED');
 const oldFacts=await q('SELECT source_signature FROM public.f05_8_suppressed_facts_ci WHERE original_priority_id=$1',[old.priority_id]);
 assert.ok(oldFacts.length>0);
 const successor=await current(v);
 assert.ok(successor.length<=1);
 if(successor.length)assert.notEqual(Number(successor[0].customer_id),Number(old.customer_id));
 const repeated=await processDuePrioritiesCI(auth,token,{eventKey:kval('r04-due-event-idempotent-repeat'),asOf});
 assert.equal(repeated.allowed,true,JSON.stringify(repeated));assert.equal(repeated.dueCount,0);
});
test('8-R03 signed Recommendation and active Grant cannot pierce Customer/Level/cycle guards',async()=>{
 const v=vehicles[2],customerId=899612;
 // G0 signed Customer/Vehicle/Cycle/Recommendation/Grant composite FK contract.
 await db.query("INSERT INTO public.recommendations(recommendation_id,vehicle_id,customer_id,listing_cycle_id,status,recommender_employee_id) "+
  "VALUES(8997221,$1,$2,$3,'active',1)",[v.id,customerId,v.cycle]);
 await db.query("INSERT INTO public.vehicle_visibility_grants(grant_id,vehicle_id,customer_id,source_recommendation_id) "+
  "VALUES(8997221,$1,$2,8997221)",[v.id,customerId]);
 const read=()=>priorityProjectionCI(auth,token,{vehicleId:v.id,listingCycleId:v.cycle,customerId});
 const valid=await read();assert.equal(valid.existingGrantRetained,true);
 assert.equal(valid.customerVisible,true,'genuine signed hidden Grant is initially usable');
 await db.query("UPDATE public.customers SET account_status='disabled' WHERE customer_id=$1",[customerId]);
 const disabled=await read();
 assert.equal(disabled.customerVisible,false);assert.equal(disabled.existingGrantRetained,true);
 await db.query("UPDATE public.customers SET account_status='active' WHERE customer_id=$1",[customerId]);
 const restored=await read();assert.equal(restored.customerVisible,true);
 const level=(await q('SELECT customer_level_id FROM public.customers WHERE customer_id=$1',[customerId]))[0].customer_level_id;
 await db.query('UPDATE public.f05_6_level_find_policy_ci SET find_enabled=false WHERE level_id=$1',[level]);
 const findOff=await read();assert.equal(findOff.customerVisible,false);assert.equal(findOff.existingGrantRetained,true);
 await db.query('UPDATE public.f05_6_level_find_policy_ci SET find_enabled=true WHERE level_id=$1',[level]);
 assert.equal((await read()).customerVisible,true,'legal entitlement restoration reopens only still-valid Grant');
 await db.query("UPDATE public.vehicle_listing_cycles SET ended_at=now() WHERE listing_cycle_id=$1",[v.cycle]);
 const ended=await read();assert.equal(ended.customerVisible,false);assert.equal(ended.publicVisible,false);
 assert.equal(ended.currentCycleAvailable,false);assert.equal(ended.existingGrantRetained,true);
 assert.equal((await q('SELECT status FROM public.recommendations WHERE recommendation_id=8997221'))[0].status,'active');
 assert.equal((await q('SELECT revoked_at FROM public.vehicle_visibility_grants WHERE grant_id=8997221'))[0].revoked_at,null);
});

test('8-R01 signed factual novelty permits same-cycle recovery only for changed verified Match signature',async()=>{
 const v=vehicles[0],customerId=899612;
 const oldFacts=await q("SELECT source_signature FROM public.f05_8_suppressed_facts_ci WHERE customer_id=$1 AND vehicle_id=$2 AND listing_cycle_id=$3",
  [customerId,v.id,v.cycle]);
 assert.ok(oldFacts.length>0,'old signed fact suppression must exist');
 const activeDemand=(await q("SELECT d.demand_id FROM public.demands d JOIN public.f05_7_sales_condition_ci sc ON sc.demand_id=d.demand_id "+
  "WHERE d.customer_id=$1 AND d.demand_state='active' ORDER BY d.demand_id LIMIT 1",[customerId]))[0];
 assert.ok(activeDemand,'fresh signed result requires current ready Demand');
 await db.query("UPDATE public.f05_7_vehicle_facts_ci SET fact_version=fact_version+1 WHERE vehicle_id=$1 AND listing_cycle_id=$2",
  [v.id,v.cycle]);
 assert.equal((await current(v)).length,0,'changed source revokes prior active Priority before recalculation');

 // F05-7 complete service intentionally seals v23; invoking it after v24
 // must fail closed. Reuse its *unchanged pure signed tier algorithm* on
 // real v24 PG rows, then insert a verified source-event fixture into the
 // original immutable F05-7 result_versions table (CI-only, never production).
 const rules=await q("SELECT rule_id,rule_version,phrase,condition_json FROM public.f05_7_rule_dictionary_ci "+
  "WHERE valid_from<=statement_timestamp() AND (valid_until IS NULL OR valid_until>statement_timestamp())");
 const digest=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
 const ruleSHA=digest(rules.map(r=>[r.rule_id,r.rule_version,r.phrase,r.condition_json]).sort((a,b)=>a[0]-b[0]));
 const sales=(await q('SELECT condition_json,description_version,rule_version_sha256 FROM public.f05_7_sales_condition_ci WHERE demand_id=$1',
  [activeDemand.demand_id]))[0];
 assert.equal(sales.rule_version_sha256,ruleSHA,'reconstructed source uses the exact signed active dictionary');
 const facts=(await q('SELECT facts_json,fact_version FROM public.f05_7_vehicle_facts_ci WHERE vehicle_id=$1 AND listing_cycle_id=$2',
  [v.id,v.cycle]))[0];
 const d=(await q('SELECT demand_state FROM public.demands WHERE demand_id=$1',[activeDemand.demand_id]))[0];
 const customer=(await q('SELECT account_status,customer_level_id FROM public.customers WHERE customer_id=$1',[customerId]))[0];
 const vehicle=(await q('SELECT source_sale_status FROM public.vehicles WHERE vehicle_id=$1',[v.id]))[0];
 const cycle=(await q('SELECT ended_at FROM public.vehicle_listing_cycles WHERE listing_cycle_id=$1',[v.cycle]))[0];
 const locks=await q("SELECT lock_id,expires_at FROM public.locks WHERE vehicle_id=$1 AND listing_cycle_id=$2 "+
  "AND lock_status='active' AND expires_at>statement_timestamp() ORDER BY lock_id",[v.id,v.cycle]);
 const lockedSeal=locks.map(x=>[String(x.lock_id),x.expires_at]);
 const tier=originalSignedTierFor(sales.condition_json,facts.facts_json);
 assert.ok(['high','acceptable'].includes(tier.tier),'only signed eligible match ranks may regain Priority');
 const signature=digest([sales.description_version,ruleSHA,facts.fact_version,facts.facts_json,
  d.demand_state,customer.account_status,customer.customer_level_id,vehicle.source_sale_status,cycle.ended_at,lockedSeal]);
 const signed=await q("INSERT INTO public.f05_7_result_versions_ci(demand_id,vehicle_id,listing_cycle_id,tier,status,source_signature,explanations,reason,run_key) "+
  "VALUES($1,$2,$3,$4,'current',$5,$6::jsonb,$7,$8) RETURNING result_id,source_signature",
  [activeDemand.demand_id,v.id,v.cycle,tier.tier,signature,JSON.stringify(tier.explanations),tier.reason,
   kval('r01-verified-pg16-signature')]);
 assert.equal(signed.length,1);
 const now=(await current(v))[0];assert.ok(now,'a new trusted signature should re-enable legal Customer');
 assert.equal(Number(now.customer_id),customerId);
 assert.ok(!oldFacts.some(f=>f.source_signature===now.source_signature),'new source cannot equal suppressed old signature');
});
test('8-R02 Customer deactivation after fresh signed Match closes Priority before COMMIT returns',async()=>{
 const v=vehicles[0],p=(await current(v))[0];assert.ok(p);
 assert.equal(Number(p.customer_id),899612);
 await db.query("UPDATE public.customers SET account_status='disabled' WHERE customer_id=$1",[p.customer_id]);
 const state=(await q("SELECT status FROM public.f05_8_priority_ci WHERE priority_id=$1",[p.priority_id]))[0];
 assert.equal(state.status,'ended');
 const active=await current(v);
 if(active.length)assert.notEqual(Number(active[0].customer_id),899612,'disabled Customer cannot retain Priority');
});
