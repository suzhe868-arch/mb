#!/usr/bin/env bash
# Diagnosis, not accepted end-to-end composite issuer or F05 re-implementation.
set -euo pipefail
test "$GITHUB_REPOSITORY" = suzhe868-arch/mb
test "$GITHUB_EVENT_NAME" = push
test "$GITHUB_ACTIONS" = true
test "$GITHUB_REF" = refs/heads/feat/f06-nonprod-single-runtime-trusted-source-01
test "$(git rev-parse HEAD)" = "$GITHUB_SHA"
original_ref="$GITHUB_REF"
original_name="$GITHUB_REF_NAME"
# The upstream F05-7 HTTPS mode does NOT request the old source-mode 66-job audit,
# and is invoked unchanged under the true GitHub branch. No old Env spoofing.
docker tag postgres:16-alpine public.ecr.aws/docker/library/postgres:16-alpine
bash engineering/f05/deterministic-matching-readiness-four-tier/ci-job.sh https
test "$GITHUB_REF" = "$original_ref"
test "$GITHUB_REF_NAME" = "$original_name"
export F03_1_DATABASE_URL='postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test'
export CI=true APP_ENV=test NODE_ENV=test
export F03_1_ISOLATION_CONFIRM=I_AUTHORIZE_F03_1_NEW_EMPTY_PG16_AUTH_ONLY
export F05_2_ISOLATION_CONFIRM=I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY
node --input-type=module -e '
 import {connect,verify} from "./engineering/f05/deterministic-matching-readiness-four-tier/migration.mjs";
 const c=await connect();
 try{
  const v=await verify(c);
  if(!v.verified)throw Error("F06_164_SIGNED_F05_7_NOT_NATIVE");
  const x=(await c.query("SELECT current_database() db,current_user u,(SELECT count(*)::int FROM public.f03_schema_migrations) n, pg_backend_pid() pid")).rows[0];
  if(x.db!=="f03_auth_test"||x.u!=="f03_ci"||x.n!==21||!x.pid)throw Error("F06_164_F05_SIGNED_PG16_IDENTITY_MISMATCH");
  console.log("F06_164_ACTUAL_CURRENT_REF_F05_7_NATIVE_21_LEDGER",JSON.stringify({sha:process.env.GITHUB_SHA,ref:process.env.GITHUB_REF,pid:x.pid,migrationCount:x.n}));
 }finally{await c.end()}
'
# Signed M94 v23(21 rows) -> v24(22) -> v25(23) -> D1 independent -> v26(24).
# All frozen F05 migration functions independently verify parent seals, and no
# subprocess overwrites GITHUB_REF or GITHUB_REF_NAME for a legacy identity.
for step in priority-arbitration-ttl-handover recommendation-visibility-grants pdm17-public-pool-owner-claim consultation-assignee-sla; do
  node "engineering/f05/$step/runner.mjs" --apply
  node "engineering/f05/$step/runner.mjs" --verify
  test "$GITHUB_REF" = "$original_ref"
  test "$GITHUB_REF_NAME" = "$original_name"
done
node --input-type=module -e '
 import {connect,verify} from "./engineering/f05/consultation-assignee-sla/migration.mjs";
 const c=await connect();
 try{
  const v=await verify(c);if(!v.verified)throw Error("F06_164_SIGNED_V26_NOT_VERIFIED");
  const x=(await c.query("SELECT current_database() db,current_user usr,(SELECT count(*)::int FROM public.f03_schema_migrations) n,pg_backend_pid() pid")).rows[0];
  if(x.db!=="f03_auth_test"||x.usr!=="f03_ci"||x.n!==24)throw Error("F06_164_SIGNED_24_LEDGER_MISSING");
  console.log("F06_164_SIGNED_CURRENT_REF_REAL_24_MIGRATIONS",JSON.stringify({sha:process.env.GITHUB_SHA,ref:process.env.GITHUB_REF,pid:x.pid,count:x.n,catalog:v.catalogSHA}));
 }finally{await c.end()}
