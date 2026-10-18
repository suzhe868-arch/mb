// PDM10 automatic DETAIL-entry backend operation; NEVER list prefetch, and NOT a second tap.
// It is not independently proof that a browser really navigated; only a signed customer issuer can provide that.
const send=(res,status,body)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'private, no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify(body))};
const local=x=>['127.0.0.1','::1','::ffff:127.0.0.1'].includes(x);
export function createIsolatedPriceUnlockHandler(service,env=process.env){
 if(!service||typeof service.openDetail!=='function'||env.APP_ENV!=='test'||env.NODE_ENV!=='test'||env.API_HOST!=='127.0.0.1'||env.F05_CATALOG_TEST_CONSENT!=='I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY')throw Error('PRICE_DETAIL_FORMAL_ISSUER_REQUIRED');
 return async(req,res)=>{
  const path=req.url||'';
  if(!path.startsWith('/api/v1/catalog/vehicles/')||!path.split('?')[0].endsWith('/customer-detail-entry'))return false;
  if(path.length>256||path.includes('?')||path.includes('#')||/%|\\|\0/.test(path)){send(res,400,{code:'INVALID_DETAIL_ENTRY_PATH'});return true}
  const match=/^\/api\/v1\/catalog\/vehicles\/([1-9][0-9]{0,18})\/customer-detail-entry$/.exec(path);
  if(!match){send(res,400,{code:'INVALID_DETAIL_ENTRY_PATH'});return true}
  if(req.method!=='POST'){send(res,405,{code:'METHOD_NOT_ALLOWED'});return true}
  if(!local(req.socket?.remoteAddress)||req.headers.host!=='127.0.0.1:'+req.socket?.localPort||
   req.headers.cookie||req.headers['transfer-encoding']||
   (req.headers['content-length']&&req.headers['content-length']!=='0')||
   Object.keys(req.headers).some(h=>/(customer|employee|owner|role|scope|phone|wechat|price|quota|entitlement|level|forwarded|^x-forwarded-)/.test(h))){
   send(res,403,{code:'PRICE_UNTRUSTED_REQUEST'});return true;
  }
  const auth=req.headers.authorization,k=req.headers['x-idempotency-key'];
  if(typeof auth!=='string'||!/^Bearer [A-Za-z0-9_-]{43}$/.test(auth)){send(res,401,{code:'CUSTOMER_IDENTITY_REQUIRED'});return true}
  if(typeof k!=='string'||!/^[A-Za-z0-9_-]{24,64}$/.test(k)){send(res,400,{code:'PRICE_IDEMPOTENCY_KEY_REQUIRED'});return true}
  try{
   const r=await service.openDetail({token:auth.slice(7),vehicleId:match[1],eventKey:k});
   send(res,r.status,r.body);
  }catch{send(res,503,{code:'PRICE_DISPLAY_FACT_OR_DATABASE_NOT_READY'})}
  return true;
 };
}
