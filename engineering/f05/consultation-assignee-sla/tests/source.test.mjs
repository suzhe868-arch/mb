import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect,verify} from '../migration.mjs';
import {createConsultationCI,employeeConsultationActionCI,withdrawConsultationCI,
 safeCustomerProjectionCI,internalConsultationProjectionCI,productionDeny} from '../service.mjs';
import {createRecommendationCI} from '../../recommendation-visibility-grants/service.mjs';
const c=await connect(),auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,
 secret:randomBytes(32),origin:'https://127.0.0.1:48989'});
const q=(sql,args=[])=>c.query(sql,args).then(z=>z.rows);
const proof='CI_SYNTHETIC_PHONE_CONSENT_NOT_PRODUCTION';
const k=x=>'f05-10-pdm15-real-pg16-'+x;
let token,cid,vehicleId,cycleId,customer=899612,other=899613,recId;
const create=(who,source='search',extra={})=>createConsultationCI(c,{
 customerId:who,vehicleId,listingCycleId:cycleId,eventKey:k('open-'+who+'-'+source+'-'+Math.random().toString(16).slice(2)),
 intent:'consult',syntheticPhoneConsent:proof,directSource:source,...extra});
const act=(id,action,extra={})=>employeeConsultationActionCI(auth,token,{
 consultationId:id,action,eventKey:k(action+'-'+id+'-'+Math.random().toString(16).slice(2)),...extra});
