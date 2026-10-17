import fs from 'node:fs';
import cp from 'node:child_process';
const folder='audit/h52-original-source-go-no-go/';
const evidence=JSON.parse(fs.readFileSync(folder+'官方只读证据.json','utf8'));
export function scan(text){
  const split=text.search(/^jobs:\s*$/m);
  if(split<0)throw Error('未发现顶层jobs');
  const body=text.slice(split);
  const all=[...body.matchAll(/^  ([a-zA-Z_][a-zA-Z0-9_-]*):[^\n]*$/gm)];
  if(!all.length)throw Error('没有Job定义');
  const jobs=all.map((v,i)=>{
    const s=body.slice(v.index, all[i+1]?.index ?? body.length);
    const time=s.match(/^    timeout-minutes:\s*(\d+)\s*$/m);
    return {id:v[1],timeout_minutes:time?Number(time[1]):360,explicit_timeout:!!time,pg16_service:/^    services:\s*$/m.test(s),uploads:(s.match(/actions\/upload-artifact@/g)||[]).length,has_matrix:/^    strategy:\s*$/m.test(s)||/^\s+matrix:\s*$/m.test(s),has_needs:/^    needs:/m.test(s),has_job_concurrency:/^    concurrency:/m.test(s)};
  });
  if(new Set(jobs.map(x=>x.id)).size!==jobs.length)throw Error('重复Job键');
  return {job_count:jobs.length,explicit_timeout:jobs.filter(x=>x.explicit_timeout).length,default_timeout:jobs.filter(x=>!x.explicit_timeout).length,pg16_services:jobs.filter(x=>x.pg16_service).length,upload_actions:jobs.reduce((a,x)=>a+x.uploads,0),max_runner_minutes:jobs.reduce((a,x)=>a+x.timeout_minutes,0),matrix_jobs:jobs.filter(x=>x.has_matrix).map(x=>x.id),needs_jobs:jobs.filter(x=>x.has_needs).map(x=>x.id),job_concurrency:jobs.filter(x=>x.has_job_concurrency).map(x=>x.id),jobs};
}
export function readInventory(){
  return evidence.file_hashes.map(([name,sha,expected])=>{
    const file='.github/workflows/'+name;
    const digest=cp.execFileSync('git',['hash-object',file],{encoding:'utf8'}).trim();
    if(digest!==sha)throw Error('禁止的原工作流漂移: '+name+' expected='+sha+' actual='+digest);
    const source=fs.readFileSync(file,'utf8'),v=scan(source);
    if(v.job_count!==expected)throw Error('Job数量变化: '+name);
    return {file,sha,bytes:Buffer.byteLength(source,'utf8'),...v};
  });
}
function rubyParse(filepath){
  const src="require 'psych';require 'json';d=Psych.safe_load_file(ARGV[0], aliases: true);raise 'Not a YAML jobs map' unless d.is_a?(Hash)&&d['jobs'].is_a?(Hash);puts JSON.generate({'jobs'=>d['jobs'].size,'keys_unique'=>d['jobs'].keys.uniq.size==d['jobs'].size})";
  const r=cp.spawnSync('ruby',['-e',src,filepath],{encoding:'utf8',timeout:15000});
  return r.status===0?{state:'RUBY_PSYCH_PARSED',data:JSON.parse(r.stdout.trim())}:{state:'RUBY_PSYCH_NOT_PARSED',code:r.status,stderr:(r.stderr||'').slice(0,500)};
}
export function audit(){
  const entries=readInventory();
  const original=entries.find(x=>x.file.endsWith('/f05-7-frozen-h52-revalidation.yml'));
  const total=entries.reduce((s,x)=>({jobs:s.jobs+x.job_count,services:s.services+x.pg16_services,artifact_actions:s.artifact_actions+x.upload_actions,max_runner_minutes:s.max_runner_minutes+x.max_runner_minutes,explicit_timeout:s.explicit_timeout+x.explicit_timeout,default_timeout:s.default_timeout+x.default_timeout,matrix_jobs:s.matrix_jobs+x.matrix_jobs.length}),{jobs:0,services:0,artifact_actions:0,max_runner_minutes:0,explicit_timeout:0,default_timeout:0,matrix_jobs:0});
  for(const [k,n] of Object.entries({jobs:66,services:64,artifact_actions:110,max_runner_minutes:3520,explicit_timeout:62,default_timeout:4,matrix_jobs:0}))if(total[k]!==n)throw Error('66Job安全预算基线漂移 '+k+' expected='+n+' actual='+total[k]);
  if(original.bytes!==511380)throw Error('原H52字节漂移');
  const yaml=fs.readFileSync(original.file,'utf8');
  const anchors=(yaml.match(/- run:\s*&z\b/g)||[]).length;
  const aliases=(yaml.match(/- run:\s*\*z\b/g)||[]).length;
  const f03push=(yaml.match(/git push origin HEAD:refs\/heads\/feat\/f03-/g)||[]).length;
  if(anchors!==1||aliases!==49||f03push!==30)throw Error('H52锚点/跨F03精确push守卫静态漂移');
  const ruby=rubyParse(original.file);
  if(ruby.state==='RUBY_PSYCH_PARSED'&&ruby.data.jobs!==52)throw Error('Ruby解析Job数不为52');
  return {mode:'READ_ONLY_NO_SOURCE_EXECUTION',commit:process.env.GITHUB_SHA||'LOCAL',official_root_cause:'OFFICIAL_ROOT_CAUSE_UNKNOWN',original_h52_scheduler:'H52_ORIGINAL_52_JOB_SCHEDULER_NOT_PROVEN',source_gap:'OPEN',source_ref_update_authorized:false,phase2_push_authorized:false,history:evidence.historical_zero_job,expected_old_sha:evidence.expected_old_sha,planned_target_main_sha:evidence.baseline_main_sha,inventory:entries.map(({jobs,...x})=>x),totals:total,h52:{anchors_z:anchors,alias_use_z:aliases,f03_guarded_push_occurrences:f03push,offline_ruby:ruby},decision:'A_OPTION_1_NO_GO_MINIMAL_H52_REPAIR_OR_BUDGET_APPROVAL_REQUIRED',c_not_ready:true,v1_production_not_ready:true};
}
if(process.argv.includes('--evidence')){
  const result=audit();
  const path=folder+'GitHub只读诊断结果.json';
  fs.writeFileSync(path,JSON.stringify(result,null,2)+'\n');
  console.log('H52_ORIGINAL_READONLY_AUDIT_COMPLETED',JSON.stringify({totals:result.totals,h52:result.h52,decision:result.decision}));
}
