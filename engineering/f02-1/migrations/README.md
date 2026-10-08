# F02-1｜Current Initial Migration 000001

**此目录不是历史八份 migration，也不包含历史兼容升级。**

- 版本：`000001_current_initial`；SHA-256 见 `000001_current_initial.manifest.json`。
- 迁移定义：`../compile-current.mjs` 从 **G0 已签发**的字段矩阵编译纯新装 SQL；若字段/主外键/状态规则改变导致内容不同，`../runner.mjs` 必须拒绝执行而非静默变更已命名迁移。
- CI 执行 `node f02-1/export.mjs`，生成 `f02-1/artifacts/current_initial.sql` 和清单；`node f02-1/runner.mjs --apply` 在全新独立 `f02_schema_test` PostgreSQL 16 临时库执行，全程事务及 advisory lock。
- 应用和恢复日志、真实 `pg_dump --schema-only` 在 GitHub Actions `F02-1 isolated PG16 Current Schema` 的 `f02-1-pg16-current-schema` 工件中，便于 A 下载逐项审计。
- 不支持 `--down`、`--reset`、生产数据库或任何历史 SQL 重放。
- F02-2/3/4 和 F03/F04 未获授权，A 尚未签发 F02-1 验收。
