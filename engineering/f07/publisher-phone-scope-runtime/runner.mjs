import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import pg from 'pg';
import {assertF07RuntimeEnvironment,F08_3_REF} from '../../src/f07-runtime/runtime.mjs';

assertF07RuntimeEnvironment(process.env,F08_3_REF);
assert.equal(process.env.GITHUB_REF,F08_3_REF,'F08_3_EXACT_REF_REQUIRED');
assert.equal(process.env.GITHUB_EVENT_NAME,'push','F08_3_PUSH_ONLY');
assert.match(process.env.GITHUB_SHA || '',/^[0-9a-f]{40}$/,'F08_3_SHA_REQUIRED');
assert.match(process.env.GITHUB_RUN_ID || '',/^[0-9]+$/,'F08_3_RUN_ID_REQUIRED');

const f07 = new pg.Pool({connectionString:process.env.DATABASE_URL});
const f03 = new pg.Pool({connectionString:process.env.F03_1_DATABASE_URL});
try {
  const [a,b] = await Promise.all([
    f07.query("SELECT current_database() AS db,current_user AS usr,current_setting('server_version_num')::integer AS ver,(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) AS su,(SELECT rolcreatedb FROM pg_roles WHERE rolname=current_user) AS cdb,(SELECT rolcreaterole FROM pg_roles WHERE rolname=current_user) AS cr"),
    f03.query("SELECT current_database() AS db,current_user AS usr,current_setting('server_version_num')::integer AS ver,(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) AS su,(SELECT rolcreatedb FROM pg_roles WHERE rolname=current_user) AS cdb,(SELECT rolcreaterole FROM pg_roles WHERE rolname=current_user) AS cr,(SELECT count(*)::integer FROM pg_tables WHERE schemaname='public') AS public_tables")
  ]);
  const runtime = a.rows[0];
  const auth = b.rows[0];
  for (const [identity,db,user] of [[runtime,'f07_runtime_test','f07_runtime_ci'],[auth,'f03_auth_test','f03_ci']]) {
    assert.equal(identity.db,db);
    assert.equal(identity.usr,user);
    assert.ok(identity.ver >= 160000 && identity.ver < 170000);
    assert.equal(identity.su,false);
    assert.equal(identity.cdb,false);
    assert.equal(identity.cr,false);
  }
  assert.equal(Number(auth.public_tables),81,'F03 SG01 binding migration must be present');
  const evidence = {
    task:'F08_PUBLISHER_PHONE_SCOPE_RUNTIME_NONPROD_03',
    repository:process.env.GITHUB_REPOSITORY,
    ref:process.env.GITHUB_REF,
    sha:process.env.GITHUB_SHA,
    run_id:process.env.GITHUB_RUN_ID,
    run_attempt:process.env.GITHUB_RUN_ATTEMPT || '1',
    job:process.env.GITHUB_JOB || 'workflow-job',
    event:process.env.GITHUB_EVENT_NAME,
    status:'IDENTITY_AND_SCOPE_STRUCTURE_PASS',
    databases:{f07_runtime:runtime,f03_auth:auth},
    boundaries:{
      external_jyt_collector:false,
      public_network_runtime_calls:false,
      production_database:false,
      real_phone:false,
      real_dialer:false,
      f03_current_facts_reader_modified:false,
      f03_sg01_migration_modified:false,
      phone_cache_key:'source_platform + upstream_publisher_id',
      modes:['LOCKED_ONLY','ALL_ACTIVE_JYT'],
      formal_external_source_status:'SOURCE_GAP'
    }
  };
  await writeFile('f08-3-run-evidence.json',JSON.stringify(evidence,null,2)+'\n');
  await writeFile('f08-3-run-evidence.tsv',
    'task\trepository\tref\tsha\trun_id\tattempt\tjob\tf07_database\tf07_user\tf07_pg_version\tf03_database\tf03_user\tf03_pg_version\tf03_public_tables\tstatus\n' +
    [evidence.task,evidence.repository,evidence.ref,evidence.sha,evidence.run_id,evidence.run_attempt,evidence.job,
     runtime.db,runtime.usr,runtime.ver,auth.db,auth.usr,auth.ver,auth.public_tables,evidence.status].join('\t')+'\n');
  console.log('F08_3_OFFICIAL_RUN_EVIDENCE_WRITTEN');
} finally {
  await Promise.all([f07.end(),f03.end()]);
}
