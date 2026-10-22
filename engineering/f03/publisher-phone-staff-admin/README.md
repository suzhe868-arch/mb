# 员工批发电话专项权限管理｜F03/F04 隔离非生产实现

这是 Issue #221 的 **CI_ONLY_F03_PERMISSION_CONFIG** 技术交付，不是可部署的生产存储或 F07 的真正电话读取源。

## 入口和安全约束

- `engineering/src/f03-publisher-phone-admin-service.mjs`：复用真实 F03 Session、public 既有权限 / SG01 scope / history / audit，单库版本 CAS 与幂等；撤权保留既有个人 `deny` 并恢复 API 授权前的独立决策基线；关闭 binding/scope 时只匹配本 API 的 `publisher_phone_special + scope_reference_id=employee_id`，不会撤销 `object` 等其他 scope。
- 授权通过条件 UPSERT 保证并发提交的个人 `deny` 不会被覆盖；SG01 binding 必须满足 `granted_at <= transaction_timestamp()` 且未到期；员工角色仅允许正式 Guard 列表 `sales`、`manager`、`store_manager`，未知/旧别名 fail-closed。
- **员工生命周期失效（新增）**：每次显式授予时，在同一事务内保存当前员工 `employment_status/main_role_id/role_code/store_id` 快照和 `public.audit_events` 员工审计水位。后续 GET/PUT/DELETE 在持有员工行锁时检查水位后新增的 `object_kind='employee'` 审计事件及当前事实漂移；一旦发现复职、角色/门店资格变化、缺失快照或审计事实异常，就持久关闭模式、结束本 API 的 phone-special scope/binding、增加 CAS 版本、记录失效原因/审计，并保留个人 `deny`/既有 override。只有管理员读取新版本后再次显式 PUT 才能重新启用。该逻辑仅依赖当前 F03 SG06 已有的同库员工审计事实，不改 public schema、迁移或生命周期 Guard；缺失事实时 fail-closed。
- `engineering/src/f03-publisher-phone-admin-http.mjs`：GET/PUT/DELETE，安全 cookie，HTTPS 同源和写操作 CSRF；请求失败不输出 SQL 错误。
- `engineering/src/app.mjs` 的 `publisherPhoneAdminHandler` 为**可选显式注入**；默认 Node server 从未注入，因此仍返回 404。绝不开放真实电话。
- 仅官方精确 Push ref、独立一次性 PG16、非超级用户、合成数据、随机生成会话密钥、loopback 自签名 TLS、显式 consent 才可运行私有存储。
- 旧 F07 Guard 的模式与电话来源仍在另一个数据库，严禁把本服务的审计当作真实 F07 电话消费结果。

## 运行与验收

官方工作流 `.github/workflows/f03-publisher-phone-staff-admin-nonprod.yml` 独立运行业务/HTTPS 两套真实 PG16。两次隔离数据库从 F03-1→SG01 原迁移签名建立再应用私有 schema，不改 public 迁移。全部 Node 基础回归同作业运行。证据文件及 SHA256 清单来自 `evidence.mjs`。状态以官方 Run 最终结果为准。
