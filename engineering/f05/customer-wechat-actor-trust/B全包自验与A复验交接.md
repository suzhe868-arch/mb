# F05-3H｜B工程微信Customer受信Actor来源审计自验与A复验交接

## 一、正式范围

本包在真实隔离PostgreSQL16中复验F05-3G已签v19物理结构，审计 `customer_wechat_identities`、`customers`、`f05_3g_customer_favorites` 之间真实FK、复合唯一索引、现时客户状态和不可变Favorite事件物理关系。两名不同数据库会话的行锁和停用/恢复负例必须运行；微信身份的真实持有权、微信官方code换session、Customer专属撤销与当前session签发仍无可信来源，不能把单纯存储身份行当作合法顾客本人认证。

**审计结论预期：** `TRUST_SOURCE_AUDIT_COMPLETED_SOURCE_GAP / FAIL_CLOSED / CI_ONLY`。所有微信码自报、openid、identity_scope+key、伪customer_id、trusted=true、Employee/4S/System Admin登录Cookie及JYT凭证不得转为客户可执行收藏身份，HTTPS不允许客户业务200，不接真实微信第三方，不操作真实用户资料。

## 二、最小技术实施与验证口径

- 新增 `source-audit.mjs`：仅在GitHub Actions隔离PG16下验证v19原结构签名，读取身份关系目录、外键、唯一索引与当前客户状态；不产生任何正向Customer会话。
- 新增真PG16 Source测试：H-A01～08覆盖身份字段/FK/唯一性、不同Customer隔离、跨客户重用key拒绝、原始key和伪code拒绝、停用恢复、双backend真实行锁/55P03、PC身份不能代理Customer、审计不写Favorite或其它客户经营对象。
- 新增回环TLS测试：H-B01～07覆盖匿名/JYT、Employee/4S/SystemAdmin、重复Cookie/CSRF/Origin、伪Customer/Owner/Publisher头、路径/方法/敏感数据与零业务写。
- 仅新增 `engineering/f05/customer-wechat-actor-trust/**` 和专属工作流；原旧50个独立PG16作业正文不改。CI以B/PR/Actions三者最终同SHA、52/52官方全部success、两新增Artifacts非空且未过期为硬门禁。

## 三、证据清单

本工作流两份Artifact应包含隔离PG16的 `schema-only.sql`、`full-catalog.json`、`inventory.json`、`versions-and-source-diff.json`、`wechat-customer-trust-chain.json`、`source-gap-matrix.tsv`、`true-pg16-*-tests.log`、`sha256sums.txt` 与本中文交接；记录最终Commit、Actions run及Job ID以GitHub实际结果为准。没有上述验证时不得声明 `READY_FOR_A_REVIEW`。

## 四、未关闭的正式边界

保留 `CUSTOMER_WECHAT_SESSION_TO_FAVORITE_ACTOR_SOURCE_GAP`、`GENERAL_WHOLESALE_VEHICLE_SCOPE_SOURCE_GAP_PENDING_PRODUCT_DECISION`、`HIDE_REASON_RECALCULATION_SOURCE_GAP`、`IMAGE_LOCALIZATION_SOURCE_GAP` 及v19生产联调、真实微信/JYT/资金/电话、新车型等未授权事项。F05/F04生产/C-H01/V1维持 `NOT_READY`。

B不得自行合并main，不得将隔离合成Customer视为真实微信已验证。完成实际CI、原始Artifact与全面自验后，以最终PR正式评论报 `READY_FOR_A_REVIEW / NEXT_OWNER=A`，交A独立复核。
