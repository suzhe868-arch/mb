# PDM-16｜CRM / 客户画像 / 阶段 / 跟进 / 标签 / 机会 / Source Radar｜规则原子重建工作版

> 日期：2026-10-06  
> 状态：`IN_PROGRESS / STARTUP_GATE_PASS / BATCH_1_PASS / BATCH_2_PASS / BATCH_2_REVERSE_CONFLICT_SCAN_PASS / BATCH_3_PENDING_USER_REVIEW`  
> 方法：9/19 主底盘 + 前向历史补全 + 后向显式 supersession + 9/22 冻结台账 + Current Carrier Conflict Scan + Completed-PDM Authority + Cross-PDM Handoff。  
> 当前阶段约束：IA / Low-Fi / Engineering 只登记冲突，不施工；未经用户审查的候选 Atom 不得直接进入 Final。

---

## 1. 本域定位与边界

### P16-R00｜CRM 核心业务定位｜USER_APPROVED / APPLIED

用户于 2026-10-06 已确认：

> **CRM 是客户经营资料与统一跟进层，不是重新创造 Customer、Demand、Consultation、Recommendation、Lock、Transaction 状态机的地方。**

PDM-16 主要承接：

1. Customer Profile：Personal Note、Shared Profile、员工内部客户称呼历史、客户标签等客户经营资料；
2. CRM Stage：客户总体经营阶段；
3. CRM Follow-up：统一跟进记录、关联具体业务上下文但不复制业务状态机；
4. CRM Customer Detail：读取当前等级、权益、Application / Demand / Consultation / Recommendation / Lock / Transaction 等真实业务概览与历史；
5. Customer Opportunity：聚合兴趣 / 机会信号；
6. Source Radar：消费 PDM-12 Matching change fact 形成 Demand 中心的雷达事件 / 聚合 / 查询。

明确边界：

- Customer identity / phone / account lifecycle 服从 PDM-01；
- identity / permission / data scope / object state / 4S / System Admin 服从 PDM-02；
- Customer owner / historical access / responsibility 服从 PDM-03；
- Demand / Application / Customer Level / entitlement 服从 PDM-11；
- Matching / Match Result / Rule Dictionary 服从 PDM-12；
- Recommendation 服从 PDM-14；
- Consultation 服从 PDM-15；
- 公海 / 待公海 / 领取 / 指定分配 / Collaboration 完整生命周期归 PDM-17；
- Lock / Waitlist 归 PDM-18；
- Transaction / Refund 归 PDM-19；
- 客户端最终投影归 PDM-20；
- 员工工作台强待办 / 最终页面动作编排归 PDM-21；
- PC 最终后台承载归 PDM-22；
- 横向审计标准归 PDM-25。

CRM 可以聚合 / 关联其他对象，但不得反向伪造或静默改写它们的主状态、负责人、资格、权限或历史。

---

## 2. Startup Gate｜PASS

### 2.1 固定证据读取完成

已读取并交叉核对：

- `README.md`；
- `CURRENT_PROJECT_STATE.md`；
- `NEXT_ACTION.md`；
- `PROJECT_STATE.json`；
- `IMPORT_STATUS.md`；
- `00_先读/01_产品基线重建执行规范_冻结工作版.md`；
- `00_先读/02_9月19日产品全域覆盖地图_未裁决版.md`；
- 9/19 R6：CRM / 公海 / 协作中的 CRM Stage、Follow-up、Tag、访问与历史；
- 9/19 R10：CRM 客户列表/详情、聚合兴趣、客户机会、Source Radar；
- 001～078：M17-001 / M17-002、M02-004 / M02-005、M03 Source Radar 交叉差集；
- Current IA / Action / Navigation / State / Permission carrier；
- PDM-01 / PDM-02 / PDM-03 / PDM-11 / PDM-12 / PDM-15 Final；
- `CROSS_PDM_HANDOFF_REGISTER.md` 中 target=PDM-16 的全部 handoff。

### 2.2 incoming handoff｜6 / 6 ACCEPTED

以下 6 条由 `HANDOFF_OPEN` → `HANDOFF_ACCEPTED`，PDM-16 Final / Integrity closeout 前不得提前关闭：

1. `HO-P01-P16-001`：CRM 画像 / 跟进 / 员工内部客户称呼；客户昵称与员工内部备注必须分离；
2. `HO-P02-P16-001`：CRM 业务细节与访问范围必须继承统一 identity + permission + data scope + object state 模型；
3. `HO-P03-P16-001`：CRM 跟进、画像、阶段、Source Radar、公司客户历史页面/字段投影；“历史服务过”不产生永久访问权；
4. `HO-P11-P16-001`：CRM Customer 详情承载当前等级、find-car entitlement、pending Application、active/paused Demand 与历史概览；Demand 跟进使用统一 CRM follow-up + demand_id，不新建第二套 Demand 跟进表；手机号搜索与等级权限继续继承上游 Authority；
5. `HO-P12-P16-001`：Source Radar 消费 Matching change fact；不得复制第二套 Matching 规则或覆盖 PDM-12 Match Result Authority；
6. `HO-P15-P16-001`：Consultation 真实 follow-up 可进入统一 CRM 历史；普通 CRM 跟进不得自动算首次 SLA 响应，也不得反向修改 Consultation 状态、assignee 或初始来源。

### 2.3 Startup Gate 结论

- completed-PDM hard conflict：`0`；
- incoming handoff gap：`0`；
- `P16-R00 = USER_APPROVED / APPLIED`；
- Startup Gate：`PASS`；
- 允许建立 PDM-16 工作版；
- 允许进入 Batch 1 稳定一致规则审查；
- IA / Low-Fi / Engineering 继续禁止施工。

---

## 3. Startup Scan｜已发现但不能静默处理的 stale carrier / 缺口

### 3.1 Customer Merge carrier 与 PDM-01 Final 冲突

Current P06-01 / P06-M01 仍存在 Merge Flow carrier。

