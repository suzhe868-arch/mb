# Phase 1.5 IA Changelog

<!-- IA-POST-CLOSEOUT-LF-B2-REPAIR -->
## 2026-10-08｜Low-Fi Batch 2 反向发现的 IA stale carrier 修复

状态：`PASS / CARRIER_REPAIR / NO_PRODUCT_SEMANTIC_CHANGE`

Low-Fi Batch 2 执行时反向发现 IA 明细仍存在分享 SOURCE_ONLY-only、Recommendation current-owner-only、Demand/Priority 客户 hidden visibility、CRM 直接 Lock、P06-07 Opportunity rules、Refund 旧 PROCESSING/COMPLETED 与 manager-only close、Announcement per-announcement daily cap 等 stale mirror。已全部按 PDM-03/13/14/16/18/19/24 Final 正规化；最终定向 stale-current scan=`0`。

<!-- IA-POST-CLOSEOUT-LF-B1-REPAIR -->
## 2026-10-08｜Low-Fi Batch 1 发现的 IA 后闭环 stale carrier 修复

状态：`PASS / CARRIER_REPAIR / NO_PRODUCT_SEMANTIC_CHANGE`

Low-Fi 首轮实际载体扫描发现 IA 明细仍残留少量已被 PDM Final 否定的 Current carrier：Customer Merge 页面/状态、人工创建 Priority 引用、单草稿 DRAFT_RESUME、P03 超出两子页结构及旧 phone capability 表述。已按既有 PDM Final / 已批准 IA 顶层 Authority 正规化；没有新增产品选择，也不重开 IA 产品审查。

<!-- IA-GLOBAL-B4-CHANGELOG -->
## 2026-10-08｜IA 全局集中对齐 Batch 4 Final-gap

状态：`PASS / USER_APPROVED / APPLIED`

用户明确：**“全部同意确认执行。”**

- `IA-B4-01`：Supply Anomaly 从“异常即统一阻断新增业务”修正为“异常只做风险告警；真实 offline/unavailable/sold 等不可售事实才按业务 Guard 阻断”。
- `IA-B4-02`：删除 P03 保存/测试 Collector 电话连接、Collector Base URL / Phone Path 等旧网络方向；保留三个固定车源同步 API + 名邦侧 credential/统计/运行状态 + Publisher 电话诊断。
- `IA-B4-03`：明确 4S Employee hard DENY Recommendation ≠ 4S Vehicle 不可被合法名邦业务 responsible 推荐。
- `IA-B4-04`：补齐服务称呼独立承载与 author/time/source/change history；与 Personal Note / Shared Profile 分离。
- `IA-B4-05`：CRM Access 固化为当前事实重验；历史服务不形成永久访问票据。
- `IA-B4-06`：Current 明细正规化；退出旧 P06-06 Recommendation qualification、current-owner-only Recommendation actor、旧 Collector 连接、Supply Anomaly 总阻断 carrier。
- 剩余 4 条 `CARRIER_DEFERRED` 已全部关闭为 `CARRIER_CLOSED_IA_BATCH4`。
- IA Current 目录 11 份文件 current-row stale 机械扫描：`0`。
- `FINAL_GAP_SCAN = PASS`；`LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0`；`PDM_FINAL_BUSINESS_SEMANTIC_CHANGE = 0`。
- IA 全局集中对齐完成；下一阶段：Low-Fi 全局集中对齐。

<!-- IA-GLOBAL-B2-B3-CHANGELOG -->
## 2026-10-08｜IA 全局集中对齐 Batch 2 + 3

状态：`PASS / USER_APPROVED / APPLIED`

用户明确：**“全部同意，确认执行”**。

### Batch 2
- `IA-B2-01～IA-B2-19 = PASS / USER_APPROVED / APPLIED`
- 已将明确废弃/已覆盖旧方向标为 `DO_NOT_RESTORE / SUPERSEDED`，包括独立 Recommendation qualification、独立调价、独立 can_call_wholesale_phone、第二套客户专属 Matching、人工 Priority/priority.*、旧 Opportunity 规则引擎、混合“我要这辆车”、Waitlist 自动晋升、Refund partial/专门 close permission、通用消息中心、Announcement 旧三档 frequency、万能配置中心等。

