# PDM-18｜LockRequest / 正式 Lock / Waitlist / 延期 / 释放｜规则原子重建工作版

> 当前状态：`IN_PROGRESS / BATCH_1_2_3_4_PASS / PREFINAL_R1_REPAIR_REQUIRED`  
> 核心定位：`P18-R00 / USER_APPROVED / APPLIED`  
> Incoming Handoff：10 / 10 `HANDOFF_ACCEPTED`  
> IA / Low-Fi / Engineering：`NO_CONSTRUCTION`

---

## 1. Startup Gate｜P18-R00

PDM-18 是：

> **LockRequest（锁车申请）/ 正式 Lock（锁车）/ Waitlist（候补）以及延期、释放、到期、责任交接的唯一业务 Authority。**

PDM-18 负责：

- 客户 LockRequest 的创建 / 复用 / 失效；
- 员工审批 LockRequest；
- 正式 Lock 创建及同车唯一 active Lock；
- 正式 Lock 默认时长、expires_at 固化；
- 普通 Lock 人工延期；
- Lock 到期、释放、取消；
- 已收意向金后的超时边界；
- Waitlist 创建、幂等、结束、重新确认；
- Lock / Waitlist responsible 与正式交接；
- 历史、幂等、并发、供应异常与跨域 Guard。

PDM-18 不重新建设：

- Customer identity / account；
- Customer owner / 公海；
- permission / data scope；
- Vehicle / listing_cycle；
- Vehicle Archive；
- Price Authority；
- Matching；
- Priority；
- Recommendation；
- Deposit / Transaction / Refund / 换车；
- 客户端 / 员工端最终 IA；
- 通知渠道；
- 统一审计底层实现。

其中：

> **Deposit / Transaction / Refund / 换车继续由 PDM-19 承接。**

---

## 2. Incoming Handoff

Startup Gate 正式接受：

- HO-P01-P18-001｜Customer 停用不自动取消既有 Lock / Waitlist；
- HO-P02-P18-001｜Lock / Waitlist mutation 与 responsible 继承统一权限和对象状态；
- HO-P03-P18-001｜Customer owner 变化不自动漂移 Lock / Waitlist responsible；
- HO-P04-P18-001｜vehicle source / visibility 变化不得静默抹除 Lock / Waitlist 历史；
- HO-P07-P18-001｜档案不完整本身不阻止 Lock / Waitlist，档案历史不被 Lock 改写；
- HO-P10-P18-001｜正式 Lock 创建时冻结必要价格快照；
- HO-P12-P18-001｜active Lock 不阻止 Matching，但不得绕过单车唯一 active Lock；
- HO-P13-P18-001｜Lock × Priority 边界；
- HO-P14-P18-001｜Lock × Recommendation 边界；
- HO-P17-P18-001｜Lock / Waitlist 作为公海保护事实，owner / 公海变化不静默改写业务 responsible。

Startup Gate 扫描结果：

- `COMPLETED_PDM_HARD_CONFLICT = 0`
- `INCOMING_HANDOFF_GAP = 0`
- `INCOMING_HANDOFF_ACCEPTED = 10 / 10`

---

## 3. 9/19 主底盘与后续变化

### 3.1 9/19 R8 主底盘继续有效的核心

- 同一 Vehicle 同一时刻只能存在一个 active Lock；
- 同一 Customer 可以锁不同 Vehicle；
- active Lock 存在时其他 Customer 可进入 Waitlist；
- Waitlist 不占车、不自动升级 Lock；
- 正式 Lock 默认时长 = 72 小时，后台可配置；
- 新 Lock 创建时按当时配置计算并固化 expires_at；
- 后改默认值不追改既有 Lock；
- 已收真实意向金后，不因普通 72h 超时自动释放；
- 供应异常不得静默取消已经形成的 Lock；
- 正式 Lock 保存当时客户有效展示价快照。

### 3.2 9/19 后明确新增：LockRequest

后续 Current 已明确新增正式前置对象：

> **客户点击“锁车”只创建 / 复用 LockRequest，不直接创建正式 Lock。**

这属于后于 R8 的明确新增，不得被旧“我要这辆车”体验覆盖。

当前已确认：

- LockRequest.PENDING 固定 6 小时，服务端时钟判断；
- PENDING 不占车；
- PENDING 不生成正式 Lock Snapshot；
- PENDING 不启动正式 Lock 72h；
- 同车可存在多个 PENDING；
- 申请先后不产生正式锁车优先权；
- 员工 approve 时重新校验并原子创建正式 Lock；
- 第一个合法 approve 且创建成功者获锁；
- 其他同车同 listing_cycle 的 PENDING 可进入 LOCK_CONFLICT；
- **历史 9/22 口径：LOCK_CONFLICT 不自动转 Waitlist；该句已被 P18-B4-02 / 2A 主动覆盖，不再是当前 Authority。**
- 客户端不提供 LockRequest 主动 cancel / withdraw；
- 4S Member 不处理 LockRequest。

---

# 4. Batch 1｜稳定一致项｜PASS / USER_APPROVED / APPLIED

以下只收录当前证据中稳定一致、没有真实产品冲突的规则。  
**用户已对 P18-A01～P18-A18 全部同意并确认执行；18 条规则已进入当前工作 Authority。**

## P18-A01｜LockRequest / Lock / Waitlist 三对象分离｜USER_APPROVED / APPLIED

