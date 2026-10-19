// F05-1 Employee scoped vehicle read; never accepts a caller-chosen actor/role/source.
const send=(res,status,body)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8',
 'cache-control':'private, no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify(body))};
const local=x=>['127.0.0.1','::1','::ffff:127.0.0.1'].includes(x);
export function createIsolatedEmployeeVehicleReadHandler(service,env=process.env){
 if(!service||typeof service.get!=='function'||env.APP_ENV!=='test'||env.NODE_ENV!=='test'||
 env.API_HOST!=='127.0.0.1'||env.F05_CATALOG_TEST_CONSENT!=='I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY')
 throw Error('F05_VEHICLE_SCOPE_HTTP_FORMAL_SOURCE_NOT_SIGNED');
 return async(req,res)=>{
  const url=req.url??'';
  if(!url.startsWith('/api/v1/catalog/internal/vehicles/'))return false;
  if(url.length>256||url.includes('?')||url.includes('#')||/%|\\|\0/.test(url)){
   send(res,400,{code:'EMPLOYEE_VEHICLE_INVALID_PATH'});return true;
  }
  const match=/^\/api\/v1\/catalog\/internal\/vehicles\/([1-9][0-9]{0,18})$/.exec(url);
  if(!match){send(res,404,{code:'EMPLOYEE_VEHICLE_NOT_FOUND'});return true}
  if(req.method!=='GET'){send(res,405,{code:'METHOD_NOT_ALLOWED'});return true}
  if(!local(req.socket?.remoteAddress)||req.headers.host!=='127.0.0.1:'+req.socket?.localPort||
   req.headers.cookie||req.headers['transfer-encoding']||
   Object.keys(req.headers).some(k=>/(customer|employee|owner|role|scope|price|phone|vin|source|wechat|forwarded|^x-forwarded-)/.test(k))){
   send(res,403,{code:'EMPLOYEE_VEHICLE_UNTRUSTED_REQUEST'});return true;
  }
  const auth=req.headers.authorization;
  if(typeof auth!=='string'||!/^Bearer [A-Za-z0-9_-]{43}$/.test(auth)){
   send(res,401,{code:'EMPLOYEE_IDENTITY_REQUIRED'});return true;
  }
  try{
   const out=await service.get({credential:auth.slice(7),vehicleId:match[1]});
   send(res,out.status,out.body);
  }catch{send(res,503,{code:'EMPLOYEE_VEHICLE_DEPENDENCY_NOT_READY'})}
  return true;
 };
}
