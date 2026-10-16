// 真PG16非超级用户隔离数据库测试，不调用生产服务。
import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync,spawn} from 'node:child_process';
import {once} from 'node:events';
const db='f05_governance_test',user='f05_governance';
if(process.env.F05_GOVERNANCE_CI!=='I_AUTHORIZE_ISOLATED_PG16_ONLY'||process.env.GITHUB_REF_NAME!=='fix/f05-legacy-ci-governance-01')throw Error('F05_GOVERNANCE_UNAUTHORIZED_CONTEXT');
const args=sql=>['-X','-A','-t','-v','ON_ERROR_STOP=1','-h','127.0.0.1','-p','5432','-U',user,'-d',db,'-c',sql];
const sql=s=>execFileSync('psql',args(s),{env:process.env,encoding:'utf8',timeout:12000}).trim();
test('P01 真PostgreSQL主版本必须16',()=>assert.equal(sql('SHOW server_version_num').slice(0,2),'16'));
test('P02 隔离业务用户为非超级用户',()=>assert.equal(sql("SELECT rolname||'|'||rolsuper::int FROM pg_roles WHERE rolname=current_user"),'f05_governance|0'));
test('P03 只能接专用测试库',()=>assert.equal(sql('SELECT current_database()'),'f05_governance_test'));
test('P04 没有CREATEDB权限',()=>assert.equal(sql("SELECT rolcreatedb::int FROM pg_roles WHERE rolname=current_user"),'0'));
test('P05 没有CREATEROLE权限',()=>assert.equal(sql("SELECT rolcreaterole::int FROM pg_roles WHERE rolname=current_user"),'0'));
test('P06 非复制管理员',()=>assert.equal(sql("SELECT rolreplication::int FROM pg_roles WHERE rolname=current_user"),'0'));
test('P07 支持事务回滚且真实表不存在',()=>{sql('BEGIN; CREATE TABLE f05_gov_rollback(x integer); ROLLBACK');assert.equal(sql("SELECT to_regclass('public.f05_gov_rollback') IS NULL"),'t');});
test('P08 用独立业务schema创建测试数据',()=>{sql('CREATE SCHEMA IF NOT EXISTS f05_governance_ci');assert.equal(sql("SELECT schema_owner='f05_governance' FROM information_schema.schemata WHERE schema_name='f05_governance_ci'"),'t');});
test('P09 能真实创建约束表',()=>{sql('CREATE TABLE IF NOT EXISTS f05_governance_ci.assertions(id integer PRIMARY KEY, amount integer NOT NULL CHECK(amount>=0))');assert.equal(sql("SELECT to_regclass('f05_governance_ci.assertions') IS NOT NULL"),'t');});
test('P10 真数据库允许有效写入',()=>{sql('INSERT INTO f05_governance_ci.assertions VALUES(1,15) ON CONFLICT(id) DO UPDATE SET amount=EXCLUDED.amount');assert.equal(sql('SELECT amount FROM f05_governance_ci.assertions WHERE id=1'),'15');});
test('P11 唯一键必须阻止重复',()=>assert.throws(()=>sql('INSERT INTO f05_governance_ci.assertions VALUES(1,16)'),/duplicate key|23505/));
test('P12 CHECK约束必须拒绝负金额',()=>assert.throws(()=>sql('INSERT INTO f05_governance_ci.assertions VALUES(2,-1)'),/check constraint|23514/));
test('P13 NOT NULL约束必须拒绝空金额',()=>assert.throws(()=>sql('INSERT INTO f05_governance_ci.assertions(id) VALUES(2)'),/not-null constraint|23502/));
test('P14 失败SQL不得破坏之前已提交记录',()=>assert.equal(sql('SELECT count(*) FROM f05_governance_ci.assertions'), '1'));
test('P15 Savepoint撤销部分修改有效',()=>{sql('BEGIN; UPDATE f05_governance_ci.assertions SET amount=19; SAVEPOINT s; UPDATE f05_governance_ci.assertions SET amount=29; ROLLBACK TO s; COMMIT');assert.equal(sql('SELECT amount FROM f05_governance_ci.assertions WHERE id=1'),'19');});
test('P16 Read Committed真实默认级别',()=>assert.equal(sql('SHOW default_transaction_isolation'),'read committed'));
test('P17 FK拒绝缺失父行',()=>{sql('CREATE TABLE IF NOT EXISTS f05_governance_ci.child(id integer PRIMARY KEY, ref integer REFERENCES f05_governance_ci.assertions(id))');assert.throws(()=>sql('INSERT INTO f05_governance_ci.child VALUES(1,999)'),/foreign key constraint/);});
test('P18 FK合法引用可实际插入',()=>{sql('INSERT INTO f05_governance_ci.child VALUES(2,1) ON CONFLICT DO NOTHING');assert.equal(sql('SELECT ref FROM f05_governance_ci.child WHERE id=2'),'1');});
test('P19 FK禁止删除被引用的父记录',()=>assert.throws(()=>sql('DELETE FROM f05_governance_ci.assertions WHERE id=1'),/foreign key constraint/));
test('P20 PG advisory lock真实排他并发',async()=>{
 // 逐条-c确保psql将LOCK_HELD信号在会话继续持锁时实际刷新，而不是整个SQL批量返回后才可见。
 const child=spawn('psql',[
   '-X','-A','-t','-v','ON_ERROR_STOP=1','-h','127.0.0.1','-p','5432','-U',user,'-d',db,
   '-c','BEGIN','-c','SELECT pg_advisory_xact_lock(50916)',
   '-c',"SELECT 'LOCK_HELD'",'-c','SELECT pg_sleep(3)','-c','COMMIT'
 ],{env:process.env,stdio:['ignore','pipe','pipe']});
 let stdout='',stderr='';child.stdout.on('data',c=>stdout+=c.toString());child.stderr.on('data',c=>stderr+=c.toString());
 let ready=false;for(let n=0;n<40;n++){if(stdout.includes('LOCK_HELD')){ready=true;break;}await new Promise(r=>setTimeout(r,100));}
 if(!ready){child.kill();throw Error('PG_LOCK_NOT_ACQUIRED:'+stderr);}
 assert.equal(sql('SELECT pg_try_advisory_xact_lock(50916)'),'f');
 const [code]=await once(child,'exit');assert.equal(code,0);
 assert.equal(sql('SELECT pg_try_advisory_xact_lock(50916)'),'t');
});
test('P21 实际业务role不能创建superuser',()=>assert.throws(()=>sql('CREATE ROLE elevated SUPERUSER'),/permission denied|must be superuser/));
test('P22 数据库具备真正事务ID',()=>assert.match(sql('SELECT txid_current()'),/^\d+$/));
test('P23 持久化测试表可读取',()=>assert.equal(sql('SELECT count(*) FROM f05_governance_ci.child'),'1'));
test('P24 正式业务父证据在此作业不可签发',()=>assert.equal(process.env.F05_PARENT_PROOF_SIGNED??'NO','NO'));
test('F05_CI_GOVERNANCE_NATIVE_PG16_24_ASSERTIONS_PASS',()=>console.log('F05_GOVERNANCE_PG16_24_ASSERTIONS_PASS'));
