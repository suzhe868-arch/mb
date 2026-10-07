export const NON_RBAC_CAPABILITY_MARKERS = [
  "auth.staff.session",
  "auth.system_admin.session",
  "customer.session",
  "customer.self",
  "jyt.integration.ingest"
] as const;
export type NonRbacCapabilityMarker = typeof NON_RBAC_CAPABILITY_MARKERS[number];
