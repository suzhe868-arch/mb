// Authentic V2 candidate evidence: GitHub official metadata AND unmodified original business records.
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync,readdirSync,statSync} from 'node:fs';
import {resolve,join,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
export const REPO='suzhe868-arch/mb';
export const BRANCH='feat/f05-7-v2-remaining-64-real-pg16-01';
export const WORKFLOW='.github/workflows/f05-7-v2-original-64-ci.yml';
export const JOB_NAMES=Object.freeze(Array.from({length:4},(_,s)=>`F05-7 V2 原64混合业务 分片${s}`));
export const ARTIFACT_NAMES=Object.freeze(Array.from({length:4},(_,s)=>`f05-v2-original-64-shard-${s}`));
export function expectedOriginalStatus(source){
 const nonpg=source?.source_workflow==='f05-7-frozen-h52-revalidation.yml'&&['h-source','h-https'].includes(source?.original_job_id);
 if(nonpg){if(source.pg16_image!==null)deny('NONPG_SERVICE_MISMATCH');return 'REAL_ORIGINAL_NONPG_PASS'}
 if(!['postgres:16','postgres:16-alpine'].includes(source?.pg16_image))deny('PG16_SERVICE_MISMATCH');
 return 'REAL_PG16_PASS'
}
const sha=x=>typeof x==='string'&&/^[0-9a-f]{40}$/.test(x);
const positive=x=>Number.isSafeInteger(x)&&x>0;
const success=x=>x?.conclusion==='success'&&x?.status==='completed';
export const digest=x=>createHash('sha256').update(x).digest('hex');
export const deny=code=>{throw Error('V2_EVIDENCE_FAIL_CLOSED_'+code)};
export function checkJobRecord(source,record,logText,files,candidate){
 if(!source||!record||!candidate||!sha(candidate.sha))deny('CONTEXT');
 if(source.source_workflow!==record.original_file||source.original_job_id!==record.original_job_id||
    source.source_blob!==record.source_blob||source.original_job_name!==record.original_job_name)deny('JOB_ID_OR_NAME_SUBSTITUTION');
 if(record.candidate_head!==candidate.sha||record.candidate_branch!==BRANCH||record.run_id!==String(candidate.runId)||
    Number(record.attempt)!==candidate.attempt||record.event!=='push'||record.status!==expectedOriginalStatus(source)||
    record.formal_issuer_signed!==false||record.pg16!==(record.status==='REAL_PG16_PASS')||!record.clean_git_worktree)deny('REAL_PG16_STATUS');
 if(!Array.isArray(record.command_sha256)||record.command_sha256.length!==source.original_run_commands||
    record.command_sha256.some((h,i)=>h!==source.command_sha256[i])||
    record.executed_commands!==source.original_run_commands)deny('ORIGINAL_COMMANDS');
 if(record.log_redaction!=='SECURE_MASKED_CAPTURE_V1'||/::add-mask::(?!\[REDACTED\])/.test(logText)||
    /-----BEGIN (?:[A-Z ]* )?PRIVATE KEY-----/.test(logText)||
    /F03_1_HMAC_KEY_BASE64=[A-Za-z0-9+/]{43}=/.test(logText))deny('EVIDENCE_LEAK_OR_UNSCANNED');
 if(record.log_sha256!==digest(logText)||!logText.includes('SOURCE_STEP_PASS')||(logText.match(/SOURCE_STEP_PASS [0-9]+/g)||[]).length!==source.original_run_commands)deny('FAKE_LOG');
 if(record.step_count!==undefined&&record.step_count!==source.original_step_count)deny('ORIGINAL_STEP_COUNT');
 if(!Array.isArray(record.artifacts)||record.artifacts.length!==source.expected_artifacts.length)deny('ARTIFACT_COUNT');
 for(let i=0;i<record.artifacts.length;i++){
  const got=record.artifacts[i],expect=source.expected_artifacts[i];
  if(!expect.name||!expect.path||got.original_path!==expect.path||
     typeof got.name!=='string'||!got.name||!Array.isArray(got.files)||!got.files.length)deny('ARTIFACT_EXPECTATION');
  // Direct name match or explicit, signed env.MODE substitution (h-source / h-https).
  if(expect.name!==got.name && got.name!==String(source.original_job_env?.MODE??''))deny('ARTIFACT_NAME_SUBSTITUTION');
  let bytes=0;
  for(const f of got.files){
   if(typeof f.path!=='string'||f.path.includes('..')||!positive(f.bytes)||!files.has(f.path))deny('ARTIFACT_FILE');
   const content=files.get(f.path);bytes+=content.length;
   if(f.bytes!==content.length||f.sha256!==digest(content))deny('ARTIFACT_BODY_TAMPER');
  }
  if(bytes!==got.bytes)deny('ARTIFACT_TOTAL_SIZE');
 }
 return {level:'V2_REAL_BUSINESS_RECORD_CHECKED',original_job:source.key,head_sha:candidate.sha,
   issuer_signed:false,legacy_66_proven:false};
}
export function verifyOfficialIndex(context,api){
 if(!context||context.repo!==REPO||context.branch!==BRANCH||context.event!=='push'||
    context.workflow!==WORKFLOW||!sha(context.sha)||!positive(context.runId)||!positive(context.attempt))deny('CONTEXT');
 if(!api?.run||!Array.isArray(api.jobs)||!Array.isArray(api.checks)||!Array.isArray(api.artifacts))deny('API_SHAPE');
 const run=api.run;
 if(run.id!==context.runId||run.repository?.full_name!==REPO||run.head_branch!==BRANCH||run.head_sha!==context.sha||
    run.event!=='push'||run.run_attempt!==context.attempt||!success(run)||
    ![WORKFLOW,`${WORKFLOW}@refs/heads/${BRANCH}`].includes(run.path))deny('RUN_EVENT_BRANCH_SHA_ATTEMPT');
 if(api.jobs.length!==4||api.checks.length!==4||api.artifacts.length!==4||
    api.jobsTotal!==4||api.artifactsTotal!==4||api.checksTotal!==4)deny('FOUR_COMPLETE_EXPECTED');
 let ids=new Set(),checks=new Set(),artifacts=new Set();
 for(let i=0;i<4;i++){
  const j=api.jobs[i],check=api.checks.find(x=>x.id===j.id),artifact=api.artifacts[i];
  if(!positive(j.id)||ids.has(j.id)||j.run_id!==context.runId||j.name!==JOB_NAMES[i]||!success(j)||!check)deny('JOB_NAME_REPLAY');
  ids.add(j.id);
  if(!positive(check.id)||checks.has(check.id)||check.head_sha!==context.sha||!success(check)||
    check.details_url!==`https://github.com/${REPO}/actions/runs/${context.runId}/job/${j.id}`)deny('CHECK_REPLAY');
  checks.add(check.id);
  if(!positive(artifact.id)||artifacts.has(artifact.id)||artifact.name!==ARTIFACT_NAMES[i]||artifact.expired!==false||
     !positive(artifact.size_in_bytes)||!/^sha256:[a-f0-9]{64}$/i.test(artifact.digest)||
     artifact.workflow_run?.id!==context.runId||artifact.workflow_run?.head_sha!==context.sha)deny('ARTIFACT_METADATA');
  artifacts.add(artifact.id);
 }
 return {level:'V2_OFFICIAL_METADATA_ONLY_REQUIRES_ARCHIVE_AND_LOG_BINDING',head_sha:context.sha,
   issuer_signed:false,original_66_proven:false};
}
export async function fetchAllPages(url,token,fetcher=fetch){
 const records=[];let page=1;
 while(url){
  if(page++>20)deny('TOO_MANY_PAGES');
  if(!url.startsWith(`https://api.github.com/repos/${REPO}/`))deny('EXTERNAL_URL');
  const res=await fetcher(url,{headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json',
    'X-GitHub-Api-Version':'2022-11-28'}});
  if(!res.ok)deny('OFFICIAL_HTTP_'+res.status);
  const json=await res.json();records.push(json);
  let link=res.headers?.get('link')||'';let next=link.split(',').find(x=>x.includes('rel="next"'));
  url=next?next.match(/<([^>]+)>/)?.[1]:null;
 }
 return records;
}
export async function collectOfficial(context,token,fetcher=fetch){
 if(!token||token.length<10)deny('NO_TOKEN');
 const root=`https://api.github.com/repos/${REPO}`;
 const [runs,pagesJobs,pagesArts,pagesChecks]=await Promise.all([
  fetchAllPages(root+`/actions/runs/${context.runId}`,token,fetcher),
  fetchAllPages(root+`/actions/runs/${context.runId}/jobs?per_page=100`,token,fetcher),
  fetchAllPages(root+`/actions/runs/${context.runId}/artifacts?per_page=100`,token,fetcher),
  fetchAllPages(root+`/commits/${context.sha}/check-runs?per_page=100`,token,fetcher)
 ]);
 const jobs=pagesJobs.flatMap(p=>p.jobs||[]),artifacts=pagesArts.flatMap(p=>p.artifacts||[]);
 const ids=new Set(jobs.map(j=>j.id));const checks=pagesChecks.flatMap(p=>p.check_runs||[]).filter(c=>ids.has(c.id));
 if(pagesJobs[0].total_count!==jobs.length||pagesArts[0].total_count!==artifacts.length)deny('API_PAGING_LOSS');
 // Job ordering must follow exact shard indices, not API arbitrary order.
 jobs.sort((a,b)=>JOB_NAMES.indexOf(a.name)-JOB_NAMES.indexOf(b.name));
 artifacts.sort((a,b)=>ARTIFACT_NAMES.indexOf(a.name)-ARTIFACT_NAMES.indexOf(b.name));
 return {candidate:verifyOfficialIndex(context,{run:runs[0],jobs,checks,artifacts,
  jobsTotal:jobs.length,checksTotal:checks.length,artifactsTotal:artifacts.length}),artifacts,
  warning:'OFFICIAL_API_METADATA_ONLY_ARCHIVE_BYTES_NOT_YET_ATTESTED'};
}

