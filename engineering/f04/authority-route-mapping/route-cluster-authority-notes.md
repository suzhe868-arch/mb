# F04-2｜215项Current Authority逐簇对照与未证来源

本文件从最终矩阵实际行生成，不按旧HTTP路由名称自动授予现行权限。**原始198条不同path、218个HTTP method+path**；3条明确废弃的Collector连接GET/PATCH/TEST不计入215行。旧215项的Current Method/DTO/Token/对象权限未单独签发：全部决策为`UNDECIDED`，全部为`CONTRACT_ONLY`。

现行动作**簇级**完整三方锚点：105条；三方引用不能一致证明：110条（`SOURCE_GAP`）。即使簇级有现行PDM/IA/Low-Fi依据，也不证明历史路由应KEEP/MODIFY/REPLACE。

## DEMAND｜29条；锚点17／缺口12

- `LEGACY-012` `GET /customer/find-car/workspace`，原OpenAPI方法行816；SOURCE_GAP
- `LEGACY-013` `POST /customer/find-car/applications`，原OpenAPI方法行885；SOURCE_GAP
- `LEGACY-014` `GET /customer/find-car/applications/{id}`，原OpenAPI方法行939；SOURCE_GAP
- `LEGACY-015` `PATCH /customer/find-car/applications/{id}`，原OpenAPI方法行991；SOURCE_GAP

实际Current Authority样例：PDM `07_重建工作区/PDM-13_最终完整规则.md:305`；IA 导航 `03_证据_C_IA_V5_Current/04_LOW_FI_NAVIGATION_REGISTER.md:84`；低保真 `03_证据_C_IA_V5_Current/04_LOW_FI_PAGE_MANIFEST.md:78`。这些引用只支持对应动作簇存在，尚未证明完整现行业务HTTP语义。

本簇12项缺少同主体的三方现行证据：不得凭原OpenAPI、旧权限字符串、角色职位、客户端data scope或英文路径自行判定。具体缺口逐行见矩阵的`source_gap_reason`。

初步承接：`F06`，完整后台/客户对象、身份及敏感数据实物继续后续正式工单确认。

## STAFF_VEHICLE｜16条；锚点16／缺口0

- `LEGACY-073` `GET /staff/vehicles`，原OpenAPI方法行4985；EVIDENCE_MATCHED
- `LEGACY-074` `POST /staff/vehicles`，原OpenAPI方法行5033；EVIDENCE_MATCHED
- `LEGACY-075` `GET /staff/vehicles/{id}`，原OpenAPI方法行5095；EVIDENCE_MATCHED
- `LEGACY-076` `PATCH /staff/vehicles/{id}`，原OpenAPI方法行5147；EVIDENCE_MATCHED

实际Current Authority样例：PDM `07_重建工作区/PDM-21_最终完整规则.md:113`；IA 导航 `03_证据_C_IA_V5_Current/04_LOW_FI_NAVIGATION_REGISTER.md:88`；低保真 `03_证据_C_IA_V5_Current/04_LOW_FI_PAGE_MANIFEST.md:64`。这些引用只支持对应动作簇存在，尚未证明完整现行业务HTTP语义。

初步承接：`F05`，完整后台/客户对象、身份及敏感数据实物继续后续正式工单确认。

## STAFF_LOCK_WAITLIST｜14条；锚点0／缺口14

- `LEGACY-089` `POST /staff/locks`，原OpenAPI方法行6071；SOURCE_GAP
- `LEGACY-090` `GET /staff/locks`，原OpenAPI方法行6132；SOURCE_GAP
- `LEGACY-091` `GET /staff/locks/{id}`，原OpenAPI方法行6203；SOURCE_GAP
- `LEGACY-092` `POST /staff/locks/{id}:release`，原OpenAPI方法行6263；SOURCE_GAP

