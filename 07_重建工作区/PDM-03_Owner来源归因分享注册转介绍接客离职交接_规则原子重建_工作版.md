# PDM-03｜Owner / 来源归因 / 分享注册 / 转介绍 / 接客 / 离职交接｜规则原子重建工作版

> 日期：2026-09-24  
> 状态：`BATCH_1_COMPLETE_PREPARE_BATCH_2`  
> 说明：严格按当前 GitHub 原始证据重新重建，不使用旧聊天记忆替代证据。PDM-01、PDM-02 已正式 COMPLETE；本批仅展示 PDM-03 Batch 1｜稳定一致项，未经用户确认不得进入 Batch 2。

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
