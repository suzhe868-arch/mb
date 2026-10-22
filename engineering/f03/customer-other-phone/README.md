# F03 客户其他联系电话｜隔离非生产后端

任务包：F03_CUSTOMER_OTHER_PHONE_MANAGE_HTTP_PG16_01；Issue #227。

本目录只用于官方 GitHub Actions 的一次性 PostgreSQL 16 非超级用户测试环境。所有代码通过显式注入的 CI handler 执行；默认应用和生产 server 不注册这些路由。

## 接口合同

- GET /__ci__/f03/customers/:customerId/other-phones：读取当前有效事实，只返回 ID、生效时间与掩码号码。
- POST /__ci__/f03/customers/:customerId/other-phones：新增其他联系电话，号码在请求体，幂等键通过 Idempotency-Key Header 传入。
- POST /__ci__/f03/customers/:customerId/other-phones/:phoneFactId/replace：结束旧事实并新增替代事实。
- POST /__ci__/f03/customers/:customerId/other-phones/:phoneFactId/end：结束指定事实。

写操作要求同源 HTTPS、有效 PC 会话、CSRF 与 Idempotency-Key。请求体只接受明确白名单字段。明文号码仅在请求处理期间存在，存储使用 AES-256-GCM 版本化 envelope；响应、审计与错误不含明文或 ciphertext。

## 原子性与权限

复用现有 customer.phone.manage、个人 deny 优先级、当前 active Customer 和显式 object scope。Guard、电话事实变化、有效期历史与 append-only audit_events 在同一 PG16 事务提交。使用事务级客户锁、权限事实锁和审计内幂等键摘要，处理并发重复与撤权。审计失败时整体回滚。禁止物理删除历史电话事实。

不新增 public Schema、迁移、索引或私有 schema；不改主要手机号、Customer Owner、客户身份，不接生产、PC/C/手机页面、JYT/Collector/CDN/OSS/飞书或资金系统。

## 运行条件

仅接受指定分支的官方 push workflow、CI/GITHUB_ACTIONS/NODE_ENV/APP_ENV=test、精确 PG16 本地数据库目标、运行 ID seal 与显式 consent。测试密钥由 workflow 在每个 Job 内运行时生成，不写入文件、日志或 Artifact。
