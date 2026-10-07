# 09 ENDPOINT AUTHORIZATION MAP

> CR-005 regenerated from the authoritative OpenAPI. `auth.*`, `customer.*`, and JYT ingest markers are capability classes, not employee RBAC permission rows.

| Method | Endpoint | Identity | Permission / capability | Scope | Projection | Field permission | Idempotency |
|---|---|---|---|---|---|---|---|
| `POST` | `/customer/session/wechat` | anonymous | `customer.session` | wechat credential | `CustomerSessionDTO` | — | not required |
| `GET` | `/customer/me` | customer | `customer.self` | own-object/customer-safe visibility | `CustomerDTO` | — | not required |
| `PATCH` | `/customer/me/profile` | customer | `customer.self` | own-object/customer-safe visibility | `CustomerDTO` | — | not required |
| `POST` | `/customer/me/phone:authorize` | customer | `customer.self` | own-object/customer-safe visibility | `CustomerDTO` | — | not required |
| `GET` | `/customer/vehicles` | customer | `customer.self` | own-object/customer-safe visibility | `VehicleCardCustomerDTO[]` | — | not required |
| `GET` | `/customer/vehicles/{vehicle_id}` | customer | `customer.self` | own-object/customer-safe visibility | `VehicleCustomerDetailDTO` | — | not required |
| `PUT` | `/customer/me/favorites/{vehicle_id}` | customer | `customer.self` | own-object/customer-safe visibility | `CustomerFavoriteDTO` | — | not required |
| `DELETE` | `/customer/me/favorites/{vehicle_id}` | customer | `customer.self` | own-object/customer-safe visibility | `CustomerFavoriteDTO` | — | not required |
| `GET` | `/customer/me/favorites` | customer | `customer.self` | own-object/customer-safe visibility | `CustomerFavoriteDTO[]` | — | not required |
| `POST` | `/customer/vehicles/{vehicle_id}/price-access:unlock` | customer | `customer.self` | own-object/customer-safe visibility | `PriceAccessDTO` | — | not required |
| `GET` | `/customer/me/price-quota/today` | customer | `customer.self` | own-object/customer-safe visibility | `PriceQuotaDTO` | — | not required |
| `GET` | `/customer/find-car/workspace` | customer | `customer.self` | own-object/customer-safe visibility | `FindCarDTO` | — | not required |
| `POST` | `/customer/find-car/applications` | customer | `customer.self` | own-object/customer-safe visibility | `FindCarApplicationDTO` | — | not required |
| `GET` | `/customer/find-car/applications/{id}` | customer | `customer.self` | own-object/customer-safe visibility | `FindCarApplicationDTO` | — | not required |
| `PATCH` | `/customer/find-car/applications/{id}` | customer | `customer.self` | own-object/customer-safe visibility | `FindCarApplicationDTO` | — | not required |
| `GET` | `/customer/demands/{id}` | customer | `customer.self` | own-object/customer-safe visibility | `DemandDTO` | — | not required |
| `GET` | `/customer/me/recommendations` | customer | `customer.self` | own-object/customer-safe visibility | `CustomerRecommendationDTO[]` | — | not required |
| `GET` | `/customer/me/recommendations/{id}` | customer | `customer.self` | own-object/customer-safe visibility | `CustomerRecommendationDTO` | — | not required |
| `POST` | `/customer/vehicles/{vehicle_id}/consultations` | customer | `customer.self` | own-object/customer-safe visibility | `CustomerConsultationDTO` | — | not required |
| `POST` | `/customer/vehicles/{vehicle_id}/waitlist` | customer | `customer.self` | own-object/customer-safe visibility | `CustomerWaitlistDTO` | — | not required |
| `GET` | `/customer/me/consultations` | customer | `customer.self` | own-object/customer-safe visibility | `CustomerConsultationDTO[]` | — | not required |
| `GET` | `/customer/me/locks` | customer | `customer.self` | own-object/customer-safe visibility | `CustomerLockDTO[]` | — | not required |
| `GET` | `/customer/me/waitlists` | customer | `customer.self` | own-object/customer-safe visibility | `CustomerWaitlistDTO[]` | — | not required |
| `GET` | `/customer/me/transactions` | customer | `customer.self` | own-object/customer-safe visibility | `CustomerTransactionDTO[]` | — | not required |
| `GET` | `/customer/me/transactions/{id}` | customer | `customer.self` | own-object/customer-safe visibility | `CustomerTransactionDTO` | — | not required |
| `GET` | `/customer/announcements/current` | customer | `customer.self` | own-object/customer-safe visibility | `CustomerAnnouncementDTO[]` | — | not required |
| `POST` | `/customer/announcements/{id}:shown` | customer | `customer.self` | own-object/customer-safe visibility | `AnnouncementShownDTO` | — | not required |
| `GET` | `/customer/announcements` | customer | `customer.self` | own-object/customer-safe visibility | `CustomerAnnouncementDTO[]` | — | not required |
| `POST` | `/customer/vehicles/{id}/share-context` | customer | `customer.self` | own-object/customer-safe visibility | `ShareContextDTO` | — | not required |
| `POST` | `/customer/share-entry:resolve` | customer | `customer.self` | own-object/customer-safe visibility | `ShareResolveDTO` | — | not required |
| `GET` | `/customer/banners` | customer | `customer.self` | own-object/customer-safe visibility | `BannerCustomerDTO[]` | — | not required |
| `GET` | `/staff/me` | employee | `auth.staff.session` | current employee self only | `StaffSelfDTO` | — | not required |
| `GET` | `/staff/workbench` | employee | `auth.staff.session` | authenticated employee shell; server-filtered by linked-object permission + data scope | `WorkbenchDTO` | — | not required |
| `GET` | `/staff/workbench/todos` | employee | `auth.staff.session` | authenticated employee shell; server-filtered by linked-object permission + data scope | `WorkbenchTodoDTO[]` | — | not required |
| `GET` | `/staff/workbench/opportunities` | employee | `crm.customer.read` | customer data scope; 4S default denied/hidden | `CustomerOpportunityDTO[]` | — | not required |
| `GET` | `/staff/radar` | employee | `demand.read` | responsibility/data scope | `RadarEventDTO[]` | — | not required |
| `GET` | `/staff/radar/events/{id}` | employee | `demand.read` | responsibility/data scope | `RadarEventDTO` | — | not required |
| `GET` | `/staff/customers` | employee | `crm.customer.read` | customer data scope | `StaffCustomerDTO[]` | — | not required |
| `GET` | `/staff/customers/{customer_id}` | employee | `crm.customer.read` | customer data scope | `StaffCustomerDTO` | — | not required |
| `PATCH` | `/staff/customers/{id}/profile` | employee | `crm.customer.edit` | customer data scope | `StaffCustomerDTO` | — | Idempotency-Key required |
| `POST` | `/staff/customers/{id}/followups` | employee | `crm.customer.edit` | customer data scope | `FollowupDTO` | — | Idempotency-Key required |
| `POST` | `/staff/customers/{id}/alias-notes` | employee | `crm.customer.edit` | customer data scope | `AliasNoteDTO` | — | Idempotency-Key required |
| `POST` | `/staff/customers/{id}/price-quota:add` | employee | `crm.quota.adjust` | customer data scope | `PriceQuotaAdjustmentDTO` | — | Idempotency-Key required |
| `POST` | `/staff/recommendations` | employee | `recommendation.create` | customer scope + vehicle state | `RecommendationDTO` | — | Idempotency-Key required |
| `POST` | `/staff/recommendations/{id}:cancel` | employee | `recommendation.create` | current recommender/responsible customer scope + active recommendation | `RecommendationDTO` | — | Idempotency-Key required |
| `POST` | `/staff/matching/priorities/{id}:release` | employee | `recommendation.create` | current responsible customer + active Priority | — | — | Idempotency-Key required |
| `GET` | `/staff/find-car/applications` | employee | `demand.read` | responsibility/data scope | `FindCarApplicationDTO[]` | — | not required |
| `GET` | `/staff/find-car/applications/{id}` | employee | `demand.read` | responsibility/data scope | `FindCarApplicationDTO` | — | not required |
| `POST` | `/staff/find-car/applications/{id}:activate` | employee | `demand.manage` | responsibility/data scope | `FindCarActivationDTO` | — | Idempotency-Key required |
| `POST` | `/staff/find-car/applications/{id}:close` | employee | `demand.manage` | responsibility/data scope | `FindCarApplicationDTO` | — | Idempotency-Key required |
| `GET` | `/staff/demands` | employee | `demand.read` | responsibility/data scope | `StaffDemandDTO` | — | not required |
| `GET` | `/staff/demands/{id}` | employee | `demand.read` | responsibility/data scope | `StaffDemandDTO` | — | not required |
| `PUT` | `/staff/demands/{id}/match-description` | employee | `demand.manage` | responsibility/data scope | `StaffDemandDTO` | — | Idempotency-Key required |
| `PATCH` | `/staff/demands/{id}/note` | employee | `demand.manage` | responsibility/data scope | `StaffDemandDTO` | — | Idempotency-Key required |
| `POST` | `/staff/demands/{id}:pause` | employee | `demand.manage` | responsibility/data scope | `StaffDemandDTO` | — | Idempotency-Key required |
| `POST` | `/staff/demands/{id}:resume` | employee | `demand.manage` | responsibility/data scope | `StaffDemandDTO` | — | Idempotency-Key required |
| `POST` | `/staff/demands/{id}:complete` | employee | `demand.manage` | responsibility/data scope | `StaffDemandDTO` | — | Idempotency-Key required |
| `POST` | `/staff/demands/{id}:cancel` | employee | `demand.manage` | responsibility/data scope | `StaffDemandDTO` | — | Idempotency-Key required |
| `POST` | `/staff/demands/{id}:reassign` | employee | `demand.manage` | responsibility/data scope | `StaffDemandDTO` | — | Idempotency-Key required |
| `GET` | `/staff/demands/{id}/matches` | employee | `demand.read` | responsibility/data scope | `DemandMatchDTO[]` | — | not required |
| `POST` | `/staff/demand-matches/{match_id}:reject` | employee | `demand.manage` | responsibility/data scope | `DemandMatchDTO` | — | Idempotency-Key required |
| `POST` | `/staff/demand-matches/{match_id}:recommend` | employee | `demand.manage` | responsibility/data scope | `RecommendationDTO` | — | Idempotency-Key required |
| `GET` | `/admin/matching-rules` | employee | `matching.rule.manage` | admin scope | `MatchingRuleDTO[]` | — | not required |
| `POST` | `/admin/matching-rules` | employee | `matching.rule.manage` | admin scope | `MatchingRuleDTO` | — | Idempotency-Key required |
| `PATCH` | `/admin/matching-rules/{id}` | employee | `matching.rule.manage` | admin scope | `MatchingRuleDTO` | — | Idempotency-Key required |
| `POST` | `/admin/matching-rules:test` | employee | `matching.rule.manage` | admin scope | `MatchingRuleTestResultDTO` | — | Idempotency-Key required |
| `GET` | `/staff/consultations` | employee | `consultation.read` | responsibility/data scope | `StaffConsultationDTO[]` | — | not required |
| `GET` | `/staff/consultations/{id}` | employee | `consultation.read` | responsibility/data scope | `StaffConsultationDTO` | — | not required |
| `POST` | `/staff/consultations/{id}:start-processing` | employee | `consultation.manage` | responsibility/data scope | `StaffConsultationDTO` | — | Idempotency-Key required |
| `POST` | `/staff/consultations/{id}:resolve` | employee | `consultation.manage` | responsibility/data scope | `StaffConsultationDTO` | — | Idempotency-Key required |
| `POST` | `/staff/consultations/{id}:invalidate` | employee | `consultation.manage` | responsibility/data scope | `StaffConsultationDTO` | — | Idempotency-Key required |
| `POST` | `/staff/consultations/{id}:reassign` | employee | `consultation.manage` | responsibility/data scope | `StaffConsultationDTO` | — | Idempotency-Key required |
| `GET` | `/staff/vehicles` | employee | `vehicle.read.customer_safe` | vehicle/store/ownership scope + object state | `StaffVehicleCardDTO[]` | — | not required |
| `POST` | `/staff/vehicles` | employee | `vehicle.create` | vehicle/store/ownership scope + object state | `StaffVehicleInternalDTO` | — | Idempotency-Key required |
| `GET` | `/staff/vehicles/{id}` | employee | `vehicle.read.customer_safe` | vehicle/store/ownership scope + object state | `StaffVehicleSafeDTO` | — | not required |
| `PATCH` | `/staff/vehicles/{id}` | employee | `vehicle.edit` | vehicle/store/ownership scope + object state | `StaffVehicleInternalDTO` | — | Idempotency-Key required |
| `DELETE` | `/staff/vehicles/{id}` | employee | `vehicle.edit` | vehicle/store/ownership scope + object state | `StaffVehicleInternalDTO` | — | Idempotency-Key required |
| `GET` | `/staff/vehicles/{id}/internal` | employee | `vehicle.read.internal` | vehicle/store/ownership scope + object state | `StaffVehicleInternalDTO` | `wholesale_price`→`vehicle.internal_price.view`<br>`internal.upstream_list_price_cents`→`vehicle.internal_price.view`<br>`internal.upstream_wholesale_price_cents`→`vehicle.internal_price.view`<br>`internal.base_wholesale_price_cents`→`vehicle.internal_price.view`<br>`internal.internal_wholesale_price_cents`→`vehicle.internal_price.view`<br>`internal.customer_rule_price_cents`→`vehicle.internal_price.view`<br>`internal.customer_override_price_cents`→`vehicle.price.override`<br>`internal.upstream_phone`→`vehicle.upstream_phone`<br>`internal.vin`→`vehicle.read.internal`<br>`internal.car_code`→`vehicle.read.internal`<br>`internal.publisher_id`→`vehicle.read.internal` | not required |
| `POST` | `/staff/vehicles/{id}:publish` | employee | `vehicle.publish` | vehicle/store/ownership scope + object state | `StaffVehicleInternalDTO` | — | Idempotency-Key required |
| `POST` | `/staff/vehicles/{id}:hide` | employee | `vehicle.hide` | vehicle/store/ownership scope + object state | `StaffVehicleSafeDTO` | — | Idempotency-Key required |
| `POST` | `/staff/vehicles/{id}:show` | employee | `vehicle.hide` | vehicle/store/ownership scope + object state | `StaffVehicleSafeDTO` | — | Idempotency-Key required |
| `POST` | `/staff/vehicles/{id}:mark-unavailable` | employee | `vehicle.edit` | vehicle/store/ownership scope + object state | `StaffVehicleInternalDTO` | — | Idempotency-Key required |
| `POST` | `/staff/vehicles/{id}:mark-sold-external` | employee | `vehicle.edit` | vehicle/store/ownership scope + object state | `StaffVehicleInternalDTO` | — | Idempotency-Key required |
| `POST` | `/staff/vehicles/{id}:relist` | employee | `vehicle.edit` | vehicle/store/ownership scope + object state | `StaffVehicleInternalDTO` | — | Idempotency-Key required |
| `POST` | `/staff/vehicles/{id}/price-override` | employee | `vehicle.price.override` | vehicle/store/ownership scope + object state | `StaffVehicleInternalDTO` | — | Idempotency-Key required |
| `DELETE` | `/staff/vehicles/{id}/price-override` | employee | `vehicle.price.override` | vehicle/store/ownership scope + object state | `StaffVehicleInternalDTO` | — | Idempotency-Key required |
| `POST` | `/staff/vehicles/{id}/upstream-phone:refresh` | employee | `vehicle.upstream_phone` | vehicle/store/ownership scope + object state | `StaffUpstreamPhoneDTO` | — | Idempotency-Key required |
| `POST` | `/staff/vehicles/{id}:convert-to-mingbang` | employee | `vehicle.convert_mingbang` | vehicle/store/ownership scope + object state | `ConversionDTO` | — | Idempotency-Key required |
| `POST` | `/staff/locks` | employee | `lock.create` | customer/vehicle/responsibility scope | `LockDTO` | — | Idempotency-Key required |
| `GET` | `/staff/locks` | employee | `lock.manage` | customer/vehicle/responsibility scope | `LockDTO[]` | — | not required |
| `GET` | `/staff/locks/{id}` | employee | `lock.manage` | customer/vehicle/responsibility scope | `LockDTO` | — | not required |
| `POST` | `/staff/locks/{id}:release` | employee | `lock.manage` | customer/vehicle/responsibility scope | `LockDTO` | — | Idempotency-Key required |
| `POST` | `/staff/locks/{id}:reassign` | employee | `lock.manage` | customer/vehicle/responsibility scope | `LockDTO` | — | Idempotency-Key required |
| `PATCH` | `/staff/locks/{id}/expires-at` | employee | `lock.manage` | customer/vehicle/responsibility scope | `LockDTO` | — | Idempotency-Key required |
| `POST` | `/staff/locks/{id}/deposits` | employee | `funds.deposit.record` | customer/vehicle/responsibility scope | `DepositReceiptDTO` | — | Idempotency-Key required |
| `GET` | `/staff/locks/{id}/deposits` | employee | `lock.manage` | customer/vehicle/responsibility scope | `DepositReceiptDTO[]` | — | not required |
| `POST` | `/staff/waitlists` | employee | `waitlist.manage` | customer/vehicle/responsibility scope | `WaitlistDTO` | — | Idempotency-Key required |
| `GET` | `/staff/waitlists` | employee | `waitlist.manage` | customer/vehicle/responsibility scope | `WaitlistDTO[]` | — | not required |
| `GET` | `/staff/waitlists/{id}` | employee | `waitlist.manage` | customer/vehicle/responsibility scope | `WaitlistDTO` | — | not required |
| `POST` | `/staff/waitlists/{id}:end` | employee | `waitlist.manage` | customer/vehicle/responsibility scope | `WaitlistDTO` | — | Idempotency-Key required |
| `POST` | `/staff/waitlists/{id}:reassign` | employee | `waitlist.manage` | customer/vehicle/responsibility scope | `WaitlistDTO` | — | Idempotency-Key required |
| `POST` | `/staff/locks/{lock_id}/transaction` | employee | `transaction.manage` | customer/vehicle/responsibility scope | `TransactionDTO` | — | Idempotency-Key required |
| `GET` | `/staff/transactions` | employee | `transaction.manage` | transaction responsibility scope | `TransactionDTO[]` | — | not required |
| `GET` | `/staff/transactions/{id}` | employee | `transaction.manage` | transaction responsibility scope | `TransactionDTO` | — | not required |
| `POST` | `/staff/transactions/{id}:complete` | employee | `transaction.manage` | transaction responsibility scope | `TransactionDTO` | — | Idempotency-Key required |
| `POST` | `/staff/transactions/{id}:cancel` | employee | `transaction.manage` | transaction responsibility scope | `TransactionDTO` | — | Idempotency-Key required |
| `POST` | `/staff/transactions/{id}:reassign` | employee | `transaction.manage` | transaction responsibility scope | `TransactionDTO` | — | Idempotency-Key required |
| `POST` | `/staff/refunds` | employee | `refund.manage` | customer/refund-subject scope | `RefundDTO` | — | Idempotency-Key required |
| `POST` | `/staff/refunds/{id}/payments` | employee | `refund.manage` | customer/refund-subject scope | `RefundDTO` | — | Idempotency-Key required |
| `GET` | `/staff/refunds/{id}` | employee | `refund.manage` | customer/refund-subject scope | `RefundDTO` | — | not required |
| `GET` | `/staff/business-timeline` | employee | `crm.customer.read` | customer/business scope | `TimelineDTO` | — | not required |
| `GET` | `/staff/public-pool` | employee | `crm.public_pool.manage` | customer scope + protection | `StaffCustomerDTO[]` | — | not required |
| `GET` | `/staff/public-pool/candidates` | employee | `crm.public_pool.manage` | customer scope + protection | `StaffCustomerDTO[]` | — | not required |
| `POST` | `/staff/public-pool/customers/{customer_id}:claim` | employee | `crm.public_pool.manage` | customer scope + protection | `StaffCustomerDTO` | — | Idempotency-Key required |
| `POST` | `/admin/public-pool/customers/{id}:put` | employee | `crm.public_pool.manage` | management customer scope + protection | `AdminCustomerDTO` | — | Idempotency-Key required |
| `POST` | `/admin/customers/{id}:reassign-owner` | employee | `crm.owner.reassign` | management customer scope + protection | `AdminCustomerDTO` | — | Idempotency-Key required |
| `POST` | `/admin/employees/{id}:deactivate` | employee | `employee.manage` | management scope | `AdminEmployeeDTO` | — | Idempotency-Key required |
| `POST` | `/admin/employees/{id}:reactivate` | employee | `employee.manage` | management scope | `AdminEmployeeDTO` | — | Idempotency-Key required |
| `PUT` | `/admin/employees/{id}/permission-overrides` | employee | `permission.manage` | management scope | `AdminEmployeeDTO` | — | Idempotency-Key required |
| `PUT` | `/admin/employees/{id}/data-scope` | employee | `permission.manage` | management scope | `AdminEmployeeDTO` | — | Idempotency-Key required |
| `PATCH` | `/admin/employees/{id}/receiving` | employee | `employee.manage` | management scope | `AdminEmployeeDTO` | — | Idempotency-Key required |
| `POST` | `/admin/handover-batches` | employee | `employee.manage` | management scope | `HandoverBatchDTO` | — | Idempotency-Key required |
| `GET` | `/admin/handover-batches/{id}` | employee | `employee.manage` | management scope | `HandoverBatchDTO` | — | not required |
| `POST` | `/admin/handover-batches/{id}:assign-customers` | employee | `employee.manage` | management scope | `HandoverBatchDTO` | — | Idempotency-Key required |
| `POST` | `/admin/business-reassignments` | employee | `employee.manage` | management scope | `BusinessReassignmentDTO` | — | Idempotency-Key required |
| `GET` | `/system-admin/admins` | system_admin | `system_admin.manage` | system-admin domain | `SystemAdminDTO[]` | — | not required |
| `POST` | `/system-admin/admins` | system_admin | `system_admin.manage` | system-admin domain | `SystemAdminDTO` | — | Idempotency-Key required |
| `PATCH` | `/system-admin/admins/{id}/permissions` | system_admin | `system_admin.manage` | system-admin domain | `SystemAdminDTO` | — | Idempotency-Key required |
| `POST` | `/system-admin/admins/{id}:deactivate` | system_admin | `system_admin.manage` | system-admin domain | `SystemAdminDTO` | — | Idempotency-Key required |
| `POST` | `/system-admin/admins/{id}:reactivate` | system_admin | `system_admin.manage` | system-admin domain | `SystemAdminDTO` | — | Idempotency-Key required |
| `PUT` | `/system-admin/customers/{id}/priority` | system_admin | `system_admin.manage` | system-admin domain; single customer only | `PriorityCustomerStatusDTO` | — | Idempotency-Key required |
| `GET` | `/admin/pricing/ladder-sets` | employee | `pricing.manage` | admin scope | `AdminPricingDTO[]` | — | not required |
| `POST` | `/admin/pricing/ladder-sets` | employee | `pricing.manage` | admin scope | `AdminPricingDTO` | — | Idempotency-Key required |
| `PUT` | `/admin/pricing/ladder-sets/{id}/rules` | employee | `pricing.manage` | admin scope | `AdminPricingDTO` | — | Idempotency-Key required |
| `POST` | `/admin/pricing/ladder-sets/{id}:activate` | employee | `pricing.manage` | admin scope | `AdminPricingDTO` | — | Idempotency-Key required |
| `GET` | `/admin/notification-deliveries` | employee | `notification.read` | admin scope | `AdminNotificationDTO[]` | — | not required |
| `GET` | `/admin/feishu-bindings` | employee | `feishu.binding.manage` | admin scope | `AdminFeishuDTO[]` | — | not required |
| `POST` | `/admin/announcements/{id}:enable` | employee | `announcement.manage` | admin scope | `AdminAnnouncementDTO` | — | Idempotency-Key required |
| `POST` | `/admin/announcements/{id}:disable` | employee | `announcement.manage` | admin scope | `AdminAnnouncementDTO` | — | Idempotency-Key required |
| `GET` | `/admin/audit-logs` | employee | `audit.read` | admin scope | `MaskedAuditDTO[]` | — | not required |
| `GET` | `/admin/banners` | employee | `banner.manage` | admin scope | `AdminBannerDTO[]` | — | not required |
| `POST` | `/admin/banners` | employee | `banner.manage` | admin scope | `AdminBannerDTO` | — | Idempotency-Key required |
| `PATCH` | `/admin/banners/{id}` | employee | `banner.manage` | admin scope | `AdminBannerDTO` | — | Idempotency-Key required |
| `POST` | `/admin/banners/{id}:enable` | employee | `banner.manage` | admin scope | `AdminBannerDTO` | — | Idempotency-Key required |
| `POST` | `/admin/banners/{id}:disable` | employee | `banner.manage` | admin scope | `AdminBannerDTO` | — | Idempotency-Key required |
| `POST` | `/admin/banners:reorder` | employee | `banner.manage` | admin scope | `AdminBannerDTO` | — | Idempotency-Key required |
| `POST` | `/integrations/jyt/vehicles:upsert` | integration | `jyt.integration.ingest` | integration credential + source whitelist | `JytUpsertResultDTO` | — | Idempotency-Key required |
| `POST` | `/integrations/jyt/vehicles:offline-batch` | integration | `jyt.integration.ingest` | integration credential + source whitelist | `JytOfflineResultDTO` | — | Idempotency-Key required |
| `GET` | `/integrations/jyt/vehicles:active` | integration | `jyt.integration.ingest` | integration credential + source whitelist | `JytActiveVehicleDTO[]` | — | not required |
| `GET` | `/admin/employees` | employee | `employee.manage` | management scope | `AdminEmployeeDTO[]` | — | not required |
| `POST` | `/admin/employees` | employee | `employee.manage` | management scope | `AdminEmployeeDTO` | — | Idempotency-Key required |
| `PATCH` | `/admin/employees/{id}` | employee | `employee.manage` | management scope | `AdminEmployeeDTO` | — | Idempotency-Key required |
| `GET` | `/admin/roles` | employee | `employee.manage` | management scope | `RoleDTO[]` | — | not required |
| `PATCH` | `/admin/roles/{role_code}` | employee | `employee.manage` | management scope | `RoleDTO` | — | Idempotency-Key required |
| `GET` | `/admin/permissions` | employee | `permission.manage` | management scope | `PermissionDTO[]` | — | not required |
| `PATCH` | `/admin/permissions/{permission_code}` | employee | `permission.manage` | management scope | `PermissionDTO` | — | Idempotency-Key required |
| `GET` | `/admin/notification-config/sla` | employee | `notification.config.manage` | admin scope | `AdminConfigDTO` | — | not required |
| `PUT` | `/admin/notification-config/sla` | employee | `notification.config.manage` | admin scope | `AdminConfigDTO` | — | Idempotency-Key required |
| `GET` | `/admin/notification-config/quiet-hours` | employee | `notification.config.manage` | admin scope | `AdminConfigDTO` | — | not required |
| `PUT` | `/admin/notification-config/quiet-hours` | employee | `notification.config.manage` | admin scope | `AdminConfigDTO` | — | Idempotency-Key required |
| `GET` | `/admin/notification-config/lock-expiry-reminder` | employee | `notification.config.manage` | admin scope | `AdminConfigDTO` | — | not required |
| `PUT` | `/admin/notification-config/lock-expiry-reminder` | employee | `notification.config.manage` | admin scope | `AdminConfigDTO` | — | Idempotency-Key required |
| `GET` | `/admin/announcements` | employee | `announcement.manage` | admin scope | `AdminAnnouncementDTO[]` | — | not required |
| `POST` | `/admin/announcements` | employee | `announcement.manage` | admin scope | `AdminAnnouncementDTO` | — | Idempotency-Key required |
| `PATCH` | `/admin/announcements/{id}` | employee | `announcement.manage` | admin scope | `AdminAnnouncementDTO` | — | Idempotency-Key required |
| `POST` | `/auth/staff/session:exchange` | anonymous_or_staff | `auth.staff.session` | auth adapter | `AuthSessionDTO` | — | Idempotency-Key required |
| `GET` | `/auth/staff/context` | anonymous_or_staff | `auth.staff.session` | auth adapter | `AuthContextDTO` | — | not required |
| `POST` | `/auth/staff/session:revoke` | anonymous_or_staff | `auth.staff.session` | auth adapter | `AuthRevokeDTO` | — | Idempotency-Key required |
| `POST` | `/auth/system-admin/session:exchange` | anonymous_or_system_admin | `auth.system_admin.session` | auth adapter | `AuthSessionDTO` | — | Idempotency-Key required |
| `GET` | `/auth/system-admin/context` | anonymous_or_system_admin | `auth.system_admin.session` | auth adapter | `AuthContextDTO` | — | not required |
| `POST` | `/auth/system-admin/session:revoke` | anonymous_or_system_admin | `auth.system_admin.session` | auth adapter | `AuthRevokeDTO` | — | Idempotency-Key required |
| `GET` | `/admin/dashboard` | employee | `audit.read` | authorized admin aggregate scope | `AdminDashboardDTO` | — | not required |
| `GET` | `/admin/vehicles` | employee | `vehicle.read.internal` | vehicle/store/data scope | `AdminVehicleDTO[]` | `vin`→`vehicle.read.internal`<br>`internal.internal.internal_wholesale_price_cents`→`vehicle.internal_price.view`<br>`internal.internal.upstream_phone`→`vehicle.upstream_phone` | not required |
| `GET` | `/admin/vehicles/{id}` | employee | `vehicle.read.internal` | vehicle/store/data scope | `AdminVehicleDTO` | `vin`→`vehicle.read.internal`<br>`internal.internal.internal_wholesale_price_cents`→`vehicle.internal_price.view`<br>`internal.internal.upstream_phone`→`vehicle.upstream_phone` | not required |
| `GET` | `/admin/vehicles/{id}/history` | employee | `vehicle.read.internal` | vehicle/store/data scope | `AdminVehicleHistoryDTO` | — | not required |
| `GET` | `/admin/jyt/status` | employee | `jyt.integration.manage` | integration admin scope | `AdminJytDTO` | — | not required |
| `GET` | `/admin/integrations/collector/publisher-phone-cache` | employee | `integration.collector.manage` | admin integration scope | `PublisherPhoneCacheDTO[]` | — | not required |
| `GET` | `/admin/jyt/incidents` | employee | `jyt.integration.manage` | integration admin scope | `IncidentDTO[]` | — | not required |
| `GET` | `/admin/jyt/logs` | employee | `jyt.integration.manage` | integration admin scope | `IntegrationLogDTO[]` | — | not required |
| `GET` | `/admin/customers` | employee | `crm.customer.read` | admin data scope | `AdminCustomerDTO[]` | — | not required |
| `GET` | `/admin/customers/{id}` | employee | `crm.customer.read` | admin data scope | `AdminCustomerDTO` | — | not required |
| `GET` | `/admin/find-car/applications` | employee | `demand.read` | admin data scope | `FindCarApplicationDTO[]` | — | not required |
| `GET` | `/admin/demands` | employee | `demand.read` | admin data scope | `StaffDemandDTO[]` | — | not required |
| `GET` | `/admin/demands/{id}` | employee | `demand.read` | admin data scope | `StaffDemandDTO` | — | not required |
| `GET` | `/admin/consultations` | employee | `consultation.read` | admin data scope | `StaffConsultationDTO[]` | — | not required |
| `GET` | `/admin/locks` | employee | `lock.manage` | admin data scope | `LockDTO[]` | — | not required |
| `GET` | `/admin/waitlists` | employee | `waitlist.manage` | admin data scope | `WaitlistDTO[]` | — | not required |
| `GET` | `/admin/deposits` | employee | `funds.deposit.record` | admin data scope | `DepositReceiptDTO[]` | — | not required |
| `GET` | `/admin/transactions` | employee | `transaction.manage` | admin data scope | `TransactionDTO[]` | — | not required |
| `GET` | `/admin/refunds` | employee | `refund.manage` | admin data scope | `RefundDTO[]` | — | not required |
| `POST` | `/admin/transactions/{id}:correct` | employee | `transaction.correct` | completed transaction + authorized admin scope | `TransactionCorrectionDTO` | — | required |
| `GET` | `/admin/customer-levels` | employee | `pricing.manage` | pricing/entitlement admin scope | `CustomerLevelDTO[]` | — | not required |
| `GET` | `/admin/vehicle-price-overrides` | employee | `pricing.manage` | pricing admin scope | `PriceOverrideDTO[]` | — | not required |
| `PUT` | `/admin/feishu-bindings/{employee_id}` | employee | `feishu.binding.manage` | employee/admin scope | `AdminFeishuDTO` | — | required |
| `PUT` | `/admin/customers/{id}/level` | employee | `customer.level.manage` | admin customer data scope | `AdminCustomerDTO` | — | required |

