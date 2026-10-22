import assert from 'node:assert/strict';
import {before,after,test} from 'node:test';
import {randomBytes,randomUUID,createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {getPublicStructure} from '../../../f02-1/schema-integrity.mjs';
import {verifyScopeDatabase} from '../../runtime-scope/readiness.mjs';
import {connect,assertEnvironment} from '../environment.mjs';
import {CustomerOtherPhoneService} from '../../../src/f03-customer-other-phone-service.mjs';

let auth,pool,service,employee,admin,fourS,key;
const requestKey=()=>randomUUID().replaceAll('-','');
const phoneA='13812345678',phoneB='13912345678',phoneC='13712345678',phoneD='13612345678',phoneE='13512345678',phoneF='13412345678';
const sql=(statement,values=[])=>pool.query(statement,values);
const list=(customerId='301',token=employee)=>service.list({token,customerId});
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
test('23 a concurrent scope revocation that commits first blocks the phone mutation',async()=>{
 const revoker=await auth.pool.connect();
 try{
  await revoker.query('BEGIN');
  await revoker.query("UPDATE public.employee_capability_scope_bindings SET ended_at=transaction_timestamp() WHERE employee_id=1 AND permission_id=11 AND scope_id=101");
  const pending=service.add({token:employee,customerId:'301',phoneNumber:'13212345678',requestKey:requestKey()});
  await revoker.query('COMMIT');
  const out=await pending;assert.equal(out.status,403);assert.equal(out.code,'CAPABILITY_OBJECT_SCOPE_DENIED');
 }finally{
  try{await revoker.query('ROLLBACK')}catch{}
  revoker.release();
  await sql("UPDATE public.employee_capability_scope_bindings SET ended_at=NULL WHERE employee_id=1 AND permission_id=11 AND scope_id=101");
 }
});
test('24 failed replacement audit rolls back ending the old fact and inserting its replacement',async()=>{
 const before=Number((await sql('SELECT count(*) n FROM public.customer_phone_facts WHERE customer_id=301')).rows[0].n);
 const broken=new CustomerOtherPhoneService(auth,{key,beforeAuditInsert:async()=>{throw Error('INJECTED_AUDIT_INSERT_FAILURE')}});
 const out=await broken.replace({token:employee,customerId:'301',phoneFactId:replaced.phoneFactId,phoneNumber:'13112345678',requestKey:requestKey()});
 assert.equal(out.status,503);
 const old=(await sql('SELECT ended_at FROM public.customer_phone_facts WHERE phone_fact_id=$1::bigint',[replaced.phoneFactId])).rows[0];
 assert.equal(old.ended_at,null);
 assert.equal(Number((await sql('SELECT count(*) n FROM public.customer_phone_facts WHERE customer_id=301')).rows[0].n),before);
});
test('25 the F02/F03 public schema fingerprint remains unchanged',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../../runtime-scope/000003.manifest.json',import.meta.url),'utf8'));
 const c=await pool.connect();
 try{const current=await getPublicStructure(c);assert.equal(current.sha256,manifest.structure_sha256)}finally{c.release()}
});
