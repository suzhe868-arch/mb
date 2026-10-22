# 名邦汽车 V1｜B 工程 Issue #221 中文交接报告

> 任务：`F03_F04_PUBLISHER_PHONE_STAFF_PERMISSION_ADMIN_HTTP_PG16_01`
> 工程分支：`feat/f03-f04-publisher-phone-staff-admin-http-pg16-01`
> PR：[ #224 ](https://github.com/suzhe868-arch/mb/pull/224)；Issue：[ #221 ](https://github.com/suzhe868-arch/mb/issues/221)
> 基线：`main@23b5e84cc28fd38756a815824abaee5310eed3f3`
> **交接标记：PENDING_FINAL_SHA_CI**。本文件随最终代码提交，只有最终精确 HEAD 官方 Push CI 两 Job 全通过、Artifact 完整后，才由 B 在 PR 说明中标记 `READY_FOR_A_REVIEW`，交 A 独立验收。本文件本身不冒充验收签字。

## 一、已实现的真实后端功能

- GET `/api/pc/employees/:employeeId/publisher-phone-permission`：现时管理员身份、员工角色/在职/账号、既有权限能力、同库授权状态、scopeMode、version、ETag；不返回电话、客户资料、Collector 缓存。
- PUT：仅既有 `publisher.phone.sensitive`，模式只能 `LOCKED_ONLY` 或 `ALL_ACTIVE_JYT`；使用真实 F03 正常 Session、严格 HTTPS/Origin/CSRF 与完整 JSON DTO 校验。
- DELETE：当前同库覆盖、SG01 capability scope binding、私有测试模式、history/audit 同事务撤权，下一次本库 GET 立即可见。
- PG16 原子单库事务：全程复用 `IsolatedAuth.withSession`；System Admin 现时行锁、目标员工行锁、CAS `expectedVersion`、请求键防重、审计 before/after 与重放凭据均同库。注入异常整个事务回滚。
- 不修改 F03 既有迁移/权限目录结构、不修改 F07 既有 Guard、不注册默认生产写入路由。完整合法隔离 CI 来源 `CI_ONLY_F03_PERMISSION_CONFIG`，不伪装正式电话消费来源。

## 二、证据与已知结果

- 首轮官方 [Run #39799794445](https://github.com/suzhe868-arch/mb/actions/runs/39799794445) 在旧 HEAD `5065db292368e10ab0434a2faea7a5d933766ac3` 下完成真实 PG16 业务及 HTTPS 双 Job，均成功；**不能代替后续代码最终 SHA**。
- 为满足安全自审，后续增加 System Admin 实时锁、业务矩阵 30 个真实 PG16 用例、HTTPS 22 个、重启后撤权持久性、SG01 已签名公共结构不漂移、全量基础 Node 回归。最终执行结果必须在 PR #224 写明官方 Run/两个 Job/Artifact/最终 HEAD。
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
4. 仅通过 A 独立验收后按仓库流程合并。B 不合并 main、不推进 Issue #196 PC 页面、不自行关闭 #187。
