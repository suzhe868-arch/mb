import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes,createHash} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect,verify,ID} from '../migration.mjs';
import {resolveRules,tierFor,eligibleVehicle,failClosed,forbidden,normalizeFacts} from '../contract.mjs';
import {saveSalesDescriptionCI as save,calculateCI as match,retryAffectedCI} from '../service.mjs';
const db=await connect(),secret=randomBytes(32),auth=new IsolatedAuth({
 connectionString:process.env.F03_1_DATABASE_URL,secret,origin:'https://127.0.0.1:48988'
});
let token,demand,secondDemand,vehicles=[],originalDownstream={},races=[];
const q=(sql,args=[])=>db.query(sql,args).then(r=>r.rows);
const key=s=>'f05-7-ci-match-'+s+'-signed';
const desc='奥迪A6 2026款 5万公里以内 黑色外观 米色内饰 预算10万';
const sales=(id,description=desc)=>save(auth,token,{demandId:id,teamId:901,description});
const calc=(id,v,s,opts={})=>match(auth,token,{demandId:id,vehicleId:v.vehicleId,listingCycleId:v.cycle,teamId:901,runKey:key(s)},opts);
const history=(id,v)=>q('SELECT result_id,tier,status,reason,source_signature,run_key,explanations FROM public.f05_7_result_versions_ci WHERE demand_id=$1 AND vehicle_id=$2 AND listing_cycle_id=$3 ORDER BY result_id',[id,v.vehicleId,v.cycle]);
const baselineTables=['recommendations','priority_leases','locks','transactions','customer_price_unlock_events','f05_6_activation_events_ci'];
test.before(async()=>{
 assert.equal((await verify(db)).verified,true);
 const s=await auth.login({login:'employee_test',password:'SyntheticF04_3_CurrentProof_2026',source:'f05-7-genuine-F03'});
 assert.equal(s.code,'AUTH_OK');token=s.token;
 demand=Number((await q("SELECT demand_id FROM public.demands WHERE customer_id=899612 AND demand_state='active'"))[0].demand_id);
 secondDemand=Number((await q("SELECT demand_id FROM public.demands WHERE customer_id=899613 AND demand_state='active'"))[0].demand_id);
 const raw=await q('SELECT vehicle_id,listing_cycle_id FROM public.f05_7_vehicle_facts_ci ORDER BY vehicle_id LIMIT 5');
 vehicles=raw.map(x=>({vehicleId:Number(x.vehicle_id),cycle:Number(x.listing_cycle_id)}));assert.ok(vehicles.length>=3);
 for(const table of baselineTables){
  try{originalDownstream[table]=Number((await q('SELECT count(*)::int n FROM public.'+table))[0].n)}
  catch(e){if(e.code!=='42P01')throw e;originalDownstream[table]='TABLE_NOT_PRESENT'}
 }
});
test.after(async()=>{await auth.close();await db.end();secret.fill(0)});
test('7-A01 real signed M94-v23 full 21 migration ledger and schema seal',async()=>{
 const x=await verify(db);assert.equal(x.verified,true);assert.equal(x.id,ID);
 assert.equal((await q('SELECT count(*)::int n FROM public.f03_schema_migrations'))[0].n,21);
});
test('7-A02 pending Application must not be formal Demand; active Demand without sales readiness cannot Match',async()=>{
 assert.equal((await q("SELECT count(*)::int n FROM public.find_car_applications WHERE customer_id=899611 AND status='pending'"))[0].n,1);
 assert.equal((await q('SELECT count(*)::int n FROM public.demands WHERE customer_id=899611'))[0].n,0);
 assert.equal((await calc(demand,vehicles[0],'not-ready')).code,'F05_7_DEMAND_NOT_MATCHING_READY');
});
test('7-A03 empty description and no legal executable rule are not matching-ready',async()=>{
 assert.equal((await sales(demand,'')).allowed,false);
 assert.equal((await sales(demand,'仅客户口述无词典命中的要求')).code,'F05_7_NOT_MATCHING_READY');
});
test('7-A04 only real F03 session+independent current permission and saved sales description prepares matching',async()=>{
 assert.equal((await save(null,null,{demandId:demand,teamId:901,description:desc})).allowed,false);
 const a=await sales(demand);assert.equal(a.code,'F05_7_MATCHING_READY_CI',JSON.stringify(a));
 assert.ok(a.conditions>=5);
});
test('7-A05 all hard and preferred conditions pass with exact budget yields high',async()=>{
 const x=await calc(demand,vehicles[0],'all-high');assert.equal(x.tier,'high',JSON.stringify(x));
 const rows=await history(demand,vehicles[0]);assert.equal(rows.length,1);assert.equal(rows[0].status,'current');
});
test('7-A06 same facts and event key cannot duplicate current Result or immutable history',async()=>{
 const a=await calc(demand,vehicles[0],'all-high');
 assert.ok(['F05_7_IDENTICAL_MATCH_ALREADY_RECORDED','F05_7_CURRENT_SAME_FACTS'].includes(a.code));
 assert.equal((await history(demand,vehicles[0])).length,1);
});
test('7-A07 legal 105-percent price tolerance and exact boundary produce acceptable',async()=>{
 await db.query("UPDATE public.f05_7_vehicle_facts_ci SET facts_json=jsonb_set(facts_json,'{budget_cents,value}','10500000'::jsonb),fact_version=fact_version+1 WHERE vehicle_id=$1 AND listing_cycle_id=$2",
  [vehicles[0].vehicleId,vehicles[0].cycle]);
 const x=await calc(demand,vehicles[0],'price-105');assert.equal(x.tier,'acceptable');
 assert.deepEqual((await history(demand,vehicles[0])).map(r=>r.status),['stale','current']);
});
test('7-A08 105-percent plus one cent is strictly no_match, without floating rounding',async()=>{
 await db.query("UPDATE public.f05_7_vehicle_facts_ci SET facts_json=jsonb_set(facts_json,'{budget_cents,value}','10500001'::jsonb),fact_version=fact_version+1 WHERE vehicle_id=$1 AND listing_cycle_id=$2",[vehicles[0].vehicleId,vehicles[0].cycle]);
 assert.equal((await calc(demand,vehicles[0],'price-105plus1')).tier,'no_match');
});
test('7-A09 budget specified with no signed customer display number becomes local confirmation_needed',async()=>{
 await db.query("UPDATE public.f05_7_vehicle_facts_ci SET facts_json=facts_json-'budget_cents',fact_version=fact_version+1 WHERE vehicle_id=$1 AND listing_cycle_id=$2",[vehicles[0].vehicleId,vehicles[0].cycle]);
 assert.equal((await calc(demand,vehicles[0],'price-issuer-gap')).tier,'confirmation_needed');
});
test('7-A10 no budget rule means no price unknown: hard conditions can still be high',async()=>{
 const parsed=resolveRules('奥迪A6 2026款 黑色外观',[
 {rule_id:1,phrase:'奥迪A6',scope_kind:'global',condition:{field:'model_year',mode:'hard',op:'min',value:2025}},
 {rule_id:2,phrase:'黑色外观',scope_kind:'global',condition:{field:'exterior_color',mode:'hard',op:'eq',value:'black'}}
 ]);
 assert.equal(parsed.ready,true);
 assert.equal(tierFor(parsed.conditions,{model_year:{value:2026,source:'JYT'},exterior_color:{value:'black',source:'CI'}}).tier,'high');
});
test('7-A11 interior color preferred mismatch can downgrade high to acceptable but never no_match',async()=>{
 const facts={model_year:{value:2026},interior_color:{value:'black'}};
 const conditions=[{field:'model_year',op:'min',mode:'hard',value:2025},{field:'interior_color',op:'eq',mode:'preferred',value:'beige'}];
 assert.equal(tierFor(conditions,facts).tier,'acceptable');
});
test('7-A12 hard explicit mismatch wins over hard unknown; unknown hard stays local',async()=>{
 const conditions=[{field:'model_year',op:'min',mode:'hard',value:2025},{field:'mileage_km',op:'max',mode:'hard',value:50000}];
 assert.equal(tierFor(conditions,{model_year:{value:2024}}).tier,'no_match');
 assert.equal(tierFor(conditions,{model_year:{value:2026}}).tier,'confirmation_needed');
});
test('7-A13 dictionary scopes override, same-rank conflicting rules are not randomly resolved',async()=>{
 const r=[
 {rule_id:1,phrase:'奥迪A6',scope_kind:'global',condition:{field:'model_year',mode:'hard',op:'min',value:2020}},
 {rule_id:2,phrase:'奥迪A6',scope_kind:'model_year',scope_key:'97003:2026',condition:{field:'model_year',mode:'hard',op:'min',value:2025}},
 {rule_id:3,phrase:'黑色外观',scope_kind:'global',condition:{field:'exterior_color',mode:'hard',op:'eq',value:'black'}},
 {rule_id:4,phrase:'黑色外观',scope_kind:'global',condition:{field:'exterior_color',mode:'hard',op:'eq',value:'white'}}
 ];
 const a=resolveRules('奥迪A6 黑色外观',r,{model_year:'97003:2026'});
 assert.equal(a.conditions.find(c=>c.field==='model_year').value,2025);
 assert.deepEqual(a.conflicts,['exterior_color']);
 assert.equal(a.conditions.find(c=>c.field==='exterior_color')?.conflict,true);
 assert.equal(tierFor(a.conditions,{model_year:{value:2026},exterior_color:{value:'black'}}).tier,'confirmation_needed');
});
test('7-A14 OR within field/AND across fields, reverse exclusion, missing field unrestricted',async()=>{
 const c=[
 {field:'exterior_color',mode:'hard',op:'in',values:['black','white']},
 {field:'mileage_km',mode:'hard',op:'max',value:50000},
 {field:'power_type',mode:'hard',op:'exclude',values:['diesel']}
 ];
 assert.equal(tierFor(c,{exterior_color:{value:'white'},mileage_km:{value:12000},power_type:{value:'petrol'}}).tier,'high');
 assert.equal(tierFor(c,{exterior_color:{value:'red'},mileage_km:{value:12000},power_type:{value:'petrol'}}).tier,'no_match');
 assert.equal(tierFor(c.slice(0,1),{exterior_color:{value:'black'}}).tier,'high');
});
test('7-A15 mileage maximum only; distinct registration year and six explicitly excluded fields',async()=>{
 const c=[{field:'mileage_km',mode:'hard',op:'max',value:50000}];
 assert.equal(tierFor(c,{mileage_km:{value:500}}).tier,'high');
 assert.equal(forbidden.has('registration_year'),true);
 for(const k of ['transmission','configuration','transfer_count','city_distance','emission','source_type'])assert.ok(forbidden.has(k));
});
test('7-A16 active Lock and platform hidden alone never prohibit internal eligible Match',async()=>{
 const x=await q('SELECT source_sale_status,archived_at,platform_visibility FROM public.vehicles WHERE vehicle_id=$1',[vehicles[1].vehicleId]);
 assert.equal(eligibleVehicle({...x[0],ended_at:null,available:true}),true);
 assert.equal(eligibleVehicle({...x[0],ended_at:null,available:true,platform_visibility:'hidden'}),true);
});
test('7-A17 no inherited active Customer price/free quota or Recommendation/Priority/Lock side effects',async()=>{
 for(const table of baselineTables){
  let n;try{n=Number((await q('SELECT count(*)::int n FROM public.'+table))[0].n)}
  catch(e){if(e.code!=='42P01')throw e;n='TABLE_NOT_PRESENT'}
  assert.deepEqual(n,originalDownstream[table],'F05-7 matching must not mutate unrelated '+table);
 }
 assert.equal(failClosed().allowed,false);
});
test('7-A18 individual Employee permission deny blocks legal F03 session without new Result',async()=>{
 await db.query("UPDATE public.employee_permission_overrides SET decision='deny' WHERE employee_id=1 AND permission_id=1097");
 const x=await calc(demand,vehicles[1],'permission-denied');assert.equal(x.allowed,false);
 await db.query("UPDATE public.employee_permission_overrides SET decision='allow' WHERE employee_id=1 AND permission_id=1097");
});
async function contention({customerId,demandId,vehicle,sql,args,restore,label}){
 const c2=await connect();
 let release,arrived;
 const waiting=new Promise(resolve=>{arrived=resolve});
 const pause=new Promise(resolve=>{release=resolve});
 const original=await calc(demandId,vehicle,label+'-initial');
 if(!original.allowed)throw Error(label+'_INITIAL_'+original.code);
 const race=calc(demandId,vehicle,label+'-race',{
  checkpoint:async(stage,conn)=>{
   const p1=Number((await conn.query('SELECT pg_backend_pid() pid')).rows[0].pid);
   arrived(p1);await pause;
  }
 });
 let p2,p1,lockState=null;
 try{
  p1=await waiting;
  await c2.query('BEGIN');
  p2=Number((await c2.query('SELECT pg_backend_pid() pid')).rows[0].pid);
  await c2.query("SET LOCAL lock_timeout='250ms'");
  try{await c2.query(sql,args);throw Error(label+'_EXPECTED_PG_LOCK')}
  catch(e){if(e.code!=='55P03')throw e;lockState=e.code;await c2.query('ROLLBACK')}
  release();
  const finished=await race;
  assert.ok(finished.allowed,JSON.stringify(finished));
  await c2.query('BEGIN');await c2.query(sql,args);await c2.query('COMMIT');
  const denied=await calc(demandId,vehicle,label+'-after-change');
  assert.equal(denied.allowed,false,JSON.stringify(denied));
  assert.equal((await history(demandId,vehicle)).filter(x=>x.status==='current').length,0);
  await c2.query('BEGIN');await c2.query(restore.sql,restore.args);await c2.query('COMMIT');
  assert.notEqual(p1,p2);races.push({label,businessPid:p1,writerPid:p2,sqlstate:lockState,after:denied.code});
  console.log('F05_7_REAL_DUAL_BACKEND_55P03',JSON.stringify(races.at(-1)));
 }finally{release?.();await c2.query('ROLLBACK').catch(()=>{});await c2.end();await race.catch(()=>{})}
}
test('7-A19 real two-PG-backend Customer inactive vs matching transaction, 55P03 and result stale',async()=>{
 await sales(secondDemand);
 await contention({label:'CUSTOMER_INACTIVE',customerId:899613,demandId:secondDemand,vehicle:vehicles[1],
  sql:"UPDATE public.customers SET account_status='inactive' WHERE customer_id=899613",args:[],
  restore:{sql:"UPDATE public.customers SET account_status='active' WHERE customer_id=899613",args:[]}});
});
test('7-A20 true independent PG backend Vehicle offline competes with matching and invalidates current',async()=>{
 await contention({label:'VEHICLE_OFFLINE',demandId:secondDemand,vehicle:vehicles[2],
  sql:"UPDATE public.vehicles SET source_sale_status='offline' WHERE vehicle_id=$1",args:[vehicles[2].vehicleId],
  restore:{sql:"UPDATE public.vehicles SET source_sale_status='active' WHERE vehicle_id=$1",args:[vehicles[2].vehicleId]}});
});
test('7-A21 customer-level find right revoked prevents new matching; previous result stale',async()=>{
 const x=await calc(secondDemand,vehicles[1],'level-before-revoke');assert.equal(x.allowed,true);
 await db.query('UPDATE public.f05_6_level_find_policy_ci SET find_enabled=false WHERE level_id=2');
 assert.equal((await calc(secondDemand,vehicles[1],'level-after-revoke')).allowed,false);
 assert.equal((await history(secondDemand,vehicles[1])).filter(x=>x.status==='current').length,0);
 await db.query('UPDATE public.f05_6_level_find_policy_ci SET find_enabled=true WHERE level_id=2');
});
test('7-A22 rule version mutation invalidates every current result without granting downstream rights',async()=>{
 const original=await calc(demand,vehicles[1],'rule-before-change');assert.equal(original.allowed,true);
 const id=(await q("SELECT rule_id FROM public.f05_7_rule_dictionary_ci WHERE phrase='奥迪A6' LIMIT 1"))[0].rule_id;
 await db.query('UPDATE public.f05_7_rule_dictionary_ci SET rule_version=rule_version+1 WHERE rule_id=$1',[id]);
 assert.equal((await history(demand,vehicles[1])).filter(x=>x.status==='current').length,0);
 assert.equal((await calc(demand,vehicles[1],'rule-after-change')).code,'F05_7_RULES_CHANGED_REPARSE_REQUIRED');
});
test('7-A23 database append-only match history blocks fabricated upgrades or erased proof',async()=>{
 const row=(await history(demand,vehicles[0]))[0];
 await assert.rejects(()=>db.query("UPDATE public.f05_7_result_versions_ci SET tier='high' WHERE result_id=$1",[row.result_id]),/F05_7_SIGNED_MATCH_HISTORY_IMMUTABLE/);
 await assert.rejects(()=>db.query('DELETE FROM public.f05_7_result_versions_ci WHERE result_id=$1',[row.result_id]),/F05_7_SIGNED_MATCH_HISTORY_IMMUTABLE/);
});
test('7-A24 native real PG explanation / immutable hashes / scoped source gaps captured',async()=>{
 const dir=new URL('../artifacts/source/',import.meta.url);await mkdir(dir,{recursive:true});
 await writeFile(new URL('genuine-pg-backend-contention.json',dir),JSON.stringify(races,null,2)+'\n');
 const rows=await q('SELECT demand_id,vehicle_id,listing_cycle_id,tier,status,source_signature,explanations FROM public.f05_7_result_versions_ci ORDER BY result_id');
 await writeFile(new URL('genuine-source-tier-explanations.json',dir),JSON.stringify({rows,sha256:createHash('sha256').update(JSON.stringify(rows)).digest('hex'),ciSyntheticOnly:true},null,2)+'\n');
 assert.equal(races.length,2);
});

