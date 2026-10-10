// F04-1: explicitly imported disposable HTTPS/PG16 contract router. NOT production.
import {createFoundationHandler} from '../../src/app.mjs';
import {createAuthHandler,readSessionCookie} from '../../src/f03-auth-http.mjs';
import {verify as verifyM94} from '../../f03/runtime-transaction-responsible-handover/migration.mjs';
import {projectEmployeeVehicle} from '../../f03/field-security-projection/service.mjs';

const send=(res,status,code,extra={})=>{
  res.writeHead(status,{
    'content-type':'application/json; charset=utf-8',
    'cache-control':'no-store, private, max-age=0',
    'pragma':'no-cache',
    'x-content-type-options':'nosniff',
    'referrer-policy':'no-referrer',
    'x-frame-options':'DENY',
    'strict-transport-security':'max-age=0',
  });
  res.end(JSON.stringify({code,...extra}));
};
const id=x=>typeof x==='string'&&/^[1-9][0-9]{0,14}$/.test(x)&&Number.isSafeInteger(Number(x));
const refusal=Object.freeze({code:'OPEN_DEPENDENCY',owner:'F04_F05_F06_F07'});
export const F04_ROUTE_CONTRACTS=Object.freeze([
  {method:'GET',path:'/api/v1/f04/session/proof',actor:'pc_current_session',stage:'IMPLEMENTED_CI_ONLY',response:'F04_SESSION_PROVEN'},
  {method:'GET',path:'/api/v1/f04/vehicles/{vehicleId}',actor:'employee_current_session',stage:'IMPLEMENTED_CI_ONLY_FAIL_CLOSED',response:'P_VEHICLE_SCOPE_UNPROVEN'},
  {method:'GET',path:'/api/v1/f04/customers/{customerId}',actor:'employee_current_session',stage:'IMPLEMENTED_CI_ONLY_OBJECT_SCOPED',response:'F04_CUSTOMER_CURRENT_OWNER'},
  {method:'GET',path:'/api/v1/f04/customer/vehicles/{vehicleId}/price',actor:'customer_trusted_future',stage:'CONTRACT_ONLY',response:'OPEN_DEPENDENCY'},
  {method:'POST',path:'/api/v1/f04/locks',actor:'customer_trusted_future',stage:'CONTRACT_ONLY',response:'OPEN_DEPENDENCY'},
  {method:'POST',path:'/api/v1/f04/transactions',actor:'employee_current_session',stage:'CONTRACT_ONLY',response:'OPEN_DEPENDENCY'},
  {method:'POST',path:'/api/v1/f04/refunds',actor:'employee_current_session',stage:'CONTRACT_ONLY',response:'OPEN_DEPENDENCY'},
  {method:'POST',path:'/api/v1/f04/publisher-phone',actor:'employee_current_session',stage:'CONTRACT_ONLY',response:'OPEN_DEPENDENCY'},
  {method:'POST',path:'/api/v1/f04/4s/accounts',actor:'system_admin_current_session',stage:'CONTRACT_ONLY',response:'OPEN_DEPENDENCY'},
]);
const safeAddress=x=>x==='127.0.0.1'||x==='::1'||x==='::ffff:127.0.0.1';
// The one permitted customer business positive: current owner ONLY, current
// independent CRM capability + personally effective grant + current Team/store
// membership & scoped binding, locked live Customer fact. No phone/history DTO.
async function trustedOwnCustomer(auth,token,customerId){
  return await auth.withSession(token,async(c,a,s)=>{
    if(s.restricted||a.principal_kind!=='employee'||a.system_admin_id!==null||
       a.role_code==='four_s'||a.subject_status!=='active')return false;
    const sql=String.raw`
SELECT c.customer_id FROM public.customers c
JOIN public.employees e ON e.employee_id=c.current_owner_employee_id
JOIN public.permissions p ON p.permission_code='crm.customer.view'
LEFT JOIN public.role_permission_defaults d ON d.role_id=e.main_role_id AND d.permission_id=p.permission_id
LEFT JOIN public.employee_permission_overrides ov ON ov.employee_id=e.employee_id AND ov.permission_id=p.permission_id
JOIN public.employee_capability_scope_bindings b ON b.employee_id=e.employee_id AND b.permission_id=p.permission_id
JOIN public.employee_data_scopes sc ON sc.scope_id=b.scope_id AND sc.employee_id=e.employee_id
JOIN public.teams t ON ((sc.scope_kind='team' AND sc.scope_reference_id=t.team_id)
 OR (sc.scope_kind='store' AND sc.scope_reference_id=t.store_id))
JOIN public.stores st ON st.store_id=t.store_id
JOIN public.employee_team_memberships tm ON tm.employee_id=e.employee_id AND tm.team_id=t.team_id
WHERE c.customer_id=$1 AND c.current_owner_employee_id=$2
 AND c.account_status='active' AND c.owner_assignment_state='assigned'
 AND e.employment_status='active' AND e.store_id=st.store_id
 AND t.team_status='active' AND st.status='active'
 AND (ov.decision='allow' OR (ov.decision IS NULL AND d.enabled=true))
 AND ov.decision IS DISTINCT FROM 'deny'
 AND (sc.ended_at IS NULL OR sc.ended_at>statement_timestamp())
 AND b.granted_at<=statement_timestamp()
 AND (b.ended_at IS NULL OR b.ended_at>statement_timestamp())
 AND tm.valid_from<=statement_timestamp()
 AND (tm.ended_at IS NULL OR tm.ended_at>statement_timestamp())
LIMIT 1 FOR SHARE OF c`;
    return (await c.query(sql,[customerId,a.employee_id])).rowCount===1;
  },{normalOnly:true})===true;
}


