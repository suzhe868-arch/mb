# 名邦汽车 V1｜F05-3F Favorite当前物理载体与同车同周期消费者关系来源审计

**B施工单范围**：A于2026-10-11正式放行 F05-3F，仅隔离真实PostgreSQL16/loopback TLS，所有前置F05-3E正式验收与46项冻结作业保持有效。本批若Favorite真实现时表/签发源不存在，只有`FAVORITE_CARRIER_AUDIT_COMPLETED_SOURCE_GAP`审计/安全拒绝资格；绝不宣称客户已可收藏或转换后Favorite得到正向保全证明。

## 一、来源与业务边界

- 真PG16 M94→000015→000016→000017原冻结v17签源JYT Employee独立凭据→000018增量受信转换的封印流程，与原F05-3C正式原生回归全部保持不变。
- 只有`Lock / Transaction / Recommendation / customer_price_cycle_unlocks / customer_price_unlock_events / vehicle_images / vehicle_price_history / vehicle_visibility_grants / Customer / JYT lineage / ListingCycle`作为当前已签物理载体可验证，**这些绝不是Favorite/收藏的代用品**。
- 新`audit.mjs`使用实际PG16 `pg_class`、`information_schema`、版本/结构核对来检索现时Favorite、收藏、bookmark载体及业务字段。无可信Favorite状态/收藏/取消/重放Audit与Customer+Vehicle对象FK来源时，只可`FAVORITE_PHYSICAL_CARRIER_SOURCE_GAP`（Fail Closed），不建假Favorite表、不向前端推出成功投影。
- 在真实隔离库的`JYTF05C-UNSCOPED`来源上，先用真实M94 FK新增CI-only合成Customer、活动Lock、真实Recommendation、周期解锁、图片及价格历史记录，**通过原F05-3C代码及真实Employee的现时manage/read/Team与活动Lock对象资格**发生一次合法原Vehicle+原Cycle转换，两个独立PG16 Backend验证并发Lock取消被原生`55P03`拒绝；转换前后对八组真实关系和Customer/lineage/cycle按PG16 `row_to_json`计算SHA256并一一比较，不能凭纯JS快照声明成功。
- F05-3C原来的完成交易拒绝、同步编号压制、不可变账和跨域回归仍由旧冻结46个Job全文保留。新源测试F-A01～08和HTTPS F-B01～07均要求两份原生Artifacts及最终同SHA的48/48 GitHub Actions；真正产出后以PR评论补运行号/SHA及证据ID。
- HTTPS只提供新`/__ci__/f05-3f/v1/vehicles/:id/favorite`的**始终拒绝**回环对照端点，非正式生产API；匿名、未签Customer Favorite、Employee、SystemAdmin、4S、JYT Token、伪Owner/Publisher、CSRF/Origin及敏感输出一律fail-closed。不能把它写成“已实现收藏按钮”。
- **范围未改变**：旧000001～000018、F03～F05-3E、旧46 PG16 Job全文、正式Final/IA/Low-Fi、生产server/C都不更改；只新增F05-3F独立目录与一个专属Workflow，B绝不自行合并main。

## 二、验收分层

已成立真来源的客户关系可以按其FK及实际行hash证明同Vehicle+同ListingCycle一致；真实Favorite载体尚缺时**不得将保全其它载体作为Favorite正向功能PASS**。

F05-3D `GENERAL_WHOLESALE_VEHICLE_SCOPE_SOURCE_GAP_PENDING_PRODUCT_DECISION`，F05-3E `HIDE_REASON_RECALCULATION_SOURCE_GAP`，PDM08 `IMAGE_LOCALIZATION_SOURCE_GAP`，v18未知车型JYT源及生产凭据等保持有效，F05/H01/V1全部`NOT_READY`。

**B阶段待最后CI交接状态**：`FAVORITE_CARRIER_AUDIT_COMPLETED_SOURCE_GAP`；成功CI后`READY_FOR_A_REVIEW / NEXT_OWNER=A`，由A独立审查是否允许审计范围合并、是否需另外签发Favorite可信载体正式施工单。
