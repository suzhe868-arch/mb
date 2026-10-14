import {test} from 'node:test';
import assert from 'node:assert/strict';
import {connect,verify,checksum,gate} from '../migration.mjs';
import {requestSyntheticNewPriorityCI,productionIssuerDeny,UPSTREAM_GAP} from '../service.mjs';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
const db=await connect(),q=(sql,args=[])=>db.query(sql,args).then(r=>r.rows);
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret:Buffer.alloc(32,61),origin:'https://127.0.0.1:49026'});
const peer=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret:Buffer.alloc(32,61),origin:'https://127.0.0.1:49026'});
const mk=x=>'f06-5c-pg16-'+x+'-'+process.env.GITHUB_RUN_ID;
const args={vehicleId:86181104,listingCycleId:86182104,customerId:86180101,teamId:901,eventKey:mk('base')};
const attempt=(v={},a=auth,t='forged')=>requestSyntheticNewPriorityCI(a,t,{...args,...v});
test.before(async()=>assert.equal((await verify(db)).verified,true));
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
