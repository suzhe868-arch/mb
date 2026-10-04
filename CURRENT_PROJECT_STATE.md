# 名邦汽车 V1｜当前项目状态

> 更新时间：2026-10-05  
> 状态源：GitHub `suzhe868-arch/mb` / `main`  
> 业务权威语言：中文（zh-CN）

## 当前阶段

`PRODUCT_BASELINE_REBUILD / DOMAIN_RULE_RECONSTRUCTION / USER_REVIEW_GATE`

> **当前有效快照以本文件顶部、`NEXT_ACTION.md` 与 `PROJECT_STATE.json` 为准。下方按日期保留的旧“当前状态 / 下一步”属于历史审计轨迹，不代表现在仍停留在该节点。**

当前域：

> **PDM-11｜找车申请 / Demand 生命周期重建**

当前域状态：

> `IN_PROGRESS / HANDOFF_ACCEPTED / BATCH_1_APPROVED / BATCH_2_USER_REVIEW_PENDING`

当前工作文件：

> `07_重建工作区/PDM-11_找车申请Demand生命周期_规则原子重建_工作版.md`

当前已纠正：

- P10-B2-10 原“禁止内部价独立 permission”分类已回开失效；
- P10-A15 已撤回 Batch 3 并转 Batch 4；
- P10-B4-01 已按用户裁决确认：内部价 / 底价查看采用后台可配置独立 permission；
- PDM-02 已在 Legacy Final Integrity Audit 中同步 PDM-10 当前内部价/调价语义，并补齐权限撤销、交接、System Admin 治理等细节；
- 新增全局 Step 5A / Batch 2、3 反向冲突硬门禁。

当前唯一下一步：

> **PDM-11 Batch 1 的 P11-A01～P11-A13 已由用户全部确认；当前唯一下一步：用户审查 Batch 2 的 P11-B2-01～P11-B2-10。未经用户确认不得进入 Batch 3。IA / Low-Fi 仍统一延后到 PDM-25 完成并通过 PDM-01～25 全局最终总复核后集中对齐。**

## 2026-10-05｜PDM-11 Batch 1 全部确认

- 用户明确确认 `P11-A01～P11-A13` 全部同意；
- Batch 1 = `PASS / USER_APPROVED`；
- 未将 Customer 停用后续修改偷渡入 Batch 1，继续保留在 Batch 3；
- 未将 Application 激活时机 / 找车资格来源真实冲突偷渡入 Batch 1，继续保留在 Batch 4；
- 当前进入 Batch 2：`P11-B2-01～P11-B2-10 / USER_REVIEW_PENDING`。
## 2026-10-05｜PDM-11 启动与证据重建完成

- 已读取并承接 `HO-P01-P11-001`，状态从 `HANDOFF_OPEN` → `HANDOFF_ACCEPTED`；
- 已建立 PDM-11 Completed-PDM Dependency Card、术语表、Current Implementation Fact 卡；
- 已重新读取 9/06 SSOT / Decision、9/19 C2 / R10 / R12、IA V5、实际 Low-Fi、M03/M16/M17、已完成 PDM Final；
- 已形成 Batch 1 稳定一致候选 `P11-A01～P11-A13`；
- 已识别真实历史冲突：找车权益客户是否可直接激活 Demand vs 9/19 统一 pending 后由员工激活，暂挂 Batch 4，不静默选择；
- 已识别找车资格来源模型缺口，暂挂 Batch 4；
- Customer 轻量停用不终止既有 Demand 属于 PDM-01 后续明确知情修改，预挂 Batch 3；
- 当前状态：`BATCH_1_USER_REVIEW_PENDING`。
## 2026-10-05｜PDM-01～10 全局总复核完成

- `GLOBAL_PDM01_10_CROSS_PDM_AUDIT = PASS`；
- PDM-01～10 内部 handoff 无 OPEN / ACCEPTED 残留；
- CLOSED handoff 全部有目标 Authority 且 `source_backwrite=YES`；
- future PDM-11～25 保留 69 条合法 `HANDOFF_OPEN`；
- 全局 invariant：Customer / Employee / Vehicle 身份、owner、permission、System Admin、4S、listing_cycle、source facts、snapshot、sensitive access、Customer disable、formal-history delete 全部 PASS；
- 本轮仅修正两项控制性 stale：PDM-01～07 顶部状态元数据、PDM-01 §10 对 PDM-02 的过期“留后续”文字；
- 全局报告：`07_重建工作区/PDM-01至10_全局Cross-PDM_Handoff_GlobalInvariant总复核_2026-10-05.md`；
- PDM-11 启动门禁：`UNBLOCKED`；
- PDM-11 incoming：`HO-P01-P11-001`。
## 2026-10-05｜PDM-10 Legacy Final Integrity Audit 完成

- PDM-10 Integrity：`INTEGRITY_PASS`；
- 本轮关闭 5 组问题：Customer 停用价格权益真实闭环、DAILY_PRICE_QUOTA_EXHAUSTED→联系顾问、3A LIMITED/UNLIMITED 与临时额度、PDM-14/18/20/21/22/25 formal handoff、IA/Low-Fi stale carrier；
- 用户最终裁决 3A：UNLIMITED 时禁止新增临时查价次数；当天已有 today_temp_additions 保留，同日回 LIMITED 后继续有效；UNLIMITED 浏览不计 quota consumption；
- PDM-01～PDM-10 单域 Legacy Final Integrity Audit 至此全部 `INTEGRITY_PASS`；
- 审计报告：`07_重建工作区/PDM-10_历史最终版完整性复核_2026-10-05.md`；
- 当前进入：`GLOBAL_PDM01_10_CROSS_PDM_AUDIT`；
- PDM-11 继续 BLOCKED，直到全局总复核 PASS。
## 2026-10-05｜PDM-09 Legacy Final Integrity Audit 完成

- PDM-09 Integrity：`INTEGRITY_PASS`；
- 本轮关闭 5 组问题：P03-05 source_platform+upstream_publisher_id 与电话明文权限隔离、无有效号码不覆盖旧缓存、3A source_type 电话入口裁剪、PDM-21/22/23/25 future handoff、IA/Low-Fi/旧实现 stale carrier；
- 用户最终裁决 3A：上游电话只作为当前 wholesale/JYT 批发车源的日常敏感能力；批发→名邦或当前为 4S 后，车辆详情关闭查看/latest/拨打入口，但 publisher 来源事实、缓存、history、审计不删除；
- P09-A04-R1 / P09-A11-R1 的 Collector 取号→名邦 Integration API 回传架构保持不变；
- 审计报告：`07_重建工作区/PDM-09_历史最终版完整性复核_2026-10-05.md`；
- 当前进入：PDM-10 Legacy Final Integrity Audit；
- PDM-11 继续 BLOCKED。
## 2026-10-05｜PDM-08 Legacy Final Integrity Audit 完成

- PDM-08 Integrity：`INTEGRITY_PASS`；
- 本轮关闭 5 组问题：分享卡片动态价格 DENY、报告/H5旧 URL 权限重验、3A 资产化未闭环临时受控回源、PDM-20/21/22/25 future handoff、IMG-001～030 traceability 归一；
- 用户最终裁决 3A：转名邦后尚未成功资产化的图片，在任务未闭环期间可通过名邦受控 CDN 临时回源 JYT；成功后立即切自有对象存储，禁止长期依赖 JYT；
- 工作版早期 IMG mapping 降为 historical/superseded，以 2026-10-03 CDN 重映射为唯一 Current traceability；
- 审计报告：`07_重建工作区/PDM-08_历史最终版完整性复核_2026-10-05.md`；
- 当前进入：PDM-09 Legacy Final Integrity Audit；
- PDM-11 继续 BLOCKED。
## 2026-10-05｜PDM-07 Legacy Final Integrity Audit 完成

