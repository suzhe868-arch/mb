import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("CR-005 StaffSelf static route is current-principal only and exposes no Feishu secret",()=>{
  const route=fs.readFileSync('apps/api/src/modules/auth/staff-self.routes.ts','utf8');
  const repo=fs.readFileSync('apps/api/src/modules/auth/staff-self.repository.ts','utf8');
  assert.match(route,/app\.get\('\/staff\/me'/);
  assert.match(route,/requireEmployeeSession\(request\)/);
  assert.doesNotMatch(route,/employee_id.*params|params.*employee_id/i);
  assert.match(repo,/employee_feishu_bindings/);
  assert.match(repo,/feishu_binding_status/);
  assert.doesNotMatch(repo,/receive_identity\s+AS|receive_identity[^\n]*return/i);
  assert.match(repo,/employee_data_scopes/);
});
