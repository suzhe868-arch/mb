# 2026-10-16｜F07-4 PR67第二轮A验收R2-A07/A08定向整改补记

> A第二轮整改单：`07_重建工作区/F07-4_A主控PR67第二轮独立验收_Incident清除后重复告警与旧CI队列补充整改正式施工单_2026-10-16.md`。本文件仅覆盖原PR#67/原分支白名单；最后同SHA GitHub Push Job、Artifact、其它旧Check须以PR本轮最终评论的原生实录为准。在未完成末次核验前，不应把此前的`READY_FOR_A_REVIEW`视为第二轮验收已交齐。

## R2-A07｜同故障生命周期现态而非旧事件布尔值

- `gate.mjs::dispatch` 的 `incident_active` 与 `incident_recovery` **都在发Mock消息的同一PG16事务**以 `incident_id` 读取 `incident_lifecycle ... FOR UPDATE`。与 `clearIncident` 的同生命周期行 `UPDATE` 串行化，旧 `event.incident_active=true` 已不具独立放行效力。
- Active 需要 `ever_active=true/status=active/cleared_at=NULL`、`at>=activated_at`；当前cleared→`INCIDENT_ALREADY_CLEARED`、无生命周期或跨故障串线→`INCIDENT_CURRENT_ACTIVE_SOURCE_GAP`、时间早于启动→`INCIDENT_ACTIVE_BEFORE_ACTIVATION`。所有拒绝均无新 `mock_outbox`。
- Recovery 增加 `at>=cleared_at` 验证，过早恢复→`RECOVERY_BEFORE_CLEARED_AT`，原有 `recovery_notified` 一次性同锁去重不变。
- 新增原生S84—S92九项覆盖首次Active、清除后旧事件标记不变、伪源、不同故障、双Backend的`clearIncident`行锁竞争、提前Recovery/Active、无ever_active、失败重试后清除。原83 Source保留，现在预期**92 Source + 10真实F03父Session负证 + 26 CA+SAN回环HTTPS = 128独立子例**；该数目仅为代码覆盖目标，**不构成最终绿色证据**。真实原生任务保持独立两个PG16 Job及新`F07_4_R2_NATIVE_INCIDENT_CLEAR_DISPATCH_LOCK`输出断言。
- 生命周期表属于短寿命`f07_4_ci`模拟库；正式Incident签发、当前PDM23真实事件及Feishu仍是`INCIDENT_SIGNED_ISSUER_SOURCE_GAP / CI_SYNTHETIC_ONLY`，没有触及原始F03/F05或正式数据库迁移。
- 两张TSV `通知投递场景矩阵.tsv` 和 `PDM23事件与渠道权限矩阵.tsv` 均追加同Incident锁、状态、时钟、去重与来源分级证据，未降低旧测试。

## R2-A08｜末SHA旧F05 CI留痕要求

- **本轮实际最后SHA**需以GitHub主机实时Head确认，不沿用首轮SHA`4543169...`；分别查询`commits/<HEAD>/check-runs`与`actions/runs?head_sha=<HEAD>`，按旧F05-7/F05-8/F05-9/F05-10/F05-10-D1逐项列Job状态与失败分类。
- 如外部旧工作流仍Queued，明确`A08_EXTERNAL_CHECK_PENDING`并交A判断；不得复用其它PR裁决，不修改冻结旧CI，不声称全部Check全绿或自行merge。
- 限定事实：`B_SELF_TESTED`只限本包隔离CI；正式Issuer/Scope/Object、JYT/Collector/Feishu、真实资金、UAT/生产均未授权，F05/F06/F07全域与V1保持`NOT_READY`。

---

# 2026-10-16｜PR #67 A01—A06 定向整改交接补充（仅隔离CI）

> **现状：整改代码与测试已提交，末次同SHA CI/旧Check/Artifact 以 PR #67 最新正式B评论为准。** 本文件本身不能代替GitHub原生Job；全部核实前不单独声称 `READY_FOR_A_REVIEW`。原施工包与原PR继续，`main`未修改、不合并。差异范围只限本包工程目录和 `.github/workflows/f07-4-*.yml`。

