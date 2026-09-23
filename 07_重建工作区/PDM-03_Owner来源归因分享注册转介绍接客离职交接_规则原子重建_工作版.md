# PDM-03｜Owner / 来源归因 / 分享注册 / 转介绍 / 接客 / 离职交接｜规则原子重建工作版

> 日期：2026-09-24  
> 状态：`FINAL_REVIEW_PENDING`  
> 说明：严格按当前 GitHub 原始证据重新重建，不使用旧聊天记忆替代证据。PDM-01、PDM-02 已正式 COMPLETE；PDM-03 Batch 1～4 已全部用户确认，当前仅等待最终完整规则总览用户批准。

## 1. 证据范围

- 9/19 主底盘：`Phase1_当前唯一业务合并基线.md` → R5《客户注册 / 归属 / 分享注册 / 转介绍 / 离职交接》
- 补回 R5 原件：`R5_客户注册归属分享转介绍离职交接_业务重审最终总结.md`
- 9/17 及更早 CN11：
  - `名邦汽车_V1_DECISION_REGISTER_2026-09-06.md`
  - `名邦汽车_V1_SSOT_CHECKPOINT_2026-09-06.md`
- 后续承载：`IA_CURRENT.md`
- 已正式冻结的跨域约束：
  - `PDM-01_最终完整规则.md`
  - `PDM-02_最终完整规则.md`

## 2. Batch 1｜稳定一致项

| Atom | 当前候选规则 | 前后证据结论 | 状态 |
|---|---|---|---|
| P03-A01 | 同一 Customer 同一时刻只能有一个正式 `current owner`；不得同时存在两个并列正式 owner | CN11 SSOT §8.1、R5 原件、9/19 R5、后续 IA 一致 | `USER_CONFIRMED` |
| P03-A02 | 客户原始来源、来源销售、直接推荐人 / 转介绍来源、当前 owner 必须分离保存；owner 后续变化不得改写原始来源或历史 owner | CN11 Decision、SSOT、R5 原件、9/19 R5、PDM-01 一致 | `USER_CONFIRMED` |
| P03-A03 | 已经存在正式 owner 的客户，之后再点击其他名邦员工分享链接，不改变 current owner；分享最多新增来源 / 触达事实，不能形成“最后分享者抢客” | CN11 Decision 明确禁止“最后点击链接抢客”；R5 原件、9/19 R5、IA 一致 | `USER_CONFIRMED` |
| P03-A04 | 对尚无 owner 的新客户，若通过 active 且具名邦客户业务资格员工的有效本人分享形成有效来源，可按该员工分享归属规则建立 owner；员工关闭“接客”只退出自然轮询，不自动取消本人有效分享获客能力 | CN11 SSOT §8.2、R5 原件 §5/§9、IA CR-D1 一致 | `USER_CONFIRMED` |
| P03-A05 | 明确的“直接转介绍”事件中，新客户由推荐人在事件发生时的 current owner 承接；推荐人以后换 owner，只影响以后新发生的转介绍，不反向改写既有来源 / 推荐事实 | CN11 Decision、SSOT、R5 原件、IA V2 统一规则、PDM-01 一致 | `USER_CONFIRMED` |
| P03-A06 | V1 只认直接推荐关系，不建设多级客户归属 / 多级佣金 / 多级奖励体系；A→B→C 时，B 的直接推荐人是 A，C 的直接推荐人是 B | R5 原件 §16、IA V2 统一规则同向；无后续恢复多级体系 | `USER_CONFIRMED` |
| P03-A07 | 员工关闭接客只影响未来自然新客户轮询，不自动转走其已有客户；已有客户继续由原 current owner 负责，除非发生正式移交 / 公海 / 离职交接等明确业务事件 | R5 原件 §9/§10、9/19 R5 §8、IA Current、PDM-02 接客规则一致 | `USER_CONFIRMED` |
| P03-A08 | 员工进入 inactive / 离职或失去承接资格后，不能继续承接新的 Customer owner；历史分享链接 / 来源事实可以保留，但新 owner 必须由当前合法接替人或当前有效归属 / 合格接客规则产生 | CN11 Decision、SSOT、R5 原件 §13、9/19 R5 §9、PDM-02 一致 | `USER_CONFIRMED` |
| P03-A09 | 普通 Customer owner 变化不会自动把 active Demand、Consultation、Waitlist、Lock、Transaction 等已固化业务负责人一起漂移；确需转交时，对具体业务执行正式 reassignment 并保留历史 | CN11 SSOT §8.1、Decision“owner变化不得自动漂移全部业务负责人”、IA handoff 规则一致 | `USER_CONFIRMED` |
| P03-A10 | 员工离职 / inactive / 失去业务资格时，交接范围不能只处理 customer owner，还必须同步检查并处理其当前仍负责的活跃客户业务；历史贡献、原负责人、操作与责任事实不得被覆盖或删除 | CN11 SSOT §8.4、R5 原件 §14、9/19 R5 §10、IA handoff 一致 | `USER_CONFIRMED` |
| P03-A11 | 离职交接必须形成可追溯的 handover batch，至少能追溯 departed employee、departed time、离职当时正式归属客户清单、后续转交 / 再次分配历史；后续多次 owner 变化不能抹掉该批次来源 | CN11 SSOT §8.5、9/19 R5 §11 一致；后续未见相反规则 | `USER_CONFIRMED` |
| P03-A12 | 有权限且 data scope 覆盖目标客户的经理 / 店长可执行正式 owner 移交、冲突仲裁；普通销售不能自行抢走他人客户；操作必须保留原 owner、新 owner、操作人、时间等审计 | R5 原件 §11/§12、9/19 R5 §12、IA customer ownership permission、PDM-02 管理边界一致 | `USER_CONFIRMED` |
| P03-A13 | 经理 / 店长作为离职交接处理人，不会因此自动成为全部离职客户或全部活跃业务的新负责人；重新入职员工也不会自动拿回离职前客户或业务责任 | CN11 SSOT §8.4/§8.5、PDM-02 复职规则、IA E08/E09 一致 | `USER_CONFIRMED` |

