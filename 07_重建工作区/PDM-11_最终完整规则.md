# PDM-11｜找车申请 / Demand 生命周期｜最终完整规则

> 日期：2026-10-05  
> 状态：`COMPLETE / INTEGRITY_PASS`  
> Batch 1～4：`ALL_USER_APPROVED`  
> Final User Approval：`PASS / 2026-10-05`  
> Source→Final / Final→Source：`PASS`  
> 未决产品冲突：`0`  
> 本文件为 PDM-11 当前正式中文产品 Authority。

---

## 1. 核心对象：Application 与 Demand 必须分离

V1 找车业务固定分成两个对象：

1. **Find-car Application｜找车申请**
   - 保存客户主动表达的找车诉求；
   - 是进入人工找车服务前的申请对象；
   - pending 不等于正式持续找车；
   - 不得伪装成“匹配中”。

2. **Demand｜正式找车需求**
   - 员工正式开通后的持续找车服务业务容器；
   - 承载负责人、状态、销售匹配描述、标准条件、匹配/推荐历史、CRM 跟进关联等；
   - 与 Application、Recommendation、Matching Result 均不是同一个对象。

一个 Application 最多激活一个 Demand；重复激活必须幂等。

---

## 2. 提交找车申请的前置门槛

### 2.1 手机号

“提交帮我找车”属于人工服务动作，提交前必须满足手机号服务门槛。

无可用手机号时先触发正式手机号授权。

授权拒绝 / 取消：

- 不创建 Find-car Application；
- 不通知员工；
- 不建立正式人工服务对象；
- 当前页面输入可做前端临时保留；
- 不新增服务端“未授权找车草稿”状态。

### 2.2 Owner / 负责人

Find-car Application 属于正式高意向人工服务对象，**不得创建 responsible=null 的 Application**。

提交前：

1. Customer 已有合法 current owner → 由当前合法归属承接；
2. 无 owner → 先解析有效分享 / 转介绍归属；
3. 仍无 owner → 进入 active + eligible + accepting 合格接客池分配；
4. 接客池异常为空 → 不创建无负责人 Application，只保留 owner_assignment_pending / 配置异常事实并提示暂时无法建立人工找车服务；
5. 池恢复后重新完成 owner 分配，再建立正式 Application。

System Admin 不作为销售 / owner / Application 负责人兜底。

---

## 3. Application 生命周期

Application 轻量生命周期：

> `pending / activated / closed`

pending：

- 客户可以编辑同一申请；
- 客户可以撤回；
- 修改只更新同一 Application 与同一工作台任务，不重复生成对象；
- 员工可以在申请详情处理；
- 未经正式员工处理不得自动创建 active Demand。

activated：

- 必须关联唯一真实 `demand_id`；
- 一个 Application 只能成功激活一次；
- 重复激活幂等。

closed：

- 客户撤回或员工关闭后进入 closed；
- closed 不再允许激活；
- 历史保留，不做普通物理删除。

---

## 4. pending Application 工作台与公海保护

Application 创建成功后，立即进入当前负责员工工作台：

> **找车服务待处理**

卡片至少展示：

- 客户；
- 想找什么车；
- 预算（如有）；
- 提交时间；
- 当前负责人；
- pending 状态。

工作台只提供：

> **处理申请**

进入 E05 申请详情，不允许在卡片上一键绕过 Guard 激活 Demand。

pending Application 本身属于**公海保护事实**：

- Customer 仍有 pending Application 时，不得按普通无业务客户直接送入公海；
- owner / 员工离职、inactive、失去承责资格时，pending Application / 待处理任务必须进入正式交接；
- 不得遗留给 inactive / ineligible 员工。

---

## 5. Customer Level 与正式找车权益

Customer Level 是一组后台可配置权益，不只是“普通 / 粉丝 / VIP”的名称。

正式找车资格只读取：

> **Customer 当前等级所配置的找车 entitlement**

当前业务基线：

- 普通客户：正式找车权益 OFF；
- 粉丝 / VIP：可配置为 ON；
- 未来新增等级同样按当前配置判断；
- 核心代码不得写死等级名称。

V1 明确**不建设**：

> 普通客户保持普通等级，但单独给该 Customer 增加 find-car entitlement override / grant。

普通客户需要获得正式找车资格时：

> 调整 Customer Level → 进入当前配置为具备找车权益的等级。

等级调整：

