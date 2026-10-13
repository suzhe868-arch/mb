// F05-11 A首轮定向整改。仅一次性、非生产、非特权 PostgreSQL16；不启动任何F06业务或资金动作。
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect,verify} from '../../consultation-assignee-sla/migration.mjs';
import {createConsultationCI,employeeConsultationActionCI,internalConsultationProjectionCI} from '../../consultation-assignee-sla/service.mjs';
const proof='CI_SYNTHETIC_PHONE_CONSENT_NOT_PRODUCTION';
const identity='CI_SYNTHETIC_CUSTOMER_IDENTITY_NOT_PRODUCTION';
const db=await connect();
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,
 secret:randomBytes(32),origin:'https://127.0.0.1:49021'});
const q=(s,p=[])=>db.query(s,p).then(r=>r.rows);
const k=x=>'f05-11-remediation-20261013-'+x+'-'+randomBytes(5).toString('hex');
const hash=async(t)=> (await q("SELECT count(*)::int n,md5(COALESCE(string_agg(to_jsonb(x)::text,'|' ORDER BY to_jsonb(x)::text),'')) h FROM public."+t+" x"))[0];
test.before(async()=>{assert.equal((await verify(db)).verified,true)});
test.after(async()=>{await auth.close();await db.end()});

test('11-R01 current v24 rival Priority denies actual ordinary_share F05-9 projection and F05-10 Consultation, signed end restores',async()=>{
 const rec=(await q("SELECT rv.result_id,rv.demand_id,rv.vehicle_id,rv.listing_cycle_id,rv.source_signature,"+
  "d.customer_id rival,d.responsible_employee_id FROM public.f05_7_result_versions_ci rv "+
  "JOIN public.demands d ON d.demand_id=rv.demand_id JOIN public.vehicles v ON v.vehicle_id=rv.vehicle_id "+
  "JOIN public.vehicle_listing_cycles lc ON lc.listing_cycle_id=rv.listing_cycle_id AND lc.vehicle_id=rv.vehicle_id "+
  "WHERE rv.status='current' AND rv.tier IN('high','acceptable') AND lc.ended_at IS NULL "+
  "AND v.archived_at IS NULL AND v.platform_visibility='visible' "+
  "AND ((v.source_type='wholesale' AND v.source_sale_status='active') "+
  "OR (v.source_type IN('mingbang','four_s') AND v.source_sale_status='available')) "+
  "AND NOT EXISTS (SELECT 1 FROM public.f05_8_priority_ci p WHERE p.vehicle_id=rv.vehicle_id "+
  "AND p.listing_cycle_id=rv.listing_cycle_id AND p.status='active') ORDER BY rv.result_id LIMIT 1"))[0];
 assert.ok(rec,'must use actual signed current v23 matching result');
 const other=(await q("SELECT c.customer_id FROM public.customers c "+
  "WHERE c.account_status='active' AND c.owner_assignment_state='assigned' "+
  "AND c.current_owner_employee_id=1 AND c.customer_id<>$1 "+
  "AND NOT EXISTS(SELECT 1 FROM public.consultations co WHERE co.customer_id=c.customer_id "+
  "AND co.vehicle_id=$2 AND co.listing_cycle_id=$3 AND co.status IN('pending','processing')) "+
  "ORDER BY c.customer_id LIMIT 1",[rec.rival,rec.vehicle_id,rec.listing_cycle_id]))[0];
 assert.ok(other,'must have separate real synthetic eligible Customer');
 const p={customerId:Number(other.customer_id),vehicleId:Number(rec.vehicle_id),
  listingCycleId:Number(rec.listing_cycle_id),entry:'ordinary_share',syntheticCustomerIdentity:identity};
 const visible=(await q('SELECT platform_visibility FROM public.vehicles WHERE vehicle_id=$1',[p.vehicleId]))[0];
 assert.equal(visible.platform_visibility,'visible','actual publicly visible vehicle required');
 const protectedTables=['vehicle_visibility_grants','f05_9_price_right_ci','locks','waitlists','transactions'];
 const baseline={};for(const t of protectedTables)baseline[t]=await hash(t);
 const count=async()=>(await q("SELECT count(*)::int n FROM public.consultations WHERE customer_id=$1 AND vehicle_id=$2 AND listing_cycle_id=$3",[p.customerId,p.vehicleId,p.listingCycleId]))[0].n;
 const oldCount=await count();
 const pri=(await q("INSERT INTO public.f05_8_priority_ci "+
  "(customer_id,vehicle_id,listing_cycle_id,trigger_demand_id,responsible_employee_id,"+
  "origin_team_id,origin_store_id,source_match_result_id,source_signature,expires_at,creation_key) "+
  "VALUES($1,$2,$3,$4,$5,901,1,$6,$7,clock_timestamp()+interval '10 minutes',$8) RETURNING priority_id",
  [rec.rival,rec.vehicle_id,rec.listing_cycle_id,rec.demand_id,rec.responsible_employee_id,
   rec.result_id,rec.source_signature,k('priority')]))[0];
 assert.ok(pri?.priority_id);
 const rival=(await q("SELECT customer_id FROM public.f05_8_priority_ci WHERE priority_id=$1 AND status='active' AND expires_at>clock_timestamp()",[pri.priority_id]))[0];
 assert.equal(Number(rival.customer_id),Number(rec.rival));
 const cmd=()=>createConsultationCI(db,{...p,intent:'consult',directSource:'ordinary_share',
   syntheticPhoneConsent:proof,eventKey:k('ordinary-share-deny')});
 const denied=await cmd();
 assert.equal(denied.allowed,false,JSON.stringify(denied));
 assert.equal(denied.code,'F05_10_OTHER_CUSTOMER_PRIORITY_DENIED');
 assert.equal(await count(),oldCount,'denied create emitted no partial Consultation');
 for(const t of protectedTables)assert.deepEqual(await hash(t),baseline[t],t+' must not be minted/released by share');
 await q("UPDATE public.f05_8_priority_ci SET status='ended',ended_at=clock_timestamp(),ended_reason='employee_released' WHERE priority_id=$1",[pri.priority_id]);
 assert.equal((await q("SELECT status FROM public.f05_8_priority_ci WHERE priority_id=$1",[pri.priority_id]))[0].status,'ended');
 const allowed=await cmd();assert.equal(allowed.allowed,true,JSON.stringify(allowed));
 assert.ok(Number(allowed.consultationId)>0);
 for(const t of protectedTables)assert.deepEqual(await hash(t),baseline[t],t+' invariant even after legitimate Consultation');
 console.log('F05_11_R01_REAL_SIGNED_SERVICE_PRIORITY_RELEASE',JSON.stringify({priorityId:pri.priority_id,
  matchResult:rec.result_id,rival:rec.rival,other:p.customerId,denied:denied.code,allowed:allowed.code}));
});

