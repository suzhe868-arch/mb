import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes,createHash} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect,verify,ID,checksum} from '../migration.mjs';
import {arbitrateCI,setQualificationCI,setTTLDefaultCI,releaseCI,
 priorityProjectionCI,initiateHandoverCI,retryHandoverCI,productionDeny} from '../service.mjs';
const db=await connect(),secret=randomBytes(32);
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin:'https://127.0.0.1:48988'});
let token,vehicles=[],demands=[],statsBefore={},race=[];
const q=(sql,args=[])=>db.query(sql,args).then(x=>x.rows);
const kval=s=>'f05-8-official-'+s+'-signed';
const arb=(v,label,opts={})=>arbitrateCI(auth,token,{teamId:901,vehicleId:v.id,listingCycleId:v.cycle,runKey:kval(label),...opts});
const qualification=(id,enabled,label)=>setQualificationCI(auth,token,{customerId:id,enabled,eventKey:kval(label)});
const current=v=>q("SELECT * FROM public.f05_8_priority_ci WHERE vehicle_id=$1 AND listing_cycle_id=$2 AND status='active'",[v.id,v.cycle]);
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
 assert.equal((await q('SELECT count(*)::int n FROM public.f05_8_priority_ci'))[0].n,vehicles.length);
});
test('8-A02 non-qualified Customer has signed current Match yet no Priority; fail-closed production',async()=>{
 const original=(await q("SELECT count(*)::int n FROM public.f05_7_result_versions_ci r WHERE r.vehicle_id=$1 AND r.listing_cycle_id=$2 AND r.status='current' AND r.tier IN ('high','acceptable')",[vehicles[0].id,vehicles[0].cycle]))[0].n;
 assert.ok(original>=5,'Multiple real signed current high or acceptable Match Results required');
 assert.equal((await arb(vehicles[0],'not-qualified')).code,'F05_8_NO_LEGAL_PRIORITY_CANDIDATE');
 assert.equal(productionDeny().allowed,false);
});
test('8-A03 qualification is independent of level, creates no Demand, Recommendation, Lock or Priority by itself',async()=>{
 const before=(await q('SELECT customer_level_id,current_owner_employee_id FROM public.customers WHERE customer_id=899612'))[0];
 const demandCount=Number((await q('SELECT count(*)::int n FROM public.demands'))[0].n);
 for(const [id,enabled,label] of [[899612,true,'qualification-first'],[899620,true,'qualification-low'],[899613,true,'qualification-second'],[899618,true,'qualification-third'],[899619,true,'qualification-fourth']]){
  const x=await qualification(id,enabled,label);assert.equal(x.allowed,true,JSON.stringify(x));
 }
 assert.equal((await q('SELECT count(*)::int n FROM public.f05_8_priority_ci'))[0].n,0);
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
 const s=(await q('SELECT suppressed_source_signature FROM public.f05_8_suppression_ci WHERE customer_id=899612 AND vehicle_id=$1',[v.id]))[0];
 assert.equal(s.suppressed_source_signature,before.source_signature);
 assert.equal((await arb(v,'try-reclaim-same-facts')).customerId,899613);
});
test('8-A10 qualification OFF closes only that Customer Priority; Demand stays active and triggers successor',async()=>{
 const v=vehicles[0],p=(await current(v))[0];assert.equal(Number(p.customer_id),899613);
 const x=await qualification(899613,false,'turn-off-after-active');
 assert.equal(x.allowed,true);assert.equal(x.released,1);
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
