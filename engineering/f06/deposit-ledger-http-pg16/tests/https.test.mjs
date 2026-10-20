import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:https';
import { request } from 'node:https';
import { test, before, after } from 'node:test';
import { productionDenyHandler } from '../server.mjs';

let server, baseUrl;
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
function httpsCall(path, method = 'POST', body, headers = {}) {
  const url = new URL(path, baseUrl);
  return new Promise((resolve, reject) => {
    const req = request({
      hostname: '127.0.0.1',
      port: Number(url.port),
      path: url.pathname + url.search,
      method,
      rejectUnauthorized: false,
      headers: { 'content-type': 'application/json', ...headers }
    }, response => {
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        let payload;
        try { payload = JSON.parse(text); } catch { return reject(new Error('TLS denial response was not JSON')); }
        resolve({ status: response.statusCode, body: payload, headers: response.headers });
      });
    });
    req.on('error', reject);
    req.end(body === undefined ? undefined : JSON.stringify(body));
  });
}

before(async () => {
  const key = readFileSync('/tmp/f06-real-deposit-key.pem');
  const cert = readFileSync('/tmp/f06-real-deposit-cert.pem');
  server = createServer({ key, cert }, productionDenyHandler());
  await listen(server);
  baseUrl = 'https://127.0.0.1:' + server.address().port;
});
after(async () => closeServer(server));

test('1. TLS production Deposit route is not wired', async () => {
  const response = await httpsCall('/api/v1/deposits', 'POST', { amountCents: 12000 });
  assert.equal(response.status, 404);
  assert.equal(response.body.code, 'NOT_FOUND');
});
test('2. TLS refund route is not wired', async () => {
  const response = await httpsCall('/api/v1/refunds', 'POST', { amountCents: 12000 });
  assert.equal(response.status, 404);
});
test('3. TLS transaction route is not wired', async () => {
  const response = await httpsCall('/api/v1/transactions', 'POST', { amountCents: 12000 });
  assert.equal(response.status, 404);
});
test('4. TLS Lock release route is not wired by the Deposit CI adapter', async () => {
  const response = await httpsCall('/api/v1/locks/1/release', 'POST', { reason: 'not a production route' });
  assert.equal(response.status, 404);
});
test('5. TLS synthetic CI recording route is not exposed as production', async () => {
  const response = await httpsCall('/__ci__/f06-real-deposit/deposits', 'POST', { lockId: 1, amountCents: 12000 });
  assert.equal(response.status, 404);
});
test('6. TLS correction route is not exposed as production', async () => {
  const response = await httpsCall('/__ci__/f06-real-deposit/deposits/1/corrections', 'POST', { deltaCents: -100 });
  assert.equal(response.status, 404);
});
test('7. TLS reversal route is not exposed as production', async () => {
  const response = await httpsCall('/__ci__/f06-real-deposit/deposits/1/reversals', 'POST', { deltaCents: -12000 });
  assert.equal(response.status, 404);
});
test('8. TLS derived-net route is not exposed as production', async () => {
  const response = await httpsCall('/api/v1/deposits/1/net', 'GET');
  assert.equal(response.status, 404);
});
test('9. A forged role and money payload cannot reveal financial details through TLS denial', async () => {
  const response = await httpsCall('/__ci__/f06-real-deposit/deposits', 'POST',
    { amountCents: 999999999, role_code: 'manager', principal_kind: 'system_admin' },
    { authorization: 'Bearer forged-session-token-000000', 'x-role': 'manager' });
  assert.equal(response.status, 404);
  assert.deepEqual(response.body, { allowed: false, code: 'NOT_FOUND' });
  assert.equal(response.body.amountCents, undefined);
  assert.equal(response.headers['cache-control'], 'no-store');
  assert.equal(response.headers['x-content-type-options'], 'nosniff');
});
