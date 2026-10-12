// Never bind this CI router to production, real secrets, or public interfaces.
import {connect,verify} from './migration.mjs';
const origin='https://127.0.0.1:48988';
const headers={'content-type':'application/json','cache-control':'private, no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer'};
const send=(r,status,code)=>{r.writeHead(status,headers);r.end(JSON.stringify({code}))};
export async function createMatchingCIRejectRouter(){
 for(const [k,v] of Object.entries({CI:'true',GITHUB_ACTIONS:'true',APP_ENV:'test',NODE_ENV:'test',F05_2_ISOLATION_CONFIRM:'I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY'}))
  if(process.env[k]!==v)throw Error('F05_7_NO_LIVE_ROUTER_'+k);
 const c=await connect();try{await verify(c)}finally{await c.end()}
 return(req,res)=>{
  const raw=req.url||'';
  if(raw.length>1024||!raw.startsWith('/')||/%2e|%2f|%5c|%00|\\|\/\.\.?($|\/)|\/\//i.test(raw))
   return send(res,400,'F05_7_INVALID_CI_PATH');
  let p;try{p=new URL(raw,origin)}catch{return send(res,400,'F05_7_INVALID_CI_PATH')}
  if(p.origin!==origin||p.hash||p.search||!/^\/__ci__\/f05-7\/v1\/(match|rule)$/.test(p.pathname))
   return send(res,404,'F05_7_NOT_REGISTERED');
  if(req.method!=='POST')return send(res,405,'F05_7_METHOD_NOT_ALLOWED');
  if(!req.socket?.encrypted||!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress)||
   req.headers.origin!==origin||req.headers.host!==new URL(origin).host)
   return send(res,403,'F05_7_UNTRUSTED_ORIGIN_OR_TLS');
  return send(res,403,'F05_7_PRODUCTION_MATCHING_RULE_ISSUERS_SOURCE_GAP');
 };
}
