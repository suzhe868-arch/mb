// A-F04-3-01/02/03: mutation regressions on actual PG16/M94 and authoritative Current source.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {connect,verify as verifyM94} from '../../../f03/runtime-transaction-responsible-handover/migration.mjs';
import {validateRegistry,validateDtoValue,loadContracts} from '../source-guard.mjs';
const file=n=>readFileSync(new URL('../'+n,import.meta.url),'utf8');
const registry=file('current-route-contracts.tsv'),spec=file('current-openapi.json');
const bridge=file('旧接口与Current动作桥接.tsv'),dto=file('dto-contract-lock.json'),sem=file('current-action-semantic-lock.json');
const models=JSON.parse(dto).schemas;
const modelBy=i=>models.find(z=>z.intent===i);
const db=await connect();test.after(()=>db.end());
const mutateTsv=(id,k,v)=>{
 const rows=registry.trimEnd().split('\n'),h=rows[0].split('\t');
 const i=rows.findIndex((x,j)=>j>0&&x.startsWith(id+'\t'));assert.ok(i>0,id);
 const fields=rows[i].split('\t'),at=h.indexOf(k);assert.ok(at>=0,k);
 fields[at]=v;rows[i]=fields.join('\t');return rows.join('\n')+'\n';
};
test('A-F04-3-01-1 real independent PG16 M94 + all 32 contracts actual nonempty typed request/response allowlists',async()=>{
 assert.equal((await verifyM94(db)).verified,true);
 assert.equal((await db.query("SELECT count(*)::int n FROM pg_tables WHERE schemaname='public'")).rows[0].n,94);
 assert.equal(validateRegistry().contracts,32);
 assert.equal(models.length,32);
 for(const x of models){
  assert.equal(x.request.schema.type,'object');assert.equal(x.request.schema.additionalProperties,false);
  assert.deepEqual(x.request.schema.required,Object.keys(x.request.schema.properties));
  assert.equal(x.responseSchemas['403'].additionalProperties,false);
  assert.equal(x.responseSchemas['501'].additionalProperties,false);
  assert.ok(x.request.fieldSources.every(s=>s.authorityFile.startsWith('07_重建工作区/PDM-')));
 }
 assert.deepEqual(modelBy('CONSULTATION_CREATE').request.schema.required,['vehicleId','listingCycleId']);
 assert.equal(modelBy('EMPLOYEE_SELF_RECEIVING').request.schema.properties.accepting.type,'boolean');
 assert.deepEqual(modelBy('CONSULTATION_NORMAL_CLOSE').request.schema.properties.closeReason.enum,['NORMAL_CLOSED']);
});
test('A-F04-3-01-2 synthetic DTO accepts exact valid shape, rejects missing/extra/sensitive/wrong type and leaks',()=>{
 const action=modelBy('CONSULTATION_CREATE').actionId,good={vehicleId:12,listingCycleId:3};
 assert.equal(validateDtoValue(action,good),true);
 for(const invalid of [{vehicleId:12},{vehicleId:'12',listingCycleId:3},{...good,vin:'sensitive'},
 {...good,phone:'private'}, {...good,internalWholesalePrice:1}, {...good,accessToken:'secret'}])
  assert.equal(validateDtoValue(action,invalid),false,JSON.stringify(invalid));
 const self=modelBy('EMPLOYEE_SELF_RECEIVING').actionId;
 assert.equal(validateDtoValue(self,{accepting:true}),true);
 assert.equal(validateDtoValue(self,{accepting:'true'}),false);
 assert.equal(validateDtoValue(action,{code:'F04_3_DEPENDENCY_BLOCKED'},'response','501'),true);
 assert.equal(validateDtoValue(action,{code:'F04_3_DEPENDENCY_BLOCKED',publisherPhone:'123'},'response','501'),false);
});
test('A-F04-3-01-3 OpenAPI request, response and error enumeration mutations are rejected',()=>{
 const m=JSON.parse(spec),path='/__ci__/current/v1/consultations/create';
 m.paths[path].post.requestBody.content['application/json'].schema.properties.vin={type:'string'};
 assert.throws(()=>validateRegistry(registry,JSON.stringify(m),bridge,dto,sem),/REQUEST_DTO_SCHEMA_DRIFT/);
 const m2=JSON.parse(spec);
 m2.paths[path].post.responses['501'].content['application/json'].schema.properties.internalWholesalePrice={type:'number'};
 assert.throws(()=>validateRegistry(registry,JSON.stringify(m2),bridge,dto,sem),/RESPONSE_DTO_SCHEMA_DRIFT/);
 const m3=JSON.parse(spec);
 m3.paths[path].post.responses['403'].content['application/json'].schema.properties.code.enum.push('F04_FAKE_SUCCESS');
 assert.throws(()=>validateRegistry(registry,JSON.stringify(m3),bridge,dto,sem),/RESPONSE_DTO_SCHEMA_DRIFT/);
 const d=JSON.parse(dto);
 d.schemas.find(x=>x.intent==='CONSULTATION_CREATE').request.schema.properties.phone={type:'string'};
 assert.throws(()=>validateRegistry(registry,spec,bridge,JSON.stringify(d),sem),/REQUEST_DTO_SCHEMA_DRIFT|FIELD_WHITELIST_GAP/);
});
test('A-F04-3-02-1 real but unrelated navigation/PDM quote cannot pass exact actor/resource/domain/action semantic seal',()=>{
 const bad=JSON.parse(sem);
 bad.entries.LOCKREQUEST_REVIEW_OPEN.navText=bad.entries.LOCKREQUEST_PENDING_CREATE.navText;
 assert.throws(()=>validateRegistry(registry,spec,bridge,dto,JSON.stringify(bad)),/CURRENT_SEMANTIC_MISMATCH/);
 for(const [field,value] of [['actor','CUSTOMER'],['resource','Vehicle'],['domain','PDM-06'],['objectState','APPROVED']]){
  const q=JSON.parse(sem);q.entries.LOCKREQUEST_REVIEW_OPEN[field]=value;
  assert.throws(()=>validateRegistry(registry,spec,bridge,dto,JSON.stringify(q)),/CURRENT_SEMANTIC_MISMATCH/,field);
 }
 const wrong=JSON.parse(sem);wrong.entries.CONSULTATION_NORMAL_CLOSE.pdmLine=497;
 assert.throws(()=>validateRegistry(registry,spec,bridge,dto,JSON.stringify(wrong)),/CURRENT_SEMANTIC_MISMATCH/);
});
test('A-F04-3-02-2 cloned current action with wrong business Domain or principal denied',()=>{
 const id='CURRENTACTION_LOCKREQUEST_PENDING_CREATE';
 assert.throws(()=>validateRegistry(mutateTsv(id,'domain_authority','PDM-06'),spec,bridge,dto,sem),/DTO_ACTOR_CONTRACT_DRIFT|DTO_IDENTITY_DRIFT|CURRENT_SEMANTIC_MISMATCH/);
 assert.throws(()=>validateRegistry(mutateTsv(id,'subject','EMPLOYEE'),spec,bridge,dto,sem),/DTO_ACTOR_CONTRACT_DRIFT|DTO_IDENTITY_DRIFT|CURRENT_SEMANTIC_MISMATCH/);
 assert.throws(()=>validateRegistry(mutateTsv('CURRENTACTION_SYSTEM_ADMIN_EMPLOYEE_DISABLE','subject','EMPLOYEE_MANAGER'),spec,bridge,dto,sem),/DTO_ACTOR_CONTRACT_DRIFT|DTO_IDENTITY_DRIFT|CURRENT_SEMANTIC_MISMATCH/);
});
test('A-F04-3-03-1 Customer PC authentication can never be represented as authorized',()=>{
 const s=JSON.parse(spec),a=loadContracts();
 for(const r of a.filter(z=>z.subject==='CUSTOMER')){
  const op=s.paths[r.path][r.method.toLowerCase()];
  assert.deepEqual(op.security,[]);
  assert.equal(op['x-customer-authentication-dependency'].status,'BLOCKED');
  assert.equal(op['x-customer-authentication-dependency'].pcEmployeeCookie,'HARD_DENY');
 }
 const bad=JSON.parse(spec);
 bad.paths['/__ci__/current/v1/consultations/create'].post.security=[{employeePcSession:[]}];
 assert.throws(()=>validateRegistry(registry,JSON.stringify(bad),bridge,dto,sem),/CUSTOMER_PC_AUTH_FALSE_CLAIM/);
});
test('A-F04-3-03-2 PDM02 SystemAdmin governance and business manager are independent not silently conflated',()=>{
 const a=loadContracts(),s=JSON.parse(spec);
 const control=a.filter(x=>x.source_kind==='NEW_CONTROL_PLANE_ACTION');
 assert.equal(control.length,2);
 for(const c of control){
  const op=s.paths[c.path][c.method.toLowerCase()];
  assert.deepEqual(op.security,[{systemAdminControlSession:[]}]);
  assert.equal(c.subject,'SYSTEM_ADMIN');assert.ok(c.pdm_file.includes('PDM-02'));assert.equal(c.owner,'F04');
 }
 const biz=a.filter(x=>x.intent==='EMPLOYEE_DEACTIVATE'||x.intent==='EMPLOYEE_REACTIVATE');
 assert.equal(biz.length,2);assert.ok(biz.every(x=>x.authentication_contract==='MANAGER_CAPABILITY_SCOPE_REQUIRED'));
 const bad=JSON.parse(spec),admin=control[0];
 bad.paths[admin.path].post.security=[{managerEmployeePcSession:[]}];
 assert.throws(()=>validateRegistry(registry,JSON.stringify(bad),bridge,dto,sem),/AUTH_SCHEME_MISMATCH/);
});

