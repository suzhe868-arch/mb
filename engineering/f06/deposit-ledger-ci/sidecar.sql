-- F06-3A: ONLY isolated nonprivileged disposable PG16 scenario. Not a real payment issuer.
CREATE SCHEMA f06_3a_ci;
CREATE TABLE f06_3a_ci.attestation (
 seal_name TEXT PRIMARY KEY,
 sidecar_source_sha256 TEXT NOT NULL,
 old_public_catalog_sha256 TEXT NOT NULL,
 old_ledger_sha256 TEXT NOT NULL,
 f06_1_source_sha256 TEXT NOT NULL,
 f06_2_source_sha256 TEXT NOT NULL,
 signed_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE f06_3a_ci.receipt_provenance (
 deposit_id BIGINT PRIMARY KEY REFERENCES public.deposit_receipts(deposit_id),
 lock_id BIGINT NOT NULL REFERENCES public.locks(lock_id),
 customer_id BIGINT NOT NULL REFERENCES public.customers(customer_id),
 vehicle_id BIGINT NOT NULL REFERENCES public.vehicles(vehicle_id),
 listing_cycle_id BIGINT NOT NULL REFERENCES public.vehicle_listing_cycles(listing_cycle_id),
 original_amount_cents BIGINT NOT NULL CHECK(original_amount_cents BETWEEN 1 AND 100000000000),
 currency TEXT NOT NULL CHECK(currency='CNY'),
 payment_method TEXT NOT NULL CHECK(payment_method IN('cash','bank_transfer','pos')),
 operator_employee_id BIGINT NOT NULL REFERENCES public.employees(employee_id),
 received_at TIMESTAMPTZ NOT NULL,
 note TEXT,
 synthetic_voucher_ref TEXT CHECK(synthetic_voucher_ref IS NULL OR length(synthetic_voucher_ref)<121),
 issuer_kind TEXT NOT NULL CHECK(issuer_kind='CI_SYNTHETIC_NOT_REAL_MONEY'),
 created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE f06_3a_ci.adjustments (
 adjustment_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 deposit_id BIGINT NOT NULL REFERENCES f06_3a_ci.receipt_provenance(deposit_id),
 lock_id BIGINT NOT NULL REFERENCES public.locks(lock_id),
 event_kind TEXT NOT NULL CHECK(event_kind IN('correction','reversal')),
 delta_cents BIGINT NOT NULL CHECK(delta_cents<>0 AND delta_cents BETWEEN -100000000000 AND 100000000000),
 currency TEXT NOT NULL CHECK(currency='CNY'),
 actor_employee_id BIGINT NOT NULL REFERENCES public.employees(employee_id),
 reason TEXT NOT NULL CHECK(length(btrim(reason)) BETWEEN 6 AND 240),
 event_key_sha256 TEXT NOT NULL UNIQUE CHECK(length(event_key_sha256)=64),
 created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
 CHECK(event_kind<>'reversal' OR delta_cents<0)
);
CREATE TABLE f06_3a_ci.request_keys (
 key_sha256 TEXT PRIMARY KEY CHECK(length(key_sha256)=64),
 actor_employee_id BIGINT NOT NULL REFERENCES public.employees(employee_id),
 action TEXT NOT NULL CHECK(action IN('record','correction','reversal')),
 lock_id BIGINT NOT NULL REFERENCES public.locks(lock_id),
 deposit_id BIGINT REFERENCES public.deposit_receipts(deposit_id),
 amount_cents BIGINT NOT NULL,
 resulting_deposit_id BIGINT REFERENCES public.deposit_receipts(deposit_id),
 resulting_adjustment_id BIGINT REFERENCES f06_3a_ci.adjustments(adjustment_id),
 created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
 CHECK ((action='record' AND deposit_id IS NULL AND resulting_deposit_id IS NOT NULL AND resulting_adjustment_id IS NULL) OR
        (action<>'record' AND deposit_id IS NOT NULL AND resulting_deposit_id IS NULL AND resulting_adjustment_id IS NOT NULL))
);
CREATE INDEX f06_3a_adjustments_by_deposit ON f06_3a_ci.adjustments(deposit_id,adjustment_id);
CREATE FUNCTION f06_3a_ci.forbid_ledger_changes() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'F06_3A_IMMUTABLE_FINANCIAL_LEDGER'; END $$;
CREATE TRIGGER immutable_receipt BEFORE UPDATE OR DELETE ON f06_3a_ci.receipt_provenance
 FOR EACH ROW EXECUTE FUNCTION f06_3a_ci.forbid_ledger_changes();
CREATE TRIGGER immutable_adjustment BEFORE UPDATE OR DELETE ON f06_3a_ci.adjustments
 FOR EACH ROW EXECUTE FUNCTION f06_3a_ci.forbid_ledger_changes();
CREATE TRIGGER immutable_requests BEFORE UPDATE OR DELETE ON f06_3a_ci.request_keys
 FOR EACH ROW EXECUTE FUNCTION f06_3a_ci.forbid_ledger_changes();
