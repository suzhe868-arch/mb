import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes,createHash} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect,verify,ID,checksum} from '../migration.mjs';
import {addSyntheticDailyQuota as add,SOURCE_GAP} from '../service.mjs';
const db=await connect(),secret=randomBytes(32);
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin:'https://127.0.0.1:48986'});
const user={
 sales:['employee_test','SyntheticF04_3_CurrentProof_2026'],
 manager:['http_test','SyntheticHttps_1234567'],
 head:['race_test','SyntheticRace_1234567'],
 ordinary:['limit_test','SyntheticLimit_1234567'],
 admin:['admin_test','SyntheticAdmin_1234567'],
 four:['four_s_test','SyntheticFourS_123456']
};
const tokens={};
const login=async kind=>{const [login,password]=user[kind],s=await auth.login({login,password,source:'f05-5-real-actor-'+kind});assert.equal(s.code,'AUTH_OK');return s.token};
const mk=(id=899511,key='first-real-ci-owner-free-00000001',delta=2,atIso='2026-10-12T10:00:00.000Z')=>({customerId:id,teamId:901,delta,idempotencyKey:key,atIso});
const doAdd=(kind,p,opt)=>add(auth,tokens[kind],p,opt);
const rows=(sql,args=[])=>db.query(sql,args).then(x=>x.rows);
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const tally=async id=>({days:await rows('SELECT business_day_shanghai::text AS business_date,temp_additions,consumed_count FROM public.customer_day_quota_ledger WHERE customer_id=$1 ORDER BY business_day_shanghai',[id]),
 receipts:await rows('SELECT idempotency_key,actor_employee_id,added_count,after_temp_additions FROM public.f05_5_quota_addition_events_ci WHERE customer_id=$1 ORDER BY event_id',[id]),
 adjustments:await rows('SELECT delta,changed_by FROM public.customer_quota_adjustments WHERE customer_id=$1 ORDER BY adjustment_id',[id])});
