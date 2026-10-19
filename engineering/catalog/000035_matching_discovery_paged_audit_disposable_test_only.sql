-- PDM-12 disposable-only finite paging: prior audit events remain immutable,
-- old events are backfilled with false (legacy >=51 attempts returned 409 with NO audit).
-- Has-more is a look-ahead hint, not a guarantee that a later candidate remains valid.
ALTER TABLE public.f05_matching_discovery_events_test
 ADD COLUMN has_more boolean NOT NULL DEFAULT false;
