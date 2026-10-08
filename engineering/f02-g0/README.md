# F02-G0｜独立 PostgreSQL 16 安全预检（禁止业务 Schema 施工）

- 仅 GitHub Actions 新建 PostgreSQL 16 临时服务，数据库 `f02_schema_test`；不是 F01 `f01_foundation`。
- CI bootstrap 用户只负责创建测试数据库/非超级测试账号 `f02_ci`。此操作仅用于隔离环境初始化，不是业务 DDL 或迁移。
- `node f02-g0/preflight.mjs` **仅只读**：验证库名、账号、版本、权限、空表，并实测 PG `BEGIN READ ONLY` 拒绝 `CREATE TEMP TABLE`（SQLSTATE 25006）；事务最终 ROLLBACK。
- 测试 guard 拒绝生产/远程/F01 库/非测试账号/数据库 URL 参数/危险执行参数；任何 `--apply` 一律拒绝。
- 当前仅安全准入**壳**；不包含迁移 runner/正式 DDL/种子/版本表写入。F02-1 需要 A 先独立验收本次 G0，再设计受控 runner + checksum + advisory lock + 原子事务。
- 临时服务随 GitHub Actions job 销毁；绝不使用真实业务账号/数据库。
