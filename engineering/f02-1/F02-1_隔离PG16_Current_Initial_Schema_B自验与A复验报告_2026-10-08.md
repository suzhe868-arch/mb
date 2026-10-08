# 名邦汽车 V1｜F02-1 Current Initial Schema｜B 自验与 A 复验交接

> 施工日期 2026-10-08；工程分支 `feat/f02-schema`；A 签发 G0 接受基线 `f2cdb0e8c7967aeaa8cfea5c6b466c9b45a68946`，main 对应签发 `5c336755204a4615198c98a1ea489ba6e6f68423`。
> 本轮物理施工代码核验 SHA `997445a7bfd4e7a0f055c16632971020d7e9b670`；真实 [F02-1 GitHub Actions #37725318433](https://github.com/suzhe868-arch/mb/actions/runs/37725318433) **SUCCESS**，原 [G0 安全回归](https://github.com/suzhe868-arch/mb/actions/runs/37725318449) **SUCCESS**。
> **本报告是 B 自验。F02_1_ACCEPTED=NO，待 A 独立复验签发。** main 未修改，未合并，未访问任何真实/已迁/生产业务库。

## 一、交付文件

| 文件 | 用途 |
|---|---|
| `engineering/f02-1/compile-current.mjs` | 基于 A 签发 G0 的 510 字段逐项分类编译只纳入 464 字段的初始 SQL，禁止恢复延期/排除字段 |
| `engineering/f02-1/migrations/000001_current_initial.manifest.json` | 唯一迁移版本、固定 SQL SHA256、物理目标结构与误漂移拒绝 |
| `engineering/f02-1/runner.mjs` | pg@8.23.0、事务、advisory lock、迁移元数据/checksum、重复幂等、未知版本拒绝 |
| `engineering/f02-1/guard.mjs` | 强制 CI、明确隔离授权、127.0.0.1:5432、f02_schema_test、f02_ci、非 superuser、PostgreSQL 16 |
| `engineering/f02-1/export.mjs` | 输出锁定的 initial SQL 和统计 JSON，供 A 审计 |
| `engineering/f02-1/tests/live.mjs` | 真实 PG16 假数据 CHECK/FK/UNIQUE、跨域复合 FK 正反例 |
| `engineering/f02-1/tests/migration-metadata.mjs` | 真实未知版本、篡改 checksum、额外对象拒绝、464 字段逐名核验 |
| `.github/workflows/f02-1-isolated-pg16.yml` | CI 一次性隔离 PG16：建库、回滚、四并发 Worker、物理负例、pg_dump 与 Artifacts |

未复制或运行旧八份 migration；原 G0 read-only 安全 Guard 与 F01 基础检查未改写。

## 二、物理结构及证据

| 实际在独立 PG16 中验证 | 结果 |
|---|---|
| Current 业务实体 | **76 张**，另加 1 张 f02_schema_migrations 元数据表 |
| 业务字段 | **464/464** 精确名称校验，延期 33 与排除 13 字段 **0 建列** |
| 原 G0 静态单列 FK | **137 条实际落地** |
| 新增跨客户、车辆、Listing Cycle、Lock/Recommendation/Match/资金主体等复合 FK | **23 条实际落地** |
| FK 物理合计 | **160 条** |
| 附加 UNIQUE/部分唯一索引 | **28 个** |
| 数据库 CHECK | **39 项** |
| 历史不可修改触发器 | **5 个** |
| System Admin | 5 个身份/状态/创建治理字段，绝不重复保存 login_account 或 credential_hash |
| PC 凭证 | 统一 pc_login_accounts，跨 Employee/4S Employee/System Admin 规范化账号全局唯一；principal XOR、每个 principal 最多一套凭证 |
| 真实假数据回归 | **30 项通过**；均在测试事务末尾 ROLLBACK，未留下虚构业务记录 |
| SQL SHA-256 | `df078212b95701af12144a43ef85a70fc491e5dca9948644df415bd888c5b4e4` |

本轮还实现三种 Vehicle 经营来源/真实可售/平台 visible/hidden 的分层 CHECK；LockRequest、Refund 三态+关闭原因+subject XOR、单 active Listing Cycle/Lock、四级正式 Match Result、客户日额度基础非负约束、推荐与查价单周期三元组、CRM 跟进 append-only 等结构。

## 三、真实命令与测试日志入口

以下命令在该 run 的 GitHub Actions PG16 容器中实际执行（依赖 CI 中显式环境白名单，仅能访问当前一次性本机 f02_schema_test）：

```bash
cd engineering
npm ci --ignore-scripts --no-audit --no-fund
npm run check
node f02-g0/closure-audit.mjs
node f02-g0/full-domain-audit.mjs
node f02-g0/scope-audit.mjs
# Postgres16 CI service 启动后，只在服务中创建 f02_ci 非特权角色和 f02_schema_test 全新库
node f02-1/export.mjs
F02_1_INJECT_TX_FAILURE=CI_TEST_AFTER_DDL node f02-1/runner.mjs --apply # 预期失败；SQL与元数据同事务回滚
node f02-1/runner.mjs --verify-empty
node f02-1/runner.mjs --apply # CI启动4个并发进程，其中仅一个首次应用
node f02-1/runner.mjs --apply # 重复幂等
node f02-1/runner.mjs --verify
node f02-1/tests/live.mjs
node f02-1/tests/migration-metadata.mjs
# CI隔离PG16容器内pg_dump --schema-only --no-owner --no-privileges --schema=public
```

CI 的真实日志包含：
- DDL 后强制注入 `F02_1_INJECTED_AFTER_DDL`，检查 `public tables=0`、元数据 0：**事务回滚与失败重跑 PASS**；
- **四个并发进程与后续重复迁移 PASS**，锁为事务 advisory lock `(20261008,201)`，只留下一个 `000001_current_initial` 版本；
- 元数据插入未知版本、篡改既有 checksum、创建未登记表，迁移器真实 `--verify` 均拒绝，移除 CI 测试污染后恢复 PASS；
- SQLSTATE `23505/23503/23514` 真实阻断重复账号、XOR 混用、非同客户/车型/周期来源、错误退款主体、非法 Match tier、重复 active Lock/Cycle 等；
- 非法远程 URL、F01 数据库、缺失隔离确认、`--reset`、原 G0 `--apply` 全部拒绝。

**结构导出文件**：访问 [F02-1 Actions #37725318433](https://github.com/suzhe868-arch/mb/actions/runs/37725318433) 页面底部 Artifacts → **`f02-1-pg16-current-schema`**（工作流保留 30 天）。其中：
`current_initial.sql`（真正执行的初始 SQL）、`pg16_schema_dump.sql`（PostgreSQL 16 真实 pg_dump）、`schema_expected.json`（字段/FK/校验和）和 `worker1.log`～`worker4.log`（实际并发日志）。
迁移源码与锁定清单长期在 B 工程分支保存；CI 工件是结构导出附件，不是生产库备份。

## 四、已识别但本阶段不能冒充实施的责任

1. **F03 身份/权限运行仍 NOT_RUN**：实际登录、首次强制改密、System Admin 最后一名 active 并发保护、4S 合法授权、hard DENY、字段与 Customer 数据范围。
2. **F05/F06 业务事务守卫仍 NOT_RUN**：Priority 当前 Match 级别与可见权、找车重算、Waitlist 自动生成/释放、锁车申请 6h 自动到期、锁期动态延期、真实退款累计余额并发、公海正式流转的原子 owner 切换。
3. **VIN 人工精确查重仍是后续业务 Gate**，不能增加无条件 VIN 唯一约束；本阶段允许空 VIN 与人工多草稿。
4. **外部 JYT / 电话 / 图片本地化 / CDN / 通知 Outbox 投递、客户端收藏与公告 Banner** 未获独立施工授权，不得把数据库底层事实当作 API/页面完成。
5. 部分枚举值采用 Current Schema 内的技术持久化拼写，后续 DTO/API 必须显式一致性校验。单数据库 CHECK 无法代替跨时刻与跨主体真实授权。
6. 本阶段仅在新的 CI 一次性 PG16 库上测试；没有执行已迁库兼容升级（F02-2）、历史种子导入（F02-3）、跨域正式服务施工（F02-4）。

## 五、B 交付状态

`F02_1_SCHEMA_AND_ISOLATED_PG16_TESTS_PASS / READY_FOR_A_INDEPENDENT_REVIEW / F02_1_ACCEPTED=NO`。

A 应从该分支最后 HEAD、对应 F02-1 与 G0 两个 CI、固定 SQL manifest 以及真实 pg_dump 工件独立核验；通过后由 A 自行签发 `F02_1_ACCEPTED`。严禁 B 自行验收、合并 main 或接着施工 F02-2/3/4。
