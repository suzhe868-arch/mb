import {test} from 'node:test';
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash,randomBytes} from 'node:crypto';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect,verify as verifyV19} from '../../favorite-physical-carrier/migration.mjs';
import {verify as verifyV18} from '../../wholesale-to-mingbang-conversion/migration.mjs';
import {syntheticFavoriteChange} from '../../favorite-physical-carrier/service.mjs';
import {convertWholesaleToMingbang,SOURCE_GAP} from '../../wholesale-to-mingbang-conversion/service.mjs';

const db=await connect(),secret=randomBytes(32);
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin:'https://127.0.0.1:48983'});
const event=k=>'f05-3i-v19-favorite-preconversion-'+k;
const customer=899951,unscopedCustomer=899952;
let employee,admin,four,vehicle,cycle,unscopedVehicle,unscopedCycle,prior,preConversion;
const digest=val=>createHash('sha256').update(JSON.stringify(val)).digest('hex');
async function snapshot(v,cy){
 const tables={
 favorites:'SELECT row_to_json(x) v FROM public.f05_3g_customer_favorites x WHERE vehicle_id=$1 ORDER BY favorite_id',
 favoriteEvents:'SELECT row_to_json(x) v FROM public.f05_3g_favorite_events x WHERE vehicle_id=$1 ORDER BY event_id',
 customers:'SELECT row_to_json(x) v FROM public.customers x WHERE customer_id IN ($3,$4) ORDER BY customer_id',
 lock:'SELECT row_to_json(x) v FROM public.locks x WHERE vehicle_id=$1 ORDER BY lock_id',
 recommendations:'SELECT row_to_json(x) v FROM public.recommendations x WHERE vehicle_id=$1 AND listing_cycle_id=$2 ORDER BY recommendation_id',
 quota:'SELECT row_to_json(x) v FROM public.customer_price_cycle_unlocks x WHERE vehicle_id=$1 AND listing_cycle_id=$2 ORDER BY unlock_id',
 unlockEvents:'SELECT row_to_json(x) v FROM public.customer_price_unlock_events x WHERE vehicle_id=$1 AND listing_cycle_id=$2 ORDER BY unlock_event_id',
 transactions:'SELECT row_to_json(x) v FROM public.transactions x WHERE vehicle_id=$1 ORDER BY transaction_id',
 visibilityGrants:'SELECT row_to_json(x) v FROM public.vehicle_visibility_grants x WHERE vehicle_id=$1 ORDER BY grant_id',
 images:'SELECT row_to_json(x) v FROM public.vehicle_images x WHERE vehicle_id=$1 ORDER BY image_id',
 listingCycles:'SELECT row_to_json(x) v FROM public.vehicle_listing_cycles x WHERE vehicle_id=$1 ORDER BY listing_cycle_id',
 lineage:'SELECT row_to_json(x) v FROM public.f05_3b_sync_lineages x WHERE vehicle_id=$1 ORDER BY lineage_id'
 };
 const results={};
 for(const [k,sql] of Object.entries(tables)){const count=sql.includes('$4')?4:sql.includes('$2')?2:1;
  const rows=(await db.query(sql,[v,cy,customer,unscopedCustomer].slice(0,count))).rows.map(x=>x.v);results[k]={sha256:digest(rows),rowCount:rows.length};}
 return {results,sha256:digest(results)};
}
test.before(async()=>{
 assert.equal((await verifyV19(db)).verified,true);
 for(const [u,p,k] of [['employee_test','SyntheticF04_3_CurrentProof_2026','employee'],['admin_test','SyntheticAdmin_1234567','admin'],['four_s_test','SyntheticFourS_123456','four']]){
  const r=await auth.login({login:u,password:p,source:'f05-3i-v19-pre-existing-favorite-physical'});
  assert.equal(r.code,'AUTH_OK');if(k==='employee')employee=r.token;else if(k==='admin')admin=r.token;else four=r.token;
 }
 // v18 tests leave UNSCOPED wholesale with only one expired Lock, never current owner.
 for(const [key,car] of [['target','JYTF05C-UNSCOPED'],['gap','JYT-F05C-LOOPBACK-015']]){
  const l=(await db.query("SELECT l.vehicle_id,l.current_cycle_id FROM public.f05_3b_sync_lineages l WHERE l.source_platform='JYT' AND l.car_code=$1",[car])).rows[0];assert.ok(l,car);
  if(key==='target'){vehicle=Number(l.vehicle_id);cycle=Number(l.current_cycle_id)}else{unscopedVehicle=Number(l.vehicle_id);unscopedCycle=Number(l.current_cycle_id)}
 }
 await db.query("INSERT INTO public.customers(customer_id,account_status,customer_level_id,owner_assignment_state,current_owner_employee_id) VALUES($1,'active',1,'assigned',1),($2,'active',1,'assigned',1)",[customer,unscopedCustomer]);
 // Current real Lock grants precisely this Employee/Vehicle/Cycle object scope, not Favorite.
 const granted=await db.query("UPDATE public.locks SET expires_at=now()+interval '2 hours' WHERE vehicle_id=$1 AND listing_cycle_id=$2 AND lock_status='active' AND responsible_employee_id=1 RETURNING lock_id",[vehicle,cycle]);
 assert.equal(granted.rowCount,1,'restore real expired synthetic Lock into current owner scope');
 await db.query("INSERT INTO public.recommendations(recommendation_id,customer_id,vehicle_id,listing_cycle_id,recommender_employee_id,status) VALUES(899954,$1,$2,$3,1,'active')",[customer,vehicle,cycle]);
 await db.query("INSERT INTO public.customer_price_cycle_unlocks(unlock_id,customer_id,vehicle_id,listing_cycle_id,grant_origin) VALUES(899955,$1,$2,$3,'synthetic-f05-3i-current-cycle')",[customer,vehicle,cycle]);
});
test.after(async()=>{await auth.close();await db.end();secret.fill(0)});
test('I-A01 exact signed real v19 seal exists before conversion, old v18 verifier rejects',async()=>{
 assert.equal((await verifyV19(db)).verified,true);
 await assert.rejects(()=>verifyV18(db),/F05_3C_REQUIRED_PRIOR_MIGRATIONS/);
 const r=(await db.query("SELECT migration_id FROM public.f03_schema_migrations ORDER BY migration_id DESC LIMIT 1")).rows[0];
 assert.equal(r.migration_id,'000019_favorite_carrier_ci_only');
});
test('I-A02 original physical Favorite ADD is committed in v19 before ANY conversion',async()=>{
 const result=await syntheticFavoriteChange(db,{customerId:customer,vehicleId:vehicle,action:'ADD',eventKey:event('existing-favorite-add')});
 assert.equal(result.code,'F05_3G_APPLIED',JSON.stringify(result));
 assert.equal((await db.query('SELECT source_type FROM public.vehicles WHERE vehicle_id=$1',[vehicle])).rows[0].source_type,'wholesale');
 const current=(await db.query('SELECT current_state FROM public.f05_3g_customer_favorites WHERE customer_id=$1 AND vehicle_id=$2',[customer,vehicle])).rows[0];
 assert.equal(current.current_state,'active');
 assert.equal((await db.query('SELECT count(*)::int n FROM public.f05_3g_favorite_events WHERE customer_id=$1 AND vehicle_id=$2',[customer,vehicle])).rows[0].n,1);
 preConversion=await snapshot(vehicle,cycle);
 assert.equal(preConversion.results.favorites.rowCount,1);
 assert.equal(preConversion.results.favoriteEvents.rowCount,1);
});
test('I-A03 actual F05-3C employee service converts v19 wholesale with existing Favorite keeping every relation hash',async()=>{
 assert.ok(preConversion?.sha256,'must have verified preexisting Favorite before conversion');
 let release,signal,pid;
 const held=new Promise(resolve=>release=resolve),entered=new Promise(resolve=>signal=resolve);
 const converting=convertWholesaleToMingbang(auth,employee,
  {vehicleId:vehicle,teamId:901,eventKey:event('scoped-conversion')},
  {checkpoint:async(label,c)=>{
   assert.equal(label,'employee_and_source_physically_locked');
   pid=Number((await c.query('SELECT pg_backend_pid() pid')).rows[0].pid);
   signal();await held;
  }});
 const ready=await Promise.race([entered.then(()=>true),converting.then(()=>false)]);
 if(!ready){await converting;assert.fail('trusted conversion failed before advisory checkpoint')}
 const contender=await connect();
 try{
  assert.notEqual(pid,Number((await contender.query('SELECT pg_backend_pid() pid')).rows[0].pid));
  await contender.query('BEGIN');await contender.query("SET LOCAL lock_timeout='250ms'");
  await assert.rejects(()=>contender.query('SELECT pg_advisory_xact_lock(20261011,hashtext($1))',['JYT:JYTF05C-UNSCOPED']),e=>e.code==='55P03');
 }finally{await contender.query('ROLLBACK').catch(()=>{});await contender.end();release()}
 const out=await converting;
 assert.equal(out.allowed,true,JSON.stringify(out));
 assert.equal(out.code,'F05_3C_CONVERTED_SAME_VEHICLE_CYCLE');
 assert.equal(out.vehicleId,vehicle);assert.equal(out.listingCycleId,cycle);
 const after=await snapshot(vehicle,cycle);assert.deepEqual(after,preConversion);
 await writeFile(new URL('../artifacts/source/verified-pre-post-hashes.json',import.meta.url),JSON.stringify({before:preConversion,after,allEqual:true,order:'v19_Favorite_ADD_then_F05-3C_conversion'},null,2)+'\n');
 const obj=(await db.query('SELECT source_type,source_sale_status,platform_visibility FROM public.vehicles WHERE vehicle_id=$1',[vehicle])).rows[0];
 assert.deepEqual(obj,{source_type:'mingbang',source_sale_status:'available',platform_visibility:'hidden'});
 assert.equal((await db.query('SELECT count(*)::int n FROM public.vehicle_listing_cycles WHERE vehicle_id=$1',[vehicle])).rows[0].n,1);
 assert.equal((await db.query('SELECT count(*)::int n FROM public.f05_3c_wholesale_conversions WHERE vehicle_id=$1',[vehicle])).rows[0].n,1);
 prior=after;
 console.log('F05_3I_V19_EXISTING_FAVORITE_PRECONVERSION_POSITIVE',JSON.stringify({vehiclePresent:true,sameCycle:true,allRelationHashesEqual:true,relationHash:after.sha256}));
});
test('I-A04 same signed v19 conversion event is idempotent; different event never second conversion',async()=>{
 const dto={vehicleId:vehicle,teamId:901,eventKey:event('scoped-conversion')};
 assert.equal((await convertWholesaleToMingbang(auth,employee,dto)).code,'F05_3C_SAME_EVENT_ALREADY_CONVERTED');
 assert.equal((await convertWholesaleToMingbang(auth,employee,{...dto,eventKey:event('second-denied')})).allowed,false);
 assert.deepEqual(await snapshot(vehicle,cycle),prior);
});
test('I-A05 actual PC Employee versus Admin, 4S and forged token cannot claim conversion',async()=>{
 const dto={vehicleId:unscopedVehicle,teamId:901,eventKey:event('not-employee')};
 for(const token of ['',admin,four,'mbci_'+'a'.repeat(43)])assert.equal((await convertWholesaleToMingbang(auth,token,dto)).allowed,false);
});
test('I-A06 v19 synthetic Favorite alone NEVER grants conversion owner on unscoped wholesale car',async()=>{
 const f=await syntheticFavoriteChange(db,{customerId:unscopedCustomer,vehicleId:unscopedVehicle,action:'ADD',eventKey:event('favorite-without-lock')});
 assert.equal(f.allowed,true);
 const r=await convertWholesaleToMingbang(auth,employee,{vehicleId:unscopedVehicle,teamId:901,eventKey:event('favorite-does-not-grant-owner')});
 assert.deepEqual(r,{allowed:false,code:SOURCE_GAP});
 assert.equal((await db.query('SELECT source_type FROM public.vehicles WHERE vehicle_id=$1',[unscopedVehicle])).rows[0].source_type,'wholesale');
});
test('I-A07 v19 exact signature verifier rejects committed checksum tampering before any conversion',async()=>{
 const id='000019_favorite_carrier_ci_only';
 const old=(await db.query('SELECT checksum FROM public.f03_schema_migrations WHERE migration_id=$1',[id])).rows[0].checksum;
 try{
  await db.query('UPDATE public.f03_schema_migrations SET checksum=$1 WHERE migration_id=$2',['f'.repeat(64),id]);
  await assert.rejects(()=>convertWholesaleToMingbang(auth,employee,{vehicleId:unscopedVehicle,teamId:901,eventKey:event('tampered-metadata-deny')}),/F05_3G_UNAUTHORIZED_VERSION/);
 }finally{await db.query('UPDATE public.f03_schema_migrations SET checksum=$1 WHERE migration_id=$2',[old,id])}
 assert.equal((await verifyV19(db)).verified,true);
});
test('I-A08 two independent PG16 backends cannot concurrently rewrite signed Favorite Current ownership',async()=>{
 const holder=await connect(),contender=await connect();
 try{
  const [a,b]=await Promise.all([holder.query('SELECT pg_backend_pid() id'),contender.query('SELECT pg_backend_pid() id')]);
  assert.notEqual(a.rows[0].id,b.rows[0].id);
  await holder.query('BEGIN');
  const row=await holder.query('SELECT favorite_id FROM public.f05_3g_customer_favorites WHERE customer_id=$1 AND vehicle_id=$2 FOR UPDATE',[customer,vehicle]);
  assert.equal(row.rowCount,1);
  await contender.query('BEGIN');await contender.query("SET LOCAL lock_timeout='250ms'");
  await assert.rejects(()=>contender.query('SELECT favorite_id FROM public.f05_3g_customer_favorites WHERE customer_id=$1 AND vehicle_id=$2 FOR SHARE',[customer,vehicle]),e=>e.code==='55P03');
 }finally{await holder.query('ROLLBACK').catch(()=>{});await contender.query('ROLLBACK').catch(()=>{});await holder.end();await contender.end()}
 assert.deepEqual(await snapshot(vehicle,cycle),prior);
});
test('I-A09 after v19 conversion, previously committed Favorite Current and Event remain immutable and safe',async()=>{
 await assert.rejects(()=>db.query("UPDATE public.f05_3g_favorite_events SET event_key=$1 WHERE customer_id=$2 AND vehicle_id=$3",[event('historical-forge'),customer,vehicle]),/F05_3G_FAVORITE_EVENT_IMMUTABLE/);
 assert.deepEqual(await snapshot(vehicle,cycle),prior);
});
test('I-A10 old Favorite REMOVE / ADD remain valid independently after converted, no new Vehicle or Cycle',async()=>{
 const before=(await db.query('SELECT count(*)::int n FROM public.f05_3g_favorite_events WHERE customer_id=$1 AND vehicle_id=$2',[customer,vehicle])).rows[0].n;
 assert.equal((await syntheticFavoriteChange(db,{customerId:customer,vehicleId:vehicle,action:'REMOVE',eventKey:event('post-conversion-remove')})).allowed,true);
 assert.equal((await syntheticFavoriteChange(db,{customerId:customer,vehicleId:vehicle,action:'ADD',eventKey:event('post-conversion-re-add')})).allowed,true);
 assert.equal((await db.query('SELECT count(*)::int n FROM public.f05_3g_favorite_events WHERE customer_id=$1 AND vehicle_id=$2',[customer,vehicle])).rows[0].n,before+2);
 assert.equal((await db.query('SELECT current_state FROM public.f05_3g_customer_favorites WHERE customer_id=$1 AND vehicle_id=$2',[customer,vehicle])).rows[0].current_state,'active');
 assert.equal((await db.query('SELECT count(*)::int n FROM public.vehicle_listing_cycles WHERE vehicle_id=$1',[vehicle])).rows[0].n,1);
});
test('I-A11 forged arbitrary version and smuggled caller verifier parameter cannot bypass signed selection',async()=>{
 const p={vehicleId:vehicle,teamId:901,eventKey:event('wrong-shape'),schemaVersion:'000018_wholesale_mingbang_conversion_ci_only'};
 assert.equal((await convertWholesaleToMingbang(auth,employee,p)).allowed,false);
 assert.equal((await verifyV19(db)).verified,true);
});
