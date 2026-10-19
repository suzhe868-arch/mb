// F05-5 test-only Employee quota addition. Target Customer is an object ID,
// not an actor claim; current Employee always comes from PG16 test bearer.
const send=(res,status,body)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'private, no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify(body))};
const local=x=>['127.0.0.1','::1','::ffff:127.0.0.1'].includes(x);
export function createIsolatedQuotaAdditionHandler(service,env=process.env){
 if(!service||typeof service.add!=='function'||env.APP_ENV!=='test'||env.NODE_ENV!=='test'||
    env.API_HOST!=='127.0.0.1'||env.F05_CATALOG_TEST_CONSENT!=='I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY')
 throw Error('F05_QUOTA_ADDITION_NOT_ISOLATED');
 return async(req,res)=>{
  const url=req.url??'';
  if(!url.startsWith('/api/v1/catalog/customers/')||!url.split('?')[0].endsWith('/price-quota/additions'))return false;
  if(url.length>256||url.includes('?')||url.includes('#')||/%|\\|\0/.test(url)){
   send(res,400,{code:'QUOTA_ADDITION_INVALID_PATH'});return true;
  }
  const match=/^\/api\/v1\/catalog\/customers\/([1-9][0-9]{0,18})\/price-quota\/additions$/.exec(url);
  if(!match){send(res,400,{code:'QUOTA_ADDITION_INVALID_PATH'});return true}
  if(req.method!=='POST'){send(res,405,{code:'METHOD_NOT_ALLOWED'});return true}
  if(!local(req.socket?.remoteAddress)||req.headers.host!=='127.0.0.1:'+req.socket?.localPort||
     req.headers.cookie||Object.keys(req.headers).some(h=>/(customer|employee|owner|role|scope|price|quota|entitlement|level|phone|wechat|forwarded|^x-forwarded-)/.test(h))){
   send(res,403,{code:'QUOTA_UNTRUSTED_EMPLOYEE_REQUEST'});return true;
  }
  const auth=req.headers.authorization,key=req.headers['x-idempotency-key'];
  if(typeof auth!=='string'||!/^Bearer [A-Za-z0-9_-]{43}$/.test(auth)){
   send(res,401,{code:'EMPLOYEE_IDENTITY_REQUIRED'});return true;
  }
  if(typeof key!=='string'||!/^[A-Za-z0-9_-]{24,64}$/.test(key)){
   send(res,400,{code:'QUOTA_IDEMPOTENCY_KEY_REQUIRED'});return true;
  }
  if(req.headers['content-type']!=='application/json'){
   send(res,415,{code:'QUOTA_ADDITION_JSON_REQUIRED'});return true;
  }
  if(req.headers['content-length']&&(!/^[0-9]+$/.test(req.headers['content-length'])||Number(req.headers['content-length'])>128)){
   send(res,413,{code:'QUOTA_ADDITION_BODY_TOO_LARGE'});return true;
  }
  try{
   let parts=[],bytes=0;
   for await(const chunk of req){bytes+=chunk.length;if(bytes>128){send(res,413,{code:'QUOTA_ADDITION_BODY_TOO_LARGE'});return true}parts.push(chunk)}
   let body;
   try{body=JSON.parse(Buffer.concat(parts).toString('utf8'))}
   catch{send(res,400,{code:'QUOTA_ADDITION_INVALID_JSON'});return true}
   if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).sort().join(',')!=='delta'){
    send(res,400,{code:'QUOTA_ADDITION_UNEXPECTED_FIELDS'});return true;
   }
   if(!Number.isInteger(body.delta)||body.delta<1||body.delta>10000){
    send(res,400,{code:'QUOTA_ADD_INVALID_REQUEST'});return true;
   }
   const r=await service.add({token:auth.slice(7),customerId:match[1],eventKey:key,delta:body.delta});
   send(res,r.status,r.body);
  }catch{send(res,503,{code:'QUOTA_EMPLOYEE_SCOPE_OR_DATABASE_NOT_READY'})}
  return true;
 };
}
