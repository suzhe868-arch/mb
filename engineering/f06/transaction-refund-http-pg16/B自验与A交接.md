# 名邦汽车 V1｜F06真实Transaction侧Refund申请与无付款关闭｜B自验与A交接

## 1. 正式任务与边界
- 正式施工单：Issue #147，`F06_REAL_TRANSACTION_REFUND_PENDING_CLOSED_HTTP_PG16_01`。
- A 已验收并合并PR #146；B本批独立工作分支：`feat/f06-real-transaction-refund-http-pg16-01`。
- 只允许非生产、非特权、一次性PostgreSQL 16合成场景；不得建PR、合并main、改旧F06父代码、公表迁移、生产API、真实付款/退款Issuer或生产权限。
- Refund主体必须为`public.refund_cases.transaction_id = 已签名且被PR146合法取消的Transaction ID`，且`lock_id IS NULL`。不得将Lock-side Refund改绑或冒充Transaction-side Refund。
- 本批只实现`pending`申请与`closed`无付款关闭；真实`refunded`、`refund_payments`写入、资金Issuer、微信/银行、completed/成交价、UAT/生产部署均明确`NOT_AUTHORIZED`。

## 2. 必须满足的来源签名矩阵
1. 原生F06-3A Deposit Receipt/Correction：每笔公开Receipt与不可变provenance一一对应；校验Customer、Lock、Vehicle、ListingCycle、原金额、操作员、时间及CNY。
2. 原生F06-3B Lock→Transaction签名：`f06_real_tx_ci.origins/events/request_keys`一致，原Lock始终`released/converted_to_transaction`，快照和ID不可漂移。
3. 原生F06-3C1 Refund父链与24条迁移/公共Catalog Seal完整验证；既有Lock-side退款只能按原3C1签名验证，pending/实际refunded/未知支付或签名漂移均FailClosed。
4. 原生PR139 Transaction + PR146 Cancel：公开Transaction必须`status='cancelled'`且`completed_at IS NULL`；Transaction源、取消原件/事件/幂等键、原Lock、Audit及父侧车SHA全部匹配。不允许仅凭公表状态或伪造旧3B来源签发退款。
5. 本批新增`f06_real_tx_refund_ci`只用于隔离PG16：独立Attestation、Refund Origin、append-only Event和全局幂等Key。每次读写都重验父签名、源摘要和当前权限；公表结构不变。

## 3. 资金余额与归属规则
- 每次申请重新从已签Deposit及其不可变Correction/Reversal推导净余额：`净Deposit = Σ(原始已签Receipt金额 + 每笔已签Correction/Reversal delta)`。
- 只有每笔Receipt和Correction都能回溯到原生3A签名Key时才可计入；负净额、溢出、未签Receipt、未知Correction、跨Lock/Transaction归属、公共退款事实和侧车摘要不一致均拒绝。
- `available = 净Deposit - pending额度承诺 - 已实际退款金额`。任何实际Payment/`refunded`来源当前未获授权且不可可信复核时，必须FailClosed；不得虚构“已退款”金额。未知/未签pending也不能忽略。
- 同一Transaction在存在待处理pending时不允许冲突的第二笔；合法closed以后必须用新Key创建新Refund，不能复活或改写原Refund。相同Key/Actor/Action/Subject/Payload重放幂等；相同Key换Actor、Subject、Action或Payload冲突。
- 请求与关闭均要求当前负责员工、同一笔退款管理Permission（PDM-19禁止另设close专用Permission）、Capability、当前Team/Store/Object Scope和有效Session；SystemAdmin/职位/4S身份不自动授权。
- 关闭仅在pending、签名源仍完整、无实际付款时，将同一Refund关闭为`closed`；不改Transaction、Lock、Deposit、Correction、车辆可售状态或ListingCycle。供应变更、车辆不可售、期次结束不阻止合法无付款关闭。
- 车辆→Transaction→Lock→Deposit/Refund统一加锁顺序。公表Refund状态、Refund Origin、Event、Key和Audit必须在同一PG事务内提交；注错必须全回滚。

## 4. 同SHA官方验收门槛
- 先在本次GitHub Push同一SHA完整重跑PR146父链`445/445`，不得拼接旧Run测试数字。
- 本批新增真实HTTP/PG16测试不少于40项；本次实现计划覆盖65项，涵盖父签名来源、合法/超额净余额、正负Correction、Lock/Transaction主体冲突、权限撤销、并发、幂等、无付款关闭、车辆不可售/ListingCycle结束、伪退款/未知Deposit拒绝、SQL注错回滚及Audit/历史不变。
- TLS拒绝测试不少于10项；实际生产Refund/Payment/Transaction路由和隔离CI路由必须拒绝。
- 预期至少`445 + 65 + 10 = 520`项全通过，0失败、0跳过、0取消；父161张原始表、24条迁移、原Catalog与完整行Seal必须在不同PG物理OID恢复前后一致。
- 新工作流为单Job、免费Ubuntu Runner、单PostgreSQL 16服务、只读仓库权限，不上传敏感Artifact、不申请额外付费Runner。

