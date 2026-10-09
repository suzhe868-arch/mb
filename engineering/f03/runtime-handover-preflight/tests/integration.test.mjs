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
 assert.equal(r.findings.find(x=>x.kind==='Customer'&&x.objectId==='301').reason,'PENDING');
 assert.equal(r.findings.find(x=>x.kind==='Demand'&&x.objectId==='401').reason,'PENDING');
 assert.equal(r.findings.find(x=>x.kind==='Demand'&&x.objectId==='402').reason,'REVALIDATE');
 assert.equal(r.findings.find(x=>x.kind==='Customer'&&x.objectId==='302').reason,'PENDING');
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
test('G05 concurrent customer owner change after first read forces revalidation without writing',async()=>{
 const before=await immutable();
 try{
  const r=await pref(manager,4,901,{testCheckpoint:async step=>{if(step==='after_first_read')await db.query('UPDATE public.customers SET current_owner_employee_id=4 WHERE customer_id=301')}});
  assert.equal(r.code,'G05_CONCURRENT_STATE_CHANGED_REVALIDATE');
 }finally{await db.query('UPDATE public.customers SET current_owner_employee_id=7 WHERE customer_id=301')}
 assert.deepEqual(await immutable(),before);
});
test('G05 concurrent team permission withdraw cannot reuse first-read authority',async()=>{
 const before=await immutable();
 try{
  const r=await pref(manager,4,901,{testCheckpoint:async step=>{if(step==='after_first_read')await db.query("UPDATE public.employee_permission_overrides SET decision='deny' WHERE employee_id=5 AND permission_id=13")}});
  assert.equal(r.code,'G05_CURRENT_MANAGER_OR_BATCH_CHANGED');
 }finally{await db.query("UPDATE public.employee_permission_overrides SET decision='allow' WHERE employee_id=5 AND permission_id=13")}
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
