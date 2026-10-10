// F04-1 source traceability and PG16 schema non-regression (independent CI instance).
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {connect,verify as verifyM94} from '../../../f03/runtime-transaction-responsible-handover/migration.mjs';
import {F04_ROUTE_CONTRACTS,createF04ContractHandler} from '../safe-router.mjs';
import {parseLegacyOpenApi,FORBIDDEN_LEGACY_ENDPOINTS,forbiddenKey,assertLegacyDecision} from '../parse-legacy-openapi.mjs';
const oldSource=readFileSync(new URL('../../../../09_历史工程资产基线/01_ENGINEERING_STARTER_LEGACY/packages/contracts/openapi.yaml',import.meta.url),'utf8');
const tsv=name=>{
 const [head,...rest]=readFileSync(new URL('../'+name,import.meta.url),'utf8').trimEnd().split('\n');
 const cols=head.split('\t');
 return rest.map(line=>Object.fromEntries(line.split('\t').map((v,i)=>[cols[i],v])));
};
const sourceLines=oldSource.split('\n');
const legacy=tsv('legacy-endpoint-inventory.tsv'),current=tsv('current-route-contracts.tsv');
const db=await connect();
test.after(async()=>db.end());
test('F04-I01 true physical PG16 M94 sealed; no new F04 schema or production migration',async()=>{
 assert.equal((await verifyM94(db)).verified,true);
 const count=(await db.query("SELECT count(*)::int n FROM pg_tables WHERE schemaname='public'")).rows[0].n;
 assert.equal(count,94);
 const x=(await db.query("SELECT count(*)::int n FROM public.f03_schema_migrations")).rows[0].n;
 assert.equal(x,12);
});
test('F04-I02 exact independent YAML source 198 distinct paths / 218 methods / 62 colon suffixed',()=>{
 const actual=parseLegacyOpenApi(oldSource);
 assert.equal(actual.paths.length,198);
 assert.equal(new Set(actual.paths.map(p=>p.path)).size,198);
 assert.equal(actual.endpoints.length,218);
 assert.equal(actual.paths.filter(p=>p.path.includes(':')).length,62);
 assert.equal(new Set(actual.endpoints.map(x=>x.method.toUpperCase()+' '+x.path)).size,218);
 assert.equal(legacy.length,218);
 assert.equal(new Set(legacy.map(r=>r.legacy_path)).size,198);
 assert.equal(new Set(legacy.map(r=>r.http_method+' '+r.legacy_path)).size,218);
 for(const [i,row] of legacy.entries()){
  assert.equal(row.legacy_id,'LEGACY-'+String(i+1).padStart(3,'0'));
  const x=actual.endpoints[i],line=Number(row.source_line);
  assert.equal(line,x.line,row.legacy_id+' HTTP source location');
  assert.equal(row.http_method,x.method.toUpperCase(),row.legacy_id+' method');
  assert.equal(row.legacy_path,x.path,row.legacy_id+' EXACT source key includes colon');
  assert.equal(row.operation_id,x.operationId,row.legacy_id+' operationId independent of path');
  assert.equal(sourceLines[line-1].trim(),row.http_method.toLowerCase()+':');
  assert.equal(sourceLines[x.pathLine-1],'  '+x.path+':');
  assert.equal(row.source_file,'09_历史工程资产基线/01_ENGINEERING_STARTER_LEGACY/packages/contracts/openapi.yaml');
  assert.ok(['C','E','P','INTEGRATION'].includes(row.current_UI_domain));
  assert.ok(['F04','F05','F06','F07'].includes(row.suggested_domain));
  assert.ok(row.sensitive_fields_gate.length>15);
  assert.ok(row.object_status_and_audit.includes('UNVERIFIED'));
  assert.ok(row.current_verified_scope.includes('NOT_VERIFIED'));
  assertLegacyDecision(row);
 }
});
test('F04-I02a correction delta contains exactly 62 previously attributed colon paths with source lines',()=>{
 const fixes=tsv('62条冒号路径修正对照.tsv');
 assert.equal(fixes.length,62);
 assert.equal(new Set(fixes.map(r=>r['旧编号'])).size,62);
 const index=new Map(legacy.map(r=>[r.legacy_id,r]));
 for(const r of fixes){
  const row=index.get(r['旧编号']);
  assert.ok(row);
  assert.equal(Number(r['原HTTP方法行']),Number(row.source_line));
  assert.equal(r['真实源路径'],row.legacy_path);
  assert.ok(row.legacy_path.includes(':'));
  assert.notEqual(r['错误路径'],r['真实源路径']);
 }
 for(const [id,path,method] of [
  ['LEGACY-004','/customer/me/phone:authorize','POST'],
  ['LEGACY-010','/customer/vehicles/{vehicle_id}/price-access:unlock','POST'],
  ['LEGACY-055','/staff/demands/{id}:pause','POST'],
  ['LEGACY-218','/admin/integrations/collector/connection:test','POST']
 ]){
  assert.equal(index.get(id).legacy_path,path);
  assert.equal(index.get(id).http_method,method);
 }
});
test('F04-I02b colon paths, adjacent multi-method paths and corrupt keys are independently rejected',()=>{
 const minimal='paths:\n  /first:close:\n    post:\n      operationId: post_first_close\n  /second:\n    get:\n      operationId: get_second\n    patch:\n      operationId: patch_second\ncomponents:\n';
 const p=parseLegacyOpenApi(minimal);
 assert.deepEqual(p.endpoints.map(x=>x.method.toUpperCase()+' '+x.path),
  ['POST /first:close','GET /second','PATCH /second']);
 const duplicatedPath=minimal.replace('  /second:', '  /first:close:');
 assert.throws(()=>parseLegacyOpenApi(duplicatedPath),/DUPLICATE_PATH/);
 const duplicateMethod=minimal.replace('    patch:', '    get:').replace('patch_second','get_second_patch');
 assert.throws(()=>parseLegacyOpenApi(duplicateMethod),/DUPLICATE_METHOD/);
 const duplicateOperation=minimal.replace('patch_second','get_second');
 assert.throws(()=>parseLegacyOpenApi(duplicateOperation),/OPERATION_ID_INVALID_OR_DUPLICATE/);
 const malformed=minimal.replace('  /first:close:', '  /first:close');
 assert.throws(()=>parseLegacyOpenApi(malformed),/NONCANONICAL_PATH/);
 const invalidIndent=minimal.replace('  /second:', '   /second:');
 assert.throws(()=>parseLegacyOpenApi(invalidIndent),/INVALID_PATH_INDENT/);
});
test('F04-I02c only three explicit prohibited Collector method-paths are retired',()=>{
 assert.equal(FORBIDDEN_LEGACY_ENDPOINTS.length,3);
 const retired=legacy.filter(r=>r.review_action==='RETIRE');
 assert.equal(retired.length,3);
 for(const forbidden of FORBIDDEN_LEGACY_ENDPOINTS){
  const rows=legacy.filter(r=>r.legacy_path===forbidden.path&&r.http_method===forbidden.method);
  assert.equal(rows.length,1);
  const r=rows[0];
  assert.equal(r.review_action,'RETIRE');
  assert.equal(r.review_status,'CURRENT_AUTHORITY_CONFIRMED_DO_NOT_RESTORE');
  assert.equal(r.current_stage,'FORBIDDEN');
  assert.ok(r.authority_evidence.includes('IA_V5_ACTION_CONTRACT'));
  assert.ok(r.pdm_final_authority.includes('DO_NOT_RESTORE'));
  for(const illegal of ['KEEP','MODIFY','REPLACE','UNREVIEWED_SOURCE_GAP']){
    assert.throws(()=>assertLegacyDecision({...r,review_action:illegal}),/FORBIDDEN_LEGACY_NOT_RETIRED/);
  }
  assert.throws(()=>assertLegacyDecision({...r,current_stage:'CONTRACT_ONLY'}),/FORBIDDEN_LEGACY_NOT_RETIRED/);
 }
 assert.equal(legacy.filter(r=>r.review_status==='UNREVIEWED_SOURCE_GAP').length,215);
 for(const row of legacy.filter(r=>!forbiddenKey(r.http_method,r.legacy_path))){
  assert.equal(row.review_action,'');
  assert.equal(row.review_status,'UNREVIEWED_SOURCE_GAP');
  assert.equal(row.next_review_owner,'F04_NEXT_AUTHORITY_MAPPING_WITH_A');
  assert.equal(row.current_stage,'SOURCE_GAP');
  assert.equal(row.authority_evidence,'UNVERIFIED');
  assert.equal(row.pdm_final_authority,'PDM_FINAL_ROW_AUTHORITY_NOT_MAPPED');
  assert.ok(row.source_gap_reason.includes('UNREVIEWED_SOURCE_GAP'));
  assertLegacyDecision(row);
  assert.throws(()=>assertLegacyDecision({...row,review_action:'MODIFY'}),/GAP_MISLABELED/);
 }
});
test('F04-I03 current routes belong to F04 explicit safe registry; no legacy routes as successful apps',()=>{
 assert.equal(current.length,F04_ROUTE_CONTRACTS.length);
 for(let i=0;i<current.length;i++){
  assert.equal(current[i].method,F04_ROUTE_CONTRACTS[i].method);
  assert.equal(current[i].path,F04_ROUTE_CONTRACTS[i].path);
  assert.equal(current[i].stage,F04_ROUTE_CONTRACTS[i].stage);
  assert.ok(!current[i].stage.includes('PRODUCTION'));
 }
 assert.equal(current.filter(r=>r.stage.startsWith('IMPLEMENTED_')).length,3);
 assert.equal(current.filter(r=>r.stage==='CONTRACT_ONLY').length,6);
});
test('F04-I04 F05 quota and customer price remain dependent on external authoritative state',()=>{
 for(const r of current.filter(x=>/price|locks|transactions|refunds/.test(x.path))){
  assert.equal(r.current_result,'OPEN_DEPENDENCY');
  assert.equal(r.stage,'CONTRACT_ONLY');
 }
});
test('F04-I05 publisher phone never uses old car_code identity and 4S cannot self-govern',()=>{
 const tel=current.find(x=>x.path.endsWith('/publisher-phone'));
 assert.equal(tel.future_owner,'F07');
 assert.equal(tel.current_result,'OPEN_DEPENDENCY');
 assert.ok(!tel.trusted_object_source.includes('car_code'));
 const four=current.find(x=>x.path.endsWith('/4s/accounts'));
 assert.equal(four.actor,'system_admin_current_session');
 assert.equal(four.stage,'CONTRACT_ONLY');
});
test('F04-I06 current route contract has no business success without real object ownership and current permissions',()=>{
 for(const row of current){
  if(['F04-R01','F04-R03'].includes(row.route_id))continue;
  assert.ok(['P_VEHICLE_SCOPE_UNPROVEN','OPEN_DEPENDENCY'].includes(row.current_result));
 }
});
test('F04-I07 current M94 rejects G14 migration masquerade and original F03-1 seal persists',async()=>{
 const x=await db.query("SELECT migration_id FROM public.f03_schema_migrations WHERE migration_id='000014_governance_completion'");
 assert.equal(x.rowCount,0);
 const seal=(await db.query('SELECT run_id FROM public.f03_isolation_seal')).rows;
 assert.equal(seal.length,1);assert.equal(seal[0].run_id,process.env.GITHUB_RUN_ID);
});
