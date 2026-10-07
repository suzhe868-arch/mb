import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

if (process.env.APP_ENV !== 'test' ||
    process.env.F01_TEST_DB_DISPOSABLE !== 'yes' ||
    !process.env.DATABASE_URL) {
  throw new Error('F01_REAL_SERVER_TEST_REQUIRES_DISPOSABLE_DB');
}
async function port() {
  const socket = createServer();
  socket.listen(0, '127.0.0.1');
  await once(socket, 'listening');
  const result = socket.address().port;
  await new Promise(resolve => socket.close(resolve));
  return result;
}

test('生产入口 dist/server.mjs 连接真实 PostgreSQL、关闭时无业务接口', { timeout: 12000 }, async () => {
  const apiPort = await port();
  const child = spawn(process.execPath, ['dist/server.mjs'], {
    cwd: new URL('../', import.meta.url),
    env: {
      ...process.env,
      APP_ENV: 'test', NODE_ENV: 'test',
      API_HOST: '127.0.0.1', API_PORT: String(apiPort),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const root = 'http://127.0.0.1:' + apiPort;
  try {
    let response;
    for (let attempt = 0; attempt < 60; attempt++) {
      if (child.exitCode !== null) throw new Error('F01_TEST_SERVER_EXITED');
      try {
        response = await fetch(root + '/api/v1/health/ready');
        if (response.status === 200) break;
      } catch { /* 子进程正在监听 */ }
      await sleep(75);
    }
    assert.equal(response?.status, 200, '实际入口必须真实连接 PostgreSQL');
    assert.equal((await fetch(root + '/api/v1/health/live')).status, 200);
    const missing = await fetch(root + '/api/v1/customers');
    assert.equal(missing.status, 404, '未实现的业务端点不得冒充完成');
    assert.equal((await missing.json()).code, 'NOT_IMPLEMENTED');
  } finally {
    child.kill('SIGTERM');
    await Promise.race([once(child, 'exit').catch(() => {}), sleep(1500)]);
    if (child.exitCode === null) child.kill('SIGKILL');
  }
});

test('生产模式在启动入口被拒绝，杜绝脚手架误部署', { timeout: 8000 }, async () => {
  const child = spawn(process.execPath, ['dist/server.mjs'], {
    cwd: new URL('../', import.meta.url),
    env: { ...process.env, APP_ENV: 'production', NODE_ENV: 'production', DATABASE_URL: '' },
    stdio: 'ignore',
  });
  const [exit] = await once(child, 'exit');
  assert.notEqual(exit, 0);
});
