// Isolated per-GitHub-job nonprivileged PG16 bootstrap.
// No production DB. Identical verified M94->15->16->17 source chain.
import {spawnSync} from 'node:child_process';
for(const [key,val] of Object.entries({CI:'true',GITHUB_ACTIONS:'true',APP_ENV:'test',NODE_ENV:'test',
 F03_1_ISOLATION_CONFIRM:'I_AUTHORIZE_F03_1_NEW_EMPTY_PG16_AUTH_ONLY',
 F05_2_ISOLATION_CONFIRM:'I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY'}))
 if(process.env[key]!==val)throw Error('F05_3C_PREPARE_NOT_ISOLATED_'+key);
if(process.env.F03_1_DATABASE_URL!=='postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test')
 throw Error('F05_3C_PREPARE_WRONG_PG16');
if(process.argv.length!==2)throw Error('F05_3C_PREPARE_ARGS');
const cmds=[
 ['f03-1/runner.mjs','--bootstrap'],['f03-1/runner.mjs','--apply'],
 ...['runtime-scope','runtime-admin-population','runtime-receiving-pool','runtime-team-scope',
  'runtime-handover-ledger','runtime-customer-owner-handover','runtime-demand-responsible-handover',
  'runtime-consultation-assignee-handover','runtime-waitlist-responsible-handover',
  'runtime-lock-responsible-handover'].map(x=>['f03/'+x+'/runner.mjs','--apply']),
 ...['f03-1','f03/runtime-scope','f03/runtime-governance-template',
  'f03/runtime-receiving-pool','f03/runtime-team-scope','f03/runtime-handover-ledger',
  'f03/runtime-manager-team-governance','f03/runtime-handover-preflight',
  'f03/runtime-customer-owner-handover','f03/runtime-demand-responsible-handover',
  'f03/runtime-consultation-assignee-handover','f03/runtime-waitlist-responsible-handover',
  'f03/runtime-lock-responsible-handover','f03/runtime-transaction-responsible-handover']
  .map(x=>[x+'/fixtures.mjs']),
 ['f03/runtime-transaction-responsible-handover/evidence.mjs','--old'],
 ['f03/runtime-transaction-responsible-handover/runner.mjs','--apply'],
 ['f03/runtime-handover-reconciliation/fixtures.mjs'],
 ['f03/field-security-projection/fixtures.mjs'],
 ['f03/runtime-transaction-responsible-handover/evidence.mjs','--new'],
 // The prior M94 archive is verified by F05-2 migration; no re-archiving here.
 ...['vehicle-stewardship-physical-scope','four-s-member-trust-scope']
 .flatMap(x=>[['f05/'+x+'/runner.mjs','--inject-rollback'],['f05/'+x+'/runner.mjs','--apply'],
  ['f05/'+x+'/runner.mjs','--verify'],['f05/'+x+'/fixtures.mjs']]),
 ['f05/jyt-wholesale-lineage-cycle/runner.mjs','--inject-rollback'],
 ['f05/jyt-wholesale-lineage-cycle/runner.mjs','--apply'],
 ['f05/jyt-wholesale-lineage-cycle/runner.mjs','--verify'],
 ['f05/wholesale-to-mingbang-conversion/runner.mjs','--inject-rollback'],
 ['f05/wholesale-to-mingbang-conversion/runner.mjs','--apply'],
 ['f05/wholesale-to-mingbang-conversion/runner.mjs','--verify']
];
for(const [file,...args] of cmds){
 console.log('F05_3C_BOOTSTRAP_STEP',file,...args);
 const p=spawnSync(process.execPath,[file,...args],{stdio:'inherit',env:process.env,timeout:180000});
 if(p.error||p.status!==0)throw Error('F05_3C_PREPARE_STEP_FAILED_'+file+'_'+(p.error?.message||p.status));
}
console.log('F05_3C_ISOLATED_POSTGRES16_VERSION_CHAIN_PREPARED');
