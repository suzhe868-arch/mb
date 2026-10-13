#!/usr/bin/env bash
set -euo pipefail
mode="$1"
case "$mode" in source|https);; *) exit 65;; esac
test "$GITHUB_ACTIONS" = true
test "$GITHUB_REPOSITORY" = suzhe868-arch/mb
test -n "$GITHUB_RUN_ID"
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
node f05/pdm17-public-pool-owner-claim/runner.mjs --inject-rollback
node f05/pdm17-public-pool-owner-claim/runner.mjs --apply
node f05/pdm17-public-pool-owner-claim/runner.mjs --verify
if [[ "$mode" = source ]];then node f05/pdm17-public-pool-owner-claim/fixtures.mjs;fi
if [[ "$mode" = https ]];then
 openssl req -x509 -newkey rsa:2048 -sha256 -nodes -days 1 -keyout /tmp/f04-3-ci-key.pem \
 -out /tmp/f04-3-ci-cert.pem -subj '/CN=localhost' >/dev/null 2>&1
 chmod 600 /tmp/f04-3-ci-key.pem
fi
path="f05/pdm17-public-pool-owner-claim/artifacts/$mode"
mkdir -p "$path"
node --test "f05/pdm17-public-pool-owner-claim/tests/$mode.test.mjs" 2>&1 | tee "$path/native-pg16-$mode.log"
grep -q '# fail 0' "$path/native-pg16-$mode.log"
node f05/pdm17-public-pool-owner-claim/runner.mjs --verify
node f05/pdm17-public-pool-owner-claim/evidence.mjs "$mode"
if [[ "$mode" = source ]];then node f05/pdm17-public-pool-owner-claim/ci-verify-72.mjs;fi
ids="$(docker ps --filter ancestor=public.ecr.aws/docker/library/postgres:16-alpine --format '{{.ID}}')"
test "$(printf '%s\n' "$ids" | sed '/^$/d' | wc -l)" -eq 1
docker exec -e PGPASSWORD=f03_ci_synthetic_only "$ids" pg_dump --host=127.0.0.1 --username=f03_ci --dbname=f03_auth_test \
 --schema-only --no-owner --no-privileges --schema=public --schema=d1_owner_ci > "$path/native-m94-v25-plus-d1-schema.sql"
cp f05/pdm17-public-pool-owner-claim/来源与权限矩阵.tsv "$path/source-authority-matrix.tsv"
cp f05/pdm17-public-pool-owner-claim/B自验与A交接.md "$path/B-handoff.md"
( cd "$path" && sha256sum * > sha256sums.txt )
if grep -R -nE 'scrypt[$]v1[$]|__Host-mb_pc=[A-Za-z0-9_-]{43}|BEGIN PRIVATE KEY|mbci_[A-Za-z0-9_-]{43}' "$path";then exit 1;fi
echo "D1_SIGNED_V25_SEPARATE_CI_PG16_${mode}_COMPLETE"
