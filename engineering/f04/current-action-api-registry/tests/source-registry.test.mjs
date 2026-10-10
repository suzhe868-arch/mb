import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {connect,verify as verifyM94} from '../../../f03/runtime-transaction-responsible-handover/migration.mjs';
import {validateRegistry,loadContracts,verifyCurrentRegistry} from '../source-guard.mjs';
const db=await connect();test.after(()=>db.end());
const file=n=>readFileSync(new URL('../'+n,import.meta.url),'utf8');
const registry=file('current-route-contracts.tsv'),spec=file('current-openapi.json'),bridge=file('旧接口与Current动作桥接.tsv');
const modify=(id,field,value)=>{const lines=registry.trimEnd().split('\n'),heads=lines[0].split('\t');
 const i=lines.findIndex((x,j)=>j>0&&x.startsWith(id+'\t'));assert.ok(i>0);const row=lines[i].split('\t');row[heads.indexOf(field)]=value;lines[i]=row.join('\t');return lines.join('\n')+'\n'};
test('F04-3-A01 fresh independent M94 PG16 physical seal, source and catalog',async()=>{assert.equal((await verifyM94(db)).verified,true);assert.equal((await db.query("SELECT count(*)::int n FROM pg_tables WHERE schemaname='public'")).rows[0].n,94)});
test('F04-3-A02 23 verified + 6 new + 1 F04-1 restricted + 215/192/3 origin bridge',()=>{
 const x=verifyCurrentRegistry();assert.deepEqual({total:x.contracts,verified:x.verified,fresh:x.fresh,scoped:x.scoped,old:x.oldCandidates,gap:x.oldSourceGap,retired:x.retired}, {total:30,verified:23,fresh:6,scoped:1,old:215,gap:192,retired:3});
 assert.equal(loadContracts().filter(r=>r.http_contract_review_state==='NOT_APPROVED').length,30);
});
test('F04-3-A03 OpenAPI generated operation/source and exact CI-only gates, no second accepted 200',()=>{
 const s=JSON.parse(spec);let n=0;for(const methods of Object.values(s.paths))for(const v of Object.values(methods)){n++;assert.equal(v['x-not-production'],true);assert.equal(v['x-current-ci-only'],true)}assert.equal(n,30);
});
test('F04-3-A04 old URLs and 3 Collector forbidden routes cannot become reviewed Current APIs',()=>{
 const good=loadContracts();for(const r of good){assert.ok(r.path.startsWith('/__ci__/current/v1/'));assert.ok(!r.path.includes('collector'));assert.equal(r.production_enablement_status,'NOT_PRODUCTION');}
 assert.throws(()=>validateRegistry(modify('CURRENTACTION_VEHICLE_PUBLISH_079','path','/staff/vehicles/{id}:publish'),spec,bridge),/LEGACY_ROUTE_RESURRECTION|OPENAPI_CONTRACT_DRIFT/);
});
test('F04-3-A05 forged PDM, NAV and page evidence rejected even if text exists elsewhere',()=>{
 assert.throws(()=>validateRegistry(modify('CURRENTACTION_CONSULTATION_CREATE_019','nav_line','70'),spec,bridge),/VERIFIED_ACTION_DRIFT|WRONG_CURRENT_ACTION/);
 assert.throws(()=>validateRegistry(modify('CURRENTACTION_CONSULTATION_CREATE_019','page_id','E02-01'),spec,bridge),/FAKE_PDM_PAGE|OPENAPI_CONTRACT_DRIFT/);
 assert.throws(()=>validateRegistry(modify('CURRENTACTION_CONSULTATION_CREATE_019','pdm_line','99999'),spec,bridge),/FAKE_PDM_PAGE|OPENAPI_CONTRACT_DRIFT/);
});
test('F04-3-A06 proposed-only cannot forge existing contract approval, extra operation, or DTO private fields',()=>{
 assert.throws(()=>validateRegistry(modify('CURRENTACTION_CONSULTATION_CREATE_019','http_contract_review_state','APPROVED'),spec,bridge),/FAKE_AUTHORIZATION/);
 const copy=JSON.parse(spec);const path=Object.keys(copy.paths)[0];copy.paths[path].get={operationId:'FAKE_OLD_KEEP',responses:{'200':{description:'fake'}}};
 assert.throws(()=>validateRegistry(registry,JSON.stringify(copy),bridge),/OPENAPI_CONTRACT_DRIFT/);
});
test('F04-3-A07 proof of CRM minimal read cannot widen to full Customer or fake Vehicle scope',()=>{
 assert.throws(()=>validateRegistry(modify('CURRENTACTION_CRM_SCOPE_MINIMAL_PROOF','scope','ANY_VEHICLE_ANY_EMPLOYEE'),spec,bridge),/CRM_PROOF_EXPANSION|OPENAPI_CONTRACT_DRIFT|FAKE/);
});
test('F04-3-A08 Consultation PDM15, Waitlist PDM18 and F05 vehicle remain separate domains',()=>{
 const x=loadContracts(),a=x.find(r=>r.source_legacy_id==='LEGACY-019'),b=x.find(r=>r.source_legacy_id==='LEGACY-020');
 assert.ok(a.pdm_file.includes('PDM-15'));assert.ok(b.pdm_file.includes('PDM-18'));assert.equal(b.owner,'F06');assert.equal(a.owner,'OWNER_REVIEW_GAP');
});
