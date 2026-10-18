// Isolated manager-only single-customer qualification HTTP. Never trusts body role/issuer.
const send=(res,status,body)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'private, no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify(body))};
export function createIsolatedPriorityQualificationHandler(service,env=process.env){
 if(!service||typeof service.mutate!=='function'||env.APP_ENV!=='test'||env.NODE_ENV!=='test'||
  env.API_HOST!=='127.0.0.1'||env.F05_CATALOG_TEST_CONSENT!=='I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY')
  throw Error('PRIORITY_QUAL_FORMAL_ISSUER_REQUIRED');
 return async(req,res)=>{
  const route=req.url??'';
  if(!route.startsWith('/api/v1/catalog/priority/qualification'))return false;
  if(route!=='/api/v1/catalog/priority/qualification'){send(res,400,{code:'PRIORITY_QUAL_INVALID_PATH'});return true}
  if(req.method!=='POST'){send(res,405,{code:'METHOD_NOT_ALLOWED'});return true}
  const h=req.headers;
  if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket?.remoteAddress)||
   h.host!=='127.0.0.1:'+req.socket?.localPort||h.cookie||h['transfer-encoding']||
   h['content-type']!=='application/json'||Number(h['content-length'])>400||
   Object.keys(h).some(x=>/(employee|owner|role|scope|price|grant|priority-issuer|wechat|forwarded|^x-forwarded-)/.test(x))){
   send(res,403,{code:'PRIORITY_QUAL_UNTRUSTED_REQUEST'});return true;
  }
  const auth=h.authorization;
  if(typeof auth!=='string'||!/^Bearer [A-Za-z0-9_-]{43}$/.test(auth)){
   send(res,401,{code:'PRIORITY_QUAL_EMPLOYEE_REQUIRED'});return true;
  }
  try{
   let raw='';
   for await(const chunk of req){raw+=chunk.toString('utf8');if(Buffer.byteLength(raw)>400){send(res,413,{code:'PRIORITY_QUAL_BODY_TOO_LARGE'});return true}}
   let body;try{body=JSON.parse(raw)}catch{send(res,400,{code:'PRIORITY_QUAL_INVALID_JSON'});return true}
   if(!body||Array.isArray(body)||typeof body!=='object'||
    Object.keys(body).some(x=>!['action','customerId','expectedRevision'].includes(x))){
    send(res,400,{code:'PRIORITY_QUAL_INVALID_BODY'});return true;
   }
   const out=await service.mutate({...body,credential:auth.slice(7),eventKey:h['x-idempotency-key']});
   send(res,out.status,out.body);
  }catch{send(res,503,{code:'PRIORITY_QUAL_DATABASE_NOT_READY'})}
  return true;
 };
}
