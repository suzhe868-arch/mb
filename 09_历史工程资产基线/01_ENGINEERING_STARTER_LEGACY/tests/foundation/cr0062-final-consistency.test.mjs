import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';

const read = async (rel) => readFile(new URL(`../../${rel}`, import.meta.url), 'utf8');

test('CR-006.2 manual publishing exposes only automatic draft and formal publish', async () => {
  const normal = await read('spec/FINAL_DEV_READY/05_LOW_FI/ACTUAL_WIREFRAMES/E02-02/E02-02-S01-NORMAL.svg');
  assert.match(normal, /自动保存/);
  assert.match(normal, /图片可为0张/);
  assert.match(normal, /默认占位图/);
  assert.doesNotMatch(normal, /预览/);
  await access(new URL('../../spec/FINAL_DEV_READY/05_LOW_FI/ACTUAL_WIREFRAMES/E02-02/E02-02-S07-DRAFT_RESUME.svg', import.meta.url));
});

test('CR-006.2 source type chooses readonly wholesale source or writable manual edit', async () => {
  const { resolveVehicleEditMode } = await import('../../apps/api/src/modules/vehicle/source-type-edit.ts');
  assert.deepEqual(resolveVehicleEditMode('wholesale'), { mode: 'readonly-source', patchAllowed: false });
  assert.deepEqual(resolveVehicleEditMode('mingbang'), { mode: 'editable', patchAllowed: true });
  assert.deepEqual(resolveVehicleEditMode('four_s'), { mode: 'editable', patchAllowed: true });
});

test('CR-006.2 money display uses compact wan without yuan suffix', async () => {
  const { formatPriceWan } = await import('../../apps/staff-miniapp/src/shared/money.ts');
  assert.equal(formatPriceWan(12800000), '12.8万');
  assert.equal(formatPriceWan(8000000), '8万');
  assert.equal(formatPriceWan(null), '价格咨询');
});

test('CR-006.2 official starter errors replace temporary aliases', async () => {
  const errors = await read('apps/api/src/core/errors.ts');
  assert.match(errors, /PERMISSION_DENIED/);
  assert.match(errors, /OBJECT_NOT_FOUND/);
  assert.doesNotMatch(errors, /["']FORBIDDEN["']/);
  assert.doesNotMatch(errors, /["']NOT_FOUND["']/);
});

test('CR-006.2 publisher phone refresh is cache-first and single-flight per publisher', async () => {
  const { shouldFetchPublisherPhone, PublisherPhoneSingleFlight } = await import('../../apps/api/src/modules/vehicle/publisher-phone.ts');
  assert.equal(shouldFetchPublisherPhone({ currentPhone: '138****0000', forceRefresh: false }), false);
  assert.equal(shouldFetchPublisherPhone({ currentPhone: null, forceRefresh: false }), true);
  assert.equal(shouldFetchPublisherPhone({ currentPhone: '138****0000', forceRefresh: true }), true);

  const singleFlight = new PublisherPhoneSingleFlight();
  let calls = 0;
  const loader = async () => {
    calls += 1;
    await new Promise(resolve => setTimeout(resolve, 5));
    return { phone: '138****1111' };
  };
  const [first, second] = await Promise.all([
    singleFlight.run('JYT:publisher-1', loader),
    singleFlight.run('JYT:publisher-1', loader),
  ]);
  assert.equal(calls, 1);
  assert.deepEqual(first, second);
});

test('CR-006.2 does not mount unfinished protected routes', async () => {
  const app = await read('apps/api/src/app.ts');
  assert.doesNotMatch(app, /registerStaffVehicleWriteRoutes/);
  assert.doesNotMatch(app, /registerJytPhoneConfigRoutes/);
});
