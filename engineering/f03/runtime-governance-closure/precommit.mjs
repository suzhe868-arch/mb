// Apply actual H owner-transfer service in OLD M94 before G-only 000014.
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {IsolatedAuth} from '../../src/f03-auth-service.mjs';
import {commitCustomerOwnerHandover as H} from '../runtime-customer-owner-handover/service.mjs';
import {connect,verify} from '../runtime-transaction-responsible-handover/migration.mjs';
if(process.env.CI!=='true'||process.env.GITHUB_ACTIONS!=='true')throw Error('G_SYNTHETIC_ONLY');
const c=await connect(),secret=randomBytes(32),auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin:'https://127.0.0.1:48981'});
try{
 assert.equal((await verify(c)).verified,true);
 const r=await auth.login({login:'http_test',password:'SyntheticN_2026_CI_Authority',source:'g_precommit'});
 assert.equal(r.code,'AUTH_OK');
 for(const [batch,item,src] of [[97001,17601,76],[97002,17602,77],[97003,17603,78],[97004,17604,4]]){
  const result=await H(auth,r.token,{batchId:batch,itemId:item,fromEmployeeId:src,recipientEmployeeId:batch===97004?6:4,teamId:901,clientRequestKey:'g-m94-genuine-source-'+batch});
  assert.equal(result.code,'H03_OWNER_DOMAIN_TRANSFERRED',JSON.stringify(result));
 }
 console.log('G_M94_THREE_ACTUAL_H_RECEIPTS_BEFORE_000014_PASS');
}finally{await auth.close();await c.end();secret.fill(0)}