- PDM-07 Integrity：`INTEGRITY_PASS`；
- 本轮关闭 4 组问题：PDM-08 报告/档案资源 handoff closure、PDM-12/13/14/15/18/19 业务 handoff、PDM-20/21/22/25 页面/配置/审计 handoff、IA/Low-Fi stale carrier；
- PDM-08 已完成的出险图片、4S维保图片/H5、报告/档案与普通相册隔离、名邦可控报告域名等资源承载已反向写回 PDM-07；
- 历史整套结构化车况字段不恢复，继续执行 P07-B4-01 的来源事实 + 必要确定性标准化方案；
- 审计报告：`07_重建工作区/PDM-07_历史最终版完整性复核_2026-10-05.md`；
- 当前进入：PDM-08 Legacy Final Integrity Audit；
- PDM-11 继续 BLOCKED。
## 2026-10-05｜PDM-06 Legacy Final Integrity Audit 完成

- PDM-06 Integrity：`INTEGRITY_PASS`；
- 本轮关闭 6 组问题：草稿发布前 source_type 合法修改、PDM-07 档案 handoff closure、PDM-08 图片 handoff closure、PDM-10 价格 handoff closure、PDM-21/22/25 future handoff、IA/Low-Fi stale carrier；
- PDM-07/08/10 已完成承接均已反向写回 PDM-06；
- Cross-PDM Handoff Register 已登记 PDM-21/22/25 future handoff；
- 审计报告：`07_重建工作区/PDM-06_历史最终版完整性复核_2026-10-05.md`；
- 当前进入：PDM-07 Legacy Final Integrity Audit；
- PDM-11 继续 BLOCKED。
## 2026-10-05｜PDM-05 Legacy Final Integrity Audit 完成

- PDM-05 Integrity：`INTEGRITY_PASS`；
- 本轮关闭 7 组问题：PDM-06 stale handoff、mapping conflict 业务连续性、pending/conflict 明确提示、后台 Admin/System Admin 身份歧义、车型固定属性纠错 current/history 边界、future handoff register、IA/Low-Fi stale carrier；
- 用户最终裁决 4A：车型主数据/JYT mapping/MODEL_MISSING/conflict/merge 归 System Admin 控制平面治理，`vehicle.model.manage` 为治理 Guard；
- 用户最终裁决 5A：车型唯一确定的固定属性当前值跟随有效车型主档纠错，历史业务快照与 JYT source facts 不追改；
- PDM-02 / PDM-06 已完成跨域反向同步；
- Cross-PDM Handoff Register 已登记 PDM-12/20/21/22/25 future handoff；
- 审计报告：`07_重建工作区/PDM-05_历史最终版完整性复核_2026-10-05.md`；
- 当前进入：PDM-06 Legacy Final Integrity Audit；
- PDM-11 继续 BLOCKED。
## 2026-10-05｜PDM-04 Legacy Final Integrity Audit 完成

- PDM-04 Integrity：`INTEGRITY_PASS`；
- 本轮关闭 11 组问题：listing_cycle started_at、车辆时间概念分离、4S source_type 与成员权限、locked/trading 真实事实更新、PDM-08 图片 handoff、PDM-10 价格 handoff、PDM-05～10 stale handoff、car_code/电话隔离、JYT 三个固定业务 API、IA/Low-Fi stale carrier、Supply Anomaly 新业务 Guard；
- 用户最终裁决 Supply Anomaly=B：anomaly 只作为风险告警，不统一阻断新增业务；真实 offline / unavailable 才按不可售事实硬阻断；
- Cross-PDM Handoff Register 已同步：PDM-05～10 CLOSED；PDM-20 / PDM-22 / PDM-23 新 handoff 正式 OPEN；
- 审计报告：`07_重建工作区/PDM-04_历史最终版完整性复核_2026-10-05.md`；
- 当前进入：PDM-05 Legacy Final Integrity Audit；
- PDM-11 继续 BLOCKED。
## 2026-10-05｜Cross-PDM Handoff 双向闭环启用

- 已新增统一总账：`07_重建工作区/CROSS_PDM_HANDOFF_REGISTER.md`；
- 已把 PDM-01～PDM-10 已出现的 integrity 问题、已完成 handoff、仍开放 handoff 与 post-PDM25 stale carrier 持续回填到统一总账；
- 以后来源 PDM 只写“交后续”不算闭环；目标 PDM 完成后必须反向回写来源 Final / Integrity 报告 / Register / 状态文件；
- PDM-04 §20 已把 PDM-05～10 的旧“留后续”改为 `HANDOFF_CLOSED`；
- PDM-04 已通过 Integrity Audit；Supply Anomaly 采用用户裁决 B：anomaly 本身只告警、不统一阻断新增业务，真实 offline / unavailable 才硬阻断；
- IA / Low-Fi 仍不施工，只登记 stale carrier，继续遵守 PDM-25 后集中对齐规则。
## 2026-10-05｜PDM-03 Legacy Final Integrity Audit 完成

- PDM-03 Integrity：`INTEGRITY_PASS`；
- 本轮关闭 9 组问题：客户主动要求更换销售触发条件、普通 owner 移交 reason 非必填、inactive→active 复职边界、离职交接对象范围、Handover Batch 逐对象映射与部分失败、PDM-10 分享/查价 handoff closure、公司客户历史访问边界、Customer 停用对 owner 的影响、IA/Low-Fi stale carrier ledger；
- 用户确认：9 组问题全部同意；IA / Low-Fi 当前只登记 `STALE_CARRIER`，不修改承载文件；
- 审计报告：`07_重建工作区/PDM-03_历史最终版完整性复核_2026-10-05.md`；
- 当前进入：PDM-04 Legacy Final Integrity Audit；
- PDM-11 继续 BLOCKED。
## 2026-10-04｜PDM-02 Legacy Final Integrity Audit 完成

- PDM-02 Integrity：`INTEGRITY_PASS`；
- 本轮关闭 8 组问题：权限变化即时生效、inactive 恢复 accepting 默认 OFF、调店前交接、治理审计最小字段、接客/离职交接与 handover batch、System Admin 自身治理、System Admin 直接停用/恢复 Customer、已完成跨域 handoff 清理；
- 用户新增裁决：System Admin 可直接执行 Customer 账号停用 / 恢复，定义为控制平面治理动作；不因此获得销售 / CRM / owner / Lock / Transaction 等业务执行权；
- PDM-01 已同步 `PDM01-DEC-A16-R2`，保持 `INTEGRITY_PASS`；
- 审计报告：`07_重建工作区/PDM-02_历史最终版完整性复核_2026-10-04.md`；
- 当前进入：PDM-03 Legacy Final Integrity Audit；
- PDM-11 继续 BLOCKED。

## 2026-10-04｜IA / Low-Fi 集中对齐时点冻结

用户明确决定：不在 PDM-01～10 完成后单独对齐 IA / Low-Fi。

固定流程：

> PDM-01～10 Integrity Audit → 01～10 全局总复核 → PDM-11～25 → PDM-01～25 全局最终总复核 → IA 集中对齐 → Low-Fi 集中对齐 → Engineering。

PDM-01～25 期间发现的 IA / Low-Fi 错误统一登记 `STALE_CARRIER` 与正确 Authority，不直接修改 carrier。
## 2026-10-04｜PDM-01 Legacy Final Integrity Audit 完成

- PDM-01 Integrity：`INTEGRITY_PASS`；
- 本轮共关闭 6 组 reopen：显式登录页语义、手机号授权拒绝时找车表单临时保留、PDM-02 手机号维护 handoff、接客池异常为空、PDM-03 owner/分享 handoff、客户账号停用/恢复轻量后台控制；
- 客户账号停用最终口径：后台受控停用/恢复；停用后仍可进入网站/小程序并浏览公开内容，但暂停依赖 Customer 身份/权益的业务账号能力；不删除 customer_id / owner / 来源 / 历史；若只需降权使用客户等级调整；
- IA / Low-Fi 中旧“首次无 owner / SOURCE_ONLY / Customer Merge”等只登记为 stale carrier，本轮不修改；
- 审计报告：`07_重建工作区/PDM-01_历史最终版完整性复核_2026-10-04.md`；
- 当前进入：PDM-02 Legacy Final Integrity Audit；
- PDM-11 继续 BLOCKED。

