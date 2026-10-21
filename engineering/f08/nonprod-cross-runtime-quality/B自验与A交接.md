# 名邦汽车 V1｜F08-2 B 自验与 A 交接

> 当前状态：`IN_PROGRESS / NOT_READY_FOR_A_REVIEW`。本文件是施工中的证据目录，**不是验收结论**；以最终 HEAD 的官方 GitHub Actions 和 Artifact 为准更新。

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

## 提交前和交 A 前必核

1. `git diff --check origin/main...HEAD`、所有新增 `.mjs` 的 `node --check`、新增 workflow 的有效解析；
2. 逐项核实路径与用途白名单，禁止变更冻结源码或已验业务；
3. 最终 B HEAD 对应官方 `push` 的两个独立 `completed/success`、PG16非特权身份、58新场景全通过、受影响旧入口回归及两份非空有效 Artifact；
4. 如有失败、队列中、未运行或无法获取的证据，状态维持 `IN_PROGRESS / WAITING_EXTERNAL / BLOCKED_*`，不能写 `READY_FOR_A_REVIEW`。

## 安全边界及未完成来源

保留 `SOURCE_GAP与未运行台账.tsv` 中真实电话授权、F03 Scope/Object、F05正式转换、SLA/Incident、JYT、CDN/OSS、Feishu、真实资金与 C PR68 的未授权边界。F06/F07/F08/V1整体 `NOT_READY`。

## 当前恢复点

读取 [Issue #184](https://github.com/suzhe868-arch/mb/issues/184) 和本分支最后真实 HEAD，核验新 `f08-nonprod-cross-runtime-quality.yml` 最终 SHA 的两 Job 与 Artifact；任何失败在本白名单内定向修复重跑。满足全部门禁后，把此文档改为事实报告并在本分支正式提交 `READY_FOR_A_REVIEW` 的中文交接，交 A 独立验收。
