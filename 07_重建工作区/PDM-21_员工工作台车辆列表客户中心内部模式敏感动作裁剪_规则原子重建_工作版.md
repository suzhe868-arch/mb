# PDM-21｜员工工作台 / 车辆列表 / 客户中心 / 内部模式 / 敏感动作裁剪｜规则原子重建工作版

> 当前状态：`IN_PROGRESS / BATCH_3_PASS / BATCH_4_PENDING_USER_REVIEW`  
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

# 3. Batch 1｜稳定基础规则｜PASS / USER_APPROVED / APPLIED

> 状态：`PASS / USER_APPROVED / APPLIED`。  
> 用户裁决：`P21-A01～P21-A20 = 全部同意`；随后明确“确认执行”。  
> 原则：只纳入已有 Authority/历史稳定、且与 PDM-01～20 Final 不冲突的员工端基础规则；已发现冲突项不偷渡进 Batch 1。

## P21-A01｜员工端只做真实业务对象的操作投影｜USER_APPROVED / APPLIED

员工端页面必须消费 PDM-01～20 的当前 Authority。

- 页面状态不创造 Domain 主状态；
- 按钮出现不等于获得 permission；
- 前端卡片的“待处理/紧急/历史”只是工作台/展示分类，不能反写底层对象生命周期；
- 所有真实写操作以对应 PDM 的 Action Guard 为准。

## P21-A02｜员工端一级结构保持 E01～E04，业务模块保持 E05～E08｜USER_APPROVED / APPLIED

一级 Tab：

> **E01 工作台｜E02 车源｜E03 客户｜E04 我的**

业务模块：

> **E05 找车｜E06 咨询｜E07 锁车/交易｜E08 公海**

4S 成员继续使用同一员工端，不建立独立 App；具体页面和动作按 PDM-02 与各业务 Authority 裁剪。

## P21-A03｜E01 工作台必须分离三类语义｜USER_APPROVED / APPLIED

E01 同时承载但不得混为一种对象：

1. **强待办 / 今日必须处理**：来自真实业务责任与时效；
2. **客户机会**：聚合兴趣 / 机会信号，不是强制工单；
3. **Source Radar（车源雷达）**：围绕 Demand 的匹配变化发现，不是通用客户机会。

三类可以在同一工作台展示，但不能共享一套 task/state lifecycle。

## P21-A04｜接客状态唯一切换入口放在 E01 顶部｜USER_APPROVED / APPLIED

- 员工本人可在 E01 顶部切换“接客中 / 暂停接客”；
- E04“我的”只展示当前接客状态，不重复第二个切换入口；
- 是否允许切换、最后一名接客员工保护等继续服从 PDM-02 当前规则；
- 切换只影响未来自动接客资格，不反写既有 owner / 业务责任。

## P21-A05｜E02 车辆列表职责是找车与进入详情，不堆敏感快捷经营动作｜USER_APPROVED / APPLIED

E02 可复用客户端基础搜索 / 筛选 / 排序结构，并叠加员工合法字段。

列表卡片不直接堆：

- Recommendation mutation；
- Lock mutation；
- 隐藏/恢复；
- 上下架；
- 内部价格修改；
- 电话刷新等敏感快捷按钮。

这些动作进入详情或对应业务上下文后再按 Guard 执行。

## P21-A06｜员工车辆详情默认使用客户安全视图｜USER_APPROVED / APPLIED

员工打开 E02-01 时默认不返回/展示：

- 内部价 / 批发价；
- 上游电话；
- 完整敏感原件；
- 员工内部备注；
- 其他仅内部模式或专属业务上下文可见字段。

客户安全视图不能只靠前端遮挡；敏感字段返回仍必须服从当前身份、模式、permission 与 data scope。

## P21-A07｜Internal Mode 是临时敏感能力承载层，不是权限系统｜USER_APPROVED / APPLIED

