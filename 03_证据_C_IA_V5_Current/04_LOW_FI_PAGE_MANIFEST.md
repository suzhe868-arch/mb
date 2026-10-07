# 04 LOW-FI PAGE MANIFEST — PHASE 1.5 IA CURRENT

<!-- IA-GLOBAL-B4-PAGE -->
> **IA Batch 4 Page Manifest 正规化｜2026-10-08**
>
> P03-03“Collector 电话连接”与 P03-04“Collector 连接测试”退出 Current Page Manifest；P03 当前以车源同步 / Integration API 与 Publisher / 电话诊断承载业务。CRM 客户画像页继续承载分离的 Personal Note、Shared Profile、服务称呼，不新增大字段画像页。

<!-- IA-GLOBAL-B2-B3-PAGE -->
> **IA Batch 2 + 3 Page Manifest 覆盖｜2026-10-08**
>
> 页面级 Current 要求：
>
> - 删除/退役：Customer Merge、P06-06 Recommendation 资格、人工 Priority 创建/override、独立调价、Collector 电话 URL 配置、Opportunity 通用规则配置、泛化消息中心、LockRequest 独立进度页、CRM 先锁车后选车、万能配置中心。
> - P05 车型治理页必须能处理品牌/车系/具体车型、JYT mapping、MODEL_MISSING、mapping conflict、duplicate model。
> - E02“更多”必须含草稿车源；草稿列表支持多条独立 draft；Vehicle 编辑页支持正式保存修改、source_type 合法修改、Archive/报告维护。
> - P03-05 仅作为 publisher 电话缓存/历史/latest/异常/审计诊断页。
> - P08 承载价格等级模式、markup/quota、客户覆盖价及临时增加当天次数；UNLIMITED 客户不显示追加动作。
> - E05/P06 必须承载 Matching 描述→解析→标准条件→四级结果→确认事实→重算，并提供真实 Rule Dictionary 管理与 Priority qualification/TTL/release。
> - CRM 必须有真实 Follow-up 提交；Source Radar 不提供反写 Matching 的入口。
> - 公海指定分配成功即完成 owner 变化，不增加目标销售确认页。
> - C03/E07/P07 必须真实承载 LockRequest/Waitlist/Lock/Refund/Transaction/Deposit/correction/handoff 当前与历史事实。
> - C01/C02/C03 与 Vehicle Detail 不再使用“通用壳”替代真实业务字段；Vehicle Detail 同时承载 Current Advisor、Archive/车况、服务说明、价格、图片、CTA、Banner placement。
> - Announcement 与 Banner 分离：公告不是消息中心；VEHICLE_DETAIL 是固定 Banner placement 能力。


<!-- IA-GLOBAL-B1-PAGE -->
> **IA Batch 1 Page Manifest 覆盖｜2026-10-08**
>
> Customer 首入不增加强制资料页；Customer Merge 页面全部退出 Current。P04/Handover 必须体现批次与逐对象映射、校验结果、失败项与重试。P05 System Admin 增加后续 Admin 治理入口。4S PC 只保留授权后的 P02 车辆裁剪投影。P02 Vehicle 承载合法人工车 source_type 修改与同 vehicle_id 的一键转名邦。


- Current logical Page/Overlay rows: **135** (logical IA carriers; not a physical asset count)
- Baseline product SVG assets: **289**
- Technical auth bootstrap SVG assets outside the product-page table: **4** (`E-AUTH01`, `P-AUTH01`)
- Unique baseline physical SVG assets: **293**; archive entries: **586** because two package roots contain the same 293 relative assets
- Deterministic asset-level evidence: `PHYSICAL_SVG_ASSET_MAP.md`
- Format: deterministic grayscale SVG; every artifact includes `SCREEN_ID`.
- Visual hierarchy only; no color/brand/high-fi styling is frozen.

