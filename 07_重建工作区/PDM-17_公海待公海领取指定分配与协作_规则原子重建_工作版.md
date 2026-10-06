# PDM-17｜公海 / 待公海处理 / 领取 / 指定分配 / Collaboration（协作）｜规则原子重建工作版

> 日期：2026-10-06  
> 当前状态：`IN_PROGRESS / BATCH_1_2_3_4_PASS / PREFINAL_R1_RUNNING`  
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

# 4. Batch 1｜稳定一致规则｜PASS / USER_APPROVED / APPLIED

> 分类：历史主规则与已完成 PDM 约束之间暂未发现真实冲突。  
> 状态：`PASS / USER_APPROVED / APPLIED`。  
> 用户裁决：P17-A01～P17-A15 全部同意；随后确认执行。  
> 说明：15 条稳定规则已进入 PDM-17 当前工作 Authority，但仍需四批全部完成及 Final 前完整性复核后才可进入正式 Final。

## P17-A01｜公海与唯一 owner｜USER_APPROVED / APPLIED

Customer 同一时刻仍只能有一个正式 current owner。

正式进入公海成功后：

- current owner 变为无 owner 的公海状态；
- 原 owner 关系进入历史，不物理删除；
- 公海本身不制造第二个 owner；
- 被领取 / 指定分配成功后，只形成一个新的 current owner。

禁止用“协作销售”“历史 owner”“来源销售”冒充第二个 current owner。

**来源：**9/19 R6 §§3/12/13；PDM-03 Final。

## P17-A02｜禁止自动抢入公海｜USER_APPROVED / APPLIED

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

## P17-A03｜正式进入公海的合法触发｜USER_APPROVED / APPLIED

进入公海必须由明确业务动作形成，例如：

- 当前 owner 主动释放；
- 具备对应公海治理 permission/capability 且 data scope 覆盖的授权管理人员处理；
- 员工 inactive / 离职且不存在明确合法接替 owner，在完成必要责任治理后进入；
- “待公海处理”候选经合法人工确认。

提交时必须重新校验当前 Customer、owner、actor、权限、scope 与保护事实。

**来源：**9/19 R6 §4；PDM-02/03 Final。

## P17-A04｜待公海处理是人工治理层｜USER_APPROVED / APPLIED

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

## P17-A05｜未完成责任 / 保护事实阻止“直接丢公海”｜USER_APPROVED / APPLIED

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

## P17-A06｜公海数据范围与业务身份｜USER_APPROVED / APPLIED

公海不是默认全公司共享池。

Customer 进入公海后，仍按当前合法门店 / 服务范围 / data scope 计算可见与可操作范围。

领取、分配、治理均继续服从：

> identity + permission/capability + data scope + object/account state

4S Member：

> 不领取名邦公海 Customer，不成为 Customer-level collaborator。

System Admin：

> 控制平面身份本身不成为公海 Customer owner、领取者或业务 collaborator；同一真人需要执行业务时必须使用独立员工身份。

**来源：**9/19 R6 §§7/39；PDM-02 Final。

## P17-A07｜主动领取的原子结果与并发｜USER_APPROVED / APPLIED

合法领取成功时：

- Customer 立即退出公海；
- claimant 立即成为唯一 current owner；
- 不新增“待确认领取”中间主状态；
- 领取提交时重新校验 Customer 仍在公海、owner 仍为空、保护事实仍清空、actor 仍合法；
- 并发领取只能有一个成功结果，其余请求收到已被领取后的当前真实结果；
- 原 owner 不因历史关系获得并发优先权。

**来源：**9/19 R6 §8；M02-003。

## P17-A08｜接客开关与主动领取分离｜USER_APPROVED / APPLIED

员工关闭自然接客：

- 只退出未来自然注册 / 自动轮询接客池；
- 不自动丢失已有 Customer；
- 在员工仍 active + eligible 且具备公海领取能力、scope 合法时，不因此单独禁止主动领取公海 Customer。

自然接客资格与主动公海领取资格不得合成同一个布尔状态。

**来源：**9/19 R6 §8；PDM-02/03 accepting Authority。

