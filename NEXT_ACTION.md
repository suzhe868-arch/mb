# 名邦汽车 V1｜下一步唯一动作

> 更新时间：2026-09-25

## 当前状态

PDM-01～PDM-07 反向覆盖已完成：

> **REVERSE_COVERAGE_UNMAPPED = 0**

PDM-08 已建立 IMG-001～IMG-030 原始 Decision 逐条覆盖账：

> **当前挂账 UNMAPPED = 0**

注意：这里只表示每条历史 Decision 已有明确去向，不代表用户已经批准。

## 当前唯一下一步

> **审查 PDM-08 Batch 1｜P08-A01～P08-A13。**

本批涵盖：

- 首次 images[] 冻结；
- 首图本地化 / fallback / 占位图；
- JYT upstream_url + 名邦受控 HTTPS/CDN 转链；
- 真实查看 / 预加载时按需本地化；
- 2/3/4 + 前方约2张预加载；
- storage + DB 双成功定义；
- 本地优先 / 404受控自愈；
- 单图重试轮次与失败图原位恢复；
- same-image single-flight / 单车并发3；
- 上下架 / listing_cycle 不重置图片资产；
- 人工名邦 / 4S 0图、增删排序；
- 不设置产品级固定图片数量/大小/格式上限；
- 图片权限继承 Vehicle，URL 不得绕权。

Batch 2～4 预登记内容不自动视为已批准。
