# 名邦汽车 V1｜CI重复触发治理 PR76｜B工程实施、自验及A技术复核交接

> 记录日期：2026-10-17（北京时间）；任务 `CI_TRIGGER_SCOPE_GOVERNANCE_01_IMPL_PR76`。
> 当前准确状态：`B_IMPLEMENTED_AND_STATIC_TESTED / REAL_AFTER_MATRIX_PARTIAL / READY_FOR_A_TECHNICAL_REVIEW_WITH_BLOCKER / NOT_READY_FOR_A_FINAL_ACCEPTANCE / NO_PRODUCTION`。
> 严禁把本报告当作A正式验收、全五场景真实通过、历史F05 Source获签、V1可上线或已合并main的证明。

## 1. GitHub正式基线与提交范围

- 仓库：`suzhe868-arch/mb`，仅分支 `fix/ci-trigger-scope-governance-01` / [PR76](https://github.com/suzhe868-arch/mb/pull/76)，**未合并main**。
- 施工前分支HEAD：`cfa4562a915ff29475fbd640dd9c25d847c13a55`；同步main的A正式裁决HEAD：`70e28690dda6d94ff66b6982a9d208b3517459de`；实施提交（双亲安全合入最新A文件）：`c876dba890bb3eb2e2ba99269feef1f8a693721d`。
- 与main真实compare：ahead 11、behind 0，16文件差异（原PR76只读新增6、10旧F05 Workflow只新增PR路径、原自验脚本新增8组断言）；无业务代码、数据库DDL、生产/第三方写入、C PR68改动。
- A授权依据：`07_重建工作区/CI触发治理_PR76_管理员分支保护证据核销与十项旧Workflow逐文件有条件修改放行_2026-10-16.md`。管理员UI证据核销required checks配置读取阻断，但工作流GitHub App管理端点仍403，**不能推翻A用户UI裁决**；如保护规则发生变化，必须停止。

## 2. 十文件逐字节安全约束

原Workflow修改只在现有 `on.pull_request.branches: [main]` 后加入 **31条正向 `paths`**。新Node测试对这10个文件逐个去掉新增路径块后复算原Git Blob SHA；全部严格匹配A签字原始Blob。由此原 `push` 分支、`workflow_dispatch`、Job名/内容、PG16镜像与隔离、原Source Verify、Artifact、权限/HTTPS及所有安全负例原字节保留：

|序号|文件|A签字原SHA|
|---:|---|---|
|1|`f05-7-deterministic-matching-readiness-four-tier.yml`|`cb56f8587807709ad598311e6964fa44a49d3020`|
|2|`f05-8-priority-arbitration-ttl-handover.yml`|`9dcac53085220e21c3e98fefc41d8c54d11dc867`|
|3|`f05-9-recommendation-visibility-grants.yml`|`05c7663b252bc61fe09c226a9e31ab32770fbd8f`|
|4|`f05-10-consultation-assignee-sla.yml`|`6f8d814b370b7ba3aaea0e60c3f2b43e739a212f`|
|5|`f05-10-d1-public-pool-owner-claim.yml`|`dcb6c5c6a56965419d1723153ceb6a0ddcc5649f`|
|6|`f05-9-frozen-f05-8-four-revalidation.yml`|`867346565654667601988a3ed90f92f84ce92bbc`|
|7|`f05-10-frozen-f05-8-four-revalidation.yml`|`5dba5c672be7f914a15dc89a57df0e78e7bf5baf`|
|8|`f05-10-d1-frozen-f05-8-four-revalidation.yml`|`2e66de2af3022d870678f068fd9f636b586f4515`|
|9|`f05-10-frozen-f05-9-two-revalidation.yml`|`def7c12248cb17d832a1d6a750e42ceb2601aeac`|
|10|`f05-10-d1-frozen-f05-9-two-revalidation.yml`|`279734b953484e6648a7f8019b00672a170f2fc5`|

真实依赖闭包覆盖 `engineering/f01~f05/**`、`engineering/shared/**`、SQL/迁移/数据库及脚本目录、工程/root包管理及锁文件、`.github/actions/**`、`.github/workflows/f05-*.yml|yaml`；排除C专属 `apps/mobile/**` 与其独立Workflow；F08-only也不误触发。安全选择为并集，不用`paths-ignore`或`if:false`改变原安全门禁。

## 3. 实际自验与CI（事实不外推）

实施SHA `c876dba890bb3eb2e2ba99269feef1f8a693721d`：
- GitHub Actions真正Push Run [38930343504](https://github.com/suzhe868-arch/mb/actions/runs/38930343504) / Job `117072415572`：**success**，Node **36/36通过、0失败**；实际扫描322个Workflow，F05前缀96、宽泛F05 PR触发器由10降至0。
- 同SHA真非空Artifact `12057739513`，名称 `ci-trigger-scope-readonly-c876dba890bb3eb2e2ba99269feef1f8a693721d`，16015B，官方SHA256 `b092658acd6b410a42c244266802d433c1735f37a2c57a36c54dec19ff2626fc`；2026-10-30到期。仅核官方元数据，未独立下载ZIP复算。
- 本次PR自身包含十个F05 Workflow路径，因此按约**十份F05 pull_request原生Run仍会触发**（这是 workflow-self 阳性证据，不是C-only误触发）。新自有审计PR/Push亦真实success。原Source如 `F05_10_NOT_NEW_OFFICIAL_PUSH`、`D1_NOT_NEW_OFFICIAL_PUSH`保持**真实失败**；不能将其变绿或默默Skip。
- 最终文档证据提交后的末SHA与CI结果，以PR76的最新正式B评论和该SHA对应GitHub原生Run为准；不将本阶段成功Run冒充下一提交同SHA。

## 4. 五类真实After回归的可行性边界

|场景|静态Node回归|同任务真实GitHub独立Before/After|
|---|---|---|
|C-only|PASS（不命中F05）|**NOT_VERIFIED**：改动中的10份Workflow是PR76的diff组成部分，不可能让PR76变为真正C-only|
|F05-only|PASS（应触发）|PR76的workflow-self与F05本域混在同一PR diff，不能冒称独立F05-only对照|
|共享依赖|PASS（应触发）|**NOT_VERIFIED**：无共享依赖独立实PR|
|Workflow-self|PASS（应触发）|**PARTIAL_REAL_PASS**：同SHA真实PR确实产生10个旧F05 Run；逐Job Source仍需按原红灯分别核实|
|Mixed(C+F05)|PASS（应触发）|**NOT_VERIFIED**：无独立混合PR|

**真实工程限制**：GitHub `pull_request.paths` 根据PR相对base的**整个变更文件集合**判定；在A尚未将PR76合并main之前，无论如何继续往PR76提交C-only文件，PR diff仍包含这10份F05 Workflow，因自路径白名单仍会拉起10个旧F05。新开PR向当前main提交同样的10份修订亦无法成为C-only。B不得擅自改main、改变PR base触发定义、临时解除安全触发或声称五组都完成。

建议A独立技术裁决验收改为**两阶段**：先核本分支安全diff、真workflow-self/Source红灯与36项契约，再由A决定是否标准合并；合并后在新main上提交纯C-only/F05-only/shared/mixed的非业务受控测试PR完成真After矩阵。未经A明确调整本测试合同，**本PR不能标 `READY_FOR_A_REVIEW_FINAL` 或 `CI_TRIGGER_SCOPE_GOVERNANCE_FIXED`**。

## 5. 回滚、剩余阻断与责任

- 回滚原则：经A批准只从分支撤销本批十个Workflow插入块并恢复上表原Git Blob；不得动原业务Job、旧Source签据、合并main或强推其他分支。
- 当前阻断：五类**独立**真GitHub AFTER回归未完整满足；剩余真正红色F05 Source为独立历史正式父来源缺口，不属于本触发修复权限。
- 下一责任：`NEXT_OWNER=A`（仅**技术验收合同/分阶段独立核验裁决**），B已完成已签字十项配置实装和真实静态+workflow-self证据；A未裁前不得以此提交正式终验或合并main。
- 历史业务门禁仍为 `F05_SOURCE_GAP / F05_F08_V1_NOT_READY / NO_PRODUCTION`。C PR68的首页/详情R3返工由C独立承担，本轮B不越界。
