// Issue159: independent strict check of raw native TAP summaries.
// Unlike the inherited tap() helper, this rejects zero-count and malformed logs.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const log=readFileSync(new URL('./evidence/完整原生CI日志.log',import.meta.url),'utf8');
const present=(s,why)=>assert.ok(log.includes(s),why||s);
const sameHead=process.env.GITHUB_SHA;
assert.match(sameHead||'',/^[a-f0-9]{40}$/);
present('F06_BRIDGE_STATIC_SYNTAX_PASS');
present('F06_POST_CANCEL_INHERITED_585_NATIVE_SAME_SHA_PASS');
present('F06_BRIDGE_NATIVE_PENDING');
present('F06_BRIDGE_DIFFERENT_PG_BACKENDS');
present('F06_POST_CANCEL_DIFFERENT_OID_161_FULL_SIGNED_PARENT_RESTORED_PASS');
present('F06_BRIDGE_PARENT_INHERITED_585 + PR156_84 + NEW_BRIDGE_46 + TLS11+12');
present('READY_FOR_A_REVIEW branch=feat/f06-signed-post-handoff-refund-bridge-01 head='+sameHead);
const previous=log.lastIndexOf('POST_HANDOFF_CANCEL_HTTP_PG16_TAP.log tests=130 pass=130 fail=0');
assert.ok(previous>=0,'Issue159 PG16 complete proof missing');
const tail=log.slice(previous);
function summaries(t){
 const lines=t.split(/\r?\n/);
 const result=[];
 for(let i=0;i<lines.length;i++){
  const n=/^# tests (\d+)$/.exec(lines[i]);
  if(!n)continue;
  const rec={tests:Number(n[1])};
  for(let j=i+1;j<Math.min(lines.length,i+13);j++){
   const m=/^# (pass|fail|skipped|cancelled|todo) (\d+)$/.exec(lines[j]);
   if(m)rec[m[1]]=Number(m[2]);
  }
  result.push(rec);
 }
 return result;
}
const tls=summaries(tail).slice(0,2);
assert.equal(tls.length,2,'Both real native TLS TAP summaries required');
for(const [i,n] of [11,12].entries()){
 const t=tls[i];
 assert.equal(t.tests,n,'TLS count mismatch '+i);
 assert.equal(t.pass,n,'TLS PASS mismatch '+i);
 for(const k of ['fail','skipped','cancelled'])assert.equal(t[k],0,'TLS '+k+' mismatch '+i);
}
const nativeLine=log.match(/F06_POST_CANCEL_DIFFERENT_OID_161_FULL_SIGNED_PARENT_RESTORED_PASS ([^\n]+)/)?.[1];
assert.ok(nativeLine,'Physical OID seal proof missing');
const seal=JSON.parse(nativeLine);
assert.equal(seal.inherited.table_count,161);
assert.equal(seal.final.table_count,161);
assert.equal(seal.inherited.ledger_count,24);
assert.equal(seal.final.ledger_count,24);
assert.equal(seal.inherited.seal,seal.final.seal);
assert.notEqual(seal.inherited.source_oid,seal.final.source_oid);
for(const marker of [
 'TX_REFUND_HTTP_PG16_TAP.log tests=79 pass=79 fail=0',
 'HANDOFF_HTTP_PG16_TAP.log tests=40 pass=40 fail=0',
 'POST_HANDOFF_CANCEL_HTTP_PG16_TAP.log tests=130 pass=130 fail=0',
 'BRIDGE_HTTPS_TLS_DENY_TAP.log tests=12 pass=12 fail=0'
])present(marker);
assert.ok(!/^not ok \d+/m.test(log),'A native TAP failure exists');
console.log('F06_BRIDGE_STRICT_ACTUAL_TAP_PASS',JSON.stringify({
 sha:sameHead,combinedNativePg:130,oldPostCancel:84,newRefundBridge:46,
 inheritedTxRefund:79,inheritedHandoff:40,oldTls:tls[0],newTls:tls[1],
 parentTables:161,migrations:24,physicalOidChanged:true,
 inheritedTapZeroCountIgnored:false
}));
