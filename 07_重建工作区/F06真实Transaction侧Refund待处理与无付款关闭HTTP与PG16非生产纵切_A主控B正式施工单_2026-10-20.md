# 名邦汽车 V1｜F06真实Transaction侧Refund待处理与无付款关闭HTTP/PG16非生产纵切｜A主控B正式施工单

> A正式放行任务：`F06_REAL_TRANSACTION_REFUND_PENDING_CLOSED_HTTP_PG16_01_A_RELEASED_FOR_B`。**负责人：B**。全部为127.0.0.1 + 非超管可销毁PostgreSQL16 + 合成数据；真实退款/钱款到账、completed成交、生产路由、Issuer、客户资料、UAT及部署均禁止。预算新增$0。

## 1. 唯一施工包

- Issue：[ #147 ](https://github.com/suzhe868-arch/mb/issues/147)；新分支：`feat/f06-real-transaction-refund-http-pg16-01`，B必须从实际开工**最新 main**创建，不能固定历史SHA。B不得自行新建PR/合并main。
- 真实父已验收：PR #139合法合成Lock→Transaction，PR #143 Lock侧Refund pending/closed，PR #146合法Transaction cancel，最新父基线B HEAD `fa327ccece5efc1fe18d91558b1f7ff7d8a7299c`、Run #39415825663/Job #118604456336 **445/445** 全绿、旧四schema161签封表+24迁移+跨OID Seal一致。A报告：`07_重建工作区/F06真实Transaction正常取消_A主控独立验收PR146合并与下一任务放行报告_2026-10-20.md`。
- Authority：PDM-19 Final §§2–4、6–10、19–26、28–30；PDM-18 Final Lock/Waitlist、PDM-02/03权限、PDM-17公海保护、PDM-25审计。**本批只处理Transaction侧Refund `pending`发起与无付款`closed`关闭，不造真实`refunded`。**
- 首次只允许来源 **PR139真签`in_progress`且经PR146真签`cancelled`** 的合成Transaction；PDM虽允许completed侧退款，但`completed`当前未授权、无真实来源，必须Fail Closed而非测试假造。

## 2. 首要签名与资金门禁

1. 先读取实际父PG16、新Cancel `f06_real_cancel_ci.origins/events/request_keys/attestation`、PR139 `f06_real_tx_ci`、原生3A/3B/3C1、旧Lock与Public Catalog的实际结构与签名，做**来源兼容矩阵**。不得复用旧Lock侧Refund的`lock_id`制造Transaction退款；也不允许伪造旧3B原生`transaction_origins`。若在仅新白名单文件内无法建立同事务的新受限Tx退款来源，报`BLOCKED_SIGNED_TRANSACTION_REFUND_SOURCE`交A，不许修改任何冻结父、生产DDL/资金或伪造原件。
2. 一笔新Refund必须严格 **`lock_id IS NULL AND transaction_id IS NOT NULL`**，当前合法`cancelled` Tx及原Lock来源、Customer/Vehicle/listing_cycle一致；保留真实Deposit/Correction/Refund历史与真实业务责任，不修改旧Lock/Waitlist/Priority、Vehicle source_status/visibility/listing_cycle/展示价格。不能把已有Lock侧Refund改绑Transaction，也不能把旧Deposit跨车转挂。
3. 退款额度由已签3A Deposit净额和Correction/reversal、已签Refund历史以及真实已退/当前在途承诺余额保守派生；金额>0且不超过**可退余额**，同一资金池的重复待退款要隔离保护，未签/未知付款、退款关系、负余额和未解决资金状态均Fail Closed；`closed`绝不增加`refunded_amount`，本批禁止实际`refund_payments`写入。
4. 以签名Employee Session、当前Tx responsible、单独`transaction.refund.ci.request`/scope/capability及合法对象状态发起；合法处理者持相应独立scope可关闭，绝不因经理/店长职位或SystemAdmin身份默认给权限；非负责员工、4S、禁用账户、撤权、伪Token、跨Team/Store、资金来源漂移均硬拒。不同于永久Refund responsible，历史只存initiator/actor/time/reason。
5. 已合法pending后，无真钱`closed`需要非空close_reason、Event/Key/Audit；**不得再要求Transaction恢复in_progress、Vehicle保持可售或旧listing_cycle仍开放**，避免合法待退款永远无法收口；仍须验证来源真实、无实际付款、权限和唯一subject，闭合不得删除其他在途业务责任，不得直接放客户入公海。
6. 同一物理PG16事务内按明示一致锁序 Vehicle→Transaction→source Lock→Deposit/Refund，最终重验资金和状态并完成状态+受限签名origin+append-only Event/RequestKey/Audit。错误注入至少status/event/audit三处真Rollback，任何失败零半写；两PG backend同一余额竞争只能有一个合法提交，重放幂等、冲突Key拒绝，重跑后旧签封原字节不改。

## 3. 唯一允许文件与入口

- 只**新增**：`engineering/f06/transaction-refund-http-pg16/**` 和 `.github/workflows/f06-real-transaction-refund-pg16-onejob.yml`。
- 冻结全部旧F06父代码、旧Workflow、`engineering/src|scripts|sql|integration`、公共M94/24迁移、PDM Final、生产权限与Issuer；不写任何真正`/api/v1/refunds/**`。新CI路由仅`/__ci__/f06-real-transaction-refund/**`，127.0.0.1，非测试/生产模式404或硬拒。只用`f03_ci`非超管`postgres:16-alpine`临时库，禁止真实Customer、资金、生产Secrets。
- CI：唯一分支精确`push`+新增两个白名单paths，单`ubuntu-24.04`免费Runner、单PG16 service、单Job、`contents:read`、无PR trigger、artifact上传、矩阵、外部付款API或付费计算资源，事先Workflow全库预检Push=1/PR=0，预算$0。所有临时日志隔离销毁，不上传含Token/金额/手机号/VIN的工件。

## 4. 完整验收合同

- 在**最终B HEAD同SHA一个官方GitHub Push单Job**完整原生跑旧 **445/445**（包含父392与已验Cancel43+TLS10），再新增真实Txn侧Refund HTTP/非特权PG16至少 **40/40**、TLS/生产拒绝至少 **10/10**，总计 **>=495**，0失败/0跳过/0取消。不准从旧SHA、旧Run拼计数，不能用模拟POST掩饰没有PG16。
- 真PG16顺序必须包含：合法PR139创建→PR146取消→Txn subject pending/closed真正写表；无合法Cancel/旧4A签名不兼容FailClosed；首次取消后供应异常、期次结束仍可关闭原pending；两笔合法余额、同Key、冲突Key、并发、退额不足、旧Lock pending、未知Deposit/Correction、伪已退款、已关闭不可复活；责任与授权撤销、禁用客户/4S/跨scope；三处实际故障回滚及后续合法补办；与PDM-17公海/历史/Lock/Waitlist/Priority独立不互相覆盖。
- 每个原生父签封结构实际核验：**原161张表逐表COUNT/MD5**，24 migration ledger、Public Catalog/D1/F06-1/F06-2原签及3B/3C1、PR139与PR146 sidecar；两套不同真实PG物理OID独立恢复，旧父全行Seal前后一致。新Txn Refund sidecar独立列示，不冒充161父表的原集合。
- 必须给出真实两Backend PID/同源争抢锁序（同Employee Session预先串行化就如实说明）、SQLSTATE、事务Rollback SQL事实、签名兼容矩阵、可退余额计算与原Public Tx/Lock/Deposit/Refund零越权证明。任何尚未证实的`completed`或真实退款拒绝，不准靠制造无签名数据伪装。
- B随最终受验SHA提交中文`engineering/f06/transaction-refund-http-pg16/B自验与A交接.md`，Issue #147附官方Run/Job/HEAD/OID/PID/Seal，标`F06_REAL_TRANSACTION_REFUND_PENDING_CLOSED_HTTP_PG16_01_B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A`，不建PR不并main。缺真正父源或签发权则正确报告`BLOCKED_SIGNED_TRANSACTION_REFUND_SOURCE`，停止本包越界动作，由A技术裁决。

## 5. 仍未授权

真实退款到账/退款确认、`refunded`、实际收付款、微信/银行、首次completed/成交价/完成纠错、生产Issuer/公共DDL、真实责任handoff、真实客户资料、跨主体强Vehicle锁探针、UAT/部署；F06/F07/F08/V1整体一律`NOT_READY`。本工作单不重新定义冻结PDM业务规则。
