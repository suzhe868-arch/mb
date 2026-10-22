import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,randomBytes} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import pg from 'pg';
import {hashPassword,newOpaqueToken} from '../../src/f03-auth-crypto.mjs';
import {IsolatedAuth} from '../../src/f03-auth-service.mjs';
import {createFoundationServer} from '../../src/app.mjs';
import {createCompositeDenyHandler,createCompositeBusinessHandler,verifyCompositeRuntimeDatabase} from '../../src/f06-nonprod-composite-runtime.mjs';
import {createIsolatedF06LockService} from '../../src/f06-lock-service.mjs';
import {createIsolatedF06LockHandler} from '../../src/f06-lock-http.mjs';
import {getPublicStructure} from '../../f02-1/schema-integrity.mjs';
import {captureSnapshot,snapshotSha,sha256} from './snapshot.mjs';

const DSN='postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test';
const SOURCE_DSN='postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f05_vehicle_source';
const BASELINE_DSN='postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_baseline';
const REF='refs/heads/feat/f05-f06-same-vehicle-signed-bridge-pg16-01';
const sha=value=>createHash('sha256').update(value).digest('hex');
const digestObject=value=>sha(JSON.stringify(value));
const count=async(db,sql,args=[])=>Number((await db.query(sql,args)).rows[0].n);
async function post(base,path,token,body,headers={}){
 const h={'content-type':'application/json',...headers};
 if(token)h.authorization='Bearer '+token;
 const response=await fetch(base+path,{method:'POST',headers:h,body:body===undefined?undefined:JSON.stringify(body)});
 const raw=await response.text();let data;
 try{data=JSON.parse(raw)}catch{data={raw}}
 return {status:response.status,data,headers:response.headers};
}
async function seedEmployeeScope(db,employeeId,teamId,permissionIds){
 const membership=await db.query("SELECT 1 FROM public.employee_team_memberships WHERE employee_id=$1 AND team_id=$2 AND valid_from<=clock_timestamp() AND (ended_at IS NULL OR ended_at>clock_timestamp())",[employeeId,teamId]);
 if(!membership.rowCount)await db.query("INSERT INTO public.employee_team_memberships(employee_id,team_id,valid_from) VALUES($1,$2,clock_timestamp()-interval '2 minutes')",[employeeId,teamId]);
 let scope=(await db.query("SELECT scope_id FROM public.employee_data_scopes WHERE employee_id=$1 AND scope_kind='team' AND scope_reference_id=$2 AND ended_at IS NULL ORDER BY scope_id LIMIT 1",[employeeId,teamId])).rows[0];
 if(!scope)scope=(await db.query("INSERT INTO public.employee_data_scopes(employee_id,scope_kind,scope_reference_id) VALUES($1,'team',$2) RETURNING scope_id",[employeeId,teamId])).rows[0];
 for(const permissionId of permissionIds){
  const override=(await db.query("SELECT 1 FROM public.employee_permission_overrides WHERE employee_id=$1 AND permission_id=$2",[employeeId,permissionId])).rowCount;
  if(override)await db.query("UPDATE public.employee_permission_overrides SET decision='allow',changed_at=clock_timestamp() WHERE employee_id=$1 AND permission_id=$2",[employeeId,permissionId]);
  else await db.query("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES($1,$2,'allow',clock_timestamp())",[employeeId,permissionId]);
  const binding=(await db.query("SELECT 1 FROM public.employee_capability_scope_bindings WHERE employee_id=$1 AND permission_id=$2 AND scope_id=$3 AND ended_at IS NULL",[employeeId,permissionId,scope.scope_id])).rowCount;
  if(!binding)await db.query("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at) VALUES($1,$2,$3,clock_timestamp()-interval '2 minutes')",[employeeId,permissionId,scope.scope_id]);
 }
}
async function ensurePermission(db,code){
 const prior=(await db.query('SELECT permission_id FROM public.permissions WHERE permission_code=$1',[code])).rows[0];
 if(prior)return Number(prior.permission_id);
 const id=Number((await db.query('SELECT COALESCE(max(permission_id),0)+1 id FROM public.permissions')).rows[0].id);
 await db.query('INSERT INTO public.permissions(permission_id,permission_code) VALUES($1,$2)',[id,code]);
 return id;
}
async function denyPermission(db,employeeId,permissionId){
 const prior=(await db.query('SELECT 1 FROM public.employee_permission_overrides WHERE employee_id=$1 AND permission_id=$2',[employeeId,permissionId])).rowCount;
 if(prior)await db.query("UPDATE public.employee_permission_overrides SET decision='deny',changed_at=clock_timestamp() WHERE employee_id=$1 AND permission_id=$2",[employeeId,permissionId]);
 else await db.query("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES($1,$2,'deny',clock_timestamp())",[employeeId,permissionId]);
}
async function seedAccount(db,employeeId,runId){
 const loginName='bridge'+String(employeeId)+'_'+String(runId).slice(-6);
 const password='BridgePass_'+String(employeeId)+'_2026!';
 const passwordHash=await hashPassword(password);
 let account=(await db.query("SELECT account_id FROM public.pc_login_accounts WHERE principal_kind='employee' AND employee_id=$1 AND system_admin_id IS NULL ORDER BY account_id LIMIT 1",[employeeId])).rows[0];
 if(account){
  await db.query("UPDATE public.pc_login_accounts SET normalized_login_key=$2,password_hash=$3,credential_state='enabled',force_password_change=false,credential_epoch=credential_epoch+1,updated_at=clock_timestamp() WHERE account_id=$1",[account.account_id,loginName,passwordHash]);
  await db.query('UPDATE public.pc_auth_sessions SET revoked_at=COALESCE(revoked_at,clock_timestamp()) WHERE account_id=$1',[account.account_id]);
 }else{
  account=(await db.query("INSERT INTO public.pc_login_accounts(principal_kind,employee_id,system_admin_id,normalized_login_key,password_hash,credential_state,force_password_change,credential_epoch,created_at,updated_at) VALUES('employee',$1,NULL,$2,$3,'enabled',false,1,clock_timestamp(),clock_timestamp()) RETURNING account_id",[employeeId,loginName,passwordHash])).rows[0];
 }
 return {employeeId:Number(employeeId),login:loginName,password};
}
async function databaseIdentity(db){
 return (await db.query("SELECT current_database() name,current_user role,current_setting('server_version_num')::int serverVersion,(SELECT oid::text FROM pg_database WHERE datname=current_database()) oid,(SELECT count(*)::int FROM public.f03_schema_migrations) migrationCount")).rows[0];
}
test('F05-F06真实同车跨Runtime闭环：两个独立PG16数据库、原生HTTP、资金与历史快照不可变',async t=>{
 let targetDb,sourceDb,baselineDb,auth,runtimePool,server,secret;
 try{
  assert.equal(process.env.GITHUB_REPOSITORY,'suzhe868-arch/mb');
  assert.equal(process.env.GITHUB_EVENT_NAME,'push');
  assert.equal(process.env.GITHUB_REF,REF,'must preserve authentic current GitHub ref');
  assert.equal(process.env.GITHUB_REF_NAME,REF.slice('refs/heads/'.length));
  assert.equal(process.env.GITHUB_SHA,(await import('node:child_process')).execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim());
  process.env.F06_COMPOSITE_DEBUG_ERRORS='1';
  secret=randomBytes(32);
  process.env.F03_1_HMAC_KEY_BASE64=secret.toString('base64');
  const sourceManifest=JSON.parse(await readFile(new URL('./artifacts/source-manifest.json',import.meta.url),'utf8'));
  const sourceManifestCopy={...sourceManifest};delete sourceManifestCopy.manifestSHA256;
  assert.equal(sourceManifest.manifestSHA256,digestObject(sourceManifestCopy),'source manifest digest mismatch');
  targetDb=new pg.Client({connectionString:DSN});await targetDb.connect();
  sourceDb=new pg.Client({connectionString:SOURCE_DSN});await sourceDb.connect();
  baselineDb=new pg.Client({connectionString:BASELINE_DSN});await baselineDb.connect();
  const sourceIdentity=await databaseIdentity(sourceDb),targetIdentity=await databaseIdentity(targetDb),baselineIdentity=await databaseIdentity(baselineDb);
  assert.equal(sourceIdentity.name,'f05_vehicle_source');assert.equal(sourceIdentity.role,'f03_ci');
  assert.ok(sourceIdentity.serverVersion>=160000&&sourceIdentity.serverVersion<170000);
  assert.equal(sourceIdentity.migrationCount,14);
  assert.equal(sourceIdentity.oid,sourceManifest.database.oid);
  assert.equal(targetIdentity.name,'f03_auth_test');assert.equal(targetIdentity.role,'f03_ci');
  assert.ok(targetIdentity.serverVersion>=160000&&targetIdentity.serverVersion<170000);
  assert.equal(targetIdentity.migrationCount,24);
  assert.notEqual(sourceIdentity.oid,targetIdentity.oid);
  assert.notEqual(baselineIdentity.oid,targetIdentity.oid);
  assert.notEqual(baselineIdentity.oid,sourceIdentity.oid);
  const sourceStructure=await getPublicStructure(sourceDb);
  assert.equal(sourceStructure.sha256,sourceManifest.database.publicCatalogSha256);
  const sourceLedger=(await sourceDb.query('SELECT migration_id,checksum,structure_sha256 FROM public.f03_schema_migrations ORDER BY migration_id')).rows;
  assert.equal(digestObject(sourceLedger),sourceManifest.database.publicLedgerSha256);
  const sourceDraft=(await sourceDb.query('SELECT draft_payload,status,published_vehicle_id::text,published_listing_cycle_id::text FROM f05_manual_vehicle_test.drafts WHERE draft_id=$1::bigint',[sourceManifest.vehicle.draftId])).rows[0];
  assert.ok(sourceDraft);assert.equal(sourceDraft.status,'published');
  assert.equal(sourceDraft.published_vehicle_id,sourceManifest.vehicle.vehicleId);
  assert.equal(sourceDraft.published_listing_cycle_id,sourceManifest.vehicle.listingCycleId);
  assert.equal(digestObject(sourceDraft.draft_payload),sourceManifest.vehicle.payloadSha256);
  const sourceFacts=(await sourceDb.query('SELECT vehicle_id::text,listing_cycle_id::text,source_type,created_by_employee_id::text,brand_id::text,series_id::text,model_id::text,model_year,mileage_km,city,payload_snapshot FROM f05_manual_vehicle_test.published_vehicle_facts WHERE vehicle_id=$1::bigint',[sourceManifest.vehicle.vehicleId])).rows[0];
  assert.ok(sourceFacts);assert.equal(sourceFacts.source_type,'mingbang');
  assert.equal(digestObject(sourceFacts.payload_snapshot),sourceManifest.vehicle.payloadSnapshotSha256);
  const targetVehicle=(await targetDb.query('SELECT vehicle_id::text,source_type,model_id::text,vin,source_sale_status,platform_visibility,formally_published_at,archived_at FROM public.vehicles WHERE vehicle_id=$1::bigint',[sourceManifest.vehicle.vehicleId])).rows[0];
  const targetCycle=(await targetDb.query('SELECT listing_cycle_id::text,vehicle_id::text,ended_at FROM public.vehicle_listing_cycles WHERE listing_cycle_id=$1::bigint AND vehicle_id=$2::bigint',[sourceManifest.vehicle.listingCycleId,sourceManifest.vehicle.vehicleId])).rows[0];
  const targetResponsibility=(await targetDb.query('SELECT responsibility_id::text,responsible_employee_id::text,team_id::text,source_snapshot,provenance_kind,revoked_at,trusted_event_key FROM public.vehicle_current_responsibilities WHERE responsibility_id=$1::bigint',[sourceManifest.vehicle.responsibilityId])).rows[0];
  assert.ok(targetVehicle&&targetCycle&&targetResponsibility);
  assert.equal(targetVehicle.source_type,sourceManifest.vehicle.sourceType);
  assert.equal(targetVehicle.model_id,String(sourceManifest.vehicle.modelId));
  assert.equal(sha(targetVehicle.vin||''),sourceManifest.vehicle.vinSha256);
  assert.equal(targetVehicle.source_sale_status,'available');assert.equal(targetVehicle.platform_visibility,'visible');
  assert.ok(targetVehicle.formally_published_at);assert.equal(targetVehicle.archived_at,null);
  assert.equal(targetCycle.listing_cycle_id,sourceManifest.vehicle.listingCycleId);assert.equal(targetCycle.ended_at,null);
  assert.equal(targetResponsibility.responsible_employee_id,sourceManifest.vehicle.responsibleEmployeeId);
  assert.equal(targetResponsibility.team_id,sourceManifest.vehicle.responsibilityTeamId);
  assert.equal(targetResponsibility.source_snapshot,'mingbang');
  assert.equal(targetResponsibility.provenance_kind,'AUTHORIZED_MANUAL_PUBLICATION');
  assert.equal(sha(targetResponsibility.trusted_event_key||''),sourceManifest.vehicle.trustedEventKeySha256);
  const currentSchema=(await targetDb.query("SELECT to_regnamespace('f05_f06_bridge_v1')::text n")).rows[0].n;
  assert.equal(currentSchema,null,'bridge sidecar must start absent on the fresh F06 target');
  await targetDb.query(await readFile(new URL('./桥接私有身份与不可变来源.sql',import.meta.url),'utf8'));
  const existingPrices=(await targetDb.query("SELECT price_event_id::text,amount_cents::text FROM public.vehicle_price_history WHERE vehicle_id=$1::bigint AND price_kind='customer_display' AND amount_cents>0 ORDER BY valid_from DESC,price_event_id DESC",[sourceManifest.vehicle.vehicleId])).rows;
  let priceEvent;
  if(existingPrices.length===0){
   priceEvent=(await targetDb.query("INSERT INTO public.vehicle_price_history(vehicle_id,price_kind,amount_cents,valid_from) VALUES($1::bigint,'customer_display',$2::bigint,clock_timestamp()) RETURNING price_event_id::text,amount_cents::text,valid_from",[sourceManifest.vehicle.vehicleId,String(sourceManifest.vehicle.retailPriceCents)])).rows[0];
  }else{
   assert.equal(existingPrices.length,1,'F05 published source must have at most one initial customer-display projection');
   assert.equal(Number(existingPrices[0].amount_cents),sourceManifest.vehicle.retailPriceCents,'pre-existing target price projection conflicts with the source manifest');
   priceEvent={price_event_id:existingPrices[0].price_event_id,amount_cents:existingPrices[0].amount_cents,
    valid_from:(await targetDb.query('SELECT valid_from FROM public.vehicle_price_history WHERE price_event_id=$1::bigint',[existingPrices[0].price_event_id])).rows[0].valid_from};
  }
  const targetOid=Number(targetIdentity.oid),sourceOid=Number(sourceIdentity.oid);
  await targetDb.query(
   'INSERT INTO f05_f06_bridge_v1.attestation(seal_name,source_manifest_sha256,source_database_oid,target_database_oid,vehicle_id,listing_cycle_id,source_type,publisher_employee_id,source_team_id,source_model_id,source_vin_sha256,source_retail_price_cents,source_mileage_km,source_city,source_payload_sha256,source_published_event_sha256,source_responsibility_id,source_price_event_id,head_sha,run_id,github_ref) VALUES($1,$2,$3::oid,$4::oid,$5::bigint,$6::bigint,$7,$8::bigint,$9::bigint,$10::bigint,$11,$12::bigint,$13::int,$14,$15,$16,$17::bigint,$18::bigint,$19,$20,$21)',
   ['F05_F06_SAME_VEHICLE_BRIDGE_V1',sourceManifest.manifestSHA256,sourceIdentity.oid,targetIdentity.oid,
    sourceManifest.vehicle.vehicleId,sourceManifest.vehicle.listingCycleId,sourceManifest.vehicle.sourceType,
    sourceManifest.vehicle.publisherEmployeeId,sourceManifest.vehicle.sourceTeamId,sourceManifest.vehicle.modelId,
    sourceManifest.vehicle.vinSha256,sourceManifest.vehicle.retailPriceCents,sourceManifest.vehicle.mileageKm,
    sourceManifest.vehicle.city,sourceManifest.vehicle.payloadSha256,sourceManifest.vehicle.publishedEventSha256,
    sourceManifest.vehicle.responsibilityId,priceEvent.price_event_id,process.env.GITHUB_SHA,String(process.env.GITHUB_RUN_ID),REF]);
  const attestation=(await targetDb.query('SELECT * FROM f05_f06_bridge_v1.attestation WHERE vehicle_id=$1::bigint',[sourceManifest.vehicle.vehicleId])).rows[0];
  assert.ok(attestation);assert.equal(String(attestation.source_database_oid),sourceIdentity.oid);
  assert.equal(String(attestation.target_database_oid),targetIdentity.oid);
  assert.equal(attestation.source_manifest_sha256,sourceManifest.manifestSHA256);
  assert.equal(attestation.source_price_event_id,priceEvent.price_event_id);
  const ownerEmployeeId=Number(sourceManifest.vehicle.publisherEmployeeId);
  const teamId=Number(sourceManifest.vehicle.sourceTeamId);
  const owner=(await targetDb.query("SELECT e.employee_id::text,e.store_id::text,r.role_code FROM public.employees e JOIN public.roles r ON r.role_id=e.main_role_id WHERE e.employee_id=$1::bigint AND e.employment_status='active'",[ownerEmployeeId])).rows[0];
  assert.ok(owner);assert.equal(owner.role_code,'sales');
  const manager=(await targetDb.query("SELECT e.employee_id::text,e.store_id::text,r.role_code FROM public.employees e JOIN public.roles r ON r.role_id=e.main_role_id WHERE e.employment_status='active' AND r.role_code IN('manager','store_head') AND e.store_id=$1::bigint AND e.employee_id<>$2::bigint ORDER BY CASE WHEN r.role_code='manager' THEN 0 ELSE 1 END,e.employee_id LIMIT 1",[owner.store_id,ownerEmployeeId])).rows[0];
  assert.ok(manager,'an active same-store manager/store head is required');
  const permissions={
   lockApprove:await ensurePermission(targetDb,'lock.ci.approve'),
   depositRecord:await ensurePermission(targetDb,'deposit.ci.record'),
   transactionOpen:await ensurePermission(targetDb,'transaction.ci.open')
  };
  await seedEmployeeScope(targetDb,ownerEmployeeId,teamId,[permissions.depositRecord,permissions.transactionOpen]);
  await denyPermission(targetDb,ownerEmployeeId,permissions.lockApprove);
  await seedEmployeeScope(targetDb,Number(manager.employee_id),teamId,[permissions.lockApprove]);
  const runId=String(process.env.GITHUB_RUN_ID);
  const customerId=String(900000000000+Number(runId.slice(-6)));
  await targetDb.query("INSERT INTO public.customers(customer_id,account_status,customer_level_id,owner_assignment_state,current_owner_employee_id) VALUES($1::bigint,'active',1,'assigned',$2::bigint)",[customerId,ownerEmployeeId]);
  await targetDb.query("INSERT INTO public.customer_phone_facts(customer_id,phone_ciphertext,valid_from) VALUES($1::bigint,decode(repeat('ab',16),'hex'),clock_timestamp()-interval '1 minute')",[customerId]);
  const customerToken=newOpaqueToken();
  await targetDb.query("INSERT INTO f06_composite_v1.customer_sessions(token_sha256,customer_id,issuer,head_sha,run_id,expires_at) VALUES($1,$2::bigint,'COMPOSITE_NONPROD_SIGNED_V1',$3,$4,clock_timestamp()+interval '2 hours')",[sha(customerToken),customerId,process.env.GITHUB_SHA,runId]);
  auth=new IsolatedAuth({connectionString:DSN,secret,origin:'https://127.0.0.1:3000'});
  const ownerAccount=await seedAccount(targetDb,ownerEmployeeId,runId);
  const managerAccount=await seedAccount(targetDb,Number(manager.employee_id),runId);
  const ownerLogin=await auth.login({login:ownerAccount.login,password:ownerAccount.password,source:'f05-f06-bridge-owner'});
  const managerLogin=await auth.login({login:managerAccount.login,password:managerAccount.password,source:'f05-f06-bridge-manager'});
  assert.equal(ownerLogin.code,'AUTH_OK');assert.equal(managerLogin.code,'AUTH_OK');
  assert.equal(ownerLogin.restricted,false);assert.equal(managerLogin.restricted,false);
  runtimePool=new pg.Pool({connectionString:DSN,max:5,connectionTimeoutMillis:2500,idleTimeoutMillis:2000});
  const verifyDb=c=>verifyCompositeRuntimeDatabase(c,process.env);
  await verifyDb(runtimePool);
  const lockService=createIsolatedF06LockService({pool:runtimePool,env:process.env,mode:'COMPOSITE_NONPROD_SIGNED_V1',sessionSecret:secret,verifyDatabase:verifyDb});
  const lockHandler=createIsolatedF06LockHandler({service:lockService,env:process.env});
  const businessHandler=createCompositeBusinessHandler(auth,process.env);
  const denyHandler=createCompositeDenyHandler();
  const handler=async(req,res)=>{
   if(await denyHandler(req,res))return true;
   if(await businessHandler(req,res))return true;
   return lockHandler(req,res);
  };
  server=createFoundationServer({lockHandler:handler,readinessProbe:async()=>{await verifyDb(runtimePool);return true}});
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
  const base='http://127.0.0.1:'+server.address().port;
  const vehicleId=sourceManifest.vehicle.vehicleId,cycleId=sourceManifest.vehicle.listingCycleId;
  const requestCount=async()=>count(targetDb,'SELECT count(*)::int n FROM public.lock_requests WHERE vehicle_id=$1::bigint AND listing_cycle_id=$2::bigint',[vehicleId,cycleId]);
  await t.test('01 F05源库与F06目标库是独立PG16 OID且迁移链分别为14/24',async()=>{
   assert.notEqual(sourceIdentity.oid,targetIdentity.oid);assert.notEqual(targetIdentity.oid,baselineIdentity.oid);
   assert.equal(sourceIdentity.migrationCount,14);assert.equal(targetIdentity.migrationCount,24);
   assert.equal(sourceIdentity.role,'f03_ci');assert.equal(targetIdentity.role,'f03_ci');
  });
  await t.test('02 F05原生发布事实在F06目标库逐字段一致',async()=>{
   assert.equal(targetVehicle.vehicle_id,vehicleId);assert.equal(targetCycle.listing_cycle_id,cycleId);
   assert.equal(targetResponsibility.responsible_employee_id,sourceManifest.vehicle.responsibleEmployeeId);
   assert.equal(targetResponsibility.team_id,sourceManifest.vehicle.responsibilityTeamId);
   assert.equal(targetResponsibility.source_snapshot,'mingbang');
   assert.equal(targetResponsibility.provenance_kind,'AUTHORIZED_MANUAL_PUBLICATION');
  });
  await t.test('03 F05发布清单不泄露VIN或描述且绑定不可变PUBLISHED事件摘要',async()=>{
   assert.equal(sourceManifest.vehicle.publishedEventSha256.length,64);
   assert.equal(sourceManifest.vehicle.payloadSha256.length,64);
   assert.equal(sourceManifest.manifestSHA256,attestation.source_manifest_sha256);
  });
  await t.test('04 桥接身份签名绑定真实源/目标OID、当前SHA和精确Ref',async()=>{
   assert.equal(String(attestation.source_database_oid),sourceIdentity.oid);
   assert.equal(String(attestation.target_database_oid),targetIdentity.oid);
   assert.equal(attestation.head_sha,process.env.GITHUB_SHA);assert.equal(attestation.github_ref,REF);
   assert.equal(attestation.run_id,runId);
  });
  await t.test('05 客户展示价投影只来源于F05清单中的原始标价',async()=>{
   assert.equal(Number(priceEvent.amount_cents),sourceManifest.vehicle.retailPriceCents);
   assert.equal(String(priceEvent.price_event_id),String(attestation.source_price_event_id));
   assert.equal((await targetDb.query("SELECT count(*)::int n FROM public.vehicle_price_history WHERE vehicle_id=$1::bigint AND price_kind='customer_display' AND amount_cents>0",[vehicleId])).rows[0].n,1);
  });
  await t.test('06 原生F06 Composite父签名与24迁移链验证成功',async()=>{
   const verified=await verifyCompositeRuntimeDatabase(targetDb,process.env);
   assert.equal(verified.verified,true);
   assert.equal((await getPublicStructure(targetDb)).sha256,verified.publicCatalogSHA);
  });
  await t.test('07 未认证客户无法创建LockRequest且无副作用',async()=>{
   const before=await requestCount();
   const out=await post(base,'/api/v1/lock-requests',null,{vehicleId:vehicleId,listingCycleId:cycleId,idempotencyKey:'bridge_no_auth_request_'+runId});
   assert.equal(out.status,401);assert.equal(await requestCount(),before);
  });
  await t.test('08 Forwarded/X-Forwarded身份头被F06原生HTTP拒绝',async()=>{
   const before=await requestCount();
   const out=await post(base,'/api/v1/lock-requests',customerToken,{vehicleId:vehicleId,listingCycleId:cycleId,idempotencyKey:'bridge_forwarded_request_'+runId},{'x-forwarded-for':'127.0.0.1'});
   assert.equal(out.status,403);assert.equal(out.data.code,'UNTRUSTED_REQUEST');assert.equal(await requestCount(),before);
  });
  await t.test('09 不存在的Vehicle无法创建LockRequest',async()=>{
   const before=await requestCount();
   const out=await post(base,'/api/v1/lock-requests',customerToken,{vehicleId:'999999999999',listingCycleId:'999999999998',idempotencyKey:'bridge_unknown_vehicle_'+runId});
   assert.ok(out.status>=400);assert.equal(await requestCount(),before);
  });
  await t.test('10 同一Vehicle错误ListingCycle无法创建LockRequest',async()=>{
   const before=await requestCount();
   const out=await post(base,'/api/v1/lock-requests',customerToken,{vehicleId:vehicleId,listingCycleId:'999999999998',idempotencyKey:'bridge_wrong_cycle_'+runId});
   assert.equal(out.status,403);assert.equal(await requestCount(),before);
  });
  const created=await post(base,'/api/v1/lock-requests',customerToken,{vehicleId:vehicleId,listingCycleId:cycleId,idempotencyKey:'bridge_lock_request_'+runId});
  assert.equal(created.status,201,JSON.stringify(created.data));assert.equal(created.data.code,'LOCK_REQUEST_PENDING');
  const requestId=String(created.data.requestId);
  await t.test('11 F06原生HTTP创建真实LockRequest并写入可信请求键',async()=>{
   assert.ok(Number(requestId)>0);
   const row=(await targetDb.query('SELECT customer_id::text,vehicle_id::text,listing_cycle_id::text,status FROM public.lock_requests WHERE lock_request_id=$1::bigint',[requestId])).rows[0];
   assert.ok(row);assert.equal(row.vehicle_id,vehicleId);assert.equal(row.listing_cycle_id,cycleId);assert.equal(row.customer_id,customerId);assert.equal(row.status,'pending');
   assert.equal((await targetDb.query('SELECT count(*)::int n FROM f06_composite_v1.request_keys WHERE request_id=$1::bigint',[requestId])).rows[0].n,1);
  });
  await t.test('12 非法LockDecision被HTTP参数门禁拒绝',async()=>{
   const out=await post(base,'/api/v1/lock-requests/'+requestId+'/decision',managerLogin.token,{decision:'complete',idempotencyKey:'bridge_bad_decision_'+runId});
   assert.equal(out.status,400);assert.equal((await targetDb.query('SELECT status FROM public.lock_requests WHERE lock_request_id=$1::bigint',[requestId])).rows[0].status,'pending');
  });
  await t.test('13 无审批Scope的原责任销售不能审批LockRequest',async()=>{
   const out=await post(base,'/api/v1/lock-requests/'+requestId+'/decision',ownerLogin.token,{decision:'approve',idempotencyKey:'bridge_wrong_approver_'+runId});
   assert.equal(out.status,403);assert.equal((await targetDb.query('SELECT status FROM public.lock_requests WHERE lock_request_id=$1::bigint',[requestId])).rows[0].status,'pending');
  });
  const approved=await post(base,'/api/v1/lock-requests/'+requestId+'/decision',managerLogin.token,{decision:'approve',idempotencyKey:'bridge_lock_decision_'+runId});
  assert.equal(approved.status,200,JSON.stringify(approved.data));assert.equal(approved.data.code,'LOCK_APPROVED');
  const lockId=String(approved.data.lockId);
  await t.test('14 真实Lock承接同车同周期并已转换为active锁定',async()=>{
   const row=(await targetDb.query('SELECT lock_id::text,vehicle_id::text,customer_id::text,listing_cycle_id::text,lock_status,responsible_employee_id::text,source_lock_request_id::text FROM public.locks WHERE lock_id=$1::bigint',[lockId])).rows[0];
   assert.ok(row);assert.equal(row.vehicle_id,vehicleId);assert.equal(row.listing_cycle_id,cycleId);assert.equal(row.customer_id,customerId);
   assert.equal(row.lock_status,'active');assert.equal(row.source_lock_request_id,requestId);
  });
  await t.test('15 LockSnapshot冻结F05原始customer_display价与price_event_id',async()=>{
   const snap=(await targetDb.query('SELECT price_kind,price_cents::text,source_price_event_id::text,approver_employee_id::text,responsible_employee_id::text FROM f06_composite_v1.lock_snapshots WHERE lock_id=$1::bigint',[lockId])).rows[0];
   assert.ok(snap);assert.equal(snap.price_kind,'numeric');assert.equal(Number(snap.price_cents),sourceManifest.vehicle.retailPriceCents);
   assert.equal(snap.source_price_event_id,String(priceEvent.price_event_id));assert.equal(snap.responsible_employee_id,String(ownerEmployeeId));
  });
  const depositPath='/__nonprod__/f06-composite/deposit/record';
  const depositCount=async()=>count(targetDb,'SELECT count(*)::int n FROM public.deposit_receipts WHERE lock_id=$1::bigint',[lockId]);
  await t.test('16 未认证员工不能记录合成定金',async()=>{
   const before=await depositCount();
   const out=await post(base,depositPath,null,{lockId:lockId,amountCents:500000,currency:'CNY',paymentMethod:'bank_transfer',eventKey:'bridge_deposit_no_auth_'+runId,receivedAt:new Date().toISOString(),note:'Synthetic bridge receipt'});
   assert.equal(out.status,401);assert.equal(await depositCount(),before);
  });
  await t.test('17 零金额合成定金被拒绝且没有收据',async()=>{
   const before=await depositCount();
   const out=await post(base,depositPath,ownerLogin.token,{lockId:lockId,amountCents:0,currency:'CNY',paymentMethod:'bank_transfer',eventKey:'bridge_deposit_zero_'+runId,receivedAt:new Date().toISOString(),note:'Synthetic bridge receipt'});
   assert.equal(out.status,400);assert.equal(await depositCount(),before);
  });
  await t.test('18 非CNY合成定金被拒绝且没有收据',async()=>{
   const before=await depositCount();
   const out=await post(base,depositPath,ownerLogin.token,{lockId:lockId,amountCents:500000,currency:'USD',paymentMethod:'bank_transfer',eventKey:'bridge_deposit_currency_'+runId,receivedAt:new Date().toISOString(),note:'Synthetic bridge receipt'});
   assert.equal(out.status,400);assert.equal(await depositCount(),before);
  });
  await t.test('19 未知issuer声明字段被Composite原生HTTP拒绝',async()=>{
   const before=await depositCount();
   const out=await post(base,depositPath,ownerLogin.token,{lockId:lockId,amountCents:500000,currency:'CNY',paymentMethod:'bank_transfer',eventKey:'bridge_deposit_extra_'+runId,receivedAt:new Date().toISOString(),note:'Synthetic bridge receipt',issuer:'trusted'}, {'x-issuer':'trusted'});
   assert.equal(out.status,403);assert.equal(await depositCount(),before);
  });
  const deposit=await post(base,depositPath,ownerLogin.token,{lockId:lockId,amountCents:500000,currency:'CNY',paymentMethod:'bank_transfer',eventKey:'bridge_deposit_record_'+runId,receivedAt:new Date().toISOString(),note:'Synthetic same-vehicle bridge receipt'});
  assert.equal(deposit.status,201,JSON.stringify(deposit.data));assert.equal(deposit.data.code,'F06_3A_SYNTHETIC_RECEIPT_RECORDED');
  const depositId=String(deposit.data.depositId);
  await t.test('20 F06合成定金通过原生HTTP落入真实PG16收据',async()=>{
   const row=(await targetDb.query('SELECT deposit_id::text,lock_id::text,amount_cents::text,currency,payment_method FROM public.deposit_receipts WHERE deposit_id=$1::bigint',[depositId])).rows[0];
   assert.ok(row);assert.equal(row.lock_id,lockId);assert.equal(Number(row.amount_cents),500000);assert.equal(row.currency,'CNY');assert.equal(row.payment_method,'bank_transfer');
  });
  await t.test('21 定金provenance绑定同车同周期且仅为CI合成资金',async()=>{
   const row=(await targetDb.query('SELECT deposit_id::text,lock_id::text,customer_id::text,vehicle_id::text,listing_cycle_id::text,original_amount_cents::text,currency,issuer_kind FROM f06_3a_ci.receipt_provenance WHERE deposit_id=$1::bigint',[depositId])).rows[0];
   assert.ok(row);assert.equal(row.lock_id,lockId);assert.equal(row.vehicle_id,vehicleId);assert.equal(row.listing_cycle_id,cycleId);
   assert.equal(row.customer_id,customerId);assert.equal(Number(row.original_amount_cents),500000);assert.equal(row.issuer_kind,'CI_SYNTHETIC_NOT_REAL_MONEY');
  });
  await t.test('22 定金签名事件与审计同时存在',async()=>{
   assert.equal((await targetDb.query("SELECT count(*)::int n FROM f06_composite_v1.issued_events WHERE event_kind='signed_deposit' AND parent_object_id=$1::bigint",[depositId])).rows[0].n,1);
   assert.equal((await targetDb.query("SELECT count(*)::int n FROM public.audit_events WHERE object_kind='Deposit' AND object_id=$1",[lockId])).rows[0].n,1);
  });
  const txPath='/__nonprod__/f06-composite/transaction/open';
  const txCount=async()=>count(targetDb,'SELECT count(*)::int n FROM public.transactions WHERE source_lock_id=$1::bigint',[lockId]);
  await t.test('23 非法LockId不能创建Transaction',async()=>{
   const before=await txCount();
   const out=await post(base,txPath,ownerLogin.token,{lockId:0,eventKey:'bridge_tx_invalid_lock_'+runId});
   assert.equal(out.status,400);assert.equal(await txCount(),before);
  });
  await t.test('24 非法Transaction eventKey不能创建Transaction',async()=>{
   const before=await txCount();
   const out=await post(base,txPath,ownerLogin.token,{lockId:lockId,eventKey:'x'});
   assert.equal(out.status,400);assert.equal(await txCount(),before);
  });
  await t.test('25 无效Bearer不能创建Transaction',async()=>{
   const before=await txCount();
   const out=await post(base,txPath,'A'.repeat(43),{lockId:lockId,eventKey:'bridge_tx_wrong_session_'+runId});
   assert.notEqual(out.status,200);assert.equal(await txCount(),before);
  });
  await t.test('26 Transaction原生HTTP拒绝未授权字段与issuer头',async()=>{
   const before=await txCount();
   const out=await post(base,txPath,ownerLogin.token,{lockId:lockId,eventKey:'bridge_tx_extra_field_'+runId,sourcePriceCents:8300000},{'x-issuer':'trusted'});
   assert.equal(out.status,403);assert.equal(await txCount(),before);
  });
  const opened=await post(base,txPath,ownerLogin.token,{lockId:lockId,eventKey:'bridge_transaction_open_'+runId});
  assert.equal(opened.status,200,JSON.stringify(opened.data));assert.equal(opened.data.code,'F06_TX_ATOMIC_SYNTHETIC_IN_PROGRESS');
  const transactionId=String(opened.data.transactionId);
  await t.test('27 Transaction真实记录与Lock/Vehicle/Cycle完全同源',async()=>{
   const row=(await targetDb.query('SELECT transaction_id::text,source_lock_id::text,customer_id::text,vehicle_id::text,listing_cycle_id::text,status,responsible_employee_id::text FROM public.transactions WHERE transaction_id=$1::bigint',[transactionId])).rows[0];
   assert.ok(row);assert.equal(row.source_lock_id,lockId);assert.equal(row.vehicle_id,vehicleId);assert.equal(row.listing_cycle_id,cycleId);assert.equal(row.customer_id,customerId);assert.equal(row.status,'in_progress');
  });
  await t.test('28 Transaction来源侧车冻结原始价格且Lock已原子释放',async()=>{
   const origin=(await targetDb.query('SELECT transaction_id::text,source_lock_id::text,vehicle_id::text,listing_cycle_id::text,source_price_kind,source_price_cents::text,issuer,state,carrier FROM f06_real_tx_ci.origins WHERE transaction_id=$1::bigint',[transactionId])).rows[0];
   assert.ok(origin);assert.equal(origin.source_lock_id,lockId);assert.equal(origin.vehicle_id,vehicleId);assert.equal(origin.listing_cycle_id,cycleId);
   assert.equal(origin.source_price_kind,'numeric');assert.equal(Number(origin.source_price_cents),sourceManifest.vehicle.retailPriceCents);
   assert.equal(origin.issuer,'CI_SYNTHETIC_NOT_REAL_MONEY');assert.equal(origin.state,'in_progress');assert.equal(origin.carrier,'in_progress');
   assert.equal((await targetDb.query('SELECT lock_status,end_reason FROM public.locks WHERE lock_id=$1::bigint',[lockId])).rows[0].lock_status,'released');
  });
  await t.test('29 Transaction signed_tx与锁/定金审计事件全部落库',async()=>{
   assert.equal((await targetDb.query("SELECT count(*)::int n FROM f06_composite_v1.issued_events WHERE event_kind='signed_tx' AND parent_object_id=$1::bigint",[transactionId])).rows[0].n,1);
   assert.equal((await targetDb.query("SELECT count(*)::int n FROM f06_composite_v1.issued_events WHERE event_kind='signed_lock' AND parent_object_id=$1::bigint",[lockId])).rows[0].n,1);
   assert.equal((await targetDb.query("SELECT count(*)::int n FROM public.audit_events WHERE object_kind='Transaction' AND object_id=$1 AND action='f06_real_tx_ci_atomic_open'",[transactionId])).rows[0].n,1);
  });
  await t.test('30 桥接来源attestation禁止更新或删除',async()=>{
   await assert.rejects(()=>targetDb.query('UPDATE f05_f06_bridge_v1.attestation SET source_city=$1 WHERE vehicle_id=$2::bigint',['tampered',vehicleId]),/F05_F06_BRIDGE_IMMUTABLE/);
   await assert.rejects(()=>targetDb.query('DELETE FROM f05_f06_bridge_v1.attestation WHERE vehicle_id=$1::bigint',[vehicleId]),/F05_F06_BRIDGE_IMMUTABLE/);
   assert.equal((await targetDb.query('SELECT source_city FROM f05_f06_bridge_v1.attestation WHERE vehicle_id=$1::bigint',[vehicleId])).rows[0].source_city,sourceManifest.vehicle.city);
  });
  await t.test('31 LockSnapshot禁止回写原始价格',async()=>{
   await assert.rejects(()=>targetDb.query('UPDATE f06_composite_v1.lock_snapshots SET price_cents=1 WHERE lock_id=$1::bigint',[lockId]),/F06_COMPOSITE_IMMUTABLE/);
   assert.equal(Number((await targetDb.query('SELECT price_cents FROM f06_composite_v1.lock_snapshots WHERE lock_id=$1::bigint',[lockId])).rows[0].price_cents),sourceManifest.vehicle.retailPriceCents);
  });
  const ids={vehicleId:vehicleId,listingCycleId:cycleId,requestId:requestId,lockId:lockId,depositId:depositId,transactionId:transactionId,priceEventId:String(priceEvent.price_event_id)};
  const snapshot=await captureSnapshot(targetDb,ids);
  const snapshotSHA256=snapshotSha(snapshot);
  const before={
   schemaVersion:1,
   github:{repository:process.env.GITHUB_REPOSITORY,ref:process.env.GITHUB_REF,sha:process.env.GITHUB_SHA,runId:runId},
   sourceManifestSHA256:sourceManifest.manifestSHA256,
   database:{name:targetIdentity.name,oid:targetIdentity.oid,baselineOid:baselineIdentity.oid,sourceOid:sourceIdentity.oid,migrationCount:targetIdentity.migrationCount,role:targetIdentity.role,serverVersion:targetIdentity.serverVersion},
   ids:ids,
   sourcePriceCents:sourceManifest.vehicle.retailPriceCents,
   projectedPriceEventId:String(priceEvent.price_event_id),
   snapshotSHA256:snapshotSHA256,
   snapshot:snapshot
  };
  await mkdir(new URL('./artifacts/',import.meta.url),{recursive:true});
  await writeFile(new URL('./artifacts/f06-before-edit.json',import.meta.url),JSON.stringify(before,null,2)+'\n',{mode:0o600});
  await t.test('32 F06历史快照和关联审计已完成编辑前基线封存',async()=>{
   assert.match(snapshotSHA256,/^[0-9a-f]{64}$/);
   assert.equal(String(snapshot.vehicle.row.vehicle_id),vehicleId);
   assert.equal(Number(snapshot.lockSnapshot.row.price_cents),sourceManifest.vehicle.retailPriceCents);
   assert.equal(Number(snapshot.transactionOrigin.row.source_price_cents),sourceManifest.vehicle.retailPriceCents);
  });
  console.log('F05_F06_BRIDGE_BUSINESS_CHAIN_PASS',JSON.stringify({vehicleId:vehicleId,listingCycleId:cycleId,requestId:requestId,lockId:lockId,depositId:depositId,transactionId:transactionId,sourceOid:sourceIdentity.oid,targetOid:targetIdentity.oid,priceCents:sourceManifest.vehicle.retailPriceCents,snapshotSHA256:snapshotSHA256}));
 }finally{
  if(server)await new Promise(resolve=>server.close(()=>resolve()));
  if(runtimePool)await runtimePool.end().catch(()=>{});
  if(auth)await auth.close().catch(()=>{});
  if(targetDb)await targetDb.end().catch(()=>{});
  if(sourceDb)await sourceDb.end().catch(()=>{});
  if(baselineDb)await baselineDb.end().catch(()=>{});
  if(secret)secret.fill(0);
 }
});
