-- Isolated test Rule Dictionary fields must match allowed deterministic parser.
-- The old five-field CHECK rejected the real hard fields previously accepted by the service.
ALTER TABLE public.f05_matching_dictionary_rules_test
 DROP CONSTRAINT f05_matching_dictionary_rules_test_mapped_key_check;
ALTER TABLE public.f05_matching_dictionary_rules_test
 ADD CONSTRAINT f05_matching_dictionary_rules_test_mapped_key_check
 CHECK(mapped_key IN ('brandId','minModelYear','maxMileageKm','budgetCents','interiorColor',
  'exteriorColor','powerType','displacementMinCc','displacementMaxCc','displacementCc',
  'excludeCondition'));
