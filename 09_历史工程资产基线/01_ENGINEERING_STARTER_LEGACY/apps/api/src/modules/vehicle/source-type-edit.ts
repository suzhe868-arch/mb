import { AppError } from "../../core/errors.ts";

export type VehicleSourceType = "wholesale" | "mingbang" | "four_s";
export type VehicleEditMode = { mode: "readonly-source" | "editable"; patchAllowed: boolean };

export function resolveVehicleEditMode(sourceType: VehicleSourceType): VehicleEditMode {
  return sourceType === "wholesale"
    ? { mode: "readonly-source", patchAllowed: false }
    : { mode: "editable", patchAllowed: true };
}

export function assertVehiclePatchAllowed(sourceType: VehicleSourceType): void {
  if (!resolveVehicleEditMode(sourceType).patchAllowed) {
    throw new AppError("SOURCE_TYPE_READ_ONLY", "Wholesale source data is read-only", 422);
  }
}
