# 名邦汽车 V1｜B 工程 Issue #221 中文交接报告

> 任务：`F03_F04_PUBLISHER_PHONE_STAFF_PERMISSION_ADMIN_HTTP_PG16_01`
> 工程分支：`feat/f03-f04-publisher-phone-staff-admin-http-pg16-01`
> PR：[ #224 ](https://github.com/suzhe868-arch/mb/pull/224)；Issue：[ #221 ](https://github.com/suzhe868-arch/mb/issues/221)
> 最新主线同步：`main@fe758588fc08b3ea61f416962c3c28a2468e8897` 已作为第二父提交合并进原 B 分支；同步提交 `34b4179495d57d187787d3d05998b02721036817`。业务仍在原分支，不合并 main。
> **当前状态：`B_IN_PROGRESS`。** A 补充审查第五项生命周期阻断后，B 已在原分支实现审计水位、授权时身份快照和持久 fail-closed 撤权，并增加真实 PG16 复职/角色恢复/缺失基线测试。当前新 SHA 的官方 CI 与 Artifact 尚待运行；在最终 HEAD 的两个官方 Push Job 成功、两份非空 Artifact 同 SHA、内部 SHA-256 清单完整之前，不得标记 `READY_FOR_A_REVIEW`。本报告后续结果必须更新为最终真实 Run/Artifact；本文件不代替 A 独立验收签字。

## 一、已实现的真实后端功能

- GET `/api/pc/employees/:employeeId/publisher-phone-permission`：现时管理员身份、员工角色/在职/账号、既有权限能力、同库授权状态、scopeMode、version、ETag；不返回电话、客户资料、Collector 缓存。
- PUT：仅既有 `publisher.phone.sensitive`，模式只能 `LOCKED_ONLY` 或 `ALL_ACTIVE_JYT`；使用真实 F03 正常 Session、严格 HTTPS/Origin/CSRF 与完整 JSON DTO 校验。
- DELETE：当前同库覆盖、SG01 capability scope binding、私有测试模式、history/audit 同事务撤权，下一次本库 GET 立即可见。
- PG16 原子单库事务：全程复用 `IsolatedAuth.withSession`；System Admin 现时行锁、目标员工行锁、CAS `expectedVersion`、请求键防重、审计 before/after 与重放凭据均同库。注入异常整个事务回滚。
- 不修改 F03 既有迁移/权限目录结构、不修改 F07 既有 Guard、不注册默认生产写入路由。完整合法隔离 CI 来源 `CI_ONLY_F03_PERMISSION_CONFIG`，不伪装正式电话消费来源。

## 二、证据与已知结果

- 历史 Run #39810550189 仅验证上一 SHA `24fbf90e53ce016474b2cb6adb19ca438f12a4ca` 的四项整改；**不能代替本轮新增生命周期整改的最终 SHA**。
- 已实现并保留的前四项：撤权保留个人 `deny` 并恢复独立 `allow`、条件 UPSERT 防并发 `deny` 覆盖、SG01 `granted_at` 时效、正式角色白名单。
- **第五项生命周期修复**：显式授予时记录同一 PG16 中最新员工审计 `audit_id` 水位及在职/主角色/角色码/门店快照。员工行锁与现有 F03 SG06 审计事务串行；后续任何 `object_kind='employee'` 审计事件晚于授予水位，或当前员工事实与授权快照不符/快照缺失，均在 GET/变更事务内持久关闭模式、结束本 API 专项 binding/scope、递增版本并写入失效审计。个人 override/deny 不被删除。只有读取新版本后由合格 System Admin 显式 PUT 才能重新启用。
- 业务专项矩阵扩展至 41 项，HTTPS 仍 22 项；新增真实 PG16：inactive→active（中间不调用电话 API）、4S/不合格角色失效后恢复、授予基线缺失三类负例。是否通过只认本轮最终 HEAD 的官方 Push CI 和两份 Artifact。
- 官方 CI 任务限定精确 B 分支、主线差异路径白名单、语法/路径双门禁、实际非超管 PG16 物理身份、合成 127.0.0.1 HTTPS、内部 SHA256 清单和默认服务安全回归。
- 任何失败或排队均 `NOT_READY_FOR_A_REVIEW`，B 不得声称通过。

## 三、未解除的原阶段阻断

- Issue #187：`SOURCE_GAP/FAIL_CLOSED`；正式 JYT/Collector/CDN/OSS/飞书未准备、正式权限/签名来源未获闭环。
- 本包模式是 F03 同 DB 私有 CI 能力，原 F07 隔离 DB 未消费：`NOT_CONNECTED_F07_RUNTIME`；真实取号/拨号 `NOT_AUTHORIZED`。
- F05→F06 同车签名 Lock/Transaction/Deposit `NOT_RUN/BLOCKED_SIGNED_PARENT`。
- F06/F07/F08/V1 整体 `NOT_READY/NO_PRODUCTION`；无 PC/手机页面、客户数据、真钱、正式发布权限。

## 四、A 独立验收关注项

1. 先核对 PR #224 HEAD、最终 Push workflow Run、2/2 非超管 PG16 Job 与 2 份非空 Artifact 的 ref/SHA/run/id、内部文件 SHA256，不能以首轮结果替代。
2. 重跑允许的业务/HTTPS、负例、完整基础 Node 回归；注意双管理员 CAS、管理员停用事务锁、个人 deny、回滚及结构签名保护。
3. 检查改动仅限 Issue #221 白名单，F07 仍未同源连接、公共 schema 与旧 workflow 未动。
4. 专项核对预存 allow 的恢复、已有 deny 经 DELETE 后仍存在、两个独立 PG16 事务的 deny 竞态、未来 granted_at、store_head 拒绝、inactive→active 后旧授权不复活、4S/未知角色恢复后旧授权不复活、缺失授权基线 fail-closed，以及实际审计 after_json 与数据库最终决策一致。仅通过 A 独立验收后按仓库流程合并。B 不合并 main、不推进 Issue #196 PC 页面、不自行关闭 #187。
