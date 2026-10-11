#!/usr/bin/env bash
# F05-3I isolated CI entry: actual PG16 000018 seal followed by additive 000019.
set -euo pipefail
mode="${1:-}"
case "$mode" in source|https) ;; *) exit 70 ;; esac
test "${GITHUB_ACTIONS:-}" = true
test "${GITHUB_REPOSITORY:-}" = suzhe868-arch/mb
test -n "${GITHUB_RUN_ID:-}"
export CI=true APP_ENV=test NODE_ENV=test
export F03_1_ISOLATION_CONFIRM=I_AUTHORIZE_F03_1_NEW_EMPTY_PG16_AUTH_ONLY
export F03_1_DATABASE_URL=postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test
export F05_2_ISOLATION_CONFIRM=I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY
export F04_1_ISOLATION_CONFIRM=I_AUTHORIZE_F04_1_DISPOSABLE_PG16_HTTPS_ONLY
export F04_2_ISOLATION_CONFIRM=I_AUTHORIZE_F04_2_DISPOSABLE_PG16_HTTPS_ONLY
export F04_3_ISOLATION_CONFIRM=I_AUTHORIZE_F04_3_DISPOSABLE_PG16_HTTPS_ONLY
export F04_4_ISOLATION_CONFIRM=I_AUTHORIZE_F04_4_DISPOSABLE_PG16_HTTPS_ONLY
export F05_1_ISOLATION_CONFIRM=I_AUTHORIZE_F05_1_DISPOSABLE_PG16_HTTPS_ONLY
# The tiny inherited 52-job workflow uses one independent Docker PG16 per new job.
# Work within engineering/ where package-lock and all legacy paths are located.
cd "$(dirname "${BASH_SOURCE[0]}")/../.."
docker run --detach --rm --name f05i-ci-pg16 -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=disposable_bootstrap_only -e POSTGRES_DB=postgres -p 5432:5432 public.ecr.aws/docker/library/postgres:16-alpine >/dev/null
ready=0
for attempt in $(seq 1 40); do
 if docker exec f05i-ci-pg16 pg_isready -U postgres -d postgres >/dev/null 2>&1; then ready=1; break; fi
 sleep 2
done
test "$ready" -eq 1
npm ci --ignore-scripts --no-audit --no-fund
ids="$(docker ps --filter ancestor=public.ecr.aws/docker/library/postgres:16-alpine --format '{{.ID}}')"
test "$(printf '%s\n' "$ids" | sed '/^$/d' | wc -l)" -eq 1
docker exec "$ids" psql -X -v ON_ERROR_STOP=1 -U postgres -d postgres -c "CREATE ROLE f03_ci WITH LOGIN PASSWORD 'f03_ci_synthetic_only' NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION"
docker exec "$ids" psql -X -v ON_ERROR_STOP=1 -U postgres -d postgres -c "CREATE DATABASE f03_auth_test OWNER f03_ci"
if [[ "$mode" = https ]]; then
 openssl req -x509 -newkey rsa:2048 -sha256 -nodes -subj '/CN=127.0.0.1' -days 1 -keyout /tmp/f04-3-ci-key.pem -out /tmp/f04-3-ci-cert.pem >/dev/null 2>&1
fi
node f05/wholesale-to-mingbang-conversion/ci-run.mjs source
node f05/wholesale-to-mingbang-conversion/runner.mjs --verify
node f05/favorite-physical-carrier/runner.mjs --inject-rollback
node f05/favorite-physical-carrier/runner.mjs --apply
node f05/favorite-physical-carrier/runner.mjs --verify
artifact="f05/favorite-conversion-v19-compat/artifacts/$mode"
mkdir -p "$artifact"
node --test "f05/favorite-conversion-v19-compat/tests/$mode.test.mjs" 2>&1 | tee "$artifact/true-pg16-$mode-tests.log"
grep -q '# fail 0' "$artifact/true-pg16-$mode-tests.log"
node f05/favorite-physical-carrier/runner.mjs --verify
node f05/favorite-conversion-v19-compat/evidence.mjs "$mode"
cp f05/favorite-conversion-v19-compat/来源与受信增量矩阵.tsv "$artifact/source-gap-matrix.tsv"
cp f05/favorite-conversion-v19-compat/B全包自验与A复验交接.md "$artifact/B-technical-handoff.md"
docker exec -e PGPASSWORD=f03_ci_synthetic_only "$ids" pg_dump --host=127.0.0.1 --username=f03_ci --dbname=f03_auth_test --schema-only --no-owner --no-privileges --schema=public > "$artifact/schema-only.sql"
(cd "$artifact" && sha256sum * > sha256sums.txt)
if grep -R -nE 'scrypt[$]v1[$]|__Host-mb_pc=[A-Za-z0-9_-]{43}|BEGIN PRIVATE KEY|mbci_[A-Za-z0-9_-]{43}' "$artifact"; then exit 1; fi
echo "F05_3I_NATIVE_PG16_V19_${mode}_CI_COMPLETE"
