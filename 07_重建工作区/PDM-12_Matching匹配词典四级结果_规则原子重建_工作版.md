# PDM-12｜Matching / 匹配词典 / 四级结果 / 人工确认｜规则原子重建工作版

> 日期：2026-10-05  
> 当前状态：`IN_PROGRESS / PREFINAL_INTEGRITY_PASS / FINAL_CANDIDATE_READY`  
> 业务权威语言：中文（zh-CN）  
> 当前域：PDM-12｜Match Candidate / Match Result / Rule Dictionary  
> 当前硬门禁：Batch 1～4 与 P12-LIA-01～06 均已完成用户审查，Final 前完整性复核已 PASS；下一步只能生成/提交 Final Domain Overview 给用户最终批准。未经用户最终批准不得发布 PDM-12 Final，不得修改 IA / Low-Fi。

---

## 1. 启动门禁

PDM-11 已：

- Final 用户批准；
- 正式 Final 发布；
- Source→Final / Final→Source 双向追溯 PASS；
- Final Integrity = PASS；
- `HO-P01-P11-002 = HANDOFF_CLOSED`。

PDM-12 incoming handoff 已全部读取并接收：

- `HO-P04-P12-001 = HANDOFF_ACCEPTED`
- `HO-P05-P12-001 = HANDOFF_ACCEPTED`
- `HO-P07-P12-001 = HANDOFF_ACCEPTED`
- `HO-P11-P12-001 = HANDOFF_ACCEPTED`

---

## 2. 覆盖地图与强制依赖

### 2.1 9/19 主来源

- C2；
- R10；
- R12。

### 2.2 核心对象

- Match Candidate；
- Match Result；
- Rule Dictionary。

### 2.3 核心能力

- 结构化 Matching；
- `high / acceptable / confirmation_needed / no_match` 四级结果；
- hard condition / soft preference；
- 人工确认；
- 条件变化后的受影响范围重算；
- 匹配词典 / 规则词典；
- 确定性解析；
- 客户端车源搜索与正式 Demand Matching 的共享解析边界。

### 2.4 Completed-PDM Dependency Card

PDM-12 强制继承：

- PDM-04｜hidden / source availability / saleability；
- PDM-05｜JYT 车型事实与 local mapping 分层；
- PDM-07｜车况原始事实 / provenance / unknown；
- PDM-10｜客户展示价 / Price Authority；
- PDM-11｜Application / Demand 生命周期、active、matching-ready 分层、四层找车信息模型。

不得用 Current IA / Low-Fi 的 stale carrier 反向覆盖上述 Final Authority。

---

## 3. Current Implementation Fact

当前证据只能确认：

- 历史 Starter 曾存在 Matching / Priority 相关数据库、OpenAPI、权限、可见性与测试实现；
- 历史 Priority 相关测试曾通过；
- 但完整 event-driven Matching 写侧、后台词典真实维护 Action、客户端/员工端完整真人操作合同并不能据此认定为当前生产实现；
- 因此当前实现事实定性为：

`PARTIAL_HISTORICAL_STARTER_EVIDENCE / CURRENT_PRODUCTION_IMPLEMENTATION_NOT_ESTABLISHED`

实现事实只用于判断 carrier / gap，不作为产品 Authority。

---

# 4. Batch 1｜稳定一致规则｜USER APPROVED

> 用户已审查并确认 `P12-A01～P12-A15`。  
> Batch 1 Gate：`PASS / USER_APPROVED`。

## P12-A01｜只有 active + matching-ready 的正式 Demand 进入正式 Matching

正式自动 Matching 同时要求：

1. 对象是正式 Demand，Application 本身不参与正式 Matching；
2. Demand 主状态为 `active`；
3. 通过 PDM-12 matching readiness 校验。

因此：

- pending Application 不匹配；
- paused / completed / cancelled Demand 不匹配；
- `active` 不等于天然 `matching-ready`；
- Customer disable 或 find-car entitlement 丧失导致 active→paused 后停止 active Matching；
- 后续正式 resume 回到 active 后，仍必须重新检查 matching readiness，不得仅因状态恢复就直接沿用旧匹配资格。

---

## P12-A02｜找车信息四层分离，确定性生成标准条件

找车信息必须分层：

1. 客户原始要求；
2. 销售匹配描述；
3. 由匹配词典 / 确定性规则解析出的标准匹配条件；
4. 需求说明 / 业务背景 / CRM 跟进等非匹配信息。

正式链路：

`客户原始要求 → 销售沟通整理 → 销售匹配描述 → 确定性解析 → 标准匹配条件 → Matching`

边界：

- 客户原话必须保存，但不得直接作为自动匹配主输入；
- 销售匹配描述是 V1 正式确定性解析的主要文本输入；
- 需求说明 / 背景 / CRM 跟进不得偷偷参与 Matching；
- 派生标准条件必须可追溯到确定性规则，不得通过猜测补齐。

---

## P12-A03｜V1 正式 Matching 禁止 AI 猜测替代确定性规则

V1 正式找车 Matching 使用：

- 标准车型事实；
- 匹配词典 / 规则词典；
- 确定性解析；
- 结构化字段比较。

不得让 AI：

- 猜客户话术的正式匹配含义；
- 猜缺失车辆事实；
- 猜车况；
- 猜车型 / 版本；
- 自动补不存在的匹配条件；
- 用概率判断替代正式四级结果规则。

AI 可在其他合法场景存在，但不得替代 PDM-12 的正式确定性 Matching Authority。

---

## P12-A04｜普通 Matching 与 Priority 共用同一公共匹配引擎

正式系统只维护一套公共 Matching：

- 普通 Demand 与具有 Priority 资格的 Demand 使用同一套结构化条件；
- 使用同一套四级 Match Result；
- Priority 不是第二套匹配算法；
- Priority 只能消费已经合法产生的 Match Result，再由 PDM-13 执行资格与仲裁。

PDM-12 Matching 本身不得：

- 改 Customer owner；
- 自动创建 Recommendation；
- 自动创建 / 转让 Priority；
- 自动 Lock；
- 自动授予客户详情可见权。

---

## P12-A05｜同字段多值 OR、跨字段 AND；hard condition 不静默放宽

- 同一字段内允许多个可接受值时采用 OR；
- 不同字段之间采用 AND；
- 已填写并定义为 hard condition 的条件不得因为“结果太少 / 无结果”而静默放宽；
- 无结果时只能等待新车源、由合法员工正式修改 Demand 条件，或进入相应确认流程；
- 不得用“最近似车辆”替代正式匹配成功。

---

## P12-A06｜正式 Match Result 固定四级

四级结果：

1. `high`
2. `acceptable`
3. `confirmation_needed`
4. `no_match`

语义：

