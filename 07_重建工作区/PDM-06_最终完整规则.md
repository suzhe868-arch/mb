# PDM-06｜人工车辆发布 / 草稿 / VIN / 删除边界｜最终完整规则

> 日期：2026-09-24  
> 状态：`COMPLETE / INTEGRITY_PASS`  
> 说明：本文件汇总 PDM-06 Batch 1～4 经用户逐批裁决并经最终总览批准后的正式当前规则；2026-10-05 已完成 Legacy Final Integrity Audit，并关闭 PDM-07 / PDM-08 / PDM-10 已完成承接。  
> IA / Low-Fi 仅登记 `STALE_CARRIER`，统一延后到 PDM-25 完成并通过 PDM-01～25 全局最终总复核后集中对齐。

---

## 1. 人工车源来源边界

人工发布入口只能创建：

- 名邦车源；
- 4S 合作车源。

不能通过人工发布入口创建批发 / JYT 车源。

当前角色边界：

- 名邦员工：按当前权限范围可发布名邦或 4S 人工车源；
- 4S 成员：人工上传固定为 4S 车源；
- 批发车：只能由 JYT / 集成同步产生。

---

## 2. 新增车源入口

正式入口：

> `E02 → 更多 → 新增车源`

不得恢复旧的右下角悬浮：

> `+新增车源`

“新增车源”每次点击都开始一条新的车辆录入，不自动替用户恢复旧草稿。

---

## 3. 多草稿 + 自动保存

人工新增车辆采用多草稿模式。

规则：

1. 空白进入新增页，未填写任何有效车辆资料、未上传内容就退出 → 不生成草稿；
2. 开始填写有效车辆资料或上传内容后 → 自动生成草稿；
3. 后续表单变化持续自动保存；
4. 不设置手工“保存草稿”按钮；
5. 不设置“继续上次 / 放弃重新发布”全局弹层；
6. 不采用系统自动判断“应该恢复哪个旧草稿”的单草稿机制。

---

## 4. 草稿车源管理入口

所有未发布草稿统一从：

> `E02 → 更多 → 草稿车源`

管理。

### 4.1 草稿权限继承人工车源发布 / 管理能力

不再单独建立“草稿查看 / 草稿编辑”权限。

当前规则：

- 具备人工名邦 / 4S 车源发布或对应车辆管理能力的员工，在其当前 data scope 内，可以查看、继续编辑对应草稿；
- 草稿列表与草稿详情只返回操作者当前有权管理范围内的 draft；
- 4S 成员仍只在其允许的 4S 业务范围内管理草稿；
- 后台通过现有人工车源发布 / 管理 capability 与 data scope 控制，不增加独立 draft-read / draft-edit permission；
- 删除草稿仍额外服从“纯草稿 + 二次确认 + 提交时重验”等删除 Guard。


草稿列表中的目标 draft 可：

- 继续编辑；
- 正式发布；
- 删除。

多个草稿之间互相独立。

删除一个目标 draft：

> 只影响被选择的该条草稿，不影响其他未完成草稿。

---

## 5. 草稿与正式 Vehicle 分层

草稿允许资料不完整。

未正式发布草稿：

- 不进入客户公开车源；
- 不进入客户搜索；
- 不参与自动 Matching；
- 不产生 Recommendation；
- 不参与 Lock；
- 不创建 `listing_cycle`；
- 不成为正式业务 Vehicle 历史。

只有通过正式发布后，才进入正式 Vehicle / listing_cycle 业务链。

---

## 6. 正式发布动作

新建车辆录入不增加“预览后再确认发布”的必经流程。

底部唯一主要正式动作：

> **正式发布**

提交正式发布时：

- 服务端必须重新校验；
- 一次返回完整缺失发布字段；
- 任一最低发布字段缺失 → 阻止正式发布并明确提示；
- 不能先缺字段正式上架，再要求后补发布硬门槛字段；
- 发布成功后进入新车辆员工详情。

---

## 7. 正式发布最低字段

人工车辆正式发布最低业务字段：

1. `source_type`
2. 品牌
3. 车系
4. 有效具体 `vehicle_model_id`
5. 车型年款
6. 表显里程
7. 城市

缺任一项：

> 不得正式发布。

---

## 8. MODEL_MISSING

人工名邦 / 4S 车辆必须绑定有效本地具体车型 / `vehicle_model_id` 后，才能正式发布。

如果录车过程中出现：

> `MODEL_MISSING`

则：

- 当前草稿继续保留；
- 已填资料不丢失；
- 不能绕过本地车型主数据直接发布；
- 按 PDM-05 当前规则由 System Admin 控制平面通过 `vehicle.model.manage` Guard 补齐 / 绑定车型主数据。

