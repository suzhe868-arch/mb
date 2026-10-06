# PDM-13｜Priority / 仲裁 / TTL / 排他保护｜最终完整规则

> 日期：2026-10-05  
> 状态：`COMPLETE / INTEGRITY_PASS`  
> Batch 1～4：`ALL_USER_APPROVED`  
> P13-LIA-01～08：`ALL_USER_APPROVED / APPLIED`  
> Final 前完整性复核 R2：`PASS`  
> 未决产品冲突：`0`  
> 本文件为 PDM-13 当前正式中文产品 Authority。用户已于 2026-10-05 最终批准并确认执行。

---

## 1. PDM-13 的业务边界

PDM-13 负责：

> Priority Customer 资格、车辆级 Priority 自动产生、多 Customer 仲裁、TTL、提前释放、排他保护、trigger Demand、责任交接、Priority ended / re-arbitration，以及 Priority 与 Recommendation / Lock / Transaction / 公海 / visibility / 查价权的边界。

Priority 是：

> **正式 Matching 之后的限时车辆机会排他保护层。**

Priority 不是：

- 第二套 Matching；
- 人工“客户专属”体系；
- Recommendation；
- Customer 详情 visibility；
- Lock 排队优先权；
- 价格 / 查价权益；
- Customer owner。

---

## 2. Priority Customer 资格

Priority 资格：

- 是 Customer 级长期独立属性；
- 后台针对**单个 Customer**开启 / 关闭；
- 不支持批量；
- 不由普通 / 粉丝 / VIP / 已付费等 Customer Level 名称自动产生；
- 不做成 Customer Level entitlement；
- 默认持续有效，直到合法后台控制平面关闭；
- Customer 进入公海不会丢失 Priority 资格。

Customer Level 仍只决定 PDM-11 的正式 find-car entitlement。

因此：

> **find-car entitlement ≠ Priority qualification。**

只有 Priority 资格而没有合法 active + matching-ready Demand，不产生车辆级 Priority。

---

## 3. Priority 资格开 / 关生命周期

开启 Priority 资格：

- 不创建 Application；
- 不创建 Demand；
- 不自动创建 Priority；
- 不修改 Customer Level；
- 对该 Customer 已有合法 active + matching-ready Demand / current Match Result 进入受影响范围重评。

关闭 Priority 资格：

- 阻止后续新 Priority；
- 结束该 Customer 当前 active Priority；
- 记录 `priority_customer_disabled` 或正式等价 reason；
- 被释放 Vehicle 重新读取全部 Customer 当前合法 Match Result；
- 不因此暂停 / 取消 / 结束该 Customer 的合法 Demand；
- 该 Customer 仍可按普通非-Priority Customer 身份继续 Matching。

资格开 / 关默认不强制填写 reason，但必须审计 Customer、actor、action、time、before/after。

---

## 4. 所有 Customer 共用 PDM-12 唯一 Matching

普通 Customer 与 Priority Customer 完全共用 PDM-12 Matching Authority。

Priority 不得：

- 自己重新解析车型 / 预算 / 车况；
- 复制 Rule Dictionary；
- 修改 hard / preferred / tolerance；
- 把 unknown 猜成符合；
- 为抢 Priority 临时放宽条件；
- 使用第二套 Priority Matching。

Vehicle / Demand / Price / Rule 等事实变化必须先由 PDM-12 得到新的 current Match Result，再由 PDM-13消费。

---

## 5. hidden Vehicle 仍可内部 Matching / Priority

`platform_visibility=hidden` 只表示不进入普通公开展示面。

只要 Vehicle：

- 真实可售；
- listing_cycle 有效；
- 其他 Matching / Priority Guard 合法；

仍可：

> Matching → Priority candidate → active Priority。

Priority 不得把 hidden 改成 offline / unavailable，也不得在 Priority ended 后强制 unhide / republish。

---

## 6. Priority candidate

只有 current legal：

