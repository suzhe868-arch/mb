// F06 非生产锁车业务 HTTP 入口。身份只允许可信服务端适配器注入，禁止由请求参数声明角色。
const send=(res,status,code,extra={})=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify({code,...extra}))};
const localhost=address=>['127.0.0.1','::1','::ffff:127.0.0.1'].includes(address);
const positiveId=value=>typeof value==='string'&&/^[1-9][0-9]{0,18}$/.test(value)&&BigInt(value)<=9223372036854775807n;
const allowedKeys=(o,keys)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).every(k=>keys.includes(k));
async function parseBody(req){
 if(req.headers['content-type']!=='application/json')return {error:'INVALID_CONTENT_TYPE'};
 if(req.headers['transfer-encoding'])return {error:'UNTRUSTED_TRANSFER_ENCODING'};
 const length=req.headers['content-length'];
 if(!/^[1-9][0-9]{0,3}$/.test(length||'')||Number(length)>4096)return {error:'INVALID_CONTENT_LENGTH'};
 let size=0;const chunks=[];
 for await(const chunk of req){size+=chunk.length;if(size>4096)return {error:'BODY_TOO_LARGE'};chunks.push(chunk)}
 if(size!==Number(length))return {error:'CONTENT_LENGTH_MISMATCH'};
 try {return {value:JSON.parse(Buffer.concat(chunks).toString('utf8'))}}catch{return {error:'INVALID_JSON'}}
}
export function createIsolatedF06LockHandler({service,env=process.env,lifecycleHandler=null}={}){
 if(env.APP_ENV!=='test'||env.NODE_ENV!=='test'||env.API_HOST!=='127.0.0.1'||env.F06_LOCK_TEST_CONSENT!=='I_AUTHORIZE_DISPOSABLE_F06_LOCK_PG16_ONLY')throw Error('F06_LOCK_TEST_ONLY');
 if(!service||typeof service.intake!=='function'||typeof service.decide!=='function')throw Error('F06_LOCK_DEPENDENCIES_REQUIRED');
 return async(req,res)=>{
  const path=req.url||'';
  if(lifecycleHandler&&await lifecycleHandler(req,res)===true)return true;
  if(!path.startsWith('/api/v1/lock-requests'))return false;
  const decide=/^\/api\/v1\/lock-requests\/([1-9][0-9]{0,18})\/decision$/.exec(path);
  const status=/^\/api\/v1\/lock-requests\/([1-9][0-9]{0,18})\/status$/.exec(path);
  if(path!=='/api/v1/lock-requests'&&!decide&&!status){send(res,404,'NOT_FOUND');return true}
  if(req.method!==(status?'GET':'POST')){send(res,405,'METHOD_NOT_ALLOWED');return true}
  if(!localhost(req.socket?.remoteAddress)||req.headers.host!==`127.0.0.1:${req.socket?.localPort}`||req.headers.cookie||req.headers['transfer-encoding']||
     Object.keys(req.headers).some(k=>/^(?:forwarded|x-forwarded-|x-customer-|x-employee-|x-role|x-scope|x-system-admin)/.test(k))){send(res,403,'UNTRUSTED_REQUEST');return true}
  if(typeof req.headers.authorization!=='string'||!/^Bearer [A-Za-z0-9_-]{43}$/.test(req.headers.authorization)){
   send(res,401,'TEST_IDENTITY_REQUIRED');return true;
  }
  // The Customer-safe status endpoint never accepts a request body or claimed actor scope.
  if(status){
   if(!positiveId(status[1])||(req.headers['content-length']&&req.headers['content-length']!=='0')){
    send(res,400,'INVALID_LOCK_STATUS_REQUEST');return true;
   }
   try{
    if(typeof service.project!=='function')throw Error('F06_LOCK_SAFE_PROJECTION_UNAVAILABLE');
    const result=await service.project({token:req.headers.authorization.slice(7),requestId:status[1]});
    if(!result||!Number.isInteger(result.status)||result.status<200||result.status>599||typeof result.body?.code!=='string')throw Error('INVALID_SERVICE_RESULT');
    send(res,result.status,result.body.code,Object.fromEntries(Object.entries(result.body).filter(([key])=>key!=='code')));
   }catch{send(res,503,'LOCK_SERVICE_UNAVAILABLE')}
   return true;
  }
  const parsed=await parseBody(req);
  if(parsed.error){send(res,400,parsed.error);return true}
  const body=parsed.value;
  if(!allowedKeys(body,decide?['decision','idempotencyKey']:['vehicleId','listingCycleId','idempotencyKey'])||
      !/^[A-Za-z0-9_-]{24,64}$/.test(body.idempotencyKey||'')||
      (decide?(!positiveId(decide[1])||!['approve','reject'].includes(body.decision)):
      (!positiveId(body.vehicleId)||!positiveId(body.listingCycleId)))){
    send(res,400,'INVALID_LOCK_REQUEST');return true;
  }
  try{
    const token=req.headers.authorization.slice(7);
    const result=decide?await service.decide({token,requestId:decide[1],decision:body.decision,idempotencyKey:body.idempotencyKey}):
       await service.intake({token,vehicleId:body.vehicleId,listingCycleId:body.listingCycleId,idempotencyKey:body.idempotencyKey});
    if(!result||!Number.isInteger(result.status)||result.status<200||result.status>599||!result.body||typeof result.body.code!=='string')throw Error('INVALID_SERVICE_RESULT');
    send(res,result.status,result.body.code,Object.fromEntries(Object.entries(result.body).filter(([key])=>key!=='code')));
  }catch {send(res,503,'LOCK_SERVICE_UNAVAILABLE')}
  return true;
 }
}