当前 Authority 已由 PDM-01 Final 明确：

> V1 完全取消 Customer Merge。

因此 Merge 页面 / 状态 / 合并业务迁移不得被 PDM-16 反向恢复。此项进入 Batch 2 明确废弃 / supersession 审查。

### 3.2 CRM 客户详情直接“锁车”旧入口被重新带回

9/19 R10 已明确删除：

> `CRM 客户详情 → 锁车 → 再选车辆`

锁车必须建立在合法 Customer + Vehicle 上下文与独立 Lock Authority 上。Current E03-01 / E03-06 的旧入口是 stale carrier，进入 Batch 2。

### 3.3 旧客户机会阈值不得恢复

Phase1.5 DP-01 已明确 `DO_NOT_RESTORE`：

- 7 天无活动；
- 单日浏览 >40 次；
- 连续 3 天浏览；
- 以及对应旧阈值配置。

机会模块本身保留，但旧具体阈值不再是当前 Authority。

### 3.4 历史大字段 CRM 画像不得恢复

Personal Note / Shared Profile 当前分层应保留，不恢复历史“大字段 CRM 画像模型”。

### 3.5 “历史服务过 = 永久访问权”不得恢复

公司客户历史长期存在，但读取必须基于**当前** role / permission / data scope / owner / collaboration / object state。

过去服务过不等于永久可打开当前完整 CRM。

### 3.6 E03-03“记录跟进”动作链未闭合

Current 已存在“记录跟进”入口，但 E03-03 正式 Action Contract 仍缺：

> 填写 → 提交 → 成功写入 → 历史 → 更正 / 作废

这是后续 PDM-16 必须补齐的业务动作链，不得因为 Low-Fi 有页面就视为规则已完整。

### 3.7 P06-07“客户机会规则”存在假 CRUD / config 风险

旧阈值已废弃，当前又没有新的机会规则配置 Authority。

因此不能因页面名“客户机会规则”或通用 Low-Fi 壳就自行发明 CRUD / 阈值配置。

### 3.8 Source Radar / 客户机会 / 强待办入口与语义存在 carrier 缺口

当前页面骨架存在 E01-02 / E01-03 / E01-04，但：

- 正式 Navigation 不完整；
- 客户机会 / Source Radar / 今日必须处理三类内容必须保持不同语义；
- 员工工作台最终优先级与入口编排交 PDM-21，不在 PDM-16 偷建第二套 task system。

---

## 4. Batch 1｜稳定一致规则｜PASS / USER_APPROVED / APPLIED

> 本批只收“9/19 + 历史差集 + completed-PDM Authority”方向一致、无需新产品选择的规则。  
> 用户于 2026-10-06 对 P16-A01～P16-A12 明确“全部同意”，随后明确“确认执行”；以下 12 条正式进入 PDM-16 当前工作 Authority。  
> 旧 Merge、旧锁车入口、旧机会阈值等明确 supersession 项留 Batch 2。

### P16-A01｜CRM Stage 是 Customer 总体经营阶段，不是具体业务对象状态

- Customer 可以有一个当前 CRM 总体阶段；
- CRM Stage 属于 Customer 当前经营事实，不属于某个销售个人；
- owner 变化不自动重置；
- 进入公海 / 重新领取不自动重置；
- “已成交”不得永久锁死未来阶段；
- Consultation / Demand / Lock / Transaction 等继续保留自己的状态机；
- 不得把具体业务状态压成 CRM Stage，也不得用 CRM Stage 反向改具体业务状态。

建议：**通过。**

### P16-A02｜CRM Stage mutation 服从当前责任 + permission/scope

- 当前合法 Customer owner 可维护本人客户 CRM Stage；
- 有对应 CRM 管理 permission/capability 且 data scope 覆盖的经理 / 店长可调整；
- Collaboration 身份本身不自动获得 CRM 主阶段修改权；
- 其他销售不能因历史服务过或能看到 Vehicle / Customer 就修改；
- 每次提交按 identity + permission + data scope + object state 重验。

建议：**通过。**

### P16-A03｜CRM Follow-up 长期保留、append-only，不物理删除或覆盖

每条正式 CRM 跟进至少保留：

- actor；
- time；
- content；
- 必要 business context / relation。

owner 变化、进入公海、重新领取不得删除或重置历史。

已提交错误记录：

- 可新增更正记录；
- 合法管理人员可标记无效 / 作废；
- 原始内容、actor、time 继续保留。

建议：**通过。**

### P16-A04｜统一 CRM Follow-up 可关联业务上下文，但不复制第二套业务状态机

- Demand follow-up 使用统一 CRM Follow-up，并可关联 `demand_id`；
- Consultation 真实服务动作可同时进入统一 CRM 历史并关联 Consultation；
- 不新建“Demand 专用跟进表”或“Consultation 第二套 CRM 状态机”；
- 普通 CRM Follow-up 不自动完成 Consultation first-response SLA；
- 只有满足 PDM-15“可审计真实人工服务动作”的事实才可完成 SLA；
- CRM Follow-up 不反向改 Demand / Consultation / Recommendation / Lock / Transaction 主状态。

建议：**通过。**

### P16-A05｜Personal Note、Shared Profile、员工内部客户称呼历史必须分层

#### Personal Note
- 作者私有；
- owner 变化不转移；
- 新 owner 不继承前 owner 的 Personal Note；
- 授权管理查看仅按当前 Authority。

#### Shared Profile
- 属于公司共享客户画像；
- current owner、明确 Collaboration scope 内协作人员、授权经理/店长可按当前权限维护；
- 修改保留 before / after 审计；
- 不得泄露 Personal Note。

#### 员工内部客户称呼 / 服务称呼历史
- 与客户本人昵称分离；
- 与 Personal Note、Shared Profile 分离；
- 不同员工的历史称呼不互相覆盖；
- 保留作者 / 时间 / 来源；
- owner 正式交接后，新的合法服务人员可按当前权限看到历史服务称呼并新增自己的称呼；
- 历史称呼事实存在不等于原员工永久拥有 CRM 访问权。

