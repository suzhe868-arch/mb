# PDM-13｜Priority / 仲裁 / TTL / active Lock 边界｜规则原子重建工作版

> 日期：2026-10-05  
> 当前状态：`PREFINAL_REPAIR_R2_APPLIED / FINAL_INTEGRITY_RECHECK_PENDING`  
> 业务权威语言：中文（zh-CN）  
> 当前域：PDM-13｜Priority / 仲裁 / TTL / active Lock 边界  
> 当前硬门禁：Final Overview 复查发现 P13-LIA-07～LIA-08；用户已确认业务口径并明确“确认执行”。LIA-07/08 已进入工作 Authority，当前必须重新执行 Final 前完整性复核；复核 PASS 前不得发布 Final、不得关闭 incoming handoff、不得开始 PDM-14。

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

# 11. Batch 4｜真实冲突 / 语义缺口 / 新产品选择｜USER APPROVED

> 用户最终裁决：**B4-01 按用户修正版；B4-02=2A、B4-03=3A、B4-04=4A、B4-05=5A、B4-06=6A、B4-07=7A、B4-08=8A**，随后明确“确认执行”。  
> Batch 4 Gate：`PASS / USER_APPROVED / APPLIED_TO_WORKFILE`。

## P13-B4-01｜Priority 资格是单 Customer 后台独立开关；不由 Customer Level 自动产生

### 11.1.1 资格来源

Priority 资格是 **Customer 级独立特殊资格**：

- 后台针对单个 Customer 单独开启 / 关闭；
- 不由“普通 / 粉丝 / VIP / 已付费”等 Customer Level 名称自动产生；
- 不把 Priority 做成 Customer Level entitlement；
- 不因客户等级升级而自动获得 Priority；
- 不因客户等级降级而仅凭等级名自动关闭 Priority；
- Priority 资格与正式找车 entitlement 是两件独立事实。

正式找车资格继续服从 PDM-11：

> Customer 当前等级配置的 find-car entitlement → 是否允许形成 / 恢复正式 active Demand。

因此产生车辆级 Priority 至少要求：

1. Customer 账号与业务状态合法；
2. Customer 当前拥有后台单独开启的 Priority 资格；
3. Customer 已有合法 active + matching-ready Demand；
4. 当前 Match Result = current valid `high / acceptable`；
5. 存在合法当前业务负责人；
6. Vehicle / listing_cycle / Lock / Transaction 等 PDM-13 Guard 合法。

**只有 Priority 资格、没有合法 active Demand，不产生车辆级 Priority。**

### 11.1.2 普通 Customer 与 Priority Customer 共用 Matching

- 所有合法正式 Demand 共用 PDM-12 唯一 Matching Authority；
- 普通 Customer 的 Demand 照常产生 Match Result；
- Priority Customer 的 Demand 不使用第二套算法；
- hidden 但真实可售、listing_cycle 有效且其他 Guard 合法的 Vehicle 仍可内部 Matching；
- hidden 不等于不可 Matching。

Priority 是 Matching **之后**的车辆级排他保护层。

### 11.1.3 Priority 成立后的排他效果

某 Priority Customer 赢得同车仲裁并产生 active Priority 后：

- 同一 Vehicle 同一时刻只保留一个 active Priority；
- 其他普通 Customer 即使已有 current Match Result，也不能在保护期内通过普通后续链路取得新的该车 Recommendation / 普通展示机会；
- 无关普通员工不得通过普通链路穿透该 Priority 保护；
- 旧 Match Result 不因此物理删除，仍按 PDM-12 current/history 规则存在；
- Priority ended 后再按当前合法事实重新判断后续业务机会。

### 11.1.4 Priority 本身不让 Customer 自动看到 Vehicle

active Priority 建立后：

1. 当前负责对应 Customer / trigger Demand 的合法员工先获得业务处理视图；
2. 由该员工判断是否正式 Recommendation；
3. 只有 Recommendation / visibility grant Authority 合法成立后，Priority Customer 才获得车辆详情 visibility；
4. Priority 本身不得直接授予 Customer 详情可见权；
5. Recommendation 不重置 Priority TTL。

因此：

`Priority created ≠ Customer can see Vehicle`

### 11.1.5 当前业务处理人与管理范围

Priority 当前业务处理责任以 **trigger Demand 当前合法 responsible employee** 为主要业务责任来源，不把 Customer owner 字段直接等同于 Priority responsible。

