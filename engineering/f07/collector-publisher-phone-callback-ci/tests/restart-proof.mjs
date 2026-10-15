// F07-1 真 PostgreSQL16 容器重启前后数据可持久性/防重放合同，仅GitHub Runner侧车
import assert from 'node:assert/strict';
import {writeFile,readFile} from 'node:fs/promises';
import {pool,reset,seed,employeePhone,collectorCallback,callbackBody,sign} from '../contract.mjs';
const proofPath='/tmp/f07-1-restart-proof.json';
const phone=()=>employeePhone({session:'s-sale',vehicle:'v1',action:'read'});
const status=async()=> {
 const s=(await pool.query('SELECT pg_postmaster_start_time() started,pg_backend_pid() backend')).rows[0];
 const hash=(await pool.query(`SELECT md5(coalesce(string_agg(source_platform||':'||publisher_id||':'||phone||':'||request_id,'|' ORDER BY source_platform,publisher_id),'')) hash FROM f07_phone.cache`)).rows[0].hash;
 const n=async table=>Number((await pool.query('SELECT count(*) n FROM f07_phone.'+table)).rows[0].n);
 return {started:new Date(s.started).toISOString(),backend:s.backend,hash,history:await n('phone_history'),receipts:await n('receipts'),audit:await n('audit')};
};
try{
 if(process.argv[2]==='prepare'){
  await reset();await seed();
  const job=await phone();
  const raw=callbackBody(job.request_id),ts=String(Date.now());
  assert.equal((await collectorCallback(raw,ts,sign(raw,ts))).status,'UPDATED');
  const before=await status();
  await writeFile(proofPath,JSON.stringify({before,raw,ts}));
  console.log('F07_PRE_RESTART_REAL_PG16_PERSISTENCE_SEALED',before.started,before.backend,before.history,before.audit);
 }else if(process.argv[2]==='verify'){
  const {before,raw,ts}=JSON.parse(await readFile(proofPath,'utf8'));
  const fresh=await status();
  assert.notEqual(fresh.started,before.started,'PostgreSQL主进程必须真实重启');
  assert.equal(fresh.hash,before.hash);
  assert.equal(fresh.history,before.history);
  assert.equal(fresh.receipts,before.receipts);
  assert.equal(fresh.audit,before.audit);
  assert.equal((await collectorCallback(raw,ts,sign(raw,ts))).status,'DUPLICATE');
  const replay=await status();
  assert.equal(replay.hash,before.hash);
  assert.equal(replay.history,before.history);
  assert.equal(replay.receipts,before.receipts);
  assert.equal(replay.audit,before.audit);
  const job=await employeePhone({session:'s-sale',vehicle:'v1',action:'latest'});
  const stale=callbackBody(job.request_id,{issued_at:new Date(Date.now()-86400000).toISOString(),phone:'TEST-777777'});
  const t=String(Date.now());
  assert.equal((await collectorCallback(stale,t,sign(stale,t))).status,'STALE');
  const after=await status();
  assert.equal(after.hash,before.hash);
  assert.equal(after.history,before.history);
  console.log('F07_RESTART_REAL_PG16_PERSISTENCE_REPLAY_STALE_PASS',before.started,'to',after.started,before.backend,'to',after.backend);
 }else throw new Error('prepare|verify required');
}finally{await pool.end();}
