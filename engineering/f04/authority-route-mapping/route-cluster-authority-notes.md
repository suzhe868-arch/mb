# F04-2｜A整改215条Current Authority审查与业务Domain/Owner核对

> 2026-10-10｜218条旧方法=3个禁恢复+215条候选。初始105条簇级Matched经逐行审查，保留23条同动作证据，其余82条降级；现215条=23 EVIDENCE_MATCHED+192 SOURCE_GAP。历史API均未获批准，UNDECIDED/CONTRACT_ONLY。

A-F04-2-01原105条的逐项裁定记录于《A整改105条动作语义逐项复核.tsv》，并由action-semantic-contract.mjs机读固定同主体/同动作/Final/导航/页面证据。不能再把微信会话当手机号授权、Consultation当浏览、Waitlist当浏览、咨询处理当改客户称呼、发布当进入内部模式、旧独立price-override当正常Vehicle编辑。

A-F04-2-02新增完整逐行domain_authority、contract_owner、business_implementation_owner和owner_review_gap：F04代表HTTP合同核账，不等于所有业务实施Owner；Consultation按PDM-15划入独立业务域、其真实实施Owner保持OWNER_REVIEW_GAP待A裁，Waitlist按PDM-18归F06。所有未知领域如实标OWNER_REVIEW_GAP。

## ANNOUNCEMENT（8条；Matched 2；SOURCE_GAP 6）

- LEGACY-026 GET /customer/announcements/current｜SOURCE_GAP｜PDM-24｜实施F04
- LEGACY-027 POST /customer/announcements/{id}:shown｜SOURCE_GAP｜PDM-24｜实施F04
- LEGACY-028 GET /customer/announcements｜SOURCE_GAP｜PDM-24｜实施F04
- LEGACY-138 POST /admin/announcements/{id}:enable｜EVIDENCE_MATCHED｜PDM-24｜实施F04｜ANNOUNCEMENT_ENABLE
- LEGACY-139 POST /admin/announcements/{id}:disable｜EVIDENCE_MATCHED｜PDM-24｜实施F04｜ANNOUNCEMENT_DISABLE
- LEGACY-164 GET /admin/announcements｜SOURCE_GAP｜PDM-24｜实施F04
- LEGACY-165 POST /admin/announcements｜SOURCE_GAP｜PDM-24｜实施F04
- LEGACY-166 PATCH /admin/announcements/{id}｜SOURCE_GAP｜PDM-24｜实施F04

## BANNER（7条；Matched 4；SOURCE_GAP 3）

- LEGACY-031 GET /customer/banners｜SOURCE_GAP｜PDM-24｜实施F04
- LEGACY-141 GET /admin/banners｜SOURCE_GAP｜PDM-24｜实施F04
- LEGACY-142 POST /admin/banners｜EVIDENCE_MATCHED｜PDM-24｜实施F04｜BANNER_CREATE
- LEGACY-143 PATCH /admin/banners/{id}｜EVIDENCE_MATCHED｜PDM-24｜实施F04｜BANNER_EDIT
- LEGACY-144 POST /admin/banners/{id}:enable｜EVIDENCE_MATCHED｜PDM-24｜实施F04｜BANNER_ENABLE
- LEGACY-145 POST /admin/banners/{id}:disable｜EVIDENCE_MATCHED｜PDM-24｜实施F04｜BANNER_DISABLE
- LEGACY-146 POST /admin/banners:reorder｜SOURCE_GAP｜PDM-24｜实施F04

## CLIENT_FAVORITES（3条；Matched 2；SOURCE_GAP 1）

- LEGACY-007 PUT /customer/me/favorites/{vehicle_id}｜EVIDENCE_MATCHED｜PDM-04/06｜实施F05｜FAVORITE_TOGGLE
- LEGACY-008 DELETE /customer/me/favorites/{vehicle_id}｜EVIDENCE_MATCHED｜PDM-04/06｜实施F05｜FAVORITE_TOGGLE
- LEGACY-009 GET /customer/me/favorites｜SOURCE_GAP｜PDM-01/16｜实施F04

## CLIENT_RECOMMENDATION_HISTORY（2条；Matched 0；SOURCE_GAP 2）

