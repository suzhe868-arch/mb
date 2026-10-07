import { AppError } from "./errors.ts";

export interface IdempotencyKey { actorDomain: string; actorId: string; action: string; key: string; }
export function requireIdempotencyKey(value: string | undefined): string {
  if (!value?.trim()) throw new AppError("INVALID_REQUEST", "Idempotency-Key required", 400);
  return value.trim();
}

export function idempotencyScope(value: IdempotencyKey): string {
  return `${value.actorDomain}:${value.actorId}:${value.action}:${requireIdempotencyKey(value.key)}`;
}
