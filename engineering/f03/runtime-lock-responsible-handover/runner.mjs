import {connect,apply,verify,rollback,discovery} from './migration.mjs';
const op=process.argv[2];
if(!['--apply','--verify','--rollback','--inject','--discover'].includes(op)||process.argv.length!==3)throw Error('L_BAD_OP');
const c=await connect();
try{
 const x=op==='--apply'?await apply(c):op==='--verify'?await verify(c):op==='--rollback'?await rollback(c):op==='--inject'?await apply(c,{inject:true}):await discovery(c);
 if(op==='--inject'||op==='--discover')throw Error('L_UNEXPECTED_ACCEPTANCE');
 console.log('F03_2L '+op+' PASS '+JSON.stringify(x));
}catch(e){if(op==='--discover'&&e.message==='F03_2L_DISCOVERY_ROLLBACL_ONLY')console.log('F03_2L_DISCOVERY_CLEAN');else{console.error('F03_2L_DENY '+e.message);process.exitCode=1}}finally{await c.end()}
