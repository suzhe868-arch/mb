# IA Source Index — V5 FR-V5-001～003 Final Targeted Remediation

<!-- IA-GLOBAL-B2-B3-SOURCE-INDEX -->
> **IA 全局集中对齐 Source Index｜Batch 2 + 3｜2026-10-08**
>
> 当前状态：`IA_GLOBAL_ALIGNMENT_IN_PROGRESS / BATCH_1_2_3_APPLIED`。
>
> 产品 Authority 仍唯一来自 `PDM-01～PDM-25 Final + Decision Register`。旧 Phase1.5/V5 资料保留为历史证据与 stale-carrier 定位来源，不得覆盖 Current Final。
>
> - Batch 2：19 组明确废弃/已覆盖/DO_NOT_RESTORE 已批准并执行。
> - Batch 3：30 组后续明确新增/承载补齐已批准并执行。
> - Current / Navigation / Page / State / Action / Guard / Permission / Lifecycle 已建立 Batch 2+3 Authority 覆盖。
> - 未经 Batch 4 最终缺口扫描与全量 Final→IA coverage 复核，不得宣告 IA 完成，也不得进入 Low-Fi。


<!-- IA-GLOBAL-B1-SOURCE-INDEX -->
> **IA 全局集中对齐 Source Index 覆盖｜2026-10-08**
>
> 当前产品 Authority 已切换为：`PDM-01～PDM-25 Final + Decision Register`。原 `Phase1.5上游权威/` 与 V5 证据工程继续作为历史来源/承载证据，但不得覆盖当前 PDM Final。
>
> 当前 IA 状态：`IA_GLOBAL_ALIGNMENT_IN_PROGRESS / BATCH_1_APPLIED`。
>
> Batch 1 已对齐 PDM-01～04 的 Customer/Owner/分享归属、Permission/Data Scope/System Admin/4S、Handover、Vehicle/source_type/listing_cycle/一键转名邦不变量。对应 Current / Navigation / Page / State / Action / Guard / Permission / Lifecycle 已建立当前覆盖。


状态：`CURRENT / CANONICAL / V5 FR001_003 TARGETED REMEDIATION`

## 1. 业务权威
`Phase1.5上游权威/` 七份文件仍是唯一业务来源。V4 外部已独立验证 Raw Universe=765、Normalization=765、Exact Source Chain=242；V5 原样保留这些已验证基础并只修 RC04/RC06/RC07。

## 2. 唯一 Current
- `当前IA/IA_CURRENT.md`
- Page/Navigation/State Register
- `当前IA/IA_V5_ACTION_CONTRACT.md`
- `当前IA/IA_V5_STATE_CONTRACT.md`
- `当前IA/IA_V5_LIFECYCLE_CONTRACT.md`
- `当前IA/IA_V5_CANONICAL_GUARD_CONTRACT.md`
- `当前IA/IA_V5_PERMISSION_CONTRACT.md`

旧 V4 Action/State/Lifecycle/Journey contracts 与 V4 Gate 不进入 V5 canonical package。

## 3. 证据工程
`证据工程V5/` 是 V5 当前证据目录；Final Closure Validator 额外验证 target existence / active version / semantic object match / false-closed。`IA_V5_FULL_CLOSURE_SELF_CHECK.md` 为本轮真实自检。

## 4. Gate / Ready
唯一 Gate 路径为根目录 `IA_FINAL_GATE_V5.md`；当前 `INTERNAL_V5_FR001_003_FINAL_GATE=PASS`。本轮只修 FR-V5-001～003 及其 Validator/Saturation/Reviewer/Gate 阻断链；现仅开放 `READY_FOR_FINAL_EXTERNAL_REVERIFY=TRUE`，`READY_FOR_LOW_FI_REWORK=FALSE` 继续锁定，直到外部最终定向复验 PASS。

## 5. 本轮冻结输入
- `冻结整改输入V5/名邦汽车_V1_IA_V5_外部独立冷启动终止性终审报告.md`
- `回归验收V5/IA_V5_FINAL_CLOSURE_SCOPE.md`
- `回归验收V5/IA_V5_SAME_PATTERN_OCCURRENCE_LEDGER.csv`


## 6. 最终外部复验
内部 Final Closure Gate PASS 后，唯一允许的下一步是使用 `IA_V5_FINAL_REVERIFY_PACKAGE.zip` 对 V5-FINAL-001～005、同模式 occurrence、Validator/Fault Injection/Saturation/Reviewer/Gate 一致性执行剩余问题复验；不得据此重开全量 Phase 1/1.5/七根因审计。

## 7. FR-V5-001～003 定向整改
- FR-V5-001：Permission Matrix `RESULT` 必须与 Current Contract `RESULT` 一致；单独计算 overgrant / undergrant。
- FR-V5-002：business/technical State 必须同时匹配 `CANONICAL_STATE_ID + BUSINESS_OBJECT + STATE_TYPE + CURRENT_SOURCE`。
- FR-V5-003：Lifecycle FULL cell 新增独立 Expected Dimension Contract，并要求 Proof ↔ Current Carrier ↔ Supporting Current Ref ↔ Upstream Evidence ↔ Expected Dimension 五向一致。
- FI-05～07 必须能让 Validator / Saturation / Reviewer / Internal Gate 全链 FAIL；FI-01～04 继续回归。
