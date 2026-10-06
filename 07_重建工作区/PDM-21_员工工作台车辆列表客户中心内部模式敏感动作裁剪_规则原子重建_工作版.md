# PDM-21｜员工工作台 / 车辆列表 / 客户中心 / 内部模式 / 敏感动作裁剪｜规则原子重建工作版

> 当前状态：`IN_PROGRESS / STARTUP_GATE_PASS / BATCH_1_PENDING_USER_REVIEW`  
> 核心定位：`P21-R00 = USER_APPROVED / APPLIED`  
> Incoming Handoff：19 / 19 `HANDOFF_ACCEPTED`  
> IA / Low-Fi / Engineering：`NO_CONSTRUCTION`

---

# 1. P21-R00｜核心定位｜USER_APPROVED / APPLIED

PDM-21 是：

> **员工端产品体验、工作台编排与 Employee Action Projection（员工真实业务动作投影）的唯一 Authority。**

负责：

- E01 工作台；
- E02 车源列表、员工车辆详情、发布/编辑、内部模式及真实敏感动作入口；
- E03 客户中心 / CRM 员工端投影；
- E04 我的；
- E05 找车服务；
- E06 咨询；
- E07 Lock / Waitlist / Deposit / Transaction / Refund 员工端投影；
- E08 公海 / 待公海 / Collaboration（协作）员工端投影；
- 员工端导航、卡片、优先级、状态展示、动作入口、确认流程、错误/空态/只读态；
- 4S 成员在同一员工端中的合法裁剪投影；
- completed PDM 业务对象在员工端的合法操作承载。

PDM-21 **不重新定义**：

- Customer identity / phone / owner；
- Employee identity / role / permission / data scope；
- Vehicle / source_type / listing_cycle / hidden / offline / sold；
- Model 主数据；
- Vehicle Archive / 车况事实；
- 图片资产化状态机；
- 上游电话身份与缓存 Authority；
- Price / internal price / price-check entitlement / quota；
- Application / Demand；
- Matching / Rule Dictionary；
- Priority；
- Recommendation；
- Consultation；
- CRM / Customer Opportunity / Source Radar 的底层对象语义；
- Public Pool / Collaboration 生命周期；
- LockRequest / Lock / Waitlist；
- Deposit / Transaction / Refund；
- PC 配置、Notification、统一审计底层实现。

上述业务真相必须读取 PDM-01～PDM-20 已完成 Authority。PDM-21 只决定：

> **员工在什么页面看到什么、从哪里进入、以什么优先级处理、什么动作入口可见，以及提交时如何消费真实业务 Guard。**

页面、卡片、按钮、内部模式或工作台排序不得反向创造新的 Domain 主状态、权限或责任关系。

---

# 2. Startup Gate｜PASS

## 2.1 Current Authority Refresh

已重新读取并对齐：

- 9/19 R10《客户端 + 员工端核心体验 / IA》；
- 9/19 R11《员工内部模式 / 敏感操作能力》；
- 001～078：M15（员工权限 / 内部模式）、M17（CRM / 工作台 / Source Radar）以及相关 M16/M13/M14；
- Current IA：Page Manifest / Navigation / Action / State 等员工端 carrier；
- PDM-01～PDM-20 正式 Final；
- CROSS_PDM_HANDOFF_REGISTER 中 target=PDM-21 的全部 handoff。

结果：

- `COMPLETED_PDM_HARD_CONFLICT = 0`
- `INCOMING_HANDOFF_GAP = 0`
- `INCOMING_HANDOFF_COUNT = 19`
- `INCOMING_HANDOFF_ACCEPTED = 19`
- `GLOBAL_INVARIANT_CONFLICT = 0`
- `IA_LOWFI_ENGINEERING_CONSTRUCTION = NO`

## 2.2 Incoming Handoff｜19 / 19 ACCEPTED

