// CI DISCOVERY ONLY: runs accepted candidate DDL then ROLLBACK; no dynamic trust.
// Used once to freeze exact physical fingerprint and SHA256 in manifest.
import {connect,verifyOld,SQL,checksum} from './migration.mjs';
import {getPublicStructure} from '../../f02-1/schema-integrity.mjs';
const c=await connect();
try{
 await verifyOld(c);
 await c.query('BEGIN');
 try{
  await c.query(SQL);
  const snap=await getPublicStructure(c);
  console.log('F03_2_1B_MANIFEST_FREEZE sql_sha256='+checksum+' structure_sha256='+snap.sha256);
 }finally{await c.query('ROLLBACK')}
 await verifyOld(c);
}catch(e){console.error(e.message);process.exitCode=1}finally{await c.end()}
