# 名邦汽车 V1｜下一步唯一动作

> 更新时间：2026-09-24

## 当前唯一优先动作

> **继续审查 PDM-04｜Batch 4 剩余四条冲突 / 遗漏 / 缺口 / 新选择。**

## 当前状态

- PDM-01：`COMPLETE`
- PDM-02：`COMPLETE`
- PDM-03：`COMPLETE`
- PDM-04 Batch 1：`COMPLETE_USER_CONFIRMED`
- PDM-04 Batch 2：`COMPLETE_USER_CONFIRMED`
- PDM-04 Batch 3：`COMPLETE_USER_CONFIRMED`
- PDM-04 Batch 4：`PARTIAL_USER_CONFIRMED`

工作版：

> `07_重建工作区/PDM-04_三类车源JYT同步车辆身份ListingCycle隐藏下架重上架一键转名邦_规则原子重建_工作版.md`

## Batch 4 当前状态

已确认：

- P04-B4-02｜转换前 hidden 的处理：按新 source_type 与隐藏规则 source_scope 重新计算；人工 hidden 与其他有效 hidden 原因继续保留。

剩余待审：

1. P04-B4-01｜同 vehicle 转名邦是否继续当前 listing_cycle；
2. P04-B4-03｜trading/completed 是否允许转换；
3. P04-B4-04｜JYT 复用 car_code 给另一真实车的处理；
4. P04-B4-05｜一键转名邦是否单向不可转回批发。

剩余四条全部确认后才允许生成 PDM-04 最终完整规则总览。

当前仍不修改 IA / Low-Fi / Engineering。
