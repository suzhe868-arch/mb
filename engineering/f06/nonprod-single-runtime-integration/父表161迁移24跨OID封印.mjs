import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import pg from 'pg';
import {getPublicStructure} from '../../f02-1/schema-integrity.mjs';

const mode=process.argv[2];
const expectedTableCount=161;
const schemas=['public','d1_owner_ci','f06_1_lock_ci','f06_2_ci'];
const sourceUrl=process.env.F03_1_DATABASE_URL;
const baselineUrl=process.env.F06_164_BASELINE_DATABASE_URL;
const restoreUrl=process.env.F06_164_RESTORE_DATABASE_URL;
const evidenceDir=resolve('engineering/f06/nonprod-single-runtime-integration/evidence');
const beforePath=resolve(evidenceDir,'父表161迁移24Seal_before.json');
const afterPath=resolve(evidenceDir,'父表161迁移24Seal_after.json');
const mutableScenarioTables=new Set([
 'public.employee_team_memberships',
 'public.employee_data_scopes',
 'public.employee_permission_overrides',
 'public.employee_capability_scope_bindings',
 'public.pc_login_accounts',
 'public.pc_auth_sessions',
 'public.permissions',
 'public.customers',
 'public.customer_phone_facts',
 'public.vehicles',
 'public.vehicle_listing_cycles',
 'public.vehicle_price_history',
 'public.lock_requests',
 'public.locks',
 'public.waitlists',
 'public.deposit_receipts',
 'public.transactions',
 'public.refund_cases',
 'public.audit_events',
 'public.vehicle_current_responsibilities',
 'public.vehicle_responsibility_audit_events'
]);
const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const one=async(client,sql,args=[]) => (await client.query(sql,args)).rows[0];