- 使用独立受控能力；
- 服从 `identity + permission + data scope + object state`；
- 经理 / 店长可按配置获得；
- 个别销售也可以被明确授权；
- 4S 成员受名邦 Customer / CRM 域 hard DENY；
- V1 不建设固定多级审批；
- 至少审计 Customer、原等级、新等级、操作人、时间。

---

## 6. 普通客户也可以提交 Application，但不会自动进入正式服务

所有客户都可以表达找车诉求。

普通 / 当前无正式找车 entitlement 的 Customer：

1. 可以正常提交 Application；
2. Application 保存为 pending；
3. 不创建 active Demand；
4. 不启动持续 Matching；
5. 可以等待等级升级后再由员工处理；
6. 也可以撤回；
7. 员工可以关闭。

客户端应明确告诉客户：

- 申请已经提交成功；
- 当前等级暂不具备正式找车权益；
- 可升级到当前后台配置中真正具备权益的客户等级；
- 可联系顾问。

“粉丝 / VIP”只有在当前后台确实配置为具备该权益时才可具体显示，不能永久写死。

---

## 7. Application → Demand 统一人工激活

无论 Customer 当前是否已经具备找车 entitlement：

> **提交 Application 后都先 pending。**

不得恢复 9/06 旧方向：

> “已有 entitlement → Application 保存后自动 active Demand”。

正式 Demand 只能由有权限员工在 Application 处理详情中人工开通。

激活前至少重新校验：

- Customer 账号当前可用；
- Application 仍为 pending；
- 当前 Customer Level 仍具备找车 entitlement；
- 手机号人工服务门槛仍满足；
- 当前员工 identity 合法；
- permission 合法；
- data scope 合法；
- object state 合法。

等级升级只恢复“有资格被开通”，**不会自动激活已有 pending Application**。

---

## 8. Demand 主状态

正式 Demand V1 只保留：

- `active`
- `paused`
- `completed`
- `cancelled`

规则：

- paused 可以正式恢复；
- completed / cancelled 为终态；
- 终态只读；
- 未来再次找车创建新的 Application / Demand；
- 不原地 reopen；
- 不增加自动 `expired` 主状态；
- paused 不是历史结束态。

---

## 9. Demand 时间事实

Demand 至少冻结：

### `created_at`

- 员工首次成功人工激活 Application 并创建正式 Demand 的时间；
- 创建后不可重写；
- 后续 pause / resume / reassignment 不改变；
- PDM-13 后续若按 Demand 创建先后仲裁 Priority，必须使用该不可变时间；
- 不得使用 updated_at / 最近 resume 时间替代。

如工程同时使用 `activated_at`：

- 首次创建即激活场景与首次正式激活事实一致；
- 后续 resume 不能覆盖首次 activated_at。

状态变化时间通过状态 / 审计历史另行记录。

---

## 10. Demand 负责人

每条 Demand 有独立：

> `demand_responsible_sales_id`

默认由创建 / 激活时的合法业务归属承接。

规则：

- Customer owner 与 Demand 负责人是两层事实；
- 普通 owner 变化不得自动漂移 Demand 负责人；
- Demand 负责人变化不得自动改变 Customer owner；
- 确需改派时执行正式 reassignment；
- 至少保留原负责人、新负责人、操作人、时间及必要历史；
- 员工 inactive / 离职 / 失去资格时，active / paused Demand 必须进入正式交接；
- 不允许正式 Demand 负责人为空。

---

## 11. 一个 Customer 可以同时拥有多条 Demand

V1 不限制“只能有一条当前找车需求”。

同一 Customer 可以同时存在：

- 多条 active Demand；
- pending Application；
- paused Demand；
- completed / cancelled 历史 Demand；
- 与不同 Demand 关联的 Recommendation。

因此客户端 C02 是：

> **找车工作区**

不是一个只能处于单一状态的页面。

---

## 12. Demand 状态动作

### 员工

当前负责人 / 有权员工：

active：

- 暂停；
- 完成；
- 取消。

paused：

- 恢复；
- 完成；
- 取消。

completed / cancelled：

- 历史只读；
- 不允许原地恢复。

“完成”与“取消”必须区分：

- `completed`：该条找车服务目标已经真实完成；
- `cancelled`：该条需求不再继续，但服务目标没有按完成事实结案。

---

## 13. 客户暂停 / 恢复 / 双向结束

客户对自己的 Demand：

- active → 可以发起暂停；
- paused → 可以发起恢复；
- active / paused → 可以点击“结束找车”。

