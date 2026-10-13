# 名邦汽车 V1｜F06-4A A主控正式完整施工单：合成Transaction正常取消与责任占用释放（仅隔离CI）
> **2026-10-14 A正式技术放行**：`F06_4A_A_RELEASED_FOR_B_CI_ONLY / NEXT_OWNER=B / NEXT_TASK=F06_4A_SYNTHETIC_IN_PROGRESS_TRANSACTION_NORMAL_CANCEL_CI_ONLY`。只允许真非特权可销毁PG16中合成 `in_progress → cancelled`；不得完成成交、记录真实退款、真实支付、修改生产Issuer或部署。

## 一、依赖与唯一Authority
1. 已签产品唯一Authority：`07_重建工作区/PDM-19_最终完整规则.md` §§2、6–11、15–18、21–26；另引用PDM-02员工角色权限和对象Scope、PDM-03 Customer owner、PDM-07档案规则（仅作为completed不放行说明）、PDM-13 Priority、PDM-17公海、PDM-18 Lock/Waitlist、PDM-25不可变审计。本施工单不得修改用户已批准的产品规则。
2. 前置F06-1 PR52、F06-2 PR53、F06-3A PR54、F06-3B PR55及**F06-3C-1 PR56**全部A独立验收并标准合并。PR56末次B HEAD `177c810a1198bd8e97815748c05e4c07d0b0906b`、合并SHA `54d206d633d47a29f675b52bdf5465d1d5d6a8e6`，16真Push全success、旧84项B同SHA自验、Source43/HTTPS9、129有效官方SHA256证据、物理OID39410→43953与168旧表全行Seal。A报告：07_重建工作区/F06-3C-1_A主控独立验收16条Push与129份原生证据_PR56标准合并正式报告_2026-10-14.md。
3. 本次只实现从**原F06-3B正式签名合成Lock→in_progress Transaction源**出发，由具合法且当前有效的 Transaction responsible/员工Session、对应permission、scope、object状态与现时所属关系，在**同一真实PG事务**完成普通 `cancelled` 与不可变事件/原因/actor/time；余额、Deposit、Refund、原Lock快照与其他责任历史只读保持。
4. 初始**物理Carrier及合法权限来源审计**：先核公签 `public.transactions` 真实列、状态CHECK、FK、历史/Trigger、`f06_3b_ci.transaction_origins`和已签事务转换历史。若公签事务无法无歧义承载取消原因或独立权限来源未签发，**只在本批安全合成Sidecar记录并标明生产 `TRANSACTION_CANCEL_CARRIER_SOURCE_GAP`**；禁止在正式M94-v26、公签交易业务层、旧迁移/父Sidecar造假或改写。

## 二、唯一实施范围与源隔离
1. B从执行时真正最新main创建独立分支 **`feat/f06-4a-transaction-cancel-ci`** 和新PR。**仅新增** `engineering/f06/transaction-cancel-ci/**` 与 `.github/workflows/f06-4a-*.yml`。旧F03/F04/F05、F06-1/2/3A/3B/3C1字节与已签Workflow、24旧Migration Ledger、公签M94-v26、PDM/IA/LowFi/H01及生产Issuer一律只读，不修改main，不自行合并。
2. 强制环境：真正GitHub `event=push`、`GITHUB_ACTIONS=true`、`CI=true`、`APP_ENV=test`、`NODE_ENV=test`、仓库`GITHUB_REPOSITORY=suzhe868-arch/mb`、Ref须为本分支；仅 `postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test`，现有F03/F05隔离确认，PostgreSQL16 `f03_ci` 非超管无CREATEDB且GitHub令牌只读。环境/来源不符合即Fail Closed，无线下真实账户或支付凭证。
3. 可在独立可销毁PG16构造最窄 `transaction.ci.cancel` 合成显式permission+scope来测试正反例；**不把合成权限冒充生产已签权限**，标明 `PRODUCTION_TRANSACTION_CANCEL_PERMISSION_SOURCE_GAP`，经理/店长职位本身无自动放权；系统管理员控制面、4S、非Responsible、离职、停用Customer、越店/越Team、授权撤回旧Session硬拒。
4. 原子顺序：按Vehicle→source Lock/Transaction→真实责任/Scope→原Deposit/Refund只读来源→取消状态及其append-only Sidecar→最终COMMIT重检；不将旧Lock改回active，不恢复旧Waitlist、Priority，不改Customer owner、推荐权、Consultation/Demand历史、旧资金Ledger，不自动源状态/可见性重上架或新周期。普通cancel仅in_progress；completed拒绝、已cancelled永久终态，重试只能按原幂等键安全返回历史，不得重复事件。
5. 取消后根据PDM19§§21/25，**只开放隔离CI的合法终态来源可审计投影**供以后Transaction Refund测试消费；本包**不得创建/支付/确认任何Transaction Refund、不得写实际refunded/refund_payments、不得创造completed成交或实际deal price**。旧F06-3C1 Lock侧Refund如有pending，必须保持其原有资金和公海Guard，不擅改归属；Transaction取消后客户公海仍要检查其它未完成责任。

