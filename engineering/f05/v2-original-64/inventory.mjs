// F05-7 V2 inventory: immutable original 66, two independent historical results.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const dir=resolve(fileURLToPath(new URL('.', import.meta.url)));
export const ROOT=resolve(dir,'../../..');
export const V2_BRANCH='feat/f05-7-v2-remaining-64-real-pg16-01';
export const ORIGINAL_SHA='99c38d013f67cc56975f1664120fb87c204afc3c';
export const ORIGINAL_HISTORICAL=[
 {file:'f05-7-frozen-h52-revalidation.yml',id:'f05-3f-https-pg16',sha:'346fb11133f0883014b7911effb58052bd17b2c1',run:39008798385,job:117326661519},
 {file:'f05-7-frozen-k2-revalidation.yml',id:'k-https',sha:'346fb11133f0883014b7911effb58052bd17b2c1',run:39008798385,job:117326661370}
];
export function sha256(value){return createHash('sha256').update(value).digest('hex')}
const assert=(cond,message)=>{if(!cond)throw Error('V2_FAIL_CLOSED_'+message)};
export function buildInventory(catalog){
 assert(catalog?.total===66&&catalog?.ref_sha===ORIGINAL_SHA,'SOURCE_IDENTITY');
 assert(Array.isArray(catalog.sources)&&catalog.sources.length===8&&Array.isArray(catalog.jobs)&&catalog.jobs.length===66,'SOURCE_COUNT');
 const sourceMap=new Map(catalog.sources.map(s=>[s.file,s]));
 assert(sourceMap.size===8,'DUPLICATE_SOURCE');
 let seen=new Set();let out=[];
 for(const j of catalog.jobs){
  let ref=sourceMap.get(j.file);assert(ref&&ref.blob===j.blob,'SOURCE_BLOB_INCONSISTENCY');
  let key=j.file+'#'+j.id;assert(!seen.has(key),'DUPLICATE_JOB');seen.add(key);
  assert(Array.isArray(j.steps)&&j.steps.length>0&&Array.isArray(j.commands),'STEPS');
  let historical=ORIGINAL_HISTORICAL.find(x=>x.file===j.file&&x.id===j.id);
  out.push({key,source_workflow:j.file,source_blob:j.blob,original_source_sha:ORIGINAL_SHA,
   original_job_id:j.id,original_job_name:j.name,pg16_image:j.pg16||null,
   original_step_count:j.steps.length,original_run_commands:j.commands.length,
   step_sha256:j.steps.map(s=>sha256(JSON.stringify(s))),
   command_sha256:j.commands.map(s=>sha256(s)),
   expected_artifacts:(j.artifacts||[]).map(a=>({name:a.name??null,path:a.path??null})),
   original_conditional:Boolean(j.conditions),
   history:historical?{...historical,kind:'HISTORICAL_DIFFERENT_SHA',current_head_accepted:false}:null,
   status:historical?'HISTORICAL_PREVIOUS_SHA_ONLY':'NOT_RUN',
   current_head_real_pg16_pass:false,formal_source_signed:false});
 }
 assert(out.filter(x=>x.history).length===2&&out.filter(x=>!x.history).length===64,'64_REMAINING');
 const target=out.filter(x=>!x.history);
 for(let i=0;i<target.length;i++)target[i].shard=i%4;
 return {schema:'F05_7_V2_64_MATRIX_V1',source_ref_sha:ORIGINAL_SHA,total_original:66,
  historical_from_other_sha:2,remaining_on_new_sha:64,formal_source_issuer_signed:false,
  phase2_original_ref_push_authorized:false,source_gap:'OPEN', jobs:out};
}
export function loadOfficialCatalog(){
 const ruby=join(ROOT,'engineering/f05/native-66-closure/catalog.rb');
 execFileSync('ruby',[ruby,'--catalog'],{cwd:ROOT,encoding:'utf8',timeout:20000});
 return JSON.parse(readFileSync(join(ROOT,'engineering/f05/native-66-closure/evidence/原66项工作流与Job逐项完整执行映射.json'),'utf8'));
}
export function saveInventory(inventory,output){
 mkdirSync(resolve(output,'..'),{recursive:true});
 writeFileSync(output,JSON.stringify(inventory,null,2)+'\n');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const out=process.argv[2]||join(ROOT,'engineering/f05/v2-original-64/evidence/66格真实测试矩阵.json');
 let m=buildInventory(loadOfficialCatalog());saveInventory(m,out);
 console.log('V2_66_EXACT_MAPPING historical=2 remaining=64 shards=4 output='+out);
}
