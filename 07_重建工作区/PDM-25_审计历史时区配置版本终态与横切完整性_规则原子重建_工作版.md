# PDM-25｜审计 / 历史 / 时区 / 配置版本 / 终态 / 横切完整性｜规则原子重建工作版

> 当前状态：`IN_PROGRESS / STARTUP_GATE_PASS / BATCH_4_PASS`  
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

# 6. Batch 1｜稳定一致规则｜PASS / USER_APPROVED / APPLIED

以下规则已由用户审查，并在明确“确定执行”后正式进入 PDM-25 当前 Authority。

## P25-A01｜全项目统一审计入口只读｜USER_APPROVED / APPLIED

P11 作为全项目统一审计检索入口，支持合法范围内的：

- 查询；
- 筛选；
- 详情；
- 必要关联查看 / 跳转。

普通业务后台不得：

- 修改已有真实 Audit Event；
- 覆盖旧事件；
- 删除真实历史；
- 通过所谓“修正”把原错误事实抹掉。

需要纠正时，继续通过来源业务域合法的 correction / void / replacement / 新事件表达。

## P25-A02｜重要业务变更统一可追溯｜USER_APPROVED / APPLIED

重要业务 mutation 至少应能表达：

- time；
- actor / system actor；
- 当时合法 identity / role context；
- business domain / object；
- action；
- before；
- after；
- result；
- 来源业务明确要求时的 reason / note；
- 必要关联 ID / source context。

PDM-25 统一最低追溯语义，但不重定义来源 PDM 的业务动作与结果。

## P25-A03｜reason / note 不做全局强制｜USER_APPROVED / APPLIED

- 来源业务已经明确要求 reason / note 的动作，必须继续记录；
- 来源业务没有明确要求的，不由 PDM-25 额外强制每次填写原因；
- 不得因为建立统一审计而改变原业务动作的提交门槛。

## P25-A04｜普通浏览不强制升级为高等级审计｜USER_APPROVED / APPLIED

日常普通浏览、普通页面打开、无风险展示、普通非敏感查看：

- 不强制逐条形成高等级 Audit Event；
- 是否保留运行日志、埋点或技术日志留 Engineering / Analytics 处理；
- PDM-25 重点覆盖重要 mutation、敏感动作与必须保留的业务历史事实。

## P25-A05｜审计 / 历史不得成为越权入口｜USER_APPROVED / APPLIED

审计可以证明：

> **发生过什么。**

但不因此自动授予：

> **查看完整敏感值的当前权限。**

审计查询、筛选、详情与关联查看继续服从：

- current identity；
- explicit permission / capability；
- data scope；
- 当前账号 / 对象状态；
- 来源业务额外 hard DENY。

## P25-A06｜敏感字段最小化与脱敏｜USER_APPROVED / APPLIED

统一原则：

- Token / Secret 不记录或展示完整明文；
- 手机号、上游电话、内部价格、资金、敏感身份资料等，按 current permission + data scope 做最小展示 / 脱敏；
- Audit / History 不得成为绕过 PDM-02、PDM-09、PDM-10、PDM-19 等当前敏感权限边界的旁路。

## P25-A07｜业务历史不可被普通修改覆盖｜USER_APPROVED / APPLIED

已真实形成的历史事实，包括但不限于：

- ended；
- cancelled；
- voided；
- refunded；
- delisted；
- historical Recommendation；
- historical Match Result；
- historical Listing Cycle；
- 已完成 / 已撤销 / 已纠错业务事实；

不得因为后续当前状态变化而物理删除，或重写成“从未发生”。

## P25-A08｜Current Projection 与 Historical Fact 分离｜USER_APPROVED / APPLIED

- Current Projection 负责表达对象“现在是什么”；
- Historical Fact 负责表达对象“过去真实发生过什么”；
- 当前状态变化不得反向改写真实历史；
- 历史事实也不得被误当成当前授权、当前状态或当前业务入口。

## P25-A09｜纠错通过追加新事实表达｜USER_APPROVED / APPLIED

需要纠正真实历史时：