## 三、真实独立测试与发布门禁
1. 本域新Source至少**32项**真PG16正反例：公签实际Carrier/Source seal、签名原始in_progress→cancelled合成、当前合法Employee现时Responsible/权限Scope、跨门店/Team/4S/SystemAdmin/离职/disable/撤权后COMMIT拒绝、不同Customer/Vehicle/listing_cycle/Lock错配、幂等同键重试和键跨Subject复用拒绝、同Vehicle双后端取消竞争、注错AfterStatus/AfterEvent/BeforeCommit完整Rollback、append-only历史、completed与cancelled重入拒绝、原签不可变Deposit/Correction/Transaction origin/价格/Lock与Waitlist/Priority不复活、独立PublicPool Guard、不可用资金源Fail Closed。
2. 本域新HTTPS至少**9项**：loopback真TLS+PG16拒绝无Session/伪造Token/已撤权/跨Scope/4S/SystemAdmin/生产Transaction cancel/complete/Refund/支付/敏感字段泄漏等；不能在生产路由返回可执行业务的200。
3. 新最终SHA必须冻结旧F06-3C1 **16条Push/84项独立PG16 Job（H52为52项）全部实际新SHA重新跑**；新建本批 Source+HTTPS 两个独立真PG16 Jobs，最终目标**17/17真正push同最终HEAD全部success、至少86/86真PG16 Job success、H52完整52/52、>=22本HEAD官方有效非空未过期`sha256:` Artifact**，包含旧F06-3C1 Source43/HTTPS9、F06-3B Source35/HTTPS9、F06-3A Source28/HTTPS9及其父冻结回归。旧`pull_request`历史运行不能冒充本次门禁；公共Docker限流只可同SHA官方补跑失败任务。
4. 合成物理情境库与独立审计库必须真不同数据库 OID，前者销毁后在后者独立重建；**至少172张旧public+D1/F06-1/2/3A/3B/3C1父表**（以真实Catalog逐张数为准）必须全行COUNT+MD5对比，原24条Ledger、Public Catalog、D1和五父Sidecar原封；新源日志必须给OID/PID/SQLSTATE和事务回滚、原始与最终Seal。
5. B先完成整包源码、反向安全审计、完整冻结回归、最后SHA证据；完整中文 `engineering/f06/transaction-cancel-ci/B自验与A交接.md` + PR正式签署，列**17 Run ID/86 Job ID、≥22 Artifact ID及官方摘要、Source/HTTPS、双OID/172表封印、真正Fail Closed/GAP**，再标`READY_FOR_A_INDEPENDENT_REVIEW / NEXT_OWNER=A`。B绝不自行merge或更新main。

## 四、明确未放行事项与责任
- 禁止：F06-3C-2任何真实 refunded 或实际退款凭证、真正Deposit/Transaction/Refund财务收付款、completed Transaction、成交actual_price及纠错、生产Operation Issuer/定时器、真实员工Customer/JYT微信飞书、前端UAT、部署上线、F07/F08。F05/F06全域、C/H01、V1仍 NOT_READY。
- **唯一下一责任B**，执行分支 `feat/f06-4a-transaction-cancel-ci`。A只接受本工单CI-only交审，后续再独立验收/标准PR合并。
