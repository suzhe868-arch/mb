import {test} from 'node:test';
import assert from 'node:assert/strict';
import {evaluate,scopeProof,govern,bootstrapPlan,contextOf} from '../model.mjs';
import {makeFixture,req} from './fixture.mjs';
const pass=r=>assert.equal(r.allowed,true,JSON.stringify(r));
const deny=(r,reason)=>{assert.equal(r.allowed,false,JSON.stringify(r));if(reason)assert.equal(r.reason,reason)};
const p=(s,code)=>s.permissions.find(x=>x.permission_code===code).permission_id;
const readCustomer=()=>req('customer.crm.read','1','customer','301');
const readVehicle=()=>req('vehicle.read','1','vehicle','401');
const gov=(action,targetId,sessionRef='4',observedVersion=0,extra={})=>({action,targetId,sessionRef,observedVersion,...extra});
test('G0-02 current template changes: gain/removal; personal allow exception, personal deny, hard deny precedence',()=>{
 const s=makeFixture();const q=readCustomer();
 pass(evaluate(s,q));
 s.defaults.find(x=>x.permission_id===p(s,'crm.customer.view')&&x.role_id==='1').enabled=false;
 deny(evaluate(s,q),'NO_CURRENT_PERMISSION');
 s.overrides.push({employee_id:'101',permission_id:p(s,'crm.customer.view'),decision:'allow'});
 pass(evaluate(s,q));
 s.overrides.find(x=>x.employee_id==='101'&&x.permission_id===p(s,'crm.customer.view')).decision='deny';deny(evaluate(s,q),'PERSONAL_DENY');
 s.overrides.find(x=>x.employee_id==='101'&&x.permission_id===p(s,'crm.customer.view')).decision='allow';s.hardDeniedCapabilities.push('crm.customer.view');deny(evaluate(s,q),'HARD_DENY_CAPABILITY');
 s.hardDeniedCapabilities=[];s.approvedOperationMappings['customer.crm.read']=false;deny(evaluate(s,q),'TECH_ALIAS_PENDING_A');
});
test('G0-03 old same session sees scope ended, changed store, inactivity, epoch reset, return no resurrection',()=>{
 const s=makeFixture(),q=readCustomer();
 pass(evaluate(s,q));s.scopes[0].ended_at='2026-10-09T02:00:00.000Z';deny(evaluate(s,q),'CAPABILITY_SCOPE_DEFER_DENY');
 s.scopes[0].ended_at='2030-01-01T00:00:00Z';pass(evaluate(s,q));
 s.employees[0].employment_status='inactive';deny(evaluate(s,q),'CURRENT_SESSION_OR_ACCOUNT_DENIED');
 s.employees[0].employment_status='active';pass(evaluate(s,q));s.accounts[0].credential_epoch='2';deny(evaluate(s,q));
 s.accounts[0].credential_epoch='1';s.employees[0].store_id='11';deny(evaluate(s,readVehicle()),'CAPABILITY_SCOPE_DEFER_DENY');
 s.sessions[0].revoked=true;deny(evaluate(s,q));
});
test('G0-04 no client actor, global grants, spoofed owner/team, unrelated resource ID or unsafe JS IDs',()=>{
 const s=makeFixture(),q=readCustomer();pass(evaluate(s,q));
 for(const added of [{actor:{id:'101'}},{scopeGrants:[]},{teamId:'10'},{global:true},{ownerId:'101'},{governanceApproved:true},{handoverComplete:true},{eligible:true}])
  deny(evaluate(s,{...q,...added}),'UNTRUSTED_REQUEST_FACTS');
 deny(evaluate(s,{...q,objectId:'999'}),'CURRENT_OBJECT_NOT_PROVEN');
 deny(evaluate(s,{...q,objectId:Number.MAX_SAFE_INTEGER+123}));
 s.objects[0].current_owner_employee_id='102';deny(evaluate(s,q),'CAPABILITY_SCOPE_DEFER_DENY');
 s.objects[0].current_owner_employee_id='101';s.scopes[0].scope_kind='team';deny(evaluate(s,q));
 s.scopes[0].scope_kind='global';s.scopes[0].scope_reference_id=null;deny(evaluate(s,q),'CAPABILITY_SCOPE_DEFER_DENY');
});
test('G0-04 each capability requires an independently supported scope; no fallback from other cap',()=>{
 const s=makeFixture(),q=req('vehicle.internal_wholesale_price.edit','1','vehicle','401');
 pass(evaluate(s,q));s.capabilityScopeProofs=s.capabilityScopeProofs.filter(z=>z.permission_code!=='internal.price.view');
 deny(evaluate(s,q),'CAPABILITY_SCOPE_DEFER_DENY');
 s.capabilityScopeProofs.push({employee_id:'101',scope_id:'1',permission_code:'internal.price.view'});
 deny(evaluate(s,q),'CAPABILITY_SCOPE_DEFER_DENY');
});
test('G0-05 4S only own active uploaded vehicle, not internal price, even high overrides; PC access is separate',()=>{
 const s=makeFixture();
 pass(evaluate(s,req('vehicle.read','3','vehicle','402')));
 pass(evaluate(s,req('vehicle.pc_manage_4s','3','vehicle','402')));
 deny(evaluate(s,req('vehicle.read','3','vehicle','401')),'FOUR_S_OWN_VEHICLE_ONLY');
 s.defaults.push({role_id:'3',permission_id:p(s,'internal.price.view'),enabled:true});
 s.capabilityScopeProofs.push({employee_id:'103',scope_id:'3',permission_code:'internal.price.view'});
 deny(evaluate(s,req('vehicle.internal_wholesale_price.read','3','vehicle','402')),'HARD_DENY_FOUR_S');
 s.accounts[2].credential_state='disabled';deny(evaluate(s,req('vehicle.read','3','vehicle','402')));
});
test('G0-05 independent admin cannot use CRM/vehicle; synthetic explicit control target exception possible',()=>{
 const s=makeFixture();
 deny(evaluate(s,req('customer.crm.read','4','customer','301')),'SYSTEM_ADMIN_NO_BUSINESS_RIGHT');
 pass(evaluate(s,req('system.employee.manage','4','employee','101')));
 deny(evaluate(s,req('system.employee.manage','5','employee','101')),'SYSTEM_CONTROL_SCOPE_NOT_PROVEN');
 deny(evaluate(s,req('system.employee.manage','1','employee','101')),'EMPLOYEE_NO_SYSTEM_CONTROL');
 s.accounts[3].principal_kind='employee';deny(evaluate(s,req('system.employee.manage','4','employee','101')));
});
test('G0-01 unsupported operation / unmapped alias / missing physical permission / missing scope deny',()=>{
 const s=makeFixture();
 deny(evaluate(s,req('customer.quota.add','1','customer','301')),'UNKNOWN_OR_DEFERRED_OPERATION');
 s.approvedOperationMappings['vehicle.read']=false;deny(evaluate(s,readVehicle()),'TECH_ALIAS_PENDING_A');
 s.approvedOperationMappings['vehicle.read']=true;
 s.permissions=s.permissions.filter(x=>x.permission_code!=='vehicle.read');deny(evaluate(s,readVehicle()),'UNKNOWN_PERSISTED_PERMISSION');
});
test('G0-06 employee receiving self need not manager grant; normal last eligible must survive',()=>{
 const s=makeFixture();
 const self=gov('receiving.off','101','1',0);
 const done=govern(s,self);pass(done.result);
 deny(govern(done.state,gov('receiving.off','102','2',1)).result,'LAST_ELIGIBLE_RECEIVER_PROTECTED');
 assert.equal(done.state.employees[0].receiving_status,'paused');
 assert.equal(s.employees[0].receiving_status,'accepting','pure fixture mutation should return copy');
});
test('G0-06 ordinary sales cannot govern others, manager needs team evidence, store manager same store only',()=>{
 const s=makeFixture();
 deny(govern(s,gov('override.set','102','1',0,{permissionId:p(s,'vehicle.manage'),decision:'allow'})).result,'GOVERNANCE_SCOPE_DENIED');
 const m=gov('override.set','101','2',0,{permissionId:p(s,'vehicle.manage'),decision:'deny'});
 pass(govern(s,m).result);
 s.governanceGrants.find(x=>x.kind==='employee'&&x.actor_id==='102'&&x.action==='override.set').team_scope_verified=false;
 deny(govern(s,m).result,'GOVERNANCE_SCOPE_DENIED');
 pass(govern(s,gov('override.set','101','6',0,{permissionId:p(s,'vehicle.manage'),decision:'deny'})).result);
 deny(govern(s,gov('override.set','104','6',0,{permissionId:p(s,'vehicle.manage'),decision:'allow'})).result);
});
test('G0-06 prevents self-grant, 4S staff governance, and bypass via request forged actor',()=>{
 const s=makeFixture();
 deny(govern(s,gov('override.set','101','1',0,{permissionId:'1',decision:'allow'})).result);
 deny(govern(s,gov('override.set','103','3',0,{permissionId:'1',decision:'allow'})).result);
 deny(govern(s,{...gov('override.set','101','2',0),actor:{kind:'system_admin'}}).result,'UNTRUSTED_GOVERNANCE');
});
test('G0-07 admin effective-pool optimistic prepare/commit and last-admin protection',()=>{
 const s=makeFixture();
 // Both synthetic admins are explicitly granted this control action; race must
 // reach the COMMIT serialization gate, not fail earlier on missing actor scope.
 s.governanceGrants.push({kind:'system_admin',actor_id:'202',action:'admin.disable',active:true});
 const command=gov('admin.disable','201');
 const a=govern(s,command);pass(a.result);
 deny(govern(a.state,gov('admin.disable','202','5',0)).result,'COMMIT_RECHECK_STALE');
 deny(govern(a.state,gov('admin.disable','202','5',1)).result,'LAST_EFFECTIVE_ADMIN_PROTECTED');
 // The second current admin has no grant as fixture, so use 201 actor with fresh
 // session denial: an already disabled actor may no longer govern.
 deny(govern(a.state,gov('admin.disable','202','4',1)).result);
 const protectedPool=makeFixture();protectedPool.accounts[4].credential_state='disabled';
 deny(govern(protectedPool,gov('admin.disable','201')).result,'LAST_EFFECTIVE_ADMIN_PROTECTED');
 const newly=govern(s,gov('admin.create','203'));pass(newly.result);
 deny(govern(newly.state,gov('admin.create','204')).result,'COMMIT_RECHECK_STALE');
});
test('G0-07 bootstrap once; disabled all existing cannot reopen installer bootstrap',()=>{
 const s=makeFixture();
 deny(bootstrapPlan(s,{observedVersion:0,syntheticInstallerAuthority:true}).result,'BOOTSTRAP_REFUSED');
 const fresh=makeFixture();fresh.systemAdmins=[];fresh.bootstrapEver=false;
 const first=bootstrapPlan(fresh,{observedVersion:0,syntheticInstallerAuthority:true});pass(first.result);
 deny(bootstrapPlan(first.state,{observedVersion:1,syntheticInstallerAuthority:true}).result,'BOOTSTRAP_REFUSED');
});
test('G0-08 planned transfer requires actual trusted completed per-object handover, not boolean',()=>{
 const s=makeFixture();
 s.responsibilities=[{employee_id:'101',object_kind:'customer',object_id:'301',active:true}];
 s.handoverItems=[{object_kind:'customer',object_id:'301',state:'pending',trusted:false}];
 const q=gov('employee.transfer','101','4',0,{newStoreId:'11'});
 deny(govern(s,q).result,'HANDOVER_REQUIRED');
 s.handoverItems[0].state='completed';s.handoverItems[0].trusted=true;
 const changed=govern(s,q);pass(changed.result);
 assert.equal(changed.state.employees[0].store_id,'11');
 assert.equal(changed.state.sessions[0].revoked,true);
});
test('G0-08 sudden inactive removes rights before handover, pool empty creates pending; rehire does not restore old',()=>{
 const s=makeFixture();s.employees[1].receiving_status='paused';s.employees[0].receiving_status='accepting';
 s.overrides.push({employee_id:'101',permission_id:'1',decision:'allow'});
 const x=govern(s,gov('employee.sudden_inactive','101'));pass(x.result);
 assert.equal(x.state.ownerAssignmentPending,true);deny(evaluate(x.state,readCustomer()));
 const actor=(x.state.governanceGrants||[]).find(y=>y.actor_id==='201');assert.ok(actor);
 const back=govern(x.state,gov('employee.rehire','101','4',1));pass(back.result);
 assert.equal(back.state.employees[0].receiving_status,'paused');
 assert.equal(back.state.overrides.filter(x=>x.employee_id==='101').length,0);
 assert.equal(back.state.sessions[0].revoked,true);
});
test('G0-09 audit failure is all-or-nothing; retry makes one current mutation and audit',()=>{
 const s=makeFixture(),command=gov('override.set','101','2',0,{decision:'deny',permissionId:p(s,'crm.customer.view')});
 const failed=govern(s,{...command,simulateAuditFailure:true});deny(failed.result,'ATOMIC_AUDIT_FAILURE');
 assert.deepEqual(failed.state,s);const good=govern(failed.state,command);pass(good.result);
 assert.equal(good.state.overrides.filter(x=>x.employee_id==='101').length,1);assert.equal(good.state.overrideHistory.length,1);assert.equal(good.state.audit.length,1);
 deny(govern(good.state,command).result,'COMMIT_RECHECK_STALE');
});
test('G0-09 batch handover preserves successes and retries only failed item, each atomic',()=>{
 let s=makeFixture();s.handoverItems=[{object_kind:'customer',object_id:'301',state:'pending'},{object_kind:'demand',object_id:'302',state:'pending'}];
 const ok=govern(s,gov('handover.item','301','4',0,{objectKind:'customer',syntheticDomainSuccess:true}));pass(ok.result);s=ok.state;
 const fail=govern(s,gov('handover.item','302','4',1,{objectKind:'demand',syntheticDomainSuccess:false}));deny(fail.result,'DOMAIN_UNIT_FAILED');
 assert.equal(fail.state.handoverItems[0].state,'completed');assert.equal(fail.state.handoverItems[1].state,'pending');
 const retry=govern(fail.state,gov('handover.item','302','4',1,{objectKind:'demand',syntheticDomainSuccess:true}));pass(retry.result);
 assert.equal(retry.state.handoverItems.filter(x=>x.state==='completed').length,2);
});
test('G0-07/G0-09 scope grant ending and template writes require authorized actor and atomic audit',()=>{
 const s=makeFixture();
 const q=gov('scope.end','1','4');const out=govern(s,q);pass(out.result);
 deny(evaluate(out.state,readCustomer()),'CAPABILITY_SCOPE_DEFER_DENY');
 deny(govern(out.state,gov('template.set','1','1',0,{roleId:'1',permissionId:'1',enabled:false})).result);
});
test('G0-11 lack eligible proof, handover batch, unknown scopes, or missing role field remains DENY',()=>{
 const s=makeFixture();s.eligibilityProofs=[];
 deny(govern(s,gov('receiving.on','101','1')).result,'ELIGIBILITY_DEFER_DENY');
 s.responsibilities=null;deny(govern(s,gov('employee.transfer','101','4',0,{newStoreId:'11'})).result,'RESPONSIBILITY_FACTS_MISSING');
 s.roles=[];deny(evaluate(s,readCustomer()));
});
