// HTTPS-only adapter. Reuses the foundation single request handler.
import {constantMatch} from './f03-auth-crypto.mjs';
const send=(res,status,body,headers={})=>{
 res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff',...headers});
 res.end(JSON.stringify(body));
};
const clear='__Host-mb_pc=; Secure; HttpOnly; Path=/; SameSite=Lax; Max-Age=0';
export function readSessionCookie(header){
 if(header===undefined)return null;
 if(typeof header!=='string')throw Error('AUTH_COOKIE_INVALID');
 let value=null,seen=false;
 for(const part of header.split(';')){
  const s=part.trim(),i=s.indexOf('='),name=(i<0?s:s.slice(0,i)).trim();
  if(name!=='__Host-mb_pc')continue;
  if(seen)throw Error('AUTH_COOKIE_DUPLICATE');
  seen=true;const token=i<0?'':s.slice(i+1).trim();
  if(!/^[A-Za-z0-9_-]{43}$/.test(token))throw Error('AUTH_COOKIE_INVALID');
  value=token;
 }
 return value;
}
export function createAuthHandler(service,verifyReady=async()=>false){
 return async(req,res)=>{
  const path=(req.url||'').split('?')[0];
  if(!['/api/v1/auth/login','/api/v1/auth/password','/api/v1/auth/logout'].includes(path))return false;
  if(req.method!=='POST'){send(res,405,{code:'METHOD_NOT_ALLOWED'});return true}
  if(!await verifyReady()){send(res,503,{code:'AUTH_UNAVAILABLE'});return true}
  const source=req.socket?.remoteAddress||'unknown';
  const secure=req.socket.encrypted===true,origin=req.headers.origin;
  if(!secure||origin!==service.origin){
   send(res,403,{code:'AUTH_FAILED'});return true;
  }
  const type=req.headers['content-type'];
  if(typeof type!=='string'||!/^application\/json(?:;\s*charset=utf-8)?$/i.test(type)){
   send(res,415,{code:'AUTH_FAILED'});return true;
  }
  let content='';
  try{
   for await(const part of req){content+=part.toString();if(Buffer.byteLength(content)>4096)throw Error('AUTH_BODY_LIMIT')}
   const data=JSON.parse(content);
   if(data===null||typeof data!=='object'||Array.isArray(data))throw Error('AUTH_INPUT');
   const token=readSessionCookie(req.headers.cookie);
   if(path.endsWith('/login')){
    const result=await service.login({login:data.login,password:data.password,source});
    if(result.code!=='AUTH_OK'){send(res,401,{code:'AUTH_FAILED'});return true}
    send(res,200,{code:'AUTH_OK',restricted:result.restricted,csrf:result.csrf},{
     'set-cookie':'__Host-mb_pc='+result.token+'; Secure; HttpOnly; Path=/; SameSite=Lax'});
    return true;
   }
   if(path.endsWith('/logout')){
    if(token){
     const expected=service.csrfFor(token);
     if(typeof req.headers['x-csrf-token']!=='string'||!constantMatch(req.headers['x-csrf-token'],expected)){
      send(res,403,{code:'AUTH_FAILED'}, {'set-cookie':clear});return true;
     }
    }
    await service.logout(token);
    send(res,200,{code:'LOGOUT_OK'},{'set-cookie':clear});return true;
   }
   if(!token||typeof req.headers['x-csrf-token']!=='string'){
    send(res,401,{code:'AUTH_FAILED'});return true;
   }
   const result=await service.change({token,csrf:req.headers['x-csrf-token'],oldPassword:data.oldPassword,newPassword:data.newPassword});
   if(result.code!=='PASSWORD_CHANGED_REAUTH_REQUIRED'){send(res,401,{code:'AUTH_FAILED'});return true}
   send(res,200,result,{'set-cookie':clear});return true;
  }catch{
   send(res,400,{code:'AUTH_FAILED'});return true;
  }
 };
}
