// Transaction Handoff on signed PR139 CI-only in_progress source, never production.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {verify as verifyRefundParent,sourceSHA as refundSHA,connect as nativeConnect} from '../transaction-refund-http-pg16/service.mjs';
import {getPublicStructure} from '../../f02-1/schema-integrity.mjs';
const sql=readFileSync(new URL('./sidecar.sql',import.meta.url),'utf8');
const originalTxSQL=readFileSync(new URL('../lock-transaction-http-pg16/sidecar.sql',import.meta.url),'utf8');
export const sourceSHA=createHash('sha256').update(sql).digest('hex');
const txSHA=createHash('sha256').update(originalTxSQL).digest('hex');
const sha=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const yes=(code,data={})=>({allowed:true,code,...data});
const no=code=>({allowed:false,code});
const one=async(c,s,p=[]) => (await c.query(s,p)).rows[0];
const valid=x=>Number.isSafeInteger(x)&&x>0;
const key=x=>typeof x==='string'&&/^[A-Za-z0-9._:-]{16,120}$/.test(x);
const reason=x=>typeof x==='string'&&x.trim().length>=6&&x.trim().length<=240;
const branch='feat/f06-real-transaction-handoff-http-pg16-01';
export function gate(){
 const must={
  GITHUB_REPOSITORY:'suzhe868-arch/mb',GITHUB_ACTIONS:'true',CI:'true',APP_ENV:'test',NODE_ENV:'test',GITHUB_EVENT_NAME:'push',
  GITHUB_REF:'refs/heads/feat/f06-3c1-refund-pending-close-ci',
  F06_HANDOFF_ENTRY_REF:'refs/heads/'+branch,F06_HANDOFF_ENTRY_BRANCH:branch,F06_HANDOFF_ENTRY_EVENT:'push',
  F06_HANDOFF_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F06_TRANSACTION_HANDOFF_ONLY',
  F03_1_DATABASE_URL:'postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test'
 };
 for(const [k,v] of Object.entries(must))assert.equal(process.env[k],v,'F06_REAL_HANDOFF_ISOLATION_DENIED_'+k);
 assert.equal(process.env.F06_HANDOFF_ENTRY_SHA,process.env.GITHUB_SHA);
 assert.equal(process.env.F06_HANDOFF_ENTRY_RUN_ID,process.env.GITHUB_RUN_ID);
 assert.match(process.env.GITHUB_SHA||'',/^[a-f0-9]{40}$/);
 assert.match(process.env.GITHUB_RUN_ID||'',/^[0-9]{6,20}$/);
}
export async function connect(){gate();return nativeConnect()}
async function parents(c){
 gate();
 const p=await verifyRefundParent(c);
 if(!p.verified||p.sourceSHA!==refundSHA)throw Error('F06_REAL_HANDOFF_PARENT_PR150_SIGNATURE_INVALID');
 const meta=await one(c,"SELECT current_database() db,current_user u,current_setting('server_version_num')::int ver,(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) su,(SELECT rolcreatedb FROM pg_roles WHERE rolname=current_user) cdb");
 if(meta.db!=='f03_auth_test'||meta.u!=='f03_ci'||meta.su||meta.cdb||meta.ver<160000||meta.ver>=170000)throw Error('F06_REAL_HANDOFF_NONPRIVILEGED_PG16_REQUIRED');
 const ledger=(await c.query("SELECT migration_id,checksum,structure_sha256 FROM public.f03_schema_migrations ORDER BY migration_id")).rows;
 if(ledger.length!==24)throw Error('F06_REAL_HANDOFF_24_LEDGER_REQUIRED');
 const catalog=await getPublicStructure(c);
 if(catalog.sha256!==p.publicCatalogSHA)throw Error('F06_REAL_HANDOFF_PUBLIC_CATALOG_DRIFT');
 const present=await one(c,"SELECT to_regnamespace('f06_real_tx_ci') tx,to_regnamespace('f06_3b_ci') oldb,to_regnamespace('f06_real_tx_refund_ci') refund");
 if(!present?.tx||!present.oldb||!present.refund)throw Error('F06_REAL_HANDOFF_NATIVE_SOURCE_MISSING');
 return {p,catalog:p.publicCatalogSHA,ledger:sha(ledger)};
}
export async function verify(c){
 const p=await parents(c);
 const a=await one(c,"SELECT * FROM f06_real_handoff_ci.attestation FOR SHARE");
 if(!a||a.seal_name!=='F06_REAL_TX_HANDOFF_CI_ONLY'||a.source_sha256!==sourceSHA||
  a.tx_refund_source_sha256!==refundSHA||a.original_tx_source_sha256!==txSHA||
  a.public_catalog_sha256!==p.catalog||a.ledger_sha256!==p.ledger)
  throw Error('F06_REAL_HANDOFF_SIDECAR_SIGNATURE_DRIFT');
 return {verified:true,sourceSHA,txSHA,refundSHA,ledgerSHA:p.ledger,catalogSHA:p.catalog,productionIssuer:'NOT_AUTHORIZED'};
}
export async function apply(c,{inject=false}={}){
 const p=await parents(c);
 const exists=await one(c,"SELECT to_regnamespace('f06_real_handoff_ci')::text n");
 if(exists.n)throw Error('F06_REAL_HANDOFF_ALREADY_APPLIED');
 await c.query('BEGIN');
 try{
  await c.query('SELECT pg_advisory_xact_lock(20261020,6151)');
  await c.query(sql);
  await c.query("INSERT INTO f06_real_handoff_ci.attestation(seal_name,source_sha256,tx_refund_source_sha256,original_tx_source_sha256,public_catalog_sha256,ledger_sha256) VALUES('F06_REAL_TX_HANDOFF_CI_ONLY',$1,$2,$3,$4,$5)",[sourceSHA,refundSHA,txSHA,p.catalog,p.ledger]);
  if(inject)throw Error('F06_REAL_HANDOFF_INJECTED_MIGRATION_ROLLBACK');
  if((await getPublicStructure(c)).sha256!==p.catalog)throw Error('F06_REAL_HANDOFF_PUBLIC_DDL_FORBIDDEN');
  await c.query('COMMIT');
 }catch(e){await c.query('ROLLBACK');throw e}
 return verify(c);
}
async function source(c,t){
 if(!t||t.status!=='in_progress'||t.completed_at!==null)return no('F06_REAL_HANDOFF_NOT_IN_PROGRESS');
 const o=await one(c,"SELECT * FROM f06_real_tx_ci.origins WHERE transaction_id=$1 FOR SHARE",[t.transaction_id]);
 const e=await one(c,"SELECT * FROM f06_real_tx_ci.events WHERE transaction_id=$1 FOR SHARE",[t.transaction_id]);
 const k=await one(c,"SELECT * FROM f06_real_tx_ci.request_keys WHERE transaction_id=$1 FOR SHARE",[t.transaction_id]);
 if(!o||!e||!k||o.state!=='in_progress'||o.carrier!=='in_progress'||o.issuer!=='CI_SYNTHETIC_NOT_REAL_MONEY'||
  e.event_kind!=='lock_to_transaction'||e.source_status!=='active'||e.final_status!=='released'||
  Number(o.transaction_id)!==Number(t.transaction_id)||Number(o.source_lock_id)!==Number(t.source_lock_id)||
  Number(o.customer_id)!==Number(t.customer_id)||Number(o.vehicle_id)!==Number(t.vehicle_id)||
  Number(o.listing_cycle_id)!==Number(t.listing_cycle_id)||
  Number(e.source_lock_id)!==Number(t.source_lock_id)||Number(k.source_lock_id)!==Number(t.source_lock_id)||
  Number(o.actor_employee_id)!==Number(k.employee_id)||Number(o.actor_employee_id)!==Number(e.actor_employee_id))
  return no('F06_REAL_HANDOFF_PR139_SOURCE_DRIFT');
 const lock=await one(c,'SELECT * FROM public.locks WHERE lock_id=$1 FOR UPDATE',[t.source_lock_id]);
 const snap=await one(c,'SELECT * FROM f06_1_lock_ci.lock_snapshots WHERE lock_id=$1 FOR SHARE',[t.source_lock_id]);
 if(!lock||!snap||lock.lock_status!=='released'||lock.end_reason!=='converted_to_transaction'||
  Number(lock.vehicle_id)!==Number(t.vehicle_id)||Number(lock.customer_id)!==Number(t.customer_id)||
  Number(lock.listing_cycle_id)!==Number(t.listing_cycle_id)||
  Number(lock.responsible_employee_id)!==Number(o.responsible_employee_id)||
  Number(snap.responsible_employee_id)!==Number(o.responsible_employee_id))
  return no('F06_REAL_HANDOFF_ORIGINAL_LOCK_SNAPSHOT_DRIFT');
 const cyc=await one(c,'SELECT vehicle_id FROM public.vehicle_listing_cycles WHERE listing_cycle_id=$1 AND vehicle_id=$2 FOR SHARE',[t.listing_cycle_id,t.vehicle_id]);
 const cust=await one(c,'SELECT account_status FROM public.customers WHERE customer_id=$1 FOR SHARE',[t.customer_id]);
 if(!cyc||!cust||cust.account_status!=='active')return no('F06_REAL_HANDOFF_CUSTOMER_CYCLE_DRIFT');
 const counts=await one(c,"SELECT "+
  "(SELECT count(*)::int FROM f06_3b_ci.transaction_origins WHERE transaction_id=$1) old_3b,"+
  "(SELECT count(*)::int FROM f06_real_cancel_ci.origins WHERE transaction_id=$1) cancelled,"+
  "(SELECT count(*)::int FROM public.refund_cases WHERE transaction_id=$1) tx_refund,"+
  "(SELECT count(*)::int FROM public.transaction_responsible_handover_receipts WHERE transaction_id=$1) receipts,"+
  "(SELECT count(*)::int FROM public.audit_events WHERE object_kind='Transaction' AND object_id=$1::text AND action='f06_real_tx_ci_atomic_open') opening",[t.transaction_id]);
 if(counts.old_3b||counts.cancelled||counts.tx_refund||counts.receipts||counts.opening!==1)
  return no('F06_REAL_HANDOFF_UNSIGNED_FINANCE_OR_LEGACY_SOURCE');
 const digest=sha([o,e,k]);
 return yes('F06_REAL_HANDOFF_SIGNED_PR139',{o,e,k,digest,lock});
}
async function chain(c,t,src){
 const events=(await c.query('SELECT * FROM f06_real_handoff_ci.events WHERE transaction_id=$1 ORDER BY version,event_id FOR SHARE',[t.transaction_id])).rows;
 const keys=(await c.query('SELECT * FROM f06_real_handoff_ci.request_keys WHERE transaction_id=$1 FOR SHARE',[t.transaction_id])).rows;
 if(keys.length!==events.length)return no('F06_REAL_HANDOFF_CHAIN_KEYS_MISSING');
 const audits=await one(c,"SELECT count(*)::int n FROM public.audit_events WHERE object_kind='Transaction' AND object_id=$1 AND action='f06_real_handoff_ci_responsible_transfer'",[String(t.transaction_id)]);
 if(Number(audits.n)!==events.length)return no('F06_REAL_HANDOFF_AUDIT_COUNT_MISMATCH');
 let prior=null,current=Number(src.o.responsible_employee_id);
 for(let i=0;i<events.length;i++){
  const e=events[i],k=keys.find(k=>k.event_key_sha256===e.event_key_sha256);
  if(!k||Number(k.actor_employee_id)!==Number(e.actor_employee_id)||Number(k.event_id)!==Number(e.event_id)||
   Number(k.transaction_id)!==Number(t.transaction_id)||e.version!==i+1||
   Number(e.original_responsible_employee_id)!==Number(src.o.responsible_employee_id)||
   Number(e.old_responsible_employee_id)!==current||
   (prior===null?e.prior_event_id!==null:Number(e.prior_event_id)!==prior)||
   Number(e.source_lock_id)!==Number(t.source_lock_id)||Number(e.vehicle_id)!==Number(t.vehicle_id)||
   Number(e.customer_id)!==Number(t.customer_id)||Number(e.listing_cycle_id)!==Number(t.listing_cycle_id)||
   e.source_tx_digest!==src.digest)
   return no('F06_REAL_HANDOFF_UNSIGNED_VERSION_HISTORY');
  const a=await one(c,"SELECT actor_id,before_json,after_json FROM public.audit_events WHERE object_kind='Transaction' AND object_id=$1 AND action='f06_real_handoff_ci_responsible_transfer' AND after_json->>'eventId'=$2",[String(t.transaction_id),String(e.event_id)]);
  if(!a||Number(a.actor_id)!==Number(e.actor_employee_id)||Number(a.before_json.responsible)!==current||
   Number(a.after_json.responsible)!==Number(e.new_responsible_employee_id)||
   Number(a.after_json.version)!==e.version)
   return no('F06_REAL_HANDOFF_AUDIT_CHAIN_DRIFT');
  current=Number(e.new_responsible_employee_id);prior=Number(e.event_id);
 }
 if(current!==Number(t.responsible_employee_id))return no('F06_REAL_HANDOFF_UNSIGNED_CURRENT_RESPONSIBLE');
 return yes('F06_REAL_HANDOFF_SIGNED_VERSION_CHAIN',{version:events.length,currentId:current,originalId:Number(src.o.responsible_employee_id),priorEventId:prior});
}
async function managerScope(c,a,oldId,newId,customerId,signedInitialResponsibleId,signedTxCreatedAt){
 if(!a||a.principal_kind!=='employee'||a.system_admin_id!==null||
  a.credential_state!=='enabled'||a.subject_status!=='active'||a.force_password_change!==false||
  !['manager','store_head'].includes(a.role_code))
  return no('F06_REAL_HANDOFF_MANAGER_SESSION_DENIED');
 const r=await one(c,"SELECT tm.team_id,tm.store_id,role.role_code FROM public.employees mgr "+
  "JOIN public.roles role ON role.role_id=mgr.main_role_id "+
  "JOIN public.employees target ON target.employee_id=$3 "+
  "JOIN public.roles tr ON tr.role_id=target.main_role_id "+
  "JOIN public.permissions p ON p.permission_code='transaction.ci.handoff' "+
  "JOIN public.employee_permission_overrides ov ON ov.permission_id=p.permission_id AND ov.employee_id=mgr.employee_id AND ov.decision='allow' "+
  "JOIN public.employee_capability_scope_bindings cap ON cap.employee_id=mgr.employee_id AND cap.permission_id=p.permission_id "+
  "JOIN public.employee_data_scopes s ON s.scope_id=cap.scope_id AND s.employee_id=mgr.employee_id "+
  "JOIN public.employee_team_memberships mm ON mm.employee_id=mgr.employee_id "+
  "JOIN public.employee_team_memberships nm ON nm.employee_id=target.employee_id AND nm.team_id=mm.team_id "+
  "JOIN public.teams tm ON tm.team_id=mm.team_id "+
  "JOIN public.employee_team_memberships original_team ON original_team.employee_id=$5 AND original_team.team_id=tm.team_id "+
  "JOIN public.stores st ON st.store_id=tm.store_id "+
  "JOIN public.customers cust ON cust.customer_id=$4 "+
  "WHERE mgr.employee_id=$1 AND mgr.employment_status='active' AND role.role_code IN('manager','store_head') "+
  "AND target.employment_status='active' AND tr.role_code IN('sales','manager','store_head') "+
  "AND tm.team_status='active' AND st.status='active' AND cust.account_status='active' "+
  "AND original_team.valid_from<=$6 AND (original_team.ended_at IS NULL OR original_team.ended_at>$6) "+
  "AND mm.valid_from<=clock_timestamp() AND (mm.ended_at IS NULL OR mm.ended_at>clock_timestamp()) "+
  "AND nm.valid_from<=clock_timestamp() AND (nm.ended_at IS NULL OR nm.ended_at>clock_timestamp()) "+
  "AND cap.granted_at<=clock_timestamp() AND (cap.ended_at IS NULL OR cap.ended_at>clock_timestamp()) "+
  "AND (s.ended_at IS NULL OR s.ended_at>clock_timestamp()) "+
  "AND ((s.scope_kind='team' AND s.scope_reference_id=tm.team_id) OR "+
  "(s.scope_kind='store' AND s.scope_reference_id=tm.store_id AND role.role_code='store_head')) "+
  "AND (role.role_code<>'store_head' OR mgr.store_id=tm.store_id) "+
  "LIMIT 1 FOR SHARE OF mgr,role,target,tr,p,ov,cap,s,mm,nm,tm,st,cust,original_team",
  [a.employee_id,oldId,newId,customerId,signedInitialResponsibleId,signedTxCreatedAt]);
 return r&&r.role_code===a.role_code?
  yes('F06_REAL_HANDOFF_EXPLICIT_PERMISSION_SCOPE',{teamId:Number(r.team_id),storeId:Number(r.store_id)}):
  no('F06_REAL_HANDOFF_PERMISSION_SCOPE_DENIED');
}
const fp=p=>sha({transactionId:p.transactionId,expectedOldResponsibleId:p.expectedOldResponsibleId,
 expectedVersion:p.expectedVersion,newResponsibleId:p.newResponsibleId,reason:p.reason.trim(),action:'handoff'});
