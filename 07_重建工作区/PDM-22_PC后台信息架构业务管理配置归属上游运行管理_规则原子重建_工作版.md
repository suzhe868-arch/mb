# PDM-22｜PC 后台信息架构 / 业务管理 / 配置归属 / 上游运行管理｜规则原子重建工作版

> 当前状态：`IN_PROGRESS / BATCH_1_PASS / BATCH_2_PENDING_USER_REVIEW`  
> 核心定位：`P22-R00 = USER_APPROVED / APPLIED`  
> Incoming Handoff：18 / 18 `HANDOFF_ACCEPTED`  
> IA / Low-Fi / Engineering：`NO_CONSTRUCTION`

---

# 1. P22-R00｜核心定位｜USER_APPROVED / APPLIED

PDM-22 是：

> **名邦 PC 后台业务管理承载、业务配置承载、采集系统 / Integration API 接入及上游运行管理的唯一 Authority。**

PDM-22 负责把 PDM-01～PDM-21 已经冻结的业务事实与业务规则，落实为：

- PC Dashboard 与业务管理入口；
- 车源 / 车型后台治理；
- 采集系统 / Integration API / 上游运行管理；
- 员工 / 权限 / 数据范围 / System Admin 控制平面；
- 客户 / CRM / 找车 / Matching Rule / Priority / Consultation / 公海等 PC 管理 carrier；
- Lock / Waitlist / Deposit / Transaction / Refund / correction 等 PC 管理 carrier；
- 价格、Customer Level 权益、业务默认值与其他已批准配置对象的 PC carrier；
- 对应运行状态、配置状态、失败态、诊断入口与必要历史查看入口。

PDM-22 **不重新定义** Customer、Employee、Vehicle、Model、Archive、Image、Publisher Phone、Price、Application/Demand、Matching、Priority、Recommendation、Consultation、CRM、Public Pool/Collaboration、Lock/Waitlist、Deposit/Transaction/Refund 的主状态、生命周期、责任、权限真相。

这些业务真相必须读取 PDM-01～PDM-21 的正式 Final。

页面、菜单、配置表单、Dashboard 卡片、运行状态或“后台管理员”称呼不得反向创造第二套业务 Authority。

## 1.1 P03 的两条 Integration 链路必须分开

### 车源同步链路

V1 固定保留三个“采集系统 → 名邦 Backend”的车源业务 API：

1. 新增 / 更新车源 API；
2. 批量确认下架 API；
3. 获取当前名邦仍在售批发车源 API。

PDM-22 P03 负责：

- 三个 API 独立启停；
- 名邦侧车源同步 API credential；
- 调用统计；
- 成功 / 失败与提交 / 处理数量等运行事实；
- 当前同步 / 下架链路运行状态。

该 credential：

- 不是 JYT 上游登录 Token；
- 不是 JYT 电话 Token；
- 不得与 Collector 电话内部鉴权混用。

### 电话取号 / 回传链路

当前正式网络方向：

> 名邦业务确定 `upstream_publisher_id` → Collector / 采集端向上游取号 → 结果经名邦已有 Integration API / 既有回传体系返回名邦 → 名邦更新 publisher 当前缓存。

因此 PDM-22：

- 承载名邦 Integration API 状态、必要 credential、电话结果回传日志；
- 承载 P03-05 publisher cache / 诊断；
- publisher 继续按 `source_platform + upstream_publisher_id` 唯一定位；
- 电话明文仍受独立敏感能力与 data scope 保护；
- `integration / Collector manage` 不自动授予电话明文能力。

不得恢复：

- 名邦主动调用 Collector Phone API；
- Collector Base URL；
- Phone Path；
- “保存 Collector 电话连接 / 测试 Collector 电话连接”；
- 在名邦 P03 管理 JYT 电话 Token / Header / callCode 等 Collector 内部参数。

具体 URL、Header、DTO、Worker、队列、重试实现属于 Engineering，不在本 PDM 产品层写死。

---

# 2. Startup Gate｜PASS

## 2.1 Current Authority Refresh

已重新读取并对齐：

- 9/19 R12《PC 后台 / 配置 / 通知 / 审计》；
- 001～078 中 M18、M15、M07 及与 PDM-22 相关的配置/PC carrier 证据；
- Current IA 中 P01～P08 及相关 P03-05/P03-06/P03-07 carrier；
- PDM-01～PDM-21 正式 Final；
- CROSS_PDM_HANDOFF_REGISTER 中 target=PDM-22 的全部 handoff。