> `high / acceptable`

可进入 Priority candidate。

以下不得驱动新 Priority：

- pending Application；
- paused / completed / cancelled Demand；
- not matching-ready Demand；
- `confirmation_needed`；
- `no_match`；
- stale / invalidated / historical Match Result。

---

## 7. 同车唯一、同客户多车

同一 Vehicle 同一时刻最多：

> **1 个 active Priority。**

同一 `customer + vehicle + listing_cycle` 的重复事件 / retry 不得产生并行重复 Priority，必须幂等 / suppressed。

反方向：

> 同一 Priority Customer 可以同时拥有多辆不同 Vehicle 的 active Priority，V1 不设 Customer 侧数量上限。

每辆 Vehicle 独立仲裁、TTL、trigger Demand、lifecycle、ended reason、history。

---

## 8. 多 Customer 同车仲裁

多个 Priority candidate 同时命中同一 Vehicle：

> **`high > acceptable → Demand.created_at 更早 → demand_id 更小`**

不得增加：

- Customer Level；
- VIP 等级；
- 销售职位；
- 车辆来源；

作为额外 Priority 分值。

`Demand.created_at` 必须使用 PDM-11 不可变创建时间，不得换成 updated_at / resume time / reassignment time。

---

## 9. 同 Customer 多 Demand 命中同车

同一 Customer 多条 Demand 命中同一 Vehicle：

1. 按相同确定性原则选出唯一最佳 `trigger_demand_id`；
2. 跨 Customer 仲裁时，该 Customer 只作为一个候选；
3. 多 Demand 不得增加该 Customer 的竞争权重。

---

## 10. Priority TTL

默认 TTL：

> **24 小时 / 86400 秒。**

后台可调整后续新建 Priority 的全局默认保护时长。

新 Priority 创建时冻结自己的 `expires_at`：

- 后续默认值变化不追改已有 Priority；
- 页面刷新不重计时；
- Recommendation 不重计时；
- Matching 重算不重计时；
- trigger Demand 切换不重计时；
- handoff 不暂停 / 延长 / 重置。

不提供：

- 人工续期；
- 单笔手改 expires_at；
- ended Priority 人工恢复 active。

Priority TTL 与 Lock 默认 3 天是两个独立业务时钟。

---

## 11. TTL 是最长保护上限，销售可提前 release

TTL 表示：

> **自动保护的最长时间上限，不是必须等待满时长。**

当前 trigger Demand 的合法 responsible employee 如果判断：

> “这台车不适合这个 Customer，不准备推荐”

可以在 TTL 到期前主动执行：

> **释放 Priority / 不推荐此车**

无需等满 24 小时。

该动作：

- 结束当前 active Priority；
- 记录 actor / time / release reason；
- 立即触发该 Vehicle 当前候选重新仲裁；
- 不属于修改 TTL；
- 不属于人工续期；
- 不属于 override。

---

## 12. release 后立即重新仲裁

Priority release 后：

1. 原 Customer 在同一 listing_cycle 内进入 release suppression，避免相同旧事实立即把本车重新选回；
2. 若存在其他 Priority candidate → 按统一仲裁产生新的 Priority；
3. 若没有 Priority candidate，但普通 Customer 有合法 current Match Result → 恢复普通后续业务机会；
4. 若当前没有任何 Customer 可继续处理 → 本轮不创建新的 Priority / Recommendation；
5. Vehicle 不会永久退出 Matching，未来新 Demand / Vehicle facts / Match change 仍可再次触发。

---

## 13. same listing_cycle 自动再获得限制

同一 `customer + vehicle + listing_cycle` 因以下 Priority 自身原因 ended：

- Customer 明确放弃；
- 合法 responsible employee 明确 release / 不推荐此车；
- TTL expired；

该 Customer 不得因相同旧事实再次**自动**获得同车 Priority。

但：

