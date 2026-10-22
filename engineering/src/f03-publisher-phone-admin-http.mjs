// Issue #221: real HTTPS non-production administration contract.
// Default production server never registers this handler.
import {readSessionCookie} from './f03-auth-http.mjs';
import {constantMatch} from './f03-auth-crypto.mjs';

const route=/^\/api\/pc\/employees\/([1-9][0-9]{0,17})\/publisher-phone-permission$/;
function send(res,status,body,extra={}) {
 res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer',...extra});
 res.end(JSON.stringify(body));
}
const attempts=new Map();
function allowRate(address){
 const now=Date.now();
 if(attempts.size>5000)attempts.clear();
 const row=attempts.get(address);
 if(!row||row.until<=now){attempts.set(address,{count:1,until:now+60000});return true}
 row.count++;
 return row.count<=100;
}
async function jsonBody(req) {
 if(typeof req.headers['content-type']!=='string'||!/^application\/json(?:;\s*charset=utf-8)?$/i.test(req.headers['content-type']))throw Object.assign(Error('CONTENT_TYPE'),{status:415});
 let raw='',bytes=0;
 for await(const part of req){
  bytes+=part.length;
  if(bytes>2048)throw Object.assign(Error('BODY_LIMIT'),{status:413});
  raw+=part.toString('utf8');
 }
 const data=JSON.parse(raw);
 if(!data||typeof data!=='object'||Array.isArray(data))throw Error('OBJECT_REQUIRED');
 return data;
}
export function createPublisherPhoneAdminHandler({service,auth}) {
 if(!service||!auth)throw Error('PHONE_ADMIN_DEPENDENCIES_REQUIRED');
 return async(req,res)=>{
  const rawPath=req.url||'';
  const path=rawPath.split('?')[0],m=route.exec(path);
  if(!m)return false;
  if(rawPath!==path){send(res,400,{code:'QUERY_FORBIDDEN'});return true}
  if(!['GET','PUT','DELETE'].includes(req.method)){send(res,405,{code:'METHOD_NOT_ALLOWED'},{allow:'GET, PUT, DELETE'});return true}
  if(req.socket?.encrypted!==true||req.socket?.remoteAddress!=='127.0.0.1'||req.headers.origin!==auth.origin||req.headers.host!==new URL(auth.origin).host) {
   send(res,403,{code:'SECURE_SAME_ORIGIN_REQUIRED'});return true;
  }
  if(!allowRate(req.socket.remoteAddress)){send(res,429,{code:'RATE_LIMITED'});return true}
  let token;
  try{token=readSessionCookie(req.headers.cookie)}catch{send(res,401,{code:'SESSION_INVALID'});return true}
  if(!token){send(res,401,{code:'SESSION_INVALID'});return true}
  if(req.method!=='GET'){
   if(typeof req.headers['x-csrf-token']!=='string'||!constantMatch(req.headers['x-csrf-token'],auth.csrfFor(token))){send(res,403,{code:'CSRF_DENIED'});return true}
  }
  try{
   const employeeId=m[1];
   if(req.method==='GET'){
    if(req.headers['content-length']&&req.headers['content-length']!=='0'){send(res,400,{code:'GET_BODY_FORBIDDEN'});return true}
    const outcome=await service.get({token,employeeId});
    const etag=outcome.status===200?{etag:'"'+outcome.version+'"'}:{};
    send(res,outcome.status,outcome,etag);return true;
   }
   const input=await jsonBody(req);
   const outcome=await service.change({token,employeeId,method:req.method,input});
   send(res,outcome.status,outcome,outcome.status===200?{etag:'"'+outcome.version+'"'}:{});return true;
  }catch(e){
   if(e instanceof SyntaxError){send(res,400,{code:'INVALID_JSON'});return true}
   if(e.message==='BODY_LIMIT'||e.message==='CONTENT_TYPE'||e.message==='OBJECT_REQUIRED'){
    send(res,e.status??400,{code:'INVALID_BODY'});return true;
   }
   // Fail closed, avoid raw SQL/error/stack leaks.
   send(res,503,{code:'PHONE_ADMIN_TRANSACTION_UNAVAILABLE'});return true;
  }
 };
}
