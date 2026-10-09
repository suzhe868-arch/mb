import assert from 'node:assert/strict';
import {connect,verify} from '../migration.mjs';
import {getPublicStructure} from '../../f02-1/schema-integrity.mjs';
const c=await connect();
try{
 const structure=await getPublicStructure(c);
 const versions=(await c.query('SELECT migration_id,checksum,structure_sha256,applied_at FROM public.f02_schema_migrations ORDER BY migration_id')).rows;
 const seal=(await c.query('SELECT * FROM public.f03_isolation_seal')).rows;
 const table=()=>c.query("SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema='public' AND table_name='f03_schema_migrations'");
 assert.equal((await table()).rows[0].n,0);
 await assert.rejects(()=>verify(c),/F03_1_NOT_APPLIED/);
 assert.equal((await getPublicStructure(c)).sha256,structure.sha256,'--verify changed physical structure');
 assert.deepEqual((await c.query('SELECT migration_id,checksum,structure_sha256,applied_at FROM public.f02_schema_migrations ORDER BY migration_id')).rows,versions,'F02 version unexpectedly mutated');
 assert.deepEqual((await c.query('SELECT * FROM public.f03_isolation_seal')).rows,seal,'CI run seal unexpectedly mutated');
 assert.equal((await table()).rows[0].n,0,'--verify installed a version table');
 console.log('F03-1 UNAPPLIED --verify REJECTED, PHYSICAL STRUCTURE AND METADATA UNCHANGED PASS');
}finally{await c.end()}