- `high`：所有已填写 hard condition 明确满足；预算处于 high 范围；相关 soft preference 也满足；
- `acceptable`：hard condition 均满足，但命中已批准的容差或 soft preference 未满足；
- `confirmation_needed`：客户已填写 hard condition，但车辆对应事实缺失、冲突或无法确定；
- `no_match`：任一 hard condition 明确失败，或命中其他明确 no-match 规则。

优先级：

`high > acceptable`

并且：

- `confirmation_needed` 是事实不确定，不是“较差但可以接受”；
- unknown 不得自动当 satisfied。

---

## P12-A07｜confirmation_needed 必须经事实确认后重新判定

`confirmation_needed` 可进入员工确认流程。

确认前：

- 不得建立 Priority；
- 不得因为候选存在就自动 Recommendation；
- 不得把未知事实当满足。

确认的本质是：

> 补充 / 确认可确定的事实，然后重新执行正式 Matching。

确认后结果可变为：

- `high`
- `acceptable`
- `no_match`

“点击确认”本身不得强制把候选变成成功匹配。

---

## P12-A08｜预算比较使用合法客户展示价；默认容差 5%

预算比较使用 PDM-10 当前合法的**客户展示价事实**：

- 不得使用批发价 / 内部价 / 底价；
- LIMITED 场景前端暂时隐藏精确价格，不等于后台合法客户展示价事实不存在；
- 若存在合法数字客户展示价并且 Demand 设置预算：
  - `price <= budget`：预算维度处于 high 范围；
  - `budget < price <= budget × 105%`：可进入 acceptable；
  - `price > budget × 105%`：no_match。
- 默认预算容差 = 5%，允许以后由合法全局配置调整；
- 没有合法数字客户展示价 / 当前只能“价格咨询”时，不得伪造数字价格。

### 尚未偷渡冻结的边界

“Demand 未填写预算 + 车辆只能价格咨询”的最终四级归类，继续进入后续批次做 Semantic Completeness / Conflict Review；不得从本条自行外推出未审查结论。

---

## P12-A09｜当前稳定的字段级 hard / soft 语义

当前稳定规则：

- 车型年款：按**最低可接受车型年款**理解，更新的车型年款可满足；
- 车型年款不得与首次登记年份混为同一字段；
- 里程：当前稳定核心是**最高可接受里程**；
- 外观颜色：hard condition，可多选；
- 排量：hard condition，可按范围 / 多值表达；
- 动力类型：hard condition，可多选；
- 车况排除要求：hard condition；
- 内饰颜色：soft preference；未满足可使 high 降为 acceptable，但不因此直接 no_match。

### 未在 Batch 1 冻结

历史“低于客户填写的最低里程仍可接受”等特殊规则不在本条偷渡恢复，继续进入后续冲突审查。

---

## P12-A10｜JYT 已明确车型事实可直接参与 Matching，mapping pending 不降级事实

若 JYT 已明确提供：

- 品牌；
- 车系；
- 车型年款；
- 具体车型 / 款型；

则：

- local mapping pending；
- `vehicle_model_id = NULL`；
- 本地车型字典尚未补齐；

均不得把这些**已经存在的上游车型事实**自动降成 unknown / confirmation_needed，也不得仅因此阻止精确 Matching。

本地主数据 mapping 状态与 Vehicle Source Fact 必须分层。

---

## P12-A11｜车况 Matching 保留原始事实与 provenance

JYT 原始：

- 车况描述；
- 车况标签；
- 其他已明确来源事实；

可与必要的确定性标准化事实一起作为 Matching 输入。

必须：

- 保留 provenance；
- 保留原始 Source Data；
- 词典 / 规则产生的派生事实不得覆盖原始数据；
- 能确定才标准化；
- 无法确定时保持 unknown / confirmation_needed；
- 不得猜测补齐。

---

## P12-A12｜hidden ≠ unavailable；hidden 可参与内部 Matching

`platform_visibility = hidden` 只表示不进入对应公开展示面，不等于车辆真实下架 / 不可售。

因此：

- hidden 但真实仍可售、且其他业务 Guard 合法时，可参与内部 Matching；
- offline / real unavailable / sold / unpublished draft / 其他正式暂停 Matching 的状态不得进入普通候选；
- Match Candidate / Match Result 不授予客户详情可见权；
- hidden 车辆即使内部命中，客户后续可见仍必须经过 Recommendation / visibility grant 等独立正式规则。

---

## P12-A13｜Match Result 与 Recommendation / Priority / Lock / Owner 分离

Match Result 只表达：

> 某一 Demand × 某一 Vehicle 在当前事实与规则下的确定性匹配结果。

因此：

- high / acceptable ≠ Recommendation；
- Match Result ≠ Priority；
- Match Result ≠ Lock；
- Match Result 不改变 owner；
- Match Result 不产生客户专属关系；
- 下游对象必须分别通过其自身 PDM 的 Guard。

---

## P12-A14｜关键事实变化触发受影响范围重算

至少以下变化触发 Matching 重新计算：

- active Demand 的标准条件改变；
- 销售匹配描述保存后导致标准条件改变；
- Vehicle 关键匹配事实改变；
- 当前合法客户展示价改变；
- 相关确定性事实从 unknown→known；
- 已知事实发生改变；
- 后续词典修改影响到对应作用域。

原则：

- 事件驱动为主；
- 只重算受影响范围；
- 定时任务可作兜底，但不得成为唯一更新机制；
- 不得无脑全库重算；
- 上一次结果属于当时事实的历史，新结果代表当前事实；
- 必要的结果变化与原因必须可审计。

---

## P12-A15｜车源主页搜索与正式 Demand Matching 共用确定性解析 / 匹配词典

客户端车源主页搜索框与正式 Demand Matching 必须共用同一套：

- 匹配词典 / 规则词典；
- 车型及业务别名；
- 同义表达；
- 标准化映射；
- 确定性解析规则。

例如输入：

`26款 奥迪A6`

应通过共享解析能力得到对应的品牌、车系、车型年款等结构化事实，而不是退化成单纯字符串包含搜索。

### 共享的是解析层，不是把完整 Matching 结果逻辑硬套给搜索

**车源主页搜索：**

`搜索文本 → 共享确定性解析 → 结构化搜索 / 筛选条件 → 查询当前可搜索车辆`

搜索本身：

- 不创建 Match Result；
- 不创建 Priority；
- 不创建 Recommendation；
- 不创建 / 修改 Demand；
- 不创建 Lock；
- 不产生客户专属业务关系。

**正式 Demand Matching：**

`销售匹配描述 → 共享确定性解析 → 标准匹配条件 → hard/soft 比较 → 四级 Match Result`

因此正式冻结为：

> **一套词典、一套确定性解析能力，搜索与正式找车是两个消费场景；相同表达不得因为入口不同而解析成互相矛盾的标准事实。**

---

# 5. M03-001～M03-003 Source→Atom 反查

