# F03-2-2J｜A主控正式施工单：SG06 Consultation咨询负责人单域移交与首响SLA保留

> 日期2026-10-10（Asia/Singapore）｜**A_TECH_ADJUDICATED / RELEASED_FOR_B / B_NOT_STARTED**。
> GitHub `suzhe868-arch/mb`，B施工分支`feat/f03-consultation-assignee-handover-2j`。从施工时**最新main**创建；如已存在先核对并保留，禁止强推/reset/main直接施工。B按正式单一次性完成代码、真实PG16、错误整改、独立旧版回归、证据与中文交接`B_SELF_TESTED/READY_FOR_A_REVIEW/NEXT_OWNER=A`，不得自行合并或进入2K，不要求用户逐项批准普通工程整改。

## 一、唯一Authority及冻结边界

- 产品唯一口径：`07_重建工作区/PDM-15_最终完整规则.md`§§4～14、§§17～24（Consultation四主状态、受控reassignment、当前assignee、独立首响、15分钟SLA、失活待交接Guard、内容可见范围）；`PDM-14_最终完整规则.md`§§22～23（Consultation不反写Recommendation、推荐人不自动抢单、价格与隐车可见权独立）；`PDM-03_最终完整规则.md`§§11～14（Customer owner与业务assignee分离、原始来源/关系/历史不反写）；`PDM-02 Final`身份+能力+精确scope+对象状态；适用PDM-25审计。出现真规则冲突不能自定新产品规则，保守拒绝并提交A裁决。
- 已合并前置：F03-2-2E SG06 pending-only批次/项目、2F Team范围、2G全域只读预检、2H Customer单域收据、2I Demand单域收据/两域跨Key、Priority派生责任。正式PR17合并SHA `9bc5e17be2153d4646816c808d6af77409513308`。
- 旧000001～000009迁移、旧PG16`--verify`、旧项目Authority与旧工作流不可修改。最新旧基线**90表/560列/375约束/147索引/1936完整catalog对象**，结构SHA `1532f5b34379e5ec207d9a2b909a11322d0eb6755cc23d6dfc7a419ea6d13eb0`。新2J仅在其专用全新非特权PG16中允许独立追加`000010`，最多**一张append-only Consultation逐项交接收据表**及其严格FK/唯一/触发器；旧对象目录和原迁移SHA必须逐项零改动。若无法在一表内保证原子幂等，必须fail-closed而不是简化成功。
- 默认仅准新增`engineering/f03/runtime-consultation-assignee-handover/**`及独立`.github/workflows/f03-2-2j-consultation-assignee-handover.yml`。**A预授权一个安全最小例外**：为实现本批第三域的*既有全局RequestKey唯一*合同，可仅对已合并的H与I两份服务`engineering/f03/runtime-customer-owner-handover/service.mjs`、`engineering/f03/runtime-demand-responsible-handover/service.mjs`中交接commit/retry封印入口和跨域Key碰撞检查作最小修改。不得动其原业务状态、角色scope校验、审计/receipt、000008/000009 SQL、旧工作流。必须证明H89、I90在没有000010的各自旧独立PG16中严格后向兼容，且J新PG16中H/I/J三向序列化、三域所有顺序和并发不二次成功。不得绕过任何现有旧CI门禁。
- **工程只在GitHub Actions disposable真实PG16+合成账户/Customer/Consultation与F03-1真实受控PC会话发生**，不允许真实客户、生产、微信/JYT/飞书、正式HTTP/员工端UI调用。本批权限如`consultation.assignee.transfer`仅在CI synthetic fixture注册，不预设生产角色种子；必须与`employee.manage`、`customer.owner.transfer`、`demand.responsible.transfer`完全独立。

## 二、四项Domain职责

1. **`prepareConsultationAssigneeHandover`**：只读核SG06现存合法批次和精准kind=`Consultation` item，真实`consultations(consultation_id,customer_id,vehicle_id,listing_cycle_id,assignee_employee_id,status,source_relation,first_response_deadline,completed_at,close_reason)`当前合法完整关系。仅`pending`或`processing`为本批可转派未终结对象；`resolved`/`invalid`、未知状态和关系丢失应拒绝。与对应Customer/current listing_cycle/Vehicle业务边界保持独立保守查验，不能凭Customer Owner或Recommendation历史当当前assignee。
2. **`commitConsultationAssigneeHandover`**：仅当前合法受控经理/店长独立`consultation.assignee.transfer`能力、精确Team/store/data scope及角色、来源/目标员工有效性，经**同一PG16事务重新验证**SG06 batch/item、Consultation当前assignee CAS、账号当前权、个人deny、当前Team成员，合法时**只更新`consultations.assignee_employee_id`**，其他现有Consultation字段一律原样，不能把转派当开始处理或首条真人响应；不修改`status`、`source_relation`、`first_response_deadline`、`completed_at`、`close_reason`、listing_cycle或Customer owner。原assignee突然inactive时，只有可信批次和合法范围内能移交，不授权inactive员工本人操作。操作者`receiving_status='paused'`不自动失权；接替人是否合法须按PDM-15**人工转派资格**，不得误用自然注册接客开关产生无授权硬门禁。
3. **不可变Consultation单域收据与审计**：本批新表记录真实batch/item、Consultation ID+Customer、旧/新assignee、操作者、关联受控Team、RequestKey SHA、`audit_id`及事务时间，`UNIQUE(item_id)`、全域一致的唯一Key和audit FK、append-only阻止update/delete；真实`audit_events`记录before/after及完整scope引用，同事务持久化或注错完整rollback。读取历史收据时对每次不可变来源和合法后继Consultation转派审计链作校验，**不错误要求早期收据to永远等于现任assignee**；无可信后继改写需拒绝证据伪造。当前读取者权限必须重新验证，不因历史参加过就自动可见客户完整咨询内容。
4. **`retryConsultationAssigneeHandover`和收据读取**：同item/同Key/同意图返回原收据，无第二次业务写、history或audit；同Key跨H/I/J其它batch/item/Customer/Domain不得二次提交，三个域各自表的物理UNIQUE+共享治理事务锁和双向守卫必须共同证明真正**三域全局**单意图。三个不同合法Key正常同时运行；跨域并发、注错回滚、先J后H/I、先H/I后J都需真正PG16两个受控会话正反例。旧SG06 ledger仍只保留pending/retry，不写completed、不以单域完成宣布所有业务已移交。

