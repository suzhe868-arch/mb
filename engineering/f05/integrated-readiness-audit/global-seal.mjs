// R04 true post-remediation signed public + sidecar full-row immutable comparison.
// This module contains no UPDATE/DELETE/INSERT and never grants business privilege.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {connect,verify} from '../consultation-assignee-sla/migration.mjs';
import {getPublicStructure} from '../../f02-1/schema-integrity.mjs';
const mode=process.argv[2];
if(!['before','after'].includes(mode)||process.env.CI!=='true'||process.env.GITHUB_ACTIONS!=='true'||
 process.env.GITHUB_EVENT_NAME!=='push'||process.env.GITHUB_REF_NAME!=='feat/f05-11-cross-domain-readiness-audit')
 throw Error('F05_11_R04_UNAUTHORIZED_SEAL_CONTEXT');
const out=resolve('f05/integrated-readiness-audit/artifacts/source');
await mkdir(out,{recursive:true});
const file=resolve(out,'audit-global-seal-before.json');
const hex=o=>createHash('sha256').update(JSON.stringify(o)).digest('hex');
const requiredPublic=['customers','employee_permission_overrides','employee_capability_scope_bindings',
 'employee_data_scopes','employees','vehicles','vehicle_listing_cycles','consultations',
 'f05_10_consultation_meta_ci','f05_10_consultation_events_ci','customer_owner_history',
 'audit_events','f05_8_priority_ci','recommendations','vehicle_visibility_grants',
 'f05_9_price_right_ci','demands','locks','waitlists','transactions',
 'f03_schema_migrations'];
