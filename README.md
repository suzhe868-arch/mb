# 名邦汽车 V1｜产品基线重建 GitHub 工作包 V1

## 最新 A 主控裁定｜F02-G0 四域范围一致性补审（2026-10-08）

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

## A/B/C 三窗口协作与分支接力（2026-10-08 用户确认执行）

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

## 当前状态

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
