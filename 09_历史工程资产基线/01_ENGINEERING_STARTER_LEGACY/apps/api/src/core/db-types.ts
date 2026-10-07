import type { Pool, PoolClient } from "pg";
export type Queryable = Pick<Pool, "query"> | Pick<PoolClient, "query">;
export function idString(value: unknown): string { return String(value); }
export function intValue(value: unknown): number { return typeof value === "number" ? value : Number(value); }
export function iso(value: unknown): string { return value instanceof Date ? value.toISOString() : new Date(String(value)).toISOString(); }
export function optionalIso(value: unknown): string | undefined { return value == null ? undefined : iso(value); }
