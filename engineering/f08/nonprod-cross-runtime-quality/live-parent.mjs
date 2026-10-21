import {writeFileSync} from 'node:fs';
import {fetchAndVerifyParents} from './parent-evidence.mjs';
const {GITHUB_SHA,GITHUB_REF,GITHUB_EVENT_NAME,GITHUB_TOKEN,GITHUB_RUN_ID}=process.env;
if(GITHUB_EVENT_NAME!=='push'||GITHUB_REF!=='refs/heads/feat/f08-nonprod-cross-runtime-quality-02'||
 !/^[0-9a-f]{40}$/.test(GITHUB_SHA??'')||!/^[1-9][0-9]*$/.test(GITHUB_RUN_ID??''))
 throw Error('F08_2_CURRENT_RUN_NOT_AUTHENTIC');
const records=await fetchAndVerifyParents({token:GITHUB_TOKEN,currentSha:GITHUB_SHA});
if(records.length!==2||records.some(x=>x.level!=='HISTORIC_DIFFERENT_SHA'||x.current_head_positive!==false))
 throw Error('F08_2_PARENT_VALIDATION_INCOMPLETE');
writeFileSync('f08-2-parent-evidence.json',JSON.stringify({
 current:{sha:GITHUB_SHA,ref:GITHUB_REF,run:GITHUB_RUN_ID,event:GITHUB_EVENT_NAME},
 parent_records:records,strict_nonprod:true,production_ready:false,source_gap_retained:true,
 note:'历史GitHub官方PR/Run/Job/Artifact只读核验；不得将父不同SHA结果冒充本SHA业务正例'
},null,2)+'\n');
console.log('F08_2_TWO_HISTORICAL_PARENTS_READ_ONLY_VERIFIED');
console.log('F08_2_HISTORIC_DIFFERENT_SHA_SOURCE_GAP_RETAINED');
