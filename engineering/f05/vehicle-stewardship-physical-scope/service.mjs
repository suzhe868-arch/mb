// F05-2 CI-only; no public/prod route registration. Every allow comes from real PG16 rows.
import {verify,requireDatabaseIdentity} from './migration.mjs';
const valid=n=>Number.isSafeInteger(n)&&n>0;
const allowedEmployee=['sales','manager','store_head'];
const deny=code=>Object.freeze({code,allowed:false});
const ok=(code,extra={})=>Object.freeze({code,allowed:true,...extra});
const eventKey=k=>typeof k==='string'&&/^[A-Za-z0-9._:-]{20,160}$/.test(k);
function isolated(){
 for(const [k,v] of Object.entries({CI:'true',GITHUB_ACTIONS:'true',APP_ENV:'test',NODE_ENV:'test',
   F05_2_ISOLATION_CONFIRM:'I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY'}))
  if(process.env[k]!==v)throw Error('F05_2_NOT_CI_ONLY_'+k);
}
const shape=(o,names)=>o!==null&&typeof o==='object'&&!Array.isArray(o)&&
 Object.keys(o).sort().join(',')===names;
async function currentCapability(c,employee,team,cap){
 const strong=await c.query(
 "SELECT EXISTS (SELECT 1 FROM public.employees e JOIN public.roles role ON role.role_id=e.main_role_id "+
 "JOIN public.teams t ON t.team_id=$2 JOIN public.stores st ON st.store_id=t.store_id "+
 "JOIN public.employee_team_memberships tm ON tm.employee_id=e.employee_id AND tm.team_id=t.team_id "+
 "JOIN public.permissions p ON p.permission_code=$3 "+
 "LEFT JOIN public.role_permission_defaults rd ON rd.role_id=e.main_role_id AND rd.permission_id=p.permission_id "+
 "LEFT JOIN public.employee_permission_overrides ov ON ov.employee_id=e.employee_id AND ov.permission_id=p.permission_id "+
 "JOIN public.employee_data_scopes sc ON sc.employee_id=e.employee_id "+
 "JOIN public.employee_capability_scope_bindings sb ON sb.employee_id=e.employee_id AND sb.permission_id=p.permission_id AND sb.scope_id=sc.scope_id "+
 "WHERE e.employee_id=$1 AND e.employment_status='active' AND role.role_code IN ('sales','manager','store_head') "+
 "AND e.store_id=t.store_id AND t.team_status='active' AND st.status='active' "+
 "AND tm.valid_from<=statement_timestamp() AND (tm.ended_at IS NULL OR tm.ended_at>statement_timestamp()) "+
 "AND sc.ended_at IS NULL AND sc.scope_kind='team' AND sc.scope_reference_id=t.team_id "+
 "AND sb.granted_at<=statement_timestamp() AND (sb.ended_at IS NULL OR sb.ended_at>statement_timestamp()) "+
 "AND ov.decision IS DISTINCT FROM 'deny' AND (ov.decision='allow' OR (ov.decision IS NULL AND rd.enabled=true))) permitted",[employee,team,cap]);
 return strong.rows[0]?.permitted===true;
}
async function session(auth,token,fn){
 isolated();
 if(!auth||!auth.pool||typeof auth.withSession!=='function')throw Error('F05_2_AUTH_SERVICE_MISSING');
 await requireDatabaseIdentity(auth.pool);
 const out=await auth.withSession(token,async(c,a,s)=>{
  if(s.restricted||a.principal_kind!=='employee'||a.employee_id===null||a.system_admin_id!==null||
    a.subject_status!=='active'||a.credential_state!=='enabled'||a.force_password_change!==false)
   return deny('F05_2_EMPLOYEE_SESSION_REQUIRED');
  return fn(c,Number(a.employee_id));
 },{normalOnly:true});
 return out??deny('F05_2_SESSION_DENIED');
}
async function lookup(c,vehicleId,{exclusive=false}={}){
 const suffix=exclusive?' FOR UPDATE OF v,cy':' FOR SHARE OF v,cy';
 return (await c.query("SELECT v.vehicle_id,v.source_type,v.source_sale_status,v.archived_at,v.created_by_employee_id,v.formally_published_at,"+
  "cy.listing_cycle_id,cy.ended_at FROM public.vehicles v "+
  "JOIN public.vehicle_listing_cycles cy ON cy.vehicle_id=v.vehicle_id "+
  "WHERE v.vehicle_id=$1 AND cy.ended_at IS NULL ORDER BY cy.started_at DESC,cy.listing_cycle_id DESC LIMIT 1"+suffix,[vehicleId])).rows[0];
}
const basic=v=>v&&v.ended_at===null&&v.archived_at===null&&['mingbang','four_s'].includes(v.source_type)&&
 ['available'].includes(v.source_sale_status);
