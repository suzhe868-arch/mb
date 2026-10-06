# PDM-19｜意向金 / Transaction / Refund / 成交纠错 / 换车｜规则原子重建工作版

> 当前状态：`IN_PROGRESS / STARTUP_GATE_PASS / BATCH_1_PASS / BATCH_2_PASS / BATCH_3_PENDING_USER_REVIEW`  
> 核心定位：`P19-R00 / USER_APPROVED / APPLIED`  
> Incoming Handoff：10 / 10 `HANDOFF_ACCEPTED`  
> IA / Low-Fi / Engineering：`NO_CONSTRUCTION`

---

## 1. Startup Gate｜P19-R00

PDM-19 是：

> **Deposit（意向金真实收款事实）/ Transaction（交易）/ Refund（退款）/ 成交纠错，以及换车资金与交易收口的唯一业务 Authority。**

PDM-19 从已经合法成立的 Lock 之后承接资金与交易事实链，负责：

- Deposit 的真实收款事实、追加、更正 / 冲正与历史完整性；
- Transaction 的创建、进行中、完成、取消与历史；
- Transaction responsible 与正式交接；
- completed Transaction 的成交纠错；
- Refund 的建立、实际退款、余额与多笔退款事实；
- 换车时旧业务结束、新车重新 Lock / Transaction / Deposit；
- Customer / Vehicle / Lock / Priority / Recommendation / Consultation / 公海等上游对象与交易资金事实之间的跨域 Guard；
- 资金、成交、退款、纠错事实的不可覆盖历史与必要审计承接。

PDM-19 不重新建设：

- Customer identity / account；
- Customer owner / 公海状态机；
- permission / data scope 总模型；
- Vehicle / listing_cycle / source / visibility；
- Vehicle Archive 本体；
- Price Authority / 查价；
- Matching；
- Priority；
- Recommendation；
- Consultation；
- LockRequest / Lock / Waitlist；
- 客户端 / 员工端 / PC 最终 IA；
- 通知渠道；
- 统一审计底层实现。

其中：

> **LockRequest / 正式 Lock / Waitlist 的 Authority 继续属于 PDM-18。PDM-19 只能消费合法 Lock 与既有业务事实，不得回写或伪造 PDM-18 的历史。**

换车在 V1 中：

> **不是独立“换车状态机”。旧车业务按真实结果结束或取消，新车重新建立 Lock / Transaction / Deposit；旧资金与交易历史完整保留。**

---

## 2. Incoming Handoff

Startup Gate 正式接受：

- HO-P01-P19-001｜Transaction / Refund 生命周期；Customer 停用不改写历史事实；
- HO-P02-P19-001｜Transaction / Refund / 成交纠错继承统一 permission、data scope、对象状态、终态与历史边界；
- HO-P03-P19-001｜Transaction / Refund 当前责任与 Customer owner 分层；owner 变化不自动重写交易历史；
- HO-P04-P19-001｜Vehicle source / visibility / source conversion 不得静默抹除 Transaction / Refund / correction 与 completed 历史；
- HO-P07-P19-001｜档案不完整不阻止创建 Transaction；首次真正完成 / 交付前按当时有效 required-field set 核验，缺失只阻止完成；
- HO-P13-P19-001｜Transaction × Priority：in-progress Transaction 阻止新 Priority，进入 Transaction 结束已有 Priority，取消 / 纠错后不恢复旧 Priority；
- HO-P14-P19-001｜Transaction × Recommendation：占用事实本身不自动禁止 Recommendation；Recommendation 不接管、不取消、不回写 Transaction；
- HO-P15-P19-001｜Transaction completed / cancelled / corrected 不自动修改 Consultation 主状态；
- HO-P17-P19-001｜Transaction / Refund 在途责任是公海保护事实；owner / 公海变化不得静默漂移当前责任或历史；
- HO-P18-P19-001｜正式 Lock 后的 Deposit / Transaction / Refund / 换车由 PDM-19 承接；真实 Deposit 存在时不得按普通 Lock 超时自动释放。

