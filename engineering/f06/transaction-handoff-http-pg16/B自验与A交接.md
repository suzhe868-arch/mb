# 名邦汽车 V1｜F06真实Transaction负责人Handoff｜B自验与A正式交接

## 一、A放行与严格边界
- A正式Issue #151：`F06_REAL_TRANSACTION_RESPONSIBLE_HANDOFF_HTTP_PG16_01`，继承已验PR150 534项同SHA父回归。
- 本批唯一新B分支：`feat/f06-real-transaction-handoff-http-pg16-01`，由最新`main@04b0e4b91db6b8b6f54a3f9a12891389a1c13c1c`创建。只有新目录`engineering/f06/transaction-handoff-http-pg16/**`和唯一Workflow可以变动。不得B自行PR/merge。
- 仅一次性可销毁、非超级用户PG16/127.0.0.1 loopback真HTTP、合成身份及资金只读。未授权真实收款、退款、refunded、completed、真实生产Issuer、Customer资料、UAT上线及生产权限。项目F06/F07/F08/V1始终NOT_READY。

## 二、签名来源兼容裁决
- 原冻结4B依赖`f06_3b_ci.transaction_origins`；PR139经A验收的合成Transaction初建来源为`f06_real_tx_ci.origins/events/request_keys`。本包在真PG16以同一Transaction ID直接数原件：旧3B origin为**0**，新PR139 origin为**1**。不得造旧3B签名以绕过4B校验。
- 冻结4B及冻结Cancel/Refund服务不可篡改。本包`f06_real_handoff_ci`新版本侧车签名，绑定原PR139原件、事件、初建RequestKey、锁车快照、原始Customer/Vehicle/ListCycle、原始负责人与旧Parent attestation/24迁移/Public Catalog；首发与前次版本的差异均仅以新不可变版本事件衔接，不重写PR139原始责任。
- 每笔新的签名Handoff包括`old/new/actor/signed team/signed store/reason/time/version/prior event/source digest/event key`及独立Key完整SHA，原始Public Transaction当前负责人的变更与新事件、Key、Audit在**同一个PG16业务事务/提交**完成。历史事件、key、attestation由SQL Trigger拒绝任何UPDATE/DELETE。
- 只有当前非系统管理员的有效经理/店长可以在**真正独立**`transaction.ci.handoff`显式allow+有效Capability绑定+当前Team/Store/Object Scope下签发。独立有效新Responsibile必须处于同团队合法角色/Active/有当前Team membership。原负责人离职/禁用时，允许新的有授权经理代办；不能依靠失效旧Responsible认证、岗位标签或Customer owner普通变更签发。异Key并发采用`expectedOldResponsibleId/expectedVersion`源版本原子CAS，过期请求拒绝，重复Key同Actor/Subject/Payload幂等，Key换Actor/Target/Reason冲突。
- 已成功移交后的冻结PR146 Cancel/PR150 Refund会因原始PR139签名负责人不等于当前负责人而FailClosed；**不将其作为已签发的后置可用服务**，兼容层须等待A后续正式授权。无任何Lock复活、Priority/Waitlist、公海重置或资金写入。测试同样验证旧F06-4B兼容负例、生产路由404及真钱拒绝。

## 三、必须提供的真实交接证据
- 最终官方单Push/单免费Job HEAD同SHA真实跑完父**534/534** + 新Handoff真HTTP/PG16 **不少于30**（设计40） + TLS生产拒绝 **至少10**（设计11），合计**至少574**，0 fail/skip/cancel。测试不能复用或拼接旧Run。旧Parent path-preflight仅因新任务changed-path不适用而在嵌套父调用跳过，全部历史签名/业务/数据库回归原样执行；本任务专属全Workflow Push1/PR0 Preflight两次均执行。
- 新Handoff需证明两种不同签名Employee Session的Manager Actor，Target第三员工真实Session，至少两个真实不同PG backend竞争最多一个成功提交（同Employee Session串行化不会冒称两Vehicle锁并发），经理能代办inactive旧Responsible；撤权/失效Scope/目标4S拒绝及三处SQL注错真实Rollback，公表/签名/Audit零半写。
- 最后将实验数据整个销毁，从PR150签名父快照恢复到不同真实物理数据库OID，再原生独立比对冻结父四Schema**161原表逐表COUNT/MD5**、24迁移、公共Catalog、完整Row Seal及独立审计库不变。新Sidecar不冒充161原表。
- 本文随源代码和末SHA提交；最终官方Run/Job/PG PID/OID、SignatureSHA/Seal及完整结果以Issue #151同SHA评论为准，防止补写动态Run号触发新的未验SHA。

状态仅在同一SHA真实Run/Job全部成功才允许：`F06_REAL_TRANSACTION_RESPONSIBLE_HANDOFF_HTTP_PG16_01_B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A`。若原生权限边界无法合法建立，`BLOCKED_SIGNED_TRANSACTION_HANDOFF_SOURCE_OR_PERMISSION`，不降低测试或旧父门禁。
