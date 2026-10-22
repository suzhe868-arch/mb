// F05 isolated real SQL read model. A positive row requires physical PostgreSQL
// Vehicle/Cycle AND a separate disposable test visibility proof. NOT production.
import {createHash, createHmac, timingSafeEqual} from 'node:crypto';
const ALLOWED_SOURCES=new Set(['wholesale','mingbang','four_s']);
const ALLOWED_SORTS=new Set(['newest','price_asc','price_desc','registration_year_desc','registration_year_asc','mileage_asc','mileage_desc']);
const DATE=/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,6})?(?:Z|[+-]\d\d:\d\d)$/;
const POS=/^[1-9]\d{0,18}$/;
const PG_BIGINT_MAX=9223372036854775807n;
const validPgId=v=>typeof v==='string'&&POS.test(v)&&BigInt(v)<=PG_BIGINT_MAX;
const validModelYear=v=>Number.isInteger(v)&&v>=1886&&v<=2200;
function safeName(v,label){
 if(v==null)return null;
 if(typeof v!=='string'||v.length===0||v.length>160||v.trim()!==v||/[\x00-\x1f\x7f]/.test(v))throw Error('CATALOG_INVALID_'+label);
 return v;
}
const reject=(code,status=400)=>Object.freeze({status,body:{code}});
const isValidTime=t=>typeof t==='string'&&DATE.test(t)&&Number.isFinite(Date.parse(t));
function safeCoverPath(path){
 if(path===null||path===undefined)return null;
 if(typeof path!=='string'||path.length<1||path.length>400)return null;
 if(!/^[A-Za-z0-9_.~-]+(?:\/[A-Za-z0-9_.~-]+)*$/.test(path))return null;
 if(path.split('/').some(segment=>segment==='.'||segment==='..'))return null;
 return path;
}
const safetoken=o=>Buffer.from(JSON.stringify(o)).toString('base64url');
function mac(text,key){return createHmac('sha256',key).update(text).digest('base64url')}
function normalizeSortValue(sort,value){
 if(sort==='newest'){
  if(value!==null&&value!==undefined)throw Error('CATALOG_SORT_CURSOR_VALUE');
  return null;
 }
 if(value===null||value===undefined)return null;
 const text=String(value);
 if(!/^(0|[1-9][0-9]{0,14})$/.test(text))throw Error('CATALOG_SORT_CURSOR_VALUE');
 const n=BigInt(text);
 if(sort.startsWith('price_')&&(n<=0n||n>=100000000000000n))throw Error('CATALOG_SORT_CURSOR_VALUE');
 if(sort.startsWith('registration_year_')&&(n<1886n||n>2200n))throw Error('CATALOG_SORT_CURSOR_VALUE');
 if(sort.startsWith('mileage_')&&(n<0n||n>2000000n))throw Error('CATALOG_SORT_CURSOR_VALUE');
 return text;
}
const validSearchHash=v=>v===null||typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
export function encodeCursor({at,id,source,sort,modelId=null,brandId=null,seriesId=null,modelYear=null,sortValue=null,searchHash=null},key){
 if(!isValidTime(at)||!validPgId(String(id))||!ALLOWED_SOURCES.has(source)||!ALLOWED_SORTS.has(sort)||([modelId,brandId,seriesId].some(v=>v!==null&&!validPgId(v))||(modelYear!==null&&!validModelYear(modelYear)))||!validSearchHash(searchHash)||!Buffer.isBuffer(key)||key.length<32)throw Error('CATALOG_CURSOR_INPUT');
 const k=normalizeSortValue(sort,sortValue);
 let payload;
 if(searchHash===null)payload=sort==='newest'?{v:4,at,id:String(id),source,sort,modelId,brandId,seriesId,modelYear}:{v:5,at,id:String(id),source,sort,modelId,brandId,seriesId,modelYear,n:k===null?1:0,k};
 else payload=sort==='newest'?{v:6,at,id:String(id),source,sort,modelId,brandId,seriesId,modelYear,searchHash}:{v:6,at,id:String(id),source,sort,modelId,brandId,seriesId,modelYear,n:k===null?1:0,k,searchHash};
 const content=safetoken(payload);
 return content+'.'+mac(content,key);
}
export function decodeCursor(value,key,source,sort,modelId=null,brandId=null,seriesId=null,modelYear=null,searchHash=null){
 if(typeof value!=='string'||value.length>512||!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value))throw Error('BAD_CURSOR');
 const [str,signature]=value.split('.'),expected=mac(str,key),a=Buffer.from(expected),b=Buffer.from(signature);
 if(a.length!==b.length||!timingSafeEqual(a,b))throw Error('BAD_CURSOR');
 let p;try{p=JSON.parse(Buffer.from(str,'base64url').toString('utf8'))}catch{throw Error('BAD_CURSOR')}
 const common=p&&p.source===source&&p.sort===sort&&p.modelId===modelId&&p.brandId===brandId&&p.seriesId===seriesId&&p.modelYear===modelYear&&validPgId(p.id)&&isValidTime(p.at)&&
  (searchHash===null?p.searchHash===undefined:p.searchHash===searchHash&&validSearchHash(p.searchHash));
 if(!common)throw Error('BAD_CURSOR');
 if(searchHash===null){
  if(sort==='newest'){if(Object.keys(p).sort().join(',')!=='at,brandId,id,modelId,modelYear,seriesId,sort,source,v'||p.v!==4)throw Error('BAD_CURSOR')}
  else{
   if(Object.keys(p).sort().join(',')!=='at,brandId,id,k,modelId,modelYear,n,seriesId,sort,source,v'||p.v!==5||![0,1].includes(p.n))throw Error('BAD_CURSOR');
   const k=normalizeSortValue(sort,p.k);if((k===null?1:0)!==p.n)throw Error('BAD_CURSOR');
  }
 }else{
  if(sort==='newest'){if(Object.keys(p).sort().join(',')!=='at,brandId,id,modelId,modelYear,searchHash,seriesId,sort,source,v'||p.v!==6)throw Error('BAD_CURSOR')}
  else{
   if(Object.keys(p).sort().join(',')!=='at,brandId,id,k,modelId,modelYear,n,searchHash,seriesId,sort,source,v'||p.v!==6||![0,1].includes(p.n))throw Error('BAD_CURSOR');
   const k=normalizeSortValue(sort,p.k);if((k===null?1:0)!==p.n)throw Error('BAD_CURSOR');
  }
 }
 return p;
}
// Preserve PostgreSQL microseconds in the signed keyset: JS Date rounds to milliseconds.
// The lexicographic cursor must carry the same precision as the SQL ORDER BY tuple.
const SQL_UTC_MICROSECONDS="to_char(cy.started_at AT TIME ZONE 'UTC', 'YYYY-MM-DD\"T\"HH24:MI:SS.US\"Z\"')";
const BASE_SELECT=`SELECT v.vehicle_id AS "vehicleId",cy.listing_cycle_id AS "listingCycleId",v.source_type AS "source",${SQL_UTC_MICROSECONDS} AS "listingStartedAt",v.model_id AS "modelId",COALESCE(vm.brand_id,vs.brand_id) AS "brandId",vm.series_id AS "seriesId",vb.brand_name AS "brandName",vs.series_name AS "seriesName",vm.model_name AS "modelName",vm.model_year AS "modelYear",price.customer_display_cents AS "sortPriceCents",sortfacts.first_registration_year AS "sortRegistrationYear",sortfacts.mileage_km AS "sortMileageKm",cover.relative_path AS "coverImagePath" FROM public.vehicles v LEFT JOIN public.vehicle_models vm ON vm.model_id=v.model_id LEFT JOIN public.vehicle_series vs ON vs.series_id=vm.series_id LEFT JOIN public.vehicle_brands vb ON vb.brand_id=COALESCE(vm.brand_id,vs.brand_id) JOIN public.vehicle_listing_cycles cy ON cy.vehicle_id=v.vehicle_id JOIN public.f05_real_catalog_visibility_test p ON p.vehicle_id=v.vehicle_id AND p.listing_cycle_id=cy.listing_cycle_id AND p.source_type=v.source_type
LEFT JOIN public.f05_catalog_price_display_proof_test price
 ON price.vehicle_id=v.vehicle_id AND price.listing_cycle_id=cy.listing_cycle_id
 AND price.source_type=v.source_type AND price.issuer='DISPOSABLE_TEST_ONLY'
 AND price.expires_at>statement_timestamp()
LEFT JOIN public.f05_catalog_sort_facts_test sortfacts
 ON sortfacts.vehicle_id=v.vehicle_id AND sortfacts.listing_cycle_id=cy.listing_cycle_id
 AND sortfacts.source_type=v.source_type AND sortfacts.issuer='DISPOSABLE_TEST_ONLY'
 AND sortfacts.expires_at>statement_timestamp()
LEFT JOIN LATERAL (
 SELECT vi.relative_path FROM public.vehicle_images vi
 JOIN public.f05_real_catalog_photo_order_test po
  ON po.image_id=vi.image_id AND po.vehicle_id=vi.vehicle_id
  AND po.source_type=v.source_type
  AND po.verified_isolation='DISPOSABLE_TEST_PROOF_NOT_SIGNED'
 WHERE vi.vehicle_id=v.vehicle_id
  AND vi.relative_path IS NOT NULL
  AND length(vi.relative_path) BETWEEN 1 AND 400
  AND vi.relative_path ~ '^[A-Za-z0-9_.~-]+(/[A-Za-z0-9_.~-]+)*$'
  AND vi.relative_path !~ '(^|/)[.][.]?(/|$)'
 ORDER BY po.original_sort_index ASC,vi.image_id ASC LIMIT 1
) cover ON TRUE WHERE (vm.brand_id IS NULL OR vs.series_id IS NULL OR vm.brand_id=vs.brand_id) AND cy.ended_at IS NULL AND NOT EXISTS(SELECT 1 FROM public.vehicle_listing_cycles other WHERE other.vehicle_id=v.vehicle_id AND other.listing_cycle_id<>cy.listing_cycle_id AND other.ended_at IS NULL) AND v.archived_at IS NULL AND v.platform_visibility='visible' AND ((v.source_type='wholesale' AND v.source_sale_status='active') OR (v.source_type IN('mingbang','four_s') AND v.source_sale_status='available')) AND p.allow_anonymous=true AND p.verified_isolation='DISPOSABLE_TEST_PROOF_NOT_SIGNED' AND p.expires_at>statement_timestamp() AND NOT EXISTS(SELECT 1 FROM public.f05_real_catalog_protections_test pr WHERE pr.vehicle_id=v.vehicle_id AND pr.listing_cycle_id=cy.listing_cycle_id AND pr.ended_at IS NULL)
 AND NOT EXISTS(SELECT 1 FROM public.f05_priority_safe_active_test active_priority
 WHERE active_priority.vehicle_id=v.vehicle_id
  AND active_priority.listing_cycle_id=cy.listing_cycle_id)`;