Startup Gate 扫描结果：

- `COMPLETED_PDM_HARD_CONFLICT = 0`
- `INCOMING_HANDOFF_GAP = 0`
- `INCOMING_HANDOFF_ACCEPTED = 10 / 10`

---

## 3. 9/19 主底盘与 Current Refresh

### 3.1 9/19 R8 / C4 / R12 继续有效的核心

当前稳定底盘包括：

- Deposit 是真实收款事实，不与 Lock / Transaction / Refund 合并成单一状态；
- 已有真实 Deposit 时，不得仅因普通 Lock 超时自动释放；
- Transaction 必须建立在当前合法 Lock 事实之上；
- Transaction 取消不自动恢复旧 Lock / Waitlist；
- Refund 不得通过删除 Transaction / Lock / Deposit 历史来“修正”；
- 退款主状态底盘为 `pending / refunded`；
- 部分退款通过多笔实际退款事实表达，不通过覆盖旧事实表达；
- `refund = pending` 不占车；
- completed Transaction 纠错必须保留原成交与纠错事实，不得直接擦除原成交；
- 换车不转挂旧 Deposit，不修改旧车辆 ID 或旧 Transaction 来伪造“换车”；
- 上游 / source 异常不得静默取消已成立 Transaction 或删除资金事实；
- Customer owner 变化不得改写历史交易事实。

### 3.2 Current / Phase 1.5 已出现、需后续分批审查的细化

Current 已明确出现：

- Deposit 的追加式 correction / reversal；
- Transaction 首次完成权限；
- pending Refund 的撤回 / 关闭；
- Refund `closed-not-refunded` 投影；
- Refund exactly-one-subject Guard；
- completed/cancelled Transaction 的退款资格；
- 交易 / 退款 actor、permission、scope、responsibility 细化；
- Deposit / Transaction / Refund 页面和状态投影。

这些是当前证据的重要部分，但其中部分属于 9/19 后新增 / 细化或与旧状态模型存在潜在张力。

> **Startup Gate 只识别并挂账，不在 Batch 1 偷偷冻结这些变化。**

---

# 4. Batch 1｜稳定一致项｜PASS / USER_APPROVED / APPLIED

以下只收录多份证据稳定一致、且当前没有发现真实产品冲突的规则。  
**用户已对 P19-A01～P19-A14 全部同意，并随后明确确认执行；14 条规则已进入当前工作 Authority。**

## P19-A01｜Deposit / Transaction / Refund / Lock 四类事实分层｜USER_APPROVED / APPLIED

- Deposit = 真实收款事实；
- Lock = 正式车辆占用事实；
- Transaction = 正式交易业务对象；
- Refund = 退款业务 / 退款事实；
- 四者必须建立明确关联，但不得合并成一个“大交易状态”；
- 任何一个对象的后续变化不得通过覆盖另一个对象的历史来实现。

## P19-A02｜资金与交易历史采用追加事实，不物理覆盖｜USER_APPROVED / APPLIED

- 已记录的 Deposit 不因后续更正直接删除；
- 已完成 / 已取消 Transaction 不因后续纠错直接擦除；
- 已发生 Refund 不覆盖原收款或原交易；
- 更正、冲正、退款、成交纠错应形成新的事实 / 纠错记录；
- 原事实与后续更正事实必须可以共同追溯。

## P19-A03｜真实 Deposit 会改变普通 Lock 超时边界｜USER_APPROVED / APPLIED

一旦某个合法 Lock 已存在对应真实 Deposit：

> **不得仅因为普通 Lock 的 expires_at 到期，就按无意向金普通 Lock 自动释放。**

- PDM-19 负责提供“真实 Deposit 已存在”的当前事实；
- 是否以及如何继续释放、退款、换车或进入 Transaction，必须按当前合法资金 / 交易规则处理；
- 不得伪造成普通 Lock expiry。

