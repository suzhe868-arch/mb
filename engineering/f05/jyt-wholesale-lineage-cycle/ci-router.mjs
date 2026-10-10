// F05-3B: THREE contract routes, loopback TLS only. Never import from production server.
import {syncUpsert,syncBatchOffline,syncCurrent} from './contract.mjs';
import {verify} from './migration.mjs';
const ORIGIN='https://127.0.0.1:48985';
const base='/__ci__/f05-3b/v1/vehicles/';
const headers={'content-type':'application/json; charset=utf-8','cache-control':'private, no-store, max-age=0',
 'pragma':'no-cache','x-content-type-options':'nosniff','x-frame-options':'DENY','referrer-policy':'no-referrer'};
function send(res,status,body){res.writeHead(status,headers);res.end(JSON.stringify(body))}
function reject(res,status=403,code='F05_3B_CREDENTIAL_OR_API_DISABLED'){send(res,status,{code})}
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
 return async(req,res)=>{
  const raw=req.url||'';
  if(raw.length>2048||!raw.startsWith('/')||/%2e|%2f|%5c|%00|\\|\/\.\.?($|\/)|\/\//i.test(raw))
   return reject(res,400,'F05_3B_ROUTE_INVALID');
  let url;try{url=new URL(raw,ORIGIN)}catch{return reject(res,400,'F05_3B_URL_INVALID')}
  if(!url.pathname.startsWith(base)||url.origin!==ORIGIN||url.hash)
   return reject(res,404,'F05_3B_UNKNOWN_CONTRACT');
  const operation=url.pathname.slice(base.length);
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