- Recommendation cancellation alone 不是 Priority ended reason；
- Recommendation cancellation alone 不触发 same-cycle suppression；
- 如果取消 Recommendation 的同时也决定释放 Priority，则必须另外执行 Priority release。

真实新事实变化或新的 listing_cycle 仍可按当前全部 Guard 重新参加仲裁。

---

## 14. trigger Demand 失效 / Match tier downgrade

当前 trigger Demand paused / completed / cancelled / readiness 失效、Match Result stale/invalidated，或 current Match Result 从：

> `high / acceptable`

降为：

> `confirmation_needed / no_match`

时，当前 Priority 必须立即重评，不能继续占满 TTL。

处理：

1. 先找同 Customer 其他 active + matching-ready、对该 Vehicle current high/acceptable 的 Demand；
2. 有 → 切换 `trigger_demand_id`，Priority 继续 active，原 `expires_at` 不变；
3. 无 → Priority ended，记录 `match_invalidated` / demand-inactive 等真实 reason；
4. Vehicle 立即读取全部 Customer 当前合法 Match Result 重新仲裁。

Priority 不得修改 Matching facts 来维持自己的资格。

---

## 15. Priority 本身不授 Customer 详情 visibility

硬边界：

> **`Priority created ≠ Customer can see Vehicle`**

active Priority 建立后：

1. 当前合法 responsible employee 先获得业务处理视图；
2. 销售判断是否正式 Recommendation；
3. Recommendation / visibility grant 合法成立；
4. Customer 才获得车辆详情 visibility。

hidden Vehicle 也不能因为 Priority 自动向 Customer 暴露。

---

## 16. Priority 与 Recommendation 是独立对象

Priority：

- 可以存在但尚未 Recommendation。

Recommendation：

- 可以在 Priority ended 后按自身 Authority 继续存在。

正式 Recommendation 成立后：

- Priority 可以保存对应 `recommendation_id` 作为关联 / 追溯字段；
- 不得把 Recommendation 合并成 Priority 子状态；
- Recommendation 不重置 Priority TTL。

---

## 17. “释放 Priority”与“取消 Recommendation”必须分开

尚未建立 Recommendation 时：

> 只能叫“释放 Priority / 不推荐此车”，不存在“取消 Recommendation”。

已有 Recommendation 时：

- Recommendation end 与 Priority release 是两个独立 domain action；
- 员工体验层未来可以设计“结束推荐并释放保护”的组合入口；
- 底层必须分别 Guard、分别执行、分别审计、分别留历史；
- **Recommendation cancellation alone 不自动结束 Priority**；
- **Priority release / TTL expired alone 不自动结束仍合法 Recommendation**。

既有 Recommendation / visibility 在后来其他 Customer 的 Priority 期间如何 suppression、Priority ended 后如何 restore，由 PDM-14 冻结。

---

## 18. active Priority 的普通入口排他

active Priority 期间，无关 Customer / 无关普通 Employee 不得通过普通业务入口绕过保护，包括：

- 公共 Feed / 车源列表；
- 普通 Search；
- Filter / Sort；
- 普通 Share link；
- 旧普通分享链接；
- 没有当前合法 visibility Authority 的历史 / 旧业务入口。

PDM-12 Match Result 不因此物理删除。

---

## 19. 普通公共统计

面向 Customer 的普通“在售车源 / 今日新增”等统计必须以：

> **当前真正公开可浏览 Vehicle**

为口径。

active Priority 保护中的 Vehicle 不计入普通公共在售数。

Priority ended 不等于强制重新计入公开统计，仍需读取底层 visibility / availability。

---

## 20. Priority 与价格 / 查价权分离

Priority 本身不得：

- 授批发价查看权；
- 免费解锁价格；
- 增加 / 消耗 daily quota；
- 修改 LIMITED / UNLIMITED；
- 修改 customer_list_price / internal_wholesale_price；
- 形成新价格公式或价格快照。

