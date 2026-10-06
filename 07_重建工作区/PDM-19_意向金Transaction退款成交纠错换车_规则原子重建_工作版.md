# PDM-19｜意向金 / Transaction / Refund / 成交纠错 / 换车｜规则原子重建工作版

> 当前状态：`COMPLETE / INTEGRITY_PASS`  
> 核心定位：`P19-R00 / USER_APPROVED / APPLIED`  
> Incoming Handoff：10 / 10 `HANDOFF_CLOSED / SOURCE_BACKWRITE_DONE`  
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
- 历史 R8 底盘曾为 `pending / refunded`；该状态模型已被后续 P19-B4-01 / 1A 正式扩展为 `pending / refunded / closed`，其中 `closed`=未退款关闭；
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

# 9. Batch 3｜后续明确新增 / 明确变更｜PASS / USER_APPROVED / APPLIED

> 状态：`PASS / USER_APPROVED / APPLIED`。  
> 用户裁决：P19-B3-01～P19-B3-03 全部同意；P19-B3-03 按用户简化口径修订；随后明确“确认执行”。  
> Conflict Isolation：`PASS / MISCLASSIFIED_PRODUCT_CHOICE=0`。  
> 原则：只收录 Phase 1.5 / Current 已明确冻结、且不需要重新做产品取舍的新增 / 变更；真正冲突、遗漏、模型映射选择全部留 Batch 4。

## P19-B3-01｜Transaction 首次完成采用独立敏感权限｜USER_APPROVED / APPLIED

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

## P19-B3-02｜Deposit 纠错采用追加冲正 / 更正，并独立分权｜USER_APPROVED / APPLIED

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

## P19-B3-03｜pending Refund 确定不再退款时可直接关闭｜USER_REVISED / USER_APPROVED / APPLIED

用户在 Batch 3 审查中明确将原 Phase 1.5 D11 的复杂关闭权限口径简化为：

- Refund 仍处于 pending；
- 后续确认这笔退款不再继续；
- 当前合法可处理该 Refund 的业务人员可以直接执行“关闭”；
- 关闭时填写一个关闭原因；
- 不再额外增加独立“退款关闭权限”；
- 不要求额外审批 / 二级确认；
- 原 Refund 申请与历史保留；
- 关闭 **不等于 refunded**；
- 关闭金额不计入已退款金额；
- 关闭本身不占用 Vehicle。

因此当前正式产品口径：

> **pending Refund 不再退款时，可直接关闭，填写原因并保留历史即可。**

权限继续服从 PDM-02 的统一底层边界：

> active identity + 当前已有业务 permission/capability + data scope + object state

但 **不为“关闭 pending Refund”再新增一层专门 permission**。

本条用户新裁决覆盖 Current IA / Phase 1.5 中“必须具备独立 refund-management permission 才能关闭”的过度复杂 carrier 表达；IA / Low-Fi 当前不施工，后续统一 alignment。

该模型冲突已经由 P19-B4-01 / 1A 正式解决：

- `closed` 作为 Refund 第三个主状态；
- `closed` 表示未实际退款而关闭；
- Page State / DB carrier 后续必须映射到该业务 Authority，不得再把 closed 当 refunded。

### 9.1 Conflict Isolation

以下事项**没有**偷渡进 Batch 3：

- `closed_not_refunded` 的 Domain 状态 / 历史 outcome 最终建模（已由 P19-B4-01 / 1A 解决为 `closed` 主状态）；
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
- `BATCH_3 = P19-B3-01～P19-B3-03 / PASS / USER_APPROVED / APPLIED`

当前唯一下一步：

> **P19-B3-01～P19-B3-03 已批准并执行；B3-03 采用用户简化关闭口径。当前唯一下一步：用户审查 Batch 4（P19-B4-01～P19-B4-11）。**


---

## 9.2 Batch 3 Gate｜PASS