- 进入 Internal Mode 本身不授任何新 permission；
- 进入后每个字段/动作分别读取 PDM-02/PDM-04/PDM-09/PDM-10 等真实 Authority；
- 离开当前车辆访问过程后恢复客户安全投影；
- 页面重新进入、车辆切换、身份/权限变化后必须重新判定；
- 具体 4S 的同页裁剪方式留后续冲突/缺口批次处理，不在本 Atom 偷渡。

## P21-A08｜员工车辆详情外层只保留明确高频业务入口｜USER_APPROVED / APPLIED

当业务上下文与 Guard 合法时，车辆详情外层可提供：

> **推荐给客户｜锁车**

二者不要求先进入 Internal Mode，但提交时必须重新校验真实 Recommendation / Lock Authority。

内部价格、电话、车辆管理等敏感内部能力不得因此暴露到客户安全外层。

## P21-A09｜员工分享车源只走安全分享与归因，不授业务权益｜USER_APPROVED / APPLIED

- 员工从合法车辆详情发起分享；
- 分享链接只携带必要安全归因；
- Customer owner 变化服从 PDM-03；
- 分享本身不创建 Recommendation；
- 不赠送价格查看权；
- 不传播 Internal Mode / 电话 / 内部价等员工权限；
- 打开旧分享仍重新校验当前 Vehicle/Customer 可见性。

## P21-A10｜E03 是员工 CRM 客户中心，不重建 CRM 对象｜USER_APPROVED / APPLIED

E03 负责员工查看和操作 PDM-16 已冻结的 CRM 事实：

- 客户基础资料；
- 当前业务概览；
- 跟进；
- 客户画像；
- 业务历史；
- 聚合兴趣 / 机会。

E03 页面不得自己创造新的 Customer owner、CRM 主状态或业务状态机。

## P21-A11｜Personal Note 与 Shared Profile 在员工端继续严格分区｜USER_APPROVED / APPLIED

- Personal Note 只属于作者本人，owner 变化不转移；
- Shared Profile 按 PDM-16 的 owner / Collaboration / 管理范围维护；
- 不恢复历史“大字段 CRM 画像模型”；
- 最近行为只展示聚合兴趣/业务机会，不默认开放逐点击流水或完整收藏明细。

## P21-A12｜E05 找车申请与正式 Demand 必须分开承载｜USER_APPROVED / APPLIED

- pending Application 进入负责员工待处理上下文；
- 卡片只进入申请详情，不允许一键把卡片直接变成 active Demand；
- 正式激活必须经过 PDM-11 的合法人工处理；
- E05 Demand 详情展示原始需求、销售匹配描述、标准条件、业务说明、CRM/候选上下文；
- active / paused / completed / cancelled 等状态动作只消费 PDM-11 Authority。

## P21-A13｜员工端 Matching 只负责输入、解释、确认与重算｜USER_APPROVED / APPLIED

E05-04 / E05-05 / E05-06 承载：

> 销售匹配描述 → 确定性解析 → 标准条件 → 重算 → 四级 Match Result → 解释 → confirmation_needed 人工确认。

人工确认只能补充/确认事实后触发重算，再读取新的正式结果；不得由 UI 直接把 confirmation_needed 改成 Match 成功、Priority 或 Recommendation。

## P21-A14｜Priority 在员工端是系统事实的待处理投影，不提供人工创建器｜USER_APPROVED / APPLIED

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

## P21-A15｜Recommendation 员工端保留三类真人入口，底层逐车校验｜USER_APPROVED / APPLIED

合法入口可来自：

1. 车辆详情；
2. CRM 客户详情；
3. 找车候选上下文。

批量推荐 UI 可以一次选择多车，但底层必须逐车执行 Recommendation Guard 与幂等 create/reuse；end/void 同样重新验证当前操作权。

## P21-A16｜Consultation 工作台与 E06 必须消费同一 Consultation Authority｜USER_APPROVED / APPLIED

