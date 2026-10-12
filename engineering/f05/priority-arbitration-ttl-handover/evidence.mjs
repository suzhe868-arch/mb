import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {connect,verify,ID,checksum} from './migration.mjs';
import {getPublicStructure} from '../../f02-1/schema-integrity.mjs';
const mode=process.argv[2];
if(process.argv.length!==3||!['priority-source','priority-https'].includes(mode))throw Error('F05_8_EVIDENCE_MODE_INVALID');
const c=await connect();
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
try{
 const signed=await verify(c),catalog=await getPublicStructure(c);
 const ledger=(await c.query('SELECT migration_id,checksum,structure_sha256 FROM public.f03_schema_migrations ORDER BY migration_id')).rows;
 if(ledger.length!==22||ledger[21].migration_id!==ID||ledger[21].checksum!==checksum)throw Error('F05_8_WRONG_V24_LEDGER');
 const names=['f05_8_qualification_ci','f05_8_config_ci','f05_8_priority_ci','f05_8_suppression_ci',
  'f05_8_events_ci','f05_8_handover_ci','f05_8_handover_attempts_ci'];
 const counts={};
 for(const t of names)counts[t]=Number((await c.query('SELECT count(*)::int n FROM public.'+t)).rows[0].n);
 const events=(await c.query('SELECT * FROM public.f05_8_events_ci ORDER BY event_id')).rows;
 const priorities=(await c.query('SELECT * FROM public.f05_8_priority_ci ORDER BY priority_id')).rows;
 const attempts=(await c.query('SELECT * FROM public.f05_8_handover_attempts_ci ORDER BY attempt_id')).rows;
 const dir=new URL('./artifacts/'+mode+'/',import.meta.url);await mkdir(dir,{recursive:true});
 const save=(file,val)=>writeFile(new URL(file,dir),JSON.stringify(val,null,2)+'\n');
 await save('signed-m94-v24-ledger.json',{id:ID,ledger,preceding21:ledger.slice(0,21),signed});
 await save('native-real-pg16-schema-catalog.json',catalog);
 await save('native-priority-event-handover-evidence.json',{priorities,events,attempts,eventsSHA:hash(events),prioritySHA:hash(priorities),attemptsSHA:hash(attempts),counts});
 await save('source-issuer-gaps.json',{CI_ONLY:true,source:'CI_SYNTHETIC_PRIORITY_CONTROL_NOT_PRODUCTION',
  absentProductionIssuers:['WECHAT_CUSTOMER_SESSION','PHONE_CONSENT','CURRENT_PRIORITY_QUALIFICATION_ISSUER','FIND_ENTITLEMENT_ISSUER',
    'MATCHING_RULE_ISSUER','CUSTOMER_NUMERIC_DISPLAY_PRICE','JYT_LINEAGE_PRODUCTION','PHONE_AND_FUNDS','VISIBILITY_PUBLIC_HTTP'],
  prioritiesNotProduction:true,productBaseline:'NOT_READY'});
 console.log('F05_8_V24_NATIVE_REAL_PG16_EVIDENCE',JSON.stringify({counts,checksum:checksum,catalogSHA:catalog.sha256}));
}finally{await c.end()}
