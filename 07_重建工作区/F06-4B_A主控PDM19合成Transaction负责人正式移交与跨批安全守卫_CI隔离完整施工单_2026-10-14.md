# 名邦汽车 V1｜F06-4B A主控正式完整施工单：合成Transaction负责人正式移交及跨批安全守卫（仅非生产CI）

> **2026-10-14正式技术放行：`F06_4B_A_RELEASED_FOR_B_CI_ONLY / NEXT_OWNER=B / NEXT_TASK=F06_4B_SYNTHETIC_TRANSACTION_RESPONSIBLE_HANDOFF_CI_ONLY`**。仅真实非特权、独立可销毁PG16中的合成负责人移交；不得操作真实交易、成交、退款或生产Issuer。

## 1. 已签Authority、已合并依赖与目标
1. 唯一业务Authority：`07_重建工作区/PDM-19_最终完整规则.md` §9（Lock继承原负责人；Customer owner普通变化不漂移Transaction；原负责人inactive/离职/失权时必须正式handoff；old/new/actor/time/reason历史不丢）、§§6–8/10/15–18/21–26，PDM-02角色与权限/Scope/Old Token即刻失效、PDM-03 Owner/正式交接、PDM-17公海、PDM-18 Lock/Waitlist、PDM-25审计。引用已验收F03-2-2M真实签名Transaction responsible handover只读合同，但不能复活旧过时业务语义或修改已验收字节。
2. 前置PR52/53/54/55/56及**PR57**均已A独立验收并标准合并。PR57 B最终HEAD `d6c8731c05d0a4e1156b9efe7723f79434068d8d`、A标准merge SHA`b892d3b5ef1ff27dda0a6a145f8cb449807cea11`，A真实审核17 Push/86真PG16 Job(H52 52)、本域Source48/HTTPS9、131官方有效Artifacts、旧172表OID43953→48618全行Seal。A报告`07_重建工作区/F06-4A_A主控独立验收17条Push86项真PG16与131份证据_PR57标准合并正式报告_2026-10-14.md`。
3. 目标仅合成PG16 **in_progress Transaction formal responsible handoff**：在当前业务负责人失效/失权或合法正式交接场景中，具备现行合法组织治理能力且当前有效的 **经理/店长员工身份 + 独立现有 `transaction.responsible.transfer` permission + 现时data scope** 的actor，以真实双方在当前团队/门店、接收人active/eligible、Customer/Transaction/Lock同源有效、真正签名Transaction in_progress的对象为输入，原子更新当前`responsible_employee_id`与不可变old/new/actor/time/reason、移交事件/去重键、历史快照。禁止仅凭职位、Customer owner变更、系统管理员身份或头像手机号等旁路转移。
4. 首先读取公签`public.transactions`实际责任字段及触发器、F03-2-2M签名业务/权限Scope和交接凭据、F06-3B签名交易来源、F06-4A Cancel Source中的**原始负责人不可漂移校验**。如果F06-4A已签服务在换负责人后不能识别合法移交，**不可直接修改父Service或绕过校验**；须在本批隔离Sidecar增加有来源签名的`current_responsible`安全投影与专用跨批Adapter/Guard，并标`PRODUCTION_TRANSACTION_HANDOFF_ISSUER_GAP`及`PARENT_CANCEL_POST_HANDOFF_SOURCE_GAP`，由本批明确测试移交后旧负责人不得取消、新负责人是否具已签能力（无父合规Carrier时必须Fail Closed）。不得把新sidecar视为旧线上Issuer自动打通。
5. 不能直接用F03-2M对任意Transaction进行一次业务移交：如原系统要求真实handover batch/item/receipt/资格，必须使用合法签名合成源串接；如物理公共Carrier/合法manager权限合同不匹配，**只在本域隔离CI Sidecar承载安全投影并留下对应SOURCE_GAP**，不改旧表/公共SQL/生产操作，未验证来源全部拒绝。

