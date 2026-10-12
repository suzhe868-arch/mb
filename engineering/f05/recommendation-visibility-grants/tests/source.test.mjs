import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect,verify} from '../migration.mjs';
import {createRecommendationCI,finishRecommendationCI,batchRecommendCI,customerProjectionCI,productionDeny} from '../service.mjs';
const c=await connect(),auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,
 secret:randomBytes(32),origin:'https://127.0.0.1:48989'});
const q=(s,a=[])=>c.query(s,a).then(z=>z.rows);
const identity='CI_SYNTHETIC_CUSTOMER_IDENTITY_NOT_PRODUCTION',key=s=>'f05-9-pdm14-signed-'+s;
let token,v,cy,customerId,recId,created;
const proj=(who,opts={})=>customerProjectionCI(c,{customerId:who,vehicleId:v,listingCycleId:cy,
 syntheticCustomerIdentity:identity,...opts});
test.before(async()=>{
 assert.equal((await verify(c)).verified,true);
 const s=await auth.login({login:'employee_test',password:'SyntheticF04_3_CurrentProof_2026',source:'f05-9-native-source'});
 assert.equal(s.code,'AUTH_OK');token=s.token;
 // Select the actual F05-7 signed source fixtures, not hardcoded vehicle ID.
 const candidates=await q("SELECT vf.vehicle_id,vf.listing_cycle_id,cs.customer_id "+
  "FROM public.f05_7_vehicle_facts_ci vf "+
  "JOIN public.vehicles v ON v.vehicle_id=vf.vehicle_id "+
  "JOIN public.vehicle_listing_cycles lc ON lc.listing_cycle_id=vf.listing_cycle_id AND lc.vehicle_id=v.vehicle_id "+
  "JOIN public.customers cs ON cs.customer_id IN (899612,899613,899618,899619,899620) "+
  "JOIN public.f05_6_level_find_policy_ci fp ON fp.level_id=cs.customer_level_id AND fp.find_enabled "+
  "WHERE v.source_type='wholesale' AND v.source_sale_status='active' AND v.archived_at IS NULL "+
  "AND lc.ended_at IS NULL AND cs.account_status='active' AND cs.current_owner_employee_id=1 "+
  "AND cs.owner_assignment_state='assigned' AND "+
  "NOT EXISTS(SELECT 1 FROM public.recommendations r WHERE r.customer_id=cs.customer_id "+
  "AND r.vehicle_id=v.vehicle_id AND r.listing_cycle_id=lc.listing_cycle_id AND r.status='active') "+
  "ORDER BY vf.vehicle_id,cs.customer_id LIMIT 1");
 assert.ok(candidates.length,'real signed v23 Customer/Vehicle/Find source required');
 const f=candidates[0];v=Number(f.vehicle_id);cy=Number(f.listing_cycle_id);customerId=Number(f.customer_id);
 console.log('F05_9_NATIVE_PHYSICAL_SOURCE',JSON.stringify({v,cy,customerId,backend:(await q('SELECT pg_backend_pid() pid'))[0].pid}));
});
test.after(async()=>{await auth.close();await c.end()});
test('9-S01 signed prior v24 and new v25 seal, no pre-created free rights',async()=>{
 const x=await verify(c);assert.equal(x.verified,true);assert.match(x.checksum,/^[a-f0-9]{64}$/);
 assert.equal((await q('SELECT count(*)::int n FROM public.f03_schema_migrations'))[0].n,23);
 assert.equal((await q('SELECT count(*)::int n FROM public.f05_9_price_right_ci'))[0].n,0);
 assert.equal(productionDeny().allowed,false);
});
test('9-S02 create true M94 Recommendation, free wholesale price fact and immutable original snapshot',async()=>{
 const z=await createRecommendationCI(auth,token,{teamId:901,customerId,vehicleId:v,listingCycleId:cy,eventKey:key('create-real')});
 assert.equal(z.allowed,true,JSON.stringify(z));assert.equal(z.created,true);recId=z.recommendationId;created=z;
 const rec=(await q('SELECT * FROM public.recommendations WHERE recommendation_id=$1',[recId]))[0];
 assert.equal(rec.status,'active');assert.equal(Number(rec.customer_id),customerId);
 const fact=(await q('SELECT * FROM public.f05_9_recommendation_facts_ci WHERE recommendation_id=$1',[recId]))[0];
 assert.equal(Number(fact.original_recommender_id),1);
 const right=await q('SELECT original_recommendation_id FROM public.f05_9_price_right_ci WHERE customer_id=$1 AND vehicle_id=$2 AND listing_cycle_id=$3',[customerId,v,cy]);
 assert.equal(right.length,1);assert.equal(Number(right[0].original_recommendation_id),recId);
 assert.equal((await q('SELECT count(*)::int n FROM public.customer_price_unlock_events WHERE customer_id=$1',[customerId]))[0].n,0,
 'Recommendation free price fact cannot debit daily quota');
 await assert.rejects(()=>c.query("UPDATE public.f05_9_recommendation_facts_ci SET original_price_snapshot='{}'::jsonb WHERE recommendation_id=$1",[recId]),/F05_9_SIGNED_RECOMMENDATION_HISTORY_IMMUTABLE/);
 console.log('F05_9_REAL_M94_RECOMMENDATION_AND_INDEPENDENT_WHOLESALE_PRICE_RIGHT',{recId,v,customerId});
});
test('9-S03 idempotency touch, no second active or original rewrite',async()=>{
 const before=(await q('SELECT * FROM public.f05_9_recommendation_facts_ci WHERE recommendation_id=$1',[recId]))[0];
 const res=await createRecommendationCI(auth,token,{teamId:901,customerId,vehicleId:v,listingCycleId:cy,eventKey:key('touch-once')});
 assert.equal(res.allowed,true);assert.equal(res.created,false);assert.equal(res.recommendationId,recId);
 assert.equal((await q("SELECT count(*)::int n FROM public.recommendations WHERE customer_id=$1 AND vehicle_id=$2 AND listing_cycle_id=$3 AND status='active'",[customerId,v,cy]))[0].n,1);
 const after=(await q('SELECT * FROM public.f05_9_recommendation_facts_ci WHERE recommendation_id=$1',[recId]))[0];
 assert.deepEqual(after,before);
 const repeat=await createRecommendationCI(auth,token,{customerId,vehicleId:v,listingCycleId:cy,eventKey:key('touch-once')});
 assert.equal(repeat.recommendationId,recId);
 assert.equal((await q("SELECT count(*)::int n FROM public.f05_9_recommendation_events_ci WHERE event_key=$1",[key('touch-once')]))[0].n,1);
});
test('9-S04 dynamic hidden vehicle creates customer-specific grant, not public visibility or transferable Share rights',async()=>{
 const normal=await proj(customerId);assert.equal(normal.allowed,true);assert.equal(normal.visible,true);
 await c.query("UPDATE public.vehicles SET platform_visibility='hidden' WHERE vehicle_id=$1",[v]);
 const mine=await proj(customerId);assert.equal(mine.visible,true,JSON.stringify(mine));
 assert.equal(mine.publicVisible,false);assert.equal(mine.recommendationOnlyVisible,true);
 const others=(await q("SELECT customer_id FROM public.customers WHERE customer_id<>$1 AND account_status='active' ORDER BY customer_id LIMIT 1",[customerId]))[0];
 assert.ok(others);
 const shared=await proj(Number(others.customer_id),{entry:'ordinary_share'});
 assert.equal(shared.visible,false);assert.equal(shared.customerDisplayCents,null);
 assert.equal((await q('SELECT count(*)::int n FROM public.f05_9_recommendation_facts_ci WHERE customer_id=$1',[others.customer_id]))[0].n,0);
 assert.equal((await q('SELECT count(*)::int n FROM public.f05_9_price_right_ci WHERE customer_id=$1',[others.customer_id]))[0].n,0);
 await c.query("UPDATE public.vehicles SET platform_visibility='visible' WHERE vehicle_id=$1",[v]);
 await c.query("UPDATE public.vehicles SET platform_visibility='hidden' WHERE vehicle_id=$1",[v]);
 assert.equal((await q("SELECT count(*)::int n FROM public.vehicle_visibility_grants WHERE source_recommendation_id=$1 AND revoked_at IS NULL",[recId]))[0].n,1);
});
test('9-S05 current identity and current cycle/vehicle guard deny external forged share and expired source',async()=>{
 const denied=await customerProjectionCI(c,{customerId,vehicleId:v,listingCycleId:cy,entry:'ordinary_share',syntheticCustomerIdentity:'WECHAT_FORGED'});
 assert.equal(denied.allowed,false);
 await c.query("UPDATE public.customers SET account_status='disabled' WHERE customer_id=$1",[customerId]);
 assert.equal((await proj(customerId)).visible,false);
 const blockedCreate=await createRecommendationCI(auth,token,{customerId,vehicleId:v,listingCycleId:cy,eventKey:key('disabled-create-deny')});
 assert.equal(blockedCreate.allowed,false,JSON.stringify(blockedCreate));
 await c.query("UPDATE public.customers SET account_status='active' WHERE customer_id=$1",[customerId]);
 assert.equal((await proj(customerId)).visible,true);
});
test('9-S06 two PostgreSQL backends serialize duplicate recommendation, free right remains unique',async()=>{
 const other=await connect();let started;try{
  await other.query('BEGIN');
  const pid=Number((await other.query('SELECT pg_backend_pid() pid')).rows[0].pid);
  await other.query('SELECT vehicle_id FROM public.vehicles WHERE vehicle_id=$1 FOR UPDATE',[v]);
  let settled=false;
  started=createRecommendationCI(auth,token,{customerId,vehicleId:v,listingCycleId:cy,eventKey:key('dual-pg-duplicate')});
  started.then(()=>settled=true,()=>settled=true);
  await new Promise(resolve=>setTimeout(resolve,120));
  assert.equal(settled,false,'real second PG16 backend vehicle lock serializes recommendation');
  await other.query('COMMIT');
  const x=await started;assert.equal(x.recommendationId,recId);assert.equal(x.created,false);
  assert.equal((await q("SELECT count(*)::int n FROM public.f05_9_price_right_ci WHERE customer_id=$1 AND vehicle_id=$2",[customerId,v]))[0].n,1);
  console.log('F05_9_GENUINE_TWO_BACKEND_DUPLICATE_RACE',JSON.stringify({pid,recId}));
 }finally{await other.query('ROLLBACK').catch(()=>{});await other.end();if(started)await started.catch(()=>{})}
});
test('9-S06a current scope, source Demand and Customer gates fail closed without partial rights',async()=>{
 const before=(await q('SELECT count(*)::int n FROM public.f05_9_recommendation_facts_ci'))[0].n;
 const cases=[
  {teamId:987654,customerId,vehicleId:v,listingCycleId:cy,eventKey:key('invalid-team')},
  {teamId:901,customerId,vehicleId:v,listingCycleId:cy,sourceDemandId:999999999,eventKey:key('invalid-demand')},
  {teamId:901,customerId:999999999,vehicleId:v,listingCycleId:cy,eventKey:key('invalid-customer')}
 ];
 for(const data of cases){
  const denied=await createRecommendationCI(auth,token,data);
  assert.equal(denied.allowed,false,JSON.stringify(denied));
 }
 assert.equal((await q('SELECT count(*)::int n FROM public.f05_9_recommendation_facts_ci'))[0].n,before);
 assert.equal((await q('SELECT count(*)::int n FROM public.f05_9_price_right_ci WHERE customer_id=$1 AND vehicle_id=$2',[customerId,v]))[0].n,1);
});
test('9-S06b customer detail reading waits for concurrent Vehicle visibility COMMIT',async()=>{
 const other=await connect();let reading;
 try{
  await other.query('BEGIN');
  const pid=Number((await other.query('SELECT pg_backend_pid() pid')).rows[0].pid);
  await other.query("UPDATE public.vehicles SET platform_visibility='visible' WHERE vehicle_id=$1",[v]);
  let completed=false;
  reading=proj(customerId);
  reading.then(()=>completed=true,()=>completed=true);
  await new Promise(resolve=>setTimeout(resolve,120));
  assert.equal(completed,false,'Customer projection must block behind uncommitted Vehicle change');
  await other.query('COMMIT');
  const current=await reading;
  assert.equal(current.allowed,true,JSON.stringify(current));
  assert.equal(current.publicVisible,true,'projection must see post-COMMIT visibility');
  console.log('F05_9_TWO_BACKEND_CUSTOMER_PROJECTION_SERIALIZED',JSON.stringify({pid,vehicleId:v}));
 }finally{
  await other.query('ROLLBACK').catch(()=>{});
  await other.end();
  if(reading)await reading.catch(()=>{});
  await c.query("UPDATE public.vehicles SET platform_visibility='hidden' WHERE vehicle_id=$1",[v]);
 }
});
test('9-S06c batch keeps legal existing Vehicle result when another Vehicle fails independently',async()=>{
 const before=(await q('SELECT count(*)::int n FROM public.f05_9_recommendation_facts_ci'))[0].n;
 const result=await batchRecommendCI(auth,token,{customerId,
  vehicleCycles:[{vehicleId:v,listingCycleId:cy},{vehicleId:999999999,listingCycleId:cy}],
  eventPrefix:key('partial-batch')});
 assert.equal(result.allowed,true);
 assert.equal(result.entries.length,2);
 assert.equal(result.entries[0].allowed,true,JSON.stringify(result.entries));
 assert.equal(result.entries[0].created,false);
 assert.equal(result.entries[0].recommendationId,recId);
 assert.equal(result.entries[1].allowed,false);
 assert.equal((await q('SELECT count(*)::int n FROM public.f05_9_recommendation_facts_ci'))[0].n,before);
});
test('9-S07 end and re-create are distinct historic recommendations; free right survives end',async()=>{
 const result=await finishRecommendationCI(auth,token,{recommendationId:recId,kind:'end',eventKey:key('end')});
 assert.equal(result.allowed,true,JSON.stringify(result));
 assert.equal((await q('SELECT status FROM public.recommendations WHERE recommendation_id=$1',[recId]))[0].status,'ended');
 assert.equal((await q('SELECT count(*)::int n FROM public.f05_9_price_right_ci WHERE original_recommendation_id=$1',[recId]))[0].n,1);
 assert.equal((await q("SELECT count(*)::int n FROM public.vehicle_visibility_grants WHERE source_recommendation_id=$1 AND revoked_at IS NULL",[recId]))[0].n,0);
 const z=await createRecommendationCI(auth,token,{customerId,vehicleId:v,listingCycleId:cy,eventKey:key('recreate')});
 assert.equal(z.allowed,true,JSON.stringify(z));assert.notEqual(z.recommendationId,recId);
 await c.query("UPDATE public.vehicle_listing_cycles SET ended_at=now() WHERE listing_cycle_id=$1",[cy]);
 assert.equal((await proj(customerId)).visible,false);
 assert.equal((await proj(customerId)).currentCycleFreeWholesaleRight,false);
 assert.equal((await q("SELECT count(*)::int n FROM public.f05_9_price_right_ci WHERE customer_id=$1 AND vehicle_id=$2",[customerId,v]))[0].n,1);
 const wrong=await createRecommendationCI(auth,token,{customerId,vehicleId:v,listingCycleId:cy,eventKey:key('old-cycle-deny')});
 assert.equal(wrong.allowed,false);
});
test('9-S08 batch uses per-Vehicle independent guard and never group Recommendation',async()=>{
 const result=await batchRecommendCI(auth,token,{customerId,vehicleCycles:[{vehicleId:v,listingCycleId:cy},{vehicleId:999999999,listingCycleId:cy}],eventPrefix:key('batch')});
 assert.equal(result.allowed,true);assert.equal(result.entries.length,2);
 assert.equal(result.entries[0].allowed,false);
 assert.equal(result.entries[1].allowed,false);
});

