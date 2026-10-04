# PDM-01～PDM-10｜全局 Cross-PDM / Handoff / Global Invariant 总复核｜2026-10-05

> 状态：`GLOBAL_AUDIT_PASS`  
> 前置：PDM-01～PDM-10 单域 Legacy Final Integrity Audit 全部 `INTEGRITY_PASS`。  
> 本轮不修改 IA / Low-Fi；仅登记既有 `STALE_CARRIER`，继续服从 `METHOD-20261004-CARRIER-ALIGN-AFTER-PDM25`。  
> 本轮未产生新的产品裁决项。

## 1. 审计范围

本轮不是再次逐域重做 Missing Rule Audit，而是以 PDM-01～PDM-10 当前 Final 与 `CROSS_PDM_HANDOFF_REGISTER.md` 为唯一当前 Authority，检查：

- 01～10 内部 handoff 是否全部闭环；
- `HANDOFF_CLOSED` 是否都有明确目标 Authority；
- closed handoff 是否都完成 source backwrite；
- Customer / Employee / Vehicle 三类稳定身份是否互相冲突；
- owner / responsible / share / referral 分层是否一致；
- System Admin / employee business execution / 4S hard DENY 是否一致；
- vehicle source / listing_cycle / hidden / availability / Lock / Transaction 分层是否一致；
- JYT source facts / local master data / manual facts / snapshots 是否互相改写；
- image / phone / price 等敏感资源是否继承当前权限，不把历史 URL / cache / internal mode 当永久授权；
- Customer 停用、员工 inactive、4S inactive 等状态是否错误删除业务历史；
- formal Vehicle / archive / transaction snapshot 是否存在跨域普通物理删除或历史追改；
- PDM-11～25 future handoff 是否完整、可执行、没有空语义或错误状态。

## 2. Handoff 总账结果

当前总账共登记 92 条 handoff。

### 2.1 PDM-01～10 内部 handoff

- 目标落在 PDM-01～10 的 handoff：全部为 `HANDOFF_CLOSED` / 已完成；
- 未发现 01～10 内部残留 `HANDOFF_OPEN` 或 `HANDOFF_ACCEPTED`；
- 所有 `HANDOFF_CLOSED` 均存在明确目标 Authority；
- 所有 `HANDOFF_CLOSED` 均为 `source_backwrite = YES`；
- 未发现第二处“目标已完成但来源仍写待后续”的假闭环。

### 2.2 PDM-11～25 future handoff

当前仍有 69 条 `HANDOFF_OPEN`，全部：

- 有明确 target PDM；
- 有完整 transfer semantics；
- `source_backwrite = YES`；
- 不依赖 IA / Low-Fi 作为产品 Authority；
- 不阻塞 PDM-01～10 全局 Gate。

目标分布：

- PDM-11：1
- PDM-12：3
- PDM-13：3
- PDM-14：5
- PDM-15：4
- PDM-16：3
- PDM-17：2
- PDM-18：6
- PDM-19：5
- PDM-20：7
- PDM-21：9
- PDM-22：9
- PDM-23：2
- PDM-25：10

## 3. Global Invariant Matrix

| Global invariant | PDM-01～10 结论 | 状态 |
|---|---|---|
| Customer identity | `customer_id` 稳定；手机号/微信资料变化不换 Customer；V1 不 Merge | PASS |
| Employee identity | `employee_id` 稳定；角色/门店变化不重建员工；System Admin 与员工业务身份分离 | PASS |
| Vehicle identity | 正式 Vehicle 稳定 `vehicle_id`；批发→名邦同 Vehicle；不做双 Vehicle conversion | PASS |
| Listing lifecycle | hidden/visible、普通编辑、source conversion 不单独新建 listing_cycle；真实不可售→再次可售才新周期 | PASS |
| Owner invariant | 同一 Customer 一个 current owner；source/referral/share/owner 分离；owner 变化不自动漂移固化业务负责人 | PASS |
| Permission invariant | `identity + permission + data scope + object state`；入口可见/Internal Mode 不等于授权；提交重验 | PASS |
| System Admin invariant | 控制平面治理 ≠ 员工业务执行；Customer disable/model governance 等已显式列出的控制动作除外 | PASS |
| 4S invariant | 共享员工端但 hard DENY 保留；只能操作自己有权 4S 范围；不看名邦内部价、不转名邦、不做名邦 CRM/Lock/Transaction | PASS |
| Source fact invariant | JYT 原始 source facts 只读保留；本地车型主档、人工事实、名邦业务字段不反写上游事实 | PASS |
| Snapshot invariant | Recommendation/Lock/Transaction/成交/转换等已形成历史快照不被后续主档、价格、source_type 变化追改 | PASS |
| Risk ≠ hard block | mapping conflict / Supply Anomaly / image assetization failure 均不自动等于真实不可售；真实 offline/unavailable 或显式业务 Guard 才硬阻断相应动作 | PASS |
| Sensitive resource invariant | VIN/档案原件/内部价/上游电话/报告URL/图片URL 均按当前身份与权限；历史 URL/cache/internal mode 不能形成永久授权 | PASS |
| Customer disable invariant | 停用暂停依赖 Customer 身份/权益的新业务能力，不删除身份/owner/历史/未自然失效权利，不自动终止既有业务对象 | PASS |
| Formal-history invariant | 正式 Vehicle、正式档案、业务快照不通过普通 CRUD 物理删除；纯 draft 可按 Guard 删除 | PASS |

