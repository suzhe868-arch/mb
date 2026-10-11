// F05-3E strictly isolated loopback TLS route, never registered in production.
// Because current trusted manual/other hide cause source is absent, all attempts
// to change a Vehicle visibility are denied; no raw conditions JSON is exposed.
import {timingSafeEqual} from 'node:crypto';
import {readSessionCookie} from '../../src/f03-auth-http.mjs';
import {auditRecalculation} from './audit.mjs';
const ORIGIN='https://127.0.0.1:48987';
const headers={'content-type':'application/json; charset=utf-8',
 'cache-control':'private, no-store, max-age=0','pragma':'no-cache',
 'x-content-type-options':'nosniff','x-frame-options':'DENY','referrer-policy':'no-referrer'};
const deny=(res,status=403)=>{res.writeHead(status,headers);res.end(JSON.stringify({code:'F05_3E_HIDE_REASON_NOT_ATTESTED'}))};
const local=x=>['127.0.0.1','::1','::ffff:127.0.0.1'].includes(x);
async function jsonBody(req){
 if(req.headers['content-type']!=='application/json'||req.headers['transfer-encoding'])throw Error('CONTENT_TYPE');
 const n=Number(req.headers['content-length']);
 if(!Number.isSafeInteger(n)||n<2||n>2048)throw Error('BODY_SIZE');
 let value='',actual=0;
 for await(const chunk of req){value+=chunk.toString('utf8');actual+=chunk.length;if(actual>2048)throw Error('LIMIT')}
 if(actual!==n)throw Error('LENGTH');
 const data=JSON.parse(value);
 if(!data||typeof data!=='object'||Array.isArray(data))throw Error('OBJECT');
 return data;
}
export async function createHideReasonCIHandler(auth){
 for(const [k,v] of Object.entries({CI:'true',GITHUB_ACTIONS:'true',APP_ENV:'test',NODE_ENV:'test',
  F05_2_ISOLATION_CONFIRM:'I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY'}))
  if(process.env[k]!==v)throw Error('F05_3E_TLS_NOT_ISOLATED_'+k);
 if(auth?.origin!==ORIGIN||!auth?.pool||
  !/^postgres:\/\/f03_ci:[^@]+@127\.0\.0\.1:5432\/f03_auth_test$/.test(process.env.F03_1_DATABASE_URL||''))
  throw Error('F05_3E_TLS_WRONG_DB_OR_ORIGIN');
 return async(req,res)=>{
  const raw=req.url||'';
  if(raw.length>1024||!raw.startsWith('/')||/%2e|%2f|%5c|%00|\\|\/\.\.?($|\/)|\/\//i.test(raw))return deny(res,400);
  let url;try{url=new URL(raw,ORIGIN)}catch{return deny(res,400)}
  const found=/^\/__ci__\/f05-3e\/v1\/vehicles\/([1-9][0-9]{0,14})\/recalculate-visibility$/.exec(url.pathname);
  if(url.origin!==ORIGIN||url.search||url.hash||!found)return deny(res,404);
  if(req.method!=='POST')return deny(res,405);
  if(!req.socket?.encrypted||!local(req.socket.remoteAddress)||req.headers.origin!==ORIGIN||
    req.headers.host!==new URL(ORIGIN).host||req.headers.authorization||
    Object.keys(req.headers).some(k=>/(forwarded|publisher|owner|role|customer|price|vin|wholesale|scope|reason)/i.test(k)))
    return deny(res);
  let token;try{token=readSessionCookie(req.headers.cookie)}catch{return deny(res)}
  if(!token)return deny(res);
  const expected=auth.csrfFor(token),given=req.headers['x-csrf-token'];
  if(typeof given!=='string'||given.length!==expected.length||
   !timingSafeEqual(Buffer.from(given),Buffer.from(expected)))return deny(res);
  let dto;try{dto=await jsonBody(req)}catch{return deny(res,400)}
  if(!Number.isSafeInteger(Number(found[1]))||Number(found[1])!==dto.vehicleId)return deny(res,400);
  try{
   const x=await auditRecalculation(auth,token,dto);
   if(x.allowed)throw Error('F05_3E_NEVER_AUTHORIZE_VISIBILITY_WITHOUT_CAUSE_SOURCE');
   return deny(res);
  }catch{return deny(res)}
 };
}
