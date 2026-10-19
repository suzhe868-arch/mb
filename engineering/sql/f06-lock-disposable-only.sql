-- 名邦 F06：仅在 f06_lock_test / f06_lock_ci 独立 PostgreSQL16 环境执行。
-- 不修改公共 M94 迁移；不能作为生产表结构或正式 Source Issuer。
DO $$ BEGIN
 IF current_database()<>'f06_lock_test' OR current_user<>'f06_lock_ci'
 THEN RAISE EXCEPTION 'F06_TEST_ONLY_DATABASE_REQUIRED'; END IF;
 IF current_setting('server_version_num')::integer < 160000 OR current_setting('server_version_num')::integer >= 170000
 THEN RAISE EXCEPTION 'PG16_REQUIRED'; END IF;
END $$;
CREATE SCHEMA IF NOT EXISTS f06_real_lock_test;
CREATE TABLE IF NOT EXISTS f06_real_lock_test.customer_sessions (
 token_sha256 TEXT PRIMARY KEY CHECK(length(token_sha256)=64),
 customer_id BIGINT NOT NULL REFERENCES public.customers(customer_id),
 issuer TEXT NOT NULL CHECK(issuer='DISPOSABLE_TEST_ONLY'),
 expires_at TIMESTAMPTZ NOT NULL,
 revoked_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS f06_real_lock_test.employee_sessions (
 token_sha256 TEXT PRIMARY KEY CHECK(length(token_sha256)=64),
 employee_id BIGINT NOT NULL REFERENCES public.employees(employee_id),
 account_id BIGINT NOT NULL REFERENCES public.pc_login_accounts(account_id),
 credential_epoch BIGINT NOT NULL CHECK(credential_epoch>0),
 issuer TEXT NOT NULL CHECK(issuer='DISPOSABLE_TEST_ONLY'),
 expires_at TIMESTAMPTZ NOT NULL,
 revoked_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS f06_real_lock_test.policy (
 policy_id INTEGER PRIMARY KEY CHECK(policy_id=1),
 initial_lock_hours INTEGER NOT NULL CHECK(initial_lock_hours>0 AND initial_lock_hours<=720),
 version INTEGER NOT NULL CHECK(version>0)
);
INSERT INTO f06_real_lock_test.policy(policy_id,initial_lock_hours,version)
 VALUES(1,72,1) ON CONFLICT(policy_id) DO NOTHING;
CREATE SEQUENCE IF NOT EXISTS f06_real_lock_test.request_ids START WITH 961800001;
CREATE SEQUENCE IF NOT EXISTS f06_real_lock_test.lock_ids START WITH 971800001;
CREATE SEQUENCE IF NOT EXISTS f06_real_lock_test.waitlist_ids START WITH 981800001;
CREATE TABLE IF NOT EXISTS f06_real_lock_test.request_keys (
 request_id BIGINT PRIMARY KEY REFERENCES public.lock_requests(lock_request_id) DEFERRABLE INITIALLY DEFERRED,
 customer_id BIGINT NOT NULL REFERENCES public.customers(customer_id),
 key_sha256 TEXT NOT NULL UNIQUE CHECK(length(key_sha256)=64),
 payload_sha256 TEXT NOT NULL CHECK(length(payload_sha256)=64),
 issuer TEXT NOT NULL CHECK(issuer='DISPOSABLE_TEST_ONLY'),
 created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE IF NOT EXISTS f06_real_lock_test.decision_keys (
 key_sha256 TEXT PRIMARY KEY CHECK(length(key_sha256)=64),
 payload_sha256 TEXT NOT NULL CHECK(length(payload_sha256)=64),
 employee_id BIGINT NOT NULL REFERENCES public.employees(employee_id),
 request_id BIGINT NOT NULL REFERENCES public.lock_requests(lock_request_id) DEFERRABLE INITIALLY DEFERRED,
 result_json JSONB NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE IF NOT EXISTS f06_real_lock_test.lock_snapshots (
 lock_id BIGINT PRIMARY KEY REFERENCES public.locks(lock_id) DEFERRABLE INITIALLY DEFERRED,
 approver_employee_id BIGINT NOT NULL REFERENCES public.employees(employee_id),
 responsible_employee_id BIGINT NOT NULL REFERENCES public.employees(employee_id),
 customer_id BIGINT NOT NULL REFERENCES public.customers(customer_id),
 price_kind TEXT NOT NULL CHECK(price_kind IN('numeric','consultation')),
 price_cents BIGINT CHECK(price_cents>0),
 source_price_event_id BIGINT REFERENCES public.vehicle_price_history(price_event_id),
 initial_hours INTEGER NOT NULL CHECK(initial_hours>0),
 policy_version INTEGER NOT NULL CHECK(policy_version>0),
 priority_origin_customer_id BIGINT REFERENCES public.customers(customer_id),
 priority_origin_id BIGINT REFERENCES public.f05_8_priority_ci(priority_id),
 signed_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
 CHECK ((priority_origin_customer_id IS NULL)=(priority_origin_id IS NULL)),
 CHECK ((price_kind='numeric' AND price_cents IS NOT NULL AND source_price_event_id IS NOT NULL)
     OR (price_kind='consultation' AND price_cents IS NULL AND source_price_event_id IS NULL))
);
CREATE TABLE IF NOT EXISTS f06_real_lock_test.waitlist_sources (
 waitlist_id BIGINT PRIMARY KEY REFERENCES public.waitlists(waitlist_id) DEFERRABLE INITIALLY DEFERRED,
 source_request_id BIGINT NOT NULL UNIQUE REFERENCES public.lock_requests(lock_request_id),
 responsible_employee_id BIGINT NOT NULL REFERENCES public.employees(employee_id),
 responsible_source TEXT NOT NULL CHECK(responsible_source IN ('recommendation','demand','owner')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE IF NOT EXISTS f06_real_lock_test.events (
 event_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 request_id BIGINT NOT NULL REFERENCES public.lock_requests(lock_request_id) DEFERRABLE INITIALLY DEFERRED,
 event_type TEXT NOT NULL CHECK(event_type IN ('created','approved','rejected','expired','lock_conflict','closed_not_lockable')),
 actor_employee_id BIGINT REFERENCES public.employees(employee_id),
 old_status TEXT,
 new_status TEXT NOT NULL,
 resulting_lock_id BIGINT REFERENCES public.locks(lock_id) DEFERRABLE INITIALLY DEFERRED,
 resulting_waitlist_id BIGINT REFERENCES public.waitlists(waitlist_id) DEFERRABLE INITIALLY DEFERRED,
 at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX IF NOT EXISTS events_by_request ON f06_real_lock_test.events(request_id,event_id);

-- 测试侧审计行只允许插入；已经出现的状态和结果不可覆盖。
CREATE OR REPLACE FUNCTION f06_real_lock_test.reject_event_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'F06_TEST_HISTORY_IMMUTABLE'; END $$;
DROP TRIGGER IF EXISTS f06_real_lock_events_immutable ON f06_real_lock_test.events;
CREATE TRIGGER f06_real_lock_events_immutable
 BEFORE UPDATE OR DELETE ON f06_real_lock_test.events
 FOR EACH ROW EXECUTE FUNCTION f06_real_lock_test.reject_event_mutation();