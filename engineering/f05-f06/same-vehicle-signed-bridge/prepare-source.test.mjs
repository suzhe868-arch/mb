import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash,randomBytes} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import pg from 'pg';
import {IsolatedAuth} from '../../src/f03-auth-service.mjs';
import {getPublicStructure} from '../../f02-1/schema-integrity.mjs';
import {connect as draftConnect,verify as verifyDraft} from '../../f05/manual-vehicle-draft-publish/migration.mjs';
import {createManualVehicleDraftService} from '../../f05/manual-vehicle-draft-publish/service.mjs';
import {startHarness,login,BASE} from '../../f05/manual-vehicle-draft-publish/tests/https-harness.mjs';
import {verify as verifyEdit} from '../../f05/published-manual-vehicle-edit/migration.mjs';

const DSN='postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test';
const REF='refs/heads/feat/f05-f06-same-vehicle-signed-bridge-pg16-01';
const sha=value=>createHash('sha256').update(value).digest('hex');
const digestObject=value=>sha(JSON.stringify(value));
let db,auth,app,secret,staff,other,draft,published,payload;
const count=async(sql,args=[])=>Number((await db.query(sql,args)).rows[0].n);
test.before(async()=>{
 assert.equal(process.env.GITHUB_REPOSITORY,'suzhe868-arch/mb');
 assert.equal(process.env.GITHUB_EVENT_NAME,'push');
 assert.equal(process.env.GITHUB_REF,REF,'must use the authentic current GitHub branch');
 assert.equal(process.env.GITHUB_REF_NAME,REF.slice('refs/heads/'.length));
 assert.equal(process.env.GITHUB_SHA,(await import('node:child_process')).execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim());
 assert.equal(process.env.F05_MANUAL_VEHICLE_DRAFT_PUBLISH_CONSENT,'I_AUTHORIZE_F05_MANUAL_VEHICLE_DRAFT_PUBLISH_PG16_ONLY');
 db=await draftConnect();
 const draftSeal=await verifyDraft(db),editSeal=await verifyEdit(db);
 assert.equal(draftSeal.verified,true);assert.equal(editSeal.verified,true);
 const identity=(await db.query("SELECT current_database() db,current_user usr,current_setting('server_version_num')::int version,(SELECT count(*)::int FROM public.f03_schema_migrations) migrations,(SELECT oid::text FROM pg_database WHERE datname=current_database()) oid")).rows[0];
 assert.equal(identity.db,'f03_auth_test');assert.equal(identity.usr,'f03_ci');
 assert.ok(identity.version>=160000&&identity.version<170000);assert.equal(identity.migrations,14);
 secret=randomBytes(32);
 auth=new IsolatedAuth({connectionString:DSN,secret,origin:'https://127.0.0.1:48984'});
 staff=await login(auth,'employee_test','SyntheticF04_3_CurrentProof_2026','f05-f06-bridge-native-publish');
 other=await login(auth,'limit_test','SyntheticLimit_1234567','f05-f06-bridge-non-owner');
 app=await startHarness(createManualVehicleDraftService({auth}));
 const runId=String(process.env.GITHUB_RUN_ID);
 payload={
  sourceType:'mingbang',brandId:98001,seriesId:98002,modelId:98003,
  modelYear:2026,mileageKm:18200,city:'Suzhou',
  vin:'MBF06BRIDGE'+runId.slice(-8),
  retailPriceCents:8300000,wholesalePriceCents:6300000,
  description:'Synthetic same-vehicle F05 to F06 immutable-snapshot baseline '+runId,
  conditionTags:['bridge-baseline','non-production','snapshot-original']
 };
});
test.after(async()=>{
 if(app)await app.close();
 if(auth)await auth.close();
 if(db)await db.end();
 if(secret)secret.fill(0);
});
test('F05原生HTTPS正式发布：负向门禁、真实车辆事实和脱敏来源清单',async t=>{
 const beforeDrafts=await count('SELECT count(*)::int n FROM f05_manual_vehicle_test.drafts');
 await t.test('01 未登录读取草稿被拒绝且无数据库副作用',async()=>{
  const out=await app.request(BASE,{method:'GET'});
  assert.equal(out.status,401);
  assert.equal(await count('SELECT count(*)::int n FROM f05_manual_vehicle_test.drafts'),beforeDrafts);
 });
 await t.test('02 路径穿越请求被原生HTTPS处理器拒绝',async()=>{
  const out=await app.request(BASE+'/%2e%2e',{method:'GET',token:staff});
  assert.ok(out.status>=400&&out.status<500);
  assert.equal(await count('SELECT count(*)::int n FROM f05_manual_vehicle_test.drafts'),beforeDrafts);
 });
 await t.test('03 伪造actorId字段被拒绝',async()=>{
  const out=await app.request(BASE+'/auto-save',{method:'POST',token:staff,body:{payload:{...payload,actorId:1}}});
  assert.equal(out.status,400);assert.equal(out.body.code,'UNSUPPORTED_PAYLOAD_FIELD');
  assert.equal(await count('SELECT count(*)::int n FROM f05_manual_vehicle_test.drafts'),beforeDrafts);
 });
 await t.test('04 无效modelId被拒绝且不创建草稿',async()=>{
  const out=await app.request(BASE+'/auto-save',{method:'POST',token:staff,body:{payload:{...payload,modelId:0}}});
  assert.ok(out.status>=400&&out.status<500);
  assert.equal(await count('SELECT count(*)::int n FROM f05_manual_vehicle_test.drafts'),beforeDrafts);
 });
 const saved=await app.request(BASE+'/auto-save',{method:'POST',token:staff,body:{payload}});
 assert.equal(saved.status,201,JSON.stringify(saved.body));
 assert.equal(saved.body.code,'DRAFT_SAVED');
 draft=saved.body;
 await t.test('05 原生自动保存产生真实草稿且版本可追踪',async()=>{
  assert.ok(draft.draftId);assert.equal(Number(draft.version),1);
  const row=(await db.query('SELECT draft_source_type,status,version,draft_payload FROM f05_manual_vehicle_test.drafts WHERE draft_id=$1::bigint',[draft.draftId])).rows[0];
  assert.equal(row.draft_source_type,'mingbang');assert.equal(row.status,'draft');assert.equal(Number(row.version),1);
  assert.equal(Number(row.draft_payload.retailPriceCents),payload.retailPriceCents);
 });
 await t.test('06 非发布人不能发布他人的草稿',async()=>{
  const out=await app.request(BASE+'/'+draft.draftId+'/publish',{method:'POST',token:other,body:{expectedVersion:1}});
  assert.ok([403,404].includes(out.status));assert.equal((await db.query('SELECT status FROM f05_manual_vehicle_test.drafts WHERE draft_id=$1::bigint',[draft.draftId])).rows[0].status,'draft');
 });
 await t.test('07 过期版本号不能发布且不预留车辆身份',async()=>{
  const beforeVehicles=await count('SELECT count(*)::int n FROM public.vehicles');
  const out=await app.request(BASE+'/'+draft.draftId+'/publish',{method:'POST',token:staff,body:{expectedVersion:999}});
  assert.equal(out.status,409);
  const row=(await db.query('SELECT status,reserved_vehicle_id,published_vehicle_id FROM f05_manual_vehicle_test.drafts WHERE draft_id=$1::bigint',[draft.draftId])).rows[0];
  assert.equal(row.status,'draft');assert.equal(row.reserved_vehicle_id,null);assert.equal(row.published_vehicle_id,null);
  assert.equal(await count('SELECT count(*)::int n FROM public.vehicles'),beforeVehicles);
 });
 const out=await app.request(BASE+'/'+draft.draftId+'/publish',{method:'POST',token:staff,body:{expectedVersion:1}});
 assert.equal(out.status,200,JSON.stringify(out.body));assert.equal(out.body.code,'VEHICLE_PUBLISHED');
 published=out.body;
 await t.test('08 F05原生发布产生正式Vehicle和ListingCycle及同事务责任链',async()=>{
  assert.equal(published.sourceType,'mingbang');
  const v=(await db.query('SELECT vehicle_id::text,source_type,model_id::text,vin,source_sale_status,platform_visibility,formally_published_at,archived_at FROM public.vehicles WHERE vehicle_id=$1::bigint',[published.vehicleId])).rows[0];
  assert.ok(v);assert.equal(v.source_type,'mingbang');assert.equal(v.source_sale_status,'available');assert.equal(v.platform_visibility,'visible');
  assert.ok(v.formally_published_at);assert.equal(v.archived_at,null);
  const c=(await db.query('SELECT listing_cycle_id::text,vehicle_id::text,ended_at FROM public.vehicle_listing_cycles WHERE listing_cycle_id=$1::bigint AND vehicle_id=$2::bigint',[published.listingCycleId,published.vehicleId])).rows[0];
  assert.ok(c);assert.equal(c.ended_at,null);
  const r=(await db.query("SELECT responsibility_id::text,responsible_employee_id::text,team_id::text,source_snapshot,provenance_kind,revoked_at FROM public.vehicle_current_responsibilities WHERE vehicle_id=$1::bigint AND listing_cycle_id=$2::bigint AND revoked_at IS NULL",[published.vehicleId,published.listingCycleId])).rows;
  assert.equal(r.length,1);assert.equal(r[0].source_snapshot,'mingbang');assert.equal(r[0].provenance_kind,'AUTHORIZED_MANUAL_PUBLICATION');
 });
 const d=(await db.query('SELECT d.draft_id::text,d.created_by_employee_id::text,d.source_team_id::text,d.draft_source_type,d.draft_payload,d.version::text,d.published_at,f.brand_id::text,f.series_id::text,f.model_id::text,f.model_year,f.mileage_km,f.city,f.payload_snapshot FROM f05_manual_vehicle_test.drafts d JOIN f05_manual_vehicle_test.published_vehicle_facts f ON f.vehicle_id=d.published_vehicle_id AND f.listing_cycle_id=d.published_listing_cycle_id WHERE d.draft_id=$1::bigint AND d.published_vehicle_id=$2::bigint AND d.published_listing_cycle_id=$3::bigint',[published.draftId,published.vehicleId,published.listingCycleId])).rows[0];
 assert.ok(d);
 const event=(await db.query("SELECT event_id::text,event_kind,payload_sha256,event_metadata,occurred_at FROM f05_manual_vehicle_test.draft_events WHERE draft_id=$1::bigint AND event_kind='PUBLISHED' ORDER BY event_id DESC LIMIT 1",[published.draftId])).rows[0];
 assert.ok(event);assert.match(event.payload_sha256,/^[0-9a-f]{64}$/);
 const vehicle=(await db.query('SELECT vehicle_id::text,model_id::text,vin,source_type FROM public.vehicles WHERE vehicle_id=$1::bigint',[published.vehicleId])).rows[0];
 const responsibility=(await db.query('SELECT responsibility_id::text,responsible_employee_id::text,team_id::text,source_snapshot,provenance_kind,trusted_event_key FROM public.vehicle_current_responsibilities WHERE vehicle_id=$1::bigint AND listing_cycle_id=$2::bigint AND revoked_at IS NULL ORDER BY responsibility_id DESC LIMIT 1',[published.vehicleId,published.listingCycleId])).rows[0];
 const ledger=(await db.query('SELECT migration_id,checksum,structure_sha256 FROM public.f03_schema_migrations ORDER BY migration_id')).rows;
 const structure=await getPublicStructure(db);
 const dbInfo=(await db.query("SELECT current_database() name,(SELECT oid::text FROM pg_database WHERE datname=current_database()) oid,current_user role,current_setting('server_version_num')::int server_version")).rows[0];
 const privateState=(await db.query('SELECT run_id,ddl_sha256 FROM f05_manual_vehicle_test.schema_state')).rows[0];
 const manifest={
  schemaVersion:1,
  github:{repository:process.env.GITHUB_REPOSITORY,ref:process.env.GITHUB_REF,sha:process.env.GITHUB_SHA,runId:String(process.env.GITHUB_RUN_ID)},
  database:{name:dbInfo.name,oid:dbInfo.oid,role:dbInfo.role,serverVersion:dbInfo.server_version,publicMigrationCount:ledger.length,publicLedgerSha256:digestObject(ledger),publicCatalogSha256:structure.sha256},
  privateDraftSchema:{runId:privateState.run_id,ddlSha256:privateState.ddl_sha256,draftEventCount:await count('SELECT count(*)::int n FROM f05_manual_vehicle_test.draft_events'),publishedFactCount:await count('SELECT count(*)::int n FROM f05_manual_vehicle_test.published_vehicle_facts')},
  vehicle:{
   vehicleId:String(published.vehicleId),listingCycleId:String(published.listingCycleId),draftId:String(published.draftId),
   sourceType:d.draft_source_type,publisherEmployeeId:d.created_by_employee_id,sourceTeamId:d.source_team_id,
   brandId:Number(d.brand_id),seriesId:Number(d.series_id),modelId:Number(d.model_id),modelYear:Number(d.model_year),
   mileageKm:Number(d.mileage_km),city:d.city,retailPriceCents:Number(d.draft_payload.retailPriceCents),
   wholesalePriceCents:Number(d.draft_payload.wholesalePriceCents),
   vinSha256:sha(vehicle.vin||''),descriptionSha256:sha(d.draft_payload.description||''),
   conditionTagsSha256:digestObject(d.draft_payload.conditionTags||[]),payloadSha256:digestObject(d.draft_payload),
   payloadSnapshotSha256:digestObject(d.payload_snapshot),publishedEventId:event.event_id,
   publishedEventSha256:event.payload_sha256,publishedEventMetadataSha256:digestObject(event.event_metadata),
   publishedAt:new Date(d.published_at).toISOString(),
   responsibilityId:responsibility.responsibility_id,responsibleEmployeeId:responsibility.responsible_employee_id,
   responsibilityTeamId:responsibility.team_id,responsibilitySource:responsibility.source_snapshot,
   responsibilityProvenance:responsibility.provenance_kind,trustedEventKeySha256:sha(responsibility.trusted_event_key||'')
  }
 };
 manifest.manifestSHA256=digestObject(manifest);
 const dir=new URL('./artifacts/',import.meta.url);
 await mkdir(dir,{recursive:true});
 await writeFile(new URL('./artifacts/source-manifest.json',import.meta.url),JSON.stringify(manifest,null,2)+'\n',{mode:0o600});
 await t.test('09 脱敏来源清单绑定当前SHA、14条迁移、源库OID和不可变发布事件',async()=>{
  assert.equal(manifest.github.sha,process.env.GITHUB_SHA);assert.equal(manifest.database.publicMigrationCount,14);
  assert.equal(manifest.privateDraftSchema.runId,String(process.env.GITHUB_RUN_ID));
  assert.notEqual(manifest.vehicle.vehicleId,'');assert.match(manifest.manifestSHA256,/^[0-9a-f]{64}$/);
  const raw=JSON.stringify(manifest);assert.equal(raw.includes(payload.vin),false);assert.equal(raw.includes(payload.description),false);
 });
 console.log('F05_F06_BRIDGE_SOURCE_PUBLISHED',JSON.stringify({vehicleId:manifest.vehicle.vehicleId,listingCycleId:manifest.vehicle.listingCycleId,sourceDbOid:manifest.database.oid,retailPriceCents:manifest.vehicle.retailPriceCents,manifestSHA256:manifest.manifestSHA256}));
});
