# PDM-11｜找车申请 / Demand 生命周期｜规则原子重建工作版

> 日期：2026-10-05  
> 当前状态：`HISTORICAL_WORKFILE / PDM-11 COMPLETE / INTEGRITY_PASS`  
> 业务权威语言：中文（zh-CN）  
> 当前域：PDM-11｜Find-car Application / Demand / 生命周期 / 负责人 / 匹配准备度边界  
> 执行边界：本文件保留为 PDM-11 历史工作底稿。当前正式 Authority 为 `07_重建工作区/PDM-11_最终完整规则.md`；不得再把本工作版中的阶段性描述反向覆盖 Final。

---

## 1. 启动门禁与 incoming handoff

PDM-01～PDM-10 单域 Integrity Audit 与 01～10 全局 Cross-PDM / Handoff / Global Invariant 总复核均已 PASS，PDM-11 启动门禁已解除。

本域启动前已读取 `CROSS_PDM_HANDOFF_REGISTER.md`，当前唯一 incoming handoff：

| handoff_id | 来源 | 完整语义 | 本域状态 |
|---|---|---|---|
| `HO-P01-P11-001` | PDM-01 | 旧口径：Customer 停用不得自动终止既有 Demand | `HANDOFF_SUPERSEDED` |
| `HO-P01-P11-002` | PDM-01 | Customer 停用后 active Demand 必须转 paused；历史保留；账号恢复不自动恢复 Demand | `HANDOFF_ACCEPTED` |

承接 Guard：

- Customer 停用后，正在运行的 Demand 不得继续保持 active 运行；
- `active → paused`；原本 `paused` 保持 paused；`completed / cancelled` 不改写；
- 停用不得删除 Demand，也不得把它伪造成 completed / cancelled；
- Demand 的客户原始要求、销售匹配描述、标准条件、历史匹配、Recommendation、CRM 跟进、负责人 / 状态历史全部保留；
- Customer 账号恢复后不得自动把 paused Demand 恢复为 active，必须通过正式 resume 动作；
- `HO-P01-P11-001` 已被 2026-10-05 用户裁决 supersede；当前 Authority 为 `HO-P01-P11-002`；
- 当前 handoff 只有在 PDM-11 Final 真正落地且来源 PDM 完成反向回写后，才允许 `HANDOFF_CLOSED`。

---

## 2. 本轮实际证据范围

### 2.1 当前控制入口

- `README.md`
- `CURRENT_PROJECT_STATE.md`
- `NEXT_ACTION.md`
- `PROJECT_STATE.json`
- `00_先读/01_产品基线重建执行规范_冻结工作版.md`
- `00_先读/02_9月19日产品全域覆盖地图_未裁决版.md`
- `07_重建工作区/DECISION_REGISTER.md`
- `07_重建工作区/CROSS_PDM_HANDOFF_REGISTER.md`

### 2.2 9/19 主底盘与正式历史

- 9/19 `CURRENT/C1-C5_当前冻结业务摘要.md`：C2｜找车 Matching + Priority；
- 9/19 `CURRENT/Phase1_当前唯一业务合并基线.md`；
- 9/19 `CURRENT/MODULES/R10_客户端员工端核心体验IA_当前版.md`；
- 9/19 `CURRENT/MODULES/R12_PC后台配置通知审计_当前版.md`；
- 9/19 R10 原始最终总结：`HISTORY/RAW_AVAILABLE/r10tmp/名邦汽车_R10_业务重审最终总结_R10-01至R10-79_2026-09-19.md`；
- 2026-09-06 `名邦汽车_V1_SSOT_CHECKPOINT_2026-09-06.md`；
- 2026-09-06 `名邦汽车_V1_DECISION_REGISTER_2026-09-06.md`；
- 2026-09-06 `名邦汽车_V1_IA_CHECKPOINT_2026-09-06.md`。

### 2.3 后续 Current / Carrier / Radar

- 9/22 冻结视觉问题总台账：本轮按 Demand / 找车 / C02 / E05 / P06 关键词机械扫描，未检出可直接替代 PDM-11 产品 Authority 的新业务裁决；不以此反推“绝无其他间接影响”；
- IA V5：`IA_CURRENT.md`、Lifecycle / Action / State / Permission Contract、Navigation Register；
- 实际 Low-Fi：C02、C02-01、C02-02、E05-02、E05-04 相关当前 SVG 载体；
- 001～078：M03、M16、M17 相关归档单元；
- 工程 Delta：本轮对 `工程总闭环待执行Delta清单.md` 做 Demand / C02 / E05 / P06 直接项扫描，未发现可作为 PDM-11 已实现事实的条目。

001～078、IA、Low-Fi 只用于发现遗漏 / 冲突 / stale carrier，不自动成为产品最终 Authority。

---

## 3. CURRENT IMPLEMENTATION FACT｜当前实现事实卡

### 3.1 当前能证明的事实

当前仓库能直接证明的是：

- IA V5 已存在 Find-car Application / Demand 的状态、Action、Navigation 投影；
- Low-Fi 已存在 C02 / C02-01 / C02-02 / E05-02 / E05-04 等页面资产；
- 这些只能证明当前结构 carrier 已经形成，不能证明对应后端、数据库、API、任务队列已经真实施工并端到端验收。

### 3.2 当前不能冒充已实现的内容

本轮仓库证据不足以证明以下内容已经完成真实运行实现 / 验收：

- application → demand 的最终服务端幂等激活链；
- 多 Demand 并存的后端约束；
- `demand_responsible_sales_id` 的正式 reassignment；
- Customer 停用触发 active Demand → paused、历史保留、恢复账号不自动恢复 Demand 的服务端 Guard；
- Customer Level 找车 entitlement、等级调整与人工激活 Demand 的最终后端实现；
- E01 pending 找车申请待办的完整任务生成 / 更新 / 去重；
- 匹配准备度与 Demand 主状态的服务端分层。

因此：

> **当前 PDM-11 不能以 Low-Fi / IA 存在为理由声称工程已实现。**

---

## 4. Completed-PDM Dependency Card｜已完成 PDM 强制依赖卡

