-- F05-7 CI-only schema additive above signed v22, NOT a production migration.
CREATE TABLE public.f05_7_rule_dictionary_ci(
 rule_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 phrase TEXT NOT NULL CHECK(length(trim(phrase)) BETWEEN 2 AND 150),
 scope_kind TEXT NOT NULL CHECK(scope_kind IN ('global','brand','series','series_year','model_year')),
 scope_key TEXT,
 condition_json JSONB NOT NULL CHECK(jsonb_typeof(condition_json)='object'),
 rule_version BIGINT NOT NULL DEFAULT 1 CHECK(rule_version>0),
 valid_from TIMESTAMPTZ NOT NULL DEFAULT transaction_timestamp(),
 valid_until TIMESTAMPTZ,
 source_marker TEXT NOT NULL DEFAULT 'CI_SYNTHETIC_RULE_DICTIONARY_NOT_PRODUCTION'
 CHECK(source_marker='CI_SYNTHETIC_RULE_DICTIONARY_NOT_PRODUCTION'),
 CHECK(valid_until IS NULL OR valid_until>valid_from)
);
CREATE TABLE public.f05_7_sales_condition_ci(
 demand_id BIGINT PRIMARY KEY REFERENCES public.demands(demand_id),
 actor_employee_id BIGINT NOT NULL REFERENCES public.employees(employee_id),
 sales_description TEXT NOT NULL CHECK(length(trim(sales_description)) BETWEEN 2 AND 1024),
 condition_json JSONB NOT NULL CHECK(jsonb_typeof(condition_json)='array'),
 conflict_json JSONB NOT NULL DEFAULT '[]'::jsonb CHECK(jsonb_typeof(conflict_json)='array'),
 description_version BIGINT NOT NULL DEFAULT 1 CHECK(description_version>0),
 rule_version_sha256 TEXT NOT NULL CHECK(rule_version_sha256 ~ '^[0-9a-f]{64}$'),
 source_marker TEXT NOT NULL DEFAULT 'CI_SYNTHETIC_SALES_DESCRIPTION_NOT_PRODUCTION'
 CHECK(source_marker='CI_SYNTHETIC_SALES_DESCRIPTION_NOT_PRODUCTION')
);
CREATE TABLE public.f05_7_vehicle_facts_ci(
 vehicle_id BIGINT NOT NULL REFERENCES public.vehicles(vehicle_id),
 listing_cycle_id BIGINT NOT NULL REFERENCES public.vehicle_listing_cycles(listing_cycle_id),
 facts_json JSONB NOT NULL CHECK(jsonb_typeof(facts_json)='object'),
 fact_version BIGINT NOT NULL DEFAULT 1 CHECK(fact_version>0),
 available BOOLEAN NOT NULL DEFAULT true,
 source_marker TEXT NOT NULL DEFAULT 'CI_SYNTHETIC_VEHICLE_FACTS_NOT_PRODUCTION'
 CHECK(source_marker='CI_SYNTHETIC_VEHICLE_FACTS_NOT_PRODUCTION'),
 PRIMARY KEY(vehicle_id,listing_cycle_id),
 UNIQUE(vehicle_id,listing_cycle_id,fact_version)
);
CREATE TABLE public.f05_7_result_versions_ci(
 result_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 demand_id BIGINT NOT NULL REFERENCES public.demands(demand_id),
 vehicle_id BIGINT NOT NULL REFERENCES public.vehicles(vehicle_id),
 listing_cycle_id BIGINT NOT NULL REFERENCES public.vehicle_listing_cycles(listing_cycle_id),
 tier TEXT NOT NULL CHECK(tier IN ('high','acceptable','confirmation_needed','no_match')),
 status TEXT NOT NULL CHECK(status IN ('current','stale')),
 source_signature TEXT NOT NULL CHECK(source_signature ~ '^[0-9a-f]{64}$'),
 explanations JSONB NOT NULL CHECK(jsonb_typeof(explanations)='array'),
 reason TEXT NOT NULL,
 run_key TEXT NOT NULL UNIQUE CHECK(length(run_key) BETWEEN 16 AND 160),
 source_marker TEXT NOT NULL DEFAULT 'CI_SYNTHETIC_MATCHING_INPUTS_NOT_PRODUCTION'
 CHECK(source_marker='CI_SYNTHETIC_MATCHING_INPUTS_NOT_PRODUCTION'),
 recorded_at TIMESTAMPTZ NOT NULL DEFAULT transaction_timestamp(),
 txid BIGINT NOT NULL DEFAULT txid_current()
);
CREATE UNIQUE INDEX f05_7_one_current_result_ci ON public.f05_7_result_versions_ci(demand_id,vehicle_id,listing_cycle_id)
 WHERE status='current';
CREATE FUNCTION public.f05_7_history_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_TABLE_NAME='f05_7_result_versions_ci' AND TG_OP='UPDATE'
    AND OLD.status='current' AND NEW.status='stale' AND
    (to_jsonb(NEW)-'status')=(to_jsonb(OLD)-'status') THEN RETURN NEW; END IF;
 RAISE EXCEPTION 'F05_7_SIGNED_MATCH_HISTORY_IMMUTABLE' USING ERRCODE='23514';
END $$;
CREATE TRIGGER f05_7_result_only_current_to_stale BEFORE UPDATE OR DELETE ON public.f05_7_result_versions_ci
 FOR EACH ROW EXECUTE FUNCTION public.f05_7_history_guard();
CREATE TABLE public.f05_7_migration_attestation(
 seal_key TEXT PRIMARY KEY CHECK(seal_key='M94_TO_V22_SIGNED_LEDGER'),
 preceding_records_sha256 TEXT NOT NULL CHECK(preceding_records_sha256 ~ '^[0-9a-f]{64}$'),
 prior_checksum_sha256 TEXT NOT NULL CHECK(prior_checksum_sha256 ~ '^[0-9a-f]{64}$'),
 prior_structure_sha256 TEXT NOT NULL CHECK(prior_structure_sha256 ~ '^[0-9a-f]{64}$')
);
CREATE TRIGGER f05_7_attestation_immutable BEFORE UPDATE OR DELETE ON public.f05_7_migration_attestation
 FOR EACH ROW EXECUTE FUNCTION public.f05_7_history_guard();
REVOKE ALL ON public.f05_7_rule_dictionary_ci,public.f05_7_sales_condition_ci,public.f05_7_vehicle_facts_ci,public.f05_7_result_versions_ci,public.f05_7_migration_attestation FROM PUBLIC;
