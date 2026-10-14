// 仅 CI：Transaction/Priority 同 Vehicle 物理锁下的拒绝准入证明。
// F05-8 arbitrateCI 把 withSession 与内部签发封装为独立事务，缺乏可插入
// Vehicle 锁下原子重新验证交易来源的安全入口；禁止读完后另行调用。
import {gate,verify} from './migration.mjs';
const fail=(code,extra={})=>({allowed:false,code,CI_ONLY:true,...extra});
const one=async(c,s,p=[])=> (await c.query(s,p)).rows[0];
const id=x=>Number.isSafeInteger(x)&&x>0&&x<2147483647;
const key=x=>typeof x==='string'&&/^[A-Za-z0-9._:-]{16,160}$/.test(x);
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
 // F05-8 原始签发 API 不暴露同一 physical transaction+Vehicle mutex 内可安全调用的 signed issuer。
 // 即便此时没有 Transaction 也不得拆成 TOCTOU 的第二事务，绝不写 public.Priority。
 return fail(UPSTREAM_GAP);
}
export async function requestSyntheticNewPriorityCI(auth,token,p={}){
 gate();
 if(!id(p.vehicleId)||!id(p.listingCycleId)||!id(p.customerId)||!id(p.teamId)||!key(p.eventKey))
  return fail('F06_5C_INVALID_ARGUMENTS');
 if(!auth||typeof auth.withSession!=='function')return fail('F06_5C_SIGNED_SESSION_REQUIRED');
 try{
  return await auth.withSession(token,async(c,a,s)=>{
   await verify(c);
   await c.query("SET LOCAL lock_timeout='1500ms'");
   if(s?.restricted)return fail('F06_5C_RESTRICTED_SESSION');
   return admissibility(c,a,p);
  },{normalOnly:true})||fail('F06_5C_SIGNED_SESSION_DENIED');
 }catch(e){
  if(['55P03','40P01','40001','23505'].includes(e.code))
   return fail('F06_5C_PG_CONTENTION_ATOMIC_DENY',{sqlstate:e.code});
  throw e;
 }
}
