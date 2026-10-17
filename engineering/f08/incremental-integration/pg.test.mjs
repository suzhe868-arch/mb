import test,{before,after,beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import {vehicleRead,consultation,lockRequest,upstreamSourceCheck,assertProductionIssuersClosed} from './cross-domain.mjs';
const DSN='postgres://bounded_ci:bounded_ci_test_only@127.0.0.1:5432/f08_bounded_test';
const EXPECT={CI:'true',GITHUB_ACTIONS:'true',APP_ENV:'test',NODE_ENV:'test',GITHUB_EVENT_NAME:'push',GITHUB_REPOSITORY:'suzhe868-arch/mb',GITHUB_REF:'refs/heads/feat/f05-f08-bounded-real-engineering-01',F05_F08_BOUNDED_ONLY:'I_AUTHORIZE_ISOLATED_NONPRIVILEGED_PG16_ONLY',DATABASE_URL:DSN};
for(const [k,v] of Object.entries(EXPECT))if(process.env[k]!==v)throw Error('F05_F08_ENV_DENIED_'+k);
if(!/^[0-9a-f]{40}$/.test(process.env.GITHUB_SHA||''))throw Error('F05_F08_SHA_DENIED');
const pool=new pg.Pool({connectionString:DSN,max:6,connectionTimeoutMillis:3000});
const q=(s,a=[])=>pool.query(s,a);
const FIXTURE=[
'CREATE SCHEMA IF NOT EXISTS bounded_ci',
"CREATE TABLE bounded_ci.customers(customer_id int PRIMARY KEY,state text NOT NULL CHECK(state IN ('active','disabled')))",
"CREATE TABLE bounded_ci.vehicles(vehicle_id int PRIMARY KEY,sale_status text NOT NULL CHECK(sale_status IN ('active','sold')),asking_price int NOT NULL CHECK(asking_price>0),hidden boolean NOT NULL DEFAULT false,archived_at timestamptz,ended_at timestamptz)",
'CREATE TABLE bounded_ci.owner_assignments(customer_id int NOT NULL REFERENCES bounded_ci.customers,employee_id int NOT NULL,active boolean NOT NULL,PRIMARY KEY(customer_id,employee_id))',
'CREATE UNIQUE INDEX owner_one_current ON bounded_ci.owner_assignments(customer_id) WHERE active',
'CREATE TABLE bounded_ci.visibility_grants(vehicle_id int NOT NULL REFERENCES bounded_ci.vehicles,customer_id int NOT NULL REFERENCES bounded_ci.customers,active boolean NOT NULL DEFAULT true,PRIMARY KEY(vehicle_id,customer_id))',
"CREATE TABLE bounded_ci.consultations(consultation_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,customer_id int NOT NULL REFERENCES bounded_ci.customers,vehicle_id int NOT NULL REFERENCES bounded_ci.vehicles,employee_id int NOT NULL,event_key text NOT NULL UNIQUE,status text NOT NULL CHECK(status IN ('pending','ended')))",
'CREATE TABLE bounded_ci.priority_claims(vehicle_id int PRIMARY KEY REFERENCES bounded_ci.vehicles,customer_id int NOT NULL REFERENCES bounded_ci.customers,active boolean NOT NULL)',
"CREATE TABLE bounded_ci.lock_requests(request_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,customer_id int NOT NULL REFERENCES bounded_ci.customers,vehicle_id int NOT NULL REFERENCES bounded_ci.vehicles,event_key text NOT NULL UNIQUE,status text NOT NULL CHECK(status IN ('pending','approved','rejected')))",
"CREATE UNIQUE INDEX only_one_pending_lock ON bounded_ci.lock_requests(vehicle_id) WHERE status='pending'"
];
before(async()=>{
 const r=(await q("SELECT current_user u,current_database() d,current_setting('server_version_num')::int ver,(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) su,(SELECT rolcreatedb FROM pg_roles WHERE rolname=current_user) cdb,(SELECT rolcreaterole FROM pg_roles WHERE rolname=current_user) cr")).rows[0];
 assert.equal(r.u,'bounded_ci');assert.equal(r.d,'f08_bounded_test');assert.ok(r.ver>=160000&&r.ver<170000);assert.equal(r.su,false);assert.equal(r.cdb,false);assert.equal(r.cr,false);
 for(const line of FIXTURE)await q(line);
});
beforeEach(async()=>{
 await q('TRUNCATE bounded_ci.lock_requests,bounded_ci.priority_claims,bounded_ci.consultations,bounded_ci.visibility_grants,bounded_ci.owner_assignments,bounded_ci.vehicles,bounded_ci.customers RESTART IDENTITY CASCADE');
 await q("INSERT INTO bounded_ci.customers VALUES(21,'active'),(22,'active'),(23,'disabled')");
 await q("INSERT INTO bounded_ci.vehicles(vehicle_id,sale_status,asking_price,hidden) VALUES(31,'active',78000,false),(32,'active',78000,true),(33,'sold',78000,false)");
 await q("INSERT INTO bounded_ci.owner_assignments(customer_id,employee_id,active) VALUES(21,51,true),(22,52,true),(23,51,true)");
});
after(async()=>pool.end());
test('P01 真PG16非特权',async()=>assert.equal((await q('SELECT current_user u')).rows[0].u,'bounded_ci'));
test('P02 物理schema隔离不改public',async()=>{assert.equal((await q("SELECT count(*)::int n FROM pg_tables WHERE schemaname='bounded_ci'")).rows[0].n,7);assert.equal((await q("SELECT count(*)::int n FROM pg_tables WHERE schemaname='public' AND tablename='vehicles'")).rows[0].n,0)});
test('P03 F05匹配+F03 Owner真实物理读取',async()=>{const r=await vehicleRead(pool,{employeeId:51,customerId:21,vehicleId:31});assert.equal(r.code,'CI_CURRENT_SCOPED_VEHICLE');assert.equal(r.allowed,false);assert.equal(r.tier,'high')});
test('P04 Owner转移后旧销售即刻拒绝',async()=>{await q('UPDATE bounded_ci.owner_assignments SET active=false WHERE customer_id=21');await q('INSERT INTO bounded_ci.owner_assignments VALUES(21,52,true)');assert.equal((await vehicleRead(pool,{employeeId:51,customerId:21,vehicleId:31})).code,'CUSTOMER_OWNER_SCOPE_DENIED')});
test('P05 隐藏车无Recommendation Grant拒绝',async()=>assert.equal((await vehicleRead(pool,{employeeId:51,customerId:21,vehicleId:32})).code,'HIDDEN_NO_RECOMMENDATION_GRANT'));
test('P06 Grant授权只形成合成投影',async()=>{await q('INSERT INTO bounded_ci.visibility_grants VALUES(32,21,true)');const r=await vehicleRead(pool,{employeeId:51,customerId:21,vehicleId:32});assert.equal(r.code,'CI_CURRENT_SCOPED_VEHICLE');assert.equal(r.allowed,false)});
test('P07 已售车禁止匹配',async()=>assert.equal((await vehicleRead(pool,{employeeId:51,customerId:21,vehicleId:33})).code,'VEHICLE_NOT_SALEABLE'));
test('P08 停用客户拒绝',async()=>assert.equal((await vehicleRead(pool,{employeeId:51,customerId:23,vehicleId:31})).code,'CUSTOMER_OWNER_SCOPE_DENIED'));
test('P09 咨询落PG实体',async()=>{const r=await consultation(pool,{employeeId:51,customerId:21,vehicleId:31,eventKey:'cons:ci:000001'});assert.equal(r.code,'CI_CONSULTATION_RECORDED');assert.equal(r.created,true);assert.equal((await q('SELECT count(*)::int n FROM bounded_ci.consultations')).rows[0].n,1)});
test('P10 咨询event幂等',async()=>{await consultation(pool,{employeeId:51,customerId:21,vehicleId:31,eventKey:'cons:ci:000001'});const r=await consultation(pool,{employeeId:51,customerId:21,vehicleId:31,eventKey:'cons:ci:000001'});assert.equal(r.created,false);assert.equal((await q('SELECT count(*)::int n FROM bounded_ci.consultations')).rows[0].n,1)});
test('P11 非客户Owner不能插入咨询',async()=>{const r=await consultation(pool,{employeeId:52,customerId:21,vehicleId:31,eventKey:'cons:ci:000001'});assert.equal(r.code,'CUSTOMER_OWNER_SCOPE_DENIED');assert.equal((await q('SELECT count(*)::int n FROM bounded_ci.consultations')).rows[0].n,0)});
test('P12 F06锁车没有咨询必拒绝',async()=>assert.equal((await lockRequest(pool,{employeeId:51,customerId:21,vehicleId:31,eventKey:'lock:ci:000001'})).code,'LOCK_REQUIRES_CURRENT_CONSULTATION'));
test('P13 咨询→F06锁车申请仅待审批',async()=>{await consultation(pool,{employeeId:51,customerId:21,vehicleId:31,eventKey:'cons:ci:000001'});const r=await lockRequest(pool,{employeeId:51,customerId:21,vehicleId:31,eventKey:'lock:ci:000001'});assert.equal(r.code,'CI_LOCK_REQUEST_PENDING_APPROVAL');assert.equal(r.allowed,false);assert.equal((await q('SELECT status FROM bounded_ci.lock_requests')).rows[0].status,'pending')});
test('P14 锁车重放唯一',async()=>{await consultation(pool,{employeeId:51,customerId:21,vehicleId:31,eventKey:'cons:ci:000001'});await lockRequest(pool,{employeeId:51,customerId:21,vehicleId:31,eventKey:'lock:ci:000001'});assert.equal((await lockRequest(pool,{employeeId:51,customerId:21,vehicleId:31,eventKey:'lock:ci:000001'})).code,'CI_LOCK_REQUEST_REPLAY');assert.equal((await q('SELECT count(*)::int n FROM bounded_ci.lock_requests')).rows[0].n,1)});
test('P15 其他客户优先级排他',async()=>{await consultation(pool,{employeeId:51,customerId:21,vehicleId:31,eventKey:'cons:ci:000001'});await q('INSERT INTO bounded_ci.priority_claims VALUES(31,22,true)');assert.equal((await lockRequest(pool,{employeeId:51,customerId:21,vehicleId:31,eventKey:'lock:ci:000001'})).code,'RIVAL_PRIORITY_DENIED')});
test('P16 PostgreSQL唯一索引禁止两个待锁',async()=>{await q("INSERT INTO bounded_ci.lock_requests(customer_id,vehicle_id,event_key,status) VALUES(21,31,'lock:ci:000001','pending')");await assert.rejects(q("INSERT INTO bounded_ci.lock_requests(customer_id,vehicle_id,event_key,status) VALUES(22,31,'lock:ci:000002','pending')"),e=>e.code==='23505')});
test('P17 真实事务回滚不留咨询',async()=>{const c=await pool.connect();try{await c.query('BEGIN');await c.query("INSERT INTO bounded_ci.consultations(customer_id,vehicle_id,employee_id,event_key,status) VALUES(21,31,51,'cons:ci:000001','pending')");await c.query('ROLLBACK')}finally{c.release()}assert.equal((await q('SELECT count(*)::int n FROM bounded_ci.consultations')).rows[0].n,0)});
test('P18 F07合法Publisher绑定仍Source Gap',()=>assert.equal(upstreamSourceCheck({source_platform:'JYT',upstream_publisher_id:'661',vehicle_id:'31',car_code:'demo'}).code,'SIGNED_UPSTREAM_PARENT_SOURCE_GAP'));
test('P19 F07缺少Publisher拒绝',()=>assert.equal(upstreamSourceCheck({source_platform:'JYT',upstream_publisher_id:'',vehicle_id:'31',car_code:'demo'}).code,'PUBLISHER_ID_SOURCE_DENIED'));
test('P20 F07非JYT来源拒绝',()=>assert.equal(upstreamSourceCheck({source_platform:'FAKE',upstream_publisher_id:'661',vehicle_id:'31',car_code:'demo'}).code,'PUBLISHER_ID_SOURCE_DENIED'));
test('P21 旧正式F05/F06 Issuer均未启用',()=>{const r=assertProductionIssuersClosed();assert.match(r.f05,/SOURCE_GAP/);assert.match(r.f06,/NOT_WIRED/);assert.equal(r.real_external_invocations,0)});
test('P22 PG物理CHECK拒绝虚构付款状态',async()=>assert.rejects(q("INSERT INTO bounded_ci.lock_requests(customer_id,vehicle_id,event_key,status) VALUES(21,31,'lock:ci:000001','paid')"),e=>e.code==='23514'));
test('P23 外部生产JYT/微信/资金调用0',()=>{const r=upstreamSourceCheck({source_platform:'JYT',upstream_publisher_id:'661',vehicle_id:'31',car_code:'demo'});assert.equal(r.allowed,false);assert.equal(r.production_authorized,false);console.log('F05_F08_NATIVE_PG16_CROSS_DOMAIN_ASSERTIONS_COMPLETE')});
