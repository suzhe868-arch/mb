import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {makeFixture,req} from './fixture.mjs';
const p=new URL('../model.mjs',import.meta.url);
const original=await readFile(p,'utf8');
const replacement="import {ACTIONS} from '"+new URL('../../policy.mjs',import.meta.url).href+"';";
assert.ok(original.includes("import {ACTIONS} from '../policy.mjs';"));
async function mutant(a,b){
 assert.ok(original.includes(a),'mutation anchor exists');
 const src=original.replace("import {ACTIONS} from '../policy.mjs';",replacement).replace(a,b);
 return import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'));
}
test('G0-10 removal of hard-DENY condition is caught by negative example',async()=>{
 const modified=await mutant("if(rule.hardDenyFourS||(!rule.onlyFourS&&!rule.allowFourS))","if(false)");
 const state=makeFixture();state.defaults.push({role_id:'3',permission_id:state.permissions.find(z=>z.permission_code==='internal.price.view').permission_id,enabled:true});
 state.capabilityScopeProofs.push({employee_id:'103',scope_id:'3',permission_code:'internal.price.view'});
 state.approvedOperationMappings['vehicle.internal_wholesale_price.read']=true;
 assert.equal(modified.evaluate(state,req('vehicle.internal_wholesale_price.read','3','vehicle','402')).allowed,true,'mutant must show unsafe allow');
});
test('G0-10 removal of required scope check is caught',async()=>{
 const modified=await mutant("if(!scopeProof(state,actor,cap,object,now))","if(false)");
 const s=makeFixture();s.capabilityScopeProofs=[];
 assert.equal(modified.evaluate(s,req('customer.crm.read','1','customer','301')).allowed,true);
});
test('G0-10 removal of submit-time version check is caught',async()=>{
 const modified=await mutant("if(!expectedMatches(s,command,kind))","if(false)");
 const s=makeFixture();
 const q={action:'admin.create',targetId:'203',sessionRef:'4',observedVersion:99};
 assert.equal(modified.govern(s,q).result.allowed,true);
});
test('G0-10 unmodified negative examples catch all three changes',async()=>{
 const base=await import('../model.mjs'),s=makeFixture();
 s.defaults.push({role_id:'3',permission_id:s.permissions.find(z=>z.permission_code==='internal.price.view').permission_id,enabled:true});
 s.capabilityScopeProofs.push({employee_id:'103',scope_id:'3',permission_code:'internal.price.view'});
 assert.equal(base.evaluate(s,req('vehicle.internal_wholesale_price.read','3','vehicle','402')).allowed,false);
 s.capabilityScopeProofs=[];assert.equal(base.evaluate(s,req('customer.crm.read','1','customer','301')).allowed,false);
 assert.equal(base.govern(s,{action:'admin.create',targetId:'203',sessionRef:'4',observedVersion:99}).result.allowed,false);
});
