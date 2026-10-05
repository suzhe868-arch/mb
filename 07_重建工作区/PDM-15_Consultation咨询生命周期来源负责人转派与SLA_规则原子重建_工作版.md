# PDM-15｜Consultation / 咨询生命周期 / 来源 / 负责人 / 转派 / SLA｜规则原子重建工作版

> 日期：2026-10-06  
> 状态：`IN_PROGRESS / START_GATE_PASS / BATCH_1_PENDING_USER_REVIEW`  
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

## 4. Batch 1｜稳定一致规则候选｜待用户审查

> 本批只收“跨来源稳定一致且不需要新产品选择”的规则。除 P15-R00 外，下列 Atom 尚未获得用户本批批准。

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

## 5. Batch 1 Gate

当前：

- `P15-R00 = USER_APPROVED / APPLIED`；
- `P15-A01～P15-A08 = PENDING_USER_REVIEW`；
- Batch 2 / 3 / 4 尚未启动；
- 状态机冲突、SLA 精确完成语义、负责人优先级、Customer 停用运行态等不得提前冻结。

当前唯一下一步：

> **提交 P15-A01～P15-A08 给用户审查。用户确认后才能执行 Batch 1 写入批准状态，并继续 Batch 2。**
