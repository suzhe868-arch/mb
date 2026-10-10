// G1 actual 000014 PG16 verification, genuine preexisting H-M receipts.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {connect,verify} from '../migration.mjs';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {certifyHandoverItem,commitHandoverItem,commitHandoverBatch,readHandoverClosure} from '../service.mjs';
const db=await connect(),secret=randomBytes(32);
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin:'https://127.0.0.1:48981'});
let token;
test.before(async()=>{const r=await auth.login({login:'http_test',password:'SyntheticN_2026_CI_Authority',source:'g1_current'});assert.equal(r.code,'AUTH_OK');token=r.token});
test.after(async()=>{await auth.close();await db.end();secret.fill(0)});
const item=i=>({batchId:96601,itemId:i,teamId:901,requestKey:'g1-item-completion-'+i+'-2026'});
test('G1 only two authorized CHECK constraints changed, source M94 sha pinned',async()=>{
 const r=await verify(db);assert.equal(r.verified,true);assert.equal(r.objects,2120);
 const counts=await db.query("SELECT count(*)::int n FROM pg_tables WHERE schemaname='public'");assert.equal(counts.rows[0].n,94);
});
test('G1 genuine historical Demand receipt remains valid through a later proven recipient chain',async()=>{
 const result=await certifyHandoverItem(auth,token,{batchId:96601,itemId:13602,teamId:901});
 assert.equal(result.code,'G_ITEM_CERTIFIED',JSON.stringify(result));
 const newest=(await db.query('SELECT responsible_employee_id FROM public.demands WHERE demand_id=401')).rows[0];
 assert.equal(Number(newest.responsible_employee_id),5);
 const forged=await certifyHandoverItem(auth,token,{batchId:96602,itemId:13612,teamId:901});
 assert.equal(forged.ok,false);
 assert.equal((await db.query('SELECT status FROM public.handover_items WHERE item_id=13612')).rows[0].status,'retry_required');
});
test('G1 legal existing Customer immutable receipt can be completed once with audit and no domain mutation',async()=>{
 const r=await certifyHandoverItem(auth,token,{batchId:96601,itemId:13601,teamId:901});
 assert.equal(r.code,'G_ITEM_CERTIFIED',JSON.stringify(r));
 const old=(await db.query('SELECT current_owner_employee_id FROM public.customers WHERE customer_id=301')).rows[0];
 const x=await commitHandoverItem(auth,token,item(13601));
 assert.equal(x.code,'G_ITEM_COMPLETED',JSON.stringify(x));
 assert.equal((await db.query('SELECT status FROM public.handover_items WHERE item_id=13601')).rows[0].status,'completed');
 assert.equal((await db.query('SELECT current_owner_employee_id FROM public.customers WHERE customer_id=301')).rows[0].current_owner_employee_id,old.current_owner_employee_id);
 const audits=await db.query("SELECT * FROM public.audit_events WHERE object_kind='handover_item' AND object_id='13601' AND action='sg06.item.complete'");
 assert.equal(audits.rows.length,1);
});
test('G1 retry identical request key idempotent; another key cannot duplicate audit',async()=>{
 const r=await commitHandoverItem(auth,token,item(13601));
 assert.equal(r.code,'G_ITEM_IDEMPOTENT');
 const different=await commitHandoverItem(auth,token,{...item(13601),requestKey:'g1-alternate-request-13601'});
 assert.equal(different.code,'G_ITEM_ALREADY_COMPLETED');
 const a=(await db.query("SELECT count(*)::int n FROM public.audit_events WHERE object_kind='handover_item' AND object_id='13601' AND action='sg06.item.complete'")).rows[0].n;assert.equal(a,1);
});
test('G1 true partially completed batch cannot be promoted or disable employee',async()=>{
 const r=await commitHandoverBatch(auth,token,{batchId:96601,teamId:901,requestKey:'g1-batch-cannot-complete'});
 assert.equal(r.ok,false);
 const status=(await db.query('SELECT status FROM public.handover_batches WHERE batch_id=96601')).rows[0].status;
 assert.notEqual(status,'completed');
});
test('G1 fail-closed on unknown requester, Team and forged already-completed orphan item',async()=>{
 const r=await commitHandoverItem(auth,null,item(13604));assert.equal(r.ok,false);
 const deny=await commitHandoverItem(auth,token,{...item(13604),teamId:999});assert.equal(deny.ok,false);
 const snap=await readHandoverClosure(auth,token,{batchId:96601,teamId:901});
 assert.equal(snap.code,'G_BATCH_READ');
 assert.equal(snap.canDisable,false);
});
test('G1 after-CAS fault rolls back both completed and audit effects',async()=>{
 const before=(await db.query("SELECT status,attempt_count FROM public.handover_items WHERE item_id=13604")).rows[0];
 const count=(await db.query("SELECT count(*)::int n FROM public.audit_events WHERE object_kind='handover_item' AND object_id='13604'")).rows[0].n;
 await assert.rejects(()=>commitHandoverItem(auth,token,item(13604),{testCheckpoint:async stage=>{if(stage==='after_cas')throw Error('G_SYNTHETIC_FAULT_AFTER_CAS')}}));
 const after=(await db.query("SELECT status,attempt_count FROM public.handover_items WHERE item_id=13604")).rows[0];
 assert.deepEqual(after,before);assert.equal((await db.query("SELECT count(*)::int n FROM public.audit_events WHERE object_kind='handover_item' AND object_id='13604'")).rows[0].n,count);
});