- LEGACY-017 GET /customer/me/recommendations｜SOURCE_GAP｜PDM-14｜实施F06
- LEGACY-018 GET /customer/me/recommendations/{id}｜SOURCE_GAP｜PDM-14｜实施F06

## CLIENT_TRANSACTION_HISTORY（2条；Matched 0；SOURCE_GAP 2）

- LEGACY-024 GET /customer/me/transactions｜SOURCE_GAP｜PDM-19｜实施F06
- LEGACY-025 GET /customer/me/transactions/{id}｜SOURCE_GAP｜PDM-19｜实施F06

## CONSULTATION（8条；Matched 5；SOURCE_GAP 3）

- LEGACY-019 POST /customer/vehicles/{vehicle_id}/consultations｜EVIDENCE_MATCHED｜PDM-15｜实施OWNER_REVIEW_GAP｜CONSULTATION_CREATE
- LEGACY-021 GET /customer/me/consultations｜SOURCE_GAP｜PDM-15｜实施OWNER_REVIEW_GAP
- LEGACY-067 GET /staff/consultations｜SOURCE_GAP｜PDM-15｜实施OWNER_REVIEW_GAP
- LEGACY-068 GET /staff/consultations/{id}｜SOURCE_GAP｜PDM-15｜实施OWNER_REVIEW_GAP
- LEGACY-069 POST /staff/consultations/{id}:start-processing｜EVIDENCE_MATCHED｜PDM-15｜实施OWNER_REVIEW_GAP｜CONSULTATION_PROCESS
- LEGACY-070 POST /staff/consultations/{id}:resolve｜EVIDENCE_MATCHED｜PDM-15｜实施OWNER_REVIEW_GAP｜CONSULTATION_RESOLVE
- LEGACY-071 POST /staff/consultations/{id}:invalidate｜EVIDENCE_MATCHED｜PDM-15｜实施OWNER_REVIEW_GAP｜CONSULTATION_INVALIDATE
- LEGACY-072 POST /staff/consultations/{id}:reassign｜EVIDENCE_MATCHED｜PDM-15｜实施OWNER_REVIEW_GAP｜CONSULTATION_REASSIGN

## CRM（7条；Matched 0；SOURCE_GAP 7）

- LEGACY-035 GET /staff/workbench/opportunities｜SOURCE_GAP｜OWNER_REVIEW_GAP｜实施OWNER_REVIEW_GAP
- LEGACY-116 POST /admin/customers/{id}:reassign-owner｜SOURCE_GAP｜PDM-01/16｜实施F04
- LEGACY-124 POST /admin/handover-batches/{id}:assign-customers｜SOURCE_GAP｜PDM-01/16｜实施F04
- LEGACY-126 PUT /system-admin/customers/{id}/priority｜SOURCE_GAP｜PDM-02｜实施F04
- LEGACY-181 GET /admin/customers｜SOURCE_GAP｜PDM-01/16｜实施F04
- LEGACY-182 GET /admin/customers/{id}｜SOURCE_GAP｜PDM-01/16｜实施F04
- LEGACY-186 GET /admin/consultations｜SOURCE_GAP｜PDM-15｜实施OWNER_REVIEW_GAP

## CUSTOMER_ID（4条；Matched 0；SOURCE_GAP 4）

- LEGACY-001 POST /customer/session/wechat｜SOURCE_GAP｜PDM-01/16｜实施F04
- LEGACY-002 GET /customer/me｜SOURCE_GAP｜PDM-01/16｜实施F04
- LEGACY-003 PATCH /customer/me/profile｜SOURCE_GAP｜PDM-01/16｜实施F04
- LEGACY-004 POST /customer/me/phone:authorize｜SOURCE_GAP｜PDM-01/16｜实施F04

## DEMAND（29条；Matched 0；SOURCE_GAP 29）

