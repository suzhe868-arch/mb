import {productionIssuerDeny} from './service.mjs';
export function ciFailClosedRouter(){
 return (req,res)=>{
  res.setHeader('content-type','application/json; charset=utf-8');
  res.setHeader('cache-control','no-store');
  if(!req.url?.startsWith('/__ci__/f06-5c/')){res.writeHead(404);res.end(JSON.stringify({code:'NOT_FOUND'}));return}
  if(req.method!=='POST'){res.writeHead(405);res.end(JSON.stringify({code:'METHOD_DENIED'}));return}
  res.writeHead(403);res.end(JSON.stringify({code:productionIssuerDeny().code}));
 };
}
