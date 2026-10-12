// On real signed v23 *before* v24. All positive inputs explicitly CI synthetic.
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {IsolatedAuth} from '../../src/f03-auth-service.mjs';
import {connect,verify} from '../deterministic-matching-readiness-four-tier/migration.mjs';
import {saveSalesDescriptionCI,calculateCI} from '../deterministic-matching-readiness-four-tier/service.mjs';
const db=await connect(),secret=randomBytes(32);
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin:'https://127.0.0.1:48988'});
try{
 assert.equal((await verify(db)).verified,true);
 const s=await auth.login({login:'employee_test',password:'SyntheticF04_3_CurrentProof_2026',source:'f05-8-CI-v23-preseed'});
 assert.equal(s.code,'AUTH_OK');
 // The earlier signed F05-7 tests leave their own deliberate conflicting
 // R04 dictionary and Vehicle facts behind. Reset *rows* only; old schema and
 // immutable result history remain exactly unchanged and old current becomes stale.
 await db.query("DELETE FROM public.f05_7_rule_dictionary_ci WHERE (scope_kind<>'global' OR "+
  "(scope_kind='global' AND phrase='奥迪A6' AND condition_json->>'value'='2010'))");
 await db.query("INSERT INTO public.f05_7_rule_dictionary_ci(phrase,scope_kind,condition_json) VALUES('蓝色内饰','global',$1::jsonb)",
  [JSON.stringify({field:'interior_color',mode:'preferred',op:'eq',value:'blue'})]);
 const vehicles=(await db.query('SELECT vehicle_id,listing_cycle_id FROM public.f05_7_vehicle_facts_ci ORDER BY vehicle_id LIMIT 5')).rows;
 assert.equal(vehicles.length,5);
 for(const v of vehicles){
  const jyt=(await db.query('SELECT model_year FROM public.f05_3b_sync_lineages WHERE vehicle_id=$1',[v.vehicle_id])).rows[0];
  assert.ok(jyt);
  const facts={
   model_year:{value:Number(jyt.model_year),kind:'structured',source:'CI_ORIGINAL_JYT_MODEL_YEAR_NOT_PRODUCTION'},
   mileage_km:{value:42000,kind:'structured',source:'CI_STRUCTURED_NOT_PRODUCTION'},
   exterior_color:{value:'black',kind:'structured',source:'CI_STRUCTURED_NOT_PRODUCTION'},
   interior_color:{value:'beige',kind:'inspection',source:'CI_INSPECTION_NOT_PRODUCTION'},
   budget_cents:{value:10000000,kind:'structured',source:'CI_SYNTHETIC_CUSTOMER_DISPLAY_PRICE_NOT_PRODUCTION'}
  };
  await db.query('UPDATE public.f05_7_vehicle_facts_ci SET facts_json=$1::jsonb,fact_version=fact_version+1 WHERE vehicle_id=$2 AND listing_cycle_id=$3',
   [JSON.stringify(facts),v.vehicle_id,v.listing_cycle_id]);
 }
 // Additional realistic active synthetic CI demand identities: direct CI test
 // fixture only, explicitly not a production/Wechat Demand Issuer.
 for(const id of [899621,899622,899612]){
  await db.query("INSERT INTO public.demands(customer_id,responsible_employee_id,demand_state,criteria_json) "+
   "VALUES($1,1,'active',$2::jsonb)",[id,JSON.stringify({source:'CI_SYNTHETIC_F05_8_ADDITIONAL_DEMAND_NOT_PRODUCTION'})]);
 }
 const demands=(await db.query(
  "SELECT demand_id,customer_id FROM public.demands WHERE customer_id BETWEEN 899612 AND 899622 AND demand_state='active' ORDER BY demand_id")).rows;
 const high='奥迪A6 2026款 5万公里以内 黑色外观 米色内饰 预算10万';
 const acceptable='奥迪A6 2026款 5万公里以内 黑色外观 蓝色内饰 预算10万';
 const lowCustomer=899620;
 for(const d of demands){
  const dId=Number(d.demand_id),desc=Number(d.customer_id)===lowCustomer?acceptable:high;
  const ready=await saveSalesDescriptionCI(auth,s.token,{demandId:dId,teamId:901,description:desc});
  assert.equal(ready.allowed,true,JSON.stringify({ready,demand:dId}));
  for(const v of vehicles){
   const res=await calculateCI(auth,s.token,{
    demandId:dId,vehicleId:Number(v.vehicle_id),listingCycleId:Number(v.listing_cycle_id),
    teamId:901,runKey:'f05-8-signed-v23-'+dId+'-'+v.vehicle_id+'-priority'
   });
   assert.equal(res.allowed,true,JSON.stringify({res,demand:dId,vehicle:v.vehicle_id}));
  }
 }
 console.log('F05_8_REAL_SIGNED_V23_MATCH_RESULTS_PRESEEDED',JSON.stringify({
  demandIds:demands.map(d=>Number(d.demand_id)),vehicleIds:vehicles.map(v=>Number(v.vehicle_id)),
  source:'CI_SYNTHETIC_PRIORITY_MATCH_INPUTS_NOT_PRODUCTION'}));
}finally{await auth.close();await db.end();secret.fill(0)}
