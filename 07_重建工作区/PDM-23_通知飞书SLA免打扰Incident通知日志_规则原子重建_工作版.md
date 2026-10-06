# PDM-23｜通知 / 飞书 / SLA / 夜间免打扰 / Incident / 通知日志｜规则原子重建工作版

> 当前状态：`IN_PROGRESS / STARTUP_GATE_PASS / BATCH_1_PASS / BATCH_2_PASS / BATCH_3_PASS / BATCH_4_PENDING_USER_REVIEW`  
> 核心定位：`P23-R00 = USER_APPROVED / APPLIED`  
> Incoming Handoff：10 / 10 `HANDOFF_ACCEPTED`  
> IA / Low-Fi / Engineering：`NO_CONSTRUCTION`

---

# 1. P23-R00｜核心定位｜USER_APPROVED / APPLIED

PDM-23 是：

> **通知 / 飞书 / 主动提醒 / 夜间免打扰 / Incident 通知投递 / 通知日志的唯一 Authority。**

PDM-23 负责：

- 把 completed-PDM 已经成立的业务事件消费为合法通知事件；
- 维护主动通知 allowlist；
- 决定合法通知渠道与员工飞书接收路由；
- 承载夜间免打扰 / quiet-hours 的投递规则；
- 承载发送前事件有效性重验、频控、去重；
- 承载 SENT / FAILED / SKIPPED / DEDUPED 等通知投递结果；
- 承载通知日志与必要的 Incident / 恢复通知投影；
- 承载 deep-link 回员工端 / PC 后的安全重新校验边界。

PDM-23 **不是业务状态层**。

以下业务真相必须继续读取对应 completed-PDM Authority：

- Vehicle / listing / supply anomaly；
- Publisher Phone / Collector runtime；
- Recommendation；
- Consultation / first-response SLA；
- CRM / Follow-up / Public Pool；
- LockRequest / Lock / Waitlist；
- Deposit / Transaction / Refund / correction；
- Employee identity / permission / data scope；
- PDM-22 已冻结的 SLA / 首次跟进 / Lock 到期提醒等业务配置值。

通知成功、失败、跳过、去重、延迟或恢复发送：

> **均不得创建、改写、回滚或伪造底层业务对象的主状态、负责人、deadline、owner、Lock、Transaction、Refund、Recommendation、visibility、price-right 等事实。**

---

# 2. Startup Gate｜PASS

## 2.1 Current Authority Refresh

已重新读取并对齐：

- 9/19 R12《PC 后台 / 配置 / 通知 / 审计》中的 P09 通知 / 飞书 / 提醒策略；
- PDM-04 / PDM-09 / PDM-14 / PDM-15 / PDM-16 / PDM-17 / PDM-18 / PDM-19 / PDM-21 / PDM-22 正式 Final；
- Current IA / Page Manifest / Action / State 中 P09-01～P09-04 carrier；
- CROSS_PDM_HANDOFF_REGISTER 中 target=PDM-23 的全部 handoff。

结果：

- `COMPLETED_PDM_HARD_CONFLICT = 0`
- `INCOMING_HANDOFF_GAP = 0`
- `INCOMING_HANDOFF_COUNT = 10`
- `INCOMING_HANDOFF_ACCEPTED = 10`
- `GLOBAL_INVARIANT_CONFLICT = 0`
- `IA_LOWFI_ENGINEERING_CONSTRUCTION = NO`

## 2.2 Incoming Handoff｜10 / 10 ACCEPTED

1. `HO-P04-P23-001`｜JYT / Supply Anomaly Incident、飞书、SLA、DND、通知与异常日志；不得把通知层变成 Vehicle 状态机。
2. `HO-P09-P23-001`｜Collector / 电话链路 incident、异常 / 恢复通知、运行事件；不得重定义 publisher 当前电话 / cache 状态。
3. `HO-P14-P23-001`｜Recommendation create/end/void 不自动扩展成客户微信主动消息状态机；通知失败不得回滚 Recommendation / visibility / price-right。
4. `HO-P15-P23-001`｜新 Consultation 与 SLA timeout allowlist；DND 不暂停 SLA 业务计时；投递结果不改 Consultation / assignee / first-response / deadline。
5. `HO-P16-P23-001`｜CRM 待办 / 回访提醒 / 未来跟进计划的通知渠道、频控、DND、失败/跳过/去重；Opportunity / Source Radar 不默认逐条飞书。
6. `HO-P17-P23-001`｜待公海与领取后首次跟进提醒的渠道与投递日志；通知结果不得改 owner / 公海 / Collaboration。
7. `HO-P18-P23-001`｜LockRequest 多结果、自动 Waitlist、Lock 即将到期等通知 carrier；不得恢复固定 30 分钟。
8. `HO-P19-P23-001`｜Transaction / Refund 关键状态变化、supply anomaly 等通知；投递结果不得改资金 / 交易事实。
9. `HO-P21-P23-001`｜员工端工作台通知投影与 deep-link Guard；打开通知 / 详情不得误算 Consultation first response。
10. `HO-P22-P23-001`｜消费 PDM-22 的 SLA / 首次跟进 / Lock 到期提醒业务配置值；P23 负责 allowlist、渠道、飞书、DND、频控、去重、失败 / skipped 日志。