- `P19-B3-01 = PASS / USER_APPROVED / APPLIED`；
- `P19-B3-02 = PASS / USER_APPROVED / APPLIED`；
- `P19-B3-03 = USER_REVISED / PASS / USER_APPROVED / APPLIED`；
- B3-03 用户最终口径：pending Refund 不再退款时可直接关闭，只填写原因；不新增专门关闭 permission，不增加审批；
- Batch 3 当前未决项 = 0；
- 10 / 10 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工。

---

# 10. Batch 4｜冲突 / 遗漏 / 缺口 / 新产品选择｜PASS / USER_APPROVED / APPLIED

> 状态：`PASS / USER_APPROVED / APPLIED / CHOICES=1A,2A,3A,4A,5A,6A,7A,8A,9A,10A,11A`。  
> 用户裁决：`1A～11A`；随后明确“确认执行”。  
> Cross-PDM Conflict Review：`PASS / completed PDM 不静默改写，差异通过 Final 前 repair / handoff 承接`。  
> 所有权限类动作继续服从 PDM-02 已完成 Authority：identity + permission/capability + data scope + object state；4S hard DENY / System Admin 控制平面边界不得被 PDM-19 静默绕过。

## P19-B4-01｜Refund “关闭但未退款”最终状态怎么表达｜CHOICE=A / USER_APPROVED / APPLIED

你已经确认业务动作：

> **pending Refund 确定不再退款时，直接关闭，填写原因即可。**

现在只剩状态模型要收口。

### A｜推荐
Refund 当前主状态统一为：

- `pending`
- `refunded`
- `closed`

其中：

- `closed` = 未实际退款而关闭；
- 必须有 close_reason；
- 不计入 refunded_amount；
- 原 pending 历史保留；
- 不新增专门关闭 permission / 审批；
- 已 closed 不再回 pending；如以后重新需要退款，重新建立新的合法 Refund。

### B
仍只保留 `pending / refunded` 两个主状态，`closed_not_refunded` 另做 outcome / 历史结果字段。

**推荐：A。**产品和工程都更直观，也符合你刚才“不要搞复杂”的方向。

---

## P19-B4-02｜创建 Transaction 时如何结束原 Lock｜CHOICE=A / USER_APPROVED / APPLIED

### A｜推荐
创建 / 复用首笔 in-progress Transaction 的最终提交必须原子完成：

1. 重验当前 active Lock；
2. 校验 Customer / Vehicle / listing_cycle 一致；
3. 创建 Transaction；
4. 原 Lock 结束为 `converted_to_transaction` 类真实原因；
5. Vehicle 当前业务占用转为 Transaction / trading；
6. 原 Lock、价格快照、Deposit 历史全部保留。

任一步失败：

> **整组不提交，不能出现“Lock 已关但 Transaction 没建成”。**

### B
允许先结束 Lock，再异步创建 Transaction。

**推荐：A。**避免交易链断裂。

---

## P19-B4-03｜Transaction 主状态与同车并发｜CHOICE=A / USER_APPROVED / APPLIED

### A｜推荐
Transaction 主状态只保留：

- `in_progress`
- `completed`
- `cancelled`

并冻结：

- 同一 Vehicle 同一时刻最多一笔 in-progress Transaction；
- completed / cancelled 为终态历史；
- 成交纠错通过 correction 事实，不把 completed 改回 in_progress；
- cancelled 不复活旧 Lock / Waitlist；
- 取消后车辆是否重新开放，按真实 source / listing_cycle / 当前其他占用重新计算。

### B
允许同车同时多笔进行中 Transaction，或增加更多可反复跳转的主状态。

**推荐：A。**

---

## P19-B4-04｜Transaction responsible 如何确定｜CHOICE=A / USER_APPROVED / APPLIED

### A｜推荐
- Transaction 创建时默认继承来源 Lock 的 responsible；
- Customer current owner 后续变化，不自动漂移 Transaction responsible；
- responsible inactive / 离职 / 失去合法资格时，必须正式 handoff；
- handoff 保留 old responsible / new responsible / actor / time / reason；
- 历史 completed/cancelled Transaction 保留发生时责任事实。

