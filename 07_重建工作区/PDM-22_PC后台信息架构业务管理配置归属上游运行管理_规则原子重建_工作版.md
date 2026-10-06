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

# 4A. B2 审查中新增已裁决规则｜USER_APPROVED / APPLIED

## P22-ADD-01｜Employee PC 网页登录凭证绑定现有 employee_id｜USER_APPROVED / APPLIED

PC 网页后台采用独立网页认证入口，不复用客户端 / 销售端的微信身份进入方式。

对于已经存在的 Employee：

- 继续以稳定 `employee_id` 作为唯一员工业务身份；
- 如需要使用 PC 网页后台，可由有权后台治理者为该 `employee_id` 开通一套 PC 登录凭证；
- V1 当前凭证采用“登录账号 + 密码”的网页认证方式；
- PC 登录凭证只是认证入口，不创建第二个 Employee，不生成新的 `employee_id`；
- 登录成功后，继续读取该 `employee_id` 当前角色、permission、data scope、account status 与 object state；
- 开通 PC 登录本身不增加任何业务 permission，也不扩大 data scope；
- Employee inactive / 停用后，PC 登录必须立即失效，既有 PC 登录态不得继续操作；
- 密码重置 / PC 登录启停属于账号治理动作，不得改变该 Employee 的业务身份历史。

客户端 / 销售端与 PC 网页后台因此明确分层：

> 微信侧客户端 / 销售端 = 微信侧身份入口；  
> PC 后台 = 独立网页账号密码入口；  
> 两者在 Employee 场景最终都指向同一个 `employee_id`。

System Admin 继续使用独立系统身份 / 独立登录凭证：

- 不绑定成某个 Employee 的 PC 登录凭证；
- 同一真人同时拥有 System Admin 与 Employee 身份时，仍是两套身份；
- System Admin 登录态不得自动切换或继承 Employee 业务权限。

4S 边界继续继承 PDM-02：

- 4S 默认不进入名邦 PC 业务后台；
- 只有已被明确授予 PC 车辆管理能力的 4S 账号，才允许启用对应 PC 网页登录；
- 登录后仍只看到其合法 4S 车辆裁剪范围，4S hard DENY 不变。

本规则只冻结产品身份 / 认证关系，不在本阶段写死密码强度、加密算法、验证码、MFA、Session 实现等 Engineering 细节。

---

# 5. Batch 2｜旧规则反向冲突扫描｜PASS / USER_APPROVED / APPLIED

> 目标：只处理已被 PDM-01～21 Final 明确替代、废弃或收窄的旧规则 / stale carrier。  
> 本批不新增产品选择，不改变已完成 PDM 的 Authority。

## P22-B2-01｜废弃“PC 业务后台 = System Admin 专属后台”

旧 `/admin` / PC carrier 若把 P01～P04、P06～P12 解释成只有 System Admin 才能进入，正式废弃。

当前：
- PC 是独立网页后台；Employee 通过绑定在现有 `employee_id` 上的 PC 登录账号 + 密码进入，不新建第二员工身份；
- 登录成功后仍按 Employee identity + permission + data scope + account/object state 使用业务后台；
- P05 才是 System Admin 独立控制平面，System Admin 使用独立系统身份 / 登录凭证；
- System Admin 不因进入 PC 自动取得员工业务权，也不得把 System Admin 登录态当成 Employee 登录态。

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

- `P22-B2-01～P22-B2-11 = PASS / USER_APPROVED / APPLIED`
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

> **P22-B2-01～P22-B2-11 已全部批准并执行；Reverse Conflict Scan PASS。进入 Batch 3 Conflict Isolation。**

---

# 7. Batch 3｜已冻结上游语义的 PC 后台补全｜PASS / USER_APPROVED / APPLIED

> Conflict Isolation：`PASS / MISCLASSIFIED_PRODUCT_CHOICE = 0`。  
> 本批只把 PDM-01～21 已经正式冻结、但旧 PC carrier 未完整承载的后续规则补到 PDM-22；不新增新的业务状态机。  
> `P22-ADD-01`（Employee PC 网页账号密码绑定原 employee_id）已在 Batch 2 审查期间由用户单独批准并执行，因此不重复计入本批待审查项。

