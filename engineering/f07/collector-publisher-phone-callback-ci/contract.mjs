// F07-1 synthetic only: no real Collector/JYT connection; no production route registration.
import {createHmac, createHash, timingSafeEqual, randomUUID} from 'node:crypto';
import {Pool} from 'pg';
import {authorize as signedF03Authorize} from '../../f03/policy.mjs';
const SECRET = process.env.F07_COLLECTOR_TEST_SECRET;
if (!SECRET || SECRET.length < 32) throw new Error('F07_TEST_SECRET_REQUIRED');
export const pool = new Pool({connectionString: process.env.DATABASE_URL, max: 8});
const digest = data => createHash('sha256').update(data).digest('hex');
const deny = (code='DENIED') => Object.assign(new Error(code),{code});
const PHONE=/^TEST-[0-9]{6}$/;
const ID=/^[a-zA-Z0-9_-]{1,80}$/;
const exact = (o,keys) => o && typeof o==='object' && !Array.isArray(o) &&
  Object.keys(o).sort().join('|') === keys.slice().sort().join('|');
const transaction=async fn=>{
  const db=await pool.connect();
  try {await db.query('BEGIN');const out=await fn(db);await db.query('COMMIT');return out;}
  catch(e){await db.query('ROLLBACK');throw e;} finally{db.release();}
};
export function sign(body,ts) {return createHmac('sha256',SECRET).update(String(ts)+'.'+body).digest('hex');}
export function validateSignature(raw,ts,sig){
 if(typeof ts!=='string'||!/^[0-9]{13}$/.test(ts)||Math.abs(Date.now()-Number(ts))>300000)throw deny('CALLBACK_EXPIRED');
 if(typeof sig!=='string'||!/^[a-f0-9]{64}$/.test(sig))throw deny('CALLBACK_SIGNATURE');
 if(!timingSafeEqual(Buffer.from(sig,'hex'),Buffer.from(sign(raw,ts),'hex')))throw deny('CALLBACK_SIGNATURE');
}
export async function bootstrap(){
 const {readFile}=await import('node:fs/promises');
 await pool.query(await readFile(new URL('./schema.sql',import.meta.url),'utf8'));
}
export async function reset(){
 await pool.query('TRUNCATE f07_phone.receipts,f07_phone.audit,f07_phone.phone_history,f07_phone.jobs,f07_phone.cache,f07_phone.publishers,f07_phone.vehicle_scope,f07_phone.sessions,f07_phone.vehicles,f07_phone.employees RESTART IDENTITY CASCADE');
}
export async function seed(){
 await pool.query(`INSERT INTO f07_phone.employees VALUES
 ('sale',true,'sales',1,true,false),
 ('denied',true,'sales',1,true,true),
 ('no_cap',true,'sales',1,false,false),
 ('four_s',true,'four_s',1,true,false),
 ('admin',true,'system_admin',1,true,false),
 ('inactive',false,'sales',1,true,false)`);
 await pool.query(`INSERT INTO f07_phone.sessions VALUES
 ('s-sale','sale',1,true),('s-denied','denied',1,true),
 ('s-no_cap','no_cap',1,true),('s-four_s','four_s',1,true),
 ('s-admin','admin',1,true),('s-inactive','inactive',1,true),
 ('s-stale','sale',0,true)`);
 await pool.query(`INSERT INTO f07_phone.vehicles VALUES
 ('v1','JYT','pub1','wholesale','visible',true),
 ('v2','JYT','pub1','wholesale','visible',true),
 ('v3','JYT','pub2','wholesale','hidden',true),
 ('own','JYT','pub1','mingbang','visible',true),
 ('four','JYT','pub1','four_s','visible',true),
 ('notlisted','JYT','pub1','wholesale','visible',false),
 ('nopublisher','JYT',NULL,'wholesale','visible',true),
 ('other','OTHER','pub1','wholesale','visible',true)`);
 await pool.query(`INSERT INTO f07_phone.vehicle_scope(employee_id,vehicle_id)
 SELECT 'sale',id FROM f07_phone.vehicles WHERE id != 'other'`);
 await pool.query(`INSERT INTO f07_phone.vehicle_scope(employee_id,vehicle_id)
 SELECT id,'v1' FROM f07_phone.employees WHERE id!='sale'`);
}
export async function employeePhone({session,vehicle,action}){
 if(!['read','latest','dial'].includes(action)||!ID.test(session??'')||!ID.test(vehicle??''))throw deny();
 return transaction(async db=>{
  const g=await db.query(`SELECT e.id employee_id,e.role,e.phone_capability,e.personal_deny,v.id vehicle_id,v.state vehicle_state,v.source_type,v.source_platform,v.publisher_id
   FROM f07_phone.sessions s JOIN f07_phone.employees e ON e.id=s.employee_id
   JOIN f07_phone.vehicles v ON v.id=$2
   JOIN f07_phone.vehicle_scope q ON q.employee_id=e.id AND q.vehicle_id=v.id
   WHERE s.id=$1 AND s.active AND s.version=e.session_version AND e.active
   AND e.role IN ('sales','manager','store_manager')
   AND e.phone_capability AND NOT e.personal_deny AND q.active
   AND v.source_type='wholesale' AND v.state IN ('visible','hidden')
   AND v.listing_active AND v.publisher_id IS NOT NULL
   FOR SHARE OF s,e,v,q`,[session,vehicle]);
  if(g.rowCount!==1)throw deny('CURRENT_PERMISSION_DENIED');
  const {employee_id,source_platform,publisher_id,role,phone_capability,personal_deny,vehicle_id,vehicle_state,source_type}=g.rows[0];
  const signedDecision=signedF03Authorize('vehicle.publisher_phone.'+action,{
    actor:{id:employee_id,kind:'employee',role,status:'active'},
    facts:{roleDefaults:phone_capability?['publisher.phone.sensitive']:[],
      personalDecisions:personal_deny?{'publisher.phone.sensitive':'deny'}:{},
      hardDenies:[],scopeGrants:[{actorId:employee_id,resourceKind:'vehicle',resourceId:vehicle_id,
      capability:'publisher.phone.sensitive',active:true,relation:'global'}]},
    resource:{kind:'vehicle',id:vehicle_id,state:vehicle_state,sourceType:source_type,upstreamPublisherId:publisher_id}
  });
  if(!signedDecision.allowed)throw deny('SIGNED_F03_POLICY_DENIED');
  await db.query(`INSERT INTO f07_phone.publishers VALUES($1,$2) ON CONFLICT DO NOTHING`,[source_platform,publisher_id]);
  await db.query(`SELECT 1 FROM f07_phone.publishers WHERE source_platform=$1 AND publisher_id=$2 FOR UPDATE`,[source_platform,publisher_id]);
  const cached=await db.query(`SELECT phone,issued_at FROM f07_phone.cache WHERE source_platform=$1 AND publisher_id=$2`,[source_platform,publisher_id]);
  let job=null;
  if(action==='latest'||cached.rowCount===0){
   const pending=await db.query(`SELECT request_id FROM f07_phone.jobs WHERE source_platform=$1 AND publisher_id=$2 AND status='pending'`,[source_platform,publisher_id]);
   if(pending.rowCount)job={request_id:pending.rows[0].request_id,created:false};
   else {
    const request_id=randomUUID();
    await db.query(`INSERT INTO f07_phone.jobs(request_id,source_platform,publisher_id,mode,status) VALUES($1,$2,$3,$4,'pending')`,[request_id,source_platform,publisher_id,action==='latest'?'latest':'miss']);
    job={request_id,created:true};
   }
  }
  await db.query(`INSERT INTO f07_phone.audit(event,actor_id,source_platform,publisher_id,request_id,outcome) VALUES($1,$2,$3,$4,$5,'allowed')`,[action,employee_id,source_platform,publisher_id,job?.request_id??null]);
  return {status:cached.rowCount?'CACHED':'PHONE_UNAVAILABLE',phone:cached.rows[0]?.phone??null,
   queued:!!job,created:job?.created??false,request_id:job?.request_id??null,
   dialer:action==='dial'&&cached.rowCount?'SYSTEM_ONLY':null};
 });
}
export async function collectorCallback(raw,ts,sig){
 validateSignature(raw,ts,sig);
 let p;try{p=JSON.parse(raw);}catch{throw deny('INVALID_JSON');}
 if(!exact(p,['source_platform','upstream_publisher_id','request_id','nonce','issued_at','status','phone'])
 ||![p.source_platform,p.upstream_publisher_id,p.request_id,p.nonce].every(s=>typeof s==='string'&&ID.test(s))
 || !['ok','unavailable'].includes(p.status)
 || typeof p.issued_at!=='string'||Number.isNaN(Date.parse(p.issued_at))
 ||(p.status==='ok'?!PHONE.test(p.phone):p.phone!==null))throw deny('INVALID_CALLBACK');
 const hash=digest(raw);
 return transaction(async db=>{
  const previous=await db.query('SELECT digest FROM f07_phone.receipts WHERE request_id=$1',[p.request_id]);
  if(previous.rowCount){
   if(previous.rows[0].digest!==hash)throw deny('IDEMPOTENCY_CONFLICT');
   return {status:'DUPLICATE'};
  }
  const nonce=await db.query('SELECT 1 FROM f07_phone.receipts WHERE nonce=$1',[p.nonce]);
  if(nonce.rowCount)throw deny('NONCE_REPLAY');
  const j=await db.query(`SELECT * FROM f07_phone.jobs WHERE request_id=$1 FOR UPDATE`,[p.request_id]);
  // 两Backend同时同request_id回传：第二个等待行锁后必须重查已提交receipt。
  if(j.rowCount===1&&j.rows[0].status==='done'){
   const committed=await db.query('SELECT digest FROM f07_phone.receipts WHERE request_id=$1',[p.request_id]);
   if(committed.rowCount&&committed.rows[0].digest===hash)return {status:'DUPLICATE'};
   throw deny('IDEMPOTENCY_CONFLICT');
  }
  if(j.rowCount!==1||j.rows[0].status!=='pending'
   ||j.rows[0].source_platform!==p.source_platform||j.rows[0].publisher_id!==p.upstream_publisher_id)
   throw deny('REQUEST_PUBLISHER_MISMATCH');
  await db.query(`SELECT 1 FROM f07_phone.publishers WHERE source_platform=$1 AND publisher_id=$2 FOR UPDATE`,[p.source_platform,p.upstream_publisher_id]);
  // Lock issuer and prevent a concurrently superseded callback from replacing newer data.
  const current=await db.query(`SELECT issued_at FROM f07_phone.cache WHERE source_platform=$1 AND publisher_id=$2 FOR UPDATE`,[p.source_platform,p.upstream_publisher_id]);
  const newer=!current.rowCount||Date.parse(p.issued_at)>Date.parse(current.rows[0].issued_at);
  const state=p.status==='unavailable'?'UNAVAILABLE':newer?'UPDATED':'STALE';
  if(p.status==='ok'&&newer){
   await db.query(`INSERT INTO f07_phone.cache VALUES($1,$2,$3,$4,$5)
    ON CONFLICT(source_platform,publisher_id) DO UPDATE SET phone=EXCLUDED.phone,issued_at=EXCLUDED.issued_at,request_id=EXCLUDED.request_id`,
    [p.source_platform,p.upstream_publisher_id,p.phone,p.issued_at,p.request_id]);
   await db.query(`INSERT INTO f07_phone.phone_history(source_platform,publisher_id,phone,issued_at,request_id)
    VALUES($1,$2,$3,$4,$5)`,[p.source_platform,p.upstream_publisher_id,p.phone,p.issued_at,p.request_id]);
  }
  await db.query(`UPDATE f07_phone.jobs SET status='done' WHERE request_id=$1`,[p.request_id]);
  await db.query(`INSERT INTO f07_phone.receipts VALUES($1,$2,$3,$4,$5,$6,clock_timestamp())`,
    [p.request_id,p.nonce,hash,p.source_platform,p.upstream_publisher_id,state]);
  await db.query(`INSERT INTO f07_phone.audit(event,source_platform,publisher_id,request_id,outcome)
   VALUES('collector_callback',$1,$2,$3,$4)`,[p.source_platform,p.upstream_publisher_id,p.request_id,state]);
  return {status:state};
 });
}
export function callbackBody(request_id,extras={}){
 return JSON.stringify({source_platform:'JYT',upstream_publisher_id:'pub1',
  request_id,nonce:randomUUID(),issued_at:new Date().toISOString(),
  status:'ok',phone:'TEST-123456',...extras});
}
