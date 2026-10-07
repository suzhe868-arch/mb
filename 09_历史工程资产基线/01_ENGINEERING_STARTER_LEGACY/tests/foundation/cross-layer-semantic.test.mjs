import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = async (rel) => readFile(new URL(`../../${rel}`, import.meta.url), "utf8");

test("CR-005 Page Action Matrix permissions are all registered", async () => {
  const matrix = await read("spec/FINAL_DEV_READY/06_UI_DATA/06_PAGE_ACTION_MATRIX.md");
  const registry = await read("spec/FINAL_DEV_READY/09_STATE_PERMISSION_CONFIG/09_PERMISSION_CODE_REGISTRY.md");
  const registered = new Set([...registry.matchAll(/\| `([^`]+)` \|/g)].map(x=>x[1]).filter(x=>x.includes(".")));
  const nonRbac = new Set(["auth.staff.session","auth.system_admin.session","customer.session","customer.self","jyt.integration.ingest"]);
  const used = new Set();
  for (const line of matrix.split(/\r?\n/)) {
    if (!line.startsWith("|")) continue;
    for (const m of line.matchAll(/`([a-z][a-z0-9_.]+)`/g)) {
      const code=m[1]; if (code.includes(".")) used.add(code);
    }
  }
  const missing=[...used].filter(x=>!registered.has(x)&&!nonRbac.has(x));
  assert.deepEqual(missing, []);
});

test("CR-005 Workbench shell is session-scoped while protected modules remain protected", async () => {
  const ops = JSON.parse(await read("packages/contracts/generated/operation-index.json"));
  const get=(id)=>ops.find(x=>x.operationId===id);
  assert.equal(get("get_staff_workbench")?.permission,"auth.staff.session");
  assert.equal(get("get_staff_workbench_todos")?.permission,"auth.staff.session");
  assert.equal(get("get_staff_workbench_opportunities")?.permission,"crm.customer.read");
  assert.equal(get("get_staff_radar")?.permission,"demand.read");
});

test("CR-005 E04 uses StaffSelfDTO only and employee-self contract exists", async () => {
  const matrix = await read("spec/FINAL_DEV_READY/06_UI_DATA/06_PAGE_DATA_MATRIX.md");
  const e04 = matrix.split(/\r?\n/).filter(x=>/^\|\s*E04\b/.test(x)).join("\n");
  assert.match(e04,/StaffSelfDTO/);
  assert.doesNotMatch(e04,/(StaffCustomerDTO|CustomerDTO|AdminCustomerDTO)/);
  const ops = JSON.parse(await read("packages/contracts/generated/operation-index.json"));
  assert.ok(ops.some(x=>x.operationId==="get_staff_me"&&x.permission==="auth.staff.session"&&x.projection==="StaffSelfDTO"));
});

test("CR-005 explicit 4S capability matrix exists and keeps protected customer business hidden by default", async () => {
  const matrix = await read("spec/FINAL_DEV_READY/04_SCREEN_REGISTRY/03_EMPLOYEE_SCREEN_CAPABILITY_MATRIX.md");
  assert.match(matrix,/4S/);
  assert.match(matrix,/E04/);
  assert.match(matrix,/E03/);
  assert.match(matrix,/(默认隐藏|hidden)/i);
});

test("CR-005 lock product authority is unchanged: manual vehicles may lock without internal wholesale price", async () => {
  const ssot = await read("spec/FINAL_DEV_READY/02_SSOT/名邦汽车_V1_SSOT_CHECKPOINT_2026-09-06.md");
  assert.match(ssot,/有没有内部批发价都允许锁车/);
});
