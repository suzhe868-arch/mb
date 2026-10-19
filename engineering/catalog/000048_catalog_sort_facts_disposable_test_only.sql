-- PDM-20 public catalog sorting facts for isolated PG16 only.
-- Registration year is intentionally NOT vehicle_models.model_year.
CREATE TABLE public.f05_catalog_sort_facts_test (
 vehicle_id bigint NOT NULL REFERENCES public.vehicles(vehicle_id) ON DELETE RESTRICT,
 listing_cycle_id bigint NOT NULL,
 source_type text NOT NULL CHECK(source_type IN ('wholesale','mingbang','four_s')),
 first_registration_year integer CHECK(first_registration_year IS NULL OR first_registration_year BETWEEN 1886 AND 2200),
 mileage_km integer CHECK(mileage_km IS NULL OR mileage_km BETWEEN 0 AND 2000000),
 issuer text NOT NULL DEFAULT 'DISPOSABLE_TEST_ONLY' CHECK(issuer='DISPOSABLE_TEST_ONLY'),
 expires_at timestamptz NOT NULL,
 PRIMARY KEY(vehicle_id,listing_cycle_id),
 FOREIGN KEY(listing_cycle_id,vehicle_id)
  REFERENCES public.vehicle_listing_cycles(listing_cycle_id,vehicle_id) ON DELETE RESTRICT
);
REVOKE ALL ON public.f05_catalog_sort_facts_test FROM PUBLIC;