- LEGACY-012 GET /customer/find-car/workspace｜SOURCE_GAP｜PDM-11/13｜实施F06
- LEGACY-013 POST /customer/find-car/applications｜SOURCE_GAP｜PDM-11/13｜实施F06
- LEGACY-014 GET /customer/find-car/applications/{id}｜SOURCE_GAP｜PDM-11/13｜实施F06
- LEGACY-015 PATCH /customer/find-car/applications/{id}｜SOURCE_GAP｜PDM-11/13｜实施F06
- LEGACY-016 GET /customer/demands/{id}｜SOURCE_GAP｜PDM-11/13｜实施F06
- LEGACY-044 POST /staff/recommendations｜SOURCE_GAP｜PDM-14｜实施F06
- LEGACY-045 POST /staff/recommendations/{id}:cancel｜SOURCE_GAP｜PDM-14｜实施F06
- LEGACY-046 POST /staff/matching/priorities/{id}:release｜SOURCE_GAP｜PDM-11/13｜实施F06
- LEGACY-047 GET /staff/find-car/applications｜SOURCE_GAP｜PDM-11/13｜实施F06
- LEGACY-048 GET /staff/find-car/applications/{id}｜SOURCE_GAP｜PDM-11/13｜实施F06
- LEGACY-049 POST /staff/find-car/applications/{id}:activate｜SOURCE_GAP｜PDM-11/13｜实施F06
- LEGACY-050 POST /staff/find-car/applications/{id}:close｜SOURCE_GAP｜PDM-11/13｜实施F06
- LEGACY-051 GET /staff/demands｜SOURCE_GAP｜PDM-11/13｜实施F06
- LEGACY-052 GET /staff/demands/{id}｜SOURCE_GAP｜PDM-11/13｜实施F06
- LEGACY-053 PUT /staff/demands/{id}/match-description｜SOURCE_GAP｜PDM-11/13｜实施F06
- LEGACY-054 PATCH /staff/demands/{id}/note｜SOURCE_GAP｜PDM-11/13｜实施F06
- LEGACY-055 POST /staff/demands/{id}:pause｜SOURCE_GAP｜PDM-11/13｜实施F06
- LEGACY-056 POST /staff/demands/{id}:resume｜SOURCE_GAP｜PDM-11/13｜实施F06
- LEGACY-057 POST /staff/demands/{id}:complete｜SOURCE_GAP｜PDM-11/13｜实施F06
- LEGACY-058 POST /staff/demands/{id}:cancel｜SOURCE_GAP｜PDM-11/13｜实施F06
- LEGACY-059 POST /staff/demands/{id}:reassign｜SOURCE_GAP｜PDM-11/13｜实施F06
- LEGACY-060 GET /staff/demands/{id}/matches｜SOURCE_GAP｜PDM-11/13｜实施F06
- LEGACY-063 GET /admin/matching-rules｜SOURCE_GAP｜PDM-11/13｜实施F06
- LEGACY-064 POST /admin/matching-rules｜SOURCE_GAP｜PDM-11/13｜实施F06
- LEGACY-065 PATCH /admin/matching-rules/{id}｜SOURCE_GAP｜PDM-11/13｜实施F06
- LEGACY-066 POST /admin/matching-rules:test｜SOURCE_GAP｜PDM-11/13｜实施F06
- LEGACY-183 GET /admin/find-car/applications｜SOURCE_GAP｜PDM-11/13｜实施F06
- LEGACY-184 GET /admin/demands｜SOURCE_GAP｜PDM-11/13｜实施F06
- LEGACY-185 GET /admin/demands/{id}｜SOURCE_GAP｜PDM-11/13｜实施F06

## JYT（4条；Matched 0；SOURCE_GAP 4）

- LEGACY-177 GET /admin/jyt/status｜SOURCE_GAP｜PDM-09｜实施F07
- LEGACY-178 GET /admin/integrations/collector/publisher-phone-cache｜SOURCE_GAP｜PDM-09｜实施F07
- LEGACY-179 GET /admin/jyt/incidents｜SOURCE_GAP｜PDM-09｜实施F07
- LEGACY-180 GET /admin/jyt/logs｜SOURCE_GAP｜PDM-09｜实施F07

## JYT_SYSTEM_EVENT（4条；Matched 0；SOURCE_GAP 4）

- LEGACY-147 POST /integrations/jyt/vehicle-prices｜SOURCE_GAP｜PDM-10｜实施F05
- LEGACY-148 POST /integrations/jyt/vehicles:upsert｜SOURCE_GAP｜PDM-09｜实施F07
- LEGACY-149 POST /integrations/jyt/vehicles:offline-batch｜SOURCE_GAP｜PDM-09｜实施F07
- LEGACY-150 GET /integrations/jyt/vehicles:active｜SOURCE_GAP｜PDM-09｜实施F07

