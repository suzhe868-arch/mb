import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect,verify} from '../../runtime-handover-ledger/migration.mjs';
import {createHandoverDraft,addPendingHandoverItem,recordItemFailure} from '../../runtime-handover-ledger/service.mjs';
import {readHandoverCustomerImpact as impact,readHandoverRecipientEligibility as recipient,readHandoverBatchCoverage as coverage,readHandoverCommitPreflight as preflight} from '../service.mjs';

const db=await connect(),secret=randomBytes(32);
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin:'https://127.0.0.1:48971'});
const credentials={manager:['http_test','SyntheticHttps_1234567'],other:['race_test','SyntheticRace_1234567'],ordinary:['limit_test','SyntheticLimit_1234567'],four:['four_s_test','SyntheticFourS_123456'],admin:['admin_test','SyntheticAdmin_1234567']};
const login=async key=>{const [login,password]=credentials[key];const a=await auth.login({login,password,source:'g2g_'+key+'_'+Math.random()});assert.equal(a.code,'AUTH_OK');return a};
let manager,second,other,ordinary,four,admin,restricted,batchId,customerItem;
const p=(recipientEmployeeId=4,teamId=901)=>({batchId,recipientEmployeeId,teamId});
const imp=(token=manager,teamId=901,options)=>impact(auth,token,{batchId,teamId},options);
const elig=(token=manager,recipientEmployeeId=4,teamId=901)=>recipient(auth,token,p(recipientEmployeeId,teamId));
const cov=(token=manager,recipientEmployeeId=4,teamId=901)=>coverage(auth,token,p(recipientEmployeeId,teamId));
const pref=(token=manager,recipientEmployeeId=4,teamId=901,options)=>preflight(auth,token,p(recipientEmployeeId,teamId),options);
const snapTables=['customers','customer_owner_history','demands','priority_leases','recommendations','consultations','waitlists','locks','transactions','handover_batches','handover_items','employee_permission_overrides','employee_data_scopes','employee_capability_scope_bindings','employee_team_memberships','employee_receiving_eligibility','audit_events','employees'];
const immutable=async()=>{const o={};for(const name of snapTables)o[name]=(await db.query('SELECT to_jsonb(t)::text body FROM public.'+name+' t ORDER BY to_jsonb(t)::text')).rows.map(x=>x.body);return o};
const errorFree=x=>{assert.equal(x.writeDenied,true);assert.equal(Object.hasOwn(x,'handoverComplete'),false);assert.equal(Object.hasOwn(x,'commitToken'),false);return x};
test.before(async()=>{
 assert.equal((await verify(db)).verified,true);
 const first=await login('manager');assert.equal(first.restricted,true);restricted=first.token;
 assert.equal((await auth.change({token:first.token,csrf:first.csrf,oldPassword:credentials.manager[1],newPassword:'Synthetic2G_ManagerNew_2026'})).code,'PASSWORD_CHANGED_REAUTH_REQUIRED');
 credentials.manager[1]='Synthetic2G_ManagerNew_2026';
 manager=(await login('manager')).token;second=(await login('manager')).token;other=(await login('other')).token;
 ordinary=(await login('ordinary')).token;four=(await login('four')).token;admin=(await login('admin')).token;
 const d=await createHandoverDraft(auth,manager,{changeKind:'planned_transfer',invalidAt:null,reason:'2G synthetic read only coverage',requestKey:'sg06-g-readonly-draft-00001',sourceEmployeeId:7});
 assert.equal(d.code,'LEDGER_DRAFT_CREATED');batchId=d.batchId;
 const item={batchId,fromEmployeeId:7,intendedToEmployeeId:4,objectId:'301',objectKind:'Customer'};
 const x=await addPendingHandoverItem(auth,manager,item);
 assert.equal(x.code,'LEDGER_ITEM_PENDING_ONLY');customerItem=x.itemId;
 const y=await addPendingHandoverItem(auth,manager,{...item,objectKind:'Demand',objectId:'401'});assert.equal(y.code,'LEDGER_ITEM_PENDING_ONLY');
});
test.after(async()=>{await auth.close();await db.end();secret.fill(0)});
test('G01 frozen 000001 to 000007 PG16 seal and exact 88 tables',async()=>{
 assert.equal((await verify(db)).verified,true);
 assert.equal((await db.query("SELECT count(*)::int n FROM pg_tables WHERE schemaname='public'")).rows[0].n,88);
 assert.equal((await db.query("SELECT count(*)::int n FROM public.f03_schema_migrations")).rows[0].n,6);
});
test('G02 deny System Admin / 4S / ordinary / restricted / non-own manager / revoked / spoof inputs',async()=>{
 const before=await immutable();const dead=(await login('manager')).token;await auth.logout(dead);
 for(const token of [admin,four,ordinary,other,restricted,dead,null,'Z'.repeat(43)]){
  const r=await imp(token);assert.equal(r.writeDenied,true);assert.notEqual(r.code,'G03_IMPACT_READ_ONLY');
 }
 for(const params of [{...p(),actorId:5},{...p(),handoverComplete:true},{...p(),commitToken:'fake'},{...p(),teamId:999},{...p(),batchId:9999}]){
  const r=await preflight(auth,manager,params);assert.notEqual(r.code,'PREFLIGHT_FACTS_CURRENT_BUT_WRITE_DENIED');
 }
 assert.deepEqual(await immutable(),before);
});
test('G03 full separate Customer / Demand 0,1,multiple / Priority Lease + Recommendation and seven domains',async()=>{
 const r=errorFree(await imp());assert.equal(r.code,'G03_IMPACT_READ_ONLY');assert.equal(r.customerCount,4);
 const kinds=new Set(r.objects.map(x=>x.kind));assert.deepEqual([...kinds].sort(),['Customer','Demand','Priority','Recommendation','Consultation','Waitlist','Lock','Transaction'].sort());
 assert.equal(r.objects.filter(x=>x.customerId==='304'&&x.kind==='Demand').length,0); // zero Demand
 assert.equal(r.objects.filter(x=>x.customerId==='305'&&x.kind==='Demand').length,1); // one Demand
 assert.equal(r.objects.filter(x=>x.customerId==='301'&&x.kind==='Demand').length,3); // multiple Demands
 assert.equal(r.objects.find(x=>x.kind==='Priority').relation.triggerDemandId,'401');
 assert.equal(r.objects.find(x=>x.kind==='Recommendation').relation.sourceDemandId,'401');
 assert.equal(r.objects.find(x=>x.objectId==='402').lifecycle,'REVALIDATE');
 assert.equal(r.objects.find(x=>x.objectId==='403').lifecycle,'TERMINAL');
 assert.equal(r.objects.find(x=>x.objectId==='5032').lifecycle,'TERMINAL');
 assert.equal(r.objects.find(x=>x.objectId==='5042').lifecycle,'TERMINAL');
 assert.equal(r.objects.find(x=>x.objectId==='5052').lifecycle,'UNKNOWN_DEFER_DENY');
 assert.equal(r.objects.find(x=>x.objectId==='5061').lifecycle,'ACTIVE');
 assert.equal(r.objects.find(x=>x.kind==='Priority').responsibleEmployeeId,null);
});
test('G04 recipient exact active receiving + eligible + current Team scope; no store-only, 4S, disabled, role spoof',async()=>{
 assert.equal((await elig()).code,'G04_ELIGIBILITY_FACTS_ONLY');
 assert.equal((await elig(manager,6)).code,'G04_ELIGIBILITY_FACTS_ONLY');
 assert.equal((await elig(manager,7)).code,'G04_SAME_EMPLOYEE_DENY');
 assert.equal((await elig(manager,2)).code,'G04_RECEIVER_NOT_ELIGIBLE');
 assert.equal((await elig(manager,9)).code,'G04_RECEIVER_NOT_ELIGIBLE');
 assert.equal((await elig(manager,1)).code,'G04_TARGET_OUTSIDE_TEAM_SCOPE'); // same active store + receiving eligibility but non-member
 assert.equal((await elig(manager,3)).code,'G04_RECEIVER_NOT_ELIGIBLE');
 assert.equal((await elig(manager,4,903)).code,'G02_TEAM_SCOPE_DENY');
 const memberBefore=await immutable();
 await db.query('UPDATE public.employee_team_memberships SET ended_at=now() WHERE employee_id=4 AND team_id=901');
 try{assert.equal((await elig()).code,'G04_TARGET_OUTSIDE_TEAM_SCOPE')}
 finally{await db.query('UPDATE public.employee_team_memberships SET ended_at=NULL WHERE employee_id=4 AND team_id=901')}
 assert.deepEqual(await immutable(),memberBefore);
 const before=await immutable();
 await db.query("UPDATE public.employee_receiving_eligibility SET eligible=false WHERE employee_id=4");
 try{assert.equal((await elig()).code,'G04_RECEIVER_NOT_ELIGIBLE');}finally{await db.query("UPDATE public.employee_receiving_eligibility SET eligible=true WHERE employee_id=4")}
 assert.deepEqual(await immutable(),before);
});
test('G04 personal deny and revoked Team binding cannot be bypassed with cached normal session',async()=>{
 const before=await immutable();
 await db.query("UPDATE public.employee_permission_overrides SET decision='deny' WHERE employee_id=5 AND permission_id=13");
 try{assert.equal((await imp()).code,'G02_TEAM_SCOPE_DENY');}
 finally{await db.query("UPDATE public.employee_permission_overrides SET decision='allow' WHERE employee_id=5 AND permission_id=13")}
 await db.query("UPDATE public.employee_capability_scope_bindings SET ended_at=now() WHERE employee_id=5 AND permission_id=13 AND scope_id=201");
 try{assert.equal((await imp()).code,'G02_TEAM_SCOPE_DENY');}
 finally{await db.query("UPDATE public.employee_capability_scope_bindings SET ended_at=NULL WHERE employee_id=5 AND permission_id=13 AND scope_id=201")}
 assert.deepEqual(await immutable(),before);
});
test('G06 every active domain unsupported until adapter; pending-only ledger cannot close responsibility',async()=>{
 const r=errorFree(await cov());assert.equal(r.code,'G06_COVERAGE_DEFER_DENY');
 assert.equal(r.overall,'DEFER_DENY');assert.equal(r.noDomainAdapterAccepted,true);
 for(const kind of ['Priority','Recommendation','Consultation','Waitlist','Lock','Transaction'])assert.equal(r.findings.some(x=>x.kind===kind&&x.reason==='UNSUPPORTED'),true);
 assert.equal(r.findings.find(x=>x.kind==='Customer'&&x.objectId==='301').reason,'PENDING_ITEM');
 assert.equal(r.findings.find(x=>x.kind==='Demand'&&x.objectId==='401').reason,'PENDING_ITEM');
 assert.equal(r.findings.find(x=>x.kind==='Demand'&&x.objectId==='402').reason,'REVALIDATE');
 assert.equal(r.findings.find(x=>x.kind==='Customer'&&x.objectId==='302').reason,'MISSING_ITEM');
 const original=await immutable();
 await db.query('UPDATE public.handover_items SET from_employee_id=6 WHERE item_id=$1',[customerItem]);
 try{assert.equal((await cov()).findings.find(x=>x.kind==='Customer'&&x.objectId==='301').reason,'CONFLICT')}
 finally{await db.query('UPDATE public.handover_items SET from_employee_id=7 WHERE item_id=$1',[customerItem])}
 assert.deepEqual(await immutable(),original);
 const otherReceiver=await cov(manager,6);assert.equal(otherReceiver.code,'G06_COVERAGE_DEFER_DENY');
 assert.equal(otherReceiver.findings.find(x=>x.kind==='Customer'&&x.objectId==='301').reason,'CONFLICT');
});
test('G05 preflight current facts return explicit write denied, no reusable token or completion marker',async()=>{
 const before=await immutable();const r=errorFree(await pref());assert.equal(r.code,'PREFLIGHT_FACTS_CURRENT_BUT_WRITE_DENIED');assert.equal(r.noReusableCommitToken,true);
 assert.equal(r.coverage.overall,'DEFER_DENY');assert.deepEqual(await immutable(),before);
});
test('G05 concurrent owner changes cannot pass locked PG16 Customer row; same transaction returns WRITE_DENIED',async()=>{
 const before=await immutable();let pending,finished=false;
 const r=await pref(manager,4,901,{testCheckpoint:async step=>{if(step==='after_first_read'){
  pending=db.query('UPDATE public.customers SET current_owner_employee_id=4 WHERE customer_id=301').then(()=>{finished=true});
  await new Promise(resolve=>setTimeout(resolve,110));
  assert.equal(finished,false,'PG16 row lock must prevent owner update before preflight releases');
 }}});
 assert.equal(r.code,'PREFLIGHT_FACTS_CURRENT_BUT_WRITE_DENIED');
 assert.equal(r.lockedReadOnly,true);
 await pending;
 assert.equal(finished,true);
 assert.equal((await cov()).findings.find(x=>x.kind==='Customer'&&x.objectId==='301').reason,'REVALIDATE');
 await db.query('UPDATE public.customers SET current_owner_employee_id=7 WHERE customer_id=301');
 assert.deepEqual(await immutable(),before);
});
test('G05 a different PG16 session cannot withdraw Team permission during preflight locked scope read',async()=>{
 const before=await immutable();let pending,finished=false;
 const r=await pref(manager,4,901,{testCheckpoint:async step=>{if(step==='after_first_read'){
  pending=db.query("UPDATE public.employee_permission_overrides SET decision='deny' WHERE employee_id=5 AND permission_id=13").then(()=>{finished=true});
  await new Promise(resolve=>setTimeout(resolve,110));
  assert.equal(finished,false,'PG16 Team permission revoke blocked by transaction lock');
 }}});
 assert.equal(r.code,'PREFLIGHT_FACTS_CURRENT_BUT_WRITE_DENIED');await pending;
 assert.equal((await imp()).code,'G02_TEAM_SCOPE_DENY');
 await db.query("UPDATE public.employee_permission_overrides SET decision='allow' WHERE employee_id=5 AND permission_id=13");
 assert.deepEqual(await immutable(),before);
});
test('G03/G06 unknown priority status never inferred closed, newer independent source business still enumerated',async()=>{
 const before=await immutable();
 await db.query("UPDATE public.priority_leases SET status='unmapped_external_state' WHERE priority_id=5011");
 try{
  const r=await imp();assert.equal(r.objects.find(x=>x.kind==='Priority').lifecycle,'UNKNOWN_DEFER_DENY');
  assert.equal((await cov()).overall,'DEFER_DENY');
 }finally{await db.query("UPDATE public.priority_leases SET status='active' WHERE priority_id=5011")}
 await db.query('UPDATE public.customers SET current_owner_employee_id=4 WHERE customer_id=301');
 try{const r=await imp();assert.equal(r.objects.some(x=>x.kind==='Customer'&&x.objectId==='301'),true);assert.equal((await cov()).findings.find(x=>x.kind==='Customer'&&x.objectId==='301').reason,'REVALIDATE')}
 finally{await db.query('UPDATE public.customers SET current_owner_employee_id=7 WHERE customer_id=301')}
 assert.deepEqual(await immutable(),before);
});
test('G06/G07 retry_required still not completed; business history and audit unchanged by every preflight',async()=>{
 const before=await immutable();const failed=await recordItemFailure(auth,manager,{itemId:customerItem,attemptKey:'sg06-g-readonly-failure-0001',errorCode:'DOMAIN_ADAPTER_UNAVAILABLE'});
 assert.equal(failed.code,'LEDGER_FAILURE_RECORDED');const afterSetup=await immutable();
 for(const x of [await imp(),await elig(),await cov(),await pref()])errorFree(x);
 assert.equal((await cov()).findings.find(x=>x.kind==='Customer'&&x.objectId==='301').reason,'REVALIDATE');
 assert.deepEqual(await immutable(),afterSetup);
 assert.equal(afterSetup.handover_items.length,before.handover_items.length);
});

