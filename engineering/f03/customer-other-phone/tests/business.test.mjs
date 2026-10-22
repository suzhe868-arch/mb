import assert from 'node:assert/strict';
import {before,after,test} from 'node:test';
import {randomBytes,randomUUID,createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {getPublicStructure} from '../../../f02-1/schema-integrity.mjs';
import {verifyScopeDatabase} from '../../runtime-scope/readiness.mjs';
import {connect,assertEnvironment} from '../environment.mjs';
import {CustomerOtherPhoneService} from '../../../src/f03-customer-other-phone-service.mjs';
import {PublisherPhoneAdminService} from '../../../src/f03-publisher-phone-admin-service.mjs';

let auth,pool,service,employee,admin,fourS,key;
const requestKey=()=>randomUUID().replaceAll('-','');
const phoneA='13812345678',phoneB='13912345678',phoneC='13712345678',phoneD='13612345678',phoneE='13512345678',phoneF='13412345678';
const sql=(statement,values=[])=>pool.query(statement,values);

const list=(customerId='301',token=employee)=>service.list({token,customerId});
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const deferred=()=>{let resolve;const promise=new Promise(r=>{resolve=r});return {promise,resolve};};
const concurrentPhone=n=>'138'+String(80000000+n).padStart(8,'0');
async function waitForLockWait(fragment,timeoutMs=6000){
 const deadline=Date.now()+timeoutMs;
 while(Date.now()<deadline){
  const rows=(await sql(
   "SELECT pid::text pid,wait_event,query FROM pg_stat_activity WHERE datname=current_database() AND usename=current_user AND state='active' AND wait_event_type='Lock' AND query ILIKE $1 AND pid<>pg_backend_pid() ORDER BY pid LIMIT 1",
   [fragment])).rows;
  if(rows.length)return rows[0];
  await delay(25);
 }
 throw Error('PG16_LOCK_WAIT_NOT_OBSERVED');
}
async function customerPhoneCounts(customerId='301'){
 const facts=Number((await sql('SELECT count(*) n FROM public.customer_phone_facts WHERE customer_id=$1::bigint',[customerId])).rows[0].n);
 const audits=Number((await sql(
  "SELECT count(*) n FROM public.audit_events WHERE action IN ('customer.phone.manage.add','customer.phone.manage.replace','customer.phone.manage.end') AND role_context->>'customerId'=$1",
  [customerId])).rows[0].n);
 return {facts,audits};
}
async function assertPhoneWriteCommitted(out,phoneNumber){
 assert.equal(out.status,200);
 const fact=(await sql('SELECT phone_ciphertext,ended_at FROM public.customer_phone_facts WHERE phone_fact_id=$1::bigint AND customer_id=301',[out.phoneFactId])).rows[0];
 assert.ok(fact);assert.equal(fact.ended_at,null);assert.ok(Buffer.isBuffer(fact.phone_ciphertext));
 assert.equal(fact.phone_ciphertext.includes(Buffer.from(phoneNumber)),false);
 const audit=(await sql("SELECT role_context,before_json,after_json FROM public.audit_events WHERE object_kind='customer_phone_fact' AND object_id=$1 AND action='customer.phone.manage.add'",[out.phoneFactId])).rows[0];
 assert.ok(audit);assert.equal(JSON.stringify(audit).includes(phoneNumber),false);
 assert.equal(JSON.stringify(audit).includes('phone_ciphertext'),false);
}
async function runFactRace(kind,order,suffix){
 const specs={
  override:{
   prepare:async()=>sql("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES(1,11,'allow',transaction_timestamp()) ON CONFLICT(employee_id,permission_id) DO UPDATE SET decision='allow',changed_at=transaction_timestamp()"),
   revoke:async c=>c.query("UPDATE public.employee_permission_overrides SET decision='deny',changed_at=transaction_timestamp() WHERE employee_id=1 AND permission_id=11"),
   mutationWait:'%SELECT decision FROM public.employee_permission_overrides%',
   revokeWait:'%UPDATE public.employee_permission_overrides%',
   denied:'CURRENT_PERSONAL_DENY',
   assertRevoked:async()=>assert.equal((await sql("SELECT decision FROM public.employee_permission_overrides WHERE employee_id=1 AND permission_id=11")).rows[0]?.decision,'deny'),
   restore:async()=>sql('DELETE FROM public.employee_permission_overrides WHERE employee_id=1 AND permission_id=11')
  },
  scope:{
   prepare:async()=>sql('UPDATE public.employee_data_scopes SET ended_at=NULL WHERE scope_id=101'),
   revoke:async c=>c.query('UPDATE public.employee_data_scopes SET ended_at=transaction_timestamp() WHERE scope_id=101 AND ended_at IS NULL'),
   mutationWait:'%SELECT s.scope_id::text scope_id%',
   revokeWait:'%UPDATE public.employee_data_scopes%',
   denied:'CAPABILITY_OBJECT_SCOPE_DENIED',
   assertRevoked:async()=>assert.ok((await sql('SELECT ended_at FROM public.employee_data_scopes WHERE scope_id=101')).rows[0].ended_at),
   restore:async()=>sql('UPDATE public.employee_data_scopes SET ended_at=NULL WHERE scope_id=101')
  },
  binding:{
   prepare:async()=>sql('UPDATE public.employee_capability_scope_bindings SET ended_at=NULL WHERE scope_id=101 AND permission_id=11'),
   revoke:async c=>c.query('UPDATE public.employee_capability_scope_bindings SET ended_at=transaction_timestamp() WHERE scope_id=101 AND permission_id=11 AND ended_at IS NULL'),
   mutationWait:'%SELECT s.scope_id::text scope_id%',
   revokeWait:'%UPDATE public.employee_capability_scope_bindings%',
   denied:'CAPABILITY_OBJECT_SCOPE_DENIED',
   assertRevoked:async()=>assert.ok((await sql('SELECT ended_at FROM public.employee_capability_scope_bindings WHERE scope_id=101 AND permission_id=11')).rows[0].ended_at),
   restore:async()=>sql('UPDATE public.employee_capability_scope_bindings SET ended_at=NULL WHERE scope_id=101 AND permission_id=11')
  }
 };
 const spec=specs[kind];await spec.prepare();
 const phoneNumber=concurrentPhone(suffix),before=await customerPhoneCounts();
 let client=null,pending=null,revokePromise=null,gate=null;
 try{
  if(order==='revoke-first'){
   client=await auth.pool.connect();await client.query('BEGIN');await spec.revoke(client);
   pending=service.add({token:employee,customerId:'301',phoneNumber,requestKey:requestKey()});
   await waitForLockWait(spec.mutationWait);
   await client.query('COMMIT');client.release();client=null;
   const out=await pending;assert.equal(out.status,403);assert.equal(out.code,spec.denied);
   assert.deepEqual(await customerPhoneCounts(),before);await spec.assertRevoked();
  }else{
   const entered=deferred(),release=deferred();gate=release;
   const gated=new CustomerOtherPhoneService(auth,{key,beforeAuditInsert:async()=>{entered.resolve();await release.promise}});
   pending=gated.add({token:employee,customerId:'301',phoneNumber,requestKey:requestKey()});
   await entered.promise;
   client=await auth.pool.connect();await client.query('BEGIN');
   revokePromise=spec.revoke(client);
   await waitForLockWait(spec.revokeWait);
   release.resolve();
   const out=await pending;await assertPhoneWriteCommitted(out,phoneNumber);
   await revokePromise;revokePromise=null;
   await client.query('COMMIT');client.release();client=null;
   const after=await customerPhoneCounts();assert.equal(after.facts,before.facts+1);assert.equal(after.audits,before.audits+1);
   await spec.assertRevoked();
  }
 }finally{
  if(gate)gate.resolve();
  if(pending)await pending.catch(()=>{});
  if(revokePromise)await revokePromise.catch(()=>{});
  if(client){try{await client.query('ROLLBACK')}catch{}client.release()}
  await spec.restore();
 }
}
async function runDefaultAllowRace(order,suffix){
 await sql('DELETE FROM public.employee_permission_overrides WHERE employee_id=1 AND permission_id=11');
 const phoneNumber=concurrentPhone(suffix),before=await customerPhoneCounts();
 let client=null,pending=null,revokePromise=null,gate=null;
 try{
  if(order==='revoke-first'){
   client=await auth.pool.connect();await client.query('BEGIN');
   await client.query('SELECT employee_id FROM public.employees WHERE employee_id=1 FOR UPDATE');
   await client.query('SELECT account_id FROM public.pc_login_accounts WHERE account_id=1 FOR UPDATE');
   await client.query("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES(1,11,'deny',transaction_timestamp())");
   pending=service.add({token:employee,customerId:'301',phoneNumber,requestKey:requestKey()});
   await waitForLockWait('%SELECT a.*,CASE WHEN a.principal_kind%');
   await client.query('COMMIT');client.release();client=null;
   const out=await pending;assert.equal(out.status,403);assert.equal(out.code,'CURRENT_PERSONAL_DENY');
   assert.deepEqual(await customerPhoneCounts(),before);
  }else{
   const entered=deferred(),release=deferred();gate=release;
   const gated=new CustomerOtherPhoneService(auth,{key,beforeAuditInsert:async()=>{entered.resolve();await release.promise}});
   pending=gated.add({token:employee,customerId:'301',phoneNumber,requestKey:requestKey()});
   await entered.promise;
   client=await auth.pool.connect();await client.query('BEGIN');
   await client.query('SELECT employee_id FROM public.employees WHERE employee_id=1 FOR UPDATE');
   revokePromise=client.query('SELECT account_id FROM public.pc_login_accounts WHERE account_id=$1::bigint FOR UPDATE',[1]);
   await waitForLockWait('%SELECT account_id FROM public.pc_login_accounts%FOR UPDATE%');
   release.resolve();
   const out=await pending;await assertPhoneWriteCommitted(out,phoneNumber);
   await revokePromise;revokePromise=null;
   await client.query("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES(1,11,'deny',transaction_timestamp())");
   await client.query('COMMIT');client.release();client=null;
   const after=await customerPhoneCounts();assert.equal(after.facts,before.facts+1);assert.equal(after.audits,before.audits+1);
  }
  assert.equal((await sql("SELECT decision FROM public.employee_permission_overrides WHERE employee_id=1 AND permission_id=11")).rows[0]?.decision,'deny');
 }finally{
  if(gate)gate.resolve();
  if(pending)await pending.catch(()=>{});
  if(revokePromise)await revokePromise.catch(()=>{});
  if(client){try{await client.query('ROLLBACK')}catch{}client.release()}
  await sql('DELETE FROM public.employee_permission_overrides WHERE employee_id=1 AND permission_id=11');
 }
}

before(async()=>{
 assertEnvironment();pool=await connect();
 key=Buffer.from(process.env.F03_CUSTOMER_PHONE_KEY_BASE64||'','base64');assert.equal(key.length,32);
 auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret:randomBytes(32),origin:'https://127.0.0.1:4317'});
 const login=await auth.login({login:'employee_test',password:'SyntheticScopeEmployee_2026',source:'customer_phone_business'});
 assert.equal(login.code,'AUTH_OK');assert.equal(login.restricted,false);employee=login.token;
 admin=(await auth.login({login:'admin_test',password:'SyntheticAdmin_1234567',source:'customer_phone_admin_denial'})).token;
 fourS=(await auth.login({login:'four_s_test',password:'SyntheticFourS_123456',source:'customer_phone_four_s_denial'})).token;
 service=new CustomerOtherPhoneService(auth,{key});
});
after(async()=>{await auth?.close();await pool?.end();key?.fill(0)});

