# W05_JYT_INTEGRATION — OpenAPI Operation Manifest

Generated from current .10 CR-007 operation-index. **Count: 8**.

| Method | Path | operationId | Identity | Permission/Capability | Scope | Projection | Idempotency |
|---|---|---|---|---|---|---|---|
| `GET` | `/admin/integrations/collector/connection` | `get_admin_integrations_collector_connection` | `employee` | `integration.collector.manage` | admin integration scope | `CollectorConnectionConfigDTO` | not required |
| `PATCH` | `/admin/integrations/collector/connection` | `patch_admin_integrations_collector_connection` | `employee` | `integration.collector.manage` | admin integration scope | `CollectorConnectionConfigDTO` | not required |
| `POST` | `/admin/integrations/collector/connection:test` | `post_admin_integrations_collector_connection_test` | `employee` | `integration.collector.manage` | admin integration scope | `CollectorConnectionTestResult` | not required |
| `GET` | `/admin/integrations/collector/publisher-phone-cache` | `get_admin_integrations_collector_publisher_phone_cache` | `employee` | `integration.collector.manage` | integration admin scope | `PublisherPhoneCacheDTO[]` | not required |
| `GET` | `/admin/jyt/incidents` | `get_admin_jyt_incidents` | `employee` | `jyt.integration.manage` | integration admin scope | `IncidentDTO[]` | not required |
| `GET` | `/admin/jyt/logs` | `get_admin_jyt_logs` | `employee` | `jyt.integration.manage` | integration admin scope | `IntegrationLogDTO[]` | not required |
| `GET` | `/admin/jyt/status` | `get_admin_jyt_status` | `employee` | `jyt.integration.manage` | integration admin scope | `AdminJytDTO` | not required |
| `POST` | `/integrations/jyt/vehicle-prices` | `post_integrations_jyt_vehicle_prices` | `integration` | `jyt.integration.ingest` | JYT source rows only | `JytVehiclePriceBatchResult` | Idempotency-Key required |

Generated engineering routing only; product authority remains the independent FINAL_DEV_READY .10 mother copy.
