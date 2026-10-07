/* AUTO-GENERATED from packages/contracts/openapi.yaml. DO NOT EDIT. */

export type ApiError = {
  error: {
  code: string;
  message: string;
  details?: {
  [key: string]: unknown;
};
  request_id: string;
};
};

export type OpaqueAssertionExchangeRequest = {
  assertion: string;
  provider?: string;
};

export type AuthSessionDTO = {
  token: string;
  expires_at: string;
  identity_domain: "employee" | "system_admin";
  principal_id?: string;
};

export type WechatSessionRequest = {
  code: string;
};

export type PhoneAuthorizeRequest = {
  authorization_code: string;
};

export type ProfileUpdateRequest = {
  nickname?: string;
  avatar_url?: string;
};

export type FindCarApplicationRequest = {
  raw_text?: string;
  conditions?: {
  [key: string]: unknown;
};
};

export type ConsultationCreateRequest = {
  intent_type?: "explicit_vehicle" | "contact_advisor";
  source_recommendation_id?: string;
  source_demand_id?: string;
};

export type WaitlistCreateRequest = {
  customer_id: string;
  vehicle_id: string;
  source_recommendation_id?: string;
  source_demand_id?: string;
};

export type ShareResolveRequest = {
  share_token: string;
};

export type FollowupCreateRequest = {
  method: string;
  content: string;
  next_plan?: string;
  next_followup_at?: string;
  demand_id?: string;
  vehicle_id?: string;
  consultation_id?: string;
  transaction_id?: string;
};

export type AliasNoteRequest = {
  alias_text: string;
};

export type QuotaAddRequest = {
  units: number;
  reason: string;
};

export type RecommendationCreateRequest = {
  customer_id: string;
  vehicle_id: string;
  source_demand_id?: string;
  recommend_reason?: string;
};

export type MatchDescriptionRequest = {
  description: string;
};

export type DemandNoteRequest = {
  note: string;
};

export type ReasonRequest = {
  reason: string;
};

export type ReassignRequest = {
  to_employee_id: string;
  reason: string;
  object_type?: string;
  object_id?: string;
};

export type MatchingRuleRequest = {
  term: string;
  mapping: {
  [key: string]: unknown;
};
  scope?: {
  [key: string]: unknown;
};
  priority?: number;
  enabled?: boolean;
};

export type MatchingRuleTestRequest = {
  text: string;
  scope?: {
  [key: string]: unknown;
};
};

export type VehicleWriteRequest = {
  source_type?: "mingbang" | "four_s";
  brand?: string;
  series?: string;
  model_config?: string;
  model_year?: number;
  mileage_km?: number;
  city?: string;
  condition_summary?: string;
  vin?: string;
  customer_list_price_cents?: number;
  internal_wholesale_price_cents?: number;
  version?: number;
};

export type PriceOverrideRequest = {
  amount_cents: number;
  reason: string;
};

export type LockCreateRequest = {
  customer_id: string;
  vehicle_id: string;
  source_recommendation_id?: string;
  source_demand_id?: string;
  source_consultation_id?: string;
  expires_at?: string;
};

export type LockExpiryUpdateRequest = {
  expires_at: string;
  reason?: string;
};

export type DepositCreateRequest = {
  amount_cents: number;
  received_at: string;
  method: string;
  evidence_ref?: string;
  note?: string;
};

export type TransactionCompleteRequest = {
  actual_sale_price_cents: number;
  completed_at: string;
};

export type RefundCreateRequest = unknown;

export type RefundPaymentRequest = {
  amount_cents: number;
  refunded_at: string;
  method: string;
  evidence_ref?: string;
  note?: string;
};

export type EmployeeCreateRequest = {
  display_name: string;
  primary_role_code: string;
  employee_kind?: "mingbang" | "four_s";
  store_id?: string;
  receiving_enabled?: boolean;
};

export type EmployeeUpdateRequest = {
  display_name?: string;
  primary_role_code?: string;
  store_id?: string;
  version?: number;
};

export type PermissionOverridesRequest = {
  overrides: Array<{
  permission_code: string;
  effect: "grant" | "deny";
  reason: string;
}>;
};

export type DataScopeRequest = {
  scope_type: "self" | "store" | "team" | "explicit";
  scope_payload?: {
  [key: string]: unknown;
};
};

export type ReceivingUpdateRequest = {
  receiving_enabled: boolean;
};

export type HandoverBatchRequest = {
  departed_employee_id: string;
};

export type HandoverAssignRequest = {
  assignments: Array<{
  customer_id: string;
  to_employee_id: string;
}>;
};

export type SystemAdminCreateRequest = {
  login_identity: string;
  display_name: string;
};

