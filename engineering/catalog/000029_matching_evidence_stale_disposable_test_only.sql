-- PDM12: test-only deterministic Match 'stale' on source evidence mutation.
-- Separate from terminal invalidated due to account, Demand, saleability or cycle.
-- Installed after 000028; never install on a real production schema.
CREATE FUNCTION public.f05_match_mark_stale_affected_test(
 p_cause text,p_demand bigint,p_vehicle bigint,p_cycle bigint
) RETURNS integer LANGUAGE plpgsql AS $$
DECLARE hit record; total integer:=0;
BEGIN
 IF p_cause NOT IN ('CUSTOMER_DISPLAY_PRICE','VEHICLE_SOURCE_FACT','SALES_MATCH_DESCRIPTION',
                    'VEHICLE_MODEL_ASSIGNMENT','MASTER_MODEL_FACT','RULE_DICTIONARY_CHANGE')
    OR (p_demand IS NULL AND p_vehicle IS NULL)
    OR (p_cycle IS NOT NULL AND p_vehicle IS NULL)
 THEN RAISE EXCEPTION 'F05_STALE_SCOPE_NOT_AUTHORIZED'; END IF;
 FOR hit IN
  SELECT r.result_id,r.demand_id,r.vehicle_id,r.listing_cycle_id,r.match_tier,r.match_explanation
  FROM public.demand_match_results r
  WHERE r.current_state='current'
   AND (p_demand IS NULL OR r.demand_id=p_demand)
   AND (p_vehicle IS NULL OR r.vehicle_id=p_vehicle)
   AND (p_cycle IS NULL OR r.listing_cycle_id=p_cycle)
  ORDER BY r.result_id FOR UPDATE OF r
 LOOP
  UPDATE public.demand_match_results SET current_state='stale',
   invalidated_at=statement_timestamp() WHERE result_id=hit.result_id AND current_state='current';
  INSERT INTO public.matching_change_events
   (result_id,trigger_kind,before_json,after_json,idempotency_key,occurred_at)
  VALUES(
   hit.result_id,p_cause,
   jsonb_build_object('tier',hit.match_tier,'state','current',
    'demandId',hit.demand_id,'vehicleId',hit.vehicle_id,'listingCycleId',hit.listing_cycle_id,
    'explanation',hit.match_explanation),
   jsonb_build_object('state','stale','reason',p_cause,'requiresRecalculation',true,
    'matchingReady',false,'noRecommendation',true,'noPriority',true,'noVisibilityGrant',true),
   'F05_DISPOSABLE_MATCH_STALE_'||hit.result_id::text,statement_timestamp()
  );
  total:=total+1;
 END LOOP;
 RETURN total;
END $$;

CREATE FUNCTION public.f05_match_on_price_fact_test() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='INSERT' THEN
  PERFORM public.f05_match_mark_stale_affected_test('CUSTOMER_DISPLAY_PRICE',NULL,NEW.vehicle_id,NEW.listing_cycle_id);
 ELSIF TG_OP='DELETE' THEN
  PERFORM public.f05_match_mark_stale_affected_test('CUSTOMER_DISPLAY_PRICE',NULL,OLD.vehicle_id,OLD.listing_cycle_id);
 ELSIF NEW.customer_display_cents IS DISTINCT FROM OLD.customer_display_cents
    OR NEW.expires_at IS DISTINCT FROM OLD.expires_at
    OR NEW.source_type IS DISTINCT FROM OLD.source_type
 THEN
  PERFORM public.f05_match_mark_stale_affected_test('CUSTOMER_DISPLAY_PRICE',NULL,NEW.vehicle_id,NEW.listing_cycle_id);
 END IF;
 RETURN COALESCE(NEW,OLD);
END $$;
CREATE TRIGGER f05_match_price_fact_test AFTER INSERT OR UPDATE OR DELETE
 ON public.f05_catalog_price_display_proof_test FOR EACH ROW
 EXECUTE FUNCTION public.f05_match_on_price_fact_test();

