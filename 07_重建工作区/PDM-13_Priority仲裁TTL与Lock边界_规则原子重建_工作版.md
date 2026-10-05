# PDM-13｜Priority / 仲裁 / TTL / active Lock 边界｜规则原子重建工作版

> 日期：2026-10-05  
> 当前状态：`BATCH_1_PASS / USER_APPROVED / IN_PROGRESS`  
> 业务权威语言：中文（zh-CN）  
> 当前域：PDM-13｜Priority / 仲裁 / TTL / active Lock 边界  
> 当前硬门禁：Batch 1 已获用户批准并确认执行；下一步只允许重建 Batch 2（明确废弃 / 明确替代 / DO_NOT_RESTORE）候选，形成候选后立即停下提交用户审查。不得提前修改 IA / Low-Fi / Engineering。

---

## 1. 启动门禁

PDM-12 已：

- Final 用户批准；
- 正式 Final 发布；
- Source→Final / Final→Source 双向追溯 PASS；
- Final Integrity = PASS；
- PDM-12 = `COMPLETE / INTEGRITY_PASS`。

PDM-13 incoming handoff 已全部读取并接收：

- `HO-P03-P13-001 = HANDOFF_ACCEPTED`
- `HO-P04-P13-001 = HANDOFF_ACCEPTED`
- `HO-P07-P13-001 = HANDOFF_ACCEPTED`
- `HO-P11-P13-001 = HANDOFF_ACCEPTED`
- `HO-P12-P13-001 = HANDOFF_ACCEPTED`

这些 handoff 在 PDM-13 Final / Integrity Gate 前不得直接 CLOSED；每条都必须形成 Atom / Decision / Final 去向。

---

## 2. 覆盖地图与强制依赖

### 2.1 9/19 主来源

- C2；
- C3；
- R10。

### 2.2 001～078 雷达

- M04｜Priority / 客户特殊资格 / 优先保护；
- M03｜Demand / Matching；
- M05｜Recommendation / 单车授权 / 推荐生命周期。

### 2.3 核心对象

- Priority；
- Trigger Demand；
- Priority History。

### 2.4 核心能力

- Priority 产生资格；
- 多客户仲裁；
- 唯一 active；
- TTL；
- 生命周期与结束；
- Demand / Match Result 变化后的重算；
- hidden / public visibility 边界；
- active Lock 接管边界；
- 责任交接与历史。

### 2.5 Completed-PDM Dependency Card

PDM-13 强制继承：

- **PDM-02**：identity / permission / data scope / hard DENY；System Admin 配置权不等于员工业务执行权；员工失效后撤权与交接；
- **PDM-03**：Priority 属离职 / inactive / 资格失效时必须扫描的活跃业务关系；owner 与具体业务负责人分层；
- **PDM-04**：hidden 与真实 availability / listing_cycle 分层；Priority 不得改写 Vehicle 真实生命周期；
- **PDM-07**：车况原始事实与 provenance 保留；unknown 不得猜成符合；
- **PDM-11**：pending Application 不产生正式 Demand；Priority 若按 Demand 创建先后仲裁，只能读取不可变 `Demand.created_at`，不得用 updated_at / resume time 替代；
- **PDM-12**：Priority 只消费当前合法 Match Result；`high / acceptable` 才能进入后续候选；`confirmation_needed / no_match / stale / invalidated` 不得驱动新 Priority；active Lock 不阻止 Matching 自身继续产生 Match Result。

不得用 Current IA / Low-Fi 的 stale carrier 反向覆盖上述 Final Authority。

---

## 3. Current Implementation Fact

当前证据只能确认：

1. IA / Low-Fi 已存在 `PRIORITY_ACTIVE_TTL_FROZEN`、`PRIORITY_DUPLICATE_SUPPRESSED`、`PRIORITY_HISTORICAL` 等投影；
2. Low-Fi 已表达：
   - TTL snapshot at create；
   - 同 `customer + vehicle + listing_cycle` 去重；
   - handoff 不改写 creator / history；
3. 但 Current Navigation 仍残留一条 `E05-05｜创建 Priority`，与历史“Priority 由系统仲裁产生、不提供人工创建 Priority”存在 stale carrier 冲突；
4. `E05-05::HIDDEN_CONTROLLED` 仍残留“对应客户在 Demand/Priority 上下文可见”的旧口径，与后续“Priority 本身不授客户详情权”的 Authority 冲突；
5. 工程 Delta 自身明确为“待执行输入”，不能据此认定当前生产代码 / 数据库 / API 已完成。

