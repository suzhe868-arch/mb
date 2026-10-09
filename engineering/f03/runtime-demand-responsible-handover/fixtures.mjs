// F03-2-2I: disposable CI-only fixture; no production capability/default permission.
import {connect} from './migration.mjs';
if(process.env.CI!=='true'||process.env.GITHUB_ACTIONS!=='true')throw Error('I_FIXTURE_NOT_DISPOSABLE_CI');
const db=await connect();
try{
 await db.query('BEGIN');
 await db.query("INSERT INTO public.permissions(permission_id,permission_code) VALUES(16,'demand.responsible.transfer')");
 await db.query("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES(5,16,'allow',now()),(6,16,'allow',now())");
 await db.query("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at) VALUES(5,16,201,now()-interval '1 minute'),(5,16,206,now()-interval '1 minute'),(6,16,205,now()-interval '1 minute'),(6,16,208,now()-interval '1 minute')");
 // Standalone demands for transaction/rollback/races; Demand 401..405 already seeded by G.
 await db.query("INSERT INTO public.demands(demand_id,customer_id,responsible_employee_id,demand_state,criteria_json) VALUES(410,301,7,'active','{}'),(411,301,7,'active','{}'),(412,302,7,'paused','{}'),(413,302,7,'active','{}'),(414,304,7,'active','{}'),(415,304,7,'active','{}'),(416,305,7,'active','{}'),(417,305,7,'active','{}'),(418,306,7,'active','{}'),(419,315,7,'active','{}'),(420,316,7,'active','{}'),(421,317,7,'active','{}'),(422,318,7,'active','{}'),(423,319,7,'active','{}'),(424,320,7,'active','{}'),(425,321,7,'active','{}'),(426,322,7,'active','{}'),(427,301,7,'active','{}'),(428,301,7,'active','{}'),(429,301,7,'active','{}'),(430,302,7,'active','{}'),(431,302,7,'active','{}'),(432,302,7,'active','{}'),(440,301,7,'active','{}'),(443,317,7,'active','{}'),(444,321,7,'active','{}'),(445,318,7,'active','{}'),(446,301,7,'active','{}')");
 const rows=[
 [6101,5,8101,401,4],[6102,5,8102,402,4],[6103,5,8103,403,4],[6104,5,8104,404,4],
 [6110,5,8110,410,4],[6111,5,8111,411,4],[6112,5,8112,412,4],[6113,5,8113,413,4],
 [6114,5,8114,414,4],[6115,5,8115,415,4],[6116,5,8116,416,4],[6117,5,8117,417,4],
 [6118,6,8118,418,4],[6119,5,8119,419,4],[6120,5,8120,420,4],[6121,5,8121,421,4],
 [6122,6,8122,422,4],[6123,5,8123,423,4],[6124,6,8124,424,6],[6125,5,8125,425,4],
 [6126,6,8126,426,4],[6127,5,8127,427,4],[6128,5,8128,428,4],[6129,5,8129,429,4],
 [6130,5,8130,430,4],[6131,5,8131,431,4],[6132,5,8132,432,4],
 [6140,5,8140,440,4],[6143,5,8143,443,4],[6144,5,8144,444,4],[6145,5,8145,445,4],[6146,5,8146,446,4],
 ];
 for(const [batch,actor,item,demand,to] of rows){
  const kind=batch===6130?'sudden_inactive':'planned_transfer';
  await db.query("INSERT INTO public.handover_batches(batch_id,source_employee_id,change_kind,initiated_by_kind,initiated_by_id,client_request_key,reason) VALUES($1,7,$4,'employee',$2,$3,'CI Demand only with Priority readonly proof')",[batch,actor,'i2-batch-'+batch+'-fixture',kind]);
  await db.query("INSERT INTO public.handover_items(item_id,batch_id,object_kind,object_id,from_employee_id,intended_to_employee_id) VALUES($1,$2,'Demand',$3,7,$4)",[item,batch,String(demand),to]);
 }
 // A-I-02: a second REAL signed item must start from the first recipient.
 await db.query("INSERT INTO public.handover_batches(batch_id,source_employee_id,change_kind,initiated_by_kind,initiated_by_id,client_request_key,reason) VALUES(6141,4,'planned_transfer','employee',5,'i2-next-chain-batch-6141','CI second authorized Demand responsibility handover')");
 await db.query("INSERT INTO public.handover_items(item_id,batch_id,object_kind,object_id,from_employee_id,intended_to_employee_id) VALUES(8141,6141,'Demand','440',4,5)");
 await db.query('COMMIT');console.log('F03_2I_CI_SYNTHETIC_DEMAND_FIXTURES_PASS');
}catch(e){await db.query('ROLLBACK');throw e}finally{await db.end()}
