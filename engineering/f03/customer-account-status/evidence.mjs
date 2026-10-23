import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {assertEnvironment,connect} from './environment.mjs';
import {verify} from './schema.mjs';
const digest=x=>createHash('sha256').update(x).digest('hex');
assertEnvironment();
assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),process.env.GITHUB_SHA);
const paths=[
 'engineering/f03/customer-account-status/environment.mjs',
 'engineering/f03/customer-account-status/schema.mjs',
 'engineering/f03/customer-account-status/fixtures.mjs',
 'engineering/f03/customer-account-status/tests/business.test.mjs',
 'engineering/f03/customer-account-status/tests/https.test.mjs',
 'engineering/f03/customer-account-status/README.md',
 'engineering/f03/customer-account-status/evidence.mjs',
 'engineering/src/f03-customer-account-status-service.mjs',
 'engineering/src/f03-customer-account-status-http.mjs',
 'engineering/src/app.mjs',
 '.github/workflows/f03-customer-account-status-pg16.yml',
 'f03-account-status-business.log',
 'f03-account-status-https.log',
 'f03-account-status-scope-regression.log',
 'f03-account-status-node.log'
];
const files=[];
for(const path of paths){const bytes=await readFile(path);files.push({path,sha256:digest(bytes),size:bytes.length})}
function tap(path){
 const text=execFileSync('cat',[path],{encoding:'utf8'});
 const get=k=>Number((text.match(new RegExp('# '+k+'\\s+(\\d+)'))||[])[1]||0);
 const results=[...text.matchAll(/# tests\s+(\d+)[\s\S]*?# pass\s+(\d+)[\s\S]*?# fail\s+(\d+)(?:[\s\S]*?# skipped\s+(\d+))?/g)];
 const last=results.at(-1);
 const total=last?{tests:Number(last[1]),pass:Number(last[2]),fail:Number(last[3]),skipped:Number(last[4]||0)}:{tests:get('tests'),pass:get('pass'),fail:get('fail'),skipped:get('skipped')};
 assert.ok(total.tests>0,'missing tests in '+path);assert.equal(total.fail,0);assert.equal(total.skipped,0);assert.equal(total.tests,total.pass);return total;
}
const results={business:tap('f03-account-status-business.log'),https:tap('f03-account-status-https.log'),node:tap('f03-account-status-node.log')};
const p=await connect();let database;
try{
 database=await verify(p);
 const rows=(await p.query("SELECT count(*)::int AS n FROM public.audit_events WHERE role_context->>'source'='CI_ONLY_F03_CUSTOMER_ACCOUNT_STATUS'")).rows;
 database.syntheticAuditCount=rows[0].n;
}finally{await p.end()}
const evidence={
 task:'F03_CUSTOMER_ACCOUNT_DISABLE_RESTORE_DEMAND_PAUSE_HTTP_PG16_01',
 state:'B_SELF_TESTED/READY_FOR_A_REVIEW',scope:'CI_ONLY_F03_CUSTOMER_ACCOUNT_STATUS',
 github:{repository:process.env.GITHUB_REPOSITORY,ref:process.env.GITHUB_REF,sha:process.env.GITHUB_SHA,
 runId:process.env.GITHUB_RUN_ID,runAttempt:process.env.GITHUB_RUN_ATTEMPT,job:process.env.GITHUB_JOB,track:process.env.F03_ACCOUNT_STATUS_TRACK},
 database,results,files,
 boundaries:{publicSchemaChanged:false,productionAuthorized:false,externalSystemsAuthorized:false,realFunds:false,
 parentIssue187:'SOURCE_GAP/FAIL_CLOSED',f06F07F08V1:'NOT_READY/NO_PRODUCTION',otherDomainGuards:'NOT_CONNECTED'}
};
await writeFile('f03-account-status-evidence.json',JSON.stringify(evidence,null,2)+'\n',{mode:0o600});
const note='# B 工程交接｜F03 客户账号状态与 Demand 原子暂停\n\n'+
'- Issue #235；状态：B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A。\n'+
'- 当前提交：'+process.env.GITHUB_SHA+'；官方 Run：'+process.env.GITHUB_RUN_ID+'；独立 PG16 轨：'+process.env.F03_ACCOUNT_STATUS_TRACK+'。\n'+
'- 真实 PG16、非超级用户、CI-only 的会话认证与权限、Customer/Demand 同事务、审计、幂等、撤权及 TLS 合同测试见同 SHA Artifact 日志。\n'+
'- 测试：business='+JSON.stringify(results.business)+'，HTTPS='+JSON.stringify(results.https)+'，Node='+JSON.stringify(results.node)+'。\n'+
'- 不改 public DDL/正式路由，客户关联其他 Domain 真实接线 NOT_CONNECTED。父 Issue #187 SOURCE_GAP/FAIL_CLOSED；F06/F07/F08/V1 NOT_READY/NO_PRODUCTION。\n'+
'- 两份 Artifact、内部 SHA256 清单应由 A 独立下载复核后才可标准合并。\n';
await writeFile('engineering/f03/customer-account-status/B工程中文交接.md',note,{mode:0o600});
const all=[...files,{path:'f03-account-status-evidence.json',sha256:digest(await readFile('f03-account-status-evidence.json'))},
 {path:'engineering/f03/customer-account-status/B工程中文交接.md',sha256:digest(Buffer.from(note))}];
await writeFile('f03-account-status-sha256sums.txt',all.map(x=>x.sha256+'  '+x.path).join('\n')+'\n',{mode:0o600});
console.log('F03_ACCOUNT_STATUS_FINAL_EVIDENCE_PASS',JSON.stringify({head:process.env.GITHUB_SHA,run:process.env.GITHUB_RUN_ID,track:process.env.F03_ACCOUNT_STATUS_TRACK,results,files:all.length}));