// CI synthetic trusted publication fact, inserted by a separate authenticated transaction.
// Client-controlled eventKey alone cannot mint ownership: a verified physical audit event
// must pre-exist before issueFromTrustedManualPublication can sign responsibility.
export async function recordTrustedManualPublicationEvent(auth,token,p){
 if(!shape(p,'eventKey,listingCycleId,teamId,vehicleId')||![p.vehicleId,p.listingCycleId,p.teamId].every(valid)||!eventKey(p.eventKey))
  return deny('F05_2_EVENT_INPUT_DENY');
 await verify(auth.pool);
 return session(auth,token,async(c,actor)=>{
  const v=await lookup(c,p.vehicleId,{exclusive:true});
  if(!basic(v)||Number(v.listing_cycle_id)!==p.listingCycleId||
    Number(v.created_by_employee_id)!==actor||v.formally_published_at===null)
   return deny('F05_2_NO_TRUSTED_PHYSICAL_PUBLICATION');
  if(!await currentCapability(c,actor,p.teamId,'vehicle.manage'))return deny('F05_2_EVENT_ACTOR_SCOPE_DENIED');
  const fact={vehicleId:p.vehicleId,listingCycleId:p.listingCycleId,teamId:p.teamId,sourceKind:v.source_type,eventKey:p.eventKey};
  const old=(await c.query("SELECT after_json,actor_id FROM public.audit_events WHERE object_kind='Vehicle' AND action='vehicle.manual.published' AND after_json->>'eventKey'=$1 FOR SHARE",[p.eventKey])).rows;
  if(old.length){
   if(old.length===1&&old[0].actor_id===String(actor)&&Object.entries(fact).every(([k,value])=>old[0].after_json?.[k]===value))return ok('F05_2_EVENT_IDEMPOTENT');
   // Even if an earlier fabricated or conflicting audit fact exists, never sign it.
   return deny('F05_2_EVENT_COLLISION');
  }
  await c.query("INSERT INTO public.audit_events(actor_kind,actor_id,role_context,object_kind,object_id,action,before_json,after_json,occurred_at) VALUES('employee',$1,$2::jsonb,'Vehicle',$3,'vehicle.manual.published',NULL,$4::jsonb,transaction_timestamp())",
   [String(actor),JSON.stringify({ciOnly:true,source:'F05_2_TRUSTED_MANUAL_PUBLICATION_EVENT'}),String(p.vehicleId),JSON.stringify(fact)]);
  return ok('F05_2_TRUSTED_PUBLICATION_EVENT_RECORDED');
 });
}

