// ONE CI-only loopback HTTPS mutation. Deliberately not in production server.mjs.
import {timingSafeEqual} from 'node:crypto';
import {readSessionCookie} from '../../src/f03-auth-http.mjs';
import {verify} from './migration.mjs';
import {convertWholesaleToMingbang} from './service.mjs';
const ORIGIN='https://127.0.0.1:48987';
const headers={'content-type':'application/json; charset=utf-8',
 'cache-control':'private, no-store, max-age=0','pragma':'no-cache','x-content-type-options':'nosniff',
 'x-frame-options':'DENY','referrer-policy':'no-referrer'};
const local=x=>['127.0.0.1','::1','::ffff:127.0.0.1'].includes(x);
function send(res,status,p){res.writeHead(status,headers);res.end(JSON.stringify(p))}
const denied=(res,status=403)=>send(res,status,{code:'F05_3C_CONVERSION_SCOPE_UNPROVEN'});
async function body(req){
 if(req.headers['content-type']!=='application/json'||req.headers['transfer-encoding'])throw Error('CONTENT_TYPE');
 const declared=Number(req.headers['content-length']);
 if(!Number.isSafeInteger(declared)||declared<2||declared>2048)throw Error('BAD_LENGTH');
 let x='',n=0;for await(const part of req){x+=part.toString('utf8');n+=part.length;if(n>2048)throw Error('EXCEEDS_LIMIT')}
 if(n!==declared)throw Error('LENGTH_MISMATCH');
 const obj=JSON.parse(x);if(!obj||typeof obj!=='object'||Array.isArray(obj))throw Error('BAD_SHAPE');
 return obj;
}
export async function createConversionCIHandler(auth) {
 for(const [k,v] of Object.entries({CI:'true',GITHUB_ACTIONS:'true',APP_ENV:'test',NODE_ENV:'test',
  F05_2_ISOLATION_CONFIRM:'I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY'}))
  if(process.env[k]!==v)throw Error('F05_3C_TLS_CI_ONLY_'+k);
 if(auth?.origin!==ORIGIN||!auth?.pool||
 !/^postgres:\/\/f03_ci:[^@]+@127\.0\.0\.1:5432\/f03_auth_test$/.test(process.env.F03_1_DATABASE_URL||''))
  throw Error('F05_3C_TLS_UNTRUSTED_SOURCE');
 await verify(auth.pool);
 return async(req,res)=>{
  const raw=req.url||'';
  if(raw.length>1024||!raw.startsWith('/')||/%2e|%2f|%5c|%00|\\|\/\.\.?($|\/)|\/\//i.test(raw))
   return denied(res,400);
  let url;try{url=new URL(raw,ORIGIN)}catch{return denied(res,400)}
  const match=/^\/__ci__\/f05-3c\/v1\/vehicles\/([1-9][0-9]{0,14})\/convert-mingbang$/.exec(url.pathname);
  if(url.origin!==ORIGIN||url.search||url.hash||!match)return denied(res,404);
  if(req.method!=='POST')return denied(res,405);
  if(!req.socket?.encrypted||!local(req.socket.remoteAddress)||req.headers.origin!==ORIGIN||
   req.headers.host!==new URL(ORIGIN).host||req.headers.authorization||
   Object.keys(req.headers).some(k=>/(forwarded|publisher|owner|role|merchant|customer|price|vin|wholesale|scope)/i.test(k)))
   return denied(res);
  let token;try{token=readSessionCookie(req.headers.cookie)}catch{return denied(res)}
  if(!token)return denied(res);
  const expected=auth.csrfFor(token),given=req.headers['x-csrf-token'];
  if(typeof given!=='string'||given.length!==expected.length||
     !timingSafeEqual(Buffer.from(given),Buffer.from(expected)))return denied(res);
  let args;try{args=await body(req)}catch{return denied(res,400)}
  if(!Number.isSafeInteger(Number(match[1]))||Number(match[1])!==args.vehicleId)return denied(res,400);
  try{
   const out=await convertWholesaleToMingbang(auth,token,args);
   if(!out.allowed)return denied(res);
   return send(res,200,{
    code:out.code,conversionId:out.conversionId,vehicleId:out.vehicleId,
    listingCycleId:out.listingCycleId,assetState:out.assetState,
    visibilityState:out.visibilityState||'HIDE_REASON_RECALCULATION_SOURCE_GAP'
   });
  }catch{return denied(res)}
 };
}
