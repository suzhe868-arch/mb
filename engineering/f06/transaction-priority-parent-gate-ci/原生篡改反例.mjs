// PG1：仅对可销毁非特权真PG16作物理篡改反例，事务回滚后恢复完整父封印。
import assert from 'node:assert/strict';
import {verify,gate} from './catalog-delta-verifier.mjs';
const probes=[
 ['新公用触发器', "CREATE TRIGGER pg1_unexpected_extra BEFORE INSERT ON public.f05_8_priority_ci FOR EACH ROW EXECUTE FUNCTION f06_5c_pg1_ci.guard_priority_insert()", 'F06_PG1_V2_FROZEN_CATALOG_PROJECTION_MISMATCH'],
 ['删除已签公共触发器', "DROP TRIGGER pg1_signed_priority_insert ON public.f05_8_priority_ci", 'F06_PG1_V2_FROZEN_CATALOG_PROJECTION_MISMATCH'],
 ['禁用原子取消触发器', "ALTER TABLE public.transactions DISABLE TRIGGER pg1_deferred_signed_cancel", 'F06_PG1_V2_PATCH_OBJECT_SIGNATURE_DRIFT'],
 ['不可变证书UPDATE', "UPDATE f06_5c_pg1_ci.attestation SET name=name WHERE name='F06_5C_PG1'", 'PG1_IMMUTABLE_ATTESTATION'],
 ['重复安装已签Schema', "CREATE SCHEMA f06_5c_pg1_ci", 'already exists']
];
export async function runNativeTamperMatrix(c){
 gate();
 assert.equal((await verify(c)).verified,true,'PG1_NATIVE_INITIAL_VERIFIED');
 const result=[];
 for(const [name,sql,expected] of probes){
  await c.query('BEGIN');
  let error=null,attemptedPass=false;
  try {
   await c.query('SAVEPOINT pg1_tamper');
   await c.query(sql);
   await verify(c);
   attemptedPass=true;
  }catch(e){error={code:e.code||null,message:e.message||''}}
  finally{
   await c.query('ROLLBACK');
  }
  if(attemptedPass||!error||!error.message.includes(expected))
   throw Error('F06_PG1_V2_TAMPER_FAIL_OPEN_'+name+' '+JSON.stringify({error,attemptedPass}));
  assert.equal((await verify(c)).verified,true,'PG1_NATIVE_ROLLBACK_SEAL_FAILED_'+name);
  result.push({name,denied:true,errorCode:error.code,message:error.message});
 }
 return result;
}
