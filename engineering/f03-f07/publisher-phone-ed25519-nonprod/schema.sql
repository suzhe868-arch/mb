-- Private disposable test schema only. Never a public/product migration or production authority.
CREATE SCHEMA f03_f07_phone_ed25519_nonprod;
CREATE TABLE f03_f07_phone_ed25519_nonprod.challenges (
  challenge_id uuid PRIMARY KEY,
  request_id uuid NOT NULL,
  employee_id bigint NOT NULL CHECK (employee_id>0),
  action text NOT NULL CHECK (action IN ('vehicle.publisher_phone.read','vehicle.publisher_phone.latest','vehicle.publisher_phone.dial')),
  vehicle_id bigint NOT NULL CHECK (vehicle_id>0),
  listing_cycle_id bigint CHECK (listing_cycle_id IS NULL OR listing_cycle_id>0),
  audience text NOT NULL CHECK (audience='f07.publisher-phone.scope.nonprod'),
  nonce_sha256 bytea NOT NULL CHECK (octet_length(nonce_sha256)=32),
  created_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  origin text NOT NULL CHECK (origin='CI_SYNTHETIC_ONLY'),
  CHECK (expires_at>created_at AND expires_at<=created_at+interval '15 seconds'),
  CHECK (consumed_at IS NULL OR consumed_at>=created_at)
);
CREATE INDEX f03_f07_phone_challenge_expiry_idx
 ON f03_f07_phone_ed25519_nonprod.challenges(expires_at) WHERE consumed_at IS NULL;
CREATE TABLE f03_f07_phone_ed25519_nonprod.decision_audit (
  audit_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  request_id uuid NOT NULL,
  challenge_id uuid,
  employee_id bigint CHECK (employee_id IS NULL OR employee_id>0),
  action text CHECK (action IS NULL OR action IN ('vehicle.publisher_phone.read','vehicle.publisher_phone.latest','vehicle.publisher_phone.dial')),
  vehicle_id bigint CHECK (vehicle_id IS NULL OR vehicle_id>0),
  stage text NOT NULL CHECK (stage IN ('F03_ISSUER','F07_VERIFIER','F07_GUARD','HTTP_INPUT')),
  decision_code text NOT NULL CHECK (decision_code ~ '^[A-Z0-9_]{2,80}$'),
  allowed boolean NOT NULL,
  origin text NOT NULL CHECK (origin='CI_SYNTHETIC_ONLY'),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX f03_f07_phone_decision_audit_request_idx
 ON f03_f07_phone_ed25519_nonprod.decision_audit(request_id,audit_id);
