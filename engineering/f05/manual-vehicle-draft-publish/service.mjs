// PDM-06 manual Vehicle draft/publish. Isolated non-production PG16 only.
import {createHash,randomUUID} from 'node:crypto';
import {verify as verifyDraftSchema} from './migration.mjs';
import {publishAndIssueFromCurrentTransaction} from '../vehicle-stewardship-physical-scope/service.mjs';
import {publishNewFourSMemberVehicle} from '../four-s-member-trust-scope/source-gate.mjs';

const TABLE='f05_manual_vehicle_test.drafts';
const EVENT='f05_manual_vehicle_test.draft_events';
const FACTS='f05_manual_vehicle_test.published_vehicle_facts';
const allowedFields=new Set(['sourceType','brandId','seriesId','modelId','modelYear','mileageKm','city','vin','retailPriceCents','wholesalePriceCents','description','conditionTags']);
const integer=x=>Number.isSafeInteger(x)&&x>=0;
const positive=x=>Number.isSafeInteger(x)&&x>0;
const digest=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const reply=(status,code,extra={})=>({status,body:{code,productionReady:false,...extra}});
const ok=(code,extra={})=>reply(200,code,extra);
const missing=x=>reply(404,x);
class DraftError extends Error{
 constructor(code,status=409,extra={}){super(code);this.name='DraftError';this.code=code;this.status=status;this.extra=extra}
}
function isolated(env){
 const expected={CI:'true',GITHUB_ACTIONS:'true',APP_ENV:'test',NODE_ENV:'test',
  F05_2_ISOLATION_CONFIRM:'I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY',
  F05_MANUAL_VEHICLE_DRAFT_PUBLISH_CONSENT:'I_AUTHORIZE_F05_MANUAL_VEHICLE_DRAFT_PUBLISH_PG16_ONLY'};
 for(const [k,v] of Object.entries(expected))if(env[k]!==v)throw Error('F05_MANUAL_DRAFT_RUNTIME_DENIED_'+k);
 if(env.GITHUB_REPOSITORY!=='suzhe868-arch/mb'||env.GITHUB_EVENT_NAME!=='push'||
    env.GITHUB_REF!=='refs/heads/feat/f05-manual-vehicle-draft-publish-pg16-01')throw Error('F05_MANUAL_DRAFT_BRANCH_DENIED');
}
export function isMeaningfulPayload(payload){
 if(!payload||typeof payload!=='object'||Array.isArray(payload))return false;
 return Object.entries(payload).some(([k,v])=>k!=='sourceType'&&v!==null&&v!==undefined&&
  !(typeof v==='string'&&v.trim()==='')&&!(Array.isArray(v)&&v.length===0));
}
function normalizePayload(payload,fallbackSourceType){
 if(!payload||typeof payload!=='object'||Array.isArray(payload))throw new DraftError('PAYLOAD_OBJECT_REQUIRED',400);
 const keys=Object.keys(payload);
 if(keys.some(k=>!allowedFields.has(k)))throw new DraftError('UNSUPPORTED_PAYLOAD_FIELD',400);
 const value={...payload};
 if(value.sourceType===undefined&&fallbackSourceType)value.sourceType=fallbackSourceType;
 if(value.sourceType!==undefined&&!['mingbang','four_s'].includes(value.sourceType))throw new DraftError('SOURCE_TYPE_INVALID',400);
 if(Buffer.byteLength(JSON.stringify(value),'utf8')>24000)throw new DraftError('PAYLOAD_TOO_LARGE',413);
 if(value.description!==undefined&&value.description!==null&&(typeof value.description!=='string'||value.description.length>4000))
  throw new DraftError('DESCRIPTION_INVALID',400);
 if(value.conditionTags!==undefined&&(!Array.isArray(value.conditionTags)||value.conditionTags.length>50||
   value.conditionTags.some(x=>typeof x!=='string'||x.length>80)))throw new DraftError('CONDITION_TAGS_INVALID',400);
 for(const key of ['brandId','seriesId','modelId']){
  if(value[key]!==undefined&&value[key]!==null&&(!positive(value[key])||value[key]>2147483647))throw new DraftError('INVALID_FIELD_'+key,400);
 }
 if(value.modelYear!==undefined&&value.modelYear!==null&&(!Number.isSafeInteger(value.modelYear)||value.modelYear<1980||value.modelYear>2100))
  throw new DraftError('INVALID_FIELD_modelYear',400);
 if(value.mileageKm!==undefined&&value.mileageKm!==null&&(!Number.isSafeInteger(value.mileageKm)||value.mileageKm<0||value.mileageKm>3000000))
  throw new DraftError('INVALID_FIELD_mileageKm',400);
 if(value.city!==undefined&&value.city!==null&&(typeof value.city!=='string'||value.city.trim()!==value.city||value.city.length<2||value.city.length>100))
  throw new DraftError('INVALID_FIELD_city',400);
 if(value.vin!==undefined&&value.vin!==null&&value.vin!==''&&(typeof value.vin!=='string'||value.vin.trim()!==value.vin||value.vin.length>100))
  throw new DraftError('INVALID_FIELD_vin',400);
 for(const key of ['retailPriceCents','wholesalePriceCents']){
  if(value[key]!==undefined&&value[key]!==null&&(!Number.isSafeInteger(value[key])||value[key]<0||value[key]>100000000000))
   throw new DraftError('INVALID_FIELD_'+key,400);
 }
 return value;
}
async function currentTeamIds(c,employeeId){
 const q=await c.query(
  "SELECT DISTINCT t.team_id FROM public.employees e "+
  "JOIN public.roles role ON role.role_id=e.main_role_id "+
  "JOIN public.teams t ON t.store_id=e.store_id "+
  "JOIN public.stores st ON st.store_id=t.store_id "+
  "JOIN public.employee_team_memberships tm ON tm.employee_id=e.employee_id AND tm.team_id=t.team_id "+
  "JOIN public.permissions p ON p.permission_code='vehicle.manage' "+
  "LEFT JOIN public.role_permission_defaults rd ON rd.role_id=e.main_role_id AND rd.permission_id=p.permission_id "+
  "LEFT JOIN public.employee_permission_overrides ov ON ov.employee_id=e.employee_id AND ov.permission_id=p.permission_id "+
  "JOIN public.employee_data_scopes sc ON sc.employee_id=e.employee_id "+
  "JOIN public.employee_capability_scope_bindings sb ON sb.employee_id=e.employee_id AND sb.permission_id=p.permission_id AND sb.scope_id=sc.scope_id "+
  "WHERE e.employee_id=$1 AND e.employment_status='active' AND role.role_code IN ('sales','manager','store_head') "+
  "AND e.store_id=t.store_id AND t.team_status='active' AND st.status='active' "+
  "AND tm.valid_from<=statement_timestamp() AND (tm.ended_at IS NULL OR tm.ended_at>statement_timestamp()) "+
  "AND sc.ended_at IS NULL AND sc.scope_kind='team' AND sc.scope_reference_id=t.team_id "+
  "AND sb.granted_at<=statement_timestamp() AND (sb.ended_at IS NULL OR sb.ended_at>statement_timestamp()) "+
  "AND ov.decision IS DISTINCT FROM 'deny' AND (ov.decision='allow' OR (ov.decision IS NULL AND rd.enabled=true)) "+
  "ORDER BY t.team_id",[employeeId]);
 return q.rows.map(x=>Number(x.team_id));
}
async function currentFourS(c,employeeId){
 const account=(await c.query(
  "SELECT e.employee_id FROM public.employees e JOIN public.roles r ON r.role_id=e.main_role_id "+
  "JOIN public.pc_login_accounts a ON a.employee_id=e.employee_id AND a.principal_kind='employee' "+
  "WHERE e.employee_id=$1 AND e.employment_status='active' AND r.role_code='four_s' "+
  "AND a.credential_state='enabled' AND a.force_password_change=false FOR SHARE OF e,a",[employeeId])).rows;
 if(account.length!==1)return false;
 const permission=(await c.query(
  "SELECT EXISTS(SELECT 1 FROM public.permissions p JOIN public.employee_permission_overrides o ON o.permission_id=p.permission_id "+
  "WHERE o.employee_id=$1 AND p.permission_code='pc.four_s.vehicle.manage' AND o.decision='allow') permitted",[employeeId])).rows[0]?.permitted;
 return permission===true;
}
function sourceAllowed(actor,sourceType){
 return actor.kind==='four_s'?sourceType==='four_s':sourceType==='mingbang';
}
function validateActorSession(a,s){
 if(!a||!s||s.restricted||a.principal_kind!=='employee'||a.employee_id===null||a.system_admin_id!==null||
    a.subject_status!=='active'||a.credential_state!=='enabled'||a.force_password_change!==false)
  throw new DraftError('EMPLOYEE_SESSION_REQUIRED',401);
 const id=Number(a.employee_id);
 if(!positive(id)||id>2147483647)throw new DraftError('EMPLOYEE_ID_INVALID',401);
 return id;
}
export function createManualVehicleDraftService({auth,env=process.env}={}){
 isolated(env);
 if(!auth||!auth.pool||typeof auth.withSession!=='function')throw Error('F05_MANUAL_DRAFT_AUTH_SERVICE_REQUIRED');
 async function withActor(token,fn){
  try{
   await verifyDraftSchema(auth.pool);
   const out=await auth.withSession(token,async(c,a,s)=>{
    const employeeId=validateActorSession(a,s);
    if(a.role_code==='four_s'){
     if(!await currentFourS(c,employeeId))throw new DraftError('FOUR_S_CURRENT_PERMISSION_REQUIRED',403);
     return await fn(c,{employeeId,kind:'four_s',teamId:null,roleCode:'four_s'});
    }
    if(!['sales','manager','store_head'].includes(a.role_code))throw new DraftError('VEHICLE_MANAGE_SCOPE_DENIED',403);
    const teams=await currentTeamIds(c,employeeId);
    if(teams.length===0)throw new DraftError('VEHICLE_MANAGE_SCOPE_DENIED',403);
    if(teams.length!==1)throw new DraftError('TEAM_SCOPE_AMBIGUOUS',409);
    return await fn(c,{employeeId,kind:'mingbang',teamId:teams[0],roleCode:a.role_code});
   },{normalOnly:true});
   if(out===null||out===undefined)return reply(401,'EMPLOYEE_SESSION_REQUIRED');
   return out;
  }catch(e){return mapError(e)}
 }
 function mapError(e){
  if(e instanceof DraftError)return reply(e.status,e.code,e.extra);
  if(typeof e?.message==='string'&&e.message.startsWith('MANUAL_VEHICLE_')){
   const code=e.message.slice('MANUAL_VEHICLE_'.length);
   const status=code==='VIN_DUPLICATE'?409:code==='MODEL_MISSING'?422:code==='DRAFT_VERSION_CONFLICT'?409:503;
   return reply(status,code,{preserveDraft:true});
  }
  if(['23505','23503'].includes(e?.code))return reply(409,'PUBLICATION_CONFLICT',{preserveDraft:true});
  return reply(503,'MANUAL_VEHICLE_DEPENDENCY_NOT_READY',{preserveDraft:true});
 }
 async function findDraft(c,actor,draftId,{lock=false}={}){
  if(!positive(Number(draftId))||Number(draftId)>9223372036854775807)throw new DraftError('DRAFT_ID_INVALID',400);
  const suffix=lock?' FOR UPDATE':'';
  const q=await c.query(
   "SELECT draft_id,created_by_employee_id,draft_source_type,source_team_id,draft_payload,status,version,"+
   "reserved_vehicle_id,reserved_listing_cycle_id,published_vehicle_id,published_listing_cycle_id,created_at,"+
   "first_meaningful_at,last_autosaved_at,published_at FROM "+TABLE+
   " WHERE draft_id=$1 AND created_by_employee_id=$2 AND "+
   "((source_team_id IS NULL AND $3::bigint IS NULL) OR source_team_id=$3) AND draft_source_type=$4"+suffix,
   [draftId,actor.employeeId,actor.teamId,actor.kind==='four_s'?'four_s':'mingbang']);
  if(q.rows.length!==1)throw new DraftError('DRAFT_NOT_FOUND',404);
  return q.rows[0];
 }
 async function addEvent(c,actor,row,kind,payload,metadata={}){
  await c.query("INSERT INTO "+EVENT+"(event_key,draft_id,actor_employee_id,draft_source_type,event_kind,payload_sha256,event_metadata) "+
   "VALUES($1,$2,$3,$4,$5,$6,$7::jsonb)",
   ['manual-draft-event:'+randomUUID(),Number(row.draft_id),actor.employeeId,row.draft_source_type,kind,
    payload===null?null:digest(payload),JSON.stringify(metadata)]);
 }
 async function currentModel(c,payload){
  const q=await c.query(
   "SELECT m.model_id,m.brand_id,m.series_id,m.model_year,m.profile_status,b.brand_name,b.status AS brand_status,"+
   "s.series_name,s.status AS series_status,m.model_name FROM public.vehicle_models m "+
   "JOIN public.vehicle_series s ON s.series_id=m.series_id AND s.brand_id=m.brand_id "+
   "JOIN public.vehicle_brands b ON b.brand_id=m.brand_id "+
   "WHERE m.model_id=$1 AND m.brand_id=$2 AND m.series_id=$3 AND m.model_year=$4 "+
   "AND m.profile_status='complete' AND b.status='active' AND s.status='active' "+
   "AND length(btrim(b.brand_name))>0 AND length(btrim(s.series_name))>0 AND length(btrim(m.model_name))>0 FOR SHARE OF m,b,s",
   [payload.modelId,payload.brandId,payload.seriesId,payload.modelYear]);
  return q.rows.length===1?q.rows[0]:null;
 }
 async function completePayload(c,payload,sourceType){
  if(payload.sourceType!==sourceType)throw new DraftError('SOURCE_TYPE_MISMATCH',403);
  const required=['brandId','seriesId','modelId','modelYear','mileageKm','city'];
  const missingFields=required.filter(k=>payload[k]===undefined||payload[k]===null||payload[k]==='');
  if(missingFields.length)throw new DraftError('REQUIRED_FIELDS_MISSING',422,{missingFields,preserveDraft:true});
  if(!positive(payload.brandId)||!positive(payload.seriesId)||!positive(payload.modelId)||
     !Number.isSafeInteger(payload.modelYear)||payload.modelYear<1980||payload.modelYear>2100||
     !Number.isSafeInteger(payload.mileageKm)||payload.mileageKm<0||payload.mileageKm>3000000||
     typeof payload.city!=='string'||payload.city.trim()!==payload.city||payload.city.length<2||payload.city.length>100)
   throw new DraftError('INVALID_PUBLISH_FIELDS',422,{preserveDraft:true});
  const model=await currentModel(c,payload);
  if(!model)throw new DraftError('MODEL_MISSING',422,{preserveDraft:true});
  const vin=payload.vin===undefined||payload.vin===null||payload.vin===''?null:payload.vin;
  return {model,vin};
 }
 async function duplicateVin(c,vin,vehicleId=null){
  if(!vin)return null;
  const q=await c.query(
   "SELECT vehicle_id FROM public.vehicles WHERE vin=$1 AND source_type IN ('mingbang','four_s') "+
   "AND formally_published_at IS NOT NULL AND archived_at IS NULL AND ($2::bigint IS NULL OR vehicle_id<>$2) "+
   "ORDER BY vehicle_id LIMIT 1 FOR SHARE",[vin,vehicleId]);
  return q.rows.length?Number(q.rows[0].vehicle_id):null;
 }
 async function insertPublishedFacts(c,actor,row,payload,vehicleId,cycleId){
  const facts={
   brandId:payload.brandId,seriesId:payload.seriesId,modelId:payload.modelId,
   modelYear:payload.modelYear,mileageKm:payload.mileageKm,city:payload.city
  };
  await c.query("INSERT INTO "+FACTS+"(vehicle_id,listing_cycle_id,source_type,created_by_employee_id,brand_id,series_id,model_id,model_year,mileage_km,city,payload_snapshot) "+
   "VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb)",
   [vehicleId,cycleId,row.draft_source_type,actor.employeeId,payload.brandId,payload.seriesId,payload.modelId,
    payload.modelYear,payload.mileageKm,payload.city,JSON.stringify(facts)]);
 }
 async function publishCallback(c,actorId,expectedVersion,draftId,vehicleId,cycleId,sourceType,teamId){
  const row=(await c.query("SELECT draft_id,created_by_employee_id,draft_source_type,source_team_id,draft_payload,status,version,reserved_vehicle_id,reserved_listing_cycle_id "+
   "FROM "+TABLE+" WHERE draft_id=$1 FOR UPDATE",[draftId])).rows[0];
  if(!row||Number(row.created_by_employee_id)!==actorId||row.draft_source_type!==sourceType||
     (sourceType==='mingbang'&&Number(row.source_team_id)!==teamId)||
     Number(row.version)!==expectedVersion||row.status!=='draft'||
     Number(row.reserved_vehicle_id)!==vehicleId||Number(row.reserved_listing_cycle_id)!==cycleId)
   throw Error('MANUAL_VEHICLE_DRAFT_VERSION_CONFLICT');
  const payload=normalizePayload(row.draft_payload,sourceType);
  const valid=await completePayload(c,payload,sourceType);
  const duplicate=await duplicateVin(c,valid.vin,vehicleId);
  if(duplicate!==null)throw Error('MANUAL_VEHICLE_VIN_DUPLICATE');
  const updated=await c.query("UPDATE public.vehicles SET model_id=$1,vin=$2 WHERE vehicle_id=$3 AND source_type=$4 "+
   "AND formally_published_at IS NOT NULL AND archived_at IS NULL",[payload.modelId,valid.vin,vehicleId,sourceType]);
  if(updated.rowCount!==1)throw Error('MANUAL_VEHICLE_PUBLICATION_VEHICLE_MISMATCH');
  await insertPublishedFacts(c,{employeeId:actorId},row,payload,vehicleId,cycleId);
  const next=await c.query("UPDATE "+TABLE+" SET status='published',published_vehicle_id=$1,published_listing_cycle_id=$2,"+
   "published_at=transaction_timestamp(),version=version+1,last_autosaved_at=transaction_timestamp() "+
   "WHERE draft_id=$3 AND created_by_employee_id=$4 AND version=$5 AND status='draft' RETURNING draft_id,version",
   [vehicleId,cycleId,draftId,actorId,expectedVersion]);
  if(next.rowCount!==1)throw Error('MANUAL_VEHICLE_DRAFT_VERSION_CONFLICT');
  await addEvent(c,{employeeId:actorId},row,'PUBLISHED',payload,{vehicleId,listingCycleId:cycleId,version:Number(next.rows[0].version)});
  if(env.F05_MANUAL_INJECT_PUBLISH_ROLLBACK==='true')throw Error('MANUAL_VEHICLE_INJECTED_PUBLISH_ROLLBACK');
 }
 async function allocateId(c,table,column,reservedColumn,minValue){
  const seq=(await c.query('SELECT pg_get_serial_sequence($1,$2) AS seq',[ 'public.'+table,column ])).rows[0]?.seq;
  if(typeof seq!=='string'||!seq)throw Error('MANUAL_VEHICLE_IDENTITY_SEQUENCE_MISSING_'+table);
  const sequenceName=seq.split('.').pop().replace(/"/g,'');
  const last=(await c.query("SELECT last_value FROM pg_sequences WHERE schemaname='public' AND sequencename=$1",[sequenceName])).rows[0]?.last_value;
  const existing=(await c.query('SELECT COALESCE(MAX('+column+'),0) AS n FROM public.'+table)).rows[0].n;
  const reserved=(await c.query('SELECT COALESCE(MAX('+reservedColumn+'),0) AS n FROM '+TABLE)).rows[0].n;
  const floor=Math.max(Number(existing)||0,Number(reserved)||0,Number(last)||0,minValue-1);
  if(!Number.isSafeInteger(floor)||floor>=2147483647)throw new DraftError('VEHICLE_ID_SPACE_EXHAUSTED',503);
  await c.query('SELECT setval($1::regclass,$2::bigint,true)',[seq,floor]);
  const id=Number((await c.query('SELECT nextval($1::regclass) AS id',[seq])).rows[0].id);
  if(!Number.isSafeInteger(id)||id<minValue||id>2147483647)throw new DraftError('VEHICLE_ID_SPACE_EXHAUSTED',503);
  return id;
 }
 async function reservePublication(token,draftId,expectedVersion){
  return withActor(token,async(c,actor)=>{
   const row=await findDraft(c,actor,draftId,{lock:true});
   if(Number(row.version)!==expectedVersion)throw new DraftError('DRAFT_VERSION_CONFLICT',409,{currentVersion:Number(row.version)});
   if(row.status!=='draft'||row.published_vehicle_id!==null)throw new DraftError('DRAFT_NOT_PUBLISHABLE',409);
   const payload=normalizePayload(row.draft_payload,row.draft_source_type);
   const valid=await completePayload(c,payload,row.draft_source_type);
   const duplicate=await duplicateVin(c,valid.vin,null);
   if(duplicate!==null)throw new DraftError('VIN_DUPLICATE',409,{preserveDraft:true,existingVehicleReference:null});
   if(row.reserved_vehicle_id!==null&&row.reserved_listing_cycle_id!==null)
    return ok('PUBLICATION_IDS_RESERVED',{draftId:String(row.draft_id),vehicleId:Number(row.reserved_vehicle_id),listingCycleId:Number(row.reserved_listing_cycle_id),
      employeeId:actor.employeeId,teamId:actor.teamId,sourceType:row.draft_source_type,payload,version:expectedVersion});
   await c.query('SELECT pg_advisory_xact_lock(20261022,518)');
   const min=row.draft_source_type==='four_s'?60000:59000;
   const vehicleId=await allocateId(c,'vehicles','vehicle_id','reserved_vehicle_id',min);
   const cycleId=await allocateId(c,'vehicle_listing_cycles','listing_cycle_id','reserved_listing_cycle_id',min);
   await c.query('UPDATE '+TABLE+' SET reserved_vehicle_id=$1,reserved_listing_cycle_id=$2 WHERE draft_id=$3 AND version=$4 AND status=\'draft\'',
    [vehicleId,cycleId,draftId,expectedVersion]);
   return ok('PUBLICATION_IDS_RESERVED',{draftId:String(row.draft_id),vehicleId,listingCycleId:cycleId,
    employeeId:actor.employeeId,teamId:actor.teamId,sourceType:row.draft_source_type,payload,version:expectedVersion});
  });
 }
 return Object.freeze({
  async autoSave(token,input){
   try{
    if(!input||typeof input!=='object'||Array.isArray(input))throw new DraftError('REQUEST_OBJECT_REQUIRED',400);
    const draftId=input.draftId;
    const expectedVersion=input.expectedVersion;
    const raw=input.payload;
    if(draftId!==undefined&&draftId!==null){
     if(!positive(Number(draftId)))throw new DraftError('DRAFT_ID_INVALID',400);
     if(!positive(Number(expectedVersion)))throw new DraftError('EXPECTED_VERSION_REQUIRED',428);
    }
    return await withActor(token,async(c,actor)=>{
     if(raw===undefined)throw new DraftError('PAYLOAD_REQUIRED',400);
     let payload=normalizePayload(raw,draftId?undefined:undefined);
     if(!draftId&&!isMeaningfulPayload(payload))return ok('DRAFT_NOT_PERSISTED',{persisted:false});
     if(draftId){
      const row=await findDraft(c,actor,draftId,{lock:true});
      if(row.status!=='draft'||row.published_vehicle_id!==null)throw new DraftError('DRAFT_NOT_EDITABLE',409);
      if(Number(row.version)!==Number(expectedVersion))throw new DraftError('DRAFT_VERSION_CONFLICT',409,{currentVersion:Number(row.version)});
      payload=normalizePayload(raw,row.draft_source_type);
      if(payload.sourceType!==row.draft_source_type||!sourceAllowed(actor,payload.sourceType))throw new DraftError('SOURCE_TYPE_NOT_ALLOWED',403);
      const next=await c.query('UPDATE '+TABLE+' SET draft_source_type=$1,draft_payload=$2::jsonb,version=version+1,last_autosaved_at=transaction_timestamp() '+
       'WHERE draft_id=$3 AND version=$4 AND status=\'draft\' RETURNING draft_id,version,last_autosaved_at',
       [row.draft_source_type,JSON.stringify(payload),draftId,expectedVersion]);
      if(next.rowCount!==1)throw new DraftError('DRAFT_VERSION_CONFLICT',409);
      await addEvent(c,actor,row,'AUTOSAVED',payload,{version:Number(next.rows[0].version)});
      return ok('DRAFT_AUTOSAVED',{persisted:true,draftId:String(draftId),version:Number(next.rows[0].version),lastAutosavedAt:next.rows[0].last_autosaved_at});
     }
     if(!payload.sourceType)throw new DraftError('SOURCE_TYPE_REQUIRED',422);
     if(!sourceAllowed(actor,payload.sourceType))throw new DraftError('SOURCE_TYPE_NOT_ALLOWED',403);
     const teamId=actor.kind==='mingbang'?actor.teamId:null;
     const row=(await c.query('INSERT INTO '+TABLE+
      '(created_by_employee_id,draft_source_type,source_team_id,draft_payload,first_meaningful_at,last_autosaved_at) '+
      'VALUES($1,$2,$3,$4::jsonb,transaction_timestamp(),transaction_timestamp()) '+
      'RETURNING draft_id,draft_source_type,version,created_at,last_autosaved_at',
      [actor.employeeId,payload.sourceType,teamId,JSON.stringify(payload)])).rows[0];
     await addEvent(c,actor,row,'CREATED',payload,{version:1});
     return reply(201,'DRAFT_CREATED',{persisted:true,draftId:String(row.draft_id),sourceType:row.draft_source_type,
      version:Number(row.version),createdAt:row.created_at,lastAutosavedAt:row.last_autosaved_at});
    });
   }catch(e){return mapError(e)}
  },
  async list(token){
   return withActor(token,async(c,actor)=>{
    const q=await c.query('SELECT draft_id,draft_source_type,version,created_at,last_autosaved_at FROM '+TABLE+
     ' WHERE created_by_employee_id=$1 AND status=\'draft\' AND '+
     '((source_team_id IS NULL AND $2::bigint IS NULL) OR source_team_id=$2) AND draft_source_type=$3 '+
     'ORDER BY last_autosaved_at DESC,draft_id DESC LIMIT 100',
     [actor.employeeId,actor.teamId,actor.kind==='four_s'?'four_s':'mingbang']);
    return ok('DRAFT_LIST',{drafts:q.rows.map(x=>({draftId:String(x.draft_id),sourceType:x.draft_source_type,
     version:Number(x.version),createdAt:x.created_at,lastAutosavedAt:x.last_autosaved_at}))});
   });
  },
  async get(token,draftId){
   return withActor(token,async(c,actor)=>{
    const row=await findDraft(c,actor,draftId);
    return ok(row.status==='published'?'DRAFT_PUBLISHED':'DRAFT_DETAIL',{
     draft:{draftId:String(row.draft_id),sourceType:row.draft_source_type,payload:row.draft_payload,
      status:row.status,version:Number(row.version),createdAt:row.created_at,firstMeaningfulAt:row.first_meaningful_at,
      lastAutosavedAt:row.last_autosaved_at,publishedVehicleId:row.published_vehicle_id===null?null:String(row.published_vehicle_id),
      publishedListingCycleId:row.published_listing_cycle_id===null?null:String(row.published_listing_cycle_id),publishedAt:row.published_at}
    });
   });
  },
  async deleteDraft(token,draftId,input){
   try{
    if(!input||input.confirm!==true||!positive(Number(input.expectedVersion)))throw new DraftError('DRAFT_DELETE_CONFIRMATION_REQUIRED',400);
    return await withActor(token,async(c,actor)=>{
     const row=await findDraft(c,actor,draftId,{lock:true});
     if(row.status!=='draft'||row.published_vehicle_id!==null||row.published_listing_cycle_id!==null||row.published_at!==null)
      throw new DraftError('PUBLISHED_VEHICLE_CANNOT_BE_DELETED',409);
     if(Number(row.version)!==Number(input.expectedVersion))throw new DraftError('DRAFT_VERSION_CONFLICT',409,{currentVersion:Number(row.version)});
     if(row.reserved_vehicle_id!==null){
      const exists=(await c.query('SELECT 1 FROM public.vehicles WHERE vehicle_id=$1 UNION ALL SELECT 1 FROM public.vehicle_listing_cycles WHERE listing_cycle_id=$2 LIMIT 1',
       [row.reserved_vehicle_id,row.reserved_listing_cycle_id])).rowCount;
      if(exists)throw new DraftError('DRAFT_ALREADY_HAS_PUBLIC_RELATION',409);
     }
     await addEvent(c,actor,row,'DELETED',row.draft_payload,{deletedVersion:Number(row.version)});
     const deleted=await c.query('DELETE FROM '+TABLE+' WHERE draft_id=$1 AND version=$2 AND status=\'draft\'', [draftId,input.expectedVersion]);
     if(deleted.rowCount!==1)throw new DraftError('DRAFT_VERSION_CONFLICT',409);
     return ok('DRAFT_DELETED',{deleted:true,draftId:String(draftId)});
    });
   }catch(e){return mapError(e)}
  },
  async publish(token,draftId,input){
   try{
    if(!input||!positive(Number(input.expectedVersion)))throw new DraftError('EXPECTED_VERSION_REQUIRED',428);
    const reserved=await reservePublication(token,draftId,Number(input.expectedVersion));
    if(reserved.status!==200||reserved.body.code!=='PUBLICATION_IDS_RESERVED')return reserved;
    const {vehicleId,listingCycleId,employeeId,teamId,sourceType,payload,version}=reserved.body;
    const eventKey='manual-draft-publish:'+randomUUID();
    const onPublishInTransaction=async(c,actorId,proof)=>{
     if(Number(actorId)!==employeeId)throw Error('MANUAL_VEHICLE_ACTOR_CHANGED');
     await publishCallback(c,employeeId,version,Number(draftId),vehicleId,listingCycleId,sourceType,teamId);
    };
    let published;
    try{
     if(sourceType==='mingbang'){
      published=await publishAndIssueFromCurrentTransaction(auth,token,{
       eventKey,listingCycleId,sourceKind:'mingbang',teamId,vehicleId
      },{onPublishInTransaction});
     }else{
      published=await publishNewFourSMemberVehicle(auth,token,{
       brandId:payload.brandId,city:payload.city,eventKey,listingCycleId,mileageKm:payload.mileageKm,
       modelId:payload.modelId,modelYear:payload.modelYear,seriesId:payload.seriesId,sourceKind:'four_s',vehicleId
      },{onPublishInTransaction});
     }
    }catch(e){return mapError(e)}
    const final=await withActor(token,async(c,actor)=>{
     const row=await findDraft(c,actor,draftId);
     if(row.status==='published'&&Number(row.published_vehicle_id)===vehicleId&&Number(row.published_listing_cycle_id)===listingCycleId)
      return ok('VEHICLE_PUBLISHED',{draftId:String(draftId),vehicleId:String(vehicleId),listingCycleId:String(listingCycleId),
       sourceType,version:Number(row.version),productionReady:false});
     return null;
    });
    if(final?.status===200&&final.body?.code==='VEHICLE_PUBLISHED')return final;
    if(published?.allowed===true&&['F05_2_ISSUED','F05_3A_MEMBER_VEHICLE_ISSUED'].includes(published.code))
     return ok('VEHICLE_PUBLISHED',{draftId:String(draftId),vehicleId:String(vehicleId),listingCycleId:String(listingCycleId),sourceType,productionReady:false});
    const code=published?.code||'PUBLICATION_DENIED';
    if(code==='F05_3A_INVALID_PHYSICAL_MODEL_ID')return reply(422,'MODEL_MISSING',{preserveDraft:true});
    if(code==='F05_2_MANUAL_PUBLICATION_SCOPE_DENIED'||code==='F05_3A_MEMBER_PERMISSION_OR_ROLE_DENIED'||code==='POSITIVE_4S_TRUST_SOURCE_BLOCKED')
     return reply(403,'PUBLICATION_AUTHORITY_DENIED',{preserveDraft:true});
    if(code==='F05_2_NEW_MANUAL_PUBLICATION_INPUT_DENY'||code==='F05_3A_PDM06_FIELDS_INVALID')
     return reply(422,'PUBLICATION_FIELDS_INVALID',{preserveDraft:true});
    return reply(409,'PUBLICATION_CONFLICT',{preserveDraft:true});
   }catch(e){return mapError(e)}
  }
 });
}
