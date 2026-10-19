// Restricted test-only consultation reassignment endpoint. Actor always derives from DB-backed bearer.
const send=(res,status,body)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'private, no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify(body))};
const local=x=>['127.0.0.1','::1','::ffff:127.0.0.1'].includes(x);
export function createIsolatedHandoverHandler(service,env=process.env){
 if(!service||typeof service.reassign!=='function'||env.APP_ENV!=='test'||env.NODE_ENV!=='test'||
 env.API_HOST!=='127.0.0.1'||env.F05_CATALOG_TEST_CONSENT!=='I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY')throw Error('HANDOVER_HTTP_NOT_ISOLATED');
 return async(req,res)=>{
  const url=req.url??'';
  if(!url.startsWith('/api/v1/catalog/consultations/')||!url.split('?')[0].endsWith('/reassign'))return false;
  if(url.length>256||url.includes('?')||url.includes('#')||/%|\\|\0/.test(url)){
   send(res,400,{code:'HANDOVER_INVALID_PATH'});return true;
  }
  const match=/^\/api\/v1\/catalog\/consultations\/([1-9][0-9]{0,18})\/reassign$/.exec(url);
  if(!match){send(res,400,{code:'HANDOVER_INVALID_PATH'});return true}
  if(req.method!=='POST'){send(res,405,{code:'METHOD_NOT_ALLOWED'});return true}
  if(!local(req.socket?.remoteAddress)||req.headers.host!=='127.0.0.1:'+req.socket?.localPort||
    req.headers.cookie||Object.keys(req.headers).some(h=>/(customer|employee|owner|role|scope|phone|wechat|forwarded|^x-forwarded-)/.test(h))){
   send(res,403,{code:'HANDOVER_UNTRUSTED_REQUEST'});return true;
  }
  const auth=req.headers.authorization,key=req.headers['x-idempotency-key'];
  if(typeof auth!=='string'||!/^Bearer [A-Za-z0-9_-]{43}$/.test(auth)){send(res,401,{code:'EMPLOYEE_IDENTITY_REQUIRED'});return true}
  if(typeof key!=='string'||!/^[A-Za-z0-9_-]{24,64}$/.test(key)){send(res,400,{code:'INVALID_IDEMPOTENCY_KEY'});return true}
  if(req.headers['content-type']!=='application/json'){send(res,415,{code:'HANDOVER_JSON_REQUIRED'});return true}
  if(req.headers['content-length']&&(!/^[0-9]+$/.test(req.headers['content-length'])||Number(req.headers['content-length'])>512)){
   send(res,413,{code:'HANDOVER_BODY_TOO_LARGE'});return true;
  }
  try{
   const parts=[];let total=0;
   for await(const chunk of req){
    total+=chunk.length;
    if(total>512){send(res,413,{code:'HANDOVER_BODY_TOO_LARGE'});return true}
    parts.push(chunk);
   }
   let body;
   try{body=JSON.parse(Buffer.concat(parts).toString('utf8'))}
   catch{send(res,400,{code:'HANDOVER_INVALID_JSON'});return true}
   if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).sort().join(',')!=='reason,targetEmployeeId'){
    send(res,400,{code:'HANDOVER_UNEXPECTED_FIELDS'});return true;
   }
   const result=await service.reassign({token:auth.slice(7),consultationId:match[1],eventKey:key,targetEmployeeId:body.targetEmployeeId,reason:body.reason});
   send(res,result.status,result.body);
  }catch{send(res,503,{code:'HANDOVER_DATABASE_UNAVAILABLE'})}
  return true;
 };
}
