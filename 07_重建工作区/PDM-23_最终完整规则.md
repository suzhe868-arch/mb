# PDM-23｜最终完整规则

> 域：通知 / 飞书 / SLA / 夜间免打扰 / Incident / 通知日志  
> 当前状态：`COMPLETE / INTEGRITY_PASS`  
> Final 前完整性复核：`R2 PASS / FINAL_CANDIDATE_READY`  
> 正式规则 / 用户裁决单元：`65`

## 1. 核心定位

PDM-23 是通知、飞书、主动提醒、夜间免打扰、Incident 通知投递与 Notification Log 的唯一产品 Authority。

PDM-23 只消费 completed-PDM 已成立的业务事件，不建立第二套 Customer / Vehicle / Consultation / CRM / Lock / Transaction / Refund / Recommendation 状态机。

通知成功、失败、跳过、去重、延迟或恢复发送都不得改写底层业务事实。

## 2. 主动通知 allowlist

当前合法主动通知候选包括：

- 新 Consultation；
- Consultation first-response SLA timeout；
- 公海领取后首次跟进提醒；
- LockRequest 关键结果；
- 自动 Waitlist 必要结果；
- Waitlist 车辆释放；
- 已启用配置下的 Lock 即将到期；
- supply anomaly；
- Transaction / Refund 重要变化；
- 当前有效上游 / Collector Incident 告警与恢复。

实际投递必须经过：

> allowlist + recipient/route + channel + channel switch + event validity + DND + frequency/cadence + dedupe

普通浏览、点击、埋点、普通 Matching、Customer Opportunity、Source Radar 不逐条强推。

## 3. 个人飞书路由

个人通知不维护第二套 notification owner。

发送时按来源业务对象当前合法 owner / assignee / responsible / handoff 解析目标 Employee，再读取 current employee_id ↔ Feishu identity。

Employee inactive、无映射、无合法接收人，只形成 FAILED / SKIPPED 等通知结果，不自动改派业务责任。

## 4. 飞书配置分层

### 公司飞书总开关

最高飞书总闸。关闭后个人飞书和总群都不发，但业务、SLA、Incident、工作台与日志继续运行。

### 员工个人飞书提醒开关

默认开启。关闭只影响该员工个人飞书提醒，不改变 owner / assignee / SLA / Incident / Lock / Transaction，也不自动关闭其 SLA 总群资格。

### 飞书总群路由

保留合法群 / 路由配置。V1 不再另建与公司飞书总开关重复的“群通知总开关”。

### 员工级 SLA 是否进总群

默认开启，由具备合法 Notification Config 能力与 scope 的人员配置。

关闭后，只停止该员工负责 Consultation 的 SLA timeout 群投递；timeout、工作台、Notification / audit 事实继续存在，不改变 assignee / deadline / first-response。

## 5. Consultation SLA 群告警

PDM-23 不重新计算 SLA，只消费 PDM-15 / PDM-22 已固化的 deadline / timeout。

同一 Consultation 的同一次 first-response SLA timeout 阶段，原则上只做一次飞书总群告警。

告警至少包含：

- Customer 必要识别信息；
- 当前负责销售；
- Consultation 必要摘要；
- 已超时时长；
- 合法业务入口。

不得复制完整手机号、非必要资金、internal price、上游电话等敏感内容。

打开 deep-link 后必须重新鉴权；打开 / 已读告警不算 first response。

## 6. 通知统一去重

普通通知遵循：

> **同一业务事件 + 同一通知阶段原则上只通知一次。**

工程重试不能创造新的通知阶段。已 SENT 的普通同阶段通知再次被消费时应 DEDUPED / SKIPPED。

具体 dedupe key、MQ / worker 实现留 Engineering。

持续 Incident 是明确例外。

## 7. DND 夜间免打扰

当前基线：

> **23:00 ～ 次日 08:30，可配置。**

夜间业务、SLA、Incident、Lock / Transaction / Refund 等业务时钟与 audit/log 继续运行，主动通知暂停。

