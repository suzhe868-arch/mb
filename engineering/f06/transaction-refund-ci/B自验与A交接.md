# F06-5A｜B工程交接（静态自验门禁，不等于CI结果）
- 工作分支：`feat/f06-5a-transaction-refund-pending-ci`；仅CI隔离合成Transaction退款pending/closed。
- 已签Authority：`07_重建工作区/F06-5A_A主控PDM19已取消Transaction合成Refund申请pending与无付款closed_CI隔离完整施工单_2026-10-14.md`。
- 本包禁止真实refunded/refund_payments写入、生产退款Issuer、生产身份和真实资金/上线。
- 新Source必须满足54/54真实PG16断言和本SHA父102真回归，HTTPS9/9；旧19组冻结、H52真实52项与两独立物理PG16 OID、旧184张父表全行Seal。
- 最终实际Run/Job/Artifact ID与sha256必须从GitHub官方接口收集，未完成前状态`B_IN_PROGRESS / CI_NOT_VERIFIED`。
- 生产缺口：`PRODUCTION_TRANSACTION_REFUND_CARRIER_SOURCE_GAP`、`PRODUCTION_TRANSACTION_REFUND_PERMISSION_SOURCE_GAP`，不能因CI侧证据而宣称生产可用。
- 全局：F05/F06/V1仍`NOT_READY`。B禁止合并main。