- 对应 Demand responsible employee 可处理自己负责的 Priority；
- 经理 / 店长只能在当前合法管理 permission + data scope + object state 范围内监督 / 处理；
- 不因“经理 / 店长”职位自动拥有全局 Priority 权限；
- 4S Member 对名邦 Priority / CRM 业务 hard DENY；
- Priority Customer 资格开关属于后台单 Customer 控制平面治理，由当前合法后台配置权限与范围决定；普通负责销售不得仅因负责该 Customer 就自行开启资格，控制平面操作者也不因此自动成为 Priority 业务处理人。

### 11.1.6 不再建设独立全局 Priority 管理 capability

本轮用户口径替代历史“独立 `priority.view` 穿透查看权限”方向：

- 不新增独立 `priority.view` 作为全局查看通道；
- 不新增 `priority.manage`；
- 不恢复 `priority.override`；
- 不允许人工创建 / 转让 / 覆盖 / 续期 Priority；
- Priority 查看 / 处理必须建立在当前业务责任、合法管理范围及 PDM-02 通用 permission/data scope/object-state 模型之上。

Priority 资格开关仍属于后台单 Customer 控制平面动作，不允许普通负责销售仅因“这个客户归我”就自行给该客户开启 Priority。

---

## P13-B4-02｜多 Priority Customer 同车仲裁：2A

多个具备 Priority 资格的 Customer 同时对同一 Vehicle 形成合法候选时：

> **`high > acceptable → Demand.created_at 更早 → demand_id 更小`**

规则：

- `high` 优先于 `acceptable`；
- 同 tier 时使用 PDM-11 不可变 `Demand.created_at`；
- 仍相同则 `demand_id` 更小者优先，作为确定性最终 tie-break；
- 不使用 Customer Level / VIP 名称 / 销售职位作为额外仲裁等级；
- Priority Customer 之间不另建设“高级 Priority / 普通 Priority”等层级。

同一 Customer 多条 Demand 命中同车时：

- 先按同一确定性原则选出一个最佳 `trigger_demand_id`；
- 跨 Customer 仲裁时该 Customer 只出现一次；
- 不允许同一 Customer 多条 Demand 人为增加同车竞争权重。

---

## P13-B4-03｜Priority TTL：3A

默认 Priority TTL：

> **24 小时 / 86400 秒**

该 TTL 表示**单笔 Priority 自动保护的最长时间上限**，不是销售必须等待满 24 小时。后台可调整后续新建 Priority 的默认保护时长；合法 responsible employee 可在 TTL 到期前主动释放当前 Priority。

规则：

- 后台提供全局默认值配置；
- 新 Priority 创建时将当时默认 TTL 固化为该笔 Priority 的 `expires_at`；
- 后续修改全局默认值，不追改已有 Priority；
- 页面刷新不重新计时；
- Recommendation 不重新计时；
- Matching 重算不重新计时；
- trigger Demand 切换不重新计时；
- 责任交接不暂停、不延长、不重置；
- **不提供人工续期**；
- ended Priority 不允许通过“续期”按钮恢复 active。

Priority TTL 与 Lock 默认 3 天属于不同业务时钟，不要求保持一致。

全局 TTL 默认值的后台配置属于控制平面配置；具体 P22/P25 页面与审计投影留后续域承接。

---

## P13-B4-04｜同 listing_cycle 再获得规则：4A

同一 `customer + vehicle + listing_cycle` 的 Priority 因以下原因结束后，不允许该 Customer 在同一 listing_cycle 内再次**自动**取得该 Vehicle 的 Priority：

- Customer 明确不要 / 放弃；
- 当前合法 responsible employee 主动执行“释放 Priority / 不推荐此车”；
- TTL expired。

**Recommendation 取消本身不是 Priority ended reason，也不会自动触发 same-cycle 抑制。** 如果员工在取消 Recommendation 的同时明确决定不再为该 Customer 保留本车，必须另外执行 Priority release；前端允许后续做成组合操作，但底层是两个独立业务动作。

目的：

> 防止同一 Customer 在同一上架周期反复占用同一 Vehicle 的保护窗口。

但如果此前结束原因属于“当时业务事实不再合法”，且后来发生了**新的真实事实变化**，例如：

- 原 Match Result invalidated，后因 Vehicle / Demand 合法事实变化重新形成新的 current valid Match Result；
- 原 Priority 资格被关闭，后又被后台重新开启；
- 原 Demand 失效后后续产生新的合法业务事实；

则可按当前全部 Guard 重新参加仲裁，不将旧 ended 记录物理抹除。

新的 `listing_cycle` 一律作为新的资源周期重新计算，不继承旧周期的自动再获得限制。

