# B 工程交接｜F03 客户其他联系电话管理

- 任务：F03_CUSTOMER_OTHER_PHONE_MANAGE_HTTP_PG16_01
- Issue：#227
- 指定分支：feat/f03-customer-other-phone-manage-http-pg16-01
- 交接状态：等待本分支最终 SHA 官方 CI 和 Artifact 复核；未通过前不得标记 READY_FOR_A_REVIEW。
- 性质：CI_ONLY_F03_CUSTOMER_PHONE_MANAGE，真实 PostgreSQL 16 非超级用户与 loopback HTTPS；不是生产能力。
- 实现边界：其他联系电话事实新增、读取掩码、替换、失效；同事务权限/Scope 重验、AES-256-GCM、有效期历史、append-only 审计与幂等。
- 禁止事项：主要手机号变更、公共 Schema 变化、生产路由、客户端 UI、外部系统或资金操作。
- 官方 Run / HEAD / 测试计数 / Artifact SHA256：待最终 SHA workflow 完成后填写。
