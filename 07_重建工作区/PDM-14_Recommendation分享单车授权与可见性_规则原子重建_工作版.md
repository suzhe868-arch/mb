# PDM-14｜Recommendation / 普通分享 / 单车授权 / 隐藏车客户可见性｜规则原子重建工作版

> 日期：2026-10-06  
> 状态：`HISTORICAL_WORKFILE / FINAL_PUBLISHED / INTEGRITY_PASS`  
> 当前 Authority：本文件保留为 PDM-14 重建审计轨迹；正式 Authority 已切换为 `07_重建工作区/PDM-14_最终完整规则.md`。  
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

## 5. Batch 2｜明确废弃 / 替代 / DO_NOT_RESTORE

> 用户已完成本批审查，并于 2026-10-05 明确“全部同意”后再次明确“确认执行”。本批只处理已经有充分证据证明应废弃、已被后续 Authority 替代或明确不得恢复的旧语义；Batch 2 反向冲突门禁已执行，不把仍有反向证据的事项误判为废弃。

### P14-B2-01｜废弃独立 Recommendation qualification

**结论：SUPERSEDED / DO_NOT_RESTORE**

废弃并不得恢复以下旧体系：

- “普通客户默认没有 Recommendation 资格，需单独开启”；
- Current IA / Low-Fi P06-06 的独立 Recommendation 资格开关；
- RECOMMENDATION_QUALIFIED / NOT_QUALIFIED 独立状态；
- 仅服务该旧开关的独立 Recommendation qualification 管理能力。

当前 Authority：

- Customer 是否具备正式找车 / 接受 Recommendation 资格，统一读取 Customer Level 当前 find-car entitlement；
- Recommendation 是合法负责销售针对具体 Vehicle 的正式业务动作；
- Priority qualification 保持独立，只负责 Priority 排他保护，不替代找车 entitlement。

### P14-B2-02｜废弃“经理 / 店长 / 协作身份天然可创建 Recommendation”

**结论：DO_NOT_RESTORE**

不得因“经理、店长、协作销售”等管理或协作身份本身，直接获得 Recommendation 创建权。

当前 Authority：

- Recommendation 创建必须建立在该 Customer / source Demand 的当前合法业务负责关系上；
- 管理身份、协作身份、查看权限本身都不是 Recommendation 业务授权来源；
- 特殊离职、调店、交接继续通过既有 handover / responsibility Authority 解决。

### P14-B2-03｜替代旧“只有 Customer current owner 才能创建 Recommendation”的绝对规则

**结论：SUPERSEDED**

旧 R7 把 Recommendation 创建主体绝对限定为 Customer current owner，这一绝对表达已被后续 Customer owner / Demand responsible 分层规则替代。

当前 Authority：

- 不能放宽成“任何 Employee 都能推荐”；
- 也不能死认 Customer owner；
- 当前合法负责该 Customer / source Demand 的销售，按既有 owner / handover / Demand responsibility 关系处理并决定 Recommendation；
- source Demand 已合法改派时，旧 owner-only 规则不得阻断新的合法 Demand responsible；
- recommender 仍记录创建时的真实合法推荐员工，后续责任变化不回写历史。

### P14-B2-04｜废弃“Priority responsible 自动成为新的 Recommendation 授权来源”

**结论：DO_NOT_RESTORE**

Priority 的 current responsible / trigger Demand responsible 只代表 Priority 当前合法处理责任，不因 Priority 对象本身额外创造 Recommendation 权限。

当前 Authority：

- Priority qualification 属于 Customer；
- Priority 不改变 Customer 既有 owner / handover / Demand responsibility；
- Recommendation 是否可创建仍读取当前合法业务负责关系；
- 不得通过 Priority 绕开正常责任关系。

### P14-B2-05｜替代“客户转发永远 SOURCE_ONLY、永远不能形成 owner”

**结论：SUPERSEDED**

废弃旧的全局解释：客户侧普通转发一律只记录来源，永远不得形成 Customer owner。

当前 Authority 服从 PDM-03：

- ownerless 新 Customer 可根据当前合法分享 / 转介绍链形成销售归属；
- 若分享链明确绑定销售，则按该合法绑定处理；
- 无明确销售绑定时，可按分享人的当前 owner 形成归属，并保留 A→B 的来源 / 转介绍关系；
- 已有 owner 的 Customer 不得被后续分享抢走；
- SOURCE_ONLY 状态本身并未删除，只在确实没有形成 owner 的场景继续使用。

### P14-B2-06｜不得恢复 REC 专属 URL / 第二套 Recommendation 分享链路

**结论：DO_NOT_RESTORE**

不得建设或恢复：

- REC 专属 URL 参数；
- Recommendation-specific link；
- 第二套“推荐专属”分享页；
- 第二套 Recommendation 微信分享能力。

当前 Authority：

- Recommendation 是内部数据库正式业务事实；
- 对外发送 Vehicle 继续使用普通车辆分享链路；
- 普通分享不创建、转移或继承 Recommendation / price / visibility；
- Customer 侧正式记录通过“我的推荐 / 找车”等既有业务入口承载。

