# 名邦汽车 V1｜F06真实合成Refund pending/closed HTTP+PG16｜A主控二轮独立验收、PR143合并与下一任务放行

- 日期：2026-10-20
- 当前已完成任务：`F06_REAL_REFUND_PENDING_CLOSED_HTTP_PG16_01`；[Issue #140](https://github.com/suzhe868-arch/mb/issues/140)
- A正式结论：`A_ACCEPTED_NONPRODUCTION_REFUND_PENDING_CLOSED_HTTP_PG16 / PR143_STANDARD_MERGED`
- 受验B最终HEAD：`71af0d0d6c98062bc93dc391db8b3bb685ed82d2`
- 官方[Run #39407777531](https://github.com/suzhe868-arch/mb/actions/runs/39407777531) / [Job #118577807940](https://github.com/suzhe868-arch/mb/actions/runs/39407777531/job/118577807940)：同SHA `completed/success`，父319+本批Refund63（原56＋整改7）+TLS10 = **392/392**，0失败/跳过/取消；PR143 GitHub check success。
- A标准业务[PR #143](https://github.com/suzhe868-arch/mb/pull/143)已合并；merge SHA：`a1b2791e37a6f3ce82082882d74dcc7244df912f`。PR变更8个新增文件，全部白名单，没有旧父/生产代码/公共DDL/24迁移修改。
- A首轮拒验[PR #142](https://github.com/suzhe868-arch/mb/pull/142)的真实原因是，新Worker把申请pending的Lock仍active/未到期、Vehicle仍可售/ListingCycle未结束条件错误地施加于合法已pending的close，且未覆盖close SQL注错真实事务回滚。此缺陷在PR143内按A要求关闭。

## 一、A独立读取代码与官方原生日志所得事实

1. `worker.mjs`将`request`与`close`状态门禁分开：新申请仍验证现时Lock有效、可售、期次与原生签名资金；已合法签名pending的无付款close先锁Vehicle→Lock、校验原3C1来源vehicle/customer/Lock/cycle身份未漂移和当前responsible，然后委托**冻结的原生`closeSyntheticRefundCI`**在同一签名Employee Session/PG16事务内执行permission+capability+scope、真实Refund仍pending、已签来源/余额/资金、零付款、无owning Transaction、幂等/审计判定。没有修改旧3C1服务、公众表或生产权限。
2. 本批新真正PG16用例57–63：合法已签pending后将合成车源M94 `mingbang available→unavailable`，正常结束ListingCycle（**没有假造改变旧Lock签名终态**），新申请拒绝；老pending可经真实HTTP `closed_without_payment`，日志`F06_REFUND_PENDING_CLOSE_WHEN_SOURCE_UNAVAILABLE_CYCLE_ENDED`，原Refund ID10、backend PID1318，`refund_payments=0`、Transaction=0，原pending事件/金额/actor/time仍原样。同Key重试幂等，source仍不可售时新申请仍拒。
3. `AFTER_CLOSE_THROW`/ `AFTER_EVENT_THROW` 均经旧原生3C1注入真PG16事务异常；日志`F06_REFUND_CLOSE_AFTER_UPDATE_PG_ROLLBACK`与`F06_REFUND_CLOSE_AFTER_EVENT_PG_ROLLBACK`，先前合法pending保持pending，无半写closed状态、事件/请求Key/Audit、Deposit/Transaction/支付；随后正常关闭通过。旧385测试未删减；曾有一个中间Run因将“零退款行”误用于已新建历史的Lock而失败，B在新SHA改用从未创建退款的Lock8保持无Carrier零行负例真实严格，其余旧用例不删减。
4. 真F06-3B/3C1原生Runner Apply+Verify，冻结3C1 Source SHA `b97fbb3ecaca9fdb75342f5efe80cacc30ccfbf703ea362aa8f03bb65c04e06d`；父四Schema **161张完整签名表逐表COUNT/MD5**、24迁移Ledger/Catalog/D1/F06-1/F06-2等Attestations，本Run源OID35233、审计OID39349、父恢复OID43594、Transaction恢复OID60891、Refund最后恢复OID69611，完整行Seal SHA256始终 `8c964104eb9430c7162b9e6ff2402fd5d3df500d3ad15d9dab40003251aede2b`。
5. 旧上游CI319项同最新B SHA原生完整重跑，新Refund HTTP/PG16 **63/63**、TLS10/10，官方单标准免费Runner、一个PG16 service、一个Job、341真实Workflow触发核验Push=1/PR=0，0付费Artifact/Runner；真实Refund↔Transaction Backend PID1271/1272和双Refund PID1283/1282相互排斥，最多一方成功。但冻结`IsolatedAuth.withSession`可能因同Employee的Session/账户行锁先进行互斥：**这些事实不证明同时持有Vehicle行锁**。此更强车行锁等待/跨主体场景留作生产授权前专项，不影响当前非生产独立验收。

## 二、已验收边界，不冒充生产完成

本次批准的仅是可销毁PG16、127.0.0.1非生产真实HTTP链中的**合成Lock侧Refund申请pending**和**确认不实际退款的closed**。PDM-19 Final §19状态`refunded`是真实资金已退，本项目未签此类Issuer、未动`refund_payments`，不能将closed视为已退款或自动关闭资金。生产Transaction/Refund来源Carrier、真实收退款与官方资金Issuer、交易完成/卖车、外部银行微信写入、生产DDL/UAT/部署一律未开放。原F06-3B旧直接入口的历史风险不由本批新版本化交易解决。F06/F07/F08与V1整体仍`NOT_READY`，新增预算$0。

## 三、下一B正式施工

- 新任务：`F06_REAL_TRANSACTION_CANCEL_HTTP_PG16_01`；[Issue #144](https://github.com/suzhe868-arch/mb/issues/144)
- 下一责任：**B**；分支`feat/f06-real-transaction-cancel-http-pg16-01`，必须从B开工时真正最新main创建；A独立审查、标准PR合并。
- 新正式施工单：`07_重建工作区/F06真实Transaction正常取消HTTP与PG16非生产纵切_A主控B正式施工单_2026-10-20.md`
- 目标只在非生产真HTTP/PG16实现经PR139签名创建的真实合成`in_progress→cancelled`终止，**先核验旧4A/4C签名Cancel父Carrier与PR139新`f06_real_tx_ci.origins`的可验证兼容性**。不能把旧`f06_3b_ci.transaction_origins`手工伪造给PR139新Transaction。无可合法接线须`BLOCKED_SIGNED_REAL_TRANSACTION_CANCEL_SOURCE`交A，不改签名父源码/公共DDL。其他需按新工作单。
- 原父392项最终新SHA原生重跑，新增至少32真Transaction Cancel HTTP/PG16和9项TLS，总数≥433，全0失败/跳过/取消；父161表/24迁移/多OID完整Seal、互斥/终态历史/退款保护/权限/Scope/rollback真实证据必须保留。B中文交接达到`READY_FOR_A_REVIEW`后才交A，不建PR/merge。

本轮A对Issue #140验收完成并合并业务；A主控状态通过后续独立PR归档，下一责任B。
