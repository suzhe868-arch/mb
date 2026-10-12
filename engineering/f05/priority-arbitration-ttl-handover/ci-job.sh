#!/usr/bin/env bash
# F05-8: four independent GitHub Actions jobs each bring up own disposable PG16.
set -euo pipefail
mode="${1:-}"
case "$mode" in compat-source|compat-https|priority-source|priority-https) ;; *) exit 70 ;; esac
test "${GITHUB_ACTIONS:-}" = true
test "${GITHUB_REPOSITORY:-}" = suzhe868-arch/mb
test -n "${GITHUB_RUN_ID:-}"
# The signed old M94-v23 setup is always run against a fresh individual PG16
# by the unchanged F05-7 shell's exact 28/7 business tests and signed SQL.
case "$mode" in
 compat-source|priority-source) prior=source ;;
 compat-https|priority-https) prior=https ;;
esac
bash engineering/f05/priority-arbitration-ttl-handover/compat-job.sh "$prior"
if [[ "$mode" = compat-* ]]; then
 echo "F05_8_GENUINE_SIGNED_F05_7_COMPAT_JOB_COMPLETE $mode"
 exit 0
fi
export CI=true APP_ENV=test NODE_ENV=test
export F05_2_ISOLATION_CONFIRM=I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY
export F03_1_DATABASE_URL=postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test
cd engineering
if [[ "$mode" = priority-source ]];then
 node f05/priority-arbitration-ttl-handover/preseed-v23.mjs
fi
node f05/priority-arbitration-ttl-handover/runner.mjs --inject-rollback
node f05/priority-arbitration-ttl-handover/runner.mjs --apply
node f05/priority-arbitration-ttl-handover/runner.mjs --verify
dir="f05/priority-arbitration-ttl-handover/artifacts/$mode"
mkdir -p "$dir"
node --test "f05/priority-arbitration-ttl-handover/tests/${mode#priority-}.test.mjs" 2>&1 | tee "$dir/real-pg16-$mode.log"
grep -q '# fail 0' "$dir/real-pg16-$mode.log"
node f05/priority-arbitration-ttl-handover/runner.mjs --verify
node f05/priority-arbitration-ttl-handover/evidence.mjs "$mode"
if [[ "$mode" = priority-source ]];then
 node f05/priority-arbitration-ttl-handover/ci-verify-68.mjs
fi
ids="$(docker ps --filter ancestor=public.ecr.aws/docker/library/postgres:16-alpine --format '{{.ID}}')"
test "$(printf '%s\n' "$ids" | sed '/^$/d' | wc -l)" -eq 1
docker exec -e PGPASSWORD=f03_ci_synthetic_only "$ids" pg_dump --host=127.0.0.1 --username=f03_ci --dbname=f03_auth_test --schema-only --no-owner --no-privileges --schema=public > "$dir/real-pg16-v24-schema-only.sql"
cp f05/priority-arbitration-ttl-handover/F05-8_PDM13来源权限矩阵.tsv "$dir/source-authority-matrix.tsv"
cp f05/priority-arbitration-ttl-handover/B全包自验与A复验交接.md "$dir/B-handoff.md"
( cd "$dir" && sha256sum * > sha256sums.txt )
if grep -R -nE 'scrypt[$]v1[$]|__Host-mb_pc=[A-Za-z0-9_-]{43}|BEGIN PRIVATE KEY|mbci_[A-Za-z0-9_-]{43}' "$dir";then exit 1;fi
echo "F05_8_PRIORITY_REAL_V24_${mode}_COMPLETE"
