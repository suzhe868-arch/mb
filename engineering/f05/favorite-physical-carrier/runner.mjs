import {connect,apply,verify} from './migration.mjs';
const action=process.argv[2];
if(process.argv.length!==3||!['--apply','--verify','--inject-rollback'].includes(action))throw Error('F05_3G_RUNNER_ARGS');
const db=await connect();
try{
 if(action==='--inject-rollback'){
  await import('../wholesale-to-mingbang-conversion/migration.mjs').then(x=>x.verify(db));
  await (async()=>{try{await apply(db,{inject:true});throw Error('F05_3G_EXPECTED_ROLLBACK')}catch(e){if(e.message!=='F05_3G_INJECTED_ATOMIC_ROLLBACK')throw e}})();
  const old=(await db.query("SELECT to_regclass('public.f05_3g_customer_favorites') t")).rows[0].t;
  if(old!==null)throw Error('F05_3G_ROLLBACK_NOT_ATOMIC');
  console.log('F05_3G_ATOMIC_ROLLBACK_PASS');
 }else console.log('F05_3G_REAL_PG16',JSON.stringify(action==='--apply'?await apply(db):await verify(db)));
}finally{await db.end()}
