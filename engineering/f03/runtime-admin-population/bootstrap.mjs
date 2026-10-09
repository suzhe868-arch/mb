// Full first-account bootstrap restricted to disposable CI installer; never exported to HTTP.
import {connect,verify} from './migration.mjs';
import {hashPassword} from '../../src/f03-auth-crypto.mjs';
const allowed=()=>process.env.CI==='true'&&process.env.GITHUB_ACTIONS==='true'&&process.env.F03_2B_INSTALLER_CONFIRM==='I_AUTHORIZE_DISPOSABLE_PG16_FIRST_BOOTSTRAP_ONLY';
export async function claimFirstBootstrap({testCheckpoint}={}){
 if(!allowed())throw Error('F03_2B_INSTALLER_DENIED');
 if(testCheckpoint!==undefined&&typeof testCheckpoint!=='function')throw Error('F03_2B_CI_CHECKPOINT_DENIED');
 const c=await connect();
 try{
  await verify(c);
  // Real KDF outside DB lock; no password/hash/secret ever logged or returned.
  const passwordHash=await hashPassword('SyntheticBootstrapAdmin_2026');
  await c.query('BEGIN');
  try{
   await c.query('SELECT pg_advisory_xact_lock(20261009,304)');
   const g=(await c.query("SELECT version,bootstrap_claimed_at FROM public.governance_population_guards WHERE guard_name='system_admin' FOR UPDATE")).rows;
   if(g.length!==1)throw Error('F03_2B_GUARD_MISSING');
   const ever=(await c.query('SELECT count(*)::integer n FROM public.system_admins')).rows[0].n;
   if(g[0].bootstrap_claimed_at!==null||ever!==0)throw Error('F03_2B_BOOTSTRAP_ALREADY_USED');
   await c.query("INSERT INTO public.system_admins(system_admin_id,account_status,bootstrap_origin) VALUES(9,'active','bootstrap')");
   if(testCheckpoint)await testCheckpoint('after_admin',c);
   await c.query("INSERT INTO public.pc_login_accounts(account_id,normalized_login_key,principal_kind,system_admin_id,password_hash,credential_state,force_password_change) VALUES(2,'bootstrap_admin_ci','system_admin',9,$1,'enabled',true)",[passwordHash]);
   if(testCheckpoint)await testCheckpoint('after_credential',c);
   await c.query("INSERT INTO public.audit_events(actor_kind,actor_id,role_context,object_kind,object_id,action,before_json,after_json,occurred_at) VALUES('system','ci_installer',$1::jsonb,'system_admin','9','system_admin.bootstrap_claim',NULL,$2::jsonb,transaction_timestamp())",[JSON.stringify({isolated_ci:true}),JSON.stringify({claimed:true,admin_id:9})]);
   if(testCheckpoint)await testCheckpoint('after_audit',c);
   await c.query("UPDATE public.governance_population_guards SET version=version+1,bootstrap_claimed_at=transaction_timestamp() WHERE guard_name='system_admin'");
   if(testCheckpoint)await testCheckpoint('before_commit',c);
   await c.query('COMMIT');
   return {code:'BOOTSTRAP_CLAIMED'};
  }catch(e){await c.query('ROLLBACK');throw e}
 }finally{await c.end()}
}