### P14-B2-07｜废弃“所有 Vehicle 必须 Recommendation 后客户才可见”

**结论：DEPRECATED / DO_NOT_RESTORE**

不得恢复“客户只有先被 Recommendation 才能看到任何 Vehicle”的旧前提。

当前 Authority：

- 普通公开可浏览 Vehicle 依既有 Feed / Search / Filter / share 可见规则访问，不要求 Recommendation；
- Recommendation + visibility grant 只用于 hidden / controlled 等需要 Customer 单车授权的场景；
- Priority 本身也不能直接授客户详情可见。

### P14-B2-08｜替代 hidden Vehicle 仅凭 Demand / Priority 上下文直接给客户可见

**结论：SUPERSEDED / STALE_CARRIER**

Current IA / Low-Fi HIDDEN_CONTROLLED 中“对应 Customer 在 Demand / Priority 上下文即可直接看到 hidden Vehicle”的表达已过期。

当前 Authority：

- 合法员工可在 Matching / Priority 业务上下文内部处理 hidden 但真实可售 Vehicle；
- Customer 端获得该 hidden Vehicle 详情权，必须经过正式 Recommendation + Customer-specific visibility grant；
- Priority / Demand 自身不等于 Customer visibility grant。

### P14-B2-09｜不得因其他 Customer active Priority 删除 / 结束既有 Recommendation

**结论：DO_NOT_RESTORE**

不得把其他 Customer 后来取得 active Priority 实现为删除既有 Recommendation、自动 ended/void、删除历史价格快照或删除已成立的当前周期 price-right fact。

当前 Authority：

- Recommendation / 历史事实保留；
- active Priority 期间只做客户侧 visibility suppression；
- Priority ended 后读取当前 Recommendation、listing_cycle、Vehicle、Customer、新 Priority / Lock / Transaction 等事实决定是否恢复；
- 不得无条件恢复，也不得提前抹除历史。

### P14-B2-10｜废弃 Customer Merge 及 Recommendation / 权益迁移

**结论：DO_NOT_RESTORE / STALE_CARRIER**

PDM-01 Final 已明确 V1 完全取消 Customer Merge，因此不得恢复自动/人工 Customer Merge、同手机号/同自然人合并、surviving customer_id，以及 Recommendation、price-right、Consultation、Demand、Lock、Transaction 等对象或权益随 Merge 迁移。

Current IA / Low-Fi 中 P06-01 / P06-M01 的 MERGE_READY / MERGING / MERGED / MERGE_HISTORICAL 等状态均为旧 carrier，不再构成当前产品 Authority。

### P14-B2-11｜不得恢复 Recommendation 创建后的系统自动微信发送状态机

**结论：DO_NOT_RESTORE**

旧 R7 已明确删除“Recommendation 创建后由系统自动发送微信，并记录发送成功 / 失败”的产品前提。

当前 Authority：

- Recommendation 创建只建立正式业务事实；
- Vehicle 如需对外发送，使用普通分享能力；
- 不新增 Recommendation 自动微信发送任务、发送成功 / 失败状态机；
- 当前主动通知白名单不因 Recommendation 创建而自动扩展。

### 5.1 Batch 2 反向冲突门禁结果

PASS / FALSE_DEPRECATION_COUNT=0

本批明确没有误删以下仍有效语义：

- SOURCE_ONLY 状态本身仍可用于确实未形成 owner 的场景；只废弃“客户分享永远 SOURCE_ONLY”的全局解释；
- Recommendation 不设固定 N 天 TTL，继续保留 P14-A03；
- 分享接收人不继承分享人的 Recommendation / price / visibility，继续保留 P14-A08；
- Recommendation 的当前周期免费查价权与历史价格快照，继续保留 P14-A11 / A12；
- Recommendation active / ended / void / historical 生命周期载体继续有效；
- Recommendation 与 Priority 仍是两个独立业务对象。

## 6. Batch 3｜知情修改 / 显式新增

> 用户已完成本批审查，并于 2026-10-06 明确“全部同意”后再次明确“确认执行”。本批只纳入 9/19 后有直接证据证明的明确新增或明确修改；存在反向证据、真实冲突、遗漏缺口或仍需产品选择的事项不得塞入 Batch 3，统一留给 Batch 4。

### P14-B3-01｜分享直达与普通进入统一使用同一套车辆详情业务页

**结论：INFORMED_CHANGE / USER_APPROVED**

后续 R10 已明确收口：

- 微信普通分享打开后，进入与正常内部浏览相同的车辆详情业务页；
- 不复制第二套“分享版详情页”或第二套业务逻辑；
- SHARE_DIRECT 只允许增加分享场景必要的轻量入口，例如“查看更多车源”；
- 收藏、咨询、锁车等动作继续读取接收人自己的 customer_id、当前 Vehicle 状态、当前 visibility 与对应业务 Guard；
- 分享入口不能绕过 hidden / Priority / offline / sold / 当前权限等可见性规则。

该规则只统一详情业务页与当前状态判断，不把普通分享变成 Recommendation 事实源。

### P14-B3-02｜“咨询”与“锁车申请”从旧“我要这辆车”语义中拆分

