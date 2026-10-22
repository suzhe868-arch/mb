// Issue #216: isolated, non-production staged edits of EXISTING trusted manual Vehicles.
// No production runtime registration. Never grants stewardship or 4S member license.
import {verify,assertIsolated} from './migration.mjs';
const S='f05_published_edit_test';
const keys=new Set(['modelId','brandId','seriesId','modelYear','mileageKm','city','vin','description','conditionTags','customerListPriceCents','internalWholesalePriceCents']);
const internal='internalWholesalePriceCents';
const number=x=>Number.isSafeInteger(x)&&x>0&&x<=2147483647;
const ok=(code,extra={})=>({status:200,body:{code,ciOnly:true,productionReady:false,...extra}});
const error=(status,code)=>({status,body:{code,ciOnly:true,productionReady:false}});
class Denied extends Error{constructor(code,status=403){super(code);this.status=status}}
function inputId(x){const n=Number(x);if(!number(n))throw new Denied('VEHICLE_ID_INVALID',400);return n}
const view=(o,canInternal)=>{const r={...o};if(!canInternal)delete r[internal];return r};
const asObject=o=>o!==null&&typeof o==='object'&&!Array.isArray(o);
function validatePatch(p){
 if(!asObject(p)||Object.keys(p).length===0)throw new Denied('EDIT_PATCH_REQUIRED',400);
 if(Object.keys(p).some(k=>!keys.has(k)))throw new Denied('EDIT_FIELD_FORBIDDEN',400);
 if(Buffer.byteLength(JSON.stringify(p))>16000)throw new Denied('EDIT_PATCH_TOO_LARGE',413);
 for(const k of ['modelId','brandId','seriesId']){
  if(k in p&&p[k]!==null&&!number(p[k]))throw new Denied('EDIT_FIELD_INVALID',422);
 }
 if('modelYear'in p&&p.modelYear!==null&&(!Number.isSafeInteger(p.modelYear)||p.modelYear<1980||p.modelYear>2100))throw new Denied('EDIT_FIELD_INVALID',422);
 if('mileageKm'in p&&p.mileageKm!==null&&(!Number.isSafeInteger(p.mileageKm)||p.mileageKm<0||p.mileageKm>3000000))throw new Denied('EDIT_FIELD_INVALID',422);
 if('city'in p&&p.city!==null&&(typeof p.city!=='string'||p.city.trim()!==p.city||p.city.length<2||p.city.length>100))throw new Denied('EDIT_FIELD_INVALID',422);
 if('vin'in p&&p.vin!==null&&p.vin!==''&&(typeof p.vin!=='string'||p.vin!==p.vin.trim()||p.vin.length>100))throw new Denied('EDIT_FIELD_INVALID',422);
 if('description'in p&&p.description!==null&&(typeof p.description!=='string'||p.description.length>4000))throw new Denied('EDIT_FIELD_INVALID',422);
 if('conditionTags'in p&&p.conditionTags!==null&&(!Array.isArray(p.conditionTags)||p.conditionTags.length>50||p.conditionTags.some(v=>typeof v!=='string'||v.length>80)))throw new Denied('EDIT_FIELD_INVALID',422);
 for(const k of ['customerListPriceCents',internal]){
  if(k in p&&p[k]!==null&&(!Number.isSafeInteger(p[k])||p[k]<0||p[k]>100000000000))throw new Denied('EDIT_PRICE_INVALID',422);
 }
 return p;
}
function actorId(a,s){
 if(s?.restricted||a?.principal_kind!=='employee'||a?.system_admin_id!==null||
  a?.subject_status!=='active'||a?.credential_state!=='enabled'||a?.force_password_change!==false||
  !number(Number(a.employee_id)))throw new Denied('CURRENT_EMPLOYEE_SESSION_REQUIRED',401);
 return Number(a.employee_id);
}
async function teamCapability(c,id,team,cap){
 const x=await c.query(
 "SELECT EXISTS(SELECT 1 FROM public.employees e JOIN public.roles role ON role.role_id=e.main_role_id "+
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
 "AND ov.decision IS DISTINCT FROM 'deny' AND (ov.decision='allow' OR (ov.decision IS NULL AND rd.enabled=true))) AS permitted",[id,team,cap]);
 return x.rows[0]?.permitted===true;
}
async function authorized(c,id,role,v){
 if(v.source_type==='mingbang'){
  if(!['sales','manager','store_head'].includes(role))throw new Denied('OBJECT_SCOPE_DENIED');
  const r=(await c.query(
   "SELECT responsible_employee_id,team_id,source_snapshot FROM public.vehicle_current_responsibilities "+
   "WHERE vehicle_id=$1 AND listing_cycle_id=$2 AND revoked_at IS NULL FOR SHARE",[v.vehicle_id,v.listing_cycle_id])).rows;
  if(r.length!==1||r[0].source_snapshot!=='mingbang')throw new Denied('OBJECT_SCOPE_DENIED');
  const owner=Number(r[0].responsible_employee_id),team=Number(r[0].team_id);
  if(role==='sales'&&owner!==id)throw new Denied('OBJECT_SCOPE_DENIED');
  if(!await teamCapability(c,id,team,'vehicle.manage'))throw new Denied('OBJECT_SCOPE_DENIED');
  return {kind:'mingbang',canInternal:await teamCapability(c,id,team,'internal.price.view')};
 }
 if(v.source_type==='four_s'){
  if(role!=='four_s'||Number(v.created_by_employee_id)!==id)throw new Denied('OBJECT_SCOPE_DENIED');
  const r=(await c.query(
   "SELECT p.publication_id FROM public.f05_3a_member_publications p "+
   "JOIN public.f05_3a_member_create_licenses l ON l.license_id=p.license_id "+
   "JOIN public.employees e ON e.employee_id=p.member_employee_id "+
   "JOIN public.pc_login_accounts a ON a.employee_id=e.employee_id AND a.principal_kind='employee' "+
   "JOIN public.employee_permission_overrides ov ON ov.employee_id=e.employee_id "+
   "JOIN public.permissions perm ON perm.permission_id=ov.permission_id AND perm.permission_code='pc.four_s.vehicle.manage' "+
   "WHERE p.vehicle_id=$1 AND p.listing_cycle_id=$2 AND p.member_employee_id=$3 AND p.revoked_at IS NULL "+
   "AND l.revoked_at IS NULL AND l.employee_id=$3 AND e.employment_status='active' "+
   "AND a.credential_state='enabled' AND a.force_password_change=false AND ov.decision='allow' "+
   "FOR SHARE OF p,l,e,a,ov",[v.vehicle_id,v.listing_cycle_id,id])).rows;
  if(r.length!==1)throw new Denied('FOUR_S_CURRENT_LICENSE_DENIED');
  return {kind:'four_s',canInternal:false};
 }
 throw new Denied('NON_MANUAL_SOURCE_DENIED');
}
async function model(c,fields){
 const r=(await c.query(
  "SELECT m.model_id,m.brand_id,m.series_id,m.model_year FROM public.vehicle_models m "+
  "JOIN public.vehicle_series s ON s.series_id=m.series_id AND s.brand_id=m.brand_id "+
  "JOIN public.vehicle_brands b ON b.brand_id=m.brand_id "+
  "WHERE m.model_id=$1 AND m.brand_id=$2 AND m.series_id=$3 AND m.model_year=$4 "+
  "AND m.profile_status='complete' AND s.status='active' AND b.status='active' "+
  "AND length(btrim(m.model_name))>0 AND length(btrim(s.series_name))>0 AND length(btrim(b.brand_name))>0 "+
  "FOR SHARE OF m,s,b",[fields.modelId,fields.brandId,fields.seriesId,fields.modelYear])).rows;
 if(r.length!==1)throw new Denied('MODEL_MISSING',422);
}
async function getVehicle(c,id,exclusive=false){
 const v=(await c.query(
  "SELECT v.vehicle_id,v.source_type,v.source_sale_status,v.archived_at,v.created_by_employee_id,v.model_id,v.vin, "+
  "cy.listing_cycle_id FROM public.vehicles v JOIN public.vehicle_listing_cycles cy ON cy.vehicle_id=v.vehicle_id "+
  "WHERE v.vehicle_id=$1 AND v.source_type IN ('mingbang','four_s') AND v.formally_published_at IS NOT NULL "+
  "AND v.archived_at IS NULL AND cy.ended_at IS NULL ORDER BY cy.started_at DESC,cy.listing_cycle_id DESC LIMIT 1 "+
  (exclusive?'FOR UPDATE OF v,cy':'FOR SHARE OF v,cy'),[id])).rows[0];
 if(!v||v.source_sale_status!=='available')throw new Denied('VEHICLE_NOT_CURRENT',409);
 return v;
}
async function state(c,v){
 let s=(await c.query('SELECT * FROM '+S+'.vehicle_edit_state WHERE vehicle_id=$1 FOR UPDATE',[v.vehicle_id])).rows[0];
 if(s){
  if(Number(s.listing_cycle_id)!==Number(v.listing_cycle_id)||s.source_type!==v.source_type||
   Number(s.effective_fields.modelId||0)!==Number(v.model_id||0)||String(s.effective_fields.vin||'')!==String(v.vin||''))
   throw new Denied('CURRENT_VEHICLE_CHANGED_OUTSIDE_EDIT',409);
  return s;
 }
 // Accepted #214 first-publish source is mandatory. Physical public model/VIN
 // alone never proves original mileage, city, description or condition history.
 // One-to-one draft/publication/F05-2/3A provenance is joined UNDER the current
 // Vehicle/Cycle lock, fail closed rather than mint fictitious empty fields.
 const origin=(await c.query(
  "SELECT f.brand_id,f.series_id,f.model_id,f.model_year,f.mileage_km,f.city,"+
  "f.payload_snapshot,f.created_by_employee_id,f.source_type,f.listing_cycle_id,"+
  "d.draft_payload,d.created_by_employee_id AS original_actor,d.source_team_id,"+
  "d.published_vehicle_id,d.published_listing_cycle_id,d.published_at AS draft_published_at,"+
  "e.payload_sha256 AS published_event_hash "+
  "FROM f05_manual_vehicle_test.published_vehicle_facts f "+
  "JOIN f05_manual_vehicle_test.drafts d ON d.published_vehicle_id=f.vehicle_id "+
  " AND d.published_listing_cycle_id=f.listing_cycle_id AND d.status='published' "+
  "JOIN f05_manual_vehicle_test.draft_events e ON e.draft_id=d.draft_id AND e.event_kind='PUBLISHED' "+
  " AND e.event_metadata->>'vehicleId'=f.vehicle_id::text "+
  "WHERE f.vehicle_id=$1 AND f.listing_cycle_id=$2 AND f.source_type=$3 "+
  "FOR SHARE OF f,d,e",[v.vehicle_id,v.listing_cycle_id,v.source_type])).rows;
 if(origin.length!==1)throw new Denied('PUBLISHED_SOURCE_GAP',409);
 const o=origin[0],p=o.draft_payload,f=o.payload_snapshot;
 if(!asObject(p)||!asObject(f)||p.sourceType!==v.source_type||
  Number(o.original_actor)!==Number(o.created_by_employee_id)||
  Number(o.created_by_employee_id)!==Number(v.created_by_employee_id)||
  Number(o.published_vehicle_id)!==Number(v.vehicle_id)||
  Number(o.published_listing_cycle_id)!==Number(v.listing_cycle_id)||
  Number(o.listing_cycle_id)!==Number(v.listing_cycle_id)||
  Number(o.model_id)!==Number(v.model_id)||
  String(p.vin||'')!==String(v.vin||'')||
  !o.published_event_hash||!o.draft_published_at||
  ['brandId','seriesId','modelId','modelYear','mileageKm','city'].some(k=>p[k]!==f[k])||
  Number(f.modelId)!==Number(v.model_id)||
  Number(f.brandId)!==Number(o.brand_id)||
  Number(f.seriesId)!==Number(o.series_id)||
  Number(f.modelYear)!==Number(o.model_year)||
  Number(f.mileageKm)!==Number(o.mileage_km)||f.city!==o.city)
  throw new Denied('PUBLISHED_SOURCE_CONFLICT',409);
 // For 4S the original governed publication receipt is an independent source
 // consistency condition, not a substitute for the #214 payload.
 if(v.source_type==='four_s'){
  const receipt=(await c.query(
   "SELECT mileage_km,city,member_employee_id FROM public.f05_3a_member_publications "+
   "WHERE vehicle_id=$1 AND listing_cycle_id=$2 AND revoked_at IS NULL FOR SHARE",
   [v.vehicle_id,v.listing_cycle_id])).rows;
  if(receipt.length!==1||Number(receipt[0].mileage_km)!==Number(o.mileage_km)||
   receipt[0].city!==o.city||Number(receipt[0].member_employee_id)!==Number(v.created_by_employee_id))
   throw new Denied('PUBLISHED_SOURCE_CONFLICT',409);
 }
 const facts={modelId:Number(o.model_id),brandId:Number(o.brand_id),seriesId:Number(o.series_id),
  modelYear:Number(o.model_year),mileageKm:Number(o.mileage_km),city:o.city,vin:v.vin||null};
 const originalPrices={customerListPriceCents:'retailPriceCents',internalWholesalePriceCents:'wholesalePriceCents'};
 const sourceGaps=[];
 for(const field of ['description','conditionTags',...Object.keys(originalPrices)]){
  const sourceKey=originalPrices[field]||field;
  if(Object.hasOwn(p,sourceKey)&&p[sourceKey]!==undefined){
   if(field==='conditionTags'&&!Array.isArray(p[sourceKey]))throw new Denied('PUBLISHED_SOURCE_CONFLICT',409);
   facts[field]=p[sourceKey];
  }else sourceGaps.push(field);
 }
 // Explicit absence is SOURCE_GAP, never fabricate an empty condition/price.
 if(sourceGaps.length)facts.sourceGaps=sourceGaps;

 s=(await c.query('INSERT INTO '+S+'.vehicle_edit_state(vehicle_id,listing_cycle_id,source_type,effective_fields) VALUES($1,$2,$3,$4::jsonb) RETURNING *',
  [v.vehicle_id,v.listing_cycle_id,v.source_type,JSON.stringify(facts)])).rows[0];
 return s;
}
function sanitizeError(e){
 if(e instanceof Denied)return error(e.status,e.message);
 if(['23505','23503','40P01','40001','55P03'].includes(e?.code))return error(409,'PG16_CONCURRENT_CHANGE');
 return error(503,'EDIT_SERVICE_UNAVAILABLE');
}
export function createPublishedEditService({auth,env=process.env,hooks}={}){
 assertIsolated(env);
 if(!auth?.pool||typeof auth.withSession!=='function')throw Error('F05_EDIT_TRUSTED_SESSION_REQUIRED');
 async function execute(token,id,operation){
  try{
   const vehicleId=inputId(id);
   await verify(auth.pool);
   const result=await auth.withSession(token,async(c,a,s)=>{
    const who=actorId(a,s);
    // Same transaction key and lock order used by F05-2 stewardship and 4S governance.
    await c.query('SELECT pg_advisory_xact_lock(20261011,$1::integer)',[who]);
    const vehicle=await getVehicle(c,vehicleId,true);
    const access=await authorized(c,who,a.role_code,vehicle);
    const current=await state(c,vehicle);
    const staged=(await c.query('SELECT * FROM '+S+'.staged_changes WHERE vehicle_id=$1 FOR UPDATE',[vehicleId])).rows[0]||null;
    return operation(c,{who,vehicle,current,staged,access});
   },{normalOnly:true});
   return result??error(401,'CURRENT_EMPLOYEE_SESSION_REQUIRED');
  }catch(e){return sanitizeError(e)}
 }
 const checkDraft=(ctx,expected)=>{
  if(!ctx.staged||Number(ctx.staged.actor_employee_id)!==ctx.who)throw new Denied('EDIT_DRAFT_NOT_FOUND',404);
  if(Number(ctx.staged.version)!==expected)throw new Denied('EDIT_DRAFT_VERSION_CONFLICT',409);
  if(Number(ctx.staged.base_version)!==Number(ctx.current.version))throw new Denied('EDIT_EFFECTIVE_VERSION_CONFLICT',409);
 };
 const projection=ctx=>({vehicleId:String(ctx.vehicle.vehicle_id),listingCycleId:String(ctx.vehicle.listing_cycle_id),
  sourceType:ctx.vehicle.source_type,currentVersion:Number(ctx.current.version),
  effective:view(ctx.current.effective_fields,ctx.access.canInternal),
  draft:ctx.staged&&Number(ctx.staged.actor_employee_id)===ctx.who?{
   stageVersion:Number(ctx.staged.version),baseVersion:Number(ctx.staged.base_version),
   patch:view(ctx.staged.patch,ctx.access.canInternal),
   preview:view({...ctx.current.effective_fields,...ctx.staged.patch},ctx.access.canInternal)}:null,
  projection:'CI_ONLY_PROJECTION',impactStatus:'NOT_CONNECTED_SOURCE_GAP'});
 return Object.freeze({
  get(token,id){return execute(token,id,async(c,ctx)=>ok('EDIT_DETAIL',projection(ctx)))},
  stage(token,id,input){
   return execute(token,id,async(c,ctx)=>{
    if(!asObject(input))throw new Denied('EDIT_REQUEST_INVALID',400);
    const patch=validatePatch(input.patch);
    if(internal in patch&&!ctx.access.canInternal)throw new Denied('INTERNAL_PRICE_FORBIDDEN');
    if(Number(input.expectedCurrentVersion)!==Number(ctx.current.version))throw new Denied('EDIT_EFFECTIVE_VERSION_CONFLICT',409);
    if(ctx.staged){
     checkDraft(ctx,Number(input.expectedStageVersion));
     const merged={...ctx.staged.patch,...patch};
     const q=await c.query('UPDATE '+S+'.staged_changes SET patch=$2::jsonb,version=version+1,updated_at=transaction_timestamp() WHERE vehicle_id=$1 AND version=$3 RETURNING version',
      [ctx.vehicle.vehicle_id,JSON.stringify(merged),ctx.staged.version]);
     if(q.rowCount!==1)throw new Denied('EDIT_DRAFT_VERSION_CONFLICT',409);
     return ok('EDIT_STAGED',{stageVersion:Number(q.rows[0].version),currentVersion:Number(ctx.current.version),
      preview:view({...ctx.current.effective_fields,...merged},ctx.access.canInternal),projection:'CI_ONLY_PROJECTION'});
    }
    if(input.expectedStageVersion!==null&&input.expectedStageVersion!==undefined)throw new Denied('EDIT_DRAFT_VERSION_CONFLICT',409);
    const q=await c.query('INSERT INTO '+S+'.staged_changes(vehicle_id,actor_employee_id,base_version,patch) VALUES($1,$2,$3,$4::jsonb) RETURNING version',
     [ctx.vehicle.vehicle_id,ctx.who,ctx.current.version,JSON.stringify(patch)]);
    return ok('EDIT_STAGED',{stageVersion:Number(q.rows[0].version),currentVersion:Number(ctx.current.version),
     preview:view({...ctx.current.effective_fields,...patch},ctx.access.canInternal),projection:'CI_ONLY_PROJECTION'});
   });
  },
  cancel(token,id,input){
   return execute(token,id,async(c,ctx)=>{
    if(!asObject(input))throw new Denied('EDIT_REQUEST_INVALID',400);
    checkDraft(ctx,Number(input.expectedStageVersion));
    await c.query('DELETE FROM '+S+'.staged_changes WHERE vehicle_id=$1 AND version=$2',[ctx.vehicle.vehicle_id,ctx.staged.version]);
    return ok('EDIT_CANCELLED',{currentVersion:Number(ctx.current.version)});
   });
  },
  commit(token,id,input){
   return execute(token,id,async(c,ctx)=>{
    if(!asObject(input)||typeof input.requestKey!=='string'||!/^[a-zA-Z0-9._:-]{20,160}$/.test(input.requestKey))
     throw new Denied('EDIT_COMMIT_REQUEST_KEY_REQUIRED',400);
    const oldAudit=(await c.query('SELECT vehicle_id,actor_employee_id,next_version FROM '+S+'.edit_audit WHERE event_key=$1',[input.requestKey])).rows[0];
    if(oldAudit){
     if(Number(oldAudit.vehicle_id)===Number(ctx.vehicle.vehicle_id)&&Number(oldAudit.actor_employee_id)===ctx.who)
      return ok('EDIT_ALREADY_APPLIED',{currentVersion:Number(oldAudit.next_version)});
     throw new Denied('EDIT_REQUEST_KEY_REPLAY',409);
    }
    checkDraft(ctx,Number(input.expectedStageVersion));
    if(Number(input.expectedCurrentVersion)!==Number(ctx.current.version))throw new Denied('EDIT_EFFECTIVE_VERSION_CONFLICT',409);
    const p=validatePatch(ctx.staged.patch);
    if(internal in p&&!ctx.access.canInternal)throw new Denied('INTERNAL_PRICE_FORBIDDEN');
    // Test-only barrier, transaction/row/advisory locks already acquired.
    // Exercises real physical PG16 governance-vs-commit serialization.
    if(hooks?.beforeCommit){
     if(process.env.CI!=='true'||process.env.GITHUB_ACTIONS!=='true'||typeof hooks.beforeCommit!=='function')throw new Denied('TEST_CHECKPOINT_DENIED');
     await hooks.beforeCommit({vehicleId:Number(ctx.vehicle.vehicle_id),actorId:ctx.who},c);
    }
    const fields={...ctx.current.effective_fields,...p};
    if(!['number'].includes(typeof fields.modelId)||!number(fields.modelId)||!number(fields.brandId)||!number(fields.seriesId))
     throw new Denied('MODEL_MISSING',422);
    await model(c,fields);
    const vin=fields.vin===null||fields.vin===''?null:fields.vin;
    if(vin!==null){
     await c.query('SELECT pg_advisory_xact_lock(20261023,hashtext($1::text))',[vin]);
     const duplicate=(await c.query(
      "SELECT vehicle_id FROM public.vehicles WHERE vin=$1 AND source_type IN ('mingbang','four_s') "+
      "AND formally_published_at IS NOT NULL AND archived_at IS NULL AND vehicle_id<>$2 ORDER BY vehicle_id LIMIT 1 FOR SHARE",
      [vin,ctx.vehicle.vehicle_id])).rowCount;
     if(duplicate)throw new Denied('VIN_DUPLICATE',409);
    }
    const psql=await c.query("UPDATE public.vehicles SET model_id=$1,vin=$2 WHERE vehicle_id=$3 AND source_type=$4 "+
     "AND formally_published_at IS NOT NULL AND archived_at IS NULL AND model_id IS NOT DISTINCT FROM $5 AND vin IS NOT DISTINCT FROM $6",
      [fields.modelId,vin,ctx.vehicle.vehicle_id,ctx.vehicle.source_type,ctx.vehicle.model_id,ctx.vehicle.vin]);
    if(psql.rowCount!==1)throw new Denied('CURRENT_VEHICLE_CHANGED_OUTSIDE_EDIT',409);
    const next=await c.query('UPDATE '+S+'.vehicle_edit_state SET version=version+1,effective_fields=$2::jsonb,updated_at=transaction_timestamp() WHERE vehicle_id=$1 AND version=$3 RETURNING version',
      [ctx.vehicle.vehicle_id,JSON.stringify(fields),ctx.current.version]);
    if(next.rowCount!==1)throw new Denied('EDIT_EFFECTIVE_VERSION_CONFLICT',409);
    const aud=await c.query('INSERT INTO '+S+'.edit_audit(event_key,vehicle_id,listing_cycle_id,actor_employee_id,previous_version,next_version,before_fields,after_fields) VALUES($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb) RETURNING audit_id',
     [input.requestKey,ctx.vehicle.vehicle_id,ctx.vehicle.listing_cycle_id,ctx.who,ctx.current.version,next.rows[0].version,JSON.stringify(ctx.current.effective_fields),JSON.stringify(fields)]);
    await c.query('INSERT INTO '+S+'.impact_outbox(audit_id) VALUES($1)',[aud.rows[0].audit_id]);
    const del=await c.query('DELETE FROM '+S+'.staged_changes WHERE vehicle_id=$1 AND version=$2',[ctx.vehicle.vehicle_id,ctx.staged.version]);
    if(del.rowCount!==1)throw new Denied('EDIT_DRAFT_VERSION_CONFLICT',409);
    if(env.F05_EDIT_INJECT_COMMIT_ROLLBACK==='true')throw new Denied('EDIT_INJECTED_ROLLBACK',409);
    return ok('EDIT_APPLIED',{vehicleId:String(ctx.vehicle.vehicle_id),currentVersion:Number(next.rows[0].version),projection:'CI_ONLY_PROJECTION',
     impactStatus:'NOT_CONNECTED_SOURCE_GAP',effective:view(fields,ctx.access.canInternal)});
   });
  }
 });
}
