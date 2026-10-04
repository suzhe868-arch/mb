# PDM-05｜车型主数据 / 年款 / JYT 车型映射 / MODEL_MISSING｜最终完整规则

> 日期：2026-09-24  
> 状态：`COMPLETE / INTEGRITY_PASS`  
> 说明：本文件汇总 PDM-05 Batch 1～4 经用户逐批裁决并经最终总览批准后的正式当前规则；2026-10-05 已完成 Legacy Final Integrity Audit，并同步 PDM-06 已完成承接以及 PDM-02 System Admin 控制平面边界。  
> IA / Low-Fi 仅登记 `STALE_CARRIER`，统一延后到 PDM-25 完成并通过 PDM-01～25 全局最终总复核后集中对齐。

---

## 1. 本地车型主数据结构

本地车型主数据采用：

> **品牌 → 车系 → 具体车型**

“年款”不是第四级独立主数据节点，而是具体车型自身的结构化字段。

界面可以按年款做分组、筛选、选择，但不得因此实现成：

> 品牌 → 车系 → 年款 → 具体车型

的四级主数据模型。

---

## 2. 车型年款与首次上牌时间分离

必须严格区分：

- **车型年款**：具体车型属性；
- **首次上牌 / 首次登记时间**：单台车辆属性。

两者不得互相推导或覆盖。

例如：

> 2024 款车型可以在 2023、2024 或 2025 年首次上牌。

---

## 3. JYT 车型身份采用 ID-based source mapping

车型身份不以名称字符串作为主身份。

当前正式规则：

- JYT `model_id` 作为上游车型身份键；
- 名邦本地使用自己的 `vehicle_model_id`；
- 两者通过 source mapping 建立关系；
- 两边 ID 数值不要求相同；
- 已有 `JYT model_id → local vehicle_model_id` 映射时直接复用；
- 没有映射时进入后台 Admin 待处理。

车型名称仅用于：

- 展示；
- 快照；
- 搜索；
- 后台 Admin 辅助判断。

不得恢复“完整车型名称完全一致 = 车型身份 / 首次自动映射主规则”。

品牌 / 车系是否与 JYT 共用相同 ID 值，当前没有足够证据，不作假定。

---

## 4. 同一 JYT model_id 的待处理与复用

同一 JYT `model_id / upstream_model_id`：

- 只生成一条车型归属待确认任务；
- Admin 确认一次后，现有相同 ID 车辆统一建立本地归属；
- 后续相同 ID 自动复用；
- 不逐车重复人工处理。

---

## 5. JYT 原始车型事实与本地车型归属分层

JYT 已提供的来源车型事实永久与本地车型字典归属分层。

包括但不限于：

- 品牌；
- 车系；
- 年款；
- 具体车型 / 款式名称；
- 排量；
- 变速箱；
- 排放；
- 能源类型；
- 其他上游已明确车型级资料。

本地映射只解决：

> **这个 JYT model_id 正式归到哪个名邦本地 vehicle_model_id。**

不得因为完成本地映射，就反向覆盖 JYT 已保存的原始车型事实。

---

## 6. 本地映射未完成不阻塞 JYT 正常业务

只要 JYT 已经提供明确车型事实，即使当前：

> `vehicle_model_id = NULL / mapping pending`

车辆仍可以正常：

- 入库；
- 发布；
- 展示；
- 搜索；
- 筛选；
- 参与销售业务。

本地车型映射 pending 不等于车辆自身车型事实未知。

---

## 7. 未映射也可精确搜索与自动 Matching

只要 JYT 已明确提供足够车型事实，例如：

- 品牌；
- 车系；
- 年款；
- 具体车型 / 款式；

且这些事实满足客户/需求的结构化车型条件或确定性关键词条件，则：

> **即使本地 vehicle_model_id 尚未映射，也可以参加精确搜索、筛选和自动 Matching。**

不得仅因为本地车型归属 pending，就把车型条件强制降为 unknown。

必须继续区分：

