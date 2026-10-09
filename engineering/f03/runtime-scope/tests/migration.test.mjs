import {test} from 'node:test';
import assert from 'node:assert/strict';
import {connect,verifyOld,apply,verify,rollback,SQL,OLD_SHA} from '../migration.mjs';
import {getPublicStructure} from '../../../f02-1/schema-integrity.mjs';
const c=await connect();
test.after(async()=>c.end());
test('M01 original exact 80-table F02/F03-1 seal baseline',async()=>{
 const old=await verifyOld(c);assert.equal(old.schemaSha,OLD_SHA);
});
test('M02 approved SG01 post-DDL forced fault leaves all 80-table objects and versions unchanged',async()=>{
 await assert.rejects(()=>apply(c,{inject:true}),/INJECTED_POST_DDL_ROLLBACK/);
 const original=await verifyOld(c);assert.equal(original.schemaSha,OLD_SHA);
 const n=(await c.query("SELECT count(*)::integer n FROM public.f03_schema_migrations")).rows[0].n;
 assert.equal(n,1);
});
test('M03 four concurrent CI-only PG16 workers serialize and apply new migration once; retry no-op',async()=>{
 const clients=await Promise.all(Array.from({length:4},()=>connect()));
 try{
  const runs=await Promise.all(clients.map(c=>apply(c)));
  assert.equal(runs.filter(x=>x.applied).length,1);
  assert.equal(runs.filter(x=>!x.applied).length,3);
  assert.equal((await apply(c)).applied,false);
  assert.equal((await verify(c)).verified,true);
  const v=(await c.query("SELECT migration_id FROM public.f03_schema_migrations ORDER BY migration_id")).rows.map(x=>x.migration_id);
  assert.deepEqual(v,['000002_pc_auth_sessions','000003_employee_capability_scope_bindings']);
 }finally{await Promise.all(clients.map(x=>x.end()))}
});
test('M04 original 80-table verifier MUST reject 81-table DB; wrong CI seal fails closed',async()=>{
 await assert.rejects(()=>verifyOld(c),/F03_1_NOT_APPLIED/);
 const old=process.env.GITHUB_RUN_ID;
 try{process.env.GITHUB_RUN_ID='99999999';await assert.rejects(()=>verify(c),/F03_2_1B_RUN_SEAL_OR_F02_BASELINE_DENY/)}
 finally{process.env.GITHUB_RUN_ID=old}
});
test('M05 unknown physical object, wrong migration checksum/version, tampering of granted DDL all denied',async()=>{
 await c.query('CREATE VIEW public.ci_rogue_scope_view AS SELECT 1 AS rogue');
 await assert.rejects(()=>verify(c),/F03_2_1B_FULL_PHYSICAL_DRIFT/);
 await c.query('DROP VIEW public.ci_rogue_scope_view');
 await c.query("UPDATE public.f03_schema_migrations SET checksum='tampered' WHERE migration_id='000003_employee_capability_scope_bindings'");
 await assert.rejects(()=>verify(c),/F03_2_1B_VERSION_DRIFT/);
 await c.query("UPDATE public.f03_schema_migrations SET checksum=$1 WHERE migration_id='000003_employee_capability_scope_bindings'",[(await import('../migration.mjs')).checksum]);
 await c.query("UPDATE public.f03_schema_migrations SET migration_id='wrong_version' WHERE migration_id='000003_employee_capability_scope_bindings'");
 await assert.rejects(()=>verify(c),/F03_2_1B_VERSION_DRIFT/);
 await c.query("UPDATE public.f03_schema_migrations SET migration_id='000003_employee_capability_scope_bindings' WHERE migration_id='wrong_version'");
 assert.equal((await verify(c)).verified,true);
});
test('M06 exact CI-only inverse rollback leaves original 80-table structure with original SHA, then reapply',async()=>{
 const r=await rollback(c);assert.equal(r.oldSha,OLD_SHA);
 assert.equal((await verifyOld(c)).schemaSha,OLD_SHA);
 assert.equal((await apply(c)).applied,true);
 assert.equal((await verify(c)).verified,true);
});
