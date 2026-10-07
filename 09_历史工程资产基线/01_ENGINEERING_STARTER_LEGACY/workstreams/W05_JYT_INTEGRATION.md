# W05_JYT_INTEGRATION — JYT Integration

## Scope
fixed ingest/update/off-shelf/phone/cache/health incident adapters.

## Dependencies
W01,W02,W03,W04.

## Authoritative inputs
- `spec/FINAL_DEV_READY/02_SSOT/`
- affected IA/Screen/UI-Data files
- `08_DATABASE`, `09_STATE_PERMISSION_CONFIG`, `10_API`, `11_CONCURRENCY_ASYNC_SECURITY`, `12_TEST`, `13_TRACEABILITY` as applicable

## Forbidden shortcut
External program API only; credentials server-side.

## Definition of Done
1. Implementation traces to current OpenAPI/DB/state/permission contract.
2. Unit + contract + permission/scope tests for touched behavior.
3. Failure/idempotency/concurrency tests where the contract requires them.
4. No customer-safe projection leakage.
5. No new business semantics invented in code.
6. Workstream handoff lists implemented operations, migrations, tests, unresolved blockers and downstream dependencies.

## CR-006 / CR-006.1 integration

W05 JYT ingest consumes the typed `JytVehicleSourceDataV1` contract, preserves unknown upstream enum/unit values raw, writes source/model-profile facts, and never drops a vehicle solely because `model_id` is not mapped.

Phone access must follow `spec/FINAL_DEV_READY/10_API/10_JYT_UPSTREAM_PHONE_ADAPTER_CONTRACT.md`. Mingbang phone identity is `publisher_id / upstream_publisher_id`; `car_code` is not a phone-query key. Mingbang calls Collector only; JYT URL/Token/Header/callCode details are Collector-owned and are not a Mingbang implementation contract. Dial remains separate from refresh and uses local publisher cache when present; explicit refresh bypasses the cache read and updates the publisher cache on success.
