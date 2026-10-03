# 名邦汽车 V1｜下一步唯一动作

> 更新时间：2026-10-04

## 当前状态

- PDM-01 ～ PDM-09 = COMPLETE
- PDM-09 SOURCE_DECISION_COVERAGE = 100%（20/20）
- PDM-09 UNMAPPED = 0
- PDM-10 = READY_TO_START

## 当前唯一下一步

> **启动 PDM-10｜价格 / 查价 / 客户展示价覆盖 的业务基线重建。**

PDM-10 的正式覆盖对象至少包括：

- Price；
- Price Check；
- Customer Display Price Override；
- 001～078 的 M11 共 17 个价格相关归档单元；
- Recommendation 等其他域与价格 / 查价权益发生的跨域引用，只做边界映射，不提前重建其自身业务域。

执行顺序继续遵守当前冻结方法：

1. 先识别当前已实现 / 已测试的价格相关事实；
2. 读取 9/19 当前价格主底盘；
3. 向前扫描 CN11 / 更早历史，找完整定义、遗漏、废弃项；
4. 向后核对后续知情修改、IA V5、实际 Low-Fi；
5. 用 001～078 M11 作为反向差集雷达；
6. 先形成 PDM-10 Batch 1 稳定一致项给用户审查，不自动批准后续批次。

PDM-09 的 STALE_CARRIER 暂不在此阶段修改 IA / Low-Fi；进入统一 IA / Engineering 对齐阶段再按已确认规则清理。