结果：

- `COMPLETED_PDM_HARD_CONFLICT = 0`
- `INCOMING_HANDOFF_GAP = 0`
- `INCOMING_HANDOFF_COUNT = 18`
- `INCOMING_HANDOFF_ACCEPTED = 18`
- `GLOBAL_INVARIANT_CONFLICT = 0`
- `IA_LOWFI_ENGINEERING_CONSTRUCTION = NO`

## 2.2 Incoming Handoff｜18 / 18 ACCEPTED

1. `HO-P02-P22-001`｜员工、权限、System Admin、角色模板、data scope 的 PC 配置承载。
2. `HO-P04-P22-001`｜PC Vehicle、隐藏规则、集成配置与运行管理 carrier，不改变 PDM-04 Vehicle Authority。
3. `HO-P04-P22-002`｜三个固定车源同步 API 的启停、名邦同步 credential、统计与运行状态；与 JYT/电话 credential 分离。
4. `HO-P05-P22-001`｜System Admin 车型主数据、JYT mapping、MODEL_MISSING、conflict、merge PC 治理。
5. `HO-P06-P22-001`｜PC 人工 Vehicle 管理；正式 Vehicle 不因通用 CRUD 获得物理 Delete；Draft 与正式 Vehicle 分层。
6. `HO-P07-P22-001`｜Transaction / 交付 required-field set PC 配置；需明确员工业务配置能力。
7. `HO-P08-P22-001`｜公开图片域名、JYT Origin、report 域名、对象存储源站与首页/品牌分享配置入口。
8. `HO-P09-P22-001`｜publisher cache / 诊断复合身份，Integration API 与电话明文权限隔离。
9. `HO-P10-P22-001`｜阶梯加价、markup、Customer Level 价格权益、daily quota、内部价相关 permission / 配置 carrier。
10. `HO-P11-P22-001`｜Customer Level 统一权益配置与 PC Application / Demand 必要治理入口。
11. `HO-P12-P22-001`｜真实 Rule Dictionary Action、matching.rule.manage、测试解析、partial failure / retry carrier。
12. `HO-P13-P22-001`｜单 Customer Priority qualification 与全局默认 TTL 两个控制面配置对象。
13. `HO-P15-P22-001`｜PC Consultation 管理与首次响应 SLA 配置。
14. `HO-P16-P22-001`｜公司级 CRM Stage / Customer Tag 字典配置与 Opportunity 配置边界。
15. `HO-P17-P22-001`｜待公海候选、重新检查周期、主动领取限制、首次跟进提醒等配置 carrier。
16. `HO-P18-P22-001`｜默认正式 Lock 时长配置。
17. `HO-P19-P22-001`｜Deposit / Transaction / Refund / correction PC 业务管理与 Dashboard 资金/交易待办统计。
18. `HO-P20-P22-001`｜服务/购买说明、普通分享标题模板、默认分享图、Customer Safe 白名单等轻量配置。

## 2.3 Completed-PDM Dependency Card｜强制依赖卡

| 依赖 PDM | PDM-22 消费对象 | PDM-22 可承载 | PDM-22 不可改写 |
|---|---|---|---|
| PDM-02 | Employee / role / permission / scope / System Admin | P04/P05 治理页面 | 身份、hard DENY、权限计算 |
| PDM-04 | Vehicle / source / listing_cycle / Integration APIs | P02/P03 管理与运行 carrier | Vehicle Authority / API 产品边界 |
| PDM-05 | Model / JYT mapping | System Admin 模型治理页面 | 车型身份与 mapping 语义 |
| PDM-06 | Draft / Manual Vehicle | PC 人工 Vehicle 管理 | Draft / formal Vehicle 生命周期 |
| PDM-07 | Archive / required-field set | required-field 配置 | 档案事实与 completion Guard |
| PDM-08 | Image / resource configuration | 图片/Origin/公开域名配置 | 图片资产化生命周期 |
| PDM-09 | Publisher Phone | cache/诊断/回传运行 carrier | publisher identity / cache / latest Authority |
| PDM-10 | Price / entitlement / quota | P08 配置与管理 | 价格公式、权限与查价语义 |
| PDM-11 | Customer Level / Application / Demand | 等级配置与治理入口 | Application / Demand 生命周期 |
| PDM-12 | Rule Dictionary / Matching | Rule 管理页面与重算运行态 | parser / Match Result Authority |
| PDM-13 | Priority | qualification / default TTL 配置 | 仲裁、TTL snapshot、Priority lifecycle |
| PDM-15 | Consultation / SLA | Consultation PC 管理 / SLA 配置 | Consultation 四主状态与 first response 事实 |
| PDM-16 | CRM | Stage/Tag 字典配置与 CRM 管理 | CRM / Opportunity / Source Radar 对象语义 |
| PDM-17 | Public Pool / Collaboration | 公海运营配置 | owner / public-pool 生命周期 |
| PDM-18 | Lock / Waitlist | 默认 Lock duration 配置与 PC 管理 | Lock/Waitlist lifecycle |
| PDM-19 | Deposit / Transaction / Refund | P07 PC 管理与 Dashboard 投影 | 资金/交易历史真相 |
| PDM-20 | Client config | 服务说明/分享轻量配置 | 客户端业务 Authority |