### Batch 3
- `IA-B3-01～IA-B3-30 = PASS / USER_APPROVED / APPLIED`
- 已补齐车型主数据/映射、多草稿、VIN Gate、Archive、图片资产化、publisher phone、价格等级与额度、Matching/Rule Dictionary、Priority、Recommendation、CRM Follow-up/Source Radar、公海指定分配、LockRequest/Waitlist/Lock、Refund/Transaction、C01/C02/C03/Vehicle Detail、Announcement/Banner 等真实 Current 承载。

### 边界
- PDM Final 不改。
- Low-Fi / Engineering 不施工。
- 未经 Batch 4 Final-gap Scan 与 Final→IA coverage 复核，不宣告 IA 完成。


<!-- IA-GLOBAL-B1-CHANGELOG -->
## 2026-10-08｜IA 全局集中对齐 Batch 1

状态：`USER_APPROVED / APPLIED`

用户已明确：**“全部同意，确认执行。”**

本批只落库 PDM-01～04 对 IA 的 16 条已批准映射，未提前处理后续价格、匹配、Priority、Recommendation、Lock/Waitlist、资金/交易等批次。

| 范围 | 结果 |
|---|---|
| Customer 首入 / owner | 分享/转介绍优先；无优先来源自然轮询；池空进入 owner_assignment_pending |
| 分享 / 转介绍 | 不再永久 SOURCE_ONLY；ownerless 新客可形成销售归属；已有 owner 不被抢走 |
| Customer Merge | V1 Current 全面退出；MERGE_* = DO_NOT_RESTORE |
| Owner / Handover | owner 与具体业务负责人分层；Handover Batch 逐对象映射，部分失败不整体回滚 |
| Permission / Data Scope | 统一角色模板 + 个人 allow/deny + data scope + object state + hard DENY |
| System Admin | 独立控制平面；新增/启停后续 Admin 由 active Admin 管理；至少保留 1 个 active Admin |
| 4S | 共用员工端裁剪视图；PC 仅授权后的本人有权 4S Vehicle P02 投影 |
| Vehicle 状态 | 资源/visibility/业务占用分层；hidden != offline |
| source_type | 名邦↔4S 同 vehicle_id，不新建 listing_cycle |
| 一键转名邦 | wholesale/JYT→mingbang 同 vehicle_id；不建第二 Vehicle；既有业务关系不迁移 |
| Listing Cycle | 只有真实不可售/失效→再次真实可售才新建 cycle |

本批变更已同步到 IA_CURRENT、Page/Navigation/State Register、Action/State/Guard/Permission/Lifecycle Contract 与 Source Index。


日期：2026-09-20  
范围：IA-01～IA-25

