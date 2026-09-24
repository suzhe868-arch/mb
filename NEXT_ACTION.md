# 名邦汽车 V1｜下一步唯一动作

> 更新时间：2026-09-25

## 当前唯一优先动作

> **审查 PDM-01～PDM-07 反向覆盖校验当前剩余的 4 个补漏项。**

报告：

> `07_重建工作区/PDM-01至07_反向覆盖校验报告_2026-09-25.md`

## 当前结果

- PDM-01：PASS
- PDM-02：PASS
- PDM-03：PASS
- PDM-04：FAIL
- PDM-05：PASS_WITH_HANDOFF_GAP
- PDM-06：FAIL
- PDM-07：PASS

原始发现 5 项，其中“同 vehicle_id 转名邦后的 Favorite / Recommendation / 查价关系”已由用户明确关闭：同一车辆仅后台来源变化，客户侧关系原样继续。

当前剩余 4 项：

1. PDM-04 供应异常生命周期与人工 clear 冲突；
2. PDM-04 批量隐藏/恢复逐车结果与提交时重验；
3. PDM-05 → PDM-06 具体车型固定属性自动带出；
4. PDM-06 草稿列表/详情访问权限 Guard。

PDM-08 暂停，先把当前剩余 4 项收口到 `UNMAPPED=0`。
