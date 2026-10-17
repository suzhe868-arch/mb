-- NON-PRODUCTION DISPOSABLE TEST SIDECAR ONLY; no signed public source issuer.
-- Requires M94/frozen Vehicle and Cycle base schema. Must never migrate production.
CREATE TABLE public.f05_real_catalog_visibility_test (
 vehicle_id bigint NOT NULL,
 listing_cycle_id bigint NOT NULL,
 allow_anonymous boolean NOT NULL DEFAULT false,
 verified_isolation text NOT NULL DEFAULT 'DISPOSABLE_TEST_PROOF_NOT_SIGNED'
 CHECK (verified_isolation='DISPOSABLE_TEST_PROOF_NOT_SIGNED'),
 expires_at timestamptz NOT NULL,
 PRIMARY KEY(vehicle_id,listing_cycle_id),
 FOREIGN KEY(listing_cycle_id,vehicle_id)
 REFERENCES public.vehicle_listing_cycles(listing_cycle_id,vehicle_id) ON DELETE RESTRICT
);
CREATE TABLE public.f05_real_catalog_protections_test (
 vehicle_id bigint NOT NULL,
 listing_cycle_id bigint NOT NULL,
 protection_kind text NOT NULL CHECK (protection_kind IN ('PRIORITY','HIDDEN','SOLD','OFFLINE','OWNER_UNPROVEN')),
 ended_at timestamptz,
 PRIMARY KEY(vehicle_id,listing_cycle_id,protection_kind),
 FOREIGN KEY(listing_cycle_id,vehicle_id)
 REFERENCES public.vehicle_listing_cycles(listing_cycle_id,vehicle_id) ON DELETE RESTRICT
);
REVOKE ALL ON public.f05_real_catalog_visibility_test,public.f05_real_catalog_protections_test FROM PUBLIC;