## 已完成

- 六类证据完整导入并校验；
- 产品全域覆盖地图完整性校验 PASS；
- 25 个一级产品域冻结为重建覆盖骨架；
- IA V5 25 个 Canonical Object 均有 PDM 落点；
- 001～078 的 224/224 单元均可挂载；
- PDM-01：`COMPLETE`；
- PDM-02：`COMPLETE`；
- PDM-03：`COMPLETE`；
- PDM-04：`COMPLETE`，正式规则文件为 `07_重建工作区/PDM-04_最终完整规则.md`；
- PDM-05：`COMPLETE`，正式规则文件为 `07_重建工作区/PDM-05_最终完整规则.md`；
- PDM-06：`COMPLETE`，正式规则文件为 `07_重建工作区/PDM-06_最终完整规则.md`；
- PDM-07：`COMPLETE`，正式规则文件为 `07_重建工作区/PDM-07_最终完整规则.md`；
- PDM-08：`COMPLETE`，正式规则文件为 `07_重建工作区/PDM-08_最终完整规则.md`；
- PDM-09：`COMPLETE`，正式规则文件为 `07_重建工作区/PDM-09_最终完整规则.md`；
- PDM-10：`COMPLETE`，正式规则文件为 `07_重建工作区/PDM-10_最终完整规则.md`；
- 已新增并启用《用户全量审查四批门禁规范》。

## 2026-10-04｜PDM-01～PDM-10 Legacy Final Integrity Audit 前置阶段

用户明确要求：PDM-10 完成后先不要进入 PDM-11，先用 2026-10-04 新的信息保真 / 一次性收口标准重新复核 PDM-01～PDM-10。

本轮不是只做“细检”，必须同时：

- 重新查整条业务规则遗漏；
- 检查现有 Final 是否压掉条件、例外、权限、生命周期、历史等细节；
- 检查 PDM-01～10 之间的冲突、静默覆盖、handoff 丢失与 stale rule。

已新增方法门禁：

> `00_先读/01_产品基线重建执行规范_冻结工作版.md` §3.3 Legacy Final Integrity Audit Gate

总控工作单：

> `07_重建工作区/PDM-01至10_全域完整性复核_总控工作单.md`

执行顺序：PDM-01 → ... → PDM-10 → 01～10 全局 Cross-PDM / Handoff / Global Invariant 总复核 → PASS 后才允许 PDM-11。

原 PDM-01～10 `COMPLETE` 保留为历史裁决完成状态；在本轮 Integrity Audit PASS 前，不声称旧 Final 已满足当前新完整性标准。

---
## 2026-10-04｜PDM-10 最终完成

用户最终批准 PDM-10《价格 / 查价 / 客户展示价覆盖》完整规则，并明确“确定执行”写入仓库。

- PDM-10 状态：`COMPLETE`；
- 正式规则：`07_重建工作区/PDM-10_最终完整规则.md`；
- 完整性检查卡：`07_重建工作区/PDM-10_信息保真与一次性收口检查卡_2026-10-04.md`；
- Coverage 报告：`07_重建工作区/PDM-10_全量DecisionCoverage未映射检查报告_2026-10-04.md`；
- M11-001～M11-017：17/17 有明确去向；
- SOURCE_DECISION_COVERAGE = 100%；
- UNMAPPED = 0；
- FINAL_TO_SOURCE_TRACEABILITY = 100%；
- CROSS_PDM_CONFLICT = 0；
- SEMANTIC_INTEGRITY = PASS；
- USER_FINAL_APPROVED = YES；
- IMPLEMENTATION_READY = PASS；
- PDM-02 / PDM-06 的旧独立调价语义已显式 supersede 并同步加注；
- PDM-20/21/22/25 等后续 carrier handoff 已登记完整 Guard，不修改 IA / Low-Fi / Engineering。

当前允许进入 PDM-11 准备，但不得跳过新方法的依赖卡和证据刷新。

---
## 2026-10-04｜信息保真 / 一次性收口方法升级

用户明确要求停止“越写越丢、后续 PDM 再反复重建”的循环。本轮已把防丢失要求升级为全局硬门禁：

- Memory Zero-Trust：模型记忆 / 聊天上下文只能作为检索线索，不能代替当前 GitHub 证据；
- Current Authority Refresh：重要判断前重新读取当前状态、Decision、相关已完成 PDM Final；
- PDM Scope ≠ Evidence Scope：业务域不限制证据读取范围；
- Completed-PDM Dependency Card：任何新 PDM 在 Batch 1 前必须建立跨 PDM 依赖卡；
- Global Invariant Gate：identity / permission / data scope / owner / vehicle_id / listing_cycle / hard DENY / audit 等跨域不变量必须显式检查；
- Terminology / Field Normalization：中文词、技术字段、历史别名统一后再检索；
- No Summary-on-Summary：禁止摘要继续摘要成为唯一证据；
- Bidirectional Traceability：Source→Final 与 Final→Source 双向追溯；
- Negative Claim Proof：所有“没有 / 已废弃 / 不存在 / 不需要”必须多路证明；
- Conflict Before Classification：完整证据扫完后才能分 Batch；
- Deferred Handoff Closure：跨域移交必须有目标、有完整语义、有接收状态；
- Change Impact Analysis：reopen / supersession / 新裁决必须立即检查受影响 PDM、Decision、IA/Low-Fi/Engineering；
- Semantic Completeness Matrix：权限、scope、hard DENY、生命周期、异常、并发、历史等适用维度不得静默省略；
- Final Semantic Integrity + Implementation-Ready Gate：`UNMAPPED=0` 不再足以标记 COMPLETE，最终文件必须可直接承接后续施工。

强制执行模板：

> `07_重建工作区/PDM_信息保真与一次性收口检查模板.md`

该模板是执行留痕，不是新的业务 Authority。

---

## 新增硬门禁

从现在开始：

> **任何规则原子都必须经过用户本人审查，不能因模型判断为稳定一致、明确废弃、已知情修改等而自动进入最终产品基线。**

每个 PDM 固定：

1. Batch 1｜稳定一致项；
2. Batch 2｜明确废弃 / 明确替代；
3. Batch 3｜明确知情修改 / 后续明确新增；
4. Batch 4｜冲突 / 历史遗漏 / 证据缺口 / 新选择；
5. 四批结束后再做一次 PDM 完整最终总览。

每批都必须停下来等用户确认。

## 当前 PDM-05

已按当前 GitHub 原始证据完成 PDM-05 Batch 1 稳定一致项筛选，共形成：

> **P05-A01～P05-A09**

工作版：

> `07_重建工作区/PDM-05_车型主数据年款JYT车型映射MODEL_MISSING_规则原子重建_工作版.md`

Batch 1 当前状态：

> `USER_REVIEW_PENDING`

本批只纳入前史、R3、9/19 与后续承载之间未发现真实业务反转的稳定一致项。JYT 未映射时精确事实使用边界、VR-P-010 与本地映射关系、MODEL_MISSING 原地新建车型 Action 冲突、重复车型合并等遗漏、明确废弃机制等均已留到后续批次，不在 Batch 1 偷偷收口。

## 2026-09-24｜PDM-05 车型 ID 映射口径修正

用户明确确认：

- 车型身份以 JYT `model_id` 为上游身份键；
- 通过 source mapping 映射到本地 `vehicle_model_id`；
- 两边 ID 数值不要求相同；
- 车型名称仅用于展示 / 快照 / 搜索 / Admin 辅助判断，不作为身份主键；
- 品牌 / 车系是否与 JYT 共用相同 ID 值，当前不作假定；
- P05-A03 / A05 / A06 涉及的映射确认、修正、冲突处理统一由后台 Admin 处理。

当前 Batch 1 已确认：P05-A03、P05-A05、P05-A06。
仍待审：P05-A01、P05-A02、P05-A04、P05-A07、P05-A08、P05-A09。

## 2026-09-24｜PDM-05 Batch 1 完成并进入 Batch 2

