# PDM-15｜Consultation / 咨询生命周期 / 来源 / 负责人 / 转派 / SLA｜最终完整规则

> 日期：2026-10-06  
> 状态：`COMPLETE / INTEGRITY_PASS`  
> Batch 1～4：`ALL_USER_APPROVED / APPLIED`  
> Final 前修复：`P15-LIA-01～P15-LIA-06 ALL_USER_APPROVED / APPLIED`  
> Final 前完整性复核 R3：`PASS / FINAL_CANDIDATE_READY`  
> 未决产品冲突：`0`  
> 本文件为 PDM-15 当前正式中文产品 Authority。用户已于 2026-10-06 最终批准并确认执行。

---

## 1. 本域最终边界

PDM-15 正式负责：

- Consultation 正式业务对象；
- 创建 / 复用 / touch；
- 四主状态与合法结束原因；
- direct source；
- Consultation assignee；
- 初始负责人选择；
- reassignment / handover；
- assignee 失效；
- Customer withdraw；
- Customer disable hold；
- mutation actor / authority；
- 首次人工响应 SLA；
- 内容内部可见范围；
- 与 Recommendation / Price / Vehicle / Transaction 等对象的负向边界；
- 历史与审计承接。

本域不重新定义：

- Customer identity / phone / owner；
- Vehicle / listing_cycle；
- Recommendation；
- Price；
- CRM 总体画像/阶段；
- 公海治理；
- Lock / Waitlist；
- Transaction / Refund；
- 客户端、员工端、PC 最终页面；
- 通知投递状态机；
- 全局横向审计。

以上分别服从对应 PDM Authority。

---

## 2. Consultation 是正式咨询工单

Consultation 的业务含义：

> 客户对某一台合法 Vehicle 明确发起“咨询” → 形成正式服务记录 → 确定合法负责人 → 真人处理 / 跟进 → 合法终结。

Consultation 不等于：

- Customer owner；
- Recommendation；
- Lock / LockRequest；
- Transaction；
- 普通浏览 / 收藏 / 分享；
- CRM 普通跟进记录。

对象之间只保存真实必要关联，不合并状态机。

---

## 3. 创建入口与手机号门槛

只有客户针对合法 Vehicle 明确执行“咨询”动作，才创建或复用 Consultation。

以下行为本身不创建 Consultation：

- 浏览；
- 收藏；
- 搜索；
- 普通分享；
- Recommendation 创建；
- 页面打开；
- 系统自动匹配。

人工服务手机号门槛继续服从 PDM-01：

- 未完成所需手机号授权时不得提前创建正式 Consultation；
- 授权成功后继续原咨询动作；
- 客户取消 / 拒绝授权时不创建正式 Consultation。

---

## 4. Consultation 核心幂等键

同一：

> `customer_id + vehicle_id + listing_cycle`

如果已经存在未终结 Consultation：

- 不再创建第二条未终结 Consultation；
- 后续真实咨询动作复用原对象；
- 追加 interaction / touch；
- 不改写最初 direct source；
- 不改写历史 assignee。

原 Consultation 已进入合法终态后，客户再次产生新的真实咨询意图：

> 创建新的 Consultation。

Vehicle 进入新的 listing_cycle 后再次咨询：

> 创建新 Consultation，不跨周期复用旧对象。

---

## 5. 四主状态

Consultation 正式主状态只有：

- `pending`
- `processing`
- `resolved`
- `invalid`

正常流程：

1. 新建 → `pending`
2. 合法负责人执行“开始处理” → `processing`
3. 正常解决 / 正常关闭 / 客户撤回 → `resolved`
4. 误触 / 重复 / 明显无效 → `invalid`

不得恢复：

- `CANCELLED` 第五主状态；
- timeout 第五主状态。

---

## 6. resolved 的结束原因

`resolved` 不代表所有正常结束都同一种业务原因。

必须用不可变 `close_reason` 区分至少：

- `RESOLVED`：问题已正常解决；
- `NORMAL_CLOSED`：业务正常关闭；
- `CUSTOMER_WITHDRAWN`：客户主动撤回 / 不再咨询。

