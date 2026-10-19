-- PDM12: non-production first-candidate discovery audit. No untrusted publisher event.
CREATE TABLE public.f05_matching_discovery_events_test(
 event_key text PRIMARY KEY CHECK(event_key ~ '^[A-Za-z0-9_-]{24,64}$'),
 actor_employee_id bigint NOT NULL REFERENCES public.employees(employee_id) ON DELETE RESTRICT,
 trigger_kind text NOT NULL CHECK(trigger_kind IN ('NEW_DEMAND','NEW_VEHICLE')),
 subject_id bigint NOT NULL CHECK(subject_id>0),
 payload_sha256 text NOT NULL CHECK(payload_sha256 ~ '^[0-9a-f]{64}$'),
 queued_count integer NOT NULL CHECK(queued_count BETWEEN 0 AND 50),
 occurred_at timestamptz NOT NULL DEFAULT statement_timestamp()
);
CREATE FUNCTION public.f05_discovery_immutable_test() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'F05_DISCOVERY_EVENT_IMMUTABLE' USING ERRCODE='23514'; END $$;
CREATE TRIGGER f05_discovery_immutable_test BEFORE UPDATE OR DELETE ON public.f05_matching_discovery_events_test
 FOR EACH ROW EXECUTE FUNCTION public.f05_discovery_immutable_test();
REVOKE ALL ON public.f05_matching_discovery_events_test FROM PUBLIC;