## 4. 本轮发现并直接修正的控制性问题

### GLOBAL-01｜Final 顶部状态元数据不一致

PDM-01～PDM-07 正文最终 Gate 已是 `INTEGRITY_PASS`，但文件顶部仍只写 `COMPLETE`。

处理：

> 统一为 `COMPLETE / INTEGRITY_PASS`。

该修正只同步控制状态，不改变任何业务语义。

### GLOBAL-02｜PDM-01 对 PDM-02 的过期“留后续”文字

PDM-01 §10 曾写：

> 详细 CRM / 权限承载留 PDM-16 / PDM-02

但 PDM-02 已完成统一 permission/data scope Authority。

处理：

> 改为“统一 permission / data scope 权限模型已由 PDM-02 当前 Final 承接；具体 CRM 备注业务与页面承载继续移交 PDM-16”。

该修正只清除 stale handoff wording，不改变 CRM 产品能力。

## 5. 未发现的冲突

本轮明确未发现：

- Customer 停用与 price rights 的二次冲突；
- owner 与 share/referral 的归属冲突；
- PDM-02 System Admin 与 PDM-05车型治理 / PDM-07业务配置 / PDM-09电话 / PDM-10额度动作之间的权限冲突；
- 4S 车辆管理与 4S hard DENY 的冲突；
- PDM-04 source conversion 与 PDM-08 图片资产化 / PDM-09 电话 source_type 裁剪 / PDM-10价格转换的冲突；
- MODEL_MISSING / mapping conflict 与人工发布 Gate 的冲突；
- hidden / offline / Supply Anomaly / Lock / Transaction 被重新压成单一 vehicle_status；
- 正式 Vehicle / archive / snapshot 被恢复普通物理删除；
- Recommendation 免费查价权被普通分享/收藏替代；
- `car_code` 被重新用作电话身份；
- IA / Low-Fi 被用来覆盖 PDM Final。

## 6. Global Gate

```text
PDM01_10_SINGLE_DOMAIN_INTEGRITY = PASS
INTERNAL_HANDOFF_OPEN = 0
INTERNAL_HANDOFF_ACCEPTED = 0
CLOSED_HANDOFF_WITHOUT_TARGET_AUTHORITY = 0
CLOSED_HANDOFF_SOURCE_BACKWRITE_PENDING = 0
FUTURE_HANDOFF_EMPTY_SEMANTIC = 0
FUTURE_HANDOFF_STATE_VALID = PASS
CROSS_PDM_CONFLICT = 0
HANDOFF_GAP_UNRESOLVED = 0
GLOBAL_INVARIANT_CONFLICT = 0
GLOBAL_TERMINOLOGY_CONFLICT = 0
GLOBAL_AUTHORITY_DRIFT = 0
IA_LOWFI_AUTHORITY_OVERRIDE = 0
GLOBAL_IMPLEMENTATION_READY_FOR_NEXT_PDM = PASS
GLOBAL_PDM01_10_CROSS_PDM_AUDIT = PASS
```

## 7. 结果与下一步

> **PDM-01～PDM-10 全局 Cross-PDM / Handoff / Global Invariant 总复核 = PASS**

因此满足原冻结门禁：

> **PDM-11 可以解锁并进入 Legacy Final Integrity Audit / 重建流程。**

但这不表示 PDM-11 已完成，也不表示 PDM-11～25 future handoff 已关闭。PDM-11 开始时必须先读取所有 `target=PDM-11` 的 Register 条目，目前为：

- `HO-P01-P11-001`：Demand 生命周期；Customer 停用不得自动终止既有 Demand，具体状态由 Demand 域处理。

PDM-11～25 继续按同一 Integrity / Handoff 方法执行。
