# PDM-15｜Consultation / 咨询生命周期 / 来源 / 负责人 / 转派 / SLA｜规则原子重建工作版

> 日期：2026-10-06  
> 状态：`IN_PROGRESS / START_GATE_PASS / BATCH_1_PASS_USER_APPROVED / BATCH_2_PASS_USER_APPROVED / BATCH_3_PASS_USER_APPROVED / BATCH_3_CONFLICT_ISOLATION_PASS / BATCH_4_PASS_USER_APPROVED / PREFINAL_INTEGRITY_AUDIT`  
> 方法：9/19 主底盘 + 前向历史补全 + 后向显式 supersession + 9/22 冻结台账 + Current Carrier Conflict Scan + Completed-PDM Authority + Cross-PDM Handoff。  
> 当前阶段约束：IA / Low-Fi / Engineering 只登记冲突，不施工；未经用户审查的候选 Atom 不得直接进入 Final。

---

## 1. 本域定位与边界

### P15-R00｜Consultation 核心业务定位｜USER_APPROVED / APPLIED

用户于 2026-10-06 已确认本域指向：

> **Consultation = 客户正式咨询工单。**

它承接：

> 客户对某一台 Vehicle 明确发起“咨询” → 形成正式服务记录 → 确定合法负责人 → 真人跟进 → 合法结束。

明确边界：

- Consultation 不等于 Customer owner；
- Consultation 不等于 Recommendation；
- Consultation 不等于 Lock / LockRequest；
- Consultation 不等于 Transaction；
- 对其他对象只保存必要真实关联，不因关联自动互相改写主状态；
- 本域负责 Consultation 自身 lifecycle、来源、负责人、转派、SLA、幂等、终态与历史；
- Recommendation、Lock、Transaction、CRM、通知等完整状态机仍分别服从对应 PDM Authority。

---

## 2. Startup Gate｜PASS

### 2.1 固定证据读取完成

已读取并交叉核对：

- `00_先读/02_9月19日产品全域覆盖地图_未裁决版.md`；
- 9/19 R7：Consultation 对象、生命周期、来源、幂等、负责人、转派；
- 9/19 R12：Consultation 后台状态、SLA、通知边界；
- 001～078：M06 / M16 / M17 Consultation、CTA、SLA 与工作台相关历史差集；
- 9/22 冻结台账：客户端“咨询”、员工 E06、P06、P09 SLA / 通知相关裁决；
- Current IA / Low-Fi：仅作为当前承载事实与 stale carrier 检查，不得覆盖完成 PDM；
- PDM-01 / PDM-02 / PDM-03 / PDM-07 / PDM-14 Final；
- `CROSS_PDM_HANDOFF_REGISTER.md` 中 target=PDM-15 的 5 条 incoming handoff。

### 2.2 incoming handoff｜5 / 5 ACCEPTED

以下 5 条由 `HANDOFF_OPEN` → `HANDOFF_ACCEPTED`，在 PDM-15 Final / Integrity closeout 前不得提前关闭：

1. `HO-P01-P15-001`：Customer 停用不得抹除既有 Consultation 历史；
2. `HO-P02-P15-001`：负责人 / 转派必须继承 identity + permission + data scope + object state；
3. `HO-P03-P15-001`：Consultation 负责人独立于 Customer owner；owner 变化不自动漂移既有 Consultation 负责人；
4. `HO-P07-P15-001`：车辆档案不完整本身不得阻止 Consultation；
5. `HO-P14-P15-001`：Recommendation 与 Consultation 独立；双方不得自动创建、结束、抢写负责人、改写来源或传播价格/可见性权利。

### 2.3 Startup Gate 结论

- completed-PDM hard conflict：`0`；
- incoming handoff gap：`0`；
- Startup Gate：`PASS`；
- PDM-15 工作版允许建立；
- 允许进入 Batch 1；
- IA / Low-Fi / Engineering 继续禁止施工。

---

## 3. Startup Scan｜已发现但尚未裁决的重点问题

以下问题已登记，不能在 Batch 1 中静默裁掉：

