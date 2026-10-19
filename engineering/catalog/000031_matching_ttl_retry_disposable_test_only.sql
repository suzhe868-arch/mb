-- PDM-12: disposable-only read-time validity, bounded TTL sweep and affected-pair retry queue.
-- PDM-12 Final §§21-30. This is NOT a formal Rule Dictionary or production issuer.
-- Every future current-result consumer must use this guarded projection, never raw current_state.
CREATE VIEW public.f05_matching_safe_current_test AS
SELECT r.result_id,r.demand_id,r.vehicle_id,r.listing_cycle_id,r.match_tier
FROM public.demand_match_results r
JOIN public.demands d ON d.demand_id=r.demand_id AND d.demand_state='active'
JOIN public.customers c ON c.customer_id=d.customer_id AND c.account_status='active'
 AND c.owner_assignment_state='assigned'
 AND c.current_owner_employee_id IS NOT NULL
JOIN public.f05_find_car_level_entitlement_test ent ON ent.level_id=c.customer_level_id
 AND ent.issuer='DISPOSABLE_TEST_ONLY' AND ent.can_activate_demand=true
 AND ent.expires_at>statement_timestamp()
JOIN public.f05_matching_sales_description_test descr ON descr.demand_id=d.demand_id
 AND descr.issuer='DISPOSABLE_TEST_ONLY' AND descr.written_by_employee_id=d.responsible_employee_id
 AND descr.expires_at>statement_timestamp()
JOIN public.f05_matching_employee_scope_test scope ON scope.employee_id=d.responsible_employee_id
 AND scope.customer_id=c.customer_id AND scope.can_recompute=true
 AND scope.issuer='DISPOSABLE_TEST_ONLY' AND scope.expires_at>statement_timestamp()
JOIN public.employees e ON e.employee_id=d.responsible_employee_id AND e.employment_status='active'
JOIN public.roles role ON role.role_id=e.main_role_id
 AND role.role_code IN ('sales','manager','store_head')
JOIN public.vehicles v ON v.vehicle_id=r.vehicle_id AND v.archived_at IS NULL
 AND ((v.source_type='wholesale' AND v.source_sale_status='active')
   OR (v.source_type IN ('mingbang','four_s') AND v.source_sale_status='available'))
JOIN public.vehicle_listing_cycles cyc ON cyc.listing_cycle_id=r.listing_cycle_id
 AND cyc.vehicle_id=v.vehicle_id AND cyc.ended_at IS NULL
JOIN public.f05_real_catalog_visibility_test visible ON visible.vehicle_id=v.vehicle_id
 AND visible.listing_cycle_id=cyc.listing_cycle_id AND visible.source_type=v.source_type
 AND visible.verified_isolation='DISPOSABLE_TEST_PROOF_NOT_SIGNED'
 AND visible.expires_at>statement_timestamp()
JOIN public.f05_matching_vehicle_facts_test facts ON facts.vehicle_id=v.vehicle_id
 AND facts.listing_cycle_id=cyc.listing_cycle_id
 AND facts.issuer='DISPOSABLE_TEST_ONLY' AND facts.expires_at>statement_timestamp()
JOIN public.f05_catalog_price_display_proof_test price ON price.vehicle_id=v.vehicle_id
 AND price.listing_cycle_id=cyc.listing_cycle_id AND price.source_type=v.source_type
 AND price.issuer='DISPOSABLE_TEST_ONLY' AND price.expires_at>statement_timestamp()
WHERE r.current_state='current'
 AND r.match_explanation->'sourceFacts'->>'issuer'='DISPOSABLE_TEST_ONLY';