test('A-F04-3-01-4 authoritative draft target, placement enum, LockRequest target identity and no hidden account bypass',()=>{
 const publish=modelBy('VEHICLE_PUBLISH'),banner=modelBy('BANNER_CREATE');
 assert.deepEqual(publish.request.schema.required,['draftId']);
 assert.equal(validateDtoValue(publish.actionId,{draftId:9}),true);
 assert.equal(validateDtoValue(publish.actionId,{vehicleId:9}),false);
 assert.deepEqual(banner.request.schema.properties.placement.enum,['HOME_TOP','VEHICLE_DETAIL']);
 assert.equal(validateDtoValue(banner.actionId,{placement:'HOME_TOP'}),true);
 assert.equal(validateDtoValue(banner.actionId,{placementId:1}),false);
 assert.equal(validateDtoValue(banner.actionId,{placement:'FAKE_NEW'}),false);
 const comp=JSON.parse(spec);comp.components.schemas.DTO_CURRENTACTION_VEHICLE_PUBLISH_079_Request.properties.privatePhone={type:'string'};
 assert.throws(()=>validateRegistry(registry,JSON.stringify(comp),bridge,dto,sem),/OPENAPI_COMPONENT_DTO_DRIFT/);
 const s=JSON.parse(spec),lock=s.paths['/__ci__/current/v1/lockrequests/{lockRequestId}/review-open'].get;
 assert.equal(lock.parameters[0].name,'lockRequestId');
 assert.equal(lock.parameters[0].required,true);
 const x=JSON.parse(spec);x.paths['/__ci__/current/v1/lockrequests/{lockRequestId}/review-open'].get.parameters[0].required=false;
 assert.throws(()=>validateRegistry(registry,JSON.stringify(x),bridge,dto,sem),/OBJECT_PATH_DTO_PARAMETER_DRIFT/);
});