## P19-A04｜Transaction 必须来源于合法 Lock，不得凭空创建｜USER_APPROVED / APPLIED

- Transaction 必须与合法 Customer / Vehicle / listing_cycle / Lock 链一致；
- 不允许脱离 Lock 凭空制造 Transaction；
- Transaction 建立后必须保留其来源 Lock 关联；
- 后续交易状态变化不得把原 Lock 历史改写成“从未发生”。

## P19-A05｜Transaction 取消不复活旧 Lock / Waitlist｜USER_APPROVED / APPLIED

Transaction 合法取消后：

- 原 Transaction 进入取消 / 历史事实；
- 原 Lock 不自动恢复；
- 原 Waitlist 不自动复活；
- Customer 若仍需继续锁车，必须按当时当前规则重新建立新的合法 Lock 链；
- Vehicle 能否重新进入后续业务，读取真实 source / listing_cycle / 当前占用，而不是“取消交易”单一事件。

## P19-A06｜Customer 停用不删除已发生交易与资金历史｜USER_APPROVED / APPLIED

Customer account 后续停用：

- 不删除已记录 Deposit；
- 不删除已成立 / 已完成 / 已取消 Transaction；
- 不删除 Refund / correction 历史；
- 不把已经发生的资金与成交事实伪造成未发生；
- 当前还能执行哪些新动作，继续按最新 identity / account / permission / object state 判断。

## P19-A07｜Vehicle / source / visibility 变化不静默改写交易资金历史｜USER_APPROVED / APPLIED

- source_type 变化不重建 Transaction；
- hidden / visibility 变化不删除交易 / 资金事实；
- source conversion 不得覆盖 completed/cancelled Transaction 历史；
- 供应异常不得静默取消已经合法成立的 Transaction；
- 已有 Deposit / Refund / correction /成交历史继续保留。

## P19-A08｜档案不完整不阻止创建 Transaction，但可阻止最终完成｜USER_APPROVED / APPLIED

- Vehicle Archive / 必要资料暂不完整，本身不阻止合法 Transaction 创建；
- 已创建 Transaction 不因资料暂缺被回滚或删除；
- 首次真正完成 Transaction / 交付闭环时，读取当时有效 required-field set；
- 缺失必要资料只阻止“完成 / 交付”，不伪造成 Transaction 从未创建。

## P19-A09｜Transaction × Priority 分层｜USER_APPROVED / APPLIED

- Vehicle 已有 in-progress Transaction 时，不得新建 Priority；
- active Priority 存续期间若合法进入正式 in-progress Transaction，当前 Priority ended；
- Transaction 取消 / correction 后不恢复旧 Priority；
- Vehicle 真正重新开放后，如仍满足条件，按当时合法 Match Result 重新仲裁；
- Priority release / expiry、Recommendation cancellation 不得反向撤销已经合法成立的 Transaction。

## P19-A10｜Transaction × Recommendation 分层｜USER_APPROVED / APPLIED

只要 Vehicle 底层仍真实可售、当前 listing_cycle 有效，且 Recommendation 其他 Guard 合法：

- in-progress Transaction 的占用事实本身不自动禁止 Recommendation；
- Recommendation 不 takeover Transaction；
- Recommendation 不取消 Transaction；
- Recommendation end / void 不回写 Transaction；
- Vehicle sold / offline / unavailable 或 cycle end 后，不得以旧 Recommendation 绕过真实不可售事实。

## P19-A11｜Transaction 不自动结束 Consultation｜USER_APPROVED / APPLIED

Transaction：

- completed；
- cancelled；
- corrected；

均不得自动修改 Consultation 主状态。

Consultation 是否 resolved / normal-close / invalid：

> **必须由 PDM-15 自身合法真人动作形成并留痕。**

Transaction 仅提供可引用业务上下文。

## P19-A12｜Transaction / Refund 在途责任是公海保护事实｜USER_APPROVED / APPLIED

当 Customer 仍存在：

