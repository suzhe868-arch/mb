# 名邦汽车 V1｜下一步唯一动作

> 更新时间：2026-09-24

## 当前唯一优先动作

> **审查 PDM-04｜Batch 3 的 P04-A17～P04-A20。**

## 当前状态

- PDM-01：`COMPLETE`
- PDM-02：`COMPLETE`
- PDM-03：`COMPLETE`
- PDM-04 Batch 1：`COMPLETE_USER_CONFIRMED`
- PDM-04 Batch 2：`COMPLETE_USER_CONFIRMED`
- PDM-04 Batch 3：`USER_REVIEW_PENDING`

已提前确认：
- P04-A15｜同 `vehicle_id` 批发→名邦来源转换；
- P04-A16｜locked 批发车允许直接转名邦。

本轮待审：
- P04-A17｜名邦↔4S `source_type` 后续修改；
- P04-A18｜采集批发车自动隐藏规则；
- P04-A19｜转名邦成功后直接进入名邦可售，不走草稿二次发布；
- P04-A20｜普通名邦销售一键转名邦不设额外独立 permission。

确认后才允许进入 Batch 4。

当前仍不修改 IA / Low-Fi / Engineering。
