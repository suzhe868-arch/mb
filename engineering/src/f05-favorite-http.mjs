// Actual application HTTP route, test-only Customer actor from isolated PG16 session.
// Refuses Cookie, arbitrary actor headers, unsafe body and any non-loopback request.
const send=(res,status,body)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'private, no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify(body))};
const isLocal=s=>['127.0.0.1','::1','::ffff:127.0.0.1'].includes(s);
export function createIsolatedFavoriteHandler(service,env=process.env){
 if(!service||typeof service.read!=='function'||typeof service.change!=='function'||env.APP_ENV!=='test'||env.NODE_ENV!=='test'||env.API_HOST!=='127.0.0.1'||env.F05_CATALOG_TEST_CONSENT!=='I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY')throw Error('F05_FAVORITE_NOT_ISOLATED');
 return async(req,res)=>{
  const raw=req.url??'';
  if(!raw.startsWith('/api/v1/catalog/vehicles/')||!raw.split('?')[0].endsWith('/favorite'))return false;
  if(raw.length>256||raw.includes('?')||raw.includes('#')||/%|\\|\0/.test(raw)) {send(res,400,{code:'INVALID_FAVORITE_PATH'});return true}
  const match=/^\/api\/v1\/catalog\/vehicles\/([1-9][0-9]{0,18})\/favorite$/.exec(raw);
  if(!match){send(res,400,{code:'INVALID_FAVORITE_PATH'});return true}
  if(!['GET','POST','DELETE'].includes(req.method)){send(res,405,{code:'METHOD_NOT_ALLOWED'});return true}
  if(!isLocal(req.socket?.remoteAddress)||req.headers.host!=='127.0.0.1:'+req.socket?.localPort||
    req.headers.cookie||req.headers['x-customer-id']||req.headers['x-employee-id']||req.headers['x-owner-id']||
    req.headers['x-role']||req.headers['x-scope']||req.headers['x-wechat-openid']||
    Object.keys(req.headers).some(x=>/^(?:forwarded|x-forwarded-)/.test(x))||
    req.headers['transfer-encoding']||(req.headers['content-length']&&req.headers['content-length']!=='0')){
    send(res,403,{code:'FAVORITE_UNTRUSTED_REQUEST'});return true;
  }
  const auth=req.headers.authorization;
  if(typeof auth!=='string'||!/^Bearer [A-Za-z0-9_-]{43}$/.test(auth)){send(res,401,{code:'FAVORITE_TEST_CUSTOMER_IDENTITY_REQUIRED'});return true}
  if(req.method!=='GET'&&(typeof req.headers['x-idempotency-key']!=='string'||!/^[A-Za-z0-9_-]{24,64}$/.test(req.headers['x-idempotency-key']))){
    send(res,400,{code:'INVALID_IDEMPOTENCY_KEY'});return true;
  }
  try{
   const params={token:auth.slice(7),vehicleId:match[1]};
   const result=req.method==='GET'?await service.read(params):await service.change({...params,action:req.method==='POST'?'ADD':'REMOVE',eventKey:req.headers['x-idempotency-key']});
   send(res,result.status,result.body);
  }catch{send(res,503,{code:'FAVORITE_DATABASE_UNAVAILABLE'})}
  return true;
 };
}
