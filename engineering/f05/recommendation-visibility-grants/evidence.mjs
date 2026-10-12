import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {connect,verify,ID,checksum} from './migration.mjs';
import {getPublicStructure} from '../../f02-1/schema-integrity.mjs';
const mode=process.argv[2];if(!['source','https'].includes(mode))throw Error('F05_9_EVIDENCE_MODE');
const c=await connect();
try{
 const attest=await verify(c),catalog=await getPublicStructure(c);
 const migrations=(await c.query('SELECT migration_id,checksum,structure_sha256 FROM public.f03_schema_migrations ORDER BY migration_id')).rows;
 if(migrations.length!==23||migrations[22].migration_id!==ID||migrations[22].checksum!==checksum)throw Error('F05_9_V25_LEDGER_MISMATCH');
 const tables=['recommendations','vehicle_visibility_grants','f05_9_recommendation_facts_ci','f05_9_price_right_ci','f05_9_recommendation_events_ci'];
 const counts={};for(const t of tables)counts[t]=Number((await c.query('SELECT count(*)::int n FROM public.'+t)).rows[0].n);
 const dir=new URL('./artifacts/'+mode+'/',import.meta.url);await mkdir(dir,{recursive:true});
 const save=(name,data)=>writeFile(new URL(name,dir),JSON.stringify(data,null,2)+'\n');
 await save('real-pg16-m94-v25-migration-ledger.json',{attest,migrations});
 await save('real-pg16-catalog.json',catalog);
 await save('real-pg16-recommendation-counts.json',counts);
 await save('source-issuer-gaps.json',{CI_ONLY:true,realProductionRecommendationIssuer:false,
  missing:['WECHAT_SIGNED_CUSTOMER_IDENTITY','RECOMMENDATION_PRODUCTION_EMPLOYEE_PERMISSION',
  'DIGITAL_WHOLESALE_PRICE_ORIGINAL_ISSUER','VALIDATED_CUSTOMER_PRICE','JYT_PRODUCTION_CYCLE','REAL_SHARE_ROUTE'],
  productBaseline:'NOT_READY'});
 console.log('F05_9_GENUINE_PG16_SOURCE_EVIDENCE',JSON.stringify({attest,counts,catalogSHA:catalog.sha256}));
}finally{await c.end()}
