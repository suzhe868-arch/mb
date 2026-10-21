-- Issue164 private nonproduction provenance. No public DDL, payments or old signer mutation.
CREATE SCHEMA f06_composite_v1;
CREATE TABLE f06_composite_v1.attestation(
 seal_name text PRIMARY KEY CHECK(seal_name='COMPOSITE_NONPROD_SIGNED_V1'),
 source_sha256 text NOT NULL CHECK(length(source_sha256)=64),
 head_sha text NOT NULL CHECK(length(head_sha)=40),
 run_id text NOT NULL,
 github_ref text NOT NULL CHECK(github_ref='refs/heads/feat/f06-nonprod-single-runtime-trusted-source-01'),
 database_oid oid NOT NULL,
 ledger_sha256 text NOT NULL CHECK(length(ledger_sha256)=64),
 public_catalog_sha256 text NOT NULL CHECK(length(public_catalog_sha256)=64),
 parent_f05_checksum text NOT NULL CHECK(length(parent_f05_checksum)=64),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE f06_composite_v1.issued_events(
 event_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 event_key_sha256 text NOT NULL UNIQUE CHECK(length(event_key_sha256)=64),
 event_kind text NOT NULL CHECK(event_kind IN('signed_lock','signed_deposit','signed_tx','signed_handoff','signed_cancel','signed_refund_pending','signed_refund_closed')),
 parent_object_id bigint NOT NULL CHECK(parent_object_id>0),
 employee_id bigint NOT NULL REFERENCES public.employees(employee_id),
 source_parent_sha256 text NOT NULL CHECK(length(source_parent_sha256)=64),
 head_sha text NOT NULL CHECK(length(head_sha)=40),
 run_id text NOT NULL,
 payload_sha256 text NOT NULL CHECK(length(payload_sha256)=64),
 occurred_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE FUNCTION f06_composite_v1.immutable() RETURNS trigger
 LANGUAGE plpgsql AS $$BEGIN RAISE EXCEPTION 'F06_COMPOSITE_IMMUTABLE'; END$$;
CREATE TRIGGER protect_attestation BEFORE UPDATE OR DELETE ON f06_composite_v1.attestation
 FOR EACH ROW EXECUTE FUNCTION f06_composite_v1.immutable();
CREATE TRIGGER protect_events BEFORE UPDATE OR DELETE ON f06_composite_v1.issued_events
 FOR EACH ROW EXECUTE FUNCTION f06_composite_v1.immutable();
