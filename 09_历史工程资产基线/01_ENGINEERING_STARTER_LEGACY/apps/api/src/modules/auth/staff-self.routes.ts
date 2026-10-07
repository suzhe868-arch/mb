import type { FastifyInstance } from "fastify";
import { AppError } from "../../core/errors.js";
import { requireEmployeeSession } from "../../core/authz.js";
import { getStaffSelf } from "./staff-self.repository.js";

/** Static W03 route adapter for the CR-005 StaffSelf contract.
 * Runtime authentication/plugin wiring remains a DEV-GATE item.
 */
export async function staffSelfRoutes(app: FastifyInstance) {
  app.get('/staff/me', async (request) => {
    const principal=requireEmployeeSession(request);
    const dto=await getStaffSelf(app.db,principal.employeeId,principal.permissions);
    if(!dto) throw new AppError('OBJECT_NOT_FOUND','Employee not found',404);
    return dto;
  });
}