> 目的：关闭“证据已读到，但汇总时没有形成 Atom”的信息保真缺口。

## M03-001｜Demand / Matching 四级匹配规则

已映射：

- 公共 Matching 引擎 → P12-A04
- 字段内 OR / 字段间 AND、hard 不放宽 → P12-A05
- 四级结果 → P12-A06
- confirmation_needed → P12-A07
- 预算 5% / 客户展示价 → P12-A08
- 年款 / 里程 / 外观色 / 排量 / 动力 / 车况 / 内饰色 → P12-A09

未直接并入 Batch 1 的历史项：

- “不参与 V1 自动匹配”的旧字段排除清单；
- 里程最小值特殊历史语义。

处理：

`EXPLICITLY_DEFERRED_TO_LATER_CONFLICT_REVIEW`

不存在“无去向但未登记”的 M03-001 稳定项。

## M03-002｜找车申请 / Demand / 推荐工作区

PDM-12 直接相关项已映射：

- paused / terminal Demand 不参与 active Matching → P12-A01
- Recommendation 与 Matching 结果分离 → P12-A13

其余 Application、Demand 创建/激活、客户工作区、结束与历史规则已由 PDM-11 Final 承接，作为 PDM-12 Completed-PDM Dependency，不在本域重复造第二套 Authority。

处理：

`COVERED_BY_PDM11_DEPENDENCY_OR_P12_A01_A13`

## M03-003｜匹配词典 / 确定性解析 / P06-10 / 禁止 AI 猜测

已映射：

- 客户原话 / 销售匹配描述 / 标准条件 / 说明分层 → P12-A02
- 禁止 AI 猜测 → P12-A03
- 保存 / 解析 / 条件变化后的受影响范围重算原则 → P12-A14
- 搜索与 Demand Matching 共用词典 / 确定性解析 → **P12-A15**

### 本轮发现并修复的信息保真缺口

初次 Batch 1 候选已经读取 M03-003，但未把：

`SEARCH_MATCH_SHARED_DICTIONARY = MISSING`

转成独立 Atom。

用户在审查中主动指出后，已补为 P12-A15，并正式批准。

这是：

`SOURCE_READ_BUT_ATOM_NOT_EMITTED → FIXED`

### M03-003 仍明确留到后续批次的内容

- P06-10 的真实 CRUD / transition / save Action Contract；
- 匹配词典完整字段；
- 规则作用域优先级；
- 同级规则冲突；
- “测试匹配”；
- partial failure / retry；
- 字典变更的精确受影响范围；
- 后台权限与审计边界。

处理：

`EXPLICITLY_DEFERRED_NOT_LOST`

## 反查结论

`M03_001_003_SOURCE_TO_ATOM_AUDIT = PASS_AFTER_A15_REPAIR`

- 新发现“已读但无 Atom”的 Batch 1 稳定规则：1 条；
- 已修复：1 条（P12-A15）；
- 其余证据：已有 Atom、由已完成 PDM Authority 承接，或已显式登记进入后续批次；
- 当前 unmapped stable Batch 1 rule = 0。

---

# 6. Batch 1 当时明确未裁决 / 不偷渡项

以下内容不因 Batch 1 通过而自动批准：

1. 历史“最低里程”特殊规则；**后于 Batch 4 由 P12-B4-02 承接**；
2. 变速箱 / 配置偏好 / 过户次数 / 城市距离 / 排放 / source type 等字段最终是否进入 V1 自动 Matching；**后于 Batch 4 由 P12-B4-03 承接**；
3. VR-P-021 的正向 / 负向表达、hard / preferred / acceptable、局部例外容差、组件级规则；**后于 Batch 3 由 P12-B3-04 承接**；
4. VR-P-022 的证据优先级（**后于 Batch 3 由 P12-B3-05 承接**）：
   - structured
   - explicit inspection
   - detailed condition
   - vague keyword
5. VR-E-015 的客户等级 / Matching entitlement 前置关系与 PDM-11 当前生命周期语义；**后于 Batch 3 由 P12-B3-01 承接**；
6. “无预算 + 价格咨询”最终四级边界；**后于 Batch 4 由 P12-B4-01 承接**；
7. P06-10 完整词典治理、Action、scope priority、same-level conflict、test-match、失败重试；**Batch 3 已承接字段/基础 Action/scope priority/same-level conflict/test-match，Batch 4 由 P12-B4-04/B4-05/B4-06 承接删除、partial failure/retry 与正式写权限**；
8. Priority 仲裁 / TTL / Demand.created_at 使用方式——归 PDM-13，不在 PDM-12 偷渡冻结。

---

# 7. Batch 2｜废弃 / 禁止恢复项｜USER APPROVED

> 用户已审查并确认 `P12-B2-01～P12-B2-10`。  
> Batch 2 Gate：`PASS / USER_APPROVED`。  
> 本批只冻结明确废弃 / 明确禁止恢复的旧方向；旧字段排除清单、里程特殊规则、P06-10 完整治理、VR-P-021/022、“无预算 + 价格咨询”边界等仍不是废弃项，继续进入后续批次。

## P12-B2-01｜不得恢复第二套“客户专属 / 独立匹配”体系

V1 正式 Matching 只保留一套公共 Matching 引擎。

不得恢复：

- 独立“客户专属”匹配对象；
- “设为客户专属 / 解除客户专属”；
- 独立客户专属车源列表；
- 与公共 Matching 平行运行的第二套专属匹配系统；
- Priority 客户使用另一套条件或另一套匹配等级。

Priority 只允许消费公共 Match Result；其资格、仲裁、TTL 与生命周期由 PDM-13 冻结。

分类：`EXPLICITLY_DEPRECATED / DO_NOT_RESTORE`

---

## P12-B2-02｜不得把车源主页搜索恢复成普通关键词搜索

不得把车源主页搜索退化为：

> 只做字符串包含 / 模糊关键词命中，而不经过正式确定性解析。

搜索必须继续继承 P12-A15：

> 搜索与 Demand Matching 共用同一套确定性解析 / 匹配词典。

也不得另建与正式 Matching 漂移的：

- 搜索专用车型别名；
- 搜索专用同义词；
- 搜索专用标准映射体系。

分类：`SUPERSEDED_SEARCH_MODEL / DO_NOT_RESTORE`

---

## P12-B2-03｜不得恢复“客户原话直接进入自动 Matching”

不得建立：

`客户原话 → 直接自动 Matching`

也不得建立：

`客户原话 → AI 猜测 → 正式匹配条件`

正式链路继续为：

`客户原始表达 → 销售沟通整理 → 销售匹配描述 → 确定性解析 → 标准条件 → Matching`

因此：

- 客户原话必须保留为业务事实 / 留档；
- 客户原话不是正式自动 Matching 主输入；
- 需求说明 / 业务背景 / CRM 跟进也不得偷偷参与 Matching。