## LOCK（4条；Matched 0；SOURCE_GAP 4）

- LEGACY-022 GET /customer/me/locks｜SOURCE_GAP｜PDM-18｜实施F06
- LEGACY-023 GET /customer/me/waitlists｜SOURCE_GAP｜PDM-18｜实施F06
- LEGACY-187 GET /admin/locks｜SOURCE_GAP｜PDM-18｜实施F06
- LEGACY-188 GET /admin/waitlists｜SOURCE_GAP｜PDM-18｜实施F06

## MODELS（11条；Matched 0；SOURCE_GAP 11）

- LEGACY-203 GET /admin/vehicle-model-match-cases｜SOURCE_GAP｜PDM-04/06｜实施F05
- LEGACY-204 GET /admin/vehicle-model-match-cases/{case_id}｜SOURCE_GAP｜PDM-04/06｜实施F05
- LEGACY-205 POST /admin/vehicle-model-match-cases/{case_id}:bind-existing｜SOURCE_GAP｜PDM-04/06｜实施F05
- LEGACY-206 POST /admin/vehicle-model-match-cases/{case_id}:create-and-bind｜SOURCE_GAP｜PDM-04/06｜实施F05
- LEGACY-207 POST /admin/vehicle-models｜SOURCE_GAP｜PDM-04/06｜实施F05
- LEGACY-208 GET /admin/vehicle-models｜SOURCE_GAP｜PDM-04/06｜实施F05
- LEGACY-209 PATCH /admin/vehicle-models/{model_id}｜SOURCE_GAP｜PDM-04/06｜实施F05
- LEGACY-210 GET /admin/vehicle-model-field-conflicts｜SOURCE_GAP｜PDM-04/06｜实施F05
- LEGACY-211 POST /admin/vehicle-model-field-conflicts/{conflict_id}:resolve｜SOURCE_GAP｜PDM-04/06｜实施F05
- LEGACY-212 POST /admin/vehicle-brands｜SOURCE_GAP｜PDM-04/06｜实施F05
- LEGACY-213 POST /admin/vehicle-series｜SOURCE_GAP｜PDM-04/06｜实施F05

## NOTIFICATION（9条；Matched 0；SOURCE_GAP 9）

- LEGACY-136 GET /admin/notification-deliveries｜SOURCE_GAP｜OWNER_REVIEW_GAP｜实施OWNER_REVIEW_GAP
- LEGACY-137 GET /admin/feishu-bindings｜SOURCE_GAP｜OWNER_REVIEW_GAP｜实施OWNER_REVIEW_GAP
- LEGACY-158 GET /admin/notification-config/sla｜SOURCE_GAP｜OWNER_REVIEW_GAP｜实施OWNER_REVIEW_GAP
- LEGACY-159 PUT /admin/notification-config/sla｜SOURCE_GAP｜OWNER_REVIEW_GAP｜实施OWNER_REVIEW_GAP
- LEGACY-160 GET /admin/notification-config/quiet-hours｜SOURCE_GAP｜OWNER_REVIEW_GAP｜实施OWNER_REVIEW_GAP
- LEGACY-161 PUT /admin/notification-config/quiet-hours｜SOURCE_GAP｜OWNER_REVIEW_GAP｜实施OWNER_REVIEW_GAP
- LEGACY-162 GET /admin/notification-config/lock-expiry-reminder｜SOURCE_GAP｜PDM-18｜实施F06
- LEGACY-163 PUT /admin/notification-config/lock-expiry-reminder｜SOURCE_GAP｜PDM-18｜实施F06
- LEGACY-195 PUT /admin/feishu-bindings/{employee_id}｜SOURCE_GAP｜PDM-02｜实施F04

## ORG（7条；Matched 0；SOURCE_GAP 7）