// V2 official artifact-content verifier: never promotes locally supplied data to official status.
// The content root must be fetched independently from the GitHub Artifact API at a matching Run.
export function checkOfficialShardPayload(context,artifact,sourceMatrix,records){
 if(!artifact||!context||artifact.workflow_run?.id!==context.runId||
    artifact.workflow_run?.head_sha!==context.sha||artifact.expired!==false||
    typeof artifact.name!=='string'||!ARTIFACT_NAMES.includes(artifact.name))deny('OFFICIAL_SHARD_METADATA');
 const shard=ARTIFACT_NAMES.indexOf(artifact.name);
 const expected=sourceMatrix.jobs.filter(j=>!j.history&&j.shard===shard);
 if(expected.length!==16||!Array.isArray(records)||records.length!==16)deny('SHARD_16_REQUIRED');
 const keys=new Set();
 for(const entry of records){
  const match=expected.find(j=>j.key===entry?.key);
  if(!match||keys.has(entry.key)||!(entry.files instanceof Map)||typeof entry.log!=='string')deny('SHARD_RECORD_REPLAY');
  keys.add(entry.key);
  checkJobRecord(match,entry.record,entry.log,entry.files,context);
 }
 return {level:'V2_OFFICIAL_ARTIFACT_BODY_CANDIDATE',shard,records_checked:keys.size,issuer_signed:false};
}