界面可以分别展示：

- 已解决；
- 已关闭；
- 已取消 / 已撤回。

但 UI 文案不得反向创造第五主状态。

---

## 7. invalid 边界

`invalid` 仅表示该条 Consultation 本身无效，例如：

- 误触；
- 重复；
- 明显无效咨询。

标记 invalid：

- 不删除历史；
- 不改变 Customer owner；
- 不改变 Recommendation；
- 不改写最初来源；
- 不修改 Vehicle；
- 不修改 Lock / Transaction；
- 不修改其他独立业务对象。

客户正常撤回不得记成 invalid。

---

## 8. Vehicle 生命周期边界

Vehicle 已真实 `offline / unavailable` 后：

- 不允许新建该 listing_cycle 的 Consultation。

已经合法存在的 open Consultation：

- 不自动删除；
- 不自动 resolved；
- 不自动 invalid；
- 仍按真实业务事实由合法人员收口。

`hidden` 不等于 offline：

- hidden Vehicle 只要仍真实可售；
- 且 Customer 当前拥有合法访问入口；

就不因 hidden 本身禁止 Consultation。

Vehicle 新 listing_cycle 不继承旧周期 Consultation。

---

## 9. 初始 direct source

Consultation 创建时必须记录：

> 本次真实进入咨询动作的直接来源。

可以包括：

- Recommendation；
- 普通分享；
- 搜索；
- 收藏；
- 其他合法入口。

规则：

- 不能用“最近一次 Recommendation”替代真实 direct source；
- 创建后的初始来源不可改写；
- 后续其他入口只记新的 touch / interaction。

如果客户确实从某条 Recommendation 进入：

- 保存真实 Recommendation relation；
- Recommendation 之后 end / void / 失效不得回写历史 source。

---

## 10. 初始负责人优先级

创建 Consultation 时按当前合法事实确定 assignee：

1. 若真实来源是 Recommendation：只有该 recommender 在当前仍属于该 Customer / Demand 的合法业务责任关系，且 identity + permission/capability + data scope + object state 全部合法时，才优先承接；
2. 当前关联 Demand responsible；
3. 当前 Customer owner；
4. active + eligible + accepting 的合格接客 / 服务承接范围。

如果全部不可用：

- 不创建 `responsible=null` 正式 Consultation；
- 不让 System Admin 兜底业务负责人；
- 返回安全失败 / 待恢复结果；
- 记录配置 / 承责异常事实。

历史 recommender 不拥有永久 Consultation 承责优先权。

---

## 11. 无 owner / owner_assignment_pending / 公海创建顺序

Customer 已有合法 current owner：

- 按上一节继续确定 Consultation assignee。

Customer 处于 `owner_assignment_pending`：

- 必须先按 Customer owner Authority 成功形成合法 owner；
- 然后才允许创建 / 复用正式 Consultation。

Customer 处于公海：

- 公海退出 / owner 分配由 PDM-17 处理；
- PDM-15 不复制第二套公海状态机；
- owner / 服务责任未合法形成前，不创建正式 Consultation。

Consultation reassignment 不反向改变已经存在的 Customer owner。

---

## 12. Customer owner 与 Consultation assignee 分层

必须分别保存：

- Customer owner：长期 CRM 客户责任事实；
- Consultation assignee：这一条咨询当前处理人。

Customer owner 变化：

> 不自动漂移已经固化的 Consultation assignee。

Consultation assignee 变化：

> 不自动修改 Customer owner。

不得用一个 `owner` 字段混合表达两种责任。

---

## 13. 正式 reassignment / handover

Consultation 可正式转派给另一名合法 Employee。

必须至少记录：

- old assignee；
- new assignee；
- actor；
- time；
- 必要 reason / context。

转派：

- 不改写历史 assignee；
- 不改变 Customer owner；
- 不改初始 direct source；
- 不重置 first-response deadline；
- 本身不算首次真实人工响应。

---

## 14. assignee 失去资格

当前 assignee 如果：

- inactive；
- 离职；
- 失去所需 permission / capability；
- 失去 data scope；
- 失去业务处理资格；

