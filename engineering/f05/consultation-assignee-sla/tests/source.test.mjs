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
test('10-S06 synthetic signed PG evidence, fake reference denied and first human response idempotent',async()=>{
 const fake=await act(cid,'followup',{evidenceKind:'call',evidenceRef:'CI-FAKED-CALL-UNTRUSTED-00001'});
 assert.equal(fake.allowed,false,'A form-valid string is not signed human service proof');
 assert.equal((await q('SELECT first_response_at FROM public.f05_10_consultation_meta_ci WHERE consultation_id=$1',[cid]))[0].first_response_at,null);
 await q("INSERT INTO public.f05_10_human_service_evidence_ci(evidence_ref,consultation_id,actor_id,evidence_kind) VALUES($1,$2,1,'call')",['CI-REAL-HUMAN-CALL-00001',cid]);
 await q("INSERT INTO public.f05_10_human_service_evidence_ci(evidence_ref,consultation_id,actor_id,evidence_kind) VALUES($1,$2,1,'message')",['CI-REAL-HUMAN-MESSAGE-00002',cid]);
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

test('10-R02 v25 physical recommendation direct source, owner and assignee independence, hidden share denied',async()=>{
 const v=(await q('SELECT source_type FROM public.vehicles WHERE vehicle_id=$1',[vehicleId]))[0];
 const rr=(await q("INSERT INTO public.recommendations(vehicle_id,customer_id,listing_cycle_id,source_demand_id,status,recommender_employee_id) VALUES($1,$2,$3,NULL,'active',1) RETURNING recommendation_id",[vehicleId,customer,cycleId]))[0];
 const signedId=Number(rr.recommendation_id);
 await q("INSERT INTO public.f05_9_recommendation_facts_ci(recommendation_id,customer_id,vehicle_id,listing_cycle_id,original_recommender_id,original_price_snapshot,original_source_kind,creation_key) VALUES($1,$2,$3,$4,1,$5::jsonb,$6,$7)",[signedId,customer,vehicleId,cycleId,JSON.stringify({kind:'price_consultation',issuer:'CI_SYNTHETIC_PDM10_NOT_PRODUCTION'}),v.source_type,k('r02-signed-physical-recommendation')]);
 await q("INSERT INTO public.f05_9_recommendation_events_ci(recommendation_id,actor_employee_id,event_kind,event_key) VALUES($1,1,'created',$2)",[signedId,k('r02-signed-physical-created')]);
 const a=await create(customer,'recommendation',{sourceRecommendationId:signedId});
 assert.equal(a.allowed,true,JSON.stringify(a));assert.equal(a.created,true);
 assert.equal(a.directSource,'recommendation');
 const co=(await q('SELECT assignee_employee_id FROM public.consultations WHERE consultation_id=$1',[a.consultationId]))[0];
 assert.equal(Number(co.assignee_employee_id),1);
 const fixed=(await q('SELECT origin_team_id,origin_store_id,source_recommendation_id FROM public.f05_10_consultation_meta_ci WHERE consultation_id=$1',[a.consultationId]))[0];
 assert.equal(Number(fixed.source_recommendation_id),signedId);
 await q('UPDATE public.customers SET current_owner_employee_id=4 WHERE customer_id=$1',[customer]);
 try{
  assert.equal(Number((await q('SELECT assignee_employee_id FROM public.consultations WHERE consultation_id=$1',[a.consultationId]))[0].assignee_employee_id),1);
  const now=(await q('SELECT origin_team_id,origin_store_id FROM public.f05_10_consultation_meta_ci WHERE consultation_id=$1',[a.consultationId]))[0];
  assert.equal(Number(now.origin_team_id),Number(fixed.origin_team_id));
  assert.equal(Number(now.origin_store_id),Number(fixed.origin_store_id));
  const internal=await internalConsultationProjectionCI(auth,token,{consultationId:a.consultationId});
  assert.equal(internal.allowed,true,JSON.stringify(internal));
 }finally{await q('UPDATE public.customers SET current_owner_employee_id=1 WHERE customer_id=$1',[customer])}
 await q("UPDATE public.vehicles SET platform_visibility='hidden' WHERE vehicle_id=$1",[vehicleId]);
 try{
  const count=(await q('SELECT count(*)::int n FROM public.vehicle_visibility_grants WHERE vehicle_id=$1 AND customer_id=$2 AND source_recommendation_id=$3 AND revoked_at IS NULL',[vehicleId,customer,signedId]))[0].n;
  assert.equal(count,1);
  const touched=await create(customer,'ordinary_share');assert.equal(touched.allowed,true);assert.equal(touched.created,false);
  const denied=await create(other,'ordinary_share');assert.equal(denied.allowed,false);
 }finally{await q("UPDATE public.vehicles SET platform_visibility='visible' WHERE vehicle_id=$1",[vehicleId])}
 assert.equal((await act(a.consultationId,'close_normal')).allowed,true);
 console.log('F05_10_R02_V25_SIGNED_DIRECT_SOURCE_SCOPE',{signedId,consultationId:a.consultationId});
});
test('10-S13 NORMAL_CLOSED and invalid remain separate terminal statuses with no fifth status',async()=>{
 const n=await create(customer,'search');assert.equal(n.created,true,JSON.stringify(n));
 assert.equal((await act(n.consultationId,'close_normal')).allowed,true);
 const normal=(await q('SELECT status,close_reason FROM public.consultations WHERE consultation_id=$1',[n.consultationId]))[0];
 assert.equal(normal.status,'resolved');assert.equal(normal.close_reason,'NORMAL_CLOSED');
 const v=await create(customer,'other');assert.equal(v.created,true,JSON.stringify(v));
 assert.equal((await act(v.consultationId,'invalid')).allowed,true);
 const invalid=(await q('SELECT status,close_reason FROM public.consultations WHERE consultation_id=$1',[v.consultationId]))[0];
 assert.equal(invalid.status,'invalid');assert.equal(invalid.close_reason,'INVALID');
 assert.equal((await act(v.consultationId,'start')).allowed,false);
 const values=(await q('SELECT DISTINCT status FROM public.consultations WHERE consultation_id IN($1,$2)',[n.consultationId,v.consultationId])).map(z=>z.status);
 assert.ok(values.every(x=>['pending','processing','resolved','invalid'].includes(x)));
});
test('10-S14 versioned SLA policy only affects new Consultation, real disabled Hold retains remaining milliseconds',async()=>{
 const frozen=(await q('SELECT sla_seconds,original_deadline FROM public.f05_10_consultation_meta_ci WHERE consultation_id=$1',[cid]))[0];
 await q("UPDATE public.f05_10_consultation_policy_ci SET version=2,seconds=120 WHERE policy_key='default'");
 const n=await create(customer,'search');assert.equal(n.created,true,JSON.stringify(n));
 assert.equal(n.slaSeconds,120);
 const old=(await q('SELECT sla_seconds,original_deadline FROM public.f05_10_consultation_meta_ci WHERE consultation_id=$1',[cid]))[0];
 assert.deepEqual(old,frozen);
 const before=(await q('SELECT * FROM public.f05_10_consultation_meta_ci WHERE consultation_id=$1',[n.consultationId]))[0];
 await q("UPDATE public.customers SET account_status='disabled' WHERE customer_id=$1",[customer]);
 const held=(await q('SELECT * FROM public.f05_10_consultation_meta_ci WHERE consultation_id=$1',[n.consultationId]))[0];
 assert.equal(held.customer_disabled_hold,true);
 assert.ok(Number(held.remaining_ms)>=0&&Number(held.remaining_ms)<=120000);
 assert.equal((await act(n.consultationId,'followup',{evidenceKind:'call',evidenceRef:'CI-NO-EVIDENCE-HOLD-00001'})).allowed,false);
 await q("UPDATE public.customers SET account_status='active' WHERE customer_id=$1",[customer]);
 const notAuto=(await q('SELECT customer_disabled_hold FROM public.f05_10_consultation_meta_ci WHERE consultation_id=$1',[n.consultationId]))[0];
 assert.equal(notAuto.customer_disabled_hold,true);
 const resumed=await act(n.consultationId,'resume');assert.equal(resumed.allowed,true,JSON.stringify(resumed));
 const after=(await q('SELECT m.remaining_ms,m.original_deadline,c.first_response_deadline FROM public.f05_10_consultation_meta_ci m JOIN public.consultations c USING(consultation_id) WHERE m.consultation_id=$1',[n.consultationId]))[0];
 assert.equal(Number(after.remaining_ms),Number(held.remaining_ms));
 assert.equal(after.original_deadline.getTime(),before.original_deadline.getTime());
 const delta=after.first_response_deadline.getTime()-Date.now();
 assert.ok(delta>=Number(held.remaining_ms)-12000&&delta<=Number(held.remaining_ms)+12000,{delta,remaining:Number(held.remaining_ms)});
});
test('10-R04 Consultation CRM action preserves genuine cross-domain SQL row counts and hashes',async()=>{
 const tables=['recommendations','vehicle_visibility_grants','f05_9_recommendation_facts_ci','f05_9_price_right_ci','f05_8_priority_ci','locks','transactions','demands','customers'];
 const snapshot=async()=>{
  const result={};
  for(const t of tables){
   const rows=await q("SELECT count(*)::int n,md5(COALESCE(string_agg(to_jsonb(x)::text,'' ORDER BY to_jsonb(x)::text),'')) sha FROM public."+t+" x");
   result[t]=rows[0];
  }
  return result;
 };
 const open=(await q("SELECT consultation_id FROM public.consultations WHERE customer_id=$1 AND status IN('pending','processing') ORDER BY consultation_id DESC LIMIT 1",[customer]))[0];
 assert.ok(open);
 const before=await snapshot();
 const note=await act(open.consultation_id,'followup',{evidenceKind:'crm_note',evidenceRef:'CI-CRM-NOTE-IS-NOT-HUMAN-004'});
 assert.equal(note.allowed,true,JSON.stringify(note));
 const mine=await safeCustomerProjectionCI(c,{consultationId:open.consultation_id,customerId:customer,syntheticPhoneConsent:proof});
 assert.equal(mine.allowed,true);
 assert.deepEqual(await snapshot(),before);
});
test('10-R04 signed Vehicle offline COMMIT must not terminate existing open Consultation',async()=>{
 const before=(await q('SELECT source_sale_status FROM public.vehicles WHERE vehicle_id=$1',[vehicleId]))[0].source_sale_status;
 const co=(await q("SELECT consultation_id,status FROM public.consultations WHERE customer_id=$1 AND status IN('pending','processing') ORDER BY consultation_id DESC LIMIT 1",[customer]))[0];
 assert.ok(co);
 await q("UPDATE public.vehicles SET source_sale_status='offline' WHERE vehicle_id=$1",[vehicleId]);
 try{
  assert.equal((await create(customer,'search')).allowed,false);
  assert.equal((await q('SELECT status FROM public.consultations WHERE consultation_id=$1',[co.consultation_id]))[0].status,co.status);
 }finally{await q('UPDATE public.vehicles SET source_sale_status=$2 WHERE vehicle_id=$1',[vehicleId,before])}
});
test('10-S15 expired first-response SLA is derived and must never auto-close or pause for quiet hours',async()=>{
 const active=(await q("SELECT consultation_id FROM public.consultations WHERE customer_id=$1 AND status IN('pending','processing') ORDER BY consultation_id DESC LIMIT 1",[customer]))[0];
 assert.ok(active);
 assert.equal((await act(active.consultation_id,'close_normal')).allowed,true);
 await q("UPDATE public.f05_10_consultation_policy_ci SET version=3,seconds=1 WHERE policy_key='default'");
 const n=await create(customer,'search');assert.equal(n.created,true);assert.equal(n.slaSeconds,1);
 await q('SELECT pg_sleep(1.2)');
 const fact=(await q('SELECT co.status,co.close_reason,clock_timestamp()>co.first_response_deadline AS overdue FROM public.consultations co WHERE co.consultation_id=$1',[n.consultationId]))[0];
 assert.equal(fact.overdue,true);
 assert.equal(fact.status,'pending');assert.equal(fact.close_reason,null);
});
test('10-S16 two physical PG backends: employee status COMMIT automatically marks independent pending Guard',async()=>{
 const target=(await q("SELECT co.consultation_id,co.assignee_employee_id FROM public.consultations co WHERE co.customer_id=$1 AND co.status IN('pending','processing') ORDER BY co.consultation_id DESC LIMIT 1",[customer]))[0];
 assert.ok(target);assert.equal(Number(target.assignee_employee_id),1,'Synthetic owner/assignee must be employee 1');
 const second=await connect();
 try{
  const aPid=(await q('SELECT pg_backend_pid() pid'))[0].pid;
  const bPid=(await second.query('SELECT pg_backend_pid() pid')).rows[0].pid;
  assert.notEqual(aPid,bPid);
  await c.query('BEGIN');
  await c.query('SELECT consultation_id FROM public.f05_10_consultation_meta_ci WHERE consultation_id=$1 FOR UPDATE',[target.consultation_id]);
  await second.query('BEGIN');
  await second.query("SET LOCAL lock_timeout='250ms'");
  await assert.rejects(async()=>second.query("UPDATE public.employees SET employment_status='inactive' WHERE employee_id=1"),e=>e.code==='55P03');
  await second.query('ROLLBACK');await c.query('COMMIT');
  await second.query('BEGIN');
  await second.query("UPDATE public.employees SET employment_status='inactive' WHERE employee_id=1");
  await second.query('COMMIT');
  const meta=(await q('SELECT assignee_handover_pending FROM public.f05_10_consultation_meta_ci WHERE consultation_id=$1',[target.consultation_id]))[0];
  assert.equal(meta.assignee_handover_pending,true);
  const denied=await act(target.consultation_id,'start');assert.equal(denied.allowed,false);
  const auto=(await q("SELECT event_id FROM public.f05_10_consultation_events_ci WHERE consultation_id=$1 AND event_kind='assignee_invalid' AND actor_kind='system'",[target.consultation_id]));
  assert.equal(auto.length,1,'Source COMMIT itself must create independent, immutable Guard event');
  await second.query("UPDATE public.employees SET employment_status='active' WHERE employee_id=1");
  assert.equal((await q('SELECT assignee_handover_pending FROM public.f05_10_consultation_meta_ci WHERE consultation_id=$1',[target.consultation_id]))[0].assignee_handover_pending,true,'Restoring employment cannot silently clear pending without formal handover');
  console.log('F05_10_R01_TWO_NATIVE_BACKENDS_SOURCE_COMMIT_PENDING',{aPid,bPid,consultationId:Number(target.consultation_id),lockConflict:'55P03',autoEventCount:auto.length});
 }finally{await c.query('ROLLBACK').catch(()=>{});await second.end()}
});

test('10-R01 permission deny and binding revocation automatically set current PG Guard; receiving pool fallback',async()=>{
 const candidates=await q("SELECT customer_id FROM public.customers WHERE account_status='active' AND owner_assignment_state='assigned' AND current_owner_employee_id=1 AND customer_id NOT IN($1,$2) ORDER BY customer_id LIMIT 3",[customer,other]);
 assert.ok(candidates.length>=2,'Physical M94 must offer two independent customers with current owner 1');
 const first=Number(candidates[0].customer_id),second=Number(candidates[1].customer_id);
 const created=await create(first,'search');assert.equal(created.allowed,true,JSON.stringify(created));
 assert.equal(Number(created.assignee),1);
 await q("UPDATE public.employee_permission_overrides SET decision='deny' WHERE employee_id=1 AND permission_id=9105");
 const pending=(await q('SELECT assignee_handover_pending FROM public.f05_10_consultation_meta_ci WHERE consultation_id=$1',[created.consultationId]))[0];
 assert.equal(pending.assignee_handover_pending,true,'Permission deny source must materialize pending at COMMIT');
 const denied=await act(created.consultationId,'followup',{evidenceKind:'crm_note',evidenceRef:'CI-DENY-STALE-ASSIGNEE-001'});
 assert.equal(denied.allowed,false);
 const fallback=await create(second,'search');assert.equal(fallback.allowed,true,JSON.stringify(fallback));
 assert.equal(Number(fallback.assignee),4,'Only signed active eligible receiving pool member can take over');
 await q("UPDATE public.employee_permission_overrides SET decision='allow' WHERE employee_id=1 AND permission_id=9105");
 const orig=(await q('SELECT assignee_handover_pending FROM public.f05_10_consultation_meta_ci WHERE consultation_id=$1',[created.consultationId]))[0];
 assert.equal(orig.assignee_handover_pending,true,'Re-enabling permission does not auto-remove signed pending');
 const stale=await act(created.consultationId,'close_normal');
 assert.equal(stale.allowed,false,'Restored ordinary Sales cannot terminate unresolved pending before scoped Manager governance');
 const priorRole=(await q('SELECT main_role_id FROM public.employees WHERE employee_id=1'))[0].main_role_id;
 const managerRole=(await q("SELECT role_id FROM public.roles WHERE role_code='manager'"))[0].role_id;
 const mgrScope=(await q("SELECT sc.scope_id FROM public.employee_data_scopes sc JOIN public.f05_10_consultation_meta_ci m ON m.origin_team_id=sc.scope_reference_id WHERE m.consultation_id=$1 AND sc.employee_id=1 AND sc.scope_kind='team' AND sc.ended_at IS NULL ORDER BY sc.scope_id LIMIT 1",[created.consultationId]))[0];
 assert.ok(mgrScope,'Current Manager requires a real eligible object Team Scope');
 await q("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES(1,9106,'allow',now())");
 await q("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at) VALUES(1,9106,$1,now()-interval '1 day')",[mgrScope.scope_id]);
 await q('UPDATE public.employees SET main_role_id=$1 WHERE employee_id=1',[managerRole]);
 try{
  const moved=await act(created.consultationId,'handover',{targetEmployeeId:4,reason:'Scoped manager repairs physical pending guard'});
  assert.equal(moved.allowed,true,JSON.stringify(moved));
  assert.equal((await q('SELECT assignee_handover_pending FROM public.f05_10_consultation_meta_ci WHERE consultation_id=$1',[created.consultationId]))[0].assignee_handover_pending,false);
  const receipt=(await q('SELECT old_assignee_id,new_assignee_id,actor_id FROM public.f05_10_consultation_handover_ci WHERE consultation_id=$1',[created.consultationId]))[0];
  assert.equal(Number(receipt.old_assignee_id),1);assert.equal(Number(receipt.new_assignee_id),4);assert.equal(Number(receipt.actor_id),1);
 }finally{
  await q('UPDATE public.employees SET main_role_id=$1 WHERE employee_id=1',[priorRole]);
  await q('DELETE FROM public.employee_capability_scope_bindings WHERE employee_id=1 AND permission_id=9106');
  await q('DELETE FROM public.employee_permission_overrides WHERE employee_id=1 AND permission_id=9106');
 }
 assert.ok(candidates.length>=3,'Three independent eligible Customers required; do not close pending merely to free a customer');
 const nextCustomer=Number(candidates[2].customer_id);
 const again=await create(nextCustomer,'search');assert.equal(again.allowed,true,JSON.stringify(again));
 assert.equal(Number(again.assignee),1);
 await q("UPDATE public.employee_capability_scope_bindings SET ended_at=clock_timestamp() WHERE employee_id=1 AND permission_id=9105 AND ended_at IS NULL");
 assert.equal((await q('SELECT assignee_handover_pending FROM public.f05_10_consultation_meta_ci WHERE consultation_id=$1',[again.consultationId]))[0].assignee_handover_pending,true);
 const status=await act(again.consultationId,'start');assert.equal(status.allowed,false,'Revoked scope means old sales can neither progress nor read');
 const full=await internalConsultationProjectionCI(auth,token,{consultationId:again.consultationId});
 assert.equal(full.allowed,false);
 console.log('F05_10_R01_PERMISSION_AND_SCOPE_AUTO_GUARD',{first,second,consultationId:again.consultationId});
});

test('10-R02 genuine two-Store current scope Manager/StoreHead, 4S and remote sales denial, signed handover',async()=>{
 const chosen=(await q("SELECT customer_id FROM public.customers c WHERE account_status='active' AND owner_assignment_state='assigned' AND current_owner_employee_id=1 AND NOT EXISTS(SELECT 1 FROM public.consultations co WHERE co.customer_id=c.customer_id AND co.vehicle_id=$1 AND co.listing_cycle_id=$2 AND co.status IN('pending','processing') ) ORDER BY customer_id LIMIT 1",[vehicleId,cycleId]))[0];
 assert.ok(chosen,'A real currently assigned M94 Customer is required for distinct remote Consultation');
 const who=Number(chosen.customer_id),storeB=8997983,teamB=8997984,employeeB=8997601,otherB=8997602;
 const main=(await q('SELECT store_id,main_role_id FROM public.employees WHERE employee_id=1'))[0];
 const clone=(base,key,id)=>{
  const out={...base,[key]:id};
  for(const x of Object.keys(out))if(typeof out[x]==='string'&&/name|code|title/i.test(x))out[x]+='-f05-10-r02-'+id;
  return out;
 };
 const insertClone=async(table,object)=>{
  const keys=Object.keys(object);
  return q('INSERT INTO public.'+table+'('+keys.map(x=>'"'+x+'"').join(',')+') VALUES('+keys.map((_,i)=>'$'+(i+1)).join(',')+')',Object.values(object));
 };
 await insertClone('stores',clone((await q('SELECT * FROM public.stores WHERE store_id=$1',[main.store_id]))[0],'store_id',storeB));
 await insertClone('teams',{...clone((await q('SELECT * FROM public.teams WHERE team_id=901'))[0],'team_id',teamB),store_id:storeB});
 for(const [idx,id] of [employeeB,otherB].entries()){
  await q("INSERT INTO public.employees(employee_id,store_id,employment_status,receiving_status,main_role_id) SELECT $1,$2,'active','receiving',main_role_id FROM public.employees WHERE employee_id=1",[id,storeB]);
  await q("INSERT INTO public.employee_team_memberships(team_id,employee_id,valid_from,changed_by_system_admin_id) SELECT $1,$2,now()-interval '1 day',changed_by_system_admin_id FROM public.employee_team_memberships WHERE employee_id=1 AND team_id=901 LIMIT 1",[teamB,id]);
  await q("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES($1,9105,'allow',now())",[id]);
  await q("INSERT INTO public.employee_data_scopes(scope_id,employee_id,scope_kind,scope_reference_id) VALUES($1,$2,'team',$3)",[29998+idx,id,teamB]);
  await q("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at) VALUES($1,9105,$2,now()-interval '1 day')",[id,29998+idx]);
 }
 await q('UPDATE public.customers SET current_owner_employee_id=$2 WHERE customer_id=$1',[who,employeeB]);
 const consultation=await create(who,'search');assert.equal(consultation.allowed,true,JSON.stringify(consultation));
 assert.equal(Number(consultation.assignee),employeeB);
 const before=(await q('SELECT assignee_employee_id FROM public.consultations WHERE consultation_id=$1',[consultation.consultationId]))[0];
 assert.equal(Number(before.assignee_employee_id),employeeB);
 const noCross=await internalConsultationProjectionCI(auth,token,{consultationId:consultation.consultationId});
 assert.equal(noCross.allowed,false,'Remote object not inherited from home Sales role');
 const manager=(await q("SELECT role_id FROM public.roles WHERE role_code='manager'"))[0].role_id;
 const storeHead=(await q("SELECT role_id FROM public.roles WHERE role_code='store_head'"))[0].role_id;
 const fourS=(await q("SELECT role_id FROM public.roles WHERE role_code='four_s'"))[0].role_id;
 await q('UPDATE public.employees SET main_role_id=$1 WHERE employee_id=1',[manager]);
 const noPermission=await internalConsultationProjectionCI(auth,token,{consultationId:consultation.consultationId});
 assert.equal(noPermission.allowed,false,'A manager title alone does not authorize other-store read');
 await q("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES(1,9106,'allow',now())");
 await q("INSERT INTO public.employee_data_scopes(scope_id,employee_id,scope_kind,scope_reference_id) VALUES(29997,1,'store',$1)",[storeB]);
 await q("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at) VALUES(1,9106,29997,now()-interval '1 day')");
 const scoped=await internalConsultationProjectionCI(auth,token,{consultationId:consultation.consultationId});
 assert.equal(scoped.allowed,true,JSON.stringify(scoped));
 const transfer=await act(consultation.consultationId,'handover',{targetEmployeeId:otherB,reason:'CI signed scoped remote transfer'});
 assert.equal(transfer.allowed,true,JSON.stringify(transfer));
 const receipt=(await q('SELECT old_assignee_id,new_assignee_id,actor_id FROM public.f05_10_consultation_handover_ci WHERE consultation_id=$1',[consultation.consultationId]))[0];
 assert.equal(Number(receipt.old_assignee_id),employeeB);assert.equal(Number(receipt.new_assignee_id),otherB);
 assert.equal(Number(receipt.actor_id),1);
 // A real two-backend Customer disable COMMIT serializes Employee followup via signed Customer FOR SHARE.
 const writer=await connect();let racing;
 try{
  const writerPid=Number((await writer.query('SELECT pg_backend_pid() pid')).rows[0].pid);
  const originalPid=Number((await q('SELECT pg_backend_pid() pid'))[0].pid);
  assert.notEqual(writerPid,originalPid);
  await writer.query('BEGIN');
  await writer.query("UPDATE public.customers SET account_status='disabled' WHERE customer_id=$1",[who]);
  let finished=false;
  racing=act(consultation.consultationId,'followup',{evidenceKind:'crm_note',evidenceRef:'CI-CUSTOMER-DISABLE-RACE-001'});
  racing.then(()=>{finished=true},()=>{finished=true});
  await new Promise(done=>setTimeout(done,120));
  assert.equal(finished,false,'Employee Followup waits on physical Customer disable writer COMMIT');
  await writer.query('COMMIT');
  const rejected=await racing;assert.equal(rejected.allowed,false,JSON.stringify(rejected));
  const hold=(await q('SELECT customer_disabled_hold,remaining_ms FROM public.f05_10_consultation_meta_ci WHERE consultation_id=$1',[consultation.consultationId]))[0];
  assert.equal(hold.customer_disabled_hold,true);assert.ok(Number(hold.remaining_ms)>=0);
  await writer.query("UPDATE public.customers SET account_status='active' WHERE customer_id=$1",[who]);
  assert.equal((await q('SELECT customer_disabled_hold FROM public.f05_10_consultation_meta_ci WHERE consultation_id=$1',[consultation.consultationId]))[0].customer_disabled_hold,true);
  const resumed=await act(consultation.consultationId,'resume');assert.equal(resumed.allowed,true,JSON.stringify(resumed));
  const resumedTime=(await q('SELECT c.first_response_deadline,m.remaining_ms,m.customer_disabled_hold FROM public.consultations c JOIN public.f05_10_consultation_meta_ci m USING(consultation_id) WHERE c.consultation_id=$1',[consultation.consultationId]))[0];
  assert.equal(resumedTime.customer_disabled_hold,false);
  assert.equal(Number(resumedTime.remaining_ms),Number(hold.remaining_ms));
  const drift=resumedTime.first_response_deadline.getTime()-Date.now()-Number(hold.remaining_ms);
  assert.ok(Math.abs(drift)<4000,'Resume restores remaining milliseconds, never a fresh 900s: '+drift);
  console.log('F05_10_R03_TWO_REAL_BACKEND_CUSTOMER_HOLD_COMMIT',{writerPid,originalPid,consultationId:consultation.consultationId,remaining:Number(hold.remaining_ms)});
 }finally{await writer.query('ROLLBACK').catch(()=>{});await writer.end();if(racing)await racing.catch(()=>{})}
 await q('UPDATE public.employees SET main_role_id=$1 WHERE employee_id=1',[storeHead]);
 assert.equal((await internalConsultationProjectionCI(auth,token,{consultationId:consultation.consultationId})).allowed,true);
 await q("UPDATE public.employee_permission_overrides SET decision='deny' WHERE employee_id=1 AND permission_id=9106");
 assert.equal((await internalConsultationProjectionCI(auth,token,{consultationId:consultation.consultationId})).allowed,false);
 await q("UPDATE public.employee_permission_overrides SET decision='allow' WHERE employee_id=1 AND permission_id=9106");
 await q('UPDATE public.employees SET main_role_id=$1 WHERE employee_id=1',[fourS]);
 assert.equal((await internalConsultationProjectionCI(auth,token,{consultationId:consultation.consultationId})).allowed,false,'4S role cannot view even explicitly scoped CI Consultation');
 await q('UPDATE public.employees SET main_role_id=$1 WHERE employee_id=1',[main.main_role_id]);
 console.log('F05_10_R02_CROSS_STORE_MANAGER_HEAD_FOUR_S_DENY',{storeB,teamB,employeeB,otherB,consultationId:consultation.consultationId});
});

test('10-R02 legal active source Demand priority and revoked Demand to current Customer Owner fallback',async()=>{
 // Re-enable only the signed disposable CI work scope for employee 1. Old pending Guards stay immutable.
 await q("UPDATE public.employee_capability_scope_bindings SET ended_at=NULL WHERE employee_id=1 AND permission_id=9105 AND ended_at IS NOT NULL");
 const chosen=await q("SELECT c.customer_id FROM public.customers c WHERE c.account_status='active' AND c.owner_assignment_state='assigned' AND c.current_owner_employee_id=1 AND NOT EXISTS(SELECT 1 FROM public.consultations co WHERE co.customer_id=c.customer_id AND co.vehicle_id=$1 AND co.listing_cycle_id=$2 AND co.status IN('pending','processing')) ORDER BY c.customer_id LIMIT 2",[vehicleId,cycleId]);
 assert.equal(chosen.length,2,'Two real independently eligible M94 Customers required to test Demand fallback');
 const first=Number(chosen[0].customer_id),second=Number(chosen[1].customer_id);
 const d1=(await q("INSERT INTO public.demands(customer_id,responsible_employee_id,demand_state,criteria_json) VALUES($1,4,'active','{}'::jsonb) RETURNING demand_id",[first]))[0];
 const a=await create(first,'search',{sourceDemandId:Number(d1.demand_id)});
 assert.equal(a.allowed,true,JSON.stringify(a));assert.equal(Number(a.assignee),4,'Current active Demand responsible precedes Customer owner');
 const frozen=(await q('SELECT source_demand_id FROM public.f05_10_consultation_meta_ci WHERE consultation_id=$1',[a.consultationId]))[0];
 assert.equal(Number(frozen.source_demand_id),Number(d1.demand_id));
 await q("UPDATE public.employee_permission_overrides SET decision='deny' WHERE employee_id=4 AND permission_id=9105");
 assert.equal((await q('SELECT assignee_handover_pending FROM public.f05_10_consultation_meta_ci WHERE consultation_id=$1',[a.consultationId]))[0].assignee_handover_pending,true);
 const d2=(await q("INSERT INTO public.demands(customer_id,responsible_employee_id,demand_state,criteria_json) VALUES($1,4,'active','{}'::jsonb) RETURNING demand_id",[second]))[0];
 const b=await create(second,'search',{sourceDemandId:Number(d2.demand_id)});
 assert.equal(b.allowed,true,JSON.stringify(b));assert.equal(Number(b.assignee),1,'Revoked Demand responsible falls through to current eligible Customer Owner');
 await q("UPDATE public.employee_permission_overrides SET decision='allow' WHERE employee_id=4 AND permission_id=9105");
 assert.equal(Number((await q('SELECT assignee_employee_id FROM public.consultations WHERE consultation_id=$1',[a.consultationId]))[0].assignee_employee_id),4,'Demand-assignee history never drifts on capability recovery');
 console.log('F05_10_R02_SIGNED_DEMAND_OWNER_FALLBACK',{first,second,demandId1:d1.demand_id,demandId2:d2.demand_id,priorityAssignee:4,fallbackOwnerAssignee:1});
});

test('10-R02 owner pending/public pool cannot synthesize independent Consultation responsibility',async()=>{
 const pending=await q("SELECT customer_id FROM public.customers WHERE account_status='active' AND (owner_assignment_state<>'assigned' OR current_owner_employee_id IS NULL) ORDER BY customer_id LIMIT 1");
 assert.ok(pending.length,'M94 must contain an authentic unassigned/pending Customer');
 const denial=await create(Number(pending[0].customer_id),'search');
 assert.equal(denial.allowed,false,JSON.stringify(denial));
 assert.equal(denial.code,'F05_10_OWNER_ASSIGNMENT_OR_PUBLIC_POOL_REQUIRED','A signed active Customer with pending Owner must fail on assignment guard, not inactive/customer validity');
 console.log('F05_10_R02_PENDING_OWNER_FAIL_CLOSED',{customerId:Number(pending[0].customer_id),code:denial.code});
});

test('10-R04 genuine four_s Vehicle can be consulted but four_s employee role cannot mutate or read internal content',async()=>{
 const v=await q("SELECT v.vehicle_id,lc.listing_cycle_id,v.source_type,v.source_sale_status FROM public.vehicles v JOIN public.vehicle_listing_cycles lc ON lc.vehicle_id=v.vehicle_id AND lc.ended_at IS NULL WHERE v.source_type='four_s' AND v.source_sale_status='available' AND v.platform_visibility='visible' AND v.archived_at IS NULL AND NOT EXISTS(SELECT 1 FROM public.f05_8_priority_ci p WHERE p.vehicle_id=v.vehicle_id AND p.status='active' AND p.expires_at>now() AND p.customer_id<>$1) ORDER BY v.vehicle_id LIMIT 1",[customer]);
 assert.ok(v.length,'Physical eligible signed M94 4S Vehicle must exist, not fabricated 4S responsibility');
 const car=v[0];
 const createFourS=await createConsultationCI(c,{customerId:customer,vehicleId:Number(car.vehicle_id),listingCycleId:Number(car.listing_cycle_id),eventKey:k('4s-car-create-'+car.vehicle_id),intent:'consult',syntheticPhoneConsent:proof,directSource:'search'});
 assert.equal(createFourS.allowed,true,JSON.stringify(createFourS));
 assert.equal(createFourS.created,true,'Real 4S Vehicle creates independently scoped Consultation');
 const main=(await q('SELECT main_role_id FROM public.employees WHERE employee_id=1'))[0].main_role_id;
 const fourS=(await q("SELECT role_id FROM public.roles WHERE role_code='four_s'"))[0].role_id;
 await q('UPDATE public.employees SET main_role_id=$1 WHERE employee_id=1',[fourS]);
 try{
  const detail=await internalConsultationProjectionCI(auth,token,{consultationId:createFourS.consultationId});
  assert.equal(detail.allowed,false,'4S employee identity never implies full Consultation projection');
  const attempted=await act(createFourS.consultationId,'followup',{evidenceKind:'crm_note',evidenceRef:'CI-FOUR-S-DENIED-NOTE-001'});
  assert.equal(attempted.allowed,false,'4S employee cannot handle Consultation despite legitimate 4S source Vehicle');
 }finally{await q('UPDATE public.employees SET main_role_id=$1 WHERE employee_id=1',[main])}
 const customerView=await safeCustomerProjectionCI(c,{consultationId:createFourS.consultationId,customerId:customer,syntheticPhoneConsent:proof});
 assert.equal(customerView.allowed,true,'Legitimate Customer keeps safe view even with role revocation');
 console.log('F05_10_R04_FOUR_S_VEHICLE_ALLOW_EMPLOYEE_DENY',{vehicleId:Number(car.vehicle_id),consultationId:createFourS.consultationId});
});


test('10-R02 residual signed System Admin, inactive, four_s, cross-store and personal-DENY handover targets fail closed',async()=>{
 const sys=await auth.login({login:'admin_test',password:'SyntheticAdmin_1234567',source:'f05-10-signed-sys-admin'});
 assert.equal(sys.code,'AUTH_OK','Actual existing F03 system_admin signature required');
 const co=(await q("SELECT co.consultation_id FROM public.consultations co JOIN public.customers cu ON cu.customer_id=co.customer_id WHERE co.status IN('pending','processing') AND co.assignee_employee_id=1 AND cu.account_status='active' ORDER BY co.consultation_id DESC LIMIT 1"))[0];
 assert.ok(co,'Currently open, scoped Consultation required');const id=Number(co.consultation_id);
 const sysRead=await internalConsultationProjectionCI(auth,sys.token,{consultationId:id});
 assert.equal(sysRead.allowed,false,'System Admin is not an eligible Employee business reader');
 const sysHandover=await employeeConsultationActionCI(auth,sys.token,{consultationId:id,action:'handover',targetEmployeeId:4,reason:'Cannot self-authorize from system admin',eventKey:k('sys-admin-real')});
 assert.equal(sysHandover.allowed,false,'System Admin never has business mutation privileges');
 const frozen=(await q('SELECT assignee_employee_id,first_response_deadline FROM public.consultations WHERE consultation_id=$1',[id]))[0];
 const count=(await q('SELECT count(*)::int n FROM public.f05_10_consultation_handover_ci WHERE consultation_id=$1',[id]))[0].n;
 for(const targetEmployeeId of [3,2,8997601]){
  const x=await act(id,'handover',{targetEmployeeId,reason:'Disallowed recipient current scope'});
  assert.equal(x.allowed,false,JSON.stringify({targetEmployeeId,x}));
 }
 await q("UPDATE public.employee_permission_overrides SET decision='deny' WHERE employee_id=4 AND permission_id=9105");
 const rev=await act(id,'handover',{targetEmployeeId:4,reason:'Personal deny overrides target'});
 assert.equal(rev.allowed,false);
 await q("UPDATE public.employee_permission_overrides SET decision='allow' WHERE employee_id=4 AND permission_id=9105");
 assert.deepEqual((await q('SELECT assignee_employee_id,first_response_deadline FROM public.consultations WHERE consultation_id=$1',[id]))[0],frozen);
 assert.equal((await q('SELECT count(*)::int n FROM public.f05_10_consultation_handover_ci WHERE consultation_id=$1',[id]))[0].n,count);
 console.log('F05_10_R02_REAL_SIGNED_ADMIN_AND_TARGET_NEGATIVES',{consultationId:id,targets:[3,2,8997601,4],receiptsUnchanged:count});
});

test('10-R03 residual actual CI PDM23 quiet and DND source suppression cannot pause Consultation SLA',async()=>{
 const x=(await q("SELECT co.consultation_id,co.customer_id FROM public.consultations co JOIN public.customers cu ON cu.customer_id=co.customer_id WHERE co.status IN('pending','processing') AND cu.account_status='active' AND co.first_response_deadline IS NOT NULL ORDER BY co.consultation_id DESC LIMIT 1"))[0];
 assert.ok(x);const id=Number(x.consultation_id),who=Number(x.customer_id);
 await q("INSERT INTO public.f05_10_notification_quiet_ci(customer_id,dnd_enabled,quiet_from,quiet_to) VALUES($1,true,clock_timestamp()-interval '1 hour',clock_timestamp()+interval '1 hour') ON CONFLICT(customer_id) DO UPDATE SET dnd_enabled=true,quiet_from=EXCLUDED.quiet_from,quiet_to=EXCLUDED.quiet_to",[who]);
 const before=(await q("SELECT co.first_response_deadline,m.original_deadline,m.first_response_at,m.customer_disabled_hold FROM public.consultations co JOIN public.f05_10_consultation_meta_ci m USING(consultation_id) WHERE co.consultation_id=$1",[id]))[0];
 await q("INSERT INTO public.f05_10_notification_attempts_ci(consultation_id,customer_id,event_stage,decision) SELECT $1,$2,'first_response_timeout',CASE WHEN n.dnd_enabled AND clock_timestamp() BETWEEN n.quiet_from AND n.quiet_to THEN 'SKIPPED_DND' ELSE 'ELIGIBLE_NOT_SENT' END FROM public.f05_10_notification_quiet_ci n WHERE n.customer_id=$2",[id,who]);
 const attempt=(await q('SELECT decision,source_marker FROM public.f05_10_notification_attempts_ci WHERE consultation_id=$1',[id]))[0];
 assert.equal(attempt.decision,'SKIPPED_DND');assert.equal(attempt.source_marker,'CI_PDM23_NO_EXTERNAL_SEND');
 await q('UPDATE public.f05_10_notification_quiet_ci SET dnd_enabled=false WHERE customer_id=$1',[who]);
 assert.deepEqual((await q("SELECT co.first_response_deadline,m.original_deadline,m.first_response_at,m.customer_disabled_hold FROM public.consultations co JOIN public.f05_10_consultation_meta_ci m USING(consultation_id) WHERE co.consultation_id=$1",[id]))[0],before);
 // Only the isolated CI clock is moved here to inspect derived timeout; PDM23 writes must not change business clock.
 await q("UPDATE public.consultations SET first_response_deadline=clock_timestamp()-interval '1 second' WHERE consultation_id=$1",[id]);
 const overdue=(await q('SELECT status,close_reason,clock_timestamp()>first_response_deadline overdue FROM public.consultations WHERE consultation_id=$1',[id]))[0];
 assert.equal(overdue.overdue,true);assert.equal(overdue.close_reason,null);assert.ok(['pending','processing'].includes(overdue.status));
 console.log('F05_10_R03_DND_PDM23_REAL_CI_ROW_NO_SLA_PAUSE',{consultationId:id,source:'CI_SYNTHETIC_PDM23',notification:attempt.decision,overdue:overdue.overdue});
});

test('10-R03 residual two physical PG backends Customer disable COMMIT vs withdraw and repeated Hold governance',async()=>{
 const co=(await q("SELECT co.consultation_id,co.customer_id FROM public.consultations co JOIN public.customers cu ON cu.customer_id=co.customer_id WHERE co.status IN('pending','processing') AND cu.account_status='active' AND co.assignee_employee_id=1 ORDER BY co.consultation_id DESC LIMIT 1"))[0];
 assert.ok(co);const id=Number(co.consultation_id),who=Number(co.customer_id);
 const writer=await connect();let pending;
 try{
  const aPid=Number((await q('SELECT pg_backend_pid() pid'))[0].pid),bPid=Number((await writer.query('SELECT pg_backend_pid() pid')).rows[0].pid);
  assert.notEqual(aPid,bPid);
  await writer.query('BEGIN');
  await writer.query("UPDATE public.customers SET account_status='disabled' WHERE customer_id=$1",[who]);
  let finished=false;
  pending=withdrawConsultationCI(c,{consultationId:id,customerId:who,eventKey:k('disabled-withdraw-physical-race'),syntheticPhoneConsent:proof});
  pending.then(()=>{finished=true},()=>{finished=true});
  await new Promise(done=>setTimeout(done,100));
  assert.equal(finished,false,'Withdraw waits until writer commits disabled Customer source');
  await writer.query('COMMIT');
  assert.equal((await pending).allowed,false,'Disabled Customer cannot withdraw even if request began before COMMIT');
  const held=(await q('SELECT customer_disabled_hold,remaining_ms FROM public.f05_10_consultation_meta_ci WHERE consultation_id=$1',[id]))[0];
  assert.equal(held.customer_disabled_hold,true);assert.ok(Number(held.remaining_ms)>=0);
  const events=(await q("SELECT count(*)::int n FROM public.f05_10_consultation_events_ci WHERE consultation_id=$1 AND event_kind='hold'",[id]))[0].n;
  await q('UPDATE public.customers SET account_status=$2 WHERE customer_id=$1',[who,'active']);
  await q('UPDATE public.customers SET account_status=$2 WHERE customer_id=$1',[who,'disabled']);
  assert.equal((await q("SELECT count(*)::int n FROM public.f05_10_consultation_events_ci WHERE consultation_id=$1 AND event_kind='hold'",[id]))[0].n,events,'No second Hold event without new hold transition');
  const governed=await act(id,'close_normal');assert.equal(governed.allowed,true,JSON.stringify(governed));
  assert.equal((await q('SELECT close_reason FROM public.consultations WHERE consultation_id=$1',[id]))[0].close_reason,'NORMAL_CLOSED');
  await q('UPDATE public.customers SET account_status=$2 WHERE customer_id=$1',[who,'active']);
  console.log('F05_10_R03_TRUE_TWO_BACKEND_WITHDRAW_HOLD_GOVERNANCE',{aPid,bPid,consultationId:id,holdEvents:events,remainingMs:Number(held.remaining_ms)});
 }finally{await writer.query('ROLLBACK').catch(()=>{});await writer.end();if(pending)await pending.catch(()=>{})}
});


test('10-R04 residual signed Priority from genuine matching excludes other Customer, release restores create',async()=>{
 const rec=(await q("SELECT rv.result_id,rv.demand_id,rv.vehicle_id,rv.listing_cycle_id,rv.source_signature,d.customer_id rival,d.responsible_employee_id FROM public.f05_7_result_versions_ci rv JOIN public.demands d ON d.demand_id=rv.demand_id JOIN public.vehicles v ON v.vehicle_id=rv.vehicle_id JOIN public.vehicle_listing_cycles lc ON lc.listing_cycle_id=rv.listing_cycle_id AND lc.vehicle_id=rv.vehicle_id WHERE rv.status='current' AND rv.tier IN('high','acceptable') AND v.platform_visibility='visible' AND v.archived_at IS NULL AND ((v.source_type='wholesale' AND v.source_sale_status='active') OR (v.source_type IN('mingbang','four_s') AND v.source_sale_status='available')) AND lc.ended_at IS NULL AND NOT EXISTS(SELECT 1 FROM public.f05_8_priority_ci p WHERE p.vehicle_id=rv.vehicle_id AND p.listing_cycle_id=rv.listing_cycle_id AND p.status='active') ORDER BY rv.result_id LIMIT 1"))[0];
 assert.ok(rec,'Genuine current v23 matching source and unoccupied saleable Vehicle required');
 const free=(await q("SELECT c.customer_id FROM public.customers c WHERE c.account_status='active' AND c.owner_assignment_state='assigned' AND c.current_owner_employee_id=1 AND c.customer_id<>$1 AND NOT EXISTS(SELECT 1 FROM public.consultations co WHERE co.customer_id=c.customer_id AND co.vehicle_id=$2 AND co.listing_cycle_id=$3 AND co.status IN('pending','processing')) ORDER BY c.customer_id LIMIT 1",[rec.rival,rec.vehicle_id,rec.listing_cycle_id]))[0];
 assert.ok(free,'Different active eligible Customer required for Priority isolation');
 const subject=Number(free.customer_id);
 const opening=()=>createConsultationCI(c,{customerId:subject,vehicleId:Number(rec.vehicle_id),listingCycleId:Number(rec.listing_cycle_id),intent:'consult',eventKey:k('r04-priority-current-'+Math.random()),syntheticPhoneConsent:proof,directSource:'search'});
 const baseline=(await q('SELECT count(*)::int n FROM public.consultations WHERE customer_id=$1 AND vehicle_id=$2 AND listing_cycle_id=$3',[subject,rec.vehicle_id,rec.listing_cycle_id]))[0].n;
 const pri=(await q("INSERT INTO public.f05_8_priority_ci(customer_id,vehicle_id,listing_cycle_id,trigger_demand_id,responsible_employee_id,origin_team_id,origin_store_id,source_match_result_id,source_signature,expires_at,creation_key) VALUES($1,$2,$3,$4,$5,901,1,$6,$7,clock_timestamp()+interval '10 minutes',$8) RETURNING priority_id",[rec.rival,rec.vehicle_id,rec.listing_cycle_id,rec.demand_id,rec.responsible_employee_id,rec.result_id,rec.source_signature,k('r04-real-priority-lease')]))[0];
 const denied=await opening();assert.equal(denied.allowed,false,JSON.stringify(denied));
 assert.equal(denied.code,'F05_10_OTHER_CUSTOMER_PRIORITY_DENIED');
 assert.equal((await q('SELECT count(*)::int n FROM public.consultations WHERE customer_id=$1 AND vehicle_id=$2 AND listing_cycle_id=$3',[subject,rec.vehicle_id,rec.listing_cycle_id]))[0].n,baseline);
 await q("UPDATE public.f05_8_priority_ci SET status='ended',ended_at=clock_timestamp(),ended_reason='employee_released' WHERE priority_id=$1",[pri.priority_id]);
 const after=await opening();assert.equal(after.allowed,true,JSON.stringify(after));assert.equal(after.created,true);
 const frozen=(await q('SELECT status,assignee_employee_id FROM public.consultations WHERE consultation_id=$1',[after.consultationId]))[0];
 assert.equal(frozen.status,'pending');assert.ok(Number(frozen.assignee_employee_id)>0);
 console.log('F05_10_R04_SIGNED_V23_V24_CURRENT_RIVAL_PRIORITY_RELEASE',{priorityId:pri.priority_id,matchingId:rec.result_id,rival:rec.rival,subject,blocked:denied.code,releasedConsultationId:after.consultationId});
});

test('10-R04 residual entire create-touch-followup-handover-close-invalid lifecycle does not rewrite signed independent domains',async()=>{
 const target=(await q("SELECT c.customer_id,v.vehicle_id,lc.listing_cycle_id FROM public.customers c CROSS JOIN public.vehicles v JOIN public.vehicle_listing_cycles lc ON lc.vehicle_id=v.vehicle_id AND lc.ended_at IS NULL WHERE c.account_status='active' AND c.owner_assignment_state='assigned' AND c.current_owner_employee_id=1 AND v.platform_visibility='visible' AND v.archived_at IS NULL AND ((v.source_type='wholesale' AND v.source_sale_status='active') OR (v.source_type IN('mingbang','four_s') AND v.source_sale_status='available')) AND NOT EXISTS(SELECT 1 FROM public.f05_8_priority_ci p WHERE p.vehicle_id=v.vehicle_id AND p.listing_cycle_id=lc.listing_cycle_id AND p.status='active') AND NOT EXISTS(SELECT 1 FROM public.consultations co WHERE co.customer_id=c.customer_id AND co.vehicle_id=v.vehicle_id AND co.listing_cycle_id=lc.listing_cycle_id AND co.status IN('pending','processing')) ORDER BY c.customer_id,v.vehicle_id LIMIT 1"))[0];
 assert.ok(target,'Genuine free Customer/Vehicle/ListingCycle required');
 const {customer_id:who,vehicle_id:car,listing_cycle_id:cycle}=target;
 const tables=['recommendations','f05_9_recommendation_facts_ci','vehicle_visibility_grants','f05_9_price_right_ci','f05_8_priority_ci','locks','transactions','demands','customers'];
 const snap=async()=>{
  const out={};
  for(const t of tables){
   out[t]=(await q("SELECT count(*)::int n,md5(COALESCE(string_agg(to_jsonb(x)::text,'' ORDER BY to_jsonb(x)::text),'')) hash FROM public."+t+" x"))[0];
  }
  return out;
 };
 // The test intentionally uses an existing disposable signed employee account, never production credentials.
 await q("UPDATE public.pc_login_accounts SET credential_state='enabled',force_password_change=false WHERE account_id=5");
 const fourth=await auth.login({login:'disabled_test',password:'SyntheticDisabled_123',source:'f05-10-r04-signed-target'});
 assert.equal(fourth.code,'AUTH_OK','Actual F03 signed employee4 session required');
 const input=source=>({customerId:Number(who),vehicleId:Number(car),listingCycleId:Number(cycle),intent:'consult',directSource:source,syntheticPhoneConsent:proof,eventKey:k('r04-lifecycle-'+Math.random())});
 const before=await snap();
 const opened=await createConsultationCI(c,input('search'));assert.equal(opened.allowed,true,JSON.stringify(opened));assert.equal(opened.created,true);
 assert.equal(Number(opened.assignee),1);
 assert.deepEqual(await snap(),before,'Create never creates or mutates any independent Recommendation/Priority/Lock/Transaction/Owner fact');
 const existing=await createConsultationCI(c,input('favorite'));assert.equal(existing.allowed,true);assert.equal(existing.created,false);
 assert.equal(existing.consultationId,opened.consultationId);assert.deepEqual(await snap(),before,'Touch cannot propagate rights');
 const note=await act(opened.consultationId,'followup',{evidenceKind:'crm_note',evidenceRef:'CI-INDEPENDENT-DOMAIN-NOTE-004'});
 assert.equal(note.allowed,true,JSON.stringify(note));assert.deepEqual(await snap(),before,'Followup must never change other domains');
 const moved=await act(opened.consultationId,'handover',{targetEmployeeId:4,reason:'Real same Team second signed recipient'});
 assert.equal(moved.allowed,true,JSON.stringify(moved));assert.deepEqual(await snap(),before,'Formal Consultation-only handover never mutates Customer Owner');
 const closed=await employeeConsultationActionCI(auth,fourth.token,{consultationId:opened.consultationId,eventKey:k('r04-target-close'),action:'close_normal'});
 assert.equal(closed.allowed,true,JSON.stringify(closed));assert.deepEqual(await snap(),before,'New responsible employee closes Consultation without independent business writes');
 const reopened=await createConsultationCI(c,input('other'));assert.equal(reopened.allowed,true);assert.equal(reopened.created,true);
 assert.deepEqual(await snap(),before,'New cycle of Consultation independently creates no other objects');
 const invalid=await act(reopened.consultationId,'invalid');assert.equal(invalid.allowed,true,JSON.stringify(invalid));
 assert.deepEqual(await snap(),before,'Invalid Consultation is not a transaction, priority or owner action');
 const history=(await q('SELECT count(*)::int n FROM public.f05_10_consultation_handover_ci WHERE consultation_id=$1',[opened.consultationId]))[0];
 assert.equal(history.n,1);
 assert.equal((await q('SELECT source_kind FROM public.f05_10_consultation_meta_ci WHERE consultation_id=$1',[opened.consultationId]))[0].source_kind,'search');
 await q("UPDATE public.pc_login_accounts SET credential_state='disabled',force_password_change=true WHERE account_id=5");
 console.log('F05_10_R04_FULL_LIFECYCLE_CROSS_DOMAIN_COUNT_AND_HASH',{vehicleId:Number(car),customerId:Number(who),originalId:opened.consultationId,invalidId:reopened.consultationId,tables:Object.keys(before),signedHandoverReceipts:history.n});
});
