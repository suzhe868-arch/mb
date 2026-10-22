import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {getPublicStructure} from '../../f02-1/schema-integrity.mjs';
import {connect,assertEnvironment,BRANCH} from './environment.mjs';
import {verifyScopeDatabase} from '../runtime-scope/readiness.mjs';

assertEnvironment();
assert.equal(process.env.GITHUB_REF,BRANCH);
const paths=[
 'engineering/f03/runtime-scope/customer-phone-guard.mjs',
 'engineering/f03/customer-other-phone/environment.mjs',
 'engineering/f03/customer-other-phone/fixtures.mjs',
 'engineering/src/f03-customer-other-phone-service.mjs',
 'engineering/src/f03-customer-other-phone-http.mjs',
 'engineering/src/app.mjs',
 'engineering/f03/customer-other-phone/tests/business.test.mjs',
 'engineering/f03/customer-other-phone/tests/https.test.mjs',
 'engineering/f03/customer-other-phone/evidence.mjs',
 'engineering/f03/customer-other-phone/README.md',
 'engineering/f03/customer-other-phone/测试矩阵.tsv',
 'engineering/f03/customer-other-phone/B工程中文交接.md',
 '.github/workflows/f03-customer-other-phone-nonprod.yml',
 'f03-customer-other-phone-business.log',
 'f03-customer-other-phone-https.log',
 'f03-customer-other-phone-runtime-scope.log',
 'f03-customer-other-phone-regression.log'
];
const files=[];
for(const path of paths){
 const bytes=await readFile(path);
 files.push({path,sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length});
}
const pool=await connect();let identity,structure;
try{
 await verifyScopeDatabase(pool);
 const c=await pool.connect();
 try{
  const x=await c.query("SELECT current_database() db,current_user usr,current_setting('server_version_num')::int ver,(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) su");
  const n=await c.query("SELECT count(*)::int n FROM pg_tables WHERE schemaname='public'");
  const schema=await getPublicStructure(c);
  identity={...x.rows[0],public_tables:n.rows[0].n};
  structure={sha256:schema.sha256,expected:'229aa6dc167cd3ccb8da89fd9d08076af2588b6b4bd1cfbdc8d779c31dfeffe0'};
  assert.equal(identity.db,'f03_auth_test');assert.equal(identity.usr,'f03_ci');assert.equal(identity.su,false);
  assert.equal(identity.public_tables,81);assert.equal(structure.sha256,structure.expected);
 }finally{c.release()}
}finally{await pool.end()}
const evidence={
 task:'F03_CUSTOMER_OTHER_PHONE_MANAGE_HTTP_PG16_01',source:'GITHUB_PUSH_OFFICIAL_NONPROD',
 status:'B_SELF_CHECK_EVIDENCE_FINAL_SHA',repository:process.env.GITHUB_REPOSITORY,ref:process.env.GITHUB_REF,
 sha:process.env.GITHUB_SHA,run_id:process.env.GITHUB_RUN_ID,run_attempt:process.env.GITHUB_RUN_ATTEMPT,job:process.env.GITHUB_JOB,
 identity,structure,files,
 boundaries:{customer_phone_manage:'CI_ONLY_F03_CUSTOMER_PHONE_MANAGE',public_schema_changes:false,primary_phone_changes:false,production_routes:false,external_systems:false,parent_issue_187:'SOURCE_GAP/FAIL_CLOSED',production_authorized:false}
};
await writeFile('f03-customer-other-phone-evidence.json',JSON.stringify(evidence,null,2)+'\n');
console.log('CUSTOMER_PHONE_EVIDENCE_WRITTEN',files.length);
