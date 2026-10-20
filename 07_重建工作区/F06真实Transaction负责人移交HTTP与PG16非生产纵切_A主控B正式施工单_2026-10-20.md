# 名邦汽车 V1｜F06真实Transaction负责人移交HTTP与PG16非生产纵切｜A主控B正式施工单｜2026-10-20

> **A放行任务** `F06_REAL_TRANSACTION_RESPONSIBLE_HANDOFF_HTTP_PG16_01`；责任B；[Issue #151](https://github.com/suzhe868-arch/mb/issues/151)。B执行时以最新main为唯一起点，指定新分支 `feat/f06-real-transaction-handoff-http-pg16-01`。资金/生产许可始终没有开放，预算新增$0；B自验后`READY_FOR_A_REVIEW`交A，不得自行创建PR或合并main。

## 1. 当前主线与签名上游
- 已验非生产真实PG16/HTTP主线：PR139 Lock→Transaction、PR143 Lock侧Refund pending/closed、PR146 Transaction cancel、[PR #150](https://github.com/suzhe868-arch/mb/pull/150) Transaction侧Refund pending/closed含post-pending Correction安全修复。PR150 B受验末SHA `f774bc49407b7e2b8918347c03989b1b7230770d`，同SHA官方Run `39436527215`/Job `118674868785` 为父链 **534/534**；Merge `cc2542a18ed8498ba549ff0f4cefd5e8beeedd8d`。先读取A报告《F06真实Transaction侧Refund_A第二轮独立验收PR150合并与负责人移交放行报告_2026-10-20.md》。
- Authority：PDM-19 Final §9 与 §§6–10,19–26，PDM-02/03、PDM-17/18/25 Final；旧CI-only F06-4B Handoff / 4C Post-Handoff Cancel是历史参考，**不代表**已验PR139新真实签名源可被旧4B直接处理。必须独立验证来源兼容矩阵，并用新版本签名侧车，在**同一可销毁非超管PG16物理事务**内实现新Handoff。
- 核心对象：现有**签名PR139来源**且`public.transactions.status='in_progress'` 的合成Transaction，保持Customer/Vehicle/listing_cycle/source Lock身份及交易状态不变，仅正式变更当前`responsible_employee_id`。来源Lock始终保留`released/converted_to_transaction`。旧Owner、公海、咨询、Recommendation、Priority、Waitlist、锁车不可漂移。

## 2. 施工范围与安全验收
- 原Responsible可能已禁用/离职/丧失Scope，因此本包不得设计成“只有已无效旧Responsible能授权”。由PDM Final合法业务范围内**当前有独立transaction-handoff capability + scope的经理/店长（或另经明确授权的合法角色）**发起，任何岗位名称不自动授权；鉴别actor当前有效Employee Session、Team/Store、Scope、Capability、目标New Responsible当前有效且合法同对象团队/门店范围、禁止System Admin以控制身份代签及4S。无法从冻结权限模型明确授权，不准扩权，报`BLOCKED_SIGNED_TRANSACTION_HANDOFF_SOURCE_OR_PERMISSION`并记录A需裁定的精确原子权限事实。
- 原生冻结PR139 `f06_real_tx_ci.origins/events/request_keys`必须保持初建Responsible不可变，**不可把旧签名原件直接改成新负责人**，不得伪造原生3B/旧4B的Transaction origin。允许本批新sidecar为当前责任版本独立签封Handoff Record/Event/Key、按顺序串起old/new/actor/time/reason和版本，用公表当前Responsible与链尾重验；未知版本/中断链/旧源漂移FailClosed。
- 单PG16原子事务（真实 `IsolatedAuth.withSession`）：统一Vehicle→Transaction→来源Lock→权限/TeamScope/历史版本锁序、当前负责人和全部签源最终提交前重验；UPDATE Public Transaction responsible+新增append-only签名Origin/Event/Key/Audit**必须同BEGIN/COMMIT**。注错在状态后、事件后、审计后至少三点真实Rollback；不同Employee独立PG Backend并发最多一次合法handoff、幂等Key相同Actor/Subject/Payload安全重放，Key换Actor/Subject/理由冲突。
- **高优先级兼容门禁**：已验PR146 Cancel与PR150 TxRefund源读取原始PR139 Responsible且对公表当前Responsible有冻结相等检查；在新Handoff成功之后很可能真实`FailClosed`。本任务不可改冻结父服务以“让旧接口通过”，必须有真PG16正反用例证明**交接前两接口原验可用、交接后旧来源因新版本不兼容按预期安全拒绝且没有支付/半写**，将下一版本化衔接独立列入A后续任务。不得宣称已实现Handoff后Cancel/Refund的产品全链。不能把旧责任被禁用后合法Handoff误判无法交接（否则应按本次技术门禁阻断报告）。
- 严格白名单：**只新增** `engineering/f06/transaction-handoff-http-pg16/**` 与 `.github/workflows/f06-real-transaction-handoff-pg16-onejob.yml`；其余旧PG16父签名、3A/3B/3C1/4B、PR139/143/146/150旧文件、`engineering/src|scripts|sql|integration`、M94/24迁移、生产Issuer/API、PDM Final只读。仅`/__ci__/f06-real-transaction-handoff/**`在127.0.0.1 CI运行，禁止真实客户/资金、线上写入。
- CI：精确Push分支+上述两个新白名单paths、**单**免费`ubuntu-24.04` Runner、单`postgres:16-alpine`服务、单Job、`contents:read`；没有PR触发/矩阵/工件上传/外部通信/生产Secret/付费。先跑当前本包真实全库trigger preflight Push1/PR0，再在**最终B HEAD同SHA官方Push单Run**原样完整重跑PR150父链**534/534**、新增Handoff真实HTTP/PG16至少**30**项、TLS/生产安全拒绝至少**10**项，总计**>=574**，0失败/跳过/取消。补真实两Employee不同Session与两PG Backend PID及业务结果；原冻结四Schema161张逐表COUNT/MD5、24迁移及跨OID独立恢复全行Seal一致。单Session串行化不得伪称双Vehicle锁均已争抢。
- 交接：中文`engineering/f06/transaction-handoff-http-pg16/B自验与A交接.md`，Issue #151附最终HEAD、Run/Job、真PG16版本OID/PID、角色/权限/原签源兼容矩阵、原161父Seal、审计与事务回滚、未知来源拒绝与生产仍NOT_READY。达到`F06_REAL_TRANSACTION_RESPONSIBLE_HANDOFF_HTTP_PG16_01_B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A`才向A交接；B不得自行建业务PR/合main。

## 3. 未授权
真实金融资金、真`refunded`、首次`completed`与成交价、完成后纠错/退换车、Customer生产数据、公表正式生产DDL/Issuer、UAT部署、自动放行F07/F08都不可做。F06/F07/F08/V1总体`NOT_READY`。
