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
test('M06 nonempty rollback DENIES without DDL/version side effects; after cleanup exact 80-table inverse rollback and reapply',async()=>{
 // New fixture rows exist only inside this disposable migration-test PG16 job.
 await c.query("INSERT INTO public.roles(role_id,role_code) VALUES (991,'sales')");
 await c.query("INSERT INTO public.employees(employee_id,employment_status,receiving_status,main_role_id) VALUES (991,'active','paused',991)");
 await c.query("INSERT INTO public.permissions(permission_id,permission_code) VALUES (991,'ci.scope.rollback.synthetic')");
 await c.query("INSERT INTO public.employee_data_scopes(scope_id,employee_id,scope_kind,scope_reference_id) VALUES (991,991,'object',301)");
 await c.query("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at) VALUES (991,991,991,now())");
 try{
  await assert.rejects(()=>rollback(c),/F03_2_1B_ROLLBACK_NONEMPTY_DENY/);
  assert.equal((await verify(c)).verified,true,'failed rollback may not mutate physical schema or version chain');
  assert.deepEqual((await c.query("SELECT migration_id FROM public.f03_schema_migrations ORDER BY migration_id")).rows.map(x=>x.migration_id),
   ['000002_pc_auth_sessions','000003_employee_capability_scope_bindings']);
 }finally{
  await c.query('DELETE FROM public.employee_capability_scope_bindings WHERE scope_id=991');
  await c.query('DELETE FROM public.employee_data_scopes WHERE scope_id=991');
  await c.query('DELETE FROM public.permissions WHERE permission_id=991');
  await c.query('DELETE FROM public.employees WHERE employee_id=991');
  await c.query('DELETE FROM public.roles WHERE role_id=991');
 }
 const result=await rollback(c);assert.equal(result.oldSha,OLD_SHA);
 assert.equal((await verifyOld(c)).schemaSha,OLD_SHA);
 assert.equal((await apply(c)).applied,true);
 assert.equal((await verify(c)).verified,true);
});


const original0002={id:'000002_pc_auth_sessions',
 checksum:'3d7f0a539941e4089147a9c7a82ecfdb2ccebd64ba513e01deeb0fcf1d2bd6ab',
 structure:'8af70f5f3ca32f2a7b84a4ad69d68dbf7c81bd9b6c97d79ad7481ce3a8c23ee5'};
const refuseAll=async(label,pattern=/F03_2_1B_VERSION_DRIFT|F03_2_1B_RUN_SEAL_OR_F02_BASELINE_DENY/)=>{
 for(const [name,fn] of [['verify',()=>verify(c)],['idempotent apply',()=>apply(c)],['rollback',()=>rollback(c)]]){
  await assert.rejects(fn,pattern,label+' '+name);
 }
 const count=(await c.query("SELECT count(*)::integer AS n FROM public.f03_schema_migrations")).rows[0].n;
 assert.equal(count,2,label+' must preserve original migration rows');
 assert.equal((await c.query("SELECT count(*)::integer AS n FROM pg_tables WHERE schemaname='public' AND tablename='employee_capability_scope_bindings'")).rows[0].n,1,
   label+' must not remove the new table');
};
test('M07 A-R1: original 000002 ID/checksum/physical SHA tampering denies read-only verify, idempotent apply and rollback',async()=>{
 for(const [column,tamper] of [['migration_id','000002_corrupt'],['checksum','f'.repeat(64)],['structure_sha256','e'.repeat(64)]]){
  await c.query('UPDATE public.f03_schema_migrations SET '+column+'=$1 WHERE migration_id=$2',[tamper,original0002.id]);
  try{await refuseAll('old 000002 '+column)}
  finally{
   await c.query('UPDATE public.f03_schema_migrations SET '+column+'=$1 WHERE '+column+'=$2',
    [column==='migration_id'?original0002.id:column==='checksum'?original0002.checksum:original0002.structure,tamper]);
  }
  assert.equal((await verify(c)).verified,true);
 }
});
test('M08 A-R1: missing 000002, extra unknown version, F02 checksum corruption all fail under exact chain guard',async()=>{
 // Move the old row out in a single test transaction, exercising a real
 // missing-version state without permanently changing a trusted migration.
 await c.query("DELETE FROM public.f03_schema_migrations WHERE migration_id='000002_pc_auth_sessions'");
 try{await refuseAll('missing 000002',/F03_2_1B_VERSION_DRIFT/)}
 finally{await c.query("INSERT INTO public.f03_schema_migrations(migration_id,checksum,structure_sha256) VALUES($1,$2,$3)",
  [original0002.id,original0002.checksum,original0002.structure])}
 await c.query("INSERT INTO public.f03_schema_migrations(migration_id,checksum,structure_sha256) VALUES('000004_rogue','bogus','bogus')");
 try{await refuseAll('extra unknown migration')}
 finally{await c.query("DELETE FROM public.f03_schema_migrations WHERE migration_id='000004_rogue'")}
 const before=(await c.query("SELECT checksum FROM public.f02_schema_migrations WHERE migration_id='000001_current_initial'")).rows[0].checksum;
 await c.query("UPDATE public.f02_schema_migrations SET checksum='TAMPERED' WHERE migration_id='000001_current_initial'");
 try{await refuseAll('tampered 000001',/F03_2_1B_RUN_SEAL_OR_F02_BASELINE_DENY/)}
 finally{await c.query("UPDATE public.f02_schema_migrations SET checksum=$1 WHERE migration_id='000001_current_initial'",[before])}
 assert.equal((await verify(c)).verified,true);
});
test('M09 A-R2: extra non-public user namespace + object denies all three current migration entry points',async()=>{
 await c.query('CREATE SCHEMA ci_f03_2_1b_unapproved');
 await c.query('CREATE TABLE ci_f03_2_1b_unapproved.rogue (id bigint PRIMARY KEY)');
 try{
  await refuseAll('nonpublic schema',/F03_2_1B_NONPUBLIC_NAMESPACE_DENY/);
  assert.equal((await c.query("SELECT count(*)::integer n FROM pg_tables WHERE schemaname='ci_f03_2_1b_unapproved'")).rows[0].n,1);
 }finally{
  await c.query('DROP TABLE ci_f03_2_1b_unapproved.rogue');
  await c.query('DROP SCHEMA ci_f03_2_1b_unapproved');
 }
 assert.equal((await verify(c)).verified,true);
 assert.equal((await apply(c)).applied,false,'new full guard allows the EXACT restored environment');
});
