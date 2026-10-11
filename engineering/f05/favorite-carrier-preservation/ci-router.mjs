// F05-3F: read-only Favorite source failure via isolated loopback TLS.
// There is NO trusted Favorite carrier, therefore never issue an authorized
// customer Favorite state or pretend a Recommendation is a Favorite.
import {timingSafeEqual} from 'node:crypto';
import {readSessionCookie} from '../../src/f03-auth-http.mjs';
import {projectFavorite} from './audit.mjs';
const ORIGIN='https://127.0.0.1:48987';
const headers={'content-type':'application/json; charset=utf-8',
 'cache-control':'private, no-store, max-age=0','pragma':'no-cache',
 'x-content-type-options':'nosniff','x-frame-options':'DENY','referrer-policy':'no-referrer'};
const deny=(res,status=403)=>{res.writeHead(status,headers);res.end(JSON.stringify({code:'F05_3F_FAVORITE_CARRIER_NOT_ATTESTED'}))};
const local=x=>['127.0.0.1','::1','::ffff:127.0.0.1'].includes(x);
export async function createFavoriteCIHandler(auth){
 for(const [k,v] of Object.entries({CI:'true',GITHUB_ACTIONS:'true',APP_ENV:'test',NODE_ENV:'test',
  F05_2_ISOLATION_CONFIRM:'I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY'}))
  if(process.env[k]!==v)throw Error('F05_3F_TLS_CI_ONLY_'+k);
 if(auth?.origin!==ORIGIN||!auth?.pool||
  !/^postgres:\/\/f03_ci:[^@]+@127\.0\.0\.1:5432\/f03_auth_test$/.test(process.env.F03_1_DATABASE_URL||''))
  throw Error('F05_3F_WRONG_LOOPBACK_OR_DATABASE');
 return async(req,res)=>{
  const raw=req.url||'';
  if(raw.length>1024||!raw.startsWith('/')||/%2e|%2f|%5c|%00|\\|\/\.\.?($|\/)|\/\//i.test(raw))return deny(res,400);
  let url;try{url=new URL(raw,ORIGIN)}catch{return deny(res,400)}
  const m=/^\/__ci__\/f05-3f\/v1\/vehicles\/([1-9][0-9]{0,14})\/favorite$/.exec(url.pathname);
  if(url.origin!==ORIGIN||url.search||url.hash||!m)return deny(res,404);
  if(!['GET','POST','DELETE'].includes(req.method))return deny(res,405);
  if(!req.socket?.encrypted||!local(req.socket.remoteAddress)||req.headers.origin!==ORIGIN||
   req.headers.host!==new URL(ORIGIN).host||req.headers.authorization||
   Object.keys(req.headers).some(x=>/(forwarded|publisher|owner|role|customer|price|vin|wholesale|scope|lock|jyt)/i.test(x)))
   return deny(res);
  let token;try{token=readSessionCookie(req.headers.cookie)}catch{return deny(res)}
  if(!token)return deny(res);
  const exp=auth.csrfFor(token),actual=req.headers['x-csrf-token'];
  if(typeof actual!=='string'||actual.length!==exp.length||
    !timingSafeEqual(Buffer.from(exp),Buffer.from(actual)))return deny(res);
  if(req.headers['content-length']&&req.headers['content-length']!=='0')return deny(res,400);
  const vehicleId=Number(m[1]);
  if(!Number.isSafeInteger(vehicleId)||vehicleId<=0)return deny(res,400);
  try{
   const result=await projectFavorite(auth,token,{vehicleId});
   if(result.allowed)throw Error('F05_3F_UNTRUSTED_FAVORITE_SUCCESS');
   return deny(res);
  }catch{return deny(res)}
 };
}