P05-A01～P05-A09 已全部用户确认。

其中：

- P05-A03 已修正为 JYT `model_id` → 本地 `vehicle_model_id` 的 ID-based source mapping；
- P05-A07 当前实际管理主体收口为后台 Admin，普通销售不得处理车型主数据/映射/冲突；
- Batch 1 状态：`COMPLETE_USER_CONFIRMED`。

当前进入：

> `PDM-05 / BATCH_2_DEPRECATED_SUPERSEDED_DO_NOT_RESTORE / USER_REVIEW_PENDING`

Batch 2 待审：P05-B2-01～P05-B2-05。

## 2026-09-24｜PDM-05 Batch 2 完成并进入 Batch 3

P05-B2-01～P05-B2-05 已全部用户确认，Batch 2 状态：

> `COMPLETE_USER_CONFIRMED`

当前进入：

> `PDM-05 / BATCH_3_INFORMED_CHANGES_AND_EXPLICIT_ADDITIONS / USER_REVIEW_PENDING`

当前唯一待审：P05-A10。

## 2026-09-24｜PDM-05 Batch 3 完成并进入 Batch 4

用户确认：

- P05-A10：本地车型映射未完成，不阻塞 JYT 已明确车型事实用于正常业务；
- P05-A11：只要 JYT 已明确品牌、车系、年款、具体车型/款式等足够事实，即使 `vehicle_model_id` 尚未映射，也可参加精确搜索、筛选和自动 Matching。

因此“本地车型归属”和“车辆自身车型事实”正式分层。

当前进入：

> `PDM-05 / BATCH_4_CONFLICTS_OMISSIONS_GAPS_NEW_CHOICES / USER_REVIEW_PENDING`

Batch 4 待审：P05-B4-01、P05-B4-02。

## 2026-09-24｜PDM-05 Batch 4 完成并生成最终总览

用户完成 Batch 4 裁决：

- P05-B4-01：后台 Admin 可直接新增缺失品牌 / 车系 / 具体车型并完成绑定；若来源于 JYT 采集车型，应在本次处理或紧接后的同一后台流程中尽快同步建立 `JYT model_id → local vehicle_model_id` source mapping，避免长期悬空；
- P05-B4-02：后台 Admin 可修正车型层级、合并重复车型、迁移车辆引用与 JYT mapping；真实旧车型长期保留。

至此 PDM-05 四批用户审查全部完成。

已生成：

> `07_重建工作区/PDM-05_最终完整规则总览_待用户批准.md`

当前状态：

> `FINAL_REVIEW_PENDING`

未经用户最终批准，不得将 PDM-05 标记 COMPLETE，不得进入 PDM-06。

## 2026-09-24｜PDM-05 最终完成

用户最终明确批准 PDM-05《最终完整规则总览》。

- PDM-05 状态：`COMPLETE`；
- 正式规则文件：`07_重建工作区/PDM-05_最终完整规则.md`；
- Decision Register 已登记 `PDM05-GATE-FINAL`；
- 后续 PDM 不得静默改写 PDM-05，发现真实跨域冲突必须显式提交用户裁决。

当前进入：

> **PDM-06｜人工车辆发布 / 草稿 / VIN / 删除边界**

## 2026-09-24｜PDM-06 Batch 1 已形成

已严格按 GitHub 当前原始证据完成 PDM-06 稳定一致项筛选，共形成：

> **P06-A01～P06-A11**

工作版：

> `07_重建工作区/PDM-06_人工车辆发布草稿VIN删除边界_规则原子重建_工作版.md`

本批只纳入没有发现真实业务反转的规则，包括人工来源边界、草稿/正式车分层、最低发布字段、0 图发布、价格可空、VIN 非必填、正式发布校验、删除边界与授权编辑。

多草稿 vs DRAFT_RESUME、VIN 精确重复 Gate、已发布车辆“保存修改”正式生效、source_type 新建交互等已留后续批次，不在 Batch 1 偷偷收口。

## 2026-09-24｜PDM-06 Batch 1 完成并进入 Batch 2

用户确认 P06-A01～P06-A11 全部通过；P06-A12 多草稿管理已提前确认。

Batch 1 状态：

> `COMPLETE_USER_CONFIRMED`

当前进入：

> `PDM-06 / BATCH_2_DEPRECATED_SUPERSEDED_DO_NOT_RESTORE / USER_REVIEW_PENDING`

Batch 2 待审：P06-B2-01～P06-B2-08。

## 2026-09-24｜PDM-06 Batch 2、3 完成并进入 Batch 4

用户确认 P06-B2-01～P06-B2-08 全部通过。

Batch 3 经 GitHub 证据复核没有新的未审原子：
- P06-A12 多草稿规则已由用户本轮明确确认；
- source_type 发布后可修改规则已在 PDM-04 正式批准并由 PDM-06 继承。

当前进入：

> `PDM-06 / BATCH_4_CONFLICTS_OMISSIONS_GAPS_NEW_CHOICES / USER_REVIEW_PENDING`

待审：P06-B4-01～P06-B4-05。

## 2026-09-24｜PDM-06 Batch 4 完成并生成最终总览

用户确认 P06-B4-01～P06-B4-05 全部通过。

至此 PDM-06 Batch 1～4 全部完成。

已生成：

> `07_重建工作区/PDM-06_最终完整规则总览_待用户批准.md`

当前状态：

> `FINAL_REVIEW_PENDING`

未经用户最终批准，不得将 PDM-06 标记 COMPLETE，不得进入 PDM-07。

## 2026-09-24｜PDM-06 最终完成

用户最终明确批准 PDM-06《最终完整规则总览》。

- PDM-06 状态：`COMPLETE`；
- 正式规则文件：`07_重建工作区/PDM-06_最终完整规则.md`；
- Decision Register 已登记 `PDM06-GATE-FINAL`；
- 当前进入 PDM-07。

## 2026-09-24｜PDM-07 Batch 1 已形成

已基于 R9 / R10 / R11 / R12、CN11、IA V5 与 001～078 M10 形成稳定一致项：

> **P07-A01～P07-A11**

工作版：

> `07_重建工作区/PDM-07_车辆档案车况客户可见报告成交交付材料核验_规则原子重建_工作版.md`

结构化车况孤儿规则、档案维护 Action、客户可见性设置动作、交付材料配置机制等留后续批次。

## 2026-09-24｜PDM-07 Batch 1 完成并进入 Batch 2

用户确认 P07-A01～P07-A11 全部通过。

Batch 1 状态：

> `COMPLETE_USER_CONFIRMED`

当前进入：

> `PDM-07 / BATCH_2_DEPRECATED_SUPERSEDED_DO_NOT_RESTORE / USER_REVIEW_PENDING`

待审：P07-B2-01～P07-B2-04。

## 2026-09-24｜PDM-07 Batch 2、3 完成并进入 Batch 4

用户确认 P07-B2-01～P07-B2-04 全部通过。

Batch 3 经当前 GitHub 证据复核无新的未审原子，已关闭。

当前进入：

> `PDM-07 / BATCH_4_CONFLICTS_OMISSIONS_GAPS_NEW_CHOICES / USER_REVIEW_PENDING`

待审：P07-B4-01～P07-B4-05。

## 2026-09-24｜PDM-07 Batch 4 完成并生成最终总览

用户确认 P07-B4-01～P07-B4-05 全部通过。

其中 P07-B4-01 已按 JYT 原始车况描述 + JYT `sub.tags` 的真实链路收窄：
- 不重复人工录入批发车车况；
- 标签保留来源 provenance；
- 标签/描述既可展示，也可作为确定性 Matching 输入；
- 只做必要标准化，unknown 不猜。

至此 PDM-07 Batch 1～4 全部完成。

已生成：

> `07_重建工作区/PDM-07_最终完整规则总览_待用户批准.md`

当前状态：

> `FINAL_REVIEW_PENDING`

未经用户最终批准，不得将 PDM-07 标记 COMPLETE，不得进入 PDM-08。

