# PDM-17｜公海 / 待公海处理 / 领取 / 指定分配 / Collaboration（协作）｜规则原子重建工作版

> 日期：2026-10-06  
> 当前状态：`IN_PROGRESS / STARTUP_GATE_PASS / BATCH_1_PENDING_USER_REVIEW`  
> 当前 Authority：本文件仅为 PDM-17 工作 Authority；四批用户审查、Final 前完整性复核与最终总览批准完成后，才可生成正式 Final。  
> 禁止：当前不得修改 IA / Low-Fi / Engineering，不得提前关闭 incoming handoff。

---

## 1. PDM-17 域边界

PDM-17 负责：

1. 待公海处理候选与人工治理；
2. Customer 正式进入 / 退出公海；
3. 主动领取；
4. 后台指定分配 / 正式 owner 转派与公海相交部分；
5. 公海 Customer 主动发起人工服务时的 owner 分配；
6. 再次释放回公海；
7. Collaboration 的建立、scope、访问/操作边界与结束；
8. 与上述动作直接相关的保护条件、并发、历史与审计要求。

PDM-17 不重新定义：

- Customer identity / source / owner 基础不变量；
- CRM Stage / Tag / Follow-up 本体；
- Find-car Application / Demand 状态机；
- Matching / Priority 状态机；
- Recommendation / visibility；
- Consultation 状态机；
- Lock / Waitlist；
- Transaction / Refund；
- 客户端 / 员工端 / PC 最终 IA；
- 通知渠道状态机；
- Engineering / Schema / API。

---

## 2. Startup Gate｜Current Authority Refresh

### 2.1 已重新读取的证据

- 9/19 Phase 1 当前合并基线：R6《CRM / 公海 / 协作》；
- 9/19 R10：员工端公海入口、CRM / 工作台投影；
- 9/19 R12：P06 公海配置、人工治理与审计；
- 001～078：M02《Owner / 分享 / 公海 / 协作 / 交接》、M17《CRM / 工作台》；
- Current：E08 / E08-01 / P06-03 / P06-04 / P06-05；
- 已完成 Final：PDM-02 / 03 / 11 / 13 / 15 / 16；
- `CROSS_PDM_HANDOFF_REGISTER.md`。

### 2.2 Completed-PDM Dependency Card

| 上游 Authority | PDM-17 必须继承 |
|---|---|
| PDM-02 | identity + permission/capability + data scope + object/account state；4S hard DENY；System Admin 身份不自动获得业务领取/分配/协作权 |
| PDM-03 | Customer 同时只有一个 current owner；来源与历史 owner 不改写；分享不得绕过已有 owner / 公海治理 |
| PDM-11 | pending Application、active/paused Demand 是未完成责任/公海保护事实；不得创建 responsible=null 正式人工业务 |
| PDM-13 | Priority qualification 不是保护事实；active Priority 是公海保护事实；ended 后重读其他当前保护事实 |
| PDM-15 | 公海 Customer 主动 Consultation：先合法退出公海并形成 owner，再创建/复用 Consultation；Consultation reassignment 不反写 Customer owner |
| PDM-16 | 未完成 CRM 待办/回访/未来计划属于未完成责任；“暂不联系/暂无意向”不自动进公海；公海进出不清 CRM 历史；领取后首次跟进超时只提醒 |

### 2.3 Incoming Handoffs

Startup Gate 接收以下 6 条，当前统一为 `HANDOFF_ACCEPTED`：

- HO-P02-P17-001
- HO-P03-P17-001
- HO-P11-P17-001
- HO-P13-P17-001
- HO-P15-P17-001
- HO-P16-P17-001

这些 handoff 在 PDM-17 Final / Integrity closeout 前不得提前关闭。

### 2.4 Global Invariant Scan

当前未发现阻断启动的已完成 PDM 硬冲突：

- `COMPLETED_PDM_HARD_CONFLICT = 0`
- `INCOMING_HANDOFF_GAP = 0`
- Customer 唯一 current owner：PASS
- identity / permission / data scope / hard DENY：PASS
- active business responsibility 不得静默丢失：PASS
- 历史事实不可因 owner / 公海 / Collaboration 变化物理删除：PASS
- System Admin 控制平面身份 ≠ 业务执行身份：PASS
- 4S 不进入名邦公海 / Customer-level Collaboration：PASS

