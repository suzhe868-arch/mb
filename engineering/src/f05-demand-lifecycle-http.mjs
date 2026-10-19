// Test-only PDM-11 Demand lifecycle HTTP, with DB-derived actor and fail-closed claims.
const send=(res,status,body)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8',
 'cache-control':'private, no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify(body))};
const local=x=>['127.0.0.1','::1','::ffff:127.0.0.1'].includes(x);
export function createIsolatedDemandLifecycleHandler(service,env=process.env){
 if(!service||typeof service.action!=='function'||env.APP_ENV!=='test'||env.NODE_ENV!=='test'||
   env.API_HOST!=='127.0.0.1'||env.F05_CATALOG_TEST_CONSENT!=='I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY')
  throw Error('DEMAND_LIFECYCLE_HTTP_FORMAL_ISSUER_REQUIRED');
 return async(req,res)=>{
  const url=req.url??'';
  if(!url.startsWith('/api/v1/catalog/demands/'))return false;
  if(url.length>256||url.includes('?')||url.includes('#')||/%|\\|\0/.test(url)){
   send(res,400,{code:'DEMAND_INVALID_PATH'});return true;
  }
  const m=/^\/api\/v1\/catalog\/demands\/([1-9][0-9]{0,18})\/actions$/.exec(url);
  if(!m){send(res,404,{code:'DEMAND_ACTION_NOT_FOUND'});return true}
  if(req.method!=='POST'){send(res,405,{code:'METHOD_NOT_ALLOWED'});return true}
  const h=req.headers;
  if(!local(req.socket?.remoteAddress)||h.host!=='127.0.0.1:'+req.socket?.localPort||
    h.cookie||h['transfer-encoding']||h['content-type']!=='application/json'||
    (h['content-length']&&(!/^[0-9]+$/.test(h['content-length'])||Number(h['content-length'])>350))||
    Object.keys(h).some(k=>/(customer|employee|owner|role|scope|level|entitlement|phone|wechat|forwarded|^x-forwarded-)/.test(k))){
   send(res,403,{code:'DEMAND_UNTRUSTED_REQUEST'});return true;
  }
  if(typeof h.authorization!=='string'||!/^Bearer [A-Za-z0-9_-]{43}$/.test(h.authorization)){
   send(res,401,{code:'DEMAND_IDENTITY_REQUIRED'});return true;
  }
  if(typeof h['x-idempotency-key']!=='string'||!/^[A-Za-z0-9_-]{24,64}$/.test(h['x-idempotency-key'])){
   send(res,400,{code:'DEMAND_IDEMPOTENCY_REQUIRED'});return true;
  }
  try{
   const chunks=[];let bytes=0;
   for await(const chunk of req){bytes+=chunk.length;if(bytes>350){
    send(res,413,{code:'DEMAND_BODY_TOO_LARGE'});return true;
   }chunks.push(chunk)}
   let data;try{data=JSON.parse(Buffer.concat(chunks).toString('utf8'))}
   catch{send(res,400,{code:'DEMAND_INVALID_JSON'});return true}
   if(!data||typeof data!=='object'||Array.isArray(data)||
      Object.keys(data).some(x=>!['action','reason'].includes(x))){
    send(res,400,{code:'DEMAND_INVALID_FIELDS'});return true;
   }
   const result=await service.action({credential:h.authorization.slice(7),
    eventKey:h['x-idempotency-key'],demandId:m[1],action:data.action,reason:data.reason??null});
   send(res,result.status,result.body);
  }catch{send(res,503,{code:'DEMAND_DEPENDENCY_NOT_READY'})}
  return true;
 };
}
