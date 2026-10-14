-- F06-4B disposable PG16 only: authorized transfer projection + append-only provenance, never production issuer.
CREATE SCHEMA f06_4b_ci;
CREATE TABLE f06_4b_ci.attestation (
 seal_name text PRIMARY KEY CHECK (seal_name='F06_4B_CI_ONLY'),
 source_sha256 text NOT NULL,
 public_catalog_sha256 text NOT NULL,
 old_ledger_sha256 text NOT NULL,
 parent_f06_4a_sha256 text NOT NULL,
 parent_f06_3b_sha256 text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE f06_4b_ci.responsible_projection (
 transaction_id bigint PRIMARY KEY REFERENCES public.transactions(transaction_id),
 source_lock_id bigint NOT NULL REFERENCES public.locks(lock_id),
 customer_id bigint NOT NULL REFERENCES public.customers(customer_id),
 vehicle_id bigint NOT NULL REFERENCES public.vehicles(vehicle_id),
 listing_cycle_id bigint NOT NULL REFERENCES public.vehicle_listing_cycles(listing_cycle_id),
 original_responsible_employee_id bigint NOT NULL REFERENCES public.employees(employee_id),
 current_responsible_employee_id bigint NOT NULL REFERENCES public.employees(employee_id),
 last_event_id bigint,
 event_count integer NOT NULL DEFAULT 0 CHECK(event_count>=0),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 last_changed_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(transaction_id,source_lock_id,customer_id,vehicle_id,listing_cycle_id)
);
CREATE TABLE f06_4b_ci.handoff_events (
 event_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 transaction_id bigint NOT NULL REFERENCES f06_4b_ci.responsible_projection(transaction_id),
 old_responsible_employee_id bigint NOT NULL REFERENCES public.employees(employee_id),
 new_responsible_employee_id bigint NOT NULL REFERENCES public.employees(employee_id),
 actor_employee_id bigint NOT NULL REFERENCES public.employees(employee_id),
 reason text NOT NULL CHECK(length(btrim(reason))>=6),
 event_key_sha256 text NOT NULL UNIQUE CHECK(length(event_key_sha256)=64),
 prior_event_id bigint,
 synthetic_authority text NOT NULL DEFAULT 'CI_EXPLICIT_MANAGER_SCOPE_NOT_PRODUCTION' CHECK(synthetic_authority='CI_EXPLICIT_MANAGER_SCOPE_NOT_PRODUCTION'),
 occurred_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 CHECK(old_responsible_employee_id<>new_responsible_employee_id)
);
CREATE TABLE f06_4b_ci.request_keys (
 event_key_sha256 text PRIMARY KEY CHECK(length(event_key_sha256)=64),
 transaction_id bigint NOT NULL REFERENCES f06_4b_ci.responsible_projection(transaction_id),
 actor_employee_id bigint NOT NULL REFERENCES public.employees(employee_id),
 payload_sha256 text NOT NULL CHECK(length(payload_sha256)=64),
 result_event_id bigint NOT NULL REFERENCES f06_4b_ci.handoff_events(event_id),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE FUNCTION f06_4b_ci.history_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'F06_4B_APPEND_ONLY_HISTORY'; END $$;
CREATE TRIGGER immutable_attestation BEFORE UPDATE OR DELETE ON f06_4b_ci.attestation FOR EACH ROW EXECUTE FUNCTION f06_4b_ci.history_immutable();
CREATE TRIGGER immutable_events BEFORE UPDATE OR DELETE ON f06_4b_ci.handoff_events FOR EACH ROW EXECUTE FUNCTION f06_4b_ci.history_immutable();
CREATE TRIGGER immutable_keys BEFORE UPDATE OR DELETE ON f06_4b_ci.request_keys FOR EACH ROW EXECUTE FUNCTION f06_4b_ci.history_immutable();
