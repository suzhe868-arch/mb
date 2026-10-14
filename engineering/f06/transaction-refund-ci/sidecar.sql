-- F06-5A: disposable-PG16 only, signed cancelled Transaction refund pending/closed without payment.
CREATE SCHEMA f06_5a_ci;
CREATE TABLE f06_5a_ci.attestation(
 seal_name text PRIMARY KEY CHECK(seal_name='F06_5A_CI_ONLY'),
 source_sha256 text NOT NULL CHECK(length(source_sha256)=64),
 public_catalog_sha256 text NOT NULL,
 old_ledger_sha256 text NOT NULL,
 parent_f06_4c_sha256 text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE f06_5a_ci.refund_origins(
 refund_id bigint PRIMARY KEY REFERENCES public.refund_cases(refund_id),
 transaction_id bigint NOT NULL REFERENCES public.transactions(transaction_id),
 source_lock_id bigint NOT NULL REFERENCES public.locks(lock_id),
 customer_id bigint NOT NULL REFERENCES public.customers(customer_id),
 vehicle_id bigint NOT NULL REFERENCES public.vehicles(vehicle_id),
 listing_cycle_id bigint NOT NULL REFERENCES public.vehicle_listing_cycles(listing_cycle_id),
 responsible_employee_id bigint NOT NULL REFERENCES public.employees(employee_id),
 request_actor_id bigint NOT NULL REFERENCES public.employees(employee_id),
 amount_cents bigint NOT NULL CHECK(amount_cents>0),
 balance_at_request_cents bigint NOT NULL CHECK(balance_at_request_cents>0),
 source_kind text NOT NULL CHECK(source_kind IN('F06_4A_CANCEL_SIGNED','F06_4C_CANCEL_SIGNED')),
 request_reason text NOT NULL CHECK(length(btrim(request_reason))>=6),
 issuer text NOT NULL DEFAULT 'CI_SYNTHETIC_NO_PAYMENT' CHECK(issuer='CI_SYNTHETIC_NO_PAYMENT'),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE f06_5a_ci.status_events(
 event_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 refund_id bigint NOT NULL REFERENCES f06_5a_ci.refund_origins(refund_id),
 actor_employee_id bigint NOT NULL REFERENCES public.employees(employee_id),
 event_kind text NOT NULL CHECK(event_kind IN('pending_requested','closed_without_payment')),
 previous_status text,
 resulting_status text NOT NULL CHECK(resulting_status IN('pending','closed')),
 reason text NOT NULL CHECK(length(btrim(reason))>=6),
 event_key_sha256 text NOT NULL UNIQUE CHECK(length(event_key_sha256)=64),
 occurred_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 CHECK((event_kind='pending_requested' AND previous_status IS NULL AND resulting_status='pending') OR
 (event_kind='closed_without_payment' AND previous_status='pending' AND resulting_status='closed'))
);
CREATE TABLE f06_5a_ci.request_keys(
 event_key_sha256 text PRIMARY KEY CHECK(length(event_key_sha256)=64),
 actor_employee_id bigint NOT NULL REFERENCES public.employees(employee_id),
 action text NOT NULL CHECK(action IN('request','close')),
 refund_id bigint NOT NULL REFERENCES f06_5a_ci.refund_origins(refund_id),
 payload_sha256 text NOT NULL CHECK(length(payload_sha256)=64),
 event_id bigint NOT NULL REFERENCES f06_5a_ci.status_events(event_id),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE FUNCTION f06_5a_ci.deny_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
 BEGIN RAISE EXCEPTION 'F06_5A_APPEND_ONLY_HISTORY'; END $$;
CREATE TRIGGER attest_immutable BEFORE UPDATE OR DELETE ON f06_5a_ci.attestation FOR EACH ROW EXECUTE FUNCTION f06_5a_ci.deny_mutation();
CREATE TRIGGER origins_immutable BEFORE UPDATE OR DELETE ON f06_5a_ci.refund_origins FOR EACH ROW EXECUTE FUNCTION f06_5a_ci.deny_mutation();
CREATE TRIGGER events_immutable BEFORE UPDATE OR DELETE ON f06_5a_ci.status_events FOR EACH ROW EXECUTE FUNCTION f06_5a_ci.deny_mutation();
CREATE TRIGGER keys_immutable BEFORE UPDATE OR DELETE ON f06_5a_ci.request_keys FOR EACH ROW EXECUTE FUNCTION f06_5a_ci.deny_mutation();