分类：`EXPLICIT_DO_NOT_RESTORE`

---

## P12-B2-04｜不得因本地车型 mapping pending 阻断或降级 JYT 已明确事实

不得恢复以下逻辑：

`vehicle_model_id = NULL / mapping pending → 车型未知 → 不允许精确搜索 / 不允许自动 Matching`

如果 JYT 已经明确提供车型事实：

- 不得把 mapping pending 自动变成 `confirmation_needed`；
- 不得把已明确品牌 / 车系 / 车型年款 / 具体车型重新判成 unknown；
- 不得等本地 mapping 完成后才允许车辆进入本可合法执行的搜索 / Matching。

本地主数据 mapping 与上游 Source Fact 必须继续分层。

分类：`COMPLETED_PDM_HARD_DENY / DO_NOT_RESTORE`

---

## P12-B2-05｜不得恢复“hidden = offline / unavailable”

不得因为：

`platform_visibility = hidden`

就：

- 认定车辆已下架；
- 认定车辆不可售；
- 自动排除内部 Matching；
- 自动结束 listing cycle。

Matching 候选资格必须读取真实 availability / saleability / listing state 与其他合法业务 Guard。

分类：`COMPLETED_PDM_HARD_DENY / DO_NOT_RESTORE`

---

## P12-B2-06｜不得靠猜测把缺失车况事实补成“符合 / 不符合”

客户填写 hard condition，而车辆对应事实缺失、来源冲突或无法确定时，不得：

- 猜成满足；
- 猜成不满足；
- 用模糊描述强推导；
- 用 AI 概率判断替代正式事实。

正确方向：

`unknown → 必要时 confirmation_needed → 确认事实 → 重新 Matching`

分类：`COMPLETED_PDM_HARD_DENY / DO_NOT_RESTORE`

---

## P12-B2-07｜不得为了 Matching 恢复旧版整套结构化车况字段体系

不得因为 Matching 需要结构化比较，就恢复历史“大而全”的整套结构化车况字段并要求所有车辆先补齐。

当前 Authority：

> 保留真实来源事实，只产生 Matching 必要且可确定的标准化事实。

因此：

- JYT 原始车况描述 / 标签继续保留；
- 只派生当前 Matching 真正需要且能够确定的字段；
- 不为“字段完整”凭空制造事实；
- 不要求车辆先完成整套旧车况结构化才允许 Matching。

分类：`USER_APPROVED_LEGACY_MODEL_DEPRECATED`

---

## P12-B2-08｜不得自动放宽条件，也不得提供 closest fallback

无正式匹配结果时不得：

- 自动放宽 hard condition；
- 偷偷扩大预算；
- 偷偷改变车型；
- 偷偷改变地域；
- 自动忽略已填写条件；
- 推荐“最接近的一辆”并冒充 Match；
- 建立 closest / nearest fallback。

允许真实返回：

> 当前没有符合条件的车辆。

条件变化必须来自客户 / 有权员工的显式修改，或等待新车源。

分类：`EXPLICITLY_DEPRECATED / DO_NOT_RESTORE`

---

## P12-B2-09｜不得恢复“匹配命中 = 自动产生后续业务对象”

即使 Match Result = `high`，也不得直接等于：

- Recommendation；
- Priority；
- Lock；
- 客户详情可见权；
- Customer owner / 负责人变化。

尤其不得恢复：

> “一旦匹配到，就自动给客户看 / 自动推荐 / 自动锁定。”

PDM-12 只产出确定性 Match Result；后续对象分别服从其自身 PDM。

PDM-12 当前只冻结：

> **Match Result 自己绝不授客户详情可见权。**

Priority / Recommendation 的完整可见性关系继续由 PDM-13 / PDM-14 冻结。

分类：`SUPERSEDED_COUPLING / DO_NOT_RESTORE`

---

## P12-B2-10｜不得恢复“定时全库扫描 = 唯一 Matching 更新机制”

不得设计为：

> 每隔一段时间全库 Vehicle × 全部 Demand 重跑，而关键事实发生变化时不即时处理。

同样不得：

- 匹配词典每改一条就无脑全库重算；
- 把定时任务当唯一 Matching 触发器。

正式原则继续继承 P12-A14：

> 事件驱动 + 受影响范围重算；定时任务只做必要兜底。

分类：`OLD_IMPLEMENTATION_DIRECTION_DENIED / DO_NOT_RESTORE`

---

## Batch 2 反向冲突扫描结论

以下内容经过反向扫描后**明确排除出 Batch 2**，原因是它们仍属于后续待审，不是明确废弃项：

1. 变速箱 / 配置偏好 / 过户次数 / 城市距离 / 排放 / source type 最终是否进入自动 Matching；
2. “低于最低里程仍可匹配”的旧特殊规则；
3. P06-10 词典完整字段、作用域优先级、同级冲突、测试匹配、partial failure / retry；
4. VR-P-021 / VR-P-022；
5. “无预算 + 价格咨询”的最终四级边界；
6. Priority TTL / 仲裁 / 人工创建 / 生命周期——主要归 PDM-13。

结论：

`BATCH2_REVERSE_CONFLICT_SCAN = PASS`

`FALSE_DEPRECATION_COUNT = 0`

---

# 8. Batch 3｜后续明确新增 / 明确补强项｜USER APPROVED

> 用户已审查并确认 `P12-B3-01～P12-B3-07`。  
> Batch 3 Gate：`PASS / USER_APPROVED`。  
> 本批只吸收 9/22 以后已经明确补强、且能与 Batch 1～2 及 Completed-PDM Authority 一致合并的规则；真正冲突、缺口和仍需新选择的内容继续进入 Batch 4。

## P12-B3-01｜正式 Matching 前动态重验当前 find-car entitlement

正式 Matching / 重算前必须再次校验 Customer 当前 Customer Level 所配置的 find-car entitlement。

结合 PDM-11 当前 Authority：

- 无 entitlement 的 Customer 仍可提交 Application，Application 保持 pending；
- 只有正式 `active + matching-ready` Demand 才可能进入 Matching；
- entitlement 失效后不得继续产生新的 Match Candidate / Match Result；
- 原 active Demand 按 PDM-11 生命周期进入 `paused`；
- 不新增“无需处理”作为第五种 Demand 主状态；
- entitlement 恢复不会自动恢复 Matching；
- 必须先经正式 resume 回到 active，再重新通过 matching readiness 与 entitlement 校验。

因此 9/22 早期“无资格客户需求标记无需处理”只保留为 UI / 派生处理语义，不得覆盖 PDM-11 的正式 Demand 状态机。

分类：`INFORMED_CHANGE / ALIGNED_WITH_PDM11`

---

## P12-B3-02｜Rule Dictionary 必须是真实可维护业务对象

P06-10 的 Rule Dictionary / 匹配词典不得只是配置空壳。