本簇14项缺少同主体的三方现行证据：不得凭原OpenAPI、旧权限字符串、角色职位、客户端data scope或英文路径自行判定。具体缺口逐行见矩阵的`source_gap_reason`。

初步承接：`F06`，完整后台/客户对象、身份及敏感数据实物继续后续正式工单确认。

## VEHICLE｜13条；锚点7／缺口6

- `LEGACY-005` `GET /customer/vehicles`，原OpenAPI方法行249；EVIDENCE_MATCHED
- `LEGACY-006` `GET /customer/vehicles/{vehicle_id}`，原OpenAPI方法行429；EVIDENCE_MATCHED
- `LEGACY-019` `POST /customer/vehicles/{vehicle_id}/consultations`，原OpenAPI方法行1254；EVIDENCE_MATCHED
- `LEGACY-020` `POST /customer/vehicles/{vehicle_id}/waitlist`，原OpenAPI方法行1320；EVIDENCE_MATCHED

实际Current Authority样例：PDM `07_重建工作区/PDM-04_最终完整规则.md:10`；IA 导航 `03_证据_C_IA_V5_Current/04_LOW_FI_NAVIGATION_REGISTER.md:50`；低保真 `03_证据_C_IA_V5_Current/04_LOW_FI_PAGE_MANIFEST.md:43`。这些引用只支持对应动作簇存在，尚未证明完整现行业务HTTP语义。

本簇6项缺少同主体的三方现行证据：不得凭原OpenAPI、旧权限字符串、角色职位、客户端data scope或英文路径自行判定。具体缺口逐行见矩阵的`source_gap_reason`。

初步承接：`F05`，完整后台/客户对象、身份及敏感数据实物继续后续正式工单确认。

## STAFF_ADMIN｜13条；锚点13／缺口0

- `LEGACY-117` `POST /admin/employees/{id}:deactivate`，原OpenAPI方法行8026；EVIDENCE_MATCHED
- `LEGACY-118` `POST /admin/employees/{id}:reactivate`，原OpenAPI方法行8099；EVIDENCE_MATCHED
- `LEGACY-119` `PUT /admin/employees/{id}/permission-overrides`，原OpenAPI方法行8166；EVIDENCE_MATCHED
- `LEGACY-120` `PUT /admin/employees/{id}/data-scope`，原OpenAPI方法行8245；EVIDENCE_MATCHED

实际Current Authority样例：PDM `07_重建工作区/PDM-22_最终完整规则.md:190`；IA 导航 `03_证据_C_IA_V5_Current/04_LOW_FI_NAVIGATION_REGISTER.md:276`；低保真 `03_证据_C_IA_V5_Current/04_LOW_FI_PAGE_MANIFEST.md:111`。这些引用只支持对应动作簇存在，尚未证明完整现行业务HTTP语义。

初步承接：`F04`，完整后台/客户对象、身份及敏感数据实物继续后续正式工单确认。

## STAFF_CRM｜12条；锚点12／缺口0

- `LEGACY-038` `GET /staff/customers`，原OpenAPI方法行2525；EVIDENCE_MATCHED
- `LEGACY-039` `GET /staff/customers/{customer_id}`，原OpenAPI方法行2608；EVIDENCE_MATCHED
- `LEGACY-040` `PATCH /staff/customers/{id}/profile`，原OpenAPI方法行2668；EVIDENCE_MATCHED
- `LEGACY-041` `POST /staff/customers/{id}/followups`，原OpenAPI方法行2747；EVIDENCE_MATCHED

实际Current Authority样例：PDM `07_重建工作区/PDM-21_最终完整规则.md:448`；IA 导航 `03_证据_C_IA_V5_Current/04_LOW_FI_NAVIGATION_REGISTER.md:94`；低保真 `03_证据_C_IA_V5_Current/04_LOW_FI_PAGE_MANIFEST.md:71`。这些引用只支持对应动作簇存在，尚未证明完整现行业务HTTP语义。

