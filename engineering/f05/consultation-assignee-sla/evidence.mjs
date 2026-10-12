import {mkdir,writeFile} from 'node:fs/promises';
import {connect,verify,ID,checksum} from './migration.mjs';
import {getPublicStructure} from '../../f02-1/schema-integrity.mjs';
const mode=process.argv[2];if(!['source','https'].includes(mode))throw Error('F05_10_EVIDENCE_MODE');
const c=await connect();
try{
 const verified=await verify(c),catalog=await getPublicStructure(c);
 const migrations=(await c.query('SELECT migration_id,checksum,structure_sha256 FROM public.f03_schema_migrations ORDER BY migration_id')).rows;
 if(migrations.length!==24||migrations[23].migration_id!==ID||migrations[23].checksum!==checksum)throw Error('F05_10_SIGNED_LEDGER_DRIFT');
 const names=['consultations','f05_10_consultation_meta_ci','f05_10_consultation_events_ci','f05_10_consultation_handover_ci'];
 const counts={};for(const n of names)counts[n]=Number((await c.query('SELECT count(*)::int n FROM public.'+n)).rows[0].n);
 const dir=new URL('./artifacts/'+mode+'/',import.meta.url);await mkdir(dir,{recursive:true});
 const save=(name,x)=>writeFile(new URL(name,dir),JSON.stringify(x,null,2)+'\n');
 await save('native-m94-v26-ledger.json',{verified,migrations});
 await save('native-v26-catalog.json',catalog);
 await save('native-source-counts.json',counts);
 await save('source-gaps.json',{prod:false,CI:'SYNTHETIC_NONSUPERUSER_PG16',
  sourcesMissing:['WECHAT_PHONE_CONSENT','CUSTOMER_ISSUER','REAL_CONSULTATION_EMPLOYEE_CAPABILITY',
   'REAL_HUMAN_CALL_MESSAGE_ISSUER','PRODUCTION_API','JYT_PHONE','PAYMENT','UAT'],v1:'NOT_READY'});
 console.log('F05_10_NATIVE_SIGNED_PG16_EVIDENCE',JSON.stringify({verified,counts,catalogSha:catalog.sha256}));
}finally{await c.end()}