## 2026-09-25｜PDM-07 最终完成并进入 PDM-08

用户最终批准 PDM-07《最终完整规则总览》。

- PDM-07 状态：`COMPLETE`；
- 正式规则：`07_重建工作区/PDM-07_最终完整规则.md`；
- Decision Register 已登记 `PDM07-GATE-FINAL`；
- PDM-08 Batch 1 已形成：P08-A01～P08-A12。

## 2026-09-25｜PDM-01～07 反向覆盖校验

已完成正式反向覆盖校验。

报告：

> `07_重建工作区/PDM-01至07_反向覆盖校验报告_2026-09-25.md`

结果：
- PDM-01：PASS
- PDM-02：PASS
- PDM-03：PASS
- PDM-04：FAIL
- PDM-05：PASS_WITH_HANDOFF_GAP
- PDM-06：FAIL
- PDM-07：PASS

当前发现 5 个补漏项，尚未达到 `UNMAPPED=0`。

PDM-08 临时暂停，先完成反向覆盖补漏 Gate。

## 当前唯一下一步

> **审查 PDM-01～PDM-07 反向覆盖校验发现的 5 个补漏项，然后停止等待用户确认。**

## 当前禁止事项

- 不自动批准 PDM-06 Batch 1；
- 未经用户确认不得进入 PDM-06 Batch 2；
- 不得跳过任何 PDM-06 用户审查批次；
- 不得在 PDM-06 最终总览批准前进入 PDM-07；
- 不得静默改写 PDM-01～PDM-05 已确认规则；
- 不使用旧聊天记忆替代仓库证据；
- 不修改 IA / Low-Fi；
- 不执行 Engineering Delta。

## 当前产品基线状态

`NOT_READY`

## 2026-09-24｜R3/R4/R5 原件补回

已新增恢复证据目录：

> `01_证据_A_9月19日产品业务锚点/补回原始证据_2026-09-24/`

当前已补回 R3、R4、R5 原始业务重审最终总结；R2 已校正为“当时没有独立分支最终原件”，不再误判为缺失。

PDM-01 的 R5 证据重基准已完成：

- Batch 1 / Batch 2 已确认项共 20 条；
- 唯一真实冲突组 `P01-A04 + P01-B2-01` 已由用户裁决继续 A04，并登记为主动新修改；
- 其余 18 条已确认项无真实冲突；
- A12 / A13 / A16 的原始证据强度或边界得到补全，但仍须按四批门禁接受用户审查；
- R3 对 PDM-01 无直接身份规则；R4 仅有价格/查价与客户身份的交叉边界，不改写 PDM-01 身份规则。


## 2026-09-24｜CN11 精选业务原始证据补回

已新增：

> `01_证据_A_9月19日产品业务锚点/前置历史原始证据_2026-09-17_CN11/`

本次仅提取 21 份产品/业务高价值 Markdown 原件，未导入 DB/SQL、OpenAPI、代码、Starter、测试、SVG、CSV 等工程文件。

使用边界：

- CN11 是 9/19 之前的历史原始证据，不是当前最终 Authority；
- 001～078 继续作为历史问题雷达；
- 以后涉及 CN11 的规则原子，应优先回 CN11 原件核验，再与 9/19、9/22/后续证据比较；
- 不因补回 CN11 自动推翻已经过用户审查的规则；发现真实冲突必须显式交用户裁决。

PDM-01 当前已完成 Batch 1～4，状态为 `FINAL_REVIEW_PENDING`。
## 2026-09-24｜Customer Merge 主动取消

用户明确决定 V1 不建设 Customer Merge：不同微信身份对应的不同 `customer_id` 始终保持独立，即使现实中确认属于同一自然人也不做自动/人工 Merge。一个手机号允许登记在多个 Customer；手机号搜索可返回多个命中，但不触发合并。该裁决主动覆盖此前 A09 / A10 / B2-02，并使 A11 / A12 关闭为 N/A。


## 2026-09-24｜PDM-01 Batch 4 完成

用户已确认 A13 与 A16。A13 明确“手机号是可变联系方式，换手机号不是换 Customer”，与 A14 多手机号管理规则统一；A16 采用客户停用/恢复 V1 最小闭环。至此 Batch 4 全部完成，PDM-01 四批用户审查结束，进入 `FINAL_REVIEW_PENDING`。下一步仅生成最终完整规则总览，未经用户最终批准不得进入 PDM-02。


## 2026-09-24｜PDM-01 最终完成

用户已明确批准 PDM-01《最终完整规则总览》。

- PDM-01 状态：`COMPLETE`
- 正式规则文件：`07_重建工作区/PDM-01_最终完整规则.md`
- 最终候选文件保留作为审计轨迹；
- PDM-01 后续不得被其他 PDM 静默改写；若发现真实跨域冲突，必须重新显式提交用户裁决。

当前进入：

> **PDM-02｜员工身份 / 组织 / 角色 / 权限 / 数据范围 / System Admin / 4S 身份**


## 2026-09-24｜PDM-02 Batch 1 完成

用户明确确认 P02-A01～P02-A15 全部同意。Batch 1 状态：`COMPLETE_USER_CONFIRMED`。下一步准备 Batch 2，未经用户审查不得自动批准。


## 2026-09-24｜PDM-02 Batch 2 完成

用户明确确认 Batch 2 剩余 12 条全部同意。最终结果：B2-02 撤回并由 P02-A16 反转替代；B2-04 已确认；B2-01、B2-03、B2-05～B2-14 全部确认。Batch 2 状态：`COMPLETE_USER_CONFIRMED`。下一步准备 Batch 3，未经用户审查不得自动批准。


## 2026-09-24｜PDM-02 Batch 3 完成

用户确认 P02-A18：一个 4S 成员账号直接代表一家合作 4S 店/合作主体；不建设 4S 店组织层级，不使用 cooperation scope。4S 账号新增、启用、停用、基础资料及允许范围内业务 permission 配置由名邦后台具备相应管理权限的 active 内部管理人员统一处理；4S hard DENY 不得绕过。至此 A16/A17/A18 全部确认，Batch 3 状态：`COMPLETE_USER_CONFIRMED`。


## 2026-09-24｜System Admin 控制平面模型修正

用户明确修正此前过度限制：System Admin 与员工业务身份继续分离，但其角色应是系统治理/控制平面，而不是“不能管理业务权限”。新增 P02-A19：System Admin 可治理员工与4S账号、角色、permission、data scope、角色模板、接客配置等，但 System Admin 身份本身不获得员工业务执行权；同一真人要亲自做业务必须使用独立员工身份；hard DENY 不可绕过。该规则部分修正 A17/A18，并将 B4-02“店长由谁任命”关闭为由 System Admin 配置。


## 2026-09-24｜PDM-02 Batch 4 完成

用户明确“其他的都同意”，确认 B4-01、B4-03、B4-04、B4-05、B4-06；B4-02 已由 P02-A19 提前关闭。至此 Batch 4 六项全部完成，状态：`COMPLETE_USER_CONFIRMED`。

已生成最终候选：

> `07_重建工作区/PDM-02_最终完整规则总览_待用户批准.md`

当前进入 `FINAL_REVIEW_PENDING`，未经用户最终批准不得将 PDM-02 标记 COMPLETE，也不得进入 PDM-03。


## 2026-09-24｜PDM-02 最终完成

用户最终确认 PDM-02《最终完整规则总览》无其他问题，并特别确认：普通销售、经理、店长都可以接待客户；经理和店长满足 active + eligible + accepting 时可进入接客池并成为 Customer owner；4S 成员与 System Admin 不进入接客池。

- PDM-02 状态：`COMPLETE`
- 正式规则文件：`07_重建工作区/PDM-02_最终完整规则.md`
- 最终候选文件保留作为审计轨迹；
- 后续 PDM 不得静默改写 PDM-02，发现真实跨域冲突必须显式交用户裁决。

当前进入：

> **PDM-03｜Owner / 来源归因 / 分享注册 / 转介绍 / 接客 / 离职交接**


