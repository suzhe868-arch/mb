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

const aux=async()=>{
 const found=await q("SELECT vf.vehicle_id,vf.listing_cycle_id FROM public.f05_7_vehicle_facts_ci vf "+
 "JOIN public.vehicles ve ON ve.vehicle_id=vf.vehicle_id "+
 "JOIN public.vehicle_listing_cycles lc ON lc.listing_cycle_id=vf.listing_cycle_id "+
 "WHERE ve.source_type='wholesale' AND ve.source_sale_status='active' AND ve.archived_at IS NULL "+
 "AND lc.ended_at IS NULL AND vf.vehicle_id<>$1 ORDER BY vf.vehicle_id LIMIT 4",[v]);
 assert.equal(found.length,4,'R01-R04 require four other real signed wholesale Vehicle/cycle sources');
 return found.map(x=>({vehicleId:Number(x.vehicle_id),listingCycleId:Number(x.listing_cycle_id)}));
};
test('9-R01 real v24 qualified other-Customer Priority suppresses B detail/share/my-rec and restores only after signed release',async()=>{
 const previous=(await q('SELECT * FROM public.f05_9_price_right_ci WHERE original_recommendation_id=$1',[recId]))[0];
 const history=(await q('SELECT * FROM public.f05_9_recommendation_facts_ci WHERE recommendation_id=$1',[recId]))[0];
 const oldGrant=(await q("SELECT grant_id FROM public.vehicle_visibility_grants WHERE source_recommendation_id=$1 AND revoked_at IS NULL",[recId]))[0];
 assert.ok(previous&&oldGrant);
 // Signed v23 Match result + genuine PDM11 find + explicit v24 Priority qualification.
 await c.query("INSERT INTO public.f05_8_qualification_ci(customer_id,enabled,updated_by_employee_id) "+
  "VALUES(899613,true,1) ON CONFLICT(customer_id) DO UPDATE SET enabled=EXCLUDED.enabled");
 const candidate=(await q("SELECT * FROM public.f05_8_eligible_candidates_ci "+
  "WHERE vehicle_id=$1 AND listing_cycle_id=$2 AND customer_id=899613 "+
  "ORDER BY created_at,demand_id LIMIT 1",[v,cy]))[0];
 assert.ok(candidate&&['high','acceptable'].includes(candidate.tier),'real signed current acceptable/high Match required');
 const store=(await q('SELECT store_id FROM public.employees WHERE employee_id=1'))[0].store_id;
 const writer=await connect();let reading;
 try{
  await writer.query('BEGIN');
  const writerPid=Number((await writer.query('SELECT pg_backend_pid() pid')).rows[0].pid);
  await writer.query('SELECT vehicle_id FROM public.vehicles WHERE vehicle_id=$1 FOR UPDATE',[v]);
  const p=(await writer.query("INSERT INTO public.f05_8_priority_ci(customer_id,vehicle_id,listing_cycle_id,trigger_demand_id,"+
   "responsible_employee_id,origin_team_id,origin_store_id,source_match_result_id,source_signature,expires_at,creation_key) "+
   "VALUES(899613,$1,$2,$3,1,901,$4,$5,$6,now()+interval '24 hours',$7) RETURNING priority_id,expires_at",
   [v,cy,candidate.demand_id,store,candidate.result_id,candidate.source_signature,key('r01-real-priority')])).rows[0];
  let done=false;
  reading=proj(customerId,{entry:'ordinary_share'});
  reading.then(()=>done=true,()=>done=true);
  await new Promise(resolve=>setTimeout(resolve,120));
  assert.equal(done,false,'Customer projection must wait on genuine Priority source Vehicle lock');
  await writer.query('COMMIT');
  const blocked=await reading;
  for(const entry of ['detail','ordinary_share','my_recommendations']){
   const result=entry==='ordinary_share'?blocked:await proj(customerId,{entry});
   assert.equal(result.visible,false,JSON.stringify(result));
   assert.equal(result.publicVisible,false);
   assert.equal(result.hasCurrentRecommendation,false);
   assert.equal(result.currentCycleFreeWholesaleRight,false);
   assert.equal(result.customerDisplayCents,null);
   assert.equal(result.priceStatus,'not_authorized');
  }
  const self=await proj(899613);
  assert.equal(self.currentCycleFreeWholesaleRight,false,'Priority does not confer a Recommendation price right');
  assert.equal(self.hasCurrentRecommendation,false,'Priority does not fabricate Recommendation');
  assert.deepEqual((await q('SELECT * FROM public.f05_9_recommendation_facts_ci WHERE recommendation_id=$1',[recId]))[0],history);
  assert.equal((await q('SELECT count(*)::int n FROM public.f05_9_price_right_ci WHERE original_recommendation_id=$1',[recId]))[0].n,1);
  assert.equal((await q("SELECT count(*)::int n FROM public.vehicle_visibility_grants WHERE grant_id=$1 AND revoked_at IS NULL",[oldGrant.grant_id]))[0].n,1);
  // v24 signed database source-reconciliation entry works on additive v25.
  // The v24 JS API rejects any later migration ledger by design; never weaken that frozen verifier.
  await c.query('UPDATE public.f05_8_qualification_ci SET enabled=false WHERE customer_id=899613');
  await c.query('SELECT public.f05_8_reconcile_scope_ci($1,$2)',[v,cy]);
  assert.equal((await q('SELECT status FROM public.f05_8_priority_ci WHERE priority_id=$1',[p.priority_id]))[0].status,'ended');
  assert.equal((await proj(customerId)).visible,true,'release rechecks original active rec + same cycle + Customer entitlement');
  assert.equal((await q('SELECT count(*)::int n FROM public.f05_9_price_right_ci WHERE original_recommendation_id=$1',[recId]))[0].n,1);
  console.log('F05_9_R01_REAL_SIGNED_PRIORITY_B_HISTORIC_RETENTION_SUPPRESS_RELEASE',JSON.stringify({writerPid,priorityId:Number(p.priority_id),recId,originalExpires:p.expires_at}));
 }finally{await writer.query('ROLLBACK').catch(()=>{});await writer.end();if(reading)await reading.catch(()=>{})}
});
test('9-R02 find Level off/on, disable, lawful historic end/void and never historic rights revival',async()=>{
 const cars=await aux();const target=cars[2];
 const off=(await q('SELECT level_id FROM public.f05_6_level_find_policy_ci WHERE find_enabled=false ORDER BY level_id LIMIT 1'))[0];
 assert.ok(off,'PDM11 has signed no-find Level');
 const level=(await q('SELECT customer_level_id FROM public.customers WHERE customer_id=$1',[customerId]))[0].customer_level_id;
 const raw=(await createRecommendationCI(auth,token,{customerId,vehicleId:target.vehicleId,listingCycleId:target.listingCycleId,eventKey:key('r02-created')}));
 assert.equal(raw.allowed,true,JSON.stringify(raw));assert.equal(raw.created,true);
 await c.query('UPDATE public.customers SET customer_level_id=$2 WHERE customer_id=$1',[customerId,off.level_id]);
 assert.equal((await proj(customerId)).visible,false,'no-find hidden original Recommendation must suspend');
 assert.equal((await proj(customerId)).currentCycleFreeWholesaleRight,false,'no-find projection cannot offer Recommendation-only price');
 const noFind=await createRecommendationCI(auth,token,{customerId,vehicleId:target.vehicleId,listingCycleId:target.listingCycleId,eventKey:key('r02-no-find-create')});
 assert.equal(noFind.allowed,false);
 const terminated=await finishRecommendationCI(auth,token,{recommendationId:raw.recommendationId,kind:'end',eventKey:key('r02-end-without-find')});
 assert.equal(terminated.allowed,true,JSON.stringify(terminated));
 assert.equal((await q('SELECT status FROM public.recommendations WHERE recommendation_id=$1',[raw.recommendationId]))[0].status,'ended');
 await c.query('UPDATE public.customers SET customer_level_id=$2 WHERE customer_id=$1',[customerId,level]);
 assert.equal((await proj(customerId)).visible,true,'original still-active Recommendation restored');
 const reopened=await createRecommendationCI(auth,token,{customerId,vehicleId:target.vehicleId,listingCycleId:target.listingCycleId,eventKey:key('r02-distinct-recreation')});
 assert.equal(reopened.allowed,true);assert.notEqual(reopened.recommendationId,raw.recommendationId);
 await c.query("UPDATE public.customers SET account_status='disabled' WHERE customer_id=$1",[customerId]);
 assert.equal((await proj(customerId)).visible,false);
 const voided=await finishRecommendationCI(auth,token,{recommendationId:reopened.recommendationId,kind:'void',
  reason:'CI signed historic correction after disable',eventKey:key('r02-void-disabled')});
 assert.equal(voided.allowed,true,JSON.stringify(voided));
 assert.equal((await q('SELECT status FROM public.recommendations WHERE recommendation_id=$1',[reopened.recommendationId]))[0].status,'void');
 await c.query("UPDATE public.customers SET account_status='active' WHERE customer_id=$1",[customerId]);
 assert.equal((await proj(customerId)).visible,true);
 assert.equal((await q("SELECT count(*)::int n FROM public.f05_9_price_right_ci WHERE original_recommendation_id IN ($1,$2)",[raw.recommendationId,reopened.recommendationId]))[0].n,1,
  'current-cycle price rights are per Customer/Vehicle/cycle, not regranted per new rec');
 assert.equal((await q("SELECT count(*)::int n FROM public.recommendations WHERE recommendation_id IN ($1,$2) AND status='active'",[raw.recommendationId,reopened.recommendationId]))[0].n,0);
 console.log('F05_9_R02_REAL_LEVEL_DISABLE_HISTORIC_GOVERNANCE_PRESERVED');
});
test('9-R03 price consultation to numeric, immutable snapshot, current repricing and same-Vehicle conversion',async()=>{
 const cars=await aux(),target=cars[3],vid=target.vehicleId,cid=target.listingCycleId;
 await c.query("INSERT INTO public.f05_4_current_price_ci(vehicle_id,listing_cycle_id,customer_display_cents) "+
  "VALUES($1,$2,NULL) ON CONFLICT(vehicle_id,listing_cycle_id) DO UPDATE SET customer_display_cents=NULL",[vid,cid]);
 const createdR=await createRecommendationCI(auth,token,{customerId,vehicleId:vid,listingCycleId:cid,eventKey:key('r03-consultation-first')});
 assert.equal(createdR.allowed,true,JSON.stringify(createdR));
 assert.equal(createdR.wholesaleFreePrice,true);
 const original=(await q('SELECT original_price_snapshot FROM public.f05_9_recommendation_facts_ci WHERE recommendation_id=$1',[createdR.recommendationId]))[0].original_price_snapshot;
 assert.equal(original.kind,'price_consultation');
 assert.equal(original.customerDisplayCents,null);
 assert.equal((await customerProjectionCI(c,{customerId,vehicleId:vid,listingCycleId:cid,syntheticCustomerIdentity:identity})).priceStatus,'price_consultation');
 await c.query('UPDATE public.f05_4_current_price_ci SET customer_display_cents=5555000 WHERE vehicle_id=$1 AND listing_cycle_id=$2',[vid,cid]);
 let display=await customerProjectionCI(c,{customerId,vehicleId:vid,listingCycleId:cid,syntheticCustomerIdentity:identity});
 assert.equal(Number(display.customerDisplayCents),5555000);
 await c.query('UPDATE public.f05_4_current_price_ci SET customer_display_cents=6789000 WHERE vehicle_id=$1 AND listing_cycle_id=$2',[vid,cid]);
 display=await customerProjectionCI(c,{customerId,vehicleId:vid,listingCycleId:cid,syntheticCustomerIdentity:identity});
 assert.equal(Number(display.customerDisplayCents),6789000);
 assert.deepEqual((await q('SELECT original_price_snapshot FROM public.f05_9_recommendation_facts_ci WHERE recommendation_id=$1',[createdR.recommendationId]))[0].original_price_snapshot,original);
 assert.equal((await q('SELECT count(*)::int n FROM public.customer_price_unlock_events WHERE customer_id=$1',[customerId]))[0].n,0);
 // Signed F05-3C physical conversion changes source_type + availability but keeps same vehicle/cycle.
 const before=(await q('SELECT original_price_snapshot,original_source_kind FROM public.f05_9_recommendation_facts_ci WHERE recommendation_id=$1',[recId]))[0];
 await c.query("UPDATE public.vehicles SET source_type='mingbang',source_sale_status='available',platform_visibility='hidden' "+
  "WHERE vehicle_id=$1 AND source_type='wholesale' AND source_sale_status='active'",[v]);
 const base=(await q('SELECT source_type,source_sale_status FROM public.vehicles WHERE vehicle_id=$1',[v]))[0];
 assert.deepEqual(base,{source_type:'mingbang',source_sale_status:'available'});
 const rec=(await q('SELECT * FROM public.recommendations WHERE recommendation_id=$1',[recId]))[0];
 assert.equal(rec.status,'active');assert.equal(Number(rec.listing_cycle_id),cy);
 assert.deepEqual((await q('SELECT original_price_snapshot,original_source_kind FROM public.f05_9_recommendation_facts_ci WHERE recommendation_id=$1',[recId]))[0],before);
 assert.equal((await proj(customerId)).currentCycleFreeWholesaleRight,true);
 assert.equal((await q('SELECT count(*)::int n FROM public.f05_9_price_right_ci WHERE original_recommendation_id=$1',[recId]))[0].n,1);
 assert.equal((await q('SELECT count(*)::int n FROM public.customer_price_unlock_events WHERE customer_id=$1',[customerId]))[0].n,0);
 console.log('F05_9_R03_NATIVE_PG16_CONSULTATION_LATE_PRICE_IMMUTABLE_SNAPSHOT_WHOLESALE_TO_MINGBANG');
});