正式 Recommendation 若按 PDM-10 授当前 `customer + vehicle + listing_cycle` 免费查价权，来源是 Recommendation，不是 Priority。

Recommendation 后续结束不追回 PDM-10 已成立的当前周期免费查价权。

---

## 21. active Lock 与 Priority

active Lock：

- 不阻断 PDM-12 Matching；
- 但阻止新 Priority；
- 不得把 active Lock 伪造成 no_match。

正式 Lock 成立：

- 结束当前 active Priority；
- Priority Customer 自己 Lock 可记录 `converted_to_lock`；
- 其他合法 Lock 使用独立 takeover reason。

Priority 不是 LockRequest 排队优先级或抢车分值。

---

## 22. Lock 取消 / 到期

Lock 取消 / 到期：

- 不恢复旧 Priority；
- 不恢复旧 expires_at；
- Vehicle 真正开放后重新读取当前事实仲裁。

如果原 Recommendation 仍合法：

> Customer visibility 继续按 Recommendation / PDM-14 判断。

Recommendation cancellation、Priority release / expiry 均不得反向撤销已经合法成立的 Lock。

---

## 23. Transaction 与 Priority

已有 in-progress Transaction：

> 不得新建 Priority。

active Priority 期间进入正式 Transaction：

> 当前 Priority ended。

Transaction 取消 / correction 后：

- 不恢复旧 Priority；
- Vehicle 真正开放后按当前事实重新仲裁。

Recommendation cancellation、Priority release / expiry 均不得反向撤销已经合法成立的 Transaction。

完整 Transaction / Deposit / Refund / Correction 状态机由 PDM-19 冻结。

---

## 24. Priority current responsible

Priority current responsible：

> 跟随 trigger Demand 当前合法 responsible employee。

不得把 Customer owner 直接写死成 Priority responsible。

Priority create / end / re-arbitration 均不得直接修改 Customer owner。

---

## 25. Handover Batch

员工发生离职 / inactive / 调店 / 降权 / 失去承责资格时：

- Priority 必须进入正式 Handover Batch；
- 失效员工立即失去不再合法的访问 / 动作；
- 合法新负责人接手当前业务责任；
- creator / created_at / 原 responsible / 历史不改写；
- 批量交接允许部分成功，失败集合单独 retry。

Priority 在其他 Guard 仍合法时可继续 active。

---

## 26. Handover 不冻结 TTL

Handover 期间：

> TTL 继续自然运行，不 pause、不 extend、不 reset。

新负责人只接剩余保护时间。

没有合法 responsible employee 时：

- 不允许新建车辆级 Priority；
- 已 active Priority 可以进入待交接，但不能无限冻结 Vehicle；
- 到期前交接成功 → 新负责人接剩余时间；
- 到期前仍未交接 → 正常 expired。

---

## 27. 公海保护

Priority qualification 本身：

> **不是公海保护事实。**

active Priority：

> **是公海保护事实。**

Customer 有 active Priority 时，不得按普通无业务 Customer 直接入公海。

Priority ended 后重新读取 Application / Demand / Lock / Transaction 等其他保护事实。

历史曾经有 Priority 不构成永久公海保护。

---

## 28. Priority ended reason

Priority 主状态：

- `active`
- `ended`

ended reason 至少能够表达：

- Customer abandon；
- employee Priority release / 不推荐此车；
- TTL expired；
- Demand inactive / no substitute trigger Demand；
- priority qualification disabled；
- match invalidated / tier downgrade；
- Vehicle unavailable；
- Lock converted / takeover；
- Transaction started；
- correction / 其他正式 lifecycle reason。

**Recommendation cancellation alone 不属于 Priority ended reason。**

---

## 29. Priority ended 后重新仲裁

Priority ended 且 Vehicle 当前：

- 真实开放；
- 无 active Lock；
- 无 in-progress Transaction；
- listing_cycle 有效；

则：

