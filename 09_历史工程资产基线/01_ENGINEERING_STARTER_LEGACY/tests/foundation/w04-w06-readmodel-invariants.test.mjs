import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('vehicle read model preserves customer-safe gate and sensitive-field gates',()=>{
 const s=fs.readFileSync('apps/api/src/modules/vehicle/vehicle-read.repository.ts','utf8');
 assert.match(s,/customerVisibilityContext\(db,vehicleId,customerId,row\)/,'customer detail must use the unified visibility context');
 assert.match(s,/decideCustomerVisibility\(/,'customer visibility must run through Priority-aware policy');
 assert.match(s,/FROM demand_priority_leases p/,'active Priority must be loaded before customer visibility is decided');
 assert.match(s,/access\.internalPrice&&row\.internal_wholesale_price_cents/);
 assert.match(s,/access\.upstreamPhone&&row\.cached_upstream_phone/);
 assert.match(s,/buildCustomerSafeDetail\(db,row,resolver\)/,'staff/admin safe projection must not call customer visibility gate');
 assert.match(s,/display_type:'consultation'/,'missing valid price path must remain consultation');
});

test('staff customer read model allows no-owner public pool while retaining scoped PII carrier',()=>{
 const s=fs.readFileSync('apps/api/src/modules/customer/customer-read.repository.ts','utf8');
 assert.match(s,/r\.owner_employee_id != null \? \{owner_employee_id:/);
 assert.match(s,/phone_current \? \{phone:String\(r\.phone_current\)\}/);
 assert.match(s,/customer_profiles cp/);
 assert.match(s,/customer_alias_notes/);
 assert.match(s,/active_demand_count/);
});
