import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {connect,verify} from '../migration.mjs';
import {verify as oldV18Verify} from '../../wholesale-to-mingbang-conversion/migration.mjs';
import {syntheticFavoriteChange as change,ACTOR} from '../service.mjs';
const db=await connect();
const customer=899801,otherCustomer=899802;
let wholesale,converted,cycled;
const k=x=>'f05-3g-favorite-pg16-ci-'+x;
const p=(action,eventKey=k('add-one'),customerId=customer,vehicleId=wholesale)=>({customerId,vehicleId,action,eventKey});
const counts=async id=>(await db.query(
 "SELECT (SELECT count(*)::int FROM public.f05_3g_customer_favorites WHERE customer_id=$1 AND vehicle_id=$2) current,"+
 "(SELECT count(*)::int FROM public.f05_3g_favorite_events WHERE customer_id=$1 AND vehicle_id=$2) history",
 [customer,id])).rows[0];
test.before(async()=>{
 assert.equal((await verify(db)).verified,true);
 for(const [code,target] of [['JYTF05C-UNSCOPED','wholesale'],['JYTF05C-LOCKED','converted'],['JYTF05C-SYNC-V18','cycled']]){
  const x=(await db.query("SELECT l.vehicle_id FROM public.f05_3b_sync_lineages l WHERE l.car_code=$1 AND l.source_platform='JYT'",[code])).rows[0];
  assert.ok(x,code);if(target==='wholesale')wholesale=Number(x.vehicle_id);
  if(target==='converted')converted=Number(x.vehicle_id);if(target==='cycled')cycled=Number(x.vehicle_id);
 }
 await db.query("INSERT INTO public.customers(customer_id,account_status,customer_level_id,owner_assignment_state,current_owner_employee_id) VALUES($1,'active',1,'assigned',1),($2,'active',1,'assigned',1)",[customer,otherCustomer]);
});
test.after(async()=>await db.end());
test('G-A01 v19 sealed PG16 independent Customer/Vehicle favorite plus append-only event, old v18 verifier rejects',async()=>{
 const state=await verify(db);assert.equal(state.verified,true);assert.notEqual(state.oldSha,state.newSha);
 await assert.rejects(()=>oldV18Verify(db),/F05_3C_REQUIRED_PRIOR_MIGRATIONS/);
 const rows=(await db.query("SELECT migration_id FROM public.f03_schema_migrations ORDER BY migration_id DESC LIMIT 1")).rows;
 assert.equal(rows[0].migration_id,'000019_favorite_carrier_ci_only');
 for(const table of ['f05_3g_customer_favorites','f05_3g_favorite_events'])
  assert.ok((await db.query("SELECT to_regclass($1) t",['public.'+table])).rows[0].t);
});
test('G-A02 synthetic Customer ADD creates one actual PG16 relation and one immutable APPLIED event, without any CRM side effect',async()=>{
 const before=(await db.query('SELECT count(*)::int n FROM public.recommendations WHERE vehicle_id=$1',[wholesale])).rows[0].n;
 const x=await change(db,p('ADD'));assert.equal(x.code,'F05_3G_APPLIED');assert.equal(x.state,'active');
 assert.deepEqual(await counts(wholesale),{current:1,history:1});
 const row=(await db.query("SELECT customer_id,vehicle_id,state_version,current_state FROM public.f05_3g_customer_favorites WHERE customer_id=$1 AND vehicle_id=$2",[customer,wholesale])).rows[0];
 assert.equal(Number(row.customer_id),customer);assert.equal(Number(row.vehicle_id),wholesale);
 assert.equal(Number(row.state_version),1);assert.equal(row.current_state,'active');
 assert.equal((await db.query('SELECT count(*)::int n FROM public.recommendations WHERE vehicle_id=$1',[wholesale])).rows[0].n,before);
});
test('G-A03 same event replay is idempotent, altered action/Customer/Vehicle hard rejected, different key same ADD records NOOP',async()=>{
 const first=await change(db,p('ADD'));
 assert.equal(first.code,'F05_3G_IDEMPOTENT');
 const bad=await change(db,p('REMOVE'));assert.equal(bad.code,'F05_3G_EVENT_KEY_PAYLOAD_COLLISION');
 assert.equal((await change(db,p('ADD',k('add-one'),otherCustomer))).allowed,false);
 assert.equal((await change(db,p('ADD',k('add-one'),customer,converted))).allowed,false);
 const noop=await change(db,p('ADD',k('another-add')));
 assert.equal(noop.code,'F05_3G_NOOP');
 const reread=await change(db,p('ADD',k('another-add')));
 assert.equal(reread.code,'F05_3G_IDEMPOTENT');assert.equal(reread.outcome,'NOOP');
 assert.deepEqual(await counts(wholesale),{current:1,history:2});
});
test('G-A04 REMOVE, repeated REMOVE, ADD again preserve one current Favorite and all distinct historical events',async()=>{
 assert.equal((await change(db,p('REMOVE',k('remove-one')))).state,'removed');
 assert.equal((await change(db,p('REMOVE',k('remove-twice')))).outcome,'NOOP');
 assert.equal((await change(db,p('ADD',k('add-again')))).state,'active');
 const c=await counts(wholesale);assert.deepEqual(c,{current:1,history:5});
 const row=(await db.query('SELECT current_state,state_version FROM public.f05_3g_customer_favorites WHERE customer_id=$1 AND vehicle_id=$2',[customer,wholesale])).rows[0];
 assert.equal(row.current_state,'active');assert.equal(Number(row.state_version),3);
 const applied=(await db.query("SELECT COUNT(*)::int n FROM public.f05_3g_favorite_events WHERE customer_id=$1 AND vehicle_id=$2 AND outcome='APPLIED'",[customer,wholesale])).rows[0].n;
 assert.equal(applied,3);
});
test('G-A05 two genuine PG16 backend concurrent same target linearize, other backend lock timeout 55P03 before COMMIT',async()=>{
 let release,signal,pid;
 const hold=new Promise(ok=>release=ok),entered=new Promise(ok=>signal=ok);
 const event=k('concurrent-second-customer-add');
 const first=change(db,p('ADD',event,otherCustomer,wholesale),{checkpoint:async(stage,c)=>{
  assert.equal(stage,'favorite_current_row_held');pid=Number((await c.query('SELECT pg_backend_pid() pid')).rows[0].pid);signal();await hold;
 }});
 await Promise.race([entered,first.then(x=>{throw Error('F05_3G_CHECKPOINT_REJECTED_'+JSON.stringify(x))}),
  new Promise((_,bad)=>setTimeout(()=>bad(Error('F05_3G_CHECKPOINT_TIMEOUT')),20000))]);
 const writer=await connect();
 try{
  assert.notEqual(Number((await writer.query('SELECT pg_backend_pid() pid')).rows[0].pid),pid);
  await writer.query('BEGIN');await writer.query("SET LOCAL lock_timeout='300ms'");
  await assert.rejects(()=>writer.query('SELECT pg_advisory_xact_lock(20261012,hashtext($1))',[otherCustomer+':'+wholesale]),e=>e.code==='55P03');
 }finally{await writer.query('ROLLBACK').catch(()=>{});await writer.end();release()}
 assert.equal((await first).code,'F05_3G_APPLIED');
 const pair=await Promise.all([change(db,p('ADD',k('simultaneous-a'),otherCustomer,converted)),
                              change(db,p('ADD',k('simultaneous-b'),otherCustomer,converted))]);
 assert.equal(pair.filter(x=>x.code==='F05_3G_APPLIED').length,1);
 assert.equal(pair.filter(x=>x.code==='F05_3G_NOOP').length,1);
 assert.equal((await db.query('SELECT count(*)::int n FROM public.f05_3g_customer_favorites WHERE customer_id=$1 AND vehicle_id=$2',[otherCustomer,converted])).rows[0].n,1);
});
test('G-A06 inactive Customer hard denied, governance update concurrent with held Customer row cannot commit',async()=>{
 let resume,signal;
 const held=new Promise(ok=>resume=ok),entered=new Promise(ok=>signal=ok);
 const active=change(db,p('REMOVE',k('governance-race-remove'),otherCustomer,wholesale),{checkpoint:async(_,c)=>{signal();await held}});
 await Promise.race([entered,active.then(x=>{throw Error('F05_3G_GOVERNANCE_CHECKPOINT_REJECTED_'+JSON.stringify(x))}),
 new Promise((_,bad)=>setTimeout(()=>bad(Error('F05_3G_GOVERNANCE_TIMEOUT')),20000))]);
 const writer=await connect();
 try{
  await writer.query('BEGIN');await writer.query("SET LOCAL lock_timeout='300ms'");
  await assert.rejects(()=>writer.query("UPDATE public.customers SET account_status='inactive' WHERE customer_id=$1",[otherCustomer]),e=>e.code==='55P03');
 }finally{await writer.query('ROLLBACK').catch(()=>{});await writer.end();resume()}
 assert.equal((await active).code,'F05_3G_APPLIED');
 await db.query("UPDATE public.customers SET account_status='inactive' WHERE customer_id=$1",[otherCustomer]);
 assert.equal((await change(db,p('ADD',k('inactive-must-deny'),otherCustomer,wholesale))).code,'F05_3G_CUSTOMER_NOT_ACTIVE');
 const events=(await db.query('SELECT COUNT(*)::int n FROM public.f05_3g_favorite_events WHERE customer_id=$1 AND vehicle_id=$2',[otherCustomer,wholesale])).rows[0].n;
 assert.equal(events,2);
 await db.query("UPDATE public.customers SET account_status='active' WHERE customer_id=$1",[otherCustomer]);
 assert.equal((await change(db,p('ADD',k('restored-same-identity'),otherCustomer,wholesale))).code,'F05_3G_APPLIED');
});
test('G-A07 incomplete and concurrent failures roll back current + event, immutable ledger and current keys reject tampering',async()=>{
 await assert.rejects(()=>change(db,p('ADD',k('injected-failure'),customer,converted),{injectRollback:true}),/F05_3G_INJECTED_BUSINESS_ROLLBACK/);
 assert.equal((await db.query('SELECT count(*)::int n FROM public.f05_3g_customer_favorites WHERE customer_id=$1 AND vehicle_id=$2',[customer,converted])).rows[0].n,0);
 assert.equal((await db.query('SELECT count(*)::int n FROM public.f05_3g_favorite_events WHERE event_key=$1',[k('injected-failure')])).rows[0].n,0);
 const ev=(await db.query('SELECT event_id FROM public.f05_3g_favorite_events ORDER BY event_id LIMIT 1')).rows[0];
 await assert.rejects(()=>db.query("DELETE FROM public.f05_3g_favorite_events WHERE event_id=$1",[ev.event_id]),/F05_3G_FAVORITE_EVENT_IMMUTABLE/);
 await assert.rejects(()=>db.query("UPDATE public.f05_3g_favorite_events SET outcome='NOOP' WHERE event_id=$1",[ev.event_id]),/F05_3G_FAVORITE_EVENT_IMMUTABLE/);
 await assert.rejects(()=>db.query('DELETE FROM public.f05_3g_customer_favorites WHERE customer_id=$1 AND vehicle_id=$2',[customer,wholesale]),/F05_3G_CURRENT_RELATION_DELETE_DENIED/);
 await assert.rejects(()=>db.query('UPDATE public.f05_3g_customer_favorites SET vehicle_id=$3 WHERE customer_id=$1 AND vehicle_id=$2',[customer,wholesale,converted]),/F05_3G_CURRENT_IDENTITY_IMMUTABLE/);
});
test('G-A08 signed JYT conversion identity, multiple listing cycles and hidden/offline sources do not leak Favorite visibility or price right',async()=>{
 const v=(await db.query("SELECT vehicle_id,source_type,platform_visibility FROM public.vehicles WHERE vehicle_id=$1",[converted])).rows[0];
 assert.equal(v.source_type,'mingbang');assert.equal(v.platform_visibility,'hidden');
 const link=(await db.query('SELECT count(*)::int n FROM public.f05_3c_wholesale_conversions WHERE vehicle_id=$1',[converted])).rows[0].n;
 assert.equal(link,1,'real pre-v19 signed conversion');
 const result=await change(db,p('ADD',k('historically-converted-same-vehicle'),customer,converted));
 assert.equal(result.code,'F05_3G_APPLIED');
 const cols=(await db.query("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='f05_3g_customer_favorites'")).rows.map(x=>x.column_name);
 assert.equal(cols.includes('listing_cycle_id'),false);
 const cycles=(await db.query('SELECT COUNT(*)::int n FROM public.vehicle_listing_cycles WHERE vehicle_id=$1',[cycled])).rows[0].n;
 assert.ok(cycles>=2,'physical old real JYT off/relist has distinct cycles');
 const offline=(await db.query('SELECT source_sale_status FROM public.vehicles WHERE vehicle_id=$1',[cycled])).rows[0].source_sale_status;
 assert.equal(offline,'offline');
 const related=(await db.query("SELECT COUNT(*)::int n FROM public.customer_price_cycle_unlocks WHERE customer_id=$1 AND vehicle_id=$2",[customer,converted])).rows[0].n;
 assert.equal(related,0,'Favorite did not grant a price cycle unlock');
 const before=(await db.query("SELECT count(*)::int n FROM public.recommendations WHERE customer_id=$1 AND vehicle_id=$2",[customer,converted])).rows[0].n;
 assert.equal(before,0,'Favorite did not create a Recommendation');
 const f=(await db.query('SELECT customer_id,vehicle_id,current_state FROM public.f05_3g_customer_favorites WHERE customer_id=$1 AND vehicle_id=$2',[customer,converted])).rows[0];
 assert.equal(f.current_state,'active');
 assert.equal(Number(f.vehicle_id),converted);
});