## 2.4 Global Invariant Gate

PDM-22 必须保持：

1. PC 页面存在 ≠ 获得业务 permission。
2. System Admin 控制平面身份 ≠ 员工业务执行身份。
3. System Admin 可以治理 PDM-02/PDM-05 明确属于控制平面的对象，但不得借此取得 CRM、Vehicle 销售经营、Lock、Transaction 等业务执行权。
4. 员工业务配置必须服从对应的 identity + permission/capability + data scope + config/object state。
5. 所有 mutation 在最终提交时重新校验当前 Guard；旧页面/旧缓存不得延续已撤销能力。
6. 配置修改不得追改已固化的历史业务对象。
7. 配置必须有业务归属，不建设脱离业务的大杂烩“万能配置中心”。
8. Dashboard 只聚合/跳转，不制造第二套业务状态。
9. Integration runtime / log / diagnostic 不能反向改写 Vehicle、Publisher Phone 或业务对象真相。
10. IA / Low-Fi 当前只是 carrier 证据；与 Final 冲突时标 stale，不反向覆盖 Final。
11. PDM-23 的通知/飞书/DND/通知日志、PDM-24 的公告/Banner/运营位、PDM-25 的统一审计/历史/时区/配置版本仍由各自域承接。
12. 本阶段不修改 IA / Low-Fi / Engineering。

## 2.5 Current Implementation Fact

当前仓库能证明：

- Current IA / Low-Fi 已存在 P01～P12 大量 PC carrier；
- P01～P08 与 PDM-22 主范围相关，但存在旧权限、旧状态、旧网络方向和通用 CRUD 壳；
- carrier 存在不等于当前产品规则已正确实现；
- 本轮只重建产品 Authority，不把现有页面或代码自动视为已实现/已验收。

因此：

> `CURRENT_IMPLEMENTATION_FACT = CARRIER_EXISTS / ENGINEERING_IMPLEMENTATION_NOT_ASSUMED`

## 2.6 Startup Gate 已隔离的旧规则污染

以下不进入 Batch 1 当前 Authority，只登记为后续 Reverse Conflict / Carrier 对齐对象：

- 旧独立 Recommendation qualification / `P06-06` 已被 PDM-14 废弃；当前普通 Recommendation 资格读取 Customer Level 的 find-car entitlement。
- 旧 Refund 只有 `pending/refunded` 两状态已被 PDM-19 覆盖；当前还存在 `closed`，且 closed 不得伪装成 refunded。
- 旧 R12“删除内部价/批发价独立 permission”已被 PDM-10/PDM-02 后续裁决反转；当前内部价查看是后台可配置独立 permission，4S hard DENY。
- 旧 P03 把“上游登录/凭证”泛化为名邦可管理 JYT 调用凭证的 carrier 不再成立；JYT 电话 Token/URL/Header/callCode 等只属于 Collector/Engineering。
- 旧“名邦 → Collector Phone API / Base URL / Phone Path”方向已被 PDM-09 废弃。
- Current IA 中仍存在旧 Recommendation qualification、旧权限词、旧 Refund/电话/Integration carrier，当前只标 stale。
- PDM-23/24/25 负责的通知、Banner/公告、统一审计不得因旧 R12 同文件出现而提前并入 PDM-22。

---

