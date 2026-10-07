export interface LockEligibilityInput {
  sourceStatus: "draft" | "active" | "offline" | "unavailable" | "sold_external";
  bizStatus: "normal" | "locked" | "trading" | "completed";
  internalWholesalePriceCents: number | null;
  activeLockCustomerId: bigint | null;
  customerId: bigint;
  canCreateLock: boolean;
  inDataScope: boolean;
}

export type LockEligibility =
  | { allowed: true }
  | { allowed: false; code: string };

export function decideLockEligibility(input: LockEligibilityInput): LockEligibility {
  if (!input.canCreateLock || !input.inDataScope) return { allowed: false, code: "PERMISSION_DENIED" };
  if (input.sourceStatus !== "active" || input.bizStatus === "trading" || input.bizStatus === "completed") {
    return { allowed: false, code: "VEHICLE_NOT_LOCKABLE" };
  }
  if (input.activeLockCustomerId !== null) return { allowed: false, code: "VEHICLE_ALREADY_LOCKED" };

  // Priority is deliberately NOT a Lock competition gate. If a caller can reach the
  // Lock action, current visibility + capability + data-scope checks have already run.
  // internalWholesalePriceCents is also deliberately not a gate.
  return { allowed: true };
}