| ID | 修改前 | 修改后 | 修改原因 | 来源 | 页面结构 | 角色入口 | 状态 | 权限 | 留给低保真 |
|---|---|---|---|---|---|---|---|---|---|
| IA-01 | 接客关闭文案笼统 | 自动分配退出与本人有效分享分开 | D1 | `PHASE1.5_DECISION_REGISTER.md` D1 | 否 | 是 | 是 | 否 | 文案/状态 |
| IA-02 | 图片更新/失败语义不完整 | 冻结、部分失败、失败不回滚 | D2/HR-17 | `PHASE1.5_DECISION_REGISTER.md` D2/HR-17 | 否 | 否 | 是 | 是 | 状态 |
| IA-03 | 单一客户画像编辑区 | 个人备注/共享画像分区 | D3/HR-11 | `PHASE1.5_DECISION_REGISTER.md` D3/HR-11 | 局部 | 是 | 是 | 是 | 布局/状态 |
| IA-04 | 资金动作共用“授权动作” | 收款、交易、退款分权 | D4 | `PHASE1.5_DECISION_REGISTER.md` D4 | 否 | 是 | 是 | 是 | CTA |
| IA-05 | Consultation 转派只校验目标 | 同时校验 actor、范围、目标 | D5 | `PHASE1.5_DECISION_REGISTER.md` D5 | 否 | 是 | 是 | 是 | 禁用/错误 |
| IA-06 | Banner 只写安全目标 | 目标可选、内部白名单、失效不跳 | D6 | `PHASE1.5_DECISION_REGISTER.md` D6 | 否 | 否 | 是 | 是 | 状态/预览 |
| IA-07 | 4S 仅有裁剪导航 | 增加 4S 成员管理权限和合作范围条件 | D7 | `PHASE1.5_DECISION_REGISTER.md` D7 | 否 | 是 | 是 | 是 | 权限态 |
| IA-08 | 人工车覆盖价跨 cycle 未说明 | 新 cycle 不继承旧覆盖价 | D8 | `PHASE1.5_DECISION_REGISTER.md` D8 | 否 | 否 | 是 | 否 | 提示 |
| IA-09 | “成交”未限定首次完成 actor | 仅完成权限经理/店长可操作 | D9 | `PHASE1.5_DECISION_REGISTER.md` D9 | 否 | 是 | 是 | 是 | CTA/禁用 |
| IA-10 | 意向金无误录纠错入口 | 追加冲正/更正并留原事实 | D10 | `PHASE1.5_DECISION_REGISTER.md` D10 | 否 | 是 | 是 | 是 | 新 overlay |
| IA-11 | pending Refund 无退出 | 授权经理/店长可撤回/关闭 | D11 | `PHASE1.5_DECISION_REGISTER.md` D11 | 否 | 是 | 是 | 是 | 新 overlay |
| IA-12 | 查价失败结果未定义扣额 | 失败/超时不扣，重试幂等 | D12 | `PHASE1.5_DECISION_REGISTER.md` D12 | 否 | 否 | 是 | 否 | 失败态 |
| IA-13 | Customer 合并无 Demand 阻断 | active/paused Demand 时禁止合并 | D13 | `PHASE1.5_DECISION_REGISTER.md` D13 | 否 | 否 | 是 | 是 | 阻断 overlay |
| IA-14 | 匹配/Priority 展示不完整 | 四级结果、确认、隐藏车受控可见 | HR-01～03 | `PHASE1.5_DECISION_REGISTER.md` HR-01～03 | 否 | 是 | 是 | 是 | 标签/状态/交互 |
| IA-15 | 交易链条通用状态 | 补不晋升、不占车、不复活、保留历史 | HR-04～07 | `PHASE1.5_DECISION_REGISTER.md` HR-04～07；`STEP7_OPERATION_CLOSURE_REPORT.md` §2 | 否 | 是 | 是 | 是 | CTA/历史 |
| IA-16 | 价格页未统一 cycle/额度后果 | 成功扣额、失败不扣、快照与覆盖价 cycle 边界 | HR-08/D12 | `PHASE1.5_DECISION_REGISTER.md` HR-08/D12 | 否 | 否 | 是 | 是 | 状态 |
| IA-17 | owner/分享/公海规则分散 | 正式转派、领取、冲突和历史统一 | HR-09/10 | `PHASE1.5_DECISION_REGISTER.md` HR-09/10 | 否 | 是 | 是 | 是 | 提示/交互 |
| IA-18 | 可能保留旧具体机会阈值 | 删除 DP-01 旧阈值控件，保留聚合机会页 | DP-01 | `PHASE1.5_DECISION_REGISTER.md` DP-01（原 HO-12） | 否 | 否 | 是 | 是 | 删除控件 |
| IA-19 | 可能恢复大字段画像 | 只保留最小个人备注/共享画像 | DP-02/D3 | `PHASE1.5_DECISION_REGISTER.md` DP-02/D3 | 局部 | 是 | 是 | 是 | 简化布局 |
| IA-20 | 最新电话失败与缓存值未区分 | 显示失败、缓存仍可用、重试 | `PHASE1.5_FINAL_GATE.md` §9 | `PHASE1.5_FINAL_GATE.md` §9；`STEP6_ORPHAN_AND_OMISSION_REPORT.md` §3.2 | 否 | 否 | 是 | 是 | 失败态 |
| IA-21 | 时间/incident/公告口径分散 | UTC+8、节奏、免打扰重判、每日频控 | HR-12～14 | `PHASE1.5_DECISION_REGISTER.md` HR-12～14 | 否 | 否 | 是 | 否 | 文案/时间 |
| IA-22 | 车辆时间与历史标签不完整 | 三类时间分离、历史不物删 | HR-15/16 | `PHASE1.5_DECISION_REGISTER.md` HR-15/16 | 否 | 否 | 是 | 是 | 标签 |
| IA-23 | KEEP + MODIFY_COPY 双分类 | 单一分类 MODIFY_COPY；失败只改日志文案 | `PHASE1.5_FINAL_GATE.md` §9 | `PHASE1.5_FINAL_GATE.md` §9；`STEP7_OPERATION_CLOSURE_REPORT.md` Notification | 否 | 否 | 否 | 否 | 文案 |
| IA-24 | KEEP + MODIFY_COPY 双分类 | 单一分类 MODIFY_COPY；校准身份/权限禁用提示 | DP-05 | `PHASE1.5_DECISION_REGISTER.md` DP-05 | 否 | 是 | 是 | 是 | 文案 |
| IA-25 | 工程待办可能被误加为页面 | 明确 ENGINEERING_ONLY，不新增 UI/IA | `PHASE1.5_FINAL_GATE.md` §4/§10 | `PHASE1.5_FINAL_GATE.md` §4/§10 | 否 | 否 | 否 | 否 | 否 |

