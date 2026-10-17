// Issue #106: enforce total content-bearing archive limit, no truncated PASS proof.
import {readFileSync,writeFileSync,mkdirSync,readdirSync,statSync,copyFileSync} from 'node:fs';
import {resolve,join,relative,dirname} from 'node:path';
import {createHash} from 'node:crypto';
const base=resolve(import.meta.dirname),root=resolve(base,'evidence');
const shard=Number(process.argv[2]);
if(!Number.isInteger(shard)||shard<0||shard>3)throw Error('V2_PACK_INVALID_SHARD');
const source=resolve(root,'shard'+shard),dest=resolve(root,'upload-safe-'+shard);
const MAX=5*1024*1024,RESERVE=1024*32;
mkdirSync(dest,{recursive:true});
function visit(dir){let all=[];for(const e of readdirSync(dir,{withFileTypes:true})){let full=join(dir,e.name);if(e.isSymbolicLink())throw Error('V2_PACK_SYMLINK');if(e.isDirectory())all.push(...visit(full));else if(e.isFile())all.push(full);else throw Error('V2_PACK_SPECIAL_FILE')}return all}
if(!readdirSync(root).includes('shard'+shard))mkdirSync(source,{recursive:true});
const files=visit(source).sort();let count=0,bytes=0,manifest=[];
for(const file of files){const rel=relative(source,file);if(rel.startsWith('..')||rel.startsWith('/'))throw Error('V2_PACK_ESCAPE');const size=statSync(file).size;count++;bytes+=size;manifest.push({path:rel,bytes:size,sha256:createHash('sha256').update(readFileSync(file)).digest('hex')});}
const report={schema:'V2_ORIGINAL_SHARD_ARTIFACT_LIMIT_V1',issue:106,shard,source_file_count:count,raw_bytes:bytes,max_uncompressed_bytes:MAX,expected_run_sha:process.env.GITHUB_SHA||null,expected_run_id:process.env.GITHUB_RUN_ID||null,complete_evidence:bytes<=MAX-RESERVE,formal_source_signed:false,items:bytes<=MAX-RESERVE?manifest:[],blocker:bytes<=MAX-RESERVE?null:'BLOCKED_STORAGE_BUDGET_FULL_ARTIFACT_NOT_UPLOADED'};
const out=join(dest,'artifact-integrity-manifest.json');
writeFileSync(out,JSON.stringify(report,null,2)+'\n');
if(!report.complete_evidence){console.error('V2_BLOCKED_STORAGE_BUDGET shard='+shard+' actual='+bytes+' allowed='+MAX);process.exitCode=1;}
else {for(const file of files){const rel=relative(source,file),to=resolve(dest,'payload',rel);mkdirSync(dirname(to),{recursive:true});copyFileSync(file,to)};console.log('V2_ARTIFACT_SAFE_PACKAGE shard='+shard+' bytes='+bytes+' max='+MAX+' files='+count)}
