# 名邦汽车 V1｜下一步唯一动作

> 更新时间：2026-10-04

## 当前状态

- PDM-01 ～ PDM-10 = COMPLETE
- PDM-10 Final = USER_APPROVED / REPO_WRITTEN
- PDM-10 Source Decision Coverage = 100%
- PDM-10 UNMAPPED = 0
- PDM-10 Final→Source Traceability = 100%
- PDM-10 Semantic Integrity = PASS
- 当前准备域：PDM-11｜找车申请 / 正式 Demand / 暂停 / 完成 / 取消
- PDM-11 = NOT_STARTED

PDM-10 正式规则：

> `07_重建工作区/PDM-10_最终完整规则.md`

PDM-10 完整性检查：

> `07_重建工作区/PDM-10_信息保真与一次性收口检查卡_2026-10-04.md`

## 当前方法硬门禁

PDM-11 开始前必须依次执行：

1. Memory Zero-Trust；
2. Current Authority Refresh；
3. 读取所有指向 PDM-11 的 deferred handoff；
4. Completed-PDM Dependency Card；
5. Global Invariant Scan；
6. Terminology Normalization；
7. Current Implementation Fact（如存在）；
8. 全历史 / Current / IA / Low-Fi / Radar / Delta 证据扫描；
9. Source↔Final Traceability 草表；
10. Conflict Matrix；
11. 最后才形成 Batch 1。

强制模板：

> `07_重建工作区/PDM_信息保真与一次性收口检查模板.md`

## 当前唯一下一步

> **准备 PDM-11：先建立当前 Authority / Completed-PDM Dependency Card 与指向 Demand 域的 handoff 清单，再形成 Batch 1 稳定一致候选。**

## 当前禁止

- 不自动批准 PDM-11 任何 Atom；
- 不跳过前序 PDM 依赖卡；
- 不用聊天记忆代替仓库证据；
- 不修改 IA / Low-Fi；
- 不执行 Engineering Delta；
- 后续 PDM 不得静默推翻 PDM-10 的价格 / 查价 / 覆盖 / quota / permission 边界。
