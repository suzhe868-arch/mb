// 仅127.0.0.1的签名来源拒绝黑箱；无生产路由、无JYT/CDN/OSS出站。
import https from 'node:https';
import {readFileSync} from 'node:fs';
import {signedRead,assertCIEnv,physicalGate} from './gate.mjs';
const ORIGIN='https://127.0.0.1:49273';
const headers={'content-type':'application/json; charset=utf-8','cache-control':'no-store,private,max-age=0','pragma':'no-cache','referrer-policy':'no-referrer','x-content-type-options':'nosniff'};
const kind=new Map([['phone','publisher_phone'],['image','vehicle_photo'],['report','report_visible'],['original','report_original']]);
const safe=x=>typeof x==='string'&&x.length<400&&x.startsWith('/')&&!/%|\\|\/\/|[?#]|\.\./.test(x);
function reply(res,status){res.writeHead(status,headers);res.end(JSON.stringify({code:'DENIED',authority:'SIGNED_PARENT_NEGATIVE_ONLY'}));}
export async function createSecureGateServer(auth) {
 assertCIEnv();await physicalGate(auth.pool);
 const key=readFileSync(process.env.F07_3_TLS_KEY),cert=readFileSync(process.env.F07_3_TLS_CERT);
 return https.createServer({key,cert},async(req,res)=>{
  try{
   if(!req.socket.encrypted||!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress)||
   req.headers.host!=='127.0.0.1:49273'||(req.headers.origin&&req.headers.origin!==ORIGIN)||
   req.headers.forwarded||req.headers['x-forwarded-for']||req.headers.authorization||
   Object.keys(req.headers).some(k=>/customer|vin|car_code|publisher-id|role|scope/.test(k)))return reply(res,403);
   if(!safe(req.url))return reply(res,400);
   if(req.method!=='GET')return reply(res,405);
   const m=/^\/__ci__\/f07-3\/(phone|image|report|original)$/.exec(req.url);
   if(!m)return reply(res,404);
   const context={source_platform:req.headers['x-test-source'],upstream_publisher_id:req.headers['x-test-publisher'],vehicle_id:req.headers['x-test-vehicle']};
   // 每次GET重新通过冻结父Session/Permission读取器验签，不准缓存旧权限。
   await signedRead(auth,req.headers['x-test-session'],context,kind.get(m[1]));
   return reply(res,403);
  }catch{return reply(res,403)}
 });
}
