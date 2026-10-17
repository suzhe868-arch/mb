import fs from 'node:fs';
const header=["name: H52 合成52节点安全探针","","on:","  push:","    branches:","      - audit/f05-7-h52-synthetic-graph-52-01","    paths:","      - .github/workflows/h52-scheduler-synthetic-52-node-graph.yml","      - audit/h52-synthetic-graph/**","","permissions:","  contents: read","","jobs:"];
const tail=["  safe-52:","    runs-on: ubuntu-latest","    timeout-minutes: 8","    steps:","      - name: Checkout","        uses: actions/checkout@v4","      - name: Synthetic static and negative tests","        run: |","          node audit/h52-synthetic-graph/生成工作流.mjs --check","          node --test audit/h52-synthetic-graph/安全校验.test.mjs","          node audit/h52-synthetic-graph/安全校验.mjs --evidence","      - name: YAML alias anchor","        env:","          SYNTHETIC_CANARY: &z H52_SYNTHETIC_READ_ONLY_CANARY","        run: echo \"$SYNTHETIC_CANARY\"","      - name: YAML alias reference","        env:","          SYNTHETIC_CANARY: *z","        run: echo \"$SYNTHETIC_CANARY\"","      - name: Upload nonempty evidence","        uses: actions/upload-artifact@v4","        with:","          name: h52-synthetic-52-graph-safe-evidence","          path: audit/h52-synthetic-graph/原生证据.json","          if-no-files-found: error","          retention-days: 7"];
export function render() {
  const rows=[...header];
  for(let i=1;i<=51;i++){const k=String(i).padStart(2,'0');rows.push('  safe-'+k+':','    if: $'+'{{ false }}','    runs-on: ubuntu-latest','    steps:','      - run: echo H52_SYNTHETIC_NEVER_EXECUTED');}
  return [...rows,...tail].join('\n')+'\n';
}
if(process.argv.includes('--check')){
  const actual=fs.readFileSync('.github/workflows/h52-scheduler-synthetic-52-node-graph.yml','utf8');
  if(actual!==render())throw Error('生成器字节复核失败');
  console.log('GENERATOR_EXACT_MATCH');
}
