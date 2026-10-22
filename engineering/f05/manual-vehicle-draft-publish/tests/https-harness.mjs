import https from 'node:https';
import {readFile} from 'node:fs/promises';
import {createServer} from 'node:https';
import {createManualVehicleDraftHandler} from '../http.mjs';
export const ORIGIN='https://127.0.0.1:48984';
export const BASE='/__ci__/f05-manual-vehicle/v1/drafts';
export async function startHarness(service){
 const keyPath=process.env.F05_MANUAL_TLS_KEY_PATH,certPath=process.env.F05_MANUAL_TLS_CERT_PATH;
 if(!keyPath||!certPath)throw Error('F05_MANUAL_TLS_MATERIAL_REQUIRED');
 const [key,cert]=await Promise.all([readFile(keyPath),readFile(certPath)]);
 const server=createServer({key,cert},createManualVehicleDraftHandler(service));
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(48984,'127.0.0.1',resolve)});
 return {
  async close(){await new Promise((resolve,reject)=>server.close(e=>e?reject(e):resolve()))},
  request(path,{method='GET',token,body,headers={}}={}){
   return new Promise((resolve,reject)=>{
    const data=body===undefined?null:Buffer.from(JSON.stringify(body));
    const h={origin:ORIGIN,accept:'application/json',...headers};
    if(token)h.cookie='__Host-mb_pc='+token;
    if(data){h['content-type']='application/json; charset=utf-8';h['content-length']=String(data.length)}
    const req=https.request(new URL(path,ORIGIN),{method,headers:h,rejectUnauthorized:false},res=>{
     const chunks=[];res.on('data',x=>chunks.push(x));res.on('end',()=>{
      const raw=Buffer.concat(chunks).toString('utf8');
      let parsed;try{parsed=JSON.parse(raw)}catch{parsed={raw}};
      resolve({status:res.statusCode,body:parsed,headers:res.headers});
     });
    });
    req.on('error',reject);
    if(data)req.write(data);
    req.end();
   });
  }
 };
}
export async function login(auth,login,password,source){
 const out=await auth.login({login,password,source});
 if(out.code!=='AUTH_OK')throw Error('F05_MANUAL_TEST_LOGIN_FAILED_'+login+'_'+out.code);
 return out.token;
}
