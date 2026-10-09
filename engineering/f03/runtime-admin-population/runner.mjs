import {connect,apply,verify,rollback,discover} from './migration.mjs';
const op=process.argv[2];
if(!['--apply','--verify','--rollback','--discover','--inject'].includes(op)||process.argv.length!==3)throw Error('F03_2B_BAD_OPERATION');
const c=await connect();
try{const r=op==='--apply'?await apply(c):op==='--verify'?await verify(c):op==='--rollback'?await rollback(c):op==='--inject'?await apply(c,{inject:true}):await discover(c);if(op==='--inject')throw Error('INJECT_UNEXPECTED_PASS');console.log('F03_2B '+op+' PASS '+JSON.stringify(r))}
catch(e){if(op==='--discover'&&e.message==='F03_2B_DISCOVERY_ROLLBACK_ONLY'){console.log('F03_2B_DISCOVERY_CLEAN');}else{console.error('F03_2B_RUN_DENY '+e.message);process.exitCode=1}}
finally{await c.end()}