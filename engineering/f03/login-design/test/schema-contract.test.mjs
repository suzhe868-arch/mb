import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {compileCurrentInitial} from '../../../f02-1/compile-current.mjs';
const root=new URL('../../../f02-g0/',import.meta.url);
const here=new URL('../',import.meta.url);
const tsv=s=>s.trimEnd().split(/\r?\n/).map(l=>l.split('\t'));
const matrix=tsv(await readFile(new URL('field-matrix.tsv',root),'utf8')).slice(1);
const freeze=new Map(tsv(await readFile(new URL('field-freeze-candidates.tsv',root),'utf8')).slice(1).map(r=>[r[0],r[4]]));
const [headers,...rows]=tsv(await readFile(new URL('schema-delta.tsv',here),'utf8'));
const pos=new Map(headers.map((h,i)=>[h,i]));
const val=(r,k)=>r[pos.get(k)];
const expected=new Set(['pc_login_accounts','employees','system_admins','audit_events']);
const frozen=matrix.filter(r=>expected.has(r[1])&&freeze.get(r[0])?.startsWith('INCLUDE_'));
const excluded=matrix.filter(r=>r[1]==='system_admins'&&freeze.get(r[0])==='EXCLUDE_DUPLICATE_PC_CREDENTIAL');
test('exact current schema delta must mechanically match F02-G0 frozen physical data',async()=>{
 assert.equal(frozen.length,31);
 assert.equal(rows.filter(r=>val(r,'classification')==='EXISTING_KEEP').length,31);
 assert.equal(rows.filter(r=>val(r,'classification')==='EXISTING_EXCLUDED_DO_NOT_ADD').length,2);
 const byKey=new Map(rows.filter(r=>val(r,'classification')==='EXISTING_KEEP').map(r=>[val(r,'table_name')+'.'+val(r,'column_or_index'),r]));
 for(const [id,table,col,type,nullable] of frozen){
  const r=byKey.get(table+'.'+col);
  assert.ok(r,'missing frozen '+table+'.'+col);
  assert.equal(val(r,'pg_type'),type);
  assert.equal(val(r,'nullable'),nullable);
  assert.equal(val(r,'linkage'),id);
  assert.equal(val(r,'migration_plan'),'NO_SCHEMA_CHANGE');
  assert.equal(val(r,'approval_state'),'FROZEN');
 }
 assert.equal(byKey.size,31);
 for(const [id,table,col] of excluded){
  const r=rows.find(r=>val(r,'classification')==='EXISTING_EXCLUDED_DO_NOT_ADD'&&val(r,'table_name')===table&&val(r,'column_or_index')===col);
  assert.ok(r,'retired duplicate credentials restored '+table+'.'+col);
  assert.equal(val(r,'approval_state'),'DO_NOT_RESTORE');
 }
 const {sql,stats}=await compileCurrentInitial();
 assert.equal(stats.tables,76);assert.equal(stats.columns,464);assert.equal(stats.staticForeignKeys,137);assert.equal(stats.extraForeignKeys,23);
 for(const [id,table,col,type] of frozen){
  assert.ok(sql.includes('"'+col+'" '+type),'frozen SQL missing '+id+' '+table+'.'+col);
 }
 assert.equal(sql.includes('CREATE TABLE public."pc_auth_sessions"'),false,'new session table already in frozen initial');
 assert.ok(sql.includes('CREATE TABLE public."pc_login_accounts"'));
 assert.ok(sql.includes('CREATE TABLE public."audit_events"'));
 console.log('F03-1-G0 SCHEMA ORIGINAL MATCH PASS: 31 kept; 2 duplicate credentials excluded; 76 tables, 464 columns; 137+23 FKs');
});
test('proposed new version only, no existing field changed or password authority duplicated',()=>{
 const proposals=rows.filter(r=>val(r,'approval_state')==='PROPOSED_A_REVIEW');
 assert.equal(proposals.length,12);
 assert.equal(proposals.filter(r=>val(r,'classification')==='ADD_COLUMN').length,1);
 const newTable=proposals.filter(r=>val(r,'classification')==='CREATE_TABLE_COLUMN');
 assert.equal(newTable.length,9);
 assert.deepEqual(new Set(newTable.map(r=>val(r,'column_or_index'))),new Set(['session_id','account_id','token_digest','credential_epoch','issued_at','expires_at','revoked_at','last_seen_at','restricted']));
 for(const row of proposals){
  assert.match(val(row,'migration_plan'),/NEW_STANDALONE_MIGRATION/);
  assert.equal(val(row,'approval_state'),'PROPOSED_A_REVIEW');
  assert.notEqual(val(row,'column_or_index'),'password_hash','no password replica');
  const old=frozen.find(r=>r[1]===val(row,'table_name')&&r[2]===val(row,'column_or_index'));
  assert.equal(old,undefined,'proposal modifies frozen existing field');
 }
 const epoch=proposals.find(r=>val(r,'table_name')==='pc_login_accounts');
 assert.equal(val(epoch,'column_or_index'),'credential_epoch');
 assert.match(val(epoch,'invariant_or_index'),/DEFAULT 1/);
 const token=newTable.find(r=>val(r,'column_or_index')==='token_digest');
 assert.equal(val(token,'pg_type'),'BYTEA');
 assert.match(val(token,'invariant_or_index'),/32/);
});
test('no production migration, authentication API or physical initial SQL changes performed',async()=>{
 const advice=await readFile(new URL('schema-migration-advice.md',here),'utf8');
 assert.match(advice,/000001_current_initial/);
 assert.match(advice,/事务|transaction/);
 assert.match(advice,/回滚/);
 const password=await readFile(new URL('password-session-design.md',here),'utf8');
 assert.match(password,/pc_login_accounts\.password_hash/);
 assert.match(password,/scrypt/);
 assert.match(password,/Argon2id/);
});
