// F04-3 Current新HTTP合同试验路由：只可非特权一次性PG16/HTTPS运行，绝不注册生产。
import {readSessionCookie} from '../../src/f03-auth-http.mjs';
import {constantMatch} from '../../src/f03-auth-crypto.mjs';
import {verify as verifyM94} from '../../f03/runtime-transaction-responsible-handover/migration.mjs';
import {createF04ContractHandler} from '../contract-gate/safe-router.mjs';
import {loadContracts,verifyCurrentRegistry} from './source-guard.mjs';
const ORIGIN='https://127.0.0.1:48983';
const HEADERS={'content-type':'application/json; charset=utf-8','cache-control':'no-store, private, max-age=0',
 'pragma':'no-cache','x-frame-options':'DENY','x-content-type-options':'nosniff',
 'referrer-policy':'no-referrer','strict-transport-security':'max-age=0'};
const send=(res,status,code,extra={})=>{res.writeHead(status,HEADERS);res.end(JSON.stringify({code,...extra}))};
const loopback=x=>['127.0.0.1','::1','::ffff:127.0.0.1'].includes(x);
const compiled=loadContracts().map(r=>({
 ...r,pattern:new RegExp('^'+r.path.replace(/[.*+?^$|()[\]\\]/g,'\\$&').replace(/\{customerId\}/g,'([1-9][0-9]{0,14})').replace(/\{lockRequestId\}/g,'([1-9][0-9]{0,14})')+'$')
}));
export const CURRENT_ROUTE_COUNT=compiled.length;
function gates(auth){
 for(const [k,v] of Object.entries({CI:'true',GITHUB_ACTIONS:'true',APP_ENV:'test',NODE_ENV:'test',
  F04_1_ISOLATION_CONFIRM:'I_AUTHORIZE_F04_1_DISPOSABLE_PG16_HTTPS_ONLY',
  F04_2_ISOLATION_CONFIRM:'I_AUTHORIZE_F04_2_DISPOSABLE_PG16_HTTPS_ONLY',
  F04_3_ISOLATION_CONFIRM:'I_AUTHORIZE_F04_3_DISPOSABLE_PG16_HTTPS_ONLY'}))
  if(process.env[k]!==v)throw Error('F04_3_STARTUP_ENV_DENIED_'+k);
 if(!/^postgres:\/\/f03_ci:[^@]+@127\.0\.0\.1:5432\/f03_auth_test$/.test(process.env.F03_1_DATABASE_URL||''))
   throw Error('F04_3_STARTUP_PG16_DENIED');
 if(!auth||auth.origin!==ORIGIN||!auth.pool||typeof auth.withSession!=='function')
   throw Error('F04_3_STARTUP_LOOPBACK_AUTH_DENIED');
}
export async function createCurrentRouteHandler(auth,{readinessProbe=async()=>true}={}){
 gates(auth);verifyCurrentRegistry();
 const ready=async()=>await readinessProbe()===true&&(await verifyM94(auth.pool)).verified===true;
 if(!await ready())throw Error('F04_3_STARTUP_SCHEMA_SEAL_DENIED');
 const prev=await createF04ContractHandler(auth,{readinessProbe});
 return async(req,res)=>{
  const raw=req.url||'';
  if(!raw.startsWith('/')||raw.length>2048||/\\|%2f|%5c|%2e|%00|\/\.\.?($|\/)|\/\//i.test(raw))
    return send(res,400,'F04_3_BAD_PATH');
  let u;try{u=new URL(raw,ORIGIN)}catch{return send(res,400,'F04_3_BAD_PATH')}
  if(u.origin!==ORIGIN)return send(res,400,'F04_3_BAD_PATH');
  if(!u.pathname.startsWith('/__ci__/current/v1/'))return send(res,404,'F04_3_NOT_REGISTERED');
  const matches=compiled.filter(x=>x.pattern.test(u.pathname));
  if(!matches.length)return send(res,404,'F04_3_NOT_REGISTERED');
  const route=matches.find(x=>x.method===req.method);
  if(!route)return send(res,405,'F04_3_METHOD_DENIED');
  if(req.socket?.encrypted!==true||!loopback(req.socket.remoteAddress)||
    req.headers.host!==new URL(ORIGIN).host||req.headers.origin!==ORIGIN)
    return send(res,403,'F04_3_TLS_ORIGIN_DENIED');
  if(!await ready())return send(res,503,'F04_3_SCHEMA_SEAL_UNAVAILABLE');
  if(u.search)return send(res,422,'F04_3_QUERY_NOT_ALLOWED');
  // CUSTOMER不是F03员工PC身份：合法客户会话尚未实现。未来认证Header和任何PC Cookie均不能授权此动作。
  if(route.authentication_contract==='CUSTOMER_AUTH_DEPENDENCY_BLOCKED')
    return send(res,403,'F04_3_CUSTOMER_AUTH_DEPENDENCY_BLOCKED');
  if(req.headers.authorization)return send(res,401,'F04_3_PC_COOKIE_REQUIRED');
  if((req.headers['content-length']&&req.headers['content-length']!=='0')||req.headers['transfer-encoding'])
    return send(res,400,'F04_3_BODY_NOT_AUTHORIZED');
  let token;try{token=readSessionCookie(req.headers.cookie)}catch{return send(res,400,'F04_3_COOKIE_INVALID')}
  if(!token)return send(res,401,'F04_3_PC_COOKIE_REQUIRED');
  const actor=await auth.withSession(token,async(_c,a,s)=>{
   if(s.restricted||a.force_password_change!==false||a.subject_status!=='active')return null;
   return {kind:a.principal_kind,role:a.role_code,employeeId:a.employee_id};
  },{normalOnly:true});
  if(!actor)return send(res,401,'F04_3_SESSION_REVOKED');
  // System Admin真实控制平面：与员工业务身份不可互换；当前缺目标治理授权/商户绑定事实，所以两类均不修改账号。
  if(route.authentication_contract==='SYSTEM_ADMIN_CONTROL_PLANE_PC'){
    if(actor.kind!=='system_admin')return send(res,403,'F04_3_SYSTEM_ADMIN_CONTROL_PLANE_DENIED');
    return send(res,403,'F04_3_CONTROL_PLANE_TARGET_UNPROVEN');
  }
  if(actor.kind!=='employee'||actor.role==='four_s')
    return send(res,403,'F04_3_BUSINESS_PRINCIPAL_DENIED');
  // 角色/职位本身不授员工管理或业务配置能力。缺准确PG16 target、capability、data scope的动作在本包保持硬拒。
  if(route.authentication_contract==='MANAGER_CAPABILITY_SCOPE_REQUIRED'||
     route.authentication_contract==='BUSINESS_CONTENT_MANAGER_CAPABILITY_REQUIRED')
    return send(res,403,'F04_3_MANAGER_CAPABILITY_SCOPE_UNPROVEN');
  if(!['GET','HEAD'].includes(req.method)){
   const csrf=req.headers['x-csrf-token'];
   if(typeof csrf!=='string'||!constantMatch(csrf,auth.csrfFor(token)))
     return send(res,403,'F04_3_CSRF_DENIED');
   const key=req.headers['x-request-key'];
   if(typeof key!=='string'||!/^[A-Za-z0-9._:-]{12,90}$/.test(key))
     return send(res,422,'F04_3_REQUEST_KEY_DENIED');
  }
  if(route.intent==='CRM_SCOPE_MINIMAL_PROOF'){
   const id=u.pathname.match(route.pattern)?.[1];
   if(!id||!Number.isSafeInteger(Number(id)))return send(res,422,'F04_3_INVALID_TARGET');
   const original=req.url;
   try{req.url='/api/v1/f04/customers/'+id;return await prev(req,res)}
   finally{req.url=original}
  }
  // 只有已验收F04-1的精准scope最小CustomerId读取允许合成200；
  // 其它动作即使Source有依据也没有下游实体实现，不准假成功/假写。
  return send(res,501,'F04_3_DEPENDENCY_BLOCKED');
 };
}