export type SystemAdminPermissionsRequest = {
  permissions: Array<string>;
};

export type PricingSetRequest = {
  name: string;
  declared_min_cents: number;
  declared_max_cents: number;
};

export type PricingRulesRequest = {
  rules: Array<{
  lower_bound_cents: number;
  upper_bound_cents: number;
  markup_cents: number;
}>;
};

export type ConfigUpdateRequest = {
  value: {
  [key: string]: unknown;
};
  reason?: string;
};

export type AnnouncementWriteRequest = {
  title: string;
  body: string;
  sort_order?: number;
  starts_at: string;
  ends_at?: string;
};

export type BannerWriteRequest = {
  placement: "HOME_TOP" | "VEHICLE_DETAIL";
  image_ref: string;
  title: string;
  target_type: "none" | "vehicle" | "customer_route" | "safe_external_https";
  target_value?: string;
  sort_order?: number;
  starts_at: string;
  ends_at?: string;
  version?: number;
};

export type BannerReorderRequest = {
  items: Array<{
  id: string;
  sort_order: number;
}>;
};

export type JytVehicleUpsertRequest = {
  vehicles: Array<JytVehicleUpsertItemV2>;
};

export type JytOfflineBatchRequest = {
  car_codes: Array<string>;
};

export type RegistryPatchRequest = {
  display_name?: string;
  enabled?: boolean;
};

export type VehicleCardCustomerDTO = {
  id: string;
  source_type: "wholesale" | "mingbang" | "four_s";
  brand?: string | null;
  series?: string | null;
  model_config?: string | null;
  model_year?: number | null;
  mileage_km?: number | null;
  city?: string | null;
  updated_at?: string;
  image_url?: string;
  price: {
  display_type: "amount" | "consultation" | "locked";
  amount_cents?: number;
};
  condition_summary?: string;
  vehicle_model_id?: number | null;
  model_match_status: "matched" | "pending" | "conflict";
  vehicle_name_snapshot?: string | null;
  plate_date?: string | null;
  exterior_color?: string | null;
  interior_color?: string | null;
};

export type VehicleCustomerDetailDTO = {
  vehicle: VehicleCardCustomerDTO;
  images?: Array<string>;
  customer_visible_documents?: Array<CustomerVisibleDocumentDTO>;
  condition?: VehicleConditionDTO;
  favorite?: boolean;
  share_allowed?: boolean;
  detail_dates?: {
  listing_started_at: string;
  source_recorded_at: string;
  source_recorded_kind: "manual_uploaded_at" | "platform_first_seen_at";
};
};

export type StaffVehicleInternalDTO = {
  customer_safe: VehicleCustomerDetailDTO;
  internal: {
  upstream_list_price_cents?: number;
  upstream_wholesale_price_cents?: number;
  base_wholesale_price_cents?: number;
  internal_wholesale_price_cents?: number;
  customer_rule_price_cents?: number;
  customer_override_price_cents?: number;
  upstream_phone?: string;
  version?: number;
  vin?: string;
  car_code?: string;
  publisher_id?: string;
};
  wholesale_price?: number;
};

export type CustomerDTO = {
  id: string;
  nickname?: string;
  avatar_url?: string;
  phone_masked?: string;
  owner_display?: string;
  level?: string;
  customer_id?: string;
  display_name?: string;
};

export type StaffCustomerDTO = {
  id: string;
  original_name?: string;
  wechat_nickname?: string;
  nickname?: string;
  phone?: string;
  sales_aliases?: Array<string>;
  profile_summary?: string;
  owner_employee_id?: string;
  is_priority_customer?: boolean;
  tags?: Array<string>;
  active_business_summary?: ActiveBusinessSummaryDTO;
  version?: number;
  display_name?: string;
};

export type DemandDTO = {
  id: string;
  status: "active" | "paused" | "completed" | "cancelled";
  match_readiness: "pending_definition" | "ready" | "ready_with_confirmation_needed";
  original_request?: string;
  readiness?: "pending_definition" | "ready" | "ready_with_confirmation_needed";
};

export type ConsultationDTO = {
  id: string;
  customer_id: string;
  vehicle_id?: string;
  responsible_employee_id?: string;
  status: "pending" | "processing" | "resolved" | "invalid";
  sla_deadline_at: string;
  first_real_service_at?: string;
  timed_out_at?: string;
  version?: number;
  responsible?: CustomerOwnerDTO;
  source?: {
  recommendation_id?: string;
  demand_id?: string;
};
};

export type RecommendationDTO = {
  id: string;
  customer_id: string;
  vehicle_id: string;
  listing_cycle_id: string;
  recommended_at: string;
  status: "active" | "ended";
  ended_at?: string;
  end_reason?: string;
  visibility_suppressed_by_priority?: boolean;
  price_snapshot?: PriceSnapshotDTO;
  locked?: boolean;
};

