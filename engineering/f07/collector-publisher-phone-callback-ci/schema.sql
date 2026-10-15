-- F07-1 独立PG16 sidecar；禁止部署正式public或生产数据库
CREATE SCHEMA IF NOT EXISTS f07_phone;
CREATE TABLE f07_phone.employees (
 id text PRIMARY KEY, active boolean NOT NULL, role text NOT NULL,
 session_version integer NOT NULL, phone_capability boolean NOT NULL, personal_deny boolean NOT NULL
);
CREATE TABLE f07_phone.sessions (
 id text PRIMARY KEY, employee_id text NOT NULL REFERENCES f07_phone.employees(id),
 version integer NOT NULL, active boolean NOT NULL
);
CREATE TABLE f07_phone.vehicles (
 id text PRIMARY KEY, source_platform text NOT NULL, publisher_id text,
 source_type text NOT NULL, state text NOT NULL, listing_active boolean NOT NULL
);
CREATE TABLE f07_phone.vehicle_scope (
 employee_id text NOT NULL REFERENCES f07_phone.employees(id),
 vehicle_id text NOT NULL REFERENCES f07_phone.vehicles(id),
 active boolean NOT NULL DEFAULT true, PRIMARY KEY(employee_id,vehicle_id)
);
CREATE TABLE f07_phone.publishers (
 source_platform text NOT NULL, publisher_id text NOT NULL,
 PRIMARY KEY (source_platform,publisher_id)
);
CREATE TABLE f07_phone.cache (
 source_platform text NOT NULL, publisher_id text NOT NULL,
 phone text NOT NULL CHECK (phone ~ '^TEST-[0-9]{6}$'),
 issued_at timestamptz NOT NULL, request_id text NOT NULL,
 PRIMARY KEY(source_platform,publisher_id),
 FOREIGN KEY(source_platform,publisher_id) REFERENCES f07_phone.publishers(source_platform,publisher_id)
);
CREATE TABLE f07_phone.phone_history (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 source_platform text NOT NULL, publisher_id text NOT NULL,
 phone text NOT NULL CHECK (phone ~ '^TEST-[0-9]{6}$'),
 issued_at timestamptz NOT NULL, request_id text NOT NULL UNIQUE
);
CREATE TABLE f07_phone.jobs (
 request_id text PRIMARY KEY,
 source_platform text NOT NULL, publisher_id text NOT NULL,
 mode text NOT NULL CHECK (mode IN ('miss','latest')),
 status text NOT NULL CHECK (status IN ('pending','done')),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE UNIQUE INDEX f07_only_one_pending ON f07_phone.jobs(source_platform,publisher_id) WHERE status='pending';
CREATE TABLE f07_phone.receipts (
 request_id text PRIMARY KEY, nonce text NOT NULL UNIQUE,
 digest text NOT NULL, source_platform text NOT NULL, publisher_id text NOT NULL,
 status text NOT NULL, received_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE f07_phone.audit (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 event text NOT NULL, actor_id text, source_platform text, publisher_id text,
 request_id text, outcome text NOT NULL, created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
REVOKE ALL ON SCHEMA f07_phone FROM PUBLIC;

-- CI中历史/审计/回传收据仅能追加；DELETE/UPDATE须物理拒绝。可销毁侧车TRUNCATE仅用于重建测试。
CREATE FUNCTION f07_phone.reject_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 RAISE EXCEPTION 'F07_APPEND_ONLY' USING ERRCODE='23514';
END;
$$;
CREATE TRIGGER audit_append_only BEFORE UPDATE OR DELETE ON f07_phone.audit
 FOR EACH ROW EXECUTE FUNCTION f07_phone.reject_mutation();
CREATE TRIGGER receipts_append_only BEFORE UPDATE OR DELETE ON f07_phone.receipts
 FOR EACH ROW EXECUTE FUNCTION f07_phone.reject_mutation();
CREATE TRIGGER history_append_only BEFORE UPDATE OR DELETE ON f07_phone.phone_history
 FOR EACH ROW EXECUTE FUNCTION f07_phone.reject_mutation();
