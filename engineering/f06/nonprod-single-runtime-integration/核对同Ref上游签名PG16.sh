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
  if(x.db!=="f03_auth_test"||x.u!=="f03_ci"||x.n!==23||!x.pid)throw Error("F06_164_F05_SIGNED_PG16_IDENTITY_MISMATCH");
  console.log("F06_164_ACTUAL_CURRENT_REF_F05_7_NATIVE_V23",JSON.stringify({sha:process.env.GITHUB_SHA,ref:process.env.GITHUB_REF,pid:x.pid,migrationCount:x.n}));
 }finally{await c.end()}
'
echo 'F06_164_F05_7_NATIVE_V23_BOOTSTRAP_ONLY_NO_FINANCE_ISSUER'