- 使用 correction / void / replacement / 新事件等追加事实表达；
- 原错误操作、原成交、原资金、原业务状态变化事实不得为了得到“干净结果”而抹除；
- 纠错主体、权限、对象状态、结果与副作用继续服从来源 completed-PDM Final。

## P25-A10｜重要配置变更统一留痕｜USER_APPROVED / APPLIED

会改变业务行为、权限、安全或客户展示结果的重要配置，至少保留：

- before；
- after；
- actor；
- time。

如来源业务明确要求额外字段、原因、版本关系或验证结果，继续完整保留。

## P25-A11｜配置继续归属原业务域｜USER_APPROVED / APPLIED

PDM-25 不建设脱离业务的万能配置中心。

例如：

- Lock 配置继续归 PDM-18 / 对应 PC 业务模块；
- 价格 / 查价配置继续归 PDM-10；
- permission / scope 配置继续归 PDM-02 / PDM-22；
- Notification / DND / cadence 继续归 PDM-23；
- Announcement / Banner 继续归 PDM-24。

PDM-25 只统一：

- 配置历史；
- 配置版本；
- before / after / actor / time；
- 配置与历史事实的横切关系。

## P25-A12｜新配置默认不追改已固化历史事实｜USER_APPROVED / APPLIED

默认配置或业务配置变化后，不得自动追改已经形成的 snapshot / historical fact。

典型包括：

- Lock duration / expires_at；
- Consultation SLA deadline；
- price / entitlement / conversion snapshot；
- Priority TTL snapshot；
- Transaction / Refund 已形成金额事实。

若某 completed-PDM 明确规定某项动态读取 current config，则继续服从该域 Final；PDM-25 不把所有配置强制改成 snapshot。

## P25-A13｜统一业务自然日为 Asia/Shanghai（UTC+8）｜USER_APPROVED / APPLIED

V1 横切业务自然日统一使用：

> **Asia/Shanghai（UTC+8）**

用于解释：

- 当天；
- 每日；
- 业务日；
- 历史 / 审计时间的业务展示与边界判断。

PDM-25 不在产品层规定数据库 timestamp 的物理存储格式，也不反向改变 PDM-23 / PDM-24 已冻结的 DND / 每日频控业务语义。

## P25-A14｜权限撤销后旧载体不得继续授权｜USER_APPROVED / APPLIED

当 current identity / permission / data scope / account state / object state 变化后：

- 旧页面；
- 旧 session；
- 旧 deep-link；
- 旧敏感 payload；
- 已复制但尚未合法使用的敏感载体；

不得作为永久授权凭证。

敏感 mutation 提交时必须继续执行来源域 current Guard。

## P25-A15｜区分 human actor 与 system actor｜USER_APPROVED / APPLIED

审计 / 历史必须能够区分：

- 人工操作；
- 系统自动操作。

自动分配、自动过期、自动状态处理、worker / scheduler 触发的产品事实，不得伪装成某个员工人工执行。

PDM-25 只冻结 actor 语义，不规定具体 worker / scheduler 技术实现。

## P25-A16｜横切完整性只冻结产品结果，不冻结工程方案｜USER_APPROVED / APPLIED

PDM-25 可以要求以下产品层结果必须成立：

- idempotent / retry-safe；
- unique active；
- concurrent winner；
- no duplicate consumption；
- no over-refund；
- snapshot not retroactively rewritten；
- append-only history；
- terminal read-only；
- cross-object historical truth。

但不在本阶段冻结：

- 数据库类型 / 表结构；
- index / unique index；
- MQ；
- distributed lock；
- transaction framework；
- retry count / backoff；
- log storage engine / retention implementation。

## P25-A17｜各业务域不得另建第二套 Audit / History Authority｜USER_APPROVED / APPLIED

Customer、Employee、Vehicle、Demand、Matching、Priority、Recommendation、Consultation、CRM、Public Pool、LockRequest、Lock、Waitlist、Deposit、Transaction、Refund、Notification、Announcement、Banner 等：

