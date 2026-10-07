import type { FastifyInstance } from "fastify";
import { AppError } from "../../core/errors.js";
import { requireCustomerPrincipal, requireEmployeePrincipal } from "../../core/authz.js";
import type { ObjectScopeAuthorizer } from "../../core/object-scope.js";
import { canStaffReadPriorityProtectedVehicle, getAdminVehicle, getCustomerVehicleDetail, getStaffVehicleInternal, getStaffVehicleSafe, type VehicleImageUrlResolver } from "./vehicle-read.repository.js";

export interface VehicleReadRouteDeps { scope: ObjectScopeAuthorizer; images: VehicleImageUrlResolver; }
export async function vehicleReadRoutes(app: FastifyInstance, deps: VehicleReadRouteDeps) {
  app.get('/customer/vehicles/:vehicle_id', async (request) => {
    const p=requireCustomerPrincipal(request); const id=String((request.params as any).vehicle_id);
    const dto=await getCustomerVehicleDetail(app.db,id,deps.images,p.customerId);
    if(!dto) throw new AppError('OBJECT_NOT_FOUND','Vehicle not found',404); return dto;
  });
  app.get('/staff/vehicles/:id', async (request) => {
    const p=requireEmployeePrincipal(request,'vehicle.read.customer_safe'); const id=String((request.params as any).id);
    await deps.scope.assertVehicle(p,id); if(!await canStaffReadPriorityProtectedVehicle(app.db,id,p.employeeId,p.permissions.includes('priority.view'))) throw new AppError('OBJECT_NOT_FOUND','Vehicle not found',404); const dto=await getStaffVehicleSafe(app.db,id,deps.images);
    if(!dto) throw new AppError('OBJECT_NOT_FOUND','Vehicle not found',404); return dto;
  });
  app.get('/staff/vehicles/:id/internal', async (request) => {
    const p=requireEmployeePrincipal(request,'vehicle.read.internal'); const id=String((request.params as any).id);
    await deps.scope.assertVehicle(p,id);
    if(!await canStaffReadPriorityProtectedVehicle(app.db,id,p.employeeId,p.permissions.includes('priority.view'))) throw new AppError('OBJECT_NOT_FOUND','Vehicle not found',404);
    const dto=await getStaffVehicleInternal(app.db,id,deps.images,{internalPrice:p.permissions.includes('vehicle.internal_price.view'),upstreamPhone:p.permissions.includes('vehicle.upstream_phone')});
    if(!dto) throw new AppError('OBJECT_NOT_FOUND','Vehicle not found',404); return dto;
  });
  app.get('/admin/vehicles/:id', async (request) => {
    const p=requireEmployeePrincipal(request,'vehicle.read.internal'); const id=String((request.params as any).id);
    await deps.scope.assertVehicle(p,id);
    if(!await canStaffReadPriorityProtectedVehicle(app.db,id,p.employeeId,p.permissions.includes('priority.view'))) throw new AppError('OBJECT_NOT_FOUND','Vehicle not found',404);
    const dto=await getAdminVehicle(app.db,id,deps.images,{internalPrice:p.permissions.includes('vehicle.internal_price.view'),upstreamPhone:p.permissions.includes('vehicle.upstream_phone')});
    if(!dto) throw new AppError('OBJECT_NOT_FOUND','Vehicle not found',404); return dto;
  });
}
