// CI-only loopback endpoint. No authentic WeChat Customer session -> never 200.
import {timingSafeEqual} from 'node:crypto';
import {readSessionCookie} from '../../src/f03-auth-http.mjs';
const ORIGIN='https://127.0.0.1:48987';
const headers={'content-type':'application/json; charset=utf-8','cache-control':'private, no-store, max-age=0',
 'pragma':'no-cache','x-content-type-options':'nosniff','referrer-policy':'no-referrer'};
const deny=(res,code=403)=>{res.writeHead(code,headers);res.end(JSON.stringify({code:'F05_3H_CUSTOMER_IDENTITY_SOURCE_GAP'}))};
const local=x=>['127.0.0.1','::1','::ffff:127.0.0.1'].includes(x);
export async function createCustomerActorAuditCIHandler(auth){
 for(const [k,v] of Object.entries({CI:'true',GITHUB_ACTIONS:'true',APP_ENV:'test',NODE_ENV:'test',F05_2_ISOLATION_CONFIRM:'I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY'}))
  if(process.env[k]!==v)throw Error('F05_3H_TLS_CI_ONLY');
 if(auth?.origin!==ORIGIN||!auth?.pool||!/^postgres:\/\/f03_ci:[^@]+@127\.0\.0\.1:5432\/f03_auth_test$/.test(process.env.F03_1_DATABASE_URL||''))
  throw Error('F05_3H_WRONG_DB_ORIGIN');
 return async(req,res)=>{
  const raw=req.url||'';
  if(raw.length>1024||!raw.startsWith('/')||/%2e|%2f|%5c|%00|\\|\/\.\.?($|\/)|\/\//i.test(raw))return deny(res,400);
  let url;try{url=new URL(raw,ORIGIN)}catch{return deny(res,400)}
  const found=/^\/__ci__\/f05-3h\/v1\/vehicles\/([1-9][0-9]{0,14})\/favorite$/.exec(url.pathname);
  if(url.origin!==ORIGIN||url.search||url.hash||!found)return deny(res,404);
  if(!['GET','POST','DELETE'].includes(req.method))return deny(res,405);
  if(!req.socket?.encrypted||!local(req.socket.remoteAddress)||req.headers.origin!==ORIGIN||
   req.headers.host!==new URL(ORIGIN).host||req.headers.authorization||
   Object.keys(req.headers).some(k=>/(forwarded|publisher|owner|role|customer|price|vin|wholesale|scope|lock|jyt|trusted)/i.test(k)))
   return deny(res);
  let token;try{token=readSessionCookie(req.headers.cookie)}catch{return deny(res)}
  if(!token)return deny(res);
  const expected=auth.csrfFor(token),given=req.headers['x-csrf-token'];
  if(typeof given!=='string'||given.length!==expected.length||
     !timingSafeEqual(Buffer.from(given),Buffer.from(expected)))return deny(res);
  if(req.headers['content-length']&&req.headers['content-length']!=='0')return deny(res,400);
  // No PG16 Customer Favorite operation is reachable from Employee/4S/Admin.
  // The only positive service is isolated syntheticFavoriteChange() in PG CI.
  return deny(res);
 };
}
