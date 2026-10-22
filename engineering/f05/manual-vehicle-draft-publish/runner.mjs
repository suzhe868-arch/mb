// Disposable PG16 runner; never runs against production.
import {connect,apply,verify} from './migration.mjs';
const args=process.argv.slice(2);
if(args.length!==1||!['--apply','--verify','--inject-rollback'].includes(args[0]))throw Error('F05_MANUAL_DRAFT_RUNNER_ARGUMENT_DENIED');
const c=await connect();
try{
 if(args[0]==='--apply'){
  const x=await apply(c);
  console.log('F05_MANUAL_DRAFT_PRIVATE_SCHEMA_APPLIED',JSON.stringify(x));
 }else if(args[0]==='--verify'){
  const x=await verify(c);
  if(x.verified!==true)throw Error('F05_MANUAL_DRAFT_VERIFY_FAILED');
  console.log('F05_MANUAL_DRAFT_PRIVATE_SCHEMA_VERIFIED',JSON.stringify(x));
 }else{
  let aborted=false;
  try{await apply(c,{inject:true})}catch(e){if(e.message==='F05_MANUAL_DRAFT_INJECTED_ROLLBACK')aborted=true;else throw e}
  if(!aborted)throw Error('F05_MANUAL_DRAFT_ROLLBACK_INJECTION_MISSED');
  const n=(await c.query("SELECT to_regnamespace('f05_manual_vehicle_test') AS n")).rows[0].n;
  if(n!==null)throw Error('F05_MANUAL_DRAFT_PARTIAL_DDL_SURVIVED');
  await verifyPublicOnly(c);
  console.log('F05_MANUAL_DRAFT_PRIVATE_DDL_ROLLBACK_REAL_PG16_PASS');
 }
}finally{await c.end()}
async function verifyPublicOnly(c){
 const x=await c.query('SELECT current_database() db,current_user usr,current_setting(\'server_version_num\')::integer v');
 if(x.rows[0].db!=='f03_auth_test'||x.rows[0].usr!=='f03_ci'||x.rows[0].v<160000||x.rows[0].v>=170000)
  throw Error('F05_MANUAL_DRAFT_ROLLBACK_DB_IDENTITY_DENIED');
}
