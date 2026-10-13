-- F06-3B: disposable PG16 synthetic origin only; NOT production Transaction schema.
CREATE SCHEMA f06_3b_ci;
CREATE TABLE f06_3b_ci.attestation(
  seal_name text PRIMARY KEY,
  source_sha256 text NOT NULL,
  public_catalog_sha256 text NOT NULL,
  migration_ledger_sha256 text NOT NULL,
  f06_1_sha256 text NOT NULL,
  f06_2_sha256 text NOT NULL,
  f06_3a_sha256 text NOT NULL,
  signed_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
-- "pending" in frozen public.transactions is NOT the PDM19 in_progress status.
-- The strictly CI-only projection maps public pending to signed in_progress.
CREATE TABLE f06_3b_ci.transaction_origins(
  transaction_id bigint PRIMARY KEY REFERENCES public.transactions(transaction_id),
  source_lock_id bigint NOT NULL UNIQUE REFERENCES public.locks(lock_id),
  vehicle_id bigint NOT NULL REFERENCES public.vehicles(vehicle_id),
  listing_cycle_id bigint NOT NULL REFERENCES public.vehicle_listing_cycles(listing_cycle_id),
  customer_id bigint NOT NULL REFERENCES public.customers(customer_id),
  original_responsible_employee_id bigint NOT NULL REFERENCES public.employees(employee_id),
  opening_actor_employee_id bigint NOT NULL REFERENCES public.employees(employee_id),
  status text NOT NULL DEFAULT 'in_progress' CHECK(status='in_progress'),
  public_carrier_status text NOT NULL CHECK(public_carrier_status='pending'),
  lock_end_reason text NOT NULL CHECK(lock_end_reason='converted_to_transaction'),
  lock_initial_hours integer NOT NULL CHECK(lock_initial_hours>0),
  lock_policy_version integer NOT NULL,
  source_price_kind text,
  source_price_cents bigint,
  priority_origin_id bigint,
  deposit_receipt_count integer NOT NULL CHECK(deposit_receipt_count>=0),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  CONSTRAINT f06_3b_unique_transaction_per_vehicle UNIQUE(vehicle_id),
  CONSTRAINT f06_3b_source_origin_unique UNIQUE(source_lock_id,customer_id,vehicle_id,listing_cycle_id)
);
CREATE TABLE f06_3b_ci.request_keys(
  event_key_sha256 text PRIMARY KEY CHECK(length(event_key_sha256)=64),
  opening_actor_employee_id bigint NOT NULL REFERENCES public.employees(employee_id),
  source_lock_id bigint NOT NULL REFERENCES public.locks(lock_id),
  resulting_transaction_id bigint NOT NULL REFERENCES f06_3b_ci.transaction_origins(transaction_id),
  action text NOT NULL CHECK(action='open'),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE f06_3b_ci.origin_events(
  event_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  transaction_id bigint NOT NULL UNIQUE REFERENCES f06_3b_ci.transaction_origins(transaction_id),
  source_lock_id bigint NOT NULL REFERENCES public.locks(lock_id),
  previous_lock_status text NOT NULL CHECK(previous_lock_status='active'),
  final_lock_status text NOT NULL CHECK(final_lock_status='released'),
  event_kind text NOT NULL CHECK(event_kind='lock_converted_to_transaction'),
  actor_employee_id bigint NOT NULL REFERENCES public.employees(employee_id),
  event_key_sha256 text NOT NULL UNIQUE REFERENCES f06_3b_ci.request_keys(event_key_sha256) DEFERRABLE INITIALLY DEFERRED,
  occurred_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE FUNCTION f06_3b_ci.immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'F06_3B_IMMUTABLE_TRANSACTION_ORIGIN'; END $$;
CREATE TRIGGER immutable_origins BEFORE UPDATE OR DELETE ON f06_3b_ci.transaction_origins FOR EACH ROW EXECUTE FUNCTION f06_3b_ci.immutable();
CREATE TRIGGER immutable_requests BEFORE UPDATE OR DELETE ON f06_3b_ci.request_keys FOR EACH ROW EXECUTE FUNCTION f06_3b_ci.immutable();
CREATE TRIGGER immutable_events BEFORE UPDATE OR DELETE ON f06_3b_ci.origin_events FOR EACH ROW EXECUTE FUNCTION f06_3b_ci.immutable();
