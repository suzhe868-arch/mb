# F04-1｜F05～F07及H03/H04消费合同

本文件为**尚待后续消费者正式接收**的技术接口合同，所有未获真实权威的正向动作必须返回 `OPEN_DEPENDENCY`，不能以本文件签收替代代码、真实源或A独立验收。

| 责任域 | 必须来自后端现时可信来源 | 允许前的最小条件 | 缺证结果 |
| --- | --- | --- | --- |
| F04 客户资料 | 稳定customer_id、即时owner历史/门店Team、active、员工身份与个人deny | 对应独立CRM和对象scope、状态与audit同事务重验 | DENY |
| F04 4S账号 | 分离的System Admin主体、合法4S账号和操作审计 | 仅active System Admin可管理；4S之间不得互管 | OPEN_DEPENDENCY |
| F05 车辆归属 | vehicle_id、listing_cycle_id、source_type、真实Store/Team、4S商户绑定和来源版本 | `vehicle.read/vehicle.manage`独立权限、个人deny、业务对象归属及状态 | P_VEHICLE_SCOPE_UNPROVEN |
| F05 内部批发价 | F05价格历史及本单车辆scope，不能从客户端传入 | `internal.price.view`独立授权；编辑另需正常`vehicle.manage`；4S硬拒 | DENY |
| F05 客户报价 | 可信客户ID、当前等级、可配置额度、真实报价与上架周期、解锁账本 | LIMITED仅在F05原子扣额度/既有周期解锁后读详情价；UNLIMITED不可由HTTP自报 | OPEN_DEPENDENCY |
| F06 锁车及候补 | 当前LockRequest、Lock、押金、客户、车辆周期和DB实时时钟 | 6h自动取消、冲突自动候补、Priority独占、实际支付状态与事务守卫 | OPEN_DEPENDENCY |
| F06 交易及退款 | 原Lock合法转交易原因、Transaction状态、唯一Refund来源和在途资金 | 完整并发/幂等、不可变历史/审计及退款阻断 | OPEN_DEPENDENCY |
| F07 发布人电话 | 可信`upstream_publisher_id/publisher_id` + upstream授权 | `publisher.phone.sensitive`、当下对象scope、系统拨号器；禁止car_code | OPEN_DEPENDENCY |
| F07 图片/采集 | 受控源域与图片相对路径、CDN签发/存储来源 | 仅白名单合法图片分发，不用未知第三方凭据 | OPEN_DEPENDENCY |
| H03/H04 三端 | 后端按身份/当前权限签发的DTO最小字段 | 缓存、导出、打印、复制、分享和旧推送在撤权时不得继续泄露 | OPEN_DEPENDENCY |

## 身份与对象不变量
- HTTP上 `Cookie` 只认冻结F03-1签发的不透明会话token；拒重复同名Cookie、旧会话、降权、inactive和错误主体，不信任任何外带“CI=true/role/team/entitlement”头或查询字段。
- HTTPS必须loopback、正确Origin、现场PG16身份和完整M94目录封印；仅GitHub Actions临时合成PG16打开F04测试模块。正式server.mjs**没有导入、没有注册**F04-R01～09。
- 业务的权限守卫应在可写提交前重验当前principal、角色默认+个人deny、动态scope、对象状态、业务版本、唯一键和审计；F04阶段没有拿到可信数据不能臆造业务成功结果。
- 字段脱敏默认白名单；VIN、内部价、真实手机号、敏感上游ID、退款/押金原始字段无独立权限一概不返回；所有路由响应`no-store`且不允许复用旧授权缓存。
- 本合同与已批准 PDM-01～25 Final、Current IA/Low-Fi 存在差异时，以已签Final为准并提交A集中裁决。

**交接状态：OPEN_DEPENDENCY；任何未来正向路由重新取得独立A施工单和真实数据库/HTTP验证。**