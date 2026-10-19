// PDM-11 disposable only. Customer identity must come from DB-backed bearer.
const send=(res,status,body)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'private, no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify(body))};
const local=x=>['127.0.0.1','::1','::ffff:127.0.0.1'].includes(x);
export function createIsolatedFindCarHandler(service,env=process.env){
 if(!service||typeof service.action!=='function'||env.APP_ENV!=='test'||env.NODE_ENV!=='test'||
 env.API_HOST!=='127.0.0.1'||env.F05_CATALOG_TEST_CONSENT!=='I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY')
 throw Error('FIND_CAR_FORMAL_ISSUER_NOT_AVAILABLE');
 return async(req,res)=>{
  const path=req.url??'';
  if(!path.startsWith('/api/v1/catalog/find-car/applications'))return false;
  if(path.length>256||path.includes('?')||path.includes('#')||/%|\\|\0/.test(path)){send(res,400,{code:'FIND_CAR_INVALID_PATH'});return true}
  const create=path==='/api/v1/catalog/find-car/applications';
  const edit=/^\/api\/v1\/catalog\/find-car\/applications\/([1-9][0-9]{0,18})$/.exec(path);
  const withdraw=/^\/api\/v1\/catalog\/find-car\/applications\/([1-9][0-9]{0,18})\/withdraw$/.exec(path);
  if(!create&&!edit&&!withdraw){send(res,400,{code:'FIND_CAR_INVALID_PATH'});return true}
  const kind=create?'CREATE':edit?'EDIT':'WITHDRAW';
  if(req.method!==(kind==='EDIT'?'PATCH':'POST')){send(res,405,{code:'METHOD_NOT_ALLOWED'});return true}
  if(!local(req.socket?.remoteAddress)||req.headers.host!=='127.0.0.1:'+req.socket?.localPort||
    req.headers.cookie||req.headers['transfer-encoding']||
    Object.keys(req.headers).some(x=>/(customer|employee|owner|role|scope|level|phone|entitlement|demand|priority|forwarded|^x-forwarded-)/.test(x))){
   send(res,403,{code:'FIND_CAR_UNTRUSTED_REQUEST'});return true;
  }
  const auth=req.headers.authorization,eventKey=req.headers['x-idempotency-key'];
  if(typeof auth!=='string'||!/^Bearer [A-Za-z0-9_-]{43}$/.test(auth)){send(res,401,{code:'CUSTOMER_IDENTITY_REQUIRED'});return true}
  if(typeof eventKey!=='string'||!/^[A-Za-z0-9_-]{24,64}$/.test(eventKey)){send(res,400,{code:'FIND_CAR_IDEMPOTENCY_REQUIRED'});return true}
  if(kind!=='WITHDRAW'&&req.headers['content-type']!=='application/json'){
   send(res,415,{code:'FIND_CAR_JSON_REQUIRED'});return true;
  }
  if(req.headers['content-length']&&(!/^[0-9]+$/.test(req.headers['content-length'])||Number(req.headers['content-length'])>(kind==='WITHDRAW'?0:4096))){
   send(res,413,{code:'FIND_CAR_BODY_TOO_LARGE'});return true;
  }
  try{
   let body=null;
   if(kind!=='WITHDRAW'){
    const parts=[];let size=0;
    for await(const chunk of req){
     size+=chunk.length;if(size>4096){send(res,413,{code:'FIND_CAR_BODY_TOO_LARGE'});return true}
     parts.push(chunk);
    }
    try{body=JSON.parse(Buffer.concat(parts).toString('utf8'))}
    catch{send(res,400,{code:'FIND_CAR_INVALID_JSON'});return true}
    const fields=kind==='CREATE'?'budgetMaxCents,originalText':'budgetMaxCents,expectedRevision,originalText';
    if(!body||Array.isArray(body)||typeof body!=='object'||Object.keys(body).sort().join(',')!==fields){
     send(res,400,{code:'FIND_CAR_UNEXPECTED_FIELDS'});return true;
    }
   }
   const r=await service.action({credential:auth.slice(7),eventKey,kind,
    applicationId:edit?.[1]??withdraw?.[1]??null,
    originalText:body?.originalText??null,budgetMaxCents:body?.budgetMaxCents??null,
    expectedRevision:kind==='EDIT'?body.expectedRevision:null});
   send(res,r.status,r.body);
  }catch{send(res,503,{code:'FIND_CAR_DEPENDENCY_NOT_READY'})}
  return true;
 };
}