test('11-R02 physical second PG16 backend COMMIT Permission revoke and Customer disable; old signed Employee token is denied',async()=>{
 const writer=await connect();let token;
 try{
  const aPid=(await q('SELECT pg_backend_pid() pid'))[0].pid;
  const bPid=(await writer.query('SELECT pg_backend_pid() pid')).rows[0].pid;
  assert.notEqual(aPid,bPid,'real distinct PG backends required');
  const login=await auth.login({login:'employee_test',password:'SyntheticF04_3_CurrentProof_2026',source:'f05-11-revocation'});
  assert.equal(login.code,'AUTH_OK',JSON.stringify(login));token=login.token;
  const target=(await q("SELECT co.consultation_id,co.customer_id FROM public.consultations co "+
   "JOIN public.f05_10_consultation_meta_ci m USING(consultation_id) "+
   "WHERE co.status IN('pending','processing') AND co.assignee_employee_id=1 "+
   "ORDER BY co.consultation_id DESC LIMIT 1"))[0];
  assert.ok(target,'real signed F05-10 current assigned Consultation required');
  const initial=await internalConsultationProjectionCI(auth,token,{consultationId:Number(target.consultation_id)});
  assert.equal(initial.allowed,true,JSON.stringify(initial));
  const eventsBefore=(await q('SELECT count(*)::int n FROM public.f05_10_consultation_events_ci WHERE consultation_id=$1',[target.consultation_id]))[0].n;
  await writer.query('BEGIN');
  await writer.query("UPDATE public.employee_permission_overrides SET decision='deny',changed_at=clock_timestamp() WHERE employee_id=1 AND permission_id=9105 AND decision='allow'");
  await writer.query('COMMIT');
  assert.equal((await q("SELECT decision FROM public.employee_permission_overrides WHERE employee_id=1 AND permission_id=9105"))[0].decision,'deny');
  const hidden=await internalConsultationProjectionCI(auth,token,{consultationId:Number(target.consultation_id)});
  assert.equal(hidden.allowed,false,'old signed token cannot read internal Consultation after revocation');
  assert.ok(!JSON.stringify(hidden).includes('source_relation'),'no sensitive Consultation payload on denial');
  const failed=await employeeConsultationActionCI(auth,token,{consultationId:Number(target.consultation_id),
   action:'start',eventKey:k('post-revoke-action')});
  assert.equal(failed.allowed,false,'old Employee token cannot mutate after committed permission deny');
  const emitted=(await q("SELECT count(*)::int n FROM public.f05_10_consultation_events_ci WHERE consultation_id=$1 AND event_key LIKE 'f05-11-remediation-20261013-post-revoke-action-%'",[target.consultation_id]))[0].n;
  assert.equal(emitted,0,'no event/receipt leaked from denied action');
  await writer.query('BEGIN');
  await writer.query("UPDATE public.employee_permission_overrides SET decision='allow',changed_at=clock_timestamp() WHERE employee_id=1 AND permission_id=9105");
  await writer.query('COMMIT');
  // Independently demonstrate Customer disable COMMIT and the signed F05-10 Guard.
  await writer.query('BEGIN');
  await writer.query("UPDATE public.customers SET account_status='disabled' WHERE customer_id=$1",[target.customer_id]);
  await writer.query('COMMIT');
  const blocked=await employeeConsultationActionCI(auth,token,{consultationId:Number(target.consultation_id),
   action:'start',eventKey:k('post-customer-disable')});
  assert.equal(blocked.allowed,false,'Customer disable committed on separate PG must block pending action');
  assert.equal((await q("SELECT count(*)::int n FROM public.f05_10_consultation_events_ci WHERE consultation_id=$1 AND event_key LIKE 'f05-11-remediation-20261013-post-customer-disable-%'",[target.consultation_id]))[0].n,0);
  await writer.query('BEGIN');
  await writer.query("UPDATE public.customers SET account_status='active' WHERE customer_id=$1",[target.customer_id]);
  await writer.query('COMMIT');
  assert.ok((await q('SELECT count(*)::int n FROM public.f05_10_consultation_events_ci WHERE consultation_id=$1',[target.consultation_id]))[0].n>=eventsBefore,
   'only legitimate automated guard events may be added, no denied action');
  console.log('F05_11_R02_TWO_NATIVE_BACKEND_COMMIT_REVOKE_CUSTOMER_DISABLE',JSON.stringify({
   aPid,bPid,consultationId:target.consultation_id,employeeDeny:hidden.code,
   mutationDeny:failed.code,customerDisableDeny:blocked.code}));
 }finally{
  await writer.query('ROLLBACK').catch(()=>{});
  await writer.query("UPDATE public.employee_permission_overrides SET decision='allow',changed_at=clock_timestamp() WHERE employee_id=1 AND permission_id=9105 AND decision='deny'").catch(()=>{});
  await writer.end();
 }
});