### 客户主动结束

客户点击“结束找车”时：

1. 不直接由客户端决定 `completed / cancelled`；
2. 生成该 Demand 的待员工确认结束请求；
3. 同一 Demand 同一时刻最多一个未处理结束请求；
4. 重复提交必须幂等；
5. Demand 主状态暂时保持原 active / paused；
6. 客户端可显示派生状态：
   > **结束处理中**
7. 不新增第五个 Demand 主状态。

员工处理该请求时，根据真实结果选择：

- 服务目标已经完成 → `completed`
- 客户不再继续找 / 放弃需求 → `cancelled`

### 员工主动结束

员工不需要等待客户发起结束请求。

当前负责人 / 有权限员工可以根据真实业务结果直接：

- completed；
- cancelled。

这就是当前冻结的**双向结束模型**。

---

## 14. Customer 账号停用

Customer 账号停用后：

- active Demand → paused；
- 已 paused 保持 paused；
- completed / cancelled 不改；
- 不删除 Demand；
- 不清空条件、匹配、Recommendation、CRM 跟进、负责人、状态历史；
- 停用期间不得新建 / 激活 Demand；
- paused Demand 不得恢复 active。

已有 pending Application：

- 保留；
- 不自动关闭；
- 不删除；
- 保留原始内容 / 修改历史 / 负责人 / 待处理历史；
- 停用期间不得激活 Demand；
- Customer 侧依赖账号能力的新增 / 编辑等动作暂停；
- 有权限员工仍可查看并按真实治理事实关闭。

账号恢复后：

- 不自动恢复 active Demand；
- 不自动激活 pending Application；
- 仍需正式 resume / 人工处理；
- 当前 Customer Level entitlement 仍需合法。

---

## 15. 找车 entitlement 下降 / 恢复

Customer Level 变化导致正式找车 entitlement：

### 有效 → 无效

- 不允许新建 / 激活新 Demand；
- active Demand → paused；
- paused 保持；
- completed / cancelled 不变；
- pending Application 保留但不得激活；
- 所有历史保留。

### 无效 → 有效

- 只恢复正式找车资格；
- pending Application 不自动激活；
- paused Demand 不自动 active；
- 客户本人或有权限员工执行正式恢复后才 active；
- active 后再由 PDM-12 判断 matching readiness。

账号停用与 entitlement 下降是两个不同触发源，但在 Demand 域都会让 active → paused。

---

## 16. 找车信息必须分层

至少分成五层：

1. **客户原始找车要求**
   - 客户原话 / 原始条件；
   - 保存、查看、留档；
   - 不直接作为自动 Matching 主输入。

2. **销售匹配描述**
   - 销售沟通后整理的“系统实际应该找什么车”；
   - 是确定性解析的主要业务输入。

3. **标准匹配条件**
   - 由确定性词典 / 规则解析得到；
   - 具体字段和算法归 PDM-12。

4. **需求说明 / 背景**
   - 本条找车任务的业务背景；
   - 不参与自动 Matching。

5. **CRM 跟进**
   - 使用统一 CRM follow-up；
   - 可通过 `demand_id` 关联；
   - 不新建第二套 Demand 跟进表。

不得把五层内容压成一个“备注”。

---

## 17. Matching readiness 与 Demand 状态分层

Demand = active 只代表：

> 正式找车服务已经开启。

不等于：

> 自动 Matching 已经具备合法输入。

至少存在：

- 顾问还在整理条件；
- 条件已确定 / ready；
- 部分条件需要人工确认。

这些属于 Matching readiness，不是 Demand 主状态。

正式持续 Matching 至少要求：

> Demand = active + 当前 PDM-12 readiness 合法。

具体确定性解析、条件比较、候选等级与重算由 PDM-12 冻结。

V1 不使用 AI 猜测客户话术后直接生成正式 Matching 条件。

---

## 18. 最低申请内容

找车 Application 最低必填只有：

> **想找什么车**

其他均可选，例如：

- 预算；
- 年款；
- 里程；
- 车况；
- 颜色；
- 地域；
- 其他要求。

客户不知道的字段不要求强制补齐后才能提交。

具体字段如何进入自动 Matching 由 PDM-12 冻结。

---

## 19. Transaction 与 Demand 独立

某笔 Transaction completed：

- 只完成该 Transaction 与其真实成交事实；
- 不自动把同一 Customer 的所有 Demand 批量 completed / cancelled；
- 即使 Transaction 与某条 Demand 有关联，也必须根据该 Demand 真实服务目标决定是否结束。

