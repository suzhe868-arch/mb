-- CI-only bridge attestation. Never changes public DDL or a production schema.
CREATE SCHEMA f05_f06_bridge_v1;
CREATE TABLE f05_f06_bridge_v1.attestation(
 seal_name text PRIMARY KEY CHECK(seal_name='F05_F06_SAME_VEHICLE_BRIDGE_V1'),
 source_manifest_sha256 text NOT NULL CHECK(source_manifest_sha256 ~ '^[0-9a-f]{64}$'),
 source_database_oid oid NOT NULL,
 target_database_oid oid NOT NULL,
 vehicle_id bigint NOT NULL REFERENCES public.vehicles(vehicle_id),
 listing_cycle_id bigint NOT NULL,
 source_type text NOT NULL CHECK(source_type='mingbang'),
 publisher_employee_id bigint NOT NULL REFERENCES public.employees(employee_id),
 source_team_id bigint NOT NULL REFERENCES public.teams(team_id),
 source_model_id bigint NOT NULL REFERENCES public.vehicle_models(model_id),
 source_vin_sha256 text NOT NULL CHECK(source_vin_sha256 ~ '^[0-9a-f]{64}$'),
 source_retail_price_cents bigint NOT NULL CHECK(source_retail_price_cents>0),
 source_mileage_km integer NOT NULL CHECK(source_mileage_km BETWEEN 0 AND 3000000),
 source_city text NOT NULL CHECK(length(btrim(source_city)) BETWEEN 2 AND 100),
 source_payload_sha256 text NOT NULL CHECK(source_payload_sha256 ~ '^[0-9a-f]{64}$'),
 source_published_event_sha256 text NOT NULL CHECK(source_published_event_sha256 ~ '^[0-9a-f]{64}$'),
 source_responsibility_id bigint NOT NULL REFERENCES public.vehicle_current_responsibilities(responsibility_id),
 source_price_event_id bigint NOT NULL REFERENCES public.vehicle_price_history(price_event_id),
 head_sha text NOT NULL CHECK(head_sha ~ '^[0-9a-f]{40}$'),
 run_id text NOT NULL CHECK(run_id ~ '^[0-9]{6,20}$'),
 github_ref text NOT NULL CHECK(github_ref='refs/heads/feat/f05-f06-same-vehicle-signed-bridge-pg16-01'),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 FOREIGN KEY(listing_cycle_id,vehicle_id) REFERENCES public.vehicle_listing_cycles(listing_cycle_id,vehicle_id),
 CHECK(source_database_oid<>target_database_oid)
);
CREATE FUNCTION f05_f06_bridge_v1.reject_mutation() RETURNS trigger
 LANGUAGE plpgsql AS $$BEGIN RAISE EXCEPTION 'F05_F06_BRIDGE_IMMUTABLE'; END$$;
CREATE TRIGGER bridge_attestation_immutable BEFORE UPDATE OR DELETE ON f05_f06_bridge_v1.attestation
 FOR EACH ROW EXECUTE FUNCTION f05_f06_bridge_v1.reject_mutation();
REVOKE ALL ON SCHEMA f05_f06_bridge_v1 FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA f05_f06_bridge_v1 FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA f05_f06_bridge_v1 FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA f05_f06_bridge_v1 FROM PUBLIC;