const requiredD1=['receipts','pool_cycles','attestation'];
const client=await connect();
async function observe(){
 const signed=await verify(client);
 assert.equal(signed.verified,true);
 const meta=(await client.query("SELECT current_database() db,current_user actor,pg_backend_pid() pid,"+
   "(SELECT oid::text FROM pg_database WHERE datname=current_database()) db_oid,"+
   "current_setting('server_version_num')::int ver,"+
   "(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) su,"+
   "(SELECT rolcreatedb FROM pg_roles WHERE rolname=current_user) cdb")).rows[0];
 assert.equal(meta.db,'f03_auth_test');assert.equal(meta.actor,'f03_ci');
 assert.equal(meta.su,false);assert.equal(meta.cdb,false);
 assert.ok(meta.ver>=160000&&meta.ver<170000);
 const paths=(await client.query("SELECT n.nspname s,c.relname t FROM pg_class c "+
  "JOIN pg_namespace n ON n.oid=c.relnamespace "+
  "WHERE n.nspname IN ('public','d1_owner_ci') AND c.relkind IN ('r','p') "+
  "ORDER BY n.nspname,c.relname")).rows;
 const set=new Set(paths.map(x=>x.s+'.'+x.t));
 for(const t of requiredPublic)assert.ok(set.has('public.'+t),'R04 missing signed '+t);
 for(const t of requiredD1)assert.ok(set.has('d1_owner_ci.'+t),'R04 missing sidecar '+t);
 const tables={};
 for(const {s,t} of paths){
  assert.match(s,/^(public|d1_owner_ci)$/);
  assert.match(t,/^[a-zA-Z0-9_]+$/);
  const result=(await client.query('SELECT count(*)::text n,'+
   "md5(COALESCE(string_agg(to_jsonb(x)::text,'|' ORDER BY to_jsonb(x)::text),'')) md5 "+
   'FROM "'+s+'"."'+t+'" x')).rows[0];
  tables[s+'.'+t]={count:result.n,md5:result.md5};
 }
 const catalog=await getPublicStructure(client);
 const ledger=(await client.query('SELECT migration_id,checksum,structure_sha256 FROM public.f03_schema_migrations ORDER BY migration_id')).rows;
 assert.equal(ledger.length,24);
 assert.equal(ledger[23].structure_sha256,catalog.sha256);
 const att=(await client.query('SELECT * FROM d1_owner_ci.attestation ORDER BY seal_name')).rows;
 assert.equal(att.length,1);assert.equal(att[0].seal_name,'D1_INDEPENDENT_FROM_SIGNED_V25');
 assert.equal(att[0].old_public_catalog_sha256,ledger[22].structure_sha256);
 return {head:process.env.GITHUB_SHA,runId:process.env.GITHUB_RUN_ID,meta,
  tableCount:paths.length,tables,publicCatalogSha256:catalog.sha256,
  signedMigrationLedgerSHA256:hex(ledger),signedD1AttestationSHA256:hex(att),
  fullDomainSHA256:hex(tables),signedMigrationRows:ledger.length};
}
try{
 const now=await observe();
 const scenarioOid=(await readFile('/tmp/f05-11-scenario-oid-'+process.env.GITHUB_RUN_ID,'utf8')).trim();
 assert.match(scenarioOid,/^[0-9]+$/);
 assert.notEqual(now.meta.db_oid,scenarioOid,'audit database must be a NEW physical PG database, not R01/R02 reused');
 if(mode==='before'){
  const f={...now,scenarioDbOid:scenarioOid,phase:'BEFORE_SIGNED_READ_ONLY_AUDIT'};
  await writeFile(file,JSON.stringify(f,null,2)+'\n',{flag:'wx'});
  console.log('F05_11_AUDIT_FRESH_DB_BEFORE_SEAL',JSON.stringify({scenarioDbOid:scenarioOid,
   auditDbOid:now.meta.db_oid,pid:now.meta.pid,tables:now.tableCount,hash:now.fullDomainSHA256}));
 }else{
  const before=JSON.parse(await readFile(file,'utf8'));
  assert.equal(before.phase,'BEFORE_SIGNED_READ_ONLY_AUDIT');
  assert.equal(before.head,now.head);assert.equal(before.runId,now.runId);
  assert.equal(before.meta.db_oid,now.meta.db_oid);
  assert.equal(before.scenarioDbOid,scenarioOid);
  assert.equal(now.tableCount,before.tableCount);
  assert.deepEqual(now.tables,before.tables,'R04 entire signed public+D1 table count/row MD5 drift');
  assert.equal(now.fullDomainSHA256,before.fullDomainSHA256);
  assert.equal(now.publicCatalogSha256,before.publicCatalogSha256);
  assert.equal(now.signedMigrationLedgerSHA256,before.signedMigrationLedgerSHA256);
  assert.equal(now.signedD1AttestationSHA256,before.signedD1AttestationSHA256);
  assert.equal(now.signedMigrationRows,24);
  const verified={status:'PASS',phase:'AFTER_ALL_REMEDIATION_AND_READ_ONLY_AUDIT',
   scenarioType:'REMEDIATION_BUSINESS_FIXTURE_DISPOSABLE',scenarioDbOid:scenarioOid,
   auditType:'READ_ONLY_SIGNED_AUDIT_UNCHANGED',auditDbOid:now.meta.db_oid,
   postRemediationTrueGlobalReadonlySeal:true,head:now.head,runId:now.runId,
   beforePid:before.meta.pid,afterPid:now.meta.pid,tableCount:now.tableCount,
   rowsByTable:now.tables,publicCatalogSha256:now.publicCatalogSha256,
   signedMigrationLedgerSHA256:now.signedMigrationLedgerSHA256,
   signedD1AttestationSHA256:now.signedD1AttestationSHA256,
   fullDomainSHA256:now.fullDomainSHA256,signedMigrationRows:24};
  await writeFile(resolve(out,'audit-global-seal-final.json'),JSON.stringify(verified,null,2)+'\n',{flag:'wx'});
  console.log('F05_11_POST_REMEDIATION_TRUE_GLOBAL_READONLY_SEAL_PASS',JSON.stringify({head:now.head,
   scenarioDbOid:scenarioOid,auditDbOid:now.meta.db_oid,beforePid:before.meta.pid,
   afterPid:now.meta.pid,tableCount:now.tableCount,fullDomainSHA256:now.fullDomainSHA256,
   catalogSha256:now.publicCatalogSha256,ledgerSha256:now.signedMigrationLedgerSHA256,
   d1AttestationSha256:now.signedD1AttestationSHA256}));
 }
}finally{await client.end()}
