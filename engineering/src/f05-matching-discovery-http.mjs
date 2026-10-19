// Test-only real loopback route: no external vehicle publisher event is implicitly trusted.
const send=(res,status,body)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8',
 'cache-control':'private, no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify(body))};
export function createIsolatedMatchingDiscoveryHandler(service,env=process.env){
 if(!service||typeof service.discover!=='function'||env.APP_ENV!=='test'||env.NODE_ENV!=='test'||
  env.API_HOST!=='127.0.0.1'||env.F05_CATALOG_TEST_CONSENT!=='I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY')
  throw Error('MATCH_DISCOVERY_TEST_ONLY');
 return async(req,res)=>{
  const path=req.url??'';
  if(!path.startsWith('/api/v1/catalog/matching/discovery'))return false;
  if(path!=='/api/v1/catalog/matching/discovery'){send(res,400,{code:'DISCOVERY_INVALID_PATH'});return true}
  if(req.method!=='POST'){send(res,405,{code:'METHOD_NOT_ALLOWED'});return true}
  const h=req.headers;
  if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket?.remoteAddress)||
   h.host!=='127.0.0.1:'+req.socket?.localPort||h.cookie||h['transfer-encoding']||
   h['content-type']!=='application/json'||Number(h['content-length'])>500||
   Object.keys(h).some(x=>/(customer|employee|owner|role|scope|price|grant|priority|recommendation|phone|wechat|forwarded|^x-forwarded-)/.test(x))){
    send(res,403,{code:'DISCOVERY_UNTRUSTED_REQUEST'});return true;
  }
  const a=h.authorization;
  if(typeof a!=='string'||!/^Bearer [A-Za-z0-9_-]{43}$/.test(a)){send(res,401,{code:'DISCOVERY_EMPLOYEE_REQUIRED'});return true}
  let body='';
  try{
   for await(const c of req){body+=c.toString('utf8');if(Buffer.byteLength(body)>500){send(res,413,{code:'DISCOVERY_BODY_TOO_LARGE'});return true}}
   let data;try{data=JSON.parse(body)}catch{send(res,400,{code:'DISCOVERY_INVALID_JSON'});return true}
   if(!data||typeof data!=='object'||Array.isArray(data)||
    Object.keys(data).some(k=>!['kind','subjectId'].includes(k))){
    send(res,400,{code:'DISCOVERY_INVALID_BODY'});return true;
   }
   const result=await service.discover({credential:a.slice(7),eventKey:h['x-idempotency-key'],
    kind:data.kind,subjectId:data.subjectId});
   send(res,result.status,result.body);
  }catch{send(res,503,{code:'DISCOVERY_DATABASE_NOT_READY'})}
  return true;
 };
}
