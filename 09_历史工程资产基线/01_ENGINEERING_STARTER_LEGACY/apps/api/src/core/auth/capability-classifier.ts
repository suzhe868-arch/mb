import { RBAC_PERMISSIONS } from "@mingbang/contracts/permissions";
import { NON_RBAC_CAPABILITY_MARKERS } from "@mingbang/contracts/capabilities";
const rbac = new Set<string>(RBAC_PERMISSIONS);
const marker = new Set<string>(NON_RBAC_CAPABILITY_MARKERS);
export type CapabilityClass = "rbac" | "identity_or_integration" | "unknown";
export function classifyCapability(code: string): CapabilityClass {
  if (rbac.has(code)) return "rbac";
  if (marker.has(code)) return "identity_or_integration";
  return "unknown";
}
