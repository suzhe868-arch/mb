import {readSessionCookie} from './f03-auth-http.mjs';
import {constantMatch} from './f03-auth-crypto.mjs';
import {assertEnvironment} from '../f03/customer-account-status/environment.mjs';

const route=/^\/__ci__\/f03\/customer-account-status\/([1-9][0-9]{0,18})(?:\/(disable|restore))?$/;
const keyPattern=/^[A-Za-z0-9_-]{12,80}$/;
const exactHeaders=new Set(['host','origin','cookie','content-length','content-type','authorization','transfer-encoding','x-csrf-token','idempotency-key','connection','expect']);
const forwarded=new Set(['forwarded','via','x-real-ip','x-real-host','x-client-ip','client-ip','cf-connecting-ip','true-client-ip','x-scheme']);
function send(res,status,body,more={}){
 res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer',...more});
 res.end(JSON.stringify(body));
}
function inspect(req){
 const counts=new Map();
 const raw=Array.isArray(req.rawHeaders)?req.rawHeaders:[];
 for(let i=0;i+1<raw.length;i+=2){
  const name=String(raw[i]).toLowerCase();
  counts.set(name,(counts.get(name)||0)+1);
  if(forwarded.has(name)||/^x-(forwarded|original|rewrite|envoy)-/.test(name))return 'FORWARDED_REQUEST_DENIED';
 }
 for(const h of exactHeaders)if((counts.get(h)||0)>1)return 'AMBIGUOUS_SECURITY_HEADERS';
 if(req.headers['transfer-encoding']!==undefined&&req.headers['content-length']!==undefined)return 'AMBIGUOUS_SECURITY_HEADERS';
 return null;
}
async function body(req){
 if(!/^application\/json(?:;\s*charset=utf-8)?$/i.test(String(req.headers['content-type']||'')))throw Object.assign(Error('INVALID_CONTENT_TYPE'),{status:415});
 let bytes=0;const chunks=[];
 for await(const chunk of req){bytes+=chunk.length;if(bytes>2048)throw Object.assign(Error('BODY_TOO_LARGE'),{status:413});chunks.push(chunk)}
 let data;try{data=JSON.parse(Buffer.concat(chunks).toString('utf8'))}catch{throw Object.assign(Error('INVALID_JSON'),{status:400})}
 if(!data||typeof data!=='object'||Array.isArray(data)||Object.keys(data).sort().join('|')!=='reason')throw Object.assign(Error('INVALID_BODY'),{status:400});
 return data;
}
export function createCustomerAccountStatusHandler({service,auth}){
 assertEnvironment();
 if(!service||!auth)throw Error('F03_ACCOUNT_STATUS_HTTP_DEPENDENCIES_REQUIRED');
 return async(req,res)=>{
  const raw=req.url||'',path=raw.split('?')[0],match=route.exec(path);
  if(!match)return false;
  if(raw!==path){send(res,400,{code:'QUERY_FORBIDDEN'});return true}
  const customerId=match[1],action=match[2]||'read';
  const method=action==='read'?'GET':'POST';
  if(req.method!==method){send(res,405,{code:'METHOD_NOT_ALLOWED'},{allow:method});return true}
  const invalid=inspect(req);if(invalid){send(res,invalid==='FORWARDED_REQUEST_DENIED'?403:400,{code:invalid});return true}
  if(req.socket?.encrypted!==true||req.socket?.remoteAddress!=='127.0.0.1'||req.headers.origin!==auth.origin||req.headers.host!==new URL(auth.origin).host){
   send(res,403,{code:'SECURE_SAME_ORIGIN_REQUIRED'});return true;
  }
  let token;try{token=readSessionCookie(req.headers.cookie)}catch{token=null}
  if(!token){send(res,401,{code:'SESSION_INVALID'});return true}
  if(action==='read'){
   if(req.headers['transfer-encoding']||req.headers['content-length']&&req.headers['content-length']!=='0'){send(res,400,{code:'GET_BODY_FORBIDDEN'});return true}
   try{const result=await service.read({token,customerId});send(res,result.status,result)}catch{send(res,503,{code:'ACCOUNT_STATUS_UNAVAILABLE'})}return true;
  }
  if(typeof req.headers['idempotency-key']!=='string'||!keyPattern.test(req.headers['idempotency-key'])){send(res,400,{code:'INVALID_IDEMPOTENCY_KEY'});return true}
  if(typeof req.headers['x-csrf-token']!=='string'||!constantMatch(req.headers['x-csrf-token'],auth.csrfFor(token))){send(res,403,{code:'CSRF_DENIED'});return true}
  try{
   const data=await body(req);
   const result=await service[action]({token,customerId,reason:data.reason,requestKey:req.headers['idempotency-key']});
   send(res,result.status,result);
  }catch(e){
   if(['INVALID_CONTENT_TYPE','BODY_TOO_LARGE','INVALID_JSON','INVALID_BODY'].includes(e?.message))send(res,e.status,{code:e.message});
   else send(res,503,{code:'ACCOUNT_STATUS_UNAVAILABLE'});
  }
  return true;
 };
}
