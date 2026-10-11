import {connect,verify} from './migration.mjs';
const origin='https://127.0.0.1:48986';
const headers={'content-type':'application/json','cache-control':'private, no-store, max-age=0','x-content-type-options':'nosniff','referrer-policy':'no-referrer'};
const send=(res,status,code)=>{res.writeHead(status,headers);res.end(JSON.stringify({code}));};
export async function ciOnlyQuotaHTTP(){
 if(process.env.CI!=='true'||process.env.GITHUB_ACTIONS!=='true'||process.env.APP_ENV!=='test'||process.env.NODE_ENV!=='test'||
 process.env.F05_2_ISOLATION_CONFIRM!=='I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY')throw Error('F05_5_HTTPS_NEVER_REGISTER_OUTSIDE_CI');
 const db=await connect();try{await verify(db);}finally{await db.end();}
 return (req,res)=>{
  const raw=req.url||'';
  if(raw.length>1024||!raw.startsWith('/')||/%2e|%2f|%5c|%00|\\|\/\.\.?($|\/)|\/\//i.test(raw))return send(res,400,'F05_5_INVALID_PATH');
  let u;try{u=new URL(raw,origin)}catch{return send(res,400,'F05_5_INVALID_PATH')}
  if(u.origin!==origin||u.search||u.hash||!/^\/__ci__\/f05-5\/v1\/customers\/[1-9][0-9]{0,14}\/daily-quota-add$/.test(u.pathname))
   return send(res,404,'F05_5_NOT_REGISTERED');
  if(req.method!=='POST')return send(res,405,'F05_5_METHOD_NOT_ALLOWED');
  if(!req.socket?.encrypted||!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress)||req.headers.origin!==origin||req.headers.host!==new URL(origin).host)
   return send(res,403,'F05_5_UNTRUSTED_HTTPS_ORIGIN');
  // Explicit production issuer/source gap: Cookie or client-asserted business state
  // is not a substitute for an A-accepted quota issuer and scoped permission.
  return send(res,403,'F05_5_EMPLOYEE_ADDITION_SOURCE_GAP');
 };
}