import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes,randomUUID} from 'node:crypto';
import {connect} from '../environment.mjs';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {CrmFollowupService} from '../../../src/f05-crm-followup-service.mjs';
let db,auth,token,service;
const query=(q,args=[])=>db.query(q,args);
const request=()=>service.append({token,customerId:'301',content:'Customer state guard regression',businessDemandId:null,source:{kind:'manual'},requestKey:randomUUID().replaceAll('-','')});
before(async()=>{
 db=await connect();auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret:randomBytes(32),origin:'https://127.0.0.1:4388'});
 const a=await auth.login({login:'race_test',password:'SyntheticRace_1234567',source:'crm-account-guard-regression'});
 assert.equal(a.code,'AUTH_OK');token=a.token;service=new CrmFollowupService(auth);
});
after(async()=>{await query("UPDATE public.customers SET account_status='active' WHERE customer_id=301").catch(()=>{});await auth?.close();await db?.end()});
test('A01 frozen public Customer status read without new DDL',async()=>{
 const x=(await query('SELECT account_status FROM public.customers WHERE customer_id=301')).rows[0];
 assert.equal(x.account_status,'active');
});
test('A02 inactive customer rejects new CRM followup and preserves existing history',async()=>{
 const n=(await query('SELECT count(*)::int n FROM public.crm_followups')).rows[0].n;
 await query("UPDATE public.customers SET account_status='inactive' WHERE customer_id=301");
 assert.equal((await request()).code,'CUSTOMER_INACTIVE');
 assert.equal((await query('SELECT count(*)::int n FROM public.crm_followups')).rows[0].n,n);
});
test('A03 account reactivation does not automatically reactivate Demand state',async()=>{
 const before=(await query('SELECT demand_id,demand_state FROM public.demands WHERE customer_id=301 ORDER BY demand_id')).rows;
 await query("UPDATE public.customers SET account_status='active' WHERE customer_id=301");
 const after=(await query('SELECT demand_id,demand_state FROM public.demands WHERE customer_id=301 ORDER BY demand_id')).rows;
 assert.deepEqual(before,after);
});
test('A04 resumed active Customer can append after permission and Scope re-evaluation',async()=>{
 const x=await request();assert.equal(x.status,201);
});