- in-progress Transaction；
- 未完成 Refund / 资金处理责任；

不得把 Customer 当作普通“无业务客户”直接丢入公海。

进入公海前必须：

- 完成；
- 取消；
- 或正式交接未完成责任。

Customer owner / 公海变化不得静默取消、漂移或重建 Transaction / Refund 当前责任与历史。

## P19-A13｜换车不建设独立专用状态机｜USER_APPROVED / APPLIED

V1 换车采用：

1. 原 Vehicle 对应 Lock / Transaction 按真实业务结果结束或取消；
2. 原 Deposit / Refund / Transaction 历史完整保留；
3. 新 Vehicle 重新建立新的 Lock；
4. 需要交易时重新建立新的 Transaction；
5. 需要意向金时重新记录新的 Deposit。

不得通过直接替换旧 Transaction 的 vehicle_id 来抹掉旧业务历史。

## P19-A14｜旧 Deposit 不跨车转挂｜USER_APPROVED / APPLIED

换车场景：

- 旧车 Deposit 不直接改挂到新车；
- 旧车应退款的，按真实 Refund 处理；
- 新车需要 Deposit 时重新记录真实收款；
- 旧收款、旧退款、新收款分别保留；
- 不建立“意向金跨车转移”机制。

---

## 5. Startup Scan 明确暂不偷渡

以下留给后续 Batch 2 / 3 / 4 与 Final 前完整性扫描：

- Deposit 是否继续明确限定“V1 不做在线支付”；
- Deposit 每笔最小字段：金额 / 收款时间 / 方式 / 操作人 / 备注 / 可选凭证；
- Deposit 是否“无独立负责人、只有操作人”与 Current responsibility 表达的关系；
- Deposit correction / reversal 的最终 actor 与 permission；
- Transaction 创建时是否必须“原子结束 Lock”的精确状态转换；
- 同车同一时刻唯一 in-progress Transaction 的完整并发 Guard；
- Transaction 精确主状态集合及 completed/cancelled 历史只读边界；
- Transaction responsible 是否默认继承 Lock responsible、正式交接矩阵；
- completed Transaction 的实际成交价 / 成交时间 / 历史主价格快照；
- Transaction 首次完成权限；
- completed Transaction 成交纠错 actor、permission、原因与审计完整规则；
- Refund `pending/refunded` 与 Current `closed-not-refunded` 的状态模型关系；
- Refund exactly-one-subject、customer/vehicle 链、可退余额、冲突 open case 的完整 Guard；
- Refund 是否无独立负责人以及当前发起 / 确认责任的准确表达；
- pending Refund 对公海保护、refunded / closed 后解除保护的完整矩阵；
- 部分退款、多笔实际退款、退款余额的完整计算与历史；
- 供应异常下 in-progress Transaction 的新增动作 / 完成 / 取消 / 换车边界；
- PDM-19→PDM-20/21/22/23/25 outgoing handoff；
- 其他明确废弃项、9/19 后知情修改、遗漏、冲突与新产品选择。

这些事项未经对应 Batch 分类和用户裁决，不进入当前 Authority。

---

## 6. Startup Gate 结果

- `P19-R00 = USER_APPROVED / APPLIED`
- `STARTUP_GATE = PASS`
- `COMPLETED_PDM_HARD_CONFLICT = 0`
- `INCOMING_HANDOFF_GAP = 0`
- `INCOMING_HANDOFF_ACCEPTED = 10 / 10`
- `BATCH_1 = P19-A01～P19-A14 / PASS / USER_APPROVED / APPLIED`
- `IA / LOW-FI / ENGINEERING = NO_CONSTRUCTION`

当前唯一下一步：

> **P19-A01～P19-A14 已批准并执行。当前唯一下一步：用户审查 Batch 2（P19-B2-01～P19-B2-06）。未经确认不得进入 Batch 3。**


---

## 7. Batch 1 Gate｜PASS

