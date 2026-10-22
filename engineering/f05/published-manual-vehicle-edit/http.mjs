// Loopback-only HTTPS route for Issue216; never mounted in production.
import {readSessionCookie} from '../../src/f03-auth-http.mjs';
import {assertIsolated} from './migration.mjs';
const ORIGIN=`https://127.0.0.1:${Number(process.env.F05_EDIT_HTTP_PORT || 48986)}`;
const BASE='/__ci__/f05-published-edit/v1/vehicles';
const headers={'content-type':'application/json; charset=utf-8','cache-control':'private, no-store, max-age=0',
 pragma:'no-cache','x-content-type-options':'nosniff','x-frame-options':'DENY','referrer-policy':'no-referrer'};
const send=(res,status,body)=>{res.writeHead(status,headers);res.end(JSON.stringify(body))};
const deny=(res,status,code)=>send(res,status,{code,ciOnly:true,productionReady:false});
async function body(req){
 if(!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(req.headers['content-type']||''))throw Error('BODY_CONTENT_TYPE');
 if(req.headers['transfer-encoding'])throw Error('BODY_TRANSFER_DENIED');
 if(req.headers['content-length']&&(!/^\d+$/.test(req.headers['content-length'])||Number(req.headers['content-length'])>20000))throw Error('BODY_LIMIT');
 const chunks=[];let bytes=0;
 for await(const part of req){bytes+=part.length;if(bytes>20000)throw Error('BODY_LIMIT');chunks.push(part)}
 if(!bytes)throw Error('BODY_REQUIRED');
 try{const out=JSON.parse(Buffer.concat(chunks).toString('utf8'));if(!out||typeof out!=='object'||Array.isArray(out))throw Error();return out}
 catch{throw Error('BODY_NOT_OBJECT')}
}
export function createPublishedEditHandler(service,{env=process.env}={}){
 assertIsolated(env);
 if(!service||!['get','stage','cancel','commit'].every(k=>typeof service[k]==='function'))throw Error('F05_EDIT_SERVICE_REQUIRED');
 return async(req,res)=>{
  const raw=req.url||'';
  if(raw.length>2048||!raw.startsWith('/')||/%2e|%2f|%5c|%00|\\|\/\.\.?($|\/)|\/\//i.test(raw))return deny(res,400,'PATH_INVALID');
  let u;try{u=new URL(raw,ORIGIN)}catch{return deny(res,400,'PATH_INVALID')}
  if(u.origin!==ORIGIN||u.search||u.hash)return deny(res,403,'TARGET_DENIED');
  if(!req.socket?.encrypted||!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress)||
   req.headers.host!==`127.0.0.1:${Number(process.env.F05_EDIT_HTTP_PORT || 48986)}`||req.headers.origin!==ORIGIN||req.headers.authorization||
   req.headers['transfer-encoding']||Object.keys(req.headers).some(k=>/(merchant|team|owner|role|level|publisher|customer|scope|forwarded|employee|actor|identity)/i.test(k)))
   return deny(res,403,'CONTEXT_DENIED');
  let token;try{token=readSessionCookie(req.headers.cookie)}catch{return deny(res,401,'SESSION_REQUIRED')}
  if(!token)return deny(res,401,'SESSION_REQUIRED');
  const m=new RegExp('^'+BASE+'/([1-9][0-9]{0,17})(/stage|/commit)?$').exec(u.pathname);
  if(!m)return deny(res,404,'ROUTE_NOT_FOUND');
  try{
   let r;
   if(!m[2]&&req.method==='GET'&&(!req.headers['content-length']||req.headers['content-length']==='0'))
    r=await service.get(token,m[1]);
   else if(m[2]==='/stage'&&req.method==='PUT')r=await service.stage(token,m[1],await body(req));
   else if(m[2]==='/stage'&&req.method==='DELETE')r=await service.cancel(token,m[1],await body(req));
   else if(m[2]==='/commit'&&req.method==='POST')r=await service.commit(token,m[1],await body(req));
   else return deny(res,405,'METHOD_NOT_ALLOWED');
   if(!r||!Number.isInteger(r.status)||!r.body)return deny(res,503,'SERVICE_UNAVAILABLE');
   send(res,r.status,r.body);
  }catch{return deny(res,400,'INVALID_REQUEST')}
 };
}
