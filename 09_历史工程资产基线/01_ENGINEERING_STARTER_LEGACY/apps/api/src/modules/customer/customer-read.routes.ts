import type { FastifyInstance } from "fastify";
import { AppError } from "../../core/errors.js";
import { requireCustomerPrincipal, requireEmployeePrincipal } from "../../core/authz.js";
import type { ObjectScopeAuthorizer } from "../../core/object-scope.js";
import { getAdminCustomer, getCustomerSelf, getStaffCustomer } from "./customer-read.repository.js";

export interface CustomerReadRouteDeps { scope: ObjectScopeAuthorizer; }
export async function customerReadRoutes(app: FastifyInstance, deps: CustomerReadRouteDeps) {
  app.get('/customer/me', async (request) => {
    const p=requireCustomerPrincipal(request); const dto=await getCustomerSelf(app.db,p.customerId);
    if(!dto) throw new AppError('OBJECT_NOT_FOUND','Customer not found',404); return dto;
  });
  app.get('/staff/customers/:customer_id', async (request) => {
    const p=requireEmployeePrincipal(request,'crm.customer.read'); const id=String((request.params as any).customer_id);
    await deps.scope.assertCustomer(p,id); const dto=await getStaffCustomer(app.db,id,p.employeeId);
    if(!dto) throw new AppError('OBJECT_NOT_FOUND','Customer not found',404); return dto;
  });
  app.get('/admin/customers/:id', async (request) => {
    const p=requireEmployeePrincipal(request,'crm.customer.read'); const id=String((request.params as any).id);
    await deps.scope.assertCustomer(p,id); const dto=await getAdminCustomer(app.db,id,p.employeeId);
    if(!dto) throw new AppError('OBJECT_NOT_FOUND','Customer not found',404); return dto;
  });
}
