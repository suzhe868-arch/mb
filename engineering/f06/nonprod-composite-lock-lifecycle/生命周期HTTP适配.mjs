// Issue171 private Composite Loopback HTTP adapter, never a public/production route.
const positiveId=x=>typeof x==='string'&&/^[1-9][0-9]{0,18}$/.test(x)&&BigInt(x)<=9223372036854775807n;
const validKey=x=>typeof x==='string'&&/^[A-Za-z0-9_-]{24,64}$/.test(x);
const validReason=x=>typeof x==='string'&&x.trim().length>0&&x.trim().length<=240;
const validIso=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(x)&&!Number.isNaN(Date.parse(x))&&new Date(x).toISOString()===x;
const write=(res,status,body)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify({...body,productionReady:false}))};
export function createCompositeLifecycleHandler({service,env=process.env}={}){
 if(!service||typeof service.act!=='function')throw Error('F06_171_LIFECYCLE_SERVICE_MISSING');
 if(env.APP_ENV!=='test'||env.NODE_ENV!=='test'||env.API_HOST!=='127.0.0.1')
  throw Error('F06_171_TEST_ONLY');
 return async(req,res)=>{
  const pathname=String(req.url||'').split('?')[0];
  const match=/^\/__nonprod__\/f06-composite\/locks\/([1-9][0-9]{0,18})\/actions$/.exec(pathname);
  if(!match)return false;
  if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket?.remoteAddress)||
    req.headers.host!=="127.0.0.1:"+req.socket?.localPort||
    req.headers.cookie||req.headers['transfer-encoding']||
    Object.keys(req.headers).some(k=>/^(forwarded|x-forwarded-|x-customer-|x-employee-|x-role|x-scope|x-system-admin|x-issuer|x-trusted)/.test(k))){
   write(res,403,{code:'F06_171_UNTRUSTED_REQUEST'});return true
  }
  if(req.method!=='POST'){write(res,405,{code:'METHOD_NOT_ALLOWED'});return true}
  if(typeof req.headers.authorization!=='string'||!/^Bearer [A-Za-z0-9_-]{43}$/.test(req.headers.authorization)){
   write(res,401,{code:'TEST_EMPLOYEE_IDENTITY_REQUIRED'});return true
  }
  if(req.headers['content-type']!=='application/json'||!/^([1-9][0-9]{0,3})$/.test(req.headers['content-length']||'')||
    Number(req.headers['content-length'])>4096){write(res,400,{code:'INVALID_HTTP_BODY'});return true}
  const chunks=[];let count=0;
  for await(const chunk of req){count+=chunk.length;if(count>4096){write(res,400,{code:'HTTP_BODY_TOO_LARGE'});return true}chunks.push(chunk)}
  if(count!==Number(req.headers['content-length'])){write(res,400,{code:'HTTP_LENGTH_MISMATCH'});return true}
  let body;try{body=JSON.parse(Buffer.concat(chunks).toString('utf8'))}catch{write(res,400,{code:'INVALID_JSON'});return true}
  const extend=body?.action==='extend';
  if(!body||typeof body!=='object'||Array.isArray(body)||
    Object.keys(body).some(k=>!(extend?['action','idempotencyKey','reason','newExpiresAt']:['action','idempotencyKey','reason']).includes(k))||
    !['extend','release','cancel'].includes(body.action)||!validKey(body.idempotencyKey)||!validReason(body.reason)||
    (extend?!validIso(body.newExpiresAt):Object.hasOwn(body,'newExpiresAt'))||!positiveId(match[1])){
   write(res,400,{code:'INVALID_LOCK_LIFECYCLE_ACTION'});return true
  }
  try{
   const result=await service.act({token:req.headers.authorization.slice(7),lockId:match[1],action:body.action,
    idempotencyKey:body.idempotencyKey,reason:body.reason,...(extend?{newExpiresAt:body.newExpiresAt}:{})});
   write(res,result.status,result.body);
  }catch(error){
   if(env.F06_COMPOSITE_DEBUG_ERRORS==='1')console.error('F06_171_LIFECYCLE_DENY',String(error?.message||'').slice(0,200));
   write(res,503,{code:'F06_171_SIGNED_SOURCE_GAP'});
  }
  return true;
 };
}