初步承接：`F04`，完整后台/客户对象、身份及敏感数据实物继续后续正式工单确认。

## TX｜12条；锚点0／缺口12

- `LEGACY-103` `GET /staff/transactions`，原OpenAPI方法行7040；SOURCE_GAP
- `LEGACY-104` `GET /staff/transactions/{id}`，原OpenAPI方法行7111；SOURCE_GAP
- `LEGACY-105` `POST /staff/transactions/{id}:complete`，原OpenAPI方法行7171；SOURCE_GAP
- `LEGACY-106` `POST /staff/transactions/{id}:cancel`，原OpenAPI方法行7244；SOURCE_GAP

本簇12项缺少同主体的三方现行证据：不得凭原OpenAPI、旧权限字符串、角色职位、客户端data scope或英文路径自行判定。具体缺口逐行见矩阵的`source_gap_reason`。

初步承接：`F06`，完整后台/客户对象、身份及敏感数据实物继续后续正式工单确认。

## MODELS｜11条；锚点0／缺口11

- `LEGACY-203` `GET /admin/vehicle-model-match-cases`，原OpenAPI方法行13380；SOURCE_GAP
- `LEGACY-204` `GET /admin/vehicle-model-match-cases/{case_id}`，原OpenAPI方法行13454；SOURCE_GAP
- `LEGACY-205` `POST /admin/vehicle-model-match-cases/{case_id}:bind-existing`，原OpenAPI方法行13505；SOURCE_GAP
- `LEGACY-206` `POST /admin/vehicle-model-match-cases/{case_id}:create-and-bind`，原OpenAPI方法行13563；SOURCE_GAP

本簇11项缺少同主体的三方现行证据：不得凭原OpenAPI、旧权限字符串、角色职位、客户端data scope或英文路径自行判定。具体缺口逐行见矩阵的`source_gap_reason`。

初步承接：`F05`，完整后台/客户对象、身份及敏感数据实物继续后续正式工单确认。

## PRICE｜9条；锚点2／缺口7

- `LEGACY-010` `POST /customer/vehicles/{vehicle_id}/price-access:unlock`，原OpenAPI方法行687；EVIDENCE_MATCHED
- `LEGACY-011` `GET /customer/me/price-quota/today`，原OpenAPI方法行747；EVIDENCE_MATCHED
- `LEGACY-132` `GET /admin/pricing/ladder-sets`，原OpenAPI方法行9085；SOURCE_GAP
- `LEGACY-133` `POST /admin/pricing/ladder-sets`，原OpenAPI方法行9155；SOURCE_GAP

实际Current Authority样例：PDM `07_重建工作区/PDM-10_最终完整规则.md:180`；IA 导航 `03_证据_C_IA_V5_Current/04_LOW_FI_NAVIGATION_REGISTER.md:71`；低保真 `03_证据_C_IA_V5_Current/04_LOW_FI_PAGE_MANIFEST.md:43`。这些引用只支持对应动作簇存在，尚未证明完整现行业务HTTP语义。

本簇7项缺少同主体的三方现行证据：不得凭原OpenAPI、旧权限字符串、角色职位、客户端data scope或英文路径自行判定。具体缺口逐行见矩阵的`source_gap_reason`。

初步承接：`F05`，完整后台/客户对象、身份及敏感数据实物继续后续正式工单确认。

## UNCLASSIFIED｜9条；锚点0／缺口9

- `LEGACY-032` `GET /staff/me`，原OpenAPI方法行2127；SOURCE_GAP
- `LEGACY-033` `GET /staff/workbench`，原OpenAPI方法行2175；SOURCE_GAP
- `LEGACY-034` `GET /staff/workbench/todos`，原OpenAPI方法行2248；SOURCE_GAP
- `LEGACY-036` `GET /staff/radar`，原OpenAPI方法行2394；SOURCE_GAP

