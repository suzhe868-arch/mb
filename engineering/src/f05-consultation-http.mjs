// Actual loopback HTTP consultation. No Customer claims accepted from request fields.
const send=(res,status,body)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'private, no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify(body))};
const local=a=>['127.0.0.1','::1','::ffff:127.0.0.1'].includes(a);
export function createIsolatedConsultationHandler(service,env=process.env){
 if(!service||typeof service.create!=='function'||env.APP_ENV!=='test'||env.NODE_ENV!=='test'||env.API_HOST!=='127.0.0.1'||env.F05_CATALOG_TEST_CONSENT!=='I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY')throw Error('CONSULTATION_ISSUER_NOT_VERIFIED');
 return async(req,res)=>{
  const path=(req.url||'');
  if(!path.startsWith('/api/v1/catalog/vehicles/')||!path.split('?')[0].endsWith('/consultations'))return false;
  if(path.length>256||path.includes('?')||path.includes('#')||/%|\\|\0/.test(path)){
   send(res,400,{code:'CONSULTATION_INVALID_PATH'});return true;
  }
  const m=/^\/api\/v1\/catalog\/vehicles\/([1-9][0-9]{0,18})\/consultations$/.exec(path);
  if(!m){send(res,400,{code:'CONSULTATION_INVALID_PATH'});return true}
  if(req.method!=='POST'){send(res,405,{code:'METHOD_NOT_ALLOWED'});return true}
  if(!local(req.socket?.remoteAddress)||req.headers.host!=='127.0.0.1:'+req.socket?.localPort||
   req.headers.cookie||req.headers['transfer-encoding']||
   (req.headers['content-length']&&req.headers['content-length']!=='0')||
   Object.keys(req.headers).some(h=>/(customer|employee|owner|role|scope|phone|wechat|forwarded|^x-forwarded-)/.test(h))){
    send(res,403,{code:'CONSULTATION_UNTRUSTED_REQUEST'});return true;
  }
  const auth=req.headers.authorization,key=req.headers['x-idempotency-key'];
  if(typeof auth!=='string'||!/^Bearer [A-Za-z0-9_-]{43}$/.test(auth)){send(res,401,{code:'CONSULTATION_IDENTITY_REQUIRED'});return true}
  if(typeof key!=='string'||!/^[A-Za-z0-9_-]{24,64}$/.test(key)){send(res,400,{code:'CONSULTATION_INVALID_IDEMPOTENCY'});return true}
  try{
   const out=await service.create({token:auth.slice(7),vehicleId:m[1],eventKey:key});
   send(res,out.status,out.body);
  }catch{send(res,503,{code:'CONSULTATION_DEPENDENCY_NOT_READY'})}
  return true;
 };
}
