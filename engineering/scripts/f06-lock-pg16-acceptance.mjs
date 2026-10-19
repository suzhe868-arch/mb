// Test-only PG16 acceptance launcher: no consent / no PG16 / skip count MUST fail.
import {spawnSync} from 'node:child_process';
import {writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import {assertF06TestEnvironment} from '../src/f06-lock-readiness.mjs';
assertF06TestEnvironment(process.env);
const engineering=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const testFile=resolve(engineering,'integration/f06-lock.pg16.test.mjs');
const child=spawnSync(process.execPath,['--test',testFile],{
 cwd:engineering,env:process.env,encoding:'utf8',timeout:180000,
 maxBuffer:4*1024*1024,shell:false
});
const log=(child.stdout||'')+(child.stderr||'');
const evidence=resolve(engineering,'evidence');
await mkdir(evidence,{recursive:true});
await writeFile(resolve(evidence,'F06_PG16_NATIVE_ACCEPTANCE_TAP.log'),log,'utf8');
process.stdout.write(log);
const summary={};
for(const [,name,value] of log.matchAll(/^# (tests|pass|fail|cancelled|skipped) (\d+)\s*$/gm))summary[name]=Number(value);
if(child.error||child.status!==0||summary.tests<16||summary.pass!==summary.tests||
 summary.fail!==0||summary.skipped!==0||summary.cancelled!==0){
 console.error('F06_PG16_ACCEPTANCE_FAILED',JSON.stringify({
  exitCode:child.status,signal:child.signal,reason:child.error?.message||null,summary}));
 process.exitCode=1;
}else{
 console.info('F06_NATIVE_PG16_HTTP_ACCEPTANCE_PASS',JSON.stringify({
  testCount:summary.tests,fail:0,skipped:0,cancelled:0,productionReady:false}));
}