本簇9项缺少同主体的三方现行证据：不得凭原OpenAPI、旧权限字符串、角色职位、客户端data scope或英文路径自行判定。具体缺口逐行见矩阵的`source_gap_reason`。

初步承接：`F04`，完整后台/客户对象、身份及敏感数据实物继续后续正式工单确认。

## NOTIFICATION｜9条；锚点9／缺口0

- `LEGACY-136` `GET /admin/notification-deliveries`，原OpenAPI方法行9363；EVIDENCE_MATCHED
- `LEGACY-137` `GET /admin/feishu-bindings`，原OpenAPI方法行9434；EVIDENCE_MATCHED
- `LEGACY-158` `GET /admin/notification-config/sla`，原OpenAPI方法行10861；EVIDENCE_MATCHED
- `LEGACY-159` `PUT /admin/notification-config/sla`，原OpenAPI方法行10929；EVIDENCE_MATCHED

实际Current Authority样例：PDM `07_重建工作区/PDM-23_最终完整规则.md:201`；IA 导航 `03_证据_C_IA_V5_Current/04_LOW_FI_NAVIGATION_REGISTER.md:289`；低保真 `03_证据_C_IA_V5_Current/04_LOW_FI_PAGE_MANIFEST.md:144`。这些引用只支持对应动作簇存在，尚未证明完整现行业务HTTP语义。

初步承接：`F04`，完整后台/客户对象、身份及敏感数据实物继续后续正式工单确认。

## ANNOUNCEMENT｜8条；锚点8／缺口0

- `LEGACY-026` `GET /customer/announcements/current`，原OpenAPI方法行1730；EVIDENCE_MATCHED
- `LEGACY-027` `POST /customer/announcements/{id}:shown`，原OpenAPI方法行1801；EVIDENCE_MATCHED
- `LEGACY-028` `GET /customer/announcements`，原OpenAPI方法行1861；EVIDENCE_MATCHED
- `LEGACY-138` `POST /admin/announcements/{id}:enable`，原OpenAPI方法行9505；EVIDENCE_MATCHED

实际Current Authority样例：PDM `07_重建工作区/PDM-24_最终完整规则.md:21`；IA 导航 `03_证据_C_IA_V5_Current/04_LOW_FI_NAVIGATION_REGISTER.md:55`；低保真 `03_证据_C_IA_V5_Current/04_LOW_FI_PAGE_MANIFEST.md:42`。这些引用只支持对应动作簇存在，尚未证明完整现行业务HTTP语义。

初步承接：`F04`，完整后台/客户对象、身份及敏感数据实物继续后续正式工单确认。

## BANNER｜7条；锚点7／缺口0

- `LEGACY-031` `GET /customer/banners`，原OpenAPI方法行2046；EVIDENCE_MATCHED
- `LEGACY-141` `GET /admin/banners`，原OpenAPI方法行9710；EVIDENCE_MATCHED
- `LEGACY-142` `POST /admin/banners`，原OpenAPI方法行9780；EVIDENCE_MATCHED
- `LEGACY-143` `PATCH /admin/banners/{id}`，原OpenAPI方法行9842；EVIDENCE_MATCHED

实际Current Authority样例：PDM `07_重建工作区/PDM-24_最终完整规则.md:82`；IA 导航 `03_证据_C_IA_V5_Current/04_LOW_FI_NAVIGATION_REGISTER.md:216`；低保真 `03_证据_C_IA_V5_Current/04_LOW_FI_PAGE_MANIFEST.md:42`。这些引用只支持对应动作簇存在，尚未证明完整现行业务HTTP语义。

初步承接：`F04`，完整后台/客户对象、身份及敏感数据实物继续后续正式工单确认。

## CRM｜7条；锚点0／缺口7

