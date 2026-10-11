import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect} from '../../wholesale-to-mingbang-conversion/migration.mjs';
import {catalogScopeSource,checkGeneralWholesaleScope,GAP} from '../audit.mjs';

const db=await connect(),secret=randomBytes(32);
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin:'https://127.0.0.1:48983'});
const ev=s=>'f05-3d-real-pg16-audit-'+s;
let id,cycle,employee,admin,four;
const args=()=>({vehicleId:id,teamId:901,eventKey:ev('unowned-jyt-current-general-scope')});
test.before(async()=>{
 const signed=(await db.query(
  "SELECT l.vehicle_id,l.current_cycle_id FROM public.f05_3b_sync_lineages l "+
  "WHERE l.source_platform='JYT' AND l.car_code='JYTF05C-UNSCOPED'")).rows[0];
 assert.ok(signed);id=Number(signed.vehicle_id);cycle=Number(signed.current_cycle_id);
 for(const [login,password,kind] of [
  ['employee_test','SyntheticF04_3_CurrentProof_2026','employee'],
  ['admin_test','SyntheticAdmin_1234567','admin'],
  ['four_s_test','SyntheticFourS_123456','four']]){
  const out=await auth.login({login,password,source:'f05-3d-genuine-pg16-ownership-audit'});
  assert.equal(out.code,'AUTH_OK');if(kind==='employee')employee=out.token;
  if(kind==='admin')admin=out.token;if(kind==='four')four=out.token;
 }
});
test.after(async()=>{await auth.close();await db.end();secret.fill(0)});

test('D-A01 PG16 certified manual Vehicle steward CHECK excludes JYT wholesale',async()=>{
 const evidence=await catalogScopeSource(db);
 assert.equal(evidence.code,GAP);
 assert.equal(evidence.manualSourceCheckVerified,true);
 assert.equal(evidence.wholesaleLineageHasNoOwner,true);
 assert.ok(evidence.physicalConstraintCount>0);
 const owner=(await db.query(
  "SELECT COUNT(*)::int n FROM public.vehicle_current_responsibilities WHERE vehicle_id=$1 AND listing_cycle_id=$2 AND revoked_at IS NULL",
  [id,cycle])).rows[0];
 assert.equal(owner.n,0);
});

test('D-A02 genuine v17 signed JYT current Vehicle and Cycle without current Lock/Transaction cannot be granted management scope from Team',async()=>{
 const out=await checkGeneralWholesaleScope(auth,employee,args());
 assert.deepEqual(out,{allowed:false,code:GAP});
 const state=(await db.query('SELECT source_type,source_sale_status FROM public.vehicles WHERE vehicle_id=$1',[id])).rows[0];
 assert.equal(state.source_type,'wholesale');assert.equal(state.source_sale_status,'active');
 assert.equal((await db.query('SELECT count(*)::int n FROM public.f05_3c_wholesale_conversions WHERE vehicle_id=$1',[id])).rows[0].n,0);
});

test('D-A03 no synthetic signed wholesale owner may be inserted under frozen provenance CHECK',async()=>{
 await assert.rejects(()=>db.query(
  "INSERT INTO public.vehicle_current_responsibilities(vehicle_id,listing_cycle_id,responsible_employee_id,team_id,source_snapshot,provenance_kind,trusted_event_key,issuer_employee_id) "+
  "VALUES($1,$2,1,901,'wholesale','AUTHORIZED_MANUAL_PUBLICATION',$3,1)",
  [id,cycle,ev('forbidden-fake-wholesale-manual-publication')]),e=>e?.code==='23514');
 assert.equal((await db.query('SELECT count(*)::int n FROM public.vehicle_current_responsibilities WHERE vehicle_id=$1',[id])).rows[0].n,0);
});

test('D-A04 actual SystemAdmin and 4S Sessions, JYT credential and anonymous cannot bypass current Employee rights',async()=>{
 for(const token of ['',admin,four,'mbci_'+'a'.repeat(43)]){
  const out=await checkGeneralWholesaleScope(auth,token,args());
  assert.equal(out.allowed,false);
  assert.notEqual(out.code,'F05_3D_SCOPE_GRANTED');
 }
});