建议：**通过。**

### P16-A06｜Customer Tags / 共享 CRM 事实不因 owner 或公海变化自动清空

- Customer Tags 属于 Customer 共享经营事实；
- owner 变化不自动清空；
- 进入公海 / 重新领取不自动清空；
- CRM Stage、Tags、原始 source、历史 Follow-up 均保留；
- 销售个人私有备注不得冒充 Customer shared tag；
- 新 owner 可在合法权限下新增当前共享标签 / 服务事实，但不得覆盖历史来源。

建议：**通过。**

### P16-A07｜CRM Customer Detail 只聚合真实业务事实，不反向重写业务对象

CRM Customer Detail 可以消费并展示当前/历史概览，例如：

- Customer Level；
- find-car entitlement；
- pending Application；
- active / paused / completed / cancelled Demand；
- Consultation；
- Recommendation；
- Lock / Waitlist；
- Transaction / Refund；
- owner；
- tags；
- 最近 follow-up。

但：

- CRM 不复制这些对象的状态机；
- 不从“概览”直接篡改其真实状态；
- 具体 mutation 必须进入对应业务 Authority；
- Customer Merge 已被 PDM-01 Final 取消，不得借 CRM 聚合重新实现业务迁移。

建议：**通过。**

### P16-A08｜CRM 当前访问权按当前 Guard 计算，历史服务不产生永久访问权

公司 Customer 历史长期保留，但谁能看取决于**当前**：

- identity；
- permission/capability；
- data scope；
- Customer owner / valid Collaboration / manager scope；
- object/account state。

正式移交完成后，原 owner 默认不再拥有当前完整 CRM 访问；除非当前仍有合法 Collaboration 或管理范围。

4S Member 不进入名邦完整 CRM。  
System Admin 身份本身不自动获得员工 CRM 业务访问权。

建议：**通过。**

### P16-A09｜最近行为只做聚合兴趣，不建设逐点击监控

CRM 最近行为 / 兴趣允许展示必要聚合事实，例如：

- 收藏数量；
- 聚合品牌 / 车系兴趣；
- 合法业务机会摘要；
- 最近必要活跃概览。

默认不得开放：

- 每一次点击；
- 完整浏览流水；
- 完整收藏明细；
- 用行为流水形成员工可随意查看的监控轨迹。

该边界不妨碍底层依法留存必要业务/安全日志，但 CRM 默认业务投影只暴露最小必要聚合事实。

建议：**通过。**

### P16-A10｜Customer Opportunity 是聚合信号，不是独立工单/状态机

Customer Opportunity 表示当前确定性规则命中的聚合兴趣 / 业务机会。

它不是：

- Consultation；
- 独立 task；
- 独立业务主对象；
- 独立负责人对象；
- SLA 对象。

因此不建立：

- pending / closed 等复杂 lifecycle；
- 独立 owner；
- “关闭机会”主状态；
- 单独 SLA；
- 逐条主动飞书。

仍命中的机会按当前合法 Customer 服务责任投影；条件不再命中时从“当前机会”自然消失，历史/去重/冷却事实按必要审计保留。

V1 不做 AI 意向评分。

> 旧 7 天 / 40 次 / 连续 3 天具体触发器是否明确列入 DO_NOT_RESTORE，留 Batch 2 处理；本 Atom 只冻结机会对象性质。

建议：**通过。**

### P16-A11｜Source Radar 只消费 PDM-12 Matching change fact，不复制 Matching Engine

Source Radar：

- 以合法 active Demand / 当前 Customer 服务上下文为中心；
- 消费 PDM-12 产生的可追溯 Matching change fact；
- 可形成“新上架 / 关键变化 / 潜在匹配”等 Radar Event / 聚合；
- 员工可查看 Radar 上下文；
- 后续“推荐给客户”仍必须进入 PDM-14 Recommendation Authority；
- “标记不适合”只影响 Radar / 人工处理事实，不得直接伪造 PDM-12 Match Result；
- 不重新解析匹配词，不复制 Rule Dictionary，不建设第二套 Matching Engine；
- 不得覆盖 PDM-12 current Match Result。

建议：**通过。**

### P16-A12｜客户机会、Source Radar、强待办三类语义保持分离

- Customer Opportunity = 聚合客户兴趣 / 机会信号；
- Source Radar = Demand 中心的 Matching change 消费与雷达发现；
- 今日必须处理 / 紧急队列 = 具有明确服务时效/业务义务的工作台任务投影。

三类内容不得合并成同一个 task/state system。

PDM-16 冻结对象语义与数据边界；员工工作台排序、卡片、入口、强待办优先级由 PDM-21 最终承载。

建议：**通过。**

---

## 5. Batch 1 Gate｜PASS / USER_APPROVED / APPLIED

当前：

- `P16-R00 = USER_APPROVED / APPLIED`；
- `STARTUP_GATE = PASS`；
- `INCOMING_HANDOFF = 6 / 6 HANDOFF_ACCEPTED`；
- `COMPLETED_PDM_HARD_CONFLICT = 0`；
- `INCOMING_HANDOFF_GAP = 0`；
- `P16-A01～P16-A12 = PASS / USER_APPROVED / APPLIED`；
- IA / Low-Fi / Engineering 未施工。

Batch 1 Reverse Check：

- 未把 Customer Merge、旧 CRM 直接锁车入口、旧机会阈值、大字段 CRM 画像等 superseded 内容误纳入稳定项；
- 未把 PDM-17 公海/Collaboration 状态机、PDM-21 工作台强待办编排提前吸收到 PDM-16；
- 未把普通 CRM Follow-up 错当 Consultation 首次 SLA 响应；
- 未复制 PDM-12 Matching Authority。

---

## 6. Batch 2｜明确废弃 / 被替代 / DO_NOT_RESTORE｜PASS / USER_APPROVED / APPLIED