## 3. 本批明确不处理的事项

以下不是“稳定一致项”，后续进入 Batch 2～4：

- 新 Customer 建立后立即自然轮询形成 owner：这是 2026-09-24 PDM-01 主动新修改，留 Batch 3；
- 普通客户侧车辆转发是否只记 `SOURCE_ONLY`：当前已由 PDM-01 新规则明确，历史 R5 曾把老客户分享直接当转介绍，留 Batch 3；
- 接客池异常为空时 `owner_assignment_pending`：PDM-02 新增异常兜底，留 Batch 3；
- “销售分享注册”与“直接转介绍”的最终优先级 / 冲突仲裁细节：若原始来源同时出现，留 Batch 4；
- 公海、待公海处理、领取、指定分配、Collaboration：属于 PDM-17；
- Priority 交接后的具体有效性 / TTL / 权限：属于 PDM-13；
- Recommendation / 分享后的逐车授权：属于 PDM-14；
- Demand / Consultation / Waitlist / Lock / Transaction 各自责任人的完整状态机：分别留对应 PDM；
- Customer Merge：PDM-01 已明确 V1 完全取消，不在 PDM-03 重开。

## 4. Batch 1 门禁结果

- P03-A01～P03-A13：`USER_CONFIRMED`
- Batch 1：`COMPLETE_USER_CONFIRMED`
- Decision Register：`PDM03-DEC-A01`～`PDM03-DEC-A13` + `PDM03-GATE-B1`

下一步允许准备：

> **PDM-03 Batch 2｜明确废弃 / 明确替代 / DO_NOT_RESTORE**

Batch 2 展示后必须停止等待用户确认。


## 5. Batch 2｜明确废弃 / 明确替代 / DO_NOT_RESTORE

