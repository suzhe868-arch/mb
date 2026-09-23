# 名邦汽车 V1｜产品基线重建 GitHub 工作包 V1

## 定位

这是**产品业务基线重建专用仓库内容**，不是 9/22 完整项目母包，也不是最终产品基线。

9/22 完整母包继续原样冻结保存；本工作包只抽取产品基线重建需要的六类证据，并提供可跨聊天窗口持续工作的 GitHub 状态入口。

## 新窗口接力入口

任何新聊天窗口 / ChatGPT / Codex 接手时，固定先读：

1. `README.md`
2. `CURRENT_PROJECT_STATE.md`
3. `NEXT_ACTION.md`
4. `PROJECT_STATE.json`
5. `00_先读/01_产品基线重建执行规范_冻结工作版.md`
6. `07_重建工作区/DECISION_REGISTER.md`

不要使用旧聊天记忆替代仓库证据。

## 六类证据

1. `01_证据_A_9月19日产品业务锚点/`：9/19 Phase1 Final Merge 产品业务部分及其内含历史。
2. `02_证据_B_9月22日冻结台账/`：9/22 VR/FROZEN 裁决记录。
3. `03_证据_C_IA_V5_Current/`：IA V5 Current 结构合同。
4. `04_证据_D_实际_LowFi/`：9/22 快照中的实际 Low-Fi V1 当前资产。
5. `05_证据_E_工程总闭环待执行Delta/`：后来已发现、待施工的工程闭环问题。
6. `06_证据_F_001至078历史反向差集/`：78 条未裁决模块归档 + 原滚动总结追溯件。

## 业务语言规则

- **中文（zh-CN）是唯一产品业务权威源。**
- 英文版只在中文规则冻结后同步生成，作为工程辅助镜像。
- API、字段、枚举、状态码、代码符号等技术标识保持英文原文。
- 中英文不一致时以中文权威源为准。

## 先读

- `00_先读/01_产品基线重建执行规范_冻结工作版.md`
- `00_先读/02_9月19日产品全域覆盖地图_未裁决版.md`

## 当前状态

- `PRODUCT_BASELINE = NOT_READY`
- `CURRENT_STAGE = GLOBAL_COVERAGE_MAP_VALIDATION`
- `CANONICAL_LANGUAGE = zh-CN`
- `9/22_FULL_MOTHER_PACKAGE = PRESERVED_OUTSIDE_THIS_PACKAGE`
- `IA / LOW-FI / ENGINEERING = NO_CONSTRUCTION`

详见：`CURRENT_PROJECT_STATE.md` 与 `NEXT_ACTION.md`。

## Git 使用

GitHub 作为长期工作底座。每完成一个可独立验收的产品域 / 规则组并完成用户裁决后：

> 更新业务文件 → Decision Register → CURRENT_PROJECT_STATE → NEXT_ACTION → PROJECT_STATE.json → 自验 → Git commit

不要把中间结论直接施工回完整项目母包。