test('11-R03 signed Lock/Waitlist/Transaction physical state and F05 scope linkage remain READ ONLY',async()=>{
 const names=['locks','waitlists','transactions','customers','consultations','f05_8_priority_ci',
  'vehicle_visibility_grants','f05_9_price_right_ci'];
 const before={};for(const t of names)before[t]=await hash(t);
 const domains=[
  {table:'locks',id:'lock_id',state:'lock_status',
   effective:"lock_status='active' AND expires_at>statement_timestamp()",
   terminal:"lock_status<>'active' OR expires_at<=statement_timestamp()"},
  {table:'waitlists',id:'waitlist_id',state:"CASE WHEN x.ended_at IS NULL THEN 'active' ELSE 'ended' END",
   effective:'ended_at IS NULL',terminal:'ended_at IS NOT NULL'},
  {table:'transactions',id:'transaction_id',state:'status',
   effective:"status IN('trading','pending','active','in_progress')",
   terminal:"status NOT IN('trading','pending','active','in_progress')"}
 ];
 await db.query('BEGIN READ ONLY');
 const details=[];let openFacts=0,terminalFacts=0,ownerFacts=0,consultationFacts=0;
 try{
  assert.equal((await q('SHOW transaction_read_only'))[0].transaction_read_only,'on');
  for(const d of domains){
   // These are actual signed physical rows, not to_regclass() or an invented F06 issuer.
   const sql="SELECT x."+d.id+" AS id,x.customer_id,x.vehicle_id,x.listing_cycle_id,"+
    d.state+" AS real_state,c.current_owner_employee_id,c.owner_assignment_state,c.account_status,"+
    "lc.ended_at AS cycle_ended,v.source_type,"+
    "EXISTS(SELECT 1 FROM public.consultations co WHERE co.customer_id=x.customer_id "+
    "AND co.vehicle_id=x.vehicle_id AND co.listing_cycle_id=x.listing_cycle_id "+
    "AND co.status IN('pending','processing')) AS has_current_consultation,"+
    "EXISTS(SELECT 1 FROM public.f05_8_priority_ci p WHERE p.vehicle_id=x.vehicle_id "+
    "AND p.listing_cycle_id=x.listing_cycle_id AND p.status='active' "+
    "AND p.expires_at>statement_timestamp()) AS has_current_priority "+
    "FROM public."+d.table+" x "+
    "JOIN public.customers c ON c.customer_id=x.customer_id "+
    "JOIN public.vehicles v ON v.vehicle_id=x.vehicle_id "+
    "JOIN public.vehicle_listing_cycles lc ON lc.listing_cycle_id=x.listing_cycle_id AND lc.vehicle_id=x.vehicle_id "+
    "ORDER BY x."+d.id+" LIMIT 30";
   const rows=await q(sql);
   assert.ok(rows.length>0,'signed physical '+d.table+' must have actual Customer/Vehicle/Cycle rows');
   for(const item of rows){
    assert.ok(Number(item.id)>0&&Number(item.customer_id)>0&&Number(item.vehicle_id)>0&&
      Number(item.listing_cycle_id)>0,'real '+d.table+' composite business identity');
    assert.ok(typeof item.owner_assignment_state==='string'&&typeof item.account_status==='string');
    assert.ok(typeof item.real_state==='string'&&item.real_state.length>0,
      'signed '+d.table+' state must be taken from its REAL source column');
    if(item.current_owner_employee_id!==null)ownerFacts++;
    if(item.has_current_consultation)consultationFacts++;
   }
   const counts=(await q("SELECT count(*)::int total,"+
    "count(*) FILTER (WHERE "+d.effective+")::int effective,"+
    "count(*) FILTER (WHERE "+d.terminal+")::int terminal "+
    "FROM public."+d.table))[0];
   const joined=(await q("SELECT count(*)::int total,count(c.customer_id)::int customer_count,"+
    "count(v.vehicle_id)::int vehicle_count,count(lc.listing_cycle_id)::int cycle_count "+
    "FROM public."+d.table+" x "+
    "LEFT JOIN public.customers c ON c.customer_id=x.customer_id "+
    "LEFT JOIN public.vehicles v ON v.vehicle_id=x.vehicle_id "+
    "LEFT JOIN public.vehicle_listing_cycles lc ON lc.listing_cycle_id=x.listing_cycle_id AND lc.vehicle_id=x.vehicle_id"))[0];
   assert.equal(joined.total,counts.total);
   assert.equal(joined.customer_count,counts.total,d.table+' must have signed Customer FK');
   assert.equal(joined.vehicle_count,counts.total,d.table+' must have signed Vehicle FK');
   assert.equal(joined.cycle_count,counts.total,d.table+' must have signed listing cycle FK');
   assert.ok(counts.total>0);
   assert.equal(counts.effective+counts.terminal,counts.total,
    d.table+' active/protected and ended/terminal state partition must cover actual rows');
   openFacts+=counts.effective;terminalFacts+=counts.terminal;
   details.push({domain:d.table,actualRows:counts.total,
    effective:counts.effective,terminal:counts.terminal,
    sampled:rows.length,actualStates:[...new Set(rows.map(x=>x.real_state))],
    withCurrentOwner:rows.filter(x=>x.current_owner_employee_id!==null).length,
    withCurrentConsultation:rows.filter(x=>x.has_current_consultation).length,
    withPriority:rows.filter(x=>x.has_current_priority).length});
  }
  assert.ok(openFacts>0,'signed live Lock/Waitlist/Transaction protection must be physically read');
  assert.ok(terminalFacts>0,'signed terminal/released state must be physically read');
  assert.ok(ownerFacts>0,'cross-domain Customer Owner facts must be physically read');
  const consultationTotal=(await q("SELECT count(*)::int n FROM public.consultations WHERE status IN('pending','processing')"))[0].n;
  assert.ok(consultationTotal>0,'actual signed current Consultation rows must be read independent of F06 row overlap');
  assert.ok(consultationFacts<=consultationTotal*3,'overlap with F06 source rows is measured, never fabricated');
  // Real PG16 READ ONLY transaction rejects even zero-row write attempts.
  await assert.rejects(()=>q("UPDATE public.waitlists SET ended_at=clock_timestamp() WHERE false"),
   /read-only|read only|25006/i);
  await db.query('ROLLBACK');
 }catch(e){await db.query('ROLLBACK').catch(()=>{});throw e}
 for(const t of names)assert.deepEqual(await hash(t),before[t],
  'F06 read audit must not alter signed '+t);
 console.log('F05_11_R03_SIGNED_PHYSICAL_ROWS_STATES_OWNER_SCOPE_READ_ONLY',JSON.stringify(details));
});

