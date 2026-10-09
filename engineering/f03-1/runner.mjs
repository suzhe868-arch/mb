import {connect,bootstrap,apply,verify,isolate} from './migration.mjs';
const op=process.argv[2];
if(process.argv.length!==3||!['--bootstrap','--apply','--inject','--verify'].includes(op))throw Error('F03_1_BAD_MIGRATION_MODE');
isolate();
const c=await connect();
try{
 const out=op==='--bootstrap'?await bootstrap(c):op==='--verify'?await verify(c):await apply(c,{inject:op==='--inject'});
 if(op==='--inject')throw Error('F03_1_INJECT_NOT_RAISED');
 console.log('F03-1 PG16 '+op+' PASS '+JSON.stringify(out));
}catch(e){console.error('F03-1 MIGRATION FAILURE '+e.message);process.exitCode=1}
finally{await c.end()}