每条规则至少承载：

- 匹配词 / 表达；
- 标准映射结果；
- 品牌；
- 车系；
- 车型年款 / 适用范围；
- 启用状态；
- 备注；
- 创建人；
- 修改人；
- 修改时间；
- 审计历史。

至少支持真实业务动作：

- 新增；
- 编辑；
- 启用 / 停用；
- 设置适用范围；
- 保存；
- 测试解析；
- 查看必要历史 / 审计。

### 本条未提前冻结

- 普通物理删除是否允许；
- partial failure / retry 的具体产品语义。

上述继续进入后续审查，不得由本条自行外推。

分类：`INFORMED_ADDITION + HISTORICAL_DETAIL_RESTORED`

---

## P12-B3-03｜规则作用域有确定优先级；同级冲突不得猜

Rule Dictionary 的确定性作用域优先顺序：

1. 具体车型 + 具体车型年款；
2. 车系 + 车型年款范围；
3. 车系；
4. 品牌；
5. 全局通用规则。

同一表达命中多个不同作用域时，优先使用更具体规则。

若同一优先级出现互相矛盾的有效映射：

- 不随机选择；
- 不按创建时间静默覆盖；
- 不让 AI 猜；
- 标记规则冲突 / 待确认。

对 Demand 解析：

- 冲突导致正式标准条件无法确定时，该 Demand 不得被视为 matching-ready。

对 Vehicle 对应匹配事实：

- 事实无法确定时进入相应 `confirmation_needed` 路径。

一个匹配词可以映射多个**可确定**的结构化事实，但不得顺带推导实际无法确定的字段。

分类：`INFORMED_REINFORCEMENT / DETERMINISTIC_CONFLICT_RULE`

---

## P12-B3-04｜标准条件支持正向 / 反向表达与 hard / preferred / tolerance 语义

标准条件除“字段值”外，必须表达匹配语义。

至少支持：

- 正向要求，例如“要白色”；
- 反向 / 排除要求，例如“不要事故车”；
- `hard condition`：明确失败 → `no_match`；事实未知 → `confirmation_needed`；
- `preferred` / 优先偏好：未满足不直接 `no_match`，可影响 `high / acceptable`；
- `acceptable / tolerance`：明确允许的偏差范围。

任何 tolerance / 例外都必须是显式规则，不得因为结果太少临时放宽。

局部例外原则：

> 某一条件 / 部件的例外只影响该条件 / 部件，不得把其他 hard condition 一并放宽。

分类：`POST_9_22_INFORMED_ADDITION`

---

## P12-B3-05｜同一匹配事实存在多层证据时采用确定性证据优先级

同一 Matching component 存在多层可用证据时，当前优先级：

> **结构化事实 > 明确检测结果 > 详细车况描述 > 模糊关键词**

规则：

- 低优先级证据不得覆盖更高优先级已明确事实；
- 原始证据与 provenance 全部保留，不因选取当前权威事实而删除低层来源；
- 同一优先级仍发生不可解冲突时，不猜，进入冲突 / 待确认；
- 某一局部 component 的例外或不确定，只影响该 component，不把整辆车其他已明确事实一起降级。

分类：`POST_9_22_EVIDENCE_PRECEDENCE_ADDITION`

---

## P12-B3-06｜Matching 可解释，并提供无副作用测试解析 / 测试匹配

正式确定性 Matching 内部至少能够解释：

- 原始输入；
- 命中的词典 / 规则；
- 标准化后的事实；
- 哪些 hard condition 满足；
- 哪些 hard condition 失败；
- 哪些事实 unknown；
- 哪个 preferred / tolerance 影响了结果；
- 最终为何得到当前四级 Match Result。

P06-10 同时提供：

> **测试解析 / 测试匹配**

输入测试表达后，展示当前规则会解析出的标准事实、冲突与 unknown。

测试行为必须无正式业务副作用：

- 不修改正式 Demand；
- 不生成正式 Match Result；
- 不创建 Recommendation；
- 不创建 Priority；
- 不创建 Lock；
- 不产生正式客户业务关系。

分类：`POST_9_22_EXPLAINABILITY_AND_TEST_ADDITION`

---

## P12-B3-07｜词典变更重算受影响对象，并向 Source Radar 提供 Matching 变化事实

当匹配词典新增 / 修改 / 启停后：

- 重新解析受该规则作用域影响的相关当前在售车辆派生事实；
- 重新解析相关 `active + matching-ready` Demand；
- 重新计算相应 Match Result；
- 只处理受影响范围，不无脑全库扫描；
- 原始 Source Data / 原始文本继续保留；
- 当前结果发生变化时，对后续消费者提供新的 Matching change fact。

职责边界：

- PDM-12 负责正确解析、Match Result 与 Matching change fact；
- Source Radar 对象、聚合、页面、生命周期归 PDM-16；
- PDM-16 不得重新实现第二套 Matching Authority。

本条产生正式 future handoff：

> `HO-P12-P16-001 = HANDOFF_OPEN`

分类：`HISTORICAL_DETAIL_RESTORED / CROSS_PDM_ADDITION`

---

## Batch 3 Current Authority / Conflict Scan 结论

本批明确没有偷渡以下内容：

1. partial failure / retry 的具体业务语义；
2. Rule Dictionary 普通物理删除方式；
3. 旧“变速箱 / 配置偏好 / 过户次数 / 城市距离 / 排放 / source type 不参与 V1 auto Matching”清单的最终命运；
4. 里程最小值特殊历史语义；
5. “无预算 + 价格咨询”的最终四级结果；
6. Priority TTL / 仲裁 / 人工创建 / 完整 lifecycle。

结论：

`BATCH3_CURRENT_AUTHORITY_REFRESH = PASS`

`BATCH3_CONFLICT_SCAN = PASS`

`HO-P12-P16-001 = HANDOFF_OPEN`

---

# 9. Batch 4｜真实冲突 / 语义缺口 / 新产品选择｜USER APPROVED

> 用户已逐项裁决：`1A、2A、3A、4A、5A、6A`，并于 2026-10-05 明确“确认执行”。  
> Batch 4 Gate：`PASS / USER_APPROVED`。

## P12-B4-01｜价格咨询的四级 Matching 语义｜1A

价格维度必须先判断 Demand 是否真正填写预算。

### Demand 未填写预算

预算维度视为**不限**。

因此车辆当前只有“价格咨询”、没有合法数字客户展示价时：

- 不因为价格缺失自动进入 `no_match`；
- 不因为价格缺失自动进入 `confirmation_needed`；
- 价格维度不参与本次四级降级；
- 最终结果由其他已填写 hard / preferred / tolerance 条件共同决定。

### Demand 已填写预算

若车辆没有合法数字客户展示价、当前只能“价格咨询”：

