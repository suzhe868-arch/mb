import {spawnSync} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {IsolatedAuth} from '../../src/f03-auth-service.mjs';
import {connect as oldConnect,verify as oldVerify} from '../../f05/jyt-wholesale-lineage-cycle/migration.mjs';
import {issueCredential,setApiEnabled,syncUpsert} from '../../f05/jyt-wholesale-lineage-cycle/contract.mjs';

const EXPECTED_REF='refs/heads/feat/f05-f06-same-vehicle-signed-bridge-pg16-01';
for(const [key,value] of Object.entries({CI:'true',GITHUB_ACTIONS:'true',APP_ENV:'test',NODE_ENV:'test',F05_2_ISOLATION_CONFIRM:'I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY'}))
 if(process.env[key]!==value)throw Error('F05_F06_TARGET_NOT_ISOLATED_'+key);
if(process.env.GITHUB_REF!==EXPECTED_REF)throw Error('F05_F06_TARGET_AUTHENTIC_REF_REQUIRED');
if(process.env.F03_1_DATABASE_URL!=='postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test')throw Error('F05_F06_TARGET_DATABASE_DENIED');
function run(file,args=[],extra={}){
 const p=spawnSync(process.execPath,[file,...args],{stdio:'inherit',env:{...process.env,...extra},timeout:240000});
 if(p.status!==0||p.error)throw Error('F05_F06_TARGET_STEP_FAILED_'+file+'_'+(p.error?.message||p.status));
}
const c=await oldConnect(),secret=randomBytes(32);
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin:'https://127.0.0.1:48983'});
let token;
try{
 if(!(await oldVerify(c)).verified)throw Error('F05_F06_TARGET_V17_SOURCE_NOT_VERIFIED');
 const login=await auth.login({login:'admin_test',password:'SyntheticAdmin_1234567',source:'f05-f06-bridge-f05-3c-phase-I'});
 if(login.code!=='AUTH_OK')throw Error('F05_F06_TARGET_REAL_ADMIN_SESSION_REQUIRED');
 const ev=x=>'f05-f06-bridge-f05-3c-'+x;
 const issued=await issueCredential(auth,login.token,{eventKey:ev('admin-issues-independent-sync-credential')});
 if(!issued.allowed)throw Error('F05_F06_TARGET_SYNC_CREDENTIAL_ISSUE_FAILED');
 token=issued.token;
 for(const action of ['upsert','offline','current']){
  const switched=await setApiEnabled(auth,login.token,{action,enabled:true,eventKey:ev('enable-'+action)});
  if(!switched.allowed)throw Error('F05_F06_TARGET_SYNC_SWITCH_FAILED_'+action);
 }
 for(const scenario of ['LOCKED','UNSCOPED','TRADING','COMPLETED','CONCURRENT','REVOKED','TX_RACE','SCOPE_RACE','LOOPBACK','SYNC_V18']){
  const payload={
   eventKey:scenario==='LOOPBACK'?'f05-3c-https-real-employee-current-sync-verified-model-car':ev('jyt-'+scenario),
   carCode:scenario==='LOOPBACK'?'JYT-F05C-LOOPBACK-015':scenario==='SYNC_V18'?'JYTF05C-SYNC-V18':'JYTF05C-'+scenario,
   brandId:97001,seriesId:97002,modelId:97003,modelYear:2026,state:'active'
  };
  const signed=await syncUpsert(auth,token,payload);
  if(!signed.allowed||signed.code!=='F05_3B_IMPORTED')throw Error('F05_F06_TARGET_UNSIGNED_JYT_SOURCE_'+scenario+'_'+signed.code);
  console.log('F05_F06_TARGET_SIGNED_JYT_SOURCE',scenario,signed.vehicleId,signed.listingCycleId);
 }
 console.log('F05_F06_TARGET_PHASE_I_REAL_ADMIN_AND_SIGNED_JYT_SOURCE_PASS');
}finally{await auth.close();await c.end();secret.fill(0)}
run('engineering/f05/wholesale-to-mingbang-conversion/runner.mjs',['--inject-rollback']);
run('engineering/f05/wholesale-to-mingbang-conversion/runner.mjs',['--apply']);
run('engineering/f05/wholesale-to-mingbang-conversion/runner.mjs',['--verify']);
try{
 run('engineering/f05/wholesale-to-mingbang-conversion/ci-test.mjs',['source'],{F05_3C_CI_EPHEMERAL_SYNC_TOKEN:token});
 run('engineering/f05/wholesale-to-mingbang-conversion/runner.mjs',['--verify']);
}finally{token=undefined}
console.log('F05_F06_TARGET_V17_V18_SIGNED_SOURCE_CHAIN_PASS');
