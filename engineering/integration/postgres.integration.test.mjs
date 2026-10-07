import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createFoundationServer } from '../src/app.mjs';
import { createPgReadinessProbe } from '../src/postgres.mjs';

const env = process.env;
if (env.APP_ENV !== 'test' || env.F01_TEST_DB_DISPOSABLE !== 'yes' || !env.DATABASE_URL) {
  throw new Error('F01_INTEGRATION_REQUIRES_DISPOSABLE_DB');
}

async function withProbe(probe, fn) {
  const app = createFoundationServer({ readinessProbe: probe, readinessTimeoutMs: 3000 });
  app.listen(0, '127.0.0.1');
  await once(app, 'listening');
  const url = 'http://127.0.0.1:' + app.address().port;
  try { await fn(url); } finally { await new Promise(resolve => app.close(resolve)); }
}

test('真实 PostgreSQL SELECT 1 可用时 ready=200，且 live=200', async () => {
  await withProbe(createPgReadinessProbe(env), async base => {
    const live = await fetch(base + '/api/v1/health/live');
    const ready = await fetch(base + '/api/v1/health/ready');
    assert.equal(live.status, 200);
    assert.equal(ready.status, 200, '必须实际读取 PostgreSQL 成功');
    assert.deepEqual(await ready.json(), { ok: true });
  });
});

test('真实 PostgreSQL 错误密码时 ready=503，且不泄漏连接信息', async () => {
  const invalid = new URL(env.DATABASE_URL);
  invalid.password = 'intentionally_wrong_password';
  await withProbe(createPgReadinessProbe({ ...env, DATABASE_URL: invalid.toString() }), async base => {
    const response = await fetch(base + '/api/v1/health/ready');
    assert.equal(response.status, 503);
    const body = JSON.stringify(await response.json());
    assert.equal(body.includes('intentionally_wrong_password'), false);
    assert.equal(body.includes(invalid.hostname), false);
  });
});

test('真实 PostgreSQL 端口不可达时 ready=503 而 live=200', async () => {
  const unreachable = new URL(env.DATABASE_URL);
  unreachable.port = '1';
  await withProbe(createPgReadinessProbe({ ...env, DATABASE_URL: unreachable.toString() }), async base => {
    assert.equal((await fetch(base + '/api/v1/health/ready')).status, 503);
    assert.equal((await fetch(base + '/api/v1/health/live')).status, 200);
  });
});
