// Every value in this module is synthetic. Never a production/real PG fixture.
export function makeFixture(){
 const caps=['customer.phone.manage','crm.customer.view','vehicle.read','vehicle.manage','internal.price.view','publisher.phone.sensitive','pc.four_s.vehicle.manage','matching.rule.manage'];
 const permissions=caps.map((permission_code,i)=>({permission_id:String(i+1),permission_code}));
 const pid=code=>permissions.find(p=>p.permission_code===code).permission_id;
 const accounts=[
  {account_id:'1',principal_kind:'employee',employee_id:'101',system_admin_id:null,credential_state:'enabled',credential_epoch:'1',force_password_change:false},
  {account_id:'2',principal_kind:'employee',employee_id:'102',system_admin_id:null,credential_state:'enabled',credential_epoch:'1',force_password_change:false},
  {account_id:'3',principal_kind:'employee',employee_id:'103',system_admin_id:null,credential_state:'enabled',credential_epoch:'1',force_password_change:false},
  {account_id:'4',principal_kind:'system_admin',employee_id:null,system_admin_id:'201',credential_state:'enabled',credential_epoch:'1',force_password_change:false},
  {account_id:'5',principal_kind:'system_admin',employee_id:null,system_admin_id:'202',credential_state:'enabled',credential_epoch:'1',force_password_change:false},
  {account_id:'6',principal_kind:'employee',employee_id:'104',system_admin_id:null,credential_state:'enabled',credential_epoch:'1',force_password_change:false},
 ];
 return {
  trustedSyntheticFixture:true,now:'2026-10-09T02:00:00.000Z',
  versions:{admin:0,receiving:0,policy:0},bootstrapEver:true,ownerAssignmentPending:false,
  accounts,sessions:accounts.map(a=>({session_id:a.account_id,account_id:a.account_id,credential_epoch:'1',restricted:false,revoked:false})),
  roles:[{role_id:'1',role_code:'sales'},{role_id:'2',role_code:'manager'},{role_id:'3',role_code:'four_s'},{role_id:'4',role_code:'store_manager'}],
  employees:[
   {employee_id:'101',main_role_id:'1',store_id:'10',employment_status:'active',receiving_status:'accepting'},
   {employee_id:'102',main_role_id:'2',store_id:'10',employment_status:'active',receiving_status:'accepting'},
   {employee_id:'103',main_role_id:'3',store_id:null,employment_status:'active',receiving_status:'paused'},
   {employee_id:'104',main_role_id:'4',store_id:'10',employment_status:'active',receiving_status:'paused'},
  ],
  systemAdmins:[{system_admin_id:'201',account_status:'active'},{system_admin_id:'202',account_status:'active'}],
  permissions,defaults:[
   ...['customer.phone.manage','crm.customer.view','vehicle.read','vehicle.manage','internal.price.view','publisher.phone.sensitive'].map(code=>({role_id:'1',permission_id:pid(code),enabled:true})),
   {role_id:'3',permission_id:pid('vehicle.read'),enabled:true},
   {role_id:'3',permission_id:pid('pc.four_s.vehicle.manage'),enabled:true},
  ],
  overrides:[{employee_id:'103',permission_id:pid('pc.four_s.vehicle.manage'),decision:'allow'}],overrideHistory:[],roleDefaultHistory:[],
  scopes:[
   {scope_id:'1',employee_id:'101',scope_kind:'owner_customer',scope_reference_id:'301',ended_at:null},
   {scope_id:'2',employee_id:'101',scope_kind:'store',scope_reference_id:'10',ended_at:null},
   {scope_id:'3',employee_id:'103',scope_kind:'four_s_vehicle',scope_reference_id:'402',ended_at:null},
  ],
  approvedScopeKinds:['owner_customer','store','four_s_vehicle','self','responsible_demand','responsible_lock','responsible_transaction','assignee_consultation'],
  capabilityScopeProofs:[
   {employee_id:'101',scope_id:'1',permission_code:'customer.phone.manage',operation:'customer.phone.manage',object_kind:'customer'},
   {employee_id:'101',scope_id:'1',permission_code:'crm.customer.view',operation:'customer.crm.read',object_kind:'customer'},
   ...['vehicle.read','vehicle.manage','internal.price.view','publisher.phone.sensitive'].map(code=>({employee_id:'101',scope_id:'2',permission_code:code,operation:'vehicle.read',object_kind:'vehicle'})),
   {employee_id:'103',scope_id:'3',permission_code:'vehicle.read',operation:'vehicle.read',object_kind:'vehicle'},
   {employee_id:'103',scope_id:'3',permission_code:'pc.four_s.vehicle.manage',operation:'vehicle.pc_manage_4s',object_kind:'vehicle'},
  ],
  approvedOperationMappings:Object.fromEntries(['customer.phone.manage','customer.crm.read','vehicle.read','vehicle.edit','vehicle.internal_wholesale_price.read','vehicle.internal_wholesale_price.edit','vehicle.publisher_phone.read','vehicle.pc_manage_4s','system.employee.manage'].map(x=>[x,true])),
  objects:[
   {id:'301',kind:'customer',account_status:'active',current_owner_employee_id:'101',store_id:'10'},
   {id:'401',kind:'vehicle',platform_visibility:'visible',source_type:'wholesale',source_sale_status:'active',store_id:'10',upstream_publisher_id:'701'},
   {id:'402',kind:'vehicle',platform_visibility:'visible',source_type:'four_s',source_sale_status:'active',store_id:null,created_by_employee_id:'103'},
   {id:'101',kind:'employee',employment_status:'active',store_id:'10'},
  ],
  hardDeniedOperations:[],hardDeniedCapabilities:[],
  controlGrants:[{system_admin_id:'201',permission_code:'system.employee.manage',active:true,target_kind:'employee',target_id:'101'}],
  governanceGrants:[
   ...['admin.disable','admin.create','credential.disable','template.set','override.set','override.revoke','scope.end','employee.sudden_inactive','employee.planned_disable','employee.rehire','employee.transfer','handover.item'].map(action=>({kind:'system_admin',actor_id:'201',action,active:true})),
   ...['override.set','override.revoke','employee.planned_disable','employee.transfer','employee.sudden_inactive','employee.rehire','handover.item'].map(action=>({kind:'employee',actor_id:'102',action,store_id:'10',team_confirmed:true,team_scope_verified:true,active:true})),
   ...['override.set','override.revoke','employee.planned_disable','employee.transfer','employee.sudden_inactive','employee.rehire','handover.item'].map(action=>({kind:'employee',actor_id:'104',action,store_id:'10',active:true})),
  ],
  eligibilityProofs:[{employee_id:'101',eligible:true,trusted:true},{employee_id:'102',eligible:true,trusted:true}],
  responsibilities:[],handoverItems:[],audit:[]
 };
}
export const req=(operation,sessionRef,objectKind,objectId)=>({operation,sessionRef,objectKind,objectId,now:'2026-10-09T02:00:00.000Z'});
