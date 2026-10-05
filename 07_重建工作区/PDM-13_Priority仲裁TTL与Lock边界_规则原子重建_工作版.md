# PDM-13｜Priority / 仲裁 / TTL / active Lock 边界｜规则原子重建工作版

> 日期：2026-10-05  
> 当前状态：`BATCH_3_PASS / USER_APPROVED / IN_PROGRESS`  
> 业务权威语言：中文（zh-CN）  
> 当前域：PDM-13｜Priority / 仲裁 / TTL / active Lock 边界  
> 当前硬门禁：Batch 3 已获用户批准并确认执行；下一步进入 Batch 4（真实冲突 / 缺口 / 新产品选择）候选重建，形成候选后立即停下提交用户审查。不得提前修改 IA / Low-Fi / Engineering。

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
15. Priority 是否、何时给客户详情可见权；**后由 P13-B2-05 收口负向边界：Priority 本身不得直接授予客户详情权；具体合法 visibility 来源与生命周期仍由对应域承接；**
16. active Priority 与公海保护的最终跨域规则；
17. Current Navigation 残留“创建 Priority”如何作为 stale carrier 处理；**后由 P13-B2-02 明确判定为不得恢复的人工创建语义；carrier 继续延后统一对齐；**
18. Current `HIDDEN_CONTROLLED` 客户可见旧语义如何 supersede；**后由 P13-B2-05 明确 supersede 客户侧直接可见旧语义；员工受控查看不因此自动废弃；**
19. Priority 的重新匹配 / 重新仲裁触发事件全集；
20. Priority 资格与无 owner / 无合法负责销售时的关系。

处理：

`EXPLICITLY_DEFERRED_TO_BATCH_2_3_4_NOT_LOST`

---

# 7. Batch 2｜明确废弃 / 明确替代 / DO_NOT_RESTORE｜USER APPROVED

> 用户已审查并确认 `P13-B2-01～P13-B2-05`，并明确“同意确认执行”。  
> Batch 2 Gate：`PASS / USER_APPROVED / APPLIED_TO_WORKFILE`。

## P13-B2-01｜不得恢复独立“客户专属”体系

正式取消并禁止恢复与 Priority 平行的人工“客户专属”业务体系，包括：

- 设为客户专属；
- 解除客户专属；
- 独立客户专属 Vehicle / 关系对象；
- 客户专属车辆筛选 / 列表；
- E02“客户专属”入口；
- 与正式 Matching → Priority 平行运行的“专属车源”管理体系。

真正的找车保护继续由：

`正式 Demand → Matching → Priority`

承接。

分类：`EXPLICITLY_DEPRECATED / DO_NOT_RESTORE`

---

## P13-B2-02｜不得恢复人工创建 / 转让 / 覆盖 / 延长 Priority

Priority 必须由系统读取合法 Match Result，并通过 PDM-13 当前合法资格 / 仲裁规则自动产生。

明确禁止恢复：

- 销售手工“创建 Priority”；
- 人工把 Priority 转给另一个 Customer；
- `priority.override`；
- 人工强制覆盖当前 active Priority；
- 人工直接修改 `expires_at` 实现延长；
- 通过按钮把已经 ended 的 Priority 强制恢复 active。

因此 Current Navigation 残留：

`E05-05｜创建 Priority`

正式登记为：

`STALE_CARRIER / DO_NOT_IMPLEMENT_AS_MANUAL_CREATE`

IA / Low-Fi 当前阶段仍不施工，待 PDM-25 后统一 carrier alignment。

分类：`HISTORICAL_AUTO_PRIORITY_AUTHORITY_RETAINED / MANUAL_CREATE_OVERRIDE_TRANSFER_EXTEND_DEPRECATED`

---

## P13-B2-03｜不得把 Priority 恢复成 Lock 优先权

Priority 是 Matching 之后的临时优先保护 / 排他业务层，**不是锁车竞争排序机制**。

不得把 Priority 实现为：

- LockRequest 排队优先级；
- “Priority 客户一定优先 Lock”；
- Lock 的客户等级竞争；
- 锁车抢单分值；
- Lock eligibility 的第二套匹配等级。

固定负向边界：

`Priority ≠ Lock Priority`

但本条**不提前裁决**：

- active Lock 已存在时能否创建 / 继续 Priority；
- 正式 Lock 成功时如何 takeover / end Priority；
- Lock 取消 / 到期后的 Priority 后续行为。

这些继续进入后续 PDM-13 冲突 / 缺口批次。

分类：`EXPLICIT_ROLE_BOUNDARY / DO_NOT_RESTORE_LOCK_PRIORITY`

---

## P13-B2-04｜客户端不得暴露 Priority 内部术语

客户侧不得直接展示：

- `Priority`；
- “优先保护”；
- “客户专属”；
- “Priority 客户”；
- 内部仲裁等级、竞争顺序、保护算法等后台机制词。

客户侧使用自然业务表达，例如：

> **为您匹配**

员工端 / 后台在合法 permission + data scope + object state 下可展示真实 Priority 状态、对应业务关系与截止时间。

