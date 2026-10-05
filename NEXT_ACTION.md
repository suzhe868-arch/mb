# 名邦汽车 V1｜下一步唯一动作

> 更新时间：2026-10-05

## 当前状态

- PDM-01 ～ PDM-10 = COMPLETE（历史裁决完成状态）
- PDM-01 ～ PDM-10 Legacy Final Integrity Audit = COMPLETE
- PDM-01 Integrity Audit = INTEGRITY_PASS
- PDM-02 Integrity Audit = INTEGRITY_PASS
- PDM-03 Integrity Audit = INTEGRITY_PASS
- PDM-04 Integrity Audit = INTEGRITY_PASS
- PDM-05 Integrity Audit = INTEGRITY_PASS
- PDM-06 Integrity Audit = INTEGRITY_PASS
- PDM-07 Integrity Audit = INTEGRITY_PASS
- PDM-08 Integrity Audit = INTEGRITY_PASS
- PDM-09 Integrity Audit = INTEGRITY_PASS
- PDM-10 Integrity Audit = INTEGRITY_PASS
- PDM-01～10 Global Cross-PDM / Handoff / Global Invariant Audit = PASS
- 当前域：PDM-13
- PDM-11 = COMPLETE / INTEGRITY_PASS
- PDM-12 = COMPLETE / INTEGRITY_PASS
- PDM-11 启动门禁 = UNBLOCKED
- `HO-P01-P11-001 = HANDOFF_SUPERSEDED`
- `HO-P01-P11-002 = HANDOFF_CLOSED`
- PDM-12 incoming handoffs = 4 / 4 HANDOFF_CLOSED
- PDM-13 incoming handoffs = 5 / 5 HANDOFF_ACCEPTED
- PDM-13 Batch 1 = PASS / USER_APPROVED（P13-A01～P13-A11）
- PDM-13 Batch 2 = PASS / USER_APPROVED（P13-B2-01～P13-B2-05）
- PDM-13 Batch 2 Reverse Conflict Scan = PASS
- PDM-11 Batch 1 = PASS / USER_APPROVED（P11-A01～P11-A13）
- PDM-11 Batch 2 = PASS / USER_APPROVED
- P11-B2-08 = USER_MODIFIED / USER_APPROVED
- PDM-11 Batch 3 = PASS / USER_APPROVED（P11-B3-01 用户修正版）
- PDM-11 Batch 4 = PASS / USER_APPROVED（P11-B4-01、P11-B4-02）
- PDM-11 Pre-Final Integrity = PASS / FINAL_CANDIDATE_READY

总控工作单：

> `07_重建工作区/PDM-13_Priority仲裁TTL与Lock边界_规则原子重建_工作版.md`

## 当前唯一下一步

> **继续 PDM-13 Batch 3｜后续明确新增 / 明确变更 / informed changes：以 P13-A01～A11、P13-B2-01～B2-05、5 条 HANDOFF_ACCEPTED 及 Completed-PDM Final 为硬约束，重新读取后续明确裁决，识别历史规则后来被明确改变或新增冻结的 Priority 语义。Priority 客户资格、Customer Level 关系、精确仲裁、TTL 默认数值/配置主体/续期、active Lock、Transaction、公海保护等若仍存在真实冲突或产品选择，必须留到 Batch 4，不得偷渡进 Batch 3。形成 Batch 3 候选后立即停下提交用户审查，不得自动批准，不得修改 IA / Low-Fi / Engineering。**

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

## PDM-11 启动硬门禁｜已通过

以下条件现已全部满足：

- PDM-01～PDM-10 全部 `INTEGRITY_PASS`；
- PDM-01～10 全局 Cross-PDM / Handoff / Global Invariant 总复核 PASS；
- MISSING_RULE_UNRESOLVED = 0；
- SEMANTIC_DETAIL_GAP_UNRESOLVED = 0；
- CROSS_PDM_CONFLICT = 0；
- HANDOFF_GAP_UNRESOLVED = 0；
- GLOBAL_INVARIANT_CONFLICT = 0；
- IMPLEMENTATION_READY = PASS。

## 当前禁止

- PDM-12 已最终批准并正式发布：`COMPLETE / INTEGRITY_PASS`；正式 Authority = `07_重建工作区/PDM-12_最终完整规则.md`；4 条 incoming handoff 已 CLOSED 并 source backwrite；
- 不把旧 PDM 的 `COMPLETE` 直接等同于通过当前新完整性标准；
- 不只检查 Final 文案而跳过原始证据遗漏扫描；
- 不把 PDM-01～10 全部推倒重做；只 reopen 真正有问题的 Atom / 段落；
- 不用聊天记忆替代仓库证据；
- 不在 PDM-01～25 产品规则阶段修改 IA / Low-Fi；发现冲突只登记 `STALE_CARRIER`、正确 Authority 与未来修正要求；
- IA / Low-Fi 集中对齐固定延后到 PDM-25 完成并通过 PDM-01～25 全局最终总复核之后；
- 不执行 Engineering Delta。

## Cross-PDM Handoff 强制读取

继续任何 PDM 前必须先读取：

> `07_重建工作区/CROSS_PDM_HANDOFF_REGISTER.md`

固定规则：

- 来源 PDM 产生 handoff → 登记 `HANDOFF_OPEN`；
- 目标 PDM 接收 → `HANDOFF_ACCEPTED`；
- 目标 PDM 完成 → `HANDOFF_CLOSED` 或 `HANDOFF_SUPERSEDED`；
- 目标关闭后同一次收口必须反向回写来源 PDM；
- 目标已 COMPLETE 但来源仍写“留后续” = `STALE_HANDOFF / SOURCE_BACKWRITE_PENDING`；
- 当前 PDM 作为目标时，只要 incoming handoff 未关闭，不得 COMPLETE / INTEGRITY_PASS。

当前 PDM-01～PDM-12 均已 `COMPLETE / INTEGRITY_PASS`。PDM-13 已接收 HO-P03-P13-001 / HO-P04-P13-001 / HO-P07-P13-001 / HO-P11-P13-001 / HO-P12-P13-001，当前均为 `HANDOFF_ACCEPTED`；Batch 1（P13-A01～P13-A11）已用户批准。上述 incoming handoff 在 PDM-13 Final / Integrity Gate 前不得直接关闭。当前进入 Batch 2 候选重建。

## PDM-25 后 Carrier 对齐硬顺序

```text
PDM-01～25 产品规则全部完成
→ PDM-01～25 全局 Cross-PDM / Handoff / Global Invariant 最终总复核
→ PDM-01～PDM-25 Final / Integrity 历史阶段尾巴统一清理与 Current / History 边界标注
→ IA 全局集中对齐
→ Low-Fi 全局集中对齐
→ Engineering / 施工
```

## PDM-25 后历史阶段尾巴统一收口

- PDM-11～25 期间不反复批量清理各 PDM Final / Integrity 报告中当时真实的阶段进度尾巴；
- 当前控制入口若出现 stale current pointer，仍必须立即修正；
- PDM-25 + PDM-01～25 全局最终总复核 PASS 后，一次性完成 Final / Integrity 的 Current / Historical Audit Trail 边界标注；
- 历史事实保留，不物理删除，不改变业务规则语义；
- 该统一清理完成后再进入 IA 全局集中对齐。
