# W07_DEMAND_MATCHING — OpenAPI Operation Manifest

Generated from current .10 CR-007 operation-index. **Count: 23**.

| Method | Path | operationId | Identity | Permission/Capability | Scope | Projection | Idempotency |
|---|---|---|---|---|---|---|---|
| `GET` | `/admin/demands` | `get_admin_demands` | `employee` | `demand.read` | admin data scope | `StaffDemandDTO[]` | not required |
| `GET` | `/admin/demands/{id}` | `get_admin_demands_id` | `employee` | `demand.read` | admin data scope | `StaffDemandDTO` | not required |
| `GET` | `/admin/find-car/applications` | `get_admin_find_car_applications` | `employee` | `demand.read` | admin data scope | `FindCarApplicationDTO[]` | not required |
| `GET` | `/customer/demands/{id}` | `get_customer_demands_id` | `customer` | `customer.self` | customer-safe visibility; public discovery excludes hidden vehicles; direct detail may use active recommendation-derived grant or active Lock/Transaction business access; active Priority additionally requires target customer + active Recommendation + active grant | `DemandDTO` | not required |
| `POST` | `/customer/find-car/applications` | `post_customer_find_car_applications` | `customer` | `customer.self` | customer-safe visibility; public discovery excludes hidden vehicles; direct detail may use active recommendation-derived grant or active Lock/Transaction business access; active Priority additionally requires target customer + active Recommendation + active grant | `FindCarApplicationDTO` | not required |
| `GET` | `/customer/find-car/applications/{id}` | `get_customer_find_car_applications_id` | `customer` | `customer.self` | customer-safe visibility; public discovery excludes hidden vehicles; direct detail may use active recommendation-derived grant or active Lock/Transaction business access; active Priority additionally requires target customer + active Recommendation + active grant | `FindCarApplicationDTO` | not required |
| `PATCH` | `/customer/find-car/applications/{id}` | `patch_customer_find_car_applications_id` | `customer` | `customer.self` | customer-safe visibility; public discovery excludes hidden vehicles; direct detail may use active recommendation-derived grant or active Lock/Transaction business access; active Priority additionally requires target customer + active Recommendation + active grant | `FindCarApplicationDTO` | not required |
| `GET` | `/customer/find-car/workspace` | `get_customer_find_car_workspace` | `customer` | `customer.self` | customer-safe visibility; public discovery excludes hidden vehicles; direct detail may use active recommendation-derived grant or active Lock/Transaction business access; active Priority additionally requires target customer + active Recommendation + active grant | `FindCarDTO` | not required |
| `GET` | `/staff/demands` | `get_staff_demands` | `employee` | `demand.read` | responsibility/data scope | `StaffDemandDTO` | not required |
| `GET` | `/staff/demands/{id}` | `get_staff_demands_id` | `employee` | `demand.read` | responsibility/data scope | `StaffDemandDTO` | not required |
| `PUT` | `/staff/demands/{id}/match-description` | `put_staff_demands_id_match_description` | `employee` | `demand.manage` | responsibility/data scope | `StaffDemandDTO` | Idempotency-Key required |
| `GET` | `/staff/demands/{id}/matches` | `get_staff_demands_id_matches` | `employee` | `demand.read` | responsibility/data scope | `DemandMatchDTO[]` | not required |
| `PATCH` | `/staff/demands/{id}/note` | `patch_staff_demands_id_note` | `employee` | `demand.manage` | responsibility/data scope | `StaffDemandDTO` | Idempotency-Key required |
| `POST` | `/staff/demands/{id}:cancel` | `post_staff_demands_id_cancel` | `employee` | `demand.manage` | responsibility/data scope | `StaffDemandDTO` | Idempotency-Key required |
| `POST` | `/staff/demands/{id}:complete` | `post_staff_demands_id_complete` | `employee` | `demand.manage` | responsibility/data scope | `StaffDemandDTO` | Idempotency-Key required |
| `POST` | `/staff/demands/{id}:pause` | `post_staff_demands_id_pause` | `employee` | `demand.manage` | responsibility/data scope | `StaffDemandDTO` | Idempotency-Key required |
| `POST` | `/staff/demands/{id}:reassign` | `post_staff_demands_id_reassign` | `employee` | `demand.manage` | responsibility/data scope | `StaffDemandDTO` | Idempotency-Key required |
| `POST` | `/staff/demands/{id}:resume` | `post_staff_demands_id_resume` | `employee` | `demand.manage` | responsibility/data scope | `StaffDemandDTO` | Idempotency-Key required |
| `GET` | `/staff/find-car/applications` | `get_staff_find_car_applications` | `employee` | `demand.read` | responsibility/data scope | `FindCarApplicationDTO[]` | not required |
| `GET` | `/staff/find-car/applications/{id}` | `get_staff_find_car_applications_id` | `employee` | `demand.read` | responsibility/data scope | `FindCarApplicationDTO` | not required |
| `POST` | `/staff/find-car/applications/{id}:activate` | `post_staff_find_car_applications_id_activate` | `employee` | `demand.manage` | responsibility/data scope | `FindCarActivationDTO` | Idempotency-Key required |
| `POST` | `/staff/find-car/applications/{id}:close` | `post_staff_find_car_applications_id_close` | `employee` | `demand.manage` | responsibility/data scope | `FindCarApplicationDTO` | Idempotency-Key required |
| `POST` | `/staff/matching/priorities/{id}:release` | `post_staff_matching_priorities_id_release` | `employee` | `recommendation.create` | current responsible customer + active Priority; no manual transfer or override | `none` | Idempotency-Key required |

Generated engineering routing only; product authority remains the independent FINAL_DEV_READY .10 mother copy.
