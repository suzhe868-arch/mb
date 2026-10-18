// F05-7 test-only Rule Dictionary CRUD/preview. No production F03 issuer or Match side effects.
import {createHash} from 'node:crypto';
import {normalizeDictionaryDefinition,parseDictionaryTokens} from './f05-matching-dictionary-parser.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex');
const bid=x=>typeof x==='string'&&/^[1-9][0-9]{0,18}$/.test(x)&&BigInt(x)<=9223372036854775807n;
const key=x=>typeof x==='string'&&/^[A-Za-z0-9_-]{24,64}$/.test(x);
const bearer=x=>typeof x==='string'&&/^[A-Za-z0-9_-]{43}$/.test(x);
const result=(status,code,extra={})=>({status,body:{code,...extra,productionReady:false}});
export function createIsolatedDictionaryService({pool,env=process.env}={}){
 if(!pool||typeof pool.connect!=='function'||env.APP_ENV!=='test'||env.NODE_ENV!=='test'||
  env.API_HOST!=='127.0.0.1'||env.F05_CATALOG_TEST_CONSENT!=='I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY')
  throw Error('FORMAL_RULE_DICTIONARY_ISSUER_REQUIRED');
 async function authorize(db,credential){
  return (await db.query("SELECT e.employee_id FROM public.f05_catalog_employee_sessions_test s "+
   "JOIN public.employees e ON e.employee_id=s.employee_id "+
   "JOIN public.roles r ON r.role_id=e.main_role_id "+
   "JOIN public.f05_matching_rule_manage_scope_test p ON p.employee_id=e.employee_id "+
   "WHERE s.token_sha256=$1 AND s.issuer='DISPOSABLE_TEST_ONLY' "+
   "AND s.expires_at>statement_timestamp() AND s.revoked_at IS NULL "+
   "AND e.employment_status='active' AND r.role_code IN ('sales','manager','store_head') "+
   "AND p.issuer='DISPOSABLE_TEST_ONLY' AND p.can_manage=true "+
   "AND p.expires_at>statement_timestamp() FOR SHARE OF s,e,r,p",[sha(credential)])).rows[0]??null;
 }
 return Object.freeze({
  async mutate({credential,action,ruleId=null,expectedVersion=null,eventKey,definition=null}={}){
   if(!bearer(credential))return result(401,'RULE_EMPLOYEE_IDENTITY_REQUIRED');
   if(!key(eventKey)||!['CREATE','EDIT','ENABLE','DISABLE','DEPRECATE'].includes(action)||
    (action==='CREATE'&&(ruleId!==null||expectedVersion!==null))||
    (action!=='CREATE'&&(!bid(ruleId)||!Number.isSafeInteger(expectedVersion)||expectedVersion<1))||
    (action!=='CREATE'&&action!=='EDIT'&&definition!==null))
    return result(400,'RULE_INVALID_MUTATION');
   let data=null;
   if(['CREATE','EDIT'].includes(action)){
    try{data=normalizeDictionaryDefinition(definition)}catch{return result(400,'RULE_INVALID_DEFINITION')}
   }
   const fingerprint=sha(JSON.stringify([action,ruleId,expectedVersion,data]));
   const db=await pool.connect();
   try{
    await db.query('BEGIN');
    try{
     const actor=await authorize(db,credential);
     if(!actor){await db.query('ROLLBACK');return result(403,'RULE_MANAGE_EXPLICIT_PERMISSION_REQUIRED')}
     const employeeId=String(actor.employee_id);
     await db.query("SELECT pg_advisory_xact_lock(hashtext('F05_DICT_EVENT'),hashtext($1))",[eventKey]);
     const past=(await db.query("SELECT actor_employee_id,payload_sha256,rule_id,after_json FROM public.f05_matching_dictionary_history_test WHERE event_key=$1",[eventKey])).rows[0];
     if(past){
      await db.query('ROLLBACK');
      if(String(past.actor_employee_id)!==employeeId||past.payload_sha256!==fingerprint)
       return result(409,'RULE_IDEMPOTENCY_COLLISION');
      return result(200,'RULE_MUTATION_REPLAY',{ruleId:String(past.rule_id),snapshot:past.after_json,simulationOnly:true});
     }
     // Acquire deterministic token locks BEFORE any rule row mutation, synchronized
     // with matching resolution. Old-token read is revalidated under row lock.
     const prior=action==='CREATE'?null:(await db.query(
      "SELECT token FROM public.f05_matching_dictionary_rules_test WHERE rule_id=$1",[ruleId])).rows[0];
     if(action!=='CREATE'&&!prior){await db.query('ROLLBACK');return result(404,'RULE_NOT_FOUND')}
     const tokens=[...new Set([prior?.token,data?.token].filter(Boolean))].sort();
     for(const token of tokens)
      await db.query("SELECT pg_advisory_xact_lock(hashtext('F05_DICT_TOKEN'),hashtext($1))",[token]);
     let before=null,row;
     if(action==='CREATE'){
      row=(await db.query(`INSERT INTO public.f05_matching_dictionary_rules_test
       (token,mapped_key,mapped_value,scope_kind,brand_id,series_id,model_id,year_from,year_to,notes,created_by,updated_by)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$11) RETURNING *`,
       [data.token,data.mappedKey,data.mappedValue,data.scopeKind,data.brandId,data.seriesId,
        data.modelId,data.yearFrom,data.yearTo,data.notes,employeeId])).rows[0];
     }else{
      before=(await db.query("SELECT * FROM public.f05_matching_dictionary_rules_test WHERE rule_id=$1 FOR UPDATE",[ruleId])).rows[0];
      if(!before){await db.query('ROLLBACK');return result(404,'RULE_NOT_FOUND')}
      if(before.token!==prior.token){await db.query('ROLLBACK');return result(409,'RULE_TOKEN_CHANGED_RETRY')}
      if(String(before.version)!==String(expectedVersion)){await db.query('ROLLBACK');return result(409,'RULE_VERSION_CONFLICT')}
      if(before.status==='deprecated'){await db.query('ROLLBACK');return result(409,'RULE_DEPRECATED_IMMUTABLE')}
      if(action==='EDIT'){
       row=(await db.query(`UPDATE public.f05_matching_dictionary_rules_test SET
        token=$2,mapped_key=$3,mapped_value=$4,scope_kind=$5,brand_id=$6,series_id=$7,
        model_id=$8,year_from=$9,year_to=$10,notes=$11,
        version=version+1,updated_by=$12,updated_at=statement_timestamp()
        WHERE rule_id=$1 RETURNING *`,
        [ruleId,data.token,data.mappedKey,data.mappedValue,data.scopeKind,data.brandId,
         data.seriesId,data.modelId,data.yearFrom,data.yearTo,data.notes,employeeId])).rows[0];
      }else{
       const target={ENABLE:'enabled',DISABLE:'disabled',DEPRECATE:'deprecated'}[action];
       if(before.status===target){await db.query('ROLLBACK');return result(409,'RULE_STATE_UNCHANGED')}
       row=(await db.query("UPDATE public.f05_matching_dictionary_rules_test SET status=$2,version=version+1,updated_by=$3,updated_at=statement_timestamp() WHERE rule_id=$1 RETURNING *",
         [ruleId,target,employeeId])).rows[0];
      }
     }
     await db.query("INSERT INTO public.f05_matching_dictionary_history_test (event_key,payload_sha256,actor_employee_id,rule_id,action,before_json,after_json) VALUES($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb)",
      [eventKey,fingerprint,employeeId,String(row.rule_id),action,before?JSON.stringify(before):null,JSON.stringify(row)]);
     // Affect only already-current pairs whose saved canonical Sales description
     // explicitly contains the changed token; no Vehicle × Demand Cartesian scan.
     // New candidates without a prior Match remain a separately recorded gap.
     const changed=(await db.query(
      "SELECT r.demand_id,r.vehicle_id,r.listing_cycle_id FROM public.demand_match_results r "+
      "JOIN public.f05_matching_sales_description_test sd ON sd.demand_id=r.demand_id "+
      "WHERE r.current_state='current' AND "+
      "($1=ANY(string_to_array(sd.sales_description,';')) OR $2=ANY(string_to_array(sd.sales_description,';'))) "+
      "ORDER BY r.result_id FOR UPDATE OF r",
      [row.token,before?.token??row.token])).rows;
     for(const affected of changed)
      await db.query("SELECT public.f05_match_mark_stale_affected_test('RULE_DICTIONARY_CHANGE',$1,$2,$3)",
       [String(affected.demand_id),String(affected.vehicle_id),String(affected.listing_cycle_id)]);
     await db.query('COMMIT');
     return result(200,action==='CREATE'?'RULE_CREATED':'RULE_CHANGED',{
      ruleId:String(row.rule_id),version:String(row.version),status:row.status,
      simulationOnly:true,affectedCurrentPairsStaled:changed.length,affectedProductionMatchesRecalculated:false});
    }catch(e){await db.query('ROLLBACK').catch(()=>{});throw e}
   }finally{db.release()}
  },
  async preview({credential,text,context={}}={}){
   if(!bearer(credential))return result(401,'RULE_EMPLOYEE_IDENTITY_REQUIRED');
   if(typeof text!=='string'||text.length<2||text.length>500||
    !context||typeof context!=='object'||Array.isArray(context)||
    Object.keys(context).some(k=>!['brandId','seriesId','modelId','modelYear'].includes(k))||
    ['brandId','seriesId','modelId'].some(k=>context[k]!=null&&!bid(context[k]))||
    (context.modelYear!=null&&(!Number.isInteger(context.modelYear)||context.modelYear<1886||context.modelYear>2200)))
     return result(400,'RULE_PREVIEW_INVALID_INPUT');
   const db=await pool.connect();
   try{
    await db.query('BEGIN');
    try{
     if(!await authorize(db,credential)){await db.query('ROLLBACK');return result(403,'RULE_MANAGE_EXPLICIT_PERMISSION_REQUIRED')}
     const rows=(await db.query("SELECT rule_id,token,mapped_key,mapped_value,scope_kind,brand_id,series_id,model_id,year_from,year_to,version,status FROM public.f05_matching_dictionary_rules_test WHERE status='enabled' AND token=ANY($1::text[])",
       [text.split(';')])).rows;
     const parsed=parseDictionaryTokens(text,rows,context);
     await db.query('COMMIT');
     return result(parsed.ready?200:409,parsed.ready?'RULE_PREVIEW_READY':'RULE_PREVIEW_NOT_READY',{parse:parsed,simulationOnly:true,noBusinessMutation:true});
    }catch(e){await db.query('ROLLBACK').catch(()=>{});throw e}
   }finally{db.release()}
  }
 });
}