1. **主状态冲突**：9/19 R7 / R12 为 `pending / processing / resolved / invalid` 四状态；Current IA / Low-Fi 另出现 `CANCELLED`。需后续明确“第五主状态”还是“resolved 的结束原因”。
2. **SLA 完成语义被压缩**：历史规则明确 SLA 只在“第一次真实人工服务动作”后完成；仅打开页面、阅读、改状态、转派、浏览资料、系统自动动作均不算，且转派不得重置 SLA。Current 承载未完整表达。
3. **负责人术语污染**：Current E06-M01 使用 owner 文案描述 Consultation 转派，容易把 Customer owner 与 Consultation assignee 混为同一对象。
4. **Customer 停用后的运行态**：PDM-01 已要求历史不得抹除、进行中业务不得假装正常继续，但 Consultation 具体冻结 / SLA / 恢复行为仍需本域裁决。
5. **Transaction 与 Consultation 负向边界**：历史差集指出“成交完成不得自动强制 Consultation resolved”需要本域明确。
6. **工作台 SLA 排序**：历史存在“已超时 > 临近超时 > 新咨询”强任务优先级，需要判断属于 PDM-15 业务语义还是移交 PDM-21 员工端承载。
7. **负责人优先级 / 异常兜底**：Recommendation 来源、Demand responsible、Customer owner、接客池之间的精确优先顺序，以及 owner_assignment_pending / 无合法负责人时是否允许建单，需要正式裁决。

---

## 4. Batch 1｜稳定一致规则｜PASS / USER_APPROVED

> 用户已于 2026-10-06 对 P15-A01～P15-A08 明确“全部同意”，随后明确“确定执行”。以下 8 条正式进入 PDM-15 当前工作 Authority；后续批次不得静默反向改写。

### P15-A01｜显式咨询动作才创建 / 复用 Consultation

- 客户在合法 Vehicle 上执行“咨询”是真正的 Consultation 入口；
- 单纯浏览、收藏、普通分享、Recommendation 创建本身均不得自动创建 Consultation；
- 手机号等人工服务门槛继续服从 PDM-01 已冻结规则；
- 取消手机号授权流程时不产生 Consultation。

### P15-A02｜初始真实来源不可被后续行为覆盖

Consultation 创建时记录真实 direct source / source relation。

- 后续 Recommendation、普通分享、搜索、收藏、再次进入详情不得改写初始真实来源；
- 若真实来源是 Recommendation，只保存真实关联；
- Recommendation 后续 end / void 不回写 Consultation 来源事实。

### P15-A03｜同 Customer + Vehicle + listing_cycle 的未终结 Consultation 幂等

同一：

> `customer_id + vehicle_id + listing_cycle`

已有未终结 Consultation 时：

- 不重复创建第二条未终结 Consultation；
- 再次咨询复用原对象并记录新的 interaction / touch；
- 原 Consultation 已进入合法终态后，之后再次真实咨询可新建；
- Vehicle 进入新 listing_cycle 后，旧 Consultation 不跨周期复用。

> “合法终态的精确枚举”留到状态机裁决，不在本 Atom 预判 CANCELLED 是否为主状态。

### P15-A04｜Vehicle lifecycle 与 Consultation 分层

- `offline / unavailable` 后不得新建该周期 Consultation；
- 已合法存在的未终结 Consultation 不因 Vehicle 后来下架而被系统直接删除或伪造终态，仍需按合法业务动作收口；
- `hidden` 不等于 `offline`；只要 Vehicle 仍真实可售且 Customer 当前拥有合法访问入口，hidden 本身不自动禁止 Consultation；
- 新 listing_cycle 不继承旧周期 Consultation。

### P15-A05｜Consultation 负责人独立于 Customer owner

- Customer owner 与 Consultation 当前负责人是两个不同字段 / 责任对象；
- Customer owner 变化不得自动漂移已固化的 Consultation 负责人；
- 若 Consultation 需要换负责人，必须走正式 Consultation reassignment / handover；
- 转派至少保留旧负责人、新负责人、操作者、时间与原因/上下文审计；
- 负责人变更本身不得反向修改 Customer owner。

