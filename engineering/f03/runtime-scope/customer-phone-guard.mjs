// F03-2-1B LIMITED INTERNAL customer.phone.manage decision only.
// No phone INSERT/UPDATE/DELETE is performed by this guard.
import {verifyScopeDatabase} from './readiness.mjs';
const safeId=x=>typeof x==='string'&&/^[1-9]\d{0,18}$/.test(x)&&BigInt(x)<=9223372036854775807n;
const answer=(code,allowed=false)=>Object.freeze({code,allowed});
const statement=String.raw`
SELECT a.account_id::text AS account_id,a.principal_kind,a.employee_id::text AS account_employee_id,
       a.system_admin_id::text AS account_admin_id,a.credential_state,a.force_password_change,
       e.employee_id::text AS employee_id,e.employment_status,e.main_role_id::text AS main_role_id,
       e.store_id::text AS store_id,r.role_code,
       sa.system_admin_id::text AS system_admin_id,sa.account_status AS admin_status,
       p.permission_id::text AS permission_id,d.enabled AS role_enabled,o.decision AS personal_decision,
       cu.customer_id::text AS customer_id,cu.account_status AS customer_status,
       EXISTS (
         SELECT 1 FROM public.employee_data_scopes s
         JOIN public.employee_capability_scope_bindings b
           ON b.scope_id=s.scope_id AND b.employee_id=s.employee_id
         WHERE s.employee_id=e.employee_id AND b.employee_id=e.employee_id
           AND b.permission_id=p.permission_id AND s.scope_kind='object'
           AND s.scope_reference_id=$2::bigint
           AND (s.ended_at IS NULL OR s.ended_at>statement_timestamp())
           AND b.granted_at<=statement_timestamp()
           AND (b.ended_at IS NULL OR b.ended_at>statement_timestamp())
       ) AS valid_capability_object_scope
FROM public.pc_login_accounts a
LEFT JOIN public.employees e ON a.principal_kind='employee' AND e.employee_id=a.employee_id
LEFT JOIN public.roles r ON r.role_id=e.main_role_id
LEFT JOIN public.system_admins sa ON a.principal_kind='system_admin' AND sa.system_admin_id=a.system_admin_id
LEFT JOIN public.permissions p ON p.permission_code='customer.phone.manage'
LEFT JOIN public.role_permission_defaults d ON d.role_id=e.main_role_id AND d.permission_id=p.permission_id
LEFT JOIN public.employee_permission_overrides o ON o.employee_id=e.employee_id AND o.permission_id=p.permission_id
LEFT JOIN public.customers cu ON cu.customer_id=$2::bigint
WHERE a.account_id=$1::bigint
`;
export async function checkCustomerPhoneScopeInTransaction(c,a,operation,customerId){
 if(operation!=='customer.phone.manage')return answer('OTHER_ACTION_DEFER_DENY');
 if(!safeId(customerId))return answer('INVALID_CUSTOMER_ID');
 const rows=(await c.query({text:statement,values:[String(a.account_id),customerId]})).rows;
 if(rows.length!==1)return answer('INCOMPLETE_CURRENT_FACTS');
 const x=rows[0];
 if(x.account_id!==String(a.account_id)||x.principal_kind!==a.principal_kind||
    x.credential_state!=='enabled'||x.force_password_change!==false)return answer('CURRENT_IDENTITY_DENIED');
 if(x.principal_kind==='system_admin')return answer('SYSTEM_ADMIN_HARD_DENY');
 if(x.principal_kind!=='employee'||!safeId(x.employee_id)||x.employee_id!==x.account_employee_id||
    x.employee_id!==String(a.employee_id)||x.account_admin_id!==null||a.system_admin_id!==null ||
    x.employment_status!=='active'||!safeId(x.main_role_id)||
    !['sales','manager','store_manager','four_s'].includes(x.role_code))return answer('CURRENT_IDENTITY_DENIED');
 if(x.role_code==='four_s')return answer('FOUR_S_HARD_DENY');
 if(!x.permission_id)return answer('CURRENT_CAPABILITY_MISSING');
 if(x.personal_decision==='deny')return answer('CURRENT_PERSONAL_DENY');
 if(x.personal_decision!=='allow'&&x.role_enabled!==true)return answer('CURRENT_CAPABILITY_DENIED');
 if(!x.customer_id||x.customer_id!==customerId)return answer('CUSTOMER_OBJECT_MISSING');
 if(x.customer_status!=='active')return answer('CUSTOMER_NOT_ACTIVE');
 if(x.valid_capability_object_scope!==true)return answer('CAPABILITY_OBJECT_SCOPE_DENIED');
 return answer('INTERNAL_CUSTOMER_PHONE_SCOPE_ALLOW',true);
}
export async function checkCustomerPhoneScope(auth,token,operation,customerId){
 if(operation!=='customer.phone.manage')return answer('OTHER_ACTION_DEFER_DENY');
 if(!safeId(customerId))return answer('INVALID_CUSTOMER_ID');
 // New physical fingerprint; old F03-1 80-table verifier intentionally rejects this database.
 await verifyScopeDatabase(auth.pool);
 const out=await auth.withSession(token,async(c,a)=>checkCustomerPhoneScopeInTransaction(c,a,operation,customerId),{normalOnly:true});
 return out??answer('SESSION_OR_PC_ADMISSION_DENIED');
}
