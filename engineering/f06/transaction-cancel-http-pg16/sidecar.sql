-- F06 normal Transaction cancellation: disposable PG16 ONLY. This is NOT M94/production DDL.
-- Never construct a fake signed F06-3B transaction_origin.
CREATE SCHEMA f06_real_cancel_ci;
CREATE TABLE f06_real_cancel_ci.attestation(
 seal_name text PRIMARY KEY CHECK(seal_name='F06_REAL_CANCEL_CI_ONLY'),
 source_sha256 text NOT NULL CHECK(length(source_sha256)=64),
 f06_3c1_parent_sha256 text NOT NULL CHECK(length(f06_3c1_parent_sha256)=64),
 public_catalog_sha256 text NOT NULL CHECK(length(public_catalog_sha256)=64),
 ledger_sha256 text NOT NULL CHECK(length(ledger_sha256)=64),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE f06_real_cancel_ci.origins(
 transaction_id bigint PRIMARY KEY REFERENCES public.transactions(transaction_id),
 source_lock_id bigint NOT NULL REFERENCES public.locks(lock_id),
 vehicle_id bigint NOT NULL REFERENCES public.vehicles(vehicle_id),
 listing_cycle_id bigint NOT NULL REFERENCES public.vehicle_listing_cycles(listing_cycle_id),
 customer_id bigint NOT NULL REFERENCES public.customers(customer_id),
 original_responsible_employee_id bigint NOT NULL REFERENCES public.employees(employee_id),
 acting_responsible_employee_id bigint NOT NULL REFERENCES public.employees(employee_id),
 actor_employee_id bigint NOT NULL REFERENCES public.employees(employee_id),
 previous_status text NOT NULL CHECK(previous_status='in_progress'),
 resulting_status text NOT NULL CHECK(resulting_status='cancelled'),
 issuer text NOT NULL CHECK(issuer='CI_SYNTHETIC_NOT_REAL_MONEY'),
 reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 6 AND 240),
 parent_tx_digest text NOT NULL CHECK(length(parent_tx_digest)=64),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE f06_real_cancel_ci.events(
 event_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 transaction_id bigint NOT NULL UNIQUE REFERENCES f06_real_cancel_ci.origins(transaction_id),
 actor_employee_id bigint NOT NULL REFERENCES public.employees(employee_id),
 event_kind text NOT NULL CHECK(event_kind='cancelled_without_payment'),
 previous_status text NOT NULL CHECK(previous_status='in_progress'),
 resulting_status text NOT NULL CHECK(resulting_status='cancelled'),
 reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 6 AND 240),
 event_key_sha256 text NOT NULL UNIQUE CHECK(length(event_key_sha256)=64),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE f06_real_cancel_ci.request_keys(
 event_key_sha256 text PRIMARY KEY CHECK(length(event_key_sha256)=64),
 employee_id bigint NOT NULL REFERENCES public.employees(employee_id),
 transaction_id bigint NOT NULL REFERENCES f06_real_cancel_ci.origins(transaction_id),
 payload_sha256 text NOT NULL CHECK(length(payload_sha256)=64),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE FUNCTION f06_real_cancel_ci.forbid_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'F06_REAL_CANCEL_SIGNED_HISTORY_IMMUTABLE'; END $$;
CREATE TRIGGER protect_attestation BEFORE UPDATE OR DELETE ON f06_real_cancel_ci.attestation
 FOR EACH ROW EXECUTE FUNCTION f06_real_cancel_ci.forbid_mutation();
CREATE TRIGGER protect_origins BEFORE UPDATE OR DELETE ON f06_real_cancel_ci.origins
 FOR EACH ROW EXECUTE FUNCTION f06_real_cancel_ci.forbid_mutation();
CREATE TRIGGER protect_events BEFORE UPDATE OR DELETE ON f06_real_cancel_ci.events
 FOR EACH ROW EXECUTE FUNCTION f06_real_cancel_ci.forbid_mutation();
CREATE TRIGGER protect_keys BEFORE UPDATE OR DELETE ON f06_real_cancel_ci.request_keys
 FOR EACH ROW EXECUTE FUNCTION f06_real_cancel_ci.forbid_mutation();
