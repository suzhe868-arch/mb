# 名邦汽车 V1｜F03-2-2H B工程自验、物理证据与A独立验收交接

> 2026-10-10（新加坡）｜**B_SELF_TESTED / READY_FOR_A_REVIEW**（须以本交接所在**最终HEAD同SHA**十一作业全部`success`才生效）｜**NEXT_OWNER=A**｜**PRODUCT_BASELINE=NOT_READY**。B不合并main、不创建生产业务接口。

## A主控三项阻断整改｜二轮B闭环证据（优先于下方旧14例口径）

> A正式整改单：\`07_重建工作区/F03-2-2H_A主控独立验收完整定向整改单_2026-10-10.md\`；B仅在**原指定分支**整改，不改旧main及000001～000007。本节覆盖下方原19/19及原1886目录对象的历史初次验收数据。

**A-H-01：跨Item/Batch/Customer同Key全局碰撞**。本批唯一新表\`customer_owner_handover_receipts\`现增加\`f03_2_2h_receipt_request_key_unique UNIQUE(request_key_sha256)\`物理唯一约束+唯一索引。服务在持有合法现行PC身份、SG06 batch/item、锁定Customer与受限Owner权限后，**Owner写之前**查询请求摘要：同摘要不同item统一返回\`H04_COLLISION_DENY\`；同item同Key且所有意图一致只返回之前不可变收据；同item异Key或不同来源/接替人拒绝。数据库层即使有独立并发写入也提供原子唯一兜底，事务失败全部回滚。真实PG16新测试覆盖同Key跨item/batch/Customer/接替人拒绝、两**独立真实员工PC事务竞争不同Customer同Key**恰有1成功/1碰撞、Owner/history/audit/receipt各自只增1且落败Customer完全未改、注错点after_receipt回滚释放Key可正常重试。不同Key合法任务仍可成功。

**A-H-02：操作者暂停接客不等于撤权**。移除了\`mgr.receiving_status='receiving'\`的非产品授权判据；经理和店长仍需真实当前active有效PC会话、独立\`customer.owner.transfer\`个人权限/deny优先、精确有效范围、全部Team+接替人法定事实。仅**recipient**仍必须\`active+receiving+eligible\`。分别使用真实经理员工5和店长员工6\`receiving_status='paused'\`对独立Customer317/318完成真实Owner提交，暂停状态下故意施加个人deny、账号inactive、相关Team/store capability到期均失败，恢复后才允许事务；测试结束操作者状态与权限完全恢复。

**A-H-03：跨店精确显式Team scope与店长本店控制分开**。经理按目前确切有效\`team\`数据范围、对应\`customer.owner.transfer\`独立binding以及本人/source/recipient**现行Team membership**判定，不再使用\`mgr/src/dst.store_id=t.store_id\`覆盖显式授权。PG16创建**隔离合成**Store2/Team906：经理、源和目标employee主Store1，但Team906属Store2；经理拥有scope206 team906+对应写permission binding与三人有效membership，Customer315完成Owner受限单域移交；分别临时撤销membership和personal allow均失败。Store1/Team907虽是同店且人员均有成员事实，但没有\`customer.owner.transfer\`有效绑定，Customer316拒绝；店长即使额外有跨店Team906显式binding，非本人主Store2仍拒绝Customer322，店长已合法Store1范围仅在本Store内生效。当前实现覆盖上述**确证**跨店Team正例；未有独立可核实scope/对象合法性时仍统一fail-closed，不把“跨门店”当成普遍放行，也不能把权限默认店长化。

**真正的物理迁移新指纹（以此为准）**：原88表/536列/344约束/138索引/1840完整对象及旧SHA \`96328994b19e1fef7261ae41bd890575bd196210e85baec685d0192676aff0dd\`逐项保持；新的单一收据表**89表/548列/360约束/143索引、1890完整catalog定义（新50键）**。000008 SQL sha256 \`252b931dddc411337a5e787e7512a01a77d5320a299c6714033d73e87b1f3e26\`，新物理结构sha256 \`2ffb014e044173837b1a2ce081e518e68b9e723cf440a08c063779c4db9ac0ac\`。新白名单\`000008.manifest.json\`取自[真实独立PG16结构发现run #37984575314](https://github.com/suzhe868-arch/mb/actions/runs/37984575314)事务内完全回滚的目录提案；锁定后原始source PG16全新[run #37985015633](https://github.com/suzhe868-arch/mb/actions/runs/37985015633)、合成代码提交\`e66e993e1c7d90cd742ab8f082712a6c59fdf2a4\`，**19/19真实H测试、11/11各自独立PG16作业成功**。旧证据6文件已经从工作分支替换为由该新SQL/新SHA重新生成的原始\`evidence/SOURCE.md\`、前后目录、pg_dump schema-only、版本inventory和sha256sums；须由**最终交接文档SHA**的后续同SHA成功CI再通过\`F03_2H_EVIDENCE_FULL_CATALOG_PASS\`及\`F03_2H_ARCHIVE_EXACT_REAL_RAW_BYTES_PASS\`核验来源/现次原始字节，不能沿用旧89/548/359/142/1886目录证据。

**本批仍未完成**：没有实际生产权限映射、任何真实Owner、外部PC路由、其它七业务域负责人移交、SG06 batch/item completed、调店/降权或C/H01验收。仅Customer合成PG16单域，独立审查的真实跨店其他对象scope尚可能需要另批证据，绝不擅自扩大权限。最终\`B_SELF_TESTED / READY_FOR_A_REVIEW\`、\`NEXT_OWNER=A\`，A复验合格才标准PR合并main并准备下一施工单，\`PRODUCT_BASELINE=NOT_READY\`。

---

## 一、已验收权威与本轮批准范围

- 唯一正式A施工单：`07_重建工作区/F03-2-2H_A主控SG06唯一CustomerOwner受限真实逐项移交及事务收据施工单_2026-10-10.md`；PDM-02/PDM-03 Final §§1、4、7、9、11～14及2E/2F/2G严格隔离Authority。
- A已独立通过2G四项整改及PR #15；本次从当时最新main `14599fc07e60342decc2e6495760a6669c24dedc` 新建指定分支 `feat/f03-customer-owner-handover-2h`；全量文件**只新增** `engineering/f03/runtime-customer-owner-handover/**` 及 `.github/workflows/f03-2-2h-customer-owner-handover.yml`，所有旧文件、旧CI、000001～000007迁移、生产、真实身份和业务数据零修改。
- 仅在GitHub Actions单次新建非特权PostgreSQL 16（DB `f03_auth_test`、role `f03_ci`）、F03-1真实受控合成PC会话、F02业务表合成Customer/员工/角色/历史下执行；正常认证session更新时间不冒充业务域写。本批**真正提交**的唯一业务字段是`customers.current_owner_employee_id`；同时追加只属于该Customer的owner history、带合成actor的审计和单表收据。其它Domain（Demand/Priority Lease/Recommendation/Consultation/Waitlist/Lock/Transaction）的责任与TTL均保持原样。

## 二、四个严格权限/事务接口及结果

1. `prepareCustomerOwnerHandover`：输入现有SG06 batch_id、item_id、source/target、Team和客户端请求key，核对batch由该合法经理/店长签发且未完成、Item必须精确`Customer`+源/目标/对象、current Owner当前确实源、对象状态assigned+active、目标员工与有效receiving资格及当前Team事实。合成`planned_disable/sudden_inactive`时源inactive可在已存在可信账本且Team仍合法的情况下只读准备；结束Team关系必拒绝，不替已离职员工授权。**不签发可重放提交token**。
2. `commitCustomerOwnerHandover`：`employee.manage`无权成为Customer Owner敏感写能力。当前PG16**仅合成注册**`customer.owner.transfer`（permission_id=15），**不改变生产角色默认模板**。普通manager需精确Team scope与current capability binding、本人/来源/接替人合法当前成员；store_head可用**单独显式授予**且当前有效的store scope（必须同当前store，来源/目标仍为合法Team当前成员）；个人`deny`优先，普通销售、4S、System Admin、旧session、缺权限、**缺乏当前有效显式跨店Team scope**、店长越权跨店、失活及源越权全拒绝。严格验证接替人active+receiving+独立eligible。
3. 锁顺序：F03-1真实account/session锁 → 共享SG02/04 `pg_advisory_xact_lock(20261010,306)` → 单域序列锁`(20261010,309)` → 可信batch与Customer item `FOR UPDATE` → Customer当前Owner行 `FOR UPDATE` → source/recipient/eligibility `FOR SHARE` → 当前精确Permission+Scope事实；`UPDATE customers ... WHERE current_owner_employee_id=source` CAS必须1行成功才写owner history、audit及Receipt。PG锁超时/死锁/序列失败硬`H04_CONTENTION_DEFER_DENY`，不得以旧只读2G预检当提交token。成功回执是**Customer单域已移交**，不是其它域完成/任何source降权放行。
4. `readCustomerOwnerHandoverReceipt`与`retryCustomerOwnerHandover`：只有当前有效的合法Team/store范围与单独owner权限才可读取；回执最小信息为customer/batch/item/old/new owner、时间、员工actor、独立history/audit ID、请求key SHA256摘要，绝无电话号码、密码或财务数据。收据必须反向同时核对**旧SG06 Customer pending item、batch始发员工、F02不可变owner history、实际audit actor/action/前后Owner/范围与key摘要/同一transaction_timestamp**；任一真实引用错配`H04_RECEIPT_PROOF_DENY`，即使外键齐全亦拒绝。相同`item_id+client_request_key`原参数返回此前收据、绝不新增历史/审计；同Key异意图及异Key重复成功碰撞拒绝。数据库`BEFORE UPDATE/DELETE`明确复用冻结历史保护器，成功收据不可变；已是目标Owner但无可信收据不得补造成功。

## 三、000008增量迁移与物理目录（已通过真实PG16探测）

- 已冻结旧000001～000007、**88表/536列/344约束/138索引、1840原catalog对象**，旧结构SHA `96328994b19e1fef7261ae41bd890575bd196210e85baec685d0192676aff0dd`。不改旧88表的任意字段、权限默认、CHECK、索引或Guard。特设本批`000008_customer_owner_handover_receipts`，只在本目录`000008.sql`创建**一张**不可变收据表，无其它DDL。真实PG16 `--discover`在事务内生成并**ROLLBACK**，A可检查[修订后真实PG16探测CI #37984575314](https://github.com/suzhe868-arch/mb/actions/runs/37984575314)。
- 固定 SQL sha256 `252b931dddc411337a5e787e7512a01a77d5320a299c6714033d73e87b1f3e26`；新结构sha256 `2ffb014e044173837b1a2ce081e518e68b9e723cf440a08c063779c4db9ac0ac`。实际 **89表/548列/360约束/143索引、1890完整catalog对象，新增50个定义键**；旧1840对象逐个`kind+name+definition`不变。收据表使用独立递增PK、**全域唯一request_key_sha256**、唯一item、唯一owner history、唯一audit、全部9个FK、请求Key摘要正则、源≠目标CHECK、数据库触发器不可UPDATE/DELETE；详见`000008.manifest.json`白名单物理键。
- 新旧版本严格隔离：旧2E`verify`在89表应当拒绝，新2H`verify`精确核对old chain至000007、000008真实checksum和完整89表物理目录/授权delta/迁移记录。CI确证`--inject`失败后旧88仍完整，之后正式`--apply → --verify → --rollback`回到旧88且原Guard通过、重新`--apply → --verify`才允许合成业务写；使用过的成功收据不可执行整体回滚。
- 新收据的`receipt_id/item_id/batch_id/customer_id/from/to/actor/team/owner_history_id/audit_id/request_key_sha256/committed_at`与原子history/audit在单PG事务里提交；注错点`before_owner_update/after_owner_update/after_history/after_receipt/after_audit/before_commit`任何抛错，business+history+audit+receipt全文快照回滚。历史唯一owner_history_id在CI专用全局锁下生成，**未声称通用生产序列规划已完成**。

## 四、合成真实PG16专项与旧版完全独立回归

- H批真实测试运行`tests/integration.test.mjs`，**19/19真实PG16综合测试已通过**，包括：冻结schema和旧Guard fail-closed、分离owner写能力与allow/deny优先、经理及有显式store scope店长、旧session/4S/Admin/普通用户负例、离职源合法准备与Team失效拒绝、非法Team/过期capability/不接客目标拒绝、六阶段故障回滚、一个Customer Owner CAS成功且其他七域/SG06 ledger原样、同Key重试与碰撞、独立经理/店长两真实账户并发单客户唯一收据、数据库append-only、受限Receipt合法读取与**伪造audit/receipt拒绝**、版本被篡改/额外Schema拒绝。
- 三项整改完整代码提交 `e66e993e1c7d90cd742ab8f082712a6c59fdf2a4` 的[真实PG16 CI #37985015633](https://github.com/suzhe868-arch/mb/actions/runs/37985015633)已证实**19/19 H专项测试、11/11独立PG16 jobs全通过**，包括新增sudden_inactive、显式store scope店长、伪造Receipt+Audit、正常rollback等完整负例。**新结构的原始证据来源**[CI #37985015633](https://github.com/suzhe868-arch/mb/actions/runs/37985015633) 11/11 jobs成功，并将真实original `SOURCE.md`、旧新完整catalog JSON、`pg16_schema_only.sql`、`pg16_inventory.json`及`sha256sums.txt`**自动由GitHub Actions落入本B分支 `evidence/`**。以上受限工程及19项真实H专项已覆盖。本文件是之后的**交接文档提交**，需以本交接所在最新分支HEAD的同SHA **11/11 jobs + 19/19专项**全绿才能真正交A，代码版CI不能替代本文件的最终CI。
- Workflow共**11个分别新开非特权PG16作业**：本H 89表单域事务；已冻结G 88表预检18/18；F 88表Team个人权限；E 88表SG06 pending-only；D 86表Team；C 84表接客；B 82表治理+空库bootstrap；A 81表旧模板；F03-1 80表认证+HTTPS。历史工作流没有被修改为“容忍新表”，且任何其它批次不能将本单域Receipt当作已完整业务迁移。
- H job真正产生原始`pg_dump --schema-only --no-owner --no-privileges`、完整schema定义目录和真实版本库存；`F03_2H_EVIDENCE_FULL_CATALOG_PASS`检查旧1840每项不变、新增50完全在授权白名单；`F03_2H_ARCHIVE_EXACT_REAL_RAW_BYTES_PASS`核对原始SHA256及新旧原始结构字节一致。仅`pg_dump`自己生成的一对相匹配`\restrict`/`\unrestrict`随机标记允许**有条件归一**，其他SQL内容绝不归一/忽略。原证据源run `37985015633`与原始生成提交号见`evidence/SOURCE.md`，终次CI必须是最新SHA的实际run，不可用原来源run假冒。
- 测试用`h-ci-*`、`Synthetic*`全部为CI合成物；拒绝任何真实客户、密码/token明文或金融记录进入证据。伪造审计/历史/收据负例为**隔离测试库里特意创建且不允许物理删除的合成不可变样例**，不代表应用本身会写假历史或伪造凭据。

## 五、尚未授权/业务风险与交接

本批不实现任何PC/员工端HTTP生产路由，不做真实数据库回写、真实客户归属操作、生产管理员种子、其他Demand/Priority/Consultation/Waitlist/Lock/Transaction七域改负责人，绝不因Owner单域回执将`handover_batches/items`写成`completed`。不改Priority TTL/Customer Level/推荐/来源/转介绍。未来真实业务写的owner_history ID生成、跨域最终事务、真实权限映射及失活账号业务整体验收属于后续独立工程和A裁定；不将CI技术方案冒充已可部署生产。

**B出口条件**：本分支最终HEAD = 最新**成功**的GitHub Actions 11作业`head_sha`，H专项全部通过、结构和原字节证据完整可验，所有分支diff只出现本批新目录与新workflow。达成后标`READY_FOR_A_REVIEW`，唯一下一责任人`A`执行独立复验/必要整改/标准PR合并；B不得自行创建或合并PR。F03-2整体、C/H01高保真与生产均未最终通过，`PRODUCT_BASELINE=NOT_READY`。
