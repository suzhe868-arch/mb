# PDM-12｜Matching / 匹配词典 / 四级结果 / 人工确认｜规则原子重建工作版

> 日期：2026-10-05  
> 当前状态：`IN_PROGRESS / STARTUP_GATE_OPEN / EVIDENCE_RECONSTRUCTION_PENDING`  
> 业务权威语言：中文（zh-CN）  
> 当前域：PDM-12｜Match Candidate / Match Result / Rule Dictionary  
> 执行边界：当前只完成 PDM-12 启动、incoming handoff 接收与证据范围建立；尚未形成任何 Batch 1～4 产品结论。

---

## 1. 启动门禁

PDM-11 已：

- Final 用户批准；
- 正式 Final 发布；
- Source→Final / Final→Source 双向追溯 PASS；
- Final Integrity = PASS；
- `HO-P01-P11-002 = HANDOFF_CLOSED`。

因此 PDM-12 启动门禁已解除。

---

## 2. PDM-12 覆盖地图

### 9/19 主来源

- C2；
- R10；
- R12。

### 核心对象

- Match Candidate；
- Match Result；
- Rule Dictionary。

### 核心能力

- 结构化 Matching；
- `high / acceptable / confirmation_needed / no_match` 四级结果；
- 硬条件 / 软偏好；
- 人工确认；
- 条件变更后的重算；
- 词典 / 确定性解析维护边界。

### IA V5 主要载体

- E05-05；
- E05-06；
- P06-10。

### 001～078 雷达

- M03；
- M04。

---

## 3. Incoming handoff｜已读取并接收

### HO-P04-P12-001

来源：PDM-04。

必须承接：

- Matching 对 hidden / availability / source 状态做合法资格判断；
- `platform_visibility = hidden` 不得被误判为 offline / unavailable；
- hidden 仍可按当前正式业务规则进入 Matching，具体结果由本域冻结。

状态：`HANDOFF_ACCEPTED`

### HO-P05-P12-001

来源：PDM-05。

必须承接：

- Matching 必须使用 JYT 已明确车型事实；
- 不得仅因 `vehicle_model_id = NULL` / mapping pending 就自动把已明确车型事实降为 unknown；
- 本地主数据 mapping 状态与上游事实存在性必须分层。

状态：`HANDOFF_ACCEPTED`

### HO-P07-P12-001

来源：PDM-07。

必须承接：

- Matching 使用 JYT 原始车况描述 / 标签及必要确定性标准化事实；
- 必须保留 provenance；
- unknown / confirmation_needed 不得通过猜测补齐；
- 车辆事实与 Demand 条件比较必须保持确定性。

状态：`HANDOFF_ACCEPTED`

### HO-P11-P12-001

来源：PDM-11。

必须承接：

- 只有员工人工激活后的 `active Demand` 才进入正式 Matching；
- Application 不等于 Matching；
- 客户原始要求 / 销售匹配描述 / 标准条件 / 需求说明严格分层；
- Demand = active 不等于 matching-ready；
- readiness、确定性解析、条件变更重算、候选等级由 PDM-12 冻结；
- `Demand.created_at` 为不可变创建事实，后续若有跨域仲裁不得被 updated_at / resume time 替代。

状态：`HANDOFF_ACCEPTED`

---

## 4. Completed-PDM 强制依赖

PDM-12 后续重建时至少强制检查：

- PDM-04｜Vehicle visibility / hidden / source availability；
- PDM-05｜车型事实 / mapping pending；
- PDM-07｜车况事实 / provenance / unknown；
- PDM-10｜客户展示价 /预算条件涉及价格时不得重写 Price Authority；
- PDM-11｜Demand 生命周期、active、readiness 分层、四层找车信息模型。

不得用当前 IA / Low-Fi 载体反向覆盖上述已完成 PDM Authority。

---

## 5. 当前尚未裁决

当前未生成任何新的：

- Matching 字段列表；
- hard / soft 条件清单；
- 四级结果判定公式；
- `confirmation_needed` 具体进入 / 退出条件；
- 词典结构；
- 同字段多值 OR / 跨字段 AND；
- 预算上浮；
- 年款 / 首登年 / 里程 / 颜色 / 排量 / 动力 / 车况比较；
- 重算触发器；
- Match Candidate / Match Result lifecycle；
- 人工确认动作与审计；
- Priority 联动。

这些必须按当前方法重新读取 9/19、前史、001～078、Current / IA / Low-Fi、已完成 PDM 后，再进入四批用户审查。

---

## 6. 当前 Gate

```text
PDM11_COMPLETE = YES
PDM11_INTEGRITY_PASS = YES
PDM12_STARTUP_GATE = PASS
PDM12_INCOMING_HANDOFFS_READ = PASS
HO-P04-P12-001 = HANDOFF_ACCEPTED
HO-P05-P12-001 = HANDOFF_ACCEPTED
HO-P07-P12-001 = HANDOFF_ACCEPTED
HO-P11-P12-001 = HANDOFF_ACCEPTED
PDM12_BATCH_1 = NOT_STARTED
PDM12_FINAL = NOT_READY
```

当前唯一下一步：

> **按 PDM 方法对 PDM-12 做 Current Authority Refresh → Current Implementation Fact → 9/19 主底盘 → 前史 → 001～078 → 后续 Current / IA / Low-Fi → Conflict Before Classification，形成 Batch 1 候选；未经用户审查不得自动批准。**
