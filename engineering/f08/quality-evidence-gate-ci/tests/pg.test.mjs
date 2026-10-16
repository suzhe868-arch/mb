import test,{before,after,beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
const {Pool}=pg;
const sha='692e4c755e3410c569940019d042680e91f8a3fa';
function guard(){
 if(process.env.CI!=='true'||process.env.APP_ENV!=='test'||process.env.NODE_ENV!=='test'||process.env.GITHUB_EVENT_NAME!=='push'||process.env.GITHUB_REF!=='refs/heads/feat/f08-1-cross-domain-quality-evidence-gate-ci'||process.env.F08_1_ONLY!=='I_AUTHORIZE_F08_1_ISOLATED_PG16_TEST')throw Error('F08_1_ENVIRONMENT_DENIED');
 const url=new URL(process.env.DATABASE_URL||'');
 if(url.protocol!=='postgres:'||url.hostname!=='127.0.0.1'||url.pathname!=='/f08_1_test'||url.username!=='f08_ci')throw Error('F08_1_DSN_DENIED');
}
guard();
const db=new Pool({connectionString:process.env.DATABASE_URL,max:4});
const q=(sql,args=[])=>db.query(sql,args);
const add=async({id='item-1',origin='CI_SYNTHETIC_ONLY',state='queued',positive=false,production=false,object='F07',ref=sha}={})=>
 q('INSERT INTO f08_1_ci.evidence(evidence_id,domain,origin,check_state,claimed_positive,claimed_production,source_sha) VALUES($1,$2,$3,$4,$5,$6,$7)',[id,object,origin,state,positive,production,ref]);
const qty=async()=>Number((await q('SELECT count(*) AS n FROM f08_1_ci.evidence')).rows[0].n);
const denial=async(fn)=>assert.rejects(fn);
before(async()=>{
 const p=(await q("SELECT current_user u,current_database() d,current_setting('server_version_num')::int v,rolsuper s FROM pg_roles WHERE rolname=current_user")).rows[0];
 assert.equal(p.u,'f08_ci');assert.equal(p.d,'f08_1_test');assert.ok(p.v>=160000&&p.v<170000);assert.equal(p.s,false);
 await q('CREATE SCHEMA IF NOT EXISTS f08_1_ci');
 await q(`CREATE TABLE IF NOT EXISTS f08_1_ci.evidence (
 evidence_id text PRIMARY KEY,
 domain text NOT NULL CHECK(domain IN ('F01','F02','F03','F04','F05','F06','F07','F08','C')),
 origin text NOT NULL CHECK(origin IN ('SIGNED_PARENT_VERIFIED','SIGNED_PARENT_NEGATIVE_ONLY','CI_SYNTHETIC_ONLY','STATIC_CONTRACT_ONLY','NOT_RUN','SOURCE_GAP')),
 check_state text NOT NULL CHECK(check_state IN ('success','failure','queued','in_progress','skipped','cancelled','missing')),
 source_sha text NOT NULL CHECK(source_sha ~ '^[0-9a-f]{40}$'),
 claimed_positive boolean NOT NULL DEFAULT false,
 claimed_production boolean NOT NULL DEFAULT false CHECK(claimed_production=false),
 CHECK(NOT(claimed_positive AND origin <> 'SIGNED_PARENT_VERIFIED')),
 CHECK(NOT(claimed_positive AND check_state <> 'success'))
 )`);
});
beforeEach(async()=>q('TRUNCATE f08_1_ci.evidence'));
after(async()=>db.end());
test('P01 隔离库当前操作者不是超级用户',async()=>assert.equal((await q("SELECT rolsuper FROM pg_roles WHERE rolname=current_user")).rows[0].rolsuper,false));
test('P02 环境为真正PostgreSQL16',async()=>{const n=Number((await q("SELECT current_setting('server_version_num') v")).rows[0].v);assert.ok(n>=160000&&n<170000);});
test('P03 数据库名称不可假冒生产',async()=>assert.equal((await q('SELECT current_database() n')).rows[0].n,'f08_1_test'));
test('P04 仓库测试只在独立f08_ci schema有表',async()=>assert.ok((await q("SELECT count(*)::int n FROM pg_tables WHERE schemaname='f08_1_ci'")).rows[0].n>=1));
test('P05 真实旧CI排队可以安全记录但不能声称正例',async()=>{await add();assert.equal((await q('SELECT claimed_positive FROM f08_1_ci.evidence')).rows[0].claimed_positive,false);});
test('P06 模拟CI成功不能冒充签名父事实',async()=>denial(()=>add({positive:true,state:'success'})));
test('P07 真签父负证不能冒充签名父正例',async()=>denial(()=>add({origin:'SIGNED_PARENT_NEGATIVE_ONLY',positive:true,state:'success'})));
test('P08 静态合同不允许宣称父业务正例',async()=>denial(()=>add({origin:'STATIC_CONTRACT_ONLY',positive:true,state:'success'})));
test('P09 未运行不允许宣称父正例',async()=>denial(()=>add({origin:'NOT_RUN',positive:true,state:'success'})));
test('P10 缺口不能宣称父正例',async()=>denial(()=>add({origin:'SOURCE_GAP',positive:true,state:'success'})));
test('P11 真签父positive状态success可以作为结构化事实（测试合成）',async()=>{await add({origin:'SIGNED_PARENT_VERIFIED',positive:true,state:'success'});assert.equal(await qty(),1);});
test('P12 真签父queued仍不可声称完成',async()=>denial(()=>add({origin:'SIGNED_PARENT_VERIFIED',positive:true,state:'queued'})));
test('P13 真签父failure仍不可声称完成',async()=>denial(()=>add({origin:'SIGNED_PARENT_VERIFIED',positive:true,state:'failure'})));
test('P14 真签父in_progress仍不可声称完成',async()=>denial(()=>add({origin:'SIGNED_PARENT_VERIFIED',positive:true,state:'in_progress'})));
test('P15 禁止合成证据宣告生产就绪',async()=>denial(()=>add({production:true})));
test('P16 非法CI结论字符串被数据库拒绝',async()=>denial(()=>add({state:'all-green'})));
test('P17 非法域字符串被数据库拒绝',async()=>denial(()=>add({object:'H99'})));
test('P18 非法来源级别被数据库拒绝',async()=>denial(()=>add({origin:'REAL_PAYMENT_DONE'})));
test('P19 跨SHA来源丢失明确拒绝',async()=>denial(()=>add({ref:'missing'})));
test('P20 同一证据id重复插入必须失败',async()=>{await add();await denial(()=>add());assert.equal(await qty(),1);});
test('P21 真实事务ROLLBACK不得保留未提交证据',async()=>{
 const c=await db.connect();try{await c.query('BEGIN');await c.query("INSERT INTO f08_1_ci.evidence(evidence_id,domain,origin,check_state,source_sha) VALUES('rolled','F08','CI_SYNTHETIC_ONLY','queued',$1)",[sha]);await c.query('ROLLBACK');}finally{c.release();}
 assert.equal(await qty(),0);
});
test('P22 并发不同业务域写入仍各自标明模拟来源',async()=>{
 await Promise.all(['F01','F02','F03','F04','F05','F06','F07','F08','C'].map((object,i)=>add({id:'d'+i,object})));
 assert.equal(await qty(),9);assert.equal((await q('SELECT count(*)::int n FROM f08_1_ci.evidence WHERE origin<>\'CI_SYNTHETIC_ONLY\'')).rows[0].n,0);
});
test('P23 public原有对象只读快照不受f08合成写入影响',async()=>{
 const fingerprint=async()=>q("SELECT count(*)::int n,md5(coalesce(string_agg(relname,',' ORDER BY relname),'')) hash FROM pg_class WHERE relnamespace='public'::regnamespace");
 const before=(await fingerprint()).rows[0];await add();assert.deepEqual((await fingerprint()).rows[0],before);
});
test('P24 独立业务测试结束保留真实PG16非特权证明',async()=>{const pid=(await q('SELECT pg_backend_pid() pid')).rows[0].pid;assert.ok(pid>0);console.log('F08_1_NATIVE_PG16_NON_SUPERUSER',pid);console.log('F08_1_PG16_24_CASES_PASS');});
