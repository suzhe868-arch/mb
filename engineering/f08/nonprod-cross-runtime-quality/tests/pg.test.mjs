import test,{before,after,beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
const {Pool}=pg;
const u=new URL(process.env.DATABASE_URL??'postgres://invalid@invalid/invalid');
if(process.env.CI!=='true'||process.env.GITHUB_EVENT_NAME!=='push'||
 process.env.GITHUB_REF!=='refs/heads/feat/f08-nonprod-cross-runtime-quality-02'||
 process.env.F08_2_ONLY!=='I_AUTHORIZE_DISPOSABLE_F08_2_PG16_ONLY'||
 !/^[0-9a-f]{40}$/.test(process.env.GITHUB_SHA??'')||
 u.protocol!=='postgres:'||u.hostname!=='127.0.0.1'||u.pathname!=='/f08_2_quality_test'||u.username!=='f08_2_ci')
 throw Error('F08_2_PG16_ISOLATION_REFUSED');
const pool=new Pool({connectionString:process.env.DATABASE_URL,max:4});
const sql=(q,args=[])=>pool.query(q,args);
const add=({id='q1',domain='F07',source='HISTORIC_DIFFERENT_SHA',sha='32f180238ff3271b38d2b91402cf4a7b55e07d52',production=false,positive=false}={})=>
 sql('INSERT INTO f08_2_ci.quality_facts(id,domain,source_level,source_sha,production_ready,current_positive) VALUES($1,$2,$3,$4,$5,$6)',[id,domain,source,sha,production,positive]);
const count=async()=>Number((await sql('SELECT count(*) n FROM f08_2_ci.quality_facts')).rows[0].n);
before(async()=>{
 const {rows:[p]}=await sql("SELECT current_user u,current_database() d,current_setting('server_version_num')::int v, (SELECT rolsuper FROM pg_roles WHERE rolname=current_user) s,(SELECT rolcreatedb FROM pg_roles WHERE rolname=current_user) cd,(SELECT rolcreaterole FROM pg_roles WHERE rolname=current_user) cr, (SELECT oid FROM pg_database WHERE datname=current_database()) oid");
 assert.equal(p.u,'f08_2_ci');assert.equal(p.d,'f08_2_quality_test');assert.ok(p.v>=160000&&p.v<170000);
 assert.equal(p.s,false);assert.equal(p.cd,false);assert.equal(p.cr,false);assert.ok(p.oid>0);
 await sql('CREATE SCHEMA IF NOT EXISTS f08_2_ci');
 await sql(`CREATE TABLE IF NOT EXISTS f08_2_ci.quality_facts(
  id text PRIMARY KEY,
  domain text NOT NULL CHECK(domain IN('F01','F03','F05','F06','F07','F08')),
  source_level text NOT NULL CHECK(source_level IN('HISTORIC_DIFFERENT_SHA','SOURCE_GAP','NOT_RUN','PROVEN_SAME_SHA')),
  source_sha text NOT NULL CHECK(source_sha ~ '^[0-9a-f]{40}$'),
  production_ready boolean NOT NULL DEFAULT false CHECK(production_ready=false),
  current_positive boolean NOT NULL DEFAULT false,
  CHECK(NOT(current_positive AND source_level<>'PROVEN_SAME_SHA'))
 )`);
 console.log('F08_2_NATIVE_PG16_NON_SUPERUSER',JSON.stringify(p));
});
beforeEach(async()=>sql('TRUNCATE f08_2_ci.quality_facts'));
after(async()=>pool.end());
test('P01 查询真实PostgreSQL16进程身份',async()=>{const r=await sql("SELECT current_setting('server_version_num')::int v, pg_backend_pid() pid");assert.ok(r.rows[0].v>=160000&&r.rows[0].v<170000);assert.ok(r.rows[0].pid>0);});
test('P02 非超级用户角色禁止生产级授权',async()=>{const r=await sql('SELECT rolsuper,rolcreatedb,rolcreaterole FROM pg_roles WHERE rolname=current_user');assert.deepEqual(r.rows[0],{rolsuper:false,rolcreatedb:false,rolcreaterole:false});});
test('P03 数据库OID真实且独立',async()=>{const r=await sql("SELECT oid FROM pg_database WHERE datname='f08_2_quality_test'");assert.ok(r.rows[0].oid>0);});
test('P04 当前库中仅有本次合成业务表',async()=>{const r=await sql("SELECT tablename FROM pg_tables WHERE schemaname='f08_2_ci'");assert.deepEqual(r.rows.map(x=>x.tablename),['quality_facts']);});
test('P05 无权访问正式父数据库对象',async()=>assert.rejects(()=>sql('SELECT * FROM f03_auth.sessions LIMIT 1')));
test('P06 当前独立库不得存在正式父Schema',async()=>{const r=await sql("SELECT nspname FROM pg_namespace WHERE nspname IN('f03_auth','f05_catalog','f06_lock','f07_runtime')");assert.equal(r.rowCount,0);});
test('P07 历史父SHA只以历史来源写入',async()=>{await add();const r=await sql('SELECT source_level,current_positive FROM f08_2_ci.quality_facts');assert.equal(r.rows[0].source_level,'HISTORIC_DIFFERENT_SHA');assert.equal(r.rows[0].current_positive,false);});
test('P08 历史SHA升级当前正例须被数据库拒绝',async()=>assert.rejects(()=>add({positive:true})));
test('P09 SOURCE_GAP不能冒充当前正例',async()=>assert.rejects(()=>add({source:'SOURCE_GAP',positive:true})));
test('P10 NOT_RUN不能冒充当前正例',async()=>assert.rejects(()=>add({source:'NOT_RUN',positive:true})));
test('P11 合成库不得标记生产READY',async()=>assert.rejects(()=>add({production:true})));
test('P12 异常来源标记被CHECK拒绝',async()=>assert.rejects(()=>add({source:'REAL_EXTERNAL_PARENT'})));
test('P13 非法SHA格式被CHECK拒绝',async()=>assert.rejects(()=>add({sha:'invalid'})));
test('P14 RequestKey唯一约束拒绝重复',async()=>{await add();await assert.rejects(()=>add());assert.equal(await count(),1);});
test('P15 事务回滚不保留业务事实',async()=>{
 const client=await pool.connect();try{await client.query('BEGIN');await client.query("INSERT INTO f08_2_ci.quality_facts(id,domain,source_level,source_sha) VALUES('rollback','F06','SOURCE_GAP',$1)",[process.env.GITHUB_SHA]);await client.query('ROLLBACK');}finally{client.release();}
 assert.equal(await count(),0);
});
test('P16 并发写入保持独立来源和唯一身份',async()=>{
 await Promise.all(Array.from({length:8},(_,i)=>add({id:'parallel-'+i,domain:i%2?'F06':'F07'})));
 assert.equal(await count(),8);const r=await sql('SELECT count(*)::int n FROM f08_2_ci.quality_facts WHERE current_positive OR production_ready');assert.equal(r.rows[0].n,0);
});