## A01—A06 可复核整改索引

| 编号 | 具体改动 | 证据/限制 |
|---|---|---|
| A01 | `server.mjs` 移除硬编码 `parentCalls=1`，每次请求分别审计 `signedParentCalls` 与 `syntheticPgReads`；当前没有已授权真实F03读取器，前者严格为0。伪造signedParentVerified及撤权均继续403。 | H15/H21/H22/H23；`PRE_PARENT_VALIDATION`，不是正式父正例。 |
| A02 | `gate.mjs` 的SLA仅基于CI持久的事件只读字段判定：deadline已到、首次响应未完成、无有效hold、事实有效、事件仍有效；未来deadline严格拒绝，恰到截止才可合成放行。不重算PDM15正式SLA时钟。 | S60/S64—S70、H26；`SLA_EVENT_SOURCE_GAP/CI_SYNTHETIC_ONLY`，旧public父源COUNT/MD5不变。 |
| A03 | CI临时PG16 `incident_lifecycle` 持久记录同故障active→cleared与recovery_notified；recovery需匹配同incident且确实存在前态，使用`FOR UPDATE`防跨事件并发复发，失败可重试，DND后重新读取。 | S12/S41—S45/S71—S77/S83；`INCIDENT_SIGNED_ISSUER_SOURCE_GAP`，不是上游真实Incident事件。 |
| A04 | 临时`notification_log`增加`recipient_ref/route_ref/config_version/revalidation_basis`，接收人和route只保留不可逆SHA256截断引用，允许失败/跳过/去重/成功全量追索；无路由记`ROUTE_SOURCE_GAP`。 | S54/S78—S83；对照mock_outbox，不保存真实个人号码、Feishu凭据、VIN或实际群密钥。 |
| A05 | HTTPS client启用本机一时性证书`ca`和`rejectUnauthorized:true`，验证127.0.0.1 SAN；错误CA和错误主机名在TLS握手层失败；H04专门以合法SAN完成握手再验证伪Host被应用拒绝。 | H01—H26；loopback-only，禁止出站。 |
| A06 | **只有最后提交**对应的GitHub原生`push`两独立真PG16 Job、两官方工件、其它旧F05 Check逐项分类完毕后，才在PR最终评论签署B完成；旧错误不删、不豁免。 | `commits/<HEAD>/check-runs`、`actions/runs?head_sha=<HEAD>`、原生Job日志与两同SHA Artifact。 |

## 施工边界与来源分级

- 旧F03父Session拒绝Suite 10项不改弱；真F03签名正例仍不可构造。新增独立Source 20例后合计**83 Source＋10 真F03已签负证**，HTTPS由20增至**26**，计划复核**119个独立子场景**，Node父套件不重计。计数属于计划覆盖规模，**非成功证据**。
- `PRE_PARENT_VALIDATION`：链接语法/HTTPS/本地guard在父授权之前的拒绝；`syntheticPgReads`：只读CI自建PG；`SIGNED_PARENT_NEGATIVE_ONLY`：仅旧F03已有签名父拒绝；`CI_SYNTHETIC_ONLY`：本包独立演示通知模型；`SOURCE_GAP`：正式NotificationConfig Issuer/Scope/Object、真实SLA与Incident事件签发、Feishu route与真实发送、客户数据、生产资格全部仍不存在。
- 所有新DDL只在每次CI创建的`f07_4_ci`独立schema，**无正式迁移、无生产接线**；`F05/F06/F07_GLOBAL/V1=NOT_READY`、`NO_PRODUCTION`、`NO_MAIN_MERGE`。
- 本轮新增详细用例及证据级别：`通知投递场景矩阵.tsv`；事件/渠道级来源矩阵：`PDM23事件与渠道权限矩阵.tsv`。
- 版本分叉说明：本PR以A原审查时main `1350024a0f45e71c45bb6d4512ff6b2251e3dcef`为共同祖先；main后续若推进，复验时以GitHub现时compare和全部变更白名单为准，不自行修改main。

---

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
