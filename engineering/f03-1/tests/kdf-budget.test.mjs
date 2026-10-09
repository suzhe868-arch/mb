import {test} from 'node:test';
import assert from 'node:assert/strict';
import {runKdfBounded} from '../../src/f03-auth-crypto.mjs';
function defer(){let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve}}
const tick=()=>new Promise(r=>setImmediate(r));
async function until(condition){for(let i=0;i<500;i++){if(condition())return;await tick()}throw Error('KDF_TEST_NO_PROGRESS')}
test('wake vs newcomer race reserves slot and retains FIFO, max two active',async()=>{
 let active=0,peak=0;const started=[],gates=Array.from({length:5},defer);
 const job=i=>runKdfBounded(async()=>{active++;peak=Math.max(peak,active);started.push(i);try{await gates[i].promise}finally{active--}});
 const tasks=[job(0),job(1),job(2),job(3)];
 await until(()=>started.length===2);
 gates[0].resolve();tasks.push(job(4));
 await until(()=>started.length===3);assert.equal(started[2],2);
 gates[2].resolve();await until(()=>started.length===4);assert.equal(started[3],3);
 gates[1].resolve();await until(()=>started.length===5);assert.equal(started[4],4);
 gates[3].resolve();gates[4].resolve();await Promise.all(tasks);
 assert.equal(peak,2);assert.equal(active,0);
 console.log('KDF SLOT HANDOFF RACE/FIFO/PEAK 2 PASS');
});
test('2 active + 8 waiting saturate; excess refused and queue recovers',async()=>{
 let active=0,peak=0;const gate=defer();
 const job=()=>runKdfBounded(async()=>{active++;peak=Math.max(peak,active);try{await gate.promise}finally{active--}});
 const tasks=Array.from({length:10},job);
 await tick();await assert.rejects(()=>job(),/AUTH_CAPACITY/);
 gate.resolve();await Promise.all(tasks);
 assert.equal(peak,2);assert.equal(active,0);
 assert.equal(await runKdfBounded(async()=> 'ok'),'ok');
 console.log('KDF 8 QUEUED/SATURATION/RECOVERY PASS');
});
test('2s timed out waiter removed without later ghost execution; recovered slot usable',async()=>{
 const gate=defer();let entered=0,unexpected=false;
 const job=()=>runKdfBounded(async()=>{entered++;await gate.promise});
 const first=job(),second=job();
 await assert.rejects(()=>runKdfBounded(async()=>{unexpected=true}),/AUTH_CAPACITY/);
 assert.equal(unexpected,false);
 gate.resolve();await Promise.all([first,second]);
 assert.equal(entered,2);
 assert.equal(await runKdfBounded(async()=>42),42);
 console.log('KDF 2S TIMEOUT/NO GHOST WAKE/RECOVERY PASS');
});
