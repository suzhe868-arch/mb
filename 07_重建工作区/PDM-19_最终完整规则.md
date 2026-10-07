# PDM-19｜最终完整规则

> 域：Deposit / Transaction / Refund / 成交纠错 / 换车  
> 当前状态：`COMPLETE / INTEGRITY_PASS`  
> Final 前完整性复核：`R2 PASS / FINAL_CANDIDATE_READY`  
> Final Integrity：`PASS`  
> 用户已最终批准并确认执行。本文件为 PDM-19 当前正式产品 Authority。

## 1. 核心定位

PDM-19 是：

> **Deposit（意向金真实收款事实）/ Transaction（交易）/ Refund（退款）/ 成交纠错，以及换车资金与交易收口的唯一业务 Authority。**

负责：

- Deposit 真实收款、追加、correction/reversal 与历史；
- Transaction 创建、进行中、完成、取消、责任交接与历史；
- completed Transaction 成交纠错；
- Refund 创建、实际退款、关闭、余额、多笔退款与历史；
- 换车时旧业务真实结束、新车重新建立 Lock / Transaction / Deposit；
- Transaction / Refund 对 Priority、Recommendation、Consultation、Demand、公海的跨域 Guard；
- 供应异常后的交易/资金处理；
- 资金与成交事实不可覆盖的历史完整性。

不重建 Customer identity/account、Customer owner/public pool、permission/data scope 总模型、Vehicle/listing_cycle/source/visibility、Archive、Price Authority、Matching、Priority、Recommendation、Consultation、LockRequest/Lock/Waitlist、最终 IA、通知渠道、统一审计底层实现。

## 2. 四类事实严格分离

Deposit、Lock、Transaction、Refund：

- 必须明确关联；
- 但不能合并成一个“大交易状态机”；
- 一个对象后续变化不得通过删除/覆盖另一个对象历史实现；
- 纠错、冲正、退款、成交纠错一律追加新事实，原事实继续可追溯。

## 3. Deposit 是真实收款事实

Deposit：

- 只表示实际已经发生的线下收款；
- 同一合法 Lock 可有多笔；
- 不建设在线支付；
- 不建设“未结清 / 已结清 / 部分结清”主状态机；
- 总额由有效 Deposit + correction/reversal 事实派生；
- Deposit 本身不另设独立 responsible，只保留真实 operator。

每笔最小必填：

- amount；
- received_at；
- payment_method；
- operator。

可选：

- note；
- voucher / 凭证。

## 4. Deposit 记录与资金纠错分权

当前合法业务 responsible 可以记录已经真实发生的 Deposit 收款。

但：

> **记录真实收款 ≠ 资金纠错。**

资金 correction/reversal：

- 原始收款永久保留；
- 不直接修改/删除原记录；
- 只通过追加 correction/reversal；
- 仅具独立资金纠错 permission + 合法 data scope 的经理/店长执行；
- 原因必填；
- actor/time/reason 与原事实关系可追溯。

## 5. 真实 Deposit 改变普通 Lock timeout 边界

一旦合法 Lock 已存在真实 Deposit：

> **不得仅因普通 Lock expires_at 到期，按无 Deposit 的普通超时规则自动释放。**

PDM-19 只提供真实 Deposit / 后续资金交易事实；LockRequest / Lock / Waitlist Authority 仍属于 PDM-18。

## 6. Transaction 必须来源于合法 Lock

Transaction 不得凭空创建。

必须保持：

- Customer；
- Vehicle；
- listing_cycle；
- 来源 Lock

一致并可追溯。

创建 Transaction 后，不得把原 Lock 历史改写成“从未发生”。

## 7. Lock → Transaction 必须原子转换

首笔 in-progress Transaction 的最终提交必须原子完成：

1. 重验当前 active Lock；
2. 校验 Customer / Vehicle / listing_cycle；
3. 创建 Transaction；
4. 原 Lock 以 converted_to_transaction 类真实原因结束；
5. 当前业务占用转为 Transaction / trading；
6. 原 Lock、价格快照、Deposit 历史全部保留。

