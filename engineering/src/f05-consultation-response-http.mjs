// Test-only auditable human-response endpoint. Employee identity always derives from DB-backed bearer.
const send=(res,status,body)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'private, no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify(body))};
const local=x=>['127.0.0.1','::1','::ffff:127.0.0.1'].includes(x);
export function createIsolatedConsultationResponseHandler(service,env=process.env){
 if(!service||typeof service.record!=='function'||env.APP_ENV!=='test'||env.NODE_ENV!=='test'||
  env.API_HOST!=='127.0.0.1'||env.F05_CATALOG_TEST_CONSENT!=='I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY')
  throw Error('CONSULTATION_RESPONSE_HTTP_NOT_ISOLATED');
 return async(req,res)=>{
  const url=req.url??'';
  if(!url.startsWith('/api/v1/catalog/consultations/'))return false;
  if(!url.split('?')[0].endsWith('/human-responses'))return false;
  if(url.length>256||url.includes('?')||url.includes('#')||/%|\\|\0/.test(url)){
   send(res,400,{code:'CONSULTATION_RESPONSE_INVALID_PATH'});return true;
  }
  const m=/^\/api\/v1\/catalog\/consultations\/([1-9][0-9]{0,18})\/human-responses$/.exec(url);
  if(!m){send(res,400,{code:'CONSULTATION_RESPONSE_INVALID_PATH'});return true}
  if(req.method!=='POST'){send(res,405,{code:'METHOD_NOT_ALLOWED'});return true}
  const h=req.headers;
  if(!local(req.socket?.remoteAddress)||h.host!=='127.0.0.1:'+req.socket?.localPort||h.cookie||h['transfer-encoding']||
   Object.keys(h).some(k=>/(customer|employee|owner|role|scope|phone|wechat|forwarded|^x-forwarded-)/.test(k))){
   send(res,403,{code:'CONSULTATION_RESPONSE_UNTRUSTED_REQUEST'});return true;
  }
  if(typeof h.authorization!=='string'||!/^Bearer [A-Za-z0-9_-]{43}$/.test(h.authorization)){
   send(res,401,{code:'EMPLOYEE_IDENTITY_REQUIRED'});return true;
  }
  if(typeof h['x-idempotency-key']!=='string'||!/^[A-Za-z0-9_-]{24,64}$/.test(h['x-idempotency-key'])){
   send(res,400,{code:'INVALID_IDEMPOTENCY_KEY'});return true;
  }
  if(h['content-type']!=='application/json'){send(res,415,{code:'CONSULTATION_RESPONSE_JSON_REQUIRED'});return true}
  if(h['content-length']&&(!/^[0-9]+$/.test(h['content-length'])||Number(h['content-length'])>512)){
   send(res,413,{code:'CONSULTATION_RESPONSE_BODY_TOO_LARGE'});return true;
  }
  try{
   const chunks=[];let size=0;
   for await(const chunk of req){size+=chunk.length;if(size>512){send(res,413,{code:'CONSULTATION_RESPONSE_BODY_TOO_LARGE'});return true}chunks.push(chunk)}
   let body;try{body=JSON.parse(Buffer.concat(chunks).toString('utf8'))}catch{send(res,400,{code:'CONSULTATION_RESPONSE_INVALID_JSON'});return true}
   if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).sort().join(',')!=='channel,sourceFactRef'){
    send(res,400,{code:'CONSULTATION_RESPONSE_INVALID_FIELDS'});return true;
   }
   const r=await service.record({credential:h.authorization.slice(7),consultationId:m[1],eventKey:h['x-idempotency-key'],
    channel:body.channel,sourceFactRef:body.sourceFactRef});
   send(res,r.status,r.body);
  }catch{send(res,503,{code:'CONSULTATION_RESPONSE_DEPENDENCY_NOT_READY'})}
  return true;
 };
}
