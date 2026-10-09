import {scrypt,randomBytes,timingSafeEqual,createHmac} from 'node:crypto';
import {promisify} from 'node:util';
const kdf=promisify(scrypt);
export const params=Object.freeze({N:32768,r:8,p:3,maxmem:64*1024*1024});
let running=0;const waiting=[];
// Ownership of a freed slot transfers directly to the oldest waiting task.
export async function runKdfBounded(task){
 if(running<2&&waiting.length===0)running++;
 else{
  if(waiting.length>=8)throw Error('AUTH_CAPACITY');
  await new Promise((resolve,reject)=>{
   const item={resolve:null};
   const timer=setTimeout(()=>{const idx=waiting.indexOf(item);if(idx>=0)waiting.splice(idx,1);reject(Error('AUTH_CAPACITY'))},2000);
   item.resolve=()=>{clearTimeout(timer);resolve()};
   waiting.push(item);
  });
  // A woken waiter owns the still-occupied slot; do not increment running.
 }
 try{return await task()}finally{
  const next=waiting.shift();
  if(next)next.resolve();else running--;
 }
}
export function validatePassword(p){
 if(typeof p!=='string'||/[\uFFFD\p{Cs}]/u.test(p))throw Error('AUTH_INPUT');
 const n=[...p].length;if(n<12||n>128||Buffer.byteLength(p,'utf8')>512)throw Error('AUTH_INPUT');
 return p;
}
export function normalizeLogin(s){
 if(typeof s!=='string')throw Error('AUTH_INPUT');
 const v=s.trim().normalize('NFC').toLowerCase();
 if(!v||[...v].length>128||Buffer.byteLength(v,'utf8')>512||/[\p{Cc}\p{Cf}]/u.test(v))throw Error('AUTH_INPUT');
 return v;
}
async function derive(password,salt){return runKdfBounded(()=>kdf(password,salt,32,params))}
export async function hashPassword(password){
 validatePassword(password);
 const salt=randomBytes(16);
 try{
  const out=await derive(password,salt);
  try{return ['scrypt','v1','32768','8','3',salt.toString('base64url'),out.toString('base64url')].join('$')}
  finally{out.fill(0)}
 }finally{salt.fill(0)}
}
const PATTERN=/^scrypt\$v1\$32768\$8\$3\$([A-Za-z0-9_-]{22})\$([A-Za-z0-9_-]{43})$/;
export async function verifyPassword(password,encoded){
 if(typeof password!=='string'||typeof encoded!=='string')return false;
 const match=PATTERN.exec(encoded);if(!match)return false;
 const salt=Buffer.from(match[1],'base64url'),stored=Buffer.from(match[2],'base64url');
 if(salt.length!==16||stored.length!==32||salt.toString('base64url')!==match[1]||stored.toString('base64url')!==match[2])return false;
 try{
  const out=await derive(password,salt);
  try{return timingSafeEqual(out,stored)}finally{out.fill(0)}
 }finally{salt.fill(0);stored.fill(0)}
}
let dummy=null;
export async function dummyCheck(password){
 if(dummy===null)dummy=await hashPassword('SyntheticDummyUnusable!2026');
 try{await verifyPassword(typeof password==='string'?password:'InvalidSyntheticPassword',dummy)}catch(e){if(e.message==='AUTH_CAPACITY')throw e}
}
export function sessionDigest(token,secret){
 if(!Buffer.isBuffer(secret)||secret.length<32)throw Error('AUTH_SECRET_REQUIRED');
 return createHmac('sha256',secret).update(token).digest();
}
export function newOpaqueToken(){return randomBytes(32).toString('base64url')}
export function csrfValue(token,secret){return createHmac('sha256',secret).update('csrf:'+token).digest('base64url')}
export function constantMatch(a,b){const x=Buffer.from(a||''),y=Buffer.from(b||'');return x.length===y.length&&timingSafeEqual(x,y)}
