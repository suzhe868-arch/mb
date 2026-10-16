// F05-7 冻结PG16兼容补丁：只读源码/触发器/证据审计，非业务测试替代。
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export const BASE_SHA = '6b578b6f3e6728a7907a33ba92756a6a5cc7b557';
export const ORIGINAL_REF = 'refs/heads/feat/f05-7-deterministic-matching-readiness-four-tier';
export const IMAGE = 'public.ecr.aws/docker/library/postgres:16-alpine';
export const DOCKER_IMAGE = 'postgres:16-alpine';
export const ALIAS_SCRIPT = '$GITHUB_WORKSPACE/engineering/f05/source-controlled-recovery-02/pg16-local-alias.sh';
export const FILES = Object.freeze([
  ['f05-7-frozen-h52-revalidation.yml','eda68ce30bbccfa802f459e009ef0a6889918648',52,50],
  ['f05-7-frozen-i2-revalidation.yml','3273ca85dc01a22510d908e96948816c2c4e5a76',2,2],
  ['f05-7-frozen-j2-revalidation.yml','cf59473d3bfb38a8083e3a9cb2dafa8d32a36aa0',2,2],
  ['f05-7-frozen-k2-revalidation.yml','8e0fe494d6b9499f687aeed3be1ef6729cec6b26',2,2],
  ['f05-7-frozen-f05-4-2-revalidation.yml','e7da3c37811c8db74d58f8982b4f2ee739af1714',2,2],
  ['f05-7-frozen-f05-5-2-revalidation.yml','d10e15c9130163b72b5ee28aa40288d1231ffb4b',2,2],
  ['f05-7-frozen-f05-6-2-revalidation.yml','e8b346b8b481b12e7cb48b74d169d16e3ff42550',2,2],
]);
export const WRITE_JOBS = Object.freeze({
  'f03-2m-transaction-responsible-handover-pg16': 'refs/heads/feat/f03-transaction-responsible-handover-2m',
  'f03-2l-lock-responsible-handover-pg16': 'refs/heads/feat/f03-lock-responsible-handover-2l',
  'f03-2k-waitlist-responsible-handover-pg16': 'refs/heads/feat/f03-waitlist-responsible-handover-2k',
  'f03-2h-customer-owner-handover-pg16': 'refs/heads/feat/f03-customer-owner-handover-2h',
  'f03-2b-population-82': 'refs/heads/feat/f03-admin-population-2b',
  'f03-2n-handover-reconciliation-pg16': 'refs/heads/feat/f03-handover-reconciliation-2n',
});