- LockRequest = 客户锁车申请，不占车；
- Lock = 正式车辆占用事实；
- Waitlist = 他人已有 active Lock 时的候补 / 排队意向事实，不占车；
- 三者不得合并成一个状态字段；
- Consultation / Recommendation / Priority 也不得替代 Lock。

## P18-A02｜客户端“锁车”只创建 / 复用 LockRequest｜USER_APPROVED / APPLIED

客户在合法 Customer + Vehicle + listing_cycle 上点击“锁车”：

- 创建或复用当前合法 LockRequest.PENDING；
- 不直接创建正式 Lock；
- 不因为按钮点击形成车辆占用；
- 不生成正式 Lock price/duration snapshot。

旧“我要这辆车”混合咨询 / 锁车语义不得恢复。

## P18-A03｜LockRequest.PENDING 的 6 小时有效期｜USER_APPROVED / APPLIED

- PENDING 最长 6 小时；
- 由服务端时钟判断；
- 到期后不可批准；
- 6 小时只属于 LockRequest；
- 正式 Lock 的 72 小时时钟只有在 approve + Lock 创建成功后才开始。

## P18-A04｜多个 PENDING 不产生抢车优先权｜USER_APPROVED / APPLIED

同一 Vehicle / listing_cycle：

- 可以存在多个 Customer 的 PENDING LockRequest；
- PENDING 不占车；
- 申请先后不产生正式 Lock 优先权；
- Priority 也不是 LockRequest 排队优先级或抢车分值。

## P18-A05｜Approve 必须原子重验并创建正式 Lock｜USER_APPROVED / APPLIED

LockRequest approve 最终提交必须重新验证：

- actor identity；
- permission/capability；
- data scope；
- Customer / account state；
- Vehicle / listing_cycle 当前有效性；
- 当前可锁性；
- 当前是否已有 active Lock。

只有重验全部通过并成功创建正式 Lock，LockRequest 才能进入成功结果。

## P18-A06｜并发审批只允许一个正式 Lock 成功｜USER_APPROVED / APPLIED / REVISED_BY_B4-02

- 同车同一时刻只允许一个 active Lock；
- 第一个合法 approve 且成功创建 Lock 的请求获锁；
- 其他竞争请求不得产生第二个 active Lock；
- 其他同车同 cycle PENDING 进入真实冲突结果（如 `LOCK_CONFLICT`）；
- 采用 P18-B4-02 / 2A 后：这些仍有效且仅因该 Lock 成立而失去获锁机会的 PENDING，自动创建 / 复用 Waitlist；
- LockRequest 本体继续保留 `LOCK_CONFLICT` 终态与关联 Waitlist，不把 LockRequest 状态直接改造成 Waitlist；
- 自动 Waitlist 不产生正式 Lock 优先权，也不改变“一人先合法 approve + 成功创建 Lock 才获锁”的并发规则。

## P18-A07｜客户侧不提供 LockRequest 主动撤回主流程｜USER_APPROVED / APPLIED

V1 当前：

- 客户端不提供 LockRequest 主动 cancel / withdraw；
- 不新增独立“申请进度详情页”；
- 客户侧只按实时状态展示“锁车申请中”等状态位；
- 已过期 / 被拒绝 / 冲突后按当前真实结果展示。

## P18-A08｜正式 Lock 唯一性｜USER_APPROVED / APPLIED

- 同一 Vehicle 同一时刻只能有一个 active Lock；
- 同一 Customer 可以同时锁不同 Vehicle；
- active Lock 是正式占用事实；
- hidden / visibility 变化本身不得伪造成 Lock 结束。

## P18-A09｜正式 Lock 默认 72 小时且创建时固化｜USER_APPROVED / APPLIED

- 默认 Lock 时长 = 72 小时；
- 后台可配置；
- 新 Lock 按创建时当前有效配置计算 expires_at；
- 创建成功后本笔初始 expires_at 固化；
- 后台以后修改默认值不追改既有 Lock；
- LockRequest 6h 与正式 Lock 72h 严格分离。

## P18-A10｜普通 Lock 到期与已收意向金边界｜USER_APPROVED / APPLIED

普通、未收真实意向金的 active Lock 到期后：

> 可按正式超时规则释放。

一旦存在对应真实意向金事实：

> 不得仅因普通 expires_at 到期自动释放车辆。

PDM-18 只消费“已存在真实意向金”的事实；Deposit 本身由 PDM-19 管理。

## P18-A11｜正式 Lock 可以对同一对象人工延期｜USER_APPROVED / APPLIED

授权员工可以对仍处于普通有效期管理的正式 Lock：

- 延长同一个 Lock 的 expires_at；
- 不创建第二个 Lock；
- 至少审计 old expires_at / new expires_at / actor / time；
- 客户侧后续投影应读取新的当前到期时间；
- 已收真实意向金后的持续占用不再按普通倒计时延期模型处理。

## P18-A12｜Waitlist 只在他人 active Lock 时成立｜USER_APPROVED / APPLIED

- 只有 Vehicle 被其他 Customer 的 active Lock 占用时，才允许新的 Customer 进入 Waitlist；
- Waitlist 不占车；
- 同 Customer + Vehicle 同时最多一个 active Waitlist；
- 重复提交复用当前合法 active Waitlist。

## P18-A13｜Waitlist 不自动升级为 Lock｜USER_APPROVED / APPLIED / REVISED_BY_B4-02