- E01 可按 Consultation SLA 事实形成工作台优先级；
- PDM-21 负责“已超时 > 即将超时 > 新咨询/新服务意向”的展示编排；
- “即将超时”的具体阈值若证据不足，留后续产品选择，不在 Batch 1 写死；
- 开始处理、记录跟进、解决、无效、正常关闭、转派等动作服从 PDM-15；
- 打开/已读/转派不得误算为首次真实响应。

## P21-A17｜E07 对 LockRequest / Lock / Waitlist 只做员工操作承载｜USER_APPROVED / APPLIED

员工端可以承载：

- LockRequest PENDING 审批；
- 正式 Lock 创建/查看；
- 普通 Lock 延期；
- 人工 release/cancel；
- Waitlist 查看/结束；
- 合法 responsible handoff。

所有动作提交时按 PDM-18 重验；V1 不新增批量 Lock/approve/release/extension/Waitlist mutation。

## P21-A18｜E07 的交易资金动作严格读取 PDM-19 Action Contract｜USER_APPROVED / APPLIED

员工端可承载：

- 记录真实 Deposit；
- Deposit correction；
- Transaction create / complete / cancel / correct；
- Refund create / 实际退款确认 / pending close + reason；
- supply anomaly 后的 cancel / change-car / refund；
- Transaction responsible handoff。

资金、退款、交易纠错不得因页面入口存在而放宽 permission/capability。

## P21-A19｜E08 承载公海/待公海真人治理，后台分配为主、主动领取弱化｜USER_APPROVED / APPLIED

- 指定分配 / 人工治理是主要路径；
- 主动领取保留，但受 permission/config 与真实保护事实约束；
- 承载待公海三向处理、主动领取、批量治理、Collaboration 建立/结束/范围操作；
- E08 不重建 owner/public-pool/Collaboration 生命周期，全部服从 PDM-17。

## P21-A20｜员工端占用信息比客户端更可操作，但仍不得泄露无关客户/资金细节｜USER_APPROVED / APPLIED

Employee Vehicle Feed / Detail 可以读取 Lock / Transaction 等真实占用事实用于工作，但：

- 占用展示优先级保持 `trading > locked`；
- 列表不得泄露无关 Customer 姓名、手机号；
- 不显示非必要 Deposit 金额；
- 不把 Transaction 内部详细进度暴露成列表标签；
- 不直接复用客户端“我的锁车 / 我的候补”等第一人称客户文案；
- 真实动作继续进入 PDM-18/PDM-19 Authority。

---

# 4. Batch 1 Gate｜PASS

- `P21-A01～P21-A20 = PASS / USER_APPROVED / APPLIED`
- `STABLE_RULE_CONFLICT_COUNT = 0`
- `DUPLICATE_BUSINESS_AUTHORITY = 0`
- `INCOMING_HANDOFF_ACCEPTED = 19 / 19`
- `IA_LOWFI_ENGINEERING_CONSTRUCTION = NO`

---

# 5. Batch 2｜明确废弃 / 已替代 / DO_NOT_RESTORE｜PASS / USER_APPROVED / APPLIED

> 状态：`PASS / USER_APPROVED / APPLIED`。  
> 用户裁决：`P21-B2-01～P21-B2-09 = 全部同意`；并在同一消息中明确“确认执行”。  
> Reverse Conflict Scan：`PASS / FALSE_DEPRECATION_COUNT = 0`。  
> 本批只放已经被 completed PDM 或后续明确裁决替代的旧模型；仍需要产品选择的 4S Internal Mode 进入方式、敏感动作页面归位等不放入本批。

## P21-B2-01｜废弃“名邦员工进入 Internal Mode 即自动可看内部价 / 批发价”｜USER_APPROVED / APPLIED

旧 R11 / R10 曾写成：

> 名邦员工进入 Internal Mode 后即可查看内部价 / 批发价，不再单独设置权限。

该口径已被 PDM-02 / PDM-10 后续 Authority 明确覆盖：

- 查看名邦内部价 / 批发价恢复为独立 permission；
- 必须同时满足身份、内部模式、permission、data scope、object state；
- 4S 对名邦内部价 hard DENY；
- Internal Mode 本身不授该 permission。