- 无法确定是否满足预算；
- 不得伪造数字价格；
- 不得继续沿用 9/17 “一律 no_match”的旧绝对规则；
- 当前结果进入 `confirmation_needed`；
- 后续价格事实变为合法数字客户展示价时自动重新计算。

若已有合法数字客户展示价，则继续使用 P12-A08：

- `price <= budget` → 预算维度 high；
- `budget < price <= budget × (1 + tolerance)` → acceptable；
- 超出 tolerance → no_match。

分类：`USER_CHOICE / SUPERSEDES_OLD_ABSOLUTE_PRICE_CONSULT_NO_MATCH`

---

## P12-B4-02｜里程只把最高可接受里程作为 hard condition｜2A

V1 正式 Matching 的里程 hard condition 采用：

> **最高可接受里程**

若客户表达“2～5 万公里”等带下限的自然语言：

- 正式 hard condition = `mileage <= 5万公里`；
- 低于 2 万公里仍可符合；
- 所谓“最低里程”不作为 hard lower bound；
- 不因为车辆里程比客户表达的下限更低而判 `no_match`。

如果未来需要“最低里程必须达到某数值”的特殊业务能力，必须另行建立显式规则，不得从普通区间表达自动推导。

分类：`USER_CHOICE / HISTORICAL_SPECIAL_SEMANTIC_RETAINED`

---

## P12-B4-03｜六类字段继续不参与 V1 自动四级 Matching｜3A

以下字段在 V1 **不直接改变正式四级 Match Result**：

1. 变速箱；
2. 配置偏好；
3. 过户次数；
4. 城市 / 距离；
5. 排放标准；
6. 车源类型。

边界：

- 可以作为展示信息；
- 可以作为人工销售判断信息；
- 可以进入客户端搜索 / 筛选（若 PDM-20 后续正式冻结对应搜索能力）；
- 可以保存在客户原始要求 / 销售匹配描述 / 需求说明中；
- 但当前 V1 不把这些字段当作自动 `high / acceptable / confirmation_needed / no_match` 判定条件。

若未来需要把其中某一项加入自动 Matching，必须单独显式升级，不得仅因 Rule Dictionary 已支持通用表达就默认自动纳入。

分类：`USER_CHOICE / V1_AUTO_MATCH_EXCLUSION_RETAINED`

---

## P12-B4-04｜Rule Dictionary 正式规则不普通物理删除｜4A

已保存的正式 Rule Dictionary 规则：

- 不提供普通物理删除；
- 错误 / 过期 / 不再使用时采用停用 / 废弃；
- 保留原 rule_id；
- 保留创建人、修改人、创建时间、修改时间；
- 保留启停 / 变更历史；
- 保留审计与历史解释能力。

停用后：

- 新的解析不再使用该规则；
- 按 P12-A14 / P12-B3-07 对受影响范围重解析 / 重算；
- 历史 Match Result 仍保留当时使用的规则 / 版本 / 解释事实。

分类：`USER_CHOICE / APPEND_ONLY_GOVERNANCE`

---

## P12-B4-05｜Rule Dictionary 变更重算 partial failure 不整体回滚｜5A

Rule Dictionary 新增 / 修改 / 启停正式保存成功后，受影响对象重解析 / 重算采用**部分成功保留**：

- 已成功重解析 / 重算对象保留新结果；
- 单个或部分对象失败不得回滚整次词典修改；
- 失败对象必须明确记录失败事实、失败原因、当前 retry 状态；
- 后续只重试失败集合，不无脑重跑全部成功对象；
- 重试必须幂等。

### 失败对象旧结果的关键边界

词典已经生效、但某对象重算失败时：

> 该对象旧 Match Result 只能作为历史结果，不得继续冒充“当前最新结果”去创建新的 Priority / Recommendation 或其他依赖当前 Match Result 的新业务。

因此至少需要区分：

- current valid result；
- stale / invalidated historical result；
- recalc pending / failed fact。

成功重算后再恢复新的 current Match Result。

分类：`USER_CHOICE / PARTIAL_FAILURE_RETRY`

---

## P12-B4-06｜新增独立敏感能力 matching.rule.manage｜6A

新增正式 capability：

`matching.rule.manage`

用于管理正式 Rule Dictionary / Matching Rule。

### 能执行的动作

具备该 capability 的 active 名邦 Employee 才能执行：

- 新增正式规则；
- 编辑正式规则；
- 启用 / 停用正式规则；
- 修改适用范围；
- 提交会影响正式解析 / Matching 的配置变更。

### 权限模型

继续严格继承 PDM-02：

`identity + permission + data scope + object state`

其中：

- 普通销售 / 经理 / 店长均**不因角色名自动拥有** `matching.rule.manage`；
- 可以由角色模板或员工个人明确授权 / deny 决定；
- 提交时必须重验当前 identity / permission / object state；
- Rule Dictionary 是全局 Matching Authority，当前不建立普通客户级 data scope；
- 4S Member 对 `matching.rule.manage` 为 **hard DENY**；
- System Admin 可以在控制平面配置谁拥有该 permission；
- System Admin 身份本身**不自动拥有 P06-10 正式规则修改能力**；
- 同一真人若需要实际执行规则维护，应使用具备相应 permission 的独立 Employee 身份。

### 测试能力

“测试解析 / 测试匹配”的只读使用权限可在后续页面投影中与正式 manage 动作分开裁剪；本条冻结的是**正式规则写权限**。

分类：`USER_CHOICE / NEW_SENSITIVE_CAPABILITY / PDM02_ALIGNED`

---

## Batch 4 裁决后的 deferred 清零检查

Batch 1～3 曾显式 deferred 的 PDM-12 本域事项现已处理：

- 无预算 + 价格咨询 → P12-B4-01；
- 里程最低值特殊语义 → P12-B4-02；
- 六类字段是否参与 V1 自动 Matching → P12-B4-03；
- Rule Dictionary 物理删除语义 → P12-B4-04；
- partial failure / retry → P12-B4-05；
- P06-10 正式规则维护权限 → P12-B4-06。

仍留到 PDM-13 的：

- Priority TTL；
- Priority 仲裁；
- Priority lifecycle；
- Demand.created_at 在 Priority 仲裁中的具体使用。

这些属于**明确跨域 handoff**，不是 PDM-12 未闭环缺口。

结论：

`PDM12_LOCAL_DEFERRED_UNRESOLVED = 0`

`PDM13_PRIORITY_OUT_OF_SCOPE_ITEMS = EXPLICIT_HANDOFF`

---

## PDM-12 outgoing future handoff

基于已经批准的 PDM-12 规则，后续域必须承接：

