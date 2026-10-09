import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {connect,verify} from '../migration.mjs';
import {claimFirstBootstrap as claim} from '../bootstrap.mjs';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
const db=await connect();
test.after(async()=>db.end());
test('A2B-02 fresh disposable database atomic claim: exactly one winner and audited identity',async()=>{
 const before=(await db.query("SELECT count(*)::integer n FROM public.system_admins")).rows[0].n;assert.equal(before,0);
 const claims=await Promise.allSettled([claim(),claim(),claim()]);
 assert.equal(claims.filter(x=>x.status==='fulfilled').length,1);
 assert.equal(claims.filter(x=>x.status==='rejected'&&/BOOTSTRAP_ALREADY_USED/.test(x.reason?.message)).length,2);
 const g=(await db.query('SELECT version,bootstrap_claimed_at FROM public.governance_population_guards')).rows[0];
 assert.equal(Number(g.version),1);assert.ok(g.bootstrap_claimed_at instanceof Date);
 assert.equal((await db.query("SELECT count(*)::integer n FROM public.system_admins WHERE account_status='active'")).rows[0].n,1);
 assert.equal((await db.query("SELECT count(*)::integer n FROM public.audit_events WHERE action='system_admin.bootstrap_claim'")).rows[0].n,1);
 const secret=randomBytes(32);
 const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin:'https://127.0.0.1:48628'});
 try{
  const first=await auth.login({login:'bootstrap_admin_ci',password:'SyntheticBootstrapAdmin_2026',source:'sg05_bootstrap'});
  assert.equal(first.code,'AUTH_OK');assert.equal(first.restricted,true);
  const changed=await auth.change({token:first.token,csrf:first.csrf,oldPassword:'SyntheticBootstrapAdmin_2026',newPassword:'SyntheticBootstrapNormal_2026'});
  assert.equal(changed.code,'PASSWORD_CHANGED_REAUTH_REQUIRED');
  const second=await auth.login({login:'bootstrap_admin_ci',password:'SyntheticBootstrapNormal_2026',source:'sg05_bootstrap2'});
  assert.equal(second.code,'AUTH_OK');assert.equal(second.restricted,false);
  await assert.rejects(()=>claim(),/BOOTSTRAP_ALREADY_USED/);
  await db.query("UPDATE public.system_admins SET account_status='inactive'");
  await db.query("UPDATE public.pc_login_accounts SET credential_state='disabled' WHERE principal_kind='system_admin'");
  await assert.rejects(()=>claim(),/BOOTSTRAP_ALREADY_USED/);
  assert.equal((await verify(db)).verified,true);
 }finally{await auth.close();secret.fill(0)}
});
