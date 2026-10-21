# F07 非生产 Runtime 四域接线｜B 自验与 A 交接

## 交接状态

当前状态：PENDING_OFFICIAL_CI。只有两个独立 PG16 Job 在同一最终 SHA 的真实 Push Run 全部成功、官方 Artifact 非空且证据一致后，才可改为 READY_FOR_A_REVIEW。

## 变更范围

- engineering/src/f07-runtime/**：新增四域非生产 Runtime Adapter。
- engineering/f07/nonprod-runtime-integration/**：隔离 Schema、业务/HTTPS 测试、场景矩阵、来源权限矩阵、SOURCE_GAP 台账和交接证据。
- .github/workflows/f07-runtime-integration-nonprod.yml：新增本包专属 Push 工作流。
- engineering/src/app.mjs：只增加可选 Runtime Handler 注入点与 /__ci__/f07-runtime/** 分发。
- engineering/src/server.mjs：只增加独立 consent、loopback HTTPS、PG16 与优雅关闭分支。

未修改任何既有 F07 sidecar、F08-1、F03/F05/F06 业务代码、产品规则、公共 Schema/Migration、生产配置或其他窗口文件。

## 本地静态自检

- node --check engineering/src/app.mjs：通过。
- node --check engineering/src/server.mjs：通过。
- node --check engineering/src/f07-runtime/runtime.mjs：通过。
- node --check 两个新增测试文件：通过。
- 当前执行容器未提供 PostgreSQL 客户端/服务，真实 PG16、HTTPS 黑箱和官方 CI 结果以 GitHub Actions 为准；不得将本地语法检查替代真实数据库验收。

## 证据待填（以真实 GitHub 结果为准）

- 最终 base SHA：待填写。
- 最终 head SHA：待填写。
- 官方 Push Run：待填写。
- runtime_business_pg16 Job：待填写。
- runtime_https_pg16 Job：待填写。
- Artifact 链接与非空校验：待填写。
- git diff --check 与白名单核对：待 CI 复核。

## SOURCE_GAP 与未授权项

- 电话敏感能力 publisher.phone.sensitive 未获得合法签名正向授权，latest/dial 始终 FailClosed。
- F05 当前车辆转换正向来源及签名 Scope/Object 绑定未证明，保持 F05_CONVERSION_POSITIVE_SOURCE_GAP。
- SLA 已签 deadline、Incident 签名 issuer 和真实 Feishu 路由仍缺失；本包只测试本地隔离 outbox，不真实投递。
- 不连接真实 JYT、Collector、CDN、OSS、Feishu、微信或公网，不使用真实电话号码，不部署，不操作生产或真实资金。

## 增量自审、修复和受影响回归（2026-10-21）

- 本次改动始终在 A 正式白名单内；历史 F07-1～F07-4 Sidecar、F03/F05/F06 实现及所有生产配置仍只读。
- 已修复新 Runtime 模板字符串语法错误；在两个 PG16 官方 Job 中运行全量变更 MJS 的 `node --check`，不跳过语法门禁。
- 已修复 GitHub Artifact SHA 表达式和 Git 中文路径转义引发的白名单误报；`git diff --check`、中文文件真实路径白名单仍必须通过。
- 旧入口关联回归限于 `engineering/tests/health.test.mjs`、`engineering/tests/进程启动.test.mjs`、`engineering/tests/f06-lock-http.test.mjs`；旧测试在没有 F07 consent 的进程中独立执行，验证默认入口不受影响。其他 F01～F06 业务/PG16 历史合同未经修改，按受影响范围不重复全量跑。
- 工作流另保留本包至少 46 个独立应用集成场景与 15 个独立 HTTPS 黑箱场景，真实计数以最终同 SHA Job TAP 日志为准；不得把结束标记测试计入业务场景。
- 有效证据由官方 Push Run 的 `GITHUB_SHA`、`GITHUB_RUN_ID`、两个独立 Job、PG16 identity 和同 SHA 两份非空 Artifact 共同确认；Git 提交无法静态内嵌自身完整 SHA，以最终 Issue #178 / PR 交接信息提供精确引用。

## A 独立验收请求

完成两个独立 PG16 Job、同 SHA Push Run、官方 Artifact 和最终白名单/差异核对后，由 B 在 Issue #178 与 PR 交接中填入精确证据并标记 B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A。B 不合并 main、不关闭 Issue、不修改主控状态文件；A 必须独立复核。
