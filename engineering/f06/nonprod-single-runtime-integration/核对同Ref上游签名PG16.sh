#!/usr/bin/env bash
# Diagnosis, not accepted end-to-end composite issuer or F05 re-implementation.
set -euo pipefail
test "$GITHUB_REPOSITORY" = suzhe868-arch/mb
test "$GITHUB_EVENT_NAME" = push
test "$GITHUB_ACTIONS" = true
case "$GITHUB_REF" in
  refs/heads/feat/f06-nonprod-single-runtime-trusted-source-01|refs/heads/feat/f06-nonprod-composite-lock-lifecycle-01) ;;
  *) echo 'F06_EXACT_PUSH_SOURCE_NOT_ALLOWED' >&2; exit 1 ;;
esac
test "$GITHUB_REF_NAME" = "${GITHUB_REF#refs/heads/}"
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
node --input-type=module -e '
 import {randomBytes} from "node:crypto";
 import {IsolatedAuth} from "./engineering/src/f03-auth-service.mjs";
 import {connect,verify} from "./engineering/f05/deterministic-matching-readiness-four-tier/migration.mjs";
 import {saveSalesDescriptionCI,calculateCI} from "./engineering/f05/deterministic-matching-readiness-four-tier/service.mjs";
 const c=await connect(),secret=randomBytes(32);
 const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin:"https://127.0.0.1:48988"});
 try{
  const signed=await verify(c);
  if(!signed.verified)throw Error("F06_171_V23_SIGNED_F05_7_REQUIRED");
  const session=await auth.login({login:"employee_test",password:"SyntheticF04_3_CurrentProof_2026",source:"issue171-real-f05-match-seed-before-v24"});
  if(session.code!=="AUTH_OK"||session.restricted)throw Error("F06_171_V23_CURRENT_EMPLOYEE_SESSION_REQUIRED");
  const demands=(await c.query(
   "SELECT d.demand_id::text demand_id,d.customer_id::text customer_id FROM public.demands d "+
   "JOIN public.customers cs ON cs.customer_id=d.customer_id "+
   "WHERE d.customer_id IN(899612,899613,899618,899619,899620) AND d.demand_state=$1 "+
   "AND cs.account_status=$2 AND cs.owner_assignment_state=$3 "+
   "AND d.responsible_employee_id=cs.current_owner_employee_id AND cs.current_owner_employee_id=1 "+
   "ORDER BY d.customer_id,d.demand_id",["active","active","assigned"]
  )).rows;
  const vehicles=(await c.query(
   "SELECT vf.vehicle_id::text vehicle_id,vf.listing_cycle_id::text cycle_id "+
   "FROM public.f05_7_vehicle_facts_ci vf JOIN public.vehicles v ON v.vehicle_id=vf.vehicle_id "+
   "JOIN public.vehicle_listing_cycles cyc ON cyc.listing_cycle_id=vf.listing_cycle_id AND cyc.vehicle_id=v.vehicle_id "+
   "WHERE vf.available=true AND v.source_type=$1 AND v.source_sale_status=$2 AND v.archived_at IS NULL "+
   "AND cyc.ended_at IS NULL AND jsonb_extract_path_text(vf.facts_json,$3,$4)::int>=2025 "+
   "ORDER BY v.vehicle_id LIMIT 5",["wholesale","active","model_year","value"]
  )).rows;
  if(demands.length<3)throw Error("F06_171_V23_CURRENT_DEMAND_FIXTURES_REQUIRED_"+demands.length);
  if(vehicles.length<1)throw Error("F06_171_V23_CURRENT_SALEABLE_MATCH_VEHICLE_REQUIRED");
  const description="奥迪A6 2026款 5万公里以内 黑色外观 米色内饰 预算10万";
  let created=0;
  for(const d of demands){
   const ready=await saveSalesDescriptionCI(auth,session.token,{demandId:Number(d.demand_id),teamId:901,description});
   if(!ready.allowed)throw Error("F06_171_V23_OFFICIAL_F05_7_DESCRIPTION_REJECTED_"+JSON.stringify({demand:d.demand_id,result:ready}));
   for(const v of vehicles){
    const match=await calculateCI(auth,session.token,{
     demandId:Number(d.demand_id),vehicleId:Number(v.vehicle_id),listingCycleId:Number(v.cycle_id),teamId:901,
     runKey:"issue171-real-f05-priority-"+process.env.GITHUB_RUN_ID+"-"+d.demand_id+"-"+v.vehicle_id
    });
    if(!match.allowed)throw Error("F06_171_V23_OFFICIAL_F05_7_MATCH_REJECTED_"+JSON.stringify({demand:d.demand_id,vehicle:v.vehicle_id,result:match}));
    created++;
   }
  }
  const current=(await c.query(
   "SELECT count(*)::int n FROM public.f05_7_result_versions_ci r JOIN public.demands d ON d.demand_id=r.demand_id "+
   "WHERE d.customer_id IN(899612,899613,899618,899619,899620) AND r.status=$1 AND r.tier=ANY($2::text[])",
   ["current",["high","acceptable"]]
  )).rows[0].n;
  if(Number(current)<1)throw Error("F06_171_V23_SIGNED_CURRENT_MATCH_RESULTS_MISSING");
  console.log("F06_171_V23_CURRENT_MATCHES_SEEDED",JSON.stringify({
   sha:process.env.GITHUB_SHA,runId:process.env.GITHUB_RUN_ID,ledgerVersion:23,
   demandCount:demands.length,vehicleCount:vehicles.length,created,currentResults:Number(current)
  }));
 }finally{await auth.close();await c.end();secret.fill(0)}
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
  const {applyCompositeCancelSidecar,verifyCompositeCancelSidecar}=await import("./engineering/f06/transaction-cancel-http-pg16/service.mjs");
  const cancel=await applyCompositeCancelSidecar(db);
  if(!cancel)throw Error("F06_164_PR146_COMPOSITE_PARENT_SIDECAR_MISSING");
  const cancelCheck=await verifyCompositeCancelSidecar(db);
  if(!cancelCheck.parent?.verified)throw Error("F06_164_PR146_PARENT_SEAL_INVALID");
  console.log("F06_164_PR146_OLD_API_STILL_CLOSED_NEW_PATH_PARENT_ONLY_SEALED",JSON.stringify({sha:process.env.GITHUB_SHA}));
  const refundModule=await import("./engineering/f06/transaction-refund-http-pg16/service.mjs");
  const refund=await refundModule.applyComposite(db);
  if(!refund.verified)throw Error("F06_164_PR150_COMPOSITE_REFUND_CORE_NOT_SIGNED");
  console.log("F06_164_PR150_ORIGINAL_REFUND_CORE_SIDECAR_SIGNED",JSON.stringify({sha:process.env.GITHUB_SHA,sourceSHA:refund.sourceSHA}));
  const handoffModule=await import("./engineering/f06/transaction-handoff-http-pg16/service.mjs");
  const handoff=await handoffModule.applyComposite(db);
  if(!handoff.verified)throw Error("F06_164_PR153_COMPOSITE_HANDOFF_NOT_SIGNED");
  console.log("F06_164_PR153_NATIVE_HANDOFF_SIDECAR_SIGNED",JSON.stringify({sha:process.env.GITHUB_SHA,sourceSHA:handoff.sourceSHA}));
  const postCancelModule=await import("./engineering/f06/post-handoff-cancel-http-pg16/service.mjs");
  const postCancel=await postCancelModule.applyComposite(db);
  if(!postCancel.verified)throw Error("F06_164_PR156_COMPOSITE_CANCEL_NOT_SIGNED");
  console.log("F06_164_PR156_NATIVE_POST_HANDOFF_CANCEL_SIDECAR_SIGNED",JSON.stringify({sha:process.env.GITHUB_SHA,sourceSHA:postCancel.sourceSHA}));
 }finally{await db.end()}
'
test "$GITHUB_REF" = "$original_ref"
test "$GITHUB_REF_NAME" = "$original_name"
echo 'F06_164_AUTHENTIC_F05_24_PLUS_F06_FIVE_SCHEMAS_ONLY; BUSINESS_ORIGINS_NOT_YET_ISSUED'
