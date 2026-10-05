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
| HO-P01-P11-002 | PDM-11 | Customer 停用后正在运行的 Demand 必须停止继续运行：active → paused；历史、条件、推荐/匹配/跟进等事实保留；账号恢复不自动恢复 Demand，需正式 resume | HANDOFF_CLOSED | PDM-11 Final §14；PDM-01 Final §11/§18 source backwrite completed | YES |
| HO-P01-P14-001 | PDM-14 | Recommendation 生命周期与当前 listing_cycle 权利；Customer 身份连续性不得被 Recommendation 重建 | HANDOFF_ACCEPTED | PDM-14 工作版 Batch 1 | YES |
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
| HO-P03-P13-001 | PDM-13 | Priority TTL、可见隔离、交接后的具体 lifecycle；Priority 必须进入离职/资格失效交接扫描 | HANDOFF_CLOSED | PDM-13 Final §§15-17,24-26 | YES |
| HO-P03-P14-001 | PDM-14 | Recommendation lifecycle、正式推荐关系、hidden 单车可见授权；不得用普通分享替代 Recommendation 权利 | HANDOFF_ACCEPTED | PDM-14 工作版 Batch 1 | YES |
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
| HO-P04-P12-001 | PDM-12 | Matching 对 hidden / availability / source 状态的资格判断；不得把 hidden 等同 offline | HANDOFF_CLOSED | PDM-12 Final §§17-18,29 | YES |
| HO-P04-P13-001 | PDM-13 | Priority 对 hidden、exclusive visibility、listing lifecycle 的约束 | HANDOFF_CLOSED | PDM-13 Final §§5,15-19,29 | YES |
| HO-P04-P14-001 | PDM-14 | Recommendation 对 hidden 单车可见授权与 listing_cycle 生命周期 | HANDOFF_ACCEPTED | PDM-14 工作版 Batch 1 | YES |
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
| HO-P05-P12-001 | PDM-12 | Matching 必须使用 JYT 已明确车型事实；不得仅因 vehicle_model_id=NULL / mapping pending 就自动降为 unknown | HANDOFF_CLOSED | PDM-12 Final §14 | YES |
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
| HO-P07-P12-001 | PDM-12 | Matching 使用 JYT 原始车况描述/标签与必要确定性标准化事实；保留 provenance；unknown/confirmation_needed 不得猜测 | HANDOFF_CLOSED | PDM-12 Final §§15-16 | YES |
| HO-P07-P13-001 | PDM-13 | Priority 使用车况条件时不得篡改 JYT/manual/Mingbang 检测 provenance，也不得把 unknown 猜成符合 | HANDOFF_CLOSED | PDM-13 Final §§4-6,14 | YES |
| HO-P07-P14-001 | PDM-14 | 档案不完整本身不得阻止 Recommendation；客户可见报告与 Recommendation 权利分层 | HANDOFF_ACCEPTED | PDM-14 工作版 Batch 1 | YES |
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
| HO-P10-P14-001 | PDM-14 | Recommendation 免费授当前 `customer + vehicle + listing_cycle` 批发查价权；Recommendation 结束、owner/负责人变化、原销售离职均不追回本周期已授权利 | HANDOFF_ACCEPTED | PDM-14 工作版 Batch 1 | YES |
| HO-P10-P18-001 | PDM-18 | Lock 创建时冻结必要价格快照；后续上游调价、阶梯、覆盖价、人工价格或 source_type 变化不得回写既有 Lock 快照 | HANDOFF_OPEN | - | YES |
| HO-P10-P20-001 | PDM-20 | 客户端批发车价格投影：LIMITED 列表隐藏精确数字价；客户真实主动进入详情时自动解锁且无需二次点击；quota 耗尽主价格字段 `--万`，并提示升级粉丝/VIP或其他 UNLIMITED 等级、亦可联系顾问免费增加今日次数；UNLIMITED 列表/详情直接显示数字价；车辆本身无数字价才显示“价格咨询”；筛选排序可用真实价但 payload 不泄露；Customer 停用暂停价格权益 | HANDOFF_OPEN | - | YES |
| HO-P10-P21-001 | PDM-21 | 员工端正常价格字段保存修改、internal-price permission、override、临时追加、UNLIMITED 禁止追加、4S 正常价格编辑与 hard DENY 的真实交互投影 | HANDOFF_OPEN | - | YES |
| HO-P10-P22-001 | PDM-22 | 阶梯加价、markup ON/OFF、Customer Level 权益配置、批发价格 LIMITED/UNLIMITED、daily base quota、与 PDM-11 找车 entitlement 的同等级配置承载、相关 permission 与后台业务配置 | HANDOFF_OPEN | - | YES |
| HO-P10-P25-001 | PDM-25 | price/override/temp quota/risk/conversion snapshot/level entitlement config 等统一审计与历史 | HANDOFF_OPEN | - | YES |