禁止：

> “客户买了一辆车 → 所有找车 Demand 自动全部完成”。

---

## 20. 历史与删除边界

以下均不做普通物理删除：

- closed / withdrawn Application；
- completed Demand；
- cancelled Demand；
- 负责人历史；
- 状态变化历史；
- 客户结束请求；
- 匹配 / Recommendation / CRM 跟进历史。

错误处理使用明确 correction / invalidation / amendment 类治理事实，不用普通编辑覆盖历史。

---

## 21. 与 PDM-10 客户等级价格权益的统一关系

PDM-10 与 PDM-11 共同冻结：

> **Customer Level = 后台可配置权益集合。**

其中至少可承载：

- 找车 entitlement；
- 批发价格 LIMITED / UNLIMITED；
- LIMITED daily quota；
- 后续其他客户权益。

但各 entitlement 独立：

- 找车权益不能替代价格权益；
- 价格权益不能替代找车权益。

当前常见配置示例：

普通：

- 找车 = OFF；
- 批发价格 = LIMITED。

粉丝 / VIP：

- 找车可配置 ON；
- 批发价格可配置 UNLIMITED。

等级名与具体额度不能写死进核心算法。

---

## 22. 明确不得恢复

PDM-11 不得恢复以下旧方向：

1. Application 与 Demand 合成一个对象；
2. 任何客户提交就无条件 active Demand；
3. 已有 entitlement 的客户提交后自动 active；
4. Customer 级独立 find-car entitlement override；
5. “代淘中 / 代淘客户”作为等级 / Demand 状态 / entitlement；
6. paused 直接归历史结束态；
7. 自动 expired Demand 主状态；
8. completed / cancelled 原地 reopen；
9. owner 变化自动漂移全部 Demand 负责人；
10. raw customer text 经 AI 猜测直接成为正式 Matching 条件；
11. entitlement 下降但 active Demand 无条件继续运行；
12. entitlement / 账号恢复时自动恢复全部 paused Demand；
13. Customer disable 删除 / complete / cancel Demand；
14. pending Application 无 owner / responsible=null；
15. pending Application 不算公海保护；
16. Transaction completed 自动结束客户全部 Demand；
17. 客户“结束找车”由客户端直接猜 completed / cancelled；
18. 把“结束处理中”实现为第五个 Demand 主状态；
19. 客户等级核心逻辑永久写死“粉丝/VIP”名称。

---

## 23. Future Handoff

已正式登记 HANDOFF_OPEN：

- PDM-12：`HANDOFF_CLOSED`。PDM-12 Final 已承接 Matching readiness、确定性解析、四级 Match Result、事件驱动重算与 current/stale 结果边界；Application 不参与正式 Matching，只有 active + matching-ready Demand 进入。
- PDM-13：`HANDOFF_CLOSED`。PDM-13 Final §§2-3,6,8-9,14 已承接 pending Application 不产 Priority、Priority 仅基于合法 active+matching-ready Demand/current high/acceptable Match Result、Demand.created_at 作为不可变仲裁时间、trigger Demand 失效/Match tier downgrade 时切同 Customer 其他合法 Demand 或结束并重仲裁；
- PDM-14：`HANDOFF_CLOSED`。PDM-14 Final 已承接 Recommendation / source_demand_id、find-car entitlement 作为正式 Recommendation 资格、Demand paused/completed/cancelled 不被 Recommendation 反向激活、多 Demand 保留真实 source；`HO-P11-P14-001 = HANDOFF_CLOSED / source_backwrite=YES`；
- PDM-16：`HANDOFF_CLOSED`。PDM-16 Final 已正式承接 CRM Customer Detail 的 Level / entitlement / pending Application / active-paused-completed-cancelled Demand 概览，以及统一 CRM Follow-up 通过 demand_id 关联；`HO-P11-P16-001 = HANDOFF_CLOSED / source_backwrite=YES`；
- PDM-17：`HANDOFF_CLOSED`。PDM-17 Final 已正式承接 pending Find-car Application 与 active/paused Demand 作为公海保护事实、公海 Customer 发起找车前先形成合法唯一 owner、无合法承接人时禁止 responsible=null 正式业务，以及 owner/公海变化前未完成责任的完成/取消/正式交接；`HO-P11-P17-001 = HANDOFF_CLOSED / source_backwrite=YES`；
- PDM-20｜`HANDOFF_CLOSED`：C02 多对象工作区、动态客户等级提示、Application pending、Demand 人工激活、暂停/恢复/结束请求及“结束处理中”已由 PDM-20 Final 正式承接；`HO-P11-P20-001 = HANDOFF_CLOSED / source_backwrite=YES`；
- PDM-21：员工工作台、人工激活、Demand 完整详情与状态动作；
- PDM-22：Customer Level 配置、后台客户/找车管理；
- PDM-25：Application / Demand / Level / entitlement / ending request / reassignment 统一审计。

