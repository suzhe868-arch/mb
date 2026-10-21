CREATE SCHEMA IF NOT EXISTS f07_runtime;

CREATE TABLE IF NOT EXISTS f07_runtime.publisher_phone_employee_scope (
  employee_id bigint PRIMARY KEY CHECK (employee_id > 0),
  scope_mode text NOT NULL CHECK (scope_mode IN ('LOCKED_ONLY','ALL_ACTIVE_JYT')),
  enabled boolean NOT NULL DEFAULT false,
  updated_by_system_admin_id bigint NOT NULL CHECK (updated_by_system_admin_id > 0),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  origin text NOT NULL CHECK (origin = 'CI_SYNTHETIC_ONLY')
);

CREATE TABLE IF NOT EXISTS f07_runtime.publisher_phone_vehicles (
  vehicle_id bigint NOT NULL CHECK (vehicle_id > 0),
  listing_cycle_id bigint NOT NULL CHECK (listing_cycle_id > 0),
  source_platform text NOT NULL CHECK (source_platform IN ('JYT','OTHER')),
  upstream_publisher_id text,
  source_type text NOT NULL CHECK (source_type IN ('wholesale','mingbang','four_s','other')),
  listing_status text NOT NULL CHECK (listing_status IN ('active','inactive')),
  is_current_cycle boolean NOT NULL,
  origin text NOT NULL CHECK (origin = 'CI_SYNTHETIC_ONLY'),
  PRIMARY KEY (vehicle_id, listing_cycle_id),
  CHECK (upstream_publisher_id IS NULL OR upstream_publisher_id ~ '^[A-Za-z0-9_-]{1,80}$')
);

CREATE UNIQUE INDEX IF NOT EXISTS f08_3_phone_vehicle_current_cycle_uq
  ON f07_runtime.publisher_phone_vehicles(vehicle_id)
  WHERE is_current_cycle;

CREATE TABLE IF NOT EXISTS f07_runtime.publisher_phone_locks (
  lock_id text PRIMARY KEY,
  vehicle_id bigint NOT NULL,
  listing_cycle_id bigint NOT NULL,
  status text NOT NULL CHECK (status IN ('active','requested','cancelled','expired','rejected')),
  expires_at timestamptz NOT NULL,
  origin text NOT NULL CHECK (origin = 'CI_SYNTHETIC_ONLY'),
  FOREIGN KEY (vehicle_id, listing_cycle_id)
    REFERENCES f07_runtime.publisher_phone_vehicles(vehicle_id, listing_cycle_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS f08_3_phone_lock_current_lookup_idx
  ON f07_runtime.publisher_phone_locks(vehicle_id, listing_cycle_id, status, expires_at);