---

## P13-B4-05｜trigger Demand 失效：5A

Priority 必须保存合法 `trigger_demand_id`，且该 Demand 必须属于同一 Customer。

当当前 trigger Demand 失效、paused、completed、cancelled、readiness 失效或其 Match Result 不再 current valid 时：

1. 先检查**同一 Customer**是否存在其他：
   - active；
   - matching-ready；
   - 对该 Vehicle 当前 Match Result = `high / acceptable`；
   - 其他 Guard 合法的 Demand。
2. 若存在：
   - 选择新的合法 `trigger_demand_id`；
   - Priority 本身继续 active；
   - 不重建 Priority；
   - 原 `expires_at` 保持不变；
   - 历史记录 trigger Demand 切换事实。
3. 若不存在：
   - 当前 Priority ended；
   - 记录真实结束原因；
   - 进入 B4-08 的释放 / 重新仲裁流程。

不得通过 trigger Demand 切换制造新一轮完整 TTL。

---

## P13-B4-06｜active Lock / Transaction：6A

### active Lock 已存在

PDM-12 仍可继续产生 Match Result，但：

> **Vehicle 已存在 active Lock 时不得新建 Priority。**

不得把 active Lock 直接改写成 `no_match`；Match Result 与 Priority Guard 分层。

### active Priority 后正式 Lock 成立

一旦 Vehicle 正式形成 active Lock：

- 当前 active Priority 结束；
- 若是该 Priority Customer 自己成功 Lock，可记录 `converted_to_lock`；
- 若由其他合法 Customer / 业务形成 Lock，则记录独立 Lock takeover reason；
- Priority 不是 Lock 拒绝条件或锁车排队优先级；
- Lock 的唯一性 / LockRequest / Waitlist 继续由 PDM-18 冻结。

### Lock 取消 / 到期

- 旧 Priority 不自动恢复；
- 不恢复旧 `expires_at`；
- Vehicle 若重新开放，则读取当时 current legal Match Result 进入新一轮 Priority 仲裁 / 普通业务流程。

### Transaction

- Vehicle 已有 in-progress Transaction 时不得新建 Priority；
- active Priority 存续期间 Vehicle 进入正式 in-progress Transaction，当前 Priority 结束；
- Transaction 取消 / 纠错后 Vehicle 真正重新开放时，不恢复旧 Priority，按当时合法事实重新仲裁；
- Transaction / Deposit / Refund / Correction 的完整状态机由 PDM-19 承接。

---

## P13-B4-07｜责任交接与 TTL：7A

Priority 当前业务负责人跟随 **trigger Demand 的当前合法 responsible employee**，不把 Customer owner 直接当作 Priority responsible。

员工发生离职 / inactive / 调店 / 降权 / 失去承责资格时：

- Priority 进入正式 Handover Batch；
- 原员工立即失去不再合法的当前访问 / 处理能力；
- 合法新负责人接手 Priority 当前业务责任；
- Priority 在其他业务 Guard 仍合法时可以继续 active；
- **TTL 继续自然运行，不暂停、不延长、不重置**；
- 新负责人只获得剩余保护时间；
- creator / created_at / 原 responsible / 历史 handoff 不改写。

### 没有合法负责人

- 没有合法 Demand responsible employee 时，不允许新建车辆级 Priority；
- 已 active Priority 因突发人员失效进入待交接时，不能因内部交接而无限冻结 Vehicle；
- TTL 继续自然运行；
- 若在 TTL 到期前完成合法交接，新负责人接手剩余时间；
- 若到期前仍未完成，则按 TTL 正常 expired；
- 不能由 System Admin 业务兜底成为销售负责人。

---

## P13-B4-08｜公海保护、ended reason 与重新释放：8A

### 公海保护

- **Priority Customer 资格本身不是公海保护条件**；
- **active Priority 是真实公海保护事实**；
- Customer 存在 active Priority 时，不得按普通无业务 Customer 直接送入公海；
- Priority ended 后，重新读取当时是否仍存在 pending Application、active/paused Demand、Lock、Transaction 或其他 PDM-17 当前 Authority 认可的保护事实；
- 不得因为历史上曾有 Priority 永久禁止入公海。

### ended reason

Priority 主状态继续保持：

- `active`
- `ended`

结束原因独立记录，至少能够区分：

- Customer 明确不要 / 放弃；
- 员工主动执行“释放 Priority / 不推荐此车”；
- TTL expired；
- Demand 不再合法 / 无可切换 trigger Demand；
- Priority Customer 资格关闭；
- Match invalidated；
- Vehicle unavailable；
- Lock converted / Lock takeover；
- Transaction started；
- 其他正式 correction / lifecycle reason。