### B
Transaction responsible 永远实时跟随 Customer current owner。

**推荐：A。**与 PDM-17/PDM-18 的“业务责任与 owner 分层”一致。

---

## P19-B4-05｜成交完成后的真实成交价与历史主价格｜CHOICE=A / USER_APPROVED / APPLIED

### A｜推荐
首次 completed 时至少冻结：

- actual_deal_price；
- completed_at；
- transaction_responsible；
- Customer 的真实购车事实；
- 当前 Transaction / Vehicle / listing_cycle 关联。

并且：

> **actual_deal_price 是该笔 completed Transaction 的历史主价格。**

后续：

- 列表价变化；
- 客户展示价变化；
- 批发价变化；
- source_type 变化；

均不得回写成交历史价格。

### B
成交历史继续引用车辆当前列表价 / 展示价，不单独冻结实际成交价。

**推荐：A。**

---

## P19-B4-06｜completed Transaction 成交纠错权限｜CHOICE=A / USER_APPROVED / APPLIED

### A｜推荐
- 普通销售不得纠正 completed Transaction；
- 经理 / 店长也不是仅凭职位自动可纠错；
- 必须具备独立 transaction-correction permission + 合法 data scope；
- 纠错原因必填；
- 采用追加 correction 事实，原成交永久保留；
- 不做二级审批；
- System Admin 控制平面身份本身无成交纠错业务权；
- 4S Member 不得进入名邦 Customer Transaction 成交纠错链。

### B
当前 Transaction responsible 可以直接修改已成交结果，或 System Admin 可直接修正。

**推荐：A。**同时正式关闭历史“System Admin 可参与成交纠错”的旧残留。

---

## P19-B4-07｜Deposit 每笔收款最小字段与 V1 支付边界｜CHOICE=A / USER_APPROVED / APPLIED

历史规则曾要求备注也必填。结合当前 V1 和你的简化偏好：

### A｜推荐
同一 Lock 可以有多笔 Deposit；每笔必填：

- amount；
- received_at；
- payment_method；
- operator。

可选：

- note；
- voucher / 凭证。

同时：

- V1 只记录线下真实收款事实，不建设在线支付；
- Deposit 无独立 responsible，只记录真实 operator；
- 总意向金由多笔有效收款 / correction 事实派生。

### B
恢复旧规则：除上述字段外，note 也强制必填。

**推荐：A。**保留可追溯性，同时减少无意义必填。

---

## P19-B4-08｜Refund 创建与金额完整性 Guard｜CHOICE=A / USER_APPROVED / APPLIED

### A｜推荐
每笔 Refund 必须且只能绑定一个 subject：

> **Lock XOR Transaction**

Lock 侧 Refund：

- 必须存在有效可退 Deposit；
- 尚未存在 owning Transaction。

一旦 Transaction 已建立：

> 后续退款归 Transaction，不再归旧 Lock。

Transaction 侧 Refund：

- Transaction 已 completed 或 cancelled；
- refundable_balance > 0。

所有 Refund：

- customer_id 与 subject 一致；
- Vehicle / listing_cycle 业务链一致；
- amount > 0 且不得超过当前 refundable_balance；
- 不允许同一范围存在冲突的 pending Refund；
- 最终提交原子重验，防止并发超退。

### B
只要员工确认“应该退”，允许不绑定明确 subject，也不强制余额 Guard。

**推荐：A。**

---

## P19-B4-09｜Refund 发起、实际退款确认与“直接关闭”三类动作分层｜CHOICE=A / USER_APPROVED / APPLIED

