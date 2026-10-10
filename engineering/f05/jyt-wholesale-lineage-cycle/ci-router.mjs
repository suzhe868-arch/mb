// F05-3B: THREE contract routes, loopback TLS only. Never import from production server.
import {syncUpsert,syncBatchOffline,syncCurrent} from './contract.mjs';
import {verify} from './migration.mjs';
const ORIGIN='https://127.0.0.1:48985';
const base='/__ci__/f05-3b/v1/vehicles/';
const headers={'content-type':'application/json; charset=utf-8','cache-control':'private, no-store, max-age=0',
 'pragma':'no-cache','x-content-type-options':'nosniff','x-frame-options':'DENY','referrer-policy':'no-referrer'};
async function send(res,status,body){
 try{if(typeof res.f05b_log==='function')await res.f05b_log(status,body)}
 catch{status=503;body={code:'F05_3B_REQUIRED_AUDIT_UNAVAILABLE'}}
 res.writeHead(status,headers);res.end(JSON.stringify(body));
}
function reject(res,status=403,code='F05_3B_CREDENTIAL_OR_API_DISABLED'){return send(res,status,{code})}
const local=v=>['127.0.0.1','::1','::ffff:127.0.0.1'].includes(v);
async function body(req){
 const n=Number(req.headers['content-length']);
 if(!Number.isSafeInteger(n)||n<2||n>32768||req.headers['transfer-encoding'])
  throw Error('F05_3B_LENGTH_REJECTED');
 let size=0,buf='';
 for await(const part of req){size+=part.length;if(size>32768)throw Error('F05_3B_PAYLOAD_TOO_LARGE');buf+=part.toString('utf8')}
 if(size!==n)throw Error('F05_3B_PAYLOAD_SIZE_MISMATCH');
 const parsed=JSON.parse(buf);
 if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))throw Error('F05_3B_JSON_OBJECT_ONLY');
 return parsed;
}
export async function createJytSyncContractHandler(auth){
 for(const [k,v] of Object.entries({CI:'true',GITHUB_ACTIONS:'true',APP_ENV:'test',NODE_ENV:'test',
  F05_2_ISOLATION_CONFIRM:'I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY'}))
  if(process.env[k]!==v)throw Error('F05_3B_HTTP_CI_ONLY_'+k);
 if(!auth?.pool||!/^postgres:\/\/f03_ci:[^@]+@127\.0\.0\.1:5432\/f03_auth_test$/.test(process.env.F03_1_DATABASE_URL||''))
  throw Error('F05_3B_UNTRUSTED_DATABASE');
 await verify(auth.pool);
 let windowStart=Date.now(),windowCalls=0;
 return async(req,res)=>{
  let loggedAction='unknown',submittedCount=0;
  // Fail closed if the immutable invocation receipt cannot be committed.
  // Never store tokens, raw request bodies, caller IP, publisher phone or VIN.
  res.f05b_log=async(status,body)=>{
   const returnedCount=Array.isArray(body.items)?body.items.length:0;
   const processedCount=Number.isInteger(body.count)?body.count:
    status===200&&['F05_3B_IMPORTED','F05_3B_UPDATED','F05_3B_RELISTED','F05_3B_OFFLINED'].includes(body.code)?1:0;
   await auth.pool.query("INSERT INTO public.f05_3b_api_call_logs(action,method,http_status,actor_kind,submitted_count,returned_count,processed_count,result_code) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
    [loggedAction,['GET','POST'].includes(req.method)?req.method:'OTHER',status,status===200?'INTEGRATION':'SYSTEM',
     submittedCount,returnedCount,processedCount,String(body.code||'F05_3B_UNKNOWN').slice(0,120)]);
  };
  const now=Date.now();
  if(now-windowStart>=60000){windowStart=now;windowCalls=0}
  if(++windowCalls>200)return reject(res,429,'F05_3B_CI_LOOPBACK_RATE_LIMIT');
  const raw=req.url||'';
  if(raw.length>2048||!raw.startsWith('/')||/%2e|%2f|%5c|%00|\\|\/\.\.?($|\/)|\/\//i.test(raw))
   return reject(res,400,'F05_3B_ROUTE_INVALID');
  let url;try{url=new URL(raw,ORIGIN)}catch{return reject(res,400,'F05_3B_URL_INVALID')}
  if(!url.pathname.startsWith(base)||url.origin!==ORIGIN||url.hash)
   return reject(res,404,'F05_3B_UNKNOWN_CONTRACT');
  const operation=url.pathname.slice(base.length);
  if(['sync','offline','current'].includes(operation))
   loggedAction=operation==='sync'?'upsert':operation;
  if(!['sync','offline','current'].includes(operation))return reject(res,404,'F05_3B_UNKNOWN_CONTRACT');
  if((operation==='current'&&req.method!=='GET')||(operation!=='current'&&req.method!=='POST'))
   return reject(res,405,'F05_3B_METHOD_NOT_ALLOWED');
  if(!req.socket?.encrypted||!local(req.socket.remoteAddress)||req.headers.host!==new URL(ORIGIN).host||
     req.headers.origin!==ORIGIN||req.headers.cookie||req.headers['x-forwarded-for']||
     req.headers['x-employee-id']||req.headers['x-jyt-token']||
     Object.keys(req.headers).some(k=>/(publisher|owner|merchant|customer|vin|price|scope)/i.test(k)))
   return reject(res);
  const value=req.headers.authorization||'';
  const match=/^ApiKey (mbci_[a-zA-Z0-9_-]{43})$/.exec(value);
  if(!match)return reject(res);
  try{
   let args;
   if(operation==='current'){
    if(req.headers['content-length']&&req.headers['content-length']!=='0')return reject(res,400,'F05_3B_NO_GET_BODY');
    if([...url.searchParams.keys()].sort().join(',')!=='afterVehicleId,eventKey,limit')return reject(res,400,'F05_3B_PAGE_QUERY_INVALID');
    if([...url.searchParams.values()].some(v=>v.length>160))return reject(res,400,'F05_3B_PAGE_INPUT_LONG');
    args={afterVehicleId:Number(url.searchParams.get('afterVehicleId')),eventKey:url.searchParams.get('eventKey'),
     limit:Number(url.searchParams.get('limit'))};
   }else{
    if(url.search)return reject(res,400,'F05_3B_POST_QUERY_FORBIDDEN');
    if(req.headers['content-type']!=='application/json')return reject(res,415,'F05_3B_JSON_REQUIRED');
    args=await body(req);
   }
   submittedCount=operation==='offline'&&Array.isArray(args.carCodes)?Math.min(args.carCodes.length,50):operation==='sync'?1:0;
   const out=operation==='sync'?await syncUpsert(auth,match[1],args):
    operation==='offline'?await syncBatchOffline(auth,match[1],args):
    await syncCurrent(auth,match[1],args);
   if(!out.allowed)return reject(res,out.code.includes('CONFLICT')||out.code.includes('COLLISION')?409:403,out.code);
   send(res,200,Object.fromEntries(Object.entries(out).filter(([key])=>key!=='allowed')));
  }catch(e){
   send(res,400,{code:'F05_3B_REQUEST_REJECTED'});
  }
 };
}
