// PDM-15 real consultation assignee mutation in disposable PG16 only; no formal F03 capability.
import {createHash} from 'node:crypto';
const hash=s=>createHash('sha256').update(s).digest('hex');
const id=x=>typeof x==='string'&&/^[1-9][0-9]{0,18}$/.test(x)&&BigInt(x)<=9223372036854775807n;
const token=x=>typeof x==='string'&&/^[A-Za-z0-9_-]{43}$/.test(x);
const event=x=>typeof x==='string'&&/^[A-Za-z0-9_-]{24,64}$/.test(x);
const reason=x=>typeof x==='string'&&x.length>=6&&x.length<=200&&x===x.trim()&&!/[\u0000-\u001f\u007f]/.test(x);
const out=(status,code,extra={})=>({status,body:{code,...extra}});
export function createIsolatedHandoverService({pool,env=process.env}={}){
 if(!pool||typeof pool.connect!=='function'||env.APP_ENV!=='test'||env.NODE_ENV!=='test'||
 env.API_HOST!=='127.0.0.1'||env.F05_CATALOG_TEST_CONSENT!=='I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY')throw Error('HANDOVER_FORMAL_ISSUER_UNAVAILABLE');
 return Object.freeze({async reassign({token:bearer,consultationId,eventKey,targetEmployeeId,reason:note}){
  if(!id(consultationId)||!id(targetEmployeeId)||!event(eventKey)||!reason(note))return out(400,'HANDOVER_INVALID_REQUEST');
  if(!token(bearer))return out(401,'EMPLOYEE_IDENTITY_REQUIRED');
  const db=await pool.connect();
  try{
   await db.query('BEGIN');
   try{
    const actor=(await db.query("SELECT e.employee_id,r.role_code FROM public.f05_catalog_employee_sessions_test s "+
      "JOIN public.employees e ON e.employee_id=s.employee_id JOIN public.roles r ON r.role_id=e.main_role_id "+
      "WHERE s.token_sha256=$1 AND s.issuer='DISPOSABLE_TEST_ONLY' AND s.revoked_at IS NULL "+
      "AND s.expires_at>statement_timestamp() AND e.employment_status='active' "+
      "AND r.role_code IN ('sales','manager','store_head') FOR SHARE OF s,e,r",[hash(bearer)])).rows[0];
    if(!actor){await db.query('ROLLBACK');return out(401,'EMPLOYEE_IDENTITY_REQUIRED')}
    const actorId=String(actor.employee_id);
    await db.query('SELECT pg_advisory_xact_lock(hashtext($1),hashtext($2))',['F05_CONSULTATION_EVENT',eventKey]);
    const consultation=(await db.query("SELECT consultation_id,customer_id,vehicle_id,listing_cycle_id,assignee_employee_id,status "+
      "FROM public.consultations WHERE consultation_id=$1 FOR UPDATE",[consultationId])).rows[0];
    if(!consultation){await db.query('ROLLBACK');return out(404,'CONSULTATION_NOT_FOUND')}
    const customerId=String(consultation.customer_id),before=String(consultation.assignee_employee_id);
    const scope=(await db.query("SELECT p.can_reassign,p.can_manage_consultation FROM public.f05_catalog_employee_consultation_scope_test p "+
      "WHERE p.employee_id=$1 AND p.customer_id=$2 "+
      "AND (p.can_reassign=true OR p.can_manage_consultation=true) "+
      "AND p.issuer='DISPOSABLE_TEST_ONLY' AND p.expires_at>statement_timestamp() FOR SHARE OF p",
      [actorId,customerId])).rows[0];
    if(!scope){await db.query('ROLLBACK');return out(403,'HANDOVER_ACTOR_SCOPE_REQUIRED')}
    const isAssignee=before===actorId;
    const isScopedManager=Boolean(scope.can_manage_consultation)&&['manager','store_head'].includes(actor.role_code);
    if(!(isAssignee&&scope.can_reassign)&&!isScopedManager){
     await db.query('ROLLBACK');
     return out(403,isAssignee?'HANDOVER_ACTOR_SCOPE_REQUIRED':'HANDOVER_NOT_AUTHORIZED_ASSIGNEE_OR_MANAGER');
    }
    const digest=hash(JSON.stringify([actorId,consultationId,targetEmployeeId,note]));
    const previous=(await db.query("SELECT action,actor_employee_id,consultation_id,payload_sha256,old_assignee_employee_id,new_assignee_employee_id "+
      "FROM public.f05_catalog_consultation_actions_test WHERE event_key=$1",[eventKey])).rows[0];
    if(previous){
     await db.query('ROLLBACK');
     if(previous.action!=='REASSIGNED'||String(previous.actor_employee_id)!==actorId||
       String(previous.consultation_id)!==consultationId||String(previous.new_assignee_employee_id)!==targetEmployeeId||
       previous.payload_sha256!==digest)return out(409,'CONSULTATION_IDEMPOTENCY_COLLISION');
     if(before!==targetEmployeeId||!['pending','processing'].includes(consultation.status))return out(409,'HANDOVER_STATE_CHANGED');
     return out(200,'CONSULTATION_HANDOVER_REPLAY',{consultationId,oldAssigneeEmployeeId:String(previous.old_assignee_employee_id),newAssigneeEmployeeId:targetEmployeeId,firstHumanResponse:false,productionReady:false});
    }
    // The above scoped-manager Guard is the sole exception to current-assignee mutation.
    // Management capability neither rewrites Customer owner nor becomes assignee.
    if(!['pending','processing'].includes(consultation.status)){await db.query('ROLLBACK');return out(409,'CONSULTATION_NOT_OPEN')}
    if(before===targetEmployeeId){await db.query('ROLLBACK');return out(409,'CONSULTATION_ALREADY_ASSIGNED')}
    const target=(await db.query("SELECT 1 FROM public.employees e "+
      "JOIN public.roles r ON r.role_id=e.main_role_id "+
      "JOIN public.f05_catalog_employee_consultation_scope_test p ON p.employee_id=e.employee_id AND p.customer_id=$2 "+
      "WHERE e.employee_id=$1 AND e.employment_status='active' AND e.receiving_status='receiving' "+
      "AND r.role_code IN ('sales','manager','store_head') AND p.can_receive=true "+
      "AND p.issuer='DISPOSABLE_TEST_ONLY' AND p.expires_at>statement_timestamp() FOR SHARE OF e,r,p",
      [targetEmployeeId,customerId])).rows[0];
    if(!target){await db.query('ROLLBACK');return out(403,'HANDOVER_TARGET_NOT_ELIGIBLE')}
    const changed=(await db.query("UPDATE public.consultations SET assignee_employee_id=$2 "+
      "WHERE consultation_id=$1 AND assignee_employee_id=$3 AND status IN ('pending','processing') RETURNING consultation_id",
      [consultationId,targetEmployeeId,before])).rows[0];
    if(!changed){await db.query('ROLLBACK');return out(409,'HANDOVER_STATE_CHANGED')}
    await db.query("INSERT INTO public.f05_catalog_consultation_actions_test "+
      "(event_key,payload_sha256,customer_id,vehicle_id,listing_cycle_id,consultation_id,action,actor_employee_id,old_assignee_employee_id,new_assignee_employee_id,handover_reason) "+
      "VALUES($1,$2,$3,$4,$5,$6,'REASSIGNED',$7,$8,$9,$10)",
      [eventKey,digest,customerId,String(consultation.vehicle_id),String(consultation.listing_cycle_id),consultationId,actorId,before,targetEmployeeId,note]);
    await db.query('COMMIT');
    return out(200,'CONSULTATION_REASSIGNED',{consultationId,oldAssigneeEmployeeId:before,newAssigneeEmployeeId:targetEmployeeId,firstHumanResponse:false,productionReady:false});
   }catch(e){await db.query('ROLLBACK').catch(()=>{});throw e}
  }finally{db.release()}
 }});
}