export async function handoffRealTransactionCI(auth,token,p={}){
 gate();
 if(!valid(p.transactionId)||!valid(p.expectedOldResponsibleId)||!Number.isSafeInteger(p.expectedVersion)||p.expectedVersion<0||
    !valid(p.newResponsibleId)||!reason(p.reason)||!key(p.eventKey))
  return no('F06_REAL_HANDOFF_INVALID_ARGUMENTS');
 try{
  const result=await auth.withSession(token,async(c,a)=>{
   await verify(c);await c.query("SET LOCAL lock_timeout='1800ms'");
   const seed=await one(c,'SELECT vehicle_id FROM public.transactions WHERE transaction_id=$1',[p.transactionId]);
   if(!seed)return no('F06_REAL_HANDOFF_TRANSACTION_NOT_FOUND');
   await c.query('SELECT vehicle_id FROM public.vehicles WHERE vehicle_id=$1 FOR UPDATE',[seed.vehicle_id]);
   const t=await one(c,'SELECT * FROM public.transactions WHERE transaction_id=$1 FOR UPDATE',[p.transactionId]);
   if(!t||t.status!=='in_progress'||t.completed_at!==null)return no('F06_REAL_HANDOFF_NOT_IN_PROGRESS');
   const src=await source(c,t);if(!src.allowed)return src;
   const curr=await chain(c,t,src);if(!curr.allowed)return curr;
   const h=sha(['F06_REAL_HANDOFF_KEY',p.eventKey]);
   const payload=fp(p);
   const existing=await one(c,'SELECT * FROM f06_real_handoff_ci.request_keys WHERE event_key_sha256=$1 FOR SHARE',[h]);
   if(existing&&(Number(existing.transaction_id)!==p.transactionId||Number(existing.actor_employee_id)!==Number(a?.employee_id)||existing.payload_sha256!==payload))
    return no('F06_REAL_HANDOFF_IDEMPOTENCY_CONFLICT');
   const scope=await managerScope(c,a,curr.currentId,p.newResponsibleId,t.customer_id,src.o.responsible_employee_id,src.o.created_at);
   if(!scope.allowed)return scope;
   if(existing)return yes('F06_REAL_HANDOFF_IDEMPOTENT',{transactionId:p.transactionId,eventId:Number(existing.event_id),currentResponsibleId:curr.currentId,version:curr.version,backendPid:(await one(c,'SELECT pg_backend_pid() pid')).pid});
   if(curr.version!==p.expectedVersion||curr.currentId!==p.expectedOldResponsibleId)
    return no('F06_REAL_HANDOFF_STALE_VERSION_CONFLICT');
   if(curr.currentId===p.newResponsibleId)return no('F06_REAL_HANDOFF_SELF_TRANSFER_DENIED');
   if(p.testCheckpoint==='BEFORE_CHANGE_THROW')throw Error('F06_REAL_HANDOFF_INJECTED_BEFORE_CHANGE');
   const changed=await one(c,"UPDATE public.transactions SET responsible_employee_id=$2 WHERE transaction_id=$1 AND responsible_employee_id=$3 AND status='in_progress' RETURNING transaction_id",
    [p.transactionId,p.newResponsibleId,curr.currentId]);
   if(!changed)throw Error('F06_REAL_HANDOFF_ATOMIC_CAS_LOST');
   if(p.testCheckpoint==='AFTER_CHANGE_THROW')throw Error('F06_REAL_HANDOFF_INJECTED_CHANGE_ROLLBACK');
   const e=await one(c,"INSERT INTO f06_real_handoff_ci.events(transaction_id,source_lock_id,customer_id,vehicle_id,listing_cycle_id,original_responsible_employee_id,old_responsible_employee_id,new_responsible_employee_id,actor_employee_id,signed_team_id,signed_store_id,version,prior_event_id,reason,source_tx_digest,event_key_sha256) "+
    "VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING event_id",
    [t.transaction_id,t.source_lock_id,t.customer_id,t.vehicle_id,t.listing_cycle_id,curr.originalId,curr.currentId,p.newResponsibleId,a.employee_id,scope.teamId,scope.storeId,curr.version+1,curr.priorEventId,p.reason.trim(),src.digest,h]);
   if(p.testCheckpoint==='AFTER_EVENT_THROW')throw Error('F06_REAL_HANDOFF_INJECTED_EVENT_ROLLBACK');
   await c.query("INSERT INTO f06_real_handoff_ci.request_keys(event_key_sha256,transaction_id,actor_employee_id,payload_sha256,event_id) VALUES($1,$2,$3,$4,$5)",
    [h,t.transaction_id,a.employee_id,payload,e.event_id]);
   await c.query("INSERT INTO public.audit_events(actor_kind,actor_id,object_kind,object_id,action,before_json,after_json,occurred_at) VALUES('employee',$1,'Transaction',$2,'f06_real_handoff_ci_responsible_transfer',$3::jsonb,$4::jsonb,clock_timestamp())",
    [String(a.employee_id),String(t.transaction_id),JSON.stringify({responsible:curr.currentId,version:curr.version}),JSON.stringify({responsible:p.newResponsibleId,version:curr.version+1,eventId:Number(e.event_id),issuer:'CI_SYNTHETIC_NO_MONEY'})]);
   if(p.testCheckpoint==='AFTER_AUDIT_THROW')throw Error('F06_REAL_HANDOFF_INJECTED_AUDIT_ROLLBACK');
   if(!(await managerScope(c,a,curr.currentId,p.newResponsibleId,t.customer_id,src.o.responsible_employee_id,src.o.created_at)).allowed)
    throw Error('F06_REAL_HANDOFF_SOURCE_SCOPE_CHANGED');
   const check=await one(c,'SELECT status,completed_at,responsible_employee_id,source_lock_id FROM public.transactions WHERE transaction_id=$1',[t.transaction_id]);
   if(!check||check.status!=='in_progress'||check.completed_at!==null||
    Number(check.responsible_employee_id)!==p.newResponsibleId||Number(check.source_lock_id)!==Number(src.o.source_lock_id))
    throw Error('F06_REAL_HANDOFF_PRECOMMIT_SOURCE_DRIFT');
   const second=await chain(c,{...t,responsible_employee_id:p.newResponsibleId},src);
   if(!second.allowed||second.version!==curr.version+1||second.currentId!==p.newResponsibleId)
    throw Error('F06_REAL_HANDOFF_FINAL_VERSION_DRIFT');
   return yes('F06_REAL_HANDOFF_ATOMIC_SIGNED',{transactionId:p.transactionId,eventId:Number(e.event_id),oldResponsibleId:curr.currentId,
    newResponsibleId:p.newResponsibleId,version:curr.version+1,teamId:scope.teamId,backendPid:(await one(c,'SELECT pg_backend_pid() pid')).pid});
  },{normalOnly:true});
  return result||no('F06_REAL_HANDOFF_SIGNED_SESSION_DENIED');
 }catch(e){
  if(['55P03','40P01','40001','23505'].includes(e.code))return no('F06_REAL_HANDOFF_PG_CONTENTION_DENY');
  if(/F06_REAL_HANDOFF_INJECTED_|F06_REAL_HANDOFF_SOURCE_SCOPE_CHANGED|F06_REAL_HANDOFF_PRECOMMIT_SOURCE_DRIFT|F06_REAL_HANDOFF_FINAL_VERSION_DRIFT|F06_REAL_HANDOFF_ATOMIC_CAS_LOST/.test(String(e.message)))
   return no('F06_REAL_HANDOFF_ATOMIC_ROLLED_BACK');
  throw e;
 }
}
export async function currentSignedResponsibleCI(c,transactionId){
 await verify(c);
 if(!valid(transactionId))return no('F06_REAL_HANDOFF_INVALID_ARGUMENTS');
 const t=await one(c,'SELECT * FROM public.transactions WHERE transaction_id=$1',[transactionId]);
 const src=await source(c,t);if(!src.allowed)return src;
 return chain(c,t,src);
}
export const productionIssuerDeny=()=>no('F06_REAL_HANDOFF_PRODUCTION_ISSUER_NOT_WIRED');
export const completedDeny=()=>no('F06_REAL_HANDOFF_COMPLETED_NOT_AUTHORIZED');
export const financialDeny=()=>no('F06_REAL_HANDOFF_REAL_MONEY_NOT_AUTHORIZED');
