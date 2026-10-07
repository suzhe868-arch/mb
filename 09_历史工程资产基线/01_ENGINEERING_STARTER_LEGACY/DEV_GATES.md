# DEV GATES

| Gate | Exit condition |
|---|---|
| DEV-GATE-00 | baseline checksum + authorization contract preflight PASS |
| DEV-GATE-01 | repository/foundation builds; health + error/auth base tests PASS |
| DEV-GATE-02 | PostgreSQL schema/migrations apply cleanly on empty DB and migration replay is safe |
| DEV-GATE-03 | auth/RBAC/data-scope test matrix PASS; SystemAdmin separation PASS |
| DEV-GATE-04 | vehicle + customer core API/DB contract tests PASS |
| DEV-GATE-05 | demand/matching/consultation PASS |
| DEV-GATE-06 | lock/waitlist/transaction/refund concurrency and recovery PASS |
| DEV-GATE-07 | customer/staff mini-program integration PASS |
| DEV-GATE-08 | PC admin + notification/integration PASS |
| DEV-GATE-09 | full traceability E2E/regression/security PASS |
| DEV-GATE-10 | release candidate, rollback/backup/ops runbook PASS |

A gate may be PARTIAL only while downstream work is explicitly blocked from relying on the missing invariant.
