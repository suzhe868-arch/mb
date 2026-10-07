# W13_ADMIN_UI — OpenAPI Operation Manifest

Generated from current .10 CR-007 operation-index. **Count: 40**.

| Method | Path | operationId | Identity | Permission/Capability | Scope | Projection | Idempotency |
|---|---|---|---|---|---|---|---|
| `GET` | `/admin/announcements` | `get_admin_announcements` | `employee` | `announcement.manage` | admin scope | `AdminAnnouncementDTO[]` | not required |
| `POST` | `/admin/announcements` | `post_admin_announcements` | `employee` | `announcement.manage` | admin scope | `AdminAnnouncementDTO` | Idempotency-Key required |
| `PATCH` | `/admin/announcements/{id}` | `patch_admin_announcements_id` | `employee` | `announcement.manage` | admin scope | `AdminAnnouncementDTO` | Idempotency-Key required |
| `POST` | `/admin/announcements/{id}:disable` | `post_admin_announcements_id_disable` | `employee` | `announcement.manage` | admin scope | `AdminAnnouncementDTO` | Idempotency-Key required |
| `POST` | `/admin/announcements/{id}:enable` | `post_admin_announcements_id_enable` | `employee` | `announcement.manage` | admin scope | `AdminAnnouncementDTO` | Idempotency-Key required |
| `GET` | `/admin/audit-logs` | `get_admin_audit_logs` | `employee` | `audit.read` | admin scope | `MaskedAuditDTO[]` | not required |
| `GET` | `/admin/banners` | `get_admin_banners` | `employee` | `banner.manage` | admin scope | `AdminBannerDTO[]` | not required |
| `POST` | `/admin/banners` | `post_admin_banners` | `employee` | `banner.manage` | admin scope | `AdminBannerDTO` | Idempotency-Key required |
| `PATCH` | `/admin/banners/{id}` | `patch_admin_banners_id` | `employee` | `banner.manage` | admin scope | `AdminBannerDTO` | Idempotency-Key required |
| `POST` | `/admin/banners/{id}:disable` | `post_admin_banners_id_disable` | `employee` | `banner.manage` | admin scope | `AdminBannerDTO` | Idempotency-Key required |
| `POST` | `/admin/banners/{id}:enable` | `post_admin_banners_id_enable` | `employee` | `banner.manage` | admin scope | `AdminBannerDTO` | Idempotency-Key required |
| `POST` | `/admin/banners:reorder` | `post_admin_banners_reorder` | `employee` | `banner.manage` | admin scope | `AdminBannerDTO` | Idempotency-Key required |
| `POST` | `/admin/business-reassignments` | `post_admin_business_reassignments` | `employee` | `employee.manage` | management scope | `BusinessReassignmentDTO` | Idempotency-Key required |
| `GET` | `/admin/customer-levels` | `get_admin_customer_levels` | `employee` | `pricing.manage` | pricing/entitlement admin scope | `CustomerLevelDTO[]` | not required |
| `POST` | `/admin/customers/{id}:reassign-owner` | `post_admin_customers_id_reassign_owner` | `employee` | `crm.owner.reassign` | management customer scope + protection | `AdminCustomerDTO` | Idempotency-Key required |
| `GET` | `/admin/dashboard` | `get_admin_dashboard` | `employee` | `audit.read` | authorized admin aggregate scope | `AdminDashboardDTO` | not required |
| `GET` | `/admin/feishu-bindings` | `get_admin_feishu_bindings` | `employee` | `feishu.binding.manage` | admin scope | `AdminFeishuDTO[]` | not required |
| `PUT` | `/admin/feishu-bindings/{employee_id}` | `put_admin_feishu_bindings_employee_id` | `employee` | `feishu.binding.manage` | employee/admin scope | `AdminFeishuDTO` | required |
| `POST` | `/admin/handover-batches` | `post_admin_handover_batches` | `employee` | `employee.manage` | management scope | `HandoverBatchDTO` | Idempotency-Key required |
| `GET` | `/admin/handover-batches/{id}` | `get_admin_handover_batches_id` | `employee` | `employee.manage` | management scope | `HandoverBatchDTO` | not required |
| `POST` | `/admin/handover-batches/{id}:assign-customers` | `post_admin_handover_batches_id_assign_customers` | `employee` | `employee.manage` | management scope | `HandoverBatchDTO` | Idempotency-Key required |
| `GET` | `/admin/matching-rules` | `get_admin_matching_rules` | `employee` | `matching.rule.manage` | admin scope | `MatchingRuleDTO[]` | not required |
| `POST` | `/admin/matching-rules` | `post_admin_matching_rules` | `employee` | `matching.rule.manage` | admin scope | `MatchingRuleDTO` | Idempotency-Key required |
| `PATCH` | `/admin/matching-rules/{id}` | `patch_admin_matching_rules_id` | `employee` | `matching.rule.manage` | admin scope | `MatchingRuleDTO` | Idempotency-Key required |
| `POST` | `/admin/matching-rules:test` | `post_admin_matching_rules_test` | `employee` | `matching.rule.manage` | admin scope | `MatchingRuleTestResultDTO` | Idempotency-Key required |
| `GET` | `/admin/notification-config/lock-expiry-reminder` | `get_admin_notification_config_lock_expiry_reminder` | `employee` | `notification.config.manage` | admin scope | `AdminConfigDTO` | not required |
| `PUT` | `/admin/notification-config/lock-expiry-reminder` | `put_admin_notification_config_lock_expiry_reminder` | `employee` | `notification.config.manage` | admin scope | `AdminConfigDTO` | Idempotency-Key required |
| `GET` | `/admin/notification-config/quiet-hours` | `get_admin_notification_config_quiet_hours` | `employee` | `notification.config.manage` | admin scope | `AdminConfigDTO` | not required |
| `PUT` | `/admin/notification-config/quiet-hours` | `put_admin_notification_config_quiet_hours` | `employee` | `notification.config.manage` | admin scope | `AdminConfigDTO` | Idempotency-Key required |
| `GET` | `/admin/notification-config/sla` | `get_admin_notification_config_sla` | `employee` | `notification.config.manage` | admin scope | `AdminConfigDTO` | not required |
| `PUT` | `/admin/notification-config/sla` | `put_admin_notification_config_sla` | `employee` | `notification.config.manage` | admin scope | `AdminConfigDTO` | Idempotency-Key required |
| `GET` | `/admin/notification-deliveries` | `get_admin_notification_deliveries` | `employee` | `notification.read` | admin scope | `AdminNotificationDTO[]` | not required |
| `GET` | `/admin/pricing/ladder-sets` | `get_admin_pricing_ladder_sets` | `employee` | `pricing.manage` | admin scope | `AdminPricingDTO[]` | not required |
| `POST` | `/admin/pricing/ladder-sets` | `post_admin_pricing_ladder_sets` | `employee` | `pricing.manage` | admin scope | `AdminPricingDTO` | Idempotency-Key required |
| `PUT` | `/admin/pricing/ladder-sets/{id}/rules` | `put_admin_pricing_ladder_sets_id_rules` | `employee` | `pricing.manage` | admin scope | `AdminPricingDTO` | Idempotency-Key required |
| `POST` | `/admin/pricing/ladder-sets/{id}:activate` | `post_admin_pricing_ladder_sets_id_activate` | `employee` | `pricing.manage` | admin scope | `AdminPricingDTO` | Idempotency-Key required |
| `POST` | `/admin/public-pool/customers/{id}:put` | `post_admin_public_pool_customers_id_put` | `employee` | `crm.public_pool.manage` | management customer scope + protection | `AdminCustomerDTO` | Idempotency-Key required |
| `GET` | `/admin/roles` | `get_admin_roles` | `employee` | `employee.manage` | management scope | `RoleDTO[]` | not required |
| `PATCH` | `/admin/roles/{role_code}` | `patch_admin_roles_role_code` | `employee` | `employee.manage` | management scope | `RoleDTO` | Idempotency-Key required |
| `GET` | `/admin/vehicle-price-overrides` | `get_admin_vehicle_price_overrides` | `employee` | `pricing.manage` | pricing admin scope | `PriceOverrideDTO[]` | not required |

Generated engineering routing only; product authority remains the independent FINAL_DEV_READY .10 mother copy.
