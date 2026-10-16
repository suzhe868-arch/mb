import test from 'node:test';
import assert from 'node:assert/strict';
import {readTrigger,jobsAndCost,classifyWorkflow,changedDomains,policyStatus,cases,REPO} from '../trigger-scope-audit.mjs';
const broad=['name: F05 legacy','on:','  push:','    branches: [feat/f05-old]','  pull_request:','    branches: [main]','  workflow_dispatch:','permissions: {contents: read, actions: read}','jobs:','  source:','    name: True Source','    runs-on: ubuntu-latest','    timeout-minutes: 50','    services:','      postgres:','        image: postgres:16','  https:','    runs-on: ubuntu-latest','    timeout-minutes: 10'].join('\n');
const narrow=['name: Component scoped','on:','  push:','    branches: [main]','    paths: [engineering/f05/**]','  pull_request:','    branches: [main]','    paths:','      - engineering/f05/**','      - engineering/shared/**','jobs:','  guard:','    runs-on: ubuntu-latest'].join('\n');
test('非过滤的原F05广谱PR必须识别',()=>{
 const r=readTrigger(broad);assert.ok(r.events.includes('pull_request'));assert.ok(r.events.includes('push'));assert.ok(r.events.includes('workflow_dispatch'));assert.equal(r.broadPR,true);
});
test('路径过滤的PR被分类而不主动认定安全',()=>{const r=readTrigger(narrow);assert.equal(r.broadPR,false);assert.equal(r.hasPaths,true);});
test('Push路径限定不能误当PR已限定',()=>{
 const s=['on:','  push:','    branches: [main]','    paths: [engineering/f05/**]','  pull_request:','    branches: [main]','jobs:','  smoke:','    runs-on: ubuntu-latest'].join('\n');
 assert.equal(readTrigger(s).broadPR,true);
});
test('inline map原生push不能凭猜测变成PR',()=>{const r=readTrigger('on: {push: {branches: feat/f05-7-*}}');assert.deepEqual(r.events,['push']);assert.equal(r.hasPR,false);});
test('inline数组多事件读取准确',()=>{const r=readTrigger('on: [push, pull_request, workflow_dispatch]');assert.equal(r.broadPR,true);assert.equal(r.events.length,3);});
test('标量pull_request是宽触发',()=>{const r=readTrigger('on: pull_request');assert.equal(r.broadPR,true);});
test('没有触发器不猜',()=>{const r=readTrigger('name: No events');assert.equal(r.kind,'UNPARSEABLE');assert.equal(r.events.length,0);});
test('不把workflow_call视为PR',()=>{const r=readTrigger('on:\n  workflow_call:\n');assert.equal(r.hasPR,false);});
test('on的顶部字段不会误读jobs内部on',()=>{const r=readTrigger('name: Example\njobs:\n  example:\n    steps:\n      - run: echo on: pull_request');assert.equal(r.events.length,0);});
test('read jobs count and nominal cost ceiling',()=>{const r=jobsAndCost(broad);assert.equal(r.jobCount,2);assert.equal(r.timeoutCeilingMinutes,60);assert.equal(r.hasPostgres,true);});
test('F05冻结源永远列成敏感不可直接修改',()=>{const r=classifyWorkflow('.github/workflows/f05-10-frozen-f05-8-four-revalidation.yml',broad);assert.equal(r.domain,'F05');assert.equal(r.frozenOrLegacyParent,true);assert.equal(r.sourceRisk,'DO_NOT_MODIFY_WITHOUT_A_PER_FILE_AUTHORIZATION');});
test('非冻结F05依然必须经A逐文件白名单',()=>{const r=classifyWorkflow('.github/workflows/f05-9-new.yml',broad);assert.equal(r.sourceRisk,'A_PER_FILE_REVIEW_REQUIRED');});
test('PG16 job and actual native Source guard annotate separately',()=>{const r=classifyWorkflow('.github/workflows/f05-7-old.yml',broad+'\n# ci-job.sh source');assert.equal(r.officialSourceGuard,true);assert.equal(r.hasPG16,true);});
test('工作流display name相同不能合并路径',()=>{
 const r1=classifyWorkflow('.github/workflows/f05-7-one.yml',broad),r2=classifyWorkflow('.github/workflows/f05-8-two.yml',broad);
 const x=policyStatus([r1,r2]);assert.equal(x.f05BroadPR,2);assert.equal(x.duplicateDisplayNames.length,1);assert.equal(x.duplicateDisplayNames[0].paths.length,2);
});
test('F05宽触发不代表历史父证明已成功',()=>{const r=policyStatus([classifyWorkflow('.github/workflows/f05-8-old.yml',broad)]);assert.equal(r.f05ParentProof,'SOURCE_GAP_FOR_CURRENT_MAIN');assert.equal(r.requiredChecks.includes('UNKNOWN'),true);});
test('PATH C-only matrix',()=>{assert.deepEqual(changedDomains(['apps/mobile/src/a.ts']),['C']);});
test('PATH F05-only matrix',()=>{assert.deepEqual(changedDomains(['engineering/f05/ci/source.sh']),['F05']);});
test('PATH F08-only matrix',()=>{assert.deepEqual(changedDomains(['engineering/f08/ci/source.sh']),['F08']);});
test('PATH shared library forces 3 domain union',()=>{assert.deepEqual(changedDomains(['engineering/shared/auth.ts']),['C','F05','F08']);});
test('PATH lockfile forces 3 domain union',()=>{assert.deepEqual(changedDomains(['package-lock.json']),['C','F05','F08']);});
test('PATH new workflow preserves F05 and CI',()=>{assert.deepEqual(changedDomains(['.github/workflows/f05-9-new.yml']),['CI','F05']);});
test('PATH non-F05 workflow not invented to F05',()=>{assert.deepEqual(changedDomains(['.github/workflows/ci-audit.yml']),['CI']);});
test('PATH mixed retains both C and F05',()=>{assert.deepEqual(changedDomains(['apps/mobile/a','engineering/f05/b']),['C','F05']);});
test('PATH pure docs without artificial F05',()=>{assert.deepEqual(changedDomains(['07_重建工作区/a.md']),['DOC']);});
test('UNKNOWN changed path never mistaken as docs-only',()=>{assert.deepEqual(changedDomains(['unmapped/code.rs']),['UNKNOWN']);});
test('all 7 mixed scenarios have exact union',()=>{for(const q of cases){assert.deepEqual(changedDomains(q.changes),[...q.domains].sort(),q.id);}});
test('zero-workflow collection is not declared repaired',()=>{const r=policyStatus([]);assert.equal(r.cOnlyTriggersIrrelevantF05,false);assert.equal(r.perFileAWhitelistRequired,true);});
test('URL of repository is frozen and not interpolated',()=>{assert.equal(REPO,'suzhe868-arch/mb');});