## 2.3 Completed-PDM Dependency Card

| 依赖 PDM | PDM-23 消费对象 | PDM-23 可决定 | PDM-23 不可改写 |
|---|---|---|---|
| PDM-02 | Employee / permission / inactive | 通知配置与接收路由的权限裁剪 | employee_id / role / permission / scope |
| PDM-04 | Supply Anomaly / Vehicle | 异常与恢复通知投影 | Vehicle / listing / anomaly 业务事实 |
| PDM-09 | Publisher / Collector runtime | incident / recovery 通知与日志 | publisher phone / cache / latest Authority |
| PDM-14 | Recommendation | 是否存在明确 allowlist 通知 | Recommendation / visibility / price-right |
| PDM-15 | Consultation / first-response SLA | 新咨询 / timeout 通知投递 | Consultation 状态 / assignee / deadline / first response |
| PDM-16 | CRM / Follow-up / Opportunity / Radar | 合法提醒渠道与投递 | CRM Stage/Tag/Follow-up 与 Opportunity/Radar 语义 |
| PDM-17 | Public Pool | 首次跟进等已批准提醒的投递 | owner / public-pool / Collaboration |
| PDM-18 | LockRequest / Lock / Waitlist | 合法通知与到期提醒投递 | Lock/Waitlist lifecycle / expires_at |
| PDM-19 | Transaction / Refund | 关键交易资金通知 | Deposit / Transaction / Refund / correction |
| PDM-21 | Employee UI | deep-link / 通知投影 | E01 urgency 排序 / 业务动作真相 |
| PDM-22 | Notification-related config values | 发送时消费配置 | SLA / reminder 业务配置 Authority |

## 2.4 Global Invariant Gate

PDM-23 全程必须保持：

1. **业务事实 SSOT 在业务域，通知层只消费事件。**
2. 通知成功 / FAILED / SKIPPED / DEDUPED 不得改变业务状态。
3. timeout 不是 Consultation 第五主状态。
4. DND 只影响主动投递，不暂停业务时钟、SLA、Incident 或审计事实。
5. 发送前重新校验 event validity、DND 与接收对象当前有效性。
6. deep-link 打开业务页面后必须重新校验 current identity + permission/capability + data scope + object state。
7. 打开通知 / 页面本身不得伪造真人业务动作或 first-response。
8. 非 allowlist 事件不得因为“有用”自动升级为主动通知。
9. System Admin 身份本身不自动获得员工业务通知配置 / 业务处理权。
10. IA / Low-Fi 当前只是 carrier；与 completed Final 冲突时标 stale，不反向覆盖 Final。
11. 队列、MQ、持久化表结构、具体重试实现、供应商 SDK 属于 Engineering。
12. 本阶段不修改 IA / Low-Fi / Engineering。

## 2.5 Current Implementation Fact

Current IA 已存在：

- `P09-01｜员工飞书映射`；
- `P09-02｜飞书大群 / 服务 SLA`；
- `P09-03｜夜间免打扰`；
- `P09-04｜通知日志 / 失败记录`；
- `NOTIFICATION_SENT / FAILED / SKIPPED / DEDUPED`；
- `NOTIFICATION_NOT_ALLOWLISTED / DND_RECHECK_PENDING`；
- incident cadence 仅在已配置时展示。

但：

> **carrier 存在 ≠ 当前产品规则已经正确工程实现。**

当前仍不得把 Current IA 直接视为已验收工程事实。

## 2.6 已识别但不在 Startup Gate 偷渡裁决的项

以下进入 Batch 2 / 3 / 4 或 Final 前完整性复核：

- R12 较早的主动通知 allowlist 与 PDM-18 / PDM-19 后续新增 LockRequest / Refund 等事件需要统一收口；
- “咨询 SLA 超时大群告警”的接收范围 / 路由要与当前 employee / group 配置边界统一；
- Incident 精确告警 cadence 没有冻结默认值，不得由 Current IA 发明；
- Recommendation 不自动建立客户微信主动消息体系；
- Queue retry / MQ / persistence / provider implementation 仍属 Engineering；
- Current IA 的 P09 carrier 后续只做 stale / alignment 记录，本阶段不施工。

---

# 3. Batch 1｜稳定通知规则｜PASS / USER_APPROVED / APPLIED

## P23-A01｜Notification 只消费业务事件

Notification 是投递层事实，不是第二套业务状态机。

任何发送结果不得：