- `HO-P12-P13-001`：PDM-13 只消费 PDM-12 当前合法 Match Result，不复制第二套 Matching；`confirmation_needed / no_match` 不得作为 Priority 成功匹配；
- `HO-P12-P14-001`：Match Result 不自动等于 Recommendation / visibility grant；
- `HO-P12-P16-001`：Matching change fact 交 Source Radar 消费；
- `HO-P12-P20-001`：客户端车源主页搜索共用 PDM-12 Rule Dictionary / deterministic parser，但搜索不创建 Match Result；
- `HO-P12-P21-001`：员工端承载四级候选、解释、人工确认与失败 / stale 结果边界；
- `HO-P12-P22-001`：PC P06-10 承载 Rule Dictionary 真正 Action、`matching.rule.manage`、PROCESSING / PARTIAL_FAILURE / retry；
- `HO-P12-P25-001`：审计规则变更、启停、Match Result 历史、recalc failure/retry、解释 provenance。

上述 handoff 只传递已批准 Authority，不新增产品决策。

---

## Batch 4 Gate

```text
P12_B4_01 = 1A / USER_APPROVED
P12_B4_02 = 2A / USER_APPROVED
P12_B4_03 = 3A / USER_APPROVED
P12_B4_04 = 4A / USER_APPROVED
P12_B4_05 = 5A / USER_APPROVED
P12_B4_06 = 6A / USER_APPROVED
PDM12_BATCH_4 = PASS / USER_APPROVED
PDM12_LOCAL_DEFERRED_UNRESOLVED = 0
```

---

# 10. Final 前完整性修复｜P12-LIA-01～06｜USER APPROVED

> 第一轮 Final 前 Full Evidence Matrix / 双向追溯发现 6 组“证据已经明确、但 Batch 1～4 未独立写透”的信息保真缺口。  
> 用户已确认 `P12-LIA-01～P12-LIA-06 = ALL USER_APPROVED`，并于 2026-10-05 明确“确认执行”。  
> 本节不构成第 5 个产品裁决 Batch；只把已有 Authority 补成语义完整、可交接、可审计的正式规则。

## P12-LIA-01｜客户未填写某项条件 = 该项不限

对正式 Demand 的每一个可匹配条件：

- Customer / Sales 未形成该项正式标准条件 → 该项视为**不限**；
- “未填写”不是 vehicle fact unknown；
- “未填写”不得产生 `confirmation_needed`；
- 系统不得自行猜出一个限制值；
- 未填写字段不得因为默认值、空值或 UI placeholder 被误当 hard condition。

P12-B4-01 的：

> Demand 未填写预算 → 价格维度不限

只是本总规则在预算维度的具体实例。

若某项**已经形成正式 hard condition**，但 Vehicle 对应事实缺失 / 冲突 / 无法确定，才进入该 component 的 `confirmation_needed` 语义。

---

## P12-LIA-02｜Matching readiness 完整定义

Demand 主状态与 Matching readiness 继续严格分层。

至少区分以下业务事实：

### 尚未 ready

包括但不限于：

- 尚未形成销售匹配描述；
- 销售匹配描述尚未完成确定性解析；
- 解析结果无法形成任何合法、可执行的正式标准条件集；
- 规则冲突严重到当前无法确定应该按什么条件执行 Matching。

此时即使 Demand = `active`，也不得启动正式 Matching。

### ready

满足：

- Demand = `active`；
- 当前 find-car entitlement / Customer account 等 PDM-11 Guard 合法；
- 销售匹配描述已保存；
- 已完成确定性解析；
- 已形成可执行标准条件。

### 部分条件待确认但仍可继续 Matching

若：

- 已存在一组合法、可执行的确定条件；
- 另有部分 component 存在规则冲突 / vehicle fact unknown / 待人工确认；

则不得把整个 Demand 一刀切成“停止 Matching”。

系统应：

- 使用已确定条件继续计算；
- 涉及未确认 hard condition 的具体 Demand×Vehicle 进入 `confirmation_needed`；
- 不得自动判 high/acceptable；
- 待事实确认后只重跑受影响范围。

技术实现可使用 `pending_definition / ready / ready_with_confirmation_needed` 或等价字段，但产品 Authority 不强制具体枚举名。

---

## P12-LIA-03｜confirmation_needed 是局部不确定，不占车、不排他

`confirmation_needed` 只表达：

> **某一个 Demand × 某一个 Vehicle 在当前某个已填写 hard condition 上存在事实不确定。**

因此它：

- 不占用 Vehicle；
- 不形成 exclusive visibility；
- 不阻断其他 Customer / Demand 对同一 Vehicle 独立执行 Matching；
- 不创建 Priority；
- 不创建 Recommendation；
- 不授予客户详情可见权；
- 不创建 Lock；
- 不改变 owner / responsible。

A Customer 对某 Vehicle 为 `confirmation_needed`，不影响 B / C Customer 在各自条件下得到独立的 high / acceptable / confirmation_needed / no_match。

确认只补事实并重算，不能把“确认动作”误实现成占车或成功匹配动作。

---

## P12-LIA-04｜补齐进入 / 退出当前 Matching 集合的事件

P12-A14 的“关键事实变化重算”补齐为完整生命周期事件集。

### 进入 / 首次计算

至少包括：

- 新 Vehicle 进入真实可售 + 当前允许 Matching 的状态；
- Vehicle 从不可参与状态恢复到真实可售 / 可参与 Matching；
- Demand 首次满足 `active + matching-ready`；
- Demand readiness 从不可执行 → 可执行；
- paused Demand 正式 resume，且重新通过 entitlement / account / readiness Guard。

### 当前结果重算

继续包括：

- 标准条件变化；
- 销售匹配描述变化；
- Vehicle 关键事实变化；
- 合法客户展示价变化；
- unknown → known；
- known fact 改变；
- Rule Dictionary 新增 / 修改 / 启停影响对应作用域。

### 退出当前有效 Matching

至少包括：

- Demand → paused / completed / cancelled；
- Customer disable / find-car entitlement 丧失按 PDM-11 导致 active → paused；
- Demand readiness 失效；
- Vehicle → offline / unavailable / sold / unpublished draft / 其他明确不可参与普通 Matching 的真实状态；
- Rule / fact 变化使旧结果失效。

退出时：

- 历史 Match Result 不物理删除；
- 旧结果必须失去 `current valid result` 身份；
- stale / invalidated 结果不得继续创建新的 Priority / Recommendation 或其他依赖当前 Match Result 的新业务。

---

## P12-LIA-05｜active Lock 本身不等于 Vehicle 不可 Matching

Lock 属于业务占用事实，不等于车辆真实不可售事实。

因此：

- Vehicle 存在 active Lock，但底层仍真实可售、listing_cycle 有效、其他 PDM-12 Matching Guard 合法时，仍可为其他 Demand 产生 Match Result；
- Match Result 必须能够携带 / 投影“当前已锁定 / 占用”的真实业务事实；
- “high / acceptable”只表示条件匹配，不表示该 Customer 当前可以直接 Lock；
- 不得因为 Match Result 成功绕过 active Lock 唯一性；
- 其他 Customer 的后续候补 / Lock 动作归 PDM-18；
- Priority 对 active Lock 的资格 / 结束 / 接管边界归 PDM-13。