### 2.5 Current Carrier / 历史细节扫描

Current 并非完全缺失公海能力，已经存在：

- E08 公海模块与认领动作；
- P06-05 放入公海；
- P06-05 指定分配公海 Customer；
- P06-03 / P06-04 建立 / 结束 Collaboration；
- `REF_GUARD[PUBLIC_POOL]` 等基础 Guard。

但 9/19 R6 与 M02 反查显示，以下细节在 Current 仅部分承载或未完整下沉，必须在 PDM-17 四批审查中逐项处理：

1. “待公海处理”独立人工判断机制；
2. 进入公海 / 继续当前销售 / 直接移交三种处理结果；
3. 公海领取数量上限；
4. 公海领取频率限制；
5. 关闭自然接客是否影响主动领取；
6. 并发领取 winner 规则；
7. 领取是否存在待确认中间状态；
8. 原 owner 是否有重新领取优先权；
9. 公海 Customer 主动服务后的自动 owner 分配与退出公海；
10. 领取后首次跟进提醒与“只提醒、不自动收回”；
11. 每次进入、领取、再次进入等完整运营历史；
12. Collaboration 的具体业务级 / Customer 级两层 scope；
13. collaborator 是否可继续邀请 collaborator；
14. owner 变化 / collaborator inactive 后 Collaboration 结束；
15. E01 → E08 公海真实入口属于后续 PDM-21 carrier 对齐问题。

当前阶段只登记，不修改 IA / Low-Fi / Engineering。

---

## 3. P17-R00｜核心定位｜USER_APPROVED / APPLIED

> PDM-17 是“公海治理与 Collaboration（协作关系）”业务 Authority。

负责：

> 待公海处理 → 人工判断 → 进入公海 → 领取 / 指定分配 / 主动人工服务分配 → 退出公海 / 再次释放，以及 Collaboration 建立、范围、权限边界与结束。

边界：

- 不建立第二套 Customer / CRM / Demand / Priority / Consultation / Recommendation / Lock / Transaction 状态机；
- 其他 PDM 只向 PDM-17 提供当前真实的保护事实、未完成责任与 Guard；
- PDM-17 不得为了“进公海”静默结束、取消、转移或改写其他业务对象；
- 系统可以生成候选、提醒、限制；
- 不能仅因为长期未登录、暂无意向、跟进超时、长期未联系或 Customer Opportunity 命中而自动抢走 owner。

---

# 4. Batch 1｜稳定一致规则候选

> 分类：历史主规则与已完成 PDM 约束之间暂未发现真实冲突。  
> 状态：`PENDING_USER_REVIEW`。  
> 说明：即使是稳定规则，也必须逐批经用户确认；当前不得自动写成 Final。

## P17-A01｜公海与唯一 owner

Customer 同一时刻仍只能有一个正式 current owner。

正式进入公海成功后：

- current owner 变为无 owner 的公海状态；
- 原 owner 关系进入历史，不物理删除；
- 公海本身不制造第二个 owner；
- 被领取 / 指定分配成功后，只形成一个新的 current owner。

禁止用“协作销售”“历史 owner”“来源销售”冒充第二个 current owner。

**来源：**9/19 R6 §§3/12/13；PDM-03 Final。

## P17-A02｜禁止自动抢入公海

以下事实本身都不得自动把 Customer 放入公海：

- 长期未登录 / 未访问；
- 已完成购车；
- 暂无意向；
- 暂不联系；
- 销售关闭自然接客；
- 销售短期休假；
- 跟进超期；
- 长期未联系；
- Customer Opportunity 命中。

系统可生成候选 / 提醒，但 owner 改变必须来自合法明确业务动作。

**来源：**9/19 R6 §4/§37；PDM-16 Final。

## P17-A03｜正式进入公海的合法触发

进入公海必须由明确业务动作形成，例如：

- 当前 owner 主动释放；
- 具备对应公海治理 permission/capability 且 data scope 覆盖的授权管理人员处理；
- 员工 inactive / 离职且不存在明确合法接替 owner，在完成必要责任治理后进入；
- “待公海处理”候选经合法人工确认。

提交时必须重新校验当前 Customer、owner、actor、权限、scope 与保护事实。

**来源：**9/19 R6 §4；PDM-02/03 Final。

## P17-A04｜待公海处理是人工治理层

