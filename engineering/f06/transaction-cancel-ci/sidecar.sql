-- F06-4A only in disposable native PG16; old public M94 and signed parent sidecars are immutable.
CREATE SCHEMA f06_4a_ci;
CREATE TABLE f06_4a_ci.attestation(
 seal_name text PRIMARY KEY CHECK(seal_name='F06_4A_CI_ONLY'),
 source_sha256 text NOT NULL,public_catalog_sha256 text NOT NULL,
 old_ledger_sha256 text NOT NULL,parent_f06_3c1_sha256 text NOT NULL,
 signed_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE f06_4a_ci.cancel_origins(
 transaction_id bigint PRIMARY KEY REFERENCES public.transactions(transaction_id),
 source_lock_id bigint NOT NULL REFERENCES public.locks(lock_id),
 customer_id bigint NOT NULL REFERENCES public.customers(customer_id),
 vehicle_id bigint NOT NULL REFERENCES public.vehicles(vehicle_id),
 listing_cycle_id bigint NOT NULL REFERENCES public.vehicle_listing_cycles(listing_cycle_id),
 original_responsible_employee_id bigint NOT NULL REFERENCES public.employees(employee_id),
 actor_employee_id bigint NOT NULL REFERENCES public.employees(employee_id),
 previous_status text NOT NULL CHECK(previous_status='in_progress'),
 resulting_status text NOT NULL CHECK(resulting_status='cancelled'),
 issuer_kind text NOT NULL DEFAULT 'CI_SYNTHETIC_NO_MONEY' CHECK(issuer_kind='CI_SYNTHETIC_NO_MONEY'),
 reason text NOT NULL CHECK(length(btrim(reason))>=6),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(transaction_id,source_lock_id,customer_id,vehicle_id,listing_cycle_id)
);
CREATE TABLE f06_4a_ci.cancel_events(
 event_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 transaction_id bigint NOT NULL UNIQUE REFERENCES f06_4a_ci.cancel_origins(transaction_id),
 actor_employee_id bigint NOT NULL REFERENCES public.employees(employee_id),
 event_kind text NOT NULL CHECK(event_kind='transaction_cancelled_without_payment'),
 previous_status text NOT NULL CHECK(previous_status='in_progress'),
 resulting_status text NOT NULL CHECK(resulting_status='cancelled'),
 reason text NOT NULL CHECK(length(btrim(reason))>=6),
 event_key_sha256 text NOT NULL UNIQUE CHECK(length(event_key_sha256)=64),
 occurred_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE f06_4a_ci.request_keys(
 event_key_sha256 text PRIMARY KEY CHECK(length(event_key_sha256)=64),
 actor_employee_id bigint NOT NULL REFERENCES public.employees(employee_id),
 action text NOT NULL CHECK(action='cancel'),
 transaction_id bigint NOT NULL REFERENCES f06_4a_ci.cancel_origins(transaction_id),
 payload_sha256 text NOT NULL CHECK(length(payload_sha256)=64),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE FUNCTION f06_4a_ci.forbid_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'F06_4A_APPEND_ONLY_IMMUTABLE'; END $$;
CREATE TRIGGER immutable_attestation BEFORE UPDATE OR DELETE ON f06_4a_ci.attestation FOR EACH ROW EXECUTE FUNCTION f06_4a_ci.forbid_mutation();
CREATE TRIGGER immutable_origins BEFORE UPDATE OR DELETE ON f06_4a_ci.cancel_origins FOR EACH ROW EXECUTE FUNCTION f06_4a_ci.forbid_mutation();
CREATE TRIGGER immutable_events BEFORE UPDATE OR DELETE ON f06_4a_ci.cancel_events FOR EACH ROW EXECUTE FUNCTION f06_4a_ci.forbid_mutation();
CREATE TRIGGER immutable_keys BEFORE UPDATE OR DELETE ON f06_4a_ci.request_keys FOR EACH ROW EXECUTE FUNCTION f06_4a_ci.forbid_mutation();