1. 读取全部 Customer 当前合法 Match Result；
2. 有 Priority candidate → 统一重新仲裁；
3. 无 Priority candidate → 普通后续业务流；
4. 当前无人符合 → 本轮不建新对象，但 Vehicle 继续参与未来 Matching；
5. 旧 Priority 历史不删除、不改写。

---

## 30. Event-driven + affected-scope

Priority 重评至少覆盖：

- 新 Vehicle 进入可售；
- Vehicle 恢复开放；
- Vehicle 关键事实变化；
- 客户合法展示价变化；
- Match Result change / tier change；
- Demand active / resume / condition change；
- Demand paused / completed / cancelled / readiness 失效；
- Priority qualification 开 / 关；
- responsible employee change；
- Priority release / expiry；
- Lock ended 且 Vehicle reopen；
- Transaction cancel / correction 且 Vehicle reopen；
- stale / invalidated facts。

PDM-13 只消费 PDM-12 current Match Result，不复制 Matching Engine。

定时任务只做 TTL / 异常补偿兜底，不作为唯一机制。

---

## 31. Employee 权限

Priority 员工端查看 / 处理统一服从：

> `identity + permission + data scope + object state`

经理 / 店长不因职位自动拥有全局 Priority 管理权。

后台控制平面操作者不因能配置 qualification / TTL 就自动成为业务处理人。

4S Member 对名邦 Customer / Priority 业务 hard DENY。

不建设独立全局：

- `priority.view`
- `priority.manage`
- `priority.override`

Priority 查看 / 处理必须建立在当前业务责任、合法管理范围和 PDM-02 通用权限模型上。

---

## 32. 明确禁止恢复的旧方向

不得恢复：

- 独立“客户专属”体系；
- 人工创建 Priority；
- 人工转让 Priority；
- Priority override；
- 人工修改 expires_at；
- 人工续期；
- ended Priority 强制恢复 active；
- Priority = Lock priority；
- Customer Level 自动赋 Priority；
- Priority 自动给 Customer 详情 visibility；
- Priority 自动授价格权益；
- 客户端暴露 Priority 内部术语；
- old global priority.view；
- hidden = offline；
- active Lock = no_match；
- stale Match Result 驱动 current Priority；
- Priority ended = 强制公开 Vehicle；
- Recommendation cancellation = 自动 Priority release；
- Recommendation cancellation = 反向撤销 Lock / Transaction。

---

## 33. Future Handoff

PDM-13 输出 8 条 future handoff：

- `HO-P13-P14-001 = HANDOFF_CLOSED / source_backwrite=YES`：PDM-14 Final 已承接 Recommendation / visibility suppression、restore、Recommendation end 与 Priority release 独立，Priority recommendation_id 仅作追溯，Priority 不授 visibility/price-right；
- `HO-P13-P17-001 = HANDOFF_CLOSED / source_backwrite=YES`：PDM-17 Final 已正式承接 active Priority 作为公海保护事实；Priority qualification 本身不是保护事实，只有 active Priority 才阻止直接入公海；进入公海前必须由对应 Authority 完成、取消或正式交接；
- `HO-P13-P18-001 = HANDOFF_CLOSED / source_backwrite=YES`：PDM-18 Final 已正式承接 Lock × Priority——active Lock 阻止新 Priority 但不阻断 Matching；正式 Lock 成立结束 active Priority；Priority Customer 自己 Lock 可记 `converted_to_lock`；Priority 不作为 LockRequest 抢车优先级；普通 Lock 只占车，Priority-origin Lock 继承客户侧排他可见性；Lock 结束不恢复旧 Priority；
- `HO-P13-P19-001 = HANDOFF_CLOSED / source_backwrite=YES`：PDM-19 Final 已正式承接 Transaction × Priority：in-progress Transaction 阻止新 Priority；active Priority 进入合法 Transaction 时 ended；Transaction cancel/correction 不恢复旧 Priority；Vehicle 真正重新开放后按当时 current legal Match Result 重新仲裁；
- `HO-P13-P20-001 = HANDOFF_CLOSED / source_backwrite=YES`：PDM-20 Final 已正式承接客户端不得暴露 Priority 内部术语、active Priority/Priority-origin Lock 的普通入口排他，以及公共在售/今日新增统计排除非普通公开集合；
- `HO-P13-P21-001 = HANDOFF_CLOSED / source_backwrite=YES`：PDM-21 Final 已正式承接员工 Priority 待处理、TTL/expires_at、Recommendation 入口、合法提前 release，并禁止人工 create/transfer/override/renew/revive；
- `HO-P13-P22-001`｜`HANDOFF_CLOSED / source_backwrite=YES`：单 Customer qualification 开关与全局 TTL 默认配置已由 PDM-22 Final 承接；
- `HO-P13-P25-001`：qualification/create/arbitration/TTL/tier downgrade/early release/trigger Demand/handoff/ended/re-arbitration/组合动作审计。

