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

-- Every change which could alter validity revokes current Matching immediately.
-- This runs only inside the dedicated disposable CI PG16 schema.
CREATE FUNCTION public.f05_7_revoke_current_on_source_change() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_TABLE_NAME='f05_7_rule_dictionary_ci' THEN
  UPDATE public.f05_7_result_versions_ci SET status='stale' WHERE status='current';
 ELSIF TG_TABLE_NAME='f05_7_sales_condition_ci' THEN
  UPDATE public.f05_7_result_versions_ci SET status='stale' WHERE status='current' AND demand_id=COALESCE(NEW.demand_id,OLD.demand_id);
 ELSIF TG_TABLE_NAME='f05_7_vehicle_facts_ci' THEN
  UPDATE public.f05_7_result_versions_ci SET status='stale' WHERE status='current' AND vehicle_id=COALESCE(NEW.vehicle_id,OLD.vehicle_id) AND listing_cycle_id=COALESCE(NEW.listing_cycle_id,OLD.listing_cycle_id);
 ELSIF TG_TABLE_NAME='demands' THEN
  IF NEW.demand_state IS DISTINCT FROM OLD.demand_state THEN
   UPDATE public.f05_7_result_versions_ci SET status='stale' WHERE status='current' AND demand_id=NEW.demand_id;
  END IF;
 ELSIF TG_TABLE_NAME='customers' THEN
  IF NEW.account_status IS DISTINCT FROM OLD.account_status OR NEW.customer_level_id IS DISTINCT FROM OLD.customer_level_id OR
   NEW.current_owner_employee_id IS DISTINCT FROM OLD.current_owner_employee_id THEN
   UPDATE public.f05_7_result_versions_ci SET status='stale' WHERE status='current' AND demand_id IN
   (SELECT demand_id FROM public.demands WHERE customer_id=NEW.customer_id);
  END IF;
 ELSIF TG_TABLE_NAME='f05_6_level_find_policy_ci' THEN
  IF NEW.find_enabled IS DISTINCT FROM OLD.find_enabled THEN
   UPDATE public.f05_7_result_versions_ci SET status='stale' WHERE status='current' AND demand_id IN
   (SELECT d.demand_id FROM public.demands d JOIN public.customers c ON c.customer_id=d.customer_id WHERE c.customer_level_id=NEW.level_id);
  END IF;
 ELSIF TG_TABLE_NAME='vehicles' THEN
  IF NEW.source_sale_status IS DISTINCT FROM OLD.source_sale_status OR NEW.archived_at IS DISTINCT FROM OLD.archived_at THEN
   UPDATE public.f05_7_result_versions_ci SET status='stale' WHERE status='current' AND vehicle_id=NEW.vehicle_id;
  END IF;
 ELSIF TG_TABLE_NAME='vehicle_listing_cycles' THEN
  IF NEW.ended_at IS DISTINCT FROM OLD.ended_at THEN
   UPDATE public.f05_7_result_versions_ci SET status='stale' WHERE status='current' AND listing_cycle_id=NEW.listing_cycle_id;
  END IF;
 END IF;
 RETURN COALESCE(NEW,OLD);
END $$;
CREATE TRIGGER f05_7_dictionary_revoke AFTER INSERT OR UPDATE OR DELETE ON public.f05_7_rule_dictionary_ci
 FOR EACH ROW EXECUTE FUNCTION public.f05_7_revoke_current_on_source_change();
CREATE TRIGGER f05_7_conditions_revoke AFTER UPDATE OR DELETE ON public.f05_7_sales_condition_ci
 FOR EACH ROW EXECUTE FUNCTION public.f05_7_revoke_current_on_source_change();
CREATE TRIGGER f05_7_facts_revoke AFTER UPDATE OR DELETE ON public.f05_7_vehicle_facts_ci
 FOR EACH ROW EXECUTE FUNCTION public.f05_7_revoke_current_on_source_change();
CREATE TRIGGER f05_7_demand_revoke AFTER UPDATE OF demand_state ON public.demands
 FOR EACH ROW EXECUTE FUNCTION public.f05_7_revoke_current_on_source_change();
CREATE TRIGGER f05_7_customer_revoke AFTER UPDATE OF account_status,customer_level_id,current_owner_employee_id ON public.customers
 FOR EACH ROW EXECUTE FUNCTION public.f05_7_revoke_current_on_source_change();
CREATE TRIGGER f05_7_policy_revoke AFTER UPDATE OF find_enabled ON public.f05_6_level_find_policy_ci
 FOR EACH ROW EXECUTE FUNCTION public.f05_7_revoke_current_on_source_change();
CREATE TRIGGER f05_7_vehicle_revoke AFTER UPDATE OF source_sale_status,archived_at ON public.vehicles
 FOR EACH ROW EXECUTE FUNCTION public.f05_7_revoke_current_on_source_change();
CREATE TRIGGER f05_7_cycle_revoke AFTER UPDATE OF ended_at ON public.vehicle_listing_cycles
 FOR EACH ROW EXECUTE FUNCTION public.f05_7_revoke_current_on_source_change();