> 本批只处理已有明确后续 Authority 或显式废弃证据的旧方向，不新增新产品选择。  
> 用户于 2026-10-06 对 P16-B2-01～P16-B2-07 明确“全部同意确认执行”；以下 7 条正式进入 PDM-16 当前工作 Authority。

### P16-B2-01｜Customer Merge / P06-01 / P06-M01 不得恢复

当前 Authority 已由 PDM-01 Final 明确：

> **V1 完全取消 Customer Merge。**

因此 PDM-16 不得恢复：

- CRM 内自动 Merge；
- 人工 Merge；
- 相同手机号触发 Merge；
- “确认同一自然人”后合并；
- surviving customer_id；
- owner / source / Level / Recommendation / Consultation / Demand / Lock / Transaction / CRM history 的跨 Customer 迁移。

Current P06-01 / P06-M01 的 Merge Flow、MERGE_BLOCKED / READY / MERGING / MERGED / MERGE_HISTORICAL 等仅登记为 stale carrier，不得作为 PDM-16 当前业务能力。

建议：**通过。**

### P16-B2-02｜CRM 客户详情直接“锁车 → 再选车辆”旧入口不得恢复

旧 CRM 详情直接发起无 Vehicle 上下文锁车的路径已被后续业务模型替代。

PDM-16 CRM 快捷动作不得恢复：

> `Customer CRM → 锁车 → 再选 Vehicle`

Lock / LockRequest 必须在合法 Customer + Vehicle 上下文中进入 PDM-18 Authority。

CRM 可以展示当前 Lock / Waitlist 概览，但不得从纯 Customer CRM 页面创造第二套锁车入口或第二套 Lock 状态机。

Current E03-01 / E03-06 相关旧入口登记 stale carrier。

建议：**通过。**

### P16-B2-03｜旧 Customer Opportunity 具体阈值不得恢复

Phase1.5 DP-01 已明确 DO_NOT_RESTORE：

- 7 天无活动；
- 单日浏览 >40 次；
- 连续 3 天浏览；
- 以及仅服务这些旧规则的配置项 / 阈值控件。

PDM-16 保留“聚合客户机会”能力，但不能因为需要机会信号就把上述旧固定阈值重新带回。

如未来需要新的机会判定规则，必须另有明确产品 Authority，不得从旧阈值默认复活。

建议：**通过。**

### P16-B2-04｜历史“大字段 CRM 画像模型”不得恢复

Personal Note、Shared Profile、Customer Tags、员工内部客户称呼、CRM Follow-up、CRM Stage 必须保持明确分层。

不得恢复一个“大备注 / 大画像字段”把以下内容混在一起：

- 销售个人备注；
- 共享客户画像；
- 客户称呼；
- 标签；
- 跟进；
- Demand 说明；
- 业务状态。

尤其不得让 owner 变化时把 Personal Note 当 Shared Profile 一并转移。

建议：**通过。**

### P16-B2-05｜“历史服务过 = 永久 CRM 访问权”不得恢复

历史服务事实属于公司客户历史，可以长期保留；但访问权始终取决于当前 Authority。

不得恢复：

- 曾经是 owner 就永久可看；
- 曾记录过跟进就永久可看；
- 曾参与过 Collaboration 就永久可看；
- 离职/调岗/失去 scope 后仍凭历史关系继续查看完整 CRM。

正式访问继续服从当前 identity + permission/capability + data scope + owner/collaboration/manager scope + object/account state。

建议：**通过。**

### P16-B2-06｜P06-07 “客户机会规则”不得凭页面壳恢复未授权 CRUD / config

Current P06-07 虽存在“客户机会规则”页面名及通用 Low-Fi 壳，但没有当前 Authority 支持：

- 任意新增机会规则；
- 编辑机会阈值；
- 删除机会规则；
- 配置旧 7d / 40 / 3d；
- 创建新的未裁决机会状态机。

因此：

- 页面存在 ≠ 规则配置能力已授权；
- 通用 CRUD / config / transition 文案不得作为产品证据；
- 当前仅保留合法的机会查询 / 聚合说明 / 结果投影；
- 真正新增可配置机会规则必须以后续明确产品裁决为准。

建议：**通过。**

### P16-B2-07｜Customer Opportunity 不得恢复成独立工单/强待办/通知对象

旧机会模块若出现类似 task / owner / close / SLA / 逐条通知的实现倾向，不得恢复。

当前 Customer Opportunity：

- 不是 Consultation；
- 不是强待办；
- 不拥有独立 assignee；
- 不建 pending/processing/closed lifecycle；
- 不建 SLA；
- 不逐条自动飞书。

员工强待办继续由真实 Application / Consultation / LockRequest / Priority 等业务事实驱动，并由 PDM-21 编排。

建议：**通过。**

---

## 7. Batch 2 Gate｜PASS / USER_APPROVED / APPLIED

当前：

- `P16-A01～P16-A12 = PASS / USER_APPROVED / APPLIED`；
- `P16-B2-01～P16-B2-07 = PASS / USER_APPROVED / APPLIED`；
- 6 条 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工。

### 7.1 Batch 2 Reverse Conflict Scan｜PASS

对 PDM-01 / 02 / 03 / 11 / 12 / 14 / 15 Final、9/19 R6/R10 与 Current carrier 做反向核验：

- Customer Merge：当前明确由 PDM-01 Final 全面取消，废弃正确；
- CRM 直接锁车入口：后续已分离为 Vehicle 上下文 LockRequest/Lock，废弃正确；
- 7d / 40 / 3d Opportunity 旧阈值：Phase1.5 DP-01 明确 DO_NOT_RESTORE，废弃正确；
- 大字段 CRM 画像：已被 Personal Note / Shared Profile 等分层模型替代，废弃正确；
- 历史服务永久访问：与 PDM-02/03 当前权限模型冲突，废弃正确；
- P06-07 通用 CRUD/config：没有当前正式 Authority 支撑，不能由页面壳反推业务授权；
- Opportunity 独立工单 / SLA / assignee：与当前聚合信号定位冲突，废弃正确。