因此旧“进入即看”不得恢复。

## P21-B2-02｜废弃“一键转名邦需要独立 vehicle.convert_mingbang permission”｜USER_APPROVED / APPLIED

Current / Low-Fi 曾重新出现 `vehicle.convert_mingbang` 之类独立权限表达。

当前 Authority 已明确：

- 不新增“一键转名邦”独立 permission；
- 是否可执行由名邦员工业务身份、数据范围、Vehicle source/state 与 4S hard DENY 等真实 Guard 决定；
- 普通名邦销售不因缺少虚构的 conversion permission 被阻断。

该独立 permission 不得恢复。

## P21-B2-03｜废弃“我要这辆车 → 咨询/客户服务工作台任务”的旧合并模型｜USER_APPROVED / APPLIED

旧 R10 曾把“我要这辆车”直接送入 Consultation / 客户服务待处理。

后续 Authority 已拆开：

- Consultation 服从 PDM-15；
- 客户锁车申请服从 PDM-18 LockRequest；
- LockRequest.PENDING 是独立真实对象与员工待处理；
- 不能再用一个“我要这辆车”工作项同时冒充 Consultation、LockRequest 或 Lock。

旧合并模型不得恢复。

## P21-B2-04｜废弃“CRM 客户详情 → 直接锁车 → 再选车辆”流程｜USER_APPROVED / APPLIED

R10 已明确删除从纯 Customer CRM 上下文直接发起“锁车后再选车”的快捷流程。

当前应当：

- 已明确 Vehicle 上下文时，从车辆详情 / 找车候选 / 合法业务上下文进入 Lock；
- E03 客户详情不得恢复无 Vehicle 上下文的“先锁车再选车”入口；
- Current IA 中 E03-01 → E03-06 的旧 carrier 不能反向成为业务 Authority。

## P21-B2-05｜废弃人工创建 / 改写 Priority 的员工端操作｜USER_APPROVED / APPLIED

PDM-13 已明确 Priority 由正式 Matching / 仲裁事实产生。

员工端不得恢复：

- 手工创建 Priority；
- 手工把 Priority 改给其他 Customer；
- 手工 override 仲裁；
- 手工修改 expires_at；
- 手工续期；
- 恢复 ended Priority。

员工端只消费并处理系统已形成的 Priority 事实。

## P21-B2-06｜废弃 confirmation_needed 在 UI 中直接变成“匹配成功 / Priority”｜USER_APPROVED / APPLIED

PDM-12 已明确：

- `confirmation_needed` 只是需要真人确认的 Match Result；
- 人工确认只补充 / 确认事实并触发重新计算；
- 重新计算后才读取新的正式 Match Result；
- UI 不得直接把确认候选写成 `high/acceptable`、Priority 或 Recommendation。

旧“确认按钮直接成功”流程不得恢复。

## P21-B2-07｜废弃“页面可见 / Internal Mode / 职位本身 = 已授权”｜USER_APPROVED / APPLIED

不得恢复任何以下授权捷径：

- 按钮显示即视为 permission；
- 进入 Internal Mode 即拥有所有敏感能力；
- 经理 / 店长职位天然获得所有敏感动作；
- System Admin 身份天然获得员工业务执行权；
- 历史 uploader / assignee / owner 身份天然永久获得当前操作权。

真实 mutation 始终服从当前 identity + permission/capability + data scope + object state。

## P21-B2-08｜废弃独立 4S App / 独立 4S 员工端 IA｜USER_APPROVED / APPLIED

PDM-02 已冻结：

> 4S 成员继续使用同一员工端，通过身份、permission、data scope、hard DENY 与对象状态做裁剪。

不得恢复：

- 独立 4S App；
- 第二套 4S 员工端 IA；
- 通过单独 App 绕开统一权限与数据范围体系。

这不等于 4S 拥有全部名邦能力；具体动作仍逐项裁剪。

