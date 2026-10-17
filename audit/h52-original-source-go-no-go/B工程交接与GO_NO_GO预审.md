# 名邦汽车 V1｜B 原 H52 故障取证与阶段2 GO/NO-GO 工程交接

> B_SELF_TESTED（以最终 GitHub 原生工作流结果为准） / READY_FOR_A_REVIEW_ORIGINAL_H52_PHASE2_GO_NO_GO（CI核验完成后提交）
> 本批严禁旧来源分支 Push、rerun、dispatch及66旧Job执行；五SOURCE_GAP与生产门禁仍在。

## 一、起点、权限和不可被历史成功替代的差异
- A正式任务：F05_7_ORIGINAL_H52_PHASE2_GO_NO_GO_READONLY_01；权限A_RELEASED_FOR_B_READONLY_ORIGINAL_H52_PHASE2_DECISION_EVIDENCE_ONLY。
- 本轮起点 main `bfb0dfd461fbec42f5350fcbda8b553645f61461`；隔离分支 `audit/f05-7-original-h52-phase2-go-no-go-01`；仅新增本目录4份证据/脚本/测试/报告和1份8分钟只读CI。
- 失败原生 Run 38958160214（https://github.com/suzhe868-arch/mb/actions/runs/38958160214）：`head_sha=bf9c698fabff721a52154fba662dc9b230d9a319`、`event=push`、`completed/failure`、官方 `jobs.total_count=0`、`workflow_id=381637182`、`check_suite_id=105583123217`。失败时 H52 Blob `3a13bab79b4e45fb4e037a1d6fd4431593506148`。
- 当前 main 原H52 Blob `687a9f767b0d0b144372550735da6159066b4833`（511380B）；原F05-7来源分支H52 Blob `eda68ce30bbccfa802f459e009ef0a6889918648`；原来源分支 HEAD `99c38d013f67cc56975f1664120fb87c204afc3c`，compare main 显示为祖先、main相对ahead1134/behind0（只读查询时点）。三个Blob不同，旧失败≠现H52原生失败或成功。
- 旧0Job版本中 `- &z name: ...` 属步骤映射锚点、后续 `- *z` 重复步骤；当前改成 `- run: &z ...` 标量锚点、后续 `- run: *z`；安全合成探针只验证了标量别名，并不能替代当前511380B原图与复杂服务的GitHub调度。
- 旧成功对照 Run38694077890 是 **F06-5C自己的** `.github/workflows/f06-5c-frozen-h52-revalidation.yml` 52/52 success、HEAD e2c153996...，**不是当前F05-7 H52在原来源ref上新执行的证据**。Check Suite具体官方annotation接口本连接不能读取，故官方解析根因 `OFFICIAL_ROOT_CAUSE_UNKNOWN / OFFICIAL_SCHEDULER_ERROR_UNAVAILABLE`；不得将锚点作为已证明根因。

## 二、当前main原8份Workflow静态资源矩阵
| 工作流 | Jobs | PG16服务 | 显式超时 | 未设置超时 | 上传Action出现数 |
|---|---:|---:|---:|---:|---:|
| F05-7 主Source+HTTPS | 2 | 2 | 2×40分钟 | 0 | 2 |
| F05-4-2冻结 | 2 | 2 | 2×40分钟 | 0 | 2 |
| F05-5-2冻结 | 2 | 2 | 2×40分钟 | 0 | 2 |
| F05-6-2冻结 | 2 | 2 | 2×40分钟 | 0 | 2 |
| 原H52 | 52 | 50 | 48项共1520分钟 | 4项各默认360分钟 | 96 |
| 冻结I2 | 2 | 2 | 2×40分钟 | 0 | 2 |
| 冻结J2 | 2 | 2 | 2×40分钟 | 0 | 2 |
| 冻结K2 | 2 | 2 | 2×40分钟 | 0 | 2 |
| **合计** | **66** | **64** | **62个显式超时Job** | **4** | **110** |

- 最坏作业时限相加：`48个H52显式上限1520 + 4×默认360 + 14×40 = 3520 runner-minutes（约58.7 runner-hours）`。这不是计费预测或实际启动时长，只是在66作业与其超时行为都成立时的理论上界，且不包含排队与工件存储计费；默认360分钟以GitHub官方工作流语法为准。
- 64个Job声明PG16服务；真正开启与镜像拉取取决于GitHub调度与Runner状态。无已签统一并发预算，最多66作业为结构规模，实际同时并行多少取决于仓库/账号GitHub限制；禁止冒称可同时运行66个Runner。
- 110个 `actions/upload-artifact` 仅为静态调用点，真正工件个数、大小、总储存和留存需运行才知道；多数声明30天保留。**目前没有按总GiB和并发硬限额的授权成本封印**。
- H52复用锚点原Blob &z 1个、*z 49个，含跨F03精确`git push origin HEAD:refs/heads/feat/f03-*`字符串30处。旧Source FAIL-CLOSED不得弱化；本轮审计这些字符串，完全不执行。

## 三、不可逆恢复前必须满足的停机与成本合同
1. A须另外签发 `PHASE2_ORIGINAL_REF_PUSH_AUTHORIZED`，明确执行时重新读取的 `expected_old_sha`、实际 `target_main_sha`、8Workflow/66Job预计并发、实际允许上限与最大分钟预算、工件容量上限、源签验证条件。
2. 任一0Job解析失败、Source Gate失败、PG16镜像限流/端口冲突、额外Job/工作流被触发、超出预算或其它四Source变化，立即不重试、不额外Push，保留原始Run/Job/Artifact/红灯；并行Job不保证能在第一项失败前全部取消，需要事前限并发。
3. 原ref无额外GitHub回滚权限，不准用强推回旧SHA；如发生部分执行，先由A隔离当前版本、记录所有写入。未经A额外授权禁止继续执行与恢复其它Source。

## 四、阶段2决策
- **当前B建议：`A_OPTION_1_NO_GO_MINIMAL_H52_REPAIR`**。旧0Job的官方精确错误原因未取得，当前真正复杂H52不曾在目标旧ref原生调度；现有66 Job静态上界、工件储存和并发没有A独立预算封印。A可先给原H52的具体最小安全兼容审计/修正独立单，不得由B在本单动旧源。
- A另一个可独立明确签的选项是 `A_OPTION_2_ONE_SHOT_PHASE2_ACCEPT_RESIDUAL_UNKNOWN_WITH_BUDGET`，但前提为A主动接受未知官方解析风险并签完整阶段2授权；本报告不是签字、不是已经GO。
- 五条SOURCE_GAP持续FAIL-CLOSED；C PR68真实H5/微信双端和首页/详情最终用户视觉均未验收，V1及生产NOT_READY。

## 五、CI真实性与A验收
- 审计CI独立受控Push，只有一项不超过8分钟的只读Ubuntu Runner；`git hash-object`验证八个当前Blob及52/66 Job明细和成本，Ruby Psych仅解析本地文件，不运行原H52脚本。官方结果/Artifact ID/HEAD必须从PR同SHA日志独立读取。
- 即使此只读CI成功，也只代表审计工具可靠，绝不能把`H52_ORIGINAL_52_JOB_SCHEDULER_NOT_PROVEN`改为PASS。A独立核查后裁决下一工作包。