---

## 12A. PDM-11 来源 handoff

| handoff_id | 目标 | 完整移交语义 | 状态 | 目标 Authority | source_backwrite |
|---|---|---|---|---|---|
| HO-P11-P12-001 | PDM-12 | 只有员工人工激活后的 active Demand 才进入正式 Matching；Application 不等于 Matching；客户原始要求/销售匹配描述/标准条件/需求说明严格分层；active 不等于 matching-ready；readiness、确定性解析、条件变更重算、候选等级由 PDM-12 冻结；Demand.created_at 为不可变创建事实 | HANDOFF_CLOSED | PDM-12 Final §§2-4,29 | YES |
| HO-P11-P13-001 | PDM-13 | pending Application 不产生 Priority；Priority 只建立在合法 active Demand/Matching 上；Demand paused/completed/cancelled 后 Priority 处理由 PDM-13 冻结；若仲裁按 Demand 创建先后，只能使用不可变 Demand.created_at，不得使用 updated_at/resume time | HANDOFF_CLOSED | PDM-13 Final §§2-3,6,8-9,14 | YES |
| HO-P11-P14-001 | PDM-14 | Recommendation 可关联 source_demand_id；Demand paused/completed/cancelled 不删除历史 Recommendation；Recommendation 生命周期不得反写 Demand 为 active；多 Demand 场景必须保持真实 source_demand_id 归属 | HANDOFF_ACCEPTED | PDM-14 工作版 Batch 1 | YES |
| HO-P11-P16-001 | PDM-16 | CRM Customer 详情承载当前等级、找车 entitlement、pending Application、active/paused Demand 与 completed/cancelled 历史概览；Demand 详情使用统一 CRM follow-up 并以 demand_id 关联，不新建第二套 Demand 跟进表；客户检索继承手机号搜索；customer.level.manage 服从 permission+data scope+object state | HANDOFF_OPEN | - | YES |
| HO-P11-P17-001 | PDM-17 | pending Find-car Application 本身是公海保护事实；active/paused Demand 同样属于未完成业务。Customer 无 owner 提交找车时必须先完成合法 owner 分配，再创建有负责人的 Application；pool empty 不得创建 responsible=null Application；owner/公海变化不得静默漂移 Demand 负责人；pending Application/待处理任务与未完成 Demand 均纳入正式交接 | HANDOFF_OPEN | - | YES |
| HO-P11-P20-001 | PDM-20 | C02 为多对象找车工作区：pending Application、active/paused Demand、Recommendation、completed/cancelled history 可并存；Application 最低必填“想找什么车”，pending 可编辑/撤回；无 entitlement 提交成功仍 pending，提示升级到当前真实具备权益的等级/联系顾问，不得永久写死粉丝/VIP；active 可暂停、paused 可恢复；客户结束找车生成待员工确认请求并显示“结束处理中”，不得造第五主状态；账号停用时 pending Application 保留但不得激活 | HANDOFF_OPEN | - | YES |
| HO-P11-P21-001 | PDM-21 | E01“找车服务待处理”展示客户/想找什么车/预算/提交时间/当前负责人/pending，卡片只进入处理详情；E05 Application 详情人工激活唯一 Demand/关闭申请；等级不足先合法调整但不自动激活；E05 Demand 详情完整承载客户原始要求、销售匹配描述、标准条件、需求说明、CRM 跟进、候选/推荐上下文；active=pause/complete/cancel，paused=resume/complete/cancel，终态只读；员工处理客户结束请求时落 completed 或 cancelled，也可直接结束；reassignment/inactive/离职保留负责人历史 | HANDOFF_OPEN | - | YES |
| HO-P11-P22-001 | PDM-22 | PC 后台统一承载 Customer Level 权益配置：找车 entitlement 与 PDM-10 LIMITED/UNLIMITED/daily quota 为同一等级体系中的独立权益；V1 不提供单 Customer find-car override；等级可新增/改名/排序/启停/保留历史；customer.level.manage 独立受控且不建设固定多级审批；PC 客户/找车管理至少可查看 Application/Demand 当前状态、负责人及必要治理入口，不能只做等级配置壳 | HANDOFF_OPEN | - | YES |
| HO-P11-P25-001 | PDM-25 | 统一审计 Application 创建/编辑/撤回/关闭/激活转换；Demand.created_at、激活、pause/resume、complete/cancel、客户结束请求及员工确认结果、负责人 reassignment；Customer disable/entitlement loss 触发 active→paused；Customer Level before/after/actor/time 及必要 identity/permission/data scope/object state context；历史不得因终态、停用或等级变化物理删除 | HANDOFF_OPEN | - | YES |

