# F07-4｜B 工程自验与 A 独立验收交接

> 项目：名邦汽车 V1。施工单：`07_重建工作区/F07-4_A主控通知SLA免打扰Incident飞书路由审计_CI隔离正式完整施工单_2026-10-15.md`。
> 工作分支：`feat/f07-4-notification-sla-incident-gate-ci`，PR：[67](https://github.com/suzhe868-arch/mb/pull/67) → `main`，**B 禁止合并**。
> **状态边界：`F07_4_CI_ONLY / B_SELF_TESTED / READY_FOR_A_REVIEW（须与最终同SHA官方CI+PR交接证据共同成立） / NEXT_OWNER=A / NO_PRODUCTION`。本文件属于代码与验收约束交接，最终Run/Job/Artifact编号必须由PR末次同SHA真实证据补证；在证据齐备前不可单凭该标志视为交验成功。**

## 一、Authority 与白名单

- `PDM-23_最终完整规则.md`：allowlist、当前接收人、公司优先开关、个人/SLA 群独立开关、DND、Incident cadence、去重和安全入口；`PDM-25`：`Asia/Shanghai`、审计、配置历史与失败真实结果；`PDM-15/22`：只读既定首次响应 deadline，不计算/改写业务咨询状态。
- 本 PR 只**新增** `engineering/f07/notification-sla-incident-gate-ci/**` 与 `.github/workflows/f07-4-*.yml`，不更新主线状态、冻结父模块、旧 Workflow、旧 Migration 或正式 `public` schema。
- 真实 Collector/JYT、Feishu、客户资料、资金、微信/应用推送、生产部署及 API mutation 均未接入。
- 本次父 F03 真实签名 Session **仅验证登录、当前验权负证、撤销后拒绝**；**不**将自身合成 Notification 事件升级为 `SIGNED_PARENT_VERIFIED`；通知配置能力、上游真实事件发行人以及既有 SLA 业务事件均明确为 `SOURCE_GAP`。

## 二、已施工代码

| 组件 | 职责 |
|---|---|
| `gate.mjs` | 强制 GitHub Push/Repo/Ref/Run/APP_ENV 与 PG16 物理 DB/role、非 superuser 门禁；一次性 schema；12 项产品事件 allowlist；当前接收人和渠道复判；跨日 DND；去重 CLAIM/OUTBOX/LOG；Incident 有效性、必须满实际 cadence 后才可重发、当前公司与员工行加事务锁防并发撤权绕过；MockFeishu 投递/失败重试；安全链接负证。 |
| `server.mjs` | 只绑定 `127.0.0.1:49274` 的一次性本机 TLS 服务；不出站；不向 HTTP 泄漏内部拒绝码和业务对象。 |
| `tests/source.test.mjs` | Source 63 子场景：事件白名单/禁区、DND 边界、负责人和开关撤销、事件有效性重判、去重、失败/超时补偿、Incident、双 PG Backend 原生互斥、回滚、安全投影和非法环境。 |
| `tests/parent.test.mjs` | 真冻结 F03 新物理 PG16 的签名 Session、真实 credential 撤销、Admin 登入与业务权限分层等 10 条 `SIGNED_PARENT_NEGATIVE_ONLY` 子例；未制造通知权限 allow。 |
| `tests/https.test.mjs` | 20 条真 PG16 + loopback TLS 黑箱，涵盖真实 Mock 出入、重复、Host/Origin/Forwarded/Token、畸形 JSON、DND/撤权、deep-link SSRF、编码穿越、敏感响应。 |
| `PDM23事件与渠道权限矩阵.tsv`、`通知投递场景矩阵.tsv` | 产品事件、渠道与源分级；逐例矩阵，`CI_SYNTHETIC_ONLY` / `SIGNED_PARENT_NEGATIVE_ONLY` / `SOURCE_GAP` 不相混淆。 |
| `.github/workflows/f07-4-notification-sla-incident.yml` | 两个独立 PostgreSQL 16 非超级用户 Job，固定分支真正 Push 触发，分别上传原生日志官方工件。 |

## 三、独立回归判定口径（63 Source＋20 HTTPS＋10 冻结 F03 父负证＝93个独立子场景）

- **Source**：至少 63/63 独立子场景以及真父 F03 10/10 子场景；Node 父 Suite 不混入业务子场景数量。原生双 Backend `pg_backend_pid`、行锁竞争/回滚、冻结父对象不变必须在 Job 输出可查。
- **HTTPS**：至少 20/20 独立 TLS 黑箱，外部统一最小结果，内部审计逐请求失败类别；必须验证没有出站真实飞书。
- **Artifact**：两个来源于最终同一个 HEAD SHA 的非空、未过期、官方 SHA256 摘要工件。若未下载 ZIP 原始字节并复算，不得写已独立复算。
- **GitHub 状态入口**：[PR 67](https://github.com/suzhe868-arch/mb/pull/67)、[本分支 Push Runs](https://github.com/suzhe868-arch/mb/actions/workflows/f07-4-notification-sla-incident.yml)。**本报告不预先伪造未完成的末次 Run/Job ID 或成功结论；最终 SHA/Run/Job/Artifact 明细以 PR 交接评论实核为准。**

## 四、反向安全审查与未打通项

1. 失败、Skipped、Deduped 不更改咨询、客户归属、Lock/Waitlist、Transaction/Refund；Mock 业务事件始终标 `CI_SYNTHETIC_ONLY`。
2. F03 正式 Notification Config capability 尚未签发，配置写全部 fail-closed；管理员账户能够建立 Session 并不自动拥有通知配置权，真实能力目录拒绝 `notification.config.write`。
3. 真实 Feishu Identity Mapping、业务 owner/assignee object 发行、合法总群地址、上游 Incident/Recovery 来源、PDM15 SLA 正向源仍 `SOURCE_GAP`；因此没有真实渠道正向业务结果，不能以本次合成成功替代上线验收。
4. 同任务旧工作流 Check 包含冻结 F05 PR 偶发红灯，B 不自行豁免。A 再独立核查。
5. 风险边界：GitHub CI 的测试数据库为一次性本机 PG16 且仍需检查服务绑定/权限日志；本地 Mock 成功不代表公网安全或投递具备生产可靠性。

## 五、交接状态

- 本工作单已经完成代码与测试文件的落实、原生 CI 触发与历史失败整改的提交；**最终同 SHA 绿色 Job 与官方工件核实之前，不可据此单独认定 `READY_FOR_A_REVIEW` 生效**。
- 以 PR #67 的终版交接评论补录最终 SHA、两 Job、两 Artifact 的准确编号、旧红灯、未测边界；证据一致后以 `B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A` 请求 A 独立验收。
- `F05/F06/F07_GLOBAL/V1=NOT_READY`、`PRODUCTION=DENIED`；`main` 不合并。
