import {createCipheriv,createDecipheriv,createHash,randomBytes} from 'node:crypto';
import {verifyScopeDatabase} from '../f03/runtime-scope/readiness.mjs';
import {checkCustomerPhoneScopeInTransaction} from '../f03/runtime-scope/customer-phone-guard.mjs';
import {assertEnvironment} from '../f03/customer-other-phone/environment.mjs';

const ROLES=new Set(['sales','manager','store_manager']);
const result=(status,code,extra={})=>({status,code,...extra});
const safeId=x=>typeof x==='string'&&/^[1-9]\d{0,18}$/.test(x)&&BigInt(x)<=9223372036854775807n;
const validRequestKey=x=>typeof x==='string'&&/^[A-Za-z0-9_-]{12,80}$/.test(x);
const sha=x=>createHash('sha256').update(x).digest('hex');
function normalizePhone(value){
 if(typeof value!=='string'||value.length>15||!/^[0-9]+$/.test(value))return null;
 if(/^1[3-9]\d{9}$/.test(value)||/^0\d{2,3}\d{7,8}$/.test(value))return value;
 return null;
}
function maskPhone(value){return value.slice(0,3)+'*'.repeat(Math.max(1,value.length-7))+value.slice(-4)}
function encryptPhone(value,key){
 const nonce=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,nonce);
 const encrypted=Buffer.concat([cipher.update(value,'utf8'),cipher.final()]);
 return Buffer.concat([Buffer.from([1]),nonce,cipher.getAuthTag(),encrypted]);
}
function decryptPhone(envelope,key){
 if(!Buffer.isBuffer(envelope)||envelope.length<30||envelope[0]!==1)return null;
 try{
  const nonce=envelope.subarray(1,13),tag=envelope.subarray(13,29),body=envelope.subarray(29);
  const decipher=createDecipheriv('aes-256-gcm',key,nonce);decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(body),decipher.final()]).toString('utf8');
 }catch{return null}
}
const validKeyBuffer=k=>Buffer.isBuffer(k)&&k.length===32;

