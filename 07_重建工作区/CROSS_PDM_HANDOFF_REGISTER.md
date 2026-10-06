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
| HO-P01-P14-001 | PDM-14 | Recommendation 生命周期与当前 listing_cycle 权利；Customer 身份连续性不得被 Recommendation 重建 | HANDOFF_CLOSED | PDM-14 Final §§2-30 | YES |
| HO-P01-P15-001 | PDM-15 | Consultation 生命周期；Customer 停用不自动抹除既有 Consultation 历史 | HANDOFF_CLOSED | 07_重建工作区/PDM-15_最终完整规则.md | YES |
| HO-P01-P16-001 | PDM-16 | CRM 画像 / 跟进 / 员工内部客户称呼；客户昵称与员工内部备注必须分离 | HANDOFF_CLOSED | 07_重建工作区/PDM-16_最终完整规则.md | YES |
| HO-P01-P18-001 | PDM-18 | Lock / Waitlist 生命周期；Customer 停用不自动取消已存在业务对象 | HANDOFF_CLOSED | 07_重建工作区/PDM-18_最终完整规则.md | YES |
| HO-P01-P19-001 | PDM-19 | Transaction / Refund 生命周期；Customer 停用不改写历史事实 | HANDOFF_CLOSED | 07_重建工作区/PDM-19_最终完整规则.md | YES |
| HO-P01-P20-001 | PDM-20 | 客户端个人资料、账号已停用时的具体页面表现；公开浏览仍可用，受身份/权益业务能力暂停 | HANDOFF_CLOSED | 07_重建工作区/PDM-20_最终完整规则.md | YES |
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
| HO-P02-P15-001 | PDM-15 | Consultation 负责人 / 转派必须继承 identity + permission + data scope + object state | HANDOFF_CLOSED | 07_重建工作区/PDM-15_最终完整规则.md | YES |
| HO-P02-P16-001 | PDM-16 | CRM 业务细节与访问范围必须继承统一权限模型 | HANDOFF_CLOSED | 07_重建工作区/PDM-16_最终完整规则.md | YES |
| HO-P02-P17-001 | PDM-17 | 公海 / Collaboration 的领取、分配、协作必须继承 owner / permission / scope / inactive 边界 | HANDOFF_CLOSED | 07_重建工作区/PDM-17_最终完整规则.md | YES |
| HO-P02-P18-001 | PDM-18 | Lock / Waitlist 动作与负责人必须继承统一权限和对象状态 | HANDOFF_CLOSED | 07_重建工作区/PDM-18_最终完整规则.md | YES |
| HO-P02-P19-001 | PDM-19 | Transaction / Refund / 成交纠错继承权限、scope、终态与历史边界 | HANDOFF_CLOSED | 07_重建工作区/PDM-19_最终完整规则.md | YES |
| HO-P02-P21-001 | PDM-21 | 员工端页面 / Internal Mode 只是投影，不得把入口可见性当授权；4S 继续按 hard DENY 裁剪 | HANDOFF_CLOSED | \`07_重建工作区/PDM-21_最终完整规则.md\` | YES |
| HO-P02-P22-001 | PDM-22 | PC 后台员工、权限、System Admin、角色模板、data scope 等配置承载 | HANDOFF_CLOSED | `07_重建工作区/PDM-22_最终完整规则.md` | YES |
| HO-P02-P25-001 | PDM-25 | role / permission / scope / active-inactive / System Admin 等统一审计字段与留存 | HANDOFF_OPEN | - | YES |

---

## 5. PDM-03 来源 handoff

| handoff_id | 目标 | 完整移交语义 | 状态 | 目标 Authority | source_backwrite |
|---|---|---|---|---|---|
| HO-P03-P10-001 | PDM-10 | 普通分享/收藏不授价；二次分享不转移价格权；正式 Recommendation 才授当前 customer+vehicle+listing_cycle 免费查价权 | HANDOFF_CLOSED | PDM-10 §10 | YES |
| HO-P03-P13-001 | PDM-13 | Priority TTL、可见隔离、交接后的具体 lifecycle；Priority 必须进入离职/资格失效交接扫描 | HANDOFF_CLOSED | PDM-13 Final §§15-17,24-26 | YES |
| HO-P03-P14-001 | PDM-14 | Recommendation lifecycle、正式推荐关系、hidden 单车可见授权；不得用普通分享替代 Recommendation 权利 | HANDOFF_CLOSED | PDM-14 Final §§2-30 | YES |
| HO-P03-P15-001 | PDM-15 | Consultation 完整负责人 / 转派 / SLA；owner 变化不自动漂移已固化业务负责人 | HANDOFF_CLOSED | 07_重建工作区/PDM-15_最终完整规则.md | YES |
| HO-P03-P16-001 | PDM-16 | CRM 跟进、画像、阶段、Source Radar、公司客户历史页面/字段投影；历史服务过不产生永久访问权 | HANDOFF_CLOSED | 07_重建工作区/PDM-16_最终完整规则.md | YES |
| HO-P03-P17-001 | PDM-17 | 公海 / 待公海 / 后台分配 / 领取 / Collaboration；不得通过分享绕过已有 owner 或正式治理 | HANDOFF_CLOSED | 07_重建工作区/PDM-17_最终完整规则.md | YES |
| HO-P03-P18-001 | PDM-18 | Waitlist / Lock 负责人状态机；owner 变化不自动漂移负责人 | HANDOFF_CLOSED | 07_重建工作区/PDM-18_最终完整规则.md | YES |
| HO-P03-P19-001 | PDM-19 | Transaction / Refund 负责人状态机；owner 变化不自动重写交易历史 | HANDOFF_CLOSED | 07_重建工作区/PDM-19_最终完整规则.md | YES |
| HO-P03-P20-001 | PDM-20 | 客户端分享页、推荐朋友 / 直接转介绍真实入口、已有 owner 不被分享抢客的交互投影 | HANDOFF_CLOSED | 07_重建工作区/PDM-20_最终完整规则.md | YES |
| HO-P03-P21-001 | PDM-21 | 员工端分享入口与绑定销售上下文的交互投影 | HANDOFF_CLOSED | \`07_重建工作区/PDM-21_最终完整规则.md\` | YES |
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
| HO-P04-P14-001 | PDM-14 | Recommendation 对 hidden 单车可见授权与 listing_cycle 生命周期 | HANDOFF_CLOSED | PDM-14 Final §§2-30 | YES |
| HO-P04-P18-001 | PDM-18 | Lock / Waitlist 完整 lifecycle；vehicle source/visibility 变化不得静默抹除既有历史 | HANDOFF_CLOSED | 07_重建工作区/PDM-18_最终完整规则.md | YES |
| HO-P04-P19-001 | PDM-19 | Transaction / Refund / correction；completed 终态、source conversion 与历史快照边界 | HANDOFF_CLOSED | 07_重建工作区/PDM-19_最终完整规则.md | YES |
| HO-P04-P20-001 | PDM-20 | 客户端车辆列表/详情的 source、hidden/locked/offline/relist 等状态投影；并承接 listing_started_at / 人工上传时间 / JYT 平台收录时间的客户端展示，不得把 first_seen_at 伪称上游上传时间 | HANDOFF_CLOSED | 07_重建工作区/PDM-20_最终完整规则.md | YES |
| HO-P04-P21-001 | PDM-21 | 员工端车辆详情、source_type、一键转名邦、隐藏/上下架等真实操作入口 | HANDOFF_CLOSED | \`07_重建工作区/PDM-21_最终完整规则.md\` | YES |
| HO-P04-P22-001 | PDM-22 | PC 车辆、隐藏规则、集成配置与运行管理界面；不得改变 PDM-04 车辆 Authority | HANDOFF_CLOSED | `07_重建工作区/PDM-22_最终完整规则.md` | YES |
| HO-P04-P22-002 | PDM-22 | 三个固定车源同步业务 API 的启停、名邦同步 API credential、调用统计与运行状态管理；credential 不得与 JYT 登录凭证或 Collector 电话鉴权混用 | HANDOFF_CLOSED | `07_重建工作区/PDM-22_最终完整规则.md` | YES |
| HO-P04-P23-001 | PDM-23 | JYT / Supply Anomaly 相关 Incident、飞书、SLA、夜间免打扰、通知与异常日志；不得把通知层重新定义成车辆业务状态 | HANDOFF_CLOSED | 07_重建工作区/PDM-23_最终完整规则.md | YES |
| HO-P04-P25-001 | PDM-25 | vehicle/source/listing/visibility/conversion 的统一审计、历史和终态不回写规则 | HANDOFF_OPEN | - | YES |

### 6.1 PDM-04 Integrity Audit 候选转正式 handoff 记录

| candidate_id | 正式 handoff | 结果 |
|---|---|---|
| HC-P04-P20-001 | HO-P04-P20-001 | PROMOTED / HANDOFF_OPEN |
| HC-P04-P22-001 | HO-P04-P22-002 | PROMOTED / HANDOFF_OPEN |
| HC-P04-P23-001 | HO-P04-P23-001 | PROMOTED / HANDOFF_CLOSED |

以上候选已随 PDM-04 `INTEGRITY_PASS` 正式进入 Cross-PDM Handoff Register。

---

## 7. PDM-05 来源 handoff

| handoff_id | 目标 | 完整移交语义 | 状态 | 目标 Authority | source_backwrite |
|---|---|---|---|---|---|
| HO-P05-P02-001 | PDM-02 | “后台 Admin”统一解释为 System Admin 控制平面；车型主数据治理是控制平面动作，不等于普通 Vehicle 业务执行权 | HANDOFF_CLOSED | PDM-02 §6 + PDM-05 §9 | YES |
| HO-P05-P06-001 | PDM-06 | 人工选择有效 vehicle_model_id 后自动带出车型固定属性；MODEL_MISSING 返回原 draft；5A 进一步关闭主档纠错后当前投影/历史快照边界 | HANDOFF_CLOSED | PDM-06 §8/§8A + PDM-05 §12.4 | YES |
| HO-P05-P12-001 | PDM-12 | Matching 必须使用 JYT 已明确车型事实；不得仅因 vehicle_model_id=NULL / mapping pending 就自动降为 unknown | HANDOFF_CLOSED | PDM-12 Final §14 | YES |
| HO-P05-P20-001 | PDM-20 | 客户端车型搜索/筛选/年款分组；年款不是第四级主数据，车型年款与首次上牌年份分离 | HANDOFF_CLOSED | 07_重建工作区/PDM-20_最终完整规则.md | YES |
| HO-P05-P21-001 | PDM-21 | 员工端车型选择、MODEL_MISSING、固定属性自动带出、待确认/冲突状态的真实投影 | HANDOFF_CLOSED | \`07_重建工作区/PDM-21_最终完整规则.md\` | YES |
| HO-P05-P22-001 | PDM-22 | System Admin 的车型主数据、JYT mapping、MODEL_MISSING、conflict、merge 等 PC 治理页面 | HANDOFF_CLOSED | `07_重建工作区/PDM-22_最终完整规则.md` | YES |
| HO-P05-P25-001 | PDM-25 | mapping before/after、车型节点修正、合并迁移、主档纠错及历史不可追改的统一审计/历史标准 | HANDOFF_OPEN | - | YES |

---

## 8. PDM-06 来源 handoff

| handoff_id | 目标 | 完整移交语义 | 状态 | 目标 Authority | source_backwrite |
|---|---|---|---|---|---|
| HO-P06-P07-001 | PDM-07 | Vehicle Document / 档案 / 车况 / 客户可见报告 / 交易交付材料核验；档案不是人工发布硬门槛，必要资料只在 Transaction 完成/交付时按有效 required-field set 核验 | HANDOFF_CLOSED | PDM-07 §§3-10,20 | YES |
| HO-P06-P08-001 | PDM-08 | 人工名邦/4S 允许 0 图发布；正式发布后可补图/删图/调序，删到 0 图仍可继续在售；普通车辆相册与档案/报告资源隔离 | HANDOFF_CLOSED | PDM-08 §§8,18 | YES |
| HO-P06-P10-001 | PDM-10 | customer_list_price/internal_wholesale_price 非发布硬门槛；正常价格修改通过保存修改；取消独立调价 permission/action；内部价字段仍受独立查看 permission | HANDOFF_CLOSED | PDM-10 §§1,5,21 | YES |
| HO-P06-P21-001 | PDM-21 | 员工端新增车源/草稿车源/VIN 重复提示/MODEL_MISSING/保存修改/source_type 选择与草稿阶段修改等真实页面、状态、动作投影 | HANDOFF_CLOSED | \`07_重建工作区/PDM-21_最终完整规则.md\` | YES |
| HO-P06-P22-001 | PDM-22 | PC/后台人工 Vehicle 管理承载；通用 CRUD 不得自动生成正式 Vehicle 物理 Delete，草稿与正式 Vehicle 必须分层 | HANDOFF_CLOSED | `07_重建工作区/PDM-22_最终完整规则.md` | YES |
| HO-P06-P25-001 | PDM-25 | 正式发布、source_type 修改、保存修改、VIN duplicate Gate、draft delete 等统一审计与历史留存标准 | HANDOFF_OPEN | - | YES |

---

## 9. PDM-07 来源 handoff

| handoff_id | 目标 | 完整移交语义 | 状态 | 目标 Authority | source_backwrite |
|---|---|---|---|---|---|
| HO-P07-P08-001 | PDM-08 | 报告/档案资源承载：人工上传报告/档案图片入自有对象存储；出险/维保报告不进普通相册；4S维保H5 对外使用名邦可控报告域名；技术承载不决定 customer_visible | HANDOFF_CLOSED | PDM-08 §§8,16-18,28 | YES |
| HO-P07-P12-001 | PDM-12 | Matching 使用 JYT 原始车况描述/标签与必要确定性标准化事实；保留 provenance；unknown/confirmation_needed 不得猜测 | HANDOFF_CLOSED | PDM-12 Final §§15-16 | YES |
| HO-P07-P13-001 | PDM-13 | Priority 使用车况条件时不得篡改 JYT/manual/Mingbang 检测 provenance，也不得把 unknown 猜成符合 | HANDOFF_CLOSED | PDM-13 Final §§4-6,14 | YES |
| HO-P07-P14-001 | PDM-14 | 档案不完整本身不得阻止 Recommendation；客户可见报告与 Recommendation 权利分层 | HANDOFF_CLOSED | PDM-14 Final §§2-30 | YES |
| HO-P07-P15-001 | PDM-15 | 档案不完整本身不得阻止 Consultation | HANDOFF_CLOSED | 07_重建工作区/PDM-15_最终完整规则.md | YES |
| HO-P07-P18-001 | PDM-18 | 档案不完整本身不得阻止 Lock/Waitlist；档案/报告历史不因 Lock 状态变化被删除或重写 | HANDOFF_CLOSED | 07_重建工作区/PDM-18_最终完整规则.md | YES |
| HO-P07-P19-001 | PDM-19 | 档案不完整不阻止创建 Transaction；首次真正完成/交付前读取当时有效 required-field set，缺失只阻止完成 | HANDOFF_CLOSED | 07_重建工作区/PDM-19_最终完整规则.md | YES |
| HO-P07-P20-001 | PDM-20 | 客户只看明确 customer_visible 报告/结果；VIN/敏感原件不下发；无可见资料整块隐藏；车况/检测按真实 provenance 展示 | HANDOFF_CLOSED | 07_重建工作区/PDM-20_最终完整规则.md | YES |
| HO-P07-P21-001 | PDM-21 | 员工端 archive 上传/后补/替换/作废/历史/核验/customer_visible；4S 仅操作自己有权 Vehicle | HANDOFF_CLOSED | \`07_重建工作区/PDM-21_最终完整规则.md\` | YES |
| HO-P07-P22-001 | PDM-22 | Transaction/交付 required-field set PC 配置；要求明确员工业务配置能力，System Admin 身份本身不自动获得 | HANDOFF_CLOSED | `07_重建工作区/PDM-22_最终完整规则.md` | YES |
| HO-P07-P25-001 | PDM-25 | archive create/update/replace/void/verify、visibility before/after、required-field config、版本关系与操作者/时间统一审计 | HANDOFF_OPEN | - | YES |

---

## 10. PDM-08 来源 handoff

| handoff_id | 目标 | 完整移交语义 | 状态 | 目标 Authority | source_backwrite |
|---|---|---|---|---|---|
| HO-P08-P20-001 | PDM-20 | 列表/详情 4:3、统一左右滑动图片序列、全屏交互、车辆分享图/分享卡片；分享卡片不得固化客户展示价或任何动态/受权限价格，旧分享再次打开实时重验 | HANDOFF_CLOSED | 07_重建工作区/PDM-20_最终完整规则.md | YES |
| HO-P08-P21-001 | PDM-21 | 员工端人工图片上传/删除/排序、资产化状态、失败图片重试/人工恢复；必须区分普通 CDN 加载失败、批发→名邦资产化失败、人工图片恢复，禁止用单一 IMAGE_RETRYING 混生命周期 | HANDOFF_CLOSED | \`07_重建工作区/PDM-21_最终完整规则.md\` | YES |
| HO-P08-P22-001 | PDM-22 | 名邦公开图片域名、JYT Origin、report 域名、对象存储源站与首页/品牌分享配置入口；业务只冻结可配置与安全边界，不写死厂商/TTL/并发等工程参数 | HANDOFF_CLOSED | `07_重建工作区/PDM-22_最终完整规则.md` | YES |
| HO-P08-P25-001 | PDM-25 | 公开域名、Origin、report proxy target 等线上资源安全配置变更，以及资产化/recovery 关键状态变化的统一审计与历史 | HANDOFF_OPEN | - | YES |

---

## 11. PDM-09 来源 handoff

| handoff_id | 目标 | 完整移交语义 | 状态 | 目标 Authority | source_backwrite |
|---|---|---|---|---|---|
| HO-P09-P21-001 | PDM-21 | 员工端上游电话区域、cache available/unavailable、latest、latest failed + cached、拨打、不提供复制，以及 3A：仅当前 wholesale/JYT source_type 显示电话入口，转名邦/4S 后关闭日常入口 | HANDOFF_CLOSED | \`07_重建工作区/PDM-21_最终完整规则.md\` | YES |
| HO-P09-P22-001 | PDM-22 | P03-05 publisher cache/诊断按 source_platform + upstream_publisher_id 唯一定位；Integration API 状态/credential/回传日志与电话明文权限隔离，integration/Collector manage 不自动授明文电话能力 | HANDOFF_CLOSED | `07_重建工作区/PDM-22_最终完整规则.md` | YES |
| HO-P09-P23-001 | PDM-23 | Collector/电话链路 incident、异常与恢复通知、运行事件；通知层不得重新定义 publisher 当前电话/缓存状态，也不得把无有效号码误标成业务成功 | HANDOFF_CLOSED | 07_重建工作区/PDM-23_最终完整规则.md | YES |
| HO-P09-P25-001 | PDM-25 | 电话查看、拨打、latest、latest 成功/失败/无有效号码、缓存 before/after、source_platform + publisher、必要 Vehicle/Customer/Demand context 的统一审计 | HANDOFF_OPEN | - | YES |

---

## 12. PDM-10 来源 handoff

| handoff_id | 目标 | 完整移交语义 | 状态 | 目标 Authority | source_backwrite |
|---|---|---|---|---|---|
| HO-P10-P14-001 | PDM-14 | Recommendation 免费授当前 `customer + vehicle + listing_cycle` 批发查价权；Recommendation 结束、owner/负责人变化、原销售离职均不追回本周期已授权利 | HANDOFF_CLOSED | PDM-14 Final §§2-30 | YES |
| HO-P10-P18-001 | PDM-18 | Lock 创建时冻结必要价格快照；后续上游调价、阶梯、覆盖价、人工价格或 source_type 变化不得回写既有 Lock 快照 | HANDOFF_CLOSED | 07_重建工作区/PDM-18_最终完整规则.md | YES |
| HO-P10-P20-001 | PDM-20 | 客户端批发车价格投影：LIMITED 列表隐藏精确数字价；客户真实主动进入详情时自动解锁且无需二次点击；quota 耗尽主价格字段 `--万`，并提示升级粉丝/VIP或其他 UNLIMITED 等级、亦可联系顾问免费增加今日次数；UNLIMITED 列表/详情直接显示数字价；车辆本身无数字价才显示“价格咨询”；筛选排序可用真实价但 payload 不泄露；Customer 停用暂停价格权益 | HANDOFF_CLOSED | 07_重建工作区/PDM-20_最终完整规则.md | YES |
| HO-P10-P21-001 | PDM-21 | 员工端正常价格字段保存修改、internal-price permission、override、临时追加、UNLIMITED 禁止追加、4S 正常价格编辑与 hard DENY 的真实交互投影 | HANDOFF_CLOSED | \`07_重建工作区/PDM-21_最终完整规则.md\` | YES |
| HO-P10-P22-001 | PDM-22 | 阶梯加价、markup ON/OFF、Customer Level 权益配置、批发价格 LIMITED/UNLIMITED、daily base quota、与 PDM-11 找车 entitlement 的同等级配置承载、相关 permission 与后台业务配置 | HANDOFF_CLOSED | `07_重建工作区/PDM-22_最终完整规则.md` | YES |
| HO-P10-P25-001 | PDM-25 | price/override/temp quota/risk/conversion snapshot/level entitlement config 等统一审计与历史 | HANDOFF_OPEN | - | YES |

---

## 12A. PDM-11 来源 handoff

| handoff_id | 目标 | 完整移交语义 | 状态 | 目标 Authority | source_backwrite |
|---|---|---|---|---|---|
| HO-P11-P12-001 | PDM-12 | 只有员工人工激活后的 active Demand 才进入正式 Matching；Application 不等于 Matching；客户原始要求/销售匹配描述/标准条件/需求说明严格分层；active 不等于 matching-ready；readiness、确定性解析、条件变更重算、候选等级由 PDM-12 冻结；Demand.created_at 为不可变创建事实 | HANDOFF_CLOSED | PDM-12 Final §§2-4,29 | YES |
| HO-P11-P13-001 | PDM-13 | pending Application 不产生 Priority；Priority 只建立在合法 active Demand/Matching 上；Demand paused/completed/cancelled 后 Priority 处理由 PDM-13 冻结；若仲裁按 Demand 创建先后，只能使用不可变 Demand.created_at，不得使用 updated_at/resume time | HANDOFF_CLOSED | PDM-13 Final §§2-3,6,8-9,14 | YES |
| HO-P11-P14-001 | PDM-14 | Recommendation 可关联 source_demand_id；Demand paused/completed/cancelled 不删除历史 Recommendation；Recommendation 生命周期不得反写 Demand 为 active；多 Demand 场景必须保持真实 source_demand_id 归属 | HANDOFF_CLOSED | PDM-14 Final §§2-30 | YES |
| HO-P11-P16-001 | PDM-16 | CRM Customer 详情承载当前等级、找车 entitlement、pending Application、active/paused Demand 与 completed/cancelled 历史概览；Demand 详情使用统一 CRM follow-up 并以 demand_id 关联，不新建第二套 Demand 跟进表；客户检索继承手机号搜索；customer.level.manage 服从 permission+data scope+object state | HANDOFF_CLOSED | 07_重建工作区/PDM-16_最终完整规则.md | YES |
| HO-P11-P17-001 | PDM-17 | pending Find-car Application 本身是公海保护事实；active/paused Demand 同样属于未完成业务。Customer 无 owner 提交找车时必须先完成合法 owner 分配，再创建有负责人的 Application；pool empty 不得创建 responsible=null Application；owner/公海变化不得静默漂移 Demand 负责人；pending Application/待处理任务与未完成 Demand 均纳入正式交接 | HANDOFF_CLOSED | 07_重建工作区/PDM-17_最终完整规则.md | YES |
| HO-P11-P20-001 | PDM-20 | C02 为多对象找车工作区：pending Application、active/paused Demand、Recommendation、completed/cancelled history 可并存；Application 最低必填“想找什么车”，pending 可编辑/撤回；无 entitlement 提交成功仍 pending，提示升级到当前真实具备权益的等级/联系顾问，不得永久写死粉丝/VIP；active 可暂停、paused 可恢复；客户结束找车生成待员工确认请求并显示“结束处理中”，不得造第五主状态；账号停用时 pending Application 保留但不得激活 | HANDOFF_CLOSED | 07_重建工作区/PDM-20_最终完整规则.md | YES |
| HO-P11-P21-001 | PDM-21 | E01“找车服务待处理”展示客户/想找什么车/预算/提交时间/当前负责人/pending，卡片只进入处理详情；E05 Application 详情人工激活唯一 Demand/关闭申请；等级不足先合法调整但不自动激活；E05 Demand 详情完整承载客户原始要求、销售匹配描述、标准条件、需求说明、CRM 跟进、候选/推荐上下文；active=pause/complete/cancel，paused=resume/complete/cancel，终态只读；员工处理客户结束请求时落 completed 或 cancelled，也可直接结束；reassignment/inactive/离职保留负责人历史 | HANDOFF_CLOSED | \`07_重建工作区/PDM-21_最终完整规则.md\` | YES |
| HO-P11-P22-001 | PDM-22 | PC 后台统一承载 Customer Level 权益配置：找车 entitlement 与 PDM-10 LIMITED/UNLIMITED/daily quota 为同一等级体系中的独立权益；V1 不提供单 Customer find-car override；等级可新增/改名/排序/启停/保留历史；customer.level.manage 独立受控且不建设固定多级审批；PC 客户/找车管理至少可查看 Application/Demand 当前状态、负责人及必要治理入口，不能只做等级配置壳 | HANDOFF_CLOSED | `07_重建工作区/PDM-22_最终完整规则.md` | YES |
| HO-P11-P25-001 | PDM-25 | 统一审计 Application 创建/编辑/撤回/关闭/激活转换；Demand.created_at、激活、pause/resume、complete/cancel、客户结束请求及员工确认结果、负责人 reassignment；Customer disable/entitlement loss 触发 active→paused；Customer Level before/after/actor/time 及必要 identity/permission/data scope/object state context；历史不得因终态、停用或等级变化物理删除 | HANDOFF_OPEN | - | YES |

---

## 12B. PDM-12 来源 handoff

| handoff_id | 目标 | 完整移交语义 | 状态 | 目标 Authority | source_backwrite |
|---|---|---|---|---|---|
| HO-P12-P13-001 | PDM-13 | PDM-13 只消费 PDM-12 当前合法 Match Result，不复制第二套 Matching Authority；Priority 候选必须基于当前 high/acceptable，confirmation_needed/no_match 不得作为成功匹配；active Lock 不阻止 PDM-12 继续形成 Match Result，但是否允许建立/继续 Priority、Priority 如何被 Lock 接管/结束由 PDM-13 冻结；Priority TTL/仲裁/lifecycle 与 Demand.created_at 仲裁语义同样归 PDM-13。 | HANDOFF_CLOSED | PDM-13 Final §§4-14,21-23,29-30 | YES |
| HO-P12-P14-001 | PDM-14 | Match Result 与 Recommendation/visibility grant 分离；high/acceptable 不自动创建 Recommendation，不自动授予客户详情可见权；Recommendation 后续 Guard/生命周期由 PDM-14 冻结。 | HANDOFF_CLOSED | PDM-14 Final §§2-30 | YES |
| HO-P12-P16-001 | PDM-16 | Rule Dictionary 新增/修改/启停及其他 Matching 关键事实变化后，PDM-12 只对受影响当前在售车辆与 active+matching-ready Demand 做确定性重解析/重算，并向后续消费者提供可追溯的 Matching change fact；PDM-16 的 Source Radar 负责消费这些变化事实形成 Radar Event / 聚合 / 工作台投影，不得在 PDM-16 复制第二套 Matching 规则或反向覆盖 PDM-12 Match Result Authority。 | HANDOFF_CLOSED | 07_重建工作区/PDM-16_最终完整规则.md | YES |
| HO-P12-P18-001 | PDM-18 | active Lock 本身不使底层真实可售 Vehicle 退出 PDM-12 Matching；其他 Demand 可继续产生携带“已锁/占用”事实的 Match Result，但不得据此绕过单车唯一 active Lock。其他客户候补/Lock 动作、Lock 释放后的处理与 active Lock Guard 归 PDM-18；本 handoff 不外推 Transaction。 | HANDOFF_CLOSED | 07_重建工作区/PDM-18_最终完整规则.md | YES |
| HO-P12-P20-001 | PDM-20 | 客户端车源主页搜索与正式 Demand Matching 共用 PDM-12 Rule Dictionary / deterministic parser；搜索只消费结构化解析结果，不创建 Match Result/Priority/Recommendation/Demand/Lock。搜索解析得到的“车型年款”不得与主筛选“首次上牌年份”混成一字段；六类 V1 auto-Matching 排除字段仍可由 PDM-20 作为搜索/筛选条件承载；Demand 的“未填预算+价格咨询可匹配”不得污染客户端明确数字价格区间筛选，设置数字价格区间时价格咨询车辆仍排除。 | HANDOFF_CLOSED | 07_重建工作区/PDM-20_最终完整规则.md | YES |
| HO-P12-P21-001 | PDM-21 | 员工端 E05-04/E05-05/E05-06 必须承载“保存销售匹配描述→确定性解析→标准条件→受影响范围重算”、四级 Match Result、解释原因、confirmation_needed 人工确认及 stale/recalc-failed 边界；人工确认只允许当前 Demand 负责人或当前 identity/permission/data scope/object state 合法的 active 名邦 Employee，4S hard DENY、System Admin 身份不自动获得；确认只能补事实→重算→读取新的正式 tier，不得直接变成功 Match/Priority/Recommendation。 | HANDOFF_CLOSED | \`07_重建工作区/PDM-21_最终完整规则.md\` | YES |
| HO-P12-P22-001 | PDM-22 | PC P06-10 必须承载真实 Rule Dictionary Action：新增/编辑/启停/作用域/测试解析/历史审计；正式写动作受 matching.rule.manage 控制，4S hard DENY，System Admin 身份不自动取得写能力；PROCESSING/PARTIAL_FAILURE/ERROR 与失败集合重试需真实投影。 | HANDOFF_CLOSED | `07_重建工作区/PDM-22_最终完整规则.md` | YES |
| HO-P12-P25-001 | PDM-25 | 统一审计 Rule Dictionary 创建/修改/启停、before/after、actor/time、规则作用域、Match Result 历史与解释、recalc failure/retry、stale result invalidation、受影响范围重算、confirmation_needed 人工确认 actor/事实来源/前后结果；停用规则与历史 Match Result 不物理删除。 | HANDOFF_OPEN | - | YES |

---

## 12C. PDM-13 来源 handoff

| handoff_id | 目标 | 完整移交语义 | 状态 | 目标 Authority | source_backwrite |
|---|---|---|---|---|---|
| HO-P13-P14-001 | PDM-14 | Priority 本身不授 Customer 车辆详情 visibility；Priority responsible employee 先处理并决定是否 Recommendation，Recommendation/visibility grant 合法成立后 Priority Customer 才可见。正式 Recommendation 建立后 Priority 可保存 recommendation_id 作为关联追溯字段，但两者仍是独立对象；Priority release/expiry 只结束排他保护，不自动结束仍合法 Recommendation；Recommendation cancellation alone 不自动结束 Priority，若员工同时决定放弃保护则另执行 Priority release。active Priority 对其他 Customer 的普通新 Recommendation/普通可见机会形成排他保护；既有 Recommendation/visibility 历史不删除。PDM-14 必须冻结 suppression/restore、Recommendation end、visibility grant 与幂等审计。 | HANDOFF_CLOSED | PDM-14 Final §§2-30 | YES |
| HO-P13-P17-001 | PDM-17 | Priority Customer 资格本身不是公海保护事实；active Priority 才是。Customer 存在 active Priority 时不得按普通无业务 Customer 直接入公海；Priority ended 后重新读取 pending Application、active/paused Demand、Lock、Transaction 及其他 PDM-17 Authority 认可的保护事实，不因历史 Priority 永久阻断公海。 | HANDOFF_CLOSED | 07_重建工作区/PDM-17_最终完整规则.md | YES |
| HO-P13-P18-001 | PDM-18 | active Lock 不阻断 PDM-12 Matching，但 Vehicle 已有 active Lock 时不得新建 Priority；正式 Lock 成立结束当前 active Priority，Priority Customer 自己 Lock 可记 converted_to_lock，其他合法 Lock 记录 takeover reason。Lock 取消/到期不恢复旧 Priority，Vehicle 重新开放后按当时 current legal Match Result 重新仲裁；若原 Recommendation 仍合法，其 visibility 继续由 Recommendation/PDM-14 判断。Recommendation cancellation 或 Priority release/expiry 均不得反向撤销已经合法成立的 Lock。Priority 不是 Lock 排队/竞争优先级。 | HANDOFF_CLOSED | 07_重建工作区/PDM-18_最终完整规则.md | YES |
| HO-P13-P19-001 | PDM-19 | Vehicle 已有 in-progress Transaction 时不得新建 Priority；active Priority 存续期间进入正式 in-progress Transaction 时 Priority ended。Transaction 取消/纠错后 Vehicle 真正重新开放，不恢复旧 Priority，按当时合法 Match Result 重新仲裁；Recommendation cancellation、Priority release 或 Priority expiry 均不得反向撤销已经合法成立的 Transaction；Deposit/Transaction/Refund/Correction 完整状态机由 PDM-19 冻结。 | HANDOFF_CLOSED | 07_重建工作区/PDM-19_最终完整规则.md | YES |
| HO-P13-P25-001 | PDM-25 | 统一审计 Priority Customer 资格开启/关闭、Priority 创建与仲裁结果、trigger_demand_id、TTL snapshot/expires_at、responsible/handover、ended reason、Lock/Transaction takeover、same-cycle suppression、re-arbitration、stale/invalidated/tier downgrade 导致的 lifecycle 变化、TTL 前员工主动 release/不推荐此车、Recommendation 与 Priority 的关联及组合操作中两个独立 domain action，以及 actor/time/before-after/source facts。 | HANDOFF_OPEN | - | YES |
| HO-P13-P20-001 | PDM-20 | 客户端不得暴露 Priority/优先保护/客户专属/内部仲裁等级等内部术语；active Priority Vehicle 不得通过普通 Feed/搜索/筛选/普通分享/无合法授权旧链接向无关 Customer 穿透；Priority Customer 本人也不能仅因 Priority 自动看详情，需 Recommendation/visibility grant。面向客户的普通“在售车源/今日新增”等统计必须排除当前不属于普通公开可浏览集合的 Priority 保护 Vehicle；Priority ended 后重新读取底层 visibility/Vehicle 状态/合法授权，不能简单强制公开。 | HANDOFF_CLOSED | 07_重建工作区/PDM-20_最终完整规则.md | YES |
| HO-P13-P21-001 | PDM-21 | 员工端承接 trigger Demand 当前合法 responsible employee 的 Priority 待处理/active 视图及合法管理范围内监督处理；显示 Vehicle/Customer/trigger Demand/Match tier/剩余TTL或expires_at/current responsible/必要history。合法 responsible employee 可在TTL到期前执行“释放 Priority / 不推荐此车”，立即释放保护并触发重新仲裁；尚未正式 Recommendation 时不得将该动作实现成“取消推荐”。已有 Recommendation 时可设计“结束推荐并释放保护”的组合入口，但底层 Recommendation end 与 Priority release 必须分别校验、审计和留历史。敏感提交继续服从PDM-02与对应业务Authority。禁止人工创建Priority、转给其他Customer、override、改expires_at、人工续期、恢复ended Priority；不恢复独立全局 priority.view/priority.manage/priority.override；4S hard DENY。 | HANDOFF_CLOSED | \`07_重建工作区/PDM-21_最终完整规则.md\` | YES |
| HO-P13-P22-001 | PDM-22 | PC后台承接单Customer Priority资格开关与Priority全局默认TTL两个控制平面配置对象：资格逐Customer开/关、不支持批量、不与Customer Level find-car entitlement混成同一开关、普通负责销售不得因负责Customer自行开启，保存按合法后台identity/permission/data scope/object state重验并审计before/after/actor/time；TTL默认86400s/24h，修改只影响后续新Priority，不追改既有expires_at，不提供逐笔人工续期，配置变更进入统一审计。 | HANDOFF_CLOSED | `07_重建工作区/PDM-22_最终完整规则.md` | YES |

---
## 12D. PDM-14 来源 handoff

| handoff_id | 目标 | 完整移交语义 | 状态 | 目标 Authority | source_backwrite |
|---|---|---|---|---|---|
| HO-P14-P15-001 | PDM-15 | Recommendation 与 Consultation 为独立业务对象：Recommendation end/void 不自动结束既有 Consultation；已有未终结 Consultation 时后来新建 Recommendation 不自动创建第二条 Consultation、不抢写当前 Consultation 负责人、不改写真实历史来源；反向同样成立——Consultation 不自动创建 Recommendation、不授 Recommendation 免费 price-right、不授 hidden Vehicle visibility，Consultation 后续 resolved/invalid/cancelled/其他合法终态也不自动 end/void 仍合法 Recommendation；若 Consultation 来源于 Recommendation，只保留真实 source relation，不绑定生命周期。Consultation 的状态机、负责人优先级/转派、SLA、终态、同周期幂等与后续新建规则由 PDM-15 正式冻结。 | HANDOFF_CLOSED | 07_重建工作区/PDM-15_最终完整规则.md | YES |
| HO-P14-P18-001 | PDM-18 | active Lock / Recommendation 分层：只要 Vehicle 底层仍真实可售、当前 listing_cycle 有效且 Recommendation 其他 Guard 合法，active Lock 占用本身不自动禁止 Recommendation；Recommendation 不产生 Lock 排队优先级、抢车分值或 takeover 权，不得绕过既有 active Lock。Recommendation end/void 也不得反向取消合法 Lock；Waitlist/LockRequest/Lock 完整生命周期由 PDM-18 冻结。 | HANDOFF_CLOSED | 07_重建工作区/PDM-18_最终完整规则.md | YES |
| HO-P14-P19-001 | PDM-19 | in-progress Transaction / Recommendation 分层：只要 Vehicle 底层仍真实可售、当前 listing_cycle 有效且 Recommendation 其他 Guard 合法，Transaction 占用事实本身不自动禁止 Recommendation；Recommendation 不接管、不取消、不回写既有 Transaction。Vehicle sold/offline/unavailable 或 cycle end 后不得新建当前周期 Recommendation；Transaction/Refund/Correction 完整状态机由 PDM-19 冻结。 | HANDOFF_CLOSED | 07_重建工作区/PDM-19_最终完整规则.md | YES |
| HO-P14-P20-001 | PDM-20 | 客户端承接“我的推荐”仅正式 Recommendation 且区分当前/历史；历史推荐价快照与当前价格分层；普通 share link 无固定 N 天 TTL、可继续转发但不传播 Recommendation/price-right/visibility/Internal Mode，每次打开按当前 Vehicle/listing_cycle/Customer/Priority/访问 Authority 重算；hidden/公开/失效/新 cycle 均不得被旧链接绕过；Recommendation/visibility 仅授 Customer Safe Projection，不泄露内部价敏感字段、上游电话、VIN/敏感档案、Priority/Match 内部事实。页面布局与文案由 PDM-20 冻结。 | HANDOFF_CLOSED | 07_重建工作区/PDM-20_最终完整规则.md | YES |
| HO-P14-P21-001 | PDM-21 | 员工端承接 Recommendation 真人动作：车辆详情/CRM客户详情/找车候选上下文三入口；批量推荐 UI 可一次选择多车但底层逐车 Guard/幂等/create-reuse；create/end/void 提交时重验 active eligible 名邦 Employee、当前合法业务责任、permission/capability、data scope、对象状态及 Priority/Customer 等 Guard；4S hard DENY，System Admin 身份本身不自动执行业务；历史 recommender 不等于永久当前操作权；终态/历史只读边界服从 PDM-14。 | HANDOFF_CLOSED | \`07_重建工作区/PDM-21_最终完整规则.md\` | YES |
| HO-P14-P23-001 | PDM-23 | Recommendation create/end/void 不自动扩展为微信主动消息/发送成功失败状态机；V1 不因 Recommendation 本身新增客户侧微信订阅消息体系。未来若通知层消费明确 allowlist 事件，通知失败只能形成通知/incident 事实，不得回滚或改写 Recommendation/visibility/price-right 业务事实。 | HANDOFF_CLOSED | 07_重建工作区/PDM-23_最终完整规则.md | YES |
| HO-P14-P25-001 | PDM-25 | 统一审计 Recommendation / visibility grant：create/reuse/touch/end/void、void reason、customer/vehicle/listing_cycle/recommender/source_demand/price snapshot、visible↔hidden 时 grant effective change、Priority suppression/restore、Customer disable/restore 与 find-car entitlement loss/restore 的客户侧能力暂停恢复、批量逐车结果、actor/time/identity/permission/data scope/object state/before-after/source context；历史不可物理删除，上游同步不得直接覆盖这些 Business Data。 | HANDOFF_OPEN | - | YES |

| HO-P15-P16-001 | PDM-16 | CRM 承接 Consultation 的真实 follow-up 与统一客户跟进历史：PDM-16 可消费 Consultation 上下文形成 CRM 跟进/服务记录，但不得复制第二套 Consultation 状态机；普通 CRM 跟进不得自动被视为首次 SLA 响应，只有满足 PDM-15“可审计真实人工服务动作”的事实才可完成 first response；CRM 阶段也不得反向改 Consultation 主状态、assignee 或初始来源。 | HANDOFF_CLOSED | 07_重建工作区/PDM-16_最终完整规则.md | YES |
| HO-P15-P17-001 | PDM-17 | 公海/待公海 Customer 主动发起 Consultation 时，先按 PDM-17 当前 Authority 完成公海退出与合法 Customer owner 分配，再允许 PDM-15 创建/复用正式 Consultation；owner_assignment_pending 或无法形成合法 owner/服务责任时不得创建 responsible=null Consultation；Consultation reassignment 不得反向改既有 Customer owner。 | HANDOFF_CLOSED | 07_重建工作区/PDM-17_最终完整规则.md | YES |
| HO-P15-P19-001 | PDM-19 | Transaction completed/cancelled/corrected 均不得自动修改 Consultation 主状态；交易只提供可引用业务上下文。Consultation 是否 resolved/normal-close/invalid 必须由 PDM-15 自身合法真人动作形成并留痕。 | HANDOFF_CLOSED | 07_重建工作区/PDM-19_最终完整规则.md | YES |
| HO-P15-P20-001 | PDM-20 | 客户端承接“我的咨询”当前/历史与 Customer Safe Projection：Consultation 正式主状态只有 pending/processing/resolved/invalid；客户撤回/正常关闭/正常解决均以 resolved + close_reason 表达，Current/Low-Fi 的 CANCELLED 只能作为展示投影，不得恢复第五主状态；Customer disable 的 customer_disabled_hold 需如实投影但不得伪造终态；终态后新真实咨询创建新对象。 | HANDOFF_CLOSED | 07_重建工作区/PDM-20_最终完整规则.md | YES |
| HO-P15-P21-001 | PDM-21 | 员工端承接 Consultation 工作台与处理投影：PDM-15 只冻结 SLA 业务事实和首次响应是否完成；PDM-21 审查并承载历史“已超时 > 即将超时 > 新咨询/新服务意向”的工作台优先级、即将超时阈值与展示。开始处理/记录跟进/解决/无效/正常关闭/转派等员工动作必须服从 PDM-15 当前 Consultation Authority：当前 assignee 可处理自己负责对象；经理/店长须具对应 Consultation management capability/permission 且 data scope 覆盖；其他普通销售不得修改别人负责对象；Collaboration 不自动授终结/转派权；转派目标须 active/eligible/合法名邦 Employee；4S hard DENY；System Admin 身份本身不取得业务处理权。不得把 UI 的 CANCELLED 投影恢复为第五主状态，也不得把打开/已读/改 processing/转派误算为首次真实响应。 | HANDOFF_CLOSED | \`07_重建工作区/PDM-21_最终完整规则.md\` | YES |

| HO-P15-P22-001 | PDM-22 | PC 后台承接 Consultation 管理与 SLA 配置：首次人工响应 SLA 初始默认 15 分钟、后台可配置；Consultation 创建时读取当时有效配置并固化 first-response deadline，后续改配置不追改旧对象；timeout 仅派生标记/筛选/提醒，不是第五主状态；配置/管理入口不得把 System Admin 身份本身扩张成 Consultation 业务处理权。 | HANDOFF_CLOSED | `07_重建工作区/PDM-22_最终完整规则.md` | YES |
| HO-P15-P23-001 | PDM-23 | 通知层承接新 Consultation 与 SLA timeout allowlist；DND/quiet hours 只影响主动通知投递，不暂停 SLA 业务计时（Customer disable hold 除外，按 PDM-15 Authority）；FAILED/SKIPPED/DEDUPED/通知成功均不得改变 Consultation 主状态、assignee、first-response fact 或 deadline。 | HANDOFF_CLOSED | 07_重建工作区/PDM-23_最终完整规则.md | YES |
| HO-P15-P25-001 | PDM-25 | 统一审计 Consultation create/reuse/touch/start-processing/follow-up/reassign/assignee_handover_pending/resolve/invalid/normal-close/customer-withdraw/customer_disabled_hold/resume、SLA deadline/first-real-human-response/timeout，以及 actor/time/identity/permission/data scope/object state/old-new assignee/close_reason/source context；历史不可物理删除或由后续状态回写。 | HANDOFF_OPEN | - | YES |

---

## 12F. PDM-16 来源 handoff

| handoff_id | 目标 | 完整移交语义 | 状态 | 目标 Authority | source_backwrite |
|---|---|---|---|---|---|
| HO-P16-P17-001 | PDM-17 | 公海/待公海治理必须消费 PDM-16 CRM 当前事实：未完成 CRM 跟进任务、回访提醒、未来跟进计划属于未完成责任，进入公海前必须完成、取消或正式交接；“暂不联系/暂无意向”只属于 CRM Stage/Tag/服务判断，不自动清 owner、不自动进公海；长期未跟进公海候选由 PDM-17 冻结人工治理，不得把 Customer Opportunity 直接当自动进公海机制；Customer 进出公海/重新领取不得清空 CRM Stage、Customer Tags、原始 source、历史 Follow-up、Shared Profile 或合法公司服务历史；公海领取后的首次跟进超时只形成提醒/待处理事实，不自动收回 Customer、不自动重新进公海，具体治理由 PDM-17 冻结。 | HANDOFF_CLOSED | 07_重建工作区/PDM-17_最终完整规则.md | YES |
| HO-P16-P21-001 | PDM-21 | 员工端承接 CRM list/detail、记录跟进、我的客户/团队客户、Customer Opportunity、Source Radar 等 carrier；Customer Opportunity=聚合客户机会信号、Source Radar=Demand-centered Matching change discovery、强待办=真实服务责任，三类不得合并成一个 task/state system。Source Radar“推荐给客户”进入 PDM-14 Recommendation Authority；“标记不适合”只抑制当前 Demand×Vehicle 当前有效匹配事实，不改 PDM-12 Match Result/Rule Dictionary/Demand 条件，底层合法 Matching 输入实质变化后可重新出现；不得恢复 CRM 直接锁车入口；最近行为只显示聚合兴趣，不开放逐点击监控。 | HANDOFF_CLOSED | \`07_重建工作区/PDM-21_最终完整规则.md\` | YES |
| HO-P16-P22-001 | PDM-22 | PC 后台承接公司级受控 CRM Stage 字典与 Customer Tag 字典的真实配置 carrier：支持新增、改名/排序、启用/停用，历史已使用 Stage/Tag 不普通物理删除，停用不回写历史 Customer 事实；配置提交服从当前 identity+permission/capability+data scope+object/config state 并留审计。P06-07“客户机会规则”页面名不得反推任意 Opportunity rule CRUD/config；V1 不建设通用 Customer Opportunity 规则引擎，只消费以后明确产品批准的 deterministic signal producer。若 PDM-17 保留公海领取后首次跟进提醒时长，其后台配置 carrier 由 PDM-22 按合法配置权限承接，不得把超时配置成自动收回/自动进公海。 | HANDOFF_CLOSED | `07_重建工作区/PDM-22_最终完整规则.md` | YES |
| HO-P16-P23-001 | PDM-23 | CRM 待办、回访提醒、未来跟进计划若需要主动提醒，其渠道、频控、DND/quiet-hours、失败/跳过/去重日志由 PDM-23 承接；通知结果不得改写 CRM Stage/Tag/Follow-up/责任事实。公海领取后的首次跟进超时若由 PDM-17 确认为提醒事件，则通知层只负责投递/日志，不自动收回 Customer、不自动重新进公海。Customer Opportunity 不逐条自动飞书；普通 Source Radar 变化不得默认升级成强通知，除非后续存在明确 allowlist Authority。 | HANDOFF_CLOSED | 07_重建工作区/PDM-23_最终完整规则.md | YES |
| HO-P16-P25-001 | PDM-25 | 统一审计/历史承接 PDM-16 CRM 核心事实：CRM Stage before/after/actor/time/source context；重要 Customer Tag 增删替换的可追溯变化；Shared Profile before/after；员工内部服务称呼 author/time/source/修改历史且不得覆盖旧事实；Follow-up append-only、更正/作废/无效历史；Stage/Tag 字典新增/改名/排序/启停与历史停用语义；当前 access 与公司历史事实分离；历史不可因 owner/public-pool/employee inactive 被物理删除。 | HANDOFF_OPEN | - | YES |
---

## 12G. PDM-17 来源 handoff

| handoff_id | 目标 | 完整移交语义 | 状态 | 目标 Authority | source_backwrite |
|---|---|---|---|---|---|
| HO-P17-P18-001 | PDM-18 | Lock / Waitlist 继续作为公海保护事实；PDM-18 必须保持 Customer owner 与 Lock/Waitlist 当前 responsible 分层，owner / 公海变化不得静默取消、漂移或改写既有 Lock/Waitlist；若进入公海前仍有未完成 Lock/Waitlist，必须先按对应 Authority 完成、取消或正式交接。 | HANDOFF_CLOSED | 07_重建工作区/PDM-18_最终完整规则.md | YES |
| HO-P17-P19-001 | PDM-19 | Transaction / Refund 在途责任继续作为公海保护事实；Customer owner / 公海变化不得静默取消、漂移或重建 Transaction/Refund 当前责任与历史；进入公海前必须先按 PDM-19 完成、取消或正式交接未完成责任。 | HANDOFF_CLOSED | 07_重建工作区/PDM-19_最终完整规则.md | YES |
| HO-P17-P21-001 | PDM-21 | 员工端承接公海 / 待公海真人操作投影：后台指定分配 / 人工治理为主，主动领取为保留但弱化且受 permission/config 控制；承载待公海三向处理、主动领取、批量治理、Collaboration 建立/结束/范围操作，并服从当前 owner、permission/capability、data scope、保护事实、敏感字段与并发 Guard。 | HANDOFF_CLOSED | \`07_重建工作区/PDM-21_最终完整规则.md\` | YES |
| HO-P17-P22-001 | PDM-22 | PC 后台承接待公海候选条件、继续当前 owner 后重新检查周期、主动领取数量上限/频率限制、领取后首次跟进提醒时间等配置 carrier；PDM-17 只冻结“可配置”，不写死数值；配置不得把提醒升级成自动收回/自动进公海。 | HANDOFF_CLOSED | `07_重建工作区/PDM-22_最终完整规则.md` | YES |
| HO-P17-P23-001 | PDM-23 | 通知层承接待公海与领取后首次跟进提醒的渠道、频控、DND/quiet-hours、失败/跳过/去重与日志；长期未跟进三条件候选本身不自动飞书，任何通知结果都不得改写 owner、公海状态或 Collaboration。 | HANDOFF_CLOSED | 07_重建工作区/PDM-23_最终完整规则.md | YES |
| HO-P17-P25-001 | PDM-25 | 统一审计/历史承接 PDM-17 核心变化：正式进入/退出公海、主动领取、后台指定分配/owner transfer、继续当前 owner 确认、Collaboration 新增/移除/scope 变化，以及 before/after/actor/time、可选 reason/note、每轮公海历史与不可物理删除语义。 | HANDOFF_OPEN | - | YES |
---
## 12H. PDM-18 来源 handoff

| handoff_id | 目标 | 完整移交语义 | 状态 | 目标 Authority | source_backwrite |
|---|---|---|---|---|---|
| HO-P18-P19-001 | PDM-19 | PDM-19 承接正式 Lock 后的 Deposit / Transaction / Refund / 换车：真实 Deposit 存在时普通 Lock expires_at 不得自动释放；供应异常不得静默取消 Lock 或抹除 Deposit/快照/历史；后续 release、换车、Transaction/Refund 必须按 PDM-19 当前资金与交易 Authority 建立新事实，不回写 PDM-18 Lock 历史。 | HANDOFF_CLOSED | 07_重建工作区/PDM-19_最终完整规则.md | YES |
| HO-P18-P20-001 | PDM-20 | 客户端承接 LockRequest / Lock / Waitlist Customer Safe Projection：普通 VIP/粉丝 Lock 只占车不自动全客户隐藏；Priority-origin Lock 在 Priority ended(converted_to_lock) 后继承客户侧排他 visibility；自动 Waitlist 的客户可在“我的候补”等位置看到必要安全摘要但不得穿透 Priority-origin Lock 普通详情；普通 Lock/Waitlist 当前与历史、延期后 expires_at、已收 Deposit 持续锁定文案由 PDM-20 投影；Waitlist 内部存在处理顺序但客户端不得展示保证性“第几名”。 | HANDOFF_CLOSED | 07_重建工作区/PDM-20_最终完整规则.md | YES |
| HO-P18-P21-001 | PDM-21 | 员工端承接 LockRequest 待处理与 Lock/Waitlist 管理：LockRequest PENDING/APPROVED/REJECTED/EXPIRED/LOCK_CONFLICT/CLOSED_NOT_LOCKABLE 投影，4S hard DENY；名邦合法 Employee 可在明确 Customer+Vehicle 上下文直接创建 Lock；approve 必须重验并原子创建 Lock；支持普通 Lock 延期、人工 release/cancel、Waitlist end、responsible handoff；人工 mutation 服从 permission/capability+scope+object state 并保留 reason/audit。V1 不新增批量 Lock/approve/release/extension/Waitlist mutation。 | HANDOFF_CLOSED | \`07_重建工作区/PDM-21_最终完整规则.md\` | YES |
| HO-P18-P22-001 | PDM-22 | PC 配置承接默认正式 Lock 时长：当前业务默认 72h、后台可配置；新 Lock 创建时读取并固化 expires_at，后改默认值不追改旧 Lock；修改默认时长必须由具有 business-config permission/capability 且 scope 合法的身份执行，System Admin 控制平面身份本身不自动获得该业务配置权；配置变更记录 old/new/actor/time。PDM-18 不恢复固定 30 分钟到期提醒默认值。 | HANDOFF_CLOSED | `07_重建工作区/PDM-22_最终完整规则.md` | YES |
| HO-P18-P23-001 | PDM-23 | 通知层承接 LockRequest APPROVED/REJECTED/EXPIRED/LOCK_CONFLICT/CLOSED_NOT_LOCKABLE、自动 Waitlist、Lock 即将到期等 allowlist / 渠道 / DND / 频控 / 去重 / 失败日志；PDM-18 不写死默认提前 30 分钟，是否提醒及提前量由 PDM-23 + PDM-22 当前配置决定；任何通知成功/失败/SKIPPED 均不得改写 LockRequest/Lock/Waitlist 主业务事实。 | HANDOFF_CLOSED | 07_重建工作区/PDM-23_最终完整规则.md | YES |
| HO-P18-P25-001 | PDM-25 | 统一审计与工程完整性承接 LockRequest / Lock / Waitlist：create/reuse/approve/reject/expire/conflict/closed-not-lockable、resulting_lock_id/resulting_waitlist_id、Lock create/extend/release/cancel/expiry/responsible handoff、Waitlist create/reuse/auto-create/end/vehicle-terminal end、price/duration snapshot、supply_anomaly、before/after/actor/system/time/reason；验证单车唯一 active Lock、幂等/retry-safe、并发 winner、timeout worker、配置 snapshot 不追改、自动候补与唯一 active Waitlist。历史不可物理删除。 | HANDOFF_OPEN | - | YES |

---

## 12I. PDM-19 来源 handoff

| handoff_id | 目标 | 完整移交语义 | 状态 | 目标 Authority | source_backwrite |
|---|---|---|---|---|---|
| HO-P19-P20-001 | PDM-20 | 客户端承接 PDM-19 Customer Safe Projection：我的交易 / 意向金 / 退款中仅展示客户本人合法可见的 Vehicle 摘要、Transaction 当前/历史状态、时间、当前负责人、客户自身 Deposit/Refund 事实与换车新旧业务必要关联；不得下发内部资金权限、上游电话、内部价、其他 Customer 信息。Transaction completed/cancelled/corrected 不自动改变 Consultation/Demand 页面状态；真实业务状态只读 PDM-19/PDM-11/PDM-15 Authority。 | HANDOFF_CLOSED | 07_重建工作区/PDM-20_最终完整规则.md | YES |
| HO-P19-P21-001 | PDM-21 | 员工端承接 Deposit / Transaction / Refund / correction 真实 Action Contract：记录真实 Deposit 与资金 correction 分权；Transaction create/complete/cancel/correct；Refund create、真实退款确认、pending 直接 close+reason；supply anomaly 后 cancel/change-car/refund；Transaction responsible handoff。员工 Vehicle Feed 占用状态遵守 trading > locked，列表不得泄露客户姓名/手机号/Deposit 金额/详细交易进度。所有敏感动作服从 identity+permission/capability+scope+object state。 | HANDOFF_CLOSED | \`07_重建工作区/PDM-21_最终完整规则.md\` | YES |
| HO-P19-P22-001 | PDM-22 | PC 后台承接 P07 Deposit / Transaction / Refund / correction 真实业务管理 carrier，以及 Dashboard 进行中 Transaction / 资金待办等统计口径；System Admin 控制平面身份本身不获得 Transaction/资金业务执行权。PC carrier 不得把 closed 当 refunded，不得允许覆盖式改写历史。 | HANDOFF_CLOSED | `07_重建工作区/PDM-22_最终完整规则.md` | YES |
| HO-P19-P23-001 | PDM-23 | 通知层承接 Transaction / Refund 关键状态变化的渠道、DND、去重、失败日志与 allowlist；包括 Transaction created/completed/cancelled/corrected、Refund pending/refunded/closed、supply anomaly 等适用事件。通知成功/失败/SKIPPED 均不得改变 Deposit/Transaction/Refund/correction 业务事实。 | HANDOFF_CLOSED | 07_重建工作区/PDM-23_最终完整规则.md | YES |
| HO-P19-P25-001 | PDM-25 | 统一审计与工程完整性承接 Deposit/Transaction/Refund/correction：append-only history、Lock→Transaction 原子转换、single in-progress Transaction per Vehicle、retry-safe/idempotency、Refund Lock XOR Transaction subject、refundable_balance、防并发超退、真实当场退款直达 refunded、terminal read-only、correction before/after、actual_deal_price 历史主价格、responsible handoff、supply_anomaly、误成交 correction 不制造假 relist/new cycle；统一验证 actor/time/reason/provenance/transaction isolation。 | HANDOFF_OPEN | - | YES |

---

## 12J. PDM-20 来源 handoff

| handoff_id | 目标 | 完整移交语义 | 状态 | 目标 Authority | source_backwrite |
|---|---|---|---|---|---|
| HO-P20-P21-001 | PDM-21 | 员工端承接与客户端列表/详情占用投影相对应的 Employee Vehicle Feed / Detail：占用状态优先级保持 trading > locked；员工列表不得泄露 Customer 姓名、手机号、Deposit 金额、详细 Transaction 进度；不得把客户侧“我的锁车/我的候补”等文案直接复用到员工端；员工动作继续读取 PDM-18/PDM-19 真实 Authority。 | HANDOFF_CLOSED | \`07_重建工作区/PDM-21_最终完整规则.md\` | YES |
| HO-P20-P22-001 | PDM-22 | PC 配置承接 PDM-20 已冻结的客户端配置需求：全局单一“服务/购买说明”内容、基础富文本/Word 基础格式兼容与安全清理、保存/更新/审计；普通分享标题模板、默认分享图、Customer Safe 字段白名单等轻量配置；不得扩张为无限通用模板引擎。 | HANDOFF_CLOSED | `07_重建工作区/PDM-22_最终完整规则.md` | YES |
| HO-P20-P24-001 | PDM-24 | 公告/Banner 运营 Authority 承接客户端投影背后的创建/编辑/启停/active-history、Schedule、Placement、后台排序与运营管理；Banner placement 至少承接 HOME_TOP / VEHICLE_DETAIL，客户端数量投影继续服从 PDM-20 Final；不得反向改变 Customer Safe 展示与导航边界。 | HANDOFF_ACCEPTED | 07_重建工作区/PDM-24_公告Banner运营位客户触达_规则原子重建_工作版.md | YES |
| HO-P20-P25-001 | PDM-25 | 统一横切审计/完整性承接客户端权限变化后的旧敏感 UI/payload 撤销、copy-before-view Guard、Historical Detail 只读、query context restore、submit idempotency/duplicate prevention、Customer Safe Projection 字段级测试矩阵、stale carrier alignment 与跨 PDM Final 审计。 | HANDOFF_OPEN | - | YES |

---

## 12K. PDM-21 来源 handoff

| handoff_id | 目标 | 完整移交语义 | 状态 | 目标 Authority | source_backwrite |
|---|---|---|---|---|---|
| HO-P21-P23-001 | PDM-23 | 通知 / 飞书层承接 PDM-21 员工端工作台与敏感页面的通知投影：通知只消费真实 Consultation SLA、LockRequest deadline、Priority expires_at、Transaction/业务事件等 completed-PDM 事实；不得把 E01 urgency 排序反向写成新的业务状态。通知 deep-link 进入 E01/E06/E07 等当前合法员工上下文时必须重新校验 identity、permission/capability、data scope、object state；打开通知/打开详情本身不得误算 Consultation first response。 | HANDOFF_CLOSED | 07_重建工作区/PDM-23_最终完整规则.md | YES |
| HO-P21-P25-001 | PDM-25 | 统一审计 / 历史 / 横切完整性承接 PDM-21 员工体验规则：Internal Mode 临时 session、长按进入、后台5分钟退出、权限撤销后旧页面失效；高风险员工 Action 的 entry_context、actor、time、before/after、result、failure；source_type、hidden/restore、价格、电话、Archive、Recommendation、Lock/Transaction 等继续复用对应业务域审计事实，不由 PDM-21 建第二套日志；E01 排序、UI 状态、disabled/hidden carrier 不得反向改写底层历史。 | HANDOFF_OPEN | - | YES |

---


## 12M. PDM-23 来源 handoff

| handoff_id | target | 语义 | status | target_landing | source_backwrite_required |
|---|---|---|---|---|---|
| HO-P23-P25-001 | PDM-25 | 统一审计 / 历史 / 时区承接 PDM-23 Notification 规则：Notification Config before/after/actor/time、employee_id↔飞书接收身份映射历史、公司飞书总开关、员工个人提醒开关、员工级 SLA 总群开关、DND/群路由/incident cadence 配置历史、Notification Log 统一时间与历史检索、业务事件与 Notification fact 关联、SENT/FAILED/SKIPPED/DEDUPED/NOT_ALLOWLISTED 查询边界、敏感字段最小化与 audit visibility。PDM-25 不得反向改变 PDM-23 已冻结的通知渠道/开关/业务解耦语义。 | HANDOFF_OPEN | - | YES |

> 2026-10-07 PDM-23 Batch 4 重建版已 USER_APPROVED / APPLIED；HO-P23-P25-001 正式登记。待 PDM-25 承接后关闭并回写来源。

---


## 12N. PDM-24 来源 handoff

| handoff_id | target | 语义 | status | target_landing | source_backwrite_required |
|---|---|---|---|---|---|
| HO-P24-P25-001 | PDM-25 | 统一审计 / 历史 / 时区承接 PDM-24 Announcement / Banner 规则：Announcement 创建/编辑/启停、生效开始/结束日期、排序、自动弹出开关、标题正文变更、普通编辑不重置当天展示事实、每日自动展示事实；Banner 创建/编辑/启停、schedule、sort、placement、target、停用/再启用与再启用校验；统一记录 before/after/actor/time 与业务时区。PDM-25 不得反向改变 PDM-24 已冻结的公告每日全局频控、Banner placement/target/lifecycle 语义。 | HANDOFF_OPEN | - | YES |

> 2026-10-07 PDM-24 Batch 4 已 USER_APPROVED / APPLIED；HO-P24-P25-001 正式登记。待 PDM-25 承接后关闭并回写来源。

---

## 13. Post-PDM25 IA / Low-Fi Carrier Ledger｜持续累积

> 当前只登记，不施工；统一在 PDM-25 完成 + PDM-01～25 全局最终总复核 PASS 后集中对齐。

| 来源 | stale carrier | 状态 |
|---|---|---|
| PDM-20 | Current 正常首入“暂不 owner”旧语义 | CARRIER_DEFERRED |
| PDM-20 | 旧默认定位城市 / 700km 自动扩展 / 综合排序 | CARRIER_DEFERRED |
| PDM-20 | 旧“我要这辆车”混合 Consultation / Lock 入口 | CARRIER_DEFERRED |
| PDM-20 | Consultation `CANCELLED` 第五主状态 carrier | CARRIER_DEFERRED |
| PDM-20 | Priority 自动授 Customer visibility / 客户端 Priority 内部术语 | CARRIER_DEFERRED |
| PDM-20 | LIMITED 二次点击“查看价格”旧流程 | CARRIER_DEFERRED |
| PDM-20 | Waitlist 保证排名 / 自动晋升；LockRequest 手动再候补/独立进度/主动撤回 | CARRIER_DEFERRED |
| PDM-20 | C03 多页面通用壳 / 主导航缺失 | CARRIER_DEFERRED |
| PDM-20 | Vehicle Detail 顾问/档案/车况/服务说明/顶部导航/价格格式等 Current 投影不足 | CARRIER_DEFERRED |
| PDM-20 | Announcement / Banner Current carrier 不完整 | CARRIER_DEFERRED |
| PDM-20 | PDM-19 Refund closed / correction / change-car 客户端交易资金旧壳 | CARRIER_DEFERRED |
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
| PDM-14 | 旧“只有 Customer current owner 才能创建 Recommendation”若用于阻断合法 source Demand responsible / handover；正确 Authority 是当前合法业务负责关系，且不得扩大成任意 Employee 可推荐 | CARRIER_DEFERRED |
| PDM-14 | 客户侧 re-share 永远 SOURCE_ONLY、永远不形成 owner 的旧表达；正确 Authority 服从 PDM-03 分享/转介绍归属，SOURCE_ONLY 状态本身保留 | CARRIER_DEFERRED |
| PDM-14 | REC 专属 URL / Recommendation-specific link / 第二套推荐分享页残留；正确 Authority 是 Recommendation 为内部正式事实，对外继续普通车辆分享 | CARRIER_DEFERRED |
| PDM-14 | Current IA / Low-Fi HIDDEN_CONTROLLED 仅凭 Demand/Priority 直接授 Customer hidden Vehicle 详情权；正确 Authority 是 Recommendation + customer-specific visibility grant | CARRIER_DEFERRED |
| PDM-14 | Current IA / Low-Fi P06-01 / P06-M01 Customer Merge 状态机及 Recommendation/权益迁移；PDM-01 Final 已全面取消 Customer Merge | CARRIER_DEFERRED |
| PDM-14 | 把“4S 成员 hard DENY Recommendation”误实现成“4S 车源不可被名邦合法销售 Recommendation” | CARRIER_DEFERRED |
| PDM-14 | 批量推荐被实现成 group Recommendation / 共享 recommendation_id / 共享生命周期，而不是逐车对象 | CARRIER_DEFERRED |
| PDM-14 | Recommendation create/end/void 顺带修改 Customer owner 或 Demand responsible | CARRIER_DEFERRED |
| PDM-14 | 普通 share link 使用固定 N 天 TTL，或二次转发继承上一 Customer 的 Recommendation/price/visibility | CARRIER_DEFERRED |
| PDM-14 | Recommendation 创建时价格咨询、同 cycle 后出现数字价却再次扣 daily quota | CARRIER_DEFERRED |
| PDM-14 | Recommendation/visibility grant 把 Internal Mode、敏感内部价、上游电话、VIN/敏感档案、Priority/Match 内部事实一起下发 Customer | CARRIER_DEFERRED |
| PDM-14 | JYT/上游同步直接 create/end/void/delete/overwrite Recommendation 或 customer-specific visibility grant | CARRIER_DEFERRED |
| PDM-14 | Consultation 自动创建 Recommendation、赠送 Recommendation price-right 或直接授 hidden visibility | CARRIER_DEFERRED |


| PDM-16 | Customer Merge / MERGE_* 及跨 Customer CRM 历史迁移旧方向 | CARRIER_DEFERRED |
| PDM-16 | CRM Customer Detail 直接“锁车→再选 Vehicle”旧入口 | CARRIER_DEFERRED |
| PDM-16 | Customer Opportunity 旧 7 天 / 单日 >40 / 连续 3 天阈值及对应配置控件 | CARRIER_DEFERRED |
| PDM-16 | 大字段 CRM 画像 / 把 Personal Note、Shared Profile、服务称呼重新合并为一个大备注字段 | CARRIER_DEFERRED |
| PDM-16 | 历史服务过即可永久访问 Customer CRM 的旧误义 | CARRIER_DEFERRED |
| PDM-16 | P06-07 页面壳反推任意 Customer Opportunity 规则 CRUD/config | CARRIER_DEFERRED |
| PDM-16 | Customer Opportunity 被实现成独立工单 / assignee / SLA / close lifecycle | CARRIER_DEFERRED |
| PDM-16 | E03-03 只有“记录跟进”导航而无真实 Follow-up mutation submit chain | CARRIER_DEFERRED |
| PDM-16 | Customer Opportunity / Source Radar / 强待办混成同一 task/state system | CARRIER_DEFERRED |
| PDM-16 | Source Radar“标记不适合”直接反写 PDM-12 Match Result / Rule Dictionary / Demand 条件 | CARRIER_DEFERRED |
| PDM-16 | Consultation / Demand / Lock / Transaction 等具体业务事件自动改写 CRM Stage | CARRIER_DEFERRED |

| PDM-17 | P06-05-V5-PUBLIC_POOL_ASSIGN_CONFIRM_REQUIRED.svg：旧“指定分配后还需目标销售二次确认”与 P17-A11 当前 Authority 冲突；正确语义为合法指定分配成功后目标员工立即成为唯一 owner，无二次确认主状态 | CARRIER_DEFERRED |

| PDM-18 | 旧“LOCK_CONFLICT 不自动转 Waitlist / 客户必须再次手工点候补”承载；当前 Authority 已改为竞争请求自动创建/复用 Waitlist，LockRequest 本体保留 LOCK_CONFLICT 并关联 resulting_waitlist_id | CARRIER_DEFERRED |
| PDM-18 | 把所有正式 Lock 客户可见性做成完全相同；当前 Authority 区分普通 Lock“占车不全客户隐藏”与 Priority-origin Lock“继承客户侧排他可见性” | CARRIER_DEFERRED |
| PDM-18 | 把内部 Waitlist created_at 处理顺序直接展示成客户保证性“第几名”；当前 Authority 只保留内部稳定顺序，客户端不承诺排名/自动晋升 | CARRIER_DEFERRED |
| PDM-18 | Lock 配置 carrier 仍写“Lock 不是独立配置对象 / 无配置入口”；当前 Authority 为默认72h且后台可配置、只影响新 Lock | CARRIER_DEFERRED |
| PDM-18 | 正式 Lock 延期、新 expires_at、已延期、供应异常与 Waitlist 结束矩阵在 Current/Low-Fi 仍存在真实操作投影不足 | CARRIER_DEFERRED |

| PDM-19 | Current IA 中“pending Refund 关闭必须额外独立 refund-management permission”；当前 Authority 已改为合法处理人直接 close + reason，不新增专门 close permission/审批 | CARRIER_DEFERRED |
| PDM-19 | 旧 Refund 仅 pending/refunded 两主状态；当前 Authority 已扩展为 pending/refunded/closed，closed=未实际退款而关闭 | CARRIER_DEFERRED |
| PDM-19 | 旧“System Admin 可参与 completed Transaction correction”残留；当前 Authority 明确 System Admin 控制平面身份本身无成交纠错业务权 | CARRIER_DEFERRED |
| PDM-19 | 客户端/员工端/PC 当前通用交易资金状态壳可能缺 actual_deal_price、Refund closed、Deposit correction、Transaction responsible handoff、误成交 correction listing_cycle 后果等完整投影 | CARRIER_DEFERRED |

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

- PDM-01～PDM-23：已完成对应 Final / Integrity Closeout，其中 PDM-23 当前为 `COMPLETE / INTEGRITY_PASS`；
- PDM-23 正式 Authority：`07_重建工作区/PDM-23_最终完整规则.md`；
- PDM-23 Final Integrity：`07_重建工作区/PDM-23_最终完整性复核_2026-10-07.md / PASS`；
- PDM-23 正式规则 / 裁决单元：65；
- target=PDM-23 的 10 / 10 incoming handoff：`HANDOFF_CLOSED / source_backwrite=YES`；
- `HO-P23-P25-001 = HANDOFF_OPEN`；
- PDM-20 → PDM-24 的 `HO-P20-P24-001 = HANDOFF_ACCEPTED`，已由 PDM-24 Startup Gate 正式接收；Final Closeout 前不关闭、不 source backwrite；
- IA / Low-Fi / Engineering 继续 `NO_CONSTRUCTION`；
- `HO-P24-P25-001 = HANDOFF_OPEN`；
- 当前唯一下一步：**PDM-24 Final 前完整性复核（Prefinal Integrity）**。

## 12L. PDM-22 来源 handoff

| handoff_id | target | 语义 | status | target_landing | source_backwrite_required |
|---|---|---|---|---|---|
| HO-P22-P23-001 | PDM-23 | 通知 / 飞书层承接 PDM-22 已冻结的业务配置值与通知 carrier 边界：Consultation 首次响应 SLA、公海领取后首次跟进提醒、Lock 即将到期提醒等业务配置值由对应业务/PC 配置提供；PDM-23 负责通知 allowlist、渠道、飞书、DND、频控、去重、失败 / skipped 日志。通知成功、失败、跳过均不得改写 Consultation / Customer owner / Lock 等底层业务状态。 | HANDOFF_CLOSED | 07_重建工作区/PDM-23_最终完整规则.md | YES |
| HO-P22-P25-001 | PDM-25 | 统一审计 / 历史 / 配置版本承接 PDM-22 PC 管理规则：重要配置 before/after/actor/time、配置版本、统一历史检索、时区规范，以及 Employee / System Admin PC credential 治理 mutation 的统一审计；继续复用各业务域既有审计事实，不由 PDM-22 再造第二套跨域日志或历史 Authority。 | HANDOFF_OPEN | - | YES |

> 2026-10-07 PDM-22 Final Closeout：target=PDM-22 的 18 / 18 incoming handoff 已全部 `HANDOFF_CLOSED`，target landing=`07_重建工作区/PDM-22_最终完整规则.md`，source backwrite=YES；HO-P22-P23-001 / HO-P22-P25-001 继续 `HANDOFF_OPEN`。

> 2026-10-07 PDM-23 Startup Gate：target=PDM-23 的 10 / 10 incoming handoff 已由 P23-R00 / Startup Gate 正式接收为 `HANDOFF_ACCEPTED`；最终关闭与 source backwrite 仍须等待 PDM-23 Final Closeout。

> 2026-10-07 PDM-23 Final Closeout：用户最终批准并确认执行；target=PDM-23 的 10 / 10 incoming handoff 已全部 `HANDOFF_CLOSED`，target landing=`07_重建工作区/PDM-23_最终完整规则.md`，source backwrite=YES；`HO-P23-P25-001` 继续 `HANDOFF_OPEN`。


> 2026-10-07 PDM-24 Startup Gate：P24-R00 与 P24-R01 已 USER_APPROVED / APPLIED；HO-P20-P24-001 已从 HANDOFF_OPEN 正式接收为 HANDOFF_ACCEPTED，target landing=`07_重建工作区/PDM-24_公告Banner运营位客户触达_规则原子重建_工作版.md`；Final Closeout 前不得 HANDOFF_CLOSED / source backwrite。


> 2026-10-07 PDM-24 窗口切换：Batch 1 / Batch 2 已 PASS / USER_APPROVED / APPLIED；Batch 3 = NO_NEW_ATOMS / PASS / USER_APPROVED / APPLIED；HO-P20-P24-001 继续 HANDOFF_ACCEPTED，Final Closeout 前不关闭、不 source backwrite；当前唯一下一步为 PDM-24 Batch 4 Final-gap Scan。


> 2026-10-07 PDM-24 Batch 4：P24-B4-01～P24-B4-07 已 PASS / USER_APPROVED / APPLIED；HO-P24-P25-001 已登记 HANDOFF_OPEN；HO-P20-P24-001 继续 HANDOFF_ACCEPTED，Final Closeout 前不关闭、不 source backwrite；当前唯一下一步为 PDM-24 Final 前完整性复核（Prefinal Integrity）。
