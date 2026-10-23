# F05 CRM Follow-up append-only HTTP / PG16（Issue #239）

仅可销毁 PostgreSQL 16 非超级用户 CI 环境 + localhost TLS。全部权限与主线 Source/Issuer 必须区分：`crm.followup.create` 是 CI-only 合成技术别名，不代表正式生产权限签名。

**业务**：仅按当前真实 F03 会话、Employee 活动状态、名邦角色、个人 deny/角色权、Current Customer object scope 和当前 owner/同店 manager/显式有效 Collaboration 验证，Customer 必须 active；4S 和 System Admin hard deny。合法目标 `public.crm_followups` 只能 INSERT，绝无 UPDATE/DELETE。可选 Demand 须同 Customer；责任人取锁定后的当前业务 owner，不因追加改变 owner 或 Demand、Consultation 状态。使用既有 `public.audit_events` 同事务审计，锁序与全局 RequestKey 摘要防重放。无独立 public schema/DDL。

**路由**：仅显式注入 `POST /__ci__/f05/crm-followups/:customerId`，受控读取 `GET /__ci__/f05/crm-followups/:customerId/:followupId`。TLS 本地、Cookie、同源 Origin/Host、CSRF、严格 JSON/body、request key、转发及重复敏感头拒绝；`server.mjs` 不注入。

**限制**：原冻结结构缺少正式更正事实关联证明，`correction/void=NOT_CONNECTED`，不能修改历史正文/操作者/时间。普通 Follow-up 不是 Consultation SLA first response。此包不验证生产 F05/F07 Domain 接线、正式 CRM permission Source Issuer，均 `PRODUCTION_NOT_CONNECTED_SOURCE_GAP`。父 Issue #187=`SOURCE_GAP/FAIL_CLOSED`；F06/F07/F08/V1=`NOT_READY/NO_PRODUCTION`。