**结论：INFORMED_CHANGE / USER_APPROVED**

9/22 后客户端车辆动作已明确拆分：

- 客户希望沟通车辆 → 统一进入 Consultation，客户端自然文案使用“咨询”；
- 客户希望锁车 → 进入独立 LockRequest / Lock 业务链，不再通过模糊“我要这辆车”同时承担咨询和锁车语义；
- 普通详情与分享直达详情使用同一动作语义；
- Recommendation 不是“我要这辆车”按钮点击产生的对象。

PDM-14 只冻结 Recommendation / 分享与动作语义边界；LockRequest 的 PENDING 6h、审批、正式 Lock、Waitlist 等完整生命周期继续由 PDM-18 Authority 承接。

### P14-B3-03｜“我的推荐”明确区分当前与历史，历史存在不等于当前仍可访问

**结论：EXPLICIT_ADDITION / USER_APPROVED**

后续客户端业务历史口径明确：

- “我的推荐”只展示正式 Recommendation；
- 页面应区分当前 Recommendation 与历史 Recommendation；
- Demand 结束、销售离职、Customer owner 变化、Vehicle 售出/下架等均不得删除 Recommendation 历史；
- 历史 Recommendation 仍可保留车辆、推荐时间、推荐销售、关联 Demand 等历史事实；
- 但历史记录存在，不代表 Customer 当前仍有车辆详情 visibility 或当前价格访问权；
- 从历史记录再次进入时，必须重新读取当前 Vehicle / listing_cycle / Customer / Priority / Lock / Transaction / price authority 等事实。

因此“历史可追溯”与“当前可访问”必须分层，禁止用历史 Recommendation 绕过当前 Guard。

### P14-B3-04｜车辆档案完整性与 Recommendation / visibility 权利正式分层

**结论：EXPLICIT_CROSS_PDM_ADDITION / USER_APPROVED**

PDM-07 后续 Final 已明确并通过 incoming handoff 交给 PDM-14：

- 车辆档案 / 报告未补齐，本身不得成为禁止正式 Recommendation 的独立理由；
- 只要 Vehicle、listing_cycle、Customer entitlement、业务责任关系及其他 Recommendation Guard 合法，档案不完整不能单独阻断 Recommendation；
- Recommendation / Vehicle visibility grant 只解决 Customer 对该 Vehicle 的业务可见权，不自动开放完整 VIN、绿本、行驶证、敏感原件或仅内部档案；
- Customer 能看到哪些档案 / 报告，继续独立服从 PDM-07 的 customer_visible、敏感原件禁止公开等 Authority；
- 取消 Recommendation 或 visibility grant 也不删除 Vehicle 档案历史。

因此 Vehicle 可见、Recommendation 权利与档案/报告 customer visibility 是三个必须分层判断的维度。

### P14-B3-05｜Priority 可保存 recommendation_id 关联追溯，但不得形成生命周期耦合

**结论：EXPLICIT_CROSS_PDM_ADDITION / USER_APPROVED**

PDM-13 后续 Final 明确：

- 正式 Recommendation 成立后，相关 active Priority 可以保存 recommendation_id 作为关联追溯字段；
- 该字段只用于说明“此 Priority 处理过程中形成了哪一条 Recommendation”之类历史关联；
- Priority 与 Recommendation 仍是两个独立 domain object；
- recommendation_id 不得把 Recommendation 变成 Priority 子状态；
- Recommendation end / void 不因该字段自动 release/end Priority；
- Priority release / expiry / end 不因该字段自动 end/void 仍合法 Recommendation；
- 两边如在一次员工体验操作中同时结束，底层仍必须分别校验、分别执行、分别审计。

### 6.1 Batch 3 冲突隔离结果

`PASS / CONFLICT_OR_PRODUCT_CHOICE_MISCLASSIFIED_AS_BATCH3=0`

本批明确没有把以下事项抢进 Batch 3：

- LockRequest 的完整审批、6h、正式 Lock、Waitlist 生命周期仍归 PDM-18；
- 分享卡片具体模板、分享图片选择、营销文案等页面/展示细节不因本批直接冻结为 PDM-14 核心生命周期规则；
- 旧分享链接跨周期、车辆失效后的所有精确展示细节，如存在冲突或缺口继续进入 Batch 4 / 后续客户端域核对；
- 任何仍需用户重新选方案的 Recommendation end、visibility grant、分享历史访问边界不得由 Batch 3 静默裁决。

## 7. Batch 4｜冲突 / 遗漏 / 缺口 / 新产品选择

> 用户于 2026-10-06 明确裁决：`1A、2B、3A、4A、5A、6A、7A、8A`，随后以“确定指向”确认执行。本批完成 PDM-14 前三批未完全冻结的生命周期、可见性、旧分享、价格投影与跨域边界。

### P14-B4-01｜Recommendation end / void 的当前合法操作主体与历史事实

**用户选择：1A**

