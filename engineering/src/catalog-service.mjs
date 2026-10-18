// F05 isolated real SQL read model. A positive row requires physical PostgreSQL
// Vehicle/Cycle AND a separate disposable test visibility proof. NOT production.
import {createHmac, timingSafeEqual} from 'node:crypto';
const ALLOWED_SOURCES=new Set(['wholesale','mingbang','four_s']);
const ALLOWED_SORTS=new Set(['newest','oldest']);
const DATE=/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,6})?(?:Z|[+-]\d\d:\d\d)$/;
const POS=/^[1-9]\d{0,18}$/;
const PG_BIGINT_MAX=9223372036854775807n;
const validPgId=v=>typeof v==='string'&&POS.test(v)&&BigInt(v)<=PG_BIGINT_MAX;
const reject=(code,status=400)=>Object.freeze({status,body:{code}});
const isValidTime=t=>typeof t==='string'&&DATE.test(t)&&Number.isFinite(Date.parse(t));
const safetoken=o=>Buffer.from(JSON.stringify(o)).toString('base64url');
function mac(text,key){return createHmac('sha256',key).update(text).digest('base64url')}
export function encodeCursor({at,id,source,sort},key){
 if(!isValidTime(at)||!validPgId(String(id))||!ALLOWED_SOURCES.has(source)||!ALLOWED_SORTS.has(sort)||!Buffer.isBuffer(key)||key.length<32)throw Error('CATALOG_CURSOR_INPUT');
 const content=safetoken({v:1,at,id:String(id),source,sort});return `${content}.${mac(content,key)}`;
}
export function decodeCursor(value,key,source,sort){
 if(typeof value!=='string'||value.length>320||!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value))throw Error('BAD_CURSOR');
 const [str,signature]=value.split('.'),expected=mac(str,key);
 const a=Buffer.from(expected),b=Buffer.from(signature);
 if(a.length!==b.length||!timingSafeEqual(a,b))throw Error('BAD_CURSOR');
 let p;try{p=JSON.parse(Buffer.from(str,'base64url').toString('utf8'))}catch{throw Error('BAD_CURSOR')}
 if(!p||Object.keys(p).sort().join(',')!=='at,id,sort,source,v'||p.v!==1||p.source!==source||p.sort!==sort||!validPgId(p.id)||!isValidTime(p.at))throw Error('BAD_CURSOR');
 return p;
}
// Preserve PostgreSQL microseconds in the signed keyset: JS Date rounds to milliseconds.
// The lexicographic cursor must carry the same precision as the SQL ORDER BY tuple.
const SQL_UTC_MICROSECONDS="to_char(cy.started_at AT TIME ZONE 'UTC', 'YYYY-MM-DD\"T\"HH24:MI:SS.US\"Z\"')";
const BASE_SELECT=`SELECT v.vehicle_id AS "vehicleId",cy.listing_cycle_id AS "listingCycleId",v.source_type AS "source",${SQL_UTC_MICROSECONDS} AS "listingStartedAt",v.model_id AS "modelId" FROM public.vehicles v JOIN public.vehicle_listing_cycles cy ON cy.vehicle_id=v.vehicle_id JOIN public.f05_real_catalog_visibility_test p ON p.vehicle_id=v.vehicle_id AND p.listing_cycle_id=cy.listing_cycle_id AND p.source_type=v.source_type WHERE cy.ended_at IS NULL AND NOT EXISTS(SELECT 1 FROM public.vehicle_listing_cycles other WHERE other.vehicle_id=v.vehicle_id AND other.listing_cycle_id<>cy.listing_cycle_id AND other.ended_at IS NULL) AND v.archived_at IS NULL AND v.platform_visibility='visible' AND ((v.source_type='wholesale' AND v.source_sale_status='active') OR (v.source_type IN('mingbang','four_s') AND v.source_sale_status='available')) AND p.allow_anonymous=true AND p.verified_isolation='DISPOSABLE_TEST_PROOF_NOT_SIGNED' AND p.expires_at>statement_timestamp() AND NOT EXISTS(SELECT 1 FROM public.f05_real_catalog_protections_test pr WHERE pr.vehicle_id=v.vehicle_id AND pr.listing_cycle_id=cy.listing_cycle_id AND pr.ended_at IS NULL)`;
export const SQL_CATALOG_LIST=BASE_SELECT+` AND v.source_type=$1 AND ($2::timestamptz IS NULL OR (cy.started_at,cy.listing_cycle_id) < ($2::timestamptz,$3::bigint)) ORDER BY cy.started_at DESC,cy.listing_cycle_id DESC LIMIT 16`;
export const SQL_CATALOG_LIST_OLD=BASE_SELECT+` AND v.source_type=$1 AND ($2::timestamptz IS NULL OR (cy.started_at,cy.listing_cycle_id) > ($2::timestamptz,$3::bigint)) ORDER BY cy.started_at ASC,cy.listing_cycle_id ASC LIMIT 16`;
export const SQL_CATALOG_DETAIL=BASE_SELECT+` AND v.vehicle_id=$1 LIMIT 2`;
function safeItem(r){
 // Explicit property whitelist: SQL rows cannot put VIN / phone / internal prices into responses.
 const id=String(r?.vehicleId??''),cycle=String(r?.listingCycleId??'');
 const source=r?.source;
 let at=r?.listingStartedAt instanceof Date?r.listingStartedAt.toISOString():r?.listingStartedAt;
 if(!validPgId(id)||!validPgId(cycle)||!ALLOWED_SOURCES.has(source)||!isValidTime(at))throw Error('CATALOG_INVALID_DB_PROJECTION');
 let model=r.modelId==null?null:String(r.modelId);
 if(model!==null&&!validPgId(model))throw Error('CATALOG_INVALID_MODEL');
 return Object.freeze({vehicleId:id,listingCycleId:cycle,source,listingStartedAt:at.slice(0,10),modelId:model,price:null,priceState:'PRICE_ENTITLEMENT_DEPENDENCY_BLOCKED',catalogState:'ISOLATED_TEST_PROJECTION_NOT_PRODUCTION'});
}
export function createCatalogService({pool,cursorKey}={}){
 if(!pool||typeof pool.query!=='function'||!Buffer.isBuffer(cursorKey)||cursorKey.length<32)throw Error('CATALOG_DEPENDENCIES_REQUIRED');
 return {
  async list(params){
   if(!params||typeof params!=='object')return reject('INVALID_QUERY');
   const keys=Object.keys(params),allowed=['source','sort','cursor','pageSize','region'];
   if(keys.some(k=>!allowed.includes(k)))return reject('UNSUPPORTED_FILTER');
   if(params.region!==undefined&&params.region!=='national')return reject('UNSUPPORTED_REGION');
   if(params.pageSize!==undefined&&params.pageSize!=='15')return reject('INVALID_PAGE_SIZE');
   const source=params.source??'wholesale',sort=params.sort??'newest';
   if(!ALLOWED_SOURCES.has(source)||!ALLOWED_SORTS.has(sort))return reject('INVALID_CATALOG_FILTER');
   let cur;try{cur=params.cursor?decodeCursor(params.cursor,cursorKey,source,sort):null}catch{return reject('INVALID_CURSOR')}
   const sql=sort==='newest'?SQL_CATALOG_LIST:SQL_CATALOG_LIST_OLD;
   const rows=(await pool.query(sql,[source,cur?.at??null,cur?.id??null])).rows;
   if(!Array.isArray(rows))throw Error('CATALOG_DB_ROWS_INVALID');
   const page=rows.slice(0,15).map(safeItem);
   let nextCursor=null;
   if(rows.length>15&&page.length){let last=rows[14],at=last.listingStartedAt instanceof Date?last.listingStartedAt.toISOString():last.listingStartedAt;nextCursor=encodeCursor({at,id:last.listingCycleId,source,sort},cursorKey)}
   return {status:200,body:{items:page,nextCursor,pageSize:15,source,sort,region:'national',productionReady:false}};
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