明确**没有**被误废弃的当前能力：

1. Customer Opportunity 模块本身继续保留；
2. CRM Stage / Tags / Follow-up / Shared Profile / Personal Note 继续保留；
3. 当前 owner / 合法 manager / 合法 Collaboration 仍可在权限范围内访问或维护相应 CRM 信息；
4. CRM 可以展示 Lock / Demand / Consultation 等业务概览，只是不复制其状态机；
5. Source Radar 继续保留，只是不复制 Matching Engine；
6. 合法 CRM Follow-up mutation 继续需要补齐，不因废弃旧大字段 CRM 而删除；
7. 历史 Customer 数据继续长期保留，只是访问权按当前 Guard 计算。

```text
BATCH_2_REVERSE_CONFLICT_SCAN = PASS
FALSE_DEPRECATION_COUNT = 0
```

---

## 8. Batch 3｜明确恢复 / 补齐的业务能力｜PASS / USER_APPROVED / APPLIED

> 本批只处理已经有历史业务依据、但 Current carrier 丢失或动作链不完整的能力；不处理真正需要新产品选择的冲突项。  
> 用户已对 P16-B3-01～P16-B3-06 全部同意，并随后明确“确认执行”；以下 6 条正式进入当前工作 Authority。

### P16-B3-01｜补齐 CRM Follow-up 正式 mutation 闭环

当前 E03-03 已有“记录跟进”入口，但正式 Action Contract 未闭合。

恢复完整业务链：

> 进入合法 Customer / business context → 填写跟进 → 提交 → server-side Guard 重验 → append 新 Follow-up → 成功反馈 → 时间线立即可见。

每次提交至少记录：

- customer_id；
- actor employee_id；
- occurred_at / created_at；
- follow-up content；
- 可选关联 business type / business id（如 demand_id / consultation_id）；
- 当前可追溯来源 / context。

错误记录：

- 不覆盖原文；
- 通过补充更正或合法“作废 / 无效”标记；
- 原始记录持续保留。

失败：

- 不生成半条成功记录；
- 可安全重试；
- 不因提交失败改 CRM Stage 或其他业务对象。

建议：**通过。**

### P16-B3-02｜恢复员工内部客户称呼历史的正式对象语义

员工内部客户称呼 / 服务称呼不能只是一个可被覆盖的备注字段。

至少需要支持：

- 合法员工新增自己的客户称呼；
- 保留作者；
- 保留创建时间；
- 保留来源 / 当前服务上下文；
- 后续新 owner / 当前合法服务者可以看到公司服务历史中的称呼；
- 新人新增自己的称呼，不覆盖旧称呼；
- 客户本人不可见员工内部称呼；
- 原作者失去当前 CRM 权限后，历史事实保留，但不能仅凭“这是我写的”继续打开完整 Customer。

建议：**通过。**

### P16-B3-03｜恢复 CRM 客户列表真实搜索 / 筛选 / 团队视角能力

CRM 列表至少应支持历史已明确的真实检索维度：

搜索：

- 客户姓名 / 昵称；
- 内部客户称呼 / 备注；
- 手机号（继承 PDM-01：主要手机号和其他已登记手机号均参与）；
- 找车车型关键词 / 当前 Demand 相关关键词。

筛选可包含：

- Customer Level；
- Tags；
- active Demand；
- pending Application；
- 有效 Lock / Waitlist；
- Transaction；
- 跟进状态；
- 最近活跃；
- 当前 owner。

经理 / 店长在自身合法 data scope 内使用同一 CRM，可切：

- 我的客户；
- 团队客户。

列表卡片主要展示身份摘要、Level、核心 Tags、当前核心业务状态、最近跟进、下次跟进（如有）；团队视角增加 owner。

列表卡片不堆叠大量业务 mutation 按钮。

建议：**通过。**

### P16-B3-04｜恢复 CRM Customer Detail 六区块的信息架构语义

CRM Customer Detail 继续保持历史已冻结的六类内容：

1. 基础资料；
2. 当前业务；
3. 快捷操作；
4. 跟进时间线；
5. 历史业务；
6. 最近行为 / 兴趣。

快捷操作只保留与 CRM 自身或合法跨域入口一致的动作，例如：

- 记录跟进；
- 找车服务；
- 推荐车辆。

不恢复纯 CRM “直接锁车 → 再选车辆”入口。

跨域入口只能携带当前已知 Customer 上下文进入对应 Authority，不得在 CRM 内复制对应业务状态机。

建议：**通过。**

### P16-B3-05｜恢复 Customer Opportunity 的最小聚合信号规则

Customer Opportunity 需要明确“什么能进入当前机会投影”的最低业务边界：

- 只基于当前可解释、确定性业务/行为事实形成聚合信号；
- 匿名访客不生成具名 Customer Opportunity；
- 系统 heartbeat、token refresh、后台轮询、员工代操作等不得冒充客户主动兴趣；
- 当前机会跟随当前合法 Customer 服务责任投影；
- 相同/等价信号允许去重与冷却，避免重复刷屏；
- 条件不再命中时从当前机会自然消失；
- 不逐条生成飞书通知；
- 不做 AI 意向评分。

具体新阈值或新“机会算法”不得由本条凭空发明。

建议：**通过。**

### P16-B3-06｜补齐 Source Radar 的事件消费与人工处理闭环

Source Radar 消费 PDM-12 current Matching change fact 后，可形成可追溯 Radar Event。

Radar Event 至少应保留：

- source demand / customer context；
- vehicle；
- 触发类型（新上架 / 关键事实变化 / Match 变化等真实来源）；
- 当前 PDM-12 Match Result / explanation 引用；
- created_at / latest change time；
- 当前是否仍有效。

员工可：

