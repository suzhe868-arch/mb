export type Brand<T, B extends string> = T & { readonly __brand: B };
export type VehicleId = Brand<bigint, "VehicleId">;
export type CustomerId = Brand<bigint, "CustomerId">;
export type EmployeeId = Brand<bigint, "EmployeeId">;
