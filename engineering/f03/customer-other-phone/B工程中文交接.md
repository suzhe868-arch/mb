# B 工程交接｜F03 客户其他联系电话管理

## 一、正式交接状态

- 任务：F03_CUSTOMER_OTHER_PHONE_MANAGE_HTTP_PG16_01
- Issue：[ #227 ](https://github.com/suzhe868-arch/mb/issues/227)
- 指定分支：feat/f03-customer-other-phone-manage-http-pg16-01
- 交接状态：READY_FOR_A_REVIEW（以本次报告提交的最终 SHA 官方 Workflow 顶层 Run 与两个独立 PG16 Job 均 completed/success 为生效条件）。
- 交接规则：B 不合并 main；最终 Run URL、最终 HEAD、两份 Artifact ZIP SHA-256 及实际复算结果将在 PR 交接评论中记录。若最终 SHA CI 失败，状态自动退回整改，不得视为正式交接。

## 二、实现范围

- 新增其他联系电话事实；读取时只返回 phoneFactId、生效时间和掩码号码。
- 替换时在同一事务结束旧事实并插入新事实；失效时只写 ended_at，保留历史行，不物理删除。
- 使用 AES-256-GCM 版本化二进制 envelope 加密电话；密钥只由各 CI Job 运行时生成，未提交、未写日志或 Artifact。
- 复用 customer.phone.manage 当前能力、个人 deny 优先级、active 名邦员工、active Customer 和显式 scope_kind=object / 精确 customer_id 的 Scope/Binding。
- Guard、事实写入、有效期历史和 append-only audit_events 在同一真实 PG16 事务内提交。
- 使用客户事务级 advisory lock、权限表锁和 Scope/Binding 行锁，处理重复活动号码、并发撤权及 Idempotency-Key 重放/冲突。
- 通过显式依赖注入启用 loopback HTTPS CI handler；默认应用未注入时该路由仍 404，生产 server.mjs 未改。

## 三、最终 SHA 验收门槛

每个独立 PG16 Job 必须通过：

- SG01 migration 回归：9/9
- 原 runtime-scope Guard：7/7
- 原 runtime-scope HTTPS：2/2
- 新业务测试：25/25
- 新 HTTPS 合同测试：9/9
- 全量 Node 回归：269/269
- 所有失败、跳过计数均为 0；Schema 仍为既有 public 81 表，物理指纹与已签名 manifest 一致。
- Artifact 内含最终 SHA、Run ID、运行身份、物理 Schema 指纹、文件 SHA-256/字节数及测试日志；A 可独立下载复算 ZIP digest。

## 四、严格边界

- 仅 CI_ONLY_F03_CUSTOMER_PHONE_MANAGE 非生产能力，不代表 F03-2 正式验收或 V1 生产就绪。
- 不修改主要手机号、Customer Owner、微信身份、客户合并、公共 Schema、迁移、生产路由或客户端页面。
- 不接入 JYT、Collector、CDN/OSS、飞书或资金系统。
- Issue #187 仍保持 SOURCE_GAP/FAIL_CLOSED；F07 Runtime 未接线、F05→F06 同车签名仍 NOT_RUN/BLOCKED_SIGNED_PARENT，均不因本任务而解除。

## 五、最终证据

- 最终 HEAD、官方 Workflow Run URL、两个 Job 结果、Artifact ID / ZIP SHA-256：以最终 SHA Workflow 成功后发布的 B 交接评论为准。
- 中文施工说明：本目录 README.md 与 测试矩阵.tsv。
