import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect,verify} from '../../wholesale-to-mingbang-conversion/migration.mjs';
import {convertWholesaleToMingbang} from '../../wholesale-to-mingbang-conversion/service.mjs';
import {GAP,auditFavoriteCarrier,snapshotCurrentRelations,projectFavorite,preservedTables} from '../audit.mjs';

const db=await connect(),secret=randomBytes(32);
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin:'https://127.0.0.1:48983'});
let vid,cycle,employee,admin,four,saved,converted;
const customer=894201,lock=895201;
const ev=x=>'f05-3f-pg16-real-customer-relation-'+x;
const req=()=>({vehicleId:vid,teamId:901,eventKey:ev('one-physical-vehicle-same-cycle')});
test.before(async()=>{
 assert.equal((await verify(db)).verified,true);
 const line=(await db.query("SELECT vehicle_id,current_cycle_id FROM public.f05_3b_sync_lineages "+
  "WHERE source_platform='JYT' AND car_code='JYTF05C-UNSCOPED'")).rows[0];
 assert.ok(line);vid=Number(line.vehicle_id);cycle=Number(line.current_cycle_id);
 assert.equal((await db.query('SELECT source_type FROM public.vehicles WHERE vehicle_id=$1',[vid])).rows[0].source_type,'wholesale');
 for(const [name,password,kind] of [
  ['employee_test','SyntheticF04_3_CurrentProof_2026','employee'],
  ['admin_test','SyntheticAdmin_1234567','admin'],
  ['four_s_test','SyntheticFourS_123456','four']]){
  const a=await auth.login({login:name,password,source:'f05-3f-pg16-physical-customer-relations'});
  assert.equal(a.code,'AUTH_OK',kind+':'+a.code);
  if(kind==='employee')employee=a.token;if(kind==='admin')admin=a.token;if(kind==='four')four=a.token;
 }
});
test.after(async()=>{await auth.close();await db.end();secret.fill(0)});
test('F-A01 physical PG16 catalog shows no signed Favorite or bookmark/collection carrier',async()=>{
 const a=await auditFavoriteCarrier(db);
 assert.equal(a.code,GAP);assert.equal(a.allowed,false);
 assert.equal(a.physicalFavoritePresent,false);
 assert.ok(a.checkedRelations>90,'real M94+signed increment catalog');
 assert.deepEqual(a.verifiedPreservedTables,[...preservedTables]);
});
test('F-A02 synthetic signed Customer+Lock/Recommendation/price unlock/images/price history are real PG16 rows before conversion',async()=>{
 await db.query("INSERT INTO public.customers(customer_id,account_status,customer_level_id,owner_assignment_state,current_owner_employee_id) VALUES($1,'active',1,'assigned',1)",[customer]);
 await db.query("INSERT INTO public.locks(lock_id,customer_id,vehicle_id,listing_cycle_id,lock_status,responsible_employee_id,created_at,expires_at) VALUES($1,$2,$3,$4,'active',1,now()-interval '2 hours',now()+interval '2 hours')",
  [lock,customer,vid,cycle]);
 await db.query("INSERT INTO public.recommendations(recommendation_id,customer_id,vehicle_id,listing_cycle_id,recommender_employee_id,status) VALUES(897201,$1,$2,$3,1,'active')",[customer,vid,cycle]);
 await db.query("INSERT INTO public.customer_price_cycle_unlocks(unlock_id,customer_id,vehicle_id,listing_cycle_id,grant_origin) VALUES(897202,$1,$2,$3,'synthetic-f05-3f-actual-pg16-current-cycle')",[customer,vid,cycle]);
 await db.query("INSERT INTO public.vehicle_images(image_id,vehicle_id,relative_path,source_url_fact,asset_storage_status) VALUES(897203,$1,'source/JYT/F05F-ORIGINAL','synthetic-JYT-source-evidence-only','pending')",[vid]);
 await db.query("INSERT INTO public.vehicle_price_history(price_event_id,vehicle_id,amount_cents,price_kind,valid_from) VALUES(897204,$1,2250000,'wholesale',now()-interval '1 day')",[vid]);
 saved=await snapshotCurrentRelations(db,vid,cycle,customer);
 assert.equal(saved.data.locks.length,2,'expired lock from F05-3C plus new valid real lock');
 assert.equal(saved.data.recommendations.length,1);
 assert.equal(saved.data.customer_price_cycle_unlocks.length,1);
 assert.equal(saved.data.vehicle_images.length,1);
 assert.equal(saved.data.vehicle_price_history.length,1);
 assert.equal(saved.data.cycle.length,1);
 assert.equal(saved.data.lineage.length,1);
 assert.equal(saved.data.customer.length,1);
});
test('F-A03 real signed Employee converts one existing Vehicle/Cycle while two independent PG16 backends prove Lock row 55P03',async()=>{
 let release,signal,backend;
 const held=new Promise(resolve=>release=resolve),entered=new Promise(resolve=>signal=resolve);
 const converting=convertWholesaleToMingbang(auth,employee,req(),{checkpoint:async(label,c)=>{
  assert.equal(label,'employee_and_source_physically_locked');
  backend=Number((await c.query('SELECT pg_backend_pid() pid')).rows[0].pid);
  signal();await held;
 }});
 // Never hang indefinitely when a prerequisite failed and the conversion
 // rejected before entering its physical transaction checkpoint.
 await Promise.race([
  entered,
  converting.then(out=>{throw Error('F05_3F_CHECKPOINT_NOT_REACHED_'+JSON.stringify(out))}),
  new Promise((_,reject)=>setTimeout(()=>reject(Error('F05_3F_CHECKPOINT_TIMEOUT_20_SECONDS')),20000))
 ]);
 const contender=await connect();
 try{
  assert.notEqual(Number((await contender.query('SELECT pg_backend_pid() pid')).rows[0].pid),backend);
  await contender.query('BEGIN');
  await contender.query("SET LOCAL lock_timeout='300ms'");
  await assert.rejects(()=>contender.query(
   "UPDATE public.locks SET lock_status='cancelled' WHERE lock_id=$1",[lock]),e=>e?.code==='55P03');
 }finally{await contender.query('ROLLBACK').catch(()=>{});await contender.end();release()}
 converted=await converting;
 assert.equal(converted.allowed,true,JSON.stringify(converted));
 assert.equal(converted.code,'F05_3C_CONVERTED_SAME_VEHICLE_CYCLE');
 assert.equal(converted.vehicleId,vid);assert.equal(converted.listingCycleId,cycle);
});
test('F-A04 actual existing customer relationship carriers match before/after row JSON SHA bit-for-bit, not a fabricated Favorite',async()=>{
 const after=await snapshotCurrentRelations(db,vid,cycle,customer);
 assert.equal(after.sha256,saved.sha256,'all real relationships and source/cycle are unchanged');
 for(const x of preservedTables)assert.deepEqual(after.data[x],saved.data[x],x);
 assert.deepEqual(after.data.customer,saved.data.customer);
 assert.deepEqual(after.data.lineage,saved.data.lineage);
 assert.deepEqual(after.data.cycle,saved.data.cycle);
 const v=(await db.query(
  'SELECT source_type,source_sale_status,platform_visibility FROM public.vehicles WHERE vehicle_id=$1',[vid])).rows[0];
 assert.deepEqual(v,{source_type:'mingbang',source_sale_status:'available',platform_visibility:'hidden'});
 assert.equal((await db.query('SELECT count(*)::int n FROM public.vehicle_listing_cycles WHERE vehicle_id=$1',[vid])).rows[0].n,1);
 assert.equal((await db.query('SELECT count(*)::int n FROM public.f05_3c_wholesale_conversions WHERE vehicle_id=$1',[vid])).rows[0].n,1);
});
test('F-A05 actual FK signed Customer/Lock/Recommendation/price cycle entitlement remain bound to old current Cycle, never migrated',async()=>{
 const s=(await db.query(
 "SELECT c.customer_id,l.lock_id,r.recommendation_id,u.unlock_id,l.listing_cycle_id lock_cycle,r.listing_cycle_id rec_cycle,u.listing_cycle_id price_cycle "+
 "FROM public.customers c JOIN public.locks l ON l.customer_id=c.customer_id "+
 "JOIN public.recommendations r ON r.customer_id=c.customer_id AND r.vehicle_id=l.vehicle_id "+
 "JOIN public.customer_price_cycle_unlocks u ON u.customer_id=c.customer_id AND u.vehicle_id=l.vehicle_id "+
 "WHERE c.customer_id=$1 AND l.lock_id=$2",[customer,lock])).rows;
 assert.equal(s.length,1);
 assert.equal(Number(s[0].lock_cycle),cycle);
 assert.equal(Number(s[0].rec_cycle),cycle);
 assert.equal(Number(s[0].price_cycle),cycle);
});
test('F-A06 signed conversion and audit remain immutable, original JYT identity not rewritable or a second vehicle',async()=>{
 const c=(await db.query('SELECT * FROM public.f05_3c_wholesale_conversions WHERE vehicle_id=$1',[vid])).rows[0];
 assert.equal(c.before_state.carCode,'JYTF05C-UNSCOPED');
 assert.equal(c.after_state.sourceType,'mingbang');
 assert.equal(Number(c.listing_cycle_id),cycle);
 await assert.rejects(()=>db.query('UPDATE public.f05_3c_wholesale_conversions SET actor_employee_id=9 WHERE conversion_id=$1',[c.conversion_id]),/F05_3C_SIGNED_HISTORY_IMMUTABLE/);
 assert.equal((await db.query('SELECT count(*)::int n FROM public.f05_3b_sync_lineages WHERE vehicle_id=$1',[vid])).rows[0].n,1);
});
test('F-A07 same conversion event is idempotent, new event denied, existing PG16 relationship snapshot identical',async()=>{
 assert.equal((await convertWholesaleToMingbang(auth,employee,req())).code,'F05_3C_SAME_EVENT_ALREADY_CONVERTED');
 assert.equal((await convertWholesaleToMingbang(auth,employee,{...req(),eventKey:ev('second-unlawful-conversion')})).allowed,false);
 assert.equal((await snapshotCurrentRelations(db,vid,cycle,customer)).sha256,saved.sha256);
});
test('F-A08 Customer, employee, 4S, admin or arbitrary claimed owner cannot extract a nonexistent Favorite receipt',async()=>{
 for(const tok of ['',employee,admin,four,'mbci_'+'a'.repeat(43)]){
  const result=await projectFavorite(auth,tok,{vehicleId:vid});
  assert.deepEqual(result,{allowed:false,code:GAP});
 }
 assert.equal((await projectFavorite(auth,employee,{vehicleId:vid,customerId:customer})).allowed,false);
 assert.equal((await projectFavorite(auth,employee,{vehicleId:vid+9999})).code,GAP);
 assert.equal((await db.query('SELECT count(*)::int n FROM public.f05_3c_wholesale_conversions WHERE vehicle_id=$1',[vid])).rows[0].n,1);
});
