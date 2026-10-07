import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('implemented W04/W06 detail routes use required identity, permission and object scope boundaries',()=>{
 const v=fs.readFileSync('apps/api/src/modules/vehicle/vehicle-read.routes.ts','utf8');
 for(const p of ['vehicle.read.customer_safe','vehicle.read.internal','vehicle.internal_price.view','vehicle.upstream_phone']) assert.ok(v.includes(p),p);
 assert.ok(v.includes('deps.scope.assertVehicle'));
 assert.ok(v.includes("'/customer/vehicles/:vehicle_id'"));
 assert.ok(v.includes("'/staff/vehicles/:id/internal'"));
 assert.ok(v.includes("'/admin/vehicles/:id'"));
 const c=fs.readFileSync('apps/api/src/modules/customer/customer-read.routes.ts','utf8');
 assert.ok(c.includes('crm.customer.read'));
 assert.ok(c.includes('deps.scope.assertCustomer'));
 assert.ok(c.includes("'/customer/me'"));
 assert.ok(c.includes("'/staff/customers/:customer_id'"));
 assert.ok(c.includes("'/admin/customers/:id'"));
});
