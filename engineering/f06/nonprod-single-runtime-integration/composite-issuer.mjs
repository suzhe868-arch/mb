// Brand-new strictly test-only issuer attestation. Nonprivileged PG16 and
// authentic current push SHA are mandatory; never rewrite GITHUB_REF.
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {assertCompositeSignedRun} from './可信Composite签名根.mjs';
import {verify as verifySignedF05} from '../../f05/consultation-assignee-sla/migration.mjs';
import {getPublicStructure} from '../../f02-1/schema-integrity.mjs';
export const sourceSQL=await readFile(new URL('./composite-issuer.sql',import.meta.url),'utf8');
const SOURCE_FILES=[
 ['./composite-issuer.sql','./composite-issuer.sql'],
 ['./composite-issuer.mjs','./composite-issuer.mjs'],
 ['./e2e-test','./tests/真实PG16单Runtime闭环验收.test.mjs'],
 ['./可信Composite签名根.mjs','./可信Composite签名根.mjs'],
 ['runtime','../../src/f06-nonprod-composite-runtime.mjs'],
 ['lock-service','../../src/f06-lock-service.mjs'],
 ['lock-readiness','../../src/f06-lock-readiness.mjs'],
 ['lock-http','../../src/f06-lock-http.mjs'],
 ['lock-lifecycle-service','../../src/f06-lock-lifecycle-service.mjs'],
 ['lock-lifecycle-http','../../src/f06-lock-lifecycle-http.mjs'],
 ['deposit-service','../deposit-ledger-ci/service.mjs'],
 ['transaction-service','../lock-transaction-http-pg16/service.mjs'],
 ['handoff-service','../transaction-handoff-http-pg16/service.mjs'],
 ['cancel-service','../transaction-cancel-http-pg16/service.mjs'],
 ['refund-service','../transaction-refund-http-pg16/service.mjs'],
 ['post-handoff-cancel-service','../post-handoff-cancel-http-pg16/service.mjs'],
 ['post-handoff-refund-proof','../post-handoff-refund-bridge-http-pg16/签名来源只读核验.mjs'],
 ['server','../../src/server.mjs'],
 ['app','../../src/app.mjs'],
 ['f03-auth-service','../../src/f03-auth-service.mjs'],
 ['f03-auth-crypto','../../src/f03-auth-crypto.mjs'],
 ['pr139-sidecar','../lock-transaction-http-pg16/sidecar.sql'],
 ['pr150-service','../transaction-refund-http-pg16/service.mjs'],
 ['pr150-sidecar','../transaction-refund-http-pg16/sidecar.sql'],
 ['pr146-service','../transaction-cancel-http-pg16/service.mjs'],
 ['pr146-sidecar','../transaction-cancel-http-pg16/sidecar.sql'],
 ['pr153-sidecar','../transaction-handoff-http-pg16/sidecar.sql'],
 ['pr156-sidecar','../post-handoff-cancel-http-pg16/sidecar.sql']
];
const lifecycleSources=[
 ['issue171-lifecycle-issuer','../nonprod-composite-lock-lifecycle/可信LifecycleIssuer.mjs'],
 ['issue171-lifecycle-sql','../nonprod-composite-lock-lifecycle/私有Lifecycle不可变侧车.sql'],
 ['issue171-lifecycle-http','../nonprod-composite-lock-lifecycle/生命周期HTTP适配.mjs'],
 ['issue171-lifecycle-tests','../nonprod-composite-lock-lifecycle/tests/原生Lifecycle验收.test.mjs'],
 ['issue171-legacy-lifecycle-regression','../nonprod-composite-lock-lifecycle/tests/旧Legacy生命周期真PG16定向验收.test.mjs'],
 ['issue171-signed-source-negative-tests','../nonprod-composite-lock-lifecycle/tests/签名来源负向边界验收.test.mjs']
];
async function digestVersionedSources(profile){
 const h=createHash('sha256');
 for(const [label,relative] of profile==='ISSUE171_COMPOSITE_LOCK_LIFECYCLE_NONPROD_V2'?[...SOURCE_FILES,...lifecycleSources]:SOURCE_FILES){
  const bytes=await readFile(new URL(relative,import.meta.url));
  h.update(label).update(Buffer.from([0])).update(bytes).update(Buffer.from([0]));
 }
 return h.digest('hex');
}
export const sourceSHA=await digestVersionedSources('ISSUE164_COMPOSITE_NONPROD_V1');
export async function sourceSHAForCurrentProfile(env=process.env){
 const profile=assertCompositeSignedRun(env).profile;
 return profile==='ISSUE164_COMPOSITE_NONPROD_V1'?sourceSHA:digestVersionedSources(profile);
}
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const one=async(c,q,p=[]) => (await c.query(q,p)).rows[0];
async function upstream(c){
 const issuer=assertCompositeSignedRun();
 const db=await one(c,"SELECT current_database() db,current_user who,current_setting('server_version_num')::int version,"+
 "(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) su,(SELECT rolcreatedb FROM pg_roles WHERE rolname=current_user) cdb,"+
 "(SELECT oid FROM pg_database WHERE datname=current_database()) db_oid");
 if(db.db!=='f03_auth_test'||db.who!=='f03_ci'||db.version<160000||db.version>=170000||db.su||db.cdb)
  throw Error('F06_COMPOSITE_SIGNED_SINGLE_NONPRIVILEGED_PG16_REQUIRED');
 const f05=await verifySignedF05(c);
 if(!f05.verified)throw Error('F06_COMPOSITE_SIGNED_F05_V26_REQUIRED');
 const ledger=(await c.query("SELECT migration_id,checksum,structure_sha256 FROM public.f03_schema_migrations ORDER BY migration_id")).rows;
 if(ledger.length!==24)throw Error('F06_COMPOSITE_24_SIGNED_MIGRATIONS_REQUIRED');
 const structure=await getPublicStructure(c);
 if(structure.sha256!==f05.catalogSHA)throw Error('F06_COMPOSITE_F05_PUBLIC_SIGNATURE_DRIFT');
 return {issuer,oid:db.db_oid,ledger:hash(ledger),publicSHA:structure.sha256,f05Checksum:f05.checksum};
}
export async function issueCompositeAttestation(c){
 const p=await upstream(c);
 const old=await one(c,"SELECT to_regnamespace('f06_composite_v1')::text name");
 if(old.name!==null)throw Error('F06_COMPOSITE_SIGNED_ISSUER_ALREADY_APPLIED');
 await c.query('BEGIN');
 try{
  await c.query("SELECT pg_advisory_xact_lock(20261021,1641)");
  await c.query(sourceSQL);
  await c.query("INSERT INTO f06_composite_v1.attestation"+
   "(seal_name,source_sha256,head_sha,run_id,github_ref,database_oid,ledger_sha256,public_catalog_sha256,parent_f05_checksum)"+
   "VALUES('COMPOSITE_NONPROD_SIGNED_V1',$1,$2,$3,$4,$5,$6,$7,$8)",[
    await sourceSHAForCurrentProfile(),p.issuer.sha,p.issuer.runId,process.env.GITHUB_REF,p.oid,p.ledger,p.publicSHA,p.f05Checksum]);
  await c.query('COMMIT');
 }catch(e){await c.query('ROLLBACK');throw e}
 return verifyCompositeAttestation(c);
}
export async function verifyCompositeAttestation(c){
 const p=await upstream(c);
 const a=await one(c,'SELECT * FROM f06_composite_v1.attestation FOR SHARE');
 if(!a||a.seal_name!=='COMPOSITE_NONPROD_SIGNED_V1'||a.source_sha256!==await sourceSHAForCurrentProfile()||
 a.head_sha!==p.issuer.sha||a.run_id!==p.issuer.runId||
 a.github_ref!==process.env.GITHUB_REF||
 String(a.database_oid)!==String(p.oid)||a.ledger_sha256!==p.ledger||
 a.public_catalog_sha256!==p.publicSHA||a.parent_f05_checksum!==p.f05Checksum)
  throw Error('F06_COMPOSITE_SIGNED_ISSUER_OR_PARENT_DRIFT');
 const objects=await one(c,"SELECT count(*)::int n FROM pg_trigger WHERE NOT tgisinternal AND"+
 " tgrelid IN('f06_composite_v1.attestation'::regclass,'f06_composite_v1.issued_events'::regclass)");
 if(objects.n!==2)throw Error('F06_COMPOSITE_IMMUTABLE_SOURCE_GAP');
 const shape=await one(c,"SELECT "+
 "to_regclass('f06_composite_v1.customer_sessions') IS NOT NULL customer_sessions,"+
 "to_regclass('f06_composite_v1.request_keys') IS NOT NULL request_keys,"+
 "to_regclass('f06_composite_v1.decision_keys') IS NOT NULL decision_keys,"+
 "to_regclass('f06_composite_v1.lock_snapshots') IS NOT NULL lock_snapshots,"+
 "to_regclass('f06_composite_v1.waitlist_sources') IS NOT NULL waitlist_sources,"+
 "to_regclass('f06_composite_v1.events') IS NOT NULL lock_events");
 if(!shape||Object.values(shape).some(x=>x!==true))throw Error('F06_COMPOSITE_LOCK_SOURCE_SHAPE_GAP');
 return Object.freeze({verified:true,nonProduction:true,issuer:'COMPOSITE_NONPROD_SIGNED_V1',
  sourceSHA:await sourceSHAForCurrentProfile(),headSHA:p.issuer.sha,runId:p.issuer.runId,databaseOid:p.oid,publicCatalogSHA:p.publicSHA});
}
