import {connect,apply,verify} from './migration.mjs';
const mode=process.argv[2],c=await connect();
try{
 if(mode==='--inject-rollback'){
  const before=(await c.query("SELECT count(*)::int n FROM pg_namespace WHERE nspname='d1_owner_ci'")).rows[0].n;
  try{await apply(c,{inject:true});throw Error('D1_INJECTION_ACCEPTED')}
  catch(e){if(e.message!=='D1_INJECTED_ROLLBACK')throw e}
  const after=(await c.query("SELECT count(*)::int n FROM pg_namespace WHERE nspname='d1_owner_ci'")).rows[0].n;
  if(after!==before)throw Error('D1_ROLLBACK_NOT_ATOMIC');
  console.log('D1_REAL_PG16_INJECTED_ROLLBACK_PASS');
 }else if(mode==='--apply')console.log('D1_SIDECAR_APPLIED',JSON.stringify(await apply(c)));
 else if(mode==='--verify')console.log('D1_SIDECAR_VERIFIED',JSON.stringify(await verify(c)));
 else throw Error('D1_BAD_RUN_MODE');
}finally{await c.end()}
