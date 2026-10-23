# F03 客户账号停用恢复与 Demand 原子暂停

任务：Issue #235；`CI_ONLY_F03_CUSTOMER_ACCOUNT_STATUS`；仅官方指定分支的隔离 PostgreSQL 16 非超级用户测试库。

业务要求：System Admin 控制平面、名邦员工当前能力及显式 Customer object Scope、4S 硬拒绝；在现有 F03 登录会话事务中锁定 Customer，依固定顺序锁定 Demand，active→paused 与账号 inactive 同步提交，恢复只变更账号为 active、不重新激活业务。保持历史与资金原样。幂等键在既有 public.audit_events 中记录 SHA-256、当前操作者和动作 payload 摘要，不另建数据库 Schema，审计只保存脱敏摘要。

入口必须通过显式注入：`GET /__ci__/f03/customer-account-status/:customerId`、`POST /__ci__/f03/customer-account-status/:customerId/disable|restore`；要求 localhost TLS、同源、有效 Cookie、CSRF、请求键、严格 JSON。默认生产 server 没有 handler 注入。

**硬边界**：旧 F03/F05/F06/F07 服务、公共迁移/DDL、旧工作流和所有 PC/手机页面冻结。F05 Demand 激活原有 Customer 锁的可验证行为仅作受影响证据；未正式接线的其他业务域明确 NOT_CONNECTED。Issue #187 持续 SOURCE_GAP/FAIL_CLOSED，F06/F07/F08/V1 NOT_READY/NO_PRODUCTION。
