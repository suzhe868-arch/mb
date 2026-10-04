# 名邦汽车 V1｜PDM 信息保真与一次性收口检查模板

> 类型：执行模板，不是产品业务 Authority  
> 适用：所有后续 PDM，以及任何需要重新打开的已完成 PDM  
> 方法权威：`00_先读/01_产品基线重建执行规范_冻结工作版.md` §3.2  
> 原则：未完成本模板全部适用项，不得将 PDM 标记 COMPLETE。

---

## A. Current Authority Refresh

- 当前 PDM：
- 当前 Batch：
- 当前工作版：
- 当前 Git HEAD：
- 已读取 `CURRENT_PROJECT_STATE.md`：YES / NO
- 已读取 `NEXT_ACTION.md`：YES / NO
- 已读取 `PROJECT_STATE.json`：YES / NO
- 已读取 `DECISION_REGISTER.md`：YES / NO
- 当前用户本轮新裁决：
- 当前已批准 Authority 摘要：

> 禁止从模型记忆填写；必须来自本轮实际读取文件。

---

## B. Completed-PDM Dependency Card

| 依赖 PDM | 约束对象 | 当前正式规则 | 本域可补充 | 本域不可静默改写 | 已重新读取 |
|---|---|---|---|---|---|
|  |  |  |  |  | YES/NO |

检查：

- [ ] 所有触及的已完成 PDM 已列入
- [ ] 没有把“业务域边界”误当成“证据边界”
- [ ] 存在冲突时已转 Batch 4，而不是自行覆盖

---

## C. Global Invariant Scan

| 全局不变量 | 是否涉及 | 当前权威来源 | 本域规则是否一致 | 冲突 / 备注 |
|---|---|---|---|---|
| identity / 唯一身份 |  |  |  |  |
| role |  |  |  |  |
| permission |  |  |  |  |
| data scope |  |  |  |  |
| hard DENY |  |  |  |  |
| owner / responsibility |  |  |  |  |
| vehicle_id |  |  |  |  |
| source_type |  |  |  |  |
| listing_cycle |  |  |  |  |
| visibility / hidden |  |  |  |  |
| lifecycle / terminal state |  |  |  |  |
| immutable snapshot |  |  |  |  |
| audit / history |  |  |  |  |
| current fact vs historical fact |  |  |  |  |
| customer-safe vs internal view |  |  |  |  |

---

## D. Terminology / Field Normalization

| 中文业务词 | 技术字段 / 枚举 | 历史别名 | 容易混淆但不同的概念 | 当前统一定义 |
|---|---|---|---|---|
|  |  |  |  |  |

检查：

- [ ] 中文词已搜
- [ ] 英文字段已搜
- [ ] 历史别名已搜
- [ ] 近义不同概念已拆开
- [ ] 未用“关键词没搜到”证明不存在

---

## E. Current Implementation Fact

> 本域如无已实现内容，可明确写 N/A。

- 当前版本：
- 数据源：
- 谁提供 API：
- 谁调用 API：
- 数据流方向：
- 已实现：
- 已测试 / 已验收：
- 当前未验证：
- 与产品 Authority 是否冲突：

状态：

- [ ] CURRENT_IMPLEMENTED_FACT established
- [ ] N/A
- [ ] CURRENT_IMPLEMENTATION_CONFLICT

---

## F. Full Evidence Matrix

| Rule / Topic | Current Authority | 已完成 PDM | 9/19 | 前史 | 9/22 | IA/Current | Low-Fi | 001～078 | Delta | 实现事实 | 冲突结论 |
|---|---|---|---|---|---|---|---|---|---|---|---|
|  |  |  |  |  |  |  |  |  |  |  |  |

要求：

- 先完成本矩阵，再分类 Batch；
- 任何未解释反向证据 → Batch 4；
- 摘要只能定位，不能替代原始证据。

---

## G. Negative Claim Proof

对本域所有“没有 / 不存在 / 已废弃 / 不需要 / 无冲突 / 无遗漏”结论逐条登记：

| 否定结论 | 中文检索 | 字段/英文检索 | Final/Decision | 历史 | IA/Low-Fi | Radar | 结论 |
|---|---|---|---|---|---|---|---|
|  | PASS/FAIL | PASS/FAIL | PASS/FAIL | PASS/FAIL | PASS/FAIL | PASS/FAIL |  |

证据不足：

> `EVIDENCE_INCOMPLETE`

---

## H. Deferred Handoff Ledger

### 指向当前 PDM 的 handoff

| 来源 PDM | Source Atom / Decision | 完整语义 | 必须承接的 Guard | 状态 |
|---|---|---|---|---|
|  |  |  |  | PENDING/ACCEPTED/RESOLVED |

### 当前 PDM 新产生的 handoff

| 当前 Atom | 目标 PDM | 完整移交语义 | 目标必须承接的 Guard | 状态 |
|---|---|---|---|---|
|  |  |  |  | PENDING |

Final 前：

