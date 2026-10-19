-- PDM-12 test-only optional price dependency. No source producer or issuer added.
-- Reconstruct the precise read-time view after 000031; do not weaken demand,
-- vehicle saleability, listing-cycle or source signature guards.
-- PDM-12: disposable-only read-time validity, bounded TTL sweep and affected-pair retry queue.
-- PDM-12 Final §§21-30. This is NOT a formal Rule Dictionary or production issuer.
-- Every future current-result consumer must use this guarded projection, never raw current_state.
CREATE OR REPLACE VIEW public.f05_matching_safe_current_test AS
SELECT r.result_id,r.demand_id,r.vehicle_id,r.listing_cycle_id,r.match_tier
FROM public.demand_match_results r
JOIN public.demands d ON d.demand_id=r.demand_id AND d.demand_state='active'
JOIN public.customers c ON c.customer_id=d.customer_id AND c.account_status='active'
 AND c.owner_assignment_state='assigned'
 AND c.current_owner_employee_id IS NOT NULL
JOIN public.f05_find_car_level_entitlement_test ent ON ent.level_id=c.customer_level_id
 AND ent.issuer='DISPOSABLE_TEST_ONLY' AND ent.can_activate_demand=true
 AND ent.expires_at>statement_timestamp()
JOIN public.f05_matching_sales_description_test descr ON descr.demand_id=d.demand_id
 AND descr.issuer='DISPOSABLE_TEST_ONLY' AND descr.written_by_employee_id=d.responsible_employee_id
 AND descr.expires_at>statement_timestamp()
JOIN public.f05_matching_employee_scope_test scope ON scope.employee_id=d.responsible_employee_id
 AND scope.customer_id=c.customer_id AND scope.can_recompute=true
 AND scope.issuer='DISPOSABLE_TEST_ONLY' AND scope.expires_at>statement_timestamp()
JOIN public.employees e ON e.employee_id=d.responsible_employee_id AND e.employment_status='active'
JOIN public.roles role ON role.role_id=e.main_role_id
 AND role.role_code IN ('sales','manager','store_head')
JOIN public.vehicles v ON v.vehicle_id=r.vehicle_id AND v.archived_at IS NULL
 AND ((v.source_type='wholesale' AND v.source_sale_status='active')
   OR (v.source_type IN ('mingbang','four_s') AND v.source_sale_status='available'))
JOIN public.vehicle_listing_cycles cyc ON cyc.listing_cycle_id=r.listing_cycle_id
 AND cyc.vehicle_id=v.vehicle_id AND cyc.ended_at IS NULL
JOIN public.f05_real_catalog_visibility_test visible ON visible.vehicle_id=v.vehicle_id
 AND visible.listing_cycle_id=cyc.listing_cycle_id AND visible.source_type=v.source_type
 AND visible.verified_isolation='DISPOSABLE_TEST_PROOF_NOT_SIGNED'
 AND visible.expires_at>statement_timestamp()
JOIN public.f05_matching_vehicle_facts_test facts ON facts.vehicle_id=v.vehicle_id
 AND facts.listing_cycle_id=cyc.listing_cycle_id
 AND facts.issuer='DISPOSABLE_TEST_ONLY' AND facts.expires_at>statement_timestamp()
LEFT JOIN public.f05_catalog_price_display_proof_test price ON price.vehicle_id=v.vehicle_id
 AND price.listing_cycle_id=cyc.listing_cycle_id AND price.source_type=v.source_type
 AND price.issuer='DISPOSABLE_TEST_ONLY' AND price.expires_at>statement_timestamp()
WHERE r.current_state='current'
 AND r.match_explanation->'sourceFacts'->>'issuer'='DISPOSABLE_TEST_ONLY'
 -- If the Demand used a numeric budget and the Match relied on a known price,
 -- losing that price proof immediately hides the old current result. If no
 -- budget was asked or no price existed at calculation, that datum is not a
 -- prerequisite to rendering the (possibly confirmation_needed) Match.
 AND (NOT (r.match_explanation->'normalizedCriteria' ? 'budgetCents')
    OR r.match_explanation->'sourceFacts'->>'customerDisplayCents' IS NULL
    OR price.vehicle_id IS NOT NULL);

