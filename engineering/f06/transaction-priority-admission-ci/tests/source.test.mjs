import {test} from 'node:test';
import assert from 'node:assert/strict';
import {connect,verify,checksum,gate} from '../migration.mjs';
import {requestSyntheticNewPriorityCI,productionIssuerDeny,UPSTREAM_GAP} from '../service.mjs';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
const db=await connect(),q=(sql,args=[])=>db.query(sql,args).then(r=>r.rows);
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret:Buffer.alloc(32,61),origin:'https://127.0.0.1:49026'});
const peer=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret:Buffer.alloc(32,61),origin:'https://127.0.0.1:49026'});
const mk=x=>'f06-5c-pg16-'+x+'-'+process.env.GITHUB_RUN_ID;
let token;
const args={vehicleId:86181104,listingCycleId:86182104,customerId:86180101,teamId:901,eventKey:mk('base')};
const attempt=(v={},a=auth,t='forged')=>requestSyntheticNewPriorityCI(a,t,{...args,...v});
test.before(async()=>{
 assert.equal((await verify(db)).verified,true);
 const login=await auth.login({login:'employee_test',password:'SyntheticF04_3_CurrentProof_2026',source:'f06-5c-signed-source'});
 assert.equal(login.code,'AUTH_OK',JSON.stringify(login));token=login.token;
});
test.after(async()=>{await auth.close();await peer.close();await db.end()});
test('5C-S01 新旧Sidecar父签认证',async()=>assert.equal((await verify(db)).verified,true));
test('5C-S02 sha256封印',()=>assert.match(checksum,/^[0-9a-f]{64}$/));
test('5C-S03 真Push环境门禁',()=>assert.doesNotThrow(gate));
test('5C-S04 PG16非特权账户',async()=>assert.equal((await q('SELECT current_user u'))[0].u,'f03_ci'));
test('5C-S05 PG16版本',async()=>{const x=(await q("SELECT current_setting('server_version_num')::int v"))[0];assert.ok(x.v>=160000&&x.v<170000)});
test('5C-S06 非superuser',async()=>assert.equal((await q("SELECT rolsuper r FROM pg_roles WHERE rolname=current_user"))[0].r,false));
test('5C-S07 非createdb',async()=>assert.equal((await q("SELECT rolcreatedb r FROM pg_roles WHERE rolname=current_user"))[0].r,false));
test('5C-S08 签名目录完整',async()=>{const x=await verify(db);assert.match(x.catalogSHA,/^[0-9a-f]{64}$/);assert.ok(x.parentSHA)});
test('5C-S09 24原迁移',async()=>assert.equal((await q('SELECT count(*)::int n FROM public.f03_schema_migrations'))[0].n,24));
test('5C-S10 5B安全来源存在',async()=>assert.equal((await q("SELECT to_regclass('f06_5b_ci.guard_events')::text n"))[0].n,'f06_5b_ci.guard_events'));
test('5C-S11 3B交易来源存在',async()=>assert.equal((await q("SELECT to_regclass('f06_3b_ci.transaction_origins')::text n"))[0].n,'f06_3b_ci.transaction_origins'));
test('5C-S12 独立签名唯一',async()=>assert.equal((await q('SELECT count(*)::int n FROM f06_5c_ci.attestation'))[0].n,1));
test('5C-S13 生产签发不存在',()=>assert.equal(productionIssuerDeny().allowed,false));
test('5C-S14 父Priority只读可见',async()=>assert.ok((await q("SELECT to_regclass('public.f05_8_priority_ci')::text n"))[0].n));
test('5C-S15 签名不可UPDATE',async()=>await assert.rejects(q("UPDATE f06_5c_ci.attestation SET production_priority_issuer='UNWIRED'"),/F06_5C_APPEND_ONLY_HISTORY/));
test('5C-S16 签名不可DELETE',async()=>await assert.rejects(q('DELETE FROM f06_5c_ci.attestation'),/F06_5C_APPEND_ONLY_HISTORY/));
const invalid=[
 ['vehicle零',{vehicleId:0}],['vehicle负数',{vehicleId:-1}],['vehicle非整数',{vehicleId:1.1}],
 ['listing_cycle零',{listingCycleId:0}],['customer零',{customerId:0}],['team零',{teamId:0}],
 ['Key过短',{eventKey:'a'}],['Key SQL注入',{eventKey:"' OR 1=1; --"}],['Key超长',{eventKey:'a'.repeat(161)}]
];
invalid.forEach(([name,p],i)=>test('5C-S'+String(i+17).padStart(2,'0')+' '+name+'拒绝',async()=>assert.equal((await attempt(p)).code,'F06_5C_INVALID_ARGUMENTS')));
test('5C-S26 缺少会话对象',async()=>assert.equal((await attempt({},null)).code,'F06_5C_SIGNED_SESSION_REQUIRED'));
test('5C-S27 假Token拒绝',async()=>assert.equal((await attempt()).allowed,false));
test('5C-S28 第二PG后端假Token拒绝',async()=>assert.equal((await attempt({},peer)).allowed,false));
test('5C-S29 两个不同PG真实进程',async()=>{
 const a=(await db.query('SELECT pg_backend_pid() pid')).rows[0].pid;
 const b=(await peer.pool.query('SELECT pg_backend_pid() pid')).rows[0].pid;assert.notEqual(a,b);
});
test('5C-S30 真实退款表保留',async()=>assert.ok((await q("SELECT to_regclass('public.refund_payments')::text n"))[0].n));
test('5C-S31 生产Issuer状态UNWIRED',async()=>assert.equal((await q('SELECT production_priority_issuer FROM f06_5c_ci.attestation'))[0].production_priority_issuer,'UNWIRED'));
test('5C-S32 两独立PG后端全部拒绝无权限新建',async()=>{const r=await Promise.all([attempt({eventKey:mk('race-a')}),attempt({eventKey:mk('race-b')},peer)]);assert.equal(r.filter(x=>x.allowed).length,0)});
test('5C-S33 拒绝不新增Priority',async()=>{const n=(await q('SELECT count(*)::int n FROM public.f05_8_priority_ci'))[0].n;await attempt({eventKey:mk('no-write')});assert.equal((await q('SELECT count(*)::int n FROM public.f05_8_priority_ci'))[0].n,n)});
test('5C-S34 拒绝不新增Transaction',async()=>{const n=(await q('SELECT count(*)::int n FROM f06_3b_ci.transaction_origins'))[0].n;await attempt({eventKey:mk('no-tx')});assert.equal((await q('SELECT count(*)::int n FROM f06_3b_ci.transaction_origins'))[0].n,n)});
test('5C-S35 拒绝不新增Guard事实',async()=>{const n=(await q('SELECT count(*)::int n FROM f06_5b_ci.guard_events'))[0].n;await attempt({eventKey:mk('no-guard')});assert.equal((await q('SELECT count(*)::int n FROM f06_5b_ci.guard_events'))[0].n,n)});
test('5C-S36 上游不可原子签发明确FailClosed',async()=>{assert.equal(UPSTREAM_GAP,'UPSTREAM_PRIORITY_ADMISSION_ATOMIC_SOURCE_GAP');assert.equal((await attempt({eventKey:mk('gap')})).allowed,false)});