不得用一个无语义的 `ended` 覆盖真实结束原因。

### Priority ended 后重新仲裁

Priority ended 且 Vehicle 当前真实开放、没有 active Lock / in-progress Transaction、listing_cycle 有效时：

1. 读取**所有 Customer**当前合法 Match Result；
2. 不只检查原 Customer；
3. 不只检查“下一个 Priority Customer”；
4. 若存在合法 Priority 候选，重新按 B4-02 仲裁；
5. 若不存在合法 Priority 候选，Vehicle 返回普通后续业务流；
6. 若没有任何合法 Priority 候选，则返回普通后续业务流；若当前也没有任何普通可继续处理的合法 Match Result，则本轮不创建新的 Priority / Recommendation，Vehicle 仍保留在未来 Matching 体系中；
7. 旧 Priority 历史不删除、不改写。

---

# 12. PDM-13 → Future PDM Handoff

Batch 4 新增并冻结以下跨域输入，目标域不得重新发明 PDM-13 Authority：

### HO-P13-P14-001｜Priority 对 Recommendation / visibility 的排他压制边界

PDM-13 已冻结：

- Priority 本身不授 Customer 车辆详情 visibility；
- Priority responsible employee 先看到并决定是否 Recommendation；
- Recommendation / visibility grant 合法成立后，Priority Customer 才可看详情；
- active Priority 对其他 Customer 的普通新 Recommendation / 普通可见机会具有排他保护；
- 若其他 Customer 在该 Priority 建立前已经存在 active Recommendation / visibility grant，**不得删除 Recommendation 历史**；
- 当前 Priority 在正式 Recommendation 成立后允许保存对应 `recommendation_id` 作为关联/追溯字段，但不得把 Recommendation 合并成 Priority 子状态；
- Priority TTL 到期或 Priority release 只结束排他保护，不得自动结束仍合法的 Recommendation；
- Recommendation 取消本身不得自动结束 Priority，除非员工同时明确执行 Priority release。

PDM-14 必须继续冻结：

- 既有 active Recommendation / visibility grant 在后续 active Priority 期间如何做临时 visibility suppression；
- Priority ended 后，在 Vehicle 仍可售、Recommendation 仍 active、listing_cycle 仍合法等条件下，visibility 是否以及如何恢复；
- suppression / restore 的审计与幂等边界。

### HO-P13-P17-001｜active Priority 的公海保护

- Priority 资格本身不是公海保护；
- active Priority 是公海保护事实；
- ended 后重新读取其他公海保护事实。

### HO-P13-P18-001｜Lock × Priority

- active Lock 不阻断 Matching，但阻止新 Priority；
- 正式 Lock 成立结束当前 active Priority；
- Lock 取消 / 到期不恢复旧 Priority；
- 若原 Customer 的 Recommendation 仍合法，其可见性继续按 Recommendation / PDM-14 Authority 判断，不因 Priority 已结束而自动撤销；
- Recommendation 取消不得反向撤销已经合法成立的 Lock；
- Vehicle 重新开放后重新按当前事实仲裁。

### HO-P13-P19-001｜Transaction × Priority

- in-progress Transaction 阻止新 Priority；
- Transaction 开始结束已有 active Priority；
- Transaction 取消 / 纠错后不恢复旧 Priority，Vehicle 真正开放后重新仲裁；
- Recommendation 取消不得反向撤销已经合法成立的 Transaction。

### HO-P13-P25-001｜Priority 审计

PDM-25 需承接至少：

- Priority Customer 资格开启 / 关闭；
- 创建 / 仲裁结果；
- trigger Demand；
- TTL snapshot / expires_at；
- handoff；
- ended reason；
- Lock / Transaction takeover；
- re-arbitration；
- stale / invalidated / tier downgrade 导致的 lifecycle 变化；
- 销售 TTL 前主动 release / 不推荐此车；
- Recommendation 与 Priority 的关联、组合操作中两个独立 domain action；
- actor / time / before-after / source facts。

---

# 13. Batch 4 后本域待 Final 前复核项

Batch 1～4 的产品选择已全部完成。

进入 Final 前完整性复核时必须重点机械检查：