- LEGACY-122 POST /admin/handover-batches｜SOURCE_GAP｜OWNER_REVIEW_GAP｜实施OWNER_REVIEW_GAP
- LEGACY-123 GET /admin/handover-batches/{id}｜SOURCE_GAP｜OWNER_REVIEW_GAP｜实施OWNER_REVIEW_GAP
- LEGACY-127 GET /system-admin/admins｜SOURCE_GAP｜PDM-02｜实施F04
- LEGACY-128 POST /system-admin/admins｜SOURCE_GAP｜PDM-02｜实施F04
- LEGACY-129 PATCH /system-admin/admins/{id}/permissions｜SOURCE_GAP｜PDM-02｜实施F04
- LEGACY-130 POST /system-admin/admins/{id}:deactivate｜SOURCE_GAP｜PDM-02｜实施F04
- LEGACY-131 POST /system-admin/admins/{id}:reactivate｜SOURCE_GAP｜PDM-02｜实施F04

## OTHER_ADMIN（2条；Matched 0；SOURCE_GAP 2）

- LEGACY-140 GET /admin/audit-logs｜SOURCE_GAP｜OWNER_REVIEW_GAP｜实施OWNER_REVIEW_GAP
- LEGACY-173 GET /admin/dashboard｜SOURCE_GAP｜OWNER_REVIEW_GAP｜实施OWNER_REVIEW_GAP

## PC_AUTH（6条；Matched 0；SOURCE_GAP 6）

- LEGACY-167 POST /auth/staff/session:exchange｜SOURCE_GAP｜OWNER_REVIEW_GAP｜实施OWNER_REVIEW_GAP
- LEGACY-168 GET /auth/staff/context｜SOURCE_GAP｜OWNER_REVIEW_GAP｜实施OWNER_REVIEW_GAP
- LEGACY-169 POST /auth/staff/session:revoke｜SOURCE_GAP｜OWNER_REVIEW_GAP｜实施OWNER_REVIEW_GAP
- LEGACY-170 POST /auth/system-admin/session:exchange｜SOURCE_GAP｜PDM-02｜实施F04
- LEGACY-171 GET /auth/system-admin/context｜SOURCE_GAP｜PDM-02｜实施F04
- LEGACY-172 POST /auth/system-admin/session:revoke｜SOURCE_GAP｜PDM-02｜实施F04

## PRICE（9条；Matched 0；SOURCE_GAP 9）

- LEGACY-010 POST /customer/vehicles/{vehicle_id}/price-access:unlock｜SOURCE_GAP｜PDM-18｜实施F06
- LEGACY-011 GET /customer/me/price-quota/today｜SOURCE_GAP｜PDM-10｜实施F05
- LEGACY-132 GET /admin/pricing/ladder-sets｜SOURCE_GAP｜PDM-10｜实施F05
- LEGACY-133 POST /admin/pricing/ladder-sets｜SOURCE_GAP｜PDM-10｜实施F05
- LEGACY-134 PUT /admin/pricing/ladder-sets/{id}/rules｜SOURCE_GAP｜PDM-10｜实施F05
- LEGACY-135 POST /admin/pricing/ladder-sets/{id}:activate｜SOURCE_GAP｜PDM-10｜实施F05
- LEGACY-193 GET /admin/customer-levels｜SOURCE_GAP｜PDM-01/16｜实施F04
- LEGACY-194 GET /admin/vehicle-price-overrides｜SOURCE_GAP｜PDM-10｜实施F05
- LEGACY-196 PUT /admin/customers/{id}/level｜SOURCE_GAP｜PDM-01/16｜实施F04

## PUBLIC_POOL（4条；Matched 1；SOURCE_GAP 3）

- LEGACY-112 GET /staff/public-pool｜SOURCE_GAP｜PDM-17｜实施F04
- LEGACY-113 GET /staff/public-pool/candidates｜SOURCE_GAP｜PDM-17｜实施F04
- LEGACY-114 POST /staff/public-pool/customers/{customer_id}:claim｜SOURCE_GAP｜PDM-17｜实施F04
- LEGACY-115 POST /admin/public-pool/customers/{id}:put｜EVIDENCE_MATCHED｜PDM-17｜实施F04｜PUBLIC_POOL_PUT

## SHARE（2条；Matched 0；SOURCE_GAP 2）

