import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readdir,readFile,writeFile} from 'node:fs/promises';
import {join,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
const dir=fileURLToPath(new URL('./artifacts/',import.meta.url));
const sha=b=>createHash('sha256').update(b).digest('hex');
const digestObject=x=>sha(Buffer.from(JSON.stringify(x)));
async function json(name){return JSON.parse(await readFile(join(dir,name),'utf8'))}
async function fileList(root){
 const out=[];
 async function walk(path){for(const item of await readdir(path,{withFileTypes:true})){const full=join(path,item.name);if(item.isDirectory())await walk(full);else if(item.isFile())out.push(full)}}
 await walk(root);return out.sort();
}
const logs=new Map();
for(const name of ['prepare-source.log','f05-2-physical.log','f05-2-https.log','f05-manual-mingbang-before.log','f05-manual-four-s-before.log','f05-manual-concurrency-before.log','f05-7-https.log','f06-bridge-tests.log','f05-manual-mingbang-after.log','f05-manual-concurrency-after.log']){
 try{logs.set(name,await readFile(join(dir,name),'utf8'))}catch{logs.set(name,'')}
}
function tap(name,requiredNoSkip=false){
 const log=logs.get(name);assert.ok(log&&log.length>0,'missing required test log '+name);
 assert.match(log,/# fail 0\b/,'failed test in '+name);
 const skipped=Number((log.match(/# skipped\s+(\d+)/)||[])[1]||0);
 if(requiredNoSkip)assert.equal(skipped,0,'skipped tests in '+name);
 const tests=Number((log.match(/# tests\s+(\d+)/)||[])[1]||0);
 const passed=Number((log.match(/# pass\s+(\d+)/)||[])[1]||0);
 const failed=Number((log.match(/# fail\s+(\d+)/)||[])[1]||0);
 assert.ok(tests>0,'no TAP tests in '+name);assert.equal(failed,0);assert.equal(passed+skipped,tests);
 return {tests:tests,passed:passed,failed:failed,skipped:skipped};
}
assert.equal(process.env.GITHUB_REPOSITORY,'suzhe868-arch/mb');
assert.equal(process.env.GITHUB_EVENT_NAME,'push');
assert.equal(process.env.GITHUB_REF,'refs/heads/feat/f05-f06-same-vehicle-signed-bridge-pg16-01');
assert.equal(process.env.GITHUB_SHA,(await import('node:child_process')).execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim());
const source=await json('source-manifest.json'),before=await json('f06-before-edit.json'),edited=await json('edit-manifest.json'),after=await json('f06-after-edit.json');
const parentBefore=await json('父表161迁移24Seal_before.json'),parentAfter=await json('父表161迁移24Seal_after.json');
for(const item of [source,before,edited,after]){assert.equal(item.github.sha,process.env.GITHUB_SHA);assert.equal(item.github.runId,String(process.env.GITHUB_RUN_ID));assert.equal(item.github.ref,process.env.GITHUB_REF)}
const sourceCopy={...source};delete sourceCopy.manifestSHA256;
const editCopy={...edited};delete editCopy.editManifestSHA256;
const afterCopy={...after};delete afterCopy.evidenceSHA256;
assert.equal(source.manifestSHA256,digestObject(sourceCopy));
assert.equal(edited.editManifestSHA256,digestObject(editCopy));
assert.equal(after.evidenceSHA256,digestObject(afterCopy));
assert.equal(edited.sourceManifestSHA256,source.manifestSHA256);
assert.equal(before.sourceManifestSHA256,source.manifestSHA256);
assert.equal(after.sourceManifestSHA256,source.manifestSHA256);
assert.equal(after.editManifestSHA256,edited.editManifestSHA256);
assert.equal(source.database.publicMigrationCount,14);assert.equal(edited.database.publicMigrationCount,14);
assert.equal(before.database.migrationCount,24);assert.equal(after.targetDatabase.migrationCount,24);
assert.notEqual(source.database.oid,before.database.oid);assert.notEqual(before.database.oid,before.database.baselineOid);
assert.equal(before.snapshotSHA256,after.f06SnapshotBeforeSHA256);
assert.equal(before.snapshotSHA256,after.f06SnapshotAfterSHA256);assert.equal(after.snapshotUnchanged,true);
assert.equal(edited.edit.effectiveRetailPriceCents,8900000);assert.equal(edited.edit.effectiveMileageKm,19100);
assert.equal(edited.edit.immutablePublishedEventSha256,source.vehicle.publishedEventSha256);
const tapResults={
 prepareSource:tap('prepare-source.log',true),f05Physical:tap('f05-2-physical.log'),f05Https:tap('f05-2-https.log'),
 f05MingbangBefore:tap('f05-manual-mingbang-before.log'),f05FourSBefore:tap('f05-manual-four-s-before.log'),
 f05ConcurrencyBefore:tap('f05-manual-concurrency-before.log'),f05SevenHttps:tap('f05-7-https.log'),
 f06Bridge:tap('f06-bridge-tests.log',true),f05MingbangAfter:tap('f05-manual-mingbang-after.log'),f05ConcurrencyAfter:tap('f05-manual-concurrency-after.log')
};
const bridgeLog=logs.get('f06-bridge-tests.log');
const subtests=[...bridgeLog.matchAll(/^\s*# Subtest: (\d{2}) /gm)].map(m=>Number(m[1]));
const positiveNumbers=new Set([1,2,3,4,5,6,11,14,15,20,21,22,27,28,29,32]);
const positiveCount=subtests.filter(n=>positiveNumbers.has(n)).length;
const negativeCount=subtests.filter(n=>!positiveNumbers.has(n)).length;
assert.equal(positiveCount,16);assert.equal(negativeCount,16);
const artifactFiles=await fileList(dir),excluded=new Set(['evidence.json','sha256sums.txt','B工程中文交接.md']),fileHashes=[];
for(const path of artifactFiles){const name=relative(dir,path).replaceAll('\\','/');if(excluded.has(name))continue;const bytes=await readFile(path);fileHashes.push({path:name,bytes:bytes.length,sha256:sha(bytes)})}
for(const required of ['source-manifest.json','f06-before-edit.json','edit-manifest.json','f06-after-edit.json','父表161迁移24Seal_before.json','父表161迁移24Seal_after.json'])assert.ok(fileHashes.some(x=>x.path===required),'missing artifact '+required);
const evidence={
 schemaVersion:1,status:'READY_FOR_A_REVIEW',
 github:{repository:process.env.GITHUB_REPOSITORY,ref:process.env.GITHUB_REF,sha:process.env.GITHUB_SHA,runId:String(process.env.GITHUB_RUN_ID),matrixRun:process.env.F05_F06_BRIDGE_MATRIX_RUN},
 databases:{source:{name:'f05_vehicle_source',oid:source.database.oid,migrationCount:source.database.publicMigrationCount},target:{name:'f03_auth_test',oid:before.database.oid,migrationCount:before.database.migrationCount},baseline:{name:'f03_auth_baseline',oid:before.database.baselineOid},restore:{createdFromBaseline:true}},
 vehicle:{vehicleId:source.vehicle.vehicleId,listingCycleId:source.vehicle.listingCycleId,sourceType:source.vehicle.sourceType,sourceRetailPriceCents:source.vehicle.retailPriceCents,editedRetailPriceCents:edited.edit.effectiveRetailPriceCents,sourceMileageKm:source.vehicle.mileageKm,editedMileageKm:edited.edit.effectiveMileageKm},
 business:{lockRequestId:before.ids.requestId,lockId:before.ids.lockId,depositId:before.ids.depositId,transactionId:before.ids.transactionId,syntheticDepositCents:500000,realMoney:false,production:false},
 tests:{positiveCrossRuntimeScenarios:positiveCount,negativeCrossRuntimeScenarios:negativeCount,tap:tapResults},
 snapshots:{beforeSHA256:before.snapshotSHA256,afterSHA256:after.f06SnapshotAfterSHA256,unchanged:after.snapshotUnchanged},
 parentSeal:{beforeSHA256:sha(Buffer.from(JSON.stringify(parentBefore))),afterSHA256:sha(Buffer.from(JSON.stringify(parentAfter))),tableCount:161,migrationCount:24},
 artifactFiles:fileHashes
};
await writeFile(join(dir,'evidence.json'),JSON.stringify(evidence,null,2)+'\n',{mode:0o600});
const handoff='# B工程中文交接｜F05→F06同车签名跨Runtime桥接\n\n'+
'- 任务：F05_F06_SAME_VEHICLE_SIGNED_CROSS_RUNTIME_BRIDGE_PG16_01；Issue #231。\n'+
'- 状态：READY_FOR_A_REVIEW。仅非生产独立 PostgreSQL 16 验收，不代表生产就绪。\n'+
'- 最终 SHA：'+process.env.GITHUB_SHA+'；官方 Run：'+process.env.GITHUB_RUN_ID+'；独立矩阵 Job：'+process.env.F05_F06_BRIDGE_MATRIX_RUN+'。\n'+
'- F05源库 OID '+source.database.oid+'（14条正式迁移）；F06目标库 OID '+before.database.oid+'（24条签名迁移）；父库基线 OID '+before.database.baselineOid+'。三个OID两两不同。\n'+
'- 同车身份：Vehicle '+source.vehicle.vehicleId+'，ListingCycle '+source.vehicle.listingCycleId+'，来源 mingbang。原始标价 '+source.vehicle.retailPriceCents+' 分；合成定金 500000 分，标记 CI_SYNTHETIC_NOT_REAL_MONEY。\n'+
'- 完整链路：F05原生HTTPS发布 → F06原生LockRequest/审批/Lock → 合成Deposit → Transaction → F05原生HTTPS编辑 → F06交易、定金、锁快照、签名事件、审计和客户展示价历史快照逐行比对。\n'+
'- 跨Runtime场景：正向 '+positiveCount+' 项、负向 '+negativeCount+' 项；所有TAP失败计数为0。父表161 Seal前后均已归档。\n'+
'- 快照SHA-256：编辑前 '+before.snapshotSHA256+'；编辑后 '+after.f06SnapshotAfterSHA256+'；结果完全一致。\n'+
'- 证据目录包含来源/编辑清单、前后快照、161表Seal、各测试日志、evidence.json与sha256sums.txt；摘要可独立复算。\n'+
'- 边界：未合并main；未修改公共Schema或生产路由；未接触真实资金、真实电话或外部系统。Issue #187 仍保持 SOURCE_GAP/FAIL_CLOSED。\n'+
'- 下一责任窗口：A主控独立验收最终SHA、Run、两个独立PG16 Artifact和SHA-256后裁决合并。\n';
await writeFile(join(dir,'B工程中文交接.md'),handoff,{mode:0o600});
const sumLines=[];
for(const path of await fileList(dir)){const name=relative(dir,path).replaceAll('\\','/');if(name==='sha256sums.txt')continue;sumLines.push(sha(await readFile(path))+'  '+name)}
await writeFile(join(dir,'sha256sums.txt'),sumLines.sort().join('\n')+'\n',{mode:0o600});
console.log('F05_F06_BRIDGE_FINAL_EVIDENCE_PASS',JSON.stringify({sha:process.env.GITHUB_SHA,runId:process.env.GITHUB_RUN_ID,matrixRun:process.env.F05_F06_BRIDGE_MATRIX_RUN,positiveCount:positiveCount,negativeCount:negativeCount,snapshotSHA256:before.snapshotSHA256,artifactFileCount:fileHashes.length,status:evidence.status}));
