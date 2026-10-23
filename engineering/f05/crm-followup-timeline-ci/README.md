# F05 CRM Follow-up 时间线分页读取｜Issue #243

范围：仅 `CI_ONLY_F05_CRM_FOLLOWUP_TIMELINE_LIST`、独立真实非超级用户 PostgreSQL 16、localhost TLS。已有 Issue #239 的追加/按 ID 读取、F03 PC 会话、Current Customer 身份/对象 Scope/assigned owner 和独立权限检查代码原样复用。原合成 `crm.followup.create` 只是 CI 技术别名；并非正式生产 Reader 或 Writer Issuer。

列表 GET：`/__ci__/f05/crm-followups/:customerId?limit=20&beforeFollowupId=...`；最多 50，整数不允许前导 0，游标为严格正 BIGINT；没有查询时默认 20。严格 `WHERE customer_id`、`followup_id DESC` 和 exclusive keyset，`limit+1` 决定 `hasMore`；不返回总量。输出白名单仅历史跟进事实与过滤后的 source.kind/reference。老记录 source_context_json 的未知字段、凭据、个人信息不回传。

列表只读，无新审计写入、无客户负责人/Demand/Consultation 状态变更。两种旧 HTTP 动作继续拒绝 query。TLS 必须本地、同源、有效 Cookie、列表 CSRF、Header 防转发/重复、GET 不带 Body。默认 server 未注入，404。

历史回归必须在**本次最后业务 SHA** 双 PG16 Job 重跑原 #239 业务 40、HTTPS 14、客户状态 4、SG01 Scope 及 Node 回归。旧 #235 专用分支封印测试不伪造跨分支重放。A 须独立复核最终 ZIP 和 SHA256 清单。

**阻断**：正式 CRM 只读/写入 Issuer、CRM correction/void、F07 完整 Runtime 未接；父 Issue #187 为 SOURCE_GAP/FAIL_CLOSED；F06/F07/F08/V1 NOT_READY/NO_PRODUCTION；没有外部资金、手机号、JYT/Collector/CDN/OSS/Feishu 或生产授权。
