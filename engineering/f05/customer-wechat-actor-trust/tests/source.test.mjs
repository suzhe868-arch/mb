import {test} from 'node:test';
import assert from 'node:assert/strict';
import {connect,verify} from '../../favorite-physical-carrier/migration.mjs';
import {SOURCE_GAP,TRUST_CHAIN,auditPhysicalIdentity,inspectSyntheticIdentity,auditUntrustedClaim} from '../source-audit.mjs';

const db = await connect();
const alpha = 899931;
const beta = 899932;
const scope = 'f05h_ci_miniprogram';
const first = 'f05h_ci_person_one';
const second = 'f05h_ci_person_two';
const counts = async () => (await db.query(
  'SELECT ' +
  '(SELECT COUNT(*)::int FROM public.f05_3g_customer_favorites) favorites,' +
  '(SELECT COUNT(*)::int FROM public.f05_3g_favorite_events) events,' +
  '(SELECT COUNT(*)::int FROM public.f05_3c_wholesale_conversions) conversions'
)).rows[0];
let initialCounts;

test.before(async () => {
  assert.equal((await verify(db)).verified,true);
  initialCounts = await counts();
  await db.query(
    "INSERT INTO public.customers(customer_id,account_status,customer_level_id,owner_assignment_state,current_owner_employee_id) " +
    "VALUES ($1,'active',1,'assigned',1),($2,'active',1,'assigned',1)",
    [alpha,beta]
  );
});
test.after(async () => db.end());

test('H-A01 real PostgreSQL16 v19 physical scoped identity and trust-chain gap',async()=>{
  const proof = await auditPhysicalIdentity(db);
  assert.equal(proof.physicalIdentityRelationVerified,true);
  assert.equal(proof.authenticCustomerSessionVerified,false);
  assert.equal(proof.sourceGap,SOURCE_GAP);
  assert.equal(TRUST_CHAIN.filter(x=>x[1]==='SOURCE_GAP').length,5);
});
test('H-A02 two genuine Customer records remain distinct without unauthorized merge',async()=>{
  await db.query(
    'INSERT INTO public.customer_wechat_identities(customer_id,identity_scope,wechat_identity_key) ' +
    'VALUES($1,$2,$3),($4,$2,$5)',
    [alpha,scope,first,beta,second]
  );
  const actual = (await db.query(
    'SELECT customer_id FROM public.customer_wechat_identities WHERE identity_scope=$1 ORDER BY wechat_identity_key',[scope]
  )).rows;
  assert.deepEqual(actual.map(x=>Number(x.customer_id)),[alpha,beta]);
});
test('H-A03 scoped identity unique index denies cross-Customer impersonation',async()=>{
  await assert.rejects(
    ()=>db.query(
      'INSERT INTO public.customer_wechat_identities(customer_id,identity_scope,wechat_identity_key) VALUES($1,$2,$3)',
      [beta,scope,first]
    ),e=>e.code==='23505'
  );
  const actual = (await db.query(
    'SELECT customer_id FROM public.customer_wechat_identities WHERE identity_scope=$1 AND wechat_identity_key=$2',
    [scope,first]
  )).rows[0];
  assert.equal(Number(actual.customer_id),alpha);
});
test('H-A04 physically mapped scoped key, fake code, raw customerId and PC roles are never signed sessions',async()=>{
  assert.deepEqual(await inspectSyntheticIdentity(db,scope,first),{
    authenticated:false,mapped:true,active:true,sourceGap:SOURCE_GAP
  });
  assert.equal((await inspectSyntheticIdentity(db,scope,'f05h_ci_unknown')).mapped,false);
  assert.equal((await inspectSyntheticIdentity(db,'external_wechat','raw_openid')).mapped,false);
  for(const claim of [
    {customerId:alpha,scope,identityKey:first,trusted:true},
    {customerId:beta,scope,identityKey:first,code:'fake-code'},
    {principalKind:'employee'},{principalKind:'system_admin'},
    {principalKind:'four_s'},{authorization:'fake-api-token'},{}
  ]) {
    assert.deepEqual(await auditUntrustedClaim(db,claim),{allowed:false,sourceGap:SOURCE_GAP});
  }
});
test('H-A05 current inactive/restore Customer status does not grant untrusted ownership',async()=>{
  await db.query("UPDATE public.customers SET account_status='inactive' WHERE customer_id=$1",[alpha]);
  assert.equal((await inspectSyntheticIdentity(db,scope,first)).active,false);
  assert.equal((await auditUntrustedClaim(db,{customerId:alpha,trusted:true})).allowed,false);
  await db.query("UPDATE public.customers SET account_status='active' WHERE customer_id=$1",[alpha]);
  assert.equal((await inspectSyntheticIdentity(db,scope,first)).active,true);
  assert.equal((await auditUntrustedClaim(db,{customerId:alpha,trusted:true})).allowed,false);
});
test('H-A06 two different PG16 backends and account governance have real 55P03 lock conflict',async()=>{
  const holder=await connect(),contender=await connect();
  try{
    const [p1,p2]=await Promise.all([
      holder.query('SELECT pg_backend_pid() pid'),contender.query('SELECT pg_backend_pid() pid')
    ]);
    assert.notEqual(p1.rows[0].pid,p2.rows[0].pid);
    await holder.query('BEGIN');
    await holder.query('SELECT customer_id FROM public.customers WHERE customer_id=$1 FOR UPDATE',[alpha]);
    await contender.query('BEGIN');
    await contender.query("SET LOCAL lock_timeout='150ms'");
    await assert.rejects(
      ()=>contender.query('SELECT customer_id FROM public.customers WHERE customer_id=$1 FOR SHARE',[alpha]),
      e=>e.code==='55P03'
    );
  }finally{
    await holder.query('ROLLBACK').catch(()=>{});
    await contender.query('ROLLBACK').catch(()=>{});
    await holder.end();await contender.end();
  }
  assert.equal((await auditUntrustedClaim(db,{customerId:alpha})).allowed,false);
});
test('H-A07 real PC login account principal is Employee/SystemAdmin, not Customer',async()=>{
  const constraints = (await db.query(
    "SELECT pg_get_constraintdef(oid) definition FROM pg_constraint " +
    "WHERE conrelid='public.pc_login_accounts'::regclass"
  )).rows;
  assert.ok(constraints.some(x=>x.definition.includes('employee')&&x.definition.includes('system_admin')));
  for(const claim of [{kind:'employee',cookie:'invalid'},{kind:'system_admin'},{kind:'four_s'}, {customerId:beta}]) {
    assert.equal((await auditUntrustedClaim(db,claim)).allowed,false);
  }
});
test('H-A08 entire audit leaves Favorite current/events and vehicle conversion rows unchanged',async()=>{
  assert.deepEqual(await counts(),initialCounts);
  assert.equal((await verify(db)).verified,true);
  assert.equal((await auditPhysicalIdentity(db)).authenticCustomerSessionVerified,false);
});