| Page ID | Name | Logical Visual States | Baseline Physical SVG Count |
|---|---|---|---:|
| C01 | 车源【一级 Tab】 | NORMAL, LOADING, EMPTY, ERROR | 4 |
| C01-01 | 客户车辆详情 | NORMAL, LOADING, ERROR, LOCKED, WAITLISTED, HISTORICAL, PERMISSION_DENIED, VEHICLE_INTENT_WORK_ITEM_PENDING, CLOSED_NOT_LOCKABLE, CUSTOMER_PRICE_EFFECTIVE, PRICE_CONSULTATION_VALUE_FACT | 7 |
| C02 | 帮我找车 / 我的找车【一级 Tab】 | NORMAL, LOADING, EMPTY, ERROR, PROCESSING, COMPLETED, CANCELLED | 7 |
| C02-01 | 找车申请详情 / 编辑 | NORMAL, PROCESSING, COMPLETED, CANCELLED, ERROR, WITHDRAW_CONFIRM_REQUIRED | 4 |
| C02-02 | 正式找车需求详情 | NORMAL, PROCESSING, PAUSED, COMPLETED, CANCELLED, HISTORICAL | 5 |
| C03 | 我的【一级 Tab】 | NORMAL, EMPTY | 2 |
| C03-01 | 我的收藏 | NORMAL, EMPTY | 2 |
| C03-02 | 我的推荐 | NORMAL, EMPTY, ACTIVE, ENDED, VOID, HISTORICAL | 2 |
| C03-03 | 我的咨询 | NORMAL, EMPTY, PROCESSING, COMPLETED, INVALID, CANCELLED, HISTORICAL | 4 |
| C03-04 | 我的锁车 / 候补 | NORMAL, EMPTY, LOCKED, WAITLISTED, RELEASED, NOT_LOCKABLE, EXPIRED, HISTORICAL | 6 |
| C03-05 | 我的交易 | NORMAL, EMPTY, PROCESSING, COMPLETED, CANCELLED, HISTORICAL | 6 |
| C03-06 | 公告 | NORMAL | 1 |
| C03-07 | 个人资料 / 我的顾问 | NORMAL, DIRECT_REFERRAL_CAPTURED | 1 |
| C-O01 | 头像昵称完善提示 | NORMAL | 1 |
| C-O02 | 手机号授权 | NORMAL | 1 |
| C-O03 | 客户公告弹层 | NORMAL | 1 |
| C-O04 | 图片全屏预览 | NORMAL | 1 |
| E01 | 工作台【一级 Tab】 | NORMAL, LOADING, EMPTY, ERROR, PERMISSION_DENIED, SELF_ACCEPTING_ON, SELF_ACCEPTING_OFF | 6 |
| E01-01 | 今日待处理列表 / 详情 | NORMAL, VEHICLE_INTENT_WORK_ITEM_PENDING, CONFIRM_LOCK_GUARD, CONFIRMED, CLOSED_NOT_LOCKABLE | 1 |
| E01-02 | 客户机会列表 / 详情 | NORMAL | 1 |
| E01-03 | 车源雷达 | NORMAL | 1 |
| E01-04 | 雷达事件 / 匹配详情 | NORMAL | 1 |
| E02 | 车源【一级 Tab】 | NORMAL, LOADING, EMPTY, ERROR | 5 |
| E02-01 | 员工车辆详情 | NORMAL, LOADING, LOCKED, HISTORICAL, PERMISSION_DENIED, IMAGE_PARTIAL_FAILED, IMAGE_FAILED, IMAGE_RETRYING, IMAGE_MANUAL_RECOVERY, IMAGE_RECOVERED, PHONE_LATEST, PHONE_CACHE_AVAILABLE, PHONE_LATEST_FAILED_CACHE_AVAILABLE, PHONE_UNAVAILABLE | 5 |
| E02-M01 | 内部模式授权投影 / 敏感动作裁剪 | AUTHORIZED, PERMISSION_DENIED, ACTION_DISABLED, PHONE_LATEST, PHONE_CACHE_AVAILABLE, PHONE_LATEST_FAILED_CACHE_AVAILABLE, PHONE_UNAVAILABLE | 2 |
| E02-02 | 发布 / 编辑人工车辆 | NORMAL, PROCESSING, PARTIAL_FAILURE, ERROR, DISABLED, MODEL_MISSING, DRAFT_LIST, IMAGE_RETRYING, IMAGE_MANUAL_RECOVERY, IMAGE_RECOVERED | 7 |
| E02-05 | 编辑（批发源数据只读） | NORMAL | 1 |
| E02-03 | 选择客户 / 推荐 | NORMAL | 1 |
| E02-04 | 选择客户 / 锁车 | NORMAL | 1 |
| E03 | 客户【一级 Tab】 | NORMAL, LOADING, EMPTY, ERROR, PERMISSION_DENIED | 5 |
| E03-01 | 客户详情【CRM 中心枢纽】 | NORMAL, LOADING, PERMISSION_DENIED, HISTORICAL | 4 |
| E03-02 | 客户画像 | NORMAL | 1 |
| E03-03 | 客户跟进时间线 | NORMAL | 1 |
| E03-04 | 客户业务历史 | NORMAL, RECOMMENDATION_ACTIVE, RECOMMENDATION_ENDED, RECOMMENDATION_VOID, HISTORICAL | 1 |
| E03-05 | 从客户推荐车辆 | NORMAL | 1 |
| E03-06 | 从客户锁车 | NORMAL | 1 |
| E04 | 我的【一级 Tab】 | NORMAL | 2 |
| E05 | 找车服务【业务模块】 | NORMAL | 1 |
| E05-01 | 找车申请 / 意向列表 | NORMAL, EMPTY, PROCESSING | 3 |
| E05-02 | 找车申请详情 / 服务开通 | NORMAL, PROCESSING, COMPLETED, CANCELLED | 4 |
| E05-03 | 正式 demand 列表 | NORMAL, EMPTY | 2 |
| E05-04 | 正式 demand 详情 / 编辑【核心页】 | NORMAL, PROCESSING, PAUSED, ERROR, COMPLETED, CANCELLED | 7 |
| E05-05 | 匹配候选列表 | NORMAL, EMPTY, PROCESSING, PARTIAL_FAILURE, HIGH, ACCEPTABLE, CONFIRMATION_NEEDED, NO_MATCH, HIDDEN_CONTROLLED, PRIORITY_ACTIVE_TTL_FROZEN, PRIORITY_DUPLICATE_SUPPRESSED, PRIORITY_HISTORICAL | 4 |
| E05-06 | 规则冲突 / 条件待确认 | NORMAL, EMPTY, CONFIRMATION_NEEDED, CONFIRMED, REJECTED, ERROR | 3 |
| E06 | 咨询【业务模块】 | NORMAL | 1 |
| E06-01 | 咨询列表 | NORMAL, EMPTY, PROCESSING, COMPLETED | 4 |
| E06-02 | 咨询详情 | NORMAL, PROCESSING, COMPLETED, INVALID, CANCELLED, HISTORICAL | 6 |
| E07 | 锁车 / 交易【业务模块】 | NORMAL, EMPTY | 2 |
| E07-01 | 正式锁车 | NORMAL, LOCKED, EXPIRED, HISTORICAL, ERROR | 5 |
| E07-02 | 候补 | NORMAL, WAITLISTED, HISTORICAL, ERROR | 4 |
| E07-03 | 交易 | PROCESSING, COMPLETED, CANCELLED, HISTORICAL, ERROR | 5 |
| E07-04 | 意向金 | NORMAL, EMPTY, ERROR | 3 |
| E07-05 | 退款 | PROCESSING, COMPLETED, CLOSED, HISTORICAL, ERROR | 3 |
| E07-06 | 业务关联视图 / 时间线 | NORMAL, HISTORICAL, ERROR | 3 |
| E08 | 公海【业务模块】 | NORMAL, EMPTY, PERMISSION_DENIED | 3 |
| E08-01 | 公海客户详情 | NORMAL | 1 |
| P01 | Dashboard | NORMAL, LOADING, EMPTY, ERROR | 4 |
| P02 | 车源管理 | NORMAL, LOADING, EMPTY, ERROR | 4 |
| P02-01 | 全部 | NORMAL | 1 |
| P02-02 | 批发 | NORMAL | 1 |
| P02-03 | 名邦 | NORMAL | 1 |
| P02-04 | 4S合作 | NORMAL, FOUR_S_DISABLED_TAKEOVER_REQUIRED, FOUR_S_VEHICLES_PAUSED, MINGBANG_TAKEOVER_IN_PROGRESS, TAKEOVER_COMPLETED, SUPPLY_ANOMALY_REVIEW | 1 |
| P02-05 | 已下架 | NORMAL | 1 |
| P02-06 | 异常 | NORMAL, VEHICLE_IDENTITY_CONFLICT, SUPPLY_ANOMALY, REVIEWING, CLEARED_HISTORICAL | 1 |
| P02-07 | 车辆详情 / 历史 | NORMAL, LOADING, HISTORICAL, PERMISSION_DENIED, PARTIAL_FAILURE | 5 |
| P03 | 金鱼塘同步 / API 管理 | NORMAL | 1 |
| P03-01 | 运行状态 | NORMAL, ERROR, PARTIAL_FAILURE | 3 |
| P03-02 | 三个固定车源同步 API | NORMAL | 1 |
| P03-05 | publisher 电话缓存 | NORMAL | 1 |
| P03-06 | Incident | NORMAL, PROCESSING, COMPLETED, ERROR | 4 |
| P03-07 | 调用 / 异常日志 | NORMAL | 1 |
| P04 | 员工 / 组织 / 权限 | NORMAL | 1 |
| P04-01 | 员工管理 | NORMAL, EMPLOYEE_ACTIVE, INACTIVE_HANDOFF_REQUIRED, REINSTATED_NO_AUTO_RESTORE | 1 |
| P04-02 | 角色模板 | NORMAL | 1 |
| P04-03 | 权限点 | NORMAL | 1 |
| P04-04 | 数据范围 | NORMAL | 1 |
| P04-05 | 接客状态 | NORMAL | 1 |
| P04-06 | 离职 / 失去业务资格客户与活跃业务交接 | NORMAL, PROCESSING, PARTIAL_FAILURE, ERROR, DISABLED, INACTIVE_HANDOFF_REQUIRED, HANDOFF_IN_PROGRESS, HANDOFF_COMPLETED | 5 |
| P04-07 | 离职交接批次 / 再次分配 | NORMAL, HANDOFF_MAPPING_REQUIRED, HANDOFF_MAPPING_PARTIAL, HANDOFF_READY_TO_CONFIRM, HANDOFF_COMPLETED | 1 |
| P05 | System Admin | NORMAL | 1 |
| P05-01 | System Admin 账号 | NORMAL, EMPTY, PERMISSION_DENIED, DISABLED | 4 |
| P05-02 | System Admin 权限 / 状态 | NORMAL | 1 |
| P06 | 客户与找车服务 | NORMAL | 1 |
| P06-01 | 客户管理 | NORMAL, MERGE_BLOCKED, MERGE_READY, MERGING, MERGED, MERGE_HISTORICAL | 1 |
| P06-02 | 客户归属 / 归属历史 | NORMAL | 1 |
| P06-03 | 客户画像 | NORMAL, COLLABORATION_ACTIVE, COLLABORATION_ENDED, REBUILD_REQUIRED, COLLABORATION_HISTORICAL | 1 |
| P06-04 | 客户跟进时间线 | NORMAL, COLLABORATION_ACTIVE, COLLABORATION_ENDED, COLLABORATION_HISTORICAL | 1 |
| P06-05 | 公海 | NORMAL, EMPTY, DISABLED, PERMISSION_DENIED, PUBLIC_POOL_ASSIGN_CONFIRM_REQUIRED, ASSIGNED, ASSIGN_DENIED | 4 |
| P06-06 | 客户等级 / 标签 / 业务权益 | NORMAL, RECOMMENDATION_QUALIFIED, NOT_QUALIFIED | 1 |
| P06-07 | 客户机会规则 | NORMAL | 1 |
| P06-08 | 找车申请 / 待确认申请 | NORMAL | 1 |
| P06-09 | 正式 demand | NORMAL | 1 |
| P06-10 | 匹配词典 / 规则词典【精简】 | NORMAL, PROCESSING, PARTIAL_FAILURE, ERROR | 4 |
| P06-11 | 咨询管理 | NORMAL, PROCESSING, COMPLETED, INVALID, CANCELLED, REASSIGN_DENIED, HISTORICAL | 1 |
| P07 | 锁车 / 候补 / 交易 / 资金 | NORMAL | 1 |
| P07-01 | 锁车 | NORMAL, LOCK_CREATE_CONFIRM_REQUIRED, LOCKED, RELEASED, EXPIRED, HISTORICAL, PERMISSION_DENIED, DEFAULT_LOCK_DURATION_CONFIGURED, LOCK_DURATION_SNAPSHOTTED | 1 |
| P07-02 | 候补 | NORMAL, WAITLISTED, RELEASED, NOT_LOCKABLE, HISTORICAL, PERMISSION_DENIED | 1 |
| P07-03 | 意向金 | NORMAL, EMPTY, RECORDED, CORRECTED, HISTORICAL, PERMISSION_DENIED | 1 |
| P07-04 | 交易 | NORMAL, IN_PROGRESS, COMPLETED, CANCELLED, HISTORICAL, PERMISSION_DENIED, REQUIRED_FIELDS_VALID, REQUIRED_FIELDS_MISSING_CONFIGURED | 1 |
| P07-05 | 退款 | NORMAL, PROCESSING, COMPLETED, CLOSED, HISTORICAL, PERMISSION_DENIED | 1 |
| P07-06 | 成交撤销 / 纠错 | NORMAL, PROCESSING, ERROR, HISTORICAL | 4 |
| P08 | 价格 / 查价规则 | NORMAL | 1 |
| P08-01 | 批发客户展示价 / 阶梯加价 | NORMAL, EMPTY, ERROR, DISABLED, PRICE_DRAFT, PRICE_SAVE_FAILED_EFFECTIVE_UNCHANGED, PRICE_EFFECTIVE | 4 |
| P08-02 | 每日查价额度 | NORMAL, QUOTA_DAY_UTC8_ACTIVE, QUOTA_DAY_RESET | 1 |
| P08-03 | 等级查价权益 | NORMAL | 1 |
| P08-04 | 单车客户展示价覆盖管理 | NORMAL, PRICE_DRAFT, PRICE_SAVE_FAILED_EFFECTIVE_UNCHANGED, PRICE_EFFECTIVE | 1 |
| P09 | 飞书 / 通知 | NORMAL | 1 |
| P09-01 | 员工飞书映射 | NORMAL | 1 |
| P09-02 | 飞书大群 / 服务 SLA | NORMAL, INCIDENT_CADENCE_CONFIGURED, CADENCE_NOT_CONFIGURED | 1 |
| P09-03 | 夜间免打扰 | NORMAL, DND_RECHECK_PENDING | 1 |
| P09-04 | 通知日志 / 失败记录 | NORMAL, EMPTY, ERROR, NOTIFICATION_SENT, FAILED, SKIPPED, DEDUPED, NOTIFICATION_NOT_ALLOWLISTED | 3 |
| P10 | 客户小程序公告 | NORMAL | 1 |
| P10-01 | 公告列表 | NORMAL, EMPTY, ERROR, ANNOUNCEMENT_DRAFT, SCHEDULED, ACTIVE, ENDED, REORDERED | 3 |
| P10-02 | 新建 / 编辑公告 | NORMAL | 1 |
| P12 | Banner / 运营位管理 | NORMAL | 1 |
| P12-01 | Banner 列表 | NORMAL, EMPTY, ERROR, DISABLED, BANNER_REORDERED | 4 |
| P12-02 | 新建 / 编辑 Banner | NORMAL, ERROR, DISABLED | 3 |
| P11 | 审计日志 | NORMAL, EMPTY, ERROR, PERMISSION_DENIED | 4 |

