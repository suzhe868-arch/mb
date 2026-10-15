import {createServer} from 'node:https';
import {readFileSync} from 'node:fs';
import {employeePhone,collectorCallback} from './contract.mjs';
const bad=(res,status,code)=>{res.writeHead(status,{'content-type':'application/json','cache-control':'no-store'});res.end(JSON.stringify({error:code}));};
const good=(res,obj)=>{res.writeHead(200,{'content-type':'application/json','cache-control':'no-store'});res.end(JSON.stringify(obj));};
export function startServer({key,cert,port=0}={}){
 const server=createServer({key:key??readFileSync(process.env.F07_TLS_KEY),
 cert:cert??readFileSync(process.env.F07_TLS_CERT)},async(req,res)=>{
  if(req.method==='GET'&&req.url?.startsWith('/public/vehicle/'))return good(res,{vehicle_id:req.url.split('/').pop(),telephone:null});
  if(req.method!=='POST'||!['/employee/phone','/integration/collector/publisher-phone'].includes(req.url))return bad(res,404,'NOT_FOUND');
  let body='';try{
   for await(const chunk of req){body+=chunk;if(body.length>8192)throw Error('TOO_LARGE');}
   if(req.url==='/employee/phone'){
    const data=JSON.parse(body);
    if(!data||Object.keys(data).sort().join('|')!=='action|session|vehicle')return bad(res,400,'INVALID_INPUT');
    return good(res,await employeePhone(data));
   }
   return good(res,await collectorCallback(body,req.headers['x-f07-timestamp'],req.headers['x-f07-signature']));
  }catch(e){const err=String(e?.code||'REJECTED');
    return bad(res,err==='IDEMPOTENCY_CONFLICT'?409:err==='CURRENT_PERMISSION_DENIED'?403:400,err);
  }
 });
 return new Promise(resolve=>server.listen(port,'127.0.0.1',()=>resolve({server,port:server.address().port})));
}
