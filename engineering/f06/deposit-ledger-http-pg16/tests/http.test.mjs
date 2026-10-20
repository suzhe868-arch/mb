import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test, before, after } from 'node:test';
import { IsolatedAuth } from '../../../src/f03-auth-service.mjs';
import { sessionDigest } from '../../../src/f03-auth-crypto.mjs';
import { connect, verify, withF062 } from '../../deposit-ledger-ci/migration.mjs';
import { withParentBranch } from '../../lock-lifecycle-ci/migration.mjs';
import { CI_SYSTEM_PROOF, expireOrdinaryCI } from '../../lock-lifecycle-ci/service.mjs';
import { decisionCI, intakeCI } from '../../lockrequest-approval-waitlist-ci/service.mjs';
import { createHttpServer, assertRealEntry } from '../server.mjs';
import { productionIssuerDeny } from '../../deposit-ledger-ci/service.mjs';

const CONSENT = 'CI_SYNTHETIC_PHONE_CONSENT_NOT_PRODUCTION';
const secret = Buffer.alloc(32, 61);
const customerId = 86180101;
const vehicleId = n => 86181100 + n;
const cycleId = n => 86182100 + n;
const older = fn => withF062(() => withParentBranch(fn));
const recordPath = '/__ci__/f06-real-deposit/deposits';
let db, auth, server, baseUrl, token, managerToken, managerRoleId, salesRoleId, scopeId;
let locks = {};
let deposit1, deposit2, recordPayload1, correctionPayload1, correction1;

const q = async (sql, args = []) => db.query(sql, args);
const rows = async (sql, args = []) => (await q(sql, args)).rows;

