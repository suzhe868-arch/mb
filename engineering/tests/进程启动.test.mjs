import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { spawn } from 'node:child_process';

async function allocateTestPort() {
  const socket = createServer();
  socket.listen(0, '127.0.0.1');
  await once(socket, 'listening');
  const port = socket.address().port;
  await new Promise(resolve => socket.close(resolve));
  return port;
}

test('真实 Node 子进程启动后 live=200、未连接数据库 ready=503', { timeout: 10000 }, async () => {
  const port = await allocateTestPort();
  const child = spawn(process.execPath, ['src/server.mjs'], {
    cwd: new URL('../', import.meta.url),
    env: { ...process.env, APP_ENV: 'test', NODE_ENV: 'test', API_HOST: '127.0.0.1', API_PORT: String(port), DATABASE_URL: '', F01_TEST_DB_CONSENT: '' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const base = 'http://127.0.0.1:' + port;
  try {
    let live;
    for (let attempt = 0; attempt < 50; attempt++) {
      if (child.exitCode !== null) throw new Error('F01_SERVER_EXIT_EARLY');
      try {
        live = await fetch(base + '/api/v1/health/live');
        if (live.status === 200) break;
      } catch { /* 等待监听端口就绪 */ }
      await new Promise(resolve => setTimeout(resolve, 75));
    }
    assert.equal(live?.status, 200, '服务必须成功启动');
    const ready = await fetch(base + '/api/v1/health/ready');
    assert.equal(ready.status, 503, '未连接真实数据库不得显示 ready');
  } finally {
    child.kill('SIGTERM');
    await Promise.race([once(child, 'exit').catch(() => {}), new Promise(resolve => setTimeout(resolve, 1500))]);
    if (child.exitCode === null) child.kill('SIGKILL');
  }
});