- 业务状态机继续以各 completed-PDM Final 为 Authority；
- PDM-25 统一横切审计 / 历史 / 时区 / 配置版本 / 完整性标准；
- 不复制第二套业务状态；
- 不借审计名义恢复已废弃能力；
- 不允许某业务域再造与 PDM-25 冲突的跨域审计体系。

---

# 7. Batch 1 执行结果

- `P25-A01～P25-A17 = PASS / USER_APPROVED / APPLIED`
- `BATCH_1_CONFIRMED_COUNT = 17`
- `COMPLETED_PDM_HARD_CONFLICT = 0`
- `INCOMING_HANDOFF_GAP = 0`
- `GLOBAL_INVARIANT_CONFLICT = 0`
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`
- `PDM-25 incoming handoffs = 24 / 24 HANDOFF_ACCEPTED`
- Final Closeout 前不得提前关闭 incoming handoff 或 source backwrite；
- `IA_LOWFI_ENGINEERING_CONSTRUCTION = NO`

# 8. Batch 2｜明确废弃 / 已覆盖 / 不得恢复｜PASS / USER_APPROVED / APPLIED

以下规则均属于历史 carrier、旧冻结台账或旧业务入口中仍可见，但已经被 completed-PDM Final 明确覆盖的旧语义。

## P25-B2-01｜Customer Merge 不得因审计项恢复｜USER_APPROVED / APPLIED

旧 R12 P11 / VR-P-037 曾把 Customer Merge 列为审计对象。

当前 Authority：
- PDM-01 Final 已明确 V1 完全取消 Customer Merge；
- 不提供自动 Merge；
- 不提供人工 Merge；
- 不提供手机号合并账号；
- 不提供确认同一自然人后的账号合并。

PDM-25 允许保留历史上真实存在过的旧 Merge 相关记录作为 Historical Fact，但不得因“审计对象清单曾包含 Customer Merge”重新建立：
- Merge Action；
- Merge permission；
- Merge 状态机；
- surviving customer_id；
- owner / 权益 / 业务迁移体系。

## P25-B2-02｜独立 Recommendation qualification 不得恢复｜USER_APPROVED / APPLIED

旧 R12 曾保留：
- Recommendation 资格开启 / 关闭；
- 独立 Recommendation qualification 管理。

PDM-14 Final 已明确废弃：
- 独立 Recommendation qualification；
- `RECOMMENDATION_QUALIFIED / NOT_QUALIFIED`；
- P06-06 推荐资格开关；
- 仅服务旧资格开关的独立管理能力。

当前正式 Recommendation 资格统一由 Customer Level 当前 `find-car entitlement` 决定；Priority qualification 继续独立，仅决定 Priority 排他保护。

PDM-25 可以审计历史旧资格事实，不得恢复旧资格开关或第二套资格状态。

## P25-B2-03｜独立“调价”动作 / permission 不得因审计恢复｜USER_APPROVED / APPLIED

旧 R12 / 历史 carrier 曾把“调价”作为独立权限或独立业务动作。

PDM-10 Final 已明确：
- 名邦 / 4S 的 `customer_list_price`、`internal_wholesale_price` 属于正常车辆业务字段；
- 不再建立独立“调价 permission”；
- 不再建立独立“调价业务动作”；
- 合法人员通过普通车辆编辑“保存修改”完成正常价格字段修改。

客户展示价覆盖继续是独立敏感能力，不与旧“调价”概念混同。

历史调价记录可以保留，但不得据此恢复旧 Action / permission。

## P25-B2-04｜旧独立拨打电话 permission 不得恢复｜USER_APPROVED / APPLIED

上游发布人电话仍是独立敏感能力，但 PDM-09 Final 已明确：
- 不新增独立 `can_call_wholesale_phone`；
- 查看 / latest / 拨打继续复用现有上游电话敏感能力；
- 同时叠加 current employee、data scope、当前 Vehicle source_type 等 Guard。

PDM-25 审计电话查看 / latest / 拨打，不代表重新创建“拨打专属 permission”。

## P25-B2-05｜Announcement 旧三档频率 / 重新发布模型不得恢复｜USER_APPROVED / APPLIED

9/22 VR-P-033 曾保留：
- 仅首次一次；
- 每天最多一次；
- 不自动弹。

VR-P-034 还出现过“重新发布 / 新公告”表述。

PDM-24 Final 已覆盖为：
- 独立 `auto-popup` 开关；
- 同一 Customer 同一 UTC+8 业务自然日 Announcement 主动弹层全局最多实际展示 1 条；
- 不建设“重新发布并重置触达”动作；
- 需要新一轮触达时，新建 Announcement。

PDM-25 只审计当前模型，不得恢复旧三档频率或重新发布状态机。

## P25-B2-06｜“VEHICLE_DETAIL Banner 不是强制模块”不得恢复｜USER_APPROVED / APPLIED

R12 历史 carrier 曾写：
> 详情 Banner 不是强制模块。

PDM-24 Final 已明确：
- `VEHICLE_DETAIL` 是所有合法车辆详情页固定具备的广告位能力；
- 无有效 Banner 时只是不渲染具体广告内容；
- 不代表该 placement 能力不存在。

PDM-25 的配置版本 / 历史不得把旧“可有可无的详情 placement”重新解释为 Current Authority。

## P25-B2-07｜Audit reason 不得恢复为全局必填｜USER_APPROVED / APPLIED

VR-P-036 曾把 reason 写入日志最小字段列表，不能据此推导为“所有动作都必须填写原因”。

当前统一规则：
- 来源业务明确要求 reason / note → 必填；
- 来源业务未要求 → PDM-25 不额外强制；
- 历史真实事件没有 reason 时，不得为了格式完整性伪造 / 补写虚假原因。

## P25-B2-08｜旧审计对象清单不得成为业务能力复活清单｜USER_APPROVED / APPLIED

R12 P11 / VR-P-037 等历史审计清单只能说明：
> 当时认为哪些行为应进入审计。

它们不能反向成为业务能力 Authority。

因此历史清单中出现的：
- Customer Merge；
- 独立 Recommendation qualification；
- 旧 Announcement frequency；
- 旧独立调价；
- 其他已被 completed-PDM Final supersede 的旧业务动作；

均只能按真实历史事实留存，不得因为“审计里有名字”重新创造 Current Action / permission / state machine / UI entry。

---

# 9. Batch 2 Reverse Conflict Scan

- `P25-B2-01～P25-B2-08 = PASS / USER_APPROVED / APPLIED`
- `REVERSE_CONFLICT_SCAN = PASS`
- `FALSE_DEPRECATION_COUNT = 0`
- `COMPLETED_PDM_HARD_CONFLICT = 0`
- `INCOMING_HANDOFF_GAP = 0`
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`
- 24 / 24 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- Final Closeout 前不得提前关闭 / source backwrite；
- `IA_LOWFI_ENGINEERING_CONSTRUCTION = NO`

