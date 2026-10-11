import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
const mode=process.argv[2];
if(process.argv.length!==3||!['source','https'].includes(mode)||!process.env.F05_3C_CI_EPHEMERAL_SYNC_TOKEN)
 throw Error('F05_3C_SIGNED_EPHEMERAL_TEST_ENV_REQUIRED');
const output='f05/wholesale-to-mingbang-conversion/artifacts/'+mode;
await mkdir(output,{recursive:true});
const parts=[],child=spawn(process.execPath,['--test','f05/wholesale-to-mingbang-conversion/tests/'+mode+'.test.mjs'],
 {env:process.env,stdio:['ignore','pipe','pipe']});
for(const stream of [child.stdout,child.stderr]){
 stream.on('data',v=>{parts.push(v);process.stdout.write(v)});
}
const exit=await new Promise((resolve,reject)=>{child.on('error',reject);child.on('close',resolve)});
const logs=Buffer.concat(parts).toString('utf8');
await writeFile(output+'/true-pg16-'+mode+'-tests.log',logs,'utf8');
if(exit!==0||!logs.includes('# fail 0'))throw Error('F05_3C_REAL_'+mode.toUpperCase()+'_TESTS_NOT_PASS');