## P21-B2-09｜废弃“Lock 释放后自动把 Waitlist 晋升为正式 Lock”｜USER_APPROVED / APPLIED

PDM-18 已明确：

- Waitlist 本身不占车；
- 原 Lock 释放后，不自动创建新的正式 Lock；
- 必须重新校验车辆、Customer、当前责任与 Lock Guard；
- 员工端只承载人工确认 / 合法重建流程。

注意：这与“竞争 LockRequest 失败后自动进入 Waitlist”的当前规则不是一回事；后者继续有效。

---

# 6. Batch 2 Gate｜PASS

- `P21-B2-01～P21-B2-09 = PASS / USER_APPROVED / APPLIED`
- `REVERSE_CONFLICT_SCAN = PASS`
- `FALSE_DEPRECATION_COUNT = 0`
- `PRODUCT_CHOICE_SMUGGLED_INTO_BATCH_2 = 0`
- `19 / 19 incoming handoff = HANDOFF_ACCEPTED`
- `IA_LOWFI_ENGINEERING_CONSTRUCTION = NO`

---

# 7. Batch 3｜已冻结上游语义的员工端补全｜PASS / USER_APPROVED / APPLIED

> 状态：`PASS / USER_APPROVED / APPLIED`。  
> 用户裁决：`P21-B3-01～P21-B3-10 = 全部同意`；随后明确“确认执行”。  
> Conflict Isolation：`PASS / MISCLASSIFIED_PRODUCT_CHOICE = 0`。  
> 本批只补“上游 completed PDM 已经把业务规则冻结，但员工端页面/导航/状态/动作承载不完整”的内容；不重新做业务裁决。

## P21-B3-01｜补齐 E01 → 客户机会 / Source Radar / Radar Event 的正式导航链｜USER_APPROVED / APPLIED

E01 工作台必须存在真实可达入口：

- E01 → 客户机会；
- E01 → Source Radar；
- Source Radar → Radar Event / 匹配详情；
- Radar Event 可进入当前合法 Recommendation 上下文或“标记不适合”。

以上只补员工端主 Journey，不新增 Opportunity / Radar 状态机。

## P21-B3-02｜补齐 pending Application 的“找车服务待处理”工作台卡片｜USER_APPROVED / APPLIED

严格消费 PDM-11 已冻结规则：

卡片至少显示：

- Customer；
- 想找什么车；
- 预算（如有）；
- 提交时间；
- 当前负责人；
- pending 状态。

唯一主动作：

> **处理申请 → E05 申请详情**

不得在工作台卡片上一键激活 Demand。Customer 修改同一 pending Application 时更新同一待办，不重复造任务。

## P21-B3-03｜补齐 Priority 员工待处理投影｜USER_APPROVED / APPLIED

员工工作台 / E05 应能安全展示当前合法 Priority：

- Vehicle；
- Customer；
- trigger Demand；
- Match tier；
- 当前 responsible employee；
- expires_at / TTL；
- 必要的 Recommendation / Lock 业务上下文。

可提供的真人动作只消费 PDM-13 当前 Authority，例如：

- 进入 Recommendation；
- 在合法条件下提前 release Priority；
- 进入相关 Vehicle / Demand 详情。

不得恢复任何人工创建/续期/改 TTL/override。

## P21-B3-04｜补齐 Consultation 工作台三层优先级排序｜USER_APPROVED / APPLIED

在 Consultation SLA 当前事实不变的前提下，E01 强待办按以下优先级展示：

1. **已超时**
2. **即将超时**
3. **新咨询 / 新服务意向**

排序只是员工工作台编排：

- 不改变 Consultation 主状态；
- 不改变 first response 事实；
- 不因排序产生新的 timeout 状态。

“即将超时”的具体时间阈值本批不写死，留 Batch 4 产品裁决。

## P21-B3-05｜补齐员工端上游电话真实状态投影｜USER_APPROVED / APPLIED

E02-01 / Internal Mode 中电话区域必须区分至少：

