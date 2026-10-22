// F05-3A isolated real PG16 proof. One 4S member account = represented dealer identity.
// Independent System Admin CREATE license -> member-owned new Vehicle+Cycle+receipt IN ONE TX.
// Never grant from a role flag, legacy uploader, Customer301 scope or supplied owner id.
import {verify as verifyPrevious,requireDatabaseIdentity} from '../vehicle-stewardship-physical-scope/migration.mjs';
import {verify as verifyCurrent} from './migration.mjs';
export const BLOCKED='POSITIVE_4S_TRUST_SOURCE_BLOCKED';
const deny=(code=BLOCKED)=>Object.freeze({allowed:false,code});
const accept=(code,extra={})=>Object.freeze({allowed:true,code,...extra});
const valid=n=>Number.isSafeInteger(n)&&n>0&&n<=2147483647;
const shape=(o,keys)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).sort().join(',')===keys;
const key=k=>typeof k==='string'&&/^[a-zA-Z0-9._:-]{20,160}$/.test(k);
function isolated(){
 for(const [k,v] of Object.entries({CI:'true',GITHUB_ACTIONS:'true',APP_ENV:'test',NODE_ENV:'test',F05_2_ISOLATION_CONFIRM:'I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY'}))
  if(process.env[k]!==v)throw Error('F05_3A_NOT_CI_ONLY_'+k);
}
async function ready(auth,{newVersion=true}={}){
 isolated();
 if(!auth?.pool||typeof auth.withSession!=='function')throw Error('F05_3A_TRUSTED_SESSION_REQUIRED');
 await requireDatabaseIdentity(auth.pool);
 if(newVersion)await verifyCurrent(auth.pool);else await verifyPrevious(auth.pool);
}
async function currentFourS(c,id,{lock=false}={}){
 const v=(await c.query("SELECT e.employee_id,e.employment_status,e.store_id,r.role_code,a.account_id,a.principal_kind,a.credential_state,a.force_password_change FROM public.employees e JOIN public.roles r ON r.role_id=e.main_role_id JOIN public.pc_login_accounts a ON a.employee_id=e.employee_id AND a.principal_kind='employee' WHERE e.employee_id=$1 "+(lock?'FOR SHARE OF e':'FOR SHARE OF e'),[id])).rows;
 if(v.length!==1)return false;
 const x=v[0];
 if(x.role_code!=='four_s'||x.employment_status!=='active'||x.credential_state!=='enabled'||x.force_password_change!==false)return false;
 const p=(await c.query("SELECT EXISTS(SELECT 1 FROM public.permissions p JOIN public.employee_permission_overrides o ON o.permission_id=p.permission_id WHERE o.employee_id=$1 AND p.permission_code='pc.four_s.vehicle.manage' AND o.decision='allow') as permitted",[id])).rows[0]?.permitted;
 return p===true;
}
async function memberSession(auth,token,fn){
 return await auth.withSession(token,async(c,a,s)=>{
  if(s.restricted||a.principal_kind!=='employee'||a.employee_id===null||
     a.system_admin_id!==null||a.subject_status!=='active'||a.role_code!=='four_s'||
     a.credential_state!=='enabled'||a.force_password_change!==false)return deny('F05_3A_NOT_CURRENT_MEMBER_SESSION');
  const who=Number(a.employee_id);
  if(!valid(who)||!await currentFourS(c,who))return deny('F05_3A_MEMBER_PERMISSION_OR_ROLE_DENIED');
  await c.query('SELECT pg_advisory_xact_lock(20261011,$1::integer)',[who]);
  return fn(c,who);
 },{normalOnly:true})??deny('F05_3A_NO_VALID_SESSION');
}
async function adminSession(auth,token,fn){
 return await auth.withSession(token,async(c,a,s)=>{
  if(s.restricted||a.principal_kind!=='system_admin'||a.system_admin_id===null||
    a.employee_id!==null||a.subject_status!=='active'||a.credential_state!=='enabled'||
    a.force_password_change!==false)return deny('F05_3A_NOT_AUTHENTICATED_SYSTEM_ADMIN');
  const adminId=Number(a.system_admin_id);
  if(!valid(adminId))return deny('F05_3A_ADMIN_ID_DENIED');
  const self=(await c.query("SELECT system_admin_id FROM public.system_admins WHERE system_admin_id=$1 AND account_status='active' FOR SHARE",[adminId])).rows;
  if(self.length!==1)return deny('F05_3A_GOVERNANCE_ADMIN_INACTIVE');
  return fn(c,adminId);
 },{normalOnly:true})??deny('F05_3A_NO_ADMIN_SESSION');
}
async function targetAccountLock(c,employeeId){
 const q=(await c.query("SELECT a.account_id FROM public.pc_login_accounts a WHERE a.principal_kind='employee' AND a.employee_id=$1 FOR UPDATE",[employeeId])).rows;
 return q.length===1;
}
const allowedProduct=p=>shape(p,'brandId,city,eventKey,listingCycleId,mileageKm,modelId,modelYear,seriesId,sourceKind,vehicleId')&&
 [p.brandId,p.seriesId,p.modelId,p.vehicleId,p.listingCycleId].every(valid)&&
 Number.isSafeInteger(p.modelYear)&&p.modelYear>=1980&&p.modelYear<=2100&&
 Number.isSafeInteger(p.mileageKm)&&p.mileageKm>=0&&p.mileageKm<=3000000&&
 typeof p.city==='string'&&p.city.trim()===p.city&&p.city.length>=2&&p.city.length<=100&&
 p.sourceKind==='four_s'&&key(p.eventKey)&&p.vehicleId>=60000&&p.listingCycleId>=60000;
