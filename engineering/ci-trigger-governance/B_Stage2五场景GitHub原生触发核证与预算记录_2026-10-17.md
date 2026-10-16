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

## 7. 真实Draft对照补证：Draft不是F05路由缺席的原因

- **两条PR均为`open + draft + not merged`**：PR77 HEAD `c90e5917aa81fcb69be0effcdd89d3fa27e8ab9e` 与PR78 HEAD `aaf724f7928a6cb18dba801f6184754d9ffe21c2`。PR77相对最新main差异只有`apps/mobile/evidence/CI_TRIGGER_SCOPE_C_ONLY_PROBE_20261017.md`（ahead1/behind6），真正Actions PR Run **0**、Check **0**。PR78相对最新main差异只有`engineering/f05/ci-trigger-governance-probes/F05专域触发核证_2026-10-17.md`（ahead1/behind0），同为Draft却真实产生F05 **10** Run、**28** Check，证明Draft本身不阻止这些F05工作流PR触发。
- 单论F05的路径路由：C-only不命中、F05-only命中符合A批准的过滤逻辑。这一对照**不能替代**共享/混合真实PR、也不能证明未合并C PR68的必要Build继续有效。
- 截至追加时：PR78 Check 23 success、4 failure、1 in_progress；F05-8 `priority-source`原生Job `117083642179`未最终结束，报告仍记`NOT_VERIFIED`，保留串行预算门禁。后续必须从GitHub最终Run/Job API重新获取终态。

## 8. Stage2待执行Shared与Mixed的逐工作流预运行核对

B已直接从合并后的main逐份读取10份A批准F05工作流的现行Blob（均与PR76阶段1末SHA修改后的Blob一致），验证每份`on.pull_request.paths`同时保有：
`engineering/f05/**`、`engineering/shared/**`、`.github/workflows/f05-*.yml`、`.github/workflows/f05-*.yaml`，且**均不包含`apps/mobile/**`**。10/10配置一致，零例外。
- 待测单域Shared草稿分支 `audit/ci-trigger-shared-after-pr76-20261017`，只含`engineering/shared/ci-trigger-governance-probes/共享依赖路由探针_2026-10-17.md`，PR创建前对比main确认ahead1/behind0，无越界业务文件。
- 待测Mixed草稿分支 `audit/ci-trigger-mixed-after-pr76-20261017`，只含`apps/mobile/evidence/混合路径C端探针_2026-10-17.md` 与 `engineering/f05/ci-trigger-governance-probes/混合路径F05探针_2026-10-17.md` 两份文件，PR创建前对比main ahead2/behind0，无业务程序改动。
- **这些只是真实main Blob与预备分支路径静态先验；Shared/Mixed的原生GitHub Run/Job/Artifact仍未生成，绝不能把10/10路径审计当成真实after完成。** 仍须在F05-only最后真实Run终态后串行启动两个独立草稿PR。

## 9. F05-only全部原生终态及Shared单域真正GitHub阳性（本轮续工）

> 本节覆盖先前F05-8 `in_progress`的旧快照，所有此前未完成标识只代表当时情形，以下是后续真实事件；尚未涵盖Shared自身最终结果与Mixed。

