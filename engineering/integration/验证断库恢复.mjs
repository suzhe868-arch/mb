import assert from 'node:assert/strict';
import { once } from 'node:events';
import { execFileSync } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import { createFoundationServer } from '../src/app.mjs';
import { createPgReadinessProbe } from '../src/postgres.mjs';

const env = process.env;
// 仅 CI 自建 disposable 容器可以执行停启验证；绝不能对用户数据库动手。
if (env.CI !== 'true' || env.GITHUB_ACTIONS !== 'true' ||
    env.APP_ENV !== 'test' || env.F01_TEST_DB_DISPOSABLE !== 'yes') {
  throw new Error('F01_RECOVERY_REQUIRES_GITHUB_ISOLATED_TEST');
}
const docker = (args) => execFileSync('docker', args, { encoding: 'utf8', timeout: 30000 }).trim();
const candidates = docker(['ps', '--format', '{{.ID}} {{.Image}}'])
  .split('\n').map(line => line.trim().split(/\s+/))
  .filter(parts => parts[1] === 'postgres:16-alpine');
assert.equal(candidates.length, 1, '必须且只能有一个指定镜像的隔离测试数据库');
const containerId = candidates[0][0];
const inspected = JSON.parse(docker(['inspect', containerId]));
const containerEnv = inspected[0]?.Config?.Env ?? [];
assert.ok(containerEnv.includes('POSTGRES_DB=f01_foundation'));
assert.ok(containerEnv.includes('POSTGRES_USER=f01_ci'));

const app = createFoundationServer({
  readinessProbe: createPgReadinessProbe(env),
  readinessTimeoutMs: 3000,
});
app.listen(0, '127.0.0.1');
await once(app, 'listening');
const address = 'http://127.0.0.1:' + app.address().port;
async function response(code) {
  const res = await fetch(address + '/api/v1/health/ready');
  assert.equal(res.status, code, '就绪状态需符合真实 PostgreSQL 状态');
  return res;
}
async function recover() {
  for (let i = 0; i < 35; i++) {
    try { await response(200); return; } catch { await sleep(750); }
  }
  throw new Error('F01_POSTGRES_RECOVERY_NOT_READY');
}
let stopped = false;
try {
  await recover();
  docker(['stop', '-t', '5', containerId]);
  stopped = true;
  await response(503);
  assert.equal((await fetch(address + '/api/v1/health/live')).status, 200);
  console.log('F01 PostgreSQL 真断库：ready=503 / live=200 PASS');
  docker(['start', containerId]);
  stopped = false;
  await recover();
  console.log('F01 PostgreSQL 同一服务进程恢复：ready=200 PASS');
} finally {
  if (stopped) docker(['start', containerId]);
  await new Promise(resolve => app.close(resolve));
}
