-- PDM13 isolated backoffice single-Customer Priority qualification toggle.
-- This is NOT a formal F03 permission issuer, and it never mutates Customer level.
ALTER TABLE public.f05_priority_qualification_test ADD COLUMN revision bigint NOT NULL DEFAULT 1 CHECK(revision>=1);
CREATE TABLE public.f05_priority_qualification_manage_scope_test(
 employee_id bigint NOT NULL REFERENCES public.employees(employee_id),
 customer_id bigint NOT NULL REFERENCES public.customers(customer_id),
 can_manage boolean NOT NULL CHECK(can_manage=true),
 issuer text NOT NULL DEFAULT 'DISPOSABLE_TEST_ONLY' CHECK(issuer='DISPOSABLE_TEST_ONLY'),
 expires_at timestamptz NOT NULL,
 PRIMARY KEY(employee_id,customer_id)
);
CREATE TABLE public.f05_priority_qualification_events_test(
 event_key text PRIMARY KEY CHECK(event_key~'^[A-Za-z0-9_-]{24,64}$'),
 fingerprint text NOT NULL CHECK(fingerprint~'^[0-9a-f]{64}$'),
 actor_employee_id bigint NOT NULL REFERENCES public.employees(employee_id),
 customer_id bigint NOT NULL REFERENCES public.customers(customer_id),
 action text NOT NULL CHECK(action IN('ENABLE','DISABLE')),
 before_json jsonb,
 after_json jsonb NOT NULL,
 ended_count integer NOT NULL DEFAULT 0 CHECK(ended_count>=0),
 rearbitrated_count integer NOT NULL DEFAULT 0 CHECK(rearbitrated_count>=0),
 occurred_at timestamptz NOT NULL DEFAULT statement_timestamp()
);
CREATE TRIGGER f05_priority_qual_audit_immutable_test
 BEFORE UPDATE OR DELETE ON public.f05_priority_qualification_events_test
 FOR EACH ROW EXECUTE FUNCTION public.f05_priority_append_only_test();
REVOKE ALL ON public.f05_priority_qualification_manage_scope_test,
 public.f05_priority_qualification_events_test FROM PUBLIC;
