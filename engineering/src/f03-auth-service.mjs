import pg from 'pg';
import {hashPassword,verifyPassword,dummyCheck,normalizeLogin,validatePassword,newOpaqueToken,sessionDigest,csrfValue,constantMatch} from './f03-auth-crypto.mjs';
const FAIL=Object.freeze({code:'AUTH_FAILED'});
const valid=a=>a&&a.credential_state==='enabled'&&a.subject_status==='active'&&(a.principal_kind!=='employee'||a.role_code!=='four_s'||a.pc_access===true);
export class IsolatedAuth{
 constructor({connectionString,secret,origin,env=process.env}){
  const exact={CI:'true',GITHUB_ACTIONS:'true',APP_ENV:'test',NODE_ENV:'test',F03_1_ISOLATION_CONFIRM:'I_AUTHORIZE_F03_1_NEW_EMPTY_PG16_AUTH_ONLY'};
  for(const [k,v] of Object.entries(exact))if(env[k]!==v)throw Error('F03_AUTH_ENV_REFUSED_'+k);
  if(!/^https:\/\/127\.0\.0\.1(:[0-9]{2,5})?$/.test(origin))throw Error('F03_AUTH_ORIGIN');
  const u=new URL(connectionString);
  if(u.hostname!=='127.0.0.1'||u.port!=='5432'||u.pathname!=='/f03_auth_test'||u.username!=='f03_ci')throw Error('F03_AUTH_DB_REFUSED');
  if(!Buffer.isBuffer(secret)||secret.length<32)throw Error('F03_AUTH_SECRET_REQUIRED');
  this.secret=secret;this.origin=origin;this.pool=new pg.Pool({connectionString,max:5,connectionTimeoutMillis:2500});
  this.attempts=new Map();this.clock=()=>new Date();
 }
 csrfFor(token){return csrfValue(token,this.secret)}
 async close(){await this.pool.end()}
 async get(c,id,lock=false){
  const sql="SELECT a.*,CASE WHEN a.principal_kind='employee' THEN e.employment_status ELSE sa.account_status END subject_status,"+
  "CASE WHEN a.principal_kind='employee' THEN r.role_code ELSE NULL END role_code,"+
  "CASE WHEN a.principal_kind='employee' AND r.role_code='four_s' THEN EXISTS("+
  " SELECT 1 FROM public.employee_permission_overrides o JOIN public.permissions p ON p.permission_id=o.permission_id"+
  " WHERE o.employee_id=e.employee_id AND o.decision='allow' AND p.permission_code='pc.four_s.vehicle.manage'"+
  ") ELSE true END pc_access FROM public.pc_login_accounts a"+
  " LEFT JOIN public.employees e ON a.principal_kind='employee' AND e.employee_id=a.employee_id"+
  " LEFT JOIN public.roles r ON r.role_id=e.main_role_id"+
  " LEFT JOIN public.system_admins sa ON a.principal_kind='system_admin' AND sa.system_admin_id=a.system_admin_id"+
  " WHERE a.account_id=$1"+(lock?' FOR UPDATE OF a':'');
  return (await c.query(sql,[id])).rows[0];
 }
 async audit(c,action,actorKind,actorId,targetId,before,after){
  await c.query("INSERT INTO public.audit_events(actor_kind,actor_id,object_kind,object_id,action,before_json,after_json,occurred_at) VALUES ($1,$2,'pc_login_account',$3,$4,$5::jsonb,$6::jsonb,now())",
   [actorKind,String(actorId),String(targetId),action,JSON.stringify(before),JSON.stringify(after)]);
 }
 rate(key,source){
  const now=Date.now();
  for(const [k,v] of this.attempts)if(v.until<now)this.attempts.delete(k);
  if(this.attempts.size>1000)throw Error('AUTH_CAPACITY');
  for(const [k,window,limit] of [['a:'+key,900000,5],['i:'+source,60000,20]]){
   let v=this.attempts.get(k);
   if(!v||v.until<=now){v={count:0,until:now+window,blocked:0};this.attempts.set(k,v)}
   if(now<v.blocked)throw Error('AUTH_RATE_LIMIT');
   if(v.blocked&&now>=v.blocked){v.blocked=0;v.count=0}
   if(v.count>=limit){v.blocked=now+60000;throw Error('AUTH_RATE_LIMIT')}
   // Per-source: count all attempts; per-account: count failures ONLY.
   if(k.startsWith('i:'))v.count++;
  }
 }
 failed(key){const v=this.attempts.get('a:'+key);if(v)v.count++;return FAIL}
 async login({login,password,source='loopback'}){
  let key;try{key=normalizeLogin(login);validatePassword(password);this.rate(key,source)}catch{return FAIL}
  const c=await this.pool.connect();
  try{
   const base=(await c.query('SELECT account_id,password_hash,credential_epoch FROM public.pc_login_accounts WHERE normalized_login_key=$1',[key])).rows[0];
   if(!base){await dummyCheck(password);return this.failed(key)}
   if(!await verifyPassword(password,base.password_hash))return this.failed(key);
   await c.query('BEGIN');
   try{
    const a=await this.get(c,base.account_id,true);
    if(!valid(a)||a.credential_epoch!==base.credential_epoch||a.password_hash!==base.password_hash){await c.query('ROLLBACK');return this.failed(key)}
    const token=newOpaqueToken(),restricted=a.force_password_change;
    const now=this.clock(),expires=new Date(now.getTime()+(restricted?600000:43200000));
    await c.query('INSERT INTO public.pc_auth_sessions(account_id,token_digest,credential_epoch,issued_at,expires_at,restricted) VALUES ($1,$2,$3,$4,$5,$6)',
      [a.account_id,sessionDigest(token,this.secret),a.credential_epoch,now,expires,restricted]);
    await c.query('COMMIT');
    this.attempts.delete('a:'+key);
    return {code:'AUTH_OK',restricted,token,csrf:csrfValue(token,this.secret)};
   }catch(e){await c.query('ROLLBACK');throw e}
  }finally{c.release()}
 }
 async withSession(token,fn,{normalOnly=false}={}){
  if(typeof token!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(token))return null;
  const c=await this.pool.connect();
  try{
   await c.query('BEGIN');
   try{
    // Lock account first, then session: all credential writers use this order,
    // preventing login/change/governance deadlocks under parallel sessions.
    const raw=(await c.query('SELECT account_id FROM public.pc_auth_sessions WHERE token_digest=$1',[sessionDigest(token,this.secret)])).rows[0];
    if(!raw){await c.query('ROLLBACK');return null}
    const a=await this.get(c,raw.account_id,true);
    const s=(await c.query('SELECT * FROM public.pc_auth_sessions WHERE token_digest=$1 FOR UPDATE',[sessionDigest(token,this.secret)])).rows[0];
    if(!s||s.account_id!==raw.account_id){await c.query('ROLLBACK');return null}
    const now=this.clock(),last=s.last_seen_at||s.issued_at;
    if(!valid(a)||s.credential_epoch!==a.credential_epoch||s.revoked_at||
       now.getTime()<s.issued_at.getTime()||now>=s.expires_at||
       last<s.issued_at||last>s.expires_at||now<last||
       (!s.restricted&&now.getTime()-last.getTime()>=1800000)||
       (normalOnly&&s.restricted)){
       await c.query('ROLLBACK');return null;
    }
    const result=await fn(c,a,s,now);
    if(!s.revoked_at)await c.query('UPDATE public.pc_auth_sessions SET last_seen_at=$2 WHERE session_id=$1 AND revoked_at IS NULL',[s.session_id,now]);
    await c.query('COMMIT');return result;
   }catch(e){await c.query('ROLLBACK');throw e}
  }finally{c.release()}
 }
 async change({token,csrf,oldPassword,newPassword}){
  if(typeof token!=='string'||!constantMatch(csrf,csrfValue(token,this.secret)))return FAIL;
  try{validatePassword(newPassword)}catch{return FAIL}
  return await this.withSession(token,async(c,a)=>{
   if(!await verifyPassword(oldPassword,a.password_hash))return FAIL;
   const next=await hashPassword(newPassword);
   await c.query('UPDATE public.pc_login_accounts SET password_hash=$2,force_password_change=false,credential_epoch=credential_epoch+1,updated_at=now() WHERE account_id=$1',[a.account_id,next]);
   await c.query('UPDATE public.pc_auth_sessions SET revoked_at=COALESCE(revoked_at,now()) WHERE account_id=$1',[a.account_id]);
   await this.audit(c,'pc_password_self_change',a.principal_kind,a.principal_kind==='employee'?a.employee_id:a.system_admin_id,a.account_id,{epoch:a.credential_epoch},{epoch:Number(a.credential_epoch)+1});
   return {code:'PASSWORD_CHANGED_REAUTH_REQUIRED'};
  })||FAIL;
 }
 async logout(token){
  if(typeof token==='string'&&/^[A-Za-z0-9_-]{43}$/.test(token))
   await this.pool.query('UPDATE public.pc_auth_sessions SET revoked_at=COALESCE(revoked_at,now()) WHERE token_digest=$1',[sessionDigest(token,this.secret)]);
  return {code:'LOGOUT_OK'};
 }
 async govern({actorToken,targetId,action,temporaryPassword}){
  if(!['reset','disable','enable'].includes(action))return FAIL;
  return await this.withSession(actorToken,async(c,actor,s)=>{
   if(actor.principal_kind!=='system_admin'||s.restricted||!Number.isSafeInteger(targetId)||targetId<=0)return FAIL;
   const target=await this.get(c,targetId,true);
   if(!target)return FAIL;
   if(action==='disable'){
    // Until F03-2 last-active-admin transaction is authorized, all System Admin
    // credential disable operations are hard denied.
    if(target.principal_kind==='system_admin'||target.credential_state!=='enabled')return FAIL;
    await c.query("UPDATE public.pc_login_accounts SET credential_state='disabled',credential_epoch=credential_epoch+1,updated_at=now() WHERE account_id=$1",[targetId]);
   }else if(action==='enable'){
    if(target.subject_status!=='active'||target.credential_state!=='disabled')return FAIL;
    await c.query("UPDATE public.pc_login_accounts SET credential_state='enabled',credential_epoch=credential_epoch+1,updated_at=now() WHERE account_id=$1",[targetId]);
   }else{
    if(target.subject_status!=='active'||target.credential_state!=='enabled')return FAIL;
    let newHash;try{newHash=await hashPassword(temporaryPassword)}catch{return FAIL}
    await c.query("UPDATE public.pc_login_accounts SET password_hash=$2,force_password_change=true,credential_epoch=credential_epoch+1,updated_at=now() WHERE account_id=$1",[targetId,newHash]);
   }
   await c.query('UPDATE public.pc_auth_sessions SET revoked_at=COALESCE(revoked_at,now()) WHERE account_id=$1',[targetId]);
   await this.audit(c,'pc_credential_'+action,'system_admin',actor.system_admin_id,targetId,{state:target.credential_state,epoch:target.credential_epoch},{state:action==='disable'?'disabled':'enabled',epoch:Number(target.credential_epoch)+1});
   return {code:'GOVERNANCE_OK'};
  },{normalOnly:true})||FAIL;
 }
}
