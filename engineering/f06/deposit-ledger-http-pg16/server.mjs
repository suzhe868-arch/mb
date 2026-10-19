import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import {
  correctSyntheticDepositCI,
  productionIssuerDeny,
  receiptNetCI,
  recordSyntheticDepositCI
} from '../deposit-ledger-ci/service.mjs';
import { verify } from '../deposit-ledger-ci/migration.mjs';

const branch = 'feat/f06-real-deposit-ledger-http-pg16-01';
const parentBranch = 'feat/f06-3a-deposit-ledger-ci';
const deny = code => ({ allowed: false, code });
const one = async (client, sql, args = []) => (await client.query(sql, args)).rows[0];

export function assertRealEntry() {
  assert.equal(process.env.GITHUB_REPOSITORY, 'suzhe868-arch/mb');
  assert.equal(process.env.F06_REAL_ENTRY_REF, 'refs/heads/' + branch);
  assert.equal(process.env.F06_REAL_ENTRY_BRANCH, branch);
  assert.equal(process.env.F06_REAL_ENTRY_SHA, process.env.GITHUB_SHA);
  assert.equal(process.env.F06_REAL_ENTRY_EVENT, 'push');
  assert.equal(process.env.F06_REAL_ENTRY_RUN_ID, process.env.GITHUB_RUN_ID);
  assert.equal(process.env.GITHUB_EVENT_NAME, 'push');
  assert.equal(process.env.GITHUB_ACTIONS, 'true');
  assert.equal(process.env.CI, 'true');
  assert.equal(process.env.APP_ENV, 'test');
  assert.equal(process.env.NODE_ENV, 'test');
  assert.equal(process.env.API_HOST, '127.0.0.1');
  assert.equal(process.env.GITHUB_REF, 'refs/heads/' + parentBranch,
    'only the explicit F06-3A compatibility gate may be presented to the unchanged parent module');
  assert.equal(process.env.GITHUB_REF_NAME, parentBranch);
  assert.equal(process.env.F06_REAL_DEPOSIT_TEST_CONSENT, 'I_AUTHORIZE_DISPOSABLE_F06_DEPOSIT_HTTP_PG16_ONLY');
  assert.equal(execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), process.env.GITHUB_SHA);
  assert.ok(process.env.F03_1_DATABASE_URL && process.env.F06_LOCK_DATABASE_URL);
}

