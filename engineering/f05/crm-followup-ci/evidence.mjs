import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {assertEnvironment,connect} from './environment.mjs';
import {verifyScopeDatabase} from '../../f03/runtime-scope/readiness.mjs';
const digest=x=>createHash('sha256').update(x).digest('hex');
assertEnvironment();
assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),process.env.GITHUB_SHA);
const files=[
 'engineering/f05/crm-followup-ci/README.md',
 'engineering/f05/crm-followup-ci/environment.mjs',
 'engineering/f05/crm-followup-ci/fixtures.mjs',
 'engineering/f05/crm-followup-ci/tests/business.test.mjs',
 'engineering/f05/crm-followup-ci/tests/https.test.mjs',
 'engineering/f05/crm-followup-ci/tests/account-inactive-regression.test.mjs',
 'engineering/f05/crm-followup-ci/evidence.mjs',
 'engineering/src/f05-crm-followup-service.mjs',
 'engineering/src/f05-crm-followup-http.mjs',
 'engineering/src/app.mjs',
 '.github/workflows/f05-crm-followup-pg16.yml',
 'f05-crm-business.log',
 'f05-crm-https.log',
 'f05-crm-node.log',
 'f05-crm-scope-regression.log',
 'f05-crm-account-regression.log'
];
function summarize(path){
 const s=execFileSync('cat',[path],{encoding:'utf8'});
 const a=[...s.matchAll(/# tests\s+(\d+)[\s\S]*?# pass\s+(\d+)[\s\S]*?# fail\s+(\d+)(?:[\s\S]*?# skipped\s+(\d+))?/g)].at(-1);
 assert.ok(a,'TAP_TOTAL_MISSING '+path);
 const x={tests:Number(a[1]),pass:Number(a[2]),fail:Number(a[3]),skipped:Number(a[4]||0)};
 assert.ok(x.tests>0);assert.equal(x.pass,x.tests);assert.equal(x.fail,0);assert.equal(x.skipped,0);return x;
}
const tests={business:summarize('f05-crm-business.log'),https:summarize('f05-crm-https.log'),node:summarize('f05-crm-node.log')};
assert.ok(tests.business.tests>=24);assert.ok(tests.https.tests>=10);
const db=await connect();let checked;
try{
 checked=await verifyScopeDatabase(db);
 const a=(await db.query("SELECT count(*)::int n FROM public.audit_events WHERE role_context->>'source'='CI_ONLY_F05_CRM_FOLLOWUP_APPEND'")).rows[0].n;
 const b=(await db.query("SELECT count(*)::int n FROM public.crm_followups")).rows[0].n;
 assert.ok(a>=1&&b>=1);checked={verified:true,syntheticAuditCount:a,syntheticFollowupCount:b};
}finally{await db.end()}
const checks=[];
for(const path of files){const bytes=await readFile(path);checks.push({path,sha256:digest(bytes),bytes:bytes.length})}
const proof={
 task:'F05_CRM_FOLLOWUP_APPEND_HTTP_PG16_01',state:'B_SELF_TESTED/READY_FOR_A_REVIEW',
 scope:'CI_ONLY_F05_CRM_FOLLOWUP_APPEND',
 github:{repo:process.env.GITHUB_REPOSITORY,sha:process.env.GITHUB_SHA,runId:process.env.GITHUB_RUN_ID,ref:process.env.GITHUB_REF,track:process.env.F05_CRM_TRACK,attempt:process.env.GITHUB_RUN_ATTEMPT},
 checked,tests,files:checks,
 boundaries:{productionPermissionIssuer:'CI_ONLY_SYNTHETIC_PERMISSION/PRODUCTION_NOT_CONNECTED_SOURCE_GAP',
 correctionVoid:'NOT_CONNECTED',otherDomainRuntime:'NOT_CONNECTED',
 issue187:'SOURCE_GAP/FAIL_CLOSED',f06F07F08V1:'NOT_READY/NO_PRODUCTION',
 publicDDLChanged:false,productionHandler:false,externalConnected:false}
};
await writeFile('f05-crm-evidence.json',JSON.stringify(proof,null,2)+'\n',{mode:0o600});
const note='# B工程交接｜F05 CRM 跟进追加写入真实PG16非生产纵切\n\n'+
'- Issue #239，B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A。\n'+
'- 最终提交 '+process.env.GITHUB_SHA+'，官方 Push Run '+process.env.GITHUB_RUN_ID+'，分支 '+process.env.GITHUB_REF+'，独立轨 '+process.env.F05_CRM_TRACK+'。\n'+
'- 真实 PG16 非超级用户身份、F03 会话与 Customer object scope、Current owner/有效 Collaboration、4S/System Admin 拒绝、顾问撤权、账号 inactive、Demand 同客关系、幂等审计、同事务故障回滚、真实 TLS/CSRF/JSON 负例详见 ZIP 内真实日志。\n'+
'- business='+JSON.stringify(tests.business)+'，https='+JSON.stringify(tests.https)+'，Node='+JSON.stringify(tests.node)+'。\n'+
'- 本包使用 crm.followup.create 仅合成测试权限，PRODUCTION_NOT_CONNECTED_SOURCE_GAP；未取得正式 CRM 权限正向 Issuer，不授权上线。\n'+
'- 既有 F03 Account Status 专用 fixture/服务被其历史工作流的 GITHUB_REF 正式封印，**未重放该原业务套件**；本包仅在自身真实 PG16 对公共 Customer inactive/restore 兼容不变量运行独立回归，不冒称原 Issue #235 测试重新通过。\n'+
'- 历史更正/作废不能证明正式关联，correction/void=NOT_CONNECTED，不修改旧记录；普通 CRM Follow-up 不构成 Consultation 首次人工响应 SLA。\n'+
'- 未连接 F07 / 正式 CRM/外部业务 Source，Issue #187 SOURCE_GAP/FAIL_CLOSED，F06/F07/F08/V1 NOT_READY/NO_PRODUCTION，无外部电话/资金/生产/PC/C。\n'+
'- A 须下载并独立复算两份 ZIP 的逐文件 SHA256、ref/head/run/track 和真实日志，B 不自行合并 main。\n';
await writeFile('engineering/f05/crm-followup-ci/B工程交接.md',note,{mode:0o600});
const all=[...checks,{path:'f05-crm-evidence.json',sha256:digest(await readFile('f05-crm-evidence.json'))},{path:'engineering/f05/crm-followup-ci/B工程交接.md',sha256:digest(Buffer.from(note))}];
await writeFile('f05-crm-sha256sums.txt',all.map(f=>f.sha256+'  '+f.path).join('\n')+'\n',{mode:0o600});
console.log('F05_CRM_FINAL_EVIDENCE_PASS',JSON.stringify({sha:process.env.GITHUB_SHA,run:process.env.GITHUB_RUN_ID,track:process.env.F05_CRM_TRACK,tests,manifest:all.length}));
