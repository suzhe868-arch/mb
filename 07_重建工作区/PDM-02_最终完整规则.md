# PDM-02｜员工身份 / 组织 / 角色 / 权限 / 数据范围 / System Admin / 4S 身份｜最终完整规则

> 日期：2026-09-24  
> 状态：`COMPLETE / INTEGRITY_PASS`  
> 说明：本文件为 PDM-02 经 Batch 1～4 与最终总览用户批准后的**正式当前规则**；2026-10-04 已按新标准完成 Legacy Final Integrity Audit，并同步 PDM-01 / PDM-03 / PDM-04 / PDM-09 / PDM-10 已完成跨域规则。后续 PDM 不得静默改写；若发现真实跨域冲突，必须重新提交用户显式裁决。2026-10-22 用户已明确批准批发车上游电话按员工单独授权，并在“仅当前有效锁定车辆”与“全部当前在售 JYT 批发车”两种专项范围中择一，详见 PDM-09 第 2 节。  
> IA / Low-Fi 仅登记 stale carrier，按全局方法统一延后到 PDM-25 完成并通过全局总复核后集中对齐。

---

## 1. 员工身份与主角色

1. 员工主角色固定为：普通销售、经理、店长、4S 成员。
2. 同一员工同一时刻只有一个主角色。
3. 同一员工不能同时兼任名邦员工主角色与 4S 成员主角色。
4. 同一现实员工使用稳定 `employee_id`。
5. 调店、升职、降职、普通销售 / 经理 / 店长 / 4S 角色变化、离职后重新入职，均继续复用原 `employee_id`。
6. 历史操作、历史角色、历史门店和历史责任事实不因当前角色变化而回写。

## 2. 名邦门店归属

1. 名邦员工同一时刻只有一个主归属门店。
2. 不通过“同时挂多个正式主门店”表达跨店管理。
3. 跨门店 / 跨团队能力通过 permission + data scope 表达。
4. 调店继续复用原 `employee_id`，历史门店事实不改写。
5. 同一门店可以存在多个店长。
6. 不新增区域经理、总经理等额外固定角色层级；需要的跨店治理继续通过权限与数据范围表达。

## 3. 4S 身份模型

1. 不建设“4S 店组织”层级。
2. 不建设独立 4S App / 独立 4S IA。
3. 一个 4S 成员账号直接代表一家合作 4S 店 / 合作主体。
4. 不使用 `cooperation scope` 作为额外组织层级。
5. 4S 成员继续共用员工端，但使用权限裁剪视图。
6. 4S 成员本人不得管理其他 4S 账号。
7. 4S 账号的新增、启用、停用、基础资料、允许范围内的业务 permission，由 System Admin 控制平面治理。
8. 4S hard DENY 不得被任何后台配置绕过。

## 4. 统一权限模型

统一采用：

> **角色默认权限 + 员工个人明确授权 / 禁用 + data scope + object state**

具体规则：

1. 角色模板提供默认 permission。
2. 员工个人明确授权 / 禁用可以覆盖角色模板。
3. hard DENY / 明确禁止优先于默认允许和个人授权。
4. data scope 决定“能操作哪些对象”。
5. permission 决定“能执行哪些敏感动作”。
6. object state 参与最终动作校验。
7. 页面可见、字段返回、按钮显示不等于最终授权。
8. 敏感动作提交时必须重新校验当前 identity + permission + data scope + object state。
9. 员工不得自行给自己提升角色、增加敏感 permission 或扩大 data scope，也不得通过中间人绕过既定权限边界。
10. System Admin 作为控制平面治理者受产品级 hard DENY 约束，不能通过配置把系统明确禁止的能力开放出来。
11. role / permission / data scope / account status 等权限事实发生变更后原则上立即生效；旧登录态、旧页面、旧缓存不得继续保留已经撤销的能力，敏感提交仍须按当前事实重新校验。
12. 角色、permission、data scope、账号状态及其他关键治理变更必须留审计；至少记录操作人、操作时间、修改前、修改后。默认不要求每次填写修改原因，除非具体业务规则另有要求。

## 5. 角色模板

