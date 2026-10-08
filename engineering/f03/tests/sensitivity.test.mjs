import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {authorize,projectRecord} from '../policy.mjs';
const source=await readFile(new URL('../policy.mjs',import.meta.url),'utf8');
const base=(role='four_s')=>({
 actor:{kind:'employee',id:11,status:'active',role,storeId:4},
 resource:{kind:'vehicle',id:45,state:'visible',sourceType:'four_s',fourSEmployeeId:11,storeId:4},
 facts:{roleDefaults:['internal.price.view','vehicle.read'],personalDecisions:{'internal.price.view':'allow'},hardDenies:[],
  scopeGrants:[{actorId:11,resourceKind:'vehicle',resourceId:45,capability:'internal.price.view',relation:'four_s_vehicle',active:true},
  {actorId:11,resourceKind:'vehicle',resourceId:45,capability:'vehicle.read',relation:'four_s_vehicle',active:true}]}
});
async function mutant(text,check){
 const dir=await mkdtemp(join(tmpdir(),'mb-f03-g0-mutant-'));
 try{
  const file=join(dir,'policy.mjs');
  await writeFile(file,text);
  const {authorize:changed,projectRecord:changedProject}=await import(pathToFileURL(file).href);
  return check(changed,changedProject);
 }finally{await rm(dir,{recursive:true,force:true})}
}
test('mutation sensitivity: both 4S hard DENY guard rails are observable by negative cases',async()=>{
 const sample=base(),op='vehicle.internal_wholesale_price.read';
 assert.equal(authorize(op,sample).allowed,false);
 const primary="if(actor.role==='four_s'&&rule.hardDenyFourS)return deny('HARD_DENY_FOUR_S');";
 const general="if(actor.role==='four_s'&&rule.allowFourS!==true&&rule.onlyFourS!==true)return deny('HARD_DENY_FOUR_S');";
 assert.ok(source.includes(primary)&&source.includes(general),'mutation sites must exist');
 const mutated=source.replace(primary,'/* mutant: removed explicit 4S hard DENY */').replace(general,'/* mutant: removed generic 4S hard DENY */');
 assert.notEqual(mutated,source);
 await mutant(mutated,changed=>{
  const result=changed(op,sample);
  assert.equal(result.allowed,true,'mutation must leak protected price: baseline negative would fail');
  assert.throws(()=>assert.equal(result.allowed,false),'baseline denial assertion must fail on mutant');
 });
});
test('mutation sensitivity: removing scope guard causes an out-of-scope test to fail',async()=>{
 const sample=base('sales');sample.facts.scopeGrants=[];
 const op='vehicle.read';
 assert.deepEqual(authorize(op,sample).reason,'SCOPE_DENIED');
 const target="if(capabilities.some(c=>!facts.scopeGrants.some(grant=>scopeMatches({actor,resource,grant,capability:c}))))return deny('SCOPE_DENIED');";
 assert.ok(source.includes(target),'scope mutation site must exist');
 const modified=source.replace(target,'/* mutant: removed current per-object scope gate */');
 await mutant(modified,changed=>{
  const result=changed(op,sample);
  assert.equal(result.allowed,true,'scope mutation must grant out-of-scope object');
  assert.throws(()=>assert.equal(result.allowed,false),'baseline scope negative would fail on mutant');
 });
});

test('A整改敏感性：移除车辆或客户记录身份校验时，缺编号负例必须翻转',async()=>{
 const vehicleContext=base('sales');
 vehicleContext.resource={kind:'vehicle',id:45,state:'visible',sourceType:'mingbang'};
 const missingVehicle={display_price:1234,source_type:'mingbang'};
 assert.deepEqual(projectRecord('vehicle.read',missingVehicle,vehicleContext),{allowed:false,reason:'RECORD_RESOURCE_ID_REQUIRED',fields:{}});
 const required="if(recordIdField&&(!own(record,recordIdField)||!validId(record[recordIdField])))return {allowed:false,reason:'RECORD_RESOURCE_ID_REQUIRED',fields:{}};";
 const equal="if(recordIdField&&record[recordIdField]!==context.resource.id)return {allowed:false,reason:'RECORD_RESOURCE_ID_MISMATCH',fields:{}};";
 assert.ok(source.includes(required)&&source.includes(equal),'both identity checks must exist');
 const weakened=source.replace(required,'/* removed required primary ID */').replace(equal,'/* removed cross-object primary ID equality */');
 await mutant(weakened,(unused,changedProject)=>{
  const changed=changedProject('vehicle.read',missingVehicle,vehicleContext);
  assert.equal(changed.allowed,true,'removing identity guards must expose a vehicle row without ID');
  assert.throws(()=>assert.deepEqual(changed,{allowed:false,reason:'RECORD_RESOURCE_ID_REQUIRED',fields:{}}));
  const customerContext={
   actor:{kind:'employee',id:11,status:'active',role:'sales'},
   resource:{kind:'customer',id:25,state:'active',accountStatus:'active'},
   facts:{roleDefaults:['crm.customer.view'],personalDecisions:{},hardDenies:[],
     scopeGrants:[{actorId:11,resourceKind:'customer',resourceId:25,capability:'crm.customer.view',relation:'global',active:true}]}
  };
  assert.equal(projectRecord('customer.history.read',{history_event:'handover'},customerContext).allowed,false);
  assert.equal(changedProject('customer.history.read',{history_event:'handover'},customerContext).allowed,true,'missing Customer ID must be observable after guard removal');
 });
});
test('A整改敏感性：移除历史嵌套安全检查会真实透出嵌套秘密',async()=>{
 const sample={
  actor:{kind:'employee',id:11,status:'active',role:'sales'},
  resource:{kind:'customer',id:25,state:'active',accountStatus:'active'},
  facts:{roleDefaults:['crm.customer.view'],personalDecisions:{},hardDenies:[],
    scopeGrants:[{actorId:11,resourceKind:'customer',resourceId:25,capability:'crm.customer.view',relation:'global',active:true}]}
 };
 const secret='MUTANT_SENSITIVE_SECRET';
 const record={customer_id:25,history_event:{kind:'handover',details:{password_hash:secret}}};
 const safe=projectRecord('customer.history.read',record,sample);
 assert.deepEqual(safe,{allowed:false,reason:'UNSAFE_NESTED_HISTORY_VALUE',fields:{}});
 const check="if(operation==='customer.history.read'&&[...SAFE_CUSTOMER,...SAFE_HISTORY].some(key=>own(record,key)&&!safeHistoricalScalar(record[key])))return {allowed:false,reason:'UNSAFE_NESTED_HISTORY_VALUE',fields:{}};";
 assert.ok(source.includes(check),'nested structure guard must exist');
 await mutant(source.replace(check,'/* mutation removed nested historical value filter */'),(unused,changedProject)=>{
  const leaked=changedProject('customer.history.read',record,sample);
  assert.equal(leaked.allowed,true,'without nested protection, history projection must leak the payload');
  assert.ok(JSON.stringify(leaked).includes(secret),'demonstrate secret leak after security guard removal');
  assert.throws(()=>assert.deepEqual(leaked,safe),'old reject assertion must fail on mutant');
 });
});
