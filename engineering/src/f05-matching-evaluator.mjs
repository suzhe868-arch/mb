// Strict PDM-12 subset for isolated test-only Matching. NO NLP / AI guessing.
// Canonical staff description is an explicit deterministic contract, NOT a live Rule Dictionary.
const fields=new Set(['brandId','minModelYear','maxMileageKm','budgetCents','interiorColor',
 'exteriorColor','powerType','displacementMinCc','displacementMaxCc','displacementCc','excludeCondition']);
const ENUMS={
 exteriorColor:new Set(['black','white','grey','silver','red','blue','brown','gold','green']),
 powerType:new Set(['gasoline','diesel','hybrid','plugin_hybrid','electric']),
 excludeCondition:new Set(['major_accident','flood','fire','structural_damage'])
};
const exactId=s=>/^[1-9][0-9]{0,18}$/.test(s)&&BigInt(s)<=9223372036854775807n;
export function parseExplicitSalesDescription(text,{allowPreferredOnly=false}={}){
 if(typeof text!=='string'||text.length>500||text.length===0||text!==text.trim())
  return {ready:false,reason:'MISSING_OR_INVALID_SALES_DESCRIPTION'};
 const criteria={},ruleHits=[];
 for(const part of text.split(';')){
  const pair=/^([A-Za-z]+)=([A-Za-z0-9_|]+)$/.exec(part);
  if(!pair||!fields.has(pair[1])||Object.hasOwn(criteria,pair[1]))
   return {ready:false,reason:'UNSUPPORTED_OR_CONFLICTED_MATCHING_RULE'};
  const [full,k,v]=pair;
  if(k==='brandId'){if(!exactId(v))return {ready:false,reason:'INVALID_BRAND'};criteria[k]=v}
  else if(k==='minModelYear'){const n=Number(v);if(!/^[0-9]{4}$/.test(v)||n<1886||n>2200)return {ready:false,reason:'INVALID_MODEL_YEAR'};criteria[k]=n}
  else if(k==='maxMileageKm'){const n=Number(v);if(!/^[0-9]{1,7}$/.test(v)||n>2000000)return {ready:false,reason:'INVALID_MAX_MILEAGE'};criteria[k]=n}
  else if(k==='budgetCents'){if(!exactId(v)||BigInt(v)>=100000000000000n)return {ready:false,reason:'INVALID_CUSTOMER_BUDGET'};criteria[k]=v}
  else if(k==='interiorColor'){if(!['black','beige','brown','white','grey'].includes(v))return {ready:false,reason:'UNRECOGNIZED_INTERIOR_COLOR'};criteria[k]=v}
  else if(Object.hasOwn(ENUMS,k)){
   const list=v.split('|');
   if(list.length>6||list.some(x=>!ENUMS[k].has(x))||new Set(list).size!==list.length)
    return {ready:false,reason:'INVALID_HARD_MULTIVALUE_'+k};
   criteria[k]=list;
  }else if(['displacementMinCc','displacementMaxCc','displacementCc'].includes(k)){
   const list=v.split('|');
   if((k!=='displacementCc'&&list.length!==1)||list.length>5||
      list.some(x=>!/^[0-9]{3,5}$/.test(x)||Number(x)<100||Number(x)>10000)||
      new Set(list).size!==list.length)return {ready:false,reason:'INVALID_DISPLACEMENT'};
   criteria[k]=k==='displacementCc'?list.map(Number):Number(list[0]);
  }
  ruleHits.push({key:k,sourceToken:full,scope:'EXPLICIT_TEST_CANONICAL',version:1});
 }
 if(criteria.displacementMinCc!==undefined&&criteria.displacementMaxCc!==undefined&&
   criteria.displacementMinCc>criteria.displacementMaxCc)return {ready:false,reason:'DISPLACEMENT_RANGE_CONFLICT'};
 if(!allowPreferredOnly&&!['brandId','minModelYear','maxMileageKm','budgetCents','exteriorColor',
  'powerType','displacementMinCc','displacementMaxCc','displacementCc','excludeCondition'].some(k=>Object.hasOwn(criteria,k)))
  return {ready:false,reason:'NO_EXECUTABLE_HARD_CRITERIA'};
 return {ready:true,criteria,ruleHits};
}
export function evaluateExplicitMatch(parsed,facts){
 if(!parsed?.ready||!facts||typeof facts!=='object')throw Error('MATCH_READINESS_REQUIRED');
 const c=parsed.criteria,components=[];
 const cmp=(name,requested,value)=>{
  let outcome='pass';
  if(value===null||value===undefined)outcome='unknown';
  else if(name==='brandId')outcome=String(value)===String(requested)?'pass':'fail';
  else if(name==='minModelYear')outcome=Number(value)>=requested?'pass':'fail';
  else if(name==='maxMileageKm')outcome=Number(value)<=requested?'pass':'fail';
  components.push({key:name,category:'hard',requested,actual:value??null,outcome});
 };
 for(const name of ['brandId','minModelYear','maxMileageKm'])
  if(Object.hasOwn(c,name))cmp(name,c[name],facts[name]??null);
 if(Object.hasOwn(c,'budgetCents')){
  const price=facts.customerDisplayCents;
  let outcome='unknown';
  if(price!==null&&price!==undefined){
   const value=BigInt(price),budget=BigInt(c.budgetCents);
   outcome=value<=budget?'pass':value*100n<=budget*105n?'tolerance':'fail';
  }
  components.push({key:'budgetCents',category:'hard',requested:c.budgetCents,
   actual:price===null||price===undefined?null:String(price),outcome,tolerancePercent:5});
 }
 if(Object.hasOwn(c,'interiorColor')){
  const actual=facts.interiorColor??null;
  components.push({key:'interiorColor',category:'preferred',requested:c.interiorColor,
   actual,outcome:actual===c.interiorColor?'pass':'preferred_miss'});
 }
 for(const key of ['exteriorColor','powerType']){
  if(!Object.hasOwn(c,key))continue;
  const actual=facts[key]??null;
  components.push({key,category:'hard',requested:c[key],actual,
   outcome:actual===null?'unknown':c[key].includes(actual)?'pass':'fail',sameField:'OR'});
 }
 const cc=facts.displacementCc??null;
 for(const k of ['displacementMinCc','displacementMaxCc','displacementCc']){
  if(!Object.hasOwn(c,k))continue;
  const outcome=cc===null?'unknown':k==='displacementMinCc'?cc>=c[k]?'pass':'fail':
   k==='displacementMaxCc'?cc<=c[k]?'pass':'fail':c[k].includes(cc)?'pass':'fail';
  components.push({key:k,category:'hard',requested:c[k],actual:cc,outcome});
 }
 if(Object.hasOwn(c,'excludeCondition')){
  const value=facts.conditionFlags;
  const known=Array.isArray(value)&&value.every(x=>ENUMS.excludeCondition.has(x));
  components.push({key:'excludeCondition',category:'hard',requested:c.excludeCondition,
   actual:known?value:null,comparison:'HARD_EXCLUSION',
   outcome:!known?'unknown':value.some(x=>c.excludeCondition.includes(x))?'fail':'pass'});
 }
 // Explicit hard failure wins even when other hard facts are unknown; no guess.
 const hard=components.filter(x=>x.category==='hard');
 const tier=hard.some(x=>x.outcome==='fail')?'no_match':
    hard.some(x=>x.outcome==='unknown')?'confirmation_needed':
    components.some(x=>x.outcome==='tolerance'||x.outcome==='preferred_miss')?'acceptable':'high';
 return {tier,explanation:{version:1,authority:'PDM12_TEST_ONLY_EXPLICIT_PARTIAL_FIELDS',salesDescription:parsed,
  normalizedCriteria:c,components,tier,
  reason:tier==='no_match'?'EXPLICIT_HARD_FAILURE':
   tier==='confirmation_needed'?'KNOWN_HARD_CRITERION_VEHICLE_FACT_UNKNOWN':
   tier==='acceptable'?'EXPLICIT_TOLERANCE_OR_PREFERRED_MISS':'ALL_EXPLICIT_CRITERIA_PASS',
  noRecommendation:true,noPriority:true,noVisibilityGrant:true,priceSource:'TEST_ONLY_CUSTOMER_DISPLAY_PRICE'}};
}