| 依赖 PDM | 约束对象 | 当前有效规则 | PDM-11 可补充 | PDM-11 不可静默改写 |
|---|---|---|---|---|
| PDM-01 | Customer / 手机号 / 停用 | 手机号不是身份；手机号变化不改变 Demand；手机号是人工服务门槛；Customer 停用后运行中的 Demand 必须停止运行，但历史不删 | 找车申请 / Demand 在这些 Guard 下的具体动作和状态 | customer_id 连续性、手机号身份边界、停用不删除历史；Demand 当前具体结果为 active→paused |
| PDM-02 | 员工身份 / permission / data scope / 4S | 业务动作服从 identity + permission + data scope + object state；inactive/离职必须处理 Demand 等活跃业务；不得制造 `responsible = null` 的正式人工业务 | Demand 具体 actor / reassignment /状态动作 | 统一权限模型、4S hard DENY、System Admin 不自动成为业务执行者 |
| PDM-03 | Customer owner / 业务负责人 | Customer owner 与 Demand 负责人分层；普通 owner change 不自动漂移 Demand 负责人；离职/失效需正式交接并留历史 | Demand 负责人创建、改派、历史字段 | owner 不变量、普通 owner change 不自动迁移业务负责人 |
| PDM-05 | 车型主数据 | 本地主数据为 品牌→车系→具体车型，年款是具体车型属性 / UI 分组；JYT 明确车型事实即使 mapping pending 仍可用于精确搜索/Matching | Demand 条件如何表达车型意图 | 不得把年款恢复为第四级主数据；不得仅因 mapping pending 将明确车型事实降为 unknown |
| PDM-07 | 车况 / provenance | JYT 原始车况描述/标签保留；只做 Matching 必需的确定性标准化；不确定保持 unknown，不得猜 | Demand 保存客户车况要求及标准条件接口边界 | 不得用猜测补齐车辆车况事实 |
| PDM-10 | 价格 / 查价 | 价格与权益的事实边界已冻结；Customer 停用只作为上层可用性 Guard，不改写底层既有业务事实 | Demand 可保存预算条件，具体价格匹配由 PDM-12 承接 | 不在 PDM-11 重写价格计算 / 查价权 |

跨域原则：PDM-11 冻结的是“申请与 Demand 业务容器及生命周期”，具体 Matching 判定归 PDM-12，Priority 归 PDM-13，Recommendation 归 PDM-14。

---

## 5. Terminology & Field Normalization｜术语 / 字段统一

| 中文业务概念 | 技术 / 历史称呼 | 本域定义 | 易混淆边界 |
|---|---|---|---|
| 找车申请 | Find-car Application / application | 客户原始找车诉求的申请对象 | 不是正式 Demand |
| 正式找车需求 | Demand | 持续找车服务的正式业务任务容器 | 不是一段文本，也不是 Recommendation / Matching Result |
| 客户原始找车要求 | raw request / application text | 保存客户原话与原始条件 | 不直接作为自动 Matching 主输入 |
| 销售匹配描述 | sales matching description | 销售与客户沟通后整理的“系统实际应该找什么车” | 与需求说明 / CRM 跟进分离 |
| 标准匹配条件 | standardized conditions | 确定性词典 / 规则解析后的结构化条件 | 具体解析与比较规则归 PDM-12 |
| 匹配准备度 | matching readiness | Demand active 后，规则输入是否 ready 的独立事实 | 不是 Demand 主状态 |
| Demand 负责人 | `demand_responsible_sales_id` | 当前负责该条 Demand 的业务负责人 | 不等于 Customer current owner |
| 需求说明 / 背景 | demand note / context | 本条需求的业务背景 | 不参与自动 Matching |

---

## 6. Source→Current 核心业务骨架

### 6.1 Application 与 Demand 两对象

正式历史持续一致地把客户“表达找车意图”和“进入持续找车服务”拆成两个对象：

- Application：客户提交的原始找车申请 / 意向；
- Demand：被正式开通后的持续找车服务任务。

禁止将 pending application 直接伪装成“正在持续匹配”。

### 6.2 Demand 主生命周期

历史主状态：

`active → paused / completed / cancelled`

- `paused` 可恢复；
- `completed / cancelled` 为终态；
- 终态不原地 reopen；未来再次找车创建新的 Demand；
- V1 不设置自动 `expired` 主状态；
- `paused` 不是“已结束历史”。

### 6.3 Application 轻量生命周期

历史可用模型：

`pending / activated / closed`

- pending 可编辑；
- pending 可由客户撤回；
- activated 必须关联真实 `demand_id`；
- 一个 Application 最多激活成一个 Demand；
- 重复激活必须幂等；
- 撤回 / closed 后不得再激活为 Demand；
- Find-car Application 属于正式高意向人工服务对象，创建时不得出现 `responsible = null`；
- Customer 当前无合法 owner 时，必须先按 PDM-03 的分享 / 转介绍优先归属与合格接客池规则完成 owner 分配，再创建正式 Application；
- 若合格接客池异常为空，只建立 / 保留 `owner_assignment_pending` 等分配事实，不创建无负责人的 Application；池恢复后再重试正式 owner 分配；
- pending Application 本身属于公海保护事实，不能把仍有 pending Application 的 Customer 按普通无业务客户直接送入公海；
- pending Application / 对应待处理任务必须有当前负责员工，正式 owner / 员工交接时要纳入责任处理，不能留下失效负责人。

### 6.4 多需求并存

一个 Customer 可以同时存在：

- 多条 active Demand；
- pending Application；
- paused Demand；
- completed / cancelled 历史 Demand；
- 与不同 Demand 关联的 Recommendation。

C02 因此是找车工作区，不是单一互斥状态页。

### 6.5 Demand 核心时间事实与负责人分层

Demand 至少冻结以下不可歧义时间事实：

- `created_at`：员工成功人工激活 Application 并创建正式 Demand 的时间；创建后不可重写；
- 如工程同时保留 `activated_at`，V1 当前“创建即激活”模型下应与本次首次正式激活事实一致，不得用后续 resume 时间覆盖；
- pause / resume / complete / cancel / reassignment 等后续动作通过状态 / 审计历史记录各自发生时间，不改写原 `created_at`；
- PDM-13 若以 Demand 创建先后作为 Priority 仲裁条件，必须读取本条不可变 `created_at`，不得读取最近更新时间或最近 resume 时间。

历史明确存在独立 `demand_responsible_sales_id`：

- Demand 创建 / 激活时默认承接当时合法 Customer owner；
- 后续可正式 reassignment；
- Demand 负责人变化不自动改变 Customer owner；
- Customer owner 普通变化也不自动改变 Demand 负责人；
- 员工 inactive / 离职 / 失去承责资格时，Demand 必须进入正式交接范围。

### 6.6 匹配准备度与主状态分开

历史曾给出 `pending_definition / ready / ready_with_confirmation_needed` 等技术表达，用来描述规则输入是否可执行。

这些：

> **不是 Demand 主状态。**

Demand 可以已经 active，但仍处于“顾问整理条件”；只有销售匹配描述形成并完成确定性解析后，才开始正式持续 Matching。

---

## 7. Batch 1｜稳定一致项｜用户已全部确认

> 只有前史、9/19、后续 Current 与已完成 PDM 没有发现真实产品反转的条款进入本批。存在版本冲突、后续知情修改或需要恢复历史模型的内容全部排除，不在 Batch 1 偷渡。
>
> **2026-10-05 用户确认：P11-A01～P11-A13 全部同意；Batch 1 正式关闭。**

### P11-A01｜Application 与正式 Demand 必须分离

客户提交“帮我找车”首先形成 Find-car Application；正式 Demand 是持续服务业务对象。Application 与 Demand 不得合并成同一个状态对象。

