-- Disposable PG16, nonprivileged; only signed PR139 in_progress Transaction handoff.
CREATE SCHEMA f06_real_handoff_ci;
CREATE TABLE f06_real_handoff_ci.attestation(
 seal_name text PRIMARY KEY CHECK(seal_name='F06_REAL_TX_HANDOFF_CI_ONLY'),
 source_sha256 text NOT NULL CHECK(length(source_sha256)=64),
 tx_refund_source_sha256 text NOT NULL CHECK(length(tx_refund_source_sha256)=64),
 original_tx_source_sha256 text NOT NULL CHECK(length(original_tx_source_sha256)=64),
 public_catalog_sha256 text NOT NULL CHECK(length(public_catalog_sha256)=64),
 ledger_sha256 text NOT NULL CHECK(length(ledger_sha256)=64),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE f06_real_handoff_ci.events(
 event_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 transaction_id bigint NOT NULL REFERENCES public.transactions(transaction_id),
 source_lock_id bigint NOT NULL REFERENCES public.locks(lock_id),
 customer_id bigint NOT NULL REFERENCES public.customers(customer_id),
 vehicle_id bigint NOT NULL REFERENCES public.vehicles(vehicle_id),
 listing_cycle_id bigint NOT NULL REFERENCES public.vehicle_listing_cycles(listing_cycle_id),
 original_responsible_employee_id bigint NOT NULL REFERENCES public.employees(employee_id),
 old_responsible_employee_id bigint NOT NULL REFERENCES public.employees(employee_id),
 new_responsible_employee_id bigint NOT NULL REFERENCES public.employees(employee_id),
 actor_employee_id bigint NOT NULL REFERENCES public.employees(employee_id),
 signed_team_id bigint NOT NULL REFERENCES public.teams(team_id),
 signed_store_id bigint NOT NULL REFERENCES public.stores(store_id),
 version integer NOT NULL CHECK(version>0),
 prior_event_id bigint,
 reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 6 AND 240),
 source_tx_digest text NOT NULL CHECK(length(source_tx_digest)=64),
 event_key_sha256 text NOT NULL UNIQUE CHECK(length(event_key_sha256)=64),
 occurred_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(transaction_id,version),
 CHECK(old_responsible_employee_id<>new_responsible_employee_id),
 CHECK((version=1 AND prior_event_id IS NULL) OR (version>1 AND prior_event_id IS NOT NULL))
);
CREATE TABLE f06_real_handoff_ci.request_keys(
 event_key_sha256 text PRIMARY KEY CHECK(length(event_key_sha256)=64),
 transaction_id bigint NOT NULL REFERENCES public.transactions(transaction_id),
 actor_employee_id bigint NOT NULL REFERENCES public.employees(employee_id),
 payload_sha256 text NOT NULL CHECK(length(payload_sha256)=64),
 event_id bigint NOT NULL UNIQUE REFERENCES f06_real_handoff_ci.events(event_id),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE FUNCTION f06_real_handoff_ci.forbid_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'F06_REAL_HANDOFF_IMMUTABLE_HISTORY'; END $$;
CREATE TRIGGER immutable_att BEFORE UPDATE OR DELETE ON f06_real_handoff_ci.attestation
 FOR EACH ROW EXECUTE FUNCTION f06_real_handoff_ci.forbid_mutation();
CREATE TRIGGER immutable_events BEFORE UPDATE OR DELETE ON f06_real_handoff_ci.events
 FOR EACH ROW EXECUTE FUNCTION f06_real_handoff_ci.forbid_mutation();
CREATE TRIGGER immutable_keys BEFORE UPDATE OR DELETE ON f06_real_handoff_ci.request_keys
 FOR EACH ROW EXECUTE FUNCTION f06_real_handoff_ci.forbid_mutation();
