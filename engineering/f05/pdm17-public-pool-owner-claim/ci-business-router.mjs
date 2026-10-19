// F05-10-D1 positive loopback TLS carrier for current B acceptance only.
// The random issuer token is injected by the test process and is never a production credential.
import {syntheticServiceRequest,serviceAssignCI,syntheticConsultationRequest,createConsultationAfterOwnerCI} from './service.mjs';
const ORIGIN='https://127.0.0.1:49222';
const local=x=>['127.0.0.1','::1','::ffff:127.0.0.1'].includes(x);
const send=(res,status,body)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8',
 'cache-control':'private, no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify(body))};
const validToken=x=>typeof x==='string'&&/^[A-Za-z0-9_-]{43}$/.test(x);
const validId=x=>Number.isSafeInteger(Number(x))&&Number(x)>0&&String(Number(x))===String(x);
const validKey=x=>typeof x==='string'&&/^[A-Za-z0-9._:-]{20,160}$/.test(x);
export function createD1BusinessCIHandler({issuerToken}={}){
 for(const [k,v] of Object.entries({CI:'true',GITHUB_ACTIONS:'true',APP_ENV:'test',NODE_ENV:'test',
  F05_2_ISOLATION_CONFIRM:'I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY'}))
  if(process.env[k]!==v)throw Error('D1_BUSINESS_HTTP_TEST_ONLY_'+k);
 if(!validToken(issuerToken))throw Error('D1_BUSINESS_HTTP_ISSUER_REQUIRED');
 return async(req,res)=>{
  const raw=req.url??'';
  if(raw!=='/api/v1/public-pool/consultations'){send(res,404,{code:'NOT_FOUND'});return true}
  if(req.method!=='POST'){send(res,405,{code:'METHOD_NOT_ALLOWED'});return true}
  const h=req.headers;
  if(!req.socket?.encrypted||!local(req.socket.remoteAddress)||h.host!=='127.0.0.1:49222'||
    h.origin!==ORIGIN||h.cookie||h['transfer-encoding']||h['content-type']!=='application/json'||
    Object.keys(h).some(k=>/(owner|role|scope|employee|wechat|phone|forwarded|^x-forwarded-)/i.test(k))){
   send(res,403,{code:'D1_BUSINESS_UNTRUSTED_REQUEST'});return true;
  }
  if(h.authorization!=='Bearer '+issuerToken){
   send(res,403,{code:'D1_BUSINESS_ISSUER_REQUIRED'});return true;
  }
  let bytes=0,chunks=[];
  try{
   for await(const part of req){bytes+=part.length;if(bytes>700){send(res,413,{code:'D1_BUSINESS_BODY_TOO_LARGE'});return true}chunks.push(part)}
   let body;try{body=JSON.parse(Buffer.concat(chunks).toString('utf8'))}
   catch{send(res,400,{code:'D1_BUSINESS_INVALID_JSON'});return true}
   if(!body||typeof body!=='object'||Array.isArray(body)||
      Object.keys(body).sort().join(',')!=='consultationRequestKey,customerId,listingCycleId,ownerRequestKey,vehicleId'||
      ![body.customerId,body.vehicleId,body.listingCycleId].every(validId)||
      !validKey(body.ownerRequestKey)||!validKey(body.consultationRequestKey)){
    send(res,400,{code:'D1_BUSINESS_INVALID_REQUEST'});return true;
   }
   const intent=syntheticConsultationRequest(Number(body.customerId),Number(body.vehicleId),Number(body.listingCycleId));
   // Replay/current-owner path first: do not re-enter PDM17 after its pool cycle has
   // already moved from in_pool to assigned.
   let consultation=await createConsultationAfterOwnerCI(intent,{requestKey:body.consultationRequestKey});
   if(consultation.allowed){
    send(res,200,{code:consultation.code,consultationId:consultation.consultationId,
     ownerId:consultation.ownerId,assigneeEmployeeId:consultation.assigneeEmployeeId,
     created:consultation.created,productionReady:false});return true;
   }
   if(!['D1_CONSULTATION_OWNER_NOT_FORMED','D1_CONSULTATION_OWNER_NOT_D1_CURRENT'].includes(consultation.code)){
    send(res,409,{code:consultation.code,ownerFormed:true,productionReady:false});return true;
   }
   const owner=await serviceAssignCI(syntheticServiceRequest(Number(body.customerId)),{requestKey:body.ownerRequestKey});
   if(!owner.allowed){
    send(res,409,{code:owner.code,productionReady:false});return true;
   }
   consultation=await createConsultationAfterOwnerCI(intent,{requestKey:body.consultationRequestKey});
   if(!consultation.allowed){
    send(res,409,{code:consultation.code,ownerFormed:true,ownerId:owner.ownerId,productionReady:false});return true;
   }
   send(res,200,{code:consultation.code,consultationId:consultation.consultationId,
    ownerId:consultation.ownerId,assigneeEmployeeId:consultation.assigneeEmployeeId,
    created:consultation.created,productionReady:false});
   return true;
  }catch{
   send(res,503,{code:'D1_BUSINESS_DEPENDENCY_NOT_READY'});return true;
  }
 };
}