function send(res, status, payload) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'no-referrer',
    'x-frame-options': 'DENY'
  });
  res.end(JSON.stringify(payload));
}
function tokenFrom(req) {
  const value = req.headers.authorization || '';
  const match = /^Bearer ([A-Za-z0-9._~-]{16,512})$/.exec(value);
  return match ? match[1] : null;
}
async function readJson(req) {
  const type = String(req.headers['content-type'] || '').toLowerCase();
  if (!type.startsWith('application/json')) {
    const error = new Error('JSON_REQUIRED');
    error.status = 415;
    error.code = 'F06_REAL_DEPOSIT_JSON_REQUIRED';
    throw error;
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 16384) {
      const error = new Error('BODY_TOO_LARGE');
      error.status = 413;
      error.code = 'F06_REAL_DEPOSIT_BODY_TOO_LARGE';
      throw error;
    }
    chunks.push(chunk);
  }
  if (!size) {
    const error = new Error('EMPTY_BODY');
    error.status = 400;
    error.code = 'F06_REAL_DEPOSIT_INVALID_JSON';
    throw error;
  }
  let value;
  try {
    value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    const error = new Error('INVALID_JSON');
    error.status = 400;
    error.code = 'F06_REAL_DEPOSIT_INVALID_JSON';
    throw error;
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    const error = new Error('JSON_OBJECT_REQUIRED');
    error.status = 400;
    error.code = 'F06_REAL_DEPOSIT_JSON_OBJECT_REQUIRED';
    throw error;
  }
  return value;
}
function resultStatus(result, successStatus = 201) {
  if (!result || result.allowed !== true) {
    const code = result?.code || 'F06_REAL_DEPOSIT_REQUEST_DENIED';
    if (code.includes('SIGNED_SESSION')) return 401;
    if (code.includes('NOT_FOUND')) return 404;
    if (code.includes('INVALID') || code.includes('TIME_OUT_OF_RANGE') || code.includes('JSON_')) return 400;
    if (code.includes('IDEMPOTENCY_KEY_CONFLICT') || code.includes('OVER_REVERSAL') ||
        code.includes('NON_CURRENT_LOCK') || code.includes('LISTING_CYCLE_ENDED')) return 409;
    return 403;
  }
  if (String(result.code || '').includes('IDEMPOTENT')) return 200;
  return successStatus;
}
function safeResult(result) {
  if (!result || result.allowed !== true) {
    return { allowed: false, code: result?.code || 'F06_REAL_DEPOSIT_REQUEST_DENIED' };
  }
  const out = { allowed: true, code: result.code };
  for (const key of ['depositId','lockId','adjustmentId','netCents']) {
    if (result[key] !== undefined) out[key] = result[key];
  }
  return out;
}
async function currentWriteState(client, actor, lockId, action) {
  if (actor?.principal_kind !== 'employee' || actor.system_admin_id !== null ||
      !['sales','manager','store_head'].includes(actor.role_code) ||
      actor.force_password_change !== false || actor.credential_state !== 'enabled' ||
      actor.subject_status !== 'active') {
    return deny('F06_REAL_DEPOSIT_SIGNED_EMPLOYEE_REQUIRED');
  }
  const initial = await one(client, 'SELECT vehicle_id FROM public.locks WHERE lock_id=$1', [lockId]);
  if (!initial) return deny('F06_3A_LOCK_NOT_FOUND');
  await one(client, 'SELECT vehicle_id FROM public.vehicles WHERE vehicle_id=$1 FOR UPDATE', [initial.vehicle_id]);
  const lock = await one(client, 'SELECT * FROM public.locks WHERE lock_id=$1 FOR UPDATE', [lockId]);
  if (!lock || typeof lock.lock_status !== 'string') return deny('F06_REAL_DEPOSIT_LOCK_STATE_INVALID');
  const signed = await one(client,
    'SELECT customer_id,responsible_employee_id,vehicle_id,listing_cycle_id ' +
    'FROM f06_1_lock_ci.lock_snapshots WHERE lock_id=$1 FOR SHARE', [lockId]);
  if (!signed || Number(signed.customer_id) !== Number(lock.customer_id) ||
      Number(signed.responsible_employee_id) !== Number(lock.responsible_employee_id) ||
      Number(signed.vehicle_id) !== Number(lock.vehicle_id) ||
      Number(signed.listing_cycle_id) !== Number(lock.listing_cycle_id)) {
    return deny('F06_3A_SIGNED_LOCK_SNAPSHOT_REQUIRED');
  }
  const customer = await one(client,
    'SELECT account_status FROM public.customers WHERE customer_id=$1 FOR SHARE', [lock.customer_id]);
  if (!customer || customer.account_status !== 'active') {
    return deny('F06_REAL_DEPOSIT_CUSTOMER_NOT_ACTIVE');
  }
  const cycle = await one(client,
    'SELECT listing_cycle_id,vehicle_id,ended_at FROM public.vehicle_listing_cycles ' +
    'WHERE listing_cycle_id=$1 AND vehicle_id=$2 FOR SHARE', [lock.listing_cycle_id, lock.vehicle_id]);
  if (!cycle) return deny('F06_REAL_DEPOSIT_LISTING_CYCLE_NOT_FOUND');
  if (action === 'record' && lock.lock_status !== 'active') {
    return deny('F06_3A_NON_CURRENT_LOCK_DENIED');
  }
  if (action === 'record' && cycle.ended_at) {
    return deny('F06_REAL_DEPOSIT_LISTING_CYCLE_ENDED');
  }
  return null;
}
function guardedAuth(auth, lockId, action) {
  return {
    withSession(token, callback, options) {
      return auth.withSession(token, async (client, actor) => {
        const blocked = await currentWriteState(client, actor, lockId, action);
        if (blocked) return blocked;
        return callback(client, actor);
      }, options);
    }
  };
}
async function readScope(client, actor, lock) {
  if (actor?.principal_kind !== 'employee' || actor.system_admin_id !== null ||
      !['sales','manager','store_head'].includes(actor.role_code) ||
      actor.force_password_change !== false || actor.credential_state !== 'enabled' ||
      actor.subject_status !== 'active') return false;
  const who = await one(client,
    "SELECT e.employee_id,r.role_code FROM public.employees e " +
    "JOIN public.roles r ON r.role_id=e.main_role_id " +
    "JOIN public.permissions p ON p.permission_code IN ('deposit.ci.record','deposit.ci.correct') " +
    "JOIN public.employee_permission_overrides o ON o.employee_id=e.employee_id AND o.permission_id=p.permission_id AND o.decision='allow' " +
    "JOIN public.employee_capability_scope_bindings b ON b.employee_id=e.employee_id AND b.permission_id=p.permission_id " +
    "JOIN public.employee_data_scopes s ON s.scope_id=b.scope_id AND s.employee_id=e.employee_id " +
    "JOIN public.employee_team_memberships m ON m.employee_id=e.employee_id " +
    "JOIN public.teams t ON t.team_id=m.team_id " +
    "JOIN public.stores st ON st.store_id=t.store_id " +
    "JOIN public.employee_team_memberships rm ON rm.employee_id=$2 AND rm.team_id=t.team_id " +
    "JOIN public.employees responsible ON responsible.employee_id=rm.employee_id AND responsible.employment_status='active' " +
    "WHERE e.employee_id=$1 AND e.employment_status='active' AND r.role_code=$3 " +
    "AND t.team_status='active' AND st.status='active' " +
    "AND m.valid_from<=clock_timestamp() AND (m.ended_at IS NULL OR m.ended_at>clock_timestamp()) " +
    "AND rm.valid_from<=clock_timestamp() AND (rm.ended_at IS NULL OR rm.ended_at>clock_timestamp()) " +
    "AND b.granted_at<=clock_timestamp() AND (b.ended_at IS NULL OR b.ended_at>clock_timestamp()) " +
    "AND (s.ended_at IS NULL OR s.ended_at>clock_timestamp()) " +
    "AND ((p.permission_code='deposit.ci.record' AND e.employee_id=$2 AND r.role_code IN ('sales','manager','store_head')) " +
    "OR (p.permission_code='deposit.ci.correct' AND r.role_code IN ('manager','store_head'))) " +
    "AND ((s.scope_kind='team' AND s.scope_reference_id=t.team_id) OR " +
    "(s.scope_kind='store' AND s.scope_reference_id=t.store_id AND r.role_code IN ('manager','store_head'))) " +
    "LIMIT 1 FOR SHARE OF e,r,p,o,b,s,m,t,st,rm",
    [actor.employee_id, lock.responsible_employee_id, actor.role_code]);
  return !!who && who.role_code === actor.role_code;
}
async function readNet(auth, token, depositId) {
  const result = await auth.withSession(token, async (client, actor) => {
    await verify(client);
    const fact = await one(client,
      'SELECT lock_id,customer_id,vehicle_id,listing_cycle_id FROM f06_3a_ci.receipt_provenance WHERE deposit_id=$1',
      [depositId]);
    if (!fact) return deny('F06_3A_DEPOSIT_NOT_FOUND');
    const lock = await one(client, 'SELECT * FROM public.locks WHERE lock_id=$1', [fact.lock_id]);
    if (!lock || Number(lock.customer_id) !== Number(fact.customer_id) ||
        Number(lock.vehicle_id) !== Number(fact.vehicle_id) ||
        Number(lock.listing_cycle_id) !== Number(fact.listing_cycle_id)) {
      return deny('F06_3A_CROSS_LOCK_OR_UNSIGNED_FACT_DENIED');
    }
    const customer = await one(client, 'SELECT account_status FROM public.customers WHERE customer_id=$1', [lock.customer_id]);
    if (!customer || customer.account_status !== 'active') return deny('F06_REAL_DEPOSIT_CUSTOMER_NOT_ACTIVE');
    const cycle = await one(client,
      'SELECT listing_cycle_id FROM public.vehicle_listing_cycles WHERE listing_cycle_id=$1 AND vehicle_id=$2',
      [lock.listing_cycle_id, lock.vehicle_id]);
    if (!cycle) return deny('F06_REAL_DEPOSIT_LISTING_CYCLE_NOT_FOUND');
    if (!await readScope(client, actor, lock)) return deny('F06_3A_READ_PERMISSION_SCOPE_DENIED');
    return receiptNetCI(client, depositId);
  }, { normalOnly: true });
  return result || deny('F06_3A_SIGNED_SESSION_DENIED');
}

