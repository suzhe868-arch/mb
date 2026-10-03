# 名邦汽车 V1｜下一步唯一动作

> 更新时间：2026-10-04

## 当前状态

PDM-09：

- Batch 1 = COMPLETE_USER_CONFIRMED
- Batch 2 = COMPLETE_USER_CONFIRMED
- Batch 3 = COMPLETE_USER_CONFIRMED
- Batch 4 = USER_REVIEW_PENDING
- 方法规范已新增“CURRENT_IMPLEMENTED_FACT 优先识别”硬规则
- PDM-09 = IN_PROGRESS

## 当前唯一下一步

> **在继续审 P09-B4-01～P09-B4-06 前，先按新规则复核电话 API 当前已实现 / 已测试事实，并检查已确认的 P09-A04、P09-A11 及待审 P09-B4-04 是否受到旧中间方案污染。**

要求：

1. 建立 PDM-09 当前实现事实卡；
2. 明确谁提供 API、谁调用 API、电话数据实际流向；
3. 区分已实现测试方案与历史推荐/中间方案；
4. 如已确认 Atom 需要修正，必须显式重新提交用户审查，不得静默改写；
5. 完成复核后再继续 Batch 4。

当前禁止：

- 不得直接按旧 B4-04 继续裁决；
- 不得静默修改 P09-A04 / P09-A11；
- 不修改 IA / Low-Fi / Engineering；
- 不进入 PDM-10。