export type LockDTO = {
  id: string;
  customer_id: string;
  vehicle_id: string;
  responsible_employee_id?: string;
  created_at: string;
  expires_at?: string;
  ended_at?: string;
  end_reason?: string;
  has_valid_deposit?: boolean;
  version?: number;
  status?: "active" | "ended";
  deposit_summary?: {
  receipt_count: number;
  total_amount_cents: number;
};
  price_snapshot?: {
  customer_price_cents?: number;
  internal_wholesale_cents?: number | null;
  snapshot_type: string;
};
};

export type WaitlistDTO = {
  id: string;
  customer_id: string;
  vehicle_id: string;
  responsible_employee_id?: string;
  created_at: string;
  ended_at?: string;
  end_reason?: string;
  queue_position_reference?: number;
  version?: number;
  status?: "active" | "ended";
  order?: number;
  responsible?: CustomerOwnerDTO;
};

export type DepositReceiptDTO = {
  id: string;
  lock_id: string;
  amount_cents: number;
  received_at: string;
  method?: string;
  note?: string;
};

export type TransactionDTO = {
  id: string;
  source_lock_id: string;
  customer_id: string;
  vehicle_id: string;
  responsible_employee_id?: string;
  status: "in_progress" | "completed" | "cancelled";
  actual_sale_price_cents?: number;
  created_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  version?: number;
  actual_price?: number;
  responsible?: CustomerOwnerDTO;
  funds?: {
  deposit_total_cents?: number;
  refund_expected_cents?: number;
  refund_paid_cents?: number;
};
};

export type RefundDTO = unknown;

export type BannerCustomerDTO = {
  id: string;
  placement: "HOME_TOP" | "VEHICLE_DETAIL";
  image_url: string;
  title: string;
  target: {
  type: "none" | "vehicle" | "customer_route" | "safe_external_https";
  value?: string;
};
};

export type AdminBannerDTO = {
  id: string;
  placement: "HOME_TOP" | "VEHICLE_DETAIL";
  image_ref: string;
  title: string;
  target_type?: string;
  target_value?: string;
  sort_order: number;
  enabled: boolean;
  starts_at: string;
  ends_at?: string;
  version: number;
  created_at?: string;
  updated_at?: string;
};

export type CustomerSessionDTO = {
  token: string;
  expires_at: string;
  customer: CustomerDTO;
};

export type StaffVehicleSafeDTO = {
  customer_safe: VehicleCustomerDetailDTO;
  status: VehicleStatusDTO;
  supply_anomaly?: SupplyAnomalyDTO;
  listing_cycle?: ListingCycleDTO;
  version: number;
};

export type StaffUpstreamPhoneDTO = {
  phone: string;
  contact_name?: string;
  publisher_id?: string;
  from_cache?: boolean;
  fetched_at?: string;
};

export type ConversionDTO = {
  id: string;
  source_vehicle_id: string;
  target_vehicle_id: string;
  converted_at: string;
  image_migration_state: "pending" | "success" | "partial_failed" | "failed";
};

export type AdminAnnouncementDTO = {
  id: string;
  title: string;
  body: string;
  sort_order: number;
  enabled: boolean;
  starts_at: string;
  ends_at?: string;
  created_at: string;
  updated_at: string;
  version: number;
};

export type AdminPricingDTO = {
  id: string;
  name: string;
  status: "draft" | "active" | "retired";
  declared_min_cents: number;
  declared_max_cents: number;
  activated_at?: string;
  rules: Array<PricingRuleDTO>;
  version: number;
};

export type AdminConfigDTO = {
  config_key: string;
  value: unknown;
  effective_from: string;
  effective_to?: string;
  version_id: string;
  id?: string;
  status?: "scheduled" | "effective" | "expired";
};

export type AdminNotificationDTO = {
  id: string;
  event_id: string;
  route_type: "feishu_personal" | "feishu_group";
  route_identity: string;
  status: "pending" | "deferred" | "sent" | "failed" | "skipped" | "deduplicated";
  attempt_count: number;
  next_attempt_at?: string;
  last_error?: string;
  sent_at?: string;
  updated_at: string;
};

export type AdminFeishuDTO = {
  id: string;
  employee_id: string;
  receive_identity: string;
  started_at: string;
  ended_at?: string;
};

export type AdminJytDTO = {
  healthy: boolean;
  checked_at: string;
  result_code: string;
  message?: string;
  credential_fingerprint?: string;
};

