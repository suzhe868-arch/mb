# PDM-14｜Recommendation / 普通分享 / 单车授权 / 隐藏车客户可见性｜规则原子重建工作版

> 日期：2026-10-05  
> 状态：`IN_PROGRESS / START_GATE_PASS / BATCH_1_USER_APPROVED`  
> 当前 Authority：仅作为 PDM-14 工作版；PDM-14 Final 发布前不得标记 COMPLETE。  
> 方法：9/19 主底盘 + 前向历史补全 + 后向显式 supersession + Current Authority Refresh + Current Implementation Fact + Cross-PDM Handoff。

---

## 1. 本域边界

PDM-14 负责：

- Recommendation 正式对象与生命周期；
- 普通分享与 Recommendation 的边界；
- hidden Vehicle 的 Customer 单车 visibility grant；
- Recommendation 与当前 `listing_cycle` 的关系；
- Recommendation 与查价权、Priority、Demand、Lock、Transaction 的边界；
- Customer disable / restore 对 Recommendation 客户侧能力的影响；
- 既有 Recommendation 在其他 Customer active Priority 期间的 suppression / restore；
- Recommendation 幂等、历史、来源 Demand、价格快照与审计承接。

本域不重建：

- Customer 身份与 owner 主规则：PDM-01 / PDM-03；
- Customer Level / find-car entitlement：PDM-11；
- Matching Authority：PDM-12；
- Priority Authority：PDM-13；
- 价格与 Recommendation 免费查价权本体：PDM-10；
- Lock / Transaction 完整状态机：PDM-18 / PDM-19；
- IA / Low-Fi / Engineering：当前阶段禁止施工。

---

## 2. Start Gate｜证据重建结果

### 2.1 已读取的主来源

- 9/19 C3：hidden != offline；hidden 可售但退出普通公开展示；
- 9/19 R7：Recommendation 正式对象、普通分享边界、同周期幂等、结束/作废、历史保留、查价权、旧独立 Recommendation qualification；
- 9/19 R10：我的推荐、员工推荐入口、普通分享、分享卡片与当前状态重算；
- 001～078 M05：Recommendation 细节缺失、known-customer context、REC URL 不应另造、Recommendation price snapshot；
- 001～078 M16：我的推荐字段与分享入口 carrier 差异；
- 001～078 M11：价格 / Recommendation 权利相关补充；
- PDM-01 / 03 / 04 / 07 / 10 / 11 / 12 / 13 Final；
- target=PDM-14 的 8 条 Cross-PDM handoff。

### 2.2 incoming handoff

以下 8 条已从 `HANDOFF_OPEN` 接收为 `HANDOFF_ACCEPTED`，但在 PDM-14 Final / Integrity closeout 前不得关闭：

1. `HO-P01-P14-001`：Recommendation 生命周期与当前 listing_cycle 权利；不得重建 Customer 身份；
2. `HO-P03-P14-001`：Recommendation / 普通分享 / hidden 单车授权；普通分享不得替代 Recommendation 权利；
3. `HO-P04-P14-001`：hidden 单车授权与 listing_cycle 生命周期；
4. `HO-P07-P14-001`：档案不完整本身不得阻止 Recommendation；报告可见性与 Recommendation 权利分层；
5. `HO-P10-P14-001`：Recommendation 免费授当前 customer+vehicle+listing_cycle 查价权，结束/owner/负责人变化/离职不追回；
6. `HO-P11-P14-001`：source_demand_id、Demand 结束不删除历史 Recommendation、Recommendation 不反向激活 Demand；
7. `HO-P12-P14-001`：Match Result 与 Recommendation/visibility grant 分离；high/acceptable 不自动 Recommendation；
8. `HO-P13-P14-001`：Priority 不授 visibility；Priority/Recommendation 独立；既有 Recommendation/visibility 在其他 Customer Priority 期间需 suppression/restore。

---

## 3. Batch 1｜稳定一致规则原子

> 用户已完成本批审查，并于 2026-10-05 明确“确认执行”。以下进入 PDM-14 当前工作 Authority；后续 Batch 2～4 仍可发现需要显式 supersede / 补充的旧规则，但不得静默反向改写本批。

### P14-A01｜Recommendation 是独立正式业务对象

Recommendation 与 Matching、Priority、普通分享、visibility grant 分离。