## P22-B3-01｜P05 补齐 System Admin 自身账号治理闭环

P05 必须承载 System Admin 自身账号治理：
- 首个 System Admin 由系统 bootstrap 初始化；
- 后续 System Admin 只能由 active System Admin 新增 / 启用 / 停用；
- 系统始终至少保留 1 个 active System Admin；
- 不允许停用最后一个 active System Admin；
- System Admin 自身治理必须保留审计；
- 该治理能力不产生 Employee 业务权限。

## P22-B3-02｜P06/P05 补齐 Customer 账号停用 / 恢复治理与业务影响提示

PC 后台必须真实承载 Customer 账号停用 / 恢复，而不是只改一个布尔字段。

当前：
- System Admin 可作为控制平面治理动作执行；
- 经理 / 店长 / 被明确授权员工按对应 capability + data scope 执行；
- 4S hard DENY；
- 停用不删除 Customer，不等于降级，也不物理删除历史业务；
- active Demand 按 PDM-11 进入 paused；
- Consultation / Recommendation / Lock / Waitlist / Transaction / Refund 等按各自 Authority 停止继续按“正常账号”推进，但历史事实保留；
- 恢复账号只恢复账号可用性，不自动恢复已经暂停、终止、过期或结束的业务对象。

PC 执行停用前应明确展示该动作会影响当前进行中业务，但不得在 PDM-22 自造第二套业务状态。

## P22-B3-03｜P02 补齐自动 / 批量隐藏规则中心

P02 必须承载 PDM-04 已冻结的隐藏规则管理，而不能只有单车 hidden / restore。

至少包括：
- 默认作用于 wholesale / JYT，可按已批准范围选择来源；
- 品牌 / 车系 / 年款 / 车型 / 地区 / 关键词等条件；
- 不同字段之间 AND；
- 同字段多值 OR；
- 规则启用 / 停用 / 条件变化 / source_type 变化后重新计算命中集合；
- hidden 与 offline / unavailable 分离；
- hidden 但真实可售的车辆仍可进入合法内部 Matching / Recommendation；
- 恢复显示必须基于当前是否仍命中其他有效规则重新计算。

## P22-B3-04｜P08/P06 补齐 LIMITED / UNLIMITED 与临时加次的后台治理

PC 后台除 Customer Level 基础权益外，还必须承载 PDM-10 当前查价权益治理：
- daily base quota 为后台配置；
- LIMITED / UNLIMITED 为等级价格权益；
- 有权限员工可为 LIMITED Customer 免费增加当天查价次数；
- 同日可多次追加并累计，UTC+8 次日清零；
- UNLIMITED 当前生效期间不得再新增临时加次；
- 进入 UNLIMITED 不删除此前当天已合法追加的事实；
- 追加必须审计客户、操作人、时间、增加次数、前后额度与当天累计追加量；
- V1 不建设“购买查价次数 / 按次收费”。

## P22-B3-05｜P07 补齐 LockRequest 竞争成功后的自动候补 carrier

同车同 listing_cycle 存在多个有效 PENDING LockRequest 时：
- 其中一笔批准形成正式 Lock 后；
- 其他仍有效 PENDING 自动转为 Waitlist；
- Waitlist 顺序沿用原 LockRequest.created_at；
- 自动转 Waitlist 不等于自动取得 Lock；
- 之后原 Lock release / end 也不得自动把 Waitlist 晋升为 Lock；
- PC 必须能看到 resulting_lock_id / resulting_waitlist_id 与来源关系。

## P22-B3-06｜P07 补齐普通 Lock 与 Priority-origin Lock 的可见性差异

PC 不能把所有 Lock 都解释成“全客户不可见”。

当前：
- 普通粉丝 / VIP Lock 按普通 Lock 可见性规则，不因为锁车就自动全站隐藏；
- active Priority Customer 转成正式 Lock 后，Priority 可记录 converted_to_lock；
- 该 Lock 在 Lock 有效期内继续继承原 Priority 的客户侧排他可见性；
- Lock 结束后再按车辆当前真实 visibility / hidden / listing 状态重新计算；
- Priority 不成为 LockRequest 抢车分值。

