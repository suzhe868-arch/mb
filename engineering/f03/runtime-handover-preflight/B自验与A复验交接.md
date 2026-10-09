# 名邦汽车 V1｜F03-2-2G B工程自验与A独立复验完整交接

> 2026-10-10（新加坡）｜**B_SELF_TESTED / READY_FOR_A_REVIEW**（只有本文件所在最新分支HEAD对应完整10/10 PG16 CI success时生效）｜**NEXT_OWNER=A**。B严禁自行合并main或声称正式Owner、Domain handover已完成。

## A 主控独立复核四项整改最终闭环｜2026-10-10（覆盖旧12例自验口径）

A的正式`A_CHANGES_REQUESTED`：`07_重建工作区/F03-2-2G_A主控独立复核一次性整改清单_2026-10-10.md`。本次在**原有**`feat/f03-handover-preflight-2g`上定向修复，没有新建/重置分支、不修改main、未创建或合并PR。修复后真实PG16已证明：代码提交`17336dc7834b45660366512b27e73ba14691a248`、[run 37978673179](https://github.com/suzhe868-arch/mb/actions/runs/37978673179)，**18/18只读预检测试成功、10/10独立PG16作业success**；下一步必须以含最终交接材料的最新HEAD同SHA全绿CI再签B交审。本节取代下文原12/12覆盖口径。

**A-G-01｜已离职/突发inactive仍需清点、无任何隐式授权**。既有可信handover batch的`change_kind=planned_disable|sudden_inactive`、被禁用源员工仍有当前Customer及业务责任时，合法有效经理对其显式Team成员关系仍在、个人`employee.manage`有效的前提下仅可执行只读影响/缺口扫描；其它类型若源员工inactive不自动转授权。源离职时现有Team成员关系一旦失效，即`G01_HANDOVER_AUTHORITY_GAP`且不给任何数据；测试直接在CI synthetic fixture预置可信两种batch并临时失活员工7、结束/恢复membership，所有`customers`/owner_history/域/账本/权限/审计在测试结束后逐行相同。**本批没有开通2E真实sudden_inactive批次创建服务，也没有恢复离职员工权限**。

**A-G-02｜模拟提交必须锁对象，防旧快照/新行幻读**。仅`readHandoverCommitPreflight`在F03-1合法PG16事务和原SG02 advisory锁之下，对固定22张影响/授权/账本表按稳定顺序获取`SHARE`表锁防INSERT幻读，并对Customer owner及七域当前责任记录按稳定主键顺序显式`SELECT ... FOR SHARE`；batch/item亦受现有FOR SHARE保护。重复读取当前manager/session、batch version、recipient、scope与完整对象集合签名，拒绝变动；`lock_timeout=1200ms`/SQL超时/PG死锁统一返回`G05_LOCK_CONTENTION_DEFER_DENY`，不发临时批准令牌。真实两个PG16连接验证：Owner更新、个人deny、Demand/Lock负责员工更改、Team membership撤销、SG06 item状态修改以及新Demand插入均被锁阻塞到预检返回后才执行；上游已持锁时超时拒绝；恢复测试数据后业务行/审计逐行一致。**稳定的预检仍只返回`PREFLIGHT_FACTS_CURRENT_BUT_WRITE_DENIED`**，无可复用提交凭据，不替代未来正式业务事务适配器。

**A-G-03｜缺失与待办、跨批重复、孤儿项**。有当前待办且与对象/负责人/目标一致的项明确标记`PENDING_ITEM`（绝不代表成功）；不存在账本项标记`MISSING_ITEM`+`missingItem:true`；相同kind/object即使在其它批次指向**同一个**recipient也一律`CONFLICT`，并返回仅内部batch/item ID和最小跨批源/目标不一致布尔值，不泄露无范围的外员工资料。不同recipient、不同source与单批source/to冲突均可机器识别；`retry_required`标`REVALIDATE`，不再把无对象对应的孤儿item冒充已交接。物理SG06已有not-self CHECK保持不变，负例用满足现有CHECK的隔离合成行构造，未更改冻结迁移。

**A-G-04｜别人的Team业务明细严格脱敏但不误判完整**。受影响客户集合仍可从本人source负责的Customer/Domain查出；域详情仅包含**source本人实际负责**的Demand/Recommendation/Consultation/Waitlist/Lock/Transaction。Priority仅当`trigger_demand_id`确实指向source负责Demand时列出，其它独立Lease、其它员工负责域、Customer current owner变化等，只输出`OUT_OF_SCOPE_DEFER_DENY`按**业务类型聚合的计数**，绝不返回外国Team对象ID/负责人ID/业务状态。Coverage追加相同保护性缺口并始终`DEFER_DENY`；真实PG16跨Team同客户样例插入其它员工Demand/Consultation/Lock/Priority/Recommendation全部核查不泄露，预检不会据“隐藏字段”报告完成。

**本批边界不变**：没有业务写API、Customer Owner/Domain reassignment、`handoverComplete`/completed、角色/店铺/员工下线、生产/微信/JYT/飞书调用；没有新增DDL。结构仍`88表/536列/344约束/138索引、1840原目录对象`，sha256 `96328994b19e1fef7261ae41bd890575bd196210e85baec685d0192676aff0dd`；真实PG16原`SOURCE.md`、原字节schema-only、old/new/inventory和sha256sums已保留，并继续执行`F03_2G_EVIDENCE_FULL_CATALOG_PASS`、`F03_2G_ARCHIVE_EXACT_REAL_RAW_BYTES_PASS`跨运行核验。所有旧2F/2E/2D/2C/2B/2A/F03-1真实新库回归均保留且成功。基线`PRODUCT_BASELINE=NOT_READY`。

**门禁**：最终B分支最新HEAD须与它的同SHA成功run完全相同，10/10 PG16作业完成，18/18 G测试成功，证据校验通过，且仅限本批新目录/工作流。达成后`READY_FOR_A_REVIEW`/`NEXT_OWNER=A`，A独立签字并正常PR合并；B永不提前合并main。

---

## 一、责任与已验收起点

- A已独立验收2F（B SHA `703d96a492a62870dbf9e70e13a808b981802bc4`、CI `37972431347` 9/9、PR #14），最新main基线 `58cc6e72507b467b0b423e90ed35bb3cd5be9fee`。
- 正式施工单：`07_重建工作区/F03-2-2G_A主控SG06客户与活跃业务承接预检完整施工单_2026-10-10.md`；现行三窗口连续执行规范。工作分支：`feat/f03-handover-preflight-2g`，全部18个综合G01～G09测试子案例与10个独立真正PG16 CI岗位由分支最新提交自动执行；请A以GitHub真实HEAD、run SHA、结论为唯一准绳，不使用早期绿色run冒充最终。
- B只允许并确实只新增 `engineering/f03/runtime-handover-preflight/**` 与 `.github/workflows/f03-2-2g-handover-preflight.yml`。没有改动原main任何代码/旧000001～000007/Guard/CI/PDM Final/正式HTTP，不自行合并或部署。
- 现有F03-1真实normal可信经理PC登录，current manager和employee身份/状态、SG02/SG04 `employee.manage` **显式team** 当前capability scope+双方membership+personal deny、系统Admin非员工、来源batch发起人绑定。任何auth/团队/账本缺失都失败关闭。预检返回`writeDenied:true`；**无提交token、无completed、无可执行Owner改变权限**。

## 二、四项受限工程交付及业务明确边界

1. **`readHandoverCustomerImpact`**：从当前原始`customers.current_owner_employee_id`及各域独立实际`responsible/assignee/recommender`关系枚举受影响Customer，覆盖Customer、Demand、`priority_leases`（独立实体且连`trigger_demand_id`）、Recommendation（`source_demand_id`，不冒充Priority）、Consultation、Waitlist、Lock、Transaction。仅返回业务对象ID/客户ID/负责人ID/状态文字及必要关联ID，**不输出手机号、密码、车款/金额、任何档案**。支持当前客户0/1/多Demand；Demand active/paused/completed/cancelled，Consultation pending/processing/resolved/invalid，Waitlist ended，Lock超时，Transaction in_progress与未知情况。数据库不具权威状态白名单的status及过期但未结清业务绝不武断归入完成，返回`UNKNOWN_DEFER_DENY`；影响清单上限超限也直接DEFER_DENY，不谎报完整。
2. **`readHandoverRecipientEligibility`**：目标当前必须名邦有效sales/manager/store_head、`receiving_status='receiving'`、当前独立`employee_receiving_eligibility.eligible=true`且active store，同时被批准的经理确实有当前employee.manage当前精确Team scope且候选人与来源员工、经理有显式当前Team membership；禁止同源同目标、System Admin、4S、inactive、缺接客资格、同店不同Team、expired成员、个人deny、其它capability借权。有效只表明承接候选事实，**Owner及其它域写能力固定`WRITE_CAPABILITY_UNPROVEN`**。
3. **`readHandoverBatchCoverage`**：将当前活跃与未知的Customer/Domain独立对象逐个同2E已存在SG06 batch/item的`(kind,object_id,from,to,status)`真值核对：`MISSING_ITEM/PENDING_ITEM/CONFLICT/UNSUPPORTED/REVALIDATE/OUT_OF_SCOPE_DEFER_DENY`各给明确ID原因。真实匹配pending标记`PENDING_ITEM`，未登记标记`MISSING_ITEM`，**没有任何真实handover success**。Priority/Consultation/Waitlist/Lock/Transaction完整业务adapter均未建立，Recommendation又是独立关系，故整体一律`DEFER_DENY`；非目标源、目标冲突、ledger retry_required、独立未完成账本均不放行。
4. **`readHandoverCommitPreflight`**：同一真实PG16有会话的事务内以PG advisory `20261010,306`串行化已知SG02/SG04团队治理，读真实batch FOR SHARE、current权限、recipient/Customer/七域、ledger item FOR SHARE；第二遍重新校验整个有序事实签名。两数据库会话间对Customer Owner/个人deny及其它当前域负责事实的修改在本次预检持锁时均等待锁释放；若上游先持有写锁使预检超时则返回`G05_LOCK_CONTENTION_DEFER_DENY`；即使两遍完全相同也只返回`PREFLIGHT_FACTS_CURRENT_BUT_WRITE_DENIED`，**始终不会构造可重放提交权**。SG07真实domain写锁+重验未来施工，不宣称解决全部业务域TOCTOU。
5. **纯只读影响**：业务只读服务自身没有INSERT/UPDATE/DELETE/DDL/审计写；所有主动生成/修改只发生在CI全新隔离合成fixtures阶段及test中独立数据库会话注入，随后恢复，并对`customers`、`customer_owner_history`、所有活跃业务、employee许可/role/team/receiving、`handover_batches/items`与`audit_events`做before/after**整行JSON逐项恒等**断言。F03-1原本的登录session `last_seen_at`更新只是原认证机制，不是业务域变更。

## 三、同SHA真正PG16与不可变源证据

- 目标零DDL；同源`000001～000007`，迁移与结构`96328994b19e1fef7261ae41bd890575bd196210e85baec685d0192676aff0dd`，**88 tables / 536 columns / 344 constraints / 138 indexes / 1840完整catalog原对象零增删改**；数据库多余schema与版本checksum变动fail closed。
- 只用GitHub Actions每job独立新PostgreSQL16、非特权`f03_ci`、一次性`f03_auth_test`。本2G读影响/收件资格/批次跨域缺口/提交模拟预检：**18/18真实PG16 tests**。覆盖0/1/多Demand、TTL、Priority vs Recommendation、终结与未知域、个人deny、4S/admin、同店缺Team、expired membership、receiver eligibility、item源/接替人冲突、两真实DB会话变更现行Owner/权限、schema/版本负例及行级无副作用。
- 从2G专用工作流额外8个历史工程阶段共**10个互相独立PG16 jobs**：2F 88表个人/Team权限治理10/10；2E 88表pending ledger11/11；2D 86表SG02 Team9/9；2C 84表接客11/11；2B 82表管理10/10、空库bootstrap1/1；2A 81表模板9/9；原F03-1 80表认证11/11及HTTPS4/4。每个版本由其自己的冻结Guard检查，绝不让旧CI“兼容”最新版。
- 真实第一次来源PG16全绿run：[37975565442](https://github.com/suzhe868-arch/mb/actions/runs/37975565442) / SHA `cc4f51f8f7beef9214e1038191216b1a42ac9595`。CI自动原字节归档 `evidence/SOURCE.md`、`old-structure.json`、`new-structure.json`、`pg16_schema_only.sql`、`pg16_inventory.json`、`sha256sums.txt`。最终每次新SHA的CI按原字节/完整目录/inventory哈希及pg_dump两行自带随机restrict键归一比对，日志必须含`F03_2G_EVIDENCE_FULL_CATALOG_PASS`和`F03_2G_ARCHIVE_EXACT_REAL_RAW_BYTES_PASS`。源SHA是原始证据生成SHA，**不应同最终HEAD混淆**。
- 核对：`git compare main...feat/f03-handover-preflight-2g` 所有条目**added**且限定新模块/工作流；禁止出现旧文件modified/deleted。A复审该分支当前HEAD和最新CI run的`head_sha`精确一致、10/10 jobs success、12/12 test、日志/结构证据和边界后才能签A通过并正常PR合并。

## 四、目前仍然DEFER_DENY的事项

- 真实各Domain具体reassignment、历史写、SG06完成、真实Customer owner/员工角色/Team降权停用调店、正式业务`employee.manage`在SG07提交点可用权和任何外部PC HTTP路由均**未实现**；所有金额交易与锁定也不能因预检获准。
- Priority的TTL不重置；其独立Lease与Recommendation/Match/Demand不互相冒充。无已验收adapter的域统一UNSUPPORTED，未知生命周期统一REVALIDATE/UNKNOWN_DEFER_DENY；账本不能凭`pending`形成业务成功。
- C/H01视觉仍独立待审，完整F03-2与产品基线均未验收，`PRODUCT_BASELINE=NOT_READY`。

**退出标准：仅最新HEAD对应10/10真实独立PG16全success后B_SELF_TESTED / READY_FOR_A_REVIEW。A负责独立复验与PR；NEXT_OWNER=A。**
