// Separate PDM-15 test-only scoped employee resume HTTP; never accepts Customer identity claims.
const send=(res,status,body)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'private, no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify(body))};
const isLocal=s=>['127.0.0.1','::1','::ffff:127.0.0.1'].includes(s);
export function createIsolatedSlaHoldHandler(service,env=process.env){
 if(!service||typeof service.resume!=='function'||env.APP_ENV!=='test'||env.NODE_ENV!=='test'||env.API_HOST!=='127.0.0.1'||env.F05_CATALOG_TEST_CONSENT!=='I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY')throw Error('SLA_HOLD_TEST_ONLY');
 return async(req,res)=>{
  const path=req.url??'';
  if(!path.startsWith('/api/v1/catalog/consultations/')||!path.split('?')[0].endsWith('/resume-from-hold'))return false;
  if(path.length>256||path.includes('?')||path.includes('#')||/%|\\|\0/.test(path)){send(res,400,{code:'SLA_HOLD_INVALID_PATH'});return true}
  const m=/^\/api\/v1\/catalog\/consultations\/([1-9][0-9]{0,18})\/resume-from-hold$/.exec(path);
  if(!m){send(res,400,{code:'SLA_HOLD_INVALID_PATH'});return true}
  if(req.method!=='POST'){send(res,405,{code:'METHOD_NOT_ALLOWED'});return true}
  if(!isLocal(req.socket?.remoteAddress)||req.headers.host!=='127.0.0.1:'+req.socket?.localPort||
    req.headers.cookie||req.headers['transfer-encoding']||
    (req.headers['content-length']&&req.headers['content-length']!=='0')||
    Object.keys(req.headers).some(x=>/(customer|employee|owner|role|scope|phone|wechat|forwarded|^x-forwarded-)/.test(x))){
   send(res,403,{code:'SLA_HOLD_UNTRUSTED_REQUEST'});return true;
  }
  const bearer=req.headers.authorization,key=req.headers['x-idempotency-key'];
  if(typeof bearer!=='string'||!/^Bearer [A-Za-z0-9_-]{43}$/.test(bearer)){send(res,401,{code:'EMPLOYEE_IDENTITY_REQUIRED'});return true}
  if(typeof key!=='string'||!/^[A-Za-z0-9_-]{24,64}$/.test(key)){send(res,400,{code:'INVALID_IDEMPOTENCY_KEY'});return true}
  try{
   const value=await service.resume({token:bearer.slice(7),consultationId:m[1],eventKey:key});
   send(res,value.status,value.body);
  }catch{send(res,503,{code:'CONSULTATION_SLA_HOLD_DEPENDENCY_NOT_READY'})}
  return true;
 };
}