'
echo 'F06_164_SIGNED_F05_24_LEDGER_NO_REF_SPOOF_PASS; TX_ISSUER_NOT_YET_SIGNED'
# Under the new A-authorized dual gate, each schema is applied using its
# unchanged original sidecar.sql plus the *original* signed attestation formula.
# Parent verification and source hashing are never bypassed, nor is GH_REF altered.
export F06_COMPOSITE_TEST_CONSENT='I_AUTHORIZE_DISPOSABLE_F06_COMPOSITE_ONLY'
export F06_COMPOSITE_SIGNED_ISSUER='COMPOSITE_NONPROD_SIGNED_V1'
export API_HOST=127.0.0.1
node --input-type=module -e '
 import pg from "./engineering/node_modules/pg/lib/index.js";
 const db=new pg.Client({connectionString:process.env.F03_1_DATABASE_URL});
 await db.connect();
 const {issueCompositeAttestation,verifyCompositeAttestation}=await import("./engineering/f06/nonprod-single-runtime-integration/composite-issuer.mjs");
 const issued=await issueCompositeAttestation(db);
 if(!issued.verified)throw Error("F06_164_NATIVE_COMPOSITE_ISSUER_MISSING");
 const reviewed=await verifyCompositeAttestation(db);
 if(reviewed.headSHA!==process.env.GITHUB_SHA)throw Error("F06_164_COMPOSITE_SIGNER_WRONG_HEAD");
 console.log("F06_164_SIGNED_COMPOSITE_ISSUER_ATTESTED",JSON.stringify({
  sha:reviewed.headSHA,issuer:reviewed.issuer,sourceSHA:reviewed.sourceSHA,dbOid:String(reviewed.databaseOid)}));
 const paths=[
  "./engineering/f06/lockrequest-approval-waitlist-ci/migration.mjs",
  "./engineering/f06/lock-lifecycle-ci/migration.mjs",
  "./engineering/f06/deposit-ledger-ci/migration.mjs",
  "./engineering/f06/lock-transaction-ci/migration.mjs",
  "./engineering/f06/refund-pending-ci/migration.mjs"
 ];
 try{
  for(let i=0;i<paths.length;i++){
   const mod=await import(paths[i]);
   if(typeof mod.applyComposite!=="function"||typeof mod.verifyComposite!=="function")
    throw Error("F06_164_NATIVE_DUAL_GATE_MISSING_"+i);
   const signed=await mod.applyComposite(db);
   if(!signed?.verified)throw Error("F06_164_COMPOSITE_PARENT_APPLY_NOT_SIGNED_"+i);
   const verify=await mod.verifyComposite(db);
   if(!verify.verified)throw Error("F06_164_COMPOSITE_PARENT_VERIFY_FAILED_"+i);
   let oldDenied=false;
   try{mod.gate()}catch(e){oldDenied=/ISOLAT|FORBIDDEN|SIGNED_RUN|UNSIGNED|GITHUB_REF/.test(e.message)}
   if(!oldDenied)throw Error("F06_164_LEGACY_CI_GATE_MUST_REJECT_NEW_REF_"+i);
   console.log("F06_164_CURRENT_REF_ORIGINAL_SQL_SIGNED_COMPOSITE_STEP_PASS",JSON.stringify({
    i,sha:process.env.GITHUB_SHA,ref:process.env.GITHUB_REF,source:paths[i]}));
  }
  const n=(await db.query("SELECT count(*)::int n FROM public.f03_schema_migrations")).rows[0].n;
  if(n!==24)throw Error("F06_164_SIGNED_PUBLIC_LEDGER_DRIFT");
  console.log("F06_164_FIVE_NATIVE_PARENT_SCHEMA_STEPS_SIGNED_NO_LEGACY_REF_SPOOF",JSON.stringify({sha:process.env.GITHUB_SHA,migrations:n}));
  const {applyCompositeTransactionSidecar,verifyCompositeTransactionSidecar}=await import("./engineering/f06/lock-transaction-http-pg16/service.mjs");
  const txSidecar=await applyCompositeTransactionSidecar(db);
  const txCheck=await verifyCompositeTransactionSidecar(db);
  if(!txSidecar.verified||!txCheck.verified)throw Error("F06_164_PR139_COMPOSITE_SIDECAR_NOT_VERIFIED");
  console.log("F06_164_PR139_NATIVE_LOCK_TO_TRANSACTION_SIDECAR_VERIFIED",JSON.stringify({
   sha:process.env.GITHUB_SHA,sidecarSHA:txCheck.sidecarSHA,catalog:txCheck.catalog}));
 }finally{await db.end()}
'
test "$GITHUB_REF" = "$original_ref"
test "$GITHUB_REF_NAME" = "$original_name"
echo 'F06_164_AUTHENTIC_F05_24_PLUS_F06_FIVE_SCHEMAS_ONLY; BUSINESS_ORIGINS_NOT_YET_ISSUED'
