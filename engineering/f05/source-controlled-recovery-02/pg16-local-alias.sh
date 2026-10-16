#!/usr/bin/env bash
# F05-7 冻结链只读兼容。仅在Runner本地将DockerHub服务镜像标记为旧祖先名。
# 不拉取ECR，不修改服务容器、数据库结构、原测试命令或业务代码。
set -euo pipefail
image='postgres:16-alpine'
legacy='public.ecr.aws/docker/library/postgres:16-alpine'
source_id="$(docker image inspect "$image" --format '{{.Id}}')"
test -n "$source_id"
# 若已有同名旧标签，必须是同一镜像；禁止静默覆盖不相同的本地镜像。
if docker image inspect "$legacy" >/dev/null 2>&1; then
  test "$(docker image inspect "$legacy" --format '{{.Id}}')" = "$source_id"
fi
docker tag "$image" "$legacy"
test "$(docker image inspect "$legacy" --format '{{.Id}}')" = "$source_id"
mapfile -t original_ids < <(docker ps --filter "ancestor=$image" --format '{{.ID}}')
mapfile -t legacy_ids < <(docker ps --filter "ancestor=$legacy" --format '{{.ID}}')
test "${#original_ids[@]}" -eq 1
test "${#legacy_ids[@]}" -eq 1
test "${original_ids[0]}" = "${legacy_ids[0]}"
test "$(docker inspect "${original_ids[0]}" --format '{{.Image}}')" = "$source_id"
docker exec "${original_ids[0]}" pg_isready -U postgres -d postgres >/dev/null
version="$(docker exec "${original_ids[0]}" psql -X -At -U postgres -d postgres -c 'SHOW server_version_num')"
test "$version" -ge 160000
test "$version" -lt 170000
echo "F05_7_LOCAL_ALIAS_SAFE pg_version_num=$version image_id=$source_id container=${original_ids[0]}"
