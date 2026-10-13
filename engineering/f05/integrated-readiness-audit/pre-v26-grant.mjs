// F05-11 disposable PG16: issued only through formally accepted F05-9 v25 Service, BEFORE v26.
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {IsolatedAuth} from '../../src/f03-auth-service.mjs';
import {connect,verify} from '../recommendation-visibility-grants/migration.mjs';
import {createRecommendationCI,customerProjectionCI} from '../recommendation-visibility-grants/service.mjs';
const db=await connect();
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret:randomBytes(32),origin:'https://127.0.0.1:49022'});
const q=(s,p=[])=>db.query(s,p).then(r=>r.rows);
try{
 assert.equal((await verify(db)).verified,true);
 const login=await auth.login({login:'employee_test',password:'SyntheticF04_3_CurrentProof_2026',source:'f05-11-pre-v26-grant'});
 assert.equal(login.code,'AUTH_OK');const token=login.token;
 const rec=(await q("SELECT rv.result_id,rv.demand_id,rv.vehicle_id,rv.listing_cycle_id,rv.source_signature,"+
 "d.customer_id rival,d.responsible_employee_id,c.customer_id who "+
 "FROM public.f05_7_result_versions_ci rv JOIN public.demands d ON d.demand_id=rv.demand_id "+
 "JOIN public.vehicles v ON v.vehicle_id=rv.vehicle_id "+
 "JOIN public.vehicle_listing_cycles lc ON lc.vehicle_id=v.vehicle_id AND lc.listing_cycle_id=rv.listing_cycle_id "+
 "JOIN public.customers c ON c.customer_id IN (899612,899613,899618,899619,899620) "+
 "JOIN public.f05_6_level_find_policy_ci fp ON fp.level_id=c.customer_level_id AND fp.find_enabled=true "+
 "WHERE rv.status='current' AND rv.tier IN('high','acceptable') AND c.customer_id<>d.customer_id "+
 "AND v.platform_visibility='visible' AND v.archived_at IS NULL AND lc.ended_at IS NULL "+
 "AND ((v.source_type='wholesale' AND v.source_sale_status='active') "+
 "OR (v.source_type IN('mingbang','four_s') AND v.source_sale_status='available')) "+
 "AND c.account_status='active' AND c.current_owner_employee_id=1 AND c.owner_assignment_state='assigned' "+
 "AND NOT EXISTS(SELECT 1 FROM public.recommendations r WHERE r.customer_id=c.customer_id "+
 "AND r.vehicle_id=v.vehicle_id AND r.listing_cycle_id=lc.listing_cycle_id AND r.status='active') "+
 "AND NOT EXISTS(SELECT 1 FROM public.f05_8_priority_ci p WHERE p.vehicle_id=v.vehicle_id "+
 "AND p.listing_cycle_id=lc.listing_cycle_id AND p.status='active') "+
 "ORDER BY rv.result_id DESC,c.customer_id DESC LIMIT 1"))[0];
 assert.ok(rec,'signed v23 matching + eligible separate Customer required');
 await q("UPDATE public.vehicles SET platform_visibility='hidden' WHERE vehicle_id=$1",[rec.vehicle_id]);
 const recommendation=await createRecommendationCI(auth,token,{teamId:901,customerId:Number(rec.who),
  vehicleId:Number(rec.vehicle_id),listingCycleId:Number(rec.listing_cycle_id),
  eventKey:'f05-11-current-v25-grant-20261013'});
 assert.equal(recommendation.allowed,true,JSON.stringify(recommendation));
 assert.equal(recommendation.created,true);
 const grant=(await q("SELECT grant_id FROM public.vehicle_visibility_grants WHERE source_recommendation_id=$1 AND revoked_at IS NULL",
 [recommendation.recommendationId]))[0];
 assert.ok(grant?.grant_id,'true signed current Grant must be physically issued');
 const p={customerId:Number(rec.who),vehicleId:Number(rec.vehicle_id),listingCycleId:Number(rec.listing_cycle_id),
 entry:'ordinary_share',syntheticCustomerIdentity:'CI_SYNTHETIC_CUSTOMER_IDENTITY_NOT_PRODUCTION'};
 const allowed=await customerProjectionCI(db,p);
 assert.equal(allowed.allowed,true);assert.equal(allowed.visible,true);assert.equal(allowed.recommendationOnlyVisible,true);
 const priority=(await q("INSERT INTO public.f05_8_priority_ci "+
 "(customer_id,vehicle_id,listing_cycle_id,trigger_demand_id,responsible_employee_id,"+
 "origin_team_id,origin_store_id,source_match_result_id,source_signature,expires_at,creation_key) "+
 "VALUES($1,$2,$3,$4,$5,901,1,$6,$7,clock_timestamp()+interval '10 minutes',$8) RETURNING priority_id",
 [rec.rival,rec.vehicle_id,rec.listing_cycle_id,rec.demand_id,rec.responsible_employee_id,
 rec.result_id,rec.source_signature,'f05-11-pre-v26-current-rival-priority-20261013']))[0];
 const blocked=await customerProjectionCI(db,p);
 assert.equal(blocked.allowed,true);assert.equal(blocked.visible,false);assert.equal(blocked.customerDisplayCents,null);
 await q("UPDATE public.f05_8_priority_ci SET status='ended',ended_at=clock_timestamp(),ended_reason='employee_released' WHERE priority_id=$1",[priority.priority_id]);
 const restored=await customerProjectionCI(db,p);
 assert.equal(restored.allowed,true);assert.equal(restored.recommendationOnlyVisible,true);
 console.log('F05_11_GENUINE_V25_PROJECTION_DENY_RESTORE',JSON.stringify({grant:grant.grant_id,priority:priority.priority_id,customer:rec.who,rival:rec.rival}));
}finally{await auth.close();await db.end()}