## 2026-09-24｜PDM-03 Batch 1 已形成

已严格按 GitHub 当前原始证据完成 PDM-03 稳定一致项筛选，共形成 P03-A01～P03-A13 十三条候选规则。自然注册立即分配 owner、普通客户车辆转发 SOURCE_ONLY、接客池异常为空 owner_assignment_pending 等后续主动修改明确留到后续批次，不伪装成历史稳定项。当前状态：`USER_REVIEW_BATCH_1_PENDING`。


## 2026-09-24｜PDM-03 Batch 1 完成

用户明确“没问题，进行下一步”，确认 P03-A01～P03-A13 十三条稳定一致项全部通过。Batch 1 状态：`COMPLETE_USER_CONFIRMED`。

随后完成 Batch 2 筛选，共形成 P03-B2-01～P03-B2-09 九条明确废弃 / 替代 / DO_NOT_RESTORE 候选项，当前等待用户审查。


## 2026-09-24｜PDM-03 Batch 2 完成

用户明确“全部确认”，确认 P03-B2-01～P03-B2-09 九条明确废弃 / 替代 / DO_NOT_RESTORE 全部通过。Batch 2 状态：`COMPLETE_USER_CONFIRMED`。

随后完成 Batch 3 筛选，共形成三条待审：P03-A14 自然注册立即形成 owner、P03-A15 普通客户车辆转发 SOURCE_ONLY 与直接转介绍分离、P03-A16 接客池异常为空 owner_assignment_pending。


## 2026-09-24｜PDM-03 A15 客户分享归属规则反转

用户明确修正此前“普通客户车辆转发仅 SOURCE_ONLY”的方案：客户车源分享本身可以作为转介绍/获客归属链。对尚无正式 owner 的新客户 B，A 分享车源链接给 B，B 通过该链接进入后，按分享链实际绑定的销售建立 current owner，同时保留 A→B 的来源/推荐关系。A 转发张三链接则 B 归张三；转发李四链接则 B 归李四；A 使用自己的客户分享链接时，也保留 A 为来源客户/间接推荐人，并按该分享链对应销售归属 B。已有正式 owner 的老客户仍不得被分享链接抢走。

该裁决显式覆盖 P01-A04 中“普通客户侧车辆转发仅 SOURCE_ONLY、不据此分配 owner”的子句；P01-A04 其余自然注册/直接转介绍规则继续有效。

尚未裁决：A 发出链接后、B 打开前若 A 的 current owner 发生变化，旧链接的销售绑定时点。该项留 PDM-03 Batch 4。


## 2026-09-24｜PDM-03 Batch 3 完成

用户明确“十四十六都同意”，确认 P03-A14 与 P03-A16；P03-A15 已在前一轮按“客户分享即转介绍/获客归属链”主动修正并确认。至此 Batch 3 三项全部完成，状态：`COMPLETE_USER_CONFIRMED`。

随后完成 Batch 4 缺口扫描，共形成 P03-B4-01～P03-B4-04 四条待审项，重点关闭客户分享链销售绑定时点、A→B 关系留存、失效销售兜底、分享归属与自然轮询的并发顺序。


## 2026-09-24｜PDM-03 Batch 4 完成

用户明确“这个问题同意”，确认 P03-B4-01～P03-B4-04 四条冲突 / 缺口 / 新选择全部通过。至此 PDM-03 四批门禁全部完成。

已生成最终候选：

> `07_重建工作区/PDM-03_最终完整规则总览_待用户批准.md`

当前进入 `FINAL_REVIEW_PENDING`，未经用户最终批准不得将 PDM-03 标记 COMPLETE，也不得进入 PDM-04。


## 2026-09-24｜PDM-03 最终完成

用户最终明确批准 PDM-03《最终完整规则总览》。

- PDM-03 状态：`COMPLETE`
- 正式规则文件：`07_重建工作区/PDM-03_最终完整规则.md`
- 最终候选文件保留作为审计轨迹；
- 后续 PDM 不得静默改写 PDM-03，发现真实跨域冲突必须显式提交用户裁决。

当前进入：

> **PDM-04｜三类车源 / JYT 同步 / 车辆身份 / Listing Cycle / 隐藏 / 下架 / 重上架 / 一键转名邦**


## 2026-09-24｜PDM-04 Batch 1 已形成

已严格按 GitHub 当前原始证据完成 PDM-04 稳定一致项筛选，共形成 P04-A01～P04-A14 十四条候选规则。

明确未混入本批的后续变化/冲突包括：人工名邦/4S source_type 双向修改、采集批发车自动隐藏、一键转名邦后的新名邦展示状态、一键转名邦具体 permission，以及图片/价格等跨域细节。

当前状态：`USER_REVIEW_BATCH_1_PENDING`。


## 2026-09-24｜PDM-04 Batch 1 完成

用户明确“全部都同意”，确认 P04-A01～P04-A14 十四条稳定一致项全部通过。Batch 1 状态：`COMPLETE_USER_CONFIRMED`。

随后完成 Batch 2 筛选，共形成 P04-B2-01～P04-B2-13 十三条明确废弃 / 替代 / DO_NOT_RESTORE 候选项，当前等待用户审查。


## 2026-09-24｜PDM-04 Batch 2 完成与转名邦模型反转

用户确认 Batch 2 其余项均无争议，并主动反转 B2-05：一键转名邦不再创建第二个 vehicle，而是在同一 vehicle_id 上完成批发→名邦来源转换；永久保留 JYT car_code / 来源历史，并阻止后续 JYT 同 car_code 重新生成批发在售。B2-06/B2-07 已按该模型同步修正。用户同时确认 locked 批发车可直接转名邦，Lock 保持绑定同一 vehicle_id。


## 2026-09-24｜PDM-04 Batch 3 已形成

P04-A15/A16 已由用户提前确认；新增四条待审：A17 source_type 名邦↔4S 后续修改、A18 采集批发自动隐藏、A19 转名邦后不走草稿二次发布、A20 一键转名邦不设额外独立 permission。listing_cycle、pre-conversion hidden、trading/completed 与 car_code 被上游复用冲突留 Batch 4。


## 2026-09-24｜PDM-04 Batch 3 完成

用户明确确认 A17～A20，其中 A18 按“每条自动隐藏规则独立；规则之间 OR；单条规则内不同字段 AND、同字段多个值 OR”的补充口径落版。加上此前已确认的 A15/A16，Batch 3 六项全部完成。

随后形成 Batch 4 五条待审：listing_cycle、hidden 原因继承、trading/completed 转换、car_code 复用冲突、conversion 单向性。


## 2026-09-24｜PDM-04 A18 适用车源范围扩展与 B4-02 完成

用户补充确认：自动/批量隐藏规则增加显式 `source_scope`，可多选批发、名邦、4S，至少选择一类；未选择不得生效，不默认影响三类全部车源。原“采集批发自动隐藏”继续作为 `source_scope=批发` 的一种配置。

车辆来源变化后，自动隐藏规则按新的 `source_type` 与各规则 `source_scope` 重新计算。由此 P04-B4-02 已正式关闭：仅适用于批发的自动隐藏原因在批发→名邦后失效；scope 含名邦且条件仍命中的规则继续 hidden；人工 hidden 与其他有效 hidden 原因继续保留。

当前 Batch 4 剩余待审：P04-B4-01、P04-B4-03、P04-B4-04、P04-B4-05。


## 2026-09-24｜PDM-04 Batch 4 完成与最终总览生成

用户最终完成 Batch 4 裁决：

- P04-B4-01：同 vehicle 批发→名邦继续当前 listing_cycle，不新建 cycle；
- P04-B4-02：此前已确认，按 source_type + source_scope 重算自动 hidden，人工 hidden 保留；
- P04-B4-03：locked / trading 允许同 vehicle 转名邦，completed 禁止；
- P04-B4-04：若已转名邦历史 car_code 后续出现明显不同实体身份，系统自动屏蔽/抑制该冲突上游记录，不进入人工决断，不创建新的可售批发 vehicle；
- P04-B4-05：批发→名邦为单向经营转换，不提供转回批发。

