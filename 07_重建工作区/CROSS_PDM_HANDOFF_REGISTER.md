# 名邦汽车 V1｜Cross-PDM Handoff Register｜跨域移交总账

> 状态：`ACTIVE / METHOD_CONTROL`  
> 首次建立：2026-10-05  
> 作用：记录跨 PDM 移交的来源、目标、完整语义、关闭状态与来源反向回写状态。  
> 方法 Authority：`00_先读/01_产品基线重建执行规范_冻结工作版.md` Gate 11。  
> 注意：本文件管理“任务状态与承接关系”，不凭自身创造新的产品业务规则；产品 Authority 仍来自用户裁决、PDM Final 与 Decision Register。

---

## 1. 状态定义

- `HANDOFF_OPEN`：来源已移交，目标 PDM 尚未完成；
- `HANDOFF_ACCEPTED`：目标已接收并进入工作版 / Atom / Decision，但尚未最终关闭；
- `HANDOFF_CLOSED`：目标已形成最终 Authority；
- `HANDOFF_SUPERSEDED`：后续裁决改变或替代原移交语义。

附加字段：

- `source_backwrite = YES`：目标完成后，来源 PDM 已同步成“已完成承接 / superseded”；
- `source_backwrite = PENDING`：目标事实上已完成，但来源仍未回写，属于 `STALE_HANDOFF`；
- `carrier_deferred = YES`：IA / Low-Fi 承载问题已登记，统一等 PDM-25 + 全局总复核后集中处理。

任何新 PDM 开始前必须先读本表；任何目标 handoff 关闭后必须反向更新来源 PDM。

---

## 2. PDM-01～PDM-10 Integrity 问题总览

### 2.1 PDM-01｜6 组｜已全部关闭

| ID | 问题 | 当前状态 |
|---|---|---|
| P01-LIA-01 | 独立登录页语义被压缩 | RESOLVED |
| P01-LIA-02 | 找车表单拒绝手机号授权后的临时保留边界被压缩 | RESOLVED |
| P01-LIA-03 | 客户其他联系电话维护仍错误留给 PDM-02 | RESOLVED / HANDOFF_CLOSED |
| P01-LIA-04 | 接客池异常为空时 owner_assignment_pending 例外缺失 | RESOLVED |
| P01-LIA-05 | owner / 分享 / 转介绍仍错误留给 PDM-03，SOURCE_ONLY 旧规则残留 | RESOLVED / HANDOFF_CLOSED / SUPERSEDED_OLD_SOURCE_ONLY |
| P01-LIA-06 | Customer 停用模型过重，重新裁为轻量后台停用 / 恢复 | RESOLVED |

审计报告：`PDM-01_历史最终版完整性复核_2026-10-04.md`。

### 2.2 PDM-02｜8 组｜已全部关闭

| ID | 问题 | 当前状态 |
|---|---|---|
| P02-LIA-01 | 权限撤销即时生效 / 旧登录态失权被压缩 | RESOLVED |
| P02-LIA-02 | inactive→active accepting 默认 OFF 范围不完整 | RESOLVED |
| P02-LIA-03 | 调店前 Customer / 活跃业务交接过于笼统 | RESOLVED |
| P02-LIA-04 | 治理审计最小字段与 reason 边界被压缩 | RESOLVED |
| P02-LIA-05 | PDM-03 owner / accepting / handover 已做完但 PDM-02 未同步 | RESOLVED / HANDOFF_CLOSED |
| P02-LIA-06 | System Admin 自身新增 / 启停治理动作闭环不完整 | RESOLVED |
| P02-LIA-07 | System Admin 是否可直接停用 / 恢复 Customer | RESOLVED / USER_REOPEN |
| P02-LIA-08 | PDM-03/04/06/09/10 已完成但仍显示“留后续” | RESOLVED / STALE_HANDOFF_CLEANED |

审计报告：`PDM-02_历史最终版完整性复核_2026-10-04.md`。

### 2.3 PDM-03｜9 组｜已全部关闭

| ID | 问题 | 当前状态 |
|---|---|---|
| P03-LIA-01 | Customer 主动要求更换销售的触发来源被压掉 | RESOLVED |
| P03-LIA-02 | 普通 owner transfer 默认 reason 非必填边界丢失 | RESOLVED |
| P03-LIA-03 | 复职只写重新入职，未覆盖 inactive→active | RESOLVED |
| P03-LIA-04 | 离职 / 失效交接对象清单被压薄 | RESOLVED |
| P03-LIA-05 | Handover Batch 逐对象映射 / 部分失败语义不完整 | RESOLVED |
| P03-LIA-06 | PDM-10 已完成分享 / 查价权，但 PDM-03 仍显示待后续 | RESOLVED / HANDOFF_CLOSED |
| P03-LIA-07 | 公司客户历史访问边界未进入 Final | RESOLVED |
| P03-LIA-08 | Customer 停用 / 恢复对 owner 连续性未同步 | RESOLVED |
| P03-LIA-09 | 首次无 owner / SOURCE_ONLY / 转介绍入口 / handover 通用壳等 stale carrier | RESOLVED / CARRIER_DEFERRED |

审计报告：`PDM-03_历史最终版完整性复核_2026-10-05.md`。

### 2.4 PDM-04｜11 组｜已全部关闭

| ID | Integrity 问题 | 最终状态 |
|---|---|---|
| P04-LIA-01 | listing_cycle 新周期开始时间优先级被压掉 | RESOLVED |
| P04-LIA-02 | listing_started_at / 人工上传时间 / JYT 平台收录时间、今日新增 vs 重新上架语义不完整 | RESOLVED |
| P04-LIA-03 | source_type=4S 不等于授权任意 4S 成员管理 | RESOLVED |
| P04-LIA-04 | locked / trading 期间真实车辆事实更新边界缺失 | RESOLVED |
| P04-LIA-05 | PDM-08 图片资产化已完成但来源仍显示留后续 | RESOLVED / HANDOFF_CLOSED |
| P04-LIA-06 | PDM-10 转换价格语义已完成但来源仍显示留后续 | RESOLVED / HANDOFF_CLOSED |
| P04-LIA-07 | PDM-05 / PDM-06 等已完成目标未反向关闭 | RESOLVED / STALE_HANDOFF_CLEANED |
| P04-LIA-08 | car_code 与 PDM-09 publisher identity 电话定位边界未显式隔离 | RESOLVED / HANDOFF_CLOSED |
| P04-LIA-09 | JYT 三个固定业务 API 及 PDM-22 / PDM-23 handoff 未正式登记 | RESOLVED / HANDOFF_OPEN_REGISTERED |
| P04-LIA-10 | 双 Vehicle、旧粗粒度 normal-only Guard、旧 conversion relation 等 carrier stale | RESOLVED / CARRIER_DEFERRED |
| P04-LIA-11 | Supply Anomaly 是否统一阻断新增业务 | RESOLVED / USER_DECISION_B |