test('7-A25 R01 preferred fact missing is acceptable, not high or hard confirmation; true PG input and reason',async()=>{
 const d=Number((await q("SELECT demand_id FROM public.demands WHERE customer_id=899618 AND demand_state='active'"))[0].demand_id);
 assert.equal((await sales(d)).allowed,true);
 const v=vehicles[3];
 await db.query("UPDATE public.f05_7_vehicle_facts_ci SET facts_json=facts_json-'interior_color',fact_version=fact_version+1 WHERE vehicle_id=$1 AND listing_cycle_id=$2",[v.vehicleId,v.cycle]);
 const result=await calc(d,v,'r01-preferred-null-from-real-pg');
 assert.equal(result.tier,'acceptable',JSON.stringify(result));
 const current=(await history(d,v)).at(-1);
 const pref=current.explanations.find(e=>e.field==='interior_color');
 assert.equal(pref.outcome,'unknown');assert.equal(pref.mode,'preferred');assert.equal(pref.factReason,'FACT_MISSING');
 assert.equal(tierFor([{field:'model_year',mode:'hard',op:'min',value:2025},
   {field:'interior_color',mode:'preferred',op:'eq',value:'beige'}],
   {model_year:{value:2024}}).tier,'no_match');
 assert.equal(tierFor([{field:'model_year',mode:'hard',op:'min',value:2025},
   {field:'interior_color',mode:'preferred',op:'eq',value:'beige'}],
   {model_year:{}}).tier,'confirmation_needed');
 console.log('F05_7_A_R01_PREFERRED_MISSING_REAL_PG',JSON.stringify({demandId:d,vehicleId:v.vehicleId,tier:result.tier,pref}));
});
test('7-A26 R02 actual active Lock still matches with occupied snapshot and unlock event stales old result',async()=>{
 const d=Number((await q("SELECT demand_id FROM public.demands WHERE customer_id=899619 AND demand_state='active'"))[0].demand_id);
 assert.equal((await sales(d)).allowed,true);
 const v=vehicles[2],before=Number((await q('SELECT count(*)::int n FROM public.locks'))[0].n);
 await db.query("INSERT INTO public.locks(lock_id,customer_id,vehicle_id,listing_cycle_id,lock_status,responsible_employee_id,created_at,expires_at) "+
  "VALUES(8997066,899619,$1,$2,'active',1,now()-interval '1 minute',now()+interval '2 hours')",[v.vehicleId,v.cycle]);
 const r=await calc(d,v,'r02-occupied-while-matching');
 assert.equal(r.allowed,true,JSON.stringify(r));assert.equal(r.occupancy.occupied,true);
 const row=(await history(d,v)).at(-1);
 const snap=row.explanations.find(e=>e.field==='active_lock_occupancy');
 assert.equal(snap.occupied,true);assert.ok(snap.activeLockCount>=1);
 assert.equal(Number((await q('SELECT count(*)::int n FROM public.locks'))[0].n),before+1,
  'Matching does not create a second lock');
 await db.query("UPDATE public.locks SET lock_status='cancelled' WHERE lock_id=8997066");
 assert.equal((await history(d,v)).filter(x=>x.status==='current').length,0,'physical lock change invalidates current result');
 const again=await calc(d,v,'r02-unoccupied-after-cancel');
 assert.equal(again.allowed,true);assert.equal(again.occupancy.occupied,false);
 const recovered=(await history(d,v)).at(-1).explanations.find(e=>e.field==='active_lock_occupancy');
 assert.equal(recovered.occupied,false);
 assert.equal(Number((await q('SELECT count(*)::int n FROM public.locks'))[0].n),before+1);
 console.log('F05_7_A_R02_ACTIVE_LOCK_REAL_PG_OCCUPANCY',JSON.stringify({before,after:before+1,occupied:r.occupancy,afterCancel:again.occupancy}));
});
test('7-A27 R03 original PG Rule mutation commits, 2 targets only failed 1 gets idempotent retry',async()=>{
 const d=Number((await q("SELECT demand_id FROM public.demands WHERE customer_id=899620 AND demand_state='active'"))[0].demand_id);
 assert.equal((await sales(d)).allowed,true);
 const [v1,v2]=vehicles.slice(0,2);
 assert.equal((await calc(d,v1,'r03-before-rule-mutate-first')).allowed,true);
 assert.equal((await calc(d,v2,'r03-before-rule-mutate-second')).allowed,true);
 const rule=(await q("SELECT rule_id FROM public.f05_7_rule_dictionary_ci WHERE phrase='奥迪A6' ORDER BY rule_id LIMIT 1"))[0];
 await db.query('UPDATE public.f05_7_rule_dictionary_ci SET rule_version=rule_version+1 WHERE rule_id=$1',[rule.rule_id]);
 const original=await q('SELECT vehicle_id,retry_state,attempt_count FROM public.f05_7_retry_scope_ci WHERE demand_id=$1 ORDER BY vehicle_id',[d]);
 assert.deepEqual(original.map(x=>x.retry_state),['pending','pending']);
 for(const v of [v1,v2])assert.equal((await history(d,v)).filter(x=>x.status==='current').length,0);
 assert.equal((await sales(d)).allowed,true,'reparse must sign new Rule version before re-evaluation');
 const retry1=await retryAffectedCI(auth,token,{demandId:d,teamId:901,batchKey:key('r03-try-one'),
  injectFailureVehicles:[v2.vehicleId]});
 assert.equal(retry1.allowed,true,JSON.stringify(retry1));assert.equal(retry1.successes,1);assert.equal(retry1.failures,1);
 const first=await q('SELECT vehicle_id,retry_state,error_reason,attempt_count FROM public.f05_7_retry_scope_ci WHERE demand_id=$1 ORDER BY vehicle_id',[d]);
 assert.deepEqual(first.map(x=>x.retry_state),['completed','failed']);
 assert.equal(first[1].error_reason,'F05_7_CI_SYNTHETIC_RECOMPUTE_FAILURE');
 assert.equal((await history(d,v2)).filter(x=>x.status==='current').length,0);
 const successCount=(await history(d,v1)).length;
 const retry2=await retryAffectedCI(auth,token,{demandId:d,teamId:901,batchKey:key('r03-try-two')});
 assert.equal(retry2.successes,1);assert.equal(retry2.failures,0);
 assert.equal(retry2.handled.length,1);assert.equal(retry2.handled[0].vehicleId,v2.vehicleId);
 const second=await q('SELECT vehicle_id,retry_state,attempt_count FROM public.f05_7_retry_scope_ci WHERE demand_id=$1 ORDER BY vehicle_id',[d]);
 assert.deepEqual(second.map(x=>x.retry_state),['completed','completed']);
 assert.deepEqual(second.map(x=>Number(x.attempt_count)),[1,2]);
 assert.equal((await history(d,v1)).length,successCount,'successful subset is not retried');
 const again=await retryAffectedCI(auth,token,{demandId:d,teamId:901,batchKey:key('r03-try-two')});
 assert.equal(again.handled.length,0,'idempotent retry never processes completed scope again');
 console.log('F05_7_A_R03_TRUE_PG16_PARTIAL_RETRY',JSON.stringify({demandId:d,first,second,completedUnaffected:true}));
});
test('7-A28 R04 series-year range and four provenances execute against real PG facts, local mapping gap cannot overwrite JYT',async()=>{
 const d=Number((await q("SELECT demand_id FROM public.demands WHERE customer_id=899618 AND demand_state='active'"))[0].demand_id);
 const scopeRules=[
  {phrase:'奥迪A6',scope_kind:'global',condition:{field:'model_year',mode:'hard',op:'min',value:2010}},
  {phrase:'奥迪A6',scope_kind:'series',scope_key:'97002',condition:{field:'model_year',mode:'hard',op:'min',value:2021}},
  {phrase:'奥迪A6',scope_kind:'series_year',scope_key:'97002:2024-2027',condition:{field:'model_year',mode:'hard',op:'min',value:2025}},
  {phrase:'奥迪A6',scope_kind:'model_year',scope_key:'97003:2026',condition:{field:'model_year',mode:'hard',op:'min',value:2026}}
 ];
 for(const r of scopeRules)await db.query(
  'INSERT INTO public.f05_7_rule_dictionary_ci(phrase,scope_kind,scope_key,condition_json) VALUES($1,$2,$3,$4::jsonb)',
  [r.phrase,r.scope_kind,r.scope_key??null,JSON.stringify(r.condition)]);
 const rows=(await q("SELECT rule_id,phrase,scope_kind,scope_key,condition_json AS condition FROM public.f05_7_rule_dictionary_ci WHERE phrase='奥迪A6' ORDER BY rule_id")).filter(Boolean);
 const ins=resolveRules('奥迪A6',rows,{series:'97002',model_year:'97003:2026',modelYear:2026});
 assert.equal(ins.conditions.find(x=>x.field==='model_year').value,2026);
 const inRange=resolveRules('奥迪A6',rows,{series:'97002',model_year:'unknown',modelYear:2025});
 assert.equal(inRange.conditions.find(x=>x.field==='model_year').value,2025);
 const outRange=resolveRules('奥迪A6',rows,{series:'97002',model_year:'unknown',modelYear:2028});
 assert.equal(outRange.conditions.find(x=>x.field==='model_year').value,2021);
 const v=vehicles[4];
 const facts={
  model_year:{candidates:[
   {value:2026,kind:'structured',source:'CI_ORIGINAL_JYT_STRUCTURED_MODEL_FACT'},
   {value:2021,kind:'inspection',source:'CI_INSPECTION'},
   {value:2020,kind:'description',source:'CI_DETAIL_DESCRIPTION'},
   {value:2019,kind:'vague',source:'CI_VAGUE_LABEL'}]},
  exterior_color:{value:'black',kind:'structured',source:'CI_STRUCTURED'},
  mileage_km:{value:42000,kind:'structured',source:'CI_STRUCTURED'},
  interior_color:{value:'beige',kind:'inspection',source:'CI_INSPECTION'},
  budget_cents:{value:10000000,kind:'structured',source:'CI_CUSTOMER_DISPLAY_PRICE_SYNTHETIC'}
 };
 const clean=normalizeFacts(facts);
 assert.equal(clean.model_year.value,2026);assert.equal(clean.model_year.provenance.length,4);
 await db.query("UPDATE public.f05_7_vehicle_facts_ci SET facts_json=$1::jsonb,fact_version=fact_version+1 WHERE vehicle_id=$2 AND listing_cycle_id=$3",
  [JSON.stringify(facts),v.vehicleId,v.cycle]);
 assert.equal((await sales(d)).allowed,true);
 const r=await calc(d,v,'r04-provenance-original-jyt-vs-mapping');
 assert.equal(r.allowed,true,JSON.stringify(r));assert.equal(r.tier,'high');
 const row=(await history(d,v)).at(-1),actual=row.explanations.find(x=>x.field==='model_year');
 assert.equal(actual.factSource,'CI_ORIGINAL_JYT_STRUCTURED_MODEL_FACT');
 assert.equal(actual.provenance.length,4);
 facts.model_year.candidates.push({value:2024,kind:'structured',source:'CI_STRUCTURED_CONFLICT'});
 await db.query("UPDATE public.f05_7_vehicle_facts_ci SET facts_json=$1::jsonb,fact_version=fact_version+1 WHERE vehicle_id=$2 AND listing_cycle_id=$3",
  [JSON.stringify(facts),v.vehicleId,v.cycle]);
 const conflict=await calc(d,v,'r04-same-rank-model-conflict');
 assert.equal(conflict.tier,'confirmation_needed');
 assert.equal((await history(d,v)).at(-1).explanations.find(x=>x.field==='model_year').factReason,'SAME_PRIORITY_CONFLICT');
 console.log('F05_7_A_R04_REAL_PG16_PRIORITY_AND_RANGE',JSON.stringify({source:actual.factSource,originalSources:actual.provenance.map(x=>x.source),
  inRange:inRange.conditions[0]?.value,outRange:outRange.conditions[0]?.value,hardConflict:conflict.tier}));
});
