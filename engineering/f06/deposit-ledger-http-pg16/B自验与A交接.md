# F06 真实 Deposit 台账 HTTP 与 PostgreSQL 16 非生产纵切｜B 自验与 A 交接

## 一、交接状态

- 当前阶段：B 自验已完成；以本报告所在最终 HEAD 的官方 Push Run 为最终放行门禁。全部硬门槛在该 SHA 成功后，状态为 `READY_FOR_A_REVIEW / NEXT_OWNER=A`。
- 目标分支：`feat/f06-real-deposit-ledger-http-pg16-01`。
- 仓库：`suzhe868-arch/mb`。
- 生产状态：未接入生产应用；不得据此宣布生产资金台账、真实收款或退款能力已上线。
- 生产缺口：`PRODUCTION_FINANCIAL_CARRIER_GAP` 仍然开放；生产 Issuer、真实收款、真实退款、交易完成、UAT 和部署均未获授权。
- 前一代码版本的完整成功证据：SHA `9018d5f89cb9fcf819e8166e48143901946e55e5`，Run `39378765199`，Job `118482774890`。该记录只用于说明前一版本的诊断与回归结果；**不得替代本报告所在最终 HEAD 的同 SHA 成功 Run**。

## 二、范围与安全边界

本施工单只新增本目录和一个独立 Push 工作流。最终相对最新 `main` 的变更范围仅为：

- `.github/workflows/f06-real-deposit-ledger-pg16-onejob.yml`
- `engineering/f06/deposit-ledger-http-pg16/**`

不修改既有 `engineering/src/**`、`engineering/scripts/**`、`engineering/sql/**`、`engineering/integration/**`、旧 Workflow、公共 M94 DDL、24 条迁移 Ledger、签名 Catalog、PDM Final 或生产路由；不修改 `main`；不创建 PR、不合并。

HTTP 适配器仅绑定 `127.0.0.1`，并核验真实 Repository、施工分支、Push 事件、当前 SHA、Run ID 和显式非生产授权。生产应用中没有新增 CI 路由。生产 Issuer、银行/微信/在线支付、真实收款、退款、Transaction、`refunded`、成交完成、UAT 与部署继续 fail-closed。

## 三、工作流隔离与兼容桥

- 仅 `feat/f06-real-deposit-ledger-http-pg16-01` 的 Push 触发；paths 仅匹配本工作流文件与本目录。
- 单一标准 Ubuntu Runner、单 Job、单 PostgreSQL 16 服务；`contents: read`；不上传构建产物；无新增付费预算。
- CI 触发预检必须证明 `push_matches=1`、`pr_matches=0`，且不触发无关历史 Workflow。
- Job 对真实 Repository、Ref、Push、SHA、Run ID、隔离声明和非特权 PG16 连接进行核验。

F05-8 旧 Priority 测试服务的既有种子脚本只接受历史 Lock 测试分支。新增目录中的 `seed-priority-compat.mjs` 先验证**真实 Deposit 分支、Push、SHA、Run、测试授权与精确隔离数据库**，再仅在子进程中为该旧守卫提供 `feat/f06-real-lockrequest-http-pg16-01` 兼容 Ref。实际工作流的 Ref、SHA、Run 不被更改；旧 `engineering/scripts/f06-lock-seed-signed-priority.mjs` 保持原样。CI 日志必须出现 `F06_REAL_DEPOSIT_PRIORITY_COMPAT_BRIDGE_VERIFIED` 和 `..._COMPLETE`。

原生 Lock 回归使用独立的临时 F05 v18–v26 测试链，并在 F05-8 签名 v24 仍有效时调用现有授权服务创建 Priority，再继续 v25/v26；不直接 INSERT 或伪造 Priority。父实体恢复后的签名数据库保存在独立 Run 专属数据库中，供 Seal 审计，不与该测试链混用。

## 四、同一 SHA 验收矩阵

以下门槛必须在**本报告所在最终 HEAD 对应的单一官方 Run / Job** 中全部通过；失败、跳过、取消均为 0。不能把不同 SHA 的结果拼接成最终成绩。

| 验收项 | 最终硬门槛 |
|---|---:|
| F06 锁请求 Node 基线 | 54/54 |
| F06 锁生命周期 Node | 37/37 |
| F06 锁请求 PostgreSQL 16 / HTTP | 21/21 |
| F06 锁生命周期 PostgreSQL 16 / HTTP | 36/36 |
| F05 来源/事件附属测试 | 25/25（旧 18 项门槛已扩展，保留新增测试） |
| 既有 F06-3A Source | 28/28 |
| 既有 F06-3A HTTPS fail-closed | 9/9 |
| 新增真实 Deposit HTTP + PostgreSQL 16 | 38/38 |
| 新增 TLS 生产路由拒绝 | 9/9 |
| 签名父实体完整行 Seal | **161 张**；逐表匹配原生父 Manifest 中的表名、COUNT 与 MD5 |
| 签名迁移与父 sidecar | 24 条迁移、public Catalog SHA、D1/F06-1/F06-2 attestation 均一致 |
| 数据库隔离 | 源库与只读审计副本 OID 不同；恢复源库使用新 OID；前后 backend PID 不同 |
| 场景恢复 | 恢复后的 161 张表逐表 COUNT/MD5 与原始签名快照及审计副本一致；审计副本 OID 不变 |
| Priority 前置 | 通过 F05-8 授权服务生成；源签名匹配、Match 为 current、TTL 有效；复制到独立 Lock 测试库后有有效来源记录 |