test('9-R04a real remote Manager/StoreHead, personal deny, 4S and stale owner authorization',async()=>{
 const cars=await aux(),remoteStore=8997983,remoteTeam=8997984,remoteEmployee=8997601,remoteCustomer=899618;
 const main=(await q('SELECT store_id,main_role_id FROM public.employees WHERE employee_id=1'))[0];
 const permission=(await q("SELECT permission_id FROM public.permissions WHERE permission_code='matching.rule.manage.ci.synthetic'"))[0].permission_id;
 const role=async name=>Number((await q('SELECT role_id FROM public.roles WHERE role_code=$1',[name]))[0].role_id);
 const clone=(obj,col,value)=>{const v={...obj,[col]:value};for(const k of Object.keys(v))if(typeof v[k]==='string'&&/name|code|title/i.test(k))v[k]+='-R04-'+value;return v};
 const insert=async(table,obj)=>{const keys=Object.keys(obj);await c.query('INSERT INTO public.'+table+'('+keys.map(k=>'"'+k+'"').join(',')+') VALUES('+keys.map((_,i)=>'$'+(i+1)).join(',')+')',Object.values(obj));};
 await insert('stores',clone((await q('SELECT * FROM public.stores WHERE store_id=$1',[main.store_id]))[0],'store_id',remoteStore));
 await insert('teams',{...clone((await q('SELECT * FROM public.teams WHERE team_id=901'))[0],'team_id',remoteTeam),store_id:remoteStore});
 await c.query("INSERT INTO public.employees(employee_id,store_id,employment_status,receiving_status,main_role_id) SELECT $1,$2,'active',receiving_status,main_role_id FROM public.employees WHERE employee_id=1",[remoteEmployee,remoteStore]);
 await c.query("INSERT INTO public.employee_team_memberships(team_id,employee_id,valid_from,changed_by_system_admin_id) SELECT $1,$2,now()-interval '1 day',changed_by_system_admin_id FROM public.employee_team_memberships WHERE employee_id=1 AND team_id=901 LIMIT 1",[remoteTeam,remoteEmployee]);
 await c.query('UPDATE public.customers SET current_owner_employee_id=$2 WHERE customer_id=$1',[remoteCustomer,remoteEmployee]);
 const arg=(car,label)=>({teamId:remoteTeam,customerId:remoteCustomer,vehicleId:car.vehicleId,listingCycleId:car.listingCycleId,eventKey:key(label)});
 await c.query('UPDATE public.employees SET main_role_id=$1 WHERE employee_id=1',[await role('manager')]);
 assert.equal((await createRecommendationCI(auth,token,arg(cars[0],'r04-manager-no-scope'))).allowed,false);
 await c.query("INSERT INTO public.employee_data_scopes(scope_id,employee_id,scope_kind,scope_reference_id) VALUES(299991,1,'team',$1)",[remoteTeam]);
 await c.query("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at) VALUES(1,$1,299991,now()-interval '1 day')",[permission]);
 assert.equal((await q('SELECT count(*)::int n FROM public.employee_team_memberships WHERE employee_id=1 AND team_id=$1',[remoteTeam]))[0].n,0);
 const manager=await createRecommendationCI(auth,token,arg(cars[0],'r04-manager-with-remote-scope'));
 assert.equal(manager.allowed,true,JSON.stringify(manager));
 await c.query("UPDATE public.employee_permission_overrides SET decision='deny' WHERE employee_id=1 AND permission_id=$1",[permission]);
 assert.equal((await createRecommendationCI(auth,token,arg(cars[1],'r04-individual-deny'))).allowed,false);
 await c.query("UPDATE public.employee_permission_overrides SET decision='allow' WHERE employee_id=1 AND permission_id=$1",[permission]);
 await c.query("UPDATE public.employee_data_scopes SET scope_kind='store',scope_reference_id=$1 WHERE scope_id=299991",[remoteStore]);
 await c.query('UPDATE public.employees SET main_role_id=$1 WHERE employee_id=1',[await role('store_head')]);
 const head=await createRecommendationCI(auth,token,arg(cars[1],'r04-storehead-remote-store'));
 assert.equal(head.allowed,true,JSON.stringify(head));
 await c.query('UPDATE public.employees SET main_role_id=$1 WHERE employee_id=1',[await role('four_s')]);
 assert.equal((await createRecommendationCI(auth,token,arg(cars[2],'r04-four-s-hard-deny'))).allowed,false);
 await c.query('UPDATE public.employees SET main_role_id=$1 WHERE employee_id=1',[main.main_role_id]);
 assert.equal((await finishRecommendationCI(auth,token,{teamId:901,recommendationId:manager.recommendationId,kind:'end',eventKey:key('r04-historical-recommender-no-current-scope')})).allowed,false);
 assert.equal((await createRecommendationCI(auth,token,arg(cars[2],'r04-sales-other-store-deny'))).allowed,false);
 await c.query('UPDATE public.customers SET current_owner_employee_id=1 WHERE customer_id=$1',[remoteCustomer]);
 const ended=await finishRecommendationCI(auth,token,{teamId:901,recommendationId:manager.recommendationId,kind:'end',eventKey:key('r04-new-owner-can-end')});
 assert.equal(ended.allowed,true,JSON.stringify(ended));
 console.log('F05_9_R04_TRUE_TWO_STORES_MANAGER_STOREHEAD_PERSONAL_DENY_FOUR_S_AND_OWNER_HANDOVER');
});
test('9-R04 two new lawful Vehicles, real unavailable failure, Lock and Transaction stay independently occupied',async()=>{
 const cars=await aux(),[a,b,lockCar,txnCar]=cars;
 const before=(await q('SELECT count(*)::int n FROM public.f05_9_recommendation_facts_ci'))[0].n;
 const batch=await batchRecommendCI(auth,token,{customerId,vehicleCycles:[a,{vehicleId:999999999,listingCycleId:a.listingCycleId},b],eventPrefix:key('r04-three-independent')});
 assert.equal(batch.allowed,true);assert.equal(batch.entries.length,3);
 assert.equal(batch.entries[0].created,true,JSON.stringify(batch.entries));
 assert.equal(batch.entries[1].allowed,false);
 assert.equal(batch.entries[2].created,true,JSON.stringify(batch.entries));
 assert.notEqual(batch.entries[0].recommendationId,batch.entries[2].recommendationId);
 assert.equal((await q('SELECT count(*)::int n FROM public.f05_9_recommendation_facts_ci'))[0].n,before+2);
 for(const each of [a,b]){
  assert.equal((await q("SELECT count(*)::int n FROM public.f05_9_price_right_ci WHERE customer_id=$1 AND vehicle_id=$2 AND listing_cycle_id=$3",[customerId,each.vehicleId,each.listingCycleId]))[0].n,1);
  await c.query("UPDATE public.vehicles SET platform_visibility='hidden' WHERE vehicle_id=$1",[each.vehicleId]);
  assert.equal((await q("SELECT count(*)::int n FROM public.vehicle_visibility_grants WHERE vehicle_id=$1 AND customer_id=$2 AND revoked_at IS NULL",[each.vehicleId,customerId]))[0].n,1);
 }
 await c.query("INSERT INTO public.locks(lock_id,customer_id,vehicle_id,listing_cycle_id,lock_status,responsible_employee_id,created_at,expires_at) "+
  "VALUES(8997951,899613,$1,$2,'active',1,now()-interval '1 minute',now()+interval '2 hours')",[lockCar.vehicleId,lockCar.listingCycleId]);
 const onLock=await createRecommendationCI(auth,token,{customerId,vehicleId:lockCar.vehicleId,listingCycleId:lockCar.listingCycleId,eventKey:key('r04-active-lock-can-recommend')});
 assert.equal(onLock.allowed,true,JSON.stringify(onLock));
 assert.equal((await q('SELECT lock_status FROM public.locks WHERE lock_id=8997951'))[0].lock_status,'active');
 await c.query("INSERT INTO public.locks(lock_id,customer_id,vehicle_id,listing_cycle_id,lock_status,responsible_employee_id,created_at,expires_at) "+
  "VALUES(8997952,899613,$1,$2,'cancelled',1,now()-interval '1 minute',now()+interval '2 hours')",[txnCar.vehicleId,txnCar.listingCycleId]);
 await c.query("INSERT INTO public.transactions(transaction_id,source_lock_id,customer_id,vehicle_id,listing_cycle_id,status,responsible_employee_id) "+
  "VALUES(8997952,8997952,899613,$1,$2,'in_progress',1)",[txnCar.vehicleId,txnCar.listingCycleId]);
 const whileTxn=await createRecommendationCI(auth,token,{customerId:899613,vehicleId:txnCar.vehicleId,listingCycleId:txnCar.listingCycleId,eventKey:key('r04-in-progress-can-recommend')});
 assert.equal(whileTxn.allowed,true,JSON.stringify(whileTxn));
 assert.equal((await q('SELECT status FROM public.transactions WHERE transaction_id=8997952'))[0].status,'in_progress');
 await c.query("UPDATE public.vehicles SET source_sale_status='offline' WHERE vehicle_id=$1",[a.vehicleId]);
 const sold=await createRecommendationCI(auth,token,{customerId:899618,vehicleId:a.vehicleId,listingCycleId:a.listingCycleId,eventKey:key('r04-sold-deny')});
 assert.equal(sold.allowed,false);assert.equal(sold.code,'F05_9_NOT_CURRENT_SALEABLE_CYCLE');
 const noInherited=await customerProjectionCI(c,{customerId:899618,vehicleId:b.vehicleId,listingCycleId:b.listingCycleId,entry:'ordinary_share',syntheticCustomerIdentity:identity});
 assert.equal(noInherited.visible,false,'other Customer cannot inherit hidden Vehicle rights via ordinary Share');
 assert.equal(noInherited.currentCycleFreeWholesaleRight,false);
 assert.equal((await q("SELECT count(*)::int n FROM public.f05_9_price_right_ci WHERE customer_id=899618 AND vehicle_id=$1",[b.vehicleId]))[0].n,0);
 console.log('F05_9_R04_REAL_TWO_NEW_VEHICLES_PARTIAL_BATCH_LOCK_TRANSACTION_SOLD_HARD_DENY');
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
+(i+1)).join(',')+')',Object.values(values));
 };
 const st=(await q('SELECT * FROM public.stores WHERE store_id=$1',[mainStore.store_id]))[0];
 const tt=(await q('SELECT * FROM public.teams WHERE team_id=901'))[0];
 await insertClone('stores',clone(st,'store_id',remoteStore));
 await insertClone('teams',{...clone(tt,'team_id',remoteTeam),store_id:remoteStore});
 await c.query("INSERT INTO public.employees(employee_id,store_id,employment_status,receiving_status,main_role_id) "+
  "SELECT $1,$2,'active',receiving_status,main_role_id FROM public.employees WHERE employee_id=1",[remoteEmployee,remoteStore]);
 await c.query("INSERT INTO public.employee_team_memberships(team_id,employee_id,valid_from,changed_by_system_admin_id) "+
  "SELECT $1,$2,now()-interval '1 day',changed_by_system_admin_id FROM public.employee_team_memberships "+
  "WHERE employee_id=1 AND team_id=901 LIMIT 1",[remoteTeam,remoteEmployee]);
 await c.query("UPDATE public.customers SET current_owner_employee_id=$2 WHERE customer_id=$1",[remoteCustomer,remoteEmployee]);
 // Historic recommender with old owner assignment cannot void another person's current business.
 await c.query("UPDATE public.customers SET current_owner_employee_id=$2 WHERE customer_id=$1",[customerId,remoteEmployee]);
 const oldEvents=(await q("SELECT count(*)::int n FROM public.f05_9_recommendation_events_ci WHERE recommendation_id=$1",[recId]))[0].n;
 const oldActor=await finishRecommendationCI(auth,token,{recommendationId:recId,teamId:901,kind:'void',
  reason:'should not be allowed once responsible changes',eventKey:key('r04-old-sales-denied')});
 assert.equal(oldActor.allowed,false,JSON.stringify(oldActor));
 assert.equal((await q('SELECT count(*)::int n FROM public.f05_9_recommendation_events_ci WHERE recommendation_id=$1',[recId]))[0].n,oldEvents);
 await c.query("UPDATE public.customers SET current_owner_employee_id=$2 WHERE customer_id=$1",[customerId,originalOwner]);
 await c.query('UPDATE public.employees SET main_role_id=$1 WHERE employee_id=1',[roleManager.role_id]);
 const remoteArg=(obj,label)=>({teamId:remoteTeam,customerId:remoteCustomer,vehicleId:obj.vehicleId,
  listingCycleId:obj.listingCycleId,eventKey:key(label)});
 const absent=await createRecommendationCI(auth,token,remoteArg(cars[0],'r04-remote-manager-no-scope'));
 assert.equal(absent.allowed,false,'manager role without object Store/Team scope is forbidden');
 await c.query("INSERT INTO public.employee_data_scopes(scope_id,employee_id,scope_kind,scope_reference_id) VALUES($1,1,'team',$2)",[scopeId,remoteTeam]);
 await c.query("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at) "+
  "VALUES(1,$1,$2,now()-interval '1 day')",[pr.permission_id,scopeId]);
 assert.equal((await q("SELECT count(*)::int n FROM public.employee_team_memberships WHERE employee_id=1 AND team_id=$1",[remoteTeam]))[0].n,0);
 const m=await createRecommendationCI(auth,token,remoteArg(cars[0],'r04-remote-manager-authorized'));
 assert.equal(m.allowed,true,JSON.stringify(m));assert.equal(m.created,true);
 const e=(await q("SELECT count(*)::int n FROM public.f05_9_recommendation_events_ci WHERE actor_employee_id=1"))[0].n;
 await c.query("UPDATE public.employee_permission_overrides SET decision='deny' WHERE employee_id=1 AND permission_id=$1",[pr.permission_id]);
 const denied=await createRecommendationCI(auth,token,remoteArg(cars[1],'r04-remote-manager-personal-deny'));
 assert.equal(denied.allowed,false);
 assert.equal((await q("SELECT count(*)::int n FROM public.f05_9_recommendation_events_ci WHERE actor_employee_id=1"))[0].n,e);
 await c.query("UPDATE public.employee_permission_overrides SET decision='allow' WHERE employee_id=1 AND permission_id=$1",[pr.permission_id]);
 // Real PG writer revokes current remote team scope; actor reader must wait and then deny.
 const writer=await connect();let pending;
 try{
  await writer.query('BEGIN');
  const pid=Number((await writer.query('SELECT pg_backend_pid() pid')).rows[0].pid);
  await writer.query("UPDATE public.employee_data_scopes SET ended_at=now() WHERE scope_id=$1",[scopeId]);
  let settled=false;
  pending=createRecommendationCI(auth,token,remoteArg(cars[1],'r04-two-pg-scope-revoked'));
  pending.then(()=>settled=true,()=>settled=true);
  await new Promise(resolve=>setTimeout(resolve,120));
  assert.equal(settled,false,'signed Capability+DataScope SHARE must serialize real COMMIT of scope revocation');
  await writer.query('COMMIT');
  const result=await pending;
  assert.equal(result.allowed,false,JSON.stringify(result));
  console.log('F05_9_R04_REAL_TWO_PG_OBJECT_SCOPE_REVOKED',JSON.stringify({pid,scopeId}));
 }finally{await writer.query('ROLLBACK').catch(()=>{});await writer.end();if(pending)await pending.catch(()=>{})}
 await c.query("UPDATE public.employee_data_scopes SET ended_at=NULL,scope_kind='store',scope_reference_id=$2 WHERE scope_id=$1",[scopeId,remoteStore]);
 await c.query('UPDATE public.employees SET main_role_id=$1 WHERE employee_id=1',[roleHead.role_id]);
 const h=await createRecommendationCI(auth,token,remoteArg(cars[1],'r04-remote-storehead-authorized'));
 assert.equal(h.allowed,true,JSON.stringify(h));assert.equal(h.created,true);
 await c.query('UPDATE public.employees SET main_role_id=$1 WHERE employee_id=1',[role4s.role_id]);
 const no4s=await createRecommendationCI(auth,token,remoteArg(cars[2],'r04-four-s-hard-deny'));
 assert.equal(no4s.allowed,false,'4S membership must never access Mingbang Recommendations');
 await c.query('UPDATE public.employees SET main_role_id=$1 WHERE employee_id=1',[mainStore.main_role_id]);
 const sales=await createRecommendationCI(auth,token,remoteArg(cars[2],'r04-nonowner-sales-deny'));
 assert.equal(sales.allowed,false);
 // Two backend owner move with active head session; unlike pre-request validity,
 // COMMIT must invalidate original remote Store object and never create a Recommendation.
 await c.query('UPDATE public.employees SET main_role_id=$1 WHERE employee_id=1',[roleHead.role_id]);
 const moving=await connect();let competing;
 try{
  await moving.query('BEGIN');
  const pid=Number((await moving.query('SELECT pg_backend_pid() pid')).rows[0].pid);
  await moving.query('UPDATE public.customers SET current_owner_employee_id=1 WHERE customer_id=$1',[remoteCustomer]);
  let settled=false;
  competing=createRecommendationCI(auth,token,remoteArg(cars[2],'r04-owner-commits-before-create'));
  competing.then(()=>settled=true,()=>settled=true);
  await new Promise(resolve=>setTimeout(resolve,120));
  assert.equal(settled,false,'Customer row must wait for real owner handoff COMMIT');
  await moving.query('COMMIT');
  const result=await competing;
  assert.equal(result.allowed,false,JSON.stringify(result));
  assert.equal((await q("SELECT count(*)::int n FROM public.f05_9_recommendation_facts_ci WHERE customer_id=$1 AND vehicle_id=$2",[remoteCustomer,cars[2].vehicleId]))[0].n,0);
  console.log('F05_9_R04_REAL_TWO_PG_OWNER_HANDOVER_FAIL_CLOSED',JSON.stringify({pid,remoteCustomer}));
 }finally{await moving.query('ROLLBACK').catch(()=>{});await moving.end();if(competing)await competing.catch(()=>{})}
 await c.query('UPDATE public.employees SET main_role_id=$1 WHERE employee_id=1',[mainStore.main_role_id]);
 const ended=await finishRecommendationCI(auth,token,{teamId:901,recommendationId:m.recommendationId,kind:'end',
  eventKey:key('r04-new-responsible-ends-historic')});
 assert.equal(ended.allowed,true,JSON.stringify(ended));
 assert.equal((await q('SELECT status FROM public.recommendations WHERE recommendation_id=$1',[m.recommendationId]))[0].status,'ended');
 console.log('F05_9_R04_REMOTE_MANAGER_STOREHEAD_4S_DENY_CURRENT_OWNER_REVOKE_HISTORIC_END_PASS');
});
