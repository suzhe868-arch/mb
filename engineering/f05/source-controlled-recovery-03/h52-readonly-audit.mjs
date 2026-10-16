import assert from 'node:assert/strict';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const ROOT='engineering/f05/deterministic-matching-readiness-four-tier/tests/https.test.mjs';
const H52='.github/workflows/f05-7-frozen-h52-revalidation.yml';
const F05ROOT='.github/workflows/';
const oldMain='77e252511643d837ddf829d633d798b6dca33eee';
const oldHttpsBlob='5fc9861b6341e4ee066c594c808557b321d9b95e';
const oldH52Blob='687a9f767b0d0b144372550735da6159066b4833';
const frozen=['f05-7-frozen-h52-revalidation.yml','f05-7-frozen-i2-revalidation.yml','f05-7-frozen-j2-revalidation.yml','f05-7-frozen-k2-revalidation.yml','f05-7-frozen-f05-4-2-revalidation.yml','f05-7-frozen-f05-5-2-revalidation.yml','f05-7-frozen-f05-6-2-revalidation.yml','f05-7-deterministic-matching-readiness-four-tier.yml'];
const sha=src=>{const b=Buffer.from(src,'utf8');return createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex')};
const count=(s,x)=>s.split(x).length-1;
const check=(condition,name)=>assert.ok(condition,'F05_7_PRE_PHASE2_DENY: '+name);
async function api(path,token){
 const res=await fetch('https://api.github.com/repos/suzhe868-arch/mb/'+path,{headers:{Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',Authorization:'Bearer '+token}});
 const data=await res.json();
 return {ok:res.ok,status:res.status,data};
}
export async function audit(token=process.env.GH_ACTIONS_READ_TOKEN){
 check(token?.length>12,'official metadata read token missing');
 const src=readFileSync(ROOT,'utf8');
 const h52=readFileSync(H52,'utf8');
 check(sha(h52)===oldH52Blob,'H52 must remain exact main original blob');
 const orig=await api('contents/'+ROOT+'?ref='+oldMain,token);
 check(orig.ok&&orig.data.sha===oldHttpsBlob&&orig.data.encoding==='base64','HTTPS approved original blob');
 const before=Buffer.from(orig.data.content.replace(/\s/g,''),'base64').toString('utf8');
 check(sha(before)===oldHttpsBlob,'Original HTTPS contents hash mismatch');
 // The A-authorized fix must preserve seven frozen B01-B07 denial tests byte for byte.
 const frozenStart="test('7-B01";
 check(src.includes(frozenStart)&&before.includes(frozenStart),'7 original B01-B07 missing');
 check(src.slice(src.indexOf(frozenStart))===before.slice(before.indexOf(frozenStart)),'7 denied assertion bodies mutated');
 check(src.slice(src.indexOf('const match='),src.indexOf('test.before('))===before.slice(before.indexOf('const match='),before.indexOf('test.before(')),'7 deny helper and route constants changed');
 check(count(src,"test('7-B")===7,'7 original HTTPS cases changed');
 check(src.includes("const origin='https://127.0.0.1:48988'"),'origin security constant modified');
 check(src.includes("host:new URL(origin).host,origin"),'loopback request Host/Origin invariant removed');
 check(src.includes("server.listen(0,'127.0.0.1',ok)"),'OS dynamic port not used');
 check(src.includes('port:transportPort'),'HTTP requests do not use actual bound port');
 check(src.includes("rejectUnauthorized:false"),'existing TLS self-signed trust behavior unexpectedly changed');
 check(!src.includes("server.listen(48988"),'fixed listener remains');
 check(!src.includes('F05_7_NOT_REGISTERED='),'Source condition altered');
 const all=frozen.map(x=>readFileSync(F05ROOT+x,'utf8'));
 const foundH52=all[0];
 check(foundH52===h52,'H52 read-only invariant');
 const jobStarts=(s)=>{const start=s.indexOf('\njobs:\n');check(start>=0,'jobs block missing');return [...s.slice(start+7).matchAll(/^  ([a-z][a-z0-9_-]+):(?=\s|$)/gm)].map(m=>m[1]);};
 const jobCounts=all.map(x=>jobStarts(x).length);
 check(jobCounts.join(',')==='52,2,2,2,2,2,2,2','8 workflows and 66 jobs invariant '+jobCounts.join(','));
 check(count(h52,'image: postgres:16-alpine')===50,'50 inherited PG16 jobs altered');
 check(count(h52,'- run: &z bash ')==1&&count(h52,'- run: *z')===49,'50 effective runner alias steps not preserved');
 check(count(h52,'contents: write')===0,'F03 write permission restored');
 check(count(h52,'git push origin HEAD:refs/heads/feat/f03-')===30,'Original F03 nested guarded pushes altered');
 check(h52.startsWith('on: {push: {branches: feat/f05-7-deterministic-matching-readiness-four-*}}'),'H52 old push trigger changed');
 check(count(all.slice(1,7).join('\n'),'image: postgres:16-alpine')===12,'12 further PG16 service jobs changed');
 check(sha(all[7])==='3f563fcc3137197f37c986963a3e48259d1f4626','main F05-7 workflow changed');
 const bytes=Buffer.byteLength(h52,'utf8');
 check(bytes<=512000,'H52 exceeds conservative 500 KiB workflow limit');
 const proof={marker:'F05_7_PHASE2_HTTPS_H52_PREFLIGHT_STATIC_PASS',testedSHA:process.env.GITHUB_SHA||'UNKNOWN',mainBaseline:oldMain, originalHttpsBlob:oldHttpsBlob, currentH52Blob:sha(h52),h52Bytes:bytes,h52Under500KiB:bytes<=512000,
 originalSevenDenialsByteIdentical:true,logicalCIOrigin:'https://127.0.0.1:48988',transport:'OS_ASSIGNED_LOOPBACK_PORT',
 workflowCount:8,historicalJobCount:66,jobCounts,legacyF03CrossBranchPermissionWrite:false,
 inheritedPG16Services:62,originalRefPushed:false,officialParentSourceVerified:false,h52GithubSchedulerProven:false};
 // Read-only official REST evidence, no old workflow execution.
 const oldRunId='38958160214';
 const run=await api('actions/runs/'+oldRunId,token);
 const jobs=await api('actions/runs/'+oldRunId+'/jobs?per_page=100',token);
 proof.oldZeroJobRun={id:oldRunId,ok:run.ok&&jobs.ok,head_sha:run.data?.head_sha,conclusion:run.data?.conclusion,
 jobCount:jobs.data?.total_count??null,workflow_id:run.data?.workflow_id??null};
 if (run.ok&&run.data.workflow_id){
  const wr=await api('actions/workflows/'+run.data.workflow_id,token);
  proof.officialWorkflowRegistry={ok:wr.ok,status:wr.status,state:wr.data?.state||null,path:wr.data?.path||null};
 }
 if (run.ok&&run.data.check_suite_id){
  const cr=await api('check-suites/'+run.data.check_suite_id+'/check-runs?per_page=100',token);
  proof.officialCheckSuite={ok:cr.ok,status:cr.status,count:cr.data?.total_count??null,
   results:cr.ok?(cr.data.check_runs||[]).map(x=>({name:x.name,conclusion:x.conclusion,title:x.output?.title,summary:x.output?.summary?.slice(0,250)})):[]};
 }
 mkdirSync('engineering/f05/source-controlled-recovery-03/artifacts',{recursive:true});
 writeFileSync('engineering/f05/source-controlled-recovery-03/artifacts/h52-readonly-audit.json',JSON.stringify(proof,null,2)+'\n');
 console.log(proof.marker,JSON.stringify({jobs:66,h52Bytes:bytes,workflowRegistry:proof.officialWorkflowRegistry,oldZeroJob:proof.oldZeroJobRun,githubSchedulingProven:false}));
 return proof;
}
if(process.argv[1]?.endsWith('h52-readonly-audit.mjs'))audit().catch(e=>{console.error(e);process.exitCode=1});