**稳定证据：** 9/06 DEC-003、SSOT、9/19 R10-16 / R10-53、IA V5 Current 同向。

**状态：** `STABLE_CONSISTENT / USER_APPROVED`

### P11-A02｜一个 Customer 可以同时存在多条独立 Demand 与 pending Application

客户不限制为“只能一条当前 Demand”。C02 是聚合工作区，应允许同时展示 active、pending、paused、completed/cancelled 以及关联 Recommendation。

`paused` 仍属于当前正式 Demand，不得归入已结束。

**状态：** `STABLE_CONSISTENT / USER_APPROVED`

### P11-A03｜手机号是提交找车申请的人工服务门槛

客户提交帮我找车前必须存在可用手机号；无手机号时触发正式手机号授权。

授权拒绝 / 取消：

- 不创建正式 Find-car Application；
- 不通知员工；
- 不建立人工服务业务对象；
- 当前页面已填写内容可临时保留用于再次修改 / 重试；
- 临时保留不是服务端持久化草稿，不新增“未授权找车草稿”状态机。

**依赖：** PDM-01 当前 Final。

**状态：** `STABLE_CONSISTENT / USER_APPROVED`

### P11-A04｜Application pending 的编辑 / 撤回 / 幂等边界

pending Application：

- 客户可以编辑同一申请；
- 客户可以主动撤回；
- 撤回后关闭，不创建 Demand；
- 员工关闭后同样不得再激活；
- 客户修改 pending 申请只更新同一 Application 与同一待处理任务，不重复制造 Application / Task。

**状态：** `STABLE_CONSISTENT / USER_APPROVED`

### P11-A05｜Demand 主状态固定为 active / paused / completed / cancelled

V1 Demand 主生命周期只使用：

- `active`；
- `paused`；
- `completed`；
- `cancelled`。

不增加自动 `expired` 主状态。`completed / cancelled` 终态只读；未来再次找车创建新 Demand，不恢复旧 Demand。

**状态：** `STABLE_CONSISTENT / USER_APPROVED`

### P11-A06｜active / paused 的正式状态动作与双向结束

当前负责人 / 有权员工：

- active：暂停 / 完成 / 取消；
- paused：恢复 / 完成 / 取消；
- completed / cancelled：只读。

“完成”和“取消”是不同业务结果，不得合并成一个模糊“结束”。

客户侧：

- 客户可以对自己的 active Demand 执行“暂停”；
- 客户可以对自己的 paused Demand 执行“恢复”；
- 客户可以对自己的 active / paused Demand 发起“结束找车”；
- 客户“结束找车”**不直接写入 completed / cancelled**，而是生成该 Demand 的待员工确认结束请求；
- 同一 Demand 同一时刻最多存在一个未处理的客户结束请求；重复提交必须幂等；
- 待员工确认期间 Demand 主状态保持原 active / paused，不新增第五个 Demand 主状态；客户端可显示“结束处理中”这一派生处理状态；
- 当前负责人 / 有权员工处理客户结束请求时，根据真实业务结果落最终主状态：
  - 服务目标已经完成 → `completed`；
  - 客户不再继续找车 / 放弃该需求 → `cancelled`；
- 员工也可以在没有客户结束请求时，基于真实业务结果直接对 active / paused Demand 执行 `completed` 或 `cancelled`；
- 客户未来再次找车时创建新的 Application / Demand，不原地复活 completed / cancelled。

客户结束请求只是待处理业务事实，不改变 `active / paused / completed / cancelled` 四状态模型，也不得被实现成第五个主状态。

**状态：** `STABLE_BASE + USER_REFINED_END_FLOW / USER_APPROVED_2026-10-05`

### P11-A07｜Demand 负责人独立于 Customer owner

每条正式 Demand 保存独立负责人。普通 Customer owner 变化不得自动漂移 Demand 负责人；确需转交时使用正式 reassignment，保留原负责人、新负责人、操作人、时间及必要原因 / 历史。

员工 inactive / 离职 / 失去承责资格时，Demand 属于必须扫描并交接的活跃业务对象。

**依赖：** PDM-02 / PDM-03 当前 Final。

**状态：** `STABLE_CONSISTENT / USER_APPROVED`

### P11-A08｜找车申请最低必填只有“想找什么车”

Application 最低必填：

> **想找什么车**

预算可选；年款、里程、车况、颜色、地域、其他要求等均属于可选条件。某些条件未知时允许先保存已知信息，不要求全部字段补齐才表达找车诉求。

具体这些条件如何进入 Matching 判定由 PDM-12 冻结。

**状态：** `STABLE_CONSISTENT / USER_APPROVED`

### P11-A09｜匹配准备度与 Demand 主状态分层

Demand 已 active 不等于 Matching 必然已经启动。

至少要区分：

- 正式服务已经 active；
- 销售还在整理 / 确认匹配描述；
- 确定性解析后条件 ready；
- 部分条件需要人工确认。

匹配准备度不得被新增为第二套 Demand 主状态机；具体 readiness 字段和 Matching 算法由 PDM-12 承接。

**状态：** `STABLE_CONSISTENT / USER_APPROVED`

### P11-A10｜客户原始要求、销售匹配描述、标准条件、需求说明必须分层

至少区分：

1. 客户原始找车要求：保存客户原话 / 原始条件，用于查看与留档；
2. 销售匹配描述：销售沟通后整理的“系统实际应该找什么车”；
3. 标准匹配条件：确定性词典 / 规则解析后的结构化条件；
4. 需求说明 / 背景：业务背景，不参与自动 Matching；
5. CRM 跟进：统一 CRM 时间线，可关联 `demand_id`，不新建第二套 Demand 跟进表。

客户原始表达不得直接作为自动 Matching 的主输入。

**状态：** `STABLE_CONSISTENT / USER_APPROVED`

### P11-A11｜pending Application 必须有负责人并进入员工工作台待处理

“提交帮我找车”属于高意向人工服务动作。创建正式 Find-car Application 前必须先得到合法服务归属：

1. Customer 已有合法 current owner → 以当前合法归属承接本次 Application / 待处理任务；
2. Customer 无 owner → 先按 PDM-03 的有效分享 / 转介绍归属规则解析；
3. 仍无可用 owner → 进入 active + eligible + accepting 合格接客池完成 owner 分配；
4. 接客池异常为空 → 不创建 `responsible = null` 的 Application；保留 `owner_assignment_pending` / 配置异常事实并向客户提示暂时无法建立人工找车服务，池恢复后再重试。

Application 创建成功后，立即进入负责员工工作台“找车服务待处理”。

卡片至少展示：

- 客户；
- 想找什么车；
- 预算（如有）；
- 提交时间；
- 当前负责人；
- pending 状态。

工作台只提供“处理申请”进入 E05 申请详情，不在卡片上一键激活 Demand。

其他约束：

