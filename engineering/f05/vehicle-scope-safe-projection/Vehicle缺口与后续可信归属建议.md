# F05-1 Vehicle可信归属物理核账与F05-2建议

源：冻结M94（94表/608列/435约束/163索引/2120项），结构SHA 7cd90248f51555fff26eb475320b9a10c6f52880263234a31e22210657a2c659。机器枚举26张相关真实表、153条字段；三类物理source_type为wholesale/mingbang/four_s。

能证明vehicles.vehicle_id、source_type、created_by_employee_id，上架周期和员工权限/Team/Store等各自存在；但**不能据此证明车辆当前归属**。员工上传、门店、CRM owner、4S role、Priority和Recommendation grants、publisher_id都不产生Vehicle业务读取授权。

全量Actor×三类源×当前/历史ListingCycle×7类出口 = 252判定；REAL_VEHICLE_SCOPE_PROVEN=0，全部VEHICLE_SCOPE_SOURCE_GAP_BLOCKED，合法会话也403。禁止凭created_by或客户端自报merchantId构造Vehicle 200。

## F05-2建议（本批不实施DDL）

建议A按PDM-02/04/06/21单独审查Vehicle+ListingCycle+source_type与业务归属主体、有效Team/Store及4S账号代表合作主体的关系。若需要新归属事实，应单独下发新版本迁移、唯一现时归属约束、审计/交接历史、CAS并发与回滚兼容方案，必须保留同vehicle_id与历史周期，不建立4S组织树。归属审核需按JYT/名邦/4S各自可信来源确定，未来F05-2执行前新增DDL必须另获A正式施工单。

后续只有正向证明当前归属、员工活跃+当前capability+个人deny+scope、对应ListingCycle状态后才可考虑最小safe Vehicle projection。缓存、导出、历史与VIN/Publisher电话/内部价必须各自独立授权。客户微信登录与资金、CDN/第三方另域处理。V1仍NOT_READY。