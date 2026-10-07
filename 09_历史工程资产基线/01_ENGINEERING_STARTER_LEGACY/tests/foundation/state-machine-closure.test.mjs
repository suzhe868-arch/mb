import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (rel) => readFile(new URL(`../../${rel}`, import.meta.url), 'utf8');

test('transaction cancellation keeps vehicle state axes separate', async () => {
  const state = await read('spec/FINAL_DEV_READY/09_STATE_PERMISSION_CONFIG/09_STATE_TRANSITION_CONTRACT.md');
  const schema = await read('spec/FINAL_DEV_READY/08_DATABASE/08_PHYSICAL_DB_SCHEMA.sql');
  assert.match(state, /`biz_status → normal`; keep current `source_status` and `platform_visibility` unchanged/);
  assert.doesNotMatch(state, /derive normal\/unavailable from current source\/visibility/);
  assert.match(schema, /biz_status TEXT NOT NULL DEFAULT 'normal' CHECK\(biz_status IN \('normal','locked','trading','completed'\)\)/);
  assert.match(schema, /source_status TEXT NOT NULL DEFAULT 'active' CHECK\(source_status IN \('draft','active','offline','unavailable','sold_external'\)\)/);
});

test('waitlist auto-end terminal triggers match SSOT and do not treat hidden as terminal', async () => {
  const state = await read('spec/FINAL_DEV_READY/09_STATE_PERMISSION_CONFIG/09_STATE_TRANSITION_CONTRACT.md');
  const ssot = await read('spec/FINAL_DEV_READY/02_SSOT/名邦汽车_V1_SSOT_CHECKPOINT_2026-09-06.md');
  assert.match(state, /`biz_status=completed` OR `source_status IN \(offline, unavailable, sold_external\)`/);
  assert.match(state, /same customer obtains active Lock/);
  assert.match(ssot, /车辆真实 `completed`、资源 `offline\/unavailable\/sold_external` 时，所有当前有效候补自动结束/);
  assert.match(ssot, /单纯 `platform_visibility = hidden` 不结束候补/);
});

test('traceability no longer records the invalid normal-unavailable biz transition', async () => {
  const trace = await read('spec/FINAL_DEV_READY/13_TRACEABILITY/12_FULL_TRACEABILITY_MATRIX.md');
  assert.match(trace, /trading → normal on transaction cancel; source\/visibility axes unchanged/);
  assert.match(trace, /vehicle completed or source offline\/unavailable\/sold_external/);
  assert.doesNotMatch(trace, /trading → derive normal\/unavailable/);
});
