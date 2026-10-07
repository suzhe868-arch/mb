# PDM-25｜审计 / 历史 / 时区 / 配置版本 / 终态 / 横切完整性｜规则原子重建工作版

> 当前状态：`IN_PROGRESS / STARTUP_GATE_PASS / BATCH_1_PENDING`  
> 核心定位：`P25-R00 = USER_APPROVED / APPLIED`  
> Incoming Handoff：`24 / 24 HANDOFF_ACCEPTED`  
> IA / Low-Fi / Engineering：`NO_CONSTRUCTION`

---

# 1. P25-R00｜核心定位｜USER_APPROVED / APPLIED

PDM-25 是：

> **全项目审计 / 历史 / 时区 / 配置版本 / 终态真实性 / 横切完整性的唯一产品 Authority。**

PDM-25 负责统一：

- Audit Event / History Record 的产品语义；
- 重要 mutation 的操作追溯；
- before / after / actor / time / result / context；
- 配置版本与“新配置不得追改既有历史事实”的横切原则；
- Business Day / Time Boundary 的统一业务时区解释；
- 终态 / 历史事实的不可篡改与只读边界；
- 权限撤销后旧页面、旧 session、旧敏感 payload、旧 deep-link 的失效原则；
- 敏感字段在审计 / 历史中的最小化与脱敏；
- completed-PDM 已冻结规则的跨对象历史真实性；
- 已明确要求的幂等、并发唯一性、snapshot、不重复扣减/超退等横切完整性验证。

PDM-25 **不是新的业务状态层**。

Customer、Employee、Vehicle、Demand、Matching、Priority、Recommendation、Consultation、CRM、Public Pool、LockRequest、Lock、Waitlist、Deposit、Transaction、Refund、Notification、Announcement、Banner 等业务对象的状态机与业务结果，继续以各 completed-PDM Final 为 Authority。

PDM-25 不得借“统一审计 / 历史 / 完整性”之名：

- 新建第二套业务主状态；
- 改写 completed-PDM 已冻结的业务语义；
- 恢复已废弃能力；
- 把历史 carrier 当成当前 Authority；
- 规定数据库表、MQ、事务框架、日志存储引擎等 Engineering 实现。

---

# 2. Startup Gate｜PASS

## 2.1 Current Authority Refresh

已重新读取并对齐：

- README / CURRENT_PROJECT_STATE / NEXT_ACTION / PROJECT_STATE；
- 产品基线重建执行规范；
- 9/19 全域覆盖地图中 PDM-25 定位；
- 9/19 R12 P11 统一审计日志与配置统一原则；
- 9/22 Frozen Visual Review 中 VR-P-035～VR-P-038；
- PDM-01～PDM-24 已完成 Final / Integrity；
- CROSS_PDM_HANDOFF_REGISTER 中 target=PDM-25 的全部 handoff。

Startup Gate 结果：

- `COMPLETED_PDM_HARD_CONFLICT = 0`
- `INCOMING_HANDOFF_COUNT = 24`
- `INCOMING_HANDOFF_ACCEPTED = 24`
- `INCOMING_HANDOFF_GAP = 0`
- `GLOBAL_INVARIANT_CONFLICT = 0`
- `IA_LOWFI_ENGINEERING_CONSTRUCTION = NO`

## 2.2 Incoming Handoff｜24 / 24 ACCEPTED

1. `HO-P01-P25-001`｜Customer 身份、手机号、停用/恢复、来源/owner 历史的统一审计与留存；
2. `HO-P02-P25-001`｜role / permission / scope / active-inactive / System Admin 的统一审计；
3. `HO-P03-P25-001`｜owner transfer / handover batch / 来源 / 历史贡献审计；
4. `HO-P04-P25-001`｜vehicle/source/listing/visibility/conversion 的统一审计、历史与终态不回写；
5. `HO-P05-P25-001`｜mapping before/after、车型修正/合并迁移/主档纠错历史；
6. `HO-P06-P25-001`｜正式发布、source_type 修改、保存修改、VIN duplicate Gate、draft delete 审计；
7. `HO-P07-P25-001`｜archive create/update/replace/void/verify、visibility、required-field config、版本关系；
8. `HO-P08-P25-001`｜公开域名、Origin、report proxy target、资产化/recovery 关键状态；
9. `HO-P09-P25-001`｜电话查看/拨打/latest、缓存、source_platform + publisher、必要业务 context；
10. `HO-P10-P25-001`｜price/override/temp quota/risk/conversion snapshot/level entitlement config；
11. `HO-P11-P25-001`｜Application / Demand / Customer disable / Customer Level 等生命周期与负责人变更历史；
12. `HO-P12-P25-001`｜Rule Dictionary、Match Result、recalc、stale invalidation、人工确认历史；
13. `HO-P13-P25-001`｜Priority 资格、仲裁、TTL snapshot、release、handover、组合动作审计；
14. `HO-P14-P25-001`｜Recommendation / visibility grant create/end/void、价格 snapshot、权限暂停恢复；
15. `HO-P15-P25-001`｜Consultation 生命周期、SLA、负责人转派、first-response 历史；
16. `HO-P16-P25-001`｜CRM Stage / Tag / Shared Profile / Follow-up / 字典历史；
17. `HO-P17-P25-001`｜Public Pool / owner transfer / Collaboration / 每轮公海历史；
18. `HO-P18-P25-001`｜LockRequest / Lock / Waitlist、唯一 active Lock、幂等、并发 winner、snapshot；
19. `HO-P19-P25-001`｜Deposit / Transaction / Refund / correction、append-only、原子转换、超退保护与事务隔离；
20. `HO-P20-P25-001`｜客户端旧敏感 UI/payload 撤销、copy-before-view、Historical Detail、query context、submit idempotency、Customer Safe Projection 测试矩阵；
21. `HO-P21-P25-001`｜Internal Mode session、权限撤销、员工高风险动作 entry_context / result / failure；
22. `HO-P22-P25-001`｜重要配置 before/after/actor/time、配置版本、PC credential 治理；
23. `HO-P23-P25-001`｜Notification Config / 飞书映射 / DND / cadence / Notification Log / timezone；
24. `HO-P24-P25-001`｜Announcement / Banner 配置变更、每日展示事实、history / timezone。