export async function createF04ContractHandler(auth,{readinessProbe=async()=>true}={}){
  const env=process.env;
  for(const [name,expected] of Object.entries({
    CI:'true',GITHUB_ACTIONS:'true',APP_ENV:'test',NODE_ENV:'test',
    F04_1_ISOLATION_CONFIRM:'I_AUTHORIZE_F04_1_DISPOSABLE_PG16_HTTPS_ONLY'
  }))if(env[name]!==expected)throw Error('F04_NON_PRODUCTION_GATE_'+name);
  if(!auth||typeof auth.withSession!=='function'||typeof auth.login!=='function')throw Error('F04_AUTH_REQUIRED');
  if(!/^https:\/\/127\.0\.0\.1:[0-9]{2,5}$/.test(auth.origin))throw Error('F04_LOOPBACK_ORIGIN_REFUSED');
  if(!/^postgres:\/\/f03_ci:[^@]+@127\.0\.0\.1:5432\/f03_auth_test$/.test(env.F03_1_DATABASE_URL||''))throw Error('F04_PG16_IDENTITY_REFUSED');
  const ready=async()=>{
    try{
      if(await readinessProbe()!==true)return false;
      // The frozen F03-1 80-table startup seal is incompatible with the
      // independently sealed M94 physical schema. Verify the entire M94
      // lineage (including F03-1 source seal) without weakening either.
      if((await verifyM94(auth.pool)).verified!==true)return false;
      return true;
    }catch{return false;}
  };
  if(!await ready())throw Error('F04_STARTUP_M94_SEAL_DENIED');
  const originalAuth=createAuthHandler(auth,ready);
  const foundation=createFoundationHandler({readinessProbe:ready,readinessTimeoutMs:10000,authHandler:originalAuth});
  return async(req,res)=>{
    const raw=req.url||'';
    if(raw.length>2048)return send(res,414,'INVALID_URL');
    let url;
    try{url=new URL(raw,auth.origin);}catch{return send(res,400,'INVALID_URL');}
    const path=url.pathname;
    if(path==='/api/v1/health/live'||path==='/api/v1/health/ready'||path.startsWith('/api/v1/auth/'))
      return foundation(req,res);
    if(!path.startsWith('/api/v1/f04/'))return send(res,404,'NOT_IMPLEMENTED');
    // CI or caller-provided headers never establish isolation or trusted identity.
    if(req.socket?.encrypted!==true||!safeAddress(req.socket.remoteAddress)||req.headers.origin!==auth.origin)
      return send(res,403,'F04_TRANSPORT_DENIED');
    if(!await ready())return send(res,503,'F04_SEAL_UNAVAILABLE');
    if(req.headers.authorization)return send(res,401,'F04_PC_SESSION_REQUIRED');
    let token;
    try{token=readSessionCookie(req.headers.cookie);}catch{return send(res,400,'F04_COOKIE_INVALID');}
    if(!token)return send(res,401,'F04_PC_SESSION_REQUIRED');
    const actor=await auth.withSession(token,async(_c,a,s)=>{
      if(s.restricted||a.force_password_change!==false)return null;
      return {kind:a.principal_kind,role:a.role_code,employeeId:a.employee_id};
    },{normalOnly:true});
    if(!actor)return send(res,401,'F04_SESSION_REVOKED');
    if(req.headers['content-length']&&req.headers['content-length']!=='0'||req.headers['transfer-encoding'])
      return send(res,400,'F04_UNEXPECTED_BODY');
    if(path==='/api/v1/f04/session/proof'){
      if(req.method!=='GET')return send(res,405,'METHOD_NOT_ALLOWED');
      if(url.search)return send(res,422,'F04_INVALID_DTO');
      return send(res,200,'F04_SESSION_PROVEN',{disposable:true,principalKind:actor.kind});
    }
    const customerPath=path.match(/^\/api\/v1\/f04\/customers\/([^/]+)$/);
    if(customerPath){
      if(req.method!=='GET')return send(res,405,'METHOD_NOT_ALLOWED');
      if(!id(customerPath[1])||url.search)return send(res,422,'F04_INVALID_DTO');
      if(actor.kind!=='employee'||actor.role==='four_s')return send(res,403,'F04_BUSINESS_PRINCIPAL_DENIED');
      if(!await trustedOwnCustomer(auth,token,Number(customerPath[1])))
        return send(res,403,'F04_CUSTOMER_SCOPE_DENIED');
      return send(res,200,'F04_CUSTOMER_CURRENT_OWNER',
        {customerId:Number(customerPath[1]),objectScope:'CURRENT_OWNER_ONLY',disposable:true});
    }
    const v=path.match(/^\/api\/v1\/f04\/vehicles\/([^/]+)$/);
    if(v){
      if(req.method!=='GET')return send(res,405,'METHOD_NOT_ALLOWED');
      if(actor.kind!=='employee'||actor.role==='four_s')return send(res,403,'F04_BUSINESS_PRINCIPAL_DENIED');
      if(!id(v[1])||[...url.searchParams.keys()].some(x=>!['teamId','view'].includes(x))||
        url.searchParams.getAll('teamId').length!==1||url.searchParams.getAll('view').length!==1||
        !id(url.searchParams.get('teamId'))||
        !['list','detail','export','history','cache','copy','print'].includes(url.searchParams.get('view')))
        return send(res,422,'F04_INVALID_DTO');
      // The supplied Team is an untrusted candidate. F03-P independently denies
      // vehicle business output without server-verified Vehicle->Team/4S ownership.
      const r=await projectEmployeeVehicle(auth,token,{
        vehicleId:Number(v[1]),teamId:Number(url.searchParams.get('teamId')),
        view:url.searchParams.get('view')
      });
      // No price, VIN, phone, internal amount, object or cached fields may escape.
      return send(res,403,r.code==='P_VEHICLE_SCOPE_UNPROVEN'?r.code:'F04_OBJECT_SCOPE_DENIED');
    }
    // Even unimplemented contracts must enforce method, principal and CSRF
    // boundaries. None can grant a write or leak fields.
    let proposed=F04_ROUTE_CONTRACTS.find(c=>c.path===path);
    if(!proposed&&/^\/api\/v1\/f04\/customer\/vehicles\/[0-9]+\/price$/.test(path))
      proposed=F04_ROUTE_CONTRACTS.find(c=>c.path.includes('/customer/vehicles/{vehicleId}'));
    if(proposed){
      if(req.method!==proposed.method)return send(res,405,'METHOD_NOT_ALLOWED');
      if(url.search)return send(res,422,'F04_INVALID_DTO');
      if(proposed.actor==='system_admin_current_session'&&actor.kind!=='system_admin')
        return send(res,403,'F04_BUSINESS_PRINCIPAL_DENIED');
      if(proposed.method==='POST'){
        const csrf=req.headers['x-csrf-token'];
        if(typeof csrf!=='string'||csrf!==auth.csrfFor(token))
          return send(res,403,'F04_CSRF_DENIED');
        const key=req.headers['x-request-key'];
        if(key!==undefined&&(typeof key!=='string'||!/^[a-zA-Z0-9._:-]{12,90}$/.test(key)))
          return send(res,422,'F04_REQUEST_KEY_INVALID');
      }
      return send(res,501,refusal.code);
    }
    return send(res,404,'NOT_IMPLEMENTED');
  };
}
