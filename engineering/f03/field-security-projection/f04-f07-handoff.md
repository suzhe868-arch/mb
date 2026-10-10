# 名邦汽车 V1｜F03-3 向 F04～F07 的后续工程交接

> P包只实现隔离PG16下的安全投影合同与负例测试；无微信小程序生产认证、JYT/Collector真实请求、生产员工API和真实收款动作。以下是未来各域需实际验收的接口边界。

| 责任模块 | 应接收的F03-3合同 | 不可直接复用/责任 |
|---|---|---|
| F04 身份与正式HTTP | 接入当前可信登录/员工权限/scope，端点逐请求进行白名单投影、DTO序列化、批量分页、分享缓存和过期；前后端状态一致 | 不能将测试`entitlementAttested`、`CI=true`作为用户真实授权，也不能直接传数据库完整行至前端 |
| F05 车辆与客户查价 | 定义真实`price_kind`报价来源与车辆上架/挂牌周期；客户等级可配置LIMITED/UNLIMITED、普通额度、销售加次；真实原子扣额、幂等、解锁、并发与回滚 | 不允许P适配器直接扣额度，不因查价历史自动产生新周期解锁；正式CRM范围待独立实现 |
| F06 Lock/Transaction/Refund | 对已有当前锁车、优先级独占、交易/退款资金事实做独立服务端状态校验、超时/候补/事务切换；对现金、Deposit和Refund访问单独敏感权限 | P不能提供任何资金写入口或以车对象读权代替资金权限 |
| F07 采集与Publisher/CDN | 发布人电话只按publisher_id/upstream_publisher_id证明，由既有敏感能力和当前范围保护；批发资产URL与图片白名单另行联调 | 不恢复car_code电话定位或新的独立拨号权限，不从缓存向客户泄露电话 |
| H03/H04 正式前端与三端联调 | LIMITED/UNLIMITED价格展示、价格咨询、退权后的重拉和清理缓存、VIN/电话不显示、权限后即刻UI回退 | 客户已保存/截取历史字节无法由服务端强制逆向删除；最终视觉与UAT由后续审核 |

## F04实施前置检查

F04应当建立真正的受信客户认证，以及引用当前等级与价格权益配置的服务端resolver；当任何来源未完成时安全拒绝。不使用用户自报`customerId`、级别、`UNLIMITED`或先前前端缓存做鉴权。车辆4S商家归属映射、报价历史类型、权限粒度和周期缓存版本需与F05/F07实际schema合同再正式核对；没有准确映射不得用字符串猜测开权限。

## 测试与证据引用

P独立CI两项使用原M94结构和合成会话、权限否决/失活/Scope撤销负例，另有旧17个已验收独立PG16版本回归。不修改原000001～000013迁移、不创建000014、无生产数据/微信/Collector/外部写入。最终同SHA运行号与具体通过数见本分支《B全包自验与A复验交接》。

## A-P-01 车辆对象归属与各出口独立权限正式移交

A首次复核明确禁止将员工`crm.customer.view`或请求者自带`teamId`作为Vehicle归属证明。现存M94的`vehicles.source_type`、`created_by_employee_id`、可见状态及Publisher字段都不足以证明所有批发/名邦/4S车辆的当前Team与4S商户归属。本包所有员工Vehicle business view/export/history/copy/print/cache返回`P_VEHICLE_SCOPE_UNPROVEN`，不附带`fields`，不创建权限放行。

F04/F07后续必须在新的正式授权下，提供来源可信且**当前有效**的车辆归属事实：`vehicle_id + listing_cycle_id + source_type + true merchant/store/team ownership + current employee object scope`；F04另需正式受控`vehicle.read`、独立的`vehicle.export`及历史/缓存访问能力解析。每次请求校验当前有效员工身份、所属Team、scope版本、person deny和对应车辆对象，禁止旧缓存、session或前端入参代替证明。没有这份可信事实时不得通过审查，也不得以通用CRM权限、客户公开车价、4S成员的客户页读取反推员工业务导出权。
