import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import pg from 'pg';
import {readCurrentFacts} from '../../f03/runtime-facts/current-facts.mjs';
import {verify as verifyF05} from '../../f05/wholesale-to-mingbang-conversion/migration.mjs';
import {validateSignature} from '../../f07/collector-publisher-phone-callback-ci/contract.mjs';
import {safePath, publicUrl, MockStorage, MockCDN, testOrigin} from '../../f07/vehicle-image-cdn-asset-ci/contract.mjs';
import {ALLOWLIST, dndAt, deepLinkGuard} from '../../f07/notification-sla-incident-gate-ci/gate.mjs';

export const CONSENT = 'I_AUTHORIZE_DISPOSABLE_F07_RUNTIME_ONLY';
export const DATABASE_URL = 'postgres://f07_runtime_ci:f07_runtime_only@127.0.0.1:5432/f07_runtime_test';
export const F03_DATABASE_URL = 'postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test';
export const REF = 'refs/heads/feat/f07-runtime-integration-nonprod-01';
const ID = /^[A-Za-z0-9_-]{1,80}$/;
const PUBLISHER_ID = /^[A-Za-z0-9_-]{1,80}$/;
const VEHICLE_ID = /^[1-9][0-9]{0,17}$/;
const PHONE_TOKEN = /^TEST-[0-9]{6}$/;
const CALLBACK_KEYS = ['source_platform','upstream_publisher_id','request_id','nonce','issued_at','status','phone'];
const GROUP_EVENTS = new Set(['consultation_sla_timeout','supply_anomaly','incident_active','incident_recovery']);
const OTHER_RUNTIME_FLAGS = [
  'F06_COMPOSITE_TEST_CONSENT','F06_LOCK_TEST_CONSENT','F05_D1_BUSINESS_TEST_RUNTIME',
  'F05_REAL_CATALOG_ENABLE','F03_1_ENABLE_ISOLATED_AUTH'
];
const fail = (code, status=403, origin='SIGNED_PARENT_NEGATIVE_ONLY') => Object.assign(new Error(code),{code,status,origin});
const digest = value => createHash('sha256').update(value).digest('hex');
const exactKeys = (value, keys) => value && typeof value==='object' && !Array.isArray(value) &&
  Object.keys(value).sort().join('|')===keys.slice().sort().join('|');
const validId = value => typeof value==='string' && ID.test(value);

export function assertF07RuntimeEnvironment(env=process.env) {
  const required = {
    F07_RUNTIME_TEST_CONSENT:CONSENT,
    CI:'true', GITHUB_ACTIONS:'true', APP_ENV:'test', NODE_ENV:'test',
    GITHUB_EVENT_NAME:'push', GITHUB_REPOSITORY:'suzhe868-arch/mb', GITHUB_REF:REF,
    DATABASE_URL, F03_1_DATABASE_URL:F03_DATABASE_URL,
    F03_1_ISOLATION_CONFIRM:'I_AUTHORIZE_F03_1_NEW_EMPTY_PG16_AUTH_ONLY'
  };
  for (const [key,value] of Object.entries(required)) if(env[key]!==value) throw Error('F07_RUNTIME_ENV_'+key);
  if(!/^[0-9]{6,20}$/.test(env.GITHUB_RUN_ID??'')) throw Error('F07_RUNTIME_RUN_ID_REQUIRED');
  if(!/^[0-9a-f]{40}$/.test(env.GITHUB_SHA??'')) throw Error('F07_RUNTIME_SHA_REQUIRED');
  if(typeof env.F07_COLLECTOR_TEST_SECRET!=='string'||env.F07_COLLECTOR_TEST_SECRET.length<32) throw Error('F07_RUNTIME_CALLBACK_SECRET_REQUIRED');
  if(typeof env.F03_1_HMAC_KEY_BASE64!=='string'||Buffer.from(env.F03_1_HMAC_KEY_BASE64,'base64').length!==32) throw Error('F07_RUNTIME_F03_HMAC_REQUIRED');
  if(OTHER_RUNTIME_FLAGS.some(key=>env[key]!==undefined)) throw Error('F07_RUNTIME_COMBINATION_FORBIDDEN');
  if(env.F07_RUNTIME_TLS_KEY_PATH==null||env.F07_RUNTIME_TLS_CERT_PATH==null) throw Error('F07_RUNTIME_TLS_REQUIRED');
  return true;
}

