import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect} from '../../wholesale-to-mingbang-conversion/migration.mjs';
import {auditCurrentHideCarriers,auditRecalculation,GAP} from '../audit.mjs';
const db=await connect(),secret=randomBytes(32);
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin:'https://127.0.0.1:48983'});
const ev=s=>'f05-3e-real-pg16-hide-reason-'+s;
let vid,cycle,employee,admin,four;
const dto=()=>({vehicleId:vid,teamId:901,eventKey:ev('converted-current-hide-audit')});
test.before(async()=>{
 const line=(await db.query("SELECT l.vehicle_id,l.current_cycle_id FROM public.f05_3b_sync_lineages l WHERE l.car_code='JYTF05C-LOCKED' AND l.source_platform='JYT'")).rows[0];
 assert.ok(line);vid=Number(line.vehicle_id);cycle=Number(line.current_cycle_id);
 for(const [login,password,k] of [
  ['employee_test','SyntheticF04_3_CurrentProof_2026','employee'],
  ['admin_test','SyntheticAdmin_1234567','admin'],
  ['four_s_test','SyntheticFourS_123456','four']]){
  const x=await auth.login({login,password,source:'f05-3e-physical-source-audit'});
  assert.equal(x.code,'AUTH_OK');
  if(k==='employee')employee=x.token;if(k==='admin')admin=x.token;if(k==='four')four=x.token;
 }
});
test.after(async()=>{await auth.close();await db.end();secret.fill(0)});
test('E-A01 physical PG16 hide rule source/conditions and provenance are not signed reason history',async()=>{
 const s=await auditCurrentHideCarriers(db);
 assert.equal(s.allowed,false);assert.equal(s.code,GAP);
 assert.equal(s.currentRuleTable,true);assert.equal(s.ruleColumnsVerified,true);
 assert.equal(s.vehicleReasonFieldsVerified,false);
 assert.equal(s.ruleIssuerOrVersionFieldsVerified,false);
 const current=(await db.query(
  "SELECT source_snapshot FROM public.vehicle_current_responsibilities LIMIT 1")).rows;
 assert.ok(Array.isArray(current));
});
test('E-A02 already converted genuine signed wholesale Vehicle/Cycle remains hidden: audit cannot unhide',async()=>{
 const old=(await db.query(
  "SELECT source_type,source_sale_status,platform_visibility FROM public.vehicles WHERE vehicle_id=$1",[vid])).rows[0];
 assert.deepEqual(old,{source_type:'mingbang',source_sale_status:'available',platform_visibility:'hidden'});
 const c=(await db.query("SELECT count(*)::int n FROM public.vehicle_listing_cycles WHERE vehicle_id=$1",[vid])).rows[0].n;
 assert.equal((await auditRecalculation(auth,employee,dto())).code,GAP);
 assert.deepEqual((await db.query(
  "SELECT source_type,source_sale_status,platform_visibility FROM public.vehicles WHERE vehicle_id=$1",[vid])).rows[0],old);
 assert.equal((await db.query("SELECT count(*)::int n FROM public.vehicle_listing_cycles WHERE vehicle_id=$1",[vid])).rows[0].n,c);
 assert.equal((await db.query("SELECT count(*)::int n FROM public.f05_3c_wholesale_conversions WHERE vehicle_id=$1",[vid])).rows[0].n,1);
});
test('E-A03 raw source scope JSON and rule actor FK cannot attest manual/other hide revocation',async()=>{
 const audit=await auditCurrentHideCarriers(db);
 assert.equal(audit.issuerIsForeignKeyNotAuthenticatedEvent,true);
 const col=(await db.query("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='vehicle_hide_rules' ORDER BY column_name")).rows.map(x=>x.column_name);
 assert.ok(col.includes('conditions_json')&&col.includes('source_scope_json'));
 for(const name of ['reason_id','reason_kind','revoked_at','issued_event_id','version'])
  assert.equal(col.includes(name),false);
});
test('E-A04 two synthetic rule JSON rows do NOT grant signed hide-match or permission to unhide',async()=>{
 // A fixture proves what the *raw* JSON cannot establish; it is not signed
 // current rule governance. No pattern match is claimed from this inserted row.
 await db.query("INSERT INTO public.vehicle_hide_rules(rule_id,conditions_json,source_scope_json,is_enabled,updated_by_employee_id) VALUES(99001,$1::jsonb,$2::jsonb,true,1),(99002,$3::jsonb,$4::jsonb,true,1)",
  [JSON.stringify({brand:['Audi','BMW'],city:['Shenzhen']}),
   JSON.stringify(['wholesale']),JSON.stringify({brand:['Audi'],year:[2026]}),
   JSON.stringify(['mingbang'])]);
 const state=(await db.query('SELECT COUNT(*)::int n FROM public.vehicle_hide_rules WHERE is_enabled=true AND rule_id IN (99001,99002)')).rows[0];
 assert.equal(state.n,2);
 assert.equal((await auditRecalculation(auth,employee,dto())).code,GAP);
 assert.equal((await db.query('SELECT platform_visibility FROM public.vehicles WHERE vehicle_id=$1',[vid])).rows[0].platform_visibility,'hidden');
});
test('E-A05 employee deny still blocks audit even though Team exists, restoration never mints hide clearance',async()=>{
 const q="UPDATE public.employee_permission_overrides SET decision=$1,changed_at=now() WHERE employee_id=1 AND permission_id=(SELECT permission_id FROM public.permissions WHERE permission_code='vehicle.manage')";
 await db.query(q,['deny']);
 assert.equal((await auditRecalculation(auth,employee,dto())).code,'F05_3E_PERMISSION_OR_TEAM_DENIED');
 await db.query(q,['allow']);
 assert.equal((await auditRecalculation(auth,employee,dto())).code,GAP);
});
test('E-A06 two distinct PG16 backends: concurrent rule disable collides with real audit FOR SHARE 55P03',async()=>{
 let release,notify,pid;
 const pending=new Promise(res=>release=res),entered=new Promise(res=>notify=res);
 const audit=auditRecalculation(auth,employee,dto(),{checkpoint:async(label,c)=>{
  assert.equal(label,'source_and_rules_physically_locked');
  pid=Number((await c.query('SELECT pg_backend_pid() pid')).rows[0].pid);notify();await pending;
 }});
 await entered;
 const other=await connect();
 try{
  assert.notEqual(Number((await other.query('SELECT pg_backend_pid() pid')).rows[0].pid),pid);
  await other.query('BEGIN');
  await other.query("SET LOCAL lock_timeout='300ms'");
  await assert.rejects(()=>other.query('UPDATE public.vehicle_hide_rules SET is_enabled=false WHERE rule_id=99001'),e=>e?.code==='55P03');
 }finally{await other.query('ROLLBACK').catch(()=>{});await other.end();release()}
 assert.equal((await audit).code,GAP);
 assert.equal((await db.query('SELECT is_enabled FROM public.vehicle_hide_rules WHERE rule_id=99001')).rows[0].is_enabled,true);
});
test('E-A07 two distinct PG16 backends: Vehicle source/visibility change cannot race audit transaction COMMIT',async()=>{
 let release,notify,pid;
 const pending=new Promise(res=>release=res),entered=new Promise(res=>notify=res);
 const audit=auditRecalculation(auth,employee,dto(),{checkpoint:async(label,c)=>{
  assert.equal(label,'source_and_rules_physically_locked');
  pid=Number((await c.query('SELECT pg_backend_pid() pid')).rows[0].pid);notify();await pending;
 }});
 await entered;
 const other=await connect();
 try{
  assert.notEqual(Number((await other.query('SELECT pg_backend_pid() pid')).rows[0].pid),pid);
  await other.query('BEGIN');
  await other.query("SET LOCAL lock_timeout='300ms'");
  await assert.rejects(()=>other.query("UPDATE public.vehicles SET platform_visibility='visible' WHERE vehicle_id=$1",[vid]),e=>e?.code==='55P03');
 }finally{await other.query('ROLLBACK').catch(()=>{});await other.end();release()}
 assert.equal((await audit).code,GAP);
 assert.equal((await db.query('SELECT platform_visibility FROM public.vehicles WHERE vehicle_id=$1',[vid])).rows[0].platform_visibility,'hidden');
});
test('E-A08 SystemAdmin, 4S, anonymous/JYT and forged rule payload never permit manual unhide',async()=>{
 for(const token of [admin,four,'','mbci_'+'a'.repeat(43)]){
  const res=await auditRecalculation(auth,token,dto());assert.equal(res.allowed,false);
 }
 assert.equal((await auditRecalculation(auth,employee,{...dto(),publisherId:1})).allowed,false);
 assert.equal((await auditRecalculation(auth,employee,{...dto(),teamId:9999})).allowed,false);
 assert.equal((await auditRecalculation(auth,employee,dto())).code,GAP);
 assert.equal((await db.query('SELECT platform_visibility FROM public.vehicles WHERE vehicle_id=$1',[vid])).rows[0].platform_visibility,'hidden');
});