分类：`CLIENT_INTERNAL_TERM_DENY / DO_NOT_RESTORE`

---

## P13-B2-05｜废弃“Priority 本身直接授予客户车辆详情权”

旧 R10-50 曾存在：

> Priority 上下文直接让对应客户可见车辆。

该客户侧口径已被后续冻结 Authority 明确替代：

- `VR-X-003`：Priority 本身不给客户详情权；
- `VR-X-004`：active Recommendation 可建立客户单车 visibility grant；
- hidden 车辆仍必须通过独立合法 visibility 来源才能给客户看详情。

因此明确禁止恢复：

`Priority created → customer vehicle-detail visibility automatically granted`

Current `E05-05::HIDDEN_CONTROLLED` 中“对应客户因 Demand/Priority 上下文直接可见”的客户侧语义属于：

`SUPERSEDED_OLD_RULE / STALE_CARRIER`

注意：

- 本条废弃的是“Priority 自身直接授权客户详情”的旧规则；
- 员工侧合法受控查看不因本条自动废弃；
- Recommendation / visibility grant 的完整生命周期不在 PDM-13 复制第二套 Authority。

分类：`SUPERSEDED / DO_NOT_RESTORE_DIRECT_CUSTOMER_VISIBILITY`

---

# 8. Batch 2 反向冲突扫描

反向检查了：

- 2026-09-17《统一匹配与 Priority 规则》；
- 9/19 R10-49 / R10-50 / R10-51；
- 001～078 M04-001 / M04-002 / M04-003 / M04-005 / M04-006 / M04-007；
- 9/22 `VR-X-003 / VR-X-004`；
- Current / IA / Low-Fi stale carrier。

结论：

`BATCH_2_REVERSE_CONFLICT_SCAN = PASS`

本批没有把以下仍需后续裁决的内容误判为“废弃”：

1. Priority Customer qualification 的最终来源；
2. Customer Level 与 Priority 的关系；
3. Priority qualification 配置 actor / permission；
4. 精确多客户仲裁顺序；
5. `Demand.created_at / demand_id` tie-break；
6. 默认 TTL 数值；
7. TTL 配置主体；
8. 是否存在合法续期机制；
9. 完整结束原因；
10. same listing_cycle 再获得规则；
11. trigger_demand 切换；
12. active Lock / Lock takeover；
13. Transaction 边界；
14. active Priority 与公海保护；
15. Priority 全部重新匹配 / 重新仲裁触发事件。

处理：

`EXPLICITLY_NOT_DEPRECATED / DEFERRED_TO_BATCH_3_4`

---

# 9. Batch 3｜后续明确新增 / 明确变更｜USER APPROVED

> 用户已审查并确认 `P13-B3-01～P13-B3-06`，并明确“同意，确认执行”。  
> Batch 3 Gate：`PASS / USER_APPROVED / APPLIED_TO_WORKFILE`。

## P13-B3-01｜Priority 员工侧查看 / 处理统一继承 PDM-02 权限模型

Priority 员工侧任何查看或动作不得建立第二套权限计算逻辑，统一服从：

`identity + permission + data scope + object state`

固定规则：

- 页面可见不等于动作授权；
- 字段返回不等于动作授权；
- 敏感提交必须按当前事实重新校验；
- 经理 / 店长不得仅因职位自动取得敏感 Priority 能力；
- System Admin 的控制平面治理身份不自动等于 Priority 业务执行身份；
- 4S 是否可见 / 可执行必须继续服从当前 hard DENY 与后续明确 capability，不得从旧页面反推权限。

本条**不提前冻结具体 capability 命名**，例如是否保留 `priority.view`、是否另设管理能力；若存在真实冲突留 Batch 4。

来源：PDM-02 Final。

---

## P13-B3-02｜Priority 交接必须进入正式 Handover Batch

Priority 已被 PDM-02 / PDM-03 Final 明确纳入离职、inactive、调店、降权、承责资格丧失时的活跃业务交接范围。

正式规则：

- 计划性调店 / 降权若会导致原 Priority 责任失效，应先完成相应业务交接，再让变化正式生效；
- 突发 inactive / 离职先立即撤权，再由合法 active 人员补完业务交接；
- Priority 不得继续挂在失效员工名下；
- 每个受影响 Priority 必须进入可追溯 handover batch；
- 至少保留原负责人、新负责人、操作人、操作时间、交接原因、批次来源及再次分配历史；
- 提交时重新校验目标人员当前 active / eligible / permission / data scope / object state；
- 批量交接部分失败时，已成功项不得整体回滚；失败项继续待处理，重试只处理未闭环对象；
- 交接不得改写 Priority 原创建事实 / 历史。

本条仍不提前裁决交接时 Priority 是否继续 active、TTL 是否受影响等 lifecycle 细节。

来源：PDM-02 Final §9.5 + PDM-03 Final §13/14。

---

## P13-B3-03｜若按 Demand 创建先后仲裁，只能使用不可变 Demand.created_at

