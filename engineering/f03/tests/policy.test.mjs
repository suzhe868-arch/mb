import {test} from 'node:test';
import assert from 'node:assert/strict';
import {authorize,ACTIONS,projectRecord} from '../policy.mjs';
const employee=(role='sales')=>({kind:'employee',id:11,status:'active',role,storeId:4,teamId:9});
const admin=()=>({kind:'system_admin',id:91,status:'active'});
const vehicle=(over={})=>({kind:'vehicle',id:45,state:'visible',sourceType:'mingbang',storeId:4,teamId:9,ownerEmployeeId:11,responsibleEmployeeId:12,assigneeEmployeeId:13,accountStatus:'active',...over});
const customer=(over={})=>({kind:'customer',id:25,state:'active',ownerEmployeeId:11,responsibleEmployeeId:12,assigneeEmployeeId:13,accountStatus:'active',...over});
const scope=(a,r,c,relation='global')=>({actorId:a.id,resourceKind:r.kind,resourceId:r.id,capability:c,relation,active:true});
const ctx=(operation,{actor=employee(),resource=vehicle(),defaults,personal={},hardDenies=[],scopes,internalMode=false,systemCapabilities}={})=>{
 const rules=ACTIONS[operation];
 const caps=actor.kind==='system_admin'?[rules?.systemCap]:rules?.cap||[];
 return {actor,resource,internalMode,facts:{
  roleDefaults:defaults??caps.filter(Boolean),
  personalDecisions:personal,
  hardDenies,
  systemCapabilities:systemCapabilities??caps.filter(Boolean),
  scopeGrants:scopes??caps.filter(Boolean).map(c=>scope(actor,resource,c))
 }};
};
const ok=(o,c)=>assert.equal(authorize(o,c).allowed,true,JSON.stringify(authorize(o,c)));
const denied=(o,c,reason)=>assert.deepEqual([authorize(o,c).allowed,authorize(o,c).reason],[false,reason]);

