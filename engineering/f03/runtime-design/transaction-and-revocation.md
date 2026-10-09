# F03-2-G0｜可信当前事实、事务与撤权方案（未执行数据库）

## 1. 一次请求：只读当前事实与对象

1. 在入口由**已验收F03-1的正常、未受限、未撤销的PC会话**得到服务端`principal_kind + employee_id/system_admin_id`；身份键用PG BIGINT无损字符串，拒绝JS不安全数字、用户传入actor、role、capabilities、scope、team/owner和global授权。
2. 读取当前`pc_login_accounts`凭证epoch和状态、`employees.employment_status/store_id/main_role_id`及`roles.role_code`或独立`system_admins.account_status`。强制改密会话只可改密；禁止以登录成功解释为业务通权。
3. 对**每项capability分别**读取`permissions.permission_code → role_permission_defaults.enabled`、当前`employee_permission_overrides.decision`。优先序：产品`HARD_DENY`及身份/对象禁令 ＞ explicit个人deny ＞ explicit个人allow ＞ enabled=true模板 ＞ 拒绝；不存在的模板为false，撤销个人覆盖意味着删除当前行、在独立`employee_permission_override_history`追加revoked。
4. 按capability再验证`employee_data_scopes.ended_at`（NULL当前有效，未来时刻到达前仍有效，当前/过去时刻截止即失效，坏时间拒绝）、scope_kind/reference_id、当前owner/responsible/assignee/4S上传人/主门店及对象状态。**该表无permission_id**，且团队关系不完整，因此真正逐能力scope关系尚不能从冻结schema推出，缺证据即DEFER_DENY。不得将同门店等同团队或将`created_by_employee_id`等同任何业务owner。global需持久授权与真实目标绑定，不能从登录推断。
5. 若控制平面为System Admin，需从独立subject判定该动作由Authority授权及目标范围；不得装成Employee得到CRM/Lock/Transaction。客户停用/恢复与车型治理合法控制面需独立例外，不一概抹掉。
6. 读取目标对象**实际当前状态字段**，例如`customers.account_status`、`vehicles.source_sale_status/platform_visibility`、`demands.demand_state`、`consultations.status`、`locks.lock_status`、`transactions.status`。静态G0对象状态枚举仅用于模型；不按演示`resource.state`替代真实持久字段。未获批mutation一律DEFER_DENY。
7. 敏感读仅允许按真实scope字段投影；F03-3再负责查询、导出、分享、旧缓存/历史投影清理。**已经返回终端的数据不可宣称服务端可远程擦除**。

## 2. 撤权与提交边界

- 只读请求在其可信一致性快照内检查当前事实；后续独立请求不得使用会话内缓存的role、template、scope、object grants。F03-1仍负责身份凭证撤销；F03-2-1需先由A另行批准独立真实PG16 Guard测试。
- 业务写事务必须在同一数据库事务内完成授权相关状态锁定、最新事实/对象重验、业务变更和审计；先HTTP授权再在另一个无关联事务写入是不合格的TOCTOU。提交前发生撤权时，**拒绝提交或在串行冲突后重试整个资格判定**。
- 仅假模型使用`versions.policy/admin/receiving`与`observedVersion`模拟串行点。真实实现不得把前端传入`observedVersion`当成可信凭证；必须后端事务读取当前版本/锁。
- 普通权限变更：当前状态→不可变对应history（模板复用现有`role_default_permission_history`）→`audit_events`真实最小脱敏before/after及当时role/store→版本变化，在**同一个事务**内完成。失败回滚权限与history/audit；重试幂等须按actor、target、动作、请求去重键验证身份范围，不能只看布尔成功。
- planned角色/主店/权限减少：先扫描当前Customer owner、Demand/Priority、Consultation assignee、Waitlist/Lock/Transaction responsible及每域依赖；若受影响则要求每项可信已提交的handover证明，未完成拒绝计划变更。User`handoverComplete=true`无效。
- sudden inactive：先原子更新无资格身份、撤当前敏感能力/旧PC会话，随后由当前合法接手者分域交接。异常接客池空进入`customers.owner_assignment_state=owner_assignment_pending`并告警，不为了凑人数复活失效者，不生成无负责人正式业务。复职保留`employee_id`，不复活旧会话、个人覆盖、已交责任，接客默认OFF；当前新role模板只有获批有效事实可重新适用。

## 3. 建议锁与版本协议（提交待批准，绝不替代真实PG16并发验证）

**原则：固定全路径顺序、人口类共享锁、行级顺序与冲突重试，不只分别锁被停用者。**