1. Source→Atom 是否仍有历史稳定细节未映射；
2. Atom→Source 是否存在无证据外推；
3. Priority 资格开关与 Customer Level find-car entitlement 是否仍有混写；
4. 旧独立 `priority.view` 是否已被 B4-01 正式 supersede，Current carrier 是否登记 stale；
5. hidden + Priority + Recommendation + visibility 是否存在跨域缺口；
6. Lock / Transaction / public pool handoff 是否完整；
7. same listing_cycle 再获得规则是否存在结束原因覆盖缺口；
8. trigger Demand 切换是否与不可变 `Demand.created_at`、原 `expires_at` 一致；
9. TTL 24h / 后台全局可配 / 不人工续期是否在所有证据链一致；
10. 5 条 incoming handoff 是否均有明确 Atom / Final 去向；
11. 是否还需要补 PDM-20/21/22/25 的页面 / Action / 配置 / 审计 handoff；
12. stale carrier 是否完整登记但未提前施工。

当前：

`PDM13_LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`

---

# 14. Final 前第一轮完整性复核发现｜USER APPROVED / APPLIED

第一轮 Final 前完整性复核未直接判 PASS，共发现 6 组信息保真缺口：

- `P13-LIA-01`：Priority 单 Customer 资格开关完整生命周期；
- `P13-LIA-02`：单 Customer 可同时拥有多辆 active Priority；
- `P13-LIA-03`：Priority 事件驱动 / 重评触发集；
- `P13-LIA-04`：Priority 对普通入口绕过与公共统计的排他边界；
- `P13-LIA-05`：Priority 与价格 / 查价权彻底分离；
- `P13-LIA-06`：补齐 PDM-20 / PDM-21 / PDM-22 future handoff。

用户已：

> `P13-LIA-01～P13-LIA-06 = ALL USER_APPROVED`

并明确：

> `确认执行`

以下修复只补齐已存在 / 已确认 Authority 的完整表达，不建立新的第五个产品裁决 Batch。

---

## P13-LIA-01｜Priority 单 Customer 资格开关完整生命周期

Priority 资格继续冻结为：

> **Customer 级长期独立属性 / 后台针对单个 Customer 单独开启或关闭**

完整边界：

- 不属于某一条 Demand；
- 不由 Customer Level 自动产生；
- 不支持批量给一组 Customer 开启 / 关闭 Priority 资格；
- 默认持续有效，直到后台合法控制平面主动关闭；
- 资格本身不会因为 Customer 进入公海而丢失；
- 资格本身不是公海保护事实；
- 普通负责销售不得仅因负责该 Customer 就自行开启 Priority 资格；
- 开启 / 关闭资格默认不强制填写 reason；
- 但至少必须审计 Customer、动作、actor、time 与前后状态；
- 更完整 before/after/source-fact 审计继续由 PDM-25 承接。

### 开启资格

开启 Priority 资格：

- 不创建 Application；
- 不创建 Demand；
- 不自动创建 Priority；
- 不修改 Customer Level；
- 对该 Customer 当前已经合法的 active + matching-ready Demand / current valid Match Result 进入 Priority 受影响范围重评；
- 若没有合法 active Demand，则只保存 Customer 级资格，不产生车辆级 Priority。

### 关闭资格

关闭 Priority 资格：

- 阻止后续新 Priority；
- 该 Customer 当前 active Priority 必须结束；
- ended reason 记录 `priority_customer_disabled` 或当前正式等价 reason；
- 被释放 Vehicle 按 B4-08 重新读取所有 Customer 当前合法 Match Result 并重新仲裁；
- **不因此暂停 / 取消 / 结束该 Customer 的合法 Demand**；
- 该 Customer 仍可按非-Priority Customer 身份继续参与 PDM-12 普通 Matching 与后续普通业务流。

---

## P13-LIA-02｜一个 Customer 可同时拥有多辆 active Priority

除“同一 Vehicle 同一时刻最多 1 个 active Priority”外，反方向同时冻结：

> **同一 Priority Customer 可以同时拥有多辆不同 Vehicle 的 active Priority，V1 不设 Customer 侧 active Priority 数量上限。**

因此不得实现为：

- 一个 Customer 只能有 1 辆 Priority Vehicle；
- 新 Priority 自动结束该 Customer 的其他合法 Priority；
- 按 Customer 维度做固定 N 辆上限；
- 用 Priority 数量作为跨 Vehicle 的额外仲裁分值。

每辆 Vehicle 分别：

- 独立仲裁；
- 独立 TTL / expires_at；
- 独立 trigger Demand；
- 独立 lifecycle / ended reason；
- 独立历史。

---

## P13-LIA-03｜Priority 采用事件驱动 + 受影响范围重评

