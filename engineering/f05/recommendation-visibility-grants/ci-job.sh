#!/usr/bin/env bash
# F05-9 official independent disposable PG16 for Source and HTTPS.
set -euo pipefail
mode="${1:-}"
case "$mode" in source|https) ;; *) exit 65 ;; esac
test "${GITHUB_ACTIONS:-}" = true
test "${GITHUB_REPOSITORY:-}" = suzhe868-arch/mb
test -n "${GITHUB_RUN_ID:-}"
# Full signed physical M94-v23 bootstrap, actual 28 signed F05-7 Source cases.
# Reusing signed CI setup; no edits in the old F05-7 or F05-8 packages.
bash engineering/f05/priority-arbitration-ttl-handover/compat-job.sh source
export CI=true APP_ENV=test NODE_ENV=test
export F03_1_ISOLATION_CONFIRM=I_AUTHORIZE_F03_1_NEW_EMPTY_PG16_AUTH_ONLY
export F05_2_ISOLATION_CONFIRM=I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY
export F03_1_DATABASE_URL=postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test
cd engineering
node f05/priority-arbitration-ttl-handover/preseed-v23.mjs
node f05/priority-arbitration-ttl-handover/runner.mjs --inject-rollback
node f05/priority-arbitration-ttl-handover/runner.mjs --apply
node f05/priority-arbitration-ttl-handover/runner.mjs --verify
node f05/recommendation-visibility-grants/runner.mjs --inject-rollback
node f05/recommendation-visibility-grants/runner.mjs --apply
node f05/recommendation-visibility-grants/runner.mjs --verify
# Fresh loopback-only TLS identity for the HTTPS negative test job. The
# source test does not need a cert. Private key never enters an artifact.
if [[ "$mode" = https ]];then
 openssl req -x509 -newkey rsa:2048 -sha256 -nodes -days 1 \
  -keyout /tmp/f04-3-ci-key.pem -out /tmp/f04-3-ci-cert.pem \
  -subj '/CN=localhost' >/dev/null 2>&1
 chmod 600 /tmp/f04-3-ci-key.pem
fi
dir=f05/recommendation-visibility-grants/artifacts/"$mode"
mkdir -p "$dir"
node --test f05/recommendation-visibility-grants/tests/"$mode".test.mjs 2>&1 | tee "$dir/native-pg16-$mode.log"
grep -q '# fail 0' "$dir/native-pg16-$mode.log"
node f05/recommendation-visibility-grants/runner.mjs --verify
node f05/recommendation-visibility-grants/evidence.mjs "$mode"
if [[ "$mode" = source ]];then
 node --test f05/tests/source-gate-event-evidence.test.mjs 2>&1 | tee f05/recommendation-visibility-grants/artifacts/source/event-aware-evidence-tests.log
 grep -q '# fail 0' f05/recommendation-visibility-grants/artifacts/source/event-aware-evidence-tests.log
 node f05/recommendation-visibility-grants/ci-verify-70.mjs
fi
ids="$(docker ps --filter ancestor=public.ecr.aws/docker/library/postgres:16-alpine --format '{{.ID}}')"
test "$(printf '%s\n' "$ids" | sed '/^$/d' | wc -l)" -eq 1
docker exec -e PGPASSWORD=f03_ci_synthetic_only "$ids" pg_dump --host=127.0.0.1 --username=f03_ci --dbname=f03_auth_test --schema-only --no-owner --no-privileges --schema=public > "$dir/native-v25-schema-only.sql"
cp f05/recommendation-visibility-grants/F05-9_来源权利与展示权限矩阵.tsv "$dir/source-matrix.tsv"
cp f05/recommendation-visibility-grants/B全包自验与A交接.md "$dir/B-handoff.md"
( cd "$dir" && sha256sum * > sha256sums.txt )
if grep -R -nE 'scrypt[$]v1[$]|__Host-mb_pc=[A-Za-z0-9_-]{43}|BEGIN PRIVATE KEY|mbci_[A-Za-z0-9_-]{43}' "$dir";then exit 1;fi
echo "F05_9_V25_NATIVE_PG16_${mode}_COMPLETE"
