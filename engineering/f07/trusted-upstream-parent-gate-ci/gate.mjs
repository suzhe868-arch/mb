// F07-3 仅隔离 CI：消费冻结 F03/F05 真实读取器，不生成正式敏感能力授权。
import pg from 'pg';
import {createHmac,timingSafeEqual} from 'node:crypto';
import {readCurrentFacts} from '../../f03/runtime-facts/current-facts.mjs';
import {verifyAuthDatabase} from '../../src/f03-auth-readiness.mjs';
import {verify as verifyF05} from '../../f05/wholesale-to-mingbang-conversion/migration.mjs';

export const DATABASE_URL='postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test';
const REF='refs/heads/feat/f07-3-trusted-upstream-and-parent-source-gate-ci';
export const SOURCE_GAP='SIGNED_F03_PHONE_ALLOW_SOURCE_GAP';
const deny=(code,origin='SIGNED_PARENT_NEGATIVE_ONLY')=>Object.freeze({allowed:false,code,origin});
export {deny};
export function assertCIEnv(e=process.env) {
 const expected={CI:'true',GITHUB_ACTIONS:'true',APP_ENV:'test',NODE_ENV:'test',
  GITHUB_EVENT_NAME:'push',GITHUB_REPOSITORY:'suzhe868-arch/mb',GITHUB_REF:REF,
  F03_1_ISOLATION_CONFIRM:'I_AUTHORIZE_F03_1_NEW_EMPTY_PG16_AUTH_ONLY',
  F05_2_ISOLATION_CONFIRM:'I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY',
  F07_3_ONLY:'I_AUTHORIZE_F07_3_SYNTHETIC_PARENT_PROOF',F03_1_DATABASE_URL:DATABASE_URL};
 for (const [name,value] of Object.entries(expected))
  if(e[name]!==value) throw Error('F07_3_CI_ENV_'+name);
 if(!/^[0-9]{6,20}$/.test(e.GITHUB_RUN_ID||''))throw Error('F07_3_CI_RUN');
 if(e.DATABASE_URL!==DATABASE_URL)throw Error('F07_3_CI_DSN');
}
export async function physicalGate(pool,env=process.env) {
 assertCIEnv(env);
 const q=await pool.query("SELECT current_database() db,current_user usr,current_setting('server_version_num')::int ver,(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) su,(SELECT rolcreatedb FROM pg_roles WHERE rolname=current_user) cdb,(SELECT rolcreaterole FROM pg_roles WHERE rolname=current_user) cr,pg_backend_pid() pid");
 const a=q.rows[0];
 if(!a||a.db!=='f03_auth_test'||a.usr!=='f03_ci'||a.ver<160000||a.ver>=170000||a.su!==false||a.cdb!==false||a.cr!==false)throw Error('F07_3_PHYSICAL_IDENTITY_DENIED');
 return a;
}
export const pool=()=>{assertCIEnv();return new pg.Pool({connectionString:DATABASE_URL,max:5,connectionTimeoutMillis:3000});};
const id=x=>typeof x==='string'&&/^[1-9][0-9]{0,17}$/.test(x);
export const validPublisher=x=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).sort().join(',')==='source_platform,upstream_publisher_id,vehicle_id'&&
 x.source_platform==='JYT'&&id(x.upstream_publisher_id)&&id(x.vehicle_id);
