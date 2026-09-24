# 名邦汽车 V1｜下一步唯一动作

> 更新时间：2026-09-24

## 当前唯一优先动作

> **展示并审查 PDM-04｜Batch 1 十四条稳定一致项。**

## 当前状态

- PDM-01：`COMPLETE`
- PDM-02：`COMPLETE`
- PDM-03：`COMPLETE`
- PDM-04：`USER_REVIEW_BATCH_1_PENDING`

工作版：

> `07_重建工作区/PDM-04_三类车源JYT同步车辆身份ListingCycle隐藏下架重上架一键转名邦_规则原子重建_工作版.md`

## 本批边界

本批只审 P04-A01～P04-A14 稳定一致项。

以下明确不混入 Batch 1：

- 人工名邦/4S `source_type` 后续双向修改；
- 采集批发车自动隐藏规则；
- 一键转名邦后的新名邦展示状态冲突；
- 一键转名邦具体 permission；
- 图片、价格等其他 PDM 的详细规则。

用户确认本批后才允许进入 Batch 2。

当前仍不修改 IA / Low-Fi / Engineering。
