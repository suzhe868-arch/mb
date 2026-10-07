-- CR-006.2 color dictionaries, condition tags and wholesale source write guard
CREATE TABLE vehicle_colors (
  color_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  color_type TEXT NOT NULL CHECK(color_type IN ('exterior','interior')),
  color_code TEXT NOT NULL,
  color_name TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE(color_type,color_code),
  UNIQUE(color_type,color_name)
);
CREATE INDEX idx_vehicle_colors_type_sort ON vehicle_colors(color_type,enabled,sort_order);

CREATE TABLE jyt_vehicle_color_mappings (
  mapping_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source_platform TEXT NOT NULL DEFAULT 'JYT',
  color_type TEXT NOT NULL CHECK(color_type IN ('exterior','interior')),
  upstream_value TEXT NOT NULL,
  vehicle_color_id BIGINT NOT NULL REFERENCES vehicle_colors(color_id) ON DELETE RESTRICT,
  mapping_kind TEXT NOT NULL DEFAULT 'exact_label' CHECK(mapping_kind IN ('exact_label','approved_alias','fallback_other')),
  UNIQUE(source_platform,color_type,upstream_value)
);
CREATE INDEX idx_jyt_vehicle_color_mapping_lookup ON jyt_vehicle_color_mappings(source_platform,color_type,upstream_value);

CREATE TABLE vehicle_condition_tags (
  tag_code TEXT PRIMARY KEY,
  tag_name TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE INDEX idx_vehicle_condition_tags_sort ON vehicle_condition_tags(enabled,sort_order);

ALTER TABLE vehicles ADD COLUMN exterior_color_id BIGINT REFERENCES vehicle_colors(color_id) ON DELETE RESTRICT;
ALTER TABLE vehicles ADD COLUMN interior_color_id BIGINT REFERENCES vehicle_colors(color_id) ON DELETE RESTRICT;
ALTER TABLE vehicle_condition_facts ADD COLUMN manual_tags_json JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE vehicle_condition_facts ADD CONSTRAINT ck_vehicle_condition_source_tags_array CHECK(jsonb_typeof(source_tags_json)='array');
ALTER TABLE vehicle_condition_facts ADD CONSTRAINT ck_vehicle_condition_manual_tags_array CHECK(jsonb_typeof(manual_tags_json)='array');

CREATE OR REPLACE FUNCTION block_wholesale_vehicle_source_edit() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.source_type='wholesale'
     AND COALESCE(current_setting('app.write_origin', true),'') <> 'jyt_ingest'
     AND ROW(OLD.vin,OLD.brand,OLD.series,OLD.model_config,OLD.model_year,OLD.mileage_km,OLD.city,OLD.condition_summary)
         IS DISTINCT FROM
         ROW(NEW.vin,NEW.brand,NEW.series,NEW.model_config,NEW.model_year,NEW.mileage_km,NEW.city,NEW.condition_summary) THEN
    RAISE EXCEPTION 'SOURCE_TYPE_READ_ONLY';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_block_wholesale_vehicle_source_edit
BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION block_wholesale_vehicle_source_edit();

CREATE OR REPLACE FUNCTION block_wholesale_source_row_edit() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF COALESCE(current_setting('app.write_origin', true),'') <> 'jyt_ingest' THEN
    RAISE EXCEPTION 'SOURCE_TYPE_READ_ONLY';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_block_wholesale_source_row_edit
BEFORE UPDATE ON wholesale_vehicle_source FOR EACH ROW EXECUTE FUNCTION block_wholesale_source_row_edit();
