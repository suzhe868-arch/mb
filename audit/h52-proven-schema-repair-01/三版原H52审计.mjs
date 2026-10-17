import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import cp from 'node:child_process';
const workflow='.github/workflows/f05-7-frozen-h52-revalidation.yml';
export const blobs={
  main:'687a9f767b0d0b144372550735da6159066b4833',
  failure:'3a13bab79b4e45fb4e037a1d6fd4431593506148',
  source:'eda68ce30bbccfa802f459e009ef0a6889918648'
};
export const refs={
  main:'HEAD',
  failure:'bf9c698fabff721a52154fba662dc9b230d9a319',
  source:'99c38d013f67cc56975f1664120fb87c204afc3c'
};
const run=(bin,args,opts={})=>{
  const r=cp.spawnSync(bin,args,{encoding:'utf8',maxBuffer:32*1024*1024,timeout:90000,...opts});
  if(r.error)throw r.error;
  return {code:r.status,stdout:r.stdout||'',stderr:r.stderr||'',signal:r.signal};
};
export function structural(yaml){
  const lines=yaml.split('\n');
  const start=yaml.search(/^jobs:\s*$/m);
  if(start<0)throw Error('缺少顶层jobs，禁止把无效YAML记为有效');
  const jobs=[...yaml.slice(start).matchAll(/^  ([a-zA-Z_][a-zA-Z0-9_-]*):[^\n]*$/gm)].map(x=>x[1]);
  const anchor=(yaml.match(/- run:\s*&z\b/g)||[]).length;
  const alias=(yaml.match(/- run:\s*\*z\b/g)||[]).length;
  const services=(yaml.match(/^    services:\s*$/gm)||[]).length;
  const guards=(yaml.match(/git push origin HEAD:refs\/heads\/feat\/f03-/g)||[]).length;
  const read=(yaml.match(/^\s+contents:\s*read\s*$/gm)||[]).length;
  const write=(yaml.match(/^\s+contents:\s*write\s*$/gm)||[]).length;
  const bytes=Buffer.byteLength(yaml,'utf8');
  return {bytes,jobs:jobs.length,unique_jobs:new Set(jobs).size,services,guards,anchor,alias,read,write,trigger:lines[0]};
}
export function assertMainInvariants(yaml){
  const x=structural(yaml);
  for(const [k,v] of Object.entries({bytes:511380,jobs:52,unique_jobs:52,services:50,guards:30,anchor:1,alias:49,write:0})){
    if(x[k]!==v)throw Error('当前main原H52结构漂移: '+k+' expected='+v+' actual='+x[k]);
  }
  if(!yaml.startsWith('on: {push: {branches: feat/f05-7-deterministic-matching-readiness-four-*}}'))throw Error('触发原ref意外改变');
  return x;
}
export function isConcreteSchemaProblem(report){
  return report && report.code===1 && report.issues.length>0
    && report.issues.some(x=>x.kind==='syntax-check'||x.kind==='expression'||x.kind==='workflow');
}
function parseIssues(output){
  const lines=output.split('\n').filter(x=>x.trim().startsWith('{'));
  return lines.map(line=>{try{return JSON.parse(line)}catch{return {kind:'UNPARSEABLE_OUTPUT',message:line}}});
}
export function execute(){
  if(process.env.GITHUB_REF_NAME!=='fix/f05-7-h52-proven-schema-minimal-01')throw Error('拒绝在非获批独立分支上审计');
  const lint='/tmp/actionlint-pinned/actionlint';
  const version=run(lint,['-version']);
  if(version.code!==0||!version.stdout.includes('1.7.12'))throw Error('actionlint v1.7.12未受可信校验');
  const evidence='audit/h52-proven-schema-repair-01/ci-evidence';
  fs.mkdirSync(evidence,{recursive:true});
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'h52-original-schema-'));
  const reports={};
  for(const label of ['failure','source','main']){
    const ref=refs[label];
    const show=run('git',['show',ref+':'+workflow]);
    if(show.code!==0)throw Error('无法读取冻结历史原Blob '+label+' '+show.stderr);
    const file=path.join(temp,label+'.yml');
    fs.writeFileSync(file,show.stdout,'utf8');
    const sha=run('git',['hash-object',file]);
    if(sha.code!==0||sha.stdout.trim()!==blobs[label])throw Error('Git Blob原字节不匹配: '+label+' '+sha.stdout.trim());
    const structure=structural(show.stdout);
    if(label==='main')assertMainInvariants(show.stdout);
    if(structure.jobs!==52||structure.unique_jobs!==52)throw Error(label+'的52Job键错误');
    const args=['-shellcheck=','-pyflakes=','-format','{{range $err := .}}{{json $err}}{{end}}',file];
    const linted=run(lint,args);
    if(![0,1].includes(linted.code))throw Error('actionlint运行环境/工具异常:'+label+' '+linted.stderr);
    const issues=parseIssues(linted.stdout);
    if(linted.code===1&&issues.length===0)throw Error('actionlint非零结果无法结构化审计:'+label+' '+linted.stdout.slice(0,1000));
    fs.writeFileSync(path.join(evidence,label+'-actionlint.stdout.txt'),linted.stdout||'(无lint错误)\n');
    fs.writeFileSync(path.join(evidence,label+'-actionlint.stderr.txt'),linted.stderr||'(无stderr)\n');
    reports[label]={ref,blob:sha.stdout.trim(),structure,code:linted.code,issue_count:issues.length,issues:issues.map(i=>({kind:i.kind,line:i.line,column:i.column,message:i.message})),tool_args:args.slice(0,-1).concat('[INPUT_YAML_OMITTED_FROM_ARTIFACT]')};
    console.log('H52_ACTIONLINT_VERSION',label,'BLOB',reports[label].blob,'RC',linted.code,'ISSUES',issues.length);
    for(const e of reports[label].issues.slice(0,8))console.log('H52_LINT_DIAGNOSTIC',label,JSON.stringify(e));
  }
  const summary={
    status:'STATIC_ONLY_NO_ORIGINAL_JOB_EXECUTED',
    actionlint_version:version.stdout.trim(),
    download_sha256:'8aca8db96f1b94770f1b0d72b6dddcb1ebb8123cb3712530b08cc387b349a3d8',
    github_sha:process.env.GITHUB_SHA,
    original_52_job_scheduler:'NOT_PROVEN',
    official_0_job_root_cause:'UNKNOWN',
    historical_failure_run:38958160214,
    original_source_ref_unchanged:true,
    source_gap_open:true,
    phase2_push_authorized:false,
    reports
  };
  const historicSyntax=reports.failure.issues.filter(x=>x.kind==='syntax-check'&&x.line===34);
  if(reports.failure.code!==1||historicSyntax.length!==2)throw Error('历史失败版第34行预期两项schema错误未复现，必须停止并人工复核');
  if(reports.source.code!==0||reports.main.code!==0)throw Error('来源或main仍有Actionlint错误，禁止冒充已消除');
  summary.historical_schema_error_reproduced=true;
  summary.main_actionlint_clean=true;
  summary.source_actionlint_clean=true;
  summary.schema_findings_current=isConcreteSchemaProblem(reports.main);
  summary.repair_authorized_automatically=false;
  summary.h52_modified=false;
  summary.decision='HISTORICAL_SCHEMA_ERROR_PROVEN_CURRENT_MAIN_CLEAN_NO_H52_PATCH';
  fs.writeFileSync(path.join(evidence,'三版实证结果.json'),JSON.stringify(summary,null,2)+'\n');
  console.log('H52_THREE_VERSION_AUDIT_COMPLETED',JSON.stringify({head:summary.github_sha,main:reports.main.issue_count,failure:reports.failure.issue_count,source:reports.source.issue_count,decision:summary.decision}));
}
if(process.argv.includes('--execute'))execute();
