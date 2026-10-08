import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateBuildableClosure} from '../closure-validation.mjs';
import {validatePcRegistryFixture} from '../pc-credential-validation.mjs';
const read=n=>readFile(new URL('../'+n,import.meta.url),'utf8');
const raw=await Promise.all(['field-matrix.tsv','field-freeze-candidates.tsv','field-tiers-376.tsv'].map(read));
const parse=s=>s.trimEnd().split(/\r?\n/).map(x=>x.split('\t')),dump=a=>a.map(x=>x.join('\t')).join('\n')+'\n';
const original=raw.map(parse),dup=()=>original.map(a=>a.map(r=>[...r]));
const closure=a=>validateBuildableClosure(...a.map(dump));
function mutate(table,col,fn){const x=dup(),m=x[0].find(r=>r[1]===table&&r[2]===col);assert.ok(m);const f=x[1].find(r=>r[0]===m[0]),t=x[2].find(r=>r[0]===m[0]);fn(m,f,t);f[5]=m[4]+' | '+m[5]+' | '+m[6];return x;}
const emp=(account,key,id)=>({normalized_login_key:key,password_hash:'hash-placeholder-'+account,principal_kind:'employee',employee_id:id,system_admin_id:null});
const adm=(account,key,id)=>({normalized_login_key:key,password_hash:'hash-placeholder-'+account,principal_kind:'system_admin',employee_id:null,system_admin_id:id});
test('G0-ALL-05唯一权威正例：510原ID、管理员身份仍在、双凭证历史两ID已排除',()=>{
 const v=closure(dup());assert.deepEqual(v.counts,{included:464,deferred:33,excluded:13});
 for(const [table,col] of [['system_admins','login_account'],['system_admins','credential_hash']]){
  const r=original[0].find(x=>x[1]===table&&x[2]===col),f=original[1].find(x=>x[0]===r[0]);
  assert.equal(f[4],'EXCLUDE_DUPLICATE_PC_CREDENTIAL');assert.match(r[5],/RETIRED_DUPLICATE_PC_CREDENTIAL_NOT_IN_F02_1/);
 }
 assert.deepEqual(validatePcRegistryFixture([emp(1,'sales_a',1),emp(2,'four_s_b',2),adm(3,'sys_admin_c',1)]),{accounts:3,uniqueLogins:3,uniquePrincipals:3});
});
test('旧System Admin登录字段重新拟建，即使保留原ID也必须阻断',()=>{
 const x=mutate('system_admins','login_account',(m,f,t)=>{m[5]='UNIQUE_SYSTEM_ADMIN_LOGIN_ACCOUNT';f[4]='INCLUDE_MINIMUM_COMPLETE_ENTITY';f[3]=t[2]='P1_F02_1_SUPPORT';});assert.throws(()=>closure(x),/F02_G0_CL_ADMIN_DUPLICATE_PC_CREDENTIAL_RESTORED/);
});
test('旧System Admin凭证hash恢复可写列必须阻断',()=>{
 const x=mutate('system_admins','credential_hash',(m,f,t)=>{m[5]='SENSITIVE_HASH_ONLY';f[4]='INCLUDE_MINIMUM_COMPLETE_ENTITY';f[3]=t[2]='P1_F02_1_SUPPORT';});assert.throws(()=>closure(x),/F02_G0_CL_ADMIN_DUPLICATE_PC_CREDENTIAL_RESTORED/);
});
test('PC唯一登录名限制丢失或变成按身份种类分别唯一必须拒绝',()=>{
 const x=mutate('pc_login_accounts','normalized_login_key',m=>{m[5]='UNIQUE_PER_PRINCIPAL_KIND;SINGLE_PC_CREDENTIAL_AUTHORITY';});assert.throws(()=>closure(x),/F02_G0_CL_ALL_PC_UNIQUE/);
});
test('统一password_hash唯一可写权威被转移或丢失必须拒绝',()=>{
 const x=mutate('pc_login_accounts','password_hash',m=>{m[5]='SENSITIVE_HASH_NO_PLAINTEXT';});assert.throws(()=>closure(x),/F02_G0_CL_PC_HASH_AUTHORITY_LOST/);
});
test('Employee/System Admin同一物理登录键冲突阻断（包括4S员工）',()=>{
 assert.throws(()=>validatePcRegistryFixture([emp(1,'shared_key',7),adm(2,'shared_key',9)]),/F02_G0_PC_GLOBAL_LOGIN_CONFLICT/);
 assert.throws(()=>validatePcRegistryFixture([emp(1,'shared_key',7),emp(2,'shared_key',8)]),/F02_G0_PC_GLOBAL_LOGIN_CONFLICT/);
});
test('同一principal创建第二个PC账号/密码事实必须拒绝',()=>{
 assert.throws(()=>validatePcRegistryFixture([adm(1,'admin_one',3),adm(2,'admin_two',3)]),/F02_G0_PC_MULTIPLE_PC_CREDENTIALS_PER_PRINCIPAL/);
 assert.throws(()=>validatePcRegistryFixture([emp(1,'employee_a',3),emp(2,'employee_b',3)]),/F02_G0_PC_MULTIPLE_PC_CREDENTIALS_PER_PRINCIPAL/);
});
test('Identity XOR：单账号不能同时绑定Employee与System Admin，也不能双空',()=>{
 assert.throws(()=>validatePcRegistryFixture([{...emp(1,'mix_a',5),system_admin_id:8}]),/F02_G0_PC_XOR_PRINCIPAL_ID/);
 assert.throws(()=>validatePcRegistryFixture([{...adm(1,'mix_b',5),system_admin_id:null}]),/F02_G0_PC_XOR_PRINCIPAL_ID/);
});
test('Identity kind须匹配外键，4S不许伪造独立第三种PC principal',()=>{
 assert.throws(()=>validatePcRegistryFixture([{...adm(1,'fake_a',3),principal_kind:'employee'}]),/F02_G0_PC_KIND_FK_MISMATCH/);
 assert.throws(()=>validatePcRegistryFixture([{...emp(1,'fake_4s',8),principal_kind:'four_s'}]),/F02_G0_PC_WRONG_PRINCIPAL_KIND/);
});
test('PC principal check标记丢失/回退单一身份时必须拒绝',()=>{
 const x=mutate('pc_login_accounts','principal_kind',m=>{m[5]='CHECK_EMPLOYEE_OR_SYSTEM_ADMIN;XOR_PRINCIPAL_ID';});
 assert.throws(()=>closure(x),/F02_G0_CL_PC_PRINCIPAL_MIXED/);
});
