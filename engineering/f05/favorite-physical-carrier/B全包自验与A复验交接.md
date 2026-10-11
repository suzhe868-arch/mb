# F05-3G｜B工程收藏独立物理载体与历史事件审计交接

## 已授权业务交付

本包只在真实隔离非特权PG16中，原M94→000018已签版本后追加独立000019 Favorite当前关系和不可变事件账本，原历史迁移、权限、生产和PDM Final零修改。Customer+Vehicle唯一，允许收藏、取消、再次收藏及事件幂等；不以listing_cycle作主键，不产生咨询、推荐、锁车、查价额度或可见权。新表与事件记录不存VIN、手机号、批发价、上游凭据。

- 本包先使用原000018 verify，在签名源不变前提下验证000019注入ROLLBACK、再应用新独立seal；旧000018 verify在新v19物理版本下必须拒绝。
- CI-only synthetic Customer体直接使用M94真实Customer FK，现时Customer active、Vehicle存在、两者SELECT FOR SHARE，同Customer+Vehicle advisory事务锁；状态APPLIED或NOOP均有不可变eventKey历史与payload摘要。并发同车收藏/取消、治理停用竞争和故障ROLLBACK由两个不同pg_backend_pid原生证实。
- 不存在已经验真的小程序微信Customer登录→业务Customer授权映射。新HTTPS回环仅做拒绝，不从Employee、4S、SystemAdmin或JYT Token造Customer身份，不返回200。新客户端Favorite入口和生产Customer身份要由A另行签发。
- 旧F05-3C受信转换仍在旧v18完成，后续v19 Favorite仅通过同vehicle_id物理约束独立关联；旧v18验证器拒绝v19，因此**不宣称v19 Favorite已与旧转换服务在同一生产请求中联通**。此项留A后续v19-aware接入评估。
- 原F05-3D普通JYT车辆经营Owner产品待裁、F05-3E hidden自动重算、PDM08图片双成功、未知新车型及真实第三方均不在本次范围，F05/H01/V1仍NOT_READY。

## GitHub和A验收交接

仅新增工程目录engineering/f05/favorite-physical-carrier下源码、测试、迁移、来源矩阵与交接，以及一个独立Workflow；旧48项真实PG16 Job全文逐字冻结，新2项原生PG16 source+TLS；最终以50/50同B/PR/Actions SHA成功、两份未过期Artifacts及schema-only/catalog/inventory/新旧seal/sha256/原生日志为准。本文件版本为工程预交接，官方CI成功后由PR正式评论记录最终SHA及Artifact IDs。

SUCCESS后B_SELF_TESTED / READY_FOR_A_REVIEW / NEXT_OWNER=A。
