-- F06 Transaction-side Refund. Disposable nonprivileged PG16 only; never production DDL/payment.
CREATE SCHEMA f06_real_tx_refund_ci;
CREATE TABLE f06_real_tx_refund_ci.attestation(
 seal_name text PRIMARY KEY CHECK(seal_name='F06_REAL_TX_REFUND_CI_ONLY'),
 source_sha256 text NOT NULL CHECK(length(source_sha256)=64),
 cancel_source_sha256 text NOT NULL CHECK(length(cancel_source_sha256)=64),
 f06_3c1_parent_sha256 text NOT NULL CHECK(length(f06_3c1_parent_sha256)=64),
 public_catalog_sha256 text NOT NULL CHECK(length(public_catalog_sha256)=64),
 ledger_sha256 text NOT NULL CHECK(length(ledger_sha256)=64),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE f06_real_tx_refund_ci.origins(
 refund_id bigint PRIMARY KEY REFERENCES public.refund_cases(refund_id),
 transaction_id bigint NOT NULL UNIQUE REFERENCES public.transactions(transaction_id),
 source_lock_id bigint NOT NULL REFERENCES public.locks(lock_id),
 customer_id bigint NOT NULL REFERENCES public.customers(customer_id),
 vehicle_id bigint NOT NULL REFERENCES public.vehicles(vehicle_id),
 listing_cycle_id bigint NOT NULL REFERENCES public.vehicle_listing_cycles(listing_cycle_id),
 amount_cents bigint NOT NULL CHECK(amount_cents>0 AND amount_cents<=100000000000),
 net_deposit_cents bigint NOT NULL CHECK(net_deposit_cents>=0 AND net_deposit_cents<=100000000000),
 pending_commitment_cents bigint NOT NULL CHECK(pending_commitment_cents>=0 AND pending_commitment_cents<=100000000000),
 available_balance_cents bigint NOT NULL CHECK(available_balance_cents>0 AND available_balance_cents<=100000000000),
 source_tx_digest text NOT NULL CHECK(length(source_tx_digest)=64),
 source_cancel_digest text NOT NULL CHECK(length(source_cancel_digest)=64),
 source_deposit_digest text NOT NULL CHECK(length(source_deposit_digest)=64),
 source_lock_refund_digest text NOT NULL CHECK(length(source_lock_refund_digest)=64),
 actor_employee_id bigint NOT NULL REFERENCES public.employees(employee_id),
 issuer_kind text NOT NULL CHECK(issuer_kind='CI_SYNTHETIC_NO_MONEY'),
 reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 6 AND 240),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(refund_id,transaction_id,source_lock_id,customer_id,vehicle_id,listing_cycle_id)
);
CREATE TABLE f06_real_tx_refund_ci.events(
 event_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 refund_id bigint NOT NULL REFERENCES f06_real_tx_refund_ci.origins(refund_id),
 transaction_id bigint NOT NULL REFERENCES public.transactions(transaction_id),
 actor_employee_id bigint NOT NULL REFERENCES public.employees(employee_id),
 event_kind text NOT NULL CHECK(event_kind IN('pending_requested','closed_without_payment')),
 previous_status text,
 resulting_status text NOT NULL CHECK(resulting_status IN('pending','closed')),
 reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 6 AND 240),
 event_key_sha256 text NOT NULL UNIQUE CHECK(length(event_key_sha256)=64),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(refund_id,event_kind),
 CHECK((event_kind='pending_requested' AND previous_status IS NULL AND resulting_status='pending') OR
       (event_kind='closed_without_payment' AND previous_status='pending' AND resulting_status='closed'))
);
CREATE TABLE f06_real_tx_refund_ci.request_keys(
 event_key_sha256 text PRIMARY KEY CHECK(length(event_key_sha256)=64),
 actor_employee_id bigint NOT NULL REFERENCES public.employees(employee_id),
 action text NOT NULL CHECK(action IN('request','close')),
 transaction_id bigint NOT NULL REFERENCES public.transactions(transaction_id),
 refund_id bigint NOT NULL REFERENCES f06_real_tx_refund_ci.origins(refund_id),
 payload_sha256 text NOT NULL CHECK(length(payload_sha256)=64),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE FUNCTION f06_real_tx_refund_ci.forbid_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'F06_REAL_TX_REFUND_APPEND_ONLY_IMMUTABLE'; END $$;
CREATE TRIGGER protect_attestation BEFORE UPDATE OR DELETE ON f06_real_tx_refund_ci.attestation
 FOR EACH ROW EXECUTE FUNCTION f06_real_tx_refund_ci.forbid_mutation();
CREATE TRIGGER protect_origins BEFORE UPDATE OR DELETE ON f06_real_tx_refund_ci.origins
 FOR EACH ROW EXECUTE FUNCTION f06_real_tx_refund_ci.forbid_mutation();
CREATE TRIGGER protect_events BEFORE UPDATE OR DELETE ON f06_real_tx_refund_ci.events
 FOR EACH ROW EXECUTE FUNCTION f06_real_tx_refund_ci.forbid_mutation();
CREATE TRIGGER protect_keys BEFORE UPDATE OR DELETE ON f06_real_tx_refund_ci.request_keys
 FOR EACH ROW EXECUTE FUNCTION f06_real_tx_refund_ci.forbid_mutation();