test('D-A05 current permission deny wins even with team membership; restored permission never mints JYT scope',async()=>{
 const update="UPDATE public.employee_permission_overrides SET decision=$1,changed_at=now() "+
  "WHERE employee_id=1 AND permission_id=(SELECT permission_id FROM public.permissions WHERE permission_code='vehicle.manage')";
 await db.query(update,['deny']);
 const denied=await checkGeneralWholesaleScope(auth,employee,args());
 assert.equal(denied.code,'F05_3D_CURRENT_PERMISSION_OR_TEAM_DENIED');
 await db.query(update,['allow']);
 assert.equal((await checkGeneralWholesaleScope(auth,employee,args())).code,GAP);
});

test('D-A06 two actual PG16 backend governance revocation is serialized by actor transaction advisory lock',async()=>{
 let release,ready,firstPid;
 const held=new Promise(resolve=>release=resolve);
 const entered=new Promise(resolve=>ready=resolve);
 const reading=checkGeneralWholesaleScope(auth,employee,args(),{
  checkpoint:async(point,c)=>{
   assert.equal(point,'signed_general_wholesale_scope_unproven');
   firstPid=Number((await c.query('SELECT pg_backend_pid() pid')).rows[0].pid);
   ready();await held;
  }});
 await entered;
 const writer=await connect();
 try{
  assert.notEqual(firstPid,Number((await writer.query('SELECT pg_backend_pid() pid')).rows[0].pid));
  await writer.query('BEGIN');
  await writer.query("SET LOCAL lock_timeout='300ms'");
  await assert.rejects(()=>writer.query(
   "UPDATE public.employee_permission_overrides SET decision='deny',changed_at=now() WHERE employee_id=1 AND permission_id=(SELECT permission_id FROM public.permissions WHERE permission_code='vehicle.manage')"),
   e=>e?.code==='55P03');
 }finally{await writer.query('ROLLBACK').catch(()=>{});await writer.end();release()}
 assert.equal((await reading).code,GAP);
});

test('D-A07 actual other backend cannot offline a source Vehicle during locked trust audit',async()=>{
 let release,ready,firstPid;
 const held=new Promise(resolve=>release=resolve);
 const entered=new Promise(resolve=>ready=resolve);
 const reading=checkGeneralWholesaleScope(auth,employee,args(),{
  checkpoint:async(point,c)=>{
   assert.equal(point,'signed_general_wholesale_scope_unproven');
   firstPid=Number((await c.query('SELECT pg_backend_pid() pid')).rows[0].pid);
   ready();await held;
  }});
 await entered;
 const other=await connect();
 try{
  assert.notEqual(firstPid,Number((await other.query('SELECT pg_backend_pid() pid')).rows[0].pid));
  await other.query('BEGIN');
  await other.query("SET LOCAL lock_timeout='300ms'");
  await assert.rejects(()=>other.query(
   "UPDATE public.vehicles SET source_sale_status='offline' WHERE vehicle_id=$1",[id]),
   e=>e?.code==='55P03');
 }finally{await other.query('ROLLBACK').catch(()=>{});await other.end();release()}
 assert.equal((await reading).code,GAP);
 assert.equal((await db.query('SELECT source_sale_status FROM public.vehicles WHERE vehicle_id=$1',[id])).rows[0].source_sale_status,'active');
});

test('D-A08 validation, absent trusted source and legacy signed positive remain safely segregated',async()=>{
 assert.equal((await checkGeneralWholesaleScope(auth,employee,{...args(),teamId:9999})).allowed,false);
 assert.equal((await checkGeneralWholesaleScope(auth,employee,{...args(),publisherId:1})).allowed,false);
 const unrelated=(await db.query(
  "SELECT count(*)::int n FROM public.f05_3c_wholesale_conversions")).rows[0].n;
 assert.ok(unrelated>=1,'frozen F05-3C positive conversions were run independently');
 assert.equal((await checkGeneralWholesaleScope(auth,employee,args())).code,GAP);
});