1. 单例bootstrap/管理员数量互斥：先采用事务级全局`admin_population`锁或持久单例版本行（**拟议结构，未建表**），然后校验bootstrap-ever不可恢复标记、所有active System Admin、可实际登录的enabled PC账号及角色凭证，随后按`(principal_kind,account_id)`递增顺序锁目标账号，先账号再会话（兼容F03-1）；变更与审计同事务。需要同时保护*最后active身份*与*最后有效登录治理者*，请A裁定两条件具体产品优先级。
2. normal receiving池：先获取`receiving_pool`全局串行锁（拟议），再按employee_id递增锁受影响行，重验active+明确eligible+accepting人数及将离池者。任何正常关闭、停用、迁移导致零名合格接客者则拒绝；突然失效走异常事务并置待分配、告警，不能伪造接客资格。
3. 批量role/template/权限/scope调整：按模板/权限ID（升序）、涉及员工账号（升序）、scope ID、对象kind+ID（升序）、audit/history的稳定顺序，统一基准版本；锁前实际事务设计须与F03-1账号→会话顺序共同图论核验，尤其是管理员事务持全局锁后与密码重置事务会出现循环风险。发现冲突采用统一入口或检测序列化错误后**整个事务重新认证与重试**，不盲目局部重放。
4. Handover Batch只承担编排、明细状态和归档；每个对象使用独立合法业务域Guard+对象事务。成功项一经提交保留，失败项待处理，只重试失败项；不能跨Customer/Consultation/Lock/Transaction组成一个失败就整体回滚的长事务。

## 4. 可复现交错时序（均为模拟合同，非PG证明）

| 场景 | T1 | T2 | 串行化结果 |
|---|---|---|---|
| 两个Admin互停 | 读取epoch0；停用A并提交epoch1 | 携epoch0停用B，提交前重验失败 | 最后至少一个有效Admin；不能分别count后互相write skew |
| 禁用凭证与身份inactive | A将Admin主体inactive | B禁用其他Admin凭证 | 两者共享population锁；提交前查**有效登录者**，禁止归零 |
| bootstrap与新建Admin | T1申请初装并持单例锁 | T2申请另一个bootstrap或create | 历史claim只成功一次；曾存在管理员的库永不重开初装 |
| 最后接客者A、B同时OFF | A持receiving_pool锁关闭A | B持旧版本尝试关闭B | B须重验后拒绝；不可降至0 |
| 员工突发inactive导致零接客 | A突然inactive | B依旧缓存旧receiving状态发请求 | A先撤权并置pending，B重验拒绝；待恢复后重新合法分配 |
| 模板撤权与敏感业务提交 | A收到旧会话后读取旧模板 | B取消模板并提交 | A敏感事务提交前必须重新校验，拒绝或串行重试 |
| 计划调店与交接部分失败 | A先分域交Customer成功、Lock失败 | B试图提交调店 | Customer已成功保持、Lock待处理，B因handover缺项拒绝 |

## 5. 合成模型限制与未来门禁
`model.mjs`仅是不可接线业务的算法说明：`approvedOperationMappings`和`capabilityScopeProofs`均为**假设存在且由A审查后的受信事实**，不代表生产字段/预设权限。`F03-2-1/2/3`按各自独立施工单实测PG16跨事务交错、advisory锁/更新冲突、commit前重验、负例及审计回滚。当前G0任何静态PASS不能宣称已部署动态授权。

## A首轮复验 R1～R5 明确限制

- **R1**：模板历史表`public.role_default_permission_history(event_id,role_id,permission_id,enabled,actor_kind,actor_id,occurred_at)`已存在；不新增同义表，必须与当前enabled变更和`audit_events`同事务。历史不授当前权。
- **R2**：`template.set`只能由System Admin控制面执行，不能由经理/店长的员工授权替代；员工管理其他合法动作按Final保留。
- **R3**：`receiving.off`及`employee.planned_disable`正常操作共享变更后池检查：只能计算当前名邦Employee合法角色、active、可信eligible、accepting；排除4S和System Admin。操作不能使最后合格接客者归零；突发inactive应先撤权，异常池空进入待分配。
- **R4**：4S必须每次重验F03-1规定的`employee_permission_overrides.decision=allow`且`permissions.permission_code=pc.four_s.vehicle.manage`，模板默认值不替代PC入口个人允许，deny/revoke则旧会话所有PC业务拒绝。
- **R5**：只记录最小、真实、脱敏的模板enabled、个人decision、scope ended_at、员工角色/门店/接客、管理员凭证、handover状态等before/after和当时actor/role/store。新增before可为null，撤销after须为真实无覆盖状态；审计失败治理与历史一起回滚，禁止hash/token/密码/完整电话。