- 用户裁决：`P19-A01～P19-A14 = 全部同意`；
- 执行授权：用户随后明确“确认执行”；
- `BATCH_1 = PASS / USER_APPROVED / APPLIED`；
- 14 条稳定一致规则已进入当前工作 Authority；
- 10 / 10 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工。

---

# 8. Batch 2｜明确废弃 / Superseded / DO_NOT_RESTORE｜PASS / USER_APPROVED / APPLIED

> 状态：`PASS / USER_APPROVED / APPLIED`。  
> 用户裁决：P19-B2-01～P19-B2-06 全部同意；随后以“真执行”明确执行。  
> 反向冲突扫描：`PASS / FALSE_DEPRECATION_COUNT=0`。  
> 原则：只列已经被后续 Authority 明确废弃、替代或禁止恢复的旧模型；不把仍需在 Batch 3 / 4 裁决的权限、Refund closed、责任人等细节误标为废弃。

## P19-B2-01｜Deposit 作为“未结清 / 已结清 / 部分结清”主状态机不得恢复｜USER_APPROVED / APPLIED

历史曾出现把意向金本身做成类似：

- unsettled；
- settled；
- partial；

这类“资金结清状态机”的表达。

当前 Authority 已收口为：

> **Deposit 是一笔或多笔真实收款事实。**

总收款、可退余额、退款进度可以从真实事实计算，但不得把 Deposit 重新建成一套“未结清 / 已结清 / 部分结清”的业务主状态机。

因此旧模型：

> `SUPERSEDED / DO_NOT_RESTORE`

**防误废弃 Guard：**这不禁止展示汇总金额、剩余可退金额或资金处理进度；禁止的是用这些派生结果覆盖真实收款事实。

## P19-B2-02｜Refund 的 `partial` 主状态不得恢复｜USER_APPROVED / APPLIED

历史上容易把“部分退款”设计成 Refund 的独立主状态：

> `partial`

当前 Authority 已明确：

- 部分退款通过多笔实际退款事实表达；
- 已退多少、还可退多少由实际退款记录与可退余额计算；
- 不通过把 Refund 主状态改成 `partial` 来替代真实退款记录。

因此：

> **Refund `partial` 主状态 = DO_NOT_RESTORE。**

**防误废弃 Guard：**“部分退款”这个业务结果仍然存在，只是不作为覆盖真实退款明细的单一主状态。

## P19-B2-03｜Transaction 取消后自动恢复旧 Lock / Waitlist 不得恢复｜USER_APPROVED / APPLIED

不得恢复以下旧耦合：

- Transaction cancelled → 原 Lock 自动 active；
- Transaction cancelled → 原 Waitlist 自动恢复；
- 取消交易直接把原占用链倒放回原状态。

当前规则：

> **Transaction 取消是新的真实终止事实，不复活已经结束的旧 Lock / Waitlist。**

若客户仍需继续购买：

- 重新按当前 Guard 建立新的合法 Lock；
- 再按当前事实进入后续 Transaction。

因此旧“取消交易 = 回滚到旧锁车状态”模型：

> `SUPERSEDED / DO_NOT_RESTORE`

## P19-B2-04｜独立“换车状态机 / 换车关系对象”不得恢复｜USER_APPROVED / APPLIED

历史上曾存在把“换车”建设为单独业务状态机 / 专用关系对象的方向。

R8 后续 Authority 已明确：

> **V1 不建设独立换车状态机。**

换车按真实业务事实处理：

- 原车 Lock / Transaction 真实结束或取消；
- 原车资金与交易历史保留；
- 新车重新建立新的 Lock / Transaction / Deposit。

因此旧专用“换车状态机 / 换车对象”：

> `RULE_RETAINED_AS_DO_NOT_RESTORE_OLD_CHANGE_CAR_MODEL`

**防误废弃 Guard：**换车业务场景仍然支持；废弃的是额外独立状态机，不是废弃“换车”这件业务。

## P19-B2-05｜旧 Deposit 跨车直接转移 / 改挂不得恢复｜USER_APPROVED / APPLIED

