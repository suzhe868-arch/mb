// One-off synthetic scrypt availability and cost probe, NOT login.
import {scrypt,randomBytes} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {promisify} from 'node:util';
import assert from 'node:assert/strict';
const derive=promisify(scrypt);
const parameters=Object.freeze({N:32768,r:8,p:3,maxmem:64*1024*1024});
assert.equal(process.versions.node.split('.').map(Number)[0]>=22,true,'Requires Node 22');
assert.deepEqual([parameters.N,parameters.r,parameters.p],[32768,8,3],'OWASP scrypt 2^15 / 8 / 3 minimum equivalent profile');
const results=[];
for(let i=0;i<2;i++){
 const salt=randomBytes(16);
 const start=performance.now();
 const derived=await derive('synthetic-in-memory-sample-only-'+i,salt,32,parameters);
 const milliseconds=Math.round(performance.now()-start);
 assert.equal(derived.length,32);
 assert.ok(milliseconds>=0);
 results.push(milliseconds);
 // Never log/store salt, password, hash, derived byte content, or token.
 derived.fill(0);salt.fill(0);
}
console.log('F03-1-G0 SCRYPT AVAILABILITY PASS '+JSON.stringify({nodeMajor:process.versions.node.split('.')[0],N:parameters.N,r:parameters.r,p:parameters.p,maxmemMiB:64,keyLength:32,saltBytes:16,iterations:results.length,durationsMs:results}));