### A｜推荐
1. **发起 Refund**：当前合法业务 / Transaction responsible 在 scope 内可发起；
2. **确认真实退款已发生**：属于真实资金动作，由具备现有资金/退款确认 permission 且 scope 合法的经理 / 店长确认；
3. **pending 后决定不再退款**：按你已确认的 B3-03，当前合法可处理该 Refund 的业务人员直接关闭 + 填原因，**不新增专门 close permission，不走额外审批**；
4. Refund 本身不再另设“永久 responsible”字段，以真实 initiator / operator / actor 历史表达。

### B
发起、真实退款确认、关闭全部由同一人无差别处理，不区分真实资金确认动作。

**推荐：A。**只对“真的钱已经退了”保留资金确认边界；“不退了直接关”保持简单。

---

## P19-B4-10｜pending Refund、公海保护与部分退款｜CHOICE=A / USER_APPROVED / APPLIED

### A｜推荐
- pending Refund 是未完成业务责任，保护 Customer 不直接进入公海；
- pending Refund **不占 Vehicle**；
- Refund `refunded` 后，该 Refund 本身不再提供公海保护；
- Refund `closed` 后同样解除该 Refund 的保护；
- 若还有其他未完成业务责任，仍按 PDM-17 继续保护；
- 部分退款不建 `partial` 主状态；
- 多次部分退款 = 多笔真实退款事实；
- refundable_balance 由 Deposit / correction / 已退款事实派生；
- 每次真实退款原子检查余额，不允许累计超退。

### B
pending Refund 不作为公海保护；或恢复 `partial` 主状态。

**推荐：A。**

---

## P19-B4-11｜供应异常下进行中的 Transaction 怎么处理｜CHOICE=A / USER_APPROVED / APPLIED

### A｜推荐
Vehicle 已进入 in-progress Transaction 后出现上游失效 / 供应异常：

- 不自动取消 Transaction；
- 不删除 Lock / Deposit / Transaction 历史；
- 记录独立 supply_anomaly 事实；
- 若核实后 Vehicle 仍真实可售，可继续原 Transaction；
- 若核实为真实不可售，则**不得按正常成交直接 completed**；
- 由当前合法 responsible 根据真实情况选择：
  - cancel Transaction；
  - 换车（旧链结束，新车新建）；
  - 需要时发起 Refund；
- 供应异常本身不得伪造成普通 Transaction cancel 或普通 Lock expiry。

### B
一出现供应异常就自动取消 Transaction，并自动释放 / 回滚整个业务链。

**推荐：A。**

---

## 10.1 Batch 4 Cross-PDM / Carrier 影响登记

若采用推荐 A 组合：

- PDM-18 继续保持 Lock → Transaction 的 Authority 边界；PDM-19 只承接进入 Transaction 后的交易/资金事实；
- PDM-17 承接 pending Transaction / Refund 的公海保护消费；
- PDM-02 继续提供统一权限模型、4S hard DENY、System Admin 控制平面边界；
- PDM-20 承接客户端成交 / 退款历史必要投影；
- PDM-21 承接员工端 Deposit / Transaction / Refund 操作；
- PDM-22 承接 PC 业务后台 carrier；
- PDM-23 只承接必要通知，不改变资金/交易状态；
- PDM-25 承接审计、幂等、并发、资金余额、事务一致性测试；
- Current IA 中“pending Refund 关闭必须独立 refund-management permission”的 carrier 将登记为 stale，后续统一 alignment；当前不施工。

当前唯一下一步：

> **P19-B4-01～P19-B4-11 已按 1A～11A 批准并执行。Final 前完整性复核 R1 = REPAIR_REQUIRED；当前唯一下一步：用户审查 P19-LIA-01～P19-LIA-06。**


---

## 10.2 Batch 4 Gate｜PASS