export async function assessFourSMemberAuthority(auth,token){
 // Retain previous 7+7 pre-bridge negative evidence. Real credential and role,
 // before Admin-governed license => gap. After license, only new publication permitted.
 isolated();
 if(!auth?.pool)throw Error('F05_3A_MISSING_TRUSTED_SESSION');
 const relation=(await auth.pool.query("SELECT to_regclass('public.f05_3a_member_create_licenses') AS current")).rows[0]?.current;
 await ready(auth,{newVersion:relation!==null});
 const res=await memberSession(auth,token,async(c,who)=>{
  if(relation===null)return deny();
  const license=(await c.query("SELECT license_id FROM public.f05_3a_member_create_licenses WHERE employee_id=$1 AND revoked_at IS NULL FOR SHARE",[who])).rows;
  return license.length===1?accept('F05_3A_ADMIN_GOVERNED_NEW_OWN_FOUR_S_ONLY',{licenseId:Number(license[0].license_id)}):deny();
 });
 return res;
}
// Two legacy paths are permanently unable to convert preexisting vehicles to 4S owner.
export async function publishFourSVehicle(){return deny()}
export async function issueFourSResponsibility(){return deny()}

export async function grantMemberCreateLicense(auth,adminToken,p){
 if(!shape(p,'eventKey,targetEmployeeId')||!valid(p.targetEmployeeId)||!key(p.eventKey))return deny('F05_3A_ADMIN_GRANT_INPUT');
 await ready(auth);
 return adminSession(auth,adminToken,async(c,admin)=>{
  if(!await targetAccountLock(c,p.targetEmployeeId))return deny('F05_3A_NO_UNIQUE_TARGET_ACCOUNT');
  await c.query('SELECT pg_advisory_xact_lock(20261011,$1::integer)',[p.targetEmployeeId]);
  if(!await currentFourS(c,p.targetEmployeeId))return deny('F05_3A_MEMBER_CANNOT_BE_GOVERNED');
  const old=(await c.query("SELECT license_id FROM public.f05_3a_member_create_licenses WHERE employee_id=$1 AND revoked_at IS NULL FOR UPDATE",[p.targetEmployeeId])).rows;
  if(old.length)return deny('F05_3A_ALREADY_LICENSED');
  const collision=(await c.query("SELECT license_id FROM public.f05_3a_member_create_licenses WHERE grant_event_key=$1",[p.eventKey])).rows;
  if(collision.length)return deny('F05_3A_EVENT_REPLAY');
  const rec=(await c.query("INSERT INTO public.f05_3a_member_create_licenses(employee_id,granted_by_system_admin_id,grant_event_key) VALUES($1,$2,$3) RETURNING license_id",
   [p.targetEmployeeId,admin,p.eventKey])).rows[0];
  const licenseId=Number(rec.license_id);
  const dbTx=(await c.query('SELECT txid_current()::text AS txid')).rows[0].txid;
  const before={active:false,member:p.targetEmployeeId};
  const after={active:true,member:p.targetEmployeeId,licenseId,scopeKind:'NEW_OWN_FOUR_S_MANUAL_VEHICLE'};
  await c.query("INSERT INTO public.f05_3a_member_trust_audit(event_key,license_id,event_kind,actor_kind,actor_system_admin_id,affected_employee_id,actor_context,before_state,after_state) VALUES($1,$2,'ADMIN_GRANT','SYSTEM_ADMIN',$3,$4,$5::jsonb,$6::jsonb,$7::jsonb)",
   ['audit:'+p.eventKey,licenseId,admin,p.targetEmployeeId,JSON.stringify({origin:'F05_3A_AUTHENTICATED_ADMIN_SESSION',transactionId:dbTx}),JSON.stringify(before),JSON.stringify(after)]);
  return accept('F05_3A_LICENSE_GRANTED',{licenseId});
 });
}
export async function revokeMemberCreateLicense(auth,adminToken,p){
 if(!shape(p,'eventKey,licenseId,version')||![p.licenseId,p.version].every(valid)||!key(p.eventKey))return deny('F05_3A_REVOKE_INPUT');
 await ready(auth);
 return adminSession(auth,adminToken,async(c,admin)=>{
  const ref=(await c.query("SELECT employee_id FROM public.f05_3a_member_create_licenses WHERE license_id=$1",[p.licenseId])).rows[0];
  if(!ref)return deny('F05_3A_LICENSE_NOT_FOUND');
  const who=Number(ref.employee_id);
  if(!await targetAccountLock(c,who))return deny('F05_3A_TARGET_ACCOUNT_GONE');
  await c.query('SELECT pg_advisory_xact_lock(20261011,$1::integer)',[who]);
  const license=(await c.query("SELECT * FROM public.f05_3a_member_create_licenses WHERE license_id=$1 FOR UPDATE",[p.licenseId])).rows[0];
  if(!license||license.revoked_at!==null||Number(license.version)!==p.version)return deny('F05_3A_LICENSE_REVOKED_OR_STALE');
  const dbTx=(await c.query('SELECT txid_current()::text AS txid')).rows[0].txid;
  const before={active:true,licenseId:p.licenseId,version:p.version};
  await c.query("UPDATE public.f05_3a_member_create_licenses SET revoked_at=transaction_timestamp(),version=version+1 WHERE license_id=$1",[p.licenseId]);
  // Trigger cascades all current objects to inactive and logs SYSTEM actor,
  // but explicit governance revocation actor is the authenticated real admin.
  await c.query("INSERT INTO public.f05_3a_member_trust_audit(event_key,license_id,event_kind,actor_kind,actor_system_admin_id,affected_employee_id,actor_context,before_state,after_state) VALUES($1,$2,'ADMIN_REVOKE','SYSTEM_ADMIN',$3,$4,$5::jsonb,$6::jsonb,$7::jsonb)",
   [p.eventKey,p.licenseId,admin,who,JSON.stringify({origin:'F05_3A_AUTHENTICATED_ADMIN_SESSION',transactionId:dbTx}),JSON.stringify(before),JSON.stringify({active:false,licenseId:p.licenseId,version:p.version+1})]);
  return accept('F05_3A_LICENSE_REVOKED');
 });
}
export async function publishNewFourSMemberVehicle(auth,token,p,{testCheckpoint,onPublishInTransaction}={}){
 if(!allowedProduct(p))return deny('F05_3A_PDM06_FIELDS_INVALID');
 await ready(auth);
 if(testCheckpoint!==undefined&&(process.env.CI!=='true'||process.env.GITHUB_ACTIONS!=='true'||typeof testCheckpoint!=='function'))
  return deny('F05_3A_TEST_CHECKPOINT_INVALID');
 if(onPublishInTransaction!==undefined&&(process.env.CI!=='true'||process.env.GITHUB_ACTIONS!=='true'||typeof onPublishInTransaction!=='function'))
  return deny('F05_3A_PUBLISH_CALLBACK_NOT_CI');
 try{return await memberSession(auth,token,async(c,who)=>{
  const license=(await c.query("SELECT * FROM public.f05_3a_member_create_licenses WHERE employee_id=$1 AND revoked_at IS NULL FOR SHARE",[who])).rows;
  if(license.length!==1)return deny(BLOCKED);
  if(testCheckpoint)await testCheckpoint('after_license_locked',c);
  // Read PHYSICAL current model, brand, series and modelYear; do not trust UI
  // supplied names or an unconfirmed UPS/JYT model mapping.
  const model=(await c.query("SELECT m.model_id,m.brand_id,m.series_id,m.model_year,m.profile_status,b.brand_name,b.status AS brand_status,s.series_name,s.status AS series_status,m.model_name FROM public.vehicle_models m JOIN public.vehicle_series s ON s.series_id=m.series_id AND s.brand_id=m.brand_id JOIN public.vehicle_brands b ON b.brand_id=m.brand_id WHERE m.model_id=$1 AND m.brand_id=$2 AND m.series_id=$3 AND m.model_year=$4 FOR SHARE OF m,b,s",
   [p.modelId,p.brandId,p.seriesId,p.modelYear])).rows;
  if(model.length!==1||model[0].profile_status!=='complete'||model[0].brand_status!=='active'||model[0].series_status!=='active'||!model[0].brand_name?.trim()||!model[0].series_name?.trim()||!model[0].model_name?.trim())
   return deny('F05_3A_INVALID_PHYSICAL_MODEL_ID');
  if((await c.query("SELECT 1 FROM public.vehicles WHERE vehicle_id=$1",[p.vehicleId])).rowCount)
   return deny('F05_3A_EXISTING_VEHICLE_NO_RETROACTIVE_OWNER');
  if((await c.query("SELECT 1 FROM public.vehicle_listing_cycles WHERE listing_cycle_id=$1",[p.listingCycleId])).rowCount)
   return deny('F05_3A_EXISTING_CYCLE_NO_RETROACTIVE_OWNER');
  if((await c.query("SELECT 1 FROM public.f05_3a_member_publications WHERE trusted_event_key=$1",[p.eventKey])).rowCount)
   return deny('F05_3A_EVENT_REPLAY');
  await c.query("INSERT INTO public.vehicles(vehicle_id,source_type,source_sale_status,platform_visibility,created_by_employee_id,formally_published_at,model_id) VALUES($1,'four_s','available','visible',$2,transaction_timestamp(),$3)",[p.vehicleId,who,p.modelId]);
  await c.query("INSERT INTO public.vehicle_listing_cycles(listing_cycle_id,vehicle_id,started_at) VALUES($1,$2,transaction_timestamp())",[p.listingCycleId,p.vehicleId]);
  const issued=(await c.query("INSERT INTO public.f05_3a_member_publications(vehicle_id,listing_cycle_id,license_id,member_employee_id,trusted_event_key,brand_id,series_id,model_id,model_year,mileage_km,city) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING publication_id",
   [p.vehicleId,p.listingCycleId,license[0].license_id,who,p.eventKey,p.brandId,p.seriesId,p.modelId,p.modelYear,p.mileageKm,p.city])).rows[0];
  const publicationId=Number(issued.publication_id);
  const dbTx=(await c.query('SELECT txid_current()::text AS txid')).rows[0].txid;
  await c.query("INSERT INTO public.f05_3a_member_trust_audit(event_key,license_id,publication_id,event_kind,actor_kind,actor_member_employee_id,affected_employee_id,actor_context,before_state,after_state) VALUES($1,$2,$3,'MEMBER_PUBLISH','FOUR_S_MEMBER',$4,$4,$5::jsonb,$6::jsonb,$7::jsonb)",
   ['audit:'+p.eventKey,license[0].license_id,publicationId,who,JSON.stringify({origin:'F05_3A_OWN_NEW_FOUR_S_IN_CURRENT_TX',sessionSubject:who,tx:dbTx}),JSON.stringify({vehicleExists:false}),JSON.stringify({vehicleId:p.vehicleId,listingCycleId:p.listingCycleId,licenseId:Number(license[0].license_id),member:who,brandId:p.brandId,seriesId:p.seriesId,modelId:p.modelId,modelYear:p.modelYear,mileageKm:p.mileageKm,city:p.city})]);
  if(onPublishInTransaction)await onPublishInTransaction(c,who,Object.freeze({vehicleId:p.vehicleId,listingCycleId:p.listingCycleId,publicationId,licenseId:Number(license[0].license_id),sourceKind:'four_s'}));
  return accept('F05_3A_MEMBER_VEHICLE_ISSUED',{publicationId,vehicleId:p.vehicleId,listingCycleId:p.listingCycleId});
 },{normalOnly:true})}catch(e){if(['23505','23503'].includes(e?.code))return deny('F05_3A_DUPLICATE_OR_RACE_DENIED');throw e}
}
export async function readFourSMemberMinimalVehicle(auth,token,p,{testCheckpoint}={}){
 if(!shape(p,'outlet,vehicleId')||p.outlet!=='detail'||!valid(p.vehicleId))return deny('F05_3A_DETAIL_ONLY');
 await ready(auth);
 return memberSession(auth,token,async(c,who)=>{
  const q=(await c.query("SELECT x.publication_id,x.vehicle_id,x.listing_cycle_id,x.member_employee_id,x.license_id,v.source_type,v.source_sale_status,v.archived_at,v.created_by_employee_id,cy.ended_at FROM public.f05_3a_member_publications x JOIN public.f05_3a_member_create_licenses l ON l.license_id=x.license_id JOIN public.vehicles v ON v.vehicle_id=x.vehicle_id JOIN public.vehicle_listing_cycles cy ON cy.listing_cycle_id=x.listing_cycle_id AND cy.vehicle_id=x.vehicle_id WHERE x.vehicle_id=$1 AND x.member_employee_id=$2 AND l.employee_id=x.member_employee_id AND l.employee_id=$2 AND x.revoked_at IS NULL AND l.revoked_at IS NULL FOR SHARE OF x,l,v,cy",
   [p.vehicleId,who])).rows;
  if(q.length!==1)return deny('F05_3A_NO_CURRENT_OWN_OBJECT_SCOPE');
  const x=q[0];
  if(Number(x.member_employee_id)!==who||x.source_type!=='four_s'||x.source_sale_status!=='available'||x.archived_at!==null||x.ended_at!==null||
     Number(x.created_by_employee_id)!==who)return deny('F05_3A_SOURCE_OR_CYCLE_INVALID');
  if(testCheckpoint!==undefined){
   if(process.env.CI!=='true'||process.env.GITHUB_ACTIONS!=='true'||typeof testCheckpoint!=='function')
    return deny('F05_3A_CHECKPOINT_DENIED');
   await testCheckpoint('owned_object_locked',c);
  }
  return accept('F05_3A_MEMBER_MINIMAL_VEHICLE',{vehicleId:Number(x.vehicle_id),listingCycleId:Number(x.listing_cycle_id),sourceKind:'four_s'});
 });
}