## 三、SLA和跨域不反写严格门禁

- Consultation初始`first_response_deadline`为独立已确立事实；交接不得重新生成、延长或缩短首次响应倒计时。没有首次真实人工响应时，reassignment或单次follow-up不自动当作首响、不得更改首响完成/首次响应事实。
- 已有`pending`/`processing`的同Customer+Vehicle+listing_cycle未终结咨询不得创建第二个、不得修改业务来源为新的Recommendation或Share。Recommendation end/void不终止已有Consultation，Consultation移交不反向创建/结束Recommendation、价格查看权或隐藏车可见权，历史推荐人/price-right/visibility grant一律不变。
- Customer owner、Demand、Priority lease、Waitlist、Lock、Transaction、员工接客状态、真实车辆、渠道来源、业务咨询内容不能附带修改。即使整个批次仍有未交接域，不能据Consultation受限成功收据释放员工停用/降权、关闭旧SG06 ledger或声称跨域完成。

## 四、J01～J10强制工程及验收门禁

- **J01**：真实PG16检查000001～000009版本及checksum、90表/560列/375约束/147索引/1936完整catalog SHA严格原样；仅新增000010一张收据表，新结构和目录增量由真实PG16发现，以manifest明确列出/封印，支持新迁移事务discover注错回滚、apply/verify及未使用前rollback/旧结构验证。
- **J02**：合成独立当前Consultation管理/转派许可，manager/店长精确scope，personal deny、失活/旧session/restricted/4S/System Admin/普通销售、跨门店显式Team与无权店长、暂停接客操作者/已失效原assignee/合格接替者等全部正反例；任何无依据跨店权限绝不推断。
- **J03**：`pending`/`processing`合法、`resolved`/`invalid`不可恢复；Customer与车辆listing_cycle关系、旧Consultation关联来源、已有未终结唯一索引事实保持；未知或失效对象DENY。不得修改Customer Owner来让咨询责任合法。
- **J04**：单PG16事务CAS、旧SG06已有item、不可变收据与audit原子提交，before_update/after_update/after_audit/after_receipt/before_commit全注错回滚，真实双会话一个assignee对象只一个结果；不同Key正常、重复同Key严格幂等。
- **J05**：H/I/J真正**三向全局RequestKey**碰撞防护，三个域6种两域顺序与三域混合并发测试；H89/I90旧环境独立验旧封印，J新环境新封印；共享锁与物理约束不能靠不存在的第三表查询报错冒充通过。
- **J06**：Consultation连续两次合法转派前/后收据均能经不可变审计链证明；现任无合法后继收据直接漂移DENY；reader已失效/deny/out-of-scope不泄露完整业务内容；旧source历史不抹除。
- **J07**：原本deadline、状态、source_relation、Recommendation、Demand/Priority/Customer owner、Vehicle、Waitlist/Lock/Transaction、SG06 batch/item全行快照完全一致，只有目标Consultation.assignee变化及对应新audit/receipt；初始15分钟SLA自然流逝但不因转派重置。
- **J08**：旧全部冻结回归：2I90表、2H89表、2G/2F/2E88表、2D86、2C84、2B82双作业、2A81、F03-1 80表认证及HTTPS，全部独立全新非特权PG16成功。绝不修改旧CI/Guard适配新表。
- **J09**：原始完整schema-only SQL、catalog old/new全键、inventory、SQL/checksums及SOURCE run+SHA从真实专用PG16自动归档；末次同HEAD成功CI确认未触碰老1936键及只新增批准目录键，来源原字节交叉比对（只允许pg_dump自带成对restrict随机键受控归一），不存客户生产数据或凭证。
- **J10**：B最终HEAD与最新`completed/success` CI的run.head_sha精确一致，每个job成功、新域真实pg16用例数量准确，交接报告中文列出：施工许可范围、H/I旧守卫最小例外diff、SLA保持/连转历史证据、真实CI与PG16 source/新sha、当前已知无法正式生产化边界，并明确`B_SELF_TESTED/READY_FOR_A_REVIEW/NEXT_OWNER=A`。未经A独立代码、证据、权限、PG16审查签字不得合并main。

## 五、结论

F03-2-2J只验收**合成隔离PG16中Consultation assignee单域受控交接与不可变事实、SLA不重置**，不会实施正式PC/员工端业务写、生产、跨域SG06真正全部移交、财务/退款、Priority/Recommendation写、线上通知；不替换已批准的PDM Final。F03-2整体和C/H01设计尚未验收，`PRODUCT_BASELINE=NOT_READY`。

**NEXT_OWNER=B / NEXT_TASK=F03_2_2J_CONSULTATION_ASSIGNEE_SINGLE_DOMAIN_PG16_HANDOVER_SLA_PRESERVATION_READY_FOR_A。**
