# F05-1 Vehicle字段白名单与消费者合同

可核真实M94字段存在：vehicleId←vehicles.vehicle_id，listingCycleId←vehicle_listing_cycles.listing_cycle_id，sourceKind←vehicles.source_type；它们是**候选字段白名单**，不是已发放业务访问权。

存储source_type精确值wholesale/mingbang/four_s；F04-4签收的CI合成UI目标值名邦/4S不等于真实数据库值。实体域F05-2须正式映射。

当前员工业务读取需要F03有效Session、独立业务read capability、个人deny/Scope、可信现时Vehicle归属及活跃ListingCycle；4S账号直接代表一个合作主体，没有独立组织树。created_by、store/team、CRM owner、前端merchantId都不授予车辆对象权限。

无可信归属时detail/list/export/copy/cache/print/history统一403 F05_VEHICLE_SCOPE_UNPROVEN，响应不得附带fields/Price/VIN/电话/内部价/档案、token/客户/资金。

本批CI-only不启Vehicle正向200。冻结F04-1 CustomerId精准CRM对象现时Owner合成200作为非Vehicle回归。生产/资金/外部写入及DDL都禁止。