- Match Result=high/acceptable 不自动创建 Recommendation；
- Priority 不自动创建 Recommendation；
- 普通分享不创建 Recommendation；
- visibility grant 不是 Recommendation 本体；
- 后续对象可以建立关联字段用于追溯，但不得合并成同一状态机。

### P14-A02｜核心绑定与 active 幂等

Recommendation 核心绑定：

> `customer_id + vehicle_id + listing_cycle`

同一 customer + vehicle + listing_cycle 已存在 active Recommendation 时：

- 不重复创建第二个 active Recommendation；
- 重复动作只记录 touch / interaction / audit；
- 同一 Customer 可同时拥有多台不同 Vehicle 的 active Recommendation。

### P14-A03｜无固定 N 天自动过期

Recommendation 不采用固定 N 天 TTL。

Recommendation 可因正式 lifecycle action、listing_cycle 结束或其他合法终止事实进入 ended / void 等非 active 状态；历史必须保留。

### P14-A04｜核心历史事实不可直接改写

Recommendation 创建后至少以下历史事实不可被普通编辑直接重写：

- customer；
- vehicle；
- listing_cycle；
- recommender；
- created_at。

创建错误时使用正式 void / end 并保留历史；需要正确关系时重新创建合法 Recommendation。

### P14-A05｜同周期结束后可重新推荐；新周期必须新建

- 同一 listing_cycle 内旧 Recommendation 已合法 ended / void 后，如当前全部 Guard 再次满足，可以新建新的 Recommendation；
- Vehicle 进入新的 listing_cycle 后，旧 Recommendation 不跨周期自动继承；
- 新周期需要重新建立 Recommendation。

### P14-A06｜recommender 是创建时历史事实

`recommender` 记录 Recommendation 创建当时的合法推荐员工。

后续：

- Customer owner 变化；
- source Demand 负责人变化；
- 原推荐人离职 / inactive；
- 正式 handover；

均不得回写历史 recommender。

### P14-A07｜普通分享不等于 Recommendation

普通分享只是车辆传播 / 进入路径：

- 不创建 Recommendation；
- 不转移 Recommendation 身份；
- 不授 Recommendation 免费查价权；
- 不继承原 Customer 的内部模式 / 单车业务权；
- 不建设第二套 REC 专属 URL / 专属推荐链接机制。

正式 Recommendation 是数据库业务事实；需要把车发给 Customer 时仍可使用普通车辆分享能力。

### P14-A08｜分享接收人按自己的 Customer 身份与归属判断

B 打开 A 分享的车辆时：

- B 使用自己的 customer_id 与当前权益判断；
- 不继承 A 的 Recommendation / price / visibility；
- ownerless 新 Customer 的分享归属按 PDM-03 当前规则处理；
- 已有 owner 的 Customer 不因后来打开分享而被抢 owner。

因此，旧“普通分享永远 SOURCE_ONLY / 永不影响 owner”只在已被 PDM-03 supersede 的范围内保留历史，不得恢复成全局规则。

### P14-A09｜hidden Vehicle 的 Recommendation 单车可见授权

hidden 但真实可售的 Vehicle：

- 可继续参与合法 Matching；
- 正式 Recommendation 成立后，可以为该 Customer 建立对应单车 visibility grant；
- grant 只让该 Customer 在合法边界内访问该 Vehicle；
- 不改变 Vehicle 的 hidden 状态；
- 不把 Vehicle 重新放回普通公开 Feed；
- Priority 本身不创建该 grant。

### P14-A10｜Recommendation end 与其他独立业务保护关系

Recommendation 自身 end / void 时：

- 结束仅由 Recommendation 产生的 visibility grant；
- 不得反向取消已经合法成立的 Lock；
- 不得反向取消已经合法成立的 Transaction；
- 若 Customer 因其他独立合法业务关系仍有访问权，则按对应 Authority 保留，不由 Recommendation end 强行抹除。

### P14-A11｜Recommendation 免费查价权

继承 PDM-10：

正式 Recommendation 合法成立时，对：

> `customer + vehicle + current listing_cycle`

免费授予该 Vehicle 的批发车价格查看权，不消耗普通 daily quota。

该权利：

- 仅限被推荐 Vehicle；
- 不解锁整个库存；
- 普通分享 / 收藏不授予；
- 不允许二次分享转移；
- Recommendation 后续结束、owner / 负责人变化、原销售离职均不追回已成立的当前周期权利；
- listing_cycle 结束后不跨新周期继承。