- 用户裁决：`1A、2A、3A、4A、5A、6A、7A、8A、9A、10A、11A`；
- 用户随后明确“确认执行”；
- `P19-B4-01～P19-B4-11 = PASS / USER_APPROVED / APPLIED`；
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`；
- B3-03 的“pending Refund 直接关闭 + 填原因”已与 B4-01/B4-09 正式合并：`closed` 是未退款关闭，不新增专门 close permission；
- 10 / 10 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工。

---

# 11. Final 前完整性复核 R1

> 报告：`07_重建工作区/PDM-19_Final前完整性复核_R1_2026-10-06.md`  
> 结果：`REPAIR_REQUIRED`。  
> Final candidate：`NOT_READY`。

本轮 Source→Atom / Cross-PDM / Semantic Detail 复核发现 6 组需要在 Final 前补齐的规则 / handoff：

## P19-LIA-01｜误成交纠错不得制造假重新上架 / 假新 cycle

历史 DEC-062 / Phase 1.5 HR-07 已明确：

如果 completed 只是误操作，而 Vehicle 事实上**从未真实不可售**：

- 成交纠错后恢复真实可售事实；
- 继续原 `listing_cycle`；
- 不创建新 cycle；
- 不增加 `today-new`；
- 不更新“最新上架”排序时间；
- 不因为纠错重新置顶；
- 原 cycle 已存在的合法价格 / 查价权益继续；
- 客户不因系统纠错重复解锁 / 重复扣额度；
- 旧 Lock / Waitlist 不复活。

只有 Vehicle **真实经历不可售 / 下架后再真实可售**：

> 才按正常 relist 建立新的 listing_cycle。

P19-B4-06 已冻结“成交纠错 append-only”，但尚未完整承接这一 listing_cycle 后果，因此 Final 前必须补齐。

## P19-LIA-02｜in-progress Transaction 的正常取消动作与 Vehicle 重算边界

Current / 历史规则已明确：

- 只有尚未 completed 的 `in_progress` Transaction 才走正常 cancel；
- 当前合法 Transaction responsible 可在统一 permission/scope/object-state Guard 下执行正常取消；
- completed Transaction 不走普通 cancel，应走 P19-B4-06 的成交纠错；
- cancel 后 Transaction 进入 `cancelled` 终态历史；
- 不复活旧 Lock / Waitlist；
- 车辆业务占用解除后，能否重新进入后续业务只按真实 source state、当前 listing_cycle、当前其他占用重新计算；
- 不得因为 Transaction cancel 强制改写 `source_status` / `platform_visibility`，也不得制造假 relist。

本条只补正常取消的业务边界，不新增新的取消审批层。

## P19-LIA-03｜真实 Deposit 的记录入口与 correction 权限必须分离

B4-07 已冻结 Deposit 字段 / 线下收款边界，B3-02 已冻结 correction 权限，但还缺创建入口的明确分层：

- 当前合法业务负责人可记录**真实已发生收款**；
- 同一 Lock 可以记录多笔 Deposit；
- Deposit 本身不另设独立 responsible，只记录每笔真实 operator；
- “记录真实收款”不等于“资金纠错”；
- 普通合法收款记录能力不得自动获得 B3-02 的资金 correction 权；
- correction 继续由具备独立资金纠错 permission + scope 的经理 / 店长执行；
- 总额继续由有效 Deposit + correction 事实派生。

## P19-LIA-04｜实际当场全额退款可直接形成 refunded，不强制造假 pending

历史 Refund 规则明确：

- 如果实际退款已经当场完成，可直接记录真实退款并进入 `refunded`；
- 不要求为了流程形式先制造一个短暂假的 `pending`；
- 如果只是发起退款、钱还没有真正退，则为 `pending`；
- `pending` 后实际退款完成 → `refunded`；
- `pending` 后决定不再退款 → 按 B3-03 / B4-01 进入 `closed` 并填写原因；
- `closed` 不得用于已经真实退款的场景。

本条确保状态反映真实资金事实，而不是为了界面步骤制造虚假中间状态。

## P19-LIA-05｜Transaction completed 不自动结束 Customer 的 Demand

PDM-11 Final 已正式冻结：

> 一笔 Transaction completed，只完成该 Transaction 与真实成交事实，不自动把同一 Customer 的全部 Demand 批量 completed / cancelled。

即使 Transaction 与某条 Demand 有关联：

- 也必须按该 Demand 的真实服务目标由 PDM-11 Authority 决定是否结束；
- PDM-19 不得用“已成交”事件直接批量改写 Demand；
- 这与 P19-A11“Transaction 不自动结束 Consultation”属于同类跨对象边界。

Startup Gate 未将 PDM-11→PDM-19 作为正式 incoming handoff 登记，因此 Final 前需补这条 completed-PDM invariant / alignment，防止 Transaction 引擎越权改写 Demand。

## P19-LIA-06｜Outgoing Handoff + stale carrier / cross-PDM alignment

Final 前必须正式登记 PDM-19 outgoing handoff：

- **PDM-19 → PDM-20**：客户端“我的交易 / 退款 / 意向金”安全投影；Transaction 状态、时间、车辆摘要、当前负责人、客户自身资金事实；换车新旧业务只做安全关联说明，不暴露内部敏感字段；
- **PDM-19 → PDM-21**：员工端 Deposit 记录 / correction、Transaction 创建/完成/取消/纠错、Refund 发起/真实退款确认/直接关闭、供应异常处理；员工车辆列表占用投影继续遵守“交易中 > 已锁定”且不在 Feed 泄露客户姓名/手机号/资金金额；
- **PDM-19 → PDM-22**：PC P07 Deposit / Transaction / Refund 真实业务管理 carrier；Dashboard 的进行中 Transaction / 资金待办统计口径；
- **PDM-19 → PDM-23**：重要 Transaction / Refund 状态变化的通知 carrier；通知失败只记日志，不得改变交易/资金事实；
- **PDM-19 → PDM-25**：Deposit/Transaction/Refund/correction 的统一审计、幂等、并发、可退余额、唯一 in-progress Transaction、Refund 防超退、原子 Lock→Transaction、终态只读 / append-only correction 测试。

同时登记 stale/alignment：

1. Current IA 中“pending Refund 关闭必须额外独立 refund-management permission”的 carrier 已被用户 B3-03 主动简化，标记 `STALE_CARRIER`；
2. Current / 历史仅 `pending/refunded` 的 Refund 状态 carrier 已被 B4-01 扩展为 `pending/refunded/closed`；
3. 旧“System Admin 可参与 completed Transaction 纠错”的残留已被 B4-06 明确覆盖；
4. 客户端 / 员工端 / PC 当前通用壳不得反向覆盖 PDM-19 当前 Authority；
5. IA / Low-Fi 当前阶段不直接施工，统一留 PDM-25 后全局 Alignment。

---

## 11.1 R1 结论

- `PDM19_PREFINAL_R1 = REPAIR_REQUIRED`
- `MISSING_RULE_UNRESOLVED = 3`
- `SEMANTIC_DETAIL_GAP_UNRESOLVED = 2`
- `CROSS_PDM_ALIGNMENT_GAP = 1`
- `OUTGOING_HANDOFF_GAP = 1_GROUP`
- `COMPLETED_PDM_HARD_CONFLICT = 0`
- `INCOMING_HANDOFF_GAP = 0`
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`
- `REPAIR_ATOMS = P19-LIA-01～P19-LIA-06`
- `FINAL_CANDIDATE_READY = false`

