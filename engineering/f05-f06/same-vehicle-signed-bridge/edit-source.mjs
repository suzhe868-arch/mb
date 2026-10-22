import assert from 'node:assert/strict';
import {createHash,randomBytes} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {IsolatedAuth} from '../../src/f03-auth-service.mjs';
import {verify as verifyDraft} from '../../f05/manual-vehicle-draft-publish/migration.mjs';
import {verify as verifyEdit,connect as editConnect} from '../../f05/published-manual-vehicle-edit/migration.mjs';
import {createPublishedEditService} from '../../f05/published-manual-vehicle-edit/service.mjs';
import {start,login,BASE} from '../../f05/published-manual-vehicle-edit/tests/harness.mjs';

const DSN='postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test';
const REF='refs/heads/feat/f05-f06-same-vehicle-signed-bridge-pg16-01';
const sha=value=>createHash('sha256').update(value).digest('hex');
const digestObject=value=>sha(JSON.stringify(value));
let db,auth,app,secret;
const count=async(sql,args=[])=>Number((await db.query(sql,args)).rows[0].n);
try{
 assert.equal(process.env.GITHUB_REF,REF,'F05 edit must run on authentic current branch');
 assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),process.env.GITHUB_SHA);
 const sourceManifest=JSON.parse(await readFile(new URL('./artifacts/source-manifest.json',import.meta.url),'utf8'));
 const sourceCopy={...sourceManifest};delete sourceCopy.manifestSHA256;
 assert.equal(sourceManifest.manifestSHA256,digestObject(sourceCopy));
 db=await editConnect();
 assert.equal((await verifyDraft(db)).verified,true);
 assert.equal((await verifyEdit(db)).verified,true);
 const identity=(await db.query("SELECT current_database() name,current_user role,current_setting('server_version_num')::int serverVersion,(SELECT oid::text FROM pg_database WHERE datname=current_database()) oid,(SELECT count(*)::int FROM public.f03_schema_migrations) migrationCount")).rows[0];
 assert.equal(identity.name,'f03_auth_test');assert.equal(identity.role,'f03_ci');assert.equal(identity.migrationCount,14);
 assert.equal(identity.oid,sourceManifest.database.oid);
 secret=randomBytes(32);
 auth=new IsolatedAuth({connectionString:DSN,secret,origin:'https://127.0.0.1:48986'});
 const staff=await login(auth,'employee_test','SyntheticF04_3_CurrentProof_2026');
 const outsider=await login(auth,'limit_test','SyntheticLimit_1234567');
 app=await start(createPublishedEditService({auth}));
 const vehicleId=sourceManifest.vehicle.vehicleId;
 const original=(await app.request(BASE+'/'+vehicleId,{token:staff})).body;
 assert.equal(original.code,'EDIT_DETAIL');
 assert.equal(Number(original.currentVersion),1);
 assert.equal(Number(original.effective.customerListPriceCents),sourceManifest.vehicle.retailPriceCents);
 assert.equal(Number(original.effective.mileageKm),sourceManifest.vehicle.mileageKm);
 const auditBefore=await count('SELECT count(*)::int n FROM f05_published_edit_test.edit_audit WHERE vehicle_id=$1::bigint',[vehicleId]);
 const noAuth=await app.request(BASE+'/'+vehicleId);
 assert.equal(noAuth.status,401);
 const denied=await app.request(BASE+'/'+vehicleId,{token:outsider});
 assert.equal(denied.status,403);
 const forwarded=await app.request(BASE+'/'+vehicleId,{token:staff,headers:{'x-forwarded-for':'127.0.0.1'}});
 assert.equal(forwarded.status,403);
 const badField=await app.request(BASE+'/'+vehicleId+'/stage',{method:'PUT',token:staff,body:{expectedCurrentVersion:1,patch:{sourceType:'four_s'}}});
 assert.equal(badField.status,400);assert.equal(badField.body.code,'EDIT_FIELD_FORBIDDEN');
 const badMileage=await app.request(BASE+'/'+vehicleId+'/stage',{method:'PUT',token:staff,body:{expectedCurrentVersion:1,patch:{mileageKm:-1}}});
 assert.equal(badMileage.status,422);assert.equal(badMileage.body.code,'EDIT_FIELD_INVALID');
 assert.equal(await count('SELECT count(*)::int n FROM f05_published_edit_test.edit_audit WHERE vehicle_id=$1::bigint',[vehicleId]),auditBefore);
 const patch={
  customerListPriceCents:8900000,
  mileageKm:19100,
  conditionTags:['bridge-edited-condition-a','bridge-edited-condition-b'],
  description:'Synthetic F05 post-transaction edit; source-only effective fields'
 };
 const staged=await app.request(BASE+'/'+vehicleId+'/stage',{method:'PUT',token:staff,body:{expectedCurrentVersion:1,patch:patch}});
 assert.equal(staged.status,200,JSON.stringify(staged.body));assert.equal(staged.body.code,'EDIT_STAGED');assert.equal(Number(staged.body.stageVersion),1);
 const stale=await app.request(BASE+'/'+vehicleId+'/commit',{method:'POST',token:staff,body:{expectedCurrentVersion:1,expectedStageVersion:99,requestKey:'bridge_edit_stale_commit_'+process.env.GITHUB_RUN_ID}});
 assert.equal(stale.status,409);
 assert.equal((await db.query('SELECT version::text FROM f05_published_edit_test.staged_changes WHERE vehicle_id=$1::bigint',[vehicleId])).rows[0].version,'1');
 const requestKey='bridge_edit_commit_'+process.env.GITHUB_RUN_ID;
 const committed=await app.request(BASE+'/'+vehicleId+'/commit',{method:'POST',token:staff,body:{expectedCurrentVersion:1,expectedStageVersion:1,requestKey:requestKey}});
 assert.equal(committed.status,200,JSON.stringify(committed.body));assert.equal(committed.body.code,'EDIT_APPLIED');assert.equal(Number(committed.body.currentVersion),2);
 const current=(await app.request(BASE+'/'+vehicleId,{token:staff})).body;
 assert.equal(current.code,'EDIT_DETAIL');assert.equal(Number(current.currentVersion),2);
 assert.equal(Number(current.effective.customerListPriceCents),patch.customerListPriceCents);
 assert.equal(Number(current.effective.mileageKm),patch.mileageKm);
 assert.deepEqual(current.effective.conditionTags,patch.conditionTags);
 assert.equal(current.effective.description,patch.description);
 const editState=(await db.query('SELECT version::text,effective_fields FROM f05_published_edit_test.vehicle_edit_state WHERE vehicle_id=$1::bigint',[vehicleId])).rows[0];
 assert.ok(editState);assert.equal(editState.version,'2');
 assert.equal(Number(editState.effective_fields.customerListPriceCents),patch.customerListPriceCents);
 const audit=(await db.query('SELECT audit_id::text,previous_version::text,next_version::text,before_fields,after_fields,occurred_at FROM f05_published_edit_test.edit_audit WHERE event_key=$1',[requestKey])).rows[0];
 assert.ok(audit);assert.equal(audit.previous_version,'1');assert.equal(audit.next_version,'2');
 const outbox=(await db.query('SELECT status,impacted_domains FROM f05_published_edit_test.impact_outbox WHERE audit_id=$1::bigint',[audit.audit_id])).rows[0];
 assert.ok(outbox);assert.equal(outbox.status,'NOT_CONNECTED_SOURCE_GAP');
 const draft=(await db.query('SELECT draft_payload,status,published_vehicle_id::text,published_listing_cycle_id::text FROM f05_manual_vehicle_test.drafts WHERE draft_id=$1::bigint',[sourceManifest.vehicle.draftId])).rows[0];
 assert.equal(draft.status,'published');assert.equal(draft.published_vehicle_id,vehicleId);assert.equal(draft.published_listing_cycle_id,sourceManifest.vehicle.listingCycleId);
 assert.equal(digestObject(draft.draft_payload),sourceManifest.vehicle.payloadSha256);
 const pubEvent=(await db.query("SELECT event_id::text,payload_sha256 FROM f05_manual_vehicle_test.draft_events WHERE draft_id=$1::bigint AND event_kind='PUBLISHED' ORDER BY event_id DESC LIMIT 1",[sourceManifest.vehicle.draftId])).rows[0];
 assert.equal(pubEvent.event_id,sourceManifest.vehicle.publishedEventId);assert.equal(pubEvent.payload_sha256,sourceManifest.vehicle.publishedEventSha256);
 const publicVehicle=(await db.query('SELECT model_id::text,vin FROM public.vehicles WHERE vehicle_id=$1::bigint',[vehicleId])).rows[0];
 assert.equal(publicVehicle.model_id,String(sourceManifest.vehicle.modelId));assert.equal(sha(publicVehicle.vin||''),sourceManifest.vehicle.vinSha256);
 const ledger=(await db.query('SELECT migration_id,checksum,structure_sha256 FROM public.f03_schema_migrations ORDER BY migration_id')).rows;
 const editStateSeal=(await db.query('SELECT run_id,ddl_sha256 FROM f05_published_edit_test.schema_state')).rows[0];
 const editManifest={
  schemaVersion:1,
  github:{repository:process.env.GITHUB_REPOSITORY,ref:process.env.GITHUB_REF,sha:process.env.GITHUB_SHA,runId:String(process.env.GITHUB_RUN_ID)},
  sourceManifestSHA256:sourceManifest.manifestSHA256,
  database:{name:identity.name,oid:identity.oid,role:identity.role,serverVersion:identity.serverVersion,publicMigrationCount:ledger.length,publicLedgerSha256:digestObject(ledger)},
  edit:{vehicleId:vehicleId,listingCycleId:sourceManifest.vehicle.listingCycleId,previousVersion:1,currentVersion:2,
   originalRetailPriceCents:sourceManifest.vehicle.retailPriceCents,effectiveRetailPriceCents:patch.customerListPriceCents,
   originalMileageKm:sourceManifest.vehicle.mileageKm,effectiveMileageKm:patch.mileageKm,
   conditionTagsSha256:digestObject(patch.conditionTags),descriptionSha256:sha(patch.description),
   auditId:audit.audit_id,beforeFieldsSha256:digestObject(audit.before_fields),afterFieldsSha256:digestObject(audit.after_fields),
   impactStatus:outbox.status,impactDomains:outbox.impacted_domains,
   immutablePublishedEventId:pubEvent.event_id,immutablePublishedEventSha256:pubEvent.payload_sha256},
  privateEditSchema:{runId:editStateSeal.run_id,ddlSha256:editStateSeal.ddl_sha256,auditCount:await count('SELECT count(*)::int n FROM f05_published_edit_test.edit_audit WHERE vehicle_id=$1::bigint',[vehicleId])}
 };
 editManifest.editManifestSHA256=digestObject(editManifest);
 await writeFile(new URL('./artifacts/edit-manifest.json',import.meta.url),JSON.stringify(editManifest,null,2)+'\n',{mode:0o600});
 console.log('F05_F06_BRIDGE_SOURCE_EDIT_PASS',JSON.stringify({vehicleId:vehicleId,oldPrice:sourceManifest.vehicle.retailPriceCents,newPrice:patch.customerListPriceCents,oldMileage:sourceManifest.vehicle.mileageKm,newMileage:patch.mileageKm,editManifestSHA256:editManifest.editManifestSHA256}));
}finally{
 if(app)await app.close().catch(()=>{});
 if(auth)await auth.close().catch(()=>{});
 if(db)await db.end().catch(()=>{});
 if(secret)secret.fill(0);
}