**TOTAL_ENDPOINTS = 194**

AUTHORIZATION_MAP_EXECUTABLE = PASS

## CR-006 endpoint authorization

| Method | Path | Identity | Permission/capability | Scope | Projection | Idempotency |
|---|---|---|---|---|---|---|
| GET | `/customer/vehicle-catalog/brands` | customer | `customer.self` | customer-safe catalog | `VehicleBrandDTO[]` | not required |
| GET | `/customer/vehicle-catalog/brands/{brand_id}/series` | customer | `customer.self` | customer-safe catalog | `VehicleSeriesDTO[]` | not required |
| GET | `/customer/vehicle-catalog/series/{series_id}/models` | customer | `customer.self` | customer-safe catalog | `VehicleModelDTO[]` | not required |
| GET | `/staff/vehicle-catalog/brands` | employee | `vehicle.read.customer_safe` | staff catalog | `VehicleBrandDTO[]` | not required |
| GET | `/staff/vehicle-catalog/brands/{brand_id}/series` | employee | `vehicle.read.customer_safe` | staff catalog | `VehicleSeriesDTO[]` | not required |
| GET | `/staff/vehicle-catalog/series/{series_id}/models` | employee | `vehicle.read.customer_safe` | staff catalog | `VehicleModelDTO[]` | not required |
| GET | `/admin/vehicle-model-match-cases` | employee | `vehicle.model.manage` | model-master admin | `VehicleModelMatchCasePageDTO` | not required |
| GET | `/admin/vehicle-model-match-cases/{case_id}` | employee | `vehicle.model.manage` | model-master admin | `VehicleModelMatchCaseDTO` | not required |
| POST | `/admin/vehicle-model-match-cases/{case_id}:bind-existing` | employee | `vehicle.model.manage` | model-master admin | `VehicleModelMatchResolutionDTO` | Idempotency-Key required |
| POST | `/admin/vehicle-model-match-cases/{case_id}:create-and-bind` | employee | `vehicle.model.manage` | model-master admin | `VehicleModelMatchResolutionDTO` | Idempotency-Key required |
| POST | `/admin/vehicle-models` | employee | `vehicle.model.manage` | model-master admin | `VehicleModelDTO` | Idempotency-Key required |
| PATCH | `/admin/vehicle-models/{model_id}` | employee | `vehicle.model.manage` | model-master admin | `VehicleModelDTO` | Idempotency-Key required |
| GET | `/admin/vehicle-model-field-conflicts` | employee | `vehicle.model.manage` | model-master admin | `VehicleModelFieldConflictPageDTO` | not required |
| POST | `/admin/vehicle-model-field-conflicts/{conflict_id}:resolve` | employee | `vehicle.model.manage` | model-master admin | `VehicleModelFieldConflictDTO` | Idempotency-Key required |

