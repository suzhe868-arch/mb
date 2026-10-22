import {readSessionCookie} from './f03-auth-http.mjs';
import {constantMatch} from './f03-auth-crypto.mjs';
import {assertEnvironment} from '../f03/customer-other-phone/environment.mjs';

const route=/^\/__ci__\/f03\/customers\/([1-9][0-9]{0,18})\/other-phones(?:\/([1-9][0-9]{0,18})\/(replace|end))?$/;
const requestKeyPattern=/^[A-Za-z0-9_-]{12,80}$/;
function send(res,status,body,extra={}){
 res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer',...extra});
 res.end(JSON.stringify(body));
}
const attempts=new Map();
function allowRate(address){
 const now=Date.now();if(attempts.size>1000)attempts.clear();
 const row=attempts.get(address);if(!row||row.until<=now){attempts.set(address,{count:1,until:now+60000});return true}
 row.count++;return row.count<=100;
}
async function readBody(req){
 if(typeof req.headers['content-type']!=='string'||!/^application\/json(?:;\s*charset=utf-8)?$/i.test(req.headers['content-type']))throw Object.assign(Error('CONTENT_TYPE'),{status:415});
 let raw='',bytes=0;
 for await(const part of req){bytes+=part.length;if(bytes>2048)throw Object.assign(Error('BODY_LIMIT'),{status:413});raw+=part.toString('utf8')}
 let data;try{data=JSON.parse(raw)}catch{throw Object.assign(Error('INVALID_JSON'),{status:400})}
 if(!data||typeof data!=='object'||Array.isArray(data))throw Object.assign(Error('OBJECT_REQUIRED'),{status:400});
 return data;
}
const exactKeys=(data,keys)=>Object.keys(data).sort().join('|')===keys.slice().sort().join('|');
const DUPLICATE_SENSITIVE_HEADERS=new Set([
 'host','origin','cookie','content-type','content-length','transfer-encoding',
 'x-csrf-token','idempotency-key','authorization','connection','expect'
]);
const FORWARDED_EXACT_HEADERS=new Set([
 'forwarded','via','x-real-ip','x-real-host','x-client-ip','client-ip','true-client-ip',
 'cf-connecting-ip','fastly-client-ip','x-cluster-client-ip','x-remote-ip','x-remote-host','x-scheme','x-url-scheme'
]);
function isForwardingHeader(name){
 return FORWARDED_EXACT_HEADERS.has(name)||name.startsWith('x-forwarded-')||
  name.startsWith('x-original-')||name.startsWith('x-rewrite-')||name.startsWith('x-envoy-');
}
function inspectSecurityHeaders(req){
 const raw=Array.isArray(req.rawHeaders)?req.rawHeaders:[];
 const counts=new Map(),names=[];
 for(let i=0;i+1<raw.length;i+=2){
  const name=String(raw[i]).toLowerCase();
  names.push(name);counts.set(name,(counts.get(name)||0)+1);
 }
 for(const name of DUPLICATE_SENSITIVE_HEADERS)if((counts.get(name)||0)>1)return 'AMBIGUOUS_SECURITY_HEADERS';
 if(req.headers['content-length']!==undefined&&req.headers['transfer-encoding']!==undefined)return 'AMBIGUOUS_SECURITY_HEADERS';
 if(names.some(isForwardingHeader))return 'FORWARDED_REQUEST_DENIED';
 return null;
}
export function createCustomerOtherPhoneHandler({service,auth}){
 assertEnvironment();
 if(!service||!auth)throw Error('CUSTOMER_PHONE_DEPENDENCIES_REQUIRED');
 return async(req,res)=>{
  const raw=req.url||'',path=raw.split('?')[0],m=route.exec(path);
  if(!m)return false;
  if(raw!==path){send(res,400,{code:'QUERY_FORBIDDEN'});return true}
  const customerId=m[1],phoneFactId=m[2]??null,action=m[3]??null;
  if(!['GET','POST'].includes(req.method)){send(res,405,{code:'METHOD_NOT_ALLOWED'},{allow:'GET, POST'});return true}
  const headerIssue=inspectSecurityHeaders(req);
  if(headerIssue==='AMBIGUOUS_SECURITY_HEADERS'){send(res,400,{code:headerIssue});return true}
  if(headerIssue==='FORWARDED_REQUEST_DENIED'){send(res,403,{code:headerIssue});return true}
  if(req.socket?.encrypted!==true||req.socket?.remoteAddress!=='127.0.0.1'||req.headers.origin!==auth.origin||req.headers.host!==new URL(auth.origin).host){
   send(res,403,{code:'SECURE_SAME_ORIGIN_REQUIRED'});return true;
  }
  if(!allowRate(req.socket.remoteAddress)){send(res,429,{code:'RATE_LIMITED'});return true}
  let token;try{token=readSessionCookie(req.headers.cookie)}catch{token=null}
  if(!token){send(res,401,{code:'SESSION_INVALID'});return true}
  if(req.method==='POST'){
   if(typeof req.headers['idempotency-key']!=='string'||!requestKeyPattern.test(req.headers['idempotency-key'])){
    send(res,400,{code:'INVALID_IDEMPOTENCY_KEY'});return true;
   }
   if(typeof req.headers['x-csrf-token']!=='string'||!constantMatch(req.headers['x-csrf-token'],auth.csrfFor(token))){
    send(res,403,{code:'CSRF_DENIED'});return true;
   }
  }
  try{
   if(req.method==='GET'){
    if(action){send(res,405,{code:'METHOD_NOT_ALLOWED'});return true}
    if((req.headers['content-length']&&req.headers['content-length']!=='0')||req.headers['transfer-encoding']){send(res,400,{code:'GET_BODY_FORBIDDEN'});return true}
    const out=await service.list({token,customerId});send(res,out.status,out);return true;
   }
   const data=await readBody(req),requestKey=req.headers['idempotency-key'];
   let out;
   if(!action){
    if(!exactKeys(data,['phoneNumber'])){send(res,400,{code:'INVALID_BODY'});return true}
    out=await service.add({token,customerId,phoneNumber:data.phoneNumber,requestKey});
   }else if(action==='replace'){
    if(!exactKeys(data,['phoneNumber'])){send(res,400,{code:'INVALID_BODY'});return true}
    out=await service.replace({token,customerId,phoneFactId,phoneNumber:data.phoneNumber,requestKey});
   }else{
    if(!exactKeys(data,[])){send(res,400,{code:'INVALID_BODY'});return true}
    out=await service.end({token,customerId,phoneFactId,requestKey});
   }
   send(res,out.status,out);return true;
  }catch(e){
   if(e?.message==='CONTENT_TYPE'||e?.message==='BODY_LIMIT'||e?.message==='OBJECT_REQUIRED'||e?.message==='INVALID_JSON'){
    send(res,e.status??400,{code:e.message==='CONTENT_TYPE'?'INVALID_CONTENT_TYPE':e.message==='BODY_LIMIT'?'BODY_TOO_LARGE':e.message==='INVALID_JSON'?'INVALID_JSON':'INVALID_BODY'});return true;
   }
   send(res,503,{code:'CUSTOMER_PHONE_HTTP_UNAVAILABLE'});return true;
  }
 };
}
