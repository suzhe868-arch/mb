# 名邦汽车 V1｜F06真实Transaction负责人移交｜A独立验收PR153合并与移交后取消正式放行报告｜2026-10-21

> A最终结论：`A_ACCEPTED_NONPRODUCTION_HTTP_PG16_PR153_STANDARD_MERGED`；原批Issue151完成，新批Issue154已经正式放行，NEXT_OWNER=B；生产/真钱/F06/F07/F08/V1整体`NOT_READY`。

## 一、A独立复核证据
- 指定旧批：`F06_REAL_TRANSACTION_RESPONSIBLE_HANDOFF_HTTP_PG16_01`，[Issue #151](https://github.com/suzhe868-arch/mb/issues/151)完成关闭，授权B分支 `feat/f06-real-transaction-handoff-http-pg16-01` 末HEAD **`4d499810cd9a97bd483ffb257b5d03b01f6bb062`**；branch relative main ahead13/behind0，仅11个新增文件且全部属于指定`engineering/f06/transaction-handoff-http-pg16/**`和专属单Job YAML，无旧3A/3B/3C1/PR139/PR146/PR150、public migrations或生产路由修改。
- A读取Github [官方Push Run #39458177954](https://github.com/suzhe868-arch/mb/actions/runs/39458177954)／[Job #118750396752](https://github.com/suzhe868-arch/mb/actions/runs/39458177954/job/118750396752)实际**512,385字符原始日志**及job全steps successful，末尾`READY_FOR_A_REVIEW ... head=4d499810cd9a97bd483ffb257b5d03b01f6bb062 run_id=39458177954`。父完整`534/534`实跑+新增真实Handoff HTTP非特权PG16`40/40`+TLS/生产拒绝`11/11`，**585/585**、失败0/跳过0/取消0。共344个Workflow预检自身Push1/PR0前后全过；父嵌套shim只跳过与本分支路径无关的旧preflight，真实父签名/HTTP/PG16/迁移/Seal均未跳。
- 新`f06_real_handoff_ci`唯一Attestation签原PR139侧车SHA、PR150签父SHA、公共结构与24迁移Digest；版本Event/RequestKey不可变、旧源永久不可改。A亲自阅读`service.mjs`的`source()`、`chain()`、`managerScope()`、`handoffRealTransactionCI()`、Sidecar SQL和40项实际测试：公表当前`responsible_employee_id`变更、新版本Event+Key+Audit在同一真实`IsolatedAuth.withSession`事务；原`f06_real_tx_ci.origins.responsible_employee_id`与Lock快照初始Owner不变；Version1 old1→new4、Version2 old4→new2的链尾同公表一致；缺签、断链、原Lock/Source漂移FailClosed。
- 真PR139来源兼容矩阵：原旧`f06_3b_ci.transaction_origins` count **0**，新PR139 origin count **1**；不伪造旧4B。经理/店长必须有效签名员工Session、**独立显式**`transaction.ci.handoff` Permission Override+Capability及当前Scope、Team/Store/Object范围，经理称谓不自动给权，4S/无效Token/禁用Customer/目标/撤权拒；原负责人离职也能由另一有权经理代办而不误卡；目标当前人员合法。
- 同Key同Payload幂等无重复，换Actor/Target/Reason拒，过期Version CAS拒；真实独立Employee Manager不同Token/PG PID2055/2054争同Tx仅一个成功，保留共享链上PG锁串行化可能，不宣称双方同时持Vehicle行锁。状态/Event/Audit三处真实注错Rollback、无半写；原生append-only UPDATE/DELETE硬拒。旧PR146 Cancel在Handoff后**FailClosed**、旧PR150退款对未取消Tx FailClosed，未假称Handoff后所有旧API已支持。
- 原父四Schema**161张**逐表COUNT/MD5、24迁移、真实不同Physical source OID **87819→97329**，独立audit OID **39339**；原父全行Seal SHA256前后完全相同 `9833de68dfd2ab9cc1f6c65995359589d29247a7dcb6ca980eaaa94b7962d5c0`；本包Sidecar不冒充父161。
- A已建标准业务[PR #153](https://github.com/suzhe868-arch/mb/pull/153)，检查可合并、末SHA未变，仅授权11新文件，执行标准GitHub Merge，实际merge SHA **`70c9372a55865d59c5a3772b368d236775154038`**，Issue151 closed。

## 二、下一已放行的独立施工包
- [Issue #154](https://github.com/suzhe868-arch/mb/issues/154)：`F06_REAL_POST_HANDOFF_TRANSACTION_CANCEL_HTTP_PG16_01`，B从执行时最新main起步，新分支 `feat/f06-real-post-handoff-cancel-http-pg16-01`，当前Handoff版本链有据，**当前链尾负责人**在当前permission/scope下合法`in_progress→cancelled`，只能用新sidecar签封；旧PR146 Cancel和PR150 Refund来源不随Handoff自动兼容，PR150未来对新Cancel的退款仍必须FailClosed。全面设计/测试/安全合约见同批A正式施工单和Issue154。
- 原验真实585全量同SHA运行，新增PG16 HTTP>=35 + TLS>=10，共**>=630**全部成功，161父签名表/24迁移不同OID全Seal一致；权限、版本、并发、注错、幂等与生产隔离不降低。B中文完整交接`READY_FOR_A_REVIEW`后交A；B无PR/merge权限。仍未授权真钱、completed、产线Public DDL、UAT/部署、C PR68独立Draft。

## 三、A裁定范围
这次仅验`NONPRODUCTION_SIGNED_SYNTHETIC_TRANSACTION_RESPONSIBLE_HANDOFF`，不将CI合成业务写成真实用户场景或生产上线。F06/F07/F08/V1继续`NOT_READY`。