# 3. Batch 1｜稳定基础规则｜PASS / USER_APPROVED / APPLIED

> 状态：`PASS / USER_APPROVED / APPLIED`。  
> 原则：只纳入已有 Authority 明确、无需新产品选择且与 PDM-01～21 Final 不冲突的稳定规则。

## P22-A01｜PC 后台不是 System Admin 专属业务后台

PC 同时承载员工业务后台和 System Admin 控制平面，但身份域严格分离。

- 员工按当前 Employee identity + permission + data scope + object state 使用合法 PC 业务能力；
- System Admin 使用独立身份执行明确控制平面治理；
- 同一真人需要执行业务时必须切换到合法员工身份；
- 不得因为“能进入后台”自动获得全部业务操作权。

## P22-A02｜配置必须回到所属业务模块

不建设一个脱离业务的万能配置中心。

例如：

- 公海配置 → P06；
- Lock 默认时长、required-field set → P07；
- 价格 / Customer Level 价格权益 → P08；
- Integration API / 上游运行 → P03；
- role / permission / data scope → P04。

配置页面只承载对应业务 Authority 已批准的配置对象。

## P22-A03｜所有 PC 写操作提交时必须重新校验

任何业务 mutation / 配置 mutation 最终提交时，都必须按其 Authority 重验：

> current identity + permission/capability + data scope + object/config state。

页面进入时合法、按钮曾经显示、旧页面仍打开，都不能绕过提交时重验。

## P22-A04｜重要配置修改不追改既有历史对象

已经创建并固化的业务对象不得因后来修改默认配置而被追溯改写。

至少包括：

- Lock `expires_at`；
- Consultation first-response deadline；
- Priority 已创建实例的 `expires_at`；
- Transaction / Lock / price 等已形成历史快照。

配置变更只按各业务 Authority 影响后续新对象或未来行为。

## P22-A05｜P01 Dashboard 只做聚合与跳转

Dashboard 保持轻量，不建设第二套经营 BI / 状态机。

至少可聚合：

- 在售车源 / 今日新增；
- 待处理 Consultation；
- 有效 Application / Demand；
- 当前 Lock / Waitlist 待办；
- 进行中 Transaction；
- 资金 / Refund 待办；
- 供应 / Integration 运行异常；
- 关键人工待办。

每个指标必须由真实业务对象计算，不在 Dashboard 自造状态。

## P22-A06｜P02 正式 Vehicle 管理与 Draft 管理必须分层

PC 可以承载人工 Vehicle 管理，但：

- Draft 与正式 Vehicle 不是同一 CRUD 对象；
- Draft 可按 PDM-06 规则管理/删除；
- 正式 Vehicle 不提供通用物理 Delete；
- hidden / offline / sold / source_type / listing_cycle 必须消费 PDM-04 Authority；
- “后台 CRUD”不能成为绕过车辆生命周期的万能入口。

## P22-A07｜车型主数据治理属于 System Admin 控制平面

P02 车型治理页真实承载：

- 本地车型主数据；
- JYT source mapping；
- MODEL_MISSING；
- mapping conflict；
- 重复车型 merge / 质量治理。

执行者为 PDM-05 已冻结的 System Admin 控制平面，按 `vehicle.model.manage` Guard 执行。

这不赋予 System Admin CRM、销售、Lock、Transaction 等员工业务执行权。

## P22-A08｜P03 固定承载三个采集车源业务 API 的控制面

三个固定业务 API 保持：

1. 新增 / 更新车源；
2. 批量确认下架；
3. 获取当前名邦仍在售批发车源。

P03 承载：

- 独立启停；
- 名邦车源同步 API credential；
- 调用统计；
- 运行状态；
- 成功/失败及必要提交/处理数量。

不得改变 PDM-04 已冻结的三个 API 产品边界。

## P22-A09｜车源 Integration credential 与 JYT / 电话 credential 必须隔离

名邦车源同步 API Token / API Key：

- 不是 JYT 上游登录凭证；
- 不是 JYT 电话 Token；
- 不是 Collector 电话内部鉴权；
- 不得因“都是采集相关”共用一个 credential 配置对象。

P03 页面必须让这几个安全边界无法被误解为同一套凭证。

## P22-A10｜电话回传仍走名邦既有 Integration API，不恢复反向 Phone API

电话当前链路固定为：

