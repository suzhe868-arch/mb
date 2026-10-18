-- F05-8 PDM13 scoped operational slice. DISPOSABLE_TEST_ONLY, not five-source production authority.
CREATE TABLE public.f05_priority_qualification_test(
 customer_id bigint PRIMARY KEY REFERENCES public.customers(customer_id),
 enabled boolean NOT NULL,
 expires_at timestamptz NOT NULL,
 issuer text NOT NULL DEFAULT 'DISPOSABLE_TEST_ONLY' CHECK(issuer='DISPOSABLE_TEST_ONLY')
);
CREATE TABLE public.f05_priority_employee_scope_test(
 employee_id bigint NOT NULL REFERENCES public.employees(employee_id),
 customer_id bigint NOT NULL REFERENCES public.customers(customer_id),
 can_manage boolean NOT NULL CHECK(can_manage=true),
 expires_at timestamptz NOT NULL,
 issuer text NOT NULL DEFAULT 'DISPOSABLE_TEST_ONLY' CHECK(issuer='DISPOSABLE_TEST_ONLY'),
 PRIMARY KEY(employee_id,customer_id)
);
CREATE TABLE public.f05_priority_config_test(
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
 ttl_seconds integer NOT NULL DEFAULT 86400 CHECK(ttl_seconds BETWEEN 60 AND 2592000)
);
INSERT INTO public.f05_priority_config_test(singleton) VALUES(true);
CREATE TABLE public.f05_priority_suppression_test(
 customer_id bigint NOT NULL REFERENCES public.customers(customer_id),
 vehicle_id bigint NOT NULL REFERENCES public.vehicles(vehicle_id),
 listing_cycle_id bigint NOT NULL,
 source_match_result_id bigint NOT NULL REFERENCES public.demand_match_results(result_id),
 reason text NOT NULL CHECK(reason IN('employee_released','ttl_expired')),
 created_at timestamptz NOT NULL DEFAULT statement_timestamp(),
 PRIMARY KEY(customer_id,vehicle_id,listing_cycle_id,source_match_result_id),
 FOREIGN KEY(listing_cycle_id,vehicle_id) REFERENCES public.vehicle_listing_cycles(listing_cycle_id,vehicle_id)
);
CREATE TABLE public.f05_priority_events_test(
 event_key text PRIMARY KEY CHECK(event_key ~ '^[A-Za-z0-9_-]{24,64}$'),
 actor_employee_id bigint NOT NULL REFERENCES public.employees(employee_id),
 payload_sha256 text NOT NULL CHECK(payload_sha256 ~ '^[a-f0-9]{64}$'),
 vehicle_id bigint NOT NULL REFERENCES public.vehicles(vehicle_id),
 action text NOT NULL CHECK(action IN('RECONCILE','RELEASE')),
 source_priority_id bigint REFERENCES public.priority_leases(priority_id),
 outcome text NOT NULL CHECK(outcome IN('NEW','UNCHANGED','ENDED','REARBITRATED','NO_CANDIDATE')),
 occurred_at timestamptz NOT NULL DEFAULT statement_timestamp()
);
CREATE FUNCTION public.f05_priority_append_only_test() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'F05_PRIORITY_AUDIT_IMMUTABLE' USING ERRCODE='23514'; END $$;
CREATE TRIGGER f05_priority_events_immutable_test BEFORE UPDATE OR DELETE ON public.f05_priority_events_test
 FOR EACH ROW EXECUTE FUNCTION public.f05_priority_append_only_test();
CREATE TRIGGER f05_priority_suppression_immutable_test BEFORE UPDATE OR DELETE ON public.f05_priority_suppression_test
 FOR EACH ROW EXECUTE FUNCTION public.f05_priority_append_only_test();
CREATE FUNCTION public.f05_priority_core_guard_test() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'F05_PRIORITY_HISTORY_DELETE_DENIED' USING ERRCODE='23514'; END IF;
 IF TG_OP='UPDATE' THEN
  IF OLD.priority_id IS DISTINCT FROM NEW.priority_id OR OLD.customer_id IS DISTINCT FROM NEW.customer_id OR
    OLD.vehicle_id IS DISTINCT FROM NEW.vehicle_id OR OLD.listing_cycle_id IS DISTINCT FROM NEW.listing_cycle_id OR
    OLD.expires_at IS DISTINCT FROM NEW.expires_at OR
    OLD.status='ended' OR
    (OLD.status='active' AND NEW.status NOT IN('active','ended')) OR
    (OLD.status='active' AND NEW.status='ended' AND NEW.ended_at IS NULL)
  THEN RAISE EXCEPTION 'F05_PRIORITY_TTL_OR_HISTORY_IMMUTABLE' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER f05_priority_core_guard_test BEFORE UPDATE OR DELETE ON public.priority_leases
 FOR EACH ROW EXECUTE FUNCTION public.f05_priority_core_guard_test();
REVOKE ALL ON public.f05_priority_qualification_test,public.f05_priority_employee_scope_test,
 public.f05_priority_config_test,public.f05_priority_suppression_test,
 public.f05_priority_events_test FROM PUBLIC;

-- Never use raw priority_leases.status alone to grant current exclusive rights.
CREATE VIEW public.f05_priority_safe_active_test AS
 SELECT p.priority_id,p.vehicle_id,p.customer_id,p.listing_cycle_id,p.trigger_demand_id,p.expires_at
 FROM public.priority_leases p
 JOIN public.f05_priority_qualification_test q ON q.customer_id=p.customer_id
  AND q.enabled=true AND q.issuer='DISPOSABLE_TEST_ONLY' AND q.expires_at>statement_timestamp()
 JOIN public.demands d ON d.demand_id=p.trigger_demand_id AND d.customer_id=p.customer_id
 JOIN public.f05_matching_safe_current_test m ON m.result_id=p.source_match_result_id
  AND m.demand_id=d.demand_id AND m.vehicle_id=p.vehicle_id
  AND m.listing_cycle_id=p.listing_cycle_id AND m.match_tier IN('high','acceptable')
 WHERE p.status='active' AND p.expires_at>statement_timestamp()
 AND NOT EXISTS(SELECT 1 FROM public.locks l WHERE l.vehicle_id=p.vehicle_id
   AND l.lock_status='active' AND l.expires_at>statement_timestamp())
 AND NOT EXISTS(SELECT 1 FROM public.transactions t WHERE t.vehicle_id=p.vehicle_id
   AND t.status='in_progress');
REVOKE ALL ON public.f05_priority_safe_active_test FROM PUBLIC;