-- Bounded pair queue: failed pairs cannot roll back successful pairs. Never carries credentials.
CREATE TABLE public.f05_matching_affected_queue_test (
 demand_id bigint NOT NULL REFERENCES public.demands(demand_id) ON DELETE RESTRICT,
 vehicle_id bigint NOT NULL REFERENCES public.vehicles(vehicle_id) ON DELETE RESTRICT,
 generation bigint NOT NULL DEFAULT 1 CHECK(generation>0),
 reason text NOT NULL CHECK(length(reason) BETWEEN 1 AND 80),
 state text NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','processing','done','failed')),
 attempts integer NOT NULL DEFAULT 0 CHECK(attempts BETWEEN 0 AND 5),
 next_attempt_at timestamptz NOT NULL DEFAULT statement_timestamp(),
 lease_until timestamptz,
 last_error text CHECK(last_error IS NULL OR length(last_error)<=120),
 modified_at timestamptz NOT NULL DEFAULT statement_timestamp(),
 PRIMARY KEY(demand_id,vehicle_id)
);
REVOKE ALL ON public.f05_matching_affected_queue_test FROM PUBLIC;
CREATE FUNCTION public.f05_match_enqueue_changed_pair_test()
RETURNS trigger LANGUAGE plpgsql AS $f05queue$
BEGIN
 IF OLD.current_state='current' AND NEW.current_state IN ('stale','invalidated') THEN
  INSERT INTO public.f05_matching_affected_queue_test(demand_id,vehicle_id,reason)
  VALUES(NEW.demand_id,NEW.vehicle_id,NEW.current_state)
  ON CONFLICT(demand_id,vehicle_id) DO UPDATE SET
    generation=public.f05_matching_affected_queue_test.generation+1,
    reason=excluded.reason,state='pending',attempts=0,lease_until=NULL,last_error=NULL,
    next_attempt_at=statement_timestamp(),modified_at=statement_timestamp();
 END IF;
 RETURN NEW;
END $f05queue$;
CREATE TRIGGER f05_match_queue_affected_test AFTER UPDATE OF current_state
 ON public.demand_match_results FOR EACH ROW
 EXECUTE FUNCTION public.f05_match_enqueue_changed_pair_test();

-- This view is safe before the sweep runs; the sweep only cleans old raw current rows.
-- It is bounded, SKIP LOCKED, atomic per transaction and produces immutable source change facts.
CREATE FUNCTION public.f05_match_sweep_unusable_test(p_limit integer DEFAULT 50)
RETURNS integer LANGUAGE plpgsql AS $f05ttl$
DECLARE hit record; total integer:=0;
BEGIN
 IF p_limit IS NULL OR p_limit<1 OR p_limit>200
 THEN RAISE EXCEPTION 'F05_TTL_BATCH_LIMIT_INVALID'; END IF;
 FOR hit IN
  SELECT r.result_id,r.demand_id,r.vehicle_id,r.listing_cycle_id,r.match_tier,r.match_explanation
   FROM public.demand_match_results r
   WHERE r.current_state='current'
    AND NOT EXISTS (SELECT 1 FROM public.f05_matching_safe_current_test safe
                    WHERE safe.result_id=r.result_id)
   ORDER BY r.result_id LIMIT p_limit FOR UPDATE OF r SKIP LOCKED
 LOOP
  UPDATE public.demand_match_results SET current_state='stale',invalidated_at=statement_timestamp()
   WHERE result_id=hit.result_id AND current_state='current';
  INSERT INTO public.matching_change_events
   (result_id,trigger_kind,before_json,after_json,idempotency_key,occurred_at)
  VALUES(hit.result_id,'EVIDENCE_EXPIRED_OR_REVOKED',
   jsonb_build_object('tier',hit.match_tier,'state','current',
    'demandId',hit.demand_id,'vehicleId',hit.vehicle_id,'listingCycleId',hit.listing_cycle_id,
    'explanation',hit.match_explanation),
   jsonb_build_object('state','stale','reason','EVIDENCE_EXPIRED_OR_REVOKED',
    'requiresRecalculation',true,'matchingReady',false,
    'noRecommendation',true,'noPriority',true,'noVisibilityGrant',true),
   'F05_DISPOSABLE_MATCH_TTL_'||hit.result_id::text,statement_timestamp());
  total:=total+1;
 END LOOP;
 RETURN total;
END $f05ttl$;
