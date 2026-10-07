import type { Queryable } from "../../core/db-types.js";
import { idString, intValue } from "../../core/db-types.js";
import type { StaffSelfDTO } from "@mingbang/contracts/types";

export async function getStaffSelf(
  db: Queryable,
  employeeId: string,
  materializedPermissions: readonly string[]
): Promise<StaffSelfDTO | null> {
  const { rows } = await db.query({
    text: `SELECT e.employee_id,e.display_name,e.employment_status,e.primary_role_code,e.employee_kind,
                  e.store_id,e.four_s_org_name,e.receiving_enabled,e.customer_business_eligible,e.version,
                  EXISTS(SELECT 1 FROM employee_feishu_bindings fb
                         WHERE fb.employee_id=e.employee_id AND fb.ended_at IS NULL) AS feishu_bound,
                  COALESCE((SELECT jsonb_agg(jsonb_build_object(
                            'scope_type',s.scope_type,'scope_payload',s.scope_payload)
                            ORDER BY s.scope_id)
                            FROM employee_data_scopes s
                            WHERE s.employee_id=e.employee_id AND s.revoked_at IS NULL),'[]'::jsonb) AS data_scopes
           FROM employees e
           WHERE e.employee_id=$1`,
    values: [employeeId]
  });
  const r=rows[0]; if(!r) return null;
  const scopes=Array.isArray(r.data_scopes) ? r.data_scopes : [];
  return {
    id:idString(r.employee_id),
    display_name:String(r.display_name),
    employment_status:r.employment_status === "inactive" ? "inactive" : "active",
    primary_role_code:String(r.primary_role_code),
    employee_kind:r.employee_kind === "four_s" ? "four_s" : "mingbang",
    ...(r.store_id != null ? {store_id:idString(r.store_id)} : {}),
    ...(r.four_s_org_name ? {four_s_org_name:String(r.four_s_org_name)} : {}),
    receiving_enabled:Boolean(r.receiving_enabled),
    customer_business_eligible:Boolean(r.customer_business_eligible),
    permissions:[...materializedPermissions],
    data_scopes:scopes.map((x:any)=>({
      scope_type:x.scope_type as "self"|"store"|"team"|"explicit",
      ...(x.scope_payload != null ? {scope_payload:x.scope_payload} : {})
    })),
    feishu_binding_status:r.feishu_bound ? "bound" : "unbound",
    version:intValue(r.version)
  };
}
