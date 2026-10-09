// Static parser for a checked-in, A-accepted schema-only SQL artifact.
// No connection, SQL execution, environment variables or network; facts only.
import assert from 'node:assert/strict';
export function physicalTables(sql){
 const tables=new Map();
 const re=/CREATE TABLE public\.([a-z][a-z0-9_]*) \(\n([\s\S]*?)\n\);/g;
 for(const match of sql.matchAll(re)){
  assert.ok(!tables.has(match[1]),'DUPLICATE_SQL_TABLE_'+match[1]);
  const columns=new Set();
  for(const line of match[2].split('\n')){
   const m=/^\s+([a-z][a-z0-9_]*) (?:bigint|boolean|text|integer|timestamp with time zone|jsonb|bytea|date)\b/i.exec(line);
   if(m)columns.add(m[1]);
  }
  tables.set(match[1],columns);
 }
 assert.ok(tables.size>=76,'APPROVED_SQL_NOT_FULL_SCHEMA');
 return tables;
}
export function verifyPhysicalClaims(sql,tsv){
 const physical=physicalTables(sql);
 const rows=tsv.trimEnd().split(/\r?\n/).map(x=>x.split('\t'));
 assert.deepEqual(rows[0],['gap_id','physical_status','tables','verified_columns']);
 assert.equal(rows.length,10,'NINE_PHYSICAL_CLAIMS_REQUIRED');
 const ids=new Set();
 for(const [id,status,tables,fields] of rows.slice(1)){
  assert.ok(/^SG-0[1-9]$/.test(id)&&!ids.has(id),'CLAIM_ID_DUPLICATE_OR_INVALID');
  ids.add(id);
  const names=tables.split(',');
  assert.ok(names.length>0&&names.every(name=>/^[a-z][a-z0-9_]*$/.test(name)));
  if(status==='MISSING_PROPOSAL'){
   assert.equal(fields,'-','MISSING_CLAIM_CANNOT_PROVIDE_VERIFIED_COLUMNS');
   for(const name of names)assert.ok(!physical.has(name),'ALREADY_EXISTS_NOT_GAP_'+id+'_'+name);
  }else if(status==='EXISTING_REUSE'){
   assert.equal(names.length,1,'EXISTING_CLAIM_SINGLE_TABLE');
   const known=physical.get(names[0]);assert.ok(known,'CLAIM_EXISTING_TABLE_MISSING_'+id);
   const cols=fields.split(',');assert.ok(cols.length>0);
   for(const col of cols)assert.ok(known.has(col),'CLAIM_EXISTING_COLUMN_MISSING_'+id+'_'+col);
  }else assert.fail('UNKNOWN_PHYSICAL_CLAIM_STATUS_'+id);
 }
 assert.ok(ids.has('SG-09'),'TEMPLATE_HISTORY_CLAIM_MISSING');
 const row=rows.find(x=>x[0]==='SG-09');
 assert.equal(row[1],'EXISTING_REUSE','TEMPLATE_HISTORY_MUST_REUSE_EXISTING');
 assert.equal(row[2],'role_default_permission_history','TEMPLATE_HISTORY_REAL_TABLE_NAME');
 assert.deepEqual(row[3].split(','),['event_id','role_id','permission_id','enabled','actor_kind','actor_id','occurred_at']);
 return physical;
}
