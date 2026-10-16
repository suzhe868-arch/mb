# 名邦汽车V1｜B工程执行｜CI跨窗口触发治理受控预检与A独立验收交接

> **责任包**：`CI_TRIGGER_SCOPE_GOVERNANCE_01`｜A已于2026-10-16正式调整优先级为立即执行｜本轮类型：**只读安全预检，待A逐文件授权**。
>
> **状态**：`B_PREFLIGHT_SELF_TESTED / READY_FOR_A_REVIEW_PREFLIGHT / A_TECHNICAL_BLOCKED_REQUIRED_CHECKS_UNKNOWN / NEXT_OWNER=A / NO_PRODUCTION`。
>
> **强制事实分离**：本次没有修改旧CI触发器，**C更新仍会误触发旧F05重检**；不能把本工具的Node绿色测试当“CI风暴修复完成”。五个历史F05正式父签仍`SOURCE_GAP`；F05/F08全域、V1、真实客户和生产仍`NOT_READY`。

## 一、主线Authority和版本

- B从执行时GitHub`main` SHA `f4682abbc57f94cf4f9727450759bb8314998aab` 新建唯一分支 `fix/ci-trigger-scope-governance-01`。A正式放行文件：`07_重建工作区/CI工作流重复触发与F05跨窗口污染_A主控根因核证及定向治理正式施工单_2026-10-16.md`；更新优先级的技术裁决`07_重建工作区/CI重复触发治理优先级调整_A主控正式裁决_2026-10-16.md`。
- 本批只新增下列六项白名单文件，GitHub提交diff需在A独立审核时再次核对：
  1. `engineering/ci-trigger-governance/trigger-scope-audit.mjs`
  2. `engineering/ci-trigger-governance/tests/trigger-scope.test.mjs`
  3. `.github/workflows/ci-trigger-scope-governance-audit.yml`
  4. `engineering/ci-trigger-governance/十项跨轨误触发候选_A逐文件授权前置清单.tsv`
  5. `engineering/ci-trigger-governance/全工作流根因核证_安全依赖矩阵与A逐文件裁决方案.md`
  6. `engineering/ci-trigger-governance/B_完整自验与A验收交接报告.md`
- main的README、CURRENT_PROJECT_STATE、NEXT_ACTION、PROJECT_STATE、DECISION_REGISTER及PDM/IA/Low-Fi、C PR68、F05/F08旧源码、已有工作流、Job/Artifact、安全代码/签名均未由B改动。旧F05-7 66Job恢复工程未提前运行。

## 二、真实已复核的历史Run与代码风险

- 官方main树B开始时含321份Workflow，F05前缀96份；当前新治理分支又只新增1份自有CI，因此末SHA应含322份。完整逐文件触发器、重复显示名、Job和PG16敏感性以本PR最新Push工件`ci-trigger-workflow-inventory.tsv`、`ci-trigger-policy.json`为准。
- GitHub真实C PR68 `a02ca27d...`：11份PR Run，其中10份无关F05，按原生Job逐个GET计算**29 Job、28.684累计运行分钟**。
- GitHub真实B PR75 `9e974f5...`：11份PR Run（10份历史F05＋1份自身F05只读），**29 Job、26.949累计运行分钟**。两组均实读11个原生Run的Job API，均无API缺项，不使用推断式收费金额。
- 十项无`pull_request.paths`过滤的F05高风险工作流均已逐路径列原始Git Blob SHA、两PR的Run ID/是否失败；十项均包含旧签名/冻结兼容关系，因此没有任何一份可在未获A逐文件签字下擅改。
- 原正式Source失败由同SHA原Branch、PG16父链等门禁真实造成，本任务绝不消除/伪造其失败；重复触发本身和`SOURCE_GAP`是不同问题。

## 三、真实required checks阻断

GitHub官方`GET /branches/main/protection`由当前连接身份返回HTTP403（`Resource not accessible by integration`）；`GET /rulesets?includes_parents=true`可读但为空。故`REQUIRED_CHECKS_UNKNOWN_HTTP_403`，不能认为“无必需检查”，也不能在旧F05工作流直接加paths或`if:false`导致被保护检查永远Pending/Skipped中性。A必须先通过有权限的GitHub账户/UI独立核验并对十个Blob逐条给出允许修改范围。

这一阻断来自**仓库权限边界而不是B代码缺陷**。本批已将可自行实现的只读工具、正反例、历史动态证据和A决策方案一次性施工完毕；被A后续批准前不能越权启动旧CI整改实操，更不能承诺C-only After已变好。

## 四、真实Node自验及下一条交接边界

- 可重现`node --test engineering/ci-trigger-governance/tests/trigger-scope.test.mjs`，**28项正反场景**；所有工作流清册从GitHub Actions所Checkout的真实HEAD文件读取，不使用人工口述的320份旧计数。
- 专用CI权限仅`contents:read/actions:read`；末SHA的真实Push作业会生成有效官方Artifact，内含322份正式路径清册、源规则、GitHub PR Run→Job分钟报告及Node日志。失败/403如实记录，无法访问重要API时只标Unknown，不猜Pass。
- **C-only、F05-only、shared、workflow-self、mixed五类After真PR验证尚未执行**；由于旧Workflow的修改白名单和required checks仍未知，此项确实被A权限/正式签字门禁阻断，不能将静态矩阵28项测试冒充实际After。
- **全部旧CI路径保持不变**，包括原分支`push`触发器、Source校验、真实非特权PG16、Artifact强制上传、`workflow_dispatch`及历史commit签名。A应优先给出10行候选TSV的每文件`APPROVED/DENIED`并附required checks证据，再将本PR退B原分支做经批准的最小触发器修复和实际对照。

**A需审查**：[动态GithubCI末SHA Run/Job/Artifact（待最终生成）]以及 `全工作流根因核证_安全依赖矩阵与A逐文件裁决方案.md`、`十项跨轨误触发候选_A逐文件授权前置清单.tsv`。最终受验SHA及工件必须由B在PR最终评论写明。没有收到A授权前不提交声称`CI_TRIGGER_SCOPE_GOVERNANCE_FIXED`的状态。

**本阶段完成判定**：`READY_FOR_A_REVIEW_PREFLIGHT`，非`READY_FOR_A_REVIEW_FINAL`；A一旦授白名单且required check前提具备，B按同任务原PR继续实装/真实五矩阵并交最终A独立验收。