export async function issueFromTrustedManualPublication(auth,token,p){
 if(!shape(p,'eventKey,listingCycleId,teamId,vehicleId')||![p.vehicleId,p.listingCycleId,p.teamId].every(valid)||!eventKey(p.eventKey))
  return deny('F05_2_INVALID_TRUST_EVENT');
 await verify(auth.pool);
 return session(auth,token,async(c,actor)=>{
  const v=await lookup(c,p.vehicleId,{exclusive:true});
  if(!basic(v)||Number(v.listing_cycle_id)!==p.listingCycleId||Number(v.created_by_employee_id)!==actor||
     v.formally_published_at===null)return deny('F05_2_NOT_TRUSTED_PUBLISHED_EVENT');
  if(!await currentCapability(c,actor,p.teamId,'vehicle.manage'))return deny('F05_2_MANAGE_SCOPE_DENIED');
  // Prove an independent authenticated publication event exists and agrees with
  // current real Vehicle + ListingCycle/issuer/team/source facts.
  const events=(await c.query(
   "SELECT actor_kind,actor_id,object_id,role_context,after_json FROM public.audit_events "+
   "WHERE object_kind='Vehicle' AND action='vehicle.manual.published' AND after_json->>'eventKey'=$1 FOR SHARE",
   [p.eventKey])).rows;
  if(events.length!==1)return deny('F05_2_PUBLISHED_EVENT_SOURCE_GAP');
  const record=events[0],d=record.after_json;
  if(record.actor_kind!=='employee'||record.actor_id!==String(actor)||record.object_id!==String(p.vehicleId)||
    record.role_context?.source!=='F05_2_TRUSTED_MANUAL_PUBLICATION_EVENT'||
    d.vehicleId!==p.vehicleId||d.listingCycleId!==p.listingCycleId||d.teamId!==p.teamId||
    d.sourceKind!==v.source_type||d.eventKey!==p.eventKey)
   return deny('F05_2_PUBLISHED_EVENT_PROOF_CHANGED');

  const exists=(await c.query("SELECT * FROM public.vehicle_current_responsibilities WHERE vehicle_id=$1 AND listing_cycle_id=$2 AND revoked_at IS NULL FOR UPDATE",[p.vehicleId,p.listingCycleId])).rows[0];
  if(exists){
   if(exists.trusted_event_key===p.eventKey&&Number(exists.responsible_employee_id)===actor&&Number(exists.team_id)===p.teamId)return ok('F05_2_IDEMPOTENT',{responsibilityId:Number(exists.responsibility_id)});
   return deny('F05_2_ALREADY_ASSIGNED');
  }
  const old=(await c.query('SELECT responsibility_id FROM public.vehicle_current_responsibilities WHERE trusted_event_key=$1',[p.eventKey])).rows[0];
  if(old)return deny('F05_2_REPLAYED_ENDED_EVENT');
  const r=(await c.query("INSERT INTO public.vehicle_current_responsibilities(vehicle_id,listing_cycle_id,responsible_employee_id,team_id,source_snapshot,provenance_kind,trusted_event_key,issuer_employee_id) "+
   "VALUES($1,$2,$3,$4,$5,'AUTHORIZED_MANUAL_PUBLICATION',$6,$3) RETURNING responsibility_id",
   [p.vehicleId,p.listingCycleId,actor,p.teamId,v.source_type,p.eventKey])).rows[0];
  await c.query("INSERT INTO public.vehicle_responsibility_audit_events(responsibility_id,event_key,event_kind,actor_employee_id,current_employee_id,source_evidence) VALUES($1,$2,'ISSUE',$3,$3,$4)",
   [r.responsibility_id,'audit:'+p.eventKey,actor,'PDM06_MANUAL_FORMAL_PUBLISH_CURRENT_M94']);
  return ok('F05_2_ISSUED',{responsibilityId:Number(r.responsibility_id)});
 });
}
export async function revokeCurrentResponsibility(auth,token,p){
 if(!shape(p,'eventKey,responsibilityId,version')||![p.responsibilityId,p.version].every(valid)||!eventKey(p.eventKey))return deny('F05_2_REVOKE_INPUT');
 await verify(auth.pool);
 return session(auth,token,async(c,actor)=>{
  const locator=(await c.query('SELECT vehicle_id FROM public.vehicle_current_responsibilities WHERE responsibility_id=$1',[p.responsibilityId])).rows[0];
  if(!locator)return deny('F05_2_REVOKED_OR_STALE');
  const v=await lookup(c,Number(locator.vehicle_id),{exclusive:true});
  const r=(await c.query('SELECT * FROM public.vehicle_current_responsibilities WHERE responsibility_id=$1 FOR UPDATE',[p.responsibilityId])).rows[0];
  if(!r||r.revoked_at||Number(r.version)!==p.version)return deny('F05_2_REVOKED_OR_STALE');
  if(!v||Number(v.listing_cycle_id)!==Number(r.listing_cycle_id)||v.source_type!==r.source_snapshot)
   return deny('F05_2_SOURCE_OR_CYCLE_CHANGED');
  if(!await currentCapability(c,actor,Number(r.team_id),'vehicle.manage'))return deny('F05_2_REVOKER_SCOPE_DENIED');
  await c.query("UPDATE public.vehicle_current_responsibilities SET revoked_at=transaction_timestamp(),version=version+1 WHERE responsibility_id=$1 AND version=$2",[p.responsibilityId,p.version]);
  await c.query("INSERT INTO public.vehicle_responsibility_audit_events(responsibility_id,event_key,event_kind,actor_employee_id,previous_employee_id,source_evidence) VALUES($1,$2,'REVOKE',$3,$4,$5)",
   [p.responsibilityId,p.eventKey,actor,r.responsible_employee_id,'PDM02_04_AUTHORIZED_SCOPE_CURRENT_REVOKE']);
  return ok('F05_2_REVOKED');
 });
}
// Formal CI-only stewardship handover requires a separate manager actor with actual
// current Vehicle manage scope, eligible target permission+scope, and locked CAS history.
export async function transferCurrentResponsibility(auth,token,p){
 if(!shape(p,'eventKey,responsibilityId,targetEmployeeId,teamId,version')||
    ![p.responsibilityId,p.teamId,p.targetEmployeeId,p.version].every(valid)||!eventKey(p.eventKey))
    return deny('F05_2_TRANSFER_INPUT_DENIED');
 await verify(auth.pool);
 return session(auth,token,async(c,actor)=>{
  const role=(await c.query("SELECT r.role_code FROM public.employees e JOIN public.roles r ON r.role_id=e.main_role_id WHERE e.employee_id=$1 AND e.employment_status='active' FOR SHARE OF e",[actor])).rows[0]?.role_code;
  if(!['manager','store_head'].includes(role)||actor===p.targetEmployeeId)return deny('F05_2_TRANSFER_MANAGER_REQUIRED');
  // Keep the same lock order for issue, revoke and transfer: Vehicle -> current relationship.
  const locator=(await c.query("SELECT vehicle_id FROM public.vehicle_current_responsibilities WHERE responsibility_id=$1",[p.responsibilityId])).rows[0];
  if(!locator)return deny('F05_2_TRANSFER_SOURCE_MISSING');
  const v=await lookup(c,Number(locator.vehicle_id),{exclusive:true});
  if(!basic(v))return deny('F05_2_TRANSFER_VEHICLE_INVALID');
  const old=(await c.query("SELECT * FROM public.vehicle_current_responsibilities WHERE responsibility_id=$1 FOR UPDATE",[p.responsibilityId])).rows[0];
  if(!old||old.revoked_at||Number(old.version)!==p.version||
     Number(old.listing_cycle_id)!==Number(v.listing_cycle_id)||
     Number(old.team_id)!==p.teamId||old.source_snapshot!==v.source_type||
     Number(old.responsible_employee_id)===p.targetEmployeeId)
   return deny('F05_2_TRANSFER_STALE');
  if(!await currentCapability(c,actor,p.teamId,'vehicle.manage')||
     !await currentCapability(c,p.targetEmployeeId,p.teamId,'vehicle.manage')||
     !await currentCapability(c,p.targetEmployeeId,p.teamId,'vehicle.read'))
   return deny('F05_2_TRANSFER_PERMISSION_OR_RECEIVER_DENIED');
  const existed=(await c.query('SELECT responsibility_id FROM public.vehicle_current_responsibilities WHERE trusted_event_key=$1',[p.eventKey])).rows[0];
  if(existed)return deny('F05_2_TRANSFER_REPLAY_OR_COLLISION');
  await c.query("UPDATE public.vehicle_current_responsibilities SET revoked_at=transaction_timestamp(),version=version+1 WHERE responsibility_id=$1 AND version=$2",[p.responsibilityId,p.version]);
  const next=(await c.query("INSERT INTO public.vehicle_current_responsibilities(vehicle_id,listing_cycle_id,responsible_employee_id,team_id,source_snapshot,provenance_kind,trusted_event_key,issuer_employee_id) VALUES($1,$2,$3,$4,$5,'AUTHORIZED_FORMAL_HANDOVER',$6,$7) RETURNING responsibility_id",
   [v.vehicle_id,v.listing_cycle_id,p.targetEmployeeId,p.teamId,v.source_type,p.eventKey,actor])).rows[0];
  // Two append-only audit facts: old owner ended and current steward accepted in the same TX.
  await c.query("INSERT INTO public.vehicle_responsibility_audit_events(responsibility_id,event_key,event_kind,actor_employee_id,previous_employee_id,current_employee_id,source_evidence) VALUES($1,$2,'TRANSFER',$3,$4,$5,$6)",
   [p.responsibilityId,'old:'+p.eventKey,actor,old.responsible_employee_id,p.targetEmployeeId,'PDM04_PDM02_AUTHORITATIVE_MANAGER_TRANSFER']);
  await c.query("INSERT INTO public.vehicle_responsibility_audit_events(responsibility_id,event_key,event_kind,actor_employee_id,previous_employee_id,current_employee_id,source_evidence) VALUES($1,$2,'TRANSFER',$3,$4,$5,$6)",
   [next.responsibility_id,'new:'+p.eventKey,actor,old.responsible_employee_id,p.targetEmployeeId,'PDM04_PDM02_AUTHORITATIVE_MANAGER_TRANSFER']);
  return ok('F05_2_TRANSFERRED',{responsibilityId:Number(next.responsibility_id)});
 });
}