---

## 12B. PDM-12 来源 handoff

| handoff_id | 目标 | 完整移交语义 | 状态 | 目标 Authority | source_backwrite |
|---|---|---|---|---|---|
| HO-P12-P13-001 | PDM-13 | PDM-13 只消费 PDM-12 当前合法 Match Result，不复制第二套 Matching Authority；Priority 候选必须基于当前 high/acceptable，confirmation_needed/no_match 不得作为成功匹配；active Lock 不阻止 PDM-12 继续形成 Match Result，但是否允许建立/继续 Priority、Priority 如何被 Lock 接管/结束由 PDM-13 冻结；Priority TTL/仲裁/lifecycle 与 Demand.created_at 仲裁语义同样归 PDM-13。 | HANDOFF_CLOSED | PDM-13 Final §§4-14,21-23,29-30 | YES |
| HO-P12-P14-001 | PDM-14 | Match Result 与 Recommendation/visibility grant 分离；high/acceptable 不自动创建 Recommendation，不自动授予客户详情可见权；Recommendation 后续 Guard/生命周期由 PDM-14 冻结。 | HANDOFF_ACCEPTED | PDM-14 工作版 Batch 1 | YES |
| HO-P12-P16-001 | PDM-16 | Rule Dictionary 新增/修改/启停及其他 Matching 关键事实变化后，PDM-12 只对受影响当前在售车辆与 active+matching-ready Demand 做确定性重解析/重算，并向后续消费者提供可追溯的 Matching change fact；PDM-16 的 Source Radar 负责消费这些变化事实形成 Radar Event / 聚合 / 工作台投影，不得在 PDM-16 复制第二套 Matching 规则或反向覆盖 PDM-12 Match Result Authority。 | HANDOFF_OPEN | - | YES |
| HO-P12-P18-001 | PDM-18 | active Lock 本身不使底层真实可售 Vehicle 退出 PDM-12 Matching；其他 Demand 可继续产生携带“已锁/占用”事实的 Match Result，但不得据此绕过单车唯一 active Lock。其他客户候补/Lock 动作、Lock 释放后的处理与 active Lock Guard 归 PDM-18；本 handoff 不外推 Transaction。 | HANDOFF_OPEN | - | YES |
| HO-P12-P20-001 | PDM-20 | 客户端车源主页搜索与正式 Demand Matching 共用 PDM-12 Rule Dictionary / deterministic parser；搜索只消费结构化解析结果，不创建 Match Result/Priority/Recommendation/Demand/Lock。搜索解析得到的“车型年款”不得与主筛选“首次上牌年份”混成一字段；六类 V1 auto-Matching 排除字段仍可由 PDM-20 作为搜索/筛选条件承载；Demand 的“未填预算+价格咨询可匹配”不得污染客户端明确数字价格区间筛选，设置数字价格区间时价格咨询车辆仍排除。 | HANDOFF_OPEN | - | YES |
| HO-P12-P21-001 | PDM-21 | 员工端 E05-04/E05-05/E05-06 必须承载“保存销售匹配描述→确定性解析→标准条件→受影响范围重算”、四级 Match Result、解释原因、confirmation_needed 人工确认及 stale/recalc-failed 边界；人工确认只允许当前 Demand 负责人或当前 identity/permission/data scope/object state 合法的 active 名邦 Employee，4S hard DENY、System Admin 身份不自动获得；确认只能补事实→重算→读取新的正式 tier，不得直接变成功 Match/Priority/Recommendation。 | HANDOFF_OPEN | - | YES |
| HO-P12-P22-001 | PDM-22 | PC P06-10 必须承载真实 Rule Dictionary Action：新增/编辑/启停/作用域/测试解析/历史审计；正式写动作受 matching.rule.manage 控制，4S hard DENY，System Admin 身份不自动取得写能力；PROCESSING/PARTIAL_FAILURE/ERROR 与失败集合重试需真实投影。 | HANDOFF_OPEN | - | YES |
| HO-P12-P25-001 | PDM-25 | 统一审计 Rule Dictionary 创建/修改/启停、before/after、actor/time、规则作用域、Match Result 历史与解释、recalc failure/retry、stale result invalidation、受影响范围重算、confirmation_needed 人工确认 actor/事实来源/前后结果；停用规则与历史 Match Result 不物理删除。 | HANDOFF_OPEN | - | YES |