### P15-A06｜Consultation 与 Recommendation 双向独立

- Recommendation end / void 不自动结束 Consultation；
- 已有未终结 Consultation 时，后来 Recommendation 不新建第二条 Consultation、不抢写负责人、不改写初始来源；
- Consultation 不自动创建 Recommendation；
- Consultation 不授 Recommendation 免费 price-right；
- Consultation 不授 hidden Vehicle visibility grant；
- Consultation 进入任何合法终态，也不自动 end / void 仍合法的 Recommendation。

### P15-A07｜档案不完整不是 Consultation 阻断条件

- 车辆档案、检测报告、维保资料不完整，本身不得阻止客户发起 Consultation；
- Consultation 只负责服务沟通，不把“档案是否完整”升级为车辆可售性事实；
- 真正 `offline / unavailable` 仍按 Vehicle Authority 阻断新增 Consultation。

### P15-A08｜4S Member 不进入名邦 Consultation 处理链

- 4S Member 身份本身不获得名邦 Consultation 的查看、领取、处理、转派或终结能力；
- 4S source Vehicle 是否可被客户咨询，取决于 Vehicle 当前合法可售 / 可访问事实；
- 一旦形成名邦 Consultation，其负责人和处理链属于名邦侧合法 Employee 业务责任体系；
- 不因 source_type=4S 把 Consultation 直接转交给 4S Member。

---

## 5. Batch 1 Gate｜PASS

- `P15-R00 = USER_APPROVED / APPLIED`；
- `P15-A01～P15-A08 = PASS / USER_APPROVED / APPLIED`；
- Batch 1 不包含状态机 CANCELLED 冲突、SLA 精确完成语义、负责人优先级、Customer 停用运行态等产品选择；
- 5 条 incoming handoff 继续 `HANDOFF_ACCEPTED`，不得提前关闭；
- IA / Low-Fi / Engineering 继续禁止施工。

---

## 6. Batch 2｜明确废弃 / 被替代 / 不得恢复｜PASS / USER_APPROVED

> 用户已对 P15-B2-01～P15-B2-05 明确“全部同意”，并以“启动执行 / 确认执行”指令正式执行。本批只处理已有明确后续 Authority 或显式废弃证据的旧口径。

### P15-B2-01｜旧“我要这辆车”统一语义不得恢复

旧客户端“我要这辆车”把沟通意向、咨询、锁车意向混在同一入口的语义已经被后续规则替代。

当前必须分离：

- 沟通车辆 → `Consultation / 咨询`；
- 锁车 → `LockRequest / Lock` 独立业务链；
- Recommendation 也不得由该按钮自动创建。

不得恢复旧的单按钮统一状态机。

### P15-B2-02｜Consultation timeout 不得恢复成主状态或自动终态

旧/中间承载中把“超时”当 Consultation 第五主状态、或超时后自动关闭 Consultation 的方向不得恢复。

当前边界：

- SLA timeout 是派生事实 / 过滤 / 提醒条件；
- timeout 本身不改变 Consultation 主状态；
- timeout 不自动 `resolved / invalid / cancelled`；
- SLA 提醒与通知失败也不得反向改写 Consultation 业务状态。

> `CANCELLED` 是否为合法主状态仍留到后续冲突裁决，本 Atom 不预判。

### P15-B2-03｜Customer Merge 及 Consultation 迁移不得恢复

继承 PDM-01 / PDM-14：

- V1 不提供 Customer Merge；
- 不存在把两个 customer_id 的 Consultation 合并、搬迁到“存活客户”或自动重写 customer_id；
- 相同自然人、相同手机号或重复客户提示均不得触发 Consultation 迁移；
- 真实历史继续保留在原 customer_id 下。

### P15-B2-04｜不得把 Consultation assignee 与 Customer owner 合成同一字段

任何旧/Current carrier 若用 `owner` 泛称 Consultation 当前负责人，均不得解释成：

- Customer owner 就是 Consultation assignee；
- Customer owner 一变化，Consultation 负责人自动跟着变化；
- Consultation reassignment 等于 Customer owner transfer。

