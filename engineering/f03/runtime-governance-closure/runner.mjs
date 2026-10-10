import {connect,apply,verify,discovery,rollbackUnused} from './migration.mjs';
const op=process.argv[2];
if(!['--discover','--apply','--verify','--rollback-unused','--inject'].includes(op)||process.argv.length!==3)throw Error('G_BAD_OPERATOR');
const c=await connect();
try{
 const result=op==='--discover'?await discovery(c):op==='--apply'?await apply(c):op==='--verify'?await verify(c):op==='--rollback-unused'?await rollbackUnused(c):await apply(c,{inject:true});
 if(op==='--inject')throw Error('G_INJECTION_UNEXPECTEDLY_COMMITTED');
 console.log('F03_G '+op+' PASS '+JSON.stringify(result??{}));
}catch(e){console.error('F03_G_DENY '+e.message);process.exitCode=1}finally{await c.end()}
