# 名邦汽车 V1｜F05-7 客户Owner与Demand负责人独立及正式Demand改派失效｜B真PG16交接

> 2026-10-19（新加坡时间）。B分支 `feat/f05-real-delivery-acceptance-closeout-01`，任务`F05_REAL_DELIVERY_AND_TRUSTWORTHY_ACCEPTANCE_CLOSEOUT_01`。本轮修复PDM Final业务权限语义，与生产Issuer签发及A独立验收是两回事，**不能声明F05整包完成**。

## 一、纠正此前一项业务规则误判

- [PDM-11 Final §10](../../07_重建工作区/PDM-11_最终完整规则.md) 明确Customer current Owner与每条Demand的`demand_responsible_sales_id`是两层独立事实；普通Owner变化**不得自动迁走Demand负责人**，真正Demand改派必须走正式reassignment并保留历史。
- [PDM-12 Final §25](../../07_重建工作区/PDM-12_最终完整规则.md) 允许当前Demand负责人在合法名邦员工身份、权限、scope与对象状态下处理Matching。
- 之前代码与[历史Run39146408975](https://github.com/suzhe868-arch/mb/actions/runs/39146408975)曾将`current_owner_employee_id = demand.responsible_employee_id`作为硬条件，并让每一次Customer Owner变化触发旧Match不可逆invalidated。该Run的PG16断言在当时代码下确实通过，但**这个业务断言过严，现已由PDM11规则纠正，不能再当作当前正确性的验收依据**。不能抹除其历史日志，只能明确标注已被取代。
- 与上一轮F05-9按PDM-14修正跨Owner合法Demand推荐的规则保持一致：Matching和Recommendation仍为两个不同业务动作，任何Match Result本身不授予Customer可见、Priority或Lock。

## 二、实际源代码改动

提交：[7a753e225bf2c20dfa1dcc261a723e968082373c](https://github.com/suzhe868-arch/mb/commit/7a753e225bf2c20dfa1dcc261a723e968082373c)。

1. `engineering/src/f05-matching-service.mjs`：保留当前合法Employee角色和令牌、Demand行`FOR UPDATE`、Customer行`FOR SHARE`及Demand responsible=actor、对Customer的真实显式Match scope；仅要求Customer仍`assigned`且当前Owner非空，而不强制其与Demand当前负责人为同一人。
2. `f05-matching-discovery-service.mjs`的NEW_DEMAND权限查询和NEW_VEHICLE/RULE_CHANGE受影响候选、`f05-matching-retry-worker.mjs`领取条件同样使用独立Demand responsible与当前Customer合法状态，拒绝临时/旧Owner冒名操作。匹配受影响队列原租约stamp、同generation CAS、源TTL验证及有界退避原封保留。
3. `engineering/catalog/000031_matching_ttl_retry_disposable_test_only.sql`、`000038_matching_optional_price_safe_view_disposable_test_only.sql` 的最终安全视图同样移除Owner/ Demand相等的虚假资格条件，仍严格校验Customer active且assigned、合法当前Owner非空、Demand active、当前负责人合法名邦Employee/role、显式Scope、来源及ListingCycle等真库事实。
4. `engineering/catalog/000028_matching_invalidation_disposable_test_only.sql`：Customer的account_status/level变更仍按原业务失效匹配；普通Customer Owner变化不改写独立Demand旧匹配。真实`demands.responsible_employee_id`变更改为触发旧Current Result invalidated，并生成不可变`matching_change_events(trigger_kind=DEMAND_RESPONSIBLE_CHANGED)`；Demand状态变化原有失效逻辑保持。员工Role变更旧结果失效规则仍保持，触发器仍为现有26项、无生产DDL扩权。

## 三、真库/HTTP正反例与回归

受测代码SHA`7a753e225bf2c20dfa1dcc261a723e968082373c`，[Run39151470755](https://github.com/suzhe868-arch/mb/actions/runs/39151470755)官方`completed/success`。Node**150/150**，物理非特权PostgreSQL16**260/260**，合计**410/410**，失败0、跳过0。测试记录`ok 14 - PG16 Customer Owner change preserves independent active Demand matching; Demand reassignment invalidates frozen current`。

实际非生产PG16使用两名现存真实F02测试Employees：Customer Owner从59700变为59702，Demand负责人保持59700；已有Current Match继续合法可读，员工59702尽管是新Customer Owner也因不是本Demand负责人而不能抢做Match；原合法Demand负责人59700继续实际HTTP成功重算，且Customer Owner未被反写。然后物理将`demands.responsible_employee_id`转为59702：旧冻结Result立即变invalidated，匹配审计真实追加`DEMAND_RESPONSIBLE_CHANGED`，原负责人再操作403；即使将负责人改回59700旧历史不复活，只能通过新的合法Matching事务恢复有效Current。测试同时确认Recommendations/Priority/VisibilityGrants绝无自动建立。

其余先前已通过的F05-7 TTL/source/dictionary/Worker并发恢复、F05-8 Priority、F05-9 Recommendation/免费批发查价权、F05-10咨询全模块，均由同一单Job同SHA完整回归验证。无跨SHA拼成绩、无Mock替代PG16业务正例。

## 四、仍未解决的正式门禁

本轮源为隔离`APP_ENV=test/NODE_ENV=test`和`DISPOSABLE_TEST_ONLY`；正式F03员工身份及Customer/微信、名邦/4S/JYT三来源Issuer未签，真实PDM11 Demand responsible跨域改派Issuer/完整审计链仍需单独验证；公海D1正式Owner claim到Consultation分配、M94完整历史迁移与回滚、生产持久Worker/可靠Event和C/E跨端验收未完成。旧66历史原65通过1 blocked、PR113 23成功5失败保持，五Source独立签约继续`SOURCE_GAP_OPEN/FAIL_CLOSED`。**当前`B_IN_PROGRESS / NOT_READY_FOR_A_REVIEW / PRODUCTION_NOT_READY`**；B继续同一F05整包，F06～F08暂停，正式main未更新、PR尚未创建。