1. `HO-P02-P21-001`｜员工端页面 / Internal Mode 只做投影，不把入口可见性当授权；4S 按当前 hard DENY 与合法管理范围裁剪。
2. `HO-P03-P21-001`｜员工分享入口与绑定销售上下文的交互投影。
3. `HO-P04-P21-001`｜员工车辆详情、source_type、一键转名邦、隐藏/上下架等真实操作入口。
4. `HO-P05-P21-001`｜员工车型选择、MODEL_MISSING、固定属性自动带出、待确认/冲突状态投影。
5. `HO-P06-P21-001`｜新增车源、草稿、VIN 重复提示、MODEL_MISSING、保存修改、source_type 选择/草稿修改。
6. `HO-P07-P21-001`｜档案上传/后补/替换/作废/历史/核验/customer_visible 与 4S 范围。
7. `HO-P08-P21-001`｜人工图片上传/删除/排序、资产化状态、失败重试/人工恢复；区分不同图片失败生命周期。
8. `HO-P09-P21-001`｜上游电话区域、缓存/最新/失败+缓存/拨打/不复制，以及 source_type 电话入口裁剪。
9. `HO-P10-P21-001`｜正常价格字段编辑、内部价 permission、override、临时查价次数、UNLIMITED 边界、4S 价格编辑。
10. `HO-P11-P21-001`｜找车申请待办、人工激活 Demand、Demand 详情、状态动作与 ending request。
11. `HO-P12-P21-001`｜匹配描述解析、标准条件、重算、四级结果、confirmation_needed 人工确认及失败/stale 边界。
12. `HO-P13-P21-001`｜Priority 待处理/active 视图、TTL、释放 Priority、Recommendation 组合入口边界。
13. `HO-P14-P21-001`｜Recommendation create/batch/end/void 真人动作与 Guard。
14. `HO-P15-P21-001`｜Consultation 工作台、真人动作与 SLA 工作台优先级。
15. `HO-P16-P21-001`｜CRM list/detail、跟进、客户机会、Source Radar carrier 与三类语义分离。
16. `HO-P17-P21-001`｜公海 / 待公海真人操作、主动领取、批量治理、Collaboration 投影。
17. `HO-P18-P21-001`｜LockRequest 待处理与 Lock/Waitlist 管理。
18. `HO-P19-P21-001`｜Deposit / Transaction / Refund / correction 员工端 Action Contract 与敏感字段裁剪。
19. `HO-P20-P21-001`｜Employee Vehicle Feed / Detail 与客户端占用投影对应，但不得复用客户侧身份文案或泄露客户/资金详情。

## 2.3 Completed-PDM Dependency Card｜已完成 PDM 强制依赖卡

| 依赖 PDM | 约束对象 | 当前有效规则 | PDM-21 可补充 | PDM-21 不可改写 |
|---|---|---|---|---|
| PDM-01 | Customer / phone / account | 客户稳定身份、手机号门槛、停用边界 | 员工端身份/手机号状态展示与合法动作入口 | customer_id、手机号事实、账户状态 |
| PDM-02 | Employee / role / permission / scope | 身份、角色、permission、data scope、4S/System Admin 边界 | 页面裁剪、入口显隐、提交重验 | 权限来源、角色树、System Admin 业务权 |
| PDM-03 | owner / share / referral | owner 与分享/转介绍归属 | 员工分享入口与结果投影 | owner 归属规则 |
| PDM-04 | Vehicle / source / listing_cycle | 三类车源、生命周期、转换与状态 | 员工车辆页面与合法动作入口 | vehicle_id/source/listing_cycle 真相 |
| PDM-05 | Model | 车型主数据与 MODEL_MISSING | 选择器与状态显示 | 主数据层级与映射真相 |
| PDM-06 | Manual Vehicle / Draft | 发布、草稿、VIN duplicate、source_type | 发布/编辑工作流 UI | 正式 Vehicle 生命周期 |
| PDM-07 | Archive / Condition | 档案、版本、可见性、来源 | 员工上传/核验/替换入口 | 档案事实与 provenance |
| PDM-08 | Image | 图片资产、冻结、转存、恢复 | 图片操作与状态反馈 | 资产化状态机 |
| PDM-09 | Publisher Phone | upstream_publisher_id、缓存、latest | 电话区域与动作投影 | 电话身份/缓存 Authority |
| PDM-10 | Price | 客户价、内部价、override、quota | 员工价格编辑/查看/追加入口 | 价格公式、权益、permission 真相 |
| PDM-11 | Application / Demand | 申请、人工激活、Demand 生命周期 | 工作台与 E05 操作承载 | Demand 状态机 |
| PDM-12 | Matching | parser、标准条件、四级结果、确认 | E05 匹配/确认交互 | Matching 结果与 Rule Dictionary |
| PDM-13 | Priority | 仲裁、TTL、释放、责任 | Priority 工作台投影 | Priority 创建/仲裁/TTL 真相 |
| PDM-14 | Recommendation | create/end/void/visibility | 真人操作入口与批量 UI | Recommendation 生命周期 |
| PDM-15 | Consultation | 四主状态、assignee、真实首次响应、SLA事实 | E06 与工作台编排 | Consultation 生命周期 |
| PDM-16 | CRM | CRM、Opportunity、Source Radar 对象边界 | E03/E01 carrier 与操作入口 | CRM 对象语义 |
| PDM-17 | Public Pool / Collaboration | 进入/退出/领取/分配/协作 | E08 真人操作承载 | owner/public-pool 生命周期 |
| PDM-18 | LockRequest / Lock / Waitlist | 申请审批、Lock、候补、延期/释放 | E07 与工作台操作 | Lock/Waitlist 状态机 |
| PDM-19 | Deposit / Transaction / Refund | 资金、交易、退款、纠错 | E07 员工端 Action Projection | 资金/交易真相 |
| PDM-20 | Customer Safe Projection | 客户端安全投影与占用文案 | 员工端对应视图但更严格区分内部字段 | 客户端 Authority / Customer Safe 规则 |