任一步失败：

> 整组不提交。

不得出现“Lock 已关但 Transaction 没建成”的中间假事实。

## 8. Transaction 主状态与并发

Transaction 主状态固定为：

- `in_progress`
- `completed`
- `cancelled`

同一 Vehicle 同一时刻：

> **最多一笔 in-progress Transaction。**

completed / cancelled 为终态历史。

completed correction 不把 completed 重新改回 in_progress。

## 9. Transaction responsible

创建 Transaction 时：

> 默认继承来源 Lock responsible。

之后：

- Customer current owner 普通变化不自动漂移 Transaction responsible；
- responsible inactive / 离职 / 失去资格时必须正式 handoff；
- handoff 保留 old responsible / new responsible / actor / time / reason；
- completed/cancelled 历史保留发生时责任事实。

## 10. Transaction 正常取消

普通 cancel 只适用于 `in_progress`：

- 当前合法 Transaction responsible 可在统一 permission/scope/object-state Guard 下执行；
- completed 不走普通 cancel，而走成交 correction；
- cancel 后进入 `cancelled` 终态；
- 不恢复旧 Lock；
- 不恢复旧 Waitlist；
- 不恢复旧 Priority；
- 不强制改写 source_status；
- 不强制改写 platform_visibility；
- 不制造假 relist / 假 new cycle。

Vehicle 后续是否重新开放：

> 只按真实 source state、current listing_cycle、当前其他 occupancy 重算。

## 11. Transaction 首次完成权限

“负责/创建 Transaction”和“首次完成 Transaction”是两类能力。

首次完成：

- 普通销售不得执行；
- 必须由经理/店长；
- 且仍需独立 transaction-complete permission；
- data scope 合法；
- object state 合法；
- 职位本身不自动授权；
- System Admin 控制平面身份本身无该业务执行权。

完成前继续读取 PDM-07 当时有效 required-field set；档案缺失只阻止完成，不删除已经创建的 Transaction。

## 12. completed Transaction 历史主事实

首次 completed 至少冻结：

- actual_deal_price；
- completed_at；
- transaction_responsible；
- Customer 真实购车事实；
- Transaction / Vehicle / listing_cycle 关联。

其中：

> **actual_deal_price 是该笔 completed Transaction 的历史主价格。**

后续列表价、展示价、批发价、source_type 变化不得回写成交历史价格。

## 13. completed Transaction 成交纠错

普通销售：

> 不得纠正 completed Transaction。

经理/店长：

- 仍不是仅凭职位自动可纠错；
- 必须具独立 transaction-correction permission；
- data scope 合法；
- 原因必填；
- correction append-only；
- 原 completed 永久保留；
- 不做二级审批。

System Admin 控制平面身份本身无该业务权。

4S Member 不进入名邦 Customer Transaction 成交纠错链。

## 14. 误成交 correction 不制造假重新上架

如果 completed 只是误操作，而 Vehicle 从未真实不可售：

- correction 后恢复真实可售事实；
- 继续原 listing_cycle；
- 不新建 cycle；
- 不计 today-new；
- 不更新时间为“最新上架”；
- 不重新置顶；
- 原 cycle 合法价格/查价权益继续；
- 客户不重复解锁/扣额度；
- 旧 Lock / Waitlist 不复活。

只有 Vehicle 真正经历不可售/下架后再真实可售：

> 才按正常 relist 建新 listing_cycle。

## 15. Transaction × Priority

- in-progress Transaction 阻止新 Priority；
- active Priority 进入合法 Transaction 时 Priority ended；
- Transaction cancel/correction 不恢复旧 Priority；
- Vehicle 真正重新开放后，按当时合法 Match Result 重新仲裁；
- Priority release/expiry 不得撤销已成立 Transaction。

## 16. Transaction × Recommendation

只要 Vehicle 底层仍真实可售、listing_cycle 有效、Recommendation 其他 Guard 合法：

