# W09_LOCK_WAITLIST — OpenAPI Operation Manifest

Generated from current .10 CR-007 operation-index. **Count: 19**.

| Method | Path | operationId | Identity | Permission/Capability | Scope | Projection | Idempotency |
|---|---|---|---|---|---|---|---|
| `GET` | `/admin/locks` | `get_admin_locks` | `employee` | `lock.manage` | admin data scope | `LockDTO[]` | not required |
| `GET` | `/admin/waitlists` | `get_admin_waitlists` | `employee` | `waitlist.manage` | admin data scope | `WaitlistDTO[]` | not required |
| `GET` | `/customer/me/locks` | `get_customer_me_locks` | `customer` | `customer.self` | customer-safe visibility; public discovery excludes hidden vehicles; direct detail may use active recommendation-derived grant or active Lock/Transaction business access; active Priority additionally requires target customer + active Recommendation + active grant | `CustomerLockDTO[]` | not required |
| `GET` | `/customer/me/waitlists` | `get_customer_me_waitlists` | `customer` | `customer.self` | customer-safe visibility; public discovery excludes hidden vehicles; direct detail may use active recommendation-derived grant or active Lock/Transaction business access; active Priority additionally requires target customer + active Recommendation + active grant | `CustomerWaitlistDTO[]` | not required |
| `POST` | `/customer/vehicles/{vehicle_id}/waitlist` | `post_customer_vehicles_vehicle_id_waitlist` | `customer` | `customer.self` | customer-safe visibility; public discovery excludes hidden vehicles; direct detail may use active recommendation-derived grant or active Lock/Transaction business access; active Priority additionally requires target customer + active Recommendation + active grant | `CustomerWaitlistDTO` | not required |
| `GET` | `/staff/locks` | `get_staff_locks` | `employee` | `lock.manage` | customer/vehicle/responsibility scope | `LockDTO[]` | not required |
| `POST` | `/staff/locks` | `post_staff_locks` | `employee` | `lock.create` | customer/vehicle/responsibility scope | `LockDTO` | Idempotency-Key required |
| `GET` | `/staff/locks/{id}` | `get_staff_locks_id` | `employee` | `lock.manage` | customer/vehicle/responsibility scope | `LockDTO` | not required |
| `GET` | `/staff/locks/{id}/deposits` | `get_staff_locks_id_deposits` | `employee` | `lock.manage` | customer/vehicle/responsibility scope | `DepositReceiptDTO[]` | not required |
| `POST` | `/staff/locks/{id}/deposits` | `post_staff_locks_id_deposits` | `employee` | `funds.deposit.record` | customer/vehicle/responsibility scope | `DepositReceiptDTO` | Idempotency-Key required |
| `PATCH` | `/staff/locks/{id}/expires-at` | `patch_staff_locks_id_expires_at` | `employee` | `lock.manage` | customer/vehicle/responsibility scope | `LockDTO` | Idempotency-Key required |
| `POST` | `/staff/locks/{id}:reassign` | `post_staff_locks_id_reassign` | `employee` | `lock.manage` | customer/vehicle/responsibility scope | `LockDTO` | Idempotency-Key required |
| `POST` | `/staff/locks/{id}:release` | `post_staff_locks_id_release` | `employee` | `lock.manage` | customer/vehicle/responsibility scope | `LockDTO` | Idempotency-Key required |
| `POST` | `/staff/locks/{lock_id}/transaction` | `post_staff_locks_lock_id_transaction` | `employee` | `transaction.manage` | customer/vehicle/responsibility scope | `TransactionDTO` | Idempotency-Key required |
| `GET` | `/staff/waitlists` | `get_staff_waitlists` | `employee` | `waitlist.manage` | customer/vehicle/responsibility scope | `WaitlistDTO[]` | not required |
| `POST` | `/staff/waitlists` | `post_staff_waitlists` | `employee` | `waitlist.manage` | customer/vehicle/responsibility scope | `WaitlistDTO` | Idempotency-Key required |
| `GET` | `/staff/waitlists/{id}` | `get_staff_waitlists_id` | `employee` | `waitlist.manage` | customer/vehicle/responsibility scope | `WaitlistDTO` | not required |
| `POST` | `/staff/waitlists/{id}:end` | `post_staff_waitlists_id_end` | `employee` | `waitlist.manage` | customer/vehicle/responsibility scope | `WaitlistDTO` | Idempotency-Key required |
| `POST` | `/staff/waitlists/{id}:reassign` | `post_staff_waitlists_id_reassign` | `employee` | `waitlist.manage` | customer/vehicle/responsibility scope | `WaitlistDTO` | Idempotency-Key required |

Generated engineering routing only; product authority remains the independent FINAL_DEV_READY .10 mother copy.