## PHASE 04.5 structural additions

- 4S permission-cropped navigation variants for E01/E02/E04.
- Explicit Demand transition CTA variants on E05-04.
- Explicit consultation start-processing variant on E06-02.
- Technical auth execution surfaces E-AUTH01 / P-AUTH01 (not product/business pages).

## CR-001 LOW-FI DELTA
Updated existing NORMAL artifacts only: C01-01, E02-01, E03-01, E03-02, E05-02, E05-04, P02-07, P12-01, P12-02. No page count increase.

| P02-08 | 车型待匹配 | NORMAL, JYT_MAPPING_PENDING_NON_BLOCKING | 1 |

| C01-BS01 | 筛选 | NORMAL | 1 |
| C01-BS02 | 排序 | NORMAL | 1 |
| C01-M01 | 查价确认 / 额度结果 | NORMAL | 1 |
| C01-M02 | 候补登记确认 | NORMAL | 1 |
| E07-M01 | 释放 / 取消锁车确认 | NORMAL | 1 |
| P07-M01 | 成交撤销 / 纠错确认 | NORMAL | 1 |
| P12-M01 | Banner 启停确认 | NORMAL | 1 |

## Phase 1.5 IA-only overlay definitions

下列定义属于后续局部低保真重做输入，不宣称已有 SVG；其 Page ID 可被 Navigation/State 唯一引用。

