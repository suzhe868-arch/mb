-- 名邦汽车 V1 — PostgreSQL 16 physical schema contract
-- Contract only: generated during PREDEV Phase 08; not production execution.
-- Business timestamps are persisted as timestamptz (UTC internally); business-day calculations use Asia/Shanghai.

BEGIN;

CREATE TABLE stores (
  store_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE employees (
  employee_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  display_name TEXT NOT NULL,
  employment_status TEXT NOT NULL DEFAULT 'active' CHECK (employment_status IN ('active','inactive')),
  primary_role_code TEXT NOT NULL,
  employee_kind TEXT NOT NULL DEFAULT 'mingbang' CHECK (employee_kind IN ('mingbang','four_s')),
  four_s_org_name TEXT,
  receiving_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  customer_business_eligible BOOLEAN NOT NULL DEFAULT TRUE,
  store_id BIGINT REFERENCES stores(store_id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version BIGINT NOT NULL DEFAULT 0,
  CHECK (employee_kind <> 'four_s' OR customer_business_eligible = FALSE)
);
CREATE INDEX idx_employees_receiver_pool ON employees(store_id, employee_id) WHERE employment_status='active' AND receiving_enabled AND customer_business_eligible;

CREATE TABLE roles (
  role_code TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE permissions (
  permission_code TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  sensitivity TEXT NOT NULL DEFAULT 'normal' CHECK (sensitivity IN ('normal','sensitive','system')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE role_permissions (
  role_code TEXT NOT NULL REFERENCES roles(role_code) ON DELETE CASCADE,
  permission_code TEXT NOT NULL REFERENCES permissions(permission_code) ON DELETE CASCADE,
  PRIMARY KEY(role_code,permission_code)
);
CREATE TABLE employee_permission_overrides (
  override_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  employee_id BIGINT NOT NULL REFERENCES employees(employee_id) ON DELETE RESTRICT,
  permission_code TEXT NOT NULL REFERENCES permissions(permission_code) ON DELETE RESTRICT,
  effect TEXT NOT NULL CHECK(effect IN ('grant','deny')),
  reason TEXT NOT NULL,
  operator_type TEXT NOT NULL CHECK(operator_type IN ('employee','system_admin')),
  operator_id BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  CHECK (revoked_at IS NULL OR revoked_at >= created_at)
);
CREATE UNIQUE INDEX uq_employee_permission_override_active ON employee_permission_overrides(employee_id,permission_code) WHERE revoked_at IS NULL;

CREATE TABLE employee_data_scopes (
  scope_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  employee_id BIGINT NOT NULL REFERENCES employees(employee_id) ON DELETE RESTRICT,
  scope_type TEXT NOT NULL CHECK(scope_type IN ('self','store','team','explicit')),
  scope_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ
);
CREATE INDEX idx_employee_data_scopes_active ON employee_data_scopes(employee_id) WHERE revoked_at IS NULL;

CREATE TABLE employee_role_history (
  history_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  employee_id BIGINT NOT NULL REFERENCES employees(employee_id) ON DELETE RESTRICT,
  role_code TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  operator_type TEXT NOT NULL,
  operator_id BIGINT NOT NULL,
  CHECK(ended_at IS NULL OR ended_at > started_at)
);

CREATE TABLE system_admins (
  system_admin_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  login_identity TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive')),
  credential_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version BIGINT NOT NULL DEFAULT 0
);
CREATE TABLE system_admin_audit (
  audit_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  system_admin_id BIGINT NOT NULL REFERENCES system_admins(system_admin_id) ON DELETE RESTRICT,
  action TEXT NOT NULL,
  actor_system_admin_id BIGINT REFERENCES system_admins(system_admin_id) ON DELETE RESTRICT,
  before_json JSONB,
  after_json JSONB,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION guard_last_active_system_admin() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status='active' AND (TG_OP='DELETE' OR NEW.status<>'active') THEN
    PERFORM 1 FROM system_admins WHERE system_admin_id<>OLD.system_admin_id AND status='active' FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'LAST_ACTIVE_SYSTEM_ADMIN'; END IF;
  END IF;
  IF TG_OP='DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END $$;
CREATE TRIGGER trg_guard_last_active_system_admin BEFORE UPDATE OF status OR DELETE ON system_admins FOR EACH ROW EXECUTE FUNCTION guard_last_active_system_admin();

CREATE TABLE customers (
  customer_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  wechat_subject TEXT NOT NULL UNIQUE,
  original_name TEXT,
  wechat_nickname TEXT,
  nickname TEXT,
  avatar_url TEXT,
  phone_current TEXT,
  level_id BIGINT,
  owner_employee_id BIGINT REFERENCES employees(employee_id) ON DELETE RESTRICT,
  public_pool_since TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version BIGINT NOT NULL DEFAULT 0,
  CHECK ((owner_employee_id IS NULL) = (public_pool_since IS NOT NULL) OR public_pool_since IS NULL)
);
CREATE INDEX idx_customers_owner ON customers(owner_employee_id);
CREATE INDEX idx_customers_phone ON customers(phone_current);

CREATE TABLE customer_phone_history (
  history_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(customer_id) ON DELETE RESTRICT,
  old_phone TEXT,
  new_phone TEXT,
  source TEXT NOT NULL,
  actor_type TEXT NOT NULL,
  actor_id BIGINT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE customer_owner_history (
  history_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(customer_id) ON DELETE RESTRICT,
  from_employee_id BIGINT REFERENCES employees(employee_id) ON DELETE RESTRICT,
  to_employee_id BIGINT REFERENCES employees(employee_id) ON DELETE RESTRICT,
  reason TEXT NOT NULL,
  operator_type TEXT NOT NULL,
  operator_id BIGINT NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  handover_batch_id BIGINT
);

CREATE TABLE customer_levels (
  level_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version BIGINT NOT NULL DEFAULT 0
);
ALTER TABLE customers ADD CONSTRAINT fk_customers_level FOREIGN KEY(level_id) REFERENCES customer_levels(level_id) ON DELETE SET NULL;
CREATE TABLE level_entitlements (
  entitlement_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  level_id BIGINT NOT NULL REFERENCES customer_levels(level_id) ON DELETE CASCADE,
  entitlement_key TEXT NOT NULL,
  value_json JSONB NOT NULL,
  UNIQUE(level_id,entitlement_key)
);
CREATE TABLE customer_entitlement_overrides (
  override_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(customer_id) ON DELETE RESTRICT,
  entitlement_key TEXT NOT NULL,
  value_json JSONB NOT NULL,
  source TEXT NOT NULL,
  reason TEXT NOT NULL,
  operator_id BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX uq_customer_entitlement_active ON customer_entitlement_overrides(customer_id,entitlement_key) WHERE revoked_at IS NULL;

CREATE TABLE customer_tags (
  tag_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  tag_kind TEXT NOT NULL CHECK(tag_kind IN ('system_fact','operational')),
  enabled BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE TABLE customer_tag_links (
  customer_id BIGINT NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
  tag_id BIGINT NOT NULL REFERENCES customer_tags(tag_id) ON DELETE RESTRICT,
  created_by BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY(customer_id,tag_id)
);
CREATE TABLE customer_alias_notes (
  alias_note_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(customer_id) ON DELETE RESTRICT,
  employee_id BIGINT NOT NULL REFERENCES employees(employee_id) ON DELETE RESTRICT,
  alias_text TEXT NOT NULL,
  revision_no INTEGER NOT NULL DEFAULT 1 CHECK(revision_no>0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(customer_id,employee_id,revision_no)
);
CREATE TABLE customer_profiles (
  customer_id BIGINT PRIMARY KEY REFERENCES customers(customer_id) ON DELETE CASCADE,
  summary_text TEXT,
  structured_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  extra_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE vehicles (
  vehicle_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source_type TEXT NOT NULL CHECK(source_type IN ('wholesale','mingbang','four_s')),
  created_by_employee_id BIGINT REFERENCES employees(employee_id) ON DELETE RESTRICT,
  store_id BIGINT REFERENCES stores(store_id) ON DELETE RESTRICT,
  vin TEXT,
  brand TEXT NOT NULL,
  series TEXT NOT NULL,
  model_config TEXT NOT NULL,
  model_year INTEGER NOT NULL CHECK(model_year BETWEEN 1980 AND 2100),
  mileage_km INTEGER NOT NULL CHECK(mileage_km>=0),
  city TEXT NOT NULL,
  condition_summary TEXT,
  source_status TEXT NOT NULL DEFAULT 'active' CHECK(source_status IN ('draft','active','offline','unavailable','sold_external')),
  platform_visibility TEXT NOT NULL DEFAULT 'visible' CHECK(platform_visibility IN ('visible','hidden')),
  biz_status TEXT NOT NULL DEFAULT 'normal' CHECK(biz_status IN ('normal','locked','trading','completed')),
  customer_list_price_cents BIGINT CHECK(customer_list_price_cents IS NULL OR customer_list_price_cents>=0),
  internal_wholesale_price_cents BIGINT CHECK(internal_wholesale_price_cents IS NULL OR internal_wholesale_price_cents>=0),
  formally_published_at TIMESTAMPTZ,
  first_published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version BIGINT NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX uq_manual_vehicle_vin_published ON vehicles(vin) WHERE vin IS NOT NULL AND source_type IN ('mingbang','four_s') AND formally_published_at IS NOT NULL;
CREATE INDEX idx_vehicle_feed ON vehicles(source_type,source_status,platform_visibility,biz_status,first_published_at DESC);

CREATE TABLE wholesale_vehicle_source (
  vehicle_id BIGINT PRIMARY KEY REFERENCES vehicles(vehicle_id) ON DELETE RESTRICT,
  source_platform TEXT NOT NULL,
  car_code TEXT NOT NULL,
  upstream_list_price_cents BIGINT CHECK(upstream_list_price_cents IS NULL OR upstream_list_price_cents>=0),
  upstream_wholesale_price_cents BIGINT CHECK(upstream_wholesale_price_cents IS NULL OR upstream_wholesale_price_cents>=0),
  base_wholesale_price_cents BIGINT CHECK(base_wholesale_price_cents IS NULL OR base_wholesale_price_cents>=0),
  upstream_status TEXT NOT NULL,
  upstream_publisher_id TEXT,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  upstream_updated_at TIMESTAMPTZ,
  raw_source_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE(source_platform,car_code)
);


CREATE TABLE publisher_phone_cache (
  source_platform TEXT NOT NULL,
  publisher_id TEXT NOT NULL,
  current_phone TEXT NOT NULL,
  current_contact_name TEXT,
  phone_status TEXT NOT NULL DEFAULT 'unknown' CHECK(phone_status IN ('valid','invalid','unknown')),
  fetched_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY(source_platform,publisher_id)
);

CREATE TABLE publisher_phone_history (
  phone_history_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source_platform TEXT NOT NULL,
  publisher_id TEXT NOT NULL,
  phone TEXT NOT NULL,
  contact_name TEXT,
  valid_from TIMESTAMPTZ NOT NULL,
  valid_to TIMESTAMPTZ,
  status TEXT NOT NULL CHECK(status IN ('valid','invalid','unknown')),
  CHECK(valid_to IS NULL OR valid_to>=valid_from)
);
CREATE INDEX idx_publisher_phone_history ON publisher_phone_history(source_platform,publisher_id,valid_from DESC);


CREATE TABLE vehicle_listing_cycles (
  listing_cycle_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  vehicle_id BIGINT NOT NULL REFERENCES vehicles(vehicle_id) ON DELETE RESTRICT,
  cycle_no INTEGER NOT NULL CHECK(cycle_no>0),
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  start_reason TEXT NOT NULL,
  end_reason TEXT,
  UNIQUE(vehicle_id,cycle_no),
  CHECK(ended_at IS NULL OR ended_at>started_at)
);
CREATE UNIQUE INDEX uq_vehicle_open_listing_cycle ON vehicle_listing_cycles(vehicle_id) WHERE ended_at IS NULL;
CREATE INDEX idx_listing_cycles_vehicle_time ON vehicle_listing_cycles(vehicle_id,started_at DESC);

CREATE TABLE vehicle_price_history (
  price_history_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  vehicle_id BIGINT NOT NULL REFERENCES vehicles(vehicle_id) ON DELETE RESTRICT,
  listing_cycle_id BIGINT REFERENCES vehicle_listing_cycles(listing_cycle_id) ON DELETE RESTRICT,
  price_kind TEXT NOT NULL CHECK(price_kind IN ('upstream_list','upstream_wholesale','base_wholesale','rule_customer','override_customer','final_customer','manual_list','manual_internal')),
  amount_cents BIGINT CHECK(amount_cents IS NULL OR amount_cents>=0),
  source TEXT NOT NULL,
  reason TEXT,
  actor_type TEXT,
  actor_id BIGINT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_vehicle_price_history ON vehicle_price_history(vehicle_id,recorded_at DESC);
CREATE TABLE vehicle_price_overrides (
  override_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  vehicle_id BIGINT NOT NULL REFERENCES vehicles(vehicle_id) ON DELETE RESTRICT,
  amount_cents BIGINT NOT NULL CHECK(amount_cents>=0),
  reason TEXT NOT NULL,
  created_by BIGINT NOT NULL REFERENCES employees(employee_id) ON DELETE RESTRICT,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  CHECK(revoked_at IS NULL OR revoked_at>starts_at)
);
CREATE UNIQUE INDEX uq_vehicle_price_override_active ON vehicle_price_overrides(vehicle_id) WHERE revoked_at IS NULL;

CREATE TABLE pricing_ladder_sets (
  pricing_set_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','active','retired')),
  declared_min_cents BIGINT NOT NULL CHECK(declared_min_cents>=0),
  declared_max_cents BIGINT NOT NULL CHECK(declared_max_cents>declared_min_cents),
  activated_at TIMESTAMPTZ,
  created_by BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version BIGINT NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX uq_pricing_ladder_active ON pricing_ladder_sets((status)) WHERE status='active';
CREATE TABLE pricing_ladder_rules (
  pricing_rule_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  pricing_set_id BIGINT NOT NULL REFERENCES pricing_ladder_sets(pricing_set_id) ON DELETE CASCADE,
  lower_bound_cents BIGINT NOT NULL CHECK(lower_bound_cents>=0),
  upper_bound_cents BIGINT NOT NULL CHECK(upper_bound_cents>lower_bound_cents),
  markup_cents BIGINT NOT NULL CHECK(markup_cents>=0),
  sort_order INTEGER NOT NULL,
  UNIQUE(pricing_set_id,sort_order)
);

CREATE TABLE vehicle_images (
  image_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  vehicle_id BIGINT NOT NULL REFERENCES vehicles(vehicle_id) ON DELETE CASCADE,
  upstream_url TEXT,
  local_object_key TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  migration_state TEXT NOT NULL DEFAULT 'not_required' CHECK(migration_state IN ('not_required','pending','success','failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK(upstream_url IS NOT NULL OR local_object_key IS NOT NULL)
);
CREATE INDEX idx_vehicle_images_order ON vehicle_images(vehicle_id,sort_order,image_id);
CREATE TABLE vehicle_documents (
  document_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  vehicle_id BIGINT NOT NULL REFERENCES vehicles(vehicle_id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK(document_type IN ('registration','driving_license','insurance_claim','maintenance','mileage','inspection','insurance_policy')),
  media_type TEXT NOT NULL CHECK(media_type IN ('image','pdf','link')),
  resource_ref TEXT NOT NULL,
  customer_visible BOOLEAN NOT NULL DEFAULT FALSE,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_vehicle_document_primary ON vehicle_documents(vehicle_id,document_type) WHERE is_primary;
CREATE TABLE vehicle_condition_facts (
  vehicle_id BIGINT PRIMARY KEY REFERENCES vehicles(vehicle_id) ON DELETE CASCADE,
  raw_description TEXT,
  original_paint BOOLEAN,
  repaint_count INTEGER CHECK(repaint_count IS NULL OR repaint_count>=0),
  bodywork_count INTEGER CHECK(bodywork_count IS NULL OR bodywork_count>=0),
  structural_damage BOOLEAN,
  accident BOOLEAN,
  flood BOOLEAN,
  fire BOOLEAN,
  facts_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version BIGINT NOT NULL DEFAULT 0
);
CREATE TABLE vehicle_supply_anomalies (
  anomaly_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  vehicle_id BIGINT NOT NULL REFERENCES vehicles(vehicle_id) ON DELETE RESTRICT,
  anomaly_type TEXT NOT NULL,
  detected_at TIMESTAMPTZ NOT NULL,
  source_snapshot JSONB NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT TRUE,
  resolved_at TIMESTAMPTZ,
  resolution_basis TEXT,
  CHECK((is_current AND resolved_at IS NULL) OR (NOT is_current AND resolved_at IS NOT NULL))
);
CREATE UNIQUE INDEX uq_vehicle_current_supply_anomaly ON vehicle_supply_anomalies(vehicle_id,anomaly_type) WHERE is_current;
CREATE TABLE vehicle_conversions (
  conversion_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source_vehicle_id BIGINT NOT NULL UNIQUE REFERENCES vehicles(vehicle_id) ON DELETE RESTRICT,
  target_vehicle_id BIGINT NOT NULL UNIQUE REFERENCES vehicles(vehicle_id) ON DELETE RESTRICT,
  converted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  operator_type TEXT NOT NULL CHECK(operator_type IN ('employee','system_admin')),
  operator_id BIGINT NOT NULL,
  conversion_snapshot_json JSONB NOT NULL,
  CHECK(source_vehicle_id<>target_vehicle_id)
);
CREATE TABLE image_migration_jobs (
  job_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  conversion_id BIGINT NOT NULL UNIQUE REFERENCES vehicle_conversions(conversion_id) ON DELETE RESTRICT,
  status TEXT NOT NULL CHECK(status IN ('processing','success','partial_failed','failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  version BIGINT NOT NULL DEFAULT 0
);
CREATE TABLE image_migration_items (
  item_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  job_id BIGINT NOT NULL REFERENCES image_migration_jobs(job_id) ON DELETE CASCADE,
  source_url TEXT NOT NULL,
  target_object_key TEXT,
  status TEXT NOT NULL CHECK(status IN ('pending','success','failed')),
  retry_count INTEGER NOT NULL DEFAULT 0 CHECK(retry_count>=0),
  last_error TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(job_id,source_url)
);

CREATE TABLE favorites (
  customer_id BIGINT NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
  vehicle_id BIGINT NOT NULL REFERENCES vehicles(vehicle_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY(customer_id,vehicle_id)
);
CREATE TABLE share_attributions (
  share_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  vehicle_id BIGINT REFERENCES vehicles(vehicle_id) ON DELETE RESTRICT,
  sharer_type TEXT NOT NULL CHECK(sharer_type IN ('employee','customer')),
  sharer_id BIGINT NOT NULL,
  source_employee_id BIGINT REFERENCES employees(employee_id) ON DELETE RESTRICT,
  source_customer_id BIGINT REFERENCES customers(customer_id) ON DELETE RESTRICT,
  direct_referrer_customer_id BIGINT REFERENCES customers(customer_id) ON DELETE RESTRICT,
  parent_share_id BIGINT REFERENCES share_attributions(share_id) ON DELETE RESTRICT,
  signed_token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK(expires_at>created_at)
);
CREATE TABLE customer_acquisition_sources (
  acquisition_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(customer_id) ON DELETE RESTRICT,
  source_type TEXT NOT NULL,
  share_id BIGINT REFERENCES share_attributions(share_id) ON DELETE RESTRICT,
  attribution_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_first_acquisition BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_customer_first_acquisition ON customer_acquisition_sources(customer_id) WHERE is_first_acquisition;

CREATE TABLE customer_vehicle_price_access (
  access_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(customer_id) ON DELETE RESTRICT,
  vehicle_id BIGINT NOT NULL REFERENCES vehicles(vehicle_id) ON DELETE RESTRICT,
  listing_cycle_id BIGINT NOT NULL REFERENCES vehicle_listing_cycles(listing_cycle_id) ON DELETE RESTRICT,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  first_grant_source TEXT NOT NULL,
  UNIQUE(customer_id,vehicle_id,listing_cycle_id)
);
CREATE TABLE price_access_events (
  event_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(customer_id) ON DELETE RESTRICT,
  vehicle_id BIGINT NOT NULL REFERENCES vehicles(vehicle_id) ON DELETE RESTRICT,
  listing_cycle_id BIGINT NOT NULL REFERENCES vehicle_listing_cycles(listing_cycle_id) ON DELETE RESTRICT,
  event_type TEXT NOT NULL,
  consumed_quota BOOLEAN NOT NULL DEFAULT FALSE,
  source_object_type TEXT,
  source_object_id BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE customer_daily_price_quota_events (
  quota_event_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(customer_id) ON DELETE RESTRICT,
  business_date DATE NOT NULL,
  event_type TEXT NOT NULL CHECK(event_type IN ('base_snapshot','temporary_add','consume','correction')),
  delta_units INTEGER NOT NULL,
  source TEXT NOT NULL,
  operator_id BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_quota_customer_day ON customer_daily_price_quota_events(customer_id,business_date,created_at);

CREATE TABLE find_car_applications (
  application_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(customer_id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','activated','closed')),
  raw_text TEXT,
  structured_initial_conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
  activated_demand_id BIGINT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version BIGINT NOT NULL DEFAULT 0
);
CREATE TABLE demands (
  demand_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(customer_id) ON DELETE RESTRICT,
  source_application_id BIGINT UNIQUE REFERENCES find_car_applications(application_id) ON DELETE RESTRICT,
  responsible_employee_id BIGINT NOT NULL REFERENCES employees(employee_id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','paused','completed','cancelled')),
  match_readiness TEXT NOT NULL DEFAULT 'pending_definition' CHECK(match_readiness IN ('pending_definition','ready','ready_with_confirmation_needed')),
  sales_match_description TEXT,
  demand_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version BIGINT NOT NULL DEFAULT 0
);
ALTER TABLE find_car_applications ADD CONSTRAINT fk_application_demand FOREIGN KEY(activated_demand_id) REFERENCES demands(demand_id) ON DELETE RESTRICT;

CREATE TABLE upstream_phone_access_logs (
  phone_access_log_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  employee_id BIGINT NOT NULL REFERENCES employees(employee_id) ON DELETE RESTRICT,
  vehicle_id BIGINT NOT NULL REFERENCES vehicles(vehicle_id) ON DELETE RESTRICT,
  source_platform TEXT NOT NULL,
  publisher_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('view','refresh','dial')),
  customer_id BIGINT REFERENCES customers(customer_id) ON DELETE RESTRICT,
  demand_id BIGINT REFERENCES demands(demand_id) ON DELETE RESTRICT,
  result_code TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_upstream_phone_access_vehicle_time ON upstream_phone_access_logs(vehicle_id,occurred_at DESC);

CREATE TABLE demand_conditions (
  condition_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  demand_id BIGINT NOT NULL REFERENCES demands(demand_id) ON DELETE CASCADE,
  field_key TEXT NOT NULL,
  condition_kind TEXT NOT NULL CHECK(condition_kind IN ('hard','acceptable','preference')),
  operator TEXT NOT NULL,
  value_json JSONB NOT NULL,
  unknown_policy TEXT NOT NULL,
  source_rule_version TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE matching_dictionary_rules (
  rule_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  term TEXT NOT NULL,
  mapping_json JSONB NOT NULL,
  scope_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  priority INTEGER NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version BIGINT NOT NULL DEFAULT 0
);
CREATE TABLE vehicle_normalized_facts (
  vehicle_id BIGINT NOT NULL REFERENCES vehicles(vehicle_id) ON DELETE CASCADE,
  fact_key TEXT NOT NULL,
  value_json JSONB NOT NULL,
  rule_version TEXT NOT NULL,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY(vehicle_id,fact_key,rule_version)
);
CREATE TABLE demand_match_results (
  match_result_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  demand_id BIGINT NOT NULL REFERENCES demands(demand_id) ON DELETE CASCADE,
  vehicle_id BIGINT NOT NULL REFERENCES vehicles(vehicle_id) ON DELETE RESTRICT,
  candidate_tier TEXT NOT NULL CHECK(candidate_tier IN ('high','acceptable','confirmation_needed','no_match')),
  score NUMERIC(9,4),
  match_reason TEXT,
  mismatch_reason TEXT,
  unknown_reason TEXT,
  workflow_status TEXT NOT NULL DEFAULT 'new',
  calculation_version TEXT NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  recalculated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_demand_vehicle_current_match ON demand_match_results(demand_id,vehicle_id) WHERE is_current;
CREATE TABLE radar_events (
  radar_event_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  demand_id BIGINT REFERENCES demands(demand_id) ON DELETE RESTRICT,
  vehicle_id BIGINT NOT NULL REFERENCES vehicles(vehicle_id) ON DELETE RESTRICT,
  event_type TEXT NOT NULL,
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE recommendations (
  recommendation_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(customer_id) ON DELETE RESTRICT,
  vehicle_id BIGINT NOT NULL REFERENCES vehicles(vehicle_id) ON DELETE RESTRICT,
  listing_cycle_id BIGINT NOT NULL REFERENCES vehicle_listing_cycles(listing_cycle_id) ON DELETE RESTRICT,
  recommended_by_employee_id BIGINT NOT NULL REFERENCES employees(employee_id) ON DELETE RESTRICT,
  source_demand_id BIGINT REFERENCES demands(demand_id) ON DELETE RESTRICT,
  recommended_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  price_snapshot_type TEXT NOT NULL,
  price_snapshot_cents BIGINT CHECK(price_snapshot_cents IS NULL OR price_snapshot_cents>=0),
  recommend_reason TEXT,
  request_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  UNIQUE(recommended_by_employee_id,idempotency_key)
);

CREATE TABLE consultations (
  consultation_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(customer_id) ON DELETE RESTRICT,
  vehicle_id BIGINT REFERENCES vehicles(vehicle_id) ON DELETE RESTRICT,
  source_recommendation_id BIGINT REFERENCES recommendations(recommendation_id) ON DELETE RESTRICT,
  source_demand_id BIGINT REFERENCES demands(demand_id) ON DELETE RESTRICT,
  responsible_employee_id BIGINT NOT NULL REFERENCES employees(employee_id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','processing','resolved','invalid')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sla_deadline_at TIMESTAMPTZ NOT NULL,
  first_real_service_at TIMESTAMPTZ,
  timed_out_at TIMESTAMPTZ,
  timeout_alerted_at TIMESTAMPTZ,
  explicit_vehicle_intent BOOLEAN NOT NULL DEFAULT FALSE,
  version BIGINT NOT NULL DEFAULT 0,
  CHECK(sla_deadline_at>created_at)
);
CREATE UNIQUE INDEX uq_active_consultation_customer_vehicle ON consultations(customer_id,vehicle_id) WHERE vehicle_id IS NOT NULL AND status IN ('pending','processing');
CREATE INDEX idx_consultation_sla ON consultations(status,sla_deadline_at) WHERE status IN ('pending','processing');

CREATE TABLE locks (
  lock_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(customer_id) ON DELETE RESTRICT,
  vehicle_id BIGINT NOT NULL REFERENCES vehicles(vehicle_id) ON DELETE RESTRICT,
  responsible_employee_id BIGINT NOT NULL REFERENCES employees(employee_id) ON DELETE RESTRICT,
  source_recommendation_id BIGINT REFERENCES recommendations(recommendation_id) ON DELETE RESTRICT,
  source_demand_id BIGINT REFERENCES demands(demand_id) ON DELETE RESTRICT,
  source_consultation_id BIGINT REFERENCES consultations(consultation_id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  end_reason TEXT,
  price_snapshot_type TEXT NOT NULL,
  customer_price_snapshot_cents BIGINT CHECK(customer_price_snapshot_cents IS NULL OR customer_price_snapshot_cents>=0),
  internal_wholesale_snapshot_cents BIGINT NOT NULL CHECK(internal_wholesale_snapshot_cents>=0),
  upstream_price_snapshot_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by BIGINT NOT NULL REFERENCES employees(employee_id) ON DELETE RESTRICT,
  version BIGINT NOT NULL DEFAULT 0,
  CHECK(ended_at IS NULL OR ended_at>=created_at),
  CHECK(expires_at IS NULL OR expires_at>created_at)
);
CREATE UNIQUE INDEX uq_vehicle_active_lock ON locks(vehicle_id) WHERE ended_at IS NULL;
CREATE INDEX idx_active_lock_expiry ON locks(expires_at) WHERE ended_at IS NULL AND expires_at IS NOT NULL;

CREATE TABLE waitlists (
  waitlist_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(customer_id) ON DELETE RESTRICT,
  vehicle_id BIGINT NOT NULL REFERENCES vehicles(vehicle_id) ON DELETE RESTRICT,
  responsible_employee_id BIGINT NOT NULL REFERENCES employees(employee_id) ON DELETE RESTRICT,
  source_recommendation_id BIGINT REFERENCES recommendations(recommendation_id) ON DELETE RESTRICT,
  source_demand_id BIGINT REFERENCES demands(demand_id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  end_reason TEXT,
  ended_by BIGINT REFERENCES employees(employee_id) ON DELETE RESTRICT,
  version BIGINT NOT NULL DEFAULT 0,
  CHECK(ended_at IS NULL OR ended_at>=created_at)
);
CREATE UNIQUE INDEX uq_customer_vehicle_active_waitlist ON waitlists(customer_id,vehicle_id) WHERE ended_at IS NULL;
CREATE INDEX idx_vehicle_active_waitlists ON waitlists(vehicle_id,created_at) WHERE ended_at IS NULL;

CREATE TABLE deposit_receipts (
  deposit_receipt_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  lock_id BIGINT NOT NULL REFERENCES locks(lock_id) ON DELETE RESTRICT,
  amount_cents BIGINT NOT NULL CHECK(amount_cents>0),
  received_at TIMESTAMPTZ NOT NULL,
  method TEXT NOT NULL,
  operator_id BIGINT NOT NULL REFERENCES employees(employee_id) ON DELETE RESTRICT,
  note TEXT,
  evidence_ref TEXT,
  correction_of_id BIGINT REFERENCES deposit_receipts(deposit_receipt_id) ON DELETE RESTRICT,
  invalidated_at TIMESTAMPTZ,
  invalidation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_deposit_lock_valid ON deposit_receipts(lock_id) WHERE invalidated_at IS NULL;

CREATE TABLE transactions (
  transaction_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source_lock_id BIGINT NOT NULL UNIQUE REFERENCES locks(lock_id) ON DELETE RESTRICT,
  customer_id BIGINT NOT NULL REFERENCES customers(customer_id) ON DELETE RESTRICT,
  vehicle_id BIGINT NOT NULL REFERENCES vehicles(vehicle_id) ON DELETE RESTRICT,
  responsible_employee_id BIGINT NOT NULL REFERENCES employees(employee_id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK(status IN ('in_progress','completed','cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  actual_sale_price_cents BIGINT CHECK(actual_sale_price_cents IS NULL OR actual_sale_price_cents>=0),
  price_snapshot_json JSONB NOT NULL,
  correction_invalidated_at TIMESTAMPTZ,
  version BIGINT NOT NULL DEFAULT 0,
  CHECK((status='completed' AND completed_at IS NOT NULL AND actual_sale_price_cents IS NOT NULL) OR status<>'completed'),
  CHECK((status='cancelled' AND cancelled_at IS NOT NULL) OR status<>'cancelled')
);
CREATE UNIQUE INDEX uq_vehicle_in_progress_transaction ON transactions(vehicle_id) WHERE status='in_progress';


CREATE TABLE transaction_corrections (
  correction_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  transaction_id BIGINT NOT NULL REFERENCES transactions(transaction_id) ON DELETE RESTRICT,
  original_status TEXT NOT NULL,
  reason TEXT NOT NULL,
  operator_type TEXT NOT NULL CHECK(operator_type IN ('employee','system_admin')),
  operator_id BIGINT NOT NULL,
  resulting_business_state TEXT NOT NULL,
  corrected_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_transaction_corrections_transaction_time ON transaction_corrections(transaction_id,corrected_at DESC);

CREATE TABLE refund_cases (
  refund_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(customer_id) ON DELETE RESTRICT,
  transaction_id BIGINT REFERENCES transactions(transaction_id) ON DELETE RESTRICT,
  lock_id BIGINT REFERENCES locks(lock_id) ON DELETE RESTRICT,
  expected_refund_amount_cents BIGINT NOT NULL CHECK(expected_refund_amount_cents>0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','refunded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_by BIGINT NOT NULL REFERENCES employees(employee_id) ON DELETE RESTRICT,
  version BIGINT NOT NULL DEFAULT 0,
  CHECK(transaction_id IS NOT NULL OR lock_id IS NOT NULL),
  CHECK((status='refunded' AND completed_at IS NOT NULL) OR status='pending')
);
CREATE TABLE refund_payments (
  refund_payment_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  refund_id BIGINT NOT NULL REFERENCES refund_cases(refund_id) ON DELETE RESTRICT,
  amount_cents BIGINT NOT NULL CHECK(amount_cents>0),
  refunded_at TIMESTAMPTZ NOT NULL,
  method TEXT NOT NULL,
  operator_id BIGINT NOT NULL REFERENCES employees(employee_id) ON DELETE RESTRICT,
  evidence_ref TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_refund_payments_refund ON refund_payments(refund_id,refunded_at);

CREATE TABLE crm_followups (
  followup_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(customer_id) ON DELETE RESTRICT,
  employee_id BIGINT NOT NULL REFERENCES employees(employee_id) ON DELETE RESTRICT,
  occurred_at TIMESTAMPTZ NOT NULL,
  method TEXT NOT NULL,
  content TEXT NOT NULL,
  next_plan TEXT,
  next_followup_at TIMESTAMPTZ,
  demand_id BIGINT REFERENCES demands(demand_id) ON DELETE RESTRICT,
  vehicle_id BIGINT REFERENCES vehicles(vehicle_id) ON DELETE RESTRICT,
  consultation_id BIGINT REFERENCES consultations(consultation_id) ON DELETE RESTRICT,
  transaction_id BIGINT REFERENCES transactions(transaction_id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_followup_customer_time ON crm_followups(customer_id,occurred_at DESC);

CREATE TABLE employee_departure_handover_batches (
  handover_batch_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  departed_employee_id BIGINT NOT NULL REFERENCES employees(employee_id) ON DELETE RESTRICT,
  departed_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('processing','completed','partial_failed')),
  created_by BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
CREATE TABLE handover_customer_items (
  item_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  handover_batch_id BIGINT NOT NULL REFERENCES employee_departure_handover_batches(handover_batch_id) ON DELETE RESTRICT,
  customer_id BIGINT NOT NULL REFERENCES customers(customer_id) ON DELETE RESTRICT,
  original_owner_employee_id BIGINT NOT NULL REFERENCES employees(employee_id) ON DELETE RESTRICT,
  target_owner_employee_id BIGINT REFERENCES employees(employee_id) ON DELETE RESTRICT,
  result TEXT NOT NULL DEFAULT 'pending',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(handover_batch_id,customer_id)
);
ALTER TABLE customer_owner_history ADD CONSTRAINT fk_owner_history_handover FOREIGN KEY(handover_batch_id) REFERENCES employee_departure_handover_batches(handover_batch_id) ON DELETE RESTRICT;
CREATE TABLE business_reassignment_history (
  reassignment_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  object_type TEXT NOT NULL CHECK(object_type IN ('demand','consultation','waitlist','lock','transaction')),
  object_id BIGINT NOT NULL,
  from_employee_id BIGINT NOT NULL REFERENCES employees(employee_id) ON DELETE RESTRICT,
  to_employee_id BIGINT NOT NULL REFERENCES employees(employee_id) ON DELETE RESTRICT,
  reason TEXT NOT NULL,
  operator_type TEXT NOT NULL,
  operator_id BIGINT NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_reassignment_object ON business_reassignment_history(object_type,object_id,changed_at);

CREATE TABLE public_pool_events (
  event_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(customer_id) ON DELETE RESTRICT,
  event_type TEXT NOT NULL CHECK(event_type IN ('put','claim','reassign')),
  from_employee_id BIGINT REFERENCES employees(employee_id) ON DELETE RESTRICT,
  to_employee_id BIGINT REFERENCES employees(employee_id) ON DELETE RESTRICT,
  reason TEXT,
  operator_type TEXT NOT NULL,
  operator_id BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public_pool_candidate_snapshots (
  snapshot_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
  derived_at TIMESTAMPTZ NOT NULL,
  rule_version TEXT NOT NULL,
  evidence_json JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  UNIQUE(customer_id,rule_version,derived_at)
);

CREATE TABLE employee_feishu_bindings (
  binding_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  employee_id BIGINT NOT NULL REFERENCES employees(employee_id) ON DELETE RESTRICT,
  receive_identity TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  CHECK(ended_at IS NULL OR ended_at>started_at)
);
CREATE UNIQUE INDEX uq_employee_feishu_active ON employee_feishu_bindings(employee_id) WHERE ended_at IS NULL;
CREATE TABLE notification_events (
  event_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  business_event_key TEXT NOT NULL,
  event_type TEXT NOT NULL,
  object_type TEXT NOT NULL,
  object_id BIGINT NOT NULL,
  stage TEXT NOT NULL,
  payload_snapshot JSONB NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(business_event_key,stage)
);
CREATE TABLE notification_deliveries (
  delivery_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_id BIGINT NOT NULL REFERENCES notification_events(event_id) ON DELETE RESTRICT,
  route_type TEXT NOT NULL CHECK(route_type IN ('feishu_personal','feishu_group')),
  route_identity TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','deferred','sent','failed','skipped','deduplicated')),
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK(attempt_count>=0),
  next_attempt_at TIMESTAMPTZ,
  last_error TEXT,
  sent_at TIMESTAMPTZ,
  dedup_key TEXT NOT NULL UNIQUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_delivery_worker ON notification_deliveries(status,next_attempt_at) WHERE status IN ('pending','deferred','failed');

CREATE TABLE announcements (
  announcement_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  created_by BIGINT NOT NULL,
  updated_by BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version BIGINT NOT NULL DEFAULT 0,
  CHECK(ends_at IS NULL OR ends_at>starts_at)
);
CREATE INDEX idx_announcements_effective ON announcements(enabled,starts_at,ends_at,sort_order);
CREATE TABLE announcement_customer_show_state (
  customer_id BIGINT NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
  announcement_id BIGINT NOT NULL REFERENCES announcements(announcement_id) ON DELETE CASCADE,
  business_date DATE NOT NULL,
  last_shown_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY(customer_id,announcement_id,business_date)
);

CREATE TABLE banners (
  banner_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  placement TEXT NOT NULL DEFAULT 'HOME_TOP' CHECK(placement IN ('HOME_TOP','VEHICLE_DETAIL')),
  image_ref TEXT NOT NULL,
  title TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK(target_type IN ('none','vehicle','customer_route','safe_external_https')),
  target_value TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  created_by BIGINT NOT NULL,
  updated_by BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version BIGINT NOT NULL DEFAULT 0,
  CHECK(ends_at IS NULL OR ends_at>starts_at),
  CHECK((target_type='none' AND target_value IS NULL) OR target_type<>'none')
);
CREATE INDEX idx_banner_effective ON banners(placement,enabled,starts_at,ends_at,sort_order,banner_id);

CREATE TABLE integration_credentials (
  credential_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  integration_code TEXT NOT NULL,
  encrypted_secret BYTEA NOT NULL,
  secret_fingerprint TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive')),
  valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_to TIMESTAMPTZ,
  created_by BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(integration_code,secret_fingerprint)
);
CREATE UNIQUE INDEX uq_integration_active_credential ON integration_credentials(integration_code) WHERE status='active' AND valid_to IS NULL;
CREATE TABLE integration_api_logs (
  log_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  integration_code TEXT NOT NULL,
  operation TEXT NOT NULL,
  request_id TEXT NOT NULL,
  result_code TEXT NOT NULL,
  http_status INTEGER,
  duration_ms INTEGER CHECK(duration_ms IS NULL OR duration_ms>=0),
  sanitized_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_integration_logs_time ON integration_api_logs(integration_code,created_at DESC);
CREATE TABLE incidents (
  incident_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  integration_code TEXT NOT NULL,
  incident_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('active','recovered')),
  started_at TIMESTAMPTZ NOT NULL,
  recovered_at TIMESTAMPTZ,
  last_observed_at TIMESTAMPTZ NOT NULL,
  alert_stage INTEGER NOT NULL DEFAULT 0,
  evidence_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  CHECK((status='active' AND recovered_at IS NULL) OR (status='recovered' AND recovered_at IS NOT NULL))
);
CREATE UNIQUE INDEX uq_active_incident_chain ON incidents(integration_code,incident_type) WHERE status='active';

CREATE TABLE audit_logs (
  audit_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_type TEXT NOT NULL CHECK(actor_type IN ('customer','employee','system_admin','integration','system')),
  actor_id TEXT,
  action TEXT NOT NULL,
  object_type TEXT NOT NULL,
  object_id TEXT NOT NULL,
  before_summary JSONB,
  after_summary JSONB,
  reason TEXT,
  request_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_object ON audit_logs(object_type,object_id,created_at DESC);
CREATE INDEX idx_audit_actor ON audit_logs(actor_type,actor_id,created_at DESC);

CREATE TABLE idempotency_records (
  idempotency_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_domain TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  response_status INTEGER,
  response_object_type TEXT,
  response_object_id TEXT,
  response_snapshot JSONB,
  processing_status TEXT NOT NULL DEFAULT 'processing' CHECK(processing_status IN ('processing','completed','failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  UNIQUE(actor_domain,actor_id,action,idempotency_key),
  CHECK(expires_at>created_at)
);
CREATE INDEX idx_idempotency_expiry ON idempotency_records(expires_at);

CREATE TABLE runtime_config_versions (
  config_version_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  config_key TEXT NOT NULL,
  value_json JSONB NOT NULL,
  effective_from TIMESTAMPTZ NOT NULL,
  effective_to TIMESTAMPTZ,
  created_by_type TEXT NOT NULL CHECK(created_by_type IN ('employee','system_admin')),
  created_by_id BIGINT NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK(effective_to IS NULL OR effective_to>effective_from)
);
CREATE UNIQUE INDEX uq_runtime_config_current ON runtime_config_versions(config_key) WHERE effective_to IS NULL;

CREATE TABLE outbox_events (
  outbox_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  aggregate_type TEXT NOT NULL,
  aggregate_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_key TEXT NOT NULL UNIQUE,
  payload_json JSONB NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ,
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK(attempt_count>=0),
  next_attempt_at TIMESTAMPTZ,
  last_error TEXT
);
CREATE INDEX idx_outbox_worker ON outbox_events(next_attempt_at,outbox_id) WHERE published_at IS NULL;

COMMIT;
