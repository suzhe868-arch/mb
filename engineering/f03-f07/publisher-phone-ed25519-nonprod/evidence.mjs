import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile,readdir,stat} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {join,relative} from 'node:path';
import {connectPools} from './environment.mjs';

const ROOT='engineering/f03-f07/publisher-phone-ed25519-nonprod';
const WORKFLOW='.github/workflows/f03-f07-publisher-phone-ed25519-nonprod.yml';
const track=process.env.F03_F07_TRACK;
const LOGS=track==='business'?['f03-f07-business.log']:track==='https'?['f03-f07-https.log']:[];
const hash=x=>createHash('sha256').update(x).digest('hex');
const exists=async path=>{try{await stat(path);return true}catch{return false}};
async function walk(dir){
 const out=[];
 for(const entry of await readdir(dir,{withFileTypes:true})){
  const path=join(dir,entry.name);
  if(entry.isDirectory())out.push(...await walk(path));else out.push(path);
 }
 return out;
}
function parseTap(content,prefix){
 const number=(label)=>Number(content.match(new RegExp('^# '+label+'\\s+(\\d+)\\s*$','m'))?.[1]??0);
 const tests=number('tests'),pass=number('pass'),fail=number('fail'),skipped=number('skipped');
 const cases=[];
 for(const line of content.split(/\r?\n/)){
  const m=/^(ok|not ok)\s+\d+\s+-\s+((?:B|H)\d{2})\s+(.+?)(?:\s+#\s*SKIP.*)?$/.exec(line);
  if(m&&m[2].startsWith(prefix))cases.push({id:m[2],scenario:m[3],result:m[1]==='ok'?'PASS':'FAIL',skipped:/#\s*SKIP/.test(line)});
 }
 return {tests,pass,fail,skipped,cases};
}
let evidenceStatus=LOGS.length?'PASS':'FAIL',database={ok:false,code:'DATABASE_EVIDENCE_UNAVAILABLE'};
let identities=null;
try{
 const p=await connectPools();
 identities={F03:p.identityF03,F07:p.identityF07};
 database={ok:true,identities};
 await Promise.all([p.f03.end(),p.f07.end()]);
}catch{evidenceStatus='FAIL'}
const tap={};
for(let i=0;i<LOGS.length;i++){
 const path=LOGS[i];
 if(!await exists(path)){tap[path]={tests:0,pass:0,fail:1,skipped:0,cases:[]};evidenceStatus='FAIL';continue}
 const raw=await readFile(path,'utf8');
 tap[path]=parseTap(raw,track==='business'?'B':'H');
 if(tap[path].tests!==tap[path].pass||tap[path].fail!==0||tap[path].skipped!==0)evidenceStatus='FAIL';
}
const activeTap=tap[LOGS[0]];
const minimum=track==='business'?24:12;
const expectedCount=track==='business'?30:22;
if(!activeTap||activeTap.tests<minimum||activeTap.cases.length!==activeTap.tests||activeTap.tests!==expectedCount)evidenceStatus='FAIL';
if(!database.ok)evidenceStatus='FAIL';
const sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
if(sha!==process.env.GITHUB_SHA)evidenceStatus='FAIL';
const changed=execFileSync('git',['-c','core.quotePath=false','diff','--name-only','origin/main...HEAD'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
if(changed.some(p=>!(p.startsWith(ROOT+'/')||p===WORKFLOW)))evidenceStatus='FAIL';
let audit={status:'MISSING'};
try{audit=JSON.parse(await readFile('f03-f07-workflow-trigger-audit.txt','utf8'));if(audit.status!=='PASS'||audit.potential_f05_7_triggers?.length)evidenceStatus='FAIL'}catch{evidenceStatus='FAIL'}
const template=await readFile(join(ROOT,'测试矩阵.tsv'),'utf8');
const lines=template.trimEnd().split(/\r?\n/);
const templates=new Map(lines.slice(1).map(line=>{const c=line.split('\t');return [c[0],c]}));
const actual=[...activeTap.cases];
const matrixHeader='用例ID\t测试场景\t实际调用链\tPG16身份\t期望结果\t实际结果\t是否跳过\t最终SHA\tRun';
const matrixRows=actual.map(c=>{
 const base=templates.get(c.id);
 if(!base){evidenceStatus='FAIL';return [c.id,c.scenario,'未登记调用链','双PG16非超管','按断言',c.result,c.skipped?'是':'否',sha,process.env.GITHUB_RUN_ID].join('\t')}
 return [c.id,base[1],base[2],base[3],base[4],c.result,c.skipped?'是':'否',sha,process.env.GITHUB_RUN_ID].join('\t');
});
const matrix=matrixHeader+'\n'+matrixRows.join('\n')+'\n';
if(matrixRows.length!==expectedCount||matrixRows.some(line=>!line.includes('\tPASS\t否\t')))evidenceStatus='FAIL';
await writeFile(join(ROOT,'测试矩阵.tsv'),matrix);
const run=process.env.GITHUB_RUN_ID,attempt=process.env.GITHUB_RUN_ATTEMPT||'1',ref=process.env.GITHUB_REF;
const finalNote='# 最终运行交接｜F03→F07 Ed25519 限定非生产\n\n'+
'状态：'+evidenceStatus+'；轨道：'+track+'；任务：F03_F07_PUBLISHER_PHONE_ED25519_AUTH_NONPROD_01；Issue #248。\n\n'+
'- Repository：'+process.env.GITHUB_REPOSITORY+'\n- Branch：'+ref+'\n- Final HEAD：'+sha+'\n- Official Run：'+run+' / attempt '+attempt+'\n'+
'- PG16 identity：'+JSON.stringify(identities)+'\n- TAP：'+JSON.stringify(tap)+'\n'+
'- Workflow trigger audit：'+JSON.stringify({status:audit.status,scanned:audit.scanned_workflows,f05_7:audit.scanned_f05_7_workflows,candidates:audit.potential_f05_7_triggers})+'\n'+
'- Only allowed paths：'+JSON.stringify(changed)+'\n'+
'- F03/F07 protocol remains CI_SYNTHETIC_ONLY; ephemeral Ed25519 private key stayed in memory and is not an artifact.\n'+
'- No F05-7 historical 66/64 suite executed; no existing Guard/Runtime/public migration/app/server modified.\n'+
'- Formal issuer/source trust, real JYT/Collector/CDN/OSS/Feishu/phone, real customer/financial data and production are NOT_CONNECTED/NOT_AUTHORIZED. Issue #187 remains SOURCE_GAP/FAIL_CLOSED; F06/F07/F08/V1 remain NOT_READY/NO_PRODUCTION.\n';
await writeFile('最终运行交接.md',finalNote);
const allSource=await walk(ROOT);
const candidate=[...allSource,WORKFLOW,...LOGS,'f03-f07-workflow-trigger-audit.txt','最终运行交接.md'];
const unique=[...new Set(candidate)].filter(async()=>true);
const files=[];
for(const path of unique){
 if(!await exists(path)){evidenceStatus='FAIL';continue}
 const bytes=await readFile(path);files.push({path,bytes:bytes.length,sha256:hash(bytes)});
}
const sensitive=/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|__Host-mb_pc=[A-Za-z0-9_-]{43}|TEST-[0-9]{6}/;
for(const path of [...LOGS,'f03-f07-workflow-trigger-audit.txt','最终运行交接.md',join(ROOT,'测试矩阵.tsv')]){
 const raw=await readFile(path,'utf8');
 if(sensitive.test(raw))evidenceStatus='FAIL';
}
const proof={
 task:'F03_F07_PUBLISHER_PHONE_ED25519_AUTH_NONPROD_01',track,status:evidenceStatus,
 repository:process.env.GITHUB_REPOSITORY,branch:ref,sha,run,attempt,
 database,databaseIdentities:identities,tests:tap,
 workflowTriggerAudit:{status:audit.status,scannedWorkflows:audit.scanned_workflows,
  scannedF05_7Workflows:audit.scanned_f05_7_workflows,potentialF05_7Triggers:audit.potential_f05_7_triggers},
 changedPaths:changed,files,
 boundaries:{origin:'CI_SYNTHETIC_ONLY',formalSourceSigned:false,productionReady:false,
  privateKey:'EPHEMERAL_MEMORY_ONLY',publicSchemaChanged:false,existingF03F07GuardModified:false,
  f05_7Historical66Suite:'NOT_RUN',issue187:'SOURCE_GAP/FAIL_CLOSED',f06F07F08V1:'NOT_READY/NO_PRODUCTION'}
};
await writeFile('f03-f07-evidence.json',JSON.stringify(proof,null,2)+'\n');
const manifestFiles=[...files,{path:'f03-f07-evidence.json',bytes:(await stat('f03-f07-evidence.json')).size,sha256:hash(await readFile('f03-f07-evidence.json'))}];
await writeFile('f03-f07-sha256sums.txt',manifestFiles.map(f=>f.sha256+'  '+f.path).join('\n')+'\n');
const total=manifestFiles.reduce((sum,f)=>sum+f.bytes,0)+(await stat('f03-f07-sha256sums.txt')).size;
if(total>5*1024*1024)evidenceStatus='FAIL';
if(evidenceStatus!=='PASS')process.exitCode=1;
console.log('F03_F07_FINAL_EVIDENCE',JSON.stringify({status:evidenceStatus,sha,run,attempt,tests:tap,
 files:manifestFiles.length,estimatedArtifactBytes:total,triggerAudit:audit.status}));
