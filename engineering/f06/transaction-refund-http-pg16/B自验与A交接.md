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
- 本批新增真实HTTP/PG16测试不少于40项；本次实现计划覆盖64项，涵盖父签名来源、合法/超额净余额、正负Correction、Lock/Transaction主体冲突、权限撤销、并发、幂等、无付款关闭、车辆不可售/ListingCycle结束、伪退款/未知Deposit拒绝、SQL注错回滚及Audit/历史不变。
- TLS拒绝测试不少于10项；实际生产Refund/Payment/Transaction路由和隔离CI路由必须拒绝。
- 预期至少`445 + 64 + 10 = 519`项全通过，0失败、0跳过、0取消；父161张原始表、24条迁移、原Catalog与完整行Seal必须在不同PG物理OID恢复前后一致。
- 新工作流为单Job、免费Ubuntu Runner、单PostgreSQL 16服务、只读仓库权限，不上传敏感Artifact、不申请额外付费Runner。

## 5. 交接条件
最终以本批官方Run/Job中真实HEAD、PostgreSQL backend PID、源/审计/恢复OID、161表/24迁移全Seal、父445和新增HTTP/TLS原始日志为准。只在全部条件通过时将状态设为`READY_FOR_A_REVIEW / NEXT_OWNER=A`；否则必须记录具体失败项并保持阻断，禁止跳过测试或用Mock补齐。

## 6. 定向自检补充
- 父PR146同SHA嵌套全量脚本中的旧分支path-only preflight不适用于新分支，临时执行器仅对那些**旧路径触发预检**作明确不适用提示；原生迁移、真实HTTP/PG16业务/TLS、失败回滚、原161父表Seal不跳过，新分支专属workflow触发预检必须在前后原样通过。
- 父方案恢复后得到的是**干净数据库**，故在新Refund实验前需要重新执行冻结原生3A/3B/3C1/4A的apply/verify，再恢复PR139和PR146侧车、由PR146官方runner签发Cancel attestation，禁止伪造原生3B Transaction origin。
- 新增测试场景复用实际存在的8台合成Vehicle/Cycle，不创造不可验证的第9～11台。
- 金额计算和「最终重验忽略当前新退款」必须对PostgreSQL `bigint`字符串ID作数值归一，否则会误把自己当成另一笔pending，错误拒绝合法全额退款。
- 两个PG backend独立PID只能证明并发操作和唯一提交；若共享Employee Session先被锁，则**不能宣称双方同时持有Vehicle锁**。