| Page ID | Name | Logical Visual States | Baseline Physical SVG Count |
|---|---|---|---:|
| C01-M03 | 分享 / 直接转介绍结果与来源归属说明 | NORMAL, SOURCE_ONLY, OWNER_ASSIGNED, OWNER_UNCHANGED, DIRECT_REFERRAL_CAPTURED, ERROR | 0 |
| E06-M01 | Consultation 转派确认 | NORMAL, DENIED, ERROR | 0 |
| E07-M02 | 意向金冲正 / 更正确认 | NORMAL, DENIED, ERROR | 0 |
| P07-M02 | 意向金冲正 / 更正确认 | NORMAL, DENIED, ERROR | 0 |
| E07-M03 | pending Refund 撤回 / 关闭确认 | NORMAL, DENIED, ERROR | 0 |
| P07-M03 | pending Refund 撤回 / 关闭确认 | NORMAL, DENIED, ERROR | 0 |
| P06-M01 | Customer 合并 Demand 阻断 | NORMAL, MERGE_BLOCKED, MERGE_READY, MERGING, MERGED, MERGE_HISTORICAL | 0 |

## Phase 1.5 IA adjustment overlay

The 293 SVG counts above are preserved as the unmodified low-fidelity baseline. The following are IA requirements for later local low-fidelity rework; they do not claim that a new SVG already exists.

