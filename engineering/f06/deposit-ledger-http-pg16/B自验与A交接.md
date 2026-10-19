# F06 真实 Deposit 台账 HTTP 与 PostgreSQL 16 非生产纵切｜B 自验与 A 交接

## 一、交接状态

- 当前状态：IN_PROGRESS，等待本分支同一提交 SHA 的官方 GitHub Actions 完整验收。
- 目标分支：feat/f06-real-deposit-ledger-http-pg16-01。
- 仓库：suzhe868-arch/mb。
- 生产状态：未接入生产应用；不得据此宣布生产资金台账、真实收款或退款能力已上线。
- 生产缺口：PRODUCTION_FINANCIAL_CARRIER_GAP，仍然开放。

## 二、范围与安全边界

本施工单只新增本目录和一个独立 Push 工作流。复用已签名的 F06-3A 非生产 sidecar 与现有 F06-1/F06-2 锁生命周期服务，不修改现有业务源文件、不修改 public DDL、不修改 main、不增加权限、不调用真实支付渠道。

HTTP 适配器只绑定 127.0.0.1，并且要求 GitHub Actions 的真实分支、Push 事件、当前 SHA、Run ID 与显式非生产授权全部匹配。只有未改变的 F06-3A 父模块收到其兼容分支标识；入口本身仍校验真实施工分支与同一 SHA。生产 API、退款、交易、真实资金 issuer 均保持 fail-closed。

## 三、工作流隔离

- 只允许分支 feat/f06-real-deposit-ledger-http-pg16-01 的 Push 触发。
- 路径只允许本工作流文件与 engineering/f06/deposit-ledger-http-pg16/**。
- 单一标准 Ubuntu Runner、单 Job、单 PostgreSQL 16 服务。
- 权限为 contents: read；不上传构建产物；不创建 Pull Request；不合并 main。
- 首次 Push 前的 main 工作流路径审查覆盖 338 个工作流文件，未发现本批路径命中其他 Push 或 pull_request 工作流。CI 内再次执行完整触发预检，必须满足 push_matches=1、pr_matches=0。

## 四、验收矩阵

以下均为必须在同一官方 Run、同一提交 SHA 中完成的硬门槛；尚未出现该 Run 的通过日志前，不得将其标记为通过。

| 验收项 | 硬门槛 |
|---|---:|
| F06 锁请求 Node 基线 | 54/54 |
| F06 锁生命周期 Node | 37/37 |
| F06 锁请求 PostgreSQL 16 | 21/21 |
| F06 锁生命周期 PostgreSQL 16 | 36/36 |
| F05 初始化附属测试 | 18/18 |
| 既有 F06-3A Source | 28/28 |
| 既有 F06-3A HTTPS fail-closed | 9/9 |
| 新增真实 HTTP + PostgreSQL 16 测试 | 38/38 |
| 新增 TLS 生产路由拒绝测试 | 9/9 |
| 父实体完整行封存 | 恰好 190 张表，每张记录 COUNT 与 MD5 |
| 签名迁移与父 sidecar | 24 条迁移、public catalog SHA、D1/F06-1/F06-2 attestation 均一致 |
| 数据库隔离 | 源库与审计副本使用不同 PostgreSQL database OID 与 backend PID |
| 场景恢复 | 新建独立恢复库后，190 张表全量行封存与原始快照、审计副本完全一致；审计副本 OID 不变 |

## 五、必须覆盖的业务行为

- 真实 HTTP 请求到达非生产适配器，并通过签名员工 Session、当前账户状态、角色、权限覆盖、能力范围、Team/Store/Object Scope、客户、锁和 Listing Cycle 检查。
- 记录合成收款；同一幂等键重放返回同一 Deposit；同键不同金额冲突。
- 追加式 Correction/Reversal、只读净额、并发防止净额变负、跨 Lock/Cycle 拒绝。
- 失败注入后调整记录、幂等键与审计记录均回滚；原始收款事实与追加账本禁止 UPDATE/DELETE。
- 锁到期不得绕过已有签名资金事实；未知资金 issuer 来源必须 fail-closed；净额归零不得自动释放锁。
- 失效 Session、权限撤销、范围撤销、禁用客户、非活动 Lock、已结束 Listing Cycle、伪造角色/系统管理员声明均拒绝。
- TLS 下生产 Deposit、退款、交易、锁释放与非生产 CI 路由均不可用；生产应用源文件不包含新增 CI 路由。

## 六、最终证据登记

- 最终提交 SHA：待同一分支完整验收后登记。
- 官方 Workflow / Run / Job：待首次 Push 后登记。
- 真实 HTTP、TLS 与 PG16 原生日志：由同一 Job 输出；不上传 artifact。
- 父实体封存：运行时输出 before/after JSON 与 SHA；文件只存在于临时 Runner，不提交生成的运行时证据。
- 当前判定：不得提前标记 READY_FOR_A_REVIEW。只有全部硬门槛通过、同 SHA 无失败/取消/跳过，并完成最终报告后，才可交 A 独立验收。

## 七、A 独立验收重点

1. 核对本报告所登记的最终 HEAD 与官方 Run SHA 完全相同。
2. 核对触发预检只匹配本工作流一个 Push，且没有无关 pull_request 工作流命中。
3. 核对 38 项真实 HTTP 测试、9 项 TLS 拒绝测试和所有基线测试均为全通过。
4. 核对 190 张父实体表的行数与 MD5 封存、24 条迁移、Catalog SHA、父签名 attestation 与恢复后的新 OID。
5. 核对生产应用、public DDL、main 与生产权限未被修改；生产资金 issuer 缺口仍明确标记为开放。