则立即失去继续执行 Consultation mutation 的 Authority。

Consultation 不因此自动 resolved / invalid。

计划性失效：

> 应先完成 handover 再生效。

突发失效且暂未完成交接：

> 使用独立 `assignee_handover_pending` Guard 表示待交接，不新增主状态。

重新分配优先：

1. 当前仍合法且可承接的 Customer owner；
2. 合格接客 / 交接分配范围。

没有合法目标时：

- 保留 Consultation 历史和真实状态；
- 不伪造 null assignee 已正常承接；
- 不使用 System Admin 业务兜底；
- 等待合法 handover 完成。

---

## 15. “开始处理”动作

新 Consultation 创建后为 `pending`。

合法 actor 执行“开始处理 / 标记处理中”后：

> `pending → processing`

要求：

- 提交时重验 identity + permission/capability + data scope + object state；
- 不改变 Customer owner；
- 不改变 assignee；
- 不改初始来源；
- terminal Consultation 不得重新开始处理。

只改为 processing：

> **不算首次真实人工响应。**

---

## 16. 记录真实跟进

员工可以为 open Consultation 追加真实 follow-up / 沟通事实。

要求：

- actor 当前合法；
- Consultation 仍 open；
- 提交时重验责任、permission/capability、scope、object state；
- 不改 Customer owner；
- 不改初始来源；
- 不因一次跟进自动终结 Consultation。

如果该 follow-up 确实构成可审计真实人工服务动作：

> 可以完成首次响应 SLA。

普通 CRM 笔记 / 跟进本身不得自动推定为 SLA 首次响应；必须满足 PDM-15 对“真实人工服务动作”的条件。

---

## 17. Mutation actor / authority 精确矩阵

### 当前 Consultation assignee

在对象状态允许时，可处理自己负责的 Consultation，包括：

- 开始处理；
- 记录真实跟进；
- 解决；
- 标记无效；
- 正常关闭；
- 发起正式转派。

每次提交继续重验：

- identity；
- permission/capability；
- data scope；
- object state。

### 授权经理 / 店长

经理 / 店长职位本身不自动授权。

只有同时满足：

- 对应 Consultation management capability / permission；
- data scope 覆盖当前 Consultation / Customer；
- 当前对象状态允许；

才可执行相应管理 mutation / 转派。

执行管理动作本身：

- 不自动成为 Customer owner；
- 不自动成为 Consultation assignee。

只有正式 reassignment 把其设为 new assignee 时，才成为当前 assignee。

### 其他普通销售 / 非负责人

不能仅因：

- 能看 Vehicle；
- 能看 Customer；
- 曾经负责过；
- 曾参与历史业务；

就修改别人当前负责的 Consultation。

如果需要参与：

- 可通过合法 Collaboration 获得明确协作范围；
- 或经过正式 reassignment 成为当前 assignee。

Collaboration 本身不自动授予终结 / 转派权，除非另有明确 management permission。

### 转派目标

必须是：

- active；
- eligible；
- 具备对应业务资格；
- data scope 合法；

的名邦 Employee。

4S Member：hard DENY。  
System Admin 身份本身：不得作为 Consultation 业务 assignee / mutation actor。

---

## 18. Customer 主动撤回

Customer 只能撤回：

> 本人自己的 open Consultation。

提交时：

- 重验 Customer identity；
- 重验 Consultation 仍 open。

撤回结果：

- 不删除历史；
- 正常进入 `resolved`；
- `close_reason = CUSTOMER_WITHDRAWN`；
- 不记 invalid；
- 不改 Customer owner；
- 不改 Recommendation；
- 不改 Vehicle；
- 不改 Lock / Transaction。

客户撤回能力不授予任何员工端 mutation 权限。

---

## 19. 解决 / 无效 / 正常关闭

员工端三种正式结束语义：

### 解决
- 主状态 → `resolved`
- `close_reason = RESOLVED`

### 正常关闭
- 主状态 → `resolved`
- `close_reason = NORMAL_CLOSED`

### 无效
- 主状态 → `invalid`

所有动作：

