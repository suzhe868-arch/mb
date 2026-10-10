import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect,verify,PREVIOUS} from '../../vehicle-stewardship-physical-scope/migration.mjs';
import {assessFourSMemberAuthority,BLOCKED,publishFourSVehicle,issueFourSResponsibility} from '../source-gate.mjs';
const db=await connect(),secret=randomBytes(32);
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin:'https://127.0.0.1:48983'});
let four,staff,admin;
test.before(async()=>{
 for(const [name,password,slot] of [
  ['four_s_test','SyntheticFourS_123456','four'],
  ['employee_test','SyntheticF04_3_CurrentProof_2026','staff'],
  ['admin_test','SyntheticAdmin_1234567','admin']]){
  const r=await auth.login({login:name,password,source:'f05-3a-real-pg16-source-gap'});
  assert.equal(r.code,'AUTH_OK',JSON.stringify({name,code:r.code}));
  if(slot==='four')four=r.token;else if(slot==='staff')staff=r.token;else admin=r.token;
 }
});
test.after(async()=>{await auth.close();await db.end();secret.fill(0)});
test('G-A01 frozen original M94 physical SHA and F05-2 000015 seal unchanged',async()=>{
 const v=await verify(db);assert.equal(v.verified,true);assert.equal(v.oldSha,PREVIOUS);
 assert.equal((await db.query("SELECT count(*)::int n FROM public.f03_schema_migrations WHERE migration_id='000015_vehicle_current_responsibility_ci_only'")).rows[0].n,1);
});
test('G-A02 actually authenticated four_s employee is NOT a signed partner/object scope',async()=>{
 const q=(await db.query("SELECT e.employee_id,e.store_id,e.employment_status,r.role_code,a.principal_kind,a.credential_state FROM public.employees e JOIN public.roles r ON r.role_id=e.main_role_id JOIN public.pc_login_accounts a ON a.employee_id=e.employee_id WHERE a.normalized_login_key='four_s_test'")).rows[0];
 assert.equal(Number(q.employee_id),2);assert.equal(q.role_code,'four_s');assert.equal(q.employment_status,'active');
 assert.equal(q.principal_kind,'employee');assert.equal(q.credential_state,'enabled');assert.equal(q.store_id,null);
 assert.deepEqual(await assessFourSMemberAuthority(auth,four),{code:BLOCKED,allowed:false});
});
test('G-A03 existing PC 4S manage permission is NOT Vehicle object responsibility',async()=>{
 const p=(await db.query("SELECT p.permission_code,ov.decision FROM public.permissions p JOIN public.employee_permission_overrides ov ON ov.permission_id=p.permission_id WHERE ov.employee_id=2 AND p.permission_code='pc.four_s.vehicle.manage'")).rows[0];
 assert.equal(p.permission_code,'pc.four_s.vehicle.manage');assert.equal(p.decision,'allow');
 const count=(await db.query("SELECT count(*)::int n FROM public.employee_data_scopes WHERE employee_id=2 AND scope_kind='team' AND ended_at IS NULL")).rows[0].n;
 assert.equal(count,0,'no independently signed 4S Vehicle management Team scope');
});
test('G-A04 real frozen physical Vehicle has no trusted dealer publisher FK or independent member grant',async()=>{
 const columns=(await db.query("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='vehicles' ORDER BY ordinal_position")).rows.map(x=>x.column_name);
 assert.ok(columns.includes('created_by_employee_id'));assert.ok(columns.includes('source_type'));
 assert.equal(columns.some(x=>/four_s_member|represented_dealer|partner_identity|source_receipt/.test(x)),false);
 const q=(await db.query("SELECT count(*)::int n FROM public.vehicle_current_responsibilities r JOIN public.employees e ON e.employee_id=r.responsible_employee_id JOIN public.roles role ON role.role_id=e.main_role_id WHERE role.role_code='four_s' AND r.revoked_at IS NULL")).rows[0];
 assert.equal(q.n,0,'no current signed member grant');
});
test('G-A05 Mingbang-uploaded four_s and wholesale are not member publication authority',async()=>{
 const v=(await db.query("SELECT vehicle_id,source_type,created_by_employee_id FROM public.vehicles WHERE vehicle_id IN(49004,49006) ORDER BY vehicle_id")).rows;
 assert.deepEqual(v.map(x=>x.source_type),['four_s','wholesale']);
 assert.equal(Number(v[0].created_by_employee_id),1,'Mingbang uploader never promotes unrelated 4S member');
 assert.equal(await publishFourSVehicle(),Object.freeze({allowed:false,code:BLOCKED}));
 assert.equal(await issueFourSResponsibility(),Object.freeze({allowed:false,code:BLOCKED}));
});
test('G-A06 system_admin, Mingbang sales and no Session do not substitute four_s trusted source',async()=>{
 for(const tok of [admin,staff,''])
  assert.equal((await assessFourSMemberAuthority(auth,tok)).allowed,false);
});
test('G-A07 source gap does not mutate owner, source, audit or migration rows',async()=>{
 const q=await db.query("SELECT (SELECT count(*)::int FROM public.vehicle_current_responsibilities) responsible,(SELECT count(*)::int FROM public.vehicle_responsibility_audit_events) audits,(SELECT count(*)::int FROM public.f03_schema_migrations) migrations");
 assert.deepEqual(await assessFourSMemberAuthority(auth,four),{allowed:false,code:BLOCKED});
 const after=await db.query("SELECT (SELECT count(*)::int FROM public.vehicle_current_responsibilities) responsible,(SELECT count(*)::int FROM public.vehicle_responsibility_audit_events) audits,(SELECT count(*)::int FROM public.f03_schema_migrations) migrations");
 assert.deepEqual(after.rows,q.rows);
});