不得恢复以下做法：

- 把旧车 Deposit 的 vehicle_id 直接改成新车；
- 把旧收款记录“转移”到新车后让旧车看起来没有收过款；
- 用一条“转车”动作覆盖旧收款 / 退款 / 新收款事实。

当前规则：

- 旧车 Deposit 永久保留在旧业务链；
- 应退款则形成真实 Refund；
- 新车需要意向金则重新记录新的 Deposit；
- 旧收款、旧退款、新收款分别可追溯。

因此“Deposit 跨车转挂”：

> `SUPERSEDED / DO_NOT_RESTORE`

## P19-B2-06｜通过删除 / 覆盖原事实完成资金或成交纠错不得恢复｜USER_APPROVED / APPLIED

不得恢复：

- 错收 Deposit → 直接改金额或删除原记录；
- 成交录错 → 直接覆盖 completed Transaction；
- 退款录错 → 删除原退款后当作从未发生；
- 用最终正确值覆盖整个历史链。

当前 Authority 要求：

> **更正 / 冲正 / 成交纠错采用追加事实，原事实保留。**

因此“overwrite / delete-as-correction”：

> `SUPERSEDED / DO_NOT_RESTORE`

后续 Batch 3 / 4 再裁定：

- 谁可以执行 correction；
- 是否需要 reason；
- 具体 permission；
- 审计最小字段。

本条只冻结：**纠错不能靠抹掉原事实。**

### 8.1 Reverse Conflict Scan

本轮没有把以下仍有效或仍待裁决的能力误判为废弃：

- Deposit 多笔真实收款；
- 线下实际退款；
- 部分退款业务结果；
- Refund pending；
- Current 中可能存在的 `closed-not-refunded`；
- Transaction 首次完成；
- Transaction completed / cancelled；
- 成交纠错；
- Deposit correction / reversal；
- Transaction / Refund responsibility；
- 合法换车业务；
- actual成交价历史；
- System Admin / 经理 / 店长的具体权限边界。

因此：

- `FALSE_DEPRECATION_COUNT = 0`
- `BATCH_2_CONFLICT_SCAN = PASS`

当前唯一下一步：

> **P19-B2-01～P19-B2-06 已批准并执行。当前唯一下一步：用户审查 Batch 3（P19-B3-01～P19-B3-03）。未经确认不得进入 Batch 4。**


---

## 8.2 Batch 2 Gate｜PASS

- `P19-B2-01～P19-B2-06 = PASS / USER_APPROVED / APPLIED`；
- Reverse Conflict Scan = `PASS`；
- `FALSE_DEPRECATION_COUNT = 0`；
- 10 / 10 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工。

---

# 9. Batch 3｜后续明确新增 / 明确变更候选

> 状态：`PENDING_USER_REVIEW`。  
> Conflict Isolation：`PASS / MISCLASSIFIED_PRODUCT_CHOICE=0`。  
> 原则：只收录 Phase 1.5 / Current 已明确冻结、且不需要重新做产品取舍的新增 / 变更；真正冲突、遗漏、模型映射选择全部留 Batch 4。

## P19-B3-01｜Transaction 首次完成采用独立敏感权限

Phase 1.5 / Current 已明确新增 Transaction 首次完成控制：

- 普通销售不得首次完成 Transaction；
- 必须由经理 / 店长执行；
- 同时必须具备独立 `transaction-complete` 类完成权限；
- 职位本身不自动等于拥有该敏感权限；
- 提交时继续重验 active identity、permission、data scope、Transaction 当前状态；
- System Admin 独立身份不因为系统管理身份获得该员工业务能力。

因此：

> **“创建 / 负责 Transaction”与“首次完成 Transaction”是两类不同能力。**

这不改变 P19-A04：Transaction 仍必须来源于合法 Lock。

**依据：**Current IA `IA-09`、CO-O19、角色入口矩阵。

## P19-B3-02｜Deposit 纠错采用追加冲正 / 更正，并独立分权

