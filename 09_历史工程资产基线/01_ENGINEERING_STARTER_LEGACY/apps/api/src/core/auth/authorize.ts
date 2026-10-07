import type { ActorContext, AuthorizationRequirement } from "./types.js";
import { classifyCapability } from "./capability-classifier.js";
import { AppError } from "../errors.js";
export function authorizeBase(actor: ActorContext, requirement: AuthorizationRequirement): void {
  if (actor.domain !== requirement.identityDomain) throw new AppError("PERMISSION_DENIED", "identity domain mismatch", 403);
  const kind = classifyCapability(requirement.capability);
  if (kind === "unknown") throw new AppError("INTERNAL_ERROR", `unknown capability: ${requirement.capability}`, 500);
  if (kind === "rbac" && !actor.permissions.has(requirement.capability)) throw new AppError("PERMISSION_DENIED", "permission denied", 403);
  // Data scope + object-state checks are module-specific and MUST run after this base gate.
}
