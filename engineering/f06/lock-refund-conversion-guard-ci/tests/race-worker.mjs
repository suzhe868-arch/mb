// 仅非生产PG16签名子进程。将两套不同GITHUB_REF来源Issuer隔离在独立进程。
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {requestSyntheticRefundCI} from '../../refund-pending-ci/service.mjs';
import {withF063C1} from '../../transaction-cancel-ci/migration.mjs';
import {openGuardedSyntheticTransactionCI} from '../service.mjs';
const role=process.argv[2];
const lockId=Number(process.env.F06_5B_RACE_LOCK);
const token=process.env.F06_5B_RACE_TOKEN;
const eventKey=process.env.F06_5B_RACE_KEY;
if(!['refund','transaction'].includes(role)||!Number.isSafeInteger(lockId)||!token||!eventKey)throw Error('F06_5B_RACE_CI_INPUT');
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret:Buffer.alloc(32,61),origin:'https://127.0.0.1:49026'});
try{
 let result;
 if(role==='refund')result=await withF063C1(()=>requestSyntheticRefundCI(auth,token,{subjectKind:'lock',lockId,amountCents:1500,reason:'同一锁车退款与交易转换必须串行提交',eventKey}));
 else result=await openGuardedSyntheticTransactionCI(auth,token,{lockId,eventKey});
 console.log('F06_5B_CHILD_RESULT='+JSON.stringify(result));
}finally{await auth.close()}
