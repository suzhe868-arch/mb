import {createHash} from 'node:crypto';
import {assertEnvironment} from '../f05/crm-followup-ci/environment.mjs';
import {verifyScopeDatabase} from '../f03/runtime-scope/readiness.mjs';

const sha=x=>createHash('sha256').update(x).digest('hex');
const result=(status,code,extra={})=>({status,code,...extra});
const validId=x=>typeof x==='string'&&/^[1-9][0-9]{0,18}$/.test(x)&&BigInt(x)<=9223372036854775807n;
const validKey=x=>typeof x==='string'&&/^[A-Za-z0-9_-]{12,80}$/.test(x);
const allowedRoles=new Set(['sales','manager','store_manager']);
function normalizedContent(raw){
 if(typeof raw!=='string'||raw!==raw.trim()||!raw.isWellFormed?.()&&raw.isWellFormed!==undefined)return null;
 const content=raw.normalize('NFC');
 if(content.length<2||content.length>1000||/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f\ufffd]/u.test(content))return null;
 return content;
}
function normalizedSource(x){
 if(!x||typeof x!=='object'||Array.isArray(x)||Object.keys(x).some(k=>!['kind','reference'].includes(k))||!['manual','call','visit'].includes(x.kind))return null;
 if(x.reference!==undefined&&(typeof x.reference!=='string'||!/^[A-Za-z0-9_-]{3,40}$/.test(x.reference)))return null;
 return {kind:x.kind,...(x.reference===undefined?{}:{reference:x.reference})};
}
export class CrmFollowupService{
 constructor(auth,{beforeAuditInsert=null}={}){
  assertEnvironment();
  if(!auth||typeof auth.withSession!=='function')throw Error('CRM_AUTH_REQUIRED');
  if(beforeAuditInsert!==null&&process.env.F05_CRM_FAULTS!=='true')throw Error('CRM_TEST_HOOK_DENIED');
  this.auth=auth;this.beforeAuditInsert=beforeAuditInsert;
 }
 async _withCustomer({token,customerId},callback){
  if(!validId(customerId))return result(400,'INVALID_CUSTOMER_ID');
  if(typeof token!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(token))return result(401,'SESSION_INVALID');
  try{await verifyScopeDatabase(this.auth.pool)}catch{return result(503,'CRM_SCOPE_SOURCE_NOT_READY')}
  try{
   return await this.auth.withSession(token,async(c,a)=>{
    if(a.force_password_change!==false)return result(403,'FORCE_PASSWORD_CHANGE_REQUIRED');
    if(a.principal_kind!=='employee'||a.employee_id==null||a.system_admin_id!==null)return result(403,'EMPLOYEE_BUSINESS_ONLY');
    const actorId=String(a.employee_id);
    // F03 session holds PC account and session locks. Avoid employee row write locks:
    // permission and ownership writers are serialized by the concrete scope/customer locks.
    await c.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',['crm.followup.customer:'+customerId]);
    const employee=(await c.query('SELECT employment_status,main_role_id::text role_id,store_id::text store_id FROM public.employees WHERE employee_id=$1::bigint',[actorId])).rows[0];
    if(!employee||employee.employment_status!=='active')return result(403,'EMPLOYEE_INACTIVE');
    const role=(await c.query('SELECT role_code FROM public.roles WHERE role_id=$1::bigint FOR SHARE',[employee.role_id])).rows[0]?.role_code;
    if(!allowedRoles.has(role))return result(403,role==='four_s'?'FOUR_S_HARD_DENY':'ROLE_DENIED');
    const cust=(await c.query("SELECT account_status,current_owner_employee_id::text owner_id,owner_assignment_state FROM public.customers WHERE customer_id=$1::bigint FOR UPDATE",[customerId])).rows[0];
    if(!cust)return result(404,'CUSTOMER_NOT_FOUND');
    if(cust.account_status!=='active')return result(403,'CUSTOMER_INACTIVE');
    // A customer can retain a stale employee ID while assignment is pending. A
    // non-null owner is never sufficient authority for CRM append or scoped read.
    if(cust.owner_assignment_state!=='assigned')return result(403,'CUSTOMER_OWNER_NOT_ASSIGNED');
    if(!cust.owner_id)return result(403,'RESPONSIBLE_OWNER_MISSING');
    const owner=(await c.query('SELECT employment_status,main_role_id::text role_id,store_id::text store_id FROM public.employees WHERE employee_id=$1::bigint',[cust.owner_id])).rows[0];
    if(!owner||owner.employment_status!=='active')return result(403,'RESPONSIBLE_OWNER_NOT_ACTIVE');
    const ownerRole=(await c.query('SELECT role_code FROM public.roles WHERE role_id=$1::bigint FOR SHARE',[owner.role_id])).rows[0]?.role_code;
    if(!allowedRoles.has(ownerRole))return result(403,'RESPONSIBLE_OWNER_ROLE_DENIED');
    const perm=(await c.query("SELECT permission_id::text id FROM public.permissions WHERE permission_code='crm.followup.create' FOR SHARE")).rows;
    if(perm.length!==1)return result(403,'CRM_WRITE_PERMISSION_NOT_CONNECTED');
    const permissionId=perm[0].id;
    const scopes=(await c.query(
     "SELECT s.scope_id::text id FROM public.employee_data_scopes s JOIN public.employee_capability_scope_bindings b ON b.scope_id=s.scope_id AND b.employee_id=s.employee_id "+
     "WHERE s.employee_id=$1::bigint AND b.employee_id=$1::bigint AND b.permission_id=$2::bigint AND s.scope_kind='object' AND s.scope_reference_id=$3::bigint "+
     "AND (s.ended_at IS NULL OR s.ended_at>transaction_timestamp()) AND b.granted_at<=transaction_timestamp() "+
     "AND (b.ended_at IS NULL OR b.ended_at>transaction_timestamp()) ORDER BY s.scope_id FOR UPDATE OF s,b",[actorId,permissionId,customerId])).rows;
    if(!scopes.length)return result(403,'CURRENT_CUSTOMER_SCOPE_DENIED');
    const roleDefault=(await c.query('SELECT enabled FROM public.role_permission_defaults WHERE role_id=$1::bigint AND permission_id=$2::bigint FOR SHARE',[employee.role_id,permissionId])).rows[0];
    const personal=(await c.query('SELECT decision FROM public.employee_permission_overrides WHERE employee_id=$1::bigint AND permission_id=$2::bigint FOR SHARE',[actorId,permissionId])).rows[0]?.decision;
    if(personal==='deny')return result(403,'PERSONAL_DENY');
    if(personal!=='allow'&&roleDefault?.enabled!==true)return result(403,'CRM_WRITE_CAPABILITY_DENIED');
    // Owner is authoritative for the responsible field. A manager needs current explicit
    // object scope and same current store, not merely a role label. Collaboration must
    // carry an explicit scoped write fact and remain live.
    if(actorId!==cust.owner_id){
     if(employee.store_id===null||owner.store_id===null||employee.store_id!==owner.store_id)return result(403,'CROSS_STORE_DENIED');
     if(role==='sales'){
      const collab=(await c.query(
       "SELECT collaboration_id FROM public.customer_collaborations WHERE customer_id=$1::bigint AND employee_id=$2::bigint "+
       "AND (ended_at IS NULL OR ended_at>transaction_timestamp()) AND scope_json->>'crm_followup_write'='true' ORDER BY collaboration_id FOR UPDATE",
       [customerId,actorId])).rows;
      if(!collab.length)return result(403,'CURRENT_OWNER_OR_COLLAB_REQUIRED');
     }
    }
    return callback(c,{actorId,customerId,ownerId:cust.owner_id,scopeId:scopes[0].id,role});
   },{normalOnly:true})??result(401,'SESSION_OR_PC_ADMISSION_DENIED');
  }catch{return result(503,'CRM_TRANSACTION_FAILED')}
 }
 async append({token,customerId,content,businessDemandId=null,source,requestKey}){
  const body=normalizedContent(content),sourceFact=normalizedSource(source);
  if(body===null||sourceFact===null||!validKey(requestKey)||!(businessDemandId===null||validId(businessDemandId)))return result(400,'INVALID_FOLLOWUP_PAYLOAD');
  return this._withCustomer({token,customerId},async(c,context)=>{
   const keySha=sha(requestKey);
   await c.query('SELECT pg_advisory_xact_lock(hashtextextended($1,1))',['crm.followup.request-key:'+requestKey]);
   const digest=sha(JSON.stringify({customerId,body,businessDemandId,sourceFact}));
   const prev=(await c.query(
    "SELECT actor_id,object_id,role_context,after_json FROM public.audit_events WHERE action='crm.followup.create' "+
    "AND role_context->>'source'='CI_ONLY_F05_CRM_FOLLOWUP_APPEND' AND role_context->>'requestKeySha256'=$1 ORDER BY audit_id LIMIT 1 FOR SHARE",[keySha])).rows[0];
   if(prev){
    if(prev.actor_id!==context.actorId||prev.role_context?.customerId!==customerId||prev.role_context?.digest!==digest)return result(409,'IDEMPOTENCY_KEY_CONFLICT');
    const saved=prev.after_json?.result;
    if(!saved||saved.status!==201||saved.followupId!==prev.object_id)throw Error('CRM_REPLAY_AUDIT_BROKEN');
    return saved;
   }
   if(businessDemandId!==null){
    const demand=(await c.query('SELECT customer_id::text customer_id FROM public.demands WHERE demand_id=$1::bigint FOR SHARE',[businessDemandId])).rows[0];
    if(!demand||demand.customer_id!==customerId)return result(403,'DEMAND_CUSTOMER_MISMATCH');
   }
   // The locked Customer serializes independent appends, preserving historical timestamps.
   const inserted=(await c.query(
    "INSERT INTO public.crm_followups(customer_id,responsible_employee_id,actor_employee_id,occurred_at,content,business_demand_id,source_context_json) "+
    "VALUES($1::bigint,$2::bigint,$3::bigint,GREATEST(transaction_timestamp(), "+
    "COALESCE((SELECT max(occurred_at)+interval '1 microsecond' FROM public.crm_followups WHERE customer_id=$1::bigint),transaction_timestamp())), "+
    "$4,$5::bigint,$6::jsonb) RETURNING followup_id::text id,occurred_at",
    [customerId,context.ownerId,context.actorId,body,businessDemandId,JSON.stringify({...sourceFact,ciOnly:true})])).rows[0];
   const response=result(201,'CREATED',{customerId,followupId:inserted.id,actorEmployeeId:context.actorId,
    responsibleEmployeeId:context.ownerId,businessDemandId,occurredAt:new Date(inserted.occurred_at).toISOString()});
   if(this.beforeAuditInsert)await this.beforeAuditInsert({c,customerId,followupId:inserted.id,context});
   await c.query(
    "INSERT INTO public.audit_events(actor_kind,actor_id,role_context,object_kind,object_id,action,before_json,after_json,occurred_at) "+
    "VALUES('employee',$1,$2::jsonb,'crm_followup',$3,'crm.followup.create',NULL,$4::jsonb,transaction_timestamp())",
    [context.actorId,JSON.stringify({source:'CI_ONLY_F05_CRM_FOLLOWUP_APPEND',permission:'CI_ONLY_SYNTHETIC_PERMISSION',
     customerId,requestKeySha256:keySha,digest,scopeId:context.scopeId,role:context.role,sourceKind:sourceFact.kind}),
     inserted.id,JSON.stringify({result:response})]);
   return response;
  });
 }
 async read({token,customerId,followupId}){
  if(!validId(followupId))return result(400,'INVALID_FOLLOWUP_ID');
  return this._withCustomer({token,customerId},async(c)=>{
   const row=(await c.query(
    'SELECT followup_id::text id,customer_id::text customer_id,responsible_employee_id::text responsible_employee_id,'+
    'actor_employee_id::text actor_employee_id,occurred_at,content,business_demand_id::text demand_id,source_context_json '+
    'FROM public.crm_followups WHERE followup_id=$1::bigint AND customer_id=$2::bigint FOR SHARE',[followupId,customerId])).rows[0];
   if(!row)return result(404,'FOLLOWUP_NOT_FOUND');
   return result(200,'OK',{followupId:row.id,customerId,actorEmployeeId:row.actor_employee_id,
    responsibleEmployeeId:row.responsible_employee_id,occurredAt:new Date(row.occurred_at).toISOString(),
    content:row.content,businessDemandId:row.demand_id,source:{kind:row.source_context_json?.kind,reference:row.source_context_json?.reference??null}});
  });
 }

