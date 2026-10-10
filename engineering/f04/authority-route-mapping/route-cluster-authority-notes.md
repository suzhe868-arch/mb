# F04-2｜215历史候选分簇的当前Authority与证据缺口

**范围**：主线已验收旧198 path/218 method；3个Collector连接类RETIRE/FORBIDDEN完全不纳入本工作215行。以下按现行PDM Final、IA当前导航动作和低保真页面**真实文件行**验证“业务簇存在”，绝不代表旧method/path已可用、旧DTO/permission复用已批准。每条旧候选的逐行证明在`current-authority-route-matrix.tsv`中。

**审查状态（只读汇总）**：`EVIDENCE_MATCHED`=相关现行动作族同时找到真实PDM/导航/页面锚点；`SOURCE_GAP`=三方证明不全；所有215条`decision=UNDECIDED`、`current_stage=CONTRACT_ONLY`，因此**0条历史HTTP因本工作自动开放**。

## VEHICLE｜30个旧接口，30个现行动作簇引用齐备，0个缺口

旧路径样本：
- `LEGACY-005` `GET /customer/vehicles`（历史源方法行 249）
- `LEGACY-006` `GET /customer/vehicles/{vehicle_id}`（历史源方法行 429）
- `LEGACY-019` `POST /customer/vehicles/{vehicle_id}/consultations`（历史源方法行 1254）
- `LEGACY-020` `POST /customer/vehicles/{vehicle_id}/waitlist`（历史源方法行 1320）

现行真实锚点：`07_重建工作区/PDM-04_最终完整规则.md:10`（## 1. PDM-04 范围与三类车源）；`03_证据_C_IA_V5_Current/04_LOW_FI_NAVIGATION_REGISTER.md:50`（| C01 | 打开车辆 | C01-01 | vehicle visible in feed |）；`03_证据_C_IA_V5_Current/04_LOW_FI_PAGE_MANIFEST.md:43`（| C01-01 | 客户车辆详情 | NORMAL, LOADING, ERROR, LOCK_REQUEST_PENDING, LOCKED_BY_SELF, LOCKED_BY_OTHER, WAITLI）。

下游技术责任：`F05`（初步业务包承接，不是A验收旧接口的动作）。权限、对象归属、敏感字段、状态CAS及原业务DTO仍须后续按独立Final/IA核对；**只读CI不得开当前业务写入**。

## DEMAND｜29个旧接口，29个现行动作簇引用齐备，0个缺口

旧路径样本：
- `LEGACY-012` `GET /customer/find-car/workspace`（历史源方法行 816）
- `LEGACY-013` `POST /customer/find-car/applications`（历史源方法行 885）
- `LEGACY-014` `GET /customer/find-car/applications/{id}`（历史源方法行 939）
- `LEGACY-015` `PATCH /customer/find-car/applications/{id}`（历史源方法行 991）

现行真实锚点：`07_重建工作区/PDM-13_最终完整规则.md:305`（## 16. Priority 与 Recommendation 是独立对象）；`03_证据_C_IA_V5_Current/04_LOW_FI_NAVIGATION_REGISTER.md:84`（| E01-04 | 推荐给客户 | E03-05 | REF_GUARD[RECOMMENDATION]；local_ui_fact=actor is current legal business respo）；`03_证据_C_IA_V5_Current/04_LOW_FI_PAGE_MANIFEST.md:78`（| E05 | 找车服务【业务模块】 | NORMAL | 1 |）。

下游技术责任：`F06`（初步业务包承接，不是A验收旧接口的动作）。权限、对象归属、敏感字段、状态CAS及原业务DTO仍须后续按独立Final/IA核对；**只读CI不得开当前业务写入**。

## OTHER_ADMIN｜24个旧接口，0个现行动作簇引用齐备，24个缺口