至此 PDM-04 四批用户审查全部完成。

已生成：

> `07_重建工作区/PDM-04_最终完整规则总览_待用户批准.md`

当前状态：`FINAL_REVIEW_PENDING`。未经用户最终批准，不得将 PDM-04 标记 COMPLETE，不得进入 PDM-05。


## 2026-09-24｜PDM-04 最终完成

用户最终明确批准 PDM-04《最终完整规则总览》。

- PDM-04 状态：`COMPLETE`；
- 正式规则文件：`07_重建工作区/PDM-04_最终完整规则.md`；
- Decision Register 已登记 `PDM04-GATE-FINAL`；
- 后续 PDM 不得静默改写 PDM-04，发现真实跨域冲突必须显式提交用户裁决。

当前进入：

> **PDM-05｜车型主数据 / 年款 / JYT 车型映射 / MODEL_MISSING**


## 2026-09-24｜PDM-05 Batch 1 已形成

已严格按 GitHub 当前证据完成 PDM-05 稳定一致项筛选，形成 P05-A01～P05-A09 九条候选规则。存在知情修改、废弃项、IA Action Contract 冲突及历史细节遗漏的内容均未混入本批。

当前状态：`USER_REVIEW_BATCH_1_PENDING`。未经用户审查不得自动批准或进入 Batch 2。


## 2026-10-04｜PDM-08 最终完成

用户最终明确批准 PDM-08《最终完整规则总览》。

- PDM-08 状态：`COMPLETE`；
- 正式规则文件：`07_重建工作区/PDM-08_最终完整规则.md`；
- IMG-001～IMG-030：30/30 已有明确去向；
- `SOURCE_DECISION_COVERAGE = 100%`；
- `UNMAPPED = 0`；
- Decision Register 已登记 `PDM08-GATE-FINAL`；
- 后续 PDM 不得静默改写 PDM-08，发现真实跨域冲突必须显式提交用户裁决。

当前进入：

> **PDM-09｜上游发布人电话 / publisher_id / 电话获取与缓存边界**


## 2026-10-04｜PDM-09 Batch 1 完成并进入 Batch 2

已严格按 GitHub 当前证据重新完成 PDM-09 Batch 1 审查，用户明确“全部同意”：

> **P09-A01～P09-A11，共 11 条。**

工作版：

> `07_重建工作区/PDM-09_上游发布人电话Collector缓存获取最新敏感能力_规则原子重建_工作版.md`

Batch 1 状态：

> `COMPLETE_USER_CONFIRMED`

本批正式确认的核心边界包括：

- 电话按 `source_platform + upstream_publisher_id` 归属与缓存；
- 客户端 / 客户安全视图禁止展示上游电话；
- 电话为独立敏感能力；
- 唯一上游链为 Mingbang Backend → Collector → JYT；
- 有缓存时普通查看 / 拨打 cache-first，不重复请求上游；
- “获取最新电话”强制刷新，失败不覆盖旧缓存；
- phone history 只做历史 / 审计；
- 同 publisher latest single-flight，不同 publisher 可并发；
- 拨打只调系统拨号器，不新增独立 call permission；
- 电话敏感行为必须审计；
- 名邦 P03 只管理 Collector 连接，不管理 JYT 电话凭证 / Header / callCode。

当前进入：

> `PDM-09 / BATCH_2_DEPRECATED_SUPERSEDED_DO_NOT_RESTORE / USER_REVIEW_PENDING`

未经用户确认不得自动进入 Batch 3。


## 2026-10-04｜PDM-09 Batch 2 已形成

经 CR-007、电话旧契约清理报告、R11/R12、Decision Register 与 001～078 复核，当前明确废弃 / 替代项共 3 组：

> **P09-B2-01～P09-B2-03**

分别为：

1. 禁止恢复 `car_code` / Vehicle 维度电话查询与缓存身份；
2. 禁止恢复名邦直连 JYT / 名邦管理 JYT 电话凭证与旧凭证 API；
3. 禁止新增独立 `can_call_wholesale_phone` 拨打权限。

当前状态：

> `PDM-09 / BATCH_2_DEPRECATED_SUPERSEDED_DO_NOT_RESTORE / USER_REVIEW_PENDING`

真实冲突与证据缺口不混入本批。


## 2026-10-04｜PDM-09 Batch 2 完成

用户确认 P09-B2-01～P09-B2-03 全部通过。

其中 P09-B2-03 最终表述明确为：

> 有上游电话权限的员工，在自己有权访问的批发车源中，可以直接查看、获取最新电话并发起拨号；不再额外设置一个单独的“拨打电话权限”。

Batch 2 状态：

> `COMPLETE_USER_CONFIRMED`

当前进入：

> `PDM-09 / BATCH_3_INFORMED_CHANGES_AND_EXPLICIT_ADDITIONS / EVIDENCE_REVIEW`


## 2026-10-04｜PDM-09 Batch 3 证据筛选完成

经 9/20 IA ChangeLog、9/22 冻结台账、IA V5、实际 Low-Fi 与 001～078 复核：

> **Batch 3 无新的未审业务规则原子。**

电话状态页、latest 失败态、统一投影及 P03 页面均属于既有电话规则的 IA / Low-Fi 承载补全，不构成后续知情修改或新业务规则。

当前状态：

> `PDM-09 / BATCH_3_INFORMED_CHANGES_AND_EXPLICIT_ADDITIONS / USER_REVIEW_PENDING_NO_NEW_ATOMS`

用户确认前不得进入 Batch 4。


## 2026-10-04｜PDM-09 Batch 3 完成并进入 Batch 4

用户明确确认 Batch 3“无新增原子”结论。

Batch 3 状态：

> `COMPLETE_USER_CONFIRMED`

当前进入：

> `PDM-09 / BATCH_4_CONFLICTS_OMISSIONS_GAPS_NEW_CHOICES / EVIDENCE_REVIEW`


## 2026-10-04｜PDM-09 Batch 4 已形成

经主底盘、CN11 前史、9/22、IA V5、实际 Low-Fi 与 001～078 反查，形成 6 条真正需要用户审查的冲突 / 遗漏 / 缺口：

> **P09-B4-01～P09-B4-06**

覆盖：

1. cache miss 拨打是否自动按需取号；
2. `expires_at` 是否阻断普通缓存；
3. 同步阶段是否禁止批量预取电话；
4. Collector 新配置测试失败后的激活 / 回滚；
5. P03-05 publisher 电话缓存页真实内容；
6. 上游电话是否提供复制动作。

当前状态：

> `PDM-09 / BATCH_4_CONFLICTS_OMISSIONS_GAPS_NEW_CHOICES / USER_REVIEW_PENDING`


## 2026-10-04｜产品基线重建方法补强

用户批准新增全局硬规则：

> **先识别当前已实现 / 已测试事实，再执行原有 9/19 主底盘 + 前后历史反查 + 知情修改测试 + 四批用户裁决。**

新增要求：

- 已实现 / 已测试事实用于确定“当前系统实际上怎么跑”，但不自动成为产品权威；
- 当前实现与正式业务规则冲突时进入 `CURRENT_IMPLEMENTATION_CONFLICT`，不得模型自行覆盖；
- 涉及 API / Collector / 同步 / 鉴权时，必须先确认“谁提供 API、谁调用 API、数据流方向、当前版本、测试验收状态”；
- 历史“建议 / 推荐 / 候选 / 未施工”不得覆盖已验证当前实现；
- 当前 PDM-09 已发现电话 API 链存在旧方案污染迹象，继续 Batch 4 前必须对相关已确认项做显式复核，不静默改写。

当前 PDM-09 仍为 IN_PROGRESS。


## 2026-10-04｜PDM-09 当前实现事实卡完成

按新方法完成电话 API 架构复核。

当前事实：