export type MaskedAuditDTO = {
  id: string;
  actor_type: string;
  actor_id?: string;
  action: string;
  object_type: string;
  object_id: string;
  before_summary?: unknown;
  after_summary?: unknown;
  reason?: string;
  request_id: string;
  created_at: string;
  masked: boolean;
};

export type MatchingRuleDTO = {
  id: string;
  term: string;
  mapping: unknown;
  scope: unknown;
  priority: number;
  enabled: boolean;
  created_at?: string;
  updated_at?: string;
  version: number;
};

export type AdminEmployeeDTO = {
  id: string;
  display_name: string;
  employment_status: "active" | "inactive";
  primary_role_code: string;
  employee_kind: "mingbang" | "four_s";
  store_id?: string;
  receiving_enabled: boolean;
  customer_business_eligible: boolean;
  permission_overrides?: Array<{
  permission_code: string;
  effect: "grant" | "deny";
  reason?: string;
}>;
  data_scopes?: Array<{
  scope_type: "self" | "store" | "team" | "explicit";
  scope_payload?: unknown;
}>;
  version: number;
};

export type AdminCustomerDTO = {
  customer: StaffCustomerDTO;
  public_pool_since?: string;
  owner?: CustomerOwnerDTO;
  entitlements: CustomerEntitlementDTO;
};

export type PriorityCustomerStatusRequest = {
  enabled: boolean;
};

export type PriorityCustomerStatusDTO = {
  customer_id: string;
  enabled: boolean;
  enabled_at?: string;
  enabled_by_system_admin_id?: string;
};

export type SystemAdminDTO = {
  id: string;
  login_identity: string;
  display_name: string;
  status: "active" | "inactive";
  permissions: Array<string>;
  created_at?: string;
  updated_at?: string;
  version: number;
};

export type WorkbenchDTO = {
  todo_count: number;
  opportunity_count: number;
  radar_count: number;
  todos: Array<WorkbenchTodoDTO>;
  opportunities: Array<CustomerOpportunityDTO>;
};

export type TimelineDTO = {
  events: Array<TimelineEventDTO>;
  next_cursor?: string;
};

export type VehicleStatusDTO = {
  source_status: "draft" | "active" | "offline" | "unavailable" | "sold_external";
  platform_visibility: "visible" | "hidden";
  biz_status: "normal" | "locked" | "trading" | "completed";
};

export type SupplyAnomalyDTO = {
  id: string;
  vehicle_id: string;
  anomaly_type: string;
  detected_at: string;
  is_current: boolean;
  resolved_at?: string;
  resolution_basis?: string;
  customer_safe_message?: string;
};

export type ImageDTO = {
  id: string;
  url: string;
  sort_order: number;
};

export type ListingCycleDTO = {
  id: string;
  vehicle_id: string;
  cycle_no: number;
  started_at: string;
  ended_at?: string;
  start_reason: string;
  end_reason?: string;
};

export type CustomerOwnerDTO = {
  employee_id: string;
  display_name: string;
};

export type EntitlementValueDTO = {
  key: string;
  value: unknown;
};

export type CustomerEntitlementDTO = {
  level_id?: string;
  level_name?: string;
  entitlements: Array<EntitlementValueDTO>;
};

export type CustomerVehicleDTO = {
  vehicle: VehicleCardCustomerDTO;
  display_price: PriceDisplayDTO;
};

export type PriceDisplayDTO = {
  display_type: "amount" | "consultation" | "locked";
  amount_cents?: number;
};

export type VehicleConditionDTO = {
  summary?: string;
  source_description?: string;
  actual_inspection_summary?: string;
  actual_inspection_present: boolean;
};

export type CustomerVisibleDocumentDTO = {
  document_type: string;
  display_label: string;
  url: string;
};

export type PriceSnapshotDTO = {
  display_type: string;
  amount_cents?: number;
};

export type ActiveBusinessSummaryDTO = {
  active_demand_count: number;
  open_consultation_count: number;
  active_lock_count: number;
  in_progress_transaction_count: number;
};

export type AuthContextDTO = {
  identity_domain: "employee" | "system_admin";
  principal_id: string;
  status: "active" | "inactive";
  permissions: Array<string>;
  data_scopes: Array<{
  scope_type: "self" | "store" | "team" | "explicit";
  scope_payload?: unknown;
}>;
  principal?: {
  identity_domain: "employee" | "system_admin";
  principal_id: string;
};
  authorization?: {
  permissions: Array<string>;
  data_scopes: Array<{
  scope_type: string;
  scope_payload?: unknown;
}>;
};
};

export type AuthRevokeDTO = {
  revoked: boolean;
};

export type AuditSummaryDTO = {
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
  last_audit_at?: string;
};

