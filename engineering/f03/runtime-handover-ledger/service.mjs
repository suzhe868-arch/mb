// SG06 CI-only: record pending/failed domain-adapter work, NEVER domain handover success.
import {createHash} from 'node:crypto';
import {verify} from './migration.mjs';
const answer=(code,ok=false,extra={})=>Object.freeze({code,ok,...extra});
const validId=n=>Number.isSafeInteger(n)&&n>0;
const validKey=x=>typeof x==='string'&&/^[a-zA-Z0-9._:-]{12,90}$/.test(x);
const shape=(x,names)=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).sort().join(',')===names;
const hash=x=>createHash('sha256').update(x).digest('hex');
const hasCheckpoint=x=>x===undefined||(process.env.CI==='true'&&process.env.GITHUB_ACTIONS==='true'&&typeof x==='function');
const permittedRoles=['sales','manager','store_head'];
async function sealed(auth){const c=await auth.pool.connect();try{await verify(c)}finally{c.release()}}
const scopeSql="SELECT EXISTS (SELECT 1 FROM public.employees mgr JOIN public.roles mr ON mr.role_id=mgr.main_role_id JOIN public.employees e ON e.employee_id=$2 JOIN public.roles er ON er.role_id=e.main_role_id JOIN public.permissions p ON p.permission_code='employee.manage' LEFT JOIN public.role_permission_defaults rd ON rd.role_id=mgr.main_role_id AND rd.permission_id=p.permission_id LEFT JOIN public.employee_permission_overrides ov ON ov.employee_id=mgr.employee_id AND ov.permission_id=p.permission_id JOIN public.employee_data_scopes sc ON sc.employee_id=mgr.employee_id AND sc.scope_kind='team' JOIN public.employee_capability_scope_bindings bind ON bind.employee_id=sc.employee_id AND bind.scope_id=sc.scope_id AND bind.permission_id=p.permission_id JOIN public.teams t ON t.team_id=sc.scope_reference_id JOIN public.stores st ON st.store_id=t.store_id JOIN public.employee_team_memberships mm ON mm.team_id=t.team_id AND mm.employee_id=mgr.employee_id JOIN public.employee_team_memberships me ON me.team_id=t.team_id AND me.employee_id=e.employee_id WHERE mgr.employee_id=$1 AND mr.role_code='manager' AND mgr.employment_status='active' AND e.employment_status='active' AND er.role_code IN ('sales','manager','store_head') AND t.team_status='active' AND st.status='active' AND (ov.decision='allow' OR (ov.decision IS NULL AND rd.enabled=true)) AND ov.decision IS DISTINCT FROM 'deny' AND (sc.ended_at IS NULL OR sc.ended_at>statement_timestamp()) AND bind.granted_at<=statement_timestamp() AND (bind.ended_at IS NULL OR bind.ended_at>statement_timestamp()) AND mm.valid_from<=statement_timestamp() AND (mm.ended_at IS NULL OR mm.ended_at>statement_timestamp()) AND me.valid_from<=statement_timestamp() AND (me.ended_at IS NULL OR me.ended_at>statement_timestamp())) allowed";
async function authority(c,a,source){
 if(a.principal_kind!=='employee'||a.system_admin_id!==null||a.employee_id===null)return false;
 return (await c.query(scopeSql,[a.employee_id,source])).rows[0].allowed===true;
}
async function audit(c,a,kind,id,action,before,after,key){
 await c.query('INSERT INTO public.audit_events(actor_kind,actor_id,role_context,object_kind,object_id,action,before_json,after_json,occurred_at) VALUES($1,$2,$3::jsonb,$4,$5,$6,$7::jsonb,$8::jsonb,transaction_timestamp())',['employee',String(a.employee_id),JSON.stringify({scope:'SG06_CI_LEDGER_ONLY',intent_sha256:hash(key)}),kind,String(id),action,JSON.stringify(before),JSON.stringify(after)]);
}
async function alreadyAudited(c,a,kind,id,action,key){
 const q=await c.query("SELECT 1 FROM public.audit_events WHERE actor_kind='employee' AND actor_id=$1 AND object_kind=$2 AND object_id=$3 AND action=$4 AND role_context->>'intent_sha256'=$5 LIMIT 1",[String(a.employee_id),kind,String(id),action,hash(key)]);
 return q.rowCount>0;
}
async function withActor(auth,token,fn,options={}){
 if(!hasCheckpoint(options.testCheckpoint))return answer('LEDGER_TEST_CHECKPOINT_DENIED');
 await sealed(auth);
 const r=await auth.withSession(token,async(c,a,s)=>{
  if(s.restricted||a.principal_kind!=='employee'||a.employee_id===null||a.system_admin_id!==null||a.credential_state!=='enabled'||a.force_password_change!==false)return answer('LEDGER_ACTOR_DENIED');
  return fn(c,a,options.testCheckpoint);
 },{normalOnly:true});
 return r??answer('LEDGER_SESSION_DENIED');
}
async function lockedBatch(c,a,batchId){
 const b=(await c.query('SELECT * FROM public.handover_batches WHERE batch_id=$1 FOR UPDATE',[batchId])).rows[0];
 if(!b||b.initiated_by_kind!=='employee'||String(b.initiated_by_id)!==String(a.employee_id)||!(await authority(c,a,b.source_employee_id)))return null;
 return b;
}
export async function createHandoverDraft(auth,token,p,opts){
 if(!shape(p,'changeKind,invalidAt,reason,requestKey,sourceEmployeeId')||!validId(p.sourceEmployeeId)||!validKey(p.requestKey)||!['planned_transfer','planned_downgrade','planned_disable','sudden_inactive'].includes(p.changeKind)||typeof p.reason!=='string'||!/^[a-zA-Z0-9\u4e00-\u9fa5 .,_:：，。-]{1,256}$/.test(p.reason)||!(p.invalidAt===null||typeof p.invalidAt==='string'&&Number.isFinite(Date.parse(p.invalidAt))))return answer('LEDGER_DRAFT_INPUT_DENIED');
 return withActor(auth,token,async(c,a,checkpoint)=>{
  if(!(await authority(c,a,p.sourceEmployeeId)))return answer('LEDGER_SOURCE_SCOPE_DENIED');
  if(p.changeKind==='sudden_inactive')return answer('LEDGER_SUDDEN_INACTIVE_DEFER_DENY');
  const old=(await c.query('SELECT * FROM public.handover_batches WHERE client_request_key=$1 FOR UPDATE',[p.requestKey])).rows[0];
  const exact=x=>String(x.source_employee_id)===String(p.sourceEmployeeId)&&String(x.initiated_by_id)===String(a.employee_id)&&x.change_kind===p.changeKind&&x.reason===p.reason&&String(x.invalid_at?.toISOString()??'')===String(p.invalidAt?new Date(p.invalidAt).toISOString():'');
  if(old)return exact(old)?answer('LEDGER_DRAFT_NOOP',true,{batchId:Number(old.batch_id)}):answer('LEDGER_REQUEST_KEY_COLLISION');
  const inserted=(await c.query("INSERT INTO public.handover_batches(source_employee_id,invalid_at,change_kind,initiated_by_kind,initiated_by_id,client_request_key,reason) VALUES($1,$2,$3,'employee',$4,$5,$6) ON CONFLICT(client_request_key) DO NOTHING RETURNING batch_id",[p.sourceEmployeeId,p.invalidAt,p.changeKind,a.employee_id,p.requestKey,p.reason])).rows[0];
  if(!inserted){
   const won=(await c.query('SELECT * FROM public.handover_batches WHERE client_request_key=$1 FOR UPDATE',[p.requestKey])).rows[0];
   return won&&exact(won)?answer('LEDGER_DRAFT_NOOP',true,{batchId:Number(won.batch_id)}):answer('LEDGER_REQUEST_KEY_COLLISION');
  }
  if(checkpoint)await checkpoint('after_current',c);
  await audit(c,a,'handover_batch',inserted.batch_id,'handover.batch.draft',{}, {status:'collecting',source_employee_id:p.sourceEmployeeId,change_kind:p.changeKind},p.requestKey);
  if(checkpoint)await checkpoint('after_audit',c);
  return answer('LEDGER_DRAFT_CREATED',true,{batchId:Number(inserted.batch_id)});
 },opts);
}
const kinds=Object.freeze({Customer:['customers','customer_id','current_owner_employee_id'],Demand:['demands','demand_id','responsible_employee_id']});
async function objectMatches(c,k,id,source){
 const fields=kinds[k];if(!fields)return false;
 const q=await c.query('SELECT '+fields[2]+'::text as owner FROM public.'+fields[0]+' WHERE '+fields[1]+'=$1::bigint',[id]);
 return q.rowCount===1&&q.rows[0].owner===String(source);
}
async function validTarget(c,id){
 const t=(await c.query('SELECT e.employment_status,r.role_code FROM public.employees e JOIN public.roles r ON r.role_id=e.main_role_id WHERE e.employee_id=$1',[id])).rows[0];
 return t?.employment_status==='active'&&permittedRoles.includes(t.role_code);
}
export async function addPendingHandoverItem(auth,token,p,opts){
 if(!shape(p,'batchId,fromEmployeeId,intendedToEmployeeId,objectId,objectKind')||!validId(p.batchId)||!validId(p.fromEmployeeId)||!validId(p.intendedToEmployeeId)||p.fromEmployeeId===p.intendedToEmployeeId||!['Customer','Demand','Priority','Consultation','Waitlist','Lock','Transaction'].includes(p.objectKind)||typeof p.objectId!=='string'||!/^[1-9][0-9]{0,17}$/.test(p.objectId))return answer('LEDGER_ITEM_INPUT_DENIED');
 return withActor(auth,token,async(c,a,checkpoint)=>{
  const batch=await lockedBatch(c,a,p.batchId);
  if(!batch||String(batch.source_employee_id)!==String(p.fromEmployeeId))return answer('LEDGER_BATCH_SCOPE_DENIED');
  if(!await validTarget(c,p.intendedToEmployeeId))return answer('LEDGER_TARGET_DENIED');
  if(!kinds[p.objectKind])return answer('LEDGER_DOMAIN_ADAPTER_DEFER_DENY');
  if(!await objectMatches(c,p.objectKind,p.objectId,p.fromEmployeeId))return answer('LEDGER_OBJECT_NOT_PROVEN');
  const old=(await c.query('SELECT * FROM public.handover_items WHERE batch_id=$1 AND object_kind=$2 AND object_id=$3 FOR UPDATE',[p.batchId,p.objectKind,p.objectId])).rows[0];
  if(old)return String(old.from_employee_id)===String(p.fromEmployeeId)&&String(old.intended_to_employee_id)===String(p.intendedToEmployeeId)?answer('LEDGER_ITEM_NOOP',true,{itemId:Number(old.item_id)}):answer('LEDGER_ITEM_IMMUTABLE_COLLISION');
  const row=(await c.query('INSERT INTO public.handover_items(batch_id,object_kind,object_id,from_employee_id,intended_to_employee_id) VALUES($1,$2,$3,$4,$5) ON CONFLICT(batch_id,object_kind,object_id) DO NOTHING RETURNING item_id',[p.batchId,p.objectKind,p.objectId,p.fromEmployeeId,p.intendedToEmployeeId])).rows[0];
  if(!row)return answer('LEDGER_ITEM_CONCURRENT_NOOP');
  if(checkpoint)await checkpoint('after_current',c);
  await c.query("UPDATE public.handover_batches SET status='pending_domain_handover',version=version+1,updated_at=transaction_timestamp() WHERE batch_id=$1",[p.batchId]);
  await audit(c,a,'handover_item',row.item_id,'handover.item.pending',{}, {status:'pending',object_kind:p.objectKind,object_id:p.objectId,domain_adapter:'DEFER_DENY'},String(p.batchId)+':'+p.objectKind+':'+p.objectId);
  if(checkpoint)await checkpoint('after_audit',c);
  return answer('LEDGER_ITEM_PENDING_ONLY',true,{itemId:Number(row.item_id)});
 },opts);
}
async function statusChange(auth,token,p,kind,opts){
 const fail=kind==='failure',key=fail?p?.attemptKey:p?.retryKey;
 if(!shape(p,fail?'attemptKey,errorCode,itemId':'itemId,retryKey')||!validId(p.itemId)||!validKey(key)||fail&&!['DOMAIN_ADAPTER_UNAVAILABLE','DOMAIN_REVALIDATION_FAILED','CONFLICT_RETRY'].includes(p.errorCode))return answer('LEDGER_STATUS_INPUT_DENIED');
 return withActor(auth,token,async(c,a,checkpoint)=>{
  const locator=(await c.query('SELECT batch_id FROM public.handover_items WHERE item_id=$1',[p.itemId])).rows[0];
  if(!locator)return answer('LEDGER_ITEM_MISSING');
  const batch=await lockedBatch(c,a,locator.batch_id);
  if(!batch)return answer('LEDGER_BATCH_SCOPE_DENIED');
  const item=(await c.query('SELECT * FROM public.handover_items WHERE item_id=$1 AND batch_id=$2 FOR UPDATE',[p.itemId,batch.batch_id])).rows[0];
  if(!item||String(item.from_employee_id)!==String(batch.source_employee_id))return answer('LEDGER_ITEM_SOURCE_DENIED');
  const action=fail?'handover.item.failure':'handover.item.retry';
  if(await alreadyAudited(c,a,'handover_item',item.item_id,action,key))return answer('LEDGER_STATUS_NOOP',true);
  if(item.status!==(fail?'pending':'retry_required'))return answer('LEDGER_ITEM_STATE_DENIED');
  if(!kinds[item.object_kind]||!await objectMatches(c,item.object_kind,item.object_id,item.from_employee_id))return answer('LEDGER_OBJECT_NOT_PROVEN');
  if(!await validTarget(c,item.intended_to_employee_id))return answer('LEDGER_TARGET_DENIED');
  if(fail)await c.query("UPDATE public.handover_items SET status='retry_required',attempt_count=attempt_count+1,last_error_code=$2,updated_at=transaction_timestamp() WHERE item_id=$1",[p.itemId,p.errorCode]);
  else await c.query("UPDATE public.handover_items SET status='pending',last_error_code=NULL,updated_at=transaction_timestamp() WHERE item_id=$1",[p.itemId]);
  if(checkpoint)await checkpoint('after_current',c);
  await c.query('UPDATE public.handover_batches SET version=version+1,updated_at=transaction_timestamp() WHERE batch_id=$1',[batch.batch_id]);
  await audit(c,a,'handover_item',item.item_id,action,{status:item.status,attempt_count:Number(item.attempt_count)}, {status:fail?'retry_required':'pending',attempt_count:Number(item.attempt_count)+(fail?1:0),error_code:fail?p.errorCode:null,domain_adapter:'DEFER_DENY'},key);
  if(checkpoint)await checkpoint('after_audit',c);
  return answer(fail?'LEDGER_FAILURE_RECORDED':'LEDGER_RETRY_PENDING_ONLY',true);
 },opts);
}
export const recordItemFailure=(auth,token,p,opts)=>statusChange(auth,token,p,'failure',opts);
export const retryPendingItem=(auth,token,p,opts)=>statusChange(auth,token,p,'retry',opts);
