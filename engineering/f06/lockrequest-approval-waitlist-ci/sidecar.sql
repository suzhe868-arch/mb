-- F06-1 CI-only sidecar: approved PDM18 physical carrier gap without modifying signed public M94-v26.
-- This DDL is for disposable f03_auth_test only; do not apply in production.
CREATE SCHEMA f06_1_lock_ci;
CREATE TABLE f06_1_lock_ci.attestation (
 seal_name TEXT PRIMARY KEY,
 source_sha256 TEXT NOT NULL,
 signed_public_catalog_sha256 TEXT NOT NULL,
 signed_ledger_sha256 TEXT NOT NULL,
 d1_attestation_sha256 TEXT NOT NULL,
 recorded_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE f06_1_lock_ci.policy (
 policy_id INTEGER PRIMARY KEY CHECK(policy_id=1),
 lock_hours INTEGER NOT NULL CHECK(lock_hours>0),
 policy_version INTEGER NOT NULL CHECK(policy_version>0),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);
INSERT INTO f06_1_lock_ci.policy(policy_id,lock_hours,policy_version) VALUES(1,72,1);
CREATE SEQUENCE f06_1_lock_ci.request_ids START WITH 861800001;
CREATE SEQUENCE f06_1_lock_ci.lock_ids START WITH 871800001;
CREATE SEQUENCE f06_1_lock_ci.waitlist_ids START WITH 881800001;
CREATE TABLE f06_1_lock_ci.request_keys (
 request_id BIGINT PRIMARY KEY REFERENCES public.lock_requests(lock_request_id) DEFERRABLE INITIALLY DEFERRED,
 customer_id BIGINT NOT NULL REFERENCES public.customers(customer_id),
 request_key_sha256 TEXT NOT NULL UNIQUE CHECK(length(request_key_sha256)=64),
 phone_evidence TEXT NOT NULL CHECK(phone_evidence='CI_SYNTHETIC_PHONE_CONSENT_NOT_PRODUCTION'),
 received_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(customer_id,request_id)
);
CREATE TABLE f06_1_lock_ci.lock_snapshots (
 lock_id BIGINT PRIMARY KEY REFERENCES public.locks(lock_id),
 approver_employee_id BIGINT NOT NULL REFERENCES public.employees(employee_id),
 responsible_employee_id BIGINT NOT NULL REFERENCES public.employees(employee_id),
 customer_id BIGINT NOT NULL REFERENCES public.customers(customer_id),
 price_kind TEXT NOT NULL CHECK(price_kind IN('numeric','consultation')),
 price_cents BIGINT CHECK(price_cents>0),
 source_price_event_id BIGINT REFERENCES public.vehicle_price_history(price_event_id),
 initial_hours INTEGER NOT NULL CHECK(initial_hours>0),
 policy_version INTEGER NOT NULL CHECK(policy_version>0),
 priority_origin_customer_id BIGINT REFERENCES public.customers(customer_id),
 signed_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
 CHECK((price_kind='numeric' AND price_cents IS NOT NULL AND source_price_event_id IS NOT NULL)
 OR (price_kind='consultation' AND price_cents IS NULL AND source_price_event_id IS NULL))
);
CREATE TABLE f06_1_lock_ci.waitlist_sources (
 waitlist_id BIGINT PRIMARY KEY REFERENCES public.waitlists(waitlist_id),
 source_request_id BIGINT NOT NULL UNIQUE REFERENCES public.lock_requests(lock_request_id),
 queue_created_at TIMESTAMPTZ NOT NULL,
 queue_request_id BIGINT NOT NULL,
 responsible_employee_id BIGINT NOT NULL REFERENCES public.employees(employee_id),
 created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE f06_1_lock_ci.events (
 event_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 event_key_sha256 TEXT NOT NULL UNIQUE CHECK(length(event_key_sha256)=64),
 request_id BIGINT NOT NULL REFERENCES public.lock_requests(lock_request_id) DEFERRABLE INITIALLY DEFERRED,
 event_kind TEXT NOT NULL CHECK(event_kind IN('created','reused','approved','rejected','expired','lock_conflict','closed_not_lockable')),
 actor_kind TEXT NOT NULL CHECK(actor_kind IN('customer_synthetic','employee','system')),
 actor_employee_id BIGINT REFERENCES public.employees(employee_id),
 prior_status TEXT,
 final_status TEXT NOT NULL,
 resulting_lock_id BIGINT REFERENCES public.locks(lock_id),
 resulting_waitlist_id BIGINT REFERENCES public.waitlists(waitlist_id),
 occurred_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX f06_1_request_events ON f06_1_lock_ci.events(request_id,event_id);