- 名邦 Backend 提供 / 生成名邦 Integration API；
- Collector / 采集端配置并调用名邦 API，承担 JYT 采集与上游电话获取；
- 车辆数据和电话结果最终通过名邦既有回传体系进入名邦；
- 旧独立 Mingbang→Collector Phone API / Collector Base URL / Phone Path 方案属于历史中间方案或实现残留，不再自动视为当前产品规则。

因此回开：

- P09-A04 → P09-A04-R1
- P09-A11 → P09-A11-R1
- P09-B4-04 → 建议撤回

当前等待用户复审以上三项，Batch 4 其余候选暂不推进。


## 2026-10-04｜PDM-09 API 架构回开复核完成

用户明确“同意”，确认：

- P09-A04-R1：Collector / 采集端负责 JYT 取号，电话结果通过名邦 Backend 已有 Integration API / 回传体系返回名邦；
- P09-A11-R1：名邦 P03 撤销 Collector Base URL / Phone Path 产品配置，保留集成状态、缓存/历史、诊断、日志、审计；
- P09-B4-04-R1：原 B4-04 撤回，不再作为名邦产品规则。

P09-B2-02 的核心“名邦不直连 JYT / 不管理 JYT 电话凭证”继续有效；其旧网络方向文字由 A04-R1 替代。

当前 Batch 4 剩余待审：P09-B4-01、P09-B4-02、P09-B4-03、P09-B4-05、P09-B4-06。


## 2026-10-04｜PDM-09 Batch 4 完成

用户明确“全部同意”，一次性确认剩余：

- P09-B4-01：无缓存时按需取号，成功缓存后拨号；
- P09-B4-02：expires_at / freshness 不作为普通查看 / 拨打硬失效门槛；
- P09-B4-03：车源同步阶段不批量预取电话；
- P09-B4-05：P03-05 收口为 publisher 电话缓存管理 / 诊断页，不再承载 Collector URL / Phone Path；
- P09-B4-06：V1 不提供上游电话专门复制动作。

P09-B4-04 已在前轮确认撤回。

至此 PDM-09 Batch 1～4 用户审查全部完成。

当前下一步：

> **执行 PDM-09 全量 Decision Coverage / 未映射检查。**

PDM-09 尚未 FINAL APPROVED，不得标记 COMPLETE，不得进入 PDM-10。


## 2026-10-04｜PDM-09 全量覆盖校验完成

已完成 PDM-09 全量 Decision Coverage / 未映射检查。

结果：

- SOURCE_DECISION_COVERAGE = 100%（20/20）
- UNMAPPED = 0
- Batch 1～4 全部审查单元均有明确最终去向；
- 原 A04/A11/B2-02 的旧网络方向已由 A04-R1/A11-R1 正确替代；
- B4-04 已撤回且无孤儿产品 Decision；
- 当前 IA / Low-Fi 仍存在少量旧 Collector 电话连接 carrier，但均已有明确 supersede 去向，标记为 STALE_CARRIER，进入后续 IA / Engineering 整改，不阻塞 PDM-09 产品最终审批。

已生成：

- `07_重建工作区/PDM-09_全量DecisionCoverage未映射检查报告_2026-10-04.md`
- `07_重建工作区/PDM-09_最终完整规则总览_待用户批准.md`

当前状态：

> `PDM-09 / FINAL_REVIEW_PENDING`

未经用户最终批准，不得标记 PDM-09 COMPLETE，不得进入 PDM-10。


## 2026-10-04｜PDM-09 最终完成

用户最终明确确认 PDM-09《最终完整规则总览》。

- PDM-09 状态：`COMPLETE`；
- 正式规则文件：`07_重建工作区/PDM-09_最终完整规则.md`；
- SOURCE_DECISION_COVERAGE = 100%（20/20）；
- UNMAPPED = 0；
- A04/A11 的旧 API 方向已由 A04-R1/A11-R1 正式替代；
- B4-04 已正式撤回；
- 旧 IA / Low-Fi Collector 电话连接 carrier 保留为后续对齐整改项，不属于未决产品规则；
- Decision Register 已登记 `PDM09-GATE-FINAL`；
- 后续 PDM 不得静默改写 PDM-09，真实跨域冲突必须显式提交用户裁决。

当前进入准备：

> **PDM-10｜价格 / 查价 / 客户展示价覆盖**


## 2026-10-04｜PDM-10 Batch 1 已形成

已按冻结执行规范完成 PDM-10 前置证据扫描：

- 先识别当前已实现 / 已测试价格事实；
- 再读取 9/19 R4 / R11；
- 向前扫描 CN11 / 9/06 SSOT 与 Decision；
- 向后核对 9/22、IA V5、实际 Low-Fi、工程 Delta；
- 使用 001～078 M11 的 17 个归档单元做反向差集。

已形成：

> **P10-A01～P10-A12，共 12 条稳定一致候选。**

工作版：

> `07_重建工作区/PDM-10_价格查价客户展示价覆盖_规则原子重建_工作版.md`

已明确排除出 Batch 1 的包括：

- 加价 OFF 语义演进；
- 三类车源覆盖价范围演进；
- 内部价 permission 演进；
- 调价 permission 承载缺口；
- 临时追加查价次数历史遗漏；
- 排序 / 格式 / 低价警告等承载缺口；
- 同一 vehicle_id 一键转名邦后的价格继承冲突。

当前状态：

> `PDM-10 / BATCH_1_STABLE_CONSISTENT / USER_REVIEW_PENDING`

未经用户确认不得进入 Batch 2。


## 2026-10-04｜PDM-10 Batch 1 完成并进入 Batch 2

用户明确“全部同意”，确认 P10-A01～P10-A12 全部通过。

Batch 1 状态：

> `COMPLETE_USER_CONFIRMED`

Decision Register 已登记 PDM10-DEC-A01～A12 与 PDM10-GATE-B1。

已继续完成 Batch 2 筛选，共形成：

> **P10-B2-01～P10-B2-12**

当前进入：

> `PDM-10 / BATCH_2_DEPRECATED_SUPERSEDED_DO_NOT_RESTORE / USER_REVIEW_PENDING`

未经用户确认不得进入 Batch 3。


## 2026-10-04｜PDM-10 Batch 2 完成并进入 Batch 3

用户明确“全部同意”，确认 P10-B2-01～P10-B2-12 全部通过。

Batch 2 状态：

> `COMPLETE_USER_CONFIRMED`

Decision Register 已登记 PDM10-DEC-B2-01～B2-12 与 PDM10-GATE-B2。

经后续证据复核，Batch 3 不凑数量，只形成 3 条真正的知情修改 / 明确新增：

- P10-A13：加价关闭显示上游标价；
- P10-A14：覆盖价扩展到批发 / 名邦 / 4S；
- P10-A15：名邦内部价查看取消独立 permission 门槛。

当前进入：

> `PDM-10 / BATCH_3_INFORMED_CHANGES_AND_EXPLICIT_ADDITIONS / USER_REVIEW_PENDING`

未经用户确认不得进入 Batch 4。


## 2026-10-04｜Batch 2/3 反向冲突门禁与 PDM-10 内部价权限纠正

用户批准将“Batch 2 / Batch 3 入批前反向冲突检查”写入全局执行规范与四批门禁。

本次触发问题：

- R4 存在内部价 permission + data scope 正式规则；
- R11 后来取消独立 permission；
- 已完成 PDM-02 最终规则已经由用户主动反转回“独立 permission”；
- IA V5 / 001～078 又记录反向承载与冲突；
- PDM-10 前一轮却误把 R11 当作最终演进，形成错误的 P10-B2-10 / P10-A15。

纠正结果：

- P10-B2-10：`REOPENED / INVALID_CLASSIFICATION`；
- P10-A15：`WITHDRAWN_FROM_BATCH_3 / RECLASSIFIED_TO_BATCH_4`；
- P10-A13、P10-A14：用户已确认；
- P10-B4-01：`USER_APPROVED`，内部价查看恢复/继承为后台可配置独立 permission；
- PDM-10 当前进入 `BATCH_4_EVIDENCE_REVIEW`。

本次未修改 R11 / IA / Low-Fi 历史证据原件。
