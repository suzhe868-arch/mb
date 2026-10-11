# F05-5｜PDM10权限对象状态与Owner时序表

目标PDM-10 Final §11/§11.1：客户当天额度由员工免费增加，不可收费，普通销售必须当前owner及独立permission；经理、店长需要当前合法data scope和同一permission；4S和SystemAdmin业务硬拒；UNLIMITED下不得新增，LIMITED→UNLIMITED→LIMITED同日历史追加不清零。

真正授权源只接受F03当前PC Employee Session，由IsolatedAuth.withSession完成密码更改/撤销/身份/凭证状态再验证；本批合成权限码customer.quota.add.ci.synthetic只在非superuser PG16测试库生成，永远不作为生产权限。

### 事务提交顺序
1. 接入真实F03 Session并锁凭证、Subject，确认active Mingbang Employee、角色和不受限状态。
2. v21历史与Catalog封印、Employee当前角色、Customer当前Owner/账户状态行锁与合成等级模式。
3. 普通销售必须current owner；经理、店长需同Team当前Membership与独立capability scope binding，个人deny优先；仅CI权限模板安全正例。
4. 锁当天customer_day_quota_ledger，先查idempotency全局键，增加customer_quota_adjustments和不可变v21 receipts，以相同PG事务增加temp_additions。
5. 同日追加累计；不同UTC+8业务日独立；UNLIMITED拒绝新追加但历史保留；Error/timeout/回滚绝不改额度或事件。

### 保留的拒绝边界
- 无独立正式Permission Issuer：生产入口持续SOURCE_GAP。
- Customer微信会话、真实数字价格和Recommendation免费权限均不由员工加次解决。
- source测试只证明合成权限Fixture条件下的授权状态机与真实PG16事务，不证明线上员工可用。