当前唯一下一步：

> **P19-LIA-01～P19-LIA-06 已全部批准并执行；Final 前完整性复核 R2 = PASS / FINAL_CANDIDATE_READY。当前唯一下一步：用户最终审查 PDM-19 最终完整规则总览。**


---

# 12. Final 前 R1 修复｜PASS / USER_APPROVED / APPLIED

> 用户裁决：`P19-LIA-01～P19-LIA-06 = 全部同意`；随后以“Chair and.”语境明确执行，按既定 ASR 规则视为“确认执行”。  
> 状态：`PASS / USER_APPROVED / APPLIED`。

## P19-LIA-01｜误成交纠错不得制造假重新上架 / 假新 cycle｜USER_APPROVED / APPLIED

如果 completed Transaction 只是系统 / 业务误操作，而 Vehicle 从未真实不可售：

- correction 后恢复真实可售事实；
- 继续原 `listing_cycle`；
- 不建立新 cycle；
- 不增加 `today-new`；
- 不改变“最新上架”排序时间；
- 不重新置顶；
- 原 cycle 已形成的合法价格 / 查价权益继续；
- 客户不因系统纠错重复解锁 / 重复扣额度；
- 旧 Lock / Waitlist 不复活。

只有 Vehicle **真实经历不可售 / 下架，之后再真实可售**：