- 改写业务主状态；
- 改 owner / assignee / responsible；
- 改 deadline / expires_at；
- 创建 / 取消 Lock；
- 创建 / 回滚 Transaction / Refund；
- 改 Recommendation / visibility / price-right。

## P23-A02｜主动通知必须来自明确 allowlist

只有 completed-PDM Authority 或 PDM-23 已批准 allowlist 中的事件可以主动通知。

非 allowlist：

> `NOTIFICATION_NOT_ALLOWLISTED`

不得因为“看起来有用”自动扩张。

## P23-A03｜Employee 飞书映射绑定 employee_id

维护：

> `employee_id ↔ 当前飞书接收身份`

员工更换飞书账号：

- 只更新当前通知路由；
- 不改变 employee_id；
- 不改变 Customer owner；
- 不改变业务负责人；
- 必要历史进入审计。

## P23-A04｜Employee inactive 后停止新的个人通知

Employee inactive 后：

- 不再向旧飞书身份发送新的个人业务通知；
- 已发生业务事实不因此改变；
- 责任交接继续服从对应 completed-PDM Authority。

## P23-A05｜当前明确主动通知事件集合

当前可进入员工 / 飞书主动通知候选的业务事件包括：

- 新 Consultation；
- Consultation 首次响应 SLA timeout；
- 公海领取后首次跟进提醒；
- LockRequest 已批准 / 已拒绝 / 已过期 / LOCK_CONFLICT / CLOSED_NOT_LOCKABLE；
- 自动形成 Waitlist 的必要结果提醒；
- Waitlist 对应车辆释放；
- 已启用配置下的 Lock 即将到期；
- supply anomaly；
- Transaction created / completed / cancelled / corrected 等重要变化；
- Refund pending / refunded / closed 等关键变化；
- 当前仍有效的上游 / Collector incident 告警与恢复通知。

是否实际发送仍须经过：

> allowlist + recipient + channel + DND + event validity + frequency/dedupe

## P23-A06｜普通浏览 / Matching / Opportunity / Radar 不逐条主动推送

默认不主动通知：

- 普通浏览 / 点击 / 埋点；
- 普通资料 / 价格更新；
- 普通 Matching 结果变化；
- Customer Opportunity；
- 普通 Source Radar 变化；
- 普通责任变化；
- Recommendation create/end/void 本身的客户微信主动通知。

若未来要新增，必须有明确产品 Authority，不得由通知层自行扩张。

## P23-A07｜Recommendation 不建立客户微信主动消息状态机

V1 不因为 Recommendation 本身建立：

- 客户微信订阅消息主状态；
- “发送成功 / 失败”驱动 Recommendation 的状态机；
- 通知失败后的 Recommendation rollback。

普通 share / Recommendation 的客户可见性与 price-right 继续服从 PDM-14 / PDM-20。

## P23-A08｜通知渠道与业务事件分离

“业务需要提醒”不等于“必须飞书”。

同一 allowlist 事件可以由当前产品批准的合法渠道承载；PDM-23 负责渠道与路由，业务域只定义事件事实。

公海 / CRM 提醒不得因为存在 reminder 自动升级为飞书强通知，除非当前 allowlist / 配置明确允许。

## P23-A09｜夜间免打扰当前基线

当前 quiet hours：

> **23:00 ～ 次日 08:30，后台可配置。**

夜间：

- 业务继续运行；
- SLA 继续计时；
- Incident / 日志继续产生；
- 主动通知投递暂停。

## P23-A10｜DND 恢复后必须重判事件有效性

免打扰结束后：

- 不机械补发全部积压通知；
- 重新判断事件是否仍有效；
- 已解决 / 已失效 / 已不需要提醒 → SKIPPED；
- 仍重要且合法 → 再进入投递判断。

## P23-A11｜Consultation SLA 只消费既有 deadline

PDM-23 不重新计算 Consultation SLA。

当前：

- SLA 业务规则与 first-response fact 归 PDM-15；
- SLA 默认值 / 配置值归 PDM-22；
- Consultation 创建时已固化 deadline；
- PDM-23 只消费当前 deadline / timeout 事实做提醒 / 告警。

timeout 不改变 Consultation 主状态。

## P23-A12｜Consultation SLA timeout 大群告警可保留

当前已冻结：

> Consultation 首次响应 SLA timeout 可进入飞书大群告警。

但：

- 具体接收群 / 路由必须读取当前合法配置；
- 不因大群告警改变 assignee；
- 不因发送失败改变 SLA / Consultation；
- 打开告警链接不算 first response。

## P23-A13｜公海首次跟进提醒不自动收回 Customer

领取后首次跟进超时：

- 只形成提醒 / 通知候选；
- 不自动重新进入公海；
- 不自动改 owner；
- 不自动结束 / 新建 Collaboration。

是否已满足跟进继续读取 PDM-16 / PDM-17 的真实 Follow-up / public-pool 事实。

## P23-A14｜Lock 到期提醒不恢复固定 30 分钟

