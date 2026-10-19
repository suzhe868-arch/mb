# 名邦汽车 V1｜F05-9 Recommendation／隐藏车授权生命周期真实PG16交接

> 日期 2026-10-18。B正式施工分支 `feat/f05-real-delivery-acceptance-closeout-01`，实际代码SHA `021e4d1744e79359d0b74fc56f1ef07e097ea794`，[GitHub Actions Run 39135964087](https://github.com/suzhe868-arch/mb/actions/runs/39135964087) `completed/success`，Node HTTP/安全 **144/144**、非特权物理PG16 **215/215**，均0失败、0跳过。当前仍 `B_IN_PROGRESS / NOT_READY_FOR_A_REVIEW / PRODUCTION_NOT_READY`。

## 已写入实际工程

- `engineering/catalog/000039_recommendation_lifecycle_disposable_test_only.sql`：隔离显式权限scope、冻结创建时顾问/来源Demand/客户展示价快照、append-only操作审计、hidden后续变化真实PG16 trigger、客户维度的安全Recommendation视图。物理F02-1新安装76实体保留，先前31测试侧表+本轮3侧表，总110张，匹配和推荐没有合成业务表替代正式`recommendations`与`vehicle_visibility_grants`。
- `engineering/src/f05-recommendation-service.mjs`：事务校验Employee Bearer、employment active、角色非4S、显式`customer_id`-scope、当前Customer owner、active find car entitlement、vehicle sellability/有效cycle/测试来源证明，存在其他Customer的active Priority即拒绝新Recommendation。创建单条真实Recommendation，冻结`original_recommender`和price snapshot；同周期重复活动推荐TOUCH而不改原始历史；END/VOID保留Recommendation原始对象，且单独撤销该Recommendation支撑的grant。不修改Demand/Customer owner/Match/Priority/Lock。锁定真实Vehicle FOR UPDATE防同车并发跨事务出错。
- `engineering/src/f05-recommendation-http.mjs`与`catalog-readiness.mjs`、`app.mjs`连接实际`POST /api/v1/catalog/recommendations`，仅`APP_ENV=test / NODE_ENV=test / 127.0.0.1 / DISPOSABLE_TEST_ONLY`合法，服务启动前Physical readiness=110表/19测试触发器；不接受body提交employee身份、grant、price、priority、任意额外字段，authorization须真Bearer隔离员工，不是生产API。
- `f05_recommendation_safe_customer_test`要求Recommendation为active、Customer active、FindCar entitlement有效、源和listing周期仍可售、Priority他人排他未生效且隐藏车有该Recommendation对应活跃grant。普通分享／Priority不能直接赠权。客户停用、资格失效只暂停可见，不结束推荐；恢复时重新读Guard，Priority B对A客户视图短暂suppression后恢复。真实visible→hidden触发时对同cycle合法活跃推荐创建grant，不直接unhide Vehicle。

## 七组真实PG16验证

1. 4S及非客户Owner、伪造不相关Demand禁止创建；
2. 隐藏批发车合法推荐产生一条单客户grant，freeze 12000000快照，之后真实价格调至13000000不回写原快照；重放同Key不复制，同一对象再次CREATE只touch；
3. END撤销grant、历史/快照不变，新同cycle再次CREATE得到新推荐对象，不复活旧记录；
4. 可见车开始无grant，变hidden才建立专属grant；其它客户始终无此车源来源的授权；
5. Customer停用、entitlement过期立即安全读取为0，历史Recommendation不删；恢复后同cycle才放行；
6. A和B均已推荐的同车，后A取得Priority，B客户侧可见性变0但Recommendation不结束，Priority ended后B视图恢复，新B推荐受到排他禁止；
7. VOID使本Customer详情消失，且实际PG16 DELETE frozen snapshot、UPDATE append-only events触发23514并拒绝。

Node另增3组测试拒绝生产模式、伪造Header、会话cookie、查询参数、身体越权、非POST，DTO不携客户秘密或实际批发成本。所有测试真实监听loopback；PG16角色`f05_catalog_ci`非超级用户。

## 尚不成立的边界

- **这只是F05-9的非生产业务纵切，不是F05-9最终完整生产验收。** 正式F03既有Employee Session与Recommendation管理Permission仍未签发复用；只能用显式隔离测试Scope。
- 目前保存的是合法客户展示价的创建时不可变历史快照，**未实际创建PDM10批发Recommendation所对应免费当前周期价格查看权益**；不可说免费查价已交付。
- F05-8并未真实开发Priority资格/候选排序/TTL/release/下一客户仲裁。本轮只读取既有Priority对象进行推荐安全互斥，不代表F05-8本体已完成。
- 生产JYT/4S/名邦Issuer、微信Customer签发、历史M94迁移、端到端C/E UI及A独立验收仍是阻断。原旧66 Oracle和PR113旧来源失败一律保留原实情。**main SHA `9181a997edae1ad46fcda1b5a4777826512be955`未改，没有PR或生产放行，F06-F08按A顺序暂停。**
