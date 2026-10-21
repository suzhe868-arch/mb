-- Issue171: private disposable PG16 lifecycle attestation and append-only event carrier.
-- No public schema or legacy F06 sidecar alteration is permitted.
CREATE SCHEMA f06_composite_lifecycle_v2;
CREATE TABLE f06_composite_lifecycle_v2.attestation(
 seal_name text PRIMARY KEY CHECK(seal_name='ISSUE171_COMPOSITE_LIFECYCLE_SIGNED_V2'),
 source_sha256 text NOT NULL CHECK(length(source_sha256)=64),
 parent_source_sha256 text NOT NULL CHECK(length(parent_source_sha256)=64),
 head_sha text NOT NULL CHECK(length(head_sha)=40),
 run_id text NOT NULL,
 github_ref text NOT NULL CHECK(github_ref='refs/heads/feat/f06-nonprod-composite-lock-lifecycle-01'),
 database_oid oid NOT NULL,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE f06_composite_lifecycle_v2.lock_lifecycle_events(
 event_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 lock_id bigint NOT NULL REFERENCES public.locks(lock_id) DEFERRABLE INITIALLY DEFERRED,
 event_key_sha256 text NOT NULL UNIQUE CHECK(length(event_key_sha256)=64),
 payload_sha256 text NOT NULL CHECK(length(payload_sha256)=64),
 action text NOT NULL CHECK(action IN('extend','release','cancel','expire')),
 actor_kind text NOT NULL CHECK(actor_kind IN('employee','system')),
 actor_employee_id bigint REFERENCES public.employees(employee_id),
 old_status text NOT NULL,
 new_status text NOT NULL,
 old_expires_at timestamptz NOT NULL,
 new_expires_at timestamptz NOT NULL,
 reason text NOT NULL,
 result_json jsonb NOT NULL,
 source_parent_sha256 text NOT NULL CHECK(length(source_parent_sha256)=64),
 head_sha text NOT NULL CHECK(length(head_sha)=40),
 run_id text NOT NULL,
 at timestamptz NOT NULL DEFAULT clock_timestamp(),
 CHECK((actor_kind='employee' AND actor_employee_id IS NOT NULL) OR
       (actor_kind='system' AND actor_employee_id IS NULL))
);
CREATE FUNCTION f06_composite_lifecycle_v2.reject_mutation() RETURNS trigger
 LANGUAGE plpgsql AS $$BEGIN RAISE EXCEPTION 'F06_171_IMMUTABLE_HISTORY'; END$$;
CREATE TRIGGER prevent_attestation_mutation BEFORE UPDATE OR DELETE
 ON f06_composite_lifecycle_v2.attestation FOR EACH ROW
 EXECUTE FUNCTION f06_composite_lifecycle_v2.reject_mutation();
CREATE TRIGGER prevent_event_mutation BEFORE UPDATE OR DELETE
 ON f06_composite_lifecycle_v2.lock_lifecycle_events FOR EACH ROW
 EXECUTE FUNCTION f06_composite_lifecycle_v2.reject_mutation();
CREATE TRIGGER prevent_attestation_truncate BEFORE TRUNCATE
 ON f06_composite_lifecycle_v2.attestation FOR EACH STATEMENT
 EXECUTE FUNCTION f06_composite_lifecycle_v2.reject_mutation();
CREATE TRIGGER prevent_event_truncate BEFORE TRUNCATE
 ON f06_composite_lifecycle_v2.lock_lifecycle_events FOR EACH STATEMENT
 EXECUTE FUNCTION f06_composite_lifecycle_v2.reject_mutation();
