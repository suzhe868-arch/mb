// PDM-11 employee activation is never a Customer action or automatic Application onSubmit.
const send=(res,status,body)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'private, no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify(body))};
const local=x=>['127.0.0.1','::1','::ffff:127.0.0.1'].includes(x);
export function createIsolatedFindCarActivationHandler(service,env=process.env){
 if(!service||typeof service.activate!=='function'||env.APP_ENV!=='test'||env.NODE_ENV!=='test'||
 env.API_HOST!=='127.0.0.1'||env.F05_CATALOG_TEST_CONSENT!=='I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY')
 throw Error('FIND_CAR_ACTIVATION_FORMAL_ISSUER_REQUIRED');
 return async(req,res)=>{
  const url=req.url??'';
  if(!url.startsWith('/api/v1/catalog/find-car/applications/')||!url.split('?')[0].endsWith('/activate'))return false;
  if(url.length>256||url.includes('?')||url.includes('#')||/%|\\|\0/.test(url)){
   send(res,400,{code:'FIND_CAR_ACTIVATION_INVALID_PATH'});return true;
  }
  const m=/^\/api\/v1\/catalog\/find-car\/applications\/([1-9][0-9]{0,18})\/activate$/.exec(url);
  if(!m){send(res,400,{code:'FIND_CAR_ACTIVATION_INVALID_PATH'});return true}
  if(req.method!=='POST'){send(res,405,{code:'METHOD_NOT_ALLOWED'});return true}
  if(!local(req.socket?.remoteAddress)||req.headers.host!=='127.0.0.1:'+req.socket?.localPort||
   req.headers.cookie||req.headers['transfer-encoding']||
   (req.headers['content-length']&&req.headers['content-length']!=='0')||
   Object.keys(req.headers).some(h=>/(customer|employee|owner|role|scope|level|phone|entitlement|demand|priority|forwarded|^x-forwarded-)/.test(h))){
   send(res,403,{code:'FIND_CAR_ACTIVATION_UNTRUSTED_REQUEST'});return true;
  }
  const auth=req.headers.authorization,key=req.headers['x-idempotency-key'];
  if(typeof auth!=='string'||!/^Bearer [A-Za-z0-9_-]{43}$/.test(auth)){
   send(res,401,{code:'EMPLOYEE_IDENTITY_REQUIRED'});return true;
  }
  if(typeof key!=='string'||!/^[A-Za-z0-9_-]{24,64}$/.test(key)){
   send(res,400,{code:'FIND_CAR_IDEMPOTENCY_REQUIRED'});return true;
  }
  try{
   const r=await service.activate({credential:auth.slice(7),eventKey:key,applicationId:m[1]});
   send(res,r.status,r.body);
  }catch{send(res,503,{code:'FIND_CAR_ACTIVATION_DEPENDENCY_NOT_READY'})}
  return true;
 };
}
