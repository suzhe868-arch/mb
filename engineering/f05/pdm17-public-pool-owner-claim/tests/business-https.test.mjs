import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createServer,request} from 'node:https';
import {connect,verify} from '../migration.mjs';
import {createD1BusinessCIHandler} from '../ci-business-router.mjs';

const origin='https://127.0.0.1:49222';
const issuer=randomBytes(32).toString('base64url');
const db=await connect();
let server,vehicle;
const k=x=>'d1-current-business-https-'+x+'-20261019';
async function call(body,token=issuer,extra={},path='/__ci__/f05-10-d1-business/v1/consultations',method='POST'){
 const bytes=body===null?null:Buffer.from(JSON.stringify(body));
 return new Promise((resolve,reject)=>{
  const req=request({hostname:'127.0.0.1',port:49222,path,method,rejectUnauthorized:false,
   headers:{origin,...(bytes?{'content-type':'application/json','content-length':String(bytes.length)}:{}),
    ...(token?{authorization:'Bearer '+token}:{}),...extra}},res=>{
    let raw='';res.on('data',x=>raw+=x);res.on('end',()=>{
     try{resolve({status:res.statusCode,body:JSON.parse(raw),headers:res.headers})}catch(e){reject(e)}
    });
   });
  req.on('error',reject);if(bytes)req.write(bytes);req.end();
 });
}
const payload=(id,owner='owner',consult='consult')=>({
 customerId:id,vehicleId:Number(vehicle.vehicle_id),listingCycleId:Number(vehicle.listing_cycle_id),
 ownerRequestKey:k(owner+'-'+id),consultationRequestKey:k(consult+'-'+id)
});
test.before(async()=>{
 assert.equal((await verify(db)).verified,true);
 vehicle=(await db.query("SELECT v.vehicle_id,cy.listing_cycle_id FROM public.vehicles v "+
  "JOIN public.vehicle_listing_cycles cy ON cy.vehicle_id=v.vehicle_id AND cy.ended_at IS NULL "+
  "WHERE v.archived_at IS NULL AND v.platform_visibility='visible' "+
  "AND ((v.source_type='wholesale' AND v.source_sale_status='active') OR "+
  "(v.source_type IN('mingbang','four_s') AND v.source_sale_status='available')) "+
  "AND NOT EXISTS(SELECT 1 FROM public.priority_leases p WHERE p.vehicle_id=v.vehicle_id "+
  " AND p.listing_cycle_id=cy.listing_cycle_id AND p.status='active') "+
  "AND NOT EXISTS(SELECT 1 FROM public.f05_8_priority_ci p WHERE p.vehicle_id=v.vehicle_id "+
  " AND p.listing_cycle_id=cy.listing_cycle_id AND p.status='active') "+
  "ORDER BY v.vehicle_id,cy.listing_cycle_id LIMIT 1")).rows[0];
 assert.ok(vehicle);
 await db.query("INSERT INTO public.customer_phone_facts(phone_fact_id,customer_id,phone_ciphertext,valid_from) "+
  "SELECT COALESCE(MAX(phone_fact_id),0)+1,989220,decode('11223344','hex'),clock_timestamp() FROM public.customer_phone_facts");
 server=createServer({key:readFileSync('/tmp/f04-3-ci-key.pem'),cert:readFileSync('/tmp/f04-3-ci-cert.pem')},
  createD1BusinessCIHandler({issuerToken:issuer}));
 await new Promise((ok,bad)=>{server.once('error',bad);server.listen(49222,'127.0.0.1',ok)});
});
test.after(async()=>{
 if(server)await new Promise(ok=>server.close(ok));
 await db.end();
});
test('D1-HTTP01 random CI issuer performs real TLS public-pool Owner then pending Consultation, minimal response only',async()=>{
 const r=await call(payload(989220));
 assert.equal(r.status,200,JSON.stringify(r));
 assert.equal(r.body.code,'D1_CONSULTATION_CREATED');assert.equal(r.body.created,true);
 assert.equal(r.body.ownerId,r.body.assigneeEmployeeId);assert.equal(r.body.productionReady,false);
 assert.deepEqual(Object.keys(r.body).sort(),
  ['assigneeEmployeeId','code','consultationId','created','ownerId','productionReady'].sort());
 const c=(await db.query("SELECT c.current_owner_employee_id,c.owner_assignment_state,x.assignee_employee_id,x.status,x.source_relation "+
  "FROM public.customers c JOIN public.consultations x ON x.customer_id=c.customer_id "+
  "WHERE c.customer_id=989220 AND x.consultation_id=$1",[r.body.consultationId])).rows[0];
 assert.equal(c.owner_assignment_state,'assigned');
 assert.equal(String(c.current_owner_employee_id),String(c.assignee_employee_id));
 assert.equal(c.status,'pending');assert.equal(c.source_relation.entry,'vehicle_detail');
 assert.equal(c.source_relation.issuer,'CI_SYNTHETIC_PDM17_CUSTOMER_INTENT_NOT_PRODUCTION');
 for(const secret of ['phone','vin','price','receipt','token'])assert.equal(Object.hasOwn(r.body,secret),false);
});
test('D1-HTTP02 exact HTTPS retry is idempotent and cannot create second active Consultation',async()=>{
 const r=await call(payload(989220));
 assert.equal(r.status,200,JSON.stringify(r));assert.equal(r.body.code,'D1_CONSULTATION_IDEMPOTENT');
 assert.equal((await db.query("SELECT count(*)::int n FROM public.consultations WHERE customer_id=989220 "+
  "AND status IN ('pending','processing')")).rows[0].n,1);
});
test('D1-HTTP03 missing/wrong issuer, cookie and forwarded/owner hints cannot create Owner or Consultation',async()=>{
 const body=payload(989221,'reject-owner','reject-consult');
 for(const [token,extra] of [
  [null,{}],['A'.repeat(43),{}],[issuer,{cookie:'__Host-mb_pc=fake'}],
  [issuer,{'x-forwarded-for':'127.0.0.1'}],[issuer,{'x-owner':'7'}]
 ]){
  const r=await call(body,token,extra);assert.equal(r.status,403,JSON.stringify(r));
 }
 const c=(await db.query('SELECT current_owner_employee_id FROM public.customers WHERE customer_id=989221')).rows[0];
 assert.equal(c.current_owner_employee_id,null);
 assert.equal((await db.query('SELECT count(*)::int n FROM public.consultations WHERE customer_id=989221')).rows[0].n,0);
});
test('D1-HTTP04 owner forms first but missing phone fact blocks later Consultation without rolling Owner back',async()=>{
 const r=await call(payload(989221,'phone-owner','phone-consult'));
 assert.equal(r.status,409,JSON.stringify(r));
 assert.equal(r.body.code,'D1_CONSULTATION_PHONE_FACT_REQUIRED');assert.equal(r.body.ownerFormed,true);
 const c=(await db.query('SELECT current_owner_employee_id,owner_assignment_state FROM public.customers WHERE customer_id=989221')).rows[0];
 assert.ok(c.current_owner_employee_id);assert.equal(c.owner_assignment_state,'assigned');
 assert.equal((await db.query('SELECT count(*)::int n FROM public.consultations WHERE customer_id=989221')).rows[0].n,0);
});
test('D1-HTTP05 production-looking route, GET, extra fields and malformed identity remain closed',async()=>{
 assert.equal((await call(payload(989222),issuer,{},'/api/v1/public-pool/consultations')).status,404);
 assert.equal((await call(null,issuer,{},'/__ci__/f05-10-d1-business/v1/consultations','GET')).status,405);
 assert.equal((await call({...payload(989222),ownerId:7})).status,400);
 assert.equal((await call({...payload(989222),customerId:'0989222'})).status,400);
});
