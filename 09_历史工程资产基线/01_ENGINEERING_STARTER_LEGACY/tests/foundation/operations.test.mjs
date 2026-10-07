import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const operations = JSON.parse(await readFile(new URL("../../packages/contracts/generated/operation-index.json", import.meta.url), "utf8"));
test("OpenAPI operation IDs are unique and CR-007 inventory is current", () => {
  assert.equal(operations.length, 218);
  assert.equal(new Set(operations.map(x => x.operationId)).size, operations.length);
});
test("customer API never requests internal vehicle permission or internal projection", () => {
  const leaks = operations.filter(x => x.path.startsWith("/customer") && (x.permission === "vehicle.read.internal" || String(x.projection).toLowerCase().includes("internal")));
  assert.deepEqual(leaks, []);
});
test("critical reverse-closure operations exist", () => {
  const has=(method,path,permission,projection)=>operations.some(x=>x.method===method&&x.path===path&&x.permission===permission&&x.projection===projection);
  assert.ok(has("GET","/staff/find-car/applications/{id}","demand.read","FindCarApplicationDTO"));
  assert.ok(has("GET","/admin/vehicles/{id}","vehicle.read.internal","AdminVehicleDTO"));
  assert.ok(has("POST","/admin/transactions/{id}:correct","transaction.correct","TransactionCorrectionDTO"));
  assert.ok(has("PUT","/admin/customers/{id}/level","customer.level.manage","AdminCustomerDTO"));
  assert.ok(has("GET","/staff/me","auth.staff.session","StaffSelfDTO"));
  assert.ok(has("GET","/admin/vehicle-model-match-cases","vehicle.model.manage","VehicleModelMatchCasePageDTO"));
  assert.ok(has("POST","/admin/vehicle-brands","vehicle.model.manage","VehicleBrandDTO"));
  assert.ok(has("POST","/admin/vehicle-series","vehicle.model.manage","VehicleSeriesDTO"));
  assert.ok(has("GET","/admin/vehicle-models","vehicle.model.manage","VehicleModelPageDTO"));
  assert.ok(has("PATCH","/admin/employees/{id}/report-preferences","notification.config.manage","EmployeeReportPreferencesDTO"));
});


test("endpoint authorization map includes current engineering closure routes", async () => {
  const body = await readFile(new URL("../../packages/contracts/endpoint-authorization-map.md", import.meta.url), "utf8");
  for (const path of ["/admin/vehicle-brands", "/admin/vehicle-series", "/admin/vehicle-models", "/admin/employees/{id}/report-preferences", "/staff/vehicles/{id}/source-data"]) {
    assert.match(body, new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  for (const path of ["/admin/integrations/collector/connection", "/admin/integrations/collector/connection:test", "/integrations/jyt/vehicle-prices"]) {
    assert.ok(operations.some(operation => operation.path === path), path);
  }
});