| Atom | 明确不得恢复的旧方向 | 当前替代规则 / 理由 | 证据 | 状态 |
|---|---|---|---|---|
| P03-B2-01 | “Customer 首次进入只建立 customer_id，不形成 owner；等首次人工服务事件再分配 owner” | **不得恢复。** 2026-09-24 已由 PDM-01 主动改为：无有效销售分享 / 直接转介绍等优先归属来源时，新 Customer 建立 / 识别后立即进入 active + eligible + accepting 接客池自动轮询形成唯一 current owner | R5 原件/9-19/旧 IA 为旧口径；PDM-01 P01-A04 + PDM01-DEC-R5-REB-001 已明确覆盖 | `USER_CONFIRMED` |
| P03-B2-02 | 最后点击的销售分享链接覆盖已经存在的 current owner / “最后分享者抢客” | **不得恢复。** 已有 owner 的客户点击其他员工分享，只新增来源/触达事实，不改变 owner | CN11 DEC-011 Superseded；9/19 R5 §15；P03-A03 | `USER_CONFIRMED` |
| P03-B2-03 | 把原始来源、来源销售与 current owner 合成同一个事实；owner 变化后把新 owner 反写成原始来源 | **不得恢复。** 来源事实与 owner 分离保存，owner 可合法变化但不能改写历史来源 | 9/19 R5 §6/§15；R5 原件 §8/§21；P03-A02 | `USER_CONFIRMED` |
| P03-B2-04 | 老客户产生新转介绍时永远跟随其历史 owner / 最初销售 | **不得恢复。** 明确直接转介绍按事件发生时推荐人的 current owner 承接；历史 owner 不覆盖当前正式 owner | CN11 DEC-011 Superseded；9/19 R5 §7/§15；P03-A05 | `USER_CONFIRMED` |
| P03-B2-05 | 员工关闭接客或短期休假后，自动把其已有客户全部转走 | **不得恢复。** 关闭接客只退出未来自然轮询；已有客户保持原 owner，除非发生正式移交、公海、离职交接等明确事件 | R5 原件 §9/§10/§21；9/19 R5 §8/§15；P03-A07 | `USER_CONFIRMED` |
| P03-B2-06 | inactive / 离职员工继续承接新的 Customer owner | **不得恢复。** 离职/失去资格后只能保留历史来源与历史贡献；新客户必须交给合法接替人或当前合格接客规则 | 9/19 R5 §9/§15；R5 原件 §13；P03-A08 | `USER_CONFIRMED` |
| P03-B2-07 | 普通销售可以自行抢走、直接修改其他销售的 Customer owner | **不得恢复。** 正式 owner 移交 / 冲突仲裁必须由有权限且 data scope 覆盖的管理者执行并留审计 | R5 原件 §11/§12/§21；P03-A12 | `USER_CONFIRMED` |
| P03-B2-08 | Customer owner 一变化，就自动把 Demand / Consultation / Waitlist / Lock / Transaction 等全部业务负责人一起改成新 owner | **不得恢复。** Customer owner 与具体业务负责人分层；普通 owner change 不自动漂移已固化负责人，确需调整必须正式 reassignment 并保留历史 | CN11 DEC-033 Superseded；SSOT §8.1；P03-A09 | `USER_CONFIRMED` |
| P03-B2-09 | 建设多级转介绍客户归属、返佣 / 奖励 / 积分 / 裂变等级体系 | **V1 不采用，不得作为当前 owner 规则恢复。** 只保存直接推荐关系及必要来源事实；A→B→C 只认相邻直接推荐关系 | R5 原件 §16/§21；CN11 SSOT §8.3；P03-A06 | `USER_CONFIRMED` |

## 6. Batch 2 边界说明

- P03-B2-01 是**后续用户主动反转后的旧规则禁恢复项**：历史上 9/19 曾把“首次进入立即分配销售”列为禁止，但 PDM-01 已经重新裁决，因此当前不得再引用 9/19 的旧禁止条款推翻 P01-A04。
- “普通客户车辆转发只记 SOURCE_ONLY，不构成直接转介绍”不是历史稳定废弃项，而是后续明确拆分，留 Batch 3。
- 接客池异常为空时的 `owner_assignment_pending` 是 PDM-02 后续新增异常闭环，留 Batch 3。
- Customer Merge 已由 PDM-01 取消，PDM-03 不重复审。

## 7. Batch 2 门禁结果

- P03-B2-01～P03-B2-09：`USER_CONFIRMED`
- Batch 2：`COMPLETE_USER_CONFIRMED`
- Decision Register：`PDM03-DEC-B2-01`～`PDM03-DEC-B2-09` + `PDM03-GATE-B2`

下一步开放：

> **PDM-03 Batch 3｜明确知情修改 / 后续明确新增**


## 8. Batch 3｜明确知情修改 / 后续明确新增