---

## 12C. PDM-13 来源 handoff

| handoff_id | 目标 | 完整移交语义 | 状态 | 目标 Authority | source_backwrite |
|---|---|---|---|---|---|
| HO-P13-P14-001 | PDM-14 | Priority 本身不授 Customer 车辆详情 visibility；Priority responsible employee 先处理并决定是否 Recommendation，Recommendation/visibility grant 合法成立后 Priority Customer 才可见。正式 Recommendation 建立后 Priority 可保存 recommendation_id 作为关联追溯字段，但两者仍是独立对象；Priority release/expiry 只结束排他保护，不自动结束仍合法 Recommendation；Recommendation cancellation alone 不自动结束 Priority，若员工同时决定放弃保护则另执行 Priority release。active Priority 对其他 Customer 的普通新 Recommendation/普通可见机会形成排他保护；既有 Recommendation/visibility 历史不删除。PDM-14 必须冻结 suppression/restore、Recommendation end、visibility grant 与幂等审计。 | HANDOFF_ACCEPTED | PDM-14 工作版 Batch 1 | YES |
| HO-P13-P17-001 | PDM-17 | Priority Customer 资格本身不是公海保护事实；active Priority 才是。Customer 存在 active Priority 时不得按普通无业务 Customer 直接入公海；Priority ended 后重新读取 pending Application、active/paused Demand、Lock、Transaction 及其他 PDM-17 Authority 认可的保护事实，不因历史 Priority 永久阻断公海。 | HANDOFF_OPEN | - | YES |
| HO-P13-P18-001 | PDM-18 | active Lock 不阻断 PDM-12 Matching，但 Vehicle 已有 active Lock 时不得新建 Priority；正式 Lock 成立结束当前 active Priority，Priority Customer 自己 Lock 可记 converted_to_lock，其他合法 Lock 记录 takeover reason。Lock 取消/到期不恢复旧 Priority，Vehicle 重新开放后按当时 current legal Match Result 重新仲裁；若原 Recommendation 仍合法，其 visibility 继续由 Recommendation/PDM-14 判断。Recommendation cancellation 或 Priority release/expiry 均不得反向撤销已经合法成立的 Lock。Priority 不是 Lock 排队/竞争优先级。 | HANDOFF_OPEN | - | YES |
| HO-P13-P19-001 | PDM-19 | Vehicle 已有 in-progress Transaction 时不得新建 Priority；active Priority 存续期间进入正式 in-progress Transaction 时 Priority ended。Transaction 取消/纠错后 Vehicle 真正重新开放，不恢复旧 Priority，按当时合法 Match Result 重新仲裁；Recommendation cancellation、Priority release 或 Priority expiry 均不得反向撤销已经合法成立的 Transaction；Deposit/Transaction/Refund/Correction 完整状态机由 PDM-19 冻结。 | HANDOFF_OPEN | - | YES |
| HO-P13-P25-001 | PDM-25 | 统一审计 Priority Customer 资格开启/关闭、Priority 创建与仲裁结果、trigger_demand_id、TTL snapshot/expires_at、responsible/handover、ended reason、Lock/Transaction takeover、same-cycle suppression、re-arbitration、stale/invalidated/tier downgrade 导致的 lifecycle 变化、TTL 前员工主动 release/不推荐此车、Recommendation 与 Priority 的关联及组合操作中两个独立 domain action，以及 actor/time/before-after/source facts。 | HANDOFF_OPEN | - | YES |
| HO-P13-P20-001 | PDM-20 | 客户端不得暴露 Priority/优先保护/客户专属/内部仲裁等级等内部术语；active Priority Vehicle 不得通过普通 Feed/搜索/筛选/普通分享/无合法授权旧链接向无关 Customer 穿透；Priority Customer 本人也不能仅因 Priority 自动看详情，需 Recommendation/visibility grant。面向客户的普通“在售车源/今日新增”等统计必须排除当前不属于普通公开可浏览集合的 Priority 保护 Vehicle；Priority ended 后重新读取底层 visibility/Vehicle 状态/合法授权，不能简单强制公开。 | HANDOFF_OPEN | - | YES |
| HO-P13-P21-001 | PDM-21 | 员工端承接 trigger Demand 当前合法 responsible employee 的 Priority 待处理/active 视图及合法管理范围内监督处理；显示 Vehicle/Customer/trigger Demand/Match tier/剩余TTL或expires_at/current responsible/必要history。合法 responsible employee 可在TTL到期前执行“释放 Priority / 不推荐此车”，立即释放保护并触发重新仲裁；尚未正式 Recommendation 时不得将该动作实现成“取消推荐”。已有 Recommendation 时可设计“结束推荐并释放保护”的组合入口，但底层 Recommendation end 与 Priority release 必须分别校验、审计和留历史。敏感提交继续服从PDM-02与对应业务Authority。禁止人工创建Priority、转给其他Customer、override、改expires_at、人工续期、恢复ended Priority；不恢复独立全局 priority.view/priority.manage/priority.override；4S hard DENY。 | HANDOFF_OPEN | - | YES |
| HO-P13-P22-001 | PDM-22 | PC后台承接单Customer Priority资格开关与Priority全局默认TTL两个控制平面配置对象：资格逐Customer开/关、不支持批量、不与Customer Level find-car entitlement混成同一开关、普通负责销售不得因负责Customer自行开启，保存按合法后台identity/permission/data scope/object state重验并审计before/after/actor/time；TTL默认86400s/24h，修改只影响后续新Priority，不追改既有expires_at，不提供逐笔人工续期，配置变更进入统一审计。 | HANDOFF_OPEN | - | YES |