## 汇总

```text
IMPACT_ITEMS = 25/25
FIRST_LEVEL_STRUCTURE_CHANGED = NO
ROLE_ENTRY_ADJUSTMENTS = YES_LOCAL
STATE_ADJUSTMENTS = YES_LOCAL
PERMISSION_ADJUSTMENTS = YES_LOCAL
LOW_FI_REWORK = DEFERRED
```

## Luna review fix round 1

| Finding | 修正 |
|---|---|
| R-01 | 4S 角色和 Lock CTA 明确排除 4S |
| R-02 | Recommendation CTA 增加 current owner、customer/vehicle/listing cycle 与幂等条件 |
| R-03 | P07-06 增加经理/店长、交易纠错权限、数据范围、原因与审计 |
| R-04 | 历史审查曾要求 P02-08 增加“创建后绑定”；该历史建议已被后续 B-01 明确 `SUPERSEDED`，当前只保留绑定既有节点、保留/纠正并关闭任务 |
| R-05 | Navigation Register 改为自包含当前权威，取消对历史 `06_PAGE_ACTION_MATRIX.md` 的规范性依赖 |

## Luna second-review fix round

| Finding | Verified disposition |
|---|---|
| B-01 | 删除无当前业务来源授权的“创建车型并绑定”；保留已确认的绑定、保留/纠正与关单路径，不产生新决断 |
| B-02 | 4S 角色边界收回至 Step 4 明确确认的 CRM/找车/咨询/Lock/Transaction，不扩展未确认禁区 |
| B-03 | 为交易创建/取消、意向金、退款发起、候补结束和 owner 转派补齐已确认的负责人、权限、数据范围与原因条件 |
| B-04 | 在既有 P08 补登记覆盖价设置/取消及审计路由，不新增页面或对象 |
| B-05 | E03 Recommendation 补 customer+vehicle+listing cycle 同周期幂等条件 |
| F-01 | Lock 释放/取消补当前负责人或范围内授权经理/店长、数据范围与原因条件 |

## HISTORICAL / SUPERSEDED — V1 cold-start remediation 2026-09-20

- 本段只记录 V1 轨迹，已由 V2 统一账本/变更集取代，不是当前整改结论。
- 历史 `FIX-01～FIX-18` 映射曾位于 `IA_COLD_START_REMEDIATION_ISSUE_LEDGER.md` 与 `IA_COLD_START_REMEDIATION_CHANGE_SET.md`；V2 不引用这两份旧文件作为 Current。
- Page/Nav/State 引用改为唯一 ID，新增 `C01-M03` IA-only 分享结果 overlay；
- Demand/Matching/Priority/Recommendation、Waitlist→manual Lock、Transaction/Refund、relist→new cycle、Internal Mode、4S 管理和跨端终态均已持久化；
- Page Manifest 对 IA-01～IA-25 逐项给出 low-fi disposition；
- 历史记录保留但以 `SUPERSEDED` 明确与当前规则隔离。