- Transaction 占用事实本身不自动禁止 Recommendation；
- Recommendation 不 takeover Transaction；
- 不取消 Transaction；
- 不回写 Transaction。

sold/offline/unavailable/cycle end 等真实不可售仍按 Vehicle Authority 阻止新业务。

## 17. Transaction × Consultation

Transaction：

- completed；
- cancelled；
- corrected

均不得自动改变 Consultation 主状态。

Consultation 是否 resolved/normal-close/invalid：

> 继续由 PDM-15 合法真人动作形成。

## 18. Transaction × Demand

一笔 Transaction completed：

- 只完成该 Transaction 和真实购车事实；
- 不自动把同一 Customer 全部 Demand 批量 completed/cancelled；
- 即使关联某条 Demand，也由 PDM-11 按该 Demand 真实服务目标决定是否结束。

## 19. Refund 主状态

Refund 当前主状态：

- `pending`
- `refunded`
- `closed`

语义：

- pending：钱尚未实际退，正在退款处理中；
- refunded：真实退款已经发生；
- closed：决定不再退款而关闭。

`closed`：

- 必须填写 close_reason；
- 不计入 refunded_amount；
- 不等于 refunded；
- 不新增专门 close permission；
- 不增加额外审批；
- 已 closed 不回 pending；以后重新需要退款，创建新的合法 Refund。

## 20. 不恢复 Refund partial 主状态

“部分退款”业务结果继续存在，但：

> 不建立 `partial` 主状态。

部分退款：

- 通过一笔或多笔真实退款事实表达；
- refundable_balance 动态派生；
- 每次真实退款都原子检查余额；
- 不允许累计超退。

## 21. Refund subject 必须唯一明确

每笔 Refund 必须且只能绑定：

> **Lock XOR Transaction**

Lock 侧 Refund：

- 存在有效可退 Deposit；
- 尚未存在 owning Transaction。

一旦 Transaction 已建立：

> 后续退款归 Transaction，不再归旧 Lock。

Transaction 侧 Refund：

- Transaction 已 completed 或 cancelled；
- refundable_balance > 0。

所有 Refund：

- customer_id 与 subject 一致；
- Vehicle/listing_cycle 链一致；
- amount > 0；
- amount 不超过当前 refundable_balance；
- 不允许同一范围冲突的 pending Refund；
- 最终提交原子重验，防止并发超退。

## 22. Refund 三类动作分层

### 发起 Refund
当前合法业务 / Transaction responsible 在 scope 内可以发起。

### 确认真实退款
属于真实资金动作：

- 由具备现有资金/退款确认 permission；
- scope 合法；
- 的经理/店长确认。

### pending 后决定不再退款
当前合法可处理该 Refund 的业务人员：

> 直接 close + 填原因。

不新增专门 close permission，不走额外审批。

Refund 本身不设永久 responsible，以 initiator/operator/actor 历史表达。

## 23. 实际当场退款可直接 refunded

如果钱已经真实当场退完：

> 可直接记录 refunded。

不为了流程形式制造一个瞬时假的 pending。

如果钱还没实际退：

> 才进入 pending。

pending 后：

- 真退完 → refunded；
- 决定不退 → closed + reason。

closed 不得用于实际已经退款的场景。

## 24. Refund 与公海

pending Refund：

- 是未完成业务责任；
- 保护 Customer 不直接进入公海；
- 但不占 Vehicle。

refunded / closed 后：

- 该 Refund 本身不再提供公海保护；
- 如仍有其他未完成责任，则继续按 PDM-17 保护。

## 25. Transaction / Refund 在途责任与公海

Customer 存在：

- in-progress Transaction；
- pending Refund / 未完成资金责任；

时，不得直接当作“无业务客户”丢入公海。

进入公海前：

- 完成；
- 取消；
- 或正式 handoff。

owner/public-pool 变化不得静默取消、漂移或重建 Transaction 当前责任与历史。

## 26. Customer disable

Customer account 后续停用：

