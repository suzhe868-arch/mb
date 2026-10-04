# PDM-11｜找车申请 / Demand 生命周期｜规则原子重建工作版

> 日期：2026-10-05  
> 当前状态：`IN_PROGRESS / EVIDENCE_RECONSTRUCTION_COMPLETE / BATCH_1_USER_REVIEW_PENDING`  
> 业务权威语言：中文（zh-CN）  
> 当前域：PDM-11｜Find-car Application / Demand / 生命周期 / 负责人 / 匹配准备度边界  
> 执行边界：本文件是 PDM-11 用户裁决前的工作底稿；Batch 1～4 未经用户确认不得自动晋升为 Final。

---

## 1. 启动门禁与 incoming handoff

PDM-01～PDM-10 单域 Integrity Audit 与 01～10 全局 Cross-PDM / Handoff / Global Invariant 总复核均已 PASS，PDM-11 启动门禁已解除。

本域启动前已读取 `CROSS_PDM_HANDOFF_REGISTER.md`，当前唯一 incoming handoff：

| handoff_id | 来源 | 完整语义 | 本域状态 |
|---|---|---|---|
| `HO-P01-P11-001` | PDM-01 | Demand 生命周期；Customer 停用不得自动终止既有 Demand，具体状态由 Demand 域处理 | `HANDOFF_ACCEPTED` |

承接 Guard：

- Customer 停用是客户身份 / 权益能力的上层可用性 Guard；
- 停用不得删除或自动终止既有 Demand；
- 恢复不得自动复活已经 completed / cancelled 的 Demand；
- Demand 的状态转换只能服从 PDM-11 自身生命周期规则；
- 该 handoff 只有在 PDM-11 Final 真正落地且来源 PDM 完成反向回写后，才允许 `HANDOFF_CLOSED`。

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
- Customer 停用对现存 Demand 的服务端 Guard；
- 找车权益 / customer-level 人工开通的最终后端来源；
- E01 pending 找车申请待办的完整任务生成 / 更新 / 去重；
- 匹配准备度与 Demand 主状态的服务端分层。

因此：

> **当前 PDM-11 不能以 Low-Fi / IA 存在为理由声称工程已实现。**

---

## 4. Completed-PDM Dependency Card｜已完成 PDM 强制依赖卡

| 依赖 PDM | 约束对象 | 当前有效规则 | PDM-11 可补充 | PDM-11 不可静默改写 |
|---|---|---|---|---|
| PDM-01 | Customer / 手机号 / 停用 | 手机号不是身份；手机号变化不改变 Demand；手机号是人工服务门槛；Customer 停用不删除或自动终止既有 Demand | 找车申请 / Demand 在这些 Guard 下的具体动作和状态 | customer_id 连续性、手机号身份边界、停用不自动终止 Demand |
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
- 撤回 / closed 后不得再激活为 Demand。

### 6.4 多需求并存

一个 Customer 可以同时存在：

- 多条 active Demand；
- pending Application；
- paused Demand；
- completed / cancelled 历史 Demand；
- 与不同 Demand 关联的 Recommendation。

C02 因此是找车工作区，不是单一互斥状态页。

### 6.5 负责人分层

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

## 7. Batch 1｜稳定一致候选｜待用户审查

> 只有前史、9/19、后续 Current 与已完成 PDM 没有发现真实产品反转的条款进入本批。存在版本冲突、后续知情修改或需要恢复历史模型的内容全部排除，不在 Batch 1 偷渡。

### P11-A01｜Application 与正式 Demand 必须分离

客户提交“帮我找车”首先形成 Find-car Application；正式 Demand 是持续服务业务对象。Application 与 Demand 不得合并成同一个状态对象。

**稳定证据：** 9/06 DEC-003、SSOT、9/19 R10-16 / R10-53、IA V5 Current 同向。

**状态：** `STABLE_CONSISTENT / USER_REVIEW_PENDING`

### P11-A02｜一个 Customer 可以同时存在多条独立 Demand 与 pending Application

客户不限制为“只能一条当前 Demand”。C02 是聚合工作区，应允许同时展示 active、pending、paused、completed/cancelled 以及关联 Recommendation。

