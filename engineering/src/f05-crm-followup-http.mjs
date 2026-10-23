import {readSessionCookie} from './f03-auth-http.mjs';
import {constantMatch} from './f03-auth-crypto.mjs';
import {assertEnvironment} from '../f05/crm-followup-ci/environment.mjs';

const route=/^\/__ci__\/f05\/crm-followups\/([1-9][0-9]{0,18})(?:\/([1-9][0-9]{0,18}))?$/;
const strictHeaders=new Set(['host','origin','cookie','content-length','content-type','authorization','transfer-encoding','x-csrf-token','idempotency-key','expect']);
function send(res,status,body,extra={}){
 res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer',...extra});
 res.end(JSON.stringify(body));
}
function invalidHeaders(req){
 const counts=new Map();
 for(let i=0;i+1<(req.rawHeaders||[]).length;i+=2){
  const k=String(req.rawHeaders[i]).toLowerCase();counts.set(k,(counts.get(k)||0)+1);
  if(['forwarded','via','x-real-ip','x-real-host','client-ip','cf-connecting-ip','true-client-ip'].includes(k)||/^x-(forwarded|original|rewrite|envoy)-/.test(k))return 'FORWARDED_REQUEST_DENIED';
 }
 if([...strictHeaders].some(k=>(counts.get(k)||0)>1))return 'AMBIGUOUS_SECURITY_HEADERS';
 if(req.headers['transfer-encoding']!==undefined&&req.headers['content-length']!==undefined)return 'AMBIGUOUS_SECURITY_HEADERS';
 return null;
}
async function readBody(req){
 if(!/^application\/json(?:;\s*charset=utf-8)?$/i.test(String(req.headers['content-type']??'')))throw Object.assign(Error('INVALID_CONTENT_TYPE'),{status:415});
 const chunks=[];let n=0;
 for await(const chunk of req){n+=chunk.length;if(n>8192)throw Object.assign(Error('BODY_TOO_LARGE'),{status:413});chunks.push(chunk)}
 let data;
 try{data=JSON.parse(Buffer.concat(chunks).toString('utf8'))}catch{throw Object.assign(Error('INVALID_JSON'),{status:400})}
 if(!data||Array.isArray(data)||typeof data!=='object'||Object.keys(data).sort().join('|')!=='businessDemandId|content|source')throw Object.assign(Error('INVALID_BODY'),{status:400});
 return data;
}
export function createCrmFollowupHandler({auth,service}){
 assertEnvironment();
 if(!auth||!service)throw Error('CRM_HTTP_DEPENDENCIES_REQUIRED');
 return async(req,res)=>{
  const url=req.url??'',path=url.split('?')[0],m=route.exec(path);
  if(!m)return false;
  if(url!==path){send(res,400,{code:'QUERY_FORBIDDEN'});return true}
  const customerId=m[1],followupId=m[2],isRead=followupId!==undefined,method=isRead?'GET':'POST';
  if(req.method!==method){send(res,405,{code:'METHOD_NOT_ALLOWED'},{allow:method});return true}
  const bad=invalidHeaders(req);if(bad){send(res,bad==='FORWARDED_REQUEST_DENIED'?403:400,{code:bad});return true}
  if(req.socket?.encrypted!==true||req.socket?.remoteAddress!=='127.0.0.1'||req.headers.origin!==auth.origin||req.headers.host!==new URL(auth.origin).host){
   send(res,403,{code:'SECURE_SAME_ORIGIN_REQUIRED'});return true;
  }
  let token;
  try{token=readSessionCookie(req.headers.cookie)}catch{token=null}
  if(!token){send(res,401,{code:'SESSION_INVALID'});return true}
  if(isRead){
   if(req.headers['transfer-encoding']||req.headers['content-length']&&req.headers['content-length']!=='0'){send(res,400,{code:'GET_BODY_FORBIDDEN'});return true}
   try{const out=await service.read({token,customerId,followupId});send(res,out.status,out)}catch{send(res,503,{code:'CRM_UNAVAILABLE'})}
   return true;
  }
  if(typeof req.headers['idempotency-key']!=='string'||!/^[A-Za-z0-9_-]{12,80}$/.test(req.headers['idempotency-key'])){send(res,400,{code:'INVALID_IDEMPOTENCY_KEY'});return true}
  if(typeof req.headers['x-csrf-token']!=='string'||!constantMatch(req.headers['x-csrf-token'],auth.csrfFor(token))){send(res,403,{code:'CSRF_DENIED'});return true}
  try{
   const d=await readBody(req),out=await service.append({token,customerId,content:d.content,businessDemandId:d.businessDemandId,source:d.source,requestKey:req.headers['idempotency-key']});
   send(res,out.status,out);
  }catch(e){
   if(['INVALID_CONTENT_TYPE','BODY_TOO_LARGE','INVALID_JSON','INVALID_BODY'].includes(e?.message))send(res,e.status,{code:e.message});
   else send(res,503,{code:'CRM_UNAVAILABLE'});
  }
  return true;
 };
}
