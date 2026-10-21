// Issue171 independent same-SHA native PG16 test and signed-parent cross-OID evidence gate.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sha=process.env.GITHUB_SHA,run=process.env.GITHUB_RUN_ID;
assert.match(sha||'',/^[0-9a-f]{40}$/);assert.match(run||'',/^[0-9]{6,20}$/);
assert.equal(process.env.GITHUB_REF,'refs/heads/feat/f06-nonprod-composite-lock-lifecycle-01');
function log(relative){
 return readFileSync(new URL(relative,import.meta.url),'utf8');
}
function tap(relative,min){
 const content=log(relative);
 const field=name=>{
  const matches=[...content.matchAll(new RegExp('^# '+name+' (\\d+)$','gm'))];
  assert.ok(matches.length,relative+' missing TAP '+name);
  return Number(matches.at(-1)[1]);
 };
 const tests=field('tests'),passed=field('pass');
 assert.ok(tests>=min,relative+' missing native cases: '+tests+' < '+min);
 assert.equal(tests,passed,relative+' count mismatch');
 for(const x of ['fail','skipped','cancelled'])assert.equal(field(x),0,relative+' '+x);
 assert.ok(!/^not ok /m.test(content),relative+' contains failed subtest');
 return {tests,passed,content};
}
const previous=tap('../nonprod-single-runtime-integration/evidence/单Runtime闭环_TAP.log',42);
const current=tap('./evidence/Issue171_Lifecycle_TAP.log',25);
const priority=tap('./evidence/Priority来源真实PG16_TAP.log',7);
const signedNegative=tap('./evidence/签名来源负向边界_TAP.log',15);
const legacy=tap('../nonprod-single-runtime-integration/evidence/Legacy审计真实PG16_TAP.log',1);
const legacyService=tap('./evidence/Legacy生命周期Service_TAP.log',12);
const legacyHttp=tap('./evidence/Legacy生命周期HTTP_TAP.log',18);
const legacyNative=tap('./evidence/Legacy生命周期PG16_TAP.log',13);
assert.ok(legacyNative.content.includes('F06_171_AFFECTED_LEGACY_LIFECYCLE_REAL_PG16_PASS'),
 'native PG16 affected CI_LEGACY lifecycle service regression missing');
