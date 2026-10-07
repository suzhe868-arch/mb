# W01_FOUNDATION — OpenAPI Operation Manifest

Generated from current .10 CR-007 operation-index. **Count: 15**.

| Method | Path | operationId | Identity | Permission/Capability | Scope | Projection | Idempotency |
|---|---|---|---|---|---|---|---|
| `GET` | `/auth/staff/context` | `get_auth_staff_context` | `anonymous_or_staff` | `auth.staff.session` | auth adapter | `AuthContextDTO` | not required |
| `POST` | `/auth/staff/session:exchange` | `post_auth_staff_session_exchange` | `anonymous_or_staff` | `auth.staff.session` | auth adapter | `AuthSessionDTO` | Idempotency-Key required |
| `POST` | `/auth/staff/session:revoke` | `post_auth_staff_session_revoke` | `anonymous_or_staff` | `auth.staff.session` | auth adapter | `AuthRevokeDTO` | Idempotency-Key required |
| `GET` | `/auth/system-admin/context` | `get_auth_system_admin_context` | `anonymous_or_system_admin` | `auth.system_admin.session` | auth adapter | `AuthContextDTO` | not required |
| `POST` | `/auth/system-admin/session:exchange` | `post_auth_system_admin_session_exchange` | `anonymous_or_system_admin` | `auth.system_admin.session` | auth adapter | `AuthSessionDTO` | Idempotency-Key required |
| `POST` | `/auth/system-admin/session:revoke` | `post_auth_system_admin_session_revoke` | `anonymous_or_system_admin` | `auth.system_admin.session` | auth adapter | `AuthRevokeDTO` | Idempotency-Key required |
| `GET` | `/integrations/jyt/vehicles:active` | `get_integrations_jyt_vehicles_active` | `integration` | `jyt.integration.ingest` | integration credential + source whitelist | `JytActiveVehicleDTO[]` | not required |
| `POST` | `/integrations/jyt/vehicles:offline-batch` | `post_integrations_jyt_vehicles_offline_batch` | `integration` | `jyt.integration.ingest` | integration credential + source whitelist | `JytOfflineResultDTO` | Idempotency-Key required |
| `POST` | `/integrations/jyt/vehicles:upsert` | `post_integrations_jyt_vehicles_upsert` | `integration` | `jyt.integration.ingest` | integration credential + source whitelist | `JytUpsertResultDTO` | Idempotency-Key required |
| `GET` | `/system-admin/admins` | `get_system_admin_admins` | `system_admin` | `system_admin.manage` | system-admin domain | `SystemAdminDTO[]` | not required |
| `POST` | `/system-admin/admins` | `post_system_admin_admins` | `system_admin` | `system_admin.manage` | system-admin domain | `SystemAdminDTO` | Idempotency-Key required |
| `PATCH` | `/system-admin/admins/{id}/permissions` | `patch_system_admin_admins_id_permissions` | `system_admin` | `system_admin.manage` | system-admin domain | `SystemAdminDTO` | Idempotency-Key required |
| `POST` | `/system-admin/admins/{id}:deactivate` | `post_system_admin_admins_id_deactivate` | `system_admin` | `system_admin.manage` | system-admin domain | `SystemAdminDTO` | Idempotency-Key required |
| `POST` | `/system-admin/admins/{id}:reactivate` | `post_system_admin_admins_id_reactivate` | `system_admin` | `system_admin.manage` | system-admin domain | `SystemAdminDTO` | Idempotency-Key required |
| `PUT` | `/system-admin/customers/{id}/priority` | `put_system_admin_customers_id_priority` | `system_admin` | `system_admin.manage` | system-admin domain; single customer only | `PriorityCustomerStatusDTO` | Idempotency-Key required |

Generated engineering routing only; product authority remains the independent FINAL_DEV_READY .10 mother copy.