test('G-A09 TRUE PG16 direct DML bypass cannot COMMIT current INSERT/UPDATE without matching event nor phantom event with mismatched current',async()=>{
 const before=(await db.query("SELECT current_state,state_version FROM public.f05_3g_customer_favorites WHERE customer_id=$1 AND vehicle_id=$2",[customer,wholesale])).rows[0];
 assert.equal(before.current_state,'active');
 // Directly INSERT first active Current without the ADD ledger. The SQL row
 // statement succeeds but the DEFERRABLE constraint must veto COMMIT.
 await db.query('BEGIN');
 try{
  await db.query("INSERT INTO public.f05_3g_customer_favorites(customer_id,vehicle_id,current_state) VALUES($1,$2,'active')",[otherCustomer,cycled]);
  await assert.rejects(()=>db.query('COMMIT'),/F05_3G_CAUSAL_CURRENT_EVENT_MISMATCH/);
 }finally{await db.query('ROLLBACK').catch(()=>{})}
 assert.equal((await db.query('SELECT COUNT(*)::int n FROM public.f05_3g_customer_favorites WHERE customer_id=$1 AND vehicle_id=$2',[otherCustomer,cycled])).rows[0].n,0);
 // Explicit SQL direct UPDATE used in A-F05-3G-01: state/version/time
 // satisfy the old trigger but must fail the NEW DB-level causality.
 await db.query('BEGIN');
 try{
  await db.query("UPDATE public.f05_3g_customer_favorites SET current_state='removed',state_version=state_version+1,changed_at=clock_timestamp() WHERE customer_id=$1 AND vehicle_id=$2",[customer,wholesale]);
  await assert.rejects(()=>db.query('COMMIT'),/F05_3G_CAUSAL_CURRENT_EVENT_MISMATCH/);
 }finally{await db.query('ROLLBACK').catch(()=>{})}
 assert.deepEqual((await db.query('SELECT current_state,state_version FROM public.f05_3g_customer_favorites WHERE customer_id=$1 AND vehicle_id=$2',[customer,wholesale])).rows[0],before);
 // A forged standalone APPLIED event with current version unchanged
 // cannot append phantom cancellation; COMMIT rolls back the fake event.
 const current=(await db.query("SELECT favorite_id,state_version FROM public.f05_3g_customer_favorites WHERE customer_id=$1 AND vehicle_id=$2",[customer,wholesale])).rows[0];
 await db.query('BEGIN');
 try{
  await db.query("INSERT INTO public.f05_3g_favorite_events(favorite_id,customer_id,vehicle_id,event_key,payload_sha256,event_version,action,outcome,before_state,after_state,actor_kind,actor_context,transaction_id) VALUES($1,$2,$3,$4,$5,$6,'REMOVE','APPLIED','active','removed',$7,'{}'::jsonb,txid_current())",
   [current.favorite_id,customer,wholesale,k('forged-standalone-event'),createHash('sha256').update('tampered').digest('hex'),
    Number(current.state_version)+1,ACTOR]);
  await assert.rejects(()=>db.query('COMMIT'),/F05_3G_CAUSAL_CURRENT_EVENT_MISMATCH/);
 }finally{await db.query('ROLLBACK').catch(()=>{})}
 assert.equal((await db.query('SELECT COUNT(*)::int n FROM public.f05_3g_favorite_events WHERE event_key=$1',[k('forged-standalone-event')])).rows[0].n,0);
 assert.equal((await verify(db)).verified,true,'denied direct bypass must not alter sealed schema');
});
test('G-A10 v19 verify rejects real old v18 checksum or old structure hash tampering and any prior ledger record drift',async()=>{
 const before=await verify(db);
 const id='000018_wholesale_mingbang_conversion_ci_only';
 for(const [migration,col,value] of [
  [id,'checksum','0'.repeat(64)],
  [id,'structure_sha256','1'.repeat(64)],
  ['000017_jyt_wholesale_source_ci_only','checksum','2'.repeat(64)]]){
  await db.query('BEGIN');
  try{
   const update=await db.query('UPDATE public.f03_schema_migrations SET '+col+'=$1 WHERE migration_id=$2',[value,migration]);
   assert.equal(update.rowCount,1);
   await assert.rejects(()=>verify(db),/F05_3G_(PRIOR_V18_SIGNED_HISTORY_TAMPERED|FULL_PRIOR_MIGRATION_LEDGER_TAMPERED)/);
  }finally{await db.query('ROLLBACK').catch(()=>{})}
  assert.equal((await verify(db)).newSha,before.newSha);
 }
 await db.query('BEGIN');
 try{
  await db.query('DELETE FROM public.f03_schema_migrations WHERE migration_id=$1',[id]);
  await assert.rejects(()=>verify(db),/F05_3G_(000018_PRIOR_REQUIRED|PRIOR_V18_SIGNED_HISTORY_TAMPERED|FULL_PRIOR_MIGRATION_LEDGER_TAMPERED)/);
 }finally{await db.query('ROLLBACK').catch(()=>{})}
 await assert.rejects(()=>db.query("UPDATE public.f05_3g_migration_attestation SET preceding_records_sha256=$1",['3'.repeat(64)]),/F05_3G_FAVORITE_EVENT_IMMUTABLE/);
 assert.equal((await verify(db)).newSha,before.newSha);
});