export async function readMinimalCurrentVehicle(auth,token,p){
 if(!shape(p,'outlet,vehicleId')||!valid(p.vehicleId)||p.outlet!=='detail')return deny('F05_2_DETAIL_ONLY');
 return session(auth,token,async(c,actor)=>{
  const v=await lookup(c,p.vehicleId);
  if(!basic(v))return deny('F05_2_VEHICLE_STATE_DENIED');
  const r=(await c.query("SELECT responsibility_id,responsible_employee_id,team_id,source_snapshot,revoked_at FROM public.vehicle_current_responsibilities WHERE vehicle_id=$1 AND listing_cycle_id=$2 AND revoked_at IS NULL FOR SHARE",
    [p.vehicleId,v.listing_cycle_id])).rows;
  if(r.length!==1||r[0].source_snapshot!==v.source_type)return deny('F05_2_SCOPE_UNPROVEN');
  if(!await currentCapability(c,actor,Number(r[0].team_id),'vehicle.read'))return deny('F05_2_READ_SCOPE_DENIED');
  return ok('F05_2_MINIMAL_VEHICLE',{vehicleId:Number(v.vehicle_id),listingCycleId:Number(v.listing_cycle_id),sourceKind:v.source_type});
 });
}
export const forbiddenBusinessOutlets=Object.freeze(['list','export','copy','cache','print','history']);
