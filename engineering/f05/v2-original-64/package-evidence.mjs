// Issue106: losslessly preserve all original business evidence; 5MiB is the uploaded ZIP hard limit.
import {readFileSync,writeFileSync,mkdirSync,readdirSync,statSync,existsSync,unlinkSync} from 'node:fs';
import {resolve,join,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const base=resolve(import.meta.dirname),root=resolve(base,'evidence');
const shard=Number(process.argv[2]);
if(!Number.isInteger(shard)||shard<0||shard>3)throw Error('V2_PACK_INVALID_SHARD');
const source=resolve(root,'shard'+shard),dest=resolve(root,'upload-safe-'+shard);
const MAX_ZIP=5*1024*1024,RESERVE=128*1024,MAX_RAW=64*1024*1024;
mkdirSync(dest,{recursive:true});
function visit(dir){let all=[];for(const e of readdirSync(dir,{withFileTypes:true})){
 const full=join(dir,e.name);if(e.isSymbolicLink())throw Error('V2_PACK_SYMLINK');
 if(e.isDirectory())all.push(...visit(full));else if(e.isFile())all.push(full);else throw Error('V2_PACK_SPECIAL_FILE')
}return all}
if(!readdirSync(root).includes('shard'+shard))mkdirSync(source,{recursive:true});
const files=visit(source).sort();let count=0,bytes=0,manifest=[];
for(const file of files){const rel=relative(source,file);if(rel.startsWith('..')||rel.startsWith('/'))throw Error('V2_PACK_ESCAPE');
 const size=statSync(file).size;count++;bytes+=size;
 manifest.push({path:rel,bytes:size,sha256:createHash('sha256').update(readFileSync(file)).digest('hex')});
}
// A-PR107: every uploaded source file is scanned BEFORE compression, not only ZIP metadata.
function assertUploadSafe(file){
 const raw=readFileSync(file);
 if(/::add-mask::(?!\[REDACTED\])/.test(raw.toString('latin1')))throw Error('V2_EVIDENCE_RAW_GITHUB_MASK_DENIED');
 if(/-----BEGIN (?:[A-Z ]* )?PRIVATE KEY-----/.test(raw.toString('latin1')))throw Error('V2_EVIDENCE_PRIVATE_KEY_DENIED');
 if(/F03_1_HMAC_KEY_BASE64=[A-Za-z0-9+/]{43}=/.test(raw.toString('latin1')))throw Error('V2_EVIDENCE_HMAC_ASSIGNMENT_DENIED');
 if(/gh[pousr]_[A-Za-z0-9_]{28,}/.test(raw.toString('latin1')))throw Error('V2_EVIDENCE_TOKEN_DENIED');
}
for(const file of files)assertUploadSafe(file);
const safeRaw=bytes<=MAX_RAW;
const packed=join(dest,'original-evidence.zip');
let packedBytes=0,packedDigest=null;
if(safeRaw){
 const code=[
 'import pathlib,sys,zipfile',
 'src=pathlib.Path(sys.argv[1]);dest=pathlib.Path(sys.argv[2]);',
 "with zipfile.ZipFile(dest,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as z:",
 " for path in sorted(src.rglob('*')):",
 "  if path.is_file(): z.write(path,arcname=str(path.relative_to(src)))"
 ].join('\n');
 execFileSync('python3',['-c',code,source,packed],{timeout:45000});
 packedBytes=statSync(packed).size;
 packedDigest=createHash('sha256').update(readFileSync(packed)).digest('hex');
}
const complete=safeRaw&&packedBytes>0&&packedBytes<=MAX_ZIP-RESERVE;
const report={schema:'V2_ORIGINAL_SHARD_LOSSLESS_PACK_V2',issue:106,shard,
 source_file_count:count,raw_bytes:bytes,max_uncompressed_bytes:MAX_RAW,
 packed_bytes:packedBytes,packed_sha256:packedDigest,max_upload_bytes:MAX_ZIP,
 expected_run_sha:process.env.GITHUB_SHA||null,expected_run_id:process.env.GITHUB_RUN_ID||null,
 complete_evidence:complete,security_scan:'A107_ALL_SOURCE_FILES_SCAN_BEFORE_ZIP_V1',formal_source_signed:false,
 items:complete?manifest:[],blocker:complete?null:'BLOCKED_STORAGE_BUDGET_LOSSLESS_ARCHIVE_NOT_UPLOADED'};
writeFileSync(join(dest,'artifact-integrity-manifest.json'),JSON.stringify(report,null,2)+'\n');
if(!complete){if(existsSync(packed))unlinkSync(packed);
 console.error('V2_BLOCKED_STORAGE_BUDGET shard='+shard+' raw='+bytes+' packed='+packedBytes+' maxUpload='+MAX_ZIP);process.exitCode=1;}
else console.log('V2_LOSSLESS_EVIDENCE_READY shard='+shard+' raw='+bytes+' packed='+packedBytes+' sha256='+packedDigest);