test('01 database is sealed PG16 non-superuser with the existing 81-table schema',async()=>{
 const x=(await sql("SELECT current_database() db,current_user usr,current_setting('server_version_num')::int ver,(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) su")).rows[0];
 assert.equal(x.db,'f03_auth_test');assert.equal(x.usr,'f03_ci');assert.equal(x.su,false);assert.ok(x.ver>=160000&&x.ver<170000);
 await verifyScopeDatabase(auth.pool);
});
test('02 initial read returns only masked active phone facts',async()=>{
 const out=await list();assert.equal(out.status,200);assert.equal(out.phones.length,0);
 assert.equal(JSON.stringify(out).includes('phoneNumber'),false);assert.equal(JSON.stringify(out).includes('phone_ciphertext'),false);
});
test('03 invalid customer, malformed phone and unsupported identities fail closed',async()=>{
 assert.equal((await list('0')).status,400);
 assert.equal((await service.add({token:employee,customerId:'301',phoneNumber:'138-1234-5678',requestKey:requestKey()})).status,400);
 assert.equal((await service.add({token:employee,customerId:'301',phoneNumber:phoneA,requestKey:'short'})).status,400);
 assert.equal((await service.list({token:admin,customerId:'301'})).status,403);
 const fourSResult=await service.list({token:fourS,customerId:'301'});
 assert.ok(fourSResult.status===401||fourSResult.status===403);
 assert.equal((await list('302')).status,403);
});
test('04 inactive employee cannot use an existing session',async()=>{
 await sql("UPDATE public.employees SET employment_status='inactive' WHERE employee_id=1");
 const out=await list();assert.ok(out.status===401||out.status===403);
 await sql("UPDATE public.employees SET employment_status='active' WHERE employee_id=1");
 assert.equal((await list()).status,200);
});
test('05 inactive Customer is denied even when a synthetic object binding exists',async()=>{
 const out=await list('303');assert.equal(out.status,403);assert.equal(out.code,'CUSTOMER_NOT_ACTIVE');
});
let first;
test('06 add creates one encrypted fact and a redacted append-only audit in the same transaction',async()=>{
 first=await service.add({token:employee,customerId:'301',phoneNumber:phoneA,requestKey:requestKey()});
 assert.equal(first.status,200);assert.equal(first.active,true);assert.equal(first.maskedPhone,'138****5678');
 const row=(await sql('SELECT phone_fact_id::text,phone_ciphertext,valid_from,ended_at FROM public.customer_phone_facts WHERE phone_fact_id=$1::bigint',[first.phoneFactId])).rows[0];
 assert.ok(Buffer.isBuffer(row.phone_ciphertext));assert.equal(row.ended_at,null);assert.equal(row.phone_ciphertext[0],1);
 assert.equal(row.phone_ciphertext.includes(Buffer.from(phoneA)),false);
 const audit=(await sql("SELECT role_context,before_json,after_json FROM public.audit_events WHERE action='customer.phone.manage.add' AND object_id=$1",[first.phoneFactId])).rows[0];
 assert.ok(audit);assert.equal(JSON.stringify(audit).includes(phoneA),false);assert.equal(JSON.stringify(audit).includes('phone_ciphertext'),false);
 assert.equal(audit.role_context.operation,'add');assert.match(audit.role_context.requestKeySha256,/^[0-9a-f]{64}$/);
});
test('07 list returns the current fact as a mask only, never plaintext or ciphertext',async()=>{
 const out=await list();assert.equal(out.status,200);assert.equal(out.phones.length,1);
 assert.equal(out.phones[0].phoneFactId,first.phoneFactId);assert.equal(out.phones[0].maskedPhone,'138****5678');
 assert.equal(JSON.stringify(out).includes(phoneA),false);assert.equal(JSON.stringify(out).includes('phone_ciphertext'),false);
});
let addKey;
test('08 same idempotency key and same request returns the exact prior result',async()=>{
 addKey=requestKey();
 const created=await service.add({token:employee,customerId:'301',phoneNumber:phoneB,requestKey:addKey});
 const replay=await service.add({token:employee,customerId:'301',phoneNumber:phoneB,requestKey:addKey});
 assert.deepEqual(replay,created);
});
test('09 same idempotency key with a different request returns 409',async()=>{
 const out=await service.add({token:employee,customerId:'301',phoneNumber:phoneC,requestKey:addKey});
 assert.equal(out.status,409);assert.equal(out.code,'IDEMPOTENCY_KEY_CONFLICT');
});
test('10 duplicate active phone is rejected without creating a second fact',async()=>{
 const before=Number((await sql("SELECT count(*) n FROM public.customer_phone_facts WHERE customer_id=301 AND ended_at IS NULL")).rows[0].n);
 const out=await service.add({token:employee,customerId:'301',phoneNumber:phoneA,requestKey:requestKey()});
 assert.equal(out.status,409);assert.equal(out.code,'DUPLICATE_ACTIVE_PHONE');
 const afterCount=Number((await sql("SELECT count(*) n FROM public.customer_phone_facts WHERE customer_id=301 AND ended_at IS NULL")).rows[0].n);
 assert.equal(afterCount,before);
});
let third;
test('11 add another unique number before replacement collision cases',async()=>{
 third=await service.add({token:employee,customerId:'301',phoneNumber:phoneC,requestKey:requestKey()});
 assert.equal(third.status,200);
});
test('12 replace to an already-active number is rejected',async()=>{
 const out=await service.replace({token:employee,customerId:'301',phoneFactId:first.phoneFactId,phoneNumber:phoneC,requestKey:requestKey()});
 assert.equal(out.status,409);assert.equal(out.code,'DUPLICATE_ACTIVE_PHONE');
});
let replaced;
test('13 replace ends old history and inserts a new encrypted current fact atomically',async()=>{
 replaced=await service.replace({token:employee,customerId:'301',phoneFactId:first.phoneFactId,phoneNumber:phoneD,requestKey:requestKey()});
 assert.equal(replaced.status,200);assert.equal(replaced.active,true);assert.equal(replaced.maskedPhone,'136****5678');
 const old=(await sql('SELECT ended_at FROM public.customer_phone_facts WHERE phone_fact_id=$1::bigint',[first.phoneFactId])).rows[0];
 const current=(await sql('SELECT ended_at FROM public.customer_phone_facts WHERE phone_fact_id=$1::bigint',[replaced.phoneFactId])).rows[0];
 assert.ok(old.ended_at);assert.equal(current.ended_at,null);
 const events=Number((await sql("SELECT count(*) n FROM public.audit_events WHERE action='customer.phone.manage.replace' AND role_context->>'customerId'='301'")).rows[0].n);
 assert.ok(events>=1);
});
test('14 replacing a fact with its unchanged number is rejected',async()=>{
 const out=await service.replace({token:employee,customerId:'301',phoneFactId:replaced.phoneFactId,phoneNumber:phoneD,requestKey:requestKey()});
 assert.equal(out.status,409);assert.equal(out.code,'PHONE_UNCHANGED');
});
let ended;
test('15 end marks the fact inactive and retains its historical row',async()=>{
 ended=await service.end({token:employee,customerId:'301',phoneFactId:third.phoneFactId,requestKey:requestKey()});
 assert.equal(ended.status,200);assert.equal(ended.active,false);
 const row=(await sql('SELECT ended_at FROM public.customer_phone_facts WHERE phone_fact_id=$1::bigint',[third.phoneFactId])).rows[0];
 assert.ok(row.ended_at);
});
test('16 end idempotency returns the same result and never physically deletes history',async()=>{
 const other=await service.add({token:employee,customerId:'301',phoneNumber:phoneE,requestKey:requestKey()});
 assert.equal(other.status,200);
 const endKey=requestKey();
 const firstEnd=await service.end({token:employee,customerId:'301',phoneFactId:other.phoneFactId,requestKey:endKey});
 const replay=await service.end({token:employee,customerId:'301',phoneFactId:other.phoneFactId,requestKey:endKey});
 assert.deepEqual(replay,firstEnd);
 assert.equal(Number((await sql('SELECT count(*) n FROM public.customer_phone_facts WHERE phone_fact_id=$1::bigint',[other.phoneFactId])).rows[0].n),1);
});
test('17 ended and cross-Customer facts cannot be ended',async()=>{
 const out=await service.end({token:employee,customerId:'301',phoneFactId:third.phoneFactId,requestKey:requestKey()});
 assert.equal(out.status,404);
 const cross=await service.end({token:employee,customerId:'302',phoneFactId:replaced.phoneFactId,requestKey:requestKey()});
 assert.equal(cross.status,403);
});
test('18 personal deny takes precedence over role default allow',async()=>{
 await sql("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES(1,11,'deny',transaction_timestamp()) ON CONFLICT(employee_id,permission_id) DO UPDATE SET decision='deny',changed_at=transaction_timestamp()");
 const out=await list();assert.equal(out.status,403);assert.equal(out.code,'CURRENT_PERSONAL_DENY');
 await sql('DELETE FROM public.employee_permission_overrides WHERE employee_id=1 AND permission_id=11');
 assert.equal((await list()).status,200);
});
test('19 ended explicit object binding denies even with the old scope row retained',async()=>{
 await sql("UPDATE public.employee_capability_scope_bindings SET ended_at=transaction_timestamp() WHERE employee_id=1 AND permission_id=11 AND scope_id=101");
 const out=await list();assert.equal(out.status,403);assert.equal(out.code,'CAPABILITY_OBJECT_SCOPE_DENIED');
 await sql("UPDATE public.employee_capability_scope_bindings SET ended_at=NULL WHERE employee_id=1 AND permission_id=11 AND scope_id=101");
 assert.equal((await list()).status,200);
});
test('20 a future-dated capability binding is not considered current',async()=>{
 await sql("UPDATE public.employee_capability_scope_bindings SET granted_at=transaction_timestamp()+interval '1 hour' WHERE employee_id=1 AND permission_id=11 AND scope_id=101");
 const out=await list();assert.equal(out.status,403);assert.equal(out.code,'CAPABILITY_OBJECT_SCOPE_DENIED');
 await sql("UPDATE public.employee_capability_scope_bindings SET granted_at=transaction_timestamp()-interval '1 minute' WHERE employee_id=1 AND permission_id=11 AND scope_id=101");
 assert.equal((await list()).status,200);
});
test('21 audit insertion fault rolls back both new phone fact and all audit rows',async()=>{
 const beforeFacts=Number((await sql("SELECT count(*) n FROM public.customer_phone_facts WHERE customer_id=301")).rows[0].n);
 const beforeAudit=Number((await sql("SELECT count(*) n FROM public.audit_events WHERE action='customer.phone.manage.add' AND role_context->>'customerId'='301'")).rows[0].n);
 const broken=new CustomerOtherPhoneService(auth,{key,beforeAuditInsert:async()=>{throw Error('INJECTED_AUDIT_INSERT_FAILURE')}});
 const out=await broken.add({token:employee,customerId:'301',phoneNumber:phoneF,requestKey:requestKey()});
 assert.equal(out.status,503);
 assert.equal(Number((await sql("SELECT count(*) n FROM public.customer_phone_facts WHERE customer_id=301")).rows[0].n),beforeFacts);
 assert.equal(Number((await sql("SELECT count(*) n FROM public.audit_events WHERE action='customer.phone.manage.add' AND role_context->>'customerId'='301'")).rows[0].n),beforeAudit);
});
test('22 simultaneous requests with the same idempotency key create one fact and one audit',async()=>{
 const k=requestKey(),keyHash=createHash('sha256').update(k).digest('hex');
 const beforeFacts=Number((await sql("SELECT count(*) n FROM public.customer_phone_facts WHERE customer_id=301 AND ended_at IS NULL")).rows[0].n);
 const beforeAudit=Number((await sql("SELECT count(*) n FROM public.audit_events WHERE action='customer.phone.manage.add' AND role_context->>'customerId'='301' AND role_context->>'requestKeySha256'=$1",[keyHash])).rows[0].n);
 const results=await Promise.all([
  service.add({token:employee,customerId:'301',phoneNumber:'13312345678',requestKey:k}),
  service.add({token:employee,customerId:'301',phoneNumber:'13312345678',requestKey:k})
 ]);
 assert.deepEqual(results[0],results[1]);assert.equal(results[0].status,200);
 const afterFacts=Number((await sql("SELECT count(*) n FROM public.customer_phone_facts WHERE customer_id=301 AND ended_at IS NULL")).rows[0].n);
 const afterAudit=Number((await sql("SELECT count(*) n FROM public.audit_events WHERE action='customer.phone.manage.add' AND role_context->>'customerId'='301' AND role_context->>'requestKeySha256'=$1",[keyHash])).rows[0].n);
 assert.equal(afterFacts,beforeFacts+1);assert.equal(afterAudit,beforeAudit+1);
});