## 5. 交接条件
最终以本批官方Run/Job中真实HEAD、PostgreSQL backend PID、源/审计/恢复OID、161表/24迁移全Seal、父445和新增HTTP/TLS原始日志为准。只在全部条件通过时将状态设为`READY_FOR_A_REVIEW / NEXT_OWNER=A`；否则必须记录具体失败项并保持阻断，禁止跳过测试或用Mock补齐。

## 6. 定向自检补充
- 父PR146同SHA嵌套全量脚本中的旧分支path-only preflight不适用于新分支，临时执行器仅对那些**旧路径触发预检**作明确不适用提示；原生迁移、真实HTTP/PG16业务/TLS、失败回滚、原161父表Seal不跳过，新分支专属workflow触发预检必须在前后原样通过。
- 父方案恢复后得到的是**干净数据库**，故在新Refund实验前需要重新执行冻结原生3A/3B/3C1/4A的apply/verify，再恢复PR139和PR146侧车、由PR146官方runner签发Cancel attestation，禁止伪造原生3B Transaction origin。
- 新增测试场景复用实际存在的8台合成Vehicle/Cycle，不创造不可验证的第9～11台。
- 金额计算和「最终重验忽略当前新退款」必须对PostgreSQL `bigint`字符串ID作数值归一，否则会误把自己当成另一笔pending，错误拒绝合法全额退款。
- 两个PG backend独立PID只能证明并发操作和唯一提交；若共享Employee Session先被锁，则**不能宣称双方同时持有Vehicle锁**。

- 对抗性“已付款不可closed”测试严格放在本批**最后**：向可销毁数据库插入合成且不可篡改的 `refund_payments` 无授权资金事实，再经另一PG backend拒绝关闭。该父表已有F02 append-only保护，测试**不删除或改写原历史**；整套场景最终销毁并从已签父快照独立恢复。该对抗性数据绝不作为真实付款、正向Refund接口功能或生产记录。

## 7. A首轮独立验收未通过后的R1完整定向整改（2026-10-20）

A在[Issue #147评论#6292435088](https://github.com/suzhe868-arch/mb/issues/147#issuecomment-6292435088)拒绝了虽然520/520全绿但缺少“先合法pending后原生签名3A资金Correction、仍可无付款closed”组合用例的业务交付。治理[PR #149](https://github.com/suzhe868-arch/mb/pull/149)已合并main；本B业务原分支仍未合并。此次只动原11文件白名单，不改变冻结3A/3B/3C1/PR139/PR146父服务、公共DDL、生产权限、真钱Issuer。

**整改方案：不可变创建时资金水位与逐笔原生3A追加事件的严格前缀证明。** 本批可销毁PG16 Sidecar新增`f06_real_tx_refund_ci.deposit_snapshots`（每原Refund ID一条；同一PG事务与pending原件、Event/Key/Audit原子COMMIT；独立append-only UPDATE/DELETE禁止）。它含原生3A全部Receipt/Provenance/Adjustment和对应签名Request Key的请求时完整原始序列化快照、SHA256、原净额、Lock/Transaction主键、已签调整最大ID水位及创建时间。保留原不可变`origins.source_deposit_digest`，不是删除源摘要校验。

每次request/close/旧Idempotency/跨已closed历史再申请时，仍先通过`depositLedger()`逐行核验当前所有3A Correction/Reversal与源Receipt一一匹配、原生3A request_keys的event key/actor/Lock/deposit/amount、负净额和未知资金；再验证历史Snapshot JSON原SHA == 原Refund签名来源Digest，原Receipt/Provenance与当前全字节同值，每笔历史调整ID+原签Key+全部字段不变且仍存在。历史水位以后的新增调整必须ID更大、真实原生签名Key完整、Adjustment/Key时间均严格在请求时Snapshot之后；旧流水不可重排/删除/修改，未知或未签新Adjustment仍FailClosed。`pending`后正常变更的当前净额可与历史申请源快照不同，故不会误把合法追加的3A事件当作原Refund漂移；最新新request始终按最新净额扣减重算，净额为零拒绝新pending，原已签pending只在确无Payment时允许closed，绝不执行真正refunded。

**新增真实PG16测试**：原63与补充原2项（65）不删除；新增14项专门验证正Correction、负Correction（低于既有pending承诺）、完整已签Reversal净额变零仍closed、旧closed后签名追加、旧Request/Close同Key重放、按最新净额重申请、父3A真实注错Rollback、不可变快照/历史、未知无3A签Key的伪Adjustment在pending后无付款close FailClosed，测试均在原父161表/24迁移和独立多OID的可销毁PG16执行。TLS10保持不变。**本轮目标：父445 + 本批HTTP79 + TLS10 = 534项全通过**；只以新最终Run/Job真实结果为准，未成功不能标READY。源码白名单由新的SQL侧车、业务service、真实HTTP tests及中文B交接共四文件变化构成，不增加新旧工作流或资金权限。

明确边界：使用相同Employee签名Session和两真实PG backend，**不宣称两方同时持有Vehicle行锁**。单个非生产Stage成功不等于真实资金Issuer/生产授权或V1整体上线就绪。旧F06旧签名表、支付数据和普通客户数据不得变。

