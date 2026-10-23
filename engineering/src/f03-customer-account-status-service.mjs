import {createHash} from 'node:crypto';
import {assertEnvironment} from '../f03/customer-account-status/environment.mjs';
import {verify} from '../f03/customer-account-status/schema.mjs';

const hash=text=>createHash('sha256').update(text).digest('hex');
const out=(status,code,extra={})=>({status,code,...extra});
const id=x=>typeof x==='string'&&/^[1-9][0-9]{0,18}$/.test(x)&&BigInt(x)<=9223372036854775807n;
const reqKey=x=>typeof x==='string'&&/^[A-Za-z0-9_-]{12,80}$/.test(x);
const roles=new Set(['sales','manager','store_manager']);
function validReason(reason){return typeof reason==='string'&&reason===reason.trim()&&reason.length>=8&&reason.length<=256&&!/[\x00-\x1f\x7f]/.test(reason)}
export class CustomerAccountStatusService{
 constructor(auth,{beforeAuditInsert=null}={}){
  assertEnvironment();
  if(!auth||typeof auth.withSession!=='function')throw Error('ACCOUNT_STATUS_AUTH_REQUIRED');
  if(beforeAuditInsert!==null&&process.env.F03_ACCOUNT_STATUS_FAULTS!=='true')throw Error('ACCOUNT_STATUS_FAULT_HOOK_DENIED');
  this.auth=auth;this.beforeAuditInsert=beforeAuditInsert;
 }
 async _permission(c,a,customerId){
  if(a.principal_kind==='system_admin'){
   if(a.system_admin_id==null||a.employee_id!==null)return out(403,'CONTROL_PLANE_IDENTITY_INVALID');
   return {allowed:true,actorKind:'system_admin',actorId:String(a.system_admin_id),scopeId:null,role:'system_admin'};
  }
  if(a.principal_kind!=='employee'||a.employee_id==null||a.system_admin_id!==null)return out(403,'MIXED_OR_UNKNOWN_PRINCIPAL_DENIED');
  const employeeId=String(a.employee_id);
  const employee=(await c.query('SELECT employment_status,main_role_id::text AS role_id FROM public.employees WHERE employee_id=$1::bigint',[employeeId])).rows[0];
  if(!employee||employee.employment_status!=='active')return out(403,'INACTIVE_EMPLOYEE_DENIED');
  const role=(await c.query('SELECT role_code FROM public.roles WHERE role_id=$1::bigint FOR SHARE',[employee.role_id])).rows[0]?.role_code;
  if(role==='four_s')return out(403,'FOUR_S_HARD_DENY');
  if(!roles.has(role))return out(403,'UNAUTHORIZED_ROLE');
  const perm=(await c.query("SELECT permission_id::text AS id FROM public.permissions WHERE permission_code='customer.account.disable' FOR SHARE")).rows;
  if(perm.length!==1)return out(403,'CAPABILITY_MISSING');
  const permissionId=perm[0].id;
  const scope=(await c.query(
   "SELECT s.scope_id::text AS id FROM public.employee_data_scopes s JOIN public.employee_capability_scope_bindings b "+
   "ON b.scope_id=s.scope_id AND b.employee_id=s.employee_id "+
   "WHERE s.employee_id=$1::bigint AND b.employee_id=$1::bigint AND b.permission_id=$2::bigint "+
   "AND s.scope_kind='object' AND s.scope_reference_id=$3::bigint "+
   "AND (s.ended_at IS NULL OR s.ended_at>transaction_timestamp()) "+
   "AND b.granted_at<=transaction_timestamp() AND (b.ended_at IS NULL OR b.ended_at>transaction_timestamp()) "+
   "ORDER BY s.scope_id FOR UPDATE OF s,b",[employeeId,permissionId,customerId])).rows;
  if(scope.length===0)return out(403,'CUSTOMER_OBJECT_SCOPE_DENIED');
  const defaults=(await c.query('SELECT enabled FROM public.role_permission_defaults WHERE role_id=$1::bigint AND permission_id=$2::bigint FOR SHARE',[employee.role_id,permissionId])).rows[0];
  const personal=(await c.query('SELECT decision FROM public.employee_permission_overrides WHERE employee_id=$1::bigint AND permission_id=$2::bigint FOR SHARE',[employeeId,permissionId])).rows[0]?.decision;
  if(personal==='deny')return out(403,'PERSONAL_DENY');
  if(role==='sales'&&personal!=='allow')return out(403,'SALES_NEEDS_EXPLICIT_ALLOW');
  if(personal!=='allow'&&defaults?.enabled!==true)return out(403,'CAPABILITY_DENIED');
  return {allowed:true,actorKind:'employee',actorId:employeeId,scopeId:scope[0].id,role};
 }
 async _run({token,customerId,action,reason,requestKey}){
  if(!id(customerId))return out(400,'INVALID_CUSTOMER_ID');
  if(action!=='read'&&action!=='disable'&&action!=='restore')return out(400,'UNKNOWN_ACTION');
  if(action!=='read'&&(!validReason(reason)||!reqKey(requestKey)))return out(400,'INVALID_REASON_OR_REQUEST_KEY');
  if(typeof token!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(token))return out(401,'SESSION_INVALID');
  try{await verify(this.auth.pool)}catch{return out(503,'ACCOUNT_STATUS_RUNTIME_NOT_READY')}
  try{
   return await this.auth.withSession(token,async(c,a)=>{
    // withSession holds PC account then session locks; all business row locks follow.
    await c.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',['customer.account.status:'+customerId]);
    const customer=(await c.query('SELECT customer_id::text AS id,account_status FROM public.customers WHERE customer_id=$1::bigint FOR UPDATE',[customerId])).rows[0];
    if(!customer)return out(404,'CUSTOMER_NOT_FOUND');
    const actor=await this._permission(c,a,customerId);
    if(!actor.allowed)return actor;
    if(!['active','inactive'].includes(customer.account_status))return out(409,'CUSTOMER_STATE_UNSUPPORTED');
    const demandQuery="SELECT demand_id::text AS id,demand_state FROM public.demands WHERE customer_id=$1::bigint ORDER BY demand_id FOR UPDATE";
    const demands=(await c.query(demandQuery,[customerId])).rows;
    if(action==='read'){
     return out(200,'OK',{customerId,accountStatus:customer.account_status,
      demandCounts:Object.fromEntries(['active','paused','completed','cancelled'].map(k=>[k,demands.filter(d=>d.demand_state===k).length]))});
    }
    const keyHash=hash(requestKey),payloadHash=hash(JSON.stringify({action,customerId,reason}));
    // Request-key uniqueness is database enforced; the per-customer advisory lock serializes replay.
    const previous=(await c.query('SELECT * FROM f03_account_status_ci.request_keys WHERE request_key_sha256=$1 FOR SHARE',[keyHash])).rows[0];
    if(previous){
     if(previous.payload_sha256!==payloadHash||previous.customer_id.toString()!==customerId||previous.action!==action||
       previous.actor_kind!==actor.actorKind||previous.actor_id!==actor.actorId)return out(409,'IDEMPOTENCY_KEY_CONFLICT');
     return previous.result;
    }
    const target=action==='disable'?'inactive':'active';
    if(customer.account_status===target){
     if(action==='disable'&&demands.some(d=>d.demand_state==='active'))return out(409,'INACTIVE_CUSTOMER_HAS_ACTIVE_DEMAND');
     return out(200,'NO_CHANGE',{customerId,accountStatus:target,pausedDemandCount:0});
    }
    const paused=action==='disable'?demands.filter(d=>d.demand_state==='active').map(d=>d.id):[];
    const changed=(await c.query('UPDATE public.customers SET account_status=$2 WHERE customer_id=$1::bigint AND account_status=$3 RETURNING customer_id',[customerId,target,customer.account_status])).rowCount;
    if(changed!==1)throw Error('CUSTOMER_STATUS_CAS_FAILED');
    if(paused.length){
     const updated=await c.query("UPDATE public.demands SET demand_state='paused' WHERE customer_id=$1::bigint AND demand_id=ANY($2::bigint[]) AND demand_state='active' RETURNING demand_id",[customerId,paused]);
     if(updated.rowCount!==paused.length)throw Error('DEMAND_PAUSE_NOT_ATOMIC');
    }
    const response=out(200,'OK',{customerId,accountStatus:target,pausedDemandCount:paused.length,pausedDemandIds:paused});
    const context={source:'CI_ONLY_F03_CUSTOMER_ACCOUNT_STATUS',requestKeySha256:keyHash,payloadSha256:payloadHash,
     capability:actor.actorKind==='employee'?'customer.account.disable':'SYSTEM_ADMIN_CONTROL_ONLY',scopeId:actor.scopeId,
     roleAtTime:actor.role,reason};
    if(this.beforeAuditInsert)await this.beforeAuditInsert({c,customerId,actor,action});
    await c.query("INSERT INTO public.audit_events(actor_kind,actor_id,role_context,object_kind,object_id,action,before_json,after_json,occurred_at) "+
     "VALUES($1,$2,$3::jsonb,'Customer',$4,$5,$6::jsonb,$7::jsonb,transaction_timestamp())",
     [actor.actorKind,actor.actorId,JSON.stringify(context),customerId,'customer.account.'+action,
      JSON.stringify({accountStatus:customer.account_status}),
      JSON.stringify({accountStatus:target,pausedDemandIds:paused,pausedDemandCount:paused.length})]);
    for(const demandId of paused)await c.query(
     "INSERT INTO public.audit_events(actor_kind,actor_id,role_context,object_kind,object_id,action,before_json,after_json,occurred_at) VALUES($1,$2,$3::jsonb,'Demand',$4,'customer.account.disable.demand_pause',$5::jsonb,$6::jsonb,transaction_timestamp())",
     [actor.actorKind,actor.actorId,JSON.stringify({source:context.source,customerId,requestKeySha256:keyHash}),demandId,
      JSON.stringify({demandState:'active'}),JSON.stringify({demandState:'paused'})]);
    await c.query('INSERT INTO f03_account_status_ci.request_keys(request_key_sha256,payload_sha256,customer_id,actor_kind,actor_id,action,result) VALUES($1,$2,$3::bigint,$4,$5,$6,$7::jsonb)',
     [keyHash,payloadHash,customerId,actor.actorKind,actor.actorId,action,JSON.stringify(response)]);
    return response;
   },{normalOnly:true})??out(401,'SESSION_OR_PC_ADMISSION_DENIED');
  }catch{return out(503,'ACCOUNT_STATUS_TRANSACTION_FAILED')}
 }
 read({token,customerId}){return this._run({token,customerId,action:'read'})}
 disable({token,customerId,reason,requestKey}){return this._run({token,customerId,reason,requestKey,action:'disable'})}
 restore({token,customerId,reason,requestKey}){return this._run({token,customerId,reason,requestKey,action:'restore'})}
}
