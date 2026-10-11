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


## 2026-10-12｜响应A首次复验两项必修：数据库完整因果与v18历史来源连续可信

**A原始审查**：[PR #38 复验评论](https://github.com/suzhe868-arch/mb/pull/38#issuecomment-6111960790)。此前50/50绿灯只是旧SHA阶段，A并未验收或合并；本轮不变更冻结48 Job、不解除真实微信客户身份源缺口。

1. **A-F05-3G-01已定向整改**：仅在本包新000019 DDL新增事件`event_version`及Current/Event两个**PostgreSQL16 DEFERRABLE INITIALLY DEFERRED CONSTRAINT TRIGGER**，事务COMMIT时依据真实PG16 Event按event_id顺序重算`absent → active → removed → active`、APPLIED/NOOP及状态版本；强制Current及完整事件链最终一致。独立直接执行合法形式的Current INSERT无ADD、Current UPDATE切换并版本+1无Event、单独伪造REMOVE Event且Current未变，**SQL陈述即使被允许，也必须在真实COMMIT被拒绝、历史/当前均回滚**。原append-only禁止UPDATE/DELETE、唯一FK、PUBLIC无直写授权不退化。正常ADD/重复、REMOVE/重复、再ADD、并发、故障注入和历史不变保持。
2. **A-F05-3G-02已定向整改**：新独立v19验证器固定原已签v18精确`000018` SQL checksum和实测SHA `21a7ed3c1757147291154f91a286fdd04c58efc4f73a76dc1db71cc42b21d9d1`，在应用000019前从全部16条原始迁移记录构造有序SHA256，存入新增单行不可变`f05_3g_migration_attestation`；每次v19 verify除真实catalog匹配外，重算并比较**全部前16条历史记录**和原v18签名。直接篡改000018 checksum、structure_sha256、旧000017 checksum、删除000018以及修改历史封印都不能被v19 verify认可；每个注入在独立PG16事务ROLLBACK恢复，不能靠旧v18校验器在v19运行（旧版本必须按设计拒绝）。
3. **新增物理负例**：`G-A09`（三种直接SQL Current/Event因果绕过）和`G-A10`（四组完整迁移历史污染、删除与不可变封印），连续真实PG16隔离source通过 **G-A01～10 10/10**，旧v18先行18/18，HTTPS仍 G-B01～07 7/7。最终同SHA官方Actions成功run ID、两个新Artifacts及SHA以PR新增正式评论填写，**不得复用旧SHA成功结果**。
4. **信任与权限边界**：新表仅CI专属迁移所有者`f03_ci`在隔离PG16中进行合成业务事务，`REVOKE ALL FROM PUBLIC`且没有新增任何真Customer登录/生产写账户。拥有该迁移表本身的DDL超级权限者仍可能禁用trigger/修改代码，本批不宣称防数据库Owner敌对schema变更；正式上线必须以单独迁移owner/运行时DB Role隔离工作单处理，不把测试用`f03_ci`等同生产角色。
5. **缺口保持**：Customer微信受信Session→Favorite Actor，旧v18 API在v19正向共事务转换、普通批发无Lock Owner、隐藏原因、实际图源/新JYT车型、生产资金电话继续`SOURCE_GAP`。F05/F04生产/C-H01/V1仍`NOT_READY`。

