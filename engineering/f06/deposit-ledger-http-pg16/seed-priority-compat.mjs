// F06 Deposit B-scope compatibility bridge for the existing signed F05-8 CI seed.
 // The outer entrypoint verifies the REAL Deposit branch, Push, SHA, Run and isolated DB.
 // Only the child invocation receives the historical F06 Lock seed branch expected by
 // the existing guarded helper; this does not change the workflow's real GITHUB_SHA.
import assert from 'node:assert/strict';
import { spawnSync, execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const actualBranch = 'feat/f06-real-deposit-ledger-http-pg16-01';
const actualRef = 'refs/heads/' + actualBranch;
const compatibilityBranch = 'feat/f06-real-lockrequest-http-pg16-01';
const compatibilityRef = 'refs/heads/' + compatibilityBranch;
const expected = {
  GITHUB_REPOSITORY: 'suzhe868-arch/mb',
  GITHUB_REF: actualRef,
  GITHUB_REF_NAME: actualBranch,
  GITHUB_EVENT_NAME: 'push',
  GITHUB_ACTIONS: 'true',
  CI: 'true',
  APP_ENV: 'test',
  NODE_ENV: 'test',
  API_HOST: '127.0.0.1',
  F06_REAL_ENTRY_REF: actualRef,
  F06_REAL_ENTRY_BRANCH: actualBranch,
  F06_REAL_ENTRY_EVENT: 'push',
  F03_1_DATABASE_URL: 'postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test',
  F03_1_ISOLATION_CONFIRM: 'I_AUTHORIZE_F03_1_NEW_EMPTY_PG16_AUTH_ONLY',
  F05_2_ISOLATION_CONFIRM: 'I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY',
  F06_LOCK_TEST_CONSENT: 'I_AUTHORIZE_DISPOSABLE_F06_LOCK_PG16_ONLY'
};
for (const [key, value] of Object.entries(expected)) {
  assert.equal(process.env[key], value, 'F06_REAL_DEPOSIT_PRIORITY_BRIDGE_GATE_' + key);
}
assert.match(process.env.GITHUB_SHA || '', /^[0-9a-f]{40}$/);
assert.match(process.env.GITHUB_RUN_ID || '', /^[0-9]{6,20}$/);
assert.equal(process.env.F06_REAL_ENTRY_SHA, process.env.GITHUB_SHA);
assert.equal(process.env.F06_REAL_ENTRY_RUN_ID, process.env.GITHUB_RUN_ID);
assert.equal(process.env.F06_REAL_DEPOSIT_TEST_CONSENT, 'I_AUTHORIZE_DISPOSABLE_F06_DEPOSIT_HTTP_PG16_ONLY');
assert.equal(execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), process.env.GITHUB_SHA);
const helper = resolve('scripts/f06-lock-seed-signed-priority.mjs');
assert.ok(existsSync(helper), 'existing guarded F05-8 seed helper must exist');
console.info('F06_REAL_DEPOSIT_PRIORITY_COMPAT_BRIDGE_VERIFIED', JSON.stringify({
  actual_ref: actualRef,
  compatibility_ref: compatibilityRef,
  head_sha: process.env.GITHUB_SHA,
  run_id: process.env.GITHUB_RUN_ID,
  scope: 'only the inherited nonproduction F05-8 signed Priority seed; no production issuer or workflow-ref change'
}));
const child = spawnSync(process.execPath, [helper], {
  stdio: 'inherit',
  env: { ...process.env, GITHUB_REF: compatibilityRef, GITHUB_REF_NAME: compatibilityBranch }
});
if (child.error || child.status !== 0) {
  console.error('F06_REAL_DEPOSIT_PRIORITY_COMPAT_BRIDGE_FAILED', JSON.stringify({
    status: child.status, signal: child.signal, reason: child.error?.message || null
  }));
  process.exitCode = 1;
} else {
  console.info('F06_REAL_DEPOSIT_PRIORITY_COMPAT_BRIDGE_COMPLETE', JSON.stringify({
    actual_ref: actualRef, compatibility_ref: compatibilityRef,
    head_sha: process.env.GITHUB_SHA, run_id: process.env.GITHUB_RUN_ID
  }));
}
