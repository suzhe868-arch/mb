# F03-1-G0｜拟议结构差异的原子迁移与失败恢复（不执行）

## 冻结基础事实

本文件只读核对最新 main 已验收 F02-1 `engineering/f02-g0/field-matrix.tsv` 与 `field-freeze-candidates.tsv`，以及 `engineering/f02-1/compile-current.mjs` 编译产物。包含 `pc_login_accounts` **10 字段**、`employees` **6 字段**、`system_admins` **5 字段**、`audit_events` **10 字段**；其中旧 `system_admins.login_account` 和 `credential_hash` 明确 EXCLUDE，禁止“补回”成为第二凭证。

现有 `pc_login_accounts` 已有规范化登录名、两个互斥 principal ID、密码哈希唯一权威、`credential_state` 与 `force_password_change`，另有创建/更新时间。已有 `audit_events` 通用追加历史表可承接匿名化审计，不再新增第二业务审计权威。

## 精确提案：仅未来新增独立迁移

以 `schema-delta.tsv` 为全量逐列台账：现有 31 个字段绝不修改；新增 `pc_login_accounts.credential_epoch BIGINT NOT NULL DEFAULT 1 CHECK > 0`（过渡阶段先添加默认值并校验，数据库大表写入/锁影响需 A 评估）。新建唯一 `pc_auth_sessions` 作为运行时撤销真相：`session_id`、`account_id`、`token_digest`（HMAC-SHA-256 keyed digest，32B）、`credential_epoch`、`issued_at`、`expires_at`、`revoked_at`、`last_seen_at`、`restricted`；严格关联单一 PC Account。只在新的经批准 schema version 加表和字段，不修改原 `000001_current_initial`、checksum、结构签名或历史 F02 迁移登记。

必须由后续实施批明确并测试的约束：
- `pc_auth_sessions.session_id` PK identity、`account_id` 非空 FK（禁止删除 PC 账号本体绕过历史）、`token_digest` UNIQUE 且 32 字节、`credential_epoch>0`、`expires_at>issued_at`、`restricted NOT NULL`。
- 会话失效查询索引 `(account_id,expires_at)`，过期清理索引 `(expires_at)`；session token 摘要的唯一索引不等于密码哈希第二权威。
- `account_id` 关联 PC 凭证，而非复制 System Admin/Employee 的账户或密码。会话 principal_kind/ID 在读取时从唯一账号连接可信当期主体映射；不把客户端旧 claim 当授权。
- 密码写入、`credential_epoch` 自增、`force_password_change` 更新、会话撤销、脱敏 `audit_events` 追加必须具有事务一致性和并发冲突守卫。需保证同一账号重置和本人改密竞态不会双成功或复活旧会话。
- 既有 `audit_events.before_json/after_json` 只能承载状态类别、版本和已脱敏摘要元数据，不得记录密码、完整密码哈希、明文 token、keyed digest 原值、密钥或被隐藏敏感字段。
- 受限改密会话的新 token 与正常会话不能共用旧身份、未经授权的管理资格；失效会话保留最小审计所需事实，清理策略需符合审计保留约束。

## 未来批准实施的原子切换建议

1. **前置**：A 批准精确独立版本编号/ checksum / 数据库隔离目标；再次检查当前 F02-1 冻结 fingerprint；已迁或业务生产库路径不得复用“新装空库”门禁。
2. **DDL**：在受控迁移器、advisory lock、单事务中添加字段、建新表和完整约束/索引，最后写新版本 metadata；应用失败整事务回滚。禁止在脚本中使用危险 DROP CASCADE 或隐式清表。
3. **应用兼容**：登录与会话功能独立部署门禁，先确保已迁结构版本满足最低要求，未满足拒绝启动认证入口，不靠 nullable 缺口绕行；不读取旧 Token 快照取得权限。
4. **运行切换**：同账号敏感变更条件更新 `credential_epoch=credential_epoch+1` 并使旧会话无法再授权，写审计，读操作每次查当期版本。必要时显式标记 revoked_at；不能只异步清理撤销。
5. **并发**：验证登录/重置、初始改密/停用、员工状态变化/会话判定竞态；锁及约束必须证明只有合法当期会话可用。
6. **恢复**：新迁移失败由单事务自动回滚到先前版本；已提交后遇部署失败须保持新结构并停用登录入口，另起受控前滚修复/经审批补偿迁移，不能回写或删改已验收 F02-1 Initial DDL/checksum。
7. **测试**：只有以后独立授权时才在一次性隔离 PG16 空库运行真实 DDL、并发、迁移幂等/失败恢复；本批仅静态读取生成 SQL 与冻结矩阵，绝不连接 PostgreSQL。

风险：认证刷新竞态、密钥轮换、会话 TTL/清理规模、Token 摘要查找性能与泄密事件响应，均未用真实基础设施核实；A 必须裁定后放行实施。