---

## 34. Current / IA / Low-Fi stale carrier

当前只登记、不施工：

1. `E05-05｜创建 Priority` 仍残留人工创建语义；
2. `E05-05::HIDDEN_CONTROLLED` 仍残留 Priority 直接授 Customer 详情权；
3. 历史 global `priority.view` 方向已 superseded；
4. 客户端普通在售 / 今日新增统计缺 active Priority 排除；
5. PC 缺单 Customer qualification 开关与全局 TTL 配置真实 Action；
6. Employee 端缺合法 responsible Priority 待处理、剩余 TTL、Recommendation、release / 不推荐此车真人 Action Contract。

统一：

> `STALE_CARRIER / DEFERRED_TO_POST_PDM25_IA_LOWFI_ALIGNMENT`

不得用 stale carrier 反向覆盖本产品 Authority。

---

## 35. Final Integrity

当前正式规则 / 修复 Atom：

- Batch 1：11；
- Batch 2：5；
- Batch 3：6；
- Batch 4：8；
- P13-LIA：8。

合计：

> **38 条。**

当前有效 Final 前完整性报告：

> `07_重建工作区/PDM-13_Final前完整性复核_R2_2026-10-05.md`

结果：

```text
SOURCE_TO_ATOM = PASS
ATOM_TO_SOURCE = PASS
SEMANTIC_COMPLETENESS = PASS
COMPLETED_PDM_INVARIANT = PASS
CROSS_PDM_HANDOFF_INTEGRITY = PASS
NEGATIVE_CLAIMS_VERIFIED = PASS
STALE_CARRIER_LEDGER = REGISTERED

MISSING_RULE_UNRESOLVED = 0
SEMANTIC_DETAIL_GAP_UNRESOLVED = 0
CROSS_PDM_CONFLICT = 0
HANDOFF_GAP_UNRESOLVED = 0
PDM13_LOCAL_PRODUCT_CHOICE_UNRESOLVED = 0
PDM13_LOCAL_DEFERRED_UNRESOLVED = 0
```

因此：

> `PDM13_FINAL_CANDIDATE_READY = YES`

---

## 36. Final Gate

用户已于 2026-10-05 最终批准本域规则并确认执行。

当前状态：

> **`PDM-13 = COMPLETE / INTEGRITY_PASS`**

正式 Authority：

> `07_重建工作区/PDM-13_最终完整规则.md`

5 条 incoming handoff 已在 Final closeout 中关闭并完成 source backwrite。下一域允许进入：

> **PDM-14｜Recommendation / 单车授权 / visibility lifecycle**

IA / Low-Fi / Engineering 继续禁止提前施工。

> 2026-10-07 Source Backwrite：对应 PDM-22 handoff 已由 `07_重建工作区/PDM-22_最终完整规则.md` 正式承接；以 CROSS_PDM_HANDOFF_REGISTER 的 `HANDOFF_CLOSED / source_backwrite=YES` 为准。