const paths=new Set(['vehicle_photo','report_visible','report_original','publisher_phone']);
export async function signedRead(auth,token,ctx,kind='publisher_phone',trace=()=>{}) {
 assertCIEnv();
 await physicalGate(auth.pool);
 if(!paths.has(kind))return deny('UNKNOWN_RESOURCE');
 if(!validPublisher(ctx))return deny('PUBLISHER_VEHICLE_SOURCE_BINDING_DENIED');
 // 经真实 F03 验签会话和当前权限目录，再执行任何资源取值。
 const op=kind==='publisher_phone'?'vehicle.publisher_phone.read':'vehicle.read';
 let p;
 try{
  trace({stage:'parent_called',kind});
  p=await readCurrentFacts(auth,token,op);
  trace({stage:'parent_result',kind,code:p.code,finalAllowed:p.finalAllowed===true});
 }
 catch(e){
  // F03真实v2认证Seal不接受F05后续签名迁移版本；不伪造跨版本成功授权。
  if(/^F03_AUTH_GUARD_(TABLES|VERSION_OR_SEAL|STRUCTURE)/.test(String(e?.message))){
   trace({stage:'parent_schema_gap',kind,code:'SIGNED_F03_F05_SCHEMA_VERSION_SOURCE_GAP'});
   return deny('SIGNED_F03_F05_SCHEMA_VERSION_SOURCE_GAP','SOURCE_GAP');
  }
  throw e;
 }
 if(p.finalAllowed!==true) return deny(p.code);
 // 当前冻结父读取器不会授权最终 Scope/Object；即使未来读到允许，
 // 无已签 publisher/Vehicle 物理绑定和报告可见性都必须继续拒绝。
 return deny('SIGNED_SCOPE_OBJECT_AND_PUBLISHER_SOURCE_GAP','SOURCE_GAP');
}
export function inspectCollector(raw,issuedAt,signature,secret,expected) {
 if(typeof raw!=='string'||raw.length>2048||typeof issuedAt!=='string'||!/^[0-9]{13}$/.test(issuedAt)||Math.abs(Date.now()-Number(issuedAt))>300000)return deny('COLLECTOR_TIME_DENIED','CI_SYNTHETIC_ONLY');
 if(typeof signature!=='string'||!/^[a-f0-9]{64}$/.test(signature)||!Buffer.isBuffer(secret)||secret.length<32)return deny('COLLECTOR_SIGNATURE_DENIED','CI_SYNTHETIC_ONLY');
 const match=createHmac('sha256',secret).update(issuedAt+'.'+raw).digest();
 if(!timingSafeEqual(match,Buffer.from(signature,'hex')))return deny('COLLECTOR_SIGNATURE_DENIED','CI_SYNTHETIC_ONLY');
 let obj;try{obj=JSON.parse(raw);}catch{return deny('COLLECTOR_PAYLOAD_DENIED','CI_SYNTHETIC_ONLY');}
 if(!obj||Object.keys(obj).sort().join(',')!=='car_code,job_id,nonce,source_platform,upstream_publisher_id,vehicle_id'
 ||obj.source_platform!=='JYT'||!id(obj.upstream_publisher_id)||!id(obj.vehicle_id)
 ||!/^job-[0-9]{1,8}$/.test(obj.job_id)||!/^[a-f0-9]{32}$/.test(obj.nonce)
 ||!expected||obj.source_platform!==expected.source_platform||obj.upstream_publisher_id!==expected.upstream_publisher_id
 ||obj.vehicle_id!==expected.vehicle_id)return deny('COLLECTOR_BINDING_DENIED','CI_SYNTHETIC_ONLY');
 // 无真实 Collector/JYT Job Issuer、nonce 持久回执；匹配仅代表合成签名有效。
 return deny('PRODUCTION_JYT_JOB_ISSUER_SOURCE_GAP','SOURCE_GAP');
}