## P22-B3-07｜P07 补齐 Refund 直接关闭的真实动作语义

pending Refund 确定不再退款时：
- 当前合法可处理该 Refund 的业务人员可直接关闭；
- 必须填写 close reason；
- 不新增专门 close permission；
- 不增加第二级审批；
- closed ≠ refunded；
- 已真实退款不得用 closed 伪装；
- 后续重新需要退款时创建新的合法 Refund，不把 closed 改回 pending。

## P22-B3-08｜P03/P02 补齐上游电话入口的当前 source_type 裁剪

Publisher 历史与电话 cache 可以保留，但日常车辆电话入口必须读取当前 source_type：
- 仅当前 wholesale / JYT 批发车可进入上游电话查看 / latest / 拨打链路；
- 批发转名邦后，即使同一 vehicle_id 仍保留历史 upstream_publisher_id，也不得在当前车辆详情继续展示 / 刷新 / 拨打原上游电话；
- 当前为 4S 来源同样不得因历史 publisher 事实自动出现上游电话入口；
- P03 publisher 诊断 / 历史查看不得反向把电话能力重新挂回车辆日常详情。

## P22-B3-09｜P07 补齐 Transaction 实际成交价与 correction 的不可覆盖历史

PC Transaction 管理必须明确：
- actual deal price / completed Transaction 价格属于成交历史主事实；
- 后续客户展示价、批发价、markup、source_type 变化不得回写既有成交价格；
- correction 采用追加事实，不直接覆盖原 completed / Deposit / Refund 历史；
- 误成交纠错、资金纠错必须继续读取对应独立敏感 permission + data scope；
- System Admin 身份本身不取得上述业务纠错能力。

---

# 8. Batch 3 Conflict Isolation Gate

当前：
- `P22-B3-01～P22-B3-09 = PASS / USER_APPROVED / APPLIED`
- `MISCLASSIFIED_PRODUCT_CHOICE = 0`
- `NEW_DOMAIN_STATE_MACHINE = 0`
- `P22-ADD-01 = USER_APPROVED / APPLIED / EXCLUDED_FROM_DUPLICATE_REVIEW`
- `INCOMING_HANDOFF_ACCEPTED = 18 / 18`
- `IA_LOWFI_ENGINEERING_CONSTRUCTION = NO`

当前唯一下一步：

> **P22-B3-01～P22-B3-09 已全部批准并执行；Conflict Isolation PASS。进入 Batch 4 最终缺口 / 产品选择扫描。**

---

# 9. Batch 4｜最终缺口 / 产品选择扫描｜PASS / USER_APPROVED / APPLIED

> 本批是在 Batch 1～3 后对 18 条 incoming handoff、R12 与 PDM-01～21 Final 再做一次 Final-gap scan。  
> 结果：发现 3 个稳定 carrier 补漏 + 5 个 PC 产品承载选择；均不改变前置 PDM 的业务 Authority。  
> 推荐方案仍以“少建新体系、复用现有模块、认证/权限/业务事实分层”为原则。

## P22-B4-01｜Application / Demand 的 PC 管理放在哪里｜CHOICE=A / USER_APPROVED / APPLIED

已冻结业务事实：Application 与 Demand 必须分离，PC 必须能看到当前状态、负责人并提供合法治理入口。

### A｜推荐：统一放在 P06「客户 / 找车管理」内，使用 Application 与 Demand 两个子视图

- Application 列表 / 详情承载 pending 处理、关闭、激活 Demand 等合法动作；
- Demand 列表 / 详情承载负责人、active/paused/completed/cancelled、正式 reassignment、pause/resume/end 等当前 Authority 已允许动作；
- Customer Detail 与 Application/Demand 双向跳转；
- 不新建第二套找车状态机，也不增加新的一级业务域。

### B｜单独增加一个新的 PC 一级「找车后台」模块

