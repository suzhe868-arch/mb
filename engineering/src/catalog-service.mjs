// F05 isolated real SQL read model. A positive row requires physical PostgreSQL
// Vehicle/Cycle AND a separate disposable test visibility proof. NOT production.
import {createHmac, timingSafeEqual} from 'node:crypto';
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
export function encodeCursor({at,id,source,sort,modelId=null,brandId=null,seriesId=null,modelYear=null,sortValue=null},key){
 if(!isValidTime(at)||!validPgId(String(id))||!ALLOWED_SOURCES.has(source)||!ALLOWED_SORTS.has(sort)||([modelId,brandId,seriesId].some(v=>v!==null&&!validPgId(v))||(modelYear!==null&&!validModelYear(modelYear)))||!Buffer.isBuffer(key)||key.length<32)throw Error('CATALOG_CURSOR_INPUT');
 const k=normalizeSortValue(sort,sortValue);
 const payload=sort==='newest'
  ?{v:4,at,id:String(id),source,sort,modelId,brandId,seriesId,modelYear}
  :{v:5,at,id:String(id),source,sort,modelId,brandId,seriesId,modelYear,n:k===null?1:0,k};
 const content=safetoken(payload);
 return content+'.'+mac(content,key);
}
export function decodeCursor(value,key,source,sort,modelId=null,brandId=null,seriesId=null,modelYear=null){
 if(typeof value!=='string'||value.length>512||!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value))throw Error('BAD_CURSOR');
 const [str,signature]=value.split('.'),expected=mac(str,key);
 const a=Buffer.from(expected),b=Buffer.from(signature);
 if(a.length!==b.length||!timingSafeEqual(a,b))throw Error('BAD_CURSOR');
 let p;try{p=JSON.parse(Buffer.from(str,'base64url').toString('utf8'))}catch{throw Error('BAD_CURSOR')}
 const common=p&&p.source===source&&p.sort===sort&&p.modelId===modelId&&p.brandId===brandId&&p.seriesId===seriesId&&p.modelYear===modelYear&&validPgId(p.id)&&isValidTime(p.at);
 if(!common)throw Error('BAD_CURSOR');
 if(sort==='newest'){
  if(Object.keys(p).sort().join(',')!=='at,brandId,id,modelId,modelYear,seriesId,sort,source,v'||p.v!==4)throw Error('BAD_CURSOR');
 }else{
  if(Object.keys(p).sort().join(',')!=='at,brandId,id,k,modelId,modelYear,n,seriesId,sort,source,v'||p.v!==5||![0,1].includes(p.n))throw Error('BAD_CURSOR');
  const k=normalizeSortValue(sort,p.k);
  if((k===null?1:0)!==p.n)throw Error('BAD_CURSOR');
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
function safeItem(r){
 // Explicit property whitelist: SQL rows cannot put VIN / phone / internal prices into responses.
 const id=String(r?.vehicleId??''),cycle=String(r?.listingCycleId??'');
 const source=r?.source;
 let at=r?.listingStartedAt instanceof Date?r.listingStartedAt.toISOString():r?.listingStartedAt;
 if(!validPgId(id)||!validPgId(cycle)||!ALLOWED_SOURCES.has(source)||!isValidTime(at))throw Error('CATALOG_INVALID_DB_PROJECTION');
 const model=r.modelId==null?null:String(r.modelId),brandId=r.brandId==null?null:String(r.brandId),seriesId=r.seriesId==null?null:String(r.seriesId);
 if([model,brandId,seriesId].some(v=>v!==null&&!validPgId(v)))throw Error('CATALOG_INVALID_MASTER_ID');
 const brandName=safeName(r.brandName,'BRAND'),seriesName=safeName(r.seriesName,'SERIES'),modelName=safeName(r.modelName,'MODEL');
 const modelYear=r.modelYear==null?null:r.modelYear;
 if(modelYear!==null&&!validModelYear(modelYear))throw Error('CATALOG_INVALID_MODEL_YEAR');
 if((model===null&&(brandId!==null||seriesId!==null||brandName!==null||seriesName!==null||modelName!==null||modelYear!==null))
 ||(brandId===null&&brandName!==null)||(seriesId===null&&seriesName!==null))throw Error('CATALOG_INCONSISTENT_MASTER');
 return Object.freeze({vehicleId:id,listingCycleId:cycle,source,listingStartedAt:at.slice(0,10),
 modelId:model,brandId,seriesId,brandName,seriesName,modelName,modelYear,coverImagePath:safeCoverPath(r.coverImagePath),
 price:null,priceState:'PRICE_ENTITLEMENT_DEPENDENCY_BLOCKED',catalogState:'ISOLATED_TEST_PROJECTION_NOT_PRODUCTION'});
}
export function createCatalogService({pool,cursorKey}={}){
 if(!pool||typeof pool.query!=='function'||!Buffer.isBuffer(cursorKey)||cursorKey.length<32)throw Error('CATALOG_DEPENDENCIES_REQUIRED');
 return {
  async stats(){
   const rows=(await pool.query(SQL_CATALOG_STATS,[])).rows;
   if(!Array.isArray(rows)||rows.length>3)throw Error('CATALOG_COUNT_PROJECTION_INVALID');
   const bySource={wholesale:0,mingbang:0,four_s:0};
   const seen=new Set();
   for(const row of rows){
    const source=row?.source,value=row?.vehicleCount;
    if(!ALLOWED_SOURCES.has(source)||seen.has(source)||typeof value!=='string'||!/^(0|[1-9][0-9]*)$/.test(value)||BigInt(value)>BigInt(Number.MAX_SAFE_INTEGER))throw Error('CATALOG_COUNT_PROJECTION_INVALID');
    seen.add(source);bySource[source]=Number(value);
   }
   const total=Object.values(bySource).reduce((a,b)=>a+b,0);
   if(!Number.isSafeInteger(total))throw Error('CATALOG_COUNT_PROJECTION_INVALID');
   return {status:200,body:{region:'national',total,bySource,todayNewCount:null,todayNewState:'FIRST_SEEN_DEPENDENCY_BLOCKED',productionReady:false}};
  },
  async list(params){
   if(!params||typeof params!=='object')return reject('INVALID_QUERY');
   const keys=Object.keys(params),allowed=['source','sort','cursor','pageSize','region','modelId','brandId','seriesId','modelYear'];
   if(keys.some(k=>!allowed.includes(k)))return reject('UNSUPPORTED_FILTER');
   if(params.region!==undefined&&params.region!=='national')return reject('UNSUPPORTED_REGION');
   if(params.pageSize!==undefined&&params.pageSize!=='15')return reject('INVALID_PAGE_SIZE');
   const source=params.source??'wholesale',sort=params.sort??'newest';
   if(!ALLOWED_SOURCES.has(source)||!ALLOWED_SORTS.has(sort))return reject('INVALID_CATALOG_FILTER');
   const modelId=params.modelId??null,brandId=params.brandId??null,seriesId=params.seriesId??null;
   if(modelId!==null&&!validPgId(modelId))return reject('INVALID_MODEL_ID');
   if(brandId!==null&&!validPgId(brandId))return reject('INVALID_BRAND_ID');
   if(seriesId!==null&&!validPgId(seriesId))return reject('INVALID_SERIES_ID');
   const modelYear=params.modelYear===undefined?null:Number(params.modelYear);
   if(params.modelYear!==undefined&&(!/^\d{4}$/.test(params.modelYear)||!validModelYear(modelYear)))return reject('INVALID_MODEL_YEAR');
   let cur;try{cur=params.cursor?decodeCursor(params.cursor,cursorKey,source,sort,modelId,brandId,seriesId,modelYear):null}catch{return reject('INVALID_CURSOR')}
   const cfg=SORT_CONFIG[sort]??null;
   const sql=sort==='newest'?SQL_CATALOG_LIST:SQL_CATALOG_SORTS[sort];
   const queryParams=sort==='newest'
    ?[source,cur?.at??null,cur?.id??null,modelId,brandId,seriesId,modelYear]
    :[source,modelId,brandId,seriesId,modelYear,cur?.n??null,cur?.k??null,cur?.at??null,cur?.id??null];
   const rows=(await pool.query(sql,queryParams)).rows;
   if(!Array.isArray(rows))throw Error('CATALOG_DB_ROWS_INVALID');
   const page=rows.slice(0,15).map(safeItem);
   let nextCursor=null;
   if(rows.length>15&&page.length){
    const last=rows[14],at=last.listingStartedAt instanceof Date?last.listingStartedAt.toISOString():last.listingStartedAt;
    const sortValue=cfg?(last[cfg.field]??null):null;
    nextCursor=encodeCursor({at,id:last.listingCycleId,source,sort,modelId,brandId,seriesId,modelYear,sortValue},cursorKey);
   }
   return {status:200,body:{items:page,nextCursor,pageSize:15,source,sort,region:'national',modelId,brandId,seriesId,modelYear,productionReady:false}};
  },
  async detail(id){
   if(!validPgId(String(id)))return reject('INVALID_VEHICLE_ID');
   const rows=(await pool.query(SQL_CATALOG_DETAIL,[id])).rows;
   if(!Array.isArray(rows))throw Error('CATALOG_DB_ROWS_INVALID');
   if(rows.length>1)throw Error('CATALOG_MULTIPLE_CURRENT_VISIBLE_CYCLES');
   if(!rows.length)return reject('VEHICLE_NOT_VISIBLE',404);
   return {status:200,body:{vehicle:safeItem(rows[0]),productionReady:false}};
  }
 };
}