export function createHttpServer({ auth }) {
  assertRealEntry();
  assert.equal(typeof auth?.withSession, 'function');
  return createServer(async (req, res) => {
    const remote = req.socket.remoteAddress || '';
    const host = String(req.headers.host || '');
    const origin = String(req.headers.origin || '');
    if (!(remote === '127.0.0.1' || remote === '::ffff:127.0.0.1') ||
        !/^127\.0\.0\.1:\d+$/.test(host) || origin !== 'http://' + host) {
      return send(res, 403, { allowed: false, code: 'F06_REAL_DEPOSIT_LOOPBACK_ONLY' });
    }
    if (Object.keys(req.headers).some(key => /^(x-role|x-principal-kind|x-employee-id|x-customer-id|x-scope|x-forwarded-|forwarded$)/i.test(key))) {
      return send(res, 403, { allowed: false, code: 'F06_REAL_DEPOSIT_FORGED_IDENTITY_HEADER_DENIED' });
    }
    let url;
    try { url = new URL(req.url || '/', 'http://127.0.0.1'); }
    catch { return send(res, 400, { allowed: false, code: 'F06_REAL_DEPOSIT_INVALID_PATH' }); }
    const path = url.pathname;
    if (path.startsWith('/api/v1/')) return send(res, 404, { allowed: false, code: 'NOT_FOUND' });
    const bearer = tokenFrom(req);
    if (req.method === 'GET') {
      const match = /^\/__ci__\/f06-real-deposit\/deposits\/([1-9][0-9]*)\/net$/.exec(path);
      if (!match) return send(res, 404, { allowed: false, code: 'NOT_FOUND' });
      if (!bearer) return send(res, 401, { allowed: false, code: 'F06_3A_SIGNED_SESSION_DENIED' });
      const result = await readNet(auth, bearer, Number(match[1]));
      return send(res, resultStatus(result, 200), safeResult(result));
    }
    if (req.method !== 'POST') return send(res, 405, { allowed: false, code: 'METHOD_NOT_ALLOWED' });
    if (!bearer) return send(res, 401, { allowed: false, code: 'F06_3A_SIGNED_SESSION_DENIED' });
    let body;
    try { body = await readJson(req); }
    catch (error) {
      return send(res, error.status || 400, { allowed: false, code: error.code || 'F06_REAL_DEPOSIT_INVALID_JSON' });
    }
    try {
      let result;
      if (path === '/__ci__/f06-real-deposit/deposits') {
        const adapter = guardedAuth(auth, body.lockId, 'record');
        result = await recordSyntheticDepositCI(adapter, bearer, body);
      } else {
        const match = /^\/__ci__\/f06-real-deposit\/deposits\/([1-9][0-9]*)\/(corrections|reversals)$/.exec(path);
        if (!match) return send(res, 404, { allowed: false, code: 'NOT_FOUND' });
        const depositId = Number(match[1]);
        if (body.depositId !== undefined && Number(body.depositId) !== depositId) {
          return send(res, 400, { allowed: false, code: 'F06_REAL_DEPOSIT_ROUTE_ID_MISMATCH' });
        }
        const action = match[2] === 'corrections' ? 'correction' : 'reversal';
        const payload = { ...body, depositId, action };
        const adapter = guardedAuth(auth, payload.lockId, action);
        result = await correctSyntheticDepositCI(adapter, bearer, payload);
      }
      return send(res, resultStatus(result), safeResult(result));
    } catch (error) {
      console.error('F06_REAL_DEPOSIT_HTTP_INTERNAL_ERROR', error?.message || 'unknown');
      return send(res, 500, { allowed: false, code: 'F06_REAL_DEPOSIT_INTERNAL_ERROR' });
    }
  });
}

export function productionDenyHandler() {
  assertRealEntry();
  const issuerGap = productionIssuerDeny();
  assert.equal(issuerGap.allowed, false);
  return (_req, res) => send(res, 404, { allowed: false, code: 'NOT_FOUND' });
}