## P17-A09｜领取数量 / 频率限制｜USER_APPROVED / APPLIED

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

## P17-A10｜公海 Customer 主动发起人工服务｜USER_APPROVED / APPLIED

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

## P17-A11｜后台指定分配｜USER_APPROVED / APPLIED

具备对应公海 assignment permission/capability 且 data scope 覆盖的合法员工，可以把公海 Customer 直接指定给 active + eligible 的合法目标员工。

成功后：

- 目标员工立即成为唯一 current owner；
- Customer 退出公海；
- 不要求目标员工再执行一次“确认领取”；
- 必须记录 old owner / public-pool source / new owner / actor / time 等可追溯事实；
- 提交时重新校验目标员工资格与 Customer 当前公海状态。

职位名称本身不自动授予 assignment 权。

**来源：**9/19 R6 §14；PDM-02 Final。

## P17-A12｜再次释放仍受责任 Guard｜USER_APPROVED / APPLIED

领取 / 分配后的 Customer 可以再次进入公海，但不能把未完成责任直接丢回池中。

再次释放仍需先处理：

- 未完成业务；
- 未完成 CRM 待办 / 回访 / 未来计划；
- 当前其他保护事实。

合法重新进入后形成新一次公海经历，不覆盖上一次进入 / 领取历史。

**来源：**9/19 R6 §16；PDM-16 Final。

## P17-A13｜公海进出不清空 Customer 业务历史｜USER_APPROVED / APPLIED

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

## P17-A14｜Collaboration 不等于 owner，也不等于万能授权｜USER_APPROVED / APPLIED

Collaboration 只表达“参与服务”。

- Customer 始终只有一个正式 current owner；
- 可存在一个或多个合法 collaborator；
- collaborator 不自动成为 owner；
- Collaboration 权限 = 明确 collaboration scope + collaborator 自身 permission/capability + data scope + 当前对象状态；
- 不能因为参与协作自动获得 Customer 全部敏感信息、内部敏感价格、owner 修改、退款/成交纠错等越权能力。

真正改变 owner 必须走正式 owner transfer / public-pool assignment Authority。

**来源：**9/19 R6 §§18/19；PDM-02/03/15/16 Final。

## P17-A15｜Collaboration 建立、scope、结束与历史｜USER_APPROVED / APPLIED

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
- `BATCH_1 = P17-A01～P17-A15 / PASS / USER_APPROVED / APPLIED`
- `IA / LOW-FI / ENGINEERING = NO_CONSTRUCTION`

当前唯一下一步：

> **P17-A01～P17-A15 已批准并执行。当前唯一下一步：用户审查 Batch 2（P17-B2-01～P17-B2-04）。未经确认不得进入 Batch 3。**

---

## 7. Batch 1 Gate｜PASS

- 用户裁决：`P17-A01～P17-A15 = 全部同意`；
- 执行授权：用户随后明确“确认执行”；
- `BATCH_1 = PASS / USER_APPROVED / APPLIED`；
- 15 条规则均已进入当前工作 Authority；
- 6 / 6 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工。

---

# 8. Batch 2｜明确废弃 / Superseded / DO_NOT_RESTORE｜PASS / USER_APPROVED / APPLIED

> 状态：`PASS / USER_APPROVED / APPLIED`。  
> 用户裁决：P17-B2-01～P17-B2-04 全部同意；随后以“真执行”明确授权执行。  
> 反向冲突扫描：`PASS / FALSE_DEPRECATION_COUNT=0`。  
> 原则：只列已经被后续 Authority 明确废弃、替代或禁止恢复的旧口径；不把仍然有效的公海 / Collaboration 能力误标为废弃。

## P17-B2-01｜Customer Merge × 公海迁移 / 冲突规则不得恢复｜USER_APPROVED / APPLIED

9/19 R6 曾存在“重复 Customer 合并时如何处理公海 / owner / 协作关系”的历史规则。

当前 PDM-01 已正式取消 V1 Customer Merge：

- 不提供人工 Customer Merge；
- 不提供手机号合并；
- 不因判断为同一自然人而合并两个 customer_id；
- 两个 Customer 即使共享手机号，也保持独立。

