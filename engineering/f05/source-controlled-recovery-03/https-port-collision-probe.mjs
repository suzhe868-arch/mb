import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { mkdir, writeFile } from 'node:fs/promises';

const host = '127.0.0.1';
const oldPort = 48988;
const sentinel = createServer();
const negative = createServer();
const evidencePath = 'engineering/f05/source-controlled-recovery-03/artifacts/https-port-collision-proof.json';
const evidence = { kind:'F05_7_HTTPS_PORT_ISOLATION_PROOF', oldFixedPort:oldPort, bindAddress:host, 
 originalFixedPortWouldFail:false, nativeOriginalSevenRejectionsPass:false, bypassedSecurityAssertions:false,
 sourceJobNotExecuted:true, realPG16Required:true };
let child;
try {
 await new Promise((resolve,reject)=>{ sentinel.once('error',reject);sentinel.listen(oldPort,host,resolve) });
 try {
  await new Promise((resolve,reject)=>{negative.once('error',reject);negative.listen(oldPort,host,resolve)});
  throw Error('F05_7_EXPECTED_FIXED_PORT_COLLISION_NOT_OBSERVED');
 } catch(error) {
  assert.equal(error?.code,'EADDRINUSE','Old fixed port must be unavailable while sentinel owns it');
  evidence.originalFixedPortWouldFail=true;
 }
 console.log('F05_7_LEGACY_FIXED_PORT_EADDRINUSE_REPRODUCED');
 child=spawn('bash',['engineering/f05/deterministic-matching-readiness-four-tier/ci-job.sh','https'],{stdio:'inherit',env:process.env});
 const status = await new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',(code,signal)=>resolve({code,signal}));});
 assert.equal(status.signal,null,'HTTPS native test was interrupted');
 assert.equal(status.code,0,'F05-7 original real-PG16 HTTPS CI shell must fully pass despite occupied fixed port');
 evidence.nativeOriginalSevenRejectionsPass=true;
 evidence.result='F05_7_PORT_COLLISION_CLOSED_NATIVE_HTTPS_PASS';
 console.log(evidence.result);
} catch(error) {
 evidence.result='BLOCKED_NATIVE_HTTPS_FAILED';
 evidence.errorCode=String(error?.code||error?.message||'UNKNOWN').slice(0,150);
 console.error(error);process.exitCode=1;
} finally {
 if (child && child.exitCode===null) child.kill('SIGTERM');
 await new Promise(resolve=>negative.close(()=>resolve())).catch(()=>{});
 await new Promise(resolve=>sentinel.close(()=>resolve())).catch(()=>{});
 await mkdir('engineering/f05/source-controlled-recovery-03/artifacts',{recursive:true});
 await writeFile(evidencePath,JSON.stringify(evidence,null,2)+'\n');
}