- 原 Lock 释放 / 到期 / 取消后，Waitlist 不自动转成 Lock；
- 候补 Customer 必须重新经过人工确认与当前 Guard；
- 再次尝试正式 Lock 时重新验证当前 Vehicle / listing_cycle / permission / scope / occupancy；
- **“Waitlist 不自动升级为 Lock”继续成立；但 LockRequest 竞争失败自动形成 Waitlist 已由 P18-B4-02 / 2A 明确允许。两者不是同一方向的自动转换。**

## P18-A14｜owner / 公海变化不静默改写 Lock / Waitlist responsible｜USER_APPROVED / APPLIED

- Customer owner 与 Lock / Waitlist responsible 分层；
- owner 变化不自动漂移 existing Lock / Waitlist responsible；
- Customer 进入 / 退出公海不自动取消、转移或重建 existing Lock / Waitlist；
- 未完成 Lock / Waitlist 是公海保护事实；
- responsible inactive / 离职 / 失效时必须走明确合法交接，历史负责人保留。

## P18-A15｜Customer 停用不删除既有业务历史｜USER_APPROVED / APPLIED

Customer account 停用：

- 不自动删除 / 物理取消已经存在的 Lock / Waitlist 历史；
- 当前可执行动作根据最新 identity / account / permission / object state 重新计算；
- 恢复账号也不得伪造新 Lock 或复活已终止业务对象。

## P18-A16｜Vehicle source / visibility / archive 变化不改写业务历史｜USER_APPROVED / APPLIED

- source_type 变化不改写已有 Lock / Waitlist 历史；
- hidden 本身不等于 Waitlist 结束；
- 档案 / 报告不完整本身不得阻止合法 Lock / Waitlist；
- Lock 状态变化不得删除 / 重写车辆档案历史。

## P18-A17｜Lock 价格快照不可被后续价格变化改写｜USER_APPROVED / APPLIED

正式 Lock 创建时必须冻结必要客户价格快照：

- 当时有数字有效客户展示价 → 保存数字事实；
- 当时为“价格咨询” → 保存明确“价格咨询”事实；
- 不得用 0 / 假价格替代；
- 后续上游调价、阶梯规则、覆盖价、人工价格、source_type 变化不得回写历史 Lock Snapshot。

## P18-A18｜Priority / Recommendation / Matching 与 Lock 分层｜USER_APPROVED / APPLIED / EXTENDED_BY_B4-01

- active Lock 不使底层真实可售 Vehicle 退出 Matching；
- 其他 Demand 可以继续形成携带“已锁/占用”的 Match Result；
- active Lock 存在时不得新建 Priority；
- 正式 Lock 成立可结束当前 active Priority；
- Lock 取消 / 到期不恢复旧 Priority，后续按当时当前合法事实重新仲裁；
- Recommendation 不产生 Lock 排队优先级、抢车分值或 takeover 权；
- Recommendation end / void、Priority release / expiry 均不得反向取消已经合法成立的 Lock；
- 普通 VIP / 粉丝直接形成的 Lock 只形成占车，不自动产生全客户隐藏；
- Priority Customer 自己从 active Priority 转正式 Lock 时，Priority 本体以 `converted_to_lock` 等合法 reason ended，但该笔 Lock 继承原 Priority 的客户侧排他可见性；
- Priority-origin Lock 有效期间其他普通 Customer 不进入该车普通公开列表 / 详情，但内部 Matching / Employee / PC 继续读取真实 Vehicle 与占用事实；
- 该 Lock 结束后不恢复旧 Priority，而按当时最新 Vehicle / Recommendation / Priority / visibility 重新计算客户可见性。

---

## 5. Startup Scan 明确暂不偷渡

以下留给后续 Batch 2 / 3 / 4：

- 旧“默认到期前 30 分钟提醒”是否继续有效；
- Lock release / cancel 的 reason 是否统一强制必填及 actor 矩阵；
- Waitlist responsible 的完整来源优先级；
- Waitlist 在 completed / offline / unavailable / sold_external 等条件下的完整结束矩阵；
- 供应异常的具体 Lock 状态表达与人工处置入口；
- LockRequest 完整状态枚举是否需要进一步收敛；
- Lock / Waitlist 批量治理能力；
- PC 默认 Lock 时长配置 actor 与更细配置 Guard；
- PDM-18→PDM-19/20/21/22/23/25 outgoing handoff；
- 其他冲突、遗漏、新增与产品选择。

这些事项未经对应 Batch 分类和用户裁决，不进入当前 Authority。

---

## 6. Startup Gate 结果

- `P18-R00 = USER_APPROVED / APPLIED`
- `STARTUP_GATE = PASS`
- `COMPLETED_PDM_HARD_CONFLICT = 0`
- `INCOMING_HANDOFF_GAP = 0`
- `INCOMING_HANDOFF_ACCEPTED = 10 / 10`
- `BATCH_1 = P18-A01～P18-A18 / PASS / USER_APPROVED / APPLIED`
- `IA / LOW-FI / ENGINEERING = NO_CONSTRUCTION`

当前唯一下一步：

> **P18-A01～P18-A18 已批准并执行。当前唯一下一步：用户审查 Batch 2（P18-B2-01～P18-B2-06）。未经确认不得进入 Batch 3。**


---

## 7. Batch 1 Gate｜PASS

- 用户裁决：`P18-A01～P18-A18 = 全部同意`；
- 执行授权：用户同一条消息明确“确认执行”；
- `BATCH_1 = PASS / USER_APPROVED / APPLIED`；
- 18 条稳定规则已进入当前工作 Authority；
- 10 / 10 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工。

---