Phase 1.5 / Current 已明确追加资金纠错规则：

- 原始 Deposit 收款事实永久保留；
- 误记资金不得直接覆盖 / 删除；
- 纠错通过追加 reversal / correction 事实；
- 仅具备资金纠错权限、且 data scope 覆盖对象的经理 / 店长可执行；
- 普通销售记录真实收款的能力，不等于拥有资金纠错权限；
- 纠错原因必填；
- 审计至少保留 actor / time / reason 与原事实关联；
- 不做“改完后原 Deposit 消失”的覆盖式处理。

因此：

> **收款记录能力与资金纠错能力正式分离。**

**依据：**Phase 1.5 D10、Current IA `IA-10`、CO-O18、M14-003。

## P19-B3-03｜pending Refund 增加“撤回 / 关闭但未退款”合法退出路径

R8 原本只冻结退款主业务状态 `pending / refunded`。Phase 1.5 D11 后续明确新增：

- 尚未实际退款的 pending Refund，可以由具备退款管理权限且 data scope 覆盖对象的经理 / 店长撤回 / 关闭；
- close 必须记录 reason；
- 保留来源、操作者、时间与原 pending 申请历史；
- close **不等于 refunded**；
- close 不得计入已退款金额；
- close 不改变 vehicle occupancy；
- 原 Refund 申请不得被删除。

因此：

> **pending Refund 除“实际退款完成”外，新增了合法的“未退款关闭”退出路径。**

本条只冻结“存在这个合法退出动作及其真实语义”。

**明确不在本条偷裁：**

- `closed_not_refunded` 最终是独立 Domain 主状态、终止结果字段还是历史 outcome；
- Page State 的 `PROCESSING / COMPLETED / CLOSED` 如何映射到 Domain `pending / refunded`；
- 数据库是否使用 `closed` 状态值。

这些属于当前证据明确存在的模型表达冲突，留 Batch 4 正式裁决。

**依据：**Phase 1.5 D11、Current IA `IA-11`、CO-O20、M14-005。

### 9.1 Conflict Isolation

以下事项**没有**偷渡进 Batch 3：

- `closed_not_refunded` 的 Domain 状态 / 历史 outcome 最终建模；
- Transaction 创建时是否必须在同一原子事务中关闭原 Lock 的完整事务表达；
- 同一 Vehicle 同时唯一 in-progress Transaction 的并发 Guard；
- Transaction 精确主状态、终态只读与 `biz_status→trading`；
- Transaction responsible 默认继承 Lock responsible 及离职 / 失效交接矩阵；
- completed Transaction 的实际成交价作为历史主价格；
- completed Transaction 成交纠错的完整 actor / permission / System Admin / 无二级审批规则；
- Deposit 每笔最小字段、V1 不做在线支付、无独立负责人语义；
- Refund exactly-one-subject、可退余额、单 open case、组合一致性；
- Refund “无独立负责人”与当前责任发起 / 确认关系；
- pending Refund 公海保护及 refunded / closed 后解除保护矩阵；
- 多笔实际退款余额与并发；
- 供应异常下 in-progress Transaction 的完整处理；
- 4S Member / System Admin 在 PDM-19 各敏感动作的完整负向矩阵。

其中，**Transaction 成交纠错中“旧 System Admin 可参与”已被后续规则明确替代**，但该遗漏未在已批准的 Batch 2 中增加新原子，因此不会在本次执行中静默补批；将作为 Batch 4 明确遗漏项提交用户裁决 / 确认。

因此：

- `NEW_INDEPENDENT_ATOMS = 3`
- `DUPLICATE_RULE_CREATION = 0`
- `MISCLASSIFIED_PRODUCT_CHOICE = 0`
- `BATCH_3 = P19-B3-01～P19-B3-03 / PENDING_USER_REVIEW`

当前唯一下一步：

> **用户审查 P19-B3-01～P19-B3-03。未经确认不得进入 Batch 4。**