SLA timeout、supply anomaly、Transaction / Refund、Incident 都没有隐式夜间绕过。

DND 结束后重新判断 event validity；已失效不补发，仍有效再进入投递判断。

统一按项目业务时区解释。

## 8. Incident / Recovery

Incident 告警只消费真实运行事实。

同一持续故障不得每次失败都新建新的 Incident。

持续 active Incident 允许按当前已配置 cadence 重复告警，是普通“一次通知”原则的明确例外。

每次重复前重验：

- incident 仍 active；
- channel / route；
- DND；
- cadence；
- group validity。

真实 recovery / cleared 后停止重复并可发送恢复通知。

V1 不恢复历史旧固定 2/5/15 分钟默认节奏。没有合法 cadence 配置时，不得由 IA / Engineering 自行创造默认频率。

## 9. Lock / Waitlist / Transaction / Refund

PDM-23 只消费对应 completed-PDM 结果：

- LockRequest 结果通知不改变 LockRequest / Lock；
- 自动 Waitlist 通知不改变候补顺序、不自动晋升；
- Lock 到期提醒读取 PDM-22 “是否启用 / 提前量”，不恢复固定 30 分钟；
- Transaction / Refund 通知失败不得改资金或成交事实；
- 通知本身不创建 correction / refund / transaction 状态。

## 10. CRM / Public Pool

CRM Follow-up / Public Pool 的提醒业务事实由 PDM-16 / PDM-17 决定。

PDM-23 只负责渠道、DND、频控、去重和日志。

领取后首次跟进提醒超时不自动收回 Customer、不自动进公海、不改 owner、不结束 Collaboration。

普通 Opportunity / Source Radar 不逐条个人飞书。

## 11. Recommendation / 客户微信边界

Recommendation create / end / void 本身不自动建立客户微信主动消息状态机。

通知失败不得 rollback Recommendation / visibility / price-right。

## 12. 微信小程序订阅消息

V1 保留未来接入能力，但当前不把微信订阅消息作为核心依赖，也不视为当前已启用。

在没有新的明确产品 Authority 前：

- 不自动把员工 / 飞书 allowlist 映射成客户微信消息；
- 不建设通用客户消息中心；
- 不建设已读 / 未读业务状态机；
- 不假设一次授权长期有效。

未来真正启用某客户事件时，必须同时满足：

1. 明确 customer-WeChat event allowlist；
2. 届时腾讯平台合法模板 / 类目 / 发送资格；
3. 用户所需合法授权；
4. 当前 event / account / recipient validity。

微信发送资格缺失或发送失败不得使业务 mutation 失败。

## 13. App Push / PC Push

独立 App Push 只预留 notification channel adapter 接入能力，V1 当前不实现。

当前不做 device token 产品管理、App Push 配置页、App 通知中心、通用 Push 模板中心。

PC V1 不做浏览器 Push / 桌面主动弹窗，只承载业务管理、工作台、Notification Config 与 Notification Log。

## 14. Notification Log

至少记录：

- 业务事件类型；
- 必要业务对象关联；
- 接收对象；
- 路由 / 渠道；
- 通知阶段；
- 计划 / 实际发送时间；
- SENT / FAILED / SKIPPED / DEDUPED / NOT_ALLOWLISTED 等结果；
- 失败 / 跳过 / 去重原因；
- DND / event-validity 重判结果。

Notification Log 不成为第二套业务审计 Authority。

日志查看需 current permission + scope，不得复制不必要敏感字段。

## 15. Notification Config Guard

通知配置写操作必须读取：

> current identity + explicit permission/capability + data/config scope + config object state

提交时重新校验。

System Admin 身份本身不自动拥有 Notification Config 权。

配置变化不改写过去通知结果、不追改业务对象；尚未实际发送的候选通知在下次发送判断时读取当前有效配置。

## 16. Deep-link 安全

通知链接只是入口，不是永久授权票据。

打开 E01 / E06 / E07 / PC 业务页面后必须重新校验：

