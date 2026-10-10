// F04-1 source traceability and PG16 schema non-regression (independent CI instance).
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {connect,verify as verifyM94} from '../../../f03/runtime-transaction-responsible-handover/migration.mjs';
import {F04_ROUTE_CONTRACTS,createF04ContractHandler} from '../safe-router.mjs';
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
test('F04-I02 all 218 original method+path rows have exact source line and no invented 219th',()=>{
 assert.equal(legacy.length,218);
 assert.equal(new Set(legacy.map(r=>r.legacy_path)).size,136);
 for(const [i,row] of legacy.entries()){
  assert.equal(row.legacy_id,'LEGACY-'+String(i+1).padStart(3,'0'));
  const line=Number(row.source_line);
  assert.ok(line>10&&line<=sourceLines.length);
  assert.equal(sourceLines[line-1].trim(),row.http_method.toLowerCase()+':');
  let located=false;
  for(let k=line-2;k>=0;k--){
    if(/^  \/[^:]*:\s*$/.test(sourceLines[k])){located=sourceLines[k]==='  '+row.legacy_path+':';break;}
  }
  assert.ok(located,'PROVENANCE_PATH_LINE_ERROR '+row.legacy_id);
  assert.equal(row.current_stage,'CONTRACT_ONLY');
  assert.equal(row.review_action,'MODIFY');
  assert.ok(['F04','F05','F06','F07'].includes(row.suggested_domain));
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