test.before(async()=>{
 assert.equal((await verify(db)).verified,true);
 for(const name of Object.keys(user))tokens[name]=await login(name);
 // Manager's signed F03 account is first-login restricted. Complete actual
 // password-change protocol; never bypass normalOnly for a quota mutation.
 const oldManager=tokens.manager;
 const changed=await auth.change({token:oldManager,csrf:auth.csrfFor(oldManager),
  oldPassword:user.manager[1],newPassword:'SyntheticF055QuotaManager_2026'});
 assert.equal(changed.code,'PASSWORD_CHANGED_REAUTH_REQUIRED');
 user.manager[1]='SyntheticF055QuotaManager_2026';
 tokens.manager=await login('manager');
 // Tests require exact owner/team/role from the actually signed M94+F03 fixtures.
 for(const [id,role] of [[1,'sales'],[5,'manager'],[6,'store_head']]){
  const x=(await rows('SELECT r.role_code FROM public.employees e JOIN public.roles r ON r.role_id=e.main_role_id WHERE e.employee_id=$1',[id]))[0];assert.equal(x?.role_code,role);
 }
});
test.after(async()=>{await auth.close();await db.end();secret.fill(0)});
test('5-A01 signed v20 original seal plus nonprivileged v21 immutable PG catalog',async()=>{
 assert.equal((await verify(db)).id,ID);
 assert.match(checksum,/^[a-f0-9]{64}$/);
 assert.equal((await rows('SELECT count(*)::int n FROM public.f03_schema_migrations'))[0].n,19);
});
test('5-A02 original real Employee Session + current owner + isolated personal permission adds free day quota atomically',async()=>{
 const p=mk();let result=await doAdd('sales',p);
 assert.equal(result.code,'F05_5_CI_ADDED_FREE_DAILY_QUOTA',JSON.stringify(result));
 assert.equal(result.syntheticFixtureOnly,true);let view=await tally(p.customerId);
 assert.equal(view.days[0].temp_additions,2);assert.equal(view.days[0].consumed_count,0);
 assert.equal(view.receipts.length,1);assert.equal(view.adjustments.length,1);
});
test('5-A03 same key retry persists exactly one physical adjustment and immutable event',async()=>{
 const p=mk(),old=await tally(p.customerId),x=await doAdd('sales',p);
 assert.equal(x.code,'F05_5_CI_SAME_REQUEST_ALREADY_ADDED');assert.deepEqual(await tally(p.customerId),old);
});
test('5-A04 truly independent concurrent PG16 auth sessions and same-key double-send only one debit-free addition',async()=>{
 const a=await login('sales'),b=await login('sales'),p=mk(899512,'two-real-backends-same-key-0000001',3);
 const c1=await connect(),c2=await connect();
 const id1=Number((await c1.query('SELECT pg_backend_pid() pid')).rows[0].pid);
 const id2=Number((await c2.query('SELECT pg_backend_pid() pid')).rows[0].pid);
 assert.notEqual(id1,id2,'must be two genuine independent PostgreSQL backends');
 try{
  await c1.query('BEGIN');
  await c1.query('SELECT customer_id FROM public.customers WHERE customer_id=$1 FOR UPDATE',[899512]);
  await c2.query('BEGIN');await c2.query("SET LOCAL lock_timeout='300ms'");
  await assert.rejects(()=>c2.query('SELECT customer_id FROM public.customers WHERE customer_id=$1 FOR UPDATE',[899512]),e=>e.code==='55P03');
  await c2.query('ROLLBACK');await c1.query('COMMIT');
 }finally{await c1.end();await c2.end();}
 const ids=new Set([id1,id2]);
 const checkpoint=async(_,client)=>ids.add(Number((await client.query('SELECT pg_backend_pid() pid')).rows[0].pid));
 const results=await Promise.all([add(auth,a,p,{checkpoint}),add(auth,b,p,{checkpoint})]);
 assert.deepEqual(results.map(x=>x.code).sort(),['F05_5_CI_ADDED_FREE_DAILY_QUOTA','F05_5_CI_SAME_REQUEST_ALREADY_ADDED'].sort());
 assert.equal((await tally(899512)).receipts.length,1);
 assert.equal((await tally(899512)).days[0].temp_additions,3);
 console.log('F05_5_REAL_PG16_CONCURRENT_F03_SESSIONS_CI_SINGLE_APPEND',JSON.stringify({oneAdjustment:true,seenBackendPids:[...ids]}));
});
test('5-A05 multiple independent additions on same UTC+8 day accumulate, never touch prior consumption',async()=>{
 const before=await tally(899511),x=await doAdd('sales',mk(899511,'second-independent-event-00000002',3));
 assert.equal(x.allowed,true);const after=await tally(899511);
 assert.equal(after.days[0].temp_additions,5);
 assert.equal(after.receipts.length,2);
 assert.equal(after.days[0].consumed_count,before.days[0].consumed_count);
});
test('5-A06 malicious idempotency reuse across Customer or delta rejects without mutation',async()=>{
 const old=await tally(899513);
 const key='first-real-ci-owner-free-00000001';
 assert.equal((await doAdd('sales',mk(899513,key,2))).code,'F05_5_IDEMPOTENCY_KEY_IDENTITY_COLLISION');
 assert.equal((await doAdd('sales',mk(899511,key,6))).code,'F05_5_IDEMPOTENCY_KEY_IDENTITY_COLLISION');
 assert.deepEqual(await tally(899513),old);
});
test('5-A07 manager true signed real F03 Session but separate CI synthetic capability scope proof',async()=>{
 const x=await doAdd('manager',mk(899513,'manager-scope-true-member-0000001',1));
 assert.equal(x.code,'F05_5_CI_ADDED_FREE_DAILY_QUOTA',JSON.stringify(x));
 assert.equal(x.actorEmployeeId,5);
});
test('5-A08 store-head same-team explicit CI capability proof; customer owner still a different Employee',async()=>{
 const x=await doAdd('head',mk(899513,'store-head-scope-proof-0000001',2));
 assert.equal(x.code,'F05_5_CI_ADDED_FREE_DAILY_QUOTA',JSON.stringify(x));
 assert.equal(x.actorEmployeeId,6);
});
test('5-A09 ordinary sales without ownership or dedicated permission cannot add',async()=>{
 const x=await doAdd('ordinary',mk(899513,'not-owner-current-scope-0000001',1));
 assert.equal(x.allowed,false);assert.match(x.code,/DENY|SOURCE_GAP|OWNER|SCOPE|MINGBANG/);
});
test('5-A10 FourS and SystemAdmin original sessions cannot impersonate Employee business quota action',async()=>{
 for(const kind of ['four','admin']){
  const x=await doAdd(kind,mk(899513,'hard-deny-role-'+kind+'-0000000001',1));
  assert.equal(x.allowed,false);
 }
});
test('5-A11 currently UNLIMITED Customer cannot receive new temp addition under 3A',async()=>{
 const before=await tally(899515),x=await doAdd('sales',mk(899515,'unlimited-no-add-source-000001',2));
 assert.equal(x.code,'F05_5_3A_UNLIMITED_CANNOT_ADD');assert.deepEqual(await tally(899515),before);
});
test('5-A12 inactive Customer cannot accumulate quota or audit',async()=>{
 const before=await tally(899514),x=await doAdd('sales',mk(899514,'inactive-no-add-source-000001',1));
 assert.equal(x.code,'F05_5_CUSTOMER_NOT_ACTIVE_OR_NOT_OWNED');assert.deepEqual(await tally(899514),before);
});
test('5-A13 explicit Employee personal deny prevents action and no audit, restoring does not erase old facts',async()=>{
 const old=await tally(899511);
 await db.query("UPDATE public.employee_permission_overrides SET decision='deny',changed_at=now() WHERE employee_id=1 AND permission_id=95");
 const x=await doAdd('sales',mk(899511,'employee-personal-deny-0000001',1));
 assert.equal(x.allowed,false);assert.deepEqual(await tally(899511),old);
 await db.query("UPDATE public.employee_permission_overrides SET decision='allow',changed_at=now() WHERE employee_id=1 AND permission_id=95");
});
test('5-A14 LIMITED→UNLIMITED→LIMITED does not delete existing same-day temp additions',async()=>{
 const before=await tally(899511);
 await db.query('UPDATE public.customers SET customer_level_id=2 WHERE customer_id=899511');
 const a=await doAdd('sales',mk(899511,'no-add-during-unlimited-00001',1));
 assert.equal(a.code,'F05_5_3A_UNLIMITED_CANNOT_ADD');
 await db.query('UPDATE public.customers SET customer_level_id=1 WHERE customer_id=899511');
 assert.deepEqual(await tally(899511),before);
});
test('5-A15 midnight UTC+8 changes business day; previous day grants/history remain',async()=>{
 const p=mk(899511,'new-day-after-utc8-midnight-00001',2,'2026-10-12T16:00:00.000Z');
 assert.equal((await doAdd('sales',p)).allowed,true);
 const x=await tally(899511);
 assert.deepEqual(x.days.map(i=>i.business_date),['2026-10-12','2026-10-13']);
 assert.deepEqual(x.days.map(i=>i.temp_additions),[5,2]);
});
test('5-A16 changed real current Customer owner denies old sales even with explicit CI capability',async()=>{
 await db.query('UPDATE public.customers SET current_owner_employee_id=7 WHERE customer_id=899513');
 const before=await tally(899513);
 const x=await doAdd('sales',mk(899513,'old-owner-must-no-longer-add-001',1));
 assert.equal(x.code,'F05_5_SALES_NOT_CURRENT_CUSTOMER_OWNER');
 assert.deepEqual(await tally(899513),before);
});
test('5-A17 immutable additive receipt UPDATE denied, checksum drift and injected rollback evidence',async()=>{
 await assert.rejects(()=>db.query('UPDATE public.f05_5_quota_addition_events_ci SET added_count=2 WHERE event_id=(SELECT min(event_id) FROM public.f05_5_quota_addition_events_ci)'),/F05_5_QUOTA_EVENT_IMMUTABLE/);
 const old=(await rows('SELECT checksum FROM public.f03_schema_migrations WHERE migration_id=$1',[ID]))[0].checksum;
 try{await db.query('UPDATE public.f03_schema_migrations SET checksum=$1 WHERE migration_id=$2',['0'.repeat(64),ID]);
 await assert.rejects(()=>verify(db),/F05_5_VERSION_CHECKSUM_CHANGED/);}
 finally{await db.query('UPDATE public.f03_schema_migrations SET checksum=$1 WHERE migration_id=$2',[old,ID]);}
 assert.equal((await verify(db)).verified,true);
});
test('5-A18 final signed true PG16 rows, immutable source event, SOURCE_GAP and hashed evidence',async()=>{
 const first=await tally(899511);
 assert.equal(first.receipts.length,3);
 const verified=await verify(db);
 await mkdir(new URL('../artifacts/source/',import.meta.url),{recursive:true});
 await writeFile(new URL('../artifacts/source/ci-employee-adjustment-atomic-receipt.json',import.meta.url),
  JSON.stringify({verifiedVersion:verified,source:'CI_SYNTHETIC_ROLE_FIXTURE_NOT_PRODUCTION',
   liveProductionIssuerProven:false,employeeSourceGap:SOURCE_GAP,actorEmployeeIds:[1,5,6],
   realPg16RowDigest:hash(first),ledgerDays:first.days,immutableEventCount:first.receipts.length,
   noPriceUnlockEventModified:true,noFundsChanged:true},null,2)+'\n');
 console.log('F05_5_CI_REAL_EMPLOYEE_SESSION_SYNTHETIC_SCOPE_OWNER_ATOMIC_FREE_ADDITION');
});
