import https from 'node:https';
import {readFile} from 'node:fs/promises';
import {createServer} from 'node:https';
import {createPublishedEditHandler} from '../http.mjs';
export const BASE='/__ci__/f05-published-edit/v1/vehicles';
const ORIGIN='https://127.0.0.1:48986';
export async function start(service){
 const [key,cert]=await Promise.all([readFile(process.env.F05_EDIT_TLS_KEY),readFile(process.env.F05_EDIT_TLS_CERT)]);
 const srv=createServer({key,cert},createPublishedEditHandler(service));
 await new Promise((resolve,reject)=>{srv.once('error',reject);srv.listen(48986,'127.0.0.1',resolve)});
 return {close:()=>new Promise((resolve,reject)=>srv.close(e=>e?reject(e):resolve())),
 request:(path,{token,method='GET',body,headers={}}={})=>new Promise((resolve,reject)=>{
  const json=body===undefined?null:Buffer.from(JSON.stringify(body));
  const h={origin:ORIGIN,accept:'application/json',...headers};
  if(token)h.cookie='__Host-mb_pc='+token;
  if(json){h['content-type']='application/json; charset=utf-8';h['content-length']=String(json.length)}
  const req=https.request(new URL(path,ORIGIN),{method,headers:h,rejectUnauthorized:false},res=>{
   const parts=[];res.on('data',p=>parts.push(p));res.on('end',()=>{
    const raw=Buffer.concat(parts).toString('utf8');let parsed;try{parsed=JSON.parse(raw)}catch{parsed={raw}};resolve({status:res.statusCode,body:parsed,headers:res.headers});
   });
  });req.on('error',reject);if(json)req.write(json);req.end();
 })};
}
export async function login(auth,user,password){
 const r=await auth.login({login:user,password,source:'f05-issue216-disposable-https'});
 if(r.code!=='AUTH_OK')throw Error('F05_EDIT_LOGIN_FAILED_'+user+'_'+r.code);
 return r.token;
}