| IA impact | Existing page groups | Required IA adjustment | Low-fi disposition |
|---|---|---|---|
| IA-01 | C01/C01-01/C01-M03, E04, P04-05 | 分享来源、owner 结果与关闭接客边界文案 | COPY_AND_STATE_REWORK |
| IA-02 | C01-01/C-O04, E02-01/02, P02-07 | 图片冻结、部分失败、失败不回滚提示 | STATE_REWORK |
| IA-03 | E03-01/02/03, P06-03/04 | 个人备注/共享画像分区及可见/继承边界 | INTERACTION_AND_LAYOUT_REWORK |
| IA-04 | E07-03/04/05, P07-03/04/05 | 收款、交易、退款分权 CTA | INTERACTION_REWORK |
| IA-05 | E06-02, P06-11 | 转派 actor、范围、目标资格与拒绝态 | STATE_REWORK |
| IA-06 | C01/C01-01, P12-01/02 | 纯展示 Banner、无效目标不跳转、预览 | INTERACTION_AND_STATE_REWORK |
| IA-07 | P04-01/03/04, P02-04, E04 | 4S 管理权限、合作范围与裁剪态 | INTERACTION_AND_PERMISSION_STATE_REWORK |
| IA-08 | E02-01, P02-07, P08-04 | 新 cycle 不继承旧覆盖价提示/历史标签 | COPY_REWORK |
| IA-09 | E07-03, P07-04 | 首次完成按钮的权限显示/禁用 | INTERACTION_REWORK |
| IA-10 | E07-04, P07-03/06, P07-M01 | 追加冲正/更正确认与历史 | OVERLAY_AND_STATE_REWORK |
| IA-11 | E07-05, P07-05 | pending Refund 撤回/关闭及 closed-not-refunded | OVERLAY_AND_STATE_REWORK |
| IA-12 | C01-M01/C01-01, P08-02 | 查价失败/超时不扣额与幂等重试 | STATE_REWORK |
| IA-13 | P06-01/P06-09 | active/paused Demand 合并阻断 | OVERLAY_AND_STATE_REWORK |
| IA-14 | C02/C02-02, E05-04/05/06, E02-01 | 四级结果、确认、Priority 与隐藏车受控可见 | STATE_AND_INTERACTION_REWORK |
| IA-15 | C03-04/05, E07-01～06, P07-01～06 | Waitlist/Lock/交易/退款 CTA、历史和正向投影 | INTERACTION_AND_STATE_REWORK |
| IA-16 | C01-M01, P08-01～04 | 成功扣额、失败不扣、快照与 cycle 边界 | STATE_REWORK |
| IA-17 | E03-01, E08, P06-01/02/05, P04-05 | owner、公海、领取/转派冲突与历史提示 | INTERACTION_AND_COPY_REWORK |
| IA-18 | E01-02, P06-07 | 删除旧机会阈值控件，保留聚合机会页 | CONTROL_REMOVAL_REQUIRED |
| IA-19 | E03-02, P06-03 | 最小个人备注/共享画像，删除大字段倾向 | LAYOUT_SIMPLIFICATION_REQUIRED |
| IA-20 | E02-01, P03-03/05 | 最新电话失败与缓存值分离、重试 | STATE_REWORK |
| IA-21 | P03-06, P09-02/03/04, P10-01/02, C-O03 | UTC+8、incident、免打扰重判、每日频控 | COPY_AND_TIME_STATE_REWORK |
| IA-22 | E02-02, P02-07, P11 | 三类时间标签与历史审计筛选 | COPY_AND_LABEL_REWORK |
| IA-23 | P09-04, P11 | 通知失败只改日志/文案，不改业务事实 | COPY_REWORK |
| IA-24 | E02-M01, P04, P05 | 身份、权限与禁用提示校准 | COPY_AND_PERMISSION_STATE_REWORK |
| IA-25 | — | 首次 Admin 初始化、通知队列、incident 分派 | ENGINEERING_ONLY_NOT_APPLICABLE |

No new first-level page, first-level tab, independent App or core business module is introduced.