- Recommendation end / void 必须按当前合法 Customer / source Demand 业务责任关系与 PDM-02 `identity + permission + data scope + object state` 判断；
- 当前合法负责该 Customer / source Demand 的销售，在满足权限与范围时可以执行；
- 原 recommender 只有在当前仍 active、仍具合法业务资格、权限与 data scope 时才可操作，不能仅凭“历史推荐人”永久保留当前操作权；
- 经理 / 店长不因职位天然获得 end / void 权限，必须满足对应 capability + data scope；
- `void` 表示创建错误或该 Recommendation 本身不应成立，必须填写可审计原因；
- 普通 `end` 表示业务上明确结束推荐关系，原因允许记录但 V1 不把必填原因硬编码成统一门槛；
- end / void 都不得改写 recommender、created_at、customer_id、vehicle_id、listing_cycle、source_demand_id 与历史 price snapshot；
- end / void 后历史永久保留。

### P14-B4-02｜Customer 失去 find-car entitlement 后已有 Recommendation 的处理

**用户选择：2B**

Customer Level 变化使 `find-car entitlement` 从有效变为无效时：

- 禁止新建 Recommendation；
- 已存在 Recommendation 不删除、不自动 end、不自动 void；
- recommender、source Demand、listing_cycle、历史 price snapshot 与全部历史事实保留；
- 已成立的当前 listing_cycle Recommendation 免费查价权事实不删除；
- 但暂停依赖 Recommendation / Customer 身份产生的客户侧 Recommendation 能力，尤其是 hidden Vehicle 的 Recommendation-only visibility；
- 价格能否当前展示继续独立读取 PDM-10 当前 Customer Level 价格权益、已成立单车 price-right fact、Customer 状态与当前 listing_cycle，不把 find-car entitlement 直接当作价格算法；
- entitlement 恢复后不得复活 ended / void / listing_cycle 已结束的 Recommendation；
- 仅对恢复时仍 active、仍处于原合法 listing_cycle、Vehicle 当前仍合法、Customer 可用且无 Priority / 其他 Guard 阻断的 Recommendation 重新开放客户侧 Recommendation 能力。

该规则与 P14-R03 Customer disable 使用相同“历史保留、能力暂停、恢复时按当前事实判断”的方向，但二者是不同触发源，不得合并成同一状态。

### P14-B4-03｜active Recommendation 在 visible ↔ hidden 变化中的持续授权来源

**用户选择：3A**

同一 `listing_cycle` 内，只要 Recommendation 仍 active：

- Recommendation 创建时 Vehicle 已 hidden → 幂等确保对应 Customer-specific visibility grant / 等价有效授权；
- Recommendation 创建时 Vehicle 为 visible → Customer 当时可依公共 visibility 访问，不要求为了形式额外制造重复 grant；
- 后续同周期 `visible → hidden` → 系统必须基于仍 active 的 Recommendation 幂等确保该 Customer 的单车 visibility 授权生效，不要求销售重新 Recommendation；
- `hidden → visible` → 公共 visibility 恢复时不结束 Recommendation、不删除历史；Customer 可依公共规则访问；
- 同周期再次变 hidden，只要 Recommendation 仍 active 且无其他 Guard 阻断，仍由该 Recommendation 继续作为单车授权来源；
- Recommendation end / void 时，结束仅由该 Recommendation 支撑的 visibility grant / effective authorization；
- 若 Customer 仍有 Lock / Transaction / 其他独立合法 Authority，则按对应域保留访问，不由 Recommendation end 强行抹除；
- active Priority 对其他 Customer 的 suppression 仍优先按 P14-R04/B2-09 处理。

因此，hidden/visible 是 Vehicle 展示状态变化，不得无故打断仍合法的 Recommendation 关系。

### P14-B4-04｜旧普通分享链接只提供导航，打开时按当前事实实时重算

**用户选择：4A**

普通分享链接不是永久 visibility 权限，也不绑定旧周期业务权益。

再次打开时统一按当前事实判断：

- Vehicle 当前 visible 且无其他排他 Guard → 按普通详情规则访问；
- Vehicle 当前 hidden 或存在 active Priority 等普通入口排他 → 只有接收人自己具备当前合法 Recommendation / Lock / Transaction / 其他明确访问 Authority 时，才能进入相应当前详情；否则显示“当前车源不可查看”并保留“查看更多车源”等安全退路；
- Vehicle 已真实 offline / unavailable / sold 或当前 listing_cycle 已结束 → 普通分享不得绕过状态进入在售详情，也不得据此产生新的 Recommendation / Consultation / Lock 等普通销售业务；
- Customer 若本人存在合法历史 Recommendation / Consultation / Lock / Transaction，可从自己的历史业务入口查看对应历史详情；普通分享链接本身不授历史详情权；
- Vehicle 后续真正重新上架形成新 listing_cycle 后，旧普通分享可继续作为同一 vehicle 的进入路径，但所有 Recommendation / price-right / Consultation / Lock 等按新周期当前 Authority 重新判断；
- ownerless 新 Customer 的分享归属继续服从 PDM-03：有效销售绑定、客户分享上下文、销售失效接替/接客池兜底按打开时当前规则解析；
- 已有 owner 的 Customer 继续不得被后续分享抢走。

### P14-B4-05｜Recommendation 历史推荐价与当前价格严格分层

**用户选择：5A**

