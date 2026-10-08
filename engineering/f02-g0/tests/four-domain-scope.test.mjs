import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateFourDomainScope} from '../scope-validation.mjs';
const read=n=>readFile(new URL('../'+n,import.meta.url),'utf8');
const inputs=await Promise.all(['field-matrix.tsv','field-freeze-candidates.tsv','field-tiers-376.tsv','F02-G0_四域范围承载映射与延期裁定候选.tsv'].map(read));
const split=s=>s.trimEnd().split(/\r?\n/).map(x=>x.split('\t')),tsv=a=>a.map(x=>x.join('\t')).join('\n')+'\n';
const original=inputs.map(split);
function check(arr=original){return validateFourDomainScope(...arr.map(tsv));}
function altered(table,col,fn){const a=original.map(x=>x.map(r=>[...r]));const m=a[0].find(x=>x[1]===table&&x[2]===col);assert.ok(m,'fixture field '+table+'.'+col);const f=a[1].find(x=>x[0]===m[0]),t=a[2].find(x=>x[0]===m[0]);fn(m,f,t);f[5]=m[4]+' | '+m[5]+' | '+m[6];return a;}
function deferred(table,col){return altered(table,col,(m,f,t)=>{f[4]='DEFER_WITH_REASON';f[3]=t[2]='P2_DEFERRED_DETAIL';});}
test('G0-SC四域14事实与字段ID/Authority/阶段/A待签完整，CL门禁继续闭合',()=>{let r=check();assert.deepEqual([r.domainCount,r.factCount,r.fieldCount,r.entities,r.staticFKs],[4,14,510,76,137]);assert.deepEqual(r.counts,{included:466,deferred:33,excluded:11});});
test('System Admin：延期独立身份和账号哈希，必须拒绝',()=>{for(const k of ['system_admin_id','credential_hash'])assert.throws(()=>check(deferred('system_admins',k)),/F02_G0_CL_|F02_G0_SC_/);});
test('System Admin：不得把独立system_admin_id当Employee业务身份',()=>{const x=altered('system_admins','system_admin_id',(r)=>{r[5]='PK;FK:employees.employee_id';});assert.throws(()=>check(x),/F02_G0_SC_SYSTEM_ADMIN_EMPLOYEE_IDENTITY_COLLISION/);});
test('System Admin：bootstrap控制平面创建者自引用FK不可丢',()=>{const x=altered('system_admins','created_by_system_admin_id',r=>{r[5]='CONDITIONAL_NON_BOOTSTRAP_CREATOR';});assert.throws(()=>check(x),/F02_G0_CL_|F02_G0_SC_/);});
test('Matching：Demand结果四级和current/stale不可被未知枚举替换',()=>{for(const [col,newV] of [['match_tier','CHECK_closest'],['current_state','HISTORY']]){const x=altered('demand_match_results',col,r=>{r[5]=newV;});assert.throws(()=>check(x),/F02_G0_CL_|F02_G0_SC_/);}});
test('Matching：priority不能丢合法正式Match Result来源与周期',()=>{for(const col of ['source_match_result_id','listing_cycle_id'])assert.throws(()=>check(deferred('priority_leases',col)),/F02_G0_CL_|F02_G0_SC_/);});
test('CRM：历史真实内容/真实发生时间/原始actor任一延期均拒绝',()=>{for(const col of ['content','occurred_at','actor_employee_id'])assert.throws(()=>check(deferred('crm_followups',col)),/F02_G0_CL_|F02_G0_SC_/);});
test('CRM：未来待办独立身份和未完责任不可丢失，不能混入已发生历史',()=>{assert.throws(()=>check(deferred('crm_followup_tasks','task_id')),/F02_G0_CL_|F02_G0_SC_/);const x=altered('crm_followups','planned_at',(m,f,t)=>{f[4]='INCLUDE_SUPPORT_CANDIDATE';f[3]=t[2]='P1_F02_1_SUPPORT';});assert.throws(()=>check(x),/F02_G0_SC_FUTURE_TASK_MERGED/);});
test('公海：正式事件类型/owner变更事实/客户身份必须保留',()=>{for(const col of ['event_kind','source_owner_history_id','customer_id'])assert.throws(()=>check(deferred('public_pool_events',col)),/F02_G0_CL_|F02_G0_SC_/);});
test('公海：待公海候选不能假装正式进入/退出事件',()=>{const x=altered('public_pool_events','event_kind',r=>{r[5]='CANDIDATE_POOL_HINT';});assert.throws(()=>check(x),/F02_G0_CL_|F02_G0_SC_/);});
test('映射台账：物理字段ID被篡改/事实被删/A虚报签发即拒绝',()=>{const a=original.map(x=>x.map(r=>[...r]));a[3][1][4]=a[3][1][4].replace(/#F02-F-\d{4}/,'#F02-F-9999');assert.throws(()=>check(a),/F02_G0_SC_MAPPING_FIELD_ID_DRIFT/);const b=original.map(x=>x.map(r=>[...r]));b[3].splice(2,1);assert.throws(()=>check(b),/F02_G0_SC_/);const c=original.map(x=>x.map(r=>[...r]));c[3][1][10]='ACCEPTED';assert.throws(()=>check(c),/F02_G0_SC_BAD_NEGATIVE_OR_FAKE_ACCEPTANCE/);});
test('原CL禁恢复及F02-1未施工：复活旧4S表/伪报A冻结必须拒绝',()=>{let a=altered('four_s_organizations','organization_id',(m,f,t)=>{f[4]='INCLUDE_SUPPORT_CANDIDATE';f[3]=t[2]='P1_F02_1_SUPPORT';});assert.throws(()=>check(a),/F02_G0_CL_|F02_G0_SC_/);let b=original.map(x=>x.map(r=>[...r]));b[1][1][7]='ACCEPTED';assert.throws(()=>check(b),/F02_G0_CL_FALSE_A_ACCEPTANCE/);});