## 2.4 Global Invariant Gate

PDM-21 全程必须保持：

1. 页面可见 ≠ 获得 permission。
2. Internal Mode（内部模式）≠ 获得敏感操作权。
3. System Admin 身份 ≠ 员工业务执行权。
4. 4S 使用同一员工端，但只在当前合法数据范围与能力内裁剪，不建立第二套 App。
5. 所有 mutation（写操作）提交时重新校验 identity + permission/capability + data scope + object state。
6. 员工端不得用 UI 状态创造 Customer owner、Demand、Priority、Recommendation、Consultation、Lock、Transaction 等主状态。
7. 历史 actor / uploader / recommender / assignee 不等于永久当前操作权。
8. Employee Vehicle Feed 不得泄露 Customer 姓名/手机号、Deposit 金额、详细 Transaction 进度等非必要敏感信息。
9. IA / Low-Fi 当前只作为 carrier 证据；与 Final 冲突时标 stale，不反向覆盖 Final。
10. 本阶段不修改 IA / Low-Fi / Engineering。

## 2.5 Current Implementation Fact

当前仓库能证明的是：

- Current IA / Low-Fi 已存在 E01～E08 员工端页面 carrier；
- Page / Navigation / Action / State 中存在部分真实入口与状态；
- 当前存在多处 stale carrier、导航缺口和动作承载缺口；
- 本轮是产品规则 Authority 重建，不把现有 IA/Low-Fi 自动视为正确实现；
- 未读取到可把“当前页面已画出”直接等同于“工程代码已实现并验收”的证据。

因此：

> `CURRENT_IMPLEMENTATION_FACT = CARRIER_EXISTS / ENGINEERING_IMPLEMENTATION_NOT_ASSUMED`

## 2.6 已识别但不在 Startup Gate 偷渡裁决的冲突 / 缺口

以下只登记，进入 Batch 2 / 3 / 4 或 Final 前完整性复核：

- R10 旧“名邦员工进入内部模式即可直接看内部价”不得覆盖 PDM-02/PDM-10 当前独立内部价 permission；
- Current 将 4S 整体挡在 E02-M01 外，与“同一员工端 + 4S 合法车辆管理裁剪”存在 carrier 冲突；
- 一键转名邦旧/Current 中独立 `vehicle.convert_mingbang` permission 不得恢复；
- 客户安全详情与内部敏感 Action 的页面层级存在 Current Navigation / Page 语义错位；
- 员工端正常价格编辑、override、临时追加次数等入口承载不完整；
- Internal Mode 自动退出/重验生命周期 carrier 不完整；
- “更多 → 隐藏车源”入口存在历史规则但 Current 主导航缺失；
- 一键转名邦确认流程与后果说明 carrier 不完整；
- CRM 直接“从客户锁车”旧流程被 Current 恢复，但历史已明确删除；
- 旧“我要这辆车 → 咨询类工作台任务”不得恢复，LockRequest/Consultation 必须按当前独立 Authority；
- E01 → 客户机会 / Source Radar / Radar detail 主导航不完整；
- pending 找车申请工作台卡片、Priority 工作台投影、Consultation SLA 优先队列、公海入口存在 carrier 缺口；
- 客户机会/最近行为“只做聚合兴趣、不做逐点击监控”的隐私 Guard 承载不完整；
- Current / Low-Fi 中旧状态名、旧权限词、旧 Action Guard 仅作为待对齐 carrier，不在本 Gate 直接改 IA。

---

# 3. Batch 1｜稳定基础规则候选

> 状态：`PENDING_USER_REVIEW`。  
> 原则：只纳入已有 Authority/历史稳定、且与 PDM-01～20 Final 不冲突的员工端基础规则；已发现冲突项不偷渡进 Batch 1。

## P21-A01｜员工端只做真实业务对象的操作投影

员工端页面必须消费 PDM-01～20 的当前 Authority。