因此当前实现事实定性为：

`CURRENT_CARRIER_PARTIAL / STALE_CONFLICTS_REGISTERED / CURRENT_PRODUCTION_IMPLEMENTATION_NOT_ESTABLISHED`

实现事实只用于发现 gap / stale carrier，不作为产品 Authority。

---

# 4. Batch 1｜稳定一致规则｜USER APPROVED

> 用户已审查并确认 `P13-A01～P13-A11` 全部同意，并随后明确“确认执行”。  
> Batch 1 Gate：`PASS / USER_APPROVED / APPLIED_TO_WORKFILE`。

## P13-A01｜Priority 不建设第二套 Matching

Priority 只能建立在 PDM-12 已经产生的合法 Matching 事实之上。

不得：

- 自己重新解释车型、预算、车况、hard / preferred / tolerance；
- 建立 Priority 专用第二套匹配算法；
- 把 Priority 当成 Match Result 本身。

Priority 是 Matching 之后的优先保护 / 仲裁层。

---

## P13-A02｜只有当前合法正式 Match Result 才能进入 Priority 候选

- pending Application 不产生 Priority；
- Demand 必须处于当前允许持续 Matching 的正式状态并满足 PDM-12 readiness；
- 只有当前有效的 `high / acceptable` 可成为 Priority 候选；
- `confirmation_needed / no_match` 不得作为成功匹配；
- stale / invalidated / historical Match Result 不得驱动新 Priority。

---

## P13-A03｜Priority 不得修改 Matching 事实来制造资格

不得：

- 把 unknown 猜成符合；
- 篡改 JYT / manual / Mingbang 检测 provenance；
- 为了抢占 Priority 临时放宽 hard condition。

车辆、价格、Demand 或证据事实变化时，必须先回到 PDM-12 重新计算 Match Result，再由 PDM-13 消费新结果。

---

## P13-A04｜同一 Vehicle 同一时刻最多一个 active Priority

- 同一 Vehicle 同一时刻最多只能有 1 个 active Priority；
- 同一 `customer + vehicle + listing_cycle` 不得因重复事件、重算或重试产生并行重复 Priority；
- 重复触发必须幂等 / suppressed；
- 原业务历史继续保留。

---

## P13-A05｜Priority TTL 在创建时冻结

Priority 成立时形成该笔业务自己的 TTL / `expires_at` 快照。

之后：

- 默认配置变化不得追溯修改已创建 Priority；
- 页面刷新不得重新计时；
- Matching 重算本身不得偷偷重置计时；
- Recommendation 等其他业务动作不得偷偷重置计时。

**本条只冻结“创建时快照、不追溯、不偷偷重计时”。**

以下尚未由 Batch 1 冻结：

- 默认 TTL 的具体数值；
- 谁能修改默认 TTL；
- 是否存在合法续期例外。

---

## P13-A06｜Priority 当前责任与历史创建事实分离

员工离职、inactive、调店或失去合法承责资格时：

- 相关 Priority 必须进入正式 handoff 扫描；
- 不得继续挂在已失效人员名下；
- 交接不得改写 Priority 原创建人、原创建时间与历史事实；
- 员工恢复资格后不得自动取回已经交出的旧 Priority 责任。

以下继续留后续批次：

- 交接时 active Priority 是否一定继续 active；
- 交接过程中 TTL 是否受影响；
- 失去承责资格时是否存在额外结束条件。

---

## P13-A07｜Priority 不直接改变 Customer owner

Priority 的：

- 创建；
- 存在；
- 结束；
- 到期；
- 重新仲裁；

均不得直接改写 Customer `current owner`。

Customer owner 变化继续服从 PDM-03 的正式 owner transfer / handoff。Priority 只处理车辆级优先保护关系。

---

## P13-A08｜Priority 与 Recommendation 是独立业务对象

- Priority 成立 ≠ 正式 Recommendation；
- 正式推荐必须走 Recommendation 自己的合法动作与 Guard；
- Recommendation 创建 / 存在不得被解释成重新创建 Priority；
- Recommendation 不得重置 Priority TTL；
- 两者生命周期与历史分别保留。

客户详情 visibility 的具体授予方式不在本条提前外推，由 PDM-14 当前/后续 Authority 承接。

---

## P13-A09｜Priority 不改变 Vehicle 真实资源状态与 listing_cycle