旧路径样本：
- `LEGACY-026` `GET /customer/announcements/current`（历史源方法行 1730）
- `LEGACY-027` `POST /customer/announcements/{id}:shown`（历史源方法行 1801）
- `LEGACY-028` `GET /customer/announcements`（历史源方法行 1861）
- `LEGACY-031` `GET /customer/banners`（历史源方法行 2046）

本簇尚无**同时**可定位的Current Final章节、现行导航动作及页面Manifest；`SOURCE_GAP`，不得以旧API/通用权限或页面前缀补证。

下游技术责任：`F04`（初步业务包承接，不是A验收旧接口的动作）。权限、对象归属、敏感字段、状态CAS及原业务DTO仍须后续按独立Final/IA核对；**只读CI不得开当前业务写入**。

## ORG｜23个旧接口，23个现行动作簇引用齐备，0个缺口

旧路径样本：
- `LEGACY-117` `POST /admin/employees/{id}:deactivate`（历史源方法行 8026）
- `LEGACY-118` `POST /admin/employees/{id}:reactivate`（历史源方法行 8099）
- `LEGACY-119` `PUT /admin/employees/{id}/permission-overrides`（历史源方法行 8166）
- `LEGACY-120` `PUT /admin/employees/{id}/data-scope`（历史源方法行 8245）

现行真实锚点：`07_重建工作区/PDM-02_最终完整规则.md:39`（## 4. 统一权限模型）；`03_证据_C_IA_V5_Current/04_LOW_FI_NAVIGATION_REGISTER.md:60`（| E02-01 | 员工分享车源给客户 | C01-M03 | active eligible Mingbang employee with vehicle in scope creates a D1 sha）；`03_证据_C_IA_V5_Current/04_LOW_FI_PAGE_MANIFEST.md:109`（| P04 | 员工 / 组织 / 权限 | NORMAL | 1 |）。

下游技术责任：`F04`（初步业务包承接，不是A验收旧接口的动作）。权限、对象归属、敏感字段、状态CAS及原业务DTO仍须后续按独立Final/IA核对；**只读CI不得开当前业务写入**。

## LOCK｜20个旧接口，20个现行动作簇引用齐备，0个缺口

旧路径样本：
- `LEGACY-022` `GET /customer/me/locks`（历史源方法行 1457）
- `LEGACY-023` `GET /customer/me/waitlists`（历史源方法行 1528）
- `LEGACY-089` `POST /staff/locks`（历史源方法行 6071）
- `LEGACY-090` `GET /staff/locks`（历史源方法行 6132）

现行真实锚点：`07_重建工作区/PDM-18_最终完整规则.md:62`（## 4. LockRequest 6 小时与结果合同）；`03_证据_C_IA_V5_Current/04_LOW_FI_NAVIGATION_REGISTER.md:75`（| C01-01 | 锁车 | C01-M04 | no active Lock; no own PENDING LockRequest; Vehicle/listing_cycle currently req）；`03_证据_C_IA_V5_Current/04_LOW_FI_PAGE_MANIFEST.md:51`（| C03-04 | 我的锁车 / 候补 | NORMAL, EMPTY, LOCKED, WAITLISTED, RELEASED, NOT_LOCKABLE, EXPIRED, HISTORICAL | 6）。

下游技术责任：`F06`（初步业务包承接，不是A验收旧接口的动作）。权限、对象归属、敏感字段、状态CAS及原业务DTO仍须后续按独立Final/IA核对；**只读CI不得开当前业务写入**。

## CRM｜20个旧接口，20个现行动作簇引用齐备，0个缺口

旧路径样本：
- `LEGACY-035` `GET /staff/workbench/opportunities`（历史源方法行 2323）
- `LEGACY-038` `GET /staff/customers`（历史源方法行 2525）
- `LEGACY-039` `GET /staff/customers/{customer_id}`（历史源方法行 2608）
- `LEGACY-040` `PATCH /staff/customers/{id}/profile`（历史源方法行 2668）