- Recommendation 创建时保存不可变 `recommendation_price_snapshot` / 等价历史价格事实；
- 历史 Recommendation 展示“当时推荐价”时必须读取该快照，后续调价、覆盖价、source_type 或价格规则变化不得回写；
- 若界面同时需要展示“当前价格”，必须作为另一项当前事实实时读取；
- 当前价格展示必须同时满足当前 Vehicle/listing_cycle 合法、Customer 当前可访问该 Vehicle、PDM-10 当前价格 Authority 允许；
- 旧 listing_cycle Recommendation 本身绝不能作为新 listing_cycle 当前价格的授权来源；
- 历史页具体布局与文案交 PDM-20，PDM-14 只冻结数据与权限语义。

### P14-B4-06｜source_type 变化 / 一键转名邦不重建 Recommendation

**用户选择：6A**

继承 PDM-04 当前 Authority：合法 source_type 修改以及批发 → 名邦一键转换均发生在同一 `vehicle_id`；一键转名邦在当前模型下也保持同一 `listing_cycle`。

因此：

- 不新建、不迁移、不复制 Recommendation；
- recommendation_id、customer_id、vehicle_id、listing_cycle、recommender、source_demand_id 与历史 price snapshot 原样保留；
- 当前 listing_cycle 已成立的 Recommendation 免费查价权不因 source_type 变化清空；
- source_type 变化后重新读取 Vehicle 当前真实 availability / visibility / 当前价格事实；
- 转换后若 Vehicle hidden 且 Recommendation 仍 active，则继续按 P14-B4-03 作为 customer-specific visibility 授权来源；
- 转换后若 visible，则按公共 visibility + 当前业务 Guard 访问；
- 不存在“从旧 Vehicle 迁移 Recommendation 到新 Vehicle”的流程，因为当前 Authority 没有第二个 Vehicle。

### P14-B4-07｜active Lock / in-progress Transaction 不因占用事实自动禁止 Recommendation

**用户选择：7A**

Lock / Transaction 是独立业务占用事实，不等于 Vehicle 已真实不可售。

只要以下条件仍满足，可以新建正式 Recommendation：

- Vehicle 底层仍真实可售；
- 当前 listing_cycle 仍有效；
- Customer 当前具备 find-car entitlement；
- 当前合法业务责任关系与 Recommendation permission / scope 合法；
- 没有其他 Customer active Priority 或其他明确排他 Guard 阻断；
- 对象状态在提交时重新校验。

同时必须满足：

- 客户看到真实的已锁定 / 当前占用等允许公开的状态，不伪装成可立即锁车；
- Recommendation 不产生 Lock 排队优先级、抢车分值或 takeover 权；
- Recommendation 不绕过既有 active Lock / Transaction；
- 是否可 Waitlist、LockRequest、接管、交易取消/纠错等完整状态机继续由 PDM-18 / PDM-19 冻结；
- Vehicle 最终 sold / offline / unavailable 或 listing_cycle 结束后，不得继续新建当前周期 Recommendation；已有 Recommendation 只保留历史并按周期规则退出 current active。

### P14-B4-08｜Recommendation × Consultation 不相互反写；细节移交 PDM-15

**用户选择：8A**

PDM-14 冻结以下跨对象边界：

- Recommendation end / void 不自动结束已经存在的 Consultation；
- 已有未终结 Consultation 时，后来新建 Recommendation 不因此自动创建第二条 Consultation；
- 后来的 Recommendation 不得仅凭推荐关系抢走或重写既有 Consultation 当前负责人；
- Consultation 当时若真实来源于某条 Recommendation，该 source/recommendation relation 属于历史事实，Recommendation 后续 end / void 不得反写或抹除；
- Consultation 自身状态、负责人优先级、转派、SLA、终态、同周期幂等与新咨询重建规则由 PDM-15 正式冻结。

新增 Cross-PDM handoff：

> `HO-P14-P15-001`｜Recommendation 与 Consultation 相互独立：Recommendation end/void 不自动结束 Consultation；已有未终结 Consultation 后新增 Recommendation 不重复建 Consultation、不抢负责人、不改历史来源；Consultation 完整 lifecycle 由 PDM-15 承接。

### 7.1 Batch 4 裁决结果

