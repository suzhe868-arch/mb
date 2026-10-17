// Standalone, POST-COMPLETION read-only verifier. Never run as an Issuer or during its own GitHub Run.
// Requires a read-only GH_ACTIONS_READ_TOKEN. Fetches the OFFICIAL API and all four ZIP bytes, not input JSON.
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync,readdirSync,statSync,lstatSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
import {loadOfficialCatalog} from '../v2-original-64/inventory.mjs';
import {writePlan} from './plan66.mjs';
import {sha256,assertFrozenIdentity,verifyOfficialGraph,verifyCandidateRecords,
 REPO,BRANCH,WORKFLOW,ARTIFACT_NAMES,refuse} from './proof-contract.mjs';
const SHA=/^[a-f0-9]{40}$/;
const token=process.env.GH_ACTIONS_READ_TOKEN;
const root='https://api.github.com/repos/'+REPO;
const unzip=String.raw`import sys,zipfile,pathlib
z=zipfile.ZipFile(sys.argv[1]);root=pathlib.Path(sys.argv[2]);maximum=int(sys.argv[3])
items=z.infolist();assert len(items)<=25000
total=0;seen=set()
for i in items:
 path=pathlib.PurePosixPath(i.filename)
 assert i.filename not in seen and not i.filename.startswith('/') and '..' not in path.parts
 assert ((i.external_attr>>16)&0o170000)!=0o120000
 total+=i.file_size;assert total<=maximum
 assert (root/i.filename).resolve().is_relative_to(root.resolve())
 seen.add(i.filename)
z.extractall(root)`;
function cleanExtract(zip,dest,maxBytes){mkdirSync(dest,{recursive:true});
 execFileSync('python3',['-c',unzip,zip,dest,String(maxBytes)],{timeout:40000})}
function walk(path,base=path){let all=[];for(const item of readdirSync(path)){const f=join(path,item),info=lstatSync(f);
 if(info.isSymbolicLink())refuse('ZIP_SYMLINK');
 if(info.isDirectory())all.push(...walk(f,base));else if(info.isFile())all.push(f.slice(base.length+1));
 else refuse('ZIP_SPECIAL_FILE')}return all.sort()}