用户最终裁决 P04-LIA-11：**Supply Anomaly 本身只作为风险告警，不统一阻断新增业务；真实 `offline / unavailable` 才按不可售事实硬阻断新增普通销售业务。**

PDM-04 Legacy Final Integrity Audit：`INTEGRITY_PASS`。

### 2.5 PDM-05｜7 组｜已全部关闭

| ID | Integrity 问题 | 最终状态 |
|---|---|---|
| P05-LIA-01 | PDM-05→PDM-06 固定属性/发布联动已完成，但来源仍显示留后续 | RESOLVED / HANDOFF_CLOSED |
| P05-LIA-02 | mapping conflict 缺“车辆业务继续、不自动冻结”边界 | RESOLVED |
| P05-LIA-03 | 待映射 / 缺主数据 / mapping conflict 的明确待处理提示被压薄 | RESOLVED |
| P05-LIA-04 | “后台 Admin”与 PDM-02 System Admin 身份发生歧义 | RESOLVED / USER_DECISION_4A |
| P05-LIA-05 | 车型主档纠错后已发布车辆固定属性当前值与历史快照边界未闭环 | RESOLVED / USER_DECISION_5A |
| P05-LIA-06 | PDM-12/20/21/22/25 future handoff 未正式进入总账 | RESOLVED / HANDOFF_OPEN_REGISTERED |
| P05-LIA-07 | IA/Low-Fi 仍有 name-match、no-model-creation、四级年款、pending=unknown 等 stale carrier | RESOLVED / CARRIER_DEFERRED |

用户最终裁决：

- **4A**：车型主数据 / JYT mapping / MODEL_MISSING / conflict / merge 归 System Admin 控制平面治理，`vehicle.model.manage` 为该治理域能力 Guard；
- **5A**：车型唯一确定的固定属性当前值跟随有效车型主档纠错；Recommendation / Lock / Transaction / 成交及其他历史快照与 JYT 原始 source facts 不追改。

PDM-05 Legacy Final Integrity Audit：`INTEGRITY_PASS`。

### 2.6 PDM-06｜6 组｜已全部关闭

| ID | Integrity 问题 | 最终状态 |
|---|---|---|
| P06-LIA-01 | R10 已确认“首次正式发布前草稿可改 source_type”未进入 Final | RESOLVED |
| P06-LIA-02 | PDM-07 已完成档案/车况/交付材料承接，但 PDM-06 仍写“继续处理” | RESOLVED / HANDOFF_CLOSED |
| P06-LIA-03 | PDM-08 已完整承接人工车 0 图/补图/删图规则，但未登记闭环 | RESOLVED / HANDOFF_CLOSED |
| P06-LIA-04 | PDM-10 已完成价格 supersession，但 Register 未形成正式闭环 | RESOLVED / HANDOFF_CLOSED |
| P06-LIA-05 | PDM-21/22/25 future handoff 未正式登记 | RESOLVED / HANDOFF_OPEN_REGISTERED |
| P06-LIA-06 | IA/Low-Fi 仍有 DRAFT_RESUME、旧 MODEL_MISSING return、VIN Gate/保存修改缺失等 stale carrier | RESOLVED / CARRIER_DEFERRED |

PDM-06 Legacy Final Integrity Audit：`INTEGRITY_PASS`。

### 2.7 PDM-07｜4 组｜已全部关闭

| ID | Integrity 问题 | 最终状态 |
|---|---|---|
| P07-LIA-01 | PDM-08 已完成报告/档案图片、出险图片、4S维保图片/H5 与相册隔离承载，但 PDM-07 未反向闭环 | RESOLVED / HANDOFF_CLOSED |
| P07-LIA-02 | PDM-12/13/14/15/18/19 的车况/档案业务 Guard 未正式进入总账 | RESOLVED / HANDOFF_OPEN_REGISTERED |
| P07-LIA-03 | PDM-20/21/22/25 的客户端/员工端/配置/审计承接未正式进入总账 | RESOLVED / HANDOFF_OPEN_REGISTERED |
| P07-LIA-04 | IA/Low-Fi 仍缺 archive maintenance / customer_visible / provenance / 4S archive access / audit 等真实 carrier | RESOLVED / CARRIER_DEFERRED |

PDM-07 Legacy Final Integrity Audit：`INTEGRITY_PASS`。

### 2.8 PDM-08｜5 组｜已全部关闭

| ID | Integrity 问题 | 最终状态 |
|---|---|---|
| P08-LIA-01 | 分享卡片漏掉“客户展示价/动态受权限价格不得固化” | RESOLVED |
| P08-LIA-02 | 4S维保H5/报告受控 URL 缺当前 Vehicle Read + customer_visible 重验 Guard | RESOLVED |
| P08-LIA-03 | 转名邦资产化未闭环图片如何展示未定义 | RESOLVED / USER_DECISION_3A |
| P08-LIA-04 | PDM-20/21/22/25 future handoff 未正式登记 | RESOLVED / HANDOFF_OPEN_REGISTERED |
| P08-LIA-05 | IMG-001～030 早期映射与 2026-10-03 CDN 重映射并存，唯一 traceability 口径未显式 | RESOLVED / TRACEABILITY_NORMALIZED |

PDM-08 Legacy Final Integrity Audit：`INTEGRITY_PASS`。

### 2.9 PDM-09｜5 组｜已全部关闭

| ID | Integrity 问题 | 最终状态 |
|---|---|---|
| P09-LIA-01 | P03-05 只展示 upstream_publisher_id，缺 source_platform 复合身份与电话明文权限隔离 | RESOLVED |
| P09-LIA-02 | JYT 返回空号/非法号码时是否覆盖现有有效缓存未显式 | RESOLVED |
| P09-LIA-03 | 批发→名邦后车辆详情是否继续显示原上游电话未定义 | RESOLVED / USER_DECISION_3A |
| P09-LIA-04 | PDM-21/22/23/25 future handoff 未正式登记 | RESOLVED / HANDOFF_OPEN_REGISTERED |
| P09-LIA-05 | IA/Low-Fi/旧实现仍有 Collector 旧方向、publisher_id 泛化、集成权限=电话明文权限等 stale carrier | RESOLVED / CARRIER_DEFERRED |

PDM-09 Legacy Final Integrity Audit：`INTEGRITY_PASS`。

### 2.10 PDM-10｜5 组｜已全部关闭

