import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createFoundationServer } from '../src/app.mjs';
import { loadConfig } from '../src/config.mjs';

async function withServer(probe, fn) {
  const server = createFoundationServer({ readinessProbe: probe });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const url = 'http://127.0.0.1:' + server.address().port;
  try { await fn(url); } finally { await new Promise(resolve => server.close(resolve)); }
}

test('存活检查成功但不冒充数据库就绪', async () => {
  await withServer(async () => false, async base => {
    const live = await fetch(base + '/api/v1/health/live');
    assert.equal(live.status, 200);
    assert.deepEqual(await live.json(), { ok: true });
    const ready = await fetch(base + '/api/v1/health/ready');
    assert.equal(ready.status, 503);
    assert.equal((await ready.json()).code, 'DEPENDENCY_NOT_READY');
  });
});

test('只有探针实证成功才可报告就绪', async () => {
  await withServer(async () => true, async base => {
    assert.equal((await fetch(base + '/api/v1/health/ready')).status, 200);
    assert.equal((await fetch(base + '/api/v1/health/live', { method: 'POST' })).status, 405);
    assert.equal((await fetch(base + '/api/v1/vehicles')).status, 404);
  });
});

test('探针抛错按未就绪处理，不能暴露内部报错', async () => {
  await withServer(async () => { throw Error('private-database-password'); }, async base => {
    const response = await fetch(base + '/api/v1/health/ready');
    assert.equal(response.status, 503);
    assert.equal(JSON.stringify(await response.json()).includes('private-database-password'), false);
  });
});

test('环境和端口检查', () => {
  assert.deepEqual(loadConfig({ APP_ENV: 'test', API_PORT: '4001' }), { mode: 'test', host: '127.0.0.1', port: 4001 });
  assert.throws(() => loadConfig({ APP_ENV: 'invalid' }));
  assert.throws(() => loadConfig({ API_PORT: '65536' }));
  assert.throws(() => loadConfig({ API_PORT: '3x' }));
});
