import test from 'node:test';
import assert from 'node:assert/strict';
import { createPgReadinessProbe } from '../src/postgres.mjs';

const safeUrl = 'postgres://test:test@127.0.0.1:5432/f01_foundation';
const allowed = {
  APP_ENV: 'test',
  F01_TEST_DB_CONSENT: 'I_CONFIRM_ISOLATED_TEST_DATABASE',
};

test('没有数据库配置时就绪必须为 false', async () => {
  assert.equal(await createPgReadinessProbe({ APP_ENV: 'test' })(), false);
});

test('非测试环境或缺少独立授权一律拒绝连接数据库', () => {
  assert.throws(() => createPgReadinessProbe({ DATABASE_URL: safeUrl, APP_ENV: 'development' }), /CONSENT_REQUIRED/);
  assert.throws(() => createPgReadinessProbe({ DATABASE_URL: safeUrl, ...allowed, F01_TEST_DB_CONSENT: '' }), /CONSENT_REQUIRED/);
});

test('只接受本机隔离测试库，拒绝任何远程生产目标', () => {
  assert.throws(() => createPgReadinessProbe({ ...allowed, DATABASE_URL: 'postgres://u:p@database.example.com/prod' }), /NOT_ALLOWED/);
  assert.throws(() => createPgReadinessProbe({ ...allowed, DATABASE_URL: 'postgres://u:p@127.0.0.1:5432/production' }), /NOT_ALLOWED/);
  assert.throws(() => createPgReadinessProbe({ ...allowed, DATABASE_URL: 'https://u:p@localhost/f01_foundation' }), /NOT_ALLOWED/);
  assert.throws(() => createPgReadinessProbe({ ...allowed, DATABASE_URL: 'nonsense' }), /URL_INVALID/);
});