# 8. Batch 2｜明确废弃 / Superseded / DO_NOT_RESTORE｜PASS / USER_APPROVED / APPLIED

> 状态：`PASS / USER_APPROVED / APPLIED`。  
> 用户裁决：P18-B2-01～P18-B2-06 全部同意；随后以“确认指向”明确执行。  
> 反向冲突扫描：`PASS / FALSE_DEPRECATION_COUNT=0`。  
> 原则：只列已经被后续 Authority 明确废弃、替代或禁止恢复的旧口径；不把仍有效的员工直接 Lock、Waitlist、Matching、Priority/Recommendation 分层能力误标为废弃。

## P18-B2-01｜旧“我要这辆车”统一意向入口不得恢复｜USER_APPROVED / APPLIED

历史 R10 曾把“我要这辆车”同时作为：

- 客户高意向入口；
- Consultation / 客户服务工作台来源；
- 后续是否 Lock 的统一前置链路。

2026-09-22 后续 Authority 已明确拆分：

- 沟通车辆 → Consultation / “咨询这辆车”；
- 客户申请锁车 → LockRequest；
- 员工批准 LockRequest 后才创建正式 Lock；
- Recommendation 继续是独立正式推荐动作。

因此旧“我要这辆车”统一入口：

> `SUPERSEDED / DO_NOT_RESTORE`

**防误废弃 Guard：**这只废弃客户旧统一 CTA，不废弃合法名邦员工在 Customer + Vehicle 上下文明确且 Guard 全部通过时直接创建正式 Lock 的能力。

## P18-B2-02｜旧“默认正式 Lock = 2 小时”不得恢复｜USER_APPROVED / APPLIED

早期旧规则曾定义默认 Lock 时长为 2 小时。

9/19 R8-01 已明确覆盖为：

> **默认正式 Lock = 72 小时，后台可配置。**

并冻结：

- 创建时读取当前配置；
- 计算并固化该笔 expires_at；
- 后改默认值不追改既有 Lock。

因此旧 2 小时默认值：

> `SUPERSEDED_BY_R8_01 / DO_NOT_RESTORE`

## P18-B2-03｜Priority = Lock 排队优先级 / 抢车分值不得恢复｜USER_APPROVED / APPLIED

PDM-13 Final 已明确禁止：

> Priority = Lock priority

以及：

> Priority 不是 LockRequest 排队优先级或抢车分值。

因此不得恢复：

- Priority Customer 先天抢锁；
- active Priority 决定多个 LockRequest 谁先获锁；
- Priority TTL / 先后被当作 Lock 排队权；
- Priority 人工 override 直接覆盖 existing active Lock。

Priority 与 Lock 只按当前 PDM-13 / PDM-18 边界交互。

## P18-B2-04｜active Lock = no_match / 车辆退出 Matching 不得恢复｜USER_APPROVED / APPLIED

PDM-12 / PDM-13 已正式冻结：

- active Lock 不阻断底层真实可售 Vehicle 继续 Matching；
- 其他 Demand 可继续产生携带“已锁 / 占用”事实的 Match Result；
- 但不得据此绕过同车唯一 active Lock。

因此不得恢复：

> active Lock = no_match / 已锁车辆从 Matching 事实层直接消失

这不会削弱 Lock 排他占用：active Lock 仍阻止第二个 active Lock，并阻止新 Priority。

## P18-B2-05｜Recommendation / Priority 结束反向撤销合法 Lock 不得恢复｜USER_APPROVED / APPLIED

不得恢复以下旧耦合：

- Recommendation end / void → 自动取消已成立 Lock；
- Priority release / expiry → 自动取消已成立 Lock；
- Recommendation cancellation → 反向撤销 Lock；
- Priority ended → 强制释放 Lock。

一旦正式 Lock 合法成立：

> Recommendation 与 Priority 后续生命周期变化不得反向抹掉该 Lock。

Lock 只按 PDM-18 自身 Authority 结束。

## P18-B2-06｜CRM 客户详情“锁车→再选车辆”旧入口不得恢复｜USER_APPROVED / APPLIED

PDM-16 Final 已明确废弃旧：

> CRM 客户详情 → 锁车 → 再选车辆

当前正确边界：

- 从 Vehicle Detail 进入并选择 Customer；
- 或已有明确 Customer + Vehicle 上下文时直接进入合法 Lock 动作；
- 客户自己发起则走 LockRequest；
- CRM 只展示 Lock / Waitlist 概览，不复制 PDM-18 状态机。

**防误废弃 Guard：**废弃的是“从 CRM 先发起再找车”的旧产品入口，不废弃合法员工直接正式 Lock 的业务能力。

### 8.1 Reverse Conflict Scan

本轮没有把以下仍有效能力误判为废弃：

- 合法名邦员工直接创建正式 Lock；
- 客户 LockRequest；
- 同车唯一 active Lock；
- Waitlist；
- Lock 人工延期；
- 已收意向金后不按普通 timeout 释放；
- active Lock 下继续 Matching；
- active Lock 阻止第二个 active Lock；
- active Lock 阻止新 Priority；
- Recommendation 继续独立存在且不产生抢锁权；
- CRM 中查看 Lock / Waitlist 概览。

因此：

- `FALSE_DEPRECATION_COUNT = 0`
- `BATCH_2_CONFLICT_SCAN = PASS`

当前唯一下一步：

> **P18-B2-01～P18-B2-06 已批准并执行。当前唯一下一步：用户审查 Batch 3（P18-B3-01～P18-B3-03）。未经确认不得进入 Batch 4。**


