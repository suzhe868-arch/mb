# W04_VEHICLE_CORE — Vehicle Core

## Scope
vehicle/listing/source/pricing/images/manual upload/detail projections.

## Dependencies
W01,W02,W03.

## Authoritative inputs
- `spec/FINAL_DEV_READY/02_SSOT/`
- affected IA/Screen/UI-Data files
- `08_DATABASE`, `09_STATE_PERMISSION_CONFIG`, `10_API`, `11_CONCURRENCY_ASYNC_SECURITY`, `12_TEST`, `13_TRACEABILITY` as applicable

## Forbidden shortcut
No JYT direct DB write; customer-safe/internal split.

## Definition of Done
1. Implementation traces to current OpenAPI/DB/state/permission contract.
2. Unit + contract + permission/scope tests for touched behavior.
3. Failure/idempotency/concurrency tests where the contract requires them.
4. No customer-safe projection leakage.
5. No new business semantics invented in code.
6. Workstream handoff lists implemented operations, migrations, tests, unresolved blockers and downstream dependencies.

## Current .6 operation inventory

- OpenAPI operations owned: **28**
- Executable manifest: `W04_VEHICLE_CORE_OPERATIONS.md`
- Contract source: `packages/contracts/openapi.yaml` + `generated/operation-index.json`
- Ownership sync is enforced by `tests/foundation/operation-ownership-sync.test.mjs`.

## CR-006 integration

W04 now owns vehicle master/catalog, ID-based list filters/page envelope, pending/conflict resolution APIs, manual model identity/publish gate and model-field conflict handling. Runtime implementation must preserve degraded-display semantics and source mapping uniqueness.
