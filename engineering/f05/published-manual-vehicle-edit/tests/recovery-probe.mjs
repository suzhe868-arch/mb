// Distinct Node process, new PG connections and freshly authenticated session.
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {createPublishedEditService} from '../service.mjs';
import {assertIsolated} from '../migration.mjs';
assertIsolated();
const id=Number(process.argv[2]),version=Number(process.argv[3]);
if(!Number.isSafeInteger(id)||!Number.isSafeInteger(version)||id<1||version<1)throw Error('F05_EDIT_RECOVERY_ARGUMENTS_INVALID');
const four=process.env.F05_EDIT_TEST_SOURCE==='four_s';
const secret=randomBytes(32);
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin:`https://127.0.0.1:${Number(process.env.F05_EDIT_HTTP_PORT || 48986)}`});
try{
 const logged=await auth.login({login:four?'four_s_test':'employee_test',
  password:four?'SyntheticFourS_123456':'SyntheticF04_3_CurrentProof_2026',source:'f05-edit-independent-process-recovery'});
 assert.equal(logged.code,'AUTH_OK');
 const service=createPublishedEditService({auth});
 const result=await service.get(logged.token,id);
 assert.equal(result.status,200,JSON.stringify(result.body));
 assert.equal(result.body.currentVersion,1);
 assert.equal(result.body.draft.stageVersion,version);
 assert.equal(result.body.effective.customerListPriceCents,null);
 assert.equal(result.body.draft.preview.customerListPriceCents,8900000);
 console.log('ISSUE216_REAL_INDEPENDENT_PROCESS_RECOVERY_PASS');
}finally{await auth.close();secret.fill(0)}
