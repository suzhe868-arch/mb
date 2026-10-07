-- CR-007 development hardening. Intended for a clean development/test rebuild.

-- A missing internal wholesale price is a valid lock snapshot.
ALTER TABLE locks
  ALTER COLUMN internal_wholesale_snapshot_cents DROP NOT NULL;

-- Preserve the upstream JYT text and parse it into the existing amount column.
ALTER TABLE wholesale_vehicle_source
  ADD COLUMN upstream_wholesale_price_label TEXT;

ALTER TABLE vehicles
  ADD COLUMN base_audience TEXT NOT NULL DEFAULT 'public'
    CHECK (base_audience IN ('public','restricted'));

CREATE TABLE vehicle_visibility_grants (
  visibility_grant_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  vehicle_id BIGINT NOT NULL REFERENCES vehicles(vehicle_id) ON DELETE RESTRICT,
  customer_id BIGINT REFERENCES customers(customer_id) ON DELETE RESTRICT,
  employee_id BIGINT REFERENCES employees(employee_id) ON DELETE RESTRICT,
  grant_reason TEXT NOT NULL CHECK (grant_reason IN ('manual','recommendation')),
  source_recommendation_id BIGINT REFERENCES recommendations(recommendation_id) ON DELETE RESTRICT,
  granted_by_employee_id BIGINT NOT NULL REFERENCES employees(employee_id) ON DELETE RESTRICT,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  revoked_by_employee_id BIGINT REFERENCES employees(employee_id) ON DELETE RESTRICT,
  revoke_reason TEXT,
  CHECK ((customer_id IS NOT NULL)::int + (employee_id IS NOT NULL)::int = 1),
  CHECK (revoked_at IS NULL OR revoked_at >= granted_at),
  CHECK (grant_reason <> 'recommendation' OR (customer_id IS NOT NULL AND source_recommendation_id IS NOT NULL))
);
CREATE UNIQUE INDEX uq_customer_vehicle_active_visibility_grant
  ON vehicle_visibility_grants(vehicle_id,customer_id)
  WHERE customer_id IS NOT NULL AND revoked_at IS NULL;
CREATE UNIQUE INDEX uq_employee_vehicle_active_visibility_grant
  ON vehicle_visibility_grants(vehicle_id,employee_id)
  WHERE employee_id IS NOT NULL AND revoked_at IS NULL;

CREATE TABLE vehicle_model_visibility_rules (
  visibility_rule_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  target_type TEXT NOT NULL CHECK (target_type IN ('global','brand','series','model_year','model')),
  target_key TEXT NOT NULL,
  audience TEXT NOT NULL CHECK (audience IN ('public','restricted')),
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_by_employee_id BIGINT NOT NULL REFERENCES employees(employee_id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  retired_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX uq_active_model_visibility_rule
  ON vehicle_model_visibility_rules(target_type,target_key)
  WHERE enabled AND retired_at IS NULL;

CREATE TABLE demand_priority_leases (
  priority_lease_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  demand_id BIGINT NOT NULL REFERENCES demands(demand_id) ON DELETE RESTRICT,
  customer_id BIGINT NOT NULL REFERENCES customers(customer_id) ON DELETE RESTRICT,
  vehicle_id BIGINT NOT NULL REFERENCES vehicles(vehicle_id) ON DELETE RESTRICT,
  match_tier INTEGER NOT NULL,
  match_event_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  end_reason TEXT CHECK (end_reason IS NULL OR end_reason IN ('expired','manual_release','converted_to_lock','vehicle_unavailable','overridden')),
  ended_by_employee_id BIGINT REFERENCES employees(employee_id) ON DELETE RESTRICT,
  CHECK (expires_at > created_at),
  CHECK (ended_at IS NULL OR ended_at >= created_at)
);
-- There is deliberately no per-demand or per-customer quantity limit.
CREATE UNIQUE INDEX uq_vehicle_active_priority
  ON demand_priority_leases(vehicle_id)
  WHERE ended_at IS NULL;
CREATE INDEX idx_priority_expiry
  ON demand_priority_leases(expires_at)
  WHERE ended_at IS NULL;

ALTER TABLE customer_vehicle_price_access
  ADD COLUMN source_recommendation_id BIGINT REFERENCES recommendations(recommendation_id) ON DELETE RESTRICT;
ALTER TABLE customer_vehicle_price_access
  ADD CONSTRAINT ck_price_access_recommendation_source
  CHECK (first_grant_source <> 'recommendation' OR source_recommendation_id IS NOT NULL);

-- One refund subject can have at most one pending case. Separate indexes cover
-- the two legal subject types without treating NULLs as equal.
CREATE UNIQUE INDEX uq_pending_refund_transaction
  ON refund_cases(transaction_id)
  WHERE status='pending' AND transaction_id IS NOT NULL;
CREATE UNIQUE INDEX uq_pending_refund_lock
  ON refund_cases(lock_id)
  WHERE status='pending' AND lock_id IS NOT NULL;

-- Manual drafts cannot leak into customer-visible or active source states.
ALTER TABLE vehicles ADD CONSTRAINT ck_unpublished_manual_vehicle_is_hidden_draft
  CHECK (
    source_type = 'wholesale'
    OR formally_published_at IS NOT NULL
    OR (source_status = 'draft' AND platform_visibility = 'hidden')
  );
CREATE UNIQUE INDEX uq_employee_open_manual_draft
  ON vehicles(created_by_employee_id)
  WHERE source_type IN ('mingbang','four_s') AND formally_published_at IS NULL;

CREATE TABLE collector_connection_config (
  singleton_id BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (singleton_id),
  base_url TEXT NOT NULL,
  phone_path TEXT NOT NULL CHECK (phone_path ~ '^/[^/]'),
  timeout_ms INTEGER NOT NULL CHECK (timeout_ms BETWEEN 100 AND 30000),
  internal_key_secret_ref TEXT NOT NULL,
  connection_status TEXT NOT NULL DEFAULT 'untested' CHECK (connection_status IN ('untested','ready','failed')),
  last_tested_at TIMESTAMPTZ,
  last_test_result JSONB,
  version BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by_employee_id BIGINT NOT NULL REFERENCES employees(employee_id) ON DELETE RESTRICT
);

-- CRM history is append-only. Corrections are new rows linked in content/audit.
CREATE OR REPLACE FUNCTION block_crm_followup_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'CRM_FOLLOWUP_APPEND_ONLY';
END $$;
CREATE TRIGGER trg_crm_followup_append_only
  BEFORE UPDATE OR DELETE ON crm_followups
  FOR EACH ROW EXECUTE FUNCTION block_crm_followup_mutation();
