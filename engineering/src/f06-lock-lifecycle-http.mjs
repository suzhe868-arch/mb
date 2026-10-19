const send=(res,status,code,extra={})=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify({code,...extra}))};
const localhost=a=>['127.0.0.1','::1','::ffff:127.0.0.1'].includes(a);
const positiveId=v=>typeof v==='string'&&/^[1-9][0-9]{0,18}$/.test(v)&&BigInt(v)<=9223372036854775807n;
const validKey=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{24,64}$/.test(v);
const validReason=v=>typeof v==='string'&&v.trim().length>=1&&v.trim().length<=240;
const validIso=v=>{if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(v))return false;try{return new Date(v).toISOString()===v}catch{return false}};
async function parseBody(req){
 if(req.headers['content-type']!=='application/json')return {error:'INVALID_CONTENT_TYPE'};
 if(req.headers['transfer-encoding'])return {error:'UNTRUSTED_TRANSFER_ENCODING'};
 const length=req.headers['content-length'];if(!/^[1-9][0-9]{0,3}$/.test(length||'')||Number(length)>4096)return {error:'INVALID_CONTENT_LENGTH'};
 let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>4096)return {error:'BODY_TOO_LARGE'};chunks.push(chunk)}
 if(size!==Number(length))return {error:'CONTENT_LENGTH_MISMATCH'};
 try{return {value:JSON.parse(Buffer.concat(chunks).toString('utf8'))}}catch{return {error:'INVALID_JSON'}}
}
export function createIsolatedF06LockLifecycleHandler({service,env=process.env}={}){
 if(env.APP_ENV!=='test'||env.NODE_ENV!=='test'||env.API_HOST!=='127.0.0.1'||env.F06_LOCK_TEST_CONSENT!=='I_AUTHORIZE_DISPOSABLE_F06_LOCK_PG16_ONLY')throw Error('F06_LOCK_LIFECYCLE_TEST_ONLY');
 if(!service||typeof service.act!=='function')throw Error('F06_LOCK_LIFECYCLE_DEPENDENCIES_REQUIRED');
 return async(req,res)=>{
  const path=req.url||'';if(!path.startsWith('/api/v1/locks'))return false;
  const m=/^\/api\/v1\/locks\/([1-9][0-9]{0,18})\/actions$/.exec(path);
  if(!m){send(res,404,'NOT_FOUND');return true}
  if(req.method!=='POST'){send(res,405,'METHOD_NOT_ALLOWED');return true}
  if(env.F06_LOCK_LIFECYCLE_TEST_CONSENT!=='I_AUTHORIZE_DISPOSABLE_F06_LOCK_LIFECYCLE_ONLY'){send(res,403,'LOCK_LIFECYCLE_TEST_CONSENT_REQUIRED');return true}
  if(!localhost(req.socket?.remoteAddress)||req.headers.host!==`127.0.0.1:${req.socket?.localPort}`||req.headers.cookie||req.headers['transfer-encoding']||
    Object.keys(req.headers).some(k=>/^(?:forwarded|x-forwarded-|x-customer-|x-employee-|x-role|x-scope|x-system-admin)/.test(k))){
   send(res,403,'UNTRUSTED_REQUEST');return true
  }
  if(typeof req.headers.authorization!=='string'||!/^Bearer [A-Za-z0-9_-]{43}$/.test(req.headers.authorization)){send(res,401,'TEST_EMPLOYEE_IDENTITY_REQUIRED');return true}
  const parsed=await parseBody(req);if(parsed.error){send(res,400,parsed.error);return true}
  const b=parsed.value,extend=b?.action==='extend',keys=extend?['action','idempotencyKey','reason','newExpiresAt']:['action','idempotencyKey','reason'];
  if(!b||typeof b!=='object'||Array.isArray(b)||Object.keys(b).some(k=>!keys.includes(k))||!['extend','release','cancel'].includes(b.action)||
    !validKey(b.idempotencyKey)||!validReason(b.reason)||(extend?!validIso(b.newExpiresAt):Object.hasOwn(b,'newExpiresAt'))||!positiveId(m[1])){
   send(res,400,'INVALID_LOCK_LIFECYCLE_ACTION');return true
  }
  try{
   const r=await service.act({token:req.headers.authorization.slice(7),lockId:m[1],action:b.action,idempotencyKey:b.idempotencyKey,reason:b.reason,...(extend?{newExpiresAt:b.newExpiresAt}:{})});
   if(!r||!Number.isInteger(r.status)||r.status<200||r.status>599||typeof r.body?.code!=='string'){send(res,503,'LOCK_LIFECYCLE_SERVICE_UNAVAILABLE');return true}
   send(res,r.status,r.body.code,Object.fromEntries(Object.entries(r.body).filter(([k])=>k!=='code')));
  }catch{send(res,503,'LOCK_LIFECYCLE_SERVICE_UNAVAILABLE')}
  return true;
 };
}
