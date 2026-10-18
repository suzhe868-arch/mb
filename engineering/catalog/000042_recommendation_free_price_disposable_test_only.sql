-- PDM10/PDM14 Recommendation free price-right: append-only audit is test-only.
-- Actual per-cycle entitlement uses frozen F02 customer_price_cycle_unlocks.
CREATE TABLE public.f05_recommendation_price_grant_events_test(
 recommendation_id bigint PRIMARY KEY REFERENCES public.recommendations(recommendation_id),
 customer_id bigint NOT NULL REFERENCES public.customers(customer_id),
 vehicle_id bigint NOT NULL REFERENCES public.vehicles(vehicle_id),
 listing_cycle_id bigint NOT NULL,
 unlock_id bigint NOT NULL REFERENCES public.customer_price_cycle_unlocks(unlock_id),
 outcome text NOT NULL CHECK(outcome IN('RECOMMENDATION_FREE_GRANTED','PRIOR_UNLOCK_RETAINED')),
 issuer text NOT NULL DEFAULT 'DISPOSABLE_TEST_ONLY' CHECK(issuer='DISPOSABLE_TEST_ONLY'),
 occurred_at timestamptz NOT NULL DEFAULT statement_timestamp(),
 FOREIGN KEY(listing_cycle_id,vehicle_id) REFERENCES public.vehicle_listing_cycles(listing_cycle_id,vehicle_id)
);
CREATE TRIGGER f05_recommendation_free_grant_immutable_test
 BEFORE UPDATE OR DELETE ON public.f05_recommendation_price_grant_events_test
 FOR EACH ROW EXECUTE FUNCTION public.f05_rec_immutable_test();
REVOKE ALL ON public.f05_recommendation_price_grant_events_test FROM PUBLIC;