业务语义仍可保持一致，但会把 P06 客户 / CRM / 找车重新拆成第二个一级业务域。

**推荐 A。**

## P22-B4-02｜公海批量治理入口放在哪里｜CHOICE=A / USER_APPROVED / APPLIED

PDM-17 已冻结 V1 支持批量正式进公海、继续当前 owner、直接移交 / 指定分配，并要求逐 Customer 重验、允许部分成功。

### A｜推荐：直接在 P06 公海 / 待公海页面提供“批量处理模式”

- 勾选多个 Customer 后选择合法批量动作；
- 每个 Customer 独立重验 current owner、保护事实、目标员工与权限；
- 只对成功项产生 mutation；
- 完成后展示成功 / 失败明细与失败原因。

### B｜单独建设“批量治理中心”页面

语义可以成立，但会多造一层独立入口和任务心智。

**推荐 A。**

## P22-B4-03｜补齐“服务 / 购买说明”真实编辑 carrier｜USER_APPROVED / APPLIED

该项无新的产品选择，按 PDM-20 handoff 原样补齐：

- PC 只维护一份全局单一“服务 / 购买说明”；
- 支持基础富文本与从 Word 粘贴后的基础格式兼容；
- 保存前进行安全清理 / sanitize；
- 支持保存 / 更新；
- 重要修改进入审计；
- 不按车辆、source_type、门店再造多套说明；
- 不扩成通用模板引擎。

## P22-B4-04｜Employee PC 登录账号的首次密码与重置策略｜CHOICE=A / USER_APPROVED / APPLIED

`P22-ADD-01` 已冻结“现有 employee_id + 独立 PC 登录账号和密码”，这里仅决定 V1 的密码生命周期。

### A｜推荐：后台配置唯一登录账号 + 初始密码；首次登录强制改密码

- 登录账号由有权账号治理者为现有 employee_id 配置，账号全局唯一；
- 初始密码由后台设置 / 重置；
- 首次成功登录必须修改密码后再进入业务后台；
- 员工登录后可修改自己的 PC 密码；
- 忘记密码由有权账号治理者重置；
- 不把手机号或 employee_id 强制当作登录账号。

### B｜后台配置账号 + 初始密码，但首次登录不强制改密码

更简单，但长期保留管理员分发的初始密码。

### C｜直接固定使用员工手机号作为 PC 登录账号

实现直观，但会把 PC 登录凭证与手机号身份变化耦合。

**推荐 A。**

## P22-B4-05｜P03 车源同步与发布人电话诊断是否混在同一页面｜CHOICE=A / USER_APPROVED / APPLIED

两者都属于 P03，但 credential、权限和数据敏感度不同。

### A｜推荐：P03 下分成两个独立子页面

1. 车源同步 / Integration API：三个固定车源 API、启停、名邦同步 credential、调用统计、运行状态；
2. Publisher / 电话诊断：publisher cache、回传结果、诊断与合法历史；电话明文继续单独鉴权。

### B｜全部放在一个“采集配置”大页面

可以实现，但容易再次把车源同步 credential、JYT/Collector 参数和电话敏感权限混为一类。

**推荐 A。**

## P22-B4-06｜自动 / 批量隐藏规则放在哪里｜CHOICE=A / USER_APPROVED / APPLIED

### A｜推荐：P02 下建立独立“隐藏规则”子页面

- 单车 hidden / restore 仍在车辆管理；
- 条件规则新增 / 编辑 / 启停 / source scope / 命中重算集中在“隐藏规则”；
- 车辆详情只展示“当前为何隐藏 / 命中哪些规则”等结果，不在单车详情里编辑整套规则。

### B｜只把规则编辑器塞进车辆列表筛选区

页面更少，但规则、筛选和单车操作容易混在一起。

**推荐 A。**

## P22-B4-07｜Dashboard 必须继承当前 permission + data scope｜USER_APPROVED / APPLIED

该项无新的产品选择：