- latest 成功；
- cache available；
- latest failed + cached；
- unavailable / 无有效电话。

并保持：

- 只允许合法 source_type / publisher 上下文出现；
- 转名邦后不得因历史 upstream_publisher_id 继续出现上游电话入口；
- 4S source 不因历史 publisher 自动出现入口；
- 提供拨打，不提供复制；
- Internal Mode 本身不授电话能力。

## P21-B3-06｜补齐员工图片管理并分离不同失败生命周期｜USER_APPROVED / APPLIED

员工端人工图片能力至少承载：

- 上传；
- 删除；
- 排序；
- 资产化进度；
- 失败重试；
- 人工恢复。

必须区分：

1. 普通 CDN / 展示加载失败；
2. 批发 → 名邦图片资产化 partial_failed / failed；
3. 人工图片恢复 / recovered。

不得再用一个泛化 `IMAGE_RETRYING` 冒充所有图片生命周期；图片失败不得反向回滚已经完成的车辆来源转换。

## P21-B3-07｜补齐员工价格编辑、覆盖价与临时查价次数入口｜USER_APPROVED / APPLIED

员工端按 PDM-10 分开承载：

- 名邦 / 4S 正常 `customer_list_price` 编辑 → 随车辆“保存修改”；
- `internal_wholesale_price` 编辑 → 随车辆“保存修改”，但修改者必须具备内部价查看 permission；
- 客户展示价 override → 独立敏感动作；
- 给 LIMITED Customer 临时增加当天查价次数 → 独立受控动作；
- Customer 当前权益为 UNLIMITED 时，追加次数入口隐藏 / 禁用。

不得恢复独立“调价 permission / 调价动作”。

## P21-B3-08｜补齐人工车辆发布 / 编辑的员工端状态与动作链｜USER_APPROVED / APPLIED

E02-02 必须真实承载 PDM-05/PDM-06 已冻结的：

- 新增车源；
- 显式保存草稿；
- 草稿列表 / 恢复编辑；
- source_type 选择；
- 草稿阶段合法修改 source_type；
- 车型选择；
- MODEL_MISSING；
- VIN duplicate 提示 / Guard；
- 保存修改；
- 正式发布；
- 发布后继续补充非发布硬门槛资料。

正式 Vehicle 不提供普通物理删除入口。

## P21-B3-09｜补齐 CRM Follow-up 员工写入闭环｜USER_APPROVED / APPLIED

E03-03 不得再是“前一页能点记录跟进，但进入后只能读”的断链页面。

必须承载：

- 新增 Follow-up；
- 填写内容并提交；
- 成功后追加到时间线；
- correction / invalidation 使用追加式更正，不覆盖原记录；
- 原 actor / time / content 历史继续保留。

同时继续服从 PDM-16 的当前访问范围，owner 变化不改写历史跟进。

## P21-B3-10｜补齐 E08 公海 / Collaboration 员工端真实操作投影｜USER_APPROVED / APPLIED

E08 应承载 PDM-17 已冻结的真人动作入口：

- 查看公海；
- 合法主动领取；
- 待公海三向处理；
- 指定分配 / 人工治理结果的员工侧投影；
- Collaboration 建立 / 调整 scope / 结束；
- 进入 Customer 详情继续工作。

所有动作仍服从 PDM-17 的 owner/public-pool/Collaboration Authority；E08 不创建第二套 owner 或权限模型。

---

# 8. Batch 3 Conflict Isolation Gate｜PASS

- `P21-B3-01～P21-B3-10 = PASS / USER_APPROVED / APPLIED`
- `CONFLICT_ISOLATION = PASS`
- `MISCLASSIFIED_PRODUCT_CHOICE = 0`
- `COMPLETED_PDM_MUTATION = 0`
- `19 / 19 incoming handoff = HANDOFF_ACCEPTED`
- `IA_LOWFI_ENGINEERING_CONSTRUCTION = NO`

---

