# W08_CONSULTATION — OpenAPI Operation Manifest

Generated from current .10 CR-007 operation-index. **Count: 9**.

| Method | Path | operationId | Identity | Permission/Capability | Scope | Projection | Idempotency |
|---|---|---|---|---|---|---|---|
| `GET` | `/admin/consultations` | `get_admin_consultations` | `employee` | `consultation.read` | admin data scope | `StaffConsultationDTO[]` | not required |
| `GET` | `/customer/me/consultations` | `get_customer_me_consultations` | `customer` | `customer.self` | customer-safe visibility; public discovery excludes hidden vehicles; direct detail may use active recommendation-derived grant or active Lock/Transaction business access; active Priority additionally requires target customer + active Recommendation + active grant | `CustomerConsultationDTO[]` | not required |
| `POST` | `/customer/vehicles/{vehicle_id}/consultations` | `post_customer_vehicles_vehicle_id_consultations` | `customer` | `customer.self` | customer-safe visibility; public discovery excludes hidden vehicles; direct detail may use active recommendation-derived grant or active Lock/Transaction business access; active Priority additionally requires target customer + active Recommendation + active grant | `CustomerConsultationDTO` | not required |
| `GET` | `/staff/consultations` | `get_staff_consultations` | `employee` | `consultation.read` | responsibility/data scope | `StaffConsultationDTO[]` | not required |
| `GET` | `/staff/consultations/{id}` | `get_staff_consultations_id` | `employee` | `consultation.read` | responsibility/data scope | `StaffConsultationDTO` | not required |
| `POST` | `/staff/consultations/{id}:invalidate` | `post_staff_consultations_id_invalidate` | `employee` | `consultation.manage` | responsibility/data scope | `StaffConsultationDTO` | Idempotency-Key required |
| `POST` | `/staff/consultations/{id}:reassign` | `post_staff_consultations_id_reassign` | `employee` | `consultation.manage` | responsibility/data scope | `StaffConsultationDTO` | Idempotency-Key required |
| `POST` | `/staff/consultations/{id}:resolve` | `post_staff_consultations_id_resolve` | `employee` | `consultation.manage` | responsibility/data scope | `StaffConsultationDTO` | Idempotency-Key required |
| `POST` | `/staff/consultations/{id}:start-processing` | `post_staff_consultations_id_start_processing` | `employee` | `consultation.manage` | responsibility/data scope | `StaffConsultationDTO` | Idempotency-Key required |

Generated engineering routing only; product authority remains the independent FINAL_DEV_READY .10 mother copy.