- pending Application 本身属于公海保护事实；
- Customer 仍有 pending Application 时不得按普通无业务客户直接进入公海；
- 客户修改 pending Application 只更新同一 Application / 同一工作台任务；
- 客户撤回 / 员工关闭后，同一任务同步结束，不创建 Demand；
- owner / 员工离职或失去承责资格时，pending Application / 待处理任务必须进入正式交接，不能遗留给 inactive / ineligible 员工；
- Application 的当前负责人 / 待处理责任不得被误当成未来 Demand 永久负责人；真正激活 Demand 时仍按当时合法业务归属和 P11-A07 规则建立 `demand_responsible_sales_id`。

**状态：** `STABLE_BASE + PREFINAL_INTEGRITY_COMPLETED / USER_APPROVED`

### P11-A12｜终态 Demand / Application 保留历史，不做普通物理删除或原地复活

Application closed / withdrawn、Demand completed / cancelled 均保留必要业务历史。错误处理只能通过明确 correction / invalidation / amendment 类治理方式追加事实，不以普通编辑覆盖历史。

**状态：** `STABLE_CONSISTENT / USER_APPROVED`

### P11-A13｜成交不自动批量结束客户其他 Demand

某笔 Transaction completed 只完成该交易及相关车辆成交事实，不得自动把同一 Customer 的其他 Demand 批量改为 completed / cancelled。

是否完成某条 Demand 必须由该 Demand 的真实服务目标和正式状态动作决定。

**状态：** `STABLE_CONSISTENT / USER_APPROVED`

---

## 8. Batch 1 明确排除项｜本轮不允许偷渡

以下存在真实反向证据、后续演进或需要用户重新确认，因此**不进入 Batch 1**：

### 8.1 P11-B4-01｜Application → Demand 激活时机存在历史冲突

2026-09-06 SSOT：

- 已有正式找车权益的客户：Application 保存后可直接创建 / 激活 active Demand；
- 未有权益的客户：Application 保持 pending，等待人工开通。

2026-09-19 R10-16 / R10-53 及 Current：

- 统一表达为 `手机号门槛 → pending Application → 员工处理 → 激活后生成正式 Demand`；
- E05-02 承载“开通正式找车服务”。

该冲突已于 2026-10-05 由用户正式裁决：统一采用“Application 先 pending、员工人工激活唯一 Demand”；已有 entitlement 也不得自动 active。详见 §9B P11-B4-01。

**状态：** `BATCH_4_RESOLVED / USER_APPROVED / SEE_§9B`

### 8.2 P11-B4-02｜正式找车资格来源模型是否继续保留

2026-09-06 SSOT 明确：

`等级授予 can_use_find_car_matching OR Customer 级人工开通`

并曾有默认配置：普通=false、粉丝=true、VIP=true；等级名不是写死业务枚举。

Current 只剩 E05-02 的泛化 `entitlement/authorization` Guard，资格来源、人工开通记录和等级配置链没有完整投影。

该冲突已于 2026-10-05 由用户正式裁决：

- 正式找车资格只来自 Customer 当前等级配置；
- 普通客户当前无正式找车权益，但仍允许提交 Application；
- 需要正式开通时通过等级调整进入具备权益的粉丝 / VIP 等等级；
- 不建设单 Customer find-car entitlement override；
- 等级升级后也不自动激活 pending Application，仍需员工人工处理。

详见 §9B P11-B4-02。

**状态：** `BATCH_4_RESOLVED / USER_APPROVED / SEE_§9B`

### 8.3 P11-B3-01｜Customer 停用模型属于后续明确知情修改｜HO-P01-P11-001 已被替代

2026-10-04 曾先裁成“轻量停用但不自动改变既有 Demand 状态”；2026-10-05 用户进一步明确：账号都已停用，正在运行的找车业务也必须停下来，只是历史不能丢。

因此：

- 旧 `HO-P01-P11-001` 被 supersede；
- 新 `HO-P01-P11-002` 明确 active Demand → paused；
- 不删除 Demand，不改 completed/cancelled；
- 账号恢复后不自动恢复 active。

**状态：** `USER_MODIFIED / USER_APPROVED / PROMOTED_TO_FORMAL_BATCH_3 / SEE_§9A`

---

## 9. Batch 2｜明确废弃 / 被替代规则｜用户已全部确认

> 本批只处理已经有明确废弃、被替代或与当前已批准 Authority 冲突的旧方向；不把 Batch 4 的真实冲突混入本批。
>
> **P11-B2-08 已由用户单独修正并确认；其余 9 条于 2026-10-05 经用户“全部同意/确认执行”全部通过。Batch 2 正式关闭。**

### P11-B2-01｜禁止“提交 Application 就无条件直接生成 active Demand”

不得把任何客户一提交找车申请就无条件创建 active Demand。

这条废弃的是“**无条件直接激活**”方向；该冲突已由 `P11-B4-01` 正式裁决：即使已具备找车权益，Application 仍先 pending，必须由员工人工激活唯一 Demand。

**状态：** `DEPRECATED_DIRECTION / USER_APPROVED`

### P11-B2-02｜禁止“一个 Customer 只能有一条 Demand”

同一 Customer 可以同时存在多条独立 Demand、pending Application、paused Demand 和历史 Demand。

旧“客户只能一条 Demand / 整个 C02 只能有一个互斥状态”方向不得恢复。

**状态：** `SUPERSEDED_BY_MULTI_DEMAND_WORKSPACE / USER_APPROVED`

### P11-B2-03｜禁止把 paused Demand 归入已结束历史

`paused` 是当前正式 Demand 的暂停状态，可恢复，不属于 `completed / cancelled` 已结束历史。

**状态：** `DEPRECATED_STATE_PROJECTION / USER_APPROVED`

### P11-B2-04｜禁止增加自动 expired Demand 主状态

V1 Demand 主状态只保留：

`active / paused / completed / cancelled`

不得因为长期未处理、长时间未匹配、客户暂时不活跃等原因自动制造 `expired` 主状态。

**状态：** `DEPRECATED_STATE / USER_APPROVED`

### P11-B2-05｜禁止 Customer owner 变化自动漂移 Demand 负责人

普通 Customer owner 变化只改变 Customer owner，不自动修改既有 Demand 的负责人。

确需变更时走正式 reassignment；员工 inactive / 离职属于强制交接场景。

**依赖：** PDM-03 已批准 Authority。

**状态：** `DEPRECATED_RESPONSIBILITY_COUPLING / USER_APPROVED`

### P11-B2-06｜禁止 completed / cancelled Demand 原地 reopen

completed / cancelled Demand 属于终态历史。

客户未来再次找车时必须新建新的 Demand，不允许把旧终态 Demand 原地恢复为 active。

**状态：** `DEPRECATED_REOPEN_FLOW / USER_APPROVED`

### P11-B2-07｜禁止恢复“代淘中 / 代淘客户”

“代淘中 / 代淘客户”不得恢复为：