### P14-A12｜Recommendation 价格快照

Recommendation 创建时保存必要的不可变价格快照：

- 用于历史 Recommendation 展示“当时价格事实”；
- 后续上游调价、阶梯、覆盖价、source_type 等变化不得回写历史快照；
- 当前客户侧价格仍按当前 listing_cycle 与当前价格权限动态读取；
- 旧 listing_cycle Recommendation 不得泄露新 listing_cycle 的受保护价格。

### P14-A13｜source_demand_id 与已知 Customer 上下文

Recommendation 可关联 0 或 1 个真实 `source_demand_id`。

- 从 Demand 上下文进入：直接绑定当前 Customer + 当前 Demand，不要求员工重新选 Customer；
- 从 Customer 详情进入：当前 Customer 已知，不重复选 Customer；
- 无 Customer 上下文时才需要选择 Customer；
- 多 Demand 场景必须记录真实来源 Demand，不得随意挑一个；
- Recommendation 不得反向把 paused / completed / cancelled Demand 改回 active。

### P14-A14｜“我的推荐”只承载正式 Recommendation

“我的推荐”只展示正式 Recommendation 记录，不混入：

- Match candidate；
- Source Radar；
- Priority；
- 未正式推荐的车辆。

至少保留：

- Vehicle；
- Recommendation 时间；
- recommender；
- source Demand（如有）；
- 当前 Vehicle 状态；
- 当前 listing_cycle 的价格访问状态。

不新增 Customer accept/reject 状态机；Customer 是否继续沟通、咨询、锁车等由对应业务对象处理。

---

## 4. 本轮用户追加裁决 / 修正

### P14-R01｜Priority 不改变 Customer 原有销售责任关系，也不创造 Recommendation 权限

用户确认：

- Priority qualification 属于 Customer，不属于 Employee；
- Customer 在获得 Priority 前已经存在正常 Customer / Demand / 销售服务关系；
- Priority 的产生、存在、释放或到期都不改变 Customer 原有 owner / 合法业务责任关系；
- Priority 不会给其他 Employee 额外产生 Recommendation 创建权；
- 当前合法负责该 Customer / source Demand 的销售，继续按既有 owner / handover / Demand responsibility 关系处理 Priority 并决定是否 Recommendation；
- 特殊离职、调店、正式 handover 场景按既有 handover Authority 承接，不通过扩大 Recommendation 创建权限解决。

因此，不把 PDM-13 的“Priority responsible”解释成一种新的独立 Recommendation 授权来源。

### P14-R02｜取消独立 Recommendation qualification

用户确认废弃旧 R7 / Current IA 的独立 Customer Recommendation qualification。

当前统一模型：

1. Customer Level 的当前 `find-car entitlement` 决定 Customer 是否具备正式找车 / 接受正式 Recommendation 的资格；
2. Recommendation 是合法负责销售针对具体 Vehicle 执行的正式业务动作，不再额外要求 Customer 再开启一个 Recommendation qualification；
3. Priority qualification 继续是独立 Customer 级额外资格，只决定是否进入 Priority 排他保护，不决定普通 Recommendation 资格。

明确 supersede：

- 旧 R7 “普通客户默认 Recommendation qualification=OFF”；
- 旧独立“开启/关闭 Recommendation 资格”状态机；
- Current IA / Low-Fi 的 `P06-06｜开启/关闭 Recommendation 资格`；
- `RECOMMENDATION_QUALIFIED / NOT_QUALIFIED` 作为独立产品资格语义；
- 对应“推荐资格管理权限”若只服务于该旧开关，也不得继续作为独立产品能力恢复。

后续 IA / Low-Fi 只登记 stale carrier，PDM-25 后统一对齐；当前不施工。

### P14-R03｜Customer disable / restore × Recommendation

Customer disable：

- 不自动结束、作废或删除既有 Recommendation；
- 不抹除 Recommendation 历史、recommender、source Demand、listing_cycle、价格快照；
- 停用期间不得给该 Customer 新建 Recommendation；
- 停用期间暂停依赖 Customer 身份的 Recommendation 客户侧使用能力，包括仅由 Recommendation/visibility grant 带来的详情访问与相关客户侧动作；
- PDM-10 已成立的当前周期免费查价权事实不删除，但 Customer 停用期间不得使用该身份权益绕过停用 Guard；
- 销售端仍可查看真实历史，Recommendation 自身仍可因真实车辆/周期/人工结束等正式原因变化。

