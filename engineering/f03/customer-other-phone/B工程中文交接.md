# B 工程整改交接｜F03 客户其他联系电话管理

- 任务：`F03_CUSTOMER_OTHER_PHONE_MANAGE_HTTP_PG16_01`
- Issue：[#227](https://github.com/suzhe868-arch/mb/issues/227)
- PR：[#229](https://github.com/suzhe868-arch/mb/pull/229)
- 指定分支：`feat/f03-customer-other-phone-manage-http-pg16-01`
- 本轮性质：针对 A 首轮 `A_CHANGES_REQUESTED` 的原任务定向整改；不新开 Issue、不合并 main。
- 交接门槛：只有最新 HEAD 对应官方 Push Run 顶层及两个独立 PG16 Job 全部 `completed/success`、业务/HTTPS/旧 Guard/迁移/Node 回归全绿、Artifact ZIP 与内部 Manifest 可独立复算后，才可标记 `READY_FOR_A_REVIEW`。最终 HEAD/Run/Artifact ID/SHA-256 必须记录在同一最终 SHA 的 `evidence.json` 和本 PR 最新 B 交接评论中，不引用历史 Run。
- 事务锁序整改：删除 `employee_permission_overrides` / `role_permission_defaults` 全表写锁；避免在 `withSession` 已锁定账号后再锁 `employees FOR UPDATE`；按 Scope/Binding、角色默认、个人 override 的稳定行锁顺序复核权限。账号锁与现有 F03 员工/账号/权限写入路径配合，避免循环等待。
- 并发证据：个人 override、无 override 的 default allow、Scope 与 Capability-Scope Binding 均覆盖“撤权先提交”和“电话变更先取得锁并提交”两种顺序；通过 PostgreSQL `pg_stat_activity` 实际锁等待与 Promise 同步屏障证明竞争发生，检查事实、有效期和审计副作用。
- 现有权限路径：额外在同一真实 PG16 数据库中调用现有 `PublisherPhoneAdminService.change(DELETE)`，与持锁中的电话写入并发，验证无死锁、撤权审计和 Scope/Binding 关闭正确；只复用既有 CI-only schema，测试结束删除该临时 schema。
- 其他补齐：强制改密、凭据停用、未知员工角色、Scope 自身 ended、真实 NOT NULL INSERT 失败导致替换事务整体回滚、标准 `Forwarded` / 多类转发头 / 重复安全 Header / Content-Length 与 Transfer-Encoding 冲突。
- 严格边界：仅 `CI_ONLY_F03_CUSTOMER_PHONE_MANAGE`；不修改主要手机号、Customer Owner、公共 Schema、迁移、生产 `server.mjs`、PC/C/手机页面或外部系统。Issue #187 继续 `SOURCE_GAP/FAIL_CLOSED`。
