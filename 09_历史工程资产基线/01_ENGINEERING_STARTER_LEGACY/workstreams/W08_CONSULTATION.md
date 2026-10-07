# W08_CONSULTATION — Consultation

## Scope
consultation creation/responsibility/SLA/service action.

## Dependencies
W04,W06.

## Authoritative inputs
- `spec/FINAL_DEV_READY/02_SSOT/`
- affected IA/Screen/UI-Data files
- `08_DATABASE`, `09_STATE_PERMISSION_CONFIG`, `10_API`, `11_CONCURRENCY_ASYNC_SECURITY`, `12_TEST`, `13_TRACEABILITY` as applicable

## Forbidden shortcut
No fake SLA completion from page read/status change.

## Definition of Done
1. Implementation traces to current OpenAPI/DB/state/permission contract.
2. Unit + contract + permission/scope tests for touched behavior.
3. Failure/idempotency/concurrency tests where the contract requires them.
4. No customer-safe projection leakage.
5. No new business semantics invented in code.
6. Workstream handoff lists implemented operations, migrations, tests, unresolved blockers and downstream dependencies.
