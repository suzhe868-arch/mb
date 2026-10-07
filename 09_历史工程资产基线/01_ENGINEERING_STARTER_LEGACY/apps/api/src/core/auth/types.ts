export type IdentityDomain = "anonymous" | "customer" | "employee" | "system_admin" | "integration";
export interface ActorContext {
  domain: IdentityDomain;
  actorId?: bigint;
  permissions: ReadonlySet<string>;
  dataScopes: readonly unknown[];
}
export interface AuthorizationRequirement {
  identityDomain: IdentityDomain;
  capability: string;
  scope: string;
  objectState?: string;
}