1. **车辆自身车型事实**：可直接用于搜索 / Matching；
2. **名邦本地车型主数据归属**：仍由后台 Admin 通过 source mapping 完成。

---

## 8. 映射冲突

如果同一个 JYT `model_id` 后续出现与已确认本地映射明显冲突的车型内容：

- 不得静默自动改映射；
- JYT 来源事实继续保留；
- 后台明确标记 **“车型映射冲突”**，不得静默遗漏；
- **映射冲突本身不自动阻塞该车辆既有正常业务**；只要车辆另无独立的 `offline / unavailable / hidden / business-state` 等阻断条件，车辆可继续按其真实来源事实和当前业务 Guard 运行；
- 由 System Admin 控制平面按 §9 的 `vehicle.model.manage` Guard 人工确认 / 修正；
- 修正必须留审计。

这里必须区分：

> **车型映射冲突 ≠ 车辆真实不可售。**

若车辆同时存在独立的真实不可售或其他业务阻断事实，则服从对应车辆 / 业务域规则；不得把“mapping conflict”标签本身误实现成统一冻结车辆业务。

---

## 9. 车型管理权限与执行主体

车型主数据、JYT source mapping、MODEL_MISSING、映射冲突与重复车型治理属于：

> **System Admin 控制平面治理域。**

本域治理动作继续使用：

> `vehicle.model.manage`

作为能力 Guard。

正式解释：

1. 本 PDM 历史文字中的“后台 Admin”统一解释为 **System Admin 控制平面身份**；
2. `vehicle.model.manage` 在本域是 System Admin 执行车型主数据治理动作时的 capability / Guard，不等同于普通车辆编辑权限；
3. 普通销售、经理、店长、4S 成员不会因为拥有车辆发布、车辆编辑或车辆管理能力，就自动取得车型主数据治理权；
4. V1 当前不把车型主数据治理委托为普通员工业务动作；若未来要开放“独立员工车型管理员”，必须重新显式裁决，不得仅通过角色模板静默推导；
5. System Admin 执行本域治理不因此获得 Customer owner、销售、CRM、Lock、Transaction 等员工业务执行权。

System Admin 控制平面可在本域执行：

- 新增品牌；
- 新增车系；
- 新增具体车型；
- 修改车型归属；
- 修正 JYT 映射；
- 处理 MODEL_MISSING；
- 处理映射冲突；
- 合并重复车型；
- 执行必要的车型主数据质量治理。

---

## 10. MODEL_MISSING / 缺主数据处理

以下状态必须明确形成后台待处理状态 / 提示，不得静默遗漏：

- JYT 本地映射未完成；
- 本地缺少品牌；
- 本地缺少车系；
- 本地缺少具体车型；
- 人工上传 `MODEL_MISSING`。

统一业务归口可表达为：

> **车型字典归属待确认**

而已确认映射与新来源事实明显冲突时，必须单独表达为：

> **车型映射冲突**

两者不得混为一个无差别状态。

System Admin 在处理：

- MODEL_MISSING；
- JYT 待映射；
- 人工上传缺车型；

时，可以直接：

1. 缺品牌 → 新增品牌；
2. 缺车系 → 新增车系；
3. 缺具体车型 → 新增具体车型；
4. 新增完成后建立 / 选择有效本地 `vehicle_model_id`；
5. 继续原业务流程。

如果该缺失主数据来源于 JYT 采集车型：

> **应在本次处理或紧接后的同一后台流程中尽快建立对应的 `JYT model_id → local vehicle_model_id` source mapping。**

不得形成：

> 本地主数据已经补齐，但采集映射长期悬空

的长期状态。

---

## 11. 名邦 / 4S 人工上传

人工上传车辆必须最终绑定有效本地具体车型 / `vehicle_model_id` 后，才能正式发布。

如果普通销售发现本地缺车型：

- 当前录车内容可以保留草稿；
- 不能绕过车型主数据直接正式发布；
- 由 System Admin 按本 PDM 治理规则补齐车型主数据 / 映射后，再继续原草稿流程。

