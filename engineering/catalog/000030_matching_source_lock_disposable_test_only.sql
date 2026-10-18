-- F05-7 DISPOSABLE_TEST_ONLY PG16 advisory synchronization.
-- Matching and source price/facts writers share the same transaction-scoped vehicle
-- lock. BEFORE triggers are essential: AFTER is too late for READ COMMITTED snapshots.
-- These locks are not a production event bus, issuer or deployed migration.
CREATE FUNCTION public.f05_match_vehicle_write_lock_test() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE old_vehicle bigint; new_vehicle bigint;
BEGIN
 IF TG_OP IN ('UPDATE','DELETE') THEN old_vehicle:=OLD.vehicle_id; END IF;
 IF TG_OP IN ('INSERT','UPDATE') THEN new_vehicle:=NEW.vehicle_id; END IF;
 IF old_vehicle IS NOT NULL AND new_vehicle IS NOT NULL
    AND old_vehicle IS DISTINCT FROM new_vehicle THEN
   IF old_vehicle<new_vehicle THEN
     PERFORM pg_advisory_xact_lock(hashtext('F05_MATCH_VEHICLE'),hashtext(old_vehicle::text));
     PERFORM pg_advisory_xact_lock(hashtext('F05_MATCH_VEHICLE'),hashtext(new_vehicle::text));
   ELSE
     PERFORM pg_advisory_xact_lock(hashtext('F05_MATCH_VEHICLE'),hashtext(new_vehicle::text));
     PERFORM pg_advisory_xact_lock(hashtext('F05_MATCH_VEHICLE'),hashtext(old_vehicle::text));
   END IF;
 ELSE
   PERFORM pg_advisory_xact_lock(hashtext('F05_MATCH_VEHICLE'),
                                 hashtext(COALESCE(new_vehicle,old_vehicle)::text));
 END IF;
 RETURN COALESCE(NEW,OLD);
END $$;
CREATE TRIGGER f05_price_before_vehicle_lock_test
 BEFORE INSERT OR UPDATE OR DELETE ON public.f05_catalog_price_display_proof_test
 FOR EACH ROW EXECUTE FUNCTION public.f05_match_vehicle_write_lock_test();
CREATE TRIGGER f05_facts_before_vehicle_lock_test
 BEFORE INSERT OR UPDATE OR DELETE ON public.f05_matching_vehicle_facts_test
 FOR EACH ROW EXECUTE FUNCTION public.f05_match_vehicle_write_lock_test();