test.before(async()=>{
 assert.equal((await verify(c)).verified,true);
 const login=await auth.login({login:'employee_test',password:'SyntheticF04_3_CurrentProof_2026',source:'f05-10-native-source'});
 assert.equal(login.code,'AUTH_OK');token=login.token;
 const candidate=await q("SELECT v.vehicle_id,lc.listing_cycle_id FROM public.vehicles v "+
  "JOIN public.vehicle_listing_cycles lc ON lc.vehicle_id=v.vehicle_id AND lc.ended_at IS NULL "+
  "WHERE v.source_sale_status IN('active','available') AND v.archived_at IS NULL "+
  "AND v.platform_visibility='visible' AND NOT EXISTS(SELECT 1 FROM public.f05_8_priority_ci p "+
  "WHERE p.vehicle_id=v.vehicle_id AND p.status='active' AND p.expires_at>now() AND p.customer_id<>$1) "+
  "ORDER BY v.vehicle_id LIMIT 1",[customer]);
 assert.ok(candidate.length,'signed M94 current Vehicle required');vehicleId=Number(candidate[0].vehicle_id);cycleId=Number(candidate[0].listing_cycle_id);
 console.log('F05_10_NATIVE_REAL_M94_VEHICLE_AND_CUSTOMERS',{vehicleId,cycleId,customer,other,
  pid:(await q('SELECT pg_backend_pid() pid'))[0].pid});
});
test.after(async()=>{await auth.close();await c.end()});
test('10-S01 real M94-v26 signed ledger, v25 seal, no production issuer',async()=>{
 const proofLedger=await verify(c);
 assert.equal(proofLedger.verified,true);
 assert.equal((await q('SELECT count(*)::int n FROM public.f03_schema_migrations'))[0].n,24);
 assert.equal(productionDeny().allowed,false);
 assert.match(productionDeny().code,/PRODUCTION_CONSULTATION/);
});
test('10-S02 phone rejected, fake intent/share-open/foreign source cannot create',async()=>{
 const before=(await q('SELECT count(*)::int n FROM public.f05_10_consultation_meta_ci'))[0].n;
 for(const p of [
  {syntheticPhoneConsent:'reject'}, {syntheticPhoneConsent:undefined},{intent:'share_open'},
  {intent:'favorite'},{intent:'search'},{directSource:'recommendation',sourceRecommendationId:99999999},
  {directSource:'ordinary_share',syntheticPhoneConsent:'FORGED'}
 ]){
  const a=await createConsultationCI(c,{customerId:customer,vehicleId,listingCycleId:cycleId,
   intent:'consult',syntheticPhoneConsent:proof,directSource:'search',eventKey:k('bad-consent'),...p});
  assert.equal(a.allowed,false,JSON.stringify(a));
 }
 assert.equal((await q('SELECT count(*)::int n FROM public.f05_10_consultation_meta_ci'))[0].n,before);
});
test('10-S03 real M94 Consultation created, original direct source + assignee + 900s frozen',async()=>{
 const z=await create(customer,'search');assert.equal(z.allowed,true,JSON.stringify(z));
 assert.equal(z.created,true);cid=z.consultationId;assert.equal(z.slaSeconds,900);
 const co=(await q('SELECT * FROM public.consultations WHERE consultation_id=$1',[cid]))[0];
 const meta=(await q('SELECT * FROM public.f05_10_consultation_meta_ci WHERE consultation_id=$1',[cid]))[0];
 assert.equal(co.status,'pending');assert.equal(co.assignee_employee_id.toString(),String(z.assignee));
 assert.equal(meta.source_kind,'search');assert.equal(meta.sla_policy_version,1);
 assert.equal(meta.sla_seconds,900);
 assert.equal(co.first_response_deadline.getTime(),meta.original_deadline.getTime());
 assert.equal((await q("SELECT count(*)::int n FROM public.f05_10_consultation_events_ci WHERE consultation_id=$1",[cid]))[0].n,1);
 await assert.rejects(()=>q("UPDATE public.f05_10_consultation_meta_ci SET source_kind='favorite' WHERE consultation_id=$1",[cid]),/F05_10_IMMUTABLE_SOURCE_SLA/);
 console.log('F05_10_REAL_M94_CONSULTATION_CREATED',{cid,assignee:z.assignee});
});
test('10-S04 second direct source touch cannot overwrite original, assignee or SLA',async()=>{
 const before=(await q('SELECT * FROM public.consultations WHERE consultation_id=$1',[cid]))[0];
 const touched=await create(customer,'favorite');assert.equal(touched.allowed,true,JSON.stringify(touched));
 assert.equal(touched.created,false);assert.equal(touched.consultationId,cid);
 const after=(await q('SELECT * FROM public.consultations WHERE consultation_id=$1',[cid]))[0];
 assert.deepEqual(after,before);assert.equal((await q('SELECT source_kind FROM public.f05_10_consultation_meta_ci WHERE consultation_id=$1',[cid]))[0].source_kind,'search');
 assert.equal((await q("SELECT count(*)::int n FROM public.consultations WHERE customer_id=$1 AND vehicle_id=$2 AND listing_cycle_id=$3 AND status IN('pending','processing')",[customer,vehicleId,cycleId]))[0].n,1);
});
test('10-S05 start processing and ordinary notes are not human response or deadline reset',async()=>{
 const before=(await q('SELECT first_response_deadline FROM public.consultations WHERE consultation_id=$1',[cid]))[0].first_response_deadline;
 const started=await act(cid,'start');assert.equal(started.allowed,true,JSON.stringify(started));
 assert.equal((await q('SELECT status FROM public.consultations WHERE consultation_id=$1',[cid]))[0].status,'processing');
 assert.equal((await q('SELECT first_response_at FROM public.f05_10_consultation_meta_ci WHERE consultation_id=$1',[cid]))[0].first_response_at,null);
 const note=await act(cid,'followup',{evidenceKind:'crm_note',evidenceRef:'synthetic-audit-crm-note'});
 assert.equal(note.allowed,true,JSON.stringify(note));
 assert.equal((await q('SELECT first_response_at FROM public.f05_10_consultation_meta_ci WHERE consultation_id=$1',[cid]))[0].first_response_at,null);
 assert.equal((await q('SELECT first_response_deadline FROM public.consultations WHERE consultation_id=$1',[cid]))[0].first_response_deadline.getTime(),before.getTime());
});
test('10-S06 true human service auditable fact completes first-response idempotently',async()=>{
 const a=await act(cid,'followup',{evidenceKind:'call',evidenceRef:'CI-REAL-HUMAN-CALL-00001'});
 assert.equal(a.allowed,true,JSON.stringify(a));
 const meta=(await q('SELECT * FROM public.f05_10_consultation_meta_ci WHERE consultation_id=$1',[cid]))[0];
 assert.ok(meta.first_response_at);assert.ok(meta.first_response_event_id);
 const b=await act(cid,'followup',{evidenceKind:'message',evidenceRef:'CI-REAL-HUMAN-MESSAGE-00002'});
 assert.equal(b.allowed,true,JSON.stringify(b));
 assert.equal((await q('SELECT first_response_event_id FROM public.f05_10_consultation_meta_ci WHERE consultation_id=$1',[cid]))[0].first_response_event_id.toString(),meta.first_response_event_id.toString());
});
test('10-S07 active separate Customer same vehicle, own safe projection, foreign deny',async()=>{
 const another=await create(other,'ordinary_share');assert.equal(another.allowed,true,JSON.stringify(another));
 const own=await safeCustomerProjectionCI(c,{consultationId:cid,customerId:customer,syntheticPhoneConsent:proof});
 assert.equal(own.allowed,true);assert.deepEqual(Object.keys(own).sort(),
 ['allowed','code','consultationId','status','closeReason','createdAt','hold','firstResponseRecorded'].sort());
 const foreign=await safeCustomerProjectionCI(c,{consultationId:cid,customerId:other,syntheticPhoneConsent:proof});
 assert.equal(foreign.allowed,false);
 const newOwner=(await q('SELECT assignee_employee_id FROM public.consultations WHERE consultation_id=$1',[cid]))[0].assignee_employee_id;
 assert.ok(newOwner);
});
test('10-S08 normal resolved, immutable close reason, terminal new intent creates new Consultation',async()=>{
 const closed=await act(cid,'close_resolved');assert.equal(closed.allowed,true,JSON.stringify(closed));
 let co=(await q('SELECT status,close_reason FROM public.consultations WHERE consultation_id=$1',[cid]))[0];
 assert.equal(co.status,'resolved');assert.equal(co.close_reason,'RESOLVED');
 await assert.rejects(()=>q("UPDATE public.consultations SET status='pending',completed_at=NULL,close_reason=NULL WHERE consultation_id=$1",[cid]),/F05_10_TERMINAL_NO_REVIVE/);
 const next=await create(customer,'other');assert.equal(next.allowed,true,JSON.stringify(next));assert.equal(next.created,true);assert.notEqual(next.consultationId,cid);
 cid=next.consultationId;
});
test('10-S09 Customer disable COMMIT creates independent hold, restoration no auto resume',async()=>{
 const prior=(await q('SELECT first_response_deadline FROM public.consultations WHERE consultation_id=$1',[cid]))[0].first_response_deadline;
 await q("UPDATE public.customers SET account_status='disabled' WHERE customer_id=$1",[customer]);
 let meta=(await q('SELECT * FROM public.f05_10_consultation_meta_ci WHERE consultation_id=$1',[cid]))[0];
 assert.equal(meta.customer_disabled_hold,true);assert.ok(meta.hold_at);
 assert.ok(Number(meta.remaining_ms)<=900000);
 assert.equal((await act(cid,'start')).allowed,false);
 assert.equal((await withdrawConsultationCI(c,{consultationId:cid,customerId:customer,eventKey:k('withdraw-on-hold'),syntheticPhoneConsent:proof})).allowed,false);
 await q("UPDATE public.customers SET account_status='active' WHERE customer_id=$1",[customer]);
 meta=(await q('SELECT * FROM public.f05_10_consultation_meta_ci WHERE consultation_id=$1',[cid]))[0];
 assert.equal(meta.customer_disabled_hold,true);
 const resumed=await act(cid,'resume');assert.equal(resumed.allowed,true,JSON.stringify(resumed));
 meta=(await q('SELECT * FROM public.f05_10_consultation_meta_ci WHERE consultation_id=$1',[cid]))[0];
 assert.equal(meta.customer_disabled_hold,false);
 assert.equal(meta.original_deadline.getTime(),prior.getTime());
});
test('10-S10 manager governance and full handover receipt, old assignee no null',async()=>{
 const prior=(await q('SELECT * FROM public.consultations WHERE consultation_id=$1',[cid]))[0];
 const moved=await act(cid,'handover',{targetEmployeeId:4,reason:'CI synthetic formal transfer'});
 assert.equal(moved.allowed,true,JSON.stringify(moved));
 const rec=(await q('SELECT * FROM public.f05_10_consultation_handover_ci WHERE consultation_id=$1',[cid]))[0];
 assert.equal(Number(rec.old_assignee_id),Number(prior.assignee_employee_id));
 assert.equal(Number(rec.new_assignee_id),4);
 const after=(await q('SELECT * FROM public.consultations WHERE consultation_id=$1',[cid]))[0];
 assert.equal(Number(after.assignee_employee_id),4);
 assert.equal(after.first_response_deadline.getTime(),prior.first_response_deadline.getTime());
 const oldAttempt=await act(cid,'start');assert.equal(oldAttempt.allowed,false,'Old assignee cannot mutate without management');
 console.log('F05_10_NATIVE_REAL_PG16_IMMUTABLE_HANDOVER',{cid,old:Number(rec.old_assignee_id),next:Number(rec.new_assignee_id)});
});
test('10-S11 legit Customer withdraw is resolved/CUSTOMER_WITHDRAWN, not fifth status',async()=>{
 const a=await withdrawConsultationCI(c,{consultationId:cid,customerId:customer,eventKey:k('customer-correct-withdraw'),syntheticPhoneConsent:proof});
 assert.equal(a.allowed,true,JSON.stringify(a));
 const co=(await q('SELECT status,close_reason FROM public.consultations WHERE consultation_id=$1',[cid]))[0];
 assert.equal(co.status,'resolved');assert.equal(co.close_reason,'CUSTOMER_WITHDRAWN');
 const wrong=await withdrawConsultationCI(c,{consultationId:cid,customerId:other,eventKey:k('wrong-withdraw'),syntheticPhoneConsent:proof});
 assert.equal(wrong.allowed,false);
});
test('10-S12 source fail closed: hidden other Customer cannot inherit grant or price',async()=>{
 const existing=await create(other,'favorite');
 assert.equal(existing.created,false,'Other Customer active Consultation already exists');
 const received=await q("SELECT count(*)::int n FROM public.f05_9_price_right_ci WHERE customer_id=$1 AND vehicle_id=$2 AND listing_cycle_id=$3",[other,vehicleId,cycleId]);
 assert.equal(received[0].n,0);
 // Existing Consultation does not mint Recommendation/Grant/price rights.
 assert.equal((await q("SELECT count(*)::int n FROM public.f05_9_recommendation_facts_ci WHERE customer_id=$1 AND vehicle_id=$2 AND listing_cycle_id=$3",[other,vehicleId,cycleId]))[0].n,0);
 const pending=(await q("SELECT consultation_id FROM public.consultations WHERE customer_id=$1 AND vehicle_id=$2 AND listing_cycle_id=$3 AND status='pending' ORDER BY consultation_id DESC LIMIT 1",[other,vehicleId,cycleId]))[0];
 assert.ok(pending);
 const q2=await q('SELECT count(*)::int n FROM public.f05_10_consultation_meta_ci');
 assert.ok(q2[0].n>=3);
 console.log('F05_10_DISPOSABLE_PDM15_NATIVE_PG16_SOURCE_COMPLETE',{cases:12,consultations:q2[0].n});
});