test('23 personal override deny commits first and blocks phone mutation with no side effects',async()=>runFactRace('override','revoke-first',1));
test('24 phone mutation commits first and personal deny waits then takes effect',async()=>runFactRace('override','write-first',2));
test('25 Scope end commits first and blocks phone mutation with no side effects',async()=>runFactRace('scope','revoke-first',3));
test('26 phone mutation commits first and Scope end waits then takes effect',async()=>runFactRace('scope','write-first',4));
test('27 Capability-Scope Binding end commits first and blocks phone mutation',async()=>runFactRace('binding','revoke-first',5));
test('28 phone mutation commits first and Binding end waits then takes effect',async()=>runFactRace('binding','write-first',6));
test('24 failed replacement audit rolls back ending the old fact and inserting its replacement',async()=>{
 const before=Number((await sql('SELECT count(*) n FROM public.customer_phone_facts WHERE customer_id=301')).rows[0].n);
 const broken=new CustomerOtherPhoneService(auth,{key,beforeAuditInsert:async()=>{throw Error('INJECTED_AUDIT_INSERT_FAILURE')}});
 const out=await broken.replace({token:employee,customerId:'301',phoneFactId:replaced.phoneFactId,phoneNumber:'13112345678',requestKey:requestKey()});
 assert.equal(out.status,503);
 const old=(await sql('SELECT ended_at FROM public.customer_phone_facts WHERE phone_fact_id=$1::bigint',[replaced.phoneFactId])).rows[0];
 assert.equal(old.ended_at,null);
 assert.equal(Number((await sql('SELECT count(*) n FROM public.customer_phone_facts WHERE customer_id=301')).rows[0].n),before);
});