### CR-006 hierarchy/report closure

| Method | Path | Identity | Permission | Scope | Projection | Idempotency |
|---|---|---|---|---|---|---|
| POST | `/admin/vehicle-brands` | employee | `vehicle.model.manage` | model-master admin | `VehicleBrandDTO` | Idempotency-Key required |
| POST | `/admin/vehicle-series` | employee | `vehicle.model.manage` | model-master admin | `VehicleSeriesDTO` | Idempotency-Key required |
| GET | `/admin/vehicle-models` | employee | `vehicle.model.manage` | model-master admin | `VehicleModelPageDTO` | not required |
| PATCH | `/admin/employees/{id}/report-preferences` | employee | `notification.config.manage` | notification/admin scope | `EmployeeReportPreferencesDTO` | Idempotency-Key required |

### Current source-data and Collector phone boundary

| Method | Path | Identity | Permission | Scope | Projection | Idempotency |
|---|---|---|---|---|---|---|
| GET | `/staff/vehicles/{id}/source-data` | employee | `vehicle.edit` | vehicle scope; sensitive fields separately filtered | `StaffVehicleSourceDataDTO` | not required |
| GET | `/admin/integrations/collector/connection` | employee | `integration.collector.manage` | admin integration scope | `CollectorConnectionConfigDTO` | not required |
| PATCH | `/admin/integrations/collector/connection` | employee | `integration.collector.manage` | admin integration scope | `CollectorConnectionConfigDTO` | not required |
| POST | `/admin/integrations/collector/connection:test` | employee | `integration.collector.manage` | admin integration scope | `CollectorConnectionTestResult` | not required |
| POST | `/integrations/jyt/vehicle-prices` | service | service credential + source allowlist | Collector/JYT integration scope | `JytVehiclePriceBatchResult` | Idempotency-Key required |