- 查看 Radar Event / 匹配详情；
- 从合法 Customer/Demand 上下文进入正式 Recommendation；
- 标记“本次 Radar 不适合 / 忽略”作为人工 Radar 处理事实。

“标记不适合”：

- 不得直接把 PDM-12 Match Result 改成 no_match；
- 不得修改 Rule Dictionary；
- 不得改 Demand 标准条件；
- 如需改条件，必须进入 PDM-11/12 对应正式流程。

Radar Event 因底层 current Match Result / Demand / Vehicle 失效时：

- 当前 Radar 投影可以失效 / 消失；
- 历史事件继续可追溯；
- 不因此自动创建 Recommendation / Priority / Lock。

建议：**通过。**

---

## 9. Batch 3 Gate｜PASS / USER_APPROVED / APPLIED

当前：

- `P16-B3-01～P16-B3-06 = PASS / USER_APPROVED / APPLIED`；
- 6 条 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工。

### 9.1 Batch 3 Conflict Isolation｜PASS

对 B3-01～B3-06 逐项反向检查：

- 全部可由 9/19 R6/R10、001～078 历史差集、PDM-01/02/03/11/12/15 Final 或已接收 handoff 直接支持；
- 未发现需要用户在多个产品方向之间选择、却被误伪装成“历史恢复”的条目；
- 未提前决定 CRM Stage 精确枚举/自动切换策略；
- 未提前决定 Source Radar “标记不适合”的持久抑制范围；
- 未给 Customer Opportunity 发明新的阈值或算法；
- 未抢入 PDM-17 公海治理或 PDM-21 工作台编排。

```text
BATCH_3_CONFLICT_ISOLATION = PASS
CONFLICT_OR_PRODUCT_CHOICE_MISCLASSIFIED_AS_BATCH3 = 0
```

### 9.2 Batch 3 完整性回查｜发现 2 条明确历史规则未被 B3-01～06 完整承接

这两条不是新产品选择，不进入 Batch 4；先作为 B3 Repair 候选补齐。

---

## 10. Batch 3 Completeness Repair｜PASS / USER_APPROVED / APPLIED

### P16-B3-R01｜CRM 待办 / 回访提醒 / 未来跟进计划必须随责任交接

9/19 R6 已明确存在：

- 跟进任务；
- 回访提醒；
- CRM 待办；
- 未来跟进计划。

这些属于尚未完成的 CRM 服务责任，不只是 Follow-up 历史记录。

当前规则补齐：

1. 未完成 CRM 待办 / 回访提醒 / 未来跟进计划必须有当前合法责任人；
2. Customer owner 正式变化时：
   - 可随 Customer 一并映射给新 owner；
   - 或由有权限管理人员明确重新指定其他 active + eligible 且 scope 合法的负责人；
3. 原负责人 inactive / 离职 / 失去 scope 时，未完成责任不得继续悬挂在其名下；
4. 已完成历史待办不因 owner 变化回写负责人、完成时间或历史内容；
5. 未完成责任在正式交接完成前，不得被伪装为“已完成”；
6. CRM Follow-up 历史与 CRM 待办是不同事实：
   - Follow-up = 已发生的服务记录；
   - 待办 / 回访 / 未来计划 = 尚未完成的未来责任；
7. 进入公海前如何检查、完成、取消或交接这些责任，由 PDM-17 继续承接；PDM-16 只冻结 CRM 责任事实与交接要求。

建议：**通过。**

### P16-B3-R02｜“暂不联系 / 暂无意向”只属于 CRM 阶段 / 标签事实，不自动改变 owner / 公海

9/19 R6 已明确：

- “暂不联系”；
- “暂无意向”；

只表达当前 CRM 服务判断。

当前规则补齐：

1. 可作为合法 CRM Stage / Tag / 服务判断事实；
2. 不自动结束 Customer；
3. 不自动清除 owner；
4. 不自动进入公海；
5. 不自动取消 Demand / Consultation / Recommendation / Lock / Transaction 等独立业务对象；
6. 可以成为后续“待公海处理”人工判断的上下文信号，但真正进入公海必须由 PDM-17 当前规则决定；
7. 后续客户重新产生真实需求 / 服务事实时，可由合法 actor 按当前 CRM 权限更新阶段 / 标签，不受历史“暂无意向”永久锁死。

建议：**通过。**

---

## 11. Repair Gate｜PASS / USER_APPROVED / APPLIED

当前：

- `P16-B3-01～P16-B3-06 = PASS / USER_APPROVED / APPLIED`；
- `BATCH_3_CONFLICT_ISOLATION = PASS`；
- `CONFLICT_OR_PRODUCT_CHOICE_MISCLASSIFIED_AS_BATCH3 = 0`；
- `BATCH_3_COMPLETENESS_GAP = 0`；
- `P16-B3-R01～R02 = PASS / USER_APPROVED / APPLIED`；
- Batch 4 尚未开始；
- 6 条 incoming handoff 继续 `HANDOFF_ACCEPTED`。

Repair 后复核：CRM Follow-up 与未来责任已分层；owner 变化时未完成 CRM 待办/回访/未来计划交接要求已恢复；“暂不联系/暂无意向”不自动进公海或结束其他业务；与 PDM-17 边界清晰。

`BATCH_3_COMPLETENESS_REPAIR = PASS / BATCH_3_COMPLETENESS_GAP = 0`

当前下一步：

> **执行 Batch 4 冲突 / 遗漏 / 新产品选择重建。**

---

## 12. Batch 4｜冲突 / 遗漏 / 新产品选择｜PASS / USER_APPROVED / APPLIED

> Batch 1～3 与 Repair 已关闭稳定规则、明确废弃项和历史遗漏。以下只保留“历史没有完全定死、如果不裁决开发就会自行猜”的产品选择。  
> 用户于 2026-10-06 选择 **1A、2A、3A、4A、5A**，随后明确“确认执行”；以下选择正式进入 PDM-16 当前工作 Authority。

