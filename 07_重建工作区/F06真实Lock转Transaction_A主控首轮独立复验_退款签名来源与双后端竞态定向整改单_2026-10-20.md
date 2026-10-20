# 名邦汽车 V1｜F06真实Lock→Transaction HTTP/PG16：A首轮独立验收与Refund签名源/双Backend竞争定向整改

- 日期：2026-10-20
- 任务：`F06_REAL_LOCK_TO_TRANSACTION_HTTP_PG16_01`；正式 [Issue #136](https://github.com/suzhe868-arch/mb/issues/136)
- A状态：`A_REVIEW_NOT_ACCEPTED / B_TARGETED_REMEDIATION_REQUIRED / NO_PR / NO_MERGE / NEXT_OWNER=B`
- B原分支：`feat/f06-real-lock-transaction-http-pg16-01`，受审HEAD `c4dbb48a5e602076298fba47d133fd43cec504f3`
- 受审main：`38faaf890bca5a2c7f133c50c9c96901fab03029`；ahead8/behind0；9个新增变更文件全部在白名单
- 最终官方[Run #39391407455](https://github.com/suzhe868-arch/mb/actions/runs/39391407455) / [Job #118523549413](https://github.com/suzhe868-arch/mb/actions/runs/39391407455/job/118523549413)：`completed/success`、HEAD/Run吻合；旧父九组257/257、新Transaction HTTP/PG16 43/43、新TLS9/9，**309/309**，全0失败/跳过/取消；Workflow preflight 340个workflow、仅1个Push命中、PR0。
- 已核原生封存：161张四Schema父表完整COUNT/MD5与24迁移及Catalog、D1/F06-1/F06-2父签一致；新Run Source OID35233、审计OID39349、第一次恢复OID43594、Transaction实验后恢复OID60657，完整行Seal `c3bd951f925f180009808272cfee0fdb0d868ebc727d4170fb6613c91b753bfa` 前后一致；不要求重复调查早期190/161数量或旧Priority失败。
- A评论正式[整改门禁](https://github.com/suzhe868-arch/mb/issues/136#issuecomment-6286709536)。

## 一、验收发现与影响

**1. 合法已签 Refund 父来源未实证，来源缺失时存在允许转换的路径。** B的`engineering/f06/lock-transaction-http-pg16/ci-job.sh`只复用签名F06-3A Deposit并创建`f06_real_tx_ci`新增sidecar，没有应用并签署既有F06-3C1退款父载体。新`service.mjs`的`refunds(c,l)`只在遇到`public.refund_cases`的`closed`行时才检查`f06_3c1_ci.refund_origins`的存在；退款记录为空时直接`F06_TX_REFUND_EXCLUSION_SIGNED`通过。无法据此声明已满足本次A施工单§2.3“原签名源/Carrier缺失同事务硬拒”。没有可信父源时应fail-closed或明确上报`BLOCKED_TRUSTED_REFUND_SOURCE`，不得因为查询到0条裸公共行就假定可信无退款。

**2. 缺少正式要求的Refund↔Transaction两独立Backend竞争。** 新`tests/http.test.mjs`第22项是同一Lock两次Transaction HTTP互相争用，不是Refund和Transaction竞态；第33项是直接INSERT无`f06_3c1_ci.refund_origins`签名来源的`public.refund_cases(status='pending')`，只证明遗留/未知退款保守硬拒。当前没有调用已有授权`requestSyntheticRefundCI`创建合法pending、没有签名`closed_without_payment`恢复正例，也没有“Refund先提交/Transaction后拒绝”“Transaction先提交/Refund后拒绝”“独立PG16双方并发仅一方提交”这三项强制回归。旧父`refund-pending-ci/service.mjs`确有先锁Vehicle再Lock的真实签名服务可作为合规复用基础，但要在本批合法测试环境/旧Ref兼容守卫下运行，不得改父代码、伪造签发或人工插入签名。

**3. 安全结论边界。** 本包Transaction本身具有Vehicle→Lock加锁、签名Session权限Scope及本事务内历史保护代码，且官方309项实测全绿；本次并不否定这些成果。尚未证明Refund父源、版本化授权调用和竞争原子闭环，因此不能批准PR。当前版本**仅隔离非生产CI合成**，更不得当作真实交易/退款系统。

## 二、B定向整改验收清单

1. 保留原分支，基于当前最新main规范，严格只在`engineering/f06/lock-transaction-http-pg16/**`以及单现有本批Workflow文件内整改；所有父源码、旧workflow、公共M94/24迁移/PDM Final和生产Issuer不得修改。任何原父Ref历史兼容仅在验证真实GitHub Push/HEAD/Run、测试权限和隔离DB后向子进程传递，绝不能改变真实Run事实。
2. 取得并验证真实F06-3C1合法测试Refund父签名来源与sidecar、状态事件和permission/scope；合法pending须导致本Transaction拒绝。缺可信已签父源则为`BLOCKED_TRUSTED_REFUND_SOURCE`，不能用直写public模拟已签父证；可保留裸pending作为单独FailClosed负例。
3. 追加至少三组**两个独立PG16 backend实际提交争用**：①真正签名退款先commit→交易拒绝；②交易先commit→旧Lock真正签名退款拒绝；③同时启动→最多一个事务合法commit、另一方无半写。须记录双方backend PID与结果、Lock/Transaction/Refund/Deposit、请求键和审计，验证撤权/PG锁竞争Rollback不污染历史。验证合法签名`closed_without_payment`（或显式保守拒绝且保留功能缺口），关闭来源事件缺失时硬拒。
4. 原旧父九组257/257、新原43/43/TLS9/9不得删弱，最终同SHA真PG16单Job追加新用例，所有项0失败/跳过/取消，父161Manifest、24迁移与新的两物理OID全表恢复完整通过，官方Run完成`READY_FOR_A_REVIEW`且最终HEAD一致。
5. 更新B中文`B自验与A交接.md`、Issue #136附真实HEAD、Run/Job、测试新增项、双方PG PID/事务、父Refund签名证据与保留来源缺口，提交`READY_FOR_A_REVIEW / NEXT_OWNER=A`。B不得自行新建PR或合并main。下一A只复核本批新增真实缺口及保留回归，无需重做已合格工程包。

## 三、当前A主控正式出口

**不创建Transaction PR，不合并B分支，不放行下一F06/F07/F08或生产。** 只发布工程定向整改单与状态更新。用户无需逐项介入；下一责任窗口B在已授权范围内自行修复，再交A独立终验。旧F06-3B直接转换`UPSTREAM_F06_3B_LOCK_PENDING_TRANSACTION_CONVERSION_GAP`、生产Transaction Carrier和正式资金Issuer缺口继续明确开放；V1整体`NOT_READY`，新增付费预算$0。
