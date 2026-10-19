# 名邦汽车 V1｜F05-8 Priority 仲裁、TTL、释放及普通读取安全 PG16 交接

> 日期：2026-10-18。仅B正式执行窗口隔离真实PG16纵切，**不是生产验签/不是A最终验收**。工程代码SHA `59b733dbb12cad50a7b96964958f483d743350a0`。完整CI [Run39138007650](https://github.com/suzhe868-arch/mb/actions/runs/39138007650)：`completed/success`，Node **147/147**、真实非超级用户 PG16 **224/224**、0失败/跳过。上一轮核心版本Run39137356473通过Node147/PG222，补充锁车和资格失效2组后本轮全绿。

## 业务事实与新增真正可运行接口

- `engineering/catalog/000040_priority_arbitration_disposable_test_only.sql`：测试资格(单Customer)、显式员工Scope、全局TTL默认86400秒快照、同周期旧Match版本释放抑制、不可变审计、原F02真实`priority_leases`防手改TTL/ended resurrect/delete触发器，以及`f05_priority_safe_active_test`只读有效性守卫。F02-1 76张不变，本轮新增5张独立测试侧表至总115张，新增3个测试触发器至总22个。
- `engineering/src/f05-priority-{service,http}.mjs`：真实loopback `POST /api/v1/catalog/priority`允许在显式测试环境中`RECONCILE/RELEASE`单Vehicle；Bearer来自隔离员工会话，销售当前合法Responsible/资格和Scope为唯一操作依据，非4S Employee。不接受客户端上报Customer、Match版本、qualification、TTL、grant及任何批发价格。使用事务内Vehicle row lock+event advisory lock、真实PG16 immutable event及成功/失败幂等保护。
- **唯一匹配Authority**：实际使用`f05_matching_safe_current_test`已有PDM12高/可接受Match；`confirmation_needed/no_match`不产生Priority。每Customer先取按tier、Demand.created_at、Demand ID确定的唯一最佳trigger Demand，再跨Customer按同一顺序取最优，同车至多一条active源Priority。不创建第二套Matching、Recommendation、单车grant或批发数字价格权益。
- 创建时冻结全局TTL24h；再匹配只允许同Customer真实Demand触发源切换，不延长原TTL。销售提前RELEASE先终结原Priority、把原Customer+本cycle的所有旧Match result截至当前最大版本纳入抑制，再**重新查询合法候选**选择下一个Customer，禁止自己以另一条旧Demand立刻抢回。只有真正更晚版本的新Match Result可以重新参选。TTL expired、Lock occupancy、底层Match invalidated、资格disabled均不再继续判作合法保护；旧Lease保留历史，下一合法Priority必须新建并持独立TTL。
- `engineering/catalog/000041_priority_safe_consumer_disposable_test_only.sql`让原F05-9推荐客户视图复用真正合法的Priority，而不是只读raw`priority_leases.status='active'`。同时`engineering/src/catalog-service.mjs`为公开List、Detail和Stats复用的`BASE_SELECT`加相同合法Priority排他谓词，防普通Feed/search/count穿透；旧source protection和所有现行Saleability/Visibility Guard仍保留。匹配底层事实失效或TTL/Qualification失效，无须等待扫表就不会继续错误隐藏其他Customer合法Recommendation。

## 真实PG16用例和安全结果

在同一受验HEAD运行**9组 Priority PG16和3组新Node HTTP安全用例**，同时完整回归原F05-9推荐（其Priority冲突测试由手工插入虚构空explanation改为调用真实F05-7 Matching服务生成source result）：
1. 当前没有Match不能创建Priority；有实际安全high/acceptable后方可仲裁。
2. 同一请求Key并发触发一条物理active，优先high而非更早acceptable；同Customer两条high仅最佳trigger Demand，不增加权重；4S拒绝；PG16 TTL字段修改`23514`拒绝；Priority自身零Recommendation/Grant/Price-right。
3. A提前RELEASE后B重新仲裁；相同旧Match再RECONCILE不立刻抢回，新实际Match Result生效后才重新参选。
4. 车辆事实变化引发Match stale时Priority合法安全视图立即0，合法Responsibility清理Lease、保留历史。
5. 构造一个真实PG16已到期的raw Lease，读取视图不允许，RECONCILE先结束旧TTL再新建B Lease，不原地复活。
6. active Lock占用后Priority立即退出安全视图，合法RECONCILE结束Priority；Lock合法结束后按当前Match产生**新Lease**而非复活旧Lease。
7. 单Customer qualification禁用立即从安全视图消失，原Priority清理；重新启用后按当前Match创建新Lease，不能恢复旧Expires。
8. 公共目录Detail+List+Stats基于统一`BASE_SELECT`，对公开可见车辆中的合法Priority排除；Priority保护解除后合法车重新出现。
9. F05-9两客户历史Recommendation仍保持各自对象：A有效Priority抑制B客户详情；底层Match失效后B合法详情恢复，而原Priority raw active不能继续自称合法独占。所有冻结审计与客户可见范围均负例回归。

## 仍未完成，禁止误报

- **本轮只交付隔离PG16操作纵切**。正式后台单客户Priority资格开关与审计、F03当前Employee权限Issuer及数据Scope、Handover Batch、权限/团队过渡、生产JYT/名邦/4S源及微信Customer来源仍未签发，生产保持硬拒。
- PDM13真正自动event driven投递、有效Match变更时的后台主动reconciliation、TTL批量定时结束/失败部分重试尚未建；当前到期由安全视图即时拒绝，随后需要合法操作调用RECONCILE持久清算；不得把读时fail close夸称全自动TTL Worker。
- 没有完整真实Transaction in-progress→取消等跨F06交叉、异常Lock与Priority签发协议、F05-9批发Recommendation免费查价Current-cycle权利、真实C/E/PC客户端完整路径，以及M94生产历史兼容迁移。
- 旧66、PR113旧来源红灯历史原值不动。最新`main`仍`9181a997edae1ad46fcda1b5a4777826512be955`，无PR合并，没有生产准入。本轮`B_IN_PROGRESS / NOT_READY_FOR_A_REVIEW / PRODUCTION_NOT_READY`。F06、F07、F08保持A正式暂停。下一责任仍B。
