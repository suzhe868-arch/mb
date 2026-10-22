// F05-2 CI-only; no public/prod route registration. Every allow comes from real PG16 rows.
import {verify,requireDatabaseIdentity} from './migration.mjs';
import {verify as verifyFourSChain} from '../four-s-member-trust-scope/migration.mjs';
const valid=n=>Number.isSafeInteger(n)&&n>0;
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
  const subject=Number(a.employee_id);
  if(!Number.isSafeInteger(subject)||subject<1||subject>2147483647)return deny('F05_2_EMPLOYEE_ID_INVALID');
  // Governance triggers coordinate at transaction COMMIT with this lock.
  await c.query('SELECT pg_advisory_xact_lock(20261011,$1::integer)',[subject]);
  return fn(c,subject);
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
// Legacy two-call path is permanently closed: uploaded/older car attributes and
// caller-supplied EventKey cannot retroactively manufacture a Vehicle owner.
export async function recordTrustedManualPublicationEvent(){
 return deny('F05_2_RETROACTIVE_PUBLICATION_FORBIDDEN');
}
export async function issueFromTrustedManualPublication(){
 return deny('F05_2_RETROACTIVE_PUBLICATION_FORBIDDEN');
}
// An actual new manual publication, current Vehicle/Cycle creation, signed business
// responsibility receipt, and both append-only audit facts share ONE PG16 transaction.
// Neither created_by nor formally_published_at for an old row can enter this path.
export async function publishAndIssueFromCurrentTransaction(auth,token,p,{testCheckpoint,onPublishInTransaction}={}){
 if(!shape(p,'eventKey,listingCycleId,sourceKind,teamId,vehicleId')||
    ![p.vehicleId,p.listingCycleId,p.teamId].every(valid)||!eventKey(p.eventKey)||
    !['mingbang','four_s'].includes(p.sourceKind)||
    p.vehicleId<59000||p.listingCycleId<59000)
  return deny('F05_2_NEW_MANUAL_PUBLICATION_INPUT_DENY');
 // For this authorized combined non-production consumer, validate the genuine
 // 000016 physical seal. The older 000015-only path remains exactly verified.
 const chain=(await auth.pool.query('SELECT migration_id FROM public.f03_schema_migrations ORDER BY migration_id')).rows;
 if(chain.length===14&&chain[13].migration_id==='000016_four_s_member_trust_ci_only')await verifyFourSChain(auth.pool);
 else await verify(auth.pool);
 return session(auth,token,async(c,actor)=>{
  if(!await currentCapability(c,actor,p.teamId,'vehicle.manage'))return deny('F05_2_MANUAL_PUBLICATION_SCOPE_DENIED');
  if(testCheckpoint!==undefined){
   if(process.env.CI!=='true'||process.env.GITHUB_ACTIONS!=='true'||typeof testCheckpoint!=='function')
    return deny('F05_2_CHECKPOINT_NOT_CI');
   await testCheckpoint('publisher_permission_proven',c);
  }
  if(onPublishInTransaction!==undefined&&
     (process.env.CI!=='true'||process.env.GITHUB_ACTIONS!=='true'||typeof onPublishInTransaction!=='function'))
   return deny('F05_2_PUBLISH_CALLBACK_NOT_CI');
  // A real existing row, including one with apparently matching uploader and
  // timestamp, is explicitly not eligible for a backfilled ownership grant.
  const prior=(await c.query('SELECT vehicle_id FROM public.vehicles WHERE vehicle_id=$1 FOR KEY SHARE',[p.vehicleId])).rows;
  if(prior.length){
   const old=(await c.query("SELECT x.responsibility_id,x.responsible_employee_id,x.team_id,x.source_snapshot,x.revoked_at,y.actor_id,y.role_context,y.after_json FROM public.vehicle_current_responsibilities x JOIN public.audit_events y ON y.object_kind='Vehicle' AND y.object_id=$4::text AND y.action='vehicle.manual.published' AND y.after_json->>'eventKey'=$2 WHERE x.vehicle_id=$1 AND x.listing_cycle_id=$3 AND x.trusted_event_key=$2",
    [p.vehicleId,p.eventKey,p.listingCycleId,String(p.vehicleId)])).rows;
   if(old.length===1&&old[0].revoked_at===null&&Number(old[0].responsible_employee_id)===actor&&
      Number(old[0].team_id)===p.teamId&&old[0].source_snapshot===p.sourceKind&&
      old[0].actor_id===String(actor)&&old[0].role_context?.origin==='F05_2_NEW_MANUAL_PUBLISH_IN_SAME_TX'&&
      old[0].after_json?.vehicleId===p.vehicleId&&old[0].after_json?.listingCycleId===p.listingCycleId&&
      old[0].after_json?.teamId===p.teamId&&old[0].after_json?.issuedTo===actor)
       return ok('F05_2_IDEMPOTENT',{responsibilityId:Number(old[0].responsibility_id)});
   return deny('F05_2_PREEXISTING_VEHICLE_NEVER_BACKFILL');
  }
  const event=(await c.query("SELECT responsibility_id FROM public.vehicle_current_responsibilities WHERE trusted_event_key=$1",[p.eventKey])).rows;
  if(event.length)return deny('F05_2_EVENT_REPLAY_OR_COLLISION');
  await c.query("INSERT INTO public.vehicles(vehicle_id,source_type,source_sale_status,platform_visibility,created_by_employee_id,formally_published_at) VALUES($1,$2,'available','visible',$3,transaction_timestamp())",[p.vehicleId,p.sourceKind,actor]);
  await c.query("INSERT INTO public.vehicle_listing_cycles(listing_cycle_id,vehicle_id,started_at) VALUES($1,$2,transaction_timestamp())",[p.listingCycleId,p.vehicleId]);
  const record=(await c.query("INSERT INTO public.vehicle_current_responsibilities(vehicle_id,listing_cycle_id,responsible_employee_id,team_id,source_snapshot,provenance_kind,trusted_event_key,issuer_employee_id) VALUES($1,$2,$3,$4,$5,'AUTHORIZED_MANUAL_PUBLICATION',$6,$3) RETURNING responsibility_id",
    [p.vehicleId,p.listingCycleId,actor,p.teamId,p.sourceKind,p.eventKey])).rows[0];
  await c.query("INSERT INTO public.audit_events(actor_kind,actor_id,role_context,object_kind,object_id,action,before_json,after_json,occurred_at) VALUES('employee',$1,$2::jsonb,'Vehicle',$3,'vehicle.manual.published',NULL,$4::jsonb,transaction_timestamp())",
    [String(actor),JSON.stringify({origin:'F05_2_NEW_MANUAL_PUBLISH_IN_SAME_TX',ciOnly:true}),String(p.vehicleId),
    JSON.stringify({eventKey:p.eventKey,vehicleId:p.vehicleId,listingCycleId:p.listingCycleId,sourceKind:p.sourceKind,teamId:p.teamId,issuedTo:actor})]);
  await c.query("INSERT INTO public.vehicle_responsibility_audit_events(responsibility_id,event_key,event_kind,actor_employee_id,current_employee_id,source_evidence) VALUES($1,$2,'ISSUE',$3,$3,'CI_ONLY_SAME_TX_PDM06_FORMAL_PUBLISH_WITH_VEHICLE_AND_CYCLE')",
    [record.responsibility_id,'audit:'+p.eventKey,actor]);
  if(onPublishInTransaction)await onPublishInTransaction(c,actor,Object.freeze({vehicleId:p.vehicleId,listingCycleId:p.listingCycleId,teamId:p.teamId,sourceKind:p.sourceKind,responsibilityId:Number(record.responsibility_id)}));
  return ok('F05_2_ISSUED',{responsibilityId:Number(record.responsibility_id)});
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
export async function transferCurrentResponsibility(auth,token,p,{testCheckpoint}={}){
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
  // Recipient eligibility/permission changes are serialized with this grant:
  // a governance trigger closing links for recipient uses the same advisory key.
  await c.query('SELECT pg_advisory_xact_lock(20261011,$1::integer)',[p.targetEmployeeId]);
  if(!old||old.revoked_at||Number(old.version)!==p.version||
     Number(old.listing_cycle_id)!==Number(v.listing_cycle_id)||
     Number(old.team_id)!==p.teamId||old.source_snapshot!==v.source_type||
     Number(old.responsible_employee_id)===p.targetEmployeeId)
   return deny('F05_2_TRANSFER_STALE');
  if(testCheckpoint!==undefined){
   if(process.env.CI!=='true'||process.env.GITHUB_ACTIONS!=='true'||typeof testCheckpoint!=='function')
    return deny('F05_2_CHECKPOINT_NOT_CI');
   await testCheckpoint('handover_responsibility_locked',c);
  }
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

export async function readMinimalCurrentVehicle(auth,token,p,{testCheckpoint}={}){
 if(!shape(p,'outlet,vehicleId')||!valid(p.vehicleId)||p.outlet!=='detail')return deny('F05_2_DETAIL_ONLY');
 return session(auth,token,async(c,actor)=>{
  const v=await lookup(c,p.vehicleId);
  if(!basic(v))return deny('F05_2_VEHICLE_STATE_DENIED');
  const r=(await c.query("SELECT responsibility_id,responsible_employee_id,team_id,source_snapshot,revoked_at FROM public.vehicle_current_responsibilities WHERE vehicle_id=$1 AND listing_cycle_id=$2 AND revoked_at IS NULL FOR SHARE",
    [p.vehicleId,v.listing_cycle_id])).rows;
  if(r.length!==1||r[0].source_snapshot!==v.source_type)return deny('F05_2_SCOPE_UNPROVEN');
  if(testCheckpoint!==undefined){
   if(process.env.CI!=='true'||process.env.GITHUB_ACTIONS!=='true'||typeof testCheckpoint!=='function')
    return deny('F05_2_CHECKPOINT_NOT_CI');
   await testCheckpoint('responsibility_locked',c);
  }
  // A-F05-2-01: ordinary sales cannot read a Vehicle handed to a different
  // CURRENT responsible employee, even if both still belong to the same team.
  const assignmentOwner=Number(r[0].responsible_employee_id);
  const readerRole=(await c.query("SELECT r.role_code FROM public.employees e JOIN public.roles r ON r.role_id=e.main_role_id WHERE e.employee_id=$1 AND e.employment_status='active' FOR SHARE OF e",[actor])).rows[0]?.role_code;
  if(readerRole==='sales'&&actor!==assignmentOwner)return deny('F05_2_NOT_CURRENT_RESPONSIBLE');
  if(!['sales','manager','store_head'].includes(readerRole))return deny('F05_2_READER_ROLE_DENIED');
  if(!await currentCapability(c,actor,Number(r[0].team_id),'vehicle.read'))return deny('F05_2_READ_SCOPE_DENIED');
  // Managers have no general "all teammate Vehicles" implicit right.
  // An independently proven current management capability + Team scope is required.
  if(actor!==assignmentOwner&&!await currentCapability(c,actor,Number(r[0].team_id),'vehicle.manage'))
   return deny('F05_2_MANAGER_CROSS_OBJECT_PROOF_MISSING');
  return ok('F05_2_MINIMAL_VEHICLE',{vehicleId:Number(v.vehicle_id),listingCycleId:Number(v.listing_cycle_id),sourceKind:v.source_type});
 });
}
export const forbiddenBusinessOutlets=Object.freeze(['list','export','copy','cache','print','history']);
