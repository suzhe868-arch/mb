# 名邦汽车 V1｜F01 当前工程基础

> 当前状态：F01 分批实施中；**尚未通过 A 主控独立验收，不代表生产可用**。

## 工程边界

- 上层依据：PDM-01～25 Final → Current IA → Current Low-Fi → 工程启动门禁正式施工单。
- 当前代码只使用 Node.js 标准库实现健康检查服务，不自动注册任何历史业务模块或旧接口。
- **不是**直接恢复 `09_历史工程资产基线/`，更不执行旧 SQL 迁移或旧清库脚本。
- 本阶段采用零第三方运行依赖，避免把旧锁文件里不存在的三端工程误作为已建成；F04 的路由框架和数据库访问库另行核验。
- `/api/v1/health/live` 只检查进程；`/api/v1/health/ready` 在未接入真实 PostgreSQL 探针之前**始终报告 503**。测试注入探针仅检验服务状态处理，不是生产数据库运行证明。
- 所有其他业务路径返回 `404 NOT_IMPLEMENTED`，绝不虚报 218 个历史接口运行可用。
- 生产模式启动被硬阻断（`F01_PRODUCTION_NOT_READY`）；未经单独批准不接真实账号或生产库。

## 环境与复现

- Node.js >=22.16.0，npm 10.9.2；`package-lock.json` 已纳入仓库。
- 在 `engineering/` 执行：

```sh
npm ci --ignore-scripts --offline
npm run preflight
npm run safety
npm run build
npm test
npm start
```

- 使用 `node --env-file=.env dist/server.mjs` 可以显式加载个人开发配置；不要提交真实 `.env`。
- `preflight` 只引用分支里确实存在的当前 PDM/IA/Low-Fi 和已批准的门禁施工单，**不**读取旧缺失 `spec/FINAL_DEV_READY`。
- 环境模板：`.env.example`、`.env.test.example`、`.env.production.example`；后者不可用于当前启动。
- 网络公开监听 `0.0.0.0` 必须仅在 development/test 显式设置 `ALLOW_DEV_PUBLIC_BIND=I_ACCEPT_LOCAL_NETWORK_EXPOSURE`。

## 后续未闭环

- F01-3：引入可实际检验 PostgreSQL 的就绪探针，完成有库/断库实证。
- F01-4：完整工具链复验、日志及与 A 的验收交接。
- F02～F08 没有因本目录出现而自动获授权。
