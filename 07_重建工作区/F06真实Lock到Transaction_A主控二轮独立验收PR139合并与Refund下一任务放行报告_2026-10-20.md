# 名邦汽车 V1｜F06真实Lock→Transaction：A主控第二轮独立验收、PR #139标准合并及后续Refund放行

- 日期：2026-10-20
- 完成任务：`F06_REAL_LOCK_TO_TRANSACTION_HTTP_PG16_01`
- 结论：`A_ACCEPTED_NONPRODUCTION_HTTP_PG16 / PR139_STANDARD_MERGED`；**仅非生产合成交易与隔离数据库通过，并非实际Transaction/资金上线**
- 原问题：[Issue #136](https://github.com/suzhe868-arch/mb/issues/136)；A首轮整改单与状态合并 [PR #138](https://github.com/suzhe868-arch/mb/pull/138)
- 受验B工程分支：`feat/f06-real-lock-transaction-http-pg16-01`
- 受验最终B HEAD：`20bb5333b3fb2b64fe9fde8f1e8ac6ba65ff182b`
- A标准合并：[PR #139](https://github.com/suzhe868-arch/mb/pull/139)，GitHub merge结果`merged=true`，实际merge SHA **`7ebd75337d2bbf1bd37bd697fc58cb0c19888774`**
- 下个任务：`F06_REAL_REFUND_PENDING_CLOSED_HTTP_PG16_01`；B负责，[Issue #140](https://github.com/suzhe868-arch/mb/issues/140)

## 一、独立验证的正式GitHub事实

1. A复验时原`main@35ac839a73d1529a24c3ffde089b8517cb01f78e`（含PR138拒验治理报告），B末次HEAD相对main ahead15/behind7，差异文件仍仅**10个新文件**：`engineering/f06/lock-transaction-http-pg16/**`与`.github/workflows/f06-real-lock-transaction-pg16-onejob.yml`；这些全为原正式施工单白名单，`src/scripts/sql/integration`、旧F06父、公共M94/24迁移、PDM Final及生产路由零修改。B没自行建PR或合并。
2. [官方最终Push Run #39395616127](https://github.com/suzhe868-arch/mb/actions/runs/39395616127) / [Job #118537844979](https://github.com/suzhe868-arch/mb/actions/runs/39395616127/job/118537844979) 均`completed/success`，完整末次HEAD与日志`READY_FOR_A_REVIEW branch=feat/f06-real-lock-transaction-http-pg16-01 head=20bb5333... run_id=39395616127`相同；旧临时失败/取消Run不被改写成成功。
3. 既有真实Lock/Deposit九组 **257/257**，本包Transaction HTTP/PG16 **53/53**（原43 + 真实签名Refund及并发新增10），TLS硬拒 **9/9**，累计**319/319**，均0失败、0跳过、0取消。标准免费Ubuntu24.04单Runner、单postgres:16-alpine、单Job、GitHub`contents:read`，Workflow preflight实际检查340个工作流、仅本分支push匹配1、PR匹配0；无新付费/Artifact上传。
4. 原生F06-2签父阶段158表、F06-3A后阶段完整四Schema **161张父表**，同Run原生父Manifest表名、每表COUNT/MD5、总体Digest独立核对；24条原Ledger、公签Catalog `5495c6d6ccecc628e1b27c5bfe4f3664a76b4c38a1fa732b6e2baa4ebb5e99f4`与D1/F06-1/F06-2前置签名保持。真实源OID **35217**、审计OID **39333**、初次恢复OID **43579**、本Transaction实验后恢复OID **60879**，完整行Seal SHA256统一为 `81420ad98d06e8ae3312173b4a8d148225cc879b8a3332d6763f01eee07c341a`，前后保持一致。
5. 原生F06-3B/3C1父侧表经原生Runner `apply/verify`，日志明确 `F06_3C1_APPLIED`/`F06_3C1_VERIFIED`，3C1父源码checksum `b97fbb3ecaca9fdb75342f5efe80cacc30ccfbf703ea362aa8f03bb65c04e06d`。已签退款缺席时即使公共退款行数为0也fail closed；合法pending/closed均由冻结原生受限授权退款服务签发，手工裸pending只用于额外不可信来源负例、不作为合法来源。
6. 通过具体原生案例：①已签旧Lock pending Refund先Commit，新Transaction请求以`F06_TX_LOCK_PENDING_REFUND_DENY`拒绝，无半写；②Transaction先Commit，旧Lock合法Refund服务以`F06_3C1_OWNING_TRANSACTION_REQUIRES_SIGNED_TERMINAL`拒绝；③独立Node退款桥IPC就绪后与HTTP同时发起，两个**不同真实PG16业务连接Backend PID 898/914**，本Run记录Transaction HTTP201成功、退款拒绝、单车Transaction正好1、Pending退款0、原Lock已按可信原因结束。另已签pending→closed_without_payment两事件后交易可合法转换（request PID916、close PID925）；无签public closed、缺3C1父Carrier零退款行都硬拒，资金/Lock/原历史原子回滚。
7. **竞争证据边界（不得夸大）**：两个独立业务连接确实同时被请求调度、真实执行并只一成功；但现行`IsolatedAuth.withSession`在进入车辆加锁前先保护签名员工账户/Session。同一负责员工的两个会话可能在此层先串行化，不能宣称证明两个事务同时占有Vehicle行锁。A评估：本包只面向受限签名当前负责员工的CI合成业务，已有真实双连接受控互斥、退款与Transaction双向前后状态、事务内统一Vehicle→Lock锁序及安全拒绝，可接受为**本批非生产纵切范围**。此限制列为未来生产Issuer/跨主体授权前的额外真实锁等待/交叉主体多用户并发门禁，而非无依据宣称生产并发已全面验证。

## 二、资金与权限边界

新增代码只在可销毁PostgreSQL16与127.0.0.1下，通过真实HTTP测试Employee签名Session、现时permission/capability/Scope、来源签名Lock和Deposit，原子生成合成in_progress Transaction、将来源Lock按已签约束真实结束，并追加不可变请求Key、Audit和合成源Sidecar。生产应用源不包含新业务路由。老`engineering/f06/lock-transaction-ci`直接入口`UPSTREAM_F06_3B_LOCK_PENDING_TRANSACTION_CONVERSION_GAP`仍是有已知风险的历史基线，本包**不声明修好旧入口**；本批新增版本化入口通过真实签名退款守卫。生产Transaction Schema Carrier/Issuer、真实收款/真实退款资金Carrier与正式Source仍缺失；任何真钱、真实Transaction成交确认、退款到账、UAT/部署未获授权。

## 三、后续A正式放行

- 新任务：`F06_REAL_REFUND_PENDING_CLOSED_HTTP_PG16_01`
- 下一责任：**B工程执行**；受验及主线合并：**A主控**
- 追踪：[Issue #140](https://github.com/suzhe868-arch/mb/issues/140)
- 施工单：`07_重建工作区/F06真实Refund申请pending与无付款关闭closed_HTTP与PG16非生产纵切_A主控B正式施工单_2026-10-20.md`
- 新指定分支：`feat/f06-real-refund-pending-closed-http-pg16-01`；B必须从其开工时最新main建立，**不依赖本报告的旧SHA判断当下进度**。
- 施工范围仅是可信旧Lock合成Refund申请pending、无实际支付的closed，并进一步验证与已验Transaction安全互斥。Transaction侧退款在合法真实Cancelled/Completed签署能力前不授权；`refunded`、退款实际支付流水、真实资金或生产接口均未授权。B遵循新单在唯一白名单内连续完成同SHA真实CI与证据归档后交A；无需用户日常反复点继续。
- F06/F07/F08整域、C视觉未确认的PR #68与V1整体仍`NOT_READY`，生产资金/外部Issuer缺口未闭合，新增付费预算**$0**。
