// F05-4 real isolated PG16 catalog, history and consent-source evidence.
import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {getPublicStructure} from '../../f02-1/schema-integrity.mjs';
import {connect,verify,ID,checksum} from './migration.mjs';
const mode=process.argv[2];
if(process.argv.length!==3||!['source','https'].includes(mode))throw Error('F05_4_EVIDENCE_ARGS');
const c=await connect();
try{
 const signed=await verify(c),cat=await getPublicStructure(c);
 const versions=(await c.query('SELECT migration_id,checksum,structure_sha256 FROM public.f03_schema_migrations ORDER BY migration_id')).rows;
 if(versions.length!==18||versions[17].migration_id!==ID||versions[17].checksum!==checksum)
  throw Error('F05_4_SIGNED_V20_HISTORY_MISSING');
 const tally=(await c.query(
  'SELECT (SELECT count(*)::int FROM public.customer_day_quota_ledger) days,'+
  '(SELECT count(*)::int FROM public.customer_price_cycle_unlocks) cycleRights,'+
  '(SELECT count(*)::int FROM public.customer_price_unlock_events) chargeEvents,'+
  '(SELECT count(*)::int FROM public.f05_4_level_price_policy_ci) syntheticPolicies,'+
  '(SELECT count(*)::int FROM public.f05_4_current_price_ci) syntheticPrices')).rows[0];
 const path=new URL('./artifacts/'+mode+'/',import.meta.url);
 await mkdir(path,{recursive:true});
 const write=async(f,val)=>writeFile(new URL(f,path),JSON.stringify(val,null,2)+'\n');
 await write('full-catalog.json',cat);
 await write('versions.json',{versions,signed,oldHistoryLedgerSha256:signed.precedingRecordsSha256,
  v17Version:versions[14],v18Version:versions[15],v19Version:versions[16],v20Version:versions[17]});
 await write('physical-source-audit.json',{
  task:'PDM10_F05_4_CI_ONLY_SYNTHETIC_ENTITLEMENT',
  version:ID,sha:signed.newSha,checksum,actualSource:'M94_TO_V19_PLUS_SEALED_V20',
  actualCustomerSessionIssuer:false,actualCustomerDisplayPriceIssuer:false,
  syntheticLevelPricePolicy:true,syntheticPriceFactsOnly:true,
  signedRecommendationGrantIssuer:false,signedEmployeeTemporaryQuotaIssuer:false,
  realWechatOrJytProvider:false,realPaymentOrPhoneProvider:false,
  generatedUnderGitHubActionsRunId:process.env.GITHUB_RUN_ID,
  githubHeadSha:process.env.GITHUB_SHA,notProduction:true,counts:tally
 });
 await write('source-gap-and-security.json',{
  sourceGaps:['CUSTOMER_WECHAT_SESSION_TO_FAVORITE_ACTOR_SOURCE_GAP',
  'CUSTOMER_DISPLAY_NUMERIC_PRICE_PRODUCTION_SOURCE_GAP',
  'F05_4_RECOMMENDATION_GRANT_ISSUER_SOURCE_GAP',
  'F05_4_EMPLOYEE_QUOTA_ADDITION_CURRENT_SCOPE_SOURCE_GAP',
  'GENERAL_WHOLESALE_VEHICLE_SCOPE_SOURCE_GAP_PENDING_PRODUCT_DECISION',
  'HIDE_REASON_RECALCULATION_SOURCE_GAP','IMAGE_LOCALIZATION_SOURCE_GAP'],
  noCustomerLiveDetailHttp200:true,
  proofSha256:createHash('sha256').update(JSON.stringify(versions)+signed.newSha).digest('hex')
 });
 console.log('F05_4_NATIVE_PG16_SIGNED_HISTORY_CATALOG',JSON.stringify({signedVersion:ID,structureSha256:signed.newSha,counts:tally}));
}finally{await c.end()}
