
-- F05-10-D1 / PDM17: disposable PG16, explicit synthetic authority, never production.
CREATE SCHEMA d1_owner_ci;
CREATE TABLE d1_owner_ci.pool_cycles(
 cycle_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 customer_id BIGINT NOT NULL REFERENCES public.customers(customer_id),
 team_id BIGINT NOT NULL REFERENCES public.teams(team_id),
 state TEXT NOT NULL CHECK(state IN ('in_pool','assigned','pending')),
 synthetic_source TEXT NOT NULL CHECK(synthetic_source='CI_SYNTHETIC_PDM17_POOL_ENTRY_NOT_PRODUCTION'),
 original_source_json JSONB NOT NULL,
 source_event_key TEXT NOT NULL UNIQUE,
 protective_hold BOOLEAN NOT NULL DEFAULT false,
 entered_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
 exited_at TIMESTAMPTZ,
 CHECK ((state='assigned')=(exited_at IS NOT NULL))
);
CREATE UNIQUE INDEX active_pool_one_customer ON d1_owner_ci.pool_cycles(customer_id) WHERE state IN ('in_pool','pending');
CREATE TABLE d1_owner_ci.config(
 scope_team_id BIGINT PRIMARY KEY REFERENCES public.teams(team_id),
 max_claims_per_day INTEGER NOT NULL CHECK(max_claims_per_day>=0),
 cooldown_seconds INTEGER NOT NULL CHECK(cooldown_seconds>=0),
 version BIGINT NOT NULL CHECK(version>0)
);
CREATE TABLE d1_owner_ci.receipts(
 receipt_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 cycle_id BIGINT NOT NULL UNIQUE REFERENCES d1_owner_ci.pool_cycles(cycle_id),
 customer_id BIGINT NOT NULL REFERENCES public.customers(customer_id),
 previous_owner_id BIGINT,
 new_owner_id BIGINT NOT NULL REFERENCES public.employees(employee_id),
 actor_employee_id BIGINT REFERENCES public.employees(employee_id),
 mode TEXT NOT NULL CHECK(mode IN ('claim','assign','service')),
 request_key TEXT NOT NULL UNIQUE CHECK(length(request_key) BETWEEN 20 AND 160),
 original_source_json JSONB NOT NULL,
 policy_version BIGINT NOT NULL,
 owner_history_id BIGINT NOT NULL REFERENCES public.customer_owner_history(owner_history_id),
 audit_id BIGINT NOT NULL REFERENCES public.audit_events(audit_id),
 committed_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
 source_marker TEXT NOT NULL DEFAULT 'CI_SYNTHETIC_AUTHORITY_ONLY'
 CHECK(source_marker='CI_SYNTHETIC_AUTHORITY_ONLY'),
 CHECK(previous_owner_id IS NULL)
);
CREATE TABLE d1_owner_ci.attestation(
 seal_name TEXT PRIMARY KEY CHECK(seal_name='D1_INDEPENDENT_FROM_SIGNED_V25'),
 sidecar_source_sha256 TEXT NOT NULL CHECK(length(sidecar_source_sha256)=64),
 prior_ledger_sha256 TEXT NOT NULL CHECK(length(prior_ledger_sha256)=64),
 old_public_catalog_sha256 TEXT NOT NULL CHECK(length(old_public_catalog_sha256)=64)
);
CREATE FUNCTION d1_owner_ci.immutable_history() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'D1_OWNER_HISTORY_IMMUTABLE' USING ERRCODE='23514'; END $$;
CREATE TRIGGER d1_receipt_immutable BEFORE UPDATE OR DELETE ON d1_owner_ci.receipts
 FOR EACH ROW EXECUTE FUNCTION d1_owner_ci.immutable_history();
CREATE TRIGGER d1_attestation_immutable BEFORE UPDATE OR DELETE ON d1_owner_ci.attestation
 FOR EACH ROW EXECUTE FUNCTION d1_owner_ci.immutable_history();
-- Formal pool-entry source fields may never be rewritten; state/hold governance is separate.
CREATE FUNCTION d1_owner_ci.guard_pool_source() RETURNS trigger LANGUAGE plpgsql AS $d1guard$
BEGIN
 IF TG_OP='DELETE' THEN
  RAISE EXCEPTION 'D1_POOL_ENTRY_SOURCE_IMMUTABLE' USING ERRCODE='23514';
 END IF;
 IF NEW.customer_id IS DISTINCT FROM OLD.customer_id
  OR NEW.team_id IS DISTINCT FROM OLD.team_id
  OR NEW.synthetic_source IS DISTINCT FROM OLD.synthetic_source
  OR NEW.original_source_json IS DISTINCT FROM OLD.original_source_json
  OR NEW.source_event_key IS DISTINCT FROM OLD.source_event_key
  OR NEW.entered_at IS DISTINCT FROM OLD.entered_at THEN
  RAISE EXCEPTION 'D1_POOL_ENTRY_SOURCE_IMMUTABLE' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $d1guard$;
CREATE TRIGGER d1_pool_original_immutable BEFORE UPDATE OR DELETE ON d1_owner_ci.pool_cycles
 FOR EACH ROW EXECUTE FUNCTION d1_owner_ci.guard_pool_source();
REVOKE ALL ON SCHEMA d1_owner_ci FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA d1_owner_ci FROM PUBLIC;
