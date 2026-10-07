# Database bootstrap

`000001_initial_schema.sql` is copied byte-for-byte from the `.4` physical schema contract. It is the schema authority.

`000002_seed_permission_registry.sql` seeds **permission codes only**. DEV-00 deliberately does not invent role codes or role-permission defaults; W03 must implement those from current SSOT/permission boundaries and tests.

Migrations are append-only after shared development begins. Never edit an already-applied migration in place.

## CR-006

- `migrations/000003_cr006_vehicle_master_data.sql`: vehicle master/JYT contract migration.
- `seeds/cr006_vehicle_dictionary/import.psql.sql`: formal 316-brand dictionary import; 87 pending brands excluded.
- Live PostgreSQL apply/replay is still required before DB engineering Gate PASS.