以上 handoff 仅由 PDM-25 承接横切审计 / 历史 / 完整性，不允许反向改变来源 PDM 的业务状态机。

---

# 3. Startup Gate 全局不变量

## P25-GI-01｜审计日志只读

统一审计入口面向合法用户提供：

- 查询；
- 筛选；
- 详情；
- 必要关联跳转。

普通业务后台不得：

- 修改已有审计事件；
- 覆盖旧事件；
- 删除真实历史；
- 通过“修正”把原错误事实抹掉。

需要纠正时，应通过新的 correction / void / replacement / 新事件表达，具体业务纠正动作继续服从来源 PDM。

## P25-GI-02｜重要 mutation 统一可追溯

重要业务 mutation 至少应能表达：

- 发生时间；
- actor / system actor；
- 当时合法身份 / 角色上下文；
- 业务域 / 对象；
- action；
- before / after；
- result；
- reason / note（来源业务明确要求时）；
- 必要关联 ID / source context。

不是所有普通浏览、页面打开、无风险展示都强制成为高等级 Audit Event。

## P25-GI-03｜敏感字段最小化

审计 / 历史不得成为绕过权限查看敏感信息的新入口。

至少：

- Token / Secret 不记录完整明文；
- 手机号、上游电话、内部价格、资金、敏感身份资料按 current permission + scope 做最小展示 / 脱敏；
- 历史日志可以证明“发生过什么”，但不因此扩大当前查看权。

## P25-GI-04｜配置不追改历史

默认配置或业务配置发生变化后，不得自动追改已经固化的业务事实或 snapshot。

典型包括但不限于：

- Lock duration / expires_at；
- Consultation SLA deadline；
- price / entitlement / conversion snapshot；
- Priority TTL snapshot；
- Transaction / Refund 已形成金额事实。

若某 completed-PDM 明确规定某项使用动态当前配置，则继续服从该域 Final；PDM-25 不强制全部改成 snapshot。

## P25-GI-05｜终态与历史真实性

已结束、已取消、已作废、已退款、已下架、历史 Recommendation、历史 Match Result、历史 Listing Cycle 等事实不得因为后续状态变化被物理删除或重写成“从未发生”。

Current projection 与 Historical fact 必须分离。

## P25-GI-06｜统一业务时区

V1 横切业务自然日统一按：

> **Asia/Shanghai（UTC+8）**

解释。

PDM-25 统一 timestamp / history / business-day 的表达标准，但不得反向改变 PDM-23 / PDM-24 已冻结的 DND、每日频控等产品语义。

## P25-GI-07｜权限撤销后的旧载体失效

current identity / permission / data scope / account state / object state 发生变化后：

- 旧页面；
- 旧 session；
- 旧 deep-link；
- 旧敏感 payload；
- 已复制但尚未合法使用的敏感载体

不得继续作为永久授权凭证。

提交 mutation 时继续由来源业务域执行 current Guard。

## P25-GI-08｜横切完整性不等于工程实现

PDM-25 可以冻结产品层必须成立的：

- 幂等 / retry-safe 结果；
- 唯一 active 约束；
- 并发 winner；
- 不重复扣减 / 不超退；
- snapshot 不追改；
- append-only history；
- terminal read-only；
- cross-object historical truth。

但不在本阶段冻结：

- 数据库类型；
- 表结构；
- 索引；
- MQ；
- worker topology；
- transaction framework；
- retry 次数 / backoff 算法；
- 日志物理保留周期。

---

# 4. 历史冲突隔离

9/19 R12 P11 曾列出“客户合并”作为审计对象。

当前 PDM-01 Final 已明确：

> **V1 不提供 Customer Merge。**

因此 PDM-25：

- 不恢复自动 Merge；
- 不恢复人工 Merge；
- 不因为 P11 旧审计条目重新建立 Merge Action；
- 如果历史数据中真实存在过去的 merge-like / duplicate-handling 记录，仅作为历史事实保留，不创造当前业务能力。

该项属于：

> `HISTORICAL_CARRIER_SUPERSEDED / NO_PRODUCT_CONFLICT`

---

# 5. Startup Gate 结论

- `P25-R00 = USER_APPROVED / APPLIED`
- `STARTUP_GATE = PASS`
- `INCOMING_HANDOFF_COUNT = 24`
- `INCOMING_HANDOFF_ACCEPTED = 24`
- `INCOMING_HANDOFF_GAP = 0`
- `COMPLETED_PDM_HARD_CONFLICT = 0`
- `GLOBAL_INVARIANT_CONFLICT = 0`
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`
- `IA_LOWFI_ENGINEERING_CONSTRUCTION = NO`

PDM-25 完成前：

- 24 条 incoming handoff 保持 `HANDOFF_ACCEPTED`；
- 不得提前关闭或 source backwrite 来源 PDM；
- 不得提前标记 PDM-25 COMPLETE；
- 不得启动 PDM-01～25 全局最终总复核；
- 不得开始 IA / Low-Fi 集中对齐；
- 不得执行 Engineering Delta。

# 6. 当前唯一下一步

> **PDM-25 Batch 1｜稳定一致规则审查。**