export class CustomerOtherPhoneService{
 constructor(auth,{key,beforeAuditInsert=null,forceReplacementInsertFailure=false}={}){
  assertEnvironment();
  if(!auth||typeof auth.withSession!=='function'||!validKeyBuffer(key))throw Error('CUSTOMER_PHONE_DEPENDENCIES_REQUIRED');
  if(typeof forceReplacementInsertFailure!=='boolean')throw Error('CUSTOMER_PHONE_TEST_HOOK_FORBIDDEN');
  if((beforeAuditInsert!==null||forceReplacementInsertFailure)&&process.env.F03_CUSTOMER_PHONE_TEST_FAULTS!=='true')throw Error('CUSTOMER_PHONE_TEST_HOOK_FORBIDDEN');
  this.auth=auth;this.key=Buffer.from(key);this.beforeAuditInsert=beforeAuditInsert;
  this.forceReplacementInsertFailure=forceReplacementInsertFailure;
 }
 async _withCustomer({token,customerId},fn){
  if(!safeId(customerId))return result(400,'INVALID_CUSTOMER_ID');
  if(typeof token!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(token))return result(401,'SESSION_INVALID');
  try{await verifyScopeDatabase(this.auth.pool)}catch{return result(503,'CUSTOMER_PHONE_RUNTIME_NOT_READY')}
  try{
   const out=await this.auth.withSession(token,async(c,a)=>{
    if(a.principal_kind!=='employee'||a.system_admin_id!==null||!safeId(String(a.employee_id??'')))return result(403,'EMPLOYEE_BUSINESS_IDENTITY_REQUIRED');
    const employeeId=String(a.employee_id);
    // The session layer has already locked pc_login_accounts. Do not take an employees row lock here:
    // the existing F03 permission writer locks employees before pc_login_accounts. Taking employees
    // FOR UPDATE now would invert that order and recreate an account/employee deadlock.
    // Capability revocation is serialized below by the actual Scope/Binding and existing decision rows.
    await c.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',['customer.phone.manage:'+customerId]);
    const employee=(await c.query("SELECT e.employee_id::text employee_id,e.employment_status,e.main_role_id::text main_role_id FROM public.employees e WHERE e.employee_id=$1::bigint",[employeeId])).rows[0];
    if(!employee||employee.employment_status!=='active')return result(403,'CURRENT_EMPLOYEE_DENIED');
    const role=(await c.query('SELECT role_code FROM public.roles WHERE role_id=$1::bigint FOR SHARE',[employee.main_role_id])).rows[0];
    if(!role||!ROLES.has(role.role_code))return result(403,role?.role_code==='four_s'?'FOUR_S_HARD_DENY':'CURRENT_ROLE_DENIED');
    const customer=(await c.query('SELECT account_status FROM public.customers WHERE customer_id=$1::bigint FOR UPDATE',[customerId])).rows[0];
    if(!customer)return result(404,'CUSTOMER_NOT_FOUND');
    if(customer.account_status!=='active')return result(403,'CUSTOMER_NOT_ACTIVE');
    const permission=(await c.query("SELECT permission_id::text permission_id FROM public.permissions WHERE permission_code='customer.phone.manage' FOR SHARE")).rows;
    if(permission.length!==1)return result(403,'CURRENT_CAPABILITY_MISSING');
    const scopes=(await c.query(
     "SELECT s.scope_id::text scope_id FROM public.employee_data_scopes s JOIN public.employee_capability_scope_bindings b "+
     "ON b.scope_id=s.scope_id AND b.employee_id=s.employee_id WHERE s.employee_id=$1::bigint AND b.employee_id=$1::bigint "+
     "AND b.permission_id=$2::bigint AND s.scope_kind='object' AND s.scope_reference_id=$3::bigint "+
     "AND (s.ended_at IS NULL OR s.ended_at>transaction_timestamp()) AND b.granted_at<=transaction_timestamp() "+
     "AND (b.ended_at IS NULL OR b.ended_at>transaction_timestamp()) ORDER BY s.scope_id FOR UPDATE OF s,b",
     [employeeId,permission[0].permission_id,customerId])).rows;
    if(scopes.length===0)return result(403,'CAPABILITY_OBJECT_SCOPE_DENIED');
    // Keep the same mutation lock order as the existing F03 writer: Scope/Binding first,
    // then role default and personal override. Row locks avoid a database-wide write lock.
    // A missing override row is serialized against application writers by the account lock
    // already held by withSession; existing override rows are locked explicitly here.
    await c.query(
     'SELECT enabled FROM public.role_permission_defaults WHERE role_id=$1::bigint AND permission_id=$2::bigint FOR SHARE',
     [employee.main_role_id,permission[0].permission_id]);
    await c.query(
     'SELECT decision FROM public.employee_permission_overrides WHERE employee_id=$1::bigint AND permission_id=$2::bigint FOR SHARE',
     [employeeId,permission[0].permission_id]);
    const decision=await checkCustomerPhoneScopeInTransaction(c,a,'customer.phone.manage',customerId);
    if(!decision.allowed)return result(403,decision.code);
    return await fn(c,{employeeId,customerId,scopeId:scopes[0].scope_id,roleCode:role.role_code});
   },{normalOnly:true});
   return out??result(401,'SESSION_OR_PC_ADMISSION_DENIED');
  }catch{return result(503,'CUSTOMER_PHONE_TRANSACTION_UNAVAILABLE')}
 }
 async _activeRows(c,customerId){
  const rows=(await c.query("SELECT phone_fact_id::text phone_fact_id,phone_ciphertext,valid_from,ended_at FROM public.customer_phone_facts WHERE customer_id=$1::bigint AND ended_at IS NULL ORDER BY phone_fact_id FOR UPDATE",[customerId])).rows;
  return rows.map(row=>{
   const phone=decryptPhone(row.phone_ciphertext,this.key);
   if(!phone)throw Error('CUSTOMER_PHONE_CIPHERTEXT_INVALID');
   return {...row,phone,maskedPhone:maskPhone(phone)};
  });
 }
 async _replay(c,employeeId,customerId,requestKey,requestDigest){
  const keyHash=sha(requestKey);
  const rows=(await c.query(
   "SELECT role_context,after_json FROM public.audit_events WHERE actor_kind='employee' AND actor_id=$1::text "+
   "AND role_context->>'customerId'=$2 AND role_context->>'requestKeySha256'=$3 "+
   "AND action IN ('customer.phone.manage.add','customer.phone.manage.replace','customer.phone.manage.end') "+
   "ORDER BY audit_id LIMIT 1",[employeeId,customerId,keyHash])).rows;
  if(rows.length===0)return null;
  const context=rows[0].role_context??{};
  if(context.requestDigestSha256!==requestDigest)return result(409,'IDEMPOTENCY_KEY_CONFLICT');
  const stored=rows[0].after_json?.result;
  if(!stored||typeof stored!=='object')throw Error('CUSTOMER_PHONE_IDEMPOTENCY_EVIDENCE_INVALID');
  return stored;
 }
 async _audit(c,context,action,objectId,before,after){
  if(this.beforeAuditInsert)await this.beforeAuditInsert({action,customerId:context.customerId});
  const roleContext={
   capability:'customer.phone.manage',scopeId:context.scopeId,customerId:context.customerId,
   actorEmployeeId:context.employeeId,operation:context.operation,requestKeySha256:context.requestKeySha256,
   requestDigestSha256:context.requestDigestSha256,reason:'CI_ONLY_F03_CUSTOMER_PHONE_MANAGE'
  };
  await c.query(
   "INSERT INTO public.audit_events(actor_kind,actor_id,role_context,object_kind,object_id,action,before_json,after_json,occurred_at) "+
   "VALUES('employee',$1::text,$2::jsonb,'customer_phone_fact',$3::text,$4,$5::jsonb,$6::jsonb,transaction_timestamp())",
   [context.employeeId,JSON.stringify(roleContext),objectId,action,before===null?null:JSON.stringify(before),JSON.stringify({...after,result:context.response})]);
 }
 async list({token,customerId}){
  return this._withCustomer({token,customerId},async(c)=>{
   const rows=await this._activeRows(c,customerId);
   return result(200,'OK',{customerId,phones:rows.map(x=>({phoneFactId:x.phone_fact_id,maskedPhone:x.maskedPhone,validFrom:new Date(x.valid_from).toISOString()}))});
  });
 }
 async add({token,customerId,phoneNumber,requestKey}){
  const normalized=normalizePhone(phoneNumber);
  if(!normalized)return result(400,'INVALID_PHONE_NUMBER');
  if(!validRequestKey(requestKey))return result(400,'INVALID_IDEMPOTENCY_KEY');
  return this._withCustomer({token,customerId},async(c,context)=>{
   const digest=sha(JSON.stringify({operation:'add',customerId,phone:normalized}));
   const replay=await this._replay(c,context.employeeId,customerId,requestKey,digest);if(replay)return replay;
   const active=await this._activeRows(c,customerId);
   if(active.some(x=>x.phone===normalized))return result(409,'DUPLICATE_ACTIVE_PHONE');
   const inserted=(await c.query(
    'INSERT INTO public.customer_phone_facts(customer_id,phone_ciphertext,valid_from,ended_at) VALUES($1::bigint,$2::bytea,transaction_timestamp(),NULL) RETURNING phone_fact_id::text phone_fact_id,valid_from',
    [customerId,encryptPhone(normalized,this.key)])).rows[0];
   const response=result(200,'OK',{customerId,phoneFactId:inserted.phone_fact_id,maskedPhone:maskPhone(normalized),validFrom:new Date(inserted.valid_from).toISOString(),active:true});
   context.operation='add';context.requestKeySha256=sha(requestKey);context.requestDigestSha256=digest;context.response=response;
   await this._audit(c,context,'customer.phone.manage.add',inserted.phone_fact_id,null,{customerId,phoneFactId:inserted.phone_fact_id,maskedPhone:response.maskedPhone,active:true});
   return response;
  });
 }
 async replace({token,customerId,phoneFactId,phoneNumber,requestKey}){
  if(!safeId(phoneFactId))return result(400,'INVALID_PHONE_FACT_ID');
  const normalized=normalizePhone(phoneNumber);
  if(!normalized)return result(400,'INVALID_PHONE_NUMBER');
  if(!validRequestKey(requestKey))return result(400,'INVALID_IDEMPOTENCY_KEY');
  return this._withCustomer({token,customerId},async(c,context)=>{
   const digest=sha(JSON.stringify({operation:'replace',customerId,phoneFactId,phone:normalized}));
   const replay=await this._replay(c,context.employeeId,customerId,requestKey,digest);if(replay)return replay;
   const active=await this._activeRows(c,customerId);
   const old=active.find(x=>x.phone_fact_id===phoneFactId);
   if(!old)return result(404,'PHONE_FACT_NOT_FOUND_OR_INACTIVE');
   if(old.phone===normalized)return result(409,'PHONE_UNCHANGED');
   if(active.some(x=>x.phone_fact_id!==phoneFactId&&x.phone===normalized))return result(409,'DUPLICATE_ACTIVE_PHONE');
   const ended=(await c.query(
    'UPDATE public.customer_phone_facts SET ended_at=transaction_timestamp() WHERE phone_fact_id=$1::bigint AND customer_id=$2::bigint AND ended_at IS NULL RETURNING ended_at',
    [phoneFactId,customerId])).rows[0];
   if(!ended)return result(409,'PHONE_FACT_CONCURRENTLY_ENDED');
   // Test-only fault sends NULL through the real INSERT so PostgreSQL raises the NOT NULL
   // violation after the old fact has been ended; withSession must roll the whole transaction back.
   const replacementCiphertext=this.forceReplacementInsertFailure?null:encryptPhone(normalized,this.key);
   const inserted=(await c.query(
    'INSERT INTO public.customer_phone_facts(customer_id,phone_ciphertext,valid_from,ended_at) VALUES($1::bigint,$2::bytea,transaction_timestamp(),NULL) RETURNING phone_fact_id::text phone_fact_id,valid_from',
    [customerId,replacementCiphertext])).rows[0];
   const response=result(200,'OK',{customerId,previousPhoneFactId:phoneFactId,phoneFactId:inserted.phone_fact_id,maskedPhone:maskPhone(normalized),validFrom:new Date(inserted.valid_from).toISOString(),active:true});
   context.operation='replace';context.requestKeySha256=sha(requestKey);context.requestDigestSha256=digest;context.response=response;
   await this._audit(c,context,'customer.phone.manage.replace',inserted.phone_fact_id,
    {customerId,phoneFactId:phoneFactId,maskedPhone:old.maskedPhone,active:true},
    {customerId,previousPhoneFactId:phoneFactId,phoneFactId:inserted.phone_fact_id,maskedPhone:response.maskedPhone,active:true,previousEndedAt:new Date(ended.ended_at).toISOString()});
   return response;
  });
 }
 async end({token,customerId,phoneFactId,requestKey}){
  if(!safeId(phoneFactId))return result(400,'INVALID_PHONE_FACT_ID');
  if(!validRequestKey(requestKey))return result(400,'INVALID_IDEMPOTENCY_KEY');
  return this._withCustomer({token,customerId},async(c,context)=>{
   const digest=sha(JSON.stringify({operation:'end',customerId,phoneFactId}));
   const replay=await this._replay(c,context.employeeId,customerId,requestKey,digest);if(replay)return replay;
   const active=await this._activeRows(c,customerId);
   const old=active.find(x=>x.phone_fact_id===phoneFactId);
   if(!old)return result(404,'PHONE_FACT_NOT_FOUND_OR_INACTIVE');
   const ended=(await c.query(
    'UPDATE public.customer_phone_facts SET ended_at=transaction_timestamp() WHERE phone_fact_id=$1::bigint AND customer_id=$2::bigint AND ended_at IS NULL RETURNING ended_at',
    [phoneFactId,customerId])).rows[0];
   if(!ended)return result(409,'PHONE_FACT_CONCURRENTLY_ENDED');
   const response=result(200,'OK',{customerId,phoneFactId,maskedPhone:old.maskedPhone,endedAt:new Date(ended.ended_at).toISOString(),active:false});
   context.operation='end';context.requestKeySha256=sha(requestKey);context.requestDigestSha256=digest;context.response=response;
   await this._audit(c,context,'customer.phone.manage.end',phoneFactId,
    {customerId,phoneFactId,maskedPhone:old.maskedPhone,active:true},
    {customerId,phoneFactId,maskedPhone:old.maskedPhone,active:false,endedAt:response.endedAt});
   return response;
  });
 }
}