---

## 8.2 Batch 2 Gate｜PASS

- `P18-B2-01～P18-B2-06 = PASS / USER_APPROVED / APPLIED`；
- Reverse Conflict Scan = `PASS`；
- `FALSE_DEPRECATION_COUNT = 0`；
- 10 / 10 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工。

---

# 9. Batch 3｜后续明确新增 / 明确变更｜PASS / USER_APPROVED / APPLIED

> 状态：`PASS / USER_APPROVED / APPLIED`。  
> 用户裁决：P18-B3-01、P18-B3-03 全部同意并确认执行；P18-B3-02 已在此前撤回并转入 Batch 4。  
> Conflict Isolation：`PASS / MISCLASSIFIED_PRODUCT_CHOICE=0`。  
> 原则：只收录 9/19 主底盘之后已有明确冻结证据、且不需要重新做产品取舍的新增/变更；真正冲突、新缺口、新产品选择全部留 Batch 4。

## P18-B3-01｜4S Member 不得审批 LockRequest｜USER_APPROVED / APPLIED

2026-09-22 新 LockRequest 冻结规则明确：

> **4S Member 不得审批客户 LockRequest。**

因此：

- LockRequest approve / reject 属于名邦内部受控业务动作；
- 4S Member 对该审批链 hard DENY；
- 不能因为其管理自己的 4S 车源，就获得客户 LockRequest 审批权；
- 最终提交仍需重验 identity + permission/capability + data scope + object state。

这不影响 4S 对自己合法车源的正常车辆管理权限。

**依据：**001～078 M13-003；PDM-02 统一权限边界。

## P18-B3-02｜LOCK_CONFLICT 后只能由客户重新主动选择候补｜WITHDRAWN_FROM_BATCH3 / RECLASSIFIED_TO_BATCH4

2026-09-22 LockRequest 新链明确：

- 同车竞争审批失败可进入 `LOCK_CONFLICT`；
- `LOCK_CONFLICT` 不自动创建 Waitlist；
- 当车辆此时已经被其他 Customer 的 active Lock 占用，客户可以**另行主动选择**登记 Waitlist；
- 该 Waitlist 仍必须重新通过当前手机号 / Customer / Vehicle / listing_cycle / occupancy / permission 等合法 Guard；
- 不因原 LockRequest 的提交时间获得候补排序或锁车优先权。

因此原候选为：

> **LockRequest conflict 与 Waitlist 是两个独立业务动作。**

**原依据：**001～078 M13-003；P18-A06/A12/A13。

**2026-10-06 用户新裁决方向：**用户认为竞争失败后应自动转候补，并明确“可以这样调整”，随后确认执行批次重分类。因此本条不再作为 Batch 3 稳定新增项审查，正式转入 Batch 4 产品选择。当前旧 Authority 在 Batch 4 正式裁决前不直接改写。

## P18-B3-03｜合法名邦员工仍可直接创建正式 Lock，不强制先有 LockRequest｜USER_APPROVED / APPLIED

后续冻结证据已经明确恢复 / 保留员工侧正式 Lock 能力：

- 授权名邦员工在明确 Customer + Vehicle 上下文中可直接发起正式 Lock；
- 该员工动作不是“替客户制造一个假的 LockRequest”；
- 不要求所有正式 Lock 必须先存在 Customer LockRequest；
- 最终提交仍必须经过 canonical Lock Guard：identity、permission/capability、data scope、Customer、Vehicle、listing_cycle、当前 active Lock 等；
- 4S Member 对名邦客户正式 Lock 业务 hard DENY。

客户本人点击“锁车”仍严格走 LockRequest；两条入口不得混淆。

**依据：**001～078 M13-006 中 VR-E-012 / Current E03-06 后续冻结事实；PDM-02 权限边界；P18-B2-01/B2-06 防误废弃 Guard。

### 9.1 Conflict Isolation

以下事项**没有**偷渡进 Batch 3：

- Priority Customer 转正式 Lock 后是否继续继承客户侧排他可见性；
- 普通 VIP/粉丝正式 Lock 是否仍允许其他客户看到“已锁定”；
- Priority 转 Lock 与普通 Lock 的 Waitlist 可达性差异；
- Waitlist responsible 的完整来源优先级；
- completed / offline / unavailable / sold_external 的 Waitlist 结束矩阵；
- 旧“到期前默认 30 分钟提醒”是否恢复；
- 供应异常的具体状态与人工处置；
- Lock release/cancel reason 强制矩阵；
- LockRequest 完整状态枚举进一步收敛。

这些全部属于 Batch 4 的冲突 / 遗漏 / 缺口 / 新选择。

因此：

- `NEW_INDEPENDENT_ATOMS = 2`
- `WITHDRAWN_RECLASSIFIED_TO_BATCH4 = P18-B3-02`
- `DUPLICATE_RULE_CREATION = 0`
- `MISCLASSIFIED_PRODUCT_CHOICE = 0`
- `BATCH_3 = P18-B3-01 + P18-B3-03 / PASS / USER_APPROVED / APPLIED`

---

## 10. Batch 4 已登记但尚未执行的用户方向

### P18-B4-PRE-01｜Priority 转 Lock 继承客户侧排他可见性｜MOVED_TO_FORMAL_B4-01

用户已明确认可方向：