- LEGACY-029 POST /customer/vehicles/{id}/share-context｜SOURCE_GAP｜PDM-04/06｜实施F05
- LEGACY-030 POST /customer/share-entry:resolve｜SOURCE_GAP｜PDM-01/16｜实施F04

## STAFF_ADMIN（13条；Matched 5；SOURCE_GAP 8）

- LEGACY-117 POST /admin/employees/{id}:deactivate｜EVIDENCE_MATCHED｜PDM-02｜实施F04｜EMPLOYEE_DEACTIVATE
- LEGACY-118 POST /admin/employees/{id}:reactivate｜EVIDENCE_MATCHED｜PDM-02｜实施F04｜EMPLOYEE_REACTIVATE
- LEGACY-119 PUT /admin/employees/{id}/permission-overrides｜EVIDENCE_MATCHED｜PDM-02｜实施F04｜PERMISSION_OVERRIDE
- LEGACY-120 PUT /admin/employees/{id}/data-scope｜EVIDENCE_MATCHED｜PDM-02｜实施F04｜DATA_SCOPE_CONFIG
- LEGACY-121 PATCH /admin/employees/{id}/receiving｜EVIDENCE_MATCHED｜PDM-02｜实施F04｜RECEIVING_CONFIG
- LEGACY-151 GET /admin/employees｜SOURCE_GAP｜PDM-02｜实施F04
- LEGACY-152 POST /admin/employees｜SOURCE_GAP｜PDM-02｜实施F04
- LEGACY-153 PATCH /admin/employees/{id}｜SOURCE_GAP｜PDM-02｜实施F04
- LEGACY-154 GET /admin/roles｜SOURCE_GAP｜PDM-02｜实施F04
- LEGACY-155 PATCH /admin/roles/{role_code}｜SOURCE_GAP｜PDM-02｜实施F04
- LEGACY-156 GET /admin/permissions｜SOURCE_GAP｜PDM-02｜实施F04
- LEGACY-157 PATCH /admin/permissions/{permission_code}｜SOURCE_GAP｜PDM-02｜实施F04
- LEGACY-214 PATCH /admin/employees/{id}/report-preferences｜SOURCE_GAP｜PDM-02｜实施F04

## STAFF_CRM（6条；Matched 0；SOURCE_GAP 6）

- LEGACY-038 GET /staff/customers｜SOURCE_GAP｜PDM-01/16｜实施F04
- LEGACY-039 GET /staff/customers/{customer_id}｜SOURCE_GAP｜PDM-01/16｜实施F04
- LEGACY-040 PATCH /staff/customers/{id}/profile｜SOURCE_GAP｜PDM-01/16｜实施F04
- LEGACY-041 POST /staff/customers/{id}/followups｜SOURCE_GAP｜PDM-01/16｜实施F04
- LEGACY-042 POST /staff/customers/{id}/alias-notes｜SOURCE_GAP｜PDM-01/16｜实施F04
- LEGACY-043 POST /staff/customers/{id}/price-quota:add｜SOURCE_GAP｜PDM-10｜实施F05

## STAFF_LOCK_WAITLIST（14条；Matched 0；SOURCE_GAP 14）

- LEGACY-089 POST /staff/locks｜SOURCE_GAP｜PDM-18｜实施F06
- LEGACY-090 GET /staff/locks｜SOURCE_GAP｜PDM-18｜实施F06
- LEGACY-091 GET /staff/locks/{id}｜SOURCE_GAP｜PDM-18｜实施F06
- LEGACY-092 POST /staff/locks/{id}:release｜SOURCE_GAP｜PDM-18｜实施F06
- LEGACY-093 POST /staff/locks/{id}:reassign｜SOURCE_GAP｜PDM-18｜实施F06
- LEGACY-094 PATCH /staff/locks/{id}/expires-at｜SOURCE_GAP｜PDM-18｜实施F06
- LEGACY-095 POST /staff/locks/{id}/deposits｜SOURCE_GAP｜PDM-18｜实施F06
- LEGACY-096 GET /staff/locks/{id}/deposits｜SOURCE_GAP｜PDM-18｜实施F06
- LEGACY-097 POST /staff/waitlists｜SOURCE_GAP｜PDM-18｜实施F06
- LEGACY-098 GET /staff/waitlists｜SOURCE_GAP｜PDM-18｜实施F06
- LEGACY-099 GET /staff/waitlists/{id}｜SOURCE_GAP｜PDM-18｜实施F06
- LEGACY-100 POST /staff/waitlists/{id}:end｜SOURCE_GAP｜PDM-18｜实施F06
- LEGACY-101 POST /staff/waitlists/{id}:reassign｜SOURCE_GAP｜PDM-18｜实施F06
- LEGACY-102 POST /staff/locks/{lock_id}/transaction｜SOURCE_GAP｜PDM-18｜实施F06