test('11-R01G signed current v25 physical Grant is blocked by real v26 Priority then restored',async()=>{
 const rec=(await q("SELECT r.customer_id,r.vehicle_id,r.listing_cycle_id,g.grant_id FROM public.recommendations r "+
 "JOIN public.f05_9_recommendation_facts_ci f ON f.recommendation_id=r.recommendation_id "+
 "JOIN public.vehicle_visibility_grants g ON g.source_recommendation_id=r.recommendation_id "+
 "WHERE f.creation_key='f05-11-current-v25-grant-20261013' AND r.status='active' AND g.revoked_at IS NULL LIMIT 1"))[0];
 assert.ok(rec?.grant_id,'must use v25 real signed Recommendation-linked active Grant');
 const match=(await q("SELECT rv.result_id,rv.demand_id,rv.source_signature,d.customer_id rival,d.responsible_employee_id "+
 "FROM public.f05_7_result_versions_ci rv JOIN public.demands d ON d.demand_id=rv.demand_id "+
 "WHERE rv.vehicle_id=$1 AND rv.listing_cycle_id=$2 AND rv.status='current' "+
 "AND rv.tier IN('high','acceptable') AND d.customer_id<>$3 ORDER BY rv.result_id DESC LIMIT 1",
 [rec.vehicle_id,rec.listing_cycle_id,rec.customer_id]))[0];
 assert.ok(match,'genuine different-Customer signed matching source required');
 assert.equal((await q('SELECT platform_visibility FROM public.vehicles WHERE vehicle_id=$1',[rec.vehicle_id]))[0].platform_visibility,'hidden');
 const before=await Promise.all(['locks','waitlists','transactions','vehicle_visibility_grants','f05_9_price_right_ci'].map(hash));
 const open=()=>createConsultationCI(db,{customerId:Number(rec.customer_id),vehicleId:Number(rec.vehicle_id),
  listingCycleId:Number(rec.listing_cycle_id),intent:'consult',directSource:'ordinary_share',
  syntheticPhoneConsent:proof,eventKey:k('genuine-grant-source')});
 const initial=(await q("SELECT count(*)::int n FROM public.consultations WHERE customer_id=$1 AND vehicle_id=$2 AND listing_cycle_id=$3",
 [rec.customer_id,rec.vehicle_id,rec.listing_cycle_id]))[0].n;
 const priority=(await q("INSERT INTO public.f05_8_priority_ci "+
 "(customer_id,vehicle_id,listing_cycle_id,trigger_demand_id,responsible_employee_id,"+
 "origin_team_id,origin_store_id,source_match_result_id,source_signature,expires_at,creation_key) "+
 "VALUES($1,$2,$3,$4,$5,901,1,$6,$7,clock_timestamp()+interval '10 minutes',$8) RETURNING priority_id",
 [match.rival,rec.vehicle_id,rec.listing_cycle_id,match.demand_id,match.responsible_employee_id,
 match.result_id,match.source_signature,k('rival-priority')]))[0];
 const blocked=await open();
 assert.equal(blocked.allowed,false);assert.equal(blocked.code,'F05_10_OTHER_CUSTOMER_PRIORITY_DENIED');
 assert.equal((await q("SELECT count(*)::int n FROM public.consultations WHERE customer_id=$1 AND vehicle_id=$2 AND listing_cycle_id=$3",
 [rec.customer_id,rec.vehicle_id,rec.listing_cycle_id]))[0].n,initial);
 assert.equal((await q('SELECT revoked_at FROM public.vehicle_visibility_grants WHERE grant_id=$1',[rec.grant_id]))[0].revoked_at,null);
 await q("UPDATE public.f05_8_priority_ci SET status='ended',ended_at=clock_timestamp(),ended_reason='employee_released' WHERE priority_id=$1",[priority.priority_id]);
 const reopened=await open();assert.equal(reopened.allowed,true,JSON.stringify(reopened));
 assert.ok(Number(reopened.consultationId)>0,'legitimate Grant unlocks hidden source after rival Priority ends');
 const afterward=await Promise.all(['locks','waitlists','transactions','vehicle_visibility_grants','f05_9_price_right_ci'].map(hash));
 assert.deepEqual(afterward,before,'no protected F06 or Grant/PriceRight data altered by v26 Service');
 console.log('F05_11_R01G_GENUINE_SIGNED_GRANT_PRIORITY_RELEASE',JSON.stringify({grant:rec.grant_id,priority:priority.priority_id,blocked:blocked.code,restored:reopened.code}));
});