# 10. Batch 3｜明确知情修改 / 后续明确新增｜PASS / USER_APPROVED / APPLIED

本批不重复 Batch 1 已冻结的通用审计 / 历史原则，只承接 completed-PDM 后续 Final 中才逐步明确形成的横切语义。

## P25-B3-01｜版本化配置区分 Current Version 与 Historical Version｜USER_APPROVED / APPLIED

当且仅当来源业务 Authority 本身已经定义“版本”语义时，PDM-25 统一其版本历史关系：

- 草稿 / 未生效版本；
- 当前生效版本；
- 历史版本；

必须能够区分。

新版本必须先满足来源业务的合法校验与启用 Guard，才能成为 current。

校验失败 / 保存失败：
- 不得替换当前有效版本；
- 不得把失败草稿伪装为 current。

新版本正式生效后：
- 旧版本退出 current；
- 旧版本及其历史仍保留；
- 已引用旧版本形成的业务 snapshot / 历史事实不得被新版本追改。

PDM-25 不要求所有普通配置强行建设 version state machine；没有来源 Authority 的配置版本模型，不由本域擅自新增。

## P25-B3-02｜失败 / 跳过 / 去重 / 无有效结果不得伪装成成功｜USER_APPROVED / APPLIED

当来源业务明确要求记录执行结果时，必须保留真实结果语义。

