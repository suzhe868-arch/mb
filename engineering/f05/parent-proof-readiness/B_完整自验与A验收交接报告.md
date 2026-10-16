# 名邦汽车 V1｜B 工程执行完整自验与 A 独立验收交接｜F05 正式父来源核证

> 执行日期：2026-10-16｜任务：`F05_PARENT_PROOF_READINESS_AUDIT_01`｜`B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A`（仅指本批已授权的非生产审计工具，**绝不代表 F05 业务父签已经恢复**）
>
> **末提交取证原则**：本文件入库自身会生成新提交。最终唯一受验 HEAD、官方 Push Run、两件同 SHA 工件及结果，以同一 PR 的 **B 最终核证评论**和 GitHub 当前 HEAD 为准；不能把此前成功的不同 SHA 证据冒称为末 SHA 验收证据。

## 一、Authority、原始状态及工作边界

- 正式 A 施工单：`07_重建工作区/F05_正式父级来源核证与缺口恢复前置CI专项_A主控正式完整施工单_2026-10-16.md`。
- 执行时 GitHub `main` 起点：`905dcddeab7a297b8e012c2fe89c0b02f050df32`，A 已正式合并 PR70（合并SHA `2b676929f36fcdf35cfca3e2956baaa0b439c245`）；PR70真实最后受验源码HEAD：`3ee47d9df08d9e73596be5db73ee623eb856e537`。
- 本 B 唯一工作分支：`feat/f05-parent-proof-readiness-audit-01`；只新增 `engineering/f05/parent-proof-readiness/**` 与 `.github/workflows/f05-parent-proof-readiness-ci.yml`，独立 PR 交 A。**本包不合并 main**。
- 严禁更改旧 F05 任何 `ci-job.sh` / `ci-verify-*.mjs` / 原工作流、F08/C、PDM Final、DDL、生产配置、权限授权或 GitHub branch protection。无真实客户、资金、第三方写入或正式业务签发。

## 二、实际代码与隔离技术交付

| 新增路径 | 功能 | 自查 |
| --- | --- | --- |
| `engineering/f05/parent-proof-readiness/audit.mjs` | 官方 GitHub 只读 API、Run/Job/Artifact 来源约束、旧 PR70 SHA 定向审计；所有纯函数只能返回 SOURCE_GAP 或非正式候选 | 不签父证据、不请求外部写入 |
| `engineering/f05/parent-proof-readiness/tests/audit.test.mjs` | 35项 Node 正反例，跨仓库/分支/SHA/触发事件、异常状态、工件过期伪造、不完整父链 | 35/35 已有真实成功 Push 验证 |
| `engineering/f05/parent-proof-readiness/tests/pg16.test.mjs` | 一次性 PostgreSQL16 非超级用户真实事务、身份、提权拒绝及回滚 | 16/16 已有真实成功 Push 验证 |
| `engineering/f05/parent-proof-readiness/审计说明.md` | 操作范围、只读来源定义、原签发流程边界、恢复先决条件 | 中文归档 |
| `engineering/f05/parent-proof-readiness/历史五项正式来源缺口.tsv` | 官方旧 Source 真实失败Job及末日志关键门禁信息 | 五条可追溯 |
| `.github/workflows/f05-parent-proof-readiness-ci.yml` | 特定分支 Push/主线PR触发、Node只读+真非特权PG16两个独立Job、两份非空Artifact | 保留 GitHub 原生绿/红，不伪造 |

审批前以 `git compare main...head` 只应见这些新文件及本报告，且无旧文件改写。

## 三、旧正式父源独立事实核证（不是本批新CI的通过证明）

**真实历史旧 Source 对照快照**：`3ee47d9df08d9e73596be5db73ee623eb856e537` 的官方 Checks **30项：25 success / 5 failure**，其中旧 F05 28项 **23 success / 5 failure**。本批取证按官方 Job 原日志确认如下：