- **普通 VIP / 粉丝直接形成的正式 Lock**：只形成占车，不自动让车辆对其他 Customer 全部隐藏；其他 Customer 仍可看到“已锁定”，并按最终 Waitlist 规则处理。
- **Priority Customer 转正式 Lock**：Priority 对象本身结束（例如 `converted_to_lock`），但该笔 Lock 继承原 Priority 的客户侧排他可见性；Lock 有效期间，除 Lock Customer 外其他 Customer 不可见。
- 内部员工 / 后台 /内部 Matching 仍可识别车辆及其真实占用事实。
- Lock 结束后不恢复旧 Priority，而按当时最新 Vehicle / Recommendation / Priority / visibility 等事实重新计算客户可见性。

状态：

> `SUPERSEDED_BY_FORMAL_B4 / APPLIED`

该方向将于 Batch 4 正式检查 P18-A12/A13/A18 以及 PDM-13/PDM-14 cross-PDM 边界后再提交正式裁决；当前不得提前改写已完成 PDM Final。

当前唯一下一步：

> **P18-B3-01 与 P18-B3-03 已批准并执行；P18-B3-02 已转入 Batch 4。当前唯一下一步：用户审查 Batch 4（P18-B4-01～P18-B4-10）。**


### P18-B4-PRE-02｜竞争 LockRequest 自动转 Waitlist｜MOVED_TO_FORMAL_B4-02

用户已明确认可新的产品方向：

- 同一 Vehicle + 同一 listing_cycle 下存在多个有效 `LockRequest.PENDING`；
- 其中一个请求被合法批准并成功创建正式 Lock 后；
- 其他仍有效、且仅因为该正式 Lock 成立而失去获锁机会的 PENDING 请求，自动转为 Waitlist；
- 不要求客户再手工点击一次“候补”；
- 同 Customer + Vehicle 已有 active Waitlist 时复用，不重复创建；
- Vehicle 已真实下架 / sold / listing_cycle ended / 其他不允许候补的终态时，不机械创建 Waitlist；
- 自动形成的 Waitlist 仍然不占车，也不得自动升级为正式 Lock；
- 原 Lock 释放 / 到期 / 取消后，仍需人工重新确认并通过最新 Guard 后才能新建正式 Lock；
- 原 LockRequest 的先后顺序不决定谁先获得正式 Lock；
- **对于自动转成 Waitlist 的多个客户，候补顺序按原 LockRequest.created_at 保留原申请先后。**

该方向会正式冲突并修正当前已批准的：

- `P18-A06` 中“其他同车同 cycle PENDING 进入 LOCK_CONFLICT；LOCK_CONFLICT 不自动创建 Waitlist”；
- `P18-A13` 中“LOCK_CONFLICT 也不得自动创建 Waitlist”；
- Startup/9月22日旧补充规则中的“不自动转 Waitlist”。

状态：

> `SUPERSEDED_BY_FORMAL_B4 / APPLIED`

Batch 4 正式审查时必须同时处理：

1. A06 / A13 的文字与状态修正；
2. LockRequest 终态是否仍保留 `LOCK_CONFLICT` 作为审计结果，还是“冲突 + 已自动候补”双事实；
3. 与 P18-B4-PRE-01 的 Priority→Lock 排他可见性联动：Priority 转 Lock 时其他客户可能根本不可见，但原有 PENDING 是否仍自动进入内部 Waitlist；
4. 客户端 / 员工端如何显示“申请未获锁但已进入候补”；
5. outgoing handoff 到 PDM-20/21/23 的状态投影与通知。



---

## 9.2 Batch 3 Gate｜PASS

- `P18-B3-01 = PASS / USER_APPROVED / APPLIED`；
- `P18-B3-03 = PASS / USER_APPROVED / APPLIED`；
- `P18-B3-02 = WITHDRAWN_FROM_BATCH3 / MOVED_TO_BATCH4`；
- Batch 3 当前未决项 = 0；
- 10 / 10 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工。

---

# 11. Batch 4｜冲突 / 遗漏 / 缺口 / 新产品选择｜PASS / USER_APPROVED / APPLIED

> 状态：`PASS / USER_APPROVED / APPLIED / CHOICES=1A,2A,3A,4A,5A,6A,7A,8A,9A,10A`。  
> 用户裁决：`1A～10A`；随后以“确认执行”语义明确执行。  
> Cross-PDM Conflict Review：`PASS / completed PDM 不静默改写，后续通过 handoff / global alignment 承接`。

## P18-B4-01｜Priority → Lock 后的客户侧可见性｜CHOICE=A / USER_APPROVED / APPLIED

### A｜推荐 / 用户已确认方向
- 普通 VIP / 粉丝直接形成正式 Lock：只形成占车，不自动全客户隐藏；
- 其他 Customer 仍可按自己的正常可见资格看到“已锁定”，但不能创建第二个 active Lock；
- Priority Customer 转正式 Lock：Priority 本体 `ended(converted_to_lock)`，但该笔 Lock 继承原 Priority 的客户侧排他可见性；
- Priority-origin Lock 有效期间，除 Lock Customer 外其他普通 Customer 不进入公开列表 / 普通车辆详情；
- 内部 Employee / PC / Matching 继续读取真实 Vehicle 与“已占用”事实；
- Lock 结束后不恢复旧 Priority，按当时最新 Vehicle / Recommendation / Priority / visibility 重新计算。

### B
所有正式 Lock 一律只占车、不继承 Priority 排他可见性。

**推荐：A。**这就是用户刚刚确认的方向。

---

## P18-B4-02｜竞争 LockRequest 自动转 Waitlist｜CHOICE=A / USER_APPROVED / APPLIED

