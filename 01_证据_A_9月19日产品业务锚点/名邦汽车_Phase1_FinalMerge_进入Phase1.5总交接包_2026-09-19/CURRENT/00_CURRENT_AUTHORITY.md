# CURRENT AUTHORITY｜Phase 1 Final Merge

## 唯一当前入口

从本包开始，Phase 1 业务主线的唯一当前权威入口是：

> `CURRENT/Phase1_当前唯一业务合并基线.md`

R1～R12 原始最终总结、各轮补丁、R11 回补包、R12 单模块包：

> **全部降为 HISTORY / 追溯材料。**

`CURRENT/MODULES/` 中的模块文件是最终合并基线的展开附件，用于按模块阅读；若模块附件与 `Phase1_当前唯一业务合并基线.md` 发生文本冲突：

> **以最终合并基线 + 用户最新明确决定为准。**

## 当前阶段

- C1～C5：已冻结 / COMPLETE
- R1～R12：`BUSINESS_REVIEW = COMPLETE`
- `PHASE_1_BUSINESS_REVIEW = COMPLETE`
- `PHASE_1_FINAL_MERGE = COMPLETE`
- 下一阶段：`PHASE_1_5_BUSINESS_CLOSURE_REVIEW`

## 重要边界

- Phase 1.5 不重新从头重审 R1～R12。
- 第一项必须是历史遗漏扫描。
- HISTORY 只能用于发现遗漏、追溯来源、识别旧规则；不能自动覆盖 CURRENT。
- 发现历史规则必须先分类：
  1. 已明确废弃 / 被覆盖 → 保持废弃；
  2. 未被推翻但版本迁移时遗漏 → 候选恢复；
  3. 与当前规则冲突 / 含义不明 → 只有重大业务差异才提交用户裁决。
