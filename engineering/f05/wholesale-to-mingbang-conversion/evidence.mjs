// Real isolated non-privileged PostgreSQL16 provenance and structural-only artifacts.
import {writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {getPublicStructure} from '../../f02-1/schema-integrity.mjs';
import {connect,verify,checksum,ID} from './migration.mjs';
if(process.argv[2]!=='--record'||process.argv.length!==3)throw Error('F05_3C_EVIDENCE_ARGUMENT');
const c=await connect();try{
 const a=await verify(c),cat=await getPublicStructure(c);
 const versions=(await c.query('SELECT migration_id,checksum,structure_sha256 FROM public.f03_schema_migrations ORDER BY migration_id')).rows;
 if(versions.length!==16||versions[14].structure_sha256!==a.priorSha||versions[15].structure_sha256!==a.newSha)
  throw Error('F05_3C_EVIDENCE_NOT_ACTUAL_PG16');
 const count=(await c.query(
  'SELECT (SELECT count(*)::int FROM public.f05_3c_wholesale_conversions) converted,'+
  '(SELECT count(*)::int FROM public.f05_3c_conversion_audit) audit,'+
  '(SELECT count(*)::int FROM public.f05_3b_sync_lineages) wholesale_lineages')).rows[0];
 const output=new URL('./artifacts/current/',import.meta.url);await mkdir(output,{recursive:true});
 async function put(name,v){await writeFile(new URL(name,output),JSON.stringify(v,null,2)+'\n','utf8')}
 await put('full-catalog.json',cat);
 await put('inventory.json',{version:ID,checksum,structure_sha256:a.newSha,
  prior_structure_sha256:a.priorSha,ciRunId:process.env.GITHUB_RUN_ID,commitSha:process.env.GITHUB_SHA,
  physicalCatalogObjects:cat.objects.length,countsWithoutRawCustomerRows:count});
 await put('versions-and-source-diff.json',{
  current:versions[15],frozenPrior:versions[14],oldVersionsCount:15,newVersionsCount:16,
  sourceAuthority:'REAL_F03_EMPLOYEE_SESSION_AND_CURRENT_BUSINESS_LOCK_OR_TRANSACTION_SCOPE_IN_DISPOSABLE_PG16',
  missingUnsignedWholesaleVehicleBusinessScope:'SOURCE_GAP_NOT_AUTO_ASSIGNED',
  imageLocalization:'IMAGE_LOCALIZATION_SOURCE_GAP',visibilityRuleCauses:'HIDE_REASON_RECALCULATION_SOURCE_GAP',
  favoritePhysicalCarrier:'FAVORITE_PHYSICAL_CARRIER_SOURCE_GAP',
  realJytConnection:false,productionRoutes:false,
  fingerprint:createHash('sha256').update(a.priorSha+checksum+a.newSha).digest('hex')
 });
 console.log('F05_3C_GENUINE_PG16_STRUCTURE',JSON.stringify({sha:a.newSha,counts:count}));
}finally{await c.end()}
