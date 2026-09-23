# 00_READ_FIRST｜名邦汽车 Phase 1 Final Merge → Phase 1.5

## 你现在拿到的是什么

这是 Phase 1 业务重审正式结束后的换窗总交接包。

不是 R12 单模块包。

---

## 目录

### `CURRENT/`

唯一当前权威层。

先读：

1. `CURRENT/00_CURRENT_AUTHORITY.md`
2. `CURRENT/01_PROJECT_CURRENT_STATE.md`
3. `CURRENT/Phase1_当前唯一业务合并基线.md`

`CURRENT/MODULES/` 只是按 R1～R12 拆开的展开附件。

### `HISTORY/`

历史证据层。

只能用于：

- 历史遗漏扫描；
- 决策追溯；
- 确认旧规则是否被废弃；
- 找迁移遗漏。

不能直接覆盖 CURRENT。

### `NEXT/`

Phase 1.5 与后续固定流程。

---

## 当前状态

```text
C1-C5 = FROZEN / COMPLETE
R1-R12 = BUSINESS_REVIEW COMPLETE
PHASE_1_BUSINESS_REVIEW = COMPLETE
PHASE_1_FINAL_MERGE = COMPLETE
NEXT = PHASE 1.5
FIRST = 历史遗漏扫描
```

---

## 新窗口禁止事项

- 不从头重审 R1～R12；
- 不直接开始低保真；
- 不直接开始 Phase 2；
- 不把 HISTORY 旧规则当 CURRENT；
- 不把旧工程实现当成业务当前目标；
- 不因为某历史文件标 FINAL 就自动提升其权威。

---

## 新窗口工作原则

> **全量看，少打扰用户。**

只有会改变真实业务结果、存在重大互斥方案、无法由 CURRENT 唯一推出的问题才提交用户裁决。