- Dashboard 卡片、数量、待办、异常必须按当前登录身份可见范围计算；
- 没有对应业务权限 / data scope 时，不得通过 Dashboard 总数泄露全局数据；
- 点击卡片进入业务页后继续执行同一套 current identity + permission + data scope + object state Guard；
- Dashboard 不能成为绕过字段权限或敏感数据权限的旁路。

## P22-B4-08｜重要配置变更是否一律强制填写原因｜USER_APPROVED / APPLIED

沿用 PDM-02 / R12 已冻结口径：

- 重要配置变更必须至少记录 before / after / actor / time；
- 默认不要求所有配置修改一律填写 reason；
- 只有具体业务 Authority 明确要求原因时才强制填写；
- 统一审计检索、留存、配置版本与跨域历史标准继续交 PDM-25。

---

# 10. Batch 4 Gate

当前：
- `P22-B4-01～P22-B4-08 = PASS / USER_APPROVED / APPLIED`
- `RECOMMENDED_CHOICES = 1A / 2A / 4A / 5A / 6A`
- `STABLE_GAP_ITEMS = B4-03 / B4-07 / B4-08`
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`
- `COMPLETED_PDM_MUTATION = 0`
- `NEW_DOMAIN_STATE_MACHINE = 0`
- `INCOMING_HANDOFF_ACCEPTED = 18 / 18`
- `IA_LOWFI_ENGINEERING_CONSTRUCTION = NO`

当前唯一下一步：

> **P22-B4-01～P22-B4-08 已按 1A / 2A / 3同意 / 4A / 5A / 6A / 7同意 / 8同意批准并执行；进入 Final 前完整性复核 R1。**
---

# 11. Final 前完整性复核 R1｜REPAIR_REQUIRED / NO_HARD_CONFLICT

> Final Candidate：`NOT_READY`  
> 正式规则 / 裁决单元：`52 = R00 + 22 Batch1 + 1 ADD + 11 Batch2 + 9 Batch3 + 8 Batch4`

复核结果：

- `SOURCE_TO_ATOM = REPAIR_REQUIRED`
- `ATOM_TO_SOURCE = PASS`
- `SEMANTIC_COMPLETENESS = REPAIR_REQUIRED`
- `COMPLETED_PDM_HARD_CONFLICT = 0`
- `INCOMING_HANDOFF_ACCEPTED = 18 / 18`
- `INCOMING_HANDOFF_LANDING_GAP = 3`
- `LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`
- `MISSING_RULE_UNRESOLVED = 2`
- `SEMANTIC_DETAIL_GAP_UNRESOLVED = 3`
- `OUTGOING_HANDOFF_GAP = 1_GROUP`
- `IA_LOWFI_ENGINEERING_CONSTRUCTION = NO`

## P22-LIA-01｜P08 价格配置完整闭环｜USER_APPROVED / APPLIED

补齐 JYT markup ON/OFF、阶梯加价“草稿→校验→启用→旧版保留历史”、区间无重叠/无空档/唯一命中；补齐三类车源 customer display override 的 PC carrier。继续遵守 PDM-10：markup OFF 回 upstream_list_price；4S 对 override hard DENY；名邦/4S 正常价格编辑不恢复独立“调价 action / permission”。

## P22-LIA-02｜Priority qualification / TTL PC carrier 细节｜USER_APPROVED / APPLIED

qualification 只允许单 Customer 开/关，V1 不支持批量；不与 Customer Level find-car entitlement 合并；普通 owner 不自动取得开启资格；保存重验 identity + permission/capability + data scope + object/account state；记录 before/after/actor/time，默认不额外强制 reason。PC 不得人工创建、续期、恢复或 override 单笔 Priority；TTL 24h 只影响后续新 Priority。

## P22-LIA-03｜公海配置参数 carrier 边界｜USER_APPROVED / APPLIED

P06 公海配置只承载 PDM-17 已批准参数：真实客户活跃时间参数、最后一次真实 CRM Follow-up 阈值、继续当前 owner 后重新检查周期、主动领取数量/频率、领取后首次跟进提醒。不得扩成任意 Opportunity / public-pool rule engine；不得恢复固定 30 天；不得自动进公海、自动收回或自动改 owner。

## P22-LIA-04｜Lock 到期提醒配置与 P23 边界｜USER_APPROVED / APPLIED

默认正式 Lock 时长仍为 72h 当前基线、可配置；另提供“是否启用即将到期提醒 + 提前量”业务配置，不写死 30 分钟，不改变 Lock.expires_at、不制造新主状态。P22 只承载业务配置值；通知渠道、飞书、DND、频控、去重、失败日志由 PDM-23 承接。

## P22-LIA-05｜Employee / System Admin PC credential 治理｜USER_APPROVED / APPLIED

Employee PC 登录继续绑定原 employee_id；账号全局唯一；后台设置/重置初始密码；首登强制改密；Employee 可修改自己密码。开通/禁用/重置属于 P04 Employee account governance，不改变 employee_id、role、permission、data scope 或历史；Employee inactive 后 PC 登录及旧登录态失效。System Admin 继续由 P05 使用独立 identity + 独立 credential，不复用 Employee credential。credential 治理变更进入统一审计。

## P22-LIA-06｜登记 PDM-22 → PDM-23 / PDM-25 outgoing handoff｜USER_APPROVED / APPLIED

PDM-23 承接 SLA / 首次跟进 / Lock 到期提醒的通知 allowlist、渠道、飞书、DND、频控、去重与失败日志；通知结果不得改写业务状态。

PDM-25 承接重要配置 before/after/actor/time、配置版本、统一历史/审计检索、时区规范，以及 Employee/System Admin credential 治理 mutation 的统一审计；P22 不再造第二套跨域审计系统。

---

# 12. R1 Repair Gate｜PASS

- `P22-LIA-01～P22-LIA-06 = PASS / USER_APPROVED / APPLIED`
- `R1_REPAIR_CLOSED = 6 / 6`
- `FINAL_CANDIDATE_READY = NO`
- `18 / 18 incoming handoff = HANDOFF_ACCEPTED`
- `IA_LOWFI_ENGINEERING_CONSTRUCTION = NO`

当前唯一下一步：

> **P22-LIA-01～P22-LIA-06 已全部批准并执行；进入 Final 前完整性复核 R2。**
---

# 13. Final 前完整性复核 R2｜PASS / FINAL_CANDIDATE_READY

R2 重新核对：

- 9/19 R12；
- PDM-01～21 completed Final；
- 18 / 18 target=PDM-22 incoming handoff；
- P22-R00、Batch 1～4、P22-ADD-01、LIA-01～06；
- PDM-22 → PDM-23 / PDM-25 outgoing handoff；
- Negative / DO_NOT_RESTORE；
- Current IA / Low-Fi stale carrier 边界。

结果：

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
- `PDM22_FORMAL_UNITS = 58`
- `PDM22_FINAL_CANDIDATE_READY = YES`

R2 报告：

> `07_重建工作区/PDM-22_Final前完整性复核_R2_2026-10-07.md`

Final Domain Overview：

> `07_重建工作区/PDM-22_最终完整规则总览_待用户批准.md`

当前唯一下一步：

> **用户最终审查 / 批准 PDM-22 Final Domain Overview。最终批准前不得发布正式 Final、不得关闭 18 条 incoming handoff、不得 source backwrite、不得进入 PDM-23。**

---

# 14. Final Closeout｜COMPLETE

- 用户最终批准 PDM-22 Final Domain Overview，并在同一消息明确“确认执行”；
- 正式 Final：`07_重建工作区/PDM-22_最终完整规则.md`；
- Final Integrity：`07_重建工作区/PDM-22_最终完整性复核_2026-10-07.md / PASS`；
- 58 个正式规则 / 裁决单元全部进入 Final；
- 18 / 18 incoming handoff：`HANDOFF_CLOSED / source_backwrite=YES`；
- PDM-22 → PDM-23 / PDM-25：继续 `HANDOFF_OPEN`；
- IA / Low-Fi / Engineering 未施工；
- PDM-22 = `COMPLETE / INTEGRITY_PASS`；
- 当前唯一下一步：`PDM-23 Startup Gate`。
