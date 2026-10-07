export interface CustomerVisibilityInput {
  sourceStatus: "draft" | "active" | "offline" | "unavailable" | "sold_external";
  bizStatus: "normal" | "locked" | "trading" | "completed";
  platformVisibility: "visible" | "hidden";
  hasCustomerGrant: boolean;
  hasBusinessAccess?: boolean;
  customerId: bigint | null;
  activePriorityCustomerId: bigint | null;
  hasActiveRecommendationForPriorityCustomer: boolean;
}

export interface VisibilityDecision {
  visible: boolean;
  reason: string;
}

export function decideCustomerVisibility(input: CustomerVisibilityInput): VisibilityDecision {
  // Existing Lock/Transaction business access survives Recommendation/grant end and public hiding.
  if (input.hasBusinessAccess) return { visible: true, reason: "BUSINESS_ACCESS" };

  if (input.sourceStatus !== "active") return { visible: false, reason: "SOURCE_UNAVAILABLE" };
  if (input.bizStatus === "trading" || input.bizStatus === "completed") {
    return { visible: false, reason: "BUSINESS_STATE_RESTRICTED" };
  }

  // Priority is an exclusive overlay. It never makes the customer visible by itself.
  if (input.activePriorityCustomerId !== null) {
    if (input.customerId === null || input.customerId !== input.activePriorityCustomerId) {
      return { visible: false, reason: "VEHICLE_PRIORITY_PROTECTED" };
    }
    if (!input.hasActiveRecommendationForPriorityCustomer) {
      return { visible: false, reason: "PRIORITY_NOT_YET_RECOMMENDED" };
    }
    if (!input.hasCustomerGrant) {
      return { visible: false, reason: "RECOMMENDATION_GRANT_MISSING" };
    }
    return { visible: true, reason: "PRIORITY_RECOMMENDATION_GRANT" };
  }

  if (input.platformVisibility === "visible") return { visible: true, reason: "PUBLIC" };
  if (input.hasCustomerGrant) return { visible: true, reason: "RECOMMENDATION_GRANT" };
  return { visible: false, reason: "PLATFORM_HIDDEN" };
}

export function isVehiclePubliclyDiscoverable(input: Pick<CustomerVisibilityInput, "sourceStatus" | "bizStatus" | "platformVisibility">): boolean {
  return input.sourceStatus === "active"
    && (input.bizStatus === "normal" || input.bizStatus === "locked")
    && input.platformVisibility === "visible";
}

export interface StaffPriorityVisibilityInput {
  activePriorityCustomerId: bigint | null;
  priorityCustomerResponsibleEmployeeId: bigint | null;
  employeeId: bigint;
  hasPriorityView: boolean;
}

export function decideStaffPriorityVisibility(input: StaffPriorityVisibilityInput): VisibilityDecision {
  if (input.activePriorityCustomerId === null) return { visible: true, reason: "NO_ACTIVE_PRIORITY" };
  if (input.priorityCustomerResponsibleEmployeeId === input.employeeId) {
    return { visible: true, reason: "RESPONSIBLE_SALES" };
  }
  if (input.hasPriorityView) return { visible: true, reason: "PRIORITY_VIEW" };
  return { visible: false, reason: "VEHICLE_PRIORITY_PROTECTED" };
}

export function resolveShareCapabilities() {
  return {
    attribution: true,
    recommendation: false,
    visibilityGrant: false,
    priceEntitlement: false,
  } as const;
}
