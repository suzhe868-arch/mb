-- F05-1 isolated Employee Vehicle read scope, no formal source or ownership issuer.
CREATE TABLE public.f05_vehicle_read_scope_test(
 employee_id bigint NOT NULL REFERENCES public.employees(employee_id),
 vehicle_id bigint NOT NULL REFERENCES public.vehicles(vehicle_id),
 listing_cycle_id bigint NOT NULL REFERENCES public.vehicle_listing_cycles(listing_cycle_id),
 source_type text NOT NULL CHECK(source_type IN ('wholesale','mingbang','four_s')),
 can_read boolean NOT NULL CHECK(can_read=true),
 issuer text NOT NULL DEFAULT 'DISPOSABLE_TEST_ONLY' CHECK(issuer='DISPOSABLE_TEST_ONLY'),
 expires_at timestamptz NOT NULL,
 PRIMARY KEY(employee_id,vehicle_id,listing_cycle_id),
 FOREIGN KEY(listing_cycle_id,vehicle_id)
  REFERENCES public.vehicle_listing_cycles(listing_cycle_id,vehicle_id)
);
REVOKE ALL ON public.f05_vehicle_read_scope_test FROM PUBLIC;
