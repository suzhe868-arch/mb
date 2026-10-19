# 名邦汽车 V1｜F05-9 当前Demand负责人跨Customer Owner合法推荐及后续失权｜B真实PG16交接

> 日期：2026-10-19（新加坡时间）。任务：`F05_REAL_DELIVERY_AND_TRUSTWORTHY_ACCEPTANCE_CLOSEOUT_01`；B分支 `feat/f05-real-delivery-acceptance-closeout-01`。本报告仅涉及真实**非生产**隔离PG16与Node HTTP；尚未达到`READY_FOR_A_REVIEW`。

## 一、Authority纠偏：不能把Owner身份误当作唯一合法推荐资格

正式 [PDM-14 Final](../../07_重建工作区/PDM-14_最终完整规则.md) §§5、7、9、28 明确：Customer current Owner、Demand responsible和Historical Recommender是三种独立事实；当前合法业务责任+权限+scope才可进行Recommendation mutation。规则明确否决旧“只有current Owner才可以Recommendation”的绝对规则，不能把合法Demand responsible错误拒绝。上轮`ba5664733dc392c95e3acb46d1bfdf62e54bc62c`已正确增加`owner_assignment_state='assigned'`防止待分配客户授益，但同一服务仍过度要求actor=current Owner，阻断合法Demand负责人跨Customer Owner执行。

本轮真实代码提交：[a53bde05002427ea07076daddaac82442c1650d3](https://github.com/suzhe868-arch/mb/commit/a53bde05002427ea07076daddaac82442c1650d3)。

- `engineering/src/f05-recommendation-service.mjs`：保留已有Employee合法角色、`f05_recommendation_manage_scope_test`明确Customer业务scope、物理Vehicle锁、Customer`FOR SHARE`及Customer`owner_assignment_state='assigned'`保护。授权从仅Customer Owner，扩大为**当前Customer Owner或当前合法source Demand responsible**的有界替代条件。
- CREATE需提供真实同Customer、仍`active`且`responsible_employee_id=actor`的source Demand，采用`FOR SHARE OF d`直到提交；没有source Demand、只有历史Owner时依然403。即使Customer Owner可操作，其显式关联source Demand仍须验证自身Demand业务scope，不能随意冒领他人的Demand。
- END/VOID如果非当前Owner，只可使用该**当前active Recommendation不可变关联的原source Demand**，复核该Demand此刻active且真正由actor负责；不基于任何旧`recommender_employee_id`产生永久操作权。后续Demand负责人员变更立即收回旧actor的mutation资格；合法Current Owner可按原权限继续维护。
- 无Owner／待分配Customer、4S成员、缺显式Customer scope、历史推荐人、非本Customer Demand、Demand不活跃仍拒绝；不自动创建Priority、Lock、VisibilityGrant或更改Customer Owner/Demand。

## 二、真实Node HTTP＋PG16复验

单SHA [Run39150780302](https://github.com/suzhe868-arch/mb/actions/runs/39150780302)，代码`a53bde05002427ea07076daddaac82442c1650d3`，官方`completed/success`：Node HTTP/安全 **150/150**；非超级用户`postgres:16-alpine`物理库 **260/260**；合计**410/410**，失败0、跳过0。新增集成测试日志`ok 3 - PG16 PDM14 delegated Demand responsible may create/end Recommendation after Customer Owner changes; history never retains mutation authority`。

测试在冻结F02表中创建同一Customer的销售A和B；Customer`current_owner_employee_id=B`，独立Demand`responsible_employee_id=A`。实际HTTP检查：原Customer Owner A若不提供合法Demand上下文则403；若明确引用合法active Demand，A可成功CREATE、END与再次CREATE Recommendation，但Customer Owner始终保持B、历史recommender保持A。随后物理更新Demand负责人从A到B，旧推荐人A再操作当前Recommendation 403，而当前Owner B可合法END，最终无活动推荐和意外visibility grant。原有4S拒绝、Owner pending残留ID拒绝、隐藏车grant/免费查价/并发价格解锁/Priority安全竞态全量重新通过。

本次仅`APP_ENV=test`、`NODE_ENV=test`、127.0.0.1、`f05_catalog_test`、`f05_catalog_ci`、`DISPOSABLE_TEST_ONLY`，**不能被称为正式F03/微信签发**。前次[Run39149533685](https://github.com/suzhe868-arch/mb/actions/runs/39149533685)（业务SHA`844de857a370daee9b47dd4ca84767e4b166fea7`、Node150/PG259）仍按旧SHA独立保留，不跨SHA拼合指标。

## 三、对正式交付状态的实际影响

这项纠正使已存在的Recommendation业务入口真正遵守PDM14跨业务责任边界，不是新增无业务价值测试。仍需对完整F05中匹配/推荐/找车的Demand/Owner双责任授权设计做相容性复核，确保没有另一处仅Owner限制与Final冲突；不在此未经A授权下绕开别的PDM当前Authority。

正式F03员工权限及客户微信账号、JYT/4S/名邦车源可信签发、公海Owner合法领取到Consultation自动承接、完整F02/M94历史链和回滚、生产后台Event/Worker、C/E客户端真联调、五正式Source独立签署与A完整复验均未完成。旧66项及PR113红灯保持历史原状，不因此标为新失败或新成功。

**结论：`B_IN_PROGRESS / NOT_READY_FOR_A_REVIEW / SOURCE_GAP_OPEN / PRODUCTION_NOT_READY`。** 责任仍B，不创建高扇出不安全PR、不修改正式main、不开始F06～F08。
