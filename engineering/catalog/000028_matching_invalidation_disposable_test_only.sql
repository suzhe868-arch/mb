-- PDM-12 event-driven current Match Result invalidation, disposable PG16 only.
-- Never install this test trigger set in formal M94 or production. No unverified issuer.
-- Match Result remains a candidate fact, never grants Recommendation/Priority/Lock.
CREATE FUNCTION public.f05_match_invalidate_affected_test(
 p_cause text,p_customer bigint,p_demand bigint,p_vehicle bigint,p_cycle bigint
) RETURNS integer LANGUAGE plpgsql AS $$
DECLARE hit record; total integer:=0;
BEGIN
 IF p_cause NOT IN ('CUSTOMER_ACCOUNT_OR_LEVEL','DEMAND_STATE',
                    'VEHICLE_SALEABILITY','LISTING_CYCLE','LEVEL_ENTITLEMENT',
                    'DEMAND_RESPONSIBLE_CHANGED','EMPLOYEE_MATCH_AUTHORITY_CHANGED')
    OR (p_customer IS NULL AND p_demand IS NULL AND p_vehicle IS NULL AND p_cycle IS NULL)
 THEN RAISE EXCEPTION 'F05_INVALIDATION_SCOPE_NOT_AUTHORIZED'; END IF;
 FOR hit IN
  SELECT r.result_id,r.demand_id,r.vehicle_id,r.listing_cycle_id,r.match_tier,r.match_explanation
  FROM public.demand_match_results r
  WHERE r.current_state='current'
   AND (p_customer IS NULL OR EXISTS(
    SELECT 1 FROM public.demands d WHERE d.demand_id=r.demand_id AND d.customer_id=p_customer))
   AND (p_demand IS NULL OR r.demand_id=p_demand)
   AND (p_vehicle IS NULL OR r.vehicle_id=p_vehicle)
   AND (p_cycle IS NULL OR r.listing_cycle_id=p_cycle)
  ORDER BY r.result_id FOR UPDATE OF r
 LOOP
  UPDATE public.demand_match_results
   SET current_state='invalidated',invalidated_at=statement_timestamp()
   WHERE result_id=hit.result_id AND current_state='current';
  INSERT INTO public.matching_change_events
   (result_id,trigger_kind,before_json,after_json,idempotency_key,occurred_at)
  VALUES (
   hit.result_id,p_cause,
   jsonb_build_object('tier',hit.match_tier,'state','current',
                      'demandId',hit.demand_id,'vehicleId',hit.vehicle_id,
                      'listingCycleId',hit.listing_cycle_id,
                      'explanation',hit.match_explanation),
   jsonb_build_object('state','invalidated','reason',p_cause,
                      'requiresRecalculation',true,'matchingReady',false,
                      'noRecommendation',true,'noPriority',true,'noVisibilityGrant',true),
   'F05_DISPOSABLE_MATCH_INVALIDATED_'||hit.result_id::text,
   statement_timestamp()
  );
  total:=total+1;
 END LOOP;
 RETURN total;
END $$;

CREATE FUNCTION public.f05_match_on_customer_guard_test() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.account_status IS DISTINCT FROM OLD.account_status
    OR NEW.customer_level_id IS DISTINCT FROM OLD.customer_level_id
 THEN
  PERFORM public.f05_match_invalidate_affected_test(
   'CUSTOMER_ACCOUNT_OR_LEVEL',NEW.customer_id,NULL,NULL,NULL);
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER f05_match_customer_guard_test AFTER UPDATE OF account_status,customer_level_id
 ON public.customers FOR EACH ROW EXECUTE FUNCTION public.f05_match_on_customer_guard_test();

CREATE FUNCTION public.f05_match_on_demand_lifecycle_test() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.demand_state IS DISTINCT FROM OLD.demand_state
 THEN
  PERFORM public.f05_match_invalidate_affected_test(
   'DEMAND_STATE',NULL,NEW.demand_id,NULL,NULL);
 ELSIF NEW.responsible_employee_id IS DISTINCT FROM OLD.responsible_employee_id
 THEN
  -- A formal PDM-11 Demand reassignment, not an unrelated Customer Owner
  -- handover, invalidates previously signed/current matching authority.
  PERFORM public.f05_match_invalidate_affected_test(
   'DEMAND_RESPONSIBLE_CHANGED',NULL,NEW.demand_id,NULL,NULL);
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER f05_match_demand_lifecycle_test AFTER UPDATE OF demand_state,responsible_employee_id
 ON public.demands FOR EACH ROW EXECUTE FUNCTION public.f05_match_on_demand_lifecycle_test();