// PDM-04 三固定API仅作为CI合成合同映射，不是外部路由或真实API Key鉴权。
export const SYNTHETIC_SYNC_APIS=Object.freeze({
 UPSERT_VEHICLE:'新增/更新车源',
 BATCH_CONFIRM_DELIST:'批量确认下架',
 LIST_CURRENT_WHOLESALE:'获取当前在售批发车源'
});
export function mapSyntheticSyncApi(api,request,credentialDomain='vehicle_sync_api') {
 if(credentialDomain!=='vehicle_sync_api')return deny('SYNC_API_CREDENTIAL_DOMAIN_DENIED','CI_SYNTHETIC_ONLY');
 if(!Object.hasOwn(SYNTHETIC_SYNC_APIS,api))return deny('SYNC_API_UNKNOWN','CI_SYNTHETIC_ONLY');
 if(!request||typeof request!=='object'||Array.isArray(request)||
    !/^job-[0-9]{1,8}$/.test(request.job_id||''))return deny('SYNC_API_JOB_DENIED','CI_SYNTHETIC_ONLY');
 const base={api,job_id:request.job_id,origin:'CI_SYNTHETIC_ONLY',allowed:false,code:'PRODUCTION_SYNC_API_ISSUER_SOURCE_GAP'};
 if(api==='LIST_CURRENT_WHOLESALE') {
  if(Object.keys(request).sort().join(',')!=='job_id,source_platform'||request.source_platform!=='JYT')
   return deny('SYNC_API_LIST_SCOPE_DENIED','CI_SYNTHETIC_ONLY');
  return Object.freeze({...base,serverScoped:true,vehicle_ids:[],publisher_ids:[]});
 }
 if(api==='UPSERT_VEHICLE'){
  if(Object.keys(request).sort().join(',')!=='car_code,job_id,source_platform,upstream_publisher_id,vehicle_id'||
   typeof request.car_code!=='string'||request.car_code.length<1||request.car_code.length>128||
   !validPublisher({source_platform:request.source_platform,upstream_publisher_id:request.upstream_publisher_id,vehicle_id:request.vehicle_id}))
   return deny('SYNC_API_BINDING_DENIED','CI_SYNTHETIC_ONLY');
  return Object.freeze({...base,event:'UPSERT',publisher_id:request.upstream_publisher_id,vehicle_id:request.vehicle_id,car_code:request.car_code});
 }
 if(Object.keys(request).sort().join(',')!=='identities,job_id'||!Array.isArray(request.identities)||
    request.identities.length<1||request.identities.length>20||
    !request.identities.every(validPublisher))
  return deny('SYNC_API_BATCH_BINDING_DENIED','CI_SYNTHETIC_ONLY');
 return Object.freeze({...base,event:'DELIST',identities:request.identities.map(x=>Object.freeze({...x}))});
}
// 以下nonce状态表由CI测试在非public schema一次性创建；绝无正式迁移、生产Issuer或电话放权。
// 使用PG16原生复合唯一键保证两个物理Backend同时消费只成功登记一次。
export async function inspectCollectorOnce(raw,issuedAt,signature,secret,expected,db) {
 const x=inspectCollector(raw,issuedAt,signature,secret,expected);
 if(x.code!=='PRODUCTION_JYT_JOB_ISSUER_SOURCE_GAP')return x;
 await physicalGate(db);
 const obj=JSON.parse(raw),c=await db.connect();
 try{
  await c.query('BEGIN');
  const revoked=await c.query('SELECT 1 FROM f07_3_ci.revoked_jobs WHERE job_id=$1',[obj.job_id]);
  if(revoked.rowCount) {await c.query('ROLLBACK');return deny('COLLECTOR_JOB_REVOKED','CI_SYNTHETIC_ONLY')}
  const q=await c.query(
   "INSERT INTO f07_3_ci.used_nonces(source_platform,upstream_publisher_id,vehicle_id,job_id,nonce,expires_at) VALUES($1,$2,$3,$4,$5,to_timestamp($6 / 1000.0)+interval '5 minutes') ON CONFLICT DO NOTHING RETURNING nonce",
   [obj.source_platform,obj.upstream_publisher_id,obj.vehicle_id,obj.job_id,obj.nonce,Number(issuedAt)]);
  await c.query('COMMIT');
  return q.rowCount===1?deny('PRODUCTION_JYT_JOB_ISSUER_SOURCE_GAP','SOURCE_GAP'):
   deny('COLLECTOR_NONCE_REPLAY_DENIED','CI_SYNTHETIC_ONLY');
 }catch(e){await c.query('ROLLBACK').catch(()=>{});throw e}
 finally{c.release()}
}

export async function signedF05ReadOnly(auth) {
 assertCIEnv();const physical=await physicalGate(auth.pool);
 // 已签F05版本的迁移链和物理目录由F05父verifier验签；F03冻结80表v2 verifier只适用于独立F03库。
 const verified=await verifyF05(auth.pool);
 if(verified.verified!==true)throw Error('F07_3_F05_PARENT_UNVERIFIED');
 const c=await auth.pool.connect();
 try{
  await c.query('BEGIN READ ONLY ISOLATION LEVEL REPEATABLE READ');
  const tables=(await c.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('vehicles','vehicle_listing_cycles','f05_3b_sync_lineages','f05_3c_wholesale_conversions','f05_3c_conversion_audit') ORDER BY table_name")).rows.map(x=>x.table_name);
  const rows=(await c.query("SELECT c.vehicle_id,c.listing_cycle_id,c.source_platform,v.source_type FROM public.f05_3c_wholesale_conversions c JOIN public.vehicles v ON v.vehicle_id=c.vehicle_id ORDER BY c.conversion_id LIMIT 5")).rows;
  await c.query('COMMIT');
  return {physical,verified:true,tables,rows,code:'SIGNED_PARENT_READONLY_PROVEN_NO_ISSUER'};
 }catch(e){await c.query('ROLLBACK').catch(()=>{});throw e}
 finally{c.release()}
}