test('action index is explicit: unknown/retired price adjustment is never an authority',()=>{
 assert.equal(Object.isFrozen(ACTIONS),true);
 denied('vehicle.adjust_price',ctx('vehicle.edit'),'UNKNOWN_OR_RETIRED_ACTION');
 denied('vehicle.convert_mingbang_permission',ctx('vehicle.edit'),'UNKNOWN_OR_RETIRED_ACTION');
});
test('missing actor, facts, object, role, and expired principal fail closed',()=>{
 denied('vehicle.read',{},'MISSING_CURRENT_FACTS');
 denied('vehicle.read',ctx('vehicle.read',{actor:{...employee(),status:'inactive'}}),'INVALID_OR_INACTIVE_ACTOR');
 denied('vehicle.read',ctx('vehicle.read',{actor:{...employee(),role:'other'}}),'UNKNOWN_EMPLOYEE_ROLE');
 denied('vehicle.read',ctx('vehicle.read',{resource:{kind:'vehicle',id:45,state:undefined}}),'INVALID_OBJECT_FACTS');
 denied('vehicle.read',ctx('vehicle.read',{resource:vehicle({state:'sold_external'})}),'OBJECT_STATE_DENIED');
});
test('role template is current data, deny overrides default, explicit allow can outlive template removal',()=>{
 const op='customer.phone.manage',r=customer();
 ok(op,ctx(op,{resource:r}));
 denied(op,ctx(op,{resource:r,personal:{'customer.phone.manage':'deny'}}),'PERMISSION_DENIED');
 denied(op,ctx(op,{resource:r,defaults:[]}), 'PERMISSION_DENIED');
 ok(op,ctx(op,{resource:r,defaults:[],personal:{'customer.phone.manage':'allow'}}));
 denied(op,ctx(op,{resource:r,personal:{'customer.phone.manage':'allow'},hardDenies:['customer.phone.manage']}),'HARD_DENY_POLICY');
});
test('invalid override and missing fresh permission facts fail closed',()=>{
 const op='vehicle.read';
 denied(op,ctx(op,{personal:{'vehicle.read':'grant'}}),'PERMISSION_DENIED');
 const c=ctx(op);delete c.facts.roleDefaults;
 denied(op,c,'PERMISSION_DENIED');
 const d=ctx(op);delete d.facts.hardDenies;
 denied(op,d,'MISSING_POLICY_FACTS');
});
test('data scope exact object and actor bindings; stale old ownership does not grant access',()=>{
 const op='customer.crm.read',a=employee(),r=customer();
 denied(op,ctx(op,{actor:a,resource:r,scopes:[]}), 'SCOPE_DENIED');
 denied(op,ctx(op,{actor:a,resource:r,scopes:[scope(a,{...r,id:26},'crm.customer.view')]}),'SCOPE_DENIED');
 denied(op,ctx(op,{actor:a,resource:r,scopes:[{...scope(a,r,'crm.customer.view'),actorId:77}]}),'SCOPE_DENIED');
 ok(op,ctx(op,{actor:a,resource:r,scopes:[scope(a,r,'crm.customer.view','owner')]}));
 denied(op,ctx(op,{actor:a,resource:customer({ownerEmployeeId:12}),scopes:[scope(a,customer({ownerEmployeeId:12}),'crm.customer.view','owner')]}),'SCOPE_DENIED');
});
test('owner, responsible and assignee are separate facts; store/team require current relation',()=>{
 const a=employee(),r=vehicle();
 const op='vehicle.edit';
 denied(op,ctx(op,{actor:a,resource:r,scopes:[scope(a,r,'vehicle.manage','responsible')]}),'SCOPE_DENIED');
 denied(op,ctx(op,{actor:a,resource:r,scopes:[scope(a,r,'vehicle.manage','assignee')]}),'SCOPE_DENIED');
 ok(op,ctx(op,{actor:a,resource:r,scopes:[scope(a,r,'vehicle.manage','store')]}));
 ok(op,ctx(op,{actor:a,resource:r,scopes:[scope(a,r,'vehicle.manage','team')]}));
 denied(op,ctx(op,{actor:a,resource:vehicle({storeId:99}),scopes:[scope(a,vehicle({storeId:99}),'vehicle.manage','store')]}),'SCOPE_DENIED');
});
test('4S cannot cross system, CRM, Lock, Transaction, internal price or convert',()=>{
 const a=employee('four_s'),r=vehicle({sourceType:'four_s',fourSEmployeeId:11});
 for(const [op,resource] of [
  ['customer.crm.read',customer({sourceType:'four_s',fourSEmployeeId:11})],
  ['lock.manage',{kind:'lock',id:45,state:'active',sourceType:'four_s',fourSEmployeeId:11}],
  ['transaction.manage',{kind:'transaction',id:45,state:'in_progress',sourceType:'four_s',fourSEmployeeId:11}],
  ['vehicle.internal_wholesale_price.read',r],['vehicle.display_price.override',r],
  ['vehicle.convert_to_mingbang',r],['customer.phone.manage',customer({sourceType:'four_s',fourSEmployeeId:11})],
  ['matching.rule.manage',{kind:'matching_rule',id:45,state:'enabled',sourceType:'four_s',fourSEmployeeId:11}]
 ]){
  const c=ctx(op,{actor:a,resource,personal:{'internal.price.view':'allow'}});
  denied(op,c,'HARD_DENY_FOUR_S');
 }
});
test('4S PC vehicle ability only for own 4S vehicle, even after explicit permission',()=>{
 const op='vehicle.pc_manage_4s',a=employee('four_s'),r=vehicle({sourceType:'four_s',fourSEmployeeId:11});
 ok(op,ctx(op,{actor:a,resource:r,scopes:[scope(a,r,'pc.four_s.vehicle.manage','four_s_vehicle')]}));
 denied(op,ctx(op,{actor:a,resource:vehicle({sourceType:'four_s',fourSEmployeeId:12})}),'FOUR_S_OWN_VEHICLE_ONLY');
 denied(op,ctx(op,{actor:a,resource:vehicle({sourceType:'mingbang',fourSEmployeeId:11})}),'FOUR_S_SOURCE_BOUNDARY');
 denied(op,ctx(op,{actor:employee(),resource:r}),'FOUR_S_ONLY_ACTION');
});
test('4S employee-side vehicle own view and edit do not imply PC permission',()=>{
 const a=employee('four_s'),r=vehicle({sourceType:'four_s',fourSEmployeeId:11});
 ok('vehicle.read',ctx('vehicle.read',{actor:a,resource:r,scopes:[scope(a,r,'vehicle.read','four_s_vehicle')]}));
 denied('vehicle.pc_manage_4s',ctx('vehicle.pc_manage_4s',{actor:a,resource:r,defaults:[]}), 'PERMISSION_DENIED');
});
test('System Admin control plane is not an employee business actor, or default owner',()=>{
 const a=admin();
 ok('system.employee.manage',ctx('system.employee.manage',{actor:a,resource:{kind:'employee',id:12,state:'active'}}));
 denied('vehicle.edit',ctx('vehicle.edit',{actor:a}), 'SYSTEM_ADMIN_IS_NOT_EMPLOYEE');
 denied('lock.manage',ctx('lock.manage',{actor:a,resource:{kind:'lock',id:45,state:'active'}}),'SYSTEM_ADMIN_IS_NOT_EMPLOYEE');
 denied('system.role_template.manage',ctx('system.role_template.manage',{actor:employee(),resource:{kind:'role',id:7,state:'active'}}),'EMPLOYEE_IS_NOT_SYSTEM_ADMIN');
 denied('system.employee.manage',ctx('system.employee.manage',{actor:{...a,status:'inactive'},resource:{kind:'employee',id:12,state:'active'}}),'INVALID_OR_INACTIVE_ACTOR');
});
test('separate principal IDs never block valid system governance by numerical collision',()=>{
 const a=admin(),r={kind:'employee',id:a.id,state:'active'};
 ok('system.employee.manage',ctx('system.employee.manage',{actor:a,resource:r}));
});
test('4S governance capability cannot target a non-4S Employee',()=>{
 const op='system.four_s_account.manage',a=admin();
 denied(op,ctx(op,{actor:a,resource:{kind:'employee',id:72,state:'active',role:'sales'}}),'FOUR_S_ACCOUNT_TARGET_REQUIRED');
 ok(op,ctx(op,{actor:a,resource:{kind:'employee',id:72,state:'active',role:'four_s'}}));
});
test('projection refuses mismatching database row identity even with permission',()=>{
 const context=ctx('vehicle.read',{resource:vehicle()});
 assert.deepEqual(projectRecord('vehicle.read',{vehicle_id:99,display_price:3},context),{allowed:false,reason:'RECORD_RESOURCE_ID_MISMATCH',fields:{}});
});
test('A整改：车辆详情即使已获授权，也必须具备有效且匹配的 vehicle_id',()=>{
 const context=ctx('vehicle.read',{resource:vehicle()});
 ok('vehicle.read',context); // authorization succeeds; row identity is a separate guard
 const expected={allowed:false,reason:'RECORD_RESOURCE_ID_REQUIRED',fields:{}};
 for(const row of [{source_type:'mingbang',display_price:20},{vehicle_id:undefined,display_price:20},{vehicle_id:null},{vehicle_id:0},{vehicle_id:{id:45}}]){
  assert.deepEqual(projectRecord('vehicle.read',row,context),expected);
 }
 assert.deepEqual(projectRecord('vehicle.read',{vehicle_id:46,display_price:20},context),{allowed:false,reason:'RECORD_RESOURCE_ID_MISMATCH',fields:{}});
 assert.deepEqual(projectRecord('vehicle.read',{vehicle_id:45,display_price:20},context),{allowed:true,reason:'CURRENT_SCOPE_PROJECTED',fields:{vehicle_id:45,display_price:20}});
});
test('A整改：CRM与历史两种客户投影都必须具备匹配的 customer_id',()=>{
 for(const op of ['customer.crm.read','customer.history.read']){
  const context=ctx(op,{resource:customer()});
  ok(op,context);
  const required={allowed:false,reason:'RECORD_RESOURCE_ID_REQUIRED',fields:{}};
  for(const row of [{history_event:'handover',account_status:'active'}, {customer_id:null}, {customer_id:''}, {customer_id:0}, {customer_id:['25']}])
   assert.deepEqual(projectRecord(op,row,context),required,op+' missing/invalid customer_id');
  assert.deepEqual(projectRecord(op,{customer_id:26,account_status:'active'},context),{allowed:false,reason:'RECORD_RESOURCE_ID_MISMATCH',fields:{}});
  assert.deepEqual(projectRecord(op,{customer_id:25,account_status:'active'},context),{allowed:true,reason:'CURRENT_SCOPE_PROJECTED',fields:{customer_id:25,account_status:'active'}});
 }
});
test('A整改：历史记录任何白名单内嵌套敏感字段必须整体拒绝，不得返回部分或原始值',()=>{
 const op='customer.history.read',context=ctx(op,{resource:customer()});
 const secret='NEVER_LEAK_NESTED_SECRET';
 const base={customer_id:25,account_status:'active',history_event:'handover',occurred_at:'2026-10-01',actor_id:31,actor_role_at_time:'sales',actor_store_at_time:8};
 const badRows=[
  {...base,history_event:{type:'handover',metadata:{password_hash:secret}}},
  {...base,history_event:[{source:{publisher_phone:secret}}]},
  {...base,contact_name:{display:'normal',secrets:[{internal_wholesale_price:secret}]}},
  {...base,actor_role_at_time:{old_role:'sales',security:{token:secret}}},
  {...base,actor_store_at_time:new Date('2026-10-01T00:00:00Z')},
  {...base,customer_level:{safe:'VIP',private:{token:secret}}}
 ];
 for(const row of badRows){
  const projection=projectRecord(op,row,context);
  assert.deepEqual(projection,{allowed:false,reason:'UNSAFE_NESTED_HISTORY_VALUE',fields:{}});
  assert.ok(!JSON.stringify(projection).includes(secret),'nested sensitive payload leaked');
 }
 const valid=projectRecord(op,{...base,unlisted_secret:{nested:{password_hash:secret}}},context);
 assert.equal(valid.allowed,true);
 assert.deepEqual(valid.fields,base);
 assert.ok(!JSON.stringify(valid).includes(secret));
});
test('System Admin may act on customer account control plane, never on employee CRM',()=>{
 const a=admin(),r=customer();
 ok('customer.account.disable',ctx('customer.account.disable',{actor:a,resource:r}));
 denied('customer.crm.read',ctx('customer.crm.read',{actor:a,resource:r}), 'SYSTEM_ADMIN_IS_NOT_EMPLOYEE');
 denied('customer.account.disable',ctx('customer.account.disable',{actor:employee('four_s'),resource:r}),'HARD_DENY_FOUR_S');
});
test('PC principal confusion and unrecognized role both reject',()=>{
 denied('vehicle.read',ctx('vehicle.read',{actor:{...admin(),role:'manager'}}),'MIXED_PRINCIPAL_IDENTITY');
 denied('system.vehicle_model.manage',ctx('system.vehicle_model.manage',{actor:{kind:'customer',id:3,status:'active'},resource:{kind:'model',id:2,state:'active'}}),'INVALID_OR_INACTIVE_ACTOR');
});
test('Internal Mode alone grants neither protected price nor phone',()=>{
 const r=vehicle({sourceType:'wholesale',upstreamPublisherId:99}),c=ctx('vehicle.internal_wholesale_price.read',{resource:r,defaults:[],internalMode:true});
 denied('vehicle.internal_wholesale_price.read',c,'PERMISSION_DENIED');
 denied('vehicle.publisher_phone.read',ctx('vehicle.publisher_phone.read',{resource:r,defaults:[],internalMode:true}),'PERMISSION_DENIED');
});
test('editing internal price needs vehicle edit AND independent price permission',()=>{
 const op='vehicle.internal_wholesale_price.edit',r=vehicle();
 ok(op,ctx(op,{resource:r}));
 denied(op,ctx(op,{resource:r,defaults:['vehicle.manage']}),'PERMISSION_DENIED');
 denied(op,ctx(op,{resource:r,defaults:['internal.price.view']}),'PERMISSION_DENIED');
 denied(op,ctx(op,{resource:r,scopes:[scope(employee(),r,'vehicle.manage')]}),'SCOPE_DENIED');
 ok('vehicle.customer_list_price.edit',ctx('vehicle.customer_list_price.edit',{resource:r,defaults:['vehicle.manage']}));
});
test('customer display override requires separate permission and 4S is always denied',()=>{
 const op='vehicle.display_price.override',r=vehicle();
 denied(op,ctx(op,{resource:r,defaults:['vehicle.manage']}),'PERMISSION_DENIED');
 ok(op,ctx(op,{resource:r}));
 denied(op,ctx(op,{actor:employee('four_s'),resource:vehicle({sourceType:'four_s',fourSEmployeeId:11})}),'HARD_DENY_FOUR_S');
});
test('publisher phone only on current wholesale with publisher identity and sensitive permission',()=>{
 const op='vehicle.publisher_phone.latest',r=vehicle({sourceType:'wholesale',upstreamPublisherId:33});
 ok(op,ctx(op,{resource:r}));
 denied(op,ctx(op,{resource:vehicle({sourceType:'mingbang',upstreamPublisherId:33})}),'SOURCE_TYPE_DENIED');
 denied(op,ctx(op,{resource:vehicle({sourceType:'wholesale'})}),'PUBLISHER_CONTEXT_MISSING');
 denied(op,ctx(op,{resource:r,defaults:['integration.collector.manage']}),'PERMISSION_DENIED');
 ok('vehicle.publisher_phone.dial',ctx('vehicle.publisher_phone.dial',{resource:r}));
});
test('conversion uses existing vehicle management, never invented independent permission',()=>{
 const r=vehicle({sourceType:'wholesale'});ok('vehicle.convert_to_mingbang',ctx('vehicle.convert_to_mingbang',{resource:r}));
 denied('vehicle.convert_to_mingbang',ctx('vehicle.convert_to_mingbang',{resource:r,defaults:[]}), 'PERMISSION_DENIED');
 denied('vehicle.convert_to_mingbang',ctx('vehicle.convert_to_mingbang',{resource:vehicle({sourceType:'four_s'})}),'SOURCE_TYPE_DENIED');
});
test('inactive customer prevents new actions but permits scoped current history',()=>{
 const r=customer({accountStatus:'inactive'});
 denied('customer.phone.manage',ctx('customer.phone.manage',{resource:r}), 'RESOURCE_ACCOUNT_INACTIVE');
 ok('customer.history.read',ctx('customer.history.read',{resource:r}));
});
test('vehicle projection strips raw and permission-only fields, not just UI visibility',()=>{
 const r=vehicle({sourceType:'wholesale',upstreamPublisherId:9});
 const row={vehicle_id:45,source_type:'wholesale',display_price:180000,internal_wholesale_price:100000,upstream_wholesale_price:99000,publisher_phone:'13812345678',credential_hash:'secret',personal_note:'private'};
 const c=ctx('vehicle.read',{resource:r,internalMode:true,defaults:['vehicle.read']});
 const safe=projectRecord('vehicle.read',row,c);
 assert.equal(safe.allowed,true);assert.deepEqual(safe.fields,{vehicle_id:45,source_type:'wholesale',display_price:180000});
 const all=ctx('vehicle.read',{resource:r,internalMode:true,defaults:['vehicle.read','internal.price.view','publisher.phone.sensitive']});
 all.facts.scopeGrants.push(scope(employee(),r,'internal.price.view'),scope(employee(),r,'publisher.phone.sensitive'));
 assert.deepEqual(projectRecord('vehicle.read',row,all).fields,{vehicle_id:45,source_type:'wholesale',display_price:180000,internal_wholesale_price:100000,upstream_wholesale_price:99000,publisher_phone:'13812345678'});
 all.internalMode=false;
 assert.deepEqual(projectRecord('vehicle.read',row,all).fields,{vehicle_id:45,source_type:'wholesale',display_price:180000});
});
test('historical projection uses CURRENT scope yet retains historical actor fact safely',()=>{
 const r=customer(),row={customer_id:25,account_status:'active',history_event:'handover',actor_id:31,actor_role_at_time:'sales',actor_store_at_time:8,occurred_at:'2026-09-01',internal_wholesale_price:3,password_hash:'unsafe',current_owner_employee_id:11};
 const c=ctx('customer.history.read',{resource:r});
 assert.deepEqual(projectRecord('customer.history.read',row,c).fields,{customer_id:25,account_status:'active',history_event:'handover',actor_id:31,actor_role_at_time:'sales',actor_store_at_time:8,occurred_at:'2026-09-01'});
 c.facts.scopeGrants=[];
 assert.equal(projectRecord('customer.history.read',row,c).allowed,false);
});
test('old session and internalMode are not authorization facts',()=>{
 const c=ctx('vehicle.edit',{resource:vehicle(),defaults:[]});
 c.oldSession={employeeRole:'store_manager',permissionSnapshot:['vehicle.manage'],issuedAt:'2026'};
 c.internalMode=true;c.pageHasButton=true;
 denied('vehicle.edit',c,'PERMISSION_DENIED');
});