- `P14-B4-01 = 1A`；
- `P14-B4-02 = 2B`；
- `P14-B4-03 = 3A`；
- `P14-B4-04 = 4A`；
- `P14-B4-05 = 5A`；
- `P14-B4-06 = 6A`；
- `P14-B4-07 = 7A`；
- `P14-B4-08 = 8A`；
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`；
- `HO-P14-P15-001 = HANDOFF_OPEN`。

## 8. Final 前完整性修复｜P14-LIA-01～P14-LIA-10

> Final 前完整性复核第一轮发现 10 组“历史已明确 / 已完成 PDM 已冻结，但当前 PDM-14 工作版承载压薄或 outgoing handoff 缺失”的问题。用户于 2026-10-06 明确“同意”，随后“确定执行”。本节属于完整性修复，不新开第五批产品选择。

### P14-LIA-01｜三类车源均可正式 Recommendation；批发查价机制仅适用于批发车

- 名邦车源、4S 合作车源、JYT 批发车源，只要 Vehicle / listing_cycle / Customer entitlement / 当前合法业务责任 / 其他 Guard 均合法，都可以建立正式 Recommendation；
- 4S 成员本人被 PDM-02 hard DENY 执行名邦 Recommendation 业务，不等于“4S 车源不能被名邦合法负责销售推荐”；
- Recommendation 的通用对象、历史、幂等、visibility 等规则对三类车源都适用；
- **只有进入 PDM-10 批发车客户查价保护机制的车辆，Recommendation 才额外产生当前 `customer + vehicle + listing_cycle` 免费批发数字价格查看权**；
- 名邦 / 4S 车辆不会因为 Recommendation 凭空生成批发车查价机制；其当前客户价格继续服从 PDM-10 对对应 source_type 的价格 Authority。

该条对 P14-A11 作精确范围解释：A11 的“免费批发查价权”不是把所有 source_type 都改造成批发查价对象。

### P14-LIA-02｜Recommendation 创建 / end / void 统一提交 Guard

所有正式 Recommendation mutation（至少 create、end、void）均在提交时重新校验：

- 当前执行者为 active、eligible 的名邦业务 Employee；
- 当前仍存在合法 Customer / source Demand 业务责任关系；
- 当前 identity + 对应业务 permission/capability + data scope 合法；
- Customer、Vehicle、listing_cycle、Recommendation 等目标对象当前状态允许该动作；
- 其他 Customer active Priority、Customer disable、find-car entitlement 等当前 Guard 不被绕过。

明确：

- 普通销售 / 经理 / 店长都不能仅凭职位名称天然执行；
- 4S 成员对 Recommendation 业务 hard DENY；
- System Admin 身份本身不自动获得 Recommendation 业务执行能力；同一真人若需执行销售业务，必须使用合法 Employee 业务身份；
- 旧页面 / 旧会话不能绕过提交时重验。

### P14-LIA-03｜批量推荐只是 UI 批量动作，底层逐车建立 Recommendation

同一 Customer 一次勾选多辆 Vehicle 推荐时：

- UI 可以表现为一次批量操作；
- 底层必须以每一个 `customer + vehicle + listing_cycle` 分别执行 Guard、幂等和 Recommendation create/reuse；
- 每辆车分别产生独立 recommendation_id / 历史 / source_demand_id（如有）/ price snapshot / visibility 关系；
- 禁止合并成一条模糊“推荐了一组车”的 Recommendation；
- 某辆车已存在 active Recommendation 时只复用该车原对象并记录新 touch / audit，不影响同批其他 Vehicle 独立处理。

### P14-LIA-04｜Recommendation 不改变 Customer owner / Demand responsible

Recommendation 是单车正式推荐事实，不是 Customer 归属或 Demand 负责人变更动作。

- create / end / void Recommendation 均不得改变 Customer current owner；
- create / end / void Recommendation 均不得改变 source Demand current responsible employee；
- owner / Demand responsible 后续依法变化，也不得回写 Recommendation 的历史 recommender；
- owner / responsible 变化本身不自动 end / void 已存在 Recommendation；
- 后续需要执行 Recommendation mutation 时，重新读取**当前**合法业务责任关系和权限，而不是依赖历史 recommender 永久操作权；
- Recommendation 与 owner / responsibility 的历史事实分别保留、分别审计。

### P14-LIA-05｜普通分享链接无固定 N 天 TTL，可继续转发但不传播业务权限

- 普通 Vehicle share link 不按固定 N 天自动失效；
- 只要该链接仍指向可解析的 Vehicle，后续打开继续按 P14-B4-04 使用“导航入口 + 当前事实实时重算”模型；
- 普通分享可以被接收人继续转发；每次新接收人的 Customer 身份、owner 形成/保持、销售失效兜底继续严格服从 PDM-03 当前 Authority；
- 再转发不得继承或传播上一个 Customer 的 Recommendation、price-right、visibility grant、Internal Mode 或其他业务权限；
- 不建设多级 Recommendation 权限链、多级价格权链或多级 visibility 继承链；
- Vehicle offline/sold/旧 cycle 等状态仍按 P14-B4-04 实时重算，不因链接“未过期”而绕过业务状态。

### P14-LIA-06｜Recommendation 创建时只有“价格咨询”，同周期后续出现数字价仍沿用免费权

继承 PDM-10 Final：

- 批发 Vehicle 创建正式 Recommendation 时，即使当前只能显示“价格咨询”，当前 `customer + vehicle + listing_cycle` 的 Recommendation 免费查价权事实仍立即成立；
- 同一 listing_cycle 后续因上游价格、客户标价、覆盖价或其他合法价格事实变化出现可展示数字价格时，该 Customer 可直接使用已成立的 Recommendation 免费权查看；
- 不重新消耗普通 daily quota；
- 不要求重新 Recommendation；
- listing_cycle 结束后仍不跨新周期继承。

### P14-LIA-07｜Recommendation / visibility grant 只授 Customer Safe Projection

Recommendation 或 customer-specific visibility grant 解决的是 Customer 对 Vehicle 的合法客户侧访问，不是员工内部模式授权。

因此不得因为 Recommendation / grant 自动向 Customer 下发：

- 名邦内部价 / 批发内部字段（除 PDM-10 明确允许的客户侧数字价格投影）；
- 上游发布人电话；
- VIN / 敏感原件 / 内部档案；
- 员工 Internal Mode；
- Priority / Match tier / 内部仲裁理由；
- 其他只对员工/后台开放的内部状态或敏感字段。

这些字段是否可见继续逐项服从 PDM-07 / 09 / 10 / 13 及后续客户端 Authority，不得把 visibility grant 扩张成万能字段授权。

### P14-LIA-08｜上游同步不得覆盖 Recommendation / visibility 等名邦 Business Data

继承 001～078 最终孤儿规则与 PDM-04 Source Data / Business Data 分层：

- JYT / 外部同步服务只维护其合法 Source Data 与 Vehicle 当前事实；
- 普通上游新增、更新、价格变化、图片变化、车况变化等不得创建、结束、作废、删除或直接改写 Recommendation；
- 不得直接创建、撤销或改写 customer-specific visibility grant；
- 不得改写 Customer、owner、Demand、Lock、Transaction 等名邦 Business Data；
- 当上游事实导致 Vehicle availability / listing_cycle 等合法业务事实发生变化时，由名邦业务域按已冻结规则**消费事实并执行自己的 lifecycle**，而不是让上游直接写 Recommendation 状态。

### P14-LIA-09｜Consultation 不反向产生 Recommendation / price-right / hidden visibility

补齐 P14-B4-08 的另一方向：

- Customer 创建 / 继续 Consultation，不自动创建 Recommendation；
- Consultation 本身不授 Recommendation 免费查价权；
- Consultation 本身不授 hidden Vehicle customer-specific visibility grant；
- Consultation 后续 resolved / invalid / cancelled / 其他合法终态，不自动 end / void 仍合法的 Recommendation；
- Consultation 的 source 可能真实指向一条 Recommendation，但 source relation 只是历史来源事实，不等于两个对象生命周期绑定；
- Recommendation → Consultation 与 Consultation → Recommendation 均不得静默反写。

`HO-P14-P15-001` 同步扩充该边界，Consultation 详细状态机仍由 PDM-15 正式冻结。

### P14-LIA-10｜补齐 PDM-14 outgoing handoff 与审计承接

除现有 `HO-P14-P15-001` 外，正式登记：

- `HO-P14-P18-001`：active Lock / Recommendation 边界；Lock 占用本身不自动禁止 Recommendation，Recommendation 不产生 Lock 优先权、不绕过 Lock；
- `HO-P14-P19-001`：in-progress Transaction / Recommendation 边界；占用本身不自动禁止 Recommendation，Recommendation 不撤销/接管 Transaction；
- `HO-P14-P20-001`：客户端“我的推荐”当前/历史、普通分享直达、hidden/公开/失效实时重算、历史推荐价与当前价格分层、Customer Safe Projection；
- `HO-P14-P21-001`：员工端 Recommendation 创建/批量创建/end/void、三入口上下文、提交重验、4S hard DENY、历史只读及 stale carrier 修正；
- `HO-P14-P23-001`：Recommendation 创建/end/void 不自动扩展为微信主动消息/通知状态机；未来通知层只能消费明确允许的业务事件，通知失败不改业务事实；
- `HO-P14-P25-001`：Recommendation / visibility grant 的 create/reuse/end/void/suppress/restore、entitlement/disable 能力暂停恢复、批量逐车结果、actor/time/reason/before-after/source context 等统一审计与历史标准。

所有 handoff 只登记目标域必须承接的当前 Authority，不提前替目标 PDM 建设页面或完整状态机。

### 8.1 Final 前修复状态

- `P14-LIA-01～P14-LIA-10 = USER_APPROVED / APPLIED`；
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`；
- incoming handoff：8 / 8 已 `HANDOFF_CLOSED / SOURCE_BACKWRITE_DONE`；
- outgoing handoff：PDM-15 / 18 / 19 / 20 / 21 / 23 / 25 均已登记 `HANDOFF_OPEN`；
- IA / Low-Fi / Engineering：继续 `NO_CONSTRUCTION`。