1. 角色模板是实时默认权限，不是员工入职时复制一次的永久快照。
2. System Admin 在 P04 后台配置角色模板。
3. 模板新增默认 permission 后，现有同角色员工实时获得该默认能力，但仍受个人 deny、hard DENY、data scope、object state 约束。
4. 模板取消默认 permission 后，现有同角色员工实时失去该默认能力，除非存在仍有效的个人明确授权且未被 hard DENY。
5. 员工个人明确授权 / 禁用继续保留并参与最终计算。
6. 若模板降权会使员工失去正在负责业务所必需的资格，应先完成相应业务交接，再让降权正式生效。
7. 产品基线不硬编码完整默认 permission 种子清单。
8. 产品基线只冻结最小角色边界、hard DENY、权限计算原则、角色模板实时生效机制。
9. 实际角色默认 permission 由 P04 后台角色模板配置承载。

## 6. System Admin｜当前最终模型

System Admin 是：

> **系统治理 / 控制平面账号。**

### 6.1 身份隔离

1. System Admin 不属于普通销售 / 经理 / 店长 / 4S 成员角色树。
2. System Admin 与员工业务账号完全分离。
3. 同一真人若既是 System Admin 又需要亲自执行业务，应使用两个独立身份。
4. System Admin 不进入接客池。
5. System Admin 不自动成为 Customer owner。
6. System Admin 不自动承担 CRM、车辆、Consultation、Lock、Transaction 等业务执行责任。

### 6.2 控制平面治理能力

System Admin 可以在后台治理：

- 新增 / 启用 / 停用员工账号；
- 新增 / 启用 / 停用 4S 账号；
- 设置普通销售 / 经理 / 店长 / 4S 主角色；
- 任命 / 取消店长；
- 配置角色模板；
- 授予 / 撤销系统允许的业务 permission；
- 设置 / 调整 data scope；
- 按 PDM-09 在 PC 后台「员工管理 → 员工详情 → 权限设置」中，为单个员工配置既有 `publisher.phone.sensitive` 能力及其专项访问范围（仅当前有效锁定车辆 / 全部当前在售 JYT 批发车二选一）；此项遵守现有员工权限治理授权和审计规则，不因员工职位自动授予，也不扩大通用车辆经营权限；
- 配置接客资格、接客状态；
- 直接执行 Customer 账号停用 / 恢复这一控制平面治理动作；
- 按 PDM-05 当前规则执行车型主数据 / JYT source mapping / MODEL_MISSING / 映射冲突 / 重复车型等控制平面治理；该域以 `vehicle.model.manage` 作为治理能力 Guard；
- 其他员工与权限治理项。

### 6.3 配置权 ≠ 业务执行权

1. System Admin 能给员工配置某项业务 permission，不等于 System Admin 自己拥有该业务执行能力。
2. 同一真人需要亲自做销售、CRM、车辆经营、Lock、Transaction 等业务时，仍必须切换到独立员工身份。
3. Customer 账号停用 / 恢复属于控制平面治理动作，不视为销售 / CRM / owner / Lock / Transaction 业务执行；System Admin 可以直接执行，但不会因此取得这些业务能力或 Customer owner 身份。
4. 车型主数据 / JYT mapping 治理同样属于 PDM-05 明确的控制平面治理动作，不视为普通 Vehicle 销售经营或车辆编辑能力；System Admin 执行该治理不会因此获得销售 / CRM / owner / Lock / Transaction 等员工业务执行权。
5. System Admin 不能通过配置或治理动作绕过产品级 hard DENY。
6. 所有账号、角色、permission、data scope、接客配置、Customer 账号停用 / 恢复、车型主数据 / mapping 等治理变更必须保留审计。

### 6.4 System Admin 自身治理

1. 首个 System Admin 由系统初始化 / bootstrap 建立，不从员工业务角色产生。
2. 首个 bootstrap 完成后，后续 System Admin 的新增、启用、停用与基础治理只能由 active System Admin 执行。
3. 系统必须始终至少保留 1 个 active System Admin。
4. 不允许停用最后一个 active System Admin。
5. System Admin 自身治理变更必须审计，并继续服从“不可自我绕过 hard DENY / 不获得员工业务执行权”的边界。
6. V1 不再增加一层“超级管理员 / Owner”。