CREATE FUNCTION public.f05_match_on_vehicle_fact_test() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='INSERT' THEN
  PERFORM public.f05_match_mark_stale_affected_test('VEHICLE_SOURCE_FACT',NULL,NEW.vehicle_id,NEW.listing_cycle_id);
 ELSIF TG_OP='DELETE' THEN
  PERFORM public.f05_match_mark_stale_affected_test('VEHICLE_SOURCE_FACT',NULL,OLD.vehicle_id,OLD.listing_cycle_id);
 ELSIF (NEW.source_brand_id,NEW.source_model_year,NEW.mileage_km,NEW.interior_color,NEW.expires_at)
    IS DISTINCT FROM (OLD.source_brand_id,OLD.source_model_year,OLD.mileage_km,OLD.interior_color,OLD.expires_at)
 THEN
  PERFORM public.f05_match_mark_stale_affected_test('VEHICLE_SOURCE_FACT',NULL,NEW.vehicle_id,NEW.listing_cycle_id);
 END IF;
 RETURN COALESCE(NEW,OLD);
END $$;
CREATE TRIGGER f05_match_vehicle_fact_test AFTER INSERT OR UPDATE OR DELETE
 ON public.f05_matching_vehicle_facts_test FOR EACH ROW
 EXECUTE FUNCTION public.f05_match_on_vehicle_fact_test();

CREATE FUNCTION public.f05_match_on_sales_description_test() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='INSERT' THEN
  PERFORM public.f05_match_mark_stale_affected_test('SALES_MATCH_DESCRIPTION',NEW.demand_id,NULL,NULL);
 ELSIF TG_OP='DELETE' THEN
  PERFORM public.f05_match_mark_stale_affected_test('SALES_MATCH_DESCRIPTION',OLD.demand_id,NULL,NULL);
 ELSIF (NEW.sales_description,NEW.written_by_employee_id,NEW.expires_at)
    IS DISTINCT FROM (OLD.sales_description,OLD.written_by_employee_id,OLD.expires_at)
 THEN
  PERFORM public.f05_match_mark_stale_affected_test('SALES_MATCH_DESCRIPTION',NEW.demand_id,NULL,NULL);
 END IF;
 RETURN COALESCE(NEW,OLD);
END $$;
CREATE TRIGGER f05_match_sales_description_test AFTER INSERT OR UPDATE OR DELETE
 ON public.f05_matching_sales_description_test FOR EACH ROW
 EXECUTE FUNCTION public.f05_match_on_sales_description_test();

CREATE FUNCTION public.f05_match_on_vehicle_model_assignment_test() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.model_id IS DISTINCT FROM OLD.model_id
 THEN PERFORM public.f05_match_mark_stale_affected_test('VEHICLE_MODEL_ASSIGNMENT',NULL,NEW.vehicle_id,NULL); END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER f05_match_vehicle_model_assignment_test AFTER UPDATE OF model_id
 ON public.vehicles FOR EACH ROW
 EXECUTE FUNCTION public.f05_match_on_vehicle_model_assignment_test();

CREATE FUNCTION public.f05_match_on_master_model_fact_test() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE affected record;
BEGIN
 IF NEW.brand_id IS DISTINCT FROM OLD.brand_id OR NEW.model_year IS DISTINCT FROM OLD.model_year
 THEN
  FOR affected IN SELECT v.vehicle_id FROM public.vehicles v WHERE v.model_id=NEW.model_id
   AND EXISTS(SELECT 1 FROM public.demand_match_results r WHERE r.vehicle_id=v.vehicle_id AND r.current_state='current')
   ORDER BY v.vehicle_id
  LOOP
   PERFORM public.f05_match_mark_stale_affected_test('MASTER_MODEL_FACT',NULL,affected.vehicle_id,NULL);
  END LOOP;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER f05_match_master_model_fact_test AFTER UPDATE OF brand_id,model_year
 ON public.vehicle_models FOR EACH ROW
 EXECUTE FUNCTION public.f05_match_on_master_model_fact_test();