### A｜推荐 / 用户已确认方向
同一 Vehicle + listing_cycle 有多个有效 PENDING 时：
- 任一请求被合法批准并成功创建正式 Lock；
- 其他仍有效且仅因该 Lock 成立而失去获锁机会的 PENDING，自动创建 / 复用 Waitlist；
- 不要求客户再点一次“候补”；
- Waitlist 排序按原 `LockRequest.created_at`；同时间再用稳定 request_id 作确定性 tie-break；
- 不因申请先后获得正式 Lock 优先权；
- 已 sold / offline / unavailable / cycle ended 等不允许候补时，不机械建 Waitlist；
- Waitlist 不占车、不自动升级 Lock；
- 原 Lock 释放后仍需人工重新确认和最新 Guard；
- LockRequest 本体保持独立终态（`LOCK_CONFLICT`），并关联新/已有 Waitlist，不把 LockRequest 直接改成 Waitlist 状态。

Priority-origin Lock 场景：
- 其他已有 PENDING 仍可形成业务层 Waitlist；
- 但排他可见性不因此被打破；
- 客户侧只允许在“我的候补”等位置看到必要安全摘要，不重新开放普通 Vehicle Detail。

### B
保持旧规则：LOCK_CONFLICT 后客户必须再次手工选择候补。

**推荐：A。**采用 A 后正式修正 P18-A06 / P18-A13 相关局部文字。

---

## P18-B4-03｜Waitlist responsible 如何确定｜CHOICE=A / USER_APPROVED / APPLIED

### A｜推荐
创建 Waitlist 时按以下优先级选择当前合法 responsible：

1. 本次真实 Recommendation 的 recommender；
2. 当前 active / paused Demand 的 responsible；
3. Customer current owner；
4. 前三者均无合法承接人时，先完成合法 owner / responsible assignment，再创建 Waitlist。

并且：
- 创建成功后 responsible 固化；
- 普通 owner / Demand responsible 后续变化不自动漂移；
- inactive / 离职 / 失去资格必须正式 handoff；
- 自动 Waitlist 也使用同一套 responsible 规则，不把“批准别人的 Lock 的员工”自动变成所有候补负责销售。

### B
Waitlist 永远跟随 Customer current owner 自动变化。

**推荐：A。**与历史规则和 PDM-17 责任分层一致。

---

## P18-B4-04｜Waitlist 的结束矩阵｜CHOICE=A / USER_APPROVED / APPLIED

### A｜推荐
- Vehicle 当前 cycle 真实 `completed / offline / unavailable / sold_external`：结束对应 active Waitlist，保留历史和结束原因；
- 单纯 hidden：不结束 Waitlist；
- 某候补 Customer 后来获得该 Vehicle 正式 Lock：只结束该 Customer 自己的 Waitlist；
- 原占用 Lock release / expiry / cancel：不自动结束其他 Waitlist，也不自动晋升；进入人工重新确认；
- listing_cycle 结束后旧 Waitlist 只留历史，新 cycle 不继承；
- 误成交纠错 / 状态纠正不得自动复活已经 ended 的 Waitlist。

### B
除人工结束外，Waitlist 尽量一直保持 active。

**推荐：A。**

---

## P18-B4-05｜正式 Lock responsible 与审批 actor 分离｜CHOICE=A / USER_APPROVED / APPLIED

### A｜推荐
- 正式 Lock 必须有独立 responsible，不允许 `responsible=null`；
- 客户 LockRequest 路径：默认使用该客户当前合法业务承接员工（通常 current owner；如已正式 handoff/assignment，则使用当前合法承接人）作为 Lock responsible；
- 授权经理/管理人员代为 approve 时，记录真实 approver/actor，但**不因为代审批就自动把经理变成 Lock responsible**；
- 员工直接为客户创建 Lock：若 actor 本人就是当前合法业务承接人，则 actor 为 responsible；否则必须明确选择/确认合法 responsible；
- 后续 Customer owner 变化不自动漂移 Lock responsible；
- inactive / 离职必须正式 handoff，保留 old/new responsible、actor、time、reason。

### B
谁最后点击“批准 / 创建 Lock”，谁自动成为 Lock responsible。

**推荐：A。**避免管理人员代审批后错误抢走业务责任。

---

## P18-B4-06｜Lock release/cancel 与 Waitlist manual end 的原因和权限｜CHOICE=A / USER_APPROVED / APPLIED

### A｜推荐
人工 mutation 必须：
- 重新检查 identity + permission/capability + data scope + object state；
- Lock 人工 release / cancel 必填 reason；
- Waitlist 人工 end 必填 reason；
- 当前 responsible 可在自身合法范围处理；
- 其他管理人员必须有明确 capability + scope，不能仅凭“经理/店长”职位名；
- 自动 expiry / Vehicle terminal 等系统结束使用系统 reason，不要求人工输入；
- 全部保留 actor / time / before / after / reason 审计。

### B
人工结束原因可选，职位名可直接作为处理权限。

**推荐：A。**

---

## P18-B4-07｜供应异常时如何处理已有 Lock｜CHOICE=A / USER_APPROVED / APPLIED

### A｜推荐
Vehicle 在已有 active Lock 后出现上游失效 / 供应异常：
- 不自动取消 Lock；
- 不删除 price snapshot / Deposit / 历史；
- Lock 保持原业务事实，同时挂接独立 `supply_anomaly` 事实 / 标记；
- 由当前 responsible / 合法管理人员人工核实后决定后续 release、换车、Transaction/Refund 等路径；
- 供应异常本身不能伪造成 Lock 正常到期；
- 对应 Waitlist 若 Vehicle 已真实进入不可售终态，则按 B4-04 结束；
- 具体资金 / 换车 / Transaction 后果交 PDM-19。