- 不删除 Deposit；
- 不删除 Transaction；
- 不删除 Refund；
- 不删除 correction；
- 不伪造成资金/成交从未发生。

新的 mutation 继续按当前 identity/account/permission/object state 判断。

## 27. Vehicle source / visibility / archive

以下变化不得静默改写交易资金历史：

- source_type；
- hidden / visibility；
- source conversion；
- Archive 状态。

档案不完整：

- 不阻止合法 Transaction 创建；
- 在真正 completion/delivery 时读取当时 required-field set；
- 缺失只阻止完成。

## 28. 供应异常

in-progress Transaction 后出现供应异常：

- 不自动取消 Transaction；
- 不删 Lock/Deposit/Transaction 历史；
- 建立独立 supply_anomaly 事实；
- 若核实仍真实可售，可继续原 Transaction；
- 若真实不可售，不得正常 completed；
- 由合法 responsible 按真实情况：
  - cancel Transaction；
  - 换车；
  - 必要时发起 Refund。

供应异常不得伪造成普通 cancel / Lock expiry。

## 29. 换车不建设独立状态机

V1 换车：

1. 原 Vehicle 的 Lock / Transaction 按真实结果结束或取消；
2. 原 Deposit / Refund / Transaction 历史完整保留；
3. 新 Vehicle 重新建立 Lock；
4. 需要 Transaction 时新建 Transaction；
5. 需要 Deposit 时重新记录真实收款。

不建立独立“换车状态机/换车对象”。

不直接替换旧 Transaction 的 vehicle_id。

## 30. Deposit 不跨车转挂

旧车 Deposit：

> 永远属于旧车业务链。

换车时：

- 旧车需要退 → 真实 Refund；
- 新车需要 Deposit → 新收款；
- 旧收款、旧退款、新收款分别保留。

不得直接把旧 Deposit vehicle_id 改成新车。

## 31. 明确废弃 / 不得恢复

不得恢复：

1. Deposit “未结清/已结清/部分结清”主状态机；
2. Refund `partial` 主状态；
3. Transaction cancel 自动恢复旧 Lock / Waitlist；
4. 独立换车状态机/换车关系对象；
5. Deposit 跨车转挂；
6. 删除/覆盖原事实做资金/成交纠错；
7. System Admin 控制平面身份直接做 completed Transaction correction；
8. completed Transaction 普通 cancel；
9. Transaction completed 自动结束所有 Demand/Consultation；
10. 供应异常自动取消 Transaction；
11. 误成交 correction 自动 relist / new cycle；
12. Refund closed 当 refunded；
13. close pending Refund 再额外增加专门 close permission/审批。

## 32. Cross-PDM Handoff

### Incoming｜Final closeout 已关闭

- HO-P01-P19-001｜`HANDOFF_CLOSED / source_backwrite=YES`；
- HO-P02-P19-001｜`HANDOFF_CLOSED / source_backwrite=YES`；
- HO-P03-P19-001｜`HANDOFF_CLOSED / source_backwrite=YES`；
- HO-P04-P19-001｜`HANDOFF_CLOSED / source_backwrite=YES`；
- HO-P07-P19-001｜`HANDOFF_CLOSED / source_backwrite=YES`；
- HO-P13-P19-001｜`HANDOFF_CLOSED / source_backwrite=YES`；
- HO-P14-P19-001｜`HANDOFF_CLOSED / source_backwrite=YES`；
- HO-P15-P19-001｜`HANDOFF_CLOSED / source_backwrite=YES`；
- HO-P17-P19-001｜`HANDOFF_CLOSED / source_backwrite=YES`；
- HO-P18-P19-001。

### Outgoing｜保持 HANDOFF_OPEN

