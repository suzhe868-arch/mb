# 名邦汽车 V1｜产品基线重建 GitHub 工作包 V1

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
- `CURRENT_STAGE = PRODUCT_BASELINE_REBUILD / LOW_FI_GLOBAL_ALIGNMENT_IN_PROGRESS`
- `PDM-01_TO_PDM-25 = COMPLETE / INTEGRITY_PASS`
- `GLOBAL_PDM01_25_FINAL_INTEGRITY_AUDIT = PASS`
- `FINAL_INTEGRITY_HISTORICAL_TAIL_CLEANUP = PASS`
- `HISTORICAL_CARRIER_LABELED = 68 / 68`
- `STALE_CURRENT_POINTER_UNQUALIFIED = 0`
- IA：`COMPLETE / FINAL_GAP_PASS`
- Low-Fi：`IN_PROGRESS / BATCH_1_2_3_APPLIED`
- Engineering：`NO_CONSTRUCTION`
- 当前唯一下一步：**Low-Fi Batch 4｜Final-gap Scan（冲突 / 遗漏 / 缺口 / 新选择）**
- `NEXT = LOW_FI_BATCH_4_FINAL_GAP_SCAN`
- IA Batch 4 已于 2026-10-08 经用户“全部同意确认执行”后正式落库；6 项 Final-gap 全部关闭，剩余 `CARRIER_DEFERRED=0`，IA 全局集中对齐完成。
- `LF-B1-01～LF-B1-07` 已于 2026-10-08 经用户“全部同意，确认执行”后正式落库；25 个旧 Low-Fi SVG 已明确退役，定向 stale-current scan=0。
- `LF-B2-01～LF-B2-07` 已于 2026-10-08 经用户确认执行后正式落库；累计 26 个历史 Low-Fi 资产明确不再作为 Current，Batch 2 定向 stale-current scan=0。
- `LF-B3-01～LF-B3-04` 已于 2026-10-08 经用户“全部同意，确认执行”后正式落库；有效新 carrier 缺口=0，Low-Fi 新 Page/State/SVG=0/0/0，4 组 IA stale carrier 已回修，Batch 3 定向 stale-current scan=0。
- IA Batch 1 已于 2026-10-08 经用户“全部同意，确认执行”后正式落库；Low-Fi / Engineering 仍不施工。
- 历史尾巴复核报告：`07_重建工作区/PDM-01至25_Final_Integrity历史阶段尾巴清理与Current_History边界复核_2026-10-07.md`

详细阶段历史、用户裁决和逐 PDM 进度保留在 `CURRENT_PROJECT_STATE.md`、`07_重建工作区/DECISION_REGISTER.md`、各 PDM Final / Integrity 与 Cross-PDM Handoff Register 中。

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
