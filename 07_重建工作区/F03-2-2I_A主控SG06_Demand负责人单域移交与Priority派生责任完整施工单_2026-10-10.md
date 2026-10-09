# F03-2-2I｜A主控正式施工单：SG06 Demand当前负责人单域原子移交与Priority关联责任守卫

> 日期2026-10-10（新加坡）｜**A_TECH_ADJUDICATED / RELEASED_FOR_B / B_NOT_STARTED**。
> 唯一B工程施工分支：`feat/f03-demand-responsible-handover-2i`。从执行时最新main建立；分支若已经存在，先核验和沿用，**禁止reset/force push或在main直接施工**。B在同一批内完成全部实施、失败整改、真实新库PG16测试、完整证据、交接，`B_SELF_TESTED/READY_FOR_A_REVIEW/NEXT_OWNER=A`；**不得B自行PR合并main**。不要求用户逐项批准技术整改。

## 一、权威边界与实际物理基线

1. 唯一业务Authority：`07_重建工作区/PDM-02_最终完整规则.md` §§2/4/9/10（许可+精确data scope+object state、个人deny/硬拒、跨店显式授权、暂停接客不自动撤销管理权）；`PDM-03_最终完整规则.md` §§11～14（Customer current owner与各业务负责人绝对分层、交接逐项保留不可变历史/部分失败）；`PDM-11_最终完整规则.md` §§8～11（Demand正式主状态只有active/paused/completed/cancelled、负责人独立于Customer owner、需正式reassignment及历史、离职inactive active/paused必须交接）；`PDM-13_最终完整规则.md` §§9/10/24～26（Priority current responsible**派生于当前trigger Demand responsible**、TTL在交接中持续运行且绝不暂停/重置、creator/history不回写）；PDM-12 Matching/PDM-14 Recommendation独立业务Authority，不得篡改。若有真实跨PDM产品冲突，停在有证据的fail-closed，交A裁决，不能由B重定义Final。
2. 已验收并合并：F03-2-2E pending-only SG06账本(PR13)、2F current Team权(PR14)、2G全域受限只读预检(PR15)、2H CI合成Customer Owner单域CAS/历史+收据(PR16)。本批从最新main PR16合并后的SHA `acdc65e140c341916160bd02dd92eb93448ade06`新建分支。老000001～000008均视为**只读冻结**。000001～000007的结构**88表/536列/344约束/138索引/1840目录对象**；000008后为**89表/548列/360约束/143索引/1890目录对象**，SHA `2ffb014e044173837b1a2ce081e518e68b9e723cf440a08c063779c4db9ac0ac`。前八项checksums和所有定义键不能有任何改动。
3. 本批仅准新增 `engineering/f03/runtime-demand-responsible-handover/**` 及独立`.github/workflows/f03-2-2i-demand-responsible-handover.yml`；不得修改旧迁移/SQL/旧F03认证、已验收Guard、旧CI/PDM/HTTP/产品规则。允许提议独立`000009`技术隔离新迁移，**最多只新增一张append-only Demand逐项交接收据表**，不得添加、更改或删除任何旧表字段/旧约束/权限种子/角色默认权限。结构增量需以真实PG16由B先发现、A复验。
4. 所有业务写只在GitHub Actions全新一次性本机非特权`f03_ci` PostgreSQL 16 `f03_auth_test`、F03-1真正当前受控合成PC登录及合成Customer、员工、Demand和现有SG06 batch/item中演练；CI外、生产、真客户、外部系统、微信/JYT/飞书、员工端PC正式HTTP、现金业务均不允许。没有上游系统数据输入。必须验证历史89表本物理版本与PG16封印后才在同隔离库安全申请000009。

## 二、四项最小Domain交付

