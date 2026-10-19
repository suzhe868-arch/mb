// PDM12: scoped test-only Employee request to recompute exactly one Demand x Vehicle.
// HTTP never accepts a caller supplied tier, criteria, owner, source price or grant.
const send=(res,status,body)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'private, no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify(body))};
const local=x=>['127.0.0.1','::1','::ffff:127.0.0.1'].includes(x);
export function createIsolatedMatchingHandler(service,env=process.env){
 if(!service||typeof service.recompute!=='function'||env.APP_ENV!=='test'||env.NODE_ENV!=='test'||
 env.API_HOST!=='127.0.0.1'||env.F05_CATALOG_TEST_CONSENT!=='I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY')
 throw Error('PDM12_TEST_ONLY_MATCHING_HTTP');
 return async(req,res)=>{
  const path=req.url??'';
  if(!path.startsWith('/api/v1/catalog/demands/')||!path.split('?')[0].endsWith('/recompute-match'))return false;
  if(path.length>300||path.includes('?')||path.includes('#')||/%|\\|\0/.test(path)){
   send(res,400,{code:'MATCH_INVALID_PATH'});return true;
  }
  const m=/^\/api\/v1\/catalog\/demands\/([1-9][0-9]{0,18})\/vehicles\/([1-9][0-9]{0,18})\/recompute-match$/.exec(path);
  if(!m){send(res,400,{code:'MATCH_INVALID_PATH'});return true}
  if(req.method!=='POST'){send(res,405,{code:'METHOD_NOT_ALLOWED'});return true}
  if(!local(req.socket?.remoteAddress)||req.headers.host!=='127.0.0.1:'+req.socket?.localPort||
    req.headers.cookie||req.headers['transfer-encoding']||
    (req.headers['content-length']&&req.headers['content-length']!=='0')||
    Object.keys(req.headers).some(x=>/(customer|employee|owner|role|scope|tier|criteria|price|grant|priority|recommendation|phone|wechat|forwarded|^x-forwarded-)/.test(x))){
   send(res,403,{code:'MATCH_UNTRUSTED_REQUEST'});return true;
  }
  const token=req.headers.authorization,eventKey=req.headers['x-idempotency-key'];
  if(typeof token!=='string'||!/^Bearer [A-Za-z0-9_-]{43}$/.test(token)){
   send(res,401,{code:'EMPLOYEE_IDENTITY_REQUIRED'});return true;
  }
  if(typeof eventKey!=='string'||!/^[A-Za-z0-9_-]{24,64}$/.test(eventKey)){
   send(res,400,{code:'MATCH_IDEMPOTENCY_REQUIRED'});return true;
  }
  try{
   const out=await service.recompute({credential:token.slice(7),demandId:m[1],vehicleId:m[2],eventKey});
   send(res,out.status,out.body);
  }catch{send(res,503,{code:'MATCH_DATABASE_OR_FORMAL_SOURCE_NOT_READY'})}
  return true;
 };
}
