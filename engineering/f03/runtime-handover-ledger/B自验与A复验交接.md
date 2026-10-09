# F03-2-2E｜B自验与A独立验收交接

日期：2026-10-10（新加坡）。状态：READY_FOR_A_REVIEW（仅以最终B HEAD的同SHA真实八作业成功CI为生效证明）。NEXT_OWNER=A。B不自行PR合并、修改main、连接生产或声明项目已上线。

## 一、基线、授权与边界

- 仓库 suzhe868-arch/mb。B从A放行时最新main 1ca2637f84cd985c655c78a305c49a6b5e2bd1d9 建立 feat/f03-handover-ledger-2e。
- A唯一工作单：07_重建工作区/F03-2-2E_A主控SG06交接账本与逐项幂等施工单_2026-10-10.md。遵守A_B_C三窗口协作与验收规范。
- 仅新增 engineering/f03/runtime-handover-ledger/** 和 .github/workflows/f03-2-2e-handover-ledger.yml；此前F02 000001、F03-1 000002及000003～000006全部不可修改，不替换原Guard。main旧文件未作编辑/删改。
- 代码和所有事实只用于GitHub Actions每作业独立新建的PostgreSQL16本机f03_auth_test、非特权f03_ci与合成员工/经理/团队/顾客/需求。正式业务端路由、生产环境、微信/JYT/飞书、资金与真实客户资料均未接触。

## 二、真正完成的能力和禁止误读的业务边界

1. 000007_handover_batch_item_ledger只新增两个表：
   - handover_batches：稳定batch_id，可信source_employee_id、initiated_by_kind/id、change_kind、invalid_at、reason、严格绑定真实主体的client_request_key、collecting/pending_domain_handover/blocked技术状态、version和时间。请求唯一键全局UNIQUE，不同actor/source/kind复用同键拒绝。
   - handover_items：稳定item_id、batch关联、固定七种object_kind和不虚构跨业务FK的object_id、from/intended employee FK、pending/retry_required/blocked技术状态、attempt_count、脱敏last_error_code、UNIQUE(batch_id,object_kind,object_id)、时间；无completed状态和任何真实业务成功权限。SQL CHECK从物理层拒绝直接将batch/item改成completed。
2. 可信受限内部账本API：createHandoverDraft、addPendingHandoverItem、recordItemFailure、retryPendingItem。真实F03-1正常PC会话下，严格采用DB当前Employee经理主角色、有效employee.manage能力（显式个人允许/拒绝或角色当前有效配置）、scope_kind=team且同permission_id的有效capability-specific binding、真实active Team/Store/经理与source成员当前有效记录；无scope/4S/System Admin/restricted/失效旧会话/伪actor/global/客户owner注入一律DENY。合成员工5、6各有独立真实显式scope；经理并未获得默认授权。
3. 只核验受限对象的基础存在性与当下原负责人：Customer读取customers.customer_id/current_owner_employee_id，Demand读取demands.demand_id/responsible_employee_id；仅合成fixture明确存在的301/302/401且原负责人为合成员工7可登记为**待处理**。Priority虽有priority_leases表但无可用当前responsible关联；其他Consultation/Waitlist/Lock/Transaction未具备此批域提交Guard，全部DEFER_DENY，不能靠自造数字越权。新账本绝不推断对象已真正移交。
4. 对相同batch+kind+id，重复追加NO_OP；批次和明细写入在同事务锁batch，然后按具体item稳定定位/行锁重验，目标active且合法角色。重复client_request_key由PG16唯一键及事实重验约束，不同actor/source无法盗用。已提交其他item的失败记录不受后续item故障回滚影响。
5. recordItemFailure仅把真实pending记为retry_required、attempt_count+1和有限脱敏error类别；retryPendingItem仅把retry_required退回pending，始终不写completed。以审计中意图SHA256校验跨事务重放：重复相同失败/重试意图不增次数、不重复审计；变更与batch version+1、最小before/after audit同PG事务，after_current/after_audit故障注入恢复该item/batch/audit原样。同一用户两个独立PC session并发单item只产生一次写；两个不同合法经理账号并发同request_key只允许一人创建并强制另一人碰撞拒绝。
6. **不办理域交接**：本批不更新任何Customers.current_owner、Demands.responsible、Consultations/Waitlists/Locks/Transactions负责人或Priority，不更新员工store_id/main_role_id/employment_status/receiving_status，不写已成功业务域历史；无凭账本来执行实际调店/降权/停用。计划事件只登记等待后批；sudden_inactive在当前可信scope不足时仍DEFER_DENY。必须待SG06真正域adapter及其提交Guard/历史原子证明单独验收，才能讨论completed。

## 三、PG16物理封印与实测来源

- 迁移链：000001→000002→000003→000004→000005→000006→000007；上游86表物理SHA b5e4c698ffa648d5ab7af4d7e389c23a40eb080849a812e0fc50699b4687e572。
- 000007 SQL SHA256 e35fcda4e7a730a3e0342dbfc74fd780e3f7ccca4680c6de2725f89396d8730a；新增后 **88表、536列、344约束、138索引**，PG16完整物理SHA 96328994b19e1fef7261ae41bd890575bd196210e85baec685d0192676aff0dd。
- 旧86表全量1761个PG catalog对象保持定义原样；实际只追加manifest锁定的79个精确目录键，总1840。000007 apply幂等；注入DDL事务回滚恢复原86表完整Seal；已记账的库version rollback失败（不得误删真实历史）；历史版本checksum或陌生schema必须拒绝。
- 原始成功来源运行：[CI 37968266592](https://github.com/suzhe868-arch/mb/actions/runs/37968266592)，来源B SHA 0a1f02b7f9af78c8102514f493c1df9c98c04c9c，原始作业附件11633394876。evidence/SOURCE.md落库，原样归档PG16的pg16_schema_only.sql、pg16_inventory.json、old-structure.json、new-structure.json、sha256sums.txt。
- 最新SHA CI会重新创建完全独立PG16，从86表重做000007；复核旧/新目录、归档原始inventory逐字节和pg_dump只存在成对随机restrict key差异。成功日志须明确 F03_2E_EVIDENCE_FULL_CATALOG_PASS 和 F03_2E_ARCHIVE_EXACT_REAL_RAW_BYTES_PASS。SOURCE来源SHA不冒充最终HEAD。

## 四、真实测试矩阵和待A复验

- 本批E01～E08及数据库附加负例、跨账号并发：Node真实PG16集成测试 11项全部需通过。具体详见 tests/integration.test.mjs 与 测试覆盖与边界表.tsv。
- 同一最终GitHub SHA的**八个互相隔离的PostgreSQL16作业**：88表2E、86表2D 9/9、84表2C 11/11、82表2B人口10/10及首Admin bootstrap1/1、81表2A 9/9、旧80表F03-1认证11/11和HTTPS安全4/4；绝不在88表禁用或迁就旧Guard。原证据入库后的第二次及后续运行还须检查来源与当前物理结构字节对照。
- 最终B验收提交SHA取Github上feat/f03-handover-ledger-2e最新HEAD，不提前写死中间SHA。A独立核对工作流最新run的head_sha=该HEAD，run completed/success、8/8 jobs success、源原始结构归档、旧文件零修改并正常走标准PR。
- 工程最终状态**仅在上述同SHA门禁全绿后为 READY_FOR_A_REVIEW / NEXT_OWNER=A**。这是B自验，不是A_ACCEPTED、未合并main、F03-2整体仍未验收且PRODUCT_BASELINE=NOT_READY，C/H01视觉独立待审核。

## 五、已冻结的待办

Domain adapter及各业务负责关系提交/域History/Audit原子确认、正式completed、真正员工调店/降权/突发inactive治理、SG04/SG07/SG08正式控制面与发布、真实Customer Owner交接、真实数据与部署均须之后A独立施工和验收。本批必须始终DEFER_DENY，不能据新账本声称这些已完成。