> 名邦确定 publisher → Collector 向上游取号 → Collector 经名邦既有 Integration API / 回传体系回传 → 名邦更新 cache。

P03 不提供：

- Collector Base URL；
- Phone Path；
- 名邦主动调用 Collector Phone API；
- JYT 电话 Token / Header / callCode 配置。

这些旧 carrier 只登记 stale。

## P22-A11｜P03-05 publisher cache / 诊断按复合身份唯一定位

P03-05 统一按：

> `source_platform + upstream_publisher_id`

定位 publisher 与当前电话缓存/历史。

不得退回：

- `car_code`；
- 单 `vehicle_id`；
- 裸 `upstream_publisher_id` 跨平台合并。

诊断页不能改变 PDM-09 电话 Authority。

## P22-A12｜Integration 管理权与电话明文权严格隔离

具备：

- Integration API 配置能力；
- Collector / integration manage；
- 运行状态查看；
- 调用/回传日志查看；

都**不能自动推导**为上游电话明文查看 / latest / 拨打能力。

电话明文继续服从 PDM-09 独立敏感能力 + data scope；System Admin 身份本身也不自动获得。

## P22-A13｜P04 承载员工 / 角色模板 / permission / data scope 的真实控制平面

P04 至少承载：

- 员工账号治理；
- 角色模板；
- permission；
- 个人 allow / deny；
- data scope；
- 接客资格/状态治理；
- 调店/离职交接入口。

角色模板实时作用于现有员工；个人覆盖、hard DENY、data scope、object state 继续生效。

## P22-A14｜P06 Customer Level 是统一权益配置对象

Customer Level 在同一等级体系内承载多个**彼此独立**的 entitlement，例如：

- find-car entitlement；
- 批发价格 LIMITED / UNLIMITED；
- daily base quota 等价格权益。

V1 不提供单 Customer find-car override。

等级可新增、改名、排序、启用/停用并保留历史；配置动作必须服从合法 `customer.level.manage` 等 Guard。

## P22-A15｜P06 必须提供真实 Rule Dictionary 管理，不做配置空壳

Rule Dictionary PC carrier 至少支持：

- 新增；
- 编辑；
- 启用 / 停用；
- scope；
- 测试解析；
- 查看必要历史；
- 保存后 affected-scope 重算状态；
- `PROCESSING / PARTIAL_FAILURE / ERROR`；
- 失败集合重试。

正式写动作受 `matching.rule.manage` 控制；4S hard DENY；System Admin 身份本身不自动取得 Matching 业务修改权。

## P22-A16｜Priority qualification 与默认 TTL 是两个独立控制面配置对象

PC 后台分别承载：

1. 单 Customer Priority qualification 开 / 关；
2. 全局默认 Priority TTL。

其中：

- qualification 不与 Customer Level find-car entitlement 混为同一开关；
- 普通负责销售不能仅因 owner 关系自行开启；
- 默认 TTL 当前基线为 24h / 86400s；
- TTL 修改只影响后续新 Priority；
- 不追改既有 `expires_at`；
- 不提供逐笔人工续期。

## P22-A17｜Consultation PC 管理与首次响应 SLA 配置分层

P06 可管理 Consultation 列表/详情/负责人治理，同时承载首次人工响应 SLA 默认值配置。

当前：

- 默认 15 分钟；
- 新 Consultation 创建时读取并固化 deadline；
- 后改配置不追改旧 Consultation；
- timeout 只是派生标记/筛选/提醒，不是第五主状态；
- System Admin 身份本身不自动取得 Consultation 业务处理权。

## P22-A18｜CRM Stage / Customer Tag 使用公司级受控字典配置

P06 配置 carrier 支持：

- Stage / Tag 新增；
- 改名；
- 排序；
- 启用 / 停用；
- 历史保留。

历史已使用 Stage/Tag 不做普通物理删除，停用不回写历史 Customer 事实。

不得因旧页面名“客户机会规则”恢复一个任意 Opportunity 通用规则引擎。

## P22-A19｜公海配置只能产生候选 / 限制 / 提醒，不能自动改 owner

P06 承载：

- 待公海候选条件；
- 继续当前 owner 后重新检查周期；
- 主动领取数量上限；
- 主动领取频率限制；
- 领取后首次跟进提醒时间。

配置结果只能形成候选、限制、提醒或重新检查。

不得配置成：