Lock 即将到期提醒：

- 是否启用；
- 提前量；

读取 PDM-22 当前有效配置。

PDM-23 不写死：

> “提前 30 分钟”。

通知行为不得修改 `Lock.expires_at`。

## P23-A15｜Incident / Recovery 只消费真实运行事实

JYT / Supply Anomaly / Collector / 电话链路 incident：

- 当前 incident 成立 → 可按 allowlist 告警；
- 当前 incident 恢复 → 可发送恢复通知；
- 通知层不得把“无有效号码”“latest failed”“缓存存在”等事实重新解释成新的 publisher 状态；
- Incident 精确告警 cadence 只有明确配置后才生效，不设置产品层臆造默认值。

## P23-A16｜投递结果只进入 Notification 事实 / 日志

至少区分：

- SENT；
- FAILED；
- SKIPPED；
- DEDUPED；
- NOTIFICATION_NOT_ALLOWLISTED。

这些结果只描述通知投递，不代表对应业务成功 / 失败。

## P23-A17｜通知 deep-link 必须重新鉴权

通知进入 E01 / E06 / E07 / PC 等业务页面时：

- 重新校验当前 identity；
- permission / capability；
- data scope；
- object state；
- account state（适用时）。

旧通知链接不携带永久业务授权。

## P23-A18｜打开通知不构成真人业务响应

以下都不得自动记为 Consultation first response：

- 收到通知；
- 点击通知；
- 打开业务详情；
- 页面已读；
- 查看 Customer / Vehicle。

首次人工响应继续按 PDM-15 的真实业务响应事实判定。

## P23-A19｜Notification Log 最低记录集

通知日志至少记录：

- 业务事件类型；
- 业务对象 / 必要关联标识；
- 接收对象；
- 接收路由 / 渠道；
- 当前投递阶段；
- 计划 / 实际发送时间；
- SENT / FAILED / SKIPPED / DEDUPED 等结果；
- 必要失败 / 跳过 / 去重原因；
- DND / event-validity 重判结果。

通知日志不得变成第二套业务审计 Authority。

## P23-A20｜队列与自动重试属于 Engineering

PDM-23 只冻结产品约束：

- 若工程实现自动重试，每次重试必须重新判断 allowlist、event validity、recipient validity、DND / frequency / dedupe；
- 自动重试不得改写业务对象；
- MQ、队列结构、重试次数、退避算法、provider SDK、持久化结构留 Engineering。

---

# 4. Batch 1 Gate｜PASS

当前：

- `P23-A01～P23-A20 = PASS / USER_APPROVED / APPLIED`
- `COMPLETED_PDM_HARD_CONFLICT = 0`
- `INCOMING_HANDOFF_ACCEPTED = 10 / 10`
- `IA_LOWFI_ENGINEERING_CONSTRUCTION = NO`

当前唯一下一步：

> **P23-A01～P23-A20 已全部批准并执行；进入 Batch 2 Reverse Conflict Scan。**
---

# 5. Batch 2｜旧规则反向冲突扫描｜PASS / USER_APPROVED / APPLIED

> 扫描对象：R12 历史风险项、Current IA / Low-Fi P09 carrier、PDM-04/09/14/15/16/17/18/19/21/22 Final，以及历史通知口径。  
> 原则：只废弃已被 completed-PDM 或 P23 Batch 1 明确替代的旧口径，不把新产品选择偷渡成“清理”。

## P23-B2-01｜废弃“通知失败 = 业务失败 / 业务状态变化”

不得恢复：

- 飞书发送失败导致 Consultation / Lock / Transaction / Refund / Recommendation 状态失败；
- SKIPPED / DEDUPED 被解释成业务未完成；
- 通知恢复成功反向把业务对象改成“恢复”。

当前：

> 通知投递结果只属于 Notification fact / log；业务事实继续由对应业务域 Authority 决定。

## P23-B2-02｜废弃“Consultation timeout = 第五主状态 / 自动关闭”

不得恢复：

- timeout 作为 Consultation 主状态；
- SLA 超时自动 resolved / invalid / close；
- SLA 告警成功后改变 Consultation lifecycle。

当前：

> timeout 只是 deadline 派生事实 / 提醒条件。

## P23-B2-03｜废弃“所有提醒 = 必须飞书”

不得把“业务层要求提醒”直接实现为“必须发送飞书”。

尤其：

- CRM 回访提醒；
- 公海待处理 / 首次跟进提醒；
- 其他业务待办。

当前必须继续区分：

> reminder business fact ≠ notification channel。

## P23-B2-04｜废弃固定“Lock 到期前 30 分钟提醒”

旧 fixed 30 分钟不得恢复。

当前：

- 是否提醒；
- 提前量；

读取 PDM-22 当前有效配置；P23 只负责合法投递。

## P23-B2-05｜废弃普通 Matching / Opportunity / Source Radar 逐条主动推送

不得恢复：