1. **`prepareDemandResponsibleHandover`只读受控预检**：取已存在batch_id、kind=`Demand`的精确item_id、原责任人、拟承接人和受限Team/store，要求合成当前非restricted合法经理/店长PC会话、独立真实现行permission+capability scope、符合batch发起/来源及可信item映射。用DB实际`demands.customer_id/responsible_employee_id/demand_state`和其Customer account/owner关联证明：**active或paused为可正式待交接对象**；completed/cancelled为历史，不在本批迁移范围；未知或资料缺失则DEFER_DENY。不能因Customer owner已改写就认为Demand改派完成；不能因接受者与新Customer owner不同便错误拒绝合法独立负责人。
2. **`commitDemandResponsibleHandover`真实单域PG16合成事务**：须有严格独立业务敏感能力`demand.responsible.transfer`（仅本批CI fixture可合成注册，**不准使用`employee.manage`、`customer.owner.transfer`或经理职位直接推断能力**）。提交时读取/锁住F03-1会话/当前权、精确Team/store现行成员及permission绑定、source与recipient当前身份、batch/item和Demand行，强制CAS只写`demands.responsible_employee_id`，不改`demand_state`、created_at、criteria/匹配条件、Customer Owner、其它业务对象。current PDM明确paused不是终结，paused亦可按合法正式handover，**接客开关只管新自然轮询，不能擅自作为已有Demand责任移交操作人撤权条件**；承接方真实资格与权限/范围必须经独立当前事实校验，不能随意把接受新自动客流的`accepting`条件提升为所有人工责任迁移的绝对硬门禁；不确定须证据化DENY。所有权限在**同一提交事务**按现行值复验，失活/调Team/撤scope/个人deny/role变化立即拒绝。
3. **不可变Demand单域收据与真实审计**：单域成功时在同一PG16事务写当前Demand责任变化的before/after、操作者、batch/item、RequestKey摘要、时间、准确责任对象ID及必要来源历史；必要新000009收据必须append-only、防DELETE/UPDATE、含真实引用FK、`UNIQUE(item_id)`和**跨Customer/Domain交接意图的全局RequestKey摘要唯一性**、不被其它item/key造假；对旧batch/item只能继续pending/retry，不得变为completed。必须区分本Demand域已交接和全部SG06域未完成，永不能把成功当成Customer owner已改或其它业务全部完成。合法当前scope的只读receipt要交叉校验Demand、batch/item、audit历史语义和已有immutable来源，而非“FK齐了就相信伪造收据”。
4. **`retryDemandResponsibleHandover`幂等与部分失败**：同一个item+同Key+同完整意图重复请求返回可信既有receipt，不重复写Demand/audit；跨item/batch/customer复用同Key冲突DENY，既已成功的同item新Key也DENY；不同合法item独立可成功。多真实PG16登录会话不同角色竞争，同Demand或同Key只有一个成功，失败后保留原责任/已成功收据，故障注入rollback不得留下半条历史，且不得简单重放不明结果。

## 三、Priority current responsible派生守卫（本批不得改Priority行）

- 仅当真实`priority_leases.trigger_demand_id`正好指向该Demand且生命周期与Customer/Match事实合法时，新Priority**业务处理责任由trigger Demand的当前合法responsible实时派生**；本批不得直接加/改`priority_leases.responsible_employee_id`、creator、status、`trigger_demand_id`、`expires_at`、`ended_at`，不因移交暂停、延长或重置TTL、创建/释放Priority或自动Recommendation/Match。需要后续Priority域adapter时独立开施工单。
- 对Trigger Demand仍active+matching-ready与paused、completed、cancelled、TTL过期、ended、source/target失去资格等真实PG16合成情况，提供最小关联状态报告：合法派生当前责任或`PRIORITY_RELATION_REVALIDATE/DEFER_DENY`，**不能据只改Demand字段宣称Priority所有生命周期动作已完成**。
- 原Recommendation.recommender_employee_id是历史真实creator/actor，Demand改派不自动修改Recommendation或其可见权/价格权；Match result、Source Radar、Consultation/Lock/Waitlist/Transaction、Customer owner/来源/等级仍全部原样，分别逐行做before/after快照。
- 未完成或真实需要其它Domain移交的SG06 batch必须继续待处理，不能以Demand单域收据直接停用/降权/调店已离职源员工。

## 四、I01～I10真实PG16强制门禁