Priority 不建设独立 Matching Engine，但必须对会改变 Priority 资格 / Guard / 资源开放状态的事件做受影响范围重评。

至少包括：

1. 新 Vehicle 进入真实可售 + listing_cycle 有效状态；
2. Vehicle 从真实不可参与状态恢复为合法可 Matching / 可进入 Priority Guard；
3. Vehicle 关键事实或合法 Customer 展示价变化，并由 PDM-12 产生新的 Matching change fact；
4. Demand 首次进入 active + matching-ready；
5. paused Demand 正式 resume 并重新通过 Guard；
6. Demand 标准条件 / 销售匹配描述变化导致 PDM-12 current Match Result 改变；
7. Demand paused / completed / cancelled / readiness 失效；
8. Priority Customer 资格开启 / 关闭；
9. trigger Demand / responsible employee 合法责任关系变化；
10. Priority 主动释放 / ended / TTL expired；
11. active Lock 结束 / 到期且 Vehicle 真正重新开放；
12. Transaction 取消 / 纠错且 Vehicle 真正重新开放；
13. 其他 PDM-12 current Match Result stale / invalidated / tier change 事实。

执行原则：

- PDM-12 先负责 Matching 重算 / current Match Result；
- PDM-13 只消费 PDM-12 当前结果与自身 Guard；
- 只重评受影响 Customer / Demand / Vehicle 范围；
- 不因为一个 Priority 事件无脑全库 Vehicle × Demand 重算；
- 系统以 event-driven 为主；
- 定时任务仅用于 TTL 到期等必要兜底，不得作为唯一 Priority 产生 / 释放机制；
- 重试必须遵守唯一 active 与幂等规则，不得重复创建并行 Priority。

---

## P13-LIA-04｜active Priority 对普通入口绕过与公共统计的排他边界

active Priority 的“排他”不能只限制某一个列表入口。

在保护期内，无关 Customer / 无关普通员工不得通过以下**普通入口**绕过 Priority：

- 公共 Feed / 车源列表；
- 普通客户端搜索结果；
- 普通筛选 / 排序结果；
- 普通分享链接；
- 旧普通分享链接；
- 不具备当前合法 visibility Authority 的旧业务链接 / 历史入口；
- 其他仅依赖“Vehicle 当前可售”而没有独立合法授权的普通入口。

边界：

- PDM-12 Match Result 不因此删除；
- hidden Vehicle 继续服从 hidden 底层状态；
- Priority Customer 本人仍需 Recommendation / visibility grant 才能看详情；
- 在 Priority 建立前已经存在的 active Recommendation / visibility grant 不物理删除；
- 既有 Recommendation/visibility 在新 active Priority 期间如何 suppression、Priority ended 后如何 restore，继续由 `HO-P13-P14-001` 交 PDM-14 冻结。

### 公共统计

面向 Customer 的普通公共统计必须与“当前真正公开可浏览”一致：

- active Priority 保护中的 Vehicle 不计入普通公共“在售车源”数量；
- hidden / offline / unavailable / sold / draft 等本来不公开的 Vehicle 同样不计；
- “今日新增”等普通公共新增统计只统计当前真正公开可浏览、且满足该统计自身时间定义的 Vehicle；
- Priority 结束不等于强制计入公开统计，仍须先读取底层 Vehicle visibility / availability。

公共统计的客户端具体投影交 PDM-20 承接。

---

## P13-LIA-05｜Priority 与价格 / 查价权彻底分离

Priority 只表示：

> **Matching 后的限时车辆机会排他保护**

Priority 本身不得：

- 授予 Customer 批发价查看权；
- 免费解锁该 Vehicle 价格；
- 增加当天查价次数；
- 消耗 Customer 的普通 daily quota；
- 修改 LIMITED / UNLIMITED 等 Customer Level 价格权益；
- 修改 customer_list_price / internal_wholesale_price；
- 形成新的价格公式或价格快照。

价格 Authority 继续完全服从 PDM-10。

正式 Recommendation 若按 PDM-10 / PDM-14 Authority 给当前 `customer + vehicle + listing_cycle` 授免费查价权：

- 权利来源是 Recommendation；
- 不是 Priority；
- Priority ended 不得反向改写 PDM-10 已冻结的 Recommendation 查价权生命周期。

因此：

`Priority qualification / active Priority ≠ price entitlement / price unlock`

---

## P13-LIA-06｜补齐 PDM-20 / PDM-21 / PDM-22 future handoff

### HO-P13-P20-001｜客户端 Priority 投影

PDM-20 必须承接：

