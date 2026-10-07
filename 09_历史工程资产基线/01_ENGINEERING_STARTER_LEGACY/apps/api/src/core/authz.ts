import type { FastifyRequest } from "fastify";
import { AppError } from "./errors.js";
import type { RbacPermission } from "@mingbang/contracts/permissions";

export type Principal =
  | { domain: "customer"; customerId: string }
  | { domain: "employee"; employeeId: string; permissions: readonly string[] }
  | { domain: "system_admin"; systemAdminId: string }
  | { domain: "jyt_integration"; integrationId: string };

export function requireCustomerPrincipal(request: FastifyRequest): Extract<Principal,{domain:"customer"}> {
  const p=request.principal;
  if (!p || p.domain!=="customer") throw new AppError("UNAUTHENTICATED","Customer session required",401);
  return p;
}
export function requireEmployeeSession(request: FastifyRequest): Extract<Principal,{domain:"employee"}> {
  const p=request.principal;
  if (!p || p.domain!=="employee") throw new AppError("UNAUTHENTICATED","Employee session required",401);
  return p;
}
export function requireEmployeePrincipal(request: FastifyRequest, permission: RbacPermission): Extract<Principal,{domain:"employee"}> {
  const p=request.principal;
  if (!p || p.domain!=="employee") throw new AppError("UNAUTHENTICATED","Employee session required",401);
  if (!p.permissions.includes(permission)) throw new AppError("PERMISSION_DENIED",`Missing permission: ${permission}`,403);
  return p;
}