- `LEGACY-035` `GET /staff/workbench/opportunities`，原OpenAPI方法行2323；SOURCE_GAP
- `LEGACY-116` `POST /admin/customers/{id}:reassign-owner`，原OpenAPI方法行7953；SOURCE_GAP
- `LEGACY-124` `POST /admin/handover-batches/{id}:assign-customers`，原OpenAPI方法行8525；SOURCE_GAP
- `LEGACY-126` `PUT /system-admin/customers/{id}/priority`，原OpenAPI方法行8660；SOURCE_GAP

本簇7项缺少同主体的三方现行证据：不得凭原OpenAPI、旧权限字符串、角色职位、客户端data scope或英文路径自行判定。具体缺口逐行见矩阵的`source_gap_reason`。

初步承接：`F04`，完整后台/客户对象、身份及敏感数据实物继续后续正式工单确认。

## ORG｜7条；锚点0／缺口7

- `LEGACY-122` `POST /admin/handover-batches`，原OpenAPI方法行8403；SOURCE_GAP
- `LEGACY-123` `GET /admin/handover-batches/{id}`，原OpenAPI方法行8465；SOURCE_GAP
- `LEGACY-127` `GET /system-admin/admins`，原OpenAPI方法行8728；SOURCE_GAP
- `LEGACY-128` `POST /system-admin/admins`，原OpenAPI方法行8798；SOURCE_GAP

本簇7项缺少同主体的三方现行证据：不得凭原OpenAPI、旧权限字符串、角色职位、客户端data scope或英文路径自行判定。具体缺口逐行见矩阵的`source_gap_reason`。

初步承接：`F04`，完整后台/客户对象、身份及敏感数据实物继续后续正式工单确认。

## PC_AUTH｜6条；锚点0／缺口6

- `LEGACY-167` `POST /auth/staff/session:exchange`，原OpenAPI方法行11480；SOURCE_GAP
- `LEGACY-168` `GET /auth/staff/context`，原OpenAPI方法行11541；SOURCE_GAP
- `LEGACY-169` `POST /auth/staff/session:revoke`，原OpenAPI方法行11610；SOURCE_GAP
- `LEGACY-170` `POST /auth/system-admin/session:exchange`，原OpenAPI方法行11666；SOURCE_GAP

本簇6项缺少同主体的三方现行证据：不得凭原OpenAPI、旧权限字符串、角色职位、客户端data scope或英文路径自行判定。具体缺口逐行见矩阵的`source_gap_reason`。

初步承接：`F04`，完整后台/客户对象、身份及敏感数据实物继续后续正式工单确认。

## CUSTOMER_ID｜4条；锚点4／缺口0

- `LEGACY-001` `POST /customer/session/wechat`，原OpenAPI方法行12；EVIDENCE_MATCHED
- `LEGACY-002` `GET /customer/me`，原OpenAPI方法行65；EVIDENCE_MATCHED
- `LEGACY-003` `PATCH /customer/me/profile`，原OpenAPI方法行134；EVIDENCE_MATCHED
- `LEGACY-004` `POST /customer/me/phone:authorize`，原OpenAPI方法行195；EVIDENCE_MATCHED

实际Current Authority样例：PDM `07_重建工作区/PDM-01_最终完整规则.md:19`；IA 导航 `03_证据_C_IA_V5_Current/04_LOW_FI_NAVIGATION_REGISTER.md:53`；低保真 `03_证据_C_IA_V5_Current/04_LOW_FI_PAGE_MANIFEST.md:47`。这些引用只支持对应动作簇存在，尚未证明完整现行业务HTTP语义。

初步承接：`F04`，完整后台/客户对象、身份及敏感数据实物继续后续正式工单确认。

## LOCK｜4条；锚点2／缺口2

- `LEGACY-022` `GET /customer/me/locks`，原OpenAPI方法行1457；EVIDENCE_MATCHED
- `LEGACY-023` `GET /customer/me/waitlists`，原OpenAPI方法行1528；EVIDENCE_MATCHED
- `LEGACY-187` `GET /admin/locks`，原OpenAPI方法行12576；SOURCE_GAP
- `LEGACY-188` `GET /admin/waitlists`，原OpenAPI方法行12626；SOURCE_GAP