因此所有依赖“先合并 Customer，再迁移 / 合并其公海 membership、owner、Collaboration、CRM 历史”的旧规则全部 `SUPERSEDED / DO_NOT_RESTORE`。

这不会删除正常的公海、owner transfer、Collaboration 或历史查询能力；只是彻底取消“Customer Merge 与公海冲突处理”这一旧分支。

**依据：**PDM-01 Final 当前 Customer Merge 取消口径；9/19 R6 历史 merge×public-pool 条款。

## P17-B2-02｜“经理 / 店长职位本身 = 公海治理权限”的硬编码解释不得恢复｜USER_APPROVED / APPLIED

历史文案中经常用“经理 / 店长可处理公海、分配、协作”描述 actor。

当前 PDM-02 已明确替代为：

> identity + permission/capability + data scope + object/account state

因此不得恢复以下旧实现：

- 只因 role=经理就自动拥有全部公海治理能力；
- 只因 role=店长就自动拥有全部领取 / 分配 / Collaboration 管理能力；
- 绕过个人 deny、hard DENY、data scope 或对象状态。

经理 / 店长仍可通过角色模板或明确授权获得对应能力，但最终授权必须按当前权限模型计算。

**依据：**PDM-02 Final §§4/5/7；P17-A03/A06/A11/A15。

## P17-B2-03｜System Admin 作为公海业务执行者 / 兜底 owner 的旧解释不得恢复｜USER_APPROVED / APPLIED

历史“后台管理员处理公海”不得再解释为：

- System Admin 直接领取公海 Customer；
- System Admin 被指定为 Customer owner；
- System Admin 作为 Customer-level collaborator；
- 接客池为空时由 System Admin 临时兜底承接客户；
- System Admin 仅因后台治理身份直接执行销售 / CRM / Consultation 等业务动作。

System Admin 可以治理账号、角色、permission、data scope 与系统配置，但业务领取 / owner / Collaboration 必须由合法员工业务身份执行。

同一真人如同时拥有两类身份，必须按对应独立身份执行。

**依据：**PDM-02 Final §6；PDM-03 owner/接客边界；P17-A06/A10。

## P17-B2-04｜分享 / 转介绍绕过公海治理、恢复历史 owner 的旧解释不得恢复｜USER_APPROVED / APPLIED

Customer 已经处于公海 / 待公海治理链路时：

- 点击历史销售分享链接；
- 再次打开旧客户分享；
- 产生新的转介绍 / 分享事件；

均不得直接：

- 恢复历史 owner；
- 把 Customer 自动判给最后一个分享销售；
- 绕过公海领取 / 指定分配 / 合法 owner 分配；
- 用分享事实覆盖已经存在的 owner / 公海治理事实。

分享 / 转介绍来源历史可以继续保存；真正 owner 变化必须服从 PDM-17 当前公海 Authority 与 PDM-03 owner Authority。

**依据：**PDM-03 Final §§5～9、§12；HO-P03-P17-001；P17-A01/A10/A11/A13。

### 8.1 Reverse Conflict Scan

本轮没有把以下仍有效能力误判为废弃：

- 主动领取公海 Customer；
- 后台指定分配；
- 待公海人工处理；
- 领取数量 / 频率限制；
- 公海 Customer 主动服务触发 owner 分配；
- Collaboration；
- 经理 / 店长在合法 permission + scope 下执行治理；
- System Admin 的控制平面治理能力；
- 分享 / 转介绍来源历史本身。

因此：

- `FALSE_DEPRECATION_COUNT = 0`
- `BATCH_2_CONFLICT_SCAN = PASS`

当前唯一下一步：

> **P17-B2-01～P17-B2-04 已批准并执行。当前唯一下一步：用户审查 Batch 3“无新增项”结论。未经确认不得进入 Batch 4。**

---

## 8.2 Batch 2 Gate｜PASS

- `P17-B2-01～P17-B2-04 = PASS / USER_APPROVED / APPLIED`；
- Reverse Conflict Scan = `PASS`；
- `FALSE_DEPRECATION_COUNT = 0`；
- 6 / 6 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工。