- 不物理删除历史；
- 不反向修改 Customer owner；
- 不自动改 Recommendation；
- 不自动改 Lock / Transaction；
- 服从 mutation authority matrix。

---

## 20. Customer disable hold

Customer 被后台停用时：

- 不新增 Consultation 主状态；
- open Consultation 进入独立 `customer_disabled_hold` Guard；
- 保留原主状态、历史和 assignee；
- 暂停普通客户侧动作；
- 暂停常规服务推进；
- 暂停尚未完成的首次响应 SLA 计时。

必要的合法：

- 终结；
- 作废 / invalid；
- 交接；

仍可用于真实收口。

Customer 恢复账号后：

- 不自动解除 hold；
- 不自动恢复具体 Consultation 运行；
- 由合法 Employee 显式恢复并重新校验；
- 未完成 SLA 按停用前剩余时间继续。

---

## 21. 首次人工响应 SLA

初始默认：

> **15 分钟**

后台可配置，并允许按业务类型使用有效覆盖配置。

Consultation 创建时：

- 读取当时有效 SLA 配置；
- 固化本次 first-response deadline。

后续修改配置：

> 不追改已经存在的 Consultation deadline。

---

## 22. 什么才算首次真实响应

只有形成可审计真实服务事实的人工动作才算 first response，例如：

- 真实沟通记录；
- 真实电话沟通事实；
- 真实消息服务事实；
- 真实线下沟通事实；
- 满足同等证据标准的真实 follow-up。

以下**不算**：

- 打开页面；
- 已读；
- 浏览客户资料；
- 仅改成 processing；
- 仅修改 Consultation 状态；
- 仅转派；
- 系统自动动作。

转派：

> 不完成 first response，也不重置 deadline。

---

## 23. SLA timeout

SLA timeout 只是派生事实，可用于：

- 标记；
- 筛选；
- 提醒；
- 告警；
- 工作台排序输入。

timeout：

- 不是 Consultation 主状态；
- 不自动 resolved；
- 不自动 invalid；
- 不自动 close。

---

## 24. DND / quiet hours 与 SLA

普通夜间免打扰 / quiet hours：

- 只影响主动通知是否立即发送；
- 不暂停正常 SLA 业务计时；
- 不修改 Consultation 状态。

Customer disable hold 是本域明确的单独例外：

> 尚未完成的首次响应 SLA 在 hold 期间暂停。

---

## 25. 工作台 SLA 优先级

PDM-15 只冻结：

- SLA 当前事实；
- 是否已经完成 first response；
- 是否 timeout。

历史“：

1. 已超时；
2. 即将超时；
3. 新咨询 / 新服务意向；

”的员工工作台优先级、即将超时阈值和最终展示由 PDM-21 冻结。

不得把 UI 排序反向改成 Consultation 生命周期函数。

---

## 26. 完整 Consultation 内容可见范围

名邦内部完整 Consultation 内容只有在当前 Guard 合法时可由以下主体查看：

1. 当前 Consultation assignee；
2. 当前 Customer owner；
3. 管理范围内具备对应 Consultation 管理 / 查看能力的经理、店长；
4. 明确参与该具体业务且 Collaboration scope 允许查看 Consultation 的协作销售。

其他销售：

> 不能仅因能看 Vehicle 就查看客户完整 Consultation。

历史 assignee / owner / collaborator：

> 不获得永久访问权，读取时按当前 identity + permission + data scope + collaboration/object state 重验。

4S Member：hard DENY。  
System Admin 身份本身：不自动获得完整 Consultation 业务内容访问权。

Customer 本人：

> 只获得自己的 Customer Safe Projection，不等于内部完整内容。

---

## 27. Consultation × Recommendation

两对象双向独立。

Recommendation：

- create 不自动创建 Consultation；
- end / void / 失效不自动结束 Consultation；
- 后建 Recommendation 不抢写已有 Consultation assignee；
- 不改写 Consultation 初始来源。

Consultation：

- 不自动创建 Recommendation；
- 不授 Recommendation 免费 price-right；
- 不授 hidden Vehicle visibility grant；
- resolved / invalid / withdraw / normal close 不自动 end / void Recommendation。