- 客户等级；
- Demand 状态；
- 找车权益状态；
- “正在持续匹配”的替代概念。

客户是否具备找车资格由正式权益规则决定；客户是否正在正式找车由真实 active Demand 决定。

**状态：** `DEPRECATED_CONCEPT / USER_APPROVED`

### P11-B2-08｜找车权益下降后的既有 Demand 处理｜用户修正并确认

原候选“找车权益下降不得自动影响已 active Demand”被用户主动否决并撤回。

当前正式口径改为：

> **找车权益下降 / 被取消后，权益立即停止生效；既有 active Demand 自动转为 paused，但 Demand 本体、条件和全部历史继续保留。**

具体规则：

1. 找车权益下降 / 关闭后，不允许新建或激活新的正式 Demand；
2. 当前 `active Demand` 自动转为 `paused`，停止继续进入 active Matching；
3. 原本已经 `paused` 的 Demand 继续保持 paused；
4. `completed / cancelled` 历史 Demand 不受影响，不恢复、不改写；
5. pending Application 可以继续保留，但权益恢复前不得激活为正式 Demand；
6. Demand 本体不得删除，以下事实与历史全部保留：
   - 客户原始找车要求；
   - 销售匹配描述；
   - 标准匹配条件；
   - 需求说明 / 背景；
   - 历史匹配结果；
   - 历史 Recommendation；
   - CRM 跟进关联；
   - 状态与负责人历史；
7. 找车权益以后重新恢复时，**不得自动把 paused Demand 恢复为 active**；
8. 权益恢复只恢复“可以继续正式找车服务”的资格；客户本人或有权限员工必须执行正式“恢复”动作，原 Demand 才重新进入 `active`；
9. 恢复动作继续服从当前身份、permission、data scope、Demand 当前状态等 Guard；
10. 权益恢复后重新 active，再按当前 Matching readiness / PDM-12 规则决定是否重新进入持续 Matching。

### 与 Customer 账号停用的边界

`找车权益下降 / 取消` 与 `Customer 账号停用` 仍是两个不同业务事件，但在 Demand 域会得到相同的“停止继续运行”结果：

- entitlement 下降：按本条使 active Demand → paused；
- Customer 账号停用：按 `P11-B3-01 / HO-P01-P11-002` 使 active Demand → paused；
- 两者都不得删除 Demand、改写历史或自动 complete / cancel；
- 两者恢复时都不得自动恢复 active，必须走正式 resume；
- 账号停用不等于自动降低客户等级，也不等于删除 entitlement 事实；只是账号停用本身独立触发 Demand 暂停。

### 被替代旧方向

以下旧方向不得恢复：

- 找车权益已经下降，但 active Demand 仍无条件继续 active Matching；
- 权益下降时直接删除 / cancel / complete 既有 Demand；
- 权益恢复时自动恢复全部 paused Demand；
- 权益变化抹掉历史匹配 / 推荐 / 跟进 / 条件。

`P11-B4-02` 已正式裁决为“找车资格只来自 Customer Level entitlement，不建设单 Customer find-car override”。无论等级体系后续增加什么新等级，只要当前有效找车 entitlement 从有效变为无效，就继续适用本条生命周期效果。

**用户裁决：** 2026-10-05 用户明确同意，并随后“确认执行”。

**状态：** `USER_MODIFIED / USER_APPROVED / SUPERSEDES_PREVIOUS_B2_08_CANDIDATE`

### P11-B2-09｜禁止客户原始自然语言直接经 AI 猜测成为正式 Matching 条件

客户原始表达必须作为原始业务事实保留，但不得直接交给 AI 猜测后生成正式自动 Matching 条件。

PDM-11 只冻结信息分层；确定性解析 / Matching 细则正式由 PDM-12 承接。

**状态：** `DEPRECATED_AI_MATCHING_DIRECTION / USER_APPROVED`

### P11-B2-10｜禁止恢复 V1 Customer Merge 及其 Demand 阻断主流程

PDM-01 当前 Authority 已明确：V1 不建设 Customer Merge。

因此不得恢复：

- P06-01 / P06-M01 Customer Merge 主流程；
- “任一 Customer 存在 active / paused Demand → 阻断 Merge → 返回处理 Demand”的旧主业务链。

IA 中残留的 Merge carrier 只能登记为 stale carrier，不能反向恢复产品功能。

**依赖：** PDM-01 已批准 Final。

**状态：** `SUPERSEDED_BY_PDM01_NO_MERGE / USER_APPROVED`

---
## 9A. Batch 3｜明确知情修改 / 后续明确新增｜用户已确认

> 本批只纳入已经有后续明确用户裁决、且与旧规则存在知情变化的内容；不重复制造新规则原子。

### P11-B3-01｜Customer 账号停用后，运行中的 Demand 自动暂停｜用户修正并确认

2026-10-05 用户进一步修正此前“账号停用不自动改变 Demand 状态”的口径。

当前正式规则：

> **Customer 账号一旦停用，正在运行的找车业务必须停止继续运行；active Demand 自动转为 paused，但 Demand 和全部历史事实保留。**

具体规则：

1. Customer 账号停用不要求先手工 complete / cancel 现有 Demand；
2. 停用生效时，当前 `active Demand → paused`；
3. 原本已经 `paused` 的 Demand 继续保持 paused；
4. `completed / cancelled` Demand 不改写、不复活；
5. 停用不得删除 Demand，也不得清空：
   - 客户原始找车要求；
   - 销售匹配描述；
   - 标准匹配条件；
   - 需求说明 / 背景；
   - 历史匹配结果；
   - 历史 Recommendation；
   - CRM 跟进关联；
   - 状态、负责人及审计历史；
6. 账号停用期间，不允许该 Customer 继续新建 / 激活正式 Demand，也不允许 paused Demand 恢复 active；
6A. 已存在的 pending Application 不删除、不自动 complete / cancel / close；保留原始提交内容、修改历史、负责人和待处理历史，但账号停用期间不得激活为 Demand。Customer 侧依赖账号权益的 Application 编辑 / 新增等业务动作暂停；有权限员工仍可查看并按治理事实关闭申请。账号恢复后 pending Application 也不得自动激活，仍需正常人工处理；
7. Customer 账号恢复后，只恢复账号可用性，不自动恢复找车；
8. 原 paused Demand 只有在客户本人或有权限员工执行正式“恢复”动作后，才能重新进入 active；
9. 恢复动作继续服从当前身份、permission、data scope、Demand 当前状态和找车 entitlement 等适用 Guard；
10. 重新 active 后，再按 PDM-12 的 Matching readiness / 标准条件规则决定是否恢复持续 Matching。

### 与其他业务域的边界

Customer 停用是全局账号级“停止继续业务”的触发，但不同业务对象不能机械套用同一状态枚举：