assert.ok(previous.content.includes('F06_164_SINGLE_PG16_CURRENT_RUN_ISSUER_AND_ALL_NINE_BUSINESS_EVENTS_VERIFIED'),'prior signed business chain missing');
assert.ok(current.content.includes('F06_171_NATIVE_SIGNED_LOCK_LIFECYCLE_PASS'),'new native PG16 lifecycle scenarios missing');
assert.ok(current.content.includes('F06_171_NATIVE_PG16_NON_SUPERUSER'),'new non-superuser physical PG identity missing');
assert.ok(priority.content.includes('F06_171_PRIORITY_ORIGIN_REAL_PG16_FOUR_ACTIONS_PASS'),'real signed Priority-origin four-action PG16 matrix missing');
const nativeSource=readFileSync(new URL('./tests/原生Lifecycle验收.test.mjs',import.meta.url),'utf8');
assert.ok(!nativeSource.includes('priorityPool')&&!nativeSource.includes('只读适配器模拟Priority来源'),'mocked Priority source must not replace PG16 business integration');
const prioritySource=readFileSync(new URL('./tests/Priority来源真实PG16拒绝验收.test.mjs',import.meta.url),'utf8');
assert.ok(prioritySource.includes('f06_composite_v1.lock_snapshots'),'signed Lock snapshot is required');
assert.ok(current.content.includes('09A 权限撤销即时生效且Lock/签名事件/审计无变化'),'permission revocation fail-closed case missing');
assert.ok(current.content.includes('10A 伪造员工身份和Issuer请求头被拒且无副作用'),'forged identity fail-closed case missing');
assert.ok(signedNegative.content.includes('F06_171_SIGNED_SOURCE_NEGATIVE_BOUNDARIES_PASS'),'signed-source negative boundary matrix missing');
assert.ok(signedNegative.content.includes('F06_171_NEGATIVE_PROFILE_BRANCH_BINDING_PASS'),'exact old/new signed profile branch binding missing');
for(const marker of [
 '01 新profile只映射到本Issue精确真实分支',
 '02 错误Ref与分支名不一致必须拒绝',
 '03 非Push事件不能签发',
 '04 当前Git HEAD与签名SHA不一致必须拒绝',
 '05 无效Run ID不能签发',
 '06 非40位SHA不能签发',
 '07 真实PG16隔离库错误物理OID Attestation必须拒绝',
 '08 真实PG16隔离库签名源码摘要漂移必须拒绝',
 '09 真实PG16隔离库24迁移账本摘要不一致必须拒绝',
 '10 真实PG16隔离库父F05结构签名摘要不一致必须拒绝',
 '11 真实PG16隔离库Lifecycle父签名摘要不一致必须拒绝',
 '12 真实PG16隔离库Lifecycle源码摘要漂移必须拒绝',
 '13 真实PG16隔离库Lifecycle物理OID漂移必须拒绝',
 '14 真实PG16隔离库Lifecycle Run ID漂移必须拒绝'
])assert.ok(signedNegative.content.includes(marker),'missing executed signed-source boundary: '+marker);
assert.ok(legacy.content.includes('F06_164_LEGACY_AUDIT_DB_PASS'),'old CI_LEGACY native audit compatibility missing');
const parent=log('../nonprod-single-runtime-integration/evidence/父链签名与初始化.log');
assert.ok(parent.includes('F06_171_V23_CURRENT_MATCHES_SEEDED'),'official signed v23 F05-7 Match preseed missing');
assert.ok(parent.includes('F06_171_V24_PRIORITY_SEEDED'),'official signed v24 F05-8 Priority preseed missing');
const before=log('../nonprod-single-runtime-integration/evidence/父表161迁移24Seal前置证据.log');
const after=log('../nonprod-single-runtime-integration/evidence/父表161迁移24Seal恢复证据.log');
for(const marker of ['F06_164_SIGNED_COMPOSITE_ISSUER_ATTESTED','F06_164_FIVE_NATIVE_PARENT_SCHEMA_STEPS_SIGNED_NO_LEGACY_REF_SPOOF'])
 assert.ok(parent.includes(marker),'native signed parent missing '+marker);
const b=before.match(/F06_164_PARENT_161_TABLE_24_LEDGER_CROSS_OID_BASELINE_PASS (\{[^\n]+\})/);
const a=after.match(/F06_164_DIFFERENT_OID_161_TABLE_24_LEDGER_SEAL_PASS (\{[^\n]+\})/);
assert.ok(b&&a,'native independent physical OID seals missing');
const base=JSON.parse(b[1]),seal=JSON.parse(a[1]);
assert.equal(seal.sha,sha);assert.equal(seal.runId,run);
assert.equal(seal.tableCount,161);assert.equal(seal.migrationCount,24);
assert.equal(base.tableCount,161);assert.equal(base.migrationCount,24);
assert.notEqual(String(seal.sourceOidBefore),String(seal.baselineOid));
assert.notEqual(String(seal.sourceOidBefore),String(seal.restoreOid));
assert.notEqual(String(seal.baselineOid),String(seal.restoreOid));
assert.equal(seal.sourceBaselineSeal,seal.baselineSeal);
assert.equal(seal.baselineSeal,seal.restoredSeal);
assert.equal(seal.unauthorizedParentDrift,false,'modified immutable parent tables detected');
console.log('F06_171_FULL_SIGNED_NATIVE_PG16_PASS',JSON.stringify({
 sha,runId:run,nativeLifecycleCases:current.tests,previousCompositeCases:previous.tests,
 legacyAuditCases:legacy.tests,legacyLifecycleNodeCases:legacyService.tests+legacyHttp.tests,legacyLifecycleNativeCases:legacyNative.tests,parentTables:161,signedMigrations:24,crossOidSeal:true,
 oidBefore:seal.sourceOidBefore,oidBaseline:seal.baselineOid,oidRestore:seal.restoreOid,
 parentSeal:seal.baselineSeal,productionReady:false,status:'READY_FOR_A_REVIEW'
}));