function checkHash(path,expected){if(sha256(readFileSync(path))!==expected)refuse('BODY_HASH_TAMPER')}
async function request(url,binary=false){
 if(!url.startsWith(root+'/'))refuse('URL_NOT_OWN_REPO');
 const response=await fetch(url,{headers:{Authorization:'Bearer '+token,
 Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'}});
 if(!response.ok)refuse('API_'+response.status);
 return binary?Buffer.from(await response.arrayBuffer()):response;
}
async function paged(path,arrayName){
 let url=root+path,pages=[],limit=0;
 while(url){if(++limit>20)refuse('API_PAGINATION_LIMIT');const response=await request(url);
 const json=await response.json();pages.push(json);
 const link=response.headers.get('link')||'';
 const next=link.split(',').find(s=>s.includes('rel="next"'));
 url=next?.match(/<([^>]+)>/)?.[1]||null}
 const data=pages.flatMap(p=>arrayName?p[arrayName]||[]:[]);
 if(arrayName && pages[0].total_count!==data.length)refuse('API_PAGES_TRUNCATED');
 return arrayName?data:pages[0]
}
function validatePackage(file,art,source,ctx){
 if(statSync(file).size!==art.size_in_bytes||statSync(file).size>5*1024*1024)refuse('OFFICIAL_ZIP_SIZE');
 if('sha256:'+sha256(readFileSync(file))!==art.digest)refuse('OFFICIAL_ZIP_DIGEST');
 const temp=mkdtempSync(join(tmpdir(),'v2-issuer-official-'));
 try{
  const out=join(temp,'outer');cleanExtract(file,out,5*1024*1024);
  const manifest=JSON.parse(readFileSync(join(out,'artifact-integrity-manifest.json'),'utf8'));
  if(manifest.schema!=='V2_ORIGINAL_SHARD_LOSSLESS_PACK_V2'||manifest.issue!==106||
    manifest.security_scan!=='A107_ALL_SOURCE_FILES_SCAN_BEFORE_ZIP_V1'||manifest.complete_evidence!==true||
    manifest.shard!==source.shard||manifest.expected_run_sha!==ctx.sha||
    String(manifest.expected_run_id)!==String(ctx.runId)||
    !Array.isArray(manifest.items)||manifest.raw_bytes>64*1024*1024||
    manifest.max_upload_bytes!==5*1024*1024||manifest.max_uncompressed_bytes!==64*1024*1024)refuse('PACKAGE_MANIFEST');
  const inner=join(out,'original-evidence.zip');
  if(statSync(inner).size!==manifest.packed_bytes||sha256(readFileSync(inner))!==manifest.packed_sha256)refuse('INNER_HASH');
  const dir=join(temp,'raw');cleanExtract(inner,dir,64*1024*1024);
  const files=walk(dir);
  if(files.length!==manifest.items.length)refuse('RAW_FILES_MISSING');
  let bytes=0;
  for(let i=0;i<files.length;i++){
   const entry=manifest.items[i];
   if(entry.path!==files[i]||!Number.isSafeInteger(entry.bytes)||
      entry.bytes!==statSync(join(dir,entry.path)).size)refuse('RAW_FILE_OR_LENGTH');
   checkHash(join(dir,entry.path),entry.sha256);bytes+=entry.bytes;
   const value=readFileSync(join(dir,entry.path),'utf8');
   if(/::add-mask::(?!\[REDACTED\])/.test(value)||
      /-----BEGIN (?:[A-Z ]* )?PRIVATE KEY-----/.test(value)||
      /F03_1_HMAC_KEY_BASE64=[A-Za-z0-9+/]{43}=/.test(value))refuse('RAW_SECRET_UNMASKED');
  }
  if(bytes!==manifest.raw_bytes)refuse('RAW_BYTES_NOT_EQUAL');
  const found=[];
  for(const e of source.jobs){
   const key=sha256(e.key).slice(0,16),dir0=join(dir,key);
   const rec=JSON.parse(readFileSync(join(dir0,'真实单Job证据.json'),'utf8'));
   const logPath=join(dir0,'真实Shell及PG16命令.log');
   if(rec.status!=='NOT_RUN'&&statSync(logPath).isFile()){
    checkHash(logPath,rec.log_sha256);
    if(rec.status.startsWith('REAL_')){
     const log=readFileSync(logPath,'utf8');
     if((log.match(/SOURCE_STEP_PASS [0-9]+/g)||[]).length!==e.original_run_commands)refuse('SHELL_NOT_ALL_EXECUTED');
     if(rec.artifacts.length!==e.expected_artifacts.length)refuse('ORIGINAL_ARTIFACT_MISSING');
     for(const artifact of rec.artifacts)for(const f of artifact.files){
      const value=join(dir0,'artifact-files',String(artifact.index)+'_'+artifact.name,f.path);
      if(statSync(value).size!==f.bytes)refuse('ORIGINAL_ARTIFACT_SIZE');
      checkHash(value,f.sha256);
     }
    }
   }
   found.push(rec);
  }
  return found;
 }finally{rmSync(temp,{recursive:true,force:true})}
}
export async function verifyOnline(sha,runId){
 if(!token||token.length<15||!SHA.test(sha)||!Number.isSafeInteger(runId)||runId<1)refuse('READ_ONLY_TOKEN_OR_CONTEXT');
 const catalog=loadOfficialCatalog();
 execFileSync('ruby',[resolve(import.meta.dirname,'freeze-rules.rb')],{timeout:30000});
 const frozen=writePlan();assertFrozenIdentity(frozen,catalog);
 if(!/^[a-f0-9]{64}$/.test(frozen.locked_rule_digest_sha256||'')||
    frozen.jobs.some(j=>!j.frozen_rule||j.frozen_rule.key!==j.key||
      j.frozen_rule.source_blob!==j.source_blob))refuse('FROZEN_PERMISSIONS_SERVICES_RULE_MISSING');
 const context={repo:REPO,branch:BRANCH,workflow:WORKFLOW,event:'push',sha,runId,attempt:1};
 const [run,jobs,arts,checks]=await Promise.all([
  paged('/actions/runs/'+runId),paged('/actions/runs/'+runId+'/jobs?per_page=100','jobs'),
  paged('/actions/runs/'+runId+'/artifacts?per_page=100','artifacts'),
  paged('/commits/'+sha+'/check-runs?per_page=100','check_runs')]);
 const relevant=checks.filter(x=>jobs.some(j=>j.id===x.id));
 verifyOfficialGraph(context,{run,jobs,artifacts:arts,checks:relevant,complete_pagination:true});
 const temp=mkdtempSync(join(tmpdir(),'v2-issuer-artifact-'));
 try{
  const records=[];
  for(let i=0;i<4;i++){
   const art=arts.find(a=>a.name===ARTIFACT_NAMES[i]);
   const body=await request(root+'/actions/artifacts/'+art.id+'/zip',true);
   const file=join(temp,'shard-'+i+'.zip');writeFileSync(file,body);
   records.push(...validatePackage(file,art,{shard:i,jobs:frozen.jobs.filter(j=>j.shard===i)},context));
  }
  const assessment=verifyCandidateRecords(context,frozen,records);
  return {...assessment,official_run:runId,official_head_sha:sha,
   official_job_ids:jobs.map(x=>x.id),official_artifact_ids:arts.map(x=>x.id),
   protocol_version:'V2_SOURCE_CANDIDATE_66_NEW_HEAD_V1',
   independent_A_signoff_required:true,formal_issuer_signed:false,
   five_formal_sources:'SOURCE_GAP_OPEN_FAIL_CLOSED'};
 }finally{rmSync(temp,{recursive:true,force:true})}
}
if(process.argv[1]&&resolve(process.argv[1])===resolve(import.meta.filename)){
 try{console.log(JSON.stringify(await verifyOnline(process.argv[2],Number(process.argv[3])),null,2))}
 catch(e){console.error(e.message);process.exitCode=1}
}
