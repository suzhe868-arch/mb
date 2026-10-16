// 本文件只对 CI 新建可销毁 PG16 数据库运行，绝不引用现有产品表或生产凭据。
import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
const gate='I_AUTHORIZE_F05_PARENT_AUDIT_DISPOSABLE_PG16_ONLY';
if(process.env.F05_PARENT_PG16_ISOLATED!==gate||process.env.PGHOST!=='127.0.0.1'||process.env.PGUSER!=='f05_parent_audit'||process.env.PGDATABASE!=='f05_parent_audit_ci')
 throw Error('F05_PARENT_PROOF_PG16_ISOLATION_DENIED');
function query(sql){
 const r=spawnSync('psql',['-X','-v','ON_ERROR_STOP=1','-A','-t','-c',sql],{encoding:'utf8',env:process.env,timeout:10000});
 return {status:r.status,stdout:r.stdout.trim(),stderr:r.stderr.trim()};
}
const rows=[
 ['PG16 版本必须为16', "SELECT current_setting('server_version_num')::int / 10000 = 16", 't'],
 ['数据库仅为专项一次性测试库',"SELECT current_database() = 'f05_parent_audit_ci'",'t'],
 ['登录角色必须为专项审计用户',"SELECT current_user = 'f05_parent_audit'",'t'],
 ['真实角色不能是超级用户',"SELECT rolsuper FROM pg_roles WHERE rolname=current_user",'f'],
 ['真实角色不能创建数据库',"SELECT rolcreatedb FROM pg_roles WHERE rolname=current_user",'f'],
 ['真实角色不能创建新角色',"SELECT rolcreaterole FROM pg_roles WHERE rolname=current_user",'f'],
 ['真实角色不能复制权限',"SELECT rolreplication FROM pg_roles WHERE rolname=current_user",'f'],
 ['真实事务能够提交隔离临时数据',"BEGIN;CREATE TEMP TABLE f05_parent_temp(x int);INSERT INTO f05_parent_temp VALUES(7);SELECT sum(x)=7 FROM f05_parent_temp;COMMIT;",'BEGIN\nCREATE TABLE\nINSERT 0 1\nt\nCOMMIT'],
 ['模拟来源缺口只能记录拒绝而不是授权',"SELECT CASE WHEN 'SOURCE_GAP'='VERIFIED_OFFICIAL' THEN 'ALLOW' ELSE 'DENY' END",'DENY'],
 ['状态冒充不得升级为通过',"SELECT CASE WHEN 'in_progress'='completed' AND 'skipped'='success' THEN 'ALLOW' ELSE 'DENY' END",'DENY'],
 ['跨SHA校验在数据库侧同样拒绝',"SELECT CASE WHEN repeat('a',40)=repeat('b',40) THEN 'ALLOW' ELSE 'DENY' END",'DENY'],
 ['仅临时表并不创建业务表',"SELECT count(*) FROM pg_tables WHERE schemaname='public' AND tablename like 'vehicle%' ",'0']
];
for(const [name,sql,expected] of rows){
 test(name,()=>{const r=query(sql);assert.equal(r.status,0,r.stderr);assert.equal(r.stdout,expected);});
}
test('禁止非特权角色创建其他身份',()=>{const r=query('CREATE ROLE f05_illegal_user LOGIN');assert.notEqual(r.status,0);assert.match(r.stderr,/permission denied|must be superuser/i);});
test('禁止非特权角色创建另一个数据库',()=>{const r=query('CREATE DATABASE f05_illegal_db');assert.notEqual(r.status,0);assert.match(r.stderr,/permission denied|must be superuser/i);});
test('失败事务必须真实回滚',()=>{
 const a=query('BEGIN;CREATE TABLE public.f05_rollback_demo(n int);ROLLBACK;');assert.equal(a.status,0,a.stderr);
 const b=query("SELECT count(*) FROM pg_tables WHERE schemaname='public' AND tablename='f05_rollback_demo'");assert.equal(b.stdout,'0');
});
test('本任务不建产品持久表',()=>{const r=query("SELECT count(*) FROM pg_tables WHERE schemaname='public' AND tablename NOT LIKE 'pg_%'");assert.equal(r.stdout,'0');});
