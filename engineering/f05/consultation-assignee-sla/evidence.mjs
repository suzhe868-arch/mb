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
 // D1 is a formally merged CI-only dependency. We verify its immutable v25 seal
 // after v26 without invoking D1's deliberately v25-only migration verifier.
 const att=(await c.query("SELECT seal_name,sidecar_source_sha256,prior_ledger_sha256,old_public_catalog_sha256 FROM d1_owner_ci.attestation")).rows[0];
 if(att?.seal_name!=='D1_INDEPENDENT_FROM_SIGNED_V25'||att.old_public_catalog_sha256!==migrations[22].structure_sha256)
  throw Error('F05_10_D1_CROSS_VERSION_ATTESTATION_CHANGED');
 const d1=(await c.query("SELECT "+
  "(SELECT count(*)::int FROM d1_owner_ci.receipts) receipt_count,"+
  "(SELECT count(*)::int FROM d1_owner_ci.pool_cycles WHERE state='pending') pending_count,"+
  "(SELECT count(*)::int FROM public.consultations WHERE customer_id BETWEEN 989201 AND 989209) consultation_count,"+
  "(SELECT md5(COALESCE(string_agg(to_jsonb(r)::text,'|' ORDER BY to_jsonb(r)::text),'')) FROM d1_owner_ci.receipts r) receipt_row_md5")).rows[0];
 if(mode==='source'&&(d1.receipt_count<4||d1.pending_count<1||d1.consultation_count<4))
  throw Error('F05_10_D1_REQUIRED_OWNER_TO_CONSULTATION_PG_ROWS_MISSING');
 const dir=new URL('./artifacts/'+mode+'/',import.meta.url);await mkdir(dir,{recursive:true});
 const save=(name,x)=>writeFile(new URL(name,dir),JSON.stringify(x,null,2)+'\n');
 await save('native-m94-v26-ledger.json',{verified,migrations});
 await save('signed-v25-d1-source-to-v26-consultation.json',{attestation:att,afterV26:d1,verifiedPublicV26:true,source:'CI_SYNTHETIC_AUTHORITY_ONLY / PRODUCTION_ISSUER_GAP'});
 await save('native-v26-catalog.json',catalog);
 await save('native-source-counts.json',counts);
 await save('source-gaps.json',{prod:false,CI:'SYNTHETIC_NONSUPERUSER_PG16',
  sourcesMissing:['WECHAT_PHONE_CONSENT','CUSTOMER_ISSUER','REAL_CONSULTATION_EMPLOYEE_CAPABILITY',
   'REAL_HUMAN_CALL_MESSAGE_ISSUER','PRODUCTION_API','JYT_PHONE','PAYMENT','UAT'],v1:'NOT_READY'});
 console.log('F05_10_NATIVE_SIGNED_PG16_EVIDENCE',JSON.stringify({verified,counts,catalogSha:catalog.sha256,d1}));
}finally{await c.end()}