| ID | Integrity 问题 | 最终状态 |
|---|---|---|
| P10-LIA-01 | PDM-01→PDM-10 Customer 停用 handoff 在 Register 已 CLOSED，但 PDM-10 Final 未真正写入“暂停能力、不删除权利” | RESOLVED / HANDOFF_CLOSED_TRUE_BACKWRITE |
| P10-LIA-02 | M11-001 `DAILY_PRICE_QUOTA_EXHAUSTED → 联系顾问` 未进入 Final，且与“查看价格 / 价格咨询”状态未严格分层 | RESOLVED |
| P10-LIA-03 | UNLIMITED 与当天临时追加额度关系未定义 | RESOLVED / USER_DECISION_3A |
| P10-LIA-04 | PDM-14/18/20/21/22/25 future handoff 未按正式状态机登记 | RESOLVED / HANDOFF_OPEN_REGISTERED |
| P10-LIA-05 | 价格域 Current/Low-Fi 仍有 4S internal mode、旧调价、override、quota/level config 等 stale carrier | RESOLVED / CARRIER_DEFERRED |

PDM-10 Legacy Final Integrity Audit：`INTEGRITY_PASS`。

### 2.11 PDM-01～10 全局 Cross-PDM / Handoff / Global Invariant 总复核｜PASS

- PDM-01～10 内部 handoff：无 OPEN / ACCEPTED 残留；
- 所有 CLOSED handoff：均有目标 Authority；
- 所有 CLOSED handoff：`source_backwrite = YES`；
- PDM-11～25 future handoff：69 条 OPEN，均有明确 target、完整语义与 backwrite 要求；
- Cross-PDM Conflict：0；
- Handoff Gap unresolved：0；
- Global Invariant Conflict：0；
- IA / Low-Fi Authority Override：0；
- 本轮只发现并修正两项控制性 stale：PDM-01～07 顶部 Integrity 状态未同步；PDM-01 §10 仍把已完成 PDM-02 权限承载写成“留后续”。

全局报告：

> `07_重建工作区/PDM-01至10_全局Cross-PDM_Handoff_GlobalInvariant总复核_2026-10-05.md`

最终：

> **`GLOBAL_PDM01_10_CROSS_PDM_AUDIT = PASS`**

> **PDM-11 启动门禁解除。**

---

## 3. PDM-01 来源 handoff

| handoff_id | 目标 | 完整移交语义 | 状态 | 目标 Authority | source_backwrite |
|---|---|---|---|---|---|
| HO-P01-P02-001 | PDM-02 | Customer 其他联系电话维护使用受控 capability + data scope；主要手机号不因此开放直接改写 | HANDOFF_CLOSED | PDM-02 §11 | YES |
| HO-P01-P02-002 | PDM-02 | Customer 停用 / 恢复员工侧能力继承统一 permission / data scope / hard DENY；后续裁决 System Admin 可直接作为控制平面治理动作执行 | HANDOFF_CLOSED | PDM-02 §6 / §15 + PDM01-DEC-A16-R2 | YES |
| HO-P01-P03-001 | PDM-03 | owner / 分享 / 转介绍 / accepting / 离职交接；ownerless 新 Customer 的有效分享可形成归属，已有 owner 不被抢 | HANDOFF_CLOSED | PDM-03 Final | YES |
| HO-P01-P10-001 | PDM-10 | 查价权的产生、有效期、listing_cycle 边界由价格域冻结；Customer 停用只做上层可用性 Guard | HANDOFF_CLOSED | PDM-10 Final | YES |
| HO-P01-P11-001 | PDM-11 | Demand 生命周期；旧口径：Customer 停用不得自动终止既有 Demand，具体状态由 Demand 域处理 | HANDOFF_SUPERSEDED | 2026-10-05 用户主动修正；由 HO-P01-P11-002 替代 | YES |
| HO-P01-P11-002 | PDM-11 | Customer 停用后正在运行的 Demand 必须停止继续运行：active → paused；历史、条件、推荐/匹配/跟进等事实保留；账号恢复不自动恢复 Demand，需正式 resume | HANDOFF_ACCEPTED | PDM-11 工作版 §9A P11-B3-01 | YES |
| HO-P01-P14-001 | PDM-14 | Recommendation 生命周期与当前 listing_cycle 权利；Customer 身份连续性不得被 Recommendation 重建 | HANDOFF_OPEN | - | YES |
| HO-P01-P15-001 | PDM-15 | Consultation 生命周期；Customer 停用不自动抹除既有 Consultation 历史 | HANDOFF_OPEN | - | YES |
| HO-P01-P16-001 | PDM-16 | CRM 画像 / 跟进 / 员工内部客户称呼；客户昵称与员工内部备注必须分离 | HANDOFF_OPEN | - | YES |
| HO-P01-P18-001 | PDM-18 | Lock / Waitlist 生命周期；Customer 停用不自动取消已存在业务对象 | HANDOFF_OPEN | - | YES |
| HO-P01-P19-001 | PDM-19 | Transaction / Refund 生命周期；Customer 停用不改写历史事实 | HANDOFF_OPEN | - | YES |
| HO-P01-P20-001 | PDM-20 | 客户端个人资料、账号已停用时的具体页面表现；公开浏览仍可用，受身份/权益业务能力暂停 | HANDOFF_OPEN | - | YES |
| HO-P01-P25-001 | PDM-25 | Customer 身份、手机号、停用/恢复、来源/owner 历史的统一审计与留存标准 | HANDOFF_OPEN | - | YES |

---

## 4. PDM-02 来源 handoff

