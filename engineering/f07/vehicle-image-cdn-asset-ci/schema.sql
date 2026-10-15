-- F07-2: disposable PG16 sidecar only. NEVER install in formal production database.
CREATE SCHEMA IF NOT EXISTS f07_images;
CREATE TABLE IF NOT EXISTS f07_images.vehicles (
 id text PRIMARY KEY, source_type text NOT NULL CHECK(source_type IN ('wholesale','mingbang','four_s')),
 listing_cycle text NOT NULL, image_frozen boolean NOT NULL DEFAULT false, visible boolean NOT NULL DEFAULT true,
 priority_actor text, assigned_sales text, business_marker text NOT NULL DEFAULT 'TEST_BUSINESS_UNCHANGED'
);
CREATE TABLE IF NOT EXISTS f07_images.sessions (
 token text PRIMARY KEY, actor_id text NOT NULL, actor_kind text NOT NULL CHECK(actor_kind IN ('customer','employee')),
 active boolean NOT NULL DEFAULT true, scope_vehicle text NOT NULL, denied boolean NOT NULL DEFAULT false
);
CREATE TABLE IF NOT EXISTS f07_images.pictures (
 id text PRIMARY KEY, vehicle_id text NOT NULL REFERENCES f07_images.vehicles(id),
 resource_type text NOT NULL CHECK(resource_type IN
 ('vehicle_photo','accident_report','maintenance_image','maintenance_h5','sensitive_document')),
 source_platform text NOT NULL, upstream_image_id text, relative_path text NOT NULL,
 immutable_order integer NOT NULL, object_key text,
 asset_state text NOT NULL DEFAULT 'pending' CHECK(asset_state IN ('pending','processing','success','failed')),
 customer_visible boolean NOT NULL DEFAULT false, report_source_url text,
 CONSTRAINT asset_double_success CHECK ((asset_state='success')=(object_key IS NOT NULL)),
 UNIQUE(vehicle_id,resource_type,immutable_order)
);
CREATE TABLE IF NOT EXISTS f07_images.audit (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, picture_id text NOT NULL,
 action text NOT NULL, detail text NOT NULL, happened_at timestamptz NOT NULL DEFAULT now()
);
CREATE OR REPLACE FUNCTION f07_images.protect_origin() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF OLD.source_platform='JYT' AND ROW(OLD.vehicle_id,OLD.resource_type,OLD.source_platform,OLD.upstream_image_id,
        OLD.relative_path,OLD.immutable_order) IS DISTINCT FROM
    ROW(NEW.vehicle_id,NEW.resource_type,NEW.source_platform,NEW.upstream_image_id,
        NEW.relative_path,NEW.immutable_order)
 THEN RAISE EXCEPTION 'FROZEN_IMAGE_ORIGIN' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS origin_is_immutable ON f07_images.pictures;
CREATE TRIGGER origin_is_immutable BEFORE UPDATE ON f07_images.pictures
FOR EACH ROW EXECUTE FUNCTION f07_images.protect_origin();
