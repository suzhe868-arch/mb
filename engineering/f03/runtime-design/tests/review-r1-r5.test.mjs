// A independent first-review R1-R5 probes; synthetic state & archived SQL only.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {evaluate,govern,contextOf} from '../model.mjs';
import {makeFixture,req} from './fixture.mjs';
import {physicalTables,verifyPhysicalClaims} from '../physical-claims.mjs';
const originalSql=await readFile(new URL('../../../f03-1/evidence/pg16_schema_only.sql',import.meta.url),'utf8');
const originalClaims=await readFile(new URL('../schema-physical-claims.tsv',import.meta.url),'utf8');
const permitted=x=>assert.equal(x.allowed,true,JSON.stringify(x));
const denied=(x,why)=>{assert.equal(x.allowed,false,JSON.stringify(x));if(why)assert.equal(x.reason,why)};
const gov=(action,targetId,sessionRef='4',observedVersion=0,extra={})=>({action,targetId,sessionRef,observedVersion,...extra});
const pid=(s,key)=>s.permissions.find(x=>x.permission_code===key)?.permission_id;
const now='2026-10-09T02:00:00.000Z';
test('R1: actual accepted SQL contains role_default_permission_history with seven physical columns, SG-09 REUSE',()=>{
 const known=verifyPhysicalClaims(originalSql,originalClaims);
 const expected=['event_id','role_id','permission_id','enabled','actor_kind','actor_id','occurred_at'];
 for(const x of expected)assert.ok(known.get('role_default_permission_history')?.has(x),'physical column missing: '+x);
 assert.equal(known.has('role_permission_default_history'),false);
});
test('R1: inverted missing/existing table declarations or missing existing field are rejected',()=>{
 assert.throws(()=>verifyPhysicalClaims(originalSql,originalClaims.replace('SG-09\tEXISTING_REUSE','SG-09\tMISSING_PROPOSAL')),/MISSING_CLAIM|TEMPLATE_HISTORY_MUST_REUSE|ALREADY_EXISTS_NOT_GAP/);
 assert.throws(()=>verifyPhysicalClaims(originalSql,originalClaims.replace('SG-01\tMISSING_PROPOSAL','SG-01\tEXISTING_REUSE')),/CLAIM_EXISTING_TABLE_MISSING/);
 assert.throws(()=>verifyPhysicalClaims(originalSql,originalClaims.replace('event_id,role_id,permission_id,enabled,actor_kind,actor_id,occurred_at','event_id,role_id,permission_id,enabled,actor_kind,actor_id,fabricated_at')),/CLAIM_EXISTING_COLUMN_MISSING/);
});
test('R2: manager and store-manager cannot edit template despite injected trusted governance grants',()=>{
 const s=makeFixture();
 for(const [actorId,session,role] of [['102','2','manager'],['104','6','store_manager']]){
  s.governanceGrants.push({kind:'employee',actor_id:actorId,store_id:'10',team_confirmed:true,team_scope_verified:true,action:'template.set',active:true});
  const out=govern(s,gov('template.set','101',session,0,{roleId:'1',permissionId:'1',enabled:false}));
  denied(out.result,'GOVERNANCE_SCOPE_DENIED');
  assert.equal(out.state,s);assert.equal(s.defaults[0].enabled,true);assert.equal(s.audit.length,0);assert.equal(s.roleDefaultHistory.length,0);
 }
 const ok=govern(s,gov('template.set','101','4',0,{roleId:'1',permissionId:'1',enabled:false}));
 permitted(ok.result);assert.equal(ok.state.defaults[0].enabled,false);
 assert.equal(ok.state.roleDefaultHistory.length,1);
 assert.deepEqual(Object.keys(ok.state.roleDefaultHistory[0]).sort(),['actor_id','actor_kind','enabled','occurred_at','permission_id','role_id'].sort());
 assert.equal(ok.state.roleDefaultHistory[0].actor_kind,'system_admin');
 assert.deepEqual(ok.state.audit[0].before,{role_id:'1',permission_id:'1',enabled:true});
 assert.deepEqual(ok.state.audit[0].after,{role_id:'1',permission_id:'1',enabled:false});
});
test('R2: manager legitimate employee override management and store manager own-store scope preserved',()=>{
 const s=makeFixture();
 permitted(govern(s,gov('override.set','101','2',0,{permissionId:'2',decision:'deny'})).result);
 permitted(govern(s,gov('override.set','101','6',0,{permissionId:'2',decision:'deny'})).result);
 denied(govern(s,gov('override.set','104','6',0,{permissionId:'2',decision:'allow'})).result);
});
test('R3: planned disable of sole eligible receiver is forbidden even with empty handover requirements',()=>{
 const s=makeFixture();s.employees.find(x=>x.employee_id==='102').receiving_status='paused';s.responsibilities=[];
 const bad=govern(s,gov('employee.planned_disable','101'));
 denied(bad.result,'LAST_ELIGIBLE_RECEIVER_PROTECTED');
 assert.equal(bad.state.employees[0].employment_status,'active');assert.equal(bad.state.employees[0].receiving_status,'accepting');
 assert.equal(s.audit.length,0);
});
test('R3: fake eligible 4S employee never counts toward receiving pool protection',()=>{
 const s=makeFixture();s.employees[1].receiving_status='paused';
 s.employees[2].receiving_status='accepting';
 s.eligibilityProofs.push({employee_id:'103',eligible:true,trusted:true});
 denied(govern(s,gov('employee.planned_disable','101')).result,'LAST_ELIGIBLE_RECEIVER_PROTECTED');
 denied(govern(s,gov('receiving.on','103','3')).result); // no valid 4S employee governance
});
test('R3: two eligible can reduce to one, but second simultaneous stale or fresh attempt cannot empty',()=>{
 const s=makeFixture();const a=govern(s,gov('employee.planned_disable','101','4',0));permitted(a.result);
 denied(govern(a.state,gov('employee.planned_disable','102','4',0)).result,'COMMIT_RECHECK_STALE');
 denied(govern(a.state,gov('employee.planned_disable','102','4',1)).result,'LAST_ELIGIBLE_RECEIVER_PROTECTED');
 assert.equal(a.state.employees[1].receiving_status,'accepting');
 const off=govern(s,gov('receiving.off','101','1',0));permitted(off.result);
 denied(govern(off.state,gov('receiving.off','102','2',1)).result,'LAST_ELIGIBLE_RECEIVER_PROTECTED');
});
test('R3: sudden inactive revokes even sole eligible receiver and sets abnormal assignment pending',()=>{
 const s=makeFixture();s.employees[1].receiving_status='paused';
 const after=govern(s,gov('employee.sudden_inactive','101'));permitted(after.result);
 assert.equal(after.state.ownerAssignmentPending,true);
 assert.equal(after.state.employees[0].employment_status,'inactive');
 assert.equal(after.state.sessions[0].revoked,true);
 denied(evaluate(after.state,req('customer.crm.read','1','customer','301')));
});
test('R4: 4S valid explicit current personal allow admits old session only to own legal vehicle',()=>{
 const s=makeFixture();
 assert.equal(contextOf(s,'3')?.role,'four_s');
 permitted(evaluate(s,req('vehicle.read','3','vehicle','402')));
 permitted(evaluate(s,req('vehicle.pc_manage_4s','3','vehicle','402')));
 denied(evaluate(s,req('vehicle.read','3','vehicle','401')),'FOUR_S_OWN_VEHICLE_ONLY');
 s.defaults.find(x=>x.role_id==='3'&&x.permission_id===pid(s,'pc.four_s.vehicle.manage')).enabled=false;
 permitted(evaluate(s,req('vehicle.read','3','vehicle','402'))); // entry determined by current personal allow, not template
});
test('R4: old normal 4S session is denied for every PC business action after personal deny or revoke',()=>{
 const s=makeFixture();
 const grant=s.overrides.find(x=>x.employee_id==='103'&&x.permission_id===pid(s,'pc.four_s.vehicle.manage'));
 assert.ok(grant);
 s.defaults.find(x=>x.role_id==='3'&&x.permission_id===pid(s,'pc.four_s.vehicle.manage')).enabled=false;
 grant.decision='deny';
 for(const op of ['vehicle.read','vehicle.edit','vehicle.pc_manage_4s'])denied(evaluate(s,req(op,'3','vehicle','402')),'CURRENT_SESSION_OR_ACCOUNT_DENIED');
 assert.equal(contextOf(s,'3'),null);
 grant.decision='allow';permitted(evaluate(s,req('vehicle.read','3','vehicle','402')));
 s.overrides=s.overrides.filter(x=>x!==grant);
 s.overrideHistory.push({employee_id:'103',permission_id:pid(s,'pc.four_s.vehicle.manage'),decision:'allow',occurred_at:now});
 denied(evaluate(s,req('vehicle.read','3','vehicle','402')),'CURRENT_SESSION_OR_ACCOUNT_DENIED');
});
test('R5: personal new, update, and revoke audits contain true narrow old/new decision values and immutable actor snapshot',()=>{
 let s=makeFixture();const command=(action,decision,version)=>gov(action,'101','2',version,{permissionId:pid(s,'crm.customer.view'),...(decision?{decision}:{})});
 const first=govern(s,command('override.set','deny',0));permitted(first.result);s=first.state;
 assert.equal(s.audit.length,1);
 assert.equal(s.audit[0].before,null);
 assert.deepEqual(s.audit[0].after,{employee_id:'101',permission_id:'2',decision:'deny'});
 assert.equal(s.audit[0].actor_kind,'employee');assert.equal(s.audit[0].actor_id,'102');
 assert.equal(s.audit[0].role_at_time,'manager');assert.equal(s.audit[0].store_at_time,'10');
 assert.equal(s.audit[0].occurred_at,now);
 const firstAudit=structuredClone(s.audit[0]);
 s.employees.find(e=>e.employee_id==='102').store_id='11'; // synthetic later state change cannot rewrite historical snapshot
 assert.deepEqual(s.audit[0],firstAudit);
 s.employees.find(e=>e.employee_id==='102').store_id='10';
 s=govern(s,command('override.set','allow',1)).state;
 assert.deepEqual(s.audit[1].before,{employee_id:'101',permission_id:'2',decision:'deny'});
 assert.deepEqual(s.audit[1].after,{employee_id:'101',permission_id:'2',decision:'allow'});
 const revoked=govern(s,command('override.revoke',null,2));permitted(revoked.result);
 assert.deepEqual(revoked.state.audit[2].before,{employee_id:'101',permission_id:'2',decision:'allow'});
 assert.deepEqual(revoked.state.audit[2].after,{employee_id:'101',permission_id:'2',decision:null});
 assert.equal(revoked.state.overrideHistory.at(-1).decision,'revoked');
});
test('R5: template audit history and audit failure are all-or-nothing',()=>{
 const s=makeFixture(),cmd=gov('template.set','101','4',0,{roleId:'1',permissionId:'1',enabled:false});
 const bad=govern(s,{...cmd,simulateAuditFailure:true});denied(bad.result,'ATOMIC_AUDIT_FAILURE');
 assert.equal(bad.state,s);assert.equal(s.roleDefaultHistory.length,0);assert.equal(s.audit.length,0);assert.equal(s.defaults[0].enabled,true);
 const ok=govern(s,cmd);permitted(ok.result);assert.equal(ok.state.roleDefaultHistory.length,1);
 assert.equal(ok.state.audit[0].before.enabled,true);assert.equal(ok.state.audit[0].after.enabled,false);
});
test('R5: admin account/credential status, employee off/transfer, scope end, and handover audit exact minimal values',()=>{
 {
  const s=makeFixture(),v=govern(s,gov('admin.disable','201'));permitted(v.result);
  assert.deepEqual(v.state.audit[0].before,{system_admin_id:'201',account_status:'active'});
  assert.deepEqual(v.state.audit[0].after,{system_admin_id:'201',account_status:'inactive'});
 }
 {
  const s=makeFixture(),v=govern(s,gov('credential.disable','201'));permitted(v.result);
  assert.deepEqual(v.state.audit[0].before,{system_admin_id:'201',credential_state:'enabled'});
  assert.deepEqual(v.state.audit[0].after,{system_admin_id:'201',credential_state:'disabled'});
 }
 {
  const s=makeFixture(),v=govern(s,gov('employee.transfer','101','4',0,{newStoreId:'11'}));permitted(v.result);
  assert.equal(v.state.audit[0].before.store_id,'10');assert.equal(v.state.audit[0].after.store_id,'11');
  assert.equal(v.state.audit[0].after.revoked_session_count,1);
 }
 {
  const s=makeFixture(),v=govern(s,gov('scope.end','1'));permitted(v.result);
  assert.equal(v.state.audit[0].before.ended_at,null);assert.equal(v.state.audit[0].after.ended_at,now);
 }
 {
  const s=makeFixture();s.handoverItems=[{object_kind:'customer',object_id:'301',state:'pending',trusted:false}];
  const v=govern(s,gov('handover.item','301','4',0,{objectKind:'customer',syntheticDomainSuccess:true}));permitted(v.result);
  assert.equal(v.state.audit[0].before.state,'pending');assert.equal(v.state.audit[0].after.state,'completed');
 }
});
test('R5: no secret-bearing untrusted record fields are spread into audit, and failed item preserves committed previous item',()=>{
 const s=makeFixture();s.employees[0].password_hash='SECRET_HASH_NEVER_LOG';s.employees[0].token='SECRET_TOKEN_NEVER_LOG';
 s.employees[0].private_phone='SECRET_PHONE_NEVER_LOG';
 const ok=govern(s,gov('employee.transfer','101','4',0,{newStoreId:'11'}));permitted(ok.result);
 assert.doesNotMatch(JSON.stringify(ok.state.audit),/SECRET_HASH|SECRET_TOKEN|SECRET_PHONE|COMMITTED_REDACTED/);
 const h=makeFixture();h.handoverItems=[{object_kind:'customer',object_id:'301',state:'pending'},{object_kind:'demand',object_id:'302',state:'pending'}];
 const a=govern(h,gov('handover.item','301','4',0,{objectKind:'customer',syntheticDomainSuccess:true}));permitted(a.result);
 const b=govern(a.state,gov('handover.item','302','4',1,{objectKind:'demand',syntheticDomainSuccess:false}));
 denied(b.result,'DOMAIN_UNIT_FAILED');assert.equal(b.state.audit.length,1);
 assert.equal(b.state.handoverItems[0].state,'completed');assert.equal(b.state.handoverItems[1].state,'pending');
});