- 每个普通 Match Result 都飞书；
- 每个 Customer Opportunity 都个人飞书；
- 普通 Source Radar 变化自动强通知；
- 普通资料 / 价格 / 映射 / owner 变化逐条主动推送。

除非未来有新的明确 allowlist Authority。

## P23-B2-06｜废弃 Recommendation 自动微信主动消息状态机

不得因为 Recommendation create / end / void：

- 自动建立客户微信订阅消息状态；
- 建立 sent / failed 驱动的 Recommendation 子状态机；
- 因通知失败 rollback Recommendation / visibility / price-right。

## P23-B2-07｜废弃“DND 暂停业务时钟 / SLA / Incident”

quiet hours 只暂停主动通知投递。

不得暂停：

- Consultation SLA 正常计时（PDM-15 的 Customer disable hold 特例除外）；
- Lock expires_at；
- Transaction / Refund 事实；
- Incident 事实；
- 审计 / 通知日志时间。

## P23-B2-08｜废弃“DND 结束后机械补发全部积压消息”

恢复发送时必须重新校验：

- event validity；
- recipient validity；
- allowlist；
- DND / frequency / dedupe。

已失效事件应 SKIPPED，不机械补发。

## P23-B2-09｜废弃“通知 deep-link 自带永久业务授权”

不得因为用户能打开通知链接就：

- 绕过 current permission / capability；
- 绕过 data scope；
- 绕过 object / account state；
- 继续使用已经撤销的旧员工权限。

deep-link 只是入口，不是授权票据。

## P23-B2-10｜废弃“点击 / 已读通知 = Consultation 首次人工响应”

收到、点击、打开、已读、查看 Customer / Vehicle：

> 均不得自动写 first-response fact。

Consultation first response 只读取 PDM-15 真实人工响应 Authority。

## P23-B2-11｜废弃未配置的 Incident 默认告警 cadence

不得由 IA / P23 自行发明：

- 每 5 分钟；
- 每 10 分钟；
- 每 30 分钟；
- 每小时；
- 或其他固定 Incident 重复告警频率。

只有明确配置存在时才执行对应 cadence。

## P23-B2-12｜废弃产品层写死 MQ / 重试次数 / 退避 / Provider SDK

不得把以下工程实现升级成 PDM-23 产品规则：

- MQ / Queue 选型；
- 自动重试固定次数；
- backoff 算法；
- provider SDK；
- notification table 物理结构；
- worker topology；
- 存储周期。

PDM-23 只冻结业务约束：任何重试都必须重新校验 allowlist / event / recipient / DND / frequency / dedupe，且不得改写业务对象。

## P23-B2-13｜废弃“System Admin 因后台身份自动拥有 Notification Config 权”

P09 位于 PC / admin 区域，不代表 System Admin 身份自动获得通知业务配置权。

当前：

- 读取 PDM-02 / PDM-22 已冻结 identity + permission/capability + data/config scope；
- active Employee 若具明确配置能力可操作合法范围；
- System Admin 只有在对应 Authority 明确授予时才能执行相关业务配置，不因控制平面身份自动获得。

## P23-B2-14｜废弃“飞书映射变更 = Employee / owner / assignee 变更”

修改：

> `employee_id ↔ 当前飞书接收身份`

只改变通知路由。

不得因此修改：

- employee_id；
- Customer owner；
- Consultation assignee；
- Lock / Transaction responsible；
- 历史 actor / responsibility。

---

# 6. Batch 2 Gate｜PASS

当前：

- `P23-B2-01～P23-B2-14 = PASS / USER_APPROVED / APPLIED`
- `REVERSE_CONFLICT_SCAN = PASS`
- `FALSE_DEPRECATION_COUNT = 0`
- `COMPLETED_PDM_HARD_CONFLICT = 0`
- `INCOMING_HANDOFF_ACCEPTED = 10 / 10`
- `IA_LOWFI_ENGINEERING_CONSTRUCTION = NO`

当前唯一下一步：

> **P23-B2-01～P23-B2-14 已全部批准并执行；进入 Batch 3 配置 / 路由 / 日志完整性扫描。**
---

# 7. Batch 3｜配置 / 路由 / 日志完整性扫描｜PASS / USER_APPROVED / APPLIED

> 本批只补已经存在于 R12 / Current P09 carrier / completed-PDM handoff 的稳定语义。  
> 不新增通知模板中心、不新增客户消息中心、不臆造未冻结的收件人矩阵或固定告警频率。

## P23-B3-01｜Notification Config 必须使用独立配置 Guard

P09 通知配置写操作必须读取当前：

- active Employee identity；
- 明确 Notification Config permission / capability；
- data / config scope；
- config object state。

不得：

- 因页面位于 PC / admin 自动获得；
- 复用车型映射等无关 permission；
- 把 System Admin 控制平面身份直接等同通知业务配置权。

## P23-B3-02｜通知配置提交时必须重新校验