export type AuditLogDTO = {
  id: string;
  actor_type: "customer" | "employee" | "system_admin" | "integration" | "system";
  actor_id?: string;
  action: string;
  object_type: string;
  object_id: string;
  before_summary?: unknown;
  after_summary?: unknown;
  reason?: string;
  request_id: string;
  created_at: string;
  actor?: {
  type: string;
  id?: string;
};
  diff?: {
  before?: unknown;
  after?: unknown;
};
  meta?: {
  reason?: string;
  request_id: string;
  created_at: string;
};
};

export type FindCarApplicationDTO = {
  id: string;
  customer_id: string;
  status: "pending" | "activated" | "closed";
  raw_text?: string;
  structured_initial_conditions?: unknown;
  activated_demand_id?: string;
  created_at: string;
  updated_at: string;
  version: number;
};

export type FindCarDTO = {
  applications: Array<FindCarApplicationDTO>;
  demands: Array<DemandDTO>;
};

export type FindCarActivationDTO = {
  application: FindCarApplicationDTO;
  demand: StaffDemandDTO;
};

export type DemandConditionDTO = {
  field_key: string;
  condition_kind: "hard" | "acceptable" | "preference";
  operator: string;
  value: unknown;
  unknown_policy: string;
  sort_order: number;
};

export type StaffDemandDTO = {
  id: string;
  customer_id: string;
  source_application_id?: string;
  responsible_employee_id: string;
  status: "active" | "paused" | "completed" | "cancelled";
  match_readiness: "pending_definition" | "ready" | "ready_with_confirmation_needed";
  original_request?: string;
  sales_match_description?: string;
  demand_note?: string;
  conditions: Array<DemandConditionDTO>;
  version: number;
};

export type DemandMatchDTO = {
  id: string;
  demand_id: string;
  vehicle_id: string;
  candidate_tier: "high" | "acceptable" | "confirmation_needed" | "no_match";
  score?: number;
  match_reason?: string;
  mismatch_reason?: string;
  unknown_reason?: string;
  workflow_status: string;
  calculation_version: string;
  is_current: boolean;
  recalculated_at: string;
};

export type RadarEventDTO = {
  id: string;
  demand_id?: string;
  vehicle_id: string;
  event_type: string;
  created_at: string;
  match?: DemandMatchDTO;
};

export type StaffConsultationDTO = {
  consultation: ConsultationDTO;
  customer: StaffCustomerDTO;
  vehicle?: VehicleCardCustomerDTO;
  sla?: {
  deadline_at: string;
  first_real_service_at?: string;
  timed_out_at?: string;
  timeout_alerted_at?: string;
};
};

export type FollowupDTO = {
  id: string;
  customer_id: string;
  employee_id: string;
  occurred_at: string;
  method: string;
  content: string;
  next_plan?: string;
  next_followup_at?: string;
  demand_id?: string;
  vehicle_id?: string;
  consultation_id?: string;
  transaction_id?: string;
  created_at: string;
};

export type AliasNoteDTO = {
  id: string;
  customer_id: string;
  employee_id: string;
  alias_text: string;
  revision_no: number;
  created_at: string;
};

export type PriceQuotaDTO = {
  customer_id: string;
  date: string;
  base_units: number;
  added_units: number;
  used_units: number;
  remaining_units: number;
};

export type PriceQuotaAdjustmentDTO = {
  customer_id: string;
  units_added: number;
  reason: string;
  operator_id: string;
  created_at: string;
  quota: PriceQuotaDTO;
};

export type CustomerFavoriteDTO = {
  vehicle: VehicleCardCustomerDTO;
  favorited: boolean;
  favorited_at?: string;
};

export type PriceAccessDTO = {
  vehicle_id: string;
  listing_cycle_id: string;
  granted: boolean;
  price?: PriceDisplayDTO;
  quota?: PriceQuotaDTO;
};

export type CustomerRecommendationDTO = {
  id: string;
  vehicle: VehicleCardCustomerDTO;
  recommended_at: string;
  recommend_reason?: string;
};

export type CustomerConsultationDTO = {
  id: string;
  vehicle_id?: string;
  status: "pending" | "processing" | "resolved" | "invalid";
  created_at: string;
  sla_deadline_at: string;
  first_real_service_at?: string;
};

export type CustomerWaitlistDTO = {
  id: string;
  vehicle_id: string;
  created_at: string;
  ended_at?: string;
  queue_position_reference?: number;
};

export type CustomerLockDTO = {
  id: string;
  vehicle_id: string;
  created_at: string;
  expires_at?: string;
  ended_at?: string;
};

export type CustomerTransactionDTO = {
  id: string;
  vehicle_id: string;
  status: "in_progress" | "completed" | "cancelled";
  created_at: string;
  completed_at?: string;
  cancelled_at?: string;
};