本条**不外推 Transaction 状态下是否继续产生新的普通 Match Result**；Transaction 相关真实可售 / 新业务 Guard 继续服从对应车辆与交易域 Authority。

新增 future handoff：

`HO-P12-P18-001 = HANDOFF_OPEN`

---

## P12-LIA-06｜人工确认权限 + PDM-20/PDM-21 carrier/handoff 精度

### A. confirmation_needed 人工确认的执行主体

人工确认属于名邦 Customer / Demand / Matching 业务动作，不是公共浏览动作。

允许执行者：

- 当前 Demand responsible employee；或
- 当前具备相应业务 permission + data scope + object state 的 active 名邦 Employee。

边界：

- 4S Member 受名邦 Customer / CRM 域 hard DENY；
- System Admin 身份本身不自动获得该业务执行能力；
- 同一真人如需执行业务，使用合法 Employee 身份；
- UI 显示按钮不替代提交时的 server-side identity / permission / data scope / object state 重验；
- 确认动作只补事实 / 选择合法事实来源并触发重算，不允许直接写死最终 tier。

### B. PDM-20 客户端搜索 handoff 精度

PDM-20 必须同时遵守：

1. 搜索文本与 Demand Matching 共用 PDM-12 deterministic parser / Rule Dictionary；
2. 搜索解析得到的**车型年款**不得与客户端主筛选“首次上牌年份”混成同一字段；
3. P12-B4-03 六类字段“不参与 V1 自动四级 Matching”不等于“客户端禁止搜索/筛选这些字段”；
4. Demand Matching 的“未填预算 + 价格咨询可继续匹配”不得污染客户端明确数字价格筛选；
5. 客户端设置明确数字价格区间时，“价格咨询”车辆不参与该数字价格区间结果。

### C. PDM-21 员工端 handoff 精度

E05-06 等员工端人工确认不得实现为：

> 确认候选 → 直接成功 Match / 直接具备 Priority 资格

必须实现为：

> 确认合法事实 → 触发受影响范围重算 → 读取新的正式四级 Match Result → 下游再按各自 Guard 处理。

---

## Final 前 stale carrier 登记

以下仅登记，当前不施工 IA / Low-Fi：

1. E05-06 仍可能存在“确认候选 → 直接进入 Priority/成功匹配”的旧投影；
2. E05-05 HIDDEN_CONTROLLED 仍可能存在“Demand/Priority 本身直接授客户隐藏车详情可见”的旧投影；
3. E05-04 尚未完整承载“保存销售匹配描述 → 确定性解析 → 更新标准条件 → 受影响范围重算”真人 Action；
4. P06-10 仍偏 `NORMAL / PROCESSING / PARTIAL_FAILURE / ERROR` 通用状态壳，缺真实 Rule Dictionary Action Contract；
5. Current carrier 对“正式 Matching 禁止 AI 猜测”表达不足；
6. Current carrier 对“主页搜索与 Demand Matching 共用 parser / dictionary”表达不足。

统一状态：

`STALE_CARRIER / DEFERRED_TO_POST_PDM25_IA_LOWFI_ALIGNMENT`

---

## Final 前完整性复核二次结果

在 P12-LIA-01～06 补齐后，重新执行：

- Full Evidence Matrix；
- Source→Atom；
- Atom→Source；
- Semantic Completeness；
- Completed-PDM Invariant Scan；
- Cross-PDM Handoff Integrity；
- Current / IA / Low-Fi stale carrier scan；
- Negative Claim / supersession check。

结果：

```text
PDM12_PREFINAL_REPAIR = P12-LIA-01～06 / USER_APPROVED / APPLIED
SOURCE_TO_ATOM = PASS
ATOM_TO_SOURCE = PASS
SEMANTIC_COMPLETENESS = PASS
COMPLETED_PDM_INVARIANT = PASS
CROSS_PDM_HANDOFF_INTEGRITY = PASS
STALE_CARRIER_LEDGER = REGISTERED
NEGATIVE_CLAIMS_VERIFIED = PASS
PDM12_LOCAL_DEFERRED_UNRESOLVED = 0
PDM12_PREFINAL_INTEGRITY = PASS
PDM12_FINAL_CANDIDATE = READY_FOR_USER_REVIEW
```

---

# 11. Batch Gate

```text
PDM12_STARTUP_GATE = PASS
PDM12_INCOMING_HANDOFFS = 4/4 HANDOFF_ACCEPTED
PDM12_CURRENT_AUTHORITY_REFRESH = PASS
PDM12_CURRENT_IMPLEMENTATION_FACT = PASS
PDM12_BATCH_1 = PASS / USER_APPROVED
P12_A01_TO_A15 = USER_APPROVED
M03_001_003_SOURCE_TO_ATOM_AUDIT = PASS_AFTER_A15_REPAIR
UNMAPPED_STABLE_BATCH1_RULE = 0
PDM12_BATCH_2 = PASS / USER_APPROVED
P12_B2_01_TO_B2_10 = USER_APPROVED
BATCH2_REVERSE_CONFLICT_SCAN = PASS
PDM12_BATCH_3 = PASS / USER_APPROVED
P12_B3_01_TO_B3_07 = USER_APPROVED
BATCH3_CURRENT_AUTHORITY_REFRESH = PASS
BATCH3_CONFLICT_SCAN = PASS
HO_P12_P16_001 = HANDOFF_OPEN
PDM12_BATCH_4 = PASS / USER_APPROVED
P12_B4_01_TO_B4_06 = USER_APPROVED
PDM12_LOCAL_DEFERRED_UNRESOLVED = 0
PDM12_PRE_FINAL_REPAIR = P12-LIA-01～06 / USER_APPROVED / APPLIED
PDM12_PRE_FINAL_INTEGRITY = PASS
PDM12_SOURCE_TO_ATOM = PASS
PDM12_ATOM_TO_SOURCE = PASS
PDM12_SEMANTIC_COMPLETENESS = PASS
PDM12_CROSS_PDM_HANDOFF_INTEGRITY = PASS
PDM12_STALE_CARRIER_LEDGER = REGISTERED
PDM12_FINAL = NOT_PUBLISHED / FINAL_CANDIDATE_READY_FOR_USER_REVIEW
```

## 当前唯一下一步

> **生成 PDM-12 Final Domain Overview 候选：必须逐项覆盖 Batch 1～4 + P12-LIA-01～06 + incoming/outgoing handoff + stale carrier ledger，并执行 Final→Source 反查。生成后提交用户最终审查，未经用户最终批准不得发布 PDM-12 Final、不得开始 PDM-13、不得修改 IA / Low-Fi。**