export async function assertPhysicalPg16(db, env=process.env) {
  assertF07RuntimeEnvironment(env);
  const q=await db.query(`SELECT current_database() AS db,current_user AS usr,
    current_setting('server_version_num')::int AS version,
    (SELECT rolsuper FROM pg_roles WHERE rolname=current_user) AS superuser,
    (SELECT rolcreatedb FROM pg_roles WHERE rolname=current_user) AS createdb,
    (SELECT rolcreaterole FROM pg_roles WHERE rolname=current_user) AS createrole,
    (SELECT oid::text FROM pg_database WHERE datname=current_database()) AS database_oid,
    pg_backend_pid() AS backend_pid`);
  const x=q.rows[0];
  if(!x||x.db!=='f07_runtime_test'||x.usr!=='f07_runtime_ci'||x.version<160000||x.version>=170000||
    x.superuser!==false||x.createdb!==false||x.createrole!==false||!/^\d+$/.test(String(x.database_oid))||Number(x.backend_pid)<=0)
    throw Error('F07_RUNTIME_PG16_NON_SUPERUSER_IDENTITY_DENIED');
  return x;
}

async function sourceGapCheck(auth, token, operation, vehicleId) {
  const f03Promise=readCurrentFacts(auth,token,operation).catch(error=>({
    finalAllowed:false,
    code:/F03_AUTH_GUARD_(TABLES|VERSION_OR_SEAL|STRUCTURE)/.test(String(error?.message))
      ?'SIGNED_F03_SCHEMA_SOURCE_GAP':'SIGNED_F03_SOURCE_UNAVAILABLE'
  }));
  const f05Promise=(async()=>{
    try {
      const verified=await verifyF05(auth.pool);
      if(!verified?.verified) return {verified:false,code:'F05_CONVERSION_POSITIVE_SOURCE_GAP'};
      const client=await auth.pool.connect();
      try {
        await client.query('BEGIN READ ONLY ISOLATION LEVEL REPEATABLE READ');
        const count=await client.query('SELECT count(*)::int AS n FROM public.f05_3c_wholesale_conversions');
        const vehicle=VEHICLE_ID.test(vehicleId??'')?await client.query(`SELECT c.vehicle_id,v.source_type,cy.listing_cycle_id
          FROM public.f05_3c_wholesale_conversions c
          JOIN public.vehicles v ON v.vehicle_id=c.vehicle_id
          JOIN public.vehicle_listing_cycles cy ON cy.vehicle_id=c.vehicle_id AND cy.listing_cycle_id=c.listing_cycle_id
          WHERE c.vehicle_id=$1 LIMIT 1`,[vehicleId]):{rowCount:0,rows:[]};
        await client.query('COMMIT');
        return {verified:false,code:'F05_CONVERSION_POSITIVE_SOURCE_GAP',observedCount:count.rows[0]?.n??0,vehicleBound:vehicle.rowCount===1};
      } catch(error) {await client.query('ROLLBACK').catch(()=>{});throw error;}
      finally {client.release();}
    } catch {
      return {verified:false,code:'F05_CONVERSION_POSITIVE_SOURCE_GAP'};
    }
  })();
  const [f03,f05]=await Promise.all([f03Promise,f05Promise]);
  if(f03.finalAllowed!==true) {
    const code=f03.code||'SIGNED_F03_PARENT_SOURCE_GAP';
    const origin=/TECH_ALIAS|CAPABILITY_NOT_IN_CURRENT_CATALOG|SOURCE_GAP|UNAVAILABLE/.test(code)
      ?'SOURCE_GAP':'SIGNED_PARENT_NEGATIVE_ONLY';
    return {allowed:false,code,origin,f03Code:code,f05Code:f05.code};
  }
  if(!f05.verified) return {allowed:false,code:f05.code||'F05_CONVERSION_POSITIVE_SOURCE_GAP',origin:'SOURCE_GAP',f03Code:f03.code||null,f05Code:f05.code};
  return {allowed:false,code:'SIGNED_SCOPE_OBJECT_SOURCE_GAP',origin:'SOURCE_GAP',f03Code:f03.code||null,f05Code:f05.code};
}