典型包括：
- 电话 latest 请求完成但未取得有效号码，不等于号码刷新成功；
- Matching recalc failure / retry 保留真实失败 / 重试结果；
- Notification 的 `SENT / FAILED / SKIPPED / DEDUPED / NOT_ALLOWLISTED` 必须区分；
- 高风险 Action 的 result / failure 必须反映真实执行结果。

统一原则：
> 请求被接收、任务被执行、worker 跑过或发生 retry，都不自动等于业务成功。

PDM-25 不因此把所有普通技术报错升级为高等级业务审计；是否需要正式 Audit / History 仍服从来源域。

## P25-B3-03｜合法批量操作保留逐对象结果与来源允许的 partial success｜USER_APPROVED / APPLIED

仅对来源 PDM 已经允许的批量 mutation 适用。

批量操作必须：
- 对每个对象独立重验 current Guard；
- 对每个对象保留独立成功 / 失败结果；
- 保留必要失败原因；
- 能关联原 batch / batch identity；
- 保留已经成功项的真实历史。

当来源业务明确允许 partial success 时：
- 已成功对象不得仅因其他对象失败而整体回滚；
- 未完成 / 失败对象保持待处理或失败事实；
- retry 只处理仍未闭环对象；
- 不得因为 retry 抹除原批次与已成功事实。

PDM-25 不据此给来源 PDM 明确不支持批量 mutation 的 Lock / Waitlist 等对象新增批量能力。

## P25-B3-04｜组合入口不得合并独立 domain action 的状态事实｜USER_APPROVED / APPLIED

UI / 员工体验层可以提供组合入口，但底层独立业务动作仍必须保持独立产品事实。

例如：
- Recommendation end 与 Priority release 可以有组合入口，但仍是两个独立 domain action；
- LockRequest approved 可以关联 `resulting_lock_id`；
- Lock conflict 可以关联 `resulting_waitlist_id`；
- Notification fact 可以关联其来源 business event。

统一要求：
- 不同 domain action 分别 Guard；
- 分别执行；
- 分别记录 result；
- 分别保留历史；
- 可以通过 correlation / related IDs 关联；
- 一个动作成功不得伪造另一个动作成功；
- “有关联”不等于共享状态机；
- “有关联”不等于互相授予 permission / entitlement / authority。

---

# 11. Batch 3 Conflict Isolation

