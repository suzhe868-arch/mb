import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {getPublicStructure} from '../../f02-1/schema-integrity.mjs';
import {connect,verify,ID,checksum} from './migration.mjs';
const mode=process.argv[2];
if(process.argv.length!==3||!['source','https'].includes(mode))throw Error('F05_7_EVIDENCE_MODE_INVALID');
const c=await connect();
try{
 const signed=await verify(c),catalog=await getPublicStructure(c);
 const versions=(await c.query('SELECT migration_id,checksum,structure_sha256 FROM public.f03_schema_migrations ORDER BY migration_id')).rows;
 if(versions.length!==21||versions[20].migration_id!==ID||versions[20].checksum!==checksum)throw Error('F05_7_INVALID_MIGRATION_HISTORY');
 const counts=(await c.query('SELECT '+
  '(SELECT count(*)::int FROM public.f05_7_rule_dictionary_ci) rules,'+
  '(SELECT count(*)::int FROM public.f05_7_sales_condition_ci) conditions,'+
  '(SELECT count(*)::int FROM public.f05_7_vehicle_facts_ci) facts,'+
  '(SELECT count(*)::int FROM public.f05_7_result_versions_ci) history,'+
  "(SELECT count(*)::int FROM public.f05_7_result_versions_ci WHERE status='current') currentResults,"+
  '(SELECT count(*)::int FROM public.recommendations) recommendations,'+
  '(SELECT count(*)::int FROM public.customer_price_unlock_events) priceDebits,'+
  '(SELECT count(*)::int FROM public.f05_6_activation_events_ci) demandActivations')).rows[0];
 const dir=new URL('./artifacts/'+mode+'/',import.meta.url);await mkdir(dir,{recursive:true});
 const save=(name,x)=>writeFile(new URL(name,dir),JSON.stringify(x,null,2)+'\n');
 await save('native-real-pg16-structure.json',catalog);
 await save('signed-m94-v23-ledger.json',{signed,versions,preceding20:versions.slice(0,20)});
 await save('fact-rule-matching-native-pg16-evidence.json',{
  authority:'PDM12_FINAL',migration:ID,origin:'CI_SYNTHETIC_MATCHING_INPUTS_NOT_PRODUCTION',
  finalHeadSha:process.env.GITHUB_SHA,runId:process.env.GITHUB_RUN_ID,
  productionMatchingIssuerExists:false,productionRuleIssuerExists:false,
  counts,countsHash:createHash('sha256').update(JSON.stringify(counts)).digest('hex')
 });
 await save('production-source-gap.json',{productionHttpMatchingAllowed:false,productionRuleManageAllowed:false,
  missing:['WECHAT_CUSTOMER_SESSION','PHONE_AUTHORIZATION','FIND_ENTITLEMENT_ISSUER','MATCHING_RULE_MANAGE_ISSUER','SALES_DESCRIPTION_ISSUER','CUSTOMER_DISPLAY_PRICE_ISSUER','GENERAL_WHOLESALE_VEHICLE_SCOPE'],
  productBaseline:'NOT_READY'});
 console.log('F05_7_NATIVE_PG16_SIGNED_V23_RESULT_EVIDENCE',JSON.stringify({catalogSha:catalog.sha256,counts}));
}finally{await c.end()}