## 7. 普通销售 / 经理 / 店长员工管理边界

### 7.1 普通销售

普通销售不能管理员工或权限。

### 7.2 经理

1. 经理默认不拥有完整员工账号生命周期管理权。
2. 经理只有同时具备对应员工管理 permission，且团队 data scope 覆盖目标员工时，才能执行被授权的管理动作。
3. 经理可被授权处理下属接客状态、业务交接、日常人员状态类管理。
4. 经理不能仅凭“经理”职位自动获得全部敏感员工管理能力。
5. 经理不能自行提升自己的角色、permission 或 data scope。
6. 店长角色的任命 / 取消由 System Admin 控制平面处理。

### 7.3 店长

店长拥有本店 P04 员工管理入口，可在本店范围处理：

- 新增员工；
- 在职 / 离职；
- 普通销售 ↔ 经理角色调整；
- 接客状态；
- data scope。

同时：

1. 店长职位不自动等于全部敏感业务 permission。
2. 车辆、价格、资金、交易等敏感业务能力继续独立授权。
3. 店长角色本身的任命 / 取消由 System Admin 治理。

## 8. 内部模式与内部价 / 批发价

1. 内部模式只是内部工具投影，不是万能权限入口。
2. 进入内部模式本身不授予任何业务权限。
3. 编辑、电话、客户展示价覆盖等能力继续按各自当前规则服从 identity + permission + data scope + object state。2026-10-04 PDM-10 已明确取消独立“调价 permission / 调价动作”：名邦 / 4S 正常 customer_list_price、internal_wholesale_price 属于车辆正常编辑字段；其中修改 internal_wholesale_price 仍必须具备本节独立内部价查看 permission。
4. “查看名邦内部价 / 批发价”恢复为独立 permission。
5. 名邦员工只有在具备该 permission、车辆位于其 data scope 且对象状态允许时，才能查看内部价 / 批发价。
6. 经理 / 店长不会仅因职位自动获得内部价查看能力。
7. 4S 成员查看名邦内部价 / 批发价为 hard DENY。

## 9. 员工离职 / inactive / 复职 / 调店 / 降权

### 9.1 inactive / 离职

员工进入 `inactive` / 离职后：

- 立即失去员工端访问；
- 当前业务权限立即失效；
- 旧登录态不得继续操作；
- 不得继续新增承责；
- `employee_id` 保留；
- 历史操作、客户关系、角色、门店、审计保留。

### 9.2 计划性变化

计划中的调店、角色切换、降权，如果会使员工失去当前业务承责资格、原门店 / 原团队 data scope 或现有责任范围，应先完成相应客户与活跃业务交接，再使变化正式生效。

尤其员工从 A 店调到 B 店时，A 店范围内仍由其承责且调店后不再合法覆盖的 Customer / 活跃业务必须先完成正式交接；调店后按 B 店当前角色、permission、data scope 生效，历史门店 / 角色 / 责任事实不回写。

### 9.3 突发失效

突发 inactive / 资格失效：

1. 先立即撤权；
2. 再由 active 管理人员补完业务交接；
3. 不允许为了完成交接而继续保留离职员工权限。

### 9.4 重新入职 / 从 inactive 恢复 active

重新入职或从 inactive 恢复 active：

- 复用原 `employee_id`；
- 按当前角色、permission、data scope 重新授权；
- 不自动恢复离职 / inactive 前 permission；
- 不自动拿回已经交出的旧客户；
- 不自动恢复旧业务责任；
- `accepting` / 接客状态默认关闭，必须由本人或具备管理权限且范围覆盖的人员重新开启；
- 旧登录态不得复活。

### 9.5 离职 / inactive 交接范围与 Handover Batch

员工离职、inactive 或失去承责资格时，不能只处理 Customer owner，还必须同步检查其当前负责的活跃业务，包括 Demand、Priority、Consultation、Waitlist、Lock、Transaction 等适用对象。

交接必须形成可追溯 handover batch，至少能够追溯：离开 / 失效员工、失效时间、受影响 Customer / 活跃业务、原 owner / 原负责人、新 owner / 新负责人、操作人、操作时间、交接原因及后续再次分配历史。部分失败时不得抹掉已成功交接项，未完成项继续保持待处理状态。