- Demand：本条已经明确 `active → paused`；
- Consultation / Recommendation / Lock / Waitlist / Transaction / Refund：不得继续把已停用客户当正常活跃账号推进新业务动作，但具体是暂停、冻结、禁止新动作还是保留现实状态，由对应 PDM 冻结；
- 已经发生的锁定、交易、资金、推荐、审计等事实不得因账号停用被删除或伪造为未发生。

### Handoff supersession

- `HO-P01-P11-001 = HANDOFF_SUPERSEDED`；
- `HO-P01-P11-002 = HANDOFF_ACCEPTED`；
- PDM-01 Final §11 已在同一施工中完成 source backwrite。

**用户裁决：** 2026-10-05 用户明确“账号都停用了，现有找车肯定也全部停了，但历史资料保留”，随后“确定执行”。

**状态：** `INFORMED_LATER_CHANGE / USER_MODIFIED / USER_APPROVED`

---

## 9B. Batch 4｜真实冲突 / 缺口｜用户已完成裁决

> 本批原有两个真实冲突均已由用户在 2026-10-05 明确裁决，并在本次“确认执行”中授权正式落库。不得再按旧 9/06 SSOT 的“有 entitlement 即自动激活 Demand”或“Customer 级单独人工开通找车 entitlement”恢复。

### P11-B4-01｜Application → Demand 必须人工激活｜用户裁决

用户选择 9/19 R10 / Current 方向，并进一步冻结以下完整语义：

1. 无论 Customer 当前是否已经具备正式找车权益，提交“帮我找车”后都先形成 `pending Find-car Application`；
2. 任何 Application 都不得因为“当前已有找车 entitlement”而自动创建 / 自动激活 Demand；
3. pending Application 进入员工“找车服务待处理”工作台；
4. 工作台卡片只负责进入处理详情，不提供绕过详情页 Guard 的一键激活；
5. 正式 Demand 只能由具备对应业务能力、且 Customer / Application 位于其 data scope、object state 合法的员工在处理详情中执行“开通正式找车服务”后创建 / 激活；
6. 激活时至少重新校验：
   - Customer 账号当前可用；
   - Application 仍为 pending；
   - Customer 当前等级仍具备正式找车权益；
   - 手机号人工服务门槛仍满足；
   - 当前员工 identity / permission / data scope / object state 合法；
7. Customer 即使已经是粉丝 / VIP 或其他具备找车权益的等级，也只代表“有资格被正式开通”，不代表提交后自动 active；
8. Customer 当前无找车权益时，仍允许提交 Application；Application 可以保持 pending，等待后续等级调整后再由员工人工开通，或由客户撤回 / 员工关闭；
9. Customer 等级后来升级并获得找车权益时，不自动激活已有 pending Application，仍必须由员工正式处理；
10. 同一 Application 最多激活一个 Demand；激活动作必须幂等，重复提交不得创建第二个 Demand。

**被替代旧方向：**

- “有 entitlement 的客户保存 Application 后直接自动 active Demand”；
- “提交找车申请本身等于正式开始持续 Matching”。

**状态：** `REAL_CONFLICT_RESOLVED / USER_APPROVED / OPTION_B`

### P11-B4-02｜正式找车资格只来自客户等级权益｜用户裁决

用户明确否决旧的：

> `等级权益 OR Customer 级人工单独开通 find-car entitlement`

当前正式模型改为：

> **正式找车资格只读取 Customer 当前客户等级所配置的找车权益。V1 不建设单个普通客户的独立 find-car entitlement override / grant。**

具体规则：

1. Customer Level 是一组后台可配置权益，不只是“普通 / 粉丝 / VIP”名称；
2. “正式找车 / Matching 资格”是客户等级权益之一；
3. 当前 V1 业务基线：
   - 普通客户不具备正式找车权益；
   - 粉丝 / VIP 等目标等级可配置具备正式找车权益；
   - 后续扩展等级同样按该等级当前权益配置判断；
4. 普通客户需要获得正式找车资格时，不给该 Customer 单独增加一个“找车权限”；正式动作是把客户等级调整到具备该权益的等级；
5. Customer 达到具备找车权益的等级后，资格立即按新等级生效，但不自动创建 / 激活 Demand；
6. Customer 从具备找车权益的等级下降到不具备该权益的等级时，继续适用 P11-B2-08：
   - active Demand → paused；
   - paused 保持 paused；
   - completed / cancelled 不改写；
   - 全部历史、条件、Recommendation、CRM 跟进与责任历史保留；
   - 以后权益恢复也不得自动恢复 active，需正式 resume；
7. Customer 账号停用是独立触发源，但按 P11-B3-01 同样使 active Demand → paused；
8. 不建设“普通客户保持普通等级，但单独人工勾选找车 entitlement”的第二套长期授权模型；
9. 旧 `customer-level manual find-car entitlement enable` 方向明确 `DO_NOT_RESTORE`。

### 客户等级调整的权限与操作边界

等级调整属于受控 Customer 治理 / 业务动作，继承 PDM-02：

> `identity + permission + data scope + object state`

当前 V1 不增加复杂审批流。

1. 使用独立受控 capability（工程命名可统一为类似 `customer.level.manage`）；
2. 产品基线不把“经理 / 店长”写死成唯一角色；
3. 实际可通过角色模板默认 permission 或员工个人明确授权实现：
   - 经理 / 店长通常可配置拥有；
   - 个别普通销售也可以被明确放权；
   - 未获授权人员不得调整；
4. 4S 成员继续受名邦 Customer / CRM 域 hard DENY；
5. Customer 必须位于操作者当前 data scope；
6. 修改提交时重新校验当前 permission / scope / object state；
7. 不要求“销售申请 → 店长审批 → 经理审批”的固定多级审批链；
8. 等级修改至少审计：Customer、原等级、新等级、操作人、操作时间；原因默认可选，除非后续具体业务另有要求；
9. 后台 / CRM 至少已有手机号搜索 Customer 的能力；具体搜索入口与昵称 / 名称等辅助搜索由 PDM-16 / PDM-21 / PDM-22 承载，不在 PDM-11 重造搜索体系。

### 普通客户提交找车后的客户侧权益提示

普通客户允许提交 Find-car Application，但因为当前等级无正式找车权益：

- Application 正常保存为 pending；
- 不创建 active Demand；
- 客户侧应明确提示其当前等级无法正式开通持续找车服务；
- 提示应引导升级到**当前后台配置中真实具备找车权益的等级**；当前业务配置若粉丝 / VIP 具备该权益，可以显示“粉丝 / VIP”，但客户端不得把这两个名称写死为永久唯一可升级目标；
- 可提供“联系顾问”出口，帮助客户完成等级升级 / 后续服务；
- 该提示不得伪装成 Application 提交失败；客户已经成功表达找车意愿，只是正式服务尚未激活。

建议产品语义：

> **找车申请已提交。您当前等级暂不具备正式找车权益；升级到具备该权益的客户等级后可开通正式找车服务，可联系顾问办理。**
>
> 当前后台配置若明确为“粉丝 / VIP”具备找车权益，客户端可具体展示“升级为粉丝或 VIP”。

