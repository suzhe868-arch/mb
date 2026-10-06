# PDM-18｜LockRequest / 正式 Lock / Waitlist / 延期 / 释放｜规则原子重建工作版

> 当前状态：`IN_PROGRESS / STARTUP_GATE_PASS / BATCH_1_PASS / BATCH_2_PENDING_USER_REVIEW`  
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
- LOCK_CONFLICT 不自动转 Waitlist；
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

## P18-A06｜并发审批只允许一个正式 Lock 成功｜USER_APPROVED / APPLIED

- 同车同一时刻只允许一个 active Lock；
- 第一个合法 approve 且成功创建 Lock 的请求获锁；
- 其他竞争请求不得产生第二个 active Lock；
- 其他同车同 cycle PENDING 进入真实冲突结果（如 LOCK_CONFLICT）；
- LOCK_CONFLICT 不自动创建 Waitlist。

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

## P18-A13｜Waitlist 不自动升级为 Lock｜USER_APPROVED / APPLIED

- 原 Lock 释放 / 到期 / 取消后，Waitlist 不自动转成 Lock；
- 候补 Customer 必须重新经过人工确认与当前 Guard；
- 再次尝试正式 Lock 时重新验证当前 Vehicle / listing_cycle / permission / scope / occupancy；
- LockRequest LOCK_CONFLICT 也不得自动创建 Waitlist。

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

## P18-A18｜Priority / Recommendation / Matching 与 Lock 分层｜USER_APPROVED / APPLIED

- active Lock 不使底层真实可售 Vehicle 退出 Matching；
- 其他 Demand 可以继续形成携带“已锁/占用”的 Match Result；
- active Lock 存在时不得新建 Priority；
- 正式 Lock 成立可结束当前 active Priority；
- Lock 取消 / 到期不恢复旧 Priority，后续按当时当前合法事实重新仲裁；
- Recommendation 不产生 Lock 排队优先级、抢车分值或 takeover 权；
- Recommendation end / void、Priority release / expiry 均不得反向取消已经合法成立的 Lock。

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

# 8. Batch 2｜明确废弃 / Superseded / DO_NOT_RESTORE 候选

> 状态：`PENDING_USER_REVIEW`。  
> 反向冲突扫描：`PASS / FALSE_DEPRECATION_COUNT=0`。  
> 原则：只列已经被后续 Authority 明确废弃、替代或禁止恢复的旧口径；不把仍有效的员工直接 Lock、Waitlist、Matching、Priority/Recommendation 分层能力误标为废弃。

## P18-B2-01｜旧“我要这辆车”统一意向入口不得恢复

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

## P18-B2-02｜旧“默认正式 Lock = 2 小时”不得恢复

早期旧规则曾定义默认 Lock 时长为 2 小时。

9/19 R8-01 已明确覆盖为：

> **默认正式 Lock = 72 小时，后台可配置。**

并冻结：

- 创建时读取当前配置；
- 计算并固化该笔 expires_at；
- 后改默认值不追改既有 Lock。

因此旧 2 小时默认值：

> `SUPERSEDED_BY_R8_01 / DO_NOT_RESTORE`

## P18-B2-03｜Priority = Lock 排队优先级 / 抢车分值不得恢复

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

## P18-B2-04｜active Lock = no_match / 车辆退出 Matching 不得恢复

PDM-12 / PDM-13 已正式冻结：

- active Lock 不阻断底层真实可售 Vehicle 继续 Matching；
- 其他 Demand 可继续产生携带“已锁 / 占用”事实的 Match Result；
- 但不得据此绕过同车唯一 active Lock。

因此不得恢复：

> active Lock = no_match / 已锁车辆从 Matching 事实层直接消失

这不会削弱 Lock 排他占用：active Lock 仍阻止第二个 active Lock，并阻止新 Priority。

## P18-B2-05｜Recommendation / Priority 结束反向撤销合法 Lock 不得恢复

不得恢复以下旧耦合：

- Recommendation end / void → 自动取消已成立 Lock；
- Priority release / expiry → 自动取消已成立 Lock；
- Recommendation cancellation → 反向撤销 Lock；
- Priority ended → 强制释放 Lock。

一旦正式 Lock 合法成立：

> Recommendation 与 Priority 后续生命周期变化不得反向抹掉该 Lock。

Lock 只按 PDM-18 自身 Authority 结束。

## P18-B2-06｜CRM 客户详情“锁车→再选车辆”旧入口不得恢复

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

> **用户审查 P18-B2-01～P18-B2-06。未经确认不得进入 Batch 3。**
