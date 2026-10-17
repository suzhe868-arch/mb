import fs from 'node:fs';
const path='.github/workflows/h52-scheduler-synthetic-52-node-graph.yml';
export function audit(s){
  const deny=(bad,msg)=>{if(bad)throw Error(msg)};
  deny(Buffer.byteLength(s,'utf8')>=512000,'文件尺寸超限');
  deny(!s.includes('on:\n  push:\n    branches:\n      - audit/f05-7-h52-synthetic-graph-52-01\n    paths:\n'),'分支限制无效');
  deny(!s.includes('      - .github/workflows/h52-scheduler-synthetic-52-node-graph.yml\n      - audit/h52-synthetic-graph/**\n'),'路径限制无效');
  deny(!s.includes('permissions:\n  contents: read\n'),'只读权限丢失');
  for(const x of [/pull_request\s*:/,/workflow_dispatch\s*:/,/services\s*:/,/postgres/i,/secrets[.:]/i,/feat\/f05-7-/i,/\b(?:curl|wget|docker)\s/i,/contents:\s*write/i])deny(x.test(s),'禁止依赖出现: '+x);
  const jobs=[...s.matchAll(/^  safe-(\d{2}):[ \t]*$/gm)];
  deny(jobs.length!==52,'Job数量不是52');
  for(let i=0;i<jobs.length;i++){
    const b=s.slice(jobs[i].index,jobs[i+1]?.index??s.length), k=String(i+1).padStart(2,'0');
    deny(jobs[i][1]!==k,'Job键非顺序或重复');
    deny(!/^    runs-on: ubuntu-latest$/m.test(b),'缺Runner声明');
    if(i<51){
      deny(!b.includes('    if: $'+'{{ false }}'+'\n'),'跳过条件失效');
      deny(!b.includes('      - run: echo H52_SYNTHETIC_NEVER_EXECUTED'),'占位不是固定echo');
      deny(/^\s+uses:/m.test(b),'跳过Job有外部Action');
    }else{
      deny(/^\s{4}if:/m.test(b),'唯一Runner不能跳过');
      deny(!b.includes('    timeout-minutes: 8\n'),'8分钟限制丢失');
      deny(!b.includes('node --test audit/h52-synthetic-graph/安全校验.test.mjs'),'Node测试丢失');
      deny(!b.includes('actions/upload-artifact@v4'),'证据上传丢失');
      deny(!b.includes('&z H52_SYNTHETIC_READ_ONLY_CANARY')||!b.includes('SYNTHETIC_CANARY: *z'),'锚点定义引用不全');
    }
  }
  return {jobs:52,skipped:51,max_runners:1,bytes:Buffer.byteLength(s,'utf8')};
}
if(process.argv.includes('--evidence')){
  const data=audit(fs.readFileSync(path,'utf8'));
  fs.writeFileSync('audit/h52-synthetic-graph/原生证据.json',JSON.stringify({...data,head_sha:process.env.GITHUB_SHA||'LOCAL',original_H52_proven:false,source_gap_closed:false},null,2)+'\n');
  console.log('H52_SYNTHETIC_STATIC_PASS',JSON.stringify(data));
}
