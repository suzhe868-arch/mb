# 名邦汽车 V1｜下一步唯一动作

> 更新时间：2026-10-03

## 当前状态

PDM-01～PDM-07：

> **COMPLETE / REVERSE_COVERAGE_UNMAPPED = 0**

PDM-08 已完成 2026-10-03 CDN 架构新裁决及第一轮跨模块冲突扫描。

跨模块结果：

- PDM-04：兼容；图片转换必须按同 vehicle_id 资产化重写；
- PDM-06：兼容；0 图发布不变，自上传图直接对象存储；
- PDM-07：兼容但必须保留档案/报告客户可见性 Guard，报告图不自动进入车辆相册；
- PDM-13/14：图片 URL 不得绕过 hidden / Priority / Recommendation 可见性；
- PDM-20：4:3 轮播、分享主图与当前新架构兼容；
- PDM-22/25：域名、源站、缓存、审计等配置后续承接。

原 P08-A01～A13：

> **SUPERSEDED_PENDING_REBUILD**

不再按原清单继续审批。

## 当前唯一下一步

> **把 IMG-001～IMG-030 逐条重新映射到 2026-10-03 新 CDN / 对象存储架构。**

每条必须标为：

- RETAIN；
- MODIFIED；
- SUPERSEDED；
- ENGINEERING_ONLY；
- DEFERRED；
- NEEDS_DECISION。

完成后重新生成 PDM-08 新 Batch 1，并继续保持：

> **SOURCE_DECISION_COVERAGE = 100%**
> **UNMAPPED = 0**