| handoff_id | 目标 | 完整移交语义 | 状态 | 目标 Authority | source_backwrite |
|---|---|---|---|---|---|
| HO-P02-P03-001 | PDM-03 | accepting OFF 只影响未来自然轮询；inactive / 离职交接 Customer owner + 活跃业务；复职不自动恢复 accepting | HANDOFF_CLOSED | PDM-03 Final | YES |
| HO-P02-P04-001 | PDM-04 | 一键转名邦无独立 convert permission；4S 不能一键转名邦；4S 失效后的车辆展示/匹配/名邦承接按车辆域处理 | HANDOFF_CLOSED | PDM-04 Final | YES |
| HO-P02-P06-001 | PDM-06 | 人工名邦 / 4S 车辆发布、source_type 与管理能力承接统一 permission + data scope 模型 | HANDOFF_CLOSED | PDM-06 Final | YES |
| HO-P02-P09-001 | PDM-09 | 上游发布人电话是独立敏感能力；Internal Mode 本身不授权；4S 身份本身不自动获得该能力 | HANDOFF_CLOSED | PDM-09 Final | YES |
| HO-P02-P10-001 | PDM-10 | 取消独立调价 permission/action；正常价格编辑与内部价查看字段级保护由 PDM-10 冻结 | HANDOFF_CLOSED | PDM-10 Final | YES |
| HO-P02-P01-001 | PDM-01 | Customer 停用/恢复治理动作的最终执行主体与 Customer 身份连续性双向同步 | HANDOFF_CLOSED | PDM-01 §11 + PDM01-DEC-A16-R2 | YES |
| HO-P02-P15-001 | PDM-15 | Consultation 负责人 / 转派必须继承 identity + permission + data scope + object state | HANDOFF_OPEN | - | YES |
| HO-P02-P16-001 | PDM-16 | CRM 业务细节与访问范围必须继承统一权限模型 | HANDOFF_OPEN | - | YES |
| HO-P02-P17-001 | PDM-17 | 公海 / Collaboration 的领取、分配、协作必须继承 owner / permission / scope / inactive 边界 | HANDOFF_OPEN | - | YES |
| HO-P02-P18-001 | PDM-18 | Lock / Waitlist 动作与负责人必须继承统一权限和对象状态 | HANDOFF_OPEN | - | YES |
| HO-P02-P19-001 | PDM-19 | Transaction / Refund / 成交纠错继承权限、scope、终态与历史边界 | HANDOFF_OPEN | - | YES |
| HO-P02-P21-001 | PDM-21 | 员工端页面 / Internal Mode 只是投影，不得把入口可见性当授权；4S 继续按 hard DENY 裁剪 | HANDOFF_OPEN | - | YES |
| HO-P02-P22-001 | PDM-22 | PC 后台员工、权限、System Admin、角色模板、data scope 等配置承载 | HANDOFF_OPEN | - | YES |
| HO-P02-P25-001 | PDM-25 | role / permission / scope / active-inactive / System Admin 等统一审计字段与留存 | HANDOFF_OPEN | - | YES |

---

## 5. PDM-03 来源 handoff

| handoff_id | 目标 | 完整移交语义 | 状态 | 目标 Authority | source_backwrite |
|---|---|---|---|---|---|
| HO-P03-P10-001 | PDM-10 | 普通分享/收藏不授价；二次分享不转移价格权；正式 Recommendation 才授当前 customer+vehicle+listing_cycle 免费查价权 | HANDOFF_CLOSED | PDM-10 §10 | YES |
| HO-P03-P13-001 | PDM-13 | Priority TTL、可见隔离、交接后的具体 lifecycle；Priority 必须进入离职/资格失效交接扫描 | HANDOFF_OPEN | - | YES |
| HO-P03-P14-001 | PDM-14 | Recommendation lifecycle、正式推荐关系、hidden 单车可见授权；不得用普通分享替代 Recommendation 权利 | HANDOFF_OPEN | - | YES |
| HO-P03-P15-001 | PDM-15 | Consultation 完整负责人 / 转派 / SLA；owner 变化不自动漂移已固化业务负责人 | HANDOFF_OPEN | - | YES |
| HO-P03-P16-001 | PDM-16 | CRM 跟进、画像、阶段、Source Radar、公司客户历史页面/字段投影；历史服务过不产生永久访问权 | HANDOFF_OPEN | - | YES |
| HO-P03-P17-001 | PDM-17 | 公海 / 待公海 / 后台分配 / 领取 / Collaboration；不得通过分享绕过已有 owner 或正式治理 | HANDOFF_OPEN | - | YES |
| HO-P03-P18-001 | PDM-18 | Waitlist / Lock 负责人状态机；owner 变化不自动漂移负责人 | HANDOFF_OPEN | - | YES |
| HO-P03-P19-001 | PDM-19 | Transaction / Refund 负责人状态机；owner 变化不自动重写交易历史 | HANDOFF_OPEN | - | YES |
| HO-P03-P20-001 | PDM-20 | 客户端分享页、推荐朋友 / 直接转介绍真实入口、已有 owner 不被分享抢客的交互投影 | HANDOFF_OPEN | - | YES |
| HO-P03-P21-001 | PDM-21 | 员工端分享入口与绑定销售上下文的交互投影 | HANDOFF_OPEN | - | YES |
| HO-P03-P25-001 | PDM-25 | owner transfer / handover batch / 来源 / 历史贡献统一审计标准 | HANDOFF_OPEN | - | YES |

---

## 6. PDM-04 来源 handoff

> 2026-10-05 PDM-04 Legacy Final Integrity Audit 已通过；PDM-05～10 已完成事项保持 `HANDOFF_CLOSED`，新产生的 PDM-20 / PDM-22 / PDM-23 handoff 已正式登记为 `HANDOFF_OPEN`。

| handoff_id | 目标 | 完整移交语义 | 状态 | 目标 Authority | source_backwrite |
|---|---|---|---|---|---|
| HO-P04-P05-001 | PDM-05 | 车型主数据 / JYT model mapping；映射缺失不得丢 source facts，车型身份继续由 PDM-05 当前规则处理 | HANDOFF_CLOSED | PDM-05 Final | YES |
| HO-P04-P06-001 | PDM-06 | 人工车辆草稿 / 发布 / VIN / 删除 / 名邦↔4S source_type；批发只能由集成产生 | HANDOFF_CLOSED | PDM-06 Final | YES |
| HO-P04-P07-001 | PDM-07 | 车辆档案 / 车况 / 报告；不得反向改写 vehicle/source/listing lifecycle | HANDOFF_CLOSED | PDM-07 Final | YES |
| HO-P04-P08-001 | PDM-08 | 图片 URL/CDN/资产化/重试；图片子任务失败不得回滚同 vehicle 来源转换 | HANDOFF_CLOSED | PDM-08 §§11-13 | YES |
| HO-P04-P09-001 | PDM-09 | 上游发布人电话；电话定位不得恢复使用 car_code，按 PDM-09 当前 publisher identity 规则 | HANDOFF_CLOSED | PDM-09 Final | YES |
| HO-P04-P10-001 | PDM-10 | 一键转名邦价格快照、转换后客户价/内部价/覆盖价/查价权语义 | HANDOFF_CLOSED | PDM-10 §13 | YES |
| HO-P04-P12-001 | PDM-12 | Matching 对 hidden / availability / source 状态的资格判断；不得把 hidden 等同 offline | HANDOFF_OPEN | - | YES |
| HO-P04-P13-001 | PDM-13 | Priority 对 hidden、exclusive visibility、listing lifecycle 的约束 | HANDOFF_OPEN | - | YES |
| HO-P04-P14-001 | PDM-14 | Recommendation 对 hidden 单车可见授权与 listing_cycle 生命周期 | HANDOFF_OPEN | - | YES |
| HO-P04-P18-001 | PDM-18 | Lock / Waitlist 完整 lifecycle；vehicle source/visibility 变化不得静默抹除既有历史 | HANDOFF_OPEN | - | YES |
| HO-P04-P19-001 | PDM-19 | Transaction / Refund / correction；completed 终态、source conversion 与历史快照边界 | HANDOFF_OPEN | - | YES |
| HO-P04-P20-001 | PDM-20 | 客户端车辆列表/详情的 source、hidden/locked/offline/relist 等状态投影；并承接 listing_started_at / 人工上传时间 / JYT 平台收录时间的客户端展示，不得把 first_seen_at 伪称上游上传时间 | HANDOFF_OPEN | - | YES |
| HO-P04-P21-001 | PDM-21 | 员工端车辆详情、source_type、一键转名邦、隐藏/上下架等真实操作入口 | HANDOFF_OPEN | - | YES |
| HO-P04-P22-001 | PDM-22 | PC 车辆、隐藏规则、集成配置与运行管理界面；不得改变 PDM-04 车辆 Authority | HANDOFF_OPEN | - | YES |
| HO-P04-P22-002 | PDM-22 | 三个固定车源同步业务 API 的启停、名邦同步 API credential、调用统计与运行状态管理；credential 不得与 JYT 登录凭证或 Collector 电话鉴权混用 | HANDOFF_OPEN | - | YES |
| HO-P04-P23-001 | PDM-23 | JYT / Supply Anomaly 相关 Incident、飞书、SLA、夜间免打扰、通知与异常日志；不得把通知层重新定义成车辆业务状态 | HANDOFF_OPEN | - | YES |
| HO-P04-P25-001 | PDM-25 | vehicle/source/listing/visibility/conversion 的统一审计、历史和终态不回写规则 | HANDOFF_OPEN | - | YES |

