import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyIsolatedConfig,forbidMigrationExecution,assertReadOnlyPg16Identity} from '../guard.mjs';
const good={GITHUB_ACTIONS:'true',CI:'true',APP_ENV:'test',NODE_ENV:'test',F02_G0_ISOLATION_CONFIRM:'I_ACKNOWLEDGE_F02_G0_DISPOSABLE_DATABASE',F02_G0_OPERATION:'readonly_preflight',F02_G0_DATABASE_URL:'postgres://f02_ci:fixture_only@127.0.0.1:5432/f02_schema_test'};
test('允许的唯一 CI 测试目标',()=>{let x=verifyIsolatedConfig(good);assert.equal(x.database,'f02_schema_test');assert.equal(x.role,'f02_ci');});
test('生产/开发/非CI/未授权/非只读一律拒绝',()=>{
  for(let patch of [{GITHUB_ACTIONS:'false'},{CI:'false'},{APP_ENV:'production'},{APP_ENV:'development'},{NODE_ENV:'production'},{F02_G0_ISOLATION_CONFIRM:'no'},{F02_G0_OPERATION:'migrate'},{F02_G0_DATABASE_URL:''}])
    assert.throws(()=>verifyIsolatedConfig({...good,...patch}),/F02_G0_REFUSED/);
});
test('远程/F01库/生产库/管理员/错误端口/URL选项与协议一律拒绝',()=>{
  const urls=['postgres://f02_ci:x@db.example.com:5432/f02_schema_test','postgres://f02_ci:x@127.0.0.1:5432/f01_foundation','postgres://f02_ci:x@127.0.0.1:5432/production','postgres://postgres:x@127.0.0.1:5432/f02_schema_test','postgres://f02_ci:x@127.0.0.1:5433/f02_schema_test','postgres://f02_ci:x@127.0.0.1:5432/f02_schema_test?sslmode=disable','postgres://f02_ci:x@localhost:5432/f02_schema_test','file:///f02_schema_test','nonsense'];
  for(const url of urls)assert.throws(()=>verifyIsolatedConfig({...good,F02_G0_DATABASE_URL:url}),/F02_G0_REFUSED/);
});
test('迁移/清库执行入口始终拒绝',()=>{
  assert.doesNotThrow(()=>forbidMigrationExecution([]));
  for(const a of ['--apply','--migrate','--reset','000001_initial_schema.sql','db-clean-rebuild.mjs'])assert.throws(()=>forbidMigrationExecution([a]),/MIGRATION_EXECUTION_DISABLED/);
});
test('实际 PG16 只读身份/空表约束正反例',()=>{
  const row={database_name:'f02_schema_test',db_user:'f02_ci',version_num:160015,is_superuser:false,can_create_database:false,can_create_roles:false,public_table_count:0,non_public_user_schema_count:0,user_relation_count:0};
  assert.doesNotThrow(()=>assertReadOnlyPg16Identity(row));
  for(const patch of [{database_name:'f01_foundation'},{db_user:'postgres'},{version_num:170000},{version_num:150000},{is_superuser:true},{can_create_database:true},{can_create_roles:true},{public_table_count:1},{non_public_user_schema_count:1},{user_relation_count:1}])assert.throws(()=>assertReadOnlyPg16Identity({...row,...patch}),/F02_G0_DATABASE_IDENTITY/);
});

test('非 public 空用户Schema或任意用户关系必须拒绝',()=>{
  const row={database_name:'f02_schema_test',db_user:'f02_ci',version_num:160015,is_superuser:false,can_create_database:false,can_create_roles:false,public_table_count:0,non_public_user_schema_count:0,user_relation_count:0};
  assert.throws(()=>assertReadOnlyPg16Identity({...row,non_public_user_schema_count:1}),/F02_G0_DATABASE_IDENTITY/);
  assert.throws(()=>assertReadOnlyPg16Identity({...row,user_relation_count:1}),/F02_G0_DATABASE_IDENTITY/);
});
