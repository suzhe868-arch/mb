// Native PostgreSQL16 evidence: structural only, no token/customer row dump.
import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {getPublicStructure} from '../../f02-1/schema-integrity.mjs';
import {connect,verify,checksum,ID} from './migration.mjs';
if(process.argv.length!==3||process.argv[2]!=='--record')throw Error('F05_3B_EVIDENCE_ARGUMENT');
const c=await connect();
try{
 const check=await verify(c),cat=await getPublicStructure(c);
 const versions=(await c.query('SELECT migration_id,checksum,structure_sha256 FROM public.f03_schema_migrations ORDER BY migration_id')).rows;
 if(versions.length!==15||versions[13].structure_sha256!==check.priorSha||versions[14].structure_sha256!==check.newSha)
  throw Error('F05_3B_EVIDENCE_WRONG_MIGRATION_CHAIN');
 const counts=(await c.query('SELECT (SELECT count(*)::int FROM public.f05_3b_sync_credentials) credentials,(SELECT count(*)::int FROM public.f05_3b_sync_lineages) lineage,(SELECT count(*)::int FROM public.f05_3b_sync_receipts) receipts,(SELECT count(*)::int FROM public.f05_3b_control_audit) control_events,(SELECT count(*)::int FROM public.f05_3b_api_call_logs) http_calls')).rows[0];
 const dir=new URL('./artifacts/current/',import.meta.url);
 await mkdir(dir,{recursive:true});
 const put=(name,data)=>writeFile(new URL(name,dir),JSON.stringify(data,null,2)+'\n','utf8');
 await put('full-catalog.json',cat);
 await put('inventory.json',{
  version:ID,versionCount:versions.length,checksum,priorSchemaSha:check.priorSha,
  currentSchemaSha:check.newSha,objects:cat.objects.length,runId:process.env.GITHUB_RUN_ID,
  commitSha:process.env.GITHUB_SHA,realDatabase:'postgresql16_non_superuser_disposable',
  fixtureCountsWithoutPayload:counts
 });
 await put('versions-and-source-diff.json',{
  frozenPriorMigration:versions[13],newMigration:versions[14],
  priorSourceUnchanged:versions[13].structure_sha256===check.priorSha,
  sourceProof:'TRUE_AUTHENTICATED_CI_SYSTEM_ADMIN_GOVERNS_ISOLATED_API_CREDENTIAL',
  productionSource:'SOURCE_GAP_NOT_CONNECTED_TO_REAL_JYT_OR_LIVE_CONTROL_PLANE',
  noJytLoginToken:true,noUpstreamPhone:true,noProductionApi:true,
  ciOnly:true,sourceFingerprint:createHash('sha256').update(check.priorSha+checksum+check.newSha).digest('hex')
 });
 console.log('F05_3B_TRUE_NONPRIVILEGED_PG16_EVIDENCE',JSON.stringify({version:ID,sha:check.newSha,counts}));
}finally{await c.end()}