“待公海处理”不是公海状态本身，也不直接修改 owner。

合法管理人员处理候选时可选择：

1. 正式进入公海；
2. 继续保留当前 owner；
3. 直接移交其他合法 owner。

选择“继续当前 owner”后：

- owner 不变；
- 记录本次处理结果；
- 后续仍满足候选条件时，可按当前有效重新检查规则再次生成候选。

**来源：**9/19 R6 §5；R12 P06 公海配置。

## P17-A05｜未完成责任 / 保护事实阻止“直接丢公海”

进入公海前必须读取当前真实保护事实与未完成责任，至少包括适用的：

- pending Find-car Application；
- active / paused Demand；
- active Priority；
- open Consultation；
- active Lock / Waitlist；
- in-progress Transaction；
- 未完成 CRM 跟进任务、回访提醒、未来跟进计划；
- 其他已经形成真实当前业务责任的对象。

存在上述事实时，不得直接把责任丢回公海。

必须先按对应 Authority：

- 完成；
- 取消；
- 或形成明确合法交接。

PDM-17 只消费结果，不替这些业务对象创造新的状态机。

**来源：**9/19 R6 §6；PDM-11/13/15/16 handoff。

## P17-A06｜公海数据范围与业务身份

公海不是默认全公司共享池。

Customer 进入公海后，仍按当前合法门店 / 服务范围 / data scope 计算可见与可操作范围。

领取、分配、治理均继续服从：

> identity + permission/capability + data scope + object/account state

4S Member：

> 不领取名邦公海 Customer，不成为 Customer-level collaborator。

System Admin：

> 控制平面身份本身不成为公海 Customer owner、领取者或业务 collaborator；同一真人需要执行业务时必须使用独立员工身份。

**来源：**9/19 R6 §§7/39；PDM-02 Final。

## P17-A07｜主动领取的原子结果与并发

合法领取成功时：

- Customer 立即退出公海；
- claimant 立即成为唯一 current owner；
- 不新增“待确认领取”中间主状态；
- 领取提交时重新校验 Customer 仍在公海、owner 仍为空、保护事实仍清空、actor 仍合法；
- 并发领取只能有一个成功结果，其余请求收到已被领取后的当前真实结果；
- 原 owner 不因历史关系获得并发优先权。

**来源：**9/19 R6 §8；M02-003。

## P17-A08｜接客开关与主动领取分离

员工关闭自然接客：

- 只退出未来自然注册 / 自动轮询接客池；
- 不自动丢失已有 Customer；
- 在员工仍 active + eligible 且具备公海领取能力、scope 合法时，不因此单独禁止主动领取公海 Customer。

自然接客资格与主动公海领取资格不得合成同一个布尔状态。

**来源：**9/19 R6 §8；PDM-02/03 accepting Authority。

## P17-A09｜领取数量 / 频率限制

后台可以配置公海主动领取：

- 数量上限；
- 频率限制。

达到当前限制后不得继续领取新的公海 Customer。

限制用于防止囤积，不得：

- 自动改变已经合法形成的 owner；
- 自动把已有 Customer 收回公海；
- 改写 Customer 历史。

具体 PC 配置 carrier 后续交 PDM-22。

**来源：**9/19 R6 §9；R12 §10.1。

## P17-A10｜公海 Customer 主动发起人工服务

Customer 已在公海时主动发起需要真人承接的人工服务，例如 Consultation / 找车：

1. 不要求先等待销售手工领取；
2. 先按当前合法接客 / 服务承接规则形成唯一 owner；
3. owner 分配成功后 Customer 退出公海；
4. 再由对应 PDM 创建/复用正式业务对象。

若当前不存在合法 owner 承接人：

- 进入 owner assignment pending / 安全失败路径；
- 不创建 `responsible=null` 的正式人工业务对象；
- 不让 System Admin 临时充当销售 owner。

**来源：**9/19 R6 §10；PDM-02/11/15 Final。

## P17-A11｜后台指定分配

具备对应公海 assignment permission/capability 且 data scope 覆盖的合法员工，可以把公海 Customer 直接指定给 active + eligible 的合法目标员工。

成功后：

- 目标员工立即成为唯一 current owner；
- Customer 退出公海；
- 不要求目标员工再执行一次“确认领取”；
- 必须记录 old owner / public-pool source / new owner / actor / time 等可追溯事实；
- 提交时重新校验目标员工资格与 Customer 当前公海状态。

