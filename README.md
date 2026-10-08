# 名邦汽车 V1｜产品基线重建 GitHub 工作包 V1

## 当前最新｜F03-1-G0方案验收通过，实际实现待工作单放行（2026-10-09）

- **A正式签发F03_1_G0_ACCEPTED（仅方案与假数据批）**：验收B `feat/f03-login` SHA `d5987afc14d591db683facf15ebf767f9762af2a`；[同SHA CI 37856201791](https://github.com/suzhe868-arch/mb/actions/runs/37856201791)成功19/19，A另补查17/17通过，两项整改已闭合。
- 验收记录：`07_重建工作区/F03-1-G0_A主控验收签发与残余风险_2026-10-09.md`。真实登录、数据库/会话迁移及事务/部署仍NOT_RUN，不能将静态模型验收写成完整F03-1实现通过。
- **当前唯一工程下一步：A准备F03-1实际实现工作单及待裁定参数，交用户批准；B暂不施工下一批。** 工程分支尚未合并，合并需另行用户批准。
- C/H01独立审查继续且未最终验收。F03-1实现、F03-2/3、F02-2/3/4、F04及业务/生产库未授权，不改PDM Final/Current IA/Low-Fi，不擅自合并B/C，`PRODUCT_BASELINE=NOT_READY`。
- 本次只登记A治理文件，没有新增main独立测试；现行指针：`F03_1_G0_ACCEPTED_A_IMPLEMENTATION_GATE_PREPARATION_AND_H01_VISUAL_REVIEW`。以下旧施工状态为历史。

## HISTORICAL｜F03-1-G0方案获准施工时（2026-10-09）

- 用户于2026-10-09在A窗口明确“同意”；A正式登记 **F03_1_G0_AUTHORIZED / USER_APPROVED / NOT_YET_IMPLEMENTED**。
- 正式放行单：`07_重建工作区/F03-1-G0_A主控登录安全方案施工放行_2026-10-09.md`；工作范围见`07_重建工作区/F03-1_账号登录与密码安全工作单_待批准_2026-10-09.md`顶部放行增补。
- **当前唯一工程下一步：B从包含本放行登记的最新main新建 `feat/f03-login`，完成登录和密码安全方案、身份状态/会话合同、精确结构差异与纯假数据检查；提交精确SHA、同SHA成功CI、覆盖表和风险交A独立验收。** 已验收`feat/f03-auth`保留为历史。
- 仅方案批获准；真实登录、HTTP认证服务、数据库连接/建表/会话迁移及F03-1实现批仍未授权。本次登记没有运行新工程测试，不表示安全方案已验收。
- F03-G0已验收并合并；C/H01继续独立审查且未最终验收。F03-2/3、F02-2/3/4、F04及业务/生产库未授权，不改PDM Final、Current IA/Low-Fi，不擅自合并B/C，`PRODUCT_BASELINE=NOT_READY`。
- 现行指针：`F03_1_G0_B_SAFETY_DESIGN_A_REVIEW_AND_H01_VISUAL_REVIEW`；以下旧待批准/施工状态仅为历史。

## HISTORICAL｜F03-G0验收合并后、F03-1方案待批准（2026-10-09）

- **F03-G0已正式验收并合并main**：B SHA `b4b56401b68ba91776ddd7edfa0b545586137720`；[CI 37852018024](https://github.com/suzhe868-arch/mb/actions/runs/37852018024)同SHA成功，34/34静态检查；[PR #3](https://github.com/suzhe868-arch/mb/pull/3)已merged，merge SHA `6983709937ebf1d9ae8a7f6cd0a4267bb2269ac6`。
- A验收/合并记录：`07_重建工作区/F03-G0_A主控验收与合并记录_2026-10-09.md`。缺编号与历史嵌套内容泄露两处阻断已闭合；本批仅合同/纯模块/假数据，不表示真实登录或DB动态授权已完成。
- **A下一批工作单已准备**：`07_重建工作区/F03-1_账号登录与密码安全工作单_待批准_2026-10-09.md`。建议先批准F03-1-G0账号登录与密码安全方案、状态/会话合同及精确结构差异小批；用户批准前B不施工。实际认证、会话表迁移另行审查放行。
- 真实测试证据来自B精确SHA，合并后main没有新的独立测试运行；本次只登记治理记录，没有部署或访问数据库。
- C/H01独立审查继续；F03后续批、F02-2/3/4、F04正式施工及业务/生产库未授权，不擅改PDM Final/Current IA/Low-Fi，`PRODUCT_BASELINE=NOT_READY`。
- 现行指针：`F03_1_G0_SAFETY_DESIGN_PENDING_USER_APPROVAL_AND_H01_VISUAL_REVIEW`；以下较早待施工状态为历史。


## HISTORICAL｜F03-G0获准施工时的状态（2026-10-09）

- 用户于2026-10-09明确“同意放行”；A正式签发 `F03_G0_AUTHORIZED / USER_APPROVED / NOT_YET_IMPLEMENTED`。
- 正式放行单：`07_重建工作区/F03-G0_A主控正式施工放行_2026-10-09.md`；详细范围：`07_重建工作区/F03_开工门禁与分批施工建议_待用户批准_2026-10-09.md`（顶部放行增补为准）。
- **B当前任务**：从包含本次放行登记的最新main新建 `feat/f03-auth`，只施工F03-G0权限合同、身份会话合同、纯权限决策模块与假数据静态正反例；提交SHA、真实CI、规则覆盖表与风险交A验收。原 `feat/f02-schema` 保留。
- 本批不连接数据库，不做真实登录/微信接入、会话表迁移或F04业务API。F03-1/2/3、F02-2/3/4及其它后续正式施工仍未授权。
- F02-G0/F02-1已验收并合并，C/H01继续原独立视觉审查，不因本放行自动验收/合并或扩展折叠屏；产品Authority不变，`PRODUCT_BASELINE=NOT_READY`。
- 现行指针：`F03_G0_B_IMPLEMENTATION_A_REVIEW_AND_H01_VISUAL_REVIEW`。下面旧待批准状态是本次用户批准前的历史记录。


## HISTORICAL｜F02-1合并后F03待批准状态（2026-10-09）

- **F02-G0/F02-1 = ACCEPTED / MERGED_TO_MAIN**。[PR #2](https://github.com/suzhe868-arch/mb/pull/2)已合并，merge SHA `3412dc76815e97a7df9024d8b7812a2aece7036c`；已验收B SHA `9f10f65be293fd892e4787a3a3bdff2676c487ea`。
- 合并记录：`07_重建工作区/F02-1_工程合并main与后续门禁记录_2026-10-09.md`；核对B 83个engineering/workflow blob一致、main原有979文件全部保留。63新增文件，无产品Authority改写。
- 真实F02 CI证据来自已验收B SHA，不将其写成合并后main独立回归；本次没有重跑数据库测试。
- **当前唯一工程下一步：用户审查并决定是否批准F03-G0限定首批。** 工作单：`07_重建工作区/F03_开工门禁与分批施工建议_待用户批准_2026-10-09.md`；只准备门禁，B当前暂不施工，F03-1及其余批次另行放行。
- C/H01独立视觉复核继续，未最终验收；F02-2/3/4、F04及其他正式施工、业务/已迁/生产库、C合并仍未授权；不增加折叠屏专项，`PRODUCT_BASELINE=NOT_READY`。
- 现行指针：`F03_G0_PENDING_USER_APPROVAL_AND_H01_VISUAL_REVIEW`。以下较早“当前/最新”均为历史过程。


## HISTORICAL｜F02-1 A验收登记时（合并前）

- **A 正式签发：`F02_1_ACCEPTED / A_SIGNED / USER_APPROVED`**。验收 B `feat/f02-schema` 精确 SHA `9f10f65be293fd892e4787a3a3bdff2676c487ea`；[F02-1 CI 37843224982](https://github.com/suzhe868-arch/mb/actions/runs/37843224982) 与 [G0 CI 37843225062](https://github.com/suzhe868-arch/mb/actions/runs/37843225062) 同一 SHA、completed/success。
- 正式签发与风险记录：`07_重建工作区/F02-1_A主控最终验收签发与残余风险_2026-10-09.md`。独立核验实际工件：76业务表、464字段、160外键、28额外唯一索引、39 CHECK、5历史触发器；5/5非表对象拒绝、32项fixture、事务失败回滚、1 applied +3 idempotent并发及结构漂移负例通过。
- **本次仅将 A 验收与状态登记 main；B 工程代码仍在 B 分支，未合并。** main 没有因此获得 F02-1 工程实现；上述运行证据来自已验收 B SHA，不是 main 业务/部署测试。
- 当前工程下一步：A 提交已验收工程合并及下一阶段门禁建议，等待用户另行批准；B 本阶段结束，暂不启动新施工。C/H01 独立视觉复核继续，未最终验收，暂不增加折叠屏专项。
- F02-2/3/4、F03/F04正式施工、B/C合并main、业务/已迁/生产库访问仍未授权；PDM Final / Current IA / Current Low-Fi 不变，`PRODUCT_BASELINE=NOT_READY`。
- 唯一现行指针：`F02_1_ACCEPTED_A_NEXT_GATE_PENDING_USER_APPROVAL_AND_H01_VISUAL_REVIEW`。以下历史“当前/最新”描述不覆盖本节。


## HISTORICAL｜F02-G0 A验收及F02-1隔离施工放行（2026-10-08）

- **用户明确“同意”批准 A 最终验收落库**；正式签发文档：`07_重建工作区/F02-G0_A主控最终验收签发与F02-1隔离施工放行_2026-10-08.md`。A 验收 B 精确 SHA `f2cdb0e8c7967aeaa8cfea5c6b466c9b45a68946`，真实 CI [37722491859](https://github.com/suzhe868-arch/mb/actions/runs/37722491859) SUCCESS：F01 13/13、G0候选2/2、G0全量75/75，共90/90 PASS。
- `G0_ACCEPTED / A_SIGNED`：510 个字段候选（464 拟纳入 / 33 延期 / 13 排除）、82 候选实体、76 最小拟建实体、137 显式静态 FK，G0-ALL-05 单一 PC 凭证权威已闭环。
- **F02-1 已达到原施工单的条件授权前置门禁，可以在 `feat/f02-schema` 开始一次性隔离 PostgreSQL 16 全新空库真实建表、约束和迁移测试；本次 A 仅签发，不代替 B 执行。** F02-2/3/4、F03/F04、已迁/真实/生产库、旧破坏性脚本、B 合并 main 仍未授权。
- G0 PASS 不代表 F02-1 物理 DDL/并发/业务服务已测试；F02-1 结束还需 B 提交真实 SHA、SQL/迁移及 PG16 实测日志供 A 单独验收。C/H01 继续独立视觉复核，H02 未自动放行，`PRODUCT_BASELINE=NOT_READY`。
- 下方早期标注“最新”“当前”的 F02-G0 补审内容均为**历史过程**，不再阻止本节已签发的 G0 验收；跨文档执行指针统一以 `NEXT_ACTION.md` 最新段落及本签发单为准。


## HISTORICAL｜A 主控曾要求的 F02-G0 四域范围一致性补审（已闭环）

- 用户“同意，确定执行”，正式补审单：`07_重建工作区/F02-G0_A主控范围一致性定向补审单_SystemAdmin_匹配_CRM_公海_2026-10-08.md`。B 当前只在 `feat/f02-schema` 补齐或证明 System Admin 身份、Demand/Match Result、CRM Follow-up、公海流转记录的 F02-1 最低持久化承载与合法分期。
- 已核实 `G0-CL-01/02`（53 实体/96 静态外键闭合）及最新 B CI `37712078050` 成功；**本次不是返工此前成功检查**。未逐事实闭合四项之前，`G0_SCOPE_COVERAGE_PENDING / G0_MODEL_FREEZE_PENDING / G0_ACCEPTED=NO`；F02-1 和 main 合并未放行。
- `NEXT_ACTION.md` 顶部是唯一当前执行指针；本文件下方的此前 F02-G0 整改单及 F01 历史描述均不覆盖本节。C/H01 独立推进。


## 最新主控审查与待施工整改｜F02-G0（2026-10-08）

- 用户“同意，确定执行”批准 A 本轮最终门禁定向整改；正式主控整改单：`07_重建工作区/F02-G0_A主控最终门禁整改单_外键闭合与实体完整性_2026-10-08.md`。
- B `feat/f02-schema` 最近核验 HEAD `95fb1776eec535fb4e83b48d292034dfcb49c8fb`；CI `37710259345` 成功，但拟施工字段仍有**引用被延期外键目标**与**只纳业务字段、不纳最小主键/依赖**两类缺口。B 仅在工程分支补审、修正、测试，自验后由 A 再复核。
- `G0_ENVIRONMENT_PASS / G0_MODEL_FREEZE_PENDING / G0_ACCEPTED=NO`；**F02-1 未放行执行**，F02-2/3/4、F03/F04、main 合并和真实/生产库操作继续禁止。C/H01 仍独立返修和视觉确认。下方“当前最新工程任务”是此前施工授权背景，本节与 `NEXT_ACTION.md` 顶部为现行指针。


## 当前最新工程任务｜F02-G0 和条件 F02-1

- 用户 2026-10-08“确认执行”，F02 技术门禁审定，正式施工单 `07_重建工作区/F02_正式施工单_数据库模型与隔离开发_2026-10-08.md`；A 裁定 `07_重建工作区/F02_主控技术裁定与开工门禁_2026-10-08.md`。B 在从最新 main 新建的 `feat/f02-schema` 完成 F02-G0，A 验收后方可执行 F02-1 的**隔离 PG16 新装空库开发测试**。
- F02-2/3/4、F03/F04 正式施工、生产/已迁真实库连接、旧清库脚本和 main 合并未授权；B 三份门禁准备报告已原文收入 main，旧 F01 B 分支不动。
- C/H01 仍未通过最终设计验收；`PRODUCT_BASELINE=NOT_READY`。当前唯一指针 `F02_G0_THEN_F02_1_ISOLATED_H01_REVIEW`。以下 F01 之后的旧指针只作历史描述，以本段和 NEXT_ACTION 顶部为准。

## 定位

这是**产品业务基线重建专用仓库**，不是 9/22 完整项目母包，也不是最终产品基线。

9/22 完整母包继续原样冻结保存；本仓库用于重建新的《名邦汽车 V1 当前唯一产品业务基线》。

## 新窗口接力入口

任何新聊天窗口 / ChatGPT / Codex 接手时，固定先读：

1. `README.md`
2. `CURRENT_PROJECT_STATE.md`
3. `NEXT_ACTION.md`
4. `PROJECT_STATE.json`
5. `IMPORT_STATUS.md`
6. `00_先读/01_产品基线重建执行规范_冻结工作版.md`
7. `00_先读/02_9月19日产品全域覆盖地图_未裁决版.md`
8. `07_重建工作区/DECISION_REGISTER.md`

不要使用旧聊天记忆替代仓库证据。

## HISTORICAL｜A/B/C 三窗口协作建立时的分支接力（2026-10-08）

- **当前状态（2026-10-08）**：F01 工程基础已由 A 验收并通过 PR #1 合并 main；设计 H01 仍在 A 返修复核/用户视觉方向待确认；F02/F03/F04 仅能准备技术方案及各自开工门禁，不得越级施工。其余 F/H 仍需分别授权。
- **A 主控**负责全局状态、风险、验收、申请合并授权；**B 工程**只在 `feat/f01-foundation` 执行已批准的 F 单并留下真实测试证据；**C 设计**只在 `design/h01-design-system` 执行已批准的 H01/H02 设计任务，H03/H04 按依赖另行调度。
- 先阅读：`07_重建工作区/A_B_C三窗口协作与验收规范.md`。
- B 继续阅读：`07_重建工作区/B工程完整施工路线图_F01至F08.md`。
- C 继续阅读：`07_重建工作区/C设计完整执行路线图_H01至H04.md`。
- B/C 的分支仍可能指向原起点，须**直接读取 main 上的新规范**，但继续在自己的工作分支写入，不得擅自 reset/强推/向 main 写入/合并。
- 施工完成后向分支提交 `SHA + 文件差异 + 真实检查/测试输出 + 未闭环风险`；A 按对应分支读取、审核；**验收不等于合并 main，合并须经用户另行批准**。
- 以上只补充项目协作管理，PDM-01～25 Final、Current IA、Current Low-Fi、门禁施工单、现行业务规则均未变更。

## 六类证据

1. `01_证据_A_9月19日产品业务锚点/`
2. `02_证据_B_9月22日冻结台账/`
3. `03_证据_C_IA_V5_Current/`
4. `04_证据_D_实际_LowFi/`
5. `05_证据_E_工程总闭环待执行Delta/`
6. `06_证据_F_001至078历史反向差集/`

## 仓库导入状态

`COMPLETE / VERIFIED`

`SOURCE_MANIFEST_SHA256.csv` 中 603 个唯一文件路径已与 GitHub 完整递归文件树机械比对：

- 603/603 存在；
- 缺失 0；
- 六类证据文件数：A=68、B=1、C=11、D=507、E=1、F=2；
- 递归树 `truncated=false`。

详见：`IMPORT_STATUS.md`。

## 业务语言规则

- **中文（zh-CN）是唯一产品业务权威源。**
- 英文版只在中文规则冻结后同步生成，作为工程辅助镜像。
- API、字段、枚举、状态码、代码符号等技术标识保持英文原文。
- 中英文不一致时以中文权威源为准。

## HISTORICAL｜F01验收时的状态快照（现行以顶部为准）

- `PRODUCT_BASELINE = NOT_READY`
- `CURRENT_STAGE = PRODUCT_BASELINE_REBUILD / F01_ACCEPTED_H01_REVIEW_NEXT_ENGINEERING_GATE`
- `PDM-01_TO_PDM-25 = COMPLETE / INTEGRITY_PASS`
- `GLOBAL_PDM01_25_FINAL_INTEGRITY_AUDIT = PASS`
- `FINAL_INTEGRITY_HISTORICAL_TAIL_CLEANUP = PASS`
- `HISTORICAL_CARRIER_LABELED = 68 / 68`
- `STALE_CURRENT_POINTER_UNQUALIFIED = 0`
- IA：`COMPLETE / FINAL_GAP_PASS`
- Low-Fi：`COMPLETE / FINAL_GAP_PASS`
- Engineering：`F01_ACCEPTED / MERGED_TO_MAIN`（**仅基础工程已施工；其余业务仍未施工**）
- 当前唯一下一组行动：**H01 设计返修/视觉方向复核 + 工程 F02/F03/F04 分阶段开工门禁准备（不施工）**
- `NEXT = F01_ACCEPTED_H01_REVIEW_ENGINEERING_NEXT_GATE`
- IA Batch 4 已于 2026-10-08 经用户“全部同意确认执行”后正式落库；6 项 Final-gap 全部关闭，剩余 `CARRIER_DEFERRED=0`，IA 全局集中对齐完成。
- `LF-B1-01～LF-B1-07` 已于 2026-10-08 经用户“全部同意，确认执行”后正式落库；25 个旧 Low-Fi SVG 已明确退役，定向 stale-current scan=0。
- `LF-B2-01～LF-B2-07` 已于 2026-10-08 经用户确认执行后正式落库；累计 26 个历史 Low-Fi 资产明确不再作为 Current，Batch 2 定向 stale-current scan=0。
- `LF-B3-01～LF-B3-04` 已于 2026-10-08 经用户“全部同意，确认执行”后正式落库；有效新 carrier 缺口=0，Low-Fi 新 Page/State/SVG=0/0/0，4 组 IA stale carrier 已回修，Batch 3 定向 stale-current scan=0。
- `LF-B4-01` 已于 2026-10-08 经用户“同意确认执行”后正式落库；5 个 LockRequest V2 已存在 Low-Fi carrier 完成 IA 索引补齐，Final-gap Scan 全部通过，Low-Fi 全局集中对齐正式 `COMPLETE / FINAL_GAP_PASS`。
- 9/22 旧 Delta：`05_证据_E_工程总闭环待执行Delta/工程总闭环待执行Delta清单.md`，仍仅作历史输入，禁止直接施工。
- 工程启动门禁已于 2026-10-08 经用户“确认执行”批准：`PASS / USER_APPROVED / APPLIED`；路径级分类覆盖 160 文件、旧接口归属覆盖 218 项。**F01 单独完成基础工程验收**，F02～F08 的接口逐字段和运行验收仍未完成。
- **F01 验收记录**：`07_重建工作区/F01_工程基础验收与合并记录_2026-10-08.md`；合并 [PR #1](https://github.com/suzhe868-arch/mb/pull/1)，工程分支 CI [37695813678](https://github.com/suzhe868-arch/mb/actions/runs/37695813678)。H01/H02 仍按“核心视觉/High-Fi 确认一批 → 前端仅开发已放行批次”执行。
- High-Fi / Design System：`H01_READY_FOR_A_REVIEW / REVISIONS_AND_USER_VISUAL_PENDING`；C 分支不因 F01 合并而验收或合并。
- HISTORICAL｜IA Batch 1 时曾记录 Low-Fi / Engineering 尚未施工；现已被本段 F01 验收结论替代。
- 历史尾巴复核报告：`07_重建工作区/PDM-01至25_Final_Integrity历史阶段尾巴清理与Current_History边界复核_2026-10-07.md`

详细阶段历史、用户裁决和逐 PDM 进度保留在 `CURRENT_PROJECT_STATE.md`、`07_重建工作区/DECISION_REGISTER.md`、各 PDM Final / Integrity 与 Cross-PDM Handoff Register 中。


## 工程启动门禁已通过｜2026-10-08

- Gate：`PASS / USER_APPROVED / APPLIED`，**仅放行施工单和设计任务，业务代码、数据库、前端均未施工**。
- 资产路径级审计：`160/160`；旧接口 method+path 归属：`218/218`。它们不是工程逻辑/运行验收。
- 正式三份交付：
  - `07_重建工作区/工程启动门禁_历史工程复用与差异台账_2026-10-08.md`
  - `07_重建工作区/工程启动门禁_工程基础施工单与验收标准_2026-10-08.md`
  - `07_重建工作区/工程启动门禁_最终审查报告_2026-10-08.md`
- HISTORICAL｜工程启动门禁通过时曾指定 `F01 + H01` 双轨开始；现 F01 已完成，最新执行指针以本段及 `NEXT_ACTION.md` 为准。
- 施工必须服从 PDM-01～25 Final、Current IA、Current Low-Fi；禁止直接恢复旧逻辑、用旧迁移施工或先按 Low-Fi 批量写正式页面。

## Git 使用

GitHub 作为长期工作底座。每完成一个可独立验收的产品域 / 规则组并完成用户裁决后：

> 更新业务文件 → Decision Register → CURRENT_PROJECT_STATE → NEXT_ACTION → PROJECT_STATE.json → 自验 → Git commit

不要把中间结论直接施工回完整项目母包。


## 历史工程资产基线

- `09_历史工程资产基线/`：2026-09-17 CR007 的 Legacy Engineering Baseline，经 2026-09-22 历史链核验后纳入。
- 该目录**不是 Current Product Authority**，仅用于后续 Engineering Delta、代码/数据复用和历史工程成熟度追溯。
- 使用优先级：`PDM-01～25 Final → Current IA → Current Low-Fi → Current Engineering Baseline / Work Order → Legacy Engineering Baseline`。
- 与当前 PDM Final 冲突的旧 Schema / API / 权限 / 状态机 / 交互逻辑禁止直接恢复。
- 采集/Collector 程序本体为独立已运行系统，本仓库只保留名邦侧对接 Contract 与历史参考，不重写采集后台。