- 客户端不得暴露 `Priority`、优先保护、客户专属、内部仲裁等级等内部术语；
- active Priority 车辆不能通过普通 Feed / 搜索 / 筛选 / 普通分享 / 无合法授权旧链接向无关 Customer 穿透；
- Priority Customer 本人也不能仅因 Priority 自动看详情；
- 客户详情 visibility 必须读取 Recommendation / visibility grant 等合法来源；
- 面向客户的“在售车源 / 今日新增”等公共统计必须排除当前不属于普通公开可浏览集合的 Priority 保护 Vehicle；
- Priority ended 后客户端是否重新出现必须读取当时底层 visibility、Vehicle 状态及其他合法业务授权，不能简单“Priority ended = 强制公开”。

### HO-P13-P21-001｜员工端 Priority 真人 Action

PDM-21 必须承接：

- 当前 trigger Demand 合法 responsible employee 的 Priority 待处理 / active 视图；
- 在合法管理范围内的经理 / 店长监督处理；
- 显示当前 Vehicle、Customer、trigger Demand、Match tier、剩余 TTL / expires_at、当前 responsible、必要 ended/history；
- Priority 处理入口允许走既有合法业务动作，例如正式 Recommendation、在 TTL 到期前明确“释放 Priority / 不推荐此车”；
- 若尚未正式 Recommendation，不得把 Priority release 错叫成“取消 Recommendation”；若 Recommendation 已存在，可在员工体验层提供“结束推荐并释放保护”的组合入口，但底层必须分别执行 Recommendation end 与 Priority release，并分别校验/审计；
- 释放 / Recommendation / 其他敏感提交继续服从 PDM-02 `identity + permission + data scope + object state` 与对应业务 Authority；
- 不得提供“人工创建 Priority / 转给其他 Customer / 强制覆盖 / 修改 expires_at / 人工续期 / 恢复 ended Priority”按钮；
- 不恢复独立全局 `priority.view / priority.manage / priority.override` 体系；
- 4S Member 对该名邦 Customer / Priority 业务 hard DENY。

### HO-P13-P22-001｜PC 后台 Priority 控制平面

PDM-22 必须承接至少两个真实配置对象：

1. **单 Customer Priority 资格开关**
   - 针对单个 Customer 开启 / 关闭；
   - 不支持批量；
   - 不与 Customer Level find-car entitlement 混成同一开关；
   - 普通负责销售不能仅因负责该 Customer 自行开启；
   - 保存时按当前合法后台 identity / permission / data scope / object state 重验；
   - 至少记录 Customer、before/after、actor、time。

2. **Priority 全局默认 TTL**
   - 默认 `86400s / 24h`；
   - 修改只影响后续新建 Priority；
   - 不追改已有 Priority expires_at；
   - 不提供逐笔人工续期；
   - 配置变更进入统一审计。

具体页面命名 / capability 命名由 PDM-22 在不改变上述产品语义的前提下冻结。

---

# 15. Final 前修复状态

`P13-LIA-01～P13-LIA-06 = PASS / USER_APPROVED / APPLIED`

第一轮发现的 6 组缺口已经全部进入当前工作 Authority。

当前继续保持：

- incoming handoff 5 / 5 = `HANDOFF_ACCEPTED`，Final / Integrity closeout 前不提前关闭；
- IA / Low-Fi stale carrier 只登记、不施工；
- Engineering Delta 不执行。

---

# 16. Final Overview 复查补漏｜P13-LIA-07～LIA-08｜USER APPROVED / APPLIED

此前 Final 前复核曾判定 PASS；在生成 Final Domain Overview 后再次对照 9/17 原始 Priority 规则，发现两组仍未完整落成 Atom 的稳定边界。用户已听取中文业务解释并明确确认执行。

## P13-LIA-07｜active Priority 的 Match Result 降级必须立即重评

如果当前 active Priority 的 trigger Demand × Vehicle Match Result 仍是“current”，但 tier 因真实事实变化从：

> `high / acceptable`

降为：

> `confirmation_needed / no_match`

则当前 Priority 不得继续占用 Vehicle 直到 TTL 到期。

处理顺序：

1. 先检查同一 Customer 是否还有其他 active + matching-ready Demand 对该 Vehicle 保持 current `high / acceptable`；
2. 若有，按现有确定性规则切换到新的 `trigger_demand_id`，原 Priority 继续 active，原 `expires_at` 不变；
3. 若没有，当前 Priority ended，记录 `match_invalidated` 或正式等价真实 reason；
4. Vehicle 立即读取所有 Customer 当前合法 Match Result，按 B4-02 重新仲裁；
5. 若没有新的 Priority candidate，则进入普通后续业务流；
6. 若当前没有任何客户可继续处理，本轮不创建新的 Priority / Recommendation，但 Vehicle 不退出未来 Matching，后续新 Demand / Vehicle facts / Match change 仍可再次触发。