---

# 9. Batch 3｜明确新增 / 明确变更扫描

> 状态：`NO_NEW_ATOMS / PASS / USER_APPROVED / APPLIED`。  
> 用户裁决：同意“无新增项”；随后确认执行。  
> Conflict Isolation：`PASS / MISCLASSIFIED_PRODUCT_CHOICE=0`。

本轮重新对照 6 条 target=PDM-17 incoming handoff 与 Batch 1 已批准规则：

| Incoming Handoff | 后续新增 / 变更事实 | 当前承接位置 |
|---|---|---|
| HO-P02-P17-001 | 当前 permission/capability + data scope + inactive + System Admin/4S 边界 | P17-A06 / A11 / A15 |
| HO-P03-P17-001 | 分享不得绕过已有 owner / 正式公海治理 | P17-A01 / A10 / A11 / A13 + P17-B2-04 |
| HO-P11-P17-001 | pending Application、active/paused Demand 是保护事实；无 owner 不建 responsible=null | P17-A05 / A10 |
| HO-P13-P17-001 | Priority qualification 不是保护；active Priority 才是，ended 后重读其他保护事实 | P17-A05 |
| HO-P15-P17-001 | 公海 Consultation 先合法 owner 分配，再创建/复用 Consultation | P17-A10 |
| HO-P16-P17-001 | CRM 未完成责任需交接；暂无意向不自动进公海；公海不清 CRM 历史；首次跟进超时只提醒 | P17-A02 / A05 / A13；首次跟进时长与 carrier 留 Batch 4/PDM-22 |

### 9.1 结论

上述 later additions / explicit changes 均已被 Batch 1 当前 Authority 完整吸收，没有必要再复制成第二组重复规则原子。

因此本 Batch 3：

- `NEW_INDEPENDENT_ATOMS = 0`
- `DUPLICATE_RULE_CREATION = 0`
- `MISCLASSIFIED_PRODUCT_CHOICE = 0`
- `BATCH_3 = NO_NEW_ATOMS / PENDING_USER_REVIEW`

这并不表示 PDM-17 没有后续待裁决问题。以下仍属于 Batch 4 的真实产品选择 / 缺口，不能偷渡进 Batch 3：

- 是否进一步弱化主动领取、强化后台指定分配；
- 待公海候选规则 / 重新检查周期；
- 领取数量上限 / 频率限制的具体口径；
- 领取后首次跟进提醒默认时长；
- 批量进入公海 / 批量指定分配；
- owner 主动释放是否要求原因；
- Collaboration scope 是否进一步细化；
- 其他完整性扫描发现的真实缺口。

当前唯一下一步：

> **Batch 3“无新增项”已通过并执行。当前唯一下一步：用户裁决 Batch 4（P17-B4-01～P17-B4-09）。**

---

## 9.2 Batch 3 Gate｜PASS

- 用户同意 Batch 3“无新增独立规则原子”结论，并随后确认执行；
- `BATCH_3 = NO_NEW_ATOMS / PASS / USER_APPROVED / APPLIED`；
- `NEW_INDEPENDENT_ATOMS = 0`；
- `DUPLICATE_RULE_CREATION = 0`；
- `MISCLASSIFIED_PRODUCT_CHOICE = 0`；
- 6 / 6 incoming handoff 继续 `HANDOFF_ACCEPTED`。

---

# 10. Batch 4｜真实冲突 / 遗漏 / 缺口 / 新产品选择｜PASS / USER_APPROVED / APPLIED

> 状态：`PASS / USER_APPROVED / APPLIED / CHOICES=1A,2A,3A,4A,5A,6A,7A,8A,9A`。  
> 用户裁决：1A～9A；随后确认执行。  
> 本批可以覆盖此前“历史稳定但仍留产品选择”的局部运营语义，但不得静默破坏 Customer 唯一 owner、权限模型、未完成责任 Guard、历史不可删除等已完成 PDM 硬约束。

## P17-B4-01｜公海运营主路径：后台指定分配 vs 主动领取｜CHOICE=A / USER_APPROVED / APPLIED