// Complete official Archive ZIP->lossless nested ZIP->original source-job report/body verifier.
// It accepts GitHub's actual downloaded artifact bytes, never a user-supplied JSON shortcut.
// A still must independently accept source-expression/permissions and formal Issuer equivalence.
const UNPACK_SAFE_PY=String.raw`import sys,zipfile,pathlib
src=sys.argv[1];dest=pathlib.Path(sys.argv[2]);max_total=int(sys.argv[3]);z=zipfile.ZipFile(src)
entries=z.infolist();assert len(entries)<=20000
size=0;seen=set()
for item in entries:
 p=pathlib.PurePosixPath(item.filename);name=item.filename
 assert not name.startswith('/') and '..' not in p.parts and name not in seen
 assert not (((item.external_attr>>16)&0o170000)==0o120000)
 assert (dest/name).resolve().is_relative_to(dest.resolve())
 size+=item.file_size;assert size<=max_total;seen.add(name)
z.extractall(dest)`;
export function auditOfficialLosslessShard(archiveBytes,artifact,context,sourceMatrix){
 if(!Buffer.isBuffer(archiveBytes)||archiveBytes.length>5*1024*1024||
    !artifact||artifact.expired!==false||artifact.workflow_run?.id!==context.runId||
    artifact.workflow_run?.head_sha!==context.sha||artifact.digest!=='sha256:'+digest(archiveBytes))deny('OFFICIAL_ZIP_SHA');
 const shard=ARTIFACT_NAMES.indexOf(artifact.name);
 if(shard<0)deny('SHARD_NAME');
 const tmp=mkdtempSync(join(tmpdir(),'v2-original-official-'));
 try{
  const outer=join(tmp,'official.zip'),out=join(tmp,'outer');
  writeFileSync(outer,archiveBytes);mkdirSync(out);
  execFileSync('python3',['-c',UNPACK_SAFE_PY,outer,out,String(5*1024*1024)],{timeout:30000});
  const meta=JSON.parse(readFileSync(join(out,'artifact-integrity-manifest.json'),'utf8'));
  if(meta.issue!==106||meta.shard!==shard||meta.complete_evidence!==true||
     meta.security_scan!=='A107_ALL_SOURCE_FILES_SCAN_BEFORE_ZIP_V1'||
     meta.expected_run_sha!==context.sha||String(meta.expected_run_id)!==String(context.runId)||
     meta.max_upload_bytes!==5*1024*1024||meta.max_uncompressed_bytes!==64*1024*1024||
     !Array.isArray(meta.items)||meta.items.length<16)deny('LOSSLESS_MANIFEST');
  const inner=join(out,'original-evidence.zip'),bytes=readFileSync(inner);
  if(bytes.length!==meta.packed_bytes||digest(bytes)!==meta.packed_sha256||
     bytes.length>5*1024*1024-128*1024)deny('INNER_PACK_SHA');
  const payload=join(tmp,'payload');mkdirSync(payload);
  execFileSync('python3',['-c',UNPACK_SAFE_PY,inner,payload,String(64*1024*1024)],{timeout:45000});
  const names=new Set();let total=0;
  for(const f of meta.items){
   if(typeof f.path!=='string'||names.has(f.path)||f.path.includes('..')||f.path.startsWith('/'))deny('BODY_PATH');
   names.add(f.path);const abs=resolve(payload,f.path);
   if(!abs.startsWith(payload+'/')||!Number.isSafeInteger(f.bytes)||f.bytes<0||
      statSync(abs).size!==f.bytes||digest(readFileSync(abs))!==f.sha256)deny('BODY_SHA');
   total+=f.bytes;
  }
  if(total!==meta.raw_bytes)deny('BODY_TOTAL');
  const sources=sourceMatrix.jobs.filter(j=>!j.history&&j.shard===shard);
  if(sources.length!==16)deny('SIXTEEN_SOURCES');
  let passes=0;const statuses=[];
  for(const source of sources){
   const key=digest(source.key).slice(0,16),root=join(payload,key);
   const record=JSON.parse(readFileSync(join(root,'真实单Job证据.json'),'utf8'));
   if(record.original_file!==source.source_workflow||record.original_job_id!==source.original_job_id||
      record.source_blob!==source.source_blob||record.candidate_head!==context.sha||
      String(record.run_id)!==String(context.runId)||record.formal_issuer_signed!==false)deny('REPLAYED_ORIGINAL_RECORD');
   if(['REAL_PG16_PASS','REAL_ORIGINAL_NONPG_PASS'].includes(record.status)){
    const log=readFileSync(join(root,'真实Shell及PG16命令.log'),'utf8'),fileMap=new Map();
    for(let i=0;i<record.artifacts.length;i++)for(const f of record.artifacts[i].files)
     fileMap.set(f.path,readFileSync(join(root,'artifact-files',i+'_'+record.artifacts[i].name,f.path)));
    checkJobRecord(source,record,log,fileMap,context);passes++;
   }else{
    if(!['BLOCKED_EQUIVALENCE','FAIL','NOT_RUN'].includes(record.status))deny('UNSUPPORTED_STATUS');
    const logPath=join(root,'真实Shell及PG16命令.log');
    if(meta.items.some(f=>f.path===key+'/真实Shell及PG16命令.log')){
     const log=readFileSync(logPath);if(digest(log)!==record.log_sha256)deny('FAILED_LOG_TAMPER');
    }
   }
   statuses.push({key:source.key,status:record.status,blocker:record.blocker||null});
  }
  return {shard,original_records:16,verified_real_business_pass:passes,per_source:statuses,
    level:'V2_OFFICIAL_LOSSLESS_ZIP_BODY_CANDIDATE_NOT_FORMAL_ISSUER',issuer_signed:false};
 }finally{rmSync(tmp,{recursive:true,force:true});}
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const command=process.argv[2];
 if(command==='--official'){
  const c={repo:REPO,branch:BRANCH,event:'push',workflow:WORKFLOW,
    sha:process.argv[3],runId:Number(process.argv[4]),attempt:Number(process.argv[5])};
  try{console.log(JSON.stringify(await collectOfficial(c,process.env.GH_ACTIONS_READ_TOKEN),null,2))}
  catch(err){console.error(err.message);process.exitCode=1}
 }else{console.error('V2_OFFICIAL_READ_ONLY_MODE_REQUIRED');process.exitCode=1}
}
