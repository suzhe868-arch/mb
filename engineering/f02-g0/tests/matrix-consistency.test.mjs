import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateMatrix} from '../matrix-validation.mjs';
const original=await readFile(new URL('../field-matrix.tsv',import.meta.url),'utf8');
function changeRow(match,fn){
  const rows=original.trimEnd().split('\n').map(l=>l.split('\t'));
  const row=rows.find(x=>x[1]===match[0]&&x[2]===match[1]);
  assert.ok(row,'fixture row must exist');
  fn(row);
  return rows.map(x=>x.join('\t')).join('\n')+'\n';
}
test('当前矩阵在禁止客户合并前提下通过逐字段静态校验',()=>{
  const result=validateMatrix(original);
  assert.equal(result.fieldCount,436);
  assert.ok(result.entityCount>=60);
});
test('V1 完全取消 Customer Merge，旧合并历史实体不得回到矩阵',()=>{
  const bad=changeRow(['customer_wechat_identities','wechat_identity_id'],r=>r[1]='customer_merge_history');
  assert.throws(()=>validateMatrix(bad),/F02_G0_BANNED_CUSTOMER_MERGE/);
});
test('surviving customer 身份迁移字段为禁恢复项',()=>{
  const bad=changeRow(['customer_wechat_identities','wechat_identity_key'],r=>r[2]='surviving_customer_id');
  assert.throws(()=>validateMatrix(bad),/F02_G0_BANNED_CUSTOMER_MERGE/);
});
test('手机号不能形成跨 Customer 全局唯一身份',()=>{
  const bad=changeRow(['customer_phone_facts','phone_ciphertext'],r=>r[5]='UQ_PHONE_GLOBAL');
  assert.throws(()=>validateMatrix(bad),/F02_G0_PHONE_GLOBAL_UNIQUE_FORBIDDEN/);
});
test('Demand completed/cancelled 必须是终态，不允许旧 ended 替代',()=>{
  const bad=changeRow(['demands','demand_state'],r=>r[5]='CHECK_active_paused_ended');
  assert.throws(()=>validateMatrix(bad),/F02_G0_WRONG_DEMAND_STATUSES/);
});
test('PDM-10 不得漏掉 listing_cycle 查价身份',()=>{
  const bad=changeRow(['customer_price_cycle_unlocks','listing_cycle_id'],r=>r[2]='legacy_cycle');
  assert.throws(()=>validateMatrix(bad),/F02_G0_MISSING_RULE_FIELD/);
});
test('PDM-18 LockRequest 正式结果态必须完整',()=>{
  const bad=changeRow(['lock_requests','status'],r=>r[5]='CHECK_PENDING_APPROVED_REJECTED_EXPIRED');
  assert.throws(()=>validateMatrix(bad),/F02_G0_WRONG_LOCKREQUEST_STATUSES/);
});
test('PDM-19 不能回退 Refund 两态',()=>{
  const bad=changeRow(['refund_cases','status'],r=>r[5]='CHECK_pending_refunded');
  assert.throws(()=>validateMatrix(bad),/F02_G0_WRONG_REFUND_STATUSES/);
});
test('PDM-15 结束原因需要保留且不创造第五主状态',()=>{
  const bad=changeRow(['consultations','close_reason'],r=>r[7]='未定义');
  assert.throws(()=>validateMatrix(bad),/F02_G0_MISSING_CONSULTATION_CLOSE_REASON/);
});
test('矩阵不允许不存在的外键目标或伪报已实施',()=>{
  const bad=changeRow(['customer_owner_history','customer_id'],r=>r[5]='FK:missing_table.unknown_id');
  assert.throws(()=>validateMatrix(bad),/F02_G0_DANGLING_FK/);
  const bad2=changeRow(['vehicles','vehicle_id'],r=>r[9]='IMPLEMENTED');
  assert.throws(()=>validateMatrix(bad2),/F02_G0_FALSE_IMPLEMENTATION_CLAIM/);
});