export type CustomerAnnouncementDTO = {
  id: string;
  title: string;
  body: string;
  starts_at: string;
  ends_at?: string;
};

export type AnnouncementShownDTO = {
  announcement_id: string;
  shown: boolean;
  shown_at: string;
};

export type ShareContextDTO = {
  vehicle_id: string;
  share_token: string;
  expires_at?: string;
};

export type ShareResolveDTO = {
  resolved: boolean;
  target_type: string;
  target_id?: string;
  attribution_recorded: boolean;
};

export type WorkbenchTodoDTO = {
  id: string;
  type: string;
  object_type: string;
  object_id: string;
  due_at?: string;
  title: string;
  priority?: number;
};

export type CustomerOpportunityDTO = {
  customer_id: string;
  opportunity_type: string;
  reason: string;
  detected_at: string;
};

export type StaffVehicleCardDTO = {
  vehicle: VehicleCardCustomerDTO;
  status: VehicleStatusDTO;
  supply_anomaly?: SupplyAnomalyDTO;
};

export type TimelineEventDTO = {
  event_type: string;
  object_type: string;
  object_id: string;
  occurred_at: string;
  summary: string;
};

export type RoleDTO = {
  role_code: string;
  display_name: string;
  enabled: boolean;
  permissions: Array<string>;
};

export type PermissionDTO = {
  permission_code: string;
  display_name: string;
  sensitivity: "normal" | "sensitive" | "system";
};

export type HandoverBatchItemDTO = {
  customer_id: string;
  original_owner_employee_id: string;
  target_owner_employee_id?: string;
  result: string;
};

export type HandoverBatchDTO = {
  id: string;
  departed_employee_id: string;
  departed_at: string;
  status: "processing" | "completed" | "partial_failed";
  created_by: string;
  created_at: string;
  completed_at?: string;
  items: Array<HandoverBatchItemDTO>;
};

export type BusinessReassignmentDTO = {
  id: string;
  object_type: "demand" | "consultation" | "waitlist" | "lock" | "transaction";
  object_id: string;
  from_employee_id: string;
  to_employee_id: string;
  reason: string;
  changed_at: string;
};

export type PricingRuleDTO = {
  id: string;
  lower_bound_cents: number;
  upper_bound_cents: number;
  markup_cents: number;
  sort_order: number;
};

export type MatchingRuleTestResultDTO = {
  input_text: string;
  matched_rule_ids: Array<string>;
  normalized_conditions: Array<DemandConditionDTO>;
  conflicts: Array<string>;
};

export type JytUpsertResultDTO = {
  accepted_count: number;
  created_count: number;
  updated_count: number;
  rejected_count: number;
  request_id: string;
};

export type JytOfflineResultDTO = {
  requested_count: number;
  offlined_count: number;
  not_found_count: number;
  request_id: string;
};

export type JytActiveVehicleDTO = {
  vehicle_id: string;
  car_code: string;
  upstream_status: string;
  first_seen_at: string;
  upstream_updated_at?: string;
};

export type AdminDashboardDTO = {
  vehicle_counts: unknown;
  customer_counts: unknown;
  business_counts: unknown;
  notification_failures: number;
  generated_at: string;
};

export type AdminVehicleDTO = {
  safe: VehicleCustomerDetailDTO;
  internal: StaffVehicleInternalDTO;
  status: VehicleStatusDTO;
  listing_cycle?: ListingCycleDTO;
  supply_anomaly?: SupplyAnomalyDTO;
  vin?: string;
};

export type AdminVehicleHistoryDTO = {
  vehicle_id: string;
  listing_cycles: Array<ListingCycleDTO>;
  audit_events: Array<AuditLogDTO>;
};

export type PublisherPhoneCacheDTO = {
  publisher_id: string;
  phone: string;
  contact_name?: string;
  status: "valid" | "invalid" | "unknown";
  fetched_at: string;
};

export type IncidentDTO = {
  id: string;
  integration_code: string;
  incident_type: string;
  status: "active" | "recovered";
  started_at: string;
  recovered_at?: string;
  last_observed_at: string;
  alert_stage: number;
};

export type IntegrationLogDTO = {
  id: string;
  integration_code: string;
  operation: string;
  request_id: string;
  result_code: string;
  http_status?: number;
  duration_ms?: number;
  created_at: string;
};

export type TransactionCorrectionRequest = {
  reason: string;
};

export type TransactionCorrectionDTO = {
  id: string;
  transaction_id: string;
  reason: string;
  operator_id: string;
  corrected_at: string;
  original_status: string;
  resulting_business_state: string;
};

