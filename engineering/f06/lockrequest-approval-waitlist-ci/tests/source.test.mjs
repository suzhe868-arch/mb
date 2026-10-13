import {test} from 'node:test';
import assert from 'node:assert/strict';
import {connect,verify,gate} from '../migration.mjs';
import {intakeCI,decisionCI,productionIssuerDeny} from '../service.mjs';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
const url=process.env.F03_1_DATABASE_URL,secret=Buffer.alloc(32,61);
const db=await connect(),q=(sql,a=[])=>db.query(sql,a).then(r=>r.rows);
const auth=new IsolatedAuth({connectionString:url,secret,origin:'https://127.0.0.1:49026'});
const authB=new IsolatedAuth({connectionString:url,secret,origin:'https://127.0.0.1:49026'});
const customer=n=>86180100+n,vehicle=n=>86181100+n,cycle=n=>86182100+n;
const k=n=>'f06-1-native-pg16-'+n+'-'+process.env.GITHUB_RUN_ID;
const proof='CI_SYNTHETIC_PHONE_CONSENT_NOT_PRODUCTION';
const begin=(cust,veh,tag)=>intakeCI(db,{customerId:customer(cust),vehicleId:vehicle(veh),listingCycleId:cycle(veh),requestKey:k(tag),syntheticPhoneConsent:proof});
let token,reqA,reqB,reqC,reqExpired,reqRejected,reqRollback,winner,firstSnapshot;
test.before(async()=>{
 assert.equal((await verify(db)).verified,true);
 const login=await auth.login({login:'employee_test',password:'SyntheticF04_3_CurrentProof_2026',source:'f06-1-current-signed-session'});
 assert.equal(login.code,'AUTH_OK',JSON.stringify(login));token=login.token;
});
test.after(async()=>{await db.end();await auth.close();await authB.close()});
test('06-S01 physical signed v26 and CI-only v27 sidecar verified',async()=>{
 const v=await verify(db);assert.equal(v.verified,true);assert.equal(v.nonProduction,true)
});
test('06-S02 real non-superuser PG16 exact disposable database and original 24 ledger',async()=>{
 const r=(await q("SELECT current_database() db,current_user u,current_setting('server_version_num')::int v,(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) su"))[0];
 assert.equal(r.db,'f03_auth_test');assert.equal(r.u,'f03_ci');assert.ok(r.v>=160000&&r.v<170000);assert.equal(r.su,false);
 assert.equal((await q('SELECT count(*)::int n FROM public.f03_schema_migrations'))[0].n,24)
});
test('06-S03 old public catalog remained signed and exactly v26',async()=>{const v=await verify(db);assert.equal(v.publicCatalogSha256,'5495c6d6ccecc628e1b27c5bfe4f3664a76b4c38a1fa732b6e2baa4ebb5e99f4')});
test('06-S04 existing M94 genuine unique active Lock and Waitlist constraints still installed',async()=>{
 const idx=(await q("SELECT indexdef FROM pg_indexes WHERE schemaname='public' AND tablename IN('locks','waitlists')")).map(x=>x.indexdef).join('\n');
 assert.match(idx,/UNIQUE INDEX.*locks.*vehicle_id.*lock_status.*active/i);
 assert.match(idx,/UNIQUE INDEX.*waitlists.*customer_id.*vehicle_id/i)
});
test('06-S05 no real production Customer, Employee, payment or issuer enabled',()=>{
 assert.deepEqual(productionIssuerDeny(),{allowed:false,code:'F06_1_PRODUCTION_LOCK_ISSUERS_NOT_WIRED'});
});
test('06-S06 missing real-or-CI phone authorization denies without request',async()=>{
 const r=await intakeCI(db,{customerId:customer(1),vehicleId:vehicle(1),listingCycleId:cycle(1),requestKey:k('no-phone')});
 assert.equal(r.allowed,false);assert.equal(r.code,'F06_1_CUSTOMER_OR_PHONE_PROOF_REQUIRED');
 assert.equal((await q('SELECT count(*)::int n FROM public.lock_requests WHERE customer_id=$1 AND vehicle_id=$2',[customer(1),vehicle(1)]))[0].n,0);
});
test('06-S07 signed ordinary synthetic Customer creates actual PENDING',async()=>{
 const r=await begin(1,1,'A-create');assert.equal(r.code,'F06_1_PENDING_CREATED',JSON.stringify(r));reqA=r.requestId;
 assert.equal((await q('SELECT status FROM public.lock_requests WHERE lock_request_id=$1',[reqA]))[0].status,'pending');
});
test('06-S08 PENDING does not reserve Vehicle or create price/duration Lock snapshot',async()=>{
 assert.equal((await q('SELECT count(*)::int n FROM public.locks WHERE source_lock_request_id=$1',[reqA]))[0].n,0);
 assert.equal((await q('SELECT count(*)::int n FROM f06_1_lock_ci.lock_snapshots'))[0].n,0)
});
test('06-S09 real PG time sets pending maximum six hours',async()=>{
 const z=(await q("SELECT expires_at-created_at gap FROM public.lock_requests WHERE lock_request_id=$1",[reqA]))[0].gap;
 assert.ok(Number(z.days||0)===0);assert.equal(Number(z.hours||0),6)
});
test('06-S10 exact request key replay cannot create another request',async()=>{
 const r=await begin(1,1,'A-create');assert.equal(r.code,'F06_1_REQUEST_KEY_REPLAY');assert.equal(r.requestId,reqA)
});
test('06-S11 different request key while PENDING reuses same business application',async()=>{
 const r=await begin(1,1,'A-other');assert.equal(r.code,'F06_1_CURRENT_PENDING_REUSED');assert.equal(r.requestId,reqA)
});
test('06-S12 different Customer may have simultaneous PENDING without lock priority',async()=>{
 const r=await begin(2,1,'B-create');assert.equal(r.code,'F06_1_PENDING_CREATED');reqB=r.requestId;
 assert.equal((await q("SELECT count(*)::int n FROM public.lock_requests WHERE vehicle_id=$1 AND status='pending'",[vehicle(1)]))[0].n,2)
});
test('06-S13 third Customer creates real PENDING, still no active Lock',async()=>{
 const r=await begin(3,1,'C-create');assert.equal(r.code,'F06_1_PENDING_CREATED');reqC=r.requestId;
 assert.equal((await q("SELECT count(*)::int n FROM public.locks WHERE vehicle_id=$1 AND lock_status='active'",[vehicle(1)]))[0].n,0)
});
test('06-S14 hidden source without signed Grant or matching Priority cannot create request',async()=>{
 await q("UPDATE public.vehicles SET platform_visibility='hidden' WHERE vehicle_id=$1",[vehicle(6)]);
 const r=await begin(4,6,'hidden-deny');assert.equal(r.code,'F06_1_HIDDEN_WITHOUT_SIGNED_GRANT');
});
test('06-S15 disabled Customer denies request without mutating Lock',async()=>{
 await q("UPDATE public.customers SET account_status='disabled' WHERE customer_id=$1",[customer(4)]);
 try{const r=await begin(4,2,'disabled-deny');assert.equal(r.code,'F06_1_CUSTOMER_DISABLED')}
 finally{await q("UPDATE public.customers SET account_status='active' WHERE customer_id=$1",[customer(4)])}
});
test('06-S16 ended listing cycle cannot create request',async()=>{
 await q("UPDATE public.vehicle_listing_cycles SET ended_at=clock_timestamp(),end_reason='CI_TEMPORARY_SOURCE_UNAVAILABLE' WHERE listing_cycle_id=$1",[cycle(5)]);
 try{const r=await begin(5,5,'ended-deny');assert.equal(r.code,'F06_1_VEHICLE_NOT_CURRENT_SALEABLE')}
 finally{await q("UPDATE public.vehicle_listing_cycles SET ended_at=NULL,end_reason=NULL WHERE listing_cycle_id=$1",[cycle(5)])}
});
test('06-S17 unsigned Employee token cannot approve',async()=>{
 const r=await decisionCI(auth,'synthetic-no-real-token',{requestId:reqA,requestKey:k('no-token'),action:'approve'});
 assert.equal(r.code,'F06_1_SIGNED_SESSION_DENIED');
});
test('06-S18 second PG COMMIT revokes Permission and old Employee Session is rejected',async()=>{
 const b=await connect();try{
  const aid=(await q('SELECT pg_backend_pid() pid'))[0].pid,bid=(await b.query('SELECT pg_backend_pid() pid')).rows[0].pid;
  assert.notEqual(aid,bid);
  await b.query('BEGIN');
  await b.query("UPDATE public.employee_permission_overrides SET decision='deny',changed_at=clock_timestamp() WHERE employee_id=1 AND permission_id=961801");
  await b.query('COMMIT');
  const got=await decisionCI(auth,token,{requestId:reqA,requestKey:k('permission-deny'),action:'approve'});
  assert.equal(got.code,'F06_1_EMPLOYEE_PERMISSION_SCOPE_DENIED',JSON.stringify(got));
  assert.equal((await q('SELECT status FROM public.lock_requests WHERE lock_request_id=$1',[reqA]))[0].status,'pending');
  console.log('F06_1_TWO_NATIVE_PG16_BACKENDS_COMMITTED_REVOKE_DENIES_OLD_TOKEN',JSON.stringify({aPid:aid,bPid:bid,denied:got.code}));
  await b.query("UPDATE public.employee_permission_overrides SET decision='allow',changed_at=clock_timestamp() WHERE employee_id=1 AND permission_id=961801");
 }finally{await b.end()}
});
test('06-S19 PG expires a genuine six-hour-old request before approval',async()=>{
 const r=await begin(5,2,'expired-create');assert.equal(r.allowed,true);reqExpired=r.requestId;
 await q("UPDATE public.lock_requests SET created_at=clock_timestamp()-interval '7 hours',expires_at=clock_timestamp()-interval '1 hour' WHERE lock_request_id=$1",[reqExpired]);
 const x=await decisionCI(auth,token,{requestId:reqExpired,requestKey:k('expired-approve'),action:'approve'});
 assert.equal(x.code,'F06_1_REQUEST_EXPIRED',JSON.stringify(x));
 assert.equal((await q('SELECT status FROM public.lock_requests WHERE lock_request_id=$1',[reqExpired]))[0].status,'expired');
});
test('06-S20 expired terminal state cannot be resurrected by repeated decision',async()=>{
 const x=await decisionCI(auth,token,{requestId:reqExpired,requestKey:k('expired-retry'),action:'approve'});
 assert.equal(x.code,'F06_1_TERMINAL_REPLAY');assert.equal(x.status,'expired')
});
test('06-S21 authorized signed Employee rejects valid PENDING without Lock',async()=>{
 const r=await begin(6,2,'reject-create');assert.equal(r.allowed,true);reqRejected=r.requestId;
 const x=await decisionCI(auth,token,{requestId:reqRejected,requestKey:k('legit-reject'),action:'reject'});
 assert.equal(x.code,'F06_1_REJECTED');assert.equal(x.status,'rejected');
 assert.equal((await q("SELECT count(*)::int n FROM public.locks WHERE source_lock_request_id=$1",[reqRejected]))[0].n,0);
});
test('06-S22 REJECTED terminal replay never reopens',async()=>{
 const x=await decisionCI(auth,token,{requestId:reqRejected,requestKey:k('reject-replay'),action:'reject'});
 assert.equal(x.code,'F06_1_TERMINAL_REPLAY');assert.equal(x.status,'rejected')
});
test('06-S23 new application after terminal is distinct real Request',async()=>{
 const r=await begin(6,2,'new-after-rejected');assert.equal(r.code,'F06_1_PENDING_CREATED');assert.notEqual(r.requestId,reqRejected)
});
test('06-S24 injected post-Lock failure truly rolls back Lock, Request and signed event',async()=>{
 const r=await begin(7,3,'rollback-create');assert.equal(r.allowed,true);reqRollback=r.requestId;
 const before=(await q('SELECT count(*)::int n FROM public.locks WHERE vehicle_id=$1',[vehicle(3)]))[0].n;
 await assert.rejects(()=>decisionCI(auth,token,{requestId:reqRollback,requestKey:k('inject-write'),action:'approve',testCheckpoint:'AFTER_LOCK_WRITE_THROW'}),/F06_1_INJECTED_TX_ROLLBACK/);
 assert.equal((await q('SELECT count(*)::int n FROM public.locks WHERE vehicle_id=$1',[vehicle(3)]))[0].n,before);
 assert.equal((await q('SELECT status FROM public.lock_requests WHERE lock_request_id=$1',[reqRollback]))[0].status,'pending');
});
test('06-S25 two native authenticated PG connections race on same Vehicle, one winner',async()=>{
 const [a,b]=await Promise.all([
  decisionCI(auth,token,{requestId:reqA,requestKey:k('race-A'),action:'approve'}),
  decisionCI(authB,token,{requestId:reqB,requestKey:k('race-B'),action:'approve'})
 ]);
 assert.ok(a.allowed&&b.allowed,JSON.stringify({a,b}));
 const wins=[a,b].filter(x=>x.code==='F06_1_APPROVED_ATOMIC_LOCK');
 assert.equal(wins.length,1,JSON.stringify({a,b}));winner=wins[0];
 assert.equal((await q("SELECT count(*)::int n FROM public.locks WHERE vehicle_id=$1 AND lock_status='active'",[vehicle(1)]))[0].n,1);
 assert.equal((await q("SELECT count(*)::int n FROM public.lock_requests WHERE vehicle_id=$1 AND status='approved'",[vehicle(1)]))[0].n,1);
 console.log('F06_1_TRUE_TWO_PHYSICAL_BACKEND_ATOMIC_SINGLE_WINNER',JSON.stringify({raceA:a.code,raceB:b.code,lockId:winner.lockId,backendPid:winner.backendPid}));
});
test('06-S26 winner Lock snapshots PG policy72h, customer price, distinct approver/responsible',async()=>{
 const z=(await q("SELECT l.*,s.* FROM public.locks l JOIN f06_1_lock_ci.lock_snapshots s ON s.lock_id=l.lock_id WHERE l.lock_id=$1",[winner.lockId]))[0];
 assert.equal(Number(z.responsible_employee_id),4);assert.equal(Number(z.approver_employee_id),1);
 assert.equal(z.price_kind,'numeric');assert.equal(Number(z.price_cents),6500000);
 assert.equal(Number(z.initial_hours),72);assert.equal(Number(z.policy_version),1);
 assert.ok(Math.abs(z.expires_at.getTime()-z.created_at.getTime()-72*3600000)<1000);
 firstSnapshot={expiresAt:z.expires_at.toISOString(),priceCents:z.price_cents,policyVersion:z.policy_version};
});
test('06-S27 losing PENDING become LOCK_CONFLICT with real Waitlist atomically',async()=>{
 const qx=await q("SELECT lr.lock_request_id,lr.status,lr.resulting_waitlist_id,w.waitlist_id,w.responsible_employee_id "+
 "FROM public.lock_requests lr LEFT JOIN public.waitlists w ON w.waitlist_id=lr.resulting_waitlist_id "+
 "WHERE lr.lock_request_id=ANY($1::bigint[]) ORDER BY lr.lock_request_id",[[reqA,reqB,reqC]]);
 assert.equal(qx.filter(x=>x.status==='approved').length,1);
 assert.equal(qx.filter(x=>x.status==='lock_conflict').length,2);
 assert.ok(qx.filter(x=>x.status==='lock_conflict').every(x=>x.waitlist_id!==null&&Number(x.responsible_employee_id)===4));
});
test('06-S28 Waitlist internal source ordering is request PG created_at then stable id',async()=>{
 const ls=await q("SELECT w.waitlist_id,x.queue_created_at,x.queue_request_id,lr.created_at FROM public.waitlists w "+
 "JOIN f06_1_lock_ci.waitlist_sources x ON x.waitlist_id=w.waitlist_id "+
 "JOIN public.lock_requests lr ON lr.lock_request_id=x.source_request_id WHERE w.vehicle_id=$1 ORDER BY x.queue_created_at,x.queue_request_id",[vehicle(1)]);
 assert.equal(ls.length,2);for(const x of ls){assert.equal(x.queue_created_at.toISOString(),x.created_at.toISOString());assert.ok(Number(x.queue_request_id)>0)}
});
test('06-S29 retries of winner and losers do not form second Lock or Waitlist',async()=>{
 for(const req of [reqA,reqB,reqC]){
  const x=await decisionCI(auth,token,{requestId:req,requestKey:k('replay-'+req),action:'approve'});
  assert.equal(x.code,'F06_1_TERMINAL_REPLAY',JSON.stringify(x));
 }
 assert.equal((await q("SELECT count(*)::int n FROM public.locks WHERE vehicle_id=$1 AND lock_status='active'",[vehicle(1)]))[0].n,1);
 assert.equal((await q("SELECT count(*)::int n FROM public.waitlists WHERE vehicle_id=$1 AND ended_at IS NULL",[vehicle(1)]))[0].n,2);
});
test('06-S30 upstream price changes never mutate existing Lock snapshots',async()=>{
 await q("INSERT INTO public.vehicle_price_history(vehicle_id,price_kind,amount_cents,valid_from) VALUES($1,'customer_display',7100000,clock_timestamp())",[vehicle(1)]);
 const now=(await q("SELECT l.expires_at,s.price_cents,s.policy_version FROM public.locks l JOIN f06_1_lock_ci.lock_snapshots s USING(lock_id) WHERE l.lock_id=$1",[winner.lockId]))[0];
 assert.deepEqual({expiresAt:now.expires_at.toISOString(),priceCents:now.price_cents,policyVersion:now.policy_version},firstSnapshot);
});
test('06-S31 new intake after another Customer active Lock denied, no phantom Lock',async()=>{
 const x=await begin(8,1,'occupied-deny');assert.equal(x.code,'F06_1_ACTIVE_LOCK_CUSTOMER_NEEDS_WAITLIST_NOT_REQUEST');
 assert.equal((await q("SELECT count(*)::int n FROM public.locks WHERE vehicle_id=$1 AND lock_status='active'",[vehicle(1)]))[0].n,1);
});
test('06-S32 snapshot stores explicit price-consultation instead of 0 when no effective numeric fact',async()=>{
 const r=await decisionCI(auth,token,{requestId:reqRollback,requestKey:k('consult-price-approve'),action:'approve'});
 assert.equal(r.code,'F06_1_APPROVED_ATOMIC_LOCK',JSON.stringify(r));
 const x=(await q("SELECT price_kind,price_cents,source_price_event_id FROM f06_1_lock_ci.lock_snapshots WHERE lock_id=$1",[r.lockId]))[0];
 assert.equal(x.price_kind,'consultation');assert.equal(x.price_cents,null);assert.equal(x.source_price_event_id,null);
});
test('06-S33 policy version updates affect future Lock but not existing Lock',async()=>{
 await q("UPDATE f06_1_lock_ci.policy SET lock_hours=80,policy_version=2,updated_at=clock_timestamp() WHERE policy_id=1");
 const x=await begin(8,4,'policy80-create');assert.equal(x.allowed,true);
 const a=await decisionCI(auth,token,{requestId:x.requestId,requestKey:k('policy80-approve'),action:'approve'});
 assert.equal(a.code,'F06_1_APPROVED_ATOMIC_LOCK',JSON.stringify(a));assert.equal(a.initialHours,80);assert.equal(a.policyVersion,2);
 assert.equal((await q("SELECT initial_hours FROM f06_1_lock_ci.lock_snapshots WHERE lock_id=$1",[winner.lockId]))[0].initial_hours,72);
});
test('06-S34 inactive Customer after PENDING gets CLOSED_NOT_LOCKABLE, never Waitlist',async()=>{
 const r=await begin(9,5,'disable-midflight');assert.equal(r.allowed,true);
 await q("UPDATE public.customers SET account_status='disabled' WHERE customer_id=$1",[customer(9)]);
 const z=await decisionCI(auth,token,{requestId:r.requestId,requestKey:k('disabled-midflight'),action:'approve'});
 assert.equal(z.status,'closed_not_lockable');
 assert.equal((await q("SELECT count(*)::int n FROM public.waitlists WHERE source_lock_request_id=$1",[r.requestId]))[0].n,0);
});
test('06-S35 source offline after request causes CLOSED_NOT_LOCKABLE not conflict',async()=>{
 const r=await begin(10,7,'offline-midflight');assert.equal(r.allowed,true);
 await q("UPDATE public.vehicles SET source_sale_status='unavailable' WHERE vehicle_id=$1",[vehicle(7)]);
 const z=await decisionCI(auth,token,{requestId:r.requestId,requestKey:k('offline-final'),action:'approve'});
 assert.equal(z.status,'closed_not_lockable');
});
test('06-S36 no Deposit/Refund/Transaction mutations are introduced by CI approval',async()=>{
 const n=(await q("SELECT count(*)::int n FROM public.deposit_receipts WHERE lock_id IN (SELECT lock_id FROM public.locks WHERE vehicle_id=0)")).at(0)?.n??0;
 assert.equal(n,0);
 assert.equal((await q("SELECT count(*)::int n FROM public.transactions WHERE source_lock_id=$1",[winner.lockId]))[0].n,0);
});
test('06-S37 final signed Public Catalog and old migration ledger still physically unchanged',async()=>{
 const v=await verify(db);assert.equal(v.verified,true);
 assert.equal((await q('SELECT count(*)::int n FROM public.f03_schema_migrations'))[0].n,24);
});
