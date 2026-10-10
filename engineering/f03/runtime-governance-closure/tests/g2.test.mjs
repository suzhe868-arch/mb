import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {connect,verify} from '../migration.mjs';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {commitPlannedGovernance} from '../governance.mjs';
const c=await connect(),secret=randomBytes(32);
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin:'https://127.0.0.1:48981'});
let manager;
test.before(async()=>{const x=await auth.login({login:'http_test',password:'SyntheticN_2026_CI_Authority',source:'g2_planned'});assert.equal(x.code,'AUTH_OK');manager=x.token});
test.after(async()=>{await auth.close();await c.end();secret.fill(0)});
test('G2 separate real PG16 schema 000014 is exact',async()=>{assert.equal((await verify(c)).verified,true)});
test('G2 pending SG06 batch cannot trigger planned store transfer, downgrade or disable',async()=>{
 const old=(await c.query('SELECT employment_status,main_role_id,store_id FROM public.employees WHERE employee_id=7')).rows[0];
 for(const action of ['planned_transfer','planned_downgrade','planned_disable']){
  const r=await commitPlannedGovernance(auth,manager,{action,batchId:96601,employeeId:7,teamId:901});
  assert.equal(r.ok,false,JSON.stringify(r));
 }
 const now=(await c.query('SELECT employment_status,main_role_id,store_id FROM public.employees WHERE employee_id=7')).rows[0];assert.deepEqual(now,old);
});
test('G2 cannot let current employee self-govern or use absent Team capability',async()=>{
 const r=await commitPlannedGovernance(auth,manager,{action:'planned_disable',batchId:96601,employeeId:5,teamId:901});assert.equal(r.ok,false);
 const rr=await commitPlannedGovernance(auth,manager,{action:'planned_transfer',batchId:96601,employeeId:7,teamId:999});assert.equal(rr.ok,false);
});
test('G2 old receipts and N readonly does not magically authorize employee deactivation',async()=>{
 const before=(await c.query("SELECT count(*)::int n FROM public.handover_items WHERE batch_id=96601 AND status<>'completed'")).rows[0].n;
 assert.ok(before>0);
 const r=await commitPlannedGovernance(auth,manager,{action:'planned_disable',batchId:96601,employeeId:7,teamId:901});
 assert.equal(r.code,'G_PLANNED_NOT_CERTIFIED');
});
