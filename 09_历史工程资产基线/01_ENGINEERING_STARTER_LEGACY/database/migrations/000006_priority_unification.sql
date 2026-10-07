BEGIN;

-- Customer-level Priority qualification. SystemAdmin-only writes are enforced at API/auth layer.
ALTER TABLE customers
  ADD COLUMN is_priority_customer BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN priority_enabled_at TIMESTAMPTZ,
  ADD COLUMN priority_enabled_by_system_admin_id BIGINT REFERENCES system_admins(system_admin_id) ON DELETE RESTRICT,
  ADD CONSTRAINT ck_customer_priority_enable_metadata CHECK (
    (is_priority_customer AND priority_enabled_at IS NOT NULL AND priority_enabled_by_system_admin_id IS NOT NULL)
    OR
    (NOT is_priority_customer)
  );
CREATE INDEX idx_customers_priority_enabled ON customers(customer_id) WHERE is_priority_customer;

-- Composite keys are deliberate: downstream FKs must prove business-object ownership, not merely row existence.
ALTER TABLE demands ADD CONSTRAINT uq_demands_id_customer UNIQUE(demand_id,customer_id);
ALTER TABLE vehicle_listing_cycles ADD CONSTRAINT uq_listing_cycle_id_vehicle UNIQUE(listing_cycle_id,vehicle_id);
ALTER TABLE recommendations ADD CONSTRAINT uq_recommendation_business_tuple UNIQUE(recommendation_id,customer_id,vehicle_id,listing_cycle_id);

-- Recommendation is a real lifecycle object. Temporary Priority suppression is not an end state.
ALTER TABLE recommendations
  ADD COLUMN status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','ended')),
  ADD COLUMN ended_at TIMESTAMPTZ,
  ADD COLUMN end_reason TEXT,
  ADD COLUMN visibility_suppressed_by_priority BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN suppressed_by_priority_lease_id BIGINT,
  ADD CONSTRAINT ck_recommendation_end_state CHECK (
    (status='active' AND ended_at IS NULL)
    OR
    (status='ended' AND ended_at IS NOT NULL AND end_reason IS NOT NULL)
  );
CREATE UNIQUE INDEX uq_active_recommendation_customer_vehicle_cycle
  ON recommendations(customer_id,vehicle_id,listing_cycle_id)
  WHERE status='active';

-- Normalize the CR007 Priority lease into the minimal "public matching + exclusive branch" model.
ALTER TABLE demand_priority_leases RENAME COLUMN demand_id TO trigger_demand_id;
ALTER TABLE demand_priority_leases DROP COLUMN match_tier;
ALTER TABLE demand_priority_leases
  ADD COLUMN listing_cycle_id BIGINT,
  ADD COLUMN recommendation_id BIGINT,
  ADD COLUMN candidate_tier TEXT NOT NULL DEFAULT 'acceptable' CHECK(candidate_tier IN ('high','acceptable')),
  ADD COLUMN ttl_seconds_snapshot INTEGER NOT NULL DEFAULT 86400 CHECK(ttl_seconds_snapshot > 0),
  ADD COLUMN status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','ended'));

ALTER TABLE demand_priority_leases
  DROP CONSTRAINT demand_priority_leases_demand_id_fkey,
  ADD CONSTRAINT fk_priority_trigger_demand_customer
    FOREIGN KEY(trigger_demand_id,customer_id)
    REFERENCES demands(demand_id,customer_id) ON DELETE RESTRICT,
  ADD CONSTRAINT fk_priority_listing_cycle_vehicle
    FOREIGN KEY(listing_cycle_id,vehicle_id)
    REFERENCES vehicle_listing_cycles(listing_cycle_id,vehicle_id) ON DELETE RESTRICT,
  ADD CONSTRAINT fk_priority_recommendation_business
    FOREIGN KEY(recommendation_id,customer_id,vehicle_id,listing_cycle_id)
    REFERENCES recommendations(recommendation_id,customer_id,vehicle_id,listing_cycle_id) ON DELETE RESTRICT;

ALTER TABLE demand_priority_leases
  DROP CONSTRAINT demand_priority_leases_end_reason_check,
  ADD CONSTRAINT ck_priority_end_reason CHECK (
    end_reason IS NULL OR end_reason IN (
      'abandoned_before_recommendation',
      'recommendation_cancelled',
      'expired',
      'converted_to_lock',
      'vehicle_unavailable',
      'demand_inactive',
      'priority_customer_disabled',
      'match_invalidated'
    )
  ),
  ADD CONSTRAINT ck_priority_state_times CHECK (
    (status='active' AND ended_at IS NULL AND end_reason IS NULL)
    OR
    (status='ended' AND ended_at IS NOT NULL AND end_reason IS NOT NULL)
  ),
  ADD CONSTRAINT ck_priority_expiry_snapshot CHECK (
    expires_at = created_at + make_interval(secs => ttl_seconds_snapshot)
  );

-- Clean-rebuild baseline: every Priority must point at the current listing cycle.
ALTER TABLE demand_priority_leases ALTER COLUMN listing_cycle_id SET NOT NULL;

DROP INDEX uq_vehicle_active_priority;
CREATE UNIQUE INDEX uq_vehicle_active_priority
  ON demand_priority_leases(vehicle_id)
  WHERE status='active';
DROP INDEX idx_priority_expiry;
CREATE INDEX idx_priority_expiry
  ON demand_priority_leases(expires_at)
  WHERE status='active';
CREATE INDEX idx_priority_customer_vehicle_cycle_history
  ON demand_priority_leases(customer_id,vehicle_id,listing_cycle_id,created_at DESC);

ALTER TABLE recommendations
  ADD CONSTRAINT fk_recommendation_suppressed_priority
  FOREIGN KEY(suppressed_by_priority_lease_id)
  REFERENCES demand_priority_leases(priority_lease_id) ON DELETE RESTRICT,
  ADD CONSTRAINT ck_recommendation_priority_suppression CHECK (
    visibility_suppressed_by_priority = (suppressed_by_priority_lease_id IS NOT NULL)
  );

-- Priority is not manually overridden. Keep one narrowly scoped cross-Priority read permission.
INSERT INTO permissions(permission_code,display_name,sensitivity)
VALUES ('priority.view','View vehicles protected by another customer Priority within existing data scope','sensitive')
ON CONFLICT (permission_code) DO UPDATE SET display_name=EXCLUDED.display_name,sensitivity=EXCLUDED.sensitivity;

DELETE FROM role_permissions WHERE permission_code='priority.override';
UPDATE employee_permission_overrides
SET revoked_at=COALESCE(revoked_at,now())
WHERE permission_code='priority.override' AND revoked_at IS NULL;
DELETE FROM permissions WHERE permission_code='priority.override';

COMMIT;