### P16-B4-01｜CRM Stage 阶段值采用什么治理方式

历史只给出示例：

- 新客户；
- 跟进中；
- 有明确意向；
- 已成交；
- 暂无意向；
- 其他当前业务阶段。

但没有冻结“固定枚举”还是“可配置字典”。

**A｜受控可配置阶段字典（USER_APPROVED / APPLIED）**

- 后台维护一套公司级 CRM Stage 字典；
- 默认可预置上述常用阶段；
- Customer 同一时刻只有一个 current CRM Stage；
- 可新增、改名称/排序、启用、停用；
- 已被历史 Customer 使用过的阶段不得普通物理删除；
- 停用只阻止后续新选择，不改写历史阶段事实；
- 不允许销售自行输入任意自由文本冒充正式 Stage；
- 具体 PC 配置页面、permission 与审计承载交 PDM-22 / PDM-25。

**B｜固定硬编码阶段**

- V1 把阶段永久固定为一组枚举；
- 未来新增阶段必须改版本。

**C｜自由文本阶段**

- 销售可自行输入阶段名称；
- 不建设统一字典。

建议：**1A**。既保持统一统计，又避免把“其他当前业务阶段”硬编码死。

### P16-B4-02｜CRM Stage 是否允许具体业务事件自动改写

**A｜默认只允许显式人工修改，业务事件只提供上下文/建议（USER_APPROVED / APPLIED）**

- 新 Customer 可使用默认初始阶段；
- 后续 Consultation / Demand / Lock / Transaction 的创建、完成、取消等，不自动改 CRM Stage；
- 业务事实可以在 CRM 中展示，也可提示员工“建议更新阶段”；
- 真正修改仍由合法 actor 显式提交；
- 避免 Transaction completed 自动把 Customer 永久写成“已成交”等跨状态机耦合。

**B｜按业务事件自动切阶段**

例如 Consultation 创建自动“跟进中”、Transaction completed 自动“已成交”。

**C｜混合自动**

部分事件自动切换，其余人工维护；需继续定义完整事件→阶段映射表。

建议：**2A**。与 P16-A01“总体阶段与具体业务状态分离”最一致。

### P16-B4-03｜Customer Tags 采用什么模型

**A｜公司级受控 Tag 字典 + Customer 多选（USER_APPROVED / APPLIED）**

- 共享 Customer Tags 从统一字典选择；
- 一个 Customer 可有多个 active Tag；
- Tag 可新增、改名/排序、启停；
- 已进入历史的 Tag 不普通物理删除；
- Tag 停用不抹掉历史 Customer Tag 事实；
- 销售自由文本继续放 Personal Note / 服务称呼等对应区域，不冒充共享 Tag；
- “重点客户”等可以作为普通共享 Tag，而不是额外制造第二套重点客户状态机。

**B｜完全自由文本 Tag**

每个员工可直接输入任意共享标签。

**C｜固定硬编码 Tag**

只能使用版本内预置标签，后台不可扩展。

建议：**3A**。

### P16-B4-04｜旧机会阈值废弃后，Customer Opportunity 的规则来源怎么办

当前已经明确：

- 保留 Customer Opportunity 模块；
- 旧 7 天 / 40 次 / 连续 3 天规则不得恢复；
- 不允许 P06-07 页面壳自行发明 CRUD/config。

仍需决定是否在 V1 新建一套“可配置机会规则引擎”。

**A｜V1 不新建通用机会规则引擎（USER_APPROVED / APPLIED）**

- Customer Opportunity 只消费未来已经被产品明确批准的 deterministic signal producer；
- 没有正式 signal producer 时允许真实空态；
- P06-07 在 V1 只承担机会说明 / 查询 / 当前信号来源查看，不提供任意规则 CRUD；
- 未来如要新增某类机会信号或阈值，单独走产品裁决；
- 不用 AI 意向评分补空缺。

**B｜V1 立即建设后台可配置机会规则引擎**

允许有权限人员配置行为条件、阈值、冷却、组合逻辑等。

建议：**4A**。否则等于刚废弃旧阈值，又未经裁决造一套新的规则平台。

### P16-B4-05｜Source Radar“标记不适合”到底屏蔽多久

**A｜抑制当前 Demand × Vehicle 当前事实；相关 Matching 输入发生实质变化后可重新出现（USER_APPROVED / APPLIED）**

标记不适合后：

- 不改变 PDM-12 Match Result；
- 当前 Demand × Vehicle 在相同有效匹配事实下不重复刷 Radar；
- 若 Vehicle 关键事实、价格、Demand 条件、Rule Dictionary、Match tier/explanation 或 listing_cycle 等发生会触发 PDM-12 合法重算的实质变化，可生成新的 Radar Event；
- 历史“不适合”处理记录保留。

**B｜只关闭当前 Radar Event**

同一 Demand × Vehicle 即使底层事实完全没变，下次系统刷新也可以重新出现。

**C｜永久黑名单**

一旦标记不适合，同 Demand × Vehicle 永远不再出现，除非员工手工解除。

建议：**5A**。可避免重复骚扰员工，同时不会把一次人工判断变成永久覆盖 Matching Authority。

---

## 13. Batch 4 Gate｜PASS / USER_APPROVED / APPLIED

用户裁决：

> **1A、2A、3A、4A、5A**

正式结果：

- `P16-B4-01 = 1A / USER_APPROVED / APPLIED`；
- `P16-B4-02 = 2A / USER_APPROVED / APPLIED`；
- `P16-B4-03 = 3A / USER_APPROVED / APPLIED`；
- `P16-B4-04 = 4A / USER_APPROVED / APPLIED`；
- `P16-B4-05 = 5A / USER_APPROVED / APPLIED`；
- `PDM16_LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`；
- 6 条 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工。

### 13.1 Batch 4 Cross-PDM Conflict Review｜PASS

逐项反向检查结果：

