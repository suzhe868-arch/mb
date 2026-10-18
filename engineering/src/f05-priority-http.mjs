const send=(res,status,body)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'private, no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify(body))};
export function createIsolatedPriorityHandler(service,env=process.env){
 if(!service||typeof service.act!=='function'||env.APP_ENV!=='test'||env.NODE_ENV!=='test'||
  env.API_HOST!=='127.0.0.1'||env.F05_CATALOG_TEST_CONSENT!=='I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY')
  throw Error('PRIORITY_PRODUCTION_ISSUER_NOT_SIGNED');
 return async(req,res)=>{
  const url=req.url??'';
  if(!url.startsWith('/api/v1/catalog/priority'))return false;
  if(url!=='/api/v1/catalog/priority'){send(res,400,{code:'PRIORITY_INVALID_PATH'});return true}
  if(req.method!=='POST'){send(res,405,{code:'METHOD_NOT_ALLOWED'});return true}
  const hs=req.headers;
  if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket?.remoteAddress)||
   hs.host!=='127.0.0.1:'+req.socket?.localPort||hs.cookie||hs['transfer-encoding']||
   hs['content-type']!=='application/json'||Number(hs['content-length'])>450||
   Object.keys(hs).some(x=>/(customer|employee|owner|role|scope|price|grant|qualification|wechat|forwarded|^x-forwarded-)/.test(x))){
   send(res,403,{code:'PRIORITY_UNTRUSTED_REQUEST'});return true;
  }
  const auth=hs.authorization;
  if(typeof auth!=='string'||!/^Bearer [A-Za-z0-9_-]{43}$/.test(auth)){
   send(res,401,{code:'PRIORITY_EMPLOYEE_REQUIRED'});return true;
  }
  let data='';try{
   for await(const chunk of req){data+=chunk.toString('utf8');if(Buffer.byteLength(data)>450){send(res,413,{code:'PRIORITY_BODY_TOO_LARGE'});return true}}
   let obj;try{obj=JSON.parse(data)}catch{send(res,400,{code:'PRIORITY_INVALID_JSON'});return true}
   if(!obj||Array.isArray(obj)||typeof obj!=='object'||Object.keys(obj).some(k=>!['action','vehicleId'].includes(k))){
    send(res,400,{code:'PRIORITY_UNTRUSTED_BODY'});return true;
   }
   const result=await service.act({credential:auth.slice(7),action:obj.action,
    vehicleId:obj.vehicleId,eventKey:hs['x-idempotency-key']});
   send(res,result.status,result.body);
  }catch{send(res,503,{code:'PRIORITY_DB_NOT_READY'})}
  return true;
 };
}
