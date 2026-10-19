// F06-only, genuine signed F05-8 CI source: never hand-insert Priority or impersonate issuer.
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {IsolatedAuth} from '../src/f03-auth-service.mjs';
import {connect,verify} from '../f05/priority-arbitration-ttl-handover/migration.mjs';
import {setQualificationCI} from '../f05/priority-arbitration-ttl-handover/service.mjs';
if(process.env.GITHUB_ACTIONS!=='true'||process.env.GITHUB_EVENT_NAME!=='push'||
 !['refs/heads/feat/f06-real-lockrequest-http-pg16-01','refs/heads/feat/f06-real-lock-lifecycle-http-pg16-02'].includes(process.env.GITHUB_REF)||
 process.env.CI!=='true'||process.env.APP_ENV!=='test'||process.env.NODE_ENV!=='test')
 throw Error('F06_PRIORITY_NONPRODUCTION_CI_GATE');
const db=await connect();
const secret=randomBytes(32);
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin:'https://127.0.0.1:48988'});
try{
 assert.equal((await verify(db)).verified,true);
 const login=await auth.login({login:'employee_test',password:'SyntheticF04_3_CurrentProof_2026',
   source:'f06-ci-original-signed-f05-8-qualification-only'});
 assert.equal(login.code,'AUTH_OK','signed F03 CI Employee session is mandatory');
 const qual=await setQualificationCI(auth,login.token,{teamId:901,customerId:899612,enabled:true,
   eventKey:'f06-ci-original-f05-priority-qualification-20261019'});
 assert.equal(qual.allowed,true,JSON.stringify(qual));
 const rows=(await db.query("SELECT p.priority_id,p.customer_id,p.vehicle_id,p.listing_cycle_id "+
  "FROM public.f05_8_priority_ci p JOIN public.f05_7_result_versions_ci r "+
  "ON r.result_id=p.source_match_result_id AND r.source_signature=p.source_signature "+
  "WHERE p.customer_id=899612 AND p.status='active' AND p.expires_at>clock_timestamp() "+
  "AND r.status='current' ORDER BY p.priority_id")).rows;
 assert.ok(rows.length>=1,'authentic F05 signed Priority source must be active before F06');
 console.info('F06_ORIGINAL_F05_8_QUALIFIED_PRIORITY_SOURCE',JSON.stringify({
  count:rows.length,qualCode:qual.code,source:'F05_8_SIGNED_CI_SERVICE_NONPRODUCTION'}));
}finally{
 await auth.close();await db.end();secret.fill(0);
}