1. **I01物理封印**：旧000001～000008版本元数据、真实PG16 89表/548列/360约束/143索引/1890全目录原定义逐项一致，原SHA `2ffb014e044173837b1a2ce081e518e68b9e723cf440a08c063779c4db9ac0ac`。000009新表至多一张，真实发现/滚回/注错再应用，新增定义白名单与本批自己`--verify`；旧2H/2G/旧基线各原Guard在自己的旧版本独立库仍严格拒绝不当新结构。
2. **I02当前权限**：System Admin/4S/普通销售/旧或restricted session、自授敏感许可、role名称代替独立permission、employee.manage借权、Customer Owner许可借权、个人deny、失效Team/store数据范围、同店不同Team、跨店已显式Team scope与店长非本店硬拒，全部真实正反例。暂停接客但仍合法操作人的正例；recipient是否合格以正式Demand人工移交当前条件为准，不伪造自动轮询资格。
3. **I03生命周期**：active与paused有真实可行合法路径，completed/cancelled严格拒绝；当下Customer和Domain关系一致；多Demand同Customer独立、ClientOwner不同于Demand负责人仍正确；未知状态/旧待办/被占用对象保守拒绝。
4. **I04原子及历史**：Demand唯一单责任CAS、batch/item来源一致；注错点before_update、after_update、after_audit、after_receipt、before_commit全部rollback且逐行快照严格一致。旧batch/items不追加错误completed，成功单域收据和audit在原事务提交。
5. **I05跨item/key幂等**：同item同key同意图正向幂等；相同key不同item/batch/Customer、同item异key冲突；两PG16会话并发并对真实唯一约束证明单胜，不能因错误返回导致半条写。
6. **I06 Priority**：当前触发Demand/其它同Customer Demand、valid/expired Lease、无trigger、TTL未过与TTL自然到期、Priority status未知、客户/匹配不匹配情形；只能派生只读report，Priority历史/TTL/ended/Recommendation/Match完整行级不变。
7. **I07权限撤销与并发**：合成同SHA真实受控PC当前会话、manager/store_head、Team能力撤销、操作人inactive、接受人失活/失去范围、batch item冲突与Demand同时改派，旧状态不得放行提交。
8. **I08原始证据**：新旧数据库schema-only pg_dump、完整catalog JSON、inventory、SQL/文件SHA256及`SOURCE.md`准确源CI run与source SHA原样归档；末次同HEAD成功CI同时比对**真实原始字节**和完整旧+增量对象（仅pg_dump原生一对restrict随机标记在充分配对时可有条件归一），不得提交业务行/真实凭据。
9. **I09冻结回归**：2H 89表、2G 88表、2F 88表、2E 88表、2D 86表、2C 84表、2B 82表双job、2A 81表、F03-1 80表认证及HTTPS，**全部各自全新隔离PG16**真正运行且全绿；新I在自己受控新结构中验证，不能为让旧CI通过而变更旧Guard。
10. **I10分支/交接**：仅新增本批约定的新目录与workflow，旧main任一文件不得modified/deleted。最终分支HEAD与成功run.head_sha严格一致、每job success、新批独立测试全部success、B中文交接覆盖冲突/未实现Domain/物理Delta/源run SHA与末次真实CI证据/业务权限的未确定事项。交A独立复验`READY_FOR_A_REVIEW`后才可标准PR合并。

## 五、完成口径与禁恢复

本批在CI独立合成PG16内仅建立**Demand当前负责人单域的受控提交及可验证不可变历史收据**，同时保证Priority current responsible不被错误缓存或固定给Customer owner，但**不实现Priority状态变更/仲裁/续租、Recommendation改派、任何其它Domain正式迁移或整个SG06完成**。不能新增生产seed或HTTP接口，不改PDM Final、F02业务定义、原000001～000008、旧Guard、H01视觉。若一表收据无法保证形式化原子与幂等，必须停在fail closed并交A裁决，不要创造简化成功。

**NEXT_OWNER=B；NEXT_TASK=F03_2_2I_DEMAND_SINGLE_DOMAIN_TRANSFER_PRIORITY_DERIVED_RESPOSE_PG16_READY_FOR_A**。C/H01与F03-2整体产品基线`NOT_READY`。