### F05-only：PR78真终态
- [PR78](https://github.com/suzhe868-arch/mb/pull/78) 严格单一 `engineering/f05/ci-trigger-governance-probes/F05专域触发核证_2026-10-17.md`，HEAD `aaf724f7928a6cb18dba801f6184754d9ffe21c2`，10/10 A签旧F05 workflow真实触发，28 Check；**10 Run全部completed，5 success、5 failure**；28 Job中的23 success、5 failure。
- 最后结束的F05-8官方[Run38933661528](https://github.com/suzhe868-arch/mb/actions/runs/38933661528)，最终 `completed/failure`（更新于 `2026-10-16T17:11:28Z`）；优先级Source Job `117083642179`真实最终失败，其余同Run三个Job全部成功且上传三个非空Artifact。该真实Source日志于第110次进度打印仍显示 `oldSuccess:0,requiredOld:64`，最后明确 `F05_8_OFFICIAL_68_JOB_GATE_UNPROVEN`；保持历史同SHA 64+4来源拒绝，不删除原门禁。
- **五条真实Source拒绝完整保留**：F05-7 `F05_7_CANNOT_PROVE_66_SAME_SHA_OFFICIAL_PG16_JOBS_IN_BOUNDED_CI_RUN`；F05-8 `F05_8_OFFICIAL_68_JOB_GATE_UNPROVEN`；F05-9 `F05_9_NOT_IN_OFFICIAL_NEW_PUSH`；F05-10 `F05_10_NOT_NEW_OFFICIAL_PUSH`；D1 `D1_NOT_NEW_OFFICIAL_PUSH`。其余五份冻结复验全部成功，旧合法同SHA Source缺口仍非PASS。
- 10份Run合计真实非空官方Artifact **23件**；只读取官方元数据，未对原ZIP独立下载重算，不能称独立复算通过。

### Shared：PR80真实独立PR触发
- 在PR78最终全部10 Run进入终态、仓库Running=0/Queued=0之后，才从原先仅含一份无业务Markdown的预备分支建立[PR80](https://github.com/suzhe868-arch/mb/pull/80)，HEAD `80445a0d44af1d6406eb1010e40dd078308298fb`，`audit/ci-trigger-shared-after-pr76-20261017`，相对main **ahead1/behind0，仅改** `engineering/shared/ci-trigger-governance-probes/共享依赖路由探针_2026-10-17.md`。
- 真 GitHub `pull_request` 立即生成**10个获批F05 Workflow Run、28个原生Check**（全十项路径准确、非空），说明Shared-only属于F05十份原工作流必须触发的共享依赖正例；这不是静态猜测也不是给旧Source放行。
- 官方Run IDs：`38937848470,38937848538,38937848436,38937848493,38937848521,38937848516,38937848463,38937848437,38937848500,38937848488`。创建后的首次GitHub快照为9 queued / 1 in_progress；**全部仍需最终Run/Job/Artifact采证**。
- 当前Stage2尚缺Shared全部Job终态以及Mixed真正原生After；**严格串行，PR80仍活跃时不创建Mixed PR**。PR80为Draft/NO_MERGE。未触及main、原F05 Source、PG16、C PR68，未签 `READY_FOR_A_REVIEW_FINAL`。

## 10. Shared-only PR80原生Run部分终态、Source失败日志和工件核证

- 原生[PR80](https://github.com/suzhe868-arch/mb/pull/80) HEAD `80445a0d44af1d6406eb1010e40dd078308298fb`，差异只有一份 `engineering/shared/**` Markdown，成功真实触发全部十份A签F05工作流与28条Check。此次Shared测试不是静态模拟也不是F05-only伪装。
- GitHub官方Run查询的本节快照：十份Run中**五份success、三份failure、两份in_progress**（F05-7 `38937848488`、F05-8 `38937848516`）；目前不能签总PASS，不能提前为这两个在途的历史来源给出失败类型。
- 三项已结束的Source原生失败由实际Job日志核实：F05-9 Run `38937848437` / Job `117097731449`：`F05_9_NOT_IN_OFFICIAL_NEW_PUSH`；F05-10-D1 Run `38937848436` / Job `117097732116`：`D1_NOT_NEW_OFFICIAL_PUSH`；F05-10 Run `38937848538` / Job `117097732222`：`F05_10_NOT_NEW_OFFICIAL_PUSH`。对应HTTPS均success。保留原硬门禁，不试图补造正式Push或伪绿。
- 已逐Run读取GitHub官方 Artifact列表，**23份现存、非空、未过期Artifact**，均与真实GitHub Run关联（并非23份“全部通过”的正式来源凭据）；仅官方元数据，未下载ZIP独立重算。F05-7 HTTPS有Artifact `12061063932`，F05-8已有3份compat/HTTPS工件，priority-source仍可能后续失败。
- 同步证据PR79本批记录提交 `54146493d70316f4cecd9302f5b9e6d6e47c9332` 的原生治理审计Run `38938056415` 已completed/success；此治理证据CI不能替代Shared十份F05真实终态。
- **串行CI预算截止线**：Shared未全部terminal，**禁止此时创建Mixed临时PR**。Mixed探针分支已在本任务此前建好，确认无业务修改；待PR80全部真实Run最终状态、Job/Check/Artifact采集后才启动。所有临时PR均Draft、NO_MERGE，旧F05 Source和F08/V1/生产仍NOT_READY。

## 11. Workflow-self场景真实GitHub独立终态补齐（PR76末SHA）

- PR76原生PR SHA `1864447f84ad65dcc0396d907f255fd7ccdafde4`。A准许的10份旧F05工作流自身都被PR76修改，所以GitHub真实 `pull_request` 事件合法命中各自路径；从GitHub官方原生Actions重新查询，**11个Run（10份F05+1份治理审计），全部`completed`；6 success、5 failure、0 running、0 queued**。这里的6 success包括治理审计工作流，所以不得误写成F05六绿。
- 逐项GET每个Run的官方Job与Artifact元数据：**29个Job，24 success、5 failure；24份非空Artifact**（含治理审计工件1份）；只确认官方元数据，不主张下载ZIP复算。F05-only旧十份正好**28个Job（23 success、5 failure）及23份Artifact**。
- 五份保持fail-closed的正式Source工作流原生Run：
  - F05-7 [Run38930895369](https://github.com/suzhe868-arch/mb/actions/runs/38930895369) / Job117074296025：failure；HTTPS success，Artifact12059190610。
  - F05-8 [Run38930895365](https://github.com/suzhe868-arch/mb/actions/runs/38930895365) / Job117074296015：failure；其余三Job success、3份Artifact。
  - F05-9 [Run38930895380](https://github.com/suzhe868-arch/mb/actions/runs/38930895380) / Job117074296153：旧新Push资格Source failure；HTTPS success。
  - F05-10 [Run38930895374](https://github.com/suzhe868-arch/mb/actions/runs/38930895374) / Job117074296064：旧新Push资格Source failure；HTTPS success。
  - D1 [Run38930895364](https://github.com/suzhe868-arch/mb/actions/runs/38930895364) / Job117074295682：旧新Push资格Source failure；HTTPS success。
- 其余5份F05冻结复验Run`38930895488,38930895394,38930895448,38930895362,38930895449`均completed/success，原生GitHub工件存在；治理审计[Run38930895523](https://github.com/suzhe868-arch/mb/actions/runs/38930895523) completed/success且有Artifact12058572673。
- 此场景属于Stage1原PR自身工作流修改路径正例，A已签允许作为Stage2 `WORKFLOW_SELF` 真实阳性来源，但它**不能代表**另外4种独立Postmerge PR均通过。特别C-only主线无C必要CI、Shared还在跑、Mixed未创建，仍严格`NOT_READY_FOR_A_REVIEW_FINAL`。

## 12. Shared-only最新原生Source终态：F05-7已fail-closed，F05-8仍运行

- 从GitHub官方API取得[Shared PR80 F05-7 Run38937848488](https://github.com/suzhe868-arch/mb/actions/runs/38937848488)，`2026-10-16T17:23:33Z`完成，真实结论`failure`。Source Job`117097731722`日志精确异常`F05_7_CANNOT_PROVE_66_SAME_SHA_OFFICIAL_PG16_JOBS_IN_BOUNDED_CI_RUN`（source fail），HTTPS Job`117097731352`success，非空官方Artifact`12061063932`（96360字节）。证明Shared-only真实触发时旧同SHA来源门禁仍拒绝无66合法PG16父证据的PR，不得补签或假绿。
- 按最新Run级真实终态：PR80 共10份F05工作流**5 success / 4 failure / 1 in_progress**；在途仅F05-8 [Run38937848516](https://github.com/suzhe868-arch/mb/actions/runs/38937848516)的Priority Source。最终第5个Source拒绝原因须等Job正式结束及日志，不得提前推测为和PR78同一异常。
- **Remaining Stage2:** Shared剩F05-8终态，Mixed单域合并触发真实PR及完整Run/Job/Artifact核验，C自身必要构建尚因main缺C Workflow而无法于PR77证明。全部临时PR禁止合并main、严格遵守A串行预算。

## 13. Shared完成及Mixed真正混合路径原生PR（最新快照）

- Shared [PR80](https://github.com/suzhe868-arch/mb/pull/80)，HEAD `80445a0d44af1d6406eb1010e40dd078308298fb`，已经**十个原生F05 Workflow全部terminal：5 success/5 failure、28 Check=23 success/5 failure，23份非空Artifact**。最后一项F05-8 [Run38937848516](https://github.com/suzhe868-arch/mb/actions/runs/38937848516) 于2026-10-16T17:43:47Z以failure结束；Source Job`117097731675`官方日志明确`F05_8_OFFICIAL_68_JOB_GATE_UNPROVEN`，另三个Job均success且共3份非空官方工件。此前F05-7缺66同SHA、F05-9/10/D1缺正式Push来源证书，五项Source均fail-closed，**没有CI配置漏触发也没有旧Source伪绿**。
- 只有在Shared十Run全部终态、仓库`running=0,queued=0`后，B才创建独立[PR81（MIXED）](https://github.com/suzhe868-arch/mb/pull/81) Draft，HEAD `c649df048f0fba289d90ee9274d59f81fd19f517`；对main精确差异两份**非业务Markdown**：`apps/mobile/evidence/混合路径C端探针_2026-10-17.md`、`engineering/f05/ci-trigger-governance-probes/混合路径F05探针_2026-10-17.md`，ahead2/behind0。
- GitHub真实`pull_request`事件确实触发获A批准的**十份F05原生Workflow及28条Check**；此提交归档时MIXED Run状态：`{"in_progress":2,"failure":3,"success":5}`；Check状态：`{"success":23,"in_progress":2,"failure":3}`。这些仅为**中间快照**，需以最终官方Run/Job/Artifact及日志核查为准。
- 已观察MIXED D1 [Run38943230823](https://github.com/suzhe868-arch/mb/actions/runs/38943230823) Source Job`117115816510`真实`failure`，日志`D1_NOT_NEW_OFFICIAL_PUSH`；HTTPS Job`117115817206` success，非空原生Artifact`12064092560`。冻结复验Run`38943230786,38943230783,38943230820`已completed/success，并有同Run非空工件。
- **C构建限制不变**：旧C [PR68](https://github.com/suzhe868-arch/mb/pull/68)内的`.github/workflows/c-app-01-build-render.yml`尚未合并main；PR77 C-only及PR81 Mixed皆不能证明C必要构建未丢。本Stage2仅证明F05路径过滤触发路由；不得把C漏检风险登记为PASS，也不得替A判`CI_TRIGGER_SCOPE_GOVERNANCE_FIXED`。
- 本轮B仅做隔离测试PR和证据，不修改旧Source、PG16、C PR68及main，不合并任何临时PR，`NOT_READY_FOR_A_REVIEW_FINAL`直至完成所有可验证真Job、独立CI限制判定并交A审查。