### 6.1 PDM-04 Integrity Audit 候选转正式 handoff 记录

| candidate_id | 正式 handoff | 结果 |
|---|---|---|
| HC-P04-P20-001 | HO-P04-P20-001 | PROMOTED / HANDOFF_OPEN |
| HC-P04-P22-001 | HO-P04-P22-002 | PROMOTED / HANDOFF_OPEN |
| HC-P04-P23-001 | HO-P04-P23-001 | PROMOTED / HANDOFF_OPEN |

以上候选已随 PDM-04 `INTEGRITY_PASS` 正式进入 Cross-PDM Handoff Register。

---

## 7. PDM-05 来源 handoff

| handoff_id | 目标 | 完整移交语义 | 状态 | 目标 Authority | source_backwrite |
|---|---|---|---|---|---|
| HO-P05-P02-001 | PDM-02 | “后台 Admin”统一解释为 System Admin 控制平面；车型主数据治理是控制平面动作，不等于普通 Vehicle 业务执行权 | HANDOFF_CLOSED | PDM-02 §6 + PDM-05 §9 | YES |
| HO-P05-P06-001 | PDM-06 | 人工选择有效 vehicle_model_id 后自动带出车型固定属性；MODEL_MISSING 返回原 draft；5A 进一步关闭主档纠错后当前投影/历史快照边界 | HANDOFF_CLOSED | PDM-06 §8/§8A + PDM-05 §12.4 | YES |
| HO-P05-P12-001 | PDM-12 | Matching 必须使用 JYT 已明确车型事实；不得仅因 vehicle_model_id=NULL / mapping pending 就自动降为 unknown | HANDOFF_OPEN | - | YES |
| HO-P05-P20-001 | PDM-20 | 客户端车型搜索/筛选/年款分组；年款不是第四级主数据，车型年款与首次上牌年份分离 | HANDOFF_OPEN | - | YES |
| HO-P05-P21-001 | PDM-21 | 员工端车型选择、MODEL_MISSING、固定属性自动带出、待确认/冲突状态的真实投影 | HANDOFF_OPEN | - | YES |
| HO-P05-P22-001 | PDM-22 | System Admin 的车型主数据、JYT mapping、MODEL_MISSING、conflict、merge 等 PC 治理页面 | HANDOFF_OPEN | - | YES |
| HO-P05-P25-001 | PDM-25 | mapping before/after、车型节点修正、合并迁移、主档纠错及历史不可追改的统一审计/历史标准 | HANDOFF_OPEN | - | YES |

---

## 8. PDM-06 来源 handoff

| handoff_id | 目标 | 完整移交语义 | 状态 | 目标 Authority | source_backwrite |
|---|---|---|---|---|---|
| HO-P06-P07-001 | PDM-07 | Vehicle Document / 档案 / 车况 / 客户可见报告 / 交易交付材料核验；档案不是人工发布硬门槛，必要资料只在 Transaction 完成/交付时按有效 required-field set 核验 | HANDOFF_CLOSED | PDM-07 §§3-10,20 | YES |
| HO-P06-P08-001 | PDM-08 | 人工名邦/4S 允许 0 图发布；正式发布后可补图/删图/调序，删到 0 图仍可继续在售；普通车辆相册与档案/报告资源隔离 | HANDOFF_CLOSED | PDM-08 §§8,18 | YES |
| HO-P06-P10-001 | PDM-10 | customer_list_price/internal_wholesale_price 非发布硬门槛；正常价格修改通过保存修改；取消独立调价 permission/action；内部价字段仍受独立查看 permission | HANDOFF_CLOSED | PDM-10 §§1,5,21 | YES |
| HO-P06-P21-001 | PDM-21 | 员工端新增车源/草稿车源/VIN 重复提示/MODEL_MISSING/保存修改/source_type 选择与草稿阶段修改等真实页面、状态、动作投影 | HANDOFF_OPEN | - | YES |
| HO-P06-P22-001 | PDM-22 | PC/后台人工 Vehicle 管理承载；通用 CRUD 不得自动生成正式 Vehicle 物理 Delete，草稿与正式 Vehicle 必须分层 | HANDOFF_OPEN | - | YES |
| HO-P06-P25-001 | PDM-25 | 正式发布、source_type 修改、保存修改、VIN duplicate Gate、draft delete 等统一审计与历史留存标准 | HANDOFF_OPEN | - | YES |

---

## 9. PDM-07 来源 handoff

