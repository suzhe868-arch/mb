// F05-3A independently isolated loopback TLS GET. Not mounted in production server.
import {readSessionCookie} from '../../src/f03-auth-http.mjs';
import {verify} from './migration.mjs';
import {readFourSMemberMinimalVehicle} from './source-gate.mjs';
const ORIGIN='https://127.0.0.1:48983';
const headers={'content-type':'application/json; charset=utf-8','cache-control':'private, no-store, max-age=0',
 'pragma':'no-cache','strict-transport-security':'max-age=0','x-content-type-options':'nosniff',
 'x-frame-options':'DENY','referrer-policy':'no-referrer'};
const send=(res,status,p)=>{res.writeHead(status,headers);res.end(JSON.stringify(p))};
const denied=(res,status=403)=>send(res,status,{code:'F05_VEHICLE_SCOPE_UNPROVEN'});
const local=x=>['127.0.0.1','::1','::ffff:127.0.0.1'].includes(x);
export async function createFourSMemberVehicleHandler(auth){
 for(const [k,v] of Object.entries({CI:'true',GITHUB_ACTIONS:'true',APP_ENV:'test',NODE_ENV:'test',
  F05_2_ISOLATION_CONFIRM:'I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY'}))
  if(process.env[k]!==v)throw Error('F05_3A_HTTP_CI_ONLY_'+k);
 if(auth?.origin!==ORIGIN||!auth.pool||typeof auth.withSession!=='function'||
    !/^postgres:\/\/f03_ci:[^@]+@127\.0\.0\.1:5432\/f03_auth_test$/.test(process.env.F03_1_DATABASE_URL||''))
  throw Error('F05_3A_HTTP_TARGET_DENIED');
 await verify(auth.pool);
 return async(req,res)=>{
  const raw=req.url||'';
  if(raw.length>2048||!raw.startsWith('/')||/%2e|%2f|%5c|%00|\\|\/\.\.?($|\/)|\/\//i.test(raw))return denied(res,400);
  let url;try{url=new URL(raw,ORIGIN)}catch{return denied(res,400)}
  if(url.origin!==ORIGIN||url.search||url.hash)return denied(res);
  const match=/^\/__ci__\/f05-3a\/v1\/vehicles\/([1-9][0-9]{0,14})\/(detail|list|export|copy|cache|print|history)$/.exec(url.pathname);
  if(!match)return denied(res,404);
  if(req.method!=='GET')return denied(res,405);
  if(!req.socket?.encrypted||!local(req.socket.remoteAddress)||req.headers.host!==new URL(ORIGIN).host||
     req.headers.origin!==ORIGIN||req.headers.authorization||req.headers['transfer-encoding']||
     req.headers['content-length']&&req.headers['content-length']!=='0'||
     Object.keys(req.headers).some(k=>/(merchant|team|owner|role|level|price|publisher|vin|customer|scope|forwarded)/i.test(k)))
   return denied(res);
  if(match[2]!=='detail')return denied(res);
  let token;try{token=readSessionCookie(req.headers.cookie)}catch{return denied(res)}
  if(!token)return denied(res);
  try{
   const x=await readFourSMemberMinimalVehicle(auth,token,{vehicleId:Number(match[1]),outlet:'detail'});
   if(!x.allowed||x.code!=='F05_3A_MEMBER_MINIMAL_VEHICLE')return denied(res);
   return send(res,200,{code:x.code,vehicleId:x.vehicleId,listingCycleId:x.listingCycleId,sourceKind:x.sourceKind});
  }catch{return denied(res)}
 };
}
