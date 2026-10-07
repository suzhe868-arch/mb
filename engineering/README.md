# 名邦汽车 V1｜F01 基础工程

> **当前为 B 工程分支自验阶段，不代表 A 已最终验收；不得上线。**

## 权威与边界

- 规则顺序：PDM-01～25 Final → Current IA → Current Low-Fi → F01 正式施工单。
- 本目录为独立 Current 基础工程，不修改旧工程 `09_历史工程资产基线/`，不执行旧 SQL、清库脚本，不接入 Collector/电话/业务路由。
- F01 采用 Node.js v22.16.0 + npm v10.9.2、Node 标准库 HTTP 服务、`pg@8.23.0`，实际依赖版本由 `package-lock.json` 固定。
- JavaScript ES modules 作为 F01 当前技术实现，执行真实 Node 语法校验和运行集成测试；本批**不虚报 TypeScript 类型检查**。F04 业务合同/正式接口层如需 TypeScript，应进行独立技术对齐。
- 业务接口、PostgreSQL 数据模型/迁移、角色权限、前端 UI 均不属于本次 F01 已完成内容。

## 健康接口

- `GET /api/v1/health/live`：进程可处理请求即 200，不代表数据库就绪。
- `GET /api/v1/health/ready`：真实 PostgreSQL `SELECT 1::int AS ok` 成功才返回 200；无配置、连接异常、凭证错误、数据库停止返回 503。超时限制 3 秒。
- 数据库连接仅限 `APP_ENV=test`、`F01_TEST_DB_CONSENT=I_CONFIRM_ISOLATED_TEST_DATABASE`、本机目标库 `f01_foundation`；未满足前置条件拒绝配置。
- `APP_ENV=production` 或 `NODE_ENV=production` 一律拒绝启动（`F01_PRODUCTION_NOT_READY`）。
- 业务端点返回 `404 / NOT_IMPLEMENTED`，不得误称已有 218 条业务端点。

## 复现命令

```sh
cd engineering
npm ci --ignore-scripts --no-audit --no-fund
npm run check
# 以下两项只在具备隔离 PostgreSQL 测试环境时执行：
npm run test:postgres
npm run test:db-recovery
# 上述恢复测试限定 GitHub Actions CI 自建 PostgreSQL 容器
```

GitHub Actions 仅在 `feat/f01-foundation` 分支启动临时 PostgreSQL 16 容器。
测试过程包括正常读探针、错密码、不可达端口、实际停/启容器和同一服务进程恢复。
生产密钥、真实用户数据库与网络服务完全不参与此测试。

## 当前技术债与交接

- 未建设 F02 Schema / migrations，禁止把 PostgreSQL 探针误作物理模型验证；
- 未实施 F03 身份权限、F04 接口合同、F05～F07 业务流程；
- 旧 TypeScript/Fastify 资产尚待 F04 路由技术评估；
- F01 结果必须以持续集成真实运行日志为依据，并经 A 主控独立复审后才可标记 ACCEPTED。