## 10. 接客状态与接客池保护

1. 普通销售、经理、店长可以按规则参与接客。
2. 员工可自行开 / 关自己的接客状态。
3. 经理 / 店长可在具备相应管理 permission 与范围时调整下属接客状态。
4. System Admin 可从控制平面治理接客资格 / 接客状态，但不会因此进入接客池。
5. 正常操作必须保证至少存在 1 名 active + eligible + accepting 的合格接客员工。
6. 正常情况下禁止关闭 / 停用最后一名合格接客员工。
7. 员工仅关闭 `accepting` 时，只退出未来自然注册 / 自动轮询：
   - 不自动转走已有 Customer；
   - 不自动改变其既有业务责任；
   - 员工仍为 active + eligible 时，本人的有效分享获客能力继续按 PDM-03 规则生效。

### 10.1 异常池空

若因突发 inactive、资格失效等异常导致接客池被动变成 0 人：

1. Customer 身份仍可以建立；
2. 在没有其他优先归属来源可用时，进入 `owner_assignment_pending` / 异常待分配；
3. 不创建 `responsible = null` 的正式人工业务对象；
4. 不使用 System Admin 临时兜底成为销售 / owner；
5. 恢复可用接客池后，自动重新尝试分配 owner；
6. 池空、待分配、恢复与补分必须记录告警 / 审计。

该异常分支不改变 PDM-01 A04 的正常规则：

> 正常接客池可用时，新客户自然注册立即轮询形成唯一 current owner。

## 11. 客户其他联系电话维护权限

新增独立 capability：

> `customer.phone.manage`

规则：

1. active 名邦员工只有同时具备 `customer.phone.manage` 且 Customer 位于其 data scope，才能维护客户“其他联系电话”。
2. 可执行：新增、修改、失效其他联系电话。
3. 4S 成员对此能力 hard DENY。
4. 全部变更必须审计。
5. `customer.phone.manage` 不默认允许直接修改客户主要手机号。
6. 主要手机号更换继续遵守 PDM-01 已冻结的客户正式授权 / 绑定、手机号身份连续性规则。
7. 电话维护不得改变 `customer_id`、owner、来源及既有业务关系。

## 12. 4S PC 后台边界

1. 4S 默认不进入名邦 PC 业务后台。
2. System Admin 可以明确授予某个 4S 账号“PC 车辆管理能力”。
3. 获得该能力后，只开放该 4S 账号有权 4S 车辆的 P02 裁剪投影。
4. 4S 以下能力继续 hard DENY：
   - P04 员工 / 权限管理；
   - P05 System Admin；
   - 名邦 CRM；
   - Lock；
   - Transaction；
   - 名邦内部价 / 批发价；
   - 一键转名邦。
5. 4S hard DENY 不得被角色模板、个人授权或 System Admin 配置绕过。

## 13. 明确不得恢复的旧方向

以下旧方向不得重新进入当前基线：

1. 把“编辑非本人上传车辆”本身做成独立敏感 permission；
2. 进入内部模式后自动获得全部敏感操作；
3. System Admin 自动获得员工业务执行权；
4. 建立“4S 店组织”层级；
5. 同一员工同时挂多个正式主归属门店；
6. 员工自我提权、自行扩大 data scope 或通过中间人越级授权；
7. 重新入职新建第二个 `employee_id`；
8. 角色变化时新建新的员工账号；
9. 当前角色变化后回写历史角色 / 历史责任；
10. 独立 4S App / 独立 4S IA；
11. 普通销售 / 经理 / 店长管理 System Admin 账号；
12. 在 System Admin 之上再增加第二层“超级管理员 / Owner”；
13. 接客池无人时让 System Admin 兜底成为销售 / owner；
14. 使用 `responsible = null` 作为无人接客时的正式业务负责人。

特别说明：

> 旧“名邦员工查看内部价 / 批发价不需要独立 permission”的 9/19 规则已被用户主动反转，不再是当前规则。当前以“独立内部价 permission + 4S hard DENY”为准。

## 14. 历史规则修正关系

### A17

A17 中继续有效：

