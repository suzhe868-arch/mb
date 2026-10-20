# 名邦汽车 V1｜B工程自验与A交接报告

## 1. 任务与交接状态

- 任务编号：`F06_REAL_POST_HANDOFF_TRANSACTION_CANCEL_HTTP_PG16_01`
- 正式放行：Issue #154
- 执行分支：`feat/f06-real-post-handoff-cancel-http-pg16-01`
- 开工基线：`main@29da12bc093d85349e65ef409b6c7b8679693391`
- 下一责任窗口：A 主控独立验收
- 交接状态：`READY_FOR_A_REVIEW`（**仅当本文件所在的最终 HEAD 对应的官方 Push Run/Job 通过 Issue #154 的全部同 SHA 门槛后生效**；若任何门槛失败，必须保持阻断，不得交 A）

## 2. 本批实现范围

仅新增本任务目录及专属单 Job 工作流，不修改 `main`，不创建业务 PR，不合并分支。

- `service.mjs`：依赖已签名的 PR139 Transaction 原始来源和 PR153 Handoff 完整版本链，验证当前链尾负责人、版本、原始负责人、资金事实和当前权限。
- `sidecar.sql`：新增独立 `f06_real_post_handoff_cancel_ci` 版本化来源、事件、幂等请求键和不可变 Attestation；不伪造旧 PR146 Cancel 来源。
- `server.mjs` / `worker.mjs`：只开放本地回环地址的合成 HTTP 路由，使用真实 Employee Session 和独立 PostgreSQL 后端。
- `tests/http.test.mjs`：验证 Handoff 后合法取消、幂等、参数拒绝、旧负责人和 Customer Owner 越权拒绝、SystemAdmin/4S/禁用账号拒绝、Permission/Capability/Scope/Membership 校验、跨 Team 范围拒绝、Handoff 与 Cancel 同交易并发、双后端竞态、故障注入回滚和旧 Refund FailClosed。
- `tests/https.test.mjs`：使用真实取消请求处理器，验证 TLS 下伪造会话拒绝及生产/支付/退款/完成路由拒绝。
- `runner.mjs` / `ci-job.sh` / `trigger-preflight.mjs`：精确分支与 SHA 门禁、真实 PG16 运行、父链继承、全物理恢复及 Seal 比对。
- `.github/workflows/f06-real-post-handoff-cancel-pg16-onejob.yml`：Ubuntu 24.04、单 PG16 服务、单 Job、Push-only、只读仓库权限、非生产合成数据；无付费资源或生产密钥。

## 3. 必须通过的同 SHA 验收门槛

最终官方 Run/Job 必须同时证明：

1. 已验收父链真实回归 **585/585**。
2. 本批 HTTP/PG16 TAP **至少 84 项**全部通过（含 40 项 Handoff 原生回归重跑及 44 项新增取消断言）。
3. 本批 TLS/生产拒绝测试 **至少 10 项**全部通过。
4. 失败、跳过、取消均为 0；Node 模块语法检查通过。
5. PostgreSQL 16 使用非超管 `f03_ci`；真实 Employee Token、不同 PG backend、Handoff/Cancel 同交易竞争、原子事务及故障注入回滚均通过。
6. 原签名 **161 张表、24 项迁移**在两个不同物理数据库 OID 上独立恢复，逐表 COUNT/MD5、目录、迁移及完整 Seal 前后完全一致。
7. 当前 Cancel 使用独立的当前负责人 Permission/Capability/Scope，并绑定 PR139 原始负责人在交易创建时所属的 Team/Store；其他 Team 的活跃权限不得代替目标交易范围。
8. 新 Cancel 不产生真实付款、退款、`refunded` 或 `completed`；旧 PR146/PR150 对新 Cancel 来源继续 FailClosed。

**精确末 SHA、官方 Run/Job、实测测试数量、backend PID、物理 OID 与 Seal 必须写入 Issue #154 的最终 B 交接评论，以该评论和本文件所在提交的官方 Run 作为可核验证据。** 本报告不预填未知运行结果，也不以被取消的历史 Run 作为验收证据。

## 4. 授权边界与阻断规则

- 仅非生产、合成数据、隔离 PG16；不得触碰生产 API、资金、真实客户或部署。
- 不修改冻结的 PR139/146/150/153 父服务、公共数据库迁移或生产权限。
- 不自行创建业务 PR、不合并 `main`；最终由 A 独立验收。
- 若最终同 SHA 官方 Run/Job 未满足上述所有门槛，状态保持 `NOT_READY_FOR_A_REVIEW`，修复后以新的最终 SHA 重跑，不得提前交接。

## 5. 交接动作

官方同 SHA Push Run/Job 全部通过后，B 在 Issue #154 记录实测证据并标记 `READY_FOR_A_REVIEW / NEXT_OWNER=A`。A 负责独立复核、后续 PR 和合并裁决。
