// F05-7 Rule Dictionary isolated PG16 governance and actual Node HTTP; never production issuer.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,randomBytes} from 'node:crypto';
import {createServer} from 'node:http';
import pg from 'pg';
import {validateCatalogEnv,probeIsolatedCatalog} from '../src/catalog-readiness.mjs';
import {createFoundationHandler} from '../src/app.mjs';
import {createIsolatedDictionaryService} from '../src/f05-matching-dictionary-service.mjs';
import {createIsolatedDictionaryHandler} from '../src/f05-matching-dictionary-http.mjs';
const env=validateCatalogEnv(),pool=new pg.Pool({connectionString:env.connectionString,max:5});
const db=new pg.Client({connectionString:env.connectionString});
const token=randomBytes(32).toString('base64url'),fourS=randomBytes(32).toString('base64url');
const sha=s=>createHash('sha256').update(s).digest('hex'),event=()=>randomBytes(24).toString('base64url');
const base={token:'audi_a6',mappedKey:'brandId',mappedValue:'59001',scopeKind:'global'};
let server,connected=false,failure;
try{
 await db.connect();connected=true;assert.equal(await probeIsolatedCatalog(pool),true);
 await db.query('BEGIN');
 try{
  await db.query("INSERT INTO public.employees(employee_id,main_role_id,employment_status,receiving_status) VALUES (60200,59001,'active','receiving'),(60201,59002,'active','receiving')");
  for(const [credential,id] of [[token,60200],[fourS,60201]])
   await db.query("INSERT INTO public.f05_catalog_employee_sessions_test(token_sha256,employee_id,expires_at) VALUES($1,$2,statement_timestamp()+interval '20 minutes')",[sha(credential),id]);
  await db.query("INSERT INTO public.f05_matching_rule_manage_scope_test(employee_id,can_manage,expires_at) VALUES (60200,true,statement_timestamp()+interval '20 minutes'),(60201,true,statement_timestamp()+interval '20 minutes')");
  await db.query('COMMIT');
 }catch(e){await db.query('ROLLBACK');throw e}
 const service=createIsolatedDictionaryService({pool,env:process.env});
 server=createServer(createFoundationHandler({dictionaryHandler:createIsolatedDictionaryHandler(service,process.env)}));
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const origin='http://127.0.0.1:'+server.address().port+'/api/v1/catalog/matching/rules';
 const post=async (suffix='',data={},credential=token,idem=event())=>{
  const res=await fetch(origin+suffix,{method:'POST',headers:{
   authorization:'Bearer '+credential,'x-idempotency-key':idem,'content-type':'application/json'
  },body:JSON.stringify(data)});return {status:res.status,body:await res.json()};
 };
 let root,brandRule,conflictRule;
 await test('PG16 rule CREATE and exact deterministic preview via real HTTP with no data mutation',async()=>{
  root=await post('',{definition:base});
  assert.equal(root.status,200,JSON.stringify(root));
  assert.equal(root.body.code,'RULE_CREATED');
  const parsed=await post('/test-parse',{text:'audi_a6'});
  assert.equal(parsed.status,200,JSON.stringify(parsed));
  assert.equal(parsed.body.parse.criteria.brandId,'59001');
  assert.equal(parsed.body.parse.ruleHits.length,1);
  assert.equal(parsed.body.noBusinessMutation,true);
 });
 await test('PG16 four-s actor and forged/missing capability fail closed despite test scope',async()=>{
  const denied=await post('',{definition:{...base,token:'four_s_inject'}},fourS);
  assert.equal(denied.status,403,JSON.stringify(denied));
  await db.query("UPDATE public.f05_matching_rule_manage_scope_test SET expires_at=statement_timestamp()-interval '1 second' WHERE employee_id=60200");
  assert.equal((await post('',{definition:{...base,token:'expired_perm'}})).status,403);
  await db.query("UPDATE public.f05_matching_rule_manage_scope_test SET expires_at=statement_timestamp()+interval '20 minutes' WHERE employee_id=60200");
  assert.equal((await post('',{definition:{...base,token:'fake_actor'}} ,'A'.repeat(43))).status,403);
 });
 await test('PG16 more-specific rule overrides global, same-specificity conflict stops preview',async()=>{
  brandRule=await post('',{definition:{...base,scopeKind:'brand',brandId:'59001',mappedValue:'59002'}});
  assert.equal(brandRule.status,200,JSON.stringify(brandRule));
  const specific=await post('/test-parse',{text:'audi_a6',context:{brandId:'59001'}});
  assert.equal(specific.status,200,JSON.stringify(specific));
  assert.equal(specific.body.parse.criteria.brandId,'59002');
  const general=await post('/test-parse',{text:'audi_a6',context:{}});
  assert.equal(general.body.parse.criteria.brandId,'59001');
  conflictRule=await post('',{definition:{...base,scopeKind:'brand',brandId:'59001',mappedValue:'59003'}});
  assert.equal(conflictRule.status,200);
  const conflict=await post('/test-parse',{text:'audi_a6',context:{brandId:'59001'}});
  assert.equal(conflict.status,409);assert.equal(conflict.body.parse.reason,'RULE_PARSE_SCOPE_CONFLICT');
 });
 await test('PG16 mutation version CAS, idempotent replay and disabling conflict restore deterministic parsing',async()=>{
  const id=conflictRule.body.ruleId;
  assert.equal((await post('/'+id,{action:'DISABLE',expectedVersion:99})).status,409);
  const k=event(),a=await post('/'+id,{action:'DISABLE',expectedVersion:1},token,k);
  assert.equal(a.status,200,JSON.stringify(a));
  const replay=await post('/'+id,{action:'DISABLE',expectedVersion:1},token,k);
  assert.equal(replay.body.code,'RULE_MUTATION_REPLAY');
  assert.equal((await post('/'+id,{action:'ENABLE',expectedVersion:2},token,k)).status,409);
  const fresh=await post('/test-parse',{text:'audi_a6',context:{brandId:'59001'}});
  assert.equal(fresh.status,200);assert.equal(fresh.body.parse.criteria.brandId,'59002');
  assert.equal((await db.query("SELECT count(*)::int n FROM public.f05_matching_dictionary_history_test WHERE rule_id=$1",[id])).rows[0].n,2);
 });
 await test('PG16 edit keeps old version immutable in history and formal hard-delete is absent',async()=>{
  const id=brandRule.body.ruleId;
  const changed=await post('/'+id,{action:'EDIT',expectedVersion:1,definition:{...base,scopeKind:'brand',brandId:'59001',mappedValue:'59004',notes:'版本受控'}});
  assert.equal(changed.status,200,JSON.stringify(changed));
  assert.equal(changed.body.version,'2');
  assert.equal((await post('/'+id,{action:'DISABLE',expectedVersion:1})).status,409);
  assert.equal((await post('/test-parse',{text:'audi_a6',context:{brandId:'59001'}})).body.parse.criteria.brandId,'59004');
  await assert.rejects(db.query('DELETE FROM public.f05_matching_dictionary_history_test WHERE rule_id=$1',[id]),e=>e.code==='23514');
 });
 await test('PG16 injected audit failure rolls back rule and can retry same event after recovery',async()=>{
  await db.query("CREATE FUNCTION public.f05_rule_audit_fault() RETURNS trigger LANGUAGE plpgsql AS $f05fault$ BEGIN RAISE EXCEPTION 'INJECTED_RULE_AUDIT_FAILURE'; END $f05fault$");
  await db.query("CREATE TRIGGER f05_rule_audit_fault BEFORE INSERT ON public.f05_matching_dictionary_history_test FOR EACH ROW EXECUTE FUNCTION public.f05_rule_audit_fault()");
  const k=event(),definition={...base,token:'rollback_test'};
  try{
   const first=await post('',{definition},token,k);assert.equal(first.status,503);
   assert.equal((await db.query("SELECT count(*)::int n FROM public.f05_matching_dictionary_rules_test WHERE token='rollback_test'")).rows[0].n,0);
  }finally{
   await db.query('DROP TRIGGER f05_rule_audit_fault ON public.f05_matching_dictionary_history_test');
   await db.query('DROP FUNCTION public.f05_rule_audit_fault()');
  }
  const retried=await post('',{definition},token,k);
  assert.equal(retried.status,200,JSON.stringify(retried));
 });
 await test('PG16 terminal deprecation cannot be reversed; no client grant, priority, or lock side effect',async()=>{
  const id=root.body.ruleId;
  const outcome=await post('/'+id,{action:'DEPRECATE',expectedVersion:1});
  assert.equal(outcome.status,200,JSON.stringify(outcome));
  assert.equal((await post('/'+id,{action:'ENABLE',expectedVersion:2})).status,409);
  assert.equal((await post('/test-parse',{text:'audi_a6',context:{}})).status,409);
  assert.equal((await db.query('SELECT count(*)::int n FROM public.recommendations WHERE customer_id=60200')).rows[0].n,0);
  assert.equal((await db.query('SELECT count(*)::int n FROM public.priority_leases WHERE customer_id=60200')).rows[0].n,0);
  assert.equal((await db.query('SELECT count(*)::int n FROM public.vehicle_visibility_grants WHERE customer_id=60200')).rows[0].n,0);
 });
}catch(e){failure=e}finally{
 if(server)await new Promise(ok=>server.close(ok));
 if(connected)await db.end();await pool.end();
}
if(failure)throw failure;