## Unified remediation V2 — five-report freeze

- `FIX-01～FIX-14` 见 `IA_UNIFIED_REMEDIATION_CHANGE_SET.md`；五轮问题均在 `IA_UNIFIED_REMEDIATION_ISSUE_LEDGER.md` 去重归并。
- 新增/补齐：直接转介绍、Merge 正向闭环、员工失格交接、Collaboration、客户车辆意向工作项、JYT mapping pending 正向语义、电话统一投影、UTC+8 额度日。
- 新增/补齐：员工与配置命令面、车辆异常、Priority 冻结与去重、通知白名单、价格失败安全、申请撤回、公海指定分配、图片恢复、自助接客、默认 Lock 时长、Banner 排序。
- Manifest 已把逻辑状态与物理 SVG 数量拆开；基线唯一物理资产为 293（产品 289 + 技术授权 4），归档内双份路径合计 586，未修改 SVG。
- 未冻结的 incident 精确频率、交易/交付必填字段全集不由 IA 猜测；保持配置/工程承接。

## 2026-09-20｜IA V2 逐 Atom 覆盖证明收尾

- 在 `IA_CURRENT.md §9.1` 增加证据型显式承载：JYT 同步 Actor/日志、`car_code` 身份复用与本地状态保护、车型映射纠错不反写、人工发布非硬门槛资料、供应异常清除条件。
- 上述内容均直接来自 Phase 1.5 Step 5 已冻结结论；不形成新业务决定，不修改低保真 SVG，不进入 Phase 2，不修改 DB/API/Worker/工程代码。
- 本轮新增逐 Rule / Action / State / Lifecycle Inventory、Atom→Current Crosswalk、Coverage Reconciliation 与独立串行 Reviewer 证据；最终 Gate 以这些可复算证据为准。


## V5 全量收口整改
- RC04：V4 59 Action candidate 全量重判，非 command 明确 reclass；保留 Action 去模板化并修正 result-state。
- RC04：51 domain State 改为对象级 Entry/Exit/Cancel/Recover；25 对象×10 Lifecycle 改为逐 cell current carrier。
- RC06：82 Journey self-proof 改为独立 Action/State/Lifecycle/Current carrier。
- RC07：P09-01/02/03 从 `MAPPING_CORRECTION` 改为 `NOTIFICATION_CONFIG`。
- V4 外部报告作为冻结施工输入；V4 内部 Gate 不进入 V5 当前权威。

## 2026-09-21｜V5 最终剩余问题定向整改与验收器修复

- 修复 Permission 136 条活动 Current 引用、State Dictionary 51 条活动 Current 引用；
- 2028 Frozen Instance Closure 全量重绑到包内 V5 有效证据，并按 root/category 重新执行 false-closed 语义校验；
- 对 Lifecycle 172 个 FULL cell 执行 `OBJECT × DIMENSION` 语义复核，清除 wrong-object / weak carrier；
- 真实生成 `IA_V5_FULL_CLOSURE_SELF_CHECK.md`，消除 Current missing self-check；
- 增强 Validator：target existence、active version、semantic match、false-closed、Gate-ahead；
- FI-01～FI-04 故障注入 4/4 PASS，清理 PASS，正式树未被污染；
- Saturation Pass 1 / Pass 2 连续 0；Reviewer A/B/C PASS；
- `INTERNAL_V5_FINAL_CLOSURE_GATE = PASS`；仅开放最终外部剩余问题复验；Low-Fi Gate 继续关闭。


## 2026-09-21｜FR-V5-001～003 最终定向整改
- Validator 增加 Permission RESULT 一致性与 overgrant/undergrant 检查；
- Validator 增加 State BUSINESS_OBJECT / STATE_TYPE 检查；
- Lifecycle 新增 `IA_V5_LIFECYCLE_EXPECTED_DIMENSION_CONTRACT.csv`，Semantic Review 增加 EXPECTED/ACTUAL DIMENSION 与 DIMENSION_MATCH；
- Gate-ahead 链接到三项新语义检查；
- 新增 FI-05～FI-07，并回归 FI-01～FI-04；
- 不修改 Permission 136、State 51、Lifecycle 172 FULL 的业务基线数据本体。