| Atom | 当前候选规则 | 修改 / 新增来源 | 状态 |
|---|---|---|---|
| P03-A14 | **自然注册立即形成 owner。** 新 Customer 建立 / 识别 `customer_id` 后，若没有有效员工分享、明确直接转介绍等更高优先归属来源，则立即进入当前 `active + eligible + accepting` 接客池自动轮询，形成唯一 `current owner`；有效直接转介绍优先于普通自然轮询 | 2026-09-24 PDM-01 P01-A04 / PDM01-DEC-R5-REB-001 主动覆盖 R5/9-19/旧 IA“首次进入不立即形成 owner” | `USER_CONFIRMED` |
| P03-A15 | **客户车源分享本身就是转介绍/获客归属链。** 对尚无正式 owner 的新客户 B：A 将车源链接分享给 B，B 通过该链接进入后，按该分享链**实际绑定的销售**建立 B 的 current owner，并同时保存 A→B 的来源/推荐关系。A 转发张三绑定的链接，则 B 归张三；A 转发李四绑定的链接，则 B 归李四；A 使用自己的客户分享链接时，也保留 A 为来源客户/间接推荐人，并按该客户分享链对应的销售归属 B。**已有正式 owner 的老客户 B 仍不得被分享链接抢走。** | 2026-09-24 用户明确修正此前 SOURCE_ONLY 方案；主动恢复“客户车源分享可形成新客户归属”的业务语义，并以分享链实际销售绑定作为新客户 owner 来源 | `USER_CONFIRMED_MODIFIED` |
| P03-A16 | **接客池异常为空的 owner 兜底闭环。** 正常操作仍必须保留至少 1 名 `active + eligible + accepting` 合格接客员工；若因突发 inactive / 资格失效等导致池被动为 0，新 Customer 身份仍可建立，但在没有其他优先归属来源时进入 `owner_assignment_pending`；不得用 System Admin 或 `responsible=null` 作为正式负责人；不得创建无负责人正式人工服务对象；接客池恢复后自动重试 owner 分配，并对池空/待分配/恢复/补分留告警与审计 | 2026-09-24 PDM-02 §10.1 用户确认新增异常闭环，在 CN11 旧“池空报错/不建正式对象”基础上补齐 owner_assignment_pending 与自动恢复 | `USER_CONFIRMED` |

## 9. Batch 3 边界说明

- P03-A14 不重新讨论 PDM-01 已冻结的 Customer 身份规则，只在 PDM-03 承接 owner 产生语义。
- P03-A15 已由用户主动反转：普通客户车源分享不再是纯 `SOURCE_ONLY`，而是可对**尚无 owner 的新客户**形成转介绍/获客归属；已有 owner 客户仍不抢客。Recommendation / 分享后的逐车授权仍留 PDM-14。
- P03-A16 只定义 owner / 接客池异常闭环；具体人工服务对象的生命周期仍由对应 PDM 决定。
- 普通销售 / 经理 / 店长是否可参与接客、4S / System Admin 是否进入接客池，已在 PDM-02 正式冻结；如本域最终总览需要承接，只引用，不重开裁决。

### P03-A15 补充未决｜分享链接销售绑定时点

用户已确认“分享链绑定哪个销售，新客户就归哪个销售”，但以下时间点细节尚未明确：

> A 发出链接后、B 打开链接前，如果 A 的 current owner 发生变化，A 自有客户分享链接应继续绑定分享时原销售，还是在 B 进入时解析 A 的最新 current owner？

该项不影响本轮 A15 核心业务方向，留 PDM-03 Batch 4 单独裁决，不在此擅自补全。

## 10. Batch 3 门禁结果

- P03-A14：`USER_CONFIRMED`
- P03-A15：`USER_CONFIRMED_MODIFIED`
- P03-A16：`USER_CONFIRMED`
- Batch 3：`COMPLETE_USER_CONFIRMED`
- Decision Register：`PDM03-DEC-A14`～`PDM03-DEC-A16` + `PDM03-GATE-B3`

下一步允许准备：

> **PDM-03 Batch 4｜冲突 / 历史遗漏 / 证据缺口 / 新选择**


## 11. Batch 4｜冲突 / 历史遗漏 / 证据缺口 / 新选择

