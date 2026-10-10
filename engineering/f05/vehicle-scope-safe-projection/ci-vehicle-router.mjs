// F05-1 sealed CI-only physical Vehicle projection safety endpoint. Never registered in production.
import {verify as verifyM94} from '../../f03/runtime-transaction-responsible-handover/migration.mjs';
import {readSessionCookie} from '../../src/f03-auth-http.mjs';
import {createCoverageConsumerHandler} from '../../f04/current-action-coverage-gate/consumer-router.mjs';
import {verifyPhysicalSource,verifyLiveM94,proveCurrentVehicleScope,sourceTypes,outlets} from './source-verifier.mjs';
const ORIGIN='https://127.0.0.1:48983';
const HEADERS={'content-type':'application/json; charset=utf-8','cache-control':'no-store, private, max-age=0',
 'pragma':'no-cache','x-frame-options':'DENY','x-content-type-options':'nosniff','referrer-policy':'no-referrer','strict-transport-security':'max-age=0'};
const send=(res,status,code)=>{res.writeHead(status,HEADERS);res.end(JSON.stringify({code}))};
const isLocal=x=>['127.0.0.1','::1','::ffff:127.0.0.1'].includes(x);
const exact=Object.freeze({CI:'true',GITHUB_ACTIONS:'true',APP_ENV:'test',NODE_ENV:'test',
 F05_1_ISOLATION_CONFIRM:'I_AUTHORIZE_F05_1_DISPOSABLE_PG16_HTTPS_ONLY'});
export const VEHICLE_OUTLETS=outlets;
export async function createF05VehicleProjectionHandler(auth,{readinessProbe=async()=>true}={}){
 for(const [k,v] of Object.entries(exact))if(process.env[k]!==v)throw Error('F05_1_CI_ONLY_STARTUP_'+k);
 if(!auth||auth.origin!==ORIGIN||!auth.pool||typeof auth.withSession!=='function'||
  !/^postgres:\/\/f03_ci:[^@]+@127\.0\.0\.1:5432\/f03_auth_test$/.test(process.env.F03_1_DATABASE_URL||''))
    throw Error('F05_1_ISOLATION_STARTUP_DENIED');
 verifyPhysicalSource();
 const ready=async()=>await readinessProbe()===true&&(await verifyLiveM94(auth.pool)).verified===true;
 if(!await ready())throw Error('F05_1_SCHEMA_SEAL_STARTUP_DENIED');
 const old=await createCoverageConsumerHandler(auth,{readinessProbe});
 return async function handler(req,res){
  const raw=req.url||'';
  if(!raw.startsWith('/')||raw.length>2048||/%2e|%2f|%5c|%00|\\|\/\.\.?($|\/)|\/\//i.test(raw))
    return send(res,400,'F05_INVALID_PATH');
  let url;try{url=new URL(raw,ORIGIN)}catch{return send(res,400,'F05_INVALID_PATH')}
  if(url.origin!==ORIGIN)return send(res,400,'F05_INVALID_PATH');
  if(!url.pathname.startsWith('/__ci__/f05/v1/'))return old(req,res);
  const match=/^\/__ci__\/f05\/v1\/vehicles\/([1-9][0-9]{0,14})\/(detail|list|export|copy|cache|print|history)$/.exec(url.pathname);
  if(!match)return send(res,404,'F05_UNKNOWN_VEHICLE_ROUTE');
  if(req.method!=='GET')return send(res,405,'F05_METHOD_DENIED');
  if(!req.socket?.encrypted||!isLocal(req.socket.remoteAddress)||
     req.headers.host!==new URL(ORIGIN).host||req.headers.origin!==ORIGIN)
     return send(res,403,'F05_VEHICLE_SCOPE_UNPROVEN');
  if(!await ready())return send(res,503,'F05_SCHEMA_UNAVAILABLE');
  const id=Number(match[1]),view=match[2];
  if(!Number.isSafeInteger(id)||id<1||!outlets.includes(view))
    return send(res,422,'F05_TARGET_INVALID');
  if(url.search||req.headers.authorization||
    Object.keys(req.headers).some(k=>/(merchant|team|owner|role|level|price|publisher|vin|customer|scope|export-token|forwarded)/i.test(k)))
    return send(res,403,'F05_VEHICLE_SCOPE_UNPROVEN');
  if(req.headers['content-length']&&req.headers['content-length']!=='0'||req.headers['transfer-encoding'])
    return send(res,400,'F05_BODY_NOT_ALLOWED');
  let token;try{token=readSessionCookie(req.headers.cookie)}catch{return send(res,403,'F05_SESSION_INVALID')}
  if(!token)return send(res,403,'F05_SESSION_INVALID');
  let actor;
  try{
   actor=await auth.withSession(token,async(db,a,s)=>{
    if(s.restricted||a.force_password_change!==false||a.credential_state!=='enabled'||
       a.subject_status!=='active'||a.principal_kind!=='employee'||a.system_admin_id!==null||
       a.role_code==='four_s')return null;
    return {employeeId:Number(a.employee_id),kind:a.principal_kind};
   },{normalOnly:true});
  }catch{return send(res,403,'F05_SESSION_INVALID')}
  if(!actor)return send(res,403,'F05_VEHICLE_SCOPE_UNPROVEN');
  // Test the true current physical vehicle/cycle in a read-only transaction.
  // The source M94 is not signed for Vehicle-to-Team/4S trusted ownership.
  // Consequently even a legal Employee PC session cannot receive business Vehicle fields.
  const db=await auth.pool.connect();
  try{
   await db.query('BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED READ ONLY');
   try{
    const result=await proveCurrentVehicleScope(db,actor,{vehicleId:id,outlet:view});
    if(result.proven===true)throw Error('F05_1_UNEXPECTED_SCOPE_ALLOW_UNIMPLEMENTED');
   }finally{await db.query('ROLLBACK')}
  }finally{db.release()}
  return send(res,403,'F05_VEHICLE_SCOPE_UNPROVEN');
 };
}