1. **CRM Stage 可配置字典**：只决定 PDM-16 业务语义；具体后台页面、配置 permission 与审计 carrier 延后 PDM-22 / PDM-25，不与 PDM-02 权限模型冲突；
2. **CRM Stage 不由具体业务自动改写**：与 P16-A01 以及 PDM-11/15 的 Demand / Consultation 独立状态机一致；
3. **Customer Tags 统一字典 + 多选**：不覆盖 Personal Note / Shared Profile / 员工内部称呼三层边界；
4. **V1 不建设通用 Opportunity 规则引擎**：与 Batch 2 已废弃旧阈值、P16-A10/B3-05 的聚合信号定位一致；
5. **Radar 不适合仅抑制当前有效事实**：不修改 PDM-12 Match Result / Rule Dictionary / Demand 条件；底层匹配事实实质变化后可产生新 Radar Event。

```text
BATCH_4_CROSS_PDM_CONFLICT_REVIEW = PASS
PDM16_LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0
```

当前唯一下一步：

> **进入 PDM-16 Final 前完整性复核：Source→Atom、Atom→Source、Semantic Completeness、Cross-PDM / Handoff / Global Invariant。**

---

## 14. Final 前完整性复核 R1｜REPAIR_REQUIRED

报告：

> `07_重建工作区/PDM-16_Final前完整性复核_R1_2026-10-06.md`

结果：

- `SOURCE_TO_ATOM = FAIL_REPAIRABLE`；
- `ATOM_TO_SOURCE = PASS`；
- `SEMANTIC_COMPLETENESS = FAIL_REPAIRABLE`；
- `MISSING_RULE_UNRESOLVED = 1`；
- `SEMANTIC_DETAIL_GAP_UNRESOLVED = 1`；
- `COMPLETED_PDM_INVARIANT_CONFLICT = 0`；
- `INCOMING_HANDOFF_GAP = 0`；
- `OUTGOING_HANDOFF_GAP = 1 group`；
- `PDM16_LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`；
- `PDM16_FINAL_CANDIDATE_READY = NO`。

### P16-LIA-01｜CRM 核心 mutation audit｜PASS / USER_APPROVED / APPLIED

补齐：

- CRM Stage before / after / actor / changed_at；
- 重要 Customer Tag 新增/移除/替换的可追溯变化事实；
- Shared Profile 继续 before / after；
- 服务称呼修改不得覆盖旧值，保留 author / 时间 / 来源 / 修改历史；
- Follow-up 继续 append-only；
- 不把所有普通字段一律升级为重型审计。

建议：**通过。**

### P16-LIA-02｜Customer Address 搜索 / 卡片投影｜PASS / USER_APPROVED / APPLIED

补齐 R10-15 已明确但当前漏掉的 Customer Address：

- 合法地址字段存在时参与 CRM list search；
- 客户卡片可展示必要地址 / internal note 摘要；
- 不新建地址采集流程，只消费合法 Customer Profile 已有事实；
- 展示与搜索继续服从 permission + data scope；
- internal note 继续服从 Personal Note / Shared Profile / 服务称呼分层。

建议：**通过。**

### P16-LIA-03｜PDM-16 outgoing handoff 完整登记｜PASS / USER_APPROVED / APPLIED

待登记：

- `HO-P16-P17-001`；
- `HO-P16-P21-001`；
- `HO-P16-P22-001`；
- `HO-P16-P23-001`；
- `HO-P16-P25-001`。

全部先以 `HANDOFF_OPEN` 建立；不得替目标 PDM 提前裁其页面/通知/公海/审计实现。

建议：**通过。**

当前唯一下一步：

> **P16-LIA-01～P16-LIA-03 已由用户全部同意并确认执行；修复已进入当前工作 Authority。当前执行 Final 前完整性复核 R2。**

### 14.1 LIA-01 执行结果｜CRM 核心 mutation audit

正式规则：

1. CRM Stage 每次修改必须保留：
   - before；
   - after；
   - actor；
   - changed_at；
   - 必要 source/context。
2. 重要 Customer Tag 的新增、移除、替换必须保留 before/after 或等价可追溯变化事实，并至少记录 actor、changed_at。
3. Shared Profile 继续按 P16-A05 执行 before/after 审计。
4. 员工内部服务称呼：
   - 不允许原地覆盖后丢失旧值；
   - 新增或修改都必须保留 author、时间、来源和修改历史；
   - 历史称呼不得因 owner 变化、员工离职或当前访问权消失而被物理删除。
5. CRM Follow-up 继续 append-only：
   - 更正、作废、无效均形成新事实或状态标记；
   - 不把 Follow-up 改成普通可覆盖字段。
6. 本条只覆盖 CRM 核心经营事实；普通日常非核心字段不因此一律升级为重型审计。

### 14.2 LIA-02 执行结果｜Customer Address 搜索 / 卡片投影

正式规则：

1. CRM Customer list 在合法 Customer Address 字段存在时支持地址关键词搜索；
2. Customer 卡片可展示必要的 Customer Address / internal note 摘要；
3. PDM-16 不新建地址采集流程：
   - 只消费当前合法 Customer Profile 中已经存在的地址事实；
   - 不存在地址时不得为了满足列表展示而虚构默认地址；
4. 搜索命中和字段返回都继续服从：
   - identity；
   - permission/capability；
   - data scope；
   - object/account state；
5. 地址搜索能力不得扩大地址字段可见范围；
6. internal note 继续按 Personal Note / Shared Profile / 员工内部服务称呼既有分层，不恢复“大备注”模型。

### 14.3 LIA-03 执行结果｜Outgoing Handoff

PDM-16 正式向以下未来域移交：

- `HO-P16-P17-001`；
- `HO-P16-P21-001`；
- `HO-P16-P22-001`；
- `HO-P16-P23-001`；
- `HO-P16-P25-001`。

全部保持 `HANDOFF_OPEN`，由目标 PDM Startup Gate 接收；PDM-16 不提前替目标域施工 UI / notification / public-pool / audit carrier。