- `P25-B3-01～P25-B3-04 = PASS / USER_APPROVED / APPLIED`
- `BATCH_3_CONFLICT_ISOLATION = PASS`
- `MISCLASSIFIED_PRODUCT_CHOICE = 0`
- `DUPLICATE_RULE_CREATION = 0`
- `NEW_BUSINESS_STATE_MACHINE = 0`
- `COMPLETED_PDM_HARD_CONFLICT = 0`
- `INCOMING_HANDOFF_GAP = 0`
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`
- 24 / 24 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- Final Closeout 前不得提前关闭 / source backwrite；
- `IA_LOWFI_ENGINEERING_CONSTRUCTION = NO`

# 12. Batch 4｜Final-gap Scan｜PASS / USER_APPROVED / APPLIED

本批只处理 Batch 1～3 后仍存在的真实语义缺口与局部产品选择，不新增第二套业务状态机。

## P25-B4-01｜审计保留动作发生当时的身份上下文｜CHOICE_1A / USER_APPROVED / APPLIED

稳定 `employee_id` 用于长期关联同一员工，但历史事件必须表达动作发生当时的身份上下文。

后续发生：
- 调店；
- 升职 / 降职；
- role 变化；
- permission 变化；
- data scope 变化；
- inactive / 离职；
- 再次入职；

都不得把旧审计事件动态改写成当前角色 / 当前门店 / 当前 scope。

因此重要 Audit / History 在来源域要求的范围内，应能够回看：
- actor stable identity；
- 当时 role / identity context；
- 当时适用组织 / 门店上下文；
- 当时适用 permission / data scope / object context（来源域需要时）。

当前权限仍用于“现在是否允许查看这条审计 / 历史”，但不得反向改写“当时以什么身份发生”。

## P25-B4-02｜统一业务时区不等于把所有时间事实压成一个 timestamp｜CHOICE_2A / USER_APPROVED / APPLIED

`Asia/Shanghai（UTC+8）` 统一的是：
- 业务自然日；
- “当天 / 每日 / 跨日”边界；
- 业务展示与横切时间解释。

它不意味着不同语义的时间事实可以合并。

来源域已经区分的时间继续分别保真，例如：
- `listing_started_at`；
- JYT `first_seen_at`；
- 人工上传 / 创建时间；
- 外部 source time；
- 系统 received / synced time；
- created_at；
- expires_at / deadline；
- Notification planned time / actual sent time；
- Announcement actual display fact。

统一规则：
- 系统自身正式 mutation / Audit Event 的 Authority time 以可信后台 / 服务端事实为准，不以客户端本地时钟作为最终业务 Authority；
- 外部来源提供的真实 source time 继续作为来源事实保留；
- source time 与系统 received / first_seen / processed time 不得互相冒充；
- 不得把 JYT `first_seen_at` 伪称为上游真实上传时间；
- planned / actual、created / expired、source / received 等，只要来源域定义为不同事实，就继续分离；
- UTC+8 业务展示 / 边界解释不得追改原始来源时间事实。

PDM-25 不规定数据库 timestamp 的物理存储格式。

## P25-B4-03｜幂等 / retry-safe 不制造重复业务成功历史｜CHOICE_3A / USER_APPROVED / APPLIED

同一个实际业务 mutation 在幂等重试、重复点击、网络 retry、worker retry 或重复消费下：

> 只能形成与真实业务结果一致的一次正式成功业务事实。

不得因为多次 attempt 伪造：
- 第二次 Transaction 成功；
- 第二次 Lock；
- 第二次额度扣减；
- 第二次 Recommendation；
- 第二次 Refund；
- 其他实际只成功一次的业务状态变化。

如果来源业务要求记录 attempt / retry / duplicate / failure：
- 可以分别保留 attempt 事实；
- 必须能关联到同一实际 business mutation / correlation；
- “尝试了多次”与“业务成功了多次”必须分离。

PDM-25 只冻结该产品结果，不规定 idempotency key、unique index、MQ dedupe、transaction framework 等实现。

## P25-B4-04｜业务历史永久真实性与技术日志 retention 分离｜CHOICE_4A / USER_APPROVED / APPLIED

采用 4A：

> **PDM-25 不规定全局统一固定保存天数，也不要求所有 Audit Event 永久热存储。**

统一边界：

1. 来源 completed-PDM 已明确要求“永久保留 / 不物理删除 / append-only / terminal history preserved”的业务历史事实，继续保持其产品级永久真实性；
2. 普通业务后台不得自行修改、覆盖、删除真实 Audit / History；
3. PDM-25 不新增统一 180 天 / 1 年 / 3 年 / 永久等 Audit Log retention 数值；
4. 技术日志、运行日志、冷热分层、归档方式、具体 retention implementation 留 Engineering / 合规策略；
5. 任何未来 retention / archive 实现，都不得破坏来源域已经冻结的永久业务历史事实与可追溯关系；
6. “技术日志可按策略归档 / 清理”不得被解释为“可以删除来源域要求长期存在的业务历史”。

---

# 13. Batch 4 Final-gap Scan 结果

- `P25-B4-01～P25-B4-04 = PASS / USER_APPROVED / APPLIED`
- `CHOICES = 1A / 2A / 3A / 4A`
- `FINAL_GAP_SCAN = PASS`
- `COMPLETED_PDM_HARD_CONFLICT = 0`
- `NEW_BUSINESS_STATE_MACHINE = 0`
- `SEMANTIC_DETAIL_GAP_UNRESOLVED = 0`
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`
- `INCOMING_HANDOFF_GAP = 0`
- 24 / 24 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- PDM-25 Final Closeout 前不得提前关闭 / source backwrite；
- `IA_LOWFI_ENGINEERING_CONSTRUCTION = NO`

# 14. 当前唯一下一步

> **PDM-25 Final 前完整性复核（Prefinal Integrity）。**
