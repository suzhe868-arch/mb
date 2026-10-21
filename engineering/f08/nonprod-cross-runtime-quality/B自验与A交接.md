# 名邦汽车 V1｜F08-2 B 自验与 A 交接

> 首次代码SHA已通过本SHA官方CI；本文件补证后产生新的文档提交，**最终HEAD是否完成仍以新的同SHA官方CI和Issue #184正式交接评论为准**，不预先宣称新的SHA已经通过。

## 已确认的授权与基线

- Issue：[ #184 ](https://github.com/suzhe868-arch/mb/issues/184)，A 放行治理 PR：[ #185 ](https://github.com/suzhe868-arch/mb/pull/185)。
- 施工起始 main：`def4ae0f4b8d912ff49327198604207b76899933`。
- B 分支：`feat/f08-nonprod-cross-runtime-quality-02`，不可直接合并 main。
- 本次只新增 `engineering/f08/nonprod-cross-runtime-quality/**` 和 `.github/workflows/f08-nonprod-cross-runtime-quality.yml`；`engineering/src/**`、F03/F05/F06/F07、旧 F08 与现有 CI 全部冻结。

## 新测试与证据方案

- A01～A18：18 项当前 `createFoundationHandler` HTTP 行为和实际 `server.mjs` 独立进程拒绝启动测试；其中 A01～A08 为当前应用入口 HTTP 回归。
- E01～E24：24 项跨 PR/Run/Job/Artifact 的来源一致性、历史 SHA 抗冒用、假双 Job、过期工件、失败状态等负向边界。合成结构断言不冒充官方现场验证。
- P01～P16：16 项使用本任务独立非特权 PostgreSQL 16 的身份、隔离、Schema、CHECK、唯一键、回滚、并发与拒绝测试。
- `live-parent.mjs` 使用 GitHub 官方 API **只读**核验 F06 #174 与 F07 #181 的真 PR、Push Run、Job、Artifact；输出只标 `HISTORIC_DIFFERENT_SHA`，绝不签发本 SHA 业务正例。
- 两个独立 PostgreSQL 16 Job 均执行原生非超级用户身份 SQL；一个验证入口与证据，另一个验证 PG16 事务；每个生成单独日志及 Artifact。
- 所有 58 项当前仅标 `PENDING_OFFICIAL_CI`，不能在官方执行前标为通过。历史 F08-1/PR100/PR174/PR181 只做基线引用。

## 已验证的原生自测与首次官方通过记录（历史代码提交，不冒充文档最终HEAD）

- **业务测试代码 SHA**：`693a09449cfad7726094448d9b5b900f62982c1a`（基于主线 `def4ae0f4b8d912ff49327198604207b76899933`）。
- **首次官方 Push Run**：[39642895102](https://github.com/suzhe868-arch/mb/actions/runs/39642895102)：`completed/success`，两 Job 都是 PostgreSQL 16 真库、非超级用户、独立实例。
- Job [119370769478](https://github.com/suzhe868-arch/mb/actions/runs/39642895102/job/119370769478)：当前应用入口/父证据 **42/42**，必要旧健康与进程回归 **7/7**，GitHub 官方只读父记录 F06 #174、F07 #181 **2/2** 成功。
- Job [119370769886](https://github.com/suzhe868-arch/mb/actions/runs/39642895102/job/119370769886)：真实 PG16 原生 SQL 权限/隔离/事务 **16/16**；PG 版本 `160015`，测试角色 `f08_2_ci`，库 `f08_2_quality_test`，`rolsuper=false`，`rolcreatedb=false`，`rolcreaterole=false`，数据库 OID `16385`。
- 本轮独立新场景共 **58/58**（A01-A18、E01-E24、P01-P16）；原有受影响回归 **7/7**，共 65 项通过，0 失败/跳过；测试日志随工件归档。
- 两个官方 Artifact：[#12365826965](https://github.com/suzhe868-arch/mb/actions/runs/39642895102/artifacts/12365826965)（7851 bytes）、[#12364214221](https://github.com/suzhe868-arch/mb/actions/runs/39642895102/artifacts/12364214221)（5721 bytes）；均非空、未过期，标称到期 2026-11-04。
- 本次 10 项新增文件均属于 `engineering/f08/nonprod-cross-runtime-quality/**` 或专用工作流；官方语法、差异空白、路径白名单全部通过；冻结业务、旧 CI、PDM、状态指针、C PR68 均未修改。
- **重要界限**：该首次成功只证实 `693a... ` 业务代码；本文件与场景矩阵更新为补充证据，提交后必须核实新最终HEAD的官方两独立PG16 Job/Artifacts，**仅在确认后于原 Issue/PR 评论标记 `READY_FOR_A_REVIEW`**。

## 提交前和交 A 前必核

1. `git diff --check origin/main...HEAD`、所有新增 `.mjs` 的 `node --check`、新增 workflow 的有效解析；
2. 逐项核实路径与用途白名单，禁止变更冻结源码或已验业务；
3. 最终 B HEAD 对应官方 `push` 的两个独立 `completed/success`、PG16非特权身份、58新场景全通过、受影响旧入口回归及两份非空有效 Artifact；
4. 如有失败、队列中、未运行或无法获取的证据，状态维持 `IN_PROGRESS / WAITING_EXTERNAL / BLOCKED_*`，不能写 `READY_FOR_A_REVIEW`。

## 安全边界及未完成来源

保留 `SOURCE_GAP与未运行台账.tsv` 中真实电话授权、F03 Scope/Object、F05正式转换、SLA/Incident、JYT、CDN/OSS、Feishu、真实资金与 C PR68 的未授权边界。F06/F07/F08/V1整体 `NOT_READY`。

## 当前恢复点

读取 [Issue #184](https://github.com/suzhe868-arch/mb/issues/184) 和本分支最后真实 HEAD，核验新 `f08-nonprod-cross-runtime-quality.yml` 最终 SHA 的两 Job 与 Artifact；任何失败在本白名单内定向修复重跑。满足全部门禁后，把此文档改为事实报告并在本分支正式提交 `READY_FOR_A_REVIEW` 的中文交接，交 A 独立验收。
