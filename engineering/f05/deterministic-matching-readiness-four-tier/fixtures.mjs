// Additional deterministic Rule/Vehicle/Employee permission facts in disposable signed PG16 only.
import {connect,verify} from './migration.mjs';
const c=await connect();
try{
 await verify(c);await c.query('BEGIN');
 try{
  await c.query("INSERT INTO public.permissions(permission_id,permission_code) VALUES(1097,'matching.rule.manage.ci.synthetic')");
  for(const eid of [1,5,6]){
   await c.query("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES($1,1097,'allow',now())",[eid]);
  }
  await c.query("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at) VALUES(1,1097,29001,now()-interval '1 minute'),(5,1097,201,now()-interval '1 minute'),(6,1097,204,now()-interval '1 minute')");
  const rules=[
   ['奥迪A6','model_year','min',2025,'hard'],
   ['5万公里以内','mileage_km','max',50000,'hard'],
   ['黑色外观','exterior_color','in',null,'hard',['black']],
   ['米色内饰','interior_color','eq','beige','preferred'],
   ['预算10万','budget_cents','budget',10000000,'hard']
  ];
  for(const [phrase,field,op,value,mode,values] of rules){
   await c.query("INSERT INTO public.f05_7_rule_dictionary_ci(phrase,scope_kind,condition_json) VALUES($1,'global',$2::jsonb)",
     [phrase,JSON.stringify({field,op,value,mode,...(values?{values}:{})})]);
  }
  const vehicles=(await c.query("SELECT l.vehicle_id,l.current_cycle_id,l.model_year FROM public.f05_3b_sync_lineages l JOIN public.vehicles v ON v.vehicle_id=l.vehicle_id JOIN public.vehicle_listing_cycles cy ON cy.listing_cycle_id=l.current_cycle_id WHERE v.source_type='wholesale' AND v.source_sale_status='active' AND cy.ended_at IS NULL ORDER BY l.vehicle_id LIMIT 5")).rows;
  if(vehicles.length<3)throw Error('F05_7_REQUIRES_ORIGINAL_SIGNED_JYT_CI_VEHICLES');
  for(let i=0;i<vehicles.length;i++){
   const x=vehicles[i];
   const facts={
    model_year:{value:Number(x.model_year),source:'CI_JYT_SIGNED_SOURCE_STRUCTURED_NOT_PRODUCTION'},
    mileage_km:{value:42000,source:'CI_STRUCTURED_SYNTHETIC_NOT_PRODUCTION'},
    exterior_color:{value:'black',source:'CI_STRUCTURED_SYNTHETIC_NOT_PRODUCTION'},
    interior_color:{value:'beige',source:'CI_SYNTHETIC_INSPECTION_NOT_PRODUCTION'},
    budget_cents:{value:10000000,source:'CI_SYNTHETIC_CUSTOMER_DISPLAY_PRICE_NOT_PRODUCTION'}
   };
   await c.query('INSERT INTO public.f05_7_vehicle_facts_ci(vehicle_id,listing_cycle_id,facts_json) VALUES($1,$2,$3::jsonb)',
    [x.vehicle_id,x.current_cycle_id,JSON.stringify(facts)]);
  }
  await c.query('COMMIT');
  console.log('F05_7_SIGNED_REAL_PG16_SYNTHETIC_RULE_AND_VEHICLE_FACTS_NOT_PRODUCTION');
 }catch(e){await c.query('ROLLBACK');throw e}
}finally{await c.end()}