import {readFileSync as signedReadFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const aApprovedTen = [[".github/workflows/f05-7-deterministic-matching-readiness-four-tier.yml","cb56f8587807709ad598311e6964fa44a49d3020"],[".github/workflows/f05-8-priority-arbitration-ttl-handover.yml","9dcac53085220e21c3e98fefc41d8c54d11dc867"],[".github/workflows/f05-9-recommendation-visibility-grants.yml","05c7663b252bc61fe09c226a9e31ab32770fbd8f"],[".github/workflows/f05-10-consultation-assignee-sla.yml","6f8d814b370b7ba3aaea0e60c3f2b43e739a212f"],[".github/workflows/f05-10-d1-public-pool-owner-claim.yml","dcb6c5c6a56965419d1723153ceb6a0ddcc5649f"],[".github/workflows/f05-9-frozen-f05-8-four-revalidation.yml","867346565654667601988a3ed90f92f84ce92bbc"],[".github/workflows/f05-10-frozen-f05-8-four-revalidation.yml","5dba5c672be7f914a15dc89a57df0e78e7bf5baf"],[".github/workflows/f05-10-d1-frozen-f05-8-four-revalidation.yml","2e66de2af3022d870678f068fd9f636b586f4515"],[".github/workflows/f05-10-frozen-f05-9-two-revalidation.yml","def7c12248cb17d832a1d6a750e42ceb2601aeac"],[".github/workflows/f05-10-d1-frozen-f05-9-two-revalidation.yml","279734b953484e6648a7f8019b00672a170f2fc5"]];
const aApprovedPaths = ["engineering/f01/**","engineering/f02/**","engineering/f03/**","engineering/f04/**","engineering/f05/**","engineering/shared/**","engineering/db/**","engineering/database/**","engineering/migrations/**","engineering/sql/**","engineering/scripts/**","engineering/ci/**","engineering/package.json","engineering/package-lock.json","engineering/npm-shrinkwrap.json","engineering/pnpm-lock.yaml","engineering/yarn.lock","engineering/.npmrc","package.json","package-lock.json","npm-shrinkwrap.json","pnpm-lock.yaml","yarn.lock",".npmrc","database/**","migrations/**","sql/**","scripts/**",".github/actions/**",".github/workflows/f05-*.yml",".github/workflows/f05-*.yaml"];
const aOnlyBlock = '  pull_request:\n    branches: [main]\n';
const aNewPaths = '    paths:\n' + aApprovedPaths.map(p=>"      - '"+p+"'").join('\n')+'\n';
function aSignedBlobSha(text){const b=Buffer.from(text,'utf8');return createHash('sha1').update(Buffer.from('blob '+b.length+String.fromCharCode(0))).update(b).digest('hex');}
function aGlobMatches(glob,path){
  if(glob.endsWith('/**'))return path.startsWith(glob.slice(0,-2));
  if(glob.includes('*')){const [before,after]=glob.split('*');return path.startsWith(before)&&path.endsWith(after)&&!path.slice(before.length,path.length-after.length).includes('/');}
  return path===glob;
}
function aShouldRun(changedFiles){return changedFiles.some(path=>aApprovedPaths.some(glob=>aGlobMatches(glob,path)));}
test('A授权十份Workflow保持签字原Blob且只添加pull_request.paths',()=>{
 for(const [path,sha] of aApprovedTen){
  const yaml=signedReadFileSync(path,'utf8');const inserted=aOnlyBlock+aNewPaths;
  assert.equal(yaml.split(inserted).length,2,'trigger insertion count: '+path);
  assert.equal(aSignedBlobSha(yaml.replace(inserted,aOnlyBlock)),sha,'原Git Blob不可发生其他变更: '+path);
  const events=readTrigger(yaml);assert.equal(events.hasPaths,true,path);assert.equal(events.hasPathsIgnore,false,path);
  assert.ok(events.events.includes('push'),path);assert.ok(events.events.includes('workflow_dispatch'),path);
  assert.ok(events.events.includes('pull_request'),path);
 }
});
test('C-only与C专用CI不触发十项F05',()=>assert.equal(aShouldRun(['apps/mobile/src/pages/c01/index.tsx','.github/workflows/c-app-01-build.yml']),false));
test('F05-only必须触发',()=>assert.equal(aShouldRun(['engineering/f05/consultation-assignee-sla/runner.mjs']),true));
test('共享模块和全套前置F01至F04、锁文件变更必须触发',()=>{
 for(const p of ['engineering/f01/auth/index.mjs','engineering/f02/customer/runner.mjs','engineering/f03/session/runner.mjs','engineering/f04/callback/runner.mjs','engineering/shared/auth.mjs','engineering/migrations/001.sql','engineering/package-lock.json','package-lock.json','database/schema.sql','.github/actions/shared/action.yml'])assert.equal(aShouldRun([p]),true,p);
});
test('workflow-self两种YAML扩展名触发',()=>{
 assert.equal(aShouldRun(['.github/workflows/f05-10-consultation-assignee-sla.yml']),true);
 assert.equal(aShouldRun(['.github/workflows/f05-10-sample.yaml']),true);
});
test('混合C与F05必须触发',()=>assert.equal(aShouldRun(['apps/mobile/src/c01.tsx','engineering/f05/recommendation-visibility-grants/runner.mjs']),true));
test('F08-only和DOC-only不误触发十项F05',()=>{assert.equal(aShouldRun(['engineering/f08/api.mjs']),false);assert.equal(aShouldRun(['07_重建工作区/决策记录.md']),false);});
test('正向过滤不出现paths-ignore或C专用模式',()=>{
 assert.equal(aApprovedPaths.length,31);
 for(const pattern of aApprovedPaths){assert.ok(!pattern.startsWith('!'));assert.ok(!pattern.startsWith('apps/mobile/'));assert.ok(!pattern.startsWith('.github/workflows/c-app-'));}
});