仓库当前正式证据保留两条路径：

- 销售主动领取；
- 有权限人员后台指定分配。

但没有发现已经正式冻结“哪条是运营主路径”的覆盖性裁决。

**A｜推荐：后台指定分配为主，主动领取保留为弱化 / 可选能力。**

- 管理侧以后台分配、待公海人工处理为主要治理路径；
- 主动领取仍存在，因此 P17-A07～A09 继续有效；
- 是否给普通销售开放主动领取，由 permission / 角色模板 / 配置决定；
- 产品文案和运营流程不再把“抢公海”设计成唯一主流程。

**B｜两条路径同等地位。**

- 主动领取与后台指定分配都是正式主路径；
- 不强调其中一条优先。

## P17-B4-02｜恢复“疑似长期未真实跟进”人工候选的三条件 AND｜CHOICE=A / USER_APPROVED / APPLIED

001～078 历史反向差集明确发现整条规则在 Current 丢失。

**A｜推荐：恢复历史三条件 AND。**

只有同时满足：

1. 近期存在真实 Customer 主动活跃；
2. 距最后一次真实 CRM Follow-up 超过后台可配置阈值；
3. 当前不存在 PDM-17 认可的保护业务 / 未完成责任；

才生成“待公海处理”候选。

同时冻结：

- 只生成候选，不自动进公海；
- 不自动改 owner；
- 不自动飞书；
- 不建立独立 lifecycle/state；
- 后台心跳、系统行为、员工代操作不算 Customer 有效主动活跃；
- 长期完全不活跃的死客户不因“销售没跟进”自动成为候选；
- 正常成交后长期沉默客户不能只凭未跟进进入候选；
- 不恢复固定“30 天未跟进”硬规则。

**B｜V1 不恢复该自动候选条件。**

- 只允许 owner 主动释放、管理者人工发起检查等显式入口；
- 系统不根据未跟进事实生成这类候选。

## P17-B4-03｜待公海候选条件 / 重新检查周期是否写死默认值｜CHOICE=A / USER_APPROVED / APPLIED

R6 / R12 明确“可配置”，但没有可靠证据支持固定默认天数。

**A｜推荐：产品基线不写死默认数值。**

- 冻结“候选条件可配置”；
- 冻结“继续当前 owner 后重新检查周期可配置”；
- 具体默认值、数值范围、配置 carrier 交 PDM-22；
- 不恢复任何无当前证据的固定 30 天等旧值。

**B｜当前 PDM-17 就固定默认值。**

- 需要另行明确具体天数 / 阈值。

## P17-B4-04｜领取数量 / 频率的计数口径｜CHOICE=A / USER_APPROVED / APPLIED

历史只明确存在“数量上限 + 频率限制”，并未形成足够可靠的当前固定数字。

**A｜推荐：PDM-17 只冻结业务能力，不写死数字 / 时间窗。**

- 数量上限与频率限制均后台可配置；
- 达到限制只阻止新的主动领取；
- 已合法 owner 不被自动收回；
- 释放 / 完成处理后是否恢复额度按当前配置重新计算；
- 具体数值、计数窗口和配置 carrier 交 PDM-22。

**B｜PDM-17 现在直接固定数量、频率和时间窗口。**

- 需要用户继续给出具体数字。

## P17-B4-05｜领取后的首次跟进提醒默认时长｜CHOICE=A / USER_APPROVED / APPLIED

当前已冻结“超时只提醒，不自动收回 / 不自动进公海”，但默认时长未冻结。

**A｜推荐：只冻结可配置，不在 PDM-17 写死默认时长。**

- 首次跟进提醒时间后台可配置；
- 超时只提醒；
- 若需重新判断公海，进入待公海人工治理；
- 具体默认时间 / 配置 carrier 交 PDM-22 / 提醒载体交 PDM-23。

**B｜当前直接固定一个默认时长。**

- 需要用户继续给出具体时间。

## P17-B4-06｜是否支持批量公海治理｜CHOICE=A / USER_APPROVED / APPLIED