## 9. 本轮 Cross-PDM 一致性结论

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

## 10. 当前 stale carrier ledger｜只登记，不施工

1. `P06-06｜开启/关闭 Recommendation 资格`；
2. `RECOMMENDATION_QUALIFIED / NOT_QUALIFIED` 独立状态；
3. 独立“Recommendation 资格管理权限”仅服务旧资格开关的部分；
4. 旧 R7 “普通客户默认没有 Recommendation 资格，需另行开启”；
5. 任何把 Priority responsible 误实现为新的 Recommendation 授权来源的 carrier；
6. 任何把 active Priority 期间既有其他 Customer Recommendation 直接删除/结束，而不是 suppression 的 carrier；
7. 旧“只有 Customer current owner 才能创建 Recommendation”且会阻断合法 source Demand responsible / handover 的 carrier；
8. 旧“客户转发永远 SOURCE_ONLY、永远不能形成 owner”的 carrier；
9. REC 专属 URL / Recommendation-specific link / 第二套推荐分享页 carrier；
10. Current IA / Low-Fi `HIDDEN_CONTROLLED` 中仅凭 Demand / Priority 直接授 Customer hidden Vehicle 详情权的 carrier；
11. Current IA / Low-Fi `P06-01 / P06-M01` Customer Merge 状态机及 Recommendation / 权益迁移 carrier。
12. Recommendation end / void 若仍按旧“历史 recommender 永久有权 / 职位天然有权”执行，而不读取当前 responsibility + permission + scope 的 carrier；
13. find-car entitlement 失效后仍允许 Recommendation-only hidden visibility 无条件继续的 carrier；
14. active Recommendation 在同 cycle `visible → hidden` 后未幂等补齐/恢复 customer-specific visibility 的 carrier；
15. 旧 SHARE_DIRECT 在 hidden / Priority / offline / sold 时仍直接穿透详情，或把分享链接当永久 visibility 的 carrier；
16. source_type / 一键转名邦后错误重建、迁移或清空 Recommendation 的 carrier；
17. active Lock / in-progress Transaction 被粗暴解释为“Vehicle 不可 Recommendation”的 carrier；
18. Recommendation end/void 自动关闭 Consultation，或后建 Recommendation 抢写已有 Consultation 负责人/来源的 carrier。
19. 把“4S 成员 hard DENY Recommendation”误实现成“4S 车源不可被名邦合法销售 Recommendation”的 carrier；
20. 批量推荐被实现成一条 group Recommendation、共享 recommendation_id 或共享生命周期的 carrier；
21. Recommendation create/end/void 顺带修改 Customer owner / Demand responsible 的 carrier；
22. 普通 share link 使用固定 N 天 TTL 或二次转发继承上一个 Customer Recommendation/price/visibility 权限的 carrier；
23. Recommendation 创建时价格咨询、后续同 cycle 出现数字价却再次扣 daily quota 的 carrier；
24. Recommendation/visibility grant 把 Internal Mode、内部价、上游电话、VIN/敏感档案或 Priority 内部事实一起下发客户的 carrier；
25. JYT/上游同步直接创建/结束/改写 Recommendation 或 customer-specific visibility grant 的 carrier；
26. Consultation 自动创建 Recommendation、赠送 Recommendation price-right、直接授 hidden visibility，或 Consultation 终态自动 end/void Recommendation 的 carrier。