处理完成后：

> 必须返回触发该流程的原始 `draft_id`。

不得：

- 进入“继续上次”弹层；
- 恢复其他草稿；
- 丢失原草稿已填写内容。

返回原草稿后：

- 自动带回已确认 / 新增的本地具体车型；
- 重新执行正式发布校验。

---

## 8A. 具体车型固定属性自动带出

人工名邦 / 4S 车辆选择有效具体车型 / `vehicle_model_id` 后：

> **自动带出该车型主数据中已经确定的固定属性。**

包括但不限于：

- 车型年款；
- 排量；
- 变速箱；
- 排放；
- 能源类型；
- 其他已经由车型主数据确定的固定车型级属性。

规则：

1. 固定属性优先来自当前有效本地车型主数据；
2. 不要求销售重复手工录入已经由具体车型唯一确定的固定属性；
3. 2026-10-05 已由 PDM-05 Integrity Audit 明确关闭：由具体车型唯一确定的固定车型属性，当前值跟随当前有效车型主数据；车型主档纠错后当前车辆投影同步体现修正值，但 Recommendation / Lock / Transaction / 成交及其他已形成历史快照不追改，JYT 原始 source facts 不反写；
4. 上游 JYT source facts 仍按 PDM-05 规则独立保留，不被人工车型选择反向覆盖。

---

## 9. 图片发布边界

车辆图片不是正式发布硬门槛。

允许：

> **0 张真实图片正式发布。**

无真实车辆图片时：

- 使用统一默认占位；
- 后续可以补充真实图片。

不得因为图片为 0：

> 阻止最低字段已经完整的人工车辆正式发布。

---

## 10. 价格发布边界

以下价格字段都不是人工车辆正式发布硬门槛：

- 客户标价；
- 内部批发价。

客户标价为空：

> 客户端显示“价格咨询”。

内部批发价为空：

> 本身不阻断正式发布。

具体客户展示价计算、覆盖、后续调价继续由价格域规则处理。

---

## 11. VIN 基础规则

VIN 是人工车辆内部可选字段：

> **不是正式发布必填字段。**

未填写 VIN：

- 本身不得阻断正式发布；
- 不做 VIN 重复 Gate；
- 不允许通过车型 + 年款 + 里程 + 描述相似度等方式猜测“同一辆车”并阻止发布。

不得恢复“相似车辆自动猜重”的机制。

---

## 12. 已填写 VIN 的精确重复 Gate

如果人工车辆填写了 VIN，则正式发布时：

> 必须执行**完全一致 VIN 精确查重**。

查重范围：

> 当前已有名邦 / 4S 正式人工 Vehicle。

如果发现另一条现有人工 Vehicle 使用完全相同 VIN：

- 阻止普通正式发布；
- 明确提示存在相同 VIN 车辆；
- 提供“查看已有车辆”；
- 提供“返回修改”。

普通员工：

> 不提供“忽略并继续发布”。

返回当前草稿时：

> 已填写内容必须完整保留。

该 Gate 只针对精确 VIN，不扩展为模糊车辆相似判断。

---

## 13. source_type 新建选择

新建人工车辆时，source_type 的 UI 按当前人员可发布范围决定。

### 13.1 只能发布一种来源

如果当前人员只能发布一种人工来源：

> 直接进入表单，不增加无意义 source_type 选择步骤。

### 13.2 名邦员工同时允许名邦 + 4S

如果名邦员工同时具备：

- 名邦车源；
- 4S 合作车源；

两个可选来源，则新建时：

> 必须主动选择其一。

不得设置默认值替用户自动判断。

### 13.3 4S 成员

4S 成员：

> 固定发布为 4S 车源。

不得自行切换为名邦车源。

### 13.4 首次正式发布前草稿可修改 source_type

人工车辆仍处于未正式发布 draft 阶段时：

> **允许在当前操作者合法可发布的人工来源范围内修改 `source_type`。**

规则：

1. 名邦员工若当前同时允许发布名邦 / 4S，可在该 draft 首次正式发布前在两种人工来源之间修改；
2. 如果当前操作者只允许发布一种人工来源，则不得把 draft 改成超出其合法范围的来源；
3. 4S 成员仍固定为 4S，不得在草稿阶段切换为名邦；
4. draft 阶段修改 `source_type` 不产生正式 Vehicle 历史迁移，也不创建新的 `listing_cycle`；
5. 首次正式发布时必须再次按最终选择的 `source_type` 重验权限、data scope 与最低发布字段；
6. 一旦首次正式发布完成，后续 `source_type` 修改转入 §14 的正式业务动作，不再按草稿字段修改处理。

