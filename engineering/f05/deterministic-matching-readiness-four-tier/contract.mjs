// PDM-12 pure deterministic CI algorithm. This is NOT a production Rule Issuer.
export const SOURCE='CI_SYNTHETIC_MATCHING_INPUTS_NOT_PRODUCTION';
export const forbidden=new Set(['transmission','configuration','transfer_count','city_distance','emission','source_type','registration_year']);
const canonical=o=>JSON.stringify(Object.keys(o).sort().reduce((a,k)=>(a[k]=o[k],a),{}));
export function resolveRules(description,rules,scope={}){
 if(typeof description!=='string'||description.trim().length<2||description.length>1024)
  return {ready:false,reason:'SALES_MATCHING_DESCRIPTION_REQUIRED',conditions:[],conflicts:[]};
 const selected=new Map(),conflicts=new Set();
 const normalized=description.normalize('NFKC').toLowerCase();
 const order={model_year:5,series_year:4,series:3,brand:2,global:1};
 const applicable=r=>{
  if(!order[r.scope_kind]||r.scope_key&&r.scope_key!==String(scope[r.scope_kind]||''))return false;
  return typeof r.phrase==='string'&&normalized.includes(r.phrase.normalize('NFKC').toLowerCase());
 };
 for(const r of rules.filter(applicable).sort((a,b)=>(order[b.scope_kind]-order[a.scope_kind])||String(a.rule_id).localeCompare(String(b.rule_id)))){
  const c=r.condition;
  if(!c||typeof c.field!=='string'||forbidden.has(c.field)||!['hard','preferred'].includes(c.mode)||
   !['eq','in','max','min','exclude','budget'].includes(c.op))continue;
  const rank=order[r.scope_kind], existing=selected.get(c.field);
  if(existing?.rank>rank)continue;
  if(existing&&existing.rank===rank&&canonical(existing.value)!==canonical(c)){
   conflicts.add(c.field);selected.delete(c.field);continue;
  }
  if(conflicts.has(c.field))continue;
  selected.set(c.field,{rank,value:c,ruleId:r.rule_id,source:SOURCE});
 }
 const conditions=[...selected.values()].map(x=>({...x.value,sourceRuleId:x.ruleId,provenance:SOURCE}));
 return {ready:conditions.length>0,reason:conditions.length?'RULES_PARSED':'NO_EXECUTABLE_RULE',conditions,conflicts:[...conflicts].sort()};
}
const has=(obj,k)=>Object.prototype.hasOwnProperty.call(obj,k);
function compare(condition,actual){
 if(actual===null||actual===undefined)return null;
 if(condition.op==='budget'){
  if(!Number.isSafeInteger(actual)||!Number.isSafeInteger(condition.value)||condition.value<=0)return null;
  const a=BigInt(actual),b=BigInt(condition.value);
  if(a<=b)return 'high';if(a*100n<=b*105n)return 'acceptable';return 'no_match';
 }
 if(condition.op==='in'||condition.op==='eq')return (Array.isArray(condition.values)?condition.values:[condition.value]).includes(actual)?'high':'no_match';
 if(condition.op==='exclude')return (Array.isArray(condition.values)?condition.values:[condition.value]).includes(actual)?'no_match':'high';
 if(condition.op==='max')return Number.isFinite(actual)&&actual<=condition.value?'high':'no_match';
 if(condition.op==='min')return Number.isFinite(actual)&&actual>=condition.value?'high':'no_match';
 return null;
}
export function tierFor(conditions,vehicleFacts){
 if(!Array.isArray(conditions)||conditions.length===0)return {tier:null,reason:'NO_CONDITIONS_NOT_READY',explanations:[]};
 let failed=false,uncertain=false,soft=false;
 const explanations=[];
 for(const c of conditions){
  if(forbidden.has(c.field))continue;
  const fact=vehicleFacts?.[c.field],value=fact?.conflict?null:fact?.value;
  const state=compare(c,value);
  explanations.push({field:c.field,mode:c.mode,op:c.op,outcome:state??'unknown',factSource:fact?.source??null,ruleId:c.sourceRuleId??null});
  if(c.mode==='hard'){
   if(state==='no_match')failed=true;
   else if(state===null)uncertain=true;
   else if(state==='acceptable')soft=true;
  }else if(state!=='high'&&state!==null)soft=true;
 }
 return {tier:failed?'no_match':uncertain?'confirmation_needed':soft?'acceptable':'high',reason:failed?'HARD_FAILED':uncertain?'HARD_UNKNOWN':soft?'TOLERANCE_OR_PREFERRED':'ALL_DEFINED_CONDITIONS_MET',explanations};
}
export function eligibleVehicle(v){
 return !!v&&v.source_sale_status==='active'&&!v.archived_at&&!v.ended_at&&!v.draft&&v.available!==false;
}
export function failClosed(){return {allowed:false,code:'F05_7_PRODUCTION_MATCHING_RULE_ISSUERS_SOURCE_GAP'};}