实际Current Authority样例：PDM `07_重建工作区/PDM-18_最终完整规则.md:62`；IA 导航 `03_证据_C_IA_V5_Current/04_LOW_FI_NAVIGATION_REGISTER.md:75`；低保真 `03_证据_C_IA_V5_Current/04_LOW_FI_PAGE_MANIFEST.md:51`。这些引用只支持对应动作簇存在，尚未证明完整现行业务HTTP语义。

本簇2项缺少同主体的三方现行证据：不得凭原OpenAPI、旧权限字符串、角色职位、客户端data scope或英文路径自行判定。具体缺口逐行见矩阵的`source_gap_reason`。

初步承接：`F06`，完整后台/客户对象、身份及敏感数据实物继续后续正式工单确认。

## PUBLIC_POOL｜4条；锚点1／缺口3

- `LEGACY-112` `GET /staff/public-pool`，原OpenAPI方法行7671；SOURCE_GAP
- `LEGACY-113` `GET /staff/public-pool/candidates`，原OpenAPI方法行7742；SOURCE_GAP
- `LEGACY-114` `POST /staff/public-pool/customers/{customer_id}:claim`，原OpenAPI方法行7813；SOURCE_GAP
- `LEGACY-115` `POST /admin/public-pool/customers/{id}:put`，原OpenAPI方法行7880；EVIDENCE_MATCHED

实际Current Authority样例：PDM `07_重建工作区/PDM-17_最终完整规则.md:172`；IA 导航 `03_证据_C_IA_V5_Current/04_LOW_FI_NAVIGATION_REGISTER.md:165`；低保真 `03_证据_C_IA_V5_Current/04_LOW_FI_PAGE_MANIFEST.md:125`。这些引用只支持对应动作簇存在，尚未证明完整现行业务HTTP语义。

本簇3项缺少同主体的三方现行证据：不得凭原OpenAPI、旧权限字符串、角色职位、客户端data scope或英文路径自行判定。具体缺口逐行见矩阵的`source_gap_reason`。

初步承接：`F04`，完整后台/客户对象、身份及敏感数据实物继续后续正式工单确认。

## JYT_SYSTEM_EVENT｜4条；锚点0／缺口4

- `LEGACY-147` `POST /integrations/jyt/vehicle-prices`，原OpenAPI方法行10117；SOURCE_GAP
- `LEGACY-148` `POST /integrations/jyt/vehicles:upsert`，原OpenAPI方法行10155；SOURCE_GAP
- `LEGACY-149` `POST /integrations/jyt/vehicles:offline-batch`，原OpenAPI方法行10217；SOURCE_GAP
- `LEGACY-150` `GET /integrations/jyt/vehicles:active`，原OpenAPI方法行10279；SOURCE_GAP

本簇4项缺少同主体的三方现行证据：不得凭原OpenAPI、旧权限字符串、角色职位、客户端data scope或英文路径自行判定。具体缺口逐行见矩阵的`source_gap_reason`。

初步承接：`F07`，完整后台/客户对象、身份及敏感数据实物继续后续正式工单确认。

## JYT｜4条；锚点0／缺口4

- `LEGACY-177` `GET /admin/jyt/status`，原OpenAPI方法行12068；SOURCE_GAP
- `LEGACY-178` `GET /admin/integrations/collector/publisher-phone-cache`，原OpenAPI方法行12116；SOURCE_GAP
- `LEGACY-179` `GET /admin/jyt/incidents`，原OpenAPI方法行12166；SOURCE_GAP
- `LEGACY-180` `GET /admin/jyt/logs`，原OpenAPI方法行12216；SOURCE_GAP

