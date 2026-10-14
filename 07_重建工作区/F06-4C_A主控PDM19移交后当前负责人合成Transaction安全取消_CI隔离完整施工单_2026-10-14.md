# 名邦汽车 V1｜F06-4C A主控正式完整施工单：移交后当前负责人合成Transaction安全取消（仅隔离CI）

> **2026-10-14正式技术放行：`F06_4C_A_RELEASED_FOR_B_CI_ONLY / NEXT_OWNER=B / NEXT_TASK=F06_4C_POST_HANDOFF_CURRENT_RESPONSIBLE_CANCEL_CI_ONLY`**。仅在可销毁非特权PG16验证已签负责人移交后、当前合法负责人可否安全完成`in_progress → cancelled`的合成事务。绝不放行生产Transaction取消、真实资金退款或完成成交。

## 一、Authority、前置依赖与唯一目标
1. 权威：用户已签PDM-19 Final §9“创建继承Lock原负责人，失效须正式handoff，old/new/actor/time/reason保留；Customer owner不自动漂移”与§10“仅当前合法Transaction负责者具permission/scope/object-state可正常cancel，cancelled终态，旧Lock/Waitlist/Priority永不复活”，及§§6–8、15–18、21–26；PDM-02 Final现时permission+data scope+旧Session撤权；PDM-03/17/18/25的归属、公海、Lock、审计规则。本单不能新增或修改产品规则。
2. 前置F06-1 PR52、F06-2 PR53、F06-3A PR54、F06-3B PR55、F06-3C-1 PR56、F06-4A PR57及**F06-4B PR58**均经A独立验收并标准合并。最新PR58受验B SHA`89bab5f2452438f5cdfd74f2d95ef7885652db87`，真实标准merge`498617353db8020c14ec919a1b0eefef66f2eec8`；A已核18同SHA Push/88真PG16 Job(H52 52)、Source48/HTTPS9、133份官方sha256 Artifact、双物理OID48623→53414、176旧表全行COUNT+MD5 Seal。A报告`07_重建工作区/F06-4B_A主控独立验收18条Push88项真PG16与133份证据_PR58标准合并正式报告_2026-10-14.md`。
3. 仅允许独立合成业务：签名F06-3B合法Lock→`in_progress` Transaction，再经F06-4B合法显式经理/店长transfer scope/不可变Sidecar签发当前负责人变更；**原F06-4A cancel旧来源不再承载新负责人**。本批新安全Adapter只有在当前Transaction与F06-4B移交完整事件链一致、源Lock/Customer/Vehicle/listing_cycle与资金只读不漂移、新负责人合法Employee Session拥有**独立显式`transaction.ci.cancel`能力与data scope**且任一其他在途退款/未知资金没有冲突时，才可在真实同PG事务`in_progress→cancelled`并追加独立不可变取消事件/原因/actor/time/幂等/原签名来源引用，保持旧4B移交历史、旧Lock、资金和其他PDM责任原样。
4. **正向CI仅新签来源完全可信才成立**；若现行父4B不能证明新负责人资格/旧签Cancel的状态载体、某个企业权限或业务签名来源，则**仅做安全拒绝与SOURCE_GAP，不得伪造合格生产Issuer**。生产`TRANSACTION_CANCEL_CARRIER_SOURCE_GAP`、`PRODUCTION_TRANSACTION_HANDOFF_ISSUER_GAP`、`PRODUCTION_TRANSACTION_CANCEL_PERMISSION_SOURCE_GAP`直到有正式真实来源仍不解除。
5. 新/旧负责人安全规则：旧负责人移交后**硬拒绝**；新负责人不是因为成为current responsible就自动获权限，仍必须通过真实Session+独立Permission+Scope+当时有效Team/Store；manager/head不能凭职位自动接管普通取消。签名Handoff后没有本批独立Adapter时原父F06-4A直接调用仍必须Fail Closed。任何未知来源/状态/资金/授权全部拒绝并保留审计。已cancelled终态、completed、未转交易Lock、已撤权/停用客户/4S/SystemAdmin均拒绝。

