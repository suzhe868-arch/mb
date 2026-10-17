import { createServer } from 'node:http';
const sendJson=(res,status,body)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify(body))};
async function checkReady(readinessProbe,timeoutMs){let timer;try{return await Promise.race([Promise.resolve().then(()=>readinessProbe()),new Promise(resolve=>{timer=setTimeout(()=>resolve(false),timeoutMs);timer.unref?.()})])}finally{clearTimeout(timer)}}
export function createFoundationHandler({readinessProbe=async()=>false,readinessTimeoutMs=1000,authHandler=null,catalogHandler=null}={}){
 if(!Number.isInteger(readinessTimeoutMs)||readinessTimeoutMs<1||readinessTimeoutMs>10000)throw Error('INVALID_READINESS_TIMEOUT');
 return async(req,res)=>{
  const pathname=(req.url??'/').split('?')[0];
  if(pathname==='/api/v1/health/live'||pathname==='/api/v1/health/ready'){
   if(req.method!=='GET')return sendJson(res,405,{code:'METHOD_NOT_ALLOWED'});
   if(pathname.endsWith('/live'))return sendJson(res,200,{ok:true});
   try{const ready=await checkReady(readinessProbe,readinessTimeoutMs);return sendJson(res,ready===true?200:503,ready===true?{ok:true}:{ok:false,code:'DEPENDENCY_NOT_READY'})}catch{return sendJson(res,503,{ok:false,code:'DEPENDENCY_NOT_READY'})}
  }
  if(authHandler&&await authHandler(req,res)===true)return;
  if(catalogHandler&&await catalogHandler(req,res)===true)return;
  return sendJson(res,404,{code:'NOT_IMPLEMENTED'});
 }
}
export function createFoundationServer(options={}){return createServer(createFoundationHandler(options))}
