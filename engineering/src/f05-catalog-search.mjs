// PDM-12/PDM-20 deterministic Rule Dictionary adapter for the disposable catalog.
import {createHash} from 'node:crypto';
import {parseDictionaryTokens} from './f05-matching-dictionary-parser.mjs';
const ID=/^[1-9][0-9]{0,18}$/;
const MAX_ID=9223372036854775807n;
const validId=v=>typeof v==='string'&&ID.test(v)&&BigInt(v)<=MAX_ID;
const CONTEXT_KEYS=new Set(['brandId','seriesId','modelId','modelYear']);
export function normalizeCatalogSearchExpression(input){
 if(typeof input!=='string'||input.length<2||input.length>500)return {ready:false,reason:'INVALID_SEARCH_EXPRESSION'};
 const normalized=input.trim().replace(/\s*;\s*/gu,';').replace(/\s+/gu,';');
 if(normalized.length<2||normalized.length>500||!/^[\p{L}\p{N}_;]+$/u.test(normalized))return {ready:false,reason:'INVALID_SEARCH_EXPRESSION'};
 const tokens=normalized.split(';');
 if(tokens.length>20||tokens.some(token=>token.length<2||token.length>60)||new Set(tokens).size!==tokens.length)return {ready:false,reason:'INVALID_SEARCH_EXPRESSION'};
 return {ready:true,normalizedExpression:normalized,tokens};
}
export function createIsolatedCatalogSearchService({pool,env=process.env}={}){
 if(!pool||typeof pool.query!=='function'||env.APP_ENV!=='test'||env.NODE_ENV!=='test'||
  env.API_HOST!=='127.0.0.1'||env.F05_CATALOG_TEST_CONSENT!=='I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY')
  throw Error('CATALOG_SEARCH_FORMAL_DICTIONARY_ISSUER_REQUIRED');
 return Object.freeze({
  async parse({expression,context={}}={}){
   const normalized=normalizeCatalogSearchExpression(expression);
   if(!normalized.ready)return normalized;
   if(!context||typeof context!=='object'||Array.isArray(context)||Object.keys(context).some(k=>!CONTEXT_KEYS.has(k))||
    ['brandId','seriesId','modelId'].some(k=>context[k]!=null&&!validId(context[k]))||
    (context.modelYear!=null&&(!Number.isInteger(context.modelYear)||context.modelYear<1886||context.modelYear>2200)))
    return {ready:false,reason:'INVALID_SEARCH_CONTEXT'};
   const rows=(await pool.query("SELECT rule_id,token,mapped_key,mapped_value,scope_kind,brand_id,series_id,model_id,year_from,year_to,version,status "+
    "FROM public.f05_matching_dictionary_rules_test WHERE token=ANY($1::text[])",[normalized.tokens])).rows;
   if(!Array.isArray(rows))throw Error('CATALOG_SEARCH_DICTIONARY_ROWS_INVALID');
   const parsed=parseDictionaryTokens(normalized.normalizedExpression,rows,context);
   if(!parsed.ready)return {ready:false,reason:parsed.reason};
   const fingerprint=createHash('sha256').update(JSON.stringify({normalizedExpression:normalized.normalizedExpression,criteria:parsed.criteria,ruleHits:parsed.ruleHits})).digest('hex');
   return {ready:true,normalizedExpression:normalized.normalizedExpression,criteria:parsed.criteria,ruleHits:parsed.ruleHits,fingerprint,simulationOnly:true,productionReady:false};
  }
 });
}
