# 名邦汽车 V1｜F05-10 真实F05-9 Recommendation → 隐藏车正式咨询来源｜B真PG16交接

> 日期：2026-10-19（新加坡时间）。责任B；工作分支 `feat/f05-real-delivery-acceptance-closeout-01`。**这是独立非生产PG16实际业务纵切，不是PDM17公海Owner真实签发/生产发布，也不是F05全包READY_FOR_A_REVIEW。**

## 一、本轮补上的跨域功能

PDM-15 Final §9要求咨询保存客户实际点击的**直接来源**，不能使用“最近一条推荐”替代；§10要求对来自Recommendation的咨询先选择仍合法的当前推荐人，然后关联Demand负责人，再当前Customer Owner；§8允许隐藏且可售的Vehicle在客户拥有合法详情入口时创建咨询。之前F05-10只有`POST /api/v1/catalog/vehicles/:vehicleId/consultations`，只允许普通visible＋anonymous车辆，强制分配给Customer Owner，所有咨询source都落`other/vehicle_detail`。因此，F05-9中已经真实PG16创建且客户安全可见的隐藏Recommendation无法关联正式Consultation。

代码提交：

- [1b987ff10df3daf603c5823e84fb533c183b850d](https://github.com/suzhe868-arch/mb/commit/1b987ff10df3daf603c5823e84fb533c183b850d)：新增独立安全HTTP入口`POST /api/v1/catalog/recommendations/:recommendationId/consultations`，严格loopback、Customer Bearer、合法路径、空请求体、幂等键、不可伪造actor/owner/role；服务从物理F02 `recommendations`和当前 `f05_recommendation_safe_customer_test` 双重读取验证所属客户及有效Authorization，不接受请求指定recommender、assignee、customer或vehicle。隐藏车仅因当前安全Recommendation成立而接受，普通public direct-detail仍拒绝hidden。
- 咨询首次创建时将真实来源`{kind:'recommendation',recommendationId,sourceDemandId,issuer:'DISPOSABLE_TEST_ONLY'}`写入不可变 `consultations.source_relation`，合法Source与current关联Demand/员工Scope逐项鉴权。客户点击顺序不同但Consultation同Customer/Vehicle/Cycle已open时，只增加audit TOUCH，不覆盖原source、assignee或SLA deadline。SourceKey进入幂等fingerprint，跨推荐、公开入口不能用相同事件键偷换来源。
- [9189e1ecb239074919386c83009077c38988e823](https://github.com/suzhe868-arch/mb/commit/9189e1ecb239074919386c83009077c38988e823)：修复Recommendation END并发的业务行锁顺序。先通过不加行锁的来源索引定位Vehicle，再`vehicles FOR SHARE`，随后按推荐END相同顺序`recommendations FOR SHARE`严格重验权限；END若已提交即安全404，不发生推荐已结束却新建source的竞态或Vehicle/Recommendation锁循环；新增真正两个PG16事务并发断言。

本轮不修改PDM17 D1已有`d1_owner_ci`独立合成来源，也不宣称已接入正式公海可领取Owner；不能把D1的测试源或单个Owner字段拼接后当作真实领客证明。

## 二、真实跨服务HTTP／物理PG16测试

最终受测代码SHA`9189e1ecb239074919386c83009077c38988e823`，[GitHub Run39153146588](https://github.com/suzhe868-arch/mb/actions/runs/39153146588)`completed/success`。Node **150/150**，实际非超级用户PG16 **261/261**，总 **411/411**，0 failed、0 skipped。新增`ok 3 - PG16 real F05-9 Recommendation -> hidden PDM15 Consultation preserves direct source and selects current Demand assignee`。

新增PG16真业务链：
1. 通过真实F05-9 `recommendation.mutate(CREATE)`及真正的Frozen F02 `recommendations`、`vehicle_visibility_grants`为具有独立Demand负责人的Employee创造一个可追踪Recommendation，Customer Owner与Demand responsible不同。隐藏批发Vehicle公开详情咨询拒绝。
2. 用当前Customer Bearer和真实Recommendation ID经HTTP创建`consultations`，物理验证原`source_relation.kind='recommendation'`、`recommendationId`、`sourceDemandId`、当前合法Demand assignee、15分钟固定首次响应deadline。
3. 同事件键回放只返回原Consultation；并发执行真实F05-9 `END`和另一条推荐咨询Touch，只有合法事务可成功，另一路可安全404，无死锁；END后新点击不能从历史推荐新建咨询，已有Consultation的初始来源、处理人、SLA均不自动漂移。
4. 测试有真实物理`f05_catalog_consultation_actor_proof_test`“单Customer一条”约束，先验证旧Owner公开入口拒绝hidden，再临时切换合法当前Demand处理人Scope，用例结束恢复唯一处理人证明；`f05_find_car_level_entitlement_test`测试数据在该用例后清理，避免影响后续F05-6独立测试。

上述仍是在`APP_ENV=test/NODE_ENV=test/API_HOST=127.0.0.1`＋`f05_catalog_test`＋`DISPOSABLE_TEST_ONLY`物理隔离PG16，非微信/F03正式Issuer或在线真实手机端证据。

### CI真实失败及整改痕迹（不得隐去）

- [Run39152482516](https://github.com/suzhe868-arch/mb/actions/runs/39152482516)：新增用例初始化时重复插入Customer唯一处理人证明，真实PG16 unique key失败；更改为现有唯一证明的当前受权切换。
- [Run39152624609](https://github.com/suzhe868-arch/mb/actions/runs/39152624609)：负例在切换处理人证明之后才检查公开隐藏车，实际先命中处理人Scope拒绝403而非期望404；改为在合法Owner证明下先测公开隐藏车，再切换Demand负责人。业务拒绝一直有效。
- [Run39152740021](https://github.com/suzhe868-arch/mb/actions/runs/39152740021)：推荐咨询用例自身通过，但权益测试行未清理，影响后续独立Find-Car测试的相同Level ID主键；更改为用例内部临时插入并在finally清理。
- [Run39152878850](https://github.com/suzhe868-arch/mb/actions/runs/39152878850)：上述数据隔离修正后已有同SHA全量Node150/PG261成功。
- [Run39153146588](https://github.com/suzhe868-arch/mb/actions/runs/39153146588)：增加END与咨询并发业务锁顺序保护后，新的同SHA **Node150/PG261全部通过**。两次不同SHA成绩独立记录，不拼接。

## 三、剩余正式交付与接力

F05-10-D1现有Owner Claim/Manager Assign只有另一独立`f03_auth_test`、`d1_owner_ci`的CI合成来源及隔离F03会话，不属于本轮已完成的正式公海Owner Authority。今后要实现真正D1合法领取→正式Customer Owner、咨询承接、零Owner待分配，必须先由A独立核验并规定跨F03/PDM17来源，不能在此用测试领取自动签生产Customer Owner。正式Customer微信身份、F03 Employee能力/Scope、多来源JYT/4S/名邦签发、M94完整历史迁移/回滚、持久生产Worker、全部C/E端真实联调、五Source签署及A全包独立验收仍未闭环。

旧66历史65真实通过＋1Blocked、PR113 23成功5来源失约的账本保持，未改冻结Source工作流或正式main。生产继续Fail Closed。**当前`B_IN_PROGRESS / NOT_READY_FOR_A_REVIEW / SOURCE_GAP_OPEN / PRODUCTION_NOT_READY`，下一责任B，F06/F07/F08主线暂停**。不存在以411项CI替代完整生产验收。
