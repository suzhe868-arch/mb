// F05-4 isolated HTTPS denial router: there is no signed live WeChat Customer Actor issuer.
import {connect,verify} from './migration.mjs';
const origin='https://127.0.0.1:48984';
const headers={'content-type':'application/json','cache-control':'private, no-store, max-age=0',
 'pragma':'no-cache','x-content-type-options':'nosniff','referrer-policy':'no-referrer'};
const send=(res,status,code)=>{res.writeHead(status,headers);res.end(JSON.stringify({code}));};
export async function createPriceCIHandler(){
 if(process.env.CI!=='true'||process.env.GITHUB_ACTIONS!=='true'||process.env.APP_ENV!=='test'||
    process.env.NODE_ENV!=='test'||process.env.F05_2_ISOLATION_CONFIRM!=='I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY')
  throw Error('F05_4_CI_ROUTER_DISABLED');
 const db=await connect();
 try{await verify(db);}finally{await db.end();}
 return (req,res)=>{
  const raw=req.url||'';
  if(raw.length>1024||!raw.startsWith('/')||/%2e|%2f|%5c|%00|\\|\/\.\.?($|\/)|\/\//i.test(raw))
   return send(res,400,'F05_4_INVALID_CI_PATH');
  let url;try{url=new URL(raw,origin);}catch{return send(res,400,'F05_4_INVALID_CI_PATH');}
  if(url.origin!==origin||url.hash||url.search||!/^\/__ci__\/f05-4\/v1\/vehicles\/[1-9][0-9]{0,14}\/price$/.test(url.pathname))
   return send(res,404,'F05_4_CI_ROUTE_NOT_REGISTERED');
  if(req.method!=='POST')return send(res,405,'F05_4_METHOD_NOT_ALLOWED');
  if(!req.socket?.encrypted||!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress)||
     req.headers.origin!==origin||req.headers.host!==new URL(origin).host)
   return send(res,403,'F05_4_UNTRUSTED_LOOPBACK_ORIGIN');
  // Never accept X-Customer-Id, JYT key, Employee/SystemAdmin/FourS cookie,
  // arbitrary csrf, caller-asserted detail click, free grant, cache token.
  return send(res,403,'CUSTOMER_WECHAT_SESSION_TO_FAVORITE_ACTOR_SOURCE_GAP');
 };
}
