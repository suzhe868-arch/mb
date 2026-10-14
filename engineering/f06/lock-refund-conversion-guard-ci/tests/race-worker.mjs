// F06-5B: independent worker thread isolates process.env/GITHUB_REF to prevent false CI races.
import {parentPort,workerData} from 'node:worker_threads';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {requestSyntheticRefundCI} from '../../refund-pending-ci/service.mjs';
import {withF063C1} from '../../transaction-cancel-ci/migration.mjs';
import {openGuardedSyntheticTransactionCI} from '../service.mjs';
const {role,lockId,token,eventKey}=workerData;
if(!['refund','transaction'].includes(role)||!Number.isSafeInteger(lockId)||!token||!eventKey)throw Error('F06_5B_RACE_WORKER_INPUT');
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret:Buffer.alloc(32,61),origin:'https://127.0.0.1:49026'});
try{
 const result=role==='refund'?
  await withF063C1(()=>requestSyntheticRefundCI(auth,token,{subjectKind:'lock',lockId,amountCents:1500,reason:'旧锁车退款与交易转换必须有序排他提交',eventKey})):
  await openGuardedSyntheticTransactionCI(auth,token,{lockId,eventKey});
 parentPort.postMessage(result);
}finally{await auth.close()}
