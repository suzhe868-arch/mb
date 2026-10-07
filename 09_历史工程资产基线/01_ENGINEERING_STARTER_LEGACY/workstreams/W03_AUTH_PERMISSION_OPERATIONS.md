# W03_AUTH_PERMISSION — OpenAPI Operation Manifest

Generated from current .10 CR-007 operation-index. **Count: 21**.

| Method | Path | operationId | Identity | Permission/Capability | Scope | Projection | Idempotency |
|---|---|---|---|---|---|---|---|
| `GET` | `/admin/employees` | `get_admin_employees` | `employee` | `employee.manage` | management scope | `AdminEmployeeDTO[]` | not required |
| `POST` | `/admin/employees` | `post_admin_employees` | `employee` | `employee.manage` | management scope | `AdminEmployeeDTO` | Idempotency-Key required |
| `PATCH` | `/admin/employees/{id}` | `patch_admin_employees_id` | `employee` | `employee.manage` | management scope | `AdminEmployeeDTO` | Idempotency-Key required |
| `PUT` | `/admin/employees/{id}/data-scope` | `put_admin_employees_id_data_scope` | `employee` | `permission.manage` | management scope | `AdminEmployeeDTO` | Idempotency-Key required |
| `PUT` | `/admin/employees/{id}/permission-overrides` | `put_admin_employees_id_permission_overrides` | `employee` | `permission.manage` | management scope | `AdminEmployeeDTO` | Idempotency-Key required |
| `PATCH` | `/admin/employees/{id}/receiving` | `patch_admin_employees_id_receiving` | `employee` | `employee.manage` | management scope | `AdminEmployeeDTO` | Idempotency-Key required |
| `POST` | `/admin/employees/{id}:deactivate` | `post_admin_employees_id_deactivate` | `employee` | `employee.manage` | management scope | `AdminEmployeeDTO` | Idempotency-Key required |
| `POST` | `/admin/employees/{id}:reactivate` | `post_admin_employees_id_reactivate` | `employee` | `employee.manage` | management scope | `AdminEmployeeDTO` | Idempotency-Key required |
| `GET` | `/admin/permissions` | `get_admin_permissions` | `employee` | `permission.manage` | management scope | `PermissionDTO[]` | not required |
| `PATCH` | `/admin/permissions/{permission_code}` | `patch_admin_permissions_permission_code` | `employee` | `permission.manage` | management scope | `PermissionDTO` | Idempotency-Key required |
| `GET` | `/staff/business-timeline` | `get_staff_business_timeline` | `employee` | `crm.customer.read` | customer/business scope | `TimelineDTO` | not required |
| `POST` | `/staff/demand-matches/{match_id}:recommend` | `post_staff_demand_matches_match_id_recommend` | `employee` | `demand.manage` | responsibility/data scope | `RecommendationDTO` | Idempotency-Key required |
| `POST` | `/staff/demand-matches/{match_id}:reject` | `post_staff_demand_matches_match_id_reject` | `employee` | `demand.manage` | responsibility/data scope | `DemandMatchDTO` | Idempotency-Key required |
| `GET` | `/staff/me` | `get_staff_me` | `employee` | `auth.staff.session` | current employee self only | `StaffSelfDTO` | not required |
| `GET` | `/staff/radar` | `get_staff_radar` | `employee` | `demand.read` | responsibility/data scope | `RadarEventDTO[]` | not required |
| `GET` | `/staff/radar/events/{id}` | `get_staff_radar_events_id` | `employee` | `demand.read` | responsibility/data scope | `RadarEventDTO` | not required |
| `POST` | `/staff/recommendations` | `post_staff_recommendations` | `employee` | `recommendation.create` | customer scope + vehicle state | `RecommendationDTO` | Idempotency-Key required |
| `POST` | `/staff/recommendations/{id}:cancel` | `post_staff_recommendations_id_cancel` | `employee` | `recommendation.create` | current recommender/responsible customer scope + active recommendation | `RecommendationDTO` | Idempotency-Key required |
| `GET` | `/staff/workbench` | `get_staff_workbench` | `employee` | `auth.staff.session` | authenticated employee shell; server-filtered by linked-object permission + data scope | `WorkbenchDTO` | not required |
| `GET` | `/staff/workbench/opportunities` | `get_staff_workbench_opportunities` | `employee` | `crm.customer.read` | customer data scope; 4S default denied/hidden | `CustomerOpportunityDTO[]` | not required |
| `GET` | `/staff/workbench/todos` | `get_staff_workbench_todos` | `employee` | `auth.staff.session` | authenticated employee shell; server-filtered by linked-object permission + data scope | `WorkbenchTodoDTO[]` | not required |

Generated engineering routing only; product authority remains the independent FINAL_DEV_READY .10 mother copy.