`paused` 仍属于当前正式 Demand，不得归入已结束。

**状态：** `STABLE_CONSISTENT / USER_REVIEW_PENDING`

### P11-A03｜手机号是提交找车申请的人工服务门槛

客户提交帮我找车前必须存在可用手机号；无手机号时触发正式手机号授权。

授权拒绝 / 取消：

- 不创建正式 Find-car Application；
- 不通知员工；
- 不建立人工服务业务对象；
- 当前页面已填写内容可临时保留用于再次修改 / 重试；
- 临时保留不是服务端持久化草稿，不新增“未授权找车草稿”状态机。

**依赖：** PDM-01 当前 Final。

**状态：** `STABLE_CONSISTENT / USER_REVIEW_PENDING`

### P11-A04｜Application pending 的编辑 / 撤回 / 幂等边界

pending Application：

- 客户可以编辑同一申请；
- 客户可以主动撤回；
- 撤回后关闭，不创建 Demand；
- 员工关闭后同样不得再激活；
- 客户修改 pending 申请只更新同一 Application 与同一待处理任务，不重复制造 Application / Task。

**状态：** `STABLE_CONSISTENT / USER_REVIEW_PENDING`

### P11-A05｜Demand 主状态固定为 active / paused / completed / cancelled

V1 Demand 主生命周期只使用：

- `active`；
- `paused`；
- `completed`；
- `cancelled`。

不增加自动 `expired` 主状态。`completed / cancelled` 终态只读；未来再次找车创建新 Demand，不恢复旧 Demand。

**状态：** `STABLE_CONSISTENT / USER_REVIEW_PENDING`

### P11-A06｜active / paused 的正式状态动作

当前负责人 / 有权员工：

- active：暂停 / 完成 / 取消；
- paused：恢复 / 完成 / 取消；
- completed / cancelled：只读。

“完成”和“取消”是不同业务结果，不得合并成一个“结束”。

客户侧历史规则同样允许对自己的正式 Demand 执行暂停、恢复、结束；具体客户页面 carrier 当前存在缺口，先登记 stale carrier，不反向改变本条产品语义。

**状态：** `STABLE_CONSISTENT / USER_REVIEW_PENDING`

### P11-A07｜Demand 负责人独立于 Customer owner

每条正式 Demand 保存独立负责人。普通 Customer owner 变化不得自动漂移 Demand 负责人；确需转交时使用正式 reassignment，保留原负责人、新负责人、操作人、时间及必要原因 / 历史。

员工 inactive / 离职 / 失去承责资格时，Demand 属于必须扫描并交接的活跃业务对象。

**依赖：** PDM-02 / PDM-03 当前 Final。

**状态：** `STABLE_CONSISTENT / USER_REVIEW_PENDING`

### P11-A08｜找车申请最低必填只有“想找什么车”

Application 最低必填：

> **想找什么车**

预算可选；年款、里程、车况、颜色、地域、其他要求等均属于可选条件。某些条件未知时允许先保存已知信息，不要求全部字段补齐才表达找车诉求。

具体这些条件如何进入 Matching 判定由 PDM-12 冻结。

**状态：** `STABLE_CONSISTENT / USER_REVIEW_PENDING`

### P11-A08｜匹配准备度与 Demand 主状态分层

Demand 已 active 不等于 Matching 必然已经启动。

至少要区分：

- 正式服务已经 active；
- 销售还在整理 / 确认匹配描述；
- 确定性解析后条件 ready；
- 部分条件需要人工确认。

匹配准备度不得被新增为第二套 Demand 主状态机；具体 readiness 字段和 Matching 算法由 PDM-12 承接。

**状态：** `STABLE_CONSISTENT / USER_REVIEW_PENDING`

### P11-A08｜客户原始要求、销售匹配描述、标准条件、需求说明必须分层

至少区分：

1. 客户原始找车要求：保存客户原话 / 原始条件，用于查看与留档；
2. 销售匹配描述：销售沟通后整理的“系统实际应该找什么车”；
3. 标准匹配条件：确定性词典 / 规则解析后的结构化条件；
4. 需求说明 / 背景：业务背景，不参与自动 Matching；
5. CRM 跟进：统一 CRM 时间线，可关联 `demand_id`，不新建第二套 Demand 跟进表。

