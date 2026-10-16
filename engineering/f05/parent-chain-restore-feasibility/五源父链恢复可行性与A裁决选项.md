# F05五源历史原生父链｜实际恢复可行性与A下一施工选择

> 2026-10-16｜范围：`F05_PARENT_CHAIN_RESTORE_FEASIBILITY_01`｜`A_RELEASED_FOR_B_READ_ONLY_FEASIBILITY`｜仅针对官方历史 GitHub 证据；**不得把历史成功当当前 main 的父签**。

## 一、原始五个分支实际存在且曾全部完成原生父链

以下原始分支/末 SHA 来自2026-10-16 GitHub `/branches/*` 官方只读 API；来源Run/Artifact为官方原始 `push`，**不是当前 main/PR 触发**。五个原始 Source Job 末日志已逐项读取，均出现原脚本成功的官方父链标志。原始 PG16 完整运行并非合成 fixture。工件摘要来源于官方 API 元数据，尚未对 ZIP 自行 SHA256 复算。

| 旧来源/原始分支末 SHA | 原 Source Run（已完成成功） | 原 Source Job | 原 Source 工件/有效期 | 旧七/八/九份工作流＋新作业 |
| --- | --- | --- | --- | --- |
| F05-7 `99c38d013f67cc56975f1664120fb87c204afc3c` | [38189425635](https://github.com/suzhe868-arch/mb/actions/runs/38189425635) | [114618772149](https://github.com/suzhe868-arch/mb/actions/runs/38189425635/job/114618772149) | 11721556439，2026-11-11 | 7份旧冻结64＋新Source/HTTPS2＝**66** |
| F05-8 `1dc08927b6b11e2327050d55e6f72f6f19984e8e` | [38242775552](https://github.com/suzhe868-arch/mb/actions/runs/38242775552) | [114790910558](https://github.com/suzhe868-arch/mb/actions/runs/38242775552/job/114790910558) | 11744252155，2026-11-11 | 7份旧冻结64＋本轮4＝**68** |
| F05-9 `d3cbaee088f6ba7d6b81fbd014813bedcf77671f` | [38271144191](https://github.com/suzhe868-arch/mb/actions/runs/38271144191) | [114885412991](https://github.com/suzhe868-arch/mb/actions/runs/38271144191/job/114885412991) | 11758705112，2026-11-11 | 8份旧冻结68＋新Source/HTTPS2＝**70** |
| F05-10 `d1f721bd1d332f14241960562b631145af250265` | [38352572708](https://github.com/suzhe868-arch/mb/actions/runs/38352572708) | [115154863290](https://github.com/suzhe868-arch/mb/actions/runs/38352572708/job/115154863290) | 11793005288，2026-11-12 | 9份旧冻结70＋新Source/HTTPS2＝**72** |
| F05-10-D1 `3edf40b7cda1ddf8cb4ca340f0fb33dfc0b0d50a` | [38348593551](https://github.com/suzhe868-arch/mb/actions/runs/38348593551) | [115137912268](https://github.com/suzhe868-arch/mb/actions/runs/38348593551/job/115137912268) | 11790715111，2026-11-12 | 9份旧冻结70＋新Source/HTTPS2＝**72** |

**已经查清**：原始五分支仍在线，旧完成日志存在、原始Source归档未过期，至少五份自身Source工件都带 SHA256 官方摘要。旧七/八/九份冻结工作流均能在原分支最新 SHA 的官方 `push` 下找到完成成功Run；历史日志中的父源数字、缺口检测并非不可达的空判定。

原生实证日志标志：

- F05-7：`F05_7_OFFICIAL_GITHUB_64_OLD_PLUS_2_NEW_READ_ONLY_AUDIT`，7份旧Run全部同HEAD，64旧成功＋自身2。
- F05-8：`F05_8_OFFICIAL_GITHUB_64_FROZEN_PLUS_2_COMPAT_PLUS_2_NEW`，旧64＋2个旧匹配兼容＋2优先级自身。
- F05-9：`F05_9_OFFICIAL_GITHUB_NINE_PUSH_SAME_SHA_70`，旧68＋新2。
- F05-10：`F05_10_OFFICIAL_GITHUB_TEN_PUSH_SAME_SHA_72`，旧70＋新2。
- F05-10-D1：`D1_OFFICIAL_GITHUB_TEN_PUSH_SAME_SHA_72`，旧70＋新2。

## 二、五个源的静态逆向差异

原始`ci-job.sh`及`ci-verify-*.mjs`的路径如下，并可在上表各原始 SHA 的GitHub `blob/{sha}/{path}` 逐字核对：

| 原源 | 校验代码 | 原 Push 分支 | 原自身 Job / 附属冻结 Workflows |
| --- | --- | --- | --- |
| F05-7 | `engineering/f05/deterministic-matching-readiness-four-tier/ci-verify-workflows.mjs` | `feat/f05-7-deterministic-matching-readiness-four-tier` | 2 / h52、i2、j2、k2、4-2、5-2、6-2（64） |
| F05-8 | `engineering/f05/priority-arbitration-ttl-handover/ci-verify-68.mjs` | `feat/f05-8-priority-arbitration-ttl-handover` | 4 / 上述7份（64） |
| F05-9 | `engineering/f05/recommendation-visibility-grants/ci-verify-70.mjs` | `feat/f05-9-recommendation-visibility-grants` | 2 / 上述7份加f05-8-four（68） |
| F05-10 | `engineering/f05/consultation-assignee-sla/ci-verify-72.mjs` | `feat/f05-10-consultation-assignee-sla` | 2 / 上述8份加f05-9-two（70） |
| F05-10-D1 | `engineering/f05/pdm17-public-pool-owner-claim/ci-verify-72.mjs` | `feat/f05-10-d1-pdm17-public-pool-owner-claim` | 2 / 上述9份（70） |

原始Verifier均基于 `event.pull_request?.head?.sha ?? GITHUB_SHA` 确定目标，随后仅接收**原分支与目标SHA完全一致、`event=push`、原Workflow路径匹配**的 Run，核对冻结工作流中指定 Job总数、`completed/success`和无skip。F05-8/9/10/D1进一步要求自身的 **官方新Push Run**，`pull_request`触发即使把原生PG16复跑成功，也不构成原始新Push证明。

旧 Source 自身源Job执行中的判定是“已存在其他旧Job全部成功、自身 HTTPS/兼容 Job 成功且Source还在运行”，**不要求自身Job在执行核查代码之前已经完成**。历史5次真成功证明此约束当时并未形成必然自锁；但未来可能有排队/超时/路径条件变化。

## 三、当前 main 父源无法自动补签：关键区别

1. 旧原始 SHA 各自不同；当前 `main` 上PR70/PR72/本轮另有SHA。严格同SHA条件意味着**旧原始Run不能借给当前main当形式上的“当前SHA父证据”**。
2. 原始CI成功的日期为10月12～13日，旧PR72原受验SHA `3ee47d9...` 在五Source检测中因没有相应正式Push或66/68完整链被拒绝，这是正确Fail Closed；两组事实**没有冲突**。
3. 五个原始Source原分支仍然存在，但只改动 `main` 或只重跑PR工作流并不能产生 `event=push`、`head_branch=原指定分支`、`head_sha=目标main新SHA` 的一组官方Run。
4. 原分支保存的旧冻结 h52 Workflow 实际仍使用 `public.ecr.aws/docker/library/postgres:16-alpine`（五份原始 SHA 都在官方 `blob` 确认），且其 Job 内有 `contents: write`；main经PR70改DockerHub兼容不能自动倒灌原分支。未来重新推送可能再次受ECR限流。当前权限scope的缩减/镜像兼容必须由A单独授权和评估是否破坏原签源码不变性。
5. 历史52 Job的实际成功也不保证未来再运行52 Job能同时完成：GitHub Runner排队、最长40～55分钟Source轮询、各Job30分钟上限、镜像拉取、Artifact保留期、Github Actions免费用量/并发与GitHub Token API速率限制均须事先受控测算。历史源运行的重试attempt曾达到2或3，证明“偶发失败可由合法重试恢复”的历史事实，但**不能假定再次全量通过**。

## 四、可执行的恢复实验顺序（只是给A签授权参考，本包不运行）

**推荐技术路线：分批原分支原生恢复实验，先做F05-7再递进F05-8/9/10/D1，不修改原业务签证规则。**

| 分包 | 绝对前提及预估最大原生PG16作业规模 | 预计必经动作（本包未执行） | 失败停机门禁 |
| --- | --- | --- | --- |
| 1：F05-7 | A授权原分支安全实验、原生旧64＋新2＝66 | 先用官方Git API只读验证原分支为当前main的可安全快进祖先、决定是否允许原分支合法更新；需要原分支新Push、八份工作流同SHA且原生证据完整 | 不可快进/需要强推、不能取得原Push、ECR限流、PG断言失败即停 |
| 2：F05-8 | 包1新原生事实已验收；原生68Job | 复核当前旧64与4个自身Job顺序，重试仅允许官方新Push语义 | 任一完整旧链或自身非成功即停 |
| 3：F05-9 | 包2已签；70Job | 原八份冻结68＋2新签，可审查历史源 `ci-verify-70.mjs` | 非原分支的PR/dispatch混入立即停 |
| 4：F05-10 | 前序证据链可信；72Job | 9旧70＋2新；保障D1依赖在原测试隔离库成功 | 任一所属Issuer/权限门禁异常即停 |
| 5：F05-10-D1 | 先完成前四档真实校验；72Job | 单独原Push、9旧70＋2新D1，签据不得复制F05-10 | 任一原生业务安全、资产证据出错即停 |

**跨五包共348个历史门槛位置的PG16 Job，每次不同原分支HEAD/SHA不能无依据复用。** 上表为全量一个版本需要的名义Job数，并非已确定预算或可在当前main合并后执行的合法步骤。避免将源Job自引用约束强制写成“已完成”，应保留原版“自身仍在运行”的安全判定。

**技术方案存在新的工程决策**：如果A希望将当前main某一真实SHA附带五套合法原分支Push，可在独立试验中评估“原分支可合法快进到指定提交并在原分支推送”的Git历史/Workflow可行性；这需要正式授权原分支更新，且从现有 evidence 不能证明所有分支对当前main都是可快进。一旦不可快进，不能擅自 force push、重置旧提交或篡改原签分支。

## 五、供A决策的明确选项

| A可选择 | 可签署程度 | 理由 |
| --- | --- | --- |
| **A：放行F05-7最小受控实验（推荐仅技术验证）** | `A_NEW_AUTHORIZATION_REQUIRED` | 历史原链已证实成功，不是逻辑死局；但原分支Push、Run重启或旧冻结Workflow更改属于本包外，须先单独放行并限制预算/回滚与证据条件 |
| **B：保留原历史成功作为不可变归档，不恢复当前main新父签** | `SAFE_AS_IS_SOURCE_GAP_RETAINS` | 不触碰旧安全链；旧5项红灯不能伪绿，F05业务全域依然NOT_READY |
| **C：发现无法合法快进/旧门禁必须变更时终止恢复** | `UNRECOVERABLE_AS_IS / BLOCKED_REQUIRE_A_NEW_AUTHORIZATION` | 若合法原Push与同SHA不可同时成立，须向A提交具体冲突证据；不默认授权重写Verifier、跳过旧签证 |

**本次不存在需要用户新作产品权益/价格/资金选择的事实冲突**，这是A需签的技术CI/工程分支与成本裁决；只有影响PDM产品语义/真实生产、用户账户数据或资金时才按协作规范升级用户决策。

## 六、本B批次有效性与不可越权

本批只新增 `engineering/f05/parent-chain-restore-feasibility/**` 与 `.github/workflows/f05-parent-chain-feasibility-*.yml`。Node工具在GitHub正式Push中只读查询五原分支、各个官方旧Run/Job/Artifact（含尝试次数、回源SHA、有效期、大小、摘要元数据）并对API异常fail closed；所有模拟正例仅`HISTORICAL_METADATA_CANDIDATE_ONLY`。没有原分支写入、没有原Run重试、没有新证书，没有触碰旧工作流/DDL/业务/生产/C轨。

真正最终取证应以本B PR **最新HEAD同SHA原生CI** 与强制上传的 `f05-parent-chain-live.json` 为准。本文件静态事实与源码审查不能代替末SHA的动态审计。所有历史 Artifact 到期信息以每次官方API动态值为准。
