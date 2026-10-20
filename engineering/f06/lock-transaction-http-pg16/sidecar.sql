-- 新F06真实HTTP非生产Transaction原子占用侧表。禁止用于生产DDL。
CREATE SCHEMA f06_real_tx_ci;
CREATE TABLE f06_real_tx_ci.origins(
 transaction_id bigint PRIMARY KEY REFERENCES public.transactions(transaction_id),
 source_lock_id bigint NOT NULL UNIQUE REFERENCES public.locks(lock_id),
 vehicle_id bigint NOT NULL UNIQUE REFERENCES public.vehicles(vehicle_id),
 listing_cycle_id bigint NOT NULL REFERENCES public.vehicle_listing_cycles(listing_cycle_id),
 customer_id bigint NOT NULL REFERENCES public.customers(customer_id),
 responsible_employee_id bigint NOT NULL REFERENCES public.employees(employee_id),
 actor_employee_id bigint NOT NULL REFERENCES public.employees(employee_id),
 state text NOT NULL DEFAULT 'in_progress' CHECK(state='in_progress'),
 carrier text NOT NULL CHECK(carrier='in_progress'),
 issuer text NOT NULL CHECK(issuer='CI_SYNTHETIC_NOT_REAL_MONEY'),
 source_price_kind text,
 source_price_cents bigint,
 priority_origin_id bigint,
 original_deposit_count integer NOT NULL CHECK(original_deposit_count>=0),
 source_refund_digest text NOT NULL CHECK(length(source_refund_digest)=64),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE f06_real_tx_ci.request_keys(
 key_sha256 text PRIMARY KEY CHECK(length(key_sha256)=64),
 fingerprint_sha256 text NOT NULL CHECK(length(fingerprint_sha256)=64),
 employee_id bigint NOT NULL REFERENCES public.employees(employee_id),
 source_lock_id bigint NOT NULL REFERENCES public.locks(lock_id),
 transaction_id bigint NOT NULL REFERENCES f06_real_tx_ci.origins(transaction_id),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE f06_real_tx_ci.events(
 event_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 transaction_id bigint NOT NULL UNIQUE REFERENCES f06_real_tx_ci.origins(transaction_id),
 source_lock_id bigint NOT NULL REFERENCES public.locks(lock_id),
 actor_employee_id bigint NOT NULL REFERENCES public.employees(employee_id),
 event_kind text NOT NULL CHECK(event_kind='lock_to_transaction'),
 source_status text NOT NULL CHECK(source_status='active'),
 final_status text NOT NULL CHECK(final_status='released'),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE FUNCTION f06_real_tx_ci.immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'F06_REAL_TX_APPEND_ONLY'; END $$;
CREATE TRIGGER protect_origins BEFORE UPDATE OR DELETE ON f06_real_tx_ci.origins
 FOR EACH ROW EXECUTE FUNCTION f06_real_tx_ci.immutable();
CREATE TRIGGER protect_keys BEFORE UPDATE OR DELETE ON f06_real_tx_ci.request_keys
 FOR EACH ROW EXECUTE FUNCTION f06_real_tx_ci.immutable();
CREATE TRIGGER protect_events BEFORE UPDATE OR DELETE ON f06_real_tx_ci.events
 FOR EACH ROW EXECUTE FUNCTION f06_real_tx_ci.immutable();
