# 名邦汽车 V1｜F01 当前工程基础

> 当前阶段：F01 分批施工，未经过 A 主控独立验收；**非生产可用证明**。

## 来源与边界

- 施工单：`07_重建工作区/工程启动门禁_工程基础施工单与验收标准_2026-10-08.md`
- 产品 Authority：PDM-01～25 Final → Current IA → Current Low-Fi。
- 本目录是独立的 Current 工程基础，不是直接复制 `09_历史工程资产基线/`。
- 目前只建立 Node.js 标准库 HTTP 脚手架、预检与最小运行测试；**尚未连接 PostgreSQL、业务路由和三端页面**。
- Node.js 标准库入口属于 F01 技术选择；F04 的具体路由框架应与完整业务合同独立评估，禁止把旧接口自动注册。
- `/api/v1/health/live` 只表示进程存活；`/api/v1/health/ready` 尚无实际数据库检查实现，返回 503，**不得当成就绪**。
- 不恢复旧 Collector 电话连接配置、电话 API、旧迁移、旧业务逻辑。

## 环境与命令

要求 Node.js >=22.16.0，npm 10.9.2；无第三方运行依赖。先于 `engineering/` 执行：

```sh
npm ci --ignore-scripts --offline
npm run preflight
npm run build
npm test
npm start
```

开发服务默认仅监听 `127.0.0.1`；生产上线、机密配置及数据库测试均待独立授权。

## 状态

F01-1 建立代码与命令，不等同 F01 整体结束；所有测试须附环境和真实执行记录。