职位名称本身不自动授予 assignment 权。

**来源：**9/19 R6 §14；PDM-02 Final。

## P17-A12｜再次释放仍受责任 Guard

领取 / 分配后的 Customer 可以再次进入公海，但不能把未完成责任直接丢回池中。

再次释放仍需先处理：

- 未完成业务；
- 未完成 CRM 待办 / 回访 / 未来计划；
- 当前其他保护事实。

合法重新进入后形成新一次公海经历，不覆盖上一次进入 / 领取历史。

**来源：**9/19 R6 §16；PDM-16 Final。

## P17-A13｜公海进出不清空 Customer 业务历史

进入公海、领取、指定分配、再次释放均不得清空或重建：

- customer_id；
- 原始 source；
- 转介绍来源；
- 历史 owner；
- CRM Stage；
- Customer Tags；
- Shared Profile；
- 历史 Follow-up；
- 历史业务；
- 历史 Collaboration；
- 每次公海进入 / 领取 / 分配事实。

原 owner 失去 current owner 身份后，不因“以前服务过”自动保留当前完整 CRM 访问权；后续访问按当前权限 / scope / Collaboration / 管理范围重新计算。

**来源：**9/19 R6 §§12/13/32/36；PDM-03/16 Final。

## P17-A14｜Collaboration 不等于 owner，也不等于万能授权

Collaboration 只表达“参与服务”。

- Customer 始终只有一个正式 current owner；
- 可存在一个或多个合法 collaborator；
- collaborator 不自动成为 owner；
- Collaboration 权限 = 明确 collaboration scope + collaborator 自身 permission/capability + data scope + 当前对象状态；
- 不能因为参与协作自动获得 Customer 全部敏感信息、内部敏感价格、owner 修改、退款/成交纠错等越权能力。

真正改变 owner 必须走正式 owner transfer / public-pool assignment Authority。

**来源：**9/19 R6 §§18/19；PDM-02/03/15/16 Final。

## P17-A15｜Collaboration 建立、scope、结束与历史

建立 / 结束 Collaboration：

- 当前 owner 可对自己负责的 Customer / 具体业务建立或移除合法协作；
- 授权管理人员仅在 permission + data scope 覆盖时可管理；
- collaborator 本人不能因为已经是协作者就继续邀请新的 collaborator；
- 默认优先使用“具体业务级协作”；只有确需长期共同服务时才建立 Customer-level Collaboration；
- 具体业务级 Collaboration 随对应业务正式结束而结束；
- Customer-level Collaboration 在 owner/授权管理人员取消、owner 正式变化、collaborator inactive/离职等情况下结束；
- 结束后当前访问/操作权立即按最新事实撤销；
- 历史协作关系与本人历史操作永久保留；
- 后续重新参与必须建立新的 Collaboration，不复活旧记录。

**来源：**9/19 R6 §§20～27；Current P06-03/04；PDM-02/03/15/16 Final。

---

## 5. Batch 1 当前边界

本批暂不裁：

- 是否进一步弱化主动领取、强化后台指定分配；
- “待公海处理”的具体候选规则来源与默认周期；
- 数量上限 / 频率限制的具体数值与计数口径；
- 领取后的首次跟进提醒默认时长；
- 是否允许批量进入公海 / 批量指定分配及其逐条失败语义；
- owner 主动释放是否需要原因；
- Collaboration 是否允许更细粒度 scope 枚举；
- 其他真实冲突、明确废弃、新增规则与产品选择。

这些必须继续经过 Batch 2 / 3 / 4 分类与用户裁决，不能由 Batch 1 偷渡。

---

## 6. Startup Gate 结果

- `P17-R00 = USER_APPROVED / APPLIED`
- `STARTUP_GATE = PASS`
- `COMPLETED_PDM_HARD_CONFLICT = 0`
- `INCOMING_HANDOFF_GAP = 0`
- `INCOMING_HANDOFF_ACCEPTED = 6 / 6`
- `BATCH_1 = P17-A01～P17-A15 / PENDING_USER_REVIEW`
- `IA / LOW-FI / ENGINEERING = NO_CONSTRUCTION`

当前唯一下一步：

> **用户审查 P17-A01～P17-A15。未经确认不得进入 Batch 2。**
