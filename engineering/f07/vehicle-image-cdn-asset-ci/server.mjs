// Loopback-only ephemeral TLS and synthetic session gateway. No external network.
import https from 'node:https';
import {readFile} from 'node:fs/promises';
import {MockCDN,MockStorage,imageBytes,getReadable,reportH5,publicUrl,shareCard,denied} from './contract.mjs';
export async function createServer(){
 const key=await readFile(process.env.F07_TLS_KEY),cert=await readFile(process.env.F07_TLS_CERT);
 const storage=new MockStorage(),cdn=new MockCDN();
 const srv=https.createServer({key,cert},async(req,res)=>{
  const send=(code,body,headers={})=>{res.writeHead(code,{'cache-control':'private, no-store','x-content-type-options':'nosniff',...headers});res.end(body);};
  try{
   if(req.method!=='GET'||!req.url||req.url.length>800||!req.headers.host?.startsWith('127.0.0.1:'))throw denied('NOT_FOUND');
   if(/%|\\|[?#]/.test(req.url))throw denied('UNSAFE_PATH');
   const parts=req.url.split('/');const token=req.headers['x-test-session'];
   if(typeof token!=='string')throw denied('CURRENT_VEHICLE_READ_DENY');
   if(parts.length===4&&parts[1]==='media'){
    const [kind,id]=parts.slice(2);
    const allowed=['vehicle_photo','accident_report','maintenance_image'];
    if(!allowed.includes(kind))throw denied('CURRENT_REPORT_DENY');
    const r=await imageBytes(token,id,storage,cdn,kind);
    return send(200,r.bytes,{'content-type':'image/jpeg','x-controlled-url':r.url,'x-storage-state':r.origin});
   }
   if(parts.length===3&&parts[1]==='h5'){
    const p=await getReadable(token,parts[2],'maintenance_h5');
    return send(200,JSON.stringify({url:reportH5(p.report_source_url)}),{'content-type':'application/json'});
   }
   if(parts.length===3&&parts[1]==='share'){
    const id=parts[2];const p=await getReadable(token,id,'vehicle_photo');
    return send(200,JSON.stringify(shareCard('TEST_MODEL',publicUrl(p.relative_path))),{'content-type':'application/json'});
   }
   return send(404,'NOT_FOUND');
  }catch(e){
   const code=['UNSAFE_PATH','UNSAFE_REPORT'].includes(e.code)?400:e.code==='NOT_FOUND'?404:403;
   return send(code,code===400?'BAD_REQUEST':'DENIED');
  }
 });
 await new Promise((ok,fail)=>srv.once('error',fail).listen(0,'127.0.0.1',ok));
 return {server:srv,port:srv.address().port,storage,cdn,close:()=>new Promise(ok=>srv.close(ok))};
}