人工上传与 JYT 批发车的车型入口规则不得混用。

---

## 12. 本地车型主数据质量维护

System Admin 可以按 `vehicle.model.manage` Guard 维护车型主数据质量。

### 12.1 节点挂错父级

具体车型挂错品牌 / 车系时：

- 直接修正该车型节点的归属；
- 所有引用该节点的车辆自动跟随正确层级；
- 不需要逐车手工改。

### 12.2 重复车型合并

若误建重复车型节点：

- 选定一个正确节点保留；
- 其他重复节点合并进入保留节点；
- 车辆引用迁移；
- JYT source mapping 一并迁移；
- 旧重复节点退出当前选择 / 新关联；
- 保留轻量合并历史。

### 12.3 真实旧车型长期保留

真实存在的旧年份车型：

> **不因年份老自动停用。**

只有录入错误、重复并已合并等真实原因，才退出当前使用。

### 12.4 车型固定属性纠错后的当前值与历史边界

对于由具体 `vehicle_model_id` **唯一确定**的车型级固定属性，例如：

- 车型年款；
- 排量；
- 变速箱；
- 排放；
- 能源类型；
- 其他由该具体车型主数据唯一确定的固定车型属性；

当前规则采用用户确认的 **5A**：

> **当前值跟随当前有效车型主数据；历史事实与已形成快照不追改。**

具体规则：

1. System Admin 修正当前有效车型主档后，引用该 `vehicle_model_id` 的车辆当前车型级投影同步体现修正后的有效主数据；
2. 不要求逐车手工修正这些由车型唯一确定的固定属性；
3. 单辆人工 Vehicle 不应任意独立改写这类“车型唯一确定属性”；发现错误应优先修正车型主档或 mapping，而不是制造单车例外；
4. 已经形成的 Recommendation、Lock、Transaction、成交记录、价格/业务快照及其他历史快照不得因为主档纠错被追溯改写；
5. JYT 原始 source facts 永远独立保留，不因本地车型主档修正被反向覆盖；
6. 首次上牌时间、里程、颜色、车况等单车事实不是车型主档固定属性，继续按 Vehicle 自身事实维护，不随车型主档变化。

因此必须区分：

> **当前车型主数据纠错** 与 **历史业务事实重写**。

前者允许并应生效；后者禁止。

---

## 13. 映射审计

车型映射的人工确认 / 修正至少记录：

- 操作人；
- 操作时间；
- 原映射；
- 新映射。

当前业务规则：

> **不强制每次填写修改原因。**

车型节点修正、合并及 source mapping 迁移同样应保留必要历史与审计。

---

## 14. 明确 DO_NOT_RESTORE

以下旧机制不得恢复：

1. “品牌 → 车系 → 年款 → 具体车型”四级主数据；
2. 人工单车车型锁定；
3. JYT 车型名称 alias / 同义词映射体系；
4. 为“同一车型多个 JYT ID”提前建设特殊复杂合并机制；
5. 完整车型名称完全一致作为车型身份 / 首次自动映射主规则；
6. 本地映射完成后反向覆盖 JYT 原始车型事实；
7. 因本地车型未映射就阻塞 JYT 正常入库、展示、搜索、筛选、销售；
8. 因本地车型未映射就禁止使用 JYT 已明确车型事实做精确搜索或自动 Matching。

---

## 15. Cross-PDM 承接状态

### 15.1 PDM-06｜人工发布字段联动｜HANDOFF_CLOSED

PDM-05 历史移交给 PDM-06 的人工发布事项已经完成，不再显示为“留后续”。

PDM-06 当前已冻结：

- 人工选择有效具体车型 / `vehicle_model_id` 后，自动带出当前车型主数据已确定的车型年款、排量、变速箱、排放、能源等固定属性；
- 不要求销售重复录入已经由具体车型唯一确定的固定属性；
- `MODEL_MISSING` 处理期间保留原草稿与已填内容；
- System Admin 补齐 / 绑定车型后返回触发流程的原始 `draft_id`；
- 自动带回已确认 / 新增的有效具体车型，并重新执行正式发布校验；
- 正式发布最低字段、可选字段、多草稿及正式发布动作继续按 PDM-06 Final。