飞书映射、DND、可配置 SLA / reminder carrier 等通知域写操作：

> 提交时重新验证 current identity + permission/capability + scope + config state。

旧页面、旧登录态、旧缓存不得延续已撤销配置能力。

## P23-B3-03｜发送时使用“当前有效接收路由”

个人员工通知发送时：

- 根据业务事件中的合法责任上下文解析当前接收人；
- 再读取该 employee_id 当前有效飞书接收身份；
- Employee inactive / 当前映射失效时不得继续向旧身份发送新的个人业务通知。

历史映射只留必要审计，不作为新的当前发送路由。

## P23-B3-04｜飞书映射本身不授业务内容访问权

某 employee_id 存在飞书映射：

> 只表示该员工存在当前通知路由。

它不意味着：

- 自动拥有对应 Customer / Vehicle / Consultation / Lock / Transaction 查看权；
- 自动成为 owner / assignee / responsible；
- deep-link 可以绕过当前业务 Guard。

## P23-B3-05｜群通知路由必须读取当前合法配置

Consultation SLA timeout 等允许群告警的事件：

- 只有当前存在合法群 / 路由配置时才发送对应群通知；
- 不由 PDM-23 写死具体群 ID、群名称或成员；
- 群配置变化只影响后续投递，不追改已发生业务事实。

## P23-B3-06｜DND 使用发送时当前有效配置

quiet-hours 属于投递策略：

- 当前基线 23:00～08:30，可配置；
- 每次实际发送 / 重试前读取当前有效 DND；
- 修改 DND 不追改业务 deadline / expires_at / incident created_at；
- 也不重写已经完成的历史通知结果。

## P23-B3-07｜DND 期间日志与业务事件继续存在

进入 DND 后：

- 当前业务事件照常成立；
- Notification 可以记录“等待重判 / 当前未发送”等必要投递事实；
- SLA / incident / business clock 照常运行；
- 不能把“暂不发送”写成业务取消或业务完成。

## P23-B3-08｜发送前 Event Validity 必须重新验证

实际投递前至少重新判断：

- 原业务事件是否仍存在；
- 是否仍需要主动提醒；
- 接收对象是否仍有效；
- allowlist 是否仍允许；
- DND / frequency / dedupe 是否允许当前发送。

事件已经 resolved / ended / invalidated 时，不得只因早先进入队列就机械发送。

## P23-B3-09｜Incident Recovery 必须来源于真实恢复事实

“恢复通知”只能消费：

> 对应运行 / 供应 / Collector 域已经确认的真实 incident recovery / cleared fact。

不得因为：

- 一次通知发送成功；
- 一次探测偶然成功；
- 某条日志状态变化；

自行把底层 incident 判定为 recovered。

## P23-B3-10｜Notification Log 与业务审计分层

P09 Notification Log 记录投递事实；PDM-25 统一审计负责跨域 mutation / history 标准。

因此：

- Notification Log 不成为 Vehicle / Consultation / Lock / Transaction 的第二套业务历史；
- 业务对象真相仍回到对应 Domain；
- 通知配置 before / after / actor / time 等统一审计标准继续由 PDM-25 承接；
- 日志物理存储周期仍属 Engineering。

## P23-B3-11｜FAILED / SKIPPED / DEDUPED 必须有可解释原因

通知日志不能只留一个结果枚举。

对适用结果应保留必要原因，例如：

- provider / send failure；
- recipient unavailable / inactive；
- DND；
- event no longer valid；
- not allowlisted；
- frequency limited；
- deduped。

具体错误码体系、provider code 映射留 Engineering。

## P23-B3-12｜通知日志不能泄露不必要敏感业务内容

通知日志只保留投递诊断所需的业务关联标识与必要上下文。

不得因为“方便排查”自动复制：

- Customer 完整手机号；
- 不必要的 Deposit / Transaction 敏感金额；
- internal price；
- 上游电话明文；
- 其他超出当前查看权限的业务敏感内容。

查看通知日志本身仍需 current permission + scope。

## P23-B3-13｜通知配置变化只影响后续投递

包括：

- 飞书映射；
- DND；
- incident cadence；
- 群 / 路由；
- 其他已批准通知配置。

修改后：

- 不改写过去 SENT / FAILED / SKIPPED / DEDUPED 历史；
- 不追改业务对象；
- 对尚未实际发送的候选事件，在下一次发送判断时读取当前有效配置并重验。

## P23-B3-14｜Incident cadence 只有“配置存在”时才成为当前事实

P09 可以展示：

- `INCIDENT_CADENCE_CONFIGURED`；
- `CADENCE_NOT_CONFIGURED`。

但 PDM-23 不定义未获批准的默认间隔。

若未配置：

> 不得由 IA / Engineering 自行填一个“看起来合理”的重复告警频率。

## P23-B3-15｜通知渠道选择不得创造业务硬依赖

