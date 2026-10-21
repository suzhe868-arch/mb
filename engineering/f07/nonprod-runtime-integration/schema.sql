CREATE SCHEMA IF NOT EXISTS f07_runtime;

CREATE TABLE IF NOT EXISTS f07_runtime.audit (
  audit_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  domain text NOT NULL,
  action text NOT NULL,
  code text NOT NULL,
  origin text NOT NULL CHECK (origin IN ('CI_SYNTHETIC_ONLY','SIGNED_PARENT_NEGATIVE_ONLY','SOURCE_GAP')),
  backend_pid integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS f07_runtime.callback_receipts (
  request_id text PRIMARY KEY,
  nonce text NOT NULL UNIQUE,
  source_platform text NOT NULL CHECK (source_platform='JYT'),
  upstream_publisher_id text NOT NULL,
  payload_sha256 text NOT NULL CHECK (payload_sha256 ~ '^[a-f0-9]{64}$'),
  status text NOT NULL CHECK (status IN ('UPDATED','UNAVAILABLE','STALE')),
  received_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS f07_runtime.phone_cache (
  source_platform text NOT NULL CHECK (source_platform='JYT'),
  upstream_publisher_id text NOT NULL,
  request_id text NOT NULL REFERENCES f07_runtime.callback_receipts(request_id),
  phone_token text NOT NULL CHECK (phone_token ~ '^TEST-[0-9]{6}$'),
  issued_at timestamptz NOT NULL,
  origin text NOT NULL CHECK (origin='CI_SYNTHETIC_ONLY'),
  PRIMARY KEY(source_platform,upstream_publisher_id)
);

CREATE TABLE IF NOT EXISTS f07_runtime.image_assets (
  image_id text PRIMARY KEY,
  vehicle_id text NOT NULL,
  relative_path text NOT NULL,
  immutable_order integer NOT NULL CHECK (immutable_order>=0 AND immutable_order<=10000),
  object_key text NOT NULL UNIQUE,
  asset_state text NOT NULL CHECK (asset_state='success'),
  origin text NOT NULL CHECK (origin='CI_SYNTHETIC_ONLY'),
  content_sha256 text NOT NULL CHECK (content_sha256 ~ '^[a-f0-9]{64}$'),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS f07_runtime.asset_failures (
  failure_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  image_ref text NOT NULL,
  failure_code text NOT NULL,
  origin text NOT NULL CHECK (origin='CI_SYNTHETIC_ONLY'),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS f07_runtime.notification_events (
  event_id text PRIMARY KEY,
  kind text NOT NULL,
  stage text NOT NULL,
  channel text NOT NULL CHECK (channel IN ('personal','group')),
  payload_sha256 text NOT NULL CHECK (payload_sha256 ~ '^[a-f0-9]{64}$'),
  origin text NOT NULL CHECK (origin='CI_SYNTHETIC_ONLY'),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS f07_runtime.notification_outbox (
  event_id text NOT NULL REFERENCES f07_runtime.notification_events(event_id),
  stage text NOT NULL,
  channel text NOT NULL CHECK (channel IN ('personal','group')),
  status text NOT NULL CHECK (status='QUEUED_LOCAL_ONLY'),
  code text NOT NULL CHECK (code='ROUTE_SOURCE_GAP'),
  payload jsonb NOT NULL,
  origin text NOT NULL CHECK (origin='CI_SYNTHETIC_ONLY'),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY(event_id,stage,channel)
);

CREATE TABLE IF NOT EXISTS f07_runtime.incident_lifecycle (
  incident_id text PRIMARY KEY,
  status text NOT NULL CHECK (status IN ('active','cleared')),
  ever_active boolean NOT NULL CHECK (ever_active=true),
  activated_at timestamptz NOT NULL,
  cleared_at timestamptz,
  recovery_notified boolean NOT NULL DEFAULT false CHECK (recovery_notified=false),
  origin text NOT NULL CHECK (origin='CI_SYNTHETIC_ONLY'),
  CHECK ((status='active' AND cleared_at IS NULL) OR (status='cleared' AND cleared_at IS NOT NULL))
);
