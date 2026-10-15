// F06-5C CI-only：在隔离子进程使用冻结 F06-5B 的真实 signed Session 和物理 PG 事务。
// 子进程独立 GITHUB_REF，禁止父进程临时切换全局环境参与并发，禁止生产 Issuer。
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {openGuardedSyntheticTransactionCI} from '../../lock-refund-conversion-guard-ci/service.mjs';

const lockId=Number(process.argv[2]), eventKey=process.argv[3];
const token=process.env.F06_5C_SYNTHETIC_TEST_TOKEN;
if(!Number.isSafeInteger(lockId)||lockId<=0||!token||
 process.env.GITHUB_REF!=='refs/heads/feat/f06-5b-lock-refund-conversion-guard-ci'||
 process.env.GITHUB_ACTIONS!=='true'||process.env.APP_ENV!=='test'||
 process.env.GITHUB_EVENT_NAME!=='push')throw Error('F06_5C_CHILD_CI_ISOLATION_REQUIRED');
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,
 secret:Buffer.alloc(32,61),origin:'https://127.0.0.1:49026'});
process.stdout.write('F06_5C_CHILD_READY\n');
await new Promise((resolve,reject)=>{
 process.stdin.once('data',resolve);
 process.stdin.once('error',reject);
});
let observed=null;
try{
 const wrapper={withSession:(t,fn,options)=>auth.withSession(t,async(c,a,s,now)=>{
  const source=(await c.query('SELECT pg_backend_pid()::int pid,txid_current()::text txid')).rows[0];
  observed={pgBackendPid:source.pid,pgTransactionId:source.txid};
  return fn(c,a,s,now);
 },options)};
 const converted=await openGuardedSyntheticTransactionCI(wrapper,token,{lockId,eventKey});
 process.stdout.write('F06_5C_CHILD_RESULT '+JSON.stringify({...converted,...observed})+'\n');
 if(converted.code!=='F06_5B_ATOMIC_SYNTHETIC_IN_PROGRESS')process.exitCode=2;
}catch(e){
 process.stderr.write('F06_5C_CHILD_FAILED '+String(e?.code||e?.message||e)+'\n');
 process.exitCode=1;
}finally{
 await auth.close();
}