因此：

> **Priority 不能因为“曾经匹配成功”就一直占满 TTL；当前事实已经不符合时必须释放。**

---

## P13-LIA-08｜TTL 是最长保护上限；销售可提前释放，Recommendation / Lock / Transaction 不互相倒删

### 16.8.1 销售可在 TTL 前主动 release

后台配置的 24h（或未来调整后的默认值）只是单笔 Priority 的**最长自动保护时间**。

当前 trigger Demand 的合法 responsible employee 如果判断：

> “这台车不适合这个 Customer，不准备推荐”

无需等待 TTL 到期，可立即执行：

> **释放 Priority / 不推荐此车**

该动作：

- 结束当前 active Priority；
- 保存真实 release reason / actor / time；
- 触发同一 Vehicle 的当前合法候选重新仲裁；
- 原 Customer 在同一 listing_cycle 内进入 B4-04 自动再获得抑制，避免刚释放又被相同旧事实立即选回；
- 其他 Priority Customer 有合法候选 → 重新仲裁；
- 没有 Priority Customer、但普通 Customer 有合法 Match Result → 恢复普通后续机会；
- 当前谁都不符合 → 本轮不生成新 Priority / Recommendation，Vehicle 继续留在未来 Matching 体系。

该 release 是**合法提前结束**，不是人工修改 TTL、不是人工续期、不是 override。

### 16.8.2 “释放 Priority”与“取消 Recommendation”必须分开

如果尚未建立正式 Recommendation：

- 只能叫“释放 Priority / 不推荐此车”；
- 不存在“取消 Recommendation”。

如果已经存在正式 Recommendation：

- Recommendation 与 Priority 仍是两个独立对象；
- 可以在员工体验层提供一个组合操作，例如“结束推荐并释放保护”；
- 但底层必须分别执行 Recommendation end 与 Priority release；
- 两个动作分别校验、分别审计、分别保留历史；
- **Recommendation 取消本身不会自动结束 Priority**；
- **Priority release / TTL expired 本身也不会自动结束仍合法的 Recommendation**。

正式 Recommendation 建立后，Priority 可保存对应 `recommendation_id` 作为关联/追溯字段，但不得把两者合成同一个生命周期对象。

### 16.8.3 不允许向后撤销已成立业务

- Recommendation 取消不得反向撤销已经合法成立的 Lock；
- Recommendation 取消不得反向撤销已经合法成立的 Transaction；
- Priority ended / expired / release 不得反向撤销已经合法成立的 Lock / Transaction；
- Lock 取消 / 到期不会恢复旧 Priority；
- 若 Lock 后 Priority 已 ended，而原 Recommendation 仍 active，其客户 visibility 继续按 Recommendation / PDM-14 Authority 判断；
- Transaction 取消 / correction 后若 Vehicle 真正重新开放，也不恢复旧 Priority，重新读取当前事实仲裁。

---

# 17. R2 修复状态

`P13-LIA-07～P13-LIA-08 = PASS / USER_APPROVED / APPLIED`

同时对既有 B4 语义做一致性收正：

- TTL = 最长保护上限，不是必须等待满时长；
- 员工主动 release 是合法 Priority ended reason；
- Recommendation cancellation alone 从 Priority ended reason 中移除；
- Recommendation cancellation alone 不触发 same-cycle Priority suppression；
- same-cycle suppression 由 Customer 放弃、员工明确 Priority release、TTL expired 等 Priority 自身 ended reason 驱动；
- Priority / Recommendation / Lock / Transaction 保持对象与生命周期分离。

此前 `PDM-13_Final前完整性复核_2026-10-05.md` 保留为第一版历史审计报告；R2 修复后必须重新生成新的 Final 前完整性复核报告，不覆盖旧审计事实。

---

# 18. 当前唯一下一步

> **重新执行 PDM-13 Final 前完整性复核 R2：重点验证 Match tier downgrade、TTL 前销售 release、same-cycle suppression、Recommendation/Priority 独立性、Lock/Transaction 不反向撤销、handoff 与 stale carrier。R2 全部 PASS 后，重新生成修正后的 Final Domain Overview 候选提交用户最终批准。**

IA / Low-Fi / Engineering 继续禁止施工。
