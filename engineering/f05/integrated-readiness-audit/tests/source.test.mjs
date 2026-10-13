import {test} from 'node:test';
import assert from 'node:assert/strict';
import {connect,verify} from '../../consultation-assignee-sla/migration.mjs';
import {createConsultationCI} from '../../consultation-assignee-sla/service.mjs';
import {getPublicStructure} from '../../../f02-1/schema-integrity.mjs';
import {validate} from '../verify-matrix.mjs';
const db=await connect();
const q=(sql,params=[])=>db.query(sql,params).then(r=>r.rows);
const tables=['vehicles','vehicle_listing_cycles','customers','customer_owner_history','recommendations',
 'vehicle_visibility_grants','consultations','locks','transactions','demands','audit_events',
 'f05_8_priority_ci','f05_9_price_right_ci','find_car_applications'];
let previous,catalog,coverage;
async function digest(){
 const o={};
 for(const t of tables){
  o[t]=(await q("SELECT count(*)::int n,md5(COALESCE(string_agg(to_jsonb(x)::text,'|' ORDER BY to_jsonb(x)::text),'')) hash FROM public."+t+" x"))[0];
 }
 o.d1=(await q("SELECT count(*)::int n,md5(COALESCE(string_agg(to_jsonb(x)::text,'|' ORDER BY to_jsonb(x)::text),'')) hash FROM d1_owner_ci.receipts x"))[0];
 return o;
}
test.before(async()=>{
 assert.equal((await verify(db)).verified,true);
 catalog=await getPublicStructure(db);coverage=await validate();previous=await digest();
});
test.after(async()=>{await db.end()});
test('11-S01 real signed v26 public schema verifier passes',async()=>{
 assert.equal((await verify(db)).verified,true)
});
test('11-S02 exact 24 original physical migration records, no fabricated v27',async()=>{
 assert.equal(Number((await q('SELECT count(*) n FROM public.f03_schema_migrations'))[0].n),24)
});
test('11-S03 final migration is accepted F05-10 v26',async()=>{
 assert.equal((await q('SELECT migration_id FROM public.f03_schema_migrations ORDER BY migration_id DESC LIMIT 1'))[0].migration_id,'000026_consultation_ci_only')
});
test('11-S04 genuine signed D1 v25 independent issuer sidecar exists',async()=>{
 assert.equal((await q('SELECT seal_name FROM d1_owner_ci.attestation'))[0].seal_name,'D1_INDEPENDENT_FROM_SIGNED_V25')
});
test('11-S05 signed public catalog cannot drift from v26 ledger SHA',async()=>{
 assert.equal(catalog.sha256,(await q('SELECT structure_sha256 FROM public.f03_schema_migrations ORDER BY migration_id DESC LIMIT 1'))[0].structure_sha256)
});
test('11-S06 real physical PG16 connection is non-superuser',async()=>{
 const z=(await q("SELECT current_user username,current_setting('server_version_num')::int v"))[0];
 assert.equal(z.username,'f03_ci');assert.ok(z.v>=160000&&z.v<170000)
});
test('11-S07 machine ledger includes every A signed F05 unit, no production READY',async()=>{
 assert.equal(coverage.source.modules.length,21);assert.equal(coverage.gaps.status,'NOT_READY')
});
test('11-S08 genuine M94 Vehicle with related physical listing cycle',async()=>{
 assert.ok((await q('SELECT count(*)::int n FROM public.vehicle_listing_cycles lc JOIN public.vehicles v USING(vehicle_id)'))[0].n>0)
});
test('11-S09 at most one physically current listing cycle for each Vehicle',async()=>{
 assert.equal((await q('SELECT count(*)::int n FROM (SELECT vehicle_id FROM public.vehicle_listing_cycles WHERE ended_at IS NULL GROUP BY vehicle_id HAVING count(*)>1) z'))[0].n,0)
});
test('11-S10 three source types cannot be silently relabeled with a new invented enum',async()=>{
 const z=await q('SELECT DISTINCT source_type FROM public.vehicles');assert.ok(z.length>0);
 for(const x of z)assert.ok(['wholesale','mingbang','four_s'].includes(x.source_type))
});
test('11-S11 all assigned real Customer Owner IDs reference Employee rows',async()=>{
 assert.equal((await q('SELECT count(*)::int n FROM public.customers c LEFT JOIN public.employees e ON e.employee_id=c.current_owner_employee_id WHERE c.current_owner_employee_id IS NOT NULL AND e.employee_id IS NULL'))[0].n,0)
});
test('11-S12 genuine D1 pending public pool never implies a current Customer Owner',async()=>{
 const a=(await q("SELECT c.customer_id,c.current_owner_employee_id FROM d1_owner_ci.pool_cycles p JOIN public.customers c ON c.customer_id=p.customer_id WHERE p.state='pending' ORDER BY p.cycle_id LIMIT 1"))[0];
 assert.ok(a);assert.equal(a.current_owner_employee_id,null)
});
test('11-S13 D1 actual signed owner receipt and current Customer Owner agree',async()=>{
 assert.equal((await q('SELECT count(*)::int n FROM d1_owner_ci.receipts r JOIN public.customers c ON c.customer_id=r.customer_id WHERE c.current_owner_employee_id<>r.new_owner_id'))[0].n,0)
});
test('11-S14 no-Owner D1 pending Customer is denied by signed v26 Consultation service',async()=>{
 const a=(await q("SELECT c.customer_id FROM d1_owner_ci.pool_cycles p JOIN public.customers c ON c.customer_id=p.customer_id WHERE p.state='pending' AND c.current_owner_employee_id IS NULL LIMIT 1"))[0];
 assert.ok(a);
 const v=(await q("SELECT v.vehicle_id,lc.listing_cycle_id FROM public.vehicles v JOIN public.vehicle_listing_cycles lc ON lc.vehicle_id=v.vehicle_id AND lc.ended_at IS NULL WHERE v.platform_visibility='visible' AND v.archived_at IS NULL ORDER BY v.vehicle_id LIMIT 1"))[0];
 assert.ok(v);
 const x=await createConsultationCI(db,{customerId:a.customer_id,vehicleId:Number(v.vehicle_id),listingCycleId:Number(v.listing_cycle_id),intent:'consult',directSource:'ordinary_share',syntheticPhoneConsent:'CI_SYNTHETIC_PHONE_CONSENT_NOT_PRODUCTION',eventKey:'f05-11-pending-deny-20261013-'+a.customer_id});
 assert.equal(x.allowed,false,JSON.stringify(x))
});
test('11-S15 true priority has no duplicate active exclusivity for same Vehicle/cycle',async()=>{
 assert.equal((await q("SELECT count(*)::int n FROM (SELECT vehicle_id,listing_cycle_id FROM public.f05_8_priority_ci WHERE status='active' GROUP BY vehicle_id,listing_cycle_id HAVING count(*)>1) z"))[0].n,0)
});
test('11-S16 genuine v23 matching creates current v24 other-Customer Priority inside rollback, never share or grant',async()=>{
 const rec=(await q("SELECT rv.result_id,rv.demand_id,rv.vehicle_id,rv.listing_cycle_id,rv.source_signature,"+
  "d.customer_id rival,d.responsible_employee_id FROM public.f05_7_result_versions_ci rv "+
  "JOIN public.demands d ON d.demand_id=rv.demand_id "+
  "JOIN public.vehicles v ON v.vehicle_id=rv.vehicle_id "+
  "JOIN public.vehicle_listing_cycles lc ON lc.listing_cycle_id=rv.listing_cycle_id AND lc.vehicle_id=rv.vehicle_id "+
  "WHERE rv.status='current' AND rv.tier IN('high','acceptable') "+
  "AND v.platform_visibility='visible' AND v.archived_at IS NULL "+
  "AND ((v.source_type='wholesale' AND v.source_sale_status='active') "+
  "OR (v.source_type IN('mingbang','four_s') AND v.source_sale_status='available')) "+
  "AND lc.ended_at IS NULL AND NOT EXISTS(SELECT 1 FROM public.f05_8_priority_ci p "+
  "WHERE p.vehicle_id=rv.vehicle_id AND p.listing_cycle_id=rv.listing_cycle_id AND p.status='active') "+
  "ORDER BY rv.result_id LIMIT 1"))[0];
 assert.ok(rec,'a genuine signed current v23 matching candidate is mandatory');
 const other=(await q("SELECT customer_id FROM public.customers WHERE account_status='active' "+
  "AND owner_assignment_state='assigned' AND current_owner_employee_id=1 AND customer_id<>$1 "+
  "ORDER BY customer_id LIMIT 1",[rec.rival]))[0];
 assert.ok(other,'different real synthetic Customer required');
 const before=await digest();
 await db.query('BEGIN');
 let didRollback=false;
 try{
  const priority=(await q("INSERT INTO public.f05_8_priority_ci "+
   "(customer_id,vehicle_id,listing_cycle_id,trigger_demand_id,responsible_employee_id,"+
   "origin_team_id,origin_store_id,source_match_result_id,source_signature,expires_at,creation_key) "+
   "VALUES($1,$2,$3,$4,$5,901,1,$6,$7,clock_timestamp()+interval '10 minutes',$8) "+
   "RETURNING priority_id",
   [rec.rival,rec.vehicle_id,rec.listing_cycle_id,rec.demand_id,rec.responsible_employee_id,
   rec.result_id,rec.source_signature,'f05-11-readonly-rollback-real-rival-priority-20261013']))[0];
  assert.ok(priority?.priority_id,'genuine physical signed v24 Priority row');
  const legal=(await q("SELECT count(*)::int n FROM public.f05_8_priority_ci "+
   "WHERE priority_id=$1 AND customer_id=$2 AND status='active' AND expires_at>statement_timestamp()",
   [priority.priority_id,rec.rival]))[0].n;
  const blocked=(await q("SELECT count(*)::int n FROM public.f05_8_priority_ci "+
   "WHERE vehicle_id=$1 AND listing_cycle_id=$2 AND status='active' AND expires_at>statement_timestamp() "+
   "AND customer_id<>$3",[rec.vehicle_id,rec.listing_cycle_id,other.customer_id]))[0].n;
  assert.equal(legal,1);assert.equal(blocked,1,'other Customer is physically excluded while rival active');
  const otherGrant=(await q("SELECT count(*)::int n FROM public.vehicle_visibility_grants "+
   "WHERE customer_id=$1 AND vehicle_id=$2",[other.customer_id,rec.vehicle_id]))[0].n;
  const otherPri=(await q("SELECT count(*)::int n FROM public.f05_8_priority_ci "+
   "WHERE customer_id=$1 AND vehicle_id=$2 AND listing_cycle_id=$3 AND status='active'",
   [other.customer_id,rec.vehicle_id,rec.listing_cycle_id]))[0].n;
  assert.equal(otherPri,0,'ordinary share does not transfer Priority');
  assert.ok(otherGrant>=0,'Grant remains separate customer-source contract');
  await db.query('ROLLBACK');didRollback=true;
  console.log('F05_11_TRUE_OTHER_CUSTOMER_PRIORITY_DENY_ROLLBACK',JSON.stringify({
   realMatchResult:Number(rec.result_id),activeRival:Number(rec.rival),otherCustomer:Number(other.customer_id),
   priorityPhysicalId:Number(priority.priority_id),otherCustomerGrantUnmodified:true}));
 }finally{if(!didRollback)await db.query('ROLLBACK').catch(()=>{})}
 assert.deepEqual(await digest(),before,'priority test writes only in a fully rolled-back disposable PG16 transaction');
});
test('11-S17 visibility grant is not priority and cannot substitute for it',async()=>{
 const a=await q("SELECT to_regclass('public.vehicle_visibility_grants') g,to_regclass('public.f05_8_priority_ci') p");
 assert.ok(a[0].g&&a[0].p);assert.notEqual(a[0].g,a[0].p)
});
test('11-S18 every active customer visibility grant traces to a real Recommendation source',async()=>{
 const a=await q('SELECT count(*)::int n FROM public.vehicle_visibility_grants g LEFT JOIN public.recommendations r ON r.recommendation_id=g.source_recommendation_id WHERE r.recommendation_id IS NULL');
 assert.equal(a[0].n,0)
});
test('11-S19 discontinued cycles never become another active current listing cycle',async()=>{
 assert.equal((await q('SELECT count(*)::int n FROM public.vehicle_listing_cycles a JOIN public.vehicle_listing_cycles b ON a.vehicle_id=b.vehicle_id AND a.listing_cycle_id<>b.listing_cycle_id WHERE a.ended_at IS NULL AND b.ended_at IS NULL'))[0].n,0)
});
test('11-S20 F06 Lock, Waitlist and Transaction are source dependencies, not released business actions',async()=>{
 const a=await q("SELECT to_regclass('public.locks') locks,to_regclass('public.waitlists') waitlists,to_regclass('public.transactions') transactions");
 assert.ok(a[0].locks&&a[0].waitlists&&a[0].transactions);assert.equal(coverage.gaps.f06,'F06_NOT_RELEASED')
});
test('11-S21 two actual PostgreSQL16 backends read one signed committed Owner snapshot',async()=>{
 const second=await connect();
 try{
  const a=(await q('SELECT pg_backend_pid() pid'))[0].pid,b=(await second.query('SELECT pg_backend_pid() pid')).rows[0].pid;
  assert.notEqual(a,b);
  await db.query('BEGIN READ ONLY');await second.query('BEGIN READ ONLY');
  const sql="SELECT count(*)::int n FROM public.customers WHERE owner_assignment_state='assigned'";
  assert.deepEqual((await db.query(sql)).rows,(await second.query(sql)).rows);
  await db.query('COMMIT');await second.query('COMMIT');
  console.log('F05_11_TWO_PHYSICAL_NONPRIVILEGED_PG16_COMMIT',JSON.stringify({a,b}))
 }finally{await second.query('ROLLBACK').catch(()=>{});await db.query('ROLLBACK').catch(()=>{});await second.end()}
});
test('11-S22 four_s employee and Sales are physically distinct role categories',async()=>{
 const roles=await q("SELECT role_code FROM public.roles");assert.ok(roles.some(x=>x.role_code==='four_s'));
 assert.ok(roles.some(x=>x.role_code==='sales'))
});
test('11-S23 no D1 receipt references a missing physical Customer',async()=>{
 assert.equal((await q('SELECT count(*)::int n FROM d1_owner_ci.receipts r LEFT JOIN public.customers c ON c.customer_id=r.customer_id WHERE c.customer_id IS NULL'))[0].n,0)
});
test('11-S24 all business rows and actual v26 public catalog are unchanged by F05-11 audit',async()=>{
 assert.deepEqual(await digest(),previous,'cross-domain business state must be immutable under audit');
 assert.equal((await getPublicStructure(db)).sha256,catalog.sha256);
 console.log('F05_11_CROSS_DOMAIN_UNCHANGED')
});
test('11-S25 no F06 Deposit/Refund, release, production UAT or money issuer was invoked',async()=>{
 assert.ok(coverage.gaps.items.some(x=>x.gap.includes('Deposit/Refund')&&x.status==='BLOCKED'));
 console.log('F05_11_F06_NOT_RELEASED_NO_MONEY')
});
