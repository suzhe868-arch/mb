import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';

const read = async (rel) => readFile(new URL(`../../${rel}`, import.meta.url), 'utf8');

test('CR-006.1 preflight is Unicode-path safe', async () => {
  const s = await read('scripts/preflight.mjs');
  assert.match(s, /fileURLToPath/);
  assert.doesNotMatch(s, /new URL\([^\n]+\)\.pathname/);
});

test('CR-006.1 customer-safe employee detail has no visible internal-mode button or upstream phone', async () => {
  const normal = await read('spec/FINAL_DEV_READY/05_LOW_FI/ACTUAL_WIREFRAMES/E02-01/E02-01-S01-NORMAL.svg');
  assert.doesNotMatch(normal, />internal-mode\s*</i);
  assert.doesNotMatch(normal, /上游电话：查看/);
  assert.match(normal, /长按价格区域约3秒/);
  assert.match(normal, /推荐给客户/);
  assert.match(normal, /锁车/);

  const internal = await read('spec/FINAL_DEV_READY/05_LOW_FI/ACTUAL_WIREFRAMES/E02-M01/E02-M01-S01-AUTHORIZED.svg');
  assert.match(internal, /上游电话/);
  assert.match(internal, /最新电话/);
  assert.match(internal, /拨打/);
});

test('CR-006.1 E02 list has no generic internal/recommend/lock toolbar', async () => {
  for (const f of ['E02-S01-NORMAL.svg','E02-S02-LOADING.svg','E02-S03-EMPTY.svg','E02-S04-ERROR.svg']) {
    const s = await read(`spec/FINAL_DEV_READY/05_LOW_FI/ACTUAL_WIREFRAMES/E02/${f}`);
    assert.doesNotMatch(s, />internal-mode\s*</i, f);
    assert.doesNotMatch(s, />recommend</i, f);
    assert.doesNotMatch(s, />lock</i, f);
    assert.match(s, /上传车辆/, f);
  }
});

test('CR-006.1 model closure remains while CR-006.2 replaces preview with automatic-draft recovery', async () => {
  const normal = await read('spec/FINAL_DEV_READY/05_LOW_FI/ACTUAL_WIREFRAMES/E02-02/E02-02-S01-NORMAL.svg');
  assert.match(normal, /品牌 → 车系 → 年款 → 具体车型\/配置/);
  assert.match(normal, /自动保存/);
  assert.doesNotMatch(normal, /预览/);
  assert.doesNotMatch(normal, /保存草稿/);
  await access(new URL('../../spec/FINAL_DEV_READY/05_LOW_FI/ACTUAL_WIREFRAMES/E02-02/E02-02-S06-MODEL_MISSING.svg', import.meta.url));
  await access(new URL('../../spec/FINAL_DEV_READY/05_LOW_FI/ACTUAL_WIREFRAMES/E02-02/E02-02-S07-DRAFT_RESUME.svg', import.meta.url));
});

test('CR-006.1 POST /staff/vehicles has no list query parameters', async () => {
  const o = await read('packages/contracts/openapi.yaml');
  const start = o.indexOf('  /staff/vehicles:\n');
  const post = o.indexOf('    post:\n', start);
  const next = o.indexOf('  /staff/vehicles/{id}:\n', post);
  const sec = o.slice(post, next);
  assert.doesNotMatch(sec, /- name: (source_type|region|search|sort)\n\s+in: query/);
  assert.match(sec, /- name: Idempotency-Key/);
  assert.match(sec, /\$ref: '#\/components\/schemas\/VehicleWriteRequestV2'/);
});

test('CR-006.1 PATCH vehicle uses one authoritative version source', async () => {
  const o = await read('packages/contracts/openapi.yaml');
  const start = o.indexOf('  /staff/vehicles/{id}:\n');
  const patch = o.indexOf('    patch:\n', start);
  const del = o.indexOf('    delete:\n', patch);
  const sec = o.slice(patch, del);
  assert.match(sec, /- name: If-Match\n\s+in: header\n\s+required: true/);
  const vs = o.slice(o.indexOf('    VehicleWriteRequestV2:\n'), o.indexOf('    VehicleModelMatchCaseDTO:\n'));
  assert.doesNotMatch(vs, /\n\s+version:\n/);
});

test('current phone contract stops at Collector and removes Mingbang-managed JYT phone credentials', async () => {
  const c = await read('spec/FINAL_DEV_READY/10_API/10_JYT_UPSTREAM_PHONE_ADAPTER_CONTRACT.md');
  const o = await read('packages/contracts/openapi.yaml');
  assert.match(c, /名邦 → Collector → JYT/);
  assert.match(c, /publisher_id/);
  assert.match(c, /car_code.*不参与电话查询/);
  assert.match(o, /\/admin\/integrations\/collector\/connection:test:/);
  assert.doesNotMatch(o, /\/integrations\/jyt\/upstream-credential:/);
  assert.doesNotMatch(o, /\/admin\/jyt\/upstream-credential:test:/);
});
