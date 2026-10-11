// Isolated two-phase PG16 CI. No credential is serialized to disk or printed.
import {spawnSync} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {IsolatedAuth} from '../../src/f03-auth-service.mjs';
import {connect as oldConnect,verify as oldVerify} from '../jyt-wholesale-lineage-cycle/migration.mjs';
import {issueCredential,setApiEnabled,syncUpsert} from '../jyt-wholesale-lineage-cycle/contract.mjs';
const mode=process.argv[2];
if(process.argv.length!==3||!['source','https'].includes(mode))throw Error('F05_3C_JOB_MODE');
const isolated={CI:'true',GITHUB_ACTIONS:'true',APP_ENV:'test',NODE_ENV:'test',
 F05_2_ISOLATION_CONFIRM:'I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY'};
for(const [k,v] of Object.entries(isolated))if(process.env[k]!==v)throw Error('F05_3C_NOT_CI');
function run(file,args=[],extra={}){
 const p=spawnSync(process.execPath,[file,...args],{stdio:'inherit',env:{...process.env,...extra},timeout:240000});
 if(p.status!==0||p.error)throw Error('F05_3C_TRUE_PG16_STEP_FAILED_'+file+'_'+(p.error?.message||p.status));
}
run('f05/wholesale-to-mingbang-conversion/ci-prepare.mjs');
const c=await oldConnect(),secret=randomBytes(32);
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin:'https://127.0.0.1:48983'});
let token;
try{
 if(!(await oldVerify(c)).verified)throw Error('F05_3C_FROZEN_V17_SOURCE_NOT_VERIFIED');
 const login=await auth.login({login:'admin_test',password:'SyntheticAdmin_1234567',source:'f05-3c-phase-I-actual-governance'});
 if(login.code!=='AUTH_OK')throw Error('F05_3C_REAL_ADMIN_SESSION_REQUIRED');
 const ev=x=>'f05-3c-real-pg16-conversion-'+x;
 const out=await issueCredential(auth,login.token,{eventKey:ev('admin-issues-independent-sync-credential')});
 if(!out.allowed)throw Error('F05_3C_SYNC_ISSUE_FAILED');
 token=out.token;
 for(const action of ['upsert','offline','current']){
  const a=await setApiEnabled(auth,login.token,{action,enabled:true,eventKey:ev('enable-'+action)});
  if(!a.allowed)throw Error('F05_3C_SYNC_SWITCH_FAILED_'+action);
 }
 for(const scenario of ['LOCKED','UNSCOPED','TRADING','COMPLETED','CONCURRENT','REVOKED','TX_RACE','SCOPE_RACE','LOOPBACK','SYNC_V18']){
  const p={eventKey:scenario==='LOOPBACK'?'f05-3c-https-real-employee-current-sync-verified-model-car':ev('jyt-'+scenario),
   carCode:scenario==='LOOPBACK'?'JYT-F05C-LOOPBACK-015':scenario==='SYNC_V18'?'JYTF05C-SYNC-V18':'JYTF05C-'+scenario,
   brandId:97001,seriesId:97002,modelId:97003,modelYear:2026,state:'active'};
  const signed=await syncUpsert(auth,token,p);
  if(!signed.allowed||signed.code!=='F05_3B_IMPORTED')
   throw Error('F05_3C_PRE_V18_JYT_ORIGIN_NOT_SIGNED_'+scenario+'_'+signed.code);
  console.log('F05_3C_000017_JYT_ORIGIN_SIGNED',scenario,signed.vehicleId,signed.listingCycleId);
 }
 console.log('F05_3C_PHASE_I_FROZEN_JYT_CONTRACT_SIGNED_WITH_REAL_SESSION');
}finally{await auth.close();await c.end();secret.fill(0)}
// Stage II: strict forward version, same actual DB and signed source rows.
run('f05/wholesale-to-mingbang-conversion/runner.mjs',['--inject-rollback']);
run('f05/wholesale-to-mingbang-conversion/runner.mjs',['--apply']);
run('f05/wholesale-to-mingbang-conversion/runner.mjs',['--verify']);
// Stage III: test processes inherit the ephemeral credential only in memory.
// GitHub step logs, tracked files, evidence and job-level environment never contain it.
try{
 run('f05/wholesale-to-mingbang-conversion/ci-test.mjs',[mode],{F05_3C_CI_EPHEMERAL_SYNC_TOKEN:token});
 run('f05/wholesale-to-mingbang-conversion/runner.mjs',['--verify']);
}finally{token=undefined}
console.log('F05_3C_TWO_PHASE_GENUINE_PG16_'+mode.toUpperCase()+'_TESTED');