Priority 不得：

- 把 hidden 改成 offline；
- 把 hidden 当成真实不可售；
- 因产生 / 结束 Priority 新建 listing_cycle；
- 改写车辆真实 saleability / availability。

车辆底层事实继续读取 PDM-04 Authority。

---

## P13-A10｜Priority 结束只恢复底层本来应该有的状态

Priority 到期、释放或结束后：

- 只能恢复车辆底层本来应有的可见 / 业务状态；
- 如果车辆仍为人工 hidden，则继续 hidden，不得自动回公共 Feed；
- 如果车辆真实不可售，则不得因 Priority 结束而恢复在售；
- Priority 结束不是“强制公开车辆”。

---

## P13-A11｜Priority 历史不可物理抹除

必须可追溯：

- 创建事实；
- active / ended；
- 结束事实；
- 责任交接；
- 历史负责人 / 创建人；
- 相关时间事实。

历史 Priority：

- 不得被当前状态覆盖；
- 不得冒充当前 active Priority；
- 不得因为后续重新 Matching 而改写旧记录。

---

# 5. Batch 1 Source→Atom / Handoff 去向

| 来源 | Batch 1 去向 |
|---|---|
| HO-P03-P13-001 | P13-A06 / A07；具体 lifecycle 继续后续批次 |
| HO-P04-P13-001 | P13-A09 / A10；排他可见精确边界继续后续批次 |
| HO-P07-P13-001 | P13-A03 |
| HO-P11-P13-001 | P13-A02；Demand.created_at 精确仲裁用法继续后续批次 |
| HO-P12-P13-001 | P13-A01 / A02 / A03；active Lock 关系继续后续批次 |
| M04-001 | A01/A04/A05/A06/A11；资格、TTL 数值、仲裁、结束原因等继续后续 |
| M04-006 / M05-001 | A08，并登记客户详情可见性旧口径为 stale carrier |
| M04-007 | A10 |
| Current IA / Low-Fi | 仅支持 A04/A05/A06/A11 的 carrier 事实；冲突项只登记，不反向覆盖 Authority |

Batch 1 后：

`UNMAPPED_STABLE_BATCH1_RULE = 0`

---

# 6. Batch 1 明确未裁决 / 不偷渡项

以下内容**没有丢失**，但不属于 Batch 1 已批准范围，必须进入后续批次逐项审查：

1. 哪些 Customer 具备 Priority 资格；
2. Customer Level / 等级权益是否、以及如何影响 Priority；
3. Priority 资格由谁配置 / 开关，是否仍为历史 System Admin-only；
4. 多个 Priority 候选 Customer 命中同一 Vehicle 时的精确仲裁顺序；
5. 是否继续使用 `high > acceptable → Demand.created_at → demand_id`；
6. 默认 TTL 的具体数值（历史 24h / 86400s）；
7. TTL 默认配置的合法 actor / permission；
8. 是否允许任何形式续期；
9. 完整结束原因；
10. 同一 listing_cycle 内结束后能否再次自动获得同车 Priority；
11. `trigger_demand_id` 切换与原 `expires_at` 是否保持；
12. active Lock 已存在时是否允许建立 / 继续 Priority；
13. 正式 Lock 创建时 Priority 如何 takeover / 结束；
14. Transaction 与 Priority 的边界；
15. Priority 是否、何时给客户详情可见权；当前后续 Authority 已提示“Priority 本身不授客户详情权”，需在对应批次正式收口；
16. active Priority 与公海保护的最终跨域规则；
17. Current Navigation 残留“创建 Priority”如何作为 stale carrier 处理；
18. Current `HIDDEN_CONTROLLED` 客户可见旧语义如何 supersede；
19. Priority 的重新匹配 / 重新仲裁触发事件全集；
20. Priority 资格与无 owner / 无合法负责销售时的关系。

处理：

`EXPLICITLY_DEFERRED_TO_BATCH_2_3_4_NOT_LOST`

---

## 7. 当前唯一下一步

> **重建 PDM-13 Batch 2：明确废弃 / 明确替代 / DO_NOT_RESTORE 项。必须先做反向冲突扫描，不能把仍待裁决的 Priority 资格、仲裁、TTL 数值、active Lock、客户 visibility 等问题误分类为“已废弃”。形成 Batch 2 候选后立即停下提交用户审查。**

IA / Low-Fi / Engineering 继续禁止施工。