- System Admin P05 身份由其他 active System Admin 管理；
- 至少保留 1 个 active System Admin；
- 首个 System Admin bootstrap 初始化；
- System Admin 与员工业务身份分离。

A17 中“System Admin 不能配置员工业务 permission”的过度解释已被 **P02-A19** 覆盖。

### A18

A18 中继续有效：

- 一个 4S 账号直接代表一个合作主体；
- 不建设 4S 组织层级；
- 不使用 cooperation scope；
- 4S 不得管理其他 4S 账号；
- 4S hard DENY 不可绕过。

A18 原“System Admin 不自动获得 4S 账号管理能力”的表述已被 **P02-A19** 修正：

> System Admin 可以从控制平面治理 4S 账号和允许的 permission，但不会因此成为 4S / 销售业务执行者。

### A19

P02-A19 为当前 System Admin 权限模型的最终解释优先级。

### 14.1 PDM-10 后续跨域修正｜2026-10-04

PDM-10 经用户最终批准后，对本 PDM 的价格动作语义形成以下显式 supersession：

- 不再存在独立“调价 permission / 调价动作”；
- 名邦 / 4S customer_list_price、internal_wholesale_price 作为正常车辆编辑字段提交；
- customer_list_price 服从正常车辆编辑 / 管理能力 + data scope + object state；
- internal_wholesale_price 除正常编辑条件外，还必须具备“查看名邦内部价 / 批发价”独立 permission；
- 客户展示价覆盖继续保留独立 permission；
- 4S 成员查看名邦内部价 / 批发价仍为 HARD DENY。

本修正只覆盖“调价是否为独立 permission / action”的旧表述，不改变 PDM-02 其他统一权限模型。

## 15. 跨域承接状态

### 15.1 已完成承接

1. Owner / 接客 / 离职交接已由 PDM-03 完成：
   - 关闭 accepting 只影响未来自然轮询；
   - active + eligible 员工本人有效分享仍可获客；
   - inactive / 离职需要同时处理 Customer owner 与活跃业务责任；
   - handover batch 与历史保留规则已同步回本 Final。
2. 一键转名邦与 4S 车辆责任已由 PDM-04 / PDM-06 完成：
   - 一键转名邦不设置额外独立 permission；
   - active 名邦员工满足正常车辆管理 / 查看范围及 object state 即可执行；
   - 4S 成员不能一键转名邦；
   - 4S 成员失效后的车辆暂停展示 / 匹配与名邦接管按 PDM-04 当前规则执行。
3. 上游发布人电话已由 PDM-09 完成：Internal Mode 本身不授电话权限；电话能力继续服从当前身份、独立敏感能力、data scope、object state；4S 身份本身不自动获得电话能力。
4. 展示价 / 内部价 / 正常价格编辑已由 PDM-10 完成：
   - 不再存在独立“调价 permission / 调价动作”；
   - customer_list_price / internal_wholesale_price 按正常车辆编辑规则提交；
   - internal_wholesale_price 仍受独立内部价查看 permission 的字段级保护；
   - 客户展示价覆盖继续是独立 permission；
   - 4S 查看名邦内部价及设置客户展示覆盖价均 hard DENY。
5. Customer 账号停用 / 恢复已由 PDM-01 后续裁决同步：System Admin 可直接作为控制平面治理动作执行；经理 / 店长等 active 名邦员工需满足 `customer.account.disable + Customer data scope`；普通销售默认不开但可明确授权；4S hard DENY。

### 15.2 仍待后续 PDM 承接

