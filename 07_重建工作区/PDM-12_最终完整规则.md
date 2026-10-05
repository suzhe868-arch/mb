# PDM-12｜Matching / 匹配词典 / 四级结果 / 人工确认｜最终完整规则

> 日期：2026-10-05  
> 状态：`COMPLETE / INTEGRITY_PASS`  
> Batch 1～4：`ALL_USER_APPROVED`  
> P12-LIA-01～06：`ALL_USER_APPROVED / APPLIED`  
> Final User Approval：`PASS / 2026-10-05`  
> Source→Final / Final→Source：`PASS`  
> 未决产品冲突：`0`  
> 本文件为 PDM-12 当前正式中文产品 Authority。

---

## 1. PDM-12 的业务边界

PDM-12 负责 Rule Dictionary / 匹配词典、确定性解析、Matching readiness、Demand × Vehicle 的正式 Match Result、\`high / acceptable / confirmation_needed / no_match\` 四级结果、hard / preferred / tolerance、人工事实确认、Matching 重算、Match Result 当前有效/stale/history 边界、Matching change fact，以及客户端搜索与正式 Demand Matching 的共享解析层。

PDM-12 不直接创建或决定 Customer owner、Recommendation、Priority、Lock、Waitlist、Transaction、客户详情可见权；这些对象必须服从各自后续 PDM。

---

## 2. 只有正式 active + matching-ready Demand 才进入 Matching

Application 本身不参与正式 Matching。正式 Matching 至少同时满足：对象是正式 Demand；Demand 主状态=\`active\`；Customer 当前账号状态合法；当前 Customer Level 仍具备 find-car entitlement；当前 Demand 已通过 matching readiness。

因此 pending Application、paused、completed、cancelled Demand 不 Matching；\`active\` 不代表天然 ready；entitlement 丧失或 Customer disable 导致 active→paused 后停止 Matching；正式 resume 时必须重新检查 entitlement、账号状态和 readiness。

---

## 3. Matching readiness 与 Demand 主状态严格分离

尚未形成销售匹配描述、尚未完成确定性解析、无法形成任何合法可执行标准条件、或同级规则冲突严重到无法确定正式条件集时，即使 Demand=active，也不得开始正式 Matching。

ready 至少要求：active；entitlement/account Guard 合法；销售匹配描述已保存；确定性解析完成；已形成可执行标准条件。

如果已有合法可执行条件，只是部分 component 有冲突或未知，不停止整个 Demand；继续使用已确定条件 Matching，涉及未知 hard condition 的具体 Demand×Vehicle → \`confirmation_needed\`，确认事实后只重算受影响范围。具体工程枚举名不在产品层写死。

---

## 4. 找车信息分层，不允许压成一个备注

正式信息至少分为：客户原始要求、销售匹配描述、标准匹配条件、需求说明/业务背景、CRM 跟进。

正式链路：

> 客户原始表达 → 销售沟通整理 → 销售匹配描述 → Rule Dictionary / 确定性解析 → 标准匹配条件 → Matching

客户原话必须保存但不是自动 Matching 主输入；销售匹配描述是主要正式解析输入；需求说明、业务背景、CRM 跟进不得偷偷参与 Matching。

---

## 5. V1 正式 Matching 禁止 AI 猜测

正式 Matching 使用标准车型事实、Rule Dictionary、deterministic parser、结构化比较。不得让 AI 猜客户话术的正式条件、缺失车辆事实、车况、车型/版本，不得自动补客户没有表达的限制条件，也不得用概率结果替代四级 Matching Authority。

---

## 6. 客户没有填写某项条件 = 该项不限

Customer / Sales 没有形成某项正式标准条件时，该字段=不限。未填写≠unknown；未填写不会产生 \`confirmation_needed\`；不得从默认值、placeholder、空值猜出限制，也不得自动补 hard condition。

只有客户已经形成正式 hard condition、但车辆对应事实缺失/冲突/无法确定时，才属于该 component 的 \`confirmation_needed\`。

---

## 7. Matching 基础组合规则

同一字段多个合法值使用 OR；不同字段之间使用 AND。已填写并定义为 hard condition 的条件不得因为结果太少、无结果或销售希望多找几辆而静默放宽。

无结果时只能等待新车源、由客户/有权员工正式修改 Demand，或进入合法确认流程。不得使用“最近似车辆”冒充正式匹配成功。

---

## 8. 正式 Match Result 固定四级

- \`high\`：所有已填写 hard condition 明确满足；预算处于 high 范围；相关 preferred condition 满足。
- \`acceptable\`：hard condition 均满足，但命中明确允许的 tolerance，或 preferred condition 未满足。
- \`confirmation_needed\`：客户已填写 hard condition，但 Vehicle 对应事实缺失、冲突或无法确定。它代表事实不确定，不是较差的 acceptable。
- \`no_match\`：至少一个 hard condition 明确失败，或命中其他正式 no-match rule。

---

## 9. confirmation_needed 的完整边界

\`confirmation_needed\` 是某一个 Demand × Vehicle 的局部事实不确定。它不占车、不排他、不阻止其他 Customer/Demand 对同一 Vehicle Matching，也不创建 Priority、Recommendation、客户可见权、Lock 或 owner 变化。

人工确认只能补充/确认合法事实 → 重新 Matching；确认按钮本身不得直接把结果改为 high/acceptable。重新计算后可变为 high、acceptable 或 no_match。

---

## 10. 当前字段级 Matching 语义

- 车型年款：最低可接受车型年款；更新年款可满足；与首次上牌年份是不同字段。
- 里程：V1 hard condition 只采用最高可接受里程。“2～5 万公里”正式 hard condition 是 \`mileage <= 5万\`；低于 2 万仍可匹配；最低里程不作为 hard lower bound。
- 外观颜色：hard，可多选。
- 排量：hard，支持范围/多值。
- 动力类型：hard，可多选。
- 车况排除条件：hard exclusion。
- 内饰颜色：preferred/soft preference；不满足可 high→acceptable，但不能单独导致 no_match。

---

## 11. 六类字段继续不参与 V1 自动四级 Matching

变速箱、配置偏好、过户次数、城市/距离、排放标准、车源类型不直接改变四级 Match Result。

它们仍可展示、用于人工销售判断、保存在客户要求/销售描述，并可在后续客户端搜索/筛选域合法使用。不能因为 Rule Dictionary 可以解析它们就自动升级为 V1 hard Matching condition；未来如需纳入必须显式升级规则。

---

## 12. 正向、反向、hard、preferred、tolerance

标准条件至少支持正向要求、反向要求、hard、preferred、acceptable/tolerance。tolerance 必须提前显式定义，不能因为无结果临时产生；局部例外只影响对应 condition/component，不能把其他 hard condition 一起放宽。

---

## 13. 预算与客户展示价

Matching 预算只能使用 PDM-10 当前合法客户展示价，禁止使用批发价、内部价、底价。LIMITED 客户前端暂时看不到精确数字，不代表后台合法客户展示价不存在。

Demand 已填写预算且有合法数字客户展示价时，默认 tolerance=5%：
- \`price <= budget\` → 预算维度 high；
- \`budget < price <= budget × 105%\` → acceptable；
- \`price > budget × 105%\` → no_match。

默认 5% 后续可由合法全局配置调整。

Demand 没有填写预算时，价格维度不限；即使 Vehicle 只能显示“价格咨询”，也不会因为价格本身产生 no_match/confirmation_needed。

Demand 已填写预算但 Vehicle 只能“价格咨询”时，因为无法判断是否超预算 → \`confirmation_needed\`；不得伪造数字价格；价格变成合法数字客户展示价后重新计算。

---

## 14. JYT 车型事实与本地主数据 mapping 分层

JYT 已明确提供品牌、车系、车型年款、具体车型/款型时，即使 \`vehicle_model_id=NULL\`、local mapping pending、本地车型字典未补齐，这些上游明确事实仍可用于精确搜索与自动 Matching。

不得因 local mapping pending 把已知事实降为 unknown/confirmation_needed，或阻止本来合法的 Matching。

---

## 15. 车况事实与证据 provenance

必须保留 JYT 原始车况描述、原始标签、检测结果、人工维护事实、派生标准事实与 provenance。Rule Dictionary 派生结果不得覆盖原始事实；能确定才标准化，不能确定保持 unknown/confirmation_needed。

不得为 Matching 恢复旧“大而全”的完整结构化车况字段体系，也不要求所有 Vehicle 先补齐整套旧字段。

---

## 16. 同一 Matching fact 的证据优先级

> 结构化事实 ＞ 明确检测结果 ＞ 详细车况描述 ＞ 模糊关键词

低级证据不得覆盖高级已明确事实；所有原始 provenance 保留；同级仍不可解冲突则不猜；局部冲突只影响对应 component。

---

## 17. hidden、offline、saleability 与 Matching

\`platform_visibility=hidden\` 只表示不进入对应公开展示面，不表示 offline、unavailable、sold 或不可售。

hidden + 真实可售 + 其他 Guard 合法时可以内部 Matching；offline/unavailable/sold/unpublished draft 等真正不可参与状态不进入普通 Matching。

Match Result 本身绝不授客户隐藏 Vehicle 详情可见权；后续客户可见必须经过独立 Recommendation/visibility grant Authority。

---

## 18. active Lock 不阻止继续产生 Match Result

active Lock 是业务占用事实，不是车辆真实不可售的同义词。Vehicle 有 active Lock，但底层仍真实可售、listing_cycle 有效、其他 Matching Guard 合法时，仍可对其他 Demand 产生 Match Result，并必须携带“当前已锁/已占用”事实。

即使结果 high/acceptable，也不代表当前 Customer 可以直接 Lock。Priority 与 active Lock 的关系已由 PDM-13 Final 冻结：active Lock 不阻断 Matching，但阻止新 Priority；正式 Lock 成立结束 active Priority，Lock 取消/到期不恢复旧 Priority。Waitlist/Lock 完整状态机仍归 PDM-18。PDM-12 不外推 Transaction 状态机。

---

## 19. 一套公共 Matching，不恢复第二套客户专属算法

V1 只有一套公共 Matching Engine。普通 Demand 和未来具有 Priority 资格的 Demand 使用同一标准条件、同一四级 Match Result、同一确定性 Authority。

不得恢复独立客户专属匹配对象、设为/解除客户专属、客户专属 Vehicle list、Priority 专用第二套匹配算法。Priority 只能消费 PDM-12 当前合法 Match Result。

---

## 20. Match Result 与后续业务对象彻底分离

Match Result 只表示 Demand × Vehicle 当前匹配事实。high/acceptable 不等于 Recommendation；Match Result 不等于 Priority、Lock、visibility grant 或 Customer owner 变化。

禁止“一匹配成功就自动给客户看 / 自动推荐 / 自动锁车 / 自动 Priority”。

---

## 21. Rule Dictionary 是真实业务治理对象

Rule Dictionary 至少保存匹配词/表达、标准映射、品牌、车系、车型年款/适用范围、启用状态、备注、创建人、修改人、创建/修改时间、审计历史。

至少支持新增、编辑、启用、停用、修改适用范围、保存、测试解析、查看必要历史/审计。

---

## 22. Rule Dictionary 作用域优先级

优先级：具体车型+具体车型年款 ＞ 车系+年款范围 ＞ 车系 ＞ 品牌 ＞ 全局。

更具体作用域优先。同级冲突不得随机、按创建时间静默覆盖或让 AI 猜，必须标记冲突/待确认。

Demand 因规则冲突无法形成可执行条件集时不 matching-ready；Vehicle 对应事实无法确定时走 confirmation_needed。

---

## 23. Rule Dictionary 正式规则不普通物理删除

已保存正式规则不普通物理 Delete，采用停用/废弃，保留 rule_id、before/after、创建/修改/启停历史及过去 Match Result 的解释能力。

停用后后续解析不再使用，并对受影响范围触发重解析/重算；历史结果继续保留当时规则事实。

---

## 24. 正式规则写权限

正式敏感 capability：\`matching.rule.manage\`。只有 active 名邦 Employee + 合法 permission 才能新增、编辑、启停、修改 scope、正式保存影响 Matching 的配置。

普通销售、经理、店长均不因角色自动拥有；可由 role template/individual allow-deny 配置。4S Member=hard DENY。System Admin 可配置谁有 permission，但 System Admin 身份本身不自动取得 Matching 业务修改能力；同一真人如需操作，应使用合法 Employee identity。

---

## 25. 人工 confirmation 权限

人工确认必须由当前 Demand responsible employee，或当前 identity+permission+data scope+object state 全部合法的 active 名邦 Employee 执行。

4S Member hard DENY；System Admin 身份不自动获得该业务执行权；提交时必须 server-side 重验。确认只能补合法事实→重算，不得直接写最终 tier。

---

## 26. Matching 必须可解释

正式 Match Result 至少能追溯原始输入、命中的 Dictionary Rule、标准化事实、hard condition 满足/失败/unknown、preferred/tolerance 对 tier 的影响，以及最终结果原因。

---

## 27. 测试解析 / 测试匹配无业务副作用

P06-10 应提供测试解析/测试匹配，展示标准化事实、Rule 命中、unknown、conflict、预期解析结果。

测试不得修改正式 Demand、产生正式 Match Result、创建 Recommendation/Priority/Lock 或改变客户业务关系。

---

## 28. Matching 采用事件驱动 + 受影响范围重算

不得恢复“定时全库 Vehicle × Demand 扫描作为唯一机制”。正式原则：event-driven + affected-scope recalculation。定时任务只能必要兜底；不得每次 Rule Dictionary 修改就无脑全库重跑。

---

## 29. Matching 进入、重算与退出当前有效集合

进入/首次计算包括：新 Vehicle 进入真实可售/可 Matching；Vehicle 从不可参与恢复；Demand 首次 \`active+matching-ready\`；readiness 从不可执行→可执行；paused Demand 正式 resume 后重新通过所有 Guard。

重算包括：Demand 标准条件变化、销售匹配描述变化、Vehicle 关键事实变化、合法客户展示价变化、unknown→known、known fact 改变、Rule Dictionary 新增/修改/启停。

退出当前有效 Matching 包括：Demand paused/completed/cancelled；entitlement/disable 导致 paused；readiness 失效；Vehicle offline/unavailable/sold/unpublished draft；其他真实不可 Matching 状态。

旧 Match Result 不物理删除，转为历史/stale/invalidated，不再视为 current valid，也不得继续驱动新的 Priority/Recommendation。

---

## 30. Rule Dictionary 重算 partial failure

规则保存成功后，受影响对象重算允许部分成功；不得因为一个对象失败回滚整次 Rule Dictionary 修改。

成功对象保留新结果；失败对象记录原因并进入 pending retry/failed fact；只重试失败集合；retry 必须幂等。

若 Rule 已生效但某 Vehicle/Demand 重算失败，其旧 Match Result 只能保留为历史，不得冒充当前最新结果继续新建 Priority、Recommendation 或其他依赖 current Match Result 的新业务。

---

## 31. Matching change fact 与 Source Radar

Rule/Vehicle/Demand 变化导致 Match Result 改变时，PDM-12 负责重解析、重算并产生可追溯 Matching change fact。PDM-16 Source Radar 负责消费这些变化，不得再造第二套 Matching Engine。

---

## 32. 客户端车源搜索与 Matching 共用 parser / dictionary

车源主页搜索与正式 Demand Matching 共用 Rule Dictionary、deterministic parser、alias、synonym、standard mapping。

例如 \`26款 奥迪A6\` 应解析成结构化车型事实，不得退化成普通字符串 contains/fuzzy keyword 搜索。

搜索消费 structured search/filter，不创建业务 Match Result；Demand Matching 从销售匹配描述生成标准条件并产生正式四级 Match Result。

---

## 33. 搜索字段与 Matching 字段不能错误混用

搜索 parser 得出的车型年款不能与客户端主筛选首次上牌年份混为一字段。

六类 auto-Matching 排除字段不参与 V1 自动四级 Matching，不代表客户端禁止用它们搜索/筛选。

Demand 未填预算时“价格咨询”可继续 Matching；但客户端明确设置数字价格区间时，“价格咨询”Vehicle 不参与该数字价格区间结果。两套语义不得互相污染。

---

## 34. 明确禁止恢复的旧方向

不得恢复：第二套客户专属 Matching；设为/解除客户专属体系；主页搜索退化成简单关键词 contains；客户原话直接自动 Matching；客户原话经 AI 猜测生成正式条件；local mapping pending 就把 JYT 已明确车型事实降 unknown；hidden=offline/unavailable；猜缺失车况；恢复旧整套大而全结构化车况字段；无结果自动放宽；closest/nearest fallback；Match Result 自动创建 Recommendation/Priority/Lock/visibility/owner；定时全库扫描作为唯一更新机制；普通物理删除正式 Rule Dictionary；stale Match Result 继续驱动新下游业务。

---

## 35. Future Handoff

- PDM-13：`HANDOFF_CLOSED`。PDM-13 Final §§4-14,21-23,29-30 已承接：只消费 current legal Match Result；high/acceptable 才能驱动 Priority；confirmation_needed/no_match 不支持 current Priority；Match tier downgrade 立即重评；active Lock 不阻断 Matching 但阻止新 Priority；TTL、仲裁、Demand.created_at、trigger Demand、release/re-arbitration 与 Lock/Transaction 边界均已冻结。
- PDM-14：Match Result 不自动 Recommendation，不自动授客户可见权。
- PDM-16：消费 Matching change fact，不复制 Matching Authority。
- PDM-18：active Lock 不阻止 Matching，但不能绕过单车唯一 active Lock；其他客户后续 Waitlist/Lock 动作归 PDM-18。
- PDM-20：搜索共用 parser/dictionary；车型年款与上牌年份分离；数字价格区间仍排除价格咨询；六类 auto-Matching 排除字段仍可作为合法筛选项。
- PDM-21：承载保存销售匹配描述→deterministic parse→standard conditions→Matching/recalculation→four-tier result→explanation→confirmation；不得把确认候选实现成直接 Match 成功/直接 Priority。
- PDM-22：承载真实 P06-10 Rule Dictionary 的 Action、permission、scope、test、history、PARTIAL_FAILURE、retry。
- PDM-25：统一审计 Rule before/after、actor、time、scope、Match Result 历史、explanation、stale invalidation、retry、confirmation actor、provenance、confirmation 前后结果。

---

## 36. IA / Low-Fi stale carrier

当前只登记不施工：

1. E05-06 仍可能存在“确认候选→直接成功/Priority”的旧语义；
2. E05-05 HIDDEN_CONTROLLED 仍可能存在“Demand/Priority 直接授隐藏车详情权”；
3. E05-04 缺完整销售匹配描述保存→解析→条件→重算 Action；
4. P06-10 仍偏通用 \`NORMAL / PROCESSING / PARTIAL_FAILURE / ERROR\` 壳；
5. Current carrier 对正式 Matching 禁止 AI 猜测表达不足；
6. Current carrier 对 Search/Matching 共用 parser/dictionary 表达不足。

统一：\`STALE_CARRIER / DEFERRED_TO_POST_PDM25_IA_LOWFI_ALIGNMENT\`。不得用 stale carrier 反向覆盖 PDM-12 Authority。

---

## 37. Final Integrity

PDM-12 已完成 Batch 1～4 与 P12-LIA-01～06 的全部用户批准。

Source→Atom、Atom→Source、Source→Final、Final→Source、Semantic Completeness、Completed-PDM Invariant、Cross-PDM Handoff Integrity、Negative Claims 均 PASS；stale carrier 已登记。

\`\`\`text
MISSING_RULE_UNRESOLVED = 0
SEMANTIC_DETAIL_GAP_UNRESOLVED = 0
CROSS_PDM_CONFLICT = 0
HANDOFF_GAP_UNRESOLVED = 0
PDM12_LOCAL_DEFERRED_UNRESOLVED = 0
\`\`\`

44 个正式 Atom（P12-A01～A15、P12-B2-01～B2-10、P12-B3-01～B3-07、P12-B4-01～B4-06、P12-LIA-01～LIA-06）全部进入当前 Final。

---

## 38. Final Gate

用户已于 2026-10-05 最终批准本 Final Domain Overview，正式发布门禁已解除。

当前状态：

> **\`PDM-12 = COMPLETE / INTEGRITY_PASS\`**

正式 Authority：

> \`07_重建工作区/PDM-12_最终完整规则.md\`

incoming handoff 已全部关闭并完成 source backwrite。

下一域允许进入：

> **PDM-13｜Priority / 仲裁 / TTL / active Lock 边界**

IA / Low-Fi / Engineering 继续禁止提前施工。