若 Consultation 真实来源于 Recommendation：

> 只保留真实 source relation，不绑定生命周期。

---

## 28. Consultation × Price

发起 Consultation：

> 不自动获得批发车数字价格查看权。

批发价格可见性继续由 PDM-10 / Recommendation 等独立 Authority 决定。

Consultation 不能：

- 绕过每日查价额度；
- 凭空授 free price-right；
- 把“价格咨询”变成价格授权。

---

## 29. Consultation × Transaction

Transaction：

- completed；
- cancelled；
- corrected；

均不得自动修改 Consultation 主状态。

交易事实只可作为 Consultation 的业务上下文。

如果 Consultation 应结束：

> 仍由 Consultation 自身合法真人动作执行“解决 / 正常关闭 / 无效”等并留历史。

不得恢复“成交即自动 resolved 咨询”。

---

## 30. Vehicle 档案 / 报告边界

车辆档案、检测报告、维保资料不完整：

> 本身不得阻止 Customer 发起 Consultation。

Consultation 不把“档案完整度”升级成 Vehicle 可售性事实。

真正 offline / unavailable 才按 Vehicle Authority 阻断新增 Consultation。

---

## 31. 4S 边界

4S source Vehicle：

- 只要当前 Vehicle 合法可售 / 可访问，可以被 Customer 发起 Consultation。

但 4S Member：

- 不进入名邦 Consultation 处理链；
- 不自动获得查看；
- 不领取；
- 不处理；
- 不转派；
- 不终结；
- 不能成为 assignee。

Consultation 由名邦侧合法 Employee 责任体系承接。

---

## 32. System Admin 边界

System Admin 是控制平面身份，不自动获得：

- Consultation assignee 身份；
- Consultation mutation 权；
- 完整 Consultation 业务内容访问权；
- 接客兜底责任。

同一真人需要执行业务时：

> 必须使用合法员工身份，并服从对应 permission / capability / data scope / object state。

---

## 33. 历史与审计

Consultation 历史不得物理删除。

至少保留 / 审计：

- customer_id；
- vehicle_id；
- listing_cycle；
- direct source；
- source Recommendation / Demand（如真实存在）；
- created_at；
- touch / interaction；
- 状态变化；
- close_reason；
- start-processing；
- follow-up；
- old/new assignee；
- reassignment actor/time/reason/context；
- assignee_handover_pending；
- customer_disabled_hold / resume；
- SLA 配置 snapshot；
- first-response deadline；
- first real human response；
- timeout；
- mutation actor；
- identity / permission / data scope / object state 上下文。

历史不得由后续 owner、assignee、Recommendation、Transaction、source_type 等事实回写覆盖。

---

## 34. 明确不得恢复的旧规则

以下 stale carrier / 旧方案不得恢复：

1. `CANCELLED` 作为第五 Consultation 主状态；
2. timeout 作为第五状态；
3. timeout 自动关闭；
4. 旧“我要这辆车”统一混合 Consultation / Lock 意向链；
5. Customer Merge / Consultation migration；
6. 把 Consultation assignee 与 Customer owner 合成一个字段；
7. Customer owner 一变，Consultation assignee 自动漂移；
8. Recommendation lifecycle 驱动 Consultation lifecycle；
9. 打开 / 已读 / processing / 转派算首次响应；
10. 转派后重新开始 15 分钟 SLA；
11. Transaction completed 自动 resolved Consultation；
12. 4S Member 自动进入 Consultation 处理链；
13. System Admin 自动成为 Consultation 负责人 / 业务处理人；
14. 能看 Vehicle 就能看完整 Consultation。

---

## 35. 后续跨域移交

PDM-15 已正式登记以下 outgoing handoff：