R6 明确历史支持管理人员批量处理，但 Current 承载不足。

**A｜推荐：V1 保留批量治理。**

授权管理人员在 permission + data scope 覆盖时可批量：

- 进入公海；
- 继续当前 owner；
- 直接移交 / 指定分配。

批量操作必须：

- 每个 Customer 独立重新校验当前 owner、保护事实、目标资格和 scope；
- 不因批量动作绕过任何未完成责任 Guard；
- 允许部分成功；
- 返回每个 Customer 的成功 / 失败结果与原因；
- 只对成功项产生 owner / public-pool mutation 和审计。

**B｜V1 不做批量治理，只允许逐个 Customer 处理。**

## P17-B4-07｜进入公海 / owner 释放是否强制填写原因｜CHOICE=A / USER_APPROVED / APPLIED

R6 当前历史规则为：

> 原因 / 备注默认可选填，不强制。

**A｜推荐：保持原因可选。**

- 核心审计仍必须保存 before / after / actor / time；
- 可填写原因 / 备注，但不作为动作成功硬门槛。

**B｜仅管理者强制进入公海 / 强制移交时要求原因；owner 自主释放可选。**

**C｜所有释放 / 入公海 / 指定移交都强制填写原因。**

## P17-B4-08｜Collaboration scope 是否继续只保留两级｜CHOICE=A / USER_APPROVED / APPLIED

历史正式规则已经存在两层：

1. 具体业务级 Collaboration；
2. Customer-level Collaboration。

**A｜推荐：V1 继续只保留这两级，不再增加第三套细粒度 scope 枚举。**

- 具体业务级只访问 / 操作该业务必要内容；
- Customer-level 可访问更完整的 Customer CRM，但仍服从自身 permission + data scope；
- 读 / 写具体能力继续由 permission/capability 与业务对象状态控制，不在 Collaboration 再造一套“只读/可跟进/可交易”等权限系统。

**B｜在 Collaboration 内继续增加细粒度 scope 枚举。**

- 例如只读、可跟进、可咨询、可交易等；
- 会形成第二层权限配置体系。

## P17-B4-09｜公海领取前敏感信息可见性｜CHOICE=A / USER_APPROVED / APPLIED

R6 明确存在历史规则：

> 公海领取前只展示必要摘要，手机号等敏感信息默认隐藏。

Batch 1 尚未把这一字段级 object-state Guard 完整写入。

**A｜推荐：恢复并冻结。**

对普通公海 claimant：

- 领取前只展示判断是否领取所需的最小必要摘要；
- 手机号、完整联系方式、私密备注及其他敏感 CRM 字段默认不因“能看公海列表”而开放；
- 领取成功成为 current owner 后，再按正常 CRM permission + data scope 返回；
- 授权管理人员的治理查看仍按 PDM-02 独立敏感字段 permission + data scope 计算。

**B｜只要有公海查看权，就按本人一般 CRM permission 返回完整客户字段。**

- 不额外设置“领取前敏感字段隐藏”的 object-state 限制。

---

## 10.1 Batch 4 推荐组合

当前证据与最小复杂度下，推荐：

> **1A、2A、3A、4A、5A、6A、7A、8A、9A**

其中：

- 1A 是新的运营主次选择，不删除主动领取；
- 2A、6A、9A 是重要历史规则 / 语义缺口恢复；
- 3A、4A、5A 避免在没有可靠证据时硬编码数值；
- 7A 延续 R6 当前审计规则；
- 8A 避免 Collaboration 再造第二套 permission 系统。

当前唯一下一步：

> **P17-B4-01～P17-B4-09 已按 1A～9A 批准并执行。当前进入 Final 前完整性复核 R1。**

---

## 10.2 Batch 4 Gate｜PASS

- 用户裁决：`1A、2A、3A、4A、5A、6A、7A、8A、9A`；
- 用户随后明确“确认执行”；
- `P17-B4-01～P17-B4-09 = PASS / USER_APPROVED / APPLIED`；
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`；
- 6 / 6 incoming handoff 继续 `HANDOFF_ACCEPTED`；
- IA / Low-Fi / Engineering 未施工。
