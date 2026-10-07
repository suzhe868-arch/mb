-- CR-006 dictionary import for the repaired 316-brand formal set.
-- Run with psql from this seed directory so relative CSV paths resolve.
-- The 87 pending brands are intentionally NOT imported into the formal master tables.

\set ON_ERROR_STOP on
BEGIN;

CREATE TEMP TABLE stg_vehicle_brands (
  brand_id BIGINT,
  brand_name TEXT,
  match_status TEXT,
  match_source TEXT,
  match_confidence NUMERIC,
  status TEXT,
  series_count INTEGER,
  model_count INTEGER
);
CREATE TEMP TABLE stg_vehicle_series (
  brand_id BIGINT,
  brand_name TEXT,
  series_id BIGINT,
  series_name TEXT,
  first_letter TEXT,
  brand_match_status TEXT,
  brand_match_confidence NUMERIC
);
CREATE TEMP TABLE stg_vehicle_models (
  brand_id BIGINT,
  brand_name TEXT,
  series_id BIGINT,
  series_name TEXT,
  model_id BIGINT,
  model_year INTEGER,
  model_name TEXT,
  guiding_price NUMERIC,
  brand_match_status TEXT,
  brand_match_confidence NUMERIC
);

\copy stg_vehicle_brands FROM 'vehicle_brands_316.csv' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8');
\copy stg_vehicle_series FROM 'vehicle_series_316.csv' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8');
\copy stg_vehicle_models FROM 'vehicle_models_316.csv' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8');

-- Local IDs intentionally equal the JYT dictionary IDs for this initial import.
-- Code must still resolve through source mappings; numeric equality is an import convenience, not a semantic contract.
INSERT INTO vehicle_brands(brand_id,brand_name,status,updated_at)
SELECT brand_id,brand_name,'active',now()
FROM stg_vehicle_brands
ON CONFLICT (brand_id) DO UPDATE SET
  brand_name=EXCLUDED.brand_name,
  status='active',
  updated_at=now(),
  version=vehicle_brands.version+1;

INSERT INTO vehicle_brand_source_mappings(
  source_platform,upstream_brand_id,brand_id,match_status,match_source,match_confidence,human_locked,updated_at
)
SELECT
  'jyt', brand_id::text, brand_id, match_status, match_source, match_confidence,
  (match_status='USER_CONFIRMED'), now()
FROM stg_vehicle_brands
ON CONFLICT (source_platform,upstream_brand_id) DO UPDATE SET
  brand_id=EXCLUDED.brand_id,
  match_status=EXCLUDED.match_status,
  match_source=EXCLUDED.match_source,
  match_confidence=EXCLUDED.match_confidence,
  human_locked=EXCLUDED.human_locked,
  updated_at=now();

INSERT INTO vehicle_series(series_id,brand_id,series_name,first_letter,status,updated_at)
SELECT series_id,brand_id,series_name,NULLIF(first_letter,''),'active',now()
FROM stg_vehicle_series
ON CONFLICT (series_id) DO UPDATE SET
  brand_id=EXCLUDED.brand_id,
  series_name=EXCLUDED.series_name,
  first_letter=EXCLUDED.first_letter,
  status='active',
  updated_at=now(),
  version=vehicle_series.version+1;

INSERT INTO vehicle_series_source_mappings(
  source_platform,upstream_series_id,series_id,upstream_brand_id,match_status,match_confidence,human_locked,updated_at
)
SELECT
  'jyt', series_id::text, series_id, brand_id::text, brand_match_status, brand_match_confidence,
  (brand_match_status='USER_CONFIRMED'), now()
FROM stg_vehicle_series
ON CONFLICT (source_platform,upstream_series_id) DO UPDATE SET
  series_id=EXCLUDED.series_id,
  upstream_brand_id=EXCLUDED.upstream_brand_id,
  match_status=EXCLUDED.match_status,
  match_confidence=EXCLUDED.match_confidence,
  human_locked=EXCLUDED.human_locked,
  updated_at=now();

INSERT INTO vehicle_models(
  model_id,brand_id,series_id,model_year,model_name,guiding_price_cents,profile_status,updated_at
)
SELECT
  model_id,
  brand_id,
  series_id,
  model_year,
  model_name,
  CASE
    WHEN guiding_price IS NULL OR guiding_price=0 THEN NULL
    ELSE round(guiding_price * 1000000)::BIGINT
  END,
  'partial',
  now()
FROM stg_vehicle_models
ON CONFLICT (model_id) DO UPDATE SET
  brand_id=EXCLUDED.brand_id,
  series_id=EXCLUDED.series_id,
  model_year=EXCLUDED.model_year,
  model_name=EXCLUDED.model_name,
  guiding_price_cents=EXCLUDED.guiding_price_cents,
  updated_at=now(),
  version=vehicle_models.version+1;

INSERT INTO vehicle_model_source_mappings(
  source_platform,upstream_model_id,model_id,match_method,match_confidence,human_locked,updated_at
)
SELECT
  'jyt', model_id::text, model_id, 'dictionary_import', brand_match_confidence,
  (brand_match_status='USER_CONFIRMED'), now()
FROM stg_vehicle_models
ON CONFLICT (source_platform,upstream_model_id) DO UPDATE SET
  model_id=EXCLUDED.model_id,
  match_method=EXCLUDED.match_method,
  match_confidence=EXCLUDED.match_confidence,
  human_locked=EXCLUDED.human_locked,
  updated_at=now(),
  version=vehicle_model_source_mappings.version+1;

-- Explicitly advance identity sequences after inserting source IDs.
SELECT setval(pg_get_serial_sequence('vehicle_brands','brand_id'), COALESCE((SELECT MAX(brand_id) FROM vehicle_brands),1), true);
SELECT setval(pg_get_serial_sequence('vehicle_series','series_id'), COALESCE((SELECT MAX(series_id) FROM vehicle_series),1), true);
SELECT setval(pg_get_serial_sequence('vehicle_models','model_id'), COALESCE((SELECT MAX(model_id) FROM vehicle_models),1), true);

COMMIT;

-- Post-import invariants: all should return 0 rows or the exact expected counts.
SELECT COUNT(*) AS brands FROM vehicle_brands;
SELECT COUNT(*) AS series FROM vehicle_series;
SELECT COUNT(*) AS models FROM vehicle_models;
SELECT COUNT(*) AS broken_series_fk
FROM vehicle_series s LEFT JOIN vehicle_brands b ON b.brand_id=s.brand_id
WHERE b.brand_id IS NULL;
SELECT COUNT(*) AS broken_model_fk
FROM vehicle_models m LEFT JOIN vehicle_series s ON s.series_id=m.series_id
WHERE s.series_id IS NULL;
SELECT COUNT(*) AS zero_guiding_price_should_be_null
FROM vehicle_models WHERE guiding_price_cents=0;
