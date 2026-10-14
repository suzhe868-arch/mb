-- F06-4C CI-only: post signed F06-4B handoff cancellation with immutable attestation and history
CREATE SCHEMA f06_4c_ci;
CREATE TABLE f06_4c_ci.attestation(
 seal_name text PRIMARY KEY CHECK(seal_name='F06_4C_CI_ONLY'),
 source_sha256 text NOT NULL, public_catalog_sha256 text NOT NULL,
 old_ledger_sha256 text NOT NULL, parent_f06_4b_sha256 text NOT NULL,
 parent_f06_4a_sha256 text NOT NULL, created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE f06_4c_ci.cancel_origins(
 transaction_id bigint PRIMARY KEY REFERENCES public.transactions(transaction_id),
 source_lock_id bigint NOT NULL REFERENCES public.locks(lock_id),
 customer_id bigint NOT NULL REFERENCES public.customers(customer_id),
 vehicle_id bigint NOT NULL REFERENCES public.vehicles(vehicle_id),
 listing_cycle_id bigint NOT NULL REFERENCES public.vehicle_listing_cycles(listing_cycle_id),
 original_responsible_employee_id bigint NOT NULL REFERENCES public.employees(employee_id),
 transferred_responsible_employee_id bigint NOT NULL REFERENCES public.employees(employee_id),
 actor_employee_id bigint NOT NULL REFERENCES public.employees(employee_id),
 parent_last_handoff_event_id bigint NOT NULL REFERENCES f06_4b_ci.handoff_events(event_id),
 parent_handoff_event_count integer NOT NULL CHECK(parent_handoff_event_count>0),
 previous_status text NOT NULL CHECK(previous_status='in_progress'),
 resulting_status text NOT NULL CHECK(resulting_status='cancelled'),
 reason text NOT NULL CHECK(length(btrim(reason))>=6),
 issuer_kind text NOT NULL DEFAULT 'CI_SYNTHETIC_NO_MONEY' CHECK(issuer_kind='CI_SYNTHETIC_NO_MONEY'),
 occurred_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE f06_4c_ci.cancel_events(
 event_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 transaction_id bigint NOT NULL UNIQUE REFERENCES f06_4c_ci.cancel_origins(transaction_id),
 actor_employee_id bigint NOT NULL REFERENCES public.employees(employee_id),
 original_responsible_employee_id bigint NOT NULL REFERENCES public.employees(employee_id),
 current_responsible_employee_id bigint NOT NULL REFERENCES public.employees(employee_id),
 parent_last_handoff_event_id bigint NOT NULL REFERENCES f06_4b_ci.handoff_events(event_id),
 event_key_sha256 text NOT NULL UNIQUE CHECK(length(event_key_sha256)=64),
 reason text NOT NULL CHECK(length(btrim(reason))>=6),
 event_kind text NOT NULL CHECK(event_kind='post_handoff_transaction_cancelled_ci_only'),
 occurred_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE f06_4c_ci.request_keys(
 event_key_sha256 text PRIMARY KEY CHECK(length(event_key_sha256)=64),
 actor_employee_id bigint NOT NULL REFERENCES public.employees(employee_id),
 transaction_id bigint NOT NULL REFERENCES f06_4c_ci.cancel_origins(transaction_id),
 payload_sha256 text NOT NULL CHECK(length(payload_sha256)=64),
 event_id bigint NOT NULL REFERENCES f06_4c_ci.cancel_events(event_id),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE FUNCTION f06_4c_ci.reject_history_change() RETURNS trigger LANGUAGE plpgsql AS $$
 BEGIN RAISE EXCEPTION 'F06_4C_APPEND_ONLY_IMMUTABLE'; END $$;
CREATE TRIGGER attestation_history BEFORE UPDATE OR DELETE ON f06_4c_ci.attestation FOR EACH ROW EXECUTE FUNCTION f06_4c_ci.reject_history_change();
CREATE TRIGGER origins_history BEFORE UPDATE OR DELETE ON f06_4c_ci.cancel_origins FOR EACH ROW EXECUTE FUNCTION f06_4c_ci.reject_history_change();
CREATE TRIGGER events_history BEFORE UPDATE OR DELETE ON f06_4c_ci.cancel_events FOR EACH ROW EXECUTE FUNCTION f06_4c_ci.reject_history_change();
CREATE TRIGGER keys_history BEFORE UPDATE OR DELETE ON f06_4c_ci.request_keys FOR EACH ROW EXECUTE FUNCTION f06_4c_ci.reject_history_change();
