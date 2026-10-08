// F02-G0 static fixture proof only: this is not the F02-1 DDL or F03 login handler.
const refuse=(ok,code)=>{if(!ok)throw Error('F02_G0_PC_'+code)};
export function validatePcRegistryFixture(accounts){
 const keys=new Set(),principals=new Set();
 for(const r of accounts){
  refuse(typeof r.normalized_login_key==='string'&&r.normalized_login_key.length>0,'EMPTY_LOGIN_KEY');
  refuse(typeof r.password_hash==='string'&&r.password_hash.length>0,'MISSING_HASH');
  refuse(r.principal_kind==='employee'||r.principal_kind==='system_admin','WRONG_PRINCIPAL_KIND');
  const hasEmp=r.employee_id!=null,hasAdmin=r.system_admin_id!=null;
  refuse(hasEmp!==hasAdmin,'XOR_PRINCIPAL_ID');
  refuse((r.principal_kind==='employee')===hasEmp,'KIND_FK_MISMATCH');
  const principal=(hasEmp?'employee:':'system_admin:')+(hasEmp?r.employee_id:r.system_admin_id);
  refuse(!keys.has(r.normalized_login_key),'GLOBAL_LOGIN_CONFLICT');
  refuse(!principals.has(principal),'MULTIPLE_PC_CREDENTIALS_PER_PRINCIPAL');
  keys.add(r.normalized_login_key);principals.add(principal);
 }
 return {accounts:accounts.length,uniqueLogins:keys.size,uniquePrincipals:principals.size};
}