PDM-11 已冻结 `Demand.created_at`：

- 仅在 Application 首次成功人工激活并创建正式 Demand 时写入；
- 创建后不可重写；
- pause / resume / reassignment 不改变；
- 不得使用 `updated_at`；
- 不得使用最近 resume 时间；
- 不得使用最近改派时间替代。

因此：

> PDM-13 后续若选择“按 Demand 创建先后”作为 Priority 仲裁维度，只能读取该不可变 `Demand.created_at`。

本条**不等于已经决定必须使用 created_at 排序**；是否采用该仲裁维度、以及与 `high/acceptable`、`demand_id` 的最终顺序仍留 Batch 4。

来源：PDM-11 Final §9。

---

## P13-B3-04｜Demand / Matching 失效后现有 Priority 必须重新评估

Priority 不能继续依赖已经失效的 Matching 事实。

当以下情况导致原 Match Result 退出 current valid 集合时：

- Demand → paused；
- Demand → completed / cancelled；
- Customer disable 导致 active Demand → paused；
- find-car entitlement 下降导致 active Demand → paused；
- Matching readiness 失效；
- Match Result 被标记 stale / invalidated；
- 其他 PDM-12 已冻结的 current-result 退出条件；

该旧 Match Result 不得继续作为当前 Priority 资格依据。

Priority 必须进入重新评估。

重新评估后的具体 lifecycle，例如：

- 是否切换同 Customer 其他 Demand；
- 是否直接结束；
- 是否保留原 expires_at；

继续留 Batch 4 裁决。

来源：PDM-11 Final §14/15 + PDM-12 Final §29/30。

---

## P13-B3-05｜active Lock 不阻断 Matching；PDM-13 只处理 Lock×Priority 边界

PDM-12 已冻结：

- active Lock 本身不等于 Vehicle 不可 Matching；
- Vehicle 底层仍真实可售且其他 Guard 合法时，其他 Demand 仍可得到 Match Result；
- 结果必须携带“当前已锁 / 已占用”事实；
- 即使 Match Result = high / acceptable，也不代表当前 Customer 可以直接 Lock。

因此 PDM-13 不得：

- 因 Vehicle 有 active Lock 就要求 PDM-12 停止 Matching；
- 删除原合法 Match Result；
- 把“已锁”误解释成 no_match。

PDM-13 只负责在获得合法 Match Result 后处理：

- active Lock 时 Priority 是否可新建；
- 已有 Priority 是否可继续；
- 正式 Lock 如何 takeover / end Priority。

上述三个**具体答案仍留 Batch 4**。

来源：PDM-12 Final §18 / §35。

---

## P13-B3-06｜Priority 重评只消费 PDM-12 current Match Result / Matching change fact

Vehicle、价格、Demand、Rule Dictionary 等变化导致 Matching 事实变化时：

1. PDM-12 负责确定性解析 / 事实确认 / 重算；
2. PDM-12 产生新的 current Match Result 或 stale / invalidated fact；
3. PDM-12 可产生可追溯 Matching change fact；
4. PDM-13 读取这些当前事实重新评估 Priority。

PDM-13 不得：

- 自己复制一套 Matching parser / dictionary；
- 自己偷偷把 old result 改成 high / acceptable；
- 绕过 PDM-12 自行猜测车辆/需求事实。

这保持：

`ONE_MATCHING_AUTHORITY`

注意：本条只冻结 Authority 边界；Priority 自身完整的重评 / 重新仲裁事件全集仍需 Final 前完整性审计。

来源：PDM-12 Final §28/29/31。

---

# 10. Batch 3 冲突隔离结果

本批只吸收 Completed-PDM 已明确冻结的后续约束，没有将以下真实产品选择偷渡进来：

1. Priority Customer qualification 最终来源；
2. Customer Level 与 Priority 的关系；
3. qualification 配置 actor / permission；
4. 精确多 Customer 仲裁；
5. 是否采用 `high > acceptable → created_at → demand_id`；
6. 默认 TTL 数值；
7. TTL 配置主体；
8. 是否允许续期；
9. 完整 ended reason；
10. same listing_cycle 再获得；
11. trigger_demand 切换与 expires_at；
12. active Lock / Lock takeover 的最终答案；
13. Transaction 边界；
14. active Priority 与公海保护；
15. Priority qualification 与无 owner / 无合法负责销售的关系；
16. Priority 员工 capability 的最终命名与最小集合。

结论：

`BATCH_3_CONFLICT_ISOLATION = PASS`

---

# 11. 当前唯一下一步

> **进入 PDM-13 Batch 4：对剩余真实冲突、语义缺口与新产品选择逐项给出候选方案并提交用户裁决。重点包括 Priority 资格来源 / Customer Level 关系、精确仲裁、TTL 默认值与配置主体、续期、same-cycle、trigger_demand、active Lock / Transaction、公海保护、无 owner / 无合法负责销售以及员工 Priority capability 最终边界。形成 Batch 4 候选后立即停下等待用户审查。**

IA / Low-Fi / Engineering 继续禁止施工。
