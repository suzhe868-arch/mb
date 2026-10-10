// Isolated F04-4 consumer contract adapter. Does not register production or execute new domain mutations.
import {verify as verifyM94} from '../../f03/runtime-transaction-responsible-handover/migration.mjs';
import {readSessionCookie} from '../../src/f03-auth-http.mjs';
import {constantMatch} from '../../src/f03-auth-crypto.mjs';
import {createCurrentRouteHandler} from '../current-action-api-registry/current-router.mjs';
import {verifyCoverage,loadIncremental} from './coverage-verify.mjs';
const ORIGIN='https://127.0.0.1:48983';
const HEADERS={'content-type':'application/json; charset=utf-8','cache-control':'no-store, private, max-age=0','pragma':'no-cache','x-frame-options':'DENY','x-content-type-options':'nosniff','referrer-policy':'no-referrer'};
const send=(res,status,code)=>{res.writeHead(status,HEADERS);res.end(JSON.stringify({code}))};
const local=x=>['127.0.0.1','::1','::ffff:127.0.0.1'].includes(x);
const candidates=loadIncremental().actions;
export const F04_4_CONSUMER_ACTION_COUNT=candidates.length;
export async function createCoverageConsumerHandler(auth,{readinessProbe=async()=>true}={}){
 for(const [k,v] of Object.entries({CI:'true',GITHUB_ACTIONS:'true',APP_ENV:'test',NODE_ENV:'test',F04_4_ISOLATION_CONFIRM:'I_AUTHORIZE_F04_4_DISPOSABLE_PG16_HTTPS_ONLY'}))
 if(process.env[k]!==v)throw Error('F04_4_STARTUP_ENV_DENIED_'+k);
 if(!/^postgres:\/\/f03_ci:[^@]+@127\.0\.0\.1:5432\/f03_auth_test$/.test(process.env.F03_1_DATABASE_URL||'')||
 auth?.origin!==ORIGIN||!auth.pool||typeof auth.withSession!=='function)throw Error('F04_4_STARTUP_ISOLATION_DENIED');
 verifyCoverage();
 const ready=async()=>await readinessProbe()===true&&(await verifyM94(auth.pool)).verified===true;
 if(!await ready())throw Error('F04_4_STARTUP_M94_SEAL_DENIED');
 const legacy=await createCurrentRouteHandler(auth,{readinessProbe});
 return async(req,res)=>{
  const raw=req.url||'';
  if(!raw.startsWith('/')||raw.length>2048||/%2e|%2f|%5c|%00|\\|\/\.\.?($|\/)|\/\//i.test(raw))
   return send(res,400,'F04_4_BAD_PATH');
  let u;try{u=new URL(raw,ORIGIN)}catch{return send(res,400,'F04_4_BAD_PATH')}
  if(u.origin!==ORIGIN)return send(res,400,'F04_4_BAD_PATH');
  if(!u.pathname.startsWith('/__ci__/current/v1/coverage/'))return legacy(req,res);
  const known=candidates.filter(a=>a.path===u.pathname);
  if(!known.length)return send(res,404,'F04_4_NOT_REGISTERED');
  const c=known.find(x=>x.method===req.method);
  if(!c)return send(res,405,'F04_4_METHOD_DENIED');
  if(!req.socket?.encrypted||!local(req.socket.remoteAddress)||
   req.headers.host!==new URL(ORIGIN).host||req.headers.origin!==ORIGIN)
    return send(res,403,'F04_4_AUTH_OR_SCOPE_DENIED');
  if(!await ready())return send(res,503,'F04_4_SCHEMA_SEAL_UNAVAILABLE');
  if(u.search||req.headers.authorization||req.headers['x-future-customer-auth-not-implemented'])
   return send(res,403,'F04_4_AUTH_OR_SCOPE_DENIED');
  if((req.headers['content-length']&&req.headers['content-length']!=='0')||req.headers['transfer-encoding'])
   return send(res,400,'F04_4_BODY_DENIED');
  let token;try{token=readSessionCookie(req.headers.cookie)}catch{return send(res,403,'F04_4_AUTH_OR_SCOPE_DENIED')}
  if(!token)return send(res,403,'F04_4_AUTH_OR_SCOPE_DENIED');
  const actor=await auth.withSession(token,async(_db,a,s)=>{
   if(s.restricted||a.force_password_change!==false||a.subject_status!=='active')return null;
   return {kind:a.principal_kind,role:a.role_code,employeeId:a.employee_id};
  },{normalOnly:true});
  if(!actor)return send(res,403,'F04_4_AUTH_OR_SCOPE_DENIED');
  // System Admin is not an Employee; no imagined 4S organizational scope or Customer session.
  if(c.actor==='SYSTEM_ADMIN'){
   if(actor.kind!=='system_admin')return send(res,403,'F04_4_AUTH_OR_SCOPE_DENIED');
  }else if(actor.kind!=='employee'||actor.role==='four_s')return send(res,403,'F04_4_AUTH_OR_SCOPE_DENIED');
  if(!['GET','HEAD'].includes(req.method)){
   const csrf=req.headers['x-csrf-token'];
   if(typeof csrf!=='string'||!constantMatch(csrf,auth.csrfFor(token)))return send(res,403,'F04_4_AUTH_OR_SCOPE_DENIED');
   if(!/^[A-Za-z0-9._:-]{12,90}$/.test(req.headers['x-request-key']||''))
    return send(res,403,'F04_4_AUTH_OR_SCOPE_DENIED');
  }
  // Authenticated identity alone DOES NOT prove capability/object scope. No new writes/real business.
  return send(res,501,'F04_4_DOMAIN_DEPENDENCY_BLOCKED');
 };
}