当前必须保持两个业务责任对象分离；页面/字段命名后续统一对齐。

### P15-B2-05｜Recommendation 不得作为 Consultation 生命周期函数

任何把 Recommendation create/end/void 当成 Consultation 自动 create/end/reassign/source rewrite 触发器的旧口径不得恢复。

当前以 P15-A06 + PDM-14 Final 为准：

- 两对象独立；
- 只保留真实 source relation；
- 不互相自动创建、结束、抢写负责人或改写历史来源。

---

## 7. Batch 2 Gate｜PASS

- `P15-B2-01～P15-B2-05 = PASS / USER_APPROVED / APPLIED`；
- Reverse Conflict Scan = `PASS`；
- `FALSE_DEPRECATION_COUNT = 0`；
- 5 条 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 继续禁止施工。

### 7.1 Reverse Conflict Scan｜明确没有被误废弃的现行能力

以下能力继续保留，不得因为 Batch 2 被错误删除：

1. Customer 对本人 open Consultation 的“撤回 / 正常结束”业务动作继续存在；只是 `CANCELLED` 是否为第五主状态尚未裁决；
2. Consultation SLA 继续存在，timeout 继续可作为派生超时标记 / 筛选 / 提醒条件；
3. 正式 Consultation reassignment / handover 继续存在；
4. 客户详情 CTA 继续按真实业务状态驱动，只是不恢复旧“我要这辆车”统一入口；
5. 若 Consultation 的真实来源是 Recommendation，真实 source relation 继续保留，只是不绑定生命周期；
6. Customer owner 继续是独立 CRM 责任事实；本批只禁止把它和 Consultation assignee 合成同一字段。

### 7.2 Batch 2 stale carrier 登记

- `OLD_WANT_THIS_CAR_UNIFIED_INTENT`；
- `CONSULTATION_TIMEOUT_AS_FIFTH_MASTER_STATE_OR_AUTO_CLOSE`；
- `CUSTOMER_MERGE_AND_CONSULTATION_MIGRATION`；
- `CONSULTATION_ASSIGNEE_NAMED_AS_CUSTOMER_OWNER`；
- `RECOMMENDATION_LIFECYCLE_DRIVES_CONSULTATION`。

---

## 8. Batch 3｜知情修改 / 显式新增｜PASS / USER_APPROVED / APPLIED

> 用户于 2026-10-06 对 P15-B3-01～P15-B3-04 明确“全部同意确认执行”。本批只收 9/19 之后已经明确出现、且不需要重新做产品取舍的新增动作/承载语义。凡涉及主状态定义、SLA 完成条件、负责人优先级、Customer 停用运行态等真实产品选择，一律留到 Batch 4。

### P15-B3-01｜Customer 可主动撤回本人未终结 Consultation

后续 Current 已显式增加客户侧“撤回咨询”真人动作：

- 仅当前 Customer 自己的同一条未终结 Consultation 可撤回；
- 提交时重新校验 identity + Consultation 仍为 open；
- 撤回属于正常结束，不得记为 `invalid`；
- 保留 Consultation 历史，不物理删除；
- 撤回不改变 Customer owner、Recommendation、Vehicle、Lock / Transaction 等其他对象。

> **本 Atom 只确认“撤回动作存在且不是 invalid”；撤回最终落到 `CANCELLED` 主状态，还是 `resolved + close_reason`，留 Batch 4 裁决。**

### P15-B3-02｜员工侧显式增加“记录真实跟进”动作

后续 E06 / P06-11 已把“记录真实跟进”作为 Consultation 的正式真人动作：

- Consultation 必须仍为 open；
- actor 必须通过当前责任关系 + identity + permission + data scope + object state 重验；
- 提交后追加真实 follow-up / 沟通事实；
- 不改变 Customer owner；
- 不改写 Consultation 初始来源；
- 不因记录一次跟进就自动结束 Consultation。

> **该动作是否构成 SLA 的“第一次真实人工服务动作”，留 Batch 4 与 SLA 完成条件一起裁决。**

### P15-B3-03｜员工侧显式区分“解决 / 无效 / 正常关闭”