Customer restore：

- 继续原 customer_id；
- 不自动复活已经 ended / void / listing_cycle 已结束的 Recommendation；
- 对仍 active、仍处于原合法 listing_cycle、Vehicle 当前仍合法可访问且无其他当前 Guard 阻断的 Recommendation，重新开放客户侧能力；
- 是否恢复必须读取恢复时当前事实，不按“停用前曾可见”无条件恢复。

### P14-R04｜其他 Customer active Priority 对既有 Recommendation 的 suppression / restore

当 Vehicle 已存在 Customer B 的合法 Recommendation / visibility，之后 Customer A 获得该 Vehicle active Priority：

- B 的 Recommendation 历史不删除、不结束；
- B 已成立的当前周期 price-right fact 不删除；
- A 的 active Priority 期间，B 不得通过“我的推荐”、旧普通分享链接、历史详情入口等穿透 Priority 排他保护；
- 对 B 的客户侧 Vehicle visibility 做临时 suppression；
- suppression 只压制当前访问，不改写 Recommendation 历史。

A 的 Priority ended 后：

重新读取当前事实；只有同时仍满足时才恢复 B：

- B 的 Recommendation 仍合法 active；
- 仍是原合法 listing_cycle；
- Vehicle 当前仍真实可售 / 可访问；
- 没有新的 active Priority / Lock / Transaction 或其他 Authority 阻断；
- Customer B 自身账号状态与上层 Guard 允许。

若期间 Recommendation 已结束/作废、Vehicle 已下架/不可售、listing_cycle 已结束或其他当前 Guard 不允许，则不得恢复旧 visibility。

---

## 5. 本轮 Cross-PDM 一致性结论

对 PDM-01～PDM-13 当前 Final 复核：

- P14-R02“取消独立 Recommendation qualification”不与已完成 PDM Final 冲突；
- PDM-11 已由 Customer Level `find-car entitlement` 承担正式找车资格；
- PDM-12 未把独立 Recommendation qualification 作为 Matching Guard；
- PDM-13 的 Priority qualification 明确保持独立，只负责 Priority；
- PDM-10 只定义正式 Recommendation 成立后的免费查价权，不要求旧独立 Recommendation qualification；
- PDM-01 / 03 将 Recommendation 生命周期交给 PDM-14，不要求保留旧开关。

因此：

> 冲突只存在于旧 R7 / Current IA / Low-Fi carrier；应由 PDM-14 显式 supersede，而不是回滚 PDM-01～PDM-13。

---

## 6. 当前 stale carrier ledger｜只登记，不施工

1. `P06-06｜开启/关闭 Recommendation 资格`；
2. `RECOMMENDATION_QUALIFIED / NOT_QUALIFIED` 独立状态；
3. 独立“Recommendation 资格管理权限”仅服务旧资格开关的部分；
4. 旧 R7 “普通客户默认没有 Recommendation 资格，需另行开启”；
5. 任何把 Priority responsible 误实现为新的 Recommendation 授权来源的 carrier；
6. 任何把 active Priority 期间既有其他 Customer Recommendation 直接删除/结束，而不是 suppression 的 carrier。

统一：

> `STALE_CARRIER / DEFERRED_TO_POST_PDM25_IA_LOWFI_ALIGNMENT`

---

## 7. 当前门禁状态

- PDM-14 Start Gate：`PASS`；
- incoming handoff：8 / 8 = `HANDOFF_ACCEPTED`；
- Batch 1：`PASS / USER_APPROVED`；
- P14-A01～P14-A14：已进入当前工作版；
- P14-R01～P14-R04：已进入当前工作版；
- PDM-14 Final：未生成；
- PDM-14 incoming handoff：不得提前 CLOSED；
- IA / Low-Fi / Engineering：继续 NO_CONSTRUCTION。

## 8. 当前唯一下一步

> **进入 PDM-14 Batch 2：扫描旧 R7 / R10 / M05 / M16 / M11 / Current IA / Low-Fi 中明确应废弃、被后续规则替代或 DO_NOT_RESTORE 的语义；特别检查独立 Recommendation qualification、旧 owner-only/分享边界、旧 visibility carrier、REC 专属链路、Customer Merge 残留等。形成 Batch 2 候选后停下用户审查，不提前进入 Batch 3/4，不修改 IA / Low-Fi / Engineering。**