- HO-P19-P20-001｜`HANDOFF_CLOSED / source_backwrite=YES`：PDM-20 Final 已正式承接“我的交易”/Deposit/Refund Customer Safe Projection、Transaction/Refund 状态、correction/change-car 历史与 Demand/Consultation 不反写边界；
- HO-P19-P21-001｜`HANDOFF_CLOSED / source_backwrite=YES`：PDM-21 Final 已正式承接 Deposit/Transaction/Refund/correction 员工端 Action Contract、supply anomaly、responsible handoff 与 Employee Vehicle Feed 安全裁剪；
- HO-P19-P22-001｜`HANDOFF_CLOSED / source_backwrite=YES`：Deposit / Transaction / Refund / correction PC 业务管理与 Dashboard 统计已由 PDM-22 Final 承接；
- HO-P19-P23-001｜`HANDOFF_CLOSED / source_backwrite=YES`：Transaction / Refund 关键状态变化通知边界已由 `07_重建工作区/PDM-23_最终完整规则.md` 正式承接；
- HO-P19-P25-001。

## 33. Stale Carrier

已登记但当前不施工：

- pending Refund close 必须独立 refund-management permission；
- Refund 只有 pending/refunded；
- System Admin 可直接参与 completed Transaction correction；
- 客户端/员工端/PC 交易资金通用壳缺当前完整状态、字段和动作投影。

统一留 PDM-25 完成 + PDM-01～25 全局最终总复核 PASS 后做 IA / Low-Fi Alignment。

## 34. Final 前完整性结论

R2：

- `SOURCE_TO_ATOM = PASS`
- `ATOM_TO_SOURCE = PASS`
- `SEMANTIC_COMPLETENESS = PASS`
- `MISSING_RULE_UNRESOLVED = 0`
- `SEMANTIC_DETAIL_GAP_UNRESOLVED = 0`
- `COMPLETED_PDM_INVARIANT_CONFLICT = 0`
- `INCOMING_HANDOFF_GAP = 0`
- `OUTGOING_HANDOFF_GAP = 0`
- `NEGATIVE_CLAIMS_VERIFIED = PASS`
- `PDM19_LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`
- `PDM19_FINAL_CANDIDATE_READY = YES`

## 35. Final Closeout

用户已最终批准并确认执行。

- 正式 Authority：`07_重建工作区/PDM-19_最终完整规则.md`；
- Final 前完整性复核 R2：`PASS / FINAL_CANDIDATE_READY`；
- Final Integrity：`PASS`；
- 41 个正式规则 / 用户裁决单元全部进入 Final；
- 10 / 10 incoming handoff：`HANDOFF_CLOSED / source_backwrite=YES`；
- HO-P19-P20-001 与 HO-P19-P21-001 已 `HANDOFF_CLOSED / source_backwrite=YES`；PDM-22 已 `HANDOFF_CLOSED / source_backwrite=YES`；PDM-23 已 `HANDOFF_CLOSED / source_backwrite=YES`；PDM-25 已 `HANDOFF_CLOSED / source_backwrite=YES`；
- PDM-19：`COMPLETE / INTEGRITY_PASS`；
- IA / Low-Fi / Engineering 继续禁止提前施工；
- 历史阶段下一步（HISTORICAL_AUDIT_TRAIL，当时）：`PDM-20 Startup Gate`。

历史阶段下一步（HISTORICAL_AUDIT_TRAIL，当时）：

> **历史阶段记录（HISTORICAL_AUDIT_TRAIL，当时）：PDM-20 Startup Gate。**

> 2026-10-07 Source Backwrite：对应 PDM-22 handoff 已由 `07_重建工作区/PDM-22_最终完整规则.md` 正式承接；以 CROSS_PDM_HANDOFF_REGISTER 的 `HANDOFF_CLOSED / source_backwrite=YES` 为准。


> 2026-10-07 Source Backwrite｜HO-P19-P25-001：`HANDOFF_CLOSED / source_backwrite=YES`。PDM-25 已由 `07_重建工作区/PDM-25_最终完整规则.md` 正式承接本域移交的审计 / 历史 / 时区 / 配置版本 / 横切完整性语义；PDM-25 不反向改写本 PDM 已冻结的业务状态机与产品规则。