飞书、员工工作台、PC 提醒等是投递 carrier。

若某渠道失败 / 不可用：

- 不得让对应业务 mutation 失败；
- 不得回滚已经成立的业务事实；
- 是否存在其他合法渠道可继续投递，按当前 allowlist / routing config 判断。

## P23-B3-16｜客户侧主动消息继续默认关闭，除非已有明确 Authority

当前没有来源支持把 PDM-23 扩展成通用客户消息中心。

因此默认：

- 不新增通用客户消息 inbox；
- 不新增已读 / 未读业务状态机；
- 不因员工飞书通知事件自动生成客户微信消息；
- 已有公告 / share / Customer Safe Projection 继续归对应 completed-PDM Authority。

---

# 8. Batch 3 Gate｜PASS

当前：

- `P23-B3-01～P23-B3-16 = PASS / USER_APPROVED / APPLIED`
- `SEMANTIC_COMPLETENESS_SCAN = PASS_WITH_PENDING_REVIEW`
- `NEW_PRODUCT_CHOICE_INTRODUCED = 0`
- `COMPLETED_PDM_HARD_CONFLICT = 0`
- `INCOMING_HANDOFF_ACCEPTED = 10 / 10`
- `IA_LOWFI_ENGINEERING_CONSTRUCTION = NO`

当前唯一下一步：

> **P23-B3-01～P23-B3-16 已全部批准并执行；进入 Batch 4 / Final-gap scan。**
---

# 9. Batch 4｜Final-gap / 产品边界扫描｜PENDING_USER_REVIEW

> 结果：未发现新的 completed-PDM hard conflict；发现 1 个真实产品承载选择 + 5 个稳定收口项。  
> 本批目标是让 PDM-23 可以进入 Final 前完整性复核，而不是扩建新的消息平台。

## P23-B4-01｜是否建设“通用通知模板 / 按事件渠道矩阵”｜产品选择

当前来源只明确：

- allowlist；
- employee_id ↔ 飞书接收身份；
- SLA timeout 群告警；
- DND；
- incident cadence（仅已配置时）；
- 通知日志；
- reminder business fact 与 channel 分离。

当前来源**没有**冻结：

- 任意事件都可配置短信 / 微信 / 飞书 / App / PC 的通用 channel matrix；
- 通用消息模板编辑器；
- 按业务事件自定义标题 / 正文 / 参数模板；
- 通用客户消息中心。

### A｜推荐

V1 **不建设通用通知模板中心 / 通用按事件渠道矩阵**。

只保留当前已批准 carrier：

- 员工飞书映射；
- 合法群 / 路由配置；
- DND；
- 已批准 reminder / incident cadence；
- allowlist；
- 通知日志。

若某业务事件未来要新增渠道，必须经过对应产品 Authority 明确批准，再由 PDM-23 承接投递。

### B

V1 建设统一“通知策略中心”，允许每种业务事件自行配置多个渠道、模板、频率和接收组。

风险：

- 会显著扩大 PDM-23 范围；
- 容易把“提醒业务事实”与“通知渠道”重新耦合；
- 需要新增大量当前来源没有定义的权限、模板、版本和审计语义。

**推荐：1A。**

## P23-B4-02｜个人通知接收人按当前业务责任事实解析｜稳定收口

对“个人员工通知”：

- PDM-23 不维护第二套通知 owner / assignee；
- 按业务事件来源对象的当前合法责任事实解析目标 Employee；
- 再读取该 employee_id 当前有效接收路由；
- 如果来源业务域没有合法个人接收人，PDM-23 不得凭空指定一个员工。

这不改变 Customer owner / Consultation assignee / Lock / Transaction responsible。

**建议：2同意。**

## P23-B4-03｜无合法接收路由时只形成通知结果，不改派业务责任｜稳定收口

当：

- Employee inactive；
- 飞书映射缺失 / 失效；
- 群路由未配置；
- 当前业务事件没有合法接收人；

PDM-23 可以记录 FAILED / SKIPPED / recipient unavailable 等通知事实。

但不得：

- 自动改 owner；
- 自动转派 Consultation；
- 自动 handoff Lock / Transaction；
- 自动把业务升级给某个职位名称。

真实责任交接继续走对应 completed-PDM Authority。

**建议：3同意。**

## P23-B4-04｜DND 不设置“紧急事件自动绕过”隐藏规则｜稳定收口

当前 Authority 明确：

> quiet hours 暂停主动通知，业务 / SLA / incident / 日志继续运行。

因此 V1 不额外发明：

- supply anomaly 自动绕过 DND；
- Transaction 自动绕过 DND；
- SLA timeout 自动绕过 DND；
- “高优先级”通知无条件夜间强推。

如果未来需要某事件绕过 DND：

> 必须作为新的明确产品规则 / 配置获得批准。

**建议：4同意。**

## P23-B4-05｜DND / Notification 时间统一按业务时区解释，并交 PDM-25 收口｜稳定收口

