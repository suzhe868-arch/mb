-- F05-4 CI-only v20: additive synthetic policy and price authority test fixtures.
-- These tables DO NOT prove live WeChat / JYT / customer_display source or production readiness.
CREATE TABLE public.f05_4_level_price_policy_ci (
 level_id BIGINT PRIMARY KEY REFERENCES public.customer_levels(level_id) ON DELETE RESTRICT,
 price_mode TEXT NOT NULL CHECK (price_mode IN ('LIMITED','UNLIMITED')),
 daily_base_quota INTEGER NOT NULL CHECK (daily_base_quota>=0),
 source_marker TEXT NOT NULL DEFAULT 'SYNTHETIC_CI_POLICY_ONLY'
    CHECK(source_marker='SYNTHETIC_CI_POLICY_ONLY')
);
CREATE TABLE public.f05_4_current_price_ci (
 vehicle_id BIGINT NOT NULL,
 listing_cycle_id BIGINT NOT NULL,
 customer_display_cents BIGINT CHECK(customer_display_cents>0),
 source_marker TEXT NOT NULL DEFAULT 'SYNTHETIC_CI_CUSTOMER_DISPLAY_ONLY'
    CHECK(source_marker='SYNTHETIC_CI_CUSTOMER_DISPLAY_ONLY'),
 PRIMARY KEY(vehicle_id,listing_cycle_id),
 FOREIGN KEY(listing_cycle_id,vehicle_id)
    REFERENCES public.vehicle_listing_cycles(listing_cycle_id,vehicle_id) ON DELETE RESTRICT
);
-- Record an immutable v19 ledger seal before/at the v20 transition.
CREATE TABLE public.f05_4_migration_attestation (
 seal_key TEXT PRIMARY KEY CHECK(seal_key='M94_TO_V19_SIGNED_LEDGER'),
 preceding_records_sha256 TEXT NOT NULL CHECK(preceding_records_sha256 ~ '^[0-9a-f]{64}$'),
 prior_migration_checksum TEXT NOT NULL CHECK(prior_migration_checksum ~ '^[0-9a-f]{64}$'),
 prior_structure_sha256 TEXT NOT NULL CHECK(prior_structure_sha256 ~ '^[0-9a-f]{64}$'),
 sealed_at TIMESTAMPTZ NOT NULL DEFAULT transaction_timestamp()
);
-- Successful LIMITED debit events are irreversibly historical. No direct update/delete.
CREATE FUNCTION public.f05_4_no_charge_history_rewrite()
 RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'F05_4_SUCCESSFUL_CHARGE_EVENT_IMMUTABLE' USING ERRCODE='23514'; END $$;
CREATE TRIGGER f05_4_charge_event_immutable BEFORE UPDATE OR DELETE
 ON public.customer_price_unlock_events FOR EACH ROW
 EXECUTE FUNCTION public.f05_4_no_charge_history_rewrite();
CREATE TRIGGER f05_4_migration_attestation_immutable BEFORE UPDATE OR DELETE
 ON public.f05_4_migration_attestation FOR EACH ROW
 EXECUTE FUNCTION public.f05_4_no_charge_history_rewrite();
REVOKE ALL ON public.f05_4_level_price_policy_ci FROM PUBLIC;
REVOKE ALL ON public.f05_4_current_price_ci FROM PUBLIC;
REVOKE ALL ON public.f05_4_migration_attestation FROM PUBLIC;
