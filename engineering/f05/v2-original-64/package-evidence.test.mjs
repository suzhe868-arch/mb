import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,copyFileSync,writeFileSync,readFileSync,existsSync,symlinkSync,rmSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
import {randomBytes,createHash} from 'node:crypto';
const original=resolve(import.meta.dirname,'package-evidence.mjs');
function setup(){const base=mkdtempSync(join(tmpdir(),'v2pack-'));copyFileSync(original,join(base,'package-evidence.mjs'));
 const src=join(base,'evidence','shard0');mkdirSync(src,{recursive:true});return {base,src}}
function run(base){return execFileSync(process.execPath,[join(base,'package-evidence.mjs'),'0'],
 {encoding:'utf8',env:{...process.env,GITHUB_SHA:'a'.repeat(40),GITHUB_RUN_ID:'100'}})}
test('无损压缩保留全部正文与sha256核对清册',()=>{
 const {base,src}=setup();try{
  const input='original-business-evidence'.repeat(120000);writeFileSync(join(src,'original.log'),input);
  const output=run(base);assert.match(output,/V2_LOSSLESS_EVIDENCE_READY/);
  const dest=join(base,'evidence','upload-safe-0'),meta=JSON.parse(readFileSync(join(dest,'artifact-integrity-manifest.json')));
  assert.equal(meta.complete_evidence,true);assert.equal(meta.items.length,1);
  assert.equal(meta.items[0].sha256,createHash('sha256').update(input).digest('hex'));
  assert.ok(meta.packed_bytes<5*1024*1024);
  const unpacked=execFileSync('python3',['-c','import sys,zipfile,hashlib;z=zipfile.ZipFile(sys.argv[1]);print(hashlib.sha256(z.read("original.log")).hexdigest())',join(dest,'original-evidence.zip')],{encoding:'utf8'});
  assert.equal(unpacked.trim(),createHash('sha256').update(input).digest('hex'));
 }finally{rmSync(base,{recursive:true,force:true})}
});
test('不可压缩证据超5MiB时仅留阻断摘要、不得上传超额ZIP',()=>{
 const {base,src}=setup();try{
  writeFileSync(join(src,'incompressible.bin'),randomBytes(6*1024*1024));
  assert.throws(()=>run(base));
  const dest=join(base,'evidence','upload-safe-0'),meta=JSON.parse(readFileSync(join(dest,'artifact-integrity-manifest.json')));
  assert.equal(meta.complete_evidence,false);assert.equal(meta.items.length,0);
  assert.equal(existsSync(join(dest,'original-evidence.zip')),false);
 }finally{rmSync(base,{recursive:true,force:true})}
});
test('符号链接证据必须拒绝',()=>{
 const {base,src}=setup();try{
  symlinkSync('/etc/passwd',join(src,'secret.txt'));
  assert.throws(()=>run(base));
 }finally{rmSync(base,{recursive:true,force:true})}
});