现行真实锚点：`07_重建工作区/PDM-16_最终完整规则.md:141`（## 7. CRM Customer List）；`03_证据_C_IA_V5_Current/04_LOW_FI_NAVIGATION_REGISTER.md:55`（| C01 / C01-01 | 命中有效客户公告 | C-O03 | Customer 当天第一次进入/打开小程序；候选必须 enabled + 当前有效周期 + auto-popup ON；同一 Custo）；`03_证据_C_IA_V5_Current/04_LOW_FI_PAGE_MANIFEST.md:70`（| E03 | 客户【一级 Tab】 | NORMAL, LOADING, EMPTY, ERROR, PERMISSION_DENIED | 5 |）。

下游技术责任：`F04`（初步业务包承接，不是A验收旧接口的动作）。权限、对象归属、敏感字段、状态CAS及原业务DTO仍须后续按独立Final/IA核对；**只读CI不得开当前业务写入**。

## UNCLASSIFIED｜14个旧接口，0个现行动作簇引用齐备，14个缺口

旧路径样本：
- `LEGACY-032` `GET /staff/me`（历史源方法行 2127）
- `LEGACY-033` `GET /staff/workbench`（历史源方法行 2175）
- `LEGACY-034` `GET /staff/workbench/todos`（历史源方法行 2248）
- `LEGACY-036` `GET /staff/radar`（历史源方法行 2394）

本簇尚无**同时**可定位的Current Final章节、现行导航动作及页面Manifest；`SOURCE_GAP`，不得以旧API/通用权限或页面前缀补证。

下游技术责任：`F04`（初步业务包承接，不是A验收旧接口的动作）。权限、对象归属、敏感字段、状态CAS及原业务DTO仍须后续按独立Final/IA核对；**只读CI不得开当前业务写入**。

## CUSTOMER_ID｜12个旧接口，12个现行动作簇引用齐备，0个缺口

旧路径样本：
- `LEGACY-001` `POST /customer/session/wechat`（历史源方法行 12）
- `LEGACY-002` `GET /customer/me`（历史源方法行 65）
- `LEGACY-003` `PATCH /customer/me/profile`（历史源方法行 134）
- `LEGACY-004` `POST /customer/me/phone:authorize`（历史源方法行 195）

现行真实锚点：`07_重建工作区/PDM-01_最终完整规则.md:19`（## 2. 首次进入与 owner）；`03_证据_C_IA_V5_Current/04_LOW_FI_NAVIGATION_REGISTER.md:53`（| C02 / C03-03 | 需要手机号的提交动作 | C-O02 | phone authorization is required and not yet granted; do not create ）；`03_证据_C_IA_V5_Current/04_LOW_FI_PAGE_MANIFEST.md:47`（| C03 | 我的【一级 Tab】 | NORMAL, EMPTY | 2 |）。

下游技术责任：`F04`（初步业务包承接，不是A验收旧接口的动作）。权限、对象归属、敏感字段、状态CAS及原业务DTO仍须后续按独立Final/IA核对；**只读CI不得开当前业务写入**。

## TX｜12个旧接口，12个现行动作簇引用齐备，0个缺口

旧路径样本：
- `LEGACY-103` `GET /staff/transactions`（历史源方法行 7040）
- `LEGACY-104` `GET /staff/transactions/{id}`（历史源方法行 7111）
- `LEGACY-105` `POST /staff/transactions/{id}:complete`（历史源方法行 7171）
- `LEGACY-106` `POST /staff/transactions/{id}:cancel`（历史源方法行 7244）

现行真实锚点：`07_重建工作区/PDM-19_最终完整规则.md:275`（## 19. Refund 主状态）；`03_证据_C_IA_V5_Current/04_LOW_FI_NAVIGATION_REGISTER.md:75`（| C01-01 | 锁车 | C01-M04 | no active Lock; no own PENDING LockRequest; Vehicle/listing_cycle currently req）；`03_证据_C_IA_V5_Current/04_LOW_FI_PAGE_MANIFEST.md:88`（| E07 | 锁车 / 交易【业务模块】 | NORMAL, EMPTY | 2 |）。