- 自动收回 Customer；
- 自动进入公海；
- 自动改 owner。

## P22-A20｜P07 承载 default Lock duration 与 required-field set 配置

P07 配置：

- 默认正式 Lock 时长：当前基线 72h，可配置；
- Transaction / 交付 required-field set。

二者都属于员工业务配置能力，不因为 System Admin 控制平面身份自动获得。

新 Lock / Transaction completion 按对应 Authority 读取当时有效配置；已形成历史不追改。

## P22-A21｜P07 必须是真实 Transaction / 资金管理 carrier

P07 至少承载真实业务管理：

- Deposit；
- Transaction；
- Refund；
- correction；
- responsible / 当前状态；
- 必要业务历史与关联时间线。

必须继承 PDM-19：

- `pending / refunded / closed` Refund 当前语义；
- closed 不能伪装 refunded；
- completed / correction / 实际退款事实不得覆盖式改写；
- System Admin 身份本身不取得交易/资金业务执行权。

## P22-A22｜基础资源与客户端轻量配置允许有 PC carrier，但不得扩成万能模板系统

PDM-22 可承载已批准的轻量配置，包括：

- 名邦公开图片域名；
- JYT Origin；
- report 域名；
- 对象存储源站；
- 全局单一“服务/购买说明”；
- 普通分享标题模板；
- 默认分享图；
- Customer Safe 字段白名单；
- 已明确属于首页/品牌分享的基础配置。

边界：

- 业务层只冻结“可配置什么”和安全边界；
- 不写死 CDN 厂商、TTL、并发等 Engineering 参数；
- 不扩张成无限通用模板引擎；
- 不把 PDM-24 的公告 / Banner / 运营位提前并入本域。

---

# 4. Batch 1 Gate

当前：

- `P22-A01～P22-A22 = PASS / USER_APPROVED / APPLIED`
- `STABLE_RULE_CONFLICT_COUNT = 0`
- `DUPLICATE_BUSINESS_AUTHORITY = 0`
- `INCOMING_HANDOFF_ACCEPTED = 18 / 18`
- `IA_LOWFI_ENGINEERING_CONSTRUCTION = NO`

当前唯一下一步：

> **Batch 1 已由用户全部同意并确认执行；进入 Batch 2 Reverse Conflict Scan。**

---

# 5. Batch 2｜旧规则反向冲突扫描｜PENDING_USER_REVIEW

> 目标：只处理已被 PDM-01～21 Final 明确替代、废弃或收窄的旧规则 / stale carrier。  
> 本批不新增产品选择，不改变已完成 PDM 的 Authority。

## P22-B2-01｜废弃“PC 业务后台 = System Admin 专属后台”

旧 `/admin` / PC carrier 若把 P01～P04、P06～P12 解释成只有 System Admin 才能进入，正式废弃。

当前：
- 员工业务后台按 Employee identity + permission + data scope + object state 使用；
- P05 才是 System Admin 独立控制平面；
- System Admin 不因进入 PC 自动取得员工业务权。

## P22-B2-02｜废弃旧“内部价无需独立 permission”口径，但不恢复其他已删除伪权限

R12 曾把“内部价 / 批发价查看权限”列入待删除旧权限。该结论已被 PDM-02 / PDM-10 后续裁决反转。

当前必须保留：
- 内部价 / 批发价查看 = 独立 permission；
- 4S hard DENY；
- Internal Mode 本身不授该 permission。

但以下旧伪权限仍不得恢复：
- “编辑非本人上传车辆”独立 permission；
- “一键转名邦”独立 permission；
- source_type 经理/店长/特殊纠错 permission；
- “进入 Internal Mode”本身作为 permission。

## P22-B2-03｜废弃独立 Recommendation qualification / P06-06

旧：
- Customer 独立 Recommendation 资格；
- P06-06 开 / 关；
- 独立 Recommendation qualification permission。

当前全部废弃。

普通 Recommendation 资格统一读取：
> Customer Level 当前 find-car entitlement。

Priority qualification 仍是独立属性，但只服务 Priority，不等于 Recommendation 资格。

## P22-B2-04｜废弃 Refund 仅有 pending / refunded 两状态的旧后台 carrier

旧 R12 P07 只列：
- pending
- refunded

当前 PDM-19 已明确：
- pending
- refunded
- closed

