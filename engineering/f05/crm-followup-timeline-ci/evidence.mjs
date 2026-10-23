import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {connect} from '../crm-followup-ci/environment.mjs';
import {verifyScopeDatabase} from '../../f03/runtime-scope/readiness.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
const paths=[
'engineering/src/f05-crm-followup-service.mjs',
'engineering/src/f05-crm-followup-http.mjs',
'engineering/f05/crm-followup-ci/environment.mjs',
'engineering/f05/crm-followup-timeline-ci/README.md',
'engineering/f05/crm-followup-timeline-ci/evidence.mjs',
'engineering/f05/crm-followup-timeline-ci/tests/business.test.mjs',
'engineering/f05/crm-followup-timeline-ci/tests/https.test.mjs',
'.github/workflows/f05-crm-followup-timeline-pg16.yml',
'f05-timeline-business.log','f05-timeline-https.log',
'f05-timeline-old-business.log','f05-timeline-old-https.log',
'f05-timeline-customer-regression.log','f05-timeline-scope-regression.log','f05-timeline-node.log'];
function tap(t){
 const matches=[...t.matchAll(/# tests\s+(\d+)[\s\S]*?# pass\s+(\d+)[\s\S]*?# fail\s+(\d+)(?:[\s\S]*?# skipped\s+(\d+))?/g)];
 const x=matches.at(-1);assert.ok(x);
 const r={tests:Number(x[1]),pass:Number(x[2]),fail:Number(x[3]),skipped:Number(x[4]||0)};
 assert.equal(r.tests,r.pass);assert.equal(r.fail,0);assert.equal(r.skipped,0);return r;
}
const tests={};
for(const [key,file] of Object.entries({business:'f05-timeline-business.log',https:'f05-timeline-https.log',
oldBusiness:'f05-timeline-old-business.log',oldHttps:'f05-timeline-old-https.log',
customer:'f05-timeline-customer-regression.log',node:'f05-timeline-node.log'}))
 tests[key]=tap((await readFile(file)).toString('utf8'));
assert.ok(tests.business.tests>=18&&tests.https.tests>=10);
assert.equal(tests.oldBusiness.tests,40);assert.equal(tests.oldHttps.tests,14);
assert.equal(tests.customer.tests,4);assert.ok(tests.node.tests>=269);
const pool=await connect();
try{await verifyScopeDatabase(pool)}
finally{await pool.end()}
const files=[];
for(const path of paths){const bytes=await readFile(path);files.push({path,sha256:hash(bytes)})}
const proof={task:'F05_CRM_FOLLOWUP_TIMELINE_LIST_HTTP_PG16_01',status:'READY_FOR_A_REVIEW',
github:{sha:process.env.GITHUB_SHA,ref:process.env.GITHUB_REF,run:process.env.GITHUB_RUN_ID,track:process.env.F05_CRM_TRACK},
tests,files,boundary:{production:false,permissionIssuer:'CI_ONLY_SYNTHETIC_PERMISSION',
oldF03AccountSuite:'NOT_RUN_BY_HISTORICAL_REF_SEAL',issue187:'SOURCE_GAP/FAIL_CLOSED',
f06F07F08V1:'NOT_READY/NO_PRODUCTION'}};
const evidence=JSON.stringify(proof,null,2)+'\n';
await writeFile('f05-timeline-evidence.json',evidence);
const note='# B工程交接｜F05 CRM Timeline Issue #243\n\n'+
'状态：B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A。\n'+
'HEAD='+process.env.GITHUB_SHA+'；RUN='+process.env.GITHUB_RUN_ID+'；TRACK='+process.env.F05_CRM_TRACK+'。\n'+
'真实 PG16、HTTPS、旧 CRM/Customer/SG01 和 Node 回归详见日志：'+JSON.stringify(tests)+'。\n'+
'列表只读，Customer object Scope、active、assigned owner、独立 CI 合成权限；历史旧记录不覆盖。\n'+
'旧 F03 #235 专有 Ref 套件 NOT_RUN_BY_HISTORICAL_REF_SEAL，不伪造运行。\n'+
'正式 CRM Issuer / correction / F07 Runtime NOT_CONNECTED；Issue #187 SOURCE_GAP/FAIL_CLOSED；'+
'F06/F07/F08/V1 NOT_READY/NO_PRODUCTION；无真实电话、资金、外部和生产授权。\n'+
'请 A 独立下载两份证据重新校验 GitHub ZIP digest 与内部所有文件哈希。\n';
await writeFile('engineering/f05/crm-followup-timeline-ci/B工程交接.md',note);
const listed=[...files,{path:'f05-timeline-evidence.json',sha256:hash(Buffer.from(evidence))},
{path:'engineering/f05/crm-followup-timeline-ci/B工程交接.md',sha256:hash(Buffer.from(note))}];
await writeFile('f05-timeline-sha256sums.txt',listed.map(x=>x.sha256+'  '+x.path).join('\n')+'\n');
console.log('F05_TIMELINE_FINAL_EVIDENCE_PASS',JSON.stringify({sha:process.env.GITHUB_SHA,track:process.env.F05_CRM_TRACK,tests,files:listed.length}));
