# 名邦汽车 V1｜F03-1-G0 会话安全合同（只设计不施工）

Authority：PDM-02 §§4/6/9/12、PDM-22 §§2/3、PDM-25 审计、F03-G0 已验收 `identity-session-contract.md`。

## 候选服务端会话模型

- 服务端产生不少于 32 字节 CSPRNG 随机 **opaque** 会话秘密。仅发送给对应浏览器；持久存储**密钥化摘要**（如 HMAC-SHA-256 `token_digest`，服务端密钥在 Secret Manager，不在数据库或客户端），绝不存明文 token/密码，且不得在日志/工件输出。对等值查找用唯一索引，不支持从摘要恢复令牌。
- 建议响应 `Set-Cookie: __Host-mb_pc=<opaque>; Secure; HttpOnly; Path=/; SameSite=Lax`，不设置 `Domain`。部署同源部署条件未确认时必须调整策略并由 A 审查；跨站部署可能需其他架构、CSRF 约束且严禁直接调低防护上线。Cookie 不得泄漏到 URL、LocalStorage 或跨域第三方。
- 变更状态的请求除 SameSite 外还要 CSRF token/Origin 与可信 Host 校验，防跨站提交；TLS/HSTS、可信代理头及反向代理域名由后续运行适配负责。
- 候选期限供 A 审核：受限改密会话绝对 10 分钟、普通空闲 30 分钟 / 绝对 12 小时，定期会话轮换；服务端 `expires_at`、撤销标识与最后活动时间是权威。具体超时与轮换原子性尚未实装。
- 每次敏感操作重新校验 `pc_login_accounts.credential_state`、`credential_epoch`、`force_password_change`、主 Employee/System Admin active、4S 当前 PC 资格、有效 session 未撤销未过期，以及 F03 决策层当前 capability/scope/object state；只有通过“会话门禁”仍**不**代表业务授权已经通过。
- 不能用 JWT 中的历史角色、主门店、权限或数据范围作为当前授权。单一真人 Employee 与 System Admin 的会话必须完全隔离；`principal_kind` XOR 不从 cookie 中取信任值。
- 首次登录强制改密：受限会话明确标识 `restricted=true`，仅允许 `SELF_CHANGE_PASSWORD` / `LOGOUT`；任何数据读取、治理及业务敏感查询均拒绝。改密后所有旧会话失效，重新认证才能获得普通会话。
- 本人改密、重置、停用、凭证更新、主体 inactive 或失去 4S PC 资格：提升凭证世代并撤销历史会话。复职/重新启用不能使旧令牌复活；旧权限也不能复活。禁止在旧 epoch 上直接重新激活。
- 限速与匿名错误：错误账号、错误密码、禁用账号、失效会话等对外使用不泄露账号存在性的通用响应；HTTP 状态/安全事件码及机器审计分离。严禁在 token、密码、hash、Cookie、CSRF 令牌、访问日志中输出真实秘密。
- 审计最小内容：`actor_kind`、真实主体引用、时间、前后状态（脱敏）、操作类别、撤销原因类别与结果，写入 PDM-25 `audit_events`；对账号治理需能追溯操作者而不能仅记录被操作目标。禁止历史事件伪改，也不能把敏感的 before/after 原文 JSON 直接对外展示。

## 会话真相 / 登录适配责任

| 场景 | 必须满足的运行事实 | 此阶段可证明 | 下一阶段 |
|---|---|---|---|
| 登录密码证明 | 服务端查唯一规范化账号、可信哈希校验、限速、匿名错误 | scrypt 可用性与方案成本；状态模型合成判定 | F03-1 实现批 |
| 初始成功需改密 | 受限、不能查询和业务操作 | 纯状态函数拒绝 | F03-1 实现批 |
| 改密/重置/禁用 | 世代提升、同一事务撤销旧 session 与追加审计 | 合成效果列表 | F03-1 实现批 |
| Employee/System Admin 失效 | 旧会话立即拒绝，不因复职复活 | 合成当前事实检查 | F03-1 实现批＋F03-2 并发验证 |
| 4S 当前 PC 资格 | 无资格立即禁止 PC；有资格仍只管自己的 4S 车 | 假数据拒绝 | F03-1 实现批＋F03-2 动态权限 |
| 跨站和 Cookie | Secure/HttpOnly/SameSite/Origin/CSRF/TLS | 文档设计 | F03-1 正式 HTTP 适配 |
| 会话轮换/竞态 | 更新账号与会话版本的原子性、索引与超时 | `schema-delta.tsv` 方案检查 | 后续批准隔离 PG16 |

**此文档本身不构成真实登录、认证、会话库或数据库事务的实现。**
