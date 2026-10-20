import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const patterns=[
 {file:'./evidence/HTTP隔离拒绝_TAP.log',count:32},
 {file:'./evidence/真实PG16缺签_TAP.log',count:6}
];
const sha=process.env.GITHUB_SHA;
assert.match(sha||'',/^[0-9a-f]{40}$/);
for(const {file,count} of patterns){
 const text=readFileSync(new URL(file,import.meta.url),'utf8');
 const field=(name)=>{
  const match=[...text.matchAll(new RegExp('^# '+name+' (\\d+)$','gm'))].at(-1);
  assert.ok(match,file+' missing '+name);
  return Number(match[1]);
 };
 assert.equal(field('tests'),count,file+' test count');
 assert.equal(field('pass'),count,file+' pass count');
 for(const x of ['fail','skipped','cancelled'])assert.equal(field(x),0,file+' '+x);
 assert.ok(!/^not ok /m.test(text),file+' raw TAP failure');
}
const pg=readFileSync(new URL('./evidence/真实PG16缺签_TAP.log',import.meta.url),'utf8');
assert.ok(pg.includes('F06_164_ACTUAL_PG16_BACKEND'),'native nonprivileged PG proof missing');
console.log('F06_164_PARTIAL_NATIVE_PASS',{
 sha,httpSecurityCases:32,nativePgFailClosed:6,
 signedTxHandoffCancelRefundPositive:0,
 runtimeAppWired:'LOCK_ONLY_SUBJECT_TO_FULL_LOCK_SIGNED_DB',
 next:'BLOCKED_TRUSTED_F06_ISSUER_RUNTIME_GAP'
});