test('9-S09 signed current responsible can void active historic Recommendation after cycle end without reviving old price rights',async()=>{
 const hist=(await q("SELECT recommendation_id FROM public.recommendations WHERE vehicle_id=$1 "+
  "AND listing_cycle_id=$2 AND customer_id=$3 AND status='active' ORDER BY recommendation_id DESC LIMIT 1",[v,cy,customerId]))[0];
 assert.ok(hist,'previous test preserved independent Recommendation history after old cycle closed');
 const denied=await finishRecommendationCI(auth,'not-a-session',{recommendationId:Number(hist.recommendation_id),kind:'void',
  reason:'synthetic creation correction',eventKey:key('invalid-actor-denied')});
 assert.equal(denied.allowed,false,'unauthenticated object probing denied');
 const finished=await finishRecommendationCI(auth,token,{recommendationId:Number(hist.recommendation_id),kind:'void',
  reason:'CI synthetic signed creation correction',eventKey:key('void-ended-cycle')});
 assert.equal(finished.allowed,true,JSON.stringify(finished));
 assert.equal((await q('SELECT status FROM public.recommendations WHERE recommendation_id=$1',[hist.recommendation_id]))[0].status,'void');
 const immutable=(await q('SELECT * FROM public.f05_9_recommendation_facts_ci WHERE recommendation_id=$1',[hist.recommendation_id]))[0];
 assert.ok(immutable.original_price_snapshot);assert.equal(Number(immutable.customer_id),customerId);
 assert.equal((await q('SELECT count(*)::int n FROM public.f05_9_price_right_ci WHERE customer_id=$1 AND vehicle_id=$2',[customerId,v]))[0].n,1);
 assert.equal((await proj(customerId)).visible,false);
 console.log('F05_9_END_VOID_OLD_CYCLE_APPEND_ONLY_PASS',JSON.stringify({id:Number(hist.recommendation_id),v,cy}));
});
