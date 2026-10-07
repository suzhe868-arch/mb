import test from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from '../src/config.mjs';

test('测试与开发环境只监听明确允许的地址', () => {
  assert.deepEqual(loadConfig({ APP_ENV: 'test', API_PORT: '3100' }), {
    mode: 'test', host: '127.0.0.1', port: 3100,
  });
  assert.throws(() => loadConfig({ APP_ENV: 'development', API_HOST: '0.0.0.0' }), /PUBLIC_BIND_REFUSED/);
  assert.deepEqual(loadConfig({
    APP_ENV: 'test', API_HOST: '0.0.0.0', API_PORT: '3101',
    ALLOW_DEV_PUBLIC_BIND: 'I_ACCEPT_LOCAL_NETWORK_EXPOSURE',
  }).host, '0.0.0.0');
});

test('生产模式在完整安全与就绪合同交付前硬阻断', () => {
  assert.throws(() => loadConfig({ APP_ENV: 'production' }), /F01_PRODUCTION_NOT_READY/);
});

test('不允许隐式有效的错误端口和主机', () => {
  for (const port of ['0', '-1', '65536', '3.5', 'abc', '']) {
    assert.throws(() => loadConfig({ API_PORT: port }));
  }
  assert.throws(() => loadConfig({ API_HOST: 'example.com' }));
});