本簇4项缺少同主体的三方现行证据：不得凭原OpenAPI、旧权限字符串、角色职位、客户端data scope或英文路径自行判定。具体缺口逐行见矩阵的`source_gap_reason`。

初步承接：`F07`，完整后台/客户对象、身份及敏感数据实物继续后续正式工单确认。

## CLIENT_FAVORITES｜3条；锚点3／缺口0

- `LEGACY-007` `PUT /customer/me/favorites/{vehicle_id}`，原OpenAPI方法行492；EVIDENCE_MATCHED
- `LEGACY-008` `DELETE /customer/me/favorites/{vehicle_id}`，原OpenAPI方法行550；EVIDENCE_MATCHED
- `LEGACY-009` `GET /customer/me/favorites`，原OpenAPI方法行616；EVIDENCE_MATCHED

实际Current Authority样例：PDM `07_重建工作区/PDM-20_最终完整规则.md:298`；IA 导航 `03_证据_C_IA_V5_Current/04_LOW_FI_NAVIGATION_REGISTER.md:70`；低保真 `03_证据_C_IA_V5_Current/04_LOW_FI_PAGE_MANIFEST.md:43`。这些引用只支持对应动作簇存在，尚未证明完整现行业务HTTP语义。

初步承接：`F05`，完整后台/客户对象、身份及敏感数据实物继续后续正式工单确认。

## CLIENT_RECOMMENDATION_HISTORY｜2条；锚点0／缺口2

- `LEGACY-017` `GET /customer/me/recommendations`，原OpenAPI方法行1123；SOURCE_GAP
- `LEGACY-018` `GET /customer/me/recommendations/{id}`，原OpenAPI方法行1194；SOURCE_GAP

本簇2项缺少同主体的三方现行证据：不得凭原OpenAPI、旧权限字符串、角色职位、客户端data scope或英文路径自行判定。具体缺口逐行见矩阵的`source_gap_reason`。

初步承接：`F06`，完整后台/客户对象、身份及敏感数据实物继续后续正式工单确认。

## CLIENT_TRANSACTION_HISTORY｜2条；锚点0／缺口2

- `LEGACY-024` `GET /customer/me/transactions`，原OpenAPI方法行1599；SOURCE_GAP
- `LEGACY-025` `GET /customer/me/transactions/{id}`，原OpenAPI方法行1670；SOURCE_GAP

本簇2项缺少同主体的三方现行证据：不得凭原OpenAPI、旧权限字符串、角色职位、客户端data scope或英文路径自行判定。具体缺口逐行见矩阵的`source_gap_reason`。

初步承接：`F06`，完整后台/客户对象、身份及敏感数据实物继续后续正式工单确认。

## SHARE｜2条；锚点2／缺口0

- `LEGACY-029` `POST /customer/vehicles/{id}/share-context`，原OpenAPI方法行1932；EVIDENCE_MATCHED
- `LEGACY-030` `POST /customer/share-entry:resolve`，原OpenAPI方法行1992；EVIDENCE_MATCHED

实际Current Authority样例：PDM `07_重建工作区/PDM-03_最终完整规则.md:63`；IA 导航 `03_证据_C_IA_V5_Current/04_LOW_FI_NAVIGATION_REGISTER.md:59`；低保真 `03_证据_C_IA_V5_Current/04_LOW_FI_PAGE_MANIFEST.md:42`。这些引用只支持对应动作簇存在，尚未证明完整现行业务HTTP语义。

初步承接：`F04`，完整后台/客户对象、身份及敏感数据实物继续后续正式工单确认。

## OTHER_ADMIN｜2条；锚点0／缺口2

- `LEGACY-140` `GET /admin/audit-logs`，原OpenAPI方法行9639；SOURCE_GAP
- `LEGACY-173` `GET /admin/dashboard`，原OpenAPI方法行11852；SOURCE_GAP

本簇2项缺少同主体的三方现行证据：不得凭原OpenAPI、旧权限字符串、角色职位、客户端data scope或英文路径自行判定。具体缺口逐行见矩阵的`source_gap_reason`。

