-- PDM-12: isolated evidence-backed hard matching facts, no guessed defaults.
ALTER TABLE public.f05_matching_vehicle_facts_test
 ADD COLUMN exterior_color text CHECK(exterior_color IS NULL OR exterior_color IN('black','white','grey','silver','red','blue','brown','gold','green')),
 ADD COLUMN power_type text CHECK(power_type IS NULL OR power_type IN('gasoline','diesel','hybrid','plugin_hybrid','electric')),
 ADD COLUMN displacement_cc integer CHECK(displacement_cc IS NULL OR displacement_cc BETWEEN 100 AND 10000),
 ADD COLUMN condition_flags text[] CHECK(condition_flags IS NULL OR
   (array_position(condition_flags,NULL) IS NULL AND condition_flags <@ ARRAY['major_accident','flood','fire','structural_damage']::text[]));
-- Extend existing physical stale invalidation: newly added facts must not leave old current.
CREATE OR REPLACE FUNCTION public.f05_match_on_vehicle_fact_test() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='INSERT' THEN
  PERFORM public.f05_match_mark_stale_affected_test('VEHICLE_SOURCE_FACT',NULL,NEW.vehicle_id,NEW.listing_cycle_id);
 ELSIF TG_OP='DELETE' THEN
  PERFORM public.f05_match_mark_stale_affected_test('VEHICLE_SOURCE_FACT',NULL,OLD.vehicle_id,OLD.listing_cycle_id);
 ELSIF (NEW.source_brand_id,NEW.source_model_year,NEW.mileage_km,NEW.interior_color,
        NEW.exterior_color,NEW.power_type,NEW.displacement_cc,NEW.condition_flags,NEW.expires_at)
 IS DISTINCT FROM
       (OLD.source_brand_id,OLD.source_model_year,OLD.mileage_km,OLD.interior_color,
        OLD.exterior_color,OLD.power_type,OLD.displacement_cc,OLD.condition_flags,OLD.expires_at)
 THEN
  PERFORM public.f05_match_mark_stale_affected_test('VEHICLE_SOURCE_FACT',NULL,NEW.vehicle_id,NEW.listing_cycle_id);
 END IF;
 RETURN COALESCE(NEW,OLD);
END $$;
