# W14_NOTIFICATION — Notification

## Scope
outbox worker/Feishu routing/quiet-hours/SLA/incident dedup.

## Dependencies
W08,W09,W05.

## Authoritative inputs
- `spec/FINAL_DEV_READY/02_SSOT/`
- affected IA/Screen/UI-Data files
- `08_DATABASE`, `09_STATE_PERMISSION_CONFIG`, `10_API`, `11_CONCURRENCY_ASYNC_SECURITY`, `12_TEST`, `13_TRACEABILITY` as applicable

## Forbidden shortcut
Notification failure must not alter business truth.

## Definition of Done
1. Implementation traces to current OpenAPI/DB/state/permission contract.
2. Unit + contract + permission/scope tests for touched behavior.
3. Failure/idempotency/concurrency tests where the contract requires them.
4. No customer-safe projection leakage.
5. No new business semantics invented in code.
6. Workstream handoff lists implemented operations, migrations, tests, unresolved blockers and downstream dependencies.

## CR-006 phone-count report

Daily Feishu phone-count reporting aggregates `upstream_phone_access_logs` dial actions. Per-employee exclusion changes only report projection via `employee_report_preferences`; audit logs are never suppressed. Exact send time is deployment/runtime configuration, not hard-coded by CR-006.