- Consultation 负责人 / 转派 → PDM-15｜`HANDOFF_CLOSED`：PDM-15 Final 已正式承接 identity + permission/capability + data scope + object state Guard、mutation actor 矩阵、assignee 失效 handover、正式转派与 System Admin/4S 边界；`HO-P02-P15-001 = HANDOFF_CLOSED / source_backwrite=YES`；
- CRM 业务细节 → PDM-16｜`HANDOFF_CLOSED`：PDM-16 Final 已正式承接 CRM 当前访问继续服从统一 identity + permission/capability + data scope + object/account state，并冻结 4S/System Admin 边界；`HO-P02-P16-001 = HANDOFF_CLOSED / source_backwrite=YES`；
- 公海 / Collaboration → PDM-17｜`HANDOFF_CLOSED`：PDM-17 Final 已正式承接公海/待公海治理、主动领取、后台指定分配、Collaboration，并继续服从统一 identity + permission/capability + data scope + object/account state Guard；`HO-P02-P17-001 = HANDOFF_CLOSED / source_backwrite=YES`；
- Lock / Waitlist → PDM-18｜`HANDOFF_CLOSED`：PDM-18 Final 已正式承接 LockRequest / Lock / Waitlist mutation，并继续服从统一 identity + permission/capability + data scope + object/account state Guard；4S hard DENY、System Admin 控制平面身份本身不自动获得业务执行权；`HO-P02-P18-001 = HANDOFF_CLOSED / source_backwrite=YES`；
- Transaction / Refund / 成交纠错 → PDM-19｜`HANDOFF_CLOSED`：PDM-19 Final 已正式承接 Transaction / Refund / correction，并继续服从统一 identity + permission/capability + data scope + object/account state；4S hard DENY 与 System Admin 控制平面边界继续有效；`HO-P02-P19-001 = HANDOFF_CLOSED / source_backwrite=YES`；
- 员工端具体页面与内部模式视觉投影 → PDM-21｜`HANDOFF_CLOSED`：PDM-21 Final 已正式承接 Employee Action Projection、Internal Mode、4S 裁剪与敏感动作页面边界；`HO-P02-P21-001 = HANDOFF_CLOSED / source_backwrite=YES`；
- PC 后台具体 IA → PDM-22｜`HANDOFF_CLOSED / source_backwrite=YES`：已由 PDM-22 Final 承接员工、权限、System Admin、角色模板、data scope 与 PC credential carrier；
- 横切审计字段 / 审计留存规范 → PDM-25。

上述后续 PDM 不得静默推翻本 PDM 已确认的 identity / role / permission / data scope / hard DENY 边界；若发现真实产品冲突，必须重新提交用户显式裁决。

IA / Low-Fi 当前只作为 carrier 检查与 stale ledger 来源，不在 PDM-01～25 产品规则重建过程中随手整改；统一在 PDM-25 完成并通过 PDM-01～25 全局总复核后集中对齐。

## 16. 四批门禁与最终批准状态

- Batch 1｜稳定一致项：`COMPLETE_USER_CONFIRMED`
- Batch 2｜明确废弃 / 替代：`COMPLETE_USER_CONFIRMED`
- Batch 3｜明确知情修改 / 新增：`COMPLETE_USER_CONFIRMED`
- Batch 4｜冲突 / 遗漏 / 缺口 / 新选择：`COMPLETE_USER_CONFIRMED`
- Final Domain Overview：`USER_APPROVED`
- PDM-02：`COMPLETE`
- 2026-10-04 Legacy Final Integrity Audit：`INTEGRITY_PASS`
- Missing Rule unresolved：`0`
- Semantic Detail Gap unresolved：`0`
- Cross-PDM Conflict：`0`
- Handoff Gap unresolved：`0`
- Implementation Ready：`PASS`

2026-09-24 用户最终确认本总览无其他问题，并特别确认：

> **普通销售、经理、店长均可参与接客；经理和店长在满足 active + eligible + accepting 时可进入接客池并成为 Customer owner。4S 成员与 System Admin 不进入接客池。**

PDM-02 历史 COMPLETE 保留；2026-10-04 已通过当前 Legacy Final Integrity Audit。PDM-01～10 本轮复核的下一域为 PDM-03。

> 2026-10-07 Source Backwrite：对应 PDM-22 handoff 已由 `07_重建工作区/PDM-22_最终完整规则.md` 正式承接；以 CROSS_PDM_HANDOFF_REGISTER 的 `HANDOFF_CLOSED / source_backwrite=YES` 为准。


> 2026-10-07 Source Backwrite｜HO-P02-P25-001：`HANDOFF_CLOSED / source_backwrite=YES`。PDM-25 已由 `07_重建工作区/PDM-25_最终完整规则.md` 正式承接本域移交的审计 / 历史 / 时区 / 配置版本 / 横切完整性语义；PDM-25 不反向改写本 PDM 已冻结的业务状态机与产品规则。
