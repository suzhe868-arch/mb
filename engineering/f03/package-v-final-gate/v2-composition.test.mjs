// V2: standalone genuine G000014 PG16 integration; P stays M94-only.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {connect,verify as verifyG} from '../runtime-governance-closure/migration.mjs';
import {verify as verifyM} from '../runtime-transaction-responsible-handover/migration.mjs';
import {verifyLiveHandoverChain,readHandoverClosure,certifyHandoverItem} from '../runtime-governance-closure/service.mjs';
import {commitPlannedGovernance} from '../runtime-governance-closure/governance.mjs';
import {IsolatedAuth} from '../../src/f03-auth-service.mjs';
const c=await connect(),key=randomBytes(32);
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret:key,origin:'https://127.0.0.1:48981'});
let manager,sourceSession;
test.before(async()=>{
 assert.equal(process.env.CI,'true');
 manager=(await auth.login({login:'http_test',password:'SyntheticN_2026_CI_Authority',source:'v_composition_manager'})).token;
 sourceSession=(await auth.login({login:'synthetic_g_user_76',password:'SyntheticG_Disposable_76_2026',source:'v_composition_source'})).token;
 assert.ok(manager&&sourceSession);
});
test.after(async()=>{await auth.close();await c.end();key.fill(0)});
test('V2 signed G structure rejects P original M94 catalog verifier',async()=>{
 assert.equal((await verifyG(c)).verified,true);
 await assert.rejects(()=>verifyM(c));
 const q=await c.query("SELECT conname,pg_get_constraintdef(oid) d FROM pg_constraint WHERE conname IN ('handover_items_status_check','handover_batches_status_check')");
 assert.equal(q.rows.length,2);
 for(const row of q.rows)assert.ok(row.d.includes('completed'));
});
test('V2 real H receipt and G completed audit agree for Customer',async()=>{
 const i=(await c.query('SELECT * FROM public.handover_items WHERE item_id=17601')).rows[0];
 assert.equal(i.status,'completed');
 assert.equal((await verifyLiveHandoverChain(c,i,901)).ok,true);
 assert.equal((await c.query('SELECT count(*)::int n FROM public.customer_owner_handover_receipts WHERE item_id=17601')).rows[0].n,1);
 assert.equal((await c.query("SELECT count(*)::int n FROM public.audit_events WHERE object_kind='handover_batch' AND object_id='97001' AND action='sg06.batch.complete'")).rows[0].n,1);
 const x=await readHandoverClosure(auth,manager,{batchId:97001,teamId:901});
 assert.equal(x.code,'G_BATCH_READ',JSON.stringify(x));
});
test('V2 true two-step 77 to 4 to 6 historical owner chain resists unaudited drift',async()=>{
 const i=(await c.query('SELECT * FROM public.handover_items WHERE item_id=17602')).rows[0];
 assert.equal(i.status,'completed');
 assert.equal((await verifyLiveHandoverChain(c,i,901)).ok,true);
 const before=(await c.query('SELECT current_owner_employee_id FROM public.customers WHERE customer_id=37602')).rows[0].current_owner_employee_id;
 try{
  await c.query('UPDATE public.customers SET current_owner_employee_id=5 WHERE customer_id=37602');
  assert.equal((await verifyLiveHandoverChain(c,i,901)).ok,false);
 }finally{await c.query('UPDATE public.customers SET current_owner_employee_id=$1 WHERE customer_id=37602',[before])}
});
test('V2 partial SG06 and cross-batch Priority cannot be treated as full batch',async()=>{
 assert.notEqual((await c.query('SELECT status FROM public.handover_batches WHERE batch_id=96601')).rows[0].status,'completed');
 const r=await certifyHandoverItem(auth,manager,{batchId:96602,itemId:13613,teamId:901});
 assert.equal(r.ok,false);
});

test('V2 completed genuine G batch permits planned inactive only with current immutable owner proof',async()=>{
 const before=(await c.query("SELECT count(*)::int n FROM public.audit_events WHERE object_kind='handover_batch' AND object_id='97001' AND action='sg06.batch.complete'")).rows[0].n;
 const r=await commitPlannedGovernance(auth,manager,{action:'planned_disable',batchId:97001,employeeId:76,teamId:901});
 assert.equal(r.code,'G_PLANNED_APPLIED',JSON.stringify(r));
 assert.equal((await c.query('SELECT employment_status FROM public.employees WHERE employee_id=76')).rows[0].employment_status,'inactive');
 assert.equal((await c.query('SELECT credential_state FROM public.pc_login_accounts WHERE employee_id=76')).rows[0].credential_state,'disabled');
 assert.equal(await auth.withSession(sourceSession,async()=>true),null);
 assert.equal((await c.query("SELECT count(*)::int n FROM public.audit_events WHERE object_kind='handover_batch' AND object_id='97001' AND action='sg06.batch.complete'")).rows[0].n,before);
});
test('V2 revoked employee cannot act on another pending batch, finance counts remain immutable',async()=>{
 const financial=(await c.query('SELECT count(*)::int n FROM public.refund_cases WHERE status=$1',['pending'])).rows[0].n;
 const r=await commitPlannedGovernance(auth,sourceSession,{action:'planned_disable',batchId:96601,employeeId:7,teamId:901});
 assert.equal(r.ok,false);
 assert.equal((await c.query('SELECT count(*)::int n FROM public.refund_cases WHERE status=$1',['pending'])).rows[0].n,financial);
});
test('V2 G schema never activates P M94 field projection without separate instance',async()=>{
 await assert.rejects(()=>verifyM(c));
 assert.equal((await verifyG(c)).verified,true);
});
