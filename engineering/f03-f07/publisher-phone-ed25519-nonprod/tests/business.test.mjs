import assert from 'node:assert/strict';
import {before,after,test} from 'node:test';
import {randomUUID,sign as cryptoSign} from 'node:crypto';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {PublisherPhoneAdminService} from '../../../src/f03-publisher-phone-admin-service.mjs';
import {configurePublisherPhoneAccess} from '../../../f07/publisher-phone-scope-runtime/guard.mjs';
import {ChallengeStore} from '../challenge-store.mjs';
import {issueAssertion} from '../issuer.mjs';
import {verifyAndAuthorize} from '../verifier.mjs';
import {makeEphemeralKeyPair,canonicalPayload,ORIGIN} from '../protocol.mjs';
import {assertEnvironment,assertPhysicalPg16,connectPools,F03_URL} from '../environment.mjs';

let f03,f07,identityF03,identityF07,authF03,authF07,adminToken,salesToken,phoneAdmin,store,keys;
const sql03=(q,p=[])=>f03.query(q,p);
const sql07=(q,p=[])=>f07.query(q,p);
const requestKey=()=>randomUUID().replaceAll('-','');
async function configureMode(mode){
 const current=await phoneAdmin.get({token:adminToken,employeeId:'6'});
 assert.equal(current.status,200,'current F03 phone permission config must be readable');
 const changed=await phoneAdmin.change({token:adminToken,employeeId:'6',method:'PUT',
  input:{scopeMode:mode,expectedVersion:current.version,requestKey:requestKey()}});
 assert.equal(changed.status,200,'F03 current scoped grant must be written through the accepted admin service');
 const scoped=await configurePublisherPhoneAccess({auth:authF07,pool:f07,token:adminToken,
  input:{action:'grant',employee_id:6,scope_mode:mode}});
 assert.equal(scoped.allowed,true,'F07 existing Guard scope must be configured through its accepted path');
 return changed;
}
async function challenge(vehicleId='101',action='vehicle.publisher_phone.latest',employeeId='6',token=salesToken){
 const out=await store.create({employeeId,action,vehicleId,requestId:randomUUID()});
 return out;
}
async function issue(ch){
 const out=await issueAssertion({auth:authF03,token:salesToken,challenge:ch,privateKey:keys.privateKey,kid:keys.kid});
 return out;
}
async function prepared(vehicleId='101',action='vehicle.publisher_phone.latest'){
 const ch=await challenge(vehicleId,action);const signed=await issue(ch);assert.equal(signed.ok,true,signed.code);
 return {ch,assertion:signed.assertion};
}
async function verify(ch,assertion,options={}){
 return verifyAndAuthorize({auth:authF07,pool:f07,challengeStore:store,token:salesToken,challenge:ch,
  assertion,publicKey:keys.publicKey,expectedKid:keys.kid,...options});
}
function resign(payload){
 return {payload,signature:cryptoSign(null,Buffer.from(JSON.stringify(payload),'utf8'),keys.privateKey).toString('base64url')};
}
before(async()=>{
 assertEnvironment();
 ({f03,f07,identityF03,identityF07}=await connectPools());
 authF03=new IsolatedAuth({connectionString:F03_URL,secret:Buffer.from(process.env.F03_1_HMAC_KEY_BASE64,'base64'),origin:'https://127.0.0.1:4318'});
 authF07=new IsolatedAuth({connectionString:F03_URL,secret:Buffer.from(process.env.F03_1_HMAC_KEY_BASE64,'base64'),origin:'https://127.0.0.1:4317'});
 const a=await authF07.login({login:'admin_test',password:'SyntheticAdmin_1234567',source:'ed25519-admin'});
 const e=await authF07.login({login:'race_test',password:'SyntheticRace_1234567',source:'ed25519-employee'});
 assert.equal(a.code,'AUTH_OK');assert.equal(e.code,'AUTH_OK');adminToken=a.token;salesToken=e.token;
 phoneAdmin=new PublisherPhoneAdminService(authF03);store=new ChallengeStore(f07);keys=makeEphemeralKeyPair();
 await configureMode('LOCKED_ONLY');
});
after(async()=>{
 await Promise.all([authF03?.close(),authF07?.close(),f03?.end(),f07?.end()].filter(Boolean));
});
test('B01 exact task environment and two physically separate non-superuser PG16 databases',async()=>{
 assert.equal(identityF03.db,'f03_auth_test');assert.equal(identityF03.user,'f03_ci');assert.equal(identityF03.superuser,false);
 assert.equal(identityF07.db,'f07_runtime_test');assert.equal(identityF07.user,'f07_runtime_ci');assert.equal(identityF07.superuser,false);
 assert.notEqual(identityF03.databaseOid,identityF07.databaseOid);
 assert.equal((await assertPhysicalPg16(f03,'F03')).version>=160000,true);
 assert.equal((await assertPhysicalPg16(f07,'F07')).version<170000,true);
});
test('B02 current F03 session signs and F07 verifies then invokes existing Guard for locked active JYT wholesale',async()=>{
 const {ch,assertion}=await prepared();const out=await verify(ch,assertion);
 assert.deepEqual({ok:out.ok,allowed:out.allowed,code:out.code,origin:out.origin},
  {ok:true,allowed:true,code:'PUBLISHER_PHONE_ALLOWED',origin:ORIGIN});
 assert.equal(out.vehicleId,'101');assert.equal(out.scopeMode,'LOCKED_ONLY');
});
test('B03 signed payload is strictly scoped and explicitly non-production',async()=>{
 const {ch,assertion}=await prepared();
 assert.equal(assertion.payload.origin,'CI_SYNTHETIC_ONLY');assert.equal(assertion.payload.formalSourceSigned,false);
 assert.equal(assertion.payload.productionReady,false);assert.equal(assertion.payload.capability,'publisher.phone.sensitive');
 assert.equal(assertion.payload.employeeId,'6');assert.equal(assertion.payload.vehicleId,ch.vehicleId);
 assert.equal(assertion.payload.nonce,ch.nonce);assert.ok(assertion.payload.exp-assertion.payload.iat<=15);
 assert.equal(Object.hasOwn(assertion.payload,'phone'),false);assert.equal(Object.hasOwn(assertion.payload,'token'),false);
});
test('B04 LOCKED_ONLY rejects current active JYT wholesale vehicle without a current lock',async()=>{
 const {ch,assertion}=await prepared('102');const out=await verify(ch,assertion);
 assert.equal(out.allowed,false);assert.equal(out.code,'CURRENT_LOCK_REQUIRED');
});
test('B05 ALL_ACTIVE_JYT allows current active JYT wholesale vehicle without a lock',async()=>{
 await configureMode('ALL_ACTIVE_JYT');
 const {ch,assertion}=await prepared('102');const out=await verify(ch,assertion);
 assert.equal(out.allowed,true);assert.equal(out.code,'PUBLISHER_PHONE_ALLOWED');assert.equal(out.scopeMode,'ALL_ACTIVE_JYT');
 await configureMode('LOCKED_ONLY');
});
test('B06 ALL_ACTIVE_JYT still rejects non-JYT, non-wholesale and inactive vehicles',async()=>{
 await configureMode('ALL_ACTIVE_JYT');
 for(const [vehicleId,code] of [['107','CURRENT_WHOLESALE_JYT_REQUIRED'],['108','CURRENT_WHOLESALE_JYT_REQUIRED'],
  ['109','CURRENT_WHOLESALE_JYT_REQUIRED'],['110','CURRENT_WHOLESALE_JYT_REQUIRED'],['111','PUBLISHER_MAPPING_SOURCE_GAP']]){
  const {ch,assertion}=await prepared(vehicleId);const out=await verify(ch,assertion);
  assert.equal(out.allowed,false,vehicleId);assert.equal(out.code,code,vehicleId);
 }
 await configureMode('LOCKED_ONLY');
});
test('B07 expired, requested, cancelled and old-cycle-only locks do not authorize',async()=>{
 for(const vehicleId of ['103','104','105','106']){
  const {ch,assertion}=await prepared(vehicleId);const out=await verify(ch,assertion);
  assert.equal(out.allowed,false,vehicleId);assert.equal(out.code,'CURRENT_LOCK_REQUIRED',vehicleId);
 }
});
test('B08 F03 personal deny blocks new signature despite F07 scope being enabled',async()=>{
 await sql03("UPDATE public.employee_permission_overrides SET decision='deny',changed_at=transaction_timestamp() WHERE employee_id=6 AND permission_id=13");
 try{const ch=await challenge();const out=await issue(ch);assert.equal(out.ok,false);assert.equal(out.code,'CURRENT_PERSONAL_DENY')}
 finally{await sql03("UPDATE public.employee_permission_overrides SET decision='allow',changed_at=transaction_timestamp() WHERE employee_id=6 AND permission_id=13")}
});
test('B09 ended publisher_phone_special Scope binding blocks issuance',async()=>{
 const q=await sql03("SELECT scope_id::text id FROM public.employee_capability_scope_bindings WHERE employee_id=6 AND permission_id=13 AND ended_at IS NULL");
 assert.equal(q.rowCount,1);
 await sql03("UPDATE public.employee_capability_scope_bindings SET ended_at=transaction_timestamp() WHERE scope_id=$1::bigint",[q.rows[0].id]);
 try{const out=await issue(await challenge());assert.equal(out.ok,false);assert.equal(out.code,'CURRENT_SCOPE_BINDING_REQUIRED')}
 finally{await sql03("UPDATE public.employee_capability_scope_bindings SET ended_at=NULL WHERE scope_id=$1::bigint",[q.rows[0].id])}
});
test('B10 disabled F03 employee-mode grant is fail-closed',async()=>{
 await sql03("UPDATE f03_publisher_phone_admin_test.employee_mode SET enabled=false WHERE employee_id=6");
 try{const out=await issue(await challenge());assert.equal(out.ok,false);assert.equal(out.code,'CURRENT_PHONE_PERMISSION_CONFIG_NOT_ENABLED')}
 finally{await sql03("UPDATE f03_publisher_phone_admin_test.employee_mode SET enabled=true WHERE employee_id=6")}
});
test('B11 changed current role snapshot prevents signing',async()=>{
 await sql03("UPDATE public.employees SET main_role_id=3 WHERE employee_id=6");
 try{const out=await issue(await challenge());assert.equal(out.ok,false);assert.equal(out.code,'CURRENT_EMPLOYEE_FACTS_CHANGED')}
 finally{await sql03("UPDATE public.employees SET main_role_id=1 WHERE employee_id=6")}
});
test('B12 changed store fact prevents signing',async()=>{
 await sql03("INSERT INTO public.stores(store_id,store_name,status) VALUES (2,'CI synthetic second store','active') ON CONFLICT(store_id) DO NOTHING");
 await sql03("UPDATE public.employees SET store_id=2 WHERE employee_id=6");
 try{const out=await issue(await challenge());assert.equal(out.ok,false);assert.equal(out.code,'CURRENT_EMPLOYEE_FACTS_CHANGED')}
 finally{await sql03("UPDATE public.employees SET store_id=1 WHERE employee_id=6")}
});
test('B13 system admin cannot receive employee phone assertion',async()=>{
 const ch=await challenge('101','vehicle.publisher_phone.latest','6',adminToken);
 const out=await issueAssertion({auth:authF03,token:adminToken,challenge:ch,privateKey:keys.privateKey,kid:keys.kid});
 assert.equal(out.ok,false);
});
test('B14 malformed challenge with extra fields or unsupported action is denied',async()=>{
 const ch=await challenge();
 assert.equal((await issueAssertion({auth:authF03,token:salesToken,challenge:{...ch,extra:'no'},privateKey:keys.privateKey,kid:keys.kid})).code,'ASSERTION_INPUT_INVALID');
 assert.equal((await issueAssertion({auth:authF03,token:salesToken,challenge:{...ch,action:'admin.anything'},privateKey:keys.privateKey,kid:keys.kid})).code,'ASSERTION_INPUT_INVALID');
});
test('B15 altered signature fails Ed25519 verification',async()=>{
 const {ch,assertion}=await prepared();const bad={...assertion,signature:(assertion.signature.startsWith('A')?'B':'A')+assertion.signature.slice(1)};
 const out=await verify(ch,bad);assert.equal(out.allowed,false);assert.equal(out.code,'ASSERTION_SIGNATURE_INVALID');
});
test('B16 wrong ephemeral public key is rejected',async()=>{
 const {ch,assertion}=await prepared();const other=makeEphemeralKeyPair();
 const out=await verify(ch,assertion,{publicKey:other.publicKey});assert.equal(out.allowed,false);assert.equal(out.code,'ASSERTION_SIGNATURE_INVALID');
});
test('B17 wrong key id is rejected before Guard',async()=>{
 const {ch,assertion}=await prepared();const out=await verify(ch,assertion,{expectedKid:'000000000000000000000000'});
 assert.equal(out.allowed,false);assert.equal(out.code,'ASSERTION_KID_MISMATCH');
});
test('B18 altered request binding remains denied even if altered payload is correctly re-signed',async()=>{
 const {ch,assertion}=await prepared();const payload={...assertion.payload,requestId:randomUUID()};
 const out=await verify(ch,resign(payload));assert.equal(out.allowed,false);assert.equal(out.code,'ASSERTION_OR_BINDING_INVALID');
});
test('B19 altered vehicle/action/employee/nonce binding remains denied',async()=>{
 const {ch,assertion}=await prepared();
 for(const payload of [
  {...assertion.payload,vehicleId:'102'},
  {...assertion.payload,action:'vehicle.publisher_phone.dial'},
  {...assertion.payload,employeeId:'7'},
  {...assertion.payload,nonce:'A'.repeat(43)}
 ]){const out=await verify(ch,resign(payload));assert.equal(out.allowed,false);assert.equal(out.code,'ASSERTION_OR_BINDING_INVALID')}
});
test('B20 unknown payload fields and wrong issuer/audience are rejected',async()=>{
 const {ch,assertion}=await prepared();
 for(const payload of [
  {...assertion.payload,unexpected:'extra'},
  {...assertion.payload,issuer:'attacker'},
  {...assertion.payload,audience:'another-service'},
  {...assertion.payload,formalSourceSigned:true},
  {...assertion.payload,productionReady:true}
 ]){const out=await verify(ch,resign(payload));assert.equal(out.allowed,false);assert.equal(out.code,'ASSERTION_OR_BINDING_INVALID')}
});
test('B21 future-issued and overlong-TTL correctly signed assertions fail',async()=>{
 const {ch,assertion}=await prepared();const now=Math.floor(Date.now()/1000);
 const future=resign({...assertion.payload,iat:now+20,exp:now+25});
 assert.equal((await verify(ch,future)).code,'ASSERTION_TIME_INVALID');
 const long=resign({...assertion.payload,iat:now,exp:now+16});
 assert.equal((await verify(ch,long)).code,'ASSERTION_TIME_INVALID');
});
test('B22 expired assertion fails without consuming challenge',async()=>{
 const {ch,assertion}=await prepared();const out=await verify(ch,assertion,{now:Date.now()+30000});
 assert.equal(out.allowed,false);assert.equal(out.code,'ASSERTION_TIME_INVALID');
 const row=await sql07("SELECT consumed_at FROM f03_f07_phone_ed25519_nonprod.challenges WHERE challenge_id=$1::uuid",[ch.challengeId]);
 assert.equal(row.rows[0].consumed_at,null);
});
test('B23 same assertion can consume a challenge only once',async()=>{
 const {ch,assertion}=await prepared();const first=await verify(ch,assertion);const second=await verify(ch,assertion);
 assert.equal(first.allowed,true);assert.equal(second.allowed,false);assert.equal(second.code,'CHALLENGE_REPLAYED_OR_EXPIRED');
});
test('B24 real concurrent challenge replay has exactly one atomic consumer',async()=>{
 const {ch,assertion}=await prepared();
 const [a,b]=await Promise.all([verify(ch,assertion),verify(ch,assertion)]);
 assert.equal([a,b].filter(x=>x.allowed===true).length,1);
 assert.equal([a,b].filter(x=>x.code==='CHALLENGE_REPLAYED_OR_EXPIRED').length,1);
});
test('B25 F07 mode change between signature and Guard is detected after fresh Guard recheck',async()=>{
 const {ch,assertion}=await prepared('102');
 await configurePublisherPhoneAccess({auth:authF07,pool:f07,token:adminToken,
  input:{action:'grant',employee_id:6,scope_mode:'ALL_ACTIVE_JYT'}});
 const out=await verify(ch,assertion);
 assert.equal(out.allowed,false);assert.equal(out.code,'SIGNED_CONTEXT_CHANGED');
 await configureMode('LOCKED_ONLY');
});
test('B26 F07 Guard rechecks current vehicle state after assertion issuance',async()=>{
 const {ch,assertion}=await prepared('101');
 await sql07("UPDATE f07_runtime.publisher_phone_vehicles SET listing_status='inactive' WHERE vehicle_id=101 AND listing_cycle_id=1001");
 try{const out=await verify(ch,assertion);assert.equal(out.allowed,false);assert.equal(out.code,'CURRENT_WHOLESALE_JYT_REQUIRED')}
 finally{await sql07("UPDATE f07_runtime.publisher_phone_vehicles SET listing_status='active' WHERE vehicle_id=101 AND listing_cycle_id=1001")}
});
test('B27 current F03 personal deny after signature still wins in existing F07 Guard',async()=>{
 const {ch,assertion}=await prepared();
 await sql03("UPDATE public.employee_permission_overrides SET decision='deny',changed_at=transaction_timestamp() WHERE employee_id=6 AND permission_id=13");
 try{const out=await verify(ch,assertion);assert.equal(out.allowed,false);assert.equal(out.code,'CURRENT_PERSONAL_DENY')}
 finally{await sql03("UPDATE public.employee_permission_overrides SET decision='allow',changed_at=transaction_timestamp() WHERE employee_id=6 AND permission_id=13")}
});
test('B28 unavailable F03 facts and unavailable F07 challenge store fail closed',async()=>{
 const ch=await challenge();const noF03={withSession:async()=>{throw Error('synthetic DB down')}};
 const signed=await issueAssertion({auth:noF03,token:salesToken,challenge:ch,privateKey:keys.privateKey,kid:keys.kid});
 assert.equal(signed.ok,false);assert.equal(signed.code,'F03_CURRENT_FACTS_UNAVAILABLE');
 const {ch:ch2,assertion}=await prepared();
 const out=await verify(ch2,assertion,{challengeStore:{consume:async()=>{throw Error('synthetic F07 DB down')}}});
 assert.equal(out.allowed,false);assert.equal(out.code,'CHALLENGE_STORE_UNAVAILABLE');
});
test('B29 successful and denied decisions write only safe audit metadata',async()=>{
 const {ch,assertion}=await prepared();const out=await verify(ch,assertion);assert.equal(out.allowed,true);
 const audit=await store.record({requestId:ch.requestId,challengeId:ch.challengeId,employeeId:ch.employeeId,
  action:ch.action,vehicleId:ch.vehicleId,stage:'F07_GUARD',decisionCode:out.code,allowed:out.allowed});
 assert.match(audit,/^[1-9][0-9]*$/);
 const cols=await sql07("SELECT column_name FROM information_schema.columns WHERE table_schema='f03_f07_phone_ed25519_nonprod' AND table_name='decision_audit'");
 const names=cols.rows.map(x=>x.column_name);
 assert.equal(names.some(x=>/phone|token|private|nonce|signature|password/i.test(x)),false);
 const row=await sql07("SELECT allowed,origin,decision_code FROM f03_f07_phone_ed25519_nonprod.decision_audit WHERE audit_id=$1::bigint",[audit]);
 assert.equal(row.rows[0].allowed,true);assert.equal(row.rows[0].origin,ORIGIN);
});
test('B31 role changes after signing are rejected even if the broad F07 role set still allows Guard',async()=>{
 const {ch,assertion}=await prepared();
 await sql03("UPDATE public.employees SET main_role_id=3 WHERE employee_id=6");
 try{const out=await verify(ch,assertion);assert.equal(out.allowed,false);assert.equal(out.code,'CURRENT_EMPLOYEE_FACTS_CHANGED')}
 finally{await sql03("UPDATE public.employees SET main_role_id=1 WHERE employee_id=6")}
});
test('B32 same-allow revoke/regrant changes exact Scope binding and invalidates old assertion',async()=>{
 const {ch,assertion}=await prepared();
 const out=await configurePublisherPhoneAccess({auth:authF07,pool:f07,token:adminToken,
  input:{action:'grant',employee_id:6,scope_mode:'LOCKED_ONLY'}});
 assert.equal(out.allowed,true);
 const checked=await verify(ch,assertion);assert.equal(checked.allowed,false);
 assert.equal(checked.code,'F03_FACTS_CHANGED_AFTER_SIGNATURE');
});
test('B30 post-grant employee lifecycle audit invalidates issuance',async()=>{
 await sql03("INSERT INTO public.audit_events(actor_kind,actor_id,role_context,object_kind,object_id,action,before_json,after_json,occurred_at) "+
  "VALUES('system_admin','9','{}'::jsonb,'employee','6','synthetic.employee.lifecycle.changed','{}'::jsonb,'{}'::jsonb,transaction_timestamp())");
 const out=await issue(await challenge());assert.equal(out.ok,false);assert.equal(out.code,'CURRENT_EMPLOYEE_LIFECYCLE_CHANGED');
});
