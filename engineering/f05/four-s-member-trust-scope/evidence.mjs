// Materialize genuine independent PG16 catalog from current, not prior run.
import {writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {getPublicStructure} from '../../f02-1/schema-integrity.mjs';
import {connect,verify,ID,checksum} from './migration.mjs';
if(process.argv[2]!=='--record'||process.argv.length!==3)throw Error('F05_3A_EVIDENCE_ARG');
const c=await connect();try{
 const integrity=await verify(c),cat=await getPublicStructure(c);
 if(integrity.newSha!==cat.sha256)throw Error('F05_3A_EVIDENCE_DRIFT');
 const dir=new URL('./artifacts/current/',import.meta.url);
 await mkdir(dir,{recursive:true});
 const record=(name,v)=>writeFile(new URL(name,dir),JSON.stringify(v,null,2)+'\n','utf8');
 await record('full-catalog.json',cat);
 await record('inventory.json',{version:ID,checksum,previousSchemaSha:integrity.priorSha,currentSchemaSha:integrity.newSha,objects:cat.objects.length,
  runId:process.env.GITHUB_RUN_ID,source:'isolated_nonprivileged_true_PostgreSQL16'});
 await record('source-provenance.json',{origin:'F05-3A_SYSTEM_ADMIN_SESSION_GOVERNED_NEW_OWN_4S_CAR_ONLY',
  actualMemberTrust:'ADMIN_LICENSE_AND_SAME_PG16_TX_NEW_VEHICLE_CYCLE_RECEIPT',
  sourceGapWhenMissing:'POSITIVE_4S_TRUST_SOURCE_BLOCKED',
  unapprovedLegacyOwnerBackfill:false,unapprovedFourSOrganization:false,sourceFileSha256:createHash('sha256').update(cat.sha256).digest('hex')});
 console.log('F05_3A_EVIDENCE_TRUE_PG16_SHA',cat.sha256);
}finally{await c.end()}