| handoff_id | 目标 | 完整移交语义 | 状态 | 目标 Authority | source_backwrite |
|---|---|---|---|---|---|
| HO-P07-P08-001 | PDM-08 | 报告/档案资源承载：人工上传报告/档案图片入自有对象存储；出险/维保报告不进普通相册；4S维保H5 对外使用名邦可控报告域名；技术承载不决定 customer_visible | HANDOFF_CLOSED | PDM-08 §§8,16-18,28 | YES |
| HO-P07-P12-001 | PDM-12 | Matching 使用 JYT 原始车况描述/标签与必要确定性标准化事实；保留 provenance；unknown/confirmation_needed 不得猜测 | HANDOFF_OPEN | - | YES |
| HO-P07-P13-001 | PDM-13 | Priority 使用车况条件时不得篡改 JYT/manual/Mingbang 检测 provenance，也不得把 unknown 猜成符合 | HANDOFF_OPEN | - | YES |
| HO-P07-P14-001 | PDM-14 | 档案不完整本身不得阻止 Recommendation；客户可见报告与 Recommendation 权利分层 | HANDOFF_OPEN | - | YES |
| HO-P07-P15-001 | PDM-15 | 档案不完整本身不得阻止 Consultation | HANDOFF_OPEN | - | YES |
| HO-P07-P18-001 | PDM-18 | 档案不完整本身不得阻止 Lock/Waitlist；档案/报告历史不因 Lock 状态变化被删除或重写 | HANDOFF_OPEN | - | YES |
| HO-P07-P19-001 | PDM-19 | 档案不完整不阻止创建 Transaction；首次真正完成/交付前读取当时有效 required-field set，缺失只阻止完成 | HANDOFF_OPEN | - | YES |
| HO-P07-P20-001 | PDM-20 | 客户只看明确 customer_visible 报告/结果；VIN/敏感原件不下发；无可见资料整块隐藏；车况/检测按真实 provenance 展示 | HANDOFF_OPEN | - | YES |
| HO-P07-P21-001 | PDM-21 | 员工端 archive 上传/后补/替换/作废/历史/核验/customer_visible；4S 仅操作自己有权 Vehicle | HANDOFF_OPEN | - | YES |
| HO-P07-P22-001 | PDM-22 | Transaction/交付 required-field set PC 配置；要求明确员工业务配置能力，System Admin 身份本身不自动获得 | HANDOFF_OPEN | - | YES |
| HO-P07-P25-001 | PDM-25 | archive create/update/replace/void/verify、visibility before/after、required-field config、版本关系与操作者/时间统一审计 | HANDOFF_OPEN | - | YES |

---

## 10. PDM-08 来源 handoff

| handoff_id | 目标 | 完整移交语义 | 状态 | 目标 Authority | source_backwrite |
|---|---|---|---|---|---|
| HO-P08-P20-001 | PDM-20 | 列表/详情 4:3、统一左右滑动图片序列、全屏交互、车辆分享图/分享卡片；分享卡片不得固化客户展示价或任何动态/受权限价格，旧分享再次打开实时重验 | HANDOFF_OPEN | - | YES |
| HO-P08-P21-001 | PDM-21 | 员工端人工图片上传/删除/排序、资产化状态、失败图片重试/人工恢复；必须区分普通 CDN 加载失败、批发→名邦资产化失败、人工图片恢复，禁止用单一 IMAGE_RETRYING 混生命周期 | HANDOFF_OPEN | - | YES |
| HO-P08-P22-001 | PDM-22 | 名邦公开图片域名、JYT Origin、report 域名、对象存储源站与首页/品牌分享配置入口；业务只冻结可配置与安全边界，不写死厂商/TTL/并发等工程参数 | HANDOFF_OPEN | - | YES |
| HO-P08-P25-001 | PDM-25 | 公开域名、Origin、report proxy target 等线上资源安全配置变更，以及资产化/recovery 关键状态变化的统一审计与历史 | HANDOFF_OPEN | - | YES |

---

## 11. PDM-09 来源 handoff

| handoff_id | 目标 | 完整移交语义 | 状态 | 目标 Authority | source_backwrite |
|---|---|---|---|---|---|
| HO-P09-P21-001 | PDM-21 | 员工端上游电话区域、cache available/unavailable、latest、latest failed + cached、拨打、不提供复制，以及 3A：仅当前 wholesale/JYT source_type 显示电话入口，转名邦/4S 后关闭日常入口 | HANDOFF_OPEN | - | YES |
| HO-P09-P22-001 | PDM-22 | P03-05 publisher cache/诊断按 source_platform + upstream_publisher_id 唯一定位；Integration API 状态/credential/回传日志与电话明文权限隔离，integration/Collector manage 不自动授明文电话能力 | HANDOFF_OPEN | - | YES |
| HO-P09-P23-001 | PDM-23 | Collector/电话链路 incident、异常与恢复通知、运行事件；通知层不得重新定义 publisher 当前电话/缓存状态，也不得把无有效号码误标成业务成功 | HANDOFF_OPEN | - | YES |
| HO-P09-P25-001 | PDM-25 | 电话查看、拨打、latest、latest 成功/失败/无有效号码、缓存 before/after、source_platform + publisher、必要 Vehicle/Customer/Demand context 的统一审计 | HANDOFF_OPEN | - | YES |

---

## 12. PDM-10 来源 handoff

| handoff_id | 目标 | 完整移交语义 | 状态 | 目标 Authority | source_backwrite |
|---|---|---|---|---|---|
| HO-P10-P14-001 | PDM-14 | Recommendation 免费授当前 `customer + vehicle + listing_cycle` 批发查价权；Recommendation 结束、owner/负责人变化、原销售离职均不追回本周期已授权利 | HANDOFF_OPEN | - | YES |
| HO-P10-P18-001 | PDM-18 | Lock 创建时冻结必要价格快照；后续上游调价、阶梯、覆盖价、人工价格或 source_type 变化不得回写既有 Lock 快照 | HANDOFF_OPEN | - | YES |
| HO-P10-P20-001 | PDM-20 | 客户端批发车价格投影：LIMITED 列表隐藏精确数字价；客户真实主动进入详情时自动解锁且无需二次点击；quota 耗尽主价格字段 `--万`，并提示升级粉丝/VIP或其他 UNLIMITED 等级、亦可联系顾问免费增加今日次数；UNLIMITED 列表/详情直接显示数字价；车辆本身无数字价才显示“价格咨询”；筛选排序可用真实价但 payload 不泄露；Customer 停用暂停价格权益 | HANDOFF_OPEN | - | YES |
| HO-P10-P21-001 | PDM-21 | 员工端正常价格字段保存修改、internal-price permission、override、临时追加、UNLIMITED 禁止追加、4S 正常价格编辑与 hard DENY 的真实交互投影 | HANDOFF_OPEN | - | YES |
| HO-P10-P22-001 | PDM-22 | 阶梯加价、markup ON/OFF、Customer Level 权益配置、批发价格 LIMITED/UNLIMITED、daily base quota、与 PDM-11 找车 entitlement 的同等级配置承载、相关 permission 与后台业务配置 | HANDOFF_OPEN | - | YES |
| HO-P10-P25-001 | PDM-25 | price/override/temp quota/risk/conversion snapshot/level entitlement config 等统一审计与历史 | HANDOFF_OPEN | - | YES |

