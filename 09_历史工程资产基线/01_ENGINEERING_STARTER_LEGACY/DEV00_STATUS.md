# DEV-00 / DEV-01 CURRENT STATUS — CR-007 / CN8

- Baseline: `MB-V1-PREDEV-FINAL-2026-09-10.10`.
- Product decisions: unchanged; CR-006 remains `01=B / 02=B / 03=C`.
- OpenAPI operations indexed: **218**.
- OpenAPI schemas: **180**.
- CR-005 cross-layer semantics remain regression-protected.
- CR-006 vehicle-master/JYT typed-ingest contracts are integrated.
- CR-006.2 historical phone configuration has been superseded by the CR007 Collector boundary. Current phone configuration/testing is Mingbang→Collector; JYT phone credentials/details remain outside Mingbang.

## Runtime boundary

Live PostgreSQL apply/replay remains pending because the artifact environment has no PostgreSQL runtime/client. Collector connection/phone runtime behavior remains an external-environment verification item. Direct JYT method/auth/response details are Collector-owned and are not a Mingbang runtime gate.

DEV_STATIC_GATE = CONTRACT_PASS_WITH_DEPENDENCY_GATES
LIVE_POSTGRESQL_GATE = PENDING_EXTERNAL_DEV_ENVIRONMENT
COLLECTOR_INTEGRATION_RUNTIME_GATE = PENDING_EXTERNAL_DEV_ENVIRONMENT

FOUNDATION_TEST_GATE = PASS_WITH_TYPECHECK_SKIPPED_IF_DEPENDENCIES_ABSENT
STRICT_TYPESCRIPT_GATE = PENDING_DEPENDENCY_INSTALL
