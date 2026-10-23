import {createServer as createHttpsServer,request as httpsRequest} from 'node:https';
import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {readSessionCookie} from '../../src/f03-auth-http.mjs';
import {constantMatch} from '../../src/f03-auth-crypto.mjs';
import {issueAssertion} from './issuer.mjs';
import {verifyAndAuthorize} from './verifier.mjs';
import {ChallengeStore} from './challenge-store.mjs';
import {ACTIONS,ORIGIN,validateChallenge} from './protocol.mjs';

const F07_ORIGIN='https://127.0.0.1:4317';
const F03_ORIGIN='https://127.0.0.1:4318';
const ACTIONS_SET=new Set(ACTIONS);
const VEHICLE_ID=/^[1-9][0-9]{0,18}$/;
const send=(res,status,body)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8',
 'cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer',
 'pragma':'no-cache'});res.end(JSON.stringify(body))};
function secureSameOrigin(req,origin){
 return req.socket?.encrypted===true&&req.socket?.remoteAddress==='127.0.0.1'&&
  req.headers.origin===origin&&req.headers.host===new URL(origin).host;
}
function sessionToken(req){
 try{return readSessionCookie(req.headers.cookie)}catch{return null}
}
function csrfOk(req,auth,token){
 return typeof req.headers['x-csrf-token']==='string'&&constantMatch(req.headers['x-csrf-token'],auth.csrfFor(token));
}
async function bodyObject(req,limit){
 if(typeof req.headers['content-type']!=='string'||
  !/^application\/json(?:;\s*charset=utf-8)?$/i.test(req.headers['content-type']))throw Error('CONTENT_TYPE');
 let bytes=0,raw='';
 for await(const part of req){bytes+=part.length;if(bytes>limit)throw Error('BODY_LIMIT');raw+=part.toString('utf8')}
 if(!raw)throw Error('EMPTY_BODY');
 let value;try{value=JSON.parse(raw)}catch{throw Error('INVALID_JSON')}
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('OBJECT_REQUIRED');
 return value;
}
function parseCode(value,fallback){
 return typeof value?.code==='string'&&/^[A-Z0-9_]{2,80}$/.test(value.code)?value.code:fallback;
}
function postIssuer({token,csrf,challenge,ca}){
 return new Promise((resolve,reject)=>{
  const body=Buffer.from(JSON.stringify({challenge}));
  const req=httpsRequest(F03_ORIGIN+'/__ci__/f03-f07/issue',{method:'POST',ca,rejectUnauthorized:true,
   servername:'127.0.0.1',timeout:4000,headers:{host:new URL(F03_ORIGIN).host,origin:F03_ORIGIN,
    cookie:'__Host-mb_pc='+token,'x-csrf-token':csrf,'content-type':'application/json',
    'content-length':String(body.length),'connection':'close'}},res=>{
    const parts=[];let size=0;
    res.on('data',part=>{size+=part.length;if(size>8192){req.destroy(Error('ISSUER_RESPONSE_LIMIT'));return}parts.push(part)});
    res.on('end',()=>{let data;try{data=JSON.parse(Buffer.concat(parts).toString('utf8'))}catch{data=null}
     if(!data||typeof data!=='object')return reject(Error('ISSUER_RESPONSE_INVALID'));
     resolve({status:res.statusCode,data});
    });
  });
  req.on('timeout',()=>req.destroy(Error('ISSUER_TIMEOUT')));req.on('error',()=>reject(Error('ISSUER_UNAVAILABLE')));
  req.end(body);
 });
}
export function createF03IssuerHandler({auth,privateKey,kid}){
 if(!auth||!privateKey||typeof kid!=='string')throw Error('F03_ISSUER_DEPENDENCIES_REQUIRED');
 return async(req,res)=>{
  const raw=req.url||'';
  if(raw.split('?')[0]!=='/__ci__/f03-f07/issue'){send(res,404,{ok:false,code:'NOT_FOUND'});return true}
  if(raw!=='/__ci__/f03-f07/issue'){send(res,400,{ok:false,code:'QUERY_FORBIDDEN'});return true}
  if(req.method!=='POST'){send(res,405,{ok:false,code:'METHOD_NOT_ALLOWED'});return true}
  if(!secureSameOrigin(req,F03_ORIGIN)){send(res,403,{ok:false,code:'SECURE_SAME_ORIGIN_REQUIRED'});return true}
  const token=sessionToken(req);
  if(!token){send(res,401,{ok:false,code:'SESSION_INVALID'});return true}
  if(!csrfOk(req,auth,token)){send(res,403,{ok:false,code:'CSRF_DENIED'});return true}
  let data;
  try{data=await bodyObject(req,4096)}catch(e){
   const code=e.message==='CONTENT_TYPE'?'CONTENT_TYPE_REQUIRED':e.message==='BODY_LIMIT'?'BODY_TOO_LARGE':
    e.message==='INVALID_JSON'?'INVALID_JSON':'INVALID_REQUEST_BODY';
   send(res,code==='CONTENT_TYPE_REQUIRED'?415:400,{ok:false,code});return true;
  }
  if(Object.keys(data).join('|')!=='challenge'||!validateChallenge(data.challenge)){
   send(res,400,{ok:false,code:'CHALLENGE_SHAPE_INVALID'});return true;
  }
  try{
   const out=await issueAssertion({auth,token,challenge:data.challenge,privateKey,kid});
   send(res,out.ok?200:403,out);
  }catch{send(res,503,{ok:false,code:'F03_CURRENT_FACTS_UNAVAILABLE'})}
  return true;
 };
}
export function createF07PhoneHandler({auth,pool,challengeStore,publicKey,kid,ca}){
 if(!auth||!pool||!challengeStore||!publicKey||typeof kid!=='string'||!ca)throw Error('F07_VERIFIER_DEPENDENCIES_REQUIRED');
 return async(req,res)=>{
  const raw=req.url||'',path=raw.split('?')[0];
  if(path!=='/__ci__/f07/phone/authorize'){send(res,404,{ok:false,code:'NOT_FOUND'});return true}
  const requestId=randomUUID();
  if(raw!==path){await challengeStore.record({requestId,stage:'HTTP_INPUT',decisionCode:'QUERY_FORBIDDEN'}).catch(()=>{});send(res,400,{ok:false,code:'QUERY_FORBIDDEN',origin:ORIGIN});return true}
  if(req.method!=='POST'){await challengeStore.record({requestId,stage:'HTTP_INPUT',decisionCode:'METHOD_NOT_ALLOWED'}).catch(()=>{});send(res,405,{ok:false,code:'METHOD_NOT_ALLOWED',origin:ORIGIN});return true}
  if(!secureSameOrigin(req,F07_ORIGIN)){await challengeStore.record({requestId,stage:'HTTP_INPUT',decisionCode:'SECURE_SAME_ORIGIN_REQUIRED'}).catch(()=>{});send(res,403,{ok:false,code:'SECURE_SAME_ORIGIN_REQUIRED',origin:ORIGIN});return true}
  const token=sessionToken(req);
  if(!token){await challengeStore.record({requestId,stage:'HTTP_INPUT',decisionCode:'SESSION_INVALID'}).catch(()=>{});send(res,401,{ok:false,code:'SESSION_INVALID',origin:ORIGIN});return true}
  if(!csrfOk(req,auth,token)){await challengeStore.record({requestId,stage:'HTTP_INPUT',decisionCode:'CSRF_DENIED'}).catch(()=>{});send(res,403,{ok:false,code:'CSRF_DENIED',origin:ORIGIN});return true}
  let data;
  try{data=await bodyObject(req,2048)}catch(e){
   const code=e.message==='CONTENT_TYPE'?'CONTENT_TYPE_REQUIRED':e.message==='BODY_LIMIT'?'BODY_TOO_LARGE':
    e.message==='INVALID_JSON'?'INVALID_JSON':'INVALID_REQUEST_BODY';
   await challengeStore.record({requestId,stage:'HTTP_INPUT',decisionCode:code}).catch(()=>{});
   send(res,code==='CONTENT_TYPE_REQUIRED'?415:400,{ok:false,code,origin:ORIGIN});return true;
  }
  if(Object.keys(data).sort().join('|')!=='action|vehicleId'||!ACTIONS_SET.has(data.action)||
   typeof data.vehicleId!=='string'||!VEHICLE_ID.test(data.vehicleId)||BigInt(data.vehicleId)>9223372036854775807n){
   await challengeStore.record({requestId,stage:'HTTP_INPUT',decisionCode:'INVALID_REQUEST'}).catch(()=>{});
   send(res,400,{ok:false,code:'INVALID_REQUEST',origin:ORIGIN});return true;
  }
  const employee=await auth.withSession(token,async(c,actor,session)=>{
   if(!session||session.restricted||actor.principal_kind!=='employee'||actor.employee_id==null||
    actor.system_admin_id!=null||actor.credential_state!=='enabled'||actor.subject_status!=='active'||
    actor.force_password_change!==false)return null;
   return String(actor.employee_id);
  },{normalOnly:true}).catch(()=>null);
  if(!employee){await challengeStore.record({requestId,stage:'HTTP_INPUT',decisionCode:'CURRENT_EMPLOYEE_SESSION_REQUIRED'}).catch(()=>{});send(res,401,{ok:false,code:'CURRENT_EMPLOYEE_SESSION_REQUIRED',origin:ORIGIN});return true}
  let challenge;
  try{challenge=await challengeStore.create({employeeId:employee,action:data.action,vehicleId:data.vehicleId,requestId})}
  catch{
   await challengeStore.record({requestId,employeeId:employee,action:data.action,vehicleId:data.vehicleId,stage:'F07_VERIFIER',decisionCode:'CHALLENGE_STORE_UNAVAILABLE'}).catch(()=>{});
   send(res,503,{ok:false,code:'CHALLENGE_STORE_UNAVAILABLE',origin:ORIGIN});return true;
  }
  let issued;
  try{issued=await postIssuer({token,csrf:auth.csrfFor(token),challenge,ca})}
  catch{
   await challengeStore.cancel(challenge).catch(()=>{});
   const auditId=await challengeStore.record({requestId,challengeId:challenge.challengeId,employeeId:employee,action:data.action,
    vehicleId:data.vehicleId,stage:'F03_ISSUER',decisionCode:'F03_ISSUER_UNAVAILABLE'}).catch(()=>null);
   send(res,503,{ok:false,code:'F03_ISSUER_UNAVAILABLE',origin:ORIGIN,auditId});return true;
  }
  if(issued.status!==200||issued.data.ok!==true||!issued.data.assertion){
   await challengeStore.cancel(challenge).catch(()=>{});
   const code=parseCode(issued.data,'F03_ISSUER_DENIED');
   const auditId=await challengeStore.record({requestId,challengeId:challenge.challengeId,employeeId:employee,action:data.action,
    vehicleId:data.vehicleId,stage:'F03_ISSUER',decisionCode:code}).catch(()=>null);
   send(res,403,{ok:false,code,origin:ORIGIN,auditId});return true;
  }
  const out=await verifyAndAuthorize({auth,pool,challengeStore,token,challenge,assertion:issued.data.assertion,
   publicKey,expectedKid:kid,guard:undefined});
  let auditId;
  try{auditId=await challengeStore.record({requestId,challengeId:challenge.challengeId,employeeId:employee,
   action:data.action,vehicleId:data.vehicleId,stage:out.stage==='F07_GUARD'?'F07_GUARD':'F07_VERIFIER',
   decisionCode:out.code,allowed:out.allowed===true})}
  catch{send(res,503,{ok:false,code:'DECISION_AUDIT_UNAVAILABLE',origin:ORIGIN});return true}
  const body={ok:out.allowed===true,allowed:out.allowed===true,code:out.code,origin:ORIGIN,
   formalSourceSigned:false,productionReady:false,auditId};
  send(res,out.allowed===true?200:403,body);return true;
 };
}
export function createHarness({authF03,authF07,pool,privateKey,publicKey,kid,key,cert,challengeStore=new ChallengeStore(pool)}){
 const certPem=Buffer.isBuffer(cert)?cert:Buffer.from(cert);
 const issuer=createHttpsServer({key,cert},createF03IssuerHandler({auth:authF03,privateKey,kid}));
 const f07=createHttpsServer({key,cert},createF07PhoneHandler({auth:authF07,pool,challengeStore,publicKey,kid,ca:certPem}));
 return {
  issuerServer:issuer,f07Server:f07,challengeStore,
  async listen({issuerPort=4318,f07Port=4317}={}){
   await Promise.all([
    new Promise((resolve,reject)=>issuer.once('error',reject).listen(issuerPort,'127.0.0.1',resolve)),
    new Promise((resolve,reject)=>f07.once('error',reject).listen(f07Port,'127.0.0.1',resolve))
   ]);
  },
  async close(){await Promise.all([issuer,f07].map(s=>new Promise(resolve=>{if(!s.listening)return resolve();s.close(()=>resolve())})))}
 };
}
export async function loadHarnessTls(env=process.env){
 if(!env.F03_F07_TLS_KEY_PATH||!env.F03_F07_TLS_CERT_PATH)throw Error('F03_F07_TLS_REQUIRED');
 return {key:await readFile(env.F03_F07_TLS_KEY_PATH),cert:await readFile(env.F03_F07_TLS_CERT_PATH)};
}
