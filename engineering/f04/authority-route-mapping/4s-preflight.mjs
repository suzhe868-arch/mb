// F04-2 System Admin -> 4S account candidate: CI-only HTTPS read-only preflight.
// No credential, personal record, store, dealer or business state is ever written.
import {createF04ContractHandler} from '../contract-gate/safe-router.mjs';
import {readSessionCookie} from '../../src/f03-auth-http.mjs';
import {verify as verifyM94} from '../../f03/runtime-transaction-responsible-handover/migration.mjs';
const origin='https://127.0.0.1:48982';
const SELF='/api/v1/f04/4s/governance-self';
const TARGET=/^\/api\/v1\/f04\/4s\/accounts\/([1-9][0-9]{0,14})\/preflight$/;
const noCache={'content-type':'application/json; charset=utf-8','cache-control':'private, no-store, max-age=0',
  'pragma':'no-cache','x-content-type-options':'nosniff','x-frame-options':'DENY','referrer-policy':'no-referrer'};
const send=(res,status,code,extra={})=>{res.writeHead(status,noCache);res.end(JSON.stringify({code,...extra}))};
const isLoopback=x=>['127.0.0.1','::1','::ffff:127.0.0.1'].includes(x);
const needEnv=()=>{for(const [k,v] of Object.entries({
  CI:'true',GITHUB_ACTIONS:'true',APP_ENV:'test',NODE_ENV:'test',
  F04_1_ISOLATION_CONFIRM:'I_AUTHORIZE_F04_1_DISPOSABLE_PG16_HTTPS_ONLY',
  F04_2_ISOLATION_CONFIRM:'I_AUTHORIZE_F04_2_DISPOSABLE_PG16_HTTPS_ONLY'
}))if(process.env[k]!==v)throw Error('F04_2_STARTUP_ENV_DENIED_'+k);
if(!/^postgres:\/\/f03_ci:[^@]+@127\.0\.0\.1:5432\/f03_auth_test$/.test(process.env.F03_1_DATABASE_URL||''))
 throw Error('F04_2_STARTUP_PG16_IDENTITY_DENIED');
};
export const F04_2_PRECHECK_CONTRACT=Object.freeze([
 {method:'GET',path:SELF,actor:'system_admin',response:'F04_4S_GOVERNANCE_AUTHENTICATED'},
 {method:'GET',path:'/api/v1/f04/4s/accounts/{employeeId}/preflight',actor:'system_admin',response:'F04_4S_ACCOUNT_SCOPE_UNPROVEN'}
]);
export async function createF04_2Preflight(auth,{readinessProbe=async()=>true}={}){
 needEnv();
 if(!auth||auth.origin!==origin||!auth.pool||typeof auth.withSession!=='function')
  throw Error('F04_2_STARTUP_LOOPBACK_SESSION_DENIED');
 if(await readinessProbe()!==true||(await verifyM94(auth.pool)).verified!==true)
  throw Error('F04_2_STARTUP_M94_SEAL_DENIED');
 const old=await createF04ContractHandler(auth,{readinessProbe});
 return async(req,res)=>{
  const raw=req.url||'';
  if(!raw.startsWith('/')||raw.length>2048)return send(res,400,'F04_2_BAD_PATH');
  let parsed;
  try{parsed=new URL(raw,auth.origin)}catch{return send(res,400,'F04_2_BAD_PATH')}
  if(parsed.origin!==auth.origin)return send(res,400,'F04_2_BAD_ORIGIN');
  const path=parsed.pathname,match=path.match(TARGET);
  if(path!==SELF&&!match)return old(req,res);
  if(req.method!=='GET')return send(res,405,'METHOD_NOT_ALLOWED');
  if(parsed.search)return send(res,422,'F04_2_BAD_DTO');
  if(req.socket?.encrypted!==true||!isLoopback(req.socket.remoteAddress)||
    req.headers.host!==new URL(origin).host||req.headers.origin!==origin)
    return send(res,403,'F04_2_TLS_ORIGIN_DENIED');
  if(req.headers.authorization)return send(res,401,'F04_2_COOKIE_REQUIRED');
  if(req.headers['content-length']&&req.headers['content-length']!=='0'||req.headers['transfer-encoding'])
    return send(res,400,'F04_2_UNEXPECTED_BODY');
  if(await readinessProbe()!==true||(await verifyM94(auth.pool)).verified!==true)
    return send(res,503,'F04_2_M94_SEAL_UNAVAILABLE');
  let token;try{token=readSessionCookie(req.headers.cookie)}
  catch{return send(res,400,'F04_2_COOKIE_INVALID')}
  if(!token)return send(res,401,'F04_2_COOKIE_REQUIRED');
  const admin=await auth.withSession(token,async(c,a,s)=>{
    if(s.restricted||a.principal_kind!=='system_admin'||a.system_admin_id===null||
       a.force_password_change!==false)return false;
    const q=await c.query("SELECT system_admin_id FROM public.system_admins WHERE system_admin_id=$1 AND account_status='active' FOR SHARE",[a.system_admin_id]);
    return q.rowCount===1;
  },{normalOnly:true});
  // A former System Admin session is not interchangeable with employee/4S.
  if(admin!==true)return send(res,403,'F04_2_CONTROL_PLANE_DENIED');
  if(path===SELF)return send(res,200,'F04_4S_GOVERNANCE_AUTHENTICATED',{ciOnly:true,readOnly:true});
  const target=Number(match[1]);
  if(!Number.isSafeInteger(target))return send(res,422,'F04_2_BAD_DTO');
  // Classify the *real* candidate using an exact current SQL subject/role
  // relation, but never reveal whether a matching private account exists.
  // M94 does not contain an independently verifiable current 4S merchant
  // attribution to this employee's represented business/dealer.
  // Therefore even a genuine 4S member cannot receive CRUD permission.
  await auth.withSession(token,async(c)=>{
    await c.query("SELECT a.account_id FROM public.pc_login_accounts a JOIN public.employees e ON e.employee_id=a.employee_id JOIN public.roles r ON r.role_id=e.main_role_id WHERE a.principal_kind='employee' AND a.employee_id=$1 AND a.credential_state='enabled' AND e.employment_status='active' AND r.role_code='four_s' LIMIT 1",[target]);
    return null;
  },{normalOnly:true});
  return send(res,403,'F04_4S_ACCOUNT_SCOPE_UNPROVEN');
 };
}
