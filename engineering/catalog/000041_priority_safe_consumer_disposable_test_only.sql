-- Isolated consumer contract: Priority must be current by PDM12 source+qualification,
-- not merely stored as raw status='active'. Independent PDM14 Recommendation persists.
CREATE OR REPLACE VIEW public.f05_recommendation_safe_customer_test AS
 SELECT r.recommendation_id,r.customer_id,r.vehicle_id,r.listing_cycle_id,
   v.platform_visibility,s.customer_price_cents
 FROM public.recommendations r
 JOIN public.f05_recommendation_snapshot_test s ON s.recommendation_id=r.recommendation_id
 JOIN public.customers c ON c.customer_id=r.customer_id AND c.account_status='active'
 JOIN public.f05_find_car_level_entitlement_test e ON e.level_id=c.customer_level_id
  AND e.can_activate_demand=true AND e.issuer='DISPOSABLE_TEST_ONLY'
  AND e.expires_at>statement_timestamp()
 JOIN public.vehicles v ON v.vehicle_id=r.vehicle_id AND v.archived_at IS NULL
   AND ((v.source_type='wholesale' AND v.source_sale_status='active')
      OR (v.source_type IN('mingbang','four_s') AND v.source_sale_status='available'))
 JOIN public.vehicle_listing_cycles cy ON cy.listing_cycle_id=r.listing_cycle_id
  AND cy.vehicle_id=v.vehicle_id AND cy.ended_at IS NULL
 JOIN public.f05_real_catalog_visibility_test vis ON vis.vehicle_id=v.vehicle_id
  AND vis.listing_cycle_id=cy.listing_cycle_id AND vis.source_type=v.source_type
  AND vis.verified_isolation='DISPOSABLE_TEST_PROOF_NOT_SIGNED'
  AND vis.expires_at>statement_timestamp()
 WHERE r.status='active'
 AND (v.platform_visibility='visible' OR EXISTS (
   SELECT 1 FROM public.vehicle_visibility_grants g
   WHERE g.source_recommendation_id=r.recommendation_id AND g.customer_id=r.customer_id
    AND g.vehicle_id=r.vehicle_id AND g.revoked_at IS NULL))
 AND NOT EXISTS(
   SELECT 1 FROM public.f05_priority_safe_active_test priority WHERE priority.vehicle_id=r.vehicle_id
   AND priority.listing_cycle_id=r.listing_cycle_id AND priority.customer_id<>r.customer_id);