其中：
- closed = 确定不再退款并关闭；
- 只需填写原因；
- closed 不得伪装为 refunded；
- 部分退款继续由多笔真实退款事实表达，不新增 partial 主状态。

## P22-B2-05｜废弃电话按 car_code / vehicle_id / 裸 publisher_id 定位

电话当前唯一身份继续为：
> source_platform + upstream_publisher_id

不得恢复：
- car_code 作为电话唯一键；
- vehicle_id 作为电话唯一键；
- 跨平台只按裸 upstream_publisher_id 合并。

P03-05 诊断页也必须遵守同一复合身份。

## P22-B2-06｜废弃“名邦主动调用 Collector Phone API”的旧网络方向

不得恢复：
- Mingbang → Collector Phone API；
- Collector Base URL；
- Phone Path；
- “保存 Collector 电话连接 / 测试 Collector 连接”；
- 在名邦后台维护 JYT 电话 Token / Header / callCode。

当前固定为：
> Collector 向上游取号 → 经名邦既有 Integration API / 回传体系返回名邦。

## P22-B2-07｜废弃把 JYT mapping pending / conflict 当成“车型事实未知并阻断正常业务”

只要 JYT 已经提供明确车型事实：
- mapping pending 不得把它自动降成 unknown；
- 不得因此阻断合法搜索 / Matching / 正常业务。

待确认的是：
> 本地车型主数据归属 / source mapping。

人工上传 MODEL_MISSING 草稿仍按 PDM-05/PDM-06 当前规则处理，不受本条误伤。

## P22-B2-08｜废弃正式发布后 source_type 冻结或仅经理/店长可改的旧后台规则

当前：
- 有合法车辆管理能力的员工可在 data scope / object state 合法时修改 source_type；
- 不需要单独 source_type 高权限纠错 permission；
- 必须保留 before / after / actor / time 等审计；
- 4S 与名邦具体可操作范围继续读 PDM-02/PDM-04/PDM-06 当前规则。

## P22-B2-09｜废弃把“上游凭证管理”泛化成名邦后台可管理全部 JYT/Collector 凭证

P03 可以管理的是：
- 名邦自身 Integration API / 车源同步 API 必要 credential；
- 三个固定车源 API 的启停、统计、运行状态。

不得因此推导为名邦后台还要管理：
- JYT 登录 Token；
- JYT 电话 Token；
- JYT Header / callCode；
- Collector 内部请求参数。

这些真实上游调用参数属于 Collector / Engineering。

## P22-B2-10｜废弃正式 Vehicle 的通用物理 Delete

旧通用 CRUD carrier 若提供“删除正式 Vehicle”能力，正式废弃。

必须区分：
- Draft：按 PDM-06 可删除；
- Formal Vehicle：通过 hidden / offline / sold / lifecycle 等真实业务状态治理；
- 历史 Vehicle / listing_cycle 不因后台“删除”被物理抹除。

## P22-B2-11｜废弃旧 4S 账号治理只归经理/店长、System Admin 不可治理的 carrier

当前 PDM-02 已明确：
- 4S 账号新增、启用、停用、基础资料、允许范围内 permission 属于 System Admin 控制平面治理；
- System Admin 可治理 4S 账号，不因此成为 4S / 销售业务执行者；
- 4S hard DENY 仍不可被 System Admin 配置绕过。

Current IA / 历史 D7 中相反描述只保留为 stale carrier。

---

# 6. Batch 2 Gate

当前：

- `P22-B2-01～P22-B2-11 = PENDING_USER_REVIEW`
- `REVERSE_CONFLICT_SCAN = PASS`
- `FALSE_DEPRECATION_COUNT = 0`
- `COMPLETED_PDM_MUTATION = 0`
- `INCOMING_HANDOFF_ACCEPTED = 18 / 18`
- `IA_LOWFI_ENGINEERING_CONSTRUCTION = NO`

防误废弃确认：

- System Admin 的合法控制平面治理能力继续保留；
- 员工正常 PC 业务能力继续保留；
- 内部价独立 permission 继续保留；
- Priority qualification 继续保留；
- Refund closed 继续保留；
- JYT 已知车型事实继续保留；
- Draft 删除继续保留；
- 三个固定车源业务 API 与名邦 Integration API credential 继续保留。

当前唯一下一步：

> **用户审查 P22-B2-01～P22-B2-11。未经用户批准与明确执行，不得进入 Batch 3。**
