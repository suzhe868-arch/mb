import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {getPublicStructure} from '../../f02-1/schema-integrity.mjs';
import {connect,verify,ID} from './migration.mjs';
const mode=process.argv[2];
if(process.argv.length!==3||!['source','https'].includes(mode))throw Error('F05_5_EVIDENCE_ARGS');
const c=await connect();
try{
 const seal=await verify(c),cat=await getPublicStructure(c);
 const versions=(await c.query('SELECT migration_id,checksum,structure_sha256 FROM public.f03_schema_migrations ORDER BY migration_id')).rows;
 if(versions.length!==19||versions.at(-1).migration_id!==ID)throw Error('F05_5_WRONG_SIGNED_CHAIN');
 const facts=(await c.query('SELECT (SELECT count(*)::int FROM public.customer_day_quota_ledger) days,(SELECT count(*)::int FROM public.customer_quota_adjustments) adjustments,(SELECT count(*)::int FROM public.f05_5_quota_addition_events_ci) ciReceipts,(SELECT count(*)::int FROM public.customer_price_unlock_events) priceDebits')).rows[0];
 const root=new URL('./artifacts/'+mode+'/',import.meta.url);await mkdir(root,{recursive:true});
 const save=(path,obj)=>writeFile(new URL(path,root),JSON.stringify(obj,null,2)+'\n');
 await save('full-catalog.json',cat);
 await save('full-signed-migration-ledger.json',{sha:seal.fullPriorHistorySha256,versions,version21:seal,oldVersion20:versions[17]});
 await save('physical-issuer-observations.json',{source:'REAL_F03_SESSION_WITH_SYNTHETIC_CI_PERMISSION_FIXTURE',
  actualProductionIssuer:false,actualCustomerOwnerFromFrozenM94:true,
  currentEmployeeOwnerScopeFromF03:true,productionEmployeeQuotaPermissionSourceAccepted:false,
  isolatedBusinessPermissionCode:'customer.quota.add.ci.synthetic',
  productionEmployeeAdditionAllowed:false,sourceGap:'F05_5_EMPLOYEE_ADDITION_SOURCE_GAP',
  actualVersion:ID,ciRunId:process.env.GITHUB_RUN_ID,ciHeadSha:process.env.GITHUB_SHA,
  publicCatalogueSha256:cat.sha256,counts:facts,
  signedEvidenceSha256:createHash('sha256').update(JSON.stringify(versions)+JSON.stringify(facts)).digest('hex')});
 console.log('F05_5_NATIVE_SIGNED_PG16_000021_SOURCE_GAP',JSON.stringify({facts,sha:cat.sha256}));
}finally{await c.end()}