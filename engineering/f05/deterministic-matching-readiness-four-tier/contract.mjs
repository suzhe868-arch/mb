// PDM-12 pure deterministic CI algorithm. This is NOT a production Rule Issuer.
export const SOURCE='CI_SYNTHETIC_MATCHING_INPUTS_NOT_PRODUCTION';
export const forbidden=new Set(['transmission','configuration','transfer_count','city_distance','emission','source_type','registration_year']);
const canonical=o=>JSON.stringify(Object.keys(o).sort().reduce((a,k)=>(a[k]=o[k],a),{}));
export function resolveRules(description,rules,scope={}){
 if(typeof description!=='string'||description.trim().length<2||description.length>1024)
  return {ready:false,reason:'SALES_MATCHING_DESCRIPTION_REQUIRED',conditions:[],conflicts:[]};
 const selected=new Map(),conflicts=new Map();
 const normalized=description.normalize('NFKC').toLowerCase();
 const order={model_year:5,series_year:4,series:3,brand:2,global:1};
 const applicable=r=>{
  if(!order[r.scope_kind])return false;
  if(r.scope_kind==='series_year'){
   // CI signed Rule scope "seriesId:yearStart-yearEnd"; never wildcard an invalid range.
   const m=/^([0-9]+):([0-9]{4})-([0-9]{4})$/.exec(String(r.scope_key||''));
   const yr=Number(scope.modelYear??scope.year),series=String(scope.series??scope.seriesId??'');
   if(!m||!Number.isSafeInteger(yr)||+m[2]>+m[3]||series!==m[1]||yr<+m[2]||yr>+m[3])return false;
  }else if(r.scope_key&&r.scope_key!==String(scope[r.scope_kind]??''))return false;
  return typeof r.phrase==='string'&&normalized.includes(r.phrase.normalize('NFKC').toLowerCase());
 };
 for(const r of rules.filter(applicable).sort((a,b)=>(order[b.scope_kind]-order[a.scope_kind])||String(a.rule_id).localeCompare(String(b.rule_id)))){
  const c=r.condition;
  if(!c||typeof c.field!=='string'||forbidden.has(c.field)||!['hard','preferred'].includes(c.mode)||
   !['eq','in','max','min','exclude','budget'].includes(c.op))continue;
  const rank=order[r.scope_kind], existing=selected.get(c.field);
  if(existing?.rank>rank)continue;
  if(existing&&existing.rank===rank&&canonical(existing.value)!==canonical(c)){
   conflicts.set(c.field,{field:c.field,mode:existing.value.mode==='hard'||c.mode==='hard'?'hard':'preferred',op:'eq',value:null,conflict:true,provenance:SOURCE});selected.delete(c.field);continue;
  }
  if(conflicts.has(c.field))continue;
  selected.set(c.field,{rank,value:c,ruleId:r.rule_id,source:SOURCE});
 }
 const conditions=[...selected.values()].map(x=>({...x.value,sourceRuleId:x.ruleId,provenance:SOURCE})).concat([...conflicts.values()]);
 return {ready:selected.size>0,reason:selected.size>0?'RULES_PARSED':'NO_EXECUTABLE_RULE',conditions,conflicts:[...conflicts.keys()].sort()};
}
// Preserve every original fact; at the same precedence level a genuine disagreement
// is a local unknown, never a silent timestamp/source-name winner.
const FACT_RANK={structured:4,inspection:3,description:2,vague:1};
export function normalizeFacts(raw={}){
 const out={};
 for(const [field,original] of Object.entries(raw||{})){
  if(original==null){out[field]={value:null,source:null,provenance:[],reason:'FACT_MISSING'};continue}
  const candidates=Array.isArray(original.candidates)?original.candidates.map(x=>({...x})):
    [{value:original.value,source:original.source||null,kind:original.kind||
       (original.source?.includes('INSPECTION')?'inspection':'structured')}];
  const viable=candidates.filter(x=>FACT_RANK[x.kind]>0&&x.value!==null&&x.value!==undefined);
  const rank=Math.max(0,...viable.map(x=>FACT_RANK[x.kind]));
  const winners=viable.filter(x=>FACT_RANK[x.kind]===rank);
  const canon=x=>JSON.stringify(x);
  const conflict=new Set(winners.map(x=>canon(x.value))).size>1;
  out[field]={value:conflict||rank===0?null:winners[0].value,source:conflict?null:winners[0]?.source??null,
    priority:rank,conflict,reason:conflict?'SAME_PRIORITY_CONFLICT':rank===0?'FACT_MISSING':'HIGHEST_PRIORITY_FACT',
    provenance:candidates.map(x=>({kind:x.kind,source:x.source||null,value:x.value,priority:FACT_RANK[x.kind]||0}))};
 }
 return out;
}

function compare(condition,actual){
 if(condition.conflict===true)return null;
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
  const fact=normalizeFacts(vehicleFacts)?.[c.field],value=fact?.conflict?null:fact?.value;
  const state=compare(c,value);
  explanations.push({field:c.field,mode:c.mode,op:c.op,outcome:state??'unknown',factSource:fact?.source??null,factReason:fact?.reason??'FACT_MISSING',provenance:fact?.provenance??[],ruleId:c.sourceRuleId??null});
  if(c.mode==='hard'){
   if(state==='no_match')failed=true;
   else if(state===null)uncertain=true;
   else if(state==='acceptable')soft=true;
  }else if(state!=='high')soft=true; // preferred missing is non-high, not hard unknown
 }
 return {tier:failed?'no_match':uncertain?'confirmation_needed':soft?'acceptable':'high',reason:failed?'HARD_FAILED':uncertain?'HARD_UNKNOWN':soft?'TOLERANCE_OR_PREFERRED':'ALL_DEFINED_CONDITIONS_MET',explanations};
}
export function eligibleVehicle(v){
 return !!v&&v.source_sale_status==='active'&&!v.archived_at&&!v.ended_at&&!v.draft&&v.available!==false;
}
export function failClosed(){return {allowed:false,code:'F05_7_PRODUCTION_MATCHING_RULE_ISSUERS_SOURCE_GAP'};}