CREATE FUNCTION public.f05_match_on_vehicle_saleability_test() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.source_sale_status IS DISTINCT FROM OLD.source_sale_status
    OR NEW.archived_at IS DISTINCT FROM OLD.archived_at
 THEN PERFORM public.f05_match_invalidate_affected_test(
    'VEHICLE_SALEABILITY',NULL,NULL,NEW.vehicle_id,NULL); END IF;
 RETURN NEW;
END $$;
-- platform_visibility intentionally excluded: hidden alone must keep internal matching.
CREATE TRIGGER f05_match_vehicle_saleability_test AFTER UPDATE OF source_sale_status,archived_at
 ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.f05_match_on_vehicle_saleability_test();

CREATE FUNCTION public.f05_match_on_cycle_test() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.ended_at IS DISTINCT FROM OLD.ended_at
 THEN PERFORM public.f05_match_invalidate_affected_test(
    'LISTING_CYCLE',NULL,NULL,NEW.vehicle_id,NEW.listing_cycle_id); END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER f05_match_listing_cycle_test AFTER UPDATE OF ended_at
 ON public.vehicle_listing_cycles FOR EACH ROW EXECUTE FUNCTION public.f05_match_on_cycle_test();

CREATE FUNCTION public.f05_match_on_level_entitlement_test() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE row_d record;
BEGIN
 IF NEW.can_activate_demand IS DISTINCT FROM OLD.can_activate_demand
 THEN
  FOR row_d IN SELECT d.demand_id FROM public.demands d
   JOIN public.customers c ON c.customer_id=d.customer_id
   WHERE c.customer_level_id=NEW.level_id AND d.demand_state='active'
   ORDER BY d.demand_id
  LOOP
   PERFORM public.f05_match_invalidate_affected_test(
    'LEVEL_ENTITLEMENT',NULL,row_d.demand_id,NULL,NULL);
  END LOOP;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER f05_match_level_entitlement_test AFTER UPDATE OF can_activate_demand
 ON public.f05_find_car_level_entitlement_test FOR EACH ROW
 EXECUTE FUNCTION public.f05_match_on_level_entitlement_test();

-- Employee demotion or deactivation invalidates every frozen current Match
-- whose responsible employee is affected. This is a TEST-ONLY carrier and
-- never elevates a role/permission from a synthetic fixture to formal F03.
CREATE FUNCTION public.f05_match_on_employee_authority_test() RETURNS trigger LANGUAGE plpgsql AS $f05employee$
DECLARE affected record;
BEGIN
 IF NEW.main_role_id IS DISTINCT FROM OLD.main_role_id
   OR NEW.employment_status IS DISTINCT FROM OLD.employment_status
 THEN
  FOR affected IN
   SELECT d.demand_id FROM public.demands d
   WHERE d.responsible_employee_id=NEW.employee_id
    AND EXISTS(SELECT 1 FROM public.demand_match_results r
      WHERE r.demand_id=d.demand_id AND r.current_state='current')
   ORDER BY d.demand_id
  LOOP
   PERFORM public.f05_match_invalidate_affected_test(
    'EMPLOYEE_MATCH_AUTHORITY_CHANGED',NULL,affected.demand_id,NULL,NULL);
  END LOOP;
 END IF;
 RETURN NEW;
END $f05employee$;
CREATE TRIGGER f05_match_employee_authority_test
 AFTER UPDATE OF main_role_id,employment_status ON public.employees
 FOR EACH ROW EXECUTE FUNCTION public.f05_match_on_employee_authority_test();

-- Test-only append-only audit for frozen PDM-12 matching_change_events. Fail closed.
CREATE FUNCTION public.f05_matching_change_audit_immutable_test() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'F05_MATCHING_CHANGE_EVENT_IMMUTABLE' USING ERRCODE='23514'; END $$;
CREATE TRIGGER f05_matching_change_events_append_only_test
 BEFORE UPDATE OR DELETE ON public.matching_change_events FOR EACH ROW
 EXECUTE FUNCTION public.f05_matching_change_audit_immutable_test();
