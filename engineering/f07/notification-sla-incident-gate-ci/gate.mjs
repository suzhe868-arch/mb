// F07-4: 只在一次性非生产 PostgreSQL16 中运行的通知投递合同。
import pg from 'pg';
import {createHash} from 'node:crypto';

export const DSN='postgres://f07_4_ci:f07_4_ci_synthetic_only@127.0.0.1:5432/f07_4_test';
export const SCHEMA='f07_4_ci';
const REF='refs/heads/feat/f07-4-notification-sla-incident-gate-ci';
export const ALLOWLIST=Object.freeze([
 'consultation_created','consultation_sla_timeout','public_pool_first_followup',
 'lock_request_result','waitlist_auto_result','waitlist_released','lock_expiring',
 'supply_anomaly','transaction_changed','refund_changed','incident_active','incident_recovery'
]);
const GROUP=new Set(['consultation_sla_timeout','supply_anomaly','incident_active','incident_recovery']);
const statuses=new Set(['SENT','FAILED','SKIPPED','DEDUPED','NOT_ALLOWLISTED']);
const reason=(status,code,more={})=>Object.freeze({status,code,origin:'CI_SYNTHETIC_ONLY',...more});
export function assertCIEnv(env=process.env) {
 const required={CI:'true',GITHUB_ACTIONS:'true',APP_ENV:'test',NODE_ENV:'test',GITHUB_EVENT_NAME:'push',GITHUB_REPOSITORY:'suzhe868-arch/mb',GITHUB_REF:REF,
  DATABASE_URL:DSN,F07_4_ONLY:'I_AUTHORIZE_F07_4_LOCAL_MOCK_PG16'};
 for(const [key,value] of Object.entries(required))if(env[key]!==value)throw Error('F07_4_ENV_'+key);
 if(!/^[0-9]{6,20}$/.test(env.GITHUB_RUN_ID||''))throw Error('F07_4_ENV_RUN');
}
export const pool=()=>{assertCIEnv();return new pg.Pool({connectionString:DSN,max:8,connectionTimeoutMillis:5000});};
export async function physicalGate(db,env=process.env) {
 assertCIEnv(env);
 const r=await db.query("SELECT current_database() db,current_user usr,current_setting('server_version_num')::int ver,(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) su,(SELECT rolcreatedb FROM pg_roles WHERE rolname=current_user) cdb,(SELECT rolcreaterole FROM pg_roles WHERE rolname=current_user) cr,pg_backend_pid() pid");
 const a=r.rows[0];
 if(!a||a.db!=='f07_4_test'||a.usr!=='f07_4_ci'||a.ver<160000||a.ver>=170000||a.su!==false||a.cdb!==false||a.cr!==false)throw Error('F07_4_PHYSICAL_DENIED');
 return a;
}
export async function bootstrap(db) {
 await physicalGate(db);
 await db.query(`
 CREATE SCHEMA IF NOT EXISTS f07_4_ci;
 CREATE TABLE IF NOT EXISTS f07_4_ci.config (
  id int PRIMARY KEY CHECK(id=1), company_on boolean NOT NULL DEFAULT true,
  group_route text, lock_notice_on boolean NOT NULL DEFAULT false,lock_notice_lead_minutes int, dnd_start text NOT NULL DEFAULT '23:00', dnd_end text NOT NULL DEFAULT '08:30',
  timezone text NOT NULL DEFAULT 'Asia/Shanghai', version int NOT NULL DEFAULT 1,
  CHECK(dnd_start ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),CHECK(dnd_end ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  CHECK(timezone='Asia/Shanghai'),CHECK(lock_notice_lead_minutes IS NULL OR lock_notice_lead_minutes>0));
 CREATE TABLE IF NOT EXISTS f07_4_ci.employee (
  employee_id text PRIMARY KEY,active boolean NOT NULL, eligible boolean NOT NULL, in_scope boolean NOT NULL,
  feishu_id text, personal_on boolean NOT NULL DEFAULT true,sla_group_on boolean NOT NULL DEFAULT true);
 CREATE TABLE IF NOT EXISTS f07_4_ci.event (
  event_id text PRIMARY KEY,kind text NOT NULL,stage text NOT NULL,employee_id text NOT NULL,
  valid boolean NOT NULL DEFAULT true,incident_active boolean NOT NULL DEFAULT false,
  cadence_minutes int,deadline timestamptz,origin text NOT NULL DEFAULT 'CI_SYNTHETIC_ONLY',
  CHECK(cadence_minutes IS NULL OR cadence_minutes>0),CHECK(origin='CI_SYNTHETIC_ONLY'));
 CREATE TABLE IF NOT EXISTS f07_4_ci.claim (
  event_id text NOT NULL,stage text NOT NULL,channel text NOT NULL,
  status text NOT NULL, attempt int NOT NULL DEFAULT 1,sent_at timestamptz,
  PRIMARY KEY(event_id,stage,channel));
 CREATE TABLE IF NOT EXISTS f07_4_ci.mock_outbox (
  event_id text NOT NULL,stage text NOT NULL,channel text NOT NULL,
  recipient text NOT NULL,payload jsonb NOT NULL,created_at timestamptz NOT NULL,
  PRIMARY KEY(event_id,stage,channel));
 CREATE TABLE IF NOT EXISTS f07_4_ci.notification_log (
  id bigserial PRIMARY KEY,event_id text,kind text,stage text,employee_id text,channel text,
  scheduled_at timestamptz,result text NOT NULL,code text NOT NULL,dnd boolean NOT NULL,
  revalidated boolean NOT NULL,sent_at timestamptz,backend_pid int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  CHECK(result IN ('SENT','FAILED','SKIPPED','DEDUPED','NOT_ALLOWLISTED')));
 INSERT INTO f07_4_ci.config(id,group_route) VALUES(1,'ci-group-only') ON CONFLICT(id) DO NOTHING;
 `);
}
export async function reset(db) {
 await physicalGate(db);
 await db.query('TRUNCATE f07_4_ci.mock_outbox,f07_4_ci.claim,f07_4_ci.notification_log,f07_4_ci.event,f07_4_ci.employee RESTART IDENTITY');
 await db.query("UPDATE f07_4_ci.config SET company_on=true,group_route='ci-group-only',lock_notice_on=false,lock_notice_lead_minutes=NULL,dnd_start='23:00',dnd_end='08:30',timezone='Asia/Shanghai',version=version+1 WHERE id=1");
 await db.query("INSERT INTO f07_4_ci.employee(employee_id,active,eligible,in_scope,feishu_id) VALUES ('employee-ci-1',true,true,true,'ci-fs-1')");
}
export async function seed(db,{id='event-ci-1',kind='consultation_created',stage='new',employee='employee-ci-1',valid=true,incidentActive=false,cadence=null,deadline=undefined}={}) {
 await physicalGate(db);
 if(deadline===undefined&&kind==='consultation_sla_timeout')deadline='2026-10-15T00:00:00Z';
 await db.query('INSERT INTO f07_4_ci.event(event_id,kind,stage,employee_id,valid,incident_active,cadence_minutes,deadline) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',[id,kind,stage,employee,valid,incidentActive,cadence,deadline]);
}
export function dndAt(at,start='23:00',end='08:30',zone='Asia/Shanghai') {
 if(zone!=='Asia/Shanghai'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(start)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(end))throw Error('DND_CONFIG_INVALID');
 const d=new Date(at);if(Number.isNaN(d.getTime()))throw Error('BUSINESS_CLOCK_INVALID');
 const parts=new Intl.DateTimeFormat('en-GB',{timeZone:zone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(d);
 const time=parts.find(x=>x.type==='hour').value+':'+parts.find(x=>x.type==='minute').value;
 return start<end?time>=start&&time<end:start>end?(time>=start||time<end):false;
}
function sanitizedPayload(e,employee,now) {
 // 仅模拟非敏感标识，不能将业务输入复制到外部群消息。
 return {event:e.kind,object:'ci-event',employee:'ci-employee',summary:e.kind==='consultation_sla_timeout'?'first-response overdue':'event',scheduled:now.toISOString()};
}
export async function dispatch(db,{eventId,channel='personal',at='2026-10-16T02:00:00Z',simulate='ok'}={}) {
 await physicalGate(db);
 if(!/^[a-z0-9_-]{3,80}$/.test(eventId||'')||!['personal','group'].includes(channel)||!['ok','failure','timeout'].includes(simulate))
  return reason('SKIPPED','INPUT_DENIED');
 const time=new Date(at);if(Number.isNaN(time.getTime()))return reason('SKIPPED','INVALID_TIME');
 const client=await db.connect();
 try {
  await client.query('BEGIN');
  const event=(await client.query('SELECT * FROM f07_4_ci.event WHERE event_id=$1 FOR UPDATE',[eventId])).rows[0];
  const cfg=(await client.query('SELECT * FROM f07_4_ci.config WHERE id=1 FOR SHARE')).rows[0];
  const emp=event?(await client.query('SELECT * FROM f07_4_ci.employee WHERE employee_id=$1 FOR SHARE',[event.employee_id])).rows[0]:null;
  let stage=event?.stage||'unknown';let result;
  const dnd=dndAt(time,cfg.dnd_start,cfg.dnd_end,cfg.timezone);
  if(!event)result=reason('SKIPPED','EVENT_MISSING');
  else if(!ALLOWLIST.includes(event.kind))result=reason('NOT_ALLOWLISTED','PDM23_NOT_ALLOWLISTED');
  else if(event.origin!=='CI_SYNTHETIC_ONLY')result=reason('SKIPPED','NOTIFICATION_SIGNED_ISSUER_SOURCE_GAP');
  else if(!event.valid)result=reason('SKIPPED','EVENT_INVALID');
  else if(event.kind==='incident_active'&&!event.incident_active)result=reason('SKIPPED','INCIDENT_NOT_ACTIVE');
  else if(event.kind==='incident_recovery'&&event.incident_active)result=reason('SKIPPED','RECOVERY_NOT_CONFIRMED');
  else if(event.kind==='incident_active'&&!event.cadence_minutes)result=reason('SKIPPED','INCIDENT_CADENCE_UNCONFIGURED');
  else if(event.kind==='consultation_sla_timeout'&&!event.deadline)result=reason('SKIPPED','SLA_EVENT_SOURCE_GAP');
  else if(event.kind==='lock_expiring'&&(!cfg.lock_notice_on||!cfg.lock_notice_lead_minutes))result=reason('SKIPPED','LOCK_NOTICE_CONFIG_SOURCE_GAP');
  else if(channel==='group'&&!GROUP.has(event.kind))result=reason('SKIPPED','GROUP_EVENT_NOT_ALLOWED');
  else if(!cfg.company_on)result=reason('SKIPPED','COMPANY_FEISHU_DISABLED');
  else if(!emp||!emp.active||!emp.eligible||!emp.in_scope)result=reason('SKIPPED','CURRENT_EMPLOYEE_OR_SCOPE_DENIED');
  else if(channel==='personal'&&(!emp.feishu_id||!emp.personal_on))result=reason('SKIPPED','PERSONAL_ROUTE_DISABLED');
  else if(channel==='group'&&(!cfg.group_route||(event.kind==='consultation_sla_timeout'&&!emp.sla_group_on)))result=reason('SKIPPED','GROUP_ROUTE_DISABLED');
  else if(dnd)result=reason('SKIPPED','DND_DELAY_REVALIDATE');
  else {
   if(event.kind==='incident_active') stage='incident-cadence-'+Math.floor(time.getTime()/(event.cadence_minutes*60000));
   const existing=(await client.query('SELECT * FROM f07_4_ci.claim WHERE event_id=$1 AND stage=$2 AND channel=$3 FOR UPDATE',[eventId,stage,channel])).rows[0];
   if(existing?.status==='SENT')result=reason('DEDUPED','STAGE_ALREADY_SENT');
   else if(event.kind==='incident_active' &&
    (await client.query("SELECT max(sent_at) last_sent FROM f07_4_ci.claim WHERE event_id=$1 AND channel=$2 AND status='SENT'",[eventId,channel])).rows[0].last_sent > new Date(time.getTime()-event.cadence_minutes*60000))
    result=reason('SKIPPED','INCIDENT_CADENCE_NOT_DUE');
   else {
    if(existing)await client.query('UPDATE f07_4_ci.claim SET status=$4,attempt=attempt+1 WHERE event_id=$1 AND stage=$2 AND channel=$3',[eventId,stage,channel,'CLAIMED']);
    else await client.query("INSERT INTO f07_4_ci.claim(event_id,stage,channel,status) VALUES($1,$2,$3,'CLAIMED')",[eventId,stage,channel]);
    if(simulate!=='ok') {
     await client.query("UPDATE f07_4_ci.claim SET status='FAILED' WHERE event_id=$1 AND stage=$2 AND channel=$3",[eventId,stage,channel]);
     result=reason('FAILED',simulate==='timeout'?'MOCK_TIMEOUT':'MOCK_FAILURE');
    } else {
     await client.query('INSERT INTO f07_4_ci.mock_outbox(event_id,stage,channel,recipient,payload,created_at) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING',
      [eventId,stage,channel,channel==='group'?cfg.group_route:emp.feishu_id,sanitizedPayload(event,emp,time),time]);
     await client.query("UPDATE f07_4_ci.claim SET status='SENT',sent_at=$4 WHERE event_id=$1 AND stage=$2 AND channel=$3",[eventId,stage,channel,time]);
     result=reason('SENT','MOCK_LOCAL_ONLY');
    }
   }
  }
  if(!statuses.has(result.status))throw Error('F07_4_RESULT_INVALID');
  const pid=(await client.query('SELECT pg_backend_pid() pid')).rows[0].pid;
  await client.query('INSERT INTO f07_4_ci.notification_log(event_id,kind,stage,employee_id,channel,scheduled_at,result,code,dnd,revalidated,sent_at,backend_pid) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)',
   [eventId,event?.kind||'missing',stage,event?.employee_id||null,channel,time,result.status,result.code,dnd,true,result.status==='SENT'?time:null,pid]);
  await client.query('COMMIT');
  return reason(result.status,result.code,{backendPid:pid,stage});
 } catch(e) {await client.query('ROLLBACK');throw e;} finally {client.release();}
}
export async function parentConfigMutation(_db,_config,_actor) {
 // 未对接真实F03身份+Capability+Scope+Object前不允许生效；Admin身份不自动授权。
 return Object.freeze({allowed:false,code:'NOTIFICATION_CONFIG_SIGNED_PARENT_SOURCE_GAP',origin:'SIGNED_PARENT_NEGATIVE_ONLY'});
}
export function deepLinkGuard(url,context={}) {
 // 即使URL本身合法，也不能将URL当作权限票据。
 try {
  if(typeof url!=='string'||url.length>512||/%2f|%5c|%2e|%00|\\|\.\.|@|#|\/\//i.test(url))return reason('SKIPPED','LINK_ENCODING_OR_PATH_DENIED');
  const u=new URL(url,'https://app.mingbang.invalid');
  if(u.origin!=='https://app.mingbang.invalid'||!/^\/(E01|E06|E07|PC)\/[a-z0-9_-]{1,64}$/.test(u.pathname)||u.searchParams.size>0)return reason('SKIPPED','LINK_HOST_OR_ROUTE_DENIED');
  if(!context?.signedParentVerified)return reason('SKIPPED','LINK_CURRENT_SESSION_SCOPE_OBJECT_SOURCE_GAP');
  // 缺真实F03 signed issuer时宁可拒绝，不信任调用方合成的boolean。
  return reason('SKIPPED','LINK_CURRENT_SESSION_SCOPE_OBJECT_SOURCE_GAP');
 } catch {return reason('SKIPPED','LINK_INVALID');}
}
export function checksum(value){return createHash('sha256').update(JSON.stringify(value)).digest('hex');}
