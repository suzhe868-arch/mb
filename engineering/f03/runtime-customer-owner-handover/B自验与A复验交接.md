# 名邦汽车 V1｜F03-2-2H B工程自验、物理证据与A独立验收交接

> 2026-10-10（新加坡）｜**B_SELF_TESTED / READY_FOR_A_REVIEW**（须以本交接所在**最终HEAD同SHA**十一作业全部`success`才生效）｜**NEXT_OWNER=A**｜**PRODUCT_BASELINE=NOT_READY**。B不合并main、不创建生产业务接口。

## 一、已验收权威与本轮批准范围

- 唯一正式A施工单：`07_重建工作区/F03-2-2H_A主控SG06唯一CustomerOwner受限真实逐项移交及事务收据施工单_2026-10-10.md`；PDM-02/PDM-03 Final §§1、4、7、9、11～14及2E/2F/2G严格隔离Authority。
- A已独立通过2G四项整改及PR #15；本次从当时最新main `14599fc07e60342decc2e6495760a6669c24dedc` 新建指定分支 `feat/f03-customer-owner-handover-2h`；全量文件**只新增** `engineering/f03/runtime-customer-owner-handover/**` 及 `.github/workflows/f03-2-2h-customer-owner-handover.yml`，所有旧文件、旧CI、000001～000007迁移、生产、真实身份和业务数据零修改。
- 仅在GitHub Actions单次新建非特权PostgreSQL 16（DB `f03_auth_test`、role `f03_ci`）、F03-1真实受控合成PC会话、F02业务表合成Customer/员工/角色/历史下执行；正常认证session更新时间不冒充业务域写。本批**真正提交**的唯一业务字段是`customers.current_owner_employee_id`；同时追加只属于该Customer的owner history、带合成actor的审计和单表收据。其它Domain（Demand/Priority Lease/Recommendation/Consultation/Waitlist/Lock/Transaction）的责任与TTL均保持原样。

## 二、四个严格权限/事务接口及结果

1. `prepareCustomerOwnerHandover`：输入现有SG06 batch_id、item_id、source/target、Team和客户端请求key，核对batch由该合法经理/店长签发且未完成、Item必须精确`Customer`+源/目标/对象、current Owner当前确实源、对象状态assigned+active、目标员工与有效receiving资格及当前Team事实。合成`planned_disable/sudden_inactive`时源inactive可在已存在可信账本且Team仍合法的情况下只读准备；结束Team关系必拒绝，不替已离职员工授权。**不签发可重放提交token**。
2. `commitCustomerOwnerHandover`：`employee.manage`无权成为Customer Owner敏感写能力。当前PG16**仅合成注册**`customer.owner.transfer`（permission_id=15），**不改变生产角色默认模板**。普通manager需精确Team scope与current capability binding、本人/来源/接替人合法当前成员；store_head可用**单独显式授予**且当前有效的store scope（必须同当前store，来源/目标仍为合法Team当前成员）；个人`deny`优先，普通销售、4S、System Admin、旧session、缺权限、跨店、失活及源越权全拒绝。严格验证接替人active+receiving+独立eligible。
3. 锁顺序：F03-1真实account/session锁 → 共享SG02/04 `pg_advisory_xact_lock(20261010,306)` → 单域序列锁`(20261010,309)` → 可信batch与Customer item `FOR UPDATE` → Customer当前Owner行 `FOR UPDATE` → source/recipient/eligibility `FOR SHARE` → 当前精确Permission+Scope事实；`UPDATE customers ... WHERE current_owner_employee_id=source` CAS必须1行成功才写owner history、audit及Receipt。PG锁超时/死锁/序列失败硬`H04_CONTENTION_DEFER_DENY`，不得以旧只读2G预检当提交token。成功回执是**Customer单域已移交**，不是其它域完成/任何source降权放行。
4. `readCustomerOwnerHandoverReceipt`与`retryCustomerOwnerHandover`：只有当前有效的合法Team/store范围与单独owner权限才可读取；回执最小信息为customer/batch/item/old/new owner、时间、员工actor、独立history/audit ID、请求key SHA256摘要，绝无电话号码、密码或财务数据。收据必须反向同时核对**旧SG06 Customer pending item、batch始发员工、F02不可变owner history、实际audit actor/action/前后Owner/范围与key摘要/同一transaction_timestamp**；任一真实引用错配`H04_RECEIPT_PROOF_DENY`，即使外键齐全亦拒绝。相同`item_id+client_request_key`原参数返回此前收据、绝不新增历史/审计；同Key异意图及异Key重复成功碰撞拒绝。数据库`BEFORE UPDATE/DELETE`明确复用冻结历史保护器，成功收据不可变；已是目标Owner但无可信收据不得补造成功。

## 三、000008增量迁移与物理目录（已通过真实PG16探测）

