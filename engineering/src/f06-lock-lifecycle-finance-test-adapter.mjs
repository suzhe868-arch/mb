import {createHash} from 'node:crypto';
import {assertF06TestEnvironment,verifyF06TestDatabase} from './f06-lock-readiness.mjs';
const sha=v=>createHash('sha256').update(v).digest('hex');
const validId=v=>typeof v==='string'&&/^[1-9][0-9]{0,18}$/.test(v)&&BigInt(v)<=9223372036854775807n;
export function createDisposableF06FinanceProofAdapter({pool,env=process.env}={}){
 assertF06TestEnvironment(env);
 if(env.F06_LOCK_LIFECYCLE_TEST_CONSENT!=='I_AUTHORIZE_DISPOSABLE_F06_LOCK_LIFECYCLE_ONLY')throw Error('F06_LOCK_LIFECYCLE_TEST_CONSENT_REQUIRED');
 if(!pool||typeof pool.connect!=='function'||typeof pool.query!=='function')throw Error('F06_LOCK_LIFECYCLE_PG16_POOL_REQUIRED');
 return Object.freeze({async issue({lockId,kind}={}){
  if(!validId(lockId)||!['absent','present','unknown'].includes(kind))throw Error('INVALID_SYNTHETIC_FINANCE_PROOF');
  const db=await pool.connect();let begun=false;
  try{
   await db.query('BEGIN');begun=true;await verifyF06TestDatabase(db);
   const ident=(await db.query(`SELECT current_database() db,current_user role,(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) superuser,
    (SELECT rolcreatedb FROM pg_roles WHERE rolname=current_user) createdb,
    to_regclass('f06_real_lock_test.lock_lifecycle_finance_proofs') IS NOT NULL proof_table`)).rows[0];
   if(!ident||ident.db!=='f06_lock_test'||ident.role!=='f06_lock_ci'||ident.superuser!==false||ident.createdb!==false||!ident.proof_table)throw Error('F06_LOCK_LIFECYCLE_DISPOSABLE_FINANCE_DATABASE_REQUIRED');
   if(!(await db.query('SELECT lock_id FROM public.locks WHERE lock_id=$1 FOR SHARE',[lockId])).rows[0])throw Error('F06_LOCK_NOT_FOUND');
   const tables=(await db.query(`SELECT to_regclass('public.deposit_receipts') IS NOT NULL receipts,to_regclass('public.transactions') IS NOT NULL transactions,to_regclass('public.refund_cases') IS NOT NULL refunds`)).rows[0];
   if(!tables?.receipts||!tables?.transactions||!tables?.refunds)throw Error('F06_LOCK_FINANCIAL_SOURCE_UNKNOWN');
   const refund=(await db.query('SELECT refund_id FROM public.refund_cases WHERE lock_id=$1 LIMIT 1 FOR SHARE',[lockId])).rows[0];
   const receipt=(await db.query('SELECT deposit_id FROM public.deposit_receipts WHERE lock_id=$1 LIMIT 1 FOR SHARE',[lockId])).rows[0];
   const transaction=(await db.query('SELECT transaction_id FROM public.transactions WHERE source_lock_id=$1 LIMIT 1 FOR SHARE',[lockId])).rows[0];
   if(kind==='absent'&&(refund||receipt||transaction))throw Error('F06_LOCK_FINANCE_ABSENCE_NOT_PROVABLE');
   const proofKind=kind==='absent'?'synthetic_absence_confirmed':kind==='present'?'present':'unknown';
   const evidence=sha(JSON.stringify({issuer:'DISPOSABLE_TEST_ONLY',lockId,kind,observedReceipt:!!receipt,observedTransaction:!!transaction,observedRefund:!!refund,source:'isolated-pg16-fixture'}));
   await db.query(`INSERT INTO f06_real_lock_test.lock_lifecycle_finance_proofs(lock_id,proof_kind,issuer,synthetic_only,evidence_sha256)
    VALUES($1,$2,'DISPOSABLE_TEST_ONLY',true,$3)`,[lockId,proofKind,evidence]);
   await db.query('COMMIT');begun=false;return Object.freeze({lockId,proofKind,evidenceSha256:evidence,productionReady:false});
  }catch(e){if(begun)await db.query('ROLLBACK').catch(()=>{});throw e}finally{db.release()}
 }});
}