## 2. B分支、可修改路径与真实性边界
1. B从实际执行时最新main建独立`feat/f06-4b-transaction-handoff-ci`和新PR；**只新增**`engineering/f06/transaction-handoff-ci/**`及`.github/workflows/f06-4b-*.yml`。不动旧`engineering/f03/**`、F04/F05/F06-1/2/3A/3B/3C1/4A，旧Migration Ledger/public SQL/Catalog/PDM/IA/设计/旧Workflow、生产Issuer及main。不能重写父批次已签SHA与测试以凑成功数。
2. 只能在`GITHUB_ACTIONS=true,GITHUB_EVENT_NAME=push,GITHUB_REPOSITORY=suzhe868-arch/mb,GITHUB_REF=refs/heads/feat/f06-4b-transaction-handoff-ci,CI=true,APP_ENV=test,NODE_ENV=test`；沿用F03/F05隔离确认，唯一DSN`postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test`，PostgreSQL16 `f03_ci`非超管无CREATEDB、127.0.0.1 loopback网络、真实独立后端；不一致即Fail Closed，禁止任何真实员工账号、客户手机号/微信/银行/财务Issuer。GitHub Token仅`contents:read,actions:read,pull-requests:read`。
3. 专属Sidecar仅`f06_4b_ci`，带原F06-4A/3B/C1 parent Seal、不可变handoff history与当前投影状态/操作人/时间/原因/授权源/事件幂等键；使用原已签实体外键与项目规定权限Scope，绝不以私人默许权限或职位即权。必须支持合成的same Employee id保持身份，非真实账户。
4. PG事务固定并发锁序`Vehicle→Transaction→当前Responsible/双方Employee/Scope→签名资金退款读Guard→职责变更及不可变事件→最终COMMIT`；在最终提交前重验真实actor/收件人权限与对象状态/Owner不漂移/签名Deposit-Refund只读、旧Token降权、同一Transaction竞争双handoff、去重同Key重放与错Subject Key复用。任何失败整笔Rollback、旧Responsible保持、没有半提交或重复事件。旧Customer owner普通变化**不得**产生自动handoff。
5. 强制安全隔离：不能因为handoff改变已完成或cancelled历史，不能恢复旧Lock/Waitlist/Priority、不能隐式释放vehicle或删掉在途资金责任；旧F06-4A合法取消只认仍然真实同源状态，旧负责人不再可签；若生产Issuer/Parent Adapter暂缺则拒绝而非假称恢复。新B包不可产生completed/deal price/Refund refunded、支付/银行凭证/真实资金或对生产部署。

## 3. 真实PG16验收矩阵、CI及跨库封印
1. **至少36条新Source真PG16**：旧F06-3B in_progress合成Transaction签名、原Responsible继承Lock、原始/当前负责人区别、manager/head显式permission+scope、普通sales及4S/SystemAdmin绝不越权、接收人离职/失效/跨门店/Team或Customer disable、旧员工失权、actor revoke COMMIT旧Session、跨Owner变更不自动迁移、同车双PG后端并发移交、幂等与错Object Key、签名旧F03-2M合成Handover事实、原Lock/资金/Refund不可改、父Cancel后终态禁止移交、新负责人Cancel需合法安全投影/失源拒绝、Priority/Waitlist不复活、公海Guard及错误注入各阶段整体Rollback、无权限升级、不可变Sidecar历史。
2. **至少9条新增HTTPS**：真实127.0.0.1 TLS + PG16，拒绝生产Transaction handoff/Cancel/Complete/Refund/付款真实请求、伪造manager/token/Scope/4S/SystemAdmin、跨用户和敏感金额/VIN/电话/凭证泄漏，合成端点不出站真实业务/第三方。
3. 父F06-4A冻结已签**17条真正push/86项独立PG16 Jobs**必须在本最终B SHA完整执行（H52官方真实52），新增新域Source+HTTPS两项，最终至少**18/18真`event=push`同HEAD completed/success、88/88独立非特权PG16 Job success、H52真正52/52**；旧F06-4A Source48/HTTPS9、F06-3C1 Source43/HTTPS9、F06-3B Source35/HTTPS9、F06-3A Source28、F06-2与F06-1所有旧真PG冻结回归不得弱化。B保留至少**24份最终SHA真实有效非空GitHub官方sha256 Artifact**，带Source/HTTPS原生日志及权限+资金回滚实证；仅Docker上游限流可同SHA官方重试失败Job，不借旧SHA或手工改PASS。
4. 真实物理 PG 情境库与独立空PG16审计库不同OID，**前者真的DROP**、后者重新建，旧至少**176张父`public+D1+F06-1/2/3A/3B/3C1/4A`实际表**按真实Catalog逐张COUNT+MD5全行封印（实际张数更多则不能减少）；24行Ledger、Public Catalog、D1及六父Sidecar原签不漂移。保存每次场景/审计OID/PID/SQLSTATE/回滚与逐表Seal摘要。
5. B必须完成自审：状态机、权限/对象TOCTOU/旧Token撤权、双Backend并发、旧金额/Lock不可变、基线sha256、公海/父Cancel兼容、真实Source GAP；所有CI同最后B HEAD签署 `engineering/f06/transaction-handoff-ci/B自验与A交接.md` 与PR中文评论，含18 Run/88 Job/H52 52、至少24官方原生Artifact ID/digest、Source/HTTPS+双OID176父表及Gap。终态 `F06_4B_B_SELF_TESTED / READY_FOR_A_INDEPENDENT_REVIEW / NEXT_OWNER=A`；B不得合并。

## 4. 严格禁止及退出条件
- 禁止：真实员工/客户生产触达、完成成交、真实线下款、资金纠错/实际退款/Refuned事实、Production HandOff/Cancel/Transaction/Refund Issuer、生产数据库迁移、F06-3C-2真实退款、C/H01发布、F07/F08、UAT/部署/上线。F05/F06整个业务域与V1仍`NOT_READY`。
- **NEXT_OWNER=B，NEXT_TASK=F06_4B_SYNTHETIC_TRANSACTION_RESPONSIBLE_HANDOFF_CI_ONLY**。完成后GitHub真实PR交A独立验收；真正产品新决策或生产授权才需要用户决定。
