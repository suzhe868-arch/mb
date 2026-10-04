# 名邦汽车 V1｜下一步唯一动作

> 更新时间：2026-10-04

## 当前状态

- PDM-01 ～ PDM-10 = COMPLETE（历史裁决完成状态）
- PDM-01 ～ PDM-10 Legacy Final Integrity Audit = IN_PROGRESS
- PDM-01 Integrity Audit = INTEGRITY_PASS
- 当前审计域：PDM-02
- PDM-11 = BLOCKED_UNTIL_PDM01_10_INTEGRITY_PASS

总控工作单：

> `07_重建工作区/PDM-01至10_全域完整性复核_总控工作单.md`

## 当前唯一下一步

> **从 PDM-02 继续 Legacy Final Integrity Audit。**

每个 PDM 必须同时执行：

1. Missing Rule Audit｜重新从原始证据查整条遗漏；
2. Semantic Detail Audit｜查条件、例外、权限、scope、hard DENY、生命周期、失败/幂等、历史等是否被压缩丢失；
3. Cross-PDM Integrity Audit｜查 PDM-01～10 相互冲突、静默覆盖、handoff 丢失、stale rule；
4. Source→Final；
5. Final→Source；
6. Semantic Completeness Matrix；
7. 仅对发现问题的 Atom / 段落 reopen；
8. 真正改变产品语义的 reopen 必须重新提交用户裁决；
9. 达到 `INTEGRITY_PASS` 后再进入下一个 PDM。

## PDM-11 启动硬门禁

PDM-11 只有在以下全部完成后才允许开始：

- PDM-01～PDM-10 全部 `INTEGRITY_PASS`；
- PDM-01～10 全局 Cross-PDM / Handoff / Global Invariant 总复核 PASS；
- MISSING_RULE_UNRESOLVED = 0；
- SEMANTIC_DETAIL_GAP_UNRESOLVED = 0；
- CROSS_PDM_CONFLICT = 0；
- HANDOFF_GAP_UNRESOLVED = 0；
- GLOBAL_INVARIANT_CONFLICT = 0；
- IMPLEMENTATION_READY = PASS。

## 当前禁止

- 不开始 PDM-11 Batch 1；
- 不把旧 PDM 的 `COMPLETE` 直接等同于通过当前新完整性标准；
- 不只检查 Final 文案而跳过原始证据遗漏扫描；
- 不把 PDM-01～10 全部推倒重做；只 reopen 真正有问题的 Atom / 段落；
- 不用聊天记忆替代仓库证据；
- 不修改 IA / Low-Fi；
- 不执行 Engineering Delta。
