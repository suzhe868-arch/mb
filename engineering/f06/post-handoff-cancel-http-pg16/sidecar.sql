-- CI-only signed PR139+PR153 post-handoff cancellation; not public/production DDL.
CREATE SCHEMA f06_real_post_handoff_cancel_ci;
CREATE TABLE f06_real_post_handoff_cancel_ci.attestation(
 seal_name text PRIMARY KEY CHECK(seal_name='F06_REAL_POST_HANDOFF_CANCEL_CI_ONLY'),
 source_sha256 text NOT NULL CHECK(length(source_sha256)=64),
 handoff_source_sha256 text NOT NULL CHECK(length(handoff_source_sha256)=64),
 public_catalog_sha256 text NOT NULL CHECK(length(public_catalog_sha256)=64),
 ledger_sha256 text NOT NULL CHECK(length(ledger_sha256)=64),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE f06_real_post_handoff_cancel_ci.origins(
 transaction_id bigint PRIMARY KEY REFERENCES public.transactions(transaction_id),
 source_lock_id bigint NOT NULL REFERENCES public.locks(lock_id),
 customer_id bigint NOT NULL REFERENCES public.customers(customer_id),
 vehicle_id bigint NOT NULL REFERENCES public.vehicles(vehicle_id),
 listing_cycle_id bigint NOT NULL REFERENCES public.vehicle_listing_cycles(listing_cycle_id),
 original_responsible_employee_id bigint NOT NULL REFERENCES public.employees(employee_id),
 current_responsible_employee_id bigint NOT NULL REFERENCES public.employees(employee_id),
 actor_employee_id bigint NOT NULL REFERENCES public.employees(employee_id),
 handoff_version integer NOT NULL CHECK(handoff_version>=1),
 handoff_event_digest text NOT NULL CHECK(length(handoff_event_digest)=64),
 parent_tx_digest text NOT NULL CHECK(length(parent_tx_digest)=64),
 reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 6 AND 240),
 issuer text NOT NULL CHECK(issuer='CI_SYNTHETIC_NOT_REAL_MONEY'),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 CHECK(current_responsible_employee_id<>original_responsible_employee_id OR handoff_version>=2)
);
CREATE TABLE f06_real_post_handoff_cancel_ci.events(
 event_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 transaction_id bigint NOT NULL UNIQUE REFERENCES f06_real_post_handoff_cancel_ci.origins(transaction_id),
 actor_employee_id bigint NOT NULL REFERENCES public.employees(employee_id),
 handoff_version integer NOT NULL CHECK(handoff_version>=1),
 event_key_sha256 text NOT NULL UNIQUE CHECK(length(event_key_sha256)=64),
 reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 6 AND 240),
 event_kind text NOT NULL DEFAULT 'post_handoff_cancelled_without_payment' CHECK(event_kind='post_handoff_cancelled_without_payment'),
 occurred_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE f06_real_post_handoff_cancel_ci.request_keys(
 event_key_sha256 text PRIMARY KEY CHECK(length(event_key_sha256)=64),
 transaction_id bigint NOT NULL REFERENCES f06_real_post_handoff_cancel_ci.origins(transaction_id),
 actor_employee_id bigint NOT NULL REFERENCES public.employees(employee_id),
 payload_sha256 text NOT NULL CHECK(length(payload_sha256)=64),
 event_id bigint NOT NULL UNIQUE REFERENCES f06_real_post_handoff_cancel_ci.events(event_id),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE FUNCTION f06_real_post_handoff_cancel_ci.reject_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'F06_POST_CANCEL_IMMUTABLE_SIGNED_HISTORY'; END $$;
CREATE TRIGGER immutable_att BEFORE UPDATE OR DELETE ON f06_real_post_handoff_cancel_ci.attestation FOR EACH ROW EXECUTE FUNCTION f06_real_post_handoff_cancel_ci.reject_mutation();
CREATE TRIGGER immutable_origins BEFORE UPDATE OR DELETE ON f06_real_post_handoff_cancel_ci.origins FOR EACH ROW EXECUTE FUNCTION f06_real_post_handoff_cancel_ci.reject_mutation();
CREATE TRIGGER immutable_events BEFORE UPDATE OR DELETE ON f06_real_post_handoff_cancel_ci.events FOR EACH ROW EXECUTE FUNCTION f06_real_post_handoff_cancel_ci.reject_mutation();
CREATE TRIGGER immutable_keys BEFORE UPDATE OR DELETE ON f06_real_post_handoff_cancel_ci.request_keys FOR EACH ROW EXECUTE FUNCTION f06_real_post_handoff_cancel_ci.reject_mutation();
