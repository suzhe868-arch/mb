import { createServer } from 'node:http';
const sendJson=(res,status,body)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify(body))};
async function checkReady(readinessProbe,timeoutMs){let timer;try{return await Promise.race([Promise.resolve().then(()=>readinessProbe()),new Promise(resolve=>{timer=setTimeout(()=>resolve(false),timeoutMs);timer.unref?.()})])}finally{clearTimeout(timer)}}
export function createFoundationHandler({readinessProbe=async()=>false,readinessTimeoutMs=1000,authHandler=null,catalogHandler=null,favoriteHandler=null,consultationHandler=null,employeeStartHandler=null,handoverHandler=null,slaHoldHandler=null,priceUnlockHandler=null,quotaAdditionHandler=null,findCarHandler=null,findCarActivationHandler=null,matchingHandler=null,dictionaryHandler=null,discoveryHandler=null,recommendationHandler=null,priorityHandler=null,priorityQualificationHandler=null,demandLifecycleHandler=null,employeeVehicleReadHandler=null,consultationResponseHandler=null,publicPoolConsultationHandler=null,lockHandler=null,f07RuntimeHandler=null,publisherPhoneAdminHandler=null,customerOtherPhoneHandler=null}={}){
 if(!Number.isInteger(readinessTimeoutMs)||readinessTimeoutMs<1||readinessTimeoutMs>10000)throw Error('INVALID_READINESS_TIMEOUT');
 return async(req,res)=>{
  const pathname=(req.url??'/').split('?')[0];
  if(pathname==='/api/v1/health/live'||pathname==='/api/v1/health/ready'){
   if(req.method!=='GET')return sendJson(res,405,{code:'METHOD_NOT_ALLOWED'});
   if(pathname.endsWith('/live'))return sendJson(res,200,{ok:true});
   try{const ready=await checkReady(readinessProbe,readinessTimeoutMs);return sendJson(res,ready===true?200:503,ready===true?{ok:true}:{ok:false,code:'DEPENDENCY_NOT_READY'})}catch{return sendJson(res,503,{ok:false,code:'DEPENDENCY_NOT_READY'})}
  }
  if(f07RuntimeHandler&&pathname.startsWith('/__ci__/f07-runtime/')&&await f07RuntimeHandler(req,res)===true)return;
  if(publisherPhoneAdminHandler&&await publisherPhoneAdminHandler(req,res)===true)return;
  // Explicit dependency injection only. The default server never supplies this CI-only handler.
  if(customerOtherPhoneHandler&&pathname.startsWith('/__ci__/f03/customers/')&&await customerOtherPhoneHandler(req,res)===true)return;
  if(lockHandler&&await lockHandler(req,res)===true)return;
  if(authHandler&&await authHandler(req,res)===true)return;
  if(publicPoolConsultationHandler&&await publicPoolConsultationHandler(req,res)===true)return;
  if(priorityQualificationHandler&&await priorityQualificationHandler(req,res)===true)return;
  if(priorityHandler&&await priorityHandler(req,res)===true)return;
  if(recommendationHandler&&await recommendationHandler(req,res)===true)return;
  if(discoveryHandler&&await discoveryHandler(req,res)===true)return;
  if(dictionaryHandler&&await dictionaryHandler(req,res)===true)return;
  if(matchingHandler&&await matchingHandler(req,res)===true)return;
  if(demandLifecycleHandler&&await demandLifecycleHandler(req,res)===true)return;
  if(findCarActivationHandler&&await findCarActivationHandler(req,res)===true)return;
  if(findCarHandler&&await findCarHandler(req,res)===true)return;
  if(quotaAdditionHandler&&await quotaAdditionHandler(req,res)===true)return;
  if(priceUnlockHandler&&await priceUnlockHandler(req,res)===true)return;
  if(slaHoldHandler&&await slaHoldHandler(req,res)===true)return;
  if(handoverHandler&&await handoverHandler(req,res)===true)return;
  if(consultationResponseHandler&&await consultationResponseHandler(req,res)===true)return;
  if(employeeStartHandler&&await employeeStartHandler(req,res)===true)return;
  if(consultationHandler&&await consultationHandler(req,res)===true)return;
  if(favoriteHandler&&await favoriteHandler(req,res)===true)return;
  if(employeeVehicleReadHandler&&await employeeVehicleReadHandler(req,res)===true)return;
  if(catalogHandler&&await catalogHandler(req,res)===true)return;
  return sendJson(res,404,{code:'NOT_IMPLEMENTED'});
 }
}
export function createFoundationServer(options={}){return createServer(createFoundationHandler(options))}
