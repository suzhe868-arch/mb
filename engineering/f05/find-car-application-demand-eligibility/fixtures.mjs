// F05-6 CI-only synthetic Customer actor, phone proof, find entitlement and employee permission.
import {connect,verify} from './migration.mjs';
const db=await connect();
try{
 await verify(db);
 await db.query('BEGIN');
 try{
  await db.query("INSERT INTO public.permissions(permission_id,permission_code) VALUES(96,'demand.activate.ci.synthetic')");
  for(const employee of [1,5,6])await db.query("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES($1,96,'allow',now())",[employee]);
  await db.query("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at) VALUES(1,96,29001,now()-interval '1 minute'),(5,96,201,now()-interval '1 minute'),(6,96,204,now()-interval '1 minute')");
  // Level codes deliberately have NO semantics; find-car OFF/ON is independent from
  // pre-existing F05-4 price_mode LIMITED/UNLIMITED (not a delegated grant).
  await db.query("INSERT INTO public.f05_6_level_find_policy_ci(level_id,find_enabled) VALUES(1,false),(2,true)");
  const fixtures=[
   [899611,'active',1,1,'assigned'],
   [899612,'active',2,1,'assigned'],
   [899613,'active',2,1,'assigned'],
   [899614,'active',1,1,'assigned'],
   [899615,'active',2,null,'pending'],
   [899616,'active',2,1,'assigned'],
   [899617,'inactive',2,1,'assigned'],
   [899618,'active',2,1,'assigned'],
   [899619,'active',2,1,'assigned'],
   [899620,'active',2,1,'assigned'],[899621,'active',2,1,'assigned'],[899622,'active',2,1,'assigned']
  ];
  for(const [id,status,level,owner,assignment] of fixtures)
   await db.query("INSERT INTO public.customers(customer_id,account_status,customer_level_id,current_owner_employee_id,owner_assignment_state) VALUES($1,$2,$3,$4,$5)",[id,status,level,owner,assignment]);
  // THIS IS *ONLY* a disposable synthetic phone fact. No real WeChat authorization,
  // real phone number, customer personal data or live carrier validation exists.
  for(const id of [899611,899612,899613,899614,899615,899617,899618,899619,899620,899621,899622])
   await db.query("INSERT INTO public.customer_phone_facts(customer_id,phone_ciphertext,valid_from) VALUES($1,decode('c100f05606060606','hex'),now()-interval '1 day')",[id]);
  await db.query('COMMIT');
  console.log('F05_6_CI_SYNTHETIC_CUSTOMER_ACTOR_NOT_PRODUCTION');
  console.log('F05_6_CI_SYNTHETIC_PHONE_GATE_NOT_PRODUCTION');
  console.log('F05_6_CI_SYNTHETIC_FIND_CAR_ENTITLEMENT_NOT_PRODUCTION');
 }catch(e){await db.query('ROLLBACK');throw e}
}finally{await db.end()}