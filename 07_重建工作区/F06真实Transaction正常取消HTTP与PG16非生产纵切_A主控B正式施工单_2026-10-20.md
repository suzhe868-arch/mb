# 名邦汽车 V1｜F06真实Transaction正常取消HTTP与PG16非生产纵切｜A主控B正式施工单

> **A正式放行** `F06_REAL_TRANSACTION_CANCEL_HTTP_PG16_01_A_RELEASED_FOR_B`，下一责任窗口B。仅在可销毁PostgreSQL16与127.0.0.1上进行**合成Transaction in_progress→cancelled**，禁止生产成交/退款/资金或部署。下一A独立验收与合并。B不自行创建PR或合并main。预算新增$0。

## 1. 当前任务与前置

- 唯一任务：`F06_REAL_TRANSACTION_CANCEL_HTTP_PG16_01`
- 正式[Issue #144](https://github.com/suzhe868-arch/mb/issues/144)
- B指定分支：`feat/f06-real-transaction-cancel-http-pg16-01`，**必须从执行时最新main创建**，不固定提示词内历史SHA。
- 父签主链：已正式验收LockRequest HTTP/PG16、Lock生命周期、合成Deposit HTTP/PG16、真实合成Lock→Transaction原子转换PR139、已签退款pending/无付款closed PR143。PR143受验B SHA `71af0d0d6c98062bc93dc391db8b3bb685ed82d2`，同SHA官方Run `39407777531`/Job `118577807940`，父319+新Refund63+TLS10＝**392/392**，0失败/跳过/取消，标准GitHub PR143 merge `a1b2791e37a6f3ce82082882d74dcc7244df912f`。仅追溯，不以旧SHA代替B本次最新main核验。
- 唯一产品Authority：`07_重建工作区/PDM-19_最终完整规则.md` §§2、6～10、15～18、21～26、29～31；PDM-18 Final锁历史/释放，PDM-02/03权限、PDM-17公海、PDM-25审计。正常cancel只限当前合法`in_progress`；`completed`走成交纠错而非cancel；`cancelled`不可复活。终止不得恢复已转换Lock/Waitlist/Priority，不自动改source_status/visibility/listing_cycle/价格，不做假relist/today-new，任何已签Deposit、Refund、历史Actor/Reason原封。

## 2. 必须先做的源签兼容核查，Fail Closed出口

1. **明确不同父签合同**：历史冻结`engineering/f06/transaction-cancel-ci/service.mjs`的原生`signedOrigin`要求`f06_3b_ci.transaction_origins`旧原生3B签名；PR139新真实原子合成Transaction使用`f06_real_tx_ci.origins`。B不得默认旧4A/4C可操作新PR139创建的Transaction；不得因为public.transactions存在就自认签名来源可信。
2. 在同一隔离PG16环境读取当前真实3B/4A/4C及PR139签名协议、查询原生PG catalog/事务来源，形成清晰的**兼容性矩阵与测试**。必须确认PR139合法Txn仅凭经真实原生3A/Lock/3C1签验及新的`f06_real_tx_ci`签名溯源，能否被现有4A/4C合法签发cancel。如果不能且新增版本化受限适配器可在不改原签父字节、公签表/迁移/权限的情况下合法创建取消状态/历史，那么新Cancel侧表只能在本白名单目录隔离创建，并用**单个PG16事务**完成真`public.transactions.status`、源签名Cancel/事件、Key、审计、保护检查。绝不能手工INSERT伪造`f06_3b_ci.transaction_origins`、偷改签名4A/4C或在两独立物理数据库中拆成两个交易。
3. 若真实父物理约束、签名PDM/资金和新PR139来源无法以本白名单范围合法承载**同一可验证cancel事务**，应`BLOCKED_SIGNED_REAL_TRANSACTION_CANCEL_SOURCE`提交代码/PG16诊断与A裁决请求。**没有依据就不能自称实现真Cancel**，不可新添未经授权的生产Carrier。A不要求为了凑CI数量而用Mock或源造假。

## 3. 在可信源基础上实现的业务规则

- 单个合法`in_progress` Transaction才允许当前真正签名 Employee responsible 在有效Session及独立permission+capability+Team/Store/Object Scope内取消；经理/店长不因职位自动获得权，4S/SystemAdmin、非负责人/撤权会话/停用员工或Customer/跨scope硬拒。责任交接有真实签名新当前负责人时也应尊重PDM-19§9当前responsible，不能凭原始Lock负责人越权。
- 按锁序Vehicle→Transaction→源Lock→Refund/Deposit资金真实性校验；要以PR139真实签名当前Txn origin、来自原合法Lock的不可变快照、已签3A Deposit/Correction以及3C1已签旧Lock Refund排除规则校验。来源缺失、资金不明、仍pending Refund、已支付退款凭证、载体签名漂移、主体Customer/Vehicle/cycle不一致时统一FailClosed，**绝不假装已退款/已付款/已成交**。合法不会退款的closed不计付款。任何风险若需新资金业务Authority另行提出。
- cancel只形成真实`cancelled`终态、非空reason、真实actor/time、唯一受限source、append-only事件、签名请求Key与现时Audit；Status+Sidecar+Key+Event+Audit在**同一PG16 COMMIT**。注错/掉线任何阶段必须完整ROLLBACK；并发两个不同Backend同Tx至多一个状态转移，合法同Key幂等，冲突Key拒绝。
- **不要把申请新交易时的“Vehicle仍在售/ListingCycle必须开放”等条件强加于已经存在合法in_progress的cancel**。在来源车后续供应异常、不可售或期次自然变化时仍需按当前真实责任与资金规则能够**安全终止**，以PR143“合法待退款可结案”的问题为教训。绝不借“终止”把Vehicle自动重新上架/重新锁定，不能把旧Lock复活。
- 当前Customer若有pending退款/在途其他业务责任，cancel不能清空真实其他职责或直接扔公海；跨Priority/Recommendation/Consultation/Demand维持PDM各自权威，不越权修改。交易取消不自动申请退款，后续合成Transaction侧退款需另一已签授权。

## 4. 工程白名单与隔离

- B分支**只允许新增**`engineering/f06/transaction-cancel-http-pg16/**`与`.github/workflows/f06-real-transaction-cancel-pg16-onejob.yml`。
- `engineering/src/**`、`engineering/scripts/**`、`engineering/sql/**`、`engineering/integration/**`，旧所有F06父Service/Runner/Workflow、PDM Final、公签M94-v26/24迁移和真实前端/后端路由、生产Issuer与数据库/权限均只读。
- 新入口只`/__ci__/f06-real-transaction-cancel/**`严格127.0.0.1真HTTP；生产`/api/v1/transactions/:id/cancel`、`complete`、真实退款付款/银行微信及客户敏感端点均404/拒绝。所有数据必须**合成**，连接`postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test`，PG16非超级用户无createdb。严核真GitHub仓库/Push/本分支SHA/Run/consent/CI隔离，无证硬拒；仅可经核实的旧签父兼容子进程暂时传入历史Ref，不改变实际Run/SHA/Checkout。
- 仅免费标准`ubuntu-24.04`单Runner、单`postgres:16-alpine` service、**单Job**，`permissions:contents:read`，仅本分支push+两个白名单paths触发，必须真实全库Workflow预检`push_matches=1/pr_matches=0`，不得新增付费Runner/并行matrix/Artifact/付费缓存，总付费预算$0。

## 5. A最终独立验收门槛与交接

1. **最终B同SHA官方Push单Job**完整原生重跑本批父`392/392`（父257+Txn53+TLS9+Refund63+TLS10），不拆Run/SHA拼凑，0失败/跳过/取消。
2. 本批新增真实Cancel HTTP/非超管PG16 >=**32**条，TLS/生产/真资金拒绝>=**9**条，最终总计>=**433**且全0失败/跳过/取消。必须包含真实新PR139 origin签验、权限/Scope/责任、余额/旧pending排除/未知资金/拒绝Ref漂移、非正常current Vehicle供给下in_progress安全取消、同Key与冲突Key、状态终态唯一、并发双Backend、故障注错Rollbacks、不能恢复Lock/Waitlist/Priority、不能制造新ListingCycle/虚假展示。
3. 父四Schema完整**161张真表**逐表COUNT+MD5、24迁移Ledger、Public Catalog/D1/F06-1/F06-2原生签名、真3B/3C1签名来源，再完成物理**不同OID**业务情境/独立审计库恢复，前后全行Seal完全一致，证据包含OID/PG backend PID/SQLSTATE/真业务事实。新增Cancel sidecar是新实体，不能将其混入161旧冻结父范围冒称“只有161张全部数据库表”。
4. 安全预检：真实GitHub `event=push`、HEAD/Run、Branch/paths精准触发、父Runner原生无mock、TLS隔离不泄token/VIN/手机号/金额资金明细、只读GitHub Token、无真实资金。
5. B在新目录`B自验与A交接.md`中完整中文交付同SHA官方Run/Job、每组测试计数、签名新Txn↔4A/4C来源兼容矩阵与结构证据、签名原生父复核/全行Seal/不同OID、全部2-backend竞态与Rollback、资金与生产缺口、实际范围白名单；按`F06_REAL_TRANSACTION_CANCEL_HTTP_PG16_01_B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A`通过Issue #144正式交接。B不得创建业务PR/合并main，A独立审核达到同样标准后再合并。

## 6. 不授权

未经用户另行授权，本任务不得完成真实成交`completed`、首次收款、资金纠错或任何实际退款、`refunded`、`refund_payments`，不得打开微信/银行/在线支付或生产Client/Employee业务路由、改生产DDL/永久权限、实际客户资料、部署、UAT或外部写入。F06/F07/F08及V1整体仍`NOT_READY`；B只在既定白名单的可销毁CI测试内持续施工至交A验收。
