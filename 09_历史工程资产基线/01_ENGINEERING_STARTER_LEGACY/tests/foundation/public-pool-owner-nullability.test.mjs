import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('StaffCustomerDTO permits legitimate public-pool customers with no current owner',()=>{
 const openapi=fs.readFileSync('packages/contracts/openapi.yaml','utf8');
 const block=openapi.match(/StaffCustomerDTO:\n([\s\S]*?)\n\s{4}[A-Za-z0-9_]+DTO:/)?.[1] ?? '';
 assert.ok(block,'StaffCustomerDTO block missing');
 const required=block.match(/required:\n([\s\S]*?)\n\s{6}properties:/)?.[1] ?? '';
 assert.ok(!required.includes('owner_employee_id'),'owner_employee_id must not be required for public-pool projection');
 assert.ok(block.includes('owner_employee_id:'),'owner_employee_id field must remain available when assigned');
 const index=JSON.parse(fs.readFileSync('packages/contracts/generated/operation-index.json','utf8'));
 for(const id of ['get_staff_public_pool','get_staff_public_pool_candidates','post_staff_public_pool_customers_customer_id_claim']){
   const op=index.find(x=>x.operationId===id); assert.ok(op,id); assert.match(op.projection,/StaffCustomerDTO/);
 }
});