## STAFF_PUBLISHER_PHONE（1条；Matched 1；SOURCE_GAP 0）

- LEGACY-087 POST /staff/vehicles/{id}/upstream-phone:refresh｜EVIDENCE_MATCHED｜PDM-09｜实施F07｜PUBLISHER_PHONE_REFRESH

## STAFF_VEHICLE（16条；Matched 2；SOURCE_GAP 14）

- LEGACY-073 GET /staff/vehicles｜SOURCE_GAP｜PDM-04/06｜实施F05
- LEGACY-074 POST /staff/vehicles｜SOURCE_GAP｜PDM-04/06｜实施F05
- LEGACY-075 GET /staff/vehicles/{id}｜SOURCE_GAP｜PDM-04/06｜实施F05
- LEGACY-076 PATCH /staff/vehicles/{id}｜SOURCE_GAP｜PDM-04/06｜实施F05
- LEGACY-077 DELETE /staff/vehicles/{id}｜SOURCE_GAP｜PDM-04/06｜实施F05
- LEGACY-078 GET /staff/vehicles/{id}/internal｜SOURCE_GAP｜PDM-04/06｜实施F05
- LEGACY-079 POST /staff/vehicles/{id}:publish｜EVIDENCE_MATCHED｜PDM-04/06｜实施F05｜VEHICLE_PUBLISH
- LEGACY-080 POST /staff/vehicles/{id}:hide｜SOURCE_GAP｜PDM-04/06｜实施F05
- LEGACY-081 POST /staff/vehicles/{id}:show｜SOURCE_GAP｜PDM-04/06｜实施F05
- LEGACY-082 POST /staff/vehicles/{id}:mark-unavailable｜SOURCE_GAP｜PDM-04/06｜实施F05
- LEGACY-083 POST /staff/vehicles/{id}:mark-sold-external｜SOURCE_GAP｜PDM-04/06｜实施F05
- LEGACY-084 POST /staff/vehicles/{id}:relist｜SOURCE_GAP｜PDM-04/06｜实施F05
- LEGACY-085 POST /staff/vehicles/{id}/price-override｜SOURCE_GAP｜PDM-10｜实施F05
- LEGACY-086 DELETE /staff/vehicles/{id}/price-override｜SOURCE_GAP｜PDM-10｜实施F05
- LEGACY-088 POST /staff/vehicles/{id}:convert-to-mingbang｜EVIDENCE_MATCHED｜PDM-04/06｜实施F05｜VEHICLE_CONVERT_SOURCE
- LEGACY-215 GET /staff/vehicles/{id}/source-data｜SOURCE_GAP｜PDM-04/06｜实施F05

## TX（12条；Matched 0；SOURCE_GAP 12）

- LEGACY-103 GET /staff/transactions｜SOURCE_GAP｜PDM-19｜实施F06
- LEGACY-104 GET /staff/transactions/{id}｜SOURCE_GAP｜PDM-19｜实施F06
- LEGACY-105 POST /staff/transactions/{id}:complete｜SOURCE_GAP｜PDM-19｜实施F06
- LEGACY-106 POST /staff/transactions/{id}:cancel｜SOURCE_GAP｜PDM-19｜实施F06
- LEGACY-107 POST /staff/transactions/{id}:reassign｜SOURCE_GAP｜PDM-19｜实施F06
- LEGACY-108 POST /staff/refunds｜SOURCE_GAP｜PDM-19｜实施F06
- LEGACY-109 POST /staff/refunds/{id}/payments｜SOURCE_GAP｜PDM-19｜实施F06
- LEGACY-110 GET /staff/refunds/{id}｜SOURCE_GAP｜PDM-19｜实施F06
- LEGACY-189 GET /admin/deposits｜SOURCE_GAP｜PDM-19｜实施F06
- LEGACY-190 GET /admin/transactions｜SOURCE_GAP｜PDM-19｜实施F06
- LEGACY-191 GET /admin/refunds｜SOURCE_GAP｜PDM-19｜实施F06
- LEGACY-192 POST /admin/transactions/{id}:correct｜SOURCE_GAP｜PDM-19｜实施F06

