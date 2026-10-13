import {readFile,stat,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const dir=resolve('f05/integrated-readiness-audit');
const allowed=new Set(['SIGNED_CI_VERIFIED','CI_SYNTHETIC_ONLY','CONTRACT_ONLY','SOURCE_GAP','NOT_RUN','BLOCKED']);
export async function validate(){
 const source=JSON.parse(await readFile(resolve(dir,'coverage-source.json'),'utf8'));
 const gaps=JSON.parse(await readFile(resolve(dir,'gap-source.json'),'utf8'));
 if(source.legacyH52Jobs!==52||source.oldJobs!==72||source.newJobs!==2||gaps.f06!=='F06_NOT_RELEASED'||gaps.status!=='NOT_READY')
  throw Error('F05_11_H52_OR_READINESS_FALSE');
 if(source.snapshotMainSha!=='310cb2f4b60c720c0febc0909d5d8e362f831e2a')
  throw Error('F05_11_MAIN_BASELINE_CHANGED');
 const ids=new Set();
 for(const row of source.modules){
  if(ids.has(row.module)||!allowed.has(row.status)||!Number.isInteger(row.pr)||row.pr<30||row.pr>50||
   !row.source||row.productionIssuer!=='SOURCE_GAP'||row.signedScope!=='CI_ONLY')
   throw Error('F05_11_UNSOURCED_SIGNED_COVERAGE');
  ids.add(row.module);
  await stat(resolve('..',row.source));
 }
 const required=['F05-1','F05-2','F05-4','F05-5','F05-6','F05-7','F05-8','F05-9','F05-10','F05-10-D1'];
 for(let i=0;i<11;i++)required.push('F05-3'+String.fromCharCode(65+i));
 if(source.modules.length!==21||required.some(x=>!ids.has(x))||
  gaps.items.length<10||gaps.items.some(x=>!allowed.has(x.status)||!x.noAutoPromotion))
  throw Error('F05_11_MISSING_MANDATORY_MATRIX');
 if(process.env.GH_ACTIONS_READ_TOKEN&&process.env.GITHUB_ACTIONS==='true'){
  for(const m of source.modules){
   const r=await fetch('https://api.github.com/repos/suzhe868-arch/mb/pulls/'+m.pr,
    {headers:{authorization:'Bearer '+process.env.GH_ACTIONS_READ_TOKEN,accept:'application/vnd.github+json'}});
   if(!r.ok)throw Error('F05_11_GITHUB_PR_FETCH_'+m.pr+'_'+r.status);
   const j=await r.json();
   if(j.number!==m.pr||!j.merged_at||!j.head?.sha)
    throw Error('F05_11_FALSE_MERGED_PR_'+m.pr);
   m.signedHead=j.head.sha;m.mergedAt=j.merged_at;m.prUrl=j.html_url;
  }
 }
 return {source,gaps};
}
export async function save(mode,details){
 const {source,gaps}=await validate();
 const out=resolve(dir,'artifacts',mode);
 await mkdir(out,{recursive:true});
 await writeFile(resolve(out,'f05-coverage-matrix.json'),JSON.stringify(source,null,2)+'\n');
 await writeFile(resolve(out,'gap-ledger.json'),JSON.stringify(gaps,null,2)+'\n');
 await writeFile(resolve(out,'physical-audit.json'),JSON.stringify(details,null,2)+'\n');
 console.log('F05_11_F05_COVERAGE_MATRIX_VERIFIED',source.modules.length,gaps.items.length);
}
