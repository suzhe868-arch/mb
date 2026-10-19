-- B F05-8: disposable-only TTL batch sweep audit. No production scheduler or issuer.
-- The task uses original F02 priority_leases, not a parallel synthetic priority object.
CREATE TABLE public.f05_priority_sweep_events_test(
 priority_id bigint PRIMARY KEY REFERENCES public.priority_leases(priority_id),
 vehicle_id bigint NOT NULL REFERENCES public.vehicles(vehicle_id),
 old_customer_id bigint NOT NULL REFERENCES public.customers(customer_id),
 next_priority_id bigint REFERENCES public.priority_leases(priority_id),
 disposition text NOT NULL CHECK(disposition IN ('ENDED','REARBITRATED')),
 issuer text NOT NULL DEFAULT 'DISPOSABLE_TEST_ONLY' CHECK(issuer='DISPOSABLE_TEST_ONLY'),
 occurred_at timestamptz NOT NULL DEFAULT statement_timestamp()
);
CREATE TRIGGER f05_priority_sweep_immutable_test
 BEFORE UPDATE OR DELETE ON public.f05_priority_sweep_events_test
 FOR EACH ROW EXECUTE FUNCTION public.f05_priority_append_only_test();
REVOKE ALL ON public.f05_priority_sweep_events_test FROM PUBLIC;