# 9. Batch 4｜员工端最终产品裁决候选

> 状态：`PENDING_USER_REVIEW`。  
> Gap / Choice Scan：`PASS`。  
> 本批只保留仓库现有 Authority 无法自动替用户决定的员工端产品取舍；推荐方案以“最少新体系、优先复用已冻结结构、避免权限语义再次分叉”为原则。

## P21-B4-01｜4S 成员如何进入内部管理投影

### A｜推荐：进入同一个 E02-M01 Internal Mode，但按 4S 身份做严格裁剪

当 4S 成员查看**自己当前 data scope 内有权管理的 4S Vehicle** 时：

- 可通过同一 Internal Mode 进入内部管理投影；
- 只显示该 4S 身份允许管理的车辆字段、图片、档案及正常车辆管理动作；
- `customer_list_price` 可按正常车辆编辑规则维护；
- 名邦内部价 / 批发价、`internal_wholesale_price`、客户展示价 override、一键转名邦继续 HARD DENY；
- CRM / Demand / Consultation / Recommendation / Lock / Transaction 等名邦客户业务继续不开放；
- source_type 不因进入 Internal Mode 获得修改权；
- 每个动作仍逐项校验 permission/capability + data scope + object state。

### B｜另做 4S 专属内部管理页面

不让 4S 进入 E02-M01，为 4S 再建立一套裁剪后的管理页。

**推荐 A。**  
理由：PDM-02 已明确不建立独立 4S App / IA；同页裁剪最不容易形成第二套权限语义。

## P21-B4-02｜客户安全详情外层与 Internal Mode 的敏感 Action 归位

### A｜推荐：外层只保留安全/高频业务入口，内部经营动作统一进入 Internal Mode

E02-01 客户安全详情外层保留：

- 分享；
- 推荐给客户；
- 锁车；
- 纯查看型客户安全信息。

进入 Internal Mode 后，按 Guard 显示：

- 编辑车辆 / 车况；
- 上游电话；
- 正常价格字段编辑入口；
- 客户展示价 override；
- 隐藏 / 恢复；
- 真实下架 / 重新上架；
- 一键转名邦；
- 其他明确内部敏感能力。

正常价格字段编辑进入专门编辑页；override 使用独立 sheet；隐藏/恢复、上下架使用二次确认；一键转名邦使用专门确认页/sheet。

### B｜允许部分敏感动作继续直接挂在 E02-01 外层

例如下架、隐藏、一键转名邦等继续直接出现在客户安全详情。

**推荐 A。**  
理由：与“默认客户安全视图”边界一致，也避免 Navigation 与页面语义再次打架。

## P21-B4-03｜隐藏车源入口位置

### A｜推荐：固定为 E02「更多 → 隐藏车源」

- hidden 不混入默认车辆列表；
- 只有具备对应查看/管理能力的员工显示该入口；
- 无权限员工完全不显示；
- 进入后仍按 data scope、source_type 与对象状态过滤；
- 恢复显示继续是独立真实动作，不因进入隐藏列表自动 visible。

### B｜把“隐藏车源”做成 E02 顶部固定 Tab

所有员工都能看到 Tab，但无权限时显示无权限态。

**推荐 A。**  
理由：延续历史结构，且避免把低频敏感管理入口升级成一级导航。

## P21-B4-04｜一键转名邦是否必须二次确认

### A｜推荐：必须使用专门确认 Sheet / Page

点击“一键转名邦”后先展示关键后果，再由员工确认提交。至少明确：

- 同一真实车辆、同一 `vehicle_id`、同一当前 `listing_cycle`；
- source_type 从批发/JYT 单向变为名邦，不创建第二辆 Vehicle，不支持直接转回批发；
- 已有 Lock / Waitlist / Transaction / Favorite / Recommendation 等继续绑定原 vehicle；
- 转换前保存当前价格快照；名邦 `customer_list_price` 不自动继承批发客户展示价；
- `internal_wholesale_price` 只有存在真实 upstream_wholesale_price 时才复制，否则为 null；
- 图片资产化作为后续独立子任务，partial_failed / failed 不回滚已经完成的来源转换；
- 转换后重新计算自动 hidden；人工 hidden 不自动解除；
- submit 时再次校验当前员工资格、data scope 与 object state。