---

## 12A. PDM-11 来源 handoff

| handoff_id | 目标 | 完整移交语义 | 状态 | 目标 Authority | source_backwrite |
|---|---|---|---|---|---|
| HO-P11-P12-001 | PDM-12 | 只有经员工人工激活后的 active Demand 才进入正式 Matching 域；Application 不等于 Matching；客户原始表达、销售匹配描述、标准条件、需求说明分层；readiness / 确定性解析 / 匹配算法由 PDM-12 冻结 | HANDOFF_OPEN | - | YES |
| HO-P11-P13-001 | PDM-13 | Priority 不得由 pending Application 或无资格 Customer 直接产生；只在合法 active Demand / Matching 关系下进入 Priority 语义，Priority 本身不是 Demand 状态 | HANDOFF_OPEN | - | YES |
| HO-P11-P14-001 | PDM-14 | Recommendation 可关联 source_demand_id；Demand paused/completed/cancelled 不删除历史 Recommendation；Recommendation 生命周期不得反写 Demand 为 active | HANDOFF_OPEN | - | YES |
| HO-P11-P16-001 | PDM-16 | CRM Customer 详情需承载当前客户等级、找车 entitlement 结果、pending/active/paused Demand 概览；客户定位至少继承 PDM-01 手机号搜索；具备 customer.level.manage 的名邦员工可在合法 data scope 内调整等级，具体 CRM 入口由 PDM-16 承载 | HANDOFF_OPEN | - | YES |
| HO-P11-P17-001 | PDM-17 | Customer owner / 公海变化不得自动漂移 Demand 负责人；存在 active/paused Demand 时按正式责任交接规则处理，不把 Demand 直接丢入公海 | HANDOFF_OPEN | - | YES |
| HO-P11-P20-001 | PDM-20 | 客户端找车：普通客户可提交 Application 但无正式找车权益时保持 pending；提交成功后明确提示当前等级受限、升级至具备权益等级（当前可举例粉丝/VIP）后可开通、可联系顾问；有权益也不自动 active；Demand paused/resume/历史按 PDM-11 投影 | HANDOFF_OPEN | - | YES |
| HO-P11-P21-001 | PDM-21 | 员工端工作台展示 pending Find-car Application；卡片进入处理详情；无一键绕过 Guard 的自动激活；有权限员工在详情中人工开通 Demand；等级不足时先完成合法等级调整再激活；客户等级调整动作服从 permission + data scope + object state | HANDOFF_OPEN | - | YES |
| HO-P11-P22-001 | PDM-22 | PC 后台统一承载 Customer Level 权益配置：找车 entitlement 与 PDM-10 LIMITED/UNLIMITED/daily quota 等均为等级权益；V1 不提供单 Customer find-car entitlement override；等级调整使用独立受控 customer.level.manage 类 capability，不建设固定多级审批流 | HANDOFF_OPEN | - | YES |
| HO-P11-P25-001 | PDM-25 | 统一审计 Application 创建/编辑/撤回/关闭、Demand 激活/暂停/恢复/完成/取消/负责人变化、Customer 账号停用触发暂停、找车 entitlement 变化、Customer Level before/after/actor/time 及必要 permission/scope context | HANDOFF_OPEN | - | YES |

---

## 13. Post-PDM25 IA / Low-Fi Carrier Ledger｜PDM-01～10

> 当前只登记，不施工；统一在 PDM-25 完成 + PDM-01～25 全局最终总复核 PASS 后集中对齐。

