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
- `CURRENT_STAGE = PRODUCT_BASELINE_REBUILD / PDM-13_BATCH_4_RECONSTRUCTION`
- `PDM-01_TO_PDM-12 = COMPLETE / INTEGRITY_PASS`
- `GLOBAL_PDM01_10_CROSS_PDM_AUDIT = PASS`
- `PDM-11 = COMPLETE / INTEGRITY_PASS`
- `PDM-11_INCOMING_HANDOFF = HO-P01-P11-001 / HANDOFF_SUPERSEDED; HO-P01-P11-002 / HANDOFF_CLOSED`
- `PDM-11_FINAL = 07_重建工作区/PDM-11_最终完整规则.md`
- `PDM-12 = COMPLETE / INTEGRITY_PASS`
- `PDM-12_FINAL = 07_重建工作区/PDM-12_最终完整规则.md`
- `PDM-12_BATCH_1 = P12-A01～P12-A15 / PASS / USER_APPROVED`
- `PDM-12_BATCH_2 = P12-B2-01～P12-B2-10 / PASS / USER_APPROVED`
- `PDM-12_BATCH_3 = P12-B3-01～P12-B3-07 / PASS / USER_APPROVED`
- `PDM-12_BATCH_4 = P12-B4-01～P12-B4-06 / PASS / USER_APPROVED / CHOICES=1A,2A,3A,4A,5A,6A`
- `PDM-12_PREFINAL_REPAIR = P12-LIA-01～P12-LIA-06 / USER_APPROVED / APPLIED`
- `PDM-12_PREFINAL_INTEGRITY = PASS`
- `PDM-12_FUTURE_HANDOFF = PDM-13 / PDM-14 / PDM-16 / PDM-18 / PDM-20 / PDM-21 / PDM-22 / PDM-25 / HANDOFF_OPEN`
- `PDM-13 = IN_PROGRESS / BATCH_3_PASS / USER_APPROVED`
- `PDM-13_WORKFILE = 07_重建工作区/PDM-13_Priority仲裁TTL与Lock边界_规则原子重建_工作版.md`
- `PDM-13_INCOMING_HANDOFFS = 5 / 5 HANDOFF_ACCEPTED`
- `PDM-13_BATCH_1 = P13-A01～P13-A11 / PASS / USER_APPROVED`
- `PDM-13_BATCH_2 = P13-B2-01～P13-B2-05 / PASS / USER_APPROVED`
- `PDM-13_BATCH_2_REVERSE_CONFLICT_SCAN = PASS`
- `PDM-13_BATCH_3 = P13-B3-01～P13-B3-06 / PASS / USER_APPROVED`
- `PDM-13_BATCH_3_CONFLICT_ISOLATION = PASS`
- `PDM-13_NEXT = BUILD_BATCH4_CONFLICTS_OMISSIONS_GAPS_NEW_CHOICES_CANDIDATES`
- `CANONICAL_LANGUAGE = zh-CN`
- `9/22_FULL_MOTHER_PACKAGE = PRESERVED_OUTSIDE_THIS_REPO`
- `IA / LOW-FI / ENGINEERING = NO_CONSTRUCTION`

详见：`CURRENT_PROJECT_STATE.md` 与 `NEXT_ACTION.md`。

## Git 使用

GitHub 作为长期工作底座。每完成一个可独立验收的产品域 / 规则组并完成用户裁决后：

> 更新业务文件 → Decision Register → CURRENT_PROJECT_STATE → NEXT_ACTION → PROJECT_STATE.json → 自验 → Git commit

不要把中间结论直接施工回完整项目母包。