### B｜点击后直接执行，只用轻提示说明结果

**推荐 A。**  
理由：来源转换为单向经营动作，影响价格、图片与可见性，不适合误触即执行。

## P21-B4-05｜Consultation“即将超时”的阈值

Consultation 自身 SLA deadline 继续由 PDM-15 冻结；这里只决定 E01 工作台何时把它标成“即将超时”。

### A｜推荐：自适应阈值

当未 timeout 且剩余时间：

> `<= min(5 分钟, 当前 Consultation 固化 SLA 时长 ÷ 3)`

进入“即将超时”。

例如：

- SLA 15 分钟 → 最后 5 分钟；
- SLA 30 分钟 → 最后 5 分钟；
- SLA 9 分钟 → 最后 3 分钟。

### B｜固定最后 5 分钟

不随 SLA 时长变化。

### C｜再新增一个后台“即将超时阈值”配置项

由后台单独配置。

**推荐 A。**  
理由：默认 15 分钟时保持直观的最后 5 分钟，同时避免 SLA 被配置得很短时整段生命周期都处于“即将超时”，也不新增第二个配置项。

## P21-B4-06｜Internal Mode 长时间进入后台后的自动退出阈值

已经冻结：离开详情、重新打开、切车、分享、推荐、身份/权限变化时均恢复客户安全视图。这里只决定“App 进入后台后多久回来视为需要退出 Internal Mode”。

### A｜推荐：连续后台 ≥ 5 分钟自动退出

- <5 分钟返回：仍要重新校验员工身份、permission、scope、object state；全部仍合法才可继续当前 Internal Mode；
- ≥5 分钟返回：直接恢复客户安全视图，需重新进入 Internal Mode。

### B｜任何进入后台后返回都自动退出

安全最强，但短暂切 App 也需要重新进入。

### C｜连续后台 ≥ 15 分钟才退出

操作更宽松。

**推荐 A。**

## P21-B4-07｜E01 多类“强待办”的统一排序

历史只明确 Consultation 内部优先级，没有冻结 LockRequest、Application、Priority 与 Consultation 之间的全局固定类别顺序。

### A｜推荐：deadline / urgency first，不再造硬编码类别排行榜

统一规则：

1. 已超时 Consultation 永远最前；
2. 其余存在明确 deadline / expires_at 的强待办，按**剩余时间由短到长**排列，包括：
   - 即将超时 Consultation；
   - LockRequest 自动取消 deadline；
   - Priority expires_at；
   - 其他已经有正式 deadline 的对象；
3. 无 deadline 的 pending Application / 新 Consultation 等，再按创建时间由早到晚；
4. 同一对象发生状态变化时实时重排；
5. 工作台排序不改变任何底层业务状态。

### B｜固定类别优先级

预先写死 LockRequest、Consultation、Priority、Application 等类别的先后顺序。

**推荐 A。**  
理由：各对象已有不同真实时效事实，用 deadline 排序比再造一套员工端“业务优先级状态机”更稳定。

---

# 10. Batch 4 Gate

当前：

- `P21-B4-01～P21-B4-07 = PENDING_USER_REVIEW`
- 推荐：`1A / 2A / 3A / 4A / 5A / 6A / 7A`
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 7`
- `COMPLETED_PDM_MUTATION = 0`
- `NEW_DOMAIN_STATE_MACHINE = 0`
- `19 / 19 incoming handoff = HANDOFF_ACCEPTED`
- `IA_LOWFI_ENGINEERING_CONSTRUCTION = NO`

当前唯一下一步：

> **用户裁决 P21-B4-01～P21-B4-07。完成裁决并明确执行后，进入 PDM-21 Final 前完整性复核。**
