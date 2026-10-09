import {connect,apply,verify,rollback,verifyOld} from './migration.mjs';
const op=process.argv[2];
if(!['--apply','--verify','--rollback','--inject','--verify-old'].includes(op)||process.argv.length!==3)throw Error('F03_2_1B_BAD_OPERATION');
const c=await connect();
try{
 const o=op==='--apply'?await apply(c):op==='--verify'?await verify(c):op==='--inject'?await apply(c,{inject:true}):op==='--rollback'?await rollback(c):await verifyOld(c);
 if(op==='--inject')throw Error('F03_2_1B_INJECT_WAS_UNEXPECTED_SUCCESS');
 console.log('F03-2-1B '+op+' PASS '+JSON.stringify(o));
}catch(e){console.error('F03-2-1B RUN DENY '+e.message);process.exitCode=1}
finally{await c.end()}
