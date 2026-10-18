-- F05/PDM12 isolated rule-change candidate discovery; no production issuer.
-- Existing events and audit immutability remain untouched.
ALTER TABLE public.f05_matching_discovery_events_test
 DROP CONSTRAINT f05_matching_discovery_events_test_trigger_kind_check;
ALTER TABLE public.f05_matching_discovery_events_test
 ADD CONSTRAINT f05_matching_discovery_events_test_trigger_kind_check
 CHECK(trigger_kind IN('NEW_DEMAND','NEW_VEHICLE','RULE_CHANGE'));