最终展示文案允许 PDM-20 按页面空间压缩，但不得丢失“申请已提交 / 当前等级受限 / 升级后可开通 / 联系顾问”四层语义。

**状态：** `MISSING_CURRENT_AUTHORITY_RESOLVED / USER_APPROVED / LEVEL_ENTITLEMENT_ONLY`

### 与 PDM-10 客户等级价格权益的统一模型

本条与 PDM-10 共同冻结：

> **Customer Level = 一组后台可配置权益。找车资格与批发车价格查看模式都从当前等级读取，但二者是独立 entitlement，不得互相替代。**

例如当前常见配置：

- 普通客户：
  - 正式找车权益 = OFF；
  - 批发车价格权益 = LIMITED；
  - daily base quota = 后台配置（当前业务示例可为 20）；
- 粉丝 / VIP：
  - 正式找车权益 = 可配置为 ON；
  - 批发车价格权益 = 可配置为 UNLIMITED；
- 具体等级名称、未来扩展等级和 quota 数值不得硬编码成算法常量。

价格权益的列表 / 详情展示、自动解锁、额度耗尽、`--万`、免费增加当天次数等由 PDM-10 当前后续裁决承担；PDM-11 只消费“当前等级是否具备正式找车权益”的结果。

---


## 10. Stale Carrier Ledger｜当前只登记、不修改 IA / Low-Fi

| Carrier | 当前问题 | 正确 Authority / 后续处理 |
|---|---|---|
| IA Lifecycle `CO-O04 RESPONSIBILITY = N/A_EXPLICIT` | 把 Demand 独立负责人压掉 | 继承 SSOT + PDM-03：Demand 有独立负责人，普通 owner change 不自动漂移 |
| IA Lifecycle `CO-O04 HISTORY = N/A_EXPLICIT` | 容易被误读为 Demand 不保留历史 | 不强制造第二套 history object，但终态、负责人、状态变化和业务历史必须保留 |
| P06-01 / P06-M01 Customer Merge + active/paused Demand Guard | V1 Customer Merge 已被 PDM-01 取消 | 标 `STALE_CARRIER`，post-PDM25 统一对齐，不恢复 Merge |
| C02-02 PAUSED Low-Fi | 当前写“只读 / 无业务命令” | 与 R10 客户可恢复 / 结束自己的 Demand 不一致，待 PDM-20 / IA Alignment 修正投影 |
| E01 工作台 | pending 找车申请“找车服务待处理”完整卡片 / Navigation 缺失 | 保留 R10-53 业务 Authority，后续员工端 PDM / IA Alignment 承载 |
| C02 主工作区 | 打开申请 / Demand / Recommendation / 历史的正式 Navigation 不完整 | 产品结构保留，post-PDM25 统一 carrier 对齐 |
| C02 Application form | 最低必填“想找什么车”和可选字段未完整真人化 | 产品规则保留，后续客户端 / IA Alignment 承载 |
| E05-04 | 销售匹配描述保存→解析→更新标准条件→重算链不完整 | Demand 字段边界由 PDM-11 保存，具体解析 / 重算由 PDM-12 |

统一：

> `STALE_CARRIER / DEFERRED_TO_POST_PDM25_IA_LOWFI_ALIGNMENT`

IA / Low-Fi 不得反向覆盖本 PDM 最终 Authority。

---

## 11. Final 前完整性复核｜发现项与处理结果

### 11.1 Missing Rule Audit

本轮在 Batch 1～4 用户裁决完成后重新反扫 9/06 SSOT、9/19 R10、001～078、PDM-01～10 Final 与正式 handoff，发现并关闭以下缺口：

| id | 缺口 | 当前处理 |
|---|---|---|
| P11-LIA-01 | pending Application 缺少无 owner / pool-empty 创建 Guard | 已补：先分配合法 owner / 负责人；pool empty 时不得创建 responsible=null Application |
| P11-LIA-02 | pending Application 的公海保护事实未写入 PDM-11 / PDM-17 handoff | 已补：pending Application 是公海保护事实，必须交 PDM-17 |
| P11-LIA-03 | 客户“结束自己的 Demand”未定义 completed / cancelled 的最终判定 | 用户裁决：客户发起结束请求，员工确认并根据真实结果落 completed / cancelled；员工也可直接结束 |
| P11-LIA-04 | Demand 创建时间事实未明确，PDM-13 Priority 仲裁可能自行猜测 | 已补不可变 `Demand.created_at` / 首次激活时间语义 |
| P11-LIA-05 | “升级粉丝 / VIP”文案可能误被写死等级名 | 已补：读取当前真实具备权益的等级；粉丝/VIP仅当前配置示例 |
| P11-LIA-06 | 正文比 future handoff 丰富，PDM-16/17/20/21/22/25 接收语义被压薄 | 已扩展正式 handoff，禁止后续只接收摘要 |
| P11-LIA-07 | Current 控制入口与 Decision Register 存在状态 / Gate stale | 在本轮同步修复 Current / Next / Project State 与 Batch 1 Gate |

另外补清 Customer disable 对 pending Application：

- pending Application 保留；
- 停用期间不得激活；
- 不因为停用删除 / 自动终结；
- 恢复账号后不自动激活，仍走员工人工处理。

### 11.2 Semantic Detail Audit

本轮重新核对并确认：

- Application / Demand 双对象、Application 幂等激活、多 Demand、paused 非历史、终态不 reopen；
- Customer 结束采用“请求 → 员工确认结果”的双向结束模型，不增加第五个 Demand 主状态；
- 员工可直接完成 / 取消；客户无需理解 completed / cancelled 两个内部终态；
- Application / Demand 均不得形成无负责人正式人工业务；
- pending Application 与 active/paused Demand 都属于后续公海治理必须考虑的业务事实；
- Customer Level entitlement 是找车资格唯一来源，单 Customer override 明确 DO_NOT_RESTORE；
- 等级名称不进入找车核心算法与永久文案常量；
- Customer disable / entitlement loss 均使 active Demand → paused，但两者是不同触发源；
- PDM-10 价格权益与 PDM-11 找车权益共享 Customer Level 配置容器，但 entitlement 彼此独立。

### 11.3 Cross-PDM Integrity Audit

当前复核结果：

- PDM-01：Customer disable / phone continuity / 历史保留一致；
- PDM-02：identity + permission + data scope + object state、一致的 active/inactive 与 4S hard DENY 不冲突；
- PDM-03：owner assignment、pool-empty、owner / business responsibility 分层与本域一致；
- PDM-05：车型 / 年款主数据边界不被 PDM-11 重写；
- PDM-07：Vehicle 车况事实 unknown / provenance 不被 Demand 猜测覆盖；
- PDM-10：Customer Level 价格 entitlement 与找车 entitlement 已统一为同一等级配置框架中的独立权益；
- PDM-12～25：需要承接的语义全部以正式 HANDOFF_OPEN 登记，不把“后面做”当作已经完成。

