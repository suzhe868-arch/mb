import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const name='engineering/f05/deterministic-matching-readiness-four-tier/tests/https.test.mjs';
const file=readFileSync(name,'utf8');
const audit=readFileSync('engineering/f05/source-controlled-recovery-03/h52-readonly-audit.mjs','utf8');
const probe=readFileSync('engineering/f05/source-controlled-recovery-03/https-port-collision-probe.mjs','utf8');
const h52=readFileSync('.github/workflows/f05-7-frozen-h52-revalidation.yml','utf8');
const count=(s,t)=>s.split(t).length-1;
test('only OS-assigned TCP transport port; never bind historic fixed port',()=>{
 assert.match(file,/server\.listen\(0,'127\.0\.0\.1',ok\)/);
 assert.doesNotMatch(file,/server\.listen\(48988/);
 assert.match(file,/port:transportPort/);
});
test('preserve exactly original fixed virtual TLS origin from source CI router',()=>{
 assert.match(file,/origin='https:\/\/127\.0\.0\.1:48988'/);
 assert.match(file,/host:new URL\(origin\)\.host,origin/);
});
test('do not broaden listener to public interface',()=>{
 assert.doesNotMatch(file,/server\.listen\(0,'0\.0\.0\.0'/);
 assert.match(file,/assert\.equal\(address\.address,'127\.0\.0\.1'\)/);
});
test('seven original B01-07 genuine TLS denial assertions remain',()=>{
 for(let i=1;i<=7;i++) assert.equal(count(file,`test('7-B0${i}`),1);
});
test('preserve CSRF, duplicate-cookie, cross-origin and issuer denial',()=>{
 for(const x of ['x-csrf-token','__Host-mb_pc','https://evil.invalid','F05_7_PRODUCTION_MATCHING_RULE_ISSUERS_SOURCE_GAP','cache-control','no-store'])
  assert.ok(file.includes(x),x);
});
test('fixed port deliberately held and EADDRINUSE explicitly reproduced',()=>{
 assert.match(probe,/sentinel\.listen\(oldPort,host,resolve\)/);
 assert.match(probe,/assert\.equal\(error\?\.code,'EADDRINUSE'/);
 assert.match(probe,/ci-job\.sh'\,'https'/);
});
test('no alternate auth/source override, no skip/only in modified test',()=>{
 assert.doesNotMatch(file,/\.skip\(|\.only\(/);
 assert.doesNotMatch(file,/process\.env\.[A-Z_]*TOKEN\s*=/);
});
test('H52 is read-only and 52 job headers preserved',()=>{
 assert.equal([...h52.matchAll(/^  [a-z][a-z0-9-]*:(?=\s|$)/gm)].length,52);
 assert.equal(count(h52,'contents: write'),0);
 assert.equal(count(h52,'image: postgres:16-alpine'),50);
});
test('H52 source trigger invariant and 49 reuse aliases',()=>{
 assert.match(h52,/^on: \{push: \{branches: feat\/f05-7-deterministic-matching-readiness-four-\*\}\}/);
 assert.equal(count(h52,'- run: &z bash '),1);
 assert.equal(count(h52,'- run: *z'),49);
});
test('official H52 previous workflow failure read-only, never replay',()=>{
 assert.match(audit,/actions\/runs\//);
 assert.doesNotMatch(audit,/method:\s*['\"]POST|execFileSync\(['\"]git|spawn\(['\"]git/);
});
test('audit requires signed original HTTPS baseline SHA and freezes 7 cases',()=>{
 assert.match(audit,/5fc9861b6341e4ee066c594c808557b321d9b95e/);
 assert.match(audit,/originalSevenDenialsByteIdentical:true/);
 assert.match(audit,/src\.slice\(src\.indexOf\(frozenStart\)\)===before\.slice/);
});
test('audit cannot conflate YAML parsing and scheduler success',()=>{
 assert.match(audit,/h52GithubSchedulerProven:false/);
 assert.match(audit,/originalRefPushed:false/);
 assert.match(audit,/officialParentSourceVerified:false/);
});