- `HO-P15-P16-001`｜`HANDOFF_CLOSED / source_backwrite=YES`：PDM-16 Final 已承接 Consultation context 进入统一 CRM Follow-up / service history、普通 CRM 跟进不自动完成 first-response SLA、CRM Stage 不反写 Consultation 主状态 / assignee / source；
- `HO-P15-P17-001`｜`HANDOFF_CLOSED / source_backwrite=YES`：PDM-17 Final 已承接公海 Customer 主动发起 Consultation 时先形成合法唯一 Customer owner、成功退出公海后再由 PDM-15 创建/复用正式 Consultation；无法形成合法 owner 时不得创建 responsible=null Consultation；
- `HO-P15-P19-001`｜`HANDOFF_CLOSED / source_backwrite=YES`：PDM-19 Final 已正式承接 Transaction × Consultation 负向边界；Transaction completed/cancelled/corrected 均不得自动改变 Consultation 主状态，Consultation 仍由 PDM-15 合法真人动作收口；
- `HO-P15-P20-001 = HANDOFF_CLOSED / source_backwrite=YES`：PDM-20 Final 已正式承接“我的咨询”、pending/processing/resolved/invalid 四主状态、close_reason 安全文案、customer_disabled_hold 与当前/历史投影；
- `HO-P15-P21-001 = HANDOFF_CLOSED / source_backwrite=YES`：PDM-21 Final 已正式承接员工端 Consultation 动作、mutation authority、E01 SLA 优先级及“即将超时”阈值；
- `HO-P15-P22-001`｜`HANDOFF_CLOSED / source_backwrite=YES`：PC Consultation 管理 / SLA 配置已由 PDM-22 Final 承接；
- `HO-P15-P23-001`：新 Consultation / SLA timeout 通知与 DND；
- `HO-P15-P25-001`：统一审计 / 历史。

`HO-P15-P16-001`、`HO-P15-P17-001`、`HO-P15-P19-001`、`HO-P15-P20-001`、`HO-P15-P21-001` 已分别由目标 Final 正式承接并关闭；PDM-22 已 `HANDOFF_CLOSED / source_backwrite=YES`；PDM-23 / PDM-25 继续 `HANDOFF_OPEN`。

---

## 36. Incoming handoff closeout 状态

PDM-15 当前有 5 条 incoming handoff：

- HO-P01-P15-001；
- HO-P02-P15-001；
- HO-P03-P15-001；
- HO-P07-P15-001；
- HO-P14-P15-001。

当前均已：

> `HANDOFF_ACCEPTED`

且已被本总览实质承接。

但在用户最终批准本 Final Domain Overview 前：

- 不得提前标 `HANDOFF_CLOSED`；
- 不得 source backwrite；
- 不得把 PDM-15 标 COMPLETE。

---

## 37. Final 前完整性结果

R3：

- `SOURCE_TO_ATOM = PASS`
- `ATOM_TO_SOURCE = PASS`
- `SEMANTIC_COMPLETENESS = PASS`
- `MISSING_RULE_UNRESOLVED = 0`
- `SEMANTIC_DETAIL_GAP_UNRESOLVED = 0`
- `COMPLETED_PDM_INVARIANT_CONFLICT = 0`
- `INCOMING_HANDOFF_GAP = 0`
- `OUTGOING_HANDOFF_GAP = 0`
- `PDM15_LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`
- `PDM15_FINAL_CANDIDATE_READY = YES`

---

## 38. Final 发布与 Closeout

用户已最终批准并确认执行。

- 正式 Authority：`07_重建工作区/PDM-15_最终完整规则.md`；
- Final 前完整性复核 R3：`PASS / FINAL_CANDIDATE_READY`；
- 5 条 incoming handoff：`HANDOFF_CLOSED / source_backwrite=YES`；
- 2 条 outgoing（PDM-16 / PDM-17）已 `HANDOFF_CLOSED / source_backwrite=YES`；其余 6 条继续 `HANDOFF_OPEN`；
- PDM-15：`COMPLETE / INTEGRITY_PASS`；
- 下一步：`PDM-16 Startup Gate`；
- IA / Low-Fi / Engineering 继续禁止提前施工。

> 2026-10-07 Source Backwrite：对应 PDM-22 handoff 已由 `07_重建工作区/PDM-22_最终完整规则.md` 正式承接；以 CROSS_PDM_HANDOFF_REGISTER 的 `HANDOFF_CLOSED / source_backwrite=YES` 为准。
