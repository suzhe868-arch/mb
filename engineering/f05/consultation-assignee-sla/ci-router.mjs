import {productionDeny} from './service.mjs';
export function denyConsultationIssuerRouter(){
 return (req,res)=>{
  res.setHeader('content-type','application/json; charset=utf-8');
  res.setHeader('cache-control','no-store');res.setHeader('x-content-type-options','nosniff');
  if(!(req.url||'').startsWith('/__ci__/f05-10/v1/')){res.statusCode=404;res.end(JSON.stringify({code:'NOT_FOUND'}));return}
  if(req.method!=='POST'){res.statusCode=405;res.end(JSON.stringify({code:'METHOD_NOT_ALLOWED'}));return}
  res.statusCode=403;res.end(JSON.stringify({code:productionDeny().code}));
 };
}