后续 E06 / P06-11 明确存在三种不同真人结束语义：

- **解决**：业务已正常解决；
- **无效**：误触、重复、明显无效等无效咨询；
- **正常关闭**：客户不再咨询或业务正常结束，但不应被记成 invalid。

共同要求：

- 操作前重验当前责任 / permission / data scope / object state；
- 终结不物理删除历史；
- 不反向修改 Customer owner；
- 不自动改写 Recommendation / Lock / Transaction 等独立对象。

> **“正常关闭”最终对应 `CANCELLED` 还是 `resolved + close_reason` 继续留 Batch 4。**

### P15-B3-04｜Consultation 消费有效 SLA 配置，并在创建时固化本次 deadline

后续 9/22 / R12 已明确 SLA 配置能力进一步细化：

- 系统存在全局 SLA，并可按业务类型配置覆盖值；
- Consultation 创建时读取当时有效的 SLA 配置并固化本次 first-response deadline；
- 后续修改默认 / 覆盖配置，不追改已经创建的 Consultation deadline；
- SLA timeout 与提醒仍是派生能力，不改变 Consultation 主状态；
- 首次提醒与重复提醒、群通告、聚合窗口、quiet hours、FAILED/SKIPPED/DEDUPED 等通知投递细节由 PDM-23 / PDM-22 承接，不在本 Atom 重建通知状态机。

> **历史默认 15 分钟是否恢复为当前初始默认值，以及“什么事件才算首次真实响应”，留 Batch 4 裁决。**

---

## 9. Batch 3 Gate｜PASS / USER_APPROVED / APPLIED

- `P15-A01～P15-A08 = PASS / USER_APPROVED / APPLIED`；
- `P15-B2-01～P15-B2-05 = PASS / USER_APPROVED / APPLIED`；
- Batch 2 Reverse Conflict Scan = `PASS / FALSE_DEPRECATION_COUNT=0`；
- `P15-B3-01～P15-B3-04 = PASS / USER_APPROVED / APPLIED`；
- 用户确认时间：2026-10-06；
- Batch 3 Conflict Isolation = `PASS`；
- `CONFLICT_OR_PRODUCT_CHOICE_MISCLASSIFIED_AS_BATCH3 = 0`；
- 复核 PDM-01 / 02 / 03 / 14 Final 后，未发现 Batch 3 四项静默改写 Customer owner、统一 permission/data scope、Recommendation 生命周期或其他对象主状态；
- `CANCELLED` 主状态、SLA 首次真实人工动作、历史默认 15 分钟、负责人优先级、Customer 停用运行态、Transaction 负向边界继续保留 Batch 4；
- IA / Low-Fi / Engineering 继续禁止施工。

---

## 10. Batch 4｜冲突 / 遗漏 / 缺口 / 新产品选择｜PASS / USER_APPROVED / APPLIED

> 用户于 2026-10-06 选择并确认执行：`1A、2A、3A、4A、5A、6A、7A`。以下以所选方案为当前 PDM-15 Authority，未选方案不得恢复。

### P15-B4-01｜Consultation 是否新增 `CANCELLED` 第五主状态

证据冲突：

- 9/19 R7 正式主状态为 `pending / processing / resolved / invalid`；
- 客户撤回属于正常结束，不是 `invalid`；
- 后续 Current / Low-Fi 又把 `CANCELLED` 用作客户撤回 / 正常关闭的投影。

候选：

- **1A（建议）**：继续保持四主状态。客户撤回、员工“正常关闭”统一进入 `resolved`，同时用不可变 `close_reason` 区分 `CUSTOMER_WITHDRAWN / NORMAL_CLOSED / RESOLVED` 等真实结束原因；界面可按 reason 显示“已取消 / 已关闭 / 已解决”，但不增加第五主状态。
- **1B**：正式增加 `CANCELLED` 为第五主状态；客户撤回 / 正常关闭进入 `CANCELLED`，`resolved` 只用于已解决。

