import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {getPublicStructure} from '../../f02-1/schema-integrity.mjs';
import {connect,verify,ID,checksum} from './migration.mjs';
const mode=process.argv[2];
if(process.argv.length!==3||!['source','https'].includes(mode))throw Error('F05_6_EVIDENCE_MODE_INVALID');
const c=await connect();
try{
 const signed=await verify(c),catalog=await getPublicStructure(c);
 const versions=(await c.query('SELECT migration_id,checksum,structure_sha256 FROM public.f03_schema_migrations ORDER BY migration_id')).rows;
 if(versions.length!==20||versions[19].migration_id!==ID||versions[19].checksum!==checksum)throw Error('F05_6_INVALID_SIGNED_HISTORY');
 const counts=(await c.query(
 "SELECT (SELECT count(*)::int FROM public.find_car_applications) applications,"+
 "(SELECT count(*)::int FROM public.demands) demands,"+
 "(SELECT count(*)::int FROM public.f05_6_activation_events_ci) manualActivations,"+
 "(SELECT count(*)::int FROM public.customer_phone_facts) syntheticPhoneFacts,"+
 "(SELECT count(*)::int FROM public.f05_6_level_find_policy_ci) levelPolicies,"+
 "(SELECT count(*)::int FROM public.recommendations) recommendations,"+
 "(SELECT count(*)::int FROM public.customer_price_unlock_events) priceDebits"
 )).rows[0];
 const dir=new URL('./artifacts/'+mode+'/',import.meta.url);await mkdir(dir,{recursive:true});
 const save=(name,v)=>writeFile(new URL(name,dir),JSON.stringify(v,null,2)+'\n');
 await save('public-structure-native-pg16.json',catalog);
 await save('signed-m94-to-v22-version-ledger.json',{versions,signed,previousV21:versions[18],newV22:versions[19]});
 await save('physical-application-demand-source-facts.json',{
  authority:'PDM11_FINAL',migration:ID,
  oldSignedPreviousSha256:signed.precedingRecordsSHA256,
  customerActorOrigin:'CI_SYNTHETIC_CUSTOMER_ACTOR_NOT_PRODUCTION',
  phoneGateOrigin:'CI_SYNTHETIC_PHONE_GATE_NOT_PRODUCTION',
  findCarEntitlementOrigin:'CI_SYNTHETIC_FIND_CAR_ENTITLEMENT_NOT_PRODUCTION',
  demandActivationPermissionOrigin:'CI_SYNTHETIC_DEMAND_ACTIVATION_PERMISSION_NOT_PRODUCTION',
  productionCustomerSessionTrusted:false,productionPhoneAuthorizationTrusted:false,
  productionFindEntitlementIssuerTrusted:false,productionDemandActivationIssuerTrusted:false,
  originalM94ApplicationTable:true,originalM94DemandTable:true,originalM94PhoneFactTable:true,
  runId:process.env.GITHUB_RUN_ID,finalHeadSha:process.env.GITHUB_SHA,counts,
  countsSha256:createHash('sha256').update(JSON.stringify(counts)).digest('hex')
 });
 await save('production-source-gap-and-guard-status.json',{
  sourceGaps:['CUSTOMER_WECHAT_SESSION_TO_APPLICATION_ACTOR_SOURCE_GAP',
  'CUSTOMER_PHONE_AUTHORIZATION_ISSUER_SOURCE_GAP',
  'CUSTOMER_OWNER_REFERRED_ASSIGNMENT_POOL_SOURCE_GAP',
  'F05_6_PRODUCTION_LEVEL_FIND_ENTITLEMENT_ISSUER_SOURCE_GAP',
  'F05_6_DEMAND_ACTIVATION_PERMISSION_CURRENT_SCOPE_SOURCE_GAP',
  'F05_5_EMPLOYEE_ADDITION_SOURCE_GAP','CUSTOMER_DISPLAY_NUMERIC_PRICE_PRODUCTION_SOURCE_GAP',
  'F05_4_RECOMMENDATION_GRANT_ISSUER_SOURCE_GAP',
  'GENERAL_WHOLESALE_VEHICLE_SCOPE_SOURCE_GAP_PENDING_PRODUCT_DECISION'],
  productionCustomerApplicationAndEmployeeDemandHttpAllowed:false,
  businessState:'CI_ONLY_NOT_READY'
 });
 console.log('F05_6_NATIVE_V22_SIGNED_PG16_APPLICATION_DEMAND_EVIDENCE',JSON.stringify({catalogSha:catalog.sha256,counts}));
}finally{await c.end()}