test('30 an already-ended explicit Scope denies the employee even when its Binding row remains',async()=>{
 await sql("UPDATE public.employee_data_scopes SET ended_at=transaction_timestamp() WHERE scope_id=101");
 try{
  const out=await list();assert.equal(out.status,403);assert.equal(out.code,'CAPABILITY_OBJECT_SCOPE_DENIED');
 }finally{await sql('UPDATE public.employee_data_scopes SET ended_at=NULL WHERE scope_id=101')}
 assert.equal((await list()).status,200);
});
test('31 replacement INSERT NOT NULL failure rolls back the prior ended_at update',async()=>{
 const before=await customerPhoneCounts();
 const prior=(await sql('SELECT ended_at FROM public.customer_phone_facts WHERE phone_fact_id=$1::bigint',[replaced.phoneFactId])).rows[0];
 assert.equal(prior.ended_at,null);
 const broken=new CustomerOtherPhoneService(auth,{key,forceReplacementInsertFailure:true});
 const out=await broken.replace({token:employee,customerId:'301',phoneFactId:replaced.phoneFactId,phoneNumber:concurrentPhone(7),requestKey:requestKey()});
 assert.equal(out.status,503);assert.equal(out.code,'CUSTOMER_PHONE_TRANSACTION_UNAVAILABLE');
 assert.equal(JSON.stringify(out).includes(concurrentPhone(7)),false);
 const after=await customerPhoneCounts();
 assert.deepEqual(after,before);
 assert.equal((await sql('SELECT ended_at FROM public.customer_phone_facts WHERE phone_fact_id=$1::bigint',[replaced.phoneFactId])).rows[0].ended_at,null);
});
test('32 force-password-change sessions cannot read Customer phones and can safely reauthenticate',async()=>{
 const temporary='SyntheticReset_'+randomBytes(12).toString('hex')+'Aa1';
 const reset=await auth.govern({actorToken:admin,targetId:1,action:'reset',temporaryPassword:temporary});
 assert.equal(reset.code,'GOVERNANCE_OK');
 const restricted=await auth.login({login:'employee_test',password:temporary,source:'customer_phone_force_change'});
 assert.equal(restricted.code,'AUTH_OK');assert.equal(restricted.restricted,true);
 const denied=await service.list({token:restricted.token,customerId:'301'});
 assert.equal(denied.status,401);
 const changed=await auth.change({token:restricted.token,csrf:auth.csrfFor(restricted.token),oldPassword:temporary,newPassword:'SyntheticScopeEmployee_2026'});
 assert.equal(changed.code,'PASSWORD_CHANGED_REAUTH_REQUIRED');
 const login=await auth.login({login:'employee_test',password:'SyntheticScopeEmployee_2026',source:'customer_phone_force_change_restored'});
 assert.equal(login.code,'AUTH_OK');assert.equal(login.restricted,false);employee=login.token;
});
test('33 disabled credential cannot use a previously issued Customer phone session',async()=>{
 const disabled=await auth.govern({actorToken:admin,targetId:1,action:'disable'});
 assert.equal(disabled.code,'GOVERNANCE_OK');
 const denied=await service.list({token:employee,customerId:'301'});assert.equal(denied.status,401);
 const enabled=await auth.govern({actorToken:admin,targetId:1,action:'enable'});
 assert.equal(enabled.code,'GOVERNANCE_OK');
 const login=await auth.login({login:'employee_test',password:'SyntheticScopeEmployee_2026',source:'customer_phone_credential_restored'});
 assert.equal(login.code,'AUTH_OK');assert.equal(login.restricted,false);employee=login.token;
});
test('34 unknown employee role is rejected without broadening the formal role allowlist',async()=>{
 const original=(await sql("SELECT role_code FROM public.roles WHERE role_id=1")).rows[0].role_code;
 assert.equal(original,'sales');
 try{
  await sql("UPDATE public.roles SET role_code='unknown_test' WHERE role_id=1");
  const out=await list();assert.equal(out.status,403);assert.equal(out.code,'CURRENT_ROLE_DENIED');
 }finally{await sql("UPDATE public.roles SET role_code='sales' WHERE role_id=1")}
 assert.equal((await list()).status,200);
});
test('35 default-allow with no personal override: deny transaction wins before phone mutation',async()=>runDefaultAllowRace('revoke-first',8));
test('36 default-allow with no personal override: phone write finishes before employee/account-ordered deny',async()=>runDefaultAllowRace('write-first',9));
test('37 actual F03 PublisherPhoneAdminService revoke serializes with phone write without deadlock',async()=>{
 const phoneNumber=concurrentPhone(10),before=await customerPhoneCounts();
 const entered=deferred(),release=deferred();
 const gated=new CustomerOtherPhoneService(auth,{key,beforeAuditInsert:async()=>{entered.resolve();await release.promise}});
 let phonePromise=null,adminPromise=null,scopeId=null,privateSchemaCreated=false;
 try{
  phonePromise=gated.add({token:employee,customerId:'301',phoneNumber,requestKey:requestKey()});
  await entered.promise;
  // Reuse the already-approved F03 CI-only permission-admin schema only while this request is
  // paused after its scope preflight. It is removed in finally; no production or public DDL occurs.
  const schemaSql=await readFile(new URL('../../publisher-phone-staff-admin/schema.sql',import.meta.url),'utf8');
  privateSchemaCreated=true;await sql(schemaSql);
  await sql("INSERT INTO public.permissions(permission_id,permission_code) VALUES(13,'publisher.phone.sensitive')");
  await sql("INSERT INTO public.role_permission_defaults(role_id,permission_id,enabled,changed_at) SELECT role_id,13,false,transaction_timestamp() FROM public.roles");
  await sql("SELECT setval(pg_get_serial_sequence('public.employee_data_scopes','scope_id'),GREATEST(COALESCE((SELECT max(scope_id) FROM public.employee_data_scopes),1),1),true)");
  const target=(await sql("SELECT e.employment_status,e.main_role_id::text main_role_id,e.store_id::text store_id,r.role_code FROM public.employees e JOIN public.roles r ON r.role_id=e.main_role_id WHERE e.employee_id=1")).rows[0];
  assert.equal(target.employment_status,'active');assert.equal(target.role_code,'sales');
  const watermark=(await sql("SELECT COALESCE(max(audit_id),0)::text watermark FROM public.audit_events WHERE object_kind='employee' AND object_id='1'")).rows[0].watermark;
  const scope=(await sql("INSERT INTO public.employee_data_scopes(employee_id,scope_kind,scope_reference_id,ended_at) VALUES(1,'publisher_phone_special',1,NULL) RETURNING scope_id::text scope_id")).rows[0];
  scopeId=scope.scope_id;
  await sql("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at,ended_at) VALUES(1,13,$1::bigint,transaction_timestamp()-interval '1 minute',NULL)",[scopeId]);
  await sql("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES(1,13,'allow',transaction_timestamp()) ON CONFLICT(employee_id,permission_id) DO UPDATE SET decision='allow',changed_at=transaction_timestamp()");
  await sql(
   "INSERT INTO f03_publisher_phone_admin_test.employee_mode(employee_id,scope_mode,enabled,previous_decision,previous_decision_captured,lifecycle_audit_watermark,granted_employment_status,granted_role_code,granted_main_role_id,granted_store_id,lifecycle_invalidated_at,lifecycle_invalidated_audit_id,lifecycle_invalidated_action,lifecycle_invalidated_reason,version,updated_by_system_admin_id,updated_at) "+
   "VALUES(1,'LOCKED_ONLY',true,NULL,true,$1::bigint,'active','sales',$2::bigint,$3::bigint,NULL,NULL,NULL,NULL,1,9,transaction_timestamp())",
   [watermark,target.main_role_id,target.store_id]);
  const permissionAdmin=new PublisherPhoneAdminService(auth);
  adminPromise=permissionAdmin.change({token:admin,employeeId:'1',method:'DELETE',input:{expectedVersion:1,requestKey:requestKey()}});
  await waitForLockWait('%SELECT e.employee_id::text AS employee_id%');
  release.resolve();
  const phoneOut=await phonePromise;await assertPhoneWriteCommitted(phoneOut,phoneNumber);
  const revokeOut=await adminPromise;
  assert.equal(revokeOut.status,200);assert.equal(revokeOut.code,'PHONE_ADMIN_UPDATED');assert.equal(revokeOut.enabled,false);
  const after=await customerPhoneCounts();assert.equal(after.facts,before.facts+1);assert.equal(after.audits,before.audits+1);
  const mode=(await sql('SELECT enabled,version FROM f03_publisher_phone_admin_test.employee_mode WHERE employee_id=1')).rows[0];
  assert.equal(mode.enabled,false);assert.equal(Number(mode.version),2);
  assert.ok((await sql('SELECT ended_at FROM public.employee_data_scopes WHERE scope_id=$1::bigint',[scopeId])).rows[0].ended_at);
  assert.ok((await sql('SELECT ended_at FROM public.employee_capability_scope_bindings WHERE scope_id=$1::bigint AND permission_id=13',[scopeId])).rows[0].ended_at);
  assert.equal((await sql('SELECT count(*)::int n FROM public.employee_permission_overrides WHERE employee_id=1 AND permission_id=13')).rows[0].n,0);
  const audit=(await sql("SELECT actor_kind,actor_id FROM public.audit_events WHERE action='publisher.phone.scope.revoke' AND object_id='1' ORDER BY audit_id DESC LIMIT 1")).rows[0];
  assert.equal(audit.actor_kind,'system_admin');assert.equal(audit.actor_id,'9');
 }finally{
  release.resolve();
  if(phonePromise)await phonePromise.catch(()=>{});
  if(adminPromise)await adminPromise.catch(()=>{});
  if(privateSchemaCreated)await sql('DROP SCHEMA IF EXISTS f03_publisher_phone_admin_test CASCADE').catch(()=>{});
 }
});
test('38 public schema and SG01 physical fingerprint remain unchanged after concurrency tests',async()=>{
 await verifyScopeDatabase(auth.pool);
 const manifest=JSON.parse(await readFile(new URL('../../runtime-scope/000003.manifest.json',import.meta.url),'utf8'));
 const c=await pool.connect();
 try{const current=await getPublicStructure(c);assert.equal(current.sha256,manifest.structure_sha256)}finally{c.release()}
 const namespaces=Number((await sql("SELECT count(*)::int n FROM pg_namespace WHERE nspname NOT IN ('pg_catalog','information_schema','public') AND nspname NOT LIKE 'pg_toast%' AND nspname NOT LIKE 'pg_temp%'")).rows[0].n);
 assert.equal(namespaces,0);
});
