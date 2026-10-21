// Issue164 exact opt-in signed-only root for NEW private composite entry.
// Never rewrites GH_REF or impersonates a legacy historical signer.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const expectedBranch='feat/f06-nonprod-single-runtime-trusted-source-01';
const dsn='postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test';
const required=Object.freeze({
  GITHUB_REPOSITORY:'suzhe868-arch/mb',
  GITHUB_ACTIONS:'true',GITHUB_EVENT_NAME:'push',
  GITHUB_REF:'refs/heads/'+expectedBranch,GITHUB_REF_NAME:expectedBranch,
  CI:'true',APP_ENV:'test',NODE_ENV:'test',
  API_HOST:'127.0.0.1',
  F03_1_DATABASE_URL:dsn,
  F03_1_ISOLATION_CONFIRM:'I_AUTHORIZE_F03_1_NEW_EMPTY_PG16_AUTH_ONLY',
  F05_2_ISOLATION_CONFIRM:'I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY',
  F06_COMPOSITE_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F06_COMPOSITE_ONLY',
  F06_COMPOSITE_SIGNED_ISSUER:'COMPOSITE_NONPROD_SIGNED_V1'
});
export function assertCompositeSignedRun(env=process.env){
 for(const [key,value] of Object.entries(required))
  assert.equal(env[key],value,'F06_COMPOSITE_NEW_ISSUER_DENIED_'+key);
 assert.match(env.GITHUB_SHA||'',/^[0-9a-f]{40}$/);
 assert.match(env.GITHUB_RUN_ID||'',/^[0-9]{6,20}$/);
 assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),env.GITHUB_SHA);
 return Object.freeze({issuer:'COMPOSITE_NONPROD_SIGNED_V1',sha:env.GITHUB_SHA,runId:env.GITHUB_RUN_ID});
}
export async function assertCompositeSignedPG(c,env=process.env){
 const root=assertCompositeSignedRun(env);
 const x=(await c.query("SELECT current_database() db,current_user usr,current_setting('server_version_num')::int ver,"+
  "(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) su,"+
  "(SELECT rolcreatedb FROM pg_roles WHERE rolname=current_user) cdb,"+
  "(SELECT rolcreaterole FROM pg_roles WHERE rolname=current_user) cr,"+
  "(SELECT count(*)::int FROM public.f03_schema_migrations) n")).rows[0];
 if(!x||x.db!=='f03_auth_test'||x.usr!=='f03_ci'||x.ver<160000||x.ver>=170000||
    x.su!==false||x.cdb!==false||x.cr!==false||x.n!==24)
  throw Error('F06_COMPOSITE_SIGNED_NONPRIVILEGED_24_LEDGER_DENIED');
 const {verifyCompositeAttestation}=await import('./composite-issuer.mjs');
 const signed=await verifyCompositeAttestation(c);
 if(!signed.verified||signed.headSHA!==root.sha||signed.runId!==root.runId)
  throw Error('F06_COMPOSITE_SIGNED_V1_ISSUER_REQUIRED');
 return root;
}