export type CustomerLevelDTO = {
  id: string;
  name: string;
  sort_order: number;
  enabled: boolean;
  entitlements: Array<EntitlementValueDTO>;
  version: number;
};

export type PriceOverrideDTO = {
  id: string;
  vehicle_id: string;
  override_price_cents: number;
  reason: string;
  effective_at: string;
  revoked_at?: string;
};

export type FeishuBindingWriteRequest = {
  receive_identity: string;
};

export type StaffCustomerProfileUpdateRequest = {
  summary_text?: string;
  structured_profile?: unknown;
  extra_profile?: unknown;
  version?: number;
};

export type CustomerLevelAssignmentRequest = {
  level_id: string;
  reason: string;
};

export type StaffSelfDTO = {
  id: string;
  display_name: string;
  employment_status: "active" | "inactive";
  primary_role_code: string;
  employee_kind: "mingbang" | "four_s";
  store_id?: string;
  four_s_org_name?: string;
  receiving_enabled: boolean;
  customer_business_eligible: boolean;
  permissions: Array<string>;
  data_scopes: Array<{
  scope_type: "self" | "store" | "team" | "explicit";
  scope_payload?: unknown;
}>;
  feishu_binding_status: "bound" | "unbound";
  version: number;
};

export type VehicleBrandDTO = {
  brand_id: number;
  brand_name: string;
};

export type VehicleSeriesDTO = {
  series_id: number;
  brand_id: number;
  series_name: string;
};

export type VehicleModelDTO = {
  model_id: number;
  brand_id: number;
  series_id: number;
  model_year?: number | null;
  model_name: string;
  guiding_price_cents?: number | null;
  displacement_l?: number | null;
  energy_type_label?: string | null;
  gearbox_label?: string | null;
  emission_standard?: string | null;
  body_type?: string | null;
  total_power_kw?: number | null;
  battery_kwh?: number | null;
  range_km?: number | null;
};

export type JytImageSourceDTO = {
  id: number | string;
  car_id: number | string;
  filename: string;
  sorting: number;
  [key: string]: unknown;
};

export type JytSubSourceDTO = {
  tags?: Array<string>;
  fuel_type_label?: string | null;
  is_new_energy?: number | string | null;
  total_power_label?: string | null;
  battery_energy_label?: string | null;
  biggest_mileage_label?: string | null;
  [key: string]: unknown;
};

export type JytVehicleSourceDataV1 = {
  id: number;
  creater_id: number | string;
  name: string;
  model_id: number | string;
  car_status: number | string;
  price?: number | string | null;
  bottom_price?: number | string | null;
  guide_price_label?: string | null;
  capacity_label?: string | null;
  gearbox?: number | string | null;
  gearbox_label?: string | null;
  emission?: number | string | null;
  emission_label?: string | null;
  inside_color?: number | string | null;
  inside_color_label?: string | null;
  out_color_label?: string | null;
  plate_date?: string | null;
  plate_date_label?: string | null;
  mileage_label?: string | null;
  category_type_label?: string | null;
  serie_label?: string | null;
  province_label?: string | null;
  city_label?: string | null;
  district_label?: string | null;
  description?: string | null;
  created_at?: string | null;
  modified_at?: string | null;
  off_shelves_time?: string | null;
  images?: Array<JytImageSourceDTO>;
  sub?: JytSubSourceDTO;
  [key: string]: unknown;
};

export type JytVehicleUpsertItemV2 = {
  source_platform: string;
  car_code: string;
  source_data: JytVehicleSourceDataV1;
};

export type VehicleWriteRequestV2 = {
  source_type?: "mingbang" | "four_s";
  vehicle_model_id?: number | null;
  vehicle_name_snapshot?: string | null;
  plate_date?: string | null;
  mileage_km?: number | null;
  province?: string | null;
  city?: string | null;
  district?: string | null;
  exterior_color?: string | null;
  interior_color?: string | null;
  condition_summary?: string | null;
  vin?: string | null;
  customer_list_price_cents?: number | null;
  internal_wholesale_price_cents?: number | null;
  exterior_color_id?: number | null;
  interior_color_id?: number | null;
  condition_tag_codes?: Array<string>;
};

export type VehicleModelMatchCaseDTO = {
  case_id: number;
  source_platform: string;
  upstream_model_id: string;
  status: "pending" | "conflict" | "resolved";
  sample_car_code?: string | null;
  upstream_name?: string | null;
  upstream_series_label?: string | null;
  candidate_model_ids?: Array<number>;
  source_snapshot?: {
  [key: string]: unknown;
};
  first_seen_at: string;
  last_seen_at?: string;
  resolved_model_id?: number | null;
  version: number;
};

