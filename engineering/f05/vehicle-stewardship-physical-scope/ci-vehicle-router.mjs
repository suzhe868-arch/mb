// F05-2: isolated loopback HTTPS contract only. NEVER imported by production server.
import {readSessionCookie} from '../../src/f03-auth-http.mjs';
import {verify} from './migration.mjs';
import {readMinimalCurrentVehicle} from './service.mjs';
const ORIGIN='https://127.0.0.1:48983';
const headers={'content-type':'application/json; charset=utf-8',
 'cache-control':'private, no-store, max-age=0','pragma':'no-cache',
 'strict-transport-security':'max-age=0','x-content-type-options':'nosniff',
 'x-frame-options':'DENY','referrer-policy':'no-referrer'};
const send=(res,status,payload)=>{res.writeHead(status,headers);res.end(JSON.stringify(payload))};
const no=(res,status=403)=>send(res,status,{code:'F05_VEHICLE_SCOPE_UNPROVEN'});
const localhost=x=>['127.0.0.1','::1','::ffff:127.0.0.1'].includes(x);
export async function createF052VehicleHandler(auth){
 for(const [k,v] of Object.entries({CI:'true',GITHUB_ACTIONS:'true',APP_ENV:'test',NODE_ENV:'test',
  F05_2_ISOLATION_CONFIRM:'I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY'}))
  if(process.env[k]!==v)throw Error('F05_2_HTTP_PRODUCTION_DENIED');
 if(!auth||auth.origin!==ORIGIN||!auth.pool||typeof auth.withSession!=='function'||
    !/^postgres:\/\/f03_ci:[^@]+@127\.0\.0\.1:5432\/f03_auth_test$/.test(process.env.F03_1_DATABASE_URL||''))
   throw Error('F05_2_HTTP_TARGET_DENIED');
 await verify(auth.pool);
 return async(req,res)=>{
  const raw=req.url||'';
  if(raw.length>2048||!raw.startsWith('/')||/%2e|%2f|%5c|%00|\\|\/\.\.?($|\/)|\/\//i.test(raw))return no(res,400);
  let path;try{path=new URL(raw,ORIGIN)}catch{return no(res,400)}
  if(path.origin!==ORIGIN||path.search||path.hash)return no(res,403);
  const match=/^\/__ci__\/f05-2\/v1\/vehicles\/([1-9][0-9]{0,14})\/(detail|list|export|copy|cache|print|history)$/.exec(path.pathname);
  if(!match)return no(res,404);
  if(req.method!=='GET')return no(res,405);
  if(!req.socket?.encrypted||!localhost(req.socket.remoteAddress)||
    req.headers.host!==new URL(ORIGIN).host||req.headers.origin!==ORIGIN||
    req.headers.authorization||req.headers['transfer-encoding']||
    req.headers['content-length']&&req.headers['content-length']!=='0'||
    Object.keys(req.headers).some(k=>/(merchant|team|owner|role|level|price|publisher|vin|customer|scope|forwarded)/i.test(k)))
    return no(res,403);
  if(match[2]!=='detail')return no(res,403);
  let token;try{token=readSessionCookie(req.headers.cookie)}catch{return no(res)}
  if(!token)return no(res);
  try{
   const result=await readMinimalCurrentVehicle(auth,token,{vehicleId:Number(match[1]),outlet:'detail'});
   if(!result.allowed||result.code!=='F05_2_MINIMAL_VEHICLE')return no(res);
   return send(res,200,{code:result.code,vehicleId:result.vehicleId,listingCycleId:result.listingCycleId,sourceKind:result.sourceKind});
  }catch{return no(res)}
 };
}
