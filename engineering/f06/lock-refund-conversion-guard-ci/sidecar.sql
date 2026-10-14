-- F06-5B: only disposable PG16, immutable sidecar attesting safe conversion.
CREATE SCHEMA f06_5b_ci;
CREATE TABLE f06_5b_ci.attestation(
 seal_name text PRIMARY KEY CHECK(seal_name='F06_5B_CI_ONLY'),
 source_sha256 text NOT NULL CHECK(length(source_sha256)=64),
 public_catalog_sha256 text NOT NULL,
 old_ledger_sha256 text NOT NULL,
 parent_f06_5a_sha256 text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE f06_5b_ci.guard_events(
 transaction_id bigint PRIMARY KEY REFERENCES public.transactions(transaction_id),
 source_lock_id bigint NOT NULL UNIQUE REFERENCES public.locks(lock_id),
 vehicle_id bigint NOT NULL REFERENCES public.vehicles(vehicle_id),
 listing_cycle_id bigint NOT NULL REFERENCES public.vehicle_listing_cycles(listing_cycle_id),
 actor_employee_id bigint NOT NULL REFERENCES public.employees(employee_id),
 checked_refunds integer NOT NULL CHECK(checked_refunds>=0),
 signed_refunds_sha256 text NOT NULL CHECK(length(signed_refunds_sha256)=64),
 production_issuer text NOT NULL DEFAULT 'UNWIRED' CHECK(production_issuer='UNWIRED'),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE FUNCTION f06_5b_ci.deny_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'F06_5B_APPEND_ONLY_HISTORY'; END $$;
CREATE TRIGGER attest_immutable BEFORE UPDATE OR DELETE ON f06_5b_ci.attestation FOR EACH ROW EXECUTE FUNCTION f06_5b_ci.deny_mutation();
CREATE TRIGGER guards_immutable BEFORE UPDATE OR DELETE ON f06_5b_ci.guard_events FOR EACH ROW EXECUTE FUNCTION f06_5b_ci.deny_mutation();