- [ ] 指向当前 PDM 的所有 handoff 已 RESOLVED
- [ ] 没有只写“后续处理”而没有目标和完整语义

---

## I. Atom Classification

> 分类只能在 A～H 完成后进行。

| Atom | 完整候选规则 | 冲突状态 | Batch | 用户状态 |
|---|---|---|---|---|
|  |  |  | 1/2/3/4 | PENDING/APPROVED/MODIFIED/REJECTED/DEFERRED |

---

## J. Change Impact Analysis

每次用户修改、反转、reopen、supersession 后立即填写：

- 本次变化：
- 被覆盖 Atom / Decision：
- 受影响已完成 PDM：
- 受影响当前 PDM：
- 受影响 DO_NOT_RESTORE：
- 受影响 IA / Low-Fi：
- 受影响 Schema / API / Engineering / Test：
- 受影响状态文件：
- 是否需要 reopen：
- supersession 链：

检查：

- [ ] 不只修改当前一句文字
- [ ] Decision Register 已留链
- [ ] stale carrier 已登记

---

## K. Source → Final Traceability

| 来源 Rule / Decision | 最终去向 | Final 条款 | 状态 |
|---|---|---|---|
|  |  |  | MAPPED/SUPERSEDED/DEPRECATED/DEFERRED_WITH_TARGET/ENGINEERING_ONLY/USER_REJECTED |

门禁：

- `SOURCE_DECISION_COVERAGE = 100%`
- `UNMAPPED = 0`

---

## L. Final → Source Traceability

| Final 实质条款 | 来源 / 用户裁决 | 新增还是继承 | 覆盖关系 |
|---|---|---|---|
|  |  |  |  |

门禁：

> `FINAL_TO_SOURCE_TRACEABILITY = 100%`

---

## M. Semantic Completeness Matrix

对 Final 每个核心规则 / 章节检查：

| 维度 | 适用状态 | Final 是否明确 | 备注 |
|---|---|---|---|
| 对象 / 唯一标识 |  |  |  |
| 主体 / 角色 |  |  |  |
| 前置条件 |  |  |  |
| permission |  |  |  |
| data scope |  |  |  |
| hard DENY / 谁不能做 |  |  |  |
| 正常流程 |  |  |  |
| 状态 / lifecycle |  |  |  |
| listing_cycle / 时间边界 |  |  |  |
| 空值 / 无数据 |  |  |  |
| 失败 / timeout |  |  |  |
| 并发 / 幂等 |  |  |  |
| revoke / inactive / 权限变化 |  |  |  |
| 配置与生效时点 |  |  |  |
| history / audit |  |  |  |
| immutable snapshot |  |  |  |
| 跨对象影响 |  |  |  |
| C / E / P 必要表现 |  |  |  |
| DO_NOT_RESTORE |  |  |  |
| 跨 PDM 依赖 |  |  |  |

规则：

- 适用但未明确 → FAIL
- 不适用 → 明确写 N/A
- 不允许静默空白

---

## N. Implementation-Ready Check

最终文件必须能让后续 IA / Low-Fi / Engineering 在不回旧聊天猜语义的情况下施工。

检查：

- [ ] 核心对象与标识明确
- [ ] 状态 / 生命周期明确
- [ ] 角色 / permission / scope 明确
- [ ] hard DENY 明确
- [ ] 正常流程明确
- [ ] 异常 / 空值 / 失败出口明确
- [ ] 并发 / 幂等产品要求明确或明确归 Engineering
- [ ] 配置项及生效边界明确
- [ ] history / audit / snapshot 明确
- [ ] 跨 PDM 依赖明确
- [ ] 产品规则 vs Engineering 自由度明确
- [ ] 没有“沿用某旧文档 / 其他不变”代替正文
- [ ] 没有依赖旧聊天才能理解的关键语义

结论：

> `IMPLEMENTATION_READY = PASS / FAIL`

---

## O. Final COMPLETE Gate

只有全部满足才允许 COMPLETE：

```text
SOURCE_DECISION_COVERAGE = 100%
UNMAPPED = 0
FINAL_TO_SOURCE_TRACEABILITY = 100%
DEFERRED_HANDOFF_UNRESOLVED = 0
CROSS_PDM_CONFLICT = 0
GLOBAL_INVARIANT_CONFLICT = 0
SEMANTIC_INTEGRITY = PASS
NEGATIVE_CLAIMS_VERIFIED = PASS
USER_FINAL_APPROVED = YES
IMPLEMENTATION_READY = PASS
```

最终结果：

- SOURCE_DECISION_COVERAGE =
- UNMAPPED =
- FINAL_TO_SOURCE_TRACEABILITY =
- DEFERRED_HANDOFF_UNRESOLVED =
- CROSS_PDM_CONFLICT =
- GLOBAL_INVARIANT_CONFLICT =
- SEMANTIC_INTEGRITY =
- NEGATIVE_CLAIMS_VERIFIED =
- USER_FINAL_APPROVED =
- IMPLEMENTATION_READY =

> 任一项不满足：保持 IN_REVIEW，不得 COMPLETE。
