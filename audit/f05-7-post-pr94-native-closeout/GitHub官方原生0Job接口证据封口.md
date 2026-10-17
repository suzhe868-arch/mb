# 名邦汽车 V1｜PR94 后 H52 历史 0Job 官方诊断可得性封口｜B 独立只读取证

> **任务：** `F05_7_POST_PR94_NATIVE_DIAGNOSTIC_CLOSEOUT_01`  
> **A 施工授权：** `A_RELEASED_FOR_B_READONLY_OFFICIAL_DIAGNOSTIC_CLOSEOUT_ONLY`  
> **B 结论：** `B_READONLY_EVIDENCE_COMPLETED / BLOCKED_OFFICIAL_ROOT_CAUSE_UNKNOWN / H52_ORIGINAL_52_JOB_SCHEDULER_NOT_PROVEN / SOURCE_GAP_OPEN / PHASE2_NO_GO / READY_FOR_A_REVIEW / NEXT_OWNER=A`

## 1. 唯一事实、版本、执行范围

- 基于实际读取的最新 `main=477692347f27aa00545f1ec1cddc5e24e532f8a3`；隔离B分支 `audit/f05-7-post-pr94-native-diagnostic-01`，只新增本目录内取证文档与机器可解析只读摘要。不修改正式状态、旧H52/8个Workflow、Source、业务/DDL/C/生产；**本轮零新增 CI、零新 Runner、零旧ref Push**。
- A [PR94 验收](https://github.com/suzhe868-arch/mb/pull/94)与 [Run 38998693209](https://github.com/suzhe868-arch/mb/actions/runs/38998693209)已经复现历史 H52 YAML 第34行第9列两个 Actionlint v1.7.12 `syntax-check`，旧失败Blob `3a13bab79b4e45fb4e037a1d6fd4431593506148`；当前主线原H52 Blob `687a9f767b0d0b144372550735da6159066b4833` 为52个Job且Actionlint零错误。本轮**没有再重复下载Actionlint或制造探针**。
- 官方旧失败 [GitHub Actions Run 38958160214](https://github.com/suzhe868-arch/mb/actions/runs/38958160214)：`head_sha=bf9c698fabff721a52154fba662dc9b230d9a319`、`event=push`、`attempt=1`、`completed/failure`、`workflow_id=381637182`、`check_suite_id=105583123217`。官方普通Jobs与尝试1 Jobs分别显示 **`total_count=0`**，不存在可读取的失败Runner Job日志。

## 2. 直接查询的原生 Check Suite 结果及接口访问边界

| 官方取证路径（仓库 `suzhe868-arch/mb` 下） | 本连接实际结果 | 证据含义 |
| --- | --- | --- |
| `GET /actions/runs/38958160214` | 成功，`completed/failure`，`check_suite_id=105583123217` | 官方确有失败 Run |
| `GET /actions/runs/38958160214/jobs?per_page=100` | 成功，`total_count=0` | 整个失败 Run 无Job |
| `GET /actions/runs/38958160214/attempts/1/jobs?per_page=100` | 成功，`total_count=0` | 同一第1次尝试仍无Job |
| `GET /commits/<失败SHA>/check-suites?per_page=100` | 成功，13条suite；目标 suite `105583123217`：`completed/failure`、`latest_check_runs_count=0` | 官方将0Job失败记录在 GitHub Actions Check Suite |
| `GET /commits/<失败SHA>/check-runs?per_page=100` | 成功，32条**其它**工作流的Check Runs；目标suite没有Check Run | 不能误把其它CI的注释当作H52错误 |
| `GET /check-suites/105583123217` | **连接器允许列表拒绝**，返回HTTP400式验证报错 | 不是GitHub本体对解析错误的反馈，不可杜撰报错 |
| `GET /check-suites/105583123217/check-runs?per_page=100` | **连接器允许列表拒绝**，返回HTTP400式验证报错 | 不可读取suite子资源原生详细内容 |
| `GET /check-runs/117166464653` 与 `.../annotations`（对照可见的其它工作流Check Run） | **连接器允许列表拒绝** | 即使其它Job自带 `annotations_url`，也无法读取具体注释 |
| `GET /actions/runs/38958160214/annotations` | GitHub REST **404 Not Found**（该路径不提供所需Run级诊断） | 没有从非标准端点取得0Job根因 |
| `GET /actions/runs/38958160214/logs` | GitHub REST **404 Not Found**（历史0Job无可下载Job日志） | 不是无错误，只是未取得日志 |
| `GET /actions/workflows/381637182` | 连接器允许列表拒绝 | 已知ID来自Run，但不能从此接口额外提取错误原因 |

所有上面的连接器 `INVALID_ARGUMENT HTTP 400` 均是**GitHub连接访问接口白名单拒绝**，**不是GitHub Actions解析器返回的错误码**；不能把它们包装成官方根因。

**精确证据边界：** GitHub官方自身已证明Run 0Job失败、相应目标Suite也失败且无子Check Run。第三方Actionlint已独立复现历史步骤结构不合法，**高度相关但仍不是GitHub官方对本次运行的诊断原文**。本轮结论 `BLOCKED_OFFICIAL_ROOT_CAUSE_UNKNOWN`；当前真正原H52的复杂52 Job图在旧正式来源ref的新SHA原生调度仍 `NOT_PROVEN`。

## 3. 正式原ref与仓库保护状况

- 只读 `GET /branches/feat/f05-7-deterministic-matching-readiness-four-tier`：当前SHA仍 **`99c38d013f67cc56975f1664120fb87c204afc3c`**，`protected=false`。
- 只读 `GET /branches/main`：`477692347f27aa00545f1ec1cddc5e24e532f8a3`，`protected=false`；`GET /rulesets?includes_parents=true` 可见 **0项**。
- 比较原ref→当前main：`ahead=1147, behind=0, merge_base=99c38d...`。仅说明 Git祖先关系允许快进，**绝不代表获准快进、推送或恢复Source**；B本轮没有执行 `update_ref` 到任何旧来源分支。
- 当前可见证据**无法证明有生效的仓库分支保护**。A在考虑下一阶段前须确认保护规则与管理写入控制；不得认为纯书面禁止Push就构成机器强制的防线。未读取到的更高层组织控制不能无依据宣称不存在。

## 4. 已验收的静态资源风险，以及阶段2恢复条件

A在PR92/PR94已接受以下原生源码静态数据：8份原F05-7 Workflows、**66 Job**、**64处PG16服务**、**110个可能的Artifact上传调用点**；62个Job显式超时，4个按未配置时的默认360分钟计算，总计 **3520 runner-minutes≈58.7 runner-hours**。这只是全部作业都可能跑到各自超时的理论求和，**不是已承诺账单、实耗、硬并发限制或Artifact总量**。准确的预算封口及不能替代的条件见[《阶段2恢复前预算与失败停止核对单》](阶段2恢复前预算与失败停止核对单.md)。

## 5. B 终态与交接

- 本轮官方接口可得性检查**一次性封口**。没有确切GitHub原生解析annotation，不再通过构造其他小型Workflow来假称取得该根因；若未来A需要真实GitHub原生支持日志或扩大受限API访问，须由A另作技术裁决。
- A尚未签发 `PHASE2_ORIGINAL_REF_PUSH_AUTHORIZED`：旧ref、66 Job、其它四正式Source、C、生产/资金/真实业务全部不动；五Source继续 `SOURCE_GAP_OPEN / FAIL_CLOSED`，C PR68仍并行Draft，V1及生产 `NOT_READY`。
- B最终Git SHA及PR号应以本PR元数据为准；独立A验收只检查新增白名单、上述官方链接/摘要、0Runner/0旧Source更改与预算禁令，不接受把“静态schema通过”写成“原H52原生调度成功”。

**B_READONLY_EVIDENCE_COMPLETED / BLOCKED_OFFICIAL_ROOT_CAUSE_UNKNOWN / READY_FOR_A_REVIEW / NEXT_OWNER=A**