export type VehicleModelMatchCasePageDTO = {
  items: Array<VehicleModelMatchCaseDTO>;
  next_cursor?: string | null;
};

export type VehicleModelBindExistingRequest = {
  vehicle_model_id: number;
  version: number;
  reason: string;
};

export type VehicleModelCreateAndBindRequest = {
  brand_id: number;
  series_id: number;
  model_year?: number | null;
  model_name: string;
  guiding_price_cents?: number | null;
  displacement_l?: number | null;
  energy_type_label?: string | null;
  gearbox_label?: string | null;
  emission_standard?: string | null;
  body_type?: string | null;
  total_power_kw?: number | null;
  battery_kwh?: number | null;
  range_km?: number | null;
  version: number;
  reason: string;
};

export type VehicleModelMatchResolutionDTO = {
  case_id: number;
  vehicle_model_id: number;
  remapped_vehicle_count: number;
  resolved_at: string;
};

export type CustomerVehicleCardPageDTO = {
  items: Array<VehicleCardCustomerDTO>;
  next_cursor?: string | null;
};

export type StaffVehicleCardPageDTO = {
  items: Array<StaffVehicleCardDTO>;
  next_cursor?: string | null;
};

export type VehicleModelFieldConflictDTO = {
  conflict_id: number;
  model_id: number;
  source_platform: string;
  upstream_model_id: string;
  field_name: string;
  current_value?: unknown;
  incoming_value?: unknown;
  conflict_status: "open" | "resolved_keep_local" | "resolved_accept_upstream";
  first_seen_at: string;
  last_seen_at: string;
  occurrence_count: number;
  resolved_at?: string | null;
  resolution_reason?: string | null;
};

export type VehicleModelFieldConflictPageDTO = {
  items: Array<VehicleModelFieldConflictDTO>;
  next_cursor?: string | null;
};

export type VehicleModelFieldConflictResolveRequest = {
  resolution: "keep_local" | "accept_upstream";
  reason: string;
};

export type VehicleModelCreateRequest = (VehicleModelCreateAndBindRequest);

export type VehicleModelPatchRequest = {
  model_year?: number | null;
  model_name?: string;
  guiding_price_cents?: number | null;
  displacement_l?: number | null;
  energy_type_label?: string | null;
  gearbox_label?: string | null;
  emission_standard?: string | null;
  body_type?: string | null;
  total_power_kw?: number | null;
  battery_kwh?: number | null;
  range_km?: number | null;
  version: number;
  reason: string;
};

export type VehicleBrandCreateRequest = {
  brand_name: string;
  reason: string;
};

export type VehicleSeriesCreateRequest = {
  brand_id: number;
  series_name: string;
  reason: string;
};

export type VehicleModelPageDTO = {
  items: Array<VehicleModelDTO>;
  next_cursor?: string | null;
};

export type EmployeeReportPreferencesDTO = {
  employee_id: string;
  exclude_from_phone_daily_feishu_report: boolean;
  updated_at?: string;
};

export type EmployeeReportPreferencesRequest = {
  exclude_from_phone_daily_feishu_report: boolean;
};

export type StaffVehicleSourceDataDTO = {
  vehicle_id: number;
  source_type: unknown;
  read_only: unknown;
  source_data: {
  [key: string]: unknown;
};
  redacted_fields?: Array<string>;
};

export type JytVehiclePriceBatchRequest = {
  request_id: string;
  items: Array<{
  car_code: string;
  price_label: string;
}>;
};

export type JytVehiclePriceBatchResult = {
  request_id: string;
  received_count: number;
  success_count: number;
  failed_count: number;
  results: Array<{
  car_code: string;
  result: "PRICE_CHANGED" | "PRICE_UNCHANGED" | "VEHICLE_NOT_FOUND" | "PRICE_PARSE_FAILED" | "UPDATE_FAILED" | "STALE_REQUEST";
  retryable: boolean;
  error_code?: string | null;
}>;
};

export type CollectorConnectionConfigDTO = {
  base_url: string;
  phone_path: string;
  internal_key_status: "configured" | "missing";
  timeout_ms: number;
  version: number;
  connection_status: "untested" | "ready" | "failed";
};

export type CollectorConnectionConfigWriteRequest = {
  base_url: string;
  phone_path: string;
  internal_key?: string | null;
  timeout_ms: number;
  reason: string;
};

export type CollectorConnectionTestRequest = {
  publisher_id: string;
};

export type CollectorConnectionTestResult = {
  connection_status: "untested" | "ready" | "failed";
  success: boolean;
  http_status_class?: number | null;
  latency_ms?: number | null;
  valid_phone_shape?: boolean | null;
  masked_phone?: string | null;
};
