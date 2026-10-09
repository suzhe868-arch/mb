import {connect,apply,verify,rollback,discover} from './migration.mjs';
const op=process.argv[2];if(!['--apply','--verify','--rollback','--inject','--discover'].includes(op)||process.argv.length!==3)throw Error('F03_2C_BAD_OP');
const c=await connect();
try{const r=op==='--apply'?await apply(c):op==='--verify'?await verify(c):op==='--rollback'?await rollback(c):op==='--inject'?await apply(c,{inject:true}):await discover(c);if(op==='--inject')throw Error('F03_2C_INJECT_WAS_ACCEPTED');console.log('F03_2C '+op+' PASS '+JSON.stringify(r))}
catch(e){if(op==='--discover'&&e.message==='F03_2C_DISCOVERY_ROLLBACK_ONLY')console.log('F03_2C_DISCOVERY_CLEAN');else{console.error('F03_2C_DENY '+e.message);process.exitCode=1}}finally{await c.end()}
