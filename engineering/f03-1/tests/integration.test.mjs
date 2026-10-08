import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {connect} from '../migration.mjs';
import {IsolatedAuth} from '../../src/f03-auth-service.mjs';
import {hashPassword,verifyPassword,normalizeLogin,validatePassword,params} from '../../src/f03-auth-crypto.mjs';
const secret=randomBytes(32);
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin:'https://127.0.0.1:48331'});
const fail={code:'AUTH_FAILED'};
test.after(async()=>{await auth.close();secret.fill(0)});
test('scrypt real salt, strict params, tampered version and Unicode/length guards',async()=>{
 assert.deepEqual([params.N,params.r,params.p],[32768,8,3]);
 const a=await hashPassword('SyntheticPassword_12345'),b=await hashPassword('SyntheticPassword_12345');
 assert.notEqual(a,b);
 assert.equal(await verifyPassword('SyntheticPassword_12345',a),true);
 assert.equal(await verifyPassword('SyntheticPassword_1234!',a),false);
 assert.equal(await verifyPassword('SyntheticPassword_12345',a.replace('$v1$','$v7$')),false);
 assert.equal(await verifyPassword('SyntheticPassword_12345',a.replace('$32768$','$4096$')),false);
 assert.equal(await verifyPassword('SyntheticPassword_12345','malformed'),false);
 assert.throws(()=>validatePassword('tiny'));
 assert.throws(()=>validatePassword('x'.repeat(129)));
 assert.throws(()=>validatePassword('x'.repeat(11)+'\ud800'));
 assert.equal(normalizeLogin('  EMPLOYEE_TEST  '),'employee_test');
 assert.throws(()=>normalizeLogin(' test\nname'));
 console.log('F03-1 REAL KDF CHECKS PASS');
});
test('unknown, wrong password, inactive, disabled and no 4S PC access uniformly rejected',async()=>{
 for(const input of [
  {login:'not_exists_001',password:'SyntheticPassword_12345'},
  {login:'employee_test',password:'SyntheticPassword_Wrong'},
  {login:'inactive_test',password:'SyntheticInactive_123'},
  {login:'disabled_test',password:'SyntheticDisabled_123'},
  {login:'four_s_test',password:'SyntheticFourS_123456'}
 ]){
  const result=await auth.login({...input,source:'attempt_'+input.login});
  assert.deepEqual(result,fail);
 }
 console.log('F03-1 UNIFORM NEGATIVE AUTH PASS');
});
test('first login restricted, change password atomically revokes old session, logout idempotent',async()=>{
 const first=await auth.login({login:' Employee_Test ',password:'SyntheticPassword_12345',source:'first'});
 assert.equal(first.code,'AUTH_OK');assert.equal(first.restricted,true);
 const old=await auth.withSession(first.token,async(c,a,s)=>({restricted:s.restricted}));
 assert.deepEqual(old,{restricted:true});
 const change=await auth.change({token:first.token,csrf:first.csrf,oldPassword:'SyntheticPassword_12345',newPassword:'ChangedSyntheticPassword_2026'});
 assert.equal(change.code,'PASSWORD_CHANGED_REAUTH_REQUIRED');
 assert.equal(await auth.withSession(first.token,async()=>true),null);
 assert.deepEqual(await auth.login({login:'employee_test',password:'SyntheticPassword_12345',source:'after_change_old'}),fail);
 const current=await auth.login({login:'employee_test',password:'ChangedSyntheticPassword_2026',source:'after_change_new'});
 assert.equal(current.restricted,false);
 assert.deepEqual(await auth.logout(current.token),{code:'LOGOUT_OK'});
 assert.deepEqual(await auth.logout(current.token),{code:'LOGOUT_OK'});
 assert.equal(await auth.withSession(current.token,async()=>true),null);
 console.log('F03-1 FIRST CHANGE, REVOCATION, LOGOUT PASS');
});
test('admin control identity only and internal reset/disable/enable revoke sessions',async()=>{
 const adm=await auth.login({login:'admin_test',password:'SyntheticAdmin_1234567',source:'admin'});
 assert.equal(adm.code,'AUTH_OK');assert.equal(adm.restricted,false);
 const subject=await auth.login({login:'employee_test',password:'ChangedSyntheticPassword_2026',source:'subject'});
 assert.equal(subject.code,'AUTH_OK');
 assert.deepEqual(await auth.govern({actorToken:subject.token,targetId:1,action:'reset',temporaryPassword:'NewSyntheticReset_45678'}),fail);
 const res=await auth.govern({actorToken:adm.token,targetId:1,action:'reset',temporaryPassword:'NewSyntheticReset_45678'});
 assert.equal(res.code,'GOVERNANCE_OK');
 assert.equal(await auth.withSession(subject.token,async()=>true),null);
 assert.deepEqual(await auth.login({login:'employee_test',password:'ChangedSyntheticPassword_2026',source:'reset_old'}),fail);
 const newlogin=await auth.login({login:'employee_test',password:'NewSyntheticReset_45678',source:'reset_new'});
 assert.equal(newlogin.restricted,true);
 assert.equal((await auth.govern({actorToken:adm.token,targetId:1,action:'disable'})).code,'GOVERNANCE_OK');
 assert.deepEqual(await auth.login({login:'employee_test',password:'NewSyntheticReset_45678',source:'disabled'}),fail);
 assert.equal((await auth.govern({actorToken:adm.token,targetId:1,action:'enable'})).code,'GOVERNANCE_OK');
 assert.equal((await auth.login({login:'employee_test',password:'NewSyntheticReset_45678',source:'enabled'})).restricted,true);
 // Until last-admin transaction exists, ALL admin disable attempts are rejected.
 assert.deepEqual(await auth.govern({actorToken:adm.token,targetId:2,action:'disable'}),fail);
 assert.deepEqual(await auth.govern({actorToken:adm.token,targetId:4,action:'reset',temporaryPassword:'NewSyntheticReset_45678'}),fail);
 console.log('F03-1 GOVERNANCE ATOMIC EPOCH / LAST ADMIN HARD DENY PASS');
});
test('4S grant and revocation are current DB facts, not stored session permissions',async()=>{
 const c=await connect();
 try{
  await c.query("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES(2,10,'allow',now())");
  const allowed=await auth.login({login:'four_s_test',password:'SyntheticFourS_123456',source:'4s_allowed'});
  assert.equal(allowed.code,'AUTH_OK');
  await c.query('BEGIN');
  await c.query("DELETE FROM public.employee_permission_overrides WHERE employee_id=2 AND permission_id=10");
  await c.query('UPDATE public.pc_login_accounts SET credential_epoch=credential_epoch+1 WHERE account_id=3');
  await c.query('COMMIT');
  assert.equal(await auth.withSession(allowed.token,async()=>true),null);
  assert.deepEqual(await auth.login({login:'four_s_test',password:'SyntheticFourS_123456',source:'4s_revoked'}),fail);
 }finally{await c.end()}
 console.log('F03-1 4S CURRENT FACTS PASS');
});
test('simultaneous double password change admits at most one and never revives old token',async()=>{
 const before=await auth.login({login:'employee_test',password:'NewSyntheticReset_45678',source:'double_change'});
 assert.equal(before.code,'AUTH_OK');
 const call=(password)=>auth.change({token:before.token,csrf:before.csrf,oldPassword:'NewSyntheticReset_45678',newPassword:password});
 const answers=await Promise.all([call('SyntheticWinnerOne_01234'),call('SyntheticWinnerTwo_01234')]);
 assert.equal(answers.filter(x=>x.code==='PASSWORD_CHANGED_REAUTH_REQUIRED').length,1);
 assert.equal(await auth.withSession(before.token,async()=>true),null);
 console.log('F03-1 REAL SERIALIZED DOUBLE CHANGE PASS');
});
test('actual login vs reset/disable and password-change vs reset are serialized, no stale session survives',async()=>{
 const admin=await auth.login({login:'admin_test',password:'SyntheticAdmin_1234567',source:'races_admin'});
 assert.equal(admin.code,'AUTH_OK');
 const [rLogin,rReset]=await Promise.all([
  auth.login({login:'race_test',password:'SyntheticRace_1234567',source:'race_login'}),
  auth.govern({actorToken:admin.token,targetId:7,action:'reset',temporaryPassword:'SyntheticRaceReset_1234567'})
 ]);
 assert.equal(rReset.code,'GOVERNANCE_OK');
 if(rLogin.code==='AUTH_OK')assert.equal(await auth.withSession(rLogin.token,async()=>true),null);
 assert.deepEqual(await auth.login({login:'race_test',password:'SyntheticRace_1234567',source:'race_old'}),fail);
 const [rLogin2,rDisable]=await Promise.all([
  auth.login({login:'race_test',password:'SyntheticRaceReset_1234567',source:'race_again'}),
  auth.govern({actorToken:admin.token,targetId:7,action:'disable'})
 ]);
 assert.equal(rDisable.code,'GOVERNANCE_OK');
 if(rLogin2.code==='AUTH_OK')assert.equal(await auth.withSession(rLogin2.token,async()=>true),null);
 assert.deepEqual(await auth.login({login:'race_test',password:'SyntheticRaceReset_1234567',source:'race_disabled'}),fail);
 assert.equal((await auth.govern({actorToken:admin.token,targetId:7,action:'enable'})).code,'GOVERNANCE_OK');
 const session=await auth.login({login:'race_test',password:'SyntheticRaceReset_1234567',source:'race_change'});
 assert.equal(session.code,'AUTH_OK');assert.equal(session.restricted,true);
 const [change,reset]=await Promise.all([
  auth.change({token:session.token,csrf:session.csrf,oldPassword:'SyntheticRaceReset_1234567',newPassword:'SyntheticChangeRace_1234567'}),
  auth.govern({actorToken:admin.token,targetId:7,action:'reset',temporaryPassword:'SyntheticResetRace2_1234567'})
 ]);
 assert.equal(reset.code,'GOVERNANCE_OK');
 assert.ok(['PASSWORD_CHANGED_REAUTH_REQUIRED','AUTH_FAILED'].includes(change.code));
 assert.equal(await auth.withSession(session.token,async()=>true),null);
 const fresh=await auth.login({login:'race_test',password:'SyntheticResetRace2_1234567',source:'race_final'});
 assert.equal(fresh.code,'AUTH_OK');
 const c=await connect();
 try{
  await c.query('BEGIN');
  await c.query("UPDATE public.employees SET employment_status='inactive' WHERE employee_id=6");
  await c.query('UPDATE public.pc_login_accounts SET credential_epoch=credential_epoch+1 WHERE account_id=7');
  await c.query("UPDATE public.pc_auth_sessions SET revoked_at=COALESCE(revoked_at,now()) WHERE account_id=7");
  await c.query('COMMIT');
  assert.equal(await auth.withSession(fresh.token,async()=>true),null);
  await c.query("UPDATE public.employees SET employment_status='active' WHERE employee_id=6");
  assert.equal(await auth.withSession(fresh.token,async()=>true),null,'rehire cannot resurrect stale session');
 }finally{await c.end()}
 console.log('F03-1 PG16 LOGIN RESET DISABLE CHANGE STATUS CONCURRENCY PASS');
});
test('account failed-attempt limit and cooldown reset (single-process CI topology)',async()=>{
 for(let i=0;i<5;i++)assert.deepEqual(await auth.login({login:'limit_test',password:'SyntheticWrong_1234567',source:'limit_ip_'+i}),fail);
 assert.deepEqual(await auth.login({login:'limit_test',password:'SyntheticLimit_1234567',source:'limit_burst'}),fail);
 const entry=auth.attempts.get('a:limit_test');
 assert.ok(entry.blocked>Date.now());
 // Synthetic clock transition of the in-memory limiter; no 60s sleep.
 entry.blocked=Date.now()-1;
 const recovered=await auth.login({login:'limit_test',password:'SyntheticLimit_1234567',source:'limit_cooldown'});
 assert.equal(recovered.code,'AUTH_OK');
 assert.equal(auth.attempts.has('a:limit_test'),false,'successful proof clears failure counter');
 console.log('F03-1 ONE PROCESS ACCOUNT FAILURE LIMIT AND COOLDOWN PASS');
});
test('real PG16 forged tokens, absolute expiry, idle expiry and future last_seen deny',async()=>{
 assert.equal(await auth.withSession('A'.repeat(43),async()=>true),null);
 const entry=await auth.login({login:'limit_test',password:'SyntheticLimit_1234567',source:'session_expiry'});
 assert.equal(entry.code,'AUTH_OK');
 const digest=(await import('../../src/f03-auth-crypto.mjs')).sessionDigest(entry.token,secret);
 const c=await connect();
 try{
  const row=(await c.query('SELECT session_id FROM public.pc_auth_sessions WHERE token_digest=$1',[digest])).rows[0];
  assert.ok(row?.session_id);
  const id=row.session_id;
  await c.query("UPDATE public.pc_auth_sessions SET issued_at=now()-interval '1 hour',expires_at=now()-interval '1 second',last_seen_at=NULL WHERE session_id=$1",[id]);
  assert.equal(await auth.withSession(entry.token,async()=>true),null,'absolute expiry');
  await c.query("UPDATE public.pc_auth_sessions SET issued_at=now()-interval '1 hour',expires_at=now()+interval '11 hours',last_seen_at=now()-interval '31 minutes' WHERE session_id=$1",[id]);
  assert.equal(await auth.withSession(entry.token,async()=>true),null,'idle expiry');
  await c.query("UPDATE public.pc_auth_sessions SET issued_at=now()-interval '1 minute',expires_at=now()+interval '11 hours',last_seen_at=now()+interval '5 minutes' WHERE session_id=$1",[id]);
  assert.equal(await auth.withSession(entry.token,async()=>true),null,'future activity not authorized');
  await c.query("UPDATE public.pc_auth_sessions SET issued_at=now()-interval '1 minute',expires_at=now()+interval '11 hours',last_seen_at=now()-interval '1 second',credential_epoch=credential_epoch+1 WHERE session_id=$1",[id]);
  assert.equal(await auth.withSession(entry.token,async()=>true),null,'wrong credential epoch');
 }finally{await c.end()}
 console.log('F03-1 LIVE SESSION FORGERY, ABSOLUTE/IDLE/FUTURE TIME, EPOCH PASS');
});
test('audit contains only redacted version and states, not synthetic test secrets',async()=>{
 const c=await connect();
 try{
  const rows=(await c.query("SELECT action,before_json,after_json FROM public.audit_events WHERE action LIKE 'pc_%'")).rows;
  assert.ok(rows.length>=3);
  for(const x of rows){
   const data=JSON.stringify(x);
   for(const secret of ['SyntheticPassword','SyntheticAdmin','NewSyntheticReset','scrypt$','token_digest','password_hash','csrf'])assert.equal(data.includes(secret),false);
  }
  const result=(await c.query("SELECT count(*)::int AS n FROM public.pc_auth_sessions")).rows[0];
  assert.ok(result.n>=3);
 }finally{await c.end()}
 console.log('F03-1 REAL AUDIT NO-SECRET PASS');
});
