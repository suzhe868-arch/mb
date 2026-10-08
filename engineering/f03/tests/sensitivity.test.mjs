import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {authorize} from '../policy.mjs';
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
  const {authorize:changed}=await import(pathToFileURL(file).href);
  return check(changed);
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