const CATALOG_FILTERS=' AND v.source_type=$1 AND ($4::bigint IS NULL OR v.model_id=$4::bigint) AND ($5::bigint IS NULL OR COALESCE(vm.brand_id,vs.brand_id)=$5::bigint) AND ($6::bigint IS NULL OR vm.series_id=$6::bigint) AND ($7::integer IS NULL OR vm.model_year=$7::integer)';
const SORTED_FILTERS=' AND v.source_type=$1 AND ($2::bigint IS NULL OR v.model_id=$2::bigint) AND ($3::bigint IS NULL OR COALESCE(vm.brand_id,vs.brand_id)=$3::bigint) AND ($4::bigint IS NULL OR vm.series_id=$4::bigint) AND ($5::integer IS NULL OR vm.model_year=$5::integer)';
export const SQL_CATALOG_LIST=BASE_SELECT+CATALOG_FILTERS+' AND ($2::timestamptz IS NULL OR (cy.started_at,cy.listing_cycle_id) < ($2::timestamptz,$3::bigint)) ORDER BY cy.started_at DESC,cy.listing_cycle_id DESC LIMIT 16';
const SORT_CONFIG=Object.freeze({
 price_asc:{column:'price.customer_display_cents',direction:'ASC',field:'sortPriceCents'},
 price_desc:{column:'price.customer_display_cents',direction:'DESC',field:'sortPriceCents'},
 registration_year_desc:{column:'sortfacts.first_registration_year',direction:'DESC',field:'sortRegistrationYear'},
 registration_year_asc:{column:'sortfacts.first_registration_year',direction:'ASC',field:'sortRegistrationYear'},
 mileage_asc:{column:'sortfacts.mileage_km',direction:'ASC',field:'sortMileageKm'},
 mileage_desc:{column:'sortfacts.mileage_km',direction:'DESC',field:'sortMileageKm'},
});
function buildSortedSql(cfg){
 const column=cfg.column,direction=cfg.direction,cmp=direction==='ASC'?'>':'<';
 const rank='CASE WHEN '+column+' IS NULL THEN 1 ELSE 0 END';
 return BASE_SELECT+SORTED_FILTERS+
  ' AND ($6::integer IS NULL OR '+rank+'>$6::integer OR ('+rank+'=$6::integer AND ('+
  '($6::integer=0 AND (('+column+')::bigint '+cmp+' $7::bigint OR (('+column+')::bigint=$7::bigint AND (cy.started_at,cy.listing_cycle_id)<($8::timestamptz,$9::bigint)))) OR '+
  '($6::integer=1 AND (cy.started_at,cy.listing_cycle_id)<($8::timestamptz,$9::bigint))))) '+
  'ORDER BY '+rank+' ASC,'+column+' '+direction+' NULLS LAST,cy.started_at DESC,cy.listing_cycle_id DESC LIMIT 16';
}
export const SQL_CATALOG_SORTS=Object.freeze(Object.fromEntries(Object.entries(SORT_CONFIG).map(([name,cfg])=>[name,buildSortedSql(cfg)])));
export const SQL_CATALOG_DETAIL=BASE_SELECT+` AND v.vehicle_id=$1 LIMIT 2`;
export const SQL_CATALOG_STATS=`SELECT source AS "source",COUNT(DISTINCT "vehicleId")::text AS "vehicleCount" FROM (${BASE_SELECT}) AS eligible GROUP BY source ORDER BY source`;
function safeItem(r,priceProjection=null){
 const id=String(r?.vehicleId??''),cycle=String(r?.listingCycleId??''),source=r?.source;
 const at=r?.listingStartedAt instanceof Date?r.listingStartedAt.toISOString():r?.listingStartedAt;
 if(!validPgId(id)||!validPgId(cycle)||!ALLOWED_SOURCES.has(source)||!isValidTime(at))throw Error('CATALOG_INVALID_DB_PROJECTION');
 const model=r.modelId==null?null:String(r.modelId),brandId=r.brandId==null?null:String(r.brandId),seriesId=r.seriesId==null?null:String(r.seriesId);
 if([model,brandId,seriesId].some(v=>v!==null&&!validPgId(v)))throw Error('CATALOG_INVALID_MASTER_ID');
 const brandName=safeName(r.brandName,'BRAND'),seriesName=safeName(r.seriesName,'SERIES'),modelName=safeName(r.modelName,'MODEL');
 const modelYear=r.modelYear==null?null:r.modelYear;
 if(modelYear!==null&&!validModelYear(modelYear))throw Error('CATALOG_INVALID_MODEL_YEAR');
 if((model===null&&(brandId!==null||seriesId!==null||brandName!==null||seriesName!==null||modelName!==null||modelYear!==null))||(brandId===null&&brandName!==null)||(seriesId===null&&seriesName!==null))throw Error('CATALOG_INCONSISTENT_MASTER');
 const item={vehicleId:id,listingCycleId:cycle,source,listingStartedAt:at.slice(0,10),modelId:model,brandId,seriesId,brandName,seriesName,modelName,modelYear,coverImagePath:safeCoverPath(r.coverImagePath),price:priceProjection?.price??null,priceState:priceProjection?.priceState??'PRICE_ENTITLEMENT_DEPENDENCY_BLOCKED',catalogState:'ISOLATED_TEST_PROJECTION_NOT_PRODUCTION'};
 if(priceProjection?.includePriceFields===true){item.priceCents=priceProjection.priceCents??null;item.priceDisplay=priceProjection.priceDisplay??null}
 return Object.freeze(item);
}
function validPriceCents(v){return typeof v==='string'&&/^[1-9][0-9]{0,13}$/.test(v)&&BigInt(v)<100000000000000n}
function buildSearchFilters(criteria,minPriceCents,maxPriceCents,startIndex){
 const clauses=[],values=[],factClauses=[];let next=startIndex;
 const add=(builder,value)=>{const p='$'+next++;clauses.push(builder(p));values.push(value)};
 const addFact=(builder,value)=>{const p='$'+next++;factClauses.push(builder(p));values.push(value)};
 if(minPriceCents!==null)add(p=>'price.customer_display_cents IS NOT NULL AND price.customer_display_cents >= '+p+'::bigint',minPriceCents);
 if(maxPriceCents!==null)add(p=>'price.customer_display_cents IS NOT NULL AND price.customer_display_cents <= '+p+'::bigint',maxPriceCents);
 const c=criteria??{};
 if(c.brandId!==undefined)add(p=>'COALESCE(vm.brand_id,vs.brand_id)='+p+'::bigint',c.brandId);
 if(c.minModelYear!==undefined)add(p=>'vm.model_year >= '+p+'::integer',c.minModelYear);
 if(c.budgetCents!==undefined)add(p=>'price.customer_display_cents IS NOT NULL AND price.customer_display_cents <= '+p+'::bigint',c.budgetCents);
 if(c.maxMileageKm!==undefined)addFact(p=>'mf.mileage_km <= '+p+'::integer',c.maxMileageKm);
 if(c.interiorColor!==undefined)addFact(p=>'mf.interior_color = '+p+'::text',c.interiorColor);
 if(c.exteriorColor!==undefined)addFact(p=>'mf.exterior_color = ANY('+p+'::text[])',c.exteriorColor);
 if(c.powerType!==undefined)addFact(p=>'mf.power_type = ANY('+p+'::text[])',c.powerType);
 if(c.displacementMinCc!==undefined)addFact(p=>'mf.displacement_cc >= '+p+'::integer',c.displacementMinCc);
 if(c.displacementMaxCc!==undefined)addFact(p=>'mf.displacement_cc <= '+p+'::integer',c.displacementMaxCc);
 if(c.displacementCc!==undefined)addFact(p=>'mf.displacement_cc = ANY('+p+'::integer[])',c.displacementCc);
 if(c.excludeCondition!==undefined)addFact(p=>'NOT (mf.condition_flags && '+p+'::text[])',c.excludeCondition);
 if(factClauses.length)clauses.push("EXISTS (SELECT 1 FROM public.f05_matching_vehicle_facts_test mf WHERE mf.vehicle_id=v.vehicle_id AND mf.listing_cycle_id=cy.listing_cycle_id AND mf.issuer='DISPOSABLE_TEST_ONLY' AND mf.expires_at>statement_timestamp() AND "+factClauses.join(' AND ')+")");
 return {clauses,values};
}
function appendSearchFilters(sql,clauses){
 if(!clauses.length)return sql;
 const order=sql.lastIndexOf(' ORDER BY ');
 if(order<0)throw Error('CATALOG_SEARCH_SQL_ORDER_MISSING');
 return sql.slice(0,order)+' '+clauses.map(c=>'AND '+c).join(' ')+sql.slice(order);
}
export function createCatalogService({pool,cursorKey,customerReadService=null,searchService=null}={}){
 if(!pool||typeof pool.query!=='function'||!Buffer.isBuffer(cursorKey)||cursorKey.length<32)throw Error('CATALOG_DEPENDENCIES_REQUIRED');
 async function projectRows(rows,customerToken,view){
  if(!customerReadService)return {status:200,projections:rows.map(()=>null)};
  return customerReadService.projectRows({token:customerToken??null,rows,view});
 }
 return {
  async stats(){
   const rows=(await pool.query(SQL_CATALOG_STATS,[])).rows;
   if(!Array.isArray(rows)||rows.length>3)throw Error('CATALOG_COUNT_PROJECTION_INVALID');
   const bySource={wholesale:0,mingbang:0,four_s:0},seen=new Set();
   for(const row of rows){
    const source=row?.source,value=row?.vehicleCount;
    if(!ALLOWED_SOURCES.has(source)||seen.has(source)||typeof value!=='string'||!/^(0|[1-9][0-9]*)$/.test(value)||BigInt(value)>BigInt(Number.MAX_SAFE_INTEGER))throw Error('CATALOG_COUNT_PROJECTION_INVALID');
    seen.add(source);bySource[source]=Number(value);
   }
   const total=Object.values(bySource).reduce((a,b)=>a+b,0);
   if(!Number.isSafeInteger(total))throw Error('CATALOG_COUNT_PROJECTION_INVALID');
   return {status:200,body:{region:'national',total,bySource,todayNewCount:null,todayNewState:'FIRST_SEEN_DEPENDENCY_BLOCKED',productionReady:false}};
  },
  async list(params,{customerToken=null}={}){
   if(!params||typeof params!=='object')return reject('INVALID_QUERY');
   const keys=Object.keys(params),allowed=['source','sort','cursor','pageSize','region','modelId','brandId','seriesId','modelYear','q','search','minPriceCents','maxPriceCents'];
   if(keys.some(k=>!allowed.includes(k)))return reject('UNSUPPORTED_FILTER');
   if(params.q!==undefined&&params.search!==undefined)return reject('AMBIGUOUS_SEARCH_INPUT');
   if(params.region!==undefined&&params.region!=='national')return reject('UNSUPPORTED_REGION');
   if(params.pageSize!==undefined&&params.pageSize!=='15')return reject('INVALID_PAGE_SIZE');
   const source=params.source??'wholesale',sort=params.sort??'newest';
   if(!ALLOWED_SOURCES.has(source)||!ALLOWED_SORTS.has(sort))return reject('INVALID_CATALOG_FILTER');
   const modelId=params.modelId??null,brandId=params.brandId??null,seriesId=params.seriesId??null;
   if(modelId!==null&&!validPgId(modelId))return reject('INVALID_MODEL_ID');
   if(brandId!==null&&!validPgId(brandId))return reject('INVALID_BRAND_ID');
   if(seriesId!==null&&!validPgId(seriesId))return reject('INVALID_SERIES_ID');
   const modelYear=params.modelYear===undefined?null:Number(params.modelYear);
   const yearStringValid=typeof params.modelYear==='string'&&params.modelYear.length===4&&[...params.modelYear].every(ch=>ch>='0'&&ch<='9');
   if(params.modelYear!==undefined&&(!yearStringValid||!validModelYear(modelYear)))return reject('INVALID_MODEL_YEAR');
   const minPriceCents=params.minPriceCents===undefined?null:params.minPriceCents,maxPriceCents=params.maxPriceCents===undefined?null:params.maxPriceCents;
   if((minPriceCents!==null&&!validPriceCents(minPriceCents))||(maxPriceCents!==null&&!validPriceCents(maxPriceCents))||(minPriceCents!==null&&maxPriceCents!==null&&BigInt(minPriceCents)>BigInt(maxPriceCents)))return reject('INVALID_PRICE_RANGE');
   const hasSearch=params.q!==undefined||params.search!==undefined,rawExpression=params.q??params.search;
   let search=null;
   if(hasSearch){
    if(!searchService||typeof searchService.parse!=='function')return reject('CATALOG_SEARCH_NOT_READY',503);
    search=await searchService.parse({expression:rawExpression,context:{brandId,seriesId,modelId,modelYear}});
    if(!search.ready){
     const invalid=search.reason==='INVALID_SEARCH_EXPRESSION'||search.reason==='INVALID_SEARCH_CONTEXT';
     return {status:invalid?400:409,body:{code:invalid?'INVALID_SEARCH_EXPRESSION':'CATALOG_SEARCH_NOT_READY',reason:search.reason,productionReady:false}};
    }
    if(search.criteria.brandId!==undefined&&brandId!==null&&String(search.criteria.brandId)!==String(brandId))return {status:409,body:{code:'CATALOG_SEARCH_SCOPE_CONFLICT',productionReady:false}};
   }
   const hasDynamicFilter=hasSearch||minPriceCents!==null||maxPriceCents!==null;
   const searchHash=hasDynamicFilter?createHash('sha256').update(JSON.stringify({searchFingerprint:search?.fingerprint??null,minPriceCents,maxPriceCents})).digest('hex'):null;
   let cur;
   try{cur=params.cursor?decodeCursor(params.cursor,cursorKey,source,sort,modelId,brandId,seriesId,modelYear,searchHash):null}catch{return reject('INVALID_CURSOR')}
   const cfg=SORT_CONFIG[sort]??null,baseSql=sort==='newest'?SQL_CATALOG_LIST:SQL_CATALOG_SORTS[sort];
   const baseParams=sort==='newest'?[source,cur?.at??null,cur?.id??null,modelId,brandId,seriesId,modelYear]:[source,modelId,brandId,seriesId,modelYear,cur?.n??null,cur?.k??null,cur?.at??null,cur?.id??null];
   const filters=buildSearchFilters(search?.criteria??{},minPriceCents,maxPriceCents,baseParams.length+1),sql=appendSearchFilters(baseSql,filters.clauses);
   const rows=(await pool.query(sql,[...baseParams,...filters.values])).rows;
   if(!Array.isArray(rows))throw Error('CATALOG_DB_ROWS_INVALID');
   const selectedRows=rows.slice(0,15),projectionResult=await projectRows(selectedRows,customerToken,'list');
   if(projectionResult.status!==200)return projectionResult;
   if(!Array.isArray(projectionResult.projections)||projectionResult.projections.length!==selectedRows.length)throw Error('CATALOG_CUSTOMER_PROJECTION_INVALID');
   const page=[];
   for(let i=0;i<selectedRows.length;i++){const projection=projectionResult.projections[i]??null;if(projection?.visibleCurrent===false)continue;page.push(safeItem(selectedRows[i],projection))}
   let nextCursor=null;
   if(rows.length>15&&selectedRows.length){
    const last=selectedRows[selectedRows.length-1],at=last.listingStartedAt instanceof Date?last.listingStartedAt.toISOString():last.listingStartedAt;
    const sortValue=cfg?(last[cfg.field]??null):null;
    nextCursor=encodeCursor({at,id:last.listingCycleId,source,sort,modelId,brandId,seriesId,modelYear,sortValue,searchHash},cursorKey);
   }
   const body={items:page,nextCursor,pageSize:15,source,sort,region:'national',modelId,brandId,seriesId,modelYear,productionReady:false};
   if(search)body.searchExpression=search.normalizedExpression;
   if(minPriceCents!==null)body.minPriceCents=minPriceCents;
   if(maxPriceCents!==null)body.maxPriceCents=maxPriceCents;
   return {status:200,body};
  },
  async detail(id,{customerToken=null}={}){
   if(!validPgId(String(id)))return reject('INVALID_VEHICLE_ID');
   const rows=(await pool.query(SQL_CATALOG_DETAIL,[id])).rows;
   if(!Array.isArray(rows))throw Error('CATALOG_DB_ROWS_INVALID');
   if(rows.length>1)throw Error('CATALOG_MULTIPLE_CURRENT_VISIBLE_CYCLES');
   if(!rows.length)return reject('VEHICLE_NOT_VISIBLE',404);
   const projectionResult=await projectRows(rows,customerToken,'detail');
   if(projectionResult.status!==200)return projectionResult;
   if(!Array.isArray(projectionResult.projections)||projectionResult.projections.length!==1)throw Error('CATALOG_CUSTOMER_PROJECTION_INVALID');
   const projection=projectionResult.projections[0]??null;
   if(projection?.visibleCurrent===false)return reject('VEHICLE_NOT_VISIBLE',404);
   return {status:200,body:{vehicle:safeItem(rows[0],projection),productionReady:false}};
  }
 };
}