## UNCLASSIFIED（9条；Matched 0；SOURCE_GAP 9）

- LEGACY-032 GET /staff/me｜SOURCE_GAP｜OWNER_REVIEW_GAP｜实施OWNER_REVIEW_GAP
- LEGACY-033 GET /staff/workbench｜SOURCE_GAP｜OWNER_REVIEW_GAP｜实施OWNER_REVIEW_GAP
- LEGACY-034 GET /staff/workbench/todos｜SOURCE_GAP｜OWNER_REVIEW_GAP｜实施OWNER_REVIEW_GAP
- LEGACY-036 GET /staff/radar｜SOURCE_GAP｜OWNER_REVIEW_GAP｜实施OWNER_REVIEW_GAP
- LEGACY-037 GET /staff/radar/events/{id}｜SOURCE_GAP｜OWNER_REVIEW_GAP｜实施OWNER_REVIEW_GAP
- LEGACY-061 POST /staff/demand-matches/{match_id}:reject｜SOURCE_GAP｜PDM-11/13｜实施F06
- LEGACY-062 POST /staff/demand-matches/{match_id}:recommend｜SOURCE_GAP｜PDM-11/13｜实施F06
- LEGACY-111 GET /staff/business-timeline｜SOURCE_GAP｜OWNER_REVIEW_GAP｜实施OWNER_REVIEW_GAP
- LEGACY-125 POST /admin/business-reassignments｜SOURCE_GAP｜OWNER_REVIEW_GAP｜实施OWNER_REVIEW_GAP

## VEHICLE（11条；Matched 0；SOURCE_GAP 11）

- LEGACY-005 GET /customer/vehicles｜SOURCE_GAP｜PDM-04/06｜实施F05
- LEGACY-006 GET /customer/vehicles/{vehicle_id}｜SOURCE_GAP｜PDM-04/06｜实施F05
- LEGACY-174 GET /admin/vehicles｜SOURCE_GAP｜PDM-04/06｜实施F05
- LEGACY-175 GET /admin/vehicles/{id}｜SOURCE_GAP｜PDM-04/06｜实施F05
- LEGACY-176 GET /admin/vehicles/{id}/history｜SOURCE_GAP｜PDM-04/06｜实施F05
- LEGACY-197 GET /customer/vehicle-catalog/brands｜SOURCE_GAP｜PDM-04/06｜实施F05
- LEGACY-198 GET /customer/vehicle-catalog/brands/{brand_id}/series｜SOURCE_GAP｜PDM-04/06｜实施F05
- LEGACY-199 GET /customer/vehicle-catalog/series/{series_id}/models｜SOURCE_GAP｜PDM-04/06｜实施F05
- LEGACY-200 GET /staff/vehicle-catalog/brands｜SOURCE_GAP｜PDM-04/06｜实施F05
- LEGACY-201 GET /staff/vehicle-catalog/brands/{brand_id}/series｜SOURCE_GAP｜PDM-04/06｜实施F05
- LEGACY-202 GET /staff/vehicle-catalog/series/{series_id}/models｜SOURCE_GAP｜PDM-04/06｜实施F05

## WAITLIST（1条；Matched 1；SOURCE_GAP 0）

- LEGACY-020 POST /customer/vehicles/{vehicle_id}/waitlist｜EVIDENCE_MATCHED｜PDM-18｜实施F06｜WAITLIST_REGISTER

## 封印与未完成范围

历史F04-1/旧F03、M94/G14数据库物理结构封印、28个独立PG16 CI、4S只读HTTPS硬拒与所有PDM/IA不可改动；本批不注册生产API、不处理真实账号/资金/JYT，不启动F04-3，产品与C/H01 NOT_READY。