客户原始表达不得直接作为自动 Matching 的主输入。

**状态：** `STABLE_CONSISTENT / USER_REVIEW_PENDING`

### P11-A08｜pending Application 必须进入员工工作台待处理

客户提交 pending Application 后，进入负责销售工作台“找车服务待处理”。

卡片至少展示：

- 客户；
- 想找什么车；
- 预算（如有）；
- 提交时间；
- 当前负责人；
- pending 状态。

工作台只提供“处理申请”进入 E05 申请详情，不在卡片上一键激活 Demand。

**状态：** `STABLE_CONSISTENT / USER_REVIEW_PENDING`

### P11-A08｜终态 Demand / Application 保留历史，不做普通物理删除或原地复活

Application closed / withdrawn、Demand completed / cancelled 均保留必要业务历史。错误处理只能通过明确 correction / invalidation / amendment 类治理方式追加事实，不以普通编辑覆盖历史。

**状态：** `STABLE_CONSISTENT / USER_REVIEW_PENDING`

### P11-A08｜成交不自动批量结束客户其他 Demand

某笔 Transaction completed 只完成该交易及相关车辆成交事实，不得自动把同一 Customer 的其他 Demand 批量改为 completed / cancelled。

是否完成某条 Demand 必须由该 Demand 的真实服务目标和正式状态动作决定。

**状态：** `STABLE_CONSISTENT / USER_REVIEW_PENDING`

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

当前不能仅按“后文件优先”自动选择。

**状态：** `BATCH_4_CANDIDATE / INFORMED_CHANGE_TEST_REQUIRED`

### 8.2 P11-B4-02｜正式找车资格来源模型是否继续保留

2026-09-06 SSOT 明确：

`等级授予 can_use_find_car_matching OR Customer 级人工开通`

并曾有默认配置：普通=false、粉丝=true、VIP=true；等级名不是写死业务枚举。

Current 只剩 E05-02 的泛化 `entitlement/authorization` Guard，资格来源、人工开通记录和等级配置链没有完整投影。

需要后续明确：

- 是否继续保留“等级权益 OR 个体人工开通”的资格模型；
- 如果保留，旧 ordinary / fans / VIP 默认值是否仍作为当前默认配置，还是只保留可配置机制；
- 该资格是“能否激活新的 Demand”，还是“能否提交 Application”；历史证据倾向前者，但须与 B4-01 一起裁清。

**状态：** `BATCH_4_CANDIDATE / USER_DECISION_REQUIRED`

### 8.3 P11-B3-01｜Customer 停用模型属于后续明确知情修改｜承接 HO-P01-P11-001

旧历史曾存在“Customer 有 active/paused Demand 时停用受阻 / 需先处理业务”的复杂模型。

PDM-01 在 2026-10-04 已由用户明确改为轻量停用：

- 停用不要求先结束既有 Demand；
- 停用不自动终止 Demand；
- 只暂停依赖 Customer 身份 / 权益的新业务能力。

本项是当前明确 Authority，但分类上属于后续知情修改，应进入 Batch 3 记录，不伪装成 9/19 稳定旧规则。

**状态：** `BATCH_3_PRECONFIRMED_UPSTREAM_CHANGE / NOT_YET_REVIEWED_IN_PDM11`

---

## 9. 明确废弃 / 不得恢复候选｜待 Batch 2 正式审查

以下仅先挂账，当前不提前向用户宣告 Batch 2 通过：

- 提交 Application 就无条件直接生成 active Demand；
- 一个 Customer 只能有一条 Demand；
- 把 paused Demand 归入已结束历史；
- 给 Demand 增加自动 `expired` 主状态；
- Customer owner 变化自动漂移 Demand 负责人；
- completed / cancelled Demand 原地恢复 / reopen；
- 把“代淘中 / 代淘客户”恢复为客户等级或 Demand 状态；
- 找车权益下降自动暂停 / 取消 / 完成已经 active 的 Demand；
- 把客户原始自然语言直接交给 AI 猜测并作为正式 Matching 条件；
- 恢复 V1 Customer Merge，并因此恢复“active/paused Demand 阻断 Merge”的旧 P06-01 / P06-M01 主流程。

