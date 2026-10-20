# 名邦汽车 V1｜F06真实Transaction侧Refund｜A主控首轮独立验收与资金修正后无付款关闭整改｜2026-10-20

> A状态：`A_REVIEW_NOT_ACCEPTED / B_TARGETED_POST_PENDING_SIGNED_CORRECTION_REMEDIATION_REQUIRED / NO_BUSINESS_PR / NO_MERGE / NEXT_OWNER=B`。

## 一、有效的实证与验收边界

- 正式任务：`F06_REAL_TRANSACTION_REFUND_PENDING_CLOSED_HTTP_PG16_01`、[Issue #147](https://github.com/suzhe868-arch/mb/issues/147)、指定B原分支：`feat/f06-real-transaction-refund-http-pg16-01`。
- 本次受检B HEAD `38135893fe7d0a4d3595bf4f70f592f1e9f1ba17`，官方[Run #39431126990](https://github.com/suzhe868-arch/mb/actions/runs/39431126990)/[Job #118656156513](https://github.com/suzhe868-arch/mb/actions/runs/39431126990/job/118656156513) 同SHA成功：父445+新Txn Refund HTTP/PG16 65+TLS10=**520/520**，0失败/跳过/取消。官方Job阶段全部completed/success。
- A实际读取11个本批白名单文件、独立解析`service.mjs`/旧原生3A Correction签名行为/新增测试65个名称和关键断言、CI脚本、真Job完整日志。比较最新main前置 `ffe95ff0108b06958257195cf6d9a9a2f116422a`，ahead8/behind0；11文件均为新增且无越权旧签封修改。
- 真161冻结原表逐表COUNT/MD5、24签名迁移、源OID 78548/恢复OID 87764、独立审计OID 39338、全行Seal `ceee31903fb1d30c424720354292e1b07f5fdf6e3dba4932534c16715d2326a9`一致。实测业务PID1517/1545、两PG backend1594/1593至多一提交；同Employee Session先锁不冒称真正双Vehicle锁。合成对抗付款反例确证付款存在则关闭FailClosed。
- 继承父444等单SHA真实业务未跳过：临时Node shim只在嵌套父分支上跳过历史`trigger-preflight.mjs`改变路径校验，新分支自己的全库预检依旧真实执行，Push1/PR0。相关限制需要继续准确列示。
- 上述成功测试属于**有效证据**，但并不足以覆盖本文识别的跨模块组合缺陷，不能因测试全部绿灯直接A_ACCEPTED。

## 二、A独立审查发现的高优先级生命周期缺陷

**R1：已合法pending的Transaction-side Refund，在之后合法追加原生F06-3A已签资金Correction或Reversal后，会被新Refund的历史源摘要误判为Drift，即使未付款也无法closed；旧Refund历史拖累后续退款资格/幂等。**

原生`engineering/f06/deposit-ledger-ci/service.mjs`：`correctSyntheticDepositCI()`在当前经理/店长具备`deposit.ci.correct`权限、Scope合法时，允许原Lock为`released/converted_to_transaction`仍追加经F06-3A签名的Correction或Reversal。其`signedLock(c,l,false)`不要求Lock active，保留历史资金调整；此父代码已冻结不可修改。

新`engineering/f06/transaction-refund-http-pg16/service.mjs`：
- `depositLedger()`动态读取全部当前原生已签`f06_3a_ci.adjustments`，据此重算`src.depositDigest`；
- `refundCaseSource()`要求`origin.source_deposit_digest===src.depositDigest`，其中`origin`为Refund pending创建时的**不可变历史**摘要；
- `closeTransactionRefundCI()`在合法零付款关闭前必调用`refundCaseSource()`，合法后续Correction会返回`F06_TX_REFUND_CASE_SOURCE_DRIFT`，也会牵连幂等重放及已有闭合历史的`balancePool`验证；
- 现有测试仅测试先Correction后申请，并未在pending**之后**调用原生3A manager/store_head Correction并完成closed。这是签名原生父路径组合推导出的**未覆盖实质缺陷**，不能将猜测中的新实测次数写成已运行。

PDM-19 Final §§4、19–24明确允许资金Correction作为不可变追加历史，Refund pending的资金责任需要可核实关闭；真实零付款时不能因合法后续来源变动被永久卡死。不能通过将资金摘要检查简单删除、修改旧Origin或改签3A原生父来“绿灯”。

## 三、定向完整整改单（A在已授权范围内技术裁定）

1. **合法正向**：实际原生PR139合成`in_progress`→PR146签名取消`cancelled`→Txn-side `pending`→有权限的经理或店长使用现有**真实原生3A服务**签名追加正向Correction、负向Correction、Reversal至零余额→在无任何付款下经真实loopback HTTP关闭`closed`；不要求车源/期次继续可售。上述路径完整覆盖不同新Refund/至少两种更新后净额。
2. **签名与不可变历史**：原Refund创建时签名源Digest、净额、原生Key/Actor/Time不可逆保留；需要在本批新CI白名单内建立可信的**创建时历史签名水位/事件前缀**证明，和之后每一笔经原生3A Key签名的追加Correction/调整准确关联；或提供等价能在真PG16验证的安全方案。当前全部签名必须真验证；未知、伪造、缺漏/来源篡改依然FailClosed；不能把“历史快照不同于现时余额”作为自动拒绝原因。
3. **余额与资金责任**：合法pending不因事后合法Correction退无可退余额而无法在**无付款**场景关闭；关闭后新请求必须按最新净余额重算且不足就拒绝，历史`closed`不等于`refunded`；已存在真实Payment或付款凭据与原生签名漂移必须坚决拒绝close。禁止跨Lock/Transaction归属及跨车资金、零半写和旧锁复活。
4. **幂等与跨历史验证**：分别覆盖资金修正后同Key Request回放、Close回放，按未更改的Actor/Subject/Payload合法幂等，旧已关闭Refund不因之后合法签名Correction而阻挡另一笔符合现时余额的Refund；同Key不同主体/理由/金额继续冲突。
5. **受限测试/回归**：保留原生父445、本批已有65个新HTTP/PG16及10个TLS拒绝用例，不删除、削弱或改写旧结果；增加真实签名3A post-pending Correction/Reversal及错误注错回滚、伪签资金负例、余额与原件历史不可变对比。每个最终B SHA官方一个Push单Job完整重跑，父161张逐表COUNT+MD5/24迁移/不同OID完整Seal一致，0失败/跳过/取消，按实际新增计数汇报；不能新建付费Runner/artifact上传/生产权限。
6. **严格白名单**：B只能编辑原分支中`engineering/f06/transaction-refund-http-pg16/**`及专属`.github/workflows/f06-real-transaction-refund-pg16-onejob.yml`。旧3A/3B/3C1/PR139/PR146及公共DDL/M94/PDM Final/生产Issuer不可改，旧签名不可造假。若历史前缀无法在合法范围内签验，报告`BLOCKED_SIGNED_TX_REFUND_POST_PENDING_CORRECTION_SOURCE`交A技术裁定。
7. **责任交接**：B在Issue #147附新最终HEAD/Run/Job/PG PID/OID/Source摘要/完整新增测试矩阵，并更新中文`B自验与A交接.md`，达到`READY_FOR_A_REVIEW / NEXT_OWNER=A`后再交A；B仍不得自行创建PR、合并main。

## 四、独立结论与安全限制

本轮**不批准业务PR/合并**，不启动未满足依赖的后续F07/F08或生产真实资金。此前其他已验父门禁保留，但`520/520`不等于本任务完成。F06/F07/F08/V1总体始终`NOT_READY`；新增预算$0。

正式Issue A整改原文：[Issue #147 A审查评论](https://github.com/suzhe868-arch/mb/issues/147#issuecomment-6292435088)。