- 页面状态不创造 Domain 主状态；
- 按钮出现不等于获得 permission；
- 前端卡片的“待处理/紧急/历史”只是工作台/展示分类，不能反写底层对象生命周期；
- 所有真实写操作以对应 PDM 的 Action Guard 为准。

## P21-A02｜员工端一级结构保持 E01～E04，业务模块保持 E05～E08

一级 Tab：

> **E01 工作台｜E02 车源｜E03 客户｜E04 我的**

业务模块：

> **E05 找车｜E06 咨询｜E07 锁车/交易｜E08 公海**

4S 成员继续使用同一员工端，不建立独立 App；具体页面和动作按 PDM-02 与各业务 Authority 裁剪。

## P21-A03｜E01 工作台必须分离三类语义

E01 同时承载但不得混为一种对象：

1. **强待办 / 今日必须处理**：来自真实业务责任与时效；
2. **客户机会**：聚合兴趣 / 机会信号，不是强制工单；
3. **Source Radar（车源雷达）**：围绕 Demand 的匹配变化发现，不是通用客户机会。

三类可以在同一工作台展示，但不能共享一套 task/state lifecycle。

## P21-A04｜接客状态唯一切换入口放在 E01 顶部

- 员工本人可在 E01 顶部切换“接客中 / 暂停接客”；
- E04“我的”只展示当前接客状态，不重复第二个切换入口；
- 是否允许切换、最后一名接客员工保护等继续服从 PDM-02 当前规则；
- 切换只影响未来自动接客资格，不反写既有 owner / 业务责任。

## P21-A05｜E02 车辆列表职责是找车与进入详情，不堆敏感快捷经营动作

E02 可复用客户端基础搜索 / 筛选 / 排序结构，并叠加员工合法字段。

列表卡片不直接堆：

- Recommendation mutation；
- Lock mutation；
- 隐藏/恢复；
- 上下架；
- 内部价格修改；
- 电话刷新等敏感快捷按钮。

这些动作进入详情或对应业务上下文后再按 Guard 执行。

## P21-A06｜员工车辆详情默认使用客户安全视图

员工打开 E02-01 时默认不返回/展示：

- 内部价 / 批发价；
- 上游电话；
- 完整敏感原件；
- 员工内部备注；
- 其他仅内部模式或专属业务上下文可见字段。

客户安全视图不能只靠前端遮挡；敏感字段返回仍必须服从当前身份、模式、permission 与 data scope。

## P21-A07｜Internal Mode 是临时敏感能力承载层，不是权限系统

- 进入 Internal Mode 本身不授任何新 permission；
- 进入后每个字段/动作分别读取 PDM-02/PDM-04/PDM-09/PDM-10 等真实 Authority；
- 离开当前车辆访问过程后恢复客户安全投影；
- 页面重新进入、车辆切换、身份/权限变化后必须重新判定；
- 具体 4S 的同页裁剪方式留后续冲突/缺口批次处理，不在本 Atom 偷渡。

## P21-A08｜员工车辆详情外层只保留明确高频业务入口

当业务上下文与 Guard 合法时，车辆详情外层可提供：

> **推荐给客户｜锁车**

二者不要求先进入 Internal Mode，但提交时必须重新校验真实 Recommendation / Lock Authority。

内部价格、电话、车辆管理等敏感内部能力不得因此暴露到客户安全外层。

## P21-A09｜员工分享车源只走安全分享与归因，不授业务权益

- 员工从合法车辆详情发起分享；
- 分享链接只携带必要安全归因；
- Customer owner 变化服从 PDM-03；
- 分享本身不创建 Recommendation；
- 不赠送价格查看权；
- 不传播 Internal Mode / 电话 / 内部价等员工权限；
- 打开旧分享仍重新校验当前 Vehicle/Customer 可见性。

## P21-A10｜E03 是员工 CRM 客户中心，不重建 CRM 对象

E03 负责员工查看和操作 PDM-16 已冻结的 CRM 事实：

- 客户基础资料；
- 当前业务概览；
- 跟进；
- 客户画像；
- 业务历史；
- 聚合兴趣 / 机会。

E03 页面不得自己创造新的 Customer owner、CRM 主状态或业务状态机。

## P21-A11｜Personal Note 与 Shared Profile 在员工端继续严格分区

- Personal Note 只属于作者本人，owner 变化不转移；
- Shared Profile 按 PDM-16 的 owner / Collaboration / 管理范围维护；
- 不恢复历史“大字段 CRM 画像模型”；
- 最近行为只展示聚合兴趣/业务机会，不默认开放逐点击流水或完整收藏明细。

## P21-A12｜E05 找车申请与正式 Demand 必须分开承载

