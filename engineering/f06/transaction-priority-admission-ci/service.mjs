// 仅CI：通过原F05-8 arbitrateCI(auth.withSession包装)在同一物理事务先锁Vehicle及双源验签。
// 严禁先提交前置检查再另起事务，严禁直接INSERT原Priority表。
import {gate,verify} from './migration.mjs';
import {arbitrateCI} from '../../f05/priority-arbitration-ttl-handover/service.mjs';
const fail=(code,extra={})=>({allowed:false,code,CI_ONLY:true,...extra});
const one=async(c,s,p=[])=> (await c.query(s,p)).rows[0];
const id=x=>Number.isSafeInteger(x)&&x>0&&x<2147483647;
const key=x=>typeof x==='string'&&/^[A-Za-z0-9._:-]{16,160}$/.test(x);
// 原冻结F05-7(v23)/F05-8(v24)校验要求21/22条完整历史账本。
// 5C先以物理24条链+当前Catalog完整验真，随后仅在受限事务客户端
// 的旧父验证SELECT上读取真正存在的历史版本前缀；绝不修改或伪造账本。
// 所有业务SQL透传同一个PostgreSQL Client，无第二连接或事务。
const historicalLedgerSQL='SELECT migration_id,checksum,structure_sha256 FROM public.f03_schema_migrations ORDER BY migration_id';
function signedHistoryClient(c,version){
 if(version!==21&&version!==22)throw Error('F06_5C_HISTORICAL_LEDGER_VERSION_DENIED');
 // 真实v23/v24物理目录投影：v24新增f05_8、v25新增f05_9、v26新增f05_10。
 // 这些变化只追加前缀化表/索引/触发器/函数，不改写更早对象；旧SHA必须自行匹配。
 // 不返回人为预设hash，仅返回PG catalog真实结果中属于该历史版本的原始行。
 const later=version===21?/(^|[.])f05_(8|9|10)_/:/(^|[.])f05_(9|10)_/;
 const isOriginalCatalogQuery=sql=>typeof sql==='string'&&sql.includes(' AS name')&&
  sql.includes(' AS definition')&&sql.includes('pg_namespace n')&&sql.includes("n.nspname='public'");
 const isSequenceCatalogQuery=sql=>typeof sql==='string'&&sql.includes('pg_sequences s')&&
  sql.includes("s.schemaname='public'")&&sql.includes(' AS definition');
 return {query:async(sql,...params)=>{
  if(typeof sql==='string'&&sql.trim()===historicalLedgerSQL)
   return c.query(historicalLedgerSQL+' LIMIT '+version,...params);
  const answer=await c.query(sql,...params);
  if(isOriginalCatalogQuery(sql)||isSequenceCatalogQuery(sql)){
   const rows=answer.rows.filter(r=>!later.test(String(r.name)));
   return {...answer,rows,rowCount:rows.length};
  }
  return answer;
 }};
}
export function signedFrozenParentSessionAdapterCI(auth,version){
 gate();
 if((version!==21&&version!==22)||!auth||typeof auth.withSession!=='function')
  throw Error('F06_5C_PARENT_SNAPSHOT_VERSION_OR_SESSION_DENIED');
 return {withSession:(token,callback,options)=>{
  if(typeof callback!=='function'||options?.normalOnly!==true)
   throw Error('F06_5C_PARENT_SESSION_OPTIONS_REQUIRED');
  return auth.withSession(token,async(c,a,s,now)=>{
   await verify(c); // 真实24条完整验真，然后再给历史签发器原有版本的账本视图
   return callback(signedHistoryClient(c,version),a,s,now);
  },options);
 }};
}
export const PRODUCTION_PRIORITY_ISSUER='F06_5C_PRODUCTION_PRIORITY_ISSUER_NOT_WIRED';
export const UPSTREAM_GAP='UPSTREAM_PRIORITY_ADMISSION_ATOMIC_SOURCE_GAP';
export function productionIssuerDeny(){return fail(PRODUCTION_PRIORITY_ISSUER)}
async function admissibility(c,a,p){
 const v=await one(c,'SELECT * FROM public.vehicles WHERE vehicle_id=$1 FOR UPDATE',[p.vehicleId]);
 if(!v)return fail('F06_5C_VEHICLE_NOT_FOUND');
 const cycles=(await c.query('SELECT listing_cycle_id,ended_at FROM public.vehicle_listing_cycles WHERE vehicle_id=$1 ORDER BY listing_cycle_id FOR SHARE',[p.vehicleId])).rows;
 const cy=cycles.find(x=>Number(x.listing_cycle_id)===p.listingCycleId);
 if(!cy||cy.ended_at||cycles.some(x=>!x.ended_at&&Number(x.listing_cycle_id)!==p.listingCycleId))
  return fail('F06_5C_STALE_OR_UNKNOWN_LISTING_CYCLE');
 if(v.archived_at||!((v.source_type==='wholesale'&&v.source_sale_status==='active')||
  (['mingbang','four_s'].includes(v.source_type)&&v.source_sale_status==='available')))
  return fail('F06_5C_VEHICLE_UNSALEABLE');
 const customer=await one(c,'SELECT * FROM public.customers WHERE customer_id=$1 FOR SHARE',[p.customerId]);
 if(!customer||customer.account_status!=='active')return fail('F06_5C_CUSTOMER_NOT_ACTIVE');
 if(a.principal_kind!=='employee'||a.system_admin_id!==null||a.credential_state!=='enabled'||
 a.subject_status!=='active'||a.force_password_change!==false||
 !['sales','manager','store_head'].includes(a.role_code))
  return fail('F06_5C_EMPLOYEE_SESSION_DENIED');
 const who=await one(c,"SELECT e.employee_id,r.role_code,e.employment_status FROM public.employees e JOIN public.roles r ON r.role_id=e.main_role_id WHERE e.employee_id=$1 FOR SHARE OF e,r",[a.employee_id]);
 if(!who||who.employment_status!=='active'||who.role_code!==a.role_code)
  return fail('F06_5C_ACTOR_SOURCE_OR_ROLE_DRIFT');
 // 独立授权及数据域均通过真实 PG 行锁复验；资格与 Match 绝不从角色推断。
 const scoped=await one(c,
 "SELECT p.permission_id FROM public.permissions p "+
 "JOIN public.employee_permission_overrides o ON o.permission_id=p.permission_id AND o.employee_id=$1 AND o.decision='allow' "+
 "JOIN public.employee_capability_scope_bindings b ON b.employee_id=$1 AND b.permission_id=p.permission_id "+
 "JOIN public.employee_data_scopes s ON s.scope_id=b.scope_id AND s.employee_id=$1 "+
 "JOIN public.employee_team_memberships m ON m.employee_id=$1 "+
 "JOIN public.teams t ON t.team_id=m.team_id JOIN public.stores st ON st.store_id=t.store_id "+
 "WHERE p.permission_code='matching.rule.manage.ci.synthetic' AND t.team_id=$2 "+
 "AND m.valid_from<=clock_timestamp() AND (m.ended_at IS NULL OR m.ended_at>clock_timestamp()) "+
 "AND b.granted_at<=clock_timestamp() AND (b.ended_at IS NULL OR b.ended_at>clock_timestamp()) "+
 "AND (s.ended_at IS NULL OR s.ended_at>clock_timestamp()) AND st.status='active' AND t.team_status='active' "+
 "AND ((s.scope_kind='team' AND s.scope_reference_id=t.team_id) OR "+
 "(a_placeholder=false AND s.scope_kind='store' AND s.scope_reference_id=st.store_id)) LIMIT 1 FOR SHARE OF p,o,b,s,m,t,st"
 .replace('a_placeholder=false',a.role_code==='manager'||a.role_code==='store_head'?'true':'false'),[a.employee_id,p.teamId]);
 if(!scoped)return fail('F06_5C_INDEPENDENT_PERMISSION_SCOPE_DENIED');
 const lock=await one(c,"SELECT lock_id FROM public.locks WHERE vehicle_id=$1 AND listing_cycle_id=$2 AND lock_status='active' AND expires_at>clock_timestamp() LIMIT 1 FOR SHARE",[p.vehicleId,p.listingCycleId]);
 if(lock)return fail('F06_5C_ACTIVE_LOCK_PREVENTS_NEW_PRIORITY');
 // 双读 public 和父 3B 来源，任何已在途或来源不一致首先拒绝。
 const publicTransactions=(await c.query('SELECT transaction_id,source_lock_id,status,customer_id,listing_cycle_id FROM public.transactions WHERE vehicle_id=$1 ORDER BY transaction_id FOR SHARE',[p.vehicleId])).rows;
 const origins=(await c.query('SELECT transaction_id,source_lock_id,status,customer_id,listing_cycle_id FROM f06_3b_ci.transaction_origins WHERE vehicle_id=$1 ORDER BY transaction_id FOR SHARE',[p.vehicleId])).rows;
 for(const t of publicTransactions){
  if(['in_progress','pending','trading','active'].includes(t.status))
   return fail('F06_5C_SIGNED_TRANSACTION_OCCUPIED_DENY',{transactionId:Number(t.transaction_id)});
  const signed=origins.find(x=>Number(x.transaction_id)===Number(t.transaction_id));
  if(!signed||Number(signed.source_lock_id)!==Number(t.source_lock_id)||
   Number(signed.customer_id)!==Number(t.customer_id)||Number(signed.listing_cycle_id)!==Number(t.listing_cycle_id))
    return fail('F06_5C_UNKNOWN_TRANSACTION_ORIGIN_SOURCE_GAP');
  if(signed.status==='in_progress'&&t.status!=='in_progress')
    return fail('F06_5C_PUBLIC_PARENT_TRANSACTION_STATE_DRIFT');
 }
 if(origins.some(t=>!publicTransactions.some(x=>Number(x.transaction_id)===Number(t.transaction_id))))
  return fail('F06_5C_ORPHAN_TRANSACTION_SOURCE_GAP');
 const active=await one(c,"SELECT priority_id FROM public.f05_8_priority_ci WHERE vehicle_id=$1 AND listing_cycle_id=$2 AND status='active' LIMIT 1 FOR SHARE",[p.vehicleId,p.listingCycleId]);
 if(active)return fail('F06_5C_EXISTING_ACTIVE_PRIORITY');
 const ended=(await c.query("SELECT priority_id,ended_reason FROM public.f05_8_priority_ci WHERE vehicle_id=$1 AND listing_cycle_id=$2 AND status='ended' ORDER BY priority_id FOR SHARE",[p.vehicleId,p.listingCycleId])).rows;
 for(const x of ended){
  if(x.ended_reason==='converted_to_lock'){
   const event=await one(c,"SELECT event_key FROM public.f05_8_events_ci WHERE priority_id=$1 AND event_kind='ended' AND event_key LIKE 'f06-1-priority-to-lock:%' LIMIT 1 FOR SHARE",[x.priority_id]);
   if(!event)return fail('F06_5C_UNSIGNED_CONVERTED_PRIORITY_HISTORY');
  }
 }
 const match=await one(c,"SELECT r.result_id FROM public.f05_7_result_versions_ci r JOIN public.demands d ON d.demand_id=r.demand_id AND d.customer_id=$1 AND d.demand_state='active' JOIN public.f05_8_qualification_ci q ON q.customer_id=$1 AND q.enabled=true WHERE r.vehicle_id=$2 AND r.listing_cycle_id=$3 AND r.status='current' AND r.tier IN ('high','acceptable') LIMIT 1 FOR SHARE OF r,d,q",[p.customerId,p.vehicleId,p.listingCycleId]);
 if(!match)return fail('F06_5C_CURRENT_MATCH_AND_QUALIFICATION_REQUIRED');
 // 这里只给内部父仲裁放行，不是Priority签发成功；最终只能由原arbitrateCI完成。
 return {allowed:true,code:'F06_5C_PRECHECK_VALIDATED'};
}
// 只能抛错才能让F03 withSession回滚；返回拒绝对象会被原Session提交。
// 父仲裁选择的Customer与请求目标不同，绝不允许落错胜者后再返回拒绝。
const rollbackMismatch=()=>{const e=Error('F06_5C_WINNER_MISMATCH_ROLLBACK');e.f06Rollback=true;throw e};
export async function requestSyntheticNewPriorityCI(auth,token,p={}){
 gate();
 if(!id(p.vehicleId)||!id(p.listingCycleId)||!id(p.customerId)||!id(p.teamId)||!key(p.eventKey))
  return fail('F06_5C_INVALID_ARGUMENTS');
 if(!auth||typeof auth.withSession!=='function')return fail('F06_5C_SIGNED_SESSION_REQUIRED');
 try{
  // 严格转发原真实签名Session，整个回调受其同一BEGIN/COMMIT管控。
  // wrapper自身没有连接池，也没有BEGIN/COMMIT或第二个独立查询连接。
  const scopedAuth={withSession:(t,originalCallback,options)=>{
   if(t!==token||options?.normalOnly!==true||typeof originalCallback!=='function')
    throw Error('F06_5C_PARENT_SESSION_CONTRACT_REQUIRED');
   return auth.withSession(t,async(c,a,s,now)=>{
    await c.query("SET LOCAL lock_timeout='1500ms'");
    const locked=await one(c,'SELECT vehicle_id FROM public.vehicles WHERE vehicle_id=$1 FOR UPDATE',[p.vehicleId]);
    if(!locked)return fail('F06_5C_VEHICLE_NOT_FOUND');
    const before=await one(c,'SELECT pg_backend_pid()::int pid,txid_current()::text txid');
    await verify(c);
    if(s?.restricted)return fail('F06_5C_RESTRICTED_SESSION');
    const precheck=await admissibility(c,a,p);
    if(!precheck.allowed)return precheck;
    const result=await originalCallback(signedHistoryClient(c,22),a,s,now);
    const after=await one(c,'SELECT pg_backend_pid()::int pid,txid_current()::text txid');
    if(before.pid!==after.pid||before.txid!==after.txid)
     throw Error('F06_5C_PARENT_TRANSACTION_IDENTITY_DRIFT');
    if(!result?.allowed)return result||fail(UPSTREAM_GAP);
    if(!result.created)return fail('F06_5C_NO_NEW_SIGNED_PRIORITY',{parentCode:result.code});
    if(!id(result.priorityId)||!id(result.customerId)||result.customerId!==p.customerId)
     rollbackMismatch();
    const signed=await one(c,"SELECT priority_id,customer_id,vehicle_id,listing_cycle_id,status,creation_key FROM public.f05_8_priority_ci WHERE priority_id=$1 FOR SHARE",[result.priorityId]);
    const created=await one(c,"SELECT event_key FROM public.f05_8_events_ci WHERE priority_id=$1 AND event_kind='created' AND event_key=$2 FOR SHARE",[result.priorityId,p.eventKey+':created']);
    if(!signed||!created||signed.status!=='active'||
     Number(signed.customer_id)!==p.customerId||Number(signed.vehicle_id)!==p.vehicleId||
     Number(signed.listing_cycle_id)!==p.listingCycleId||signed.creation_key!==p.eventKey)
     rollbackMismatch();
    return {allowed:true,CI_ONLY:true,code:'F06_5C_PARENT_SIGNED_PRIORITY_CREATED',
     priorityId:result.priorityId,customerId:result.customerId,pgBackendPid:after.pid,
     pgTransactionId:after.txid,parentCode:result.code};
   },options);
  }};
  return await arbitrateCI(scopedAuth,token,{teamId:p.teamId,vehicleId:p.vehicleId,
   listingCycleId:p.listingCycleId,runKey:p.eventKey})||fail('F06_5C_SIGNED_SESSION_DENIED');
 }catch(e){
  if(e.f06Rollback||e.message==='F06_5C_WINNER_MISMATCH_ROLLBACK')
   return fail('F06_5C_WINNER_MISMATCH_ROLLED_BACK');
  if(['55P03','40P01','40001','23505'].includes(e.code))
   return fail('F06_5C_PG_CONTENTION_ATOMIC_DENY',{sqlstate:e.code});
  throw e;
 }
}
