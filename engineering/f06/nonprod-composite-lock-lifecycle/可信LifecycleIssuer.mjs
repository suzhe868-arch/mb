// Issue171: strictly nonproduction single-PG signed Lifecycle carrier.
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {assertCompositeSignedRun} from '../nonprod-single-runtime-integration/可信Composite签名根.mjs';
import {verifyCompositeAttestation,sourceSHAForCurrentProfile} from '../nonprod-single-runtime-integration/composite-issuer.mjs';
export const sourceSQL=await readFile(new URL('./私有Lifecycle不可变侧车.sql',import.meta.url),'utf8');
const sha=x=>createHash('sha256').update(x).digest('hex');
const sealName='ISSUE171_COMPOSITE_LIFECYCLE_SIGNED_V2';
async function signedRoot(db,env=process.env){
 const run=assertCompositeSignedRun(env);
 if(run.profile!=='ISSUE171_COMPOSITE_LOCK_LIFECYCLE_NONPROD_V2')
  throw Error('F06_171_NEW_REAL_PUSH_PROFILE_REQUIRED');
 const parent=await verifyCompositeAttestation(db);
 if(!parent.verified||parent.headSHA!==run.sha||parent.runId!==run.runId)
  throw Error('F06_171_SIGNED_COMPOSITE_PARENT_MISSING');
 const oid=(await db.query("SELECT oid::text oid FROM pg_database WHERE datname=current_database()")).rows[0].oid;
 if(String(oid)!==String(parent.databaseOid))throw Error('F06_171_PHYSICAL_PG16_OID_MISMATCH');
 const source=await sourceSHAForCurrentProfile(env);
 return {run,parent,oid,source,issuerSHA:sha('F06_171_LIFECYCLE_V2:'+sourceSQL+':'+source)};
}
export async function issueLifecycleIssuer(db,env=process.env){
 const root=await signedRoot(db,env);
 const old=(await db.query("SELECT to_regnamespace('f06_composite_lifecycle_v2') IS NOT NULL present")).rows[0];
 if(old?.present)throw Error('F06_171_PRIVATE_LIFECYCLE_ALREADY_ISSUED');
 await db.query('BEGIN');
 try{
  await db.query("SELECT pg_advisory_xact_lock(20261021,1712)");
  await db.query(sourceSQL);
  await db.query("INSERT INTO f06_composite_lifecycle_v2.attestation "+
   "(seal_name,source_sha256,parent_source_sha256,head_sha,run_id,github_ref,database_oid) "+
   "VALUES($1,$2,$3,$4,$5,$6,$7)",
   [sealName,root.issuerSHA,root.parent.sourceSHA,root.run.sha,root.run.runId,env.GITHUB_REF,root.oid]);
  await db.query('COMMIT');
 }catch(e){await db.query('ROLLBACK');throw e}
 return verifyLifecycleIssuer(db,env);
}
export async function verifyLifecycleIssuer(db,env=process.env){
 const root=await signedRoot(db,env);
 const a=(await db.query("SELECT * FROM f06_composite_lifecycle_v2.attestation FOR SHARE")).rows[0];
 if(!a||a.seal_name!==sealName||a.source_sha256!==root.issuerSHA||
  a.parent_source_sha256!==root.parent.sourceSHA||a.head_sha!==root.run.sha||
  a.run_id!==root.run.runId||a.github_ref!==env.GITHUB_REF||
  String(a.database_oid)!==String(root.oid))
  throw Error('F06_171_LIFECYCLE_ISSUER_OR_PARENT_SIGNATURE_DRIFT');
 const triggers=(await db.query("SELECT count(*)::int n FROM pg_trigger WHERE NOT tgisinternal "+
  "AND tgrelid IN ('f06_composite_lifecycle_v2.attestation'::regclass,"+
  "'f06_composite_lifecycle_v2.lock_lifecycle_events'::regclass)")).rows[0];
 if(triggers?.n!==2)throw Error('F06_171_LIFECYCLE_HISTORY_NOT_IMMUTABLE');
 return Object.freeze({verified:true,issuer:sealName,parentSHA:a.parent_source_sha256,
  sourceSHA:a.source_sha256,sha:a.head_sha,runId:a.run_id,oid:String(a.database_oid),productionReady:false});
}