2026-10-05 进一步关闭 PDM-06 §8A 原来反向留回车型域的“主档纠错后已发布车辆如何显示”问题：

> 采用本文件 §12.4 的 5A——当前车型级固定属性跟随当前有效车型主档；历史业务快照和 JYT 原始 source facts 不追改。

状态：

> `HO-P05-P06-001 = HANDOFF_CLOSED / source_backwrite = YES`

### 15.2 仍待后续 PDM 承接

- PDM-12｜`HANDOFF_OPEN`：Matching 必须使用已确认的 JYT 车辆车型事实；不得只因本地 `vehicle_model_id=NULL / mapping pending` 就自动降为 unknown；
- PDM-20｜`HANDOFF_OPEN`：客户端车型搜索 / 筛选 / 年款分组；年款只能作为分组/条件，不得投影成第四级主数据；车型年款与首次上牌年份必须分离；
- PDM-21｜`HANDOFF_OPEN`：员工端车型选择、MODEL_MISSING、固定属性自动带出与对应状态展示；
- PDM-22｜`HANDOFF_OPEN`：System Admin 车型主数据、JYT mapping、冲突、MODEL_MISSING、重复车型合并等 PC 治理页面；
- PDM-25｜`HANDOFF_OPEN`：mapping before/after、车型节点修正、合并迁移、主档纠错与历史不可追改的统一审计 / 历史标准。

上述 handoff 统一登记到：

> `07_重建工作区/CROSS_PDM_HANDOFF_REGISTER.md`

### 15.3 IA / Low-Fi stale carrier

本轮确认但当前不修改的旧承载至少包括：

- “完整车型名称完全一致 → 自动 mapping”的旧主规则；
- `no model creation is inferred`，与 System Admin 可新增缺失品牌 / 车系 / 具体车型并绑定的当前规则冲突；
- 页面把“年款”表现得像第四级主数据节点的语义风险；
- mapping pending / conflict 时把 JYT 已明确车型事实错误降为 unknown、从而阻止精确搜索 / Matching 的旧 carrier。

统一登记：

> `STALE_CARRIER / DEFERRED_TO_POST_PDM25_IA_LOWFI_ALIGNMENT`

IA / Low-Fi 不具有反向覆盖当前 PDM Final 的产品 Authority。

---

## 16. 最终状态

PDM-05 Batch 1～4 与最终完整规则总览均已完成用户明确批准。

2026-10-05 Legacy Final Integrity Audit 关闭 7 组问题；其中用户明确选择：

- **4A**：车型主数据治理正式归 System Admin 控制平面，`vehicle.model.manage` 作为治理能力 Guard；
- **5A**：车型唯一确定的固定属性当前值跟随有效车型主档纠错，历史业务快照与 JYT 原始 source facts 不追改。

当前状态：

> **`COMPLETE / INTEGRITY_PASS`**

```text
MISSING_RULE_UNRESOLVED = 0
SEMANTIC_DETAIL_GAP_UNRESOLVED = 0
CROSS_PDM_CONFLICT = 0
HANDOFF_GAP_UNRESOLVED = 0
GLOBAL_INVARIANT_CONFLICT = 0
SOURCE_DECISION_COVERAGE = 100%
FINAL_TO_SOURCE_TRACEABILITY = 100%
SEMANTIC_INTEGRITY = PASS
NEGATIVE_CLAIMS_VERIFIED = PASS
IMPLEMENTATION_READY = PASS
HANDOFF_REGISTER_SYNC = PASS
```

本文件作为 PDM-05 当前正式规则。后续 PDM 可以补充各自业务域，但不得静默推翻本文件已确认规则；发现真实跨域冲突时必须重新显式提交用户裁决。

下一审计域进入：

> **PDM-06｜Legacy Final Integrity Audit**
