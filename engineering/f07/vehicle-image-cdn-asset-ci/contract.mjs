// F07-2: synthetic, isolated PG16 + in-process TEST_IMAGE mock only. NOT a production adapter.
import {readFile} from 'node:fs/promises';
import {Pool} from 'pg';
const branch='refs/heads/feat/f07-2-vehicle-image-cdn-asset-contract-ci';
export const DSN='postgres://f07_image_ci:f07_image_ci_password@127.0.0.1:5432/f07_image_ci_db';
export const pool=new Pool({connectionString:process.env.DATABASE_URL,max:8});
export const denied=(code='DENIED')=>Object.assign(new Error(code),{code});
const ID=/^[a-zA-Z0-9_-]{1,80}$/;
const requireId=x=>{if(typeof x!=='string'||!ID.test(x))throw denied('BAD_ID');return x;};
export function assertCIEnv(e=process.env){
 const expected={CI:'true',GITHUB_ACTIONS:'true',APP_ENV:'test',NODE_ENV:'test',
  GITHUB_EVENT_NAME:'push',GITHUB_REPOSITORY:'suzhe868-arch/mb',GITHUB_REF:branch,
  DATABASE_URL:DSN};
 for(const [k,v] of Object.entries(expected))if(e[k]!==v)throw denied('F07_2_CI_ENV_'+k);
 if(!/^[0-9]{6,20}$/.test(e.GITHUB_RUN_ID??''))throw denied('F07_2_CI_RUN_ID');
}
export async function physicalGate(db,e=process.env){
 assertCIEnv(e);
 const q=await db.query("SELECT current_database() db,current_user usr,current_setting('server_version_num')::int ver,(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) su,(SELECT rolcreatedb FROM pg_roles WHERE rolname=current_user) cdb,(SELECT rolcreaterole FROM pg_roles WHERE rolname=current_user) cr, pg_backend_pid() pid");
 const x=q.rows[0];
 if(!x||x.db!=='f07_image_ci_db'||x.usr!=='f07_image_ci'||x.ver<160000||x.ver>=170000||x.su!==false||x.cdb!==false||x.cr!==false)throw denied('F07_2_PHYSICAL_PG16_DENY');
 return x;
}
export async function guarded(fn){
 assertCIEnv();
 const db=await pool.connect();
 try {await physicalGate(db);return await fn(db);}
 finally{db.release();}
}
export async function tx(fn){
 return guarded(async db=>{
  await db.query('BEGIN');
  try{const out=await fn(db);await db.query('COMMIT');return out;}
  catch(e){await db.query('ROLLBACK');throw e;}
 });
}
export async function bootstrap(){return guarded(async db=>db.query(await readFile(new URL('./schema.sql',import.meta.url),'utf8')));}
export async function reset(){return guarded(async db=>db.query('TRUNCATE f07_images.audit,f07_images.pictures,f07_images.sessions,f07_images.vehicles RESTART IDENTITY CASCADE'));}
export async function seed(){
 return guarded(async db=>{
  await db.query("INSERT INTO f07_images.vehicles(id,source_type,listing_cycle,visible,priority_actor,assigned_sales) VALUES ('v1','wholesale','cycle-1',true,NULL,'sale'),('v2','wholesale','cycle-2',true,NULL,'sale'),('vh','wholesale','cycle-hidden',false,'owner','sale'),('vm','mingbang','cycle-manual',true,NULL,'sale')");
  await db.query("INSERT INTO f07_images.sessions(token,actor_id,actor_kind,scope_vehicle) VALUES ('s-owner','owner','customer','vh'),('s-user','user','customer','v1'),('s-sale','sale','employee','vh'),('s-v2','user','customer','v2'),('s-manual','user','customer','vm'),('s-outsider','other','customer','v2')");
  const inserts=[
   ['p1','v1','vehicle_photo','JYT','photo/1.jpg',0,true],
   ['p2','v1','vehicle_photo','JYT','photo/2.jpg',1,true],
   ['p3','v1','vehicle_photo','JYT','photo/3.jpg',2,true],
   ['p4','v1','vehicle_photo','JYT','photo/4.jpg',3,true],
   ['p5','v1','vehicle_photo','JYT','photo/5.jpg',4,true],
   ['p6','v1','vehicle_photo','JYT','photo/6.jpg',5,true],
   ['ph','vh','vehicle_photo','JYT','photo/hidden.jpg',0,true],
   ['pm','vm','vehicle_photo','MB','own/manual.jpg',0,true],
   ['r1','v1','accident_report','JYT','report/accident.jpg',0,true],
   ['r2','v1','maintenance_image','JYT','report/maintenance.jpg',0,false],
   ['h5','v1','maintenance_h5','JYT','report/maintenance.html',0,true],
   ['doc','v1','sensitive_document','MB','private/registration.jpg',0,false]];
  for(const [id,vehicle,kind,source,path,order,visible] of inserts)
   await db.query("INSERT INTO f07_images.pictures(id,vehicle_id,resource_type,source_platform,upstream_image_id,relative_path,immutable_order,customer_visible,origin_source_type) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)",
    [id,vehicle,kind,source,'TEST_'+id,path,order,visible,vehicle==='vm'?'mingbang':'wholesale']);
  await db.query("UPDATE f07_images.pictures SET report_source_url='https://reports.jyt.invalid/report/maintenance.html#page1' WHERE id='h5'");
 });
}
export function safePath(input){
 if(typeof input!=='string'||!input||input.length>500||input.normalize('NFKC')!==input)throw denied('UNSAFE_PATH');
 if(/[%?#@\\\u0000-\u001f\u007f]/.test(input)||input[0]==='/'||input.includes('//')||input.includes('://'))throw denied('UNSAFE_PATH');
 const parts=input.split('/');
 if(parts.some(x=>!x||x==='.'||x==='..'||! /^[A-Za-z0-9_.-]+$/.test(x)))throw denied('UNSAFE_PATH');
 return parts.map(encodeURIComponent).join('/');
}
export const config=Object.freeze({image:'https://img.mingbang.invalid',report:'https://report.mingbang.invalid'});
export function publicUrl(relative,kind='vehicle_photo'){
 const path=safePath(relative);
 return (kind==='vehicle_photo'?config.image+'/c/':config.report+'/r/')+path;
}
export function reportH5(source){
 if(typeof source!=='string'||source.length>1000||/[\\\u0000-\u001f]/.test(source)||/(?:^|\/)\.\.?(?:\/|$)|%2e|%2f|%5c|%25/i.test(source))throw denied('UNSAFE_REPORT');
 let u;
 try{u=new URL(source);}catch{throw denied('UNSAFE_REPORT');}
 if(u.protocol!=='https:'||u.username||u.password||u.port||u.hostname!=='reports.jyt.invalid')throw denied('UNSAFE_REPORT');
 if(u.search||/%25|%2f|%5c|%2e/i.test(u.pathname))throw denied('UNSAFE_REPORT');
 const path=safePath(decodeURIComponent(u.pathname.slice(1)));
 if(u.hash&&!/^#[A-Za-z0-9._-]*$/.test(u.hash))throw denied('UNSAFE_REPORT');
 return config.report+'/h5/'+path+u.hash;
}
export function prefetch(imageIds,currentIndex=0,concurrency=4){
 if(!Array.isArray(imageIds)||!Number.isSafeInteger(currentIndex)||concurrency<1||!Number.isSafeInteger(concurrency))throw denied('BAD_PREFETCH');
 const first=imageIds.slice(1,5),tail=currentIndex>=2?imageIds.slice(5):[];
 return {first,tail,concurrency};
}
export class MockStorage{
 constructor(){this.items=new Map();this.writes=0;this.deletes=0;this.failNext=false;this.keyLocks=new Map();}
 async withKeyLock(key,fn){
  const prior=this.keyLocks.get(key)??Promise.resolve();
  let done;const mine=new Promise(resolve=>{done=resolve;});
  this.keyLocks.set(key,mine);
  await prior;
  try{return await fn();}
  finally{if(this.keyLocks.get(key)===mine)this.keyLocks.delete(key);done();}
 }
 async put(key,bytes){if(this.failNext){this.failNext=false;throw denied('MOCK_OBJECT_WRITE_FAIL');}this.items.set(key,Buffer.from(bytes));this.writes++;}
 async del(key){this.items.delete(key);this.deletes++;}
 get(key){return this.items.get(key);}
 has(key){return this.items.has(key);}
}
export class MockCDN{
 constructor(){this.cache=new Map();this.hits=0;this.misses=0;this.originRequests=0;this.failPaths=new Set();}
 async get(key,fetchLocal){
  if(this.cache.has(key)){this.hits++;return this.cache.get(key);}
  this.misses++;this.originRequests++;
  if(this.failPaths.has(key))throw denied('MOCK_SINGLE_IMAGE_FAILURE');
  const b=await fetchLocal();
  if(!b||!Buffer.isBuffer(b)||!b.toString().startsWith('TEST_IMAGE:'))throw denied('TEST_ORIGIN_UNAVAILABLE');
  this.cache.set(key,b);return b;
 }
}
export const testOrigin=async path=>Buffer.from('TEST_IMAGE:'+safePath(path));
export async function freezeImages(vehicle,images){
 requireId(vehicle);
 if(!Array.isArray(images))throw denied('BAD_IMAGES');
 return tx(async db=>{
  const v=await db.query('SELECT source_type,image_frozen FROM f07_images.vehicles WHERE id=$1 FOR UPDATE',[vehicle]);
  if(v.rowCount!==1||v.rows[0].source_type!=='wholesale')throw denied('NOT_WHOLESALE');
  if(v.rows[0].image_frozen)return {frozen:true,inserted:0};
  const c=await db.query("SELECT count(*)::int n FROM f07_images.pictures WHERE vehicle_id=$1 AND resource_type='vehicle_photo'",[vehicle]);
  if(c.rows[0].n>0){await db.query('UPDATE f07_images.vehicles SET image_frozen=true WHERE id=$1',[vehicle]);return {frozen:true,inserted:0};}
  for(let i=0;i<images.length;i++){
   const x=images[i];safePath(x.path);requireId(x.id);
   await db.query("INSERT INTO f07_images.pictures(id,vehicle_id,resource_type,source_platform,upstream_image_id,relative_path,immutable_order,customer_visible,origin_source_type) VALUES($1,$2,'vehicle_photo',$3,$4,$5,$6,true,'wholesale')",[x.id,vehicle,'JYT',x.upstream_id??null,x.path,i]);
  }
  await db.query('UPDATE f07_images.vehicles SET image_frozen=true WHERE id=$1',[vehicle]);
  return {frozen:true,inserted:images.length};
 });
}
export async function convert(vehicle){
 requireId(vehicle);
 return tx(async db=>{
  const v=await db.query("UPDATE f07_images.vehicles SET source_type='mingbang' WHERE id=$1 AND source_type='wholesale' RETURNING id,listing_cycle,business_marker",[vehicle]);
  if(v.rowCount!==1)throw denied('INVALID_CONVERSION');
  return v.rows[0];
 });
}
export async function assetize(id,store,{failDb=false,interrupt=false}={}){
 requireId(id);
 if(!(store instanceof MockStorage))throw denied('MOCK_STORAGE_ONLY');
 const key='TEST_ASSET/'+id;
 return store.withKeyLock(key,async()=>{
 let created=false;
 try{
  return await tx(async db=>{
   const q=await db.query("SELECT p.*,v.source_type FROM f07_images.pictures p JOIN f07_images.vehicles v ON v.id=p.vehicle_id WHERE p.id=$1 FOR UPDATE OF p",[id]);
   if(q.rowCount!==1)throw denied('PICTURE_NOT_FOUND');
   const p=q.rows[0];
   if(p.source_type!=='mingbang'||p.resource_type!=='vehicle_photo')throw denied('NOT_CONVERTED_PHOTO');
   if(p.asset_state==='success'){
    if(!store.has(p.object_key))throw denied('ASSET_MISSING_SINGLE_IMAGE_RECOVERY_REQUIRED');
    return {status:'success',reused:true,key:p.object_key};
   }
   await db.query("UPDATE f07_images.pictures SET asset_state='processing' WHERE id=$1",[id]);
   await store.put(key,await testOrigin(p.relative_path));created=true;
   if(interrupt)throw denied('MOCK_INTERRUPTED');
   if(failDb)await db.query("UPDATE f07_images.pictures SET asset_state='success',object_key=NULL WHERE id=$1",[id]);
   else await db.query("UPDATE f07_images.pictures SET asset_state='success',object_key=$2 WHERE id=$1",[id,key]);
   await db.query("INSERT INTO f07_images.audit(picture_id,action,detail) VALUES($1,'ASSET_COMMIT','TEST_DOUBLE_SUCCESS')",[id]);
   return {status:'success',reused:false,key};
  });
 }catch(e){
  if(created){await store.del(key);}
  if(e.code==='NOT_CONVERTED_PHOTO'||e.code==='PICTURE_NOT_FOUND'||e.code==='ASSET_MISSING_SINGLE_IMAGE_RECOVERY_REQUIRED')throw e;
  await tx(db=>db.query("UPDATE f07_images.pictures SET asset_state='failed',object_key=NULL WHERE id=$1 AND asset_state<>'success'",[id]));
  await tx(db=>db.query("INSERT INTO f07_images.audit(picture_id,action,detail) VALUES($1,'ASSET_FAILED',$2)",[id,e.code??e.message]));
  throw e;
 }
 });
}
export async function taskStatus(vehicle){
 const q=await guarded(db=>db.query("SELECT asset_state, count(*)::int n FROM f07_images.pictures WHERE vehicle_id=$1 AND resource_type='vehicle_photo' GROUP BY asset_state",[vehicle]));
 const counts=Object.fromEntries(q.rows.map(x=>[x.asset_state,x.n]));
 const total=Object.values(counts).reduce((a,b)=>a+b,0);
 if(!total)return 'success';
 if(counts.success===total)return 'success';
 if(counts.success>0&&counts.failed>0)return 'partial_failed';
 if(counts.failed>0&&!counts.success&& !counts.processing)return 'failed';
 return 'processing';
}
export async function getReadable(token,id,kind='vehicle_photo'){
 requireId(token);requireId(id);
 return guarded(async db=>{
  const q=await db.query("SELECT p.*,v.visible,v.priority_actor,v.assigned_sales,v.source_type,s.actor_id,s.actor_kind FROM f07_images.pictures p JOIN f07_images.vehicles v ON v.id=p.vehicle_id JOIN f07_images.sessions s ON s.scope_vehicle=v.id AND s.token=$1 AND s.active AND NOT s.denied WHERE p.id=$2 AND p.resource_type=$3 AND ((v.priority_actor IS NOT NULL AND (s.actor_id=v.priority_actor OR (s.actor_kind='employee' AND s.actor_id=v.assigned_sales))) OR (v.priority_actor IS NULL AND v.visible))",[token,id,kind]);
  if(q.rowCount!==1)throw denied('CURRENT_VEHICLE_READ_DENY');
  const p=q.rows[0];
  if(p.actor_kind==='customer'&&(p.resource_type==='sensitive_document'||(p.resource_type!=='vehicle_photo'&&!p.customer_visible)))throw denied('CURRENT_REPORT_DENY');
  if(p.resource_type==='sensitive_document')throw denied('SENSITIVE_ORIGINAL_DENY');
  return p;
 });
}
export async function imageBytes(token,id,store,cdn,kind='vehicle_photo'){
 const p=await getReadable(token,id,kind);
 if(p.resource_type==='maintenance_h5')throw denied('USE_REPORT_H5_GATE');
 if(p.asset_state==='success'){
  const data=store.get(p.object_key);
  if(!data)throw denied('ASSET_MISSING_SINGLE_IMAGE_RECOVERY_REQUIRED');
  return {bytes:data,origin:'OBJECT',url:publicUrl(p.relative_path,kind)};
 }
 if((p.source_type==='wholesale'||p.source_type==='mingbang')&&p.source_platform==='JYT'){
  const url=publicUrl(p.relative_path,kind);
  return {bytes:await cdn.get(url,()=>testOrigin(p.relative_path)),origin:'CONTROLLED_CDN',url};
 }
 throw denied('UNAVAILABLE_ASSET');
}
export function shareCard(model,imageUrl){
 return {model:String(model).slice(0,100),image:imageUrl??'TEST_PLACEHOLDER',cta:'查看车辆'};
}


// Read-gate precedes cover fallback so a zero-image/failed-image placeholder cannot leak existence.
export async function vehicleRead(token,vehicle){
 requireId(token);requireId(vehicle);
 return guarded(async db=>{
  const r=await db.query("SELECT v.id FROM f07_images.vehicles v JOIN f07_images.sessions s ON s.token=$1 AND s.scope_vehicle=v.id AND s.active AND NOT s.denied WHERE v.id=$2 AND ((v.priority_actor IS NOT NULL AND (s.actor_id=v.priority_actor OR (s.actor_kind='employee' AND s.actor_id=v.assigned_sales))) OR (v.priority_actor IS NULL AND v.visible))",[token,vehicle]);
  if(r.rowCount!==1)throw denied('CURRENT_VEHICLE_READ_DENY');
  return true;
 });
}
export async function selectCover(token,vehicle,store,cdn){
 await vehicleRead(token,vehicle);
 const r=await guarded(db=>db.query("SELECT id FROM f07_images.pictures WHERE vehicle_id=$1 AND resource_type='vehicle_photo' ORDER BY immutable_order,id",[vehicle]));
 for(const p of r.rows){
  try{const x=await imageBytes(token,p.id,store,cdn);return {imageId:p.id,url:x.url,placeholder:false};}
  catch(e){if(!['MOCK_SINGLE_IMAGE_FAILURE','TEST_ORIGIN_UNAVAILABLE','ASSET_MISSING_SINGLE_IMAGE_RECOVERY_REQUIRED','UNAVAILABLE_ASSET'].includes(e.code))throw e;}
 }
 await vehicleRead(token,vehicle); // Recheck after asynchronous fallback in case permission revoked mid-selection.
 return {imageId:null,url:'TEST_PLACEHOLDER',placeholder:true};
}
export async function uploadManual(vehicle,{id,path,order=0},store,{failDb=false}={}){
 requireId(vehicle);requireId(id);safePath(path);
 if(!(store instanceof MockStorage))throw denied('MOCK_STORAGE_ONLY');
 if(!Number.isSafeInteger(order)||order<0)throw denied('INVALID_ORDER');
 const key='TEST_ASSET/MANUAL/'+id;
 return store.withKeyLock(key,async()=>{
 let stored=false;
 try{
  return await tx(async db=>{
   const v=await db.query("SELECT source_type FROM f07_images.vehicles WHERE id=$1 FOR UPDATE",[vehicle]);
   if(v.rowCount!==1||!['mingbang','four_s'].includes(v.rows[0].source_type))throw denied('MANUAL_NOT_ALLOWED');
   await store.put(key,await testOrigin(path));stored=true;
   await db.query("INSERT INTO f07_images.pictures(id,vehicle_id,resource_type,source_platform,upstream_image_id,relative_path,immutable_order,object_key,asset_state,customer_visible,origin_source_type) VALUES($1,$2,'vehicle_photo','MB',NULL,$3,$4,$5,'success',true,$6)",[id,vehicle,path,order,failDb?null:key,v.rows[0].source_type]);
   return {status:'success',key};
  });
 }catch(e){
  if(stored)await store.del(key);
  throw e;
 }
 });
}


// Recovery for a mock process loss after object PUT but before durable DB reference.
// Only synthetic keys are enumerated; this has no access to production object storage.
export async function reconcileOrphans(store){
 if(!(store instanceof MockStorage))throw denied('MOCK_STORAGE_ONLY');
 const deleted=[];
 for(const key of Array.from(store.items.keys())){
  if(!/^TEST_ASSET\/(?:MANUAL\/)?[A-Za-z0-9_-]{1,80}$/.test(key))continue;
  const removed=await store.withKeyLock(key,async()=>tx(async db=>{
   const q=await db.query("SELECT id FROM f07_images.pictures WHERE object_key=$1 AND asset_state='success' FOR UPDATE",[key]);
   if(q.rowCount>0)return false;
   if(!store.has(key))return false;
   await store.del(key);
   const id=key.slice(key.lastIndexOf('/')+1);
   await db.query("INSERT INTO f07_images.audit(picture_id,action,detail) VALUES($1,'ORPHAN_CLEANUP','TEST_CRASH_RECONCILE')",[id]);
   return true;
  }));
  if(removed)deleted.push(key);
 }
 return deleted;
}