### B
供应异常即自动取消 Lock 并释放车辆。

**推荐：A。**这也是 R8 已确立的核心边界。

---

## P18-B4-08｜旧“到期前默认 30 分钟提醒”是否恢复｜CHOICE=A / USER_APPROVED / APPLIED

该规则只存在于更早历史，后续 R8/R10 没有再次确认，当前证据状态一直是：

> `TO_VERIFY_LEGACY_NOT_RECONFIRMED`

### A｜推荐
- **不恢复固定“默认提前 30 分钟”业务规则**；
- PDM-18 只提供 expires_at / 当前 Lock 状态；
- 如需要即将到期提醒，由 PDM-23 通知 + PDM-22 配置体系定义是否开启及提前量；
- 不在 PDM-18 写死 30 分钟。

### B
恢复“默认提前 30 分钟提醒，可后台配置”。

**推荐：A。**避免把未重新确认的旧规则重新带回。

---

## P18-B4-09｜默认 Lock 时长配置权限与生效边界｜CHOICE=A / USER_APPROVED / APPLIED

### A｜推荐
- 默认 Lock 时长属于业务配置；
- 由具有明确 business-config permission/capability 且 scope 合法的身份修改；
- **System Admin 控制平面身份本身不自动拥有该业务配置权**；
- 不硬编码“经理/店长=必然可改”，由权限模板决定；
- 修改需要审计 old/new/actor/time；
- 只影响之后创建的新 Lock；
- 已存在 Lock 的 expires_at 不追改；
- PDM-18 不额外发明固定 min/max，若产品以后需要范围限制交配置 Authority 明确。

### B
只要能进入 PC 后台或是 System Admin 就可以修改默认 Lock 时长。

**推荐：A。**

---

## P18-B4-10｜V1 是否提供批量 Lock / Waitlist mutation｜CHOICE=A / USER_APPROVED / APPLIED

### A｜推荐
V1 不提供批量：
- 创建正式 Lock；
- 批量 approve LockRequest；
- 批量 release/cancel Lock；
- 批量延期；
- 批量创建 / 结束 Waitlist。

允许批量查看、筛选、导出/治理列表，但每个占车 / 候补 mutation 必须逐对象独立提交和 Guard，避免并发占用与误释放扩大。

### B
建设批量 Lock / Waitlist mutation，但每项独立 Guard、允许 partial success。

**推荐：A。**当前没有足够业务需求证明批量占车操作值得进入 V1。

---

## 11.1 Batch 4 Cross-PDM 待修正 / 待交接影响

1A～10A 已正式采用，因此需要：

- 修正 P18-A06 / P18-A13 的“LOCK_CONFLICT 不自动 Waitlist”局部口径；
- P18-A18 保持“Priority 成立/结束与 Lock 分层”，并补“Priority-origin Lock 继承排他可见性”；
- PDM-13 / PDM-14 completed Authority 不直接改写，先登记 cross-PDM source backwrite / alignment；
- PDM-20 承接普通 Lock 与 Priority-origin Lock 的客户端可见性、我的候补最小安全投影；
- PDM-21 承接员工端 LockRequest / Waitlist / Lock 状态与操作入口；
- PDM-22 承接默认 Lock 时长业务配置 carrier；
- PDM-23 承接到期 / 自动候补等通知策略；
- PDM-25 承接审计、并发、幂等与 worker 测试；
- PDM-19 承接供应异常后的 Deposit / Transaction / Refund / 换车后果。

当前唯一下一步：

> **P18-B4-01～P18-B4-10 已按 1A～10A 批准并执行。Final 前完整性复核 R1 = REPAIR_REQUIRED；当前唯一下一步：用户审查 P18-LIA-01～P18-LIA-06。**


---

## 11.2 Batch 4 Gate｜PASS

- 用户裁决：`1A、2A、3A、4A、5A、6A、7A、8A、9A、10A`；
- 用户随后明确执行；
- `P18-B4-01～P18-B4-10 = PASS / USER_APPROVED / APPLIED`；
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`；
- P18-A06 / A13 已按 B4-02 修正；
- P18-A18 已按 B4-01 扩展；
- 10 / 10 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工。

---

# 12. Final 前完整性复核 R1

> 报告：`07_重建工作区/PDM-18_Final前完整性复核_R1_2026-10-06.md`  
> 结果：`REPAIR_REQUIRED`。  
> Final candidate：`NOT_READY`。

本轮发现 6 组需要 Final 前补齐的规则 / handoff / carrier 事项：

- `P18-LIA-01`：Waitlist 的手机号人工服务门槛；
- `P18-LIA-02`：客户 V1 不自助取消 Waitlist；
- `P18-LIA-03`：LockRequest 正式结果集与审计 / 关联结果；
- `P18-LIA-04`：正式 Lock 创建幂等与 retry-safe；
- `P18-LIA-05`：Waitlist 顺序存在但客户端不展示保证性“第几名”；
- `P18-LIA-06`：Outgoing Handoff + stale carrier / cross-PDM alignment 登记。

当前唯一下一步：

> **用户审查 P18-LIA-01～P18-LIA-06。修复并执行后重新运行 Final 前完整性复核 R2。**
