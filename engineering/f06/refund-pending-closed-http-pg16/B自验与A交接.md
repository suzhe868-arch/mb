# 名邦汽车 V1｜F06 真实Refund pending与无付款closed｜B自验及A交接

## 一、工程任务及正式授权

- 工程ID：`F06_REAL_REFUND_PENDING_CLOSED_HTTP_PG16_01`
- 正式Issue：[ #140 ](https://github.com/suzhe868-arch/mb/issues/140)
- A已合并上游PR139，受验父319/319，PR139 merge `7ebd75337d2bbf1bd37bd697fc58cb0c19888774`，追溯原Run `39395616127`。
- 本批创建起点是2026-10-20核实时最新 `main@ad39b112033847ee18cc4736c53d144f7ece1d0a`；指定B分支 `feat/f06-real-refund-pending-closed-http-pg16-01`。
- **本交接文档不得单独认定验收通过**。只有本文件所在最终B HEAD对应的同SHA官方单Job Run `completed/success`，旧319及本批新增HTTP/TLS全绿、0失败/跳过/取消和原生Seal可回放，才可写`READY_FOR_A_REVIEW / NEXT_OWNER=A`。

## A首轮拒验与B定向整改（2026-10-20）

A在 Issue #140 评论 #6288407435 和主线 PR #142 正式裁定：上一轮385/385全绿并不构成业务验收。唯一阻断是新的worker把申请pending和结案closed混用现时可售/Lock active/未过期守卫，且缺新HTTP结案的两类SQL故障回滚测试。本次仅对原B分支本批目录完成定向整改。

1. **申请/结案守卫拆分**：request仍必须现时Lock有效/在售/未到期/ListingCycle正常；已签名pending的close改为验证原签名Refund的Lock/vehicle/customer/cycle历史一致性和当前负责员工身份，不因后续车源不可售、期次结束或普通TTL流逝而额外拒绝。冻结原生3C1 close仍在同一PG16事务内验证permission/capability/Scope、来源签名、余额、无付款、无owning Transaction、事件及审计。
2. **可复现来源变化**：真PG16测试先使用冻结F06-3C1服务生成合法签名pending，再在可销毁合成库将M94许可的名邦车辆状态由 available 更新为 unavailable，正常结束ListingCycle，不伪造或直接篡改来源Lock签名状态；真实loopback HTTP执行closed_without_payment并保留原pending事件/金额。变化后新request继续硬拒。
3. **真数据库SQL注错**：追加 AFTER_CLOSE_THROW 和 AFTER_EVENT_THROW，分别在已更新closed行以及已插入事件/幂等键/审计后由原生3C1抛错，测试检查同一个真实事务Rollback使pending、事件、幂等键、审计、金额、退款支付、Transaction完全未变，随后再合法closed并验证同键重放。
4. **回归目标**：完整继承原319+Refund56+TLS10=385项，另加7项真实退款结案生命周期、来源变化、rollback及重放；预计同SHA总数392。仅最终官方本HEAD Push单Job成功/0失败/0跳过/0取消、父161表/24迁移多OID全Seal一致才可交A；不以旧Run #39400797756代替。

并发事实边界不变：独立PG Backend可在员工Session行串行化，不声称双方同时获得Vehicle锁。本批绝不触真实退款、refund_payments或生产Issuer。

## 二、源码白名单

本任务只新增以下文件，不触碰旧父F06、公共DDL、24迁移、生产代码：
- `.github/workflows/f06-real-refund-pending-closed-pg16-onejob.yml`
- `engineering/f06/refund-pending-closed-http-pg16/ci-job.sh`
- `engineering/f06/refund-pending-closed-http-pg16/worker.mjs`
- `engineering/f06/refund-pending-closed-http-pg16/server.mjs`
- `engineering/f06/refund-pending-closed-http-pg16/trigger-preflight.mjs`
- `engineering/f06/refund-pending-closed-http-pg16/tests/http.test.mjs`
- `engineering/f06/refund-pending-closed-http-pg16/tests/https.test.mjs`
- `engineering/f06/refund-pending-closed-http-pg16/B自验与A交接.md`

## 三、原生来源和权限

原生F06-3A合成Deposit与3B/3C1退款侧车全部由**历史签发的冻结runner --apply/verify**在原始完整父数据库独立恢复后重建，采用签名 checksum、现时Public Catalog、24条迁移和161张父表Seal，不产生真实资金事件。所有退款HTTP请求只在`127.0.0.1`，由独立Node子进程以**真实员工Token**调用旧已签`requestSyntheticRefundCI`或`closeSyntheticRefundCI`，不手工插入合法退款签名、无影子issuer。由于父Ref守卫已冻结，旧Ref仅在核验真实Github Event/Run/SHA/隔离DSN后的受限子进程内兼容；官方真实Ref/SHA未修改。新adapter在同一受保护PG事务内按Vehicle→Lock顺序锁定，严格校验新申请现时有效状态；对历史合法pending的close仅验证来源对象身份和授权，交由原F06-3C1原生服务重验权限、余额、无付款及无owning Transaction，不额外要求来源一直可售。任何撤权/漂移/无受信Carrier均安全拒绝，不增加任何正式权限。

## 四、回归门槛

| 范围 | 通过要求 |
|---|---:|
| 原PR139九组父257 + Transaction53 + TLS9 | 319项 |
| 本批Refund旧56+生命周期整改新增7，真实HTTP/PG16 | 63项 |
| 本批TLS生产及真钱拒绝 | 10项 |
| **单一最终SHA目标总数** | **392项** |

验收必须逐项核对：原生父F06-3B/3C1验签（不能零行即视为安全）、真实非特权PG16后台`pg_backend_pid()`、Ref兼容桥和每个事务的拒绝结果；Refund先提交/Transaction后拒绝、Transaction先提交/Refund后拒绝、双PG backend并发仅一个commit、双退款申请竞争唯一pending。真实资金、refund_payments、refunded总数保持零，SQL故障注错后无半条Refund/Lock/Transaction/请求Key/Audit；旧签名来源、Correction余额及不可变历史不删减。

父实体必须使用**本Run**原生签名161张四Schema全表逐表COUNT/MD5、24迁移、Public Catalog、D1/F06-1/F06-2 attestation，并对不同真实OID数据库恢复之后完整Seal一致。不得拿父上轮Run旧OID/hash冒充本轮。

## 五、明确限制和交接

本工作只是一条可销毁真实PG16的合成Lock侧`pending`与`closed_without_payment`流程；`closed`仅“决定不退”，不代表已退款，不允许真实`refunded`、写`refund_payments`，禁止正式Transaction侧退款、银行/微信支付、真实Customer/Employee数据、生产Schema/Issuer/路由、UAT/部署。旧`UPSTREAM_F06_3B_LOCK_PENDING_TRANSACTION_CONVERSION_GAP`和真实资金Source/Issuer、生产退款状态承载仍存在。多PG backend并发经签名Session可能先发生账户级序列化，本批不把此证据冒充双方同时持有Vehicle行锁。F06/F07/F08/V1整体维持`NOT_READY`，新增成本$0。

最终Run成功后B仅在Issue #140写清同SHA最终HEAD、Run/Job、PID、OID及全部实际测试并标：
`F06_REAL_REFUND_PENDING_CLOSED_HTTP_PG16_01_B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A`。
B不得创建PR或合并main，只有A独立验收后可标准合并。
