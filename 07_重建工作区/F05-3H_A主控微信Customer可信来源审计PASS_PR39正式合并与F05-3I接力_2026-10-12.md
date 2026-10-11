# 名邦汽车 V1｜F05-3H A主控独立验收微信Customer来源审计PASS、PR39正式合并及F05-3I接力

> 时间：2026-10-12｜A正式裁定：`F05_3H_A_SOURCE_AUDIT_ACCEPTED_MERGED_PR39_CI_ONLY`。本轮批准的是**物理身份关联来源审计与安全拒绝**，不是微信用户登陆/收藏生产验收。

## 一、GitHub真实验收和最小边界

- A直接比对最终B工作分支`feat/f05-3h-customer-wechat-actor-trust` / [PR39](https://github.com/suzhe868-arch/mb/pull/39) / [Actions38166372689](https://github.com/suzhe868-arch/mb/actions/runs/38166372689)的HEAD均为`5dca08996f67e41fbc6e6a27584473695b6b4898`，GitHub官方run attempt1 `completed/success`，**52/52真隔离PG16独立Jobs成功**，没有失败/跳过。A以旧F05-3G完整Workflow和新F05-3H原生Workflow核`jobs:`以下**旧50项完整Job定义整段逐字不变**，只附加`h-source`和`h-https`两个YAML行内定义的独立PG16 Job。行内定义不能用仅匹配多行Job的正则误算数量。
- 原生source Job `114549670466`，真实H-A01～08 **8/8成功**，原v18 18/18；HTTPS Job `114549670349`，H-B01～07 **7/7成功**，原v18 TLS 7/7。原生不同`pg_backend_pid()`下Customer行锁碰撞`55P03`、`customer_wechat_identities`当前FK/复合唯一索引、Customer停用/恢复、原F05-3G v19精确结构和审计零Favorite写入都在真实PG16日志中核实。
- 本run官方Artifacts计97份，新source名称`source` ID`11712197256`（78,217B）与新https名称`https` ID`11712271937`（78,190B），均存在、非空、未过期；其命名为通用名称而非`f05-3h-*`，A**按真实Artifact ID**核证不误报不存在。包括真PG16 schema-only/catalog、v19结构/前序签名、原生日志、来源矩阵、sha256与中文交接。
- GitHub最终PR diff只9个`added`：8个`engineering/f05/customer-wechat-actor-trust/**`以及一个专属`.github/workflows/f05-3h-customer-wechat-actor-trust.yml`；冻结旧000001～000019、F03～F05-3G、PDM Final/IA/Low-Fi、C和生产服务端全部未改。
- A正式审查意见：[PR39验收](https://github.com/suzhe868-arch/mb/pull/39#issuecomment-6112665012)，以`expected_head_sha`标准合并，GitHub回执**`merged=true`**，真实merge SHA`1368572b2a470adb0646970811fa99e9d4173327`。

## 二、可以签收与不可以签收

- 已签真实PG16`customer_wechat_identities(identity_scope,wechat_identity_key,customer_id)`中身份复合唯一、Customer FK，和Customer实时account_status及v19 Favorite Customer+Vehicle FK/事件一致性是真实物理事实。
- 官方微信code服务器兑换、session issuer/撤销、当前顾客本人持有凭据、Customer端auth CSRF/Origin联动、正式微信Customer Favorite HTTP全部**未签SOURCE**。保留`CUSTOMER_WECHAT_SESSION_TO_FAVORITE_ACTOR_SOURCE_GAP`；Employee/SystemAdmin/4S/JYT cookie/自报Customer ID绝不变为Customer本人收藏权。审计的完整安全拒绝PASS不等于真实用户前端可收藏。
- F05/F04生产/C-H01/V1产品基线继续`NOT_READY`。普通无Lock/活动Transaction批发车具名经营Owner授权来源`GENERAL_WHOLESALE_VEHICLE_SCOPE_SOURCE_GAP_PENDING_PRODUCT_DECISION`保留待用户业务裁决，隐藏多原因`HIDE_REASON_RECALCULATION_SOURCE_GAP`、图片`IMAGE_LOCALIZATION_SOURCE_GAP`及其他真实第三方保持未闭环。

## 三、A下一正式任务放行

在已经签署的PDM-04 Final §15.2.1、PDM-20 Final §23及F05-3C原转换服务/F05-3G v19 Favorite实物基础上，先解决**另一个已有充分受信CI真实来源、但尚未完成的正向集成**：旧F05-3C转换服务原v18`verify`在v19增量表存在时拒绝调用，F05-3G只证明“先在v18完成转换，后在v19新建Favorite”。尚未直接证明“v19已存在真实Favorite Current和不可变Event→合法员工同一Vehicle/Cycle发起真实一键转名邦→转换后Favorite Current/Event全文保留”。这条既符合已签PDM又不需真微信Customer会话/真实上游/生产权限。

A正式放行`07_重建工作区/F05-3I_A主控v19收藏现时关系与批发转名邦同车同周期兼容完整施工单_2026-10-12.md`，指定B从本轮更新后的最新main新建`feat/f05-3i-favorite-conversion-v19-compat`，只在严格限定旧F05-3C服务**必要版本校验入口**的小补丁＋本批独立新目录与唯一专属Workflow内完成隔离CI v18/v19受信双版本支持，保留旧52个原生Job全文、新增2独立真PG16 source/TLS Job，共**54/54同B/PR/Actions最终SHA success＋2原生Artifacts＋中文交接**再由A独立验收。不得削弱原v18签名和Employee+Lock/Transaction当前对象Scope/权限/历史不变量，不触生产、真微信、真实JYT/资金/电话，B不得自行合并main。**`NEXT_OWNER=B`**。
