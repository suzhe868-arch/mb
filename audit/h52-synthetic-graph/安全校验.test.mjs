import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {audit} from './安全校验.mjs';
import {render} from './生成工作流.mjs';
const s=fs.readFileSync('.github/workflows/h52-scheduler-synthetic-52-node-graph.yml','utf8');
test('正例：同字节生成器',()=>assert.equal(render(),s));
test('正例：52Job与1Runner',()=>assert.deepEqual([audit(s).jobs,audit(s).skipped,audit(s).max_runners],[52,51,1]));
const invalid=[
  ['永久跳过被打开',s.replace('if: $'+'{{ false }}','if: $'+'{{ true }}')],
  ['删除Job',s.replace('  safe-01:','  unsafe-01:')],
  ['重复Job',s.replace('  safe-02:','  safe-01:')],
  ['超时',s.replace('timeout-minutes: 8','timeout-minutes: 15')],
  ['PR事件越界',s.replace('  push:\n','  pull_request:\n  push:\n')],
  ['旧来源ref越界',s.replace('audit/f05-7-h52-synthetic-graph-52-01','feat/f05-7-deterministic-matching-readiness-four-tier')],
  ['contents写权限',s.replace('contents: read','contents: write')],
  ['PG数据库服务',s.replace('jobs:\n','jobs:\n  services:\n')],
  ['删官方工件',s.replace('actions/upload-artifact@v4','actions/cache@v4')],
  ['锚点被删除',s.replace('&z H52_SYNTHETIC_READ_ONLY_CANARY','H52_SYNTHETIC_READ_ONLY_CANARY')],
  ['跳过job新增uses',s.replace('      - run: echo H52_SYNTHETIC_NEVER_EXECUTED','      - uses: actions/checkout@v4')],
  ['超出512000字节',s+'#'.repeat(512001)]
];
for(const [name,source] of invalid)test('负例：'+name,()=>assert.throws(()=>audit(source)));
