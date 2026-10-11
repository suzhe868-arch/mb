// CI-only TLS path. Real WeChat Customer, phone authorization and activation permission Issuer absent.
import {connect,verify} from './migration.mjs';
const origin='https://127.0.0.1:48987';
const headers={'content-type':'application/json','cache-control':'private, no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer'};
const send=(r,status,code)=>{r.writeHead(status,headers);r.end(JSON.stringify({code}))};
export async function createFindCarCIRejectRouter(){
 for(const [k,v] of Object.entries({CI:'true',GITHUB_ACTIONS:'true',APP_ENV:'test',NODE_ENV:'test',
 F05_2_ISOLATION_CONFIRM:'I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY'}))
  if(process.env[k]!==v)throw Error('F05_6_NO_LIVE_ROUTER_'+k);
 const db=await connect();try{await verify(db)}finally{await db.end()}
 return(req,res)=>{
  const raw=req.url||'';
  if(raw.length>1024||!raw.startsWith('/')||/%2e|%2f|%5c|%00|\\|\/\.\.?($|\/)|\/\//i.test(raw))
   return send(res,400,'F05_6_INVALID_CI_PATH');
  let p;try{p=new URL(raw,origin)}catch{return send(res,400,'F05_6_INVALID_CI_PATH')}
  if(p.origin!==origin||p.hash||p.search||!/^\/__ci__\/f05-6\/v1\/(applications|applications\/[1-9][0-9]{0,15}\/activate)$/.test(p.pathname))
   return send(res,404,'F05_6_NOT_REGISTERED');
  if(req.method!=='POST')return send(res,405,'F05_6_METHOD_NOT_ALLOWED');
  if(!req.socket?.encrypted||!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress)||
     req.headers.origin!==origin||req.headers.host!==new URL(origin).host)return send(res,403,'F05_6_UNTRUSTED_ORIGIN_OR_TLS');
  // Cannot trust client-supplied Customer id, hasPhone, findEntitlement, currentOwner,
  // Employee cookie, free grant, JYT token or fabricated WeChat code.
  return send(res,403,'F05_6_REAL_CUSTOMER_PHONE_PERMISSION_ISSUERS_SOURCE_GAP');
 };
}