function send(res,status,body,headers={}) {
  res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'private, no-store, max-age=0',
    pragma:'no-cache','x-content-type-options':'nosniff','referrer-policy':'no-referrer',...headers});
  res.end(JSON.stringify(body));
  return true;
}
async function readJson(req,limit=8192) {
  let raw='';
  for await (const chunk of req) {
    raw+=chunk.toString('utf8');
    if(Buffer.byteLength(raw,'utf8')>limit) throw fail('BODY_TOO_LARGE',413,'CI_SYNTHETIC_ONLY');
  }
  let value;try{value=JSON.parse(raw||'{}')}catch{throw fail('INVALID_JSON',400,'CI_SYNTHETIC_ONLY')}
  if(!value||typeof value!=='object'||Array.isArray(value)) throw fail('INVALID_JSON',400,'CI_SYNTHETIC_ONLY');
  return {raw,value};
}

export async function createF07Runtime({env=process.env,pool:providedPool=null,auth,testFaults={}}={}) {
  assertF07RuntimeEnvironment(env);
  if(!auth||!auth.pool||typeof auth.withSession!=='function') throw Error('F07_RUNTIME_SIGNED_F03_READER_REQUIRED');
  const ownsPool=!providedPool;
  const pool=providedPool??new pg.Pool({connectionString:env.DATABASE_URL,max:8,connectionTimeoutMillis:3000});
  const storage=new MockStorage();
  const cdn=new MockCDN();
  const withDb=async fn=>{
    assertF07RuntimeEnvironment(env);
    const c=await pool.connect();
    try {const identity=await assertPhysicalPg16(c,env);return await fn(c,identity)}
    finally {c.release()}
  };
  const bootstrap=async()=>withDb(async c=>{
    const sql=await readFile(new URL('../../f07/nonprod-runtime-integration/schema.sql',import.meta.url),'utf8');
    await c.query(sql);
  });
  await bootstrap();

  async function audit(client,domain,action,code,origin) {
    const pid=(await client.query('SELECT pg_backend_pid() AS pid')).rows[0].pid;
    await client.query('INSERT INTO f07_runtime.audit(domain,action,code,origin,backend_pid) VALUES($1,$2,$3,$4,$5)',
      [domain,action,code,origin,pid]);
  }

  async function callback(raw,ts,signature) {
    validateSignature(raw,ts,signature);
    let payload;try{payload=JSON.parse(raw)}catch{throw fail('INVALID_JSON',400,'CI_SYNTHETIC_ONLY')}
    if(!exactKeys(payload,CALLBACK_KEYS)||payload.source_platform!=='JYT'||!PUBLISHER_ID.test(payload.upstream_publisher_id??'')||
      !/^job-[0-9]{1,8}$/.test(payload.request_id??'')||!/^([a-f0-9-]{16,80})$/i.test(payload.nonce??'')||
      typeof payload.issued_at!=='string'||Number.isNaN(Date.parse(payload.issued_at))||
      Math.abs(Date.now()-Date.parse(payload.issued_at))>300000||!['ok','unavailable'].includes(payload.status)||
      (payload.status==='ok'?!PHONE_TOKEN.test(payload.phone??''):payload.phone!==null))
      throw fail('INVALID_CALLBACK',422,'CI_SYNTHETIC_ONLY');
    const bodyHash=digest(raw);
    return withDb(async db=>{
      await db.query('BEGIN');
      try {
        await db.query('SELECT pg_advisory_xact_lock(hashtext($1))',[`f07-request:${payload.request_id}`]);
        const prior=await db.query('SELECT payload_sha256,status FROM f07_runtime.callback_receipts WHERE request_id=$1 FOR UPDATE',[payload.request_id]);
        if(prior.rowCount) {
          await db.query('ROLLBACK');
          if(prior.rows[0].payload_sha256===bodyHash) return {status:'DUPLICATE',origin:'CI_SYNTHETIC_ONLY'};
          throw fail('IDEMPOTENCY_CONFLICT',409,'CI_SYNTHETIC_ONLY');
        }
        const nonce=await db.query('SELECT 1 FROM f07_runtime.callback_receipts WHERE nonce=$1',[payload.nonce]);
        if(nonce.rowCount) throw fail('NONCE_REPLAY',409,'CI_SYNTHETIC_ONLY');
        await db.query('SELECT pg_advisory_xact_lock(hashtext($1))',[`f07-publisher:${payload.source_platform}|${payload.upstream_publisher_id}`]);
        const current=await db.query('SELECT issued_at FROM f07_runtime.phone_cache WHERE source_platform=$1 AND upstream_publisher_id=$2 FOR UPDATE',
          [payload.source_platform,payload.upstream_publisher_id]);
        const newer=!current.rowCount||Date.parse(payload.issued_at)>new Date(current.rows[0].issued_at).getTime();
        const status=payload.status==='unavailable'?'UNAVAILABLE':newer?'UPDATED':'STALE';
        await db.query(`INSERT INTO f07_runtime.callback_receipts(request_id,nonce,source_platform,upstream_publisher_id,payload_sha256,status)
          VALUES($1,$2,$3,$4,$5,$6)`,[payload.request_id,payload.nonce,payload.source_platform,payload.upstream_publisher_id,bodyHash,status]);
        if(payload.status==='ok'&&newer) {
          await db.query(`INSERT INTO f07_runtime.phone_cache(source_platform,upstream_publisher_id,request_id,phone_token,issued_at,origin)
            VALUES($1,$2,$3,$4,$5,'CI_SYNTHETIC_ONLY') ON CONFLICT(source_platform,upstream_publisher_id)
            DO UPDATE SET request_id=EXCLUDED.request_id,phone_token=EXCLUDED.phone_token,issued_at=EXCLUDED.issued_at,origin='CI_SYNTHETIC_ONLY'`,
            [payload.source_platform,payload.upstream_publisher_id,payload.request_id,payload.phone,payload.issued_at]);
        }
        await audit(db,'phone','collector_callback',status,'CI_SYNTHETIC_ONLY');
        if(testFaults.failNextCallbackBeforeCommit===true) {testFaults.failNextCallbackBeforeCommit=false;throw Error('INJECTED_CALLBACK_TX_ROLLBACK');}
        await db.query('COMMIT');
        return {status,origin:'CI_SYNTHETIC_ONLY',publisher_ref:digest(payload.source_platform+'|'+payload.upstream_publisher_id).slice(0,20)};
      } catch(error) {
        await db.query('ROLLBACK').catch(()=>{});
        throw error;
      }
    });
  }

  async function assetize(payload) {
    if(payload.origin!=='CI_SYNTHETIC_ONLY') throw fail('F05_CONVERSION_POSITIVE_SOURCE_GAP',409,'SOURCE_GAP');
    if(!validId(payload.image_id)||!validId(payload.vehicle_id)) throw fail('IMAGE_ID_INVALID',400,'CI_SYNTHETIC_ONLY');
    const relative=safePath(payload.relative_path);
    const immutableOrder=payload.immutable_order??0;
    if(!Number.isSafeInteger(immutableOrder)||immutableOrder<0||immutableOrder>10000) throw fail('IMAGE_ORDER_INVALID',400,'CI_SYNTHETIC_ONLY');
    const key=`TEST_ASSET/${payload.image_id}`;
    return storage.withKeyLock(key,async()=>{
      let created=false;
      try {
        return await withDb(async db=>{
          await db.query('BEGIN');
          try {
            await db.query('SELECT pg_advisory_xact_lock(hashtext($1))',[`f07-image:${payload.image_id}`]);
            const old=await db.query('SELECT * FROM f07_runtime.image_assets WHERE image_id=$1 FOR UPDATE',[payload.image_id]);
            if(old.rowCount&&old.rows[0].asset_state==='success') {
              if(old.rows[0].vehicle_id!==payload.vehicle_id||old.rows[0].relative_path!==relative||old.rows[0].immutable_order!==immutableOrder)
                throw fail('IMAGE_IDEMPOTENCY_CONFLICT',409,'CI_SYNTHETIC_ONLY');
              if(!storage.has(old.rows[0].object_key)) throw fail('ASSET_MISSING_SINGLE_IMAGE_RECOVERY_REQUIRED',409,'CI_SYNTHETIC_ONLY');
              await db.query('COMMIT');
              return {status:'success',reused:true,url:publicUrl(old.rows[0].relative_path),immutable_order:old.rows[0].immutable_order,origin:'CI_SYNTHETIC_ONLY'};
            }
            const bytes=await testOrigin(relative);
            await storage.put(key,bytes);created=true;
            if(testFaults.failNextAssetCommit===true) {testFaults.failNextAssetCommit=false;throw Error('INJECTED_DB_WRITE_FAILURE');}
            await db.query(`INSERT INTO f07_runtime.image_assets(image_id,vehicle_id,relative_path,immutable_order,object_key,asset_state,origin,content_sha256)
              VALUES($1,$2,$3,$4,$5,'success','CI_SYNTHETIC_ONLY',$6)`,
              [payload.image_id,payload.vehicle_id,relative,immutableOrder,key,digest(bytes)]);
            await audit(db,'image','assetize','DOUBLE_SUCCESS','CI_SYNTHETIC_ONLY');
            await db.query('COMMIT');
            return {status:'success',reused:false,url:publicUrl(relative),immutable_order:immutableOrder,origin:'CI_SYNTHETIC_ONLY'};
          } catch(error) {await db.query('ROLLBACK').catch(()=>{});throw error;}
        });
      } catch(error) {
        if(created) await storage.del(key);
        if(error.code==='ASSET_MISSING_SINGLE_IMAGE_RECOVERY_REQUIRED'||(Number.isInteger(error.status)&&error.status<500)) throw error;
        await withDb(async db=>{
          await db.query(`INSERT INTO f07_runtime.asset_failures(image_ref,failure_code,origin) VALUES($1,$2,'CI_SYNTHETIC_ONLY')`,
            [String(payload.image_id||'unknown').slice(0,80),String(error.code||'ASSET_WRITE_FAILED').slice(0,120)]);
          await audit(db,'image','assetize_failed',error.code||'ASSET_WRITE_FAILED','CI_SYNTHETIC_ONLY');
        }).catch(()=>{});
        if(error.code==='UNSAFE_PATH'||error.code==='IMAGE_ID_INVALID') throw error;
        throw fail(error.code||'ASSET_WRITE_FAILED',500,'CI_SYNTHETIC_ONLY');
      }
    });
  }

  async function incidentAction(action,payload) {
    if(!validId(payload.incident_id)) throw fail('INCIDENT_ID_INVALID',400,'CI_SYNTHETIC_ONLY');
    const at=new Date(payload.at??new Date().toISOString());
    if(Number.isNaN(at.getTime())) throw fail('BUSINESS_CLOCK_INVALID',400,'CI_SYNTHETIC_ONLY');
    return withDb(async db=>{
      await db.query('BEGIN');
      try {
        if(action==='activate') {
          const old=await db.query('SELECT * FROM f07_runtime.incident_lifecycle WHERE incident_id=$1 FOR UPDATE',[payload.incident_id]);
          if(old.rowCount) {
            await db.query('ROLLBACK');
            if(old.rows[0].status==='active') return {status:'DUPLICATE',code:'INCIDENT_ALREADY_ACTIVE',origin:'CI_SYNTHETIC_ONLY'};
            throw fail('INCIDENT_ID_REUSE_DENIED',409,'CI_SYNTHETIC_ONLY');
          }
          await db.query(`INSERT INTO f07_runtime.incident_lifecycle(incident_id,status,ever_active,activated_at,origin)
            VALUES($1,'active',true,$2,'CI_SYNTHETIC_ONLY')`,[payload.incident_id,at]);
          await audit(db,'notification','incident_activate','CI_SYNTHETIC_ONLY','CI_SYNTHETIC_ONLY');
          await db.query('COMMIT');
          return {status:'active',origin:'CI_SYNTHETIC_ONLY'};
        }
        const q=await db.query(`UPDATE f07_runtime.incident_lifecycle SET status='cleared',cleared_at=$2
          WHERE incident_id=$1 AND status='active' AND activated_at<=$2 RETURNING incident_id`,[payload.incident_id,at]);
        if(q.rowCount!==1) throw fail('INCIDENT_STATE_CONFLICT',409,'CI_SYNTHETIC_ONLY');
        await audit(db,'notification','incident_clear','CI_SYNTHETIC_ONLY','CI_SYNTHETIC_ONLY');
        await db.query('COMMIT');
        return {status:'cleared',origin:'CI_SYNTHETIC_ONLY'};
      } catch(error) {await db.query('ROLLBACK').catch(()=>{});throw error;}
    });
  }

  async function dispatchNotification(payload) {
    if(!validId(payload.event_id)||typeof payload.kind!=='string'||!['personal','group'].includes(payload.channel??'personal'))
      throw fail('NOTIFICATION_INPUT_DENIED',400,'CI_SYNTHETIC_ONLY');
    const channel=payload.channel??'personal';
    const at=new Date(payload.at??new Date().toISOString());
    if(Number.isNaN(at.getTime())) throw fail('INVALID_TIME',400,'CI_SYNTHETIC_ONLY');
    if(!ALLOWLIST.includes(payload.kind)) return {status:'NOT_ALLOWLISTED',code:'PDM23_NOT_ALLOWLISTED',origin:'CI_SYNTHETIC_ONLY'};
    if(payload.kind==='consultation_sla_timeout') return {status:'SKIPPED',code:'SLA_EVENT_SOURCE_GAP',origin:'SOURCE_GAP'};
    if(channel==='group'&&!GROUP_EVENTS.has(payload.kind)) return {status:'SKIPPED',code:'GROUP_EVENT_NOT_ALLOWED',origin:'CI_SYNTHETIC_ONLY'};
    if(dndAt(at.toISOString())) return {status:'SKIPPED',code:'DND_DELAY_REVALIDATE',origin:'CI_SYNTHETIC_ONLY'};
    if(payload.kind==='incident_active'||payload.kind==='incident_recovery') {
      if(!validId(payload.incident_id)) return {status:'SKIPPED',code:'INCIDENT_SIGNED_ISSUER_SOURCE_GAP',origin:'SOURCE_GAP'};
      return withDb(async db=>{
        const q=await db.query('SELECT * FROM f07_runtime.incident_lifecycle WHERE incident_id=$1',[payload.incident_id]);
        const incident=q.rows[0];
        if(!incident||!incident.ever_active) return {status:'SKIPPED',code:'INCIDENT_CURRENT_ACTIVE_SOURCE_GAP',origin:'SOURCE_GAP'};
        if(payload.kind==='incident_active'&&(incident.status!=='active'||at<new Date(incident.activated_at)))
          return {status:'SKIPPED',code:'INCIDENT_ALREADY_CLEARED_OR_TIME_INVALID',origin:'CI_SYNTHETIC_ONLY'};
        if(payload.kind==='incident_recovery'&&(incident.status!=='cleared'||!incident.cleared_at||at<new Date(incident.cleared_at)))
          return {status:'SKIPPED',code:'RECOVERY_PREVIOUS_ACTIVE_SOURCE_GAP',origin:'SOURCE_GAP'};
        return {status:'SKIPPED',code:'INCIDENT_SIGNED_ISSUER_SOURCE_GAP',origin:'SOURCE_GAP'};
      });
    }
    const payloadHash=digest(JSON.stringify({kind:payload.kind,channel,at:at.toISOString(),stage:payload.stage??'default'}));
    const stage=validId(payload.stage)?payload.stage:'default';
    return withDb(async db=>{
      await db.query('BEGIN');
      try {
        await db.query('SELECT pg_advisory_xact_lock(hashtext($1))',[`f07-notify:${payload.event_id}|${stage}|${channel}`]);
        const old=await db.query('SELECT payload_sha256 FROM f07_runtime.notification_events WHERE event_id=$1 FOR UPDATE',[payload.event_id]);
        if(old.rowCount&&old.rows[0].payload_sha256!==payloadHash) throw fail('NOTIFICATION_EVENT_CONFLICT',409,'CI_SYNTHETIC_ONLY');
        const existing=await db.query('SELECT status FROM f07_runtime.notification_outbox WHERE event_id=$1 AND stage=$2 AND channel=$3 FOR UPDATE',
          [payload.event_id,stage,channel]);
        if(existing.rowCount) {await db.query('COMMIT');return {status:'DEDUPED',code:'STAGE_ALREADY_QUEUED',origin:'CI_SYNTHETIC_ONLY'};}
        await db.query(`INSERT INTO f07_runtime.notification_events(event_id,kind,stage,channel,payload_sha256,origin)
          VALUES($1,$2,$3,$4,$5,'CI_SYNTHETIC_ONLY') ON CONFLICT(event_id) DO NOTHING`,[payload.event_id,payload.kind,stage,channel,payloadHash]);
        const safePayload={event:payload.kind,object:'ci-event',employee:'ci-employee',summary:'synthetic local-only'};
        await db.query(`INSERT INTO f07_runtime.notification_outbox(event_id,stage,channel,status,code,payload,origin)
          VALUES($1,$2,$3,'QUEUED_LOCAL_ONLY','ROUTE_SOURCE_GAP',$4::jsonb,'CI_SYNTHETIC_ONLY')`,
          [payload.event_id,stage,channel,JSON.stringify(safePayload)]);
        await audit(db,'notification','outbox_enqueue','ROUTE_SOURCE_GAP','CI_SYNTHETIC_ONLY');
        await db.query('COMMIT');
        return {status:'QUEUED_LOCAL_ONLY',code:'ROUTE_SOURCE_GAP',origin:'CI_SYNTHETIC_ONLY'};
      } catch(error) {await db.query('ROLLBACK').catch(()=>{});throw error;}
    });
  }

  async function handle(req,res) {
    const pathname=(req.url??'/').split('?')[0];
    if(!pathname.startsWith('/__ci__/f07-runtime/')) return false;
    try {
      assertF07RuntimeEnvironment(env);
      const identity=await withDb(async(_db,x)=>x);
      const host=req.headers?.host??'';
      if(!/^127\.0\.0\.1(?::[0-9]{1,5})?$/.test(host))
        return send(res,400,{code:'LOOPBACK_HOST_REQUIRED',origin:'CI_SYNTHETIC_ONLY'});
      const url=new URL(req.url??'/','https://'+host);
      if(req.method==='GET'&&pathname==='/__ci__/f07-runtime/health')
        return send(res,200,{ok:true,pg16:true,superuser:false,database_oid:identity.database_oid,origin:'CI_SYNTHETIC_ONLY',outbound:'DISABLED'});
      if(req.method==='POST'&&pathname==='/__ci__/f07-runtime/phone/callback') {
        const {raw}=await readJson(req);
        const result=await callback(raw,req.headers?.['x-f07-timestamp'],req.headers?.['x-f07-signature']);
        return send(res,200,result);
      }
      if(req.method==='GET'&&pathname==='/__ci__/f07-runtime/phone/latest') {
        const vehicle=url.searchParams.get('vehicle_id');
        if(!VEHICLE_ID.test(vehicle??'')) throw fail('VEHICLE_ID_INVALID',400,'CI_SYNTHETIC_ONLY');
        const result=await sourceGapCheck(auth,req.headers?.['x-f07-test-session'],'vehicle.publisher_phone.read',vehicle);
        await withDb(db=>audit(db,'phone','latest',result.code,result.origin));
        return send(res,403,{code:result.code,origin:result.origin});
      }
      if(req.method==='POST'&&pathname==='/__ci__/f07-runtime/phone/dial') {
        const {value}=await readJson(req);
        if(!VEHICLE_ID.test(value.vehicle_id??'')) throw fail('VEHICLE_ID_INVALID',400,'CI_SYNTHETIC_ONLY');
        const result=await sourceGapCheck(auth,value.session??req.headers?.['x-f07-test-session'],'vehicle.publisher_phone.read',value.vehicle_id);
        await withDb(db=>audit(db,'phone','dial',result.code,result.origin));
        return send(res,403,{code:result.code,origin:result.origin,dialer:'DISABLED'});
      }
      if(req.method==='GET'&&pathname==='/__ci__/f07-runtime/image/url') {
        const relative=safePath(url.searchParams.get('path')??'');
        return send(res,200,{url:publicUrl(relative),origin:'CI_SYNTHETIC_ONLY'});
      }
      if(req.method==='POST'&&pathname==='/__ci__/f07-runtime/image/assetize') {
        const {value}=await readJson(req);
        const result=await assetize(value);
        return send(res,200,result);
      }
      if(req.method==='GET'&&pathname==='/__ci__/f07-runtime/image/cover')
        return send(res,403,{code:'F05_CONVERSION_POSITIVE_SOURCE_GAP',origin:'SOURCE_GAP'});
      if(req.method==='GET'&&pathname==='/__ci__/f07-runtime/image/report-h5')
        return send(res,403,{code:'REPORT_H5_PRIVATE_SOURCE_GAP',origin:'SIGNED_PARENT_NEGATIVE_ONLY'});
      if(req.method==='GET'&&pathname==='/__ci__/f07-runtime/image/read') {
        const imageId=url.searchParams.get('image_id');
        if(!validId(imageId)) throw fail('IMAGE_ID_INVALID',400,'CI_SYNTHETIC_ONLY');
        const q=await withDb(db=>db.query("SELECT * FROM f07_runtime.image_assets WHERE image_id=$1 AND asset_state='success'",[imageId]));
        if(!q.rowCount) throw fail('IMAGE_ASSET_NOT_FOUND',404,'CI_SYNTHETIC_ONLY');
        const row=q.rows[0];
        if(!storage.has(row.object_key)) throw fail('ASSET_MISSING_SINGLE_IMAGE_RECOVERY_REQUIRED',409,'CI_SYNTHETIC_ONLY');
        const bytes=await cdn.get(row.object_key,async()=>storage.get(row.object_key));
        return send(res,200,{image_id:imageId,url:publicUrl(row.relative_path),bytes_sha256:digest(bytes),origin:'CI_SYNTHETIC_ONLY',network:'LOCAL_ADAPTER_ONLY'});
      }
      if(req.method==='GET'&&pathname==='/__ci__/f07-runtime/parent/verify') {
        const result=await sourceGapCheck(auth,req.headers?.['x-f07-test-session'],'vehicle.publisher_phone.read',url.searchParams.get('vehicle_id')||'source-check');
        await withDb(db=>audit(db,'parent','verify',result.code,result.origin));
        return send(res,403,{allowed:false,code:result.code,origin:result.origin,f05Code:result.f05Code});
      }
      if(req.method==='POST'&&pathname==='/__ci__/f07-runtime/notification/incident/activate') {
        const {value}=await readJson(req);return send(res,200,await incidentAction('activate',value));
      }
      if(req.method==='POST'&&pathname==='/__ci__/f07-runtime/notification/incident/clear') {
        const {value}=await readJson(req);return send(res,200,await incidentAction('clear',value));
      }
      if(req.method==='POST'&&pathname==='/__ci__/f07-runtime/notification/dispatch') {
        const {value}=await readJson(req);return send(res,200,await dispatchNotification(value));
      }
      if(req.method==='POST'&&pathname==='/__ci__/f07-runtime/notification/deep-link') {
        const {value}=await readJson(req);
        const result=deepLinkGuard(value.url,{signedParentVerified:false});
        return send(res,403,{status:result.status,code:result.code,origin:'SOURCE_GAP'});
      }
      return send(res,404,{code:'F07_RUNTIME_ROUTE_NOT_FOUND',origin:'CI_SYNTHETIC_ONLY'});
    } catch(error) {
      const code=error?.code||error?.message||'F07_RUNTIME_INTERNAL_DENY';
      const status=Number.isInteger(error?.status)?error.status:
        code==='CALLBACK_SIGNATURE'||code==='CALLBACK_EXPIRED'?400:
        code==='NONCE_REPLAY'||code==='IDEMPOTENCY_CONFLICT'||code==='NOTIFICATION_EVENT_CONFLICT'?409:
        code==='INVALID_CALLBACK'?422:
        code==='UNSAFE_PATH'?400:
        code==='IMAGE_ASSET_NOT_FOUND'?404:500;
      return send(res,status,{code,origin:error?.origin||'CI_SYNTHETIC_ONLY'});
    }
  }

  async function ready() {
    try {await withDb(async db=>{await db.query('SELECT 1 FROM f07_runtime.audit LIMIT 1')});return true;}
    catch{return false;}
  }
  async function resetForTests() {
    await withDb(async db=>{
      await db.query(`TRUNCATE f07_runtime.audit,f07_runtime.callback_receipts,f07_runtime.phone_cache,
        f07_runtime.image_assets,f07_runtime.asset_failures,f07_runtime.notification_events,
        f07_runtime.notification_outbox,f07_runtime.incident_lifecycle RESTART IDENTITY CASCADE`);
    });
    storage.items.clear();storage.writes=0;storage.deletes=0;storage.failNext=false;storage.keyLocks.clear();
    cdn.cache.clear();cdn.hits=0;cdn.misses=0;cdn.originRequests=0;cdn.failPaths.clear();
    testFaults.failNextAssetCommit=false;testFaults.failNextCallbackBeforeCommit=false;
  }
  async function close() {if(ownsPool) await pool.end();}
  return {handler:handle,ready,close,pool,storage,cdn,testFaults,resetForTests,assertPhysicalPg16:()=>withDb(async(_db,x)=>x)};
}
