import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {count, FILES, jobsOf, sourceBranchGuard, validatePatch, gitBlobSha, ORIGINAL_REF, IMAGE, DOCKER_IMAGE, WRITE_JOBS} from '../compat-audit.mjs';

const guardedJob='f03-2m-transaction-responsible-handover-pg16';
const guardedRef=WRITE_JOBS[guardedJob];
const valid='      contents: write\n' +
  '          test "$GITHUB_REF" = \''+guardedRef+'\'\n' +
  '          git push origin HEAD:'+guardedRef+'\n';
function denies(text,job=guardedJob) { assert.throws(()=>sourceBranchGuard(text,job),/FAIL_CLOSED/); }
test('exact seven frozen files, 8 workflows, 66 job and 62 services contract',()=>{
  assert.equal(FILES.length,7);
  assert.equal(FILES.reduce((n,f)=>n+f[2],2),66);
  assert.equal(FILES.reduce((n,f)=>n+f[3],0),62);
});
test('ref is one frozen source branch and not the original F03 source',()=>{
  assert.equal(ORIGINAL_REF,'refs/heads/feat/f05-7-deterministic-matching-readiness-four-tier');
  assert.equal(sourceBranchGuard(valid,guardedJob).denied_by_original_ref,true);
});
test('reject absent write-guard',()=>denies('      contents: write\n          git push origin HEAD:'+guardedRef+'\n'));
test('reject F03 ref mismatch',()=>denies(valid.replace('test "$GITHUB_REF" = \''+guardedRef+'\'','test "$GITHUB_REF" = \'refs/heads/feat/f03-wrong\'')));
test('reject second unguarded push',()=>denies(valid+'          git push origin HEAD:'+guardedRef+'\n'));
test('reject second guard',()=>denies(valid+'          test "$GITHUB_REF" = \''+guardedRef+'\'\n'));
test('reject push before guard',()=>denies(valid.replace(/          test.*\n          git push.*\n/,'          git push origin HEAD:'+guardedRef+'\n          test "$GITHUB_REF" = \''+guardedRef+'\'\n')));
test('reject missing write declaration',()=>denies(valid.replace('contents: write','contents: read')));
test('reject attempted F05 ref push',()=>denies(valid.replaceAll(guardedRef,ORIGINAL_REF)));
test('reject unexpected newly added write-capable job',()=>denies(valid,'unapproved_job'));
test('reject direct original F05 ref as guarded F03 write',()=>denies(valid.replace('refs/heads/feat/f03-transaction-responsible-handover-2m',ORIGINAL_REF)));
test('sha1 git blob computes Git standard empty blob SHA',()=>assert.equal(gitBlobSha(''),'e69de29bb2d1d6434b8b29ae775ad8c2e48c5391'));
test('immutable eighth source workflow original baseline SHA and two jobs',()=>{
  const s=readFileSync('.github/workflows/f05-7-deterministic-matching-readiness-four-tier.yml','utf8');
  assert.equal(gitBlobSha(s),'3f563fcc3137197f37c986963a3e48259d1f4626');
  assert.equal(jobsOf(s).jobs.length,2);
});
test('seven modified files each retains expected service and new per-job alias count',()=>{
  FILES.forEach(([name,,jobs,services])=>{
    const s=readFileSync('.github/workflows/'+name,'utf8');
    assert.equal(jobsOf(s).jobs.length,jobs,name);
    assert.equal(count(s,'image: '+DOCKER_IMAGE),services,name);
    assert.equal(count(s,'pg16-local-alias.sh'),services,name);
    assert.equal(count(s,'contents: write'),0,name);
    assert.equal(count(s,'image: '+IMAGE),0,name);
  });
});
test('no changed workflow grants a global write token',()=>{
  FILES.forEach(([name])=>{
    const s=readFileSync('.github/workflows/'+name,'utf8');
    assert.doesNotMatch(s,/contents: write/);
    assert.doesNotMatch(s,/pull_request:/);
    assert.match(s,/feat\/f05-7-deterministic-matching-readiness-four-tier/);
  });
});
test('old guarded F03 push commands remain unmodified and cannot run on frozen F05 ref',()=>{
  const s=readFileSync('.github/workflows/f05-7-frozen-h52-revalidation.yml','utf8');
  for(const [job,ref] of Object.entries(WRITE_JOBS)){
    const entry=jobsOf(s).jobs.find(x=>x.name===job);
    assert.ok(entry,job);
    assert.match(entry.source,/contents: read/);
    assert.match(entry.source,new RegExp('git push origin HEAD:'+ref));
    assert.match(entry.source,/test "\$GITHUB_REF" = 'refs\/heads\/feat\/f03-/);
    assert.notEqual(ref,ORIGINAL_REF);
  }
});
test('old source negative gates and artifacts remain',()=>{
  const names=['f05-7-frozen-i2-revalidation.yml','f05-7-frozen-j2-revalidation.yml','f05-7-frozen-k2-revalidation.yml','f05-7-frozen-f05-4-2-revalidation.yml','f05-7-frozen-f05-5-2-revalidation.yml','f05-7-frozen-f05-6-2-revalidation.yml'];
  names.forEach(name=>{
    const s=readFileSync('.github/workflows/'+name,'utf8');
    assert.match(s,/source/);
    assert.match(s,/https/);
    assert.equal(count(s,'if-no-files-found: error'),2);
    assert.equal(count(s,'actions\/upload-artifact@v4'),2);
  });
});
test('alias shell never pulls from ECR or allows mismatched container tag',()=>{
  const s=readFileSync('engineering/f05/source-controlled-recovery-02/pg16-local-alias.sh','utf8');
  assert.match(s,/docker tag "\$image" "\$legacy"/);
  assert.match(s,/test "\$\{original_ids\[0\]\}" = "\$\{legacy_ids\[0\]\}"/);
  assert.match(s,/docker inspect "\$\{original_ids\[0\]\}" --format/);
  assert.doesNotMatch(s,/\bdocker pull\b/);
  assert.match(s,/160000/);
  assert.match(s,/170000/);
});
test('no login, remote writes, token escalation in alias shell',()=>{
  const s=readFileSync('engineering/f05/source-controlled-recovery-02/pg16-local-alias.sh','utf8');
  assert.doesNotMatch(s,/(git push|gh api|curl|wget|docker login|GITHUB_TOKEN|GITHUB_REF)/);
});
test('tampered source fails byte-for-byte canonicalization',()=>{
  const sample=readFileSync('.github/workflows/f05-7-frozen-i2-revalidation.yml','utf8');
  assert.throws(()=>validatePatch(sample,sample.replace('postgres:16-alpine','postgres:15-alpine'),'f05-7-frozen-i2-revalidation.yml'),/FAIL_CLOSED/);
});
test('attempt to reuse F05 frozen source under unapproved filename rejected',()=>{
  assert.throws(()=>validatePatch('','', 'f05-7-frozen-not-approved.yml'),/FAIL_CLOSED/);
});
test('unexpected missing alias cannot be accepted as signed patch',()=>{
  const sample=readFileSync('.github/workflows/f05-7-frozen-i2-revalidation.yml','utf8');
  assert.throws(()=>validatePatch(sample,sample.replace('pg16-local-alias.sh','noop.sh'),'f05-7-frozen-i2-revalidation.yml'),/FAIL_CLOSED/);
});
test('all F05 local ref writes in H52 remain guarded and read-only',()=>{
  const s=readFileSync('.github/workflows/f05-7-frozen-h52-revalidation.yml','utf8');
  assert.equal(count(s,'contents: write'),0);
  assert.equal(Object.keys(WRITE_JOBS).length,6);
});
