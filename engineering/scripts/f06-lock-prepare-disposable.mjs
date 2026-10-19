// 仅在已经具备受验 M94/F05 结构的空 PostgreSQL16 隔离库应用新测试侧表。
// 禁止调用老冻结 CI 迁移、改动 public M94、伪造原 Source。
import pg from 'pg';
import {readFile} from 'node:fs/promises';
import {assertF06TestEnvironment,verifyF06TestDatabase} from '../src/f06-lock-readiness.mjs';
const env=assertF06TestEnvironment();
const db=new pg.Client({connectionString:env.connectionString,connectionTimeoutMillis:2500});
await db.connect();
try{
 const r=(await db.query(`SELECT current_database() db,current_user role,
 current_setting('server_version_num')::integer ver,
 (SELECT rolsuper FROM pg_roles WHERE rolname=current_user) superuser,
 (SELECT rolcreatedb FROM pg_roles WHERE rolname=current_user) createdb,
 to_regclass('public.vehicles') IS NOT NULL vehicles,
 to_regclass('public.lock_requests') IS NOT NULL requests,
 to_regclass('public.locks') IS NOT NULL locks,
 to_regclass('public.waitlists') IS NOT NULL waitlists,
 to_regclass('public.f05_8_priority_ci') IS NOT NULL priority`)).rows[0];
 if(!r||r.db!=='f06_lock_test'||r.role!=='f06_lock_ci'||r.superuser!==false||r.createdb!==false||
  r.ver<160000||r.ver>=170000||![r.vehicles,r.requests,r.locks,r.waitlists,r.priority].every(Boolean))
  throw Error('F06_LOCK_TRUSTED_DISPOSABLE_M94_BASE_REQUIRED');
 if((await db.query("SELECT to_regnamespace('f06_real_lock_test') IS NOT NULL present")).rows[0].present)
  throw Error('F06_LOCK_SIDECAR_ALREADY_EXISTS_USE_NEW_EMPTY_DATABASE');
 const sql=await readFile(new URL('../sql/f06-lock-disposable-only.sql',import.meta.url),'utf8');
 await db.query('BEGIN');
 try{await db.query(sql);await db.query('COMMIT')}
 catch(e){await db.query('ROLLBACK').catch(()=>{});throw e}
 await verifyF06TestDatabase(db);
 console.info('F06_DISPOSABLE_PG16_SIDECAR_READY',{database:r.db,version:r.ver,productionReady:false});
}finally{await db.end()}