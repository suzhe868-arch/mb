import {connect,verify} from '../consultation-assignee-sla/migration.mjs';
import {getPublicStructure} from '../../f02-1/schema-integrity.mjs';
import {save} from './verify-matrix.mjs';
const mode=process.argv[2];
if(!['source','https'].includes(mode)||process.env.GITHUB_ACTIONS!=='true'||process.env.CI!=='true'||process.env.GITHUB_EVENT_NAME!=='push')
 throw Error('F05_11_EVIDENCE_WRONG_ENV');
const c=await connect();
try{
 const signed=await verify(c);if(!signed.verified)throw Error('F05_11_NOT_SIGNED');
 const catalog=await getPublicStructure(c);
 const ledger=(await c.query('SELECT migration_id,checksum,structure_sha256 FROM public.f03_schema_migrations ORDER BY migration_id')).rows;
 if(ledger.length!==24||ledger[23].structure_sha256!==catalog.sha256)throw Error('F05_11_LEDGER_CATALOG_DRIFT');
 const d1=(await c.query("SELECT seal_name,prior_ledger_sha256,old_public_catalog_sha256 FROM d1_owner_ci.attestation")).rows[0];
 if(!d1||d1.seal_name!=='D1_INDEPENDENT_FROM_SIGNED_V25'||d1.old_public_catalog_sha256!==ledger[22].structure_sha256)
  throw Error('F05_11_D1_NOT_SIGNED');
 await save(mode,{signed,catalogSha:catalog.sha256,ledgerCount:ledger.length,d1,producer:'true nonprivileged PostgreSQL16 CI',
   readOnlyAudit:true,nonProduction:true,neverF06Ready:true,head:process.env.GITHUB_SHA,runId:process.env.GITHUB_RUN_ID});
 console.log('F05_11_CROSS_DOMAIN_UNCHANGED__SIGNED_CATALOG',catalog.sha256);
}finally{await c.end()}