test('A-G-01 inactive planned_disable and sudden_inactive trusted source enumerate current owner/domain without transfer',async()=>{
 const before=await immutable();
 const planned=(await db.query("INSERT INTO public.handover_batches(source_employee_id,change_kind,initiated_by_kind,initiated_by_id,client_request_key,reason) VALUES(7,'planned_disable','employee',5,'sg06-g-inactive-plan-00001','CI synthetic planned handover') RETURNING batch_id")).rows[0].batch_id;
 const sudden=(await db.query("INSERT INTO public.handover_batches(source_employee_id,change_kind,initiated_by_kind,initiated_by_id,client_request_key,reason) VALUES(7,'sudden_inactive','employee',5,'sg06-g-inactive-sudden-001','CI synthetic sudden handover') RETURNING batch_id")).rows[0].batch_id;
 assert.equal((await impact(auth,manager,{batchId:Number(planned),teamId:901})).code,'G03_IMPACT_READ_ONLY');
 await db.query("UPDATE public.employees SET employment_status='inactive' WHERE employee_id=7");
 try{
  for(const id of [Number(planned),Number(sudden)]){
   const r=await impact(auth,manager,{batchId:id,teamId:901});
   assert.equal(r.code,'G03_IMPACT_READ_ONLY');assert.equal(r.objects.some(x=>x.kind==='Customer'&&x.objectId==='301'&&x.responsibleEmployeeId==='7'),true);
   assert.equal((await coverage(auth,manager,{batchId:id,recipientEmployeeId:4,teamId:901})).overall,'DEFER_DENY');
  }
  const unchangedPlan=await imp();
  assert.equal(unchangedPlan.code,'G02_BATCH_NOT_OWNED_OR_INACTIVE_SOURCE');
  const membership=(await db.query("SELECT membership_id FROM public.employee_team_memberships WHERE team_id=901 AND employee_id=7 AND ended_at IS NULL")).rows[0].membership_id;
  await db.query('UPDATE public.employee_team_memberships SET ended_at=now() WHERE membership_id=$1',[membership]);
  try{
   const refused=await impact(auth,manager,{batchId:Number(planned),teamId:901});
   assert.equal(refused.code,'G01_HANDOVER_AUTHORITY_GAP');
  }finally{await db.query('UPDATE public.employee_team_memberships SET ended_at=NULL WHERE membership_id=$1',[membership])}
 }finally{
  await db.query("UPDATE public.employees SET employment_status='active' WHERE employee_id=7");
  await db.query('DELETE FROM public.handover_batches WHERE batch_id=$1',[sudden]);
  await db.query('DELETE FROM public.handover_batches WHERE batch_id=$1',[planned]);
 }
 assert.deepEqual(await immutable(),before);
});
test('A-G-03 missing vs pending, same-destination cross-batch duplicate and differing target/owner conflicts',async()=>{
 const baseline=await immutable();
 assert.equal((await cov()).findings.find(x=>x.kind==='Customer'&&x.objectId==='302').reason,'MISSING_ITEM');
 assert.equal((await cov()).findings.find(x=>x.kind==='Customer'&&x.objectId==='301').reason,'REVALIDATE'); // prior test persisted 2E retry_required
 const alt=(await db.query("INSERT INTO public.handover_batches(source_employee_id,change_kind,initiated_by_kind,initiated_by_id,client_request_key,reason) VALUES(7,'planned_transfer','employee',5,'sg06-g-crossbatch-000001','CI synthetic cross batch') RETURNING batch_id")).rows[0].batch_id;
 const z={itemId:Number((await db.query("INSERT INTO public.handover_items(batch_id,object_kind,object_id,from_employee_id,intended_to_employee_id,status) VALUES($1,'Customer','301',7,4,'pending') RETURNING item_id",[alt])).rows[0].item_id)};
 try{
  const both=await cov();
  const f=both.findings.find(x=>x.kind==='Customer'&&x.objectId==='301');
  assert.equal(f.reason,'CONFLICT');assert.equal(f.relatedBatchIds.includes(String(alt)),true);
  assert.equal(f.relatedItemIds.includes(String(z.itemId)),true);assert.equal(f.crossBatchSourceOrTargetMismatch,false);
  await db.query('UPDATE public.handover_items SET intended_to_employee_id=6 WHERE item_id=$1',[z.itemId]);
  assert.equal((await cov()).findings.find(x=>x.kind==='Customer'&&x.objectId==='301').crossBatchSourceOrTargetMismatch,true);
  await db.query('UPDATE public.handover_items SET from_employee_id=6 WHERE item_id=$1',[z.itemId]);
  assert.equal((await cov()).findings.find(x=>x.kind==='Customer'&&x.objectId==='301').reason,'CONFLICT');
 }finally{
  await db.query('DELETE FROM public.handover_items WHERE batch_id=$1',[alt]);
  await db.query('DELETE FROM public.handover_batches WHERE batch_id=$1',[alt]);
 }
 assert.deepEqual(await immutable(),baseline);
});
test('A-G-04 cross-Team same Customer foreign Demand/Consultation/Lock/Priority/Recommendation never disclose foreign object ID, assignee or state',async()=>{
 const baseline=await immutable();
 await db.query("INSERT INTO public.vehicles(vehicle_id,source_type,source_sale_status,platform_visibility) VALUES(1003,'mingbang','available','visible')");
 await db.query("INSERT INTO public.vehicle_listing_cycles(listing_cycle_id,vehicle_id,started_at) VALUES(2003,1003,now()-interval '1 day')");
 try{
  await db.query("INSERT INTO public.demands(demand_id,customer_id,responsible_employee_id,demand_state,criteria_json) VALUES (406,301,1,'active','{}'::jsonb)");
  await db.query("INSERT INTO public.consultations(consultation_id,customer_id,vehicle_id,assignee_employee_id,status,source_relation,listing_cycle_id) VALUES(5033,301,1003,1,'processing','{}'::jsonb,2003)");
  await db.query("INSERT INTO public.locks(lock_id,vehicle_id,customer_id,listing_cycle_id,lock_status,responsible_employee_id,created_at,expires_at) VALUES(5053,1003,301,2003,'active',1,now()-interval '1 hour',now()+interval '3 hours')");
  await db.query("INSERT INTO public.recommendations(recommendation_id,vehicle_id,customer_id,listing_cycle_id,source_demand_id,status,recommender_employee_id) VALUES (5022,1003,301,2003,406,'active',1)");
  await db.query("INSERT INTO public.demand_match_results(result_id,demand_id,vehicle_id,listing_cycle_id,match_tier,match_explanation,current_state,calculated_at) VALUES(3012,406,1003,2003,'high','{}'::jsonb,'current',now())");
  await db.query("INSERT INTO public.priority_leases(priority_id,vehicle_id,customer_id,trigger_demand_id,status,expires_at,listing_cycle_id,source_match_result_id) VALUES(5012,1003,301,406,'active',now()+interval '3 hours',2003,3012)");
  const r=await imp();
  assert.equal(r.code,'G03_IMPACT_READ_ONLY');
  for(const [kind,id] of [['Demand','406'],['Consultation','5033'],['Lock','5053'],['Recommendation','5022'],['Priority','5012']])assert.equal(r.objects.some(x=>x.kind===kind&&x.objectId===id),false);
  for(const kind of ['Demand','Consultation','Lock','Recommendation','Priority'])assert.equal(r.protectedGaps.some(x=>x.kind===kind&&x.reason==='OUT_OF_SCOPE_DEFER_DENY'&&x.count>=1),true);
  const covr=await cov();
  assert.equal(covr.overall,'DEFER_DENY');assert.equal(covr.findings.some(x=>x.reason==='OUT_OF_SCOPE_DEFER_DENY'),true);
  const serialized=JSON.stringify({objects:r.objects,findings:covr.findings});
  for(const sensitiveId of ['406','5033','5053','5022','5012'])assert.equal(serialized.includes('"objectId":"'+sensitiveId+'"'),false);
  assert.equal((await pref()).code,'PREFLIGHT_FACTS_CURRENT_BUT_WRITE_DENIED');
 }finally{
  await db.query('DELETE FROM public.priority_leases WHERE priority_id=5012');
  await db.query('DELETE FROM public.demand_match_results WHERE result_id=3012');
  await db.query('DELETE FROM public.recommendations WHERE recommendation_id=5022');
  await db.query('DELETE FROM public.consultations WHERE consultation_id=5033');
  await db.query('DELETE FROM public.locks WHERE lock_id=5053');
  await db.query('DELETE FROM public.demands WHERE demand_id=406');
  await db.query('DELETE FROM public.vehicle_listing_cycles WHERE listing_cycle_id=2003');
  await db.query('DELETE FROM public.vehicles WHERE vehicle_id=1003');
 }
 assert.deepEqual(await immutable(),baseline);
});
test('A-G-02 lock contention fails closed and prevents phantom Demand/Lock insert across PG16 sessions',async()=>{
 const base=await immutable();
 await db.query('BEGIN');
 await db.query("UPDATE public.customers SET owner_assignment_state='assigned' WHERE customer_id=301");
 try{
  const r=await pref();assert.equal(r.code,'G05_LOCK_CONTENTION_DEFER_DENY');
 }finally{await db.query('ROLLBACK')}
 assert.deepEqual(await immutable(),base);
 let pending,done=false;
 const locked=await pref(manager,4,901,{testCheckpoint:async step=>{if(step==='after_first_read'){
  pending=db.query("INSERT INTO public.demands(demand_id,customer_id,responsible_employee_id,demand_state,criteria_json) VALUES(407,301,7,'active','{}'::jsonb)").then(()=>{done=true});
  await new Promise(ok=>setTimeout(ok,110));
  assert.equal(done,false,'SHARE table lock forbids new Demand phantom while preflight is active');
 }}});
 assert.equal(locked.code,'PREFLIGHT_FACTS_CURRENT_BUT_WRITE_DENIED');
 await pending;
 try{assert.equal((await imp()).objects.some(x=>x.kind==='Demand'&&x.objectId==='407'),true)}
 finally{await db.query('DELETE FROM public.demands WHERE demand_id=407')}
 assert.deepEqual(await immutable(),base);
});
test('G01/G07 existing migration tamper and extra public schema fail closed; nothing persists',async()=>{
 const before=await immutable();
 const checksum=(await db.query("SELECT checksum FROM public.f03_schema_migrations WHERE migration_id='000007_handover_batch_item_ledger'")).rows[0].checksum;
 await db.query("UPDATE public.f03_schema_migrations SET checksum='G03_TAMPER' WHERE migration_id='000007_handover_batch_item_ledger'");
 try{await assert.rejects(()=>imp(),/F03_2E_VERSION_DRIFT/);}finally{await db.query("UPDATE public.f03_schema_migrations SET checksum=$1 WHERE migration_id='000007_handover_batch_item_ledger'",[checksum])}
 await db.query('CREATE SCHEMA sg06_g03_illegal');
 try{await assert.rejects(()=>imp(),/F03_2E_ISOLATION_DENY/)}finally{await db.query('DROP SCHEMA sg06_g03_illegal')}
 assert.equal((await verify(db)).verified,true);
 assert.deepEqual(await immutable(),before);
});
