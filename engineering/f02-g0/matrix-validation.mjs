const HEADERS=['条目ID','候选实体','候选字段','物理类型建议','可空性建议','键/约束候选','约束承担层','规则语义与验证关注点','来源正式PDM','物理冻结状态','F02测试状态'];
const REQUIRED_SOURCES=[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,22,23,24,25];
const REQUIRED_TABLES=['customers','customer_wechat_identities','customer_phone_facts','customer_owner_history','manual_vehicle_drafts','lock_requests','locks','waitlists','refund_cases','vehicle_models','jyt_model_source_mappings','audit_events','public_pool_events'];
const REQUIRED_FIELDS=[
  'customers.customer_id','customers.current_owner_employee_id','customers.owner_assignment_state',
  'customer_wechat_identities.customer_id','customer_wechat_identities.wechat_identity_key',
  'customer_phone_facts.customer_id','customer_phone_facts.phone_ciphertext',
  'customer_daily_price_access.customer_id','customer_daily_price_access.vehicle_id','customer_daily_price_access.listing_cycle_id',
  'demands.demand_state','consultations.status','consultations.close_reason',
  'find_car_applications.status','lock_requests.status','refund_cases.status','refund_cases.close_reason','refund_cases.lock_id','refund_cases.transaction_id',
  'manual_vehicle_drafts.created_by_employee_id','vehicles.vehicle_id','vehicle_models.model_year','jyt_model_source_mappings.upstream_model_id','jyt_model_source_mappings.local_model_id',
];
const BANNED=/^(?:customer_merge(?:_[a-z0-9_]+)?|merge_customer(?:_[a-z0-9_]+)?|surviving_customer_id|merge_id|from_customer_id|to_customer_id|survivor_customer_id)$/i;
function requireResult(condition,code){if(!condition)throw Error(code);}
export function validateMatrix(source){
  const lines=source.trim().split(/\r?\n/).map(x=>x.split('\t'));
  requireResult(lines.length>1,'F02_G0_MATRIX_EMPTY');
  requireResult(JSON.stringify(lines[0])===JSON.stringify(HEADERS),'F02_G0_MATRIX_HEADER_MISMATCH');
  const data=lines.slice(1),ids=new Set(),fields=new Map(),tables=new Set(),sources=new Set();
  requireResult(data.length>=240,'F02_G0_MATRIX_INCOMPLETE');
  for(const r of data){
    requireResult(r.length===HEADERS.length,'F02_G0_MATRIX_COLUMN_MISMATCH');
    const [id,table,field,,nullable,constraint,layer,meaning,pdms,freeze,test]=r;
    requireResult(/^F02-F-\d{4}$/.test(id)&&!ids.has(id),'F02_G0_DUPLICATE_OR_INVALID_ID');
    ids.add(id);
    const key=table+'.'+field;
    requireResult(!fields.has(key),'F02_G0_DUPLICATE_FIELD');
    requireResult(!BANNED.test(table)&&!BANNED.test(field)&&!BANNED.test(constraint),'F02_G0_BANNED_CUSTOMER_MERGE');
    requireResult(['NO','YES','REVIEW'].includes(nullable),'F02_G0_BAD_NULLABILITY');
    requireResult(['DB','TX','F03','F04','AUDIT'].includes(layer),'F02_G0_UNKNOWN_OWNER_LAYER');
    requireResult(meaning.length>5,'F02_G0_MISSING_FIELD_MEANING');
    requireResult(freeze==='CANDIDATE_UNFROZEN'&&test==='NOT_RUN','F02_G0_FALSE_IMPLEMENTATION_CLAIM');
    const references=[...pdms.matchAll(/PDM-(\d{2})/g)].map(m=>Number(m[1]));
    requireResult(references.length>0 && pdms.split('/').length===references.length && references.every(x=>x>=1&&x<=25),'F02_G0_INVALID_PDM_SOURCE');
    for(const x of references)sources.add(x);
    fields.set(key,r);tables.add(table);
  }
  requireResult(tables.size>=50,'F02_G0_DOMAIN_COVERAGE_TOO_SMALL');
  for(const x of REQUIRED_SOURCES)requireResult(sources.has(x),'F02_G0_MISSING_PDM_'+x);
  for(const x of REQUIRED_TABLES)requireResult(tables.has(x),'F02_G0_MISSING_ENTITY_'+x);
  for(const x of REQUIRED_FIELDS)requireResult(fields.has(x),'F02_G0_MISSING_RULE_FIELD_'+x);
  for(const r of data){
    for(const m of r[5].matchAll(/(?:FK|XOR_FK):([a-z_]+)\.([a-z_]+)/g)) {
      requireResult(fields.has(m[1]+'.'+m[2]),'F02_G0_DANGLING_FK_'+r[1]+'.'+r[2]);
    }
  }
  const value=(table,field)=>fields.get(table+'.'+field);
  requireResult(/owner_assignment_pending/.test(value('customers','owner_assignment_state')[7]),'F02_G0_MISSING_OWNER_PENDING');
  requireResult(!/UQ|UNIQUE/i.test(value('customer_phone_facts','phone_ciphertext')[5]),'F02_G0_PHONE_GLOBAL_UNIQUE_FORBIDDEN');
  requireResult(/同号可登记多个不同Customer/.test(value('customer_phone_facts','phone_ciphertext')[7]),'F02_G0_SAME_PHONE_MULTIPLE_CUSTOMERS');
  requireResult(/active.paused.completed.cancelled/i.test(value('demands','demand_state')[5]),'F02_G0_WRONG_DEMAND_STATUSES');
  requireResult(!/\bended\b/i.test(value('demands','demand_state')[7]),'F02_G0_DEMAND_ENDED_LEGACY');
  requireResult(/pending.activated.closed/i.test(value('find_car_applications','status')[5]),'F02_G0_WRONG_APPLICATION_STATUSES');
  requireResult(/pending.processing.resolved.invalid/i.test(value('consultations','status')[5]),'F02_G0_WRONG_CONSULTATION_STATUSES');
  requireResult(/RESOLVED\/NORMAL_CLOSED\/CUSTOMER_WITHDRAWN/.test(value('consultations','close_reason')[7]),'F02_G0_MISSING_CONSULTATION_CLOSE_REASON');
  requireResult(/PENDING_APPROVED_REJECTED_EXPIRED_LOCK_CONFLICT_CLOSED_NOT_LOCKABLE/.test(value('lock_requests','status')[5]),'F02_G0_WRONG_LOCKREQUEST_STATUSES');
  requireResult(/pending_refunded_closed/i.test(value('refund_cases','status')[5]),'F02_G0_WRONG_REFUND_STATUSES');
  requireResult(/XOR_FK/.test(value('refund_cases','lock_id')[5])&&/XOR_FK/.test(value('refund_cases','transaction_id')[5]),'F02_G0_REFUND_SUBJECT_NOT_XOR');
  requireResult(/属性/.test(value('vehicle_models','model_year')[7]),'F02_G0_MODEL_YEAR_MUST_BE_ATTRIBUTE');
  requireResult(tables.has('manual_vehicle_drafts')&&!data.some(r=>/uq_employee_open_manual_draft/i.test(r.join(' '))),'F02_G0_SINGLE_DRAFT_LEGACY');
  return {fieldCount:data.length,entityCount:tables.size,pdmCount:sources.size,ids:ids.size};
}