下游技术责任：`F06`（初步业务包承接，不是A验收旧接口的动作）。权限、对象归属、敏感字段、状态CAS及原业务DTO仍须后续按独立Final/IA核对；**只读CI不得开当前业务写入**。

## MODELS｜11个旧接口，11个现行动作簇引用齐备，0个缺口

旧路径样本：
- `LEGACY-203` `GET /admin/vehicle-model-match-cases`（历史源方法行 13380）
- `LEGACY-204` `GET /admin/vehicle-model-match-cases/{case_id}`（历史源方法行 13454）
- `LEGACY-205` `POST /admin/vehicle-model-match-cases/{case_id}:bind-existing`（历史源方法行 13505）
- `LEGACY-206` `POST /admin/vehicle-model-match-cases/{case_id}:create-and-bind`（历史源方法行 13563）

现行真实锚点：`07_重建工作区/PDM-05_最终完整规则.md:162`（## 9. 车型管理权限与执行主体）；`03_证据_C_IA_V5_Current/04_LOW_FI_NAVIGATION_REGISTER.md:175`（| E02-02 | MODEL_MISSING 交由车型映射 | P02-08 | REF_GUARD[MAPPING_CORRECTION]；local_ui_fact=save originating m）；`03_证据_C_IA_V5_Current/04_LOW_FI_PAGE_MANIFEST.md:117`（| P05 | System Admin | NORMAL | 1 |）。

下游技术责任：`F05`（初步业务包承接，不是A验收旧接口的动作）。权限、对象归属、敏感字段、状态CAS及原业务DTO仍须后续按独立Final/IA核对；**只读CI不得开当前业务写入**。

## PRICE｜10个旧接口，10个现行动作簇引用齐备，0个缺口

旧路径样本：
- `LEGACY-010` `POST /customer/vehicles/{vehicle_id}/price-access:unlock`（历史源方法行 687）
- `LEGACY-011` `GET /customer/me/price-quota/today`（历史源方法行 747）
- `LEGACY-043` `POST /staff/customers/{id}/price-quota:add`（历史源方法行 2893）
- `LEGACY-132` `GET /admin/pricing/ladder-sets`（历史源方法行 9085）

现行真实锚点：`07_重建工作区/PDM-10_最终完整规则.md:180`（## 7. 客户等级与批发查价权益）；`03_证据_C_IA_V5_Current/04_LOW_FI_NAVIGATION_REGISTER.md:71`（| C01-01 | 查看价格 | C01-M01 / C01-01 | current listing cycle; existing successful unlock does not debit aga）；`03_证据_C_IA_V5_Current/04_LOW_FI_PAGE_MANIFEST.md:43`（| C01-01 | 客户车辆详情 | NORMAL, LOADING, ERROR, LOCK_REQUEST_PENDING, LOCKED_BY_SELF, LOCKED_BY_OTHER, WAITLI）。

下游技术责任：`F05`（初步业务包承接，不是A验收旧接口的动作）。权限、对象归属、敏感字段、状态CAS及原业务DTO仍须后续按独立Final/IA核对；**只读CI不得开当前业务写入**。

## JYT｜8个旧接口，8个现行动作簇引用齐备，0个缺口

旧路径样本：
- `LEGACY-147` `POST /integrations/jyt/vehicle-prices`（历史源方法行 10117）
- `LEGACY-148` `POST /integrations/jyt/vehicles:upsert`（历史源方法行 10155）
- `LEGACY-149` `POST /integrations/jyt/vehicles:offline-batch`（历史源方法行 10217）
- `LEGACY-150` `GET /integrations/jyt/vehicles:active`（历史源方法行 10279）