初步承接：`F04`，完整后台/客户对象、身份及敏感数据实物继续后续正式工单确认。

## CLIENT_CONSULTATION_HISTORY｜1条；锚点1／缺口0

- `LEGACY-021` `GET /customer/me/consultations`，原OpenAPI方法行1386；EVIDENCE_MATCHED

实际Current Authority样例：PDM `07_重建工作区/PDM-15_最终完整规则.md:51`；IA 导航 `03_证据_C_IA_V5_Current/04_LOW_FI_NAVIGATION_REGISTER.md:82`；低保真 `03_证据_C_IA_V5_Current/04_LOW_FI_PAGE_MANIFEST.md:50`。这些引用只支持对应动作簇存在，尚未证明完整现行业务HTTP语义。

初步承接：`F04`，完整后台/客户对象、身份及敏感数据实物继续后续正式工单确认。

## STAFF_PUBLISHER_PHONE｜1条；锚点1／缺口0

- `LEGACY-087` `POST /staff/vehicles/{id}/upstream-phone:refresh`，原OpenAPI方法行5936；EVIDENCE_MATCHED

实际Current Authority样例：PDM `07_重建工作区/PDM-09_最终完整规则.md:43`；IA 导航 `03_证据_C_IA_V5_Current/04_LOW_FI_NAVIGATION_REGISTER.md:179`；低保真 `03_证据_C_IA_V5_Current/04_LOW_FI_PAGE_MANIFEST.md:65`。这些引用只支持对应动作簇存在，尚未证明完整现行业务HTTP语义。

初步承接：`F07`，完整后台/客户对象、身份及敏感数据实物继续后续正式工单确认。

## 关键跨域现行Final引用与风险

1. **C端身份、手机号与分享Owner**：`PDM-01_最终完整规则.md` §2～4，`PDM-03_最终完整规则.md` §5/§12；分享不抢已有Owner、转介绍历史与当前归属分离；不接真实微信。
2. **LIMITED/UNLIMITED、普通/粉丝/VIP查价**：`PDM-10_最终完整规则.md` §7～§11，F05未来可信账本/当前Customer Level，不因旧`price-access:unlock`自动实施第二点击。
3. **4S/System Admin权限**：`PDM-02_最终完整规则.md` §3/§6/§12，4S一账号代表一家商户，不设独立4S组织/APP；System Admin仅控制平面，4S员工不互管；M94缺4S合作主体当前关联则拒绝真正账号治理。
4. **CRM/公海**：`PDM-16_最终完整规则.md` §9、`PDM-17_最终完整规则.md` §8～§15，当前Owner+独立permission+目标Customer object scope，而非历史操作记忆。
5. **LockRequest/Waitlist**：`PDM-18_最终完整规则.md` §2～§11，6小时、竞争自动候补，旧`staff/locks`写权限不是实物已完成。
6. **Transaction/Refund**：`PDM-19_最终完整规则.md` §6～§22，交易必须合法Lock来源；pending退款关闭并说明原因，禁造新审批权限。
7. **Publisher/JYT/图片/CDN**：`PDM-09_最终完整规则.md` §3/§15，publisher_id安全链和源事实需F07；禁恢复Collector连接配置、旧car_code取号与独立`can_call_wholesale_phone`。
8. **三类车源、转名邦**：`PDM-04_最终完整规则.md` §9～§14，同Vehicle ID/Lifecycle；Vehicle当前Team/4S归属需F05/F07先实现物理权威，否则员工导出及内部价硬拒。
9. **公告与Banner**：`PDM-24_最终完整规则.md` §2/§6～§10，C端和P端现行页面相关，但旧消息中心及历史路径不自动复活。

**产品状态：NOT_READY；本批不实现215个正式API，只完成有据可查的动作/风险分簇与CI只读资格预检。**
