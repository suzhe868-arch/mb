// CI-only loopback HTTPS handler. Never imported by engineering/src/server.mjs.
import {readSessionCookie} from '../../src/f03-auth-http.mjs';
const ORIGIN='https://127.0.0.1:48984';
const BASE='/__ci__/f05-manual-vehicle/v1/drafts';
const HEADERS={
 'content-type':'application/json; charset=utf-8',
 'cache-control':'private, no-store, max-age=0',
 pragma:'no-cache',
 'strict-transport-security':'max-age=0',
 'x-content-type-options':'nosniff',
 'x-frame-options':'DENY',
 'referrer-policy':'no-referrer'
};
const send=(res,status,body)=>{res.writeHead(status,HEADERS);res.end(JSON.stringify(body))};
const denied=(res,status,code)=>send(res,status,{code,productionReady:false});
const local=x=>['127.0.0.1','::1','::ffff:127.0.0.1'].includes(x);
function isolated(env){
 const exact={CI:'true',GITHUB_ACTIONS:'true',APP_ENV:'test',NODE_ENV:'test',
  F05_2_ISOLATION_CONFIRM:'I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY',
  F05_MANUAL_VEHICLE_DRAFT_PUBLISH_CONSENT:'I_AUTHORIZE_F05_MANUAL_VEHICLE_DRAFT_PUBLISH_PG16_ONLY'};
 for(const [k,v] of Object.entries(exact))if(env[k]!==v)throw Error('F05_MANUAL_DRAFT_HTTP_ENV_DENIED_'+k);
 if(env.GITHUB_REPOSITORY!=='suzhe868-arch/mb'||env.GITHUB_EVENT_NAME!=='push'||
    env.GITHUB_REF!=='refs/heads/feat/f05-manual-vehicle-draft-publish-pg16-01'&&env.GITHUB_REF!=='refs/heads/feat/f05-f06-same-vehicle-signed-bridge-pg16-01')throw Error('F05_MANUAL_DRAFT_HTTP_BRANCH_DENIED');
}
async function readJson(req){
 const length=req.headers['content-length'];
 if(length!==undefined&&(!/^\d+$/.test(length)||Number(length)>32768))throw Object.assign(new Error('REQUEST_TOO_LARGE'),{status:413});
 if(req.headers['transfer-encoding'])throw Object.assign(new Error('TRANSFER_ENCODING_DENIED'),{status:400});
 if(!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(req.headers['content-type']||''))throw Object.assign(new Error('JSON_CONTENT_TYPE_REQUIRED'),{status:415});
 const chunks=[];let size=0;
 for await(const chunk of req){
  size+=chunk.length;
  if(size>32768)throw Object.assign(new Error('REQUEST_TOO_LARGE'),{status:413});
  chunks.push(chunk);
 }
 if(!size)throw Object.assign(new Error('JSON_BODY_REQUIRED'),{status:400});
 try{
  const body=JSON.parse(Buffer.concat(chunks).toString('utf8'));
  if(!body||typeof body!=='object'||Array.isArray(body))throw new Error('JSON_OBJECT_REQUIRED');
  return body;
 }catch{throw Object.assign(new Error('JSON_OBJECT_REQUIRED'),{status:400})}
}
export function createManualVehicleDraftHandler(service,{env=process.env}={}){
 isolated(env);
 if(!service||!['autoSave','list','get','deleteDraft','publish'].every(k=>typeof service[k]==='function'))
  throw Error('F05_MANUAL_DRAFT_SERVICE_REQUIRED');
 return async(req,res)=>{
  const raw=req.url||'';
  if(raw.length>2048||!raw.startsWith('/')||/%2e|%2f|%5c|%00|\\|\/\.\.?($|\/)|\/\//i.test(raw))
   return denied(res,400,'REQUEST_PATH_INVALID');
  let url;
  try{url=new URL(raw,ORIGIN)}catch{return denied(res,400,'REQUEST_PATH_INVALID')}
  if(url.origin!==ORIGIN||url.search||url.hash)return denied(res,403,'REQUEST_TARGET_DENIED');
  if(!req.socket?.encrypted||!local(req.socket.remoteAddress)||req.headers.host!==new URL(ORIGIN).host||
    req.headers.origin!==ORIGIN||req.headers.authorization||req.headers['transfer-encoding']||
    (req.headers['content-length']&&req.headers['content-length']!=='0'&&!['POST','PUT','DELETE'].includes(req.method))||
    Object.keys(req.headers).some(k=>/(merchant|team|owner|role|level|publisher|customer|scope|forwarded|employee|actor|identity)/i.test(k)))
   return denied(res,403,'REQUEST_CONTEXT_DENIED');
  let token;
  try{token=readSessionCookie(req.headers.cookie)}catch{return denied(res,401,'EMPLOYEE_SESSION_REQUIRED')}
  if(!token)return denied(res,401,'EMPLOYEE_SESSION_REQUIRED');
  const pathname=url.pathname;
  let result;
  try{
   if(pathname===BASE&&req.method==='GET'){
    if(req.headers['content-length']&&req.headers['content-length']!=='0')return denied(res,400,'GET_BODY_DENIED');
    result=await service.list(token);
   }else if(pathname===BASE+'/auto-save'&&req.method==='POST'){
    result=await service.autoSave(token,await readJson(req));
   }else{
    const match=new RegExp('^'+BASE+'/([1-9][0-9]{0,17})(/publish)?$').exec(pathname);
    if(!match)return denied(res,404,'ROUTE_NOT_FOUND');
    const draftId=match[1],publish=match[2]==='/publish';
    if(publish&&req.method==='POST')result=await service.publish(token,draftId,await readJson(req));
    else if(!publish&&req.method==='GET'){
     if(req.headers['content-length']&&req.headers['content-length']!=='0')return denied(res,400,'GET_BODY_DENIED');
     result=await service.get(token,draftId);
    }else if(!publish&&req.method==='PUT')result=await service.autoSave(token,{draftId, ...await readJson(req)});
    else if(!publish&&req.method==='DELETE')result=await service.deleteDraft(token,draftId,await readJson(req));
    else return denied(res,405,'METHOD_NOT_ALLOWED');
   }
  }catch(e){return denied(res,e?.status||400,e?.message==='REQUEST_TOO_LARGE'?'REQUEST_TOO_LARGE':'REQUEST_INVALID')}
  if(!result||!Number.isInteger(result.status)||!result.body||typeof result.body!=='object')
   return denied(res,503,'MANUAL_DRAFT_SERVICE_UNAVAILABLE');
  return send(res,result.status,result.body);
 };
}
