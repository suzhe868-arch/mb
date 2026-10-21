-- Issue164: immutable nonproduction composite source, private schema only.
-- This file is NOT a production issuer and does not alter any public DDL or legacy sidecar.
CREATE SCHEMA f06_composite_v1;
CREATE TABLE f06_composite_v1.attestation(
 seal_name text PRIMARY KEY CHECK(seal_name='COMPOSITE_NONPROD_SIGNED_V1'),
 source_sha256 text NOT NULL CHECK(length(source_sha256)=64),
 head_sha text NOT NULL CHECK(length(head_sha)=40),
 run_id text NOT NULL,
 github_ref text NOT NULL CHECK(github_ref='refs/heads/feat/f06-nonprod-single-runtime-trusted-source-01'),
 database_oid oid NOT NULL,
 ledger_sha256 text NOT NULL CHECK(length(ledger_sha256)=64),
 public_catalog_sha256 text NOT NULL CHECK(length(public_catalog_sha256)=64),
 parent_f05_checksum text NOT NULL CHECK(length(parent_f05_checksum)=64),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE f06_composite_v1.customer_sessions(
 token_sha256 text PRIMARY KEY CHECK(length(token_sha256)=64),
 customer_id bigint NOT NULL REFERENCES public.customers(customer_id),
 issuer text NOT NULL CHECK(issuer='COMPOSITE_NONPROD_SIGNED_V1'),
 expires_at timestamptz NOT NULL,
 revoked_at timestamptz
);
CREATE TABLE f06_composite_v1.policy(
 policy_id integer PRIMARY KEY CHECK(policy_id=1),
 initial_lock_hours integer NOT NULL CHECK(initial_lock_hours>0 AND initial_lock_hours<=720),
 version integer NOT NULL CHECK(version>0)
);
INSERT INTO f06_composite_v1.policy(policy_id,initial_lock_hours,version) VALUES(1,72,1);
CREATE SEQUENCE f06_composite_v1.request_ids START WITH 961800001;
CREATE SEQUENCE f06_composite_v1.lock_ids START WITH 971800001;
CREATE SEQUENCE f06_composite_v1.waitlist_ids START WITH 981800001;
CREATE TABLE f06_composite_v1.request_keys(
 request_id bigint PRIMARY KEY REFERENCES public.lock_requests(lock_request_id) DEFERRABLE INITIALLY DEFERRED,
 customer_id bigint NOT NULL REFERENCES public.customers(customer_id),
 key_sha256 text NOT NULL UNIQUE CHECK(length(key_sha256)=64),
 payload_sha256 text NOT NULL CHECK(length(payload_sha256)=64),
 issuer text NOT NULL CHECK(issuer='COMPOSITE_NONPROD_SIGNED_V1'),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE f06_composite_v1.decision_keys(
 key_sha256 text PRIMARY KEY CHECK(length(key_sha256)=64),
 payload_sha256 text NOT NULL CHECK(length(payload_sha256)=64),
 employee_id bigint NOT NULL REFERENCES public.employees(employee_id),
 request_id bigint NOT NULL REFERENCES public.lock_requests(lock_request_id) DEFERRABLE INITIALLY DEFERRED,
 result_json jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE f06_composite_v1.lock_snapshots(
 lock_id bigint PRIMARY KEY REFERENCES public.locks(lock_id) DEFERRABLE INITIALLY DEFERRED,
 approver_employee_id bigint NOT NULL REFERENCES public.employees(employee_id),
 responsible_employee_id bigint NOT NULL REFERENCES public.employees(employee_id),
 customer_id bigint NOT NULL REFERENCES public.customers(customer_id),
 price_kind text NOT NULL CHECK(price_kind IN('numeric','consultation')),
 price_cents bigint CHECK(price_cents>0),
 source_price_event_id bigint REFERENCES public.vehicle_price_history(price_event_id),
 initial_hours integer NOT NULL CHECK(initial_hours>0),
 policy_version integer NOT NULL CHECK(policy_version>0),
 priority_origin_customer_id bigint REFERENCES public.customers(customer_id),
 priority_origin_id bigint REFERENCES public.f05_8_priority_ci(priority_id),
 signed_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 CHECK ((priority_origin_customer_id IS NULL)=(priority_origin_id IS NULL)),
 CHECK ((price_kind='numeric' AND price_cents IS NOT NULL AND source_price_event_id IS NOT NULL)
     OR (price_kind='consultation' AND price_cents IS NULL AND source_price_event_id IS NULL))
);
CREATE TABLE f06_composite_v1.waitlist_sources(
 waitlist_id bigint PRIMARY KEY REFERENCES public.waitlists(waitlist_id) DEFERRABLE INITIALLY DEFERRED,
 source_request_id bigint NOT NULL UNIQUE REFERENCES public.lock_requests(lock_request_id),
 responsible_employee_id bigint NOT NULL REFERENCES public.employees(employee_id),
 responsible_source text NOT NULL CHECK(responsible_source IN ('recommendation','demand','owner')),
 queue_created_at timestamptz NOT NULL,
 queue_request_id bigint NOT NULL REFERENCES public.lock_requests(lock_request_id),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE f06_composite_v1.events(
 event_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 request_id bigint NOT NULL REFERENCES public.lock_requests(lock_request_id) DEFERRABLE INITIALLY DEFERRED,
 event_type text NOT NULL CHECK(event_type IN ('created','approved','rejected','expired','lock_conflict','closed_not_lockable')),
 actor_employee_id bigint REFERENCES public.employees(employee_id),
 old_status text,new_status text NOT NULL,
 resulting_lock_id bigint REFERENCES public.locks(lock_id) DEFERRABLE INITIALLY DEFERRED,
 resulting_waitlist_id bigint REFERENCES public.waitlists(waitlist_id) DEFERRABLE INITIALLY DEFERRED,
 at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX composite_events_by_request ON f06_composite_v1.events(request_id,event_id);
CREATE TABLE f06_composite_v1.issued_events(
 event_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 event_key_sha256 text NOT NULL UNIQUE CHECK(length(event_key_sha256)=64),
 event_kind text NOT NULL CHECK(event_kind IN(
  'lock_request_created','lock_request_approved','lock_request_rejected','lock_request_expired',
  'lock_conflict','signed_lock','signed_deposit','signed_tx','signed_handoff','signed_cancel',
  'signed_refund_pending','signed_refund_closed')),
 parent_object_id bigint NOT NULL CHECK(parent_object_id>0),
 actor_kind text NOT NULL CHECK(actor_kind IN('customer','employee','system')),
 actor_id bigint,
 source_parent_sha256 text NOT NULL CHECK(length(source_parent_sha256)=64),
 head_sha text NOT NULL CHECK(length(head_sha)=40),
 run_id text NOT NULL,
 payload_sha256 text NOT NULL CHECK(length(payload_sha256)=64),
 occurred_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 CHECK((actor_kind='employee' AND actor_id IS NOT NULL) OR (actor_kind<>'employee' AND actor_id IS NULL))
);
CREATE FUNCTION f06_composite_v1.immutable() RETURNS trigger
 LANGUAGE plpgsql AS $$BEGIN RAISE EXCEPTION 'F06_COMPOSITE_IMMUTABLE'; END$$;
CREATE TRIGGER protect_attestation BEFORE UPDATE OR DELETE ON f06_composite_v1.attestation
 FOR EACH ROW EXECUTE FUNCTION f06_composite_v1.immutable();
CREATE TRIGGER protect_issued_events BEFORE UPDATE OR DELETE ON f06_composite_v1.issued_events
 FOR EACH ROW EXECUTE FUNCTION f06_composite_v1.immutable();
CREATE TRIGGER protect_lock_snapshots BEFORE UPDATE OR DELETE ON f06_composite_v1.lock_snapshots
 FOR EACH ROW EXECUTE FUNCTION f06_composite_v1.immutable();
CREATE TRIGGER protect_request_keys BEFORE UPDATE OR DELETE ON f06_composite_v1.request_keys
 FOR EACH ROW EXECUTE FUNCTION f06_composite_v1.immutable();
CREATE TRIGGER protect_decision_keys BEFORE UPDATE OR DELETE ON f06_composite_v1.decision_keys
 FOR EACH ROW EXECUTE FUNCTION f06_composite_v1.immutable();
CREATE TRIGGER protect_waitlist_sources BEFORE UPDATE OR DELETE ON f06_composite_v1.waitlist_sources
 FOR EACH ROW EXECUTE FUNCTION f06_composite_v1.immutable();
CREATE TRIGGER protect_events BEFORE UPDATE OR DELETE ON f06_composite_v1.events
 FOR EACH ROW EXECUTE FUNCTION f06_composite_v1.immutable();
