# 名邦汽车 V1｜下一步唯一动作

> 更新时间：2026-09-24

## 当前唯一优先动作

> **审查 PDM-05｜Batch 1 稳定一致项 P05-A01～P05-A09。**

工作版：

> `07_重建工作区/PDM-05_车型主数据年款JYT车型映射MODEL_MISSING_规则原子重建_工作版.md`

## 当前状态

- PDM-01：`COMPLETE`
- PDM-02：`COMPLETE`
- PDM-03：`COMPLETE`
- PDM-04：`COMPLETE`
- PDM-05 Batch 1：`USER_REVIEW_PENDING`

## PDM-05 Batch 1 待审

1. P05-A01｜车型主数据为品牌→车系→具体车型，年款不是第四级实体；
2. P05-A02｜车型年款与首次上牌/登记时间严格分离；
3. P05-A03｜完整车型名完全一致自动映射，不完全一致不做模糊猜测；
4. P05-A04｜同一 upstream_model_id 只生成一条待确认任务，确认一次批量复用；
5. P05-A05｜本地车型映射不得反向覆盖 JYT 原始车型事实；
6. P05-A06｜已确认映射发生明显冲突时不得静默改映射，进入车型映射冲突处理；
7. P05-A07｜车型主档/映射/冲突变更受 vehicle.model.manage 控制；
8. P05-A08｜名邦/4S 人工车正式发布前必须绑定有效本地 vehicle_model_id；普通销售缺车型可保留草稿但不能绕过发布；
9. P05-A09｜人工映射确认/修正至少审计 actor/time/old/new，不强制原因。

用户确认本批后，才允许准备 Batch 2。

当前仍不修改 IA / Low-Fi / Engineering。
