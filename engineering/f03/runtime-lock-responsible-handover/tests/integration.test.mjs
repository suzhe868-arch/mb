// F03-2-2L: disposable PG16 real integration tests, never production.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect,verify,rollback} from '../migration.mjs';
import {prepareLockResponsibleHandover as prepare,commitLockResponsibleHandover as commit,retryLockResponsibleHandover as retry,readLockResponsibleHandoverReceipt as read} from '../service.mjs';
const db=await connect(),secret=randomBytes(32);
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin:'https://127.0.0.1:48981'});
const creds={manager:['http_test','SyntheticHttps_1234567'],head:['race_test','SyntheticRace_1234567'],four:['four_s_test','SyntheticFourS_123456'],ordinary:['limit_test','SyntheticLimit_1234567'],admin:['admin_test','SyntheticAdmin_1234567']};
const login=async type=>{const [username,password]=creds[type];const r=await auth.login({login:username,password,source:'l_'+type+'_'+Math.random()});assert.equal(r.code,'AUTH_OK');return r};
const req=(n=1,to=4,key='l-ci-lock-request-0001')=>({batchId:8400+n,itemId:10400+n,fromEmployeeId:7,recipientEmployeeId:to,teamId:901,clientRequestKey:key});
const owner=async n=>String((await db.query('SELECT responsible_employee_id FROM public.locks WHERE lock_id=$1',[18000+n])).rows[0].responsible_employee_id);
let manager,head,ordinary,four,admin,restricted;
test.before(async()=>{
 assert.equal((await verify(db)).verified,true);
 const first=await login('manager');assert.equal(first.restricted,true);restricted=first.token;
 assert.equal((await auth.change({token:first.token,csrf:first.csrf,oldPassword:creds.manager[1],newPassword:'Synthetic2L_Lock_2026'})).code,'PASSWORD_CHANGED_REAUTH_REQUIRED');
 creds.manager[1]='Synthetic2L_Lock_2026';
 manager=(await login('manager')).token;head=(await login('head')).token;ordinary=(await login('ordinary')).token;four=(await login('four')).token;admin=(await login('admin')).token;
});
test.after(async()=>{await auth.close();await db.end();secret.fill(0)});
test('L01 new exact 93-table isolated PG16 catalog',async()=>{assert.equal((await verify(db)).verified,true);assert.equal((await db.query("SELECT count(*)::int n FROM pg_tables WHERE schemaname='public'")).rows[0].n,93)});
test('L02 independent manager privilege blocks ordinary, 4S, admin and restricted',async()=>{
 for(const token of [ordinary,four,admin,restricted,null])assert.notEqual((await commit(auth,token,req())).code,'L04_LOCK_TRANSFERRED');
});
test('L03 expired without Deposit and with Deposit never auto release or reassign',async()=>{
 assert.equal((await commit(auth,manager,req(4,4,'l-expired-no-deposit-0004'))).code,'L03_EXPIRED_WITHOUT_DEPOSIT_DEFER_DENY');
 assert.equal((await commit(auth,manager,req(5,4,'l-expired-with-deposit-0005'))).code,'L03_EXPIRED_WITH_DEPOSIT_DEFER_DENY');
 assert.equal(await owner(4),'7');assert.equal(await owner(5),'7');
});
test('L04 single Lock CAS, exact request retry and immutable real auditor receipt',async()=>{
 const p=req(1,4,'l-real-lock-transfer-0001');
 assert.equal((await prepare(auth,manager,p)).code,'L01_PREPARED_READ_ONLY');
 assert.equal((await commit(auth,manager,p)).code,'L04_LOCK_TRANSFERRED');
 assert.equal(await owner(1),'4');
 assert.equal((await retry(auth,manager,p)).code,'L05_IDEMPOTENT_RECEIPT');
 assert.equal((await read(auth,manager,{batchId:p.batchId,itemId:p.itemId,teamId:901})).code,'L05_RECEIPT_READ_ONLY');
});
test('L06 append-only record refuses mutation and migration rollback after use',async()=>{
 await assert.rejects(()=>db.query("DELETE FROM public.lock_responsible_handover_receipts WHERE item_id=10401"));
 await assert.rejects(()=>rollback(db),/L_RECEIPT_USED_ROLLBACK_DENY/);
});
