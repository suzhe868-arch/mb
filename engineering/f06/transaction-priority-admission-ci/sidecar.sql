-- F06-5C：仅可销毁非特权 PostgreSQL16；不修改已签 public DDL。
CREATE SCHEMA f06_5c_ci;
CREATE TABLE f06_5c_ci.attestation (
 seal_name text PRIMARY KEY CHECK (seal_name='F06_5C_CI_ONLY'),
 source_sha256 text NOT NULL CHECK(length(source_sha256)=64),
 parent_f06_5b_sha256 text NOT NULL CHECK(length(parent_f06_5b_sha256)=64),
 public_catalog_sha256 text NOT NULL CHECK(length(public_catalog_sha256)=64),
 signed_ledger_sha256 text NOT NULL CHECK(length(signed_ledger_sha256)=64),
 production_priority_issuer text NOT NULL DEFAULT 'UNWIRED' CHECK(production_priority_issuer='UNWIRED'),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE FUNCTION f06_5c_ci.deny_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'F06_5C_APPEND_ONLY_HISTORY'; END $$;
CREATE TRIGGER attestation_immutable BEFORE UPDATE OR DELETE ON f06_5c_ci.attestation
FOR EACH ROW EXECUTE FUNCTION f06_5c_ci.deny_mutation();
