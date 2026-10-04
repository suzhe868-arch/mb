# PDM-12｜Matching / 匹配词典 / 四级结果 / 人工确认｜规则原子重建工作版

> 日期：2026-10-05  
> 当前状态：`IN_PROGRESS / BATCH_1_PASS / USER_APPROVED`  
> 业务权威语言：中文（zh-CN）  
> 当前域：PDM-12｜Match Candidate / Match Result / Rule Dictionary  
> 当前硬门禁：Batch 1 已完成用户审查；未经下一批用户审查，不得自动批准 Batch 2～4，不得修改 IA / Low-Fi。

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

# 6. Batch 1 明确未裁决 / 不偷渡项

以下内容不因 Batch 1 通过而自动批准：

1. 历史“最低里程”特殊规则；
2. 变速箱 / 配置偏好 / 过户次数 / 城市距离 / 排放 / source type 等字段最终是否进入 V1 自动 Matching；
3. VR-P-021 的正向 / 负向表达、hard / preferred / acceptable、局部例外容差、组件级规则；
4. VR-P-022 的证据优先级：
   - structured
   - explicit inspection
   - detailed condition
   - vague keyword
5. VR-E-015 的客户等级 / Matching entitlement 前置关系与 PDM-11 当前生命周期语义；
6. “无预算 + 价格咨询”最终四级边界；
7. P06-10 完整词典治理、Action、scope priority、same-level conflict、test-match、失败重试；
8. Priority 仲裁 / TTL / Demand.created_at 使用方式——归 PDM-13，不在 PDM-12 偷渡冻结。

---

# 7. Batch Gate

```text
PDM12_STARTUP_GATE = PASS
PDM12_INCOMING_HANDOFFS = 4/4 HANDOFF_ACCEPTED
PDM12_CURRENT_AUTHORITY_REFRESH = PASS
PDM12_CURRENT_IMPLEMENTATION_FACT = PASS
PDM12_BATCH_1 = PASS / USER_APPROVED
P12_A01_TO_A15 = USER_APPROVED
M03_001_003_SOURCE_TO_ATOM_AUDIT = PASS_AFTER_A15_REPAIR
UNMAPPED_STABLE_BATCH1_RULE = 0
PDM12_BATCH_2 = NOT_STARTED
PDM12_FINAL = NOT_READY
```

## 当前唯一下一步

> **按 Conflict Before Classification 继续形成 PDM-12 Batch 2（废弃 / 禁止恢复项）候选；必须先做反向冲突扫描与 Source→Atom 去向检查。形成候选后停下提交用户审查，不得自动批准，不得修改 IA / Low-Fi。**
