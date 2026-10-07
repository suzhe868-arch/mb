-- CR007 / CN9 / 2026-09-17
-- Price-label semantic correction + hidden-vehicle Recommendation visibility closure.

-- price_label is always the upstream LIST price raw label.
ALTER TABLE wholesale_vehicle_source
  RENAME COLUMN upstream_wholesale_price_label TO upstream_list_price_label;

CREATE OR REPLACE FUNCTION sync_base_wholesale_price() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.base_wholesale_price_cents := COALESCE(NEW.upstream_wholesale_price_cents, NEW.upstream_list_price_cents);
  RETURN NEW;
END $$;
UPDATE wholesale_vehicle_source
SET base_wholesale_price_cents = COALESCE(upstream_wholesale_price_cents, upstream_list_price_cents);
DROP TRIGGER IF EXISTS trg_sync_base_wholesale_price ON wholesale_vehicle_source;
CREATE TRIGGER trg_sync_base_wholesale_price
  BEFORE INSERT OR UPDATE OF upstream_wholesale_price_cents, upstream_list_price_cents
  ON wholesale_vehicle_source
  FOR EACH ROW EXECUTE FUNCTION sync_base_wholesale_price();

-- The unimplemented model/base/manual visibility system is retired. Public hiding is platform_visibility only.
DROP TABLE IF EXISTS vehicle_model_visibility_rules;
ALTER TABLE vehicles DROP COLUMN IF EXISTS base_audience;
DELETE FROM role_permissions WHERE permission_code='vehicle.visibility.manage';
DELETE FROM permissions WHERE permission_code='vehicle.visibility.manage';

-- Visibility grants are recommendation-derived CUSTOMER grants only.
DELETE FROM vehicle_visibility_grants
WHERE grant_reason <> 'recommendation' OR customer_id IS NULL OR source_recommendation_id IS NULL;

ALTER TABLE vehicle_visibility_grants
  DROP CONSTRAINT IF EXISTS fk_visibility_source_recommendation_business;
ALTER TABLE vehicle_visibility_grants
  DROP COLUMN IF EXISTS employee_id CASCADE,
  DROP COLUMN IF EXISTS granted_by_employee_id,
  DROP COLUMN IF EXISTS revoked_by_employee_id;
ALTER TABLE vehicle_visibility_grants
  RENAME COLUMN granted_at TO created_at;
ALTER TABLE vehicle_visibility_grants
  RENAME COLUMN revoked_at TO ended_at;
ALTER TABLE vehicle_visibility_grants
  RENAME COLUMN revoke_reason TO end_reason;
ALTER TABLE vehicle_visibility_grants
  ADD COLUMN listing_cycle_id BIGINT;
UPDATE vehicle_visibility_grants g
SET listing_cycle_id=r.listing_cycle_id
FROM recommendations r
WHERE r.recommendation_id=g.source_recommendation_id;
ALTER TABLE vehicle_visibility_grants
  ALTER COLUMN customer_id SET NOT NULL,
  ALTER COLUMN source_recommendation_id SET NOT NULL,
  ALTER COLUMN listing_cycle_id SET NOT NULL;
ALTER TABLE vehicle_visibility_grants
  DROP CONSTRAINT IF EXISTS vehicle_visibility_grants_grant_reason_check,
  ADD CONSTRAINT ck_visibility_grant_recommendation_only CHECK (grant_reason='recommendation'),
  ADD CONSTRAINT ck_visibility_grant_end_time CHECK (ended_at IS NULL OR ended_at>=created_at),
  ADD CONSTRAINT fk_visibility_source_recommendation_business
    FOREIGN KEY(source_recommendation_id,customer_id,vehicle_id,listing_cycle_id)
    REFERENCES recommendations(recommendation_id,customer_id,vehicle_id,listing_cycle_id) ON DELETE RESTRICT;
CREATE UNIQUE INDEX uq_visibility_grant_recommendation
  ON vehicle_visibility_grants(source_recommendation_id);

-- Historical seed may still contain this dead permission; current migration removes it.