test('5C-S37 真F03员工Session令牌签发（非伪造）',()=>assert.match(token,/^[A-Za-z0-9_-]{43}$/));
test('5C-S38 5B父安全转换留下真实in_progress交易',async()=>{
 const x=(await q("SELECT t.transaction_id FROM public.transactions t JOIN f06_5b_ci.guard_events g ON g.transaction_id=t.transaction_id WHERE t.vehicle_id=$1 AND t.status='in_progress'",[args.vehicleId]));
 assert.ok(x.length>=1,'原5B测试必须真实提交交易及其签名');
});
test('5C-S39 真Session在已成交占用车不得创建新Priority',async()=>{
 const before=(await q('SELECT count(*)::int n FROM public.f05_8_priority_ci'))[0].n;
 const out=await attempt({eventKey:mk('real-transaction-deny')},auth,token);
 assert.equal(out.allowed,false,JSON.stringify(out));
 assert.notEqual(out.code,'F06_5C_SIGNED_SESSION_DENIED');
 assert.equal((await q('SELECT count(*)::int n FROM public.f05_8_priority_ci'))[0].n,before);
});
test('5C-S40 父5B真实交易与旧3B Source绑定',async()=>{
 const rows=await q("SELECT t.transaction_id, t.source_lock_id,o.source_lock_id old_lock,g.source_lock_id guarded_lock FROM public.transactions t JOIN f06_3b_ci.transaction_origins o USING(transaction_id) JOIN f06_5b_ci.guard_events g USING(transaction_id) WHERE t.vehicle_id=$1 AND t.status='in_progress'",[args.vehicleId]);
 assert.ok(rows.length>0);for(const x of rows)assert.equal(Number(x.old_lock),Number(x.guarded_lock));
});
test('5C-S41 真员工Session不允许过期listing cycle重放',async()=>{
 const x=await attempt({listingCycleId:999999991,eventKey:mk('real-stale-cycle')},auth,token);
 assert.equal(x.allowed,false,JSON.stringify(x));
});
test('5C-S42 同一签名员工跨独立Backend重复争用不得产生两个Priority',async()=>{
 const before=(await q('SELECT count(*)::int n FROM public.f05_8_priority_ci'))[0].n;
 const results=await Promise.all([attempt({eventKey:mk('real-race-1')},auth,token),attempt({eventKey:mk('real-race-2')},peer,token)]);
 assert.ok(results.every(x=>x.allowed===false),JSON.stringify(results));
 assert.equal((await q('SELECT count(*)::int n FROM public.f05_8_priority_ci'))[0].n,before);
});
test('5C-S43 真实会话源受到员工当前状态撤销约束',async()=>{
 const original=(await q("SELECT employment_status FROM public.employees WHERE employee_id=1"))[0].employment_status;
 await q("UPDATE public.employees SET employment_status='inactive' WHERE employee_id=1");
 try{const r=await attempt({eventKey:mk('employment-revoked')},auth,token);assert.equal(r.allowed,false,JSON.stringify(r))}
 finally{await q('UPDATE public.employees SET employment_status=$1 WHERE employee_id=1',[original])}
});
test('5C-S44 真实客户失活后不可签Priority',async()=>{
 const original=(await q('SELECT account_status FROM public.customers WHERE customer_id=$1',[args.customerId]))[0].account_status;
 await q("UPDATE public.customers SET account_status='inactive' WHERE customer_id=$1",[args.customerId]);
 try{const r=await attempt({eventKey:mk('customer-inactive')},auth,token);assert.equal(r.allowed,false,JSON.stringify(r))}
 finally{await q('UPDATE public.customers SET account_status=$2 WHERE customer_id=$1',[args.customerId,original])}
});
test('5C-S45 真PG16已签交易阻断后保留原Lock历史',async()=>{
 const x=await q('SELECT lock_status,end_reason FROM public.locks WHERE vehicle_id=$1 ORDER BY lock_id DESC LIMIT 1',[args.vehicleId]);
 assert.ok(x.length);assert.equal(x[0].lock_status,'released');assert.equal(x[0].end_reason,'converted_to_transaction');
});
test('5C-S46 对同Vehicle真实行锁争用，失败无半写',async()=>{
 const lock=await connect();
 try{
  await lock.query('BEGIN');
  await lock.query('SELECT vehicle_id FROM public.vehicles WHERE vehicle_id=$1 FOR UPDATE',[args.vehicleId]);
  const before=(await q('SELECT count(*)::int n FROM public.f05_8_priority_ci'))[0].n;
  const x=await attempt({eventKey:mk('lock-timeout')},peer,token);
  assert.equal(x.allowed,false,JSON.stringify(x));
  assert.equal((await q('SELECT count(*)::int n FROM public.f05_8_priority_ci'))[0].n,before);
 }finally{await lock.query('ROLLBACK');await lock.end()}
});
test('5C-S47 真实旧3B不安全Transaction不能伪装为5B安全发行',async()=>{
 const x=await q("SELECT t.transaction_id FROM public.transactions t JOIN f06_3b_ci.transaction_origins o USING(transaction_id) LEFT JOIN f06_5b_ci.guard_events g USING(transaction_id) WHERE t.vehicle_id=86181108 AND g.transaction_id IS NULL");
 assert.ok(x.length>0,'旧3B漏洞S53-54必须保留');
 const r=await attempt({vehicleId:86181108,listingCycleId:86182108,eventKey:mk('legacy-unsafe')},auth,token);
 assert.equal(r.allowed,false,JSON.stringify(r));
});
test('5C-S48 并发失败未产生实际付款记录',async()=>assert.equal((await q('SELECT count(*)::int n FROM public.refund_payments'))[0].n,0));
