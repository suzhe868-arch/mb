-- F06-3C-1: signed disposable PG16 refund pending/closed facts only.
-- Public M94-v26 is frozen. No payment, actual refund, or production issuer.
CREATE SCHEMA f06_3c1_ci;
CREATE TABLE f06_3c1_ci.attestation (
 seal_name text PRIMARY KEY,
 source_sha256 text NOT NULL,
 public_catalog_sha256 text NOT NULL,
 old_ledger_sha256 text NOT NULL,
 f06_3b_sha256 text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE f06_3c1_ci.refund_origins (
 refund_id bigint PRIMARY KEY REFERENCES public.refund_cases(refund_id),
 lock_id bigint NOT NULL REFERENCES public.locks(lock_id),
 customer_id bigint NOT NULL REFERENCES public.customers(customer_id),
 vehicle_id bigint NOT NULL REFERENCES public.vehicles(vehicle_id),
 listing_cycle_id bigint NOT NULL REFERENCES public.vehicle_listing_cycles(listing_cycle_id),
 amount_cents bigint NOT NULL CHECK(amount_cents>0 AND amount_cents<=100000000000),
 balance_at_request_cents bigint NOT NULL CHECK(balance_at_request_cents>0),
 actor_employee_id bigint NOT NULL REFERENCES public.employees(employee_id),
 issuer_kind text NOT NULL DEFAULT 'CI_SYNTHETIC_NO_MONEY' CHECK(issuer_kind='CI_SYNTHETIC_NO_MONEY'),
 reason text NOT NULL CHECK(length(btrim(reason))>=6),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(refund_id,lock_id,customer_id,vehicle_id,listing_cycle_id)
);
CREATE TABLE f06_3c1_ci.status_events(
 event_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 refund_id bigint NOT NULL REFERENCES f06_3c1_ci.refund_origins(refund_id),
 event_kind text NOT NULL CHECK(event_kind IN('pending_requested','closed_without_payment')),
 previous_status text,
 resulting_status text NOT NULL CHECK(resulting_status IN('pending','closed')),
 actor_employee_id bigint NOT NULL REFERENCES public.employees(employee_id),
 reason text NOT NULL CHECK(length(btrim(reason))>=6),
 event_key_sha256 text NOT NULL CHECK(length(event_key_sha256)=64),
 occurred_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(refund_id,event_kind),
 UNIQUE(event_key_sha256)
);
CREATE TABLE f06_3c1_ci.request_keys(
 event_key_sha256 text PRIMARY KEY CHECK(length(event_key_sha256)=64),
 actor_employee_id bigint NOT NULL REFERENCES public.employees(employee_id),
 action text NOT NULL CHECK(action IN('request','close')),
 refund_id bigint NOT NULL REFERENCES f06_3c1_ci.refund_origins(refund_id),
 payload_sha256 text NOT NULL CHECK(length(payload_sha256)=64),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE FUNCTION f06_3c1_ci.forbid_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'F06_3C1_APPEND_ONLY_HISTORY'; END $$;
CREATE TRIGGER immutable_origins BEFORE UPDATE OR DELETE ON f06_3c1_ci.refund_origins FOR EACH ROW EXECUTE FUNCTION f06_3c1_ci.forbid_mutation();
CREATE TRIGGER immutable_events BEFORE UPDATE OR DELETE ON f06_3c1_ci.status_events FOR EACH ROW EXECUTE FUNCTION f06_3c1_ci.forbid_mutation();
CREATE TRIGGER immutable_keys BEFORE UPDATE OR DELETE ON f06_3c1_ci.request_keys FOR EACH ROW EXECUTE FUNCTION f06_3c1_ci.forbid_mutation();
CREATE TRIGGER immutable_attestation BEFORE UPDATE OR DELETE ON f06_3c1_ci.attestation FOR EACH ROW EXECUTE FUNCTION f06_3c1_ci.forbid_mutation();
