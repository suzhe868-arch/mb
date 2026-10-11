// Non-production v19 true-PG16 schema and source evidence, no row-level PII.
import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {getPublicStructure} from '../../f02-1/schema-integrity.mjs';
import {connect,verify,ID,checksum} from '../favorite-physical-carrier/migration.mjs';
const mode=process.argv[2];
if(process.argv.length!==3||!['source','https'].includes(mode))throw Error('F05_3I_EVIDENCE_ARGS');
const db=await connect();
try{
 const a=await verify(db),cat=await getPublicStructure(db);
 const versions=(await db.query('SELECT migration_id,checksum,structure_sha256 FROM public.f03_schema_migrations ORDER BY migration_id')).rows;
 if(versions.length!==17||versions[15].structure_sha256!==a.oldSha||versions[16].structure_sha256!==a.newSha)
  throw Error('F05_3I_REAL_SEALED_CHAIN_NOT_VERIFIED');
 const counts=(await db.query(
  "SELECT (SELECT COUNT(*)::int FROM public.f05_3g_customer_favorites) current_carriers,"+
  "(SELECT COUNT(*)::int FROM public.f05_3g_favorite_events) append_only_events,"+
  "(SELECT COUNT(*)::int FROM public.f05_3c_wholesale_conversions) historical_conversions")).rows[0];
 const folder=new URL('./artifacts/'+mode+'/',import.meta.url);
 await mkdir(folder,{recursive:true});
 const write=async(name,value)=>writeFile(new URL(name,folder),JSON.stringify(value,null,2)+'\n','utf8');
 await write('full-catalog.json',cat);
 await write('v18-v19-conversion-signed-source.json',{priorVersion:versions[15],currentVersion:versions[16],priorSignedStructure:a.oldSha,currentSignedStructure:a.newSha,realCustomerSession:false});
 await write('inventory.json',{migration:ID,checksum,oldStructureSha:a.oldSha,currentStructureSha:a.newSha,
  ciRunId:process.env.GITHUB_RUN_ID,commitSha:process.env.GITHUB_SHA,
  physicalObjects:cat.objects.length,counts});
 await write('versions-and-source-diff.json',{preMigration:versions[15],current:versions[16],
  oldMigrations:16,newMigrations:17,
  dataCarrier:'V19_PREEXISTING_FAVORITE_BEFORE_SIGNED_CONVERSION',
  listingCycleNotPartOfFavoriteIdentity:true,realWechatCustomerSession:false,
  productionCustomerFavoriteEndpoint:false,syntheticCustomerContextOnly:true,
  signedConversionSupportsBothExactTrustedVersions:true,
  limitations:['NO_CURRENT_AUTHENTIC_WECHAT_CUSTOMER_SESSION',
   'GENERAL_WHOLESALE_VEHICLE_SCOPE_SOURCE_GAP',
   'HIDE_REASON_RECALCULATION_SOURCE_GAP','IMAGE_LOCALIZATION_SOURCE_GAP'],
  sourceFingerprint:createHash('sha256').update(a.oldSha+checksum+a.newSha).digest('hex')});
 console.log('F05_3I_REAL_PG16_V19_EVIDENCE',JSON.stringify({sha:a.newSha,counts}));
}finally{await db.end()}