**用户裁决：1A。** 当前仅保留 `pending / processing / resolved / invalid` 四主状态；客户撤回、正常关闭、正常解决统一属于 `resolved`，以不可变 `close_reason` 区分真实结束原因。`CANCELLED` 只可作为旧 Carrier / UI 投影语义，不得恢复为 Consultation 第五主状态。

### P15-B4-02｜首次响应 SLA 的完成条件

历史 DEC-018 明确：SLA 从 Consultation 创建开始，到“第一次真实人工服务动作”才算首次响应完成；打开页面、已读、仅改状态、仅转派、浏览资料、系统自动动作均不算，转派也不得重置 deadline。Current 丢失了这组精确语义。

候选：

- **2A（建议）**：恢复该规则。只有可审计的真实服务动作才完成首次响应，例如真实跟进记录、真实电话/消息/线下沟通等已形成业务事实的动作；仅打开、已读、改成 processing、转派、浏览资料、自动动作均不算；转派沿用原 deadline，不重置。
- **2B**：进入 processing 或员工首次打开/处理页面即可视为首次响应完成。

**用户裁决：2A。** 只有形成可审计真实服务事实的人工动作才完成首次响应 SLA；打开、已读、仅改状态、仅转派、浏览资料、系统自动动作均不算。转派不得完成或重置 SLA，继续沿用原 deadline。

### P15-B4-03｜Consultation SLA 初始默认值

9/19 R12 明确“首次人工响应 SLA 默认 15 分钟，后台可配置”；Current 只保留可配置与 deadline，默认值丢失。

候选：

- **3A（建议）**：恢复 **15 分钟**作为初始默认值；后台可配置，创建时按当时有效配置固化 deadline，之后改配置不追改旧 Consultation。
- **3B**：产品基线不提供默认值，部署前必须由后台人工配置后才能启用 SLA。

**用户裁决：3A。** Consultation 首次人工响应 SLA 初始默认值为 **15 分钟**；后台可配置；创建时按当时有效配置固化本次 deadline，后续修改不追改已创建 Consultation。

### P15-B4-04｜Consultation 初始负责人优先级与无人可承接失败出口

历史 R7 顺序是“来源 Recommendation 推荐销售 → Demand 负责人 → Customer owner → 合格接客池”，但旧规则同时假设“Recommendation 只能由当时 owner 创建”，该前提已被 PDM-14 当前 Authority 改写；PDM-02/03 又明确禁止无负责人正式业务对象和 System Admin 业务兜底。

候选：

- **4A（建议）**：若本次咨询真实来源于 Recommendation，仅当该 Recommendation 的 recommender 在咨询创建时仍是该 Customer / Demand 的**当前合法业务责任关系**且 identity + permission + data scope + object state 合法时才优先承接；否则跳过历史 recommender。之后依次为当前关联 Demand responsible → 当前 Customer owner → active + eligible + accepting 合格接客池。全部不可用时不得创建 `responsible=null` 的正式 Consultation，返回安全失败 / 待恢复提示并记录配置异常。
- **4B**：只要历史 recommender 仍 active 且具备 Consultation 处理资格，即使已不再承担该 Customer / Demand 当前业务责任，也继续拥有第一优先级。

**用户裁决：4A。** 初始负责人必须按咨询创建时的当前合法责任事实确定：真实来源 Recommendation 的 recommender 只有在当时仍具当前合法业务责任关系且 Guard 全部通过时才优先；否则跳过。之后依次为当前关联 Demand responsible → 当前 Customer owner → active + eligible + accepting 合格接客池。全部不可用时禁止创建 `responsible=null` 正式 Consultation，禁止 System Admin 业务兜底，并形成安全失败 / 配置异常事实。

### P15-B4-05｜Customer 停用期间 Consultation 如何运行

PDM-01 Final 已冻结：Customer 停用不删除历史、不伪造 completed/cancelled，但进行中客户业务也不得继续按“账号正常”推进；恢复账号也不得自动恢复各业务对象运行状态。Consultation 具体运行态仍未定义。

候选：

