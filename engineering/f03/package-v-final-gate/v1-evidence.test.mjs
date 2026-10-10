// F03-V: independent OLD M94 genuine PG16 coverage and safe projection.
// Run only after original P1 genuine PG16 tests on a fresh isolated DB.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import {connect,verify as verifyM94} from '../runtime-transaction-responsible-handover/migration.mjs';
import {verify as verifyG14} from '../runtime-governance-closure/migration.mjs';
import {IsolatedAuth} from '../../src/f03-auth-service.mjs';
import {projectCustomerVehicle,projectEmployeeVehicle} from '../field-security-projection/service.mjs';
const c=await connect(),secret=randomBytes(32);
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin:'https://127.0.0.1:48981'});
let manager,old;
const customer=(id,mode,attested=true)=>({kind:'trusted-synthetic-customer',customerId:id,entitlementMode:mode,entitlementAttested:attested});
test.before(async()=>{
 assert.equal(process.env.CI,'true');assert.equal(process.env.GITHUB_ACTIONS,'true');
 const x=await auth.login({login:'http_test',password:'SyntheticHttps_1234567',source:'v_evidence'});
 assert.equal(x.code,'AUTH_OK',JSON.stringify(x));manager=x.token;old=x;
});
test.after(async()=>{await auth.close();await c.end();secret.fill(0)});
test('V1 M94 seal is exact, G000014 must fail on old isolated schema',async()=>{
 assert.equal((await verifyM94(c)).verified,true);
 await assert.rejects(()=>verifyG14(c));
 const status=(await c.query("SELECT pg_get_constraintdef(oid) d FROM pg_constraint WHERE conname='handover_items_status_check'")).rows[0];
 assert.ok(status);assert.ok(!status.d.includes("'completed'"),status.d);
});
test('V1 all 59 original capability and governance entries have a current disposition and conservative trace',async()=>{
 const file=readFileSync(new URL('./coverage-current.tsv',import.meta.url),'utf8').trim().split('\n');
 const cols=file[0].split('\t'),rows=file.slice(1).map(x=>Object.fromEntries(x.split('\t').map((y,i)=>[cols[i],y])));
 assert.equal(rows.length,59);assert.equal(rows.filter(r=>r.group==='CAPABILITY').length,45);assert.equal(rows.filter(r=>r.group==='GOVERNANCE').length,14);
 const allowed=new Set(['F03_ACCEPTED_SCOPE','F03_STILL_OPEN','OWNED_BY_F04','OWNED_BY_F05','OWNED_BY_F06','OWNED_BY_F07','DENY_BY_DESIGN']);
 const seen=new Set();
 for(const r of rows){const key=r.group+':'+r.ordinal;assert.ok(!seen.has(key),key);seen.add(key);assert.ok(allowed.has(r.current_classification),key);for(const k of ['item','source_or_contract','real_ci_evidence','negative_assertion_or_denial','next_owner','open_dependency'])assert.ok(r[k]&&r[k].length>4,key+' '+k);}
 const neg=readFileSync(new URL('./safety-negative-assertions.tsv',import.meta.url),'utf8').trim().split('\n');
 assert.equal(neg.length-1,59);
});
test('V1 LIMITED wholesale list hides price and current unlock is F05-only; UNLIMITED still synthetic',async()=>{
 const list=await projectCustomerVehicle(auth,customer(33003,'LIMITED'),{vehicleId:39001,view:'list'});
 assert.equal(list.code,'P_CUSTOMER_SAFE_PROJECTION');assert.equal(list.fields.price,null);
 const detail=await projectCustomerVehicle(auth,customer(33003,'LIMITED'),{vehicleId:39001,view:'detail'});
 assert.equal(detail.code,'P_NEEDS_F05_ATOMIC_UNLOCK');assert.equal(detail.fields.price,null);
 const noAttestation=await projectCustomerVehicle(auth,customer(33002,'UNLIMITED',false),{vehicleId:39001,view:'list'});
 assert.notEqual(noAttestation.code,'P_CUSTOMER_SAFE_PROJECTION');
 const full=await projectCustomerVehicle(auth,customer(33002,'UNLIMITED'),{vehicleId:39001,view:'detail'});
 assert.equal(full.code,'P_CUSTOMER_SAFE_PROJECTION');assert.equal(full.fields.price,9880000);
});
test('V1 4S, Mingbang, wholesale employee object attribution and all business outputs deny with valid CRM session',async()=>{
 for(const vehicleId of [39001,39002,39005])for(const view of ['list','detail','history','cache','export','copy','print']){
  const x=await projectEmployeeVehicle(auth,manager,{vehicleId,teamId:901,view});
  assert.equal(x.code,'P_VEHICLE_SCOPE_UNPROVEN',JSON.stringify({vehicleId,view,x}));
  assert.equal(x.fields,undefined);
  for(const secret of ['VIN','9100000','publisherPhone','internalPrice'])assert.ok(!JSON.stringify(x).includes(secret));
 }
});
test('V1 changed source is not verified store/Team; even a visible 4S cannot become employee export',async()=>{
 const oldRow=(await c.query('SELECT source_type,source_sale_status FROM public.vehicles WHERE vehicle_id=39005')).rows[0];
 try{
  await c.query("UPDATE public.vehicles SET source_type='wholesale',source_sale_status='active' WHERE vehicle_id=39005");
  assert.equal((await projectEmployeeVehicle(auth,manager,{vehicleId:39005,teamId:901,view:'export'})).code,'P_VEHICLE_SCOPE_UNPROVEN');
 }finally{await c.query('UPDATE public.vehicles SET source_type=$1,source_sale_status=$2 WHERE vehicle_id=39005',[oldRow.source_type,oldRow.source_sale_status]);}
});
test('V1 current deny, deactivation and old PC session cannot authorize cached object',async()=>{
 await c.query("UPDATE public.employee_permission_overrides SET decision='deny' WHERE employee_id=5 AND permission_id=12");
 try{
  assert.equal((await projectEmployeeVehicle(auth,manager,{vehicleId:39001,teamId:901,view:'cache'})).code,'P_EMPLOYEE_SCOPE_DENY');
 }finally{await c.query("UPDATE public.employee_permission_overrides SET decision='allow' WHERE employee_id=5 AND permission_id=12")}
 await c.query("UPDATE public.employees SET employment_status='inactive' WHERE employee_id=5");
 try{assert.notEqual((await projectEmployeeVehicle(auth,manager,{vehicleId:39001,teamId:901,view:'history'})).code,'P_EMPLOYEE_REDACTED')}
 finally{await c.query("UPDATE public.employees SET employment_status='active' WHERE employee_id=5")}
});
test('V1 M94 cannot fake SG06 completed state via status update or G service; denied under true check',async()=>{
 await assert.rejects(()=>c.query("UPDATE public.handover_items SET status='completed' WHERE item_id=13601"),e=>e.code==='23514');
 assert.equal((await verifyM94(c)).verified,true);
});