**计数裁决：** A 主控最新技术裁决明确，原“190 张表”没有已签父 Manifest 依据；本任务的原生 F06-3A 完整父基线是 161 张。验收代码从同一 Run 的 F06-3A 原生父封存与 PASS 回执读取全量清单并逐表核验；不得把旧 F06-3A 历史封存、单纯数字常量或人为补表作为依据。Workflow Job 名称也已更正为“161 张父实体 Seal”。

最终 Run 的真实 OID、backend PID、table digest、full-row seal digest、24 条 Ledger 摘要与 attestation 摘要均以该 SHA 日志中的 `F06_REAL_DEPOSIT_PARENT_SEAL_BEFORE_PASS`、`F06_REAL_DEPOSIT_PARENT_SEAL_AFTER_PASS` 及父链 PASS 回执为准。不得把前一 SHA 的运行时值作为最终 SHA 的值。

## 五、业务行为与安全测试覆盖

- 真实 HTTP 请求到达非生产适配器，验证签名员工 Session、当前账户状态、角色、permission override、capability、Team/Store/Object Scope、客户状态、Lock 状态和 Listing Cycle。
- 合成 Deposit 记录固定 CNY、正整数金额、允许的测试支付方式、服务端时间及 `CI_SYNTHETIC_NOT_REAL_MONEY` 标记；同 Lock 多笔事实可区分。
- 幂等键绑定 actor、Lock、Deposit、action 与金额；同请求重放返回原结果，异金额或异对象冲突。
- Correction/Reversal 只追加事件，不更新/删除原 Deposit；独立纠错权限、经理/店长角色、Scope 与必填原因均受检查。
- 超额冲正、负净额、跨 Lock/Cycle、撤权旧 Token 与并发超额纠错拒绝。
- SQL 故障注入验证业务事实、调整、幂等键与审计记录原子回滚；原始收款事实与追加账本禁止 UPDATE/DELETE。
- Deposit 存在时，既有 Lock 生命周期服务对延期/释放/到期执行资金保护；未知资金来源 fail-closed；净额归零不自动释放 Lock。
- 失效 Session、伪造角色/系统管理员声明、越权员工、范围撤销、禁用客户、非活动 Lock、结束 Listing Cycle 均拒绝。
- TLS 下生产 Deposit、退款、Transaction、Lock 释放与非生产 CI 路由均不可用；正式应用源文件不包含新增 CI 路由。

## 六、最终证据登记与 A 验收方法

- 最终分支与 HEAD：以本报告所在最终提交为准；A 应先读取最新 `main` 与该分支 HEAD。
- 官方 Workflow：`.github/workflows/f06-real-deposit-ledger-pg16-onejob.yml`。
- 官方 Job：`同SHA真实HTTP、PG16、161张父实体Seal`。
- 最终 Run ID：使用该最终 HEAD 的官方 Push Run；CI 成功时会输出 `READY_FOR_A_REVIEW branch=... head=... run_id=...`。本报告不把前一 SHA 的 Run ID 冒充最终 Run。
- 真实 HTTP、TLS、Node、PG16、父 Seal、Priority 来源与恢复证据均由同一 Job 生成；工作流不上传 Artifact，运行时 JSON/log 留在临时 Runner。
- 最终状态只有在上述同 SHA Run 为 `completed/success`、全部测试无失败/跳过/取消，并输出 `READY_FOR_A_REVIEW` 后生效：`F06_REAL_DEPOSIT_LEDGER_HTTP_PG16_01_B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A`。
- B 不创建 PR、不合并 `main`；由 A 按现行流程独立复验同 SHA 的代码、CI 日志、文件范围和生产边界后，决定正式 PR 出口。

## 七、A 独立验收重点

1. 核对最终分支 HEAD 与官方 Run 的 `head_sha` 一致；只采用该 SHA 的成功 Run。
2. 核对工作流路径预检只有一个 Push 命中、无 PR 命中。
3. 核对 54、37、21、36、25、28、9、38、9 各组测试均全通过，失败/跳过/取消均为 0。
4. 核对 161 张父表逐表 COUNT/MD5、24 条迁移、Catalog SHA、D1/F06-1/F06-2 attestation 与恢复后新 OID。
5. 核对 Priority 由受限兼容桥调用原 F05-8 授权服务生成，签名/Match/TTL 有效；旧脚本未修改。
6. 核对最终 diff 只含本工作流和本新增目录，生产资金 Issuer 缺口仍明确开放。
