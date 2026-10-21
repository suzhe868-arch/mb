# 当前有效状态（2026-10-21｜覆盖下方历史快照）

F06 Issue #171 的非生产子范围已通过 A 独立验收，PR #174 已标准合并；最终业务 SHA `06c880d7f53adda7862da88cde0b790fdc60f415`，合并/main SHA `86f59431768f393232b8746cd3deb62f1044d85c`。官方 Run #39602409488 成功，Artifact #12347892081 非空且未过期。具体测试与跨 OID Seal 见 `F06_Issue171_PR174最终独立验收与合并报告_2026-10-21.md`。

A 已完成 F07 只读差异核查：PR #64–#67、#69 的既有 CI-only 成果直接复用；当前主应用缺少 F07 Runtime 接线，电话能力正向来源、F05 转换正向来源、真实 JYT/CDN/OSS/Feishu 等仍有明确 SOURCE_GAP/授权边界。见 `F07现有CI成果与真实Runtime缺口_A主控核查_2026-10-21.md`。

当前唯一任务：`F07_NONPROD_RUNTIME_INTEGRATION_01`，Issue #178，分支 `feat/f07-runtime-integration-nonprod-01`，施工单 `07_重建工作区/F07真实应用Runtime四域接线非生产整包_A主控B正式施工单_2026-10-21.md`。正式放行以本 A 治理 PR 合并 main 后生效；B 开工时必须读取远程最新 main。

F06/F07/F08/V1 全局状态继续 `NOT_READY / NO_PRODUCTION`。无真实 JYT、外部 CDN/OSS、Feishu、真钱、实际退款/成交或生产部署授权。F08 完整阶段通过正常验收后，整个 B 后端最终整体验收由 A 独立负责；C 轨 PR #68 不受本轮影响。

---

## 历史状态快照（仅用于追溯；不得覆盖上述当前状态）

# 2026-10-21｜CURRENT_PROJECT_STATE补充：Issue171版本正确的F05源事实预置路径

本补充裁决仅在治理PR合并main后生效。它只允许原Issue171分支按签名账本版本调用现有F05-7/F05-8正式服务生成非生产测试所需的真实Match/Priority事实，并要求旧Issue164分支完全保留原迁移执行路径。没有放宽F05源码/迁移/父签名表、原始SQL伪造、Mock、Ref/SHA/RunID或物理OID校验。PR #174仍未验收/未合并，B继续原分支，待最终SHA官方CI完整成功并归档同SHA证据后交A独立复验。F06/F07/F08/V1仍NOT_READY。

---

# 2026-10-21｜A第二轮独立复核PR174：Priority真实PG16测试失败，B继续原分支定向整改

- 对象：[PR #174](https://github.com/suzhe868-arch/mb/pull/174) / [Issue #171](https://github.com/suzhe868-arch/mb/issues/171)。
- B当前HEAD：`32abe113574bcef1bb5d3d591072a3b6f31fb023`。
- 官方Run：[39591349465](https://github.com/suzhe868-arch/mb/actions/runs/39591349465) **failure**；Artifact `f06-issue171-evidence-39591349465`是失败Run的部分证据，不可作为最终验收包。
- 新Lifecycle HTTP/真实PG16测试 **32/32通过**，旧Composite E2E **42/42通过**。
- **阻断**：真实Priority来源测试在调用F05-7 `saveSalesDescriptionCI` 时失败：`F05_7_SIGNED_V22_LEDGER_REQUIRED`。该旧F05-7服务只接受v22/v23时代的旧迁移账本，本任务当前Composite父库已是24条签名迁移。Priority真实测试未完成，签名来源负向矩阵未执行，161表/24迁移跨OID Seal、Legacy回归和最终证据门禁均被跳过。
- **下一责任人仍为B**：原Issue #171、原分支 `feat/f06-nonprod-composite-lock-lifecycle-01`。先只读核实当前v26父库是否已有有效真实签名Match/Priority事实；不得修改冻结F05-7/F05-8源码、迁移或父表，不得用原始SQL伪造Priority。若无可合法复用的真实事实，提交精确SOURCE_GAP证据给A请求最小技术裁决。
- 修复后需完成真实Priority来源四动作无副作用矩阵、签名来源负向测试、跨OID Seal、Legacy回归和同一最终SHA官方CI/Artifact；完成前PR #174不合并，Issue #171开放，F06/F07/F08/V1仍 `NOT_READY`。

---

# 2026-10-21｜A独立验收PR174：CI证据核实通过，但业务与签名来源负向测试两项阻断，B原分支定向整改

- **验收对象**：[PR #174](https://github.com/suzhe868-arch/mb/pull/174)，Issue [#171](https://github.com/suzhe868-arch/mb/issues/171)，B分支 `feat/f06-nonprod-composite-lock-lifecycle-01`。
- **已核实B最终SHA**：`9409e426c54e5b767a914cb134a7022aed77ffae`；官方Push Run [39576895129](https://github.com/suzhe868-arch/mb/actions/runs/39576895129)全部步骤成功；Artifact `f06-issue171-evidence-39576895129`存在且未过期。
- **真实证据**：Lifecycle 30/30、Composite 42/42、Legacy Node/HTTP 37/37、Legacy PG16生命周期13/13、Legacy审计1/1；161张父表、24条迁移，三物理OID `22746/16387/23026`跨OID Seal一致，`unauthorizedParentDrift=false`。15个变更路径在正式白名单内，没有发现越界修改。
- **A裁决**：PR #174暂不合并，Issue #171保持开放，`NEXT_OWNER=B`。正式退回报告：[F06 Issue171 PR174独立验收退回报告](07_重建工作区/F06_Issue171_PR174独立验收退回报告_2026-10-21.md)；已在PR/Issue讨论记录。
- **阻断一（业务）**：`engineering/src/f06-lock-lifecycle-service.mjs`目前仅拒绝Priority来源Lock的extend/expire，release/cancel仍可能变更状态。补齐release/cancel硬拒绝，并用真实PG16对extend/release/cancel/expire四种动作验证Lock状态、签名事件、审计均无变化。
- **阻断二（验收）**：PR #173裁决要求的签名来源负向边界测试缺失。补齐Issue164/Issue171精确profile互斥、错误Ref、非Push、HEAD/SHA不一致、无效Run ID、错误OID、源码摘要漂移、父迁移/Attestation不一致、权限撤销和伪造身份的实际负向测试，并纳入同SHA官方workflow/evidence gate。
- **继续方式**：原Issue、原分支、原任务不变；不新建平行任务、不强推、不合并main。保留当前成功测试和Artifact；两项整改完成后重新跑最终SHA官方CI并归档新工件，再交A复验。
- **状态边界**：现有成功测试只是部分验收证据；F06/F07/F08/V1继续`NOT_READY`，无生产、真钱、真实退款/成交或F07/F08开工授权。

---

# 2026-10-21｜A主控Issue171真实新分支Composite签名来源物理阻断成立，五文件精确补充裁决，B原任务继续

- **真实进度不虚报**：Issue [#171](https://github.com/suzhe868-arch/mb/issues/171)，B原分支`feat/f06-nonprod-composite-lock-lifecycle-01`当前阻断报告HEAD`13b9cc580b0907d743414707d353d4b96f1ca39b`，仅一份中文源代码级说明；本Issue `>=16` 真实PG16/HTTP新测试、正式本SHA工作流、封印、业务实现**尚未完成**。之前Issue164/PR169的42/42+32/32+6/6+Legacy1/1保留且不冒充本Issue结果。
- **A核验阻断超出B初报两文件**：旧`可信Composite签名根.mjs`固定Issue164分支，`composite-issuer.mjs`绑定真实SHA/RunID/源码hash/PG OID，私有`composite-issuer.sql`有旧Ref数据库CHECK，`核对同Ref上游签名PG16.sh`及`父表161迁移24跨OID封印.mjs`又独立硬绑旧Ref。真实Issue171新Push不可能在原白名单内合法签发与Seal；禁止伪造`GITHUB_REF`或迁移旧签名。
- **A补充单**：[《F06 Issue171真实分支Composite签名根五文件最小技术裁决》](07_重建工作区/F06_Issue171真实分支Composite签名根五文件最小技术裁决补充单_2026-10-21.md)。只允许上述**5个精确文件**对`feat/f06-nonprod-single-runtime-trusted-source-01`与`feat/f06-nonprod-composite-lock-lifecycle-01`两个真实Push分支做严格受控profile适配；源hash、真实HEAD SHA/Run、同物理非超管PG16、24签名迁移和161父表跨真实OID密封均不可弱化。SQL旧私有CHECK仅添加确切新branch；所有其他旧F06/SQL/公共DDL、旧CI、F02/F03/F05、PDM、C轨仍只读冻结。
- **本次A裁决并非B验收**：B保留原分支原Issue并安全同步本治理PR实际合入的main，按原Issue171完整施工单一次性完成Composite普通Lock生命周期接线/16+本SHA原生真PG16新场景及必要高风险Legacy回归与异OID封印，语法和范围双门禁；无法合法接通则如实报告阻断。**NEXT_OWNER=B**、`NEXT_TASK=F06_NONPROD_COMPOSITE_LOCK_LIFECYCLE_INTEGRATION_01`、`NEXT_ISSUE=171`、`NEXT_BRANCH=feat/f06-nonprod-composite-lock-lifecycle-01`。F06/F07/F08/V1仍`NOT_READY`，无生产/真钱/实际退款`refunded`或成交`completed`权限。

---

# 2026-10-21｜A完成Issue164后F06真实Runtime缺口核查，正式定向放行B Issue171非生产生命周期接线

- **A独立核查结论**：[《Issue164后F06真实Runtime与Issuer剩余差异》](07_重建工作区/F06_Issue164后真实Runtime与Issuer剩余差异_A主控定向核查_2026-10-21.md)。[已验业务PR169](https://github.com/suzhe868-arch/mb/pull/169)单PG16 Composite完成Lock→合成Deposit→Transaction→Handoff→Cancel→Refund无付款closed，Issue164已关闭；其已验42/42+32/32+6/6+Legacy审计1/1原生事实、161父表24迁移跨OID封印全部复用，不回头重做。
- **确认唯一新增可施工缺口**：`engineering/src/f06-nonprod-composite-runtime.mjs`新Composite单Runtime只装LockService/LockHandler及原有合成财务路由，**未挂载普通Lock Lifecycle**；旧`f06-lock-lifecycle-service.mjs`的环境校验、`f06_real_lock_test`、`DISPOSABLE_TEST_ONLY`员工Session/财务缺席proof固定旧`f06_lock_test/f06_lock_ci`单库，不能在新`f03_auth_test/f03_ci`中冒充可信Composite来源。旧Lifecycle逻辑和LockRequest 6小时/候补均已有，不重写状态机，只需可信同库来源接线与必要关联回归。
- **A正式单包放行**：[Issue #171](https://github.com/suzhe868-arch/mb/issues/171)；[《Issue171 Composite普通Lock生命周期可信接线A正式B施工单》](07_重建工作区/F06_Issue171_Composite普通Lock生命周期可信接线_A主控B正式施工单_2026-10-21.md)。B从**本治理PR实际合并后的最新main**建立`feat/f06-nonprod-composite-lock-lifecycle-01`，仅按精确路径＋用途白名单复用已有代码做非生产普通Lock延期/释放/取消/PG时钟到期、Priority/资金/source强拒、真实PG16/HTTP并发幂等/rollback，原有Legacy入口完全不变。提交前`git diff --check`与全部改动JS`node --check`，同新SHA官方真实不少于16项新场景及定向关联回归，整包`READY_FOR_A_REVIEW`后统一交A；不得擅合并。
- **正式唯一指针**：`NEXT_OWNER=B`、`NEXT_TASK=F06_NONPROD_COMPOSITE_LOCK_LIFECYCLE_INTEGRATION_01`、`NEXT_ISSUE=171`、`NEXT_BRANCH=feat/f06-nonprod-composite-lock-lifecycle-01`。仍非生产隔离/可销毁/非特权PG16，**严禁真钱、正式生产Issuer、refunded、completed、线上接口/生产权限**；F06/F07/F08/V1仍`NOT_READY`，F07/F08后续独立B阶段未凭本单自动开工，C PR68不动。不能在白名单内合法接线则统一报告`BLOCKED_F06_COMPOSITE_LIFECYCLE_SIGNED_SOURCE_GAP`，不得伪造父来源。

---

# 2026-10-21｜A主控F06 Issue164第二轮独立终验通过，业务PR169已合并；接A核查剩余真实Issuer

- **正式结论**：Issue [#164](https://github.com/suzhe868-arch/mb/issues/164) 已完成A第二轮独立增量验收并关闭；B末SHA `1feb1e4efa8120252950e3d2d5b808a76a5bdb2c`，同SHA官方[Run39560892258](https://github.com/suzhe868-arch/mb/actions/runs/39560892258)/Job119091597788 `completed/success`，非生产单PG16业务42/42、HTTP拒绝32/32、缺签拒绝6/6、独立Legacy审计1/1，0失败/跳过/取消；161张父表24迁移跨OID 22749→16387→22980完整Seal相同、无越权漂移，证据工件[12327089697](https://github.com/suzhe868-arch/mb/actions/runs/39560892258/artifacts/12327089697)有效至2026-11-04。
- **A整改两项闭环**：旧`CI_LEGACY`审计action `f06_real_test_*`经真PG独立回归证实保留；新Composite审计 `f06_composite_*`和不可变事件在真实PG16测试证实；四步来源矩阵由`IMPLEMENTING`订正为`CI_SIGNED_NONPRODUCTION`，六步契约强拒`PRODUCTION_READY`。7文件增量与Issue164/PR166精确路径＋用途授权一致，冻结旧SQL/DDL/旧CI/F02/F03/F05/PDM/C未修改。
- **GitHub实际合并**：[业务PR #169](https://github.com/suzhe868-arch/mb/pull/169)已标准merge，SHA `e569d5e1c541333b26975f217c14ad414c2a3763`；[A正式验收评论](https://github.com/suzhe868-arch/mb/pull/169#issuecomment-6310587050)；[完整中文独立终验报告](07_重建工作区/F06_Issue164单Runtime可信来源第二轮独立验收PR169合并与后续范围核查报告_2026-10-21.md)。本项仅`A_ACCEPTED_NONPRODUCTION_ISSUE164`，不代表真钱、生产Issuer、Transaction completed、Refund refunded、线上API或F06阶段完整完成。
- **当前唯一接力**：`NEXT_OWNER=A`、`NEXT_TASK=A_F06_POST_ISSUE164_REMAINING_RUNTIME_ISSUER_GAP_AUDIT_01`、`NEXT_ISSUE=null`；由A先定向核查F06剩余正式Runtime/可信Issuer与后续F07/F08依赖，已验历史工程直接复用，不自动签发新的B施工单。F06/F07/F08/V1均仍`NOT_READY`；F07/F08原独立B阶段未提前放行，F08正常A验收之后整个B后端的最终整体验收仍由A独立负责。C PR68不动。

---

# 2026-10-21｜B工程提交前语法与施工范围双门禁已写入（治理更新）

- **正式规则**：[B工程执行增量审查关联回归与避免重复施工正式规范](07_重建工作区/B工程执行增量审查关联回归与避免重复施工正式规范_2026-10-21.md)；[A/B/C三窗口协作与验收规范](07_重建工作区/A_B_C三窗口协作与验收规范.md)。
- **强制要求**：每批修改、每次提交前执行 `git diff --check`，对所有受影响的 `.js/.mjs/.cjs` 执行 `node --check`；检查失败先本地修复再推送。提交与交A前都要逐文件、逐关键差异核对“路径授权＋用途授权”，测试/CI通过不能豁免越界。详见B正式规范第七、八节。
- **Issue #164专项**：按原施工单与已合并 PR #166 的技术裁决共同判断授权。PR #166 仅对补充裁决列明的文件和用途有限放行；不是允许任意修改旧F06服务。当前B分支如存在越界差异，必须先整改，不能直接交A验收。
- **接力不变**：`NEXT_OWNER=B`、`NEXT_TASK=F06_NONPROD_SINGLE_RUNTIME_TRUSTED_SOURCE_INTEGRATION_01`、`NEXT_ISSUE=164`、`feat/f06-nonprod-single-runtime-trusted-source-01`。本次只改治理文档和状态记录，不改业务代码、CI工作流、B分支或Issue任务授权，不新建任务。
- **当前仍未完成**：F06真实非生产业务正向闭环和最终SHA官方CI仍须按原施工单完成；F06/F07/F08/V1仍为 `NOT_READY`。

---

# 2026-10-21｜A正式裁决Issue164：单PG16真实CompositeIssuer、旧源双入口不越权，B原分支继续

- **已实证B阻断成立**：[Issue164](https://github.com/suzhe868-arch/mb/issues/164) B分支 `feat/f06-nonprod-single-runtime-trusted-source-01@7058779956438009fbc49a8f100ddcf5f7e17192`，[同SHA官方Run39514294355](https://github.com/suzhe868-arch/mb/actions/runs/39514294355)/Job118942621386仅**HTTP32/32安全拒绝 + 真实非超管PG16 6/6缺签拒绝**，整条Lock→Deposit→Transaction→Handoff→Cancel→Refund实际正例 `NOT_RUN`，不能标交A验收。PR139旧3A分支与PR153/156/162旧3C1分支硬门禁在一个真实GitHub Push不可同时成立；Lock`f06_lock_test`与交易`f03_auth_test`非同物理数据库，旧裸F03数据库1迁移校验也不兼容现24迁移签名F06库。A原工作单白名单无法合法解决，严禁伪`GITHUB_REF`/旧源或拷贝签名余额。
- **本轮A裁决**：[《Issue164单PG16可信CompositeIssuer与冻结服务双入口技术裁决补充单》](07_重建工作区/F06_Issue164单PG16可信CompositeIssuer与冻结服务双入口_A主控技术裁决补充单_2026-10-21.md)，已置顶更新[原正式施工单](07_重建工作区/F06单应用隔离Runtime可信源接线与业务闭环_A主控B正式施工单_2026-10-21.md)。选**独立`COMPOSITE_NONPROD_SIGNED_V1`新来源模式**，以真实当前GH Push、单物理非特权PG16 `f03_auth_test`及不可变父签名、真正F03员工Session与权限为信任根；旧`CI_LEGACY`模式原始历史分支/签名/库门禁完全保留且对新来源`FailClosed`。在补充单列明的精确旧服务/Lock/迁移入口文件白名单内，只准抽取**同一个已验资金/事务核心**和受控双入口，不准改旧SQL/公共DDL/旧工作流/F03/F05/F02身份权限/PDM、真资金或生产路径。无法在白名单内合法穿透下游时准确报`BLOCKED_COMPOSITE_PARENT_AUTHORITY_DEPENDENCY`。
- **接力未变**：`NEXT_OWNER=B`，`NEXT_TASK=F06_NONPROD_SINGLE_RUNTIME_TRUSTED_SOURCE_INTEGRATION_01`，`NEXT_ISSUE=164`；B保留原7个提交/38项安全测试，安全同步裁决治理PR合并后的最新main，一次性完成真实≥20新集成正例/安全拒绝、受影响旧父高风险回归、161表24迁移跨OID Seal、同SHA官方CI后整体`READY_FOR_A_REVIEW`才回A。F06/F07/F08/V1仍`NOT_READY`，F07/F08独立阶段未放行，F08之后后端整体验收归A，C PR68不动。

---

# 2026-10-21｜A完成F06正式Runtime接线差异核查，按现有阶段一次性放行B关联集成Issue164

- **正式A核查结论**：[《F06已验收功能与真实Runtime接线差异》](07_重建工作区/F06已验收功能与真实Runtime接线差异_A主控独立核查_2026-10-21.md)。已验PR139/146/150/153/156/162及Lock受控Runtime全部复用，不重写业务、不过度重复旧CI。当前`engineering/src/server.mjs`的F06实际仅挂受控Loopback/隔离PG16 Lock Handler，其他已验财务/交易侧车带有严格GitHub父Branch与合成来源门禁，**未形成同一可信应用Runtime综合接线**；Completed、真实Refund付款/生产Issuer依然`SOURCE_GAP`且未获生产授权。
- **本轮A正式放行B一个关联任务**：[Issue #164](https://github.com/suzhe868-arch/mb/issues/164) `F06_NONPROD_SINGLE_RUNTIME_TRUSTED_SOURCE_INTEGRATION_01`；[《F06单应用隔离Runtime可信源接线与业务闭环正式施工单》](07_重建工作区/F06单应用隔离Runtime可信源接线与业务闭环_A主控B正式施工单_2026-10-21.md)。B从**实际开工最新main**建立`feat/f06-nonprod-single-runtime-trusted-source-01`；只在新CI集成目录/单工作流/受控测试Runtime少数精确白名单内以合法真实签名接线，禁止伪造父Branch、降低旧业务门禁、复制状态机或开放真钱。若签名父来源无法合法用，一次性汇总`BLOCKED_TRUSTED_F06_ISSUER_RUNTIME_GAP`交A，不报告伪成功。
- **当前接力`NEXT_OWNER=B`、`NEXT_TASK=F06_NONPROD_SINGLE_RUNTIME_TRUSTED_SOURCE_INTEGRATION_01`、`NEXT_ISSUE=164`**；仅当本A治理PR合入main正式生效。B整单连续做增量自审、必要高风险回归、真实同SHA官方CI及证据，达到`READY_FOR_A_REVIEW`再交A。F06/F07/F08/V1仍`NOT_READY`，F07/F08独立阶段不启动，F08阶段正常A验收后后端最终整体验收归A；C PR68、生产/真钱/外部资源不变。

---

# 2026-10-21｜A主控F06 Issue159可信移交取消到退款接续终验通过，标准合并PR162；进入A后续真实集成缺口核对

- **本轮已真正通过A独立验收**：[Issue #159](https://github.com/suzhe868-arch/mb/issues/159) B末SHA `bec6b39f4c5ffd44f048ff24bd932a793a70c71d`；[官方Run39506844523](https://github.com/suzhe868-arch/mb/actions/runs/39506844523)/Job118917784231同SHA`completed/success`。A独立源码逐函数比对原PR150 Permission/Deposit/3A历史/Refund余额核心不变，旧PR146 Refund入口对新PR153/156签名保持`FailClosed`、新桥与旧路径共用受控事务核心；变更12文件均在A Issue159及PR161已签白名单，冻结父签/DDL/旧Workflow字节未改。**新旧联合非特权PG16/HTTP 130/130（旧PR156影响84+桥46）**、原TLS11/11+新TLS12/12、旧PR150 PG16 79/79及Handoff40/40相关回归、父161表24迁移不同物理OID 97332→107142全Seal一致。旧Shell辅助TLS打印`0/0`不是通过证据，已由同SHA独立强制原生TAP校验规避，列技术债、不冒充成功。
- **业务PR已标准合并**：[PR #162](https://github.com/suzhe868-arch/mb/pull/162)，merge SHA `7b671cbd63461de6490167357666b05bdcce93e2`；[完整中文A独立验收与边界报告](07_重建工作区/F06_Issue159签名移交后取消至退款接续_A主控独立验收PR162合并报告_2026-10-21.md)。本次仅`A_ACCEPTED_NONPRODUCTION_ISSUE159`，不代表真实钱款退款`refunded`、线上应用服务/API可用、Transaction`completed`或整个F06完成。
- **下一接力`NEXT_OWNER=A`**，`NEXT_TASK=A_F06_REMAINING_REAL_RUNTIME_INTEGRATION_SCOPE_AUDIT_01`：按原F06路线只核对现有真实主服务接线、签名/Issuer及剩余未实现模块，复用已验成果后再按依赖决定下一B正式施工单；不自动下发未经界定的新B任务。F07/F08保持原独立B工程阶段，F08正常A验收后后端最终整体验收归A；F06/F07/F08/V1仍`NOT_READY`，生产/真钱/真实外部凭据/第三方权限和C PR68未放行。

---

# 2026-10-21｜A主控 Issue159 正式技术裁决：允许PR150唯一受控资金核心复用，B原分支继续施工

- **源代码实证裁决**：[Issue #159](https://github.com/suzhe868-arch/mb/issues/159) B `feat/f06-signed-post-handoff-refund-bridge-01@2f703e38d150b249db262ecdba6fc96e4226c90c` 已上报 `BLOCKED_SIGNED_POST_HANDOFF_REFUND_BRIDGE_SOURCE`。其[官方Run39501146534](https://github.com/suzhe868-arch/mb/actions/runs/39501146534)只有**静态检查 success**，真实退款pending/closed、非超管PG16>=35、HTTP/TLS>=10、旧父161表24迁移Seal/并发注错**全部未运行**，绝非`READY_FOR_A_REVIEW`。PR150 原 `verifyTransactionSource()` 硬绑旧PR146取消签名和初始responsible；其私有资金原语无法供新PR153→PR156来源调用，B报告的原授权白名单互斥阻断成立。
- **唯一通过的A技术方案**：[《F06 Issue159 PR150资金原语复用与来源版本接续技术裁决补充单》](07_重建工作区/F06_Issue159_PR150资金原语复用与来源版本接续_A主控技术裁决补充单_2026-10-21.md)。受控新增精确写权仅 `engineering/f06/transaction-refund-http-pg16/service.mjs` 及可选新增 `engineering/f06/transaction-refund-http-pg16/shared-refund-core.mjs`，为真实新旧签名来源共享**同一**资金/历史余额/原子退款核心；旧PR150接口遇新来源继续FailClosed。B现有新增桥接目录与专属workflow可相应升级白名单及真实CI。其余PR139/146/153/156、PR150旧sidecar.sql、公共DDL/迁移/旧Workflow及生产权限继续冻结，禁止伪造旧Cancel或复制第二套资金算法。
- **接力未改**：`NEXT_OWNER=B`；`NEXT_TASK=F06_SIGNED_POST_HANDOFF_CANCEL_TO_TRANSACTION_REFUND_BRIDGE_01`，`NEXT_ISSUE=159`；B在原分支安全同步A治理PR合并后的最新main，保留既有5个提交、补同SHA真实PG16/HTTP/权限/资金/历史父Seal验证后统一交A。**仅当本轮A裁决PR标准合入main后正式生效**。F06/F07/F08/V1仍`NOT_READY`，F07/F08独立阶段、F08后端整体验收归A，C PR68不动，生产真钱外部服务不授权。

---

# 2026-10-21｜A主控正式放行F06移交后取消到Transaction退款可信来源接续Issue159（按B增量自审规范；无重复施工）

- **本轮A完成的任务**：在最新 `main@be748b2b8165be4d644527bcccb4582e5c08c752` 下复核 PR #150 的原签名 Refund 与 PR #153 Handoff、PR #156 新签名 Cancel 的真实代码：原 PR150 验证强制最初 responsible 恒等于现 responsible 且只认可 PR146 旧 Cancel origin；对PR153→PR156新来源合法 `FailClosed`。**不复制旧Transaction/Cancel/Refund状态机，不对F01～F05全阶段返工。**
- **已签 B 正式施工单**：[《F06已签移交后取消到Transaction退款可信来源接续》](07_重建工作区/F06已签移交后取消到Transaction退款可信来源接续_A主控B正式施工单_2026-10-21.md)，[Issue #159](https://github.com/suzhe868-arch/mb/issues/159)，任务ID `F06_SIGNED_POST_HANDOFF_CANCEL_TO_TRANSACTION_REFUND_BRIDGE_01`。仅允许B从开工时最新main新建 `feat/f06-signed-post-handoff-refund-bridge-01`，在本单白名单完成真实合法 PR139 Tx→PR153 Handoff→PR156 Cancel→Transaction侧合成Refund pending/无付款closed的最小可信来源适配、真实PG16/HTTP正反/并发/回滚以及本单必要父签名安全关联回归；沿用已验 PR150 全部有效资金与历史语义。B一次完成整单自审、CI与中文证据，再 `READY_FOR_A_REVIEW` 交A；不自行建PR/merge。
- **接力指针**：`NEXT_OWNER=B`；`NEXT_TASK=F06_SIGNED_POST_HANDOFF_CANCEL_TO_TRANSACTION_REFUND_BRIDGE_01`；`NEXT_ISSUE=159`。只有本A治理PR实际合入main后才能视为正式生效。继续遵守已落库B增量审查关联回归规范，不机械重跑全部历史CI；资金/权限/签名/事务/161父表/24迁移与Seal等必须按本单保留。F07、F08各自仍是B独立工程阶段，F08经A正常验收后后端整体验收归A。F06/F07/F08/V1仍 `NOT_READY`；真钱/生产/外部服务/C PR68未授权、未施工。

---

# 2026-10-21｜A主控：用户批准 B 执行优化规范并正式写入（原 F06/F07/F08 施工路线不变）

- **本次为 B 流程治理落库，不是新 B 施工放行。** 已按用户明确“正式写入”要求，制定[《B工程执行增量审查关联回归与避免重复施工正式规范》](07_重建工作区/B工程执行增量审查关联回归与避免重复施工正式规范_2026-10-21.md)，并同步 A/B/C 协作规范、原 B 工程路线图。既有 F01～F05 A 验收继续有效；F06/F07/F08 仍各自为 B 独立施工阶段，F08 完成经 A 常规验收后，B 后端最终**整体**验收/评估/后续调整由 A 单独负责。
- **B 方法调整**：先核已验实物避免重复建设；区分已验收、隔离 CI/Mock、已证实缺陷和独立授权缺口；B 只对本轮代码和真实受影响调用链增量自审，执行必要关联回归与原施工单强制高风险门禁；关联子任务在已授权范围内连续闭环、集中 `READY_FOR_A_REVIEW` 交 A；旧工作流冗余优化须另行授权，不删除安全断言或伪造同 SHA 成功。
- **当前接力**：`NEXT_OWNER=A`；`NEXT_TASK=A_PREPARE_NEXT_B_TASK_BY_EXISTING_PROCESS`。仅落实用户已批准的 B 工作方式，不重拆 F06～F08 阶段、不修改现有业务代码/CI/PDM、不自动创建下一 B Issue/施工单/分支或放行。F06/F07/F08/V1 仍 `NOT_READY`，生产/资金/外部真实服务权限不变；C PR68 不动。此前“待重规划讨论”条目作为历史记录保留。

---

# 2026-10-21｜A主控F06已签Handoff后Transaction正常取消680/680终验并合并PR156；按用户要求暂停下个施工单，先讨论F06/F07/F08整体重新规划

- **本轮最终验收**：[Issue #154](https://github.com/suzhe868-arch/mb/issues/154)已关闭；B受验末HEAD `0b0aba78ac90e8081035aa41708dc160a53ea448`，[同SHA官方Run39482165477](https://github.com/suzhe868-arch/mb/actions/runs/39482165477)/Job118833222205父585+新真实非超管PG16 HTTP84+TLS11=**680/680**（0失败/跳过/取消）。A独立源码核查：真正PR139 Tx+PR153签名Handoff后的当前负责人使用独立Permission/Scope取消`in_progress→cancelled`，新不可变Sidecar Event/Key/Audit同PG16原子事务、真实两Employee PID2235/2236、Handoff和Cancel真正不同后台PID2249/2250竞争安全拒绝、三处故障注错rollback、旧PR150 Refund新来源继续FailClosed；161张父签表逐表COUNT+MD5、24迁移跨物理OID97322→107137/独立审计OID39338及完整Seal不变。业务[PR156](https://github.com/suzhe868-arch/mb/pull/156)已实际标准merge `a9b8de83e21f72426009e4a4c1947b9ecedba1e9`；[A中文独立验收报告](07_重建工作区/F06已签Handoff后Transaction取消_A主控独立终验PR156合并与三域重规划暂缓放行报告_2026-10-21.md)。
- **本次不得自动签发新B或C任务包**。按用户明确要求，下一步`NEXT_OWNER=A`（与用户讨论、整理整体方案）、`NEXT_TASK=F06_F07_F08_INTEGRATION_REPLAN_DISCUSSION_01`，先核对原F06/F07/F08已验成果与重复施工、CI-only和HTTP/PG16差异、跨来源版本兼容、业务闭环分包、B一个ChatGPT聊天窗口内串行完成整包并集中交A验收，明确C前端独立职责。重新规划/正式放行必须待讨论确认；历史PDM及源码不因本报告发生权限提升。禁止生产/真钱/completed/外部真实Issue，F06/F07/F08/V1仍`NOT_READY`，C PR68仍Draft。

---

# 2026-10-21｜A独立验收通过 F06真实Transaction负责人正式Handoff 585/585，PR153已合并；下一任务B执行已签Handoff后的Transaction取消

- **最终A裁定**：`F06_REAL_TRANSACTION_RESPONSIBLE_HANDOFF_HTTP_PG16_01`，[Issue151](https://github.com/suzhe868-arch/mb/issues/151)已关闭；B受验HEAD `4d499810cd9a97bd483ffb257b5d03b01f6bb062`、[官方同SHA Run39458177954](https://github.com/suzhe868-arch/mb/actions/runs/39458177954)/Job118750396752：父534+新真实PG16 Handoff40+TLS11 = **585/585**（0失败、0跳过、0取消），旧签161张表、24条迁移、真实物理OID87819→97329及审计OID39339，完整Seal相等 `9833de68dfd2ab9cc1f6c65995359589d29247a7dcb6ca980eaaa94b7962d5c0`。A独立检查PR139初始负责人签名、PR153新Version事件/Key/Audit与Public责任人同事务、权限和有效Scope、两不同Manager Session PG PID2055/2054并发最多一个成功、Rollback/幂等及旧PR146/150不兼容后的FailClosed。标准[业务PR153](https://github.com/suzhe868-arch/mb/pull/153)实际已merge `70c9372a55865d59c5a3772b368d236775154038`。
- **下一责任B已获完整新施工授权**：`F06_REAL_POST_HANDOFF_TRANSACTION_CANCEL_HTTP_PG16_01`、[Issue154](https://github.com/suzhe868-arch/mb/issues/154)，B从执行时最新main新建 `feat/f06-real-post-handoff-cancel-http-pg16-01`，先读[正式施工单](07_重建工作区/F06真实负责人移交后Transaction正常取消HTTP与PG16非生产纵切_A主控B正式施工单_2026-10-21.md)及[本轮A独立报告](07_重建工作区/F06真实Transaction负责人移交_A主控独立验收PR153合并与移交后取消正式放行报告_2026-10-21.md)。仅非生产合成PR139 Tx已合法签名PR153 Handoff后，由当前链尾Transaction responsible本人有独立permission/scope取消`in_progress→cancelled`，必须建立单独版本化签名Cancel侧车，不能伪造/改写冻结PR146旧Cancel或3B/4B及旧父。旧PR150 Refund对于本批新Cancel来源仍须FailClosed，不能宣称钱款退款链已联通。
- **新包强制门禁**：B仅新增`engineering/f06/post-handoff-cancel-http-pg16/**`及唯一`.github/workflows/f06-real-post-handoff-cancel-pg16-onejob.yml`，同末SHA官方单Job全量继承父**585**+新增真HTTP/PG16>=35 + TLS拒绝>=10共**>=630**全部通过，并保留161父表24迁移不同OID完整Seal与非超管PG16真实原子/权限/失败Rollback证据。B不自行PR/merge，达`READY_FOR_A_REVIEW`再交A。生产/真钱、完成成交、UAT/上线依然禁止，新增费用$0，F06/F07/F08/V1`NOT_READY`，C PR68仍独立Draft。

---

# 2026-10-20｜A主控最新：F06 Transaction侧Refund R1终验通过534/534并合并PR150；B接真实合成Transaction负责人Handoff

- **A最终独立验收通过**：`F06_REAL_TRANSACTION_REFUND_PENDING_CLOSED_HTTP_PG16_01`，[Issue #147](https://github.com/suzhe868-arch/mb/issues/147)已关闭；B受验最终HEAD `f774bc49407b7e2b8918347c03989b1b7230770d`，同SHA[官方Run #39436527215](https://github.com/suzhe868-arch/mb/actions/runs/39436527215) / Job118674868785父445+新真实PG16/HTTP79+TLS10 = **534/534**、0失败/跳过/取消；原161张冻结父表逐表COUNT/MD5、24迁移、不同OID78558→87832/独立审计OID39349全行Seal一致。上轮A发现的合法pending后3A原生正负Correction/Reversal导致closed误拒R1已经用不可变资金历史快照、原生3A签名事件增量时序及14条真实PG16新增用例整改，未知签或真实付款继续FailClosed。标准[PR #150](https://github.com/suzhe868-arch/mb/pull/150)已merge `cc2542a18ed8498ba549ff0f4cefd5e8beeedd8d`。
- **唯一新B任务已正式放行**：`F06_REAL_TRANSACTION_RESPONSIBLE_HANDOFF_HTTP_PG16_01`、[Issue #151](https://github.com/suzhe868-arch/mb/issues/151)，负责人`NEXT_OWNER=B`。B从**执行时最新main**新建 `feat/f06-real-transaction-handoff-http-pg16-01`，正式[中文施工单](07_重建工作区/F06真实Transaction负责人移交HTTP与PG16非生产纵切_A主控B正式施工单_2026-10-20.md)及[本轮A独立报告](07_重建工作区/F06真实Transaction侧Refund_A第二轮独立验收PR150合并与负责人移交放行报告_2026-10-20.md)。仅合成PR139真签`in_progress` Transaction正式负责人员handoff，保留原始签名、old/new/actor/time/reason、当前角色/独立permission+scope，新的版本化受限CI侧车；不能伪造旧4B来源或让不兼容旧Cancel/Refund接口假通过。
- **验收与安全门禁**：只新增`engineering/f06/transaction-handoff-http-pg16/**`及`.github/workflows/f06-real-transaction-handoff-pg16-onejob.yml`；最终B HEAD同SHA唯一官方Push单Job重跑父534+新PG16至少30+TLS10，总**>=574**全绿、161原父表/24迁移及跨OID全Seal一致。不得扩Product Final/权限、旧父签名、公DDL、真钱/生产Issuer、真实客户或完成成交；预算新增$0。B不得创建PR/合并，中文`READY_FOR_A_REVIEW`后交A。
- **总体边界**：旧3B直接入口/旧4B与真实PR139签源兼容问题未因PR150而修复；同Employee Session预先串行化不等于双方同时获取Vehicle锁。F06/F07/F08/V1持续`NOT_READY`，C PR68保持独立Draft不自动合并。

---

# 2026-10-20｜A主控首轮独立验收：F06 Transaction侧Refund同SHA520/520成功，但合法pending后签名资金修正会阻断无付款关闭，退B定向整改

- **任务与结论**：`F06_REAL_TRANSACTION_REFUND_PENDING_CLOSED_HTTP_PG16_01`，[Issue #147](https://github.com/suzhe868-arch/mb/issues/147)，B分支 `feat/f06-real-transaction-refund-http-pg16-01`，受验末HEAD `38135893fe7d0a4d3595bf4f70f592f1e9f1ba17`；[官方Run #39431126990](https://github.com/suzhe868-arch/mb/actions/runs/39431126990)/Job #118656156513同SHA、父445+新HTTP/PG16 65+TLS10=**520/520**真PG16全部通过；父161张逐表COUNT/MD5、24迁移、独立OID恢复与完整Seal一致、11文件均合法白名单。**但A独立源审未通过：`A_REVIEW_NOT_ACCEPTED / B_TARGETED_POST_PENDING_SIGNED_CORRECTION_REMEDIATION_REQUIRED / NO_BUSINESS_PR / NO_MERGE / NEXT_OWNER=B`。**
- **关键R1业务缺陷**：冻结原生3A `correctSyntheticDepositCI()` 经合法经理/店长 `deposit.ci.correct` 授权，允许已`released`原Lock追加真实签名Correction/Reversal；而新`refundCaseSource()`把Refund创建时历史`origin.source_deposit_digest`与**当前**全3A调整重算`src.depositDigest`强制一致。合法Transaction-side `pending`后新增原生已签Correction，即使零付款，`closeTransactionRefundCI()`也会误报`F06_TX_REFUND_CASE_SOURCE_DRIFT`并可能永久卡住无付款关闭、幂等及后续新申请。现有65个新用例缺“先pending、后原生签名Correction/Reversal、再closed”。
- **B完整定向整改单**：[A独立验收与后续合法签名Correction关闭阻断整改单](07_重建工作区/F06真实Transaction侧Refund_A主控首轮独立验收_合法pending后签名资金修正关闭阻断整改单_2026-10-20.md)，Issue [#147 A正式评论](https://github.com/suzhe868-arch/mb/issues/147#issuecomment-6292435088)。B只在原分支原11文件白名单内修复“申请时历史签名资金快照”与“其后合法已签追加修正”的版本验证，追加真实PG16正负Correction、完整Reversal至零、无付款closed、现时净余额再申请、原签不可变/幂等/伪签与付款FailClosed负例。原父445+原新65+TLS10不删弱，新最终SHA一个官方Run全部0失败/跳过/取消并完整161表Seal/OID复验后`READY_FOR_A_REVIEW`交A；B不自建PR/合并。
- **安全与整体状态**：旧3A/3B/3C1、PR139/PR146签名父与公共DDL禁止修改，不能直接删摘要校验或造假旧签；如无法合法实现报告`BLOCKED_SIGNED_TX_REFUND_POST_PENDING_CORRECTION_SOURCE`交A。不开放真退款、支付、`refunded`、完成交易`completed`或生产、UAT；F06/F07/F08/V1仍`NOT_READY`，预算新增$0，C PR68独立Draft。**最新main仍未合入本B业务分支。**

---

# 2026-10-20｜A主控现行：F06 Transaction Cancel PR146独立验收445/445完成；B接Transaction侧Refund pending/closed HTTP/PG16（仅非生产）

- **A独立验收、标准合并完成：** `F06_REAL_TRANSACTION_CANCEL_HTTP_PG16_01`，B受验HEAD `fa327ccece5efc1fe18d91558b1f7ff7d8a7299c`；官方Run `39415825663` / Job `118604456336` 单Push同SHA父392+Cancel43+TLS10=**445/445**全部真PG16成功、0失败/跳过/取消。原签四Schema161张逐表COUNT/MD5、24迁移、不同OID恢复及全Seal一致。旧冻结4A不认PR139新签名的真实拒绝已证，隔离新受限Cancel以同一PG事务维护cancelled/原件/Event/Key/Audit；无假3B签名或生产许可。标准[PR #146](https://github.com/suzhe868-arch/mb/pull/146) merge `6bba1f42ec1f9d11851a181b8ab28bbb44fcc900`；Issue #144已关闭。
- **唯一下一授权施工包：** `F06_REAL_TRANSACTION_REFUND_PENDING_CLOSED_HTTP_PG16_01`，`NEXT_OWNER=B`，[Issue #147](https://github.com/suzhe868-arch/mb/issues/147)，指定新分支 `feat/f06-real-transaction-refund-http-pg16-01`，B从实际执行时**最新main**开始。A完整[正式施工单](07_重建工作区/F06真实Transaction侧Refund待处理与无付款关闭HTTP与PG16非生产纵切_A主控B正式施工单_2026-10-20.md)、[本批A验收与下一任务放行报告](07_重建工作区/F06真实Transaction正常取消_A主控独立验收PR146合并与下一任务放行报告_2026-10-20.md)均已归档。只允许真正PR139+PR146签名的**已cancelled**合成Transaction，发起自身唯一Transaction-side pending Refund、无真钱closed；不能把原Lock侧Refund换绑、fake payment、跨车移金。B不得创建PR或合并main。
- **签名资金前置：** 原3A/3B/3C1、PR139、PR146真实来源及Deposit/Correction/退款余额、现时员工权限+scope必须同PG16事务锁序内验证，无法在新白名单合法签发即`BLOCKED_SIGNED_TRANSACTION_REFUND_SOURCE`报告A，禁止伪造旧3B/4A或改历史父。新增白名单仅 `engineering/f06/transaction-refund-http-pg16/**` 与 `.github/workflows/f06-real-transaction-refund-pg16-onejob.yml`；要求新最终SHA父445+至少40真实PG16/HTTP+10 TLS=**>=495**全部通过、原161表/24迁移与跨OID Seal一致，中文B交接 `READY_FOR_A_REVIEW`。
- **持续限制：** 旧F06-3B直接入口仍不可信；同Employee Session可能先锁串行化，不能冒充已验证双方同时持有Vehicle锁。真实`completed`、`refunded`、收付款/生产Issuer/线上路由、客户资料、UAT/部署均未授权。F06/F07/F08/V1仍**NOT_READY**；新增预算$0。C PR68独立Draft，不因B业务通过自动合并。

---

# 2026-10-20｜A主控现行：F06 Refund PR143独立验收392/392完成；B接Transaction Cancel签名来源兼容与HTTP/PG16

- **A终验通过并合并**：F06_REAL_REFUND_PENDING_CLOSED_HTTP_PG16_01，B受验HEAD `71af0d0d6c98062bc93dc391db8b3bb685ed82d2`，官方Run `39407777531`/Job `118577807940` 为准，旧319+Refund63+TLS10=**392/392**真PG16同SHA全部通过。父F06-3B/3C1验签、161张逐表COUNT/MD5与24迁移跨OID恢复、原SQL关闭注错回滚、车辆供应异常/周期结束后仍可无付款closed、同Key幂等均由A审查。标准业务[PR #143](https://github.com/suzhe868-arch/mb/pull/143)已合并，真实main merge `a1b2791e37a6f3ce82082882d74dcc7244df912f`；Issue #140完成。
- **下一唯一授权任务**：`F06_REAL_TRANSACTION_CANCEL_HTTP_PG16_01`，负责人**B**，正式[Issue #144](https://github.com/suzhe868-arch/mb/issues/144)，从开工时最新main新建 `feat/f06-real-transaction-cancel-http-pg16-01`。完整A施工单：`07_重建工作区/F06真实Transaction正常取消HTTP与PG16非生产纵切_A主控B正式施工单_2026-10-20.md`。
- **关键前置与安全阻断门禁**：冻结旧F06-4A/4C合成Cancel依赖 `f06_3b_ci.transaction_origins`，而已验PR139真实合成HTTP/PG16 Transaction使用 `f06_real_tx_ci.origins`，**不能伪造旧3B签名**。B需先核对真PG16/源签兼容性；若本白名单无法合法在同一事务签发新的Cancel，报 `BLOCKED_SIGNED_REAL_TRANSACTION_CANCEL_SOURCE`交A，不得扩大生产DDL/资金或修改旧父。目标仅合成 `in_progress→cancelled`，不能复活旧Lock/Waitlist/Priority、假重新上架，不能将取消冒充实际退款。
- **A业务边界**：旧F06-3B直接不安全入口仍有历史缺口；同Employee Session可能预先互斥，不能冒称真实两方同时持有Vehicle行锁。Transaction/Refund生产Issuer、真实支付/退款、成交完成、真实Customer资料及UAT部署完全未授权，F06/F07/F08/V1整体**NOT_READY**，新增预算$0。B完成真PG16同最终SHA父392+新增Cancel32+TLS9>=433、父Seal一致、中文交接后 `READY_FOR_A_REVIEW`交A，不建PR/合并main。

---

# A主控最新正式独立验收裁决｜2026-10-20：F06 Refund同SHA385/385通过但closed生命周期需要B定向整改

- 任务 F06_REAL_REFUND_PENDING_CLOSED_HTTP_PG16_01；Issue #140；下一责任B，仍用原分支 feat/f06-real-refund-pending-closed-http-pg16-01。
- 真实B HEAD e660879fbaec21fbb8b1168c9be408a6d59deab0；官方Push Run39400797756 / Job118554708402 completed/success、父319+新HTTP56+TLS10=385/385，0失败/跳过/取消；父161张已签表、24迁移及独立不同OID完整Seal通过。
- A发现新worker.mjs对已合法pending的无付款closed错误复用新申请状态Guard（Lock仍active/未过期、Vehicle仍可售、Cycle继续开放），可能使待退款关闭卡死；本HTTP closed路径的AFTER_CLOSE_THROW及AFTER_EVENT_THROW实际回滚验证缺席。由B仅在白名单新目录内修复守卫与补真PG16测试，不准修改旧F06父/公共DDL，不准生产真实资金或扩大权限。
- 正式结论 A_REVIEW_NOT_ACCEPTED / B_TARGETED_CLOSE_LIFECYCLE_REMEDIATION_REQUIRED / NO_BUSINESS_PR / NO_MERGE；中文整改单 07_重建工作区/F06真实Refund_HTTP_PG16_A主控首轮独立验收_已pending关闭生命周期定向整改单_2026-10-20.md；Issue #140评论6288407435。保留385项成功证据、原生父签数据，不重做旧F05/190父表争议。V1整体NOT_READY，新预算$0。

---

# 2026-10-20｜A主控正式现行状态：PR139真实Lock→Transaction通过独立验收；B接F06合成Refund pending/closed HTTP/PG16

- **F06 Transaction 本批A已验收合并：** B受验HEAD `20bb5333b3fb2b64fe9fde8f1e8ac6ba65ff182b`，官方[Run #39395616127](https://github.com/suzhe868-arch/mb/actions/runs/39395616127)/Job #118537844979 `completed/success`，父257+新Transaction53+TLS9=**319/319**，全0失败/跳过/取消；真实F06-3B/3C1原生签名来源、旧Lock签名pending Refund防转换、Refund↔Transaction不同PG后端受控竞争、闭合Refund验签与缺源FailClosed已复验；父161全表COUNT/MD5、24迁移与不同OID恢复完整Seal一致。A标准业务[PR #139](https://github.com/suzhe868-arch/mb/pull/139)合并，merge `7ebd75337d2bbf1bd37bd697fc58cb0c19888774`。原[Issue #136](https://github.com/suzhe868-arch/mb/issues/136)本批完成。
- **并发证据准确边界：** Refund与Transaction两个独立PG16 backend同时调度并最多一个有效提交，但`IsolatedAuth.withSession`可能先在同一负责员工的Session行串行化；**不宣称两个事务同时持有Vehicle行锁**。生产/跨主体授权前需单独加做更强车辆锁等待竞态探针，旧F06-3B直接入口`UPSTREAM_F06_3B_LOCK_PENDING_TRANSACTION_CONVERSION_GAP`仍不可信。
- **下一唯一施工包：** `F06_REAL_REFUND_PENDING_CLOSED_HTTP_PG16_01`，`NEXT_OWNER=B`、[Issue #140](https://github.com/suzhe868-arch/mb/issues/140)，从开工时最新main新建`feat/f06-real-refund-pending-closed-http-pg16-01`；[A正式B施工单](07_重建工作区/F06真实Refund申请pending与无付款关闭closed_HTTP与PG16非生产纵切_A主控B正式施工单_2026-10-20.md)；[PR139 A独立验收与后续放行报告](07_重建工作区/F06真实Lock到Transaction_A主控二轮独立验收PR139合并与Refund下一任务放行报告_2026-10-20.md)。
- **当前授权仅合成Lock侧Refund pending申请与无付款closed关闭，真实loopback HTTP+非超管PG16；** 禁止真实退款/付款、refunded、生产Transaction/Refund Issuer、交易完成/正式Source/线上DDL/UAT部署。当前F06/F07/F08与V1整体依然`NOT_READY`，C PR68继续Draft无用户视觉通过，新增付费预算$0。B不得自建PR或合并，按单一次施工到`READY_FOR_A_REVIEW`后交A。

---

> 以下为历史状态与已完成工作归档。A以本段及现行Project State为当前正式任务依据。

# 2026-10-20｜A主控首轮独立复验：F06 Transaction同SHA309/309全绿，但签名Refund来源与双后端竞态待整改

- **唯一当前任务：** `F06_REAL_LOCK_TO_TRANSACTION_HTTP_PG16_01`，`NEXT_OWNER=B`，保持原B分支 `feat/f06-real-lock-transaction-http-pg16-01` 和 [Issue #136](https://github.com/suzhe868-arch/mb/issues/136)，B不要创建PR/合并main。
- **已核真实官方成功证据：** B HEAD `c4dbb48a5e602076298fba47d133fd43cec504f3`，最终 [Run #39391407455](https://github.com/suzhe868-arch/mb/actions/runs/39391407455)/Job #118523549413同SHA `completed/success`，父257+新43+TLS9=**309/309**，0失败/跳过/取消；父161表Manifest/24迁移/不同物理OID恢复全Seal真实通过，Workflow触发预检340项，Push1/PR0；9个文件全部落白名单。
- **A独立代码审查未通过：** 新脚本未建立或验签F06-3C1合法退款来源，`service.mjs`的退款无行时可在`f06_3c1_ci`缺席下放行；测试#33只是手工插入无原生签名的public pending，不等于合法Refund。测试#22仅Transaction↔Transaction竞争，缺签名Refund先/Transaction先/双PG后端同时争用三组强制正反用例。本批不准因CI全绿直接merge。
- **正式定向整改单：** [F06 Transaction首轮A独立复验及Refund签名源/双Backend竞态整改](07_重建工作区/F06真实Lock转Transaction_A主控首轮独立复验_退款签名来源与双后端竞态定向整改单_2026-10-20.md)；Issue [#136 A正式评论](https://github.com/suzhe868-arch/mb/issues/136#issuecomment-6286709536)。B只修本批新路径、保持原257与43+9，再追加真正受限签名Refund源与合法双Backend PG16竞争/零半写证据；若无法建立可信父源报`BLOCKED_TRUSTED_REFUND_SOURCE`交A，不得假签。
- **状态：** `A_REVIEW_NOT_ACCEPTED / B_TARGETED_REMEDIATION_REQUIRED / NOT_READY_FOR_A_REVIEW / NO_TRANSACTION_PR / NO_MERGE`。不重做已成功父161/早期Priority工作，不改旧3B/3C1/5B签名父源或公共DDL，不触真实支付/退款/生产Transaction。F06/F07/F08/V1仍`NOT_READY`，新增付费预算$0。

---

> 以下为历史状态与旧施工授权说明；本段本次独立验收结论优先，直至B真实补齐后A复验。

# 2026-10-20｜A主控最新正式状态：PR135真实Deposit通过独立验收合并；B执行Lock→Transaction非生产原子转换

- **前置正式main：** `ffcf9d8609fc9972a0a8780012ddbc52f85cc221`（PR #135标准合并）；B施工以**执行时最新main**为准，旧SHA仅用于追溯。
- **已完成并合并：** F06真实Deposit台账HTTP/PG16，受验 B HEAD `8598df31d71ed3d9e2e13dcdc962002b152f152a`，官方 [Run #39379307863](https://github.com/suzhe868-arch/mb/actions/runs/39379307863)/[Job #118484492475](https://github.com/suzhe868-arch/mb/actions/runs/39379307863/job/118484492475) completed/success，九组**257/257**真测且0失败/跳过/取消。161张已签父表独立逐表COUNT/MD5、24迁移、真实不同OID恢复一致；可信F05 Priority来源恢复真PG16全绿。A [PR #135](https://github.com/suzhe868-arch/mb/pull/135)标准merge `ffcf9d8609fc9972a0a8780012ddbc52f85cc221`。
- **下一唯一主任务：** `F06_REAL_LOCK_TO_TRANSACTION_HTTP_PG16_01`，`NEXT_OWNER=B`，新指定分支 `feat/f06-real-lock-transaction-http-pg16-01`；[Issue #136](https://github.com/suzhe868-arch/mb/issues/136)；[正式B施工单](07_重建工作区/F06真实Lock转换Transaction原子占用HTTP与PG16非生产纵切_A主控B正式施工单_2026-10-20.md)。
- **A报告：** [PR135 A独立验收与下一施工放行](07_重建工作区/F06真实Deposit_HTTP_PG16_A主控独立验收PR135标准合并与下一施工放行报告_2026-10-20.md)。旧F06-3B直接Lock→Transaction转换仍有pending Refund安全缺口，不能当可信生产入口。下批只进行真实非生产合成Transaction HTTP/PG16原子转换，不修改旧父服务/DDL，需同事务封堵旧Lock pending Refund，严禁真钱/真实Transaction Issuer。
- **限制：** F06/F07/F08与V1整体依然`NOT_READY`，正式Source未签、真实支付/退款/生产UAT/部署无授权；新增付费预算$0。C PR68仍Draft未获视觉确认。

---

> 其下为历史状态、旧指针与保留的技术证据；不覆盖本段正式下一动作。

# 2026-10-20｜A主控新裁决：F06 Deposit 父表 Seal 计数勘误，B继续整改（未验收）

- **唯一正式任务：** `F06_REAL_DEPOSIT_LEDGER_HTTP_PG16_01`，`NEXT_OWNER=B`，原分支 `feat/f06-real-deposit-ledger-http-pg16-01`，Issue [#132](https://github.com/suzhe868-arch/mb/issues/132)。
- **A技术裁决：** 官方同SHA F06-3A已验签父层为四个Schema的 **161张完整物理表**（F06-2上一阶段158张），原单“190张”无已验证来源；必须用原生父 Seal 的完整表名清单、逐表COUNT/MD5、24条Ledger、Public Catalog及D1/F06-1/F06-2 attestation逐一比对，两套不同OID数据库及恢复一致性全部通过。**不是删减任何真实父表**，如父集合漂移立即停工报A。
- **B必须修复：** 官方Run [#39366833724](https://github.com/suzhe868-arch/mb/actions/runs/39366833724) **failure**：旧LockRequest PG16第一项报 `original authorized F05 Priority source must survive signed v26`；不得伪造原 Priority 来源或略过真库回归。本批 `disposable-db.sh` 参数展开存在 `§{1:-}` 误写，需修为 Bash 正确格式。新Deposit 38项和TLS9项尚未获得同SHA成功证明。
- **正式裁决文件：** [F06 Deposit 父表Seal数量与Priority前置 A主控技术裁决](07_重建工作区/F06真实Deposit父表Seal数量与Priority前置_A主控技术裁决_2026-10-20.md)；本条仅替换原施工单“恰好190张”计数硬断言，其余白名单、测试、同SHA与非生产资金限制不变。
- **当前判定：** `A_RULING_COMPLETE / B_REMEDIATION_REQUIRED / NOT_READY_FOR_A_REVIEW / NO_DEPOSIT_PR / NO_MERGE`。B最新受阅HEAD `9d93ff4317379b3e8f91532e2e352adf4ae18cf4`；误建PR #133已关闭未合并。B在原分支从最新main继续，全部测试0失败/跳过/取消后交A验收；不自动启动F07/F08/C PR68，不接真实资金/支付/退款/生产。
- **V1与生产：** `NOT_READY`；新增付费预算$0。

---

> 以下为此前已有效的状态与历史记录；本段 A 技术裁决优先用于当前 Deposit 施工。

# 2026-10-20｜A主控当前正式状态：F06生命周期已验收合并；B执行Deposit HTTP/PG16非生产纵切

- **唯一状态来源：** GitHub 最新 `main`。本次核验的前置main为 `adc1cf31d1833cd1a85973865e4f571be7f1140a`；PR #131业务合并SHA为 `3f8a92d59a658fd486c43c31cebd4c01a03b4421`。B开工时必须重新读取并基于当时最新main建分支，不能固定checkout历史SHA。
- **已完成：** F06普通Lock生命周期R1/R2经A独立验收，PR [#131](https://github.com/suzhe868-arch/mb/pull/131)标准合并；Issue #130已关闭。合法handoff正向PG16 fixture缺失仍是明确限制，未宣称真实正向端到端已通过。
- **下一唯一任务：** `F06_REAL_DEPOSIT_LEDGER_HTTP_PG16_01`；**下一责任窗口：B**；指定分支名：`feat/f06-real-deposit-ledger-http-pg16-01`；[Issue #132](https://github.com/suzhe868-arch/mb/issues/132)；正式施工单：`07_重建工作区/F06真实Deposit台账HTTP与PG16非生产纵切_A主控B正式施工单_2026-10-20.md`。
- **测试证据：** B最终HEAD `ee3dd1c08b32ea55971a56732098c52cdff1ade1` 对应官方Run #39306159971/Job #118243671999；原Node54/54、生命周期Node37/37、原F06 PG16/HTTP21/21、生命周期PG16/HTTP36/36、F05初始化18/18通过；PR自然触发10个工作流、28/28 Jobs成功，失败/跳过/取消均0。28个临时工件约2.91 MiB、30天保留期。
- **F06-5B状态已纠正：** PR #61已由A验收并合并；但它仅是CI-only守卫，旧F06-3B直接入口仍不可信，阻断 `UPSTREAM_F06_3B_LOCK_PENDING_TRANSACTION_CONVERSION_GAP` 保留。
- **本轮A状态治理：** 已修正此前PROJECT_STATE顶层仍指向第二轮R1整改的陈旧状态，当前正式指针转为Deposit HTTP/PG16任务。工作单放行时业务合并基线为 `3f8a92d59a658fd486c43c31cebd4c01a03b4421`，上轮治理提交为 `adc1cf31d1833cd1a85973865e4f571be7f1140a`；B必须再读取最新main后开工。
- **硬边界：** 仅合成Deposit事实的非生产真实HTTP+非特权PG16；不接真实支付/收款/退款，不创建真实Transaction，不开放生产Issuer/路由，不改旧F06服务、公共DDL/M94或PDM Final。单免费Runner、单PG16服务、精确push/paths、无Artifact上传，新增付费预算 `$0`。
- **总体状态：** F06/F07/F08及V1整体仍 `NOT_READY`；正式Source未签署，真实资金/退款、UAT和生产部署均未授权。

---

> 以下为历史状态记录；历史事实保留，但不覆盖本段当前指针。


---

> 以下为历史状态记录；保留原始裁决事实，但不代表当前NEXT_ACTION。

---

# 历史裁决｜2026-10-20 A主控第二轮独立复验（已被PR #131最终验收取代）

- **当前正式状态：** `A_CHANGES_REQUESTED_R1_CHAIN_TAIL_FAST_PATH / B_NOT_READY_FOR_ACCEPTANCE / NO_PR_YET / NEXT_OWNER=B`。
- **B分支与最终报告HEAD：** `feat/f06-real-lock-lifecycle-http-pg16-02`；`95cdca9fe37e53702e9e5758252a33c052422d1b`。B已普通合并A上一轮main治理提交，无强推/重置；本轮审查时ahead 13 / behind 0。
- **报告HEAD同SHA官方证据：** [Run #39302755405](https://github.com/suzhe868-arch/mb/actions/runs/39302755405)，唯一[Job #118231919969](https://github.com/suzhe868-arch/mb/actions/runs/39302755405/job/118231919969)，均completed/success。原Node54/54、生命周期Node32/32、原PG16 HTTP21/21、生命周期PG16 HTTP36/36、F05初始化18/18全绿，0失败/跳过/取消；原24条F03/F05迁移账本摘要一致。
- **R2已独立通过：** finance proof adapter与financeGuard均检查Refund carrier、相关Refund事实、查询异常，并将`observedRefund=false`纳入absence证据摘要；L34-L36真实PG16/HTTP测试通过。
- **R1仍阻断：** `verifyResponsibleHandover()`在检查receipt carrier/历史链之前先执行`if(initial===current)return {ok:true}`。如果历史handoff链为A→B但Lock当前responsible被异常改回A，就会跳过receipt链尾校验并放行；链尾B与当前Lock A不一致必须Fail Closed。详见[Issue #130](https://github.com/suzhe868-arch/mb/issues/130)与[A主控第二轮独立复验报告](07_重建工作区/F06普通Lock生命周期_A主控第二轮独立复验报告_2026-10-20.md)。
- **下一动作：** B修复R1链尾快路径：carrier存在时先读该Lock全部receipt；无receipt才可在初始责任人等于当前值时走正常路径；有receipt则无论当前值是否等于初始快照都验证完整receipt/audit/batch/item链、old→new连续性及链尾等于当前responsible。增加纯验证器/单元负例（不伪造真实PG16 receipt），保留L33真实PG16三动作硬拒绝/零写入；之后同步最新main并重跑全量同SHA门禁，再交A。**不创建PR、不合并main。**
- **生产边界：** 正式Source未签署、`production_ready=false`；真实资金/退款及生产部署仍未授权，新增付费预算`$0`。F07/F08与C PR68不因本轮而启动或合并。

---

# 2026-10-19｜A主控最新裁决：F06 B分支已审阅，真PG16仍为0/20；放行单Job免费验收，暂不合并

- **本轮审查对象**：[Issue #128](https://github.com/suzhe868-arch/mb/issues/128)，指定B分支 `feat/f06-real-lockrequest-http-pg16-01`，审核时远程HEAD `fb2c43f5600ae1a652731ed5e2d14621d12e6086`；与main比 ahead48/behind0，共19个变更文件，未触碰冻结工作流、旧F06签封、PDM Final或生产。
- **当前真实验收结论**：B提交真实Node HTTP/PG16锁车纵切源码与20个真库集成测试；本地工作副本自报Node 54/54 PASS，**不等于受验HEAD同SHA远程成功**。PG16/HTTP真库 **0/20实际运行**，B明确`NOT_READY_FOR_A_REVIEW`；因此A不批准最终验收、PR或合并。
- **A自主技术裁决**：GitHub公开仓库标准托管Runner免费，限定B原分支可新增**一份非冻结、仅精确分支push+paths过滤的F06单Job工作流**；使用1个标准`ubuntu-24.04`Job、1个`postgres:16-alpine`服务容器、Node22、45分钟上限，不用付费Runner、Artifact上传、生产Secrets或额外存储，新增付费预算维持$0。B须在首次Push前证明不会触发其它工作流及旧F05 28 Job扇出；禁止skip-ci、PR触发或改冻结文件。
- **不可省略的前置**：从受验真实工程代码合法重建F03 **24条迁移台账**及F05完整实体来源，不得伪造旧push/Issuer或补写假签封，必须在独立`f06_lock_test`与非特权`f06_lock_ci`环境运行。同一业务SHA至少54项Node和20项真实PG16/HTTP测试均无失败/跳过/取消；若可信完整基线不能重建，则准确报`BLOCKED_TRUSTED_M94_F05_BASELINE`并保存日志，不可降低Readiness。
- **当前负责人仍是B**：`NEXT_OWNER=B / NEXT_TASK=F06_REAL_LOCKREQUEST_APPROVAL_WAITLIST_HTTP_PG16_01 / NEXT_BRANCH=feat/f06-real-lockrequest-http-pg16-01`，状态`A_RELEASED_FOR_B_BOUNDED_FREE_CI_VERIFICATION / BLOCKED_PG16_RUNTIME / NO_MERGE`。B继续实际真库测试、缺陷整改、完整回归、证据归档；满足`READY_FOR_A_REVIEW`后再交A独立验收、由A决定安全PR出口。
- **F05历史/生产仍保持原值**：PR #125非生产业务560/560通过，PR #127旧Source事件校验整改已合并。PR #125历史5个旧Source失败及原66项65通过+1旧Oracle例外均不可改写；`formal_source_signed=false`、`production_ready=false`，不启动真实支付、微信身份或生产部署。C PR #68仍独立Draft，F07/F08主线后移。

完整A正式施工裁决：[F06正式施工单追加的2026-10-19技术裁决](07_重建工作区/F06_真实锁车申请审批唯一Lock与自动候补_首条业务API纵切_A主控B正式施工单_2026-10-18.md)；[Issue #128 A裁决评论](https://github.com/suzhe868-arch/mb/issues/128#issuecomment-6268113660)。

# 2026-10-19｜主线最新状态：F05五项Source门禁整改已合并，F06真实锁车业务纵切正式交B

- **F05非生产业务交付**：PR #125 已合并，merge SHA `25034a7cd9e3d977e18ffb7f5dc0ba8db1008064`。业务 SHA `f7503843a60bef3f94b818d80a37ec166a157775` 与证据 HEAD `d5690899ff37d3b7ddc46b1640dd113309addecf` 的官方回归均为 560/560 通过、失败 0、跳过 0。
- **五项旧Source门禁专项整改已完成并合并**：PR [#127](https://github.com/suzhe868-arch/mb/pull/127)，最终 B HEAD `6890bd9cc80d4fc556cbe0b4e94a240b1eb6c25b`，merge SHA `fcbcef31d037530f78f4c15f94d20acdc7292c2c`。10 个关联 PR 工作流共 28/28 Jobs 成功；五个目标 Source Job 的事件契约测试各 25/25 通过、失败 0、跳过 0。A 已独立核验代码、原生日志与 HTTPS 工件摘要。
- **当前责任：B**。任务 `F06_REAL_LOCKREQUEST_APPROVAL_WAITLIST_HTTP_PG16_01`，指定分支 `feat/f06-real-lockrequest-http-pg16-01`。A 已重新复核 F06 现有 CI-only 服务、固定旧迁移封印及应用路由缺口，并正式恢复真实 Node HTTP + 隔离 PG16 锁车申请/审批/唯一 Lock/自动候补纵切。
- **执行边界**：B 首次远程提交前只核对本批精确路径的 workflow 触发风险；不改冻结 Workflow、不重跑旧 66 项、不触发无关 F05 旧门禁扇出、不新增付费预算（$0）。
- **历史与验收边界**：PR #125 历史 5 成功、5 失败保持原始事实；旧 66 项仍为 65 项真实通过 + 1 项旧 Oracle `BLOCKED_EQUIVALENCE`，不能改写为 66/66。
- **生产状态未变**：`formal_source_signed=false`、`production_ready=false`。正式微信/F03/JYT/4S/名邦 Source Issuer、完整 M94 迁移链、生产调度/观测/容量及 C/E 生产联调仍未完成。C PR #68 仍为独立 Draft。

正式 A 验收报告：[PR127_A主控F05五项Source事件感知整改独立验收与合并报告_2026-10-19.md](07_重建工作区/PR127_A主控F05五项Source事件感知整改独立验收与合并报告_2026-10-19.md)

---

# 2026-10-18｜A主控纠正F05验收口径：真实功能整改优先，F06转暂缓

- 用户已明确同意“先修正F05，完成真实功能与有效验证后再继续F06”。截至最新`main`，F05-1～11各`f05_*_gate`多数是隔离CI候选，A此前的PR120只是旧65/66加1例外的非生产CI阶段退出，不是生产/真实HTTP功能完整验收。
- **正式任务**：`NEXT_OWNER=B`，`NEXT_TASK=F05_REAL_DELIVERY_AND_TRUSTWORTHY_ACCEPTANCE_CLOSEOUT_01`，工作分支`feat/f05-real-delivery-acceptance-closeout-01`；A[完整B施工单](07_重建工作区/F05真实业务交付与有效验收彻底整改_A主控B正式施工单_2026-10-18.md)已放行。B须核对PDM及已合并代码，一次性补全F05 Vehicle/来源/收藏/价格/找车/匹配/Priority/推荐/咨询关联的真实Node HTTP＋隔离PG16可运行纵切和权限负例，提交可复核的HEAD/PR/测试报告。
- [PR121](https://github.com/suzhe868-arch/mb/pull/121)原F06业务施工授权**保持历史不撤销，但当前主线暂停、未验收不计完成**；排队B_APP_01可复用到F05真实车辆列表/详情，F07/F08后移。F05旧66为65真实Pass+1旧Oracle BLOCKED，PR113 23成功5旧Source失败；原记录不变，不能用旧例外冒充新业务验收。5正式Source继续拒绝，生产`NOT_READY`，Actions付费`$0`。
- 当前仅A签施工与改状态：**B尚未完成本新任务，A尚未对其真实接口验收**。C PR68继续独立Draft，无客户视觉最终通过。

---

# 2026-10-18｜F06开始真正锁车业务接口纵切施工（不是CI来源签名工程）

- F05历史两组旧来源校验红灯已由[A PR120](https://github.com/suzhe868-arch/mb/pull/120)判为同一旧Push来源条件不适用于新PR，**仅F05非生产CI功能范围按65真通过＋1旧Oracle例外受限收口**；旧66/66和PR113 28/28绝不虚报。V1生产及五Source未签，真实权限安全继续必须通过。
- **新的主线任务`NEXT_OWNER=B / NEXT_TASK=F06_REAL_LOCKREQUEST_APPROVAL_WAITLIST_HTTP_PG16_01`**，A签[完整F06真实业务施工单](07_重建工作区/F06_真实锁车申请审批唯一Lock与自动候补_首条业务API纵切_A主控B正式施工单_2026-10-18.md)。只做**Node实际HTTP + PG16事务**首条纵切：锁车申请6h PENDING，名邦合法员工审批/拒绝，正式Lock单车唯一+72h，其他有效PENDING自动候补，真实身份/Scope/竞态/幂等/回滚和客户安全投影正反例。正式Customer身份未接入时拒绝真实请求，测试身份仅非生产；不做真钱/生产/支付。
- 已有F06-1～5C为CI-only，不等于可运行正式端点；旧冻结工作流与签署器不再作为业务开发前置。B用隔离分支`feat/f06-real-lockrequest-http-pg16-01`，优先本地PG16真测，$0预算不变。之前B_APP_01车辆目录只读单保留排队，后续F07、F08按顺序推进。C PR68依然Draft。

---

# 2026-10-18｜F05两类旧Source检查同根因裁决：非生产CI业务阶段按真实65项与1项历史例外收口，顺序转F06

- [A正式裁决](07_重建工作区/F05最后两组旧来源红灯_业务验收边界与F06顺序_A最终技术裁决_2026-10-18.md)：旧66项中**65项真实完成、1项原Source Oracle BLOCKED_EQUIVALENCE**；PR113原28 Check **23成功、5项旧同SHA push证明失败**。这是旧`push`签署条件不适用于新`pull_request`分支的同一根因，不是六个新业务缺陷。失败记录及SHA原封保留，**绝不能宣称66/66全绿或五正式Source获签**。
- **本阶段仅`F05_CI_ONLY_FUNCTIONAL_SCOPE_ACCEPTED_WITH_LEGACY_SOURCE_EXCEPTION`**；不再要求B反复做DVD/WORM、Sigstore、密钥、旧66重跑。用户Actions$0预算、原仓库不变；真实角色权限、价格隐私、安全及生产/支付/外部接口门禁全部保留，V1`NOT_READY`。
- **按用户最新顺序NEXT_OWNER=A，NEXT_TASK=`F06_A_REVIEW_EXISTING_LOCK_WAITLIST_CI_AND_REAL_DELIVERY_GAPS_01`**：先审F06已有隔离CI与真实LockRequest申请/审批/Lock/Waitlist接口缺口，再正式派B开发；F07、F08随后。前次`B_APP_01`任务**暂缓排队而非删除**，不允许抢跑当前F06前置；C PR68维持Draft和用户原视觉否决。

---

# 2026-10-18｜用户要求停止无业务价值的签署/归档循环，A正式恢复真实车辆业务接口开发

- **正式业务优先**：B下一个任务`B_APP_01_REAL_PG16_CATALOG_LIST_DETAIL_READONLY_01`，按[真实PG16车辆列表/详情只读施工单](07_重建工作区/B_APP_01_车辆列表详情真实只读接口与C01联调契约_A主控正式施工单_2026-10-18.md)完成运行于隔离Node HTTP＋PG16的客户安全车辆列表与详情DTO，输出可供C01联调的真实服务，不接受仅Mock、工作流审计报告或签名样板。
- **C并行**：原[PR68](https://github.com/suzhe868-arch/mb/pull/68)继续R3首页详情真实界面返工，执行已放行47行R3+R1/R2，不因B后端推进就谎称用户已认可页面；C仍归C，B不改其分支。
- **F05历史事实与适用边界**：旧真实65/66业务成功、1项旧Source Oracle`BLOCKED_EQUIVALENCE`，PR113同HEAD的28 Checks 23成功5旧Source失败。签名、离线密钥、WORM/DVD、第二账号**不再作为非生产业务功能开发前置**；历史不能写66/66或Source签署成功，真正生产放行、客户权限和数据安全门禁仍有效。
- **现状**：正式`main`只有F01健康/隔离身份基础，F04动作合同还是`/__ci__`候选，F06/07/08主要是隔离CI验收，不代表全部真实API/资金可上线。当前B首要工作是真正交付一条端到端读取纵切，成本零新增付费，C页面同步改进；以真实功能为终态，不再增加无必要的工程证明任务。
- 新`NEXT_OWNER=B`；C为并行任务；默认用户GitHub预算$0，生产`NOT_READY`。

---

# 2026-10-18｜A主控单GitHub账号独立离线签署方案已裁定（不更换账号/仓库，不开正式Source）

- 用户已同意继续用`suzhe868-arch/mb`及现有单GitHub账号，**不需第二GitHub账号、不开付费**。A裁定**工程域=现有GitHub**、**签署域=用户掌控的仓库外Ed25519私钥与受信离线校验器**。独立技术控制域不等于双人审核，不能用`Prevent self-review`假设同一执行者能批准自己的作业；更不能关闭该规则后谎称两人审签已满足。 [单账号正式裁决](07_重建工作区/F05-7_V2单GitHub账号离线双域签署及证据保全_A主控技术裁决_2026-10-18.md)。
- 正式`main`前基线`26d519e56f0d5cced7cf47365152d960eeaaf46d`；B [PR116](https://github.com/suzhe868-arch/mb/pull/116)离线影子工程、A [PR117](https://github.com/suzhe868-arch/mb/pull/117)均已受限合并。PR113的旧正式Source检查23/28通过、5真实失败；旧Run39035485532真实65/66业务通过+1旧Oracle`BLOCKED_EQUIVALENCE`。五正式Source始终`SOURCE_GAP_OPEN/FAIL_CLOSED`，V1/生产`NOT_READY`。
- **真实设备/账号实证仍未完成**：用户受控私钥及仓库外指纹`NOT_PROVISIONED`、四原ZIP非公开不可变/可恢复WORM`NOT_VERIFIED`、A外部耐久撤销/nonce和独立REST真核`NOT_VERIFIED`、单人替代双人审批的正式安全等价裁决`NOT_DECIDED`。普通U盘或临时ZIP副本不能冒充WORM；公开GitHub Release不得上传日志原件。
- **`NEXT_OWNER=A / NEXT_TASK=F05_7_V2_A_SINGLE_ACCOUNT_OFFLINE_SIGNER_AND_PRIVATE_ARCHIVE_GATES_01`**。先把单账号离线签署与真实私有归档步骤在A闭环到可核证条件，再考虑放行B正式签名接入/五消费者迁移；目前不重复旧66、不修改旧8冻结Workflow或原Source，不另创建付费CI。C PR68独立。

---

# 2026-10-18｜PR116 B独立签署影子门禁已由A真实离线验收并受限合并，下一责任A

- [B PR116](https://github.com/suzhe868-arch/mb/pull/116)仅7份`audit/f05-v2-source-shadow-trust/**`隔离非生产影子候选，B唯一HEAD`08b1d6b1a980eb5191b9061960274069693e1dbd`，A正式受限合并`main@d8b4d97487a5b656ae2f67e880f665096ada6d11`；没有改旧八Workflow、五正式Source、原业务、数据库或生产。[A独立审签](https://github.com/suzhe868-arch/mb/pull/116#issuecomment-6239025577)。
- A独立从7份Git Blob与B原交接ZIP逐字节核对**7/7**，用真四官方旧ZIP**Python5/5、Node52/52均通过，0跳过**；五消费者影子全部拒绝。335工作流GitHub官方索引与B静态机器清册**335/335 SHA一致**，7精确路径0静态触发、真实HEAD 0远程Runs/Checks；**无新远程CI不能称官方CI全绿**。去敏manifest根`034418349b767fd966371f7f9c0c0cb4a18385d51f32ecc6c41483656fded438`经A真ZIP独立重算一致。
- 历史PR113官方28 Check终态**23成功5旧Source失败**，原真业务仍**65/66成功+1旧Oracle BLOCKED_EQUIVALENCE**。无真实A独立审核人/受保护签署环境、私有WORM四ZIP归档、持久撤销nonce账本、独立官方REST全链路审计，故五正式Source`SOURCE_GAP_OPEN/FAIL_CLOSED`、V1`NOT_READY`、预算`$0`不变。
- **新责任`NEXT_OWNER=A / NEXT_TASK=F05_7_V2_A_INDEPENDENT_REVIEWER_PRIVATE_ARCHIVE_GO_NO_GO_01`**：A先做真实账户级签署身份与非公开不可变原始证据仓`GO/NO-GO`。没有独立真人身份或零付费安全保全渠道就保留阻断，不能再命令B假签发；仅条件具备后授权B新的正式Source迁移。 [A中文报告](07_重建工作区/PR116_A主控五来源影子安全门禁受限验收与可信身份归档下一门禁_2026-10-18.md)。C PR68继续独立。

---

# 2026-10-18｜A可信来源零费用技术裁决完成，B新离线影子工程正式放行

- 最新正式旧PR113独立CI **28项终态＝23成功/5失败**；旧来源签约5项真实Fail Closed，旧PR111历史65/66+1旧Oracle BLOCKED不变。PR113/PR114此前已受限工程归档，五正式Source和生产仍关闭。
- A独立核实公开GitHub Free可使用官方Sigstore Artifact Attestations和受保护Environment Required Reviewers/Prevent self-review，但当前**无实际证据证明独立审阅身份、受保护Workflow及非公开不可变四ZIP保管已配置**；Sigstore签的只是新审核来源，不能倒签历史成功，也不能把原始日志发布到公开Release。[A正式架构裁决](07_重建工作区/F05-7_V2_A零付费独立签署与私有证据归档技术裁决_2026-10-18.md)。
- **当前`NEXT_OWNER=B`，任务`F05_7_V2_INDEPENDENT_SIGNER_SHADOW_AND_FIVE_CONSUMER_NEGATIVES_01`，完整[施工单](07_重建工作区/F05-7_V2独立签署影子验证与五来源负例_A主控B正式施工单_2026-10-18.md)**：只在隔离目录开展离线的V2可信签署影子Gate、五正式Source的模拟拒绝和攻击负例，默认**不批准任何远程CI/工件/真正签署/生产**。B仅在最新main全量工作流逐原Blob验证精确路径0触发时才允许一次受控分支/PR，否则交A阻断，不触碰用户$0预算。A账户的真实独立签署、私有WORM保管审批职责仍独立。
- 旧ref严禁Push、旧66不重跑、Source`SOURCE_GAP_OPEN/FAIL_CLOSED`、V1`NOT_READY`，C PR68独立Draft。

---

# 2026-10-18｜A受限验收PR113已正常合并：V2独立验真候选代码入main，旧来源仍Fail Closed；下一责任A

- **B [PR113](https://github.com/suzhe868-arch/mb/pull/113) 已由A仅按非生产工程受限验收并标准合并**：候选唯一HEAD `6ad823936592835c4ce8b34f06ed88aa5942e777`，合并`main@652316eaad06d5adea961f19036e8f69d4107a89`；只新增10份`engineering/f05/v2-attestation-gate/**`独立验真/加密门禁候选与测试、中文报告，原8冻结Workflow、旧父签、五正式Source、业务/DDL/生产/C前端未改。[A受限审签](https://github.com/suzhe868-arch/mb/pull/113#issuecomment-6237802666)。
- **本PR真实官方CI不是全绿**：唯一末SHA自动触发10份原PR Workflow、28项Check；合并前A真实快照**23成功、4失败、1进行中**，红灯均由旧Source对同SHA冻结`push`身份的硬验证要求拒绝，不能用候选PR冒充正式来源。F05-8剩余结果需另行查终态，不能预写通过。A离线真实四ZIP重算原正文**931/931**、Python先前包**13/13**、Node**25/25**；B自验的新版本Python**17/17**不等于A已在新SHA独立实跑17条。旧Run真实原业务**65/66通过＋旧Oracle1项BLOCKED**，不能写成66/66正式签约。
- **正式签署仍绝对关闭**：`FORMAL_ISSUER_NOT_SIGNED / SOURCE_GAP_OPEN / FAIL_CLOSED`；缺受控A签名者、受保护独立REST验证身份、四真实官方ZIP长期不可变归档、五消费者受控迁移及旧Oracle安全等价裁决。原旧来源ref禁止Push，V1/生产`NOT_READY`。现公开仓库可真实启动标准Runner，但用户Actions费用限制维持**$0、不授权新增付费**。
- **新的当前责任和任务**：`NEXT_OWNER=A / NEXT_TASK=F05_7_V2_A_INDEPENDENT_SIGNER_ARCHIVE_AND_SOURCE_MIGRATION_DECISION_01`，先解决A身份、免费可信归档、Sigstore/Artifact Attestations可行性及五消费者准入，再决定是否向B签下一阶段施工单；**不得让B重跑既有65项业务或重复335项工作流扫描**。C [PR68](https://github.com/suzhe868-arch/mb/pull/68)继续独立Draft，不因本次工程归档放行视觉/功能。
- [本轮正式A报告](07_重建工作区/PR113_A主控V2官方只读候选受限合并与后续可信签署治理裁决_2026-10-18.md)；[Issue106最新A连续裁决](https://github.com/suzhe868-arch/mb/issues/106#issuecomment-6236810312)。

---

# 2026-10-17｜A对B PR111独立受限验收：65/66同SHA真原业务＋新版V2来源候选合入main，旧Source签发仍关闭；正式放行官方只读取证与可信签署治理B单（最新）

- **B [PR111](https://github.com/suzhe868-arch/mb/pull/111) 已独立审查并按限域正常合并**：原唯一受验HEAD`bdffc492df7dc09d9192d3ac485d598df7a8c040`，对上一main ahead1/behind0，10项严格新`engineering/f05/v2-issuer-candidate/**`及新独立CI，无冻结8旧workflow/旧Source/Issuer、业务/DDL/PDM/C/生产修改。merge `main@996d032252535cda8487b4c25e62ae3c72f39a3a`，按[A独立PR审签](https://github.com/suzhe868-arch/mb/pull/111#issuecomment-6234593834)只批准`A_ACCEPTED_ENGINEERING_CANDIDATE_ONLY`，不是正式来源签发。
- **真实GitHub [Run39035485532](https://github.com/suzhe868-arch/mb/actions/runs/39035485532)**：本HEAD`push/attempt1/completed/failure`，四个标准Ubuntu分片**3成功/1失败**，原66 job中**63个PG16+2个原NonPG＝65项实际完整原业务成功**、旧`match-source`原2条Shell只跑成第一条，旧7Workflow64 Job同SHA Oracle无等价实现所以Fail Closed。原PR104历史2 job确在本新HEAD重新完整实跑，不能用过去SHA伪造。
- **A实际独立下载四官方ZIP并对外/内SHA及manifest 931/931原文件逐个复算**：#12101319115/#12102520536/#12101854148/#12102560092，66个原Job唯一记录与65条PASS Shell计数一致，PG16实际版本16.x、两原NONPG区分准确，归档未见未脱敏`::add-mask::`、PEM私钥或原测试HMAC完整赋值。该HEAD全仓Checks快照32=26成功、5失败、1运行中；绝非全绿。详见[正式报告](07_重建工作区/PR111_A主控65项同SHA真实业务及V2来源候选受限验收报告_2026-10-17.md)。
- **工程与来源签约严格分开**：当前`V2_SOURCE_CANDIDATE_66_NEW_HEAD_V1`的线上官方只读自动验证器尚未有可信独立端到端运行结果，且B可写的候选branch/聚合Runner/1日工件不能直接替代旧原生七Workflow同SHA官方身份及A签名；不得改原旧验证器、伪造最后1项PASS、恢复原ref`99c38d013f67cc56975f1664120fb87c204afc3c`或五正式Issuer。**五Source继续`SOURCE_GAP_OPEN/FAIL_CLOSED`，F05/V1/生产`NOT_READY`**。
- **唯一下一B主线正式放行** `NEXT_OWNER=B / NEXT_TASK=F05_7_V2_TRUSTED_READONLY_ATTESTATION_AND_ISSUER_GOVERNANCE_01`。B直接按[新施工单](07_重建工作区/F05-7_V2来源候选官方只读取证与可信签名门禁_A主控B正式施工单_2026-10-17.md)从最新main创建隔离分支，优先对**本Run/四ZIP**执行真实官方REST只读端到端验证并硬化冻结身份、逐步证明/防伪和A控制可信签署/消费者迁移回退；**默认不再次触发66项真实CI，不花未授权费用**。官方Artifact1日过期和先前#12099312017合成HMAC安全风险需独立记录；若过期/缺账户签署权限必须Fail Closed，不能假造成已签。
- 责任A已完成本轮PR审查、受限合并、五权威状态归档及新B任务放行；Issue[#106](https://github.com/suzhe868-arch/mb/issues/106)继续Open，C PR68仍独立。

---

# 2026-10-17｜A已受限验收合并B PR107：新Run原业务63/64成功、证据脱敏验真；旧Source签约未就绪，正式放行独立V2来源协议候选工程（当前最新）

- **A已对B [PR107](https://github.com/suzhe868-arch/mb/pull/107)独立验收并正常合并**：B验收HEAD `5923cddecf660f97d07231ea375f89b255c809bc`，从本轮旧正式main比较ahead5/behind0，12项仅新V2隔离执行器/CI/安全负例/来源候选文档；merge main `b8adeeed6d575d5bd549a5640f68eebf9ce2399b`。[A独立审签](https://github.com/suzhe868-arch/mb/pull/107#issuecomment-6233942303)和[完整验收报告](07_重建工作区/PR107_A主控63项真业务与证据脱敏受限验收及V2来源替代裁决_2026-10-17.md)仅批准**受限工程入库**，不批准原66同SHA Source、正式Issuer、V1/生产。
- **官方真[Run39031350514](https://github.com/suzhe868-arch/mb/actions/runs/39031350514)**：`push/attempt1/completed/failure`，4个ubuntu24分片3成功1失败，每片Node`76/76`成功，原Job逐项真实结果**61PG16+2原非PG16=63/64 PASS，原match-source旧验签1项BLOCKED_EQUIVALENCE**，不是全部正式同SHA66。四份官方Artifact #12100013558/#12100194677/#12100831373/#12100103579，A已**实际下载外层/内层ZIP并独立hash对齐913/913份正文**、64项原证据；新脱敏未查到未遮蔽`::add-mask::`、私钥或测试HMAC完整赋值。旧一日Artifact安全风险另行跟踪。该SHA全仓Check快照32＝26成功、5失败、1运行中；不得宣称全绿。
- **A裁决旧结构性问题**：原`match-source`第二Shell的`ci-verify-workflows.mjs`仍要求七份旧Workflow原64Job同SHA官方push成功＋本原source/https两Job，旧ref与8冻结整体66禁Push，故无法简单给Token修复；严禁改原验证器、伪造Token/API/工件、跨SHA拼PR104历史2项或叫64/64已验。现合并的`v2-source-contract.mjs`只是**非生产协议候选雏形，尚未严格绑定真实66清册/官方实时证明，绝不是正式Issuer**。
- **唯一新B主线已正式放行**：`NEXT_OWNER=B / NEXT_TASK=F05_7_V2_VERSIONED_SOURCE_66_SAME_SHA_ISSUER_CANDIDATE_01`，从执行时最新main在独立新分支`feat/f05-7-v2-versioned-source-66-candidate-01`，严格按[完整版A施工单](07_重建工作区/F05-7_V2正式来源替代协议同SHA闭环候选_A主控B施工单_2026-10-17.md)编写版本化新V2来源签发证据合同、真正可运行的同SHA隔离PG16/NonPG回归与双历史任务同HEAD重验、冻结Job/Blob强绑定及恶意替换负例，最多4标准Runner，每Job≤40分钟，工件每片≤5MiB/留1日，单次末Push、存储/旧CI扇出不能证明则停。**原match-source旧Shell未成功只能明记被候选新协议替代、待A正式单独审签**，B不得自己签Issuer或修改生产。
- **全局源门禁不变**：旧原ref `99c38d013f67cc56975f1664120fb87c204afc3c`不准Push、旧8Workflow整体66禁恢复，`PHASE2_ORIGINAL_REF_PUSH_AUTHORIZED=false`，五正式Source仍`SOURCE_GAP_OPEN / FAIL_CLOSED`，F05全域/V1/生产`NOT_READY`。Issue [#106](https://github.com/suzhe868-arch/mb/issues/106)保持Open直至来源合规闭环。C PR68 Draft独立并行，不被B新施工覆盖。

---

# 2026-10-17｜A独立实核PR107四官方ZIP：62/64真业务通过，另2未闭；旧Source同SHA签约结构性不等价，发现合成HMAC日志脱敏缺口（最新）

- **B [PR107](https://github.com/suzhe868-arch/mb/pull/107)本轮不可完整验收、不可合并**。候选唯一HEAD`c28af176bdec6f18c897ebd3d167db21fb18a716`，从最新main比较ahead4/behind8；9项仅新隔离CI/执行器/Node及Ruby测试/说明，原8冻结Workflow/五正式Source/业务/DDL/PDM/C/生产和旧ref未改；待B修复后需同步main形成新SHA和相应真CI，禁止冒用先前SHA证据。A[PR107正式审签](https://github.com/suzhe868-arch/mb/pull/107#issuecomment-6233462972)及[详细报告](07_重建工作区/PR107_A主控62项真业务受限取证与旧Source父签不可等价及日志脱敏终审_2026-10-17.md)。
- **GitHub真[Run39027727248](https://github.com/suzhe868-arch/mb/actions/runs/39027727248)** completed/failure，4个ubuntu24原生分片2成功2失败，每片Node56/56；原64项同SHA真实结果**60原PG16 + 2原非PG16 = 62通过**、1`match-source`来源语义阻断、1`f03-1-frozen-https-2a`环境失败。A已真正下载四份官方Artifact `12098603894/12099312017/12099621026/12099695908`，独立对GitHub摘要、双层ZIP和每个正文文件摘要逐一验证，四片原Job各16/16归档；官方同HEAD全仓Checks快照32＝25成功、6失败、1进行中；不能以62业务通过代替完整正式父签。
- **A更深层因果核定**：原`match-source`第二原Shell强制调用`ci-verify-workflows.mjs`验证7份旧冻结Workflow的64Job**全部同SHA新push成功**，旧来源ref和原8工作流整体启动仍NO-GO，故此原步骤不能通过额外只读Token在隔离V2上等价完成；B不得假API、修改原脚本或虚报。原F03-1 HTTPS失败是新执行器遗漏原GitHub `GITHUB_ENV`在原step间传播；B可仅白名单恢复测试内三个F03_1临时变量并真测。
- **证据脱敏需先修**：A在真实官方分片1内层日志找到一次性合成HMAC的`::add-mask::`明文44字符输出，被原样打包、未获GitHub原生mask处理；未见生产凭据，但属于V2证据采集安全缺口。B修复掩码处理、拒绝日志/PEM泄露的负例并在必要时删除或等待旧1日工件过期；禁止上传不安全全量原始日志。
- **同一B原工作包继续**：下一`NEXT_OWNER=B / NEXT_TASK=F05_7_V2_REMAINING_64_REAL_EXECUTION_AND_ISSUER_PROOF_01`、原PR107/原分支；[原施工单A最新补充](07_重建工作区/F05-7_V2余64项原业务隔离实跑与安全等价来源证据_A主控B正式施工单_2026-10-17.md)和[完整终审裁决](07_重建工作区/PR107_A主控62项真业务受限取证与旧Source父签不可等价及日志脱敏终审_2026-10-17.md)已签；A加签最多**1次**安全有界Push（4标准Ubuntu Runner、每Job40分钟、工件≤5MiB/片、保留1日），先本地代码/负例与容量预检。新的V2来源签约逻辑仅允许**候选方案设计**，不得绕过旧正式Source/Issuer或称64/64；五正式Source仍`SOURCE_GAP_OPEN/FAIL_CLOSED`，旧ref`PHASE2_ORIGINAL_REF_PUSH_AUTHORIZED=false`，V1/生产`NOT_READY`；C PR68 Draft独立并行。

---

# 2026-10-17｜A对B PR107四分片原业务受控首跑独立验收：1/64真通过、63阻断；精确裁决62PG16＋2非PG并放行有限整改（当前最新）

- **受验B [PR107](https://github.com/suzhe868-arch/mb/pull/107) 暂不合并**，唯一受验HEAD `88afd5d2f3389a844d0da2903b59e903e1949f5a`，对main `8e97dd45bcb9aadbd24fdfd8114a32563627d9c6` 为ahead2/behind0，仅7项本包允许的新增路径，无业务/DDL/旧Source/原8Workflow/生产/C变更。A[正式审签](https://github.com/suzhe868-arch/mb/pull/107#issuecomment-6232764185) 和[完整裁决](07_重建工作区/PR107_A主控原64项权限及PG16语义等价裁决与有限续跑令_2026-10-17.md)，Issue [#106](https://github.com/suzhe868-arch/mb/issues/106)继续Open。
- **真实GitHub [Run39023409526](https://github.com/suzhe868-arch/mb/actions/runs/39023409526)**：本HEAD `push/attempt1/completed/failure`，4个隔离标准Ubuntu Job都真实执行但**4个最终failure**；每Job官方Node51/51，原64项只`g-https` **1/64真PG16业务成功**，59项被新增执行器过严permissions拦截、2项原PG16初始化失败、2项原始H52`h-source/h-https`本来无PG16服务。官方4份同SHA有效Artifact 12097786258/12097468274/12097885208/12097294015；A未下载ZIP亲自重算。全仓Check官方当时32=23成功、8失败、1运行中，不可宣称全绿；失败的4旧Source/父签亦不得冒充恢复。
- **A纠正原施工单不可实现的“余64项全PG16”口径**：原冻结66项实际为64 PG16＋2原非PG16，前批PR104已有2项历史PG16，所以**本包待验64＝62真PG16＋2按原样非PG16作业**。A授权仅解决只读permissions安全等价、PG稳定就绪竞态和h-source/h-https无PG执行，保留原测试断言/Artifact，不许为数字补假PG16；详细技术正反例和限额见[正式补充令](07_重建工作区/PR107_A主控原64项权限及PG16语义等价裁决与有限续跑令_2026-10-17.md)。
- **同一B工作包内一次性整改**：仍`NEXT_OWNER=B / NEXT_TASK=F05_7_V2_REMAINING_64_REAL_EXECUTION_AND_ISSUER_PROOF_01`、同分支`feat/f05-7-v2-remaining-64-real-pg16-01`和同PR107；允许额外最多**2次**受控Push，每轮≤4个标准ubuntu24 Runner、每Job≤40min、每片≤5MiB留存1天，异常预算/队列Fail Closed；需明确分开历史2PG与同HEAD62PG+2非PG，出具真实同SHA完整来源证据，不能简单把4个新Job绿色当64个原业务通过。仍不得强推旧源分支或启动旧8Workflow/66Job、签正式Issuer、生产/V1 `NOT_READY`，C PR68 Draft独立并行。
- **本轮A独立审查结论 `A_CHANGES_REQUESTED / PR107_NO_MERGE`**，非一次已通过验收。A的原正式施工单[更正后文本](07_重建工作区/F05-7_V2余64项原业务隔离实跑与安全等价来源证据_A主控B正式施工单_2026-10-17.md)和[本次技术裁决](07_重建工作区/PR107_A主控原64项权限及PG16语义等价裁决与有限续跑令_2026-10-17.md)均已放行；B无需重新开任务或等待用户逐项批准，先自行解决可修的59＋2，再依法完成剩余原Job的真实回归与证据归档。 

---

# 2026-10-17｜A独立受限验收B PR104：66项来源清册全量映射、2项真实PG16通过；旧66 NO-GO，正式放行V2剩余64项实跑（最新）
  
- **A已审核标准合并B [PR104](https://github.com/suzhe868-arch/mb/pull/104)**：B唯一HEAD `346fb11133f0883014b7911effb58052bd17b2c1`，合并main SHA `62dcafba00dff97d107d62c376e9ff45d3e7afbc`；5/5仅新增隔离限域CI/执行器/证据校验/37测试/中文说明，旧8Workflow、五正式Source/Issuer、业务/DDL/PDM/生产/C与旧原ref一律未改。A[独立审签](https://github.com/suzhe868-arch/mb/pull/104#issuecomment-6230657420)，[详细报告](07_重建工作区/PR104_A主控66项来源与双真实PG16受限验收及V2裁决_2026-10-17.md)。
- **真正GitHub[Run39008798385](https://github.com/suzhe868-arch/mb/actions/runs/39008798385)**：同HEAD push/attempt1 completed/success；H52原Job117326661519、K2原Job117326661370均实际Ubuntu+PG16成功，原业务H52 7/7＋7/7、K2前序18/18＋HTTPS 7/7，安全Node 37/37；官方同SHA有效Artifact 12091638973（129853B）和12091504805（94178B），有官方摘要、未独立下载ZIP重算。**原66份Job源映射全部生成，但本批实际只跑2/66，剩余64项未实跑**，不得宣称66正式验收。
- **A核官方本HEAD全仓Checks快照**：30条=25 success、4 failure、1 in_progress；3旧正式Source因为不满足本ref官方新Push而Fail Closed，原F05-7父源因无法证明全66项同SHA而Fail Closed；不能说全仓全绿。旧来源分支SHA `99c38d013f67cc56975f1664120fb87c204afc3c`未改，**`PHASE2_ORIGINAL_REF_PUSH_AUTHORIZED=false`，旧8Workflow/66 Job不许整体触发**。
- **A明确技术裁决**：原旧ref保护、Runner/Artifact容量和预算未核准，**原生旧66批量恢复继续NO-GO，选择安全等价V2的真业务实证路线**；PR104只是V2候选（尚缺Job/Artifact/真实日志强绑定及64项实测），不签Issuer，五正式Source仍`SOURCE_GAP_OPEN/FAIL_CLOSED`，F05全域/V1/生产`NOT_READY`。
- **下一唯一主线责任B**：`NEXT_OWNER=B / NEXT_TASK=F05_7_V2_REMAINING_64_REAL_EXECUTION_AND_ISSUER_PROOF_01`；严格按[完整正式施工单](07_重建工作区/F05-7_V2余64项原业务隔离实跑与安全等价来源证据_A主控B正式施工单_2026-10-17.md)，从最新main隔离分支`feat/f05-7-v2-remaining-64-real-pg16-01`做剩余64项原业务真PG16隔离运行、V2工件签名/Job名称/日志绑定与攻击负例，至多4新增Runner、各<=40分钟、一次最终Push及官方证据；预算/并发无法硬界定则止损Fail Closed。不许重新做旧H52 0Job诊断、旧ref Push、生产动作。C [PR68](https://github.com/suzhe868-arch/mb/pull/68)继续Draft独立并行，不替代B主线。

---

# 2026-10-17｜A验收B PR102原F05-7真HTTPS业务远程PG16成功并合并；转入66项来源最终闭环工程包（本轮最新）

- **B PR102已A独立验收并标准合并**：[PR102](https://github.com/suzhe868-arch/mb/pull/102)，唯一验收B HEAD`2933d32cf375f11328251854874c7b5a5f835c4a`，合并SHA`1e454e7fcc086cec537aae9de93713fbdb4d410d`。5/5白名单仅新增单Job工作流和说明，修正已有来源证据代码，不动原`ci-job.sh`、原H52/其它7份旧Workflow、五Source/DDL/PDM/生产/C。真正GitHub[Run39006396267](https://github.com/suzhe868-arch/mb/actions/runs/39006396267) completed/success；原生Job117319652675日志证实Node **38/38**、原PG16前置 **18/18**、旧F05-7 `https.test.mjs` **7/7** 和完成标记`F05_7_NATIVE_PG16_V23_https_CI_COMPLETE`；106849B官方有效同SHA Artifact12090408632，官方SHA256摘要可核。此次是**真正原业务远程通过**，但只一条HTTPS子路径，不是66项已验收。
- **A实核同HEAD全仓CI而非只数1个Job**：当时GitHub官方29 Check Runs=24 success、3旧Source failure、2 in_progress（快照，不是永久结果）。其中旧正式Source因不符合原分支合法新Push而拒绝；不能把原Source红灯从成功中抹除，也不能让它阻止当前受限独立工程包的合规合并。旧来源分支`99c38d013f67cc56975f1664120fb87c204afc3c`仍未变化，服务器端机器保护无法核实、可见rulesets=0，因此**原8Workflow/66Job未授权执行**。
- **下一主任务正式签发给B**：[F05-7真实66项来源最终闭环施工单](07_重建工作区/F05-7_66项真实来源最终闭环与受限执行或安全等价V2_A主控B完整施工单_2026-10-17.md)，`NEXT_OWNER=B / NEXT_TASK=F05_7_66_REAL_SOURCE_FINAL_CLOSURE_01`，B只能在新分支`feat/f05-7-66-real-source-closure-01`新增真实可执行来源/资源保护和实际旧H52冻结PG16业务测试复用代码、受控低并发CI证据，接着给A**一次性的66Job原生可行性最终Go或安全等价V2方案**。任何完整旧66实际跑之前仍由A核准写入精确Source ref、资源用量/服务器保护；无法保障安全则B实装V2版本验收候选但不得自签。**不再重开历史H52 0Job诊断或模拟52 Job调查**。
- **长期安全界线不变**：五正式Source `SOURCE_GAP_OPEN/FAIL_CLOSED`，`PHASE2_ORIGINAL_REF_PUSH_AUTHORIZED=false`；F05全域/V1/生产`NOT_READY`。F06/F07/F08-1前期受限验收记录不返工，C [PR68](https://github.com/suzhe868-arch/mb/pull/68)继续Draft并行。详细A审核与裁决见[正式报告](07_重建工作区/PR102_A主控原F05-7真业务PG16远程实测受限验收及66项最终闭环接力_2026-10-17.md)。

---

# 2026-10-17｜A独立验收B PR100完成：真实Node34/34＋隔离非特权PG16 23/23，下一步B直接远程实跑原F05-7真正业务测试（本轮最新）

- **B PR100真实代码范围A受限验收已标准合并**：[PR #100](https://github.com/suzhe868-arch/mb/pull/100)，受验唯一HEAD`5cc78c586a680b20c6a20c65ace9974776c34755`、main merge `75be5d183f6cdd7d1f2ec3a6bd631ff4f9bc0009`；7/7仅新增A授权白名单文件，旧8冻结工作流/五正式Source/DDL/生产/C零改。A独立审签[PR100审查评论](https://github.com/suzhe868-arch/mb/pull/100#issuecomment-6230032492)；原生[Run39004908729](https://github.com/suzhe868-arch/mb/actions/runs/39004908729)为最终HEAD的Push成功：Node34/34与真实非特权PG16 23/23、两项有效非空官方sha256 Artifact；这是有明确合成边界的**真实新代码和CI工程**，不是旧F05全域通过。
- **纠正B证据过度简化**：A在当时官方最终HEAD读取30 Check Runs＝25 success、3旧Source failure、2仍in_progress（快照，非永续计数）；不是B自述“同HEAD仅2条全部成功”。3旧来源红灯因当前提交不满足原签分支Push而fail-closed；两新任务Job均成功。B新snapshot把第五来源`F05-10-D1`误记为`F05-11`，且proof的用户传入模拟API JSON不应作为真正官方可信证明，这两个限定问题已列为**下一B任务强制整改**，**不向五正式Source Issuer签发新许可**。
- **真正推进原F05-7而非调查H52**：A签[下一B完整施工单](07_重建工作区/F05-7_真正原业务PG16远程单Job实跑与本地故障兜底_A主控B完整施工单_2026-10-17.md)，`NEXT_OWNER=B / NEXT_TASK=F05_7_NATIVE_REAL_REMOTE_SINGLE_JOB_01`，由B在最新main独立分支`feat/f05-7-native-real-remote-onejob-01` **实际原样运行旧F05-7 `ci-job.sh https` 的完整真实PG16业务测试一次**（GitHub本次新增最多单Job、40分钟timeout，原业务脚本零改），失败则读真实日志后Linux Docker本地复现，再由A按真实问题裁定。现有旧全仓CI自动扇出需实际记账/限次止损，不能把“只新增一个Job”说成全仓只启动一个Runner。
- **旧正式来源仍不得越权**：F05-7原ref `99c38d013f67cc56975f1664120fb87c204afc3c`未改，旧8Workflow/66PG16不可因新单触发，五正式Source仍`SOURCE_GAP_OPEN/FAIL_CLOSED`，`PHASE2_ORIGINAL_REF_PUSH_AUTHORIZED=false`，F05最终/V1/生产`NOT_READY`。本轮是对既有原业务HTTPS一个Job远程实测，不是66全量原生父签。C [PR68](https://github.com/suzhe868-arch/mb/pull/68)仍Draft独立并行。

---

# 2026-10-17｜A终止F05-7 H52重复调查，恢复B真实CI编码＋跨域PG16工程主线（本轮最新）

- **最新正式放行**：[B真实工程施工单](07_重建工作区/F05_F08_停止H52循环与恢复B真实工程施工_A主控正式施工单_2026-10-17.md)：B在最新main建立`feat/f05-f08-bounded-real-engineering-01`，完成**可运行版本化可信来源/变更影响校验工具＋F05/F06/F07真实隔离非特权PG16跨域集成CI**，至少20项Node正反例、8项真PG16断言，新增最多2项Runner（Node 10分钟+PG16 20分钟显式timeout），末SHA日志/工件归档，交A独立验收。**不再重复H52旧失败接口/合成52Job/Actionlint历史调查。**
- **正式接力**：`NEXT_OWNER=B / NEXT_TASK=F05_F08_BOUNDED_REAL_ENGINEERING_01`；F06(PR63)、F07(PR67)、F08-1(PR69)此前受限CI合并记录保留，不重做；B可以合法施工**不依赖旧正式Source**的真实工程，不因为旧源证据红灯全部停工。A会在包尾再签旧正式Source恢复或v2新合同迁移的单独工程包。
- **旧Source安全约束仍在**：历史五Source均曾在各自原SHA真实成功，但**不同SHA不能冒充当前main父签**。旧F05-7原ref `99c38d013f67cc56975f1664120fb87c204afc3c`不准Push/快进/强推，原8Workflow/66Job/64PG16不准执行；`PHASE2_ORIGINAL_REF_PUSH_AUTHORIZED=false`、`SOURCE_GAP_OPEN / FAIL_CLOSED`、F05最终/V1/生产`NOT_READY`，不因为此新包的有限CI成功篡改历史Issuer。
- **独立并行**：C [PR68](https://github.com/suzhe868-arch/mb/pull/68)仍Draft/未获最终功能视觉认可，不能混入B分支，也不是本轮主线。

---

# 2026-10-17｜A正式独立验收PR97：B只读取证封口合格并合并；H52旧ref恢复继续NO-GO（当前最新）

- **当前正式main**：[B PR97](https://github.com/suzhe868-arch/mb/pull/97)按最终B HEAD `ea04e6f53f486aaa5f80ead753dee53e09a235c7`受限验收，仅3份新增`audit/f05-7-post-pr94-native-closeout/**`取证文件，**未碰旧H52/8Workflow/Source/业务/DDL/C/正式状态**。A[独立审签](https://github.com/suzhe868-arch/mb/pull/97#issuecomment-6229412780)，GitHub**标准合并**`55a1ef0710f28af39adb14c6661725abea1e9aed`。详细[本次A验收及裁决](07_重建工作区/F05-7_PR97_A主控官方0Job取证封口独立验收与阶段2持续NO_GO裁决_2026-10-17.md)；**PR97代码或安全门禁“成功验收”不等于旧编排或全部CI成功**（B受验HEAD GitHub Checks=0，静态3文件PR本就未增加Runner）。
- **A自行复核官方事实**：历史[Run38958160214](https://github.com/suzhe868-arch/mb/actions/runs/38958160214) `completed/failure`、`attempt=1`、0Job；旧失败SHA `bf9c698fabff721a52154fba662dc9b230d9a319`所关联目标Check Suite `105583123217` `completed/failure`、**0 Check Run**；该commit可读13套suites/32条**其他**checks。精确GitHub自身解析错误annotation仍`BLOCKED_OFFICIAL_ROOT_CAUSE_UNKNOWN`；已验收PR94 Actionlint历史H52第34行两项schema错误**仅第三方静态证据**，当前复杂原H52新SHA实际**52Job编排仍NOT_PROVEN**。
- **保护与费用闸门**：原旧来源ref `99c38d013f67cc56975f1664120fb87c204afc3c`未改；原ref与main可见`protected=false`、可见rulesets 0，**无已核服务器端防误推机制**。8 Workflow/66Job/64 PG16服务/110 Artifact上传/3520分钟静态超时和只是风险求和，不是许可/真实账单。实际Runner并发、实际Artifact GiB和保费额/中止能力未签。五Source`SOURCE_GAP_OPEN / FAIL_CLOSED`。
- **本轮B任务已封口，不再下达重复Actionlint/合成CI探针**；A正式判定旧来源ref阶段2 `A_NO_GO_HELD_AFTER_PR97`、`PHASE2_ORIGINAL_REF_PUSH_AUTHORIZED=false`，不许快进/Force/Push旧ref或运行旧66Job。**下一主线责任A**：`NEXT_OWNER=A / NEXT_TASK=F05_7_PHASE2_A_RESOURCE_AND_ORIGINAL_SCHEDULER_GATE_HOLD`，由A履行资源与机器保护门禁技术裁决；未证明安全条件前不自动授权B冒险执行。**不是转交C**。并行C [PR68](https://github.com/suzhe868-arch/mb/pull/68)仍Draft/视觉与真实功能未被用户确认，未合并，V1/生产`NOT_READY`。

---

# 2026-10-17｜A主控更正PR95接力错误：B仍是F05-7工程主线，C只作为并行前端轨道（当前最新）

- **更正范围**：[PR94](https://github.com/suzhe868-arch/mb/pull/94)对B的独立验收、同SHA静态证据、[PR95](https://github.com/suzhe868-arch/mb/pull/95)中的安全结论以及标准合并事实**全部保留**；错误仅在PR95后将主线`NEXT_OWNER`改为C、错误把C01 R3当下一主任务。用户要求本轮仍检查B，A确认C不是B的替代交接，现正式更正`NEXT_OWNER=B / NEXT_TASK=F05_7_POST_PR94_NATIVE_DIAGNOSTIC_CLOSEOUT_01`。
- **A新正式B工作单**：[PR94后GitHub原生故障证据封口及恢复预算只读核证](07_重建工作区/F05-7_PR94后GitHub原生故障证据封口及恢复预算只读核证_A主控正式施工单_2026-10-17.md)；从执行时最新main新建**隔离B分支**`audit/f05-7-post-pr94-native-diagnostic-01`，限只读GitHub官方接口和新增`audit/f05-7-post-pr94-native-closeout/**`中文证据，**不新增CI/不运行Runner/不变更任何旧Workflow/原旧Source分支/生产**。针对历史0Job的**官方Check Suite诊断是否可得**给一次性可复现结论和严格恢复前预算/失败停止条件，查不到即明示`BLOCKED_OFFICIAL_ROOT_CAUSE_UNKNOWN`；不复演已完成Actionlint和合成探针。达到取证/封口标准后交A再次裁决。
- **原阶段2继续正式NO-GO**：`PHASE2_ORIGINAL_REF_PUSH_AUTHORIZED=false`；原F05-7来源ref `99c38d013f67cc56975f1664120fb87c204afc3c`不得修改、快进/Push/重试，旧8 Workflow/66 Job/64PG16仍不许运行，五Source仍FAIL-CLOSED，V1及生产NOT_READY。只有未来A独立明确签署旧ref的expected SHA、target SHA、Runner/Artifact预算及停止界限才有单独放行可能。
- **C并行状态绝不撤销**：[PR68](https://github.com/suzhe868-arch/mb/pull/68)仍Draft及`C_APP_01_R3_HOME_DETAIL_FULL_SPEC_REBASE`原正式R3施工单有效，用户旧首页/详情否决未解除；C可在独立窗口按原签发范围继续，但**C不是本轮主线`NEXT_OWNER`**。详细[接力错误更正记录](07_重建工作区/PR95主线接力误切C的A主控更正记录_2026-10-17.md)。

---

# 2026-10-17｜A独立验收并标准合并PR94：历史H52第34行Schema错误复现；当前H52零静态错，阶段2继续NO-GO（本轮最新）

- **A独立验收与合并**：[PR94](https://github.com/suzhe868-arch/mb/pull/94)受验唯一B HEAD `cb960eeb0b09dabacf43c096152a88057ae1fac9`；相对原main `2d53c138afc12d2d7593c30368f21acd28ee0f51` ahead3/behind0，严格新增4份A授权只读审计/固定Actionlint脚本与报告文件（1份8分钟1Job只读CI、3份中文审计测试），原H52/其它7冻结工作流/Source/业务/DDL/C文件全部**零修改**。A审签[PR94评论](https://github.com/suzhe868-arch/mb/pull/94#issuecomment-6229073466)，标准GitHub合并main `f08b59ff0d0875613e2679539ba2039dec867ec8`；[A独立验收与安全裁决](07_重建工作区/F05-7_PR94_A主控历史Schema错误核验与阶段2继续NO_GO裁决_2026-10-17.md)。
- **同SHA GitHub官方证据**：[Push38998693209](https://github.com/suzhe868-arch/mb/actions/runs/38998693209) completed/success；唯一真实Runner Job[117296816085](https://github.com/suzhe868-arch/mb/actions/runs/38998693209/job/117296816085)成功；A读取原生日志确认Node**10/10**、Actionlint v1.7.12固定发布SHA256校验、三版真实Blob检查。历史0Job失败H52 Blob `3a13bab79b4e45fb4e037a1d6fd4431593506148` **34:9两条syntax-check**/RC1，旧Source H52 Blob `eda68ce30bbccfa802f459e009ef0a6889918648` RC0/0，当前main H52 Blob `687a9f767b0d0b144372550735da6159066b4833` RC0/0。官方有效同HEAD [Artifact12088267552](https://github.com/suzhe868-arch/mb/actions/runs/38998693209/artifacts/12088267552) 2581B、官方digest已核，本轮**未独立下载ZIP重算**。
- **风险边界不变**：历史Actionlint静态步骤错误`HISTORICAL_SCHEMA_ERROR_REPRODUCED`，但历史GitHub 0Job官方原生Check Suite诊断仍不可得，`OFFICIAL_ROOT_CAUSE_UNKNOWN`；当前H52真实**52Job旧ref新SHA原生编排仍未证明**。8源Workflow合计66Job/64 PG16/110 Artifact上传点/3520理论Runner分钟，容量/并发/预算未封印；五`SOURCE_GAP`仍Fail Closed，原来源ref `99c38d013f67cc56975f1664120fb87c204afc3c`未更新。**`PHASE2_ORIGINAL_REF_PUSH_AUTHORIZED=false`，不得快进/Push旧ref、启动66Job或碰生产。** 本次PR94验收**不是**F05/V1全局就绪。
- **下一正式优先责任C**：停止无实证的H52合成探针循环、B阶段2原来源恢复暂保持`A_NO_GO_HELD`（不得自动施工）；C继续原[PR68](https://github.com/suzhe868-arch/mb/pull/68) `C_APP_01_R3_HOME_DETAIL_FULL_SPEC_REBASE`，按[已签R3整包施工单](07_重建工作区/C_APP_01_首页详情功能视觉双重失配根因复盘与R3整包整改正式施工单_2026-10-16.md)完成R1+R2+R3功能/视觉/四屏截图/同SHA双端CI；最新查得PR68仍Draft、HEAD `a02ca27d2109e365c5830b641a18cfb059fe3684`、相对main待同步，**用户尚未认可新首页与详情，PR68_NO_MERGE**。下一`NEXT_OWNER=C / NEXT_TASK=C_APP_01_R3_HOME_DETAIL_FULL_SPEC_REBASE`仅表示当前优先可施工轨道；**不会解除B风险门禁或授权生产**。

---

# 2026-10-17｜A独立验收并合并PR92：原H52 0Job历史真实、66Job成本上界3520分钟；阶段2正式NO-GO（当前最新）

- **A已限定验收**：[PR92](https://github.com/suzhe868-arch/mb/pull/92)唯一B受验HEAD `4b6a934d45ef65d66a89225940fdff2b8a17c96d`，compare原正式main ahead2/behind0；5/5改动仅1份受控8分钟只读静态审计CI及4份`audit/h52-original-source-go-no-go/**`取证/代码/报告，未修改旧H52、其它8 Workflow、父Source、业务/DDL、C。A原生核验[Push38997110086](https://github.com/suzhe868-arch/mb/actions/runs/38997110086)同末SHA完成成功、唯一Runner Job117291981495成功、Node**14/14**、Git Blob八文件差分守卫、离线Ruby Psych原H52 52 Job语法可解析；[官方Artifact12087426776](https://github.com/suzhe868-arch/mb/actions/runs/38997110086/artifacts/12087426776) **1446字节/同SHA/有效/具官方摘要**。PR92自身1/1 Check成功，[A独立审签](https://github.com/suzhe868-arch/mb/pull/92#issuecomment-6228870987)及[完整验收](07_重建工作区/F05-7_PR92_A主控原H52零Job根因预算预审与阶段2NO_GO裁决_2026-10-17.md)。GitHub标准合并main SHA **`3489bad8dfc0da02784a4a7fd2337f8e487a19a8`**。
- **A正式NO-GO**：旧H52真正[Run38958160214](https://github.com/suzhe868-arch/mb/actions/runs/38958160214)是`completed/failure`且**0 Job**，失败SHA`bf9c698fabff721a52154fba662dc9b230d9a319`对应H52 Blob`3a13bab79b4e45fb4e037a1d6fd4431593506148`；当前main H52`687a9f767b0d0b144372550735da6159066b4833`为**511380B/52Job**，只读Ruby/合成探针均**不能证明**原H52在旧ref新HEAD GitHub原生编排通过；官方准确零Job解析annotation当前不可获得，`OFFICIAL_ROOT_CAUSE_UNKNOWN`。旧原来源ref SHA仍`99c38d013f67cc56975f1664120fb87c204afc3c`且为main祖先，但**祖先不是Push授权**。
- **费用/并发未闭环**：现8份F05-7旧Workflow合计**66 Job、64 PG16 service、110 Artifact上传调用点、4个未设timeout（默认360分钟）**，按各timeout直接求和的静态极限**3520 runner-minutes≈58.7 runner-hours**，不代表实际耗时/收费。未有A签定的有效并发/工件GiB/停机预算；允许66Job原ref Push风险过高，A明确签`A_OPTION_1_NO_GO_MINIMAL_H52_REPAIR`：**`PHASE2_ORIGINAL_REF_PUSH_AUTHORIZED=false`**，原来源ref不许更新/快进/force/Push或运行旧66 PG16。五正式SOURCE GAP、C PR68真双端和视觉、V1/生产仍NOT_READY。
- **下一唯一B授权**：`NEXT_OWNER=B / NEXT_TASK=F05_7_H52_ORIGINAL_SCHEMA_MINIMAL_REPAIR_01`；按[正式施工单](07_重建工作区/F05-7_H52原文件Actionlint与零Job最小受控修复_A主控正式施工单_2026-10-17.md)，**只针对原H52离线GitHub Actions schema/Actionlint及历史0Job SHA做可重现差异定位**。只有存在`actionlint`原文件明确error及可机械验证的语义等价最小hunk时，才允许在隔离B分支定向修改**唯一原H52 YAML**并受控静态CI；没有证据则不得试错修改、交`BLOCKED_OFFICIAL_ROOT_CAUSE_UNKNOWN`给A。任何新的隔离CI不得运行旧52/66Job；阶段2仍NO-GO，独立以后再裁决。

---

# 2026-10-17｜A独立验收并标准合并PR90：合成52 Job原生完整编排51跳过+1实际Runner成功，旧F05-7来源仍待决（最新）

- **A真实验收**：[PR90](https://github.com/suzhe868-arch/mb/pull/90)唯一受验B HEAD `a401fe57ca6acc9b488990d0edb18d75ed49cf25`，compare对原main ahead1/behind0，5/5项在A授权白名单：1份只有隔离分支Push的`h52-scheduler-synthetic-52-node-graph.yml`和4份纯合成生成/测试/报告。A核GitHub官方[Push Run38994510969](https://github.com/suzhe868-arch/mb/actions/runs/38994510969)末SHA与GitHub完整`/jobs?per_page=100`，**52个Job记录=51 skipped+仅`safe-52`1 success**，Check API也51 skipped/1 success，唯一实际Runner Job`117283974828`。真Runner Node**14/14**、`GENERATOR_EXACT_MATCH`、标量`&z/*z`两次canary真实回显，官方Artifact`12085953300` 293B有效、未过期、官方SHA256摘要；无PG16/旧Source执行。A[独立审签](https://github.com/suzhe868-arch/mb/pull/90#issuecomment-6228490964)后标准合并main SHA **`856d281a9e9a753dffa3d0d0b4107f93d250a1fd`**。[详细A验收](07_重建工作区/F05-7_PR90_A主控52合成节点原生验收及旧H52剩余风险裁决_2026-10-17.md)。
- **精确限定**：PR90只证明**7165字节纯合成52节点工作流**被GitHub原生编排，51跳过**不等于51个测试通过**；旧真正H52复杂**511380B/52Job**的新内容在原旧ref上的调度、历史8Workflow/66PG16作业、五Source正式父签仍`NOT_PROVEN/SOURCE_GAP`。旧[H52故障Run38958160214](https://github.com/suzhe868-arch/mb/actions/runs/38958160214)确为0 Job/failure。原H52 Blob`687a9f767b0d0b144372550735da6159066b4833`及原来源分支SHA`99c38d013f67cc56975f1664120fb87c204afc3c`继续未改。C PR68、V1及生产亦NOT_READY。
- **下一唯一B正式单**：`NEXT_OWNER=B / NEXT_TASK=F05_7_ORIGINAL_H52_PHASE2_GO_NO_GO_READONLY_01 / A_RELEASED_FOR_B_READONLY_ORIGINAL_H52_PHASE2_DECISION_EVIDENCE_ONLY`，B不再启动合成探针循环，改按[原H52故障+阶段2一次性Go/No-Go证据施工单](07_重建工作区/F05-7_原H52故障源审计与阶段2一次性GO_NO_GO预审_A主控正式施工单_2026-10-17.md)做旧失败SHA与现H52逐字段只读取证、GitHub Actions静态兼容/Job结构解析、原66Job/8Workflow并发与工件预算和一次快进的失败停止方案；**B无权更改旧工作流或Push原ref，A另签才可执行阶段2**。五Source Fail Closed、C与生产阻断继续保留。

---

# 2026-10-17｜A独立验收并合并PR88：H52小型锚点+511380B单Job原生调度两探针通过，52Job真实调度仍阻断（最新）

- **正式受验与合并**：[PR88](https://github.com/suzhe868-arch/mb/pull/88)，唯一B末HEAD `27af908c1be212a09d886b831f1a8afbc2290779`、对正式main ahead2/behind0。仅新建A白名单6文件：2份非`f05-*`命名的无害只读探针Workflow（每份1个8分钟Runner Job），4份纯合成审计/脚本/自验报告；0旧H52/Source/业务/DDL/生产改动。A[独立审签评论](https://github.com/suzhe868-arch/mb/pull/88#issuecomment-6228256837)。同一最终HEAD四次GitHub原生 [小Push38969402047](https://github.com/suzhe868-arch/mb/actions/runs/38969402047)、[小PR38969412145](https://github.com/suzhe868-arch/mb/actions/runs/38969412145)、[大Push38969402153](https://github.com/suzhe868-arch/mb/actions/runs/38969402153)、[大PR38969412032](https://github.com/suzhe868-arch/mb/actions/runs/38969412032)**各1/1 Job success**、Node各**11/11**、GitHub`&z`+`*z`两个真实Runner steps均执行，合成大文件511380B也真实调度1Job；4份同HEAD官方非空未过期工件及摘要。PR88自身4/4检查成功。GitHub标准合并SHA **`60310c2bcc33d0f471c96c8991e822899528f3dd`**。[A完整验收与限制](07_重建工作区/F05-7_PR88_A主控单Job锚点与511380B真实编排验收裁决_2026-10-17.md)。
- **结论限定与继续阻断**：只是**单Job合成**的锚点/文件大小条件已由GitHub真正证明；不能据此宣称原冻结H52的**52Job复杂图**可原生成功解析，更不能证明旧8Workflow/66PG16来源作业及五`SOURCE_GAP`恢复。历史真实H52[Run38958160214](https://github.com/suzhe868-arch/mb/actions/runs/38958160214)仍`completed/failure`且0 Job；当前H52 Blob`687a9f767b0d0b144372550735da6159066b4833`、原F05-7来源ref SHA`99c38d013f67cc56975f1664120fb87c204afc3c`均未改；C PR68必需真实双端构建及V1/生产未就绪。
- **下一唯一B任务**：`NEXT_OWNER=B / NEXT_TASK=F05_7_H52_SYNTHETIC_52_GRAPH_SCHEDULER_DIAGNOSTIC_01 / A_RELEASED_FOR_B_SAFE_SYNTHETIC_52_GRAPH_ONE_RUNNER_ONLY`。依[新正式完整施工单](07_重建工作区/F05-7_H52合成52节点仅1Runner原生编排核证_A主控下一正式施工单_2026-10-17.md)新增隔离**合成**52 Job节点（51个Job级别永远`if:false`且**0 Runner**；1个只读轻量Runner）工作流，纯注释/echo、不触发原F05-7 ref，不运行旧PG16。核GitHub原生准确Job数量/跳过结果/历史0Job区别。**此单不是52旧作业/66原生作业或`PHASE2_ORIGINAL_REF_PUSH_AUTHORIZED`授权**，仍保持五Source FAIL-CLOSED、C和V1门禁。

---

# 2026-10-17｜A独立验收并标准合并PR86：F05-7 HTTPS真实端口冲突已修复、H52新版GitHub调度尚未证明（最新）

- **真实审核及合并**：[PR86](https://github.com/suzhe868-arch/mb/pull/86) 唯一受验 B HEAD `e57779bf21a95a69aedd1a874fdd8c5593610dab`，6/6改动仅HTTPS测试监听动态端口＋路径限制独立CI＋4个安全审计/证据文件，8份旧F05-7 Workflow、其它4 Source、业务、DDL、C都未改。A独立[签审](https://github.com/suzhe868-arch/mb/pull/86#issuecomment-6224574888)，同SHA[Push38964109049](https://github.com/suzhe868-arch/mb/actions/runs/38964109049)与[PR38964114653](https://github.com/suzhe868-arch/mb/actions/runs/38964114653)专用Jobs各**2/2成功**、Node各**12/12**、真正PG16+原完整HTTPS TLS拒绝**7/7**，故意占用原固定端口48988后仍通过。逻辑Host/Origin和安全断言原字节均保持，四件官方同SHA有效非空Artifact；GitHub标准合并SHA **`5eee392b0b833876831a0735d975b6e534f34b26`**。[A完整验收记录](07_重建工作区/F05-7_PR86_A主控HTTPS真回归验收与H52调度仍阻断裁决_2026-10-17.md)。
- **不得越界**：GitHub官方历史H52失败[Run38958160214](https://github.com/suzhe868-arch/mb/actions/runs/38958160214) **completed/failure、0Job**（较早B代码SHA `bf9c698fabff721a52154fba662dc9b230d9a319`）；当前H52原Blob `687a9f767b0d0b144372550735da6159066b4833`、**511380字节**、GitHub Workflow注册状态active、静态Ruby解析52 Job，但**原旧F05-7 ref上新版H52真实编排仍`H52_GITHUB_SCHEDULER_NOT_PROVEN`**。PR86还有旧F05 Source Fail Closed、总32 Check本轮观察27成功/4失败/1运行中，全CI未全绿；旧原F05-7 ref仍`99c38d013f67cc56975f1664120fb87c204afc3c`；未执行新66 Job，五Source缺口、C PR68真双端构建、V1生产都保留NOT_READY。
- **下一唯一B工作单**：`NEXT_OWNER=B / NEXT_TASK=F05_7_H52_SCHEDULER_ISOLATED_DIAGNOSTIC_01 / A_RELEASED_FOR_B_NON_SOURCE_ISOLATED_GITHUB_PARSER_PROBES_ONLY`，按[新正式施工单](07_重建工作区/F05-7_H52原生编排隔离无害探针_A主控下一阶段正式施工单_2026-10-17.md)在**非F05历史来源分支**建两个纯合成轻量GitHub workflow解析探针（小尺寸锚点与接近511380字节的安全大文件），每份最多1个低成本只读Job、0 PG16/旧工作流/Source，官方记录与无Job失败做对照，绝不改现有H52、原ref或运行66 Jobs；若仍不能证明真实H52调度，带明确未闭环证据交A再裁决。阶段2旧ref一次快进/Push需未来A另签精确old SHA/target SHA/66 Job成本及停止边界，此单不授该操作。

---

# 2026-10-17｜A独立验收并标准合并PR84：F05-7冻结PG16安全兼容补丁通过，旧Source及阶段2仍阻断（当前最新）

- **正式核验与合并**：A独立审查[PR84](https://github.com/suzhe868-arch/mb/pull/84)受验最终HEAD `c66b39224ee75c8f0f4e335eca2c5e8843b7cb70`，只改7份获批F05-7冻结YAML、1路径限制独立CI、4个审计/报告文件共12项，原第八份主F05-7 Workflow字节不变。GitHub同HEAD原生[Push38959514084](https://github.com/suzhe868-arch/mb/actions/runs/38959514084)与[PR38959526269](https://github.com/suzhe868-arch/mb/actions/runs/38959526269)均专用Job **2/2成功**、Node各**45/45**、Ruby解析8Workflow/66历史Job、官方七旧Blob字节安全差分、PG16 DockerHub Alpine真实隔离/非特权安全反例及4份非空官方摘要工件。62个服务镜像改为`postgres:16-alpine`＋Runner本地旧祖先别名，H52六`contents:write`收紧只读；原Source/Artifact及跨F03精确ref守卫未改。[A审核评论](https://github.com/suzhe868-arch/mb/pull/84#issuecomment-6223978936)及[完整验收报告](07_重建工作区/F05-7_PR84_A主控镜像权限安全补丁独立验收与阶段2阻断裁决_2026-10-17.md)。GitHub标准合并成功，主线SHA **`4e465f4fffb4a91d2d3a069e3a6ea67475d18d5e`**。
- **真实阻断不得混淆**：最终HEAD仍有旧F05检查未全绿，A查得32 Check=26成功/5失败/1未完成；除四个正式Source缺口外，**F05-7 HTTPS原生Job117170785651实际发生`EADDRINUSE 127.0.0.1:48988`**，与历史父签缺口不是一类失败，需独立根因整改。H52在B较早SHA曾出现GitHub 0 Job失败，最终HEAD的Ruby解析不能证明在原旧F05-7分支真正调度52 Job；该风险须额外验证。旧F05-7原ref SHA`99c38d013f67cc56975f1664120fb87c204afc3c`仍未更新，五Source`SOURCE_GAP`、C PR68必要双端构建、F05/F08全域、V1/生产均NOT_READY。
- **唯一下一B任务**：`NEXT_OWNER=B / NEXT_TASK=F05_7_PRE_PHASE2_BLOCKER_CLOSEOUT_01 / A_RELEASED_FOR_B_ISOLATED_BLOCKER_REPAIR_ONLY`，依据[正式下一施工单](07_重建工作区/F05-7_阶段2前HTTPS端口冲突及H52无Job风险闭环_A主控正式施工单_2026-10-17.md)从最新main单独新分支，优先定位并有证据修复F05-7 HTTPS固定端口冲突，在不会改业务断言的条件下获得新同SHA真实CI；隔离核证H52 YAML锚点/容量/GitHub 0 Job根因、8Workflow/66Job未来合法可调度性，不得自行重放源分支。交`READY_FOR_A_REVIEW_PHASE2_PRECHECK`由A验收。**阶段2原ref单次fast-forward Push及66 PG16 Job继续完全禁止，需之后A另签确切旧/目标SHA、预算、stop条件。**

---

# 2026-10-17｜A独立验收并合并PR82：F05-7阶段1只读预检通过；正式放行镜像与写权限最小安全治理（当前最新）

- **真实合并**：[PR82](https://github.com/suzhe868-arch/mb/pull/82) A独立审签[评论](https://github.com/suzhe868-arch/mb/pull/82#issuecomment-6223026884)，受验B HEAD `03c36c2b73b3f431b74a81a03c5562e628db6f01`，4/4仅新增只读审计白名单文件。原生[Push38953128936](https://github.com/suzhe868-arch/mb/actions/runs/38953128936)和[PR38953137971](https://github.com/suzhe868-arch/mb/actions/runs/38953137971)均Node **22/22 PASS**、各有同受验HEAD官方有效非空Artifact，A读真日志；历史8个原Push Workflow/66 Job、111 Artifact仅旧SHA历史元数据，A抽核H52 52/52 Job及97份工件；Git图旧HEAD `99c38d013f67cc56975f1664120fb87c204afc3c` 为合并前main祖先。GitHub**标准合并成功**：`65cd51d53fe58c844d2f6fab181d798702a054bc`。完整[A验收裁决](07_重建工作区/F05-7_PR82_A主控阶段1只读预检独立验收及下阶段安全裁决_2026-10-17.md)。
- **限制**：此PASS严格只属于`A_ACCEPTED_PHASE1_READ_ONLY_PREFLIGHT`。B自验Markdown首行仍保留提交前`B_PREFLIGHT_IN_PROGRESS`，以A审签及同SHA官方结果为准；不改写原B历史。PR82其它旧F05 Source失败及未完结Check不得冒称全CI通过；F05五Source`SOURCE_GAP`依然OPEN，C客户端必需真构建未在main验，V1/真实客户资金/生产`NOT_READY`。**禁止旧F05-7 ref变动、Push及66历史PG16 job启动**。
- **最新唯一B主任务**：`NEXT_OWNER=B / NEXT_TASK=F05_7_FROZEN_PG16_COMPAT_SAFETY_01 / A_RELEASED_FOR_B_SAFE_COMPAT_PR_ONLY`；按[A正式完整下一施工单](07_重建工作区/F05-7_冻结PG16镜像与权限最小兼容治理_A主控下一阶段正式施工单_2026-10-17.md)从合并后最新main起新隔离分支，逐项最小修复7份F05-7冻结Workflow依赖的ECR镜像/runner本地旧祖先名别名，评估H52六处`contents:write`及跨F03 push守卫；保留8 workflow/66 Job、安全测试和Source负例，不准原ref Push；回归证据交`READY_FOR_A_REVIEW_COMPAT_PATCH`由A复核。阶段2真实原分支单次快进Push须在兼容补丁标准合并且A再签精确expected SHA/配额后才能讨论。C PR68单列R3继续Draft/不合并。

---

# 2026-10-17｜A独立验收PR79 Stage2：F05跨窗重复触发已按范围修复，C必需构建仍未验证；B恢复F05-7只读预检（当前最新）

- **实际验收成绩**：A直接按六个不同原生GitHub HEAD再查[PR77/78/80/76/81](https://github.com/suzhe868-arch/mb/pull/79)的 **52条Workflow Run / 144条Job Check**，与B提交[PR79](https://github.com/suzhe868-arch/mb/pull/79)证据一致。旧十份F05无路径限制PR触发器经PR76安全合并后，**C-only新PR不再产生无关F05**，F05-only/shared/workflow-self/mixed正向分别产生该有的10份旧F05原生Run；五条Source仍各自真实`SOURCE_GAP`失败、无删改/伪绿。A读取五份混合PR81正式Source真日志，末证据PR79 Node**36/36通过**。 [A完整独立终验报告及安全裁决](https://github.com/suzhe868-arch/mb/blob/main/07_%E9%87%8D%E5%BB%BA%E5%B7%A5%E4%BD%9C%E5%8C%BA/CI%E8%A7%A6%E5%8F%91%E6%B2%BB%E7%90%86_Stage2_PR79_A%E4%B8%BB%E6%8E%A7%E4%BA%94%E5%9C%BA%E6%99%AF%E7%8B%AC%E7%AB%8B%E7%BB%88%E9%AA%8C_F05%E8%B7%AF%E7%94%B1%E9%AA%8C%E6%94%B6%E4%B8%8EC%E6%9E%84%E5%BB%BA%E9%9A%94%E7%A6%BB%E8%A3%81%E5%86%B3_2026-10-17.md)、[PR79 A审签评论](https://github.com/suzhe868-arch/mb/pull/79#issuecomment-6222433067)。
- **严格分域**：`A_ACCEPTED_F05_TEN_WORKFLOW_ROUTING_5_SCENARIOS`，`f05_trigger_fixed=true`**只限旧十工作流跨轨PR路由**。但`C_REQUIRED_BUILD_NOT_VERIFIED`仍OPEN：正式main没有`.github/workflows/c-app-01-build-render.yml`及C客户端应用，它们仍在用户否决视觉/功能待R3验收的C PR68，C-only探针0 Run绝不能记为C端H5/微信真构建通过；因此**整体`CI_TRIGGER_SCOPE_GOVERNANCE_FIXED`、F05父链业务全域、V1/生产均未PASS**。C责任窗口待用户验收R3之后独立合入可审真实客户端工程与CI，再补测C-only/mixed真实双端CI，不在B处无限重跑10份PG16工作流。
- **最新唯一B主任务已经正式解锁**：`NEXT_OWNER=B / NEXT_TASK=F05_7_PARENT_SOURCE_CONTROLLED_RECOVERY_01`，继续[A原签F05-7阶段1只读预检施工单](https://github.com/suzhe868-arch/mb/blob/main/07_重建工作区/F05-7_首条正式来源链受控恢复实验_A主控完整施工单_2026-10-16.md)，核证8份Workflow/66历史PG16 Job、镜像/合法快进/配额/旧Source。**绝不可直接改旧F05-7原分支、Push或触发66作业；阶段2必须A再次审签**。其他四源仍未验收；C PR68继续独立，不混轨。
- PR77/78/80/81及仅证据PR79均为**不合并main**的非生产探针；A可在归档真SHA与官方Run后将它们关闭以消除临时PR噪声，不删源分支、不影响历史审计链接；不得把关闭PR视为业务验收。

---

# 2026-10-17｜A第三轮验收PR76：安全路径修改已Stage1标准合并，Stage2五场景真实验收交B（当前最新）

- **正式GitHub结果**：[PR76](https://github.com/suzhe868-arch/mb/pull/76) 最终HEAD`1864447f84ad65dcc0396d907f255fd7ccdafde4`；10份获批旧F05工作流每份只加`on.pull_request.paths`正向依赖过滤、0删减原push/dispatch、PG16/Source/Artifact/权限，36/36 Node真Push及同SHA官方Artifact通过。A签[分阶段技术裁决](https://github.com/suzhe868-arch/mb/blob/main/07_重建工作区/CI触发治理_PR76_A主控第三轮独立验收_两阶段真实回归技术裁决_2026-10-17.md)，经GitHub标准PR merge成功，**main合并SHA `a4bcd2969fd1c01fed1711a35bade78f31d6db11`**；这仅是`A_STAGE1_STANDARD_MERGED`，**不是`CI_TRIGGER_SCOPE_GOVERNANCE_FIXED`**。
- **实际After边界**：PR76自身diff必含十份F05 Workflow，无法在合并前形成真正C-only GitHub PR；A已从新main开临时草稿[PR77](https://github.com/suzhe868-arch/mb/pull/77)单个`apps/mobile/evidence/**`无业务探针，初查0 Run/0 Check（未见旧F05误触发），但C建设工作流仍在未合并的C PR68，**不能据此证明C必要CI已通过或五场景验收通过**。[完整A验收与Stage2交接报告](https://github.com/suzhe868-arch/mb/blob/main/07_%E9%87%8D%E5%BB%BA%E5%B7%A5%E4%BD%9C%E5%8C%BA/CI%E8%A7%A6%E5%8F%91%E6%B2%BB%E7%90%86_PR76_A%E4%B8%BB%E6%8E%A7%E7%AC%AC%E4%B8%89%E8%BD%AEStage1%E6%A0%87%E5%87%86%E5%90%88%E5%B9%B6%E4%B8%8EStage2%E7%9C%9F%E5%9C%BA%E6%99%AF%E4%BA%A4%E6%8E%A5%E6%8A%A5%E5%91%8A_2026-10-17.md)。
- **最新唯一B主任务**：`NEXT_OWNER=B / NEXT_TASK=CI_TRIGGER_SCOPE_GOVERNANCE_01_STAGE2_NATIVE_AFTER`；B按预算串行完成独立真正 C-only、F05-only、shared、workflow-self、mixed 真实GitHub PR后的原生Run/Check/Job/Artifact比对，旧正式Source红灯不得伪绿；探针PR全部不得合main，B交`READY_FOR_A_REVIEW_FINAL`由A最终定夺。**F05-7历史父证据恢复仍在之后排队**，不能因为Stage1合并直接恢复老66 Job。
- C PR68首页/详情仍用户视觉功能否决未合并；F05五Source缺口、F05/F08全域、V1及生产`NOT_READY`。整改真正通过应以前后真实Runner扇出和安全门禁全部核证为准，不看队列是否短暂清零。

---

# 2026-10-16｜PR76管理员配置证据已核销，A逐文件有条件批准十项F05触发整改，当前交B（最新）

- **GitHub管理员真实截图已提供**：main首页`Your main branch isn't protected`；`Settings → Branches`显示`Classic branch protections have not been configured`；原先和本次GitHub`rulesets?includes_parents=true`均`[]`。因而A认定main当前无配置的必需Checks，之前GitHub App访问classic protection 403**只属于接口权限问题，阻断已解除**；不建议此时新建保护规则干扰本次真实CI对照。
- **A逐文件审核放行**：PR [#76](https://github.com/suzhe868-arch/mb/pull/76) 中B清单列的10份旧F05 YAML，A已逐文件从main读取并校验Git Blob **10/10相同**。在原`fix/ci-trigger-scope-governance-01`分支仅书面有条件批准给这十份文件的`on.pull_request`增加经过真实依赖审计的**正向paths过滤**；**不授权**改原Source、原branch push、workflow_dispatch、PG16、Job、Source失败逻辑、Artifact、权限或历史证据，不授权现在合并。[A完整十文件白名单和回归合同](https://github.com/suzhe868-arch/mb/blob/main/07_%E9%87%8D%E5%BB%BA%E5%B7%A5%E4%BD%9C%E5%8C%BA/CI%E8%A7%A6%E5%8F%91%E6%B2%BB%E7%90%86_PR76_%E7%AE%A1%E7%90%86%E5%91%98%E5%88%86%E6%94%AF%E4%BF%9D%E6%8A%A4%E8%AF%81%E6%8D%AE%E6%A0%B8%E9%94%80%E4%B8%8E%E5%8D%81%E9%A1%B9%E6%97%A7Workflow%E9%80%90%E6%96%87%E4%BB%B6%E6%9C%89%E6%9D%A1%E4%BB%B6%E4%BF%AE%E6%94%B9%E6%94%BE%E8%A1%8C_2026-10-16.md)；[PR76 A第二轮裁决评论](https://github.com/suzhe868-arch/mb/pull/76#issuecomment-6219415444)。
- **正式下一任务**：`NEXT_OWNER=B / NEXT_TASK=CI_TRIGGER_SCOPE_GOVERNANCE_01_IMPL_PR76`；B在**原PR76**只做获准安全触发修改、严格diff合同及真实 C-only/F05-only/shared/workflow-self/mixed 五类GitHub CI BEFORE/AFTER；应有测试必须保留、无关C代码不触发十份F05。交`READY_FOR_A_REVIEW_FINAL`后由A独立验收决定合并。**此时CI触发问题尚未修好**，PR76仍Open。
- **业务门禁保持**：五个旧F05正式来源`SOURCE_GAP`及F05/F08/V1/生产`NOT_READY`未撤销；F05-7源恢复预检仍后继排队；C PR68视觉与功能R3由C独立处理，用户未通过不合并。不存在因减少PR无关触发就令历史父签自动恢复的结论。

---

# 2026-10-16｜A主控独立审核PR76：只读预检验收通过，CI实际整改因GitHub必需检查读取403受阻（当前最新）

- **A已完成独立审核**：B PR [#76](https://github.com/suzhe868-arch/mb/pull/76) 受验最终HEAD `cfa4562a915ff29475fbd640dd9c25d847c13a55`；6/6新文件在A合法白名单、旧F05/Source/PG16/业务零修改。原生最终Push [Run38924212013](https://github.com/suzhe868-arch/mb/actions/runs/38924212013) 真实Job `117051501407` Node**28/28**、有效非空官方同SHA Artifact**12054624840**（15661B，官方SHA256元数据，未ZIP复算）。322实际Workflow文件、96 F05前缀、**10份**无PR路径限制的旧F05高风险工作流，C PR68提交此前真有10份无关F05 Run。A[正式审查评论](https://github.com/suzhe868-arch/mb/pull/76#issuecomment-6219012442)及[完整独立验收报告](https://github.com/suzhe868-arch/mb/blob/main/07_%E9%87%8D%E5%BB%BA%E5%B7%A5%E4%BD%9C%E5%8C%BA/CI%E8%A7%A6%E5%8F%91%E8%8C%83%E5%9B%B4%E6%B2%BB%E7%90%86_PR76_A%E4%B8%BB%E6%8E%A7%E7%AC%AC%E4%B8%80%E8%BD%AE%E7%8B%AC%E7%AB%8B%E9%AA%8C%E6%94%B6_%E5%BF%85%E9%9C%80%E6%A3%80%E6%9F%A5%E6%9D%83%E9%99%90%E9%98%BB%E6%96%AD%E4%B8%8E%E5%8D%81%E9%A1%B9%E5%BE%85%E6%89%B9%E8%A3%81%E5%86%B3_2026-10-16.md)均已归档。
- **明确审查结论**：`A_PREFLIGHT_ACCEPTED / A_FINAL_BLOCKED_REQUIRED_CHECKS_UNKNOWN / PR76_OPEN_NO_MERGE`。A再试官方`branches/main/protection`真实403（App不具分支保护API权限）；`rulesets=[]`不证明无经典分支保护。10份旧Source/frozen候选**0份可获正式触发器修改白名单**，未实施真实C-only/F05-only/shared/mixed After对照；CI重复触发**尚未修好**。受验PR末SHA旧Source仍真实失败，不能改绿/跳过，F05五正式父证据缺口继续OPEN。
- **当前唯一真实外部阻断与下一责任**：`NEXT_OWNER=USER / NEXT_TASK=CI_TRIGGER_SCOPE_GOVERNANCE_01_REQUIRED_CHECKS_ADMIN_EVIDENCE`：仓库管理员通过GitHub网页版`Settings → Branches`及`Settings → Rules → Rulesets`核实main的**完整Required status checks context/App来源**并提供核证证据，或合规给予当前GitHub App Administration只读权限。A获证据后逐文件签约束白名单，B**原PR76**继续最小合法配置修改和五组真实After回归，A最终再验收合并。**不需要重新施工F05业务。**
- **其他轨不变**：F05-7单源正式来源恢复预检继续排在CI治理后，绝不因现在卡权限直接启动66原生Job；C PR68首页详情仍独立R3未合并。F05/F08全域、V1、生产均NOT_READY。

---

# 2026-10-16｜A正式纠正B工作顺序：CI重复触发治理优先于F05-7来源恢复（当前最新）

- **用户真实目标**：F05出现在C前端检查列表的根因是部分旧CI将任何PR→main一并拉入F05重型检验。A先排F05-7 66项历史来源试验与此目标顺序相反。GitHub核实main原指针F05-7、独立B分支尚不存在，因此调整不会撤销已发生的施工。[完整最新A技术裁决](https://github.com/suzhe868-arch/mb/blob/main/07_%E9%87%8D%E5%BB%BA%E5%B7%A5%E4%BD%9C%E5%8C%BA/CI%E9%87%8D%E5%A4%8D%E8%A7%A6%E5%8F%91%E6%B2%BB%E7%90%86%E4%BC%98%E5%85%88%E7%BA%A7%E8%B0%83%E6%95%B4_A%E4%B8%BB%E6%8E%A7%E6%AD%A3%E5%BC%8F%E8%A3%81%E5%86%B3_2026-10-16.md)。
- **唯一当前B任务已更正**：`NEXT_OWNER=B / NEXT_TASK=CI_TRIGGER_SCOPE_GOVERNANCE_01 / A_RELEASED_FOR_B_NOW`；正式[CI触发范围治理工作单](https://github.com/suzhe868-arch/mb/blob/main/07_重建工作区/CI工作流重复触发与F05跨窗口污染_A主控根因核证及定向治理正式施工单_2026-10-16.md)，从最新main开`fix/ci-trigger-scope-governance-01`。先做必要Check/冻结Source/路径矩阵清册及单独CI工具；旧Workflow须逐项A白名单后才最小修改，GitHub真实C-only/F05-only/shared/mixed验证通过才可称治理完成。
- **F05-7没有退回开发**：先前已签`F05_7_PARENT_SOURCE_CONTROLLED_RECOVERY_01`仅改为`A_SIGNED_QUEUED_AFTER_CI_TRIGGER_GOVERNANCE`；原业务已开发的事实不撤销，旧五条正式Source仍`SOURCE_GAP`，后续由A安全放行恢复；**严禁当前抢先运行66个原生PG16 Job**，不因省时篡改历史安全校验。
- **PR75事实保留**：A已标准合并[PR75](https://github.com/suzhe868-arch/mb/pull/75)（merge SHA `e1c29a4a994e70cc6c2022a22ff8bae3d153de01`），只是历史五来源核证成果。**此次更改的是正式指针和授权顺序，CI代码尚未整改完成。** C PR68继续用户否决后的R3返工不合并；F05/F08全域、V1与生产仍NOT_READY。

---

# 2026-10-16｜A正式独立验收并标准合并PR75；B下一主任务F05-7单源安全预检（当前最新）

- **PR75真实合并**：[PR75](https://github.com/suzhe868-arch/mb/pull/75) 最终受验HEAD `9e974f5c89195130c4fe4d8dfe325c7d1ef99c70`；6/6仅新增授权只读核证文件，最终Push[Run38910555545](https://github.com/suzhe868-arch/mb/actions/runs/38910555545) Node **38/38**、官方同SHA有效工件**12049464448**（11156字节、未ZIP独立复算）；五历史原Source原生日志均为**各自旧SHA**的完整成功，45工作流/348旧PG16作业为元数据候选而非新父签。A[验收评论](https://github.com/suzhe868-arch/mb/pull/75#issuecomment-6218221568)后 GitHub**标准PR合并成功** `merged:true`、主线SHA **`e1c29a4a994e70cc6c2022a22ff8bae3d153de01`**。[A完整报告](https://github.com/suzhe868-arch/mb/blob/main/07_%E9%87%8D%E5%BB%BA%E5%B7%A5%E4%BD%9C%E5%8C%BA/F05_%E7%88%B6%E9%93%BE%E6%81%A2%E5%A4%8D%E5%8F%AF%E8%A1%8C%E6%80%A7_PR75_A%E4%B8%BB%E6%8E%A7%E7%8B%AC%E7%AB%8B%E9%AA%8C%E6%94%B6%E4%B8%8E%E5%90%88%E5%B9%B6_F05-7%E4%B8%8B%E4%B8%80%E9%98%B6%E6%AE%B5%E5%AE%89%E5%85%A8%E8%A3%81%E5%86%B3%E6%8A%A5%E5%91%8A_2026-10-16.md)。
- **五项正式来源缺口保持**：PR75同SHA官方Check 30=25 success/5 Source failure。A新做GitHub祖先关系证明五旧原Branch均为当时main祖先（behind0）；但旧冻结F05-7部分PG16仍引用ECR镜像与长期宽触发风险，旧Run不可当新main同SHA签名。F05业务、F08全域、V1、客户/资金、生产均`NOT_READY`；不得伪绿。
- **唯一B主下一任务已正式转移**：`NEXT_OWNER=B / NEXT_TASK=F05_7_PARENT_SOURCE_CONTROLLED_RECOVERY_01 / A_RELEASED_FOR_B_GATED_PREPARATION`。[F05-7单源受控恢复前置完整施工单](https://github.com/suzhe868-arch/mb/blob/main/07_%E9%87%8D%E5%BB%BA%E5%B7%A5%E4%BD%9C%E5%8C%BA/F05-7_%E9%A6%96%E6%9D%A1%E6%AD%A3%E5%BC%8F%E6%9D%A5%E6%BA%90%E9%93%BE%E5%8F%97%E6%8E%A7%E6%81%A2%E5%A4%8D%E5%AE%9E%E9%AA%8C_A%E4%B8%BB%E6%8E%A7%E5%AE%8C%E6%95%B4%E6%96%BD%E5%B7%A5%E5%8D%95_2026-10-16.md)。B从最新main新建`feat/f05-7-parent-source-controlled-recovery-01`，一次性核实合法fast-forward、8个Workflow/66原生PG16 Job、ECR镜像兼容、权限、队列预算与SOURCE反例，交`READY_FOR_A_REVIEW_PREFLIGHT`；**本阶段禁止直接改旧原分支ref、禁止直接启动66Job、禁止触碰其他四个源**，A独立审核后另签具体新Push操作。
- **CI重复触发专项治理保留后继排队**：`CI_TRIGGER_SCOPE_GOVERNANCE_01`已签，等待F05-7前置评估审定后优先由A安排B专用批次；不得批量修改冻结F05工作流、随意改required checks或以队列=0冒称恢复。C[PR68](https://github.com/suzhe868-arch/mb/pull/68)仍Draft、用户功能视觉未接受，独立R3+G0~G5整改，禁止与B混轨。

---

# 2026-10-16｜A主控新增CI触发范围专项治理：已正式签发、尚未完成工作流修改（当前最新）

- **用户问题已确认为真实CI配置问题**：main共320份工作流文件、其中95份F05前缀（文件数≠待运行数）。旧F05冻结重验证工作流使用针对main的无路径限制`pull_request`触发器；真实C PR68（如Run38909035844）与B PR75（Run38910704810）都重复触发F05，CI风暴与F05五个正式父链`SOURCE_GAP`是**不同问题**。
- **A正式治理完整施工单**：[《CI工作流重复触发与F05跨窗口污染：根因核证及定向治理》](https://github.com/suzhe868-arch/mb/blob/main/07_%E9%87%8D%E5%BB%BA%E5%B7%A5%E4%BD%9C%E5%8C%BA/CI%E5%B7%A5%E4%BD%9C%E6%B5%81%E9%87%8D%E5%A4%8D%E8%A7%A6%E5%8F%91%E4%B8%8EF05%E8%B7%A8%E7%AA%97%E5%8F%A3%E6%B1%A1%E6%9F%93_A%E4%B8%BB%E6%8E%A7%E6%A0%B9%E5%9B%A0%E6%A0%B8%E8%AF%81%E5%8F%8A%E5%AE%9A%E5%90%91%E6%B2%BB%E7%90%86%E6%AD%A3%E5%BC%8F%E6%96%BD%E5%B7%A5%E5%8D%95_2026-10-16.md)；任务`CI_TRIGGER_SCOPE_GOVERNANCE_01`，状态`A_RELEASED_FOR_B_AFTER_CURRENT_F05_PARENT_CHAIN_RESTORE_FEASIBILITY_01 / NOT_IMPLEMENTED`。要求逐workflow真清册、PR68/PR75来源对照、变更路径×回归依赖矩阵、required checks核证、最小触发整改、取消过时CI、测试证据、A验收后标准PR合并。冻结业务来源与签名、旧父安全负例/工件不可伪绿或删改；required checks未知时严禁盲设paths导致永久Pending。
- **任务次序不变**：当前B主线仍`NEXT_OWNER=B / NEXT_TASK=F05_PARENT_CHAIN_RESTORE_FEASIBILITY_01`，完成并交A后才由A接续放行治理工程分支`fix/ci-trigger-scope-governance-01`；C PR68仍为用户否决后R3返工Draft。**签发施工单不等于CI已修好**，GitHub队列清零不代表历史F05 Source门禁通过。F05/F08全域/V1/生产继续NOT_READY。

---

# 2026-10-16｜A主控已独立验收并标准合并F05父来源只读审计PR72；正式放行父链恢复可行性单（当前最新）

- **GitHub真实事实**：PR [#72](https://github.com/suzhe868-arch/mb/pull/72) 受验HEAD `64152bdba1949fdeb5bcbbf0d54b1f4479d5a3ea`；7/7新增授权白名单文件；真实Push [Run38900276212](https://github.com/suzhe868-arch/mb/actions/runs/38900276212) Node 35/35＋真非特权隔离PG16 16/16双Job成功；两份最终同SHA非空未过期官方SHA256工件`12044759505/12045329248`，未独立ZIP复算。A独立读取源代码、最终Job及五份历史失败原生日志；[正式验收评论](https://github.com/suzhe868-arch/mb/pull/72#issuecomment-6216335471)。GitHub**标准合并成功**，`merged=true`，主线merge SHA **`bf0de40b6fda3285dc38cef17d47db7fa953ac10`**。完整[A验收报告](https://github.com/suzhe868-arch/mb/blob/main/07_重建工作区/F05_父来源只读审计_PR72_A主控独立验收标准合并报告_2026-10-16.md)。
- **边界未改变**：五个旧来源 `F05-7 / F05-8 / F05-9 / F05-10 / F05-10-D1` 仍是原生真实`SOURCE_GAP`（66/68同SHA官方父Job或原分支正式新Push缺失），不能把新审计和51个隔离断言的成功当成正式父签/旧全域绿灯。F05业务、F08全域、V1、真实第三方、客户资金、生产仍`NOT_READY / NO_PRODUCTION`，不得放宽旧SOURCE安全门禁。
- **B主线唯一下一指针**：`NEXT_OWNER=B / NEXT_TASK=F05_PARENT_CHAIN_RESTORE_FEASIBILITY_01 / A_RELEASED_FOR_B_READ_ONLY_FEASIBILITY`。正式[A完整工作单](https://github.com/suzhe868-arch/mb/blob/main/07_重建工作区/F05_五项正式父级来源链恢复可行性核证_A主控下一阶段完整施工单_2026-10-16.md)：B从最新main新建`feat/f05-parent-chain-restore-feasibility-01`，独立PR，只读核实五个原分支的原始Push/同SHA父链/Job/Artifact可达性，提交可执行恢复方案与动态证据；**未授权重跑原生66/68/70/72批Job、修改旧SOURCE或原分支Push**，必须等A独立新裁决。
- **C并行轨不变**：PR [#68](https://github.com/suzhe868-arch/mb/pull/68) 用户已否决C01首页与详情功能/视觉，仍`C_NEXT_OWNER=C / C_NEXT_TASK=C_APP_01_R3_HOME_DETAIL_FULL_SPEC_REBASE / PR68_NO_MERGE`；47项R3＋原R1/R2及常设G0～G5，未经验收不可合并。主B指针不被C覆盖。

---

# 2026-10-16｜A主控提高C窗口所有后续手机端页面质量门槛：正式常设门禁（当前最新）

- **用户要求**：不仅修复C01首页和详情，还要防止以后C02/C03、E01～E08获批施工时再次出现功能遗漏和低质页面。A已正式制定[《C手机端全页面统一产品功能交互视觉质量门禁》](https://github.com/suzhe868-arch/mb/blob/main/07_重建工作区/C手机端全页面统一产品功能交互视觉质量门禁_A主控常设正式规范_2026-10-16.md)及[逐页验收契约卡TSV模板](https://github.com/suzhe868-arch/mb/blob/main/07_重建工作区/手机端前端全量追踪基线/C_全部页面质量验收契约卡_统一填写模板_2026-10-16.tsv)。适用**未来经A明确放行**的C客户和E员工手机端页面、弹层、公共组件；不等于自动授权所有尚未开工页面，PC后台不自动涵盖。
- **六门禁**：G0 Final/IA/历史废弃差集→G1 A签页级完整功能/权限/状态/布局契约与C反向查漏→G2可复用的真实代码视觉token/核心模板→G3可操作UI及全合法状态/安全正反例→G4末SHA真实H5/微信CLI/320/375/390/430浏览器→G5 A**分别**验功能、交互、安全、视觉及用户关键视觉确认。C不得将“CI通过/Mock实现/无权限真实接口”说成最终产品已完成。
- **质量要求**：首屏核心业务内容突出，克制的黄灰白候选风格、文字易读、按钮约44 CSS px等效触达、合理安全区、长文本/无图/无权/加载/错误全态、素材车型匹配，无技术Mock条/假成功；同类组件共享设计标准，已被用户否决的C01旧画面不可作为模板。**维持代码优先、不强制独立Figma**。
- **当前C任务仍为**`C_APP_01_R3_HOME_DETAIL_FULL_SPEC_REBASE / PR68_NO_MERGE / USER_FUNCTION_AND_VISUAL_REJECTED`：原R1 11项、R2 8项、R3 47项与本全局门禁叠加生效；本规范只是标准签发，C修订代码和用户新版本验收尚未完成。**B唯一正式任务保持**`NEXT_OWNER=B / NEXT_TASK=F05_PARENT_PROOF_READINESS_AUDIT_01`，F05/F08/V1/生产未就绪。

---

# 2026-10-16｜A主控正式签发C01首页＋详情功能/视觉双重缺口R3整包整改（本轨优先于C原R2；B主线不变）

- **新用户裁决与根因**：用户重申A2中否决的不只是配色而是首页/详情**功能、排布、交互、素材和业务状态全面不符合原计划**。A核实原C-APP-01只放行首页+最小Mock只读详情，CI和26测试只能证明当轮既有断言通过，未建立产品规则→完整可见界面→独立用户验收的严格正反双向覆盖；A对施工粒度及前置视觉契约不足负责，C对自测与实施负责。原R1/R2继续生效。
- **正式全面整改单与47项可查清单**：[A根因复盘+R3整包施工单](https://github.com/suzhe868-arch/mb/blob/main/07_重建工作区/C_APP_01_首页详情功能视觉双重失配根因复盘与R3整包整改正式施工单_2026-10-16.md)｜[47项首页/详情/跨页面功能视觉硬门禁 TSV](https://github.com/suzhe868-arch/mb/blob/main/07_重建工作区/手机端前端全量追踪基线/C_APP_01_首页详情功能视觉全量差距与验收硬门禁_R3_2026-10-16.tsv)。C必须将本47条与旧54追踪、R1的11项缺口、R2的8项视觉条目逐项核对；当前正式PDM20默认**批发频道+全国**、首页无独立分享快捷按钮，只在详情微信分享，不能误恢复早期旧规划；筛选完整车型四层UI及详情顾问/档案/价格/锁车候补状态样板均在R3强制范围，**真实业务写入与G2不在本包**。
- **C并行轨接力**：`C_APP_01_R3_A_RELEASED / C_NEXT_OWNER=C / C_NEXT_TASK=C_APP_01_R3_HOME_DETAIL_FULL_SPEC_REBASE / PR68_OPEN_NO_MERGE / USER_FUNCTION_AND_VISUAL_REJECTED`。C原分支`feat/c-app-01-mobile-foundation-c01-code-first`/PR #68返工；需四屏真实H5首页详情、多身份与关键状态截图、H5＋Weapp CLI/新增测试及最终同SHA真工件，交A及用户对照验收。此为**A签发，C代码尚未整改**。
- **B任务不变**：`NEXT_OWNER=B / NEXT_TASK=F05_PARENT_PROOF_READINESS_AUDIT_01`；不得把C并行R3抢写为主B指针。F05业务、F08全域、V1、生产均未放行。

---

# 2026-10-16｜A主控独立验收并标准合并F05历史CI治理PR70；正式放行父来源缺口只读核证给B（当前最新）

- **A真实最终结论**：`F05_LEGACY_CI_GOVERNANCE_01_A_ACCEPTED_STANDARD_MERGED_CI_INFRA_ONLY / NEXT_OWNER=B / NEXT_TASK=F05_PARENT_PROOF_READINESS_AUDIT_01 / F05_BUSINESS_F08_GLOBAL_V1_NOT_READY / NO_PRODUCTION`。C并行轨用户已明确否决C01首页及详情视觉，`C_NEXT_OWNER=C / C_NEXT_TASK=C_APP_01_R2_HOME_DETAIL_VISUAL_REBASE / PR68_NO_MERGE`，必须保留该用户裁决。
- **正式GitHub合并事实**：[PR70](https://github.com/suzhe868-arch/mb/pull/70)受验HEAD `3ee47d9df08d9e73596be5db73ee623eb856e537`，标准merge返回`merged=true`、真实主线合并SHA `2b676929f36fcdf35cfca3e2956baaa0b439c245`。16个修改文件全部已授权；10份旧F05工作流28个PG16服务镜像改用官方DockerHub `postgres:16`，Runner仅本地别名兼容旧原生脚本，不改原分支Push、原生PG业务安全断言与Artifact强制上传。
- **独立验收证据**：[真实最后HEAD Push Run38852686876](https://github.com/suzhe868-arch/mb/actions/runs/38852686876) Node 50项只读治理合同＋真非特权PG16 24项隔离断言，双Job均`completed/success`，两份同SHA有效官方SHA256元数据工件 `12025268349 / 12025903246`（未ZIP复算）。最后同SHA真实Checks **30=25成功/5失败/0待定**；旧F05 **28=23成功/5失败**；五个失败都由A逐个读原生Job日志证实为`66/68同SHA正式父源证据不足`或`NOT_NEW_OFFICIAL_PUSH`，不是ECR限流。**严禁把旧五个失败伪绿或宣称已签父业务证明。**
- **保护与风险**：main branch-protection API仍403、Rulesets空，`required checks=UNKNOWN`；唯一确知本PR GitHub正常merge执行成功，不表示所有未来PR可豁免旧CI。Postgres镜像仍浮动tag未Digest固定；F05业务、F08全域、V1、生产、真实第三方、资金、正式父签仍`NOT_READY`。
- **正式A归档与新施工授权**：[A最终完整验收报告](https://github.com/suzhe868-arch/mb/blob/main/07_重建工作区/F05_历史CI治理_PR70_A主控最终独立验收标准合并与后续来源缺口正式报告_2026-10-16.md)；[F05正式父来源核证与缺口恢复前置CI专项](https://github.com/suzhe868-arch/mb/blob/main/07_重建工作区/F05_正式父级来源核证与缺口恢复前置CI专项_A主控正式完整施工单_2026-10-16.md)。B从执行时最新main开`feat/f05-parent-proof-readiness-audit-01`，只新增隔离只读审计工具/CI，不修改历史业务或正式父签流程；交`READY_FOR_A_REVIEW`再由A验收。C PR68原分支视觉重构和用户复评独立继续。

---

# 2026-10-16｜用户明确否决C01首页/C01-01详情当前视觉方案；A签发PR68原分支首页详情视觉重构正式单

- **用户原话**：“这页面设计的严重有问题吧详情页设计的也有问题这和我们最初规划的完全都不一致”。A已再次肉眼对照最后同HEAD真Chromium截图，裁决`C_APP_01_USER_VISUAL_REJECTED / A_R2_HOME_DETAIL_VISUAL_REBASE_RELEASED / PR68_NO_MERGE / C_NEXT_OWNER=C / C_NEXT_TASK=C_APP_01_R2_HOME_DETAIL_VISUAL_REBASE`，**取代之前的`USER_VISUAL_REVIEW_PENDING`，禁止将现行页面写成视觉已通过**。
- **实际偏差**：390真实首页有大面积文字MB示意Banner/64-2大统计/显式Mock场景与演示身份/多层小栏目，车辆展示首屏弱；卡片字号过小且示意图片车型错配；详情仅基础参数+Mock只读，收藏咨询锁车合法状态未作目标版式、底部过度突出分享并仅以灰色文字表示咨询/锁车。不能把`npm ci`、26单测、H5+Weapp真CLI、四宽Chromium成功当成用户审美/需求一致性PASS。**技术基座仍可保留，视觉必须重构。**
- [A正式视觉重构整改单](https://github.com/suzhe868-arch/mb/blob/main/07_重建工作区/C_APP_01_用户首轮视觉否决_A主控首页与详情重构正式整改单_2026-10-16.md)｜[PR68签发评论](https://github.com/suzhe868-arch/mb/pull/68#issuecomment-6208663733)。C在原PR68原分支保留安全Mock适配器/合法默认批发频道及全国/4:3卡/七排序/价格权限、重新规划首页与**详情可见视觉骨架（不拓展真实业务授权）**，将QA身份/场景控制移出客户主视觉，纠正图片/车型错配，底部按业务呈现合法的收藏/咨询/锁车与不可用状态，不冒充业务写入；保留原R1的11项专项状态补测、54行追踪、真实最终SHA证据索引，交A及用户复评。
- **主B唯一任务不变**：`NEXT_OWNER=B / NEXT_TASK=F05_LEGACY_CI_GOVERNANCE_01_R2_FROZEN_16_SERVICE_IMAGES`，C为并行轨，PR68不合并，微信真机/真实后端/版权未签/正式支付、客户资金、生产不授权。F05业务、F08全域、V1仍NOT_READY。

---

# 2026-10-16｜A主控C并行轨PR68首轮核验：双端真构建与四屏真实截图已核证，11项专项覆盖及最终SHA索引需C定向整改

- **C并行轨裁决**：`C_APP_01_A_R1_CHANGES_REQUESTED / A_BUILD_AND_CHROMIUM_VERIFIED / USER_VISUAL_REVIEW_PENDING / C_NEXT_OWNER=C / PR68_NO_MERGE / NO_PRODUCTION`。**现行B主线NEXT_OWNER/NEXT_TASK完全不变**，B继续F05历史CI技术治理；C在原PR68原分支补证，无权修改main或B/F/PDM。
- **真源码/真CI/真图**：[PR #68](https://github.com/suzhe868-arch/mb/pull/68)唯一受验HEAD `7783c54bd78e1b5156976aab036151b0debe8618`；33个变更路径全部C-APP-01白名单，相对当前main ahead51/behind95。真正Push [Run38843332659](https://github.com/suzhe868-arch/mb/actions/runs/38843332659) 与PR [Run38843336347](https://github.com/suzhe868-arch/mb/actions/runs/38843336347) 都同SHA完成成功：npm ci、26/26 Node单测、TypeScript、Taro H5+微信CLI编译、Chromium 320/375/390/430真实截图与频道/筛选/排序/详情/返回互动均通过。A已实际下载和打开最后SHA的官方截图工件 ID12022072289（非空2384189B，官方SHA256`ac800d788d0a5422b5d8e679cfdb1cc1b2d8ca905a4eb63c4dc4c758115a522f`）；已肉眼审查390首页/列表/筛选/详情及四视口首屏；用户可开始第一轮视觉讨论。**这是Mock示意图，不代表真实JYT车源、正式商业图片、微信真机或业务API已签。**
- **A发现明确待闭环**：正式54行TSV内14项Chromium/构建、26项相关单测、**11项专项行为仍PARTIAL**（ID `013,018,029,030,034,035,037,038,039,040,041`，需真实状态/安全浏览器负例），3项真实业务/微信平台未授权明确NOT_RUN；最后SHA代码虽真实绿，但`apps/mobile/evidence/证据索引.md`、C最终自验报告及54行TSV仍引用较早`4bdfa741...`/Run38842186138/Artifact12021319721，必须改成新最终SHA同版本索引再跑。最新HEAD官方30项检查20 success/10 failure（**10项旧F05真实失败不可冒充绿**），GitHub mergeable_state=unstable/required checks未知；PR68不合并。当前390页面展示文本MB Mock Banner、演示身份条、细辅助文案，**视觉效果待用户首轮确认，不能自行改版或自称已确认**。
- **C完整R1定向整改与A技术验收**：[正式A报告](https://github.com/suzhe868-arch/mb/blob/main/07_重建工作区/C_APP_01_A主控PR68首轮独立复验_双端构建已过_状态覆盖和最终证据索引整改正式报告_2026-10-16.md)｜[PR68 R1执行评论](https://github.com/suzhe868-arch/mb/pull/68#issuecomment-6208408031)。C保留原有真实构建和屏宽证据，新增11专项Chrome/负例、同期54行追踪、最终真实Push+PR工作流和有效截图工件；微信开发者工具/真机、正式Price quota/咨询/锁车/分享归属、真实API、支付、客户/资金与生产继续NOT_RUN/NOT_AUTHORIZED。C返件后交A再验，B独立主线无变化。

---

# 2026-10-16｜A核验PR70已授权12项F05 PG16镜像恢复；追加冻结5份16镜像白名单给B，暂不合并

- **正式最新裁决**：`F05_LEGACY_CI_GOVERNANCE_01_R2_A_SCOPE_EXPANSION_RELEASED / PR70_DRAFT_NO_MERGE / NEXT_OWNER=B / NEXT_TASK=F05_LEGACY_CI_GOVERNANCE_01_R2_FROZEN_16_SERVICE_IMAGES / F05_BUSINESS_F08_GLOBAL_V1_NOT_READY / NO_PRODUCTION`。原正式施工单继续有效，新追加施工单只允许修复5份冻结revalidation Workflow内16项镜像/本地兼容别名与可验证原生测试证据，不解除冻结业务与父签来源。
- **实际B交接**：[PR70](https://github.com/suzhe868-arch/mb/pull/70)仍Draft/Open/NOT_MERGED，B头 `2ac1905cda63c3a4010de2321aef121b99a2a706`，11项变更全部原授权白名单，5份主旧Workflow共12个PG16 Job改`postgres:16`并经同一Docker容器本地tag验证成功。真实Push [Run38850885960](https://github.com/suzhe868-arch/mb/actions/runs/38850885960) 双独立Job成功，Node25项独立断言+真非特权PG16 24项，共49项CI治理工具/隔离PG测试，2份同SHA非空官方SHA256工件，**未独立ZIP复算**。旧Source真实PG回归通过后仍按非原Push拒绝签父，是正确安全行为，不计PASS。
- **真实补充范围**：A从当前main逐一核对另外5份冻结工作流的16处ECR限流镜像，旧Job仍发生`toomanyrequests: Data limit exceeded`；当前B HEAD真实30 checks=21 success/7 failure/2 in_progress，旧F05 28中19 success/7 failure/2 in_progress，禁止冒称全绿，GitHub required checks=UNKNOWN（保护查询403）。允许B原PR70原分支追加16处`postgres:16`镜像改动和纯本地Docker alias验证，完整保留16旧Job真实脚本、原签Push/PR触发、Artifact与安全门禁，CI治理工具可增28项全覆盖合同测试；**不得修改业务源码/PDM/DDL/C/生产**。
- [A完整补充施工单](https://github.com/suzhe868-arch/mb/blob/main/07_重建工作区/F05_历史CI专项_PR70冻结重验证5工作流16镜像_A主控追加技术授权施工补充单_2026-10-16.md)｜[首轮核验技术裁决](https://github.com/suzhe868-arch/mb/blob/main/07_重建工作区/F05_历史CI治理_PR70_A首轮独立核验与冻结16镜像追加白名单正式裁决_2026-10-16.md)｜[PR70 A正式评论](https://github.com/suzhe868-arch/mb/pull/70#issuecomment-6208228556)。B最后唯一新SHA须真实双Job/两工件和旧28项逐Job来源分类，补齐完整中文交接后再交A最终独立验收；在此之前**A不合并**。
- 另一并行C手机端PR68仍独立、未归入B治理；F05业务、F08全域、V1仍NOT_READY；真实客户、资金、外部服务、UAT与上线未授权。**下一责任窗口B。**

---

# 2026-10-16｜A三轮正式验收并标准合并F08-1 PR69；正式放行F05历史CI专项治理给B

- **唯一现行B主任务**：`F08_1_PR69_A_ACCEPTED_STANDARD_MERGED_CI_ONLY / F05_LEGACY_CI_GOVERNANCE_01_A_RELEASED / NEXT_OWNER=B / NEXT_TASK=F05_LEGACY_CI_GOVERNANCE_01 / F08_GLOBAL_V1_NOT_READY / NO_PRODUCTION`。C-APP-01/PR68仍属独立并行轨（C已交A核审申请但本次未审/未合并），不被B主线覆盖。
- **A实际合并**：[PR69](https://github.com/suzhe868-arch/mb/pull/69) 末HEAD `f368ed870a4d432f25eb2fb1fb3915f78a4fd720`，标准GitHub PR `merge`返回`merged=true`、真实merge SHA **`3c32c845939ce7b51dd18814e212c4bf0942aecf`**。12/12仅新增F08隔离质量工具白名单文件，无改旧F05、业务/PDM/C/生产。真Push [Run38847514793](https://github.com/suzhe868-arch/mb/actions/runs/38847514793)同SHA双独立Job success，Node101真实工具断言＋PG16非特权24真实安全测试，共125项**隔离非生产测试**；2份非空有效官方SHA256工件，**未ZIP独立复算**。可信父回执默认ISSUER_REGISTRY为空，不虚报正式父签正例。三轮A安全问题A01—A04/R2-A02均已源代码核证闭环。
- **旧F05独立现实失败**：PR69同SHA全Check最后实时30＝21 success、7 failure、2 in_progress；其中F08专项2项成功，旧F05 28项中19 success、**7 failure/2进行中**。A逐Job确认6项ECR `toomanyrequests`，1项旧来源资格`F05_9_NOT_IN_OFFICIAL_NEW_PUSH`；旧失败不能当PASS。GitHub branch-protection读取403、required checks未知；仅经本PR新的变更隔离判断并由GitHub正常merge实际通过，**没有强推/移除或覆盖要求，不是下一PR默认可豁免旧CI**。
- **正式新施工单**：[F05历史CI治理](https://github.com/suzhe868-arch/mb/blob/main/07_重建工作区/F05_历史CI失败治理_A主控非生产专项完整施工单_2026-10-16.md)：B从最新main在 `fix/f05-legacy-ci-governance-01`独立PR执行；允许安全、有限调整5份指定旧主F05工作流CI资源/触发器或新建CI审计代码；禁止改旧业务实现/DDL/冻结原生安全断言、将not applicable冒充真父证据、擅改分支保护；真实同SHA Node+PG16两Job和两工件、旧28条分类、保留原真父源限定后交A独立审核。
- **完整A报告**：[F08-1三轮验收合并与F05放行](https://github.com/suzhe868-arch/mb/blob/main/07_重建工作区/F08-1_A主控PR69第三轮独立验收与标准合并_F05历史CI专项放行正式报告_2026-10-16.md)；[PR69三轮A验收评论](https://github.com/suzhe868-arch/mb/pull/69#issuecomment-6207774541)。项目F08全域、F05业务全域、V1依旧`NOT_READY`；真实第三方、客户、资金、UAT、生产无授权。**下一窗口：B。**

---

# 2026-10-16｜A二轮复验F08-1 PR69：A01/A03/A04有效，A02可信父正例接口未闭环，继续交B原PR整改

- **唯一正式B下一任务**：`F08_1_PR69_A_R2_CHANGES_REQUESTED / NO_MERGE / NEXT_OWNER=B / NEXT_TASK=F08_1_PR69_R2_A02_TRUSTED_PARENT_PROOF / F08_GLOBAL_V1_NOT_READY / NO_PRODUCTION`。A的二轮复验仅涉及F08-1非生产质量工具；C-APP-01 PR68保持C独立轨，不因本裁决改变其权责。
- **当前真实受验HEAD**：`c79c2932aa63f7c92ed9e10903a2f1323728a207`；PR [#69](https://github.com/suzhe868-arch/mb/pull/69)仍OPEN且未合并，11/11个新增文件仅在`engineering/f08/quality-evidence-gate-ci/**`和`.github/workflows/f08-1-*.yml`授权目录。真实同SHA [Push Run38843522723](https://github.com/suzhe868-arch/mb/actions/runs/38843522723)两Job success，Node83项独立工具测试、真非特权PG16 24项；官方同SHA两非空工件12022112170/12022481629有SHA256 metadata（**未ZIP独立复算**）。这些是107条质量工具/合成断言而非107条真实业务E2E。
- **通过项**：A01六种旧CI非成功态一律拒绝伪绿；A02覆盖矩阵拒绝五种非父正例来源，A03旧PR67/PR69历史快照和末SHA GitHub Checks只读运行期工件分离；A04本分支双原生成功Job、证据工件、白名单实测均真实。
- **R2-A02必须修复的剩余P0**：`quality.mjs:requireEvidence`仍能凭行内自称`SIGNED_PARENT_VERIFIED`、40位任意SHA、非空`run_id`及手造`observedCheck:{state:'success',sha:<匹配SHA>}`返回`eligible:true`；`tests/quality.test.mjs:Q14`目前甚至将该伪核验判定为正确。必须建立真实GitHub只读适配层/受信已完成检查绑定并禁止合成对象作为已签父业务正例；覆盖跨Run、跨SHA、非completed、伪provenance、未经真实外部核证的负例。**不能只靠Q78的纯函数自造结构证明真实来源**。详见[二轮正式报告](https://github.com/suzhe868-arch/mb/blob/main/07_重建工作区/F08-1_A主控PR69第二轮独立验收_可信父正例接口未闭环与旧F05十一项失败定向整改正式报告_2026-10-16.md)、[PR69正式R2整改单](https://github.com/suzhe868-arch/mb/pull/69#issuecomment-6207529903)。B仍在原分支、原PR、原白名单施工，最后新HEAD需完整真实双Job+两工件复验，B不得merge。
- **旧F05真实阻断重新分类**：最后受验SHA官方Check共**30＝19 success+11 failure**，F08-1两项均success；旧F05 **17 success+11 failure**。逐Job核实7项镜像`toomanyrequests`、4项旧来源Push或66/68项同SHA真实性门禁不足。旧F05不能伪绿或擅改冻结workflows；其专项治理在F08-1闭环后由A另发单。GitHub branch-protection读取403、`required checks=UNKNOWN`，不推断可以绕过保护。
- **安全与责任**：F08全域/V1依然`NOT_READY`；PDM、真实业务Issuer、Collector/JYT、Feishu、CDN/OSS、客户/资金、C手机端真实联调、UAT和生产均未因此解锁。**唯一下一责任窗口：B**，执行`F08_1_PR69_R2_A02_TRUSTED_PARENT_PROOF`；C并行窗口独立继续。

---

# 2026-10-16｜A独立验收F08-1 PR69未通过：证据冒充两处核心漏检，交B原PR整改（现行B主线）

- **唯一正式B主线裁决**：`F08_1_PR69_A_CHANGES_REQUESTED / NO_MERGE / NEXT_OWNER=B / NEXT_TASK=F08_1_PR69_A01_A04_EVIDENCE_GATE_REMEDIATION / F08_GLOBAL_V1_NOT_READY / NO_PRODUCTION`。本次仅审查F08-1非生产质量先导；**C-APP-01/PR68保持C并行轨独立，C需继续既有npm双端构建整改**。
- **实际审查**：[PR69](https://github.com/suzhe868-arch/mb/pull/69)最后受验HEAD `28c17745e93018d03b6df2ef45be4c965f2d95a2`、compare（当时main `c82bd5ff74def4456537e8130939d5ace56d5139`）ahead15/behind6、9/9授权白名单全新增。真正Push [Run38836345416](https://github.com/suzhe868-arch/mb/actions/runs/38836345416) Node Job116766246855真实62项独立防冒充断言+1标记、真非特权PG16 Job116766247095独立24项，共86项隔离质量工具测试全过；同SHA官方工件12019577689/12019507922非空未过期有SHA256元数据，**未ZIP独立复算**。本SHA全Check实际20 success/10 failure（旧F05：7 Docker ECR限流、3旧Push/父证据门禁），**不能当30/30绿**。
- **独立发现确定性逻辑缺口**：`quality.mjs:validateLegacy`只拒绝`queued/failure/missing`伪`success_claim=YES`，遗漏`in_progress/skipped/cancelled`；`validateCoverage`只拒绝`SIGNED_PARENT_NEGATIVE_ONLY`和`CI_SYNTHETIC_ONLY`的`positive_parent=YES`，遗漏`STATIC_CONTRACT_ONLY/NOT_RUN/SOURCE_GAP`，从而可伪造父业务正例。专项绿灯不能替代对此核心漏洞的修复。
- **完整整改**：[正式A报告](https://github.com/suzhe868-arch/mb/blob/main/07_%E9%87%8D%E5%BB%BA%E5%B7%A5%E4%BD%9C%E5%8C%BA/F08-1_A%E4%B8%BB%E6%8E%A7PR69%E9%A6%96%E8%BD%AE%E7%8B%AC%E7%AB%8B%E9%AA%8C%E6%94%B6_%E5%8E%86%E5%8F%B2CI%E4%B8%8E%E7%88%B6%E6%AD%A3%E4%BE%8B%E9%98%B2%E5%86%92%E5%85%85%E5%AE%9A%E5%90%91%E6%95%B4%E6%94%B9%E6%AD%A3%E5%BC%8F%E6%8A%A5%E5%91%8A_2026-10-16.md)、[PR69正式整改单评论](https://github.com/suzhe868-arch/mb/pull/69#issuecomment-6206802517)。B在原分支 `feat/f08-1-cross-domain-quality-evidence-gate-ci` 原PR69只改既定两个目录：A01六种非成功态禁止伪绿、A02五种非父正例来源禁止伪父正例、A03以最新受验SHA建立实时旧CI审计证据且将历史快照明确隔离、A04同末SHA双独立CI重跑/两工件/中文交接。**A未验收前不得merge**。
- **安全边界**：旧F05冻结工作流不可改、旧10失败不可撤销/伪绿或套用PR67旧豁免；生产、资金、第三方外部写入、真实客户、UAT仍未授权；C PR68 Draft不能当已验证双端页面。F08全域和V1继续`NOT_READY`。

---

# 2026-10-16｜C-APP-01 PR68 npm edgesOut安装阻断：A已定位高可信Arborist缺陷并正式放行C原分支整改（C平行轨）

- **C独立并行轨现行裁决**：`C_APP_01_NPM_EDGESOUT_INSTALL_BLOCKED / A_TECH_FIX_RELEASED / C_NEXT_OWNER=C / C_PR68_DRAFT_NO_MERGE / C_H5_WEAPP_CHROMIUM_SCREENSHOTS_NOT_RUN / USER_VISUAL_REVIEW_NOT_READY`。这只更新C轨；**正式B主线保持`NEXT_OWNER=B / NEXT_TASK=F08_1_CROSS_DOMAIN_QUALITY_EVIDENCE_CI_ONLY`不变**，避免A工程交接被覆盖。
- **GitHub证据**：[PR68](https://github.com/suzhe868-arch/mb/pull/68)保留Draft，原C分支最新受检HEAD `b0e538364d17111e1e596a3ff097bb66584f5019`、28/28授权白名单；[Run38833737548](https://github.com/suzhe868-arch/mb/actions/runs/38833737548)真Push失败Job`116758065390`：checkout、Node20.20.2/npm10.8.2成功，`npm install --package-lock-only`真实失败`Cannot read properties of null (reading 'edgesOut')`，后续npm ci/tsc/Taro H5/weapp/Chromium全部skipped，**锁文件及真实截图均未出现**。完整npm debug只在临时Runner上，尚无实际堆栈工件。旧离线26/26不能替代原生构建。
- **A最小技术裁决**：公开`npm/cli#8261,#9787,fix#8448`给出Arborist peer节点被detach后`edgesOut`崩溃及npm`11.6.0`首次修复证据；C保持Node20.20.2/Taro4.1.11/React18.3.1/TS5.6.3不动，先捕获脱敏debug、单独固定npm11.6做真实对照，再生成/提交`apps/mobile/customer/package-lock.json`和同版`npm ci`。不能未经复现宣称本项目唯一根因已证实，不可用`--legacy-peer-deps`虚造完整锁。
- **排队和防误触发**：A在本次核查时GitHub Actions `queued=17/in_progress=15`，含与C域无关旧F05工作流；C原CI Push/PR双事件需去重但不得取消/修改冻结旧F05 checks。`GITHUB_TOKEN` Bot补锁后的普通push可能不会自动触发新CI，须真实新head再次push或在对应ref上workflow_dispatch；最终只认最新单一C SHA的安装/原生测试/TS/H5/weapp/本地Chromium320/375/390/430真PNG和官方工件。
- **正式A施工单**：[C-APP-01 npm与原生双端构建阻断完整定向整改](https://github.com/suzhe868-arch/mb/blob/main/07_%E9%87%8D%E5%BB%BA%E5%B7%A5%E4%BD%9C%E5%8C%BA/C_APP_01_A%E4%B8%BB%E6%8E%A7PR68_npm%E4%BE%9D%E8%B5%96%E8%A7%A3%E6%9E%90%E4%B8%8E%E5%8F%8C%E7%AB%AF%E6%9E%84%E5%BB%BA%E9%98%BB%E6%96%AD%E5%AE%9A%E5%90%91%E6%95%B4%E6%94%B9%E6%96%BD%E5%B7%A5%E5%8D%95_2026-10-16.md)；[PR68正式A交接](https://github.com/suzhe868-arch/mb/pull/68#issuecomment-6206309405)。C按原PR68原分支白名单修复全包、真跑构建/截图、自查并向A交`READY_FOR_A_ENGINEERING_REVIEW_AND_USER_VISUAL_REVIEW`；**用户先验第一版视觉功能再集中改首页**。A不合并C草稿、不改变PDM与B/F08主线。正式C外部真实微信、客户、资金、JYT、飞书、UAT/生产保持不授权。

---

# 2026-10-16｜A标准合并F07-4 PR67，签发F08-1非生产跨域质量门禁，B主线继续（唯一最新）

- **正式唯一B工程主线**：`F07_4_PR67_A_ACCEPTED_STANDARD_MERGED_CI_ONLY / F08_1_A_RELEASED_FOR_B_CI_ONLY / NEXT_OWNER=B / NEXT_TASK=F08_1_CROSS_DOMAIN_QUALITY_EVIDENCE_CI_ONLY / F05_F06_F07_F08_GLOBAL_V1_NOT_READY / NO_PRODUCTION`。先前PR67 R2拒收单仅历史；A已结束该PR的审查与正常合并，当前主任务正式转F08-1的非生产质量先导，不表示F07全域Ready。
- **A真实合并事实**：[PR67](https://github.com/suzhe868-arch/mb/pull/67)最后受验HEAD `692e4c755e3410c569940019d042680e91f8a3fa`，A原main `7327c157f5cad88591bc9c9ac593005cfcdd09bc`，compare ahead45/behind12、9/9仅新增原授权两目录文件。GitHub标准`merge`、固定`expected_head_sha`实际返回`merged=true`；PR复查`closed/merged=true`且main真实merge SHA **`5f1e60ddd87472c7b90e230a8363db7c89a35911`**。未Force Push/改旧CI/生产操作。
- **专项真PG16及官方证据**：[Push Run38833280610](https://github.com/suzhe868-arch/mb/actions/runs/38833280610) 两非特权独立PG16 Job Source `116756623244` 92 Source+10冻结F03父负证，HTTPS `116756623541` 26个可信CA+SAN回环TLS，合计**128/128独立子例**且双Job success、真实行锁55P03及Incident清除后重判并发防重复。官方同SHA非空有效SHA256 metadata Artifacts `12018481845/12018550234`，**未ZIP独立复算**。首轮A01—A05及R2-A07源码/边界已独立查验。
- **PR67限定旧CI适用性裁决**：[A正式PR评论](https://github.com/suzhe868-arch/mb/pull/67#issuecomment-6205820963)仅认可本PR两新Push真实PG16工作流为此隔离包验收证据；受验HEAD另28个旧F05`pull_request`Job仍`queued`，**没有算PASS、没有覆盖正式required check、没有移植其它PR豁免**。GitHub RuleSets读取空；branch-protection读取受integration 403限制，故未能独立确认细节，但GitHub标准PR merge正常返回成功。28项留`A08_EXTERNAL_CHECK_PENDING`历史事实，不能推断F05整域验收通过。
- **A报告**：[F07-4 PR67三轮验收标准合并报告](https://github.com/suzhe868-arch/mb/blob/main/07_%E9%87%8D%E5%BB%BA%E5%B7%A5%E4%BD%9C%E5%8C%BA/F07-4_A%E4%B8%BB%E6%8E%A7PR67%E7%AC%AC%E4%B8%89%E8%BD%AE128%E9%A1%B9PG16%E7%8B%AC%E7%AB%8B%E9%AA%8C%E6%94%B6%E6%A0%87%E5%87%86%E5%90%88%E5%B9%B6%E4%B8%8EF08%E5%89%8D%E7%BD%AE%E6%AD%A3%E5%BC%8F%E6%8A%A5%E5%91%8A_2026-10-16.md)。**新正式完整施工单**：[F08-1跨域质量门禁非生产先导](https://github.com/suzhe868-arch/mb/blob/main/07_%E9%87%8D%E5%BB%BA%E5%B7%A5%E4%BD%9C%E5%8C%BA/F08-1_A%E4%B8%BB%E6%8E%A7%E8%B7%A8%E5%9F%9F%E5%B7%A5%E7%A8%8B%E8%B4%A8%E9%87%8F%E8%AF%81%E6%8D%AE%E9%97%A8%E7%A6%81%E9%9D%9E%E7%94%9F%E4%BA%A7%E6%AD%A3%E5%BC%8F%E6%96%BD%E5%B7%A5%E5%8D%95_2026-10-16.md)：B从开工最新main新分支`feat/f08-1-cross-domain-quality-evidence-gate-ci`独立PR，只准新增`engineering/f08/quality-evidence-gate-ci/**`及`.github/workflows/f08-1-*.yml`；代码化证据索引/覆盖矩阵/旧CI三态及缺口拒绝/最少40真断言、1真PG16+1独立Node Job与同HEAD两有效官方工件、中文交接后`READY_FOR_A_REVIEW`给A。F08-1只验**非生产质量基线**，**不是F08综合最终签收**；真实第三方、资金、客户、生产均不授权。
- **C手机端并行轨道保持独立**：C-APP-01/PR68依其自己真实状态由C负责，必须有Taro双端Build/真实Chromium四视口和同SHA官方证据后才可交A；A对B工程合并不意味着C已经验收。正式Notification Issuer/Feishu、JYT/Collector、CDN/OSS、正式F04/F05/F06跨域正向联通、C前端及UAT/生产均仍有`SOURCE_GAP`。整个V1`NOT_READY`。

---

# 2026-10-16｜A独立复验F07-4 PR67第二轮：Incident清除后的告警残留及旧CI排队，原B包定向整改（唯一最新B主线）

- **B轨正式唯一指针**：`F07_4_PR67_A_R2_CHANGES_REQUESTED / NO_MERGE / NEXT_OWNER=B / NEXT_TASK=F07_4_PR67_R2_A07_A08_INCIDENT_CLEARED_GUARD_AND_CI_RECHECK / F05_F06_F07_V1_NOT_READY / NO_PRODUCTION`。先前F07-4首轮六项整改单现属前轮历史；首轮A01—A05的源码证据已核实，**本轮只补R2-A07/A08**，不放行F07-5或F08。
- **最新A真实复验范围**：[PR67](https://github.com/suzhe868-arch/mb/pull/67)最后HEAD `4543169f1847aa5ea5ad80578294b303e9f3538d`，main当时`083e88bcab56902804a76831d08733a9f8457610`，GitHub compare ahead38/behind6且9/9文件只新增在原`engineering/f07/notification-sla-incident-gate-ci/**`和`.github/workflows/f07-4-*.yml`，未动父源或C代码。PR仍open、未合并。
- **原生CI真实通过，不掩盖阻断**：[真Push Run38829122302](https://github.com/suzhe868-arch/mb/actions/runs/38829122302)两个真实隔离非特权PG16 Job完成success：Source`116743508589` 83业务+10签名F03负证、HTTPS`116743508266` 26真CA+SAN回环TLS，**119/119独立子例**；真双Backend+行锁55P03，最后同SHA两有效官方SHA256 metadata Artifact `12016441901/12016661437`，未下载ZIP逐字节复算。首轮A01父调用数、A02 SLA未来deadline、A03 Recovery前态、A04脱敏路由日志、A05 TLS证书验签均已有整改证据。
- **R2-A07新增真实代码缺口**：`clearIncident`只把`incident_lifecycle.status`改成`cleared`，不修改旧`event.incident_active=true`。但`dispatch`中只有`incident_recovery`查锁当前lifecycle，旧`incident_active`仅看旧event flag，导致故障真正清除后仍可在新cadence时间桶再次发送模拟Active群告警，违反PDM23“故障恢复后停止重复”。必须让active告警同事务锁/查真实CI生命周期现态并增加cleared后、伪源、clear/send两Backend竞态与恢复时间倒序原生反例；仍不创造真实上游Issuer。
- **R2-A08剩余旧CI队列**：A对本HEAD真实`check-runs`核30项 **2 success/28 queued**，另10条旧F05 PR工作流还未跑完，本次没有具体旧失败码可分类。修R2-A07后B按末HEAD完整登记最新结论；仍排队明记`A08_EXTERNAL_CHECK_PENDING`，交A下一轮判断，禁止旧PR例外复用/改旧工作流/虚报全绿。
- **正式单及交接**：[R2完整补充整改单](https://github.com/suzhe868-arch/mb/blob/main/07_%E9%87%8D%E5%BB%BA%E5%B7%A5%E4%BD%9C%E5%8C%BA/F07-4_A%E4%B8%BB%E6%8E%A7PR67%E7%AC%AC%E4%BA%8C%E8%BD%AE%E7%8B%AC%E7%AB%8B%E9%AA%8C%E6%94%B6_Incident%E6%B8%85%E9%99%A4%E5%90%8E%E9%87%8D%E5%A4%8D%E5%91%8A%E8%AD%A6%E4%B8%8E%E6%97%A7CI%E9%98%9F%E5%88%97%E8%A1%A5%E5%85%85%E6%95%B4%E6%94%B9%E6%AD%A3%E5%BC%8F%E6%96%BD%E5%B7%A5%E5%8D%95_2026-10-16.md)、[PR67 A复验签字](https://github.com/suzhe868-arch/mb/pull/67#issuecomment-6205506370)。B继续原分支原PR #67，保持93 Source+26 HTTPS共119既有通过场景并增加负例，最终同SHA真实双PG16 Job/两工件/两个TSV和中文交接后签`B_SELF_TESTED/READY_FOR_A_REVIEW/NEXT_OWNER=A`。A未过验前不得合main。
- **C并行轨独立不变**：C-APP-01/PR #68仍Draft、由C继续Mock-only手机端代码，不改变其授权和目录；不能通过B整改间接把C前端宣称已完成。真实Feishu/JYT/Collector、客户/资金/图片CDN、正式Issuer、UAT/生产未授权；F05/F06/F07全域及V1仍NOT_READY。

---

# 2026-10-16｜A独立验收F07-4 PR67不通过：六项安全证据整改，B原PR继续（唯一最新B主线）

- **唯一正式B主线**：`F07_4_PR67_A_CHANGES_REQUESTED / NO_MERGE / NEXT_OWNER=B / NEXT_TASK=F07_4_PR67_A01_A06_REMEDIATION_AND_NATIVE_RETEST / F05_F06_F07_V1_NOT_READY / NO_PRODUCTION`。2026-10-15既有F07-4“已放行B施工”记录作为历史；本次为同原包A正式整改，不放行F07-5/F08。
- **A验收事实**：[PR67](https://github.com/suzhe868-arch/mb/pull/67)原分支`feat/f07-4-notification-sla-incident-gate-ci`唯一受验HEAD `984f49ca6c2d6e535efc47867bc2057ac4639fc7`，main当时`1350024a0f45e71c45bb6d4512ff6b2251e3dcef`，GitHub compare `ahead28/behind0`，9/9全部为唯一两项授权路径新增文件；PR仍`open / merged=false`，**本轮未合并**。
- **原生CI真实成功**：[Push Run38822445991](https://github.com/suzhe868-arch/mb/actions/runs/38822445991) `event=push`且最终SHA一致；两非特权PostgreSQL16独立Job `116721960097` Source63＋真F03父拒绝10，`116721960429` loopback HTTPS20，总计93/93独立子例通过；真双Backend及`55P03`已见原生Job日志。官方同HEAD Artifact `12013263644/12013829112` 非空且未过期/有SHA256元数据，**未独立ZIP复算**。旧F05其他30条Check动态快照 `9 success/11 failure/3 in_progress/7 queued`，不能冒称全绿或沿用旧PR限定例外。
- **A独立发现六项需B原包闭环**：A01回环Server静态把本地deepLinkGuard计成1次真实父权限调用（事实0次）；A02 SLA超时仅判断deadline非空，未来deadline仍可Mock发送；A03 Incident恢复未验证既有active→cleared事实转移即可Mock发送；A04 `notification_log`缺接收人/路由维度，违反PDM23/原施工单；A05回环HTTPS测试禁用TLS证书验证；A06同末SHA旧工作流红灯/排队需最终逐项实核。**这代表验收证据不足，不宣称存在真实外泄或真实飞书投递**。
- **正式A完整定向整改工作单**：[F07-4 PR67六项整改](https://github.com/suzhe868-arch/mb/blob/main/07_%E9%87%8D%E5%BB%BA%E5%B7%A5%E4%BD%9C%E5%8C%BA/F07-4_A%E4%B8%BB%E6%8E%A7PR67%E9%A6%96%E8%BD%AE%E7%8B%AC%E7%AB%8B%E9%AA%8C%E6%94%B6%E4%B8%8D%E9%80%9A%E8%BF%87_%E7%88%B6%E6%9D%83%E9%99%90%E8%AE%A1%E6%95%B0SLA%E8%B6%85%E6%97%B6Incident%E6%81%A2%E5%A4%8D%E4%B8%8E%E9%80%9A%E7%9F%A5%E8%B7%AF%E7%94%B1%E6%97%A5%E5%BF%97%E5%AE%9A%E5%90%91%E6%95%B4%E6%94%B9%E6%AD%A3%E5%BC%8F%E6%96%BD%E5%B7%A5%E5%8D%95_2026-10-16.md)；[PR67 A评论签字](https://github.com/suzhe868-arch/mb/pull/67#issuecomment-6204977355)。B仅继续原PR67/原分支、仅`engineering/f07/notification-sla-incident-gate-ci/**`与`.github/workflows/f07-4-*.yml`，全包修复、末HEAD同SHA双PG16 Push Job绿色/两真实工件、同步来源矩阵和中文交接，签`B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A`后再交A。A未验收前**B禁止合main**。
- **C手机端并行轨道完全独立**：现有`C-APP-01`代码优先授权及PR #68维持其原状态，由C自行完成、交A单独审核；本次**不修改C工作单/白名单/原前端决策/任何手机端代码**，B不能占用C分支。正式NotificationConfig/事件签名父Issuer、合法Feishu凭据及真实发送、JYT/Collector/CDN/OSS、真实客户资金、UAT/生产均未获授权，F05/F06/F07及V1全域仍`NOT_READY`。

---

# 2026-10-15｜用户确认 C 手机端代码优先并行施工，A正式签发 C-APP-01（与 B 主线并行）

- **并行 C 轨道现行 Authority**：用户确认取消单独低保真/高保真/Figma交付，改为真正可运行的前端代码、实际渲染、手机状态与自动化测试；**没有取消 PDM/IA 的正式业务规则**，也没有批准正式生产联调。
- **A已发布正式裁定与工作单**：[代码优先总裁定](https://github.com/suzhe868-arch/mb/blob/main/07_%E9%87%8D%E5%BB%BA%E5%B7%A5%E4%BD%9C%E5%8C%BA/C%E6%89%8B%E6%9C%BA%E7%AB%AF%E4%BB%A3%E7%A0%81%E4%BC%98%E5%85%88_%E5%85%A8%E9%87%8F%E5%8A%9F%E8%83%BD%E7%8A%B6%E6%80%81%E4%B8%8E%E8%B7%A8%E7%AB%AF%E9%AA%8C%E6%94%B6_A%E4%B8%BB%E6%8E%A7%E6%AD%A3%E5%BC%8F%E6%8A%80%E6%9C%AF%E8%A3%81%E5%AE%9A_2026-10-15.md)；[C-APP-01 首批正式完整施工单](https://github.com/suzhe868-arch/mb/blob/main/07_%E9%87%8D%E5%BB%BA%E5%B7%A5%E4%BD%9C%E5%8C%BA/C-APP-01_A%E4%B8%BB%E6%8E%A7%E6%89%8B%E6%9C%BA%E7%AB%AF%E4%BB%A3%E7%A0%81%E4%BC%98%E5%85%88%E5%B7%A5%E7%A8%8B%E9%AA%A8%E6%9E%B6%E4%B8%8EC01%E9%A6%96%E9%A1%B5%E7%9C%9F%E5%AE%9E%E8%BF%90%E8%A1%8C_%E9%A6%96%E6%89%B9%E6%AD%A3%E5%BC%8F%E5%AE%8C%E6%95%B4%E6%96%BD%E5%B7%A5%E5%8D%95_2026-10-15.md)。C的独立分支为 `feat/c-app-01-mobile-foundation-c01-code-first`（从真正开工最新main创建），新PR目标main；仅允许 `apps/mobile/**`、`.github/workflows/c-app-01-*.yml` 与单包 C_APP_01 对账文件；不得直接改main、B/F03～F07或PDM。
- **候选基线并非已实现**：手机端 C13+10辅助、E39+7辅助＝52主体页+17辅助入口；`07_重建工作区/手机端前端全量追踪基线/MOBILE_PAGE_STATE_BASELINE_2026-10-15.tsv`实际69行、251个**含弹层**候选状态；`MOBILE_NAV_TRACE_CANDIDATES_2026-10-15.tsv`实际151个**待核权威**导航/操作候选；Page Manifest文头140/枚举132差8仍G0 Source Gap；不得宣称全量100%完成。
- **重大并行边界不变**：**B 的正式唯一主任务独立随最新 `PROJECT_STATE.json` 推进；当前复核为 F07-4 已放行 B、`NEXT_OWNER=B`，`NEXT_TASK=F07_4_PDM23_NOTIFICATION_DND_INCIDENT_MOCK_FEISHU_PG16_CI_ONLY`，F05/F06/F07/V1仍 NOT_READY**。C仅额外独立授权隔离 Mock-only 的小程序前端工程骨架和 C01 首页/最小安全只读详情预览；不抢B任务、不称前端上线。
- **旧 H01 分支** `design/h01-design-system`仅历史参考，不在严重落后main基础上施工；新 C 交 A 的标志是 `C_CODE_IMPLEMENTED / C_MOCK_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A_FOR_C_TRACK`，A仅验收本C包，B主线状态分开记录。

---

# 2026-10-15｜A独立验收PR66标准合并，F07-4通知隔离CI正式放行（唯一最新）

- **正式唯一状态**：`F07_3_PR66_A_ACCEPTED_STANDARD_MERGED_CI_ONLY / F07_4_A_RELEASED_FOR_B_CI_ONLY / NEXT_OWNER=B / NEXT_TASK=F07_4_PDM23_NOTIFICATION_DND_INCIDENT_MOCK_FEISHU_PG16_CI_ONLY / F05_F06_F07_V1_NOT_READY / NO_PRODUCTION`。前次“F07-3 PR66待整改”现仅为历史；本段与同步后的JSON/正式施工单优先。
- **A真正标准合并**：[PR66](https://github.com/suzhe868-arch/mb/pull/66)最后B HEAD `53c1d1827f0de9b7d183247bac258e5adc54c585`，main审查点 `b019713508ab23274b07d676c9b361c3f87424df`，compare ahead28/behind6，9/9仅新增两授权路径。A已签[独立验收及PR66限定CI红灯裁决](https://github.com/suzhe868-arch/mb/pull/66#issuecomment-6193402343)，GitHub标准merge实际`merged=true`，复查PR真实closed/merged且main HEAD为 **`d90fcaa8e4e636668d6b0c1d07b4f2609a0f6a6c`**。
- **最终同SHA真PG16绿证**：[Push Run38738995738](https://github.com/suzhe868-arch/mb/actions/runs/38738995738)真非特权独立PG16 Source `116435526743` F03 47+F05 24、loopback TLS HTTPS `116435527495` 19，**90/90独立业务子场景且2/2 Job success**。F05父Vehicle/Cycle各100，父合法转换计数0并正式标 `F05_CONVERSION_POSITIVE_SOURCE_GAP`，真Vehicle两Backend PID 151/149行锁55P03、拒绝后父COUNT/MD5不变、合成nonce并发重放、HTTPS父权限拒绝码逐请求内审计均已核实。Source/HTTPS官方同HEAD非空未过期SHA256工件 `11974925747/11974921042` 仅元数据有效，未逐ZIP独立复算。
- **旧红灯原貌**：本SHA另10条旧F05 PR工作流真实4 success/6 failure；其中3个Docker `toomanyrequests`、3个旧冻结F05分支专属真正新Push证明失败（旧业务测试先过）。A只对**PR66的9新增隔离CI文件**作 `F07-3-PR66-A-CI-APPLICABILITY-01` 限定裁决，**没有假称全部Check绿、没有更改旧CI或绕过标准合并保护**，不能推广到下批及F05整域。
- **正式下一完整工作单已签**：`07_重建工作区/F07-4_A主控通知SLA免打扰Incident飞书路由审计_CI隔离正式完整施工单_2026-10-15.md`；B从实际最新main创建 `feat/f07-4-notification-sla-incident-gate-ci`、新PR，**只准新增** `engineering/f07/notification-sla-incident-gate-ci/**` 和 `.github/workflows/f07-4-*.yml`。依据PDM-23/25/15及原父签名边界，做通知事件allowlist、当前负责人/个人与公司飞书开关、23:00—08:30可配DND、事件重判去重/失败重试、Incident活跃/恢复、MockFeishu和安全日志/链接；至少40项Source真PG16与15项回环HTTPS，两个独立真PG16 Job、两同SHA官方工件。**禁止真实飞书/外网发送/客户/资金/生产迁移**；完成全包后B签`B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A`，A验收前不得合并。
- **真实缺口不变**：正式电话alias `TECH_ALIAS_PENDING_A`、F03/F05 Scope/Issuer、JYT/Collector、CDN/OSS、报告、图片、Favorite独立父正例、真实Feishu、前端/UAT/生产均未授权。F05/F06/F07全域及V1仍`NOT_READY`；A正式报告 `07_重建工作区/F07-3_A主控PR66独立验收90项PG16标准合并与F07-4通知前置正式报告_2026-10-15.md`。**下一责任B**。

---

# 2026-10-15｜A独立复验F07-3 PR66未通过，交B原PR66定向整改（唯一最新）

- **正式唯一状态**：`F07_3_PR66_A_CHANGES_REQUESTED / NO_MERGE / NEXT_OWNER=B / NEXT_TASK=F07_3_PR66_A01_A05_FULL_REMEDIATION_AND_NATIVE_RETEST / F05_F06_F07_V1_NOT_READY / NO_PRODUCTION`。原「F07-3已放行B开工」变为历史，当前是同原PR66的A整改；切勿直接合并或新建F07-4/F08分支。
- **A独立复验范围**：[PR66](https://github.com/suzhe868-arch/mb/pull/66)受验唯一HEAD `394cc5d76d3e264b193982cd958daf9917e6f9d0`，原main `6fe05ba81d6f1eb1a6c6d0308a11ffc41c5ca85f`，compare `ahead16/behind0`且**9/9仅新增授权两白名单**，冻结父源/Workflow/PDM/正式迁移均未修改；**本轮无GitHub合并**。
- **确有CI绿证，但不能替代门禁完整性**：[真正Push Run38731170875](https://github.com/suzhe868-arch/mb/actions/runs/38731170875)两独立非超级用户真PG16 Jobs成功；F03 40+F05 20+TLS HTTPS 17=77/77子例成功（不含三个父suite）；真实F03/F05物理OID 20→17957及55P03/25006负例；官方两同SHA非空未过期SHA256元数据Artifact有效（**未逐ZIP独立复算**）。旧10条F05 PR工作流审核快照为2 success/7 failure/1 in_progress；有Docker`toomanyrequests`与旧源新Push资格拒绝，不作自动例外、不冒充全绿。
- **A01—A05整改阻断**：A01 HTTPS回环Server总是403并丢弃`signedRead`结果，17 HTTPS测试不能证明逐请求真父授权拒绝原因；A02 F05父转换只断言`Array.isArray(rows)`，零行亦过，缺真实Vehicle/ListingCycle不变实证；A03两PG Backend锁登录账户而非要求的Vehicle/Publisher父行；A04合成Collector nonce重放始终相同SOURCE_GAP而非真实重复识别，三固定API函数合同缺证；A05矩阵父证据分级不准、旧红灯须本PR独立记录。**这是验收覆盖不足，不宣称已经存在生产信息泄漏**。
- **已完成A职责**：A正式整改单 [`07_重建工作区/F07-3_A主控PR66首轮独立验收不通过_HTTPS判定车辆并发与来源重放定向整改正式施工单_2026-10-15.md`](https://github.com/suzhe868-arch/mb/blob/main/07_%E9%87%8D%E5%BB%BA%E5%B7%A5%E4%BD%9C%E5%8C%BA/F07-3_A%E4%B8%BB%E6%8E%A7PR66%E9%A6%96%E8%BD%AE%E7%8B%AC%E7%AB%8B%E9%AA%8C%E6%94%B6%E4%B8%8D%E9%80%9A%E8%BF%87_HTTPS%E5%88%A4%E5%AE%9A%E8%BD%A6%E8%BE%86%E5%B9%B6%E5%8F%91%E4%B8%8E%E6%9D%A5%E6%BA%90%E9%87%8D%E6%94%BE%E5%AE%9A%E5%90%91%E6%95%B4%E6%94%B9%E6%AD%A3%E5%BC%8F%E6%96%BD%E5%B7%A5%E5%8D%95_2026-10-15.md)、[PR66 A正式评论](https://github.com/suzhe868-arch/mb/pull/66#issuecomment-6192079448)已写入GitHub；B只沿用`feat/f07-3-trusted-upstream-and-parent-source-gate-ci`与原PR66、仅原两条新增白名单，包内完成A01-A05/最后同SHA真PG16全量复跑/官方工件/B中文交接，再交A独立复验；**B绝不可自行merge**。
- **未解SOURCE_GAP和限制保持**：正式电话Alias`TECH_ALIAS_PENDING_A`、F03/F05跨版本与Issuer/Scope/当前对象、JYT Collector、真实CDN/OSS/报告H5、前端、UAT、资金、生产迁移及上线均未授权；F05/F06/F07与V1 **NOT_READY**，下一责任**B**。

---

# 2026-10-15｜A独立验收PR65标准合并，F07-3正式放行B执行（唯一最新）

- **最新唯一状态**：`F07_2_PR65_A_ACCEPTED_STANDARD_MERGED_CI_ONLY / F07_3_A_RELEASED_FOR_B_CI_ONLY / NEXT_OWNER=B / NEXT_TASK=F07_3_TRUSTED_UPSTREAM_F03_F05_SIGNED_PARENT_PHONE_IMAGE_GATE_CI_ONLY / F05_F06_F07_V1_NOT_READY / NO_PRODUCTION`。上一段“F07-2施工已放行B”现为历史，真实PR65已验收合并，不应继续重复施工。
- **A已完成标准merge**：从当时唯一main `0a976910bf5846d6266eb0b6c7943df8fe49eae9` 对[PR65](https://github.com/suzhe868-arch/mb/pull/65) B最终HEAD `6da3aef96bef06e0ae5b7e6cd3c546d92a84dcae`独立审查；`ahead46/behind0`、**12/12全部新增且全属于已签白名单**。GitHub `merge_pull_request`标准合并实际返回`merged=true`，独立复查PR`closed/merged`及main HEAD等于合并SHA **`8ff3c5b4623585a33bb8f0bc733f94939eef7493`**；[A正式验收签字](https://github.com/suzhe868-arch/mb/pull/65#issuecomment-6190886795)。
- **最后同SHA原生绿证**：[官方真正Push Run38724240811](https://github.com/suzhe868-arch/mb/actions/runs/38724240811)`completed/success`，独立真非特权PG16 Source`116386045651`、HTTPS`116386045110` **2/2 Job success**；A实际查完整原生job日志，**71业务 + 12恶意路径 + 9错误CI环境 + 1真实PG角色升级拒绝 + 20 HTTPS = 113/113独立场景全过**，真PG16版本`160015`、角色`f07_image_ci`、两PID`85/86`、行锁`55P03`、SQL`23514`回滚及Mock对象清理。两同HEAD非空未过期GitHub SHA256摘要Artifact有效（仅官方元数据，并未逐ZIP独立重算）。原历史失败Run没有隐去。
- **旧冻结红灯只作本PR限定判定**：另10条`pull_request`老F05工作流3成功/7失败，30个检查Job真实快照21 success/9 failure；9个失败为**5个ECR Docker初始化限流**与**4个旧F05自身新Push计数证明不成立**（旧源业务测试先过），不是把旧Job改绿。A仅对PR65本次12新增CI文件单独裁定`F07-2-PR65-A-CI-APPLICABILITY-01`；**不可外推至其他PR、生产、旧F05全域或bypass GitHub合并保护**，且GitHub服务端标准merge真实成功。
- **本次CI包合格≠生产已接线**：F07-2只有MockCDN/MockStorage、合成PG16 Session/Priority、合成F05转换；没有真实F03签名Session/Scope/Object、F05正式convert Issuer、JYT Collector/合法回源、真实CDN/对象存储与私有图片网关、微信/三端前端、正式DB迁移；F07-1上游电话正式敏感能力`TECH_ALIAS_PENDING_A`仍无真实业务allow，真实资金、UAT/部署均未放行。F05/F06/F07整域与V1始终**`NOT_READY`**。
- **下一正式已授权B全包**：`07_重建工作区/F07-3_A主控上游来源身份F03会话F05转换与电话图片权限集成边界_CI隔离正式完整施工单_2026-10-15.md`；B从**真实开工最新main**建新分支`feat/f07-3-trusted-upstream-and-parent-source-gate-ci`、新PR，**仅新增**`engineering/f07/trusted-upstream-parent-gate-ci/**`和`.github/workflows/f07-3-*.yml`；以PDM02/04/07/08/09 Final及真实冻结F03/F05父模块做来源/签名/当前Scope和电话图片跨域拒绝实证，最少**30真PG16 Source业务子例、12真PG16 TLS黑箱、两个独立真PG16 Job**与最后同SHA有效工件。正式未签权限Alias/Scope或父Issuer仍必须`SOURCE_GAP/DENY`，不得人造allow或真实JYT/OSS/支付。包内一次性开发、全回归、反向安全整改和中文证据归档，B签`B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A`再交A，B绝不自行合并main。A正式报告`07_重建工作区/F07-2_A主控PR65独立验收113项真PG16标准合并与F07-3前置审查正式报告_2026-10-15.md`。
- **责任结论**：A验收合并、文档、下一施工单均已完成；下一责任**B**。历史所有旧“当前状态/旧待办”仅追溯，服从本段顶部、同步后的PROJECT_STATE.json和F07-3工作单。

---

# 2026-10-15｜A独立验收PR64标准合并，F07-2仅隔离CI正式放行（唯一最新）

- **正式唯一状态**：`F07_1_PR64_A_ACCEPTED_STANDARD_MERGED_CI_ONLY / F07_2_A_RELEASED_FOR_B_CI_ONLY / NEXT_OWNER=B / NEXT_TASK=F07_2_VEHICLE_IMAGE_CDN_ASSET_DUAL_SUCCESS_REPORT_AUTH_CI_ONLY / F05_F06_F07_V1_NOT_READY / PRODUCTION_NOT_AUTHORIZED`。上一段“PR64待B定向整改”现只为旧验收历史，**不再是当前待办**。
- **A实际完成**：从当时main`f395d8e2417ed81b83d10aecbdbcaeb247e9f5bf`独立复验[PR64](https://github.com/suzhe868-arch/mb/pull/64) B最终唯一HEAD `f68a102799802dc0d18be7d2039f00b65e8de527`，16/16文件全部仅新增F07-1指定两白名单，GitHub标准merge已返回`merged=true`且PR真实closed/merged，合并SHA **`404c02c752e8bf6e4b27b8502ed4385027ff72e5`**。已签[A正式验收评论](https://github.com/suzhe868-arch/mb/pull/64#issuecomment-6188760100)。
- **A亲自核GitHub最后同SHA**：[真正Push Run38707390432](https://github.com/suzhe868-arch/mb/actions/runs/38707390432) `completed/success`，非特权真实PG16 Source与loopback HTTPS **2/2独立Job success**；Source原40例+A02数据库门禁17例+A03真实签名F03 Session拒绝7例+HTTPS15例，合计**79/79独立子场景**（4个Node父套件另外计算）。双Backend PID/txid与真PG restart证据；Source/HTTPS官方**2/2非空未过期GitHub sha256摘要Artifact**，**未下载逐ZIP重算**。A01本次两原生Job完整日志随机HMAC密钥均`***`不再明文、历史旧Run真实泄露记录保留；A02新CI环境及固定真实PG16数据库非超级用户操作前FailClosed；A03真实F03 `IsolatedAuth.withSession`和权限Reader负证通过，**电话能力技术别名`TECH_ALIAS_PENDING_A`、真正Permission/Scope/Object与生产Collector接线仍`SOURCE_GAP`，不把侧车mock身份冒充真实电话allow**。
- **额外GitHub旧红灯原样保留**：同HEAD旧F05的10个`pull_request`工作流3 success、6 failure、1 in_progress；对应9个失败Job中6个ECR Docker拉取`toomanyrequests`，另3个旧冻结Source真PG用例绿后被旧专属新Push证明拒绝。A签仅适用于本PR新增CI隔离包的`F07-1-PR64-A-CI-APPLICABILITY-01`，不宣称30/30全绿、不修改老Workflow、不泛化到下一PR；标准合并服务器实际成功。
- **A已正式签发下一B工作单**：`07_重建工作区/F07-2_A主控车辆图片路径受控CDN双成功资产化与报告权限_CI隔离正式完整施工单_2026-10-15.md`。唯一新分支`feat/f07-2-vehicle-image-cdn-asset-contract-ci`，仅**新增**`engineering/f07/vehicle-image-cdn-asset-ci/**`和`.github/workflows/f07-2-*.yml`。依PDM-08最终完整规则，从**执行时最新main**构建可销毁PG16与本机Mock CDN/对象存储/HTTPS：相对图片path+名邦受控域、首次冻结原顺序/首图Fallback、CDN HIT/MISS、双成功资产化及失败补偿/重试、合法转换不回滚、3A未闭环临时过渡、报告相册隔离、旧URL每次当前权限重检；**至少35个真PG16 Source子场景、12个HTTPS黑箱子场景、2个独立真PG16 Job且全部最终HEAD官方工件**，完整开发/自验/整改/归档后`B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A`交A。
- **明确不放行**：真实JYT/Collector、CDN或对象存储、真实车辆图片/客户信息、生产F03权限Alias/Scope、真实资金、正式数据库迁移或生产API、UI/微信端发布、UAT、F08、V1上线。**F05/F06/F07整域与V1仍`NOT_READY`**。本轮A报告：`07_重建工作区/F07-1_A主控PR64三项安全整改79项真PG16独立验收标准合并及F07-2前置正式报告_2026-10-15.md`。下方所有旧“当前/唯一最新”仅历史追溯，必须服从本页顶部、JSON和新施工单。

---

# 2026-10-15｜A独立复验F07-1 PR64未通过，正式交B定向整改（唯一最新）

- **唯一现行状态**：`F07_1_PR64_A_CHANGES_REQUESTED / NO_MERGE / NEXT_OWNER=B / NEXT_TASK=F07_1_PR64_SECURITY_REMEDIATION_A01_A02_A03_AND_FULL_NATIVE_RETEST / F05_F06_F07_V1_NOT_READY / PRODUCTION_DENIED`。正式main继续保持PR64未合并。A审查B HEAD `b3765e44741b22830213ea5e4363161ac46b8a03`、[PR64](https://github.com/suzhe868-arch/mb/pull/64)、13/13授权白名单文件及现行F07-1完整施工单；不是根据B自验报告直接通过。
- **已独立核实真实原生绿证但不能抵消安全硬阻断**：[GitHub Run38702610526](https://github.com/suzhe868-arch/mb/actions/runs/38702610526)为本SHA真正Push且成功，PG16 Source40/40业务子用例、HTTPS15/15业务子用例（Node父Suite另各1），两项PG16 Job均success；2份同SHA非空、未过期且有效GitHub官方SHA256摘要工件，未逐ZIP字节复算；真实非超级用户PG16、行锁/回滚及重启后的缓存保护均有日志。另10个旧`pull_request`事件审查时3成功/5失败/2仍执行中，保留红证、不当作当前本包2个Push的绿证。
- **A三项定向阻断**：`A01 P0` 官方Source/HTTPS Job原始日志实际打印本Run新生成的`F07_COLLECTOR_TEST_SECRET`**明文鉴权密钥**，违背不记录签名凭据的硬规则；`A02 P0` 新`contract.mjs` 的`bootstrap/reset/seed`缺真实CI repo/ref/event/非特权固定PG16环境门禁，错误`DATABASE_URL`可使测试DDL/TRUNCATE在未验环境执行；`A03 P1` F03`policy.mjs`只是纯合成facts策略函数，新增`f07_phone.sessions/employees/scope`并非已签真实F03会话的原生PG认证证据。上述不可借全绿测试越过。
- **A已签完整整改单**：`07_重建工作区/F07-1_A主控PR64首轮安全复验不通过_密钥日志隔离门禁与F03签名会话定向整改正式施工单_2026-10-15.md`，并在[PR64正式评审评论](https://github.com/suzhe868-arch/mb/pull/64#issuecomment-6187648993)记录逐项安全证据。B只沿用`feat/f07-1-collector-publisher-phone-callback-ci`及原PR64，**仅在原两条白名单内修复**，保留原40/15业务子用例，再补随机HMAC密钥GitHub日志mask、错误环境及PG16物理身份的零写入FailClosed负例、真正F03签名会话/Permission/Scope来源实证（无法合法连父接口则SOURCE_GAP连同真拒证据交A），完整重跑最终唯一SHA GitHub官方2项PG16 Job/2工件，更新中文B交接，签`B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A`。B仍不得自行合并、改父源或扩大DDL。
- **上线与后续**：正式Collector/JYT/Integration接线、生产密钥/真实号码、实际资金、UI、F07-2图片、F08总验收及V1上线均**未放行**。旧PR62 CI-only验收结果不变，本次PR64**未合并**；下文旧F07-1“施工中”仅为历史。

---

# 2026-10-15｜A已独立验收PR62标准合并，并正式放行F07-1仅隔离CI（唯一最新）

- **唯一正式主线**：`F06_5C_PR62_A_ACCEPTED_STANDARD_MERGED_CI_ONLY / F07_1_A_RELEASED_FOR_B_CI_ONLY / NEXT_OWNER=B / NEXT_TASK=F07_1_COLLECTOR_TO_INTEGRATION_PUBLISHER_PHONE_CALLBACK_CACHE_SCOPE_CI_ONLY / F05_F06_F07_V1_NOT_READY / PRODUCTION_NOT_AUTHORIZED`。A从最新main独立核验[PR62](https://github.com/suzhe868-arch/mb/pull/62) B唯一最终HEAD `e2c153996f73e46ee35e4cfe6dee21f4583b712b`，按GitHub标准merge成功，实际merge SHA **`e54872b3f92cd66b3b51bd5465670e0d6e7de3c1`**；已在main归档正式A报告与下一完整施工单。
- **A直接检查的唯一受验SHA**：22/22真正`event=push`工作流success；96/96真实非特权PG16 Jobs completed/success，H52 52/52；官方96/96非空未过期有效SHA256摘要Artifacts（**不等于逐ZIP重算字节hash**）；[核心Run38694077838](https://github.com/suzhe868-arch/mb/actions/runs/38694077838) Source主91/91+独立恢复场景1/1＝**92/92**、HTTPS9/9。S84当前候补阻断父新Priority、S85/S86无签Transaction取消COMMIT真实SQLSTATE23514全回滚、R01父唯一新签及R03移交后真取消幂等均已在实际PG16日志核实；两物理OID`68461→73512`、190旧父表COUNT/MD5和24签迁移及PG1目录Seal通过。
- **额外旧CI红证不删不冒绿**：同HEAD旧`pull_request`事件另10项——本次独立复核2 success、7 failure、1 in_progress；失败属旧父跨分支专有Push证明、部分ECR Docker初始化镜像限流；A在[PR62独立验收评论](https://github.com/suzhe868-arch/mb/pull/62#issuecomment-6186748123)对**仅本CI包**签署`F06-5C-PR62-A-CI-APPLICABILITY-01`，不推广到任何其它PR、不改旧工作流、不假报32/32绿；GitHub标准merge服务端实际许可合并。
- **下一责任B正式工作单**：`07_重建工作区/F07-1_A主控Collector发布人电话安全回传与缓存权限合同_CI隔离正式完整施工单_2026-10-15.md`。唯一分支`feat/f07-1-collector-publisher-phone-callback-ci`，从B实际开工时最新main新建；只可新增`engineering/f07/collector-publisher-phone-callback-ci/**`与`.github/workflows/f07-1-*.yml`。先按PDM-09/PDM-02/F04已签真实权限验证合成Collector→名邦Backend Integration API发布人电话回传、当前Publisher缓存/历史、缓存命中与latest、撤权与source_type转换；至少25条真PG16 Source、9条loopback TLS HTTPS、2项新真PG16 Jobs，B包内完整开发/审查/整改/回归/中文证据归档，`B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A`后交A独立验收。
- **严禁范围**：仅隔离CI，不接真实JYT或Collector凭据、外网生产、真电话号码/客户、真实支付/退款及`refund_payments`、生产Issuer、正式HTTP集成、UI端、UAT/部署或F08总验收；不得恢复`can_call_wholesale_phone`或按`car_code`缓存电话。F05/F06整域、F07整域、V1产品仍`NOT_READY`；原F06生产资金链仍是独立`SOURCE_GAP`，不得把PR62的CI验收扩大解释。
- **A正式验收报告**：`07_重建工作区/F06-5C_A主控PR62独立验收96项真PG16标准合并与F07前置分阶段放行正式报告_2026-10-15.md`；后续以本页顶部、同步后的`PROJECT_STATE.json`和正式F07-1施工单为准，下面历史记录仅用于追溯，已不再是当前待办。

---

# 2026-10-15｜A独立验收PR63标准合并，正式放行PR62对接已签PG1与C01—C03原生复验（唯一最新）

- **唯一主线指针**：`A_ACCEPTED_MERGED_PR63_CI_ONLY / A_RELEASED_FOR_B_PR62_PG1_INTEGRATION / NEXT_OWNER=B / NEXT_TASK=F06_5C_PR62_PG1_SIGNED_INTEGRATION_C01_C03_FULL_NATIVE_REGRESSION_AND_FINAL_HANDOFF / PR62_NOT_MERGED / F05_F06_V1_NOT_READY`。A受验B最新PG1 HEAD `82b30bde92291a444372f3c1627e41469fba4586`、主线审查点 `bcb5b4e8fe5442b255344840f2a6fe00ddfcd022`；实际按标准GitHub [PR63](https://github.com/suzhe868-arch/mb/pull/63)合并成功，GitHub返回 `merged=true`，**合并提交 `a8dfb9f1e78bbab4f194dbeed3076bd8c33eddad`**。A[独立验收评论](https://github.com/suzhe868-arch/mb/pull/63#issuecomment-6184723787)已归档，限 `A_ACCEPTED_CI_ONLY`，不代表F05/F06/V1整域READY。
- **A直接证据**：PR63 22/22仅新增授权PG1白名单；真实同HEAD PG16 Source [38682645219](https://github.com/suzhe868-arch/mb/actions/runs/38682645219)与HTTPS [38682645123](https://github.com/suzhe868-arch/mb/actions/runs/38682645123)、静态 [38682645218](https://github.com/suzhe868-arch/mb/actions/runs/38682645218)均 `completed/success`。C01真候补取消零插队、C02/C03假取消COMMIT拒绝23514、R01合法唯一自动新Priority、4A/4B→4C权限与资金拒绝、两物理OID `68461→73477`、190父表全行COUNT/MD5、24 Ledger与精确两Trigger一Constraint追加签名真实核实；Source/HTTPS官方非空SHA256工件11,630/6,468字节。
- **实有不绿继续保留**：旧F05跨分支指定Push证明按`F06-5C-PG1-A-CI-APPLICABILITY-01`仅对PR63独立包归类 `LEGACY_CROSS_BRANCH_NOT_APPLICABLE_WITH_ACTUAL_RED_PRESERVED`；另外3个旧重复Job真实因ECR Docker镜像 `toomanyrequests` 在初始化阶段失败，同SHA其它同类父回归成功；审查时另1旧Source还运行中。**绝不称“所有31 Checks全绿”**、也不将PR63本轮例外自动延伸至原PR62。
- **新正式施工单已签**：`07_重建工作区/F06-5C_A主控PR63合并后PR62版本化对接与C01至C03全量原生复验正式施工单_2026-10-15.md`。原[PR62](https://github.com/suzhe868-arch/mb/pull/62)仍open/unmerged，分支 `feat/f06-5c-transaction-priority-admission-ci`，B须从最新main普通非破坏性合并已签PG1，改造仅原5C白名单内版本化Catalog与安全v2入口，保持旧父FailClosed；让PR62自身原S84—S86真JYT/候补/无签取消/未知退款完整安全负例真正转绿，R01/4C/权限/双Backend和22真正Push/96真实PG16 Job/H52、官方工件全部最终同SHA再交A。不得强推/改原PG1或冻结父、删弱失败断言。
- **A完整验收记录**：`07_重建工作区/F06-5C-PG1_A主控PR63独立验收合并与PR62后续放行正式报告_2026-10-15.md`。PR62本轮尚未A接受、尚未合并；F05/F06整域与V1仍`NOT_READY`，生产资金、真实第三方/客户、UAT、F07/F08及上线未放行。**NEXT_OWNER=B**。

---

# 2026-10-15｜A核验PR63同SHA PG1真PG16三项绿证，裁定旧父跨分支Push证明不适用，放行B最终交接（唯一最新）

- **唯一正式指针**：`A_TECH_RULING_SCOPED_CI_APPLICABILITY / A_RELEASED_FOR_B_FINAL_HANDOFF / NEXT_OWNER=B / NEXT_TASK=F06_5C_PG1_PR63_SCOPED_NATIVE_EVIDENCE_FINAL_HANDOFF_AND_REVIEW_REQUEST / PR63_DRAFT_NOT_MERGED / PR62_BLOCKED / F05_F06_V1_NOT_READY`。
- **A直接核验**：main审查点 `a25fff7ccd0b79e87038330f6b783edd93071ab5`；[PR63](https://github.com/suzhe868-arch/mb/pull/63) HEAD `34e2b11212d59b06514917b54961b669411ef44f`，21/21文件仅授权新PG1目录，ahead95/behind6；同HEAD [真PG16 Source Run38673920782](https://github.com/suzhe868-arch/mb/actions/runs/38673920782)、[HTTPS Run38673920756](https://github.com/suzhe868-arch/mb/actions/runs/38673920756)、[静态Run38673920745](https://github.com/suzhe868-arch/mb/actions/runs/38673920745)均success。官方原生日志含C01—C03/R01等总门禁、独立OID 68445→73461、190旧父表与24 Ledger Seal；Source/HTTPS非空官方SHA256工件10368/6477 bytes，**A未逐字节复算工件、尚未终验源码**。
- **真实红灯继续保留**：同HEAD旧父 F05-7、F05-8、F05-9、F05-10、D1 五个 Source Job 实际 `failure`，A直接核实其最终失败因旧版指定分支/Workflow的官方新Push聚合证明在PG1修复分支不可达；不得称“全部31检查全绿”或“F05域全绿”。A**限定技术裁决** `F06-5C-PG1-A-CI-APPLICABILITY-01`：仅将这五项旧聚合Push资格在 PR63 独立CI-only包标记 `LEGACY_CROSS_BRANCH_NOT_APPLICABLE_WITH_ACTUAL_RED_PRESERVED`，不改冻结源码、不伪造结果、不降低C01—C03/正向4A/4C/资金与物理证据。
- **正式整改单已归档**：`07_重建工作区/F06-5C-PG1_A主控PR63旧父Push证明跨分支不适用_限定范围验收门禁技术裁决与B交接整改单_2026-10-15.md`。B在同PR63/同分支补逐场景日志/业务SQL行/角色/签名/两Backend/COMMIT/工件映射及最终完整中文自验交接；只有真实完备才能标 `B_SELF_TESTED / READY_FOR_A_REVIEW`，A届时独立源码/证据审查、核GitHub合并限制后才决定是否标准PR合并。本轮**不批准合并PR63/PR62**。F05/F06/V1仍 `NOT_READY`，生产、真实资金、UAT、F07/F08均未授权。**NEXT_OWNER=B**。

---

# 2026-10-15｜A独立核验PR63父级签名兼容阻断，放行同PR版本化增量验签与安全取消入口包内整改（唯一最新）

- **唯一当前指针**：`A_TECH_RULING_PR63_SIGNED_CATALOG_COMPATIBILITY / A_RELEASED_FOR_B_PG1_VERSIONED_DELTA_AND_SAFE_CANCEL_ADAPTER / NEXT_OWNER=B / NEXT_TASK=F06_5C_PG1_PR63_VERSIONED_CATALOG_AND_CANCEL_EQUIVALENCE_REPAIR / PR63_PR62_NOT_MERGED / F05_F06_V1_NOT_READY`。A以main `ca42b72f2b1308bdbef01a465ba35b54474534bd`审查，PR63 B HEAD `f0e159bbdbffca516b6ddd7c14052f882e3df57e`；[官方PG16 Run38648121814](https://github.com/suzhe868-arch/mb/actions/runs/38648121814) Job116139958565 失败，原有5B父回归/188张安装前Seal正常，安装新PG1前最终基线为**190张旧父表**，PG1追加2个public Trigger与1个constraint后冻结`getPublicStructure`固定结构签名失配，旧`verify`报`F05_10_CATALOG_DRIFT`。这是**版本化兼容阻断**，**不是**C01—C03已修复。
- **A正式技术裁决**：保留旧v24 SQL/24 Ledger、190父表、全部原F05/F06 Service/verify和旧Catalog SHA不变；允许在原PR63新增目录内实现真实全量Catalog差分（仅两个触发器+一个constraint编目）、各对象精确SHA与不可变版本签、**明确选用的新版本安全4A/4C等价取消入口**，旧冻结4A/4C在新增Catalog后仍须FailClosed，不得假报其原二进制入口可用。真实调用前后需证明权限/锁序/签名/原子性和业务等价，严禁伪造public状态或绕过旧服务鉴权；若等价安全入口无法在新增目录闭合须实证再报最小例外，不得修改旧父。
- **正式包内补充施工单**：`07_重建工作区/F06-5C-PG1_A主控PR63父签名兼容阻断_版本化目录验签与安全取消入口补充施工单_2026-10-15.md`。B沿用`fix/f06-5c-pg1-parent-priority-guard-ci`及草稿[PR63](https://github.com/suzhe868-arch/mb/pull/63)，仅`engineering/f06/transaction-priority-parent-gate-ci/**`、`.github/workflows/f06-5c-pg1-*.yml`，一次性完成兼容性正反、C01—C03及R01/4B→4C正向、双Backend原生PG16、旧190封印、同最终SHA全绿和中文交接。未达`READY_FOR_A_REVIEW`之前**不合并PR63**；原[PR62](https://github.com/suzhe868-arch/mb/pull/62)继续红灯；F05/F06/V1、生产资金/UAT/F07/F08仍`NOT_READY`。**NEXT_OWNER=B**。

---

# 2026-10-15｜A第四轮复验PR62：确认F05-8父自动Issuer真实跨域3项红证，放行独立F06-5C-PG1父层CI版本化补丁（唯一最新）

- **当前唯一正式指针**：`A_REVIEW_CONFIRMED_F06_5C_PARENT_AUTO_ISSUER_SECURITY_RED / A_RELEASED_FOR_B_F06_5C_PG1_PARENT_AUTO_ISSUER_SIGNED_CI_GUARD / NEXT_OWNER=B / NEXT_TASK=F06_5C_PG1_NEW_BRANCH_NEW_PR_SIGNED_UPSTREAM_GATE_REPAIR / PR62_BLOCKED_UPSTREAM_NOT_MERGED / F05_F06_V1_NOT_READY`。A受验最新main `2c185a59eac7d06102329ec8c7afad30179b3889`；PR62报告HEAD `f3fe4bf39f2c28f62f598cfcd9f24f90fe3e2b61`，实际原生红证代码SHA `96ce3c725d6279a9a67b1fbdef46e1f113454cfa`；PR62 38/38变更仅现行授权独立CI目录，未动父/24签迁移，不合并。
- **独立证实安全失败**：官方F06-5C真实非特权PG16 [Run38641938789](https://github.com/suzhe868-arch/mb/actions/runs/38641938789)，Source Job116119360131 `88项/85 pass/3 fail`、HTTPS Job116119359691成功。C01原真JYT high Match+签名有效Waitlist+5B交易→4A合法Cancel，冻结F05-8触发器却创建Priority12，突破候补；C02仅伪public取消、无4A/4C原签时同PG Savepoint生成Priority8；C03未知pending退款+伪public取消同Savepoint生成Priority9。C02/C03均回滚，不是已提交线上事件。**本轮必须保持RED，不能用旧HEAD 22/96全绿掩盖。**
- **A技术裁决**：风险根源在旧`000024_priority_ci.sql`自动父源写入位置，5C下游无法阻止提前发生的父INSERT。**不改旧v24签名文件、不回写原24 Ledger**；在原PG原子发行边界，以新追加版本化**CI-only Sidecar/触发器+可信终态时序**补签名Waitlist/3B/5B/4A/4B/4C/退款全链Guard。尤其原4A/4C实际是先更新public status、再写合法cancel origins/events/request key，须正确处理事务内临时不完整、只在完整可信源后合法签发；不能错误拒绝4A合法取消。原R01无候补且全签合法自动唯一Priority裁决继续成立。原190父表与24 Ledger升级前原封印，升级后只准精确审计签名白名单对象增量与旧业务历史不变；不能冒充新版Catalog与旧版全字节相同。
- **完整独立新工程单已正式签发**：`07_重建工作区/F06-5C-PG1_A主控冻结F05-8父自动签发跨域越权_版本化补丁与独立原生PG16修复正式施工单_2026-10-15.md`。B在**新分支**`fix/f06-5c-pg1-parent-priority-guard-ci`（从最新main）和**独立新PR**实施，只许新增`engineering/f06/transaction-priority-parent-gate-ci/**`与`.github/workflows/f06-5c-pg1-*.yml`，不得改原PR62/冻结父源码/旧迁移。先真实修好C01—C03且补合法取消/伪签/资金和双Backend原生回归、完整旧父与新对象签名后交A；A验收合并PG1后再放行原PR62对接/重新全量验收。**本轮不合并PR62；F05/F06/V1仍NOT_READY，资金生产/UAT/F07/F08均未授权。**

---

# 2026-10-15｜A第三轮独立复验F06-5C PR62：R01父签唯一签发技术裁决通过，候补/伪取消/资金组合风险补证后再合并（唯一最新）

- **唯一正式指针**：`F06_5C_A_TECH_RULING_R01_SCOPED_ACCEPTED / F06_5C_A_CHANGES_REQUESTED_PARENT_AUTO_ISSUER_CROSS_DOMAIN_PROOF / PR62_NOT_MERGED / NEXT_OWNER=B / NEXT_TASK=F06_5C_PR62_PARENT_AUTO_ISSUER_SIGNED_WAITLIST_CANCEL_REFUND_REGRESSION_CI_ONLY / F05_F06_V1_NOT_READY`。A核验B最终HEAD `a54f4628e29354a207619f0d2a0cfe2896bb833a`、main审验点 `d0904e22e68484e92424e241e35b2b23445911f4`，compare ahead40/behind9；37/37均仅授权新增CI文件。
- **真实通过**：同SHA官方22/22真正Push工作流success，A逐Run读取96/96真PG16 Jobs success（H52 52/52）、96/96官方有效非空同SHA sha256 Artifact元数据（未逐ZIP字节复算）；F06-5C Run38633271578 Source85/85与HTTPS9/9真PG16，Scenario OID68456→Audit OID73479、190旧父表全量COUNT/MD5、24 Ledger/Catalog/D1和父签名PASS。R02真实5B COMMIT后签名交易排他与不同Backend、R03原4B→4C跨负责人移交取消/deny/scope/幂等原生通过；R04 43候选剔6辅助为B自核37业务独立用例，A未自动认可最终独立数。
- **R01技术裁决（已完成）**：冻结F05-8在4A合法Cancel COMMIT按真实Match源触发器自动签唯一**新**Priority（`source-create:/source-created:`），旧ended Priority不复活；随后两个F06-5C真实Backend正确`F06_5C_EXISTING_ACTIVE_PRIORITY`，不能要求再次签发第二笔Priority；另S52已证5C在无占用时调用原父签发。A接受**这一窄范围CI事实**，不是冒称5C在取消后亲自发新Priority，更不授权生产。
- **实质未闭合风险**：A复核冻结`engineering/f05/priority-arbitration-ttl-handover/000024_priority_ci.sql`自动签发源函数未显式检查Waitlist、Refund/Payment、5B Guard/4A Cancel签名；父触发器可能先于5C安全准入执行，现有S66缺真批发Match、S61仅Savepoint验5C只读函数，尚不足以证明候补与假取消/资金无法导致父自动抢发。**缺少跨域实测，不等于已发现真实资金或线上事件**。额外旧PR工作流本次查询5 success/4 failure/1运行中，不能称所有检查绿灯；细项保护接口403，不伪称已核清required。
- **A已正式签同包技术补证施工单**：`07_重建工作区/F06-5C_A主控第三轮复验_R01父触发器技术裁决与候补资金签名补证施工单_2026-10-15.md`。B在原PR62/分支、原两个CI新增目录只补C01—C05组合实证/代码审计/矩阵与最终新SHA全量回归。若冻结父真违反已有候补/资金签名约束，B不得越界改父，应出红证交A另放行合法父修复。**PR62不合并；NEXT_OWNER=B；资金、生产、UAT/F07/F08及F05/F06/V1继续NOT_READY**。

---

# 2026-10-15｜A第二轮独立复验PR62：68项PG16全绿但取消后正向签发与真实竞态缺证，不合并（唯一最新）

- **正式唯一最新指针**：`F06_5C_A_SECOND_INDEPENDENT_REVIEW_CHANGES_REQUESTED_PR62 / PR62_NOT_MERGED / NEXT_OWNER=B / NEXT_TASK=F06_5C_PR62_SECOND_REVIEW_POSITIVE_CANCEL_RACE_HANDOFF_REMEDIATION_CI_ONLY / F05_F06_V1_NOT_READY`。A核验 `main` 审查基点 `7bf416c02f82ee779585a6131053101d2efb2457` 与 B最终HEAD `7936b4f1dcce6897dc1317200653a4ed6ae1a877`：compare ahead34/behind2；36/36均为授权 CI 白名单新增文件，PR62尚未合并。
- **A独立核验的原生事实**：同HEAD真正Push工作流22/22成功；H52 Run 38617845356官方52/52真PG16 Jobs成功；F06-5C Run 38617845865 Source68/68、HTTPS9/9，真正PG Scenario OID68454销毁→独立Audit OID73477、190旧父表全行COUNT/MD5及24迁移/Catalog/D1/父签名保全。B报告全部96/96 Jobs、96官方工件与32 ZIP逐字节校验；A本轮没有逐一复算全部96 Job/工件和ZIP，不能冒称已独立复算。另有旧pull_request工作流4成功/6失败（冻结事件签名/镜像限流等），不能称所有PR检查全绿。
- **第二轮实质阻断**：S57只排除部分旧错误码而未断言5C取消后的真正正向新签发；S65中合法4A取消后新Priority系原F05-8冻结源触发器自动创建，两个5C Backend请求均因已存在active Priority拒绝；另一段5B/5C真实竞态5C败因是`ACTIVE_LOCK`而非有签名的Transaction占用；4B/4C跨负责人原生取消链尚无同等级父API测试；68项含大量环境和参数断言，不能替代≥36个独立有效业务场景。首轮3B历史/4A签名/5B Guard及Waitlist的已修复事实保留，不倒退。
- **A已签同包第二轮完整整改单**：`07_重建工作区/F06-5C_A主控PR62第二轮独立复验_真实签发竞态与跨负责人终态整改施工单_2026-10-15.md`，B仅可沿用PR62与原分支、原CI隔离白名单，按R01—R05整改、验证最终新SHA并重新交A独立复验。生产Issuer/资金/真实用户数据/UAT/F07/F08及F05/F06/V1仍`NOT_READY`。**NEXT_OWNER=B**。此为既有产品规则下技术验收裁定，**不构成新PDM产品裁决**。

---

# 2026-10-15｜A独立复验F06-5C PR62：真Push与双OID已核，交易取消来源和真实原子并发验收未过（唯一最新）

- **唯一当前正式指针**：`F06_5C_A_INDEPENDENT_REVIEW_CHANGES_REQUESTED_PR62 / PR62_NOT_MERGED / NEXT_OWNER=B / NEXT_TASK=F06_5C_PR62_CANCELLED_TRANSACTION_SIGNED_TERMINAL_AND_ATOMIC_RACE_REMEDIATION_CI_ONLY / F05_F06_V1_NOT_READY`。GitHub main 基点 `708697bd2cabd3dfbd14adb79e04ba0a2af3058e`，B正式交接最新 SHA `3b406c09f92c351d1f953521b538f66e8ff231b7`，A从 PR #62 独立复核 34/34 新增 CI 白名单、22/22 同SHA真正Push工作流成功、H52 52/52 官方原生作业、5C Source56/56 与 HTTPS9/9、190张旧父全量签与Scenario OID68461→Audit OID73484。B另报告96/96 Jobs及32份ZIP实物哈希，A未在本轮重新逐字节抽验32 ZIP。
- **A独立拒收的实质性缺口**：5C适配器把冻结3B不可变 `in_progress` 来源与4A/4C合法更新为 `cancelled` 的public终态视作错误漂移，导致合法取消后始终拒绝新Priority；未完整验签5B Guard、4A/4C取消签名与资金Refund，现有S42双Backend只是两败负例，缺真正合法正向竞争与已取消后新签发矩阵。PR另有额外 pull_request 检查失败（含Docker镜像限流），需分类；PR正文/权限矩阵仍旧阻断口径。**不能凭22个Push成功替代业务验收**，PR62不合并。
- **A已下达同包正式完整整改单**：`07_重建工作区/F06-5C_A主控PR62独立验收未通过_交易取消来源与原子并发整改施工单_2026-10-15.md`，B只在原分支/PR62与原两个新增CI目录整改、补真实业务/签名/并发/撤权、复核额外CI、最终SHA全量回归和证据归档；合格后重交A独立验收。资金、生产、完成成交、真实用户数据、UAT/F07/F08、F05/F06/V1仍 `NOT_READY`。**NEXT_OWNER=B**。

---

# 2026-10-14｜A主控PR62独立核验：F06-5C两项上游技术裁决与包内整改正式放行（唯一最新）

- **当前唯一正式指针**：`F06_5C_A_CHANGES_REQUESTED_TECH_UNBLOCKED_CI_ONLY / PR62_DRAFT_NOT_MERGED / NEXT_OWNER=B / NEXT_TASK=F06_5C_PR62_A_TECH_RULING_REMEDIATION_CI_ONLY / F05_F06_V1_NOT_READY`。本次是A工程裁决，**非A验收通过**、非生产授权。
- **PR62**：基点main `4d9dfc7aff880d4e02f8a6d4f5d9a5ed5e80d2dd`，B复核HEAD `3ce3d2887fb72c1dc8c1b4d2a5579add3e70be7f`；ahead3/behind0，34/34全在授权新增目录；B仍标记草稿与BLOCKED_UPSTREAM、未READY。官方PG16 Source Run38558804382 Job115834619132 真实OID68454旧父表190（并非施工单误记192）。旧5B前188+5B两表=190；5C自身仅新加1表，因此A技术勘误：**封印前后必须190张原父表全量COUNT+MD5及所有签名；5C一表另验**，不得假增表。冻结F05-8 `arbitrateCI`可通过有边界的`auth.withSession`包装在原物理事务与Vehicle FOR UPDATE内先行双源核验，然后继续调用原签名仲裁，禁止两事务TOCTOU与直接INSERT假发行；不成功则FailClosed。现有36项Source多属假Token/配置测试须补真实业务正反和跨Backend。最新SHA Push尚未全绿且F06-4B HTTPS存在EADDRINUSE端口49028失败。
- **A签正式完整补充整改施工单**：`07_重建工作区/F06-5C_A主控PR62上游接口与190旧父表原子签发技术裁决_包内整改补充施工单_2026-10-14.md`；在原分支/PR62且仅原白名单包内实现、真实两OID旧父封印、合法真Priority正向/并发、22真正Push/96真PG16 Job/H52 52/≥32官方SHA256 Artifact后再交A。PR62不合并；资金/生产/UAT/F07/F08及V1仍NOT_READY。**NEXT_OWNER=B**。

---

# 2026-10-14｜F06-5B A独立验收PR61标准合并；F06-5C Transaction占用与新Priority排他CI隔离工作单放行（唯一最新）

- **唯一正式最新指针**：`F06_5B_A_ACCEPTED_MERGED_PR61_CI_ONLY / F06_5C_A_RELEASED_FOR_B_CI_ONLY / NEXT_OWNER=B / NEXT_TASK=F06_5C_TRANSACTION_PRIORITY_ADMISSION_ATOMIC_GUARD_CI_ONLY / F05_GLOBAL_NOT_READY / F06_GLOBAL_NOT_READY / V1_NOT_READY`。
- **A已独立验收且实际GitHub标准合并PR #61**：B唯一受验HEAD `c7ab2336a425075b4ac4cfaf7203e2987deab98a`、基点 `5f4a7e02ae9a9362104cd1081840fe9a8a1b733f`，compare ahead30/behind0，34/34全部仅授权新增CI目录；官方21/21真正同HEAD Push、94/94真实非特权PG16 Job（H52官方52/52）、94/94有效同SHA官方sha256 Artifact、Source54/54、HTTPS9/9、旧188表COUNT+MD5及24迁移、D1、9父Sidecar不漂移，实物OID63416销毁→独立审计OID68456。A[独立验收签署](https://github.com/suzhe868-arch/mb/pull/61#issuecomment-6166703241)明确`F06_5B_A_ACCEPTED_CI_ONLY`；[PR61](https://github.com/suzhe868-arch/mb/pull/61) GitHub返回merged=true、实际标准合并SHA`1a9b87a2e109190fff0380bbe85e7702a95dcd5e`。完整报告：`07_重建工作区/F06-5B_A主控独立验收21条Push94项PG16与94工件_PR61标准合并正式报告_2026-10-14.md`。
- **技术边界**：新增独立5B版本化安全转换入口在同一真PG事务排除旧Lock已pending Refund；S53–54仍现场证明旧冻结F06-3B入口不安全，旧缺口 `UPSTREAM_F06_3B_LOCK_PENDING_TRANSACTION_CONVERSION_GAP` **没有**因新增安全入口而被视为父源码修复，禁止在任何生产入口复用。5B仅`A_ACCEPTED_CI_ONLY`。
- **A下一独立CI-only技术工作单已正式放行**：根据已签PDM-19§15、PDM-13 Priority与PDM-02/17/18/25，在不改变原Priority/Lock/Transaction父实现情况下，仅新增 `engineering/f06/transaction-priority-admission-ci/**`、`.github/workflows/f06-5c-*.yml`；在真PG同Vehicle锁下测试有效Transaction在途时新Priority准入拒绝、已由Lock结束的Priority不能复活、取消后不能复活、跨Backend竞争、权限/Scope与旧父签名；若父签接口无法安全调用必须FailClosed，禁止声称生产Priority入口已改。工作分支`feat/f06-5c-transaction-priority-admission-ci`，完整施工单`07_重建工作区/F06-5C_A主控Transaction占用与Priority新建排他原子仲裁_CI隔离完整施工单_2026-10-14.md`。B包内开发、自验、正式PR交A，禁止自行合并。
- **保留禁令**：任何真实完成成交、refunded及refund_payments资金支付、银行微信收退、生产Transaction/Refund/Priority Issuer、真实个人数据、UAT/线上迁移/部署/F07/F08均未放行。F05/F06整域、C/H01、V1仍`NOT_READY`。**NEXT_OWNER=B**。

---

# 2026-10-14｜F06-5A A独立验收PR60标准合并；F06-5B旧Lock待退与Transaction转换前置排他CI隔离工作包放行（唯一最新）

- **唯一正式最新指针**：`F06_5A_A_ACCEPTED_MERGED_PR60_CI_ONLY / F06_5B_A_RELEASED_FOR_B_CI_ONLY / NEXT_OWNER=B / NEXT_TASK=F06_5B_PRETRANSACTION_LOCK_REFUND_PENDING_ATOMIC_GUARD_CI_ONLY / F05_GLOBAL_NOT_READY / F06_GLOBAL_NOT_READY / V1_NOT_READY`。
- **A已完成独立核验及标准合并**：[PR #60](https://github.com/suzhe868-arch/mb/pull/60)，B唯一受验HEAD `6695c9328ea81dd984d6404d9d7393fe153d693d`，compare ahead31/behind0，32/32仅新增CI隔离白名单；GitHub官方**20/20同HEAD真正Push、92/92真实非特权PG16 Job(H52官方52/52)、新Source82/82 HTTPS9/9、92/92份有效本HEAD sha256 Artifact**；业务真实物理OID`58366`真实销毁→独立审计OID`63421`，旧**184张**public/D1/八父实体逐表全行COUNT+MD5及24迁移Ledger/Catalog/Sidecar Seal全保全。A[正式验收签署](https://github.com/suzhe868-arch/mb/pull/60#issuecomment-6164442173)，GitHub按expected HEAD标准merge `merged=true`，**实际merge SHA`5d45a6bdb1debc9db6a79a16e9c8b9b177fb5afb`**。中文A独立报告：`07_重建工作区/F06-5A_A主控第三轮独立验收82项Source92项PG16与92工件_PR60正式合并报告_2026-10-14.md`。
- **A技术裁决并正式仅放行F06-5B独立修复包**：F06-5A真实签名PG16 S69～71暴露**旧F06-3B在旧Lock Refund已pending时仍可能Lock→Transaction转换**；虽F06-4A/5A FailClosed，不代表原转换安全。正式漏洞 `UPSTREAM_F06_3B_LOCK_PENDING_TRANSACTION_CONVERSION_GAP`；以PDM-19§21现有Authority，在最新main独立分支`feat/f06-5b-lock-refund-conversion-guard-ci`新增**独立版本化原子转换CI入口**，仅新增 `engineering/f06/lock-refund-conversion-guard-ci/**` 和 `.github/workflows/f06-5b-*.yml`，不得改冻结父源码；旧3B未修复入口不得被声明安全。完整施工单：`07_重建工作区/F06-5B_A主控旧Lock待退款禁止Transaction转换原子前置守卫_CI隔离完整施工单_2026-10-14.md`。目标21真实同SHA Push、94非特权PG16 Jobs(H52 52)、新Source≥40 HTTPS≥9、≥30官方sha256 Artifact、双真实物理OID与旧≥188表全行Seal。B包内整改/自验/交A，不自行合并。
- **持续阻断**：旧3B pending Lock转换漏洞、任何生产Transaction/Refund Issuer、真实`refunded`、`refund_payments`、实际现金银行微信收退款、completed成交、生产身份/数据/迁移、UAT部署上线、F06-3C-2/F07/F08；F05/F06整域及C/H01、V1继续 `NOT_READY`。**NEXT_OWNER=B**。

---

# 2026-10-14｜F06-4C 19 Push/90真PG16与135工件A独立验收PR59标准合并；F06-5A已取消Transaction侧合成Refund pending/closed仅CI完整施工单放行（唯一最新）

- **正式唯一最新指针**：`F06_4C_A_ACCEPTED_MERGED_PR59_CI_ONLY / F06_5A_A_RELEASED_FOR_B_CI_ONLY / NEXT_OWNER=B / NEXT_TASK=F06_5A_CANCELLED_TRANSACTION_REFUND_PENDING_CLOSED_CI_ONLY / F05_GLOBAL_NOT_READY / F06_GLOBAL_NOT_READY / V1_NOT_READY`。A独立核验PR [#59](https://github.com/suzhe868-arch/mb/pull/59)，B唯一受验HEAD`2258c9831e0b9059a8612c938c730fc6a538e072`，compare ahead4/behind0，30/30新增、纯授权CI白名单。GitHub官方**19/19同SHA真正Push success、90/90实际非特权PG16 Job success（H52官方Job完整52/52）、Source102/102（含新54）、HTTPS9/9**，**135/135官方本SHA非空有效sha256 Artifact**；真正旧业务情境库OID53416 DROP→独立审计OID58367，**180张**旧父全表COUNT+MD5与24 Ledger/Catalog/D1/七父Sidecar保全。正式中文A报告`07_重建工作区/F06-4C_A主控独立验收19条Push90项真PG16与135份证据_PR59标准合并正式报告_2026-10-14.md`。
- **A正式签署并GitHub标准合并PR59**：[A独立审查签字](https://github.com/suzhe868-arch/mb/pull/59#issuecomment-6161319870)，锁`expected_head_sha=2258c9831e0b9059a8612c938c730fc6a538e072`实际`merged=true`，**merge SHA`252fd551713eb7bbb64fce956c17c362368d2116`**。仅认可非特权可销毁PG16合成的4B移交后当前合法Responsible在权限Scope重验下安全Cancel，`TRANSACTION_CANCEL_CARRIER_SOURCE_GAP`、生产Handoff/Cancel Permission Issuer缺口不消失；无生产交易/资金/完成成交/退款。
- **A正式只放行F06-5A独立下一CI工程包**：完整工单`07_重建工作区/F06-5A_A主控PDM19已取消Transaction合成Refund申请pending与无付款closed_CI隔离完整施工单_2026-10-14.md`，按用户已签PDM-19 §§19–26，在真正最新main新建`feat/f06-5a-transaction-refund-pending-ci`及独立PR，仅新增`engineering/f06/transaction-refund-ci/**`和`.github/workflows/f06-5a-*.yml`，只模拟**已取消Transaction**且原签余额可信时Transaction侧Refund`pending`申请与明确无实际付款`closed+close_reason`，守Lock XOR Transaction、旧Lock Refund冲突、公海保护、现时业务Responsible权限及资金只读；**不得真实`refunded`、真实退款确认、付款凭证或生产Issuer**。目标**20真正Push/92真PG16 Job(H52 52)/Source≥44 HTTPS≥9/≥28本HEAD官方sha256 Artifact/双真实PG OID与旧≥184实体全行Seal**；B全包自验并中文交A，不合并。
- **继续阻断**F06-3C-2任何实际Refund refunded、completed成交、真正员工Customer或第三方银行微信收退款、生产迁移/服务/UAT/部署上线/F07/F08；F05/F06整域、C/H01及V1均`NOT_READY`。**NEXT_OWNER=B**。

---

# 2026-10-14｜F06-4B 18 Push/88真PG16与133工件A独立验收PR58标准合并；F06-4C移交后安全取消隔离CI完整施工单放行（唯一最新）

- **唯一正式最新指针**：`F06_4B_A_ACCEPTED_MERGED_PR58_CI_ONLY / F06_4C_A_RELEASED_FOR_B_CI_ONLY / NEXT_OWNER=B / NEXT_TASK=F06_4C_POST_HANDOFF_CURRENT_RESPONSIBLE_CANCEL_CI_ONLY / F05_GLOBAL_NOT_READY / F06_GLOBAL_NOT_READY / V1_NOT_READY`。A独立检查PR [#58](https://github.com/suzhe868-arch/mb/pull/58) 受验B唯一HEAD `89bab5f2452438f5cdfd74f2d95ef7885652db87`，compare ahead3/behind0，29/29全部新增CI白名单；官方**18/18真正同HEAD Push工作流success，88/88独立真实PG16 Jobs success（H52官方Job API完整52/52）**、新Source **48/48**、HTTPS **9/9**，原生 **133/133** 非空未过期同SHA sha256 Artifact。实物业务情境库OID48623 DROP→干净审计库OID53414，旧176张public+D1/F06-1/2/3A/3B/3C1/4A表全行COUNT+MD5与24旧Ledger/Catalog/D1/父Sidecar签名不漂移。完整A独立验收报告`07_重建工作区/F06-4B_A主控独立验收18条Push88项真PG16与133份证据_PR58标准合并正式报告_2026-10-14.md`。
- **PR58已完成A正式验收及GitHub标准merge**：[A正式验收签字](https://github.com/suzhe868-arch/mb/pull/58#issuecomment-6160139339)，按受验SHA锁定的官方merge返回**`merged=true`**、实际merge SHA**`498617353db8020c14ec919a1b0eefef66f2eec8`**。仅认可非特权可销毁PG16中合成Transaction负责人正式移交/不可变事件链、双Backend身份与Scope Guard；**生产Handoff Issuer仍缺来源**，旧F06-4A移交后的cancel仍 Fail Closed（`PARENT_CANCEL_POST_HANDOFF_SOURCE_GAP`），不能视为生产Transaction取消已接通。
- **A仅正式放行下一项F06-4C合成CI技术工作**：完整施工单`07_重建工作区/F06-4C_A主控PDM19移交后当前负责人合成Transaction安全取消_CI隔离完整施工单_2026-10-14.md`，源于用户已签PDM-19§§9–10及PDM-02等，仅在新独立分支`feat/f06-4c-post-handoff-cancel-ci`、新增`engineering/f06/post-handoff-cancel-ci/**`及`.github/workflows/f06-4c-*.yml`，实现来源可信且当前合法负责人显式cancel permission/Scope下**移交后的合成在途Transaction安全cancel Adapter**，旧新负责者越权与未知财务均Fail Closed，不修改任何父Service、已签公DDL与生产Issuer；目标**19同SHA真Push/90真PG16 Jobs（H52 52）、本域Source≥40 HTTPS≥9、≥26官方sha256 Artifact、双真实物理OID旧≥180实体全行Seal**，B完成全包自验中文交接，不合并main。
- **继续禁止**实际Transaction生产Handoff/Cancel/完成成交、真实资金Deposit/Refund付款与`refunded`、生产员工客户与第三方、UAT部署上线/F06-3C-2/F07/F08。F05/F06整域、C/H01与V1都`NOT_READY`。**NEXT_OWNER=B**。

---

# 2026-10-14｜F06-4A 17 Push/86项真PG16与131证据A独立验收，PR57标准合并；F06-4B合成Transaction负责人正式移交CI-only完整施工单放行（唯一最新）

- **唯一最新指针**：`F06_4A_A_ACCEPTED_MERGED_PR57_CI_ONLY / F06_4B_A_RELEASED_FOR_B_CI_ONLY / NEXT_OWNER=B / NEXT_TASK=F06_4B_SYNTHETIC_TRANSACTION_RESPONSIBLE_HANDOFF_CI_ONLY / F05_GLOBAL_NOT_READY / F06_GLOBAL_NOT_READY / V1_NOT_READY`。A独立验受PR [#57](https://github.com/suzhe868-arch/mb/pull/57) B最终HEAD `d6c8731c05d0a4e1156b9efe7723f79434068d8d`，compare ahead2/behind0，28/28新增且CI-only白名单；GitHub官方真正**17/17同HEAD Push成功，86/86真实PG16 Jobs均成功（H52官方`per_page=100`完整52/52）**，本域真实Source **48/48**、TLS HTTPS **9/9**，官方 **131/131** 份本SHA有效sha256 Artifact。源业务库OID43953真DROP→独立审计OID48618，旧172张public+D1+F06-1/2/3A/3B/3C1实体全行COUNT+MD5及24迁移Ledger/Catalog/父Seal不漂移。A验收正式报告`07_重建工作区/F06-4A_A主控独立验收17条Push86项真PG16与131份证据_PR57标准合并正式报告_2026-10-14.md`。
- **A已实际按精确末次B SHA GitHub标准合并**：[PR57独立签署](https://github.com/suzhe868-arch/mb/pull/57#issuecomment-6156008159)，GitHub `merged=true`，**实际merge SHA`b892d3b5ef1ff27dda0a6a145f8cb449807cea11`**。仅接受可丢弃真PG16 `in_progress→cancelled`合成Transaction取消；生产Issuer/真实财务/真实完成成交/退款仍SOURCE_GAP/禁止，不得称F06/V1 READY。
- **A已经正式放行下一独立F06-4B，仍仅CI-only**：完整工作单`07_重建工作区/F06-4B_A主控PDM19合成Transaction负责人正式移交与跨批安全守卫_CI隔离完整施工单_2026-10-14.md`；按正式PDM-19§9和PDM-02等规则，在现行main独立分支`feat/f06-4b-transaction-handoff-ci`新开PR，**只新增`engineering/f06/transaction-handoff-ci/**`与`.github/workflows/f06-4b-*.yml`**，对真正签名的可销毁PG16合成`in_progress`Transaction经理/店长具独立permission+Scope的负责人正式移交、不可变old/new/actor/time/reason历史与双PG backend撤权/竞争、owner不自动漂移以及父Cancel合法/失源拒绝。原86 Jobs本SHA冻签回归+2新增，目标**18真Push/88真PG16 Job(H52完整52)、新Source≥36 HTTPS≥9、≥24原生sha256 Artifact、两物理OID旧至少176表全行Seal**。B自行包内开发/回归/自验到底，交`READY_FOR_A_INDEPENDENT_REVIEW`，不得合并。
- **继续阻断**真实成交completed、Transaction生产取消/负责人转移、实际资金/退款/refunded、银行微信/客户员工生产接入、生产迁移、UAT/部署/上线、F06-3C-2/F07/F08；F05/F06整个业务域、C/H01及V1都`NOT_READY`。**NEXT_OWNER=B**。

---

# 2026-10-14｜F06-3C-1 16/16 Push与129原生证据A独立验收，PR56标准合并；F06-4A合成Transaction普通取消CI-only正式放行（唯一最新）

- **最新正式指针**：`F06_3C1_A_ACCEPTED_MERGED_PR56_CI_ONLY / F06_4A_A_RELEASED_FOR_B_CI_ONLY / NEXT_OWNER=B / NEXT_TASK=F06_4A_SYNTHETIC_IN_PROGRESS_TRANSACTION_NORMAL_CANCEL_CI_ONLY / F05_GLOBAL_NOT_READY / F06_GLOBAL_NOT_READY / V1_NOT_READY`。A独立核对PR [#56](https://github.com/suzhe868-arch/mb/pull/56) 唯一B最终HEAD `177c810a1198bd8e97815748c05e4c07d0b0906b`，compare ahead9/behind0，27/27均新增CI白名单；官方**16/16同SHA event=push 工作流success**，新Source **43/43**、HTTPS **9/9**原生Job日志通过，H52官方工作流attempt2 success、52个无条件Job定义，B实际Job明细52；**129/129官方非空有效本SHA sha256 Artifact**。真实业务情境库OID39410销毁→审计库OID43953、168旧表public+D1/F06-1/2/3A/3B全行COUNT+MD5及24 Ledger/Catalog/父Sidecar保全。**核验透明项**：GitHub的H52 Job列表接口在A复核时持续ReadTimeout，A未能逐项复取52个Job对象；交叉使用GitHub成功Run+52无条件Job源码+B逐Job清单+97官方原生Artifacts，不虚称逐项接口完成。A完整中文报告：`07_重建工作区/F06-3C-1_A主控独立验收16条Push与129份原生证据_PR56标准合并正式报告_2026-10-14.md`。
- **A已按最后HEAD实际标准merge PR56**：正式验收评论 [#6155344148](https://github.com/suzhe868-arch/mb/pull/56#issuecomment-6155344148)，GitHub返回`merged=true`，实际merge SHA **`54d206d633d47a29f675b52bdf5465d1d5d6a8e6`**。只认可合成非特权PG16 Lock侧Refund `pending`申请和带原因无付款`closed`；没有真实 `refunded`、`refund_payments`、真实资金、真实Issuer或completed/cancelled Transaction签发源，F05/F06整域及V1仍`NOT_READY`。
- **A正式仅技术放行下一独立F06-4A**：完整施工单 `07_重建工作区/F06-4A_A主控PDM19合成Transaction正常取消与责任占用释放_CI隔离完整施工单_2026-10-14.md`，依已签PDM-19 §§6–11/15–18/21–26，B从开工时最新main独立建立 `feat/f06-4a-transaction-cancel-ci` 和新PR，**只新增 `engineering/f06/transaction-cancel-ci/**` 与 `.github/workflows/f06-4a-*.yml`**；仅合成当前合法responsible/permission/scope/来源的在途Transaction `in_progress → cancelled`原子取消和责任占用释放、历史不可变及不恢复旧Lock/Priority/Waitlist；旧84 Job全新SHA回归+新2项，目标17真Push/86真PG16 Job(H52 52)/本包Source≥32 HTTPS≥9/≥22有效原生Artifact/两OID与≥172旧实体全行Seal。**不做真实Transaction取消、成交确认、财务退款、任何生产Issuer或前端部署**，B最终正式`READY_FOR_A_INDEPENDENT_REVIEW`交A，不合并。
- **全局继续禁止**：F06-3C-2真实退款与`refunded`事实、线上收退、completed成交、生产员工Customer/JYT微信、UAT/部署/上线、F07/F08；F05/F06整域及C/H01、V1继续`NOT_READY`。**NEXT_OWNER=B**。

---
# 2026-10-14｜F06-3B 82/82真PG16 A独立验收并PR55标准合并；F06-3C-1仅CI合成Refund pending/closed完整施工单正式放行（唯一最新）

- **唯一当前指针**：`F06_3B_A_ACCEPTED_MERGED_PR55_CI_ONLY / F06_3C1_A_RELEASED_FOR_B_CI_ONLY / NEXT_OWNER=B / NEXT_TASK=F06_3C1_REFUND_PENDING_CLOSE_CI_ONLY / F05_GLOBAL_NOT_READY / F06_GLOBAL_NOT_READY / V1_NOT_READY`。A独立审核PR [#55](https://github.com/suzhe868-arch/mb/pull/55)受验B最终SHA `9880e8fcf1923802c1360e0c4783b4cfee4aaab2`，compare ahead23/behind0，26/26文件全部新增且仅本包CI-only白名单；**15/15条同SHA真正push工作流全部success、82/82非特权PG16 Jobs成功（H52真实52/52）、新Source35/35 HTTPS9/9、127/127官方有效同SHA sha256 Artifact**。原子Lock→Transaction真实in_progress、多个独立PG backend权限撤销/竞争、注错ROLLBACK及旧Deposit/Price/责任不可变；合成情境库OID34957真实DROP→干净审计库OID39410，旧164张public+D1+F06-1/2/3A表全行COUNT+MD5、24旧Ledger/Catalog及父Sidecar签名不漂移。
- **A已实际GitHub标准merge PR55**：A验收评论 [#6153930833](https://github.com/suzhe868-arch/mb/pull/55#issuecomment-6153930833)，按末次SHA锁定标准merge，GitHub返回`merged=true`、真实merge SHA **`a43d3a0537a9051929f87490f5c1c6641c5920b2`**。完整A报告：`07_重建工作区/F06-3B_A主控独立验收15条Push82项PG16与127证据_PR55标准合并正式报告_2026-10-14.md`。同SHA历史F05旧`pull_request`工作流另有部分跨批次历史取证脚本失败，**不是本批正式指定的15条push冻结门禁**；记录在A报告，不能称全GitHub事件绿灯。仅接受`A_ACCEPTED_CI_ONLY`，不表示真实Transaction或线上锁车Issuer已连线。
- **A另行正式放行下一独立F06-3C-1，仅CI-only**：完整施工单`07_重建工作区/F06-3C-1_A主控PDM19合成Refund申请与关闭_无实际退款_CI隔离完整施工单_2026-10-14.md`；仅允许B基于执行时最新main新建`feat/f06-3c1-refund-pending-close-ci`，只新增`engineering/f06/refund-pending-ci/**`和`.github/workflows/f06-3c1-*.yml`。按已确认PDM19 §§19-26真实非特权PG16仅合成Refund `pending`申请、`closed`填写原因并留存不可变历史与余额/权限/来源守卫，**不得实际退款、不写真实退款付款事实、不开放`refunded`或生产Issuer**。冻结旧82项全部同新SHA回归+新2项，目标**16条真正push/≥84/84真PG16 Job（H52完整52）、新Source≥32/HTTPS≥9、≥20官方本SHA有效Artifact、旧至少168张父实体双真实OID全行Seal**；B末次SHA中文`READY_FOR_A_INDEPENDENT_REVIEW`交A，不合并。
- **仍禁止**：F06-3C-2任何已退款事实、真实现金收退、完成/成交纠错、生产Transaction/Refund Issuer、真实员工客户账号、UAT/部署/上线/F07/F08；F05/F06整体及V1和C/H01依旧NOT_READY。**NEXT_OWNER=B**。

---

# 2026-10-14｜F06-3A 80/80真PG16 A独立终验并PR54标准合并；F06-3B Lock到Transaction仅CI隔离完整施工单正式放行（唯一最新）

- **正式唯一指针**：`F06_3A_A_ACCEPTED_MERGED_PR54_CI_ONLY / F06_3B_A_RELEASED_FOR_B_CI_ONLY / NEXT_OWNER=B / NEXT_TASK=F06_3B_LOCK_TO_TRANSACTION_ATOMIC_CI_ONLY / F05_GLOBAL_NOT_READY / F06_GLOBAL_NOT_READY / V1_NOT_READY`。A实际验收PR [#54](https://github.com/suzhe868-arch/mb/pull/54)唯一B末次SHA`ced0839defb013127ef57d5b9f6964d8aa901c72`，GitHub compare ahead11/behind0，**28/28文件全部added CI-only白名单**；官方**14/14条同SHA`event=push`工作流completed/success、80/80真独立非特权PG16 Job success（H52官方完整52/52最新attempt2）、新Source28/28/HTTPS9/9、上批F06-2 Source30/HTTPS9及F06-1 Source48/HTTPS9、125/125份本SHA非空未过期官方sha256 Artifact**。两真PG backend COMMIT撤权/Lock行锁竞争/注错ROLLBACK、真实签约Lock物理Deposit阻止无资金误超时、权限分权及不可变收款/纠错均有真PG原生日志。旧业务PG库OID30636实际DROP→独立干净PG审计库OID34961，**160张旧public+D1+F06-1/2表全行COUNT+MD5、24行Ledger/D1/Catalog/父Sidecar签名保持完全一致**。
- **A已经实际标准merge PR54**：前将Draft标记为Ready，发表[A独立验收正式评论](https://github.com/suzhe868-arch/mb/pull/54#issuecomment-6151714472)；GitHub标准Merge成功`merged=true`，真实merge SHA`fd00d88ec5e0f555cf2c8a9643af9a0bd74a23e8`。完整验收报告：`07_重建工作区/F06-3A_A主控独立验收14条Push80项真PG16与125份证据_PR54标准合并正式报告_2026-10-14.md`。仅`F06_3A_A_ACCEPTED_CI_ONLY`，不代表实际现金收据/资金纠错/生产交易账户可用。
- **A已另外正式放行F06-3B，仅CI-only**：完整工单`07_重建工作区/F06-3B_A主控PDM19_Lock到Transaction原子转换责任占用_CI隔离正式完整施工单_2026-10-14.md`，唯一Authority PDM19 Final §§6–11、15–18、PDM18相关Lock/Priority规范。B从当前最新main独立开`feat/f06-3b-lock-transaction-ci`并新PR；**只新增`engineering/f06/lock-transaction-ci/**`和`.github/workflows/f06-3b-*.yml`**。目标仅合成合法Lock→Transaction同PG事务单车唯一在途、责任快照/Lock原子结束、原资金不可变、权限/其他领域失败硬拒；若旧实际PG`public.transactions`与PDM19状态载体不符必须只建隔离Sidecar安全投影并标`PRODUCTION_TRANSACTION_SCHEMA_CARRIER_GAP`，不改旧公共SQL和生产Issuer。旧80Job全部本SHA冻结回归再加2个，目标**15条同SHA真Push、82/82项真实PG16 Job(H52完整52)、新Source≥28/HTTPS≥9、≥18份末次SHA原生有效sha256 Artifact、两物理不同OID及旧160张表+父Sidecar全行Seal**，B中文`READY_FOR_A_INDEPENDENT_REVIEW`交A，B不合并。
- **持续禁止**：F06-3C退款、真实收付款、交易完成/成交纠错、生产微信/员工/PC接口、UAT/上线/F07/F08均未放行；F05/F06全域、C/H01、V1仍NOT_READY。**NEXT_OWNER=B**。

---

# 2026-10-14｜F06-2 78/78真PG16独立验收通过、PR53标准合并；F06-3A PDM19 Deposit资金事实与纠错仅CI隔离施工单正式放行（唯一最新）

- **唯一当前指针：`F06_2_A_ACCEPTED_MERGED_PR53_CI_ONLY / F06_3A_A_RELEASED_FOR_B_CI_ONLY / NEXT_OWNER=B / NEXT_TASK=F06_3A_SYNTHETIC_DEPOSIT_FACT_CORRECTION_AND_LOCK_GUARDS / F05_GLOBAL_NOT_READY / F06_GLOBAL_NOT_READY / V1_NOT_READY`。**
- **本批真实完成且A亲核**：PR [#53](https://github.com/suzhe868-arch/mb/pull/53) B最后HEAD`44067d132ab8c6924213ea2681ad6c5ecd4bec92`，26/26更改全部added在A签CI-only白名单；A独立检验**13/13个同HEAD `event=push` Workflow `completed/success`，**78/78个真实非特权PG16独立Jobs success（H52 Run38427010887官方完整52/52 attempt2）、F06-2新Source30/30、HTTPS9/9、前批F06-1 Source48/48/HTTPS9/9、**123/123**份同HEAD原生有效GitHub SHA256 Artifact。真实PG业务库OID`26507`实际DROP→签名审计库不同OID`30636`，原157张public+D1及F06-1侧表全行COUNT/MD5、24旧Ledger/D1/Catalog/旧侧表字节封印不变；锁车延期、release/cancel、PG时钟到期、真Deposit/Transaction/来源未知硬拒、两PG backend撤权与争用、Priority-origin客户独占、候补历史及错误注入ROLLBACK均通过。见[A正式验收评论](https://github.com/suzhe868-arch/mb/pull/53#issuecomment-6150007110)及完整报告`07_重建工作区/F06-2_A主控78项真PG16二轮资金边界与生命周期独立验收_PR53标准合并正式报告_2026-10-14.md`。
- **A已经实际标准Merge**：GitHub`merged=true`，PR53 merge SHA `67b673aff285e28519a1a1141a2e908edf2e44d5`，不是B自行合并。F06-2单元`A_ACCEPTED_CI_ONLY`，F05/F06整体及V1仍NOT_READY。B旧自验归档内此前证据基线SHA的PENDING措辞属于历史阶段；A是独立检查**PR53最后HEAD**的13条Run、78Jobs与123原生Artifact确认，本轮无借旧SHA。
- **A已正式另发F06-3A新CI-only施工单**：`07_重建工作区/F06-3A_A主控PDM19意向金事实追加资金纠错与Lock保全_CI隔离正式完整施工单_2026-10-14.md`，以用户已确认PDM19 Final §§2～5/PDM18资金Lock保护为Authority，从最新main新建独立`feat/f06-3a-deposit-ledger-ci`并新开PR，仅新增`engineering/f06/deposit-ledger-ci/**`、`.github/workflows/f06-3a-*.yml`。仅在非特权、可销毁、回环PG16合成模拟Deposit真实业务字段、独立经理/店长纠错权限、不可变correction/reversal事件和现有Lock防无款自动释放合同；**没有任何真实资金Issuer、支付收退款操作、真实Customer/Employee生产接口**。B自审目标**14条同SHA真Push / ≥80/80真PG16 Job(H52完整52) / ≥16份最后SHA官方有效sha256 Artifact**，含旧78Job全部冻结回归、Source≥24/HTTPS≥9及物理新旧不同OID≥157表全行Seal。B交中文完整自验到`READY_FOR_A_INDEPENDENT_REVIEW`，不得merge。
- **持续禁止**：F06-3B交易、F06-3C退款、真实财务/微信/手机号/线下凭证、生产Lock和到期调度、C/H01、H02-04、F07/F08、部署/UAT/上线均未放行。**NEXT_OWNER=B**。

---

# 2026-10-13｜F06-1 A二轮独立验收R01/R02正式PASS、PR52标准合并；F06-2普通Lock生命周期CI隔离完整施工单正式放行（唯一最新）

- **唯一正式指针**：`F06_1_A_ACCEPTED_MERGED_PR52_CI_ONLY / F06_2_A_RELEASED_FOR_B_CI_ONLY / NEXT_OWNER=B / NEXT_TASK=F06_2_ORDINARY_LOCK_LIFECYCLE_CI_ONLY / F05_GLOBAL_NOT_READY / F06_GLOBAL_NOT_READY / V1_NOT_READY`。PR52唯一B末次`2ef839b0a5e51a1bdd0b64a2bf322aa1ce3d2e6b`，全部25个文件新增且CI-only白名单。A实核12条`event=push`工作流均同SHA completed/success；**76/76真非特权PG16 Job success（H52官方`per_page=100`真正52/52，attempt2），Source48/48、HTTPS9/9，121/121原生有效同SHA SHA256 Artifact**。R01签名v23 Match/原v24 Priority实体、原Lock Trigger同PG事务ended/converted_to_lock及Priority Event/失败ROLLBACK；R02真正Priority-origin Customer安全投影排他、普通Lock不扩大隐藏及内部Waitlist不泄漏均有真PG日志。业务库OID21998销毁→审计库OID26507，151表public+D1全行count/MD5及24 Ledger/D1/Catalog原签名一致。
- **A已标准合并**：PR [#52](https://github.com/suzhe868-arch/mb/pull/52) GitHub返回`merged=true`、实际merge SHA `a87de230684914a1aafe7fb3b3e5081db63206ab`；[A二轮官方签署评论](https://github.com/suzhe868-arch/mb/pull/52#issuecomment-6147244021)。正式完整验收报告：`07_重建工作区/F06-1_A主控二轮独立验收48项Source76项真PG16与121份证据_PR52标准合并正式报告_2026-10-13.md`。CI合成Priority源使用真v23签名Match＋v24 PG物理主表/原Trigger，**生产Priority/手机号/Customer/Employee Issuer仍SOURCE_GAP**，不得称为线上业务。
- **已由A另签并正式放行F06-2，仅CI-only**：`07_重建工作区/F06-2_A主控正式Lock延期到期与人工释放资金只读保护_CI隔离完整施工单_2026-10-13.md`；B必须从开工时最新`main`新建`feat/f06-2-lock-lifecycle-ci`并独立PR，只新增`engineering/f06/lock-lifecycle-ci/**`及`.github/workflows/f06-2-*.yml`，按PDM18 Final§§19～29实现普通Lock合法延期、人工release/cancel、无Deposit且到期的PG时钟释放，以及有资金/未知资金fail-closed只读保护、Priority/Waitlist历史与当前独占可见；绝不写Deposit/Transaction/Refund、触真实定时器或生产业务。新SHA必须旧76+新2**78/78真PG16 Job success、13真Push全同SHA、H52完整52/52、≥14份官方有效SHA256 Artifact**，交中文B完整自验、B不合并。
- **全局禁止**：F05整域、F06整域、C/H01、V1继续`NOT_READY`；F06-3真实资金、Lock实际过期/线上审批/员工直接创建锁、微信手机号、JYT/飞书、UI/UAT/生产均未放行。**NEXT_OWNER=B / NEXT_TASK=F06_2_ORDINARY_LOCK_LIFECYCLE_CI_ONLY**。

---

# 2026-10-13｜F06-1 A首轮真12条同SHA Push、76/76非特权PG16全绿；PDM18 Priority转Lock未原子ended与独占可见保护无实证，PR52退B（唯一最新）

- **当前唯一正式裁决**：`F06_1_A_FIRST_REVIEW_CHANGES_REQUESTED_R01_R02 / PR52_OPEN_NOT_MERGED / NEXT_OWNER=B / F05_GLOBAL_NOT_READY / F06_GLOBAL_NOT_READY / V1_NOT_READY`。受验PR52 B唯一末次SHA `0d6a94dc6e81b5096ffa54e6d19fc0b43f8cd2d0`、25项改动全部added且F06-1 CI-only白名单。A通过GitHub官方REST独立确认真正**12条同SHA `event=push`工作流全部success、76/76独立非特权PG16 Job success（H52真52/52）、新Source 40/40和真实HTTPS9/9**。A独立核验至少12份最后SHA原生Artifact非空未过期且带官方SHA256。现有6小时LockRequest、签名Employee合法审批、同车双PG原子唯一Lock、竞争2客户合法自动Waitlist/归属、72小时和价格/Approver快照、两后端COMMIT撤权fail closed、错误注入ROLLBACK、不同PG库OID21998→26495销毁隔离与151张真实public+D1表全行count/MD5以及24旧签Ledger/D1/Catalog不变均有真实成功日志，严格保留。
- **A唯一两项阻断，均是已签PDM18 Final条款与F06-1正式施工单**：**R01** 当前新增`engineering/f06/lockrequest-approval-waitlist-ci/service.mjs`在获锁时只把活跃Priority来源记入`lock_snapshots.priority_origin_customer_id`，却**没有在Lock/请求/其他Waitlist同一事务把现行`public.f05_8_priority_ci`的active→ended（例如`converted_to_lock`）与真实Priority历史事件落账**，违反PDM18 §27。**R02** Priority-origin Lock即使Priority结束也应维持客户侧排他可见，而普通粉丝/VIP Lock不隐藏他客已有合法可见权（PDM18 §28）；当前新增F06-1 CI业务没有从真正signed LockOrigin作Customer详情/列表受控投影，新Source40项未见现行Priority→本人Lock的业务签名正反例。不可把sidecar字段存在或来源字符串代替真实服务安全裁剪。这些仅是CI工程完整性阻断，不宣称发现线上生产漏洞。
- **A完整正式定向整改单**：`07_重建工作区/F06-1_A主控首轮独立验收76项真PG16全绿但Priority转Lock未原子结束且独占可见无实证定向整改单_2026-10-13.md`，已留言[PR52 A首轮独立验收评论](https://github.com/suzhe868-arch/mb/pull/52#issuecomment-6145393454)。B继续原`feat/f06-1-lockrequest-approval-waitlist-ci`/原PR52，**仅可更改本批新增`engineering/f06/lockrequest-approval-waitlist-ci/**`及新增`.github/workflows/f06-1-*.yml`**，以真实v23 Match→v24 active Priority→本人LockRequest→合法approve创建Lock的物理PG16 Service行为同一原子提交结束Priority并写历史；同时通过真实signed Origin Lock保持排他客户投影、一般普通Lock依基础可见权可见、他客Waitlist仍内部合法。前序旧签F05-8/D1/24迁移/Public Catalog与真实Issuer/生产/资金都不许改。补R01/R02后最后**新SHA重跑真正12条同SHA Push、≥76/76非特权PG16 Job(H52 52)、≥12份本末次SHA官方原生SHA256 Artifact**；保留旧Source40/HTTPS9、跨域全表MD5签名及独立双PG真实竞态，提交完整中文`READY_FOR_A_SECOND_INDEPENDENT_REVIEW`交A，B不合并。
- **全局**：F05整体、F06整体、C/H01及V1继续`NOT_READY`；F06-2 Lock延长/释放、F06-3 Deposit/Refund/Transaction真实资金、微信手机号/4S/JYT、飞书/正式生产审批/真实锁车、UI/UAT仍未放行。**NEXT_OWNER=B / NEXT_TASK=F06_1_R01_SIGNED_PRIORITY_TO_LOCK_ATOMIC_END_R02_PRIORITY_ORIGIN_LOCK_CUSTOMER_VISIBILITY_PROJECTION_CI_ONLY**。

---

# 2026-10-13｜F05-11第三轮R04两物理PG库151表原生封印通过、PR51 A终验标准合并；正式放行F06-1仅CI锁车申请与自动候补（唯一最新）

- **唯一正式状态**：`F05_11_A_ACCEPTED_MERGED_PR51_CI_ONLY / F06_1_A_RELEASED_FOR_B_CI_ONLY / NEXT_OWNER=B / F05_GLOBAL_NOT_READY / F06_GLOBAL_NOT_READY / V1_NOT_READY`。A独立审PR51唯一最后B HEAD `a342e05e501d52b1d14008558546a3548041fb38`、25项added CI-only白名单、R01真v25 Grant/Priority拒绝释放、R02两个PG backend真实COMMIT撤权与停用旧Token拒绝、R03真Lock102/Waitlist32/Transaction64行级只读、R04物理合成情境库OID16385销毁→新OID21998签名v25至v26独立重建、**151张public+D1表全行count/MD5前后完全一致、Catalog/24迁移Ledger/D1 Attestation原Seal未改变**。官方原生真正**11条同最后SHA Push Workflow全部success、74/74独立非特权PG16 Job全部success（H52真52/52）、新Source旧25+整改4/4及新审计库R03 1/1、HTTPS8/8、至少10份同SHA有效官方SHA256 GitHub原生Artifact**全部A亲核。
- **A正式签字且实际合并**：PR51 A签署 https://github.com/suzhe868-arch/mb/pull/51#issuecomment-6143519010；使用GitHub标准PR`merge`、`expected_head_sha=a342e05e501d52b1d14008558546a3548041fb38`，返回**`merged=true`，实际merge SHA `e11e93bae1f6bc74757fea98b3c079d9ecf01e7a`**；PR51已不再需要B整改，不可重复merge。A完整官方终验归档：`07_重建工作区/F05-11_A主控第三轮独立验收R04双物理库151表封印74项真PG16_PR51标准合并正式报告_2026-10-13.md`。F05-11审计单元`A_ACCEPTED_CI_ONLY`，但F05整个业务领域及真实Issuer仍非生产READY。
- **A已签下一唯一B工作包F06-1**：`07_重建工作区/F06-1_A主控PDM18锁车申请6小时审批唯一Lock与竞争自动候补_CI隔离正式完整施工单_2026-10-13.md`。B从**真正最新main**新建`feat/f06-1-lockrequest-approval-waitlist-ci`并独立PR，仅新增`engineering/f06/lockrequest-approval-waitlist-ci/**`及新`.github/workflows/f06-1-*.yml`，按已确认PDM18 Final与PDM19正式隔离规则实做**合成CI LockRequest 6小时PENDING/合法审批、单Vehicle唯一active Lock原子赢家与72小时初始价格/时长快照、仍合格竞争申请LOCK_CONFLICT→自动Waitlist**，真实两PG backend同车竞态/权限撤销COMMIT、旧migration/跨域历史与生产Fail Closed。**只限非特权可销毁PG16 CI，禁止真实电话微信、资金/Deposit/Refund、真实LockRequest审批、生产API或C/H01前端。** 旧F05-11已签的74个真PG16 Jobs必须全部新SHA重跑，再加F06-1 Source+HTTPS两个，最后要求**12条真正同SHA Push、≥76/76独立PG16 Job全部success、H52真52、≥12份新SHA有效官方SHA256 Artifact、Source≥20+HTTPS≥7真PG与中文B交接**，由A再独立验收/合并。
- **全局门禁**：F05整体、C/H01、F06整体及V1仍`NOT_READY`；微信手机号/4S/JYT图片电话/飞书/生产Issuer、真实意向金/退款与支付、正式Lock管理、UAT上线继续`SOURCE_GAP/NOT_RUN/BLOCKED`；没有放行F06-2/3、F07/08或生产。**NEXT_OWNER=B / NEXT_TASK=F06_1_LOCKREQUEST_6H_APPROVAL_UNIQUE_LOCK_AND_AUTO_WAITLIST_CI_ONLY**。

---

# 2026-10-13｜F05-11 A第二轮74/74真PG16全绿、R01～R03独立验证闭环；R04整改后的数据全域只读封印缺证，PR51不合并（唯一最新）

- **唯一正式状态**：`F05_11_A_SECOND_REVIEW_CHANGES_REQUESTED_R04 / PR51_OPEN_NOT_MERGED / NEXT_OWNER=B / F05_GLOBAL_NOT_READY / F06_NOT_RELEASED / V1_NOT_READY`。A受验唯一末次B HEAD `a709023708314452fc9e8769f27b6bee3f723853`，PR51 23个新增文件均处于F05-11 CI-only白名单。GitHub官方**11条真正event=push同SHA completed/success、74/74独立非特权PostgreSQL16 Job成功（含H52真52/52），0失败/跳过**；新Source旧25+整改4=**29/29**、HTTPS**8/8**，A逐个复核至少10份本SHA有效、非空、未到期、含官方SHA256 Artifact。原签M94→v26 public Catalog/Ledger/隔离D1 Sidecar与21签名F05单元、32动作、12实际Issuer/UI/资金Gap全部保留。
- **上轮R01/R02/R03业务实证均独立验收PASS**：v25正式Recommendation Service签发真Grant，另客v24 active Priority压制F05-9真实Customer投影和v26实际Consultation Service普通分享创建、合法ended后恢复；双真PG PID336/337下另一连接Permission deny与Customer disable真实COMMIT后旧Token员工敏感投影/动作拒绝且拒绝事件零落库；真PG`BEGIN READ ONLY`查Lock102、Waitlist32、Transaction64实际行与源状态/Owner/Consultation关联及只读写拒绝，前后保护域hash不变。保留全部此前成功的旧72、Source29、HTTPS8、业务签名与测试。
- **A仅剩新R04整体验收阻断**：本批名义“F05全域只读审计”先跑旧25 Source的`S24 F05_11_CROSS_DOMAIN_UNCHANGED`，**之后**才跑新增整改4测试，`evidence.mjs`最后只核Schema/ledger而未对新R01/Grant创建Consultation、真实Priority写入、R02撤权/Customer disable COMMIT/Consultation Hold派生等实施**整改结束后的全部签名public+Sidecar数据全行MD5/Count不变性核验**；部分写入实际上在同物理审计库持久留下。存在真实测试隔离/保全证据缺口，不可因74/74全绿或SQL结构hash不变签成“审计全程只读”。用户真实生产数据没有被触碰，此处是非特权可抛弃PG16 CI测试完整性阻断。
- **A已签完整定向整改R04并通知B**：`07_重建工作区/F05-11_A主控二轮独立验收29项Source74项PG16全绿_R01至R03通过但审计后原生数据回滚不变性缺证整改单_2026-10-13.md`；PR51正式A评论 https://github.com/suzhe868-arch/mb/pull/51#issuecomment-6142625763。**下一唯一工作B继续原`feat/f05-11-cross-domain-readiness-audit`及原PR51**，只改本批`engineering/f05/integrated-readiness-audit/**`和新增`.github/workflows/f05-11-*.yml`。优先将合法需要COMMIT的R01/R02/R01G真业务放入独立可丢弃PG16情境库并销毁，另以完全干净已签PG16审计库在最终测试步骤真正计算跨所有public客户/员工Permission/Owner/Priority/Grant/Recommendation/Consultation/Lock/Transaction/Audit和D1 Sidecar的before/after count+row-MD5及catalog/ledger seal。不得手工UPDATE恢复充ROLLBACK，不可修改已签旧Service/DDL。新末次B HEAD再跑11真正同SHA Push≥74/74独立PG16全success、H52 52/52、≥10份此HEAD官方有效SHA256 Artifact，附原生`F05_11_POST_REMEDIATION_TRUE_GLOBAL_READONLY_SEAL_PASS`及中文`READY_FOR_A_THIRD_INDEPENDENT_REVIEW`交A。
- **未放行**：F05全域、C/H01、V1继续NOT_READY；F06、实际LockRequest/Deposit/Refund、微信手机号、4S、JYT电话图片、飞书、资金、生产部署/UAT均不获本次新授权。**NEXT_OWNER=B / NEXT_TASK=F05_11_R04_POST_REMEDIATION_FULL_DB_SEAL_AND_DISPOSABLE_SCENARIO_ISOLATION**，PR51不合并。

---

# 2026-10-13｜F05-11 A首轮独立验收：74/74真实PG16全绿但三组已签跨域保护实证不完整，PR51退B（唯一最新）

- **唯一正式状态**：`F05_11_A_FIRST_REVIEW_CHANGES_REQUESTED / PR51_OPEN_NOT_MERGED / NEXT_OWNER=B / F05_GLOBAL_NOT_READY / F06_NOT_RELEASED / V1_NOT_READY`。A受验B唯一末次HEAD `8aaf2fa4c7d52020903fa63d9ff2625a95a1f0d3`，PR51 21项全部added且处于独立F05-11 CI-only白名单，没有动历史正式签名SQL/产品/生产路由。GitHub官方11真`event=push`工作流全部同SHA成功、完整H52真52/52、**74/74独立非特权PG16 Job成功**；新Source 25/25、HTTPS8/8、A亲核至少10份同最终SHA非空未过期官方SHA256 Artifact。现行v26签名结构账、跨域count/MD5保全，机器核账21 F05模块/32动作/12个真实来源或UI阻断均已取得。成果有效，不可删弱。
- **A尚未签可接受的三组原有正式审计合同**：**R01** `tests/source.test.mjs` S16虽真实生成其他客户active Priority，但只查SQL count及永真`otherGrant>=0`，缺普通分享/现时Grant在Priority下实际调用业务Service拒绝及结束后恢复的真PG正反例；**R02** S21有双物理PG PID，但仅双方`BEGIN READ ONLY`看Owner数量，没有第二PG真实Permission/Scope revoke或Customer disable COMMIT后旧Actor服务操作/敏感读被拒，缺权限竞态；**R03** S20仅`to_regclass('locks/waitlists/transactions')`存在性，缺已签Lock/Waitlist/Transaction真实行/状态与F05现时Owner/Priority/Consultation保护的交叉只读核账。未完成合同不等于证实有生产漏洞；不能凭74/74通用Job绿灯越过已签场景门禁。
- **A完整正式整改单已在main**：`07_重建工作区/F05-11_A主控首轮独立验收74项PG16全绿但三组跨域源事实与竞态缺证定向整改单_2026-10-13.md`；[PR51 A正式整改单评论](https://github.com/suzhe868-arch/mb/pull/51#issuecomment-6141273454)。B继续原`feat/f05-11-cross-domain-readiness-audit`/PR51且仅修改本批新增`engineering/f05/integrated-readiness-audit/**`、`.github/workflows/f05-11-*.yml`，一次性修复R01～R03。保留原21模块/32动作/12真实Gap、旧72、Source25/HTTPS8；下一**新唯一B HEAD**重新获得11条真正同SHA Push≥74/74非特权PG16 Jobs全success、H52 52、≥10份来自最后SHA有效官方Artifact、中文`READY_FOR_A_SECOND_INDEPENDENT_REVIEW`交A。B不合并。
- **硬边界**：F05整体、C/H01和V1均`NOT_READY`，F06未放行；手机号/微信/4S/JYT电话图片/飞书/真实锁车资金Deposit Refund/UAT生产Issuer仍按各自`SOURCE_GAP/NOT_RUN/BLOCKED`，不触碰真实外部服务。**NEXT_OWNER=B / NEXT_TASK=F05_11_REWORK_R01_PRIORITY_REAL_SERVICE_R02_TWO_PG_REVOCATION_COMMIT_R03_F06_SIGNED_ROW_STATE_READ_AUDIT**。

---

# 2026-10-13｜F05-10 PR49 A最终独立终验与标准合并完成；正式放行F05-11跨模块覆盖核账和F06前置依赖隔离审计（唯一最新）

- **唯一真实状态**：`F05_10_A_ACCEPTED_MERGED_PR49_CI_ONLY / F05_11_A_RELEASED_FOR_B / NEXT_OWNER=B / F05_GLOBAL_NOT_READY / V1_NOT_READY`。A亲查PR49最终B HEAD`d1f721bd1d332f14241960562b631145af250265`的26项全CI-only新增白名单与最新main一致，**10条真正GitHub event=push同SHA completed/success，72/72独立非超级用户PG16 Job全成功，H52真52/52，F05-10 Source30/30 + D1 Owner真集成5/5、HTTPS7/7，八份同SHA原生有效Artifact**；真实D1 v25 Owner服务/两PG竞争→同库v26 PDM15 Consultation create/reuse、D1 receipt及12域hash保全/受权反例，旧签迁移/错误注错rollback全部A复核通过。
- **已A正式签A_ACCEPTED并完成标准合并**：PR49评论 https://github.com/suzhe868-arch/mb/pull/49#issuecomment-6139577391，GitHub携`expected_head_sha=d1f721bd1d332f14241960562b631145af250265`标准merge返回`merged=true`，**真实merge SHA `ac1dbda3e6bbd079c3739b3705eb339b275d628c`**；PR49现在closed/merged，合并后A状态文档提交不改变该合并事实。正式归档`07_重建工作区/F05-10_A主控最终独立验收35项Source72项真PG16_PR49标准合并_2026-10-13.md`。
- **A正式新建并放行B完整下一包F05-11**：`07_重建工作区/F05-11_A主控F05已签全域覆盖核账与F06前置依赖只读安全审计_CI隔离完整施工单_2026-10-13.md`；B从实际最新main新建**`feat/f05-11-cross-domain-readiness-audit`**，**只新增**`engineering/f05/integrated-readiness-audit/**`及`.github/workflows/f05-11-*.yml`，F05-1～10+D1真实签名业务跨模块覆盖、当前Owner/Scope/图片/草稿/CRM及Caller/Route/高保真欠账盘点、三组真PG反例、F06 Lock/Transaction只读保护依赖、来源状态矩阵与真实缺口，不更改旧签Schema/生产API、不建新迁移。B包末必须同最后SHA**11条真Push、至少74/74独立非特权PG16 Job成功（旧72+新2）、H52全52、至少10份该新SHA有效官方Artifact**，新Source至少20项真PG断言、HTTPS至少7项、不可改写旧业务历史；中文`READY_FOR_A_INDEPENDENT_REVIEW`交A。此任务不是F06正式开发许可。
- **未放行**：F05整体、C/H01与V1继续`NOT_READY`；当前D1/Consultation Owner/手机/PDM17生产Issuer、微信/JYT图片电话、飞书、真实内部价格、资金/Deposit/Refund、LockRequest线上审批、生产部署UAT仍有`SOURCE_GAP`或`NOT_RUN`。**NEXT_OWNER=B / NEXT_TASK=F05_11_INTEGRATED_READINESS_AND_F06_DEPENDENCY_AUDIT**，后续F06要等F05-11经A独立审计签收与新的安全范围放行。

---

# 2026-10-13｜F05-10-D1 A二轮验收通过并标准合并PR50；正式放行PR49跨域真实集成（唯一最新）

- **唯一正式状态**：`F05_10_D1_A_ACCEPTED_MERGED_PR50 / F05_10_FINAL_INTEGRATION_A_RELEASED_FOR_B / PR49_OPEN_NOT_MERGED / NEXT_OWNER=B / V1_NOT_READY`。PR50 B末次受验`3edf40b7cda1ddf8cb4ca340f0fb33dfc0b0d50a`已由A独立复核10条真正同SHA Push、72/72非特权PostgreSQL16 Job成功、完整H52 52/52、D1新Source23/23及HTTPS7/7、注错ROLLBACK/旧M94-v25 Ledger/catalogseal和八份同HEAD有效原生Artifact。R01签名v24 Priority/在途四阶段、R02合法接客池下一候选回退、R03 PG时钟真实冷却与policy version、R04当前权限Scope拦截失权旧key重放，全部源码+真实PG原生日志均A核PASS。
- **A已执行标准PR50 Merge**：GitHub在`expected_head_sha=3edf40b7cda1ddf8cb4ca340f0fb33dfc0b0d50a`校验后返回`merged=true`，实际merge SHA `9c9e73d5eaa8ab9aa15a45ba1be38b39d1dc7403`；后续main的状态管理提交不改变该合法merge事实。PR50 closed/merged=true；PR49 `feat/f05-10-consultation-assignee-sla`仍open/unmerged，尚未接入D1后的真Owner→Consultation跨域证据，不能因旧HEAD 72绿灯直接合并。
- **A已正式放行B下一完整工作单**：`07_重建工作区/F05-10_A主控D1合并后公海Owner到Consultation真PG16集成与PR49最终终验正式施工单_2026-10-13.md`；B以**最新main**+已合并D1非生产CI 来源回到**原PR49分支**，在唯一CI-only白名单增加真实`pool owner=null→D1合法claim/经理指定分配或无接客人pending→assigned后真实F05-10 Consultation create/reuse`的同库PG16正反例、双backend/权限、跨域count+hash。先按D1在签名v25及隔离Sidecar的技术约束，合理衔接PR49 v26，不改D1、旧签版、旧Migration或产品Final。保留原PR49 Source30/HTTPS7、旧70个PG16冻结Jobs，新Source>30；本次最后HEAD重新获得十真Push同SHA至少72/72全部success、≥8份新HEAD有效Push原生Artifact、全套中文交A终验，PR49仍由A最终独立验收后才可合并。
- **A签署正式归档**：`07_重建工作区/F05-10-D1_A主控二轮独立验收23项Source72项PG16全绿并合并PR50正式报告_2026-10-13.md`；PR50 A接受评论：https://github.com/suzhe868-arch/mb/pull/50#issuecomment-6138873276。D1所有新增公海事件/Owner领取独立权限/配置当前均`CI_SYNTHETIC_AUTHORITY_ONLY`、真实`PRODUCTION_ISSUER_GAP`保留；F05整体、C/H01和V1仍`NOT_READY`，F06、真实微信/手机号/JYT电话/价格资金/飞书/部署UAT全部不放行。
- **NEXT_OWNER=B / NEXT_TASK=F05_10_PR49_FINAL_INTEGRATION_AFTER_D1_MERGE**。无需用户重复批准本包范围内技术步骤；只有新的产品规则冲突或生产授权再集中报用户。

---

# 2026-10-13｜F05-10-D1 A首轮独立验收72/72真PG16全绿但四项保护合同未闭环，PR50退B（唯一最新）

- **唯一正式状态**：`F05_10_D1_A_FIRST_REVIEW_CHANGES_REQUESTED_B_REWORK / PR50_OPEN_NOT_MERGED / PR49_OPEN_NOT_MERGED / NEXT_OWNER=B / V1_NOT_READY`。A独立审B PR50 HEAD `43e94834ba1e805b3222fad45d84b3169ab29b01`，24个文件全部新D1 CI-only白名单，全部十条真正GitHub Push事件同SHA且completed/success、H52官方52/52、合计72/72非超级用户PG16成功，D1 Source18/18、HTTPS7/7、真实双backend竞争、注错rollback/旧账/catalogseal、8份同SHA非空未过期官方SHA256原生Artifact均已核实；这些成果保留。
- **A还不能签字的四项真实问题**：R01 D1 `protection()`只检查旧`priority_leases`且只检查`transactions.in_progress`，漏现行F05-8 v24 Priority `f05_8_priority_ci`与已签`trading/pending/active`在途范围；R02 `serviceAssignCI`从预筛接客池只尝试employeeId最小一人，其Store/Team/object业务资格若失效，就放弃合法下一个；R03虽然源码有`cooldown_seconds`，D1-S09仅测日额度，缺真PG16非零冷却/到期/配置变更实证；R04 `acquire()`在当前Permission/Scope再验证前返回旧requestKey内部`ownerId/receiptId`，当前失权人员仍可幂等读取。尚未构造可在正式产品发生的实际漏洞不等于安全合同已签PASS；B需按当前PDM17签版实测/修复。
- **完整唯一正式A整改单**：`07_重建工作区/F05-10-D1_A主控首轮独立验收与四项整改_2026-10-13.md`。B继续原`feat/f05-10-d1-pdm17-public-pool-owner-claim`原CI-only新增白名单，一次性修R01–R04；保留原Source18/HTTPS7及旧70，最后新B HEAD重跑10真Push同SHA至少72/72独立PG16 success、8份新SHA有效原生Artifact，Source新增当前Priority/交易/候选回退/冷却/撤权幂等物理正反例与完整中文`READY_FOR_A_SECOND_INDEPENDENT_REVIEW`交A。**PR50不合并；原PR49继续阻断，不启动F06/生产，F05/C-H01/V1保持NOT_READY**。真微信/手机号/JYT/资金等继续SOURCE_GAP，无用户新产品裁决。

---

# 2026-10-13｜F05-10 A第三轮独立验收72/72真PG16通过，PDM17公海Owner首次合法认领来源缺口裁决；F05-10-D1独立前置正式放行B（唯一最新）

- **唯一正式状态**：`F05_10_A_THIRD_REVIEW_SOURCE_GAP_PDM17 / F05_10_D1_A_RELEASED_FOR_B / PR49_OPEN_NOT_MERGED / NEXT_OWNER=B / V1_NOT_READY`。A独立验收B PR49最终HEAD `d280a37ef6337156ecc2301bbea7f1383d7d82e5`：24个新增CI-only白名单文件，十条GitHub真正`event=push`同SHA `completed/success`，**72/72独立非特权PostgreSQL16 Job成功、零fail/skip**，H52真52/52，F05-10 Source**30/30**及HTTPS**7/7**，v26错误注入回滚/旧签名Ledger/Catalog seal通过；**8份**同SHA非空未过期带GitHub官方SHA256的Push原生Artifact。
- **第三轮A认可且不再重测缺证的业务**：R01源停权自动Pending及真双PG；R02签名System Admin/无权目标handover拒绝、合法Manager/StoreHead跨店、Recommendation/Demand合法责任；R03合成PDM23 DND/quiet不暂停SLA、真实双PG Customer disable vs withdraw/resume Hold时序与可信人工服务证据；R04真实其他Customer Priority独占/终止释放和Consultation create→touch→followup→handover→close/invalid全流程9业务域count/MD5不变。相关实码及原生Source日志已经A复核。**工程已验证部分PASS，但不等于F05-10全部PDM15合同验收通过**。
- **唯一未闭的来源依赖**：PDM-15 §11/PDM-17 §§9～14规定公海/owner pending须先由PDM17合法形成Customer Owner，再创建Consultation。main真实`runtime-receiving-pool`只管理销售接客，`runtime-customer-owner-handover`只对已分配Owner间移交；不存在经A确认为可复用的首领`owner=null→assigned`签名CI业务Issuer。不可通过直接SQL伪认领、复制公海状态机或删改既有验收合同解决。状态`SOURCE_GAP_PDM17_PUBLIC_POOL_OWNER_CLAIM`；**PR49保持open/unmerged，未签A_ACCEPTED**。
- **A独立裁决并正式放行前置完整包**：`F05-10-D1｜PDM17公海Owner合法主动领取/后台指定分配与咨询前置来源`，施工单`07_重建工作区/F05-10-D1_A主控PDM17公海Owner合法领取指定分配和咨询前置来源_CI隔离完整施工单_2026-10-13.md`。B从最新main新建`feat/f05-10-d1-pdm17-public-pool-owner-claim`，**只新增**`engineering/f05/pdm17-public-pool-owner-claim/**`与`.github/workflows/f05-10-d1-*.yml`，对非生产可丢弃PG16使用当前签名Owner/权限/保护事实和严格最小CI-only Sidecar，不抢F05-10既有v26账序、不改F03/F04/F05-1～9/PR49/PDM Final/真实生产。D1完整旧70+新≥2独立PG16 Job、官方最后同SHA十Push≥72/72全绿、至少八份同SHA有效原生Artifact、真实两个PG Backend并发、审计及中文交A。B不得自行merge；D1经A验收并标准合并后，再回PR49做真实`公海无owner→合法认领Owner→Consultation create`闭环并重跑原72/72、终审后合并。
- **唯一下一责任**：`NEXT_OWNER=B / NEXT_TASK=F05_10_D1_PDM17_PUBLIC_POOL_OWNER_CLAIM`。A完整第三轮报告：`07_重建工作区/F05-10_A主控第三轮独立验收72项全绿_PDM17公海Owner合法认领来源缺口技术裁决_2026-10-13.md`。F05/C-H01/V1继续`NOT_READY`、F06不放行；真实微信手机号/电话/飞书/JYT/资金/部署UAT保持`SOURCE_GAP`。

---

# 2026-10-13｜F05-10 A第二轮独立验收：72/72真PG16全部成功但R02/R03/R04部分原生合同缺证，PR49继续退B（唯一最新）

- **唯一正式状态**：`F05_10_A_SECOND_REVIEW_CHANGES_REQUESTED_B_REWORK / PR49_OPEN_NOT_MERGED / NEXT_OWNER=B / V1_NOT_READY`。A审B最后HEAD `609edea9dddbdbe814a108e6edeed58a540dac3e`，24项F05-10新CI-only白名单，PR49 open / merged=false。十条真正GitHub Push全部同最终SHA且completed/success，完整H52用官方per_page=100查出52/52，旧新合计**72/72独立非特权PG16 Job成功**；新Source**24/24**、HTTPS**7/7**、v26错误注入ROLLBACK/签名旧Ledger/Catalog Seal成功；**八份**同SHA非空未过期原生Artifact及官方SHA256 Digest均经GitHub核实。
- **A正式承认的已闭环**：R01自动assignee Pending Guard（Employee inactive/个人deny/Scope撤销时源事务物化）、真双PG COMMIT/55P03、Manager合法接管与不可变交接收据；R02真实Recommendation与Demand/Owner、跨Store经理/店长正例、4S员工否例；R03可信合成真人证据反伪、配置快照、Hold剩余时间、双PG disable/followup；R04四态、正常/无效终结、offline旧咨询保留、4S车源、客户安全投影。这些已成功的业务与测试均保留。
- **二轮仅剩三组已签施工单实证阻断**：R02缺**真实公海/pending经PDM03/17合法形成Owner后的正例**，缺CI有效System Admin及inactive/deny/越Scope目标handover完整负例；R03所谓“DND/quiet不暂停SLA”测试只用1秒普通超时，没有实际DND/quiet源事实，且disable COMMIT与resume/withdraw竞争、Hold治理终结/重复事件欠真实PG时序；R04跨域count/hash只夹**一次普通followup**，没有create→touch→handover→close/invalid全过程；缺真实其他Customer Priority压制/恢复咨询隔离的原生正反例。未测不等于已存在bug，但合同验收不得凭72绿灯替代。
- **当前完整A正式整改单**：`07_重建工作区/F05-10_A主控二轮独立验收72项真PG16全绿但公海授权DND并发与跨域全生命周期缺证整改单_2026-10-13.md`，继续原`feat/f05-10-consultation-assignee-sla`，仅F05-10新增CI-only白名单一次性补余项；R01已通过，不允许删弱旧70、原24 Source/7 HTTPS与旧签名账。下一**新唯一B HEAD**须重新十条真Push同SHA **≥72/72 PG16全成功**、至少八份该SHA有效Push原生Artifact、新Source增加真正用例及双PG/Source/权限/数据不变性中文证据，正式`READY_FOR_A_THIRD_INDEPENDENT_REVIEW`交A。**本轮不A_ACCEPTED、不合并PR49、不启动F06/生产**；真微信/手机号/电话/JYT/资金等继续SOURCE_GAP，F05/C-H01/V1仍`NOT_READY`。

---

# 2026-10-13｜F05-10 A首轮独立验收72/72真PG16通过但PDM15业务实证R01～R04未闭环，PR49退B（唯一最新）

- **唯一正式状态**：`F05_10_A_FIRST_REVIEW_CHANGES_REQUESTED_B_REWORK / PR49_OPEN_NOT_MERGED / NEXT_OWNER=B / V1_NOT_READY`。A独立审最后B HEAD `a3bde06e7615a9fcab2d16ed6ac1ec8e23d3ce2b`，PR49 24新增CI-only白名单文件未碰旧签F03/F04/F05-1～9/迁移/生产。**十条真正GitHub Push同SHA、72/72独立非特权PG16 Success、0skip/fail；八份本SHA原生有效Artifact**，原Source12/12、HTTPS7/7、v26注错ROLLBACK/旧LedgerCatalog seal均Pass。这些工程证据保留，不等于全部PDM15业务矩阵已获真实验证。
- **首轮独立阻断四组**：R01现有`assignee_handover_pending`只由经理手动`assignee_invalid`赋值，Employee inactive/deny/scope撤销尚无实时Guard自动形成/两个PG COMMIT真实并发；R02真实Recommendation direct source、Demand/Owner/接客池合法承责链、Customer Owner变更与Consultation assignee独立、owner pending公海、跨Store角色Scope和4S/System Admin真负例缺证；R03 SLA配置变更/过期派生/DND/Customer禁用Hold剩余时间恢复缺真时序，任意形状合法的`call/message`引用字符串可被计为首次真人响应，缺可信CI服务来源及伪证拒绝证明；R04 NORMAL_CLOSED与invalid、offline老咨单收口/hidden/4S源车、敏感全文权限和咨询不改变Recommendation/价权/Lock/Transaction的真实PG正反例不足。已签PDM15 Final及原F05-10完整工作单均要求这些来源，不以CI绿灯替代。
- **B继续施工**：`feat/f05-10-consultation-assignee-sla`原分支，严格只改F05-10新CI-only白名单一次性补R01～R04实际物理正反例、真实两个PG Backend与合法权限修复，保留旧70和原12 Source/7 HTTPS以及签名旧v25/v26账；新最终HEAD须重新**10条同SHA官方Push、至少72/72 PG16 Job全部成功、≥8份同SHA真正Push有效Artifact**及中文完整`READY_FOR_A_SECOND_INDEPENDENT_REVIEW`再交A。**当前PR49不合并，F06/生产未放行、F05/C-H01/V1继续NOT_READY**，真微信/手机号/电话/JYT/资金均SOURCE_GAP。A完整可执行单：`07_重建工作区/F05-10_A主控首轮独立验收72项真PG16全绿但PDM15交接自动Guard与首响SLA证据未闭环整改单_2026-10-13.md`。

---

# 2026-10-13｜F05-9 A二轮独立终验PASS、PR48 GitHub正式合并；F05-10 PDM15 CI-only完整施工单已放行B（唯一最新）

- **现行唯一状态**：`F05_9_A_FINAL_ACCEPTED_MERGED_PR48 / F05_10_A_RELEASED_FOR_B / NEXT_OWNER=B / V1_NOT_READY`。A正式审PR48最后B HEAD `d3cbaee088f6ba7d6b81fbd014813bedcf77671f`、PDM14 R01～R04、最终源码及实证，并在PR签署[A_ACCEPTED](https://github.com/suzhe868-arch/mb/pull/48#issuecomment-6128118804)。GitHub标准PR merge实际`merged=true`，**真实合并提交`eb33d4b5ad31d44a9e5fdc0eff98d83bdf3f0842`**。完整A终验报告：`07_重建工作区/F05-9_A主控二轮独立验收70项真PG16_PR48标准合并及F05-10接力_2026-10-13.md`。
- **已独立核验的工程门禁**：9条官方`event=push`且最后B SHA一致、全部`completed/success`，冻结H52 Run`38271143903` **52/52**；I2`38271144061`、J2`38271144056`、K2`38271143898`、F05-4`38271143793`、F05-5`38271143838`、F05-6`38271143966`六组各2/2；F05-8`38271143990` 4/4；F05-9`38271144191` 2/2；合计**70/70真正非特权独立PG16 Job成功/零skip/fail**。新Source **17/17**、HTTPS **7/7**、旧Priority Source **37/37**、HTTPS **10/10**、兼容F05-7 Source **28/28**、HTTPS **7/7**，v25注错Rollback/旧Ledger&Catalog seal、真实双PG R01排他/恢复及R02～R04授权、价权转换、真实Lock/Transaction/批量成功。六份同最后SHA新Push原生有效Artifact `11756614385/11757197692/11757263373/11757083818/11758705112/11757137942`。
- **下一唯一已正式放行工程单**：`F05-10｜PDM-15 Consultation独立工单/真实direct source/assignee转派/停用Hold/15分钟首次真人响应SLA`，A已签**完整施工单** `07_重建工作区/F05-10_A主控PDM15咨询工单来源独立负责人转派人工首响SLA与客户停用Hold_CI隔离完整施工单_2026-10-13.md`。B从真正最新`main`新建独立`feat/f05-10-consultation-assignee-sla`，仅新建`engineering/f05/consultation-assignee-sla/**`和新增`.github/workflows/f05-10-*.yml`；v26只限可抛弃非超级用户PG16 CI sidecar，不修改旧M94/v25或旧签源码。完整保留已通过旧70独立PG16 Job + 新Source/HTTPS至少2个 → 最后新HEAD**≥72/72真PG16全绿、预计10条官方Push workflow同SHA、≥8份新Push原生有效Artifact**，并交正式中文`READY_FOR_A_INDEPENDENT_REVIEW`再由A独立验收；B不能自行合并。
- **仍在的产品门禁**：F05整体、C/H01高保真及V1全部`NOT_READY`；正式微信/手机号、咨询Customer/Employee生产Issuer、PDM10数字报价、JYT图片电话、真实电话/通知、资金、F06/UAT生产部署仍`SOURCE_GAP`，不得用隔离CI绿灯宣称上线或启动F06。

---

# 2026-10-12｜F05-9 A首次独立审查：70/70真PG16通过但PDM14四项实证未闭环，PR48退B（现行）

- **正式状态**：`F05_9_A_FIRST_REVIEW_CHANGES_REQUESTED_B_REWORK / PR48_OPEN_NOT_MERGED / NEXT_OWNER=B / V1_NOT_READY`。正式审查B HEAD `019ddc76e760b390265c017efed72a56aca65d8b`。A独立确认9条真正Push同SHA 70/70非特权PG16 Success、6份有效同SHA Push Artifact；Source12/12、HTTPS7/7、旧F05-8 Source37/HTTPS10、F05-7 Source28/HTTPS7，v25 rollback/seal均PASS。**这些成功证据保留**；但不能自动满足本批PDM14全合同审查。
- **四项独立产品审查阻断**：R01完全无其他Customer真正Priority占优后B旧Recommendation/Grant/价权历史保留、客户端/Share抑制与Priority结束恢复的真PG；R02无Level find off/on及多角色/跨Team Scope合法授权与撤权、Customer owner变更反例，现`sourceAuth(forTermination:true)`仍强制当前Customer active+find entitlement，存在禁用/降级后历史end/void闭锁风险；R03无价格咨询→后补数字价、调价快照不改、批发同车同cycle转名邦保权/新cycle不继承的真PG；R04无实际Lock/Transaction仍合法推荐、Manager/StoreHead/4S/个人deny正反例和双新车合法逐车批量/独立双PG跨域竞争的物理验证。这些是已正式放行的PDM14 Final及F05-9施工单必须项，不声称未测就必有代码bug。
- **唯一B下一施工**：保持`feat/f05-9-recommendation-visibility-grants`，仅F05-9新CI-only白名单一次性补全R01～R04，保留既有12/7及旧68全部真PG16测试；新B最终SHA仍须重新9官方Push同SHA至少70/70 success、6份有效同SHA Push Artifact及全套真实新负例/SQL seal/中文交接，正式`READY_FOR_A_SECOND_INDEPENDENT_REVIEW`后再交A。不合并PR48、不启动F06、无生产Issuer/JYT/微信/价格/资金/UAT授权，F05/C-H01/V1继续`NOT_READY`。**完整中文整改单：`07_重建工作区/F05-9_A主控首次独立验收70项真PG16全绿但PDM14跨域权限与权益生命周期缺证整改单_2026-10-12.md`**。

---

# 2026-10-12｜F05-8 A第六轮独立终验PASS，PR47真实合并；F05-9 PDM14完整施工单已正式放行B（唯一最新）

- **唯一当前状态**：`F05_8_A_FINAL_ACCEPTED_MERGED_PR47 / F05_9_A_RELEASED_FOR_B / NEXT_OWNER=B / V1_NOT_READY`。A已对最后B工程HEAD `1dc08927b6b11e2327050d55e6f72f6f19984e8e`独立复核R01～R13及PDM-02/03/13，并在PR47签署`A_ACCEPTED`（[正式评论](https://github.com/suzhe868-arch/mb/pull/47#issuecomment-6123630533)）；标准GitHub merge已实际返回`merged=true`，**merge SHA `d37b3fc9e44f4affd3b611c38c7c303bac93acb2`**。不是B_SELF_TESTED充当A验收，也不是只有评论未合并。验收/合并中文全记录：`07_重建工作区/F05-8_A主控第六轮独立验收68项PG16通过_PR47正式合并与F05-9技术接力_2026-10-12.md`。
- **正式工程证据**：八个官方Push Runs与最后B SHA完全一致：H52 `38242775587` 52/52，I2 `38242775430`、J2 `38242775671`、K2 `38242775501`、F05-4 `38242775553`、F05-5 `38242775395`、F05-6 `38242775391`各2/2，F05-8 `38242775552` 4/4，合计**68/68真实非特权PG16成功、0skip/fail**；Priority Source37/37、HTTPS10/10、兼容F05-7 Source28/28、HTTPS7/7，v24迁移注错回滚/封印与真实双PG权限撤权、跨Store/Team Manager/StoreHead和原Sales撤责时序PASS。四份新真正Push同SHA官方有效Artifact：`11744252155/11744295810/11743416591/11744405973`。
- **下一唯一任务已正式放行**：`F05-9｜PDM-14 正式 Recommendation / hidden Vehicle客户专属Visibility / current-cycle免费批发数字价权 / 普通分享不继承权限`，不是在旧F05-8分支续写。A已提交完整中文施工单：`07_重建工作区/F05-9_A主控PDM14正式推荐隐藏车单车可见性免费批发查价和普通分享隔离完整施工单_2026-10-12.md`。B从执行时**最新main**新建`feat/f05-9-recommendation-visibility-grants`，仅改`engineering/f05/recommendation-visibility-grants/**`和新增`.github/workflows/f05-9-*.yml`，CI-only v25且保护旧v24及之前账；不修改旧签名迁移、旧源码/工作流/PDM/真实生产。单包完整真实PG16 Source+HTTPS并发/数据scope/顾客价权/Share防越权、新老兼容至少**70/70独立PG16 Jobs**（旧68+新2）、预计9个真正同最终SHA Push工作流、至少6份新同SHA原生Artifact及完整中文交接，最终`READY_FOR_A_INDEPENDENT_REVIEW`才交A。
- **明确仍未完成/禁做**：F05整体并**非**生产通过，Recommendation/微信Customer正式生产Issuer、手机号、JYT/图片/批发电话、数字价、资金/支付、真实UAT部署等`SOURCE_GAP`；C/H01高保真未验收，整个V1基线继续`NOT_READY`。F06不得自行提前开工。A本轮无需新用户技术审批；下一个窗口为B，完成新包后A独立验收才合并。

---

# 2026-10-12｜F05-8 A第五轮独立验收：68/68真PG16成功，但跨店合法Scope与原销售撤权两项未闭环，PR47退B（唯一最新）

- **现行唯一指针**：`F05_8_A_FIFTH_REVIEW_CHANGES_REQUESTED_B_REWORK / PR47_OPEN_NOT_MERGED / NEXT_OWNER=B / V1_NOT_READY`。A核B/PR47最后HEAD `f534b2ec60ddfedc36f154dcae4d41ff9f3227b2`，PR仍Open/未合并，23个变更文件均本批新增CI-only白名单，旧签F03/F04/F05-1～7/迁移和产品Authority不改。
- **已经独立核实、必须保留**：八官方同HEAD **Push** Runs H52 `38231248375` 52/52、I2 `38231248464`、J2 `38231248352`、K2 `38231248565`、F05-4 `38231248542`、F05-5 `38231248575`、F05-6 `38231248421`六组各2/2、F05-8 `38231248611` 4/4，共**68/68真实独立PG16 Job成功、无skip/fail**。原生Priority Source36/36、HTTPS10/10，旧F05-7 Source28/HTTPS7，v24注错回滚/双PG撤权均PASS；四份同SHA有效Push Artifact `11739594838/11739106790/11738972335/11738742541`。R10无权同店不同Team DENY及R11 pending旧Match失效已获源码+真PG支持，原R01～R09成果不推倒。
- **第五轮独立发现两项已签规则阻断**：**R12** `service.mjs scopeSQL`及v24`f05_8_actor_priority_scope_ci/actor_demand_scope_ci`硬要求员工主Store==对象Store且本人直接隶属对象Team；即使经理/店长具明确跨Store/Team Permission + DataScope亦不可能被允许，违背PDM-02 Final §2/4，B已自认未做真实跨Store/经理店长正反例。**R13** 普通Sales只需等于旧`Priority.responsible`或`Handover.original`便能通过actor对象Scope，未核Demand/Customer当前已变更责任，Pending时旧销售主账号/Scope仍有效即可发起/重试/影响别人的Handover，违反PDM-13§24/25/31。非新产品决策。完整可执行A整改单：`07_重建工作区/F05-8_A主控第五轮独立验收68项真PG16通过但跨店合法Scope与交接旧销售撤权未闭环整改单_2026-10-12.md`。
- **唯一下一B**：继续原`feat/f05-8-priority-arbitration-ttl-handover`，在原CI-only新增白名单补R12真实跨门店跨团队合法授权正反例和R13待交接原销售失权后真实PG16操作拒绝/并发；旧64冻结、旧F05-7 28/7及本批Priority36/10测试不删弱。最后**新唯一B SHA八官方同SHA Push 68/68 success**＋四份新Push原生有效Artifact、源码/SQL seal/双PG与中文B正式交审`READY_FOR_A_SIXTH_INDEPENDENT_REVIEW`再交A。PR47不合并，不启动F05-9/F06，生产微信/JYT/数字报价/资金等继续SOURCE_GAP，F05/C-H01/V1 `NOT_READY`。

---

# 2026-10-12｜F05-8 A第四轮独立验收：同SHA真实PG16 68/68通过，但操作者对象Scope及Pending失效Match保护两项未闭环，PR47退B（唯一最新）

- **正式唯一指针**：`F05_8_A_FOURTH_REVIEW_CHANGES_REQUESTED_B_REWORK / PR47_OPEN_NOT_MERGED / NEXT_OWNER=B / V1_NOT_READY`。A独立核PR47最新B HEAD `2d2bb3beb5943319b73a08f1fb1efb10fecd4b73`、23项新增施工白名单、PDM-13 §§14/24/25/26/30/31及第四轮实际代码；本轮不签`A_ACCEPTED`、不合并PR47。
- **已独立通过硬证据**：八份官方**Push**工作流 H52`38222101865`=52/52；I2`38222102061`、J2`38222101879`、K2`38222102212`、F05-4`38222101868`、F05-5`38222101889`、F05-6`38222101915`均2/2；F05-8**Push**`38222102083`=4/4，总**68/68同SHA真实PG16成功、0skip/fail**。原生日志Priority Source34/34、HTTPS10/10、兼容F05-7 Source28/28/HTTPS7/7、v24回滚、R09真实双PG撤权竞争均成功。四份Push同SHA有效Artifact `11735530228/11734941344/11734881494/11734204434`。B交接所列F05-8 run `38222105342`实际上是`pull_request`而非Push；A已另查到确实成功的正式Push运行与其四份Push原生证据。R08/R09修复已有实物/真实测试，不推倒重来。
- **本轮新增业务安全阻断**：**R10** `initiateHandoverCI/retryHandoverCI`（及相关Priority业务操作）仅凭actor登录和请求传入teamId的通用权限，不核当前Priority/Customer/Demand对象Scope，可能由无关团队员工创建/推进别人的handover；**R11** `f05_8_pending_source_ci`以Demand/Customer负责人与旧Priority不一致作为保留条件，未核当前合法`high/acceptable` Match，`reconcile_scope_ci`和`reArbitrate`由此提前返回，可能让stale/no_match旧Priority继续排他。均违反已签PDM13而非新产品选择。完整可执行单：`07_重建工作区/F05-8_A主控第四轮独立验收68项PG16通过但待交接合法匹配与操作者对象Scope未闭环整改单_2026-10-12.md`。
- **下一唯一责任B**：继续`feat/f05-8-priority-arbitration-ttl-handover`按F05-8新CI-only白名单一次性修复R10/R11，补跨Team/Store操作发起人DENY及Pending+过期Match源COMMIT后即时失效的真PG16正反例、合法源交接对照、双PG权限撤销竞争；冻结旧64PG16、原F05-7兼容28/7、Priority既有34/10全部保留。最终新HEAD**8官方Push run同SHA68/68**成功＋四份新有效**Push**原生Artifact＋最新中文自验和PR正式交A，A才能重新独立验收。不得启动F05-9/F06或上线。真实微信/手机号/Priority Issuer/数字价/JYT/资金等仍`SOURCE_GAP`，F05/C-H01/V1仍`NOT_READY`。

---

# 2026-10-12｜F05-8 A第三轮独立验收：同SHA68/68真PG16全成功，但Priority责任源/对象Scope两项未闭环，PR47正式退B（唯一最新）

- **最新正式指针**：`F05_8_A_THIRD_REVIEW_CHANGES_REQUESTED_B_REWORK / PR47_OPEN_NOT_MERGED / NEXT_OWNER=B / V1_NOT_READY`。A审查B/PR47本轮最新提交 `8b46d25be418160bee08dffa878c425485f88ffa`，对照完整施工单、PDM-13 Final §§24/25/26/31、二轮整改单R05～R07与独立源码；本批23项文件均全新、白名单内，没有修改旧签生产代码和历史迁移。
- **保留已验证工程事实**：八个官方Push工作流H52 `38212636374` **52/52**；I2 `38212636372`、J2 `38212636299`、K2 `38212636403`、F05-4 `38212636380`、F05-5 `38212636389`、F05-6 `38212636376`各**2/2**；新F05-8 `38212636369` **4/4**，共**68/68独立真实PG16 jobs success、零skip/fail**，全部最后同SHA。原生日志旧F05-7 Source28/28 HTTPS7/7、Priority Source34/34 HTTPS10/10；双PG PID263/271竞争`SQLSTATE55P03`、R07独立后端PID272锁等待与TTL不变、v24注错回滚和结构seal均已读。四份新同SHA有效Artifact `11730350811/11730225983/11729847696/11729553952`；不跨SHA拼旧成功。B实现R05～R07的事件/状态机制保留。
- **A独立产品安全审核阻断R08/R09**：`R08` successful `retryHandoverCI`仅改Priority.responsible，不验证签名`trigger Demand.current responsible`是否已合法变更；已完成handover后的主动仲裁另开特例固化这个不一致，34/34用例真实成功但漏测权威双源。违反PDM-13 §24/25。 `R09` target仅使用`f05_8_responsible_authorized_ci(targetEmployeeId)`在**任意其它Team/Store**存在管理权即满足，缺针对该Priority/Demand/customer的实际object scope判断，违反PDM-13 §31。详见本轮A正式可执行整改单：`07_重建工作区/F05-8_A主控三轮独立验收68项PG16通过但Priority交接源责任与对象Scope失配整改单_2026-10-12.md`、PR47 A最新审核评论。**PR47未通过，不合并**。
- **下一唯一责任B**：继续原`feat/f05-8-priority-arbitration-ttl-handover`分支，在原v24 CI-only白名单一次性闭合R08/R09及原生真实PG16跨scope/权威责任正反例，不更改已签旧64 Job、F05-7 28/7或Priority旧34/10用例；最终更新新B/PR SHA重得**8个官方Push run同SHA68/68**及4个新非空有效Artifact、完整中文交接`READY_FOR_A_RE_RE_RE_REVIEW / NEXT_OWNER=A`，再交A独立复验。F05-9/F06未放行；生产身份/数字报价/JYT/资金等仍`SOURCE_GAP`，F05/C-H01/V1`NOT_READY`。

---

# 2026-10-12｜F05-8 A二轮独立验收：同SHA 68/68真实PG16全部PASS，但PDM13恢复仲裁/正式交接三项缺口，PR47继续退B（唯一最新）

- **当前唯一指针**：`F05_8_A_SECOND_REVIEW_CHANGES_REQUESTED_B_REWORK / PR47_OPEN_NOT_MERGED / NEXT_OWNER=B / V1_NOT_READY`。A独立核对[PR47](https://github.com/suzhe868-arch/mb/pull/47)最新B/PR HEAD `e873adeabc2e4a40149eb6b8c8a20a9189d69319`，23项全新增白名单；相对当前main为ahead42/behind6，后6项系A前轮主线验收和状态更新，并未授权强推/覆盖。
- **认可且保留的真实工程门禁**：同最终SHA八官方Push run H52 `38208004686` **52/52**、I2 `38208004665`、J2 `38208004648`、K2 `38208004630`、F05-4 `38208004508`、F05-5 `38208004595`、F05-6 `38208004624`各**2/2**、F05-8 `38208004633` **4/4**，合计**68/68独立真PG16 Jobs全success、0skip/fail**。七组冻结旧64 Jobs之`jobs:\n`全文逐字不变，F05-7 Source 28/28、HTTPS 7/7与新Priority Source 27/27、HTTPS 10/10原生通过。真实双PG PID240/241及`55P03`、v24迁移注错回滚/SQL与catalog seal已直接查日志；四份最新同SHA有效Artifact：`11727729260 / 11727933765 / 11728063884 / 11728185904`。
- **A第二轮未通过的已签PDM13边界**：B原R01～R04已有对应SQL/Service/测试，需**追加R05** Demand复活/Vehicle重新可售在无active Priority时没有affected-scope事件触发自动仲裁；**R06** Lock或Transaction结束/取消未触发恢复仲裁（旧ended绝不能复活）；**R07** Employee失活/Scope撤销的来源触发直接ended或重分配，未生成PDM13§25/26正式Handover Batch并保持合法待交接保护。见A完整第二轮整改单：`07_重建工作区/F05-8_A主控二轮独立验收68项真PG16通过但恢复仲裁与责任交接未闭环整改单_2026-10-12.md`，以及PR47最新A评论。**A未签A_ACCEPTED，不合并PR47**。
- **下一唯一B**：继续原`feat/f05-8-priority-arbitration-ttl-handover`分支一次性完成R05～R07、全部真实PG16新增正反例/并发/审计，保持七组冻结64 Job和旧28/7、新27/10回归，新唯一最终HEAD再取得**8官方同SHA Push run 68/68**成功、四份新原生有效Artifact与完整中文交接`READY_FOR_A_RE_RE_REVIEW / NEXT_OWNER=A`，再由A独立复验。**F05-9/F06未放行**。
- **生产限制不变**：真实微信身份/手机号、Priority正式Issuer、find权益、数字报价、JYT/电话/图片、资金/UAT仍`SOURCE_GAP`；F05、C-H01及V1整体`NOT_READY`。

---

# 2026-10-12｜F05-8 A首次独立验收：同SHA68/68真PG16 CI全部成功但PDM13四项规则边界未闭环，PR47正式退B整改（唯一最新）

- **当前唯一指针**：`F05_8_A_FIRST_REVIEW_CHANGES_REQUESTED_B_REWORK / PR47_OPEN_NOT_MERGED / NEXT_OWNER=B / V1_NOT_READY`。本轮A审核了B [PR47](https://github.com/suzhe868-arch/mb/pull/47) 唯一受验HEAD `8c296513c5f9f7b2a176560313c3e6db30a61abc`，compare原main `ahead35/behind0`，23个文件全部新增且仅在F05-8白名单；B正式交审PR评论`6117312297`，A正式验收评论 [6117566975](https://github.com/suzhe868-arch/mb/pull/47#issuecomment-6117566975)。
- **已认可的真实CI门禁**：同SHA八条GitHub官方Push run H52`38200112071`**52/52**、I2`38200112052`、J2`38200112045`、K2`38200111930`、F05-4`38200111921`、F05-5`38200111927`、F05-6`38200112289`各**2/2**，本批`38200112015`四Job**4/4**，共**68/68独立PG16 Job completed/success、零skip/fail**。F05-7真实兼容Source28/28、HTTPS7/7及Priority Source20/20、HTTPS10/10均原生通过；原生PID263/264、SQLSTATE55P03、v24 checksum/catalog与真实迁移回滚已见；四份官方同SHA、非空未过期Artifact`11724649956`（109027B）/`11725170394`（99427B）/`11725116058`（103037B）/`11725315587`（99013B）。已签旧64 Job未被B修改。
- **A独立产品代码复核未通过**：根据已批准`PDM-13 Final` §§9/12/13/14/26/30及`PDM-14 Final` §§10/11/15，仍缺 **R01**同Customer多Demand不同source signature可能绕过同cycle release/TTL suppression，**R02** Demand/Match/Customer/Vehicle等状态变更缺影响范围自动失效且只有手动arb才能清旧Priority，**R03** Recommendation+Grant客户可见性投影未再次校验Customer active/find entitlement/cycle validity，**R04** TTL到期无独立ended/suppression/后继重仲裁而保留原active唯一索引。现有20条Source测试未覆盖上述情形，68/68全绿不代表产品规则已闭环。正式可执行整改单：`07_重建工作区/F05-8_A主控首次独立验收68项真PG16通过但PDM13生命周期及可见性边界未闭环整改单_2026-10-12.md`，GitHub PR47验收评论`6117566975`。
- **下一责任窗口B**：继续原`feat/f05-8-priority-arbitration-ttl-handover`分支，在原A施工单`07_重建工作区/F05-8_A主控PDM13_Priority资格仲裁TTL排他与责任交接CI隔离完整施工单_2026-10-12.md`白名单内一次性修复R01–R04并新增真实PG16正反例；保持旧64 Job冻结、F05-7 28/7兼容测试与F05-8原20/10；最后以新唯一B/PR SHA重新取得**8官方push run同SHA68/68**success及四份新原生有效Artifacts、完整中文交接`READY_FOR_A_RE_REVIEW / NEXT_OWNER=A`。**PR47未合并，F05-9/F06未放行**；下方早期“F05-8 B尚未开工”及原F05-7放行文字仅是历史记录。
- **绝不扩大生产Authority**：Customer微信/手机号、Priority控制正式Issuer、Rule/find权益、客户真实数字价、JYT/电话/图片、交易资金及上线UAT仍`SOURCE_GAP`；F05、C-H01、高保真及V1总体继续`NOT_READY`。

---

# 2026-10-12｜F05-7 A二轮正式验收66/66真PG16 PASS、PR46成功标准合并；F05-8 PDM13 Priority全包68项独立PG16正式放行B（唯一最新）

- **当前唯一真实指针**：`F05_7_A_FINAL_ACCEPTED_MERGED_PR46_CI_ONLY / F05_8_A_RELEASED_FOR_B_B_NOT_STARTED / NEXT_OWNER=B / V1_NOT_READY`。B最终HEAD `99c38d013f67cc56975f1664120fb87c204afc3c`，A独立二轮[PR46验收签批](https://github.com/suzhe868-arch/mb/pull/46#issuecomment-6115975938)，GitHub实际标准`merge_pull_request(expected_head_sha=99c38d013f67cc56975f1664120fb87c204afc3c,merge_method=merge)`回执`merged=true`，**正式merge SHA `a56cc04e5a1d79fd67ad5332992d33348d123557`**；PR46现已`closed/merged`。正式A二轮报告：`07_重建工作区/F05-7_A主控二轮独立验收66项真PG16_PR46标准合并与F05-8技术交接_2026-10-12.md`。下方“F05-7首次验收退B”只代表历史，不是现时阻断。
- **A独立同SHA门禁**：八个GitHub原生push run H52`38189425576`**52/52**、I2`38189425640`、J2`38189425565`、K2`38189425539`、F05-4`38189425599`、F05-5`38189425553`、F05-6`38189425588`各**2/2**、本批F05-7`38189425635`**2/2**，合计**66/66真实隔离非超级用户PG16 Job成功、0skip/fail**，均最终B HEAD；七旧组冻结`jobs:\n`到EOF逐字相同；Source`7-A01～A28`**28/28**、HTTPS`7-B01～B07`**7/7**，原生双PG PID223/224、223/225均真实SQLSTATE55P03。上轮四项R01偏好未知、R02 active Lock占用、R03 Rule partial retry、R04年款范围与原始provenance均真实Source`7-A25～A28 PASS`。同SHA两新Artifact Source`11721556439`（101246B）、HTTPS`11721595542`（96332B），均有效非空。
- **下一唯一B正式完整施工单**：`07_重建工作区/F05-8_A主控PDM13_Priority资格仲裁TTL排他与责任交接CI隔离完整施工单_2026-10-12.md`。从B实施时最新main新建`feat/f05-8-priority-arbitration-ttl-handover`，按用户已通过的PDM-13 Final，实施独立Priority资格/统一Match消费、high>acceptable>原始Demand创建时间>demand_id仲裁、TTL/提前release/suppression、active Lock/Transaction排他、权限/责任handover与公海/Customer可见性边界，仅**CI-only**。**正式门禁8份新workflow共68个真实独立PG16 Job（七组冻结旧64个原Job原文+两项F05-7等效兼容真PG16回归+两项全新Priority PG16），四份新有效原生Artifacts，同最后B/PR SHA。**F05-7 Source内硬编码旧自身workflow同HEAD audit，在新F05-8分支不可能原样复跑，A已在施工单裁定“不改已签旧代码、重验旧28/7真实用例，仅将旧分支专属审计改由本批全新的68项官方只读审计承担”。B不得自行合并main、不得开始F05-9/F06。
- **严格未解生产门禁**：实际Customer微信、手机号、find/Rule/Priority资格控制Issuer、客户显示数字价、一般批发Scope/图片/JYT/电话/交易资金等继续`SOURCE_GAP`；本批全部只是可抛弃CI合同，F05/F04生产、C-H01、整车V1一律`NOT_READY`，不表示正式上线授权。

---

# 2026-10-12｜F05-7 A首次独立验收：66/66同SHA真PG16 CI通过，四项PDM12业务反例未闭环，PR46正式退B整改（唯一最新）

- **正式唯一指针**：`F05_7_A_FIRST_REVIEW_CHANGES_REQUESTED_B_REWORK / PR46_OPEN_NOT_MERGED / NEXT_OWNER=B / V1_NOT_READY`。A实际独立核实最新交审PR46 B HEAD `855bb463096652ca70ef4327c86e10db4d092825`；八个GitHub原生同SHA Actions `38185881710 / 38185881669 / 38185881678 / 38185881716 / 38185881683 / 38185881661 / 38185881687 / 38185883832` **52+2+2+2+2+2+2+2 = 66/66真实非特权PG16 success零skip**，其中Source24/24、HTTPS7/7；七组冻结旧Job全文原样，25项新文件全部白名单；两个新官方同SHA非空有效Artifacts `11719249451`（94862B）/ `11719408424`（92141B）。
- **虽然CI门禁全绿，本轮A未签A_ACCEPTED**：独立源审阅与正式PDM-12 Final §8/§16/§18/§22/§30对照发现四项尚无正确实现及正反例：**R01** 明确preferred事实缺失错误评high；**R02** active Lock已占用事实未随匹配结果携带；**R03** Rule部分重算失败集合、失败原因及仅失败项幂等retry缺失；**R04** series_year范围词典和结构化>检测>详细描述>模糊词事实证据优先级缺失。正式A验收评论：[PR46 #6115435460](https://github.com/suzhe868-arch/mb/pull/46#issuecomment-6115435460)。
- **唯一下一责任窗口：B，继续原F05-7分支且不得自行合并main**。完整且可执行的A正式整改单：`07_重建工作区/F05-7_A主控首次独立验收66项真PG16通过但PDM12业务边界未闭环整改单_2026-10-12.md`。B一次补齐R01–R04和新原生PG16正反例，重新取得**最终新B/PR同SHA八条66/66真正PG16成功**、完整中文证据与两份新有效Artifacts，更新PR为`READY_FOR_A_RE_REVIEW`后再交A独立复验。**F05-8/F06未放行**。此处下方“F05-7 B_NOT_STARTED”是2026-10-12早一轮历史记录，不能用作现时工作指针。
- **生产边界未解除**：真实Customer微信/手机号、find和Rule权限生产Issuer、Customer实际显示价、一般批发管理Scope/隐藏/图片、JYT/电话/资金等均`SOURCE_GAP`；F05/F04生产、C-H01及整体验收`NOT_READY`。

---

# 2026-10-12｜F05-6 A独立验收64/64真实PG16 PASS、PR45标准合并；F05-7 PDM12确定性匹配Readiness/四级结果66项正式放行B（最新）

- **当前唯一正式状态**：`F05_6_A_FINAL_ACCEPTED_MERGED_PR45_CI_ONLY / F05_7_A_RELEASED_FOR_B_B_NOT_STARTED / NEXT_OWNER=B / V1_NOT_READY`。A真正独立完成[PR45验收意见](https://github.com/suzhe868-arch/mb/pull/45#issuecomment-6115027598)，GitHub原生标准`merge_pull_request(expected_head_sha=96f9d918e29c68803ff9ee167347fce2df5a7221, merge_method=merge)`实际回执`merged=true`，**PR45 merge SHA `ef66aeac1b782b201ccb1146bad4031f92d3955f`**。正式报告`07_重建工作区/F05-6_A主控独立验收64项PG16_PR45合并与F05-7接力_2026-10-12.md`。
- **F05-6验收核心证据**：PR45/最终B HEAD `96f9d918e29c68803ff9ee167347fce2df5a7221`、compare ahead4 behind0，21项全白名单新增。七官方同HEAD Actions旧H52 [38183188457](https://github.com/suzhe868-arch/mb/actions/runs/38183188457) **52/52**（公共镜像限流在同SHA attempt2复跑成功），I2 [38183188367](https://github.com/suzhe868-arch/mb/actions/runs/38183188367) 2/2、J2 [38183188537](https://github.com/suzhe868-arch/mb/actions/runs/38183188537) 2/2、K2 [38183188365](https://github.com/suzhe868-arch/mb/actions/runs/38183188365) 2/2、F05-4 [38183188450](https://github.com/suzhe868-arch/mb/actions/runs/38183188450) 2/2、F05-5 [38183188426](https://github.com/suzhe868-arch/mb/actions/runs/38183188426) 2/2、新F05-6 [38183188361](https://github.com/suzhe868-arch/mb/actions/runs/38183188361) Source/HTTPS 2/2，**64/64真实隔离PG16非superuser成功、零skip/fail**。六组冻结旧Job从`jobs:\n`至EOF全文**510382/1969/1981/2012/2015/2012**字符完全一致；Source**24/24**、HTTPS**7/7**原生#fail0。Owner变更PG服务/写PID222/225、Employee Permission撤销222/228、Level find entitlement关闭222/231三组真实数据库原生SQLSTATE `55P03`，证明事务/审计后状态安全，微信/手机号/权益的正向都是CI synthetic源。Source Artifact11718354406(88531B)、HTTPS11718258034(85972B)为最终SHA同Run新原生非空未过期证据。
- **下一唯一A正式完整施工单**：`07_重建工作区/F05-7_A主控PDM12确定性匹配Readiness四级结果与受信来源隔离完整施工单_2026-10-12.md`。B从执行时最新`main`建立`feat/f05-7-deterministic-matching-readiness-four-tier`，严格PDM-12 Final：只有正式Demand active+matching-ready、销售匹配描述经合法确定性词典解析且Customer/find entitlement有效才Matching；四级`high/acceptable/confirmation_needed/no_match`、OR/AND、hard/preferred/tolerance与事实provenance，Match Result绝不直接成为Recommendation/Priority/visibility/Lock或价格扣额，客户展示价正式Issuer缺失只能unknown，生产fail-closed。仅**新增**`engineering/f05/deterministic-matching-readiness-four-tier/**`及8新专属workflow，冻结历史7组**64**个Job完整字节级`jobs:\n`不变，新Source/HTTPS**2**，八组官方最终同唯一B/PR SHA合计**66/66真实非特权PG16 success零skip**、两份本批原生有效Artifacts、真双Backend并发与中文交接。B不自行合并main/启动F05-8或F06。
- **生产仍受阻**：Customer微信Session及手机号合法授权、Level find entitlement/Employee人工Demand开通及Rule管理真实Issuer、客户数字售价与查价、Recommendation免费权限、普通批发对象Scope、隐藏重算、图片资产化、JYT/电话/资金等均保持SOURCE_GAP；F05/F04生产、C-H01及V1整体基线**`NOT_READY`**。之前F05-6 B交A待验收/PR45开放是历史阶段而非现时下一步。

---

# 2026-10-12｜F05-5 A二轮独立验收62/62真PG16 PASS、PR44标准合并；F05-6 PDM11找车Application/Demand完整施工单正式放行B（最新）

- **正式唯一状态：`F05_5_A_FINAL_ACCEPTED_MERGED_PR44_CI_ONLY / F05_6_A_RELEASED_FOR_B_B_NOT_STARTED / NEXT_OWNER=B / V1_NOT_READY`。** A正式独立[PR44二轮验收意见](https://github.com/suzhe868-arch/mb/pull/44#issuecomment-6114740787)已闭环前三项整改，GitHub标准`expected_head_sha`合并实际返回`merged=true`，PR44合并SHA `32ccc088b5662d8d11aad41dd596af5b8b9c2697`。详细审计`07_重建工作区/F05-5_A主控二轮真实并发验收62项PG16_PR44正式合并与F05-6接力_2026-10-12.md`。
- **F05-5最终证据**：B/PR44唯一末HEAD `9f1d0fb86ce5187bf4be4c1fbb5e173adcba7b10`。同SHA官方原生H52 [38180672311](https://github.com/suzhe868-arch/mb/actions/runs/38180672311) 52/52（attempt2，公共PG16镜像限流官方补跑），I2 [38180672443](https://github.com/suzhe868-arch/mb/actions/runs/38180672443) 2/2，J2 [38180672306](https://github.com/suzhe868-arch/mb/actions/runs/38180672306) 2/2，K2 [38180672428](https://github.com/suzhe868-arch/mb/actions/runs/38180672428) 2/2，F05-4 [38180672288](https://github.com/suzhe868-arch/mb/actions/runs/38180672288) 2/2，新F05-5 [38180672441](https://github.com/suzhe868-arch/mb/actions/runs/38180672441) 2/2，合计**62/62真实隔离非特权PG16 success无skip**。五组原`jobs:\n`至EOF **510382/1969/1981/2012/2015**逐字完全一致，B改动20项全部授权新增。新Source22/22、HTTPS7/7，两个官方Job原生源日志证明真正两Backend Customer Owner变更(208/209)、个人Permission撤权(208/210)、Scope绑定撤销(208/211)发生`SQLSTATE55P03`，先后提交顺序与撤销后旧新幂等Key拒绝、ledger/adjustment/不可变审计原生行/哈希一致。真实Artifacts Source11717611263(88073B)、HTTPS11716809234(83255B)，均同最新SHA且有效。
- **F05-6下一唯一完整施工单**：`07_重建工作区/F05-6_A主控PDM11找车Application与Demand独立生命周期等级权益Owner受信安全完整施工单_2026-10-12.md`。指定B新分支`feat/f05-6-find-car-application-demand-eligibility`，必须从执行时**最新main**建；按已签PDM-11 Final与F05路线图对Find-car Application/pending与正式Demand/manual activation严格分离，Owner/手机授权/Customer Level可配置find-car entitlement/Employee现时权限+Scope逐层受信门禁；普通客户可提交合格pending但不可自动Demand，粉丝VIP也不自动Demand、客户等级名称不是权限；缺真实Issuer生产fail-closed，CI合成正例只用于真实PG隔离证明，不能将价格查看权益代替找车权益。
- **F05-6强制验收**：新增`engineering/f05/find-car-application-demand-eligibility/**`+7个专属新workflow（6份冻结历史H52/I2/J2/K2/F05-4/F05-5的`jobs:\n`完整原样共62 Job；1个本批Source+HTTPS两项真实PG16），最终**7个官方同B/PR最终SHA 52+2+2+2+2+2+2=64/64 success、零skip**及本批2份原生有效Artifacts、签名PG历史/Schema seal、真实Permission/Owner竞态、中文B完整自验。B一次性做完，**不自行合并main或先启动F05-7/F06**，交A独立审核；CI/数据库仅在被明确授权的可抛弃非superuser PG16，不准碰生产/旧签迁移/PDM/C设计。
- **持续真实来源风险未关**：F05-5生产Employee加次独立Issuer、微信Customer Session/合法手机号授权、Customer真实数字售价、Recommendation免费Issuer、一般批发Owner Scope、隐藏原因重算、图片资产化、上游JYT/电话/资金均保持SOURCE_GAP；F05/F04生产、C-H01及整体V1 **`NOT_READY`**。旧文档中“F05-5 B整改中/PR44待合并”为历史审查时点，不再代表当前下一步。

---

# 2026-10-12｜F05-5 A首次独立审查：官方62/62 CI全绿，但Owner与Permission撤权真实并发交错证据缺失；PR44退B一次性整改（最新）

- **状态：`F05_5_A_FIRST_REVIEW_CORRECTION_REQUIRED_B_REWORK / PR44_OPEN_NOT_MERGED / NEXT_OWNER=B`**。当前最新正式施工依然是F05-5，不新放行F05-6。A[PR44独立审查与完整整改单](https://github.com/suzhe868-arch/mb/pull/44#issuecomment-6114488249)及仓库`07_重建工作区/F05-5_A主控首次独立验收62项同SHA全绿但Owner撤权并发证据不完整定向整改单_2026-10-12.md`为当前唯一整改依据。
- **已核成功不否认**：原B分支`feat/f05-5-employee-price-quota-adjustment` / [PR44](https://github.com/suzhe868-arch/mb/pull/44)审查HEAD `8a5ed0fd8733e9f89f39f60d49c6a02a330e6086`；官方六条Actions [旧H52 38178976123](https://github.com/suzhe868-arch/mb/actions/runs/38178976123) attempt2 **52/52**、[I2 38178976144](https://github.com/suzhe868-arch/mb/actions/runs/38178976144) 2/2、[J2 38178976179](https://github.com/suzhe868-arch/mb/actions/runs/38178976179) 2/2、[K2 38178976110](https://github.com/suzhe868-arch/mb/actions/runs/38178976110) 2/2、[F05-4 38178976118](https://github.com/suzhe868-arch/mb/actions/runs/38178976118) 2/2、[本批F05-5 38178976134](https://github.com/suzhe868-arch/mb/actions/runs/38178976134) 2/2，同最终SHA共**62/62独立非特权真实PG16 success无skip**。H52一个公共PG16镜像限流项同SHA官方重跑，最终全绿；Source原生**18/18**、HTTPS**7/7**。旧60 Jobs `jobs:\n`到EOF全文510382/1969/1981/2012/2015字符原文全部逐字相同；20个变更全是白名单新增，旧签业务/DDL/CI/产品/生产原样。source Artifact11717147410(82942B)、https Artifact11716758591(81968B)同SHA非空未过期。
- **未过门禁具体原因**：正式F05-5施工单要求真实两PG backend“**权限撤销与当前加次事务竞争**”和“**Owner交接与变更竞态**”；新Source 5-A04只是同Key并发单追加，5-A13是**先静态deny**后请求，5-A16是**先变更Owner**后请求。未出现“加次事务持有Current Customer/Permission锁未提交时，第二PG backend变更Owner或撤销独立permission”的可复现事务交错、真实锁争抢SQLSTATE和精确后续拒绝证据。不能仅凭62绿灯替代未完成的验收事项，**A尚未准许合并PR44**。
- **一次整改三项**：A-F05-5-01 同Customer当前Owner与加次事务两个真实PG backend竞争；A-F05-5-02 员工Permission deny/Scope撤销与加次事务两个PG backend竞争，含锁等待/`55P03`、前后双向先后次序、撤权后重复请求零追加；A-F05-5-03 原分支白名单修复/源日志/SQL行数哈希/两PID证据/新SHA六官方workflow **52+2+2+2+2+2=62/62**全成功+两个同最新SHA原生有效Artifacts、中文B更新正式交A。B不自行合并main，不改已冻结源码或PDM，不假造任何真实生产权限。
- **产品未放行**：真实`F05_5_EMPLOYEE_ADDITION_SOURCE_GAP`、微信Customer Session、正式客户数字价、推荐免费Issuer、普通批发Owner、隐藏与图片资产化、实际JYT/钱/电话仍阻断；F05/F04生产、C-H01和V1保持`NOT_READY`。

---

# 2026-10-12｜F05-4 A独立验收60/60、PR43正式合并；F05-5 Employee查价免费加次可信权限工程已放行（唯一最新）

- **已合并**：[PR43](https://github.com/suzhe868-arch/mb/pull/43) F05-4 B最终HEAD `cbf1c3f83e0c8f0b17ce89bd9f4edbc45bf9abfa`；A直接查五原生官方CI run HEAD同SHA，冻结H52 [38177212934](https://github.com/suzhe868-arch/mb/actions/runs/38177212934) 52/52、I2 [38177212886](https://github.com/suzhe868-arch/mb/actions/runs/38177212886) 2/2、J2 [38177212901](https://github.com/suzhe868-arch/mb/actions/runs/38177212901) 2/2、K2 [38177212889](https://github.com/suzhe868-arch/mb/actions/runs/38177212889) 2/2、新F05-4 [38177212996](https://github.com/suzhe868-arch/mb/actions/runs/38177212996) 2/2，**60/60真实非特权独立PG16 success、零skip**。旧四组 `jobs:\n`至EOF字符510382/1969/1981/2012，A独立全文逐字比较均一致；仅19个授权新增文件，没有改旧源码/迁移/产品或生产。
- A亲读新Source 16/16及HTTPS 7/7原生日志，两个实际PG16 backend同Customer锁确保成功首扣唯一，PDM10 LIMITED/UNLIMITED、UTC+8、3A等级变化及Customer停用均真库测试；v20仅**CI合成客户最终展示数字价/等级配置**，尚无真实微信Customer/真实售价Issuer/Recommendation免费Issuer/Employee免费加次Issuer，线上仍全部fail-closed。新增原生Artifact `11716138787` source 81472B、`11715779852` https 80589B，两者同最终SHA、未过期。A正式PR43[独立验收评论](https://github.com/suzhe868-arch/mb/pull/43#issuecomment-6114138032)后携expected_head_sha标准合并GitHub回执`merged=true`，merge SHA **`ab664859aee927a6d1514d5654ba5fe2f8dba60b`**。A完整报告`07_重建工作区/F05-4_A主控独立验收60项PG16_PR43合并与F05-5接力_2026-10-12.md`。
- **当前唯一正式B任务：F05-5**，完整施工单`07_重建工作区/F05-5_A主控Employee当天查价临时加次可信Owner权限和3A账本完整施工单_2026-10-12.md`。B从**最新main**建`feat/f05-5-employee-price-quota-adjustment`，按PDM-10 §11/§11.1、F03实时Employee Session/permission/scope及当前Customer owner，受控隔离CI核员工合法免费追加当天次数、普通销售Owner门禁/经理店长Scope/4S/SystemAdmin拒绝、3A等级切换、UTC+8日切、并发幂等与不变审计。真正未签Issuer仍SOURCE_GAP，不能伪造生产加次200；只新工程目录及**6份新Workflow**，旧H52/I2/J2/K2/F05-4共60个冻结Jobs逐字保全，新增Source/TLS 2 Job，要求六Actions最终**同B/PR SHA 62/62真PG16成功**、2非空原生Artifacts与中文B交接再交A，B不自行合并或入下批。
- **未关闭**：真实微信Customer会话 `CUSTOMER_WECHAT_SESSION_TO_FAVORITE_ACTOR_SOURCE_GAP`、正式售价 `CUSTOMER_DISPLAY_NUMERIC_PRICE_PRODUCTION_SOURCE_GAP`、推荐免费签发 `F05_4_RECOMMENDATION_GRANT_ISSUER_SOURCE_GAP`、Employee加次Scope `F05_4_EMPLOYEE_QUOTA_ADDITION_CURRENT_SCOPE_SOURCE_GAP`、普通无Lock批发Owner、隐藏原因重算、图片资产化和外部JYT/资金/电话/生产。F05/F04生产、C-H01及V1继续`NOT_READY`。**`F05_4_A_FINAL_ACCEPTED_MERGED_PR43_CI_ONLY / F05_5_A_RELEASED_FOR_B_B_NOT_STARTED / NEXT_OWNER=B`**。

---

# 2026-10-12｜F05-3K A独立验收58/58真PG16 PASS、PR42正式合并；F05-4批发查价日额与周期权益施工单已正式放行（唯一最新）

- **A正式独立验收F05-3K**：B分支`feat/f05-3k-favorite-converted-jyt-replay-guard`/[PR42](https://github.com/suzhe868-arch/mb/pull/42)最终HEAD `9428a3753240198b4a1f01732a7ef09b95897e81`，四原生Actions [H52 38174161044](https://github.com/suzhe868-arch/mb/actions/runs/38174161044) attempt2 **52/52**、[I2 38174161057](https://github.com/suzhe868-arch/mb/actions/runs/38174161057) **2/2**、[J2 38174161046](https://github.com/suzhe868-arch/mb/actions/runs/38174161046) **2/2**、[K2 38174161053](https://github.com/suzhe868-arch/mb/actions/runs/38174161053) **2/2**均同一最终SHA `completed/success`，**58/58独立非特权真PG16 Job通过且0 skip**。H52/I2/J2 `jobs:\n`至EOF完整旧工作流原文长度510382/1969/1981字符，A独立逐字对比全部相同；仅11个新增授权文件，没有旧源码/迁移/规则改动。
- **业务/原始日志核验**：原F05-3C实跑18/18，K Source 10/10、loopback HTTPS 7/7成功；同真v19 PG16中，合成Customer Favorite Current/不可变Event先成立，受信Employee活动Lock走原转换服务将Wholesale转换为Mingbang、同Vehicle同Cycle，再由原JYT API对旧`car_code`执行active/车型冲突/重复/offline/current，全部不得复活Wholesale或破坏客户业务行Hash。两不同PG16 backend锁冲突真实`55P03`；错误权限、CSRF/Origin/重复Cookie和历史反转SQL安全拒绝。K本批原生证据ID`11715535282`（80031B）、`11714479629`（79258B）非空有效。初次旧52有2项公共PG16 Docker拉取限流，同SHA官方重跑后52全绿，并未删减回归。
- **验收与标准合并**：[PR42 A独立正式验收](https://github.com/suzhe868-arch/mb/pull/42#issuecomment-6113788105)签`F05_3K_A_FINAL_REVIEW_PASS_58_OF_58_CI_ONLY`后，GitHub携`expected_head_sha`标准合并回执`merged=true`，**merge SHA `53d0bcc126225878af638c7a741aa80937c90b6a`**。详细中文报告：`07_重建工作区/F05-3K_A主控58项PG16独立验收PR42合并与F05-4接力_2026-10-12.md`。
- **唯一下一正式施工F05-4**：`07_重建工作区/F05-4_A主控PDM10客户批发查价每日额度与周期隔离受信完整施工单_2026-10-12.md`，B从最新main新建`feat/f05-4-customer-price-entitlement-cycle`。按PDM-10 Final构建**仅CI synthetic Customer受信上下文**的LIMITED/UNLIMITED日配额/已解锁+Recommendation免费权/UTC+8日切/3A切换和同ListingCycle原子权益安全，核真实物理来源，必要时只允许新目录中受信安全增量v20；旧v19及更早迁移、业务实现、Final、生产全部冻结。保守拒绝无真实微信Customer会话，5组Actions同B/PR最终SHA分别旧H52+I2+J2+K2=58及新Source/TLS2，目标**60/60项真非特权PG16同SHA success+2本批原生Artifacts+中文自审交A**；确实缺受信源就`BLOCKED_SOURCE_GAP`不造成功。B不得自行合并或入后批。
- **未关闭与责任**：真实微信Customer Session `CUSTOMER_WECHAT_SESSION_TO_FAVORITE_ACTOR_SOURCE_GAP`、普通无Lock批发车Employee Owner `GENERAL_WHOLESALE_VEHICLE_SCOPE_SOURCE_GAP_PENDING_PRODUCT_DECISION`、隐藏重算`HIDE_REASON_RECALCULATION_SOURCE_GAP`、图片资产化`IMAGE_LOCALIZATION_SOURCE_GAP`、真实JYT/微信/电话/资金/生产/C-H01均未放行，F05/F04生产及V1基线`NOT_READY`。**`F05_3K_A_ACCEPTED_MERGED_PR42 / F05_4_A_RELEASED_FOR_B_B_NOT_STARTED / NEXT_OWNER=B`**。

---

# 2026-10-12｜F05-3J A独立复验同SHA56/56真PG16 PASS，PR41合并；F05-3K旧JYT车源事件重放抑制施工单已放行（唯一最新状态）

- **F05-3J正式验收与合并**：B最终分支`feat/f05-3j-favorite-jyt-relist-v19-compat`/[PR41](https://github.com/suzhe868-arch/mb/pull/41)/[冻结旧52项Actions38171029004](https://github.com/suzhe868-arch/mb/actions/runs/38171029004) attempt2/[旧i2 Actions38171028962](https://github.com/suzhe868-arch/mb/actions/runs/38171028962) attempt1/[本批j2 Actions38171029006](https://github.com/suzhe868-arch/mb/actions/runs/38171029006)同SHA`f04335f83181eee3ca2e0b9140b04331cc9f780f`。A亲核最终官方Jobs**52/52+2/2+2/2=56/56独立真实PG16成功**、旧52 Job完整`jobs:`原文510382字符与新冻结Workflow逐字一致、旧I2 1969字符逐字一致，新Source J-A01～10 **10/10**、HTTPS J-B01～07 **7/7**；原生新source Artifact ID`11714510958`（79012B）/https ID`11714416211`（78782B）均有效。旧52 attempt1 50成功、2个公共PG16镜像拉取限流，attempt2在**同SHA**两个失败Job重跑后完成52/52，无业务测试跳过。
- **真实源与业务证据**：v19 Customer+Wholesale Vehicle已收藏Current与不可变ADD Event后，原F05-3B SystemAdmin签发可信API Credential将车辆offline结束旧Cycle，再active relist**同Vehicle但开新ListingCycle**；收藏Current和历史Events完整SQL行SHA原样；原旧Cycle查价/扣额事实仍保留且**新Cycle不继承价格权**，hidden不自动公开。原`engineering/f05/jyt-wholesale-lineage-cycle/contract.mjs` `ready()`与`ci-router.mjs`启动入口仅改受信v17/v18/v19完整迁移校验，A逐字证实所有原JYT业务与HTTP安全正文未改。A[PR41独立复验意见](https://github.com/suzhe868-arch/mb/pull/41#issuecomment-6113514400)批准后按`expected_head_sha`标准合并，GitHub回执**`merged=true`、merge SHA`86963d34cb757bbd5e7185ed5747f1b5b9728a68`**。正式报告`07_重建工作区/F05-3J_A主控同SHA56项PG16独立验收PASS_PR41正式合并与F05-3K接力_2026-10-12.md`。
- **下一唯一施工F05-3K**：`07_重建工作区/F05-3K_A主控v19既存收藏转名邦后JYT旧车源事件重放抑制同车同周期保全完整施工单_2026-10-12.md`。B从最新main建`feat/f05-3k-favorite-converted-jyt-replay-guard`，仅新隔离工程目录与4个专属Workflow，**禁止修改任何旧业务/迁移/旧CI定义**。在同一个真实v19 PG16中，先原合法JYT同步建Wholesale、再产生已签Favorite Current/不可变Event，然后有真实Employee当前合法Lock按原F05-3C服务转名邦。**转后旧JYT`car_code`反复active/offline/current/模型冲突/重放**不得恢复批发、不得新建/复制Vehicle、不得伤害原Customer Favorite/事件与ListingCycle/客户权益，真双PG16 backend JYT锁`55P03`和loopback TLS源权限负例。四个Actions workflow冻结旧H 52/52、旧I2 2/2、旧J2 2/2、本批K2 2/2，**同最终B/PR SHA真实58/58独立PG16成功及本批新2原生Artifacts、中文交接交A**；B不得自合并或启动下一批。旧JYT`car_code`不能恢复为电话独立权限。
- 微信Customer本人合法session`CUSTOMER_WECHAT_SESSION_TO_FAVORITE_ACTOR_SOURCE_GAP`、普通无Lock/活动Transaction批发车Employee经营Owner`GENERAL_WHOLESALE_VEHICLE_SCOPE_SOURCE_GAP_PENDING_PRODUCT_DECISION`、隐藏重算`HIDE_REASON_RECALCULATION_SOURCE_GAP`、图片真实落地`IMAGE_LOCALIZATION_SOURCE_GAP`、真实微信/JYT/电话/资金与生产都**未关闭**。**`F05_3J_A_ACCEPTED_MERGED_PR41 / F05_3K_A_RELEASED_FOR_B_B_NOT_STARTED / NEXT_OWNER=B`**，F05/F04生产/C-H01/V1基线仍`NOT_READY`。

---

# 2026-10-12｜F05-3I A独立复验同SHA 54/54真PG16完成，PR40已正式合并；F05-3J跨JYT下架/重新上架收藏与新周期价权安全施工单已放行（最新唯一状态）

- **F05-3I最终验收**：原B`feat/f05-3i-favorite-conversion-v19-compat`、[PR40](https://github.com/suzhe868-arch/mb/pull/40)、[旧52Job Actions38169649160](https://github.com/suzhe868-arch/mb/actions/runs/38169649160)、[新2Job Actions38169649123](https://github.com/suzhe868-arch/mb/actions/runs/38169649123)四者HEAD均为`4308a81b23301e911eb02bcd495a7b63a123a0ff`。A独立亲核官方分页：**旧52/52 + 新2/2 = 合计54/54独立真实PG16 Jobs全部success**，两次官方run均completed/success attempt1，无失败/跳过；旧F05-3H完整冻结YAML从`jobs:`至EOF 510382字符与新F05-3I独立冻结52工作流**全文逐字一致**。新增source I-A01～11含02b **12/12成功**，新增TLS I-B01～07 **7/7成功**；新GitHub原生Artifacts source ID`11713756564`（79448B）及TLS ID`11713696913`（78692B）非空未过期。
- **真实业务复核**：在原已签v19中先完成Favorite Current与不可变ADD Event，再以原F05-3C服务由合法Employee+当前有效Lock转换Wholesale→Mingbang，**原Vehicle与ListingCycle ID不变，收藏现时/完整事件历史及受检客户/查价/推荐/锁车/交易/可见性/图片/JYT lineage原生行SHA256全保留**；原Employee/team/capability/Lock/Transaction/current JYT对象Owner权、幂等/反向禁止、2不同PG backend真实`55P03`有效。旧`engineering/f05/wholesale-to-mingbang-conversion/service.mjs`只新增两受信v18/v19严格校验入口选择，原全部业务逻辑全文不动。A[PR40正式验收评论](https://github.com/suzhe868-arch/mb/pull/40#issuecomment-6113097761)签限CI-only PASS后按`expected_head_sha`标准合并，GitHub**`merged=true`，merge SHA`1170b2d39b0ce101e4b5d627f41c250cd00400b1`**。中文A验收报告：`07_重建工作区/F05-3I_A主控同SHA52加2共54项PG16独立验收PASS_PR40合并与F05-3J接力_2026-10-12.md`。
- **下一唯一正式放行F05-3J**：`07_重建工作区/F05-3J_A主控v19既存收藏跨JYT真实下架重新上架同车不同周期保全完整施工单_2026-10-12.md`。B从最新main新建`feat/f05-3j-favorite-jyt-relist-v19-compat`。验证**在v19已存在真实Customer+Vehicle Favorite及不可变历史后，原受信JYT可信API让批发车真实offline结束旧上架周期，再active relist同Vehicle新ListingCycle**，原收藏现时及事件全部保留、旧Cycle价权不跨到新Cycle、hidden/Priority不泄露；仅允许原F05-3B`contract.mjs`与`ci-router.mjs`受信静态v17/v19迁移**版本校验入口**必要极小补丁，不得改Credential/SystemAdmin控权、模型真实性、上游操作/锁/幂等/车源商业代码。依A现行同SHA多Workflow规则分别冻结旧52/52、上一批i-source/i-https旧2/2，再加本批新source/TLS2/2，目标**三个官方run同最终B/PR SHA合计56/56真PG16全部success+本批两份原生Artifacts、完整中文交接交A**；B不合并、不入后批，不额外索要常规工程批准。
- 保留`CUSTOMER_WECHAT_SESSION_TO_FAVORITE_ACTOR_SOURCE_GAP`真实微信Customer来源缺口、`GENERAL_WHOLESALE_VEHICLE_SCOPE_SOURCE_GAP_PENDING_PRODUCT_DECISION`普通无Lock/未完成Transaction的JYT经营Owner产品待裁、`HIDE_REASON_RECALCULATION_SOURCE_GAP`、`IMAGE_LOCALIZATION_SOURCE_GAP`，以及外网/真实微信/JYT/资金/电话/车型等未签。**`F05_3I_A_ACCEPTED_MERGED_PR40 / F05_3J_A_RELEASED_FOR_B_B_NOT_STARTED / NEXT_OWNER=B`**；F05/F04生产/C-H01/V1基线`NOT_READY`。

---

# 2026-10-12｜F05-3I A主控正式技术裁决：已有Favorite转名邦正向PG16已通过，但最终CI必须同SHA以双工作流52+2补齐54项（唯一最新）

- 已核当前B`feat/f05-3i-favorite-conversion-v19-compat`/[PR40](https://github.com/suzhe868-arch/mb/pull/40)/[Actions38168629659](https://github.com/suzhe868-arch/mb/actions/runs/38168629659)同SHA`0cfd74821eb7909c099ea8afe977f671fea47723`；官方**只跑2/2**独立非特权真PG16 Job，不是54/54。新增Source `114556335237`的I-A01/02/02b/03～11 **12/12通过**，TLS `114556335269` I-B01～07 **7/7通过**，两个Job各真实先行旧F05-3C v18 18/18；新增官方原生source Artifact ID`11712859478`（79462B）/https ID`11713385063`（78678B）有效未过期。**原冻结52 Job在当前B SHA尚未实际执行，PR40不得验收合并**。
- A独立查原始PG16日志`F05_3I_V19_EXISTING_FAVORITE_PRECONVERSION_POSITIVE`，证实**v19先真实ADD Favorite Current/不可变Event→原F05-3C合法Employee+当前Lock转换批发至名邦→同Vehicle/Cycle、完整Favorite/相关客户关系行SHA256完全不变**，原v18受信签验证、两个PG16 backend`55P03`、权限拒绝与幂等继续有效。原唯一旧源码修改`engineering/f05/wholesale-to-mingbang-conversion/service.mjs`只对真实DB版本记录做**严格v18/v19 verifier静态选择**，原capability/objectScope/Lock/Transaction/JYT/CAS/审计原文逻辑不变。**业务源代码当前没有A新增整改项，仅CI覆盖门禁未闭环**。
- A已做唯一正式技术裁决`A-F05-3I-CI-GATE-SPLIT-01`：原F05-3I要求“单一个Workflow同一次54/54”**仅在CI编排层改为同一最终SHA两个原生GitHub Actions workflows分别52/52+2/2、合并验证真实54/54**。已签F05-3H旧Workflow文件大小**511990 UTF8字节**，完整旧52 Job正文约510382字节，实测新增至512893字节曾未创建任何Job；不可为凑单文件大改或删减旧定义。
- **下一唯一责任B**：继续原分支/PR40，新增`.github/workflows/f05-3i-frozen-52-revalidation.yml`，仅新workflow在`jobs:`前设置最短合法push分支header，之后**逐字逐字节完整拷贝**最新main原签`.github/workflows/f05-3h-customer-wechat-actor-trust.yml`从`jobs:`至末尾的旧52Job。保留现有F05-3I新2Job workflow。在B最终新提交push时，取得**旧52/52 Jobs和新2/2 Jobs两个不同GitHub官方run，全部`completed/success`且`run.head_sha`与B HEAD、PR40 HEAD四方精确一致**；所有新2个原生Artifact必须由此最终SHA新run产生。原旧Workflow/PDM/已签迁移/业务权限/生产不改。B交两run+原生日志+冻结52Job完整字节校验+中文全包交接后交A复验，不自行合并或启动下批。详细唯一正式补正单：`07_重建工作区/F05-3I_A主控技术裁决单_同一提交双工作流52加2真实PG16门禁与B一次性CI补正_2026-10-12.md`；[PR40 A主控技术裁决](https://github.com/suzhe868-arch/mb/pull/40#issuecomment-6112969869)。
- 保留真实微信Customer会话`CUSTOMER_WECHAT_SESSION_TO_FAVORITE_ACTOR_SOURCE_GAP`、普通无Lock/未完成Transaction批发车经营Owner待裁`GENERAL_WHOLESALE_VEHICLE_SCOPE_SOURCE_GAP_PENDING_PRODUCT_DECISION`、隐藏重算、图片双成功、生产JYT/资金/电话、未知车型等缺口。**`F05_3I_A_TECH_DECISION_SPLIT_CI_B_REMEDY_PENDING / PR40_NOT_MERGED / NEXT_OWNER=B`**；F05全域/F04生产/C-H01/V1基线继续`NOT_READY`。

---

# 2026-10-12｜F05-3H A独立来源审计PASS已正式合并PR39，F05-3I现有Favorite转名邦v19正向兼容施工单已放行（唯一最新）

- A核B指定分支`feat/f05-3h-customer-wechat-actor-trust`、[PR39](https://github.com/suzhe868-arch/mb/pull/39)、[Actions38166372689](https://github.com/suzhe868-arch/mb/actions/runs/38166372689)最终HEAD均为`5dca08996f67e41fbc6e6a27584473695b6b4898`，原生attempt1 **52/52独立PG16 Jobs success**。A直接比较新旧完整Workflow：旧`jobs:`以下50个Job块作为新workflow连续**逐字相同前缀**，仅新增行内定义`h-source`与`h-https`两个Job（不得用只识别换行Job正则误算）；真Source job`114549670466` H-A01～08 **8/8**，真TLS job`114549670349` H-B01～07 **7/7**，真双PG后端Customer行锁`55P03`、原v19 schema签名、微信identity复合唯一FK和账号停用/恢复均核。官方run共97Artifacts，本包新source名称`source` ID`11712197256`（78217B）、TLS名称`https` ID`11712271937`（78190B），非空未过期；PR仅9个新增允许工程/Workflow文件，旧迁移000001～000019/已签代码/Final/IA/C/生产未改。
- **A受限正式验收**：`F05_3H_A_TRUST_SOURCE_AUDIT_PASS_SOURCE_GAP_RETAINED_CI_ONLY`。已签`customer_wechat_identities`与Customer的FK/identity_scope+key唯一是**物理关系**，绝非用户已凭微信code服务端验签和持有合法Customer Session；`CUSTOMER_WECHAT_SESSION_TO_FAVORITE_ACTOR_SOURCE_GAP`仍保守拒绝，所有真Customer Favorite HTTPS不得返回200。A[PR39独立正式验收评论](https://github.com/suzhe868-arch/mb/pull/39#issuecomment-6112665012)后带`expected_head_sha`标准合并，GitHub回执`merged=true`，**merge SHA`1368572b2a470adb0646970811fa99e9d4173327`**。报告`07_重建工作区/F05-3H_A主控微信Customer可信来源审计PASS_PR39正式合并与F05-3I接力_2026-10-12.md`。
- **下一唯一正式施工单F05-3I**：`07_重建工作区/F05-3I_A主控v19收藏现时关系与批发转名邦同车同周期兼容完整施工单_2026-10-12.md`，B从最新main建`feat/f05-3i-favorite-conversion-v19-compat`。目标修补原F05-3C转换服务当前只认识严格v18结构导致v19既存Favorite时无法调用的**技术兼容缺口**：仅许可原`engineering/f05/wholesale-to-mingbang-conversion/service.mjs`**最窄受信v18/v19 verifier入口补丁**（仍要求真签名，旧Employee/Team/current Lock或未完成Transaction/capability/原始JYT对象权限绝不改变）；新工程目录和新专属Workflow内用真实隔离PG16正向验证**v19已存在Favorite Current/Event→原合法一键转名邦→同Vehicle+同Cycle、收藏历史及其他客户关系行哈希完全不变**，真实两个PG backend并发、非法Scope与历史防篡改。旧52个PG16 Jobs完整定义冻结，仅新增2个新独立PG16 Source/TLS Jobs，最终**54/54同B/PR/Actions SHA全部success＋两个原生Artifacts/中文交接**交A。绝不可用“先在v18转换、v19再收藏”冒充新正向。
- 普通无Lock/活动交易JYT车经营Owner缺受信签发`GENERAL_WHOLESALE_VEHICLE_SCOPE_SOURCE_GAP_PENDING_PRODUCT_DECISION`需未来用户裁决；`HIDE_REASON_RECALCULATION_SOURCE_GAP`、`IMAGE_LOCALIZATION_SOURCE_GAP`及真实微信Customer会话、生产JYT/资金/电话/图片、新车型保留。**`F05_3H_A_ACCEPTED_MERGED_PR39 / F05_3I_A_RELEASED_FOR_B_B_NOT_STARTED / NEXT_OWNER=B`**，F05全域/F04生产/C-H01高保真/V1基线继续`NOT_READY`。

---

# 2026-10-12｜F05-3G A二轮两项真实PG16历史安全整改PASS并正式合并PR38；F05-3H微信Customer受信Actor来源审计正式放行（唯一最新）

- B分支`feat/f05-3g-favorite-physical-carrier`/[PR38](https://github.com/suzhe868-arch/mb/pull/38)/[Actions38163355029](https://github.com/suzhe868-arch/mb/actions/runs/38163355029)最终HEAD均为`428f2697054cfba4e181217f82483520091c49e4`，GitHub原生第1尝试**50/50独立非特权真PG16 Jobs success**；A比对旧冻结Workflow的**48/48 Job块逐字完全不变**，仅新增两本批Job。真Source Job`114540721186` G-A01～10 **10/10通过**（旧F05-3C 18/18），真HTTPS Job`114540721470` G-B01～07 **7/7通过**（旧TLS7/7）。GitHub本run95份原生Artifacts中新Source ID`11711291347`（79781B）、HTTPS ID`11711112264`（79474B），非空未过期。PR只有12个新增白名单文件，不更改已签旧迁移000001～000018、旧F03～F05-3F、PDM Final/IA/Low-Fi、生产server/C。
- **A前次阻断两项均真实关闭**：`A-F05-3G-01`在新000019用两枚`DEFERRABLE INITIALLY DEFERRED` PG16约束触发器校对Current和完整Event在COMMIT前事件重放/版本因果；原生G-A09直接SQL证明插Current无Event、合法状态版本更新无Event、伪Event无Current三种在真实COMMIT全部拒绝+回滚。 `A-F05-3G-02` 新v19`verify()`核被冻结的v18末版checksum及实测结构SHA、前16条有序迁移账不可变attestation，真实G-A10在v19后篡改v18 checksum/旧SHA、v17 checksum、删旧迁移和变签名均拒绝恢复。
- A[PR38二轮正式验收意见](https://github.com/suzhe868-arch/mb/pull/38#issuecomment-6112247134)限定签收`F05_3G_A_SECOND_REVIEW_ACCEPTED_FAVORITE_PHYSICAL_V19_HISTORY_CI_ONLY`，以`expected_head_sha`标准合并，GitHub真实回执**`merged=true`、merge SHA`592089f83009d7604364ec0cc985a710e470a215`**。中文验收报告：`07_重建工作区/F05-3G_A主控二轮独立验收历史因果与v18签名双整改PASS_PR38正式合并及F05-3H接力_2026-10-12.md`。本批仅证明CI-only合成Customer身份的Favorite物理载体与不可变事件，不等于真实微信用户收藏可用或生产上线。
- **下一唯一A正式放行F05-3H**：`07_重建工作区/F05-3H_A主控微信Customer身份与Favorite受信Actor现时来源审计安全隔离完整施工单_2026-10-12.md`。受信PDM-01/PDM-20/PDM-25：微信身份识别对应唯一稳定Customer而手机号/头像昵称不是主键，收藏独立Customer→Vehicle、停用不得新增动作、跨listing cycle存关系但不穿透隐私。真实PG16已有`customer_wechat_identities`的微信身份到Customer FK与唯一索引，**不能据此推断已有微信官方code换session、可信Customer token或生产API**。B从最新main建`feat/f05-3h-customer-wechat-actor-trust`，仅本包新增独立工程目录+Workflow，旧50真PG16 Job全文冻结，新增2真PG16 source/TLS Job，最终**52/52同B/PR/Actions SHA成功、两新原生Artifacts和中文交接**交A；无受信微信会话时`CUSTOMER_WECHAT_SESSION_TO_FAVORITE_ACTOR_SOURCE_GAP`保持fail-closed，不伪造Favorite HTTP200、不触真实生产。
- 其余缺口独立保留：`GENERAL_WHOLESALE_VEHICLE_SCOPE_SOURCE_GAP_PENDING_PRODUCT_DECISION`用户待裁普通无Lock/活动交易批发车Owner签发；`HIDE_REASON_RECALCULATION_SOURCE_GAP`、`IMAGE_LOCALIZATION_SOURCE_GAP`、v19与旧v18生产联调、未知JYT新车型及真实JYT/资金/电话/微信与生产接入均未验。**`F05_3G_A_ACCEPTED_MERGED_PR38 / F05_3H_A_RELEASED_FOR_B_B_NOT_STARTED / NEXT_OWNER=B`**；F05全域/F04生产/C-H01高保真/V1产品基线继续`NOT_READY`。

---

# 2026-10-12｜F05-3G A首次独立复验：官方50/50全绿但2项历史可信性门禁未通过，PR38暂不合并（唯一最新）

- A独立核B`feat/f05-3g-favorite-physical-carrier`/[PR38](https://github.com/suzhe868-arch/mb/pull/38)/[Actions38159418079](https://github.com/suzhe868-arch/mb/actions/runs/38159418079)最终HEAD均`9bd9a0b91972dfa374d0a77ce9793c909519f750`；GitHub原生最终attempt2 **50/50非特权真实PG16独立Job success**，旧48 Job由A逐YAML全文比较**48/48完全一致**，新增原生Source G-A01～08 **8/8**、loopback TLS G-B01～07 **7/7**，两Backend真`55P03`及v18→v19真实增量回滚证据。官方本run95份Artifacts，新source ID`11709519396`（76053B）与TLS ID`11709848032`（75905B）非空未过期。差异仅12个本包允许新增文件，未碰冻结旧000001～000018/旧F03～F05-3F/Final/IA/C/生产server。**官方50/50成功真实有效但不代表A最终验收通过**。
- **A独立源码复核2项真实验收阻断**：`A-F05-3G-01` 新`000019_favorite_carrier_ci.sql` 的Current Favorite trigger只查不可rekey/delete及版本/时间，允许合法DML直接切换`current_state`并递增`state_version`，没有强制当前变化与`f05_3g_favorite_events`在同事务受信一致，可出现Current变/历史无Event或伪Event；原G-A07未覆盖该负例。 `A-F05-3G-02` 新`migration.mjs` 的v19`verify`只核当期v19 catalog+最新记录，而升级后原v18旧账的checksum/结构签名未再受信校验，历史版本元数据变更有漏检路径，原v18 verifier在v19时预期拒绝。两项需原PG16直接SQL与v19历史改写负例实证修正。
- A[PR38正式首次审查评论](https://github.com/suzhe868-arch/mb/pull/38#issuecomment-6111960790)与主线**唯一完整定向整改单**`07_重建工作区/F05-3G_A主控首次独立验收50项CI全绿但收藏事件因果与历史版本签名两项定向整改单_2026-10-12.md`已发布。B继续**原**`feat/f05-3g-favorite-physical-carrier`/PR38，限本包新文件修复上述两项，旧48 Job正文绝不改/不减，新最终**B HEAD=PR HEAD=Actions run.head_sha且50/50成功**+两新原生Artifacts和完整中文B交接再交A复验；PR38**未合并**，不得开始F05-3H或生产。当前`F05_3G_A_FIRST_REVIEW_CHANGES_REQUESTED / PR38_NOT_MERGED / NEXT_OWNER=B`。
- 产品/生产边界保持：`CUSTOMER_WECHAT_SESSION_TO_FAVORITE_ACTOR_SOURCE_GAP`（v19独立CI关系不等于微信客户可收藏）、`GENERAL_WHOLESALE_VEHICLE_SCOPE_SOURCE_GAP_PENDING_PRODUCT_DECISION`（无Lock/活动Transaction普通批发车经营Scope用户未裁决）、`HIDE_REASON_RECALCULATION_SOURCE_GAP`、`IMAGE_LOCALIZATION_SOURCE_GAP`、未知车型/真实JYT、电话、资金与上线未授权；**F05/F04生产/C-H01/V1基线持续NOT_READY**。

---

# 2026-10-11｜F05-3F A独立Favorite来源审计限定PASS、PR37正式合并；F05-3G独立收藏物理载体工程正式放行（唯一最新）

- B指定分支`feat/f05-3f-favorite-carrier-preservation`/[PR37](https://github.com/suzhe868-arch/mb/pull/37)/[Actions38131580736](https://github.com/suzhe868-arch/mb/actions/runs/38131580736)三方HEAD同为`0e84c08ca88b91aa19dc16ac32f9767fc207ee7a`，GitHub**48/48独立非特权真PG16 Jobs success**。A读取完整旧/新Workflow逐YAML Job块对照**旧46/46全文原样**；新增原生source Job `114446837464` F-A01～08 **8/8通过**（不同真PG16 backend、Lock争用`55P03`、同Vehicle+Cycle已有客户业务关系哈希完全相同），真实TLS Job `114446837672` F-B01～07 **7/7通过**。本run93份Artifacts中新source ID`11699197064`（75,383B）与TLS ID`11699177384`（75,269B）均未过期。全部仅8个白名单新增文件；旧000001～000018/已签F03～F05-3E/Final/IA/C/生产server均未改。
- **A受限验收结论** `F05_3F_FAVORITE_CARRIER_AUDIT_SOURCE_GAP_ACCEPTED_EXISTING_RELATION_PRESERVATION_CI_ONLY`：真PG16当前**没有可信Favorite Customer+Vehicle物理载体/取消重放历史**，因此对未知Favorite继续`FAVORITE_PHYSICAL_CARRIER_SOURCE_GAP`和fail-closed。已存在的Customer/Lock/Recommendation/当前Cycle查价/图片/价格/JYT lineage与ListingCycle真实PG16原生行hash在合法批发转名邦前后保持，不等于收藏功能正向可用。A [PR37正式验收](https://github.com/suzhe868-arch/mb/pull/37#issuecomment-6108149003)后使用`expected_head_sha`正常合并，GitHub`merged=true`，merge SHA **`34e840a0f9ec63d5d7092bd48d6026513afcfd78`**。中文独立验收报告：`07_重建工作区/F05-3F_A主控独立验收PR37审计限定PASS正式合并与F05-3G施工交接_2026-10-11.md`。
- **唯一下一A正式放行F05-3G**：`07_重建工作区/F05-3G_A主控收藏独立现时物理载体与历史幂等事件隔离增量施工单_2026-10-11.md`。现有PDM20 §23规定独立Customer+Vehicle收藏跨relist继续存在、不要求手机号头像昵称、不穿透hidden、offline历史保留；PDM04 §15.2.1转换同Vehicle+同Cycle不重建关系；PDM25保留历史/幂等。B从最新main新建`feat/f05-3g-favorite-physical-carrier`，只在**独立CI PG16原000018受信后追加专属000019** Favorite Current Carrier+不可变事件Ledger，旧48个Job每个原文冻结，新2个真实独立非特权PG16 source/TLS job，最后**50/50 B/PR/Actions最终同SHA success + 两原生Artifacts + 中文完整交接**交A。缺真实微信Customer身份时不造生产/customer Favorite 200、不修改旧版本/生产/Final/C。
- `GENERAL_WHOLESALE_VEHICLE_SCOPE_SOURCE_GAP_PENDING_PRODUCT_DECISION`普通无Lock/活动Transaction JYT车通用对象管理权仍待用户正式裁决；`HIDE_REASON_RECALCULATION_SOURCE_GAP`、`IMAGE_LOCALIZATION_SOURCE_GAP`、未知v18车型、实际JYT/微信/资金/电话/生产源继续封印。**`F05_3F_A_ACCEPTED_MERGED_PR37 / F05_3G_A_RELEASED_FOR_B_B_NOT_STARTED / NEXT_OWNER=B`**；F05全域/F04生产/C-H01高保真/V1产品基线仍`NOT_READY`。

---

# 2026-10-11｜F05-3E A独立可信隐藏原因SOURCE_GAP审计PASS、PR36实际合并；F05-3F Favorite现时实体审计正式放行（唯一最新）

- B`feat/f05-3e-hide-reason-trust-recalculation`/[PR36](https://github.com/suzhe868-arch/mb/pull/36)/[Actions 38126797933](https://github.com/suzhe868-arch/mb/actions/runs/38126797933)三方受检HEAD同为`19cbfae8aff44b7c3e1641db22a82b2f627d5932`。GitHub官方**46/46独立非特权真实PG16 Jobs success**，A逐YAML Job正文对比前44项**44/44严格不变**；新增源真实PG16 Job`114432735548` E-A01～08**8/8通过**，HTTPS Job`114432735632` E-B01～07**7/7通过**，实际真PG双连接规则停用/Vehicle解隐并发`55P03`。本run91原生Artifacts新source`11697378026`和TLS`11697891984`均未过期。PR仅8项全新增批准路径；旧迁移000001～000018、F03～F05-3D、正式PDM Final/IA/C/生产Server全部冻结。
- **A独立签收仅`F05_3E_TRUSTED_HIDE_REASON_SOURCE_AUDIT_COMPLETED_SOURCE_GAP_CI_ONLY`**：PG16真实`vehicle_hide_rules`当前JSON条件及source_scope、is_enabled、员工FK并不能证明规则发布/停用不可变版本、当前人工/其他hidden有效原因和撤销、车型/地区/品牌/年款/关键词的受信字段映射。无受信原因，哪怕当前Employee有read/manage/Team也只能返回`HIDE_REASON_RECALCULATION_SOURCE_GAP`，**converted Mingbang仍保持hidden，不产生visible，不修改Vehicle/Cycle/CRM/Lock/Transaction/价格历史**；合成JSON两行只是负例而非规则正向重算。A正式[PR36验收意见](https://github.com/suzhe868-arch/mb/pull/36#issuecomment-6107603063)，A以`expected_head_sha`安全标准合并，GitHub`merged=true`，merge commit **`84c87268718de03ad5a8d04acdf6b5375289b4e0`**。完整A报告`07_重建工作区/F05-3E_A主控独立验收隐藏原因可信来源审计PASS_PR36正式合并与F05-3F接力_2026-10-11.md`。
- **下一唯一A放行F05-3F**：`07_重建工作区/F05-3F_A主控收藏当前物理载体可信来源与同车同周期业务关系保真完整施工单_2026-10-11.md`。重点独立核真实`Favorite`/收藏当前PG16 carrier、Customer/Vehicle/ListingCycle FK、取消/重放与历史；实证批发转名邦**同Vehicle+同Cycle**时现存Recommendation/Lock/Transaction/当前查价及历史完整性，缺实际Favorite实体时`FAVORITE_PHYSICAL_CARRIER_SOURCE_GAP`和fail-closed，禁止虚构客户收藏正向成功。指定B从最新main新建`feat/f05-3f-favorite-carrier-preservation`，白名单仅新本包目录与新专属Workflow，**旧46真实PG16 job全文冻结+2个真PG16 job→最终48/48同B/PR/Actions SHA success+两新原生Artifacts与完整中文自验**，由A独立复核；B不得自行合并/进下批/接真实生产。
- F05-3D普通无Lock/Transaction批发车经营权当前**`GENERAL_WHOLESALE_VEHICLE_SCOPE_SOURCE_GAP_PENDING_PRODUCT_DECISION`**还待用户正式裁决，不在F05-3F冒充授Owner；PDM08图片来源与双成功资产化`IMAGE_LOCALIZATION_SOURCE_GAP`、F05-3E隐藏多原因`HIDE_REASON_RECALCULATION_SOURCE_GAP`、未知v18新JYT车型、真实JYT/生产`SOURCE_GAP_BLOCKED_FOR_PRODUCTION`都未关闭。当前 **`F05_3E_A_AUDIT_ACCEPTED_MERGED_PR36 / F05_3F_A_RELEASED_FOR_B_B_NOT_STARTED / NEXT_OWNER=B`**；F05整体/F04生产/C-H01高保真/V1产品基线仍`NOT_READY`。

---

# 2026-10-11｜F05-3D A可信普通批发经营Scope来源审计PASS、PR35已合并；F05-3E隐藏原因可信来源施工单放行（唯一最新）

- GitHub [PR #35](https://github.com/suzhe868-arch/mb/pull/35)、B `feat/f05-3d-wholesale-object-scope-trust`、[Actions #38122141246](https://github.com/suzhe868-arch/mb/actions/runs/38122141246) 本包最终HEAD一致`3dab7ee19b11a6f11d20d3e739ff202140b2f4f0`，官方**44/44独立非特权真实PG16 CI全部成功**；A比较旧F05-3C 42个Job工作流正文**42/42逐字冻结**，只增两个真PG16 jobs。真数据库Job`114418895148`D-A01～08 **8/8**、真HTTPS Job`114418895086`D-B01～07 **7/7**，官方原生日志可核双PG16后端锁争用`55P03`。该次89份原生Artifacts，新源`11695554078`和TLS`11695782435`未过期且非空。PR只新增6份本包白名单文件，旧000001～000018及F05-3C、生产Server、PDM Final/IA、C未改。
- **本包实际产品边界：`F05_3D_TRUSTED_SCOPE_AUDIT_COMPLETED_SOURCE_GAP`**。真实PG16核证已签`vehicle_current_responsibilities.source_snapshot` CHECK仅支持`mingbang/four_s`，现有JYT`f05_3b_sync_lineages`不能证明Employee单车经营权限。名邦员工只有Role/Team的`vehicle.read/manage`权限、但无本人当前Lock/活动Transaction的普通JYT批发车，仍`GENERAL_WHOLESALE_VEHICLE_SCOPE_SOURCE_GAP`，真HTTPS403不转换、不签收据、不创伪Owner。禁用/已撤Employee、4S/SystemAdmin/JYT credential、publisher/owner伪头均拒绝，旧F05-3C已有Lock/活动Transaction条件转换保留。**44/44绿灯是审计与安全拒绝PASS，绝非普通无锁批发车正向授权PASS**。
- A正式[PR35验收评论](https://github.com/suzhe868-arch/mb/pull/35#issuecomment-6106873556)；复核GitHub发现并行授权操作已经将PR35合并，故没有重复merge，GitHub真实merge SHA **`876904c8bb1d7953d4e8fd08f22ee997f8d34f1b`**。A完整验收报告`07_重建工作区/F05-3D_A主控独立来源审计PASS_PR35已合并与后续缺口规划_2026-10-11.md`。
- **新唯一A正式施工单`07_重建工作区/F05-3E_A主控自动隐藏与人工原因可信来源及转换重算隔离完整施工单_2026-10-11.md`**：F05-3E重点做PDM04 Final自动/批量hidden与人工hidden当前真实原因Carrier、来源转换后规则重算及Fail-Closed安全；指定B从最新main新建`feat/f05-3e-hide-reason-trust-recalculation`，仅本包新目录+一个专属新Workflow，旧44独立PG16 Job逐字冻结、新增2个真PG16 Job，最终**46/46同B/PR/Actions SHA success、两份未过期新原生Artifacts和中文交接**，缺真实人工hidden/其他原因签发不许假装visible。不可自行合并/上线/触碰实际JYT/生产图片/电话/资金。
- **重大未决集中登记，未经用户批准不实施**：普通无本人Lock或活动Transaction的JYT批发车由谁有权发放具名员工单车经营转换权限、基于何种受信经营事件/可撤权记录。可供用户裁决的最窄备选：“获授权名邦经理/店长对指定Vehicle+当前Cycle按可验证经营证据授给具名员工/Team，签不可变审计且可撤销”，只是建议不是已授权产品规则。记录`GENERAL_WHOLESALE_VEHICLE_SCOPE_SOURCE_GAP_PENDING_PRODUCT_DECISION`，B在F05-3E不得绕过。
- 其他`IMAGE_LOCALIZATION_SOURCE_GAP`（PDM08 Final转换与资产化解耦）、`HIDE_REASON_RECALCULATION_SOURCE_GAP`、`FAVORITE_PHYSICAL_CARRIER_SOURCE_GAP`、`F05_3C_V18_NEW_CAR_SOURCE_MAPPING_GAP`、`SOURCE_GAP_BLOCKED_FOR_PRODUCTION`继续有效。当前`F05_3D_A_ACCEPTED_MERGED_PR35_AUDIT_ONLY / F05_3E_A_RELEASED_FOR_B_B_NOT_STARTED / NEXT_OWNER=B`；F05整个工程、F04生产、C/H01高保真及V1产品基线继续**`NOT_READY`**。

---

# 2026-10-11｜F05-3D A审计/安全拒绝PASS、PR35已合并；普通批发Owner受信来源仍缺，F05-3E隐藏规则来源重算已放行（唯一最新）

- A官方独立核查B`feat/f05-3d-wholesale-object-scope-trust` / [PR35](https://github.com/suzhe868-arch/mb/pull/35) / [Actions #38122141246](https://github.com/suzhe868-arch/mb/actions/runs/38122141246) 受检B/PR/run HEAD **`3dab7ee19b11a6f11d20d3e739ff202140b2f4f0`**，GitHub **44/44独立非特权真PG16 jobs success**，原42个Job定义由A逐块全文校验**42/42原文不变**，新物理source D-A01～08 **8/8 PASS** 和loopback TLS D-B01～07 **7/7 PASS**；官方89份Artifacts中新物理`11695554078`、新TLS`11695782435`非空有效。PR仅6个白名单新增文件，无旧签000001～000018/F05-3C/Final/生产/C修改。
- 本包A正式判定**`F05_3D_TRUSTED_SCOPE_AUDIT_ACCEPTED_SOURCE_GAP_CONFIRMED_CI_ONLY`**：真实PG16 F05-2`vehicle_current_responsibilities`已签人工Owner `source_snapshot CHECK (mingbang/four_s)`，伪造JYT wholesale Owner被真正PG16 `23514`拒绝；原F05-3B JYT`lineage`仅证明批发Vehicle+Cycle和car_code来源，并非受信可撤销Employee单车经营负责人签发。真实名邦员工即使read/manage、Team和本人当前Scope，**普通没有当期本人Lock/活动Transaction的JYT批发车也无可信对象经营授权**，真实HTTPS仍403；SysAdmin/4S/JYT/伪Owner/Publisher/CSRF/敏感字段拒绝、双真实PG16 backend撤权/离线`55P03`证据均通过。已签F05-3C有当期Lock/Transaction条件正向保持不变，**GENERAL_WHOLESALE_VEHICLE_SCOPE_SOURCE_GAP不关闭**。A[PR35最终验收评论](https://github.com/suzhe868-arch/mb/pull/35#issuecomment-6106867501)后以`expected_head_sha`正式标准合并，GitHub `merged=true`，merge commit **`876904c8bb1d7953d4e8fd08f22ee997f8d34f1b`**。完整正式A验收报告`07_重建工作区/F05-3D_A主控独立验收PR35可信来源审计PASS正式合并与F05-3E接力_2026-10-11.md`。
- A集中保留一个**重大业务权限来源待裁决点**：若要允许无Lock/活动Transaction的普通批发车合法一键转名邦，须先有PDM允许的实际受信单Vehicle+当前Cycle经营责任签发人、签发依据、撤销/历史因果；没有该来源不得由B编造owner，未来新增权限语义须A集中提用户。暂不发“通用批发车转换正向”假施工单。
- **下一唯一正式工程放行F05-3E**：`07_重建工作区/F05-3E_A主控自动隐藏规则命中原因现时承载与来源转换重算可信隔离完整施工单_2026-10-11.md`，由B从最新main建`feat/f05-3e-hide-reason-trust-recalculation`，只勘验已签PDM04 Final的自动/人工/其他隐藏原因可信carrier、source_scope过滤、多规则OR/字段AND/同字段多值OR、批发→名邦来源变化后自动规则重算及人工hidden不释放；来源不充分则审计+拒绝/保守hidden不能伪造visible。旧**44**独立真PG16 Job全文冻结，增2个真PG16 Jobs，目标**46/46同B/PR/Actions SHA success+两个新原生Artifacts**。A复验前B不能自行合并。
- `IMAGE_LOCALIZATION_SOURCE_GAP`、`HIDE_REASON_RECALCULATION_SOURCE_GAP`、`FAVORITE_PHYSICAL_CARRIER_SOURCE_GAP`、`CURRENT_WHOLESALE_OBJECT_SCOPE_SOURCE_GAP`、新v18陌生JYT车型、真实生产JYT/图片/资金/电话继续封印；**F05整体/F04生产/C-H01/V1产品基线`NOT_READY`**，没有生产授权。

---

# 2026-10-11｜F05-3C A第三轮独立验收CI-only条件式PASS、PR34已正式合并；F05-3D对象Scope受信来源施工单放行（唯一最新）

- A真实从GitHub读取并按代码+PG16/TLS原生日志独立核验：B分支`feat/f05-3c-convert-wholesale-to-mingbang` / [PR34](https://github.com/suzhe868-arch/mb/pull/34) / [Actions #38117365590](https://github.com/suzhe868-arch/mb/actions/runs/38117365590) 最终受检HEAD均`b719ff21c8e95c94313604669e12924ae5ed70b7`。GitHub官方`completed/success`，**42/42独立非特权真实PG16 jobs成功**、冻结旧40 Job由A逐Job全文对比**40/40完全一致**。新增物理Job`114404835815`真C-A01～18 **18/18 PASS**、HTTPS Job`114404835801` C-B01～07 **7/7 PASS**，87份原生GitHub Artifacts，新PG16源`11694680695`及TLS`11694007038`存在未过期。PR只新增15个批准文件路径，无旧000001～000017/旧签源码/生产Server/Final/IA/Low-Fi/C变化。
- **A-F05-3C-04、05全部通过**：锁车单独证明现时对象责任的`locks`与活动`transactions`物理`SELECT…FOR SHARE`保持直到COMMIT，真双PG16后台对Lock到期修改/取消发生`55P03`、过期Lock自动拒；v18批量offline同eventKey锁并回原不可变`count_rows`，首次1→重试1、NOOP0→重试0、真两车并发2→重试2、同key错payload或跨action拒、只1收据/真实状态与周期稳定。上轮000017先受信JYT同Vehicle/Cycle→000018真实封印升级、新v18独立CI适配安全核凭据也确认无旧封印绕过。
- 仅**有当前本人已成立Lock/活动Transaction + 当前有效名邦Employee/permission/team/object scope**允许批发→名邦同`vehicle_id`/同`listing_cycle_id`单向转换，不动历史Lock/Transaction/Recommendation/当前周期查价/图片与价格快照，completed交易拒绝，JYT历史`car_code`不可恢复批发。A正式[PR34最终验收评论](https://github.com/suzhe868-arch/mb/pull/34#issuecomment-6106235671)，A执行原`expected_head_sha`安全合并，GitHub返回`merged=true`，merge SHA **`0384a5792a272f3344ba72b305380fe0c8966251`**。A验收收据`07_重建工作区/F05-3C_A主控三轮最终独立验收PR34条件式CI通过正式合并与F05-3D接力_2026-10-11.md`。
- **下一唯一已放行工程**：`07_重建工作区/F05-3D_A主控普通批发车对象管理Scope可信来源与授权隔离完整施工单_2026-10-11.md`，即**F05-3D｜普通没有当前本人Lock/活动Transaction的JYT批发车，名邦员工合法当前Vehicle对象管理Scope的可信来源核证、权限隔离与撤权真实并发**，指定B新分支`feat/f05-3d-wholesale-object-scope-trust`，由B从最新main建立；冻结旧42个独立PG16 Jobs完整原文、只增2新真实PG16 Jobs，受信正向可证明时目标**44/44同B/PR/Actions SHA success+两原生Artifacts及完整中文交接**。无经签对象授权来源时必须真实`GENERAL_WHOLESALE_VEHICLE_SCOPE_SOURCE_GAP`，不得造假归属/200。
- 分层缺口`IMAGE_LOCALIZATION_SOURCE_GAP`（PDM08已签合法转换与后续资产化解耦）、`HIDE_REASON_RECALCULATION_SOURCE_GAP`（保守hidden）、`FAVORITE_PHYSICAL_CARRIER_SOURCE_GAP`、`CURRENT_WHOLESALE_OBJECT_SCOPE_SOURCE_GAP`、`F05_3C_V18_NEW_CAR_SOURCE_MAPPING_GAP`、`SOURCE_GAP_BLOCKED_FOR_PRODUCTION`**均未擅自关闭**。当前`F05_3C_CONDITIONAL_CI_ACCEPTED_MERGED_PR34 / F05_3D_A_RELEASED_FOR_B_B_NOT_STARTED / NEXT_OWNER=B`。F05整体/F04生产/C-H01/V1基线仍`NOT_READY`，未允许接真实JYT/生产、图片/电话/资金。

---

# 2026-10-11｜F05-3C A二轮独立审查：CI42/42通过，Lock-only当前scope竞态与v18批量offline幂等数量2项定向整改（唯一最新）

- B`feat/f05-3c-convert-wholesale-to-mingbang`／[PR34](https://github.com/suzhe868-arch/mb/pull/34) 最新受检HEAD `2bbae12fe648f96c02b4caf3afa51761d4761bd7` = [Actions 38104964738](https://github.com/suzhe868-arch/mb/actions/runs/38104964738) head_sha；**42/42独立非特权真PG16成功、旧40项Job正文逐项严格原文不变**，新物理C-A01～16/16、TLS C-B01～07/7，87原生Artifacts、新`11689216636`与`11689605814`有效；全部15个新文件仅本包允许白名单，无旧迁移、PDM Final、生产及C越界。上轮v17→v18阻断已通过先受信原v17 JYT源、迁000018精确v18、原有源v18安全适配的原生日志与源码复验关闭。
- **A最新源码发现2项CI暂未覆盖、不得直接合并的真实行为边界**：`A-F05-3C-04` 转换`service.mjs/objectScope()`对作为授权凭据的当前Lock-only行仅`SELECT count`，但未对该Lock行持`FOR SHARE`到COMMIT，现有C-A15只锁Transaction，缺“持锁转换与合法Lock撤销/移交并发提交”PG16双后端时序；`A-F05-3C-05` 新`v18-sync.mjs/syncBatchOffline()`首调同事件下架实际1车、收据count_rows=1，同`eventKey`重放却固定回`count=0`，与已签F05-3B返回历史`count_rows=1`合同不一致。需新PG16实测、源码最小修复及再次全部42/42。
- **A正式第二轮完整定向整改单**：`07_重建工作区/F05-3C_A主控二轮独立复验同SHA42项通过但对象责任并发与批量下架重放合同定向整改单_2026-10-11.md`；[PR34正式A复审评论](https://github.com/suzhe868-arch/mb/pull/34#issuecomment-6105828398)。现时状态 **`F05_3C_A_SECOND_REVIEW_CHANGES_REQUESTED / PR34_NOT_MERGED / NEXT_OWNER=B`**，B继续原分支/PR34，仅新包service/v18-sync及本包真实测试/证据最小修复，旧40作业逐块全文冻结，最终B/PR/新Actions同SHA官方**42/42 success+两份未过期新Artifacts/全中文B交接**后交A复验；不得自行合并、开始F05-3D或生产。
- 本包暂只证明**条件式受信CI转换**，并非所有批发车/真实生产：`IMAGE_LOCALIZATION_SOURCE_GAP`、`HIDE_REASON_RECALCULATION_SOURCE_GAP`、`FAVORITE_PHYSICAL_CARRIER_SOURCE_GAP`、`CURRENT_WHOLESALE_OBJECT_SCOPE_SOURCE_GAP`、`F05_3C_V18_NEW_CAR_SOURCE_MAPPING_GAP`、`SOURCE_GAP_BLOCKED_FOR_PRODUCTION`仍存在；PDM08已确认转名邦与图片资产化解耦、3A临时受控CDN，不需用户重新决定产品规则。F05整体/F04生产/C-H01/V1产品基线继续`NOT_READY`。

---

# 2026-10-11｜F05-3C A二轮独立复验：42/42全绿、旧40冻结但v18批量offline幂等重放计数存在真实合同回归；原PR34一项定向整改（唯一最新）

- A已独立核GitHub [PR34](https://github.com/suzhe868-arch/mb/pull/34) 当前B/PR HEAD **`2bbae12fe648f96c02b4caf3afa51761d4761bd7`** = [Actions 38104964738](https://github.com/suzhe868-arch/mb/actions/runs/38104964738) run.head_sha，`completed/success`官方**42/42独立非特权真PG16 jobs成功**、原F05-3B**40个旧Job逐块正文全部原样**、新增物理`C-A01～16` **16/16**与TLS`C-B01～07` **7/7**，87原生Artifacts/新物理`11689216636`、TLS`11689605814`均未过期；PR只新增15项在`engineering/f05/wholesale-to-mingbang-conversion/**`或专属Workflow，无旧签工程迁移/Final/生产server/C改动。GitHub job日志真证v17先签Admin与独立JYT同步受信来源Vehicle/Cycle，再原子迁000018，v18精确seal及独立CI适配；同Vehicle/Cycle当前受信Employee/Lock/Transaction条件正向、completed拒绝、历史保持、双PG16真实`55P03`均已验证。**先前v17→v18版本阻断及旧40全文冻结问题已经关闭。**
- **新发现单项不能跳过的F05-3C-04验收阻断**：冻结旧F05-3B `syncBatchOffline` 在同`eventKey/action/payload`合法幂等重试返回原不可变`f05_3b_sync_receipts.count_rows`，而新v18兼容`v18-sync.mjs`的`syncBatchOffline`对任何以前批次固定返回`count:0`。首次真实下架1辆并已记录`count_rows=1`时原事件重试错误报告0辆。新增C-A12只测首次而未覆盖同eventKey原计数；42/42全绿不证明接口行为兼容。A已经写[PR34正式二轮审查评论](https://github.com/suzhe868-arch/mb/pull/34#issuecomment-6104730168)并发布**唯一完整一项定向整改单**`07_重建工作区/F05-3C_A主控二轮独立复验v18批量下架重试回执计数定向整改单_2026-10-11.md`。
- **下一B原分支一次性整改**：`feat/f05-3c-convert-wholesale-to-mingbang` + 原PR34，**只改新`v18-sync.mjs`与新测试/中文报告**，返回已签原生PG16收据的`count_rows`，补首次count=1→同eventKey重试仍1、首次NOOP=0→重试仍0、同eventKey不同payload/action拒绝、回执仅1行/Cycle状态不变；不改旧F05-3B/000017/旧40 Job/PDM/生产。B最后B HEAD=PR HEAD=新Actions run.head_sha且最终**42/42**、新物理/TLS原生Artifacts/中文交接再次交A。**现`F05_3C_A_SECOND_REVIEW_CHANGES_REQUESTED / PR34_NOT_MERGED / NEXT_OWNER=B`**，不进F05-3D。
- **合规缺口仍为产品/生产分层封印**：真实对象存储写入`IMAGE_LOCALIZATION_SOURCE_GAP`（按PDM08 Final转换与资产化解耦）、隐藏原因Matcher`HIDE_REASON_RECALCULATION_SOURCE_GAP`（保守hidden）、Favorite当前实体`FAVORITE_PHYSICAL_CARRIER_SOURCE_GAP`、无已签Lock/活动Transaction业务对象scope的普通批发车`CURRENT_WHOLESALE_OBJECT_SCOPE_SOURCE_GAP`，及未知v18新车映射/生产JYT`SOURCE_GAP_BLOCKED_FOR_PRODUCTION`。绝不因此修改已签产品规则或伪报全域PASS。F05整体、F04生产、C/H01高保真及V1基线继续`NOT_READY`。

---

# 2026-10-11｜F05-3C A首次独立复验：v17/000018跨版本真实阻断，PR34 Draft不合并，A完整技术裁决定向交B（唯一最新）

- 最新[PR34](https://github.com/suzhe868-arch/mb/pull/34) B分支`feat/f05-3c-convert-wholesale-to-mingbang` HEAD **`31edd5a0a83291f38bc1d9a4985ed76b89856bde`**，`Draft/open/not merged`。B提供的[Actions 38097826807](https://github.com/suzhe868-arch/mb/actions/runs/38097826807)实际HEAD **`7cc68ca7078944728c7985511fe69086dbec7e83`**，既非最终同SHA也不是绿色CI：官方42 Jobs中**40成功、2个新增真PG16物理/TLS Job失败**，官方Job日志共同报旧F05-3B封印`F05_3B_FROZEN_000016_REQUIRED`；现有旧v17严格15版本校验器不可在已迁000018的16版数据库内再次受信调用。无需重审已签收F05-3B。
- PR全部12文件只在允许新增`engineering/f05/wholesale-to-mingbang-conversion/**`和专属Workflow，旧签代码/迁移000001～000017/PDM/IA/C/正式生产Server零更改。**旧40 job实际39项正文完全相同，第40项`f05-3b-jyt-three-apis-https-pg16`仅多出末尾空行**；仍须恢复逐字冻结，B不得声称已完成40/40全文原样。
- **A正式技术裁决及原PR一次性整改单**：`07_重建工作区/F05-3C_A主控首次独立验收跨版本兼容技术裁决与原PR34完整定向整改单_2026-10-11.md`，[PR34 A审核评论](https://github.com/suzhe868-arch/mb/pull/34#issuecomment-6104424172)。A选定：**同一个真实隔离非特权PG16库先于000018用旧签F05-3B真Admin+独立Sync Credential受信创建批发Vehicle/Cycle/INTEGRATION历史收据→严格追加000018并新目录核完整16版seal→转换者用真实Employee/当前permission/team和当期已签Lock/Transaction对象scope执行同Vehicle/同Cycle单向转换+审计**。旧v17程序在新v18未受检数据库中拒绝是正确fail-closed；需要v18后能继续用3个同步API则仅在本包新目录另建精确v18受信兼容适配、复验Credential与接口开关/lineage/同car_code锁并提供正式正反PG16/TLS证据，不准改旧代码或新造生产路由。不能实证时保留`F05_3B_V18_FORWARD_COMPAT_SOURCE_GAP`。
- **原产品规则明确不需要新批准**：PDM-08 Final §12/13/13.1确认来源转换与图片资产化解耦，图片失败不能回滚合法转换，3A名邦受控CDN过渡直到资产双成功；无真实存储凭证仍`IMAGE_LOCALIZATION_SOURCE_GAP`，不假称success。缺真实隐藏多原因重新匹配→只保守hidden并标`HIDE_REASON_RECALCULATION_SOURCE_GAP`；缺M94 Favorite物理承载→`FAVORITE_PHYSICAL_CARRIER_SOURCE_GAP`，只对已有Lock/Transaction/推荐/周期查价等真实carrier做hash/FK不变实证；无真正Vehicle当前对象scope→`CURRENT_WHOLESALE_OBJECT_SCOPE_SOURCE_GAP`硬拒，不冒充所有批发车已授权。
- **现时`F05_3C=A_REVIEW_BLOCKED_VERSION_CHAIN_AND_EVIDENCE / PR34_DRAFT_NOT_MERGED / A_TECHNICAL_ARBITRATION_RELEASED_FOR_B / NEXT_OWNER=B`**。B继续原分支/PR34按一份单完整整改，恢复旧40 jobs字节原文，新增2真实PG16 job最终**42/42同B/PR/Actions HEAD SHA成功+两原生Artifacts/全中文交接**后A再独立验收；无来源继续SOURCE_GAP不制造假200，不擅自合并、不启动F05-3D/生产。F05整体、F04生产、C/H01和V1基线继续`NOT_READY`。

---

# 2026-10-11｜F05-3B A独立验收PASS、PR33已正式合并；F05-3C批发一键转名邦新施工单已放行（唯一最新）

- **F05-3B由A独立核验并实际合并**：[PR #33](https://github.com/suzhe868-arch/mb/pull/33) 最终B/PR HEAD `6c5d1c9d7eeef4b503cc96152d9e06d9ddbd15a8` = [Actions #38091991627](https://github.com/suzhe868-arch/mb/actions/runs/38091991627) run.head_sha，官方**40/40独立非特权真实PG16 jobs全部success**；F05-3A冻结旧38 Job逐Job全部全文不变，新物理17/17、环回TLS9/9、85份原生Artifacts（本轮新源PG16证据`11685175262`、TLS证据`11684104098`均未过期）；相对main仅**12项全部新增白名单文件**，旧签工程、迁移000001～000016、PDM Final/IA/Low-Fi、正式生产server与C设计零更改。
- **工程授权范围内PASS**：受信合成名邦同步API凭据与上游JYT Token、员工/4S登录独立；三固定API独立默认关闭/开关+审计；同car_code仅同Vehicle/同源identity，正常sync幂等、核心身份冲突拒绝并审计、转换后历史编号自动抑制；offline真正结束旧周期、真实relist新周期间保留同Vehicle；hidden不等于offline/同步不覆盖本地hidden；在售查询按真实源状态/当前Cycle安全DTO；凭据撤销不可逆、失败与合法HTTPS日志不可变脱敏、真独立PG16锁`55P03`通过。A正式签收[PR33评论](https://github.com/suzhe868-arch/mb/pull/33#issuecomment-6103550202)，A执行同HEAD防竞态标准合并，GitHub明确`merged=true`，merge SHA **`f983f13b6631d194c23c9b7ace77d6d691955c76`**。
- **A验收报告**：`07_重建工作区/F05-3B_A主控独立验收PASS_PR33正式合并与F05-3C接力_2026-10-11.md`。**唯一最新正式施工单**：`07_重建工作区/F05-3C_A主控批发一键转名邦同车同周期经营来源单向转换与历史安全完整施工单_2026-10-11.md`（F05-3C批发→名邦同车同周期单向转换，保留旧JYT lineage/car_code/已成Lock/Waitlist/Transaction/收藏/推荐/查价和快照，真实员工scope与经理权限、完成交易不可转换、隐藏规则重算和图片资产源差异、CI-only并发/审计）。指定B新分支`feat/f05-3c-convert-wholesale-to-mingbang`，由B从最新main建立。**冻结旧40个PG16 jobs，新增2项独立PG16，合法正向可证明才允许最终42/42同SHA+两原生Artifacts交A独立验收**。源授权、图片落地或历史权益真实carrier缺口必须`SOURCE_GAP`，不得为跑绿灯造成功。
- **当前`F05_3B_A_ACCEPTED_MERGED_PR33_CI_ONLY / F05_3C_A_RELEASED_FOR_B_B_NOT_STARTED / NEXT_OWNER=B`**。F05整体、F04真实生产、C/H01高保真与V1产品基线仍`NOT_READY`。未与真实JYT/Collector/真实资金/图片或生产凭据连通，不能宣告全域产品完成。

---

# 2026-10-11｜F05-3A 第三轮A独立验收正式PASS、PR32已合并；F05-3B JYT可信批发来源新包正式放行（唯一最新）

- **F05-3A已经A正式签收合并**：[PR32](https://github.com/suzhe868-arch/mb/pull/32) 最终B/PR受审HEAD `285d0c7519ed28803eddbf160d37493aa16d5e87` 与 [Actions 38087341051](https://github.com/suzhe868-arch/mb/actions/runs/38087341051) run.head_sha严格一致，官方**38/38独立非特权真PG16 job全部success**，冻结旧36 job全文不变，新真实物理**16/16**及HTTPS**11/11**，71份原生Artifacts、新物理`11681669932`和新TLS`11681904341`有效；PR18个文件全是本包新增白名单，无旧迁移/旧签工程/Final/IA/生产/C修改。A正式验收评论[6102629625](https://github.com/suzhe868-arch/mb/pull/32#issuecomment-6102629625)，A亲自标准merge SHA **`73a369554d98b3afac58c414fda1815aef190e42`**。
- **历史三项安全阻断彻底关闭**：`A-F05-3A-01` PostgreSQL复合FK与不可变来源身份、读路径强制license/subject同4S员工；`02` 已撤销license+Vehicle当前责任物理不可恢复、不可删、版本递增；`03` H-A11/14两真实独立PG16 backend通过`55P03`超时证明正在撞锁，真实rollback后治理COMMIT，末次读403。真实System Admin许可→4S本人新车发布Vehicle+Cycle+最小HTTPS detail200与所有跨账户/敏感403仍真实回归。无真实4S合作环境/生产连接，CI-only不代表生产可用。
- **正式A验收报告**：`07_重建工作区/F05-3A_A主控第三轮独立验收PR32正式合并与F05-3B接力_2026-10-11.md`。现依PDM-04 Final三类车源和JYT规则**正式放行F05-3B**：`07_重建工作区/F05-3B_A主控JYT批发身份来源上架周期与三接口隔离安全完整施工单_2026-10-11.md`；目标只限批发JYT来源凭据隔离、car_code身份、offline/relist ListingCycle与三个固定车源同步接口的非生产合同/真实PG16并发，**不做批发→名邦一键转名邦（留F05-3C）、不触真实JYT、电话/资金、生产/账号数据**。新工作分支`feat/f05-3b-jyt-wholesale-lineage-cycle`由B从最新main创建；冻结F05-3A旧38个独立PG16 job定义全文，新增2项真正PG16，合法来源可实证时最终**40/40同SHA成功＋两原生Artifacts**后交A；来源不足必须SOURCE_GAP，不准造可信凭据。
- **状态`F05_3A=A_ACCEPTED_MERGED_PR32_CI_ONLY / F05_3B=A_RELEASED_FOR_B_B_NOT_STARTED / NEXT_OWNER=B`**；F05全阶段、F04真实生产API、C/H01高保真及V1产品基线依旧`NOT_READY`。

---

# 2026-10-11｜F05-3A A二轮独立复验：4S首次合法正向链PASS，新增3项物理归属与并发阻断；PR32不合并，B整改（唯一最新）

- **A已独立确认真实正向及CI来源**：[PR #32](https://github.com/suzhe868-arch/mb/pull/32) 最新B/PR HEAD `4bd39d7e4b925346a6867870399260d9aaf85d87` = [Actions #38085191145](https://github.com/suzhe868-arch/mb/actions/runs/38085191145) `run.head_sha`；官方38/38真实非特权独立PG16 jobs success，冻结旧36全文不变；新增数据库14/14、HTTPS10/10，71原生Artifacts、新物理`11682206471`与TLS`11681796730`未过期；PR全部18项仅本包新白名单，000001～000015/旧F03/F04/F05/生产server/Final/IA/Low-Fi/C未改。
- **此前4S合法发布可信来源`SOURCE_GAP`已由本次受信链解决、无需重做**：System Admin真Session签发仅创建本人新4S人工Vehicle的license/scope，4S本人Session经PG16车型与必要字段核对，在同一DB事务建立全新Vehicle+ListingCycle+当前4S本人经营对象责任和不可变审计；真实TLS自己最小详情200，另4S/名邦/System Admin/旧车/JYT/六非详情出口403。
- **A二轮另发现3项必须修复的技术安全阻断**：`A-F05-3A-01` 新publication的license_id和member_employee_id各自独立FK、不强制license归于同一4S成员，现时read缺license.employee_id一致性校验且发布者身份事实可直接SQL改，可能把员工2合法license授权给未受管理员许可的员工8；`A-F05-3A-02` 两当前关系表缺`revoked_at`撤销后禁止UPDATE恢复的数据库不可逆约束，旧授权/旧归属可能物理复活；`A-F05-3A-03` H-A11/H-A14仅检查Promise启动瞬间尚未完成即释放锁，没有第二真实PG16 SQL确定已进入锁等待的可复现证据。
- **A正式完整二轮整改施工单**：`07_重建工作区/F05-3A_A主控二轮独立复验对象归属绑定复活与并发证据完整定向整改单_2026-10-11.md`；[PR32 A审核评论](https://github.com/suzhe868-arch/mb/pull/32#issuecomment-6102199600)。状态 **`F05_3A_A_CHANGES_REQUESTED_THREE_BLOCKERS / PR32_NOT_MERGED / NEXT_OWNER=B`**：B继续`feat/f05-3a-four-s-member-trust-scope`原PR32，仅修三项、真实PG16负例及独立确定性竞态，冻结旧36Jobs＋新2最终同SHA38/38与两新原生Artifacts及中文交接，再交A三轮复验；不得自行合并/进入F05-3B/生产。
- F05整体、F04生产Vehicle API、C/H01高保真和V1产品基线持续`NOT_READY`；本次仍仅隔离PG16和本地TLS验收，不触真实业务环境。

---

# 2026-10-11｜F05-3A A首次独立审查：真实4S来源缺口属实；原PR32保留Draft，A技术裁决及定向补证交B（唯一最新）

- **A已实查工程及原生证据**：[PR #32](https://github.com/suzhe868-arch/mb/pull/32) B/PR HEAD `6785b5e7130b5ba9b0c7996c70de2a5222bd8a46`与[Actions #38076660267](https://github.com/suzhe868-arch/mb/actions/runs/38076660267) `run.head_sha`完全一致，官方**38/38独立非特权PG16 CI成功**；原F05-2签收的**36个Job全文冻结未变**，新真实物理`G-A01～07 7/7`、真实HTTPS`G-B01～07 7/7`；原生**69份Artifacts**，新物理 `11678686225`、TLS `11679205872` 未过期；本PR仅**8项批准的新增白名单文件**、旧迁移/生产/Final/IA/C零改。**此仅证明没有受信source时安全拒绝，未有4S本人合法正式发布的正向200**；A独立确认`SOURCE_GAP_EVIDENCE_VERIFIED / F05_3A_BUSINESS_POSITIVE_NOT_ACCEPTED`。
- **缺口实质**：真实F03 PG16可证employee2 4S账号、active、`pc.four_s.vehicle.manage`个人allow，但现有scope仅Customer301、没有经授权的新Vehicle创建范围与4S本人同正式发布事务的Vehicle+Cycle+owner+审计收据；F05-2`team_id NOT NULL`只属名邦Team，不能拿4S来源字段或旧上传者伪签。A据PDM-02 Final§3/4、PDM-04§9/10及PDM-06§1/6/7/13作出**已有产品规则下技术裁决**：一个4S成员账号直接作为合作经营主体，不增4S组织；先由受信System Admin管控真实“仅创建本人新4S车”的资格/Scope，再由4S本人合规Session+正式发布完整字段在单PG16事务建立全新Vehicle/Cycle/本人的当前对象责任和不可变审计；旧车不得追认，没授权则403。
- **正式A定向补证施工单**：`07_重建工作区/F05-3A_A主控首次独立审查4S受信来源缺口技术裁决与定向补证施工单_2026-10-11.md`；[PR32正式A评论](https://github.com/suzhe868-arch/mb/pull/32#issuecomment-6101074294)。**状态`F05_3A_A_SOURCE_BRIDGE_RELEASED_FOR_B / PR32_DRAFT_NOT_MERGED / NEXT_OWNER=B`**，原分支`feat/f05-3a-four-s-member-trust-scope`追加许可内的受信来源/真PG16事务和独立正反测试，旧36冻结＋新2同SHA38/38、两原生Artifacts归档后交A复审；不擅自合并main、不开始F05-3B、不接生产。技术源证明仍缺则明确BLOCKED，不造200。
- F05全阶段、F04生产Vehicle接口、C/H01高保真与V1产品基线保持`NOT_READY`。F05-2已PASS并入main，原五项阻断不是当前问题。

---

# 2026-10-11｜F05-2 A第三轮验收PASS、PR31已合并；F05-3A 4S单成员可信来源隔离包正式放行（唯一最新）

- **F05-2 A正式PASS/CLOSED**：五项`A-F05-2-01～05`独立验收全部通过；[PR #31](https://github.com/suzhe868-arch/mb/pull/31)已由A**标准合并main**，merge SHA `fec72e9245845c252c551f6c172ecca7de5b4467`。受检B最终HEAD `50e28b69b60c4a48c50714abb003e514ec1f8205`与[Actions #38074648994](https://github.com/suzhe868-arch/mb/actions/runs/38074648994) run.head_sha一致，**36/36独立真实PG16 job success**；旧34个Job逐项原文冻结，新物理**21/21**、真实HTTPS**11/11**；59份Artifacts，新`11677953440`/`11677713304`未过期，旧M94封印不变，合并16项仅在批准新增白名单。A合并批准评论[6100698698](https://github.com/suzhe868-arch/mb/pull/31#issuecomment-6100698698)。
- **审计Actor问题真正关闭**：隔离`000015`治理触发器自动撤权为`SYSTEM`、human actor `NULL`、被撤权原负责员工仍单记`previous_employee_id`，before/after/事务/因果有物理证据、不可变；人工签发/主动撤权/经理交接记当前真实Session操作者；R-A17～21真实PG16反例合格。五项历史阻断只保留为审计记录，不再视为当前待修。
- **正式A报告**：`07_重建工作区/F05-2_A主控第三轮独立验收PR31正式合并与F05-3接力_2026-10-11.md`。**F05-3A新完整施工单已放行**：`07_重建工作区/F05-3A_A主控4S单成员经营责任可信来源与Vehicle隔离权限验证完整施工单_2026-10-11.md`，范围仅“4S单成员真实身份发布来源及经营责任+最小隔离授权/撤权审计”（旧36真PG16全文冻结、至少新2项独立真PG16=>条件具备时**38/38**）。指定新分支`feat/f05-3a-four-s-member-trust-scope`，**NEXT_OWNER=B / B_NOT_STARTED**，由B从最新main创建并一次性开发/自测/归档后交A，不擅自合并；来源实证不足必须`SOURCE_GAP`阻断，禁止造4S组织或越权200。
- **边界不变**：F05整体、F04生产Vehicle端点、C/H01高保真和V1总基线`NOT_READY`；F05-2 CI-only并非生产授权，不接真实JYT/采购价格/电话/资金或现有车辆自动回填Owner。F05-3B JYT/转名邦/定价等另行放行。

---

# 2026-10-11｜F05-2 A二轮独立复验：旧四项均PASS，新增自动撤权审计Actor真实性唯一阻断（唯一最新）

- **二轮原生事实已独立证明**：[PR31](https://github.com/suzhe868-arch/mb/pull/31)最终受检B/PR HEAD `68a263add2ae68ba3860f939a78b949589a0bb55` = [Actions 38071814138](https://github.com/suzhe868-arch/mb/actions/runs/38071814138) run.head_sha；官方**36/36真实独立非特权PG16 job success**，冻结旧34个job逐一原文不变，新增真实物理**16/16**、HTTPS**11/11**；59份原生Artifacts，新物理`11676863942`、TLS`11676953699`均未过期；PR16项全部是批准的新增路径，无生产/原旧迁移/Final/IA/C改动。
- **旧阻断 A-F05-2-01/02/03/04 全部 PASS/CLOSED（不要求返工）**：经A审源码及真实PG16/HTTPS负例，原普通销售交接后403、复职不自动恢复旧Vehicle责任、禁止历史created_by事后补造信任源、真正新人工发布同事务创建Vehicle/Cycle/责任/审计、独立两PG16连接验证权限/source/交接与读写最终COMMIT顺序，均满足本批CI-only门禁。
- **A二轮仅新增 `A-F05-2-05` 审计Actor真实性阻断**：在新增`000015_vehicle_responsibility.sql` `f05_2_close_steward_links`内，自动撤权的审计`actor_employee_id`错误地取自被撤权的`responsible_employee_id`，可把System Admin/其他治理人或系统触发的权限变化不可变地记成该员工“本人执行”，违反PDM-25 Final §2与PDM-02治理历史真实性。应准确区分SYSTEM自动动作、真实人工操作者及被影响原负责员工，不许捏造human Actor。
- **已正式写完整单份二轮整改单**：`07_重建工作区/F05-2_A主控二轮独立复验自动撤权审计Actor真实性完整定向整改单_2026-10-11.md`，PR31 A评论`6100420933`。状态 **`F05_2=A_CHANGES_REQUESTED / PR31_NOT_MERGED / NEXT_OWNER=B`**：B继续原`feat/f05-2-vehicle-stewardship-physical-scope`和PR31，仅修复审计归责/添加真实PG16负例，旧34冻结＋2新全部重跑最终同SHA36/36、两原生Artifacts与中文自验再交A，不得擅合并或先施工F05-3。F05整体、F04真实生产、C/H01和V1基线依旧`NOT_READY`。

---

# 2026-10-11｜F05-2 A首次独立复验发现四项对象权限及并发阻断（唯一最新）

- **受检PR [#31](https://github.com/suzhe868-arch/mb/pull/31) CI事实全部有效**：B最终SHA `52078ba41fe205ead1da373bc4bf52fc2610ccd8` = PR HEAD = [Actions 38059665296](https://github.com/suzhe868-arch/mb/actions/runs/38059665296) head_sha；官方36/36独立真实非特权PG16 jobs success（冻结旧34不变，新2），新增A物理11/11、HTTPS9/9，59份原生Artifacts（新`11672373434`、`11673021019`），本PR仅16份批准的新增文件。上述不等于A接受权限语义。
- **A复审结论：`F05_2=A_CHANGES_REQUESTED / PR31_NOT_MERGED / NEXT_OWNER=B`**。四项明确阻断：**01** 交接后原普通销售仍凭Team vehicle.read看他人Vehicle；**02** inactive/旧scope恢复导致旧Vehicle责任自动复活（PDM-02 §9.4禁止）；**03** 旧车created_by+发布时间可事后自建受信发布审计并签发业务owner，缺真实发布事务独立来源；**04** 权限/身份/scope撤销与读取/交接的真实PG16最终COMMIT竞态未测且缺守卫。详见`07_重建工作区/F05-2_A主控首次独立复验权限交接与并发闭环完整整改单_2026-10-11.md`和PR31 A评论 `6099902681`。
- **B立即在原分支一次性完成整单整改**：保留旧34项逐字冻结、补旧owner/复职/可信来源/权限并发正反例，再取得整改最终同SHA36/36（或补充新独立Job）、真实两新Artifacts及中文自验交A二轮复验。A未验收前不得合并PR31或开始F05-3。F05全域、F04正式生产、C/H01及V1产品基线继续`NOT_READY`；不新增生产/账号/资金/第三方权限。

---

# 2026-10-10｜F05-1 A主控独立验收正式通过、PR30合并；F05-2 Vehicle可信责任物理关系及权限并发包正式放行（唯一最新）

- **F05-1已由A独立验收/标准合并**：[PR #30](https://github.com/suzhe868-arch/mb/pull/30)；B最终HEAD `146129d94af0df6570bba7bb17781f1528d00a7c`与官方[Actions #38056158521](https://github.com/suzhe868-arch/mb/actions/runs/38056158521) `run.head_sha`完全相同，**34/34真实独立非特权PG16 jobs success**；新增真实物理/99条约束 **9/9**、TLS/Session/Vehicle七出口 **9/9**；**51份原生Artifacts**，新Source `11671056231`、新TLS `11671291921`；A对照旧F04-4原**32个job正文逐一不变**、仅12项批准白名单新增文件，无旧迁移/Final/IA/生产server/C设计改动。A正面验收评论`6098084371`；**标准merge SHA `5f70588905a8cadbb47a3bc4a8eb6af411b94597`**。正式验收报告`07_重建工作区/F05-1_A主控独立验收PR30正式合并与F05-2可信归属接力_2026-10-10.md`。
- **正式源事实，不能误判为功能已完成**：M94真实94表/608列/435约束/163索引/2120目录项；26表153列、99项原FK/PK/UNIQUE/CHECK实证，Vehicle物理source值`wholesale/mingbang/four_s`。目前**REAL_VEHICLE_SCOPE_PROVEN=0**，即未有可信签发的Vehicle→当前经营负责人/Team/4S代表主体绑定，不是零车辆。员工上传者/Employee.store_id/CRM owner/历史/客户端merchantId/Priority/Recommendation grant均不能发放经营读取权限。6主体×3来源×2周期×7业务出口252项全部保守拒，七类Vehicle detail/list/export/copy/cache/print/history在归属未证时统一`403 F05_VEHICLE_SCOPE_UNPROVEN`且无敏感字段，F04-1原CustomerId精准CRM合法合成读仍为唯一既签正例。F05-1仅CI-only，F05全阶段/正式生产Vehicle读写仍`NOT_READY`。
- **A现正式放行F05-2完整施工单**：`07_重建工作区/F05-2_A主控Vehicle当前管理责任可信关系增量迁移与真实权限闭环完整施工单_2026-10-10.md`，状态**`F05_2_A_RELEASED_FOR_B / B_NOT_STARTED / NEXT_OWNER=B`**。B执行时从最新main新建`feat/f05-2-vehicle-stewardship-physical-scope`，依据PDM-02/04/06/21/22/25及现时F03权限/Scope审查可信车辆业务责任事件/历史；只在一次性隔离非特权PG16**安全增量新版本迁移**和受信合成实体证明合法责任签发、撤权/交接与现时最小Vehicle读，**必须真实正向PG16授权证据**，并发/越权负例完整，不能把created_by或4S source_type自动当Owner，不建立4S组织层；无源动作持续403/显式阻断，不造许可。**冻结旧34个独立真PG16 job，加2个独立真PG16 job，最终36/36同SHA成功**；仅新增F05-2包与新workflow、不得修改000001～000014、旧源码、Final/IA/生产server/C，不得真实生产DDL/账号/资金/第三方写入。B完成归档原生Artifacts和中文自验后交A独立复核，不自合并main、不提前F05-3。
- **产品及设计不变**：F04真实生产路由、F05 Vehicle全域、F06/F07和C/H01高保真、H03/H04及V1整体保持`NOT_READY`，用户生产迁移、资金或真实第三方连接另行独立授权。本节覆盖历史“F05-1等待B交审”的状态指针，不改写其真实工程过程。

---

# 2026-10-10｜F04-4 A二轮独立验收通过、PR29合并；F05-1车辆可信归属与最小安全投影完整施工单放行（唯一最新）

- **正式F04-4验收与合并**：B最终SHA `92452b124c293bfe646cea99d3a8afd46e54f2e8`；[Actions #38053741869](https://github.com/suzhe868-arch/mb/actions/runs/38053741869)同SHA**32/32真正独立非特权PG16 jobs success**，新Source 18/18、Consumer TLS 8/8，45份原生Artifacts，新Source `11670013141`及TLS `11670647334`；A独立比较旧30个job逐一正文未修改，14个新增文件仅在F04-4批准白名单。PR [#29](https://github.com/suzhe868-arch/mb/pull/29)由A二轮正面复核评论`6097766248`正式许可并**标准合并**，merge SHA **`8de73cdf0fa89d3aa02af9a352b5e203e66e8bb8`**。正式A验收报告：`07_重建工作区/F04-4_A主控二轮独立验收PR29正式合并与F05-1交接_2026-10-10.md`。旧阻断`A-F04-4-01=PASS/CLOSED`。
- **DTO实际边界（不能混淆）**：新增8项Current动作有真实意图来源，但只**1项Vehicle source_type修改有合法最小CI合成typed字段**`vehicleId/targetSourceType∈{名邦,4S}`，物理wire/scope仍待后续证实；其余**7项INTENT_ONLY_CI_CONTRACT/REQUEST_SCHEMA_SOURCE_GAP**，禁止冒称8个可执行生产DTO。Current逐原文437项，三向桥接258项，旧215=23同动作有证/192 SOURCE_GAP且全部UNDECIDED、3 Collector禁恢复；Page Manifest标题140 logical与可检表行132差8保留SOURCE_GAP、不造页面、不阻本批签收。F04整体、C/H01、真实业务接口、V1总基线继续`NOT_READY`。
- **唯一新工程工作包**：A已正式下发`07_重建工作区/F05-1_A主控Vehicle可信归属与最小安全投影完整施工单_2026-10-10.md`，**`F05_1_A_RELEASED_FOR_B / B_NOT_STARTED / NEXT_OWNER=B`**。B必须从执行时最新main新建`feat/f05-1-vehicle-scope-safe-projection`，按当前Final/IA/Low-Fi核M94真实Vehicle/ListingCycle/三种车源及员工/4S归属scope，独立字段白名单安全投影和HTTPS现时Session安全；无可信物理scope一律403，不用uploader/store/CRM owner/客户端merchant字段发放业务权限；**禁止本包新DDL、旧迁移/冻结代码改动、生产server接线/资金/第三方业务写入**，将实际缺口/独立迁移方案归F05-2。新专属workflow冻结原32真PG16旧job+独立2个真PG16，最终**34/34个独立PG16 success、B HEAD=PR HEAD=run.head_sha、两新原生Artifacts**与中文交接后交A独立验收。
- **当前A主控已完成所有合法签收、合并、报告与新工作单放行；不需要用户做技术子项确认。** 本节覆盖上一段F04-4 A_CHANGES_REQUESTED / PR29未合并的历史指针，但其审计事实及首次整改单持续留库。

---

# 2026-10-10｜F04-4 B同SHA32/32真PG16成功，但A独立审查发现新增动作DTO业务语义单项阻断（唯一最新）

- **B交审的工程测试/证据真实成立**：PR [#29](https://github.com/suzhe868-arch/mb/pull/29) 指定`feat/f04-4-current-action-coverage-gate`最终HEAD `3e2e5a2f27c2c88dbc595f3312a6520f843c6a84`，与[Actions 38051029689](https://github.com/suzhe868-arch/mb/actions/runs/38051029689) head SHA逐字相同；分页全取真实**32/32独立非特权PostgreSQL16 jobs success**，**45份原生Artifacts**（新Source `11669133122`、新TLS `11669622637`），14个新增文件严格在白名单，不改F03/F04-1/2/3冻结旧代码/工作流及000001～000014/产品Final/IA/C。437条逐原文Current来源、258条旧新三向桥接、旧215个23 matched/192 SOURCE_GAP及3个Collector禁恢复核账仍保留。上述测试绿灯不自动等于A通过。
- **A-F04-4-01独立阻断：8条“typed DTO”全把单一正整数ID当唯一必填动作参数**。明确业务不匹配：`ANNOUNCEMENT_CREATE`强制现有`announcementId`但PDM-24/Current导航没有为“新建”证明既存ID输入；`VEHICLE_SOURCE_TYPE_EDIT`只有`vehicleId`不携目标`source_type`；`MARKUP_RULE_SAVE`只有`markupRuleId`不带规则参数/草稿范围；`SYSTEM_MODEL_MAPPING_BIND`仅有mapping ID而无目标车型绑定事实。验证器/负例只证明单个整数、禁额外敏感字段，无法证明Current操作的有效输入。B必须按Final/IA补**动作语义正确且字段出处真实的最小typed合同**，缺业务请求出处标`REQUEST_SCHEMA_SOURCE_GAP/INTENT_ONLY_CI_CONTRACT`并不得冒称可执行typed DTO；新增变异负例后完整同SHA32/32重新验收。
- **140 vs132 Page Manifest真实差额另立未闭来源事实**：B对Current C/E/P页面物理表行可独立证明132、文件标题声明140，8项差额未能证具体Page ID，已保守`SOURCE_GAP`；A判**本轮不是额外阻断**，禁止捏造8张页面或修改权威Final/IA，可继续后续来源核查。
- **A正式单份完整技术整改单已落主线**：`07_重建工作区/F04-4_A主控首次独立审查增量动作DTO业务语义完整定向整改单_2026-10-10.md`；PR29 A审核评论`6097622718`；**`F04_4=A_CHANGES_REQUESTED / PR29_NOT_MERGED / NEXT_OWNER=B`**。B留原`feat/f04-4-current-action-coverage-gate`分支/PR29一次性整改、自测、完整最终SHA对应32/32真PG16全成功、两新原生Artifacts及中文交接再交A二轮审查。不得自行合并main、改Final/旧迁移/生产server、开启实账户/资金/第三方或启动F04-5/F05。F04全阶段、C/H01高保真与产品V1基线继续`NOT_READY`。本节覆盖旧“F04-4 A已放行/B未开始”的过时指针，不改写F04-3正式验收事实。

---

# 2026-10-10｜F04-3 A二轮独立验收通过、PR28标准合并；F04-4完整施工单正式放行B（唯一最新）

- **F04-3已由A真实验收并标准合并**：[PR #28](https://github.com/suzhe868-arch/mb/pull/28) 为 `closed/merged=true`；B最终HEAD `f86f592056303e9ac6e04ad5af5be93accf41b80` 与 [Actions #38048203956](https://github.com/suzhe868-arch/mb/actions/runs/38048203956) `head_sha`完全一致，**30/30独立非特权PostgreSQL16 jobs全部成功**，新增Source/DTO/语义 **16/16**、TLS/身份与对象权限 **13/13**；41份原生Artifacts，新Source ID `11668517606`、新TLS ID `11668526569`；M94原94表/2120目录及G000014不同版本封印未损。全部16个变更文件均属新增F04-3白名单，原冻结28 job正文未修改。A正面审查评论ID `6097071207`；**GitHub标准merge提交 `a1f7ebcbfdf1184ed2b1e1143afe01e877119694`**。二轮报告：`07_重建工作区/F04-3_A主控二轮独立验收PR28正式合并与F04-4接力_2026-10-10.md`。
- **A-F04-3-01/02/03全部PASS/CLOSED**：B按首次A定向整改单，将占位DTO升级成32项类型化合成Current合同并有OpenAPI/DTO双方字节/schema/字段白名单与敏感字段反例，6个Current新动作与2个System Admin治理新动作核真实Final/IA/Low-Fi语义，Customer认证不能借员工PC Cookie、SystemAdmin控制面与业务经理独立，4S未证scope继续硬拒。只有F04-1原签最小CustomerId对象级CI只读返回合成200；其他未实施业务仍403/501。32项全部 `NOT_APPROVED/NOT_PRODUCTION`，**不是生产32个已上线接口**。
- **F04-2历史来源冻结**：旧218 method+path/198 paths/62个冒号paths，215候选中23个同动作Current证据、192个`SOURCE_GAP`，215项全部`UNDECIDED/CONTRACT_ONLY`，三条Collector连接管理禁恢复持续RETIRE；F04-1/2/3均仅CI-only技术批验收，F04全量Current/真实4S商户管理/客户认证/F05～F07/C-H01及产品基线依然`NOT_READY`。
- **A正式放行新的完整F04-4施工包**：工作单`07_重建工作区/F04-4_A主控Current全量动作覆盖消费合同与隔离安全门禁完整施工单_2026-10-10.md`；**`NEXT_OWNER=B / F04_4_A_RELEASED_FOR_B / B_NOT_STARTED`**；B在执行时从最新main新建独立分支 `feat/f04-4-current-action-coverage-gate`（A没有假称已创建），完整清点Current IA/Navigation/Guard全部真实动作与C/E/P/4S消费缺口，构建三向旧新追溯与新增合法CI-only typed DTO/消费权限门禁；不编造旧192条批准状态，不创4S组织层级、不增加DDL、不启生产/资金/真实第三方。**最终32/32彼此独立真非特权PG16 CI成功（冻结旧30+新增2）**且run.head_sha同B最终HEAD，原生Artifacts和完整中文交接后交A。B不得自行合并main或启动F04-5/F05，C/H01仍未最终验收、按原授权独立并行。
- **唯一下一步：B按F04-4完整单施工、测试、自验与证据交A；本轮无需用户裁决。** 本节覆盖旧“F04-3待B整改/PR28未合并”的历史指针，不更改其历史审计事实。

---

# 2026-10-10｜F04-3 B自验同SHA30/30成功，但A独立复核发现三项合同阻断（唯一当前最新）

- **B真实工程及CI核验成功但不等于A签收**：PR [#28](https://github.com/suzhe868-arch/mb/pull/28) 当前open，指定分支`feat/f04-3-current-action-api-registry` 最终B HEAD `ce99e604d4fb58aa04f859231fd55fd37daa3891`，与原生 [Actions 38045766826](https://github.com/suzhe868-arch/mb/actions/runs/38045766826) head_sha完全一致，`completed/success`、**30/30独立真实非特权PostgreSQL16作业成功**（冻结旧28+新2）；**41份原生Artifacts**，新Source ID `11667603668`、TLS ID `11667613585`，均未过期。PR只新增13份授权文件，旧28份workflows job正文未改变、冻结F03/F04-1/2及迁移/产品Final/IA/Low-Fi未动。新增来源8/8、HTTP/TLS11/11为已证明的隔离合成测试，不是全合同验收。
- **A-F04-3-01 DTO实质性阻断**：30条候选中29条仍用`v1:none/unknown-blocked`或`v1:pending-domain-implementation`，且统一`code+dependency`占位响应；OpenAPI仅定义`CiMinimalCustomer`一个数据Schema，29条业务动作缺逐动作可执行请求/响应字段白名单、对象身份、类型和Schema强校验。`source-guard`只判断`v1:`前缀，没有实质敏感字段负例。沿历史旧号生成`/actions/...-019`也不能自动等同基于Current业务对象产生的接口合同。按Current真Authority落实可类型校验的CI-only DTO；未证字段显式gap，不能编造生产实施。
- **A-F04-3-02 Current新动作Authority语义不足**：6条NEW_CURRENT_ACTION的证据校验当前只证Final文档目标行存在和某Nav行字面动作，并无同主体/资源/业务状态/Domain强约束或真实但不相关引文负例；必须按Current Final+IA+Low-Fi重证并加入相关变异测试。
- **A-F04-3-03 Actor/认证边界错配**：OpenAPI全部30操作声明PC员工Cookie方案，尽管有CUSTOMER主体动作，真实路由全部对CUSTOMER硬拒；不能将PC认证写成客户动作合法认证合同。员工新增/停用/恢复等仅`EMPLOYEE_MANAGER`也漏掉PDM-02 §6.2 System Admin控制平面的合法治理语义。需区分Control Plane与Business Actor、合法客户身份尚未实现的依赖缺口，同时保持当前硬拒和CI-only。
- **A已正式签署整改单并留PR评论ID `6096753581`**：`07_重建工作区/F04-3_A主控首次独立复核DTO实质合同与主体权限完整定向整改单_2026-10-10.md`；当前**`A_CHANGES_REQUESTED / PR28_NOT_MERGED / NEXT_OWNER=B`**。B继续原分支按同份整改单一次性整改上述三项、补真变异负例、完整30/30真PG16旧新回归与最终SHA匹配、两份新原生Artifacts和中文交接，再交A二轮独立验收。**不得B自行合并、启动F04-4、扩大生产/DDL/资金/第三方或变更已冻结规则**。H01未签、F04整个阶段及产品基线依旧`NOT_READY`。此段覆盖下方旧“F04-3 B_NOT_STARTED”的过时历史指针，不改写F04-2已验收事实。

---

# 2026-10-10｜F04-2 A二轮独立验收正式通过并合并PR27；F04-3完整施工单已放行B（唯一当前最新）

- **A真实已合并PR27：** [PR #27](https://github.com/suzhe868-arch/mb/pull/27) `closed/merged=true`；最终B提交`d09038917c91446eb8914f53f3e1881345ba7d1a`；官方[Actions 38041020114](https://github.com/suzhe868-arch/mb/actions/runs/38041020114)与B最终HEAD完全同SHA、`completed/success`、**28/28独立真实非特权PostgreSQL16 jobs成功**（既有26全部冻结＋新2），新Authority 11/11、4S loopback HTTPS 9/9；37份原生Artifacts含新`11666040902/11665941117`、旧M94原94表与G14隔离封印无削弱。PR27共13个授权文件，只在`engineering/f04/authority-route-mapping/**`和新独立workflow；A正面验收评论ID `6096462233`；**标准merge提交`70d1f68490c851823cf5d1415c703667c0305cb4`**。正式报告：`07_重建工作区/F04-2_A主控二轮独立验收PR27正式合并与F04-3交接_2026-10-10.md`。
- **上轮A双阻断均关闭**：F04-2 215个旧候选当前按真实同主体/同动作/Final/IA/Low-Fi语义重新核证后只有**23 `EVIDENCE_MATCHED` + 192 `SOURCE_GAP`**，原粗粒度105中的82下调缺口并有105条逐行复核。咨询Consultation归PDM-15，候补Waitlist归PDM-18/F06，F04合同责任与实际Domain实施分开；假Nav/PDM证据和真实但**不同动作**引用均有独立负例。旧218 methods/198 paths/62个冒号paths与3 Collector禁恢复仍原样保守；所有215依旧`decision=UNDECIDED / current_stage=CONTRACT_ONLY`，23不是已批准老路由，192不能私自恢复。
- **本批只验收CI-only技术能力，不是正式业务完成**：System Admin→4S控制面仅是隔离HTTPS最小只读，真实4S商户对象绑定尚无证据，目标一律403；正式CRM/车辆价权/锁车交易退款/JYT-CDN/真实生产路由与C/H01高保真仍有缺口。F04整体及产品基线`NOT_READY`。
- **A已独立正式签发下一完整工程施工单：** `07_重建工作区/F04-3_A主控Current新接口注册表DTO与路由安全门禁完整施工单_2026-10-10.md`。**NEXT_OWNER=B / F04_3_A_RELEASED_FOR_B / B_NOT_STARTED**，B需从执行时最新main建立新指定分支`feat/f04-3-current-action-api-registry`（尚未假称分支已创建），一次性完成Current PDM/IA/Low-Fi动作证实的**新**HTTP/DTO合同目录、23匹配/192缺口/3禁恢复追溯、CI-only安全路由和真实会话/object scope/错误/敏感出口门禁；所有未实现F05/F06/F07业务不得假200或生产启用。最终**30/30真正独立非特权PG16 CI jobs（冻结原28+新2）**、run.head_sha同最终B HEAD，独立原生Artifacts及完整中文交接后交A。B不得自行合并main、扩大生产/DDL/4S真实账号或资金权限，也不得启动F04-4。
- **唯一正式下一步：B按新F04-3施工单整包施工、完整CI及证据交A复验；C设计原授权独立并行，A等待正式交付再独立验收。** 本段覆盖旧“F04-2未通过/PR27未合并”的历史状态叙述，不修改历史验收事实。

---

# 2026-10-10｜F04-2 B自验28/28成功、A独立审查发现Authority语义错配及Domain责任错分（唯一当前最新）

- **B真实证据合格但不等于A通过**：PR [#27](https://github.com/suzhe868-arch/mb/pull/27) 原B分支`feat/f04-2-authority-route-mapping`受检HEAD `b3535bbe70c0708e4ba386293e7298408f163da8`与真实[Actions38034145668](https://github.com/suzhe868-arch/mb/actions/runs/38034145668) head SHA一致，**28/28独立非特权PostgreSQL16作业success**（冻结旧26+2新）；新Authority原生PG16 **8/8**与新4S真实HTTPS **9/9**，37份原始Artifacts，新Artifact IDs 11662184264/11662909011、M94原94表2120对象封印PASS；11文件严格新增白名单。B所做4S CI-only System Admin最小身份自检/未证明商户归属均403拒绝，本轮无单独安全阻断；此前F04-1/旧F03源码与正式PDM/IA没有改动。
- **A-F04-2-01阻断：语义失配**。B矩阵215行中**105行标`EVIDENCE_MATCHED`、110行`SOURCE_GAP`**，但多条真实引文引用了**另一种动作**：LEGACY-001微信会话↔手机号授权；LEGACY-019创建Consultation↔“C01打开车辆”；LEGACY-020登记候补↔“C01打开车辆”；LEGACY-069～072咨询处理/完结/转派↔“修改内部客户称呼”；LEGACY-079车辆发布↔“进入内部模式”；LEGACY-085价格修改不可借“内部模式”证明编辑权限。当前`source-verifier.mjs::quoteCheck`只验证真实文档字节存在，不核动作/主体/PDM相符，原8/8无法识别此类错配。B须反查所有105`EVIDENCE_MATCHED`、更换真正同动作权限来源或降`SOURCE_GAP`、补真实但**不相关**引文的负例与重审前后数量统计，不能编造批准KEEP/MODIFY。
- **A-F04-2-02阻断：Domain/Owner错配**。LEGACY-019 Consultation创建与LEGACY-020 Waitlist候补按URL前缀被分至`VEHICLE/F05`，实际PDM-15/18独立业务域；尤其Waitlist属PDM-18、下游F06锁车候补，不得借vehicle前缀移交F05。明确区分F04 HTTP路由合同Owner与各业务Domain真实实施Owner，真缺口记`OWNER_REVIEW_GAP`；补跨域真实对应测试和中文交接。
- **正式一次性A整改单**：`07_重建工作区/F04-2_A主控首次独立复核Authority动作误配完整定向整改单_2026-10-10.md`，PR27已有A审核评论ID `6095831957`。**A_CHANGES_REQUESTED / PR27_NOT_MERGED / NEXT_OWNER=B**。B只能在原`feat/f04-2-authority-route-mapping`完成本批全部整改，自审/更新原生Artifacts、重新取得最新HEAD同SHA完整**28/28独立PG16 success**后交A；不自行合并或启动F04-3。F04-1 PR26已签并合并、F04整体/真实4S治理/F05～F07/C-H01高保真/三端UAT/产品基线均`NOT_READY`。本段覆盖以下旧“F04-2 B未开始”历史指针，不重写旧事实。

---

# 2026-10-10｜F04-1 A二轮独立验收通过、PR26正式合并；F04-2完整施工单已正式放行B（唯一当前最新）

- **F04-1最终验收且标准合并完成**：PR [#26](https://github.com/suzhe868-arch/mb/pull/26) 受检B HEAD `6af50664ec230f11caf62c73562449069d086b15`；同SHA真实[Actions 38031443210](https://github.com/suzhe868-arch/mb/actions/runs/38031443210) **26/26独立非特权PG16 job全部成功**（旧24+F04-1 2），新F04 Route-security原始HTTPS日志 **20/20**、Contracts-inventory原始PG16日志 **10/10**，33份run原始Artifacts；合并SHA **`20479f3712a5aaa862f7db4378d8db2369695d79`**，已实查PR `closed / merged=true`。A正式复验：`07_重建工作区/F04-1_A主控二轮独立验收PR26正式合并与下一阶段归属_2026-10-10.md`。F04-1仅**隔离CI合同/安全路由**子批签收，并非218历史API上线或F04全阶段通过。
- **三项前轮阻断已由A独立关闭**：A-F04-01源OpenAPI**198真实paths/218 method+path/62含冒号paths**全与新台账匹配，0来源路径误归，独立严格Parser+结构反例；A-F04-02旧Collector连接GET/PATCH/TEST三条`RETIRE/FORBIDDEN`，其余215个旧候选**`UNREVIEWED_SOURCE_GAP`**，没有伪装成Final批准可改/可用；A-F04-03`crm.customer.view`当前独立能力＋目标**Customer exact object scope**＋current owner＋有效Session/Role个人deny才可隔离读取最小customerId，真PG16/TLS的owner变更、越Team、越界/撤权/跨店测试通过；无合法目标scope则403。
- **A正式放行下一个完整B工程包F04-2**：工作单`07_重建工作区/F04-2_A主控现行215接口Authority映射与4S账号安全控制前置完整施工单_2026-10-10.md`；工作分支`feat/f04-2-authority-route-mapping`，由B从开始时最新main创建。F04-2A逐行按真实Current IA/Low-Fi/PDM映射215历史候选，证据缺口须标明不能编造；F04-2B在CI-only真实PG16/HTTPS做System Admin→4S账号控制面**只读资格/身份预检，业务修改硬禁**；F04-2C全链28个独立真实PG16 jobs（冻结旧26+新2），B负责一次性实施/测试/自审/证据交A；**本次A只签发，未宣布B分支已建或B已施工**。
- **NEXT_OWNER=B / NEXT_TASK=F04_2_CURRENT_AUTHORITY_MAPPING_AND_4S_PRECHECK**；禁止B自行合并、擅改旧F03/F04-1或PDM、未授权生产/微信/JYT/资金与F04-3。剩余215项Current Authority、F04实际4S治理和CRM、F05～F07真实业务、C/H01高保真及三端UAT仍待后续真实实现/验收；`PRODUCT_BASELINE_STATUS=NOT_READY`。本段覆盖以下F04-1“待B整改”的历史指针（不删除旧证据）。

---

# 2026-10-10｜F04-1 B自验26/26通过，但A独立审查发现三项接口来源与对象权限证明阻断（当前唯一最新）

- **本轮B交审事实保留**：指定`feat/f04-1-contract-safety-gate`分支受检HEAD `cb5a96699a4b93bc42dc0f81188c22ee8d5b49c7`，真实同SHA[Actions 38029582060](https://github.com/suzhe868-arch/mb/actions/runs/38029582060) `26/26`独立PG16 `completed/success`（冻结旧24+F04新增2），新HTTP 15/15、Inventory 7/7，10个新增文件严格白名单，未改旧F03服务/迁移/CI；当前B仅`READY_FOR_A_REVIEW`，**不等于A验收成功**。
- **A独立复核不通过**：A-F04-01 实际OpenAPI **198个不同路径/218 method+path**，B仅记录136个不同路径、62条含冒号的路径错归前一条（`phone:authorize`、`price-access:unlock`、`connection:test`等），旧Inventory测试同错正则自证；A-F04-02 218条全部`MODIFY`，甚至已禁恢复Collector连接GET/PATCH/TEST，须按真实Final/IA分类，禁恢复`RETIRE`、未核实`UNREVIEWED_SOURCE_GAP`不得假认；A-F04-03 已允许的最小客户本人owner正向HTTP读没有证明目标Customer本身与当前data scope的对象级授权链，需真实对象范围证明和跨Team/store正反例，缺证回安全拒绝。
- **正式一次性整改单**：`07_重建工作区/F04-1_A主控首次独立审查与接口溯源权限证明完整定向整改单_2026-10-10.md`，并已写[PR26审查评论](https://github.com/suzhe868-arch/mb/pull/26)。**A_CHANGES_REQUESTED / NOT_ACCEPTED / NOT_MERGED / NEXT_OWNER=B**。B留原`feat/f04-1-contract-safety-gate`分支一次性整改，修复可解决问题并取得最终新HEAD一致的26/26独立真PG16成功，归档完整源路径、负例、权限证明及中文交接后交A；**禁止自行合并PR26及开启F04-2**。
- F03-V已验收合并PR25，已签产品Final/既有工程封印不变；C/H01高保真、F04全业务、F05～F07及产品整体仍`NOT_READY`。本段覆盖下文历史`F04-1首次放行、B未施工`的过时指针，不覆盖历史证据。

---

# 2026-10-10｜F03工作包V A独立验收PR25已合并；F04-1接口合同与隔离安全路由完整施工单正式放行（当前唯一最新）

- **F03-V A验收及标准合并完成**：B受检提交 `2ee8c0327b7e59792cf22e908b12d780494fa3a5` 与 [真实Actions 38027132087](https://github.com/suzhe868-arch/mb/actions/runs/38027132087) head SHA完全一致；**24/24独立真实非特权PostgreSQL16作业成功**（旧17+G3+P2+V2），V新增两个独立作业各7/7。A审查59条（45能力+14治理）与59条负断言、M94/G000014双物理封印、九文件白名单及原始schema/source/catalog；标准[PR25](https://github.com/suzhe868-arch/mb/pull/25)已合并，merge SHA `1a0f0d85eb6cc7d120d754fc82d1a4131f3b653e`。独立A报告：`07_重建工作区/F03工作包V_A主控独立验收PR25合并及阶段技术裁决_2026-10-10.md`。
- **A完成三个遗留能力的真实责任归属技术裁决**：内部批发价独立权限读取以及在正常Vehicle编辑下附带的内部价修改，由**F05车辆价格业务＋F04现时对象授权/安全路由**正式实现；4S账号管理由**F04 System Admin控制面**实现。V源覆盖矩阵原3项`F03_STILL_OPEN`作为历史审计保留，正式下游状态为`A_RESOLVED_TO_F04_F05_OPEN_DEPENDENCY`，**不是已实施**。未知vehicle→Team/4S商户归属、独立Vehicle/内部价权限/数据scope或合法对象状态一律保持硬拒；4S名邦内部价HARD DENY，4S不可互管。
- **A已签发下一完整工程包F04-1**：施工单`07_重建工作区/F04-1_A主控接口合同与安全路由启动完整施工单_2026-10-10.md`，分支`feat/f04-1-contract-safety-gate`；B须从执行时最新main建立，连续完成历史218接口的可追溯核账（缺证标SOURCE_GAP不得编造）、新现行route/DTO/权限及错误合同、CI-only真实PG16安全路由、F05～F07/H03/H04消费合同、B全包自验，最终**26/26独立PG16成功（冻结旧24+新2）且与B最终SHA一致**后交A。不准修改旧迁移/服务/产品Final、未经授权开放生产或自行合并。
- **NEXT_OWNER=B；NEXT_TASK=F04_1_CONTRACT_AND_SAFE_HTTP_CI_PACKAGE**。F03技术**仅已验收隔离合成安全范围**，F04/F05/F06/F07真实接口、C/H01高保真及三端UAT均未最终验收；`PRODUCT_BASELINE_STATUS=NOT_READY`。本段覆盖以下历史旧“V待B执行”快照，历史不删除。

---

# 2026-10-10｜F03 G/P双工作包A二轮正式验收、PR23/PR24合并；V全量核账与最终总回归工作包正式放行（当前最新）

- G包：B最终SHA 19af2955d81ac14d79e0c4e6adc661a3a1aabd8e，真实同SHA Actions38025357614 **20/20独立PG16全成功**（G1 16/G2 7/G3 4、旧N21/M31/L29/K29/J27/I27完整回归）。A-G-01已独立验证当前真实owner/responsible必须沿最后合法后继immutable receipt/audit链一致；计划员工治理最后COMMIT前再次重验，两个PG16会话竞争或源漂移真正全事务ROLLBACK。000014仅2个handover completed CHECK，旧94表608列435约束163索引2120项结构对象数保持，新真SHA 863538a8dd81e85c8f50bec2d18ad714f6c3d87abf3b10844a3c80421d54cdb1；原SOURCE/全catalog PASS。A标准PR23已合并，merge SHA 2073397070270aeda3056b75a21112e81763cc1a。
- P包：B最终SHA 97087f2aab4dcb7ad94cd5ea6cc4777b76900459，真实同SHA Actions38024572379 **19/19独立PG16全成功**（P1 10/P2 11、旧17全回归）。A-P-01已以真实对象级fail-closed方式修正：员工拥有CRM Team权限≠有任意可见Vehicle业务查询/导出权；旧M94没有可信vehicle→Team/4S所属关系时所有员工对象业务出口不返回字段、明确P_VEHICLE_SCOPE_UNPROVEN并交F04/F07；未冒称真实业务已开放。无DDL，原94表2120项完整SHA/SOURCE原字节不变。A标准PR24已合并，merge SHA 2c65bbfd04fbba5438160f8b0e8fe8274f15d940。
- A双包完整正式验收报告：07_重建工作区/F03双工作包G_P_A主控二轮独立验收PR23_PR24正式合并闭环_2026-10-10.md。**下一包V正式放行**：07_重建工作区/F03工作包V_A主控工程覆盖核账跨模块总回归与后续承接完整施工单_2026-10-10.md；分支feat/f03-package-v-coverage-final-gate，V1核账旧45权限+14治理的当前真实main完成/未做/硬DENY/正式F04～F07承接，V2两个真实隔离PG16跨模块与不同000013/000014 schema封印总回归，V3真实缺口/工程阶段候选和下游交接，总共**24/24独立PG16作业要求**（旧17+G3+P2+V2），B内部完成整个V包自审/回归/整改后一次性交A，**B不得自行合并或宣告F03全完成**。
- **NEXT_OWNER=B**，G/P技术本批签收不代表真实离职权限、正式车辆导出/会员查价、F03全模块或C/H01高保真已生产可用；PRODUCT_BASELINE=NOT_READY。

---

# 2026-10-10｜F03多任务包G/P首次A集中复核：两项定向整改、保持双包一次性交A（当前最新）

- G原分支 feat/f03-package-g-governance-closure，受检最终SHA 708fb889db8c473cc1cd92d38896aa1bbfdfb973，Actions38022820421 同SHA 20/20独立真实PG16成功，新G1 15/G2 7/G3 4及旧N21/M31/L29/K29/J27/I27等全部旧版回归成功；000014仅替换handover_batches/items两CHECK，新物理目录2120项数量不变，SHA863538a8dd81e85c8f50bec2d18ad714f6c3d87abf3b10844a3c80421d54cdb1。**A-G-01阻断**：G2计划停用/降权/调店只验证完成SG06批次历史及源员工无活跃职责，未再核业务对象当前owner/responsible确实符合真实最后合法后继receipt链，可能放过无审计直接漂移。
- P原分支 feat/f03-package-p-field-projection，受检SHA82fec31338040c020f147a1107bdbddc5364d916，Actions38020721875 同SHA 19/19独立PG16成功，新P1 10/P2 6和旧17作业全过，原M94 2120项零物理变化。**A-P-01阻断**：employee vehicle查询/导出只以crm.customer.view+当前员工请求Team作权限，未证明请求vehicle自身属于该业务对象范围/4S归属，缺来源还不应给business export。
- 两包正式统一整改：07_重建工作区/F03多任务包G_P_A主控首次独立审查与两项定向整改清单_2026-10-10.md。B留在G/P原分支各自包内自行一次修复、完整回归与逆向自审，再分别取得与最终SHA相同G20/20、P19/19独立真实PG16成功，**两个包都READY后统一交A集中验收**；两包均A_CHANGES_REQUESTED、未合并、V仍PREPLAN_NOT_RELEASED，NEXT_OWNER=B。
- F03-2整体、C/H01高保真及产品基线NOT_READY。

---

# 2026-10-10｜F03-2-2N A二轮正式验收PR22合并；F03多任务包G+P正式同批放行（最新）

- **2N已正式A签收**：B最终HEAD`5ae79377c5c09155ac1b04105e5a265a61ced20e`，最新同SHA[Actions38018758218](https://github.com/suzhe868-arch/mb/actions/runs/38018758218) **17/17独立真实PG16 job success**，N94 **21/21**含A-N-01新增7个跨batch/source/Team派生Priority真实性测试及事务漂移全回滚，旧M31/L29/K29/J27/I27及其余独立原版全成功。94表608列435约束163索引2120全catalog一项不变，无000014；真实N+M来源原始PG16字节、完整目录封印PASS。标准[PR22](https://github.com/suzhe868-arch/mb/pull/22)已merge，merge SHA`32419cff011b15c1e2f1f202d257f7b2c00cb30d`。A正式验收：`07_重建工作区/F03-2-2N_A主控二轮独立验收及PR22正式合并闭环_2026-10-10.md`。
- **已按用户同意启用多任务包连续执行机制**：A一次性签发工作包G`07_重建工作区/F03工作包G_A主控SG06真实收口与F03-2-3员工治理完整施工单_2026-10-10.md`，指定`feat/f03-package-g-governance-closure`，内含G1 SG06正式item/batch安全收口（仅A批准000014扩两旧CHECK completed且旧DDL保持不变）、G2计划调店/降权/停用、G3突发inactive/复职/旧会话撤权及最后接客/管理员保护，**20/20独立真实PG16 jobs**（新G三独立+旧17全独立）成功；工作包P`07_重建工作区/F03工作包P_A主控F03-3字段权限与安全投影完整施工单_2026-10-10.md`，指定`feat/f03-package-p-field-projection`，内含P1字段/等级价格权益投影、P2导出/历史/缓存撤权、P3对F04～F07正式字段合同交接，**19/19独立真实PG16 jobs**（新P两个+旧17全独立）成功且零DDL。两包不同分支、禁止未经合并的互相依赖/自行PR合并，B各包连续开发自审/整改直到双包READY，**一次性统一交A独立审查**，不需要每个小子项用户来回切换。
- 工作包V（F03旧45能力+14治理逐项核账、真正跨模块阶段总复审）继续**预规划未放行**，待G/P双方经A独立接受/合并再正式签发；不能把旧矩阵53个DEFER一律当F03新实施义务或已验收。任何不可证新业务规则/未授权DDL仍需A安全裁决。
- **NEXT_OWNER=B**，下一是`F03_PACKAGE_G_AND_P`双包完整施工。F03-2整体、C/H01高保真和V1产品基线`NOT_READY`；无正式生产员工状态、真实资金或API上线授权。

---

# 2026-10-10｜F03-2-2N B真实PG16 CI全绿，但A独立复核Priority跨批来源映射缺口（当前最新）

- B最终SHA`70fdae880cfc707a405d607378aa5ab172b432a0`，同SHA真实[CI38016127258](https://github.com/suzhe868-arch/mb/actions/runs/38016127258) **17/17独立PG16 job success**：新N14/14、旧M31/31、L29/29、K29/29、J/I27/27，其余旧H/G/F/E/D/C/B/A/F03-1各自独立成功；94表608列435约束163索引2120完整catalog项一项未改，N真实SOURCE、原字节和全目录校验PASS。仅11个新N模块/专用workflow文件，旧000001～000013及H/I/J/K/L/M服务均未修改。
- **A-N-01技术安全阻断**：新N`priority()`只验证当前trigger Demand负责人和任一最新可信Demand收据，**未证明当前Priority待交接item的原员工、所属batch和授权Team与对应Demand正式交接事实吻合**；代码引用旧handover_items上不存在的`scope_team_id`后自行回退当前receipt Team，等同未验Team来源。其它批次已经合法Demand交接可能被错误拿来证明当前批次的Priority也已承接，违反2N N03/N04/PDM-03逐项来源证明。原N14项未覆盖**跨batch pending Priority+仅旧batch Demand receipt**、错误source/Team负例。唯一A正式整改单：`07_重建工作区/F03-2-2N_A主控独立复核Priority派生跨批次来源证明定向整改单_2026-10-10.md`；B沿用原`feat/f03-handover-reconciliation-2n`，只修新N服务/合成数据/PG16测试/交接，最终同SHA17/17成功交A。其余已过门禁保持冻结。
- **A_CHANGES_REQUESTED / NOT_ACCEPTED / NOT_MERGED / NEXT_OWNER=B**；多任务包G/P/V已预排但继续`A_PREPLAN_NOT_RELEASED`，不得提前施工或修改既有2N授权。F03-2整体/C-H01/产品基线`NOT_READY`。

---

# 2026-10-10｜F03-2-2M A二轮正式验收通过PR21合并；F03-2-2N已签发（当前最新）

- **2M经A二轮独立验收并正式合并**：B最终SHA 556720eb8a80a5ff83fe0a02fc54ea44cf40476e，同SHA[CI 38010658030](https://github.com/suzhe868-arch/mb/actions/runs/38010658030)**16/16独立PG16成功，新M94 31/31**（含A-M-01新6项实际合法converted_to_transaction来源、五种伪released、prepared漂移、CAS后源码失真全rollback及双会话锁竞争），旧L29/K29/J27/I27全部原版本完整通过。旧93表2074项零改，新000013仅1张不可变Transaction收据表后94表/608列/435约束/163索引/2120完整目录项，仅增46，PG16全目录和SOURCE原始字节PASS。A审查22个白名单变更，标准[PR21](https://github.com/suzhe868-arch/mb/pull/21) merge SHA 71847176ccd2fd93a323fe274f0f144d4aea2712。正式验收报告：07_重建工作区/F03-2-2M_A主控二轮独立验收及PR21正式合并闭环_2026-10-10.md。
- **下一2N正式放行B**：SG06已有6个域H/I/J/K/L/M的受限CI单域不可变收据，Priority只能从trigger Demand当前合法责任派生。但数据库handover_items和batch现物理CHECK均**没有completed终态**，不能据单域已转派宣布实际整批完成/解除离职权限。因此A正式签发**全域收据安全只读对账与收口前置门禁**：07_重建工作区/F03-2-2N_A主控SG06全域收据对账与正式收口前置门禁只读施工单_2026-10-10.md；分支 feat/f03-handover-reconciliation-2n，只能新增新N服务/独立CI、不批准旧DDL或生产更新，**17/17个独立真实PG16 job全成功**（包含旧M31/L29/K29/J27/I27原版完整回归），只读输出绝不得使handover_batches/items completed或员工禁用。
- **NEXT_OWNER=B**。完整F03-2/正式SG06生产交接/C-H01高保真仍未最终验收，PRODUCT_BASELINE=NOT_READY。

---

# 2026-10-10｜F03-2-2M B自验全绿，A发现来源Lock真实转换缺证，正式定向整改（当前最新）

- B分支`feat/f03-transaction-responsible-handover-2m`最终受检SHA`608779547db3f6ffce76f8c7ee030e4f30242eeb`、同SHA真实[Actions38008698898](https://github.com/suzhe868-arch/mb/actions/runs/38008698898)**16/16独立PG16作业success**、M25/25、旧L29/K29/J27/I27各自在冻结旧库完整成功；H/I/J/K/L/M六域30向Key冲突及并发通过。旧93表2074物理catalog定义零改，新增000013仅一张Transaction收据表后94表608列435约束163索引2120目录定义(+46)，PG16 SOURCE原始字节及完整catalog PASS。
- **A-M-01唯一阻断**：新M`service.mjs`仅凭source Lock`lock_status='released'`加customer/vehicle/cycle相同就承认Transaction来源合法，完全未校验PDM-19正式必须存在的`converted_to_transaction`类真实历史结束原因；合成fixture所有source Lock都为`released`但没有`end_reason`（NULL），因此M25全绿没有证明合法来源。正式A完整整改单：`07_重建工作区/F03-2-2M_A主控独立复核来源Lock合法转交易证据定向整改单_2026-10-10.md`。B在原分支只补新M source转换真实性Guard及prepare/commit/precommit时序实测、正确合成fixture和源审计证明，最终同SHA16/16全成功后交A。冻结旧000001～000013及所有旧CI/业务服务不改。
- **A_CHANGES_REQUESTED / NOT_ACCEPTED / NOT_MERGED；NEXT_OWNER=B**，暂不进入2N；完整F03-2、C/H01和产品基线`NOT_READY`。

---

# 2026-10-10｜F03-2-2L A二轮正式验收PR20已合并，下一F03-2-2M正式施工单已签发（当前最新）

- **2L已A正式签收并合并**：B最终SHA 408e7a581264c43220ce3cc326a73ee610c051a5、同SHA [真实CI38005762988](https://github.com/suzhe868-arch/mb/actions/runs/38005762988) **15/15独立真实PG16作业success**；新L29/29含8项到期事务竞态与全回滚测试，旧K29/29、J27/27、I27/27及其它全部旧模块独立成功。旧92表2028完整目录不变，新000012仅一张Lock收据表后93表596列420约束159索引2074项(+46)，结构SHA 9ab7221f9a0f5f81c0af37441d4cd5b824e2ac7322f8d40f952ba2cecea0e2f9，真实SOURCE字节和全catalog校验PASS。A-L-01用PG数据库即时钟CAS及正式提交前throw整事务ROLLBACK完全闭环；旧SQL/旧CI/业务Final不改。标准 [PR20](https://github.com/suzhe868-arch/mb/pull/20) merge SHA 9ed6db2a6aeefb382298460004768edd11df20b6。正式A验收：07_重建工作区/F03-2-2L_A主控二轮独立验收及PR20正式合并闭环_2026-10-10.md。
- **下一批2M已A技术裁决放行**：依据PDM-19 Transaction独立负责人及真实资金/交易终态不可变，仅CI隔离PG16合成Transaction current responsible单域CAS+append-only receipt；H/I/J/K/L/M六域RequestKey 30方向必须双向保护，旧000001～000012完整冻结，新000013最多一张Transaction收据表。仅允许旧H/I/J/K/L service commit/retry跨域Key与结构封印最小守卫。完整施工单07_重建工作区/F03-2-2M_A主控SG06_Transaction交易负责人单域移交完整施工单_2026-10-10.md，B指定 feat/f03-transaction-responsible-handover-2m，最终**16/16个独立PG16作业成功**含旧L29/K29/J27/I27原版全测试后交A，不能自行合并。
- NEXT_OWNER=B。F03-2整体、C/H01高保真、真实SG06离职交接及产品基线均NOT_READY。

---

# 2026-10-10｜F03-2-2L B自验CI全绿，A独立复核发现锁车到期临界事务阻断（当前最新）

- B原分支`feat/f03-lock-responsible-handover-2l`，最终受检HEAD `244b68a2e168624e2a4f65aa17fc1cc587d54fcf`，同SHA真实[CI38003745347](https://github.com/suzhe868-arch/mb/actions/runs/38003745347)**15/15独立PG16 job全成功**：新L21/21、旧K29/29、J27/27、I27/27及其余全部旧模块独立回归成功。旧92表2028物理目录不变，新增000012唯一一张合成Lock收据表后93表/596列/420约束/159索引/2074完整键(+46)，新结构SHA`9ab7221f9a0f5f81c0af37441d4cd5b824e2ac7322f8d40f952ba2cecea0e2f9`，完整catalog/source原字节校验PASS。H/I/J/K/L跨域Key真实20个方向与5会话并发测试通过。保留B已完成合格项。
- **A-L-01阻断**：`service.mjs`的`facts()`仅在早期第59行以`new Date()`检`expires_at`，真正锁车负责人CAS第118行只校验`lock_status='active'`/旧employee，**没有DB当前时钟有效期谓词，也没有最终COMMIT前过期的原子回滚守卫**；Lock可在第一次检查与CAS或后续事务提交间自然到期而仍成功转派。旧L21测试无实际中途到期的PG16时序用例，违反L03/L04/L10门禁。正式唯一整改单`07_重建工作区/F03-2-2L_A主控独立复核锁车到期事务竞态定向整改单_2026-10-10.md`，要求B只改新L服务/测试（旧迁移、H/I/J/K均不可变），增加PG16真正`before_update`和`after_receipt/before_commit`跨有效期时序与整事务回滚，最终同SHA15/15全成功并更新B交接。
- **A_CHANGES_REQUESTED / NOT_ACCEPTED / NOT_MERGED / NEXT_OWNER=B**。不能先验收/合并2L或启动2M。产品F03-2整体/C-H01仍`NOT_READY`。此段覆盖下文历史已放行2L的旧状态，历史保留。

---

# 2026-10-10｜F03-2-2K A独立验收通过标准PR19合并，F03-2-2L正式施工单已放行（当前最新）

- **2K已正式签收**：B最终SHA `8cc1f7b6e7df5ecdb57d6e4d2b8be7e3627bde7b`、同SHA真实[CI37999317037](https://github.com/suzhe868-arch/mb/actions/runs/37999317037) **14/14独立PG16成功，K92 29/29、J91 27/27、I90 27/27**，旧H89、G/F/E88、D86、C84、B82双、A81、F03-1认证/HTTPS80全独立通过；H/I/J/K四Domain相同Key全向/四会话并发与Waitlist交接不可变收据已受限验证。旧91表/1982目录项零更改，新000011仅新增一张Waitlist不可变收据表至92表/584列/405约束/155索引/2028完整目录项（+46），新结构SHA `6b6932e4855074ed63ec0ceda89b568e1b4b1f62d111c759f9c7a77a841a3c76`，SOURCE原始字节与catalog三域校验PASS。标准[PR19](https://github.com/suzhe868-arch/mb/pull/19) merge SHA `3fdb965733fce0750bc00a4a6b04f12e338fda5e`。完整A验收报告`07_重建工作区/F03-2-2K_A主控独立验收及PR19正式合并闭环_2026-10-10.md`。
- **下一批2L已正式技术裁决并放行B**：根据PDM-18/03/19，只限新隔离PG16的**正式Lock当前负责人单域受控移交**、锁车有效期/真实Deposit独立守卫、原价格/LockRequest/Waitlist/Transaction不反写、H/I/J/K/L五Domain全局Key双向阻重。旧000001～000011及旧CI/已签规则全部冻结；新`000012`最多一张Lock逐项不可变收据表，必要时旧H/I/J/K只限commit/retry跨域Key守卫新表检查。正式施工单`07_重建工作区/F03-2-2L_A主控SG06_Lock正式锁车负责人单域移交完整施工单_2026-10-10.md`。B指定分支`feat/f03-lock-responsible-handover-2l`，**新旧共15/15独立PG16 CI成功**（K29/J27/I27均完整回归）后交A，B不得自行合并或进入下一批。
- **NEXT_OWNER=B**；C/H01高保真、完整F03-2与产品基线继续`NOT_READY`，不宣称生产上线。

---

# 2026-10-10｜F03-2-2J A二轮正式验收通过PR18合并，下一F03-2-2K已放行（当前最新）

- **F03-2-2J A正式签收并合并**：B最终SHA `8abd2849877ff7884ea3ff2c27cde59f14b70ce7`、同SHA[真实PG16 CI `37996676662`](https://github.com/suzhe868-arch/mb/actions/runs/37996676662)**13/13独立PG16 job成功**，旧I90真实27/27、新J91真实27/27、H89/G/F/E88/D86/C84/B82双/A81/F03-1认证与HTTPS80全部独立成功，前轮A-J-01缺失I90完整回归已关闭。旧90表1936完整目录对象未改，新000010只添1张Consultation不可变收据表至91表/572列/390约束/151索引/1982目录对象(+46)，SOURCE全目录及原始字节校验PASS；H/I旧服务仅为A已授权的J跨域Key守卫最小补强。标准[PR #18](https://github.com/suzhe868-arch/mb/pull/18)合并SHA `367ff5d16fe913f5e6b2002abd559522f4cc4d26`。正式验收：`07_重建工作区/F03-2-2J_A主控二轮独立验收及PR18正式合并闭环_2026-10-10.md`。
- **F03-2-2K A技术裁决并正式放行B**：依据PDM-18 Waitlist既有responsible固化、inactive正式移交、`ended_at`/active Lock/锁车申请关系与候补顺序不反写，仅在隔离真实PG16合成Waitlist单域CAS、不可变收据、四域H/I/J/K全局Key唯一及旧完整回归；允许本批000011最多一张新收据表及H/I/J旧服务中仅跨域Key最小Guard兼容补强，旧迁移/旧CI完全冻结。完整施工单`07_重建工作区/F03-2-2K_A主控SG06_Waitlist候补负责人单域移交完整施工单_2026-10-10.md`。B分支`feat/f03-waitlist-responsible-handover-2k`，**必须新旧共14个独立PG16 CI全绿**（含旧J91/I90各完整27例），最终HEAD同SHA才交A，不得B自行合并。
- **NEXT_OWNER=B**，C/H01及完整F03-2/产品基线仍`NOT_READY`。此段覆盖后文过时的J旧I90待整改历史记录，历史不删除。

---

# 2026-10-10｜F03-2-2J B自验完成但A发现旧I90独立PG16回归缺失（当前最新）

- B分支`feat/f03-consultation-assignee-handover-2j`最终受检SHA`b2e296d8b49b69a40e3b6ea053eec41386b6ffa5`，同SHA[真实CI 37994434333](https://github.com/suzhe868-arch/mb/actions/runs/37994434333)现有12/12独立job success、新J91真实27/27测试成功，旧90表catalog不变、新000010仅新增一张收据表至91表/572列/390约束/151索引/1982目录定义。A独立审查确认J咨询转派/SLA保持与三域Key防重本批测试已通过。
- **A-J-01明确阻断**：正式J08要求独立旧I90表完整PG16回归，但J工作流/最新job列表完全**缺少旧I90的独立作业**；仅新J job应用I迁移与部分业务测试不算旧I完整回归。因此实际要求**13/13独立job**。唯一正式整改单：`07_重建工作区/F03-2-2J_A主控独立复核旧I90表回归缺失定向整改单_2026-10-10.md`。B可仅改本批新工作流新增旧I90独立PG16完整27例与证据，不用重做旧工程；最后必须取得同SHA 13/13全成功且J/I各27/27。
- **A_CHANGES_REQUESTED / NOT_ACCEPTED / NOT_MERGED，NEXT_OWNER=B**，保留现有B分支，修复后交A复验，不提前2K。不修改PDM Final、旧数据库迁移/CI，F03-2整体/C-H01仍未验收，产品基线`NOT_READY`。

---

# 2026-10-10｜F03-2-2I A二轮独立复验通过、PR17正式合并；F03-2-2J已正式放行（当前最新）

- **2I已正式闭环**：B最终SHA`c92ff2a07b06b94dd7a8c53a9b888248856f61bd`、同SHA[真实PG16 CI37991845213](https://github.com/suzhe868-arch/mb/actions/runs/37991845213)**12/12独立作业成功、I27/27集成测试通过**；A-I-01 H/I双向请求Key真实顺序与并发拒绝、A-I-02 Demand合法二次交接不可变收据及历史链均已验收。旧H只依A正式整改单限定修改单个服务跨域Key守卫，其余旧工程/迁移/CI未改。旧89表/1890目录键零改、新000009一张Demand收据表后90表/560列/375约束/147索引/1936目录键新增46，PG16原始归档和物理指纹跨run PASS。A标准[PR17](https://github.com/suzhe868-arch/mb/pull/17)已合并，merge SHA`9bc5e17be2153d4646816c808d6af77409513308`。正式A签字：`07_重建工作区/F03-2-2I_A主控二轮独立验收及PR17正式合并闭环_2026-10-10.md`。
- **2J已A技术裁决并放行B**：依据PDM-15 Consultation四状态、正式咨询负责人转派/15分钟首响SLA，PDM-14 Recommendation不反写及PDM-03业务与Customer owner分层，B在独立隔离PG16真实测试Consultation assignee单域CAS/不可变交接收据、首响deadline不重置、历史连转可审计；H/I/J三域请求Key必须三向全局保护。仅允许新的`000010`最多一张合成收据表与两个已验收H/I服务入口的最小跨域守卫兼容补强；旧迁移、旧CI、旧业务规则绝不修改。正式施工单`07_重建工作区/F03-2-2J_A主控SG06_Consultation咨询负责人单域移交与SLA保留完整施工单_2026-10-10.md`，B指定分支`feat/f03-consultation-assignee-handover-2j`，完整实施+PG16+证据+最新同SHA全成功后交A，不得自行合并main。
- **NEXT_OWNER=B**；C/H01高保真、F03-2整体和产品基线仍`NOT_READY`。本段覆盖下文旧2I待整改历史状态，历史记录不删除。

---

# 2026-10-10｜F03-2-2I B自验全绿，但A发现2项跨域幂等/不可变历史阻断（当前最新）

- B分支`feat/f03-demand-responsible-handover-2i`真实HEAD`9445a68c00a809b9f69aba7542af3b403f9b7b1c`，同SHA[真实CI 37989284356](https://github.com/suzhe868-arch/mb/actions/runs/37989284356)**12/12独立PG16作业success、新I 21/21测试通过**；仅18个批准新文件、旧main零修改。旧000001～000008 89表1890完整目录对象零变更；候选000009一张Demand收据表后90表/560列/375约束/147索引、1936对象新增46目录键，真实原始结构跨运行校验成功。**B自验通过不等于A验收。**
- A独立审查H已合并服务和I新服务：①**跨域RequestKey仅I查询H，H反向不检查I**，可先Demand成功再用同Key做Customer Owner第二次合法提交，且所谓跨域测试只证明H表为空；②I收据真伪校验硬要求Demand现任负责人等于历史收据to，合法二次改派后早期不可变收据无法再读。完整定向整改单：`07_重建工作区/F03-2-2I_A主控独立复核与跨域幂等历史收据整改清单_2026-10-10.md`，附A限定唯一H旧服务守卫补强技术例外、双向真实PG16及历史连续移交正负例。
- **A_CHANGES_REQUESTED / NOT_ACCEPTED / NOT_MERGED；NEXT_OWNER=B。** B在原2I分支一次性完成两项修复、旧H89表和I90表CI完全回归、原始schema/目录证据及最新同SHA12/12全绿后`READY_FOR_A_REVIEW`交A；**禁止自行合并及启动2J**。C/H01和F03-2整体仍未验收，产品基线`NOT_READY`。

---

# 2026-10-10｜F03-2-2H三项整改A二轮复验通过并PR16合并，F03-2-2I已正式放行（当前最新）

- **F03-2-2H A正式签收**：B最终SHA `f60d15aaa8fcc4c6fb955c2eaf394fea5895d4df`、同SHA真实[PG16 CI `37985367539`](https://github.com/suzhe868-arch/mb/actions/runs/37985367539) **11/11独立PG16作业成功、本批19/19测试通过**。前轮A-H-01跨item/batch请求Key唯一冲突、A-H-02暂停接客经理/店长合法交接、A-H-03精确跨店Team scope全部独立复验闭环。18个授权新增文件，旧文件无修改；原88表/1840目录对象保留，新000008仅新增一张收据表至89表/548列/360约束/143索引/1890目录对象(增量50)。原始结构来源`37985015633`与最终新run目录及来源字节校验PASS。标准[PR #16](https://github.com/suzhe868-arch/mb/pull/16) `mergeable=clean`后合并成功，合并提交 `acdc65e140c341916160bd02dd92eb93448ade06`。正式验收报告：`07_重建工作区/F03-2-2H_A主控二轮独立验收及PR16正式合并闭环_2026-10-10.md`。
- **下一批F03-2-2I（A已技术裁决签发）**：仅在新隔离PG16合成环境演练Demand当前responsible单域权限、CAS、逐项不可变历史/收据与Priority trigger Demand派生责任/TTL保持；其它Domain不得改写，不得把单域收据冒充整批SG06 completed。旧000001～000008封印不动，只有本批新目录和专用CI，允许在可证明安全边界下提出000009最多一张新收据表。完整施工单：`07_重建工作区/F03-2-2I_A主控SG06_Demand负责人单域移交与Priority派生责任完整施工单_2026-10-10.md`；B指定分支`feat/f03-demand-responsible-handover-2i`，全部自测/归档并取得最新同SHA成功CI后交A，不能自行合并。
- **NEXT_OWNER=B**。C/H01高保真仍未独立通过；完整F03-2、真实生产交接、其它七域适配及SG07整体仍未完成，`PRODUCT_BASELINE=NOT_READY`。本段覆盖下文过时的2H暂缓验收台账，旧历史保留。

---

# 2026-10-10｜F03-2-2H B交付A独立复核提出3项阻断整改（当前最新）

- B固定受检SHA `88c762eb88e8cdbb7d1bc9850fa29d39f47bde50`、同SHA [PG16 CI37982757484](https://github.com/suzhe868-arch/mb/actions/runs/37982757484) **11/11独立作业全success、本批14/14测试全通过**，仅18个授权新增文件，旧main零修改，旧88表结构封印不变；000008提议新增唯一一张收据表并生成89表/548列/359约束/142索引与完整目录。B已`READY_FOR_A_REVIEW`，但**A尚不验收也未合并**。
- A独立审查发现三项施工单/PDM边界未闭环：①**相同请求Key可以跨item/batch/Customer生成第二个收据与Owner改写**，不满足A批准的`COLLISION_DENY`；②代码要求操作经理/店长处于`receiving`，把暂停接客误当成撤销其合法管理员工/Customer交接权；③要求经理和双方业务员工当前主门店一律等于Team店，未正确覆盖PDM-02批准的显式跨门店权限/data scope。完整一次性整改单：`07_重建工作区/F03-2-2H_A主控独立验收完整定向整改单_2026-10-10.md`。
- **NEXT_OWNER=B**。B在**原**`feat/f03-customer-owner-handover-2h`分支一次性整改A-H-01～03，重新生成000008物理证据和最新同SHA11作业PG16成功CI，更新中文交接，再交A独立复验。**未经A通过不得PR合并或开启下一批**。C/H01高保真与F03-2整体仍未验收，`PRODUCT_BASELINE=NOT_READY`。

---

# 2026-10-10｜F03-2-2G整改四项A独立复验通过、标准PR15合并、F03-2-2H已正式放行（当前最新）

- **本批2G闭环通过**：B固定SHA `1069f26b87f772f28d9ed1bfb19c983a4e197729`、同SHA [PG16 CI `37978981732`](https://github.com/suzhe868-arch/mb/actions/runs/37978981732) **10/10个独立作业success、本批18/18真实测试**；A复核前轮A-G-01～04（离职inactive源仍合法只读、PG16行锁和防幻读、跨批账本缺项重复、跨Team最小披露）全部闭环。14个新增文件、旧main无修改；88表/536列/344约束/138索引，1840完整catalog对象零变动，跨运行原始字节校验成功。标准[PR #15](https://github.com/suzhe868-arch/mb/pull/15)成功合并SHA `b405e83cfadf9f0f6d89ada32ae2f45b5b20a6bd`。A正式验收：`07_重建工作区/F03-2-2G_A主控二轮独立验收及PR15正式合并闭环_2026-10-10.md`。
- **正式放行下一F03-2-2H**：严格只在新隔离PG16合成数据中演练SG06 **Customer唯一current owner的单域受控敏感写、独立权限/范围、owner历史与幂等不可变收据**；不得借`employee.manage`越权，不得迁移其它七域负责人或把单域收据冒充整个batch completed；允许专用`000008`最多一张收据表的隔离增量技术提案，旧000001～000007和旧88表Guard全部保持不变。正式施工单：`07_重建工作区/F03-2-2H_A主控SG06唯一CustomerOwner受限真实逐项移交及事务收据施工单_2026-10-10.md`；指定B分支`feat/f03-customer-owner-handover-2h`，从最新main创建，全部测试/归档/同SHA全绿后`READY_FOR_A_REVIEW`交A，无需逐项请用户点击。
- **NEXT_OWNER=B**。C/H01高保真仍未独立通过；F03-2整体、真实各域逐项移交及生产均未验收，`PRODUCT_BASELINE=NOT_READY`。本段覆盖下文历史过期2G整改未完成状态，旧条目不删除。

---

# 2026-10-10｜F03-2-2G B已交审、A独立验收提出四项定向整改（当前最新）

- B分支 `feat/f03-handover-preflight-2g` 实际最新HEAD `f9f42c4fde6832522b770403029a4ec2ddc11f7f`；同SHA真实 [PG16 CI37976033469](https://github.com/suzhe868-arch/mb/actions/runs/37976033469) **10/10独立作业成功**、本批12/12测试全绿；14个文件均为授权新增，旧main无修改/删除、真实88表/536列/344约束/138索引的结构SHA不变。B交接达到`READY_FOR_A_REVIEW`，但**CI绿不代表A验收通过**。
- A独立检查`service.mjs`、交接、测试及旧PDM Final后判定 `A_CHANGES_REQUESTED`：①已离职/inactive源员工会被`batch()`硬拒，无法清点突发失效交接；②模拟提交前未锁Customer Owner及七域责任行，G05仅二次SELECT；③缺失账本item被混报PENDING且同目标跨批重复未辨识；④仅验证源员工Team scope却回传关联客户其他团队负责域明细。全部整改与新增测试在 `07_重建工作区/F03-2-2G_A主控独立复核一次性整改清单_2026-10-10.md`，不改变Final、旧迁移或准许业务写。
- 本轮**无A验收、无PR合并**。**NEXT_OWNER=B**，继续原分支一次性完成A-G-01～04全部整改、最新同SHA 10独立PG16成功CI、归档与完整中文交接后交A；无需用户每步同意。C/H01仍未最终验收，完整F03-2和产品基线`NOT_READY`。

---

# 2026-10-10｜A验收F03-2-2F并正式合并PR14，已放行F03-2-2G只读交接预检（当前最新）

- **F03-2-2F全部闭环**：B验收SHA `703d96a492a62870dbf9e70e13a808b981802bc4`，同SHA [真实PG16 CI 37972431347](https://github.com/suzhe868-arch/mb/actions/runs/37972431347) **9/9独立作业成功**，本批10/10；原main全文件未改，仅14个批准新增文件。原始1840个数据库目录对象零变更，88表/536列/344约束/138索引，SHA `96328994b19e1fef7261ae41bd890575bd196210e85baec685d0192676aff0dd`，源CI37972106107与末次run结构原文跨运行核验成功。A独立审查后标准[PR #14](https://github.com/suzhe868-arch/mb/pull/14)合并SHA `25fd4634e76915d9c5a6409ff753b4c4b7432b94`。报告：`07_重建工作区/F03-2-2F_A主控独立验收及PR14正式合并闭环_2026-10-10.md`。
- **A已正式准备并限定放行下一批F03-2-2G**：只在全新隔离PG16、沿用88表原结构，完成SG06 Customer Owner及Demand/Priority/Consultation/Waitlist/Lock/Transaction活跃承责映射的真实**只读预检**、合法经理/接替人/Team/current权限/跨域缺口证明；**不新增DDL、不执行Owner/任何业务负责人变更、不写completed、不放行调店或降权**。完整施工单：`07_重建工作区/F03-2-2G_A主控SG06客户与活跃业务承接预检完整施工单_2026-10-10.md`。B执行分支`feat/f03-handover-preflight-2g`，完成全量代码、真实并发/失败测试、旧多版回归、原始PG16零变更证据和最新同SHA成功CI后`READY_FOR_A_REVIEW`交A，不需用户反复确认。
- **当前唯一工程下一责任人：B**；C/H01仍未最终验收，完整F03-2尚未验收，`PRODUCT_BASELINE=NOT_READY`。最新指针：`F03_2_2F_ACCEPTED_MERGED_PR14_F03_2_2G_A_RELEASED_NEXT_OWNER_B_H01_VISUAL_PENDING`，下文旧2F未施工仅为历史记录。

---

# 2026-10-10｜F03-2-2E已验收并正式合并，A已放行下一受限权限治理批（当前最新）

- **上一工程批F03-2-2E完整闭环**：B最终SHA `86e838fa1f66f44827dfb399dbaf1887a9934283`、同SHA [真实CI 37968929785](https://github.com/suzhe868-arch/mb/actions/runs/37968929785) 八独立PG16作业全部success，本批88表pending-only ledger 11/11，旧86/84/82/81/80表冻结回归均通过。A复核原main1248文件完整未动、仅17个批准新增文件，正常[PR #13](https://github.com/suzhe868-arch/mb/pull/13) merge SHA `59fdb3623c1d9d2845e7bed9dd13c1b6ef0b41bf`。结构000007仅增加两表、88表/536列/344约束/138索引。A正式签发：`07_重建工作区/F03-2-2E_A主控独立验收及PR13正式合并闭环_2026-10-10.md`。
- **A已完整审查并放行下一批F03-2-2F**：SG04中严格限定`employee.manage`个人allow/deny/revoke及现有显式Team capability scope可信治理，仅在全新隔离PG16中运行、**无新增DDL**、不改旧权限/结构/生产。正式全量施工单：`07_重建工作区/F03-2-2F_A主控SG04员工个人权限与Team范围受限治理施工单_2026-10-10.md`。不允许把该能力扩成经理默认高权、正式业务写、Customer owner交接或员工调店降权。
- **下一唯一工程责任人：B**。B从执行时最新main创建`feat/f03-manager-team-governance-2f`，按现行三窗口连续执行规范一次完成全部实现、同SHA真实CI、并发/故障回滚、旧各版本独立PG16回归、原始结构零变更证据与完整B交接，最终`READY_FOR_A_REVIEW`交A；A独立验收合格后标准PR合并，不再逐项问用户。
- C/H01仍独立等待高保真视觉最终审查。F03-2完整治理/SG06各域业务交接/SG07/SG08和产品基线尚未通过；`PRODUCT_BASELINE=NOT_READY`。**2F是A放行但B未施工，不得报告2F已验收。**
- 最新唯一指针：`F03_2_2E_ACCEPTED_MERGED_PR13_F03_2_2F_A_RELEASED_NEXT_OWNER_B_H01_VISUAL_PENDING`。下文曾有的2E待施工等属于旧阶段历史。

---

# 2026-10-10｜F03-2-2D已验收并合并，A已放行SG06账本下一工程批（当前最新）

- **F03-2-2D全链路闭环**：A独立复核B最终HEAD `1f4578f4d9604e426c46f442e6e658402ad70b85`，同SHA [真实CI37964554999](https://github.com/suzhe868-arch/mb/actions/runs/37964554999) 七个相互独立PG16作业全部success；SG02 Team Scope真实9/9，旧SG03 11/11、SG05 10/10与bootstrap1/1、2A模板9/9、原F03-1认证11/11及HTTPS4/4。正式[PR #12](https://github.com/suzhe868-arch/mb/pull/12)正常merge提交 `e53a4faa0228afb9ec18372f32125ccd3a4befcf`；原main1229个文件全部未改，仅17新增授权范围文件。A签发报告：`07_重建工作区/F03-2-2D_A主控独立验收与PR12合并闭环_2026-10-10.md`。
- **A已完成下一工程批全部技术准备并正式限定放行**：`F03-2-2E SG06交接批次/明细可信账本、原子失败保留及逐项幂等`，完整施工单`07_重建工作区/F03-2-2E_A主控SG06交接账本与逐项幂等施工单_2026-10-10.md`。只允许一次性隔离PG16新迁移`000007`两表及技术账本内部动作；**不得声称账本即真实客户/业务交接成功**，不改Customer owner/业务负责人、调店/降权及生产。
- **下一唯一工程责任人：B**。B从执行时最新main新建`feat/f03-handover-ledger-2e`，读取本main/新版A/B/C连续协作规范与施工单，一次完成全部代码、独立真实PG16并发/幂等/失败回滚、所有旧版本独立回归、同SHA成功CI、原始schema-only/结构指纹证据与完整中文B交接，达`READY_FOR_A_REVIEW`直接交A。无需用户逐项点击，B不得自行合并main。
- **界限**：F03-2整体未验收，SG04/完整SG06域移交/SG07/08及正式PC/生产均待后续严格门禁；C/H01视觉仍单独待审，`PRODUCT_BASELINE=NOT_READY`。2E仅A已放行，B尚未施工、没有可声明的2E CI成功。
- 当前主控指针：`F03_2_2D_ACCEPTED_MERGED_PR12_F03_2_2E_A_RELEASED_NEXT_OWNER_B_H01_VISUAL_PENDING`。下文旧阶段2D待B或其它阻断仅为历史快照，不再代表当前下一步。

---

# 2026-10-10｜F03-2-2C 正式验收合并，A已放行下一SG02团队范围工程（当前最新）

- F03-2-2C 已完成全部B工程、A独立审核和标准[PR #11](https://github.com/suzhe868-arch/mb/pull/11)合并。工程B SHA `d7eb69e1fd2a8c53ef75aa250f5a01e5aa645dd4`，同SHA真实[CI37959483511](https://github.com/suzhe868-arch/mb/actions/runs/37959483511)六个独立PG16作业全部success（本批84表接客11/11、旧82表管理员10/10与bootstrap1/1、旧81表模板9/9、旧80表认证11/11与HTTPS4/4），标准merge SHA `955a6bb8da6213e13a6249709fb11db65841a3bc`。旧main1210个文件逐blob不变，只新增17授权文件。A独立验收报告：`07_重建工作区/F03-2-2C_A主控独立验收与PR11正式合并闭环_2026-10-10.md`。
- **A已继续完成下一批技术裁决、完整施工单和限定工程放行**：F03-2-2D｜SG02显式名邦团队及Team Scope可信成员范围证明，现行施工单：`07_重建工作区/F03-2-2D_A主控SG02团队关系与可信范围完整工程施工单_2026-10-10.md`。仅允许隔离CI新追加`000006`建议两表、显式组织数据/团队成员及内部权限范围事实，不赋予经理默认权、无正式员工管理API、无Customer Owner/交接/生产业务、不得修改旧迁移。
- **下一唯一工程负责人B**：在最新main新建`feat/f03-team-scope-2d`，按A/B/C连续执行规则一次完成真实PG16新增迁移/可信团队成员关系、严格capability-specific team scope、并发/原子审计/负例、冻结80/81/82/84回归、原始结构证据和同SHA成功CI，自验`READY_FOR_A_REVIEW`后交A；不得每小步向用户要确认，也不得自行合并main。
- C/H01仍待独立高保真视觉复核；完整F03-2尚未签收，`PRODUCT_BASELINE=NOT_READY`。F03-2-2D仅A已放行、**B尚未施工**，不能当作已实施或CI通过。
- 当前指针：`F03_2_2C_ACCEPTED_MERGED_PR11_F03_2_2D_A_RELEASED_NEXT_OWNER_B_H01_VISUAL_PENDING`。下文旧“2C待执行、2B待批准”等仅为历史记录。

---

# 2026-10-10｜F03-2-2B 已全部验收合并；A已放行F03-2-2C，下一窗口B（当前最新）

- **F03-2-2B完全闭环**：A独立核验B固定SHA`448869df7258a868292601791d8460c346414dd3`、同SHA [CI37955103517](https://github.com/suzhe868-arch/mb/actions/runs/37955103517) 五个一次性PG16作业全部success；通过 [PR #10](https://github.com/suzhe868-arch/mb/pull/10) 标准merge正式合并main，merge SHA`bd31e81a16a9fe219e678f1f01020965deae320b`，原main 1189个文件完全未动，仅新增19个B实物文件。完整A验收与证据：`07_重建工作区/F03-2-2B_A主控独立验收及PR10合并闭环_2026-10-10.md`。
- **A已一次完成下一工程批次技术审查、依赖裁定及完整施工单**：`F03-2-2C SG03接客资格与最后合格接客池并发保护`，限定新一次性PG16/受限内部操作/精确新增`000005`候选、无正式自然注册Owner或生产业务入口，所有风险边界和真正测试门禁写于`07_重建工作区/F03-2-2C_A主控接客资格与最后接客池完整施工单_2026-10-10.md`。施工单已正式放行，B不得自行扩大范围。
- **当前唯一工程下一负责人：B**。B从执行时最新main新建`feat/f03-receiving-pool-2c`，按现行`07_重建工作区/A_B_C三窗口协作与验收规范.md`一次完成全部实施、真实PG16并发/失败回滚、旧80/81/82各版本回归、同SHA成功CI、原始结构证据归档及自验，最终`READY_FOR_A_REVIEW`交A；无需每个子步骤向用户申请确认。A随后独立验收，通过后标准PR合并。
- C/H01设计仍独立待视觉复审，不能因B工程成功自动认定H01通过；完整F03-2仍未验收，`PRODUCT_BASELINE=NOT_READY`。**2C施工尚未开始/CI尚未运行**，不冒充完成。
- 当前主控指针：`F03_2_2B_ACCEPTED_MERGED_PR10_F03_2_2C_A_RELEASED_NEXT_OWNER_B_H01_VISUAL_PENDING`。下文2B待施工、PR10未合并等仅为历史快照。

---

# 2026-10-09｜A完成下一批准备，现由B直接执行（当前最新指针）

- **用户已修改A/B/C全项目协作流程**：`07_重建工作区/A_B_C三窗口协作与验收规范.md`现行版生效。A、B、C各窗口收到目标后**在本窗口完整闭环**（审查/工作单/施工/测试/整改/实证/交接），不再每一步向用户申请“确认”。新批已在当前Final与隔离技术工程范围内，由A完成必要裁决及技术放行；A验收通过后直接按标准PR合并并同步main，无二次审批。只有实质产品冲突、关键视觉未确定、真实数据/外部连接/生产等高风险事项集中请用户决策。
- **F03-2-2A全流程已完成**：已验收合并 [PR #9](https://github.com/suzhe868-arch/mb/pull/9)，原B提交`da8a17ec5ce7e004ae158f3d3165469650c344c5`、同SHA成功CI37948076366、合并提交`6cb9cc0768cb3b3f6644b457a64b715e3828fc9a`，A完成主控状态闭环`0e41568241bd9c1d451e19bec85c80d92ce94e82`。历史PR工具阻断已解除。
- **当前唯一工程下一责任人：B**。A对`F03-2-2B｜SG05 System Admin最后active/最后有效登录保护 + 一次性bootstrap claim`已完成全部技术依赖裁决、完整工作单、测试/并发/版本边界和正式限定放行。完整施工单：`07_重建工作区/F03-2-2B_A主控技术裁决与完整工程施工单_2026-10-09.md`。B应从执行时最新main新建`feat/f03-admin-population-2b`，在独立一次性PG16完成新增`000004`可信守卫、真实并发/故障回滚、旧80/81表独立回归、同SHA CI、原始结构证据和最终交接；**一次做到`READY_FOR_A_REVIEW`再交A，不需中途问用户**。A会独立验收，合格后标准PR合并main。
- C/H01是**独立并行设计轨**：仍待实际高保真视觉整改/复核；C读最新main现行规范，按其已下达的整体视觉任务一轮做完再交A，不能把H01未审当已通过。
- 2B尚未由B施工，无实测CI可宣告；完整F03-2也尚未验收，`PRODUCT_BASELINE=NOT_READY`。
- 全局状态：`F03_2_2B_A_FULL_SCOPE_RELEASED_NEXT_OWNER_B_C_H01_VISUAL_PENDING`。下方较旧“2B待批”“1B/2A待合并”等仅为历史快照，不再是有效下一步。

---

# 2026-10-09｜F03-2-2A 完成标准 PR #9 合并（当前最新）

- **本批工程全部闭环**：用户一次授权、B限定施工、A独立验收、真实同SHA CI成功，以及标准 [PR #9](https://github.com/suzhe868-arch/mb/pull/9) 合并均已完成。验收B SHA `da8a17ec5ce7e004ae158f3d3165469650c344c5`；同SHA [CI37948076366](https://github.com/suzhe868-arch/mb/actions/runs/37948076366) 3/3独立PG16成功（治理9/9、原认证11/11、原HTTPS4/4）。
- merge提交 [`6cb9cc0768cb3b3f6644b457a64b715e3828fc9a`](https://github.com/suzhe868-arch/mb/commit/6cb9cc0768cb3b3f6644b457a64b715e3828fc9a)；A独立核验原main 1180文件blob全不变、7新增文件全部与B验收HEAD一致，无旧文件修改/删除，无越界。
- **此前`PR_CREATE_TOOL_BLOCKED / NOT_MERGED`已解除**：标准PR实际创建并正常合并；下文历史阶段标为曾经状态，不再是当前阻断，不需要用户重新点击。
- 本批仅合成PG16环境的独立System Admin设置现有`sales × customer.phone.manage`模板true的current/history/audit原子事务；SG02～08、其它能力、模板降权/员工停用、交接、正式控制面或客户电话业务API均未开放。完整`F03_2_ACCEPTED=NO`，`PRODUCT_BASELINE=NOT_READY`。
- **当前唯一下一步：A继续审查并准备剩余F03-2技术依赖的下一独立施工单；B等待下一批单次授权**。C/H01设计仍待独立视觉验收。详见`07_重建工作区/F03-2-2A_A主控PR9合并完成与下一步_2026-10-09.md`。
- 当前指针：`F03_2_2A_MERGED_A_REVIEW_NEXT_F03_2_DEPENDENCIES_B_WAIT_H01_VISUAL_PENDING`。

---

# 2026-10-09｜F03-2-2A已验收、标准PR创建受阻（当前最新）

- 用户已经一次性授权F03-2-2A施工和验收后直接合并；A正式放行，B限定7新增文件完成，固定SHA `da8a17ec5ce7e004ae158f3d3165469650c344c5`，同SHA真实CI37948076366三作业3/3成功（2A PG16治理9/9、原F03-1认证11/11、原HTTPS4/4）。
- A独立复验确认旧1179文件逐blob不变，新7文件均在授权目录和独立工作流，无DDL、正式接口或业务数据库。A验收报告`07_重建工作区/F03-2-2A_A主控独立验收签发与真实CI证据_2026-10-09.md`已在main签发。
- **唯一未完成：标准GitHub PR创建调用被当前工具安全检查拦截，没有创建PR、更没有合并。** 保留B分支，拒绝通过绕过PR门禁改写main；此批既有用户一次确认足以授权未来正常合并，无需重复审批。
- B暂停；下一批未批准；C/H01未最终验收。PRODUCT_BASELINE=NOT_READY。此节覆盖以下历史指针。

---

# 2026-10-09｜最新A工程主控状态（覆盖下方历史快照）

- F03-2-1B已通过PR #8正式合并，合并SHA `eeeb4f12936b313c0405ebd880717d4be90feb53`；验收 B SHA `3376f2efff8f95462d7bdaa79c688c3208d2eeac`及同SHA CI37904745833。旧main 1150文件原字节未变、B新增24文件blob精确一致。
- A已完成F03-2-2A下一批技术依赖裁决、限定施工单及45项能力/14类治理承接矩阵，均已落库。施工单：`07_重建工作区/F03-2-2A_角色模板限定启用与原子历史审计施工单_待用户批准_2026-10-09.md`。门禁：`07_重建工作区/F03-2-2A_A主控依赖裁决与启动门禁_待用户批准_2026-10-09.md`。
- **当前唯一工程下一步：用户对F03-2-2A明确限定施工单一次批准；B目前等待、新分支未创建、该批CI未执行。** 单次批准涵盖B施工和A独立验收通过后符合合并门禁的直接合并，不再二次申请；失败/越权/冲突则停止。
- 2A只建议隔离PG16上System Admin对已有sales×customer.phone.manage模板enabled=true的原子治理和history/audit；不改原迁移、不新增DDL、不开放正式接口。其它治理、其它权限映射和跨域交接仍未授权。C/H01待独立视觉复审，PRODUCT_BASELINE=NOT_READY。

---

# 2026-10-09｜F03-2-1B正式合并完成（当前最新）

- [PR #8](https://github.com/suzhe868-arch/mb/pull/8) 正常merge成功，SHA `eeeb4f12936b313c0405ebd880717d4be90feb53`。冻结B验收HEAD `3376f2efff8f95462d7bdaa79c688c3208d2eeac` 的真实CI37904745833三作业成功。原main 1150文件全部不变，新增24文件全部与B验收SHA的Git blob一致。
- **正式状态：F03_2_1B_ACCEPTED / MERGED_TO_MAIN**；未获完整F03_2_ACCEPTED、后批施工或C/H01最终验收，`PRODUCT_BASELINE=NOT_READY`。
- 用户已确定：今后对明确新批次一次批准后，A独立验收通过且无冲突/越权，可直接合并，不再就同一批的合并重复审批；新批施工仍另行批准，异常阻断。
- **当前唯一工程下一步：A准备F03-2-1剩余范围与F03-2-2治理事务的前置技术裁决及独立施工单；B等待，C/H01视觉复审待办。** 合并复核：`07_重建工作区/F03-2-1B_A主控PR8合并完成及后续门禁_2026-10-09.md`。
- 以下旧“待合并/待整改”系历史状态，不再生效。

---

# 2026-10-09｜F03-2-1B正式验收通过、合并待单独批准（当前最新）

- 用户在A窗口明确“同意”A登记1B正式验收及准备合并核验材料；A签发 **F03_2_1B_ACCEPTED / A_SIGNED / LIMITED_SG01_OBJECT_SCOPE_INTERNAL_GUARD_ONLY / NOT_MERGED**。完整F03-2-1、F03_2_ACCEPTED均未签，`PRODUCT_BASELINE=NOT_READY`。
- B冻结验收HEAD `3376f2efff8f95462d7bdaa79c688c3208d2eeac`，同SHA [真实CI37904745833](https://github.com/suzhe868-arch/mb/actions/runs/37904745833)三个独立PG16作业成功；迁移9/9、Scope7/7、HTTPS2/2，源归档测试与旧登录11/11、原HTTPS4/4回归成功。A独立闭合R1完整迁移链、R2用户命名空间隔离、R3精确约束/HTTPS负例、E1结构原文与真实哈希。
- A独立读取原结构全文/归档，验证旧对象1664、新对象1687，**只新增SG01的23个物理目录条目，旧对象删除/定义变化均为0**；80→81表、487→492列、299→304约束、123→126索引。归档源CI37901077203并非最终HEAD产物，最终CI独立校验两者结构一致（SQL只允许配对pg_dump随机key差异）。
- **当前唯一工程下一步：用户审查本批合并核验材料并单独决定是否允许A合并B分支main；B等待，不再继续R1/R2/R3/E1整改。** 报告：`07_重建工作区/F03-2-1B_A主控最终验收签发与残余风险_2026-10-09.md`；合并材料：`07_重建工作区/F03-2-1B_A主控合并核验材料_待用户批准_2026-10-09.md`。
- 本轮只更新A主控文档及状态，不合并B/C、不创建后批施工授权；仅CI一次性PG16和`customer.phone.manage`的内部object范围，不修改电话、不开放正式接口。C/H01尚未最终验收，PDM Final/Current IA/Low-Fi与已有工程不变。
- 当前指针：`F03_2_1B_ACCEPTED_A_MERGE_PENDING_USER_APPROVAL_AND_H01_VISUAL_REVIEW`；以下首轮整改内容为历史，不得再当作当前未闭合阻断。

---

# 2026-10-09｜F03-2-1B首轮整改补证（当前最新）

- A独立复验B `feat/f03-runtime-scope` HEAD `df27522891438c51ff8847cc5e018b698c0a98fc`；同SHA [CI37901077203](https://github.com/suzhe868-arch/mb/actions/runs/37901077203)三个独立PG16作业成功。本批迁移6/6、范围7/7、HTTPS2/2，但存在版本门禁与测试覆盖缺口。
- **结论：CHANGES_REQUESTED / F03_2_1B_ACCEPTED尚未签发。** 报告：`07_重建工作区/F03-2-1B_A主控首轮复验与三项整改及补证清单_2026-10-09.md`。
- **当前唯一工程下一步：B在当前分支闭合R1完整版本链、R2非public命名空间隔离、R3有针对性的约束/HTTPS负例，补可读结构原文和实际校验，提交新SHA与同SHA成功CI交A复验。**
- 原1B限定结构/Guard及独立全新PG16授权持续有效；只在runtime-scope及本批新工作流整改，不改旧工程/产品Authority、不新增范围或业务接口、不合并B/C。
- 1A已验收合并；后续治理/交接、其他动作/范围、SG02～08、F03-3/F04、部署/正式前端未授权。C/H01独立未最终验收、不加折叠屏专项；不访问已有/业务/生产库，`PRODUCT_BASELINE=NOT_READY`。
- 当前指针：`F03_2_1B_B_FIX_VERSION_ISOLATION_TEST_GAPS_AND_ARCHIVE_EVIDENCE_A_REVIEW_AND_H01_VISUAL_REVIEW`；以下初次放行信息为历史。

---

# HISTORICAL｜F03-2-1B初次放行时

- 用户在A窗口明确“确认”，批准1A成果合并及1B施工单；A已完成 [PR #7](https://github.com/suzhe868-arch/mb/pull/7) merge，SHA `22c4d8ea405f4f6d47c0c128d68f69dbd417e812`。
- 18新增文件blob均与验收HEAD `bc1261ce090180d87b262744bd2b16e7c6caf60f` 完全一致，main原有1128文件原字节保持，合并后1146文件；旧Authority/工程不变。1A验收真实CI37891029812仍为对应HEAD既有证据，不冒称本批测试。
- **A正式签发F03_2_1B_AUTHORIZED / USER_APPROVED / A_RELEASED / NOT_YET_IMPLEMENTED。当前唯一工程下一步：B从含本放行的最新main新建`feat/f03-runtime-scope`，执行逐能力客户范围与限定真实Guard施工单，完成后交A独立验收。**
- 放行：`07_重建工作区/F03-2-1B_A主控成果合并与客户范围隔离施工放行_2026-10-09.md`；施工单：`07_重建工作区/F03-2-1B_逐能力客户范围与限定真实Guard施工单_待用户批准_2026-10-09.md`（以本次正式放行增补为准）。
- 只允许独立一次性PG16全新空库。此次明确批准SG01限定一张五列scope关联表、旧scope表追加一个复合唯一约束、所列FK/CHECK/索引、000003独立追加迁移和精确81表新Guard；旧000001/000002及80表Guard保持，其他SG02～08不施工。
- 业务判断正例仅`customer.phone.manage`匹配具体客户object范围及当前状态的**内部Guard**；不实际修改电话、不开放业务接口，其他动作/范围仍DEFER。新增仅`engineering/f03/runtime-scope/**`及`.github/workflows/f03-2-1b-runtime-scope.yml`。
- 本批测试NOT_RUN、F03_2_1B_ACCEPTED未签；完整F03-2-1/F03_2_ACCEPTED未签。治理/交接、F03-3/F04等后批、部署/正式前端、本批分支合并仍分别未授权。
- C/H01独立未最终验收，不合并C、不加折叠屏专项；PDM Final/Current IA/Low-Fi不改，不访问已有/业务/生产库，`PRODUCT_BASELINE=NOT_READY`。
- 当前指针：`F03_2_1B_B_CAPABILITY_CUSTOMER_SCOPE_GUARD_A_REVIEW_AND_H01_VISUAL_REVIEW`；以下旧待批准/等待信息为历史。

---

# HISTORICAL｜1A合并与1B施工单待批准时

- A已整理1A合并材料并创建 [草稿PR #7](https://github.com/suzhe868-arch/mb/pull/7)，尚未合并；验收HEAD `bc1261ce090180d87b262744bd2b16e7c6caf60f` 不变，F03_2_1A_ACCEPTED有效。
- 合并材料：`07_重建工作区/F03-2-1A_A主控合并核验材料_待用户批准_2026-10-09.md`；下一批建议：`07_重建工作区/F03-2-1B_逐能力客户范围与限定真实Guard施工单_待用户批准_2026-10-09.md`。
- **当前唯一工程下一步：用户分别审查批准1A合并与1B施工单，A随后登记并执行相应授权；B暂时等待。**
- 1B建议先把已冻结customer.phone.manage与具体客户范围绑定，完成限定内部Guard的真实允许/越界拒绝；提出一张逐能力scope关联表、旧scope表追加一个唯一约束、000003追加迁移及独立精确新版Guard。当前仅技术建议，结构和施工未授权。
- 已验收80表旧Guard保持原字节且必须拒绝81表新库；1B建议独立新Guard和独立测试库，不能简单改计数或关校验。无实际电话业务改动，无正式接口，其他范围/业务动作与治理/交接另批。
- 本次用户“同意”只批准A准备材料；未创建1B工程分支、未测试/迁移，TESTS=NOT_RUN。已有/业务/生产库、部署/正式前端、后批施工仍未授权。
- C/H01独立未最终验收、不合并C、不加折叠屏专项；PDM Final/Current IA/Low-Fi及已验收工程保持，`PRODUCT_BASELINE=NOT_READY`。
- 当前指针：`F03_2_1A_MERGE_AND_F03_2_1B_SCOPE_WORK_ORDER_PENDING_USER_APPROVAL_AND_H01_VISUAL_REVIEW`；以下既有验收记录为历史。

---

# HISTORICAL｜F03-2-1A验收签发时

- A正式签发 **F03_2_1A_ACCEPTED / A_SIGNED / LIMITED_CURRENT_FACTS_AND_REVOCATION_ONLY / NOT_MERGED**；R1、R2、E1已闭合。完整F03-2-1、F03_2_ACCEPTED未签。
- B验收SHA `bc1261ce090180d87b262744bd2b16e7c6caf60f`；同SHA [CI37891029812](https://github.com/suzhe868-arch/mb/actions/runs/37891029812)三个独立PG16作业全部成功。本批当前事实12/12、HTTPS旧会话3/3、证据校验4/4；原真实认证11/11及HTTPS安全4/4回归通过。
- 验收报告：`07_重建工作区/F03-2-1A_A主控最终验收签发与残余风险_2026-10-09.md`。A已读取归档SQL及inventory原文，独立计算SHA256与源清单精确吻合；结构与已验收F03-1一致（仅pg_dump配对随机key不同），无F03-2新DDL。
- **当前唯一工程下一步：A整理本批合并核验，以及逐能力范围结构与完整Guard下一批的技术裁决/施工单，供用户分别审查；B等待。** 合并本分支及下一批施工尚未获批。
- 本批只证明当前可信事实读取与撤权后的新请求重验。业务最终允许仍因scope/对象证据不足拒绝，未开放业务接口；SG01～08结构、完整写提交Guard、治理/交接及后批仍需分别授权。
- G0已验收合并；PDM Final/Current IA/Low-Fi及既有工程保持。C/H01独立未最终验收、不合并C、不增加折叠屏专项；不访问已有/业务/生产库、不部署或正式前端施工，`PRODUCT_BASELINE=NOT_READY`。
- 当前指针：`F03_2_1A_ACCEPTED_A_MERGE_AND_SCOPE_GUARD_GATE_PREPARATION_AND_H01_VISUAL_REVIEW`；以下首轮整改信息保留为历史。

---

# HISTORICAL｜F03-2-1A首轮整改时

- A独立复验B `feat/f03-runtime-facts` HEAD `319db71604e1efd2ce12dbba7990c7ed1d3bc62a`；同SHA [CI37886758651](https://github.com/suzhe868-arch/mb/actions/runs/37886758651)成功，当前PG16测试9/9、HTTPS探针3/3。旧会话撤权测试可见，但完整验收仍有补项。
- **结论：CHANGES_REQUESTED / F03_2_1A_ACCEPTED尚未签发。** 报告：`07_重建工作区/F03-2-1A_A主控首轮复验与补测补证清单_2026-10-09.md`。
- **当前唯一工程下一步：B在当前分支补齐当前主店变化/身份硬禁令的真实测试、已验收F03-1真实认证与HTTPS安全回归，并归档本批CI结构证据，提交新SHA与同SHA成功CI交A复验。**
- 本批限定隔离PG16、无新DDL的授权持续有效；只允许原runtime-facts目录和本批工作流。完整scope Guard、SG01～08结构、治理/交接及后批未授权；不合并本B分支或C。
- G0已验收合并；PDM Final/Current IA/Low-Fi及既有工程保持。C/H01独立未最终验收、不增加折叠屏专项；不访问已有/业务/生产库、不部署或正式前端施工，`PRODUCT_BASELINE=NOT_READY`。
- 当前指针：`F03_2_1A_B_CLOSE_TEST_AND_EVIDENCE_GAPS_A_REVIEW_AND_H01_VISUAL_REVIEW`；以下初次放行信息为历史。

---

# HISTORICAL｜F03-2-1A初次放行时

- 用户在A窗口确认“确实”，批准A合并已验收G0方案并放行施工单中限定的F03-2-1A；A已完成 [PR #6](https://github.com/suzhe868-arch/mb/pull/6) merge，SHA `df4135f1e2eb37b109e4e23ff63642c211a643fa`。
- 合并验收：18新增文件blob均与B验收HEAD `d2c76ef2d27775a700fe1dbfa4be546c03253f1a` 完全相同，main原有1105文件保持原字节；合并后1123文件。G0验收CI36/36、A模型检查11/11仍为既有证据，不冒充本批测试。
- **A正式签发F03_2_1A_AUTHORIZED / USER_APPROVED / A_RELEASED / NOT_YET_IMPLEMENTED。当前唯一工程下一步：B从含本放行的最新main新建`feat/f03-runtime-facts`，执行当前身份/权限事实读取、旧会话撤权重验和缺范围证据拒绝的限定施工单，完成后交A独立验收。**
- 放行记录：`07_重建工作区/F03-2-1A_A主控方案合并与当前权限事实隔离施工放行_2026-10-09.md`；施工单：`07_重建工作区/F03-2-1A_当前身份权限事实读取与撤权重验施工单_待用户批准_2026-10-09.md`（以本次正式放行增补为准）。
- 仅在GitHub Actions独立PG16全新空库施工及测试，复用已验收F02→F03-1基线与隔离Guard；不新增F03-2 DDL、不启动F04业务接口。允许新增`engineering/f03/runtime-facts/**`和`.github/workflows/f03-2-1a-runtime-facts.yml`；既有工程/迁移/manifest/工作流保持，必要入口修改须先交A具体审查。
- 本批测试NOT_RUN、F03_2_1A_ACCEPTED尚未签发；完整范围Guard、SG01～08结构、治理事务/交接、F03-3/F04等仍另批。C/H01独立未最终验收、不合并C；PDM Final/Current IA/Low-Fi保持，不访问已有/业务/生产库、不部署、不启动正式前端、不加折叠屏专项，`PRODUCT_BASELINE=NOT_READY`。
- 当前指针：`F03_2_1A_B_TRUSTED_RUNTIME_FACTS_AND_REVOCATION_A_REVIEW_AND_H01_VISUAL_REVIEW`。以下准备时“未批准/等待”状态仅为历史。

---

# HISTORICAL｜G0合并与1A施工单待批准时

- A已整理已验收G0的合并材料及 [草稿PR #6](https://github.com/suzhe868-arch/mb/pull/6)；尚未合并。工程HEAD仍为`d2c76ef2d27775a700fe1dbfa4be546c03253f1a`，同SHA CI36/36，五项整改闭合，F03_2_G0_ACCEPTED有效。
- 合并材料：`07_重建工作区/F03-2-G0_A主控合并核验材料_待用户批准_2026-10-09.md`；建议下一小批：`07_重建工作区/F03-2-1A_当前身份权限事实读取与撤权重验施工单_待用户批准_2026-10-09.md`。
- **当前唯一工程下一步：用户审查并分别批准G0合并与F03-2-1A施工单，A随后登记及执行对应授权；B暂时等待。**
- F03-2-1A建议在独立全新一次性PG16验证当前身份/权限事实读取、旧会话撤权和缺范围证据拒绝；无F03-2 DDL，不开放业务接口。此建议尚未放行，未创建施工分支，测试NOT_RUN。
- SG01～08新结构、完整范围Guard、治理事务/交接及F03-3/F04等后批仍未授权。本次用户“同意”仅批准A准备材料。
- PDM Final/Current IA/Low-Fi、既有工程不变；不访问已有/业务/生产库，不部署；C/H01独立未最终验收、不合并C、不加折叠屏专项，`PRODUCT_BASELINE=NOT_READY`。
- 当前指针：`F03_2_G0_MERGE_AND_F03_2_1A_WORK_ORDER_PENDING_USER_APPROVAL_AND_H01_VISUAL_REVIEW`。以下既有验收登记保留为历史。

---

# HISTORICAL｜F03-2-G0验收签发时

- A正式签发 **F03_2_G0_ACCEPTED / A_SIGNED / STATIC_DESIGN_ONLY / NOT_MERGED**；五项整改R1～R5已闭合。本结论不等于F03_2_ACCEPTED。
- 验收工程：B `feat/f03-runtime-g0`，SHA `d2c76ef2d27775a700fe1dbfa4be546c03253f1a`；同SHA [CI37880600267](https://github.com/suzhe868-arch/mb/actions/runs/37880600267)成功，G0测试36/36；A独立补充检查11/11通过。
- 验收记录：`07_重建工作区/F03-2-G0_A主控最终验收签发与残余风险_2026-10-09.md`。范围仅设计、合同、纯假数据模型及静态检查；没有真实数据库、运行期Guard或治理事务验收。
- **当前唯一工程下一步：A整理本批合并核验材料，以及F03-2-1真实权限校验所需的技术裁决和施工单，交用户审查；B等待，不开始新施工。** 分支合并及下一批施工仍须分别授权。
- SG09复用已有`role_default_permission_history`；SG01～08仍为待裁决建议，不能据G0验收直接建表。真实锁/并发、撤权HTTP重验、事务审计及交接适配未执行。
- F03-1已验收合并；C/H01独立未最终验收。PDM Final/Current IA/Low-Fi不变；不访问已有/业务/生产库、不部署、不启动正式前端；F03-2后续实现批、F03-3、F02-2/3/4、F04未授权，`PRODUCT_BASELINE=NOT_READY`。
- 现行指针：`F03_2_G0_ACCEPTED_A_MERGE_AND_IMPLEMENTATION_GATE_PREPARATION_AND_H01_VISUAL_REVIEW`。以下首轮整改和初次放行信息仅保留为历史。

---

# HISTORICAL｜F03-2-G0首轮复验未通过，五项整改

- A已独立复验B `feat/f03-runtime-g0` HEAD `a56cb746ae14a2047be791a204b8b367767c7c9f`；同SHA[CI37877324106](https://github.com/suzhe868-arch/mb/actions/runs/37877324106)成功22/22及既有静态回归通过，但发现5项独立语义阻断。
- **结论：CHANGES_REQUESTED；F03_2_G0_ACCEPTED尚未签发。** 整改记录：`07_重建工作区/F03-2-G0_A主控首轮复验与五项整改清单_2026-10-09.md`。
- **当前唯一工程下一步：B继续当前分支，在G0静态范围修复已有历史表误报、模板治理身份、正常最后接客者保护、4S PC撤权重验及真实脱敏审计前后值；提交新SHA与同SHA成功CI/闭合表交A复验。**
- 原F03-2-G0限定设计/静态授权持续有效；不连接数据库，不修改已验收工程，不将22/22视为全批验收；后续真实Guard/治理/交接、F03-3、F02-2/3/4、F04未授权。
- F03-1已验收合并；B/C不合并，C/H01独立未最终验收；PDM Final/Current IA/Low-Fi不变，不访问已有/业务/生产库、不部署或正式前端施工，`PRODUCT_BASELINE=NOT_READY`。
- 现行指针：`F03_2_G0_B_FIX_FIVE_BLOCKERS_A_REVIEW_AND_H01_VISUAL_REVIEW`；以下旧初次施工状态为历史。

---

# HISTORICAL｜F03-2-G0初次施工放行时

- 用户在A窗口明确“同意”；A正式签发 **F03_2_G0_AUTHORIZED / USER_APPROVED / A_RELEASED / NOT_YET_IMPLEMENTED**。
- 放行记录：`07_重建工作区/F03-2-G0_A主控事实映射与事务方案施工放行_2026-10-09.md`；工作单：`07_重建工作区/F03-2_运行期权限校验与治理事务施工单_待用户批准_2026-10-09.md`，以顶部正式放行增补为准。
- **当前唯一工程下一步：B从含本放行登记的最新main新建`feat/f03-runtime-g0`，完成事实/字段映射、scope及治理事务/撤权并发方案、结构缺口建议、纯假数据检查和静态CI，提交同SHA证据交A独立验收。**
- 本批不连接数据库，不实现真实Guard或业务路由，不执行迁移；已验收F02/F03-G0/F03-1工程保持。F03-2后续实现批、F03-3、F02-2/3/4、F04及部署/正式前端未授权。
- F03-1已验收并合并；C/H01独立未最终验收，不合并B/C、不增加折叠屏专项；PDM Final/Current IA/Low-Fi不变，`PRODUCT_BASELINE=NOT_READY`。
- 本轮仅登记正式放行，F03-2-G0测试NOT_RUN、验收未签发；现行指针：`F03_2_G0_B_RUNTIME_DESIGN_A_REVIEW_AND_H01_VISUAL_REVIEW`。以下旧待批准状态为历史。

---

# HISTORICAL｜F03-2工作单待批准时

- 用户已批准A整理下一批施工单；A已完成：`07_重建工作区/F03-2_运行期权限校验与治理事务施工单_待用户批准_2026-10-09.md`。
- **建议首先批准F03-2-G0：数据库当前事实映射、scope与治理事务合同、精确结构建议及纯假数据核验。** 待用户审查与A正式放行，不能把“同意整理”当成B施工授权。
- **当前唯一工程下一步：用户审查本施工单，决定是否批准限定F03-2-G0；B暂不创建分支或施工。** 获批后计划分支`feat/f03-runtime-g0`，从含正式放行的最新main建立。
- G0验收后，真实数据库动态Guard、治理事务/最后管理员及接客者保护、完整交接适配仍分别另批；F03-2-1/2/3、F03-3、F02-2/3/4、F04未授权。
- F03-1已验收并经[PR #5](https://github.com/suzhe868-arch/mb/pull/5)合并，merge SHA `3a7e5dbc389533cdcf05850cbaff595b97e3812b`；本轮只上传治理文档，没有新增F03-2测试、代码或数据库操作。
- PDM Final/Current IA/Low-Fi不变；C/H01独立未最终验收，不合并C、不增加折叠屏专项；已有/业务/生产库、部署与正式前端未授权，`PRODUCT_BASELINE=NOT_READY`。
- 现行指针：`F03_2_G0_RUNTIME_DESIGN_PENDING_USER_APPROVAL_AND_H01_VISUAL_REVIEW`；以下旧准备状态为历史。

---

# HISTORICAL｜F03-1合并后A门禁准备时

- 用户在A窗口明确“同意”，A已通过[PR #5](https://github.com/suzhe868-arch/mb/pull/5)将已验收F03-1工程合并main；merge SHA `3a7e5dbc389533cdcf05850cbaff595b97e3812b`。
- **F03_1_ACCEPTED / A_SIGNED / MERGED_TO_MAIN_USER_APPROVED**；工程验收SHA `0c2a9d3c998149fb086a5eac19639a1a0ca9e71a`，归档交接SHA `73e794119fea9630fd81eb84dd7c08eda7c9f664`。合并记录：`07_重建工作区/F03-1_工程合并main与后续门禁记录_2026-10-09.md`。
- A核验22个变更文件与B验收归档blob完全一致，main另外1076文件全部保留；此前1078文件中仅2个已验收工程入口文件变更，新增20文件，总1098文件。
- 真实CI37863317173属于工程验收SHA，专项19/19及既有回归通过；归档仅证据skip ci，本次未重跑测试，不冒称新main独立CI。
- **当前唯一工程下一步：A准备F03-2运行期权限校验施工单与验收门禁，提交用户审查；B暂不施工下一批。** 本次合并不授权F03-2/3、F02-2/3/4或F04。
- 业务/已有/生产库、部署及正式前端未授权；C/H01仍独立未最终验收，不合并C、不增加折叠屏专项；PDM Final/Current IA/Low-Fi不变，`PRODUCT_BASELINE=NOT_READY`。
- 现行指针：`F03_2_A_GATE_PREPARATION_PENDING_USER_APPROVAL_AND_H01_VISUAL_REVIEW`；以下旧合并待批准状态为历史。

---

# HISTORICAL｜F03-1验收后合并待批准时

- **A正式签发 F03_1_ACCEPTED / A_SIGNED（仅全新隔离PG16实现）**；验收记录：`07_重建工作区/F03-1_A主控最终验收签发与残余风险_2026-10-09.md`。
- 工程验收SHA `0c2a9d3c998149fb086a5eac19639a1a0ca9e71a`，真实[CI37863317173](https://github.com/suzhe868-arch/mb/actions/runs/37863317173)成功；专项19/19及既有回归通过，四项阻断闭合。
- B归档SHA `73e794119fea9630fd81eb84dd7c08eda7c9f664`仅追加3个证据文件，源码/工作流不变；归档skip ci，无新CI。A独立校验两个完整导出文件与原CI SHA256一致，80表/487字段/299约束/123索引核对通过。
- **当前唯一工程下一步：A提交已验收B工程纳入main的合并建议，等待用户批准；B本阶段完成，暂不施工下一批。**
- 本次仅登记A验收与状态，B工程尚未合并main；没有新main工程CI。F03-2/3、F02-2/3/4、F04、业务/已有/生产库、正式前端及部署仍未授权。
- C/H01独立推进未最终验收，不合并C、不增加折叠屏专项；PDM Final/Current IA/Low-Fi不变，`PRODUCT_BASELINE=NOT_READY`。
- 现行指针：`F03_1_ACCEPTED_A_MERGE_PENDING_USER_APPROVAL_AND_H01_VISUAL_REVIEW`；以下旧当前状态为历史。

---

# HISTORICAL｜F03-1施工放行时

- 用户明确“同意”；A已通过[PR #4](https://github.com/suzhe868-arch/mb/pull/4)合并已验收F03-1-G0方案，merge SHA `aa09c9a21752a5d3ce428253e29d2a0b88f76f46`；15文件与验收B一致，原main1061文件全部保持。
- **F03-1实际登录限定施工已正式放行**：`F03_1_IMPLEMENTATION_AUTHORIZED / USER_APPROVED / NOT_YET_IMPLEMENTED`；正式放行单：`07_重建工作区/F03-1_A主控方案合并与真实登录隔离施工放行_2026-10-09.md`；详细范围：`07_重建工作区/F03-1_真实登录与密码安全实现施工单_待批准_2026-10-09.md`顶部增补。
- **当前唯一工程下一步：B从含本放行登记的最新main新建 `feat/f03-login-impl`，实现登录/强制改密/退出/撤销会话及精确追加迁移，并仅在本次CI全新一次性PG16测试；提交同SHA真实CI、结构导出和并发/回滚证据交A验收。**
- 当前实际认证/PG事务测试NOT_RUN；原方案CI19/19属于已验收B SHA，本次没有新的独立main工程测试；F03_1_ACCEPTED尚未签发。
- F03-2/3、F02-2/3/4、F04、真实业务/生产/已有库、部署及正式前端未授权；PDM Final/IA/Low-Fi不变。C/H01继续独立审查未最终验收，本次不写/合并C，`PRODUCT_BASELINE=NOT_READY`。
- 现行指针：`F03_1_B_ISOLATED_LOGIN_IMPLEMENTATION_A_REVIEW_AND_H01_VISUAL_REVIEW`；以下旧待批准/未合并状态仅为历史。

---

# HISTORICAL｜F03-1实现工作单待批准状态

- F03-1-G0方案批已验收，真实登录仍未施工；B验收SHA `d5987afc14d591db683facf15ebf767f9762af2a`，同SHA CI37856201791成功19/19；方案分支未合并main。
- **A已完成实际登录施工单准备**：`07_重建工作区/F03-1_真实登录与密码安全实现施工单_待批准_2026-10-09.md`；涵盖账号密码、强制改密、本人改密/退出、撤销会话、隔离PG16追加迁移、HTTPS和并发证据。
- **当前唯一工程下一步：用户审查该施工单，决定是否批准A纳入已验收G0方案并签发限定F03-1实现放行。** 批准前B不施工，A本轮不合并B/C、不运行数据库。
- 工程接线限制已写清：单一Node入口、原F01安全探针/build边界保持、F03独立guard/迁移器处理追加版本，不能篡改F02冻结runner/checksum。
- C/H01独立审查未最终验收；F03-2/3、F02-2/3/4、F04、真实业务/生产库和部署未授权；PDM Final/IA/Low-Fi不变，`PRODUCT_BASELINE=NOT_READY`。
- 现行指针：`F03_1_IMPLEMENTATION_WORK_ORDER_PENDING_USER_APPROVAL_AND_H01_VISUAL_REVIEW`；以下旧准备/施工状态为历史。本次只上传治理文档，工程测试NOT_RUN。

---

# HISTORICAL｜F03-1-G0验收后工作单准备状态

- **A正式签发F03_1_G0_ACCEPTED（仅方案与假数据批）**：验收B `feat/f03-login` SHA `d5987afc14d591db683facf15ebf767f9762af2a`；[同SHA CI 37856201791](https://github.com/suzhe868-arch/mb/actions/runs/37856201791)成功19/19，A另补查17/17通过，两项整改已闭合。
- 验收记录：`07_重建工作区/F03-1-G0_A主控验收签发与残余风险_2026-10-09.md`。真实登录、数据库/会话迁移及事务/部署仍NOT_RUN，不能将静态模型验收写成完整F03-1实现通过。
- **当前唯一工程下一步：A准备F03-1实际实现工作单及待裁定参数，交用户批准；B暂不施工下一批。** 工程分支尚未合并，合并需另行用户批准。
- C/H01独立审查继续且未最终验收。F03-1实现、F03-2/3、F02-2/3/4、F04及业务/生产库未授权，不改PDM Final/Current IA/Low-Fi，不擅自合并B/C，`PRODUCT_BASELINE=NOT_READY`。
- 本次只登记A治理文件，没有新增main独立测试；现行指针：`F03_1_G0_ACCEPTED_A_IMPLEMENTATION_GATE_PREPARATION_AND_H01_VISUAL_REVIEW`。以下旧施工状态为历史。

---

# HISTORICAL｜F03-1-G0方案施工时状态

- 用户于2026-10-09在A窗口明确“同意”；A正式登记 **F03_1_G0_AUTHORIZED / USER_APPROVED / NOT_YET_IMPLEMENTED**。
- 正式放行单：`07_重建工作区/F03-1-G0_A主控登录安全方案施工放行_2026-10-09.md`；工作范围见`07_重建工作区/F03-1_账号登录与密码安全工作单_待批准_2026-10-09.md`顶部放行增补。
- **当前唯一工程下一步：B从包含本放行登记的最新main新建 `feat/f03-login`，完成登录和密码安全方案、身份状态/会话合同、精确结构差异与纯假数据检查；提交精确SHA、同SHA成功CI、覆盖表和风险交A独立验收。** 已验收`feat/f03-auth`保留为历史。
- 仅方案批获准；真实登录、HTTP认证服务、数据库连接/建表/会话迁移及F03-1实现批仍未授权。本次登记没有运行新工程测试，不表示安全方案已验收。
- F03-G0已验收并合并；C/H01继续独立审查且未最终验收。F03-2/3、F02-2/3/4、F04及业务/生产库未授权，不改PDM Final、Current IA/Low-Fi，不擅自合并B/C，`PRODUCT_BASELINE=NOT_READY`。
- 现行指针：`F03_1_G0_B_SAFETY_DESIGN_A_REVIEW_AND_H01_VISUAL_REVIEW`；以下旧待批准/施工状态仅为历史。

---

# HISTORICAL｜F03-G0验收合并后、F03-1方案待批准

- **F03-G0已正式验收并合并main**：B SHA `b4b56401b68ba91776ddd7edfa0b545586137720`；[CI 37852018024](https://github.com/suzhe868-arch/mb/actions/runs/37852018024)同SHA成功，34/34静态检查；[PR #3](https://github.com/suzhe868-arch/mb/pull/3)已merged，merge SHA `6983709937ebf1d9ae8a7f6cd0a4267bb2269ac6`。
- A验收/合并记录：`07_重建工作区/F03-G0_A主控验收与合并记录_2026-10-09.md`。缺编号与历史嵌套内容泄露两处阻断已闭合；本批仅合同/纯模块/假数据，不表示真实登录或DB动态授权已完成。
- **A下一批工作单已准备**：`07_重建工作区/F03-1_账号登录与密码安全工作单_待批准_2026-10-09.md`。建议先批准F03-1-G0账号登录与密码安全方案、状态/会话合同及精确结构差异小批；用户批准前B不施工。实际认证、会话表迁移另行审查放行。
- 真实测试证据来自B精确SHA，合并后main没有新的独立测试运行；本次只登记治理记录，没有部署或访问数据库。
- C/H01独立审查继续；F03后续批、F02-2/3/4、F04正式施工及业务/生产库未授权，不擅改PDM Final/Current IA/Low-Fi，`PRODUCT_BASELINE=NOT_READY`。
- 现行指针：`F03_1_G0_SAFETY_DESIGN_PENDING_USER_APPROVAL_AND_H01_VISUAL_REVIEW`；以下较早待施工状态为历史。

---

# HISTORICAL｜F03-G0限定首批获准施工时

- 用户于2026-10-09明确“同意放行”；A正式签发 `F03_G0_AUTHORIZED / USER_APPROVED / NOT_YET_IMPLEMENTED`。
- 正式放行单：`07_重建工作区/F03-G0_A主控正式施工放行_2026-10-09.md`；详细范围：`07_重建工作区/F03_开工门禁与分批施工建议_待用户批准_2026-10-09.md`（顶部放行增补为准）。
- **B当前任务**：从包含本次放行登记的最新main新建 `feat/f03-auth`，只施工F03-G0权限合同、身份会话合同、纯权限决策模块与假数据静态正反例；提交SHA、真实CI、规则覆盖表与风险交A验收。原 `feat/f02-schema` 保留。
- 本批不连接数据库，不做真实登录/微信接入、会话表迁移或F04业务API。F03-1/2/3、F02-2/3/4及其它后续正式施工仍未授权。
- F02-G0/F02-1已验收并合并，C/H01继续原独立视觉审查，不因本放行自动验收/合并或扩展折叠屏；产品Authority不变，`PRODUCT_BASELINE=NOT_READY`。
- 现行指针：`F03_G0_B_IMPLEMENTATION_A_REVIEW_AND_H01_VISUAL_REVIEW`。下面旧待批准状态是本次用户批准前的历史记录。

---

# HISTORICAL｜2026-10-09 F02-1合并后F03待批准状态

- **F02-G0/F02-1 = ACCEPTED / MERGED_TO_MAIN**。[PR #2](https://github.com/suzhe868-arch/mb/pull/2)已合并，merge SHA `3412dc76815e97a7df9024d8b7812a2aece7036c`；已验收B SHA `9f10f65be293fd892e4787a3a3bdff2676c487ea`。
- 合并记录：`07_重建工作区/F02-1_工程合并main与后续门禁记录_2026-10-09.md`；核对B 83个engineering/workflow blob一致、main原有979文件全部保留。63新增文件，无产品Authority改写。
- 真实F02 CI证据来自已验收B SHA，不将其写成合并后main独立回归；本次没有重跑数据库测试。
- **当前唯一工程下一步：用户审查并决定是否批准F03-G0限定首批。** 工作单：`07_重建工作区/F03_开工门禁与分批施工建议_待用户批准_2026-10-09.md`；只准备门禁，B当前暂不施工，F03-1及其余批次另行放行。
- C/H01独立视觉复核继续，未最终验收；F02-2/3/4、F04及其他正式施工、业务/已迁/生产库、C合并仍未授权；不增加折叠屏专项，`PRODUCT_BASELINE=NOT_READY`。
- 现行指针：`F03_G0_PENDING_USER_APPROVAL_AND_H01_VISUAL_REVIEW`。以下较早“当前/最新”均为历史过程。

---

# HISTORICAL｜2026-10-09 F02-1验收登记时（合并前）

- **A 正式签发：`F02_1_ACCEPTED / A_SIGNED / USER_APPROVED`**。验收 B `feat/f02-schema` 精确 SHA `9f10f65be293fd892e4787a3a3bdff2676c487ea`；[F02-1 CI 37843224982](https://github.com/suzhe868-arch/mb/actions/runs/37843224982) 与 [G0 CI 37843225062](https://github.com/suzhe868-arch/mb/actions/runs/37843225062) 同一 SHA、completed/success。
- 正式签发与风险记录：`07_重建工作区/F02-1_A主控最终验收签发与残余风险_2026-10-09.md`。独立核验实际工件：76业务表、464字段、160外键、28额外唯一索引、39 CHECK、5历史触发器；5/5非表对象拒绝、32项fixture、事务失败回滚、1 applied +3 idempotent并发及结构漂移负例通过。
- **本次仅将 A 验收与状态登记 main；B 工程代码仍在 B 分支，未合并。** main 没有因此获得 F02-1 工程实现；上述运行证据来自已验收 B SHA，不是 main 业务/部署测试。
- 当前工程下一步：A 提交已验收工程合并及下一阶段门禁建议，等待用户另行批准；B 本阶段结束，暂不启动新施工。C/H01 独立视觉复核继续，未最终验收，暂不增加折叠屏专项。
- F02-2/3/4、F03/F04正式施工、B/C合并main、业务/已迁/生产库访问仍未授权；PDM Final / Current IA / Current Low-Fi 不变，`PRODUCT_BASELINE=NOT_READY`。
- 唯一现行指针：`F02_1_ACCEPTED_A_NEXT_GATE_PENDING_USER_APPROVAL_AND_H01_VISUAL_REVIEW`。以下历史“当前/最新”描述不覆盖本节。

---

# HISTORICAL｜2026-10-08 A签发G0并放行F02-1时的状态

- 用户本轮明确“同意”，正式批准 A 将 F02-G0 最终通过结果落库；验收签发：`07_重建工作区/F02-G0_A主控最终验收签发与F02-1隔离施工放行_2026-10-08.md`。A 已验证 B 工程 HEAD `f2cdb0e8c7967aeaa8cfea5c6b466c9b45a68946` 对应真实 CI `37722491859`，F01 13/13 + G0分级2/2 + G0全量75/75 共 90/90 PASS。
- G0 经独立终审的候选台账：25/25 PDM 全域映射、510/510 字段编号完整（464 INCLUDE / 33 DEFER / 13 EXCLUDE）、82 候选实体、76 F02-1 最小拟建实体、137 显式外键断链为0；System Admin/Matching/CRM/公海与G0-ALL-05单一 PC 凭证全部静态闭环。A 正式签发 `G0_ACCEPTED / A_SIGNED`；不等于已运行 F02-1 业务 DDL。
- B 现行施工单 `07_重建工作区/F02_正式施工单_数据库模型与隔离开发_2026-10-08.md` §2，按原用户条件批准 `F02-1 AUTHORIZED_FOR_ISOLATED_IMPLEMENTATION / NOT_RUN`，仅在 `feat/f02-schema` 的一次性隔离 PG16 空库进行新 Current Schema 建表、迁移/回滚/幂等/约束/并发实测，提交真实代码 SHA、迁移/SQL、日志及 schema dump 交 A 复验。
- F02-2/3/4、F03/F04 正式施工、生产/已迁真实库、危险旧脚本及 B 合并 main 未获批准；C/H01 独立视觉审查，H02 未授权。正式 PDM Final / Current IA / Low-Fi 未改，`PRODUCT_BASELINE=NOT_READY`。以下此前标记“当前”的 G0-CL/G0-SC 状态均是历史，不再覆盖本签发。

---

# HISTORICAL｜2026-10-08 四域范围一致性补审（此前状态）

- 用户明确“同意，确定执行”：正式 A 补审单 `07_重建工作区/F02-G0_A主控范围一致性定向补审单_SystemAdmin_匹配_CRM_公海_2026-10-08.md` 已落库；发现 F02-1 正式施工单涉及 System Admin 身份、Demand/Match Result、CRM Follow-up 与公海历史保护，但 B `deferred-entity-register.tsv` 对应四实体仍整表延期、尚未提供完整替代承载映射。
- B 最新独立复验基点 `feat/f02-schema=ea14fb372a6ab598177d1a8a067e2b1df3ebf480`，CI `37712078050` SUCCESS。F01 13/13、G0 40/40、PG16 安全隔离通过；413 字段分流、53 拟建实体、96 静态 FK 断链 0。G0-CL-01/02 本轮确认闭环，**不重做**。
- B 当前仅在工程分支逐事实映射四项最低持久化身份/结果/历史/保护承载，必要时提出最小字段补纳并维持原矩阵闭合；只以“后续阶段处理”为由整表延期不可接受。A 根据新 SHA、矩阵及真实 CI 复验，仍由 A 独立判断 G0 签发。
- `G0_ENVIRONMENT_PASS / G0_CL01_CL02_PASS / G0_SCOPE_COVERAGE_PENDING / G0_MODEL_FREEZE_PENDING / G0_ACCEPTED=NO`；F02-1 尚未开始，条件授权未满足。F02-2/3/4、F03/F04、业务/已迁/生产数据库和 main 合并继续未获授权。
- PDM-01～25 Final、Current IA、Current Low-Fi 未改；C/H01 独立视觉返修、无 H02 放行；`PRODUCT_BASELINE=NOT_READY`。以下旧“当前最新”标题保留作历史过程，均不能覆盖本条。

---

# HISTORICAL｜2026-10-08 A 主控 G0-CL01/02 两类定向整改（此前状态）

- 用户明确“同意，确定执行”：A 独立复验 B `feat/f02-schema` HEAD `95fb1776eec535fb4e83b48d292034dfcb49c8fb`、GitHub CI `37710259345`（F01 13/13、G0 30/30 和 PG16 环境通过）。A 查出两类**字段拟施工集合完整性缺口**：纳入的 FK 引用被延期表；局部实体只纳个别业务字段却延期其身份键/必要关联。
- 主控定向整改单：`07_重建工作区/F02-G0_A主控最终门禁整改单_外键闭合与实体完整性_2026-10-08.md`，要求 B 只在工程分支修订纳入/延期范围、依赖与最小实体闭合，补负例及真实 CI；完成后交 A 独立验收。本次**不是 A 代 B 实施，也不是 G0 模型冻结通过**。
- `G0_ENVIRONMENT_PASS / G0_MODEL_FREEZE_PENDING / G0_CHANGE_REQUEST_USER_APPROVED / G0_ACCEPTED=NO`；F02-1 按已批准规则只有 A 签发 G0_ACCEPTED 才能在独立 PG16 空库开发。F02-2/3/4、F03/F04、main 合并、旧库、生产库均未获授权。
- C/H01 仍在独立视觉返修审查；PDM-01～25 Final、Current IA、Current Low-Fi 不变；`PRODUCT_BASELINE=NOT_READY`。本节覆盖以下前一阶段“现行最新状态”描述，以下保留为历史实况。

---

# HISTORICAL｜2026-10-08 F02-G0 与条件 F02-1 原始施工获批（前次状态）

- 用户明确“确认执行”：批准从本次全部 main 状态文件落库后最新提交新建 `feat/f02-schema`，并向 B 放行 F02-G0 独立测试环境/字段基线；**F02-G0 经 A 实证验收后**才可施工 F02-1 的 disposable PG16 新装 Current Schema 与真实测试。正式工作单 `07_重建工作区/F02_正式施工单_数据库模型与隔离开发_2026-10-08.md`、技术裁定 `07_重建工作区/F02_主控技术裁定与开工门禁_2026-10-08.md`。
- B 旧 `feat/f01-foundation` 上新增的三份 F02/F03/F04 Gate 材料已原文收录 main；旧分支不重置、未合并旧分支的落后主控内容；未来 F02 仅在新分支施工。
- A-G02-01～10 工程裁定包括：PG16 隔离、受控 `pg` 迁移器原子/checksum/advisory lock；新装与真实已迁库升级分流；独立多草稿、三级车型/source mapping、LockRequest/Lock/Waitlist 与 Refund 三态分离；F03 权限 hard DENY 不由数据库表存在隐含授权；F04 单入口 TypeScript/Fastify 仍需独立验证。
- **未授权**：F02-2 已迁/生产真实数据库兼容升级、F02-3 正式历史 CSV 导入、F02-4 业务跨域施工、F03/F04 正式施工、旧清库脚本、main 合并；未经批准不能访问任何真实用户数据。F02 Schema/DDL/集成测试当前为 `NOT_RUN`。
- F01=`ACCEPTED/MERGED_TO_MAIN` 不变；C/H01 仍待 A 修订复核与用户视觉确认，C 分支未修改/合并；PDM-01～25 Final、Current IA 和 Current Low-Fi 不变。
- 当前唯一执行指针 `F02_G0_THEN_F02_1_ISOLATED_H01_REVIEW`，`PRODUCT_BASELINE=NOT_READY`。以下是此前历史状态快照，不得覆盖本条最新状态。

---

# HISTORICAL｜2026-10-08 F01 验收及合并时的旧主控状态

- **F01 = ACCEPTED / MERGED_TO_MAIN / 用户“确认执行”**；A 主控完成 `feat/f01-foundation` 的 11 个提交、27 个新增文件检查，以及 [PR #1](https://github.com/suzhe868-arch/mb/pull/1) 合并；GitHub merge commit = `16354f9784cb187dfc44289d9e5010e1471b1b81`。
- 正式 A 验收记录与风险台账：`07_重建工作区/F01_工程基础验收与合并记录_2026-10-08.md`。验证来源为 B 分支 GitHub CI 运行 `37695813678`：13 项基础测试 + 5 项真实 PG 集成测试通过，隔离 PostgreSQL 16 停库/同一 HTTP 进程恢复成功。**main 合并后没有新增独立 CI 成功记录**，不可虚报。
- F01-1 / F01-2 / F01-3 / F01-4 全部 `ACCEPTED`，仅表示当前工作单的**基础 HTTP/环境/预检/开发隔离/PG ready**实现完成；当前脚本只做 JavaScript 语法检查/复制，未进行 TypeScript 类型编译。
- 工程未完成项保持明确：F02 业务 Schema/增量迁移、F03 身份权限、F04 现行接口、F05～F07 业务及 F08 综合验收；**218 历史接口不等于正式可运行接口**；F01 只实现健康检查端点和隔离 PG 测试，生产模式继续阻断。
- 设计 `design/h01-design-system` **仍在独立分支**，本次未修改/合并；H01 处于 `READY_FOR_A_REVIEW / CHANGES_REQUESTED / USER_VISUAL_PENDING`，设计样稿和品牌展厅风格需 A 与用户进一步确认，不得推断 H01/H02 已获最终批准。
- 当前唯一下一组行动：**C 的 H01 返修复核与用户视觉方向讨论 + B/A 的 F02/F03/F04 分阶段门禁与非破坏性技术方案准备**。实际数据库迁移/权限/API 施工需要各阶段另获用户批准；H02/H03 亦需按批准页面批次放行。
- **产品总基线仍 `NOT_READY`**；PDM-01～25 Final、Current IA、Current Low-Fi 和原工程启动门禁三份文档没有因 F01 验收而更改。
- 当前全局唯一指针为 `F01_ACCEPTED_H01_REVIEW_ENGINEERING_NEXT_GATE`；以下此前状态条目均是按产生日期保留的**历史快照**，不覆盖本次最新结论。

---

# HISTORICAL｜2026-10-08 A/B/C 三窗口协作与完整路线图落库（仅治理资料，F01 已完成）

- 用户明确回复“确认执行”，批准将 `A_B_C三窗口协作与验收规范.md`、`B工程完整施工路线图_F01至F08.md`、`C设计完整执行路线图_H01至H04.md` 写入 `main/07_重建工作区/`，并更新接力入口和全局状态说明。
- 本次修改定位：**三窗口管理、施工路线、验收/分支交接**。不触及 PDM-01～25 Final、Current IA、Current Low-Fi、工程门禁三份正式文档、业务代码、数据库、设计执行分支或历史资产。
- A 主控审核全局、合并决策；B 工程在 `feat/f01-foundation` 按获批范围处理 F01；C 设计在 `design/h01-design-system` 按获批范围处理 H01。F02～F08、H02～H04 **仅为预先路线规划**，必须另验依赖与阶段授权。
- main 会新增治理提交，B/C 分支不自动包含；B/C 须读取 `ref=main` 的三个最新文档而继续在原工作分支施工，不擅自合并/重置。B/C 在各自分支提交可复现证据，A 读取分支审查。
- 继续执行的全局唯一下一组任务：`F01 + H01` 双轨。产品总基线 `NOT_READY`；工程 Gate `PASS`，但 F01/H01 的实际施工/测试/验收不得因本次文档落库而虚记完成。
- H03 正式前端继续受“High-Fi 具体批次由用户确认 + 可联调 API + A 放行”约束；H04 联调/UAT/上线另行审批。

# HISTORICAL｜2026-10-08 工程启动门禁正式 PASS（F01 开工前快照）

- Gate：`PASS / USER_APPROVED / APPLIED`；不等于 F01/H01 已启动，更不等于工程代码、数据库、接口或页面已施工。
- 审查源 HEAD：`0ff42c5782192541baa06bf12f8bfdc285a5f5ca`；本次文档/状态同步提交为正式写入凭据。
- 历史工程资产：160/160 路径级分类（39 候选复用、30 必须改、1 禁恢复旧实现、6 数据校验、2 重新生成、30 重做测试基准、52 历史参考）。
- 旧接口：218/218 路径级 PDM 主要归属与施工责任（207 待逐字段审查、6 重构、4 禁恢复、1 可复用候选）；字段安全、运行路由和测试不在 Gate 内冒充 PASS。
- 差异风险：EG-01～32；新增当前需求：ADD-01～09；对应 F01～F08 施工单，H01～H04 设计/前端门禁。
- 门禁三份交付：
  - `07_重建工作区/工程启动门禁_历史工程复用与差异台账_2026-10-08.md`
  - `07_重建工作区/工程启动门禁_工程基础施工单与验收标准_2026-10-08.md`
  - `07_重建工作区/工程启动门禁_最终审查报告_2026-10-08.md`
- Current Authority：PDM-01～25 Final → Current IA → Current Low-Fi；历史 9/22 Delta / Legacy Engineering = INPUT_ONLY，不得直接施工。
- 特别封堵 PDM-06 草稿歧义：以 **多草稿自动保存、无手动保存按钮** 为 Current；历史“禁止自动保存”说法不是权威。
- 当前唯一下一组行动：**F01 工程基础环境与骨架 + H01 Design System / 核心模板（并行）**；F02～F04 仅可先做不破坏的设计准备。
- F01/H01 开工之后每项另按施工单验收；正式前端依然是“高保真确认一批 → 开发一批”。
- `PRODUCT_BASELINE=NOT_READY`；`ENGINEERING=STARTUP_GATE_PASS / FOUNDATION_READY / NO_CONSTRUCTION`；`HIGH_FI=READY_TO_START / NOT_STARTED`。

## HISTORICAL_AUDIT_TRAIL｜以下保留先前阶段真实状态，不再作为当前指针

## 2026-10-08｜工程启动流程已冻结，当前进入 Engineering Startup Gate

- PDM-01～25 Final：继续作为最高产品业务 Authority
- IA：`COMPLETE / FINAL_GAP_PASS`
- Low-Fi：`COMPLETE / FINAL_GAP_PASS`
- Engineering：`STARTUP_GATE_READY / NO_CONSTRUCTION`
- High-Fi / Design System：`PLANNED_AFTER_GATE / NOT_STARTED`
- 当前唯一下一步：**Engineering Startup Gate｜工程启动门禁**
- Gate 输入：`05_证据_E_工程总闭环待执行Delta/工程总闭环待执行Delta清单.md` + `09_历史工程资产基线/` + 当前可取得工程资产
- Gate 期间：只读、比对、分类、登记风险、生成施工单；**禁止正式业务代码 / Schema / API / 权限 / 前端施工**
- 旧工程与 9/22 Delta：只作候选复用/历史证据，必须按 `PDM Final → Current IA → Current Low-Fi` 重验
- Gate PASS 后双轨：`Engineering Foundation` + `High-Fi / Design System`
- 工程底层可先做：Database / Domain Model / Permission / State Machine / API / Service / Test Harness
- 正式前端：`High-Fi 确认一批 → Frontend 放行一批`
- High-Fi 不要求全部 Low-Fi SVG 逐张确认；先 Design System / 代表模板 / 核心页面 / 关键链路，再批量覆盖重复状态
- Engineering / High-Fi 如发现产品冲突：登记 Delta → 暂停受影响项 → 返回产品裁决 → 用户确认 → 更新 Authority → 再施工
- AI 为主执行者；用户保留新产品选择、Authority 修改、核心视觉方向、真实生产账号/环境、UAT/上线批准
- Product Baseline：`NOT_READY`

## 2026-10-08｜Low-Fi Batch 4 Final-gap 已执行，Low-Fi 全局集中对齐 COMPLETE

- `LF-B4-01 = PASS / USER_APPROVED / APPLIED`
- Low-Fi：`COMPLETE / FINAL_GAP_PASS`
- `FINAL_GAP_SCAN = PASS`
- `LOW_FI_BUSINESS_CONFLICT = 0`
- `LOW_FI_VALID_MISSING_CARRIER = 0`
- `LOW_FI_DANGLING_NAV_TARGET = 0`
- `LOW_FI_MISSING_PHYSICAL_ASSET = 0`
- `LOW_FI_STATE_ASSET_GAP = 0`
- `LOW_FI_INCOMPLETE_PAGE = 0`
- LockRequest V2 carrier index closure：`5 / 5 PASS / NO_PRODUCT_SEMANTIC_CHANGE`
- IA Current 已登记：`C01-M04 / E07-07 / E07-08 / E07-M04 / E07-M05`
- Low-Fi 新 Page / State / SVG：`0 / 0 / 0`
- 历史退役资产：`26 / RETAIN_FILE_NOT_CURRENT`
- IA：继续 `COMPLETE / FINAL_GAP_PASS`
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`
- Engineering：`READY_TO_START / NO_CONSTRUCTION`
- Product Baseline：`NOT_READY`
- 当前唯一下一步：**Engineering / 施工**
- Engineering 当前入口：`05_证据_E_工程总闭环待执行Delta/工程总闭环待执行Delta清单.md`

## 2026-10-08｜Low-Fi Batch 3 已执行，进入 Batch 4 Final-gap Scan

- `LF-B3-01～LF-B3-04 = PASS / USER_APPROVED / APPLIED`
- Low-Fi：`IN_PROGRESS / BATCH_1_2_3_APPLIED`
- `VALID_NEW_CARRIER_GAP = 0`
- `LOW_FI_NEW_PAGE = 0`
- `LOW_FI_NEW_STATE = 0`
- `LOW_FI_NEW_SVG = 0`
- IA stale carrier repair：`4 / 4 PASS / NO_PRODUCT_SEMANTIC_CHANGE`
- E01-01 机械假缺口：`FALSE_MISSING_CARRIER / DO_NOT_ADD`
- Publisher 电话诊断 Current 指针：`P03-02`
- C01-01 Lock 投影：`LOCK_REQUEST_PENDING / LOCKED_BY_SELF / LOCKED_BY_OTHER`
- Refund close 文案：`确认关闭`
- LF-B3 定向 stale-current scan：`0`
- IA：继续 `COMPLETE / FINAL_GAP_PASS`
- Engineering：`NO_CONSTRUCTION`
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`
- 当前唯一下一步：**Low-Fi Batch 4｜Final-gap Scan（冲突 / 遗漏 / 缺口 / 新选择）**

## 2026-10-08｜Low-Fi Batch 2 已执行，进入 Batch 3

- `LF-B2-01～LF-B2-07 = PASS / USER_APPROVED / APPLIED`
- Low-Fi：`IN_PROGRESS / BATCH_1_2_APPLIED`
- Page / Navigation / State / Asset Map：MD + CSV 已同步
- P06-07 Opportunity rules：`RETIRED / DO_NOT_RESTORE`
- Refund：主状态已收口为 `pending / refunded / closed`
- Announcement：同 Customer / UTC+8 业务日主动弹层全局最多 1 条
- 累计 `RETAIN_FILE_NOT_CURRENT = 26`
- LF-B2 定向 stale-current scan：`0`
- 反向发现的 IA stale carrier 已同步修复：`PASS / NO_PRODUCT_SEMANTIC_CHANGE`
- IA：继续 `COMPLETE / FINAL_GAP_PASS`
- Engineering：`NO_CONSTRUCTION`
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`
- 当前唯一下一步：**Low-Fi Batch 3｜后续明确新增 / 承载补齐审查**

## 2026-10-08｜Low-Fi Batch 1 已执行，进入 Batch 2

- `LF-B1-01～LF-B1-07 = PASS / USER_APPROVED / APPLIED`
- Low-Fi：`IN_PROGRESS / BATCH_1_APPLIED`
- Page / Navigation / State / Asset Map：MD + CSV 已同步
- 实际 Low-Fi SVG：保留页面已按 Final/IA 调整；25 个旧 SVG 已标记 `RETIRED / DO_NOT_RESTORE`
- LF-B1 定向 stale-current scan：`0`
- 反向发现的 IA stale carrier 已同步修复：`PASS / NO_PRODUCT_SEMANTIC_CHANGE`
- IA：继续 `COMPLETE / FINAL_GAP_PASS`
- Engineering：`NO_CONSTRUCTION`
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`
- 当前唯一下一步：**Low-Fi Batch 2｜明确废弃 / 已覆盖 / 不得恢复审查**

## 2026-10-08｜IA Batch 4 已执行，IA 全局集中对齐完成

- `IA-B4-01～IA-B4-06 = PASS / USER_APPROVED / APPLIED`
- IA：`COMPLETE / FINAL_GAP_PASS`
- Batch 4 关闭剩余 `CARRIER_DEFERRED = 4`
- 当前剩余 `CARRIER_DEFERRED = 0`
- IA Current 目录 11 份文件 current-row stale 扫描：`0`
- `FINAL_GAP_SCAN = PASS`
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`
- `PDM_FINAL_BUSINESS_SEMANTIC_CHANGE = 0`
- Low-Fi：`READY_TO_START`
- Engineering：`NO_CONSTRUCTION`
- 当前唯一下一步：**Low-Fi 全局集中对齐**

## 2026-10-08｜IA Batch 2 + 3 已执行，进入 Batch 4

- `IA-B2-01～IA-B2-19 = PASS / USER_APPROVED / APPLIED`
- `IA-B3-01～IA-B3-30 = PASS / USER_APPROVED / APPLIED`
- IA：`IN_PROGRESS / BATCH_1_2_3_APPLIED`
- 本轮关闭 stale carrier：`104`
- 当前剩余 `CARRIER_DEFERRED = 4`
- Low-Fi / Engineering：`NO_CONSTRUCTION`
- 当前唯一下一步：**IA Batch 4｜Final-gap Scan（冲突 / 遗漏 / 缺口 / 新选择）**

## 2026-10-08｜IA Batch 1 已执行

- `IA-B1-01～IA-B1-16 = PASS / USER_APPROVED / APPLIED`
- IA：`IN_PROGRESS / BATCH_1_APPLIED`
- 对应 16 条 stale carrier：`CARRIER_CLOSED_IA_BATCH1`
- Low-Fi / Engineering：`NO_CONSTRUCTION`
- 当前唯一下一步：**IA Batch 2｜明确废弃 / 已覆盖 / 不得恢复审查**

## 2026-10-07｜Final / Integrity 历史尾巴清理 PASS，IA 全局集中对齐 READY_TO_START

- PDM-01～25 Global Final Audit：`PASS`；
- Final / Integrity 历史阶段尾巴清理：`PASS`；
- 历史载体显式标注：`68 / 68`；
- 正式 Final 旧阶段尾巴修正：`12`；
- 正式 Final Integrity 旧阶段尾巴修正：`13`；
- `STALE_CURRENT_POINTER_UNQUALIFIED = 0`；
- `FINAL_BUSINESS_SEMANTIC_CHANGE = 0`；
- Current / History Boundary：`PASS`；
- 复核报告：`07_重建工作区/PDM-01至25_Final_Integrity历史阶段尾巴清理与Current_History边界复核_2026-10-07.md`；
- IA：`READY_TO_START / NO_CHANGES_APPLIED`；
- Low-Fi / Engineering：`NO_CONSTRUCTION`；
- `PRODUCT_BASELINE = NOT_READY`；
- 当前唯一下一步：**IA 全局集中对齐。**

## 2026-10-07｜PDM-01～25 全局最终总复核 PASS，进入历史阶段尾巴统一清理

- PDM-01～25：`25 / 25 COMPLETE / INTEGRITY_PASS`；
- Global Final Audit R1：4 组控制面 stale pointer 已全部修复；
- Global Final Audit R2：`PASS`；
- 正式报告：`07_重建工作区/PDM-01至25_全局跨域移交与全局不变量最终总复核_2026-10-07.md`；
- Cross-PDM Handoff：165 条 = 164 `HANDOFF_CLOSED` + 1 `HANDOFF_SUPERSEDED`；
- `HANDOFF_OPEN = 0`；
- `HANDOFF_ACCEPTED = 0`；
- `SOURCE_BACKWRITE_PENDING = 0`；
- `CROSS_PDM_CONFLICT = 0`；
- `GLOBAL_INVARIANT_CONFLICT = 0`；
- `NEGATIVE_CLAIMS_VERIFIED = PASS`；
- IA / Low-Fi / Engineering：`NO_CONSTRUCTION`；
- `PRODUCT_BASELINE = NOT_READY`；
- 当前唯一下一步：**PDM-01～25 Final / Integrity 历史阶段尾巴统一清理与 Current / History 边界标注。**

## 2026-10-07｜PDM-25 Final Closeout 完成，进入 PDM-01～25 全局最终总复核

- PDM-25 Final Domain Overview：`USER_FINAL_APPROVED`；
- 用户随后明确：`确定执行`；
- PDM-25：`COMPLETE / INTEGRITY_PASS`；
- 正式 Final：`07_重建工作区/PDM-25_最终完整规则.md`；
- Final Integrity：`07_重建工作区/PDM-25_最终完整性复核_2026-10-07.md / PASS`；
- `PDM25_FORMAL_UNITS = 37`；
- 24 / 24 incoming handoff：`HANDOFF_CLOSED / source_backwrite=YES`；
- PDM-01～24 Final / Integrity source backwrite：`24 / 24 DONE`；
- `SOURCE_DECISION_COVERAGE = 100%`；
- `FINAL_TO_SOURCE_TRACEABILITY = 100%`；
- `SEMANTIC_INTEGRITY = PASS`；
- `NEGATIVE_CLAIMS_VERIFIED = PASS`；
- `IMPLEMENTATION_READY = PASS`；
- IA / Low-Fi / Engineering：`NO_CONSTRUCTION`；
- `PRODUCT_BASELINE = NOT_READY`，仍需完成 PDM-01～25 全局最终总复核以及后续 carrier 集中对齐；
- 当前唯一下一步：**PDM-01～25 全局 Cross-PDM / Handoff / Global Invariant 最终总复核。**

## 2026-10-07｜PDM-25 Prefinal R1 修复完成，R2 PASS / FINAL_CANDIDATE_READY

- `P25-LIA-01～P25-LIA-03 = PASS / USER_APPROVED / APPLIED`；
- PDM-25 专属信息保真检查卡已建立；
- HO-P20-P25-001：copy-before-view / Customer Safe Projection 字段级安全 landing 已补齐；
- HO-P21-P25-001：Internal Mode / 5 分钟后台退出 / entry_context landing 已补齐；
- `R1_REPAIR_CLOSED = 3 / 3`；
- `SOURCE_TO_ATOM = PASS`；
- `ATOM_TO_SOURCE = PASS`；
- `SOURCE_DECISION_COVERAGE = 100%`；
- `UNMAPPED = 0`；
- `FINAL_TO_SOURCE_TRACEABILITY = 100%`；
- `SEMANTIC_COMPLETENESS = PASS`；
- `NEGATIVE_CLAIMS_VERIFIED = PASS`；
- `IMPLEMENTATION_READY = PASS`；
- `PDM25_FORMAL_UNITS = 37`；
- `PDM25_FINAL_CANDIDATE_READY = YES`；
- 24 / 24 incoming handoff landing 已通过，但仍保持 `HANDOFF_ACCEPTED`，最终批准前不关闭 / 不 source backwrite；
- Final Overview 候选：`07_重建工作区/PDM-25_最终完整规则总览_待用户批准.md`；
- IA / Low-Fi / Engineering：`NO_CONSTRUCTION`；
- 当前唯一下一步：**用户最终审查 / 批准 PDM-25 Final Domain Overview。**

## 2026-10-07｜PDM-25 Batch 4 已批准并执行，进入 Prefinal Integrity

- `P25-B4-01～P25-B4-04 = PASS / USER_APPROVED / APPLIED`；
- `CHOICES = 1A / 2A / 3A / 4A`；
- Final-gap Scan：`PASS`；
- 审计保留动作发生当时的身份上下文，后续角色 / 门店 / scope 变化不回写旧事件；
- UTC+8 统一业务自然日与展示解释，不把 source / received / planned / actual 等不同时间事实压成一个时间；
- 幂等 / retry-safe 不制造重复业务成功历史，attempt 与 actual success 分离；
- 采用 4A：不规定全局统一 Audit Log retention 天数；来源域要求永久保留的业务历史继续永久真实，技术日志 retention / 归档实现留 Engineering / 合规；
- `COMPLETED_PDM_HARD_CONFLICT = 0`；
- `SEMANTIC_DETAIL_GAP_UNRESOLVED = 0`；
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`；
- `INCOMING_HANDOFF_GAP = 0`；
- 24 / 24 incoming handoff 继续 `HANDOFF_ACCEPTED`，PDM-25 Final Closeout 前不关闭 / 不 source backwrite；
- IA / Low-Fi / Engineering：`NO_CONSTRUCTION`；
- 当前唯一下一步：**PDM-25 Final 前完整性复核（Prefinal Integrity）。**

## 2026-10-07｜PDM-25 Batch 3 已批准并执行，进入 Batch 4 Final-gap Scan

- `P25-B3-01～P25-B3-04 = PASS / USER_APPROVED / APPLIED`；
- Conflict Isolation：`PASS`；
- `MISCLASSIFIED_PRODUCT_CHOICE = 0`；
- `DUPLICATE_RULE_CREATION = 0`；
- version 模型只承接来源域已存在版本语义，不给普通配置强造版本状态机；
- 失败 / 跳过 / 去重 / 无有效结果不得伪装成成功；
- 合法批量 mutation 保留逐对象结果，并服从来源域是否允许 partial success；
- 组合入口不合并独立 domain action，分别 Guard / result / history；
- 24 / 24 incoming handoff 继续 `HANDOFF_ACCEPTED`，Final Closeout 前不关闭 / 不 source backwrite；
- `COMPLETED_PDM_HARD_CONFLICT = 0`；
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`；
- IA / Low-Fi / Engineering：`NO_CONSTRUCTION`；
- 当前唯一下一步：**PDM-25 Batch 4｜Final-gap Scan（冲突 / 遗漏 / 缺口 / 新选择）。**

## 2026-10-07｜PDM-25 Batch 2 已批准并执行，进入 Batch 3

- `P25-B2-01～P25-B2-08 = PASS / USER_APPROVED / APPLIED`；
- Reverse Conflict Scan：`PASS / FALSE_DEPRECATION_COUNT=0`；
- Customer Merge 不得因历史审计项恢复；
- 独立 Recommendation qualification / P06-06 不得恢复；
- 独立“调价”Action / permission 不得恢复；
- 不新增独立 `can_call_wholesale_phone`；
- Announcement 旧三档频率 / 重新发布重置触达模型不得恢复；
- “详情 Banner 不是强制模块”旧语义不得恢复，VEHICLE_DETAIL 继续是固定 placement 能力；
- reason 不做全局必填；
- 历史审计对象清单不得作为 Current 业务能力复活清单；
- 24 / 24 incoming handoff 继续 `HANDOFF_ACCEPTED`，Final Closeout 前不关闭 / 不 source backwrite；
- `COMPLETED_PDM_HARD_CONFLICT = 0`；
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`；
- IA / Low-Fi / Engineering：`NO_CONSTRUCTION`；
- 当前唯一下一步：**PDM-25 Batch 3｜明确知情修改 / 后续明确新增审查。**

## 2026-10-07｜PDM-25 Batch 1 已批准并执行，进入 Batch 2

- `P25-A01～P25-A17 = PASS / USER_APPROVED / APPLIED`；
- Batch 1 confirmed count = 17；
- 审计只读、重要 mutation 可追溯、reason 按来源域决定、普通浏览不强制高等级审计；
- Current Projection / Historical Fact 分离，纠错采用追加事实，不抹除真实历史；
- 重要配置 before/after/actor/time 可追溯，新配置默认不追改已固化 snapshot；
- 统一业务自然日：`Asia/Shanghai (UTC+8)`；
- 权限撤销后旧页面/session/deep-link/敏感 payload 不再构成授权；
- human actor / system actor 必须可区分；
- 幂等、唯一 active、并发 winner、不重复扣减、不超退等只冻结产品结果，不冻结 DB/MQ/事务框架；
- 24 / 24 incoming handoff 继续 `HANDOFF_ACCEPTED`，Final Closeout 前不得关闭或 source backwrite；
- `COMPLETED_PDM_HARD_CONFLICT = 0`；
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`；
- IA / Low-Fi / Engineering：`NO_CONSTRUCTION`；
- 当前唯一下一步：**PDM-25 Batch 2｜明确废弃 / 已覆盖 / 不得恢复审查。**

## 2026-10-07｜PDM-25 Startup Gate 已批准并执行

- `P25-R00 = USER_APPROVED / APPLIED`；
- PDM-25 定位：全项目审计 / 历史 / 时区 / 配置版本 / 终态真实性 / 横切完整性的唯一产品 Authority；
- 工作版：`07_重建工作区/PDM-25_审计历史时区配置版本终态与横切完整性_规则原子重建_工作版.md`；
- target=PDM-25 的 24 / 24 incoming handoff：`HANDOFF_ACCEPTED`；
- `INCOMING_HANDOFF_GAP = 0`；
- `COMPLETED_PDM_HARD_CONFLICT = 0`；
- `GLOBAL_INVARIANT_CONFLICT = 0`；
- 历史 R12 P11“Customer Merge 审计”仅保留历史 carrier，不恢复 V1 Customer Merge；
- 统一业务时区：`Asia/Shanghai (UTC+8)`；
- IA / Low-Fi / Engineering：`NO_CONSTRUCTION`；
- 当前唯一下一步：**PDM-25 Batch 1｜稳定一致规则审查。**

## 2026-10-07｜PDM-24 Final Closeout COMPLETE

- 用户已最终批准 PDM-24 Final Domain Overview，并随后明确“确定执行”；
- 正式 Authority：`07_重建工作区/PDM-24_最终完整规则.md`；
- Final Integrity：`07_重建工作区/PDM-24_最终完整性复核_2026-10-07.md / PASS`；
- `PDM-24 = COMPLETE / INTEGRITY_PASS`；
- 正式规则 / 裁决单元：40；
- `HO-P20-P24-001 = HANDOFF_CLOSED / source_backwrite=YES`；
- PDM-20 §40 旧“详情 Banner 可选”已正式回写为：VEHICLE_DETAIL 为固定广告位能力，内容可为空；
- `HO-P24-P25-001 = HANDOFF_OPEN`；
- PDM-25 当前 incoming handoff：24 条，全部等待 Startup Gate 正式接收；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：**PDM-25 Startup Gate。**

## 2026-10-07｜PDM-24 Prefinal R2 PASS，Final Candidate Ready

- R2 报告：`07_重建工作区/PDM-24_Final前完整性复核_R2_2026-10-07.md`；
- `PDM24_PREFINAL_R2 = PASS / FINAL_CANDIDATE_READY`；
- `PDM24_FORMAL_UNITS = 40`；
- Source→Atom / Atom→Source / Semantic Completeness / Completed-PDM Invariant / Negative Claims 均 PASS；
- `MISSING_RULE_UNRESOLVED = 0`；
- `SEMANTIC_DETAIL_GAP_UNRESOLVED = 0`；
- `COMPLETED_PDM_HARD_CONFLICT = 0`；
- `INCOMING_HANDOFF_GAP = 0`；
- `OUTGOING_HANDOFF_GAP = 0`；
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`；
- PDM-20 旧“详情 Banner 可选”已确认是待 Final Closeout source backwrite 的历史尾巴，不构成当前硬冲突；
- `HO-P20-P24-001 = HANDOFF_ACCEPTED`；
- `HO-P24-P25-001 = HANDOFF_OPEN`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：**形成 PDM-24 Final Domain Overview，并提交用户最终批准。**

## 2026-10-07｜PDM-24 Prefinal R1 修复已执行，进入 R2

- `PREFINAL_R1 = REPAIR_REQUIRED / NO_HARD_CONFLICT`；
- R1 报告：`07_重建工作区/PDM-24_Final前完整性复核_R1_2026-10-07.md`；
- `P24-LIA-01～P24-LIA-04 = PASS / USER_APPROVED / APPLIED`；
- LIA-01：公告日期 / 每日频控统一按 Asia/Shanghai（UTC+8）业务自然日解释，结束日期当天仍有效；
- LIA-02：Announcement 到期 / 停用进入 history、不删除；合法周期内可再启用，过期需新排期；
- LIA-03：采用 3A；当天第一次进入被其他主动弹层占用时，Announcement 当天不补弹；
- LIA-04：无效公告周期不得启用；Banner 非空 target 保存 / 启用时必须合法，后续失效降为纯展示；
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`；
- `HO-P20-P24-001 = HANDOFF_ACCEPTED`；
- `HO-P24-P25-001 = HANDOFF_OPEN`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：**PDM-24 Prefinal Integrity R2。**

## 2026-10-07｜PDM-24 Batch 4 已批准并执行，进入 Prefinal Integrity

- `P24-B4-01～P24-B4-07 = PASS / USER_APPROVED / APPLIED`；
- B4-01：用户修订为“公告设置有效周期 + 自动弹出开关；同一客户每天公告主动弹层全局最多 1 条；取消仅首次一次/三档频率”；
- B4-02：采用 2A，普通编辑不重置当天展示事实；需要新一轮触达时新建公告；
- B4-03：多条有效公告当天第一次进入按后台排序择一，不补弹其他公告；
- B4-04：补齐标题、正文、开始/结束日期、自动弹出开关等字段；
- B4-05：采用 5A，Banner V1 继续仅内部白名单合法目标，不开放外链；
- B4-06：Banner 停用不删除，可再启用并重新校验；
- B4-07：`HO-P24-P25-001 = HANDOFF_OPEN` 已正式登记；
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`；
- `HO-P20-P24-001 = HANDOFF_ACCEPTED`，Final Closeout 前仍不关闭、不 source backwrite；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：**PDM-24 Final 前完整性复核（Prefinal Integrity）**。

## 2026-10-07｜PDM-24 Batch 3 已执行并完成窗口切换交接

- `BATCH_3 = NO_NEW_ATOMS / PASS / USER_APPROVED / APPLIED`；
- `BATCH_3_CONFLICT_ISOLATION = PASS`；
- `NEW_INDEPENDENT_ATOMS = 0`；
- `MISCLASSIFIED_PRODUCT_CHOICE = 0`；
- 窗口交接快照：`07_重建工作区/PDM-24_窗口切换交接_2026-10-07.md`；
- `HO-P20-P24-001 = HANDOFF_ACCEPTED`，未关闭、未 source backwrite；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：**PDM-24 Batch 4 Final-gap Scan。**

## 2026-10-07｜PDM-24 Batch 2 已执行并进入 Batch 3

- `P24-B2-01～P24-B2-12 = PASS / USER_APPROVED / APPLIED`；
- Reverse Conflict Scan = `PASS / FALSE_DEPRECATION_COUNT=0`；
- Batch 3 later-addition / explicit-change scan = `NO_NEW_ATOMS / PENDING_USER_REVIEW`；
- `NEW_INDEPENDENT_ATOMS = 0`；
- `DUPLICATE_RULE_CREATION = 0`；
- `MISCLASSIFIED_PRODUCT_CHOICE = 0`；
- `HO-P20-P24-001` 继续 `HANDOFF_ACCEPTED`；
- completed-PDM hard conflict = 0；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：**用户审查 PDM-24 Batch 3“无新增独立规则原子”结论。**

## 2026-10-07｜PDM-24 Batch 1 已执行并进入 Batch 2

- `P24-A01～P24-A15 = PASS / USER_APPROVED / APPLIED`；
- Batch 1 confirmed count = 15；
- Reverse Conflict Scan = `PASS / FALSE_DEPRECATION_COUNT=0`；
- Batch 2 候选：`P24-B2-01～P24-B2-12 / PENDING_USER_REVIEW`；
- Batch 2 仅包含明确废弃 / 已覆盖 / DO_NOT_RESTORE 方向，不引入新产品选择；
- `HO-P20-P24-001` 继续 `HANDOFF_ACCEPTED`，未提前关闭；
- completed-PDM hard conflict = 0；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：**用户审查 PDM-24 Batch 2。**

## 2026-10-07｜PDM-24 Startup Gate PASS 并进入 Batch 1

- `P24-R00 = USER_APPROVED / APPLIED`；
- `P24-R01 = USER_APPROVED / APPLIED`：VEHICLE_DETAIL 为车辆详情页固定广告位能力；无有效 Banner 时可不展示具体广告内容，但广告位能力本身固定存在；
- `HO-P20-P24-001 = HANDOFF_ACCEPTED`，Final Closeout 前不关闭、不 source backwrite；
- completed-PDM hard conflict = 0；incoming gap = 0；
- 当前正式 placement = `HOME_TOP / VEHICLE_DETAIL`；
- 不建设通用消息中心、营销自动化平台或万能 Placement Engine；
- Batch 1 候选：`P24-A01～P24-A15 / PENDING_USER_REVIEW`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：**用户审查 PDM-24 Batch 1。**

## 2026-10-07｜PDM-23 Final Closeout COMPLETE

- 用户已最终批准并明确“确认执行”；
- 正式 Authority：`07_重建工作区/PDM-23_最终完整规则.md`；
- Final Integrity：`07_重建工作区/PDM-23_最终完整性复核_2026-10-07.md / PASS`；
- 65 个正式规则 / 裁决单元全部进入 Final；
- 10 / 10 incoming handoff = `HANDOFF_CLOSED / source_backwrite=YES`；
- 10 / 10 来源 PDM Final 已完成反向回写；
- `HO-P23-P25-001 = HANDOFF_OPEN`；
- PDM-23 = `COMPLETE / INTEGRITY_PASS`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：**PDM-24 Startup Gate**。

## 2026-10-07｜PDM-23 Prefinal R1 修复已执行，R2 PASS

- Prefinal R1 = `REPAIR_REQUIRED / NO_HARD_CONFLICT`；
- `P23-LIA-01～P23-LIA-04 = PASS / USER_APPROVED / APPLIED`；
- LIA-01：同一业务事件/同一通知阶段原则上只通知一次；Consultation 同一次 SLA timeout 原则上只做一次群告警；
- LIA-02：SLA 群告警最小必要内容 + 敏感字段最小化 + deep-link 重鉴权；
- LIA-03：持续 Incident 重复告警是普通去重例外；只按已配置 cadence，不恢复旧固定 2/5/15 分钟默认；
- LIA-04：微信“可接入”≠“当前已启用”；无明确 customer-WeChat allowlist + 合法平台能力/模板 + 用户授权前不自动发送；
- Prefinal R2 = `PASS / FINAL_CANDIDATE_READY`；
- 正式规则 / 裁决单元 = 65；
- missing rule = 0；semantic detail gap = 0；completed-PDM hard conflict = 0；
- 10 / 10 incoming handoff 继续 HANDOFF_ACCEPTED，最终批准前不关闭；
- HO-P23-P25-001 继续 HANDOFF_OPEN；
- Final Overview：`07_重建工作区/PDM-23_最终完整规则总览_待用户批准.md`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：**用户最终审查 / 批准 PDM-23 最终完整规则总览。**

## 2026-10-07｜PDM-23 Batch 4 历史重扫重建版已批准并执行

- 历史重扫已完成：9/06 SSOT/Decision、R12、001～078、Current P09 carrier 与 completed-PDM Final 已复核；
- 旧 `P23-B4-01～P23-B4-06` 保留为历史草案，状态 `SUPERSEDED_NOT_APPROVED_NOT_APPLIED`；
- 新正式 Batch 4：`P23-B4R-01～P23-B4R-10 = PASS / USER_APPROVED / APPLIED`；
- 微信小程序订阅消息：保留未来接入能力，当前不作为核心业务依赖，不建通用客户消息中心；
- 飞书：保留公司总开关、员工个人提醒开关、合法总群路由；取消重复的独立“群总开关”；
- 员工级“其 SLA 超时是否进入飞书总群”正式保留，默认开启，由合法管理/配置能力控制；
- 未来独立 App Push 仅预留 notification channel 接入能力，V1 不实现；PC 主动 Push V1 不做；
- `HO-P23-P25-001` 已正式登记为 HANDOFF_OPEN；
- completed-PDM hard conflict = 0；local product choice unresolved = 0；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：**PDM-23 Final 前完整性复核（Prefinal Integrity）**。

## 2026-10-07｜PDM-23 窗口切换交接已保存｜Batch 4 暂停审查并要求重建

- Startup Gate + Batch 1～3 = 已正式 PASS / APPLIED；
- 原 P23-B4-01～P23-B4-06 完整保留，但改为“旧版 Batch 4 草案”，未批准、未执行；
- 本窗口新增讨论已保存：微信小程序消息能力、飞书多层开关、员工级总群 SLA 超时通告开关、PC 暂不做主动通知、未来 App Push 仅预留；
- “员工级总群 SLA 超时通告开关”当前只标记为 conversation-recovered candidate，必须历史重扫；
- 交接文件：`07_重建工作区/PDM-23_窗口切换交接_2026-10-07.md`；
- 当前门禁：`BATCH_4_REVIEW_SUSPENDED / REBUILD_REQUIRED_AFTER_HISTORICAL_RESCAN`；
- 当前唯一下一步：新窗口读取交接快照并重新扫描通知历史，再生成完整 Batch 4；
- IA / Low-Fi / Engineering 未施工。

## 2026-10-07｜PDM-23 Batch 3 已执行并进入 Batch 4

- `P23-B3-01～P23-B3-16 = PASS / USER_APPROVED / APPLIED`；
- Batch 4 Final-gap 已形成：`P23-B4-01～P23-B4-06 / PENDING_USER_REVIEW`；
- 真正产品选择 = 1；稳定收口项 = 5；
- 推荐选择：`1A`；
- P23→P25 outgoing handoff 尚待本批批准；
- 10 / 10 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- completed-PDM hard conflict = 0；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-23 Batch 4。

## 2026-10-07｜PDM-23 Batch 2 已执行并进入 Batch 3

- `P23-B2-01～P23-B2-14 = PASS / USER_APPROVED / APPLIED`；
- Reverse Conflict Scan = `PASS / FALSE_DEPRECATION_COUNT=0`；
- Batch 3 已形成：`P23-B3-01～P23-B3-16 / PENDING_USER_REVIEW`；
- Batch 3 未引入新产品选择：`NEW_PRODUCT_CHOICE_INTRODUCED=0`；
- 10 / 10 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- completed-PDM hard conflict = 0；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-23 Batch 3。

## 2026-10-07｜PDM-23 Batch 1 已执行并进入 Batch 2

- `P23-A01～P23-A20 = PASS / USER_APPROVED / APPLIED`；
- Batch 2 Reverse Conflict Scan 已形成：`P23-B2-01～P23-B2-14 / PENDING_USER_REVIEW`；
- Reverse Conflict Scan = `PASS / FALSE_DEPRECATION_COUNT=0`；
- 10 / 10 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- completed-PDM hard conflict = 0；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-23 Batch 2。

## 2026-10-07｜PDM-23 Startup Gate PASS 并进入 Batch 1

- `P23-R00 = USER_APPROVED / APPLIED`；
- PDM-23 核心定位：通知 / 飞书 / 主动提醒 / 夜间免打扰 / Incident 通知投递 / 通知日志唯一 Authority；
- 10 / 10 incoming handoff = `HANDOFF_ACCEPTED`；
- completed-PDM hard conflict = 0；incoming gap = 0；
- Current P09 carrier 已读取，但不等同工程实现；
- Batch 1 已形成：`P23-A01～P23-A20 / PENDING_USER_REVIEW`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-23 Batch 1。

## 2026-10-07｜PDM-22 Final Closeout COMPLETE

- 用户已对 PDM-22 Final Domain Overview 最终批准并确认执行；
- 正式 Final：`07_重建工作区/PDM-22_最终完整规则.md`；
- Final Integrity：`07_重建工作区/PDM-22_最终完整性复核_2026-10-07.md / PASS`；
- PDM-22 = `COMPLETE / INTEGRITY_PASS`；
- 正式规则 / 裁决单元 = `58`；
- 18 / 18 incoming handoff = `HANDOFF_CLOSED / source_backwrite=YES`；
- PDM-22 → PDM-23 / PDM-25 两条 outgoing handoff 继续 `HANDOFF_OPEN`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：`PDM-23 Startup Gate`。

## 2026-10-07｜PDM-22 R1 修复已执行；Prefinal R2 PASS

- `P22-LIA-01～P22-LIA-06 = PASS / USER_APPROVED / APPLIED`；
- R1 repair closed = `6 / 6`；
- PDM-22 → PDM-23 / PDM-25 outgoing handoff 已正式登记为 `HANDOFF_OPEN`；
- Final 前完整性复核 R2 = `PASS / FINAL_CANDIDATE_READY`；
- 正式规则 / 裁决单元 = `58`；
- missing=0；semantic gap=0；completed-PDM conflict=0；incoming gap=0；outgoing gap=0；local product choice=0；
- 18/18 incoming handoff 仍保持 `HANDOFF_ACCEPTED`，最终批准前不关闭；
- Final Domain Overview 已生成：`07_重建工作区/PDM-22_最终完整规则总览_待用户批准.md`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户最终审查 / 批准 PDM-22 Final Domain Overview。

## 2026-10-07｜PDM-22 Batch 4 已执行；Final 前完整性复核 R1 = REPAIR_REQUIRED

- `P22-B4-01～P22-B4-08 = PASS / USER_APPROVED / APPLIED`；
- 用户选择：`1A / 2A / 3同意 / 4A / 5A / 6A / 7同意 / 8同意`；
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`；
- Prefinal R1：`REPAIR_REQUIRED / NO_HARD_CONFLICT`；
- missing=2；semantic gap=3；incoming landing gap=3；outgoing handoff gap=1 group；
- 修复候选：`P22-LIA-01～P22-LIA-06 / PENDING_USER_REVIEW`；
- 18/18 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 P22-LIA-01～P22-LIA-06。

## 2026-10-07｜PDM-22 Batch 3 已批准执行并进入 Batch 4

- `P22-B3-01～P22-B3-09 = PASS / USER_APPROVED / APPLIED`；
- Conflict Isolation = `PASS / MISCLASSIFIED_PRODUCT_CHOICE=0`；
- `NEW_DOMAIN_STATE_MACHINE=0`；
- 对 18 条 incoming handoff 与 R12 / PDM-01～21 Final 再扫描后形成 Batch 4：`P22-B4-01～P22-B4-08 / PENDING_USER_REVIEW`；
- Batch 4 含 5 个真正 PC 产品承载选择，推荐 `1A / 2A / 4A / 5A / 6A`；
- B4-03 / B4-07 / B4-08 为稳定 carrier 补漏，不新增业务选择；
- 18/18 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-22 Batch 4。

## 2026-10-07｜PDM-22 Batch 2 已批准执行并进入 Batch 3

- `P22-B2-01～P22-B2-11 = PASS / USER_APPROVED / APPLIED`；
- Reverse Conflict Scan = `PASS / FALSE_DEPRECATION_COUNT=0`；
- B2-01 已按已执行的 `P22-ADD-01` 明确：PC 网页账号密码绑定原 employee_id，不创建第二 Employee；
- 已形成 Batch 3 Conflict Isolation：`P22-B3-01～P22-B3-09 / PENDING_USER_REVIEW`；
- Batch 3 只补齐 PDM-01～21 已冻结上游语义的 PC carrier，不新增业务状态机；
- `MISCLASSIFIED_PRODUCT_CHOICE=0`，`NEW_DOMAIN_STATE_MACHINE=0`；
- 18/18 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-22 Batch 3。

## 2026-10-07｜PDM-22 新增 PC 网页登录身份规则已执行

- 用户明确确认：现有销售 / 经理 / 店长 Employee 不新建第二身份，而是在原 `employee_id` 上增加 PC 网页“登录账号 + 密码”；
- `P22-ADD-01 = USER_APPROVED / APPLIED`；
- 客户端 / 销售端微信侧入口与 PC 网页后台认证正式分层；
- PC 登录成功后继续读取原 Employee 的角色、permission、data scope、account status 与 object state；
- 开通 PC 登录不增加业务权限，Employee 停用后 PC 登录及旧登录态立即失效；
- System Admin 继续独立系统身份 / 独立登录凭证，不与 Employee PC 登录合并；
- 4S 默认不开 PC，仅明确授予 PC 车辆管理能力时才允许启用对应登录；
- B2-01 已同步补充“网页认证 ≠ 第二 Employee 身份”的边界；
- Batch 2 本身仍为 `P22-B2-01～P22-B2-11 / PENDING_USER_REVIEW`，未偷渡通过；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：继续审查 PDM-22 Batch 2。

## 2026-10-07｜PDM-22 Batch 1 用户批准并执行

- 用户对 `P22-A01～P22-A22` 全部同意，随后确认执行；
- `P22-A01～P22-A22 = PASS / USER_APPROVED / APPLIED`；
- 22 条稳定 PC 后台 / 配置 / Integration 基础规则正式进入当前工作 Authority；
- Batch 2 Reverse Conflict Scan = `PASS / FALSE_DEPRECATION_COUNT=0`；
- 形成 `P22-B2-01～P22-B2-11 / PENDING_USER_REVIEW`；
- 旧 System Admin 专属后台、独立 Recommendation qualification、旧 Refund 两状态、旧 Collector Phone API 方向、旧内部价权限删除、mapping pending 阻断、source_type 冻结等均进入明确废弃 / 替代扫描；
- 18 / 18 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-22 Batch 2。

## 2026-10-07｜PDM-22 Startup Gate 通过并进入 Batch 1 审查

- 用户已批准并明确“确认执行” `P22-R00`；
- PDM-22 核心定位已补齐采集系统三个固定车源 API、名邦 Integration API 与 Collector 电话回传链路；
- Startup Gate = `PASS`；
- CROSS_PDM_HANDOFF_REGISTER 机械复核 target=PDM-22 = 18 条；
- 18 / 18 incoming handoff 已由 `HANDOFF_OPEN` → `HANDOFF_ACCEPTED`；
- completed-PDM hard conflict = 0；
- incoming handoff gap = 0；
- global invariant conflict = 0；
- 旧 Recommendation 独立资格、旧 Refund 两状态、旧内部价 permission 删除、旧 Mingbang→Collector Phone API 等均已隔离为 stale，不进入 Batch 1；
- 工作版：`07_重建工作区/PDM-22_PC后台信息架构业务管理配置归属上游运行管理_规则原子重建_工作版.md`；
- Batch 1 候选：`P22-A01～P22-A22`，状态 `PENDING_USER_REVIEW`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-22 Batch 1。

## 2026-10-06｜PDM-21 Final 正式发布并完成 Closeout

- 用户明确“最终批准确认执行”；
- 正式 Authority：`07_重建工作区/PDM-21_最终完整规则.md`；
- Final Integrity：`07_重建工作区/PDM-21_最终完整性复核_2026-10-06.md / PASS`；
- `PDM-21 = COMPLETE / INTEGRITY_PASS`；
- 56 个正式规则 / 用户裁决单元全部进入 Final；
- 19 / 19 incoming handoff = `HANDOFF_CLOSED / SOURCE_BACKWRITE_DONE`；
- 来源 PDM-02～PDM-20 共 19 个 Final 已反向回写；
- PDM-21 → PDM-23 / PDM-25 两条 outgoing handoff 继续 `HANDOFF_OPEN`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：PDM-22 Startup Gate。

## 2026-10-06｜PDM-21 Prefinal R1 修复执行完成，R2 PASS

- 用户对 `P21-LIA-01～P21-LIA-09` 全部同意，随后明确“确认执行”；
- `P21-LIA-01～P21-LIA-09 = PASS / USER_APPROVED / APPLIED`；
- `R1_REPAIR_CLOSED = 9 / 9`；
- PDM-21 → PDM-23 / PDM-25 两条 outgoing handoff 已正式登记并保持 `HANDOFF_OPEN`；
- 19 / 19 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- Final 前完整性复核 R2 = `PASS / FINAL_CANDIDATE_READY`；
- `MISSING_RULE_UNRESOLVED = 0`；
- `SEMANTIC_DETAIL_GAP_UNRESOLVED = 0`；
- `COMPLETED_PDM_INVARIANT_CONFLICT = 0`；
- `INCOMING_HANDOFF_GAP = 0`；
- `OUTGOING_HANDOFF_GAP = 0`；
- Final Overview：`07_重建工作区/PDM-21_最终完整规则总览_待用户批准.md`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户最终批准 PDM-21 Final Domain Overview。

## 2026-10-06｜PDM-21 Batch 4 批准执行并完成 Final 前 R1

- 用户裁决 `P21-B4-01～P21-B4-07 = 1A～7A`，随后明确“确认执行”；
- `P21-B4-01～P21-B4-07 = PASS / USER_APPROVED / APPLIED`；
- 用户补充确认：正常车辆详情 Internal Mode 有“隐藏车源”，hidden Vehicle 对应“恢复显示 / 解除隐藏”；hidden/restore 与 offline/relist 严格分离；
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`；
- Final 前完整性复核 R1 = `REPAIR_REQUIRED / NO_HARD_CONFLICT`；
- 报告：`07_重建工作区/PDM-21_Final前完整性复核_R1_2026-10-06.md`；
- 形成 `P21-LIA-01～P21-LIA-09 / PENDING_USER_REVIEW`；
- R1：missing=5，semantic detail=3，incoming landing gap=7，outgoing handoff gap=1 group；
- completed-PDM hard conflict = 0；
- 19 / 19 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 P21-LIA-01～P21-LIA-09。

## 2026-10-06｜PDM-21 Batch 3 用户批准并执行

- 用户对 `P21-B3-01～P21-B3-10` 全部同意，随后明确“确认执行”；
- `P21-B3-01～P21-B3-10 = PASS / USER_APPROVED / APPLIED`；
- Conflict Isolation = `PASS / MISCLASSIFIED_PRODUCT_CHOICE=0`；
- Batch 4 Gap / Choice Scan 已完成；
- 形成 `P21-B4-01～P21-B4-07 / PENDING_USER_REVIEW`，推荐 `1A～7A`；
- 7 项分别为：4S Internal Mode、敏感 Action 页面归位、隐藏车源入口、一键转名邦确认、Consultation 即将超时阈值、Internal Mode 后台超时退出、E01 强待办统一排序；
- completed-PDM mutation = 0；
- new domain state machine = 0；
- 19 / 19 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户裁决 PDM-21 Batch 4。

## 2026-10-06｜PDM-21 Batch 2 用户批准并执行

- 用户对 `P21-B2-01～P21-B2-09` 明确“全部同意确认执行”；
- `P21-B2-01～P21-B2-09 = PASS / USER_APPROVED / APPLIED`；
- Reverse Conflict Scan = `PASS / FALSE_DEPRECATION_COUNT=0`；
- Batch 3 Conflict Isolation = `PASS / MISCLASSIFIED_PRODUCT_CHOICE=0`；
- 形成 `P21-B3-01～P21-B3-10 / PENDING_USER_REVIEW`；
- 4S Internal Mode 进入方式、敏感 Action 页面归位、Consultation“即将超时”阈值等真正产品选择继续留 Batch 4；
- 19 / 19 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-21 Batch 3。

## 2026-10-06｜PDM-21 Batch 1 用户批准并执行

- 用户对 `P21-A01～P21-A20` 全部同意，随后确认执行；
- `P21-A01～P21-A20 = PASS / USER_APPROVED / APPLIED`；
- 20 条稳定员工端基础规则正式进入当前工作 Authority；
- Batch 2 Reverse Conflict Scan = `PASS / FALSE_DEPRECATION_COUNT=0`；
- 形成 `P21-B2-01～P21-B2-09 / PENDING_USER_REVIEW`；
- 4S Internal Mode 具体进入方式、敏感动作页面归位等仍需产品判断的事项未误塞 Batch 2；
- 19 / 19 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-21 Batch 2。

## 2026-10-06｜PDM-21 Startup Gate 通过并进入 Batch 1 审查

- 用户已批准并确认执行 `P21-R00`：PDM-21 是员工端产品体验、工作台编排与 Employee Action Projection 的唯一 Authority；
- Startup Gate = `PASS`；
- CROSS_PDM_HANDOFF_REGISTER 机械复核确认 target=PDM-21 **实际为 19 条**；
- 19 / 19 incoming handoff 已由 `HANDOFF_OPEN` → `HANDOFF_ACCEPTED`；
- incoming：HO-P02/P03/P04/P05/P06/P07/P08/P09/P10/P11/P12/P13/P14/P15/P16/P17/P18/P19/P20 → PDM-21；
- completed-PDM hard conflict = 0；
- incoming handoff gap = 0；
- global invariant conflict = 0；
- Current Authority Refresh 已覆盖 9/19 R10/R11、001～078 M15/M17、Current IA/Low-Fi 与 PDM-01～20 Final；
- 旧内部价权限语义、4S Internal Mode 整体 DENY、一键转名邦独立 permission、旧“我要这辆车”工作台、CRM 直接锁车等已识别为后续冲突/替代项，未偷渡进 Batch 1；
- 工作版：`07_重建工作区/PDM-21_员工工作台车辆列表客户中心内部模式敏感动作裁剪_规则原子重建_工作版.md`；
- Batch 1 候选：`P21-A01～P21-A20`，状态 `PENDING_USER_REVIEW`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-21 Batch 1。

## 2026-10-06｜PDM-20 Final 正式发布并完成 Closeout

- 用户最终批准 PDM-20 Final Domain Overview，并明确确认执行；
- 正式 Authority：`07_重建工作区/PDM-20_最终完整规则.md`；
- Final Integrity：`07_重建工作区/PDM-20_最终完整性复核_2026-10-06.md / PASS`；
- `PDM-20 = COMPLETE / INTEGRITY_PASS`；
- 53 个正式规则 / 用户裁决单元全部进入 Final；
- 14 / 14 incoming handoff = `HANDOFF_CLOSED / SOURCE_BACKWRITE_DONE`；
- 来源 PDM-01/03/04/05/07/08/10/11/12/13/14/15/18/19 Final 已反向回写；
- 4 条 outgoing handoff（PDM-21 / PDM-22 / PDM-24 / PDM-25）继续 `HANDOFF_OPEN`；
- IA / Low-Fi / Engineering 未施工；
- 下一步：PDM-21 Startup Gate。

## 2026-10-06｜PDM-20 Prefinal R1 修复执行完成，R2 PASS

- 用户已批准并确认执行 `P20-LIA-01～P20-LIA-07`；
- `R1_REPAIR_CLOSED = 7 / 7`；
- PDM-20 → PDM-21 / 22 / 24 / 25 四条 outgoing handoff 已正式登记为 `HANDOFF_OPEN`；
- PDM-20 stale carrier 已登记，当前不施工；
- Final 前完整性复核 R2 = `PASS / FINAL_CANDIDATE_READY`；
- 正式规则 / 裁决单元总数 = 53；
- missing rule = 0；
- semantic detail gap = 0；
- completed-PDM conflict = 0；
- incoming handoff gap = 0；
- outgoing handoff gap = 0；
- 14 / 14 incoming handoff 继续 `HANDOFF_ACCEPTED`，Final closeout 前不关闭；
- Final Overview：`07_重建工作区/PDM-20_最终完整规则总览_待用户批准.md`；
- 当前唯一下一步：用户最终批准 PDM-20 Final Domain Overview。

## 2026-10-06｜PDM-20 Batch 4 批准执行并完成 Final 前 R1

- 用户对 `P20-B4-01～P20-B4-10` 全部同意，按推荐 `1A～10A`，随后明确“确认执行”；
- `P20-B4-01～P20-B4-10 = PASS / USER_APPROVED / APPLIED`；
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`；
- Final 前完整性复核 R1 已完成：`REPAIR_REQUIRED / NO_HARD_CONFLICT`；
- 报告：`07_重建工作区/PDM-20_Final前完整性复核_R1_2026-10-06.md`；
- 形成 `P20-LIA-01～P20-LIA-07` 七项修复候选；
- R1：missing=3，semantic detail=3，cross-PDM alignment=1，outgoing handoff gap=1 group；
- 14 / 14 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- outgoing handoff 待 LIA-07 用户批准后正式登记；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 P20-LIA-01～P20-LIA-07。

## 2026-10-06｜PDM-20 Batch 3 用户批准并执行

- 用户对 `P20-B3-01～P20-B3-08` 全部同意，随后明确“确认执行”；
- `P20-B3-01～P20-B3-08 = PASS / USER_APPROVED / APPLIED`；
- Conflict Isolation = `PASS / MISCLASSIFIED_PRODUCT_CHOICE=0`；
- Batch 4 Gap / Choice Scan 已完成；
- 形成 `P20-B4-01～P20-B4-10 / PENDING_USER_REVIEW`，推荐 `1A～10A`；
- completed-PDM mutation = 0；
- new domain state machine = 0；
- 14 / 14 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-20 Batch 4。

## 2026-10-06｜PDM-20 Batch 2 用户批准并执行

- 用户对 `P20-B2-01～P20-B2-09` 全部同意，随后以“确认指型”明确执行；
- `P20-B2-01～P20-B2-09 = PASS / USER_APPROVED / APPLIED`；
- Reverse Conflict Scan = `PASS / FALSE_DEPRECATION_COUNT=0`；
- Batch 3 Conflict Isolation = `PASS / MISCLASSIFIED_PRODUCT_CHOICE=0`；
- 形成 `P20-B3-01～P20-B3-08 / PENDING_USER_REVIEW`；
- 14 / 14 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-20 Batch 3。

## 2026-10-06｜PDM-20 Batch 1 用户批准并执行

- 用户对 `P20-A01～P20-A18` 全部同意，随后明确“确认执行”；
- `P20-A01～P20-A18 = PASS / USER_APPROVED / APPLIED`；
- 18 条稳定客户端基础规则进入当前 Authority；
- Batch 2 Reverse Conflict Scan 已完成：`PASS / FALSE_DEPRECATION_COUNT=0`；
- 形成 `P20-B2-01～P20-B2-09 / PENDING_USER_REVIEW`；
- 14 / 14 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-20 Batch 2。

## 2026-10-06｜PDM-20 Startup Gate 通过并进入 Batch 1 审查

- 用户已批准并确认执行 `P20-R00`：PDM-20 是客户端产品体验与 Customer Safe Projection 的唯一 Authority；
- Startup Gate = `PASS`；
- CROSS_PDM_HANDOFF_REGISTER 机械复核后确认 target=PDM-20 **实际为 14 条**，此前口头“15条”已纠正；
- 14 / 14 incoming handoff 已由 `HANDOFF_OPEN` → `HANDOFF_ACCEPTED`；
- incoming：HO-P01/P03/P04/P05/P07/P08/P10/P11/P12/P13/P14/P15/P18/P19 → PDM-20；
- completed-PDM hard conflict = 0；
- incoming handoff gap = 0；
- Current Authority Refresh 已覆盖 9/19 R10、001～078 M16/M10/M11、Current IA/Low-Fi 与 PDM-01/03/04/05/07/08/10/11/12/13/14/15/18/19 Final；
- R10 旧 owner、旧“我要这辆车”、旧 Priority visibility、旧批发查价等已识别为后续冲突/替代项，未偷渡进 Batch 1；
- 工作版：`07_重建工作区/PDM-20_客户端浏览搜索筛选排序列表详情收藏分享个人中心地域_规则原子重建_工作版.md`；
- Batch 1 候选：`P20-A01～P20-A18`，状态 `PENDING_USER_REVIEW`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-20 Batch 1。

## 2026-10-06｜PDM-19 Final 正式发布并完成 Closeout

- 用户最终批准 Final Domain Overview，并以“确认指向”明确执行；
- 正式 Authority：`07_重建工作区/PDM-19_最终完整规则.md`；
- Final Integrity：`07_重建工作区/PDM-19_最终完整性复核_2026-10-06.md / PASS`；
- `PDM-19 = COMPLETE / INTEGRITY_PASS`；
- 41 个正式规则 / 用户裁决单元全部进入 Final；
- 10 / 10 incoming handoff = `HANDOFF_CLOSED / SOURCE_BACKWRITE_DONE`；
- 来源 PDM-01 / 02 / 03 / 04 / 07 / 13 / 14 / 15 / 17 / 18 Final 已反向回写；
- 5 条 outgoing handoff 继续 `HANDOFF_OPEN`；
- IA / Low-Fi / Engineering 未施工；
- 下一步：PDM-20 Startup Gate。

## 2026-10-06｜PDM-19 Prefinal R1 修复执行并完成 R2

- `P19-LIA-01～P19-LIA-06 = PASS / USER_APPROVED / APPLIED`；
- `R1_REPAIR_CLOSED = 6 / 6`；
- 5 条 outgoing handoff 已正式登记并保持 `HANDOFF_OPEN`；
- 10 条 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- Final 前完整性复核 R2 = `PASS / FINAL_CANDIDATE_READY`；
- `MISSING_RULE_UNRESOLVED = 0`；
- `SEMANTIC_DETAIL_GAP_UNRESOLVED = 0`；
- `COMPLETED_PDM_INVARIANT_CONFLICT = 0`；
- `INCOMING_HANDOFF_GAP = 0`；
- `OUTGOING_HANDOFF_GAP = 0`；
- Final Overview：`07_重建工作区/PDM-19_最终完整规则总览_待用户批准.md`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户最终批准 PDM-19 Final Domain Overview。

## 2026-10-06｜PDM-19 Batch 4 批准执行并完成 Final 前 R1

- 用户裁决 `1A～11A`，随后明确“确认执行”；
- `P19-B4-01～P19-B4-11 = PASS / USER_APPROVED / APPLIED`；
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`；
- B3-03 与 B4-01/B4-09 已统一为：pending Refund 不再退款时直接 close + 原因，不新增专门 close permission；
- Final 前完整性复核 R1 已完成：`REPAIR_REQUIRED / NO_HARD_CONFLICT`；
- 报告：`07_重建工作区/PDM-19_Final前完整性复核_R1_2026-10-06.md`；
- 形成 `P19-LIA-01～P19-LIA-06` 六项修复候选；
- 10 条 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- outgoing handoff 待 LIA-06 用户批准后正式登记；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 P19-LIA-01～P19-LIA-06。

## 2026-10-06｜PDM-19 Batch 3 用户批准并执行

- 用户对 `P19-B3-01～P19-B3-03` 全部同意，随后明确“确认执行”；
- `P19-B3-01 / P19-B3-02 = PASS / USER_APPROVED / APPLIED`；
- `P19-B3-03 = USER_REVISED / PASS / USER_APPROVED / APPLIED`；
- B3-03 最终口径：pending Refund 确定不再退款时可直接关闭，只填写原因；不新增专门关闭 permission，不增加审批；closed 不等于 refunded；
- Batch 4 扫描形成 `P19-B4-01～P19-B4-11 / PENDING_USER_REVIEW`；
- 10 条 incoming handoff 继续 `HANDOFF_ACCEPTED`，未提前关闭；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-19 Batch 4。

## 2026-10-06｜PDM-19 Batch 2 用户批准并执行

- 用户对 `P19-B2-01～P19-B2-06` 明确全部同意，随后以“真执行”授权落仓；
- `P19-B2-01～P19-B2-06 = PASS / USER_APPROVED / APPLIED`；
- Reverse Conflict Scan = `PASS / FALSE_DEPRECATION_COUNT=0`；
- Batch 3 扫描形成 3 条后续明确新增 / 变更候选：Transaction 首次完成独立敏感权限、Deposit 追加式纠错、pending Refund 撤回/关闭但未退款；
- Batch 3 = `P19-B3-01～P19-B3-03 / PENDING_USER_REVIEW`；
- `closed_not_refunded` 的 Domain 状态/历史 outcome 映射、Transaction 成交纠错完整权限等冲突/遗漏继续留 Batch 4；
- 10 条 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-19 Batch 3。

## 2026-10-06｜PDM-19 Batch 1 用户批准并执行

- 用户明确“全部同意”，随后明确“确认执行”；
- `P19-A01～P19-A14 = PASS / USER_APPROVED / APPLIED`；
- 14 条稳定规则正式进入当前工作 Authority；
- 10 条 incoming handoff 继续 `HANDOFF_ACCEPTED`，未提前关闭；
- Batch 2 Reverse Conflict Scan = `PASS / FALSE_DEPRECATION_COUNT=0`；
- Batch 2 候选：`P19-B2-01～P19-B2-06`；
- Batch 2 只包含明确废弃 / superseded / DO_NOT_RESTORE 旧模型；Transaction 完成权限、Refund closed、责任人等未提前裁决；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-19 Batch 2。

## 2026-10-06｜PDM-19 Startup Gate 通过并进入 Batch 1 审查

- 用户已批准并确认执行 `P19-R00`：PDM-19 是 Deposit / Transaction / Refund / 成交纠错，以及换车资金与交易收口的唯一业务 Authority；
- Startup Gate = `PASS`；
- target=PDM-19 的 10 条 incoming handoff 已由 `HANDOFF_OPEN` → `HANDOFF_ACCEPTED`；
- incoming：HO-P01-P19-001 / HO-P02-P19-001 / HO-P03-P19-001 / HO-P04-P19-001 / HO-P07-P19-001 / HO-P13-P19-001 / HO-P14-P19-001 / HO-P15-P19-001 / HO-P17-P19-001 / HO-P18-P19-001；
- completed-PDM hard conflict = 0；
- incoming handoff gap = 0；
- Current Authority Refresh 已覆盖 9/19 C4/R8/R12、001～078 M14、Current IA CO-O18/O19/O20 与 PDM-01/02/03/04/07/13/14/15/17/18 Final；
- Current 中 Transaction 首次完成权限、Deposit correction、Refund closed-not-refunded 等后续细化已识别，但未偷渡进 Batch 1；
- 工作版：`07_重建工作区/PDM-19_意向金Transaction退款成交纠错换车_规则原子重建_工作版.md`；
- Batch 1 候选：`P19-A01～P19-A14`，状态 `PENDING_USER_REVIEW`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-19 Batch 1。

## 2026-10-06｜PDM-18 Final 正式发布并完成 Closeout

- 用户最终批准 Final Domain Overview 并确认执行；
- 正式 Authority：`07_重建工作区/PDM-18_最终完整规则.md`；
- Final Integrity：`07_重建工作区/PDM-18_最终完整性复核_2026-10-06.md / PASS`；
- `PDM-18 = COMPLETE / INTEGRITY_PASS`；
- 43 个正式规则 / 用户裁决单元全部进入 Final；
- 10 / 10 incoming handoff = `HANDOFF_CLOSED / SOURCE_BACKWRITE_DONE`；
- 来源 PDM-01 / 02 / 03 / 04 / 07 / 10 / 12 / 13 / 14 / 17 Final 已反向回写；
- 6 条 outgoing handoff 继续 `HANDOFF_OPEN`；
- IA / Low-Fi / Engineering 未施工；
- 下一步：PDM-19 Startup Gate。

## 2026-10-06｜PDM-18 Final Overview 用户最终批准

- 用户明确“同意”；
- `PDM-18 Final Overview = USER_FINAL_APPROVED`；
- `Final closeout = PENDING_EXECUTION_CONFIRMATION`；
- 10/10 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- 6 条 outgoing handoff 继续 `HANDOFF_OPEN`；
- 当前不得发布 Final、不得 source backwrite、不得进入 PDM-19；
- 当前唯一下一步：等待明确执行 Final closeout。

# 名邦汽车 V1｜当前项目状态

> 更新时间：2026-10-06  
> 状态源：GitHub `suzhe868-arch/mb` / `main`  
> 业务权威语言：中文（zh-CN）

## 当前阶段

`PRODUCT_BASELINE_REBUILD / DOMAIN_RULE_RECONSTRUCTION / PDM-24_BATCH_4_FINAL_GAP_SCAN`

> **当前有效快照以本文件顶部、`NEXT_ACTION.md` 与 `PROJECT_STATE.json` 为准。下方按日期保留的旧“当前状态 / 下一步”属于历史审计轨迹，不代表现在仍停留在该节点。**

当前域：

> **PDM-22｜PC 后台信息架构 / 业务管理 / 配置归属 / 上游运行管理**

当前域状态：

> `PDM-23 COMPLETE / INTEGRITY_PASS；PDM-24 STARTUP_GATE_PASS / BATCH_1_PASS / BATCH_2_PASS / BATCH_3_PENDING_USER_REVIEW`

当前工作文件：

> `07_重建工作区/PDM-22_PC后台信息架构业务管理配置归属上游运行管理_规则原子重建_工作版.md`

当前已纠正：

- P10-B2-10 原“禁止内部价独立 permission”分类已回开失效；
- P10-A15 已撤回 Batch 3 并转 Batch 4；
- P10-B4-01 已按用户裁决确认：内部价 / 底价查看采用后台可配置独立 permission；
- PDM-02 已在 Legacy Final Integrity Audit 中同步 PDM-10 当前内部价/调价语义，并补齐权限撤销、交接、System Admin 治理等细节；
- 新增全局 Step 5A / Batch 2、3 反向冲突硬门禁。

当前唯一下一步：

> **PDM-24 Batch 4 Final-gap Scan。**

## 2026-10-06｜PDM-18 R1 修复完成并通过 R2

- 用户对 `P18-LIA-01～P18-LIA-06` 全部同意并明确执行；
- `R1_REPAIR_CLOSED = 6/6`；
- 6 条 PDM-18 outgoing handoff 已登记 `HANDOFF_OPEN`；
- PDM-18 stale carrier 已登记 `CARRIER_DEFERRED`，当前不施工；
- Final 前完整性复核 R2：`PASS / FINAL_CANDIDATE_READY`；
- `MISSING_RULE_UNRESOLVED=0`；
- `SEMANTIC_DETAIL_GAP_UNRESOLVED=0`；
- `COMPLETED_PDM_INVARIANT_CONFLICT=0`；
- `INCOMING_HANDOFF_GAP=0`；
- `OUTGOING_HANDOFF_GAP=0`；
- 已生成：`07_重建工作区/PDM-18_最终完整规则总览_待用户批准.md`；
- 当前唯一下一步：用户最终审查 PDM-18 Final Domain Overview。

## 2026-10-06｜PDM-18 Batch 4 批准执行并完成 Final 前 R1

- 用户裁决 `1A～10A`，随后明确执行；
- `P18-B4-01～P18-B4-10 = PASS / USER_APPROVED / APPLIED`；
- P18-A06/A13 已按“竞争 LockRequest 自动候补”修正；
- P18-A18 已补“Priority-origin Lock 继承客户侧排他可见性”；
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`；
- Final 前完整性复核 R1 已完成：`REPAIR_REQUIRED`；
- 形成 `P18-LIA-01～P18-LIA-06`：手机号候补门槛、客户不自助取消候补、LockRequest 结果/审计、Lock 幂等、内部候补顺序 vs 客户不展示保证性排名、outgoing handoff + stale carrier/alignment；
- 10 / 10 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 P18-LIA-01～P18-LIA-06。

## 2026-10-06｜PDM-18 Batch 3 用户批准并执行

- 用户对当前 Batch 3 剩余 `P18-B3-01 + P18-B3-03` 明确“全部同意”，随后“确认执行”；
- `P18-B3-01 + P18-B3-03 = PASS / USER_APPROVED / APPLIED`；
- `P18-B3-02` 保持 `WITHDRAWN_FROM_BATCH3 / MOVED_TO_BATCH4`；
- Batch 4 扫描已形成 `P18-B4-01～P18-B4-10 / PENDING_USER_REVIEW`；
- B4-01（Priority→Lock 排他可见性）与 B4-02（竞争 LockRequest 自动候补）沿用用户已确认方向，但尚未正式应用；
- 10 条 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-18 Batch 4。

## 2026-10-06｜PDM-18 Batch 3 候选重分类

- 用户对原 `P18-B3-02｜LOCK_CONFLICT 后只能主动候补`提出反向裁决：应自动转候补；
- 用户认可调整并随后确认执行；
- `P18-B3-02 = WITHDRAWN_FROM_BATCH3 / RECLASSIFIED_TO_BATCH4`；
- Batch 3 当前只剩 `P18-B3-01 + P18-B3-03 / PENDING_USER_REVIEW`；
- 新增 `P18-B4-PRE-02 = USER_DIRECTION_APPROVED / NOT_APPLIED`；
- 新方向：同车同 cycle 一笔 LockRequest 获锁后，其他仍有效 PENDING 自动转 Waitlist；候补顺序按原 LockRequest.created_at；Waitlist 不占车、不自动转 Lock；
- 该方向与已批准 P18-A06/A13 局部冲突，已标记 `BATCH4_CONFLICT_PENDING`，Batch 4 正式裁决前不提前改写 Authority；
- 原 `P18-B4-PRE-01` Priority→Lock 排他可见性方向仍为 NOT_APPLIED；
- 当前唯一下一步：用户审查 P18-B3-01 与 P18-B3-03。

## 2026-10-06｜PDM-18 Batch 2 用户批准并执行

- 用户对 `P18-B2-01～P18-B2-06` 明确“全部同意”，随后以“确认指向”按既有用法授权执行；
- `P18-B2-01～P18-B2-06 = PASS / USER_APPROVED / APPLIED`；
- Reverse Conflict Scan = `PASS / FALSE_DEPRECATION_COUNT=0`；
- Batch 3 扫描形成 3 条明确 later-change Atom：4S 不审批 LockRequest、LOCK_CONFLICT 后另行主动候补、名邦员工在明确 Customer+Vehicle 上下文可直接正式 Lock；
- Batch 3 = `P18-B3-01～P18-B3-03 / PENDING_USER_REVIEW`；
- 用户已认可“普通 Lock 与 Priority→Lock 可见性差异”方向，但仅登记为 Batch 4 pending direction，尚未应用；
- 10 条 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-18 Batch 3。

## 2026-10-06｜PDM-18 Batch 1 用户批准并执行

- 用户明确“全部同意确认执行”；
- `P18-A01～P18-A18 = PASS / USER_APPROVED / APPLIED`；
- 18 条稳定规则覆盖 LockRequest/Lock/Waitlist 分层、6h、并发审批、唯一 active Lock、72h、意向金超时边界、人工延期、Waitlist、owner/responsible、账号/车辆历史、价格快照、Priority/Recommendation/Matching 分层；
- 特别保留：合法名邦员工在 Customer + Vehicle 上下文明确且 Guard 合法时可直接创建正式 Lock；不得把 LockRequest 错做成所有 Lock 的强制前置；
- 10 条 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- Batch 2 Reverse Conflict Scan = `PASS / FALSE_DEPRECATION_COUNT=0`；
- Batch 2 候选：`P18-B2-01～P18-B2-06`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-18 Batch 2。

## 2026-10-06｜PDM-18 Startup Gate 通过并进入 Batch 1 审查

- 用户已确认并授权执行 P18-R00：PDM-18 是 LockRequest / 正式 Lock / Waitlist / 延期 / 释放 / 到期 / 责任交接的唯一业务 Authority；
- Deposit / Transaction / Refund / 换车继续由 PDM-19 承接；
- Startup Gate = `PASS`；
- target=PDM-18 的 10 条 incoming handoff 已由 `HANDOFF_OPEN` → `HANDOFF_ACCEPTED`；
- incoming：HO-P01-P18-001 / HO-P02-P18-001 / HO-P03-P18-001 / HO-P04-P18-001 / HO-P07-P18-001 / HO-P10-P18-001 / HO-P12-P18-001 / HO-P13-P18-001 / HO-P14-P18-001 / HO-P17-P18-001；
- completed-PDM hard conflict = 0；
- incoming handoff gap = 0；
- Current Authority Refresh 已覆盖 9/19 R8/R10/R12、001～078 M13、Current C01-01/E07-08/P07，以及 PDM-01/02/03/04/07/10/12/13/14/17 Final；
- 明确识别 9/19 后新增 LockRequest 前置模型：客户锁车申请不等于正式 Lock，PENDING 6h 不占车，approve 成功才创建正式 Lock 并开始 72h；
- 旧“到期前默认 30 分钟提醒”等未重新确认细节未进入 Batch 1；
- 工作版：`07_重建工作区/PDM-18_LockRequest正式LockWaitlist延期释放_规则原子重建_工作版.md`；
- Batch 1 候选：`P18-A01～P18-A18`，状态 `PENDING_USER_REVIEW`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-18 Batch 1。

## 2026-10-06｜PDM-17 Final 正式发布并完成 Closeout

- 用户最终批准 Final Domain Overview 并确认执行；
- 正式 Authority：`07_重建工作区/PDM-17_最终完整规则.md`；
- Final Integrity：`07_重建工作区/PDM-17_最终完整性复核_2026-10-06.md / PASS`；
- `PDM-17 = COMPLETE / INTEGRITY_PASS`；
- 34 个正式规则 / 用户裁决单元全部进入 Final；
- 6 / 6 incoming handoff = `HANDOFF_CLOSED / SOURCE_BACKWRITE_DONE`；
- 来源 PDM-02 / 03 / 11 / 13 / 15 / 16 Final 已反向回写；
- 6 条 outgoing handoff 继续 `HANDOFF_OPEN`；
- IA / Low-Fi / Engineering 未施工；
- 下一步：PDM-18 Startup Gate。

## 2026-10-06｜PDM-17 Final 前完整性复核 R2 PASS

- P17-LIA-01～P17-LIA-05 已全部用户批准并执行；
- outgoing handoff 6 条已正式登记并保持 `HANDOFF_OPEN`；
- stale carrier 已登记为 `CARRIER_DEFERRED`，未修改 IA / Low-Fi；
- R2 报告：`07_重建工作区/PDM-17_Final前完整性复核_R2_2026-10-06.md`；
- `SOURCE_TO_ATOM = PASS`；
- `ATOM_TO_SOURCE = PASS`；
- `SEMANTIC_COMPLETENESS = PASS`；
- `MISSING_RULE_UNRESOLVED = 0`；
- `SEMANTIC_DETAIL_GAP_UNRESOLVED = 0`；
- `INCOMING_HANDOFF_GAP = 0`；
- `OUTGOING_HANDOFF_GAP = 0`；
- `PDM17_FINAL_CANDIDATE_READY = YES`；
- Final Overview 候选：`07_重建工作区/PDM-17_最终完整规则总览_待用户批准.md`；
- 当前唯一下一步：用户最终批准 Final Domain Overview；批准前不得发布 Final / 关闭 incoming / source backwrite / 进入 PDM-18。

## 2026-10-06｜PDM-17 Final 前完整性复核 R1

- 报告：`07_重建工作区/PDM-17_Final前完整性复核_R1_2026-10-06.md`；
- 结论：`REPAIR_REQUIRED`；
- completed-PDM hard conflict = 0；
- incoming handoff gap = 0；
- local product choice unresolved = 0；
- 修复候选：`P17-LIA-01～P17-LIA-05`；
- 发现 1 处 Current Low-Fi stale carrier：P06-05 指定分配二次确认与 P17-A11 冲突；当前只登记，不施工；
- 当前唯一下一步：用户审查 P17-LIA-01～P17-LIA-05，未经批准不得进入 R2 / Final Overview。

## 2026-10-06｜PDM-17 Batch 4 用户批准并执行

- 用户选择：`1A、2A、3A、4A、5A、6A、7A、8A、9A`；
- 用户随后明确“确认执行”；
- `P17-B4-01～P17-B4-09 = PASS / USER_APPROVED / APPLIED`；
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`；
- 6 / 6 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工；
- 下一步：Final 前完整性复核 R1。

## 2026-10-06｜PDM-17 Batch 3 通过并进入 Batch 4

- 用户明确同意 Batch 3“无新增独立规则原子”结论，随后确认执行；
- `BATCH_3 = NO_NEW_ATOMS / PASS / USER_APPROVED / APPLIED`；
- `NEW_INDEPENDENT_ATOMS=0`；
- `DUPLICATE_RULE_CREATION=0`；
- `MISCLASSIFIED_PRODUCT_CHOICE=0`；
- Batch 4 已完成历史 R6、001～078 与当前 PDM-17 的冲突/遗漏扫描；
- 形成 `P17-B4-01～P17-B4-09` 共 9 个待裁决项；
- 其中明确发现：长期未真实跟进公海候选“三条件 AND”历史规则丢失；公海普通领取人在领取前仅看必要摘要、敏感联系方式默认隐藏的规则尚未完整进入当前 PDM-17；
- 仓库未发现已正式冻结的“后台指定分配为主、主动领取弱化”覆盖性裁决，因此该运营模式仍作为 Batch 4 新产品选择提交，不从聊天记忆静默覆盖；
- 6 条 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户裁决 PDM-17 Batch 4。

## 2026-10-06｜PDM-17 Batch 2 用户批准并执行

- 用户对 `P17-B2-01～P17-B2-04` 明确“全部同意”，随后以“真执行”明确授权执行；
- `P17-B2-01～P17-B2-04 = PASS / USER_APPROVED / APPLIED`；
- 已明确禁止恢复：Customer Merge×公海迁移、职位名称自动等于全部公海治理权、System Admin 作为公海业务执行者/兜底 owner、分享/转介绍绕过公海治理恢复历史 owner；
- Reverse Conflict Scan = `PASS / FALSE_DEPRECATION_COUNT=0`；
- 主动领取、后台指定分配、待公海人工处理、领取限制、Collaboration 等当前合法能力未被误废弃；
- Batch 3 新增/变更扫描已完成：6 条 incoming handoff 中的 later additions 均已在 Batch 1 对应规则中吸收，未发现新的独立 Atom；
- Batch 3 = `NO_NEW_ATOMS / PENDING_USER_REVIEW`；
- 6 条 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 Batch 3“无新增项”结论。

## 2026-10-06｜PDM-17 Batch 1 用户批准并执行

- 用户先明确更正为“全部同意”，随后明确“确认执行”；
- `P17-A01～P17-A15 = PASS / USER_APPROVED / APPLIED`；
- 已冻结：唯一 owner 与公海状态边界、禁止自动抢入公海、合法进入公海触发、待公海人工三向处理、未完成责任/保护 Guard、公海 scope、原子领取与并发、接客开关与主动领取分离、领取数量/频率限制、主动服务触发 owner 分配、后台指定分配、再次释放 Guard、历史保留、Collaboration 非 owner / 非万能授权、Collaboration 建立/scope/结束/历史；
- 6 条 incoming handoff 继续 `HANDOFF_ACCEPTED`，不得提前关闭；
- Batch 2 Reverse Conflict Scan = `PASS / FALSE_DEPRECATION_COUNT=0`；
- Batch 2 候选：`P17-B2-01～P17-B2-04`，状态 `PENDING_USER_REVIEW`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 PDM-17 Batch 2。

## 2026-10-06｜PDM-17 Startup Gate 通过并进入 Batch 1 审查

- 用户已确认并授权执行 P17-R00：PDM-17 是公海治理与 Collaboration（协作关系）业务 Authority；
- PDM-17 负责：待公海处理、人工判断、进入/退出公海、领取、指定分配、主动人工服务触发的 owner 分配、再次释放，以及 Collaboration 建立/范围/结束；
- PDM-17 不重建 Customer / CRM / Demand / Priority / Consultation / Recommendation / Lock / Transaction 第二套状态机；
- Startup Gate = `PASS`；
- target=PDM-17 的 6 条 incoming handoff 已由 `HANDOFF_OPEN` → `HANDOFF_ACCEPTED`；
- incoming：HO-P02-P17-001 / HO-P03-P17-001 / HO-P11-P17-001 / HO-P13-P17-001 / HO-P15-P17-001 / HO-P16-P17-001；
- completed-PDM hard conflict = 0；
- incoming handoff gap = 0；
- Current Authority Refresh 已覆盖 9/19 R6/R10/R12、001～078 M02/M17、Current E08/E08-01/P06-03/04/05，以及 PDM-02/03/11/13/15/16 Final；
- Startup Scan 已登记：待公海三选一、领取数量/频率、并发领取、无待确认领取、主动人工服务自动分配退出公海、首次跟进提醒、Collaboration 两级 scope 等历史细节在 Current carrier 中存在不同程度缺口；当前只进入规则审查，不修改 IA / Low-Fi / Engineering；
- 工作版：`07_重建工作区/PDM-17_公海待公海领取指定分配与协作_规则原子重建_工作版.md`；
- Batch 1 候选：`P17-A01～P17-A15`，状态 `PENDING_USER_REVIEW`；
- 当前唯一下一步：用户审查 PDM-17 Batch 1。

## 2026-10-06｜PDM-16 Final 正式发布并完成 Closeout

- 用户最终批准 Final Domain Overview 并确认执行；
- 正式 Authority：`07_重建工作区/PDM-16_最终完整规则.md`；
- Final Integrity：`07_重建工作区/PDM-16_最终完整性复核_2026-10-06.md / PASS`；
- `PDM-16 = COMPLETE / INTEGRITY_PASS`；
- 36 个正式规则 / 用户裁决单元全部进入 Final；
- 6 / 6 incoming handoff = `HANDOFF_CLOSED / SOURCE_BACKWRITE_DONE`；
- 来源 PDM-01 / 02 / 03 / 11 / 12 / 15 Final 已反向回写；
- 5 条 outgoing handoff 继续 `HANDOFF_OPEN`；
- IA / Low-Fi / Engineering 未施工；
- 下一步：PDM-17 Startup Gate。

## 2026-10-06｜PDM-16 Final 前完整性复核 R2

- P16-LIA-01～P16-LIA-03 已 USER_APPROVED / APPLIED；
- R2 报告：`07_重建工作区/PDM-16_Final前完整性复核_R2_2026-10-06.md`；
- Source→Atom = PASS；
- Atom→Source = PASS；
- Semantic Completeness = PASS；
- Missing Rule = 0；
- Semantic Detail Gap = 0；
- completed-PDM conflict = 0；
- incoming handoff gap = 0；
- outgoing handoff gap = 0；
- local product choice unresolved = 0；
- `PDM16_FINAL_CANDIDATE_READY = YES`；
- Final Overview：`07_重建工作区/PDM-16_最终完整规则总览_待用户批准.md`；
- 当前唯一下一步：用户最终审查 Final Overview。

## 2026-10-06｜PDM-16 Final 前完整性复核 R1

- 报告：`07_重建工作区/PDM-16_Final前完整性复核_R1_2026-10-06.md`；
- 结论：`REPAIR_REQUIRED`；
- `MISSING_RULE_UNRESOLVED = 1`：Customer Address 搜索 / 卡片投影；
- `SEMANTIC_DETAIL_GAP_UNRESOLVED = 1`：CRM Stage / important Tag / 服务称呼 mutation audit；
- `COMPLETED_PDM_INVARIANT_CONFLICT = 0`；
- `INCOMING_HANDOFF_GAP = 0`；
- `OUTGOING_HANDOFF_GAP = 1 group`：待登记 PDM-17 / 21 / 22 / 23 / 25；
- 修复候选：`P16-LIA-01～P16-LIA-03`；
- `PDM16_FINAL_CANDIDATE_READY = NO`；
- 当前唯一下一步：用户审查修复候选。

## 2026-10-06｜PDM-16 Batch 4 用户裁决并执行

- 用户选择并确认执行：`1A、2A、3A、4A、5A`；
- `P16-B4-01～P16-B4-05 = PASS / USER_APPROVED / APPLIED`；
- CRM Stage = 公司级受控可配置字典；
- Consultation / Demand / Lock / Transaction 等具体业务事件默认不自动改 CRM Stage；
- Customer Tags = 公司级受控 Tag 字典 + Customer 多选；
- V1 不建设通用 Customer Opportunity 规则引擎；
- Source Radar“不适合”抑制当前有效 Demand×Vehicle 匹配事实，底层匹配输入实质变化后允许重新出现；
- Batch 4 Cross-PDM Conflict Review = PASS；
- `PDM16_LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`；
- 6 条 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- 当前唯一下一步：Final 前完整性复核。

## 2026-10-06｜PDM-16 Batch 3 Completeness Repair 已执行

- 用户对 `P16-B3-R01～P16-B3-R02` 明确“全部同意确认执行”；
- Repair = `PASS / USER_APPROVED / APPLIED`；
- `BATCH_3_COMPLETENESS_GAP = 0`；
- CRM 未完成待办/回访/未来跟进责任交接已恢复；
- “暂不联系/暂无意向”与 owner / 公海 / 具体业务状态严格分离；
- Batch 4 重建后形成 5 个真实产品选择：CRM Stage 字典治理、Stage 自动改写、Customer Tags 模型、Opportunity 规则来源、Radar 不适合抑制范围；
- 建议：`1A、2A、3A、4A、5A`；
- 6 条 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工。

## 2026-10-06｜PDM-16 Batch 3 用户批准并执行

- 用户对 `P16-B3-01～P16-B3-06` 全部同意并确认执行；
- Batch 3 = `PASS / USER_APPROVED / APPLIED`；
- Conflict Isolation = `PASS`；
- `CONFLICT_OR_PRODUCT_CHOICE_MISCLASSIFIED_AS_BATCH3 = 0`；
- 已补齐 CRM Follow-up mutation、员工内部称呼历史、CRM 列表真实搜索/筛选、Customer Detail 六区块、Opportunity 最小聚合事实、Source Radar 事件与人工处理闭环；
- 完整性回查另发现 2 条明确历史规则尚未完整承接：CRM 待办/回访提醒/未来跟进责任交接；“暂不联系/暂无意向”只属于 CRM 判断且不自动进公海；
- 已形成修复候选 `P16-B3-R01～P16-B3-R02`；
- Batch 4 暂不开始；
- 6 条 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工。

## 2026-10-06｜PDM-16 Batch 2 用户批准并执行

- 用户对 `P16-B2-01～P16-B2-07` 明确“全部同意确认执行”；
- Batch 2 = `PASS / USER_APPROVED / APPLIED`；
- Reverse Conflict Scan = `PASS`；
- `FALSE_DEPRECATION_COUNT = 0`；
- 已明确废弃：Customer Merge、CRM 直接锁车旧入口、7d/40/3d Opportunity 旧阈值、大字段 CRM、历史服务永久访问、P06-07 假 CRUD/config、Opportunity 独立工单/强待办/SLA；
- 已确认没有误废弃当前合法的 Opportunity、CRM Stage、Tags、Follow-up、Shared Profile、CRM 业务概览、Source Radar 等能力；
- Batch 3 候选：`P16-B3-01～P16-B3-06`；
- 6 条 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 Batch 3。

## 2026-10-06｜PDM-16 Batch 1 用户批准并执行

- 用户对 `P16-A01～P16-A12` 明确“全部同意”，随后“确认执行”；
- Batch 1 = `PASS / USER_APPROVED / APPLIED`；
- 已冻结：CRM Stage 与具体业务状态分离、Stage mutation 权限、Follow-up append-only、统一 CRM Follow-up 关联、Personal Note/Shared Profile/内部称呼分层、Tags/历史不随 owner 清空、CRM 只聚合真实业务事实、历史服务不产生永久访问权、最近行为只做聚合兴趣、Customer Opportunity 非独立工单、Source Radar 只消费 PDM-12、Opportunity/Radar/强待办三类语义分离；
- Batch 1 未误纳 Customer Merge、CRM 直接锁车旧入口、旧机会阈值、大字段 CRM 画像等 superseded 内容；
- Batch 2 候选：`P16-B2-01～P16-B2-07`；
- 6 条 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 Batch 2。

## 2026-10-06｜PDM-16 Startup Gate 通过并进入 Batch 1 审查

- 用户已确认 P16-R00：CRM = 客户经营资料与统一跟进层，不重建 Customer / Demand / Consultation / Recommendation / Lock / Transaction 状态机；
- Startup Gate = `PASS`；
- target=PDM-16 的 6 条 incoming handoff 已全部 `HANDOFF_ACCEPTED`；
- completed-PDM hard conflict = 0；
- incoming handoff gap = 0；
- 工作版：`07_重建工作区/PDM-16_CRM客户画像阶段跟进标签机会与SourceRadar_规则原子重建_工作版.md`；
- Startup Scan 已登记：Customer Merge stale carrier、CRM 直接锁车旧入口、旧机会阈值、大字段 CRM、永久访问误义、E03-03 跟进提交链缺失、P06-07 假 CRUD/config 风险、Opportunity/Radar/强待办 carrier 缺口；
- Batch 1 候选：`P16-A01～P16-A12`，状态 `PENDING_USER_REVIEW`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 Batch 1。

## 2026-10-06｜PDM-15 Final 正式发布并完成 Closeout

- 用户最终批准 Final Domain Overview 并确认执行；
- Final Approval Trace：`07_重建工作区/PDM-15_最终完整规则总览_待用户批准.md`；
- 正式 Authority：`07_重建工作区/PDM-15_最终完整规则.md`；
- Final Integrity：`07_重建工作区/PDM-15_最终完整性复核_2026-10-06.md / PASS`；
- `PDM-15 = COMPLETE / INTEGRITY_PASS`；
- 31 个正式规则 / 用户裁决单元全部进入 Final；
- 5 / 5 incoming handoff = `HANDOFF_CLOSED / SOURCE_BACKWRITE_DONE`；
- 来源 PDM-01 / 02 / 03 / 07 / 14 Final 已反向回写；
- 8 条 outgoing handoff 继续 `HANDOFF_OPEN`；
- IA / Low-Fi / Engineering 未施工；
- 下一步：PDM-16 Startup Gate。

## 2026-10-06｜PDM-15 Final 前完整性复核 R3

- P15-LIA-06 已 USER_APPROVED / APPLIED；
- R3：`PASS / FINAL_CANDIDATE_READY`；
- Source→Atom = PASS；
- Atom→Source = PASS；
- Semantic Completeness = PASS；
- Missing Rule = 0；
- Semantic Detail Gap = 0；
- Completed-PDM Conflict = 0；
- Incoming/Outgoing Handoff Gap = 0；
- Final Overview 候选：`07_重建工作区/PDM-15_最终完整规则总览_待用户批准.md`；
- 当前唯一下一步：用户最终审查 Final Domain Overview。

## 2026-10-06｜PDM-15 Final 前完整性复核 R2

- P15-LIA-01～P15-LIA-05 已 USER_APPROVED / APPLIED；
- PDM-15 outgoing handoff 共 8 条，已完整登记并保持 HANDOFF_OPEN；
- R2 报告：`07_重建工作区/PDM-15_Final前完整性复核_R2_2026-10-06.md`；
- `MISSING_RULE_UNRESOLVED = 0`；
- `SEMANTIC_DETAIL_GAP_UNRESOLVED = 1`；
- 唯一剩余修复候选：`P15-LIA-06` Consultation mutation actor/authority 精确矩阵；
- `COMPLETED_PDM_INVARIANT_CONFLICT = 0`；
- `HANDOFF_GAP_UNRESOLVED = 0`；
- `PDM15_FINAL_CANDIDATE_READY = NO`；
- 当前唯一下一步：用户审查 P15-LIA-06。

## 2026-10-06｜PDM-15 Final 前完整性复核 R1

- 报告：`07_重建工作区/PDM-15_Final前完整性复核_R1_2026-10-06.md`；
- 结论：`REPAIR_REQUIRED`；
- Source→Atom：发现 4 个未完整承接业务语义；
- Atom→Source：PASS；
- completed-PDM hard conflict = 0；
- incoming handoff gap = 0；
- outgoing handoff gap = 1 group；
- 修复候选：`P15-LIA-01～P15-LIA-05`；
- `PDM15_FINAL_CANDIDATE_READY = NO`；
- 当前唯一下一步：用户审查 Final 前修复候选。

## 2026-10-06｜PDM-15 Batch 4 用户裁决并执行

- 用户选择并确认执行：`1A、2A、3A、4A、5A、6A、7A`；
- `P15-B4-01～P15-B4-07 = PASS / USER_APPROVED / APPLIED`；
- Consultation 保持四主状态，`CANCELLED` 不作为第五主状态；
- 首次响应仅由真实人工服务动作完成，转派不完成/不重置 SLA；
- SLA 初始默认 15 分钟，可配置，创建时固化 deadline；
- 初始负责人按当前合法责任关系 → Demand responsible → Customer owner → 合格接客池；无人可承接时不得创建 responsible=null，也不得 System Admin 兜底；
- Customer 停用采用独立 `customer_disabled_hold`，暂停常规推进与未完成 SLA，恢复账号不自动恢复 Consultation；
- Transaction 不自动结束 Consultation；
- 工作台 SLA 优先级移交 PDM-21；
- `PDM15_LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`；
- 当前唯一下一步：Final 前完整性复核。

## 2026-10-06｜PDM-15 Batch 3 用户批准、执行与冲突隔离 PASS

- 用户对 `P15-B3-01～P15-B3-04` 明确“全部同意确认执行”；
- Batch 3 = `PASS / USER_APPROVED / APPLIED`；
- Batch 3 Conflict Isolation = `PASS`，`CONFLICT_OR_PRODUCT_CHOICE_MISCLASSIFIED_AS_BATCH3=0`；
- 已确认：Customer 可撤回 open Consultation；员工可记录真实跟进；员工结束语义区分解决/无效/正常关闭；Consultation 创建时消费有效 SLA 配置并固化本次 deadline；
- 未提前裁决：`CANCELLED` 第五主状态、首次真实人工响应完成条件、默认 15 分钟、负责人优先级、Customer 停用运行态、Transaction 负向边界；
- 形成 Batch 4 候选 `P15-B4-01～P15-B4-07`，建议 `1A、2A、3A、4A、5A、6A、7A`；
- 5 条 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 Batch 4。

## 2026-10-06｜PDM-15 Batch 2 用户批准、执行与反向冲突扫描 PASS

- 用户对 `P15-B2-01～P15-B2-05` 全部同意并启动执行；
- Batch 2 = `PASS / USER_APPROVED / APPLIED`；
- Reverse Conflict Scan = `PASS`，`FALSE_DEPRECATION_COUNT=0`；
- 明确废弃/不得恢复：旧“我要这辆车”统一意向、timeout 第五主状态/自动关闭、Customer Merge/Consultation 迁移、assignee 与 Customer owner 合一、Recommendation 驱动 Consultation 生命周期；
- 明确保留：客户撤回/正常关闭动作、SLA 与 timeout 提醒、正式 Consultation 转派、状态驱动 CTA、真实 Recommendation source relation、独立 Customer owner；
- 历史 Phase1.5 曾存在 Customer Merge Flow，但当前 Authority 已被 PDM-01 Final“V1 完全取消 Customer Merge”覆盖；
- Batch 3 候选：`P15-B3-01～P15-B3-04`；
- 5 条 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 P15-B3-01～P15-B3-04。

## 2026-10-06｜PDM-15 Batch 1 用户批准并执行

- 用户对 `P15-A01～P15-A08` 明确“全部同意”，随后明确“确定执行”；
- Batch 1 = `PASS / USER_APPROVED / APPLIED`；
- 已冻结：显式咨询建单、初始来源不可改写、同 customer+vehicle+listing_cycle 未终结幂等、Vehicle lifecycle 分层、Consultation assignee 与 Customer owner 分离、Recommendation 双向独立、档案不完整不阻断、4S Member 不进入名邦 Consultation 处理链；
- 状态机 `CANCELLED` 冲突、SLA 首次真实人工动作、负责人优先级、Customer 停用运行态等未被 Batch 1 偷渡裁决；
- 5 条 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- Batch 2 候选：`P15-B2-01～P15-B2-05`，状态 `PENDING_USER_REVIEW`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 P15-B2-01～P15-B2-05。

## 2026-10-06｜PDM-15 Startup Gate 通过并进入 Batch 1

- 用户已确认 PDM-15 核心定位：Consultation = 客户正式咨询工单，承接“明确咨询 → 合法负责人 → 真人跟进 → 合法结束”；
- Consultation 与 Customer owner / Recommendation / Lock / Transaction 分离，只保存必要真实关联，不自动互相改写主状态；
- Startup Gate = `PASS`；completed-PDM hard conflict = 0；incoming handoff gap = 0；
- target=PDM-15 的 5 条 incoming handoff 全部由 `HANDOFF_OPEN` → `HANDOFF_ACCEPTED`；
- 工作版已建立：`07_重建工作区/PDM-15_Consultation咨询生命周期来源负责人转派与SLA_规则原子重建_工作版.md`；
- 已登记 Current carrier 冲突：CANCELLED 主状态歧义、SLA 首次真实人工动作语义缺失、Consultation assignee 与 Customer owner 术语污染、Customer 停用运行态、Transaction 负向边界、工作台 SLA 优先级边界、负责人优先级/无合法负责人兜底；
- Batch 1 候选：`P15-A01～P15-A08`，状态 `PENDING_USER_REVIEW`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：用户审查 P15-A01～P15-A08。

## 2026-10-06｜PDM-14 Final 正式发布并完成 Closeout

- 用户最终批准 Final Domain Overview 并明确“确定执行”；
- Final Approval Trace：`07_重建工作区/PDM-14_最终完整规则总览_待用户批准.md`；
- 正式 Authority：`07_重建工作区/PDM-14_最终完整规则.md`；
- Final Integrity：`07_重建工作区/PDM-14_最终完整性复核_2026-10-06.md / PASS`；
- `PDM-14 = COMPLETE / INTEGRITY_PASS`；
- 52 个正式规则 / 裁决单元全部进入 Final；
- 8 / 8 incoming handoff = `HANDOFF_CLOSED / SOURCE_BACKWRITE_DONE`；
- 来源 PDM-01 / 03 / 04 / 07 / 10 / 11 / 12 / 13 Final 已反向回写；
- outgoing `HO-P14-P15/P18/P19/P20/P21/P23/P25` 继续 `HANDOFF_OPEN`；
- IA / Low-Fi / Engineering 未施工；
- 下一步：PDM-15 Startup Gate。

## 2026-10-06｜PDM-14 Final 前完整性复核 R2 通过

- 报告：`07_重建工作区/PDM-14_Final前完整性复核_R2_2026-10-06.md`；
- `SOURCE_TO_ATOM = PASS`；
- `ATOM_TO_SOURCE = PASS`；
- `SEMANTIC_COMPLETENESS = PASS`；
- `COMPLETED_PDM_INVARIANT = PASS`；
- `INCOMING_HANDOFF_SEMANTIC_COVERAGE = PASS`；
- `OUTGOING_HANDOFF_INTEGRITY = PASS`；
- `NEGATIVE_CLAIMS_VERIFIED = PASS`；
- `MISSING_RULE_UNRESOLVED = 0`；
- `SEMANTIC_DETAIL_GAP_UNRESOLVED = 0`；
- `CROSS_PDM_CONFLICT = 0`；
- `HANDOFF_GAP_UNRESOLVED = 0`；
- `PDM14_LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`；
- `PDM14_LOCAL_DEFERRED_UNRESOLVED = 0`；
- `PDM14_FINAL_CANDIDATE_READY = YES`；
- 当前唯一下一步：生成 PDM-14 Final Domain Overview 候选。

## 2026-10-06｜PDM-14 Final 前完整性修复 LIA-01～10 已执行

- `P14-LIA-01～P14-LIA-10 = USER_APPROVED / APPLIED`；
- 三类车源均可被正式 Recommendation；4S member hard DENY 与 4S Vehicle 可推荐明确分层；批发免费查价权仅适用于批发查价机制；
- Recommendation create/end/void 补齐 current responsibility + permission/capability + data scope + object state 提交重验；4S hard DENY，System Admin 不因身份自动执行业务；
- 批量推荐 UI 可批量，但底层逐 Vehicle 独立 Recommendation；
- Recommendation 不改变 Customer owner / Demand responsible；
- 普通 share link 无固定 N 天 TTL，可继续转发但不传播 Recommendation/price-right/visibility/Internal Mode；
- 批发车 Recommendation 创建时若仅“价格咨询”，同 cycle 后续出现数字价仍沿用免费权，不扣 daily quota；
- Recommendation/visibility 仅授 Customer Safe Projection，不扩大内部敏感字段；
- JYT/上游同步不得直接覆盖 Recommendation/visibility 等名邦 Business Data；
- Consultation 不反向创建 Recommendation、不授免费 price-right、不授 hidden visibility；
- outgoing handoff 已扩展到 PDM-15 / 18 / 19 / 20 / 21 / 23 / 25；
- 8 条 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- 当前唯一下一步：Final 前完整性复核 R2。

## 2026-10-06｜PDM-14 Batch 4 用户裁决并执行

- 用户选择：`1A、2B、3A、4A、5A、6A、7A、8A`；
- `P14-B4-01～P14-B4-08 = PASS / USER_APPROVED / APPLIED`；
- `PDM14_LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`；
- Recommendation end/void 改为按当前合法业务责任 + permission/data scope/object state 判断，不给历史 recommender 或经理/店长永久/天然操作权；
- Customer 失去 find-car entitlement 后不删除已有 Recommendation，但暂停 Recommendation-only 客户侧能力；恢复权益时仅恢复当时仍合法 active 对象；
- active Recommendation 在同 cycle 内持续作为 visible→hidden 后的 customer-specific visibility 授权来源；
- 普通分享链接只提供导航，每次打开按当前 Vehicle/listing_cycle/Customer/Priority/独立业务 Authority 实时重算；新 cycle 不继承旧周期权益；
- Recommendation 历史 price snapshot 与当前价格严格分层；旧 cycle Recommendation 不授权新 cycle 当前价格；
- 合法 source_type 修改 / 一键转名邦不重建、迁移或清空 Recommendation；
- active Lock / in-progress Transaction 占用本身不自动禁止 Recommendation，但 Recommendation 不产生锁车优先权、不绕过占用；
- Recommendation 与 Consultation 不相互反写；新增 `HO-P14-P15-001 = HANDOFF_OPEN`，由 PDM-15 承接 Consultation 完整生命周期；
- 8 条 incoming handoff 继续 `HANDOFF_ACCEPTED`，未提前关闭；
- 当前唯一下一步：PDM-14 Final 前完整性复核。

## 2026-10-06｜PDM-14 Batch 3 用户批准并执行

- `P14-B3-01～P14-B3-05 = PASS / USER_APPROVED`；
- Batch 3 Conflict Isolation：`PASS / CONFLICT_OR_PRODUCT_CHOICE_MISCLASSIFIED_AS_BATCH3=0`；
- 分享直达与普通进入统一使用同一套车辆详情业务页；SHARE_DIRECT 只增加必要轻量入口，不能复制第二套详情业务逻辑或绕过当前 visibility；
- 旧“我要这辆车”语义正式拆分：沟通车辆统一走 Consultation/“咨询”，锁车走独立 LockRequest/Lock 链；Recommendation 不由该按钮自动产生；
- “我的推荐”明确区分当前与历史；历史长期保留，但历史存在不等于当前仍有详情 visibility 或当前价格权，进入时重新读取当前事实；
- PDM-07 incoming handoff 正式承接：档案/报告不完整本身不得阻止 Recommendation；Recommendation/visibility grant 也不自动授客户查看 VIN、敏感原件或仅内部档案；
- PDM-13 incoming handoff 进一步冻结：Priority 可保存 recommendation_id 仅作关联追溯；Priority 与 Recommendation 生命周期仍完全独立；
- LockRequest 的 6h/审批/Waitlist 等完整生命周期未被抢入 PDM-14，继续归 PDM-18；
- 分享模板、分享图、营销文案等页面细节未因 Batch 3 被误冻结为 PDM-14 核心生命周期规则；
- 8 条 incoming handoff 继续 `HANDOFF_ACCEPTED`，未提前关闭；
- 当前唯一下一步：PDM-14 Batch 4 冲突 / 遗漏 / 缺口 / 新产品选择候选重建。

## 2026-10-05｜PDM-14 Batch 2 用户批准并执行

- `P14-B2-01～P14-B2-11 = PASS / USER_APPROVED`；
- Batch 2 Reverse Conflict Scan：`PASS / FALSE_DEPRECATION_COUNT=0`；
- 独立 Recommendation qualification、P06-06、RECOMMENDATION_QUALIFIED/NOT_QUALIFIED 与仅服务旧开关的独立管理能力正式废弃；
- 经理/店长/协作身份本身不产生 Recommendation 创建权；旧“只有 Customer current owner 才能推荐”的绝对规则被 owner/handover/Demand responsibility 当前合法业务负责关系替代；
- Priority responsible 不得成为新的 Recommendation 授权来源；
- 旧“客户转发永远 SOURCE_ONLY”被 PDM-03 当前分享归属 Authority 替代，但 SOURCE_ONLY 状态本身继续保留；
- REC 专属 URL / Recommendation-specific link / 第二套推荐分享链路明确 DO_NOT_RESTORE；
- “所有 Vehicle 必须 Recommendation 后才可见”正式废弃；hidden Customer 详情权必须由正式 Recommendation + visibility grant 建立，Demand/Priority 本身不授客户详情权；
- 其他 Customer active Priority 期间不得删除/结束既有 Recommendation，只做 suppression，ended 后按当前事实 restore；
- Customer Merge 与 Recommendation/price-right/Consultation 等权益迁移继续按 PDM-01 Final 全面禁止；P06-01/P06-M01 Merge carrier 登记 stale；
- Recommendation 创建后的系统自动微信发送/发送成功失败状态机不得恢复；
- 新增 stale carrier：old owner-only 阻断合法 Demand responsible、customer re-share always SOURCE_ONLY、REC 专属链路、HIDDEN_CONTROLLED Demand/Priority 直授客户详情、P06-01/P06-M01 Merge；
- 8 条 incoming handoff 继续保持 `HANDOFF_ACCEPTED`，未提前关闭；
- 当前唯一下一步：PDM-14 Batch 3 明确知情修改 / 显式新增候选重建。

## 2026-10-05｜PDM-14 Start Gate、Batch 1 与四项用户裁决已执行

- PDM-14 工作版已建立：`07_重建工作区/PDM-14_Recommendation分享单车授权与可见性_规则原子重建_工作版.md`；
- Start Gate：`PASS`；
- target=PDM-14 的 8 条 incoming handoff：全部由 `HANDOFF_OPEN` → `HANDOFF_ACCEPTED`，Final / Integrity closeout 前不得关闭；
- Batch 1：`P14-A01～P14-A14 = PASS / USER_APPROVED`；
- Recommendation 与 Matching / Priority / 普通分享 / visibility grant 分离；同 customer+vehicle+listing_cycle active 幂等；无固定 N 天 TTL；核心历史事实不可普通改写；同周期结束后可重建、新周期不继承；
- 普通分享不授 Recommendation / price / visibility；分享接收人按自身 Customer 权益判断，owner 归属服从 PDM-03 当前 Authority；
- hidden 可售 Vehicle 可通过正式 Recommendation 建 Customer 单车 visibility grant，Priority 本身不授客户详情权；
- Recommendation 免费查价权继承 PDM-10 当前 cycle Authority；Recommendation price snapshot 为不可变历史；
- source_demand_id 为 0/1 真实来源，“我的推荐”只承载正式 Recommendation；
- `P14-R01`：Priority qualification 属于 Customer，不属于 Employee；Priority 不改变既有 owner / 合法业务责任关系，也不额外创造 Recommendation 权限；
- `P14-R02`：取消独立 Recommendation qualification；正式找车 / Recommendation 资格统一读取 Customer Level `find-car entitlement`；Priority qualification 继续独立，只负责 Priority；
- `P14-R03`：Customer disable 只暂停 Recommendation 客户侧能力并禁止新建，不删除/结束历史；restore 只重新开放恢复时仍合法有效的对象，不复活 ended/void/周期失效 Recommendation；
- `P14-R04`：其他 Customer active Priority 期间，既有 Recommendation/visibility 历史不删除，只临时 suppression 客户访问；Priority ended 后按当前 Recommendation/listing_cycle/Vehicle/Customer/Priority/Lock/Transaction 事实决定 restore；
- 旧 `P06-06 / RECOMMENDATION_QUALIFIED / NOT_QUALIFIED` 等独立推荐资格 carrier 已登记为 `CARRIER_DEFERRED`，不得施工；
- 对 PDM-01～PDM-13 Final 复核：上述新口径无 completed-PDM 冲突；冲突集中在旧 R7 / Current IA / Low-Fi carrier；
- 当前下一步：PDM-14 Batch 2 明确废弃 / 替代 / DO_NOT_RESTORE 候选审查。

## 2026-10-05｜PDM-13 Final 正式发布与完整性收口

- 用户对 PDM-13 Final Domain Overview 明确“全部同意”，随后明确“确认执行”；
- 正式 Authority：`07_重建工作区/PDM-13_最终完整规则.md`；
- 用户最终批准留痕：`07_重建工作区/PDM-13_最终完整规则总览_待用户批准.md`；
- Final 前当前有效 Gate：`07_重建工作区/PDM-13_Final前完整性复核_R2_2026-10-05.md`；
- Final Integrity：`07_重建工作区/PDM-13_最终完整性复核_2026-10-05.md`；
- 38 条正式规则 / 修复 Atom 全部进入 Final；
- 5 条 incoming handoff：HO-P03-P13-001 / HO-P04-P13-001 / HO-P07-P13-001 / HO-P11-P13-001 / HO-P12-P13-001 = `HANDOFF_CLOSED`；
- PDM-03 / 04 / 07 / 11 / 12 Final 同次完成 source backwrite；
- PDM-13 outgoing 8 条 handoff 继续 `HANDOFF_OPEN`；
- `SOURCE_TO_FINAL / FINAL_TO_SOURCE / SEMANTIC_COMPLETENESS / COMPLETED_PDM_INVARIANT / CROSS_PDM_INTEGRITY / HANDOFF_INTEGRITY / NEGATIVE_CLAIMS = PASS`；
- `MISSING_RULE_UNRESOLVED = 0`；
- `SEMANTIC_DETAIL_GAP_UNRESOLVED = 0`；
- `CROSS_PDM_CONFLICT = 0`；
- `HANDOFF_GAP_UNRESOLVED = 0`；
- PDM-13 = `COMPLETE / INTEGRITY_PASS`；
- 下一域允许进入 PDM-14。

## 2026-10-05｜PDM-13 修正 Final Overview 候选已生成

- 候选文件：`07_重建工作区/PDM-13_最终完整规则总览_待用户批准.md`；
- 状态：`FINAL_CANDIDATE / WAITING_USER_FINAL_APPROVAL`；
- 当前正式规则 / 修复 Atom = 38；
- 已纳入 LIA-07：Match tier downgrade 立即重评；
- 已纳入 LIA-08：TTL 是最长保护上限、销售可 TTL 前 release / 不推荐此车、Recommendation/Priority 两对象独立、Lock/Transaction 不反向撤销；
- R2 完整性报告 = `07_重建工作区/PDM-13_Final前完整性复核_R2_2026-10-05.md`；
- 5 条 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- PDM-13 Final 仍未发布；
- 当前唯一下一步：等待用户最终批准该总览。

## 2026-10-05｜PDM-13 Final Overview 复查补漏与 R2 PASS

- Final Overview 复查发现 `P13-LIA-07～P13-LIA-08`；
- LIA-07：active Priority 的 current Match Result 若由 high/acceptable 降为 confirmation_needed/no_match，必须立即重评；有同 Customer 其他合法 Demand 则切 trigger_demand_id 且 expires_at 不变，无则 ended 并重新仲裁；
- LIA-08：TTL 是最长自动保护上限，不要求等满；合法 responsible employee 可在 TTL 前主动“释放 Priority / 不推荐此车”，释放后立即重新仲裁；
- 尚未 Recommendation 时，Priority release 不得叫“取消推荐”；
- 已有 Recommendation 时，Recommendation end 与 Priority release 可在体验层组合，但底层必须分别执行、校验、审计；
- Recommendation cancellation alone 不结束 Priority，也不单独触发 same-cycle suppression；
- Priority release / expiry alone 不结束仍合法 Recommendation；
- Recommendation cancel / Priority release / expiry 不得反向撤销已合法成立 Lock / Transaction；
- 正式 Recommendation 成立后 Priority 可保存 recommendation_id 作为关联追溯，但生命周期仍分离；
- B4-04/B4-08 旧“Recommendation cancellation 自动等于 Priority ended / same-cycle suppression”口径已被 LIA-08 用户修正版 supersede；
- R1 报告继续保留历史；当前有效 Final 前 Gate 报告为 `07_重建工作区/PDM-13_Final前完整性复核_R2_2026-10-05.md`；
- R2：Source→Atom / Atom→Source / Semantic Completeness / Completed-PDM Invariant / Cross-PDM Handoff / Negative Claims = PASS；
- 正式规则/修复 Atom 总数由 36 增至 38；
- incoming handoff 5 / 5 继续 `HANDOFF_ACCEPTED`；
- 当前唯一下一步：重新生成修正后的 PDM-13 Final Domain Overview 候选并提交用户最终批准。

## 2026-10-05｜PDM-13 Final 前修复与二次完整性复核 PASS

- 第一轮 Final 前审计发现 `P13-LIA-01～P13-LIA-06`，用户全部同意并明确“确认执行”；
- 已补齐：单 Customer Priority 资格开关生命周期、单 Customer 多 Vehicle active Priority 无上限、event-driven 重评、普通入口/公共统计排他、Priority 与价格/查价权隔离、PDM-20/21/22 future handoff；
- 新增 `HO-P13-P20-001 / HO-P13-P21-001 / HO-P13-P22-001 = HANDOFF_OPEN`；
- PDM-13 outgoing future handoff 当前共 8 条：PDM-14 / 17 / 18 / 19 / 20 / 21 / 22 / 25；
- 二次复核：Source→Atom / Atom→Source / Semantic Completeness / Completed-PDM Invariant / Cross-PDM Handoff / Negative Claims 全部 PASS；
- `MISSING_RULE_UNRESOLVED = 0`；
- `SEMANTIC_DETAIL_GAP_UNRESOLVED = 0`；
- `CROSS_PDM_CONFLICT = 0`；
- `HANDOFF_GAP_UNRESOLVED = 0`；
- `PDM13_LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`；
- `PDM13_LOCAL_DEFERRED_UNRESOLVED = 0`；
- 报告：`07_重建工作区/PDM-13_Final前完整性复核_2026-10-05.md`；
- 5 条 incoming handoff 继续保持 `HANDOFF_ACCEPTED`，未提前关闭；
- 当前唯一下一步：生成 PDM-13 Final Domain Overview 候选并提交用户最终批准。

## 2026-10-05｜PDM-13 Batch 4 用户批准并执行

- 用户最终裁决：B4-01 按用户修正版；B4-02=2A、B4-03=3A、B4-04=4A、B4-05=5A、B4-06=6A、B4-07=7A、B4-08=8A；
- Priority 资格固定为后台针对单个 Customer 的独立开关，不由 Customer Level 自动产生；Customer Level 继续只决定正式 find-car entitlement；
- 所有合法正式 Demand 共用 PDM-12 一套 Matching；hidden 但真实可售 Vehicle 仍可内部 Matching；
- active Priority 是 Matching 后的限时排他保护：其他普通客户/无关员工不能通过普通后续链路获得该车；Priority Customer 本人也不会因 Priority 自动获得详情权；
- trigger Demand 当前合法负责人先处理并决定 Recommendation；Recommendation/visibility grant 合法成立后客户才可见；
- 不建设独立全局 priority.view / priority.manage / priority.override；Priority 查看/处理跟随业务责任、合法管理范围及 PDM-02 通用权限模型；
- 多 Priority Customer 仲裁：high > acceptable → Demand.created_at 更早 → demand_id 更小；
- 默认 TTL=24h/86400s，后台全局可配，创建时冻结，不人工续期；Recommendation、重算、trigger Demand 切换、责任交接均不重置；
- same listing_cycle 对客户放弃/员工释放/Recommendation 取消/TTL expired 做自动再获得抑制；新真实事实或新 listing_cycle 可重新参加仲裁；
- trigger Demand 失效时优先切同 Customer 其他合法 Demand，原 expires_at 不变；无可切换 Demand 则 ended；
- active Lock 不阻断 Matching 但阻止新 Priority；正式 Lock / in-progress Transaction 可结束 active Priority；释放/取消后不恢复旧 Priority，重新按当前事实仲裁；
- Priority current responsible 跟随 trigger Demand responsible；Handover Batch 中 TTL 自然运行，不暂停、不延长、不重置；无合法负责人不得新建 Priority；
- Priority 资格本身不是公海保护，active Priority 才是；ended 后重读其他保护事实；
- ended 必须保留真实 reason，并在 Vehicle 合法重新开放后读取所有 Customer 当前合法 Match Result 再决定新 Priority 或普通业务流；
- 新增 PDM-13→PDM-14/17/18/19/25 future handoff，均登记 HANDOFF_OPEN；
- PDM-13 incoming 5 条 handoff 继续 HANDOFF_ACCEPTED，待 Final / Integrity closeout；
- stale carrier 新增：历史独立 priority.view 全局穿透查看方向已 superseded；
- 当前唯一下一步：PDM-13 Final 前完整性复核。

## 2026-10-05｜PDM-13 Batch 3 用户批准并执行

- `P13-B3-01～P13-B3-06 = PASS / USER_APPROVED`；
- Batch 3 冲突隔离 = PASS；
- Priority 员工侧查看/处理统一继承 PDM-02 `identity + permission + data scope + object state`；
- Priority 交接正式进入 Handover Batch，部分失败不整体回滚，历史不改写；
- 若 Priority 仲裁使用 Demand 创建先后，只能读取不可变 `Demand.created_at`，但是否采用该维度仍留 Batch 4；
- Demand/Matching 退出 current valid 后，已有 Priority 必须重新评估，不得继续依赖 stale/invalidated Match Result；
- active Lock 不阻断 PDM-12 Matching，PDM-13 只处理 Lock×Priority 关系；
- Priority 重评只消费 PDM-12 current Match Result / Matching change fact，不复制第二套 Matching Authority；
- 资格来源 / 等级关系 / 精确仲裁 / TTL / 续期 / same-cycle / trigger_demand / active Lock 最终答案 / Transaction / 公海保护 / 无 owner 与 capability 最终边界继续 Batch 4；
- 5 条 incoming handoff 继续保持 `HANDOFF_ACCEPTED`；
- 当前唯一下一步：PDM-13 Batch 4 真实冲突 / 缺口 / 新产品选择候选审查。

## 2026-10-05｜PDM-13 Batch 2 用户批准并执行

- `P13-B2-01～P13-B2-05 = PASS / USER_APPROVED`；
- Batch 2 反向冲突扫描 = PASS；
- 明确禁止恢复：独立“客户专属”体系、人工创建/转让/覆盖/延长 Priority、Priority 作为 Lock 优先权、客户端暴露 Priority 内部术语、Priority 本身直接授予客户详情权；
- Current Navigation `E05-05｜创建 Priority` 正式登记为 stale carrier，不得按人工创建实现；
- Current `E05-05::HIDDEN_CONTROLLED` 中“Priority 直接让客户可见”的旧语义正式标记 superseded；
- 明确没有废弃：Priority qualification / Customer Level 关系 / 精确仲裁 / `Demand.created_at` tie-break / TTL 默认数值 / TTL 配置主体 / 续期 / 完整结束原因 / same-cycle / trigger_demand / active Lock / Transaction / 公海保护 / 重仲裁事件；
- 5 条 incoming handoff 继续保持 `HANDOFF_ACCEPTED`，不得在 Final 前提前关闭；
- 当前唯一下一步：PDM-13 Batch 3 明确新增 / 明确变更候选重建。

## 2026-10-05｜PDM-13 Batch 1 用户批准并执行

- PDM-13 工作版已建立：`07_重建工作区/PDM-13_Priority仲裁TTL与Lock边界_规则原子重建_工作版.md`；
- target=PDM-13 的 5 条 incoming handoff 已全部读取并接收：HO-P03-P13-001 / HO-P04-P13-001 / HO-P07-P13-001 / HO-P11-P13-001 / HO-P12-P13-001 = `HANDOFF_ACCEPTED`；
- Current Authority Refresh / Current Implementation Fact 已完成；
- Batch 1：`P13-A01～P13-A11 = PASS / USER_APPROVED`；
- 已冻结：Priority 不复制 Matching、只消费当前合法 high/acceptable、不得猜测/篡改 provenance、同车唯一 active、同 customer+vehicle+listing_cycle 幂等、TTL 创建时冻结、交接不改历史、Priority 不改 owner、与 Recommendation 分离、不改 Vehicle/listing_cycle、结束只恢复底层应有状态、历史不可抹除；
- 明确未偷渡：Priority 客户资格 / Customer Level 关系 / 精确仲裁顺序 / TTL 默认数值与配置 actor / 续期 / 完整结束原因 / active Lock / Transaction / 客户详情 visibility / 公海保护等继续后续批次；
- stale carrier 已登记：Navigation 残留“创建 Priority”；E05-05 HIDDEN_CONTROLLED 残留“Priority 本身给客户详情权”的旧口径；
- 当前唯一下一步：PDM-13 Batch 2 明确废弃 / 替代 / DO_NOT_RESTORE 候选重建，形成候选后停下用户审查。

## 2026-10-05｜PDM-12 Final 用户最终批准并正式发布

- Final Domain Overview：用户最终全部同意；
- 此前确认执行的执行授权继续有效，已正式发布；
- 正式 Authority：`07_重建工作区/PDM-12_最终完整规则.md`；
- 用户批准留痕：`07_重建工作区/PDM-12_最终完整规则总览_待用户批准.md`；
- 最终完整性报告：`07_重建工作区/PDM-12_最终完整性复核_2026-10-05.md`；
- 44 个正式 Atom 全部进入 Final；
- Source→Final / Final→Source / Semantic Completeness / Completed-PDM Invariant / Handoff / Negative Claims = PASS；
- HO-P04-P12-001 / HO-P05-P12-001 / HO-P07-P12-001 / HO-P11-P12-001 = HANDOFF_CLOSED；
- PDM-04 / 05 / 07 / 11 Final 已完成 source backwrite；
- PDM-12 outgoing handoff 到 PDM-13 / 14 / 16 / 18 / 20 / 21 / 22 / 25 继续 OPEN；
- PDM-12 = `COMPLETE / INTEGRITY_PASS`；
- 当前进入 PDM-13 启动门禁。

## 2026-10-05｜PDM-12 Final 前完整性修复与二次复核 PASS

- `P12-LIA-01～P12-LIA-06 = USER_APPROVED / APPLIED`；
- LIA-01：客户未填写正式条件 = 不限，不等于 unknown；
- LIA-02：补齐 matching readiness，部分 component 待确认不必停止整个 Demand Matching；
- LIA-03：confirmation_needed 不占车、不排他、不阻断其他 Customer/Demand；
- LIA-04：补齐 Matching 集合进入/退出与 stale result invalidation；
- LIA-05：active Lock 本身不等于不可 Matching；新增 `HO-P12-P18-001`；
- LIA-06：人工确认执行主体继承 PDM-02；精化 PDM-20 车型年款/首次上牌年份与数字价格筛选边界；PDM-21 固定确认事实→重算→再读 tier；
- PDM-12 stale carrier 6 项已登记，只登记不施工；
- Final 前二次复核：Source→Atom / Atom→Source / Semantic Completeness / Completed-PDM Invariant / Cross-PDM Handoff / Negative Claims 全部 PASS；
- 报告：`07_重建工作区/PDM-12_Final前完整性复核_2026-10-05.md`；
- 当前唯一下一步：生成 PDM-12 Final Domain Overview 候选并提交用户最终批准。

## 2026-10-05｜PDM-12 Batch 4 用户批准

- `P12-B4-01～P12-B4-06 = PASS / USER_APPROVED`；
- 用户裁决：`1A / 2A / 3A / 4A / 5A / 6A`；
- 无预算 + 价格咨询：价格维度不限；有预算 + 价格咨询：`confirmation_needed`；
- 里程只把最高可接受里程作为 hard condition，低于表达下限仍可符合；
- 变速箱 / 配置偏好 / 过户次数 / 城市距离 / 排放标准 / 车源类型继续不参与 V1 自动四级 Matching；
- Rule Dictionary 正式规则不普通物理删除，只停用/废弃并保留历史审计；
- partial failure 不整体回滚，成功对象保留新结果，只重试失败集合；失败对象旧 Match Result 不得继续驱动新的 Priority/Recommendation；
- 新增 `matching.rule.manage`：active 名邦 Employee 受独立 permission 控制，4S hard DENY，System Admin 只配置权限、不因身份自动取得写规则能力；
- `PDM12_LOCAL_DEFERRED_UNRESOLVED = 0`；
- outgoing future handoff 已登记到 PDM-13 / 14 / 16 / 20 / 21 / 22 / 25；
- 当前唯一下一步：PDM-12 Final 前完整性复核。

## 2026-10-05｜PDM-12 Batch 3 用户批准

- `P12-B3-01～P12-B3-07 = PASS / USER_APPROVED`；
- find-car entitlement 在正式 Matching / 重算前动态重验，并与 PDM-11 active/paused/readiness 状态机统一；
- P06-10 Rule Dictionary 恢复为真实可维护业务对象，补字段、基础 Action、scope priority、same-level conflict 与无副作用测试解析；
- VR-P-021 / VR-P-022 正式承接：正/反向表达、hard/preferred/tolerance、局部例外、证据优先级、component 局部影响；
- Matching 结果必须可解释；
- 词典变化按受影响范围重解析/重算，禁止无脑全库；
- 新增 `HO-P12-P16-001 = HANDOFF_OPEN`：PDM-12 产生 Matching change fact，PDM-16 Source Radar 消费，不复制第二套 Matching Authority；
- 当前唯一下一步：Batch 4 真实冲突 / 语义缺口 / 新产品选择候选审查。

## 2026-10-05｜PDM-12 Batch 2 用户批准

- `P12-B2-01～P12-B2-10 = PASS / USER_APPROVED`；
- 冻结不得恢复：第二套客户专属/独立匹配、普通关键词搜索替代共享解析、客户原话/AI 猜测直入 Matching、mapping pending 阻断已明确 JYT 车型事实、hidden=offline、猜测车况、恢复整套旧车况字段、closest fallback、Match Result 自动制造下游对象、定时全库扫描作为唯一更新机制；
- Batch 2 反向冲突扫描 = PASS；
- 明确排除：旧字段排除清单、里程特殊规则、P06-10 完整治理、VR-P-021/022、无预算+价格咨询、Priority 完整生命周期均继续后续审查，不属于已废弃；
- 当前唯一下一步：形成 Batch 3 后续明确新增 / 明确变更项候选并停下等待用户审查。

## 2026-10-05｜PDM-12 Batch 1 用户批准

- Current Authority Refresh / Current Implementation Fact 已完成；
- Batch 1：`P12-A01～P12-A15 = PASS / USER_APPROVED`；
- P12-A15 正式冻结：车源主页搜索与正式 Demand Matching 共用同一套确定性解析 / 匹配词典；共享解析层，但搜索不创建 Match Result / Priority / Recommendation / Demand / Lock；
- M03-001～M03-003 Source→Atom 反查完成；
- 首轮发现 `SEARCH_MATCH_SHARED_DICTIONARY` 属于“证据已读但 Atom 未生成”，现已修复；
- 当前 `UNMAPPED_STABLE_BATCH1_RULE = 0`；
- P06-10 Action/scope/test/retry、旧字段排除、里程特殊规则、VR-P-021/022 等均显式保留到后续批次，不视为丢失；
- 当前唯一下一步：形成 Batch 2（废弃 / 禁止恢复项）候选并停下等待用户审查。

## 2026-10-05｜PDM-11 最终批准并进入 PDM-12

- PDM-11 Final 用户批准：PASS；
- 正式 Authority：`07_重建工作区/PDM-11_最终完整规则.md`；
- Final Integrity：`INTEGRITY_PASS`；
- `HO-P01-P11-002 = HANDOFF_CLOSED`；
- PDM-01 source backwrite 已完成；
- PDM-12 工作版已建立；
- PDM-12 incoming：HO-P04-P12-001 / HO-P05-P12-001 / HO-P07-P12-001 / HO-P11-P12-001 均已 ACCEPTED；
- PDM-12 尚未开始 Batch 结论，仅进入证据重建。

## 2026-10-05｜PDM-11 Final 前完整性复核完成

- P11-LIA-01：补齐无 owner / pool-empty Application 创建 Guard，不允许 `responsible=null`；
- P11-LIA-02：pending Application 明确为公海保护事实，并扩展 PDM-17 handoff；
- P11-LIA-03：用户裁决双向结束——客户发起结束请求，员工确认后按真实结果落 `completed / cancelled`；员工也可直接结束；不新增第五主状态；
- P11-LIA-04：补齐不可变 `Demand.created_at`，供 PDM-13 后续仲裁引用；
- P11-LIA-05：客户端等级升级提示必须读取当前真实 entitlement 配置，粉丝/VIP 仅当前配置示例；
- P11-LIA-06：PDM-12/13/14/16/17/20/21/22/25 handoff 已扩展，禁止“交后面做”时再次压缩丢细节；
- P11-LIA-07：补 PDM11-GATE-B1，修 Current stale；
- Customer disable 对 pending Application：保留历史、不自动关闭、停用期间不得激活，恢复后也不自动激活；
- 当前状态：`PREFINAL_INTEGRITY_PASS / FINAL_CANDIDATE_READY`。

## 2026-10-05｜PDM-11 Batch 4 全部确认

- P11-B4-01：所有 Find-car Application 均先 pending；不因已有 entitlement 自动 active；必须由合法员工在处理详情中人工创建 / 激活唯一 Demand；
- P11-B4-02：正式找车资格只来自 Customer Level 配置；普通客户当前无正式找车权益；需要开通时通过等级升级到具备权益的粉丝 / VIP 等等级；不建设单 Customer find-car entitlement override；
- 客户等级调整继承 PDM-02 permission + data scope + object state，不建设固定多级审批；经理 / 店长可按配置拥有，个别销售可明确授权；
- 普通客户可提交找车 Application，但无权益时只保持 pending；客户端必须明确提示升级等级 / 联系顾问；
- 联动回写 PDM-10：daily quota 只限制批发车；LIMITED 列表隐藏精确数字价，详情真实进入时有额度自动解锁，无二次“查看价格”点击；quota 耗尽主字段 `--万`；UNLIMITED 列表/详情直接显示数字价；临时增加当天次数对客户免费；
- PDM-11 已正式登记 PDM-12/13/14/16/17/20/21/22/25 future handoff；
- Batch 4 = `PASS / USER_APPROVED`；
- 当前进入 PDM-11 Final 前完整性复核。

## 2026-10-05｜PDM-11 Batch 3 用户修正并通过

- 用户否决旧“账号停用不自动改变 Demand 状态”的口径；
- 当前 Authority：Customer 停用 → active Demand 自动 paused；历史、条件、推荐/匹配/跟进、负责人/状态历史全部保留；
- 账号恢复后不自动恢复 Demand，需正式 resume；
- PDM-01 Final §11 已完成 source backwrite；
- `HO-P01-P11-001 = HANDOFF_SUPERSEDED`；
- `HO-P01-P11-002 = HANDOFF_ACCEPTED`；
- Batch 3 = `PASS / USER_APPROVED`；
- 当前进入 Batch 4：`P11-B4-01 / P11-B4-02`。
## 2026-10-05｜PDM-11 Batch 2 全部确认

- 用户确认 P11-B2-01～P11-B2-07、P11-B2-09、P11-B2-10 全部同意；
- P11-B2-08 继续采用此前用户主动修正版；
- Batch 2 = `PASS / USER_APPROVED`；
- 当前进入 Batch 3；
- Batch 3 当前正式待审项：`P11-B3-01`。
## 2026-10-05｜PDM-11 P11-B2-08 用户修正

- 原候选“找车权益下降不得自动影响 active Demand”撤回；
- 当前规则：entitlement 下降/取消 → active Demand 自动 paused；
- Demand、条件、历史匹配、Recommendation、CRM 跟进、状态/负责人历史全部保留；
- entitlement 恢复后不自动 active，需客户本人或有权限员工正式恢复；
- Customer 账号停用与 entitlement 下降严格分离；账号停用本身不自动改 Demand 状态；
- P11-B2-08 = `USER_MODIFIED / USER_APPROVED`；
- Batch 2 剩余 9 条继续 `USER_REVIEW_PENDING`。
## 2026-10-05｜PDM-11 Batch 1 全部确认

- 用户明确确认 `P11-A01～P11-A13` 全部同意；
- Batch 1 = `PASS / USER_APPROVED`；
- 未将 Customer 停用后续修改偷渡入 Batch 1，继续保留在 Batch 3；
- 未将 Application 激活时机 / 找车资格来源真实冲突偷渡入 Batch 1，继续保留在 Batch 4；
- 当前进入 Batch 2：`P11-B2-01～P11-B2-10 / USER_REVIEW_PENDING`。
## 2026-10-05｜PDM-11 启动与证据重建完成

- 已读取并承接 `HO-P01-P11-001`，状态从 `HANDOFF_OPEN` → `HANDOFF_ACCEPTED`；
- 已建立 PDM-11 Completed-PDM Dependency Card、术语表、Current Implementation Fact 卡；
- 已重新读取 9/06 SSOT / Decision、9/19 C2 / R10 / R12、IA V5、实际 Low-Fi、M03/M16/M17、已完成 PDM Final；
- 已形成 Batch 1 稳定一致候选 `P11-A01～P11-A13`；
- 已识别真实历史冲突：找车权益客户是否可直接激活 Demand vs 9/19 统一 pending 后由员工激活，暂挂 Batch 4，不静默选择；
- 已识别找车资格来源模型缺口，暂挂 Batch 4；
- Customer 轻量停用不终止既有 Demand 属于 PDM-01 后续明确知情修改，预挂 Batch 3；
- 当前状态：`BATCH_1_USER_REVIEW_PENDING`。
## 2026-10-05｜PDM-01～10 全局总复核完成

- `GLOBAL_PDM01_10_CROSS_PDM_AUDIT = PASS`；
- PDM-01～10 内部 handoff 无 OPEN / ACCEPTED 残留；
- CLOSED handoff 全部有目标 Authority 且 `source_backwrite=YES`；
- future PDM-11～25 保留 69 条合法 `HANDOFF_OPEN`；
- 全局 invariant：Customer / Employee / Vehicle 身份、owner、permission、System Admin、4S、listing_cycle、source facts、snapshot、sensitive access、Customer disable、formal-history delete 全部 PASS；
- 本轮仅修正两项控制性 stale：PDM-01～07 顶部状态元数据、PDM-01 §10 对 PDM-02 的过期“留后续”文字；
- 全局报告：`07_重建工作区/PDM-01至10_全局Cross-PDM_Handoff_GlobalInvariant总复核_2026-10-05.md`；
- PDM-11 启动门禁：`UNBLOCKED`；
- PDM-11 incoming：`HO-P01-P11-001`。
## 2026-10-05｜PDM-10 Legacy Final Integrity Audit 完成

- PDM-10 Integrity：`INTEGRITY_PASS`；
- 本轮关闭 5 组问题：Customer 停用价格权益真实闭环、DAILY_PRICE_QUOTA_EXHAUSTED→联系顾问、3A LIMITED/UNLIMITED 与临时额度、PDM-14/18/20/21/22/25 formal handoff、IA/Low-Fi stale carrier；
- 用户最终裁决 3A：UNLIMITED 时禁止新增临时查价次数；当天已有 today_temp_additions 保留，同日回 LIMITED 后继续有效；UNLIMITED 浏览不计 quota consumption；
- PDM-01～PDM-10 单域 Legacy Final Integrity Audit 至此全部 `INTEGRITY_PASS`；
- 审计报告：`07_重建工作区/PDM-10_历史最终版完整性复核_2026-10-05.md`；
- 当前进入：`GLOBAL_PDM01_10_CROSS_PDM_AUDIT`；
- PDM-11 继续 BLOCKED，直到全局总复核 PASS。
## 2026-10-05｜PDM-09 Legacy Final Integrity Audit 完成

- PDM-09 Integrity：`INTEGRITY_PASS`；
- 本轮关闭 5 组问题：P03-05 source_platform+upstream_publisher_id 与电话明文权限隔离、无有效号码不覆盖旧缓存、3A source_type 电话入口裁剪、PDM-21/22/23/25 future handoff、IA/Low-Fi/旧实现 stale carrier；
- 用户最终裁决 3A：上游电话只作为当前 wholesale/JYT 批发车源的日常敏感能力；批发→名邦或当前为 4S 后，车辆详情关闭查看/latest/拨打入口，但 publisher 来源事实、缓存、history、审计不删除；
- P09-A04-R1 / P09-A11-R1 的 Collector 取号→名邦 Integration API 回传架构保持不变；
- 审计报告：`07_重建工作区/PDM-09_历史最终版完整性复核_2026-10-05.md`；
- 当前进入：PDM-10 Legacy Final Integrity Audit；
- PDM-11 继续 BLOCKED。
## 2026-10-05｜PDM-08 Legacy Final Integrity Audit 完成

- PDM-08 Integrity：`INTEGRITY_PASS`；
- 本轮关闭 5 组问题：分享卡片动态价格 DENY、报告/H5旧 URL 权限重验、3A 资产化未闭环临时受控回源、PDM-20/21/22/25 future handoff、IMG-001～030 traceability 归一；
- 用户最终裁决 3A：转名邦后尚未成功资产化的图片，在任务未闭环期间可通过名邦受控 CDN 临时回源 JYT；成功后立即切自有对象存储，禁止长期依赖 JYT；
- 工作版早期 IMG mapping 降为 historical/superseded，以 2026-10-03 CDN 重映射为唯一 Current traceability；
- 审计报告：`07_重建工作区/PDM-08_历史最终版完整性复核_2026-10-05.md`；
- 当前进入：PDM-09 Legacy Final Integrity Audit；
- PDM-11 继续 BLOCKED。
## 2026-10-05｜PDM-07 Legacy Final Integrity Audit 完成

- PDM-07 Integrity：`INTEGRITY_PASS`；
- 本轮关闭 4 组问题：PDM-08 报告/档案资源 handoff closure、PDM-12/13/14/15/18/19 业务 handoff、PDM-20/21/22/25 页面/配置/审计 handoff、IA/Low-Fi stale carrier；
- PDM-08 已完成的出险图片、4S维保图片/H5、报告/档案与普通相册隔离、名邦可控报告域名等资源承载已反向写回 PDM-07；
- 历史整套结构化车况字段不恢复，继续执行 P07-B4-01 的来源事实 + 必要确定性标准化方案；
- 审计报告：`07_重建工作区/PDM-07_历史最终版完整性复核_2026-10-05.md`；
- 当前进入：PDM-08 Legacy Final Integrity Audit；
- PDM-11 继续 BLOCKED。
## 2026-10-05｜PDM-06 Legacy Final Integrity Audit 完成

- PDM-06 Integrity：`INTEGRITY_PASS`；
- 本轮关闭 6 组问题：草稿发布前 source_type 合法修改、PDM-07 档案 handoff closure、PDM-08 图片 handoff closure、PDM-10 价格 handoff closure、PDM-21/22/25 future handoff、IA/Low-Fi stale carrier；
- PDM-07/08/10 已完成承接均已反向写回 PDM-06；
- Cross-PDM Handoff Register 已登记 PDM-21/22/25 future handoff；
- 审计报告：`07_重建工作区/PDM-06_历史最终版完整性复核_2026-10-05.md`；
- 当前进入：PDM-07 Legacy Final Integrity Audit；
- PDM-11 继续 BLOCKED。
## 2026-10-05｜PDM-05 Legacy Final Integrity Audit 完成

- PDM-05 Integrity：`INTEGRITY_PASS`；
- 本轮关闭 7 组问题：PDM-06 stale handoff、mapping conflict 业务连续性、pending/conflict 明确提示、后台 Admin/System Admin 身份歧义、车型固定属性纠错 current/history 边界、future handoff register、IA/Low-Fi stale carrier；
- 用户最终裁决 4A：车型主数据/JYT mapping/MODEL_MISSING/conflict/merge 归 System Admin 控制平面治理，`vehicle.model.manage` 为治理 Guard；
- 用户最终裁决 5A：车型唯一确定的固定属性当前值跟随有效车型主档纠错，历史业务快照与 JYT source facts 不追改；
- PDM-02 / PDM-06 已完成跨域反向同步；
- Cross-PDM Handoff Register 已登记 PDM-12/20/21/22/25 future handoff；
- 审计报告：`07_重建工作区/PDM-05_历史最终版完整性复核_2026-10-05.md`；
- 当前进入：PDM-06 Legacy Final Integrity Audit；
- PDM-11 继续 BLOCKED。
## 2026-10-05｜PDM-04 Legacy Final Integrity Audit 完成

- PDM-04 Integrity：`INTEGRITY_PASS`；
- 本轮关闭 11 组问题：listing_cycle started_at、车辆时间概念分离、4S source_type 与成员权限、locked/trading 真实事实更新、PDM-08 图片 handoff、PDM-10 价格 handoff、PDM-05～10 stale handoff、car_code/电话隔离、JYT 三个固定业务 API、IA/Low-Fi stale carrier、Supply Anomaly 新业务 Guard；
- 用户最终裁决 Supply Anomaly=B：anomaly 只作为风险告警，不统一阻断新增业务；真实 offline / unavailable 才按不可售事实硬阻断；
- Cross-PDM Handoff Register 已同步：PDM-05～10 CLOSED；PDM-20 / PDM-22 / PDM-23 新 handoff 正式 OPEN；
- 审计报告：`07_重建工作区/PDM-04_历史最终版完整性复核_2026-10-05.md`；
- 当前进入：PDM-05 Legacy Final Integrity Audit；
- PDM-11 继续 BLOCKED。
## 2026-10-05｜Cross-PDM Handoff 双向闭环启用

- 已新增统一总账：`07_重建工作区/CROSS_PDM_HANDOFF_REGISTER.md`；
- 已把 PDM-01～PDM-10 已出现的 integrity 问题、已完成 handoff、仍开放 handoff 与 post-PDM25 stale carrier 持续回填到统一总账；
- 以后来源 PDM 只写“交后续”不算闭环；目标 PDM 完成后必须反向回写来源 Final / Integrity 报告 / Register / 状态文件；
- PDM-04 §20 已把 PDM-05～10 的旧“留后续”改为 `HANDOFF_CLOSED`；
- PDM-04 已通过 Integrity Audit；Supply Anomaly 采用用户裁决 B：anomaly 本身只告警、不统一阻断新增业务，真实 offline / unavailable 才硬阻断；
- IA / Low-Fi 仍不施工，只登记 stale carrier，继续遵守 PDM-25 后集中对齐规则。
## 2026-10-05｜PDM-03 Legacy Final Integrity Audit 完成

- PDM-03 Integrity：`INTEGRITY_PASS`；
- 本轮关闭 9 组问题：客户主动要求更换销售触发条件、普通 owner 移交 reason 非必填、inactive→active 复职边界、离职交接对象范围、Handover Batch 逐对象映射与部分失败、PDM-10 分享/查价 handoff closure、公司客户历史访问边界、Customer 停用对 owner 的影响、IA/Low-Fi stale carrier ledger；
- 用户确认：9 组问题全部同意；IA / Low-Fi 当前只登记 `STALE_CARRIER`，不修改承载文件；
- 审计报告：`07_重建工作区/PDM-03_历史最终版完整性复核_2026-10-05.md`；
- 当前进入：PDM-04 Legacy Final Integrity Audit；
- PDM-11 继续 BLOCKED。
## 2026-10-04｜PDM-02 Legacy Final Integrity Audit 完成

- PDM-02 Integrity：`INTEGRITY_PASS`；
- 本轮关闭 8 组问题：权限变化即时生效、inactive 恢复 accepting 默认 OFF、调店前交接、治理审计最小字段、接客/离职交接与 handover batch、System Admin 自身治理、System Admin 直接停用/恢复 Customer、已完成跨域 handoff 清理；
- 用户新增裁决：System Admin 可直接执行 Customer 账号停用 / 恢复，定义为控制平面治理动作；不因此获得销售 / CRM / owner / Lock / Transaction 等业务执行权；
- PDM-01 已同步 `PDM01-DEC-A16-R2`，保持 `INTEGRITY_PASS`；
- 审计报告：`07_重建工作区/PDM-02_历史最终版完整性复核_2026-10-04.md`；
- 当前进入：PDM-03 Legacy Final Integrity Audit；
- PDM-11 继续 BLOCKED。

## 2026-10-04｜IA / Low-Fi 集中对齐时点冻结

用户明确决定：不在 PDM-01～10 完成后单独对齐 IA / Low-Fi。

固定流程：

> PDM-01～10 Integrity Audit → 01～10 全局总复核 → PDM-11～25 → PDM-01～25 全局最终总复核 → IA 集中对齐 → Low-Fi 集中对齐 → Engineering。

PDM-01～25 期间发现的 IA / Low-Fi 错误统一登记 `STALE_CARRIER` 与正确 Authority，不直接修改 carrier。
## 2026-10-04｜PDM-01 Legacy Final Integrity Audit 完成

- PDM-01 Integrity：`INTEGRITY_PASS`；
- 本轮共关闭 6 组 reopen：显式登录页语义、手机号授权拒绝时找车表单临时保留、PDM-02 手机号维护 handoff、接客池异常为空、PDM-03 owner/分享 handoff、客户账号停用/恢复轻量后台控制；
- 客户账号停用最终口径：后台受控停用/恢复；停用后仍可进入网站/小程序并浏览公开内容，但暂停依赖 Customer 身份/权益的业务账号能力；不删除 customer_id / owner / 来源 / 历史；若只需降权使用客户等级调整；
- IA / Low-Fi 中旧“首次无 owner / SOURCE_ONLY / Customer Merge”等只登记为 stale carrier，本轮不修改；
- 审计报告：`07_重建工作区/PDM-01_历史最终版完整性复核_2026-10-04.md`；
- 当前进入：PDM-02 Legacy Final Integrity Audit；
- PDM-11 继续 BLOCKED。

## 已完成

- 六类证据完整导入并校验；
- 产品全域覆盖地图完整性校验 PASS；
- 25 个一级产品域冻结为重建覆盖骨架；
- IA V5 25 个 Canonical Object 均有 PDM 落点；
- 001～078 的 224/224 单元均可挂载；
- PDM-01：`COMPLETE`；
- PDM-02：`COMPLETE`；
- PDM-03：`COMPLETE`；
- PDM-04：`COMPLETE`，正式规则文件为 `07_重建工作区/PDM-04_最终完整规则.md`；
- PDM-05：`COMPLETE`，正式规则文件为 `07_重建工作区/PDM-05_最终完整规则.md`；
- PDM-06：`COMPLETE`，正式规则文件为 `07_重建工作区/PDM-06_最终完整规则.md`；
- PDM-07：`COMPLETE`，正式规则文件为 `07_重建工作区/PDM-07_最终完整规则.md`；
- PDM-08：`COMPLETE`，正式规则文件为 `07_重建工作区/PDM-08_最终完整规则.md`；
- PDM-09：`COMPLETE`，正式规则文件为 `07_重建工作区/PDM-09_最终完整规则.md`；
- PDM-10：`COMPLETE`，正式规则文件为 `07_重建工作区/PDM-10_最终完整规则.md`；
- 已新增并启用《用户全量审查四批门禁规范》。

## 2026-10-04｜PDM-01～PDM-10 Legacy Final Integrity Audit 前置阶段

用户明确要求：PDM-10 完成后先不要进入 PDM-11，先用 2026-10-04 新的信息保真 / 一次性收口标准重新复核 PDM-01～PDM-10。

本轮不是只做“细检”，必须同时：

- 重新查整条业务规则遗漏；
- 检查现有 Final 是否压掉条件、例外、权限、生命周期、历史等细节；
- 检查 PDM-01～10 之间的冲突、静默覆盖、handoff 丢失与 stale rule。

已新增方法门禁：

> `00_先读/01_产品基线重建执行规范_冻结工作版.md` §3.3 Legacy Final Integrity Audit Gate

总控工作单：

> `07_重建工作区/PDM-01至10_全域完整性复核_总控工作单.md`

执行顺序：PDM-01 → ... → PDM-10 → 01～10 全局 Cross-PDM / Handoff / Global Invariant 总复核 → PASS 后才允许 PDM-11。

原 PDM-01～10 `COMPLETE` 保留为历史裁决完成状态；在本轮 Integrity Audit PASS 前，不声称旧 Final 已满足当前新完整性标准。

---
## 2026-10-04｜PDM-10 最终完成

用户最终批准 PDM-10《价格 / 查价 / 客户展示价覆盖》完整规则，并明确“确定执行”写入仓库。

- PDM-10 状态：`COMPLETE`；
- 正式规则：`07_重建工作区/PDM-10_最终完整规则.md`；
- 完整性检查卡：`07_重建工作区/PDM-10_信息保真与一次性收口检查卡_2026-10-04.md`；
- Coverage 报告：`07_重建工作区/PDM-10_全量DecisionCoverage未映射检查报告_2026-10-04.md`；
- M11-001～M11-017：17/17 有明确去向；
- SOURCE_DECISION_COVERAGE = 100%；
- UNMAPPED = 0；
- FINAL_TO_SOURCE_TRACEABILITY = 100%；
- CROSS_PDM_CONFLICT = 0；
- SEMANTIC_INTEGRITY = PASS；
- USER_FINAL_APPROVED = YES；
- IMPLEMENTATION_READY = PASS；
- PDM-02 / PDM-06 的旧独立调价语义已显式 supersede 并同步加注；
- PDM-20/21/22/25 等后续 carrier handoff 已登记完整 Guard，不修改 IA / Low-Fi / Engineering。

当前允许进入 PDM-11 准备，但不得跳过新方法的依赖卡和证据刷新。

---
## 2026-10-04｜信息保真 / 一次性收口方法升级

用户明确要求停止“越写越丢、后续 PDM 再反复重建”的循环。本轮已把防丢失要求升级为全局硬门禁：

- Memory Zero-Trust：模型记忆 / 聊天上下文只能作为检索线索，不能代替当前 GitHub 证据；
- Current Authority Refresh：重要判断前重新读取当前状态、Decision、相关已完成 PDM Final；
- PDM Scope ≠ Evidence Scope：业务域不限制证据读取范围；
- Completed-PDM Dependency Card：任何新 PDM 在 Batch 1 前必须建立跨 PDM 依赖卡；
- Global Invariant Gate：identity / permission / data scope / owner / vehicle_id / listing_cycle / hard DENY / audit 等跨域不变量必须显式检查；
- Terminology / Field Normalization：中文词、技术字段、历史别名统一后再检索；
- No Summary-on-Summary：禁止摘要继续摘要成为唯一证据；
- Bidirectional Traceability：Source→Final 与 Final→Source 双向追溯；
- Negative Claim Proof：所有“没有 / 已废弃 / 不存在 / 不需要”必须多路证明；
- Conflict Before Classification：完整证据扫完后才能分 Batch；
- Deferred Handoff Closure：跨域移交必须有目标、有完整语义、有接收状态；
- Change Impact Analysis：reopen / supersession / 新裁决必须立即检查受影响 PDM、Decision、IA/Low-Fi/Engineering；
- Semantic Completeness Matrix：权限、scope、hard DENY、生命周期、异常、并发、历史等适用维度不得静默省略；
- Final Semantic Integrity + Implementation-Ready Gate：`UNMAPPED=0` 不再足以标记 COMPLETE，最终文件必须可直接承接后续施工。

强制执行模板：

> `07_重建工作区/PDM_信息保真与一次性收口检查模板.md`

该模板是执行留痕，不是新的业务 Authority。

---

## 新增硬门禁

从现在开始：

> **任何规则原子都必须经过用户本人审查，不能因模型判断为稳定一致、明确废弃、已知情修改等而自动进入最终产品基线。**

每个 PDM 固定：

1. Batch 1｜稳定一致项；
2. Batch 2｜明确废弃 / 明确替代；
3. Batch 3｜明确知情修改 / 后续明确新增；
4. Batch 4｜冲突 / 历史遗漏 / 证据缺口 / 新选择；
5. 四批结束后再做一次 PDM 完整最终总览。

每批都必须停下来等用户确认。

## 当前 PDM-05

已按当前 GitHub 原始证据完成 PDM-05 Batch 1 稳定一致项筛选，共形成：

> **P05-A01～P05-A09**

工作版：

> `07_重建工作区/PDM-05_车型主数据年款JYT车型映射MODEL_MISSING_规则原子重建_工作版.md`

Batch 1 当前状态：

> `USER_REVIEW_PENDING`

本批只纳入前史、R3、9/19 与后续承载之间未发现真实业务反转的稳定一致项。JYT 未映射时精确事实使用边界、VR-P-010 与本地映射关系、MODEL_MISSING 原地新建车型 Action 冲突、重复车型合并等遗漏、明确废弃机制等均已留到后续批次，不在 Batch 1 偷偷收口。

## 2026-09-24｜PDM-05 车型 ID 映射口径修正

用户明确确认：

- 车型身份以 JYT `model_id` 为上游身份键；
- 通过 source mapping 映射到本地 `vehicle_model_id`；
- 两边 ID 数值不要求相同；
- 车型名称仅用于展示 / 快照 / 搜索 / Admin 辅助判断，不作为身份主键；
- 品牌 / 车系是否与 JYT 共用相同 ID 值，当前不作假定；
- P05-A03 / A05 / A06 涉及的映射确认、修正、冲突处理统一由后台 Admin 处理。

当前 Batch 1 已确认：P05-A03、P05-A05、P05-A06。
仍待审：P05-A01、P05-A02、P05-A04、P05-A07、P05-A08、P05-A09。

## 2026-09-24｜PDM-05 Batch 1 完成并进入 Batch 2

P05-A01～P05-A09 已全部用户确认。

其中：

- P05-A03 已修正为 JYT `model_id` → 本地 `vehicle_model_id` 的 ID-based source mapping；
- P05-A07 当前实际管理主体收口为后台 Admin，普通销售不得处理车型主数据/映射/冲突；
- Batch 1 状态：`COMPLETE_USER_CONFIRMED`。

当前进入：

> `PDM-05 / BATCH_2_DEPRECATED_SUPERSEDED_DO_NOT_RESTORE / USER_REVIEW_PENDING`

Batch 2 待审：P05-B2-01～P05-B2-05。

## 2026-09-24｜PDM-05 Batch 2 完成并进入 Batch 3

P05-B2-01～P05-B2-05 已全部用户确认，Batch 2 状态：

> `COMPLETE_USER_CONFIRMED`

当前进入：

> `PDM-05 / BATCH_3_INFORMED_CHANGES_AND_EXPLICIT_ADDITIONS / USER_REVIEW_PENDING`

当前唯一待审：P05-A10。

## 2026-09-24｜PDM-05 Batch 3 完成并进入 Batch 4

用户确认：

- P05-A10：本地车型映射未完成，不阻塞 JYT 已明确车型事实用于正常业务；
- P05-A11：只要 JYT 已明确品牌、车系、年款、具体车型/款式等足够事实，即使 `vehicle_model_id` 尚未映射，也可参加精确搜索、筛选和自动 Matching。

因此“本地车型归属”和“车辆自身车型事实”正式分层。

当前进入：

> `PDM-05 / BATCH_4_CONFLICTS_OMISSIONS_GAPS_NEW_CHOICES / USER_REVIEW_PENDING`

Batch 4 待审：P05-B4-01、P05-B4-02。

## 2026-09-24｜PDM-05 Batch 4 完成并生成最终总览

用户完成 Batch 4 裁决：

- P05-B4-01：后台 Admin 可直接新增缺失品牌 / 车系 / 具体车型并完成绑定；若来源于 JYT 采集车型，应在本次处理或紧接后的同一后台流程中尽快同步建立 `JYT model_id → local vehicle_model_id` source mapping，避免长期悬空；
- P05-B4-02：后台 Admin 可修正车型层级、合并重复车型、迁移车辆引用与 JYT mapping；真实旧车型长期保留。

至此 PDM-05 四批用户审查全部完成。

已生成：

> `07_重建工作区/PDM-05_最终完整规则总览_待用户批准.md`

当前状态：

> `FINAL_REVIEW_PENDING`

未经用户最终批准，不得将 PDM-05 标记 COMPLETE，不得进入 PDM-06。

## 2026-09-24｜PDM-05 最终完成

用户最终明确批准 PDM-05《最终完整规则总览》。

- PDM-05 状态：`COMPLETE`；
- 正式规则文件：`07_重建工作区/PDM-05_最终完整规则.md`；
- Decision Register 已登记 `PDM05-GATE-FINAL`；
- 后续 PDM 不得静默改写 PDM-05，发现真实跨域冲突必须显式提交用户裁决。

当前进入：

> **PDM-06｜人工车辆发布 / 草稿 / VIN / 删除边界**

## 2026-09-24｜PDM-06 Batch 1 已形成

已严格按 GitHub 当前原始证据完成 PDM-06 稳定一致项筛选，共形成：

> **P06-A01～P06-A11**

工作版：

> `07_重建工作区/PDM-06_人工车辆发布草稿VIN删除边界_规则原子重建_工作版.md`

本批只纳入没有发现真实业务反转的规则，包括人工来源边界、草稿/正式车分层、最低发布字段、0 图发布、价格可空、VIN 非必填、正式发布校验、删除边界与授权编辑。

多草稿 vs DRAFT_RESUME、VIN 精确重复 Gate、已发布车辆“保存修改”正式生效、source_type 新建交互等已留后续批次，不在 Batch 1 偷偷收口。

## 2026-09-24｜PDM-06 Batch 1 完成并进入 Batch 2

用户确认 P06-A01～P06-A11 全部通过；P06-A12 多草稿管理已提前确认。

Batch 1 状态：

> `COMPLETE_USER_CONFIRMED`

当前进入：

> `PDM-06 / BATCH_2_DEPRECATED_SUPERSEDED_DO_NOT_RESTORE / USER_REVIEW_PENDING`

Batch 2 待审：P06-B2-01～P06-B2-08。

## 2026-09-24｜PDM-06 Batch 2、3 完成并进入 Batch 4

用户确认 P06-B2-01～P06-B2-08 全部通过。

Batch 3 经 GitHub 证据复核没有新的未审原子：
- P06-A12 多草稿规则已由用户本轮明确确认；
- source_type 发布后可修改规则已在 PDM-04 正式批准并由 PDM-06 继承。

当前进入：

> `PDM-06 / BATCH_4_CONFLICTS_OMISSIONS_GAPS_NEW_CHOICES / USER_REVIEW_PENDING`

待审：P06-B4-01～P06-B4-05。

## 2026-09-24｜PDM-06 Batch 4 完成并生成最终总览

用户确认 P06-B4-01～P06-B4-05 全部通过。

至此 PDM-06 Batch 1～4 全部完成。

已生成：

> `07_重建工作区/PDM-06_最终完整规则总览_待用户批准.md`

当前状态：

> `FINAL_REVIEW_PENDING`

未经用户最终批准，不得将 PDM-06 标记 COMPLETE，不得进入 PDM-07。

## 2026-09-24｜PDM-06 最终完成

用户最终明确批准 PDM-06《最终完整规则总览》。

- PDM-06 状态：`COMPLETE`；
- 正式规则文件：`07_重建工作区/PDM-06_最终完整规则.md`；
- Decision Register 已登记 `PDM06-GATE-FINAL`；
- 当前进入 PDM-07。

## 2026-09-24｜PDM-07 Batch 1 已形成

已基于 R9 / R10 / R11 / R12、CN11、IA V5 与 001～078 M10 形成稳定一致项：

> **P07-A01～P07-A11**

工作版：

> `07_重建工作区/PDM-07_车辆档案车况客户可见报告成交交付材料核验_规则原子重建_工作版.md`

结构化车况孤儿规则、档案维护 Action、客户可见性设置动作、交付材料配置机制等留后续批次。

## 2026-09-24｜PDM-07 Batch 1 完成并进入 Batch 2

用户确认 P07-A01～P07-A11 全部通过。

Batch 1 状态：

> `COMPLETE_USER_CONFIRMED`

当前进入：

> `PDM-07 / BATCH_2_DEPRECATED_SUPERSEDED_DO_NOT_RESTORE / USER_REVIEW_PENDING`

待审：P07-B2-01～P07-B2-04。

## 2026-09-24｜PDM-07 Batch 2、3 完成并进入 Batch 4

用户确认 P07-B2-01～P07-B2-04 全部通过。

Batch 3 经当前 GitHub 证据复核无新的未审原子，已关闭。

当前进入：

> `PDM-07 / BATCH_4_CONFLICTS_OMISSIONS_GAPS_NEW_CHOICES / USER_REVIEW_PENDING`

待审：P07-B4-01～P07-B4-05。

## 2026-09-24｜PDM-07 Batch 4 完成并生成最终总览

用户确认 P07-B4-01～P07-B4-05 全部通过。

其中 P07-B4-01 已按 JYT 原始车况描述 + JYT `sub.tags` 的真实链路收窄：
- 不重复人工录入批发车车况；
- 标签保留来源 provenance；
- 标签/描述既可展示，也可作为确定性 Matching 输入；
- 只做必要标准化，unknown 不猜。

至此 PDM-07 Batch 1～4 全部完成。

已生成：

> `07_重建工作区/PDM-07_最终完整规则总览_待用户批准.md`

当前状态：

> `FINAL_REVIEW_PENDING`

未经用户最终批准，不得将 PDM-07 标记 COMPLETE，不得进入 PDM-08。

## 2026-09-25｜PDM-07 最终完成并进入 PDM-08

用户最终批准 PDM-07《最终完整规则总览》。

- PDM-07 状态：`COMPLETE`；
- 正式规则：`07_重建工作区/PDM-07_最终完整规则.md`；
- Decision Register 已登记 `PDM07-GATE-FINAL`；
- PDM-08 Batch 1 已形成：P08-A01～P08-A12。

## 2026-09-25｜PDM-01～07 反向覆盖校验

已完成正式反向覆盖校验。

报告：

> `07_重建工作区/PDM-01至07_反向覆盖校验报告_2026-09-25.md`

结果：
- PDM-01：PASS
- PDM-02：PASS
- PDM-03：PASS
- PDM-04：FAIL
- PDM-05：PASS_WITH_HANDOFF_GAP
- PDM-06：FAIL
- PDM-07：PASS

当前发现 5 个补漏项，尚未达到 `UNMAPPED=0`。

PDM-08 临时暂停，先完成反向覆盖补漏 Gate。

## 当前唯一下一步

> **审查 PDM-01～PDM-07 反向覆盖校验发现的 5 个补漏项，然后停止等待用户确认。**

## 当前禁止事项

- 不自动批准 PDM-06 Batch 1；
- 未经用户确认不得进入 PDM-06 Batch 2；
- 不得跳过任何 PDM-06 用户审查批次；
- 不得在 PDM-06 最终总览批准前进入 PDM-07；
- 不得静默改写 PDM-01～PDM-05 已确认规则；
- 不使用旧聊天记忆替代仓库证据；
- 不修改 IA / Low-Fi；
- 不执行 Engineering Delta。

## 当前产品基线状态

`NOT_READY`

## 2026-09-24｜R3/R4/R5 原件补回

已新增恢复证据目录：

> `01_证据_A_9月19日产品业务锚点/补回原始证据_2026-09-24/`

当前已补回 R3、R4、R5 原始业务重审最终总结；R2 已校正为“当时没有独立分支最终原件”，不再误判为缺失。

PDM-01 的 R5 证据重基准已完成：

- Batch 1 / Batch 2 已确认项共 20 条；
- 唯一真实冲突组 `P01-A04 + P01-B2-01` 已由用户裁决继续 A04，并登记为主动新修改；
- 其余 18 条已确认项无真实冲突；
- A12 / A13 / A16 的原始证据强度或边界得到补全，但仍须按四批门禁接受用户审查；
- R3 对 PDM-01 无直接身份规则；R4 仅有价格/查价与客户身份的交叉边界，不改写 PDM-01 身份规则。


## 2026-09-24｜CN11 精选业务原始证据补回

已新增：

> `01_证据_A_9月19日产品业务锚点/前置历史原始证据_2026-09-17_CN11/`

本次仅提取 21 份产品/业务高价值 Markdown 原件，未导入 DB/SQL、OpenAPI、代码、Starter、测试、SVG、CSV 等工程文件。

使用边界：

- CN11 是 9/19 之前的历史原始证据，不是当前最终 Authority；
- 001～078 继续作为历史问题雷达；
- 以后涉及 CN11 的规则原子，应优先回 CN11 原件核验，再与 9/19、9/22/后续证据比较；
- 不因补回 CN11 自动推翻已经过用户审查的规则；发现真实冲突必须显式交用户裁决。

PDM-01 当前已完成 Batch 1～4，状态为 `FINAL_REVIEW_PENDING`。
## 2026-09-24｜Customer Merge 主动取消

用户明确决定 V1 不建设 Customer Merge：不同微信身份对应的不同 `customer_id` 始终保持独立，即使现实中确认属于同一自然人也不做自动/人工 Merge。一个手机号允许登记在多个 Customer；手机号搜索可返回多个命中，但不触发合并。该裁决主动覆盖此前 A09 / A10 / B2-02，并使 A11 / A12 关闭为 N/A。


## 2026-09-24｜PDM-01 Batch 4 完成

用户已确认 A13 与 A16。A13 明确“手机号是可变联系方式，换手机号不是换 Customer”，与 A14 多手机号管理规则统一；A16 采用客户停用/恢复 V1 最小闭环。至此 Batch 4 全部完成，PDM-01 四批用户审查结束，进入 `FINAL_REVIEW_PENDING`。下一步仅生成最终完整规则总览，未经用户最终批准不得进入 PDM-02。


## 2026-09-24｜PDM-01 最终完成

用户已明确批准 PDM-01《最终完整规则总览》。

- PDM-01 状态：`COMPLETE`
- 正式规则文件：`07_重建工作区/PDM-01_最终完整规则.md`
- 最终候选文件保留作为审计轨迹；
- PDM-01 后续不得被其他 PDM 静默改写；若发现真实跨域冲突，必须重新显式提交用户裁决。

当前进入：

> **PDM-02｜员工身份 / 组织 / 角色 / 权限 / 数据范围 / System Admin / 4S 身份**


## 2026-09-24｜PDM-02 Batch 1 完成

用户明确确认 P02-A01～P02-A15 全部同意。Batch 1 状态：`COMPLETE_USER_CONFIRMED`。下一步准备 Batch 2，未经用户审查不得自动批准。


## 2026-09-24｜PDM-02 Batch 2 完成

用户明确确认 Batch 2 剩余 12 条全部同意。最终结果：B2-02 撤回并由 P02-A16 反转替代；B2-04 已确认；B2-01、B2-03、B2-05～B2-14 全部确认。Batch 2 状态：`COMPLETE_USER_CONFIRMED`。下一步准备 Batch 3，未经用户审查不得自动批准。


## 2026-09-24｜PDM-02 Batch 3 完成

用户确认 P02-A18：一个 4S 成员账号直接代表一家合作 4S 店/合作主体；不建设 4S 店组织层级，不使用 cooperation scope。4S 账号新增、启用、停用、基础资料及允许范围内业务 permission 配置由名邦后台具备相应管理权限的 active 内部管理人员统一处理；4S hard DENY 不得绕过。至此 A16/A17/A18 全部确认，Batch 3 状态：`COMPLETE_USER_CONFIRMED`。


## 2026-09-24｜System Admin 控制平面模型修正

用户明确修正此前过度限制：System Admin 与员工业务身份继续分离，但其角色应是系统治理/控制平面，而不是“不能管理业务权限”。新增 P02-A19：System Admin 可治理员工与4S账号、角色、permission、data scope、角色模板、接客配置等，但 System Admin 身份本身不获得员工业务执行权；同一真人要亲自做业务必须使用独立员工身份；hard DENY 不可绕过。该规则部分修正 A17/A18，并将 B4-02“店长由谁任命”关闭为由 System Admin 配置。


## 2026-09-24｜PDM-02 Batch 4 完成

用户明确“其他的都同意”，确认 B4-01、B4-03、B4-04、B4-05、B4-06；B4-02 已由 P02-A19 提前关闭。至此 Batch 4 六项全部完成，状态：`COMPLETE_USER_CONFIRMED`。

已生成最终候选：

> `07_重建工作区/PDM-02_最终完整规则总览_待用户批准.md`

当前进入 `FINAL_REVIEW_PENDING`，未经用户最终批准不得将 PDM-02 标记 COMPLETE，也不得进入 PDM-03。


## 2026-09-24｜PDM-02 最终完成

用户最终确认 PDM-02《最终完整规则总览》无其他问题，并特别确认：普通销售、经理、店长都可以接待客户；经理和店长满足 active + eligible + accepting 时可进入接客池并成为 Customer owner；4S 成员与 System Admin 不进入接客池。

- PDM-02 状态：`COMPLETE`
- 正式规则文件：`07_重建工作区/PDM-02_最终完整规则.md`
- 最终候选文件保留作为审计轨迹；
- 后续 PDM 不得静默改写 PDM-02，发现真实跨域冲突必须显式交用户裁决。

当前进入：

> **PDM-03｜Owner / 来源归因 / 分享注册 / 转介绍 / 接客 / 离职交接**


## 2026-09-24｜PDM-03 Batch 1 已形成

已严格按 GitHub 当前原始证据完成 PDM-03 稳定一致项筛选，共形成 P03-A01～P03-A13 十三条候选规则。自然注册立即分配 owner、普通客户车辆转发 SOURCE_ONLY、接客池异常为空 owner_assignment_pending 等后续主动修改明确留到后续批次，不伪装成历史稳定项。当前状态：`USER_REVIEW_BATCH_1_PENDING`。


## 2026-09-24｜PDM-03 Batch 1 完成

用户明确“没问题，进行下一步”，确认 P03-A01～P03-A13 十三条稳定一致项全部通过。Batch 1 状态：`COMPLETE_USER_CONFIRMED`。

随后完成 Batch 2 筛选，共形成 P03-B2-01～P03-B2-09 九条明确废弃 / 替代 / DO_NOT_RESTORE 候选项，当前等待用户审查。


## 2026-09-24｜PDM-03 Batch 2 完成

用户明确“全部确认”，确认 P03-B2-01～P03-B2-09 九条明确废弃 / 替代 / DO_NOT_RESTORE 全部通过。Batch 2 状态：`COMPLETE_USER_CONFIRMED`。

随后完成 Batch 3 筛选，共形成三条待审：P03-A14 自然注册立即形成 owner、P03-A15 普通客户车辆转发 SOURCE_ONLY 与直接转介绍分离、P03-A16 接客池异常为空 owner_assignment_pending。


## 2026-09-24｜PDM-03 A15 客户分享归属规则反转

用户明确修正此前“普通客户车辆转发仅 SOURCE_ONLY”的方案：客户车源分享本身可以作为转介绍/获客归属链。对尚无正式 owner 的新客户 B，A 分享车源链接给 B，B 通过该链接进入后，按分享链实际绑定的销售建立 current owner，同时保留 A→B 的来源/推荐关系。A 转发张三链接则 B 归张三；转发李四链接则 B 归李四；A 使用自己的客户分享链接时，也保留 A 为来源客户/间接推荐人，并按该分享链对应销售归属 B。已有正式 owner 的老客户仍不得被分享链接抢走。

该裁决显式覆盖 P01-A04 中“普通客户侧车辆转发仅 SOURCE_ONLY、不据此分配 owner”的子句；P01-A04 其余自然注册/直接转介绍规则继续有效。

尚未裁决：A 发出链接后、B 打开前若 A 的 current owner 发生变化，旧链接的销售绑定时点。该项留 PDM-03 Batch 4。


## 2026-09-24｜PDM-03 Batch 3 完成

用户明确“十四十六都同意”，确认 P03-A14 与 P03-A16；P03-A15 已在前一轮按“客户分享即转介绍/获客归属链”主动修正并确认。至此 Batch 3 三项全部完成，状态：`COMPLETE_USER_CONFIRMED`。

随后完成 Batch 4 缺口扫描，共形成 P03-B4-01～P03-B4-04 四条待审项，重点关闭客户分享链销售绑定时点、A→B 关系留存、失效销售兜底、分享归属与自然轮询的并发顺序。


## 2026-09-24｜PDM-03 Batch 4 完成

用户明确“这个问题同意”，确认 P03-B4-01～P03-B4-04 四条冲突 / 缺口 / 新选择全部通过。至此 PDM-03 四批门禁全部完成。

已生成最终候选：

> `07_重建工作区/PDM-03_最终完整规则总览_待用户批准.md`

当前进入 `FINAL_REVIEW_PENDING`，未经用户最终批准不得将 PDM-03 标记 COMPLETE，也不得进入 PDM-04。


## 2026-09-24｜PDM-03 最终完成

用户最终明确批准 PDM-03《最终完整规则总览》。

- PDM-03 状态：`COMPLETE`
- 正式规则文件：`07_重建工作区/PDM-03_最终完整规则.md`
- 最终候选文件保留作为审计轨迹；
- 后续 PDM 不得静默改写 PDM-03，发现真实跨域冲突必须显式提交用户裁决。

当前进入：

> **PDM-04｜三类车源 / JYT 同步 / 车辆身份 / Listing Cycle / 隐藏 / 下架 / 重上架 / 一键转名邦**


## 2026-09-24｜PDM-04 Batch 1 已形成

已严格按 GitHub 当前原始证据完成 PDM-04 稳定一致项筛选，共形成 P04-A01～P04-A14 十四条候选规则。

明确未混入本批的后续变化/冲突包括：人工名邦/4S source_type 双向修改、采集批发车自动隐藏、一键转名邦后的新名邦展示状态、一键转名邦具体 permission，以及图片/价格等跨域细节。

当前状态：`USER_REVIEW_BATCH_1_PENDING`。


## 2026-09-24｜PDM-04 Batch 1 完成

用户明确“全部都同意”，确认 P04-A01～P04-A14 十四条稳定一致项全部通过。Batch 1 状态：`COMPLETE_USER_CONFIRMED`。

随后完成 Batch 2 筛选，共形成 P04-B2-01～P04-B2-13 十三条明确废弃 / 替代 / DO_NOT_RESTORE 候选项，当前等待用户审查。


## 2026-09-24｜PDM-04 Batch 2 完成与转名邦模型反转

用户确认 Batch 2 其余项均无争议，并主动反转 B2-05：一键转名邦不再创建第二个 vehicle，而是在同一 vehicle_id 上完成批发→名邦来源转换；永久保留 JYT car_code / 来源历史，并阻止后续 JYT 同 car_code 重新生成批发在售。B2-06/B2-07 已按该模型同步修正。用户同时确认 locked 批发车可直接转名邦，Lock 保持绑定同一 vehicle_id。


## 2026-09-24｜PDM-04 Batch 3 已形成

P04-A15/A16 已由用户提前确认；新增四条待审：A17 source_type 名邦↔4S 后续修改、A18 采集批发自动隐藏、A19 转名邦后不走草稿二次发布、A20 一键转名邦不设额外独立 permission。listing_cycle、pre-conversion hidden、trading/completed 与 car_code 被上游复用冲突留 Batch 4。


## 2026-09-24｜PDM-04 Batch 3 完成

用户明确确认 A17～A20，其中 A18 按“每条自动隐藏规则独立；规则之间 OR；单条规则内不同字段 AND、同字段多个值 OR”的补充口径落版。加上此前已确认的 A15/A16，Batch 3 六项全部完成。

随后形成 Batch 4 五条待审：listing_cycle、hidden 原因继承、trading/completed 转换、car_code 复用冲突、conversion 单向性。


## 2026-09-24｜PDM-04 A18 适用车源范围扩展与 B4-02 完成

用户补充确认：自动/批量隐藏规则增加显式 `source_scope`，可多选批发、名邦、4S，至少选择一类；未选择不得生效，不默认影响三类全部车源。原“采集批发自动隐藏”继续作为 `source_scope=批发` 的一种配置。

车辆来源变化后，自动隐藏规则按新的 `source_type` 与各规则 `source_scope` 重新计算。由此 P04-B4-02 已正式关闭：仅适用于批发的自动隐藏原因在批发→名邦后失效；scope 含名邦且条件仍命中的规则继续 hidden；人工 hidden 与其他有效 hidden 原因继续保留。

当前 Batch 4 剩余待审：P04-B4-01、P04-B4-03、P04-B4-04、P04-B4-05。


## 2026-09-24｜PDM-04 Batch 4 完成与最终总览生成

用户最终完成 Batch 4 裁决：

- P04-B4-01：同 vehicle 批发→名邦继续当前 listing_cycle，不新建 cycle；
- P04-B4-02：此前已确认，按 source_type + source_scope 重算自动 hidden，人工 hidden 保留；
- P04-B4-03：locked / trading 允许同 vehicle 转名邦，completed 禁止；
- P04-B4-04：若已转名邦历史 car_code 后续出现明显不同实体身份，系统自动屏蔽/抑制该冲突上游记录，不进入人工决断，不创建新的可售批发 vehicle；
- P04-B4-05：批发→名邦为单向经营转换，不提供转回批发。

至此 PDM-04 四批用户审查全部完成。

已生成：

> `07_重建工作区/PDM-04_最终完整规则总览_待用户批准.md`

当前状态：`FINAL_REVIEW_PENDING`。未经用户最终批准，不得将 PDM-04 标记 COMPLETE，不得进入 PDM-05。


## 2026-09-24｜PDM-04 最终完成

用户最终明确批准 PDM-04《最终完整规则总览》。

- PDM-04 状态：`COMPLETE`；
- 正式规则文件：`07_重建工作区/PDM-04_最终完整规则.md`；
- Decision Register 已登记 `PDM04-GATE-FINAL`；
- 后续 PDM 不得静默改写 PDM-04，发现真实跨域冲突必须显式提交用户裁决。

当前进入：

> **PDM-05｜车型主数据 / 年款 / JYT 车型映射 / MODEL_MISSING**


## 2026-09-24｜PDM-05 Batch 1 已形成

已严格按 GitHub 当前证据完成 PDM-05 稳定一致项筛选，形成 P05-A01～P05-A09 九条候选规则。存在知情修改、废弃项、IA Action Contract 冲突及历史细节遗漏的内容均未混入本批。

当前状态：`USER_REVIEW_BATCH_1_PENDING`。未经用户审查不得自动批准或进入 Batch 2。


## 2026-10-04｜PDM-08 最终完成

用户最终明确批准 PDM-08《最终完整规则总览》。

- PDM-08 状态：`COMPLETE`；
- 正式规则文件：`07_重建工作区/PDM-08_最终完整规则.md`；
- IMG-001～IMG-030：30/30 已有明确去向；
- `SOURCE_DECISION_COVERAGE = 100%`；
- `UNMAPPED = 0`；
- Decision Register 已登记 `PDM08-GATE-FINAL`；
- 后续 PDM 不得静默改写 PDM-08，发现真实跨域冲突必须显式提交用户裁决。

当前进入：

> **PDM-09｜上游发布人电话 / publisher_id / 电话获取与缓存边界**


## 2026-10-04｜PDM-09 Batch 1 完成并进入 Batch 2

已严格按 GitHub 当前证据重新完成 PDM-09 Batch 1 审查，用户明确“全部同意”：

> **P09-A01～P09-A11，共 11 条。**

工作版：

> `07_重建工作区/PDM-09_上游发布人电话Collector缓存获取最新敏感能力_规则原子重建_工作版.md`

Batch 1 状态：

> `COMPLETE_USER_CONFIRMED`

本批正式确认的核心边界包括：

- 电话按 `source_platform + upstream_publisher_id` 归属与缓存；
- 客户端 / 客户安全视图禁止展示上游电话；
- 电话为独立敏感能力；
- 唯一上游链为 Mingbang Backend → Collector → JYT；
- 有缓存时普通查看 / 拨打 cache-first，不重复请求上游；
- “获取最新电话”强制刷新，失败不覆盖旧缓存；
- phone history 只做历史 / 审计；
- 同 publisher latest single-flight，不同 publisher 可并发；
- 拨打只调系统拨号器，不新增独立 call permission；
- 电话敏感行为必须审计；
- 名邦 P03 只管理 Collector 连接，不管理 JYT 电话凭证 / Header / callCode。

当前进入：

> `PDM-09 / BATCH_2_DEPRECATED_SUPERSEDED_DO_NOT_RESTORE / USER_REVIEW_PENDING`

未经用户确认不得自动进入 Batch 3。


## 2026-10-04｜PDM-09 Batch 2 已形成

经 CR-007、电话旧契约清理报告、R11/R12、Decision Register 与 001～078 复核，当前明确废弃 / 替代项共 3 组：

> **P09-B2-01～P09-B2-03**

分别为：

1. 禁止恢复 `car_code` / Vehicle 维度电话查询与缓存身份；
2. 禁止恢复名邦直连 JYT / 名邦管理 JYT 电话凭证与旧凭证 API；
3. 禁止新增独立 `can_call_wholesale_phone` 拨打权限。

当前状态：

> `PDM-09 / BATCH_2_DEPRECATED_SUPERSEDED_DO_NOT_RESTORE / USER_REVIEW_PENDING`

真实冲突与证据缺口不混入本批。


## 2026-10-04｜PDM-09 Batch 2 完成

用户确认 P09-B2-01～P09-B2-03 全部通过。

其中 P09-B2-03 最终表述明确为：

> 有上游电话权限的员工，在自己有权访问的批发车源中，可以直接查看、获取最新电话并发起拨号；不再额外设置一个单独的“拨打电话权限”。

Batch 2 状态：

> `COMPLETE_USER_CONFIRMED`

当前进入：

> `PDM-09 / BATCH_3_INFORMED_CHANGES_AND_EXPLICIT_ADDITIONS / EVIDENCE_REVIEW`


## 2026-10-04｜PDM-09 Batch 3 证据筛选完成

经 9/20 IA ChangeLog、9/22 冻结台账、IA V5、实际 Low-Fi 与 001～078 复核：

> **Batch 3 无新的未审业务规则原子。**

电话状态页、latest 失败态、统一投影及 P03 页面均属于既有电话规则的 IA / Low-Fi 承载补全，不构成后续知情修改或新业务规则。

当前状态：

> `PDM-09 / BATCH_3_INFORMED_CHANGES_AND_EXPLICIT_ADDITIONS / USER_REVIEW_PENDING_NO_NEW_ATOMS`

用户确认前不得进入 Batch 4。


## 2026-10-04｜PDM-09 Batch 3 完成并进入 Batch 4

用户明确确认 Batch 3“无新增原子”结论。

Batch 3 状态：

> `COMPLETE_USER_CONFIRMED`

当前进入：

> `PDM-09 / BATCH_4_CONFLICTS_OMISSIONS_GAPS_NEW_CHOICES / EVIDENCE_REVIEW`


## 2026-10-04｜PDM-09 Batch 4 已形成

经主底盘、CN11 前史、9/22、IA V5、实际 Low-Fi 与 001～078 反查，形成 6 条真正需要用户审查的冲突 / 遗漏 / 缺口：

> **P09-B4-01～P09-B4-06**

覆盖：

1. cache miss 拨打是否自动按需取号；
2. `expires_at` 是否阻断普通缓存；
3. 同步阶段是否禁止批量预取电话；
4. Collector 新配置测试失败后的激活 / 回滚；
5. P03-05 publisher 电话缓存页真实内容；
6. 上游电话是否提供复制动作。

当前状态：

> `PDM-09 / BATCH_4_CONFLICTS_OMISSIONS_GAPS_NEW_CHOICES / USER_REVIEW_PENDING`


## 2026-10-04｜产品基线重建方法补强

用户批准新增全局硬规则：

> **先识别当前已实现 / 已测试事实，再执行原有 9/19 主底盘 + 前后历史反查 + 知情修改测试 + 四批用户裁决。**

新增要求：

- 已实现 / 已测试事实用于确定“当前系统实际上怎么跑”，但不自动成为产品权威；
- 当前实现与正式业务规则冲突时进入 `CURRENT_IMPLEMENTATION_CONFLICT`，不得模型自行覆盖；
- 涉及 API / Collector / 同步 / 鉴权时，必须先确认“谁提供 API、谁调用 API、数据流方向、当前版本、测试验收状态”；
- 历史“建议 / 推荐 / 候选 / 未施工”不得覆盖已验证当前实现；
- 当前 PDM-09 已发现电话 API 链存在旧方案污染迹象，继续 Batch 4 前必须对相关已确认项做显式复核，不静默改写。

当前 PDM-09 仍为 IN_PROGRESS。


## 2026-10-04｜PDM-09 当前实现事实卡完成

按新方法完成电话 API 架构复核。

当前事实：

- 名邦 Backend 提供 / 生成名邦 Integration API；
- Collector / 采集端配置并调用名邦 API，承担 JYT 采集与上游电话获取；
- 车辆数据和电话结果最终通过名邦既有回传体系进入名邦；
- 旧独立 Mingbang→Collector Phone API / Collector Base URL / Phone Path 方案属于历史中间方案或实现残留，不再自动视为当前产品规则。

因此回开：

- P09-A04 → P09-A04-R1
- P09-A11 → P09-A11-R1
- P09-B4-04 → 建议撤回

当前等待用户复审以上三项，Batch 4 其余候选暂不推进。


## 2026-10-04｜PDM-09 API 架构回开复核完成

用户明确“同意”，确认：

- P09-A04-R1：Collector / 采集端负责 JYT 取号，电话结果通过名邦 Backend 已有 Integration API / 回传体系返回名邦；
- P09-A11-R1：名邦 P03 撤销 Collector Base URL / Phone Path 产品配置，保留集成状态、缓存/历史、诊断、日志、审计；
- P09-B4-04-R1：原 B4-04 撤回，不再作为名邦产品规则。

P09-B2-02 的核心“名邦不直连 JYT / 不管理 JYT 电话凭证”继续有效；其旧网络方向文字由 A04-R1 替代。

当前 Batch 4 剩余待审：P09-B4-01、P09-B4-02、P09-B4-03、P09-B4-05、P09-B4-06。


## 2026-10-04｜PDM-09 Batch 4 完成

用户明确“全部同意”，一次性确认剩余：

- P09-B4-01：无缓存时按需取号，成功缓存后拨号；
- P09-B4-02：expires_at / freshness 不作为普通查看 / 拨打硬失效门槛；
- P09-B4-03：车源同步阶段不批量预取电话；
- P09-B4-05：P03-05 收口为 publisher 电话缓存管理 / 诊断页，不再承载 Collector URL / Phone Path；
- P09-B4-06：V1 不提供上游电话专门复制动作。

P09-B4-04 已在前轮确认撤回。

至此 PDM-09 Batch 1～4 用户审查全部完成。

当前下一步：

> **执行 PDM-09 全量 Decision Coverage / 未映射检查。**

PDM-09 尚未 FINAL APPROVED，不得标记 COMPLETE，不得进入 PDM-10。


## 2026-10-04｜PDM-09 全量覆盖校验完成

已完成 PDM-09 全量 Decision Coverage / 未映射检查。

结果：

- SOURCE_DECISION_COVERAGE = 100%（20/20）
- UNMAPPED = 0
- Batch 1～4 全部审查单元均有明确最终去向；
- 原 A04/A11/B2-02 的旧网络方向已由 A04-R1/A11-R1 正确替代；
- B4-04 已撤回且无孤儿产品 Decision；
- 当前 IA / Low-Fi 仍存在少量旧 Collector 电话连接 carrier，但均已有明确 supersede 去向，标记为 STALE_CARRIER，进入后续 IA / Engineering 整改，不阻塞 PDM-09 产品最终审批。

已生成：

- `07_重建工作区/PDM-09_全量DecisionCoverage未映射检查报告_2026-10-04.md`
- `07_重建工作区/PDM-09_最终完整规则总览_待用户批准.md`

当前状态：

> `PDM-09 / FINAL_REVIEW_PENDING`

未经用户最终批准，不得标记 PDM-09 COMPLETE，不得进入 PDM-10。


## 2026-10-04｜PDM-09 最终完成

用户最终明确确认 PDM-09《最终完整规则总览》。

- PDM-09 状态：`COMPLETE`；
- 正式规则文件：`07_重建工作区/PDM-09_最终完整规则.md`；
- SOURCE_DECISION_COVERAGE = 100%（20/20）；
- UNMAPPED = 0；
- A04/A11 的旧 API 方向已由 A04-R1/A11-R1 正式替代；
- B4-04 已正式撤回；
- 旧 IA / Low-Fi Collector 电话连接 carrier 保留为后续对齐整改项，不属于未决产品规则；
- Decision Register 已登记 `PDM09-GATE-FINAL`；
- 后续 PDM 不得静默改写 PDM-09，真实跨域冲突必须显式提交用户裁决。

当前进入准备：

> **PDM-10｜价格 / 查价 / 客户展示价覆盖**


## 2026-10-04｜PDM-10 Batch 1 已形成

已按冻结执行规范完成 PDM-10 前置证据扫描：

- 先识别当前已实现 / 已测试价格事实；
- 再读取 9/19 R4 / R11；
- 向前扫描 CN11 / 9/06 SSOT 与 Decision；
- 向后核对 9/22、IA V5、实际 Low-Fi、工程 Delta；
- 使用 001～078 M11 的 17 个归档单元做反向差集。

已形成：

> **P10-A01～P10-A12，共 12 条稳定一致候选。**

工作版：

> `07_重建工作区/PDM-10_价格查价客户展示价覆盖_规则原子重建_工作版.md`

已明确排除出 Batch 1 的包括：

- 加价 OFF 语义演进；
- 三类车源覆盖价范围演进；
- 内部价 permission 演进；
- 调价 permission 承载缺口；
- 临时追加查价次数历史遗漏；
- 排序 / 格式 / 低价警告等承载缺口；
- 同一 vehicle_id 一键转名邦后的价格继承冲突。

当前状态：

> `PDM-10 / BATCH_1_STABLE_CONSISTENT / USER_REVIEW_PENDING`

未经用户确认不得进入 Batch 2。


## 2026-10-04｜PDM-10 Batch 1 完成并进入 Batch 2

用户明确“全部同意”，确认 P10-A01～P10-A12 全部通过。

Batch 1 状态：

> `COMPLETE_USER_CONFIRMED`

Decision Register 已登记 PDM10-DEC-A01～A12 与 PDM10-GATE-B1。

已继续完成 Batch 2 筛选，共形成：

> **P10-B2-01～P10-B2-12**

当前进入：

> `PDM-10 / BATCH_2_DEPRECATED_SUPERSEDED_DO_NOT_RESTORE / USER_REVIEW_PENDING`

未经用户确认不得进入 Batch 3。


## 2026-10-04｜PDM-10 Batch 2 完成并进入 Batch 3

用户明确“全部同意”，确认 P10-B2-01～P10-B2-12 全部通过。

Batch 2 状态：

> `COMPLETE_USER_CONFIRMED`

Decision Register 已登记 PDM10-DEC-B2-01～B2-12 与 PDM10-GATE-B2。

经后续证据复核，Batch 3 不凑数量，只形成 3 条真正的知情修改 / 明确新增：

- P10-A13：加价关闭显示上游标价；
- P10-A14：覆盖价扩展到批发 / 名邦 / 4S；
- P10-A15：名邦内部价查看取消独立 permission 门槛。

当前进入：

> `PDM-10 / BATCH_3_INFORMED_CHANGES_AND_EXPLICIT_ADDITIONS / USER_REVIEW_PENDING`

未经用户确认不得进入 Batch 4。


## 2026-10-04｜Batch 2/3 反向冲突门禁与 PDM-10 内部价权限纠正

用户批准将“Batch 2 / Batch 3 入批前反向冲突检查”写入全局执行规范与四批门禁。

本次触发问题：

- R4 存在内部价 permission + data scope 正式规则；
- R11 后来取消独立 permission；
- 已完成 PDM-02 最终规则已经由用户主动反转回“独立 permission”；
- IA V5 / 001～078 又记录反向承载与冲突；
- PDM-10 前一轮却误把 R11 当作最终演进，形成错误的 P10-B2-10 / P10-A15。

纠正结果：

- P10-B2-10：`REOPENED / INVALID_CLASSIFICATION`；
- P10-A15：`WITHDRAWN_FROM_BATCH_3 / RECLASSIFIED_TO_BATCH_4`；
- P10-A13、P10-A14：用户已确认；
- P10-B4-01：`USER_APPROVED`，内部价查看恢复/继承为后台可配置独立 permission；
- PDM-10 当前进入 `BATCH_4_EVIDENCE_REVIEW`。

本次未修改 R11 / IA / Low-Fi 历史证据原件。


## 2026-10-08｜Legacy Engineering Baseline 纳入规则

- 用户确认将 2026-09-17 CR007 历史工程资产作为后续工程复用底盘纳入当前仓库。
- 已建立：`09_历史工程资产基线/`。
- 该目录定位为 `Legacy Engineering Baseline`，不是 Current Product Authority，不改变 PDM-01～25 Final 的权威结论。
- Authority 顺序固定为：`PDM-01～25 Final → Current IA → Current Low-Fi → Current Engineering Baseline / Work Order → Legacy Engineering Baseline`。
- 后续工程施工前，旧工程资产必须经过 Engineering Delta，并按 `KEEP_DATA / KEEP_CANDIDATE_VERIFY / MODIFY_REQUIRED / ADD_REQUIRED / DEPRECATED_LOGIC_REFERENCE / REFERENCE_ONLY` 分类。
- 已冻结禁恢复项包括：旧 Mingbang→Collector Phone API 方向、旧 Collector Base URL / Phone Path 后台配置、旧 vehicles.biz_status 单一 Authority、旧锁车冲突不自动候补、旧草稿自动保存等。
- 采集 / Collector 程序本体为独立已运行系统，本项目不重写采集后台，只完成名邦侧 Integration API Contract 与联调。
- 当前产品阶段不因此前移：`PRODUCT_BASELINE = NOT_READY`。
- 当前唯一下一步保持：**IA 全局集中对齐**（`NEXT = IA_GLOBAL_ALIGNMENT`）。
- 说明：治理入口已纳入仓库；大体积 Legacy 工程资产本体需解压后置于 `09_历史工程资产基线/01_ENGINEERING_STARTER_LEGACY/`，不得只提交 ZIP。