> 才按正常 relist 建立新的 listing_cycle。

因此：

> **Transaction correction 只纠正错误成交事实，不伪造新的真实上架事件。**

## P19-LIA-02｜in-progress Transaction 正常取消与 Vehicle 重算边界｜USER_APPROVED / APPLIED

普通 cancel 只适用于尚未 completed 的 `in_progress` Transaction：

- 当前合法 Transaction responsible 可在统一 identity + permission/capability + data scope + object state Guard 下执行；
- completed Transaction 不走普通 cancel，必须走 P19-B4-06 correction；
- cancel 后 Transaction 进入 `cancelled` 终态历史；
- 不复活旧 Lock；
- 不复活旧 Waitlist；
- Vehicle 后续能否继续进入业务，只读取真实 source state、当前 listing_cycle、当前其他 occupancy；
- cancel 不强制改写 `source_status`；
- cancel 不强制改写 `platform_visibility`；
- cancel 不制造假 relist / 假新 cycle。

本条不新增额外取消审批层。

## P19-LIA-03｜真实 Deposit 记录入口与资金 correction 权限分离｜USER_APPROVED / APPLIED

当前合法业务 responsible 可以记录**已经真实发生**的线下 Deposit 收款：

- 同一合法 Lock 可有多笔 Deposit；
- 每笔继续遵守 P19-B4-07 的 amount / received_at / payment_method / operator 最小字段；
- Deposit 本身不设置 independent responsible，只保存真实 operator；
- “记录真实收款”与“纠正资金错误”是不同能力；
- 普通合法收款记录能力，不自动获得 Deposit correction 权；
- correction 继续由具备独立资金纠错 permission + scope 的经理 / 店长执行；
- correction 必填原因、append-only，原收款保留；
- Deposit 总额由有效收款 + correction / reversal 事实派生。

## P19-LIA-04｜实际当场全额退款可直接 refunded，不强制造假 pending｜USER_APPROVED / APPLIED

Refund 状态必须跟随真实资金事实：

- 实际退款已经当场完成，可直接记录真实退款并进入 `refunded`；
- 不要求为了流程形式先制造一个瞬时假的 `pending`；
- 钱尚未实际退，只是进入退款处理 → `pending`；
- pending 后真实退款完成 → `refunded`；
- pending 后决定不再退款 → 按 P19-B3-03 / B4-01 进入 `closed` 并填写 close_reason；
- `closed` 不得用于已经真实退款的场景；
- `refunded` / `closed` 均保留原 Refund 历史，不覆盖源 Deposit / Transaction。

## P19-LIA-05｜Transaction completed 不自动结束 Customer 的 Demand｜USER_APPROVED / APPLIED

PDM-11 Final 的 completed-PDM invariant 正式承接：

- 一笔 Transaction completed，只完成该 Transaction 与真实购车事实；
- 不自动把同一 Customer 的所有 Demand 批量 completed / cancelled；
- 即使 Transaction 与某条 Demand 有关联，也由 PDM-11 根据该 Demand 的真实服务目标决定是否结束；
- PDM-19 不得把“已成交”事件当作跨 Customer 全部 Demand 的批量终止器；
- 与 P19-A11“Transaction 不自动结束 Consultation”保持同一跨对象边界。