- current identity；
- permission / capability；
- data scope；
- object state；
- account state（适用时）。

收到、点击、打开、已读通知都不得自动记为 Consultation first response。

## 17. 不建设通用通知策略中心

V1 不建设任意：

> 业务事件 × 短信 / 微信 / 飞书 / App / PC × 模板 × 频率 × 接收组

的通用策略矩阵。

未来新增渠道或事件必须重新获得明确产品 Authority。

## 18. Engineering 边界

PDM-23 不冻结：

- MQ / Queue 选型；
- worker topology；
- 自动重试固定次数；
- backoff 算法；
- provider SDK；
- Notification table 物理结构；
- 日志物理存储周期；
- dedupe key 物理实现。

Engineering 必须服从 P23 的业务边界，不得自行扩张 allowlist 或默认 cadence。

## 19. PDM-25 Handoff

已正式登记：

> `HO-P23-P25-001 = HANDOFF_OPEN`

PDM-25 承接 Notification Config / 飞书映射 / 开关 / DND / 群路由 / cadence / Notification Log 的统一 audit、history、敏感字段与 timezone 标准，不得反向改变 PDM-23 产品语义。

## 20. 明确不得恢复

不得恢复：

1. 通知失败 = 业务失败；
2. timeout = Consultation 第五主状态；
3. 所有提醒 = 必须飞书；
4. fixed 30 分钟 Lock 到期提醒；
5. 普通 Matching / Opportunity / Radar 逐条推送；
6. Recommendation 自动微信消息状态机；
7. DND 暂停 SLA / Incident / business clock；
8. DND 后机械补发全部积压；
9. deep-link 自带永久权限；
10. 点击 / 已读 = first response；
11. 未配置 Incident 默认 cadence；
12. 产品层写死 MQ / retry / backoff / provider；
13. System Admin 自动获 Notification Config 权；
14. 飞书映射改变业务责任；
15. 通用客户消息中心 / 已读未读状态机；
16. 通用通知模板 / 任意事件渠道矩阵；
17. 与公司飞书总开关重复的独立群总开关；
18. 微信接入预留 = 当前自动发送；
19. App Push / PC Push 偷跑进入 V1。

## 21. Handoff 状态

### Incoming

target=PDM-23：

> **10 / 10 = HANDOFF_CLOSED / source_backwrite=YES**

已在 Final Closeout 中正式关闭并完成 source backwrite。

### Outgoing

- HO-P23-P25-001｜HANDOFF_OPEN。

## 22. Final 前完整性结果

- `SOURCE_TO_ATOM = PASS`
- `ATOM_TO_SOURCE = PASS`
- `SEMANTIC_COMPLETENESS = PASS`
- `MISSING_RULE_UNRESOLVED = 0`
- `SEMANTIC_DETAIL_GAP_UNRESOLVED = 0`
- `COMPLETED_PDM_INVARIANT_CONFLICT = 0`
- `INCOMING_HANDOFF_GAP = 0`
- `OUTGOING_HANDOFF_GAP = 0`
- `NEGATIVE_CLAIMS_VERIFIED = PASS`
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`
- `PDM23_FORMAL_UNITS = 65`
- `PDM23_FINAL_CANDIDATE_READY = YES`

## 23. Final Closeout

用户已最终批准并明确“确认执行”。

- 正式 Authority：`07_重建工作区/PDM-23_最终完整规则.md`；
- Final 前完整性复核 R2：`PASS / FINAL_CANDIDATE_READY`；
- Final Integrity：`07_重建工作区/PDM-23_最终完整性复核_2026-10-07.md / PASS`；
- 65 个正式规则 / 用户裁决单元全部进入 Final；
- 10 / 10 incoming handoff：`HANDOFF_CLOSED / source_backwrite=YES`；
- `HO-P23-P25-001 = HANDOFF_OPEN`；
- PDM-23：`COMPLETE / INTEGRITY_PASS`；
- IA / Low-Fi / Engineering 未施工；
- 当前唯一下一步：`PDM-24 Startup Gate`。