- 已冻结旧000001～000007、**88表/536列/344约束/138索引、1840原catalog对象**，旧结构SHA `96328994b19e1fef7261ae41bd890575bd196210e85baec685d0192676aff0dd`。不改旧88表的任意字段、权限默认、CHECK、索引或Guard。特设本批`000008_customer_owner_handover_receipts`，只在本目录`000008.sql`创建**一张**不可变收据表，无其它DDL。真实PG16 `--discover`在事务内生成并**ROLLBACK**，A可检查[原始探测CI #37980939909](https://github.com/suzhe868-arch/mb/actions/runs/37980939909)。
- 固定 SQL sha256 `e1fc6ba93e965c9a84b8ce01ebd101cfad3b52663e3ddbc91873e0ad34ef6c99`；新结构sha256 `b49d977c8ccdd48fd183c3f098456c36e705b738ff19b057bb6e05e118c1612e`。实际 **89表/548列/359约束/142索引、1886完整catalog对象，新增46个定义键**；旧1840对象逐个`kind+name+definition`不变。收据表使用独立递增PK、唯一item、唯一owner history、唯一audit、全部9个FK、请求Key摘要正则、源≠目标CHECK、数据库触发器不可UPDATE/DELETE；详见`000008.manifest.json`白名单物理键。
- 新旧版本严格隔离：旧2E`verify`在89表应当拒绝，新2H`verify`精确核对old chain至000007、000008真实checksum和完整89表物理目录/授权delta/迁移记录。CI确证`--inject`失败后旧88仍完整，之后正式`--apply → --verify → --rollback`回到旧88且原Guard通过、重新`--apply → --verify`才允许合成业务写；使用过的成功收据不可执行整体回滚。
- 新收据的`receipt_id/item_id/batch_id/customer_id/from/to/actor/team/owner_history_id/audit_id/request_key_sha256/committed_at`与原子history/audit在单PG事务里提交；注错点`before_owner_update/after_owner_update/after_history/after_receipt/after_audit/before_commit`任何抛错，business+history+audit+receipt全文快照回滚。历史唯一owner_history_id在CI专用全局锁下生成，**未声称通用生产序列规划已完成**。

## 四、合成真实PG16专项与旧版完全独立回归

- H批真实测试运行`tests/integration.test.mjs`，验证11～14类覆盖：冻结schema和旧Guard fail-closed、分离owner写能力与allow/deny优先、经理及有显式store scope店长、旧session/4S/Admin/普通用户负例、离职源合法准备与Team失效拒绝、非法Team/过期capability/不接客目标拒绝、六阶段故障回滚、一个Customer Owner CAS成功且其他七域/SG06 ledger原样、同Key重试与碰撞、独立经理/店长两真实账户并发单客户唯一收据、数据库append-only、受限Receipt合法读取与**伪造audit/receipt拒绝**、版本被篡改/额外Schema拒绝。
- 之前同SHA业务前置专项[CI #37981672005](https://github.com/suzhe868-arch/mb/actions/runs/37981672005)已11/11通过、十一独立jobs成功，并将真实original `SOURCE.md`、旧新完整catalog JSON、`pg16_schema_only.sql`、`pg16_inventory.json`及`sha256sums.txt`**自动由GitHub Actions落入本B分支 `evidence/`**。后来专项加强了伪造收据校验、回滚测试及离职和店长显式门禁，最终结论**只以本交接所在最新分支HEAD的同SHA 11/11 jobs + 最终真实H测试数为准**。
- Workflow共**11个分别新开非特权PG16作业**：本H 89表单域事务；已冻结G 88表预检18/18；F 88表Team个人权限；E 88表SG06 pending-only；D 86表Team；C 84表接客；B 82表治理+空库bootstrap；A 81表旧模板；F03-1 80表认证+HTTPS。历史工作流没有被修改为“容忍新表”，且任何其它批次不能将本单域Receipt当作已完整业务迁移。
- H job真正产生原始`pg_dump --schema-only --no-owner --no-privileges`、完整schema定义目录和真实版本库存；`F03_2H_EVIDENCE_FULL_CATALOG_PASS`检查旧1840每项不变、新增46完全在授权白名单；`F03_2H_ARCHIVE_EXACT_REAL_RAW_BYTES_PASS`核对原始SHA256及新旧原始结构字节一致。仅`pg_dump`自己生成的一对相匹配`\restrict`/`\unrestrict`随机标记允许**有条件归一**，其他SQL内容绝不归一/忽略。原证据源run与提交号见`evidence/SOURCE.md`，终次CI必须是最新SHA的实际run，不可用原来源run假冒。
- 测试用`h-ci-*`、`Synthetic*`全部为CI合成物；拒绝任何真实客户、密码/token明文或金融记录进入证据。伪造审计/历史/收据负例为**隔离测试库里特意创建且不允许物理删除的合成不可变样例**，不代表应用本身会写假历史或伪造凭据。

## 五、尚未授权/业务风险与交接

本批不实现任何PC/员工端HTTP生产路由，不做真实数据库回写、真实客户归属操作、生产管理员种子、其他Demand/Priority/Consultation/Waitlist/Lock/Transaction七域改负责人，绝不因Owner单域回执将`handover_batches/items`写成`completed`。不改Priority TTL/Customer Level/推荐/来源/转介绍。未来真实业务写的owner_history ID生成、跨域最终事务、真实权限映射及失活账号业务整体验收属于后续独立工程和A裁定；不将CI技术方案冒充已可部署生产。

**B出口条件**：本分支最终HEAD = 最新**成功**的GitHub Actions 11作业`head_sha`，H专项全部通过、结构和原字节证据完整可验，所有分支diff只出现本批新目录与新workflow。达成后标`READY_FOR_A_REVIEW`，唯一下一责任人`A`执行独立复验/必要整改/标准PR合并；B不得自行创建或合并PR。F03-2整体、C/H01高保真与生产均未最终通过，`PRODUCT_BASELINE=NOT_READY`。
