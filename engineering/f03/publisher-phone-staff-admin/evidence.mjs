import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {connect,assertEnvironment,BRANCH} from './migration.mjs';

assertEnvironment();
assert.equal(process.env.GITHUB_REF,BRANCH);
const paths=[
 'engineering/f03/publisher-phone-staff-admin/schema.sql',
 'engineering/f03/publisher-phone-staff-admin/migration.mjs',
 'engineering/f03/publisher-phone-staff-admin/fixtures.mjs',
 'engineering/src/f03-publisher-phone-admin-service.mjs',
 'engineering/src/f03-publisher-phone-admin-http.mjs',
 'engineering/f03/publisher-phone-staff-admin/tests/business.test.mjs',
 'engineering/f03/publisher-phone-staff-admin/tests/https.test.mjs',
 'engineering/src/app.mjs',
 'f03-phone-admin-test.log',
 'f03-phone-admin-regression.log'
];
const files=[];
for(const path of paths){
 const bytes=await readFile(path);
 files.push({path,sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length});
}
const pool=await connect();
let identity;
try{
 const x=await pool.query("SELECT current_database() db,current_user usr,current_setting('server_version_num')::int ver,(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) su,(SELECT rolsuper FROM pg_roles WHERE rolname='postgres') postgres_superuser");
 const y=await pool.query("SELECT count(*)::int n FROM pg_tables WHERE schemaname='public'");
 const z=await pool.query("SELECT count(*)::int n FROM information_schema.tables WHERE table_schema='f03_publisher_phone_admin_test'");
 identity={...x.rows[0],public_tables:y.rows[0].n,private_tables:z.rows[0].n};
 assert.equal(identity.db,'f03_auth_test');assert.equal(identity.usr,'f03_ci');assert.equal(identity.su,false);
 assert.equal(identity.public_tables,81);assert.equal(identity.private_tables,2);
}finally{await pool.end()}
const evidence={
 task:'F03_F04_PUBLISHER_PHONE_STAFF_PERMISSION_ADMIN_HTTP_PG16_01',
 source:'GITHUB_PUSH_OFFICIAL_NONPROD',
 status:'LOCAL_CHECKS_COMPLETED_VERIFY_OFFICIAL_RUN_CONCLUSION',
 repository:process.env.GITHUB_REPOSITORY,ref:process.env.GITHUB_REF,sha:process.env.GITHUB_SHA,
 run_id:process.env.GITHUB_RUN_ID,run_attempt:process.env.GITHUB_RUN_ATTEMPT,job:process.env.GITHUB_JOB,
 identity,files,
 boundaries:{F07_RUNTIME:'NOT_CONNECTED_F07_RUNTIME',SOURCE_GAP:'FAIL_CLOSED',production:false,real_phone:false,external_systems:false}
};
await writeFile('f03-phone-admin-evidence.json',JSON.stringify(evidence,null,2)+'\n');
console.log('F03_PHONE_ADMIN_EVIDENCE_MANIFEST_WRITTEN',files.length);