async function listen(target) {
  await new Promise((resolve, reject) => {
    target.once('error', reject);
    target.listen(0, '127.0.0.1', resolve);
  });
}
async function closeServer(target) {
  if (!target?.listening) return;
  await new Promise((resolve, reject) => target.close(error => error ? reject(error) : resolve()));
}
async function call(path, method = 'GET', body, actorToken = token, extraHeaders = {}) {
  const headers = { origin: baseUrl, ...extraHeaders };
  if (actorToken) headers.authorization = 'Bearer ' + actorToken;
  if (body !== undefined) headers['content-type'] = 'application/json';
  const response = await fetch(baseUrl + path, {
    method, headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  return { status: response.status, body: await response.json(), headers: response.headers };
}
async function callRaw(path, raw, actorToken = token) {
  const response = await fetch(baseUrl + path, {
    method: 'POST',
    headers: { origin: baseUrl, authorization: 'Bearer ' + actorToken, 'content-type': 'application/json' },
    body: raw
  });
  return { status: response.status, body: await response.json() };
}
function recordPayload(name, amountCents, lockId = locks[1], extra = {}) {
  return {
    lockId, amountCents, currency: 'CNY', paymentMethod: 'bank_transfer',
    eventKey: 'f06-real-http-' + name + '-' + process.env.GITHUB_RUN_ID,
    receivedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    note: 'synthetic non-production acceptance',
    syntheticVoucher: 'CI-ONLY-' + name,
    ...extra
  };
}
function correctionPayload(name, deltaCents, lockId = locks[1], depositId = deposit1, extra = {}) {
  return {
    lockId, depositId, action: 'correction', deltaCents, currency: 'CNY',
    eventKey: 'f06-real-http-' + name + '-' + process.env.GITHUB_RUN_ID,
    reason: 'Synthetic CI correction reason ' + name,
    ...extra
  };
}

before(async () => {
  assertRealEntry();
  db = await connect();
  assert.equal((await verify(db)).verified, true);
  auth = new IsolatedAuth({
    connectionString: process.env.F03_1_DATABASE_URL,
    secret,
    origin: 'https://127.0.0.1:49026'
  });
  const roleRows = await rows("SELECT role_id,role_code FROM public.roles WHERE role_code IN ('sales','manager')");
  salesRoleId = Number(roleRows.find(row => row.role_code === 'sales')?.role_id);
  managerRoleId = Number(roleRows.find(row => row.role_code === 'manager')?.role_id);
  assert.ok(salesRoleId > 0 && managerRoleId > 0);
  await q('UPDATE public.employees SET main_role_id=$1 WHERE employee_id=1', [salesRoleId]);
  await q('UPDATE public.customers SET current_owner_employee_id=1 WHERE customer_id=$1', [customerId]);
  const team = (await rows(
    "SELECT team_id FROM public.employee_team_memberships WHERE employee_id=1 AND ended_at IS NULL LIMIT 1"))[0];
  assert.ok(team?.team_id);
  const scope = (await rows(
    "SELECT scope_id FROM public.employee_data_scopes WHERE employee_id=1 " +
    "AND scope_kind='team' AND scope_reference_id=$1 AND ended_at IS NULL LIMIT 1",
    [team.team_id]))[0];
  assert.ok(scope?.scope_id);
  scopeId = Number(scope.scope_id);

  await q("INSERT INTO public.permissions(permission_id,permission_code) " +
    "VALUES (962301,'deposit.ci.record'),(962302,'deposit.ci.correct')");
  const permissions = await rows('SELECT permission_id,permission_code FROM public.permissions WHERE permission_id IN (962301,962302) ORDER BY permission_id');
  assert.deepEqual(permissions.map(row => row.permission_code), ['deposit.ci.record','deposit.ci.correct']);
  for (const permissionId of [962301,962302]) {
    await q("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) " +
      "VALUES (1,$1,'allow',clock_timestamp())", [permissionId]);
    await q("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at) " +
      "VALUES (1,$1,$2,clock_timestamp()-interval '2 minutes')", [permissionId, scopeId]);
  }
  const login = await auth.login({ login: 'employee_test', password: 'SyntheticF04_3_CurrentProof_2026', source: 'f06-real-http-sales' });
  token = login.token;
  assert.ok(token);

  for (let n = 1; n <= 3; n++) {
    const intake = await older(() => intakeCI(db, {
      requestKey: 'f06-real-http-lock-request-' + n + '-' + process.env.GITHUB_RUN_ID,
      customerId, vehicleId: vehicleId(n), listingCycleId: cycleId(n),
      syntheticPhoneConsent: CONSENT
    }));
    assert.equal(intake.allowed, true, JSON.stringify(intake));
    const decision = await older(() => decisionCI(auth, token, {
      requestId: intake.requestId,
      requestKey: 'f06-real-http-lock-approval-' + n + '-' + process.env.GITHUB_RUN_ID,
      action: 'approve'
    }));
    assert.equal(decision.allowed, true, JSON.stringify(decision));
    locks[n] = Number(decision.lockId);
  }
  server = createHttpServer({ auth });
  await listen(server);
  baseUrl = 'http://127.0.0.1:' + server.address().port;
});

after(async () => {
  await closeServer(server);
  if (auth) await auth.close();
  if (db) await db.end();
});

test('1. Real branch, push, SHA and narrow F06-3A bridge are verified', () => {
  assertRealEntry();
});
test('2. Production deposit route is absent from the HTTP server', async () => {
  const response = await call('/api/v1/deposits', 'POST', { amountCents: 12000 });
  assert.equal(response.status, 404);
  assert.equal(response.body.code, 'NOT_FOUND');
});
test('3. Missing bearer session is denied before reading a deposit payload', async () => {
  const response = await call(recordPath, 'POST', {}, null);
  assert.equal(response.status, 401);
});
test('4. Malformed JSON is rejected with a bounded error', async () => {
  const response = await callRaw(recordPath, '{');
  assert.equal(response.status, 400);
  assert.equal(response.body.code, 'F06_REAL_DEPOSIT_INVALID_JSON');
});
test('5. Zero amount is rejected', async () => {
  const response = await call(recordPath, 'POST', recordPayload('zero', 0));
  assert.equal(response.status, 400);
});
test('6. Negative original receipt amount is rejected', async () => {
  const response = await call(recordPath, 'POST', recordPayload('negative', -1));
  assert.equal(response.status, 400);
});
test('7. Currency is fixed to CNY', async () => {
  const response = await call(recordPath, 'POST', recordPayload('wrong-currency', 1000, locks[1], { currency: 'USD' }));
  assert.equal(response.status, 400);
});
test('8. Unsupported payment method is rejected', async () => {
  const response = await call(recordPath, 'POST', recordPayload('wrong-method', 1000, locks[1], { paymentMethod: 'card_gateway' }));
  assert.equal(response.status, 400);
});
test('9. System-admin and manager claims in an untrusted body cannot replace a signed session', async () => {
  const payload = recordPayload('forged-claims', 1000, locks[1], {
    principal_kind: 'system_admin', system_admin_id: 1, role_code: 'manager', employee_id: 1
  });
  const response = await call(recordPath, 'POST', payload, 'forged-session-token-000000');
  assert.equal(response.status, 401);
});
test('10. Valid employee HTTP request records one synthetic receipt', async () => {
  recordPayload1 = recordPayload('deposit-one', 12000);
  const response = await call(recordPath, 'POST', recordPayload1);
  assert.equal(response.status, 201);
  assert.equal(response.body.allowed, true);
  assert.equal(response.body.code, 'F06_3A_SYNTHETIC_RECEIPT_RECORDED');
  deposit1 = response.body.depositId;
  assert.ok(Number.isInteger(deposit1) && deposit1 > 0);
});
test('11. Same idempotency key and payload returns the same receipt', async () => {
  const response = await call(recordPath, 'POST', recordPayload1);
  assert.equal(response.status, 200);
  assert.equal(response.body.code, 'F06_3A_IDEMPOTENT_RECEIPT');
  assert.equal(response.body.depositId, deposit1);
});
test('12. Reusing the receipt key with a changed amount conflicts', async () => {
  const response = await call(recordPath, 'POST', { ...recordPayload1, amountCents: 13000 });
  assert.equal(response.status, 409);
  assert.equal(response.body.code, 'F06_3A_IDEMPOTENCY_KEY_CONFLICT');
});
test('13. A second receipt can be recorded on the same valid Lock', async () => {
  const response = await call(recordPath, 'POST', recordPayload('deposit-two', 5000));
  assert.equal(response.status, 201);
  deposit2 = response.body.depositId;
  assert.ok(Number.isInteger(deposit2) && deposit2 > 0 && deposit2 !== deposit1);
  assert.equal(Number((await rows('SELECT count(*)::int n FROM public.deposit_receipts WHERE lock_id=$1', [locks[1]]))[0].n), 2);
});
test('14. Derived balance is readable only through a scoped employee session', async () => {
  const response = await call('/__ci__/f06-real-deposit/deposits/' + deposit1 + '/net');
  assert.equal(response.status, 200);
  assert.equal(response.body.code, 'F06_3A_CI_NET_READ_ONLY');
  assert.equal(response.body.netCents, 12000);
});
test('15. Sales cannot correct a deposit even if a correction override exists', async () => {
  const payload = correctionPayload('sales-correction-denied', -100);
  const response = await call('/__ci__/f06-real-deposit/deposits/' + deposit1 + '/corrections', 'POST', payload);
  assert.equal(response.status, 403);
  assert.equal(response.body.code, 'F06_3A_CORRECTION_PERMISSION_SCOPE_DENIED');
});
test('16. Manager role is reloaded from the signed employee account', async () => {
  await q('UPDATE public.employees SET main_role_id=$1 WHERE employee_id=1', [managerRoleId]);
  const login = await auth.login({ login: 'employee_test', password: 'SyntheticF04_3_CurrentProof_2026', source: 'f06-real-http-manager' });
  managerToken = login.token;
  assert.ok(managerToken);
});
test('17. Manager correction appends a negative adjustment and returns the derived net', async () => {
  correctionPayload1 = correctionPayload('manager-correction-one', -2000);
  const response = await call('/__ci__/f06-real-deposit/deposits/' + deposit1 + '/corrections', 'POST', correctionPayload1, managerToken);
  assert.equal(response.status, 201);
  assert.equal(response.body.code, 'F06_3A_APPEND_ONLY_CORRECTION');
  correction1 = response.body.adjustmentId;
  assert.ok(Number.isInteger(correction1) && correction1 > 0);
  assert.equal(response.body.netCents, 10000);
});
test('18. Correction changes derived balance but never rewrites the original receipt fact', async () => {
  const response = await call('/__ci__/f06-real-deposit/deposits/' + deposit1 + '/net', 'GET', undefined, managerToken);
  assert.equal(response.status, 200);
  assert.equal(response.body.netCents, 10000);
  const original = (await rows('SELECT amount_cents FROM public.deposit_receipts WHERE deposit_id=$1', [deposit1]))[0];
  assert.equal(Number(original.amount_cents), 12000);
});
test('19. Correction that would make the net negative is rejected', async () => {
  const response = await call('/__ci__/f06-real-deposit/deposits/' + deposit1 + '/corrections', 'POST',
    correctionPayload('over-correction', -20000), managerToken);
  assert.equal(response.status, 409);
  assert.equal(response.body.code, 'F06_3A_OVER_REVERSAL_OR_INVALID_NET_DENIED');
  assert.equal(Object.hasOwn(response.body, 'currentNetCents'), false);
});
test('20. Full reversal appends an adjustment and brings net to zero', async () => {
  const response = await call('/__ci__/f06-real-deposit/deposits/' + deposit1 + '/reversals', 'POST',
    correctionPayload('full-reversal', -10000, locks[1], deposit1, { action: 'reversal' }), managerToken);
  assert.equal(response.status, 201);
  assert.equal(response.body.code, 'F06_3A_APPEND_ONLY_REVERSAL');
  assert.equal(response.body.netCents, 0);
});
test('21. Replaying the same correction key returns the same adjustment', async () => {
  const response = await call('/__ci__/f06-real-deposit/deposits/' + deposit1 + '/corrections', 'POST', correctionPayload1, managerToken);
  assert.equal(response.status, 200);
  assert.equal(response.body.code, 'F06_3A_IDEMPOTENT_CORRECTION');
  assert.equal(response.body.adjustmentId, correction1);
});
test('22. Concurrent corrections cannot overdraw the same receipt', async () => {
  const first = correctionPayload('concurrent-a', -4000, locks[1], deposit2);
  const second = correctionPayload('concurrent-b', -4000, locks[1], deposit2);
  const result = await Promise.all([
    call('/__ci__/f06-real-deposit/deposits/' + deposit2 + '/corrections', 'POST', first, managerToken),
    call('/__ci__/f06-real-deposit/deposits/' + deposit2 + '/corrections', 'POST', second, managerToken)
  ]);
  assert.equal(result.filter(item => item.status === 201).length, 1, JSON.stringify(result));
  assert.equal(result.filter(item => item.status === 409).length, 1, JSON.stringify(result));
});
test('23. A receipt cannot be corrected through a different Lock', async () => {
  const response = await call('/__ci__/f06-real-deposit/deposits/' + deposit1 + '/corrections', 'POST',
    correctionPayload('cross-lock', -100, locks[2], deposit1), managerToken);
  assert.equal(response.status, 403);
  assert.equal(response.body.code, 'F06_3A_CROSS_LOCK_OR_UNSIGNED_FACT_DENIED');
});
test('24. Injected correction failure rolls back adjustment, key and audit rows', async () => {
  const before = Number((await rows('SELECT count(*)::int n FROM f06_3a_ci.adjustments WHERE deposit_id=$1', [deposit2]))[0].n);
  const response = await call('/__ci__/f06-real-deposit/deposits/' + deposit2 + '/corrections', 'POST',
    correctionPayload('rollback-injection', -100, locks[1], deposit2, { testCheckpoint: 'AFTER_CORRECTION_THROW' }), managerToken);
  assert.equal(response.status, 500);
  assert.equal(response.body.code, 'F06_REAL_DEPOSIT_INTERNAL_ERROR');
  const afterCount = Number((await rows('SELECT count(*)::int n FROM f06_3a_ci.adjustments WHERE deposit_id=$1', [deposit2]))[0].n);
  assert.equal(afterCount, before);
  const key = (await rows("SELECT count(*)::int n FROM f06_3a_ci.request_keys WHERE action='correction' AND deposit_id=$1 AND amount_cents=-100", [deposit2]))[0];
  assert.equal(Number(key.n), 0);
});
test('25. Original receipt provenance and adjustment ledger are append-only', async () => {
  const adjustment = (await rows('SELECT adjustment_id FROM f06_3a_ci.adjustments WHERE deposit_id=$1 ORDER BY adjustment_id LIMIT 1', [deposit1]))[0];
  assert.ok(adjustment?.adjustment_id);
  await assert.rejects(() => q('UPDATE f06_3a_ci.adjustments SET reason=$1 WHERE adjustment_id=$2', ['tamper', adjustment.adjustment_id]));
  await assert.rejects(() => q('DELETE FROM f06_3a_ci.receipt_provenance WHERE deposit_id=$1', [deposit1]));
});
test('26. Revoked correction permission is rechecked on every HTTP request', async () => {
  const other = await connect();
  try {
    const changed = await other.query("UPDATE public.employee_permission_overrides SET decision='deny' WHERE employee_id=1 AND permission_id=962302");
    assert.equal(changed.rowCount, 1);
    const response = await call('/__ci__/f06-real-deposit/deposits/' + deposit2 + '/corrections', 'POST',
      correctionPayload('revoked-permission', -100, locks[1], deposit2), managerToken);
    assert.equal(response.status, 403);
    assert.equal(response.body.code, 'F06_3A_CORRECTION_PERMISSION_SCOPE_DENIED');
  } finally {
    await other.query("UPDATE public.employee_permission_overrides SET decision='allow' WHERE employee_id=1 AND permission_id=962302");
    await other.end();
  }
});
test('27. Lock expiry remains blocked by signed money even when the derived net is zero', async () => {
  await q("INSERT INTO f06_2_ci.finance_proofs(lock_id,proof_kind) VALUES ($1,'synthetic_absence_confirmed')", [locks[1]]);
  await q("UPDATE public.locks SET created_at=clock_timestamp()-interval '10 days',expires_at=clock_timestamp()-interval '1 minute' WHERE lock_id=$1", [locks[1]]);
  const result = await withF062(() => expireOrdinaryCI(db, { lockId: locks[1], ciSystemProof: CI_SYSTEM_PROOF }));
  assert.equal(result.allowed, false);
  assert.equal(result.code, 'F06_2_EXISTING_SIGNED_MONEY_OR_TRANSACTION_DENY');
});
test('28. Unknown issuer source fails closed instead of expiring a no-receipt Lock', async () => {
  await q("UPDATE public.locks SET created_at=clock_timestamp()-interval '10 days',expires_at=clock_timestamp()-interval '1 minute' WHERE lock_id=$1", [locks[3]]);
  const result = await withF062(() => expireOrdinaryCI(db, { lockId: locks[3], ciSystemProof: CI_SYSTEM_PROOF }));
  assert.equal(result.allowed, false);
  assert.equal(result.code, 'F06_2_DEPOSIT_ISSUER_SOURCE_GAP_UNKNOWN_DENY');
});
test('29. Disabled customer is denied before a new receipt can be recorded', async () => {
  await q("UPDATE public.customers SET account_status='disabled' WHERE customer_id=$1", [customerId]);
  try {
    const response = await call(recordPath, 'POST', recordPayload('disabled-customer', 1000, locks[3]), managerToken);
    assert.equal(response.status, 403);
    assert.equal(response.body.code, 'F06_REAL_DEPOSIT_CUSTOMER_NOT_ACTIVE');
  } finally {
    await q("UPDATE public.customers SET account_status='active' WHERE customer_id=$1", [customerId]);
  }
});
test('30. Inactive Lock status blocks a new receipt', async () => {
  await q("UPDATE public.locks SET lock_status='expired' WHERE lock_id=$1", [locks[3]]);
  try {
    const response = await call(recordPath, 'POST', recordPayload('expired-lock', 1000, locks[3]), managerToken);
    assert.equal(response.status, 409);
    assert.equal(response.body.code, 'F06_3A_NON_CURRENT_LOCK_DENIED');
  } finally {
    await q("UPDATE public.locks SET lock_status='active' WHERE lock_id=$1", [locks[3]]);
  }
});
test('31. Ended Listing Cycle blocks a new receipt', async () => {
  await q('UPDATE public.vehicle_listing_cycles SET ended_at=clock_timestamp() WHERE listing_cycle_id=$1', [cycleId(3)]);
  try {
    const response = await call(recordPath, 'POST', recordPayload('ended-cycle', 1000, locks[3]), managerToken);
    assert.equal(response.status, 409);
    assert.equal(response.body.code, 'F06_REAL_DEPOSIT_LISTING_CYCLE_ENDED');
  } finally {
    await q('UPDATE public.vehicle_listing_cycles SET ended_at=NULL WHERE listing_cycle_id=$1', [cycleId(3)]);
  }
});
test('32. Expired session is denied even when its bearer token is well-formed', async () => {
  await q("UPDATE public.pc_auth_sessions SET expires_at=clock_timestamp()-interval '1 minute' WHERE token_digest=$1", [sessionDigest(token, secret)]);
  const response = await call('/__ci__/f06-real-deposit/deposits/' + deposit1 + '/net', 'GET', undefined, token);
  assert.equal(response.status, 401);
  assert.equal(response.body.code, 'F06_3A_SIGNED_SESSION_DENIED');
});
test('33. Role and system-admin identity headers are rejected, not trusted', async () => {
  const response = await call(recordPath, 'POST', recordPayload('spoofed-headers', 1000, locks[3]), managerToken, {
    'x-role': 'manager', 'x-principal-kind': 'system_admin', 'x-employee-id': '1'
  });
  assert.equal(response.status, 403);
  assert.equal(response.body.code, 'F06_REAL_DEPOSIT_FORGED_IDENTITY_HEADER_DENIED');
});
test('34. Revoked team scope is rechecked and blocks recording', async () => {
  await q('UPDATE public.employee_data_scopes SET ended_at=clock_timestamp() WHERE scope_id=$1', [scopeId]);
  try {
    const response = await call(recordPath, 'POST', recordPayload('revoked-scope', 1000, locks[3]), managerToken);
    assert.equal(response.status, 403);
    assert.equal(response.body.code, 'F06_3A_RECORD_PERMISSION_SCOPE_DENIED');
  } finally {
    await q('UPDATE public.employee_data_scopes SET ended_at=NULL WHERE scope_id=$1', [scopeId]);
  }
});
test('35. Refund, transaction and payment production endpoints remain absent', async () => {
  for (const path of ['/api/v1/refunds','/api/v1/transactions','/api/v1/payments']) {
    const response = await call(path, 'POST', { depositId: deposit1, amountCents: 12000 }, managerToken);
    assert.equal(response.status, 404, path);
    assert.equal(response.body.code, 'NOT_FOUND', path);
  }
});
test('36. Receipt provenance declares synthetic non-money issuer and production issuer remains denied', async () => {
  const provenance = (await rows('SELECT issuer_kind FROM f06_3a_ci.receipt_provenance WHERE deposit_id=$1', [deposit1]))[0];
  assert.equal(provenance.issuer_kind, 'CI_SYNTHETIC_NOT_REAL_MONEY');
  assert.equal(productionIssuerDeny().allowed, false);
});
test('37. Net zero does not automatically release the Lock', async () => {
  const net = await call('/__ci__/f06-real-deposit/deposits/' + deposit1 + '/net', 'GET', undefined, managerToken);
  assert.equal(net.status, 200);
  assert.equal(net.body.netCents, 0);
  const lock = (await rows('SELECT lock_status FROM public.locks WHERE lock_id=$1', [locks[1]]))[0];
  assert.equal(lock.lock_status, 'active');
});
test('38. Production application source contains no new synthetic Deposit route', () => {
  const app = readFileSync('engineering/src/app.mjs', 'utf8');
  const entry = readFileSync('engineering/src/server.mjs', 'utf8');
  assert.equal(app.includes('/__ci__/f06-real-deposit'), false);
  assert.equal(entry.includes('/__ci__/f06-real-deposit'), false);
  assert.equal(app.includes('f06-real-deposit'), false);
  assert.equal(entry.includes('f06-real-deposit'), false);
});