统一：

> `STALE_CARRIER / DEFERRED_TO_POST_PDM25_IA_LOWFI_ALIGNMENT`

---

## 11. 当前门禁状态

- PDM-14 Start Gate：`PASS`；
- incoming handoff：8 / 8 = `HANDOFF_ACCEPTED`；
- Batch 1：`PASS / USER_APPROVED`；
- Batch 2：`PASS / USER_APPROVED`；
- Batch 2 Reverse Conflict Scan：`PASS / FALSE_DEPRECATION_COUNT=0`；
- Batch 3：`PASS / USER_APPROVED`；
- Batch 3 Conflict Isolation：`PASS / CONFLICT_OR_PRODUCT_CHOICE_MISCLASSIFIED_AS_BATCH3=0`；
- Batch 4：`PASS / USER_APPROVED / CHOICES=1A,2B,3A,4A,5A,6A,7A,8A`；
- PDM-14 Local Product Choice Unresolved：`0`；
- P14-LIA-01～P14-LIA-10：`USER_APPROVED / APPLIED`；
- Pre-Final Integrity R2：`PASS / FINAL_CANDIDATE_READY`；
- Pre-Final Report：`07_重建工作区/PDM-14_Final前完整性复核_R2_2026-10-06.md`；
- P14-A01～P14-A14：已进入当前工作版；
- P14-R01～P14-R04：已进入当前工作版；
- P14-B2-01～P14-B2-11：已进入当前工作版；
- P14-B3-01～P14-B3-05：已进入当前工作版；
- P14-B4-01～P14-B4-08：已进入当前工作版；
- outgoing handoff：`HO-P14-P15-001 / HO-P14-P18-001 / HO-P14-P19-001 / HO-P14-P20-001 / HO-P14-P21-001 / HO-P14-P23-001 / HO-P14-P25-001 = HANDOFF_OPEN`；
- PDM-14 Final：`07_重建工作区/PDM-14_最终完整规则.md / COMPLETE / INTEGRITY_PASS`；
- PDM-14 Final Integrity：`07_重建工作区/PDM-14_最终完整性复核_2026-10-06.md / PASS`；
- PDM-14 incoming handoff：8 / 8 CLOSED / source backwrite done；
- IA / Low-Fi / Engineering：继续 NO_CONSTRUCTION。

## 12. 当前唯一下一步

> **PDM-14 已 `COMPLETE / INTEGRITY_PASS`。下一步仅进入 PDM-15 Startup Gate：读取 Coverage Map、PDM-15 的 5 条 incoming handoff 与 Consultation 相关 9/19 / 001～078 / Current 证据，先建立启动门禁；未经新的用户裁决，不提前进入 PDM-15 Batch 1，不修改 IA / Low-Fi / Engineering。**
