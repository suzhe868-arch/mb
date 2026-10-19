-- F06普通Lock生命周期隔离测试sidecar；不修改public M94结构、签名迁移、资金事实或生产权限。
DO $$ BEGIN
 IF current_database()<>'f06_lock_test' OR current_user<>'f06_lock_ci' THEN RAISE EXCEPTION 'F06_LOCK_LIFECYCLE_TEST_DATABASE_REQUIRED'; END IF;
 IF current_setting('server_version_num')::integer<160000 OR current_setting('server_version_num')::integer>=170000 THEN RAISE EXCEPTION 'F06_LOCK_LIFECYCLE_PG16_REQUIRED'; END IF;
 IF (SELECT rolsuper FROM pg_roles WHERE rolname=current_user) IS DISTINCT FROM false OR (SELECT rolcreatedb FROM pg_roles WHERE rolname=current_user) IS DISTINCT FROM false THEN RAISE EXCEPTION 'F06_LOCK_LIFECYCLE_NONPRIVILEGED_ROLE_REQUIRED'; END IF;
END $$;
CREATE TABLE f06_real_lock_test.lock_lifecycle_finance_proofs(
 lock_id BIGINT PRIMARY KEY REFERENCES public.locks(lock_id),
 proof_kind TEXT NOT NULL CHECK(proof_kind IN('synthetic_absence_confirmed','present','unknown')),
 issuer TEXT NOT NULL CHECK(issuer='DISPOSABLE_TEST_ONLY'),
 synthetic_only BOOLEAN NOT NULL DEFAULT true CHECK(synthetic_only=true),
 evidence_sha256 TEXT NOT NULL CHECK(evidence_sha256 ~ '^[a-f0-9]{64}$'),
 created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE f06_real_lock_test.lock_lifecycle_events(
 event_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 lock_id BIGINT NOT NULL REFERENCES public.locks(lock_id),
 event_key_sha256 TEXT NOT NULL UNIQUE CHECK(event_key_sha256 ~ '^[a-f0-9]{64}$'),
 payload_sha256 TEXT NOT NULL CHECK(payload_sha256 ~ '^[a-f0-9]{64}$'),
 action TEXT NOT NULL CHECK(action IN('extend','release','cancel','expire')),
 actor_kind TEXT NOT NULL CHECK(actor_kind IN('employee','system')),
 actor_employee_id BIGINT REFERENCES public.employees(employee_id),
 old_status TEXT NOT NULL,new_status TEXT NOT NULL,
 old_expires_at TIMESTAMPTZ NOT NULL,new_expires_at TIMESTAMPTZ NOT NULL,
 reason TEXT NOT NULL CHECK(length(btrim(reason)) BETWEEN 1 AND 240),
 result_json JSONB NOT NULL,occurred_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
 CHECK((actor_kind='employee' AND actor_employee_id IS NOT NULL) OR (actor_kind='system' AND actor_employee_id IS NULL)),
 CHECK((action='extend' AND old_status='active' AND new_status='active' AND new_expires_at>old_expires_at) OR
  (action<>'extend' AND old_status='active' AND new_status IN('released','cancelled','expired') AND new_expires_at=old_expires_at))
);
CREATE INDEX lock_lifecycle_events_by_lock ON f06_real_lock_test.lock_lifecycle_events(lock_id,event_id);
CREATE OR REPLACE FUNCTION f06_real_lock_test.reject_lifecycle_history_mutation() RETURNS trigger LANGUAGE plpgsql
AS $$ BEGIN RAISE EXCEPTION 'F06_LOCK_LIFECYCLE_HISTORY_IMMUTABLE'; END $$;
CREATE TRIGGER lock_lifecycle_events_append_only BEFORE UPDATE OR DELETE ON f06_real_lock_test.lock_lifecycle_events
 FOR EACH ROW EXECUTE FUNCTION f06_real_lock_test.reject_lifecycle_history_mutation();
CREATE TRIGGER lock_lifecycle_events_no_truncate BEFORE TRUNCATE ON f06_real_lock_test.lock_lifecycle_events
 FOR EACH STATEMENT EXECUTE FUNCTION f06_real_lock_test.reject_lifecycle_history_mutation();
CREATE TRIGGER lock_lifecycle_finance_proofs_append_only BEFORE UPDATE OR DELETE ON f06_real_lock_test.lock_lifecycle_finance_proofs
 FOR EACH ROW EXECUTE FUNCTION f06_real_lock_test.reject_lifecycle_history_mutation();
CREATE TRIGGER lock_lifecycle_proofs_no_truncate BEFORE TRUNCATE ON f06_real_lock_test.lock_lifecycle_finance_proofs
 FOR EACH STATEMENT EXECUTE FUNCTION f06_real_lock_test.reject_lifecycle_history_mutation();