- pending Application 进入负责员工待处理上下文；
- 卡片只进入申请详情，不允许一键把卡片直接变成 active Demand；
- 正式激活必须经过 PDM-11 的合法人工处理；
- E05 Demand 详情展示原始需求、销售匹配描述、标准条件、业务说明、CRM/候选上下文；
- active / paused / completed / cancelled 等状态动作只消费 PDM-11 Authority。

## P21-A13｜员工端 Matching 只负责输入、解释、确认与重算

E05-04 / E05-05 / E05-06 承载：

> 销售匹配描述 → 确定性解析 → 标准条件 → 重算 → 四级 Match Result → 解释 → confirmation_needed 人工确认。

人工确认只能补充/确认事实后触发重算，再读取新的正式结果；不得由 UI 直接把 confirmation_needed 改成 Match 成功、Priority 或 Recommendation。

## P21-A14｜Priority 在员工端是系统事实的待处理投影，不提供人工创建器

员工端可显示：

- Vehicle；
- Customer；
- trigger Demand；
- Match tier；
- 当前 responsible employee；
- TTL / expires_at；
- 必要历史。

合法员工可按 PDM-13 处理释放/不推荐等动作；不得提供：

- 人工创建 Priority；
- 手工转给其他 Customer；
- override；
- 修改 expires_at；
- 人工续期；
- 恢复 ended Priority。

## P21-A15｜Recommendation 员工端保留三类真人入口，底层逐车校验

合法入口可来自：

1. 车辆详情；
2. CRM 客户详情；
3. 找车候选上下文。

批量推荐 UI 可以一次选择多车，但底层必须逐车执行 Recommendation Guard 与幂等 create/reuse；end/void 同样重新验证当前操作权。

## P21-A16｜Consultation 工作台与 E06 必须消费同一 Consultation Authority

- E01 可按 Consultation SLA 事实形成工作台优先级；
- PDM-21 负责“已超时 > 即将超时 > 新咨询/新服务意向”的展示编排；
- “即将超时”的具体阈值若证据不足，留后续产品选择，不在 Batch 1 写死；
- 开始处理、记录跟进、解决、无效、正常关闭、转派等动作服从 PDM-15；
- 打开/已读/转派不得误算为首次真实响应。

## P21-A17｜E07 对 LockRequest / Lock / Waitlist 只做员工操作承载

员工端可以承载：

- LockRequest PENDING 审批；
- 正式 Lock 创建/查看；
- 普通 Lock 延期；
- 人工 release/cancel；
- Waitlist 查看/结束；
- 合法 responsible handoff。

所有动作提交时按 PDM-18 重验；V1 不新增批量 Lock/approve/release/extension/Waitlist mutation。

## P21-A18｜E07 的交易资金动作严格读取 PDM-19 Action Contract

员工端可承载：

- 记录真实 Deposit；
- Deposit correction；
- Transaction create / complete / cancel / correct；
- Refund create / 实际退款确认 / pending close + reason；
- supply anomaly 后的 cancel / change-car / refund；
- Transaction responsible handoff。

资金、退款、交易纠错不得因页面入口存在而放宽 permission/capability。

## P21-A19｜E08 承载公海/待公海真人治理，后台分配为主、主动领取弱化

- 指定分配 / 人工治理是主要路径；
- 主动领取保留，但受 permission/config 与真实保护事实约束；
- 承载待公海三向处理、主动领取、批量治理、Collaboration 建立/结束/范围操作；
- E08 不重建 owner/public-pool/Collaboration 生命周期，全部服从 PDM-17。

## P21-A20｜员工端占用信息比客户端更可操作，但仍不得泄露无关客户/资金细节

Employee Vehicle Feed / Detail 可以读取 Lock / Transaction 等真实占用事实用于工作，但：

- 占用展示优先级保持 `trading > locked`；
- 列表不得泄露无关 Customer 姓名、手机号；
- 不显示非必要 Deposit 金额；
- 不把 Transaction 内部详细进度暴露成列表标签；
- 不直接复用客户端“我的锁车 / 我的候补”等第一人称客户文案；
- 真实动作继续进入 PDM-18/PDM-19 Authority。

---

# 4. Batch 1 Gate

当前：

- `P21-A01～P21-A20 = PENDING_USER_REVIEW`
- `STABLE_RULE_CONFLICT_COUNT = 0`
- `DUPLICATE_BUSINESS_AUTHORITY = 0`
- `INCOMING_HANDOFF_ACCEPTED = 19 / 19`
- `IA_LOWFI_ENGINEERING_CONSTRUCTION = NO`

当前唯一下一步：

> **用户审查 P21-A01～P21-A20。未经用户批准与后续明确执行，不得进入 Batch 2。**