Current carrier 已使用服务端 UTC+8 业务时间语义；PDM-22 已将统一时区规范交 PDM-25。

PDM-23 当前只要求：

- DND 起止时间按统一业务时区解释；
- 计划发送 / 实际发送 / event created / retry 等时间必须可比较；
- 不由客户端本地时区随意改变 quiet-hours 判断；
- 最终统一 timezone / timestamp / history 标准由 PDM-25 收口。

**建议：5同意。**

## P23-B4-06｜登记 PDM-23 → PDM-25 outgoing handoff｜稳定缺口

PDM-23 应正式向 PDM-25 交接：

- Notification config before / after / actor / time；
- employee_id ↔ 飞书接收身份变更历史；
- DND / 群路由 / incident cadence 配置历史；
- Notification Log 的统一时间字段 / 历史检索标准；
- 业务事件与 Notification fact 的关联审计；
- SENT / FAILED / SKIPPED / DEDUPED / NOT_ALLOWLISTED 的统一历史查询边界；
- 敏感字段最小化与统一 audit visibility；
- 统一 timezone / timestamp 标准。

PDM-25 负责统一审计 / 历史标准，PDM-23 不建设第二套跨域审计系统。

批准并执行后登记：

> `HO-P23-P25-001`

**建议：6同意。**

---

# 10. Batch 4 Gate｜PENDING_USER_REVIEW

当前：

- `P23-B4-01～P23-B4-06 = PENDING_USER_REVIEW`
- `TRUE_PRODUCT_CHOICE_COUNT = 1`
- `STABLE_CLOSURE_COUNT = 5`
- `RECOMMENDED_CHOICES = 1A`
- `COMPLETED_PDM_HARD_CONFLICT = 0`
- `INCOMING_HANDOFF_ACCEPTED = 10 / 10`
- `OUTGOING_HANDOFF_GAP = P23_TO_P25_PENDING_APPROVAL`
- `IA_LOWFI_ENGINEERING_CONSTRUCTION = NO`

当前唯一下一步：

> **用户审查 P23-B4-01～P23-B4-06。建议：1A、2同意、3同意、4同意、5同意、6同意。未经用户批准与明确执行，不进入 Final 前完整性复核。**


---

# 11. 窗口切换冻结点｜2026-10-07

> 当前对话上下文接近上限。用户明确要求：先把现有仓库内容 + 本窗口新增讨论全部保存，再切换窗口继续；**不是现在批准或执行 Batch 4**。

## 当前正式状态

- Startup Gate = PASS；
- Batch 1 = PASS / USER_APPROVED / APPLIED；
- Batch 2 = PASS / USER_APPROVED / APPLIED；
- Batch 3 = PASS / USER_APPROVED / APPLIED；
- 原 P23-B4-01～P23-B4-06 继续完整保留，但仅为旧版 Batch 4 草案；
- 原 Batch 4 尚未 USER_APPROVED / APPLIED；
- 不进入 Prefinal Integrity。

## 本窗口新发现但尚未裁决的内容

必须带到下一窗口重新扫描：

- 客户侧 V1 应核实微信小程序实际允许的订阅消息 / 服务通知能力，而不是按原生 App Push 处理；
- PC 主动通知 V1 暂不考虑；
- 未来独立 App Push 仅预留扩展，不实施；
- 员工飞书通知需重新核对多层开关：
  - 公司飞书渠道总开关；
  - 员工个人飞书业务提醒开关；
  - 飞书业务总群 / 群告警开关；
  - 员工级“其 SLA 超时是否进入飞书总群通告”开关；
- 用户明确回忆“员工级总群超时通告开关”历史上曾讨论，但本窗口对当前仓库关键词反查未找到明确固化规则，因此只能标记：
  `CONVERSATION_RECOVERED_CANDIDATE / HISTORICAL_RESCAN_REQUIRED / NOT_APPROVED / NOT_APPLIED`；
- 已执行 P23-B3-16 不撤销；未来若明确批准微信小程序订阅消息，则该批准构成新的明确 Authority，同时仍不建设通用客户消息中心。

## Batch 4 当前门禁状态

> `BATCH_4_REVIEW_SUSPENDED / REBUILD_REQUIRED_AFTER_HISTORICAL_RESCAN`

下一窗口不得直接批准旧 P23-B4-01～P23-B4-06，也不得直接把上述新讨论写成正式规则。

必须先读取：

- `07_重建工作区/PDM-23_窗口切换交接_2026-10-07.md`
- 本工作版；
- PROJECT_STATE / CURRENT_PROJECT_STATE / NEXT_ACTION；
- CROSS_PDM_HANDOFF_REGISTER；

然后重扫微信 / 飞书 / 总群 / SLA timeout / 员工级总群豁免 / DND / Incident / Notification Config 历史，再重新生成完整 Batch 4 交用户裁决。