当前未发现需要推翻已批准 Batch 1～4 的新硬冲突。

> **PDM-11 已达到“Final 候选可生成”条件，但尚未经过用户最终总览批准，因此不得标记 COMPLETE / INTEGRITY_PASS。**

---

## 12. Future handoff｜已按完整语义正式登记 HANDOFF_OPEN

PDM-11 Batch 1～4 与 Final 前完整性复核均已完成用户裁决 / 证据补齐。以下 handoff 必须携带完整语义，不允许目标 PDM 只接收一句摘要：

- `HO-P11-P12-001` → PDM-12：
  - 只有员工人工激活后的 active Demand 才进入正式 Matching；
  - Application 不等于 Matching；
  - 客户原始要求 / 销售匹配描述 / 标准条件 / 需求说明分层；
  - active 不等于 matching-ready；
  - readiness、确定性解析、条件变更重算、候选等级正式由 PDM-12 冻结；
  - Demand `created_at` 是后续跨域可引用的不可变创建事实。
- `HO-P11-P13-001` → PDM-13：
  - pending Application 不产生 Priority；
  - Priority 只能建立在合法 active Demand / Matching 上；
  - Demand paused/completed/cancelled 后的 Priority 处理按 PDM-13 冻结；
  - 若 Priority 仲裁用 Demand 先后，只能使用不可变 `Demand.created_at`，不得使用 updated_at / resume time。
- `HO-P11-P14-001` → PDM-14：
  - Recommendation 可关联 source_demand_id；
  - paused/completed/cancelled 不删除历史 Recommendation；
  - Recommendation 生命周期不得反写 Demand 为 active；
  - 多 Demand 的 Recommendation 归属必须保持真实 source_demand_id。
- `HO-P11-P16-001` → PDM-16：
  - CRM Customer 详情承载当前等级、找车 entitlement 结果；
  - 展示 pending Application、active/paused Demand、completed/cancelled 历史概览；
  - Demand 详情使用统一 CRM follow-up，通过 demand_id 关联，不新建第二套 Demand 跟进表；
  - customer.level.manage 受 permission + data scope + object state 控制；
  - 客户检索继承手机号搜索，具体 CRM 搜索 / 入口由 PDM-16 承载。
- `HO-P11-P17-001` → PDM-17：
  - pending Find-car Application **本身是公海保护事实**；
  - active / paused Demand 同样是未完成业务事实；
  - Customer 无 owner 时提交找车必须先完成合法 owner 分配，再创建有负责人的 Application；
  - pool empty 时不得创建 responsible=null Application；
  - owner / 公海变化不得静默漂移 Demand 负责人；
  - pending Application / 待处理任务和未完成 Demand 都必须纳入正式交接。
- `HO-P11-P20-001` → PDM-20：
  - C02 是多对象找车工作区：pending Application、active Demand、paused Demand、Recommendation、completed/cancelled history 可并存；
  - Application 最低必填“想找什么车”，pending 可编辑 / 撤回；
  - 普通 / 无 entitlement 客户提交成功仍是 pending，并提示当前等级受限、可升级到**当前配置中具备权益的等级** / 联系顾问；不得永久写死粉丝/VIP；
  - active Demand 可暂停，paused 可恢复；
  - 客户“结束找车”生成待员工确认结束请求；客户端显示“结束处理中”，但不创造第五个 Demand 主状态；
  - ended Demand 历史保留，未来找车新建；
  - 账号停用时既有 pending Application 保留但不得激活。
- `HO-P11-P21-001` → PDM-21：
  - E01 展示“找车服务待处理”，卡片客户 / 想找什么车 / 预算 / 提交时间 / 当前负责人 / pending；
  - 只提供“处理申请”进入详情，不允许卡片一键绕过 Guard 激活；
  - E05 Application 详情人工激活唯一 Demand / 关闭申请；
  - 等级不足时先完成合法等级调整，等级调整本身不自动激活；
  - E05 Demand 详情完整承载客户原始要求、销售匹配描述、标准条件、需求说明、CRM 跟进、候选 / 推荐上下文；
  - 员工 active: pause/complete/cancel；paused: resume/complete/cancel；终态只读；
  - 员工处理客户结束请求时必须明确落 completed 或 cancelled；员工也可无请求直接结束；
  - Application / Demand reassignment 与 inactive / 离职交接不得丢负责人历史。
- `HO-P11-P22-001` → PDM-22：
  - PC 后台承载 Customer Level 权益配置，找车 entitlement 与 PDM-10 LIMITED/UNLIMITED/daily quota 属于同一等级配置体系中的独立权益；
  - V1 不提供单 Customer find-car entitlement override；
  - 等级可新增 / 改名 / 排序 / 启停 / 历史保留由客户等级治理承载；
  - customer.level.manage 类 capability 独立受控，不建设固定多级审批流；
  - PC 客户 / 找车管理至少可查看 Application / Demand 当前状态、负责人及必要治理入口，不能只做等级配置壳。
- `HO-P11-P25-001` → PDM-25：
  - 审计 Application 创建 / 编辑 / 撤回 / 关闭 / 激活转换；
  - Demand created_at、激活、pause/resume、complete/cancel、客户结束请求及员工确认结果；
  - Demand 负责人 reassignment；
  - Customer disable / entitlement loss 触发 active→paused；
  - Customer Level before/after/actor/time；
  - 必要 identity / permission / data scope / object state context；
  - 历史不得因终态、停用或等级变化被物理删除。

所有上述 handoff 当前均为 `HANDOFF_OPEN`；目标 PDM 接收后转 `HANDOFF_ACCEPTED`，目标完成并 source backwrite 后才允许 CLOSED。

---

## 13. 当前 Gate

```text
CURRENT_AUTHORITY_REFRESH = PASS
TARGET_PDM11_HANDOFF_READ = PASS
HO-P01-P11-001 = HANDOFF_SUPERSEDED
HO-P01-P11-002 = HANDOFF_ACCEPTED
COMPLETED_PDM_DEPENDENCY_CARD = PASS
TERMINOLOGY_NORMALIZATION = PASS
MISSING_RULE_AUDIT = PASS
SEMANTIC_DETAIL_AUDIT = PASS
CROSS_PDM_INTEGRITY_AUDIT = PASS
BATCH_1_CANDIDATES = 13
BATCH_1_USER_APPROVAL = PASS
BATCH_2 = PASS / USER_APPROVED
BATCH_3 = PASS / USER_APPROVED
BATCH_4 = PASS / USER_APPROVED
PDM11_FINAL = PUBLISHED / USER_APPROVED
PDM11_COMPLETE = YES
PDM11_INTEGRITY_PASS = YES
```

当前唯一下一步：

> **PDM-11 已完成最终用户批准、正式 Final 发布、双向追溯与 incoming handoff closure。后续以 `PDM-11_最终完整规则.md` 为唯一当前 Authority。**
