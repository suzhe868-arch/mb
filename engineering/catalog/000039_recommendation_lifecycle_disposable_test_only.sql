-- F05-9 physical PG16 recommendation lifecycle: DISPOSABLE_TEST_ONLY, NOT a production issuer.
CREATE TABLE public.f05_recommendation_manage_scope_test(
 employee_id bigint NOT NULL REFERENCES public.employees(employee_id),
 customer_id bigint NOT NULL REFERENCES public.customers(customer_id),
 can_manage boolean NOT NULL CHECK(can_manage=true),
 issuer text NOT NULL DEFAULT 'DISPOSABLE_TEST_ONLY' CHECK(issuer='DISPOSABLE_TEST_ONLY'),
 expires_at timestamptz NOT NULL,
 PRIMARY KEY(employee_id,customer_id)
);
CREATE TABLE public.f05_recommendation_snapshot_test(
 recommendation_id bigint PRIMARY KEY REFERENCES public.recommendations(recommendation_id),
 customer_id bigint NOT NULL REFERENCES public.customers(customer_id),
 vehicle_id bigint NOT NULL REFERENCES public.vehicles(vehicle_id),
 listing_cycle_id bigint NOT NULL,
 customer_price_cents bigint CHECK(customer_price_cents IS NULL OR customer_price_cents>0),
 source_kind text NOT NULL CHECK(source_kind IN ('wholesale','mingbang','four_s')),
 original_recommender bigint NOT NULL REFERENCES public.employees(employee_id),
 original_source_demand bigint REFERENCES public.demands(demand_id),
 created_at timestamptz NOT NULL DEFAULT statement_timestamp(),
 issuer text NOT NULL DEFAULT 'DISPOSABLE_TEST_ONLY' CHECK(issuer='DISPOSABLE_TEST_ONLY'),
 FOREIGN KEY(listing_cycle_id,vehicle_id) REFERENCES public.vehicle_listing_cycles(listing_cycle_id,vehicle_id)
);
CREATE TABLE public.f05_recommendation_events_test(
 event_key text PRIMARY KEY CHECK(event_key ~ '^[A-Za-z0-9_-]{24,64}$'),
 fingerprint text NOT NULL CHECK(fingerprint ~ '^[0-9a-f]{64}$'),
 actor_employee_id bigint NOT NULL REFERENCES public.employees(employee_id),
 recommendation_id bigint NOT NULL REFERENCES public.recommendations(recommendation_id),
 action text NOT NULL CHECK(action IN('CREATE','TOUCH','END','VOID')),
 before_json jsonb,
 after_json jsonb NOT NULL,
 occurred_at timestamptz NOT NULL DEFAULT statement_timestamp()
);
CREATE FUNCTION public.f05_rec_immutable_test() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'F05_REC_IMMUTABLE_TEST' USING ERRCODE='23514'; END $$;
CREATE TRIGGER f05_rec_snapshot_immutable_test BEFORE UPDATE OR DELETE ON public.f05_recommendation_snapshot_test
 FOR EACH ROW EXECUTE FUNCTION public.f05_rec_immutable_test();
CREATE TRIGGER f05_rec_events_immutable_test BEFORE UPDATE OR DELETE ON public.f05_recommendation_events_test
 FOR EACH ROW EXECUTE FUNCTION public.f05_rec_immutable_test();
-- Frozen F02 primary table already has a unique active rec and active grant index.
CREATE VIEW public.f05_recommendation_safe_customer_test AS
 SELECT r.recommendation_id,r.customer_id,r.vehicle_id,r.listing_cycle_id,
   v.platform_visibility,s.customer_price_cents
 FROM public.recommendations r
 JOIN public.f05_recommendation_snapshot_test s ON s.recommendation_id=r.recommendation_id
 JOIN public.customers c ON c.customer_id=r.customer_id AND c.account_status='active'
 JOIN public.f05_find_car_level_entitlement_test e ON e.level_id=c.customer_level_id
  AND e.can_activate_demand=true AND e.issuer='DISPOSABLE_TEST_ONLY'
  AND e.expires_at>statement_timestamp()
 JOIN public.vehicles v ON v.vehicle_id=r.vehicle_id AND v.archived_at IS NULL
   AND ((v.source_type='wholesale' AND v.source_sale_status='active')
      OR (v.source_type IN('mingbang','four_s') AND v.source_sale_status='available'))
 JOIN public.vehicle_listing_cycles cy ON cy.listing_cycle_id=r.listing_cycle_id
  AND cy.vehicle_id=v.vehicle_id AND cy.ended_at IS NULL
 JOIN public.f05_real_catalog_visibility_test vis ON vis.vehicle_id=v.vehicle_id
  AND vis.listing_cycle_id=cy.listing_cycle_id AND vis.source_type=v.source_type
  AND vis.verified_isolation='DISPOSABLE_TEST_PROOF_NOT_SIGNED'
  AND vis.expires_at>statement_timestamp()
 WHERE r.status='active'
 AND (v.platform_visibility='visible' OR EXISTS (
   SELECT 1 FROM public.vehicle_visibility_grants g
   WHERE g.source_recommendation_id=r.recommendation_id AND g.customer_id=r.customer_id
    AND g.vehicle_id=r.vehicle_id AND g.revoked_at IS NULL))
 AND NOT EXISTS(
   SELECT 1 FROM public.priority_leases priority WHERE priority.vehicle_id=r.vehicle_id
   AND priority.listing_cycle_id=r.listing_cycle_id AND priority.status='active'
   AND priority.expires_at>statement_timestamp() AND priority.customer_id<>r.customer_id);
-- Only test-sourced active recommendations gain future hidden grants.
CREATE FUNCTION public.f05_rec_visible_to_hidden_test() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE one_rec record;
BEGIN
 IF NEW.platform_visibility='hidden' AND OLD.platform_visibility<>'hidden' THEN
  FOR one_rec IN
   SELECT r.recommendation_id,r.customer_id FROM public.recommendations r
   JOIN public.f05_recommendation_snapshot_test s ON s.recommendation_id=r.recommendation_id
   JOIN public.vehicle_listing_cycles cy ON cy.listing_cycle_id=r.listing_cycle_id
     AND cy.vehicle_id=r.vehicle_id AND cy.ended_at IS NULL
   WHERE r.vehicle_id=NEW.vehicle_id AND r.status='active'
  LOOP
   INSERT INTO public.vehicle_visibility_grants(vehicle_id,customer_id,source_recommendation_id)
   SELECT NEW.vehicle_id,one_rec.customer_id,one_rec.recommendation_id
   WHERE NOT EXISTS(SELECT 1 FROM public.vehicle_visibility_grants g
    WHERE g.source_recommendation_id=one_rec.recommendation_id AND g.revoked_at IS NULL);
  END LOOP;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER f05_rec_visible_hidden_test AFTER UPDATE OF platform_visibility ON public.vehicles
 FOR EACH ROW EXECUTE FUNCTION public.f05_rec_visible_to_hidden_test();
REVOKE ALL ON public.f05_recommendation_manage_scope_test,public.f05_recommendation_snapshot_test,
 public.f05_recommendation_events_test FROM PUBLIC;
REVOKE ALL ON public.f05_recommendation_safe_customer_test FROM PUBLIC;
