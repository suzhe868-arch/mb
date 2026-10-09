import {test} from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import {verifyAuthDatabase} from '../../src/f03-auth-readiness.mjs';
const pool=new pg.Pool({connectionString:process.env.F03_1_DATABASE_URL,max:2});
test.after(async()=>pool.end());
test('real PG16 identity, role, sealed migration chain and full physical fingerprint',async()=>{
 assert.equal(await verifyAuthDatabase(pool),true);
 await assert.rejects(()=>verifyAuthDatabase(pool,{env:{...process.env,GITHUB_RUN_ID:'999999999'}}),/F03_AUTH_GUARD_VERSION_OR_SEAL/);
 await assert.rejects(()=>verifyAuthDatabase(pool,{connectionString:'postgres://f03_ci:test@127.0.0.1:5432/f02_schema_test'}),/F03_AUTH_GUARD_TARGET/);
 await pool.query("UPDATE public.f03_schema_migrations SET checksum='tampered' WHERE migration_id='000002_pc_auth_sessions'");
 try{await assert.rejects(()=>verifyAuthDatabase(pool),/F03_AUTH_GUARD_VERSION_OR_SEAL/)}
 finally{await pool.query("UPDATE public.f03_schema_migrations SET checksum='3d7f0a539941e4089147a9c7a82ecfdb2ccebd64ba513e01deeb0fcf1d2bd6ab' WHERE migration_id='000002_pc_auth_sessions'")}
 await pool.query('CREATE VIEW public.f03_runtime_rogue AS SELECT 1 AS probe');
 try{await assert.rejects(()=>verifyAuthDatabase(pool),/F03_AUTH_GUARD_PHYSICAL_DRIFT/)}
 finally{await pool.query('DROP VIEW public.f03_runtime_rogue')}
 assert.equal(await verifyAuthDatabase(pool),true);
 console.log('F03-1 READINESS REAL DB/CI SEAL/VERSION/PHYSICAL DRIFT FAIL CLOSED PASS');
});