| Source | 完整父链门槛 | 最终证据 | 现行状态 |
| --- | --- | --- | --- |
| F05-7 | 64 旧 + 2 原始新 = **66** 同 SHA Job | [Job 116817199500](https://github.com/suzhe868-arch/mb/actions/runs/38852689386/job/116817199500)；日志 `F05_7_CANNOT_PROVE_66_SAME_SHA_OFFICIAL_PG16_JOBS_IN_BOUNDED_CI_RUN` | `SOURCE_GAP` |
| F05-8 | 64 旧 + 4 原始新 = **68** 同 SHA Job | [Job 116817200055](https://github.com/suzhe868-arch/mb/actions/runs/38852689373/job/116817200055)；日志 `F05_8_OFFICIAL_68_JOB_GATE_UNPROVEN` | `SOURCE_GAP` |
| F05-9 | 68 旧 + 2 原始新 = **70** 同 SHA Job | [Job 116817199525](https://github.com/suzhe868-arch/mb/actions/runs/38852689375/job/116817199525)；日志 `F05_9_NOT_IN_OFFICIAL_NEW_PUSH` | `SOURCE_GAP` |
| F05-10 | 70 旧 + 2 原始新 = **72** 同 SHA Job | [Job 116817199596](https://github.com/suzhe868-arch/mb/actions/runs/38852689446/job/116817199596)；日志 `F05_10_NOT_NEW_OFFICIAL_PUSH` | `SOURCE_GAP` |
| F05-10-D1 | 70 旧 + 2 原始新 = **72** 同 SHA Job | [Job 116817199476](https://github.com/suzhe868-arch/mb/actions/runs/38852689339/job/116817199476)；日志 `D1_NOT_NEW_OFFICIAL_PUSH` | `SOURCE_GAP` |

审计程序以原受验 PR70 SHA 为目标、使用官方 `actions/runs`、`jobs`、`artifacts` 及 `check-runs` 只读数据，每次输出采样时刻、五个 Source `SOURCE_GAP` 原因、28旧 Check 动态明细和原生链接。无官方原分支 Push 则不能构造 66/68/70/72 个同 SHA 已完成作业。**五个旧 Source 失败是正确关闭门禁，并非新审计工具失败。**

## 四、真实 B 自验、独立 CI 与故障修复

初版 `32dbad9444b9a849637d4e519474afdbcb3d166c` 触发真实 Push [Run38899244026](https://github.com/suzhe868-arch/mb/actions/runs/38899244026)：Node Job 成功，PG16 Job 在身份日志字符串断言误写布尔短格式时失败。读取实际日志：`f05_parent_audit|f05_parent_audit_ci|160015|false`。改为匹配 PostgreSQL 的 `false` 后真实 Push [Run38899626597](https://github.com/suzhe868-arch/mb/actions/runs/38899626597) **双 Job completed/success**：Node **35/35**，非超级用户真 PG16 **16/16**，合计 **51项**；真实官方两份同 SHA 工件 ID **12045726521、12045537199**，均非空且 `expired=false`，具官方 SHA256 元数据。上述成功证据对应当时 HEAD `123354fa13e9bb0d724aa46d3d55bb8daa1eeaa7`，**不自动代表本报告新增之后的末 HEAD 成功**；最终同 SHA 成功必须在 PR 评论单独核实。

自审重点：Node 失败状态不转 PASS、非原 Push 不转正式父签、合成 fixture 的完整正例仅为 Candidate；数据库只能针对新建 `f05_parent_audit_ci`，`NOSUPERUSER`、`NOCREATEDB`、`NOCREATEROLE`、`NOREPLICATION`，零业务持久表、拒绝提权、ROLLBACK 验证；上传官方日志和审计结果不含 GitHub Token。未对 Artifact ZIP 做独立SHA256字节复算，明确不作此完成声明。原旧 28 Check 的失败和 REQUIRED checks 约束不得省略或伪绿。

## 五、后续恢复路径、范围及交 A 标准

- **可交 A 独立验收的对象**：仅本次新增 F05 官方只读来源核证工具/负例/真实非特权PG16/CI/两官方工件，前提是本 PR **最后实际 HEAD** 的原生 Push 两 Job 均完成成功，且代码白名单无污染。
- **不得宣称已解除**：F05-7的66和F05-8的68原生同 SHA 父源缺失；F05-9/F05-10/F05-10-D1的原始新 Push 资格缺失；F05 业务、F08 全域、V1、客户资金及生产均 `NOT_READY / NO_PRODUCTION`。
- 正式业务父签缺口若要恢复，须 **A另行独立放行**：核查原分支及其历史触发语义和不可变旧签名检查，定义66/68/70/72个同SHA PG16 Job的实际重新运行可行性与成本、服务/工件保留期、源Job还在运行时的原始判断限制。禁止靠本新分支、当前PR成功、伪造回包、`continue-on-error` 或跳过旧 Check 解封。
- 另一独立 C 轨 PR68 因用户明确否决首页/详情视觉，由 C 重构并交用户复审；B 未修改 C 文件。
- **下一责任窗口：A 主控**，在本 PR 对照最终同SHA Push、两工件、五源输出及授权白名单做独立审核；A 未签 `A_ACCEPTED` 前绝不合并 `main`。

**B 自验交接状态：`B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A / F05_PARENT_SOURCE_GAP / NO_PRODUCTION`。**
