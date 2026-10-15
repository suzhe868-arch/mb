// F07-4 只绑定127.0.0.1:49274；无真实飞书、微信或外部网络出口。
import https from 'node:https';
import {readFileSync} from 'node:fs';
import {assertCIEnv,physicalGate,dispatch,deepLinkGuard} from './gate.mjs';
const PORT=49274,ORIGIN='https://127.0.0.1:49274';
const hdr={'content-type':'application/json; charset=utf-8','cache-control':'no-store, private, max-age=0','pragma':'no-cache','referrer-policy':'no-referrer','x-content-type-options':'nosniff'};
const send=(res,status,result)=>{res.writeHead(status,hdr);res.end(JSON.stringify({result}));};
export async function createServer(db,{audit=()=>{}}={}) {
 assertCIEnv();await physicalGate(db);
 const key=readFileSync(process.env.F07_4_TLS_KEY);
 const cert=readFileSync(process.env.F07_4_TLS_CERT);
 return https.createServer({key,cert},async(req,res)=>{
  let auditCode='TRANSPORT_DENIED',parentCalls=0;
  const record=(category,code)=>audit(Object.freeze({category,code,parentCalls}));
  try {
   if(!req.socket.encrypted||!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress)||
    req.headers.host!=='127.0.0.1:49274'||(req.headers.origin&&req.headers.origin!==ORIGIN)||
    req.headers.forwarded||req.headers['x-forwarded-for']||req.headers.authorization||
    Object.keys(req.headers).some(k=>/customer|vin|token|publisher|secret|scope|phone/i.test(k))){
    record('TRANSPORT',auditCode);return send(res,403,'DENIED');
   }
   if(typeof req.url!=='string'||req.url.length>512||/%|\\|\.\.|\/\//.test(req.url)){
    record('TRANSPORT','PATH_DENIED');return send(res,400,'DENIED');
   }
   if(req.url==='/__ci__/f07-4/link'&&req.method==='GET') {
    parentCalls=1;
    const result=deepLinkGuard(req.headers['x-ci-link']||'');
    record('LINK',result.code);
    return send(res,403,'DENIED');
   }
   if(req.url!=='/__ci__/f07-4/dispatch'||req.method!=='POST') {
    record('TRANSPORT','ROUTE_OR_METHOD_DENIED');return send(res,404,'DENIED');
   }
   if(req.headers['x-f07-4-mode']!=='CI_SYNTHETIC_ONLY') {
    record('AUTH','UNSIGNED_PARENT_SOURCE_GAP');return send(res,403,'DENIED');
   }
   const chunks=[];let size=0;
   for await(const chunk of req){size+=chunk.length;if(size>1024){record('INPUT','OVERSIZE_DENIED');return send(res,413,'DENIED');}chunks.push(chunk);}
   let body;try{body=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{record('INPUT','JSON_DENIED');return send(res,400,'DENIED');}
   if(!body||Object.keys(body).sort().join(',')!=='at,channel,eventId'||typeof body.eventId!=='string'){
    record('INPUT','SHAPE_DENIED');return send(res,400,'DENIED');
   }
   parentCalls=1; // 合成事件读当前PG物理事实，不等于正式签名父正例。
   const result=await dispatch(db,{eventId:body.eventId,channel:body.channel,at:body.at});
   record('DISPATCH',result.code);
   // 黑箱只给通用结果，内部审计准确记录逐请求拒绝原因。
   return send(res,result.status==='SENT'?202:result.status==='DEDUPED'?200:403,result.status==='SENT'?'MOCK_ACCEPTED':'DENIED');
  } catch {record('ERROR','FAIL_CLOSED');return send(res,403,'DENIED');}
 });
}
export const ENDPOINT=ORIGIN;