| Atom | 缺口 / 冲突 | 当前候选规则 | 证据与原因 | 状态 |
|---|---|---|---|---|
| P03-B4-01 | **客户分享链到底锁“分享时销售”还是跟“客户当前 owner”？** 用户新规则又增加了“转发某销售绑定链接就归该销售”，因此必须区分两类分享上下文 | **候选：分两类解析。** ① 若 A 分享/转发的是明确绑定员工 S 的销售分享上下文，则 ownerless 新客户 B 归 S（S 需在 B 进入时仍 active + eligible；S 关闭 accepting 不影响主动分享获客）；② 若 A 使用的是“客户 A 自己的分享上下文”，没有额外明确员工绑定，则 B 在有效进入时读取 **A 当时的 current owner**，而不是永久锁死 A 分享时的旧 owner；因此 A 之后正式转交给新销售，旧客户分享链接仍有效且后续新客户跟 A 当前 owner | 用户本轮明确“张三链接归张三、李四链接归李四”；R5 §6/§15 与 CN11 DEC-011 明确“老客户旧链接随老客户当时 current owner 变化，不永久跟历史 owner” | `USER_CONFIRMED` |
| P03-B4-02 | **必须既知道 B 归哪个销售，又知道 A→B 是谁介绍来的；单纯原样转发旧链接可能丢 A 的关系** | **候选：客户 A 每次执行分享时，都形成可追溯的 share attribution context。** 至少分开保存：`source_customer_id=A`、分享/推荐事件、有效 sales binding / 解析来源。对新 B，可据此形成 owner；对已有 owner 的 B，只记录 A→B 分享/推荐事件与来源触达，不改 current owner，也不反写原始来源。不得把 A 与实际承接销售混成一个字段 | 用户明确要求“能明确知道 A 和 B 的关系”；P03-A02 已确认来源与 owner 分离；P03-A15 已确认客户分享可形成获客归属；P03-A03 已确认已有 owner 不抢客 | `USER_CONFIRMED` |
| P03-B4-03 | **分享链绑定的销售在 B 进入前离职 / inactive / 失去业务资格怎么办？** | **候选：链接仍可打开，来源事实保留，但不得把 B 归给失效销售。** 若该销售已有明确合法接替人，则 ownerless 新 B 归接替人；若无明确接替人，则进入当前合格接客池；若合格接客池异常为空，则进入已确认的 `owner_assignment_pending`。仅关闭 accepting、但员工仍 active + eligible 时，不影响其主动分享获客能力 | R5 §13 明确旧销售分享链接不失效、接替人优先、无接替人进合格池；P03-A04 已确认关闭 accepting 不取消本人分享获客；P03-A16 已确认池空异常闭环 | `USER_CONFIRMED` |
| P03-B4-04 | **分享归属和“自然注册立即轮询”发生在同一次首次进入，若处理顺序不冻结会出现并发抢 owner** | **候选：对尚无 owner 的 B，先在同一 owner-assignment 判定中解析有效分享/推荐归属，再决定是否进入自然轮询。** 有合法 share/referral owner 时不再执行普通轮询；分享绑定失效则按 B4-03 fallback；只有没有任何有效优先归属时才执行 A14 自然轮询。owner 一旦成功形成，重复打开、刷新、重试、后续其他分享均保持幂等，不得再次改 owner | P03-A14 已确认“有效分享/转介绍优先于普通自然轮询”；R5 §4 第一次有效归属事件原则；P03-A01/A03 已确认唯一 owner + 后续分享不抢客 | `USER_CONFIRMED` |

## 12. Batch 4 说明

### B4-01 的关键区别

这里不是所有客户分享都采用同一个“锁定销售”算法：

- **明确销售绑定链接**：例如 A 明确转发张三的销售分享上下文 → 新 B 优先归张三；
- **A 自己的客户分享上下文**：A 是来源客户 / 推荐人，销售承接跟随 B 有效进入时 A 的 current owner。

这样同时满足：
- 用户新确认的“分享哪个销售的链接，就归哪个销售”；
- 历史已确认的“A 自己旧分享链接在 A 正式转交后，后续新客户跟 A 当前 owner”。

### B4-02 不提前规定 URL 技术格式

产品层只冻结“必须能够追溯 A→B 与 sales binding 两类事实”。具体是 share token、scene 参数、服务端 share context ID 还是其他实现，留技术阶段，不在产品基线写死。

### 与 PDM-14 的边界

本批只处理：
- 新客户 owner；
- 来源 / 推荐关系；
- 分享销售绑定；
- owner 分配顺序。

不处理：
- Recommendation；
- 隐藏车逐车可见授权；
- 查价权益；
- 分享页视觉。

这些继续留 PDM-14 / PDM-20。

## 13. Batch 4 门禁结果

- P03-B4-01～P03-B4-04：`USER_CONFIRMED`
- Batch 4：`COMPLETE_USER_CONFIRMED`
- Decision Register：`PDM03-DEC-B4-01`～`PDM03-DEC-B4-04` + `PDM03-GATE-B4`

至此 PDM-03 四批门禁全部完成。

下一步仅允许生成并审查：

> **PDM-03｜最终完整规则总览｜待用户批准**

未经最终批准，不得将 PDM-03 标记为 COMPLETE，也不得进入 PDM-04。
