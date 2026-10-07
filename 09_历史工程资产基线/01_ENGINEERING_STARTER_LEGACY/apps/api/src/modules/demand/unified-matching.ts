export type MatchTier = "high" | "acceptable" | "confirmation_needed" | "no_match";
export type ConditionResult = "match" | "mismatch" | "unknown" | "not_requested";

export interface UnifiedMatchInput {
  /** Every requested hard field is represented here after deterministic normalization. */
  hardConditions: readonly ConditionResult[];
  /** Customer-visible current price; absent/consultation is not matchable in V1. */
  customerDisplayPriceCents: number | null;
  budgetMaxCents?: number | null;
  budgetOverrunTolerancePct?: number;
  /** Interior color is the only frozen V1 soft preference. */
  interiorColorPreference?: ConditionResult;
}

export interface UnifiedMatchDecision {
  tier: MatchTier;
  reason: string;
}

export function classifyUnifiedMatch(input: UnifiedMatchInput): UnifiedMatchDecision {
  if (input.customerDisplayPriceCents === null) {
    return { tier: "no_match", reason: "CUSTOMER_DISPLAY_PRICE_MISSING" };
  }
  if (input.hardConditions.includes("mismatch")) {
    return { tier: "no_match", reason: "HARD_CONDITION_MISMATCH" };
  }
  if (input.hardConditions.includes("unknown")) {
    return { tier: "confirmation_needed", reason: "HARD_CONDITION_UNKNOWN" };
  }

  const budget = input.budgetMaxCents ?? null;
  if (budget !== null) {
    const tolerancePct = input.budgetOverrunTolerancePct ?? 5;
    const toleratedMax = Math.floor(budget * (1 + tolerancePct / 100));
    if (input.customerDisplayPriceCents > toleratedMax) {
      return { tier: "no_match", reason: "BUDGET_OVER_TOLERANCE" };
    }
    if (input.customerDisplayPriceCents > budget) {
      return { tier: "acceptable", reason: "BUDGET_WITHIN_TOLERANCE" };
    }
  }

  if (input.interiorColorPreference === "mismatch" || input.interiorColorPreference === "unknown") {
    return { tier: "acceptable", reason: "SOFT_PREFERENCE_NOT_MET" };
  }
  return { tier: "high", reason: "ALL_REQUESTED_CONDITIONS_MET" };
}

export interface PriorityCandidate {
  customerId: bigint;
  demandId: bigint;
  demandCreatedAt: Date;
  tier: "high" | "acceptable";
  isPriorityCustomer: boolean;
  hasResponsibleSales: boolean;
  alreadyEndedForCustomerVehicleCycle: boolean;
}

function rank(candidate: PriorityCandidate): readonly [number, number, bigint] {
  return [candidate.tier === "high" ? 0 : 1, candidate.demandCreatedAt.getTime(), candidate.demandId];
}
function better(a: PriorityCandidate, b: PriorityCandidate): PriorityCandidate {
  const ar=rank(a), br=rank(b);
  if (ar[0] !== br[0]) return ar[0] < br[0] ? a : b;
  if (ar[1] !== br[1]) return ar[1] < br[1] ? a : b;
  return ar[2] < br[2] ? a : b;
}

export interface PriorityArbitrationInput {
  vehicleOpenForMatching: boolean;
  hasActiveLock: boolean;
  hasInProgressTransaction: boolean;
  hasActivePriority: boolean;
  candidates: readonly PriorityCandidate[];
}

export function choosePriorityCandidate(input: PriorityArbitrationInput): PriorityCandidate | null {
  if (!input.vehicleOpenForMatching || input.hasActiveLock || input.hasInProgressTransaction || input.hasActivePriority) return null;
  const eligible=input.candidates.filter(c=>c.isPriorityCustomer && c.hasResponsibleSales && !c.alreadyEndedForCustomerVehicleCycle);
  if (!eligible.length) return null;

  // Same customer may have multiple matching Demands; choose one best trigger Demand first.
  const bestByCustomer=new Map<bigint,PriorityCandidate>();
  for (const c of eligible) {
    const prev=bestByCustomer.get(c.customerId);
    bestByCustomer.set(c.customerId,prev?better(prev,c):c);
  }
  let winner:PriorityCandidate|null=null;
  for (const c of bestByCustomer.values()) winner=winner?better(winner,c):c;
  return winner;
}


export interface VehicleMatchingCandidateInput {
  sourceStatus: "draft" | "active" | "offline" | "unavailable" | "sold_external";
  bizStatus: "normal" | "locked" | "trading" | "completed";
  platformVisibility: "visible" | "hidden";
  hasActiveLock: boolean;
  hasInProgressTransaction: boolean;
}

/**
 * Matching eligibility is intentionally independent of platformVisibility.
 * `hidden` removes a vehicle from public browsing/search only; it remains matchable while saleable.
 */
export function isVehicleEligibleForDemandMatching(input: VehicleMatchingCandidateInput): boolean {
  return input.sourceStatus === "active"
    && input.bizStatus === "normal"
    && !input.hasActiveLock
    && !input.hasInProgressTransaction;
}