---

## 14. source_type 发布后修改

不得恢复：

> “第一次正式发布后 source_type 永久冻结，只能特殊高权限纠错”

的旧规则。

当前正式规则继承 PDM-04：

- 正式人工车辆可在名邦 ↔ 4S 之间通过专门业务动作修改；
- 执行者必须具有正常车辆管理能力及对应数据范围；
- 批发不能人工切入；
- 修改必须审计 before / after / actor / time；
- 不强制填写修改原因；
- 修改后按新 source_type 重算当前权限与责任；
- `vehicle_id`、当前业务历史与在途业务不因此删除。

---

## 15. 已发布人工车辆普通编辑

已发布的名邦 / 4S 人工车辆可以由具备车辆管理能力的员工进行授权编辑。

但是：

> **编辑过程中的普通资料修改不能边填写边实时影响客户侧。**

正式模型：

1. 编辑过程可临时保存为未提交修改；
2. 离开后可以继续编辑未提交内容；
3. 客户端继续读取当前正式已生效版本；
4. 员工明确点击“保存修改”；
5. 服务端重新校验权限、数据范围、对象状态和版本；
6. 校验通过后普通资料修改正式生效。

2026-10-04 PDM-10 最终规则对价格编辑形成后续显式修正：

- 名邦 / 4S 的正常 customer_list_price、internal_wholesale_price 属于普通车辆编辑字段，通过“保存修改”提交，不再存在独立“调价 permission / 调价动作”；
- customer_list_price 服从正常车辆编辑 / 管理能力 + data scope + object state；
- 修改 internal_wholesale_price 还必须具备独立内部价查看 permission；
- 客户展示价覆盖仍是不混入“保存修改”的独立敏感业务动作；
- 上 / 下架、`source_type` 及其他已定义独立敏感动作仍不混入普通资料提交。

批发 / JYT 来源事实继续只读。

---

## 16. 草稿删除

纯草稿允许删除，但必须从：

> `E02 → 更多 → 草稿车源`

针对明确目标 draft 发起。

删除前：

> 二次确认。

提交删除时必须重新校验：

1. 从未正式 publish；
2. 没有 `listing_cycle`；
3. 没有正式业务关系；
4. 操作者具有该草稿管理权限；
5. 删除目标 draft 与当前选择一致。

全部满足：

> 可以物理删除该纯草稿。

任一条件不满足：

> 禁止按草稿删除。

---

## 17. 正式 Vehicle 禁止普通物理删除

人工车辆一旦第一次正式发布成功：

> 进入正式业务历史边界。

此后不得通过普通业务 CRUD：

> 直接物理删除 Vehicle。

正式车辆退出业务应使用：

- 下架；
- unavailable；
- sold；
- 历史化；
- 必要纠错；
- 其他正式车辆生命周期动作。

原因包括正式 Vehicle 可能已经关联：

- `listing_cycle`；
- 收藏；
- Recommendation；
- Consultation；
- Waitlist；
- Lock；
- Transaction；
- 价格 / 来源 / 操作审计。

正式历史不得因普通“删除”按钮被抹掉。

---

## 18. 明确 DO_NOT_RESTORE

以下旧机制不得恢复：

1. 新增车源时弹“继续上次 / 放弃重新发布”；
2. 单草稿 DRAFT_RESUME 模式；
3. 右下角悬浮“+新增车源”；
4. 手工“保存草稿”按钮；
5. “先预览再发布”的额外必经步骤；
6. 第一次正式发布后 source_type 永久冻结；
7. 所有草稿永久保留、不能删除；
8. 正式人工 Vehicle 普通物理删除；
9. VIN 为空时按车型 / 年款 / 里程 / 描述等相似信息猜重复并阻断发布。

---

## 19. Cross-PDM 承接状态

### 19.1 PDM-04 / PDM-05｜已完成依赖

PDM-06 继续继承：

- PDM-04：人工来源仅名邦 / 4S，批发只能由集成产生；正式人工车名邦 ↔ 4S `source_type` 修改；JYT 来源事实只读；vehicle / listing_cycle 生命周期原则；
- PDM-05：本地车型主数据、有效 `vehicle_model_id`、MODEL_MISSING、System Admin 车型治理，以及车型固定属性 current/history 边界。

这些依赖当前均已形成正式 Authority，不再作为未决 handoff。

### 19.2 PDM-07｜车辆档案 / 车况 / 交付材料｜HANDOFF_CLOSED