function requireEnvironment(){
 assert.equal(process.env.GITHUB_REPOSITORY,'suzhe868-arch/mb');
 assert.equal(process.env.GITHUB_EVENT_NAME,'push');
 assert.equal(process.env.GITHUB_ACTIONS,'true');
 assert.equal(process.env.CI,'true');
 assert.equal(process.env.APP_ENV,'test');
 assert.equal(process.env.NODE_ENV,'test');
 const branch=process.env.GITHUB_REF_NAME;
 assert.ok(['feat/f06-nonprod-single-runtime-trusted-source-01','feat/f06-nonprod-composite-lock-lifecycle-01','feat/f05-f06-same-vehicle-signed-bridge-pg16-01'].includes(branch));
 assert.equal(process.env.GITHUB_REF,'refs/heads/'+branch);
 assert.match(process.env.GITHUB_SHA||'',/^[a-f0-9]{40}$/);
 assert.match(process.env.GITHUB_RUN_ID||'',/^[0-9]{6,20}$/);
 assert.ok(sourceUrl&&baselineUrl);
 if(mode==='after')assert.ok(restoreUrl);
 assert.ok(['before','after'].includes(mode),'mode must be before or after');
}
async function connect(url){
 const client=new pg.Client({connectionString:url,connectionTimeoutMillis:5000,statement_timeout:15000});
 await client.connect();
 return client;
}
async function identity(client,label){
 const row=await one(client,
  "SELECT current_database() db,current_user usr,current_setting('server_version_num')::int version,"+
  "pg_backend_pid() pid,(SELECT oid::text FROM pg_database WHERE datname=current_database()) oid,"+
  "(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) superuser,"+
  "(SELECT rolcreatedb FROM pg_roles WHERE rolname=current_user) can_create_database");
 assert.equal(row.usr,'f03_ci',label+' must use f03_ci');
 assert.equal(row.superuser,false,label+' must not be superuser');
 assert.equal(row.can_create_database,false,label+' role must not create databases');
 assert.ok(row.version>=160000&&row.version<170000,label+' must use PostgreSQL 16');
 return {database:row.db,user:row.usr,oid:String(row.oid),pid:Number(row.pid),version:row.version};
}
async function tableNames(client){
 return (await client.query(
  "SELECT n.nspname s,r.relname t FROM pg_class r JOIN pg_namespace n ON n.oid=r.relnamespace "+
  "WHERE n.nspname=ANY($1::text[]) AND r.relkind IN('r','p') ORDER BY n.nspname,r.relname",[schemas]
 )).rows.map(row=>row.s+'.'+row.t);
}
async function readTableMap(client){
 const names=await tableNames(client);
 assert.equal(names.length,expectedTableCount,'signed parent table inventory must be exactly 161');
 const result={};
 for(const name of names){
  const parts=name.split('.');
  assert.equal(parts.length,2);
  assert.match(parts[0],/^[a-z0-9_]+$/);
  assert.match(parts[1],/^[a-z0-9_]+$/);
  const ident='"'+parts[0]+'"."'+parts[1]+'"';
  const row=await one(client,
   "SELECT count(*)::int n,md5(COALESCE(string_agg(to_jsonb(x)::text,'|' ORDER BY to_jsonb(x)::text),'')) h FROM "+ident+" x");
  result[name]={rows:Number(row.n),md5:row.h};
 }
 return result;
}
async function signedMetadata(client,label){
 const ledger=(await client.query(
  'SELECT migration_id,checksum,structure_sha256 FROM public.f03_schema_migrations ORDER BY migration_id')).rows;
 assert.equal(ledger.length,24,label+' must retain exactly 24 signed migrations');
 const catalog=await getPublicStructure(client);
 assert.equal(ledger.at(-1).structure_sha256,catalog.sha256,label+' migration/catalog seal mismatch');
 const attestations={};
 for(const table of ['d1_owner_ci.attestation','f06_1_lock_ci.attestation','f06_2_ci.attestation']){
  const [schema,name]=table.split('.');
  const rows=await client.query('SELECT to_jsonb(x) AS row FROM "'+schema+'"."'+name+'" x ORDER BY to_jsonb(x)::text');
  assert.equal(rows.rowCount,1,label+' must retain one signed attestation in '+table);
  attestations[table]=rows.rows.map(row=>row.row);
 }
 return {ledger,catalogSHA:catalog.sha256,attestations};
}
async function snapshot(client,label){
 const id=await identity(client,label);
 const names=await tableNames(client);
 assert.equal(names.length,expectedTableCount,label+' table inventory drift');
 const tableMap=await readTableMap(client);
 const signed=await signedMetadata(client,label);
 return {
  label,identity:id,tableNames:names,tableCount:names.length,tableMap,
  tableSeal:digest(tableMap),ledger:signed.ledger,ledgerSeal:digest(signed.ledger),
  catalogSHA:signed.catalogSHA,attestations:signed.attestations,
  attestationSeal:digest(signed.attestations)
 };
}
function assertSameParentSeal(left,right,label){
 assert.deepEqual(left.tableNames,right.tableNames,label+' parent table inventory drift');
 assert.deepEqual(left.tableMap,right.tableMap,label+' full 161-table COUNT/MD5 seal drift');
 assert.equal(left.tableSeal,right.tableSeal,label+' full table seal mismatch');
 assert.deepEqual(left.ledger,right.ledger,label+' 24 migration ledger drift');
 assert.equal(left.ledgerSeal,right.ledgerSeal,label+' ledger seal mismatch');
 assert.equal(left.catalogSHA,right.catalogSHA,label+' public catalog drift');
 assert.deepEqual(left.attestations,right.attestations,label+' parent attestation drift');
 assert.equal(left.attestationSeal,right.attestationSeal,label+' parent attestation seal mismatch');
}
requireEnvironment();
await mkdir(evidenceDir,{recursive:true});
if(mode==='before'){
 const scenario=await connect(sourceUrl);
 const baseline=await connect(baselineUrl);
 try{
  const s=await snapshot(scenario,'single-runtime scenario before business E2E');
  const b=await snapshot(baseline,'independent parent baseline');
  assert.equal(s.identity.database,'f03_auth_test');
  assert.equal(b.identity.database,'f03_auth_baseline');
  assert.notEqual(s.identity.oid,b.identity.oid,'scenario and baseline must use different physical database OIDs');
  assert.notEqual(s.identity.pid,b.identity.pid,'scenario and baseline must use independent PostgreSQL backends');
  assertSameParentSeal(s,b,'before-E2E cross-OID baseline');
  const evidence={sha:process.env.GITHUB_SHA,runId:process.env.GITHUB_RUN_ID,scenario:s,baseline:b};
  await writeFile(beforePath,JSON.stringify(evidence,null,2)+'\n',{flag:'wx'});
  console.log('F06_164_PARENT_161_TABLE_24_LEDGER_CROSS_OID_BASELINE_PASS '+JSON.stringify({
   sha:evidence.sha,runId:evidence.runId,tableCount:expectedTableCount,migrationCount:24,
   scenarioOid:s.identity.oid,baselineOid:b.identity.oid,
   scenarioSeal:s.tableSeal,baselineSeal:b.tableSeal,ledgerSeal:s.ledgerSeal,
   catalogSHA:s.catalogSHA,attestationSeal:s.attestationSeal
  }));
 }finally{await scenario.end();await baseline.end()}
}else{
 const before=JSON.parse(await readFile(beforePath,'utf8'));
 assert.equal(before.sha,process.env.GITHUB_SHA,'seal evidence must use the current final SHA');
 assert.equal(before.runId,process.env.GITHUB_RUN_ID,'seal evidence must use the current official Run ID');
 const scenario=await connect(sourceUrl);
 const baseline=await connect(baselineUrl);
 const restore=await connect(restoreUrl);
 try{
  const s=await snapshot(scenario,'single-runtime scenario after business E2E');
  const b=await snapshot(baseline,'untouched parent baseline');
  const r=await snapshot(restore,'independent restored parent baseline');
  assert.equal(s.identity.database,'f03_auth_test');
  assert.equal(b.identity.database,'f03_auth_baseline');
  assert.equal(r.identity.database,'f03_auth_restore');
  assert.equal(s.identity.oid,before.scenario.identity.oid,'scenario database OID changed during E2E');
  assert.equal(b.identity.oid,before.baseline.identity.oid,'parent baseline OID changed');
  assert.notEqual(r.identity.oid,b.identity.oid,'restored parent database must have a different physical OID');
  assert.notEqual(r.identity.oid,s.identity.oid,'restored parent database must differ from scenario OID');
  assertSameParentSeal(b,before.baseline,'untouched parent baseline');
  assertSameParentSeal(r,before.baseline,'restored parent baseline');
  assert.deepEqual(s.tableNames,before.scenario.tableNames,'scenario parent table inventory changed');
  assert.deepEqual(s.ledger,before.scenario.ledger,'scenario changed the 24 signed migrations');
  assert.equal(s.ledgerSeal,before.scenario.ledgerSeal,'scenario migration ledger seal changed');
  assert.equal(s.catalogSHA,before.scenario.catalogSHA,'scenario changed the public schema catalog');
  assert.deepEqual(s.attestations,before.scenario.attestations,'scenario changed frozen parent attestations');
  assert.equal(s.attestationSeal,before.scenario.attestationSeal,'scenario parent attestation seal changed');
  const changedScenarioTables=Object.keys(before.scenario.tableMap).filter(
   name=>JSON.stringify(before.scenario.tableMap[name])!==JSON.stringify(s.tableMap[name])).sort();
  const unauthorizedParentDrift=changedScenarioTables.filter(name=>!mutableScenarioTables.has(name));
  assert.deepEqual(unauthorizedParentDrift,[],
   'scenario may change only explicitly listed synthetic/business tables; unexpected parent table drift');
  const proof={
   sha:process.env.GITHUB_SHA,runId:process.env.GITHUB_RUN_ID,
   tableCount:expectedTableCount,migrationCount:24,
   sourceOidBefore:before.scenario.identity.oid,baselineOid:before.baseline.identity.oid,
   restoreOid:r.identity.oid,sourceBaselineSeal:before.scenario.tableSeal,
   baselineSeal:b.tableSeal,restoredSeal:r.tableSeal,
   migrationLedgerSHA:s.ledgerSeal,publicCatalogSHA:s.catalogSHA,
   parentAttestationSHA:s.attestationSeal,changedScenarioTables,
   unauthorizedParentDrift:unauthorizedParentDrift.length!==0,
   productionReady:false
  };
  await writeFile(afterPath,JSON.stringify(proof,null,2)+'\n',{flag:'wx'});
  console.log('F06_164_DIFFERENT_OID_161_TABLE_24_LEDGER_SEAL_PASS '+JSON.stringify(proof));
 }finally{await scenario.end();await baseline.end();await restore.end()}
}