---
## 13. Post-PDM25 IA / Low-Fi Carrier Ledger｜持续累积

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
| PDM-12 | E05-06 仍可能把“确认候选”投影成直接成功 Match / 直接具备 Priority 资格；正确 Authority 是确认事实→重算→读取新 tier | CARRIER_DEFERRED |
| PDM-12 | E05-05 HIDDEN_CONTROLLED 仍可能把 Demand/Priority 本身当作隐藏车客户详情可见权；正确 Authority 仍需 Recommendation/visibility grant | CARRIER_DEFERRED |
| PDM-12 | E05-04 缺完整“保存销售匹配描述→确定性解析→更新标准条件→受影响范围重算”真人 Action | CARRIER_DEFERRED |
| PDM-12 | P06-10 仍偏 NORMAL/PROCESSING/PARTIAL_FAILURE/ERROR 通用状态壳，缺 Rule Dictionary 新增/编辑/启停/作用域/测试/审计/失败集合重试真实 Action Contract | CARRIER_DEFERRED |
| PDM-12 | Current carrier 对“正式 Matching 禁止 AI 猜测”表达不足 | CARRIER_DEFERRED |
| PDM-12 | Current carrier 对“车源主页搜索与 Demand Matching 共用 deterministic parser / Rule Dictionary”表达不足 | CARRIER_DEFERRED |
| PDM-13 | Current Navigation `E05-05｜创建 Priority` 残留人工创建 Priority 旧语义；正确 Authority 为系统基于合法 Match Result + Priority 资格 + 仲裁自动产生 | CARRIER_DEFERRED |
| PDM-13 | E05-05 HIDDEN_CONTROLLED 残留“Demand/Priority 直接授客户详情可见”旧语义；正确 Authority 为 Priority 不授 visibility，需 Recommendation/visibility grant | CARRIER_DEFERRED |
| PDM-13 | 历史独立 `priority.view` 全局穿透查看方向已被 B4-01 supersede；当前 Priority 查看/处理跟随业务责任、合法管理范围及 PDM-02 通用权限模型 | CARRIER_DEFERRED |
| PDM-13 | 客户端普通公共“在售车源/今日新增”统计尚未完整表达 active Priority 保护 Vehicle 必须从普通公开统计排除 | CARRIER_DEFERRED |
| PDM-13 | PC 当前缺单 Customer Priority 资格开关与全局 24h TTL 默认配置真实 Action；员工端缺合法 responsible Priority 处理/释放/剩余TTL 真人 Action Contract | CARRIER_DEFERRED |

