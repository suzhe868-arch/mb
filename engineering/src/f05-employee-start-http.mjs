// Test-only loopback Employee endpoint, separate from Customer bearer. Never trust employee_id headers.
const send=(res,status,body)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'private, no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify(body))};
const local=x=>['127.0.0.1','::1','::ffff:127.0.0.1'].includes(x);
export function createIsolatedEmployeeStartHandler(service,env=process.env){
 if(!service||typeof service.start!=='function'||env.APP_ENV!=='test'||env.NODE_ENV!=='test'||env.API_HOST!=='127.0.0.1'||env.F05_CATALOG_TEST_CONSENT!=='I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY')throw Error('EMPLOYEE_START_NOT_ISOLATED');
 return async(req,res)=>{
  const url=req.url||'';
  if(!url.startsWith('/api/v1/catalog/consultations/')||!url.split('?')[0].endsWith('/start-processing'))return false;
  if(url.length>256||url.includes('?')||url.includes('#')||/%|\\|\0/.test(url)){
   send(res,400,{code:'CONSULTATION_INVALID_PATH'});return true;
  }
  const match=/^\/api\/v1\/catalog\/consultations\/([1-9][0-9]{0,18})\/start-processing$/.exec(url);
  if(!match){send(res,400,{code:'CONSULTATION_INVALID_PATH'});return true}
  if(req.method!=='POST'){send(res,405,{code:'METHOD_NOT_ALLOWED'});return true}
  if(!local(req.socket?.remoteAddress)||req.headers.host!=='127.0.0.1:'+req.socket?.localPort||
    req.headers.cookie||req.headers['transfer-encoding']||
    (req.headers['content-length']&&req.headers['content-length']!=='0')||
    Object.keys(req.headers).some(h=>/(customer|employee|owner|role|scope|phone|wechat|forwarded|^x-forwarded-)/.test(h))){
    send(res,403,{code:'EMPLOYEE_UNTRUSTED_REQUEST'});return true;
  }
  const bearer=req.headers.authorization,key=req.headers['x-idempotency-key'];
  if(typeof bearer!=='string'||!/^Bearer [A-Za-z0-9_-]{43}$/.test(bearer)){send(res,401,{code:'EMPLOYEE_IDENTITY_REQUIRED'});return true}
  if(typeof key!=='string'||!/^[A-Za-z0-9_-]{24,64}$/.test(key)){send(res,400,{code:'INVALID_IDEMPOTENCY_KEY'});return true}
  try{
   const r=await service.start({token:bearer.slice(7),consultationId:match[1],eventKey:key});
   send(res,r.status,r.body);
  }catch{send(res,503,{code:'CONSULTATION_EMPLOYEE_DEPENDENCY_NOT_READY'})}
  return true;
 };
}
