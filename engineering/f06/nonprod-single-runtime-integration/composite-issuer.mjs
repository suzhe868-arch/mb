// Brand-new strictly test-only issuer attestation. Nonprivileged PG16 and
// authentic current push SHA are mandatory; never rewrite GITHUB_REF.
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {assertCompositeSignedRun} from './可信Composite签名根.mjs';
import {verify as verifySignedF05} from '../../f05/consultation-assignee-sla/migration.mjs';
import {getPublicStructure} from '../../f02-1/schema-integrity.mjs';
export const sourceSQL=await readFile(new URL('./composite-issuer.sql',import.meta.url),'utf8');
export const sourceSHA=createHash('sha256').update(sourceSQL).digest('hex');
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
    sourceSHA,p.issuer.sha,p.issuer.runId,process.env.GITHUB_REF,p.oid,p.ledger,p.publicSHA,p.f05Checksum]);
  await c.query('COMMIT');
 }catch(e){await c.query('ROLLBACK');throw e}
 return verifyCompositeAttestation(c);
}
export async function verifyCompositeAttestation(c){
 const p=await upstream(c);
 const a=await one(c,'SELECT * FROM f06_composite_v1.attestation FOR SHARE');
 if(!a||a.seal_name!=='COMPOSITE_NONPROD_SIGNED_V1'||a.source_sha256!==sourceSHA||
 a.head_sha!==p.issuer.sha||a.run_id!==p.issuer.runId||
 a.github_ref!==process.env.GITHUB_REF||
 String(a.database_oid)!==String(p.oid)||a.ledger_sha256!==p.ledger||
 a.public_catalog_sha256!==p.publicSHA||a.parent_f05_checksum!==p.f05Checksum)
  throw Error('F06_COMPOSITE_SIGNED_ISSUER_OR_PARENT_DRIFT');
 const objects=await one(c,"SELECT count(*)::int n FROM pg_trigger WHERE NOT tgisinternal AND"+
 " tgrelid IN('f06_composite_v1.attestation'::regclass,'f06_composite_v1.issued_events'::regclass)");
 if(objects.n!==2)throw Error('F06_COMPOSITE_IMMUTABLE_SOURCE_GAP');
 return Object.freeze({verified:true,nonProduction:true,issuer:'COMPOSITE_NONPROD_SIGNED_V1',
  sourceSHA,headSHA:p.issuer.sha,runId:p.issuer.runId,databaseOid:p.oid,publicCatalogSHA:p.publicSHA});
}
