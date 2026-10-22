-- CI-only non-public same-database storage. NOT a production authority.
CREATE SCHEMA f03_publisher_phone_admin_test;
CREATE TABLE f03_publisher_phone_admin_test.employee_mode (
  employee_id bigint PRIMARY KEY CHECK (employee_id>0),
  scope_mode text CHECK (scope_mode IN ('LOCKED_ONLY','ALL_ACTIVE_JYT')),
  enabled boolean NOT NULL DEFAULT false,
  -- Snapshot of the permission override before this API's active grant.
  -- DELETE restores this baseline instead of erasing an unrelated allow/deny.
  previous_decision text CHECK (previous_decision IN ('allow','deny') OR previous_decision IS NULL),
  previous_decision_captured boolean NOT NULL DEFAULT false,
  -- Watermark into the immutable employee lifecycle audit stream at explicit grant.
  lifecycle_audit_watermark bigint NOT NULL DEFAULT 0 CHECK (lifecycle_audit_watermark>=0),
  granted_employment_status text CHECK (granted_employment_status IS NULL OR granted_employment_status='active'),
  granted_role_code text,
  granted_main_role_id bigint CHECK (granted_main_role_id IS NULL OR granted_main_role_id>0),
  granted_store_id bigint CHECK (granted_store_id IS NULL OR granted_store_id>0),
  lifecycle_invalidated_at timestamptz,
  lifecycle_invalidated_audit_id bigint CHECK (lifecycle_invalidated_audit_id IS NULL OR lifecycle_invalidated_audit_id>0),
  lifecycle_invalidated_action text,
  lifecycle_invalidated_reason text CHECK (lifecycle_invalidated_reason IS NULL OR lifecycle_invalidated_reason IN ('EMPLOYEE_AUDIT_AFTER_GRANT','EMPLOYEE_FACT_DRIFT','LIFECYCLE_BASELINE_MISSING')),
  version bigint NOT NULL DEFAULT 0 CHECK (version>=0),
  updated_by_system_admin_id bigint,
  updated_at timestamptz NOT NULL DEFAULT transaction_timestamp(),
  origin text NOT NULL DEFAULT 'CI_ONLY_F03_PERMISSION_CONFIG'
    CHECK(origin='CI_ONLY_F03_PERMISSION_CONFIG'),
  CHECK ((enabled AND scope_mode IS NOT NULL) OR NOT enabled)
);
CREATE TABLE f03_publisher_phone_admin_test.request_replay (
  request_key text PRIMARY KEY CHECK (length(request_key) BETWEEN 12 AND 80),
  request_digest text NOT NULL,
  actor_system_admin_id bigint NOT NULL CHECK (actor_system_admin_id>0),
  employee_id bigint NOT NULL CHECK (employee_id>0),
  resulting_version bigint NOT NULL,
  response_json jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT transaction_timestamp()
);
CREATE INDEX publisher_phone_replay_actor_idx
 ON f03_publisher_phone_admin_test.request_replay(actor_system_admin_id,employee_id);