export const count = (content, needle) => content.split(needle).length - 1;
export function assert(ok, message) { if (!ok) throw Error('F05_7_COMPAT_FAIL_CLOSED: ' + message); }
export function gitBlobSha(content) {
  const bytes = Buffer.from(content, 'utf8');
  return createHash('sha1').update('blob ' + bytes.length + '\0').update(bytes).digest('hex');
}
export function jobsOf(content) {
  const start = content.indexOf('\njobs:\n');
  assert(start >= 0, 'missing jobs block');
  const head = content.slice(0, start + 6), tail = content.slice(start + 6);
  const matches = [...tail.matchAll(/^  ([a-z][a-z0-9-]*):(?=\s|$)/gm)];
  assert(matches.length > 0, 'missing real jobs');
  return {head, jobs:matches.map((m,i) => ({name:m[1],source:tail.slice(m.index, matches[i+1]?.index ?? tail.length)}))};
}
export function sourceBranchGuard(segment, jobName) {
  const ref = WRITE_JOBS[jobName];
  assert(Boolean(ref), 'non-whitelist write job '+jobName);
  assert(ref !== ORIGINAL_REF, 'guard targets original F05 source ref');
  const conditions = [...segment.matchAll(/test "\$GITHUB_REF" = '(refs\/heads\/feat\/f03-[^']+)'/g)];
  const pushes = [...segment.matchAll(/git push origin HEAD:(refs\/heads\/feat\/f03-[^\s]+)/g)];
  assert(conditions.length === 1 && pushes.length === 1, 'unguarded extra push in '+jobName);
  assert(conditions[0][1] === ref && pushes[0][1] === ref, 'F03 guard/ref mismatch in '+jobName);
  assert(conditions[0].index < pushes[0].index, 'write operation before guard in '+jobName);
  assert(segment.includes('      contents: write'), 'missing original scoped write permission in '+jobName);
  return {job:jobName, guard:ref, denied_by_original_ref:true};
}
export function patchExactly(original, name) {
  const row = FILES.find(x=>x[0]===name);
  assert(Boolean(row), 'path outside whitelist '+name);
  const [,,expectedJobs,expectedServices] = row;
  assert(count(original,'image: '+IMAGE)===expectedServices, 'original postgres service count mismatch '+name);
  assert(count(original,'contents: write')===(expectedJobs===52 ? 6 : 0), 'original content write count mismatch '+name);
  assert(original.includes(ORIGINAL_REF.replace('refs/heads/','')), 'original branch event absent '+name);
  const {head,jobs}=jobsOf(original);
  assert(jobs.length===expectedJobs, 'original job count mismatch '+name);
  let tags=0, downgrades=0;
  const changed=jobs.map(({name:job,source})=>{
    let next=source;
    const hasPG=count(source,'image: '+IMAGE);
    if(hasPG){
      assert(hasPG===1, 'multiple PG services '+job);
      const checkout=/^(\s*)- uses: actions\/checkout@v4$/m.exec(source);
      assert(Boolean(checkout), 'missing checkout '+job);
      const indent=checkout[1];
      const alias=checkout[0]+'\n'+indent+'- name: F05-7 冻结PG16旧祖先名仅Runner本地兼容\n'+indent+'  run: bash "'+ALIAS_SCRIPT+'"';
      next=next.replace('image: '+IMAGE, 'image: '+DOCKER_IMAGE).replace(checkout[0],alias);
      tags++;
    }
    if(Object.hasOwn(WRITE_JOBS,job)){
      sourceBranchGuard(source,job);
      next=next.replace('      contents: write','      contents: read');
      downgrades++;
    }else{
      assert(!source.includes('contents: write'),'unexpected write permission '+job);
    }
    return next;
  });
  assert(tags===expectedServices,'alias patch count mismatch '+name);
  assert(downgrades===(expectedJobs===52 ? 6 : 0),'write permission patch mismatch '+name);
  return head+changed.join('');
}
export function validatePatch(original, revised, name) {
  assert(revised===patchExactly(original,name), 'unauthorized semantic or whitespace difference '+name);
  const row=FILES.find(x=>x[0]===name);
  const jobs=jobsOf(revised).jobs;
  assert(jobs.length===row[2], 'revised job count '+name);
  assert(count(revised,'image: '+DOCKER_IMAGE)===row[3], 'DockerHub service count '+name);
  assert(count(revised,'pg16-local-alias.sh')===row[3], 'alias count '+name);
  assert(count(revised,'contents: write')===0,'unexpected write token '+name);
  assert(count(revised,'git push origin HEAD:refs/heads/feat/f03-')===(row[2]===52 ? 30 : 0),'legacy guard/push byte count '+name);
  return {file:name, originalBlob:gitBlobSha(original), revisedBlob:gitBlobSha(revised), jobs:row[2],aliases:row[3],permissionDowngrades:row[2]===52?6:0};
}
export async function officialOriginal(row,token,fetchImpl=fetch){
  const [name,expected]=row;
  assert(token && token.length>10, 'missing GitHub read token');
  const url='https://api.github.com/repos/suzhe868-arch/mb/contents/.github/workflows/'+encodeURIComponent(name)+'?ref='+BASE_SHA;
  const res=await fetchImpl(url,{headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'}});
  assert(res.ok,'GitHub official original unavailable '+name+' HTTP '+res.status);
  const json=await res.json();
  assert(json.sha===expected && json.encoding==='base64', 'baseline blob SHA mismatch '+name);
  const original=Buffer.from(json.content.replace(/\s/g,''),'base64').toString('utf8');
  assert(gitBlobSha(original)===expected, 'official original bytes mismatch '+name);
  return original;
}
export async function runAudit(token=process.env.GH_READ_TOKEN){
  const reports=[];
  for(const row of FILES) {
    const original=await officialOriginal(row,token);
    const revised=readFileSync(resolve('.github/workflows',row[0]),'utf8');
    reports.push(validatePatch(original,revised,row[0]));
  }
  // 第八份原F05-7主工作流绝对不可修改。
  const eighth=readFileSync('.github/workflows/f05-7-deterministic-matching-readiness-four-tier.yml','utf8');
  assert(gitBlobSha(eighth)==='3f563fcc3137197f37c986963a3e48259d1f4626','eighth source workflow changed');
  assert(jobsOf(eighth).jobs.length===2, 'eighth workflow not 2 jobs');
  assert(reports.reduce((n,x)=>n+x.jobs,2)===66, 'not eight workflows / 66 jobs');
  assert(reports.reduce((n,x)=>n+x.aliases,0)===62, 'not 62 tagged PG16 services');
  assert(reports.reduce((n,x)=>n+x.permissionDowngrades,0)===6,'not six downgraded writes');
  const evidence={result:'F05_7_FROZEN_COMPAT_STATIC_PASS',baseSha:BASE_SHA,headSha:process.env.GITHUB_SHA||null,checkedWorkflows:8,historicalJobs:66,serviceAliasSteps:62,writePermissionDowngrades:6,formalSourceRevalidated:false,originalBranchPush:false,files:reports};
  mkdirSync('engineering/f05/source-controlled-recovery-02/artifacts',{recursive:true});
  writeFileSync('engineering/f05/source-controlled-recovery-02/artifacts/compat-audit-result.json',JSON.stringify(evidence,null,2)+'\n');
  console.log('F05_7_FROZEN_COMPAT_STATIC_PASS',JSON.stringify({workflows:8,jobs:66,serviceAliases:62,rightsReduced:6}));
  return evidence;
}
if(process.argv[1] && fileURLToPath(import.meta.url)===resolve(process.argv[1]))runAudit().catch(e=>{console.error(e);process.exitCode=1;});