 // Read-only Customer timeline. All current PC/Employee/Scope/Owner/Customer
 // checks execute inside the original _withCustomer transaction and Customer row lock.
 async list({token,customerId,limit=20,beforeFollowupId=null}){
  if(!Number.isInteger(limit)||limit<1||limit>50)return result(400,'INVALID_TIMELINE_LIMIT');
  if(beforeFollowupId!==null&&!validId(beforeFollowupId))return result(400,'INVALID_TIMELINE_CURSOR');
  return this._withCustomer({token,customerId},async(c)=>{
   const rows=(await c.query(
    "SELECT followup_id::text id,customer_id::text customer_id,"+
    "actor_employee_id::text actor_id,responsible_employee_id::text owner_id,"+
    "occurred_at,content,business_demand_id::text demand_id,source_context_json source "+
    "FROM public.crm_followups WHERE customer_id=$1::bigint "+
    "AND ($2::bigint IS NULL OR followup_id<$2::bigint) "+
    "ORDER BY followup_id DESC LIMIT $3::integer",
    [customerId,beforeFollowupId,limit+1])).rows;
   const hasMore=rows.length>limit,selected=rows.slice(0,limit);
   const items=selected.map(row=>{
    // Earlier, imported facts may contain arbitrary JSON: never spread or echo it.
    const source=row.source&&typeof row.source==='object'&&!Array.isArray(row.source)?row.source:{};
    const kind=['manual','call','visit'].includes(source.kind)?source.kind:null;
    const reference=kind!==null&&typeof source.reference==='string'&&
     /^[A-Za-z0-9_-]{3,40}$/.test(source.reference)?source.reference:null;
    return {followupId:row.id,customerId,actorEmployeeId:row.actor_id,
     responsibleEmployeeId:row.owner_id,occurredAt:new Date(row.occurred_at).toISOString(),
     content:row.content,businessDemandId:row.demand_id,source:{kind,reference}};
   });
   return result(200,'OK',{customerId,items,hasMore,
    nextBeforeFollowupId:hasMore&&items.length?items.at(-1).followupId:null});
  });
 }
}
