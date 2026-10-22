// PDM-12 deterministic alias dictionary candidate. Never use AI/NLP or infer missing facts.
import {parseExplicitSalesDescription} from './f05-matching-evaluator.mjs';
const RANK={global:0,brand:1,series:2,series_year:3,model_year:4};
const ID=/^[1-9][0-9]{0,18}$/;
const id=x=>typeof x==='string'&&ID.test(x)&&BigInt(x)<=9223372036854775807n;
export function normalizeDictionaryDefinition(v){
 if(!v||typeof v!=='object'||Array.isArray(v)||
    Object.keys(v).some(k=>!['token','mappedKey','mappedValue','scopeKind','brandId','seriesId','modelId','yearFrom','yearTo','notes'].includes(k)))
    throw Error('RULE_INVALID_DEFINITION');
 if(typeof v.token!=='string'||!/^[\p{L}\p{N}_]{2,60}$/u.test(v.token)||
  !Object.hasOwn(RANK,v.scopeKind)||typeof v.mappedValue!=='string'||v.mappedValue.length>50||
  !['brandId','minModelYear','maxMileageKm','budgetCents','interiorColor','exteriorColor','powerType','displacementMinCc','displacementMaxCc','displacementCc','excludeCondition'].includes(v.mappedKey)||
  !parseExplicitSalesDescription(v.mappedKey+'='+v.mappedValue,{allowPreferredOnly:true}).ready)
    throw Error('RULE_INVALID_MAPPING');
 const b=v.brandId??null,s=v.seriesId??null,m=v.modelId??null;
 if([b,s,m].some(x=>x!==null&&!id(x)))throw Error('RULE_INVALID_SCOPE');
 const from=v.yearFrom??null,to=v.yearTo??null;
 if([from,to].some(x=>x!==null&&(!Number.isInteger(x)||x<1886||x>2200)))throw Error('RULE_INVALID_SCOPE');
 const valid=v.scopeKind==='global'&&b===null&&s===null&&m===null&&from===null&&to===null||
 v.scopeKind==='brand'&&b!==null&&s===null&&m===null&&from===null&&to===null||
 v.scopeKind==='series'&&b===null&&s!==null&&m===null&&from===null&&to===null||
 v.scopeKind==='series_year'&&b===null&&s!==null&&m===null&&from!==null&&to!==null&&from<=to||
 v.scopeKind==='model_year'&&b===null&&s===null&&m!==null&&from!==null&&from===to;
 if(!valid)throw Error('RULE_INVALID_SCOPE');
 const notes=v.notes??'';if(typeof notes!=='string'||notes.length>200)throw Error('RULE_INVALID_NOTES');
 return {token:v.token,mappedKey:v.mappedKey,mappedValue:v.mappedValue,
 scopeKind:v.scopeKind,brandId:b,seriesId:s,modelId:m,yearFrom:from,yearTo:to,notes};
}
export function parseDictionaryTokens(input,rows,ctx={}, {allowPreferredOnly=false}={}){
 if(typeof input!=='string'||input.length<2||input.length>500||
   !/^[\p{L}\p{N}_;]+$/u.test(input)||!Array.isArray(rows)||
   !ctx||typeof ctx!=='object'||Array.isArray(ctx))
  return {ready:false,reason:'RULE_PARSE_INVALID_INPUT'};
 const tokens=input.split(';');
 if(tokens.length>20||tokens.some(t=>t.length<2)||new Set(tokens).size!==tokens.length)
  return {ready:false,reason:'RULE_PARSE_DUPLICATE_OR_LIMIT'};
 const selected=[],out={};
 for(const token of tokens){
  const applicable=rows.filter(r=>{
   if(r.token!==token||r.status!=='enabled'||!Object.hasOwn(RANK,r.scope_kind))return false;
   switch(r.scope_kind){
    case 'global':return true;
    case 'brand':return ctx.brandId!=null&&String(ctx.brandId)===String(r.brand_id);
    case 'series':return ctx.seriesId!=null&&String(ctx.seriesId)===String(r.series_id);
    case 'series_year':return ctx.seriesId!=null&&String(ctx.seriesId)===String(r.series_id)&&
      Number.isInteger(ctx.modelYear)&&ctx.modelYear>=r.year_from&&ctx.modelYear<=r.year_to;
    case 'model_year':return ctx.modelId!=null&&String(ctx.modelId)===String(r.model_id)&&
      Number.isInteger(ctx.modelYear)&&ctx.modelYear===r.year_from;
   }
  });
  if(!applicable.length)return {ready:false,reason:'RULE_PARSE_UNKNOWN_TOKEN',token};
  const level=Math.max(...applicable.map(x=>RANK[x.scope_kind]));
  const high=applicable.filter(x=>RANK[x.scope_kind]===level);
  if(new Set(high.map(x=>JSON.stringify([x.mapped_key,x.mapped_value]))).size!==1)
   return {ready:false,reason:'RULE_PARSE_SCOPE_CONFLICT',token};
  const winner=high.sort((a,b)=>BigInt(a.rule_id)<BigInt(b.rule_id)?-1:1)[0];
  if(Object.hasOwn(out,winner.mapped_key)&&String(out[winner.mapped_key])!==String(winner.mapped_value))
   return {ready:false,reason:'RULE_PARSE_FIELD_CONFLICT',token};
  out[winner.mapped_key]=winner.mapped_value;
  selected.push({ruleId:String(winner.rule_id),ruleVersion:String(winner.version),
   token,scopeKind:winner.scope_kind,key:winner.mapped_key,value:winner.mapped_value});
 }
 const parsed=parseExplicitSalesDescription(Object.entries(out).map(([k,v])=>k+'='+v).join(';'),{allowPreferredOnly});
 if(!parsed.ready)return {ready:false,reason:'RULE_PARSE_NOT_EXECUTABLE'};
 return {ready:true,criteria:parsed.criteria,ruleHits:selected,simulationOnly:true,productionReady:false};
}
