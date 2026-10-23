import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {join,relative} from 'node:path';
import {assertEnvironment} from './environment.mjs';
const workflow='.github/workflows/f03-f07-publisher-phone-ed25519-nonprod.yml';
assertEnvironment();
assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),process.env.GITHUB_SHA,'WORKFLOW_SHA_MISMATCH');
assert.equal(process.env.GITHUB_REF,'refs/heads/feat/f03-f07-publisher-phone-ed25519-nonprod-01');
const changed=execFileSync('git',['-c','core.quotePath=false','diff','--name-only','origin/main...HEAD'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
assert.ok(changed.length>0,'EMPTY_AUTHORIZED_DIFF');
for(const path of changed)assert.ok(path.startsWith('engineering/f03-f07/publisher-phone-ed25519-nonprod/')||path===workflow,'OUT_OF_SCOPE:'+path);
const yaml=await readFile(workflow,'utf8');
assert.match(yaml,/^on:\s*\n\s+push:/m);
assert.match(yaml,/feat\/f03-f07-publisher-phone-ed25519-nonprod-01/);
assert.match(yaml,/engineering\/f03-f07\/publisher-phone-ed25519-nonprod\/\*\*/);
assert.match(yaml,/\.github\/workflows\/f03-f07-publisher-phone-ed25519-nonprod\.yml/);
assert.doesNotMatch(yaml,/^\s+pull_request\s*:/m);
assert.doesNotMatch(yaml,/^\s+workflow_dispatch\s*:/m);
assert.doesNotMatch(yaml,/^\s+schedule\s*:/m);
assert.match(yaml,/retention-days:\s*1/);
assert.match(yaml,/runs-on:\s*ubuntu-24\.04/);
const schema=await readFile('engineering/f03-f07/publisher-phone-ed25519-nonprod/schema.sql','utf8');
assert.doesNotMatch(schema,/CREATE\s+(?:TABLE|SCHEMA)\s+public\./i);
assert.match(schema,/f03_f07_phone_ed25519_nonprod\.challenges/);
assert.match(schema,/nonce_sha256\s+bytea/i);
const protocol=await readFile('engineering/f03-f07/publisher-phone-ed25519-nonprod/protocol.mjs','utf8');
assert.match(protocol,/formalSourceSigned:false/);
assert.match(protocol,/productionReady:false/);
assert.match(protocol,/generateKeyPairSync\('ed25519'\)/);
const guard=await readFile('engineering/f03-f07/publisher-phone-ed25519-nonprod/verifier.mjs','utf8');
assert.match(guard,/authorizePublisherPhone/);
assert.match(guard,/challengeStore\.consume/);
async function walk(dir){
 const out=[];
 for(const entry of await readdir(dir,{withFileTypes:true})){
  const path=join(dir,entry.name);
  if(entry.isDirectory())out.push(...await walk(path));else out.push(path);
 }
 return out;
}
const scripts=(await walk('engineering/f03-f07/publisher-phone-ed25519-nonprod')).filter(p=>p.endsWith('.mjs'));
assert.ok(scripts.length>=8,'EXPECTED_NEW_PROTOCOL_MODULES');
for(const path of scripts)execFileSync('node',['--check',path],{stdio:'pipe'});
execFileSync('git',['diff','--check','origin/main...HEAD'],{stdio:'pipe'});
console.log('F03_F07_CONTRACT_PATH_SYNTAX_SEAL_PASS',JSON.stringify({sha:process.env.GITHUB_SHA,changedFiles:changed.length,modules:scripts.length}));