PDM-07 已完成本域后续承接，PDM-06 不再继续写“留后续”。当前正式结果：

- Vehicle Document / 档案不是人工车辆正式发布硬门槛；
- 档案不完整不阻塞正常前段销售业务；在其他业务条件满足时，仍可正式发布、客户浏览、Consultation、Recommendation、Lock、Waitlist、创建 Transaction；
- 真正完成 Transaction / 交付前，才按当时有效的 required-field set 核验必要资料；
- 缺必要资料只阻止完成 / 交付闭环，不回滚已经合法创建的 Transaction；
- 敏感原件、客户可见报告、车况来源、档案维护、历史与审计继续由 PDM-07 Authority 控制。

状态：

> `HO-P06-P07-001 = HANDOFF_CLOSED / source_backwrite = YES`

### 19.3 PDM-08｜人工车辆图片｜HANDOFF_CLOSED

PDM-08 已完整承接人工名邦 / 4S 车辆图片规则：

- 允许 0 张真实图片正式发布；
- 0 图使用统一占位；
- 正式发布后可以补图、删图、调整顺序；
- 删除首图后由当前排序第一张成为新首图；
- 删除到 0 图仍可继续在售；
- 普通车辆照片与出险 / 维保 / 敏感档案资源保持业务集合隔离。

状态：

> `HO-P06-P08-001 = HANDOFF_CLOSED / source_backwrite = YES`

### 19.4 PDM-10｜价格发布 / 正常价格编辑｜HANDOFF_CLOSED

2026-10-04 PDM-10 已显式 supersede 本文件旧“调价不得混入保存修改”语义，当前正式规则为：

- `customer_list_price` / `internal_wholesale_price` 都不是人工车辆正式发布硬门槛；
- `customer_list_price` 为空 → 客户侧“价格咨询”；
- `internal_wholesale_price` 为空 → 不阻断正式发布，也不伪造数值；
- 名邦 / 4S 正常价格字段修改属于普通车辆编辑，通过“保存修改”提交；
- 不再建立独立“调价 permission / 调价动作”；
- 修改 `internal_wholesale_price` 仍需内部价查看 permission；
- 客户展示价覆盖仍是独立敏感动作。

状态：

> `HO-P06-P10-001 = HANDOFF_CLOSED / source_backwrite = YES`

### 19.5 仍待后续 PDM 承接

- PDM-21｜`HANDOFF_OPEN`：员工端“新增车源 / 草稿车源 / VIN 重复提示 / MODEL_MISSING / 保存修改 / source_type 选择与草稿阶段修改”等页面、状态与动作投影；
- PDM-22｜`HANDOFF_OPEN`：PC / 后台人工车辆管理承载，尤其不得因通用 CRUD 自动生成正式 Vehicle 物理 Delete；
- PDM-25｜`HANDOFF_OPEN`：正式发布、source_type 修改、保存修改、VIN duplicate Gate、draft delete 等统一审计与历史留存标准。

统一登记到：

> `07_重建工作区/CROSS_PDM_HANDOFF_REGISTER.md`

### 19.6 IA / Low-Fi stale carrier

本轮确认但当前不修改的旧承载至少包括：

- `DRAFT_RESUME`；
- “继续上次 / 放弃重新发布”；
- MODEL_MISSING 完成后错误返回 `DRAFT_RESUME`；
- `no model creation is inferred`；
- 缺少真正的“更多 → 草稿车源”多草稿列表承载；
- 缺少 VIN 完全一致重复 Gate，以及“查看已有车辆 / 返回修改”；
- 已发布车辆缺真实“保存修改”动作投影；
- `source_type` 新建与草稿阶段修改细节不完整。

统一登记：

> `STALE_CARRIER / DEFERRED_TO_POST_PDM25_IA_LOWFI_ALIGNMENT`

这些 carrier 不具有产品 Authority，不得反向覆盖本 Final。

---

## 20. 最终状态

PDM-06 Batch 1～4 与最终完整规则总览均已完成用户明确批准。

2026-10-05 Legacy Final Integrity Audit 关闭 6 组问题：补回草稿发布前 `source_type` 合法修改、关闭 PDM-07 / PDM-08 / PDM-10 handoff、登记 PDM-21 / 22 / 25 future handoff，并登记 IA / Low-Fi stale carrier。

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

本文件作为 PDM-06 当前正式规则。后续 PDM 可以补充各自业务域，但不得静默推翻本文件已确认规则；发现真实跨域冲突时必须重新显式提交用户裁决。

下一审计域进入：

> **PDM-07｜Legacy Final Integrity Audit**