PDM-12 已完成目标域闭环：

> `HO-P11-P12-001 = HANDOFF_CLOSED / target=PDM-12 Final §§2-4,29 / source_backwrite=YES`

其余仍开放事项不是“后面再想”，而是已经登记的正式输入。目标 PDM 必须 ACCEPT → 落地 → source backwrite → CLOSED。

---

## 24. IA / Low-Fi Stale Carrier

当前只登记，不施工：

- IA Demand responsibility 仍可能显示 N/A；
- IA Demand history 语义不足；
- C02-02 paused 页面缺真实恢复 / 结束动作；
- E01 缺完整找车服务待处理工作台；
- C02 缺多对象正式导航；
- C02 Application form 未完整表达最低必填与可选项；
- E05-04 缺完整“销售匹配描述→确定性解析→条件更新→重算”链；
- 当前载体尚未承载客户“结束处理中”请求态；
- 当前载体尚未完整承载动态 Customer Level entitlement 提示。

统一：

> `STALE_CARRIER / DEFERRED_TO_POST_PDM25_IA_LOWFI_ALIGNMENT`

IA / Low-Fi 不得反向覆盖本总览产品 Authority。

---

## 25. 最终完整性复核结果

Final 前完整性复核已关闭：

- Application owner / pool-empty Guard；
- pending Application 公海保护；
- 客户结束 Demand 的 completed / cancelled 判定缺口；
- Demand.created_at；
- 动态等级权益文案；
- Customer disable 对 pending Application；
- future handoff 语义压缩；
- Current / Decision Gate stale。

用户于 2026-10-05 最终批准完整总览后，已执行最终双向追溯：

- 工作版 Batch 1～4 → Final：全部映射；
- Pre-Final LIA-01～08 → Final：全部映射；
- Final → Source / 用户裁决 / Completed-PDM 依赖：均存在合法来源；
- future handoff → CROSS_PDM_HANDOFF_REGISTER：全部正式登记；
- incoming `HO-P01-P11-002`：PDM-01 source backwrite 已存在，可正式关闭。

```text
BATCH_1 = PASS / USER_APPROVED
BATCH_2 = PASS / USER_APPROVED
BATCH_3 = PASS / USER_APPROVED
BATCH_4 = PASS / USER_APPROVED
FINAL_USER_APPROVAL = PASS
SOURCE_TO_FINAL = PASS
FINAL_TO_SOURCE = PASS
SEMANTIC_COMPLETENESS = PASS
CROSS_PDM_INTEGRITY = PASS
HANDOFF_INTEGRITY = PASS
NEGATIVE_CLAIMS_VERIFIED = PASS
UNRESOLVED_PRODUCT_CONFLICT = 0
PDM11_COMPLETE = YES
PDM11_INTEGRITY_PASS = YES
```

---

## 26. 当前 Authority 与后续边界

PDM-11 已正式完成：

> **`COMPLETE / INTEGRITY_PASS`**

当前产品 Authority：

> `07_重建工作区/PDM-11_最终完整规则.md`

后续：

- PDM-12 接收 Matching / readiness / deterministic parsing / Match Result handoff；
- PDM-13 已完成 Priority 与 Demand.created_at / Demand lifecycle 承接：`HO-P11-P13-001 = HANDOFF_CLOSED / target=PDM-13 Final §§2-3,6,8-9,14 / source_backwrite=YES`；
- PDM-14 / PDM-16 / PDM-17 / PDM-20 已完成并 `HANDOFF_CLOSED / source_backwrite=YES`；PDM-21 / PDM-22 / PDM-25 继续按 handoff register 承接；
- IA / Low-Fi 仍不得在当前阶段施工，统一延后到 PDM-25 + 全局最终审计后。

PDM-11 Final 完成不代表这些后续 handoff 已落地；其状态继续由目标 PDM 的 ACCEPTED / CLOSED 流程管理。

