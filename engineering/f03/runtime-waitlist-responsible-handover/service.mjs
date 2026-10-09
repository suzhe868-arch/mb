// F03-2-2K: CI-only synthetic PG16 Waitlist responsible transfer; never production entrypoint.
import {createHash} from 'node:crypto';
import {verify} from './migration.mjs';
const valid=x=>Number.isSafeInteger(x)&&x>0;
const exact=(o,k)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).sort().join(',')===k;
const str=x=>x===undefined||x===null?null:String(x);
const out=(code,more={})=>Object.freeze({code,...more});
const sha=x=>createHash('sha256').update(x,'utf8').digest('hex');
const hookAllowed=x=>x===undefined||(process.env.CI==='true'&&process.env.GITHUB_ACTIONS==='true'&&typeof x==='function');
const request=p=>exact(p,'batchId,clientRequestKey,fromEmployeeId,itemId,recipientEmployeeId,teamId')&&[p.batchId,p.itemId,p.fromEmployeeId,p.recipientEmployeeId,p.teamId].every(valid)&&p.fromEmployeeId!==p.recipientEmployeeId&&typeof p.clientRequestKey==='string'&&/^[A-Za-z0-9._:-]{12,90}$/.test(p.clientRequestKey);
async function scope(c,actor,from,to,team,customer,allowInactive=false){
 const sql="SELECT EXISTS(SELECT 1 FROM public.employees mgr JOIN public.roles mr ON mr.role_id=mgr.main_role_id JOIN public.employees src ON src.employee_id=$2 JOIN public.roles sr ON sr.role_id=src.main_role_id JOIN public.employees dst ON dst.employee_id=$3 JOIN public.roles dr ON dr.role_id=dst.main_role_id JOIN public.permissions p ON p.permission_code='waitlist.responsible.transfer' LEFT JOIN public.role_permission_defaults rd ON rd.role_id=mgr.main_role_id AND rd.permission_id=p.permission_id LEFT JOIN public.employee_permission_overrides ov ON ov.employee_id=mgr.employee_id AND ov.permission_id=p.permission_id JOIN public.employee_data_scopes sc ON sc.employee_id=mgr.employee_id JOIN public.employee_capability_scope_bindings cb ON cb.employee_id=mgr.employee_id AND cb.permission_id=p.permission_id AND cb.scope_id=sc.scope_id JOIN public.teams t ON t.team_id=$4 JOIN public.stores st ON st.store_id=t.store_id JOIN public.employee_team_memberships sm ON sm.employee_id=src.employee_id AND sm.team_id=t.team_id JOIN public.employee_team_memberships dm ON dm.employee_id=dst.employee_id AND dm.team_id=t.team_id LEFT JOIN public.employee_team_memberships mm ON mm.employee_id=mgr.employee_id AND mm.team_id=t.team_id WHERE mgr.employee_id=$1 AND mgr.employment_status='active' AND mr.role_code IN ('manager','store_head') AND ($6::boolean OR src.employment_status='active') AND sr.role_code IN('sales','manager','store_head') AND dst.employment_status='active' AND dr.role_code IN('sales','manager','store_head') AND (mr.role_code='manager' OR mgr.store_id=t.store_id) AND st.status='active' AND t.team_status='active' AND ((mr.role_code='manager' AND sc.scope_kind='team' AND sc.scope_reference_id=t.team_id AND mm.employee_id IS NOT NULL AND mm.valid_from<=statement_timestamp() AND (mm.ended_at IS NULL OR mm.ended_at>statement_timestamp())) OR (mr.role_code='store_head' AND ((sc.scope_kind='store' AND sc.scope_reference_id=t.store_id) OR (sc.scope_kind='team' AND sc.scope_reference_id=t.team_id AND mm.employee_id IS NOT NULL AND mm.valid_from<=statement_timestamp() AND (mm.ended_at IS NULL OR mm.ended_at>statement_timestamp()))))) AND sm.valid_from<=statement_timestamp() AND (sm.ended_at IS NULL OR sm.ended_at>statement_timestamp()) AND dm.valid_from<=statement_timestamp() AND (dm.ended_at IS NULL OR dm.ended_at>statement_timestamp()) AND (ov.decision='allow' OR (ov.decision IS NULL AND rd.enabled=true)) AND ov.decision IS DISTINCT FROM 'deny' AND (sc.ended_at IS NULL OR sc.ended_at>statement_timestamp()) AND cb.granted_at<=statement_timestamp() AND (cb.ended_at IS NULL OR cb.ended_at>statement_timestamp()) AND EXISTS(SELECT 1 FROM public.customers cx WHERE cx.customer_id=$5 AND cx.account_status='active')) permitted";
 return (await c.query(sql,[actor,from,to,team,customer,allowInactive])).rows[0].permitted===true;
}
async function authTx(auth,token,fn,opts={}){
 if(!hookAllowed(opts.testCheckpoint))return out('K02_TEST_HOOK_DENY');
 const v=await auth.pool.connect();try{await verify(v)}finally{v.release()}
 try{
  return await auth.withSession(token,async(c,a,s)=>{
   if(s.restricted||a.principal_kind!=='employee'||a.employee_id===null||a.system_admin_id!==null||!['manager','store_head'].includes(a.role_code)||a.credential_state!=='enabled'||a.subject_status!=='active'||a.force_password_change!==false)return out('K02_NOT_CURRENT_MANAGER_OR_HEAD');
   await c.query("SET LOCAL lock_timeout='1200ms'");await c.query("SET LOCAL statement_timeout='9000ms'");
   await c.query('SELECT pg_advisory_xact_lock(20261010,306)');
   await c.query('SELECT pg_advisory_xact_lock(20261010,309)');
   await c.query('SELECT pg_advisory_xact_lock(20261010,313)');
   return fn(c,a,opts.testCheckpoint);
  },{normalOnly:true})??out('K02_SESSION_DENY');
 }catch(e){
  if(['55P03','40P01','57014','40001'].includes(e.code))return out('K04_CONTENTION_DEFER_DENY');
  if(e.code==='23505'&&/f03_2_2k_receipt_(request_key_unique|item_unique)/.test(e.constraint||''))return out('K05_COLLISION_DENY');
  throw e;
 }
}
async function facts(c,actor,p,locking=false){
 const suffix=locking?' FOR UPDATE':' FOR SHARE';
 const b=(await c.query('SELECT * FROM public.handover_batches WHERE batch_id=$1'+suffix,[p.batchId])).rows[0];
 if(!b||b.initiated_by_kind!=='employee'||str(b.initiated_by_id)!==str(actor.employee_id)||str(b.source_employee_id)!==str(p.fromEmployeeId)||!['collecting','pending_domain_handover','blocked'].includes(b.status))return {error:'K03_BATCH_IDENTITY_DENY'};
 const i=(await c.query('SELECT * FROM public.handover_items WHERE batch_id=$1 AND item_id=$2'+suffix,[p.batchId,p.itemId])).rows[0];
 if(!i||i.object_kind!=='Waitlist'||!['pending','retry_required'].includes(i.status)||str(i.from_employee_id)!==str(p.fromEmployeeId)||str(i.intended_to_employee_id)!==str(p.recipientEmployeeId)||!/^[1-9][0-9]{0,17}$/.test(i.object_id))return {error:'K03_ITEM_SCOPE_DENY'};
 const waitlistId=Number(i.object_id);if(!valid(waitlistId))return {error:'K03_WAITLIST_ID_DENY'};
 const waitlist=(await c.query('SELECT * FROM public.waitlists WHERE waitlist_id=$1'+suffix,[waitlistId])).rows[0];
 if(!waitlist||waitlist.ended_at!==null)return {error:'K03_WAITLIST_ENDED'};
 const customer=(await c.query('SELECT * FROM public.customers WHERE customer_id=$1 FOR SHARE',[waitlist.customer_id])).rows[0];
 if(!customer||customer.account_status!=='active'||customer.owner_assignment_state!=='assigned')return {error:'K03_CUSTOMER_INVALID'};
 const lc=(await c.query('SELECT v.vehicle_id,v.source_sale_status,v.platform_visibility,lc.listing_cycle_id,lc.ended_at FROM public.vehicle_listing_cycles lc JOIN public.vehicles v ON v.vehicle_id=lc.vehicle_id WHERE lc.listing_cycle_id=$1 AND lc.vehicle_id=$2 FOR SHARE OF lc,v',[waitlist.listing_cycle_id,waitlist.vehicle_id])).rows[0];
 if(!lc||lc.ended_at!==null||!['available','active'].includes(lc.source_sale_status))return {error:'K03_VEHICLE_LISTING_INVALID'};
 if(waitlist.source_lock_request_id!==null){
  const lr=(await c.query('SELECT * FROM public.lock_requests WHERE lock_request_id=$1 FOR SHARE',[waitlist.source_lock_request_id])).rows[0];
  if(!lr||str(lr.customer_id)!==str(waitlist.customer_id)||str(lr.vehicle_id)!==str(waitlist.vehicle_id)||str(lr.listing_cycle_id)!==str(waitlist.listing_cycle_id)||lr.resulting_waitlist_id!==null&&str(lr.resulting_waitlist_id)!==str(waitlistId)||lr.status!=='lock_conflict')return {error:'K03_SOURCE_LOCK_REQUEST_INVALID'};
 }
 if(waitlist.active_lock_id!==null){
  const lock=(await c.query('SELECT * FROM public.locks WHERE lock_id=$1 FOR SHARE',[waitlist.active_lock_id])).rows[0];
  if(!lock||str(lock.vehicle_id)!==str(waitlist.vehicle_id)||str(lock.listing_cycle_id)!==str(waitlist.listing_cycle_id)||str(lock.customer_id)===str(waitlist.customer_id)||lock.lock_status!=='active'||lock.expires_at<=new Date())return {error:'K03_ACTIVE_LOCK_RELATION_INVALID'};
 }
 const ownLock=(await c.query("SELECT 1 FROM public.locks WHERE customer_id=$1 AND vehicle_id=$2 AND listing_cycle_id=$3 AND lock_status='active' AND expires_at>statement_timestamp() LIMIT 1 FOR SHARE",[waitlist.customer_id,waitlist.vehicle_id,waitlist.listing_cycle_id])).rowCount;
 if(ownLock)return {error:'K03_CUSTOMER_ALREADY_LOCKED'};
 const src=(await c.query('SELECT employment_status FROM public.employees WHERE employee_id=$1 FOR SHARE',[p.fromEmployeeId])).rows[0];
 const dst=(await c.query('SELECT employment_status FROM public.employees WHERE employee_id=$1 FOR SHARE',[p.recipientEmployeeId])).rows[0];
 if(!src||!dst||src.employment_status!=='active'&&!['planned_disable','sudden_inactive'].includes(b.change_kind))return {error:'K03_SOURCE_INVALID'};
 if(dst.employment_status!=='active')return {error:'K03_RECIPIENT_INVALID'};
 if(!await scope(c,actor.employee_id,p.fromEmployeeId,p.recipientEmployeeId,p.teamId,waitlist.customer_id,src.employment_status!=='active'))return {error:'K02_WAITLIST_PERMISSION_SCOPE_DENY'};
 return {batch:b,item:i,waitlist,waitlistId,customerId:Number(waitlist.customer_id),sourceInactive:src.employment_status!=='active'};
}
const display=r=>({receiptId:Number(r.receipt_id),batchId:Number(r.batch_id),itemId:Number(r.item_id),waitlistId:Number(r.waitlist_id),customerId:Number(r.customer_id),fromEmployeeId:Number(r.from_employee_id),toEmployeeId:Number(r.to_employee_id),actorEmployeeId:Number(r.actor_employee_id),teamId:Number(r.scope_team_id),auditId:Number(r.audit_id),requestKeySha256:r.request_key_sha256,committedAt:r.committed_at.toISOString(),waitlistDomainTransferred:true,waitlistOrderUnchanged:true,otherDomainsCompleted:false,batchCompleted:false});
async function eventProven(c,r){
 const q=await c.query("SELECT b.source_employee_id bs,b.initiated_by_id ba,i.batch_id ib,i.object_kind ik,i.object_id io,i.from_employee_id iff,i.intended_to_employee_id ito,w.customer_id wc,a.actor_kind ak,a.actor_id aid,a.object_kind aok,a.object_id aoid,a.action act,a.role_context rc,a.before_json bj,a.after_json aj,a.occurred_at ats FROM public.handover_batches b JOIN public.handover_items i ON i.item_id=$2 JOIN public.waitlists w ON w.waitlist_id=$3 JOIN public.audit_events a ON a.audit_id=$4 WHERE b.batch_id=$1",[r.batch_id,r.item_id,r.waitlist_id,r.audit_id]);
 const v=q.rows[0];
 return !!v&&q.rows.length===1&&str(v.bs)===str(r.from_employee_id)&&str(v.ba)===str(r.actor_employee_id)&&str(v.ib)===str(r.batch_id)&&v.ik==='Waitlist'&&v.io===str(r.waitlist_id)&&str(v.iff)===str(r.from_employee_id)&&str(v.ito)===str(r.to_employee_id)&&str(v.wc)===str(r.customer_id)&&v.ak==='employee'&&v.aid===str(r.actor_employee_id)&&v.aok==='Waitlist'&&v.aoid===str(r.waitlist_id)&&v.act==='waitlist.responsible.handover'&&v.rc?.scope==='SG06_CI_ONLY_WAITLIST'&&str(v.rc.batchId)===str(r.batch_id)&&str(v.rc.itemId)===str(r.item_id)&&str(v.rc.teamId)===str(r.scope_team_id)&&v.rc.requestKeySha256===r.request_key_sha256&&str(v.bj?.responsible)===str(r.from_employee_id)&&str(v.aj?.responsible)===str(r.to_employee_id)&&v.ats?.getTime()===r.committed_at?.getTime();
}
async function proven(c,r){
 const rows=(await c.query('SELECT * FROM public.waitlist_responsible_handover_receipts WHERE waitlist_id=$1 ORDER BY committed_at,receipt_id FOR SHARE',[r.waitlist_id])).rows;
 if(!rows.length)return false;
 let previous=null,found=false;
 const keys=new Set();
 for(const x of rows){
  if(!await eventProven(c,x))return false;
  if(previous&&(str(previous.to_employee_id)!==str(x.from_employee_id)||x.committed_at.getTime()<previous.committed_at.getTime()||BigInt(x.audit_id)<=BigInt(previous.audit_id)))return false;
  if(keys.has(x.request_key_sha256))return false;
  keys.add(x.request_key_sha256);
  if(str(x.receipt_id)===str(r.receipt_id)){if(found||str(x.item_id)!==str(r.item_id)||str(x.audit_id)!==str(r.audit_id))return false;found=true}
  previous=x;
 }
 const current=(await c.query('SELECT customer_id,responsible_employee_id FROM public.waitlists WHERE waitlist_id=$1 FOR SHARE',[r.waitlist_id])).rows[0];
 return found&&!!current&&str(current.customer_id)===str(previous.customer_id)&&str(current.responsible_employee_id)===str(previous.to_employee_id);
}
async function receiptReadScope(c,actor,team,customer){
 const q=await c.query("SELECT EXISTS(SELECT 1 FROM public.employees m JOIN public.roles mr ON mr.role_id=m.main_role_id JOIN public.permissions p ON p.permission_code='waitlist.responsible.transfer' LEFT JOIN public.role_permission_defaults rd ON rd.role_id=m.main_role_id AND rd.permission_id=p.permission_id LEFT JOIN public.employee_permission_overrides ov ON ov.employee_id=m.employee_id AND ov.permission_id=p.permission_id JOIN public.employee_data_scopes sc ON sc.employee_id=m.employee_id JOIN public.employee_capability_scope_bindings cb ON cb.employee_id=m.employee_id AND cb.permission_id=p.permission_id AND cb.scope_id=sc.scope_id JOIN public.teams t ON t.team_id=$2 JOIN public.stores st ON st.store_id=t.store_id LEFT JOIN public.employee_team_memberships mm ON mm.employee_id=m.employee_id AND mm.team_id=t.team_id JOIN public.customers cu ON cu.customer_id=$3 WHERE m.employee_id=$1 AND m.employment_status='active' AND mr.role_code IN('manager','store_head') AND (mr.role_code='manager' OR m.store_id=t.store_id) AND t.team_status='active' AND st.status='active' AND cu.account_status='active' AND (ov.decision='allow' OR (ov.decision IS NULL AND rd.enabled=true)) AND ov.decision IS DISTINCT FROM 'deny' AND (sc.ended_at IS NULL OR sc.ended_at>statement_timestamp()) AND cb.granted_at<=statement_timestamp() AND (cb.ended_at IS NULL OR cb.ended_at>statement_timestamp()) AND ((mr.role_code='manager' AND sc.scope_kind='team' AND sc.scope_reference_id=t.team_id AND mm.valid_from<=statement_timestamp() AND (mm.ended_at IS NULL OR mm.ended_at>statement_timestamp())) OR (mr.role_code='store_head' AND ((sc.scope_kind='store' AND sc.scope_reference_id=t.store_id) OR (sc.scope_kind='team' AND sc.scope_reference_id=t.team_id AND mm.valid_from<=statement_timestamp() AND (mm.ended_at IS NULL OR mm.ended_at>statement_timestamp())))))) allowed",[actor,team,customer]);
 return q.rows[0].allowed===true;
}
export async function prepareWaitlistResponsibleHandover(auth,token,p,o){
 if(!request(p))return out('K01_BAD_REQUEST');
 return authTx(auth,token,async(c,actor)=>{
  const f=await facts(c,actor,p);if(f.error)return out(f.error);
  if(str(f.waitlist.responsible_employee_id)!==str(p.fromEmployeeId))return out('K03_SOURCE_NOT_CURRENT');
  return out('K01_PREPARED_READ_ONLY',{batchId:p.batchId,itemId:p.itemId,waitlistId:f.waitlistId,customerId:f.customerId,sourceInactive:f.sourceInactive,commitTokenIssued:false,waitlistOrderUnchanged:true,batchCompleted:false});
 },o);
}
async function transfer(c,actor,p,hook){
 const key=sha(p.clientRequestKey);
 const old=(await c.query('SELECT * FROM public.waitlist_responsible_handover_receipts WHERE item_id=$1 FOR SHARE',[p.itemId])).rows[0];
 if(old){
  if(!await receiptReadScope(c,actor.employee_id,p.teamId,old.customer_id))return out('K02_WAITLIST_PERMISSION_SCOPE_DENY');
  if(str(old.actor_employee_id)!==str(actor.employee_id)||str(old.batch_id)!==str(p.batchId)||str(old.from_employee_id)!==str(p.fromEmployeeId)||str(old.to_employee_id)!==str(p.recipientEmployeeId)||str(old.scope_team_id)!==str(p.teamId)||old.request_key_sha256!==key)return out('K05_COLLISION_DENY');
  if(!await proven(c,old))return out('K05_RECEIPT_PROOF_DENY');
  return out('K05_IDEMPOTENT_RECEIPT',{receipt:display(old),idempotent:true});
 }
 const f=await facts(c,actor,p,true);if(f.error)return out(f.error);
 for(const table of ['customer_owner_handover_receipts','demand_responsible_handover_receipts','consultation_assignee_handover_receipts']){
  if((await c.query('SELECT 1 FROM public.'+table+' WHERE request_key_sha256=$1 FOR SHARE',[key])).rowCount)return out('K05_CROSS_DOMAIN_KEY_DENY');
 }
 const conflict=(await c.query('SELECT item_id FROM public.waitlist_responsible_handover_receipts WHERE request_key_sha256=$1 FOR SHARE',[key])).rows[0];
 if(conflict)return out('K05_COLLISION_DENY');
 if(str(f.waitlist.responsible_employee_id)!==str(p.fromEmployeeId))return out('K04_CAS_CONFLICT');
 if(hook)await hook('before_update',c);
 const change=await c.query("UPDATE public.waitlists SET responsible_employee_id=$1 WHERE waitlist_id=$2 AND responsible_employee_id=$3 AND ended_at IS NULL RETURNING waitlist_id",[p.recipientEmployeeId,f.waitlistId,p.fromEmployeeId]);
 if(change.rowCount!==1)return out('K04_CAS_CONFLICT');
 if(hook)await hook('after_update',c);
 const audit=(await c.query("INSERT INTO public.audit_events(actor_kind,actor_id,role_context,object_kind,object_id,action,before_json,after_json,occurred_at) VALUES('employee',$1,$2::jsonb,'Waitlist',$3,'waitlist.responsible.handover',$4::jsonb,$5::jsonb,transaction_timestamp()) RETURNING audit_id",[str(actor.employee_id),JSON.stringify({scope:'SG06_CI_ONLY_WAITLIST',batchId:p.batchId,itemId:p.itemId,teamId:p.teamId,requestKeySha256:key}),str(f.waitlistId),JSON.stringify({responsible:p.fromEmployeeId}),JSON.stringify({responsible:p.recipientEmployeeId})])).rows[0].audit_id;
 if(hook)await hook('after_audit',c);
 const receipt=(await c.query('INSERT INTO public.waitlist_responsible_handover_receipts(item_id,batch_id,waitlist_id,customer_id,from_employee_id,to_employee_id,actor_employee_id,scope_team_id,audit_id,request_key_sha256) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',[p.itemId,p.batchId,f.waitlistId,f.customerId,p.fromEmployeeId,p.recipientEmployeeId,actor.employee_id,p.teamId,audit,key])).rows[0];
 if(hook)await hook('after_receipt',c);
 if(hook)await hook('before_commit',c);
 return out('K04_WAITLIST_TRANSFERRED',{receipt:display(receipt),otherDomainsPending:true,waitlistOrderUnchanged:true,idempotent:false});
}
export const commitWaitlistResponsibleHandover=(a,t,p,o)=>!request(p)?Promise.resolve(out('K04_BAD_REQUEST')):authTx(a,t,(c,actor,h)=>transfer(c,actor,p,h),o);
export const retryWaitlistResponsibleHandover=(a,t,p,o)=>!request(p)?Promise.resolve(out('K05_BAD_RETRY')):authTx(a,t,(c,actor,h)=>transfer(c,actor,p,h),o);
export async function readWaitlistResponsibleHandoverReceipt(auth,token,p,o){
 if(!exact(p,'batchId,itemId,teamId')||![p.batchId,p.itemId,p.teamId].every(valid))return out('K05_BAD_READ');
 return authTx(auth,token,async(c,actor)=>{
  const r=(await c.query('SELECT * FROM public.waitlist_responsible_handover_receipts WHERE item_id=$1 AND batch_id=$2 FOR SHARE',[p.itemId,p.batchId])).rows[0];
  if(!r||str(r.scope_team_id)!==str(p.teamId))return out('K05_RECEIPT_ABSENT');
  if(!await receiptReadScope(c,actor.employee_id,p.teamId,r.customer_id))return out('K02_WAITLIST_PERMISSION_SCOPE_DENY');
  if(!await proven(c,r))return out('K05_RECEIPT_PROOF_DENY');
  return out('K05_RECEIPT_READ_ONLY',{receipt:display(r),waitlistOrderUnchanged:true,batchCompleted:false});
 },o);
}