| 来源 | stale carrier | 状态 |
|---|---|---|
| PDM-01 | 首次进入不形成 owner 的旧承载 | CARRIER_DEFERRED |
| PDM-01 | 客户分享永久 SOURCE_ONLY | CARRIER_DEFERRED |
| PDM-01 | Customer Merge / merge flow | CARRIER_DEFERRED |
| PDM-01 | 头像/昵称仍可能被标成 required | CARRIER_DEFERRED |
| PDM-02 | P05 System Admin 缺真实“新增 System Admin”动作入口 | CARRIER_DEFERRED |
| PDM-02 | 4S internal vehicle-management 被旧 not-4S Guard 整体挡住 | CARRIER_DEFERRED |
| PDM-02 | 旧 vehicle.convert_mingbang 独立 permission | CARRIER_DEFERRED |
| PDM-02 | 旧独立调价 permission / action | CARRIER_DEFERRED |
| PDM-02 | P04 / handoff 页面仍是通用壳 | CARRIER_DEFERRED |
| PDM-02 | permission 文案与 PDM-10 当前价格模型不一致 | CARRIER_DEFERRED |
| PDM-03 | 首次进入无 owner 的旧首入投影 | CARRIER_DEFERRED |
| PDM-03 | 客户侧分享固定 SOURCE_ONLY | CARRIER_DEFERRED |
| PDM-03 | 推荐朋友 / 直接转介绍真人入口不足 | CARRIER_DEFERRED |
| PDM-03 | handover 页面未完整表现对象映射、失败/重试 | CARRIER_DEFERRED |
| PDM-04 | 旧“双 vehicle + conversion relation”一键转名邦承载 | CARRIER_DEFERRED |
| PDM-04 | 旧“只有 biz_status=normal 才可 convert”的 Guard | CARRIER_DEFERRED |
| PDM-04 | 旧 conversion relation / 原批发新名邦两车身份 | CARRIER_DEFERRED |
| PDM-04 | 旧价格 / 调价 carrier | CARRIER_DEFERRED |
| PDM-04 | 4S 车辆管理入口旧限制 | CARRIER_DEFERRED |
| PDM-04 | P02/P03 车源、集成、供应异常等页面通用壳 / 状态承载不足 | CARRIER_DEFERRED |
| PDM-05 | 完整车型名称完全一致→自动 mapping 的旧主规则 | CARRIER_DEFERRED |
| PDM-05 | `no model creation is inferred` 与 System Admin 可补品牌/车系/具体车型冲突 | CARRIER_DEFERRED |
| PDM-05 | 年款在页面上易被误做第四级主数据 | CARRIER_DEFERRED |
| PDM-05 | mapping pending/conflict 时把 JYT 已明确车型事实错误降为 unknown | CARRIER_DEFERRED |
| PDM-06 | `DRAFT_RESUME` 与“继续上次 / 放弃重新发布”旧单草稿流程 | CARRIER_DEFERRED |
| PDM-06 | MODEL_MISSING 完成后错误返回 DRAFT_RESUME | CARRIER_DEFERRED |
| PDM-06 | `no model creation is inferred` 旧 Guard 与 PDM-05 当前 System Admin 治理冲突 | CARRIER_DEFERRED |
| PDM-06 | 缺真正“更多 → 草稿车源”多草稿列表承载 | CARRIER_DEFERRED |
| PDM-06 | 缺 VIN 完全一致重复 Gate、“查看已有车辆 / 返回修改” | CARRIER_DEFERRED |
| PDM-06 | 已发布车辆缺真实“保存修改”动作投影 | CARRIER_DEFERRED |
| PDM-06 | source_type 新建/草稿阶段修改细节承载不完整 | CARRIER_DEFERRED |
| PDM-07 | 缺档案上传/后补/更新/替换完整操作链 | CARRIER_DEFERRED |
| PDM-07 | 缺档案作废/新版本替代/档案历史真实动作 | CARRIER_DEFERRED |
| PDM-07 | 缺单份档案 customer_visible 设置/取消动作 | CARRIER_DEFERRED |
| PDM-07 | 客户端缺无客户可见档案/报告时整块隐藏完整投影 | CARRIER_DEFERRED |
| PDM-07 | JYT/manual/Mingbang真实检测 provenance 区分承载不完整 | CARRIER_DEFERRED |
| PDM-07 | 4S 本人有权 Vehicle 的内部档案访问路径受旧 Internal Mode DENY 污染风险 | CARRIER_DEFERRED |
| PDM-07 | Vehicle Archive 专属 audit carrier 不完整 | CARRIER_DEFERRED |
| PDM-08 | 泛化 IMAGE_PARTIAL_FAILED / IMAGE_FAILED / IMAGE_RETRYING / IMAGE_MANUAL_RECOVERY / IMAGE_RECOVERED 混用不同图片生命周期 | CARRIER_DEFERRED |
| PDM-08 | 旧页面/状态仍可能隐含普通批发浏览逐张永久吞图旧链路 | CARRIER_DEFERRED |
| PDM-08 | 分享卡片缺客户展示价/动态价格禁止固化完整投影 | CARRIER_DEFERRED |
| PDM-08 | 4S维保H5/报告旧 URL 当前权限重验承载不完整 | CARRIER_DEFERRED |
| PDM-08 | 统一图片浏览序列可能被误实现为自动轮播 | CARRIER_DEFERRED |
| PDM-08 | 3A 资产化未闭环临时受控回源缺 Current/Low-Fi 状态投影 | CARRIER_DEFERRED |
| PDM-09 | 保存/测试 Collector 电话连接、Collector Base URL / relative Phone Path / allowlisted host 旧方向 | CARRIER_DEFERRED |
| PDM-09 | 部分 carrier 仍使用泛化 publisher_id，未统一 upstream_publisher_id | CARRIER_DEFERRED |
| PDM-09 | P03-05/旧 CR-007 存在把 integration.collector.manage 等集成管理能力误解成电话明文权限的风险 | CARRIER_DEFERRED |
| PDM-09 | PHONE_UNAVAILABLE 未完整区分“本次无有效新号码但旧缓存仍存在”与“完全无缓存” | CARRIER_DEFERRED |
| PDM-09 | 3A 批发→名邦/4S 后电话入口关闭缺 Current/Low-Fi source_type 投影 | CARRIER_DEFERRED |
| PDM-10 | 4S member internal mode 整体 DENY 仍可能阻断本人有权 4S 车辆价格管理 | CARRIER_DEFERRED |
| PDM-10 | internal-price permission 的角色投影与当前独立可配置 permission 模型不完全一致 | CARRIER_DEFERRED |
| PDM-10 | 独立调价 permission/action 旧 carrier 残留 | CARRIER_DEFERRED |
| PDM-10 | 员工端 customer display override 真实入口不完整 | CARRIER_DEFERRED |
| PDM-10 | P08 价格后台仍偏通用 CRUD，LIMITED/UNLIMITED、markup、quota 等真实配置投影不完整 | CARRIER_DEFERRED |
| PDM-10 | 临时增加当天查价次数员工入口不完整 | CARRIER_DEFERRED |
| PDM-10 | DAILY_PRICE_QUOTA_EXHAUSTED→联系顾问缺完整 Current/Low-Fi 投影 | CARRIER_DEFERRED |
| PDM-10 | Customer 停用后的价格权益暂停缺独立价格状态投影 | CARRIER_DEFERRED |
| PDM-10 | 3A UNLIMITED/temp additions 切换规则缺 Current/Low-Fi 状态投影 | CARRIER_DEFERRED |

---

## 14. 强制使用规则

1. 新 PDM 开始：先筛 `target=当前 PDM AND status in {HANDOFF_OPEN,HANDOFF_ACCEPTED}`。
2. 目标 PDM 接收：更新为 `HANDOFF_ACCEPTED`。
3. 目标 Final 完成：更新为 `HANDOFF_CLOSED` 或 `HANDOFF_SUPERSEDED`。
4. 同一次关闭动作必须反向回写来源 PDM；否则标 `STALE_HANDOFF / SOURCE_BACKWRITE_PENDING`。
5. 目标 PDM COMPLETE / INTEGRITY_PASS 前不得留下未处理 incoming handoff。
6. 来源 PDM 可以保留指向未来域的合法 `HANDOFF_OPEN`，但必须在本总账完整登记。
7. PDM-25 后全局 IA / Low-Fi 对齐前，再以本表 + stale carrier ledger 做一次完整扫尾。

---

## 15. 当前下一步

- PDM-01：INTEGRITY_PASS；
- PDM-02：INTEGRITY_PASS；
- PDM-03：INTEGRITY_PASS；
- PDM-04：INTEGRITY_PASS；
- PDM-05：INTEGRITY_PASS；
- PDM-06：INTEGRITY_PASS；
- PDM-07：INTEGRITY_PASS；
- PDM-08：INTEGRITY_PASS；
- PDM-09：INTEGRITY_PASS；
- PDM-10：INTEGRITY_PASS；
- PDM-01～10 全局 Cross-PDM / Handoff / Global Invariant 总复核：PASS；
- 当前进入：PDM-11；
- PDM-11 启动门禁：UNBLOCKED；
- `HO-P01-P11-001` 已因 2026-10-05 用户后续裁决标记 `HANDOFF_SUPERSEDED`；PDM-11 当前承接 `HO-P01-P11-002 = HANDOFF_ACCEPTED`。待 PDM-11 Final 真正落地并完成来源反向回写后再关闭。
