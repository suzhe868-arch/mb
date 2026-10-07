import type { Principal } from "./authz.js";
export interface ObjectScopeAuthorizer {
  assertCustomer(employee: Extract<Principal,{domain:"employee"}>, customerId: string): Promise<void>;
  assertVehicle(employee: Extract<Principal,{domain:"employee"}>, vehicleId: string): Promise<void>;
}
