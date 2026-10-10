# 名邦汽车 V1｜F03-3 服务端字段安全投影消费合同

> 状态：P包合成 PostgreSQL 16（PG16）合同，不是生产接口、微信登录实现或用户权益授权源。唯一实施分支：`feat/f03-package-p-field-projection`。依据 PDM-01/02/09/10/11/16/21/22/25 Final。

## 基础原则

服务端必须以**当前可信身份、当前账号与用户等级、当前真实对象可见范围、当前权限、个人否决和数据范围**决定响应字段；不能先发送数据库完整对象再在客户端隐藏。缓存/导出/打印/复制都重新进行授权。没有合法真实来源时必须拒绝，不得根据请求中的等级、员工角色、上下文`mode`、旧页面副本或旧token下发敏感数据。

当前 `service.mjs` 是**CI-only安全适配器**：在`CI=true`且`GITHUB_ACTIONS=true`的隔离测试中才能调用，且只做读出合约。生产必须由F04现行登录/权限服务、F05真实权益与报价验证器提供可信事实，不能把本测试适配器原样开放HTTP。

## 输入与结果

- `projectCustomerVehicleList(auth, trustedContext, vehicleId)`：不保存报价权。合成当前customer、LEVEL、授权的LIMITED/UNLIMITED模式、车辆/周期/有效报价、隐身与Priority独占同时守卫后，最小投影；批发LIMITED列表**永远没有数字客户售价**。
- `projectCustomerVehicleDetail(auth, trustedContext, vehicleId)`：已存在当前挂牌周期合法解锁方可返回LIMITED批发精确报价；未解锁但存在合法数字报价则返回`P_NEEDS_F05_ATOMIC_UNLOCK`和`--万`，由**F05原子扣次/解锁成功后**再次读取才能显示数字；没有可信数字报价返回`PRICE_CONSULT`，不能假造数字。
- `projectEmployeeVehicle(auth, currentPcSession, {vehicleId,teamId,view})`：必须在当前会话、当前权限和独立的权威Vehicle对象范围都证实后才能返回业务字段。本批旧M94**无法证明车辆到Team/4S商户的对象级归属**，因此员工detail/list/export/history/copy/print/cache一律返回`P_VEHICLE_SCOPE_UNPROVEN`、不附带车辆字段。即使拥有`crm.customer.view`也不得借用为`vehicle.read`或业务导出权限；始终剔除敏感批发内价、发布人电话和VIN，直到F04/F07有**额外独立合法当前能力、对象范围和电话发布人来源证明**，绝不恢复单独`can_call_wholesale_phone`。
- `projectEmployeeExport`：仅上述调用的重新鉴权简化入口，不形成可复用的永久导出授权。不存在可以给生产用的完成授权Token。

## 字段和有效状态

- 可传客户字段仅：`vehicleId`、`listingCycleId`、`sourceType`、当前合法`price`与`priceState`。任何VIN/手机号/批发底价/PublisherID/资金/角色或账号字段不可随车对象返回。
- `LIMITED` 和 `UNLIMITED` 是**服务端可信权益模式**，不是把`ordinary/fan/VIP`字符串硬编码成永久权益。具体客户等级到价格模式映射、可配置每天额度和销售加次均归F05配置及原子账本维护；本批合成适配器参数`entitlementAttested`只是测试标记，不能作为生产鉴权。
- 批发客户列表LIMITED隐藏数字价，详情已解锁才显示；批发UNLIMITED列表/详情当前合法价都显示且不扣额；名邦/4S非批发独立公开价格可读；没有报价显示「价格咨询」。挂牌周期变化后旧解锁不能用于新周期。
- `vehicle.source_type`、`platform_visibility`、`source_sale_status`、当前挂牌周期、Priority独占和合法grant由现存PG16结构读取；未开放或已归档车辆必须拒绝，不因缓存或曾推荐而绕过。

## 生命周期与越权拒绝

- 账户停用、权限否决、Team成员资格/数据scope/capability结束、员工禁用、来源变更、隐藏车Grant撤销、Priority状态变更都要求服务端重新授权。
- System Admin不因后台控制权自动获得员工内部价；4S成员独立于名邦员工业务域，不可凭员工通用读权限拿批发底价。
- 导出/打印/复制/PDF和历史投影遵循同一白名单。已发至手机的历史字节无法远程逆向收回，F04/H03/H04必须实现客户端过期与清理。

## 尚不具备的正式可信事实（严禁擅填）

现物理94表的`vehicle_price_history`有泛化`price_kind`而不是已经由F05正式版本签署的报价类型枚举；`customer_levels`只有level_code，没有持久化current entitlement mode/每日配额配置；`customer_price_cycle_unlocks`可证明存在解锁，但额度账本和有效授权需F05重新验证；车辆与4S具体商户的强制归属及专门`internal.price.view`能力没有在本包获授权的稳定消费合同。当前测试中的`customer_display`只是**合成测试数据价格类型**，不能等同生产正式报价来源。以上接口在F04/F05正式实现前必须`DENY/DEFER`，不能使用合成上下文作实际用户价格放行。

## A-P-01｜对象归属及导出权限定向整改（2026-10-10）

A 首轮复核发现员工CRM Team权限可代替Vehicle对象归属与导出权限，属于阻断。已修改`service.mjs`：先校验当前受信 F03-1 员工会话与CRM Team/data scope，再调用`currentVehicleObjectScope`检查客观物理数据；现M94仅有`source_type`、`created_by_employee_id`等不能证明业务归属的属性，没有所有批发/名邦/4S来源的正式当前`vehicle_id → Team/store/merchant`关系，故**不为任何员工返回车辆DTO**，统一`P_VEHICLE_SCOPE_UNPROVEN`且`fields`缺省，不给历史、导出、缓存、复制、打印或清单读取。此时不把VIN/内价脱敏误当可越权查询之授权。

导出/历史/缓存/复制/打印另需各自**当前真实业务能力**；即使后续补足Vehicle归属，仍须在F04/F07正式补齐权限和对象映射之后才能开放，`crm.customer.view`不等同导出。所有映射和能力都必须来自服务端实际存储/签发、随当前员工状态与scope即时撤权。**禁止**以客户端提供Team、role、sourceType、合成`entitlementAttested`、车辆公开可见性或缓存旧对象冒充Vehicle业务可访问性。客户C端公开列表和等级价格的合法投影是另一独立合同，保留P1原10项回归。新增PG16三来源归属缺口、Team切换、改来源、个人deny与缓存负例。完整新旧CI记录详见B交接更新。
