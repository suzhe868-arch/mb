# 名邦汽车 V1｜F03-2-2F SG04 B工程自验与A独立验收交接

> 日期：2026-10-10（Asia/Singapore）｜状态：**B_SELF_TESTED / READY_FOR_A_REVIEW**（只有此交接文件对应最新HEAD同SHA的全部九个CI作业为success才生效）｜下一责任人：A。B未申请或完成PR合并。

## 一、Authority、起点、真实范围

- A独立验收2E并按标准PR #13合并，原始运行37968929785，来源A主控最新main固定起点：`11a08c9c2f609637a7c379a0aebe284e76414119`。
- B正式施工单：`07_重建工作区/F03-2-2F_A主控SG04员工个人权限与Team范围受限治理施工单_2026-10-10.md`。按现行`A_B_C三窗口协作与验收规范`从最新main新建`feat/f03-manager-team-governance-2f`。
- 只新增`engineering/f03/runtime-manager-team-governance/**`及`.github/workflows/f03-2-2f-manager-team-governance.yml`；绝不修改旧文件，尤其所有000001～000007 SQL/checksum/Guard、原CI、PDM Final与任何业务表结构。无DDL，无正式API、PC业务路由、第三方连接、真实账号数据或生产。
- 所有操作只运行在GitHub Actions各自新建、非特权角色`f03_ci`的本机PG16`f03_auth_test`，F03-1有效会话及独立SG05系统管理员事实，由完全合成身份/对象建立证明。除了授权的current覆盖、History、scope/binding与最小审计，禁止更新员工role/store/接客/账号、团队成员、客户owner及各域负责人。

## 二、实现及可证明的严格边界

1. `setManagerPersonalEmployeeManageDecision`：当前有效、独立`system_admin` PC normal会话，目标必须是DB当前active的manager，permission必须已存在`employee.manage`。只允许三态`allow/deny/revoke`；当前覆盖写/删除 + `employee_permission_override_history`新增不可变`revoked`/allow/deny事件 + 带真实Admin actor的脱敏`audit_events`在**同一数据库事务**。重复同一值/没有覆盖的revoke返回NO_OP，零新历史审计。个人deny覆盖allow及role default，绝不更改默认角色模板。
2. `grantManagerTeamCapabilityScope`：System Admin现行事实、明确active manager及team/store、经理当前真实Team membership与已存在`employee.manage` permission。共享SG02 advisory序列化锁`(20261010,306)`并稳定目标/权限/team/scope顺序锁行。仅授予明确的`employee_data_scopes(scope_kind='team',scope_reference_id=team_id)`及同一permission_id的有效`employee_capability_scope_bindings`；已存在的当前有效授权直接NO_OP，两个真实Admin首次并发亦只一条有效scope/binding。不能根据同店、manager角色自动构造范围或提升全球权限。
3. `endManagerTeamCapabilityScope`：同权限及组关系核验，仅结束`employee.manage`对应binding；只有不存在其它有效capability binding时才结束共享scope。其他能力仍使用的scope保留有效，历史审计里明示before/after及是否保留共享scope。已结束NO_OP；四个故障注入点`after_current / after_history / after_audit / before_commit`全部回滚，含共享scope。SG06未闭环账本仍指向该唯一管理者相关团队时保守拒绝撤销。
4. `readManagerTeamGovernanceProof`：受限只读，不是员工管理写能力。从已冻结SG02事实判定逐项复用完整当前manager/employee/active team+store/双方当期成员/个人allow或role默认与个人deny优先/能力范围scope+binder精确权限对应。SG02历史86表Guard继续严格拒绝88表，**没有修改或放宽原SG02守卫**；本模块在当前000007 88表Guard之下独立复核同一谓词，拒绝伪造`managerEmployeeId`、4S、权限/Scope缺失、同店未入团队、过期membership；只返回READ_ONLY proof，不直接允许业务写入。
5. `SG06`降权防护：当目标经理仍有`handover_batches`里`collecting|pending_domain_handover|blocked`未真正完成的责任，个人deny/revoke和其相关Team scope解除保守`DEFER_DENY`。账本本身没有`completed`，不能假称已有业务handover成功；不根据外部`handoverComplete`参数放过。
6. F03-1真实账号→会话锁之后取共享PG advisory锁、目标manager、permission、Team/Scope事实；数据库同TX写入state/history/audit并支持CI受限故障注入。跟SG02共享的锁序可测试并发，但**不宣称对未来SG07业务写或全SG06真实域适配器提供通用TOCTOU撤权机制**。原业务域均无变动。

## 三、PG16原始证据及同SHA真实回归

- 结构原封印`000001→000007`，本批**无新增迁移或DDL**。前后`88表、536列、344约束、138索引`，完整catalog结构SHA `96328994b19e1fef7261ae41bd890575bd196210e85baec685d0192676aff0dd`。PG16原有**1840个catalog对象定义完全一致，新增/修改/删除目录键均为零**。反向checksum篡改/额外schema均拒绝，恢复后verify成功。
- 真实专用CI行级权限、两Admin并发及已加入双System Admin fixture、两manager/4S/普通、失活、个人拒绝、Team不存在、共享能力和故障全回滚：`tests/integration.test.mjs`全部10/10，另包含4点Team end回滚及伪造manager ID负例。
- 所有旧工程回归独立完整新PG16、共9作业：本2F 88表10/10；旧2E pending账本11/11；SG02 2D团队9/9；SG03 2C接客11/11；SG05 2B治理10/10、bootstrap1/1；SG01/2A模板9/9；F03-1真实认证11/11及HTTPS4/4。各旧Guard保留自己原来的表数与严格拒绝新版封印；没有“兼容88表”的放宽。
- 物理来源首次全绿[CI 37972106107](https://github.com/suzhe868-arch/mb/actions/runs/37972106107)（来源SHA `bf4d996b383bad8e6b8adf58bd016c9f2a2a106b`），自动`evidence/SOURCE.md`原始字节归档`old-structure.json`、`new-structure.json`、`pg16_schema_only.sql`、`pg16_inventory.json`、`sha256sums.txt`。
- 后续每个最新HEAD的同SHA九作业CI，必再次生成全新隔离PG16真实pg_dump原文与目录并对`evidence/`做跨运行**按原始字节一致**对比（只容忍pg_dump成对随机restrict token变化）；敏感凭据/真实客户资料不能进入证据。末尾必须出现`F03_2F_ARCHIVE_EXACT_REAL_RAW_BYTES_PASS`及`F03_2F_EVIDENCE_FULL_CATALOG_PASS`。
- 历史失败CI只算本批整改证据，绝不能代替最新SHA九成功CI；新主CI成功也不等于原main合并。**A独立复验必须核实工作分支最新HEAD与Run head_sha完全一致**、9/9作业success、原文件未改、源证据可核验、边界没跨越后才签`A_ACCEPTED`/开标准PR。

## 四、未完成事项和交接

完整SG04治理控制面及经理合法跨功能员工管理、SG06真正Customer/Demand/Priority/Consultation/Waitlist/Lock/Transaction逐项实际移交/历史/域原子成功证据、SG07提交时敏感权限校验、SG08 Publisher、正式PC/微信/JYT/飞书、生产部署与C/H01视觉验收，均**未施工、不得从本批的成功推出已完成**。F03-2整个治理和`PRODUCT_BASELINE=NOT_READY`维持。

**B仅当最新SHA对应九个独立PG16 CI全部success时标为`READY_FOR_A_REVIEW`、`NEXT_OWNER=A`；由A独立验收，B不自行合并main。**