## 二、B分支与允许工程变更
1. B从执行时**真正最新main**创建`feat/f06-4c-post-handoff-cancel-ci`，只开本批新PR，**只新增**`engineering/f06/post-handoff-cancel-ci/**`及`.github/workflows/f06-4c-*.yml`。禁止修改父`engineering/f06/transaction-handoff-ci/**`/transaction-cancel-ci/**、全部F03/F04/F05/旧F06其它服务或Workflow，旧M94公签/24迁移Ledger、PDM/IA/低保真、高保真、正式生产API/Issuer或main。
2. 运行真实性：`GITHUB_ACTIONS=true`、`GITHUB_EVENT_NAME=push`、`GITHUB_REPOSITORY=suzhe868-arch/mb`、`GITHUB_REF=refs/heads/feat/f06-4c-post-handoff-cancel-ci`、`CI=true`、`APP_ENV=test`、`NODE_ENV=test`，既有F03/F05隔离确认，唯一DSN `postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test`；版本必须真正PG16，`current_user=f03_ci`、非超级用户与NOCREATEDB，只有127.0.0.1 PG/TLS、合成身份与完全可丢弃测试库。禁止任何真钱、真实员工Customer、微信/银行、生产接口/外部出站。
3. 新侧表只允许`f06_4c_ci`：新增自身attestation、签名handoff至cancel来源/动作append-only历史、事件幂等键；绑定真实公签Transaction、4B已有独立current-responsible事件链、3B原交易来源、原Lock与4A既有cancel签名规则。当前不可变历史永不删除/覆盖；公共M94事务carrier仅在真实非特权可销毁测试库中按已有合法列原子变更合成`cancelled`，不新增正式公签DDL/触发器。
4. 明确PG锁定顺序Vehicle→Transaction→原源Lock→当前4B Projection/Event→当前Employee/Team/Scope权限与Customer→Deposit/Correction/Refund只读Guard→单事务新Cancel Event/CAS→原始审计→COMMIT前重验；同车并发双真实PG backend只有合法赢家。出现权限撤回、Responsibility漂移、Owner错误变化、未知真实财务来源、任何existing pending Refund或付款、错Subject/错Cycle/历史源与Sidecar签名不一致，必须完全ROLLBACK或Fail Closed，不能出现“状态改了而审计没生成”。
5. 历史保护：不自动恢复Lock/Waitlist/Priority，不篡改原负责人和4B旧/新事件链、不恢复原Customer owner、不更改Deposit原金额或correction、已签Refund及交易占用；只允许本次合法CI cancel结束该Transaction在途状态，公海仍受其他在途资金/Refund/Consultation/Demand等独立Guard，不自动释放source_status/visibility/relist/cycle。新旧经理/店长无额外资金能力。
6. 旧F03-2M真实handover batch/item/receipt若没有正式签名业务Issuer，本包只能消费**4B明确签名的隔离合成事实**，不得据此对生产完成交接/取消作任何正面声明；生产入口/路由必须真TLS 403 Fail Closed。

## 三、完整真实PG16验收门禁
1. 新`Source` **至少40条**：真实签名4B当前负责人、原始3B源与4A父规则差异、父4A换负责人后硬拒、新适配器只有显式新权限/Scope+当前身份和合法账本资金才正向cancel、前旧负责人拒绝及多次移交旧责任拒绝、经理/店长不是默认许可、4S/SystemAdmin/跨Team/跨Store/账号停用/Role降权/撤权COMMIT旧Token失效、deposit纠错后余额/来源变化失败、pending Refund冲突/无资金来源Fail Closed、跨Customer/Vehicle/listing_cycle/Transaction错配、已cancelled/completed终态拒绝、同Key幂等和错Subject复用拒绝、双PG后端并发、全部阶段故障注错原子Rollback、真实老Lock/Waitlist/Priority与已收款Refund不可变、旧公海其它责任不丢、事件历史不可变和旧4B签名不漂移。
2. 新`HTTPS` **至少9条**：真实PG16+loopback TLS，合成生产Transaction cancel/handoff/complete/refunded/支付操作拒绝、伪造新旧负责人Token、经理/店长/4S/SystemAdmin与跨Scope角色篡改、GET 405、公共生产路径404、VIN/手机号/金融Token无回显；不得启用任何实际生产Issuer。
3. 父F06-4B**18条真正Push/88个独立PG16 Jobs**必须在最终B HEAD完整真实重跑；新增本域Source/HTTPS两项，至少**19/19条同HEAD `event=push`工作流全success、90/90真PG16 Job（H52完整52）、>=26份同HEAD官方非空未过期`sha256:` Artifact**。旧父F06-4B Source48/HTTPS9、F06-4A Source48/HTTPS9、F06-3C1 Source43/HTTPS9、F06-3B Source35、F06-3A Source28和旧F03/04/05全冻结验证。公共镜像限流仅官方同SHA失败Job重跑，不使用跨SHA或历史PR事件数据。
4. B在**真正不同物理OID**的可销毁PG16情境库运行新测试、真DROP此库并在独立空库重建父签名环境后，按实际Catalog对旧至少**180张public+D1/F06-1/2/3A/3B/3C1/4A/4B表**（若实际更多不能只查180）逐表**全行COUNT+MD5**；24旧迁移Ledger/Public Catalog/D1和七父Sidecar签名保持一致，附OID/PID/SQLSTATE及全封印摘要原生日志，不得结构hash替代全行数据。
5. B须完成安全/权限/并发/Session/账本/跨批旧签静态自审、完整测试、整改、同SHA CI和原生证据；在新PR书写完整中文`engineering/f06/post-handoff-cancel-ci/B自验与A交接.md`及最终GitHub PR签署评论，列全部**19 Run ID/90个Job ID/H52完整52个、至少26份有效官方Artifact的ID/digest、Source/HTTPS、双OID/旧≥180表全行Seal、跨父Cancel安全证明与所有SOURCE_GAP**。交接终态`F06_4C_B_SELF_TESTED / READY_FOR_A_INDEPENDENT_REVIEW / NEXT_OWNER=A`，B不得自行合并或写main。

## 四、严格禁止、下一责任
- 禁止：任何生产Employee/Customer真实执行、真实交易/在线资金收退、completed成交、实际退款`refunded`/`refund_payments`、金融凭证、真实组织授权变更、外部微信/银行/飞书通知、正式数据库迁移/真实Issuer/UAT/部署上线、F06-3C-2真实退款、F07/F08及超出PDM产品规则的自行选择。F05/F06整域与V1仍`NOT_READY`。
- 下一责任`B`，目标分支`feat/f06-4c-post-handoff-cancel-ci`。B全部CI与交接证据完备后再交A独立验收；A标准合并需下一轮门禁成功，绝不能使用本PR58绿灯冒充。
