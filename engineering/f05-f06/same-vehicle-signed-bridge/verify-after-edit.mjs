import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import pg from 'pg';
import {getPublicStructure} from '../../f02-1/schema-integrity.mjs';
import {verifyCompositeRuntimeDatabase} from '../../src/f06-nonprod-composite-runtime.mjs';
import {captureSnapshot,snapshotSha,sha256} from './snapshot.mjs';

const TARGET_DSN='postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test';
const SOURCE_DSN='postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f05_vehicle_source';
const REF='refs/heads/feat/f05-f06-same-vehicle-signed-bridge-pg16-01';
const digestObject=value=>sha256(JSON.stringify(value));
let target,source;
try{
 assert.equal(process.env.GITHUB_REF,REF);
 assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),process.env.GITHUB_SHA);
 const sourceManifest=JSON.parse(await readFile(new URL('./artifacts/source-manifest.json',import.meta.url),'utf8'));
 const before=JSON.parse(await readFile(new URL('./artifacts/f06-before-edit.json',import.meta.url),'utf8'));
 const editManifest=JSON.parse(await readFile(new URL('./artifacts/edit-manifest.json',import.meta.url),'utf8'));
 const sourceCopy={...sourceManifest};delete sourceCopy.manifestSHA256;
 const editCopy={...editManifest};delete editCopy.editManifestSHA256;
 assert.equal(sourceManifest.manifestSHA256,digestObject(sourceCopy));
 assert.equal(editManifest.editManifestSHA256,digestObject(editCopy));
 assert.equal(editManifest.sourceManifestSHA256,sourceManifest.manifestSHA256);
 assert.equal(before.sourceManifestSHA256,sourceManifest.manifestSHA256);
 target=new pg.Client({connectionString:TARGET_DSN});await target.connect();
 source=new pg.Client({connectionString:SOURCE_DSN});await source.connect();
 const sourceIdentity=(await source.query("SELECT current_database() name,current_user role,current_setting('server_version_num')::int serverVersion,(SELECT oid::text FROM pg_database WHERE datname=current_database()) oid,(SELECT count(*)::int FROM public.f03_schema_migrations) migrationCount")).rows[0];
 const targetIdentity=(await target.query("SELECT current_database() name,current_user role,current_setting('server_version_num')::int serverVersion,(SELECT oid::text FROM pg_database WHERE datname=current_database()) oid,(SELECT count(*)::int FROM public.f03_schema_migrations) migrationCount")).rows[0];
 assert.equal(sourceIdentity.name,'f05_vehicle_source');assert.equal(sourceIdentity.role,'f03_ci');assert.equal(sourceIdentity.migrationCount,14);
 assert.equal(sourceIdentity.oid,sourceManifest.database.oid);
 assert.equal(targetIdentity.name,'f03_auth_test');assert.equal(targetIdentity.role,'f03_ci');assert.equal(targetIdentity.migrationCount,24);
 assert.equal(targetIdentity.oid,before.database.oid);
 assert.notEqual(sourceIdentity.oid,targetIdentity.oid);
 assert.equal((await getPublicStructure(source)).sha256,sourceManifest.database.publicCatalogSha256);
 assert.equal((await verifyCompositeRuntimeDatabase(target,process.env)).verified,true);
 const editState=(await source.query('SELECT version::text,effective_fields FROM f05_published_edit_test.vehicle_edit_state WHERE vehicle_id=$1::bigint',[sourceManifest.vehicle.vehicleId])).rows[0];
 assert.ok(editState);assert.equal(editState.version,'2');
 assert.equal(Number(editState.effective_fields.customerListPriceCents),editManifest.edit.effectiveRetailPriceCents);
 assert.equal(Number(editState.effective_fields.mileageKm),editManifest.edit.effectiveMileageKm);
 assert.equal(digestObject(editState.effective_fields.conditionTags),editManifest.edit.conditionTagsSha256);
 const draft=(await source.query('SELECT draft_payload,status,published_vehicle_id::text,published_listing_cycle_id::text FROM f05_manual_vehicle_test.drafts WHERE draft_id=$1::bigint',[sourceManifest.vehicle.draftId])).rows[0];
 assert.ok(draft);assert.equal(draft.status,'published');
 assert.equal(draft.published_vehicle_id,sourceManifest.vehicle.vehicleId);
 assert.equal(draft.published_listing_cycle_id,sourceManifest.vehicle.listingCycleId);
 assert.equal(Number(draft.draft_payload.retailPriceCents),sourceManifest.vehicle.retailPriceCents);
 assert.equal(Number(draft.draft_payload.mileageKm),sourceManifest.vehicle.mileageKm);
 assert.equal(digestObject(draft.draft_payload),sourceManifest.vehicle.payloadSha256);
 const event=(await source.query("SELECT event_id::text,payload_sha256 FROM f05_manual_vehicle_test.draft_events WHERE draft_id=$1::bigint AND event_kind='PUBLISHED' ORDER BY event_id DESC LIMIT 1",[sourceManifest.vehicle.draftId])).rows[0];
 assert.equal(event.event_id,sourceManifest.vehicle.publishedEventId);assert.equal(event.payload_sha256,sourceManifest.vehicle.publishedEventSha256);
 const ids=before.ids;
 const afterSnapshot=await captureSnapshot(target,ids);
 const afterSha=snapshotSha(afterSnapshot);
 assert.equal(afterSha,before.snapshotSHA256,'F06 historical rows/snapshots/audit changed after F05 edit');
 assert.deepEqual(afterSnapshot,before.snapshot,'F06 historical JSON must remain byte-equivalent after source edit');
 assert.equal(Number(afterSnapshot.lockSnapshot.row.price_cents),sourceManifest.vehicle.retailPriceCents);
 assert.equal(Number(afterSnapshot.transactionOrigin.row.source_price_cents),sourceManifest.vehicle.retailPriceCents);
 assert.equal(afterSnapshot.bridgeAttestation.row.source_manifest_sha256,sourceManifest.manifestSHA256);
 const after={
  schemaVersion:1,
  github:{repository:process.env.GITHUB_REPOSITORY,ref:process.env.GITHUB_REF,sha:process.env.GITHUB_SHA,runId:String(process.env.GITHUB_RUN_ID)},
  sourceManifestSHA256:sourceManifest.manifestSHA256,
  editManifestSHA256:editManifest.editManifestSHA256,
  sourceDatabase:{name:sourceIdentity.name,oid:sourceIdentity.oid,migrationCount:sourceIdentity.migrationCount,publicCatalogSha256:(await getPublicStructure(source)).sha256},
  targetDatabase:{name:targetIdentity.name,oid:targetIdentity.oid,migrationCount:targetIdentity.migrationCount,publicCatalogSha256:(await getPublicStructure(target)).sha256},
  f05EffectiveFields:{version:Number(editState.version),retailPriceCents:Number(editState.effective_fields.customerListPriceCents),mileageKm:Number(editState.effective_fields.mileageKm),conditionTagsSha256:editManifest.edit.conditionTagsSha256},
  f06SnapshotBeforeSHA256:before.snapshotSHA256,f06SnapshotAfterSHA256:afterSha,
  snapshotUnchanged:true,vehicleId:ids.vehicleId,listingCycleId:ids.listingCycleId,
  lockId:ids.lockId,depositId:ids.depositId,transactionId:ids.transactionId
 };
 after.evidenceSHA256=digestObject(after);
 await mkdir(new URL('./artifacts/',import.meta.url),{recursive:true});
 await writeFile(new URL('./artifacts/f06-after-edit.json',import.meta.url),JSON.stringify(after,null,2)+'\n',{mode:0o600});
 console.log('F05_F06_HISTORICAL_SNAPSHOT_IMMUTABLE_PASS',JSON.stringify({sourceOid:sourceIdentity.oid,targetOid:targetIdentity.oid,beforeSHA256:before.snapshotSHA256,afterSHA256:afterSha,vehicleId:ids.vehicleId,lockId:ids.lockId,depositId:ids.depositId,transactionId:ids.transactionId}));
}finally{
 if(target)await target.end().catch(()=>{});
 if(source)await source.end().catch(()=>{});
}
