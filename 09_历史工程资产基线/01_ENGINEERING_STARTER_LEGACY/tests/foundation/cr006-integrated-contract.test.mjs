import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
const o=fs.readFileSync('packages/contracts/openapi.yaml','utf8');
test('CR-006 OpenAPI is integrated',()=>{
 for(const x of ['vehicle.model.manage','VehicleWriteRequestV2','JytVehicleSourceDataV1','CustomerVehicleCardPageDTO','StaffVehicleCardPageDTO','/admin/vehicle-model-match-cases','/customer/vehicle-catalog/brands','model_year_desc','/admin/vehicle-brands','/admin/vehicle-series','/admin/employees/{id}/report-preferences']) assert.ok(o.includes(x),x);
 assert.ok(!/JytVehicleUpsertRequest:[\s\S]{0,1000}source_data:\s*\n\s*type: object\s*\n\s*required: \[\]/.test(o),'arbitrary JYT source_data survived');
});
const perms=fs.readFileSync('packages/contracts/src/permissions.ts','utf8'); test('vehicle.model.manage is code-registered',()=>assert.ok(perms.includes('vehicle.model.manage')));