## P19-LIA-06｜Outgoing Handoff + stale carrier / cross-PDM alignment｜USER_APPROVED / APPLIED

### Outgoing handoff 已正式登记

- `HO-P19-P20-001`｜客户端我的交易 / Deposit / Refund 安全投影；
- `HO-P19-P21-001`｜员工端资金、Transaction、Refund、correction、供应异常操作；
- `HO-P19-P22-001`｜PC P07 资金/交易管理与 Dashboard 统计 carrier；
- `HO-P19-P23-001`｜Transaction / Refund 重要状态通知，通知不得反写业务事实；
- `HO-P19-P25-001`｜资金/交易统一审计、幂等、并发、余额、防超退、原子转换、终态历史测试。

以上均保持：

> `HANDOFF_OPEN`

直到目标 PDM 承接。

### Stale carrier / Alignment

正式登记并延后到 PDM-25 后统一对齐：

1. Current IA 中“pending Refund 关闭必须额外独立 refund-management permission”已被 P19-B3-03 用户主动简化；
2. 旧 Refund 只有 `pending/refunded` 的 carrier 已被 P19-B4-01 扩展为 `pending/refunded/closed`；
3. 旧“System Admin 可参与 completed Transaction correction”的残留已被 P19-B4-06 覆盖；
4. 客户端 / 员工端 / PC 通用状态壳不得反向覆盖本 PDM Authority；
5. IA / Low-Fi 当前阶段不施工，统一进入 PDM-25 后全局 Alignment。

---

## 12.1 R1 Repair Gate｜PASS

- `P19-LIA-01～P19-LIA-06 = PASS / USER_APPROVED / APPLIED`；
- `R1_REPAIR_CLOSED = 6 / 6`；
- outgoing handoff = 5 条 `HANDOFF_OPEN`；
- stale carrier 已登记，当前不施工；
- 10 / 10 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工。

---

# 13. Final 前完整性复核 R2｜PASS

> 报告：`07_重建工作区/PDM-19_Final前完整性复核_R2_2026-10-06.md`

结果：

- `SOURCE_TO_ATOM = PASS`
- `ATOM_TO_SOURCE = PASS`
- `SEMANTIC_COMPLETENESS = PASS`
- `MISSING_RULE_UNRESOLVED = 0`
- `SEMANTIC_DETAIL_GAP_UNRESOLVED = 0`
- `COMPLETED_PDM_INVARIANT_CONFLICT = 0`
- `INCOMING_HANDOFF_GAP = 0`
- `OUTGOING_HANDOFF_GAP = 0`
- `NEGATIVE_CLAIMS_VERIFIED = PASS`
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`
- `PDM19_FINAL_CANDIDATE_READY = YES`

当前唯一下一步：

> **用户最终审查 `07_重建工作区/PDM-19_最终完整规则总览_待用户批准.md`。最终批准前不得发布 PDM-19 Final、不得关闭 10 条 incoming handoff、不得 source backwrite、不得进入 PDM-20。**


---

# 14. Final Closeout｜COMPLETE

用户已最终批准并确认执行。

- 正式 Authority：`07_重建工作区/PDM-19_最终完整规则.md`；
- Final Integrity：`07_重建工作区/PDM-19_最终完整性复核_2026-10-06.md / PASS`；
- 41 个正式规则 / 用户裁决单元全部进入 Final；
- 10 / 10 incoming handoff = `HANDOFF_CLOSED / SOURCE_BACKWRITE_DONE`；
- 来源 PDM-01 / 02 / 03 / 04 / 07 / 13 / 14 / 15 / 17 / 18 Final 已反向回写；
- 5 条 outgoing handoff 继续 `HANDOFF_OPEN`；
- PDM-19 = `COMPLETE / INTEGRITY_PASS`；
- 下一步：PDM-20 Startup Gate；
- IA / Low-Fi / Engineering 未施工。

当前唯一下一步：

> **PDM-20 Startup Gate。**
