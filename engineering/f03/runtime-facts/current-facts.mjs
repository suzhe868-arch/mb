// F03-2-1A only. Trusted live facts reader behind existing F03-1 auth.
// It cannot grant business operations: SG-01 scope and object status are absent.
// No new schema, no new auth/session implementation, no business endpoint.
import {readFile} from 'node:fs/promises';
import {ACTIONS} from '../policy.mjs';
import {verifyAuthDatabase} from '../../src/f03-auth-readiness.mjs';
const contract=(await readFile(new URL('../permission-contract.tsv',import.meta.url),'utf8')).trimEnd().split(/\r?\n/).slice(1);
const sourceOf=new Map(contract.map(line=>{const [operation,,,,origin]=line.split('\t');return [operation,origin]}));
if(sourceOf.size!==45||Object.keys(ACTIONS).some(x=>!sourceOf.has(x)))throw Error('F03_2_1A_FROZEN_CONTRACT_DRIFT');
const validStringId=x=>typeof x==='string'&&/^[1-9][0-9]*$/.test(x)&&x.length<=20;
const deny=code=>Object.freeze({code,finalAllowed:false});
const trustedOps=Object.freeze(ACTIONS);
const sql=String.raw`
SELECT a.account_id::text AS account_id,a.principal_kind,
       a.employee_id::text AS account_employee_id,
       a.system_admin_id::text AS account_admin_id,
       a.credential_state,a.force_password_change,
       e.employee_id::text AS employee_id,e.employment_status,e.store_id::text AS store_id,
       e.main_role_id::text AS main_role_id,r.role_code,
       sa.system_admin_id::text AS system_admin_id,sa.account_status AS admin_status,
       requested.code AS requested_code,p.permission_id::text AS permission_id,
       d.enabled AS role_enabled,o.decision AS personal_decision
FROM public.pc_login_accounts a
LEFT JOIN public.employees e ON a.principal_kind='employee' AND e.employee_id=a.employee_id
LEFT JOIN public.roles r ON r.role_id=e.main_role_id
LEFT JOIN public.system_admins sa ON a.principal_kind='system_admin' AND sa.system_admin_id=a.system_admin_id
CROSS JOIN unnest($2::text[]) AS requested(code)
LEFT JOIN public.permissions p ON p.permission_code=requested.code
LEFT JOIN public.role_permission_defaults d ON d.role_id=e.main_role_id AND d.permission_id=p.permission_id
LEFT JOIN public.employee_permission_overrides o ON o.employee_id=e.employee_id AND o.permission_id=p.permission_id
WHERE a.account_id=$1::bigint
ORDER BY requested.code
`;
const invalidPrincipal=(a,row)=>{
 if(row.credential_state!=='enabled'||row.force_password_change===true)return true;
 if(a.principal_kind!==row.principal_kind||String(a.account_id)!==row.account_id)return true;
 if(row.principal_kind==='employee')return !validStringId(row.employee_id)||
   !validStringId(row.account_employee_id)||row.employee_id!==row.account_employee_id||
   a.employee_id!=row.employee_id||a.system_admin_id!==null||
   row.account_admin_id!==null||row.employment_status!=='active'||
   !validStringId(row.main_role_id)||!['sales','manager','store_manager','four_s'].includes(row.role_code);
 if(row.principal_kind==='system_admin')return !validStringId(row.system_admin_id)||
   !validStringId(row.account_admin_id)||row.system_admin_id!==row.account_admin_id||
   a.system_admin_id!=row.system_admin_id||a.employee_id!==null||
   row.account_employee_id!==null||row.admin_status!=='active'||row.role_code!==null;
 return true;
};
function interpret(rule,operation,raw,authAccount,caps){
 if(raw.length!==caps.length||new Set(raw.map(r=>r.requested_code)).size!==caps.length)return deny('INCOMPLETE_CURRENT_FACTS');
 if(raw.some(r=>invalidPrincipal(authAccount,r)||r.account_id!==String(authAccount.account_id)))return deny('CURRENT_PRINCIPAL_DENIED');
 const actor=raw[0],fourS=actor.role_code==='four_s',admin=actor.principal_kind==='system_admin';
 if(fourS&&(rule.hardDenyFourS||(!rule.allowFourS&&!rule.onlyFourS)))return deny('HARD_DENY_FOUR_S');
 if(rule.onlyFourS&&!fourS)return deny('FOUR_S_ONLY');
 if(admin&&rule.actor==='employee')return deny('SYSTEM_ADMIN_NO_BUSINESS_RIGHT');
 if(!admin&&rule.actor==='system_admin')return deny('EMPLOYEE_NO_SYSTEM_CONTROL');
 if(fourS){
  const pc=raw.find(r=>r.requested_code==='pc.four_s.vehicle.manage');
  if(!pc||pc.personal_decision!=='allow')return deny('FOUR_S_PC_ADMISSION_DENIED');
 }
 if(admin)return deny('SYSTEM_CONTROL_SCOPE_DEFER');
 const required=rule.cap;
 if(!Array.isArray(required)||required.length<1)return deny('MISSING_CAPABILITY_MAPPING');
 for(const cap of required){
  const row=raw.find(r=>r.requested_code===cap);
  if(!row?.permission_id)return deny('CAPABILITY_NOT_IN_CURRENT_CATALOG');
  if(row.personal_decision!=null&&!['allow','deny'].includes(row.personal_decision))return deny('INVALID_CURRENT_OVERRIDE');
  if(row.personal_decision==='deny')return deny('CURRENT_PERSONAL_DENY');
  if(row.personal_decision!=='allow'&&row.role_enabled!==true)return deny('NO_CURRENT_CAPABILITY');
 }
 // A-listed technical aliases are not approved operation grants even when a
 // physical permission happens to have a matching code.
 if(sourceOf.get(operation)?.includes('PENDING_A'))return deny('TECH_ALIAS_NOT_APPROVED');
 // Proof of a current permission never implies a capability-scoped grant
 // nor a valid current business object state: all final operations DEFER.
 return deny('CURRENT_CAPABILITY_PRESENT_SCOPE_AND_OBJECT_DEFER');
}
export async function readCurrentFacts(auth,token,operation){
 if(typeof operation!=='string'||!Object.hasOwn(trustedOps,operation))return deny('UNKNOWN_OR_RETIRED_OPERATION');
 const rule=trustedOps[operation];
 const caps=[...new Set([...(rule.cap||[]),...(rule.systemCap?[rule.systemCap]:[]),'pc.four_s.vehicle.manage'])].sort();
 if(!caps.every(x=>typeof x==='string'&&x.length>0))return deny('CAPABILITY_NOT_MAPPED');
 // Reuse the original F03-1 PG16 identity/version/seal/physical structure guard.
 // A read through a non-verified pool never qualifies as a trusted fact.
 await verifyAuthDatabase(auth.pool);
 const result=await auth.withSession(token,async(c,a)=>{
  const rows=(await c.query({text:sql,values:[a.account_id,caps]})).rows;
  return interpret(rule,operation,rows,a,caps);
 },{normalOnly:true});
 return result??deny('SESSION_OR_ADMISSION_DENIED');
}
