import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const get=n=>readFile(new URL('../'+n,import.meta.url),'utf8').then(s=>s.trim().split(/\r?\n/).map(x=>x.split('\t')).slice(1));
test('全部P0身份核心字段单列可空/FK/唯一策略/Authority审核条款',async()=>{
const [m,t,c]=await Promise.all(['field-matrix.tsv','field-tiers-376.tsv','core-constraint-contract.tsv'].map(get));const cores=t.filter(x=>x[2]==='P0_IDENTITY_CORE');assert.ok(cores.length>=30);assert.equal(c.length,cores.length);
const id=new Set(c.map(x=>x[0]));assert.equal(id.size,cores.length);for(const entry of cores)assert.ok(id.has(entry[0]));
for(const r of c){assert.equal(r.length,7);assert.match(r[2],/^(YES|NO)$/);assert.ok(r[3].length>6);assert.ok(r[4].length>12);assert.ok(r[5].startsWith('PDM-'));assert.equal(r[6],'PENDING_A_CORE_FREEZE');}
const map=new Map(c.map(r=>[r[1],r]));assert.equal(map.get('customers.current_owner_employee_id')[2],'YES');
assert.match(map.get('customer_wechat_identities.wechat_identity_key')[4],/identity_scope/);
assert.match(map.get('role_permission_defaults.permission_id')[4],/role_id,permission_id/);
assert.match(map.get('employee_permission_overrides.permission_id')[4],/employee_id,permission_id/);
assert.match(map.get('customer_daily_price_access.listing_cycle_id')[4],/不能|混用|此表/);
});