最后一项继承 PDM-01 当前“V1 无 Customer Merge” Authority；IA 中仍存在 Merge carrier 只能作为 stale carrier 处理。

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

## 11. Missing Rule / Semantic Detail / Cross-PDM 初筛

### 11.1 Missing Rule Audit

已重新从 9/06 SSOT / Decision、9/19 R10 原始 Final、Current、M03/M16/M17 反扫，确认不能只用 9/19 C2 摘要。当前已恢复到工作版的历史细节包括：

- application / demand 双对象；
- 多 Demand；
- 独立 Demand 负责人；
- matching readiness 分层；
- pending task 工作台语义；
- 手机号拒绝后的临时页面数据边界；
- customer raw / sales description / standardized condition / demand note / CRM followup 分层；
- 终态只读与新需求新建。

### 11.2 Semantic Detail Audit

当前已挂出的主要语义风险：

- entitlement/authorization 来源不明；
- Application 激活时机存在 9/06 vs 9/19 真实版本差；
- IA 把 Demand responsibility 压成 N/A；
- 客户 paused Demand 的恢复/结束动作未完整投影；
- E01 pending Application task 丢失；
- History carrier 容易误读。

### 11.3 Cross-PDM Integrity Audit

当前已核对：

- PDM-01：Customer disable / phone continuity 与 Demand 不冲突；
- PDM-02 / 03：identity、permission、owner、business responsibility 与 Demand 分层一致；
- PDM-05：车型年款 / 车型事实边界不由 PDM-11重写；
- PDM-07：车况 unknown / provenance 规则不由 Demand 猜测覆盖；
- PDM-10：预算 / 价格只作为后续 Matching 条件，不在 PDM-11 改价格体系。

当前尚未形成任何 PDM-11 Final，因此不得宣告 Cross-PDM PASS；待四批裁决与 Final 后做本域完整性 Gate。

---

## 12. Future handoff 候选｜当前只记录，不提前正式 OPEN

PDM-11 后续至少会与以下目标域形成正式 handoff；在相应 PDM-11 Atom 经用户确认前，暂不写入 Register 为正式 `HANDOFF_OPEN`：

- PDM-12：Matching readiness、标准条件、确定性解析、候选等级；
- PDM-13：Priority 仅由合法 active Demand / matching 关系触发的边界；
- PDM-14：Recommendation 可选关联 `source_demand_id`，Demand 结束不抹除 Recommendation 历史；
- PDM-17：公海 / owner 变化与未完成 Demand 的正式交接；
- PDM-20：客户端 C02 / C02-01 / C02-02 真实状态、动作、文案；
- PDM-21：员工 E01 / E05 Application / Demand 工作台和状态动作；
- PDM-22：PC 客户 / Demand 管理与必要治理入口；
- PDM-25：Demand 创建、激活、状态转换、负责人变更、停用 Guard 的统一审计。

---

## 13. 当前 Gate

```text
CURRENT_AUTHORITY_REFRESH = PASS
TARGET_PDM11_HANDOFF_READ = PASS
HO-P01-P11-001 = HANDOFF_ACCEPTED
COMPLETED_PDM_DEPENDENCY_CARD = PASS
TERMINOLOGY_NORMALIZATION = PASS
MISSING_RULE_AUDIT_INITIAL_SCAN = PASS
SEMANTIC_DETAIL_AUDIT_INITIAL_SCAN = PASS
CROSS_PDM_INITIAL_SCAN = PASS
BATCH_1_CANDIDATES = 13
BATCH_1_USER_APPROVAL = PENDING
BATCH_2 = NOT_STARTED_FORMALLY
BATCH_3 = NOT_STARTED_FORMALLY
BATCH_4 = NOT_STARTED_FORMALLY
PDM11_FINAL = NOT_READY
```

当前唯一下一步：

> **提交 P11-A01～P11-A08 给用户进行 Batch 1 稳定一致项审查。未经用户确认，不进入 Batch 2。**