| PDM-14 | P06-06 独立 Recommendation 资格开关、RECOMMENDATION_QUALIFIED/NOT_QUALIFIED 与独立资格管理权限残留；当前 Authority 已改为 Customer Level find-car entitlement 决定正式找车/Recommendation 资格 | CARRIER_DEFERRED |
| PDM-14 | 把 Priority responsible 误实现为新的 Recommendation 授权来源；正确 Authority 是 Priority 不改变既有 owner/handover/Demand responsibility 关系 | CARRIER_DEFERRED |
| PDM-14 | 其他 Customer active Priority 期间直接删除/结束既有 Recommendation/visibility；正确 Authority 是历史保留、客户侧访问临时 suppression，Priority ended 后按当前事实 restore | CARRIER_DEFERRED |

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
- PDM-11：COMPLETE / INTEGRITY_PASS；
- 当前进入：PDM-12；
- PDM-12：COMPLETE / INTEGRITY_PASS；4 条 incoming handoff 全部 CLOSED 并完成 source backwrite；
- PDM-13：COMPLETE / INTEGRITY_PASS；PDM-13→PDM-14/17/18/19/20/21/22/25 future handoff 已登记；其中 HO-P13-P14-001 已由 PDM-14 接收为 HANDOFF_ACCEPTED，其余目标域继续 HANDOFF_OPEN；
- PDM-14：Start Gate PASS；工作版已建立；8 条 incoming handoff 全部 HANDOFF_ACCEPTED；Batch 1（P14-A01～A14 + P14-R01～R04）已 USER_APPROVED / APPLIED；下一步 Batch 2 明确废弃 / 替代 / DO_NOT_RESTORE 扫描；
- `HO-P01-P11-001 = HANDOFF_SUPERSEDED`；`HO-P01-P11-002 = HANDOFF_CLOSED`。PDM-12 incoming handoff 已全部 CLOSED；PDM-12 outgoing future handoff 已扩展登记：PDM-13 / PDM-14 / PDM-16 / PDM-18 / PDM-20 / PDM-21 / PDM-22 / PDM-25 均为 `HANDOFF_OPEN`，待各目标域承接。