现行真实锚点：`07_重建工作区/PDM-09_最终完整规则.md:43`（## 3. 当前正式取号与回传架构）；`03_证据_C_IA_V5_Current/04_LOW_FI_NAVIGATION_REGISTER.md:179`（| E02-M01 | 最新电话 | E02-M01 / E02-01 / P03-02 | REF_GUARD[PHONE_REFRESH]；local_ui_fact=active employee wit）；`03_证据_C_IA_V5_Current/04_LOW_FI_PAGE_MANIFEST.md:106`（| P03 | 金鱼塘同步 / API 管理 | NORMAL | 1 |）。

下游技术责任：`F07`（初步业务包承接，不是A验收旧接口的动作）。权限、对象归属、敏感字段、状态CAS及原业务DTO仍须后续按独立Final/IA核对；**只读CI不得开当前业务写入**。

## SHARE｜2个旧接口，2个现行动作簇引用齐备，0个缺口

旧路径样本：
- `LEGACY-029` `POST /customer/vehicles/{id}/share-context`（历史源方法行 1932）
- `LEGACY-030` `POST /customer/share-entry:resolve`（历史源方法行 1992）

现行真实锚点：`07_重建工作区/PDM-03_最终完整规则.md:63`（## 5. 客户分享车源 = 转介绍 / 获客归属链）；`03_证据_C_IA_V5_Current/04_LOW_FI_NAVIGATION_REGISTER.md:59`（| C01 | 客户转发车源 | C01-M03 | vehicle safe projection exists; record share attribution; ownerless new Custom）；`03_证据_C_IA_V5_Current/04_LOW_FI_PAGE_MANIFEST.md:42`（| C01 | 车源【一级 Tab】 | NORMAL, LOADING, EMPTY, ERROR | 4 |）。

下游技术责任：`F04`（初步业务包承接，不是A验收旧接口的动作）。权限、对象归属、敏感字段、状态CAS及原业务DTO仍须后续按独立Final/IA核对；**只读CI不得开当前业务写入**。

## 高优先跨域人工审查事项

1. **C端身份**：旧`/customer/session/wechat`仅说明上游路径；客户微信身份、首次owner与手机号门槛以PDM-01、PDM-03、Current IA为准，真实WeChat provider尚未接入。
2. **LIMITED/UNLIMITED查价**：普通/粉丝/VIP每日额度、自动解锁、销售加次由PDM-10＋F05原子账本供权威，不能重开旧`price-access:unlock`独立点击动作。
3. **CRM与owner/转介绍**：PDM-03、PDM-16要求当前owner+对象范围+历史不变；旧CRM员工看过客户、曾是推荐人或有任意Team绑定不能延续权限。
4. **System Admin和4S**：PDM-02§3/§6/§12的System Admin控制面与Employee角色严格隔离，一个4S账号代表一个商户；本批仅证明管理员身份、目标商户归属缺证硬拒，禁止4S互管或生产CRUD。
5. **LockRequest**：PDM-18要求6小时与竞争自动候补，不可用旧`staff/locks`的method名代替真正LockRequest状态机。
6. **Transaction/Refund**：PDM-19规定Lock合法来源和退款`pending→closed`无需独立审批权限；历史Refund支付接口不是F06正式资金确认。
7. **Collector/publisher_id**：PDM-09按`upstream_publisher_id/publisher_id`取号，禁旧car_code复活；三条Collector连接管理GET/PATCH/TEST已RETIRE且不进入215，剩余JYT集成属F07。
8. **车辆转名邦/图片资产化**：同Vehicle和Listing Cycle责任按PDM-04/06/08；F05真实Vehicle→Team/4S商户归属、图片CDN资产服务及PDM-10独立内部价权限仍缺权威。
9. **后台审计/公告/Banner**：若旧路径缺具体Current Page动作或对应Final，则明确未审；不把通知配置和商品定价权限从管理身份自动推导。

## 结论

有依据的仅是业务动作簇的存在及定位，不是旧HTTP接口已签复用；`KEEP/MODIFY/RETIRE/REPLACE`仅在后续正式逐条裁决、完整可信对象字段来源及独立安全HTTP验证后确定。F04-2处于CI预检阶段，产品与高保真仍`NOT_READY`。