- **5A（建议）**：不新增 Consultation 主状态，增加独立运行 Guard：Customer 停用后，既有 open Consultation 历史和负责人事实保留，进入 `customer_disabled_hold`；暂停普通客户侧动作和常规服务推进，并暂停尚未完成的首次响应 SLA 计时；必要的受权终结 / 作废 / 交接动作仍可用于真实收口。Customer 恢复后不自动解除 hold，由合法员工显式恢复并重新校验；未完成 SLA 按停用前剩余时间继续。
- **5B**：Customer 停用只禁止客户侧新动作，员工仍可按正常 Consultation 流程继续处理，SLA 继续计时。
- **5C**：Customer 一停用就自动结束 / 取消全部未终结 Consultation。

> 5C 与 PDM-01“停用不得伪造业务终态”的当前 Authority 冲突，不建议选择。

**用户裁决：5A。** Customer 停用不新增 Consultation 主状态；既有 open Consultation 进入独立 `customer_disabled_hold` 运行 Guard，保留历史与负责人事实，暂停普通客户侧动作、常规服务推进以及尚未完成的首次响应 SLA 计时。必要的合法终结 / 作废 / 交接仍可用于真实收口。Customer 恢复后不自动解除 hold，由合法员工显式恢复并重新校验；未完成 SLA 按停用前剩余时间继续。

### P15-B4-06｜Transaction 完成是否自动结束 Consultation

历史反向差集明确：Transaction completed 不应自动把 Consultation 强制 `resolved`；Current 缺少足够显式的跨对象负向 Guard。

候选：

- **6A（建议）**：Transaction completed / cancelled / corrected 均不自动修改 Consultation 主状态；成交事实只作为 Consultation 可引用的业务上下文。若咨询确实应结束，仍由合法真人执行“解决 / 正常关闭”等 Consultation 自身动作并留痕。
- **6B**：Transaction completed 自动把同 Customer + Vehicle 当前 Consultation 标记为 resolved。

**用户裁决：6A。** Transaction completed / cancelled / corrected 均不得自动修改 Consultation 主状态；交易事实只作为 Consultation 可引用上下文。Consultation 是否解决/正常关闭必须由其自身合法真人动作形成并留痕。

### P15-B4-07｜“已超时 > 即将超时 > 新咨询”属于 PDM-15 还是 PDM-21

历史 R10 曾定义 Consultation 强待办优先级“已超时 > 即将超时 > 新咨询”，第一次真实人工服务后可退出紧急队列，但 Consultation 本身仍可保持 processing。Current 工作台没有完整承载。

候选：

- **7A（建议）**：PDM-15 只冻结 SLA 事实与是否已完成首次响应，不把“即将超时”的阈值和员工工作台排序固化为 Consultation 生命周期规则；新增/保留 outgoing handoff 给 PDM-21，要求 PDM-21 审查历史“已超时 > 即将超时 > 新咨询”工作台优先级及其阈值/展示。
- **7B**：直接在 PDM-15 固化该工作台强排序规则，并在本域继续确定“即将超时”的具体阈值。

**用户裁决：7A。** PDM-15 只冻结 Consultation SLA 业务事实与首次响应是否完成；“已超时 > 即将超时 > 新咨询”的员工工作台优先级、即将超时阈值和展示由 PDM-21 承接，不在本域固化 UI 排序。

---

## 11. Batch 4 Gate｜PASS / USER_APPROVED / APPLIED

- `P15-B4-01～P15-B4-07 = PASS / USER_APPROVED / APPLIED`；
- 用户选择：`1A、2A、3A、4A、5A、6A、7A`；
- `PDM15_LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`；
- 5 条 incoming handoff 继续 `HANDOFF_ACCEPTED`，在 Final / Integrity closeout 前不得提前关闭；
- IA / Low-Fi / Engineering 继续禁止施工；
- 当前进入 Final 前 Missing Rule / Semantic Detail / Cross-PDM Integrity 审计。

当前唯一下一步：

> **执行 PDM-15 Final 前完整性复核。若发现历史完整规则未承接、语义细节缺失或跨 PDM handoff 缺口，只 reopen 对应 Atom / 段落；真正改变产品语义的修复必须重新提交用户裁决。**
