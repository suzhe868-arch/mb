# 名邦汽车V1｜CI触发范围治理Stage2｜B真实GitHub原生路径路由核证与预算中间报告

> 日期：2026-10-17｜负责人B｜任务 `CI_TRIGGER_SCOPE_GOVERNANCE_01_STAGE2_NATIVE_AFTER`。
>
> **本版精确状态：`B_STAGE2_PARTIAL_EVIDENCE / F05_ONLY_RUNNING / SHARED_MIXED_NOT_TRIGGERED / NOT_READY_FOR_A_REVIEW_FINAL / NO_PRODUCTION`。** 此文档只归档截至检查时刻的原生数据，未把尚未完成的GitHub Run判为PASS，不改A的验收合同或主线状态。

## 1. 唯一正式Authority与分支边界

- [A两阶段验收裁决](https://github.com/suzhe868-arch/mb/blob/main/07_重建工作区/CI触发治理_PR76_A主控第三轮独立验收_两阶段真实回归技术裁决_2026-10-17.md)与[A阶段1正式交接](https://github.com/suzhe868-arch/mb/blob/main/07_重建工作区/CI触发治理_PR76_A主控第三轮Stage1标准合并与Stage2真场景交接报告_2026-10-17.md)；PR76已标准合并为`a4bcd2969fd1c01fed1711a35bade78f31d6db11`，但`CI_TRIGGER_SCOPE_GOVERNANCE_FIXED`**未获签**。
- 本次B实验真实GitHub main起点：`b1800acf333c0cb9a5bbeea016f69b02840695d5`；每份测试PR独立main基线、仅纯文本证据探针，**不可合入main**。未动C PR68、业务源、产品Authority、迁移/PG16、Source验证、资金/生产。
- 限制：F05-only/shared/mixed测试本身是F05十份老工作流真实PG16原生多Job路径阳性，B先启动一批，观察完成情况，不能在大量Jobs仍活跃时平行开启下一批。此预算排序保证不再制造CI队列风暴。

## 2. 五类真实After分开记载

|场景|PR/HEAD|GitHub官方Run与Check|判定|
|---|---|---|---|
|C-only|[PR77](https://github.com/suzhe868-arch/mb/pull/77) `c90e5917aa81fcb69be0effcdd89d3fa27e8ab9e`|PR唯一diff为`apps/mobile/evidence/**`，查询真正`pull_request` run=**0**、check=**0**，十份F05未误触发|仅`F05_NEGATIVE_OBSERVED`，非C CI绿灯|
|F05-only|[PR78](https://github.com/suzhe868-arch/mb/pull/78) `aaf724f7928a6cb18dba801f6184754d9ffe21c2`|真实一个`engineering/f05/**` Markdown探针；GitHub产生**10**个F05原生PR Run与**28**个Check。观察时**8个Run已完成（5 success、3 failure）、2个仍in_progress**|仅`F05_PATH_POSITIVE_OBSERVED_PENDING_FINAL_JOBS`|
|Shared|准备分支 `audit/ci-trigger-shared-after-pr76-20261017` HEAD `80445a0d44af1d6406eb1010e40dd078308298fb`|只已提交一份`engineering/shared/**`文字探针，**尚未创建PR或声称Run**|NOT_VERIFIED，待F05-only原生运行结束后串行执行|
|Workflow-self|[PR76](https://github.com/suzhe868-arch/mb/pull/76) `1864447f84ad65dcc0396d907f255fd7ccdafde4`|自身修改十份F05工作流，真正出现对应十份原生F05 PR Run+原审计PR Run；曾读取Source真失败|真实自身路径阳性已观察，需A最终独立定性|
|Mixed|准备分支 `audit/ci-trigger-mixed-after-pr76-20261017` HEAD `c649df048f0fba289d90ee9274d59f81fd19f517`|包含非业务`apps/mobile/**`与`engineering/f05/**`两个路径文件，**未创建PR**|NOT_VERIFIED，需串行执行|

### C-only本体限制
A确认main不存在C构建Workflow `.github/workflows/c-app-01-build-render.yml`（GitHub main API 404），但它实际存在于仍未合并的C PR68原分支。因而PR77在main上没有F05 Run的负例是有意义的，但没有任何C构建Run，**不能声称C必要CI成功或跨域完整并集已通过**；必须待A独立裁决是否将C端CI真实证明留至C PR68最终合并阶段。

### F05-only的三条真正Source拒绝（绝不可删除）
- [Run38933661360](https://github.com/suzhe868-arch/mb/actions/runs/38933661360) Job117083641077：`F05_9_NOT_IN_OFFICIAL_NEW_PUSH`；同Run HTTPS Job117083641532 success，Artifact `12059418797` 非空。
- [Run38933661553](https://github.com/suzhe868-arch/mb/actions/runs/38933661553) Job117083641745：`F05_10_NOT_NEW_OFFICIAL_PUSH`；同Run HTTPS Job117083642394 success，Artifact `12060078149` 非空。
- [Run38933661293](https://github.com/suzhe868-arch/mb/actions/runs/38933661293) Job117083641692：`D1_NOT_NEW_OFFICIAL_PUSH`；同Run HTTPS Job117083641191 success，Artifact `12060520051` 非空。
- F05-7 [Run38933661611](https://github.com/suzhe868-arch/mb/actions/runs/38933661611) 与 F05-8 [Run38933661528](https://github.com/suzhe868-arch/mb/actions/runs/38933661528) 观察时均仍有原生Source Job运行；**不能当成success、failure或Source补签**。

## 3. 原配置合同、边界与下一执行条件

- A已审核PR76旧十Workflow各仅加31条正向`on.pull_request.paths`，`push`原正式分支/Job/Source/PG16/Artifact原字节不变；Stage1验收36/36 Node PASS及同SHA官方Artifact已核实。Stage2的原生运行不可由这些静态绿灯冒充。
- 本阶段所需五场景真实GitHub Check/Run/Job/Artifact矩阵必须实际独立回归；旧五项Source仍`SOURCE_GAP`，F05/F08/V1/生产`NOT_READY`。
- **下一执行顺序**：F05-only 10/10 Workflows真正进入terminal并核对Job/Artifact→只打开Shared测试Draft PR→该批结束再开Mixed Draft PR→从最新真实SHA采集所有官方结果→更新本报告与实际证据→B全量自审并交A。
- 未验证项不可视为问题已解决，所有临时PR保持Draft/open或在证据归档后关闭，**禁止合并main**。若旧Source变绿而缺合法原分支新Push，或F05/shared/mixed不启动该启动的工作流，应停止并提交A。

## 4. B续工追加独立核证｜F05-7原生结论及剩余执行

- 复核本阶段权威 `PROJECT_STATE.json`：`NEXT_OWNER=B`、`NEXT_TASK=CI_TRIGGER_SCOPE_GOVERNANCE_01_STAGE2_NATIVE_AFTER`，main为`b1800acf333c0cb9a5bbeea016f69b02840695d5`。PR77、PR78、PR79都保持`Draft/Open/NotMerged`。
- PR78十份F05原生工作流此前全部成功触发，真实28项Check；较上次新增F05-7原生[Run38933661611](https://github.com/suzhe868-arch/mb/actions/runs/38933661611)已完成`failure`，其中Source Job`117083641859`最终日志明确`F05_7_CANNOT_PROVE_66_SAME_SHA_OFFICIAL_PG16_JOBS_IN_BOUNDED_CI_RUN`，同Run HTTPS Job`117083642199`为success，非空官方Artifact`12059768186`，96362字节。此系旧正式父签硬门禁**没有合法66项同SHA证据**，不是路径过滤代码验证失败，更不是可以跳过的CI检查。
- 最新轮询PR78仍有F05-8 [Run38933661528](https://github.com/suzhe868-arch/mb/actions/runs/38933661528)在`in_progress`，其中priority Source Job`117083642179`正在原`True F05-8 nonprivileged PG16 priority-source`步骤，其余三个Job已success。不能将该Run记为PASS、失败或超时；且进行中完整日志暂不能获取，不猜测其后续结果。
- 预算纪律：其余[Shared分支](https://github.com/suzhe868-arch/mb/tree/audit/ci-trigger-shared-after-pr76-20261017)（HEAD`80445a0d44af1d6406eb1010e40dd078308298fb`，单`engineering/shared/**`探针）与[Mixed分支](https://github.com/suzhe868-arch/mb/tree/audit/ci-trigger-mixed-after-pr76-20261017)（HEAD`c649df048f0fba289d90ee9274d59f81fd19f517`，C+F05两文件）已有只读准备，**未创建真正SHARED/MIXED PR**，避免与旧PG16仍活跃的十项Run重叠。
- 目前阶段：`F05_7_FAIL_CLOSED_CONFIRMED / F05_8_STILL_RUNNING / SHARED_NOT_VERIFIED / MIXED_NOT_VERIFIED / STOP_SHORT_OF_FINAL`。继续禁止自行调整旧工作流、改绿旧Source、合并main或声称`READY_FOR_A_REVIEW_FINAL`。

## 5. 原生F05-only全十Workflow Job与Artifact快照核证（2026-10-17）
**本快照未到最终10/10终态；所有统计均截至GitHub实际返回时间，需后续刷新。**

| Workflow简写 / Run | Job结果 | 当前真实非空官方Artifact（个） |
|---|---|---:|
| F05-7 / [38933661611](https://github.com/suzhe868-arch/mb/actions/runs/38933661611) | Source **failure**（缺66项同SHA），HTTPS success | 1 |
| F05-8 / [38933661528](https://github.com/suzhe868-arch/mb/actions/runs/38933661528) | 3 success，priority Source **in_progress** | 3 |
| F05-9 / [38933661360](https://github.com/suzhe868-arch/mb/actions/runs/38933661360) | Source **failure**（新Push资格），HTTPS success | 1 |
| F05-10 / [38933661553](https://github.com/suzhe868-arch/mb/actions/runs/38933661553) | Source **failure**（新Push资格），HTTPS success | 1 |
| F05-10-D1 / [38933661293](https://github.com/suzhe868-arch/mb/actions/runs/38933661293) | Source **failure**（新Push资格），HTTPS success | 1 |
| F05-9冻结F05-8 / [38933661332](https://github.com/suzhe868-arch/mb/actions/runs/38933661332) | 4 success | 4 |
| F05-10冻结F05-8 / [38933661318](https://github.com/suzhe868-arch/mb/actions/runs/38933661318) | 4 success | 4 |
| F05-10-D1冻结F05-8 / [38933661610](https://github.com/suzhe868-arch/mb/actions/runs/38933661610) | 4 success | 4 |
| F05-10冻结F05-9 / [38933661403](https://github.com/suzhe868-arch/mb/actions/runs/38933661403) | 2 success | 2 |
| F05-10-D1冻结F05-9 / [38933661533](https://github.com/suzhe868-arch/mb/actions/runs/38933661533) | 2 success | 2 |

- 累计GitHub **28个真实Job：23个success、4个failure、1个in_progress**；Run级别**5个success、4个failure、1个in_progress**。GitHub Artifacts列表逐Run均取得，共**23个非空、未过期官方Artifact**，不是23个业务成功凭据；Source红灯未出现上传完成工件属硬失败原逻辑。
- 失败不准中性化：F05-7 `F05_7_CANNOT_PROVE_66_SAME_SHA_OFFICIAL_PG16_JOBS_IN_BOUNDED_CI_RUN`；F05-9 `F05_9_NOT_IN_OFFICIAL_NEW_PUSH`；F05-10 `F05_10_NOT_NEW_OFFICIAL_PUSH`；D1 `D1_NOT_NEW_OFFICIAL_PUSH`。均有原生Job日志证据。
- 当最后一个Source还在运行时不并行创建Shared或Mixed PR。官方2026-10-16T16:55:20Z快照还显示F05-8剩`117083642179`单Job运行。A要求的Stage2完整版真实After尚不能签字。

## 6. C-only前后真实Github事件不可混同的核证

- **BEFORE（旧C PR68，2026-10-16T13:36Z、HEAD`a02ca27d2109e365c5830b641a18cfb059fe3684`）**：原生真实PR Run总计11，分别为旧十份F05+ C专用工作流`.github/workflows/c-app-01-build-render.yml`一份（对应Run`38909117378`，conclusion success）。这发生在PR76阶段1配置合并**之前**。
- **AFTER（PR77，HEAD`c90e5917aa81fcb69be0effcdd89d3fa27e8ab9e`）**：变更只位于`apps/mobile/evidence/**`，原生PR Run=0、Check=0，旧F05没误触发。但PR77与PR68不是同一个SHA、并非相同diff；`main`尚无C独立Build Workflow，故**不能通过11→0计算生产Runner节省，也不能说C必要测试得到保持**。两个独立结果只证明原触发广泛与现路径负例的差异。
- C的真实构建工作流仍留PR68未合并，现阶段不修改C分支以规避抢改C用户否决后R3施工；该未闭合部分需A对真实C检查持久性单独验收，不能靠测试探针绿灯掩盖。
