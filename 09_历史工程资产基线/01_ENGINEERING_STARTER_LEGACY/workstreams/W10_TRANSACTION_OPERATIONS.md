# W10_TRANSACTION — OpenAPI Operation Manifest

Generated from current .10 CR-007 operation-index. **Count: 14**.

| Method | Path | operationId | Identity | Permission/Capability | Scope | Projection | Idempotency |
|---|---|---|---|---|---|---|---|
| `GET` | `/admin/deposits` | `get_admin_deposits` | `employee` | `funds.deposit.record` | admin data scope | `DepositReceiptDTO[]` | not required |
| `GET` | `/admin/refunds` | `get_admin_refunds` | `employee` | `refund.manage` | admin data scope | `RefundDTO[]` | not required |
| `GET` | `/admin/transactions` | `get_admin_transactions` | `employee` | `transaction.manage` | admin data scope | `TransactionDTO[]` | not required |
| `POST` | `/admin/transactions/{id}:correct` | `post_admin_transactions_id_correct` | `employee` | `transaction.correct` | completed transaction + authorized admin scope | `TransactionCorrectionDTO` | required |
| `GET` | `/customer/me/transactions` | `get_customer_me_transactions` | `customer` | `customer.self` | customer-safe visibility; public discovery excludes hidden vehicles; direct detail may use active recommendation-derived grant or active Lock/Transaction business access; active Priority additionally requires target customer + active Recommendation + active grant | `CustomerTransactionDTO[]` | not required |
| `GET` | `/customer/me/transactions/{id}` | `get_customer_me_transactions_id` | `customer` | `customer.self` | customer-safe visibility; public discovery excludes hidden vehicles; direct detail may use active recommendation-derived grant or active Lock/Transaction business access; active Priority additionally requires target customer + active Recommendation + active grant | `CustomerTransactionDTO` | not required |
| `POST` | `/staff/refunds` | `post_staff_refunds` | `employee` | `refund.manage` | customer/refund-subject scope | `RefundDTO` | Idempotency-Key required |
| `GET` | `/staff/refunds/{id}` | `get_staff_refunds_id` | `employee` | `refund.manage` | customer/refund-subject scope | `RefundDTO` | not required |
| `POST` | `/staff/refunds/{id}/payments` | `post_staff_refunds_id_payments` | `employee` | `refund.manage` | customer/refund-subject scope | `RefundDTO` | Idempotency-Key required |
| `GET` | `/staff/transactions` | `get_staff_transactions` | `employee` | `transaction.manage` | transaction responsibility scope | `TransactionDTO[]` | not required |
| `GET` | `/staff/transactions/{id}` | `get_staff_transactions_id` | `employee` | `transaction.manage` | transaction responsibility scope | `TransactionDTO` | not required |
| `POST` | `/staff/transactions/{id}:cancel` | `post_staff_transactions_id_cancel` | `employee` | `transaction.manage` | transaction responsibility scope | `TransactionDTO` | Idempotency-Key required |
| `POST` | `/staff/transactions/{id}:complete` | `post_staff_transactions_id_complete` | `employee` | `transaction.manage` | transaction responsibility scope | `TransactionDTO` | Idempotency-Key required |
| `POST` | `/staff/transactions/{id}:reassign` | `post_staff_transactions_id_reassign` | `employee` | `transaction.manage` | transaction responsibility scope | `TransactionDTO` | Idempotency-Key required |

Generated engineering routing only; product authority remains the independent FINAL_DEV_READY .10 mother